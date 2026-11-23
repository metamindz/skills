---
name: report
description: Weekly or monthly SEO and AIO progress summary built only from state files and free data reads. Covers Search Console clicks, impressions and position trend, top movers, pages published, jobs done and their measured result after 4+ weeks, AI visibility trend, indexing status and credits used. Under 400 words of bullets with every number sourced. Posts to Slack when a channel is configured and a Slack tool is available, otherwise writes a file. Use when the user asks for "the SEO report", "weekly update", "monthly update", "how are we doing in search", "AI visibility update", "what did the agent do this week", or on a schedule after the other jobs.
argument-hint: "[weekly|monthly]"
---

# Report

Tell the team, in under 400 words, what changed in search and AI visibility, what the plugin did, and whether earlier work moved anything. Read-only: no paid calls, no changes to the site.

## Non-negotiables

- **Sourced numbers only.** Every number comes from a free tool result in this run or from a dated state file, and the bullet says which (for example "GSC, 20 Oct to 16 Nov vs previous 28 days"). If a number is not available, write "not available" and why. Never estimate, round up or extrapolate.
- **Free reads only.** Allowed: `get_search_console_performance`, `get_search_opportunities`, `inspect_urls`, `get_google_analytics_*`, `get_rank_tracker`, `get_ai_visibility_tracker`, `get_ai_visibility_results`, `get_ai_visibility_trend`, `get_ai_visibility_sources`, `list_site_audits`, `get_audit_*`, `whoami`, `get_project_context`. No paid calls and no writes to any tool.
- **Cause and effect with care.** Report a job's result only after at least 4 weeks (the blog uses `blog.measurement_window_weeks`), compare like-for-like windows, and say "changed after" rather than "caused by". Mention known confounders: Google updates on the Search Status Dashboard in the window, Search Console data incidents, seasonality (knowledge-base.md sections 2 and 8).
- **No AI Overview CTR.** Search Console has no AI-surface clicks or CTR; never present one (knowledge-base.md section 8).
- Never post to any channel except `notifications.slack_channel`. Never include personal data, secrets or full exports.

## Inputs

- Config: `project.site_url`, `project.name`, `data.openseo_project_id`, `data.credit_budget_per_month`, `blog.measurement_window_weeks`, `branded_terms`, `notifications.slack_channel`.
- State: `.agents/aio-seo/state.md`, `.agents/aio-seo/runs/` (logs since the last report), `.agents/aio-seo/blog/blog-log.md`, `.agents/aio-seo/blog/post-performance.md`, `.agents/aio-seo/blog/maintenance-queue.md`, `.agents/aio-seo/pages/`, `.agents/aio-seo/tools/tools-log.md`, `.agents/aio-seo/indexing/log.md`, `.agents/aio-seo/audits/` (newest), `.agents/aio-seo/visibility/results/` (newest), `.agents/aio-seo/offsite/` (status counts), `.agents/aio-seo/reports/` (previous report).
- If config is missing, tell the user to run `/aio-seo:setup`. If OpenSEO is unavailable, follow `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md` and report from state files only, saying so.

## Run modes

- `weekly` (default): last 7 days for activity; Search Console last 28 days versus the previous 28 days (Search Console data lags by a few days; state the actual end date).
- `monthly`: last calendar month for activity; Search Console last 3 months by month, plus month versus previous month.

## Workflow

1. **Load** config, `state.md`, the previous report and every run log since its date.
2. **Search Console** (`get_search_console_performance`): totals for clicks, impressions, CTR and average position for the two windows; split branded versus non-branded using `branded_terms`. Top 5 pages and top 5 queries by click change (both directions). Note the window end date.
3. **Activity** from state and run logs: posts published (title, URL, date), pages and tools shipped, PRs opened (link) and their state if visible, maintenance jobs done, audit tickets opened and closed, offsite drafts created and items the human marked sent or live, indexing submissions.
4. **Measured results.** For each job finished at least 4 weeks ago (or `blog.measurement_window_weeks` for posts) and not yet reported as measured: compare the page's clicks, impressions and position for equal windows before and after. Record the result in `blog/post-performance.md` or the job's state file if that skill's format allows, else only in this report.
5. **AI visibility** (`get_ai_visibility_trend` with 28 days; the newest results file): mention rate and citation rate with the comparison status. If the comparison is not "comparable", say so and do not claim movement.
6. **Indexing:** counts from `indexing/log.md` and any `inspect_urls` results in run logs this period; list pages known not to be indexed.
7. **Budget:** OpenSEO credits used this period from run logs (and `whoami` balance), against `data.credit_budget_per_month`. Any approved paid AI visibility checks and their reported cost.
8. **Write** the report using the format below. Count words; keep it under 400.
9. **Deliver.** If `notifications.slack_channel` is set and a Slack tool is loaded (search deferred tools for a Slack send-message tool), post the report to that channel only, then save a copy. Otherwise write it to `.agents/aio-seo/reports/YYYY-MM-DD.md` only. If the Slack post fails, write the file and log the error. Do not post to any other channel or person.
10. **Update** the `## Report` section of `state.md` (add it at the end if missing) (date, file path, posted or not) and write `.agents/aio-seo/runs/YYYY-MM-DD-report.md` with "Assumptions made" and "Not verified". Always save the file copy at `.agents/aio-seo/reports/YYYY-MM-DD.md`.

## Format

```markdown
# SEO and AIO update: {{project.name}}, YYYY-MM-DD

**Search (Google Search Console, DD Mon to DD Mon vs previous 28 days)**
- Clicks X (±Y%), impressions X (±Y%), CTR X%, avg position X (±Y)
- Non-branded clicks X (±Y%)
- Up: page or query (+N clicks); Down: page or query (−N clicks)

**AI visibility (OpenSEO tracker, run DD Mon)**
- Mention rate X of Y (Z%), citation rate X of Y (Z%); trend: comparable/not comparable
- Wrong facts found: N; new actions: N

**Shipped**
- Post: "Title" (URL), DD Mon
- PR: title (link), status

**Results of earlier work (4+ weeks)**
- "Title": clicks X to Y, impressions X to Y, position X to Y (windows)

**Indexing**
- N URLs submitted; N pages not indexed (list)

**Budget**
- OpenSEO credits used: N of monthly budget M

**Needs you**
- Approvals, drafts waiting to be sent, decisions
```

Use a minus sign or the word "down" for falls; do not use dashes as separators. Drop any section with nothing to report rather than writing "none".

## References

- `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md`: sections 2 (updates, diagnostic heuristic) and 8 (measurement limits).
- `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md`: free versus paid tools.
- `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md`: running without OpenSEO.
