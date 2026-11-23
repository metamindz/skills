# Classification, scoring and selection

Used in steps 4 and 5 of the blog workflow, and by `/aio-seo:maintain` to find striking-distance and CTR jobs. Config keys are in `.agents/aio-seo/config.json`.

## 1. Classify every query

Work from the paged candidate-query pull.

| Class | Rule | Action |
|---|---|---|
| Branded | Contains any `branded_terms` entry or an obvious misspelling | Exclude. These people already know the brand |
| Job seeker | Matches `excluded_patterns` or clearly wants a job, salary or course | Exclude |
| Irrelevant | Wants something the business does not sell (accidental ranking), or is navigating to another company | Exclude |
| Operator / internal | Contains search operators (`site:`, `intitle:`, quoted boolean strings) | Exclude. Usually the team or a tool |
| Quiz / homework | Exam-style text ("which three of the following...") | Exclude |
| AI fan-out | Long, prompt-like queries that AI assistants generate when searching for a user: persona text ("about me:", "question:"), "evaluate the company X on Y", natural questions of roughly 12+ words | Not a primary keyword. Keep in `keywords.md` under "AEO question phrasings": good heading and FAQ material, and evidence of what assistants ask about the site |
| High value | Non-branded, maps to at least one `offer[]` entry, searcher could become a customer or refer one | Keep, tagged with the matching offer |

When unsure between irrelevant and high value, ask: would a person typing this, after reading a good answer from us, plausibly buy from us or forward it to someone who would? If not, irrelevant. Log borderline calls in the run log.

## 2. Cluster before scoring

Close variants split demand across rows ("churn rate", "what is churn rate", "churn rate formula", "how to calculate churn"). Scoring rows one by one ranks fragments of one topic. So:

- Group high-value queries into clusters one page could rank for (same head term, same intent). Keep "what is X" (informational) and "X software" or "X services" (commercial) apart when the SERPs differ.
- Cluster impressions = sum; cluster position = impression-weighted average; head query = the member with most impressions.
- Score and bucket clusters, not rows. Keep member queries: they become secondary keywords, headings and FAQ questions.
- Never plan a separate page per fan-out variation of one cluster: Google treats pages made primarily to capture query variations as scaled content abuse. [VERIFIED 2026-09] Source: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

## 3. Bucket the clusters

| Bucket | Condition | Action |
|---|---|---|
| A. Striking distance | Position 8 to 25, impressions >= `blog.min_impressions_striking` | Best new-post targets if no existing page owns them; otherwise a `maintain` striking-distance job |
| B. Big but buried | Position 26 to 70, impressions >= `blog.min_impressions_buried` | Pillar post candidates, only for offers with weight 1.0 |
| C. Ranking, not clicked | Position 1 to 7, CTR below the rewrite line: `blog.ctr_rewrite_below` if set, else 0.03 | Never a new post. CTR rewrite job (title/meta) for `/aio-seo:maintain` |
| D. Winning | Position 1 to 7, CTR at or above the rewrite line | Leave alone |

The rewrite line is lower than `blog.target_ctr` on purpose: `target_ctr` is the optimistic ceiling used in the opportunity score, and using it here would flag almost every page-one query. Before opening a C job, check the SERP if budget allows: an AI Overview or other SERP feature above the result can explain a low CTR that no title change will fix; note it in the job.
| E. Low volume | Below the bucket floors | Park in `topic-ideas.md` |

A query in A whose ranking page is an offer/service page is usually better served by improving that page (maintenance job), unless the intent is clearly informational ("what is", "how to", "vs") which an offer page cannot answer well.

## 4. Opportunity score

```
opportunity = impressions x max(0, target_ctr - current_ctr) x offer_weight
```

- `target_ctr` = `blog.target_ctr` (default 0.10). It is an assumption, not a measured figure for this site, and it is generous: one large study measured an average position-1 CTR of 3.9% for informational queries without an AI Overview and 1.6% with one (December 2025, desktop). [VERIFIED 2026-09] Source: https://ahrefs.com/blog/ai-overviews-reduce-clicks-update. That does not change the ranking order, only the size of the number. Once `post-performance.md` has 5+ posts that reached the top 3, replace it with the site's own median CTR at positions 1 to 3 and note the change in `state.md`.
- `offer_weight` = the matched `offer[].weight` (1.0 core, 0.5 secondary).
- The result ranks opportunities. It is not a forecast. Never present it as expected traffic.

## 5. Hydrate and adjust (paid, within budget)

For the top 30 A/B clusters by opportunity, call `get_keyword_metrics` on their head queries (see `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md`). Use it to:

- **Merge close variants** with near-identical SERPs (plural or word-order variants). Higher-impression query is primary.
- **Read intent.** Informational and commercial-investigation intents suit posts. Transactional and navigational intents belong on offer pages: route to maintenance.
- **Note trend.** Record a clearly falling 12-month trend in the reason line; do not drop a query for it alone.
- **Use KD only as a tie-breaker.** GSC position already shows Google's view of this site for this query.

No budget: skip hydration, infer intent from a web search of the SERP, and log "not hydrated: budget".

## 6. Candidate queue

Rank by bucket (A before B), then opportunity, then lower KD. Keep the top 10 in `blog/state.md` with: cluster head query, bucket, position, impressions, CTR, opportunity, intent, matched offer, ranking page (if any), proposed post type, one-line reason. Carry over last run's items that still qualify, re-scored; drop the rest with the reason.

## 7. Cannibalisation check (before committing to a target)

Run all three:

1. **GSC query x page data** for the cluster head term: which of our pages earn impressions, at what position?
2. **`blog-log.md`**: has any post targeted this query or a merged variant? Has a past consolidation listed it under "do not write new posts on"?
3. **Existing content**: search `project.content_dirs.*` and the live sitemap for pages whose title or H1 already answers it.

| Finding | Decision |
|---|---|
| Nothing relevant | New post |
| One of our pages ranks 1 to 20 for it | No new post. Maintenance job for that page (refresh, expand, retitle). Take the next candidate |
| A page ranks 21+, is under 12 months old and has real substance | Maintenance job (expand). Next candidate |
| A page ranks 30+ and is thin (under ~800 words) or 12+ months old | Choose: refresh job, or a new post on a clearly different angle that links to the old one. Log why |
| The ranking page answers a different intent (ranks for "X tools" with a post about X methods) | New post allowed for the unmet intent. Distinct primary queries, link both ways, log the reasoning |
| Two or more of our pages split impressions for it | Consolidation job in the maintenance queue (Pro: `/aio-seo-pro:maintain-advanced`; without Pro, a person merges by hand). Next candidate. Writing another post on that topic would split the cluster further (a live run found one post taking several thousand impressions at average position 22 with zero clicks while six sibling posts shared the same cluster) |

Bucket C queries always become CTR rewrite jobs, never new posts.

## 8. Research-led mode

Use when buckets A and B together hold fewer than `blog.min_high_value_queries` high-value clusters (new sites, rebrands, tiny blogs), or when no first-party data source exists.

With OpenSEO:

1. Seeds from `offer[].keywords`.
2. `get_ranked_keywords` for the top 2 competitors in `competitors.md` (`maxRank: 10`, `minSearchVolume: 50`).
3. `get_keyword_metrics` on the combined shortlist. Keep informational/commercial queries tied to a weight-1.0 offer.
4. Score: `volume x offer_weight / (1 + KD / 25)`. Prefer KD under 30.

Without OpenSEO: follow research-led mode in `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md`; no volume numbers unless a tool or export gave them.

Label the selection "research-led, no first-party demand" in `search-performance.md`, `blog-log.md` and the report. Return to GSC-led selection as soon as the site has enough A/B clusters.

## 9. Outputs

- Candidate queue (10) for `blog/state.md`.
- Selected target with full reasoning for `search-performance.md`.
- Jobs for `maintenance-queue.md`: bucket C (CTR rewrite), existing-page wins (striking distance, expand), consolidation.
- Parked E-bucket and rejected-intent queries for `topic-ideas.md`.
