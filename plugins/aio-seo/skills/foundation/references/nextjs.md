# Next.js: implementing the foundations

Reference implementation: `${CLAUDE_PLUGIN_ROOT}/templates/nextjs/` (read its `README.md` first). It was built and tested on Next.js 16.3 with the App Router. The templates are a starting point to adapt, never files to copy over the top of the repo's own.

## 1. Map what exists

Before copying anything, list for each template file whether the repo already has an equivalent:

| Template | Look for in the repo |
|---|---|
| `lib/seo/site.ts` | `lib/site.ts`, `constants`, `siteConfig`, `getSiteUrl()`, env vars like `NEXT_PUBLIC_SITE_URL` |
| `lib/seo/routes.ts` | a nav or route list, per-page `metadata` exports, a CMS route map |
| `lib/seo/content.ts` | `lib/content`, Contentlayer, Velite, MDX loaders, a CMS client (Notion, Sanity, Contentful) |
| `lib/seo/metadata.ts` | root `metadata` in `app/layout.tsx`, a `buildMetadata`/`generateSEO` helper |
| `lib/seo/jsonld.ts`, `validate.ts` | `structuredData.ts`, `schema.ts`, inline `application/ld+json` in pages |
| `app/robots.ts`, `app/sitemap.ts` | the same files, `public/robots.txt`, `public/sitemap.xml`, `next-sitemap` config |
| `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts` | `public/llms.txt`, `public/llms-full.txt` |
| `next.config.seo.ts` | `headers()`, `rewrites()`, `redirects()` already in `next.config.*` |
| `components/seo/*` | existing breadcrumb, FAQ, JSON-LD components |
| `tests/seo/*` | existing test folder and runner (vitest, jest, playwright) |
| `.github/workflows/*` | existing CI, deploy hooks, Vercel integration |

Rules:
- A static file in `public/` wins over a route with the same path. If you replace `public/robots.txt` or `public/llms.txt` with a generated route, delete the static file in the same commit and say so in the PR.
- If the repo has a working helper, extend it with the missing behaviour instead of adding a parallel one. Keep one source for each fact.
- Match the repo: import alias (`@/lib/seo/...`), file extension (`.ts` vs `.js`), test runner (port the vitest tests to jest syntax if needed), package manager in workflows (`npm ci` vs `pnpm install --frozen-lockfile`), formatting.
- If `project.repo_root` is a monorepo app folder, put files there and set the workflow `working-directory`.

## 2. Fill the site config

Copy `lib/seo/site.ts` and replace every `{{key}}` with the value at that path in `.agents/aio-seo/config.json`. Arrays (`same_as`, `area_served`, `knows_about`, `people`) become array literals. Leave a value empty rather than guessing. `tests/seo/metadata.test.ts` fails while any `{{` remains in `SITE`.

- `PRODUCTION_URL` must equal `project.site_url` and the host check-site found as canonical.
- `CRAWLER_POLICY` from config `crawlers` (preset chosen in step 5 of the skill).
- `VERIFICATION` reads env vars. If config holds `indexing.google_site_verification` or `indexing.bing_site_verification` and the repo already commits such tokens, inline them instead; otherwise tell the user to set the env vars in the host.
- `SITE.personPath` must match the real author or team page route.

## 3. Build the registry

- Replace the example `ROUTES` with one entry per public static page (walk `app/**/page.tsx`, skipping dynamic segments, route groups that are private, and anything under `project.private_paths`). Take titles and descriptions from the existing `metadata` exports; where one breaks the length tests, propose new copy in the PR rather than truncating mid-word.
- Set `lastModified` only from evidence: the page's last content commit (`git log -1 --format=%cs -- <file>`) or a date in the page. Never `new Date()`.
- Put campaign pages (launch, ads, partner landing pages) in `CAMPAIGN_ROUTES` and utility pages (thanks, confirm, search) in `UTILITY_ROUTES`. Make those pages export `buildMetadata(UTILITY_ROUTES.x)` so they render `noindex, follow`.
- `PRIVATE_PATHS` from `project.private_paths`. Check prefix traps (`/auth` blocks `/authors`).
- `CONTENT_COLLECTIONS` from `project.content_dirs` and `project.url_patterns`; set `schemaType` per collection (`BlogPosting` for blog, `TechArticle` for guides, `Article` for release notes). If the repo has its own loader, call it from `loadCollection` and map its fields to `ContentEntry`.
- Fill `sourceFiles` for each static route so IndexNow submits only what changed.

## 4. Wire pages and layout

- `app/layout.tsx`: `export const metadata = rootMetadata()` merged with any existing root metadata (keep icons, manifest, theme colour, analytics). Render `<JsonLd data={siteGraph()} />` once. Remove an existing site-wide Organization block only after moving its facts into config and `SITE`.
- Each static page: `export const metadata = buildMetadata(ROUTES.key)`.
- Content pages: `generateMetadata` returns `buildMetadata(contentPageMeta(entry, authorName))`; keep it free of uncached fetches under Cache Components.
- Replace inline JSON-LD with builder calls via `<JsonLd>` (see `/aio-seo:schema`).
- Breadcrumbs: use `<Breadcrumbs>` only where a visible trail exists or is wanted.

## 5. Routes, rewrites and headers

- Add `app/robots.ts`, `app/sitemap.ts`, `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts`, `app/md/[[...slug]]/route.ts`.
- Merge `seoRewrites()` into `rewrites().beforeFiles` and `seoHeaders()` into `headers()`. Use `seoRewrites({ negotiate: false })` unless the host keys its CDN cache on `Accept`.
- Markdown sources: content entries get a mirror automatically. For a static page, add `markdownFile` only when a markdown copy of its visible text exists or the user approves writing one; keep it in sync with the page.
- On Next.js below 16.3, `other` in robots rules is ignored: either accept no Content-Signal line or render robots.txt from a route handler (`app/robots.txt/route.ts`) using `buildRobotsRules()`.

## 6. IndexNow and CI

- Key file: `public/<key>.txt` containing only the key.
- `scripts/indexnow.ts` plus `.github/workflows/indexnow.yml` when `indexing.submit` is `after-deploy`. The workflow listens for `deployment_status` events (sent by Vercel and Netlify GitHub integrations) and skips previews. If the host does not send deployment events, trigger the script from the deploy pipeline instead and say so in the PR. Ask the user to set repo variables `INDEXNOW_KEY` and, if needed, `SITE_URL` and `PRODUCTION_ENVIRONMENT`.
- `.github/workflows/seo-checks.yml` and `lighthouserc.json`: adjust the install, build and start commands to `project.build_commands` and the package manager; list two to four key templates in `lighthouserc.json` (home, a product page, a content page).
- Add dev dependencies only if missing: `vitest` (or reuse jest), `tsx` for running the script locally. Mention each addition in the PR.

## 7. Verify

- `project.build_commands` all pass. `tests/seo/*` pass.
- After `next build`, `next start` locally (tell the user, stop it afterwards) and run `check-site.mjs --url http://localhost:<port> --sitemap-sample 10` to confirm robots, sitemap, llms files, markdown and head tags. Expect host-redirect findings locally; ignore those.
- Validate JSON-LD of a few built pages with `validate-jsonld.mjs`.

## Pages Router

Templates target the App Router. For `pages/`:
- robots.txt, sitemap.xml, llms.txt, llms-full.txt: a build script (run before `next build`) that writes them into `public/` from the same `lib/seo` modules: `buildRobotsRules()` rendered as text, `buildLlmsTxt()`, `buildLlmsFullTxt()` and a sitemap writer using the registry and content dates. Static files keep them fast and cacheable.
- Metadata: a `<Seo>` component using `next/head` that takes a `PageMeta`, renders title, description, canonical, robots, Open Graph and the markdown alternate link.
- Markdown mirror: build-time files in `public/` (`/blog/x.md`) generated from content, plus the same rewrites.
- `lib/seo/*` modules, tests and workflows work unchanged (remove the `next` type import from `metadata.ts` if `Metadata` is not used).
