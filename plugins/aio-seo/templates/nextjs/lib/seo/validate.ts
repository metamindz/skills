/**
 * A small offline JSON-LD validator for the site's own output. It checks the properties schema.org and
 * Google's structured-data guidelines treat as required for the types a marketing site emits, applies a
 * few house rules that are stricter than Google's minimums, and bans self-serving review markup.
 *
 * The same rules ship as a zero-dependency CLI in the aio-seo plugin (scripts/validate-jsonld.mjs) for
 * checking live pages. Keep the two in step when you change a rule.
 */

type Node = Record<string, unknown>;

export type Severity = 'error' | 'warning' | 'info';
export interface JsonLdIssue {
  severity: Severity;
  path: string;
  message: string;
}
export interface ValidateOptions {
  /** Expected ISO 4217 currency for every Offer. */
  currency?: string;
  /** Allow Review/AggregateRating. Only for sites that review OTHER businesses. */
  allowReviews?: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const YEAR_OR_MONTH = /^\d{4}(-\d{2})?$/;
const ISO_DURATION = /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/;
const PRICE = /^\d+(\.\d+)?$/;
const CURRENCY = /^[A-Z]{3}$/;

const isNode = (v: unknown): v is Node => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const asArray = (v: unknown): unknown[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const typesOf = (n: Node): string[] => asArray(n['@type']).filter((t): t is string => typeof t === 'string');

export function isAbsoluteUrl(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
function isRef(v: unknown): boolean {
  return isNode(v) && typeof v['@id'] === 'string' && Object.keys(v).every((k) => k === '@id' || k === '@type');
}
function isIsoDate(v: unknown): boolean {
  return typeof v === 'string' && ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));
}

const ORGANIZATION_TYPES = new Set([
  'Organization', 'Corporation', 'LocalBusiness', 'ProfessionalService', 'OnlineBusiness', 'OnlineStore',
  'NGO', 'NewsMediaOrganization', 'EducationalOrganization', 'GovernmentOrganization', 'MedicalOrganization',
  'SportsOrganization', 'Store', 'FinancialService', 'LegalService', 'Attorney', 'AccountingService',
  'HomeAndConstructionBusiness', 'HealthAndBeautyBusiness', 'FoodEstablishment', 'Restaurant', 'Dentist',
  'AutomotiveBusiness', 'EmploymentAgency', 'RealEstateAgent', 'TravelAgency', 'InternetCafe', 'Library',
]);
const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'Report', 'ScholarlyArticle', 'AnalysisNewsArticle']);
const WEBPAGE_TYPES = new Set(['WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ItemPage', 'SearchResultsPage', 'CheckoutPage', 'QAPage', 'MedicalWebPage', 'RealEstateListing']);
const APP_TYPES = new Set(['SoftwareApplication', 'WebApplication', 'MobileApplication', 'VideoGame']);
const REVIEW_TYPES = new Set(['AggregateRating', 'Review', 'Rating', 'EmployerAggregateRating', 'CriticReview', 'UserReview']);
const REVIEW_KEYS = new Set(['aggregateRating', 'review', 'reviews', 'reviewRating']);
const PASSIVE_TYPES = new Set([
  'Thing', 'CreativeWork', 'WebPageElement', 'WPHeader', 'WPFooter', 'SiteNavigationElement', 'PostalAddress',
  'GeoCoordinates', 'GeoShape', 'Place', 'Continent', 'Country', 'City', 'State', 'AdministrativeArea', 'PropertyValue',
  'QuantitativeValue', 'MonetaryAmount', 'Audience', 'BusinessAudience', 'PeopleAudience', 'DefinedTerm',
  'DefinedTermSet', 'SpeakableSpecification', 'EntryPoint', 'SearchAction', 'ReadAction', 'ViewAction',
  'Brand', 'OpeningHoursSpecification', 'Language', 'HowToTool', 'HowToSupply', 'HowToDirection', 'HowToTip',
  'OfferCatalog', 'ItemListOrderAscending', 'EducationalOccupationalCredential', 'Credential', 'Occupation',
  'Duration', 'DataCatalog', 'DataDownload', 'Dataset', 'Course', 'CourseInstance', 'Book', 'Collection',
  'MediaObject', 'AudioObject', 'PodcastSeries', 'PodcastEpisode', 'Clip', 'Comment', 'DiscussionForumPosting',
  'Service', 'ServiceChannel', 'Schedule', 'VirtualLocation', 'Distance',
]);

class Ctx {
  issues: JsonLdIssue[] = [];
  parentKey: string | undefined;
  constructor(public opts: ValidateOptions) {}
  error(path: string, message: string) {
    this.issues.push({ severity: 'error', path, message });
  }
  warn(path: string, message: string) {
    this.issues.push({ severity: 'warning', path, message });
  }
  info(path: string, message: string) {
    this.issues.push({ severity: 'info', path, message });
  }
}

type Sev = 'error' | 'warning';
const report = (c: Ctx, sev: Sev, p: string, m: string) => (sev === 'error' ? c.error(p, m) : c.warn(p, m));
function requireString(n: Node, key: string, p: string, c: Ctx, sev: Sev = 'error') {
  if (!isNonEmptyString(n[key])) report(c, sev, `${p}.${key}`, 'required non-empty string');
}
function requireUrl(n: Node, key: string, p: string, c: Ctx, sev: Sev = 'error') {
  if (!isAbsoluteUrl(n[key])) report(c, sev, `${p}.${key}`, 'required absolute http(s) URL');
}
function requireDate(n: Node, key: string, p: string, c: Ctx, sev: Sev = 'error') {
  if (!isIsoDate(n[key])) report(c, sev, `${p}.${key}`, 'required ISO 8601 date, for example 2026-03-01 or 2026-03-01T09:00:00Z');
}

function checkCommonProps(n: Node, p: string, c: Ctx) {
  for (const key of ['url', 'sameAs', 'thumbnailUrl', 'contentUrl', 'embedUrl', 'logo', 'image', 'mainEntityOfPage', 'item']) {
    if (n[key] === undefined) continue;
    asArray(n[key]).forEach((v, i) => {
      const vp = Array.isArray(n[key]) ? `${p}.${key}[${i}]` : `${p}.${key}`;
      if (typeof v === 'string') {
        if (!isAbsoluteUrl(v)) c.error(vp, 'must be an absolute http(s) URL');
      } else if (isNode(v) && (key === 'logo' || key === 'image')) {
        if (!isRef(v) && !isAbsoluteUrl(v.url) && !isAbsoluteUrl(v.contentUrl)) c.error(vp, 'ImageObject needs an absolute url or contentUrl');
      }
    });
  }
  for (const key of ['datePublished', 'dateModified', 'dateCreated', 'uploadDate', 'startDate', 'endDate', 'validFrom', 'validThrough', 'priceValidUntil', 'expires']) {
    if (n[key] !== undefined && !isIsoDate(n[key])) c.error(`${p}.${key}`, 'must be an ISO 8601 date');
  }
  if (n.foundingDate !== undefined && !(isIsoDate(n.foundingDate) || (typeof n.foundingDate === 'string' && YEAR_OR_MONTH.test(n.foundingDate))))
    c.error(`${p}.foundingDate`, 'must be an ISO 8601 date or a year');
  if (n.duration !== undefined && !(typeof n.duration === 'string' && ISO_DURATION.test(n.duration)))
    c.error(`${p}.duration`, 'must be an ISO 8601 duration, for example PT12M30S');
  const id = n['@id'];
  if (typeof id === 'string' && !isAbsoluteUrl(id) && !id.startsWith('_:'))
    c.warn(`${p}.@id`, 'use an absolute URL (for example https://www.example.com/#organization) so the id is stable across pages');
  for (const key of Object.keys(n)) {
    if (REVIEW_KEYS.has(key) && !c.opts.allowReviews)
      c.error(`${p}.${key}`, 'review or rating markup is not allowed (self-serving reviews are ineligible for stars and risky under the UK DMCC Act 2024)');
  }
}

function checkOrganization(n: Node, p: string, c: Ctx, topLevel: boolean) {
  requireString(n, 'name', p, c);
  if (topLevel || n.url !== undefined) requireUrl(n, 'url', p, c);
  if (topLevel && n.logo === undefined) c.warn(`${p}.logo`, 'recommended: logo, so search engines can show the right one');
  if (topLevel && n.sameAs === undefined) c.warn(`${p}.sameAs`, 'recommended: sameAs links to official profiles (LinkedIn, Wikidata, Crunchbase, Companies House) for entity disambiguation');
}

function checkAuthor(v: unknown, p: string, c: Ctx) {
  const authors = asArray(v);
  if (authors.length === 0) return c.error(p, 'author required (a Person or Organization with a name)');
  authors.forEach((a, i) => {
    const ap = authors.length > 1 ? `${p}[${i}]` : p;
    if (isRef(a)) return;
    if (!isNode(a) || !typesOf(a).some((t) => t === 'Person' || ORGANIZATION_TYPES.has(t))) return c.error(ap, 'author must be a Person or Organization node (not a plain string)');
    requireString(a, 'name', ap, c);
  });
}

function checkArticle(n: Node, p: string, c: Ctx) {
  requireString(n, 'headline', p, c);
  if (typeof n.headline === 'string' && n.headline.length > 110) c.warn(`${p}.headline`, 'headline over 110 characters');
  requireDate(n, 'datePublished', p, c);
  if (n.dateModified === undefined) c.warn(`${p}.dateModified`, 'recommended: dateModified from the real content date');
  if (isIsoDate(n.datePublished) && isIsoDate(n.dateModified) && Date.parse(n.dateModified as string) < Date.parse(n.datePublished as string))
    c.error(`${p}.dateModified`, 'dateModified is before datePublished');
  for (const key of ['datePublished', 'dateModified']) {
    if (isIsoDate(n[key]) && Date.parse(n[key] as string) > Date.now() + 36 * 3600 * 1000) c.warn(`${p}.${key}`, 'date is in the future');
  }
  checkAuthor(n.author, `${p}.author`, c);
  if (n.image === undefined) c.warn(`${p}.image`, 'recommended: image');
}

function isPrice(v: unknown): boolean {
  return typeof v === 'number' || (typeof v === 'string' && PRICE.test(v));
}

function checkOffer(n: Node, p: string, c: Ctx) {
  if (typesOf(n).includes('AggregateOffer')) {
    if (n.lowPrice === undefined) c.error(`${p}.lowPrice`, 'AggregateOffer needs lowPrice');
  } else if (n.price === undefined && n.priceSpecification === undefined) {
    if (c.parentKey === 'offers') c.error(`${p}.price`, 'price required (use "0" when free)');
    else if (n.itemOffered === undefined) c.warn(`${p}.price`, 'Offer has neither a price nor itemOffered');
  }
  for (const key of ['price', 'lowPrice', 'highPrice', 'minPrice', 'maxPrice']) {
    if (n[key] !== undefined && !isPrice(n[key])) c.error(`${p}.${key}`, 'price must be a number or a decimal string with no currency symbol, for example "12.50"');
  }
  if (n.price !== undefined || n.lowPrice !== undefined || n.minPrice !== undefined) {
    if (!(typeof n.priceCurrency === 'string' && CURRENCY.test(n.priceCurrency))) c.error(`${p}.priceCurrency`, 'priceCurrency required, ISO 4217 code such as GBP');
    else if (c.opts.currency && n.priceCurrency !== c.opts.currency) c.error(`${p}.priceCurrency`, `expected ${c.opts.currency}, found ${n.priceCurrency}`);
  }
}

function checkApp(n: Node, p: string, c: Ctx) {
  requireString(n, 'name', p, c);
  if (asArray(n.offers).length === 0) c.error(`${p}.offers`, 'offers with a price required (Google requires offers.price; use "0" when free)');
  if (!isNonEmptyString(n.applicationCategory)) c.warn(`${p}.applicationCategory`, 'recommended: applicationCategory, for example BusinessApplication');
  if (!isNonEmptyString(n.operatingSystem)) c.warn(`${p}.operatingSystem`, 'recommended: operatingSystem');
}

function checkBreadcrumb(n: Node, p: string, c: Ctx) {
  const items = asArray(n.itemListElement);
  if (items.length === 0) return c.error(`${p}.itemListElement`, 'at least one ListItem required');
  items.forEach((it, i) => {
    const ip = `${p}.itemListElement[${i}]`;
    if (!isNode(it) || !typesOf(it).includes('ListItem')) return c.error(ip, 'expected a ListItem');
    if (it.position !== i + 1 && it.position !== String(i + 1)) c.error(`${ip}.position`, `expected position ${i + 1}`);
    const named = isNonEmptyString(it.name) || (isNode(it.item) && isNonEmptyString(it.item.name));
    if (!named) c.error(`${ip}.name`, 'required non-empty string');
    const target = isNode(it.item) ? (it.item['@id'] ?? it.item.url) : it.item;
    if (target === undefined && i !== items.length - 1) c.error(`${ip}.item`, 'item URL required (only the last crumb may omit it)');
    else if (target !== undefined && !isAbsoluteUrl(target)) c.error(`${ip}.item`, 'must be an absolute http(s) URL');
  });
}

function checkItemList(n: Node, p: string, c: Ctx) {
  const items = asArray(n.itemListElement);
  if (items.length === 0) return c.error(`${p}.itemListElement`, 'at least one element required');
  items.forEach((it, i) => {
    if (isNode(it) && typesOf(it).includes('ListItem') && it.position !== undefined && Number(it.position) !== i + 1)
      c.error(`${p}.itemListElement[${i}].position`, `expected position ${i + 1}`);
  });
  if (n.numberOfItems !== undefined && Number(n.numberOfItems) !== items.length)
    c.warn(`${p}.numberOfItems`, `numberOfItems is ${String(n.numberOfItems)} but the list has ${items.length} entries`);
}

function checkFaq(n: Node, p: string, c: Ctx) {
  const main = asArray(n.mainEntity);
  if (main.length === 0) return c.error(`${p}.mainEntity`, 'at least one Question required');
  main.forEach((q, i) => {
    const qp = `${p}.mainEntity[${i}]`;
    if (!isNode(q) || !typesOf(q).includes('Question')) return c.error(qp, 'expected a Question');
    requireString(q, 'name', qp, c);
    const a = q.acceptedAnswer;
    if (!isNode(a) || !typesOf(a).includes('Answer')) c.error(`${qp}.acceptedAnswer`, 'expected an Answer');
    else requireString(a, 'text', `${qp}.acceptedAnswer`, c);
  });
  c.info(p, 'FAQPage no longer produces a Google rich result (feature ceased 7 May 2026). Harmless if the Q&A is visible on the page; not an asset on its own.');
}

function checkHowTo(n: Node, p: string, c: Ctx) {
  requireString(n, 'name', p, c);
  const steps = asArray(n.step);
  if (steps.length === 0) c.error(`${p}.step`, 'at least one HowToStep or HowToSection required');
  steps.forEach((s, i) => {
    const sp = `${p}.step[${i}]`;
    if (typeof s === 'string') return;
    if (!isNode(s)) return c.error(sp, 'expected a HowToStep');
    if (typesOf(s).includes('HowToStep') && !isNonEmptyString(s.text) && asArray(s.itemListElement).length === 0) c.error(`${sp}.text`, 'HowToStep needs text');
  });
  c.info(p, 'HowTo no longer produces a Google rich result (documentation redirects to a deprecation note). Keep it only if the steps are visible on the page.');
}

function checkVideo(n: Node, p: string, c: Ctx) {
  requireString(n, 'name', p, c);
  requireString(n, 'description', p, c, 'warning');
  requireDate(n, 'uploadDate', p, c);
  const thumbs = asArray(n.thumbnailUrl);
  if (thumbs.length === 0 || !thumbs.every((t) => isAbsoluteUrl(typeof t === 'string' ? t : isNode(t) ? t.url : undefined)))
    c.error(`${p}.thumbnailUrl`, 'at least one absolute thumbnail URL required');
  if (!isAbsoluteUrl(n.contentUrl) && !isAbsoluteUrl(n.embedUrl)) c.error(p, 'contentUrl or embedUrl required');
}

function checkProfilePage(n: Node, p: string, c: Ctx) {
  const m = n.mainEntity;
  if (isRef(m)) return;
  if (!isNode(m) || !typesOf(m).some((t) => t === 'Person' || ORGANIZATION_TYPES.has(t))) return c.error(`${p}.mainEntity`, 'ProfilePage needs mainEntity: a Person or Organization');
  requireString(m, 'name', `${p}.mainEntity`, c);
}

const CHECKS: Record<string, (n: Node, p: string, c: Ctx) => void> = {
  WebSite: (n, p, c) => {
    requireString(n, 'name', p, c);
    requireUrl(n, 'url', p, c);
  },
  Person: (n, p, c) => requireString(n, 'name', p, c),
  ProfilePage: checkProfilePage,
  BreadcrumbList: checkBreadcrumb,
  ItemList: checkItemList,
  FAQPage: checkFaq,
  HowTo: checkHowTo,
  HowToStep: () => {},
  HowToSection: () => {},
  Question: () => {},
  Answer: () => {},
  ListItem: () => {},
  Offer: checkOffer,
  AggregateOffer: checkOffer,
  PriceSpecification: () => {},
  UnitPriceSpecification: (n, p, c) => {
    if (n.price !== undefined && !isPrice(n.price)) c.error(`${p}.price`, 'price must be a number or a decimal string');
    if (n.priceCurrency !== undefined && c.opts.currency && n.priceCurrency !== c.opts.currency) c.error(`${p}.priceCurrency`, `expected ${c.opts.currency}, found ${String(n.priceCurrency)}`);
  },
  VideoObject: checkVideo,
  ImageObject: (n, p, c) => {
    if (!isAbsoluteUrl(n.url) && !isAbsoluteUrl(n.contentUrl)) c.error(p, 'ImageObject needs an absolute url or contentUrl');
  },
  ContactPoint: (n, p, c) => requireString(n, 'contactType', p, c, 'warning'),
  Event: (n, p, c) => {
    requireString(n, 'name', p, c);
    requireDate(n, 'startDate', p, c);
    if (n.location === undefined) c.error(`${p}.location`, 'location required (Place or VirtualLocation)');
  },
  Product: (n, p, c) => {
    requireString(n, 'name', p, c);
    if (n.offers === undefined) c.warn(`${p}.offers`, 'Product without offers is not eligible for product rich results');
  },
};

export const SUPPORTED_TYPES = [...Object.keys(CHECKS), ...ORGANIZATION_TYPES, ...ARTICLE_TYPES, ...WEBPAGE_TYPES, ...APP_TYPES];

function checkNode(n: Node, p: string, c: Ctx, topLevel: boolean, parentKey: string | undefined) {
  c.parentKey = parentKey;
  checkCommonProps(n, p, c);
  const types = typesOf(n);
  if (n['@type'] !== undefined && types.length === 0) c.error(`${p}.@type`, '@type must be a string or an array of strings');
  if (isRef(n)) return;
  const seen: string[] = [];
  for (const t of types) {
    if (REVIEW_TYPES.has(t)) {
      if (!c.opts.allowReviews) c.error(p, `${t} is not allowed (self-serving review markup)`);
    } else if (ORGANIZATION_TYPES.has(t)) {
      if (!seen.some((k) => ORGANIZATION_TYPES.has(k))) checkOrganization(n, p, c, topLevel);
    } else if (ARTICLE_TYPES.has(t)) {
      if (!seen.some((k) => ARTICLE_TYPES.has(k))) checkArticle(n, p, c);
    } else if (APP_TYPES.has(t)) {
      if (!seen.some((k) => APP_TYPES.has(k))) checkApp(n, p, c);
    } else if (WEBPAGE_TYPES.has(t)) {
      /* no required properties */
    } else if (CHECKS[t]) {
      CHECKS[t](n, p, c);
    } else if (PASSIVE_TYPES.has(t)) {
      if (t === 'Service' && topLevel) c.info(p, 'Service markup is valid schema.org but powers no Google search feature');
    } else {
      c.warn(p, `unknown or unchecked @type ${t}`);
    }
    seen.push(t);
  }
}

function walk(value: unknown, p: string, c: Ctx, topLevel: boolean, parentKey: string | undefined) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${p}[${i}]`, c, topLevel, parentKey));
    return;
  }
  if (!isNode(value)) return;
  if (value['@type'] !== undefined) checkNode(value, p, c, topLevel, parentKey);
  else checkCommonProps(value, p, c);
  for (const [k, v] of Object.entries(value)) {
    if (k === '@context' || k === '@id' || k === '@type') continue;
    if (k === '@graph') {
      asArray(v).forEach((g, i) => walk(g, `${p}.@graph[${i}]`, c, true, undefined));
      continue;
    }
    walk(v, `${p}.${k}`, c, false, k);
  }
}

/**
 * Validate a JSON-LD document (object, array of objects, or object with @graph).
 * Returns every issue; `errorsOf()` keeps only the errors (what tests should assert on).
 */
export function validateJsonLd(doc: unknown, opts: ValidateOptions = {}): JsonLdIssue[] {
  const c = new Ctx(opts);
  const docs = Array.isArray(doc) ? doc : [doc];
  docs.forEach((d, i) => {
    const p = docs.length > 1 ? `$[${i}]` : '$';
    if (!isNode(d)) return c.error(p, 'document must be a JSON object');
    const ctx = d['@context'];
    const ctxString = typeof ctx === 'string' ? ctx : isNode(ctx) ? ctx['@vocab'] : Array.isArray(ctx) ? ctx.find((x) => typeof x === 'string') : undefined;
    if (ctxString === undefined) c.error(`${p}.@context`, '@context required, use "https://schema.org"');
    else if (typeof ctxString !== 'string' || !/^https?:\/\/schema\.org\/?$/.test(ctxString)) c.error(`${p}.@context`, `unexpected @context ${String(ctxString)}`);
    else if (ctxString !== 'https://schema.org') c.warn(`${p}.@context`, 'prefer exactly "https://schema.org"');
    if (d['@type'] === undefined && d['@graph'] === undefined) c.error(`${p}.@type`, 'top-level @type or @graph required');
    walk(d, p, c, true, undefined);
  });
  const seen = new Set<string>();
  return c.issues.filter((i) => {
    const key = `${i.severity}|${i.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function errorsOf(issues: JsonLdIssue[]): JsonLdIssue[] {
  return issues.filter((i) => i.severity === 'error');
}
