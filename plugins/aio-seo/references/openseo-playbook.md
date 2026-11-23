# OpenSEO playbook

How every `aio-seo` skill uses the OpenSEO MCP server: which calls, with which parameters, at what cost, and the traps found in live runs. If OpenSEO is not connected, use `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md` instead and point the user to `/aio-seo:setup`.

## 1. Basics

- Tool names here are bare (`get_search_console_performance`). The prefix differs by client (`mcp__OpenSEO__...`, `mcp__openseo__...`, or a server id); use whatever is loaded. If the tools are deferred, load them with tool search first (for example `select:` the exact names you need, in one call).
- Every project-scoped call needs `projectId` = config `data.openseo_project_id`.
- The OpenSEO connection does not automatically carry over between clients (claude.ai, Claude Code, a scheduled cloud agent). Each one needs its own connection, made once interactively. Connection steps are in `/aio-seo:setup`.
- Load a tool's schema before the first call in a run. Parameters change; do not guess them.
- Save each raw result before interpreting it: `.agents/aio-seo/<module>/data/YYYY-MM-DD/<label>.md` (or `.json` if the client exposes structured output). Blog uses `.agents/aio-seo/blog/data/`; other skills use their own module folder. If a result is too large to save in full, save the rows you used and note the truncation.

## 2. Project matching (every skill, preflight)

```
whoami()                 # confirms the connection and account
list_projects()          # find the project
```

1. Find the project whose id equals `data.openseo_project_id`.
2. Check its domain matches `project.site_url` (compare hostnames without `www.` and protocol).
3. No id in config: pick the project whose domain matches; if none or several match, stop and ask (interactive) or stop and log (scheduled). Never guess between two projects.
4. Optional, free: `get_project_context(projectId)` for the business overview and competitors already stored in OpenSEO. Use it to seed `competitors.md` (source: "OpenSEO project context").
5. If the project has no Search Console or GA4 connection, say so. GSC-led skills fall back per `data-fallbacks.md`.

## 3. Cost tiers

| Tier | Tools | Rule |
|---|---|---|
| Free | `whoami`, `list_projects`, `get_project_context`, `get_search_console_performance`, `get_search_opportunities`, `inspect_urls`, all `get_google_analytics_*`, `get_rank_tracker`, `get_ai_visibility_tracker`, `get_ai_visibility_results`, `get_ai_visibility_trend`, `get_ai_visibility_sources`, `list_site_audits`, all `get_audit_*` | Use freely, but page sensibly (section 5) |
| Paid | `get_serp_results`, `get_keyword_metrics`, `research_keywords`, `get_ranked_keywords`, `find_serp_competitors`, `get_domain_overview`, `get_domain_keyword_suggestions`, `get_backlinks_*`, `research_ai_visibility_prompts`, `run_site_audit` | Shortlists only. Stay within `data.credit_budget_per_run` and `data.credit_budget_per_month`. Call the matching `estimate_*` tool first where one exists. Ask the user before any planned batch over 2,000 credits |
| Approval required | `run_ai_visibility_check`, `set_ai_visibility_schedule`, `run_rank_tracker`, `update_project_context`, `submit_indexnow_urls`, `add_rank_tracking_keywords`, `create_rank_tracker`, `save_*`, anything that deletes or removes | Only in an interactive run, after the user approves that specific call and its cost estimate. Never in a scheduled run unless config explicitly allows it |

Cost figures change. Read each paid tool's description at load time and log what it says. Examples at the time of writing, from the tool descriptions: `get_serp_results` about 5 credits per keyword at depth 20, and a repeat call with the same keyword and settings within 12 hours is free; `get_domain_overview` and `get_domain_keyword_suggestions` about 100 to 300 credits each. [UNVERIFIED for your account: check the live descriptions]

## 4. Credit accounting

- Before a paid call, estimate its cost (`estimate_*` tool, or the description) and check: spent this run + estimate <= `data.credit_budget_per_run`, and spent this month (sum the run logs in `.agents/aio-seo/runs/` for the current month) + estimate <= `data.credit_budget_per_month`.
- If it would exceed either budget: skip it, use free data, and log "skipped <tool>: budget".
- Log every paid call in the run log: tool, inputs (short), credits reported, or "cost not reported".
- Close each run log with `Credits: <n> this run, <m> this month of <budget>`.
- `get_keyword_metrics`: leave `includeClickstreamData` off unless needed; it raises the cost.

## 5. Search Console: the pagination lesson

Learned in a live run and built into every GSC pull:

- The tool returns text tables; very large results get truncated (around 40,000 characters). An unfiltered 1,000-row query x page pull overflows and is cut off. Pull filtered, then drill down.
- **Filters only see 1,000 rows at a time.** `minPosition`, `maxPosition` and `minImpressions` are applied to one 1,000-row window, and Google sorts by clicks. On a site where most queries have 0 clicks, the high-impression, zero-click queries (the best targets) are spread across every window. **Page with `startRow` (0, 1000, 2000, ...) until the response stops saying more rows are available.** On one live site the first window held 27 of the 218 qualifying queries; the biggest single opportunity was in a later window.
- `ctr` can come back as a fraction (structured) or a percentage (table). Store percentages in Markdown state files.
- The last ~3 days of GSC data can be incomplete; the `last_*` ranges already end about 3 days back. Record the start and end dates the tool reports.
- Strip `#fragment` from page URLs before aggregating; jump links are reported as separate URLs.
- The page URL in a filter must match what Google indexes (protocol, `www`, trailing slash). Zero rows: retry once with `operator: "contains"` and the slug. Still zero: `inspect_urls` on it and log the verdict.

## 6. Calls by skill

### blog and maintain: demand pull

1. Candidate queries (paged):
```
get_search_console_performance(projectId, dateRange: <blog.gsc_range>,
  dimensions: ["query"], minPosition: 5, maxPosition: 70,
  minImpressions: <blog.min_impressions_striking>, rowLimit: 1000, startRow: 0, 1000, 2000...)
```
2. Positions 1 to 7 (CTR rewrite candidates), paged the same way:
```
get_search_console_performance(projectId, dateRange: <blog.gsc_range>,
  dimensions: ["query"], maxPosition: 7, minImpressions: <blog.min_impressions_striking>, rowLimit: 1000, startRow: ...)
```
3. Pages:
```
get_search_console_performance(projectId, dateRange: <blog.gsc_range>, dimensions: ["page"], rowLimit: 250)
```
4. Cluster drill-down (which of our pages earn a cluster's impressions):
```
get_search_console_performance(projectId, dateRange: <blog.gsc_range>, dimensions: ["page"],
  filters: [{dimension: "query", operator: "contains", expression: "<cluster head term>"}], rowLimit: 50)
```
Add `dimensions: ["query", "page"]` with `minImpressions: 10` for per-query detail.
5. GA4-joined opportunities (fixed 28-day window, page level): `get_search_opportunities(projectId, limit: 50)`.
6. GA4 engagement, dates today minus `blog.ga4_lookback_days` to yesterday:
```
get_google_analytics_page_performance(projectId, channel: "organic_search", startDate, endDate, limit: 200)
get_google_analytics_key_events(projectId, breakdown: "event_and_landing_page", channel: "all", startDate, endDate)
```
`userEngagementDuration` is the total seconds across users. Average engagement = `userEngagementDuration / activeUsers`. If no key event ties to blog pages, record "conversions from posts not measurable".
7. Rank tracker, if `data.rank_tracker_id` is set: `get_rank_tracker(projectId, trackerId, limit: 200)`. A null position means "not found in the results checked".

### blog and maintain: measuring one page

```
get_search_console_performance(projectId, dateRange: "last_28_days", dimensions: ["query"],
  filters: [{dimension: "page", operator: "equals", expression: "<URL>"}], rowLimit: 50)
```
Indexing verdicts: `inspect_urls` (up to 10 URLs per call, free). The Search Console API cannot request indexing; hand unindexed URLs to `/aio-seo:indexing`.

### blog: shortlist and SERP research (paid)

```
get_keyword_metrics(projectId, keywords: [<top 30 shortlist>], includeMonthlyTrends: true)
get_serp_results(projectId, queries: [{keyword: <target>}, {keyword: <variant>}], depth: 20)
```
Use `organicRank` (not `rank`) when recording positions. For some markets KD and intent come back null; note it and infer intent from SERP shape.

Competitor refresh, only every `blog.competitor_research_every_n_runs` runs or in research-led mode:
```
get_ranked_keywords(projectId, target: <competitor domain>, maxRank: 20, limit: 100, excludeBrandTerms: [<their brand>])
```

Research-led mode (thin GSC data):
```
research_keywords(projectId, ...)   # seed with offer[].keywords; load the schema first
get_ranked_keywords(projectId, target: <top competitor>, maxRank: 10, minSearchVolume: 50, limit: 100)
```

### audit

`list_site_audits`, `get_audit_status`, `get_audit_issues`, `get_audit_pages`, `get_audit_lighthouse` are free reads of existing audits. `run_site_audit` is paid: estimate first, check budget, and in a scheduled run only if config `data.scheduled_paid.site_audit` is true.

### ai-visibility

- Free reads: `get_ai_visibility_tracker`, `get_ai_visibility_results`, `get_ai_visibility_trend`, `get_ai_visibility_sources`, `get_ai_visibility_answer`.
- Paid: `research_ai_visibility_prompts`. Per its description at the time of writing the data is US English only; weigh that for UK sites. [UNVERIFIED for your account: check the description]
- Approval required: `run_ai_visibility_check`, `set_ai_visibility_schedule`, `estimate_ai_visibility_cost` first.
- Blog and pages may read results for prompts related to their topic, to see which sources AI answers cite. Do not start checks from those skills.

### offsite and report

- `get_backlinks_overview` / `get_backlinks_profile` are paid; once per month at most unless the user asks.
- Reports use free reads only unless the user asks for more.

### indexing

- `inspect_urls` (free) for verdicts.
- `submit_indexnow_urls` needs approval; the plugin's own `scripts/indexnow.mjs` is the default route (see `/aio-seo:indexing`).

## 7. Failure handling

| Situation | Action |
|---|---|
| OpenSEO tools not loaded | Try tool search once. Still missing: follow `data-fallbacks.md`, tell the user to run `/aio-seo:setup` |
| Project not found or domain mismatch | Stop GSC-led work; ask (interactive) or log and stop (scheduled) |
| GSC call fails | Retry once after a short wait. Fails twice: stop the GSC-dependent steps, write only the run log |
| GA4 call fails | Continue on GSC alone; log it |
| Paid call would exceed budget | Skip; use free data; log what was skipped |
| Lost response on a paid SERP call | Retry the same call with the same parameters (repeat within 12 hours is free per the tool description) |
