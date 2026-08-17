from ddgs import DDGS
import requests
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0 Safari/537.36"
    )
}


def search_web(query: str, max_results: int = 5):
    """Search the web using DDGS metasearch."""

    results = DDGS().text(
        query,
        region="in-en",
        max_results=max_results,
        backend="auto",
    )

    return [
        {
            "title": item.get("title", ""),
            "url": item.get("href", ""),
            "snippet": item.get("body", ""),
        }
        for item in results
        if item.get("href")
    ]


def source_score(result: dict) -> int:
    """Prioritize likely official documentation."""

    url = result["url"].lower()

    score = 0

    if "developer" in url:
        score += 5

    if "developers." in url:
        score += 4

    if "docs." in url:
        score += 4

    if "/docs/" in url:
        score += 3

    if "github.com" in url:
        score += 1

    for domain in [
        "medium.com",
        "reddit.com",
        "quora.com",
    ]:
        if domain in url:
            score -= 3

    return score


def research_sources(app_name: str, hint: str):
    """Run targeted searches for an application."""

    queries = [
        f"{app_name} official API documentation",
        f"{app_name} official authentication OAuth API",
        f"{app_name} official developer credentials API",
        f"{app_name} MCP official",
        f"{app_name} Composio toolkit",
    ]

    all_results = []

    for query in queries:
        print(f"Searching: {query}")

        try:
            results = search_web(
                query,
                max_results=5,
            )

            all_results.extend(results)

        except Exception as exc:
            print(f"Search failed: {exc}")

    # Deduplicate.
    unique = {}

    for result in all_results:
        url = result["url"]

        if url and url not in unique:
            unique[url] = result

    results = list(unique.values())

    # Official sources first.
    results.sort(
        key=source_score,
        reverse=True,
    )

    return results


def fetch_page(url: str, max_chars: int = 12000):
    """Fetch a page. Return None when the site blocks retrieval."""

    try:
        response = requests.get(
            url,
            headers=HEADERS,
            timeout=20,
        )

        if response.status_code == 403:
            return None

        response.raise_for_status()

        soup = BeautifulSoup(
            response.text,
            "html.parser",
        )

        for element in soup(
            ["script", "style", "noscript", "svg"]
        ):
            element.decompose()

        text = soup.get_text(
            "\n",
            strip=True,
        )

        lines = [
            line.strip()
            for line in text.splitlines()
            if line.strip()
        ]

        return "\n".join(lines)[:max_chars]

    except requests.RequestException:
        return None