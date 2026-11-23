---
name: pages
description: Plans and builds the evergreen hub pages a site needs beyond the blog, each shipped as a pull request: a guides hub with topic clusters, a central FAQ hub with reusable FAQ banks, and a glossary with definition pages. Picks pages from Search Console and keyword data, checks cannibalisation, and sources every factual claim. Use for "glossary", "FAQ hub", "FAQ page", "guides hub", "topic clusters", "definition pages", "which hub pages should we build", or "audit our FAQ and glossary".
argument-hint: "[plan | build <type> <slug> | audit]"
---

# Pages

Build the hub pages a site needs beyond the blog, from evidence, to a fixed standard per page type. Every page is a PR a human merges. Plan in `.agents/aio-seo/pages/page-plan.md`.

This skill covers three types: guides hub, FAQ hub and glossary. Comparison, alternatives, use-case, keyword landing and programmatic pages share the same plan file and come with Pro (`/aio-seo-pro:commercial-pages`).

## Non-negotiables

1. **PR only.** Branch `${git.branch_prefix}pages/<type>-<slug>`, run `project.build_commands`, open a PR. Never merge, never push to the default branch, never enable auto-merge.
2. **No invented facts.** Every definition, step, figure or claim has a source from this run or our own published pages. Unknown is `unknown`, never a guess. No number without a tool result or a cited source.
3. **No fake or self-serving reviews or ratings**, and no `Review`/`AggregateRating` markup for self-collected reviews (UK DMCC Act 2024 and Google policy, see `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`).
4. **No thin or doorway pages.** A page exists only if it serves a distinct query with content that is genuinely different from every other page. A glossary term gets its own page only when it has enough to say (see [glossary.md](references/glossary.md)).
5. **No cannibalisation.** Check the blog log, the page plan, existing routes and Search Console before creating a page. Improve the existing page instead when one already targets the query.
6. **House style**: `${CLAUDE_PLUGIN_ROOT}/references/writing-standards.md` and `house_rules` (British English, no em or en dashes, no reframes, no hype). Load `house_rules.voice_skill` if set.
7. **Read-only data.** Never contact anyone.

## Inputs (config keys)

Read `.agents/aio-seo/config.json` first. If missing, tell the user to run `/aio-seo:setup` and stop (`plan` and `audit` may still run read-only).

- `pages.enabled` (this skill builds `guides`, `faq` and `glossary`; other types in the list belong to Pro)
- `project.site_url`, `project.content_dirs.*`, `project.url_patterns.*`, `project.stack`, `project.build_commands`
- `entity.*`, `offer[]`, `audiences`, `branded_terms`, `excluded_patterns`
- `data.*`, `house_rules.*`, `git.*`, `sister_sites`

## Run modes

- `plan` (default when no argument): research, score and write the hub rows of the page plan. Builds nothing.
- `build <type> <slug>`: build one hub or one glossary entry as a PR.
- `audit`: read-only check of the existing guides hub, FAQ hub and glossary against the required sections; findings go to the plan.
- Make low-risk decisions and log them under "Assumptions made". Anything needing a business judgement goes in the plan as "needs human".

## Workflow

1. **Load state.** Read `.agents/aio-seo/pages/page-plan.md` (copy from `${CLAUDE_PLUGIN_ROOT}/templates/state/pages/page-plan.md` if missing), `.agents/aio-seo/state.md`, `.agents/aio-seo/blog/blog-log.md` and `blog/keywords.md` if present.
2. **Inventory existing routes.** List pages under each `project.content_dirs.*` and `project.url_patterns.*`, the sitemap, and any route registry. Record what exists per type, including existing FAQ blocks and definitions scattered across pages.
3. **Choose pages from data.** Follow [page-selection.md](references/page-selection.md): Search Console queries and pages, OpenSEO keyword data inside `data.credit_budget_per_run` (see `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md`), `offer[]`, `audiences`. Without OpenSEO, follow `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md` and label figures as estimated.
4. **Check cannibalisation** for every candidate (same reference).
5. **Score and write the plan.** Update `page-plan.md`: candidates with evidence, type, target URL, status, next review date. Leave rows of other types as they are. Stop here in `plan` mode.
6. **Gather and source the content**: definitions, steps, examples, FAQ answers, each with its source. Our own facts come only from our own site or config.
7. **Build the page** to its type reference (each lists required sections, schema and checks):
   - [guides-hub.md](references/guides-hub.md): guides index with topic clusters
   - [faq-hub.md](references/faq-hub.md): central FAQ hub and reusable FAQ banks
   - [glossary.md](references/glossary.md): glossary index and definition pages
   Follow the repo's existing patterns (data in typed modules or content files, one route per type). Schema per `/aio-seo:schema`; everything in schema visible on the page.
8. **Wire it in**: internal links from the hub and 2 to 4 relevant existing pages, sitemap, `llms.txt` if present, breadcrumbs. Add tests if the repo has a marketing test suite (unique FAQ questions, every guide listed once, JSON-LD valid, banned characters absent).
9. **Validate**: `project.build_commands`; `node ${CLAUDE_PLUGIN_ROOT}/scripts/content-lint.mjs` on new copy and `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-jsonld.mjs` on new JSON-LD. Optionally ask the `fact-checker` agent to check every factual claim against its source, and the `content-reviewer` agent for house style.
10. **Open the PR** with: evidence (query, impressions, position, source, range), page type and URL, sources list, cannibalisation check result, checks run, "Assumptions made" and "Not verified". Then stop.
11. **Update state**: `page-plan.md` (status, PR link, next review date), the `pages` section of `.agents/aio-seo/state.md`, and `.agents/aio-seo/runs/YYYY-MM-DD-pages.md`. Never delete history.

## Review cadence

- Guides hubs, FAQ hubs and glossaries: review when a new guide, FAQ or term ships, and at least quarterly.
- FAQ answers that quote numbers: re-check whenever the source constant or the pricing page changes.

## Outputs and state

- Code and content in the repo (one PR per hub or entry).
- `.agents/aio-seo/pages/page-plan.md`.
- `.agents/aio-seo/state.md` (pages section), `.agents/aio-seo/runs/YYYY-MM-DD-pages.md`.

## Report format

```
Pages run, YYYY-MM-DD (<mode>)
Built: <type> <URL>, PR <link> (not merged) | or: plan only
Plan: <n> candidates (<n> new), top 3: <type> <slug> (<evidence>)
Cannibalisation: <conflicts found and what was done>
Assumptions made: ...
Not verified: ...
```

## References

- [page-selection.md](references/page-selection.md): read in steps 3 to 5, every run.
- One reference per page type (step 7): read the one for the page you are building.
- Shared: `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`, `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md`, `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md`, `${CLAUDE_PLUGIN_ROOT}/references/writing-standards.md`.
