# Structured data policies

Apply all of these on every run. Labels and sources: `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` section 5 unless stated.

## 1. Visible and true

- Every property value appears on the page (or is a plain fact about the page, such as its URL or language). No hidden FAQs, no prices that are not shown, no awards, ratings or founders that the page does not mention.
- Google: "Making sure your structured data matches the visible text on the page" is the positive instruction for AI features [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/ai-features
- When the page and config disagree (address, phone, company number), stop and ask, or record it under "Not verified". Do not pick one silently.

## 2. Reviews and ratings

- Never add Review, Rating, AggregateRating or EmployerAggregateRating about the business itself, its products or its services, in any node, including via review widgets. Google: self-controlled reviews make Organization and LocalBusiness pages "ineligible for star review feature" [VERIFIED 2026-09] https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- July 2026 guideline against fake or undisclosed incentivised reviews [VERIFIED 2026-09]. UK DMCC Act 2024 rules on fake reviews: `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`.
- Existing self-serving markup: remove it and explain in the PR. Do not "fix" it.
- Only a site that genuinely reviews other businesses' products may use review markup, and only for those; pass `--allow-reviews` to the validator in that case and record why in config notes.

## 3. Entity graph

- One Organization node, `@id` `<origin>/#organization`, emitted site-wide; one WebSite node, `@id` `<origin>/#website`, with `publisher` pointing at the Organization.
- Every other node refers to them by `@id` (`publisher`, `worksFor`, `about`, `isPartOf`) rather than repeating the facts. Two nodes with the same `@id` and different facts contradict each other.
- People: one Person per real person, `@id` `<person page>#person`, `worksFor` the Organization, `sameAs` their own official profiles.
- `@id` values are absolute URLs on the canonical host. Never change them once live (they are identifiers, not links).
- Use the most specific Organization subtype that is true (Google's guidance [VERIFIED 2026-09]); for a business without premises that is usually `Organization` itself.

## 4. sameAs and disambiguation

- `sameAs` comes from config `entity.same_as` and `.agents/aio-seo/offsite/entity-facts.md`: official profiles only (LinkedIn company page, Wikidata item where one legitimately exists, Crunchbase, Companies House or the equivalent register, GitHub organisation, Google Business Profile, official social accounts).
- Never add a profile you have not confirmed belongs to the business. Never create a Wikidata item or other profile from this skill; hand that to `/aio-seo:offsite`.
- Add `legalName`, `identifier` (company number with the register named), `vatID` where public, `foundingDate`, `address`, `contactPoint`, `knowsAbout`, and `disambiguatingDescription` when another entity shares the name. Google's stated purpose for Organization markup is to "disambiguate your organization in search results" [VERIFIED 2026-09].
- `description` is the entity line from config, verbatim, identical to the root meta description and llms.txt.

## 5. Deprecated or restricted (as recorded in the knowledge base)

| Type or practice | Status | Action |
|---|---|---|
| FAQPage | Rich result stopped 7 May 2026, docs removed June 2026 [VERIFIED 2026-09] | Keep only where the Q&A is visible; remove where it existed only for rich results |
| HowTo | Doc redirects to a deprecation note [VERIFIED 2026-09] | Same as FAQPage |
| Practice problem | Docs removed 6 January 2026 [VERIFIED 2026-09] | Remove |
| Review or AggregateRating about yourself | Ineligible [VERIFIED 2026-09] | Remove |
| Sitelinks search box (`SearchAction` on WebSite) | No longer a Google feature [UNVERIFIED as to retirement date] | Harmless; do not add new ones |
| Service, OfferCatalog for professional services | Consumed by no Google feature [VERIFIED 2026-09, absence confirmed] | Allowed as description, never sold as a lever |
| Carousel (beta) | EEA, Turkey, South Africa, consumer verticals only [VERIFIED 2026-09] | Do not build for UK B2B sites |

Re-check this table against Google's Search Gallery and changelog (https://developers.google.com/search/updates) if the labels are more than six months old, and record drift in the run log.

## 6. Values

- URLs: absolute, canonical host, no tracking parameters.
- Dates: ISO 8601 (`2026-03-01` or with time and offset); `dateModified` never before `datePublished`; never in the future; from content, not build time.
- Prices: decimal strings without currency symbols, `priceCurrency` = `project.currency` (ISO 4217), VAT flag from config. A free offer is `"0"`.
- Durations: ISO 8601 (`PT12M30S`).
- Text: plain text, no HTML, no keyword stuffing; headline matches the visible H1 or title.
- Serialisation: escape `<`, `>`, `&`, U+2028 and U+2029 (the template's `serializeJsonLd()` does) so a value can never close the script tag.

## 7. Server-rendered

Emit JSON-LD in the server HTML. Major AI crawlers do not run JavaScript [VERIFIED 2026-09 as figures, study from 2024 to 2025], and a client-injected block is also missed by `validate-jsonld.mjs` and `curl`. Google renders JavaScript, so the Rich Results Test may show markup that other consumers never see.
