# Audits

Written by `/aio-seo:audit`. One file per audit, named `YYYY-MM-DD.md` (a second audit on the same day is `YYYY-MM-DD-2.md`). Never edit or delete an earlier audit; each new audit carries the previous tickets forward and records their status.

## Contents of each audit

1. Status of previous tickets (FIXED, NOT FIXED, PARTLY FIXED, MOOT, CANNOT CHECK), each with evidence
2. Summary
3. Confirmed defects, each with evidence (live URL and value, repo file and line, tool result), root cause, impact and effort, and the skill that fixes it
4. Backlog of confirmed defects not ticketed this time
5. Suspected, not confirmed
6. What the evidence says this month (knowledge-base changes that affect tickets)
7. Tickets raised this audit (at most 5 new)
8. Decisions for the human
9. Assumptions made, Not verified

## Ticket IDs

`A-YYYYMMDD-NN`. A carried-forward ticket keeps its ID.

## Which skill fixes what

| Area | Skill |
|---|---|
| robots.txt, sitemap, metadata and title templates, canonicals, rendering, crawler access, llms.txt, hub pages | `/aio-seo:foundation` |
| Structured data | `/aio-seo:schema` |
| Search Console, Bing, IndexNow, pages not indexed | `/aio-seo:indexing` |
| New hub pages (guides, FAQ, glossary) | `/aio-seo:pages` |
| New commercial pages (comparisons, alternatives, use cases) | `/aio-seo-pro:commercial-pages` (Pro; without Pro, by hand) |
| Existing content, titles, internal links, product facts | `/aio-seo:maintain` |
| Consolidation, redirects, refreshes, retirements | `/aio-seo-pro:maintain-advanced` (Pro; without Pro, by hand) |
| New blog topics | `/aio-seo:blog` |
| Third-party profiles, reviews, mentions | `/aio-seo:offsite` |
| AI answers, prompt set, manual checks | `/aio-seo:ai-visibility` |
| Ongoing AI visibility tracking | `/aio-seo-pro:visibility-tracking` (Pro; without Pro, repeat manual checks) |
| Data connections and config | `/aio-seo:setup` |

## Supporting data

Raw tool and script output for each audit goes in `data/` as `YYYY-MM-DD-<source>.json`.
