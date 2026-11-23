# Testing structured data

Use all four layers. The first two run in CI; the last two are human checks after deploy.

## 1. Unit tests on the builders (every PR)

- Next.js template: `tests/seo/jsonld.test.ts` runs every builder through `validateJsonLd()` (`lib/seo/validate.ts`) and asserts zero errors with the site currency; it also asserts no review markup in any builder output, the entity line in Organization and WebSite, `sameAs` from config, and safe serialisation.
- Add one case per new builder and, where practical, one per real data set (each pricing plan list, each FAQ set, each content collection's first entry).
- The validator's rules: required properties per type, absolute URLs, ISO dates and durations, `dateModified` not before `datePublished`, prices as decimals with the expected currency, sequential list positions, banned review types and keys (error), unknown types (warning), FAQPage and HowTo (info: no rich result). It is stricter than Google in places (author required on articles, for example) because it checks the site's own output.

## 2. Validator on built or live HTML

```bash
# live pages
node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-jsonld.mjs" https://www.example.com/ https://www.example.com/blog/post --currency GBP
# built HTML files, or a JSON-LD file
node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-jsonld.mjs" .next/server/app/index.html out/blog/post.html schema.json --json
```

- Options: `--currency <ISO 4217>`, `--allow-reviews` (only for sites reviewing other businesses), `--strict` (warnings fail), `--json`.
- Exit code 1 on errors, so it can gate CI. Copy the script into the repo (`scripts/validate-jsonld.mjs`) for CI use; it has no dependencies.
- It also reports `@id` references that point at nodes not defined on the same page (graph warnings).
- **Limitation:** it fetches raw HTML with a plain GET. JSON-LD added by client-side JavaScript is not seen, and neither `curl` nor most AI crawlers see it. If a page's markup only appears after JavaScript runs, fix that first.
- `check-site.mjs` runs the same validator over a sitemap sample and reports error counts per page.

## 3. Google Rich Results Test (after deploy)

- https://search.google.com/test/rich-results, one URL per page type. It renders JavaScript like Googlebot and shows which rich results the page is eligible for, with errors and warnings by feature.
- Search Console: the Enhancements reports per feature and URL Inspection ("Test live URL", then view the detected structured data). Through OpenSEO, `inspect_urls` returns index status and, where available, rich-result verdicts.
- Expect "no items detected" for types that have no rich result (Organization, WebSite, CollectionPage, Service, FAQPage since May 2026). That is not an error.

## 4. Schema.org validator (after deploy)

- https://validator.schema.org/ checks the markup against the whole schema.org vocabulary (not Google's subset). Use it for types Google does not support and to catch misspelt properties. It reports what it sees; it does not judge eligibility.

## What to record

In the run log and PR: URLs checked, validator errors and warnings before and after, Rich Results Test outcome per page type (or "to check after deploy"), and anything only visible after rendering.
