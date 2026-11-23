---
name: blog
description: Plan, research, write and ship one data-driven blog post per run, written to be ranked by Google and Bing and quoted by AI assistants. Picks the topic from Search Console, GA4 and keyword data (OpenSEO, or exports), checks cannibalisation, writes in the site's voice with sources, tables, FAQ and callouts to the site's own offers and tools, runs a 15-line quality gate plus content lint, ships the post as a pull request, queues the URL for indexing, drafts LinkedIn/X posts (never posts them) and keeps all blog state in .agents/aio-seo/blog/. Use for "write this week's blog post", "weekly blog", a scheduled blog run, "what should we blog about next", "refresh the topic queue", "how are our posts doing", or updating the keyword, competitor or link inventory lists.
argument-hint: "[full | plan | review | maintain] [topic or query]"
---

# Blog

One run = one post, chosen from real search data, written to the shared writing standards, shipped as a pull request, with the blog state read first and updated last. Everything project-specific comes from `.agents/aio-seo/config.json`.

## Non-negotiables

1. **Data first, never invented.** Topics come from data pulled in this run (OpenSEO, another Search Console/GA4 source, or user exports). Every metric in state or in a post comes from a tool result or a cited source in this run. No first-party data: research-led mode, labelled as such. Never write a number you did not get.
2. **State lives in the repo.** Read the whole state folder before anything else; update it before finishing. The repo is the only memory between runs.
3. **One primary query per page.** Never publish a post that competes with an existing page for the same query. Existing-page wins become maintenance jobs.
4. **Every claim has a source.** Sources go in the research file and are linked in the post.
5. **Analytics and search tools are read-only.** Paid calls stay within `data.credit_budget_per_run`; approval-only tools (rank tracker runs, AI visibility checks, IndexNow submission, project context updates) are never called from this skill.
6. **Quality gate before publish.** Fail after one fix attempt: ship as draft and say why.
7. **Every post sends readers to something the business owns**, where it genuinely fits. Relevance is a gate.
8. **Ship as a branch and pull request.** Never merge, never push to the default branch, never enable auto-merge. Run `project.build_commands` first.
9. **Never post, send or submit.** LinkedIn and X drafts are saved for a human. No emails, no directory submissions, no accounts, no paid anything.
10. **House rules and compliance.** `house_rules` apply to the post, metadata and state files. Comparisons follow the CAP Code rules in `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`. No fake reviews, ratings or testimonials, and no Review/AggregateRating markup for self-published reviews.

## Inputs

Read `.agents/aio-seo/config.json` first. If it is missing, tell the user to run `/aio-seo:setup` and stop. Keys used, and the mapping from the old `weekly-blog-post` config.md, are in `${CLAUDE_SKILL_DIR}/references/config-keys.md` (read it when a key is missing or the user is migrating).

Main keys: `project.*`, `entity.*`, `offer[]`, `competitors[]`, `branded_terms`, `excluded_patterns`, `data.*`, `house_rules.*`, `blog.*`, `sister_sites[]`, `git.*`.

If `blog.enabled` is false, say so and stop.

## Run modes

| Mode | Trigger | Steps |
|---|---|---|
| Full (default) | "write this week's post", scheduled run | 0 to 12 |
| Plan | "what should we write next?", "refresh the topic queue" | 0 to 5, then 11 and 12. No writing |
| Review | "how are our posts doing?" | 0, 1, 2, 11, 12 |
| Maintain | "work the maintenance queue", or `blog.maintenance_every_n_runs` is due (count runs in `blog-log.md`/`runs/`) | Hand over to `/aio-seo:maintain` (invoke it), then 11 and 12. No new post |
| Bootstrap fallback | config exists but `.agents/aio-seo/blog/` does not | `${CLAUDE_SKILL_DIR}/references/bootstrap-fallback.md`, then stop |

In a scheduled run nobody can answer questions. Make reasonable low-risk decisions, write each under "Assumptions made" in the run log, and surface them in the report.

## State

All under `.agents/aio-seo/blog/`: `state.md`, `search-performance.md`, `keywords.md`, `link-inventory.md`, `competitors.md`, `topic-ideas.md`, `blog-log.md`, `post-performance.md`, `maintenance-queue.md`, `data/`, `research/`, `runs/`, `drafts/`, `social/`. What each holds, when it is read and written, and retention rules: `${CLAUDE_SKILL_DIR}/references/state-files.md`. Templates: `${CLAUDE_PLUGIN_ROOT}/templates/state/blog/`.

## Workflow

### Step 0: Preflight

1. Read config. Check `blog.enabled`.
2. Read `blog/state.md`, then the latest `blog/runs/*.md`. Note anything flagged for this run.
3. If the repo is a git repo: `git status`. Pull only if `git.pull_before_run` is true. Keep other people's uncommitted changes to the state folder; never overwrite them.
4. Read `house_rules.voice_skill` (a skill name or a path) if set, and `.agents/product-marketing-context.md` if it exists. Voice rules override tone guidance; they never override sourcing or compliance.
5. Read `${CLAUDE_PLUGIN_ROOT}/references/writing-standards.md` and `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` (current facts on structured data and AI search).
6. No writable git repo (for example a chat with no repo mounted): only Plan mode is allowed. Write state to a working folder, hand it to the user, and say it must be committed for the next run to see it.
7. Data source: if OpenSEO is loaded, match the project per `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md` section 2. Otherwise follow `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md` and tell the user to run `/aio-seo:setup` to connect one.
8. Open `blog/runs/YYYY-MM-DD.md` from `runs/_template.md` and log as you go.

### Step 1: Review the live lists (before)

Read every state file. Write down for this run:

- The candidate queue and when it was last scored.
- Queries already targeted (`blog-log.md`, `search-performance.md`) and the page that targets each, plus topics a past consolidation marked "do not write new posts on".
- Open maintenance jobs and their age.
- Post types of the last 3 posts (to rotate).
- Anything marked "check next run".

This review prevents repetition, cannibalisation and stale assumptions. Do not skip it because the queue looks fine.

### Step 2: Measure past posts (feedback loop)

For every post in `blog-log.md` published within `blog.measurement_window_weeks`, oldest-checked first, at most 10 per run:

- Page-filtered Search Console pull, last 28 days (`openseo-playbook.md`, "measuring one page").
- Record clicks, impressions, CTR and position for the primary query and the page, against the baseline.
- Flag **winner** (primary query improved 5+ positions or reached the top 10), **stuck** (no movement after 8+ weeks), **wrong query** (impressions mainly for a different query). Posts younger than 4 weeks: record, do not flag.
- Posts 1 to 4 weeks old: `inspect_urls`; record "not indexed" with Google's reason and add the URL to `.agents/aio-seo/indexing/log.md` as pending.
- Posts marked `pending deploy`: fetch the public URL; update status when it returns 200.
- Callout clicks (`${CLAUDE_SKILL_DIR}/references/callouts.md` section 7) and social sessions (`${CLAUDE_SKILL_DIR}/references/distribution.md`).

Write results to `post-performance.md`. Stuck and wrong-query posts become maintenance jobs (refresh, retitle, retarget). Posts whose last substantive update is 12+ months old and still earn impressions become `refresh` jobs; near-zero-impression old posts become `consolidate or retire` jobs. Check the queue first; open each job once. Note in `state.md` "Learnings" only what the numbers support.

### Step 3: Pull demand data

Follow `openseo-playbook.md` section 6 ("blog and maintain: demand pull"), or the fallback source:

1. Candidate queries, `blog.gsc_range`, positions 5 to 70, **paged with `startRow` until no more rows**.
2. Positions 1 to 7 queries, paged the same way.
3. Pages.
4. After clustering: a page drill-down per top cluster.
5. GA4-joined opportunities; GA4 organic page performance and key events by landing page.
6. Rank tracker read if `data.rank_tracker_id` is set.

Save every result to `blog/data/YYYY-MM-DD/`. Record the date ranges the tools report. GA4 fails: continue on Search Console. Search Console fails twice: stop and write only the run log.

### Step 4: Classify, score, shortlist

Follow `${CLAUDE_SKILL_DIR}/references/scoring.md`: classify (branded, job seeker, irrelevant, operator, quiz, AI fan-out, high value), cluster, bucket (A striking distance, B buried, C ranking not clicked, D winning, E low volume), score by opportunity, hydrate the top 30 within budget, rank a candidate queue of 10. Too few high-value A/B clusters: research-led mode, labelled everywhere.

### Step 5: Choose the target and route everything else

Run the cannibalisation check in `scoring.md` section 7 on the top candidate:

- No existing page ranks for it: **new post**.
- An existing page ranks 1 to 20: **maintenance job** for that page; take the next candidate.
- Two or more of our pages split it: **consolidation job**; next candidate.
- Bucket C queries: always CTR rewrite jobs.

Write jobs to `maintenance-queue.md` with their baselines. They are worked by `/aio-seo:maintain`.

**Community tie-break (optional):** if the top eligible candidates are within 20% on opportunity and community research is enabled, follow `${CLAUDE_SKILL_DIR}/references/community-research.md` and prefer the one people are actively discussing. Community signal never lifts a candidate over one with clearly higher search demand.

Plan mode stops here; go to step 11.

### Step 6: Research

1. SERP for the target (depth 20) plus up to 2 close variants from the GSC data, within budget. Record positions 1 to 10, SERP features, whether an AI Overview appears. No budget: web search and record what you can see, labelled "web search, not a SERP tool".
2. Read the top 3 to 5 results. Note coverage, gaps, depth, dates.
3. Community signal (optional, `community-research.md`): angle, objections, FAQ wording, news hooks. Never statistics.
4. 3 to 5 searches for current statistics, reports and news. Primary sources; record publication dates.
5. If the AI visibility tracker exists, read results for related prompts (free reads only) and note which sources the answers cite: those are the pages to beat on clarity.
6. Update `competitors.md`.
7. Write `research/YYYY-MM-DD-<slug>.md` from `research/_template.md`: target, GSC numbers, SERP, gaps, every source with the exact data point taken, related queries for headings and FAQ.

### Step 7: Plan the post

Using `${CLAUDE_PLUGIN_ROOT}/references/writing-standards.md`:

- Pick the post type by search intent (section 3 of that file), preferring the formats that are easiest to quote accurately: direct-answer explainer, comparison with a table, original data, step-by-step, definition. Rotate away from the last 2 to 3 types where intent allows; intent wins.
- Outline: H1, a 40 to 60 word answer block, H2/H3s phrased like real queries from the GSC pull (primary query in at least one H2), at least one table, sources section, 3 to 6 FAQ questions from real related queries, a disclosure line if the post compares anything the business sells.
- Refresh `link-inventory.md` and choose callouts and inline links per `callouts.md` sections 1 to 3. Verify each chosen URL loads.
- 1 to 3 related existing posts as inline links.
- Apply "Learnings" from `state.md`.
- Image plan if `blog.images.enabled` (`${CLAUDE_SKILL_DIR}/references/publishing.md` section 6).

Add the outline to the research file.

### Step 8: Images

Only if `blog.images.enabled`. Follow `publishing.md` section 6.

### Step 9: Write and check

1. Learn the site's conventions if not recorded yet (`publishing.md` section 1).
2. Write in the voice of `house_rules.voice_skill`, to `writing-standards.md`, in the site's format.
3. Run the fact check: spawn the `fact-checker` agent with the draft path and the research file path. Fix or remove every claim it does not mark "supported".
4. Run `content-lint.mjs` and `house-style.mjs`, then the 15-line gate in `${CLAUDE_SKILL_DIR}/references/quality-gate.md`. For an independent read, spawn the `content-reviewer` agent with the draft, the research file and the config path. Record pass/fail per line in the run log. Fix and re-check once.

### Step 10: Publish

Follow `publishing.md`:

1. Structured data check (section 2): the template must emit Article/BlogPosting and BreadcrumbList (FAQPage only if the knowledge base says it is still worth it). Fill the frontmatter fields it reads; if it does not emit them, open a `/aio-seo:schema` ticket. Never hand-write JSON-LD into a post.
2. Link from older posts: add one contextual sentence-level link to the new post from 2 to 3 existing posts that rank for related queries or cover the same offer. Descriptive anchors; do not rewrite those posts.
3. Ship per `blog.ship_mode` (section 3 or 4). Live only if `blog.status` is `live` and the gate passed; otherwise draft.
4. Queue the new URL, and any older posts you edited, in `.agents/aio-seo/indexing/log.md` as pending (section 5).

### Step 11: Update state (after)

Using the templates:

- `search-performance.md`: append this pull (top 20 high-value clusters, exclusions summary, bucket C list, GA4 notes, selected target and why, mode).
- `keywords.md`: replace the live GSC table; mark the target `targeted YYYY-MM-DD <slug>` (or `drafted`); add researched keywords with source; add AEO question phrasings.
- `competitors.md`, `topic-ideas.md` (remove the used topic; add 2 to 3 ideas with evidence; community ideas under "Unvalidated").
- `blog-log.md`: new entry with baseline metrics for the target query at time of writing.
- `post-performance.md`, `link-inventory.md` (usage, broken links, clicks).
- `maintenance-queue.md`: new jobs; close jobs a human or `/aio-seo:maintain` has done (check the live page).
- `blog/state.md`: rewrite fully (last run, site conventions, next 10 candidates re-scored, open job counts, learnings, check next run).
- `.agents/aio-seo/state.md`: update only the Blog section.
- Close `blog/runs/YYYY-MM-DD.md` (credits used this run and this month, failures, "Assumptions made", "Not verified") and write the summary `.agents/aio-seo/runs/YYYY-MM-DD-blog.md`.

If `git.commit_state` is true, commit the state with the post in the same branch.

### Step 11b: Social drafts

If a post was written and `blog.distribution.linkedin` or `blog.distribution.x` is true, write drafts per `distribution.md` into `blog/social/`. Never post them.

### Step 12: Report

Keep it short:

- Post: title, PR link or file path, primary query and its GSC numbers, type, word count, draft or live.
- Why this topic: bucket, opportunity, the alternatives it beat, mode (GSC-led / research-led).
- Quality gate: pass/fail per line; lint result; fact-check result.
- Structured data: emitted by template / ticket opened for `/aio-seo:schema`.
- Callouts used: inventory IDs, where, why each fits.
- Past posts: winners and stuck posts with numbers.
- Maintenance jobs opened (for `/aio-seo:maintain`).
- Indexing: URLs queued as pending for `/aio-seo:indexing`.
- Social drafts: full text, ready to paste.
- Credits spent (this run, this month), community research ran/skipped and what it changed.
- Assumptions made, Not verified, failures.

## Failure handling

| Situation | Action |
|---|---|
| `config.json` missing | Tell the user to run `/aio-seo:setup`; stop |
| No data source at all | Research-led mode, labelled; or Plan mode only if even that fails |
| Search Console fails twice | Stop; write only the run log |
| GA4 fails | Continue on Search Console; log it |
| Paid call would exceed budget | Skip; use free data; log it |
| No eligible candidate after cannibalisation checks | Plan outcome: jobs and queue written, nothing published, say so |
| Image generation fails twice | Interactive: ask for images. Scheduled: draft without content images |
| Quality gate or fact check fails after one fix | Ship as draft; list failing lines in the run log, PR and report |
| Site schema differs from what you expected | Stop before writing the post; report the difference |
| Build commands fail because of the new post | Fix; if you cannot, ship as draft and say why |

## Reference files

- `${CLAUDE_SKILL_DIR}/references/config-keys.md`: keys read, old-to-new mapping, optional keys and defaults. Read when a key is missing or migrating.
- `${CLAUDE_SKILL_DIR}/references/state-files.md`: every state file, when read/written, retention. Read in step 0 on a first run and in step 11.
- `${CLAUDE_SKILL_DIR}/references/scoring.md`: classification, clustering, buckets, opportunity, cannibalisation, research-led mode. Read in steps 4 and 5.
- `${CLAUDE_SKILL_DIR}/references/quality-gate.md`: lint commands and the 15-line gate. Read in step 9.
- `${CLAUDE_SKILL_DIR}/references/callouts.md`: link inventory, choosing, placing and tracking callouts. Read in steps 2, 7 and 11.
- `${CLAUDE_SKILL_DIR}/references/community-research.md`: optional `last30days` use. Read in steps 5 and 6 when enabled.
- `${CLAUDE_SKILL_DIR}/references/publishing.md`: site conventions, structured data check, PR shipping, draft-only, indexing queue, images. Read in steps 8 to 10.
- `${CLAUDE_SKILL_DIR}/references/distribution.md`: LinkedIn and X drafts and their measurement. Read in steps 2 and 11b.
- `${CLAUDE_SKILL_DIR}/references/bootstrap-fallback.md`: creating blog state when setup did not. Read only in that mode.
- Shared: `${CLAUDE_PLUGIN_ROOT}/references/writing-standards.md`, `openseo-playbook.md`, `data-fallbacks.md`, `knowledge-base.md`, `compliance-uk.md`.
- Agents: `fact-checker` (claims against sources), `content-reviewer` (quality gate and house rules).
