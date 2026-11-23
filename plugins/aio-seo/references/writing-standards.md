# Writing and extractability standards

Shared by every skill that writes or edits a page: `blog`, `pages`, `maintain`, `offsite` (drafts), the Pro skills that write pages and the `content-reviewer` agent. It decides what a page must contain and how it is structured. The project's voice skill (config `house_rules.voice_skill`) decides how it sounds.

Precedence when rules conflict:

1. Law and platform policy: `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md` (when `house_rules.compliance` lists UK rules).
2. Sourcing rules in this file.
3. `house_rules` in `.agents/aio-seo/config.json`.
4. The voice skill (tone, phrasing, person).
5. Everything else in this file.

## 1. What is evidence and what is house convention

Be honest with the user about why each rule exists. Several common "AI SEO" rules are conventions, not documented ranking mechanisms.

- Google says structured data is not required for generative AI search and there is no special markup for it; the one positive instruction is that structured data must match the visible text. [VERIFIED 2026-09] Sources: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide, https://developers.google.com/search/docs/appearance/ai-features
- Google lists "chunking" content into tiny pieces and rewriting content specifically for AI systems as myths ("AI systems can understand synonyms and general meanings"). [VERIFIED 2026-09] Source: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Creating a page per AI "fan-out" query variation primarily to manipulate rankings or AI responses violates Google's scaled content abuse policy. [VERIFIED 2026-09] Same source.
- Major AI crawlers fetch HTML and do not execute JavaScript, so primary content, headings and JSON-LD must be in the server-rendered HTML. [REPORTED 2026-09] Source: https://vercel.com/blog/the-rise-of-the-ai-crawler
- A 45-study survey found no on-page technique with a stable, longitudinal, cross-platform causal effect on AI visibility. [VERIFIED 2026-09] Source: https://arxiv.org/abs/2607.14035

So: the answer block, question-shaped headings, tables and FAQ sections below are **house conventions** chosen because they make a page easy for a person to scan and easy for any system to quote accurately. Do not tell users they "make AI cite you". For current evidence, read `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` before stating anything about how search engines or AI assistants behave.

## 2. Page anatomy (every page type)

| Element | Rule |
|---|---|
| H1 | One per page. Contains the primary query in natural wording. Matches the `<title>` closely (see section 7). |
| Byline | Named author from config `house_rules.author` (or the page's author field), linked to an author page that exists. Organisation pages may use the organisation as author. |
| Dates | Visible "Published" and "Updated" dates. Change `updated` only for substantive edits (new sections, new data, corrected facts). Bumping the date on a cosmetic edit is misleading. |
| Answer block | The first paragraph after the H1 (ignoring a byline or dateline) answers the primary question directly in **40 to 60 words**, and makes sense quoted on its own: name the subject, give the answer, include the key number or condition. No "In this article we will...". |
| Headings | H2/H3 phrased the way people ask. Use real queries from Search Console or People Also Ask. At least one H2 is a question. One idea per section; the first sentence of each section answers its heading. |
| Tables | Any comparison of three or more options, prices, specs or steps with attributes goes in a Markdown/HTML table, not prose. Tables must be real `<table>` markup in the rendered HTML (not images). |
| Lists | Numbered lists for sequences, bullets for sets. |
| Specifics | Named tools, numbers, dates, durations, costs. "Communicate well" is useless; "a weekly 30-minute demo with a shared changelog" is useful. |
| Sources | Every statistic, figure or research claim links its primary source inline or by footnote, and the page ends (before the FAQ) with a `## Sources` section or footnote definitions. No source, no claim. |
| Internal links | At least 3 contextual internal links with descriptive anchor text (never "click here"), including the matching offer page where relevant. |
| FAQ | Optional on most pages, required on blog posts: see section 5. |
| Disclosure | Required when the page compares or recommends anything the business sells: see section 6. |
| Close | Resolve the opening question; one low-pressure next step. |

## 3. Page types and what each must include

Match the type to the search intent of the primary query (keyword intent plus SERP shape), then rotate for variety. Never invent a case study, client, quote or number to fill a type; pick another type.

| Type | Fits queries like | Must include |
|---|---|---|
| Direct-answer explainer | "what is X", "how does X work" | 40 to 60 word definition first, mechanics, when it applies, when it does not, a worked example |
| Definition / glossary entry | "X meaning", "X definition" | One-sentence definition, then 2 to 4 short paragraphs, related terms linked, no padding. Short pages are fine (`--words off` in lint) |
| Step-by-step / how-to | "how to X", "X checklist", "X process" | Numbered steps, each starting with a verb; tools named; time and cost where known; what can go wrong |
| Comparison (X vs Y) | "X vs Y", "X or Y" | Summary table near the top with dated facts, honest trade-offs, who each option suits, disclosure line |
| Alternatives / roundup | "X alternatives", "best X" | Stated selection criteria, per-item section with the same attributes, summary table, disclosure line. Do not rank yourself first by default (see below) |
| Original data / research | "X statistics", "X survey", "X benchmark" | Method (sample, dates, how collected), the dataset or summary table, limits, how to cite it. Only data the business actually holds or collected in this run |
| Cost / pricing guide | "X cost", "how much is X" | Ranges with sources and dates, what drives cost, a worked example; links to the site's pricing page rather than competing with it |
| Myth-busting / dos and don'ts | "is X worth it", "X mistakes" | Each claim, the evidence, the source |
| Opinion on news | Trending query tied to an event | The event (sourced, dated), the author's view, what the reader should do |
| Case study | "X example", "X case study" | Real engagement only, with written client consent recorded; otherwise anonymised |
| Trends | "X trends 2026" | Dated data points, what changed, implications |

Notes:

- Ranked "best of" lists are among the most-cited formats in AI answers [REPORTED 2026-09] (Source: https://arxiv.org/abs/2606.20065), but when Google cited a brand's own "best" page, it recommended a competitor in 69% of the cases studied [REPORTED 2026-09] (Source: https://searchengineland.com/google-ai-overviews-cite-self-serving-listicles-recommend-competitors-480573). Write roundups with real criteria and do not place your own product first unless the stated criteria put it there.
- Original data is the format competitors cannot copy. Prefer it whenever the business has real numbers it is willing to publish.

## 4. Claims, numbers and dates

- **No invented data.** Every number, quote, result and client name comes from a tool result or a cited source in this run (recorded in the research file), or from the user. If you cannot source it, cut it.
- **Primary sources.** Official statistics, original research, vendor documentation for vendor facts, legislation for law. Aggregators and other blogs are not sources for market figures.
- **Dated claims.** Anything that changes (prices, plans, features, rankings, laws, statistics) carries an "as of" date or the source's publication date: "as of 31 October 2026", "(ONS, March 2026)".
- **Age.** Avoid statistics older than 3 years unless nothing newer exists; say so when you use one.
- **Quote as stated.** Do not stretch "UK SMEs" into "all businesses", or a US sample into a UK claim.
- **Business claims.** Claims about the business's own results need evidence the team can produce. No unverifiable superlatives ("the best", "the fastest", "number one").
- **Community content is not evidence.** A Reddit thread or video is an opinion; paraphrase and link it, never present it as a statistic.

## 5. FAQ sections

- 3 to 6 questions, each ending with "?", taken from real queries (Search Console, People Also Ask, sales questions). Each answer 40 to 60 words, self-contained, consistent with the body.
- Keep FAQ sections **visible** on the page. They help readers and give any system a clean question-and-answer pair to quote.
- FAQPage structured data: Google's FAQ rich result stopped appearing on 7 May 2026 and its documentation was removed in June 2026. [VERIFIED 2026-09] Source: https://developers.google.com/search/updates. Follow the current advice in `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` on whether to emit it. If emitted, it must match the visible questions and answers exactly.
- Formats the lint understands: an H2 named "Frequently asked questions"/"FAQ" followed by H3 questions or bold questions, or a frontmatter `faqs:` list (`q`/`a` or `question`/`answer`).

## 6. Disclosure lines

Add a one-paragraph disclosure directly under the answer block whenever a page compares, ranks or recommends products or services and the business sells one of them, or has a commercial relationship with any of them:

> **Disclosure:** {{product}} is our product. We have included it alongside tools we do not make. Every fact about other products comes from the vendor's own website, checked on {{date}} and linked in the sources. Prices are as shown on that date and may change.

Adapt the wording to the voice skill; keep the three facts: ownership, where competitor facts come from, the date checked. Comparisons must also follow the CAP Code rules summarised in `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md` (accurate, verifiable, like-for-like, not denigrating, dated).

## 7. Metadata

- **Title tag:** primary query near the start, aim for 50 to 60 characters, no brand suffix inside the field if the layout adds one. Titles of 51 to 60 characters had the lowest rewrite rate in the largest disclosed study (data from 2022). [VERIFIED 2026-09] Source: https://zyppy.com/seo/google-title-rewrite-study/
- **Keep title and H1 aligned.** Google uses the H1 among its inputs for title links and replaces stale years with the date from the visible title. [VERIFIED 2026-09] Source: https://developers.google.com/search/docs/appearance/title-link. If the title has a year or number, the H1 has the same one.
- **Meta description:** 50 to 160 characters (aim for 140 to 160), contains the primary query, states what the reader gets with a concrete fact. Google often writes its own snippet from the page content, so the body's answer block matters more. [VERIFIED 2026-09] Source: https://developers.google.com/search/docs/appearance/snippet
- **Slug:** lowercase, hyphens, contains the primary query, no date unless the topic is time-bound. Never change a slug that earns impressions.
- **Frontmatter:** copy field names and date formats from the site's schema or newest post. The schema is the source of truth.

## 8. House rules

From config `house_rules`:

- `spelling`: apply consistently (British English by default: -ise, -our, -re, "per cent" or "%" as the house prefers).
- `banned_characters`: search the final text, metadata and frontmatter. Default bans em and en dashes; use commas, colons or "to" for ranges.
- `banned_phrases`: search for each phrase and its variations. Patterns with capital-letter placeholders such as "it's not X, it's Y" cover any wording of that reframe.
- No hype words, no filler openers, no rhetorical reframes.

## 9. Mechanical checks

Run both on every changed content file before a PR, and fix every error:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/content-lint.mjs <files> --config .agents/aio-seo/config.json
node ${CLAUDE_PLUGIN_ROOT}/scripts/house-style.mjs <files>
```

`content-lint.mjs` checks frontmatter, title and description length, dates, answer block, question H2, FAQ shape, sources, word count, internal links, banned characters/phrases and https links (`--help` for options; use `--words off` for glossary and FAQ pages that are short by design). `house-style.mjs` checks the house style rules. A lint pass does not replace the judgement checks in the skill's quality gate or the `content-reviewer` agent.
