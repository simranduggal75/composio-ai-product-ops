import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from web_research import research_sources, fetch_page


load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

if not API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY is missing from .env")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY,
)

# Use models that were available in your OpenRouter free list.
MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "openai/gpt-oss-20b:free",
]


def load_apps():
    path = Path("data/apps.json")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_evidence(app):
    print(f"  Searching web...")

    sources = research_sources(
        app["name"],
        app.get("hint", ""),
    )

    print(f"  Found {len(sources)} sources")

    evidence = []

    for source in sources[:8]:

        item = {
            "title": source.get("title", ""),
            "url": source.get("url", ""),
            "snippet": source.get("snippet", ""),
        }

        try:
            page = fetch_page(source["url"])

            if page:
                item["page_content"] = page[:6000]
                item["retrieval"] = "fetched"
            else:
                item["retrieval"] = "search_snippet_only"

        except Exception:
            item["retrieval"] = "search_snippet_only"

        evidence.append(item)

    return evidence


def ask_model(app, evidence):

    prompt = f"""
You are researching an application for an AI Product Operations
research project.

Application:
{json.dumps(app, indent=2)}

Below is evidence collected from web searches and documentation.

EVIDENCE:
{json.dumps(evidence, indent=2)}

Using ONLY this evidence, classify the application.

Return ONLY valid JSON with exactly these fields:

{{
  "description": "one sentence describing the app",
  "authentication_methods": [],
  "credential_status": "self_serve_free | self_serve_trial | paid_required | admin_gated | partner_gated | unknown",
  "api_types": [],
  "api_breadth": "broad | moderate | narrow | none | unknown",
  "mcp_status": "official | community | none_found | unknown",
  "buildability": "easy_win | buildable_with_friction | blocked | unknown",
  "main_blocker": null,
  "composio_toolkit_exists": false,
  "confidence": "high | medium | low",
  "evidence": [
    {{
      "claim": "specific factual claim",
      "url": "exact URL from evidence",
      "source_type": "official_docs | official_blog | official_github | composio | third_party"
    }}
  ]
}}

Rules:

- Never invent URLs.
- Use URLs exactly as provided in the evidence.
- Prefer official documentation.
- If the evidence does not establish something, use "unknown".
- Do not confuse an API existing with easy integration.
- An official MCP server must be supported by official evidence.
- Do not claim Composio support unless the evidence supports it.
- Keep evidence claims specific and factual.
"""


    last_error = None

    for model in MODELS:

        print(f"  Trying model: {model}")

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a careful research analyst. "
                            "Return valid JSON only."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                response_format={
                    "type": "json_object"
                },
                temperature=0,
            )

            content = response.choices[0].message.content

            if not content:
                raise RuntimeError("Empty model response")

            content = content.strip()

            if content.startswith("```"):
                lines = content.splitlines()

                if lines and lines[0].startswith("```"):
                    lines = lines[1:]

                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]

                content = "\n".join(lines)

            result = json.loads(content)

            return result

        except Exception as exc:
            last_error = exc
            print(f"  Model failed: {exc}")
            time.sleep(3)

    raise RuntimeError(
        f"All models failed. Last error: {last_error}"
    )


def main():

    apps = load_apps()

    # PILOT: first 10 only.
    pilot_apps = apps[:10]

    output_path = Path(
        "data/pilot_results.json"
    )

    # Resume if the script is interrupted.
    if output_path.exists():

        with open(
            output_path,
            "r",
            encoding="utf-8",
        ) as f:
            results = json.load(f)

    else:
        results = []

    completed_ids = {
        item["id"]
        for item in results
    }

    print()
    print("=" * 70)
    print("COMPOSIO AI PRODUCT OPS — 10 APP PILOT")
    print("=" * 70)
    print()

    for index, app in enumerate(
        pilot_apps,
        start=1,
    ):

        if app["id"] in completed_ids:
            print(
                f"[{index}/10] {app['name']} — already completed"
            )
            continue

        print(
            f"[{index}/10] Researching: {app['name']}"
        )

        try:

            evidence = build_evidence(app)

            result = ask_model(
                app,
                evidence,
            )

            record = {
                "id": app["id"],
                "app": app["name"],
                "category": app["category"],
                "research_status": "complete",
                **result,
            }

            results.append(record)

            with open(
                output_path,
                "w",
                encoding="utf-8",
            ) as f:
                json.dump(
                    results,
                    f,
                    indent=2,
                    ensure_ascii=False,
                )

            print(
                f"  OK - Saved {app['name']}"
            )

        except Exception as exc:

            print(
                f"  FAILED: {exc}"
            )

            results.append({
                "id": app["id"],
                "app": app["name"],
                "category": app["category"],
                "research_status": "needs_verification",
                "error": str(exc),
            })

            with open(
                output_path,
                "w",
                encoding="utf-8",
            ) as f:
                json.dump(
                    results,
                    f,
                    indent=2,
                    ensure_ascii=False,
                )

    print()
    print("=" * 70)
    print(f"Pilot finished: {len(results)}/10")
    print(f"Output: {output_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()