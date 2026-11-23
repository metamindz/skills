# Detecting the stack and current SEO state (wizard step 2)

Read only. Do not change files in this step.

## Framework

| Signal | Stack value |
|---|---|
| `next` in package.json and an `app/` dir (or `src/app/`) | `nextjs-app-router` |
| `next` and only `pages/` | `nextjs-pages-router` (foundation skill adapts; templates target App Router) |
| `astro` in package.json, `astro.config.*` | `astro` |
| `wp-config.php`, `wp-content/` | `wordpress` |
| `nuxt`, `@sveltejs/kit`, `gatsby`, `@remix-run/*`, `hugo.toml`, `_config.yml` (Jekyll), `eleventy` | name it; `foundation` uses `static-and-other` guidance |
| Only HTML files | `static` |

In a monorepo (pnpm/turbo/nx workspaces), find the app that serves the marketing site (look for the one with a home page, `robots`, `sitemap`, or a `(marketing)` route group) and set `project.repo_root` to it.

## Site URL

Look in this order: `metadataBase` in the root layout, `NEXT_PUBLIC_SITE_URL` / `SITE_URL` / `NEXT_PUBLIC_APP_URL` in `.env.example` or code, `site` in `astro.config.*`, `siteurl` in WordPress settings if readable, `homepage` in package.json, the git remote's GitHub Pages URL, `vercel.json` or Netlify config aliases. Confirm with the user.

## Content

Find where pages and posts come from: `content/**`, `src/content/**`, `posts/`, MDX collections, a CMS client (Contentful, Sanity, Notion, Strapi, WordPress REST). Note the format (md, mdx, html, CMS) and frontmatter fields from one existing file (save its path as `blog.frontmatter_example`). If content lives in a CMS, the content skills draft files for a human to paste unless an adapter exists; note that.

## Existing SEO and AIO setup

Check for and record (path or "missing"):
- `robots.txt` / `app/robots.ts`: which AI user agents are named, sitemap line, disallows.
- `sitemap.xml` / `app/sitemap.ts`: how `lastModified` is set (real dates or build time).
- `llms.txt`, `llms-full.txt` (static file or route).
- Markdown mirrors of pages for agents.
- JSON-LD: where it is emitted, which `@type`s, whether through builders or inline.
- Metadata helpers, title template, canonical handling, OG images.
- Search Console / Bing verification (meta tags, `BingSiteAuth.xml`, `google*.html`); DNS verification cannot be seen from the repo, so ask.
- IndexNow key file (`public/<32 hex>.txt`) and any submit script or CI step.
- Analytics: GA4 tag, GTM, Plausible, PostHog, Vercel Analytics; conversion events if visible.
- Tests or CI checks for SEO (metadata tests, Lighthouse CI).

## Commands

From package.json scripts and CI workflows, fill `project.build_commands` (`lint`, `typecheck`, `test`, `build`). Use the package manager in the lockfile (pnpm, yarn, npm, bun).

## Live checks

If a site URL exists, run `check-site.mjs` (see SKILL.md). If it fails because the site is down, behind auth, or blocks bots, record that and tell the user; a CDN or firewall that blocks AI crawlers is a high-priority finding.
