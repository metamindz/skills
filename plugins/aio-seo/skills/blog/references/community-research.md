# Community research with last30days (optional)

Search data shows what people search for. The `last30days` skill (if installed) shows what people are discussing right now (Reddit, X, YouTube, Hacker News, GitHub, the web). Use it to sharpen choices made on search data, never to replace them. If it is not installed or not set up, skip it cleanly.

## What it may and may not do

| Use | Allowed |
|---|---|
| Break a tie between candidates within 20% of each other on opportunity | Yes |
| Shape the angle, headings, objections and FAQ wording | Yes |
| Supply a timely news hook (with the primary source linked) | Yes |
| Add ideas to `topic-ideas.md` under "Unvalidated" | Yes |
| Pick the primary keyword on its own, or lift a candidate with no search demand over one with demand | No |
| Act as a source for statistics in the post | No. A post or comment is an opinion or anecdote |

## Preconditions (check every run; skip if any fail)

1. Config `blog.community_research.enabled` is true.
2. The `last30days` skill is available in this session (listed in the available skills, or `SKILL.md` found with its sibling `scripts/` directory). A `SKILL.md` alone cannot run; do not pass off a plain web search as its output.
3. Its first-run setup is complete. Its own instructions say how to check; if its setup wizard would need consent (browser cookies, API keys), a scheduled run cannot give it. Skip, and add "complete last30days setup interactively" to the report.
4. Its runtime requirements (check its own docs) are met.

If any check fails, log `community research skipped: <reason>` and carry on. Never block a post on it.

## How to run it

Invoke the `last30days` skill and follow its own contract. Do not call its engine directly with guessed flags.

- **Use its non-interactive (agent) mode** if it has one: this is a sub-step of a longer run, and an interactive mode that ends by waiting for the user would stall a scheduled run. Its presentation rules apply only to its own output; keep that output in the research folder and never let its formatting leak into the post.
- **Phrase queries in the reader's problem language,** not the offer name. Commercial terms get little discussion; the problems behind them do. Translate the target into 1 to 2 problem phrasings (for example "subscription analytics tool" becomes "how to track churn in a small SaaS"). Record the phrasing used.
- **Topic research** for the chosen target (step 6): one run, or two if the first finds nothing solid and an alternative phrasing exists.
- **Tie-break** (step 5): one run per tied candidate, within `blog.community_research.max_runs_per_post` in total.
- **Discovery** (trending in the business's domain): only every `blog.community_research.discovery_every_n_runs` runs (default 4 if the key is absent), scoped to `blog.community_research.discovery_domains` or, if absent, `entity.knows_about`. Results go to `topic-ideas.md` under "Unvalidated".
- **Save location:** `.agents/aio-seo/blog/research/community/YYYY-MM-DD-<slug>-last30days.md` (point its save directory there if it accepts one; otherwise copy its brief there).
- **Spend:** some of its sources can spend third-party credits. Disable paid backfill unless `blog.community_research.allow_paid_backfill` is true (default false), using whatever setting its own docs give for that. Log the sources that ran and their status.

## Reading the result

Extract into the research file, section "Community signal":

- Volume and heat: number of items, engagement, platforms. If it reports nothing solid, record exactly that.
- Recurring pain points and objections, each with 1 to 2 links. They become headings and FAQ questions when they also match a GSC query or People Also Ask question.
- Language people use that differs from the business's vocabulary.
- News hooks: dated events, each with a primary-source link (the announcement, not the reaction).
- Contrarian takes worth addressing honestly.

A source that was rate-limited, failed auth or timed out is "not covered", never "quiet".

## Using it in the post

- Paraphrase and link threads. Quote sparingly, attributed to the platform and thread. Never name a private individual; public figures posting publicly in that capacity are fine.
- Never present a comment's claim as fact. Find a primary source in step 6 or leave it out.
- The answer block and the H2 for the primary query come first; the community angle shapes the argument, not the target.

## Logging

- Research file: "Community signal" section with phrasing, sources and statuses, extracted points with links.
- `search-performance.md`: if it broke a tie, both candidates' opportunity scores.
- `topic-ideas.md`: discovery ideas under "Unvalidated", with link and date.
- Run log: ran / skipped (reason), sources, any credits it reported.
- After 8+ posts, note in "Learnings" whether posts with strong community signal performed differently, using `post-performance.md` numbers only.
