# Structured data by page type

Builders named here are in `${CLAUDE_PLUGIN_ROOT}/templates/nextjs/lib/seo/jsonld.ts`. "Rich result" is whether Google's Search Gallery (25 features, last updated 2026-06-15) offers a feature for it [VERIFIED 2026-09, knowledge-base section 5]. Every value must also be visible on the page.

| Page type | Nodes | Builder | Inputs and source | Rich result |
|---|---|---|---|---|
| Every page (root layout) | Organization, WebSite (+ Person for named people) in one `@graph` | `siteGraph()` | config `entity.*`, `project.*` | Organization is in the Search Gallery but works as an entity signal (logo choice, disambiguation), not a visual rich result |
| Home | site graph only; optionally SoftwareApplication or Product if the home page is the product page | `siteGraph()`, `softwareApplicationJsonLd()` | pricing rows | see Software below |
| About, company | AboutPage with `about` the Organization | `webPageNode({ type: 'AboutPage' })` | page copy | none |
| Contact | ContactPage | `contactPageJsonLd()` | `entity.contact_email`, `entity.phone`, address as shown | none |
| Team member or author page | ProfilePage with Person `mainEntity` | `profilePageJsonLd()` | `entity.people[]` (name, job title, official profiles) | Profile page feature exists; Google documents no SERP enhancement for a company team page; value is entity and authorship understanding [VERIFIED 2026-09] |
| Blog post | BlogPosting with Person author, real `datePublished` and `dateModified`, image | `blogPostingJsonLd()` | frontmatter `date`/`updated`, author slug | Article |
| Guide, tutorial | TechArticle (or Article) | `techArticleJsonLd()` | frontmatter | Article |
| Release notes, changelog entry | Article with `about` the software and `version` | `releaseNoteJsonLd()` | release data (version, date) | Article |
| News or announcement | NewsArticle only for genuine news | `articleJsonLd()` variant | frontmatter | Article |
| Blog index, guides hub, glossary index, tools index | CollectionPage with ItemList of the listed pages | `collectionPageJsonLd()` | the list the page renders | none (Carousel beta is EEA, Turkey and South Africa only, consumer verticals [VERIFIED 2026-09]) |
| Ranked list the site genuinely ranks | ItemList | `itemListJsonLd()` | the visible order | none |
| Any page with a visible breadcrumb trail | BreadcrumbList | `breadcrumbJsonLd()` via `<Breadcrumbs>` | the trail shown | Breadcrumb |
| SaaS product, pricing page | SoftwareApplication with one Offer per visible plan, currency and VAT flag from config | `softwareApplicationJsonLd()` | the same plan rows the pricing table renders | Software app needs `name`, `offers.price` AND `aggregateRating` or `review` [VERIFIED 2026-11, https://developers.google.com/search/docs/appearance/structured-data/software-app]; with no genuine third-party ratings, treat it as entity information only |
| Free browser tool | WebApplication with `price: 0` (+ HowTo if steps are shown) | `webApplicationJsonLd()`, `howToJsonLd()` | tool name, description, visible steps | as Software app; HowTo has no rich result |
| Physical product with a buy button | Product with Offer | add a typed `productJsonLd()` | product data on the page | Product, merchant listing only where a shopper can buy that single product [VERIFIED 2026-09] |
| Professional service page | WebPage; Service only as plain description if wanted | `webPageNode()` | page copy | none: Service powers no Google feature; no "from X per day" rich result [VERIFIED 2026-09, absence confirmed] |
| Local business with premises or service area | Organization subtype (LocalBusiness or more specific) with address, opening hours, `areaServed` | extend `organizationNode()` type | config `entity.address`, hours shown on the site | Local business (no stars for own reviews) |
| Event (webinar, meetup) | Event with `startDate`, `location` (Place or VirtualLocation), offers if ticketed | add `eventJsonLd()` | event details on the page | Event |
| Video embedded on a page | VideoObject with thumbnail, upload date, duration, embed or content URL | `videoObjectJsonLd()` | video metadata | Video |
| FAQ section | FAQPage only if the questions and answers are visible on that page | `faqPageJsonLd()` via `<FaqList withJsonLd>` | the rendered Q&A | none since 7 May 2026 [VERIFIED 2026-09] |
| Comparison or alternatives page | WebPage + BreadcrumbList; no Product or Review nodes for competitors | `webPageNode()` | page copy | none; never mark up ratings of competitors or yourself |
| Campaign, utility, thank-you pages | none beyond the site graph | | | n/a (noindex) |

## Notes

- One script tag per page is easiest to audit: the layout emits the site graph, the page emits its own nodes (or merge them with `graph()`).
- `mainEntityOfPage` and `@id` on articles let the article, page and breadcrumb refer to each other; keep `url` and `@id` absolute and on the canonical host.
- Dates: `datePublished` is first publication; `dateModified` changes only with a meaningful content change, and matches the visible "Updated" date and the sitemap `lastmod`.
- Images: absolute URLs; for articles, at least one image that is on the page.
- Prices: decimal strings in major units (`"29.00"`), currency `project.currency`, `valueAddedTaxIncluded` from `project.prices_include_vat`. Generate offers from the same data the pricing table renders, so they cannot drift.
