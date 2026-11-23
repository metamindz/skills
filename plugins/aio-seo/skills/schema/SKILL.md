---
name: schema
description: Plan, implement, fix and test structured data (JSON-LD) for a website, page type by page type, using typed builders and an offline validator instead of hand-written markup. Covers Organization and WebSite with a stable @id graph and sameAs, Article and BlogPosting with real dates, release notes, BreadcrumbList, ItemList and CollectionPage hubs, ProfilePage for authors, SoftwareApplication and WebApplication for products and free tools, Product, Event, VideoObject, and what to remove (self-serving Review or AggregateRating, FAQPage or HowTo kept only for rich results). Use for "add schema", "structured data", "JSON-LD", "rich results", "fix schema errors", "Organization markup", "sameAs", "validate structured data", or when an audit routes a structured-data ticket here.
argument-hint: "[check | plan | apply] [url-or-page-type ...]"
---

# Schema: structured data that matches the page

Give every page type the structured data that earns a rich result or clarifies the entity, generated from typed builders and checked by a validator in tests and CI. Structured data describes what is visible on the page; it never adds claims of its own.

## Non-negotiables

- Ship code changes as a branch and pull request (prefix `git.branch_prefix`). Never merge, never push to the default branch, never enable auto-merge. Run `project.build_commands` before the PR.
- Builders only. All JSON-LD comes from typed builder functions (Next.js: `${CLAUDE_PLUGIN_ROOT}/templates/nextjs/lib/seo/jsonld.ts`) and is rendered by one component. No hand-written inline JSON-LD in pages, templates or CMS fields.
- Everything in the markup is visible on the page it describes, with the same values (prices, dates, names, questions and answers). Google's one positive instruction for AI features is that structured data matches the visible text [VERIFIED 2026-09].
- Never add Review, Rating or AggregateRating about the site's own organisation, products or services, including via embedded widgets. Remove existing self-serving review markup rather than "fixing" it. Reasons: Google treats self-controlled reviews as ineligible [VERIFIED 2026-09]; fake or undisclosed incentivised reviews breach Google policy and UK law (`${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`).
- One `@id` per entity, site-wide and stable (`<origin>/#organization`, `<origin>/#website`, `<page>#article`); other nodes point at it.
- Never sell structured data as an AI-citation lever. Justify it by rich-result eligibility and entity disambiguation only (`${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` section 5).
- Facts come from `.agents/aio-seo/config.json` and the page. No invented `sameAs` links, founding dates, prices, ratings or addresses. Empty stays empty.

## Inputs

- Config: `project.site_url`, `project.language`, `project.currency`, `project.prices_include_vat`, `project.stack`, `project.content_dirs`, `project.url_patterns`, `project.build_commands`; `entity.*` (all of it: `entity_line`, `legal_name` via `project.legal_name`, `disambiguation`, `founded`, `logo_path`, `contact_email`, `phone`, `address`, `company_number`, `vat_number`, `people`, `same_as`, `area_served`, `knows_about`); `offer[]` (names, types, `price_from`); `git.*`.
- State: newest `.agents/aio-seo/audits/*.md` (structured-data tickets), `.agents/aio-seo/offsite/entity-facts.md` (canonical facts and official profiles for `sameAs`), `.agents/aio-seo/state.md`.
- Live site, if reachable.

If config is missing, tell the user to run `/aio-seo:setup`. `check` mode can still run on URLs the user gives.

## Run modes

| Mode | What happens |
|---|---|
| `check [urls]` | Read-only: validate live pages and the repo's builders, report issues. Default in scheduled runs. |
| `plan` | `check` plus the per-page-type plan, no code. |
| `apply [page types]` | Implement or fix, open a PR. Default when the user asks to add or fix schema. |

## Workflow

1. **Load** config and state. Read knowledge-base section 5 and re-check any label older than six months before quoting it.

2. **Inventory what exists.**
   - Repo: grep for `application/ld+json`, `@context`, `schema.org`, existing builder modules, CMS schema fields, SEO plugin schema settings (WordPress).
   - Live: run the validator on the home page and one URL per page type (take them from the sitemap):
     ```bash
     node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-jsonld.mjs" <url> [<url> ...] --currency <project.currency> --json
     ```
     It fetches raw HTML only: JSON-LD injected by client-side JavaScript is not seen (and is invisible to AI crawlers that do not run JavaScript). If the repo injects JSON-LD client-side, record it as a finding and confirm the rendered markup with the Rich Results Test (step 7).
   - Note duplicate graphs (two Organization nodes with different `@id`s or facts), relative URLs, missing dates, deprecated types, review markup.

3. **Plan per page type.** Read `${CLAUDE_SKILL_DIR}/references/page-types.md`. For each page type the site has, list: the builder, required inputs and their source (config, frontmatter, pricing data), what must be visible on the page, and whether a Google rich result is available. Mark anything the page does not show as "not added" with the reason.

4. **Policies.** Apply `${CLAUDE_SKILL_DIR}/references/policies.md`: entity graph and `@id`s, `sameAs` sources, deprecated and restricted types, review rules, dates, prices and currency, multi-type nodes.

5. **Implement** (`apply` mode).
   - Next.js: use or extend `lib/seo/jsonld.ts` and `components/seo/json-ld.tsx` from the template; if the repo has its own builder module, extend that instead and add the missing builders with the same rules. Organization and WebSite go in the root layout once; page-level nodes in each page; combine with `graph()` when a page has several.
   - Other stacks: `${CLAUDE_SKILL_DIR}/references/other-stacks.md`.
   - New builder needed (Event, Course, Product, LocalBusiness subtype)? Add it next to the others, typed, using `compact()`, absolute URLs and the site currency, plus a test case.
   - Replace every hand-written block with a builder call. Remove self-serving review markup and FAQPage/HowTo blocks that exist only for rich results where the content is not visible; keep FAQPage only where the Q&A is on the page.

6. **Tests.** Every builder has a case in `tests/seo/jsonld.test.ts` (or the repo's equivalent) that runs the offline validator and asserts zero errors; the "no review markup" and serialisation tests stay. Add cases for new builders and for each page type's real data where practical (for example, every FAQ set, every pricing plan).

7. **Verify.** Read `${CLAUDE_SKILL_DIR}/references/testing.md`. Run `project.build_commands`, the validator on built HTML or a local server, and list the URLs for the human to check in Google's Rich Results Test and the Schema.org validator after deploy.

8. **PR, state and log.** PR body: page types covered, builders added or changed, markup removed and why, rich-result eligibility per type (yes, no, why), validator output before and after, human checks to do after deploy. Queue changed URLs as Pending in `.agents/aio-seo/indexing/log.md` (reason `schema PR`). Update the Schema section of `.agents/aio-seo/state.md`. Write `.agents/aio-seo/runs/YYYY-MM-DD-schema.md` with mode, pages checked, issues found and fixed, "Assumptions made", "Not verified" and "Knowledge base drift".

## Outputs

- PR with builders, page wiring and tests (`apply`).
- Run log, state section, indexing queue rows.

## Report to the user

- Pages and page types checked; errors, warnings and notes before and after.
- What was added, changed and removed, with the rich-result status of each type.
- PR link and test results.
- Human checks after deploy (Rich Results Test URLs).
- Not verified.
