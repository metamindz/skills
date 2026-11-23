# Audit scoring, routing and file template

## Scoring

Score every confirmed defect on two axes. Write the reason in one short clause; do not invent traffic forecasts.

**Impact**
- **High:** blocks crawling or indexing of commercial pages; breaks titles or descriptions site-wide; produces Search Console errors; makes the business's facts wrong or inconsistent; a compliance breach (fake reviews, unsourced competitor claims, consent).
- **Medium:** affects a template or a section (for example all comparison pages), or a page with real impressions (from Search Console) at a poor CTR; missing internal links into commercial pages.
- **Low:** single page, cosmetic, hygiene (retired robots tokens, llms.txt, inert markup), or no measurable traffic at stake.

**Effort**
- **Small:** one file or one config value, under an hour.
- **Medium:** a template, a component, several files, or new pages from an existing pattern.
- **Large:** new section, migration, content programme, or off-site work over weeks.

**Priority order:** High/Small, High/Medium, Medium/Small, High/Large, Medium/Medium, Low/Small, then the rest. Within a band, prefer the defect on pages with more Search Console impressions.

Pick at most 5 new tickets per audit. Carried-forward open tickets stay open and are listed first.

## Routing tickets to skills

| Defect area | Skill |
|---|---|
| robots.txt, sitemap, metadata templates, title templates, canonicals, rendering, HTML size, CDN/WAF crawler access, llms.txt, hub pages for existing sections, Core Web Vitals | `/aio-seo:foundation` |
| JSON-LD validity, eligibility, `@id`, breadcrumb markup, self-serving reviews, Organization/Person/Article markup | `/aio-seo:schema` |
| Search Console and Bing verification, sitemap submission, IndexNow, pages not indexed, re-crawl requests | `/aio-seo:indexing` |
| New hub pages: guides hub, FAQ content, glossary | `/aio-seo:pages` |
| New commercial pages: comparisons, alternatives, use cases, keyword landing and programmatic pages | `/aio-seo-pro:commercial-pages` (Pro; without Pro, the user can build them by hand) |
| Existing content: weak titles and descriptions on posts, internal links from posts to commercial pages, wrong product facts, visible markers in content | `/aio-seo:maintain` |
| Existing content: stale or decaying pages needing a refresh, thin or duplicate pages to merge, redirect or retire | `/aio-seo-pro:maintain-advanced` (Pro; without Pro, the user can do it by hand) |
| New topics or content gaps for the blog | `/aio-seo:blog` |
| Entity facts across third-party profiles, directories, reviews, earned mentions | `/aio-seo:offsite` |
| AI visibility baseline, prompt set, wrong facts in AI answers | `/aio-seo:ai-visibility` |
| Ongoing AI visibility tracking and trends | `/aio-seo-pro:visibility-tracking` (Pro; without Pro, repeat `/aio-seo:ai-visibility` by hand) |
| Data provider not connected, wrong analytics property, missing config | `/aio-seo:setup` |
| Strategic decisions (off-topic traffic, market focus, video) | No skill: "Decision for the human" |

If a defect fits two skills, route it to the one that owns the root-cause file.

## Ticket IDs

`A-YYYYMMDD-NN`, for example `A-20261117-03`. Keep the ID when a ticket is carried forward, even if its scope widens; note the change in the status table.

## Audit file template

Write `.agents/aio-seo/audits/YYYY-MM-DD.md`:

```markdown
# Audit: YYYY-MM-DD

- Site: {{site_url}}
- Mode: full | quick | pages
- Repo HEAD: `abc1234` (commit date, subject)
- Live deploy matches HEAD: yes (evidence) | not confirmed
- Previous audit: audits/YYYY-MM-DD.md (HEAD `def5678`)
- Data sources: OpenSEO (project id), Search Console window YYYY-MM-DD to YYYY-MM-DD, GA4 (property, rows returned or not), check-site.mjs, OpenSEO site audit id (reused or new, pages crawled)
- Credits used this run: N (balance before, after)

## 1. Status of previous tickets

| ID | Title | Status | Evidence |
|---|---|---|---|

## 2. Summary

- Three to six bullets: the most important things that are true about the site today.

## 3. Confirmed defects

### A-YYYYMMDD-NN: short title
- Area: (A to J)
- Impact / effort: High / Small (reason)
- Evidence:
  - live: URL, observed value
  - repo: `path/to/file.ts:12-18`, what it does
  - data: tool name, date range, figures
- Root cause: the chain from the rendered output back to the file
- Fix direction: one or two sentences, no code
- Skill: `/aio-seo:<name>`
- KB basis: section and label, with link

## 4. Backlog (confirmed, not ticketed this time)

| ID | Title | Area | Impact/effort | Skill | First seen |
|---|---|---|---|---|---|

## 5. Suspected, not confirmed

- What, why suspected, what would confirm it.

## 6. What the evidence says this month

- Only if the knowledge base or this run's data changes what should be ticketed. Cite KB sections.

## 7. Tickets raised this audit

1. A-YYYYMMDD-01: title (`/aio-seo:<skill>`)

## 8. Decisions for the human

- Items no skill can fix (strategy, accounts, budgets).

## Assumptions made

## Not verified
```

## Rules for the file

- Every number has its source next to it (tool and window, or file).
- File references use `path:line` or `path:start-end` as they are at the audited HEAD.
- Never paste secrets, tokens, personal data or full analytics exports.
- Keep it under about 300 lines; put raw data in `audits/data/`.
