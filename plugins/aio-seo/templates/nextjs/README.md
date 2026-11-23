# Next.js App Router SEO foundation (aio-seo template)

A typed reference implementation of the technical foundations: metadata, robots.txt with explicit AI crawler rules, sitemap with real `lastmod`, llms.txt and llms-full.txt, a markdown mirror, JSON-LD builders with an offline validator, IndexNow after deploy, and CI checks. Everything reads from one file, `lib/seo/site.ts`, filled from `.agents/aio-seo/config.json`.

`/aio-seo:foundation` installs this for you and adapts it to the repo. This README is for doing it by hand or reviewing what it did. Built and tested against Next.js 16.3 (App Router); the code is written to also work on Next.js 15, which was not tested (see "Version notes").

## Files

| File | What it does |
|---|---|
| `lib/seo/site.ts` | Site facts, entity line, currency/VAT, verification tokens, AI crawler policy. The only file with brand values. |
| `lib/seo/routes.ts` | Route registry: every static page with title, description, llms.txt summary, `lastModified`, noindex lists, private paths, changed-file mapping for IndexNow. |
| `lib/seo/content.ts` | Content adapter: reads `.md`/`.mdx` with frontmatter from `CONTENT_COLLECTIONS`. Replace the loader body if the repo has its own. |
| `lib/seo/metadata.ts` | `rootMetadata()`, `buildMetadata()`, `contentPageMeta()`, length limits. |
| `lib/seo/jsonld.ts` | Typed JSON-LD builders and `serializeJsonLd()` (escapes `<`, `>`, `&`, U+2028, U+2029). |
| `lib/seo/validate.ts` | Offline JSON-LD validator (same rules as the plugin's `scripts/validate-jsonld.mjs`). |
| `lib/seo/crawlers.ts` | robots.txt rules from the crawler policy; RFC 9309 matcher for tests. |
| `lib/seo/llms.ts` | Builds `/llms.txt` and `/llms-full.txt` from the registry and content. |
| `lib/seo/markdown.ts` | Markdown versions of pages that have a markdown source. |
| `app/robots.ts`, `app/sitemap.ts` | Next.js metadata routes. |
| `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts` | Static text routes. |
| `app/md/[[...slug]]/route.ts` | Markdown mirror, reached via the rewrites in `next.config.seo.ts`. |
| `next.config.seo.ts` | `seoRewrites()` (`/<path>.md` and `Accept: text/markdown`) and `seoHeaders()` (Link header). Merge into the existing config. |
| `components/seo/*.tsx` | `JsonLd`, `Breadcrumbs` (visible trail plus BreadcrumbList), `FaqList` (visible Q&A, optional FAQPage). Unstyled; pass `className`. |
| `scripts/indexnow.ts` | Submits changed URLs (`--changed`, `--sitemap --since`, `--url`). |
| `tests/seo/*.test.ts` | vitest: title/description lengths, uniqueness, robots vs private paths, sitemap/llms consistency, lastmod not build time, JSON-LD validity, no review markup, escaping. |
| `.github/workflows/indexnow.yml` | Runs the IndexNow script after a successful production deploy. |
| `.github/workflows/seo-checks.yml`, `lighthouserc.json` | Tests plus a Lighthouse SEO budget on every pull request. |

## Install by hand

1. Copy the files, keeping paths. If the repo uses an import alias (`@/lib/...`), switch the relative imports to it.
2. Fill every `{{...}}` in `lib/seo/site.ts` from `.agents/aio-seo/config.json`. `tests/seo/metadata.test.ts` fails while any remain.
3. Replace the example routes in `lib/seo/routes.ts` with the site's real pages. Set `lastModified` only from a real content change date.
4. Set `CONTENT_COLLECTIONS` in `lib/seo/content.ts` from config `project.content_dirs` and `project.url_patterns`, or point `loadCollection` at the existing loader.
5. In `app/layout.tsx`: `export const metadata = rootMetadata();` and render `<JsonLd data={siteGraph()} />` once.
6. In each page: `export const metadata = buildMetadata(ROUTES.pricing);` (or `contentPageMeta(entry, authorName)` for content), plus the page's JSON-LD from the builders. Campaign and utility pages use `buildMetadata(UTILITY_ROUTES.thanks)` so they are noindex.
7. Merge `seoRewrites()` and `seoHeaders()` into `next.config`. Pass `{ negotiate: false }` unless the CDN caches by `Accept` (Vercel does).
8. IndexNow: generate a key (`node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`), save it as `public/<key>.txt` containing only the key, set repo variable `INDEXNOW_KEY`, and keep `.github/workflows/indexnow.yml`.
9. Add `vitest` (and `tsx` for running the script locally) as dev dependencies if missing. Run lint, typecheck, `vitest run tests/seo` and the build.

## Decisions the site owner makes

- **AI crawler policy** (`CRAWLER_POLICY` in `site.ts`). Search and user-triggered crawlers are always allowed. Training crawlers, bulk harvesters, `Google-Extended` and `Applebot-Extended` are a business choice. `Google-Extended` also governs Gemini grounding, so blocking it costs Gemini answers, not only training. Keep `contentSignal` consistent with the choice; a test enforces it.
- **Verification.** Prefer DNS verification for Search Console (Domain property) and Bing Webmaster Tools. The meta-tag fallback reads `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION`. Bing also accepts a `BingSiteAuth.xml` file in `public/`, or importing the site from Search Console.
- **Canonical host.** `PRODUCTION_URL` must be the host the site finally resolves to (apex or www). Redirect the other host permanently (301/308) at the host or CDN.

## Version notes

- `robots.ts` emits `Content-Signal` through the rule `other` field, which Next.js supports from 16.3.0. On older versions the line is dropped silently; everything else works. To emit it on older versions, replace `app/robots.ts` with a route handler at `app/robots.txt/route.ts` that renders `buildRobotsRules()` as text.
- With Cache Components enabled, keep `generateMetadata` free of uncached data (use `'use cache'`), or metadata stops being prerendered.
- Next.js 16 renamed `middleware.ts` to `proxy.ts`; this template needs neither.

## What these files do not do

- llms.txt and llms-full.txt are cheap hygiene. Google says it does not use them and no major AI vendor has said it reads them. `llms-full.txt` is not part of the llms.txt proposal.
- The markdown mirror has no evidence of raising citations yet. It only serves pages with a real markdown source, so there is never a thin or different version for agents.
- JSON-LD earns rich results and helps entity understanding. Google states structured data is not required for its AI features.

Sources and dates for these statements: `references/knowledge-base.md` in the aio-seo plugin.
