---
name: setup
description: Guided setup wizard for the AIO & SEO Kit. Detects the site's stack, interviews the user about the business, connects a search data source (OpenSEO recommended, with fallbacks), writes .agents/aio-seo/config.json and the state files, runs a free baseline check, and offers the foundations PR and the first content plan. Use when the user says "set up aio-seo", "set up SEO", "get us listed on ChatGPT/AI tools", "start the SEO kit", "onboard this project", "resume setup", or runs /aio-seo:setup on a new or existing project.
argument-hint: "[resume | reconfigure | <site url>]"
---

# AIO & SEO Kit: setup wizard

Takes a new or existing project from nothing to a working SEO + AIO system in one guided session. Everything the other skills need comes from what this wizard writes, so be thorough and confirm what you inferred.

## Non-negotiables

1. **Ask, do not assume, for business facts.** Infer what you can from the repo and the live site, then show it to the user to confirm. Mark anything still inferred with `"_inferred": [...]` in the config and in the summary.
2. **Never invent facts** (company numbers, addresses, prices, people, review counts). Leave fields empty rather than guess.
3. **Ask before anything outward-facing or account-related**: installing plugins or MCP servers, signing up for services, writing to analytics or Search Console settings, opening a PR. One clear question each, with the user's answer as consent.
4. **No paid OpenSEO calls during setup** except an `estimate_*` call, unless the user approves a specific spend.
5. **Changes ship as a branch + PR.** Never merge, never push to the default branch.
6. **House rules**: British English, no em or en dashes, plain bullets. These apply to everything you write in the repo and to your messages.

## Modes

| Mode | Trigger | What runs |
|---|---|---|
| Fresh | no `.agents/aio-seo/config.json` | Steps 1 to 10 |
| Resume | config exists with `"_setup": {"completed": false}` or argument `resume` | Read `_setup.done`, continue from the first unfinished step |
| Reconfigure | argument `reconfigure` or user asks to change answers | Step 3 for the sections the user names, then step 5, then summary |

Track progress in config under `_setup`: `{ "completed": false, "done": ["detect", "interview", ...], "pending_human": [...] }`. Update it after every step so an interrupted wizard can resume (for example after a reload to load OpenSEO tools).

## Workflow

### Step 1: Preflight and welcome

1. Confirm the working directory is the website's repo (look for `package.json`, `astro.config.*`, `next.config.*`, `wp-config.php`, `index.html`, `.git`). If it is not, ask the user to open the repo folder and stop.
2. Run `git status`. If there are uncommitted changes, tell the user; do not touch them.
3. Tell the user in 4 to 6 bullets what the wizard will do and that nothing is published or sent without their OK.
4. Ask the opening questions with one AskUserQuestion call (up to 4 questions): new project or existing live site; the site URL (prefill from detection); the main market and language (default UK, en-GB, GBP); the business type (software product, services or agency, ecommerce, local business, publisher or community).

### Step 2: Detect the stack and the current state

Read `${CLAUDE_SKILL_DIR}/references/detection.md` and follow it. Record: framework and version, router, content directories and formats, existing SEO files (robots, sitemap, llms.txt, llms-full.txt, JSON-LD, verification tags, IndexNow key), build/lint/test commands, deploy target, git remote, analytics present. If the site is live, run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/check-site.mjs" --url <site_url> --sitemap-sample 10
```

Keep the output for step 7. A failure here is not fatal; note it.

### Step 3: Interview

Read `${CLAUDE_SKILL_DIR}/references/interview.md`. Draft answers first from the homepage, README, package metadata, existing schema and meta tags, then ask the user to confirm or edit in at most four AskUserQuestion rounds:

- **Round A, the entity**: brand name, legal name, one-sentence entity line (the single sentence that will be used verbatim everywhere), category, disambiguation if the name is shared with something else.
- **Round B, the offer**: services/products with URLs, which are core (weight 1.0) and secondary (0.5), audiences, price-from if public.
- **Round C, the landscape**: competitors (3 to 8), branded terms, terms to exclude, sister sites.
- **Round D, voice and modules**: voice skill or default house rules, author/people for bylines, which modules to switch on (blog, pages, AI visibility, off-site; free tools if Pro is installed), Slack channel for reports (optional).

For free-text answers (the entity line, offer list) show your draft in the question and let the user pick it or type their own.

### Step 4: Connect a search data source

Read `${CLAUDE_SKILL_DIR}/references/openseo.md` and follow it exactly, including the referral disclosure. Outcomes, in order of preference:

1. OpenSEO connected and the project matched (or created; free) and Search Console + GA4 attached.
2. OpenSEO installed but needs a reload or sign-in: record `pending_human`, continue with the other steps, verify on resume.
3. User declines: set `data.provider` to `gsc-mcp` if a Search Console MCP is loaded, otherwise `manual-exports`, and point to `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md`.

### Step 5: Write config and state

1. Copy `${CLAUDE_PLUGIN_ROOT}/templates/config.template.json` to `.agents/aio-seo/config.json` and fill it from steps 1 to 4. Field meanings: `${CLAUDE_PLUGIN_ROOT}/references/config-reference.md`. Set `house_rules.check_globs` to the real content directories found in step 2 so the house-style hook checks the right files.
2. Create the state tree by copying `${CLAUDE_PLUGIN_ROOT}/templates/state/` to `.agents/aio-seo/` without overwriting existing files. Fill `.agents/aio-seo/offsite/entity-facts.md` from the interview.
3. Write `.agents/aio-seo/state.md` from `${CLAUDE_PLUGIN_ROOT}/templates/state/state.md`.
4. Generate an IndexNow key if there is none: 32 lowercase hex characters (`node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`). Save it in config `indexing.indexnow_key`; `/aio-seo:foundation` serves the key file.
5. Show the user the filled config as a short table of the important fields and ask them to confirm. Fix anything they change.

### Step 6: Human checklist

Write `.agents/aio-seo/setup-checklist.md` from `${CLAUDE_SKILL_DIR}/references/human-checklist.md`, filled with the user's URLs. It covers what only a person can do: verify the site in Google Search Console and Bing Webmaster Tools (DNS preferred), submit the sitemap in both, connect Search Console and GA4 inside OpenSEO, allow AI bots in the CDN or firewall if it blocks them, claim ChatGPT Business Hub, and Google Business Profile, Bing Places and Apple Business Connect where they fit the business. Mark items already done from detection. Then offer, in an interactive run with Claude in Chrome available, to do the Search Console and Bing sitemap steps in the user's Chrome with `/aio-seo:indexing assist` (approval per action).

### Step 7: Baseline

Run `/aio-seo:audit` in baseline mode (free reads only, no paid audit). If it cannot run (no live site yet), write a short "pre-launch baseline" listing what will be measured after launch. Show the top 5 findings.

### Step 8: First changes (each needs a yes)

Offer, in this order, one question at a time, and run the chosen skill:

1. `/aio-seo:foundation`: robots with AI crawler rules, sitemap, llms.txt and llms-full.txt, markdown mirrors, metadata, verification tags, IndexNow key and post-deploy workflow, structured data via `/aio-seo:schema`. Opens one PR.
2. `/aio-seo:blog` in plan-only mode: builds the first ranked topic queue from free data.
3. `/aio-seo:ai-visibility` setup mode: drafts the buyer prompt set. Paid tracking only after an estimate and an explicit yes.
4. `/aio-seo:offsite` phase 1: entity consistency audit and drafts.

For a new project with no live site, replace 2 with a `/aio-seo:pages` launch plan (guides hub, FAQ hub, glossary) and skip 3 until the site is live.

### Step 9: Running the skills

Tell the user, in one short paragraph, that every skill can be run by hand whenever they like (for example `/aio-seo:blog` once a week and `/aio-seo:maintain` once a month), and that the IndexNow workflow from `/aio-seo:foundation` already runs on every deploy. Recurring scheduled runs come with AIO & SEO Kit Pro (`/aio-seo-pro:autopilot`). Do not create schedules here.

### Step 10: Summary

Set `_setup.completed: true` (or list what is pending). Commit the `.agents/aio-seo/` files on a branch named `<git.branch_prefix>setup` and open a PR only if the user agrees. Then give the user:

- What is set up (bullets).
- What is waiting on them (from the checklist), with links.
- The commands to use next: `/aio-seo:blog`, `/aio-seo:pages`, `/aio-seo:ai-visibility`, `/aio-seo:maintain`, `/aio-seo:indexing`, `/aio-seo:report`, `/aio-seo:audit`.
- Assumptions made and anything not verified.

## Outputs

- `.agents/aio-seo/config.json`, `.agents/aio-seo/state.md`, the state tree, `.agents/aio-seo/setup-checklist.md`, `.agents/aio-seo/runs/YYYY-MM-DD-setup.md`.
- Optional: foundations PR, first topic queue, prompt set, entity facts.
