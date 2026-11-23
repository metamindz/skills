# Blog state files

All under `.agents/aio-seo/blog/` in the user's repo. Templates for every file are in `${CLAUDE_PLUGIN_ROOT}/templates/state/blog/`. Create missing files from those templates; never overwrite a file that exists.

## Rules for every file

- Dates in ISO (`YYYY-MM-DD`) in tables; prose follows `project.language`.
- Every number has a source: the snapshot it came from (`data/YYYY-MM-DD/<file>`), an export, or a URL.
- Append history; never rewrite it. Exceptions: `state.md` (rewritten each run) and the "Live GSC keywords" table in `keywords.md` (replaced each run; the previous version is in the data snapshot).
- Keep each file readable by a person in under two minutes. Roll older detail into summaries as each template says.
- Never delete another run's history or a human's edits.

## Files

| File | Template | Holds | Read | Write |
|---|---|---|---|---|
| `state.md` | `state.md` | Dashboard: last run, site conventions, candidate queue, open jobs, learnings, notes for next run | Step 0, first | Step 11, last |
| `search-performance.md` | `search-performance.md` | One section per data pull: classified queries, buckets, selection | Step 1 | Step 11 |
| `keywords.md` | `keywords.md` | Live GSC keywords, core offer keywords, researched keywords, AEO question phrasings | Step 1 | Step 11 |
| `link-inventory.md` | `link-inventory.md` | Everything a post can link to, with usage and clicks | Step 1, 7 | Step 7, 11 |
| `competitors.md` | `competitors.md` | Competitors per offer; who ranks for our targets | Step 1 | Step 6, 11 |
| `topic-ideas.md` | `topic-ideas.md` | Parked and unvalidated ideas with evidence | Step 1 | Step 11 |
| `blog-log.md` | `blog-log.md` | Every post: URL, primary query, type, baseline; consolidation notes | Step 1 | Step 11 |
| `post-performance.md` | `post-performance.md` | Ranking movement, callout clicks, social sessions per post | Step 2 | Step 2, 11 |
| `maintenance-queue.md` | `maintenance-queue.md` | Jobs for `/aio-seo:maintain` (and Pro `/aio-seo-pro:maintain-advanced`) with baselines; results after 4+ weeks | Step 1 | Step 5, 10, 11 |
| `data/YYYY-MM-DD/` | (folder) | Raw tool results and imports for this run | Step 2 (previous) | Step 3 |
| `research/YYYY-MM-DD-<slug>.md` | `research/_template.md` | SERP, sources and data points, community signal, outline | Step 6, 9 | Step 6, 7 |
| `research/community/` | (folder) | `last30days` briefs | Step 6 | Step 6 |
| `runs/YYYY-MM-DD.md` | `runs/_template.md` | Detailed run log | Step 0 (latest) | Throughout, closed at step 11 |
| `drafts/` | (folder) | Posts written in `draft-only` mode | Step 1 | Step 10 |
| `social/` | `social/_template.md` | LinkedIn and X drafts | Step 1 | Step 11b |

Also written outside the blog folder:

- `.agents/aio-seo/state.md`: the Blog section only (4 to 8 lines: last run, post, PR, jobs opened, needs from other skills).
- `.agents/aio-seo/runs/YYYY-MM-DD-blog.md`: a short summary pointing to the detailed `blog/runs/YYYY-MM-DD.md`, with "Assumptions made" and "Not verified".
- `.agents/aio-seo/indexing/log.md`: pending URLs (see `publishing.md` section 5).

## Retention

- `search-performance.md`: past ~25 sections, move the oldest to `search-performance-archive-YYYY.md` with a one-line pointer.
- `post-performance.md`: keep the last 8 check-history sections; summarise older ones into one line per post.
- `data/`: if the repo should not hold large files, keep the last 12 weeks and add older folders to `.gitignore` after summarising them in `search-performance.md`. Ask before changing `.gitignore` in an interactive run; in a scheduled run, propose it in the report.
- `runs/`: keep all; they are the audit trail.
