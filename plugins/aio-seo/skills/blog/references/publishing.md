# Publishing, structured data, images and indexing

Posts are files in the site's repo, shipped as a pull request. No CMS adapter: if the site's blog still renders from a CMS, run in `draft-only` mode and open a maintenance job "move blog rendering to repo content" describing what the route reads now.

Config: `blog.ship_mode` (`pr` | `commit` | `draft-only`; falls back to `git.ship_mode`), `blog.status` (`draft` | `live`), `blog.format`, `blog.frontmatter_example`, `project.content_dirs.blog`, `project.url_patterns.blog`, `project.build_commands`, `git.*`.

## 1. Learn the site's conventions (first run, and whenever the content dir changes)

- **Content dir and naming:** `project.content_dirs.blog`. Check whether posts are `slug.mdx`, `YYYY-MM-DD-slug.md` or `slug/index.mdx`.
- **What the blog route renders:** read it (for example `app/blog/[slug]/page.tsx`, `src/pages/blog/[...slug].astro`, a content collection schema). Confirm it reads repo files.
- **Frontmatter:** if there is a schema (Zod, content collections, contentlayer, velite), it is the source of truth and the build fails on mismatches. Otherwise copy fields and date formats from `blog.frontmatter_example` or the newest post.
- **Components available in posts:** the MDX components map (`mdx-components.tsx` or similar). Note `Callout`, `CTA`, `Figure`, `Steps` etc. Record the callout one in `blog.callouts.component` only if the user agrees to a config change; otherwise just use it and log it.
- **Hero image field and draft flag.**
- Record what you learned in `blog/state.md` under "Site conventions" so later runs skip this.

## 2. Structured data check

AI features and rich results read structured data only when it matches visible content. [VERIFIED 2026-09] Source: https://developers.google.com/search/docs/appearance/ai-features

Check how the post template renders JSON-LD (search the layout for `application/ld+json`, a `jsonld` helper, or a schema library):

| Type | Required | What to check |
|---|---|---|
| `Article` or `BlogPosting` | Yes | `headline`, `author` (Person with `url` to the author page), `datePublished`, `dateModified`, `image`, `publisher` (Organization from `entity`), `mainEntityOfPage` |
| `BreadcrumbList` | Yes | Home > Blog > Post, URLs absolute |
| `FAQPage` | Only if `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` says it is still worth emitting | Generated from the visible FAQ, never from hidden text. Google's FAQ rich result stopped appearing on 7 May 2026. [VERIFIED 2026-09] Source: https://developers.google.com/search/updates. Keep the visible FAQ section either way |

- If the template emits them: fill every frontmatter field it reads. Never hand-write JSON-LD into individual posts.
- If it does not, or a required property is missing: do not patch it inside the blog run. Open a ticket for `/aio-seo:schema`: add a row to `maintenance-queue.md` with job type `structured data (for /aio-seo:schema)` and the missing types/properties, and add a line to the Blog section of `.agents/aio-seo/state.md` ("Needs /aio-seo:schema: ...").
- If a preview or build output is available, validate with `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-jsonld.mjs` (see its `--help`). Otherwise record "JSON-LD not validated: no build output".
- Byline: `house_rules.author`, linked to an author page. No author page: open a job (`/aio-seo:foundation` or `/aio-seo:schema` own author pages).

## 3. Write and ship (`pr`, default)

1. Branch: `<git.branch_prefix>blog-YYYY-MM-DD-<slug>` (default prefix `aio-seo/`). Never work on the default branch.
2. Write the post following the conventions. Thumbnail only in the frontmatter hero field.
3. Draft flag (`draft: true` or the site's equivalent) when `blog.status` is `draft` or the quality gate failed. If the site has no draft mechanism, the unmerged PR is the draft; say so in the PR.
4. Include in the same branch: the contextual links added to 2 to 3 older posts (step 10 of the workflow) and the state files if `git.commit_state` is true.
5. Run `project.build_commands` (lint, typecheck, test, build) that are set. Fix errors the new post caused. Do not touch unrelated failures; log them and mention them in the PR.
6. Commit with message `blog: <date> <slug>`. In `pr` mode, push the feature branch and open a pull request (`gh pr create`, as a draft PR when the post is a draft); the PR description is the step 12 report. If pushing or `gh` fails (no remote, no auth), leave the branch committed locally and give the user the exact commands.
7. **Never merge, never push to the default branch, never enable auto-merge.** A human merging the PR is the publish.
8. Public URL = `project.site_url` + `project.url_patterns.blog` with `<slug>`. Record as `pending deploy` until a later run confirms it returns 200.

`commit` mode: same, on a branch, without opening a PR; push the branch only if `git.push` is true. Never commit to the default branch.

## 4. draft-only

For sites without repo rendering, or before the agent is trusted. Write the post to `.agents/aio-seo/blog/drafts/YYYY-MM-DD-<slug>.md` with a metadata block at the top (title, slug, meta fields, summary, category, hero image, alt texts, callouts used, structured data fields). Record it in `blog-log.md` as `draft, not published`; mark the keyword `drafted`, not `targeted`, until a human confirms it is live.

## 5. Queue for indexing

After a post is written (any mode except draft-only), append it to `.agents/aio-seo/indexing/log.md` as **pending**, so `/aio-seo:indexing` submits it after deploy:

- Use the table columns already in that file. If the file is missing, create it from `${CLAUDE_PLUGIN_ROOT}/templates/state/indexing/log.md`.
- Row content: date, full public URL, status `pending`, source `blog`, the PR/branch, note `waits for deploy`.
- Also queue older posts whose bodies changed (internal links added) as `pending`, source `blog (link update)`.
- Do not submit anything yourself in the blog run.

## 6. Images (only when `blog.images.enabled`)

**Plan before writing:** 1 hero plus content images, total between `blog.images.min` and `blog.images.max`. For each: purpose, placement, concept, alt text, file name.

**Where they live:** follow existing posts (co-located `public/images/blog/<slug>/`, next to the post, or a hosted URL printed by `blog.images.command`).

**Rules:**
- The hero goes only in the frontmatter hero field. Templates render it from there; repeating it in the body duplicates it.
- No image used twice; content images differ from the hero and from each other.
- First body image after the first substantive section.
- Every body image has descriptive alt text and the size attributes the template expects.
- Real files or URLs only. No placeholders in anything shipped.

**Prompts:** follow `blog.images.style_guide` if set. Otherwise describe the concept, say it is for a post titled "<title>", no watermarks, no third-party logos, no real people.

**Generate:** run `blog.images.command` from the repo root; retry once with a simpler prompt. If it fails twice: interactive, give the user the prompts and ask for files; scheduled, ship as draft without content images and log it.
