# Audit checklist

For each check: what to look at, how to get evidence, and the knowledge-base section (KB) that justifies it. KB means `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md`. Quote the KB label and link in the finding.

Manual fallbacks use `curl`. Always send a normal browser user agent for the baseline fetch, then repeat with crawler user agents where the check needs it:

```
curl -sSL -o /dev/null -w "%{http_code} %{url_effective} %{num_redirects}\n" -A "Mozilla/5.0" {{url}}
curl -sSL -A "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)" {{url}} | head -c 2000
```

A user-agent spoof only shows how the origin and CDN respond to that string; it does not prove what the real crawler sees (verified-bot checks use IP ranges and signatures). Say so in the finding.

---

## A. Crawl and indexing

| Check | Evidence | KB |
|---|---|---|
| robots.txt returns 200 and does not block key paths, `/_next/` or equivalent asset paths, or commercial pages | `curl {{site_url}}/robots.txt`; list every `Disallow` against `offer[].url` and content dirs | 1, 2 |
| `private_paths` from config are disallowed or noindexed | robots.txt plus page headers | 2 |
| Sitemap exists, is referenced in robots.txt, returns 200, lists canonical 200 URLs only | script output or `curl`; sample 20 URLs for status and canonical | 2 |
| Sitemap `lastmod` carries information (not the build time on every URL) | compare `lastmod` values across entries; find the generator file in the repo | 12 |
| Important pages are indexed | `inspect_urls` sample: coverage state, Google-selected canonical versus declared | 2 |
| No accidental `noindex` (meta or `X-Robots-Tag`) on indexable pages | page HTML and headers | 2 |
| Hub pages exist for every section that has child pages (for example `/compare`, `/guides`, `/industries`) | `curl` each parent path of `url_patterns` | 12 |
| Orphan pages | OpenSEO `get_audit_issues` type `orphan-page`, or sitemap URLs with no internal links in the crawl | 3 |
| Search Console and Bing Webmaster Tools verified; sitemap submitted | config flags plus `list_search_console_sites`; ask the user for Bing if no tool shows it | 8 |
| IndexNow key file reachable if IndexNow is configured | `curl {{site_url}}/{{indexing.indexnow_key_path}}` | route to `indexing` |

## B. Technical

| Check | Evidence | KB |
|---|---|---|
| Status codes: no 5xx, no soft 404s, broken internal links | script output, `get_audit_issues` (`server-error`, `broken-internal-link`, `broken-page`) | 2 |
| Redirects: no chains or loops; http to https and non-www/www consolidate in one hop | `curl -w` with `num_redirects` | 2 |
| Canonical present in server HTML, absolute, self-referencing on canonical pages, not changed by JS | raw HTML versus rendered DOM if a browser tool is available | 2 |
| Primary content, headings and JSON-LD present in the raw (non-JS) HTML | `curl` raw HTML and grep for the H1 and a sentence from the body | 1 |
| HTML under 2MB including inline payloads | `curl -s {{url}} | wc -c` on the heaviest templates | 2 |
| Core Web Vitals at the 75th percentile (LCP 2.5s, INP 200ms, CLS 0.1) | `get_audit_lighthouse` if run, CrUX or PageSpeed Insights if available; lab data is not field data, say which you used | 2 |
| CDN or WAF not blocking crawlers; HTML routes cacheable (no `set-cookie` on HTML) | response headers (`cache-control`, `set-cookie`, provider cache header) | 1, 2 |
| Next.js only: `generateMetadata` uncached under Cache Components, `middleware.ts` not migrated to `proxy.ts`, pages unexpectedly dynamic | read `next.config.*`, `app/**/layout.tsx`, `app/**/page.tsx`, build output | 2 |

## C. On-page

| Check | Evidence | KB |
|---|---|---|
| Every indexable page has a unique `<title>` | script output, `duplicate-title` issues | 3 |
| Brand not appended twice (framework title template plus per-page brand) | live `<title>` on 3 templates; find the template in the root layout | 3, 12 |
| `<title>` agrees with the H1 and with `og:title` | live HTML | 3 |
| Brand stripped from non-branded-intent titles; 50 to 60 characters as rewrite avoidance | live titles | 3 |
| Year in title also in H1 | live HTML | 3 |
| Exactly one H1; heading order not skipped | script output, `multiple-h1`, `heading-order-skip` | 3 |
| Meta description is plain text from the right field (not HTML, not a table of contents, not duplicated) | live `<meta name="description">` on 5 posts; trace the field in the repo | 3, 12 |
| Pages at positions 2 to 10 with CTR well below the site's own average | `get_search_console_performance` by page; list page, position, impressions, CTR | 3 |
| Commercial pages receive contextual internal links from topically matching high-impression posts | `inspect_urls` referring URLs, crawl inlinks, or grep content dirs for links to `offer[].url` | 3, 12 |
| Visible "last updated" date reflects a real edit (not one shared constant); `dateModified` not equal to publish date by code | live pages plus the code that sets it | 3, 12 |
| Image alt text present on meaningful images | `images-missing-alt` issues | 3 |

## D. Content quality and extractability

| Check | Evidence | KB |
|---|---|---|
| Key pages answer the main question near the top in plain text | read the page | 4 |
| Comparison data in HTML tables, processes in numbered lists | read the page | 4 |
| Claims and numbers are sourced and dated | read the page; list unsourced claims | 4, compliance-uk 1 |
| Self-serving "best X" list ranking the business first | read the page | 4 |
| Thin or duplicate content; pages per query variation | `thin-content`, `duplicate-content` issues; URL patterns | 4 |
| Content hidden with CSS or `aria-hidden` that exists only for machines | grep templates for `hidden` on content blocks | 5, 12 |
| CMS or tool markers visible in body text | grep live HTML for marker patterns | 12 |
| Impressions concentrated on off-topic content or off-market countries at very low CTR | Search Console by page and country | 12 (decision for the human, not a ticket for code) |
| Prompt-shaped queries in Search Console (long natural-language questions) and which pages rank for them | Search Console queries filtered by length or question words | 8 |

## E. Structured data

| Check | Evidence | KB |
|---|---|---|
| JSON-LD parses; required properties for the features targeted | `validate-jsonld.mjs` if present, else parse with `node -e`; `inspect_urls` rich-result verdicts | 5 |
| Schema matches visible content | compare markup values with page text | 5 |
| One `@id` per entity across the site; no two nodes share an `@id` with different facts | collect every `@id` from sampled pages | 5, 12 |
| No Review/AggregateRating for the business's own reviews (on Organization, LocalBusiness, Service or via widgets) | grep repo and live JSON-LD | 5, compliance-uk 3 |
| No FAQPage kept only for rich results; no How-to | grep | 5, 9 |
| BreadcrumbList items point at real parent URLs, not the page itself or the homepage | live JSON-LD plus `curl` each item | 12 |
| Organization has `name`, `url`, `logo`, `sameAs`, legal name and identifiers matching `config.entity` | live JSON-LD | 5, 7 |
| Article has real `datePublished` and `dateModified`, author as Person with a profile page | live JSON-LD | 5 |

## F. AI crawler access

| Check | Evidence | KB |
|---|---|---|
| Retrieval crawlers allowed (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`, `bingbot`, `Googlebot`, `Applebot`, `DuckAssistBot`) | robots.txt rules per token | 1 |
| Training decision explicit and consistent (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot` all match any `Content-Signal`/`Content-Usage` lines) | robots.txt | 1 |
| Retired tokens (`anthropic-ai`, `Claude-Web`) present | robots.txt; Low impact | 1, 9 |
| CDN or WAF bot settings (Cloudflare AI crawl controls, Vercel AI Bots ruleset) | ask the user or read the dashboard if a tool is connected; spoofed-UA `curl` as a weak signal | 1 |
| Server logs show AI crawler hits, if the user can provide logs | log sample | 1 |

## G. llms.txt

| Check | Evidence | KB |
|---|---|---|
| `/llms.txt` present or absent; if present, valid Markdown, links resolve, content matches the site | `curl` and link check | 6 |
| Never raise llms.txt above Low impact, and never recommend expanding it | n/a | 6 |

## H. Entity consistency

| Check | Evidence | KB |
|---|---|---|
| Name, entity line, address, phone, company number match across config, footer, contact page, Organization schema and `offsite/entity-facts.md` | side-by-side table | 7 |
| Name collisions with other entities and whether `disambiguatingDescription`/`legalName` address them | branded search via `get_serp_results` (paid, one call) or web search | 7 |
| People pages exist for named people, with ProfilePage markup and `sameAs` | live pages | 5, 7 |

## I. Off-site presence (quick)

- Check whether profiles exist and roughly match entity facts on: Google Business Profile (if local), Bing Places, LinkedIn company page, the directories in `offsite.directories`, the review platforms in `offsite.review_platforms`.
- Use web search or `get_business_profile` (OpenSEO) where available. Do not log in, claim, edit or create anything.
- Record gaps as tickets routed to `/aio-seo:offsite`; do not attempt the fix.

## J. Measurement setup

| Check | Evidence | KB |
|---|---|---|
| Search Console property verified and readable by the data provider | `list_search_console_sites` | 8 |
| "Search generative AI" setting reads Include | ask the user (no API) | 1, 8 |
| GA4 property bound to the data provider returns rows | `get_google_analytics_measurement_health`; zero rows means check the property | 12 |
| AI referral traffic visible (referrers such as chatgpt.com, perplexity.ai) | `get_google_analytics_traffic_acquisition` | 8 |
| Key events (lead form, sign-up, tool use) tracked | `get_google_analytics_key_events` | 8 |
| AI visibility baseline exists (`visibility/results/`) | state files | 8; route to `ai-visibility` |
| Dead tags (legacy analytics) still loading | grep layout files | 12 |
