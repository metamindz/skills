# Callouts: sending readers to what the business owns

Every post should send readers on to something the business owns: an offer page, a free tool, a product, a resource, a related post, or a page on a sister site. Callouts are the visible blocks; inline links do the same job quietly. Both draw from one live list: `.agents/aio-seo/blog/link-inventory.md` (template: `${CLAUDE_PLUGIN_ROOT}/templates/state/blog/link-inventory.md`).

Config: `blog.callouts.min_per_post`, `blog.callouts.words_per_callout`, `blog.callouts.component`, `blog.callouts.ga4_event`, `offer[]`, `sister_sites[]`.

## 1. The link inventory

Each entry: ID, type, title, URL, site, one-line value to the reader, topic tags, intent fit, CTA lines, status, last verified, times used, last used, measured clicks.

Types: offer, free tool, product, resource (guide, template, checklist, calculator), case study, newsletter or community, event, related post, sister-site page.

Keeping it live:

- **Seed** (setup or bootstrap): from `offer[]`, a scan of the repo's routes (`app/`, `pages/`, `src/pages/`, `src/routes/`, `project.content_dirs.tools`) for tool, product, resource and case-study pages, the live `sitemap.xml`, and `sister_sites[]`. Mark scanned entries `inferred` until a human confirms the value line and tags.
- **Every run, before writing:** `git log --since=<last run date> --name-status` on route and content dirs. New tool, product or resource pages become entries (status `inferred`). Removed routes become `gone`.
- **Every run, for the entries chosen:** fetch each URL. Anything not returning a working page gets status `broken`, is not used, and becomes a maintenance job.
- **After publishing:** increment `times used`, set `last used`.
- **Humans can add or edit entries.** Never delete a human-added entry; mark it `gone` or `broken`.

## 2. Choosing callouts for a post

| Signal | Rule |
|---|---|
| Topic match | Entry tags overlap the primary query, a secondary keyword, or the section it would follow. No overlap, no callout. This is a gate, not a weight |
| Intent fit | Informational posts: lead with free tools, resources, products. Commercial posts ("cost", "vs", "hire", "best"): lead with the matched offer and case studies |
| Matched offer | The offer matched in scoring always gets one callout, usually after the main body and before the FAQ |
| Rotation | Avoid entries used in the last 2 posts unless it is the matched offer or nothing else fits |
| Evidence | Once `post-performance.md` has click data, prefer entry types that earned clicks. Only act on numbers that exist |

How many: about one per `blog.callouts.words_per_callout` words (default 700), so 2 to 4 per post, minimum `blog.callouts.min_per_post`. If nothing else genuinely fits, use fewer. An irrelevant callout teaches readers to skip them all.

Inline links are separate: link naturally to inventory pages where the text mentions them, descriptive anchor text. Each inventory URL appears at most twice in a post (one callout, one inline link).

## 3. Placement

- Never before or inside the answer block, never above the first substantive section.
- Directly after the section it relates to (a cost calculator after the cost section; a checklist after the process section).
- Never two callouts back to back: at least one full section between them.
- Not inside tables, FAQ answers or headings.

## 4. Copy

- One heading line, one or two sentences, one link.
- Say what the reader gets, tied to the section they just read. "Want to check your own numbers? Our churn calculator gives you a monthly and yearly rate in a minute." Not "Check out our amazing tool!"
- Say it is ours ("we built", "our") for products and tools.
- Claims inside callouts follow the same sourcing and advertising rules as the post: no unverifiable superlatives, no invented results, no fake urgency.

## 5. Format

Use the first that applies:

1. **The repo's callout component** (`blog.callouts.component`), with the props existing posts use:
```mdx
<Callout type="tool" id="churn-calculator" href="/tools/churn-calculator" title="Work out your own churn rate">
  Our churn calculator gives you a monthly and yearly rate from two numbers.
</Callout>
```
2. **No component, Markdown/MDX:** a blockquote, link on its own line:
```md
> **Work out your own churn rate**
> Our churn calculator gives you a monthly and yearly rate from two numbers.
> [Try the calculator](/tools/churn-calculator)
```
3. **HTML bodies:**
```html
<aside class="callout callout-tool" data-callout-id="churn-calculator">
  <p><strong>Work out your own churn rate</strong></p>
  <p>Our churn calculator gives you a monthly and yearly rate from two numbers. <a href="/tools/churn-calculator">Try the calculator</a></p>
</aside>
```

Always carry the inventory ID (`id` prop or `data-callout-id`) so clicks can be attributed. If the repo has no callout component and posts would benefit, open a maintenance job proposing one (small component plus click tracking); do not build it inside a blog run.

## 6. Links and tracking

- **Same-site links:** plain URLs, no UTM parameters. UTMs on internal links overwrite the visit's original source in GA4 and corrupt the organic data this skill depends on.
- **Sister sites and other domains we own:** add `utm_source=<this site's domain>&utm_medium=blog&utm_campaign=<post slug>&utm_content=<callout id>`. Use `rel="noopener"`; no `nofollow` on our own properties.
- **Click measurement:** needs a GA4 event (for example `callout_click` with the callout ID) fired by the callout component and marked as a key event, recorded in `blog.callouts.ga4_event`.
- **No click event:** say so in `blog/state.md`, open a maintenance job to add it, and report callouts as "not measured". Never infer clicks from page views.
- **Cross-site:** if a sister-site entry has an `openseo_project_id`, read its GA4 landing pages for `utm_medium=blog` sessions where the tools allow. Otherwise "not measured".

## 7. Measuring and learning

In step 2 of each run, for posts with a measurable callout event:

- `get_google_analytics_key_events` with `breakdown: "event_and_landing_page"`, filtered in your analysis to the callout event and the post URL.
- Record callout clicks per post in `post-performance.md` and add them to each entry's clicks in `link-inventory.md`.
- After 8+ posts with data, note in `blog/state.md` "Learnings" which callout types and placements earn clicks, with the numbers. Drop patterns that consistently earn nothing.
