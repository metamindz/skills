# Page type: guides hub with topic clusters

Read when building or auditing the guides index (`project.url_patterns.guides` parent, for example `/guides`).

## When to build or update

- The site has, or plans, 6 or more guides or evergreen posts across 2 or more topics.
- A new guide ships (add it to its cluster), or quarterly.

## Structure

1. **H1** and a **direct answer lede, 40 to 60 words**: what these guides cover and who they are for.
2. **Topic clusters**, in reading order. Each cluster has:
   - an `id` (anchor), an H2 title phrased as the job ("Plan a migration", "Set up tracking"), and a one or two sentence intro;
   - an ordered list of guides, each with title, one-line description and last-updated date.
   - Clusters come from the keyword clusters in `.agents/aio-seo/blog/keywords.md` and the job the reader is doing, not from internal categories.
3. **"More guides"**: anything published but not yet in a cluster, so nothing is orphaned.
4. **Links to tools and offers**: one short block linking relevant free tools and the matched `offer[]` page.
5. A visible **"Last updated"** date.

## Implementation

- Keep the cluster definition as data (an array of `{ id, title, intro, slugs[] }`) next to the page, rendered from the content loader, so a missing slug fails a test instead of silently disappearing.
- Each guide links back to its hub section and to the 2 to 3 nearest guides in its cluster (pillar and cluster linking).
- Guide pages carry their own direct answer, steps and FAQ; the hub does not duplicate their content.

## Schema

- `CollectionPage` with `mainEntity` an `ItemList` of the guides (all visible), `BreadcrumbList`.
- Individual guides: `Article` (or `HowTo`-style content without relying on HowTo rich results), per `/aio-seo:schema`.

## Checks

- Every published guide appears exactly once (in a cluster or "More guides"); a test enforces it if the repo has a test runner.
- No cluster with a single guide unless more are planned in `page-plan.md`.
- Hub copy is not a near duplicate of the blog index.
