# Choosing pages from data, and checking cannibalisation

Read in steps 3 to 5 of every pages run. This free skill plans guides hubs, the FAQ hub and the glossary. Comparison, alternatives, use-case, keyword landing and programmatic pages are planned in the same file by Pro (`/aio-seo-pro:commercial-pages`); without Pro, a person can add such rows by hand and the cannibalisation check below still applies to them.

## Signals per page type

| Type | Query patterns to look for | Other inputs |
| --- | --- | --- |
| guides hub | many guides or posts in one topic; "how to ..." clusters | `blog/keywords.md`, `blog-log.md` |
| faq hub | question queries ("can I", "does", "how much", "what is the difference") across pages | Existing FAQ blocks, support and sales questions |
| glossary | "what is <term>", "<term> meaning", "<term> definition" | Terms used across our content without a definition page |

## Steps

1. **Search Console** (`get_search_console_performance`, last 3 months, dimensions query and page; free): collect queries matching the patterns above; note impressions, clicks, position and the page receiving each. Queries with impressions but position beyond 10, or landing on a mismatched page (a "what is" query landing on the home page), are the strongest candidates.
2. **Opportunities** (`get_search_opportunities`; free): add adjacent phrasings.
3. **Keyword data** (paid; shortlist only, inside `data.credit_budget_per_run`; ask before any planned batch over 2,000 credits): `get_keyword_metrics` for the shortlist, `research_keywords` seeded from the topics in `blog/keywords.md` and from `offer[].keywords`. `get_serp_results` for the top candidate per type to see what format ranks.
4. **Without OpenSEO**: follow `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md`. Mark every figure "estimated" in the plan.
5. Drop queries matching `excluded_patterns`.

## Scoring (1 to 5 each, record the reason)

- **Demand**: impressions or volume evidence (5 = clear, recorded demand; 1 = none found).
- **Fit**: how directly the page leads to an `offer[]` entry.
- **Ability**: can we write it truthfully and well now? (5 = facts available and sourced; 1 = we would have to guess, which rules it out).
- **Uniqueness**: would the page say something no other page on the site says? (1 = near duplicate, which rules it out.)

Total = sum. Ability 1 or Uniqueness 1 rules a candidate out. Ties go to the hub that links to more existing pages (guides hub, then FAQ hub, then glossary).

## Cannibalisation check (every candidate)

1. Search `.agents/aio-seo/blog/blog-log.md`, `blog/keywords.md` and `page-plan.md` for the primary query and close variants.
2. Search the repo's content directories and route registry for the slug and the query words in titles and H1s.
3. In Search Console, filter the query: if two or more of our URLs get impressions for it, record them.
4. Decide and log one of:
   - **New page**: no existing URL targets it.
   - **Improve existing**: an existing page targets it; add the missing section to that page instead.
   - **Merge**: two pages split the query; open a consolidation job in `.agents/aio-seo/blog/maintenance-queue.md` with both URLs and their numbers (Pro: `/aio-seo-pro:maintain-advanced` merges and redirects; without Pro a person does it by hand). Never redirect silently.
   - **Skip**: a better page already exists.
5. Each query gets one primary URL in `page-plan.md`. Blog posts may answer adjacent questions and link to the primary URL.

## Writing the plan

For every candidate record: type, proposed URL (from `project.url_patterns`), primary query, secondary queries, evidence (figures, tool, range), score, cannibalisation decision, data needed, status (`idea`, `planned`, `in-progress`, `pr-open`, `live`, `stale`, `retired`), PR link and next review date.
