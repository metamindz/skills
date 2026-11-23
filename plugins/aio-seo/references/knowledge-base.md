# SEO and AIO knowledge base

**Last reviewed:** 2026-11-17
**Evidence window:** most entries were verified in a primary-source sweep covering 5 July to 4 September 2026. Labels carry the month the claim was checked.

## How to use this file

- Read the section you need before making a recommendation, writing a ticket or explaining a finding.
- Quote the label and the source link whenever you rely on an entry in a user-facing file (audit, report, ticket, PR description).
- **Re-verify rule:** if an entry's label date is more than 6 months before today, re-check it at the linked source before relying on it. If you cannot re-check it, say so in the output under "Not verified" and do not present it as current. Record any change you find in the run log under "Knowledge base drift" so a maintainer can update this file.
- Never upgrade a label. A `[REPORTED]` claim stays `[REPORTED]` until someone checks the primary source and writes the new date.
- Never add a number to a deliverable that is not in this file, in a tool result from the current run, or in a source you fetched and cited in the current run.

### Labels

| Label | Meaning |
|---|---|
| `[VERIFIED YYYY-MM]` | Confirmed at a primary source in that month. Also used where the absence of something was confirmed at the primary source (written as "absence confirmed"). |
| `[REPORTED YYYY-MM]` | A credible study or trade report says this; the method was not reproduced and the claim was not confirmed at a primary source. Includes vendor studies, single-operator log studies and Google statements made only on social media or via trade press. |
| `[UNVERIFIED]` | Could not be traced to a primary source. Do not cite externally. Listed here mainly so you recognise it and avoid it. |

---

## 1. How AI assistants find and choose sources

### Google AI Overviews and AI Mode

- Eligibility: a page "must be indexed and eligible to be shown in Google Search with a snippet, fulfilling the Search technical requirements. There are no additional technical requirements." [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/ai-features
- Mechanism: query fan-out ("issuing multiple related searches across subtopics and data sources") plus retrieval-augmented generation (grounding) against the core index. [VERIFIED 2026-09] https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- No documented number of links per answer, and nothing on inline versus side-panel placement. [VERIFIED 2026-09, absence confirmed]
- `nosnippet` makes a page ineligible for AI features. [VERIFIED 2026-09]
- Google's position: "From Google Search's perspective, optimizing for generative AI search is optimizing for the search experience, and thus still SEO." [VERIFIED 2026-09] https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- The ai-features doc was last updated 2025-12-10 and was not touched in 2026 up to the sweep. [VERIFIED 2026-09]
- 6 May 2026 link changes: more inline links, desktop hover previews showing site name or page title, "Subscribed" labels, firsthand-source attribution. [VERIFIED 2026-09] https://blog.google/products-and-platforms/products/search/explore-web-generative-ai-search/
- On desktop, hovering over an inline link shows the "name of the website or title of the web page", which is the title tag's one documented role in AI features. [VERIFIED 2026-09] https://9to5google.com/2026/05/06/google-ai-mode-overviews-direct-links/
- 25 to 26 August 2026: link carousels for developing topics went live in AI Mode, including Preferred Sources. Confirmed by a Google VP on X only. [REPORTED 2026-09] https://www.seroundtable.com/google-ai-mode-link-carousels-41947.html
- 27 to 28 August 2026: AI Overviews began auto-expanding on some queries; Google declined to give the share of queries. [REPORTED 2026-09] https://searchengineland.com/google-is-dynamically-expanding-ai-overviews-for-some-queries-486200
- 2 to 3 September 2026: a Gemini model in AI Mode stopped linking and citing sources; Google acknowledged the fault. Do not read citation drops in that period as a strategy signal. [REPORTED 2026-09] https://searchengineland.com/google-to-fix-citation-bug-with-gemini-3-8-flash-in-ai-mode-486892
- Search Console "Search generative AI" setting: default is "include" (opt-out). Excluding means "You won't receive any traffic or impressions from these features"; it is not a ranking signal and does not affect AI training (that is `Google-Extended`). Takes effect in 1 to 2 days. Global from 31 August 2026. [VERIFIED 2026-09] https://support.google.com/webmasters/answer/16908024
- Google's own unaudited usage claims (3 June 2026): AI Overviews "over 2.5 billion monthly active users"; AI Mode "surpassed one billion monthly users". No methodology. [VERIFIED 2026-09, as a Google claim] https://blog.google/products-and-platforms/products/search/new-controls-website-owners/
- Most AI Overview citations do not come from the organic top 10. Three studies put the top-10 share at 37.9% (Ahrefs, 863,000 SERPs), about 25% (Originality.AI, 29,000 YMYL queries) and 16.7% (BrightEdge). [VERIFIED 2026-09, each at its source] https://ahrefs.com/blog/ai-overview-citations-top-10/ https://originality.ai/blog/google-ranking-ai-citations-study https://www.brightedge.com/resources/weekly-ai-search-insights/rank-overlap-after-16-months-of-aio
  - Originality.AI citation probability by rank: position 1 57.9%, 3 50.1%, 10 38.1%, 20 28.3%, 50 13.8%. [VERIFIED 2026-09]
  - Ahrefs states part of its fall from about 76% (July 2025) is a measurement artefact from an improved parser. [VERIFIED 2026-09]

### ChatGPT

- Crawlers: `GPTBot` (training), `OAI-SearchBot` (search), `ChatGPT-User` (user-initiated fetches). OpenAI's bot docs point to robots.txt only. [VERIFIED 2026-09] https://developers.openai.com/api/docs/bots
- Cites roughly 15 sources per response (Semrush, 126 million US prompts, January to April 2026). [VERIFIED 2026-09] https://www.semrush.com/news/463141-semrush-releases-expanded-2026-ai-visibility-index-analyzing-126-million-ai-search-prompts/
- Wikipedia is 7.8% of all ChatGPT citations; brand-owned sites 47% (lowest of the engines); earned media 30% (highest). [VERIFIED 2026-09] https://www.tryprofound.com/blog/where-do-ai-citations-come-from
- ChatGPT visibility correlates least with established-brand authority signals, so it is the least gated engine for a small brand. [VERIFIED 2026-09, correlation study] https://ahrefs.com/blog/ai-brand-visibility-correlations/
- OAI-SearchBot grew about 3.5x after the GPT-5 launch and now generates more log events than GPTBot; search-purpose crawling was under 10% of AI crawler requests in May 2026. [REPORTED 2026-09, partly via a secondary blog] https://ppc.land/openai-tripled-its-web-crawl-after-gpt-5-but-chatgpt-users-may-be-declining/

### Perplexity

- Crawlers: `PerplexityBot` (documented as "not used to crawl content for AI foundation models") and `Perplexity-User`, which "generally ignores robots.txt rules". Blocking `Perplexity-User` is a firewall job, not a robots.txt job. [VERIFIED 2026-09] https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- Reddit is 6.6% of all Perplexity citations. [VERIFIED 2026-09] https://www.tryprofound.com/blog/where-do-ai-citations-come-from
- Perplexity weights freshness aggressively. [UNVERIFIED, directional only]

### Claude

- Crawlers: `ClaudeBot`, `Claude-SearchBot`, `Claude-User`. `anthropic-ai` and `Claude-Web` no longer appear in Anthropic's docs (updated 7 April 2026). [VERIFIED 2026-09] https://support.claude.com/en/articles/8896518

### Gemini

- Cites roughly 3 sources per response; overlap between brands mentioned and domains cited can be as low as 30%. [VERIFIED 2026-09] https://www.semrush.com/news/463141-semrush-releases-expanded-2026-ai-visibility-index-analyzing-126-million-ai-search-prompts/
- Brand-owned sites are 69% of Gemini citations (highest of the engines). [VERIFIED 2026-09] https://www.tryprofound.com/blog/where-do-ai-citations-come-from
- `Google-Extended` governs Gemini training and grounding, so blocking it costs Gemini grounding. [VERIFIED 2026-09] https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers

### Microsoft Copilot and Bing

- Copilot inherits Bing's rendering, as AI Overviews inherit Googlebot's; a client-rendered page can be visible to those two and invisible to other assistants. [REPORTED 2026-09, secondary source, consistent with Google's docs]
- Social and UGC sources are cited about 4x more by AI Overviews than by Copilot. [VERIFIED 2026-09] https://www.tryprofound.com/blog/where-do-ai-citations-come-from
- Microsoft has made no statement either way on llms.txt. [UNVERIFIED]

### Do AI crawlers run JavaScript?

- None of the major AI crawlers render JavaScript. GPTBot fetches JS files in 11.50% of requests and ClaudeBot 23.84%, but neither executes them. [VERIFIED 2026-09 as figures, but the study is from December 2024 to January 2025] https://vercel.com/blog/the-rise-of-the-ai-crawler
- No primary 2026 re-test exists. "69% of AI crawlers cannot execute JavaScript" and similar figures are [UNVERIFIED].
- **Practical rule:** put primary content, headings, claims and JSON-LD in server-rendered HTML. This is the highest-leverage AI-visibility action and the only one with primary evidence behind it.

### Crawler user agents

| Token | Operator | Purpose | Notes | Doc |
|---|---|---|---|---|
| `Googlebot` | Google | Search crawl, also feeds AI Overviews and AI Mode | Renders JS via headless Chromium | https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics |
| `Google-Extended` | Google | Control token only, no HTTP user agent | Governs Gemini training AND grounding | https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers |
| `bingbot` | Microsoft | Bing search, Copilot inherits | | |
| `Applebot` | Apple | Apple search | | https://support.apple.com/en-us/119829 |
| `Applebot-Extended` | Apple | Control token only | Blocking it does not remove you from Apple search | https://support.apple.com/en-us/119829 |
| `GPTBot` | OpenAI | Training | | https://developers.openai.com/api/docs/bots |
| `OAI-SearchBot` | OpenAI | ChatGPT search | | https://developers.openai.com/api/docs/bots |
| `ChatGPT-User` | OpenAI | User-initiated fetch | | https://developers.openai.com/api/docs/bots |
| `ClaudeBot` | Anthropic | Training | | https://support.claude.com/en/articles/8896518 |
| `Claude-SearchBot` | Anthropic | Search | | https://support.claude.com/en/articles/8896518 |
| `Claude-User` | Anthropic | User-initiated fetch | | https://support.claude.com/en/articles/8896518 |
| `PerplexityBot` | Perplexity | Search index | Not used for foundation-model training | https://docs.perplexity.ai/docs/resources/perplexity-crawlers |
| `Perplexity-User` | Perplexity | User-initiated fetch | "generally ignores robots.txt rules" | https://docs.perplexity.ai/docs/resources/perplexity-crawlers |
| `DuckAssistBot` | DuckDuckGo | AI answers | | |
| `MistralAI-User` | Mistral | User-initiated fetch | | |
| `meta-externalfetcher` | Meta | User-initiated fetch | "may bypass robots.txt" | |
| `meta-externalagent` | Meta | Training | | |
| `CCBot` | Common Crawl | Bulk crawl, used for training | | |
| `Bytespider` | ByteDance | Bulk crawl | | |
| `Amazonbot` | Amazon | Bulk crawl | | |

- **Retired tokens:** `anthropic-ai` and `Claude-Web` (absent from Anthropic's docs from 7 April 2026). Harmless in robots.txt but meaningless; do not add them. [VERIFIED 2026-09]
- No new dedicated agentic-browsing robots token was introduced in 2026. [VERIFIED 2026-09, absence confirmed]
- Consolidated reference list: https://developers.cloudflare.com/ai-crawl-control/reference/bots/ [VERIFIED 2026-09]
- Table rows without a doc link were listed in the source knowledge base without a per-bot doc; use the Cloudflare reference above and re-check before quoting their purpose externally.

### Crawler control default for a site that wants AI visibility

This is a commercial judgement, not a verified fact. Present it to the user as a recommendation and record their choice in config or the run log.

- Allow unconditionally (retrieval and citation): `Googlebot`, `bingbot`, `Applebot`, `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`, `DuckAssistBot`, `MistralAI-User`, `meta-externalfetcher`.
- Training crawlers, the user's decision: `GPTBot`, `ClaudeBot`, `CCBot`, `Bytespider`, `meta-externalagent`, plus `Google-Extended` and `Applebot-Extended`.
- Suggested starting point: allow the major assistants' training crawlers (brand presence in model weights), deny bulk harvesters with no attribution or referral path (`Bytespider`, `CCBot`, `meta-externalagent`, `Amazonbot`).
- Optional signals: `Content-signal: search=yes, ai-input=yes, ai-train=yes` and `Content-Usage: train-ai=y`. `ai-input=yes` is the signal that matters for AI answers, because Cloudflare's `search` definition explicitly excludes AI-generated summaries. [VERIFIED 2026-09] https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- Keep the file consistent: if the user picks `ai-train=no`, set `GPTBot`, `ClaudeBot`, `Google-Extended` and `Applebot-Extended` to `Disallow: /` at the same time.
- UK and EU copyright angle on training opt-outs: see `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`. Not legal advice.

### Hosting and CDN defaults that block AI crawlers

- Cloudflare announced that from 15 September 2026 new domains get defaults where bots classed as Training or Agent are blocked on pages that display ads, while Search stays allowed; the single "Block AI bots" toggle becomes three controls (Search, Agent, Training). [VERIFIED 2026-09, announced before it took effect; re-check current behaviour] https://developers.cloudflare.com/changelog/post/2026-07-01-ai-traffic-options/
- Cloudflare "Markdown for Agents" injects a default `Content-Signal: ai-train=yes, search=yes, ai-input=yes` if the origin sets none. [VERIFIED 2026-09] https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents
- Vercel: the AI Bots managed ruleset defaults to Allow; setting it to Deny also blocks agentic traffic and overrides the verified-bot allowance. Bot Protection does not work behind a reverse proxy such as Cloudflare. [VERIFIED 2026-09] https://vercel.com/docs/bot-management https://vercel.com/kb/guide/how-to-utilize-vercels-bot-management-features
- Always check the CDN or WAF, not just robots.txt, when an AI crawler is missing from logs.

---

## 2. Technical SEO

### Crawling, rendering and size

- Googlebot renders JavaScript with headless Chromium; the renderer is stateless (local and session storage cleared) and has no WebSockets or WebRTC. [VERIFIED 2026-09] https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Googlebot fetches up to 2MB per URL including the HTTP header; oversized HTML is truncated, not rejected; PDFs get 64MB. [REPORTED 2026-09, second-hand via trade press; primary page is JS-rendered] https://developers.google.com/search/blog/2026/03/crawler-blog-post https://searchengineland.com/google-explains-how-crawling-works-in-2026-473110
  - Whether the 2MB figure is new or newly documented is unclear. Keep HTML under 2MB including inline JSON-LD and framework payloads.
- Canonicals: set `rel="canonical"` in the HTML source and never let JS change it. Canonicals are processed before and after rendering, so a mismatch is harmful. [VERIFIED 2026-09, substance; changelog date unclear]
- Robots meta tags placed outside `<head>`: Google added a documentation note in March 2026. [VERIFIED 2026-09] https://developers.google.com/search/updates
- No 2026 changes to sitemaps, hreflang or `lastmod`. Sitemap ping was deprecated in 2023. [VERIFIED 2026-09, absence confirmed] https://developers.google.com/search/blog
- Site moves: the site-move guide was extended on 17 June 2026 to domain variants; use Change of Address for all subdomain, www and non-www variants. [VERIFIED 2026-09]

### Core Web Vitals

- Thresholds unchanged: LCP good at or below 2.5s; INP good at or below 200ms; CLS good at or below 0.1; all at the 75th percentile. [VERIFIED 2026-09] https://web.dev/articles/vitals https://developers.google.com/search/docs/appearance/core-web-vitals
- No new Core Web Vital was added in 2026. [VERIFIED 2026-09, absence confirmed]
- Google: good Core Web Vitals align "with what our core ranking systems seek to reward" but "don't guarantee good rankings". [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/page-experience
- CrUX July 2026 dataset: 55.7% of origins pass all three metrics, so passing is still a differentiator. [VERIFIED 2026-09] https://developer.chrome.com/docs/crux/release-notes
- Soft navigation measurement shipped in Chrome 151 and Edge 151, enabled by default; it is not yet a Core Web Vitals scoring change. The `web-vitals` library supports it from v6.0.0 via `{reportSoftNavs: true}`. [VERIFIED 2026-09] https://developer.chrome.com/docs/web-platform/soft-navigations
- For client-routed sites, collect soft-navigation real-user data now. Vercel Speed Insights collects hard navigations only (the first page view per session in a Next.js app) and still reports FID; do not use it as a Core Web Vitals proxy. [VERIFIED 2026-09] https://vercel.com/docs/speed-insights/metrics
- Lighthouse added an experimental "Agentic Browsing" category in v13.3.0 (7 May 2026): no 0 to 100 score, audits llms.txt, accessibility for agents, CLS and WebMCP. Google calls it "informational and unbenchmarked". [VERIFIED 2026-09] https://github.com/GoogleChrome/lighthouse/releases/tag/v13.3.0

### Algorithm updates

- The ranking update list now lives on the Search Status Dashboard; `developers.google.com/search/updates/ranking` no longer exists. [VERIFIED 2026-09] https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history
- 2026 confirmed updates up to the sweep: February Discover update (5 Feb), March spam update (24 Mar), March core update (27 Mar), May core update (21 May), June spam update (24 Jun), August spam update (18 Aug). [VERIFIED 2026-09] Check the dashboard for anything newer before explaining a traffic change.
- Spam policies were clarified on 15 May 2026 to apply to generative AI responses in Search; a "back button hijacking" policy was added on 13 April 2026. [VERIFIED 2026-09] https://developers.google.com/search/updates
- Site reputation abuse enforcement was adjusted within the EEA on 28 August 2026; relevant only if a site hosts third-party or partner content. [VERIFIED 2026-09] https://developers.google.com/search/blog/2026/08/update-site-reputation-policy
- **Diagnostic heuristic:** a core-update hit shows as falling position AND impressions in Search Console; an AI Overview squeeze shows stable position but falling clicks and CTR. The generative AI performance report adds AI-surface impressions as a third input. Lean on first-party data, not tracker chatter.

### Markdown variants and agent plumbing

- Vercel and Cloudflare both serve Markdown on `Accept: text/markdown` (February 2026). [VERIFIED 2026-09] https://vercel.com/docs/agent-resources/markdown-access https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents
- No evidence of citation or referral benefit. In one 4.3 million request log study, PerplexityBot, Meta-ExternalAgent, GPTBot, OAI-SearchBot and ClaudeBot made zero Markdown requests (weak source: a vendor press release). [REPORTED 2026-09] https://pinionnewswire.com/press-release/study-concludes-markdown-is-ineffective-for-ai-citations/
- Verdict: enable it if it is a toggle or a small build step; do not promise results; keep the versions in sync to avoid a cloaking-shaped problem.
- WebMCP is a W3C Community Group draft, not a standard, with no discovery mechanism, so it is not an SEO or AI-visibility lever. [VERIFIED 2026-09] https://webmachinelearning.github.io/webmcp/
- AGENTS.md is a coding-repo convention; no search or answer engine fetches it from a website root. [VERIFIED 2026-09] https://agents.md

### Next.js App Router specifics (apply only when `project.stack` is `nextjs-app-router`)

- Next.js 16 releases: 16.0 (21 October 2025) to 16.3 (3 August 2026). 16.2.x became Active LTS and 15.5.x Maintenance LTS on 13 July 2026, with monthly security releases. [VERIFIED 2026-09] https://nextjs.org/blog/next-security-release-program
- With `cacheComponents: true`, uncached data access inside `generateMetadata()` blocks metadata prerendering. Fix with `'use cache'` inside `generateMetadata` or an explicit `connection()` marker. `/_not-found` and `/_global-error` inherit the root layout's metadata and must be statically prerenderable. [VERIFIED 2026-09] https://nextjs.org/docs/messages/blocking-prerender-metadata-dynamic
- Caching is opt-in and dynamic by default in 16; pages that were implicitly static can silently become request-time dynamic. [VERIFIED 2026-09] https://nextjs.org/docs/app/guides/migrating-to-cache-components
- `cacheComponents` replaces the removed `experimental.ppr` flag; `runtime = 'edge'` is deprecated under Cache Components. [VERIFIED 2026-09] https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
- `middleware.ts` was renamed to `proxy.ts`; crawler detection or redirect logic left in `middleware.ts` stops running. [VERIFIED 2026-09] https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- `robots.ts` gained an `other` field in 16.3.0 that passes non-standard directives through verbatim, so `Content-Signal` and `Content-Usage` lines can be generated. [VERIFIED 2026-09] https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
- The sitemap function receives `id` as a promise in 16. [REPORTED 2026-09, from a search summary; upgrade guide not read directly] https://nextjs.org/docs/app/guides/upgrading/version-16
- Streaming metadata shipped in 15.2 (February 2025), not 2026. It is disabled for bots that expect metadata in `<head>` (configurable via `htmlLimitedBots`); the "does not harm SEO" reasoning holds for JS-executing bots only. [VERIFIED 2026-09] https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- On Vercel, failed ISR revalidation keeps serving the old cached page, so a broken CMS means crawlers see stale HTML; a `set-cookie` header (for example a consent cookie) on an HTML route makes it uncacheable. [VERIFIED 2026-09] https://vercel.com/docs/incremental-static-regeneration https://vercel.com/docs/caching/cdn-cache

---

## 3. On-page

### Titles

- Title links are generated automatically from nine inputs: `<title>`, main visual title, headings such as `<h1>`, `og:title`, other prominent text, other page text, anchor text on the page, text in links pointing to the page, `WebSite` structured data. [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/title-link
- Named rewrite triggers include half-empty titles, obsolete titles (stale year), inaccurate titles, boilerplate across many pages, no clear main title, language mismatch, and the site name duplicated in the title. [VERIFIED 2026-09]
- "There's no limit on how long a `<title>` element can be." Truncation is display-side. [VERIFIED 2026-09]
- Google changed 76.04% of title tags in Q1 2025; 63% of modified titles had the brand name removed, the most common change. [VERIFIED 2026-09 at source, methodologically weak: final keyword count not stated] https://searchengineland.com/google-changed-76-of-title-tags-in-q1-2025-heres-what-that-means-454847
- Rewrite rate by length (Zyppy, 80,959 titles, data from Q1 2022): 51 to 60 characters is the minimum at 39 to 42%; over 60 characters over 76%; over 70 characters 99.9%. Brackets rewritten 77.6% and deleted 32.9%; parentheses survive better. [VERIFIED 2026-09] https://zyppy.com/seo/google-title-rewrite-study/
- Where both title and H1 contain a number, Google kept a number 97.3% of the time; where only the title did, it stripped it 25.8% of the time. [VERIFIED 2026-09] https://zyppy.com/seo/google-title-rewrite-study/
- Mueller (19 February 2026): the title link "is not necessarily the title element of a HTML page". [VERIFIED 2026-09] https://www.seroundtable.com/google-bad-title-algorithm-filter-40944.html

**Rules that follow from the evidence**

1. One H1 per page that matches the `<title>`.
2. Drop the brand name from titles on non-branded-intent pages; the site name is shown separately. Check for framework title templates that append the brand a second time.
3. Aim for 50 to 60 characters as a rewrite-avoidance measure, not a CTR measure.
4. If a year is in the title, put the same year in the H1.
5. Mine Google's rewritten titles (Search Console, SERP checks) for intent language and use it in the H1 and H2s.

### Meta descriptions and snippets

- Snippets are "primarily created from the page content itself"; the meta description is used only if it describes the page more accurately. "There's no limit on how long a meta description can be." Programmatic generation at scale is "appropriate and are encouraged". [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/snippet
- "Read more" deep links (20 April 2026) need content visible on load (not behind tabs or accordions), no JS scroll-position control, and no stripping of hash fragments. [VERIFIED 2026-09]
- About 70% of tracked queries surfaced a Google-written description; hand-written descriptions were rewritten 130% more often than the Google-written control. [REPORTED 2026-09, sample "thousands of tracked keywords"] https://www.seerinteractive.com/insights/do-you-need-to-write-meta-descriptions-anymore-probably-not
- Mueller (30 June 2026): writing them is "worthwhile to do so for individual pages that you care about, but it's definitely not a requirement". [VERIFIED 2026-09] https://www.seroundtable.com/google-meta-descriptions-41590.html
- Google bolds query-matching terms in snippets, so query-relevant phrasing in the description and in H2s is the actionable lever.
- Meta descriptions and JSON-LD scored zero across six AI assistants' crawlers in one marker study; the title tag was the only tag reliably read. [REPORTED 2026-09, vendor study] https://writesonic.com/blog/ai-crawler-study-what-llms-see-on-your-website
- Replacing meta descriptions on 21 pages with a single full stop for six weeks had no measurable effect on AI crawl activity or citations. [REPORTED 2026-09] https://www.seerinteractive.com/work/case-studies/do-meta-descriptions-influence-ai-visibility

### CTR context

- Ahrefs (300,000 keywords, desktop, December 2025): position-1 CTR 1.6% where an AI Overview shows versus 3.9% for informational keywords without one; AIO-attributable impact at position 1 is -58.0%. [VERIFIED 2026-09] https://ahrefs.com/blog/ai-overviews-reduce-clicks-update
- Seer (about 2 billion impressions): organic CTR on AIO queries went from 3.2% (January 2025) to a 1.3% floor (December 2025) and back to 2.4% (February 2026); Seer's absolute levels are not stable across its own publications. [VERIFIED 2026-09] https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-2026-update
- 68.01% of US Google searches ended without a click in the first four months of 2026. [REPORTED 2026-09, panel method not checked] https://searchengineland.com/google-zero-click-searches-2026-study-479717
- CTR as a ranking factor: nothing new in 2025 or 2026. Justify title rewrites by the clicks they win, not as a ranking play. [VERIFIED 2026-09, absence confirmed]

### Other on-page basics

- Heading hierarchy H1 then H2 then H3; descriptive image alt text; internal links between related pages; a visible "last updated" date on content pages that reflects a real edit.
- These are standing good practice; no 2026 study changes them.

---

## 4. Content that gets cited

- A 45-study critical survey (July 2026): "No reviewed technique shows a stable, longitudinal, cross-platform causal effect on organic discoverability or downstream behaviour." Topical relevance and context position are the most reproducible levers; citation-oriented rewrites can impair retrieval. [VERIFIED 2026-09, abstract] https://arxiv.org/abs/2607.14035
- The foundational GEO paper's "up to 40% visibility lift" from statistics, quotations and citations holds only inside its experimental setting, conditional on the source already being in the context. Use those techniques as editorial quality, never as a forecast uplift. [VERIFIED 2026-09]
- Google's mythbusting list: "There's no requirement to break your content into tiny pieces for AI to better understand it"; "AI systems can understand synonyms and general meanings"; seeking inauthentic mentions is a myth. [VERIFIED 2026-09] https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Building a page per fan-out query variation "primarily to manipulate rankings or generative AI responses in Google Search violates Google's scaled content abuse spam policy". [VERIFIED 2026-09]
- Ranked "best-of" listicles are the most-cited format, about 21% of all citations (Ranqo vendor preprint, 100,000+ responses). [VERIFIED 2026-09, abstract] https://arxiv.org/abs/2606.20065
- In B2B SaaS, 70.8% of citations are "best of" or "top" lineups and 51.6% include the year in the title (Overthink Group, 1,260 prompts). [REPORTED 2026-09] https://overthinkgroup.com/b2b-ai-citation-stats-2026-q2/
- **Self-serving "best" pages are risky:** across 100 B2B "best [category] software" queries, Google cited a brand's own "best" page but recommended better-known competitors in 69% of cases. [REPORTED 2026-09] https://searchengineland.com/google-ai-overviews-cite-self-serving-listicles-recommend-competitors-480573
  - Rule: ranked comparison content is the right format; ranking yourself first in your own list is not. Prefer honest comparison and "alternatives" pages with sourced, dated facts (see compliance-uk.md).
- Being cited inside an AI Overview is associated with +35% organic clicks and +91% paid clicks versus not being cited on the same SERP. [REPORTED 2026-09] https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-2026-update
- Editorial practices kept as sensible, without a verified uplift figure:
  - Lead each section with a direct answer; write self-contained passages that make sense out of context.
  - Use HTML tables for comparison data and numbered lists for processes.
  - Use precise, sourced numbers rather than rounded estimates.
  - Publish original data; topical relevance is one of the two reproducible levers.
  - Build clusters around core topics rather than isolated posts.
  - Refresh cornerstone pages on a schedule with a visible, honest updated date. The specific freshness-lift percentages that circulate are [UNVERIFIED].
  - Question-form headings: no measured impact. [UNVERIFIED as a lever]
- "Information gain": content that adds something new versus what already ranks is the safer bet than derivative pages. [UNVERIFIED as a named Google system; consistent with the survey above]

---

## 5. Structured data

### What it does and does not do

- Google: "Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add." Keep using it for rich-result eligibility. [VERIFIED 2026-09] https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- The one positive instruction for AI features: "Making sure your structured data matches the visible text on the page". Hidden or mismatched content in markup is a liability. [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/ai-features
- Ahrefs controlled test (1,885 pages that added JSON-LD, matched controls): AI Overviews -4.6%, AI Mode +2.4%, ChatGPT +2.2%, none distinguishable from noise. The "cited pages are 3x more likely to have JSON-LD" observation across 6 million URLs is confounded. [REPORTED 2026-09] https://ahrefs.com/blog/schema-ai-citations/
- A test of five systems fetching pages in real time (ChatGPT, Claude, Perplexity, Gemini, AI Mode) found none used JSON-LD; all read visible HTML. [REPORTED 2026-09, searchVIU, no link recorded]
- Rule: justify structured data by rich-result eligibility and entity disambiguation, never by AI-citation uplift.

### What is supported (Search Gallery, last updated 2026-06-15)

- 25 features: Article, Breadcrumb, Carousel, Course list, Dataset, Discussion forum, Education Q&A, Employer aggregate rating, Event, Image metadata, Job posting, Local business, Math solver, Movie, Organization, Product, Profile page, Q&A, Recipe, Review snippet, Software app, Speakable, Subscription and paywalled content, Vacation rental, Video. [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Google added no new structured data types or rich results in 2026 up to the sweep. [VERIFIED 2026-09] https://developers.google.com/search/updates
- schema.org current release v30.0 (19 March 2026); it added a `Credential` class, which no Google feature consumes. [VERIFIED 2026-09] https://schema.org/docs/releases.html

### Type by type

- **Organization:** an entity signal, not a rich result. No required properties. Recommended properties include `name`, `legalName`, `alternateName`, `url`, `logo`, `description`, `address`, `contactPoint`, `email`, `telephone`, `foundingDate`, `sameAs`, `taxID`, `vatID`, `iso6523Code`, `naics`, `duns`, `leiCode`, `numberOfEmployees`. No pricing, service or rating properties. Use the most specific Organization subtype that fits. [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/structured-data/organization
- **LocalBusiness:** right for businesses with premises or a service area. It brings no star-rating eligibility for your own reviews.
- **ProfilePage:** valid for "an employee page on a company website"; requires `mainEntity` (Person or Organization) with a `name`. No documented SERP enhancement for a company team page; the benefit is entity and authorship understanding. `Person` has no standalone rich result. [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/structured-data/profile-page
- **Article and BreadcrumbList:** keep, with real `datePublished` and `dateModified`.
- **Event:** live rich result; worth it for genuine events.
- **SoftwareApplication:** live rich result; requires `name`, `offers.price` (`0` if free) and one of `aggregateRating` or `review`. [VERIFIED 2026-11] https://developers.google.com/search/docs/appearance/structured-data/software-app. Because self-published ratings are not allowed (see the review rules in this section and `compliance-uk.md`), most products will not get this rich result until they have genuine third-party ratings they can mark up under Google's policies. Keep the markup anyway: it still describes the product and its price to search engines and AI systems.
- **Product and merchant listings:** only pages where a shopper can buy a single product. `priceSpecification` is consumed by merchant listing and product snippet only. [VERIFIED 2026-09]
- **Service:** valid schema.org, consumed by no Google feature. [VERIFIED 2026-09, absence confirmed] It does no harm; do not sell it as a ranking or citation lever.
- **Offers for professional services:** no documented "from X per day" rich result; `hasOfferCatalog` appears nowhere in Google's docs. [VERIFIED 2026-09, absence confirmed]
- **Carousels (beta):** EEA, Turkey and South Africa only, consumer-transactional verticals, interest-form gated; the UK is not named. [VERIFIED 2026-09]

### Deprecated or restricted

- **FAQPage:** the rich result stopped appearing on 7 May 2026, deprecation notice 8 May 2026, docs removed June 2026. Markup is harmless but is not an asset; remove it where it existed only for rich results. FAQ content as visible page content is fine. [VERIFIED 2026-09]
- **How-to:** dead; the doc redirects to a deprecation note (retirement date not recorded in the sweep). [VERIFIED 2026-09]
- **Practice problem:** docs removed 6 January 2026. [VERIFIED 2026-09]
- **Review and AggregateRating about yourself:** "If the entity that's being reviewed controls the reviews about itself, their pages that use LocalBusiness or any other type of Organization structured data are ineligible for star review feature", including via an embedded third-party widget. Also: "Don't aggregate reviews or ratings from other websites." [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/structured-data/review-snippet
  - 24 July 2026: new guideline against fake or undisclosed incentivised reviews (money, discounts, vouchers or free products without clear disclosure). [VERIFIED 2026-09]
  - `Service` is not a supported parent for review snippets; attaching ratings to `Service` produces Search Console errors. [VERIFIED 2026-09]
  - Rule: never add Review or AggregateRating for the business's own reviews. Remove existing self-serving markup rather than de-duplicating it. UK law adds its own rules (see compliance-uk.md).
- **Sitelinks search box `SearchAction`:** no longer a supported Google feature; inert and harmless. [UNVERIFIED as to date of retirement; recorded in a live audit]
- **AMP cache and signed exchanges:** obsolete from 1 July 2026; Search sends users directly to publishers' AMP host pages. [VERIFIED 2026-09]

### Entity disambiguation

- Still the best structured-data play, on entity-understanding grounds: `sameAs` to authoritative profiles (Wikidata where one legitimately exists, LinkedIn, Crunchbase, Companies House or equivalent registry, Google Business Profile), `legalName`, `alternateName`, company number via `identifier` or `taxID` as appropriate, `knowsAbout`, `founder`, `disambiguatingDescription` where the name collides with another entity. Google's stated purpose for Organization markup is to "disambiguate your organization in search results". [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/structured-data/organization
- One `@id` per entity across the whole site. Two nodes sharing an `@id` with different facts (for example different addresses) contradict each other.

---

## 6. llms.txt

**Stance: low-effort hygiene only. Never a prioritised lever, never a strategy, never promised to the user as a ranking or citation gain.**

- The spec is v2, modified 10 August 2026, still "a proposal … open for community input"; author Jeremy Howard (Answer.AI). [VERIFIED 2026-09] https://llmstxt.org/ https://llmstxt.org/changes.html
- v2: placement at any path (most specific wins); discovery via `rel="alternate"` with `type="text/markdown"` and `rel="describedby"`, through an HTML `<link>` or HTTP `Link:` header; `page.md` allowed; `/.well-known/` explicitly rejected. [VERIFIED 2026-09]
- `llms-full.txt` is not in the spec; it is a platform convention (Mintlify, Shopify). [VERIFIED 2026-09, absence confirmed]
- No standards body has adopted it; the only W3C artefact is a strategy issue with status "Investigation". Claims of a W3C working draft or an IETF registry are [UNVERIFIED] and contradicted by the primary source. [VERIFIED 2026-09] https://github.com/w3c/strategy/issues/506

| Vendor | Position | Label |
|---|---|---|
| Google Search | Does not use it: "You don't need to create new machine readable files, AI text files, markup, or Markdown to appear in Google Search". Note added 15 June 2026: such files "won't negatively or positively impact your visibility or rankings". https://developers.google.com/search/docs/fundamentals/ai-optimization-guide | [VERIFIED 2026-09] |
| Google Chrome | Lighthouse experimental Agentic Browsing category audits llms.txt; a 404 is marked Not Applicable. https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt | [VERIFIED 2026-09] |
| OpenAI | No statement; bot docs point to robots.txt only. https://developers.openai.com/api/docs/bots | [VERIFIED 2026-09, absence confirmed] |
| Anthropic | No statement; crawler article does not mention llms.txt. https://support.claude.com/en/articles/8896518 | [VERIFIED 2026-09, absence confirmed] |
| Perplexity | No support statement in docs. https://docs.perplexity.ai/docs/resources/perplexity-crawlers | [UNVERIFIED] |
| Microsoft / Bing | No statement either way. | [UNVERIFIED] |

- No AI vendor has publicly committed to reading third-party llms.txt files. Several publish one for their own developer docs, which is a different thing.
- 97% of llms.txt files received zero requests in May 2026 (Ahrefs, about 137,000 domains). [REPORTED 2026-09] https://ahrefs.com/blog/llmstxt-study/
- A single-operator log study (February to July 2026) found llms.txt is fetched mostly by scanners, auditors and research probes; GPTBot was not observed fetching it. [REPORTED 2026-09] https://www.wislr.com/articles/ai-bot-behavior-six-months-later
- Adoption: 5.61% of the top 10,000 origins serve a valid file (HTTP Archive, June 2026); the growth is mainly a Shopify default rollout around late April 2026. [VERIFIED 2026-09] https://caseyrb.com/blog/state-of-llms-txt-adoption/ https://shopify.dev/changelog/customize-llmstxt-llms-fulltxt-and-agentsmd
- The "844,000 websites" figure traces to no named crawl. [UNVERIFIED, do not cite]
- **What it does:** gets the site measured by AI-readiness tooling and Lighthouse's experimental audit; gives coding agents and research tools a curated table of contents.
- **What it does not do:** affect Google rankings or AI Overviews; carry any confirmed effect on ChatGPT, Claude, Perplexity or Copilot answers.
- If a site keeps one: a short curated table of contents (what the business is, main offers with links, markets served, key reference pages), kept in sync with the site. Do not expand it as a project.
- The live standards work on AI usage signals is IETF AIPREF (`Content-Usage`, drafts only, "DO NOT REFLECT CONSENSUS") and Web Bot Auth (adopted by an IETF working group, not yet an RFC). [VERIFIED 2026-09] https://datatracker.ietf.org/doc/draft-ietf-aipref-vocab/ https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/
- Cloudflare's `Content-Signal` has real syntax but no formal standing; its IETF draft expired and is "not endorsed by the IETF". [VERIFIED 2026-09] https://datatracker.ietf.org/doc/draft-romm-aipref-contentsignals/

---

## 7. Entity and authority signals

- Ahrefs (about 75,000 brands, Spearman correlations, last modified 12 August 2026): YouTube mentions are the strongest correlate of ChatGPT visibility (about 0.737); branded web mentions 0.656 to 0.709 across ChatGPT, AI Mode and AI Overviews; branded anchors 0.511 to 0.628; branded search volume 0.352 to 0.466; Domain Rating 0.266 to 0.326; backlink count "very weak". Correlation, not causation. [VERIFIED 2026-09] https://ahrefs.com/blog/ai-brand-visibility-correlations/
- Cross-engine overlap of brands mentioned: AIO and AI Mode 0.821, AI Mode and ChatGPT 0.769, AIO and ChatGPT 0.749. AI Mode is the hardest engine to break into for a small brand. [VERIFIED 2026-09]
- About 57% of all AI citations globally go to brand-owned sites (Profound, 11.84 billion citations, April to July 2026); in 24 of 29 industries the median brand gets more citations from its own site than from earned or social sources. [VERIFIED 2026-09] https://www.tryprofound.com/blog/where-do-ai-citations-come-from
- Ranqo puts corporate websites at about 78% of source citations; among non-corporate sources YouTube leads, ahead of Reddit, editorial media and Wikipedia. [VERIFIED 2026-09, abstract of a vendor preprint] https://arxiv.org/abs/2606.20065
- Muck Rack claims earned media is 84% of AI citations; method undisclosed, PR-oriented prompt set. Treat with caution; Profound and Ranqo are better documented. [REPORTED 2026-09] https://muckrack.com/blog/what-is-ai-reading-may-2026
- Brand stature: global household names appear in 73% of relevant AI answers, established mid-market brands 44%, niche and small 11%. [VERIFIED 2026-09, abstract] https://arxiv.org/abs/2606.20065
- The typical enterprise B2B brand is cited in 3% of AI answers it is relevant for (Walker Sands, 828 companies). [REPORTED 2026-09] https://www.walkersands.com/b2b-ai-search-visibility-hub/
- Reddit: 2.2% of all AIO citations, 6.6% of Perplexity, 1.4% in niche B2B. A minor channel for most B2B sites; the very high Reddit shares that circulate are share-within-top-10-domains figures. [VERIFIED 2026-09 for Profound; REPORTED 2026-09 for the B2B figure] https://www.tryprofound.com/blog/where-do-ai-citations-come-from https://overthinkgroup.com/b2b-ai-citation-stats-2026-q2/
- G2's network (G2, Capterra, GetApp, Software Advice) is 8% of B2B SaaS citations; AI Overviews cite YouTube more than any other domain in that set (7.4%). [REPORTED 2026-09] https://overthinkgroup.com/b2b-ai-citation-stats-2026-q2/
### Business profiles the engines run themselves

- **Businesses in ChatGPT (Business Hub)**, beta since 10 November 2026. Any eligible business located where ChatGPT is available can claim its profile at https://chatgpt.com/business-hub, verify by business phone, business email, a DNS TXT record on the website domain, or Shopify, then pass identity verification with Persona before it can publish changes or see insights. After approval it can edit the website, description, category, logo, cover photo, delivery and return policies, connect a product feed (CSV to OpenAI's product feed spec, or Shopify Catalog), and see 28-day aggregate insights: mentions (for an online business, only when ChatGPT references its website; the brand name alone does not count), website clicks and discovery topics. Business Agents (a chat with the business inside ChatGPT) are limited to eligible US ecommerce and online service businesses. OpenAI states that claiming "doesn't guarantee increased visibility" and that advertising does not influence ChatGPT's independent answers; changes are reviewed before they publish. Use the legal business name exactly as registered in the legal-name field. [VERIFIED 2026-11] https://openai.com/index/introducing-businesses-chatgpt/ https://help.openai.com/en/articles/20001635-setting-up-your-business-on-chatgpt
- **Google Business Profile** (Google Search, Maps, AI Overviews local answers) and **Bing Places** (Bing, Copilot) remain the main local and services listings; Bing Places can import from Google Business Profile. Treat both as phase 1 entity work for any business with a real address or service area. [REPORTED 2026-11, check each platform's current help pages before giving steps]
- **Apple Business Connect** controls how a business appears in Apple Maps, Siri and Spotlight; relevant for local and consumer businesses. [UNVERIFIED for any AI-answer effect] https://businessconnect.apple.com
- Practical rule: claim the engine-run profiles first (ChatGPT Business Hub, Google Business Profile, Bing Places, Apple Business Connect where relevant), with facts copied word for word from `offsite/entity-facts.md`. Measure ChatGPT Business Hub insights alongside the kit's own AI visibility checks; they count different things.

- **What this means in practice**
  - The site itself is the biggest single citation source, so own-site content quality and crawlability come first.
  - Consistent facts across independent profiles help engines resolve the entity; the specific "5+ platforms gives 3 to 4x citations" figure is [UNVERIFIED].
  - Genuine mentions on relevant independent sites (trade press, roundups, podcasts, video) are the off-site work with the best correlational support. Inauthentic mentions are on Google's myth list and risk spam policies.
  - YouTube is worth a strategic decision for any brand that can make useful video.
  - Named authors with real credentials and visible updated dates are sensible practice; the "1.8x more citations for clear author information" figure is [UNVERIFIED].

---

## 8. Measurement

### Google Search Console

- The Generative AI performance report (Search) rolled out to all sites worldwide on 31 August 2026. **Impressions only**: no clicks, CTR, position or queries. Dimensions: Pages, Countries, Dates, Devices. Covers AI Overviews and AI Mode; page data is assigned to the canonical URL; UI export only. [VERIFIED 2026-09] https://support.google.com/webmasters/answer/16984139
- No API or BigQuery access to AI-surface data: the Search Analytics API `type` accepts only `discover`, `googleNews`, `news`, `image`, `video`, `web`. [VERIFIED 2026-09, absence confirmed] https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- AI Overviews and AI Mode are included in the overall Performance report under "Web". There is no "AI Overview" search appearance filter in the UI, API or BigQuery; claims otherwise are false. [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/ai-features https://support.google.com/webmasters/answer/17011259
- Any per-site "AI Overviews CTR" is modelled, not measured.
- 13 to 17 August 2026: a logging error under-counted generative AI impressions (restored 21 August). Watch for similar data incidents before reporting a drop. [VERIFIED 2026-09] https://support.google.com/webmasters/answer/6211453

### AI referral traffic

- AI referral traffic was 1.08% of all website traffic, 87.4% of it from ChatGPT (Conductor, May to October 2025 data). [REPORTED 2026-09] https://www.businesswire.com/news/home/20251113364791/en/Conductor-Unveils-2026-AEO-GEO-Benchmarks-Report-How-AI-Shapes-Brand-Visibility-in-a-Zero-Click-World
- Google sends about 190x more traffic to websites than ChatGPT; AI Overviews appear on 21% of all keywords (9.5% of single-word, 46.4% of 7+ word queries). [VERIFIED 2026-09] https://www.businesswire.com/news/home/20260526119691/en/Across-75000-Brands-YouTube-Mentions-Are-the-Strongest-Signal-of-AI-Visibility-New-Ahrefs-Report-Reveals
- Over 30% of ChatGPT referral traffic goes to 10 domains. [REPORTED 2026-09] https://www.semrush.com/blog/chatgpt-search-insights/
- Track AI referrals in analytics by referrer (chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com, claude.ai and similar). Expect small numbers; report them as counts, not as a share of a modelled total.

### GEO KPIs

Track per engine, per prompt, per run, from a fixed prompt set (prompt set: `/aio-seo:ai-visibility`; ongoing tracking: Pro `/aio-seo-pro:visibility-tracking`):

| KPI | Definition |
|---|---|
| Mention rate | Share of answers that name the brand |
| Citation rate | Share of answers that link to one of the brand's URLs |
| Position | Rank of the first brand mention among brands named in the answer |
| Sentiment | Positive, neutral or negative framing of the brand |
| Factual errors | Count of wrong statements about the brand (price, location, offer, people, dates) |
| Competitor share | Mentions of each configured competitor on the same prompts |
| Source gaps | Third-party pages cited for the prompt where the brand is absent |

- Sentiment framing flips about 6.7x more often than whether a brand is mentioned at all, so a single run is noisy; compare trends across several runs. [VERIFIED 2026-09, abstract] https://arxiv.org/abs/2606.20065
- Only 36 brands held top-100 visibility on all four platforms every month in Semrush's index, a reminder that month-to-month variation is normal. [VERIFIED 2026-09]
- First-party data in Search Console is often the clearest signal: conversational, prompt-shaped queries (long natural-language questions, persona-framed questions) can appear in the query report at strong positions with tiny impression counts. Treat them as evidence of which questions AI fan-out is sending to the site. [Field observation 2026-09, one site]

---

## 9. Deprecated or changed practices

Dates are when the practice changed, not when it was recorded.

| Practice | Status | Changed | Label | Source |
|---|---|---|---|---|
| FAQPage markup for rich results | Dead; remove if it existed only for rich results | 7 May 2026 | [VERIFIED 2026-09] | https://developers.google.com/search/docs/appearance/structured-data/search-gallery |
| How-to markup | Dead | not recorded | [VERIFIED 2026-09] | search gallery |
| Practice problem markup | Docs removed | 6 Jan 2026 | [VERIFIED 2026-09] | https://developers.google.com/search/updates |
| Review/AggregateRating on your own business or services | Ineligible, including via widgets; incentivised reviews prohibited | 24 Jul 2026 (latest change) | [VERIFIED 2026-09] | https://developers.google.com/search/docs/appearance/structured-data/review-snippet |
| "Add schema to get cited in AI answers" | Contradicted by Google and by the only controlled test | 2026 | [VERIFIED 2026-09] | https://ahrefs.com/blog/schema-ai-citations/ |
| `Service` schema as an SEO tactic | Powers no Google feature | n/a | [VERIFIED 2026-09] | organization doc |
| "ProfessionalService is deprecated" | Misstated: it is an undocumented LocalBusiness subtype | n/a | [VERIFIED 2026-09] | organization doc |
| AMP cache and signed exchanges | Obsolete | 1 Jul 2026 | [VERIFIED 2026-09] | https://developers.google.com/search/updates |
| llms.txt as an SEO or AI lever | Not supported by any engine; Google says no effect | 15 Jun 2026 (Google note) | [VERIFIED 2026-09] | https://developers.google.com/search/docs/fundamentals/ai-optimization-guide |
| `llms-full.txt` as part of the spec | False | 10 Aug 2026 (v2) | [VERIFIED 2026-09] | https://llmstxt.org/ |
| AGENTS.md on a website as an AI lever | No engine fetches it | n/a | [VERIFIED 2026-09] | https://agents.md |
| Markdown variants as a citation lever | Plumbing real, benefit unproven | Feb 2026 | [VERIFIED 2026-09, absence of evidence] | Vercel, Cloudflare docs |
| "Chunking" or rewriting content for AI | On Google's mythbusting list | 2026 | [VERIFIED 2026-09] | ai-optimization-guide |
| A page per fan-out query | Scaled content abuse risk | 2026 | [VERIFIED 2026-09] | ai-optimization-guide |
| Your own "best [category]" list ranking yourself first | Risky: often cited while a competitor is recommended | Apr to Jun 2026 | [REPORTED 2026-09] | https://searchengineland.com/google-ai-overviews-cite-self-serving-listicles-recommend-competitors-480573 |
| "AEO/GEO is a separate discipline" | Google: "still SEO" | 2026 | [VERIFIED 2026-09] | ai-optimization-guide |
| "Up to 40% lift" from GEO techniques | Valid only in the original experiment | Jul 2026 survey | [VERIFIED 2026-09] | https://arxiv.org/abs/2607.14035 |
| Brand name in titles of non-branded pages | Mostly stripped by Google | Q1 2025 data | [VERIFIED 2026-09] | title rewrite study |
| Brackets in titles | Rewritten 77.6%, deleted 32.9% | 2022 data | [VERIFIED 2026-09] | https://zyppy.com/seo/google-title-rewrite-study/ |
| Hand-writing every meta description | Not required; programmatic generation encouraged | 20 Apr 2026 doc, 30 Jun 2026 Mueller | [VERIFIED 2026-09] | snippet doc |
| "Meta description 150 to 160 characters" as a hard rule | Not Google's position: no length limit | n/a | [VERIFIED 2026-09] | snippet doc |
| "Title 50 to 60 characters" as a CTR rule | Misframed: it is a rewrite-avoidance range | n/a | [VERIFIED 2026-09] | Zyppy |
| `anthropic-ai`, `Claude-Web` robots tokens | Retired from Anthropic's docs | 7 Apr 2026 | [VERIFIED 2026-09] | https://support.claude.com/en/articles/8896518 |
| Blocking `Google-Extended` as a free gesture | Also costs Gemini grounding | 14 Jul 2026 doc | [VERIFIED 2026-09] | google-common-crawlers |
| Sitemap ping | Deprecated | 2023 | [VERIFIED 2026-09] | |
| LCP "good" at 2.0s; INP "equal ranking signal from 18 March 2026"; "Visual Stability Index" | Fabricated; thresholds unchanged | n/a | [VERIFIED 2026-09, absence confirmed] | https://web.dev/articles/vitals |
| Vercel Speed Insights as a Core Web Vitals proxy | Hard navigations only, still reports FID | 25 Aug 2026 doc | [VERIFIED 2026-09] | https://vercel.com/docs/speed-insights/metrics |
| `developers.google.com/search/updates/ranking` | Gone; use the Search Status Dashboard | 2026 | [VERIFIED 2026-09] | dashboard |
| Filtering Search Console by "AI Overview" | Not possible in UI, API or BigQuery | n/a | [VERIFIED 2026-09] | https://support.google.com/webmasters/answer/17011259 |
| Next.js `experimental.ppr`, `middleware.ts`, `runtime = 'edge'` (Next.js only) | Removed, renamed to `proxy.ts`, deprecated | Next.js 16.0, 21 Oct 2025 | [VERIFIED 2026-09] | nextjs.org docs |

---

## 10. New-in-2026 checklist

General (any stack):

1. Confirm Search Console's "Search generative AI" setting reads "Include".
2. Start reading the Search Console generative AI performance report (impressions only, UI export only).
3. Check robots.txt, the CDN and the WAF allow the retrieval crawlers in section 1; make the training decision explicit and internally consistent; remove retired tokens.
4. If the site sits behind Cloudflare, check the AI crawler controls (defaults changed for new domains from 15 September 2026).
5. Remove FAQPage markup that existed only for rich results, and all self-serving Review/AggregateRating markup.
6. Keep every important claim, heading and JSON-LD block in server-rendered HTML.
7. Keep HTML under 2MB including inline payloads.
8. Track soft-navigation real-user metrics if the site uses client-side routing.
9. Fix title templates so the brand is not appended twice and the H1 matches the title.
10. Do not build an llms.txt or Markdown-variant programme and call it strategy. Enable if free, measure, expect nothing.

Next.js App Router only:

11. Cache or statically resolve metadata; uncached data in `generateMetadata()` blocks metadata prerendering under Cache Components.
12. Audit a Cache Components migration for pages that became dynamic by accident.
13. Migrate `middleware.ts` to `proxy.ts`, or crawler and redirect logic stops running.
14. Use `robots.ts`'s `other` field (16.3.0+) if the user wants `Content-Signal` or `Content-Usage` lines.
15. On Vercel, check the Firewall AI Bots ruleset reads Allow, and that no consent cookie is set on HTML routes.

---

## 11. Figures and sources not to use

All [UNVERIFIED] or wrong. If a user, a tool or a web page quotes one, flag it rather than repeat it.

- "Wikipedia is 47.9% of ChatGPT's sources" and "Reddit is 46.7% of Perplexity's" (share within the top 10 domains, not of all citations; all-citation figures are 7.8% and 6.6%).
- "Perplexity averages 21.9 citations versus ChatGPT 10.4".
- "ChatGPT traffic converts at 15.9% versus Google organic 1.76%".
- "Sources with clear author information are cited 1.8x more often".
- "The first cited source receives 47% of AI Overview clicks".
- "84 to 93% of AI citation weight sits on third-party sites".
- "AI Overviews appear in about 83% of searches" (recycled prevalence figures range 13% to 65%; use Ahrefs' 21% of keywords).
- Any 2026 CTR curve with "position 1 = 39.8%" (Search Console-derived figures are 1.6% to 3.9%).
- "Brackets get 38% more clicks"; "numbers in titles outperform by 15 to 20%".
- "Structured data gives 40% more citations", "+73% AI Overview selection", "2.5x more likely to appear in AI answers", "4+ schema types gives 14% higher inclusion".
- "844,000 websites have llms.txt"; "a June 2026 W3C proposal to standardise llms.txt".
- "Core Web Vitals are now assessed at site level".
- "A 2026 Navboost disclosure".
- The "252,000 trial" GEO factorial experiment (not locatable).
- The Seer "+176% CTR from human-written meta descriptions" figure (2023 data, non-equivalent groups).
- Aggregator domains with no disclosed method: authoritytech.io, machinerelations.ai, digitalapplied.com, omnibound.ai, quickseo.ai, answerengineered.com, thedigitalbloom.com, sqmagazine.co.uk, xseek.io, ustechautomations.com.
- Studies that do not exist: a Seer Interactive "AI citation correlation" study; a 2026 Terakeet empirical citation study; any peer-reviewed controlled study showing a causal citation lift from an on-page change; any study isolating UK professional services.

---

## 12. Defects that live audits keep finding

Generic learnings from weekly audits of production marketing sites in 2026. Check for each one; they are cheap to find and often high impact.

- **Meta description pulled from the wrong CMS field.** A summary or outline field holding HTML (for example a table of contents) wins an `a || b` fallback and is served, escaped, as the meta, OG and Twitter description. Structured data may read the right field, so schema and meta tags disagree. Check the rendered `<meta name="description">` on a sample of posts.
- **Double-branded titles.** A root layout title template appends the brand to per-page titles that already end in the brand. Also makes `<title>` disagree with `og:title`.
- **Self-serving review markup** on `Service` or `Organization` nodes, producing Search Console rich-result errors; sometimes "fixed" by moving it to `LocalBusiness`, which is still ineligible.
- **`@id` collisions:** two JSON-LD nodes share one `@id` but carry different facts (for example two addresses).
- **Breadcrumbs that point at the page itself or at the homepage** for a hub that does not exist; hub URLs (for example `/compare`, `/industries`) returning 404 while child pages exist.
- **Commercial pages with no contextual internal links** from the high-impression blog posts that cover the same topic; the footer is the only link.
- **`lastModified: now` in the sitemap** for every URL, which makes the field carry no information.
- **One shared "last updated" date** on many pages, which is a weak and mildly misleading freshness signal.
- **`dateModified` set to the publish date** in Article markup.
- **Content hidden with CSS or `aria-hidden`** that exists only for machines; a schema-content match liability.
- **CMS or SEO-tool markers rendering as visible content** (for example stray marker headings in post bodies).
- **Dead analytics tags** (for example legacy Universal Analytics) still loading.
- **Data provider bound to the wrong analytics property**, returning zero rows rather than an error. When analytics data comes back empty, check which property the provider reads before concluding there is no traffic.
- **Impression growth from off-topic content** in markets the business does not serve, at very low CTR. A content-strategy decision for the human, not a code fix.
- **Pages at positions 2 to 10 with low CTR** are usually title or description problems; check the live title first.

---

## 13. Open questions as at the last sweep

- Whether Googlebot's 2MB limit is new in 2026 or newly documented.
- The exact changelog date for Google's JS-injected canonical guidance.
- Vercel's current full AI Bots ruleset membership (not published).
- Whether the UK will be in scope for structured data carousels.
- What changed in Google's Organization structured data doc on 15 April 2026 (no changelog entry).
- EU AI Act general-purpose AI enforcement dates were taken from search summaries, not a direct read; re-check before relying on them.
- Whether analytics cookies gained any consent exemption in UK law after the Data (Use and Access) Act 2025 (not checked; see compliance-uk.md).
