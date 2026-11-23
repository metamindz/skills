# Maintenance queue - updated YYYY-MM-DD

Jobs for existing pages, opened by `/aio-seo:blog` and `/aio-seo:maintain`, worked by `/aio-seo:maintain` (or a human). With Pro, `/aio-seo-pro:maintain-advanced` adds consolidation, refresh and retirement jobs and fills the results. Any page on the site, not only posts.

## Open
| ID | Opened | Page(s) | Job | Trigger (numbers, range, snapshot) | Baseline | Needs sign-off | Priority |
|---|---|---|---|---|---|---|---|

- Job types: fix indexing / product fact check / consolidate + redirect / CTR rewrite / striking distance / refresh / retire or noindex / internal links / structured data (for /aio-seo:schema) / other (describe)
- Baseline: the page's top 5 queries with impressions, position and CTR, plus page clicks and impressions, recorded before any change (or "taken when started").
- Needs sign-off: yes for redirects of pages with traffic and for retirements.

## Done
| ID | Opened | Closed | Page(s) | Job | PR | Deployed | Result after 4+ weeks (before -> after, windows) |
|---|---|---|---|---|---|---|---|

Close a job only when the change is merged or live. Fill the result only from measured numbers.
