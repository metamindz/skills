# UK compliance for SEO and AIO work

**Last reviewed:** 2026-11-17. Same re-verify rule as the knowledge base: re-check any source dated more than 6 months ago before relying on it.

This file lists the UK rules that most often affect SEO and AIO work: comparison pages, reviews, affiliate and partner content, lead capture, free tools, cookies and accessibility. It is a working checklist for the agent, **not legal advice**. When a decision carries real legal risk (a named competitor, a new data collection, a regulated sector), draft the change, flag the question in the PR description or run log, and leave the decision to the human.

## When this file applies

- Every skill reads `house_rules.compliance` from `.agents/aio-seo/config.json`. The default is `["uk-cap-code", "uk-dmcc-reviews", "uk-gdpr", "pecr"]`.
- Apply a section only when its key is in that list:

| Key | Section |
|---|---|
| `uk-cap-code` | 1. Advertising claims and comparisons, 2. Identifying marketing |
| `uk-dmcc-reviews` | 3. Reviews and testimonials |
| `uk-gdpr` | 4. Personal data |
| `pecr` | 5. Marketing emails and cookies |

- Section 6 (accessibility) and section 7 (AI training opt-outs) are always advisory; they never block a change.
- Section 3's ban on fake reviews and self-serving review markup also follows Google policy (see knowledge-base.md section 5), so keep it on even when the UK keys are removed.

### Switching it off for a non-UK project

1. Set `project.market` to the real market (for example `US`) and `project.language` to its locale.
2. Remove the UK keys from `house_rules.compliance`, or replace them with your own labels (for example `["us-ftc-endorsements"]`). Skills apply only the keys they recognise and log any unknown key under "Assumptions made" as "compliance key X has no built-in checklist; applied general honesty rules only".
3. The following always stay on, whatever the config says: no invented facts or numbers, no fake reviews or ratings, no self-serving Review/AggregateRating markup, no comparisons that cannot be sourced, no sending messages or creating accounts on the user's behalf.
4. If the site serves the UK as well as other markets, keep the UK keys.

---

## 1. Advertising claims and comparisons (CAP Code)

**Scope.** Since 2011 the CAP Code covers marketing claims on a company's own website. Purely editorial content may fall outside it, but blog posts, landing pages, comparison pages and free-tool pages that make claims about the business or compare it with competitors are likely to be treated as marketing communications. Write as if they are in scope. [^asa-remit]

**Substantiation (rule 3.7).** Hold documentary evidence for every objective claim before it goes live. [^cap3]
- Every number, "fastest", "only", "first" or "most" claim needs a source the team can produce (internal data the user has confirmed, a dated third-party page, a case study with consent).
- If the evidence is missing, remove or soften the claim. Do not invent a figure to fill the gap.
- Avoid "only" and "first" unless you have checked every competitor; other tools often do the same thing.

**Prices (rules 3.17 to 3.19).** Price statements must not mislead and must include non-optional taxes and charges that apply to all or most buyers; VAT-exclusive prices are acceptable only in limited cases and need a prominent statement of the VAT. [^cap3] Use `project.prices_include_vat` and `project.currency` from config. Quote competitor prices exactly as the vendor shows them, in their currency, with the date read; never convert or round them.

**Comparisons with competitors (rules 3.33 to 3.44).** [^cap3]
- 3.33: compare products that meet the same needs or serve the same purpose.
- 3.34: compare material, relevant, verifiable and representative features (price can be one).
- 3.35: do not create confusion between the business and a competitor, or their marks.
- 3.37: comparisons with unidentifiable competitors must not mislead or pick an unrepresentative set.
- 3.38 and 3.39: make the basis of any price comparison clear; do not claim a false price advantage.
- 3.41: do not discredit or denigrate a competitor, its product or its marks.
- 3.42: do not take unfair advantage of a competitor's name or reputation.
- 3.44: no fake consumer reviews (see section 3).
- For business-to-business marketing the Business Protection from Misleading Marketing Regulations 2008 also apply. [^bpr]

**Working rules for comparison, alternatives and "vs" pages**
- Every fact about a competitor comes from the competitor's own site or another citable source, with the URL and the date read (a `checkedOn` or "as of" date). Show the date on the page.
- If the competitor's site does not say, write "Not stated". Never guess.
- List the competitor's genuine strengths alongside the business's own.
- Do not put a competitor's name next to a negative claim unless you can link the evidence.
- Re-check comparison facts within `pages.compare_checked_within_days` (default 90); flag stale pages (Pro: `/aio-seo-pro:commercial-pages refresh-compare`; without Pro, re-check by hand).
- Do not publish a "best [category]" list that ranks the business first without an honest, sourced method; it is a CAP Code risk and an AIO risk (knowledge-base.md section 4).

**Promotions (CAP Code section 8).** Discounts, free trials and limited-time offers must state significant conditions and closing dates; urgency claims ("ends tonight") must be true. [^cap8] [^countdown] The CMA's unfair commercial practices guidance (CMA207) covers the same ground under consumer law. [^cma207]

---

## 2. Identifying marketing, affiliates and partners (CAP Code 2.1 and 2.3)

- Rule 2.1: marketing communications must be obviously identifiable as such. [^asaaff]
- Rule 2.3: marketers must not falsely claim or imply they are acting as consumers, and must make commercial intent clear where the context does not. [^asaaff]
- Affiliate content needs an upfront label such as "Ad" (in a blog title or at the start of a post). Bottom-of-page disclaimers and vague wording such as "may earn commission" are unlikely to be acceptable; a standalone "affiliate" label has been ruled insufficient. The brand and the affiliate are both responsible. [^asaaff]
- Free products, free access and gifts count as payment for disclosure purposes. [^asainf]

**Working rules**
- If the site publishes partner, sponsored or affiliate content, label it at the top.
- If the business pays or rewards a third party (a creator, a directory, a roundup author) for a mention, the drafted outreach must say the mention has to be labelled. Never draft an ask for an unlabelled paid mention.
- Never write content that pretends to be an independent customer, reviewer or community member (forum posts, Reddit answers, review-site entries). This also breaches Google's spam policies.
- Never buy links. Google's spam policy on link schemes applies regardless of market.

---

## 3. Reviews and testimonials (DMCC Act 2024)

The Digital Markets, Competition and Consumers Act 2024, Schedule 20, paragraph 13 lists these as commercial practices that are unfair in all circumstances (in force 6 April 2025): [^dmcc]
- 13(1): submitting or commissioning a fake consumer review, or a review that conceals that it was incentivised.
- 13(2): publishing reviews or review information in a misleading way, for example suppressing negative reviews, giving one kind more prominence, or omitting that reviews were commissioned.
- 13(3): publishing reviews without reasonable and proportionate steps to prevent and remove fake, undisclosed-incentivised or misleading review information.
- 13(4): offering services to traders to do any of the above.
- 13(5): a fake consumer review is one that appears to be based on a person's genuine experience but is not.

The CMA has published guidance for businesses on complying with these rules (CMA208, 4 April 2025). [^cma208] CAP Code rule 3.44 also bans fake consumer reviews in marketing. [^cap3] ASA guidance on testimonials and endorsements applies to anything quoted on the site. [^asatest]

**Working rules**
- Never write, invent, paraphrase into existence or "improve" a review, rating or testimonial.
- Quote a testimonial only if the user provides it with the source and confirms consent to publish it; quote it word for word.
- Show reviews in a way that is representative: do not hand-pick only five-star reviews and present them as the overall picture.
- Solicit reviews from genuine customers only, ask all comparable customers (not only happy ones), and never offer an incentive conditional on a positive review. If any incentive is offered, it must be disclosed and must also be allowed by the platform's own rules (many review platforms forbid incentives entirely; check before drafting).
- Never add Review or AggregateRating structured data for the business's own reviews (Google ineligibility, knowledge-base.md section 5). The UK legal risk is separate and additive.
- Client stories: no client name, logo or identifying detail without written consent. [^writing]

---

## 4. Personal data (UK GDPR)

Applies to lead forms, free tools that collect an email, newsletter sign-ups, analytics and anything that stores visitor data.

- Every collection of personal data needs a lawful basis (UK GDPR Article 6). For B2B prospect data, legitimate interests is common but needs the ICO's three-part test (purpose, necessity, balancing) on file. [^ico-li]
- Consent must be a free choice, asked for separately, and never a condition of using a form or tool. A pre-ticked box is not consent (UK GDPR recital 32, as cited in the source codebases). Keep "accept the terms" and "send me marketing" as two separate boxes, the marketing one unticked by default.
- Collect the minimum: do not add fields (phone, company size, job title) to a lead form unless the user confirms a need.
- The privacy notice must cover what the form or tool collects, why, the lawful basis, retention, who it is shared with and the person's rights, including the right to complain to the ICO. [^ico-complaint]
- Free tools that process uploaded content: say what happens to it, how long it is kept, and whether it is used to train models. If any of that is unknown, ask the user before writing the copy.
- Error monitoring and session replay on marketing pages can capture personal data; replay that records visitors needs consent under PECR (see section 5). Scrub emails and names from logs.
- If a new free tool profiles people or processes special-category data, flag that a data protection impact assessment may be needed. [^ico-dpia]
- Never put personal data in URLs or query strings (including UTM parameters).

---

## 5. Marketing emails and cookies (PECR)

**Electronic marketing** [^ico-pecr-email] [^ico-b2b]
- Emails to corporate subscribers (limited companies, LLPs, Scottish partnerships) do not need prior consent under PECR, but the sender must identify itself and give an easy opt-out, and should honour opt-outs.
- Sole traders and other partnerships count as individuals: consent is needed first. If unsure which a recipient is, treat them as an individual.
- A personal-domain address (Gmail, Outlook.com and similar) may be an individual subscriber; do not add it to a marketing list without consent.
- The ICO's B2B marketing guidance was marked as under review after the Data (Use and Access) Act 2025; re-check it before relying on it. [^ico-b2b]
- PECR fines can reach £17.5m or 4% of turnover under the Data (Use and Access) Act 2025. [REPORTED 2026-10, secondary source; commencement instrument not checked] [^duaa]
- **Plugin rule:** the plugin never sends email. Outreach drafts in `offsite/outreach.md` must include the sender's identity, where the contact was found and a one-line opt-out, and must note whether the recipient is likely corporate or individual.

**Cookies and similar technologies** [^ico-cookies]
- Tell people what cookies are set and why, and get consent before setting any non-essential cookie. Consent needs a clear positive action; continuing to browse does not count.
- Do not set non-essential cookies on page load before consent.
- Exemption: cookies strictly necessary to provide a service the user asked for (for example a basket, a security cookie, a cookie that remembers a completed download form). Helpful but non-essential cookies still need consent.
- Analytics cookies: the ICO page read on 2026-11-17 lists no exemption for them, so treat them as needing consent. Whether the Data (Use and Access) Act 2025 created an exemption was not verified; do not assume one. [UNVERIFIED]
- With Google Consent Mode, default every storage type to denied until the visitor accepts.
- Embedded third-party players (for example YouTube) can set cookies before consent; load a click-to-play facade or the privacy-enhanced embed.
- SEO note: a consent cookie set on an HTML route can make it uncacheable at the CDN (knowledge-base.md section 2), so set it client-side or on a non-HTML route.

---

## 6. Accessibility basics (advisory)

- Target WCAG 2.2 level AA (W3C Recommendation, 12 December 2024). [^wcag22]
- The checks that most often matter on marketing pages and free tools:
  - Text contrast at least 4.5:1 (1.4.3 Contrast (Minimum), level AA). [^wcag22]
  - Autoplaying or moving content (hero video, carousels) needs a way to pause, stop or hide it (2.2.2 Pause, Stop, Hide, level A); respect reduced-motion preferences. [^wcag22]
  - One H1, logical heading order, descriptive alt text, labelled form fields, visible focus states, keyboard access to every control.
- These overlap with SEO and with agent readability (Lighthouse's experimental Agentic Browsing category reuses accessibility audits, knowledge-base.md section 2).
- Legal duties around accessibility for private-sector UK sites were not verified for this file. Do not tell the user the site is or is not legally compliant; report WCAG findings as findings.

---

## 7. AI training opt-outs (advisory)

From knowledge-base.md, labels as recorded there:
- The UK has no general commercial text-and-data-mining exception equivalent to EU DSM Article 4; s.29A CDPA covers non-commercial research only. [VERIFIED 2026-09]
- The UK Government's March 2026 report dropped a broad TDM exception with opt-out as its preferred option; "In the absence of any new legislation, the status quo will continue." [VERIFIED 2026-09] https://www.gov.uk/government/publications/report-and-impact-assessment-on-copyright-and-artificial-intelligence/report-on-copyright-and-artificial-intelligence
- EU DSM Article 4 lets rights holders reserve TDM by machine-readable means; that matters for EU-facing exposure. [VERIFIED 2026-09] https://eur-lex.europa.eu/eli/dir/2019/790/oj/eng
- You cannot both maximise AI citation and keep a robust training reservation. Present the trade-off; the user decides. Enforceability of robots.txt or `Content-Signal` against a non-compliant crawler in the UK is untested.

---

## Checklist for skills

Run before opening a PR that changes public content, forms or structured data:

- [ ] Every objective claim has a source the team can produce, or has been removed.
- [ ] Competitor facts carry a source URL and a read date; no denigration; strengths listed fairly.
- [ ] Prices state VAT treatment per config; competitor prices quoted as shown, with date.
- [ ] Paid, partner or affiliate content labelled at the top.
- [ ] No invented or edited reviews or testimonials; testimonials have consent on record.
- [ ] No Review or AggregateRating markup for the business's own reviews.
- [ ] Forms: separate unticked marketing box; privacy notice covers the new collection; minimum fields.
- [ ] No non-essential cookies before consent; no personal data in URLs.
- [ ] Contrast, pause controls and headings checked on changed pages.
- [ ] Anything uncertain listed in the PR description under "Compliance questions for the human".

---

[^asa-remit]: ASA, "Remit: own websites", https://www.asa.org.uk/advice-online/remit-own-websites.html
[^cap3]: CAP Code (non-broadcast), Section 03 Misleading advertising, rules 3.7, 3.17 to 3.19, 3.33 to 3.44, https://www.asa.org.uk/codes-and-rulings/advertising-codes/non-broadcast-code.html (read 2026-11-17)
[^bpr]: The Business Protection from Misleading Marketing Regulations 2008, https://www.legislation.gov.uk/uksi/2008/1276/contents
[^cap8]: CAP Code section 8, promotional marketing, https://www.asa.org.uk/type/non_broadcast/code_section/08.html
[^countdown]: ASA, "It's the final countdown, but is it really?", 20 April 2023, https://www.asa.org.uk/news/it-s-the-final-countdown-but-is-it-really.html
[^cma207]: CMA, "Unfair commercial practices" (CMA207), 18 November 2025, https://assets.publishing.service.gov.uk/media/691b9bd821ef5aaa6543ee6f/Unfair_commercial_practices_CMA207_18_Nov_2025__2_.pdf
[^asaaff]: CAP, "Online affiliate marketing", AdviceOnline, 22 March 2023, https://www.asa.org.uk/advice-online/affiliate-marketing.html (read 2026-11-17)
[^asainf]: ASA and CMA, "Influencers' guide", 2023, https://www.asa.org.uk/static/790d2e01-e3f8-4fea-b3c99ef91a9f04dc/Influencerguidance2023v4-FINAL.pdf
[^dmcc]: Digital Markets, Competition and Consumers Act 2024, c. 13, Schedule 20, paragraph 13, https://www.legislation.gov.uk/ukpga/2024/13/schedule/20 (read 2026-11-17; commencement 6 April 2025 per S.I. 2025/272 as shown on that page)
[^cma208]: CMA, "Fake reviews" guidance (CMA208), published 4 April 2025, https://www.gov.uk/government/publications/fake-reviews-cma208 (read 2026-11-17)
[^asatest]: ASA/CAP, "Testimonials and endorsements", https://asa.org.uk/advice-online/testimonials-and-endorsements.html
[^writing]: Plugin writing standards, `${CLAUDE_PLUGIN_ROOT}/references/writing-standards.md`
[^ico-li]: ICO, "How do we apply legitimate interests in practice?", https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/legitimate-interests/how-do-we-apply-legitimate-interests-in-practice/
[^ico-dpia]: ICO, "When do we need to do a DPIA?", https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/
[^ico-complaint]: ICO, "Make a complaint", https://ico.org.uk/make-a-complaint/
[^ico-pecr-email]: ICO, "How do we comply with the PECR electronic mail marketing rules?", https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/
[^ico-b2b]: ICO, "Business-to-business marketing", https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/ (marked under review after the Data (Use and Access) Act 2025)
[^duaa]: Bratby Law, "DUAA takes effect", 2026, https://bratby.law/duaa-takes-effect-ico-enforcement/ (secondary source)
[^ico-cookies]: ICO, "Cookies and similar technologies", https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/ (read 2026-11-17; no last-updated date shown)
[^wcag22]: W3C, "Web Content Accessibility Guidelines (WCAG) 2.2", W3C Recommendation, 12 December 2024, https://www.w3.org/TR/WCAG22/
