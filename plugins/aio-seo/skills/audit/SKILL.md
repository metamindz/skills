---
name: audit
description: Full SEO and AIO audit of a website and its repo, covering crawl and indexing, technical SEO, on-page, content quality and extractability, structured data, AI crawler access, llms.txt, entity consistency, off-site presence and measurement setup. Confirms each defect with evidence (live HTML, file and line, tool result), carries forward ticket status from the previous audit, and writes a prioritised backlog with tickets routed to the right /aio-seo skill. Use when the user asks for an "SEO audit", "AIO audit", "site audit", "technical SEO check", "why aren't we ranking", "are AI bots blocked", "monthly audit", or on the monthly_audit schedule.
argument-hint: "[full|quick|pages <url ...>] [--no-paid]"
---

# Audit

Find what stops the site being found on Google and Bing and cited by AI assistants, prove each problem with evidence, and turn it into a short, prioritised backlog. This skill reads and reports; it does not fix. Fixes go to the skill named on each ticket.

## Non-negotiables

- **Evidence or it is not a defect.** Every finding cites at least one of: a live URL with the observed value, a repo file and line, a tool result (tool name and date), or a command and its output. Anything you could not confirm goes under "Suspected, not confirmed".
- **No invented numbers.** Every metric comes from a tool result in this run, a state file with its date, or a cited source. Claims about how search engines or AI assistants behave come from `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` with their label and link. Apply its 6-month re-verify rule.
- **Read-only.** Do not edit site code, content, config or third-party accounts. Write only under `.agents/aio-seo/`.
- **No paid crawl without approval.** See step 4.
- Never recommend llms.txt work, schema-for-AI-citation work, or self-serving review markup as a lever (knowledge-base.md sections 5, 6 and 9).
- Compliance findings follow `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md` for the keys in `house_rules.compliance`.
- Never delete or rewrite an earlier audit file.

## Inputs

From `.agents/aio-seo/config.json` (if missing, tell the user to run `/aio-seo:setup`; you may still run a read-only `quick` audit of a URL they give you, and say the backlog cannot be carried forward):

- `project.site_url`, `project.stack`, `project.repo_root`, `project.content_dirs`, `project.url_patterns`, `project.private_paths`
- `entity.*` (name, entity line, address, company number, people, `same_as`)
- `offer`, `competitors`, `branded_terms`, `excluded_patterns`
- `data.provider`, `data.openseo_project_id`, `data.credit_budget_per_run`
- `indexing.search_console_verified`, `indexing.bing_verified`, `indexing.indexnow_key_path`
- `house_rules.compliance`
- `offsite.directories`, `offsite.review_platforms`

State read: `.agents/aio-seo/state.md`, the newest file in `.agents/aio-seo/audits/`, `.agents/aio-seo/offsite/entity-facts.md`, `.agents/aio-seo/visibility/` (latest results), `.agents/aio-seo/indexing/log.md`.

## Run modes

| Mode | When | Scope |
|---|---|---|
| `full` (default) | Monthly schedule, or the user asks for an audit | All ten areas in step 5 |
| `quick` | User wants a fast check, or config is missing | Areas A, B, F, G only, no paid tools |
| `pages <url ...>` | User names specific pages | Areas B to E for those URLs, plus their indexing status |
| `--no-paid` | Any mode | Skip `run_site_audit`; use free reads and the local script only |

Scheduled runs: use `full`, never start a paid crawl unless config `data.scheduled_paid.site_audit` is true, the estimate fits `data.credit_budget_per_month`, and the crawl stays within `data.scheduled_paid.site_audit_max_pages`. Otherwise reuse the newest OpenSEO audit or skip it, and log the decision under "Assumptions made".

## Workflow

1. **Load context.** Read config, `state.md`, the previous audit and the knowledge base sections you will need (at least 1, 2, 3, 5, 6, 9, 12). Note today's date as `YYYY-MM-DD`.

2. **Carry forward previous tickets.** For every ticket in the newest audit file, re-check it now with the same evidence method that raised it. Mark it `FIXED` (with the evidence that it is fixed), `NOT FIXED`, `PARTLY FIXED`, `MOOT` (superseded, with the ticket that replaces it) or `CANNOT CHECK` (with the reason). Never mark `FIXED` from a commit message alone; check the live site or the file. Record the repo HEAD (`git rev-parse --short HEAD`) and, where possible, confirm the live deploy matches it (for example a release header or a build ID in the HTML), else note "live deploy version not confirmed".

3. **Run the local site check.** Run:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/check-site.mjs --url {{site_url}} --sitemap-sample 20 --json
   ```
   Save the raw output to `.agents/aio-seo/audits/data/YYYY-MM-DD-check-site.json`. Use it for robots.txt, sitemap, status codes, canonicals, titles, H1s, meta descriptions, JSON-LD and AI crawler access. If the script is missing or errors, log it and do the same checks by hand with `curl` as described in `${CLAUDE_SKILL_DIR}/references/checklist.md`.

4. **Gather data (free first, paid only with approval).** Load deferred OpenSEO tools by tool search if needed. If OpenSEO is not connected, follow `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md` and mark affected sections "data unavailable".
   - Free: `list_site_audits` (reuse an audit finished in the last 30 days), `get_audit_status`, `get_audit_issues`, `get_audit_pages`, `get_audit_lighthouse`; `get_search_console_performance` (last 28 days and the 28 days before, by page and by query); `get_search_opportunities`; `inspect_urls` on a sample (homepage, top 5 commercial pages from `offer[].url`, 5 newest content pages, any page flagged by step 3); `get_google_analytics_measurement_health`; `get_ai_visibility_trend` if a tracker exists.
   - Paid: `run_site_audit` only if no audit exists from the last 30 days and either the user approves in this interactive run or standing approval is recorded (see run modes). Before starting, call `whoami` to read the credit balance, state the planned `maxPages` (default 50, never more than 500 without asking) and keep `renderJavaScript` and `runLighthouse` false unless the user asks. Poll `get_audit_status`, then read issues. Call `whoami` again and log the credits used.
   - Respect `data.credit_budget_per_run`. If a step would exceed it, skip that step and log it.

5. **Audit the ten areas.** Follow `${CLAUDE_SKILL_DIR}/references/checklist.md` for the exact checks, evidence to collect and the knowledge-base section behind each one. For large sites, delegate page-level checks to the `seo-auditor` agent (pass it the URL list and the areas to check) and merge its findings; verify any finding you put in a ticket yourself.
   - A. Crawl and indexing
   - B. Technical (status codes, redirects, canonicals, rendering, HTML size, Core Web Vitals, CDN and caching)
   - C. On-page (titles, H1, meta descriptions, headings, internal links, dates)
   - D. Content quality and extractability (server-rendered answers, tables, sourced claims, thin or duplicate pages, off-topic traffic)
   - E. Structured data (validity, eligibility, schema-content match, `@id` consistency, deprecated types, self-serving reviews). Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-jsonld.mjs <url ...> --currency {{project.currency}} --json` on the sampled templates (check-site.mjs already runs the same checks on its sample).
   - F. AI crawler access (robots.txt, CDN and WAF, retired tokens, consistency of the training decision)
   - G. llms.txt (present or not, valid or not, in sync; never ticket it above Low impact)
   - H. Entity consistency (site footer, schema, `config.entity`, `offsite/entity-facts.md`)
   - I. Off-site presence (a quick check only: Google Business Profile, Bing Places, LinkedIn, the directories and review platforms in config; deep work belongs to `/aio-seo:offsite`)
   - J. Measurement setup (Search Console and Bing verification, the "Search generative AI" setting, GA4 property binding, AI referral tracking, an AI visibility baseline)

6. **Confirm and de-duplicate.** For each candidate defect: reproduce it once more (fetch the live page or re-read the file), find the root cause in the repo where possible (follow the chain from rendered output back to the file and line), and merge findings that share one cause. Drop anything you cannot reproduce into "Suspected, not confirmed".

7. **Prioritise.** Score each confirmed defect for impact and effort, and route it to a skill, using `${CLAUDE_SKILL_DIR}/references/scoring-and-template.md`. Pick at most 5 new tickets for this audit (carried-forward open tickets do not count towards the 5). Put the rest in the backlog table.

8. **Write the audit.** Write `.agents/aio-seo/audits/YYYY-MM-DD.md` in the format in `${CLAUDE_SKILL_DIR}/references/scoring-and-template.md`. If a file for today exists, write `YYYY-MM-DD-2.md`. Save supporting data under `.agents/aio-seo/audits/data/`.

9. **Update state.** Update the `## Latest audit` section of `.agents/aio-seo/state.md`: date, audit file path, open ticket count by impact, credits used, next suggested run. Do not edit other sections. Write a run log to `.agents/aio-seo/runs/YYYY-MM-DD-audit.md` with "Assumptions made", "Not verified" and "Knowledge base drift" (any knowledge-base entry you found to be out of date).

10. **Commit state if configured.** If `git.commit_state` is true, commit only the files under `.agents/aio-seo/` on a branch named `{{git.branch_prefix}}audit-YYYY-MM-DD` and open a PR if `git.ship_mode` is `pr`. Never push to the default branch, never merge, never enable auto-merge.

## Outputs

- `.agents/aio-seo/audits/YYYY-MM-DD.md` (the audit)
- `.agents/aio-seo/audits/data/YYYY-MM-DD-*.json` (raw tool and script output)
- `.agents/aio-seo/state.md` (`## Latest audit` section only)
- `.agents/aio-seo/runs/YYYY-MM-DD-audit.md` (run log)

## Report to the user

Under 250 words, bullets:
- Audit file path and repo HEAD audited.
- Previous tickets: counts of fixed, not fixed, partly fixed, moot.
- The new tickets, one line each: title, impact/effort, skill to run.
- Data gaps (for example "GA4 returned no rows: check the property OpenSEO reads").
- Credits used, and anything that needs the user's decision.

## References

- `${CLAUDE_SKILL_DIR}/references/checklist.md`: read in step 5 for the check list, evidence methods and manual fallbacks.
- `${CLAUDE_SKILL_DIR}/references/scoring-and-template.md`: read in steps 7 and 8 for scoring, skill routing and the audit file template.
- `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md`: the source for every claim about engine behaviour.
- `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`: read when a finding touches claims, comparisons, reviews, forms or cookies.
- `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md`: tool names, costs and approval rules.
- `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md`: what to do without OpenSEO.
