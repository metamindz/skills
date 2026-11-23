# Data fallbacks: running without OpenSEO

OpenSEO is the primary data provider (`${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md`). When it is not connected, or the project has no Search Console or GA4 link, use the first source below that works. Record the source used in every state file and run log ("source: GSC CSV export 2026-11-14", "source: Search Console MCP"), and tell the user to run `/aio-seo:setup` to connect a data source.

## The one rule

**Never invent a number.** If no first-party data exists, say so and label anything you derive as estimated, with how you derived it. A missing week costs less than a decision built on made-up data.

## Fallback order

1. **OpenSEO MCP** (preferred).
2. **Other MCP servers already loaded** in the session that expose Search Console, GA4 or Bing Webmaster Tools. Load them via tool search (search for "search console", "analytics", "bing webmaster"). Use only read tools. Map their outputs onto the same fields (query, page, clicks, impressions, CTR, position, date range) and note any differences (for example a tool that caps rows or rounds position).
3. **CSV exports from the user** (section below). In a scheduled run, use exports already in `.agents/aio-seo/data/imports/` if they are under 14 days old; otherwise skip the data-dependent steps and log it.
4. **Research-led mode** (section below): web search and public data only, everything labelled estimated.

## CSV exports to ask for

Ask once, in one message, with exact steps. Ask the user to save files under `.agents/aio-seo/data/imports/YYYY-MM-DD/`.

| Export | Where | What to export | Used by |
|---|---|---|---|
| Search Console, Queries | Search Console > Performance > Search results. Set date range to last 3 months, tick Clicks, Impressions, CTR, Position. Export > Download CSV (or Google Sheets, then CSV) | `Queries.csv` (the export is a zip with Queries, Pages, Countries, Devices, Dates) | blog, maintain, report |
| Search Console, Pages | Same export | `Pages.csv` | blog, maintain, audit |
| Search Console, one page | Performance, add a Page filter for the URL, export | Queries for that page | maintain (baselines), blog (post measurement) |
| GA4, landing pages | Reports > Engagement > Landing page (or Explore with Session default channel group = Organic Search). Last 90 days. Share > Download CSV | Sessions, engaged sessions, average engagement time, key events per landing page | blog, maintain, report |
| GA4, key events | Reports > Engagement > Events, mark which events are key events | Event name, count, landing page if available | blog (callout clicks), report |
| Bing Webmaster Tools | Search Performance > Export, and Site Explorer / URL Inspection as needed | Queries and pages with clicks, impressions, position | blog, maintain, report (Bing view, and Copilot traffic context) |
| Indexing | Search Console > Pages (indexing report) > export, plus URL Inspection results the user pastes | Not-indexed URLs with reason | indexing, audit, maintain |

Notes on exports:

- The Search Console UI export may be capped at around 1,000 rows per table [UNVERIFIED]. Count the rows: if a table has exactly or nearly 1,000, assume it is truncated and say so in the run log, because low-click, high-impression queries are then likely missing (the same blind spot as the OpenSEO pagination lesson). For larger sites ask for a Looker Studio or BigQuery export instead.
- Search Console exports have no URL-per-query join. Bucket and cluster from `Queries.csv`; use single-page exports or drill-down exports for cannibalisation checks, and label any query-to-page mapping you infer from titles as "inferred".
- Check the date range in the file name or header and record it.

## What each skill does without OpenSEO

| Skill | With MCP or CSV | Research-led only |
|---|---|---|
| `blog` | Full workflow from the exports. Skip paid keyword metrics; read intent from the SERP (web search) | Research-led mode (below); mark every post "research-led, no first-party demand" |
| `maintain` | Striking-distance and CTR jobs from Queries/Pages exports | Only internal links and fact checks against product facts. No performance jobs |
| `audit` | Indexing exports plus `check-site.mjs` | `check-site.mjs` and crawl only |
| `ai-visibility` | Not applicable (needs prompts run against engines). Manual mode: the user runs prompts and pastes answers; record them as manual | Same |
| `report` | From exports, clearly dated | Report only what the repo and state files show; no traffic numbers |
| `pages`, `schema`, `foundation`, `indexing`, `offsite` (and Pro skills) | Mostly repo work; use exports where they help prioritise | Proceed on repo evidence and public research |

## Research-led mode

For new sites, sites with no Search Console access, or fewer than `blog.min_high_value_queries` high-value queries.

1. Seeds: `offer[].keywords`, `entity.knows_about`, the site's own headings.
2. Demand signals without paid tools: web search results and their People Also Ask questions, autocomplete phrasings seen in search, competitor page titles (`competitors[]`), community questions (`last30days` if installed).
3. Label every derived value: `volume: unknown`, `demand: estimated (PAA present, 3 competitors target it)`. Never write a search volume you did not get from a tool or export.
4. Prefer long-tail, specific questions that a small site can answer best.
5. Log "research-led, no first-party demand" in the run log, the state files and the report. Return to data-led selection as soon as Search Console data exists.
