# Finding maintenance jobs

Pull the data once, save it to `.agents/aio-seo/blog/data/YYYY-MM-DD/`, then derive every job type from it. Calls and the pagination rule are in `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md`; without OpenSEO use `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md`. Classify and cluster queries with `${CLAUDE_PLUGIN_ROOT}/skills/blog/references/scoring.md` sections 1 and 2 (drop branded, job-seeker, irrelevant, operator and quiz queries before opening jobs).

Thresholds marked "house default" are starting points chosen for this plugin, not industry facts. Log them under "Assumptions made" the first time they decide a job.

## Data to pull

1. Queries, `blog.gsc_range`, positions 1 to 70, paged with `startRow` until no more rows.
2. Pages, `blog.gsc_range`, and the same for the previous period of equal length (for decay).
3. Query x page drill-downs for the top clusters (cannibalisation, baselines).
4. GA4 organic landing pages (engagement, key events) for the same window.
5. `inspect_urls` for pages with impressions but suspicious signals (see Fix indexing), up to 10 per call.
6. The repo: content files with their frontmatter dates and word counts; internal link graph (grep links across `project.content_dirs` and page components); redirect config; sitemap.

## Triggers per job type

### Fix indexing
- `inspect_urls` verdict not indexed, or "Duplicate, Google chose different canonical", or blocked by robots/noindex, for a page that should rank.
- Pages in the sitemap with zero impressions for the whole window and older than 4 weeks: inspect them.
- Job: find the cause in the repo (canonical, robots, noindex, sitemap, no internal links). Hand the resubmission to `/aio-seo:indexing`.

### Product fact check
- Commits since the last maintain run touched pricing, plans or feature definitions (`product-facts.md`), or `offer[].price_from` differs from what pages state.
- Also open one for any page with a dated price, plan or feature claim older than 6 months (house default).

### CTR rewrite
- Query at position 1 to 7 with CTR below the rewrite line (`blog.ctr_rewrite_below`, default 0.03) and impressions at or above `blog.min_impressions_striking`.
- Group by page: one job per page, listing its affected queries.
- Before opening, if budget allows, check the SERP: an AI Overview or other feature above the result can explain a low CTR. Record it in the job; it lowers the expected gain. Average position-1 CTR for informational queries was measured at 3.9% without an AI Overview and 1.6% with one (December 2025, desktop). [VERIFIED 2026-09] Source: https://ahrefs.com/blog/ai-overviews-reduce-clicks-update

### Striking distance
- Cluster at average position 8 to 25 with impressions at or above `blog.min_impressions_striking`, where one of our pages clearly owns it (no split).
- Prioritise by `impressions x offer_weight`.

### Internal links
- A page with impressions at position 8 to 25, or a page published in the last 8 weeks, that has fewer than 3 internal links pointing at it (from the link graph).

### Structured data
- Template missing Article/BlogPosting, BreadcrumbList, author or dates, or JSON-LD that does not match visible content. Record the job with type `structured data (for /aio-seo:schema)` and do not fix it here.

### Split clusters, decay and retirement
- Consolidation with redirects, decay and age refreshes, and retirements are Pro jobs (`/aio-seo-pro:maintain-advanced`).
- When two or more of our pages split one cluster, do not open striking-distance or CTR jobs for either page. Add one line to the run log under "Seen, not actioned" with both URLs and their impressions, clicks and positions, so a person (or Pro) can decide.
- Pages with clicks down 30% or more against the previous period, or 12+ months since the last substantive update: list them the same way, with the numbers.

## Opening a job

Use the queue template columns. Each job row has: ID (next free `M<n>`), opened date, page(s), job type, trigger with numbers and the snapshot path, baseline (or "taken when started"), priority. Never open a duplicate: one open job per page per type.
