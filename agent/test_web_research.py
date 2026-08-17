from web_research import research_sources


results = research_sources(
    "Salesforce",
    "https://developer.salesforce.com/"
)

print(f"Found {len(results)} results\n")

for result in results:
    print("TITLE:", result["title"])
    print("URL:", result["url"])
    print("SNIPPET:", result["snippet"])
    print("-" * 80)