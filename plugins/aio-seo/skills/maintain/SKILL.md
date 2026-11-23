---
name: maintain
description: Improve the pages a site already has, using search data, and ship the changes as one pull request. Works the maintenance queue (.agents/aio-seo/blog/maintenance-queue.md) and finds site-wide jobs: striking-distance pages (positions 8 to 25), CTR rewrites for page-one results with low CTR (title and meta, keeping title and H1 aligned), internal links, indexing fixes, and fact checks of pages against current product facts (prices, plans, features changed in recent commits). Records a baseline for every job and queues changed URLs for indexing. Use for "work the maintenance queue", "fix pages stuck on page two", "improve CTR", "add internal links", "check our pages for outdated prices", or a monthly maintenance run.
argument-hint: "[queue | find | job-id] [max jobs]"
---

# Maintain

Existing pages that already rank are usually the cheapest wins. This skill finds those jobs from data, does the top few as one pull request, and records a baseline for each so the result can be measured later. It works on every content type in `project.content_dirs`, not only the blog.

Consolidation with redirects, decay and age refreshes, retirements and the 4-week result measurement come with Pro (`/aio-seo-pro:maintain-advanced`).

## Non-negotiables

1. **Data first.** Every job has a trigger from data pulled in this run (or a dated export) and a baseline recorded before the change. No data source: only the jobs that need none (internal links, product fact checks); say so.
2. **Never break a URL.** Keep slugs. This skill does not remove, merge or redirect pages.
3. **Ship as a branch and pull request.** Never merge, never push to the default branch, never enable auto-merge. Run `project.build_commands` first.
4. **Analytics and search tools are read-only.** Paid calls within `data.credit_budget_per_run`; approval-only tools are not used here.
5. **Honest dates.** Change `updated`/`dateModified` only for substantive changes. Never bump dates to look fresh.
6. **Writing rules apply to every edit**: `${CLAUDE_PLUGIN_ROOT}/references/writing-standards.md`, `house_rules`, and `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`. No invented facts; the `fact-checker` agent checks every changed claim.

## Inputs

Read `.agents/aio-seo/config.json` first. Missing: tell the user to run `/aio-seo:setup` and stop.

Keys: `project.site_url`, `project.content_dirs.*`, `project.url_patterns.*`, `project.build_commands.*`, `offer[]` (names, URLs, `price_from`), `branded_terms`, `excluded_patterns`, `data.*`, `house_rules.*`, `blog.gsc_range`, `blog.min_impressions_striking`, `blog.target_ctr`, `blog.ctr_rewrite_below` (optional, default 0.03), `blog.max_maintenance_jobs_per_run` (default 3), `git.*`.

State read and written:

- `.agents/aio-seo/blog/maintenance-queue.md` (the queue; template `${CLAUDE_PLUGIN_ROOT}/templates/state/blog/maintenance-queue.md`).
- `.agents/aio-seo/blog/blog-log.md`, `post-performance.md`, `link-inventory.md`, `keywords.md`.
- `.agents/aio-seo/blog/data/YYYY-MM-DD/` (snapshots, shared folder with the blog skill).
- Run log: `.agents/aio-seo/runs/YYYY-MM-DD-maintain.md`.
- `.agents/aio-seo/state.md` (Maintain section only) and `.agents/aio-seo/indexing/log.md` (pending URLs).
- `.agents/aio-seo/offsite/entity-facts.md` if it exists (current product facts).

## Run modes

| Mode | Trigger | What happens |
|---|---|---|
| Queue (default) | "work the maintenance queue", monthly run, blog run hands over | Steps 0 to 2, then 3 to 7 on the top jobs |
| Find only | "what should we fix?", "find maintenance jobs" | Steps 0 to 2, then 6 and 7. No edits |
| One job | a job ID or page URL given | Steps 0, 1, then 3 to 7 for that job |

When nobody is watching (for example a run started by another skill), make low-risk decisions and log them under "Assumptions made".

## Workflow

### Step 0: Preflight

1. Read config, `.agents/aio-seo/state.md`, the queue, `blog-log.md`, and the latest `.agents/aio-seo/runs/*-maintain.md`.
2. `git status`; work on a new branch `<git.branch_prefix>maintain-YYYY-MM-DD` from the default branch. Never on the default branch.
3. Data source: OpenSEO per `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md` section 2, else `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md`.
4. Open the run log `.agents/aio-seo/runs/YYYY-MM-DD-maintain.md`.

### Step 1: Check the queue

Re-check that open jobs are still valid (a human may have done them) and that "Done" jobs have their deploy date noted when the PR has merged (`git log` or the live page). Measuring results 4+ weeks after deploy is a Pro job (`/aio-seo-pro:maintain-advanced measure`); without Pro, compare equal 28-day windows before and after the deploy in Search Console by hand.

### Step 2: Find new jobs

Follow `${CLAUDE_SKILL_DIR}/references/finding-jobs.md`. It pulls Search Console data (paged), classifies queries as the blog skill does, and opens jobs of these types, each with a trigger and a baseline:

| Job type | Trigger (summary) |
|---|---|
| Fix indexing | Page not indexed (`inspect_urls` or an indexing export) or excluded by canonical/noindex by mistake |
| Product fact check | Prices, plan names or features changed in recent commits, or differ from `offer[]` / entity facts |
| CTR rewrite | Position 1 to 7, CTR below the rewrite line |
| Striking distance | Position 8 to 25 with impressions at or above `blog.min_impressions_striking` |
| Internal links | Important page with few internal links pointing at it, or a new page with none |
| Structured data | Missing or wrong JSON-LD: hand to `/aio-seo:schema` (record, do not fix here) |

Check the queue before opening any job: one open job per page per type. Re-check that existing open jobs are still valid (a human may have done them).

### Step 3: Pick the jobs for this run

Priority order, then by impressions at stake:

1. Fix indexing
2. Product fact check (wrong prices or features are a CAP Code risk and mislead readers)
3. CTR rewrite
4. Striking distance
5. Internal links

Take the top `blog.max_maintenance_jobs_per_run` (default 3). Leave consolidation, refresh and retirement jobs already in the queue (opened by Pro or a person) for `/aio-seo-pro:maintain-advanced` or a person.

### Step 4: Do each job

Follow `${CLAUDE_SKILL_DIR}/references/jobs.md` for the job type. For every job:

1. Record the baseline in the job row before editing: URL, top 5 queries with impressions, position and CTR (last 3 months), page clicks and impressions, the data snapshot path.
2. Make the change in the repo.
3. For any changed claim, number or product fact: spawn the `fact-checker` agent with the changed file and the sources (research notes, product source files). Fix or remove anything not supported.
4. Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/content-lint.mjs <changed content files> --config .agents/aio-seo/config.json` and `node ${CLAUDE_PLUGIN_ROOT}/scripts/house-style.mjs <changed content files>`. Fix errors your edit introduced; log pre-existing ones as new jobs rather than widening the PR.
5. Move the job to "Done" with today's date and the branch/PR, result "measure from deploy date".

Product fact checks follow `${CLAUDE_SKILL_DIR}/references/product-facts.md`.

### Step 5: Ship

1. Run `project.build_commands` that are set. Fix failures you caused; log unrelated ones.
2. Commit (`maintain: <date> <job ids>`), including state files if `git.commit_state` is true.
3. Push the branch and open a pull request (`gh pr create`). PR description: each job with trigger, baseline, change, and how it can be measured; "Not verified". If push or `gh` fails, leave the branch and give the user the commands.
4. Never merge or enable auto-merge.
5. Queue every changed URL in `.agents/aio-seo/indexing/log.md` as pending, source `maintain`, note `waits for deploy` (use the file's columns; create it from `${CLAUDE_PLUGIN_ROOT}/templates/state/indexing/log.md` if missing).

### Step 6: Update state

- `maintenance-queue.md`: new jobs, done jobs with baselines.
- `blog-log.md`: posts retitled.
- `link-inventory.md`: changed URLs.
- `.agents/aio-seo/state.md`: Maintain section only (jobs done, PR, open count, oldest open job).
- Close the run log with credits used (this run, this month), "Assumptions made", "Not verified".

### Step 7: Report

- Jobs done: ID, page, type, change, baseline numbers, PR link.
- New jobs opened, by type, and the top 5 open jobs.
- Seen, not actioned: split clusters, decaying and old pages, with their numbers.
- URLs queued for `/aio-seo:indexing`; structured-data tickets for `/aio-seo:schema`.
- Credits, assumptions made, not verified.

## Reference files

- `${CLAUDE_SKILL_DIR}/references/finding-jobs.md`: data pulls, thresholds and triggers for each job type. Read in step 2.
- `${CLAUDE_SKILL_DIR}/references/jobs.md`: how to do each job type. Read in step 4.
- `${CLAUDE_SKILL_DIR}/references/product-facts.md`: checking pages against current prices, plans and features from recent commits. Read for product fact check jobs.
- Shared: `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md`, `data-fallbacks.md`, `writing-standards.md`, `knowledge-base.md`, `compliance-uk.md`; `${CLAUDE_PLUGIN_ROOT}/skills/blog/references/scoring.md` (query classification and clustering).
