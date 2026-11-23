/**
 * Typed JSON-LD builders. Every structured-data block on the site is produced here; pages never contain
 * hand-written JSON-LD, so the markup cannot drift from the visible page, the pricing table or each other.
 *
 * Policies (enforced by tests/seo/jsonld.test.ts and lib/seo/validate.ts):
 * - No Review, Rating or AggregateRating for the site's own organisation, products or services. Google
 *   treats self-controlled reviews as ineligible for stars, and fake or undisclosed incentivised reviews
 *   breach Google policy and the UK DMCC Act 2024.
 * - Everything in the markup must be visible on the page it describes.
 * - One Organization and one WebSite node with stable @ids (`<origin>/#organization`, `<origin>/#website`);
 *   every other node points at them by @id.
 * - Output is serialised with <, >, &, U+2028 and U+2029 escaped, so no value can close the script tag.
 *
 * Rich results are a narrow set (Google's Search Gallery). FAQPage and HowTo builders remain for pages
 * that genuinely show Q&A or steps, but neither produces a Google rich result any more.
 */
import { SITE, absoluteUrl, type SitePerson } from './site';

export const SCHEMA_CONTEXT = 'https://schema.org';

export type JsonLdNode = { '@type': string | string[]; '@id'?: string } & { [key: string]: unknown };
/** One node with its @context: what most builders return. */
export type JsonLdDoc = JsonLdNode & { '@context': typeof SCHEMA_CONTEXT };
/** Several nodes in one document. */
export type JsonLdGraph = { '@context': typeof SCHEMA_CONTEXT; '@graph': JsonLdNode[] };
export type JsonLd = JsonLdDoc | JsonLdGraph;
export type JsonLdRef = { '@id': string };

export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;
export const SOFTWARE_ID = `${SITE.url}/#software`;
export const ORG_REF: JsonLdRef = { '@id': ORG_ID };
export const WEBSITE_REF: JsonLdRef = { '@id': WEBSITE_ID };

export const personId = (slug: string) => `${absoluteUrl(SITE.personPath(slug))}#person`;
export const pageId = (path: string) => `${absoluteUrl(path)}#webpage`;

function withContext<T extends JsonLdNode>(node: T): T & { '@context': typeof SCHEMA_CONTEXT } {
  return { '@context': SCHEMA_CONTEXT, ...node };
}

/** Drop undefined, null, empty strings and empty arrays so optional fields never serialise as noise. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

/** Combine nodes into one @graph document (one script tag per page is easiest to audit). */
export function graph(...nodes: (JsonLdNode | JsonLd | null | undefined | false)[]): JsonLdGraph {
  const flat: JsonLdNode[] = [];
  for (const n of nodes) {
    if (!n) continue;
    if ('@graph' in n && Array.isArray(n['@graph'])) flat.push(...n['@graph']);
    else {
      const { '@context': _ctx, ...rest } = n as JsonLdNode & { '@context'?: string };
      flat.push(rest as JsonLdNode);
    }
  }
  return { '@context': SCHEMA_CONTEXT, '@graph': flat };
}

// ---------------------------------------------------------------------------
// Organisation, website, people
// ---------------------------------------------------------------------------

export function organizationNode(): JsonLdNode {
  const a = SITE.address;
  const hasAddress = Boolean(a.street || a.locality || a.postalCode);
  return compact({
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName && SITE.legalName !== SITE.name ? SITE.legalName : undefined,
    url: SITE.url,
    logo: SITE.logoPath ? { '@type': 'ImageObject', url: absoluteUrl(SITE.logoPath) } : undefined,
    description: SITE.entityLine,
    disambiguatingDescription: SITE.disambiguation || undefined,
    foundingDate: SITE.founded || undefined,
    email: SITE.contactEmail || undefined,
    telephone: SITE.phone || undefined,
    address: hasAddress
      ? compact({ '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.locality, addressRegion: a.region, postalCode: a.postalCode, addressCountry: a.country })
      : undefined,
    identifier: SITE.companyNumber ? { '@type': 'PropertyValue', propertyID: SITE.companyRegister, value: SITE.companyNumber } : undefined,
    vatID: SITE.vatNumber || undefined,
    sameAs: [...SITE.sameAs],
    areaServed: [...SITE.areaServed],
    knowsAbout: [...SITE.knowsAbout],
    contactPoint: SITE.contactEmail ? { '@type': 'ContactPoint', contactType: 'customer support', email: SITE.contactEmail, availableLanguage: SITE.language } : undefined,
  });
}

export function organizationJsonLd(): JsonLdDoc {
  return withContext(organizationNode());
}

export function websiteNode(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.name,
    url: SITE.url,
    inLanguage: SITE.language,
    description: SITE.entityLine,
    publisher: ORG_REF,
  };
}

export function websiteJsonLd(): JsonLdDoc {
  return withContext(websiteNode());
}

export interface PersonInput {
  name: string;
  slug: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
  image?: string;
}

export function personNode(p: PersonInput): JsonLdNode {
  return compact({
    '@type': 'Person',
    '@id': personId(p.slug),
    name: p.name,
    url: absoluteUrl(SITE.personPath(p.slug)),
    jobTitle: p.jobTitle,
    description: p.description,
    image: p.image ? absoluteUrl(p.image) : undefined,
    sameAs: p.sameAs,
    worksFor: ORG_REF,
  });
}

export function personJsonLd(p: PersonInput): JsonLdDoc {
  return withContext(personNode(p));
}

export function sitePersonInput(p: SitePerson): PersonInput {
  return { name: p.name, slug: p.slug, jobTitle: p.jobTitle, sameAs: [...p.sameAs] };
}

/** The site-wide graph for the root layout: Organization + WebSite (+ named people). */
export function siteGraph(): JsonLdGraph {
  return graph(organizationNode(), websiteNode(), ...SITE.people.filter((p) => p.name).map((p) => personNode(sitePersonInput(p))));
}

/** An author or team-member page. ProfilePage has no special search feature but helps entity understanding. */
export function profilePageJsonLd(p: PersonInput, path: string, dates?: { created?: string; modified?: string }): JsonLdDoc {
  return withContext(
    compact({
      '@type': 'ProfilePage',
      '@id': pageId(path),
      url: absoluteUrl(path),
      dateCreated: dates?.created,
      dateModified: dates?.modified,
      isPartOf: WEBSITE_REF,
      mainEntity: personNode(p),
    }),
  );
}

// ---------------------------------------------------------------------------
// Pages and navigation
// ---------------------------------------------------------------------------

export type WebPageType = 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'FAQPage' | 'ItemPage';

export function webPageNode(input: { path: string; name: string; description: string; type?: WebPageType; dateModified?: string }): JsonLdNode {
  return compact({
    '@type': input.type ?? 'WebPage',
    '@id': pageId(input.path),
    url: absoluteUrl(input.path),
    name: input.name,
    description: input.description,
    inLanguage: SITE.language,
    isPartOf: WEBSITE_REF,
    about: ORG_REF,
    dateModified: input.dateModified,
  });
}

export function contactPageJsonLd(input: { name: string; description: string; path: string }): JsonLdDoc {
  return withContext(webPageNode({ ...input, type: 'ContactPage' }));
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: Crumb[]): JsonLdDoc {
  return withContext({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absoluteUrl(c.path) })),
  });
}

export interface ListEntry {
  name: string;
  path: string;
  description?: string;
}

/** An ordered list of pages (a hub, a "best of" list you actually rank, a tools index). */
export function itemListNode(input: { name: string; items: ListEntry[]; id?: string }): JsonLdNode {
  return compact({
    '@type': 'ItemList',
    '@id': input.id,
    name: input.name,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((it, i) => compact({ '@type': 'ListItem', position: i + 1, name: it.name, url: absoluteUrl(it.path), description: it.description })),
  });
}

export function itemListJsonLd(input: { name: string; items: ListEntry[] }): JsonLdDoc {
  return withContext(itemListNode(input));
}

/** An index page (blog index, guides hub, tools page): CollectionPage whose main entity is the list. */
export function collectionPageJsonLd(input: { name: string; description: string; path: string; items: ListEntry[] }): JsonLdDoc {
  return withContext({
    ...webPageNode({ path: input.path, name: input.name, description: input.description, type: 'CollectionPage' }),
    mainEntity: itemListNode({ name: input.name, items: input.items, id: `${absoluteUrl(input.path)}#list` }),
  });
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export interface ArticleInput {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  author: PersonInput;
  keywords?: string[];
  image?: string;
}

function articleBase(type: 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle', a: ArticleInput, extra: Record<string, unknown> = {}): JsonLdDoc {
  return withContext(
    compact({
      '@type': type,
      '@id': `${absoluteUrl(a.path)}#article`,
      headline: a.headline,
      description: a.description,
      url: absoluteUrl(a.path),
      mainEntityOfPage: { '@type': 'WebPage', '@id': pageId(a.path) },
      datePublished: a.datePublished,
      dateModified: a.dateModified,
      inLanguage: SITE.language,
      author: personNode(a.author),
      publisher: ORG_REF,
      isPartOf: WEBSITE_REF,
      keywords: a.keywords?.length ? a.keywords.join(', ') : undefined,
      image: a.image ? absoluteUrl(a.image) : undefined,
      ...extra,
    }),
  );
}

export const blogPostingJsonLd = (a: ArticleInput) => articleBase('BlogPosting', a);
export const techArticleJsonLd = (a: ArticleInput) => articleBase('TechArticle', a);
export const articleJsonLd = (a: ArticleInput) => articleBase('Article', a);

export interface ReleaseNoteInput extends ArticleInput {
  /** Version string, for example 2.4.0. */
  version: string;
  /** Product the release belongs to; defaults to the site's software node. */
  softwareId?: string;
}

/** Release notes and changelog entries: an Article about the software, with the version stated. */
export function releaseNoteJsonLd(r: ReleaseNoteInput): JsonLdDoc {
  return articleBase('Article', r, { about: { '@id': r.softwareId ?? SOFTWARE_ID }, version: r.version, articleSection: 'Release notes' });
}

// ---------------------------------------------------------------------------
// Q&A and steps (content structures; no Google rich result any more)
// ---------------------------------------------------------------------------

export interface Faq {
  q: string;
  a: string;
}

/** Only for Q&A that is visible on the page. Google's FAQ rich result ceased on 7 May 2026. */
export function faqPageJsonLd(faqs: Faq[], path?: string): JsonLdDoc {
  return withContext(
    compact({
      '@type': 'FAQPage',
      url: path ? absoluteUrl(path) : undefined,
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    }),
  );
}

export interface HowToStepInput {
  name: string;
  text: string;
  /** Anchor or path of the step on the page. */
  path?: string;
}

/** Only for steps that are visible on the page (tools, tutorials). Google retired the HowTo rich result. */
export function howToJsonLd(input: { name: string; description: string; path: string; steps: HowToStepInput[]; totalTime?: string; toolName?: string }): JsonLdDoc {
  return withContext(
    compact({
      '@type': 'HowTo',
      '@id': `${absoluteUrl(input.path)}#howto`,
      name: input.name,
      description: input.description,
      totalTime: input.totalTime,
      tool: input.toolName ? { '@type': 'HowToTool', name: input.toolName } : undefined,
      step: input.steps.map((s, i) => compact({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text, url: s.path ? absoluteUrl(s.path) : undefined })),
    }),
  );
}

// ---------------------------------------------------------------------------
// Software, tools and offers
// ---------------------------------------------------------------------------

export interface OfferInput {
  name: string;
  /** Decimal string in major units, for example "12.50"; "0" or "0.00" when free. */
  price: string;
  sku?: string;
  /** Page where this price is shown. Defaults to /pricing. */
  path?: string;
  interval?: 'month' | 'year' | null;
  category?: string;
}

/** Convert minor units (pence, cents) to the decimal string schema.org expects. */
export function minorUnitsToPrice(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function offerNode(o: OfferInput): JsonLdNode {
  const unitCode = o.interval === 'month' ? 'MON' : o.interval === 'year' ? 'ANN' : undefined;
  return compact({
    '@type': 'Offer',
    name: o.name,
    sku: o.sku,
    price: o.price,
    priceCurrency: SITE.currency,
    url: absoluteUrl(o.path ?? '/pricing'),
    availability: 'https://schema.org/InStock',
    category: o.category,
    priceSpecification: compact({
      '@type': 'UnitPriceSpecification',
      price: o.price,
      priceCurrency: SITE.currency,
      valueAddedTaxIncluded: SITE.pricesIncludeVat,
      referenceQuantity: unitCode ? { '@type': 'QuantitativeValue', value: 1, unitCode } : undefined,
    }),
  });
}

/**
 * The product, for a software company. Build offers from the same rows the pricing page renders.
 * Google shows a software rich result only with genuine third-party ratings, which this kit never fakes,
 * so treat this node as entity information.
 */
export function softwareApplicationJsonLd(input: {
  offers: OfferInput[];
  applicationCategory: string;
  operatingSystem: string;
  name?: string;
  description?: string;
  applicationSubCategory?: string;
}): JsonLdDoc {
  return withContext(
    compact({
      '@type': 'SoftwareApplication',
      '@id': SOFTWARE_ID,
      name: input.name ?? SITE.name,
      url: SITE.url,
      description: input.description ?? SITE.entityLine,
      applicationCategory: input.applicationCategory,
      applicationSubCategory: input.applicationSubCategory,
      operatingSystem: input.operatingSystem,
      inLanguage: SITE.language,
      publisher: ORG_REF,
      offers: input.offers.map(offerNode),
    }),
  );
}

/** A free in-browser tool. */
export function webApplicationJsonLd(input: { name: string; description: string; path: string; applicationCategory: string; browserRequirements?: string }): JsonLdDoc {
  return withContext(
    compact({
      '@type': 'WebApplication',
      '@id': `${absoluteUrl(input.path)}#app`,
      name: input.name,
      url: absoluteUrl(input.path),
      description: input.description,
      applicationCategory: input.applicationCategory,
      operatingSystem: 'Any modern web browser',
      browserRequirements: input.browserRequirements,
      isAccessibleForFree: true,
      inLanguage: SITE.language,
      publisher: ORG_REF,
      offers: { '@type': 'Offer', price: '0', priceCurrency: SITE.currency },
    }),
  );
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export interface VideoInput {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  /** ISO 8601 duration, for example PT12M30S. */
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}

export function videoObjectJsonLd(v: VideoInput): JsonLdDoc {
  return withContext(
    compact({
      '@type': 'VideoObject',
      name: v.name,
      description: v.description,
      thumbnailUrl: [absoluteUrl(v.thumbnailUrl)],
      uploadDate: v.uploadDate,
      duration: v.duration,
      contentUrl: v.contentUrl ? absoluteUrl(v.contentUrl) : undefined,
      embedUrl: v.embedUrl,
      publisher: ORG_REF,
    }),
  );
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

/**
 * JSON for a <script type="application/ld+json"> body. <, > and & are escaped as unicode so no value
 * can end the element or open a comment, and U+2028 / U+2029 are escaped for older JavaScript parsers.
 * JSON parsers read every escape back unchanged.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
