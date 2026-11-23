# Static sites and other frameworks: implementing the foundations

For plain HTML, Hugo, Jekyll, Eleventy, Gatsby, Nuxt, SvelteKit, Remix and anything else. The principle is the same as the Next.js template: **one source of facts and routes, every file generated from it at build time, checked by a script in CI.** Use the framework's own SEO features when they exist and are maintained; fill the gaps with a small build script.

## The generator script

Add `scripts/seo-build.mjs` (Node, no dependencies) that runs after the site build (or before, writing into the static folder) and reads:
- site facts from `.agents/aio-seo/config.json` (or a `seo.config.json` the repo prefers, generated from it);
- the page list from the built output (walk `dist/`/`public/`/`_site/` for `*.html`) or the content folder's frontmatter.

It writes, into the published folder:
- `robots.txt` from the crawler policy (`crawler-policy.md`): one `User-agent` line per token per group, private-path disallows repeated in each group, optional `Content-Signal:` in the `*` group, `Sitemap:` with the canonical URL.
- `sitemap.xml` with `lastmod` from frontmatter `updated` or the file's last content commit (`git log -1 --format=%cI -- <source>`). Never the build time. Skip pages whose HTML has `noindex`.
- `llms.txt` and, if wanted, `llms-full.txt`: H1 with the site name, `> ` entity line, grouped links from the page list with each page's meta description.
- Markdown copies (`<path>.md`) of content pages from their markdown source, if the source is markdown. Do not convert arbitrary HTML into markdown for this.
- `<key>.txt` for IndexNow.

Port the logic from `${CLAUDE_PLUGIN_ROOT}/templates/nextjs/lib/seo/crawlers.ts`, `llms.ts` and `app/sitemap.ts`; they are plain TypeScript.

## Framework notes (check the installed version's docs before relying on any of these)

| Framework | Metadata | Sitemap | Notes |
|---|---|---|---|
| Hugo | `baseURL` = canonical host; head partial with title, description, canonical (`.Permalink`), robots | built-in `sitemap.xml`; `lastmod` from `.Lastmod` (enable `enableGitInfo` so it comes from git, not build time) | custom output formats can emit `llms.txt` and `.md` |
| Jekyll | `jekyll-seo-tag` | `jekyll-sitemap` (uses `last_modified_at` when set) | `url` in `_config.yml` = canonical host |
| Eleventy | layout head partial | template `sitemap.xml.njk` over `collections.all` using page `date`/`updated` | permalink templates can write `robots.txt` and `llms.txt` |
| Gatsby | Head API | `gatsby-plugin-sitemap` with `serialize` for lastmod | `siteMetadata.siteUrl` = canonical host |
| Nuxt | `useSeoMeta` / `useHead` | a sitemap module or server route | server routes for `robots.txt`, `llms.txt` |
| SvelteKit | `<svelte:head>` in a shared component | `+server.ts` routes, prerendered | same for robots and llms files |
| Remix / React Router | `meta` exports | resource routes | same |
| Plain HTML | edit each page's `<head>` or add a templating step | the generator script | consider a build step before adding many pages |

## JSON-LD

Generate it from builder functions, not by hand: copy `jsonld.ts` and `validate.ts` from the Next.js template (no framework dependency), call them in the head template, and run `validate-jsonld.mjs` over the built HTML in CI:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-jsonld.mjs" dist/index.html dist/blog/*/index.html --currency <project.currency>
```

Copy the plugin's validator into the repo (`scripts/validate-jsonld.mjs`) so CI does not depend on the plugin being installed.

## Verification and IndexNow

- Verification: DNS first; else meta tags in the head template or `BingSiteAuth.xml` in the static folder.
- IndexNow after deploy: a CI step after the production deploy that diffs the deployed commit, maps changed source files to URLs and posts them. The logic in `${CLAUDE_PLUGIN_ROOT}/templates/nextjs/scripts/indexnow.ts` ports directly; or copy `${CLAUDE_PLUGIN_ROOT}/scripts/indexnow.mjs` into the repo and call it with `--urls-file` from that step. Many static hosts send GitHub `deployment_status` events, so `templates/nextjs/.github/workflows/indexnow.yml` can be reused with the command swapped.

## CI

- Run the generator, then `check-site.mjs` against a local static server or the preview URL, and `validate-jsonld.mjs` over built HTML. Fail the job on FAIL findings.
- A Lighthouse budget (`lighthouserc.json` with `staticDistDir` instead of a start command).
