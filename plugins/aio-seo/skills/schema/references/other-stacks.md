# Structured data on stacks other than Next.js

The rules are the same everywhere: typed builders, one rendering point, validator in CI, no hand-written blocks.

## Astro, SvelteKit, Nuxt, Remix, Gatsby, Eleventy

- Copy `lib/seo/jsonld.ts`, `lib/seo/validate.ts` and the `SITE` part of `lib/seo/site.ts` from `${CLAUDE_PLUGIN_ROOT}/templates/nextjs/` into the repo's lib folder. They have no Next.js dependency.
- Render with one component that outputs `<script type="application/ld+json">` containing `serializeJsonLd(data)`:
  - Astro: `<script type="application/ld+json" set:html={serializeJsonLd(data)} />`
  - Svelte: inside `<svelte:head>`, `{@html '<script type="application/ld+json">' + serializeJsonLd(data) + '</' + 'script>'}` (split the closing tag so the Svelte parser does not end the block early)
  - Vue/Nuxt: `useHead({ script: [{ type: 'application/ld+json', innerHTML: serializeJsonLd(data) }] })`
  - React-based (Remix, Gatsby): the same `JsonLd` component as the template.
- Port `tests/seo/jsonld.test.ts` to the repo's test runner.

## WordPress

- One SEO plugin owns the schema graph (Yoast SEO, Rank Math or All in One SEO). Configure the organisation (name, logo, social profiles as `sameAs`, contact) from config `entity`, and the person for author pages.
- Remove schema from themes, page builders or extra plugins that duplicates the SEO plugin's graph (check-site shows two Organization nodes, or the validator reports conflicting `@id`s).
- Turn off any review or rating schema for the business's own products or services.
- Extra types the plugin does not cover: add them through the plugin's documented schema filters in a must-use plugin, built from PHP arrays and `wp_json_encode()`; check the installed plugin version's developer docs for the filter name before using one.
- Validate live pages with `validate-jsonld.mjs` after each change.

## Static sites and plain HTML

- Generate JSON-LD at build time from a data file (`seo.config.json` from `.agents/aio-seo/config.json`, frontmatter per page) with the builder functions, and inject it into the head template.
- If there is no build step, keep each block in a separate `.json` file per page type, validate the files in CI (`validate-jsonld.mjs page-type.json`), and include them with the templating the site already has.

## Headless CMS

- Never let editors paste JSON-LD into a CMS field. Model the facts (FAQ items, product prices, event dates) as structured fields, render them visibly, and build JSON-LD from the same fields in code.
