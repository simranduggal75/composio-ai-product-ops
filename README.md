# Composio AI Product Ops — Take-Home

**Live case study:** https://simranduggal75.github.io/composio-ai-product-ops/

One page, self-explanatory: headline patterns up top, a filterable/sortable matrix of all 100 apps, how the research agent works, and an honest verification section (what was checked by hand, what it caught, before/after accuracy).

## What's in this repo

```
data/apps.json          100 apps, fully researched — category, auth, self-serve/gated,
                         API surface, MCP status, buildability verdict, evidence URL, confidence
analysis/patterns.json  Computed clustering: auth distribution, self-serve vs gated by
                         category, blocker themes, headline stats — generated from apps.json,
                         not hand-written, so the page can't drift from the data
analysis/verification.json  The hand-verification sample: 8 apps independently re-checked
                             against primary docs, 2 real errors found and corrected, logged
                             with before/after accuracy
site/index.html         The published case study (generated — see below)
scripts/build_site.js   Regenerates site/index.html from the three files above
agent/                  Python research pipeline (OpenRouter + pydantic schemas + web search)
```

## How the research actually got done

Two things are true and both are documented on the case-study page's "The Agent" section:

1. **`agent/`** is a real, evidence-first research pipeline: `web_research.py` collects search
   evidence for an app, `researcher.py` sends that evidence (never the model's own guesses) to
   an LLM via OpenRouter constrained to `schemas.py`'s structured output, and `pilot.py` runs it
   end-to-end. This is the reusable, rerunnable version of the pipeline — point it at any app
   list and it produces the same structured JSON.

2. **The full 100-app dataset in `data/apps.json`** was produced under a tighter deadline by
   fanning the same research task out across 10 parallel agents (one per the assignment's own
   10 categories), each doing live web research against real vendor docs and writing structured
   JSON, then merged and independently spot-verified by hand. This is the same methodology as
   `agent/` — schema-first, evidence-required, no fabricated URLs — run via a different
   orchestration path to fit the time budget. Where the two disagreed on a re-check (Slack and
   Zendesk's MCP status, see `analysis/verification.json`), the dataset was corrected and the
   correction logged rather than silently overwritten.

Both approaches are the same idea: **never let the model answer from memory** — collect real
evidence first, then structure it, then verify it against a fresh, independent pass before
trusting it.

## Running the agent pipeline yourself

```bash
cd agent
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requiremtnts.txt
cp .env.example .env   # fill in OPENROUTER_API_KEY
python pilot.py
```

## Regenerating the case-study page after any data change

```bash
node scripts/build_site.js
```

Rebuilds `site/index.html` straight from `data/apps.json` + `analysis/*.json` — the table, bar
charts, and headline stats are all computed at build time, so a correction to the dataset shows
up on the page automatically on the next build.

## Honesty notes

- `analysis/verification.json` documents the real first-pass vs. corrected accuracy on an 8-app
  hand-checked sample (75% → 100%), not a synthetic number.
- Several apps in `data/apps.json` are marked `blocked` or `partial` with low/medium confidence
  where the app genuinely defeated clean verification in the time available (e.g. Paygent
  Connect, Waterfall.io, fanbasis, Sherlock) — see each entry's `notes` field for exactly what
  was and wasn't confirmed.
- Composio's own SDK/MCP wasn't used to *call* these apps (this is a research task, not an
  integration task) — instead, each app was cross-checked against Composio's public toolkit
  listing as a second buildability signal (`composio_existing_toolkit` field). See the case
  study's "Where Composio's own SDK/MCP fits" note for the reasoning.
