from web_research import research_sources, fetch_page


results = research_sources(
    "Salesforce",
    "https://developer.salesforce.com/"
)

print(f"Found {len(results)} sources\n")

# Fetch the first 3 sources.
for result in results[:3]:

    print("=" * 80)
    print("TITLE:", result["title"])
    print("URL:", result["url"])

    try:
        content = fetch_page(result["url"])

        if content:
            print("CONTENT PREVIEW:")
            print(content[:1000])
        else:
            print("PAGE COULD NOT BE FETCHED")
            print("Using search-result evidence instead.")
    except Exception as exc:
        print("FETCH FAILED:", exc)