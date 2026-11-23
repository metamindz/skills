# How to do each job

Before any job: record the baseline (URL, top 5 queries with impressions, position, CTR for the last 3 months, page clicks and impressions, snapshot path) and confirm the job is still valid. After any job: lint, fact check changed claims, move it to "Done", queue changed URLs for indexing.

All edits follow `${CLAUDE_PLUGIN_ROOT}/references/writing-standards.md`.

## Fix indexing

- Inspect the cause: `inspect_urls` verdict, the page's canonical tag, robots meta, `robots.txt`, sitemap inclusion, internal links pointing at it, redirect chains.
- Fix the cause in the repo (wrong canonical, stray `noindex`, missing from sitemap, orphaned page).
- Queue the URL for `/aio-seo:indexing`. The Search Console API cannot request indexing; that skill handles IndexNow and tells the user when a manual request in Search Console is needed.

## CTR rewrite (positions 1 to 7, low CTR)

- Rewrite the title tag and meta description to match the intent of the queries the page actually earns, with a specific promise (a number, a named outcome, the year if time-bound).
- **Keep title and H1 aligned.** Google uses the visible title and headings among its inputs for title links and replaces stale years from the visible title. [VERIFIED 2026-09] Source: https://developers.google.com/search/docs/appearance/title-link. If the title gets a year or number, the H1 gets the same; if the H1 is clearly wrong for the query, change both. Never change the slug.
- Aim for 50 to 60 characters; drop the brand from the title if the layout already appends it.
- Tighten the answer block too: Google builds most snippets from page content. [VERIFIED 2026-09] Source: https://developers.google.com/search/docs/appearance/snippet
- Measure later: CTR at a similar average position, 4+ weeks after deploy (Pro: `/aio-seo-pro:maintain-advanced measure`; by hand, compare the same 28-day windows in Search Console).

## Striking distance (positions 8 to 25)

- Rewrite the answer block for the cluster head query the page earns now (it may differ from the original target).
- Add H2/H3 sections for the cluster's member queries the page does not cover, phrased as those queries; add or refresh the FAQ from them.
- Add a comparison or summary table if the topic has options or numbers.
- Refresh statistics with current, dated, primary sources; remove claims you cannot re-verify.
- Add 2 to 3 contextual internal links to the page from related pages (descriptive anchors).
- Set `updated` (the change is substantive).

## Internal links

- Add one contextual sentence-level link (descriptive anchor, never "click here") to the target from 2 to 3 relevant pages, chosen from the query x page data (pages ranking for related queries) or the same offer.
- Do not rewrite those pages; edit one sentence each.
- Do not add UTMs to internal links.

## Product fact check

Follow `product-facts.md`.

## Structured data

Do not fix here. Record the job for `/aio-seo:schema` and mention it in the report.

## After the job

- Move the job to "Done" with the date and PR/branch, result "measure from deploy date".
- Queue each changed URL in `.agents/aio-seo/indexing/log.md` as pending.
