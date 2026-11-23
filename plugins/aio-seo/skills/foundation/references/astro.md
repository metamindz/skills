# Astro: implementing the foundations

Same checklist, Astro mechanisms. Keep the Next.js template's structure as the model: one config module with the site facts, one route registry, typed JSON-LD builders with the offline validator, generated text files, tests. Port the TypeScript from `${CLAUDE_PLUGIN_ROOT}/templates/nextjs/lib/seo/` into `src/lib/seo/`; `site.ts`, `jsonld.ts`, `validate.ts`, `crawlers.ts` and `llms.ts` have no Next.js dependency. Check the installed Astro version and its docs before using an API named here.

## Site config and canonical host

- `astro.config.*`: set `site` to `project.site_url` (the canonical host). Astro builds canonical and sitemap URLs from it.
- `trailingSlash`: pick one (`'never'` or `'always'`) to match current live URLs; a change creates redirects, so do not flip it casually.
- Host redirects (apex/www, http to https) belong to the host (Netlify `_redirects`, Vercel, Cloudflare).

## Metadata

- One `src/components/SeoHead.astro` that takes a `PageMeta` (title, description, path, noindex, type, dates) and renders `<title>`, meta description, `<link rel="canonical" href={new URL(path, Astro.site)}>`, `<meta name="robots" content="noindex, follow">` when needed, Open Graph, verification tags from env, and `<link rel="alternate" type="text/markdown">` where a markdown version exists.
- Use it in the base layout. Content collection entries (`src/content/`) supply title, description and dates from their schema; add `updated` to the collection schema if missing.
- Port `tests/seo/metadata.test.ts` to vitest (Astro projects commonly use it) reading the registry and `getCollection()` data, or a node script over the built `dist/` HTML.

## Sitemap

- `@astrojs/sitemap` integration: exclude private, campaign and utility paths with `filter`, and set `lastmod` per URL from content dates with `serialize` (map URL to the entry's `updated`). Never set a single global `lastmod` (that is the build-time mistake).
- Alternative for full control: an endpoint `src/pages/sitemap.xml.ts` built from the registry and collections.

## robots.txt, llms.txt, llms-full.txt

- Endpoints with prerendering: `src/pages/robots.txt.ts`, `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`, each exporting `GET` that returns `new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })`. Render robots from `buildRobotsRules()` (one `User-agent` line per token, then the rules, then `Content-Signal:` in the `*` group, then `Sitemap:`).
- Delete `public/robots.txt` if you add the endpoint, and say so in the PR.

## Markdown mirror

- Endpoint `src/pages/[...slug].md.ts` with `getStaticPaths()` over content collections, returning the entry body (`entry.body`) with a title, description and source line. Only for entries; static pages only if a markdown copy of the visible text exists.
- Content negotiation on `Accept` needs host support (Vercel rewrites with `has`, Netlify edge functions, Cloudflare). Skip it unless the CDN caches by `Accept`.

## Structured data

- `src/components/JsonLd.astro`: `<script type="application/ld+json" set:html={serializeJsonLd(data)} />` with the builder output. Never write JSON-LD by hand in pages.
- Organization and WebSite in the base layout; per-page types per `/aio-seo:schema`.

## Verification and IndexNow

- Verification meta tags from env in `SeoHead.astro`; `BingSiteAuth.xml` and `<key>.txt` in `public/`.
- IndexNow after deploy: copy `scripts/indexnow.ts` (it only needs the registry and content mapping) and `.github/workflows/indexnow.yml` from the Next.js template, and point `pathsForChangedFiles` at `src/content/<collection>/` paths. If the host does not send GitHub deployment events, run the script from the host's deploy hook instead.

## CI

- Run the SEO tests and a Lighthouse budget (`lighthouserc.json` with `startServerCommand` set to `astro preview`) on pull requests.
