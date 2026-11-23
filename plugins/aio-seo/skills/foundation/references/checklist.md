# Foundations checklist

Fill one row per item for the site: status (`done`, `partial`, `missing`, `n/a`), evidence (file path, check-site finding, or "not checked") and the fix. Copy the table into the run log and the PR. Rows marked **(test)** must also be enforced by an automated test or CI step, not only fixed once.

Statements about search engine behaviour carry the label and source from `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md`; re-check any label older than six months before quoting it.

## A. Host, crawl and index

| # | Item | How to check | Fix (Next.js file in templates/nextjs) |
|---|---|---|---|
| A1 | One canonical host. The other host (apex or www) and `http://` redirect permanently (301/308) to `project.site_url` in one hop where possible | check-site "Host and redirects" | Host or CDN redirect; `PRODUCTION_URL` in `lib/seo/site.ts` |
| A2 | Every page has one `rel="canonical"` in the server HTML, absolute, on the canonical host, self-referencing unless deliberately pointing elsewhere. Set in HTML, never changed by JavaScript [VERIFIED 2026-09, knowledge-base section 2] | check-site page table | `buildMetadata()` `alternates.canonical` with `metadataBase` |
| A3 | robots.txt reachable at the root, 200, plain text, with a `Sitemap:` line on the canonical host | check-site robots section | `app/robots.ts` |
| A4 | Private areas (`project.private_paths`) disallowed for every crawler, including in every explicit bot group (a bot that matches its own group ignores `*`) **(test)** | robots table; `tests/seo/seo-files.test.ts` | `PRIVATE_PATHS` in `lib/seo/routes.ts`, `lib/seo/crawlers.ts` |
| A5 | No indexable page blocked by robots (watch prefix traps: `/auth` also blocks `/authors`; use `/auth/` plus `/auth$`) **(test)** | check-site "blocked for Googlebot" | `robotsAllows()` test |
| A6 | Explicit groups for current AI crawlers, decided by the owner; search and user-triggered crawlers never blocked; retired tokens (`anthropic-ai`, `Claude-Web`) absent [VERIFIED 2026-09] **(test)** | check-site bot table | `CRAWLER_POLICY`, `crawler-policy.md` |
| A7 | Content-Signal line consistent with the crawler choices (optional; Cloudflare syntax, no formal standing [VERIFIED 2026-09]) **(test)** | check-site robots section | `CRAWLER_POLICY.contentSignal`; needs Next.js 16.3+ for `other` |
| A8 | CDN/WAF bot settings do not block the crawlers robots.txt allows (Cloudflare AI controls, Vercel AI Bots ruleset) [VERIFIED 2026-09, knowledge-base section 1] | ask the user or read the dashboard; check-site fetch failures | Human step in the PR |
| A9 | Campaign, utility, thank-you, search-result and thin pages are `noindex, follow`, and absent from sitemap, llms.txt and IndexNow **(test)** | check-site meta robots; registry | `CAMPAIGN_ROUTES`, `UTILITY_ROUTES` |
| A10 | Sitemap lists every indexable URL once, on the canonical host, with no redirects, no noindex and no private URLs **(test)** | check-site sitemap and page sample | `app/sitemap.ts` |
| A11 | Sitemap `lastmod` comes from real content dates, never build or request time. No lastmod is better than a wrong one **(test: output identical at two different system times)** | check-site "identical lastmod" warning | route `lastModified`, content `updated` |
| A12 | HTML under 2MB including inline JSON-LD and framework payloads (Googlebot reportedly indexes the first 2MB [REPORTED 2026-09]) | check-site HTML size | Trim inline payloads |
| A13 | Primary content, headings, claims and JSON-LD in server-rendered HTML (major AI crawlers do not run JavaScript [VERIFIED 2026-09 as figures, study from 2024 to 2025]) | check-site sees titles, H1 and JSON-LD in raw HTML | Server Components; no client-only JSON-LD |

## B. Metadata

| # | Item | How to check | Fix |
|---|---|---|---|
| B1 | Unique title per page, 1 to 60 characters (house rule: roughly 51 to 60 is the least-rewritten band [VERIFIED 2026-09, knowledge-base section 3]) **(test)** | check-site; `tests/seo/metadata.test.ts` | `ROUTES` titles, `brandedTitle()` |
| B2 | Unique meta description, 50 to 160 characters (house rule; Google sets no limit, display truncates) **(test)** | same | `ROUTES` descriptions |
| B3 | One H1 per page that matches the title's intent | check-site H1 count | Page components |
| B4 | Root description is the entity line, verbatim; Organization, WebSite and llms.txt use the same sentence **(test)** | `rootMetadata()` test, llms test | `SITE.entityLine` |
| B5 | Open Graph and Twitter tags with absolute URLs, locale from config | page source | `buildMetadata()` |
| B6 | Metadata statically resolvable (Next.js Cache Components: no uncached data in `generateMetadata`) [VERIFIED 2026-09] | build warnings | `'use cache'` or registry-based metadata |
| B7 | No em or en dashes in titles and descriptions (house style) **(test)** | metadata test | Copy edits |

## C. Machine-readable extras

| # | Item | How to check | Fix |
|---|---|---|---|
| C1 | Typed JSON-LD builders only; no hand-written inline JSON-LD; offline validator in tests **(test)** | grep for `application/ld+json` outside the JsonLd component | `lib/seo/jsonld.ts`, `validate.ts`, `/aio-seo:schema` |
| C2 | Organization `sameAs` filled from `entity.same_as` (official profiles only) | validator warning | `SITE.sameAs` |
| C3 | llms.txt generated from the route registry: H1, blockquote with the entity line, grouped links, no private or noindex URLs **(test)** | check-site llms section | `lib/seo/llms.ts` |
| C4 | llms-full.txt generated from the same registry with the full markdown of pages that have a markdown source | check-site | `buildLlmsFullTxt()` |
| C5 | Markdown versions at `/<path>.md` for pages with a real markdown source, advertised with `rel="alternate" type="text/markdown"`, HTML canonical in a `Link` header, `Vary: Accept` when negotiating | check-site markdown section | `lib/seo/markdown.ts`, `app/md/...`, `next.config.seo.ts` |
| C6 | Link header on the home page advertising llms.txt (llms.txt v2 discovery; no crawler known to rely on it) | check-site | `seoHeaders()` |

Honesty line for C3 to C6, to repeat in the PR: Google says it does not use llms.txt or markdown files for Search and they "won't negatively or positively impact your visibility or rankings" [VERIFIED 2026-09]; no major AI vendor has said it reads third-party llms.txt [VERIFIED 2026-09, absence confirmed]; `llms-full.txt` is not part of the llms.txt proposal [VERIFIED 2026-09, absence confirmed]; markdown variants have no evidence of citation benefit [REPORTED 2026-09]. Sources in knowledge-base sections 2 and 6.

## D. Verification and indexing

| # | Item | How to check | Fix |
|---|---|---|---|
| D1 | Search Console: Domain property verified by DNS TXT record (covers every protocol and subdomain; required for Domain properties). Meta tag `google-site-verification` only as a fallback for a URL-prefix property [VERIFIED 2026-11] https://support.google.com/webmasters/answer/9008080 | config `indexing.search_console_verified`; ask | Human step; meta tag via `VERIFICATION.google` |
| D2 | Bing Webmaster Tools verified: import from Search Console, DNS CNAME, `BingSiteAuth.xml` at the root, or the meta tag Bing shows [VERIFIED 2026-11] https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b | config `indexing.bing_verified`; ask | Human step; file in `public/` or `VERIFICATION.bing` |
| D3 | Sitemap submitted in Search Console and Bing Webmaster Tools (sitemap ping was deprecated in 2023 [VERIFIED 2026-09]) | ask; `/aio-seo:indexing` | Human step |
| D4 | IndexNow key file at `<origin>/<key>.txt` on the canonical host, body exactly the key (8 to 128 characters of a-z, A-Z, 0-9, "-") [VERIFIED 2026-11] https://www.indexnow.org/documentation | `check-site.mjs --indexnow-key` | Static file |
| D5 | IndexNow submission automated after production deploy (changed URLs only), not manual | CI config | `.github/workflows/indexnow.yml` + `scripts/indexnow.ts` |
| D6 | Search Console "Search generative AI" setting reads Include, and the team knows the generative AI performance report exists (impressions only) [VERIFIED 2026-09, knowledge-base section 10] | ask | Human step |

## E. Guard rails

| # | Item | How to check | Fix |
|---|---|---|---|
| E1 | SEO tests run in CI on every PR | CI config | `.github/workflows/seo-checks.yml` |
| E2 | Lighthouse SEO category budget (house rule: 0.95) and lab LCP/CLS warnings on key templates | CI config | `lighthouserc.json` |
| E3 | Next.js 16: no crawler or redirect logic left in `middleware.ts` after the rename to `proxy.ts` [VERIFIED 2026-09] | file tree | Codemod, in a separate PR if large |

## Scoring for the report

Count `done` against applicable rows. Report the three most important open rows first, in this priority: anything that blocks crawling or indexing (A1 to A6, A8, A10), then wrong signals (A11, B1 to B4, C1), then the rest.
