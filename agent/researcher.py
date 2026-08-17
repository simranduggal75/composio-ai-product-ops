import json
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from schemas import AppResearchResult
from web_research import research_sources, fetch_page


load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

if not API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY is not set in .env")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY,
)


SYSTEM_PROMPT = """
You are an AI Product Operations research agent.

You are researching software applications to determine whether
they can be built into an AI agent toolkit.

IMPORTANT:
You are given research evidence collected from web search.
You MUST base your answers on that evidence.

Do not claim that you personally browsed the web.
Do not invent facts or URLs.
Do not invent evidence.

Prefer official documentation.

For each application determine:

- category
- one-line description
- authentication methods
- credential access / self-serve vs gated
- API type and breadth
- MCP availability
- buildability
- main blocker
- whether a Composio toolkit exists
- confidence

For every major factual claim, include an evidence object containing:
- claim
- url
- source_type

source_type should normally be:
- official_docs
- official_blog
- official_github
- composio_docs
- third_party

IMPORTANT DISTINCTIONS:

1. A free developer account is not necessarily the same as
   production credential access.

2. A free trial is not necessarily self-serve free.

3. An official MCP server is different from a community MCP server.

4. An API existing does not automatically mean the integration
   is easy to build.

5. If evidence is insufficient, use "unknown" rather than guessing.

Return ONLY JSON matching the supplied schema.
"""


def build_evidence_bundle(app: dict, sources: list[dict]) -> str:
    """
    Fetch the best sources when possible and combine them with
    search-result snippets.
    """

    evidence = []

    # Keep the bundle small enough for the model.
    for source in sources[:8]:

        item = {
            "title": source["title"],
            "url": source["url"],
            "snippet": source.get("snippet", ""),
        }

        try:
            page_text = fetch_page(source["url"])

            if page_text:
                item["page_content"] = page_text[:8000]
                item["retrieval_status"] = "fetched"
            else:
                item["retrieval_status"] = "search_snippet_only"

        except Exception as exc:
            item["retrieval_status"] = "search_snippet_only"
            item["fetch_error"] = str(exc)

        evidence.append(item)

    return json.dumps(
        evidence,
        indent=2,
        ensure_ascii=False,
    )


def research_app(app: dict) -> AppResearchResult:

    print(f"Searching sources for: {app['name']}")

    sources = research_sources(
        app["name"],
        app["hint"],
    )

    print(f"Found {len(sources)} sources")

    evidence_bundle = build_evidence_bundle(
        app,
        sources,
    )

    prompt = f"""
Research this application using ONLY the evidence below.

APPLICATION:

Name: {app["name"]}
Category: {app["category"]}
Documentation hint: {app["hint"]}

EVIDENCE:

{evidence_bundle}

Now produce the complete AppResearchResult.

The "id" must be:
{app["id"]}

The "app" field must be:
{app["name"]}

For evidence URLs, use the exact URLs from the supplied evidence.

If something cannot be established from the evidence,
use "unknown" rather than guessing.

Return ONLY valid JSON.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b:free",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        response_format={
            "type": "json_object",
        },
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError(
            "OpenRouter returned an empty response"
        )

    # Some free models wrap JSON in Markdown fences.
    content = content.strip()

    if content.startswith("```"):
        lines = content.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        content = "\n".join(lines).strip()

    result_data = json.loads(content)
 
    print("\n--- MODEL RESULT ---")
    print(json.dumps(result_data, indent=2))
    print("--- END MODEL RESULT ---\n")
    return AppResearchResult.model_validate(
        result_data
    )


def main():

    project_root = Path(__file__).parent.parent

    apps_path = (
        project_root
        / "data"
        / "apps.json"
    )

    output_path = (
        project_root
        / "data"
        / "research_test.json"
    )

    with open(
        apps_path,
        "r",
        encoding="utf-8",
    ) as f:
        apps = json.load(f)

    # IMPORTANT:
    # Test ONE app before scaling.
    app = apps[0]

    result = research_app(app)

    with open(
        output_path,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            result.model_dump(),
            f,
            indent=2,
            ensure_ascii=False,
        )

    print()
    print("=" * 60)
    print("RESEARCH COMPLETE")
    print("=" * 60)
    print(f"App: {result.app}")
    print(f"Confidence: {result.confidence}")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()