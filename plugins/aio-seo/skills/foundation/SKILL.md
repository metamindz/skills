---
name: foundation
description: Set up or repair a website's technical SEO and AIO foundations and ship them as one pull request. Detects the stack, runs a live check, compares the site with the foundations checklist, then implements what is missing: robots.txt with explicit AI crawler rules and Content-Signal; sitemap with real lastmod dates; canonical host; metadata and length tests; noindex for campaign and utility pages, llms.txt and llms-full.txt from one route registry, markdown versions of pages, Search Console and Bing verification, IndexNow key and post-deploy workflow, typed JSON-LD via /aio-seo:schema, and a Lighthouse SEO budget in CI. Use for "set up SEO foundations", "technical SEO", "fix robots.txt", "allow AI crawlers", "add llms.txt", "sitemap", "IndexNow", "verify Search Console", or after /aio-seo:setup.
argument-hint: "[check | plan | apply] [area ...]"
---

# Foundation: technical SEO and AIO groundwork

Get a site crawlable, indexable, consistent and machine-readable, then keep it that way with tests and CI. Next.js App Router sites get the reference implementation in `${CLAUDE_PLUGIN_ROOT}/templates/nextjs/`; other stacks get the equivalent steps from this skill's references. Everything ships as one branch and pull request.

## Non-negotiables

- Ship as a branch and pull request (prefix from config `git.branch_prefix`). Never merge, never push to the default branch, never enable auto-merge. Run every command in `project.build_commands` before opening the PR and report the results.
- Adapt to the repo. Read its conventions first (import alias, folder layout, package manager, test runner, existing SEO helpers) and change the templates to fit. Never overwrite a file wholesale when the repo already has one: merge, and explain each change in the PR.
- Never delete or disable existing SEO setup (redirects, robots rules, schema, verification tags, analytics, sitemap entries) without saying in the PR what it was, why it goes, and what replaces it. If unsure, keep it and record the question.
- The AI crawler policy is the site owner's decision. Never block search or user-triggered crawlers. Never block `Google-Extended` without explaining that it also controls Gemini grounding (see `${CLAUDE_SKILL_DIR}/references/crawler-policy.md`).
- Be honest about weak levers. llms.txt, llms-full.txt and markdown mirrors are cheap hygiene with no evidence of ranking or citation effect; JSON-LD earns rich results and entity clarity, not AI citations. Say so in the PR. Labels and sources: `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` sections 1, 2, 5 and 6.
- No invented facts. Every value in site config, schema and llms.txt comes from `.agents/aio-seo/config.json`, the repo or the live site. Missing values stay empty and are listed under "Not verified".
- No self-serving Review or AggregateRating markup, ever (`${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`).
- Never submit anything to IndexNow, Search Console or Bing from this skill. Hand submission to `/aio-seo:indexing`.

## Inputs

Read `.agents/aio-seo/config.json` first. If it is missing, tell the user to run `/aio-seo:setup` and stop; `check` mode may still run read-only against a URL the user gives.

- `project.*`: `name`, `legal_name`, `site_url`, `language`, `locale`, `currency`, `prices_include_vat`, `stack`, `repo_root`, `content_dirs`, `url_patterns`, `private_paths`, `build_commands`
- `entity.*`: `entity_line` (used verbatim), `short_description`, `disambiguation`, `category`, `founded`, `logo_path`, `contact_email`, `phone`, `address`, `company_number`, `vat_number`, `people`, `same_as`, `area_served`, `knows_about`
- `indexing.*`: `indexnow_key`, `indexnow_key_path`, `submit`, `search_console_verified`, `bing_verified`, and if present `google_site_verification`, `bing_site_verification`
- `crawlers.*` if present (the recorded crawler decision: `training`, `bulk`, `google_extended`, `applebot_extended`, `content_signal`)
- `git.*`, `house_rules.*`
- State: `.agents/aio-seo/state.md`, the newest `.agents/aio-seo/audits/*.md` (open foundation tickets), `.agents/aio-seo/indexing/log.md`

## Run modes

| Mode | When | What happens |
|---|---|---|
| `check` | "is our technical SEO OK?", scheduled runs | Steps 1 to 4 only. Read-only. Writes a gap report to the run log. |
| `plan` | user wants to see the work first | Steps 1 to 5, then stops with the plan and the decisions needed. |
| `apply` (default when interactive) | "set it up", after `/aio-seo:setup` | All steps. Asks the decisions in step 5, then builds and opens the PR. |
| `apply <area ...>` | a single gap (`robots`, `sitemap`, `llms`, `markdown`, `metadata`, `verification`, `indexnow`, `schema`, `ci`) | Same steps limited to those areas. |

Scheduled or unattended runs: run `check` only, unless the run was explicitly configured as `apply` and every decision in step 5 is already recorded in config. Never pick a crawler policy unattended that differs from what is live; log the gap instead.

## Workflow

1. **Load and orient.** Read config and state. Work inside `project.repo_root`. Create a branch `<git.branch_prefix>foundation-YYYY-MM-DD` before any edit in `apply` mode.

2. **Detect the stack and conventions.** Confirm `project.stack` against the repo (package.json `next` version and `app/` vs `pages/`, `astro.config.*`, `wp-content/` or a WordPress host, plain HTML or another generator). Record: framework and version, router, TypeScript or JavaScript, import alias, package manager, test runner, CI provider, hosting/CDN (Vercel, Netlify, Cloudflare), and every existing SEO file: `robots.*`, `sitemap*`, `llms*.txt`, metadata helpers, JSON-LD (inline or helpers), verification tags or files, redirects, IndexNow key files and scripts, Lighthouse config.

3. **Live check.** If the site is live, run:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/check-site.mjs" --url <project.site_url> --sitemap-sample 20 --currency <project.currency> [--indexnow-key <indexing.indexnow_key>] --json
   ```
   Save the output as `.agents/aio-seo/runs/data/YYYY-MM-DD-check-site.json`. It covers apex/www/https redirects, robots.txt per AI bot, Content-Signal; sitemap and lastmod quality, a page sample (status, canonical, meta robots, X-Robots-Tag, title and description length, H1 count, JSON-LD types and errors, HTML size), llms files, markdown mirror and the IndexNow key file. It cannot see DNS verification, JavaScript-injected content or Core Web Vitals. If it fails (site down, behind auth, bot-blocked by a CDN), record why; a CDN or WAF blocking crawlers is a high-priority finding.

4. **Compare with the checklist.** Read `${CLAUDE_SKILL_DIR}/references/checklist.md` and fill its table for this site: status (done, partial, missing, not applicable), evidence (file path or check-site finding) and the fix. Include open foundation tickets from the latest audit.

5. **Decisions.** Ask in one round (AskUserQuestion when interactive), with a recommendation for each; in an unattended `apply` run, use what config records and stop on anything unrecorded:
   - **AI crawler policy.** Read `${CLAUDE_SKILL_DIR}/references/crawler-policy.md` and present its presets. Record the answer in config `crawlers` (add the block if missing; tell the user it is new).
   - **Canonical host** if `check-site` shows apex and www both serving 200, or a temporary redirect: confirm which host is canonical. It must equal `project.site_url`.
   - **Verification method** for Search Console and Bing: DNS (recommended), meta tag, or file. See the verification section of the checklist.
   - **Markdown negotiation** (`Accept: text/markdown`): only if the CDN keys its cache on `Accept` (Vercel does [VERIFIED 2026-09]); otherwise `.md` URLs only.
   - **llms.txt / llms-full.txt:** generate from the registry (recommended, cheap) or skip. If the site already has a hand-written file, offer to replace it with a generated one and show the diff in the PR; never silently drop its content.
   In `plan` mode, stop here and output the plan.

6. **Implement for the stack.**
   - Next.js App Router: follow `${CLAUDE_SKILL_DIR}/references/nextjs.md` (uses `${CLAUDE_PLUGIN_ROOT}/templates/nextjs/`).
   - Next.js Pages Router: follow `nextjs.md`, section "Pages Router".
   - Astro: `${CLAUDE_SKILL_DIR}/references/astro.md`.
   - WordPress: `${CLAUDE_SKILL_DIR}/references/wordpress.md`.
   - Static sites and other frameworks (Hugo, Jekyll, Eleventy, Nuxt, SvelteKit, Gatsby, Remix): `${CLAUDE_SKILL_DIR}/references/static-and-other.md`.
   Cover every checklist row marked partial or missing, in this order: canonical host and redirects, robots.txt and crawler policy, private paths and noindex pages, metadata and length limits, sitemap with real dates, structured data, llms files, markdown mirror, verification, IndexNow, tests and CI.

7. **Structured data.** Follow `/aio-seo:schema` (read `${CLAUDE_PLUGIN_ROOT}/skills/schema/SKILL.md`) for the per-page-type plan. In this PR, at minimum: one Organization and one WebSite node site-wide with the entity line verbatim and `sameAs` from `entity.same_as`, BreadcrumbList where breadcrumbs are visible, Article/BlogPosting with real dates on content, and removal of hand-written inline JSON-LD in favour of the builders. Replace self-serving review markup and explain it in the PR.

8. **IndexNow.** If `indexing.indexnow_key` is empty, generate 32 lowercase hex characters (`node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`) and save it to config. Serve it as a static file at the site root (`<key>.txt`, body exactly the key) and set `indexing.indexnow_key_path`. If `indexing.submit` is `after-deploy`, add the post-deploy workflow for the stack. The key is public by design. Do not submit anything.

9. **Verify locally.** Run `project.build_commands` (lint, typecheck, test, build). For Next.js also run the template tests (`tests/seo/*.test.ts`). Start nothing long-running without telling the user. Validate JSON-LD in built HTML if possible:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-jsonld.mjs" <built-html-file-or-local-url> --currency <project.currency>
   ```
   Fix failures before the PR. If a command cannot run (missing env, no network), say so under "Not verified".

10. **Pull request.** Commit with clear messages; push the branch only if `git.push` is true or the user asks; open the PR (if push is off, leave the branch and give the user the command). PR body:
    - Summary of the gaps closed (the checklist table, before and after).
    - Decisions taken (crawler policy and why, canonical host, verification method, markdown negotiation, llms files), each with who decided.
    - Anything existing that was changed or removed, with the reason.
    - What these changes do not do (llms.txt and markdown honesty line, schema is not an AI-citation lever).
    - Human steps after merge (step 11).
    - Test and build results; "Not verified" list.

11. **Hand-offs and human steps.** Write the after-merge steps into the PR and the run log: verify Search Console and Bing (DNS preferred), submit the sitemap in both, check the CDN/WAF bot settings, set the `INDEXNOW_KEY` repo variable. Tell the user to run `/aio-seo:indexing` after the first production deploy. Queue every new or changed public URL in `.agents/aio-seo/indexing/log.md` under Pending (create it from `${CLAUDE_PLUGIN_ROOT}/templates/state/indexing/log.md` if missing), reason `foundation PR`, note `waits for deploy`.

12. **State and log.** Update the Foundation section of `.agents/aio-seo/state.md` (date, PR link, checklist score, open decisions). Write `.agents/aio-seo/runs/YYYY-MM-DD-foundation.md` with: mode, stack detected, check-site summary, checklist table, decisions, files changed, commands run and results, "Assumptions made", "Not verified", and "Knowledge base drift" if any source disagreed with the knowledge base. Never delete earlier run logs.

## Outputs

- Branch and PR (in `apply` mode), with the template files adapted to the repo.
- Config updates: `crawlers`, `indexing.indexnow_key`, `indexing.indexnow_key_path` (each called out to the user).
- `.agents/aio-seo/runs/YYYY-MM-DD-foundation.md`, `.agents/aio-seo/runs/data/YYYY-MM-DD-check-site.json`, the Foundation section of `state.md`, Pending rows in `indexing/log.md`.

## Report to the user

Keep it short, bullets:
- Stack detected and mode run.
- Checklist: done / partial / missing counts, and the top three gaps.
- Decisions taken (and which were assumptions).
- PR link or branch name, and test/build results.
- Human steps, in order.
- Not verified.
