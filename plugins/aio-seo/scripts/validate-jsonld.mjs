#!/usr/bin/env node
/**
 * validate-jsonld.mjs: offline JSON-LD checker (Node 18+, zero dependencies, ESM).
 *
 * Validates structured data from a live URL, a saved HTML file or a JSON / JSON-LD file, using the
 * same per-type rules as templates/nextjs/lib/seo/validate.ts. The rules are deliberately stricter
 * than Google's minimums for the types a marketing site emits, and they ban self-serving review markup.
 *
 *   node validate-jsonld.mjs https://www.example.com/pricing
 *   node validate-jsonld.mjs ./out/index.html ./schema.json --currency GBP --json
 *
 * Exit codes: 0 no errors, 1 errors found (or warnings with --strict), 2 usage or fetch failure.
 *
 * Limitation: a plain HTTP fetch sees only JSON-LD present in the server-rendered HTML. Blocks injected
 * by client-side JavaScript are missed here, and by most AI crawlers too. Use Google's Rich Results Test
 * to see the rendered version.
 */
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const USER_AGENT = 'aio-seo-check/0.1 (+https://github.com/metamindz/skills)';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const YEAR_OR_MONTH = /^\d{4}(-\d{2})?$/;
const ISO_DURATION = /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/;
const PRICE = /^\d+(\.\d+)?$/;
const CURRENCY = /^[A-Z]{3}$/;

const isNode = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const asArray = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const typesOf = (n) => asArray(n?.['@type']).filter((t) => typeof t === 'string');

export function isAbsoluteUrl(v) {
  if (typeof v !== 'string') return false;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** A bare reference such as { "@id": "https://x/#organization" }, optionally with @type. */
function isRef(v) {
  if (!isNode(v) || typeof v['@id'] !== 'string') return false;
  return Object.keys(v).every((k) => k === '@id' || k === '@type');
}

function isIsoDate(v) {
  return typeof v === 'string' && ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));
}

// ---------------------------------------------------------------------------
// Type families
// ---------------------------------------------------------------------------

const ORGANIZATION_TYPES = new Set([
  'Organization', 'Corporation', 'LocalBusiness', 'ProfessionalService', 'OnlineBusiness', 'OnlineStore',
  'NGO', 'NewsMediaOrganization', 'EducationalOrganization', 'GovernmentOrganization', 'MedicalOrganization',
  'SportsOrganization', 'Store', 'FinancialService', 'LegalService', 'Attorney', 'AccountingService',
  'HomeAndConstructionBusiness', 'HealthAndBeautyBusiness', 'FoodEstablishment', 'Restaurant', 'Dentist',
  'AutomotiveBusiness', 'EmploymentAgency', 'RealEstateAgent', 'TravelAgency', 'InternetCafe', 'Library',
]);
const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'Report', 'ScholarlyArticle', 'AnalysisNewsArticle']);
const WEBPAGE_TYPES = new Set([
  'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ItemPage', 'SearchResultsPage', 'CheckoutPage',
  'QAPage', 'MedicalWebPage', 'RealEstateListing',
]);
const APP_TYPES = new Set(['SoftwareApplication', 'WebApplication', 'MobileApplication', 'VideoGame']);
const REVIEW_TYPES = new Set(['AggregateRating', 'Review', 'Rating', 'EmployerAggregateRating', 'CriticReview', 'UserReview']);
const REVIEW_KEYS = new Set(['aggregateRating', 'review', 'reviews', 'reviewRating']);

/** Types accepted without specific rules (common supporting nodes). Anything else is warned as unknown. */
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

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

function makeCtx(opts) {
  const issues = [];
  const add = (severity, path, message) => issues.push({ severity, path, message });
  return {
    opts,
    issues,
    error: (p, m) => add('error', p, m),
    warn: (p, m) => add('warning', p, m),
    info: (p, m) => add('info', p, m),
  };
}

function requireString(n, key, p, c, severity = 'error') {
  if (!isNonEmptyString(n[key])) c[severity === 'error' ? 'error' : 'warn'](`${p}.${key}`, 'required non-empty string');
}
function requireUrl(n, key, p, c, severity = 'error') {
  if (!isAbsoluteUrl(n[key])) c[severity === 'error' ? 'error' : 'warn'](`${p}.${key}`, 'required absolute http(s) URL');
}
function requireDate(n, key, p, c, severity = 'error') {
  if (!isIsoDate(n[key])) c[severity === 'error' ? 'error' : 'warn'](`${p}.${key}`, 'required ISO 8601 date, for example 2026-03-01 or 2026-03-01T09:00:00Z');
}

/** Generic property checks applied to every node, whatever its type. */
function checkCommonProps(n, p, c) {
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
  if (typeof n['@id'] === 'string' && !isAbsoluteUrl(n['@id']) && !n['@id'].startsWith('_:'))
    c.warn(`${p}.@id`, 'use an absolute URL (for example https://www.example.com/#organization) so the id is stable across pages');
  for (const key of Object.keys(n)) {
    if (REVIEW_KEYS.has(key) && !c.opts.allowReviews)
      c.error(`${p}.${key}`, 'review or rating markup is not allowed (self-serving reviews are ineligible for stars and risky under the UK DMCC Act 2024)');
  }
}

function checkOrganization(n, p, c, { topLevel }) {
  if (isRef(n)) return;
  requireString(n, 'name', p, c);
  if (topLevel) requireUrl(n, 'url', p, c);
  else if (n.url !== undefined) requireUrl(n, 'url', p, c);
  if (topLevel && n.logo === undefined) c.warn(`${p}.logo`, 'recommended: logo, so search engines can show the right one');
  if (topLevel && n.sameAs === undefined) c.warn(`${p}.sameAs`, 'recommended: sameAs links to official profiles (LinkedIn, Wikidata, Crunchbase, Companies House) for entity disambiguation');
}

function checkPerson(n, p, c) {
  if (isRef(n)) return;
  requireString(n, 'name', p, c);
}

function checkAuthor(v, p, c) {
  const authors = asArray(v);
  if (authors.length === 0) {
    c.error(p, 'author required (a Person or Organization with a name)');
    return;
  }
  authors.forEach((a, i) => {
    const ap = authors.length > 1 ? `${p}[${i}]` : p;
    if (isRef(a)) return;
    if (!isNode(a) || !typesOf(a).some((t) => t === 'Person' || ORGANIZATION_TYPES.has(t))) {
      c.error(ap, 'author must be a Person or Organization node (not a plain string)');
      return;
    }
    requireString(a, 'name', ap, c);
  });
}

function checkArticle(n, p, c) {
  requireString(n, 'headline', p, c);
  if (typeof n.headline === 'string' && n.headline.length > 110) c.warn(`${p}.headline`, 'headline over 110 characters');
  requireDate(n, 'datePublished', p, c);
  if (n.dateModified === undefined) c.warn(`${p}.dateModified`, 'recommended: dateModified from the real content date');
  if (isIsoDate(n.datePublished) && isIsoDate(n.dateModified) && Date.parse(n.dateModified) < Date.parse(n.datePublished))
    c.error(`${p}.dateModified`, 'dateModified is before datePublished');
  for (const key of ['datePublished', 'dateModified']) {
    if (isIsoDate(n[key]) && Date.parse(n[key]) > Date.now() + 36 * 3600 * 1000) c.warn(`${p}.${key}`, 'date is in the future');
  }
  checkAuthor(n.author, `${p}.author`, c);
  if (n.image === undefined) c.warn(`${p}.image`, 'recommended: image');
}

function checkOffer(n, p, c) {
  const isAggregate = typesOf(n).includes('AggregateOffer');
  if (isAggregate) {
    if (n.lowPrice === undefined) c.error(`${p}.lowPrice`, 'AggregateOffer needs lowPrice');
  } else if (n.price === undefined && n.priceSpecification === undefined) {
    // An Offer listed directly under `offers` (Product, app, event) needs a price for rich results.
    // An Offer inside an OfferCatalog that only names the item offered is valid schema.org without one.
    if (c.parentKey === 'offers') c.error(`${p}.price`, 'price required (use "0" when free)');
    else if (n.itemOffered === undefined) c.warn(`${p}.price`, 'Offer has neither a price nor itemOffered');
  }
  for (const key of ['price', 'lowPrice', 'highPrice', 'minPrice', 'maxPrice']) {
    const v = n[key];
    if (v === undefined) continue;
    if (!(typeof v === 'number' || (typeof v === 'string' && PRICE.test(v))))
      c.error(`${p}.${key}`, 'price must be a number or a decimal string with no currency symbol, for example "12.50"');
  }
  if (n.price !== undefined || n.lowPrice !== undefined || n.minPrice !== undefined) {
    if (!(typeof n.priceCurrency === 'string' && CURRENCY.test(n.priceCurrency))) c.error(`${p}.priceCurrency`, 'priceCurrency required, ISO 4217 code such as GBP');
    else if (c.opts.currency && n.priceCurrency !== c.opts.currency) c.error(`${p}.priceCurrency`, `expected ${c.opts.currency}, found ${n.priceCurrency}`);
  }
}

function checkApp(n, p, c) {
  requireString(n, 'name', p, c);
  const offers = asArray(n.offers);
  if (offers.length === 0) c.error(`${p}.offers`, 'offers with a price required (Google requires offers.price; use "0" when free)');
  if (!isNonEmptyString(n.applicationCategory)) c.warn(`${p}.applicationCategory`, 'recommended: applicationCategory, for example BusinessApplication');
  if (!isNonEmptyString(n.operatingSystem)) c.warn(`${p}.operatingSystem`, 'recommended: operatingSystem');
}

function checkBreadcrumb(n, p, c) {
  const items = asArray(n.itemListElement);
  if (items.length === 0) {
    c.error(`${p}.itemListElement`, 'at least one ListItem required');
    return;
  }
  items.forEach((it, i) => {
    const ip = `${p}.itemListElement[${i}]`;
    if (!isNode(it) || !typesOf(it).includes('ListItem')) {
      c.error(ip, 'expected a ListItem');
      return;
    }
    if (it.position !== i + 1 && it.position !== String(i + 1)) c.error(`${ip}.position`, `expected position ${i + 1}`);
    const named = isNonEmptyString(it.name) || (isNode(it.item) && isNonEmptyString(it.item.name));
    if (!named) c.error(`${ip}.name`, 'required non-empty string');
    const last = i === items.length - 1;
    const target = isNode(it.item) ? it.item['@id'] ?? it.item.url : it.item;
    if (target === undefined && !last) c.error(`${ip}.item`, 'item URL required (only the last crumb may omit it)');
    else if (target !== undefined && !isAbsoluteUrl(target)) c.error(`${ip}.item`, 'must be an absolute http(s) URL');
  });
}

function checkItemList(n, p, c) {
  const items = asArray(n.itemListElement);
  if (items.length === 0) {
    c.error(`${p}.itemListElement`, 'at least one element required');
    return;
  }
  items.forEach((it, i) => {
    if (isNode(it) && typesOf(it).includes('ListItem') && it.position !== undefined && Number(it.position) !== i + 1)
      c.error(`${p}.itemListElement[${i}].position`, `expected position ${i + 1}`);
  });
  if (n.numberOfItems !== undefined && Number(n.numberOfItems) !== items.length)
    c.warn(`${p}.numberOfItems`, `numberOfItems is ${n.numberOfItems} but the list has ${items.length} entries`);
}

function checkFaq(n, p, c) {
  const main = asArray(n.mainEntity);
  if (main.length === 0) {
    c.error(`${p}.mainEntity`, 'at least one Question required');
    return;
  }
  main.forEach((q, i) => {
    const qp = `${p}.mainEntity[${i}]`;
    if (!isNode(q) || !typesOf(q).includes('Question')) {
      c.error(qp, 'expected a Question');
      return;
    }
    requireString(q, 'name', qp, c);
    const a = q.acceptedAnswer;
    if (!isNode(a) || !typesOf(a).includes('Answer')) c.error(`${qp}.acceptedAnswer`, 'expected an Answer');
    else requireString(a, 'text', `${qp}.acceptedAnswer`, c);
  });
  c.info(p, 'FAQPage no longer produces a Google rich result (feature ceased 7 May 2026). Harmless if the Q&A is visible on the page; not an asset on its own.');
}

function checkHowTo(n, p, c) {
  requireString(n, 'name', p, c);
  const steps = asArray(n.step);
  if (steps.length === 0) c.error(`${p}.step`, 'at least one HowToStep or HowToSection required');
  steps.forEach((s, i) => {
    const sp = `${p}.step[${i}]`;
    if (typeof s === 'string') return;
    if (!isNode(s)) return c.error(sp, 'expected a HowToStep');
    if (typesOf(s).includes('HowToStep') && !isNonEmptyString(s.text) && asArray(s.itemListElement).length === 0)
      c.error(`${sp}.text`, 'HowToStep needs text');
  });
  c.info(p, 'HowTo no longer produces a Google rich result (documentation redirects to a deprecation note). Keep it only if the steps are visible on the page.');
}

function checkVideo(n, p, c) {
  requireString(n, 'name', p, c);
  requireString(n, 'description', p, c, 'warning');
  requireDate(n, 'uploadDate', p, c);
  const thumbs = asArray(n.thumbnailUrl);
  if (thumbs.length === 0 || !thumbs.every((t) => isAbsoluteUrl(typeof t === 'string' ? t : t?.url)))
    c.error(`${p}.thumbnailUrl`, 'at least one absolute thumbnail URL required');
  if (!isAbsoluteUrl(n.contentUrl) && !isAbsoluteUrl(n.embedUrl)) c.error(p, 'contentUrl or embedUrl required');
}

function checkProfilePage(n, p, c) {
  const m = n.mainEntity;
  if (isRef(m)) return;
  if (!isNode(m) || !typesOf(m).some((t) => t === 'Person' || ORGANIZATION_TYPES.has(t))) {
    c.error(`${p}.mainEntity`, 'ProfilePage needs mainEntity: a Person or Organization');
    return;
  }
  requireString(m, 'name', `${p}.mainEntity`, c);
}

function checkEvent(n, p, c) {
  requireString(n, 'name', p, c);
  requireDate(n, 'startDate', p, c);
  if (n.location === undefined) c.error(`${p}.location`, 'location required (Place or VirtualLocation)');
}

function checkProduct(n, p, c) {
  requireString(n, 'name', p, c);
  if (n.offers === undefined) c.warn(`${p}.offers`, 'Product without offers is not eligible for product rich results');
}

const CHECKS = {
  WebSite: (n, p, c) => {
    requireString(n, 'name', p, c);
    requireUrl(n, 'url', p, c);
  },
  Person: checkPerson,
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
    if (n.price !== undefined && !(typeof n.price === 'number' || (typeof n.price === 'string' && PRICE.test(n.price))))
      c.error(`${p}.price`, 'price must be a number or a decimal string');
    if (n.priceCurrency !== undefined && c.opts.currency && n.priceCurrency !== c.opts.currency)
      c.error(`${p}.priceCurrency`, `expected ${c.opts.currency}, found ${n.priceCurrency}`);
  },
  VideoObject: checkVideo,
  ImageObject: (n, p, c) => {
    if (!isRef(n) && !isAbsoluteUrl(n.url) && !isAbsoluteUrl(n.contentUrl)) c.error(p, 'ImageObject needs an absolute url or contentUrl');
  },
  ContactPoint: (n, p, c) => requireString(n, 'contactType', p, c, 'warning'),
  Event: checkEvent,
  Product: checkProduct,
};

function checkNode(n, p, c, topLevel, parentKey) {
  c.parentKey = parentKey;
  checkCommonProps(n, p, c);
  const types = typesOf(n);
  if (n['@type'] !== undefined && types.length === 0) c.error(`${p}.@type`, '@type must be a string or an array of strings');
  if (isRef(n)) return;
  const known = [];
  for (const t of types) {
    if (REVIEW_TYPES.has(t)) {
      if (!c.opts.allowReviews) c.error(p, `${t} is not allowed (self-serving review markup)`);
      known.push(t);
    } else if (ORGANIZATION_TYPES.has(t)) {
      if (!known.some((k) => ORGANIZATION_TYPES.has(k))) checkOrganization(n, p, c, { topLevel });
      known.push(t);
    } else if (ARTICLE_TYPES.has(t)) {
      if (!known.some((k) => ARTICLE_TYPES.has(k))) checkArticle(n, p, c);
      known.push(t);
    } else if (APP_TYPES.has(t)) {
      if (!known.some((k) => APP_TYPES.has(k))) checkApp(n, p, c);
      known.push(t);
    } else if (WEBPAGE_TYPES.has(t)) {
      known.push(t);
    } else if (CHECKS[t]) {
      if (!isRef(n)) CHECKS[t](n, p, c);
      known.push(t);
    } else if (PASSIVE_TYPES.has(t)) {
      if (t === 'Service' && topLevel) c.info(p, 'Service markup is valid schema.org but powers no Google search feature');
      known.push(t);
    } else {
      c.warn(p, `unknown or unchecked @type ${t}`);
    }
  }
}

function walk(value, p, c, topLevel, parentKey) {
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

function collectIds(value, defined, referenced) {
  if (Array.isArray(value)) return value.forEach((v) => collectIds(v, defined, referenced));
  if (!isNode(value)) return;
  if (typeof value['@id'] === 'string') (isRef(value) ? referenced : defined).add(value['@id']);
  for (const [k, v] of Object.entries(value)) if (k !== '@context') collectIds(v, defined, referenced);
}

/**
 * Validate one JSON-LD document (an object, an array of objects, or an object with @graph).
 * Options: currency (expected ISO 4217 code), allowReviews (only for sites reviewing other businesses).
 * Returns issues with severity error | warning | info.
 */
export function validateJsonLd(doc, opts = {}) {
  const c = makeCtx(opts);
  const docs = Array.isArray(doc) ? doc : [doc];
  docs.forEach((d, i) => {
    const p = docs.length > 1 ? `$[${i}]` : '$';
    if (!isNode(d)) return c.error(p, 'document must be a JSON object');
    const ctx = d['@context'];
    const ctxString = typeof ctx === 'string' ? ctx : isNode(ctx) ? ctx['@vocab'] : Array.isArray(ctx) ? ctx.find((x) => typeof x === 'string') : undefined;
    if (ctxString === undefined) c.error(`${p}.@context`, '@context required, use "https://schema.org"');
    else if (!/^https?:\/\/schema\.org\/?$/.test(ctxString)) c.error(`${p}.@context`, `unexpected @context ${ctxString}`);
    else if (ctxString !== 'https://schema.org') c.warn(`${p}.@context`, 'prefer exactly "https://schema.org"');
    if (d['@type'] === undefined && d['@graph'] === undefined) c.error(`${p}.@type`, 'top-level @type or @graph required');
    walk(d, p, c, true, undefined);
  });
  // One issue per severity and path: generic and type-specific checks can flag the same property.
  const seen = new Set();
  return c.issues.filter((i) => {
    const key = `${i.severity}|${i.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Cross-document check for one page: every { "@id": x } reference should point at a node defined on the
 * same page, so the graph is connected. Pass all parsed blocks from one page.
 */
export function checkIdGraph(blocks) {
  const defined = new Set();
  const referenced = new Set();
  blocks.forEach((b) => collectIds(b, defined, referenced));
  return [...referenced]
    .filter((id) => !defined.has(id))
    .map((id) => ({ severity: 'warning', path: '@graph', message: `@id ${id} is referenced but not defined on this page` }));
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/** Extract and parse every <script type="application/ld+json"> block from an HTML string. */
export function extractJsonLdBlocks(html) {
  const out = [];
  const re = /<script\b[^>]*\btype\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi;
  let m;
  let index = 0;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    try {
      out.push({ index, ok: true, data: JSON.parse(raw), raw });
    } catch (e) {
      out.push({ index, ok: false, error: e instanceof Error ? e.message : String(e), raw: raw.slice(0, 200) });
    }
    index += 1;
  }
  return out;
}

/** Every @type found in a parsed block, including nested nodes and @graph members. */
export function collectTypes(value, acc = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((v) => collectTypes(v, acc));
    return acc;
  }
  if (!isNode(value)) return acc;
  for (const t of typesOf(value)) acc.set(t, (acc.get(t) ?? 0) + 1);
  for (const [k, v] of Object.entries(value)) if (k !== '@context') collectTypes(v, acc);
  return acc;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const HELP = `validate-jsonld.mjs: check JSON-LD structured data (Node 18+, no dependencies)

Usage:
  node validate-jsonld.mjs <source> [<source> ...] [options]

A source is an http(s) URL, an .html/.htm file, or a .json/.jsonld file.

Options:
  --currency <CODE>   Expected ISO 4217 currency for every Offer (for example GBP)
  --allow-reviews     Allow Review/AggregateRating (only for sites that review OTHER businesses)
  --strict            Exit 1 on warnings as well as errors
  --json              Print machine-readable JSON instead of a markdown report
  --timeout <ms>      Fetch timeout for URLs (default 20000)
  --help              Show this help

Notes:
  - URLs are fetched once with a plain GET (User-Agent: ${USER_AGENT}).
    JSON-LD injected by client-side JavaScript is NOT seen. Most AI crawlers do not run
    JavaScript either, so a block missing here is missing for them too.
  - Rules mirror templates/nextjs/lib/seo/validate.ts in the aio-seo plugin.
`;

function parseArgs(argv) {
  const args = { sources: [], currency: undefined, allowReviews: false, strict: false, json: false, timeout: 20000, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--currency') args.currency = String(argv[++i] ?? '').toUpperCase();
    else if (a === '--allow-reviews') args.allowReviews = true;
    else if (a === '--strict') args.strict = true;
    else if (a === '--json') args.json = true;
    else if (a === '--timeout') args.timeout = Number(argv[++i]);
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else args.sources.push(a);
  }
  return args;
}

async function loadSource(src, timeout) {
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(timeout) });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${src}`);
    return { kind: 'html', text: await res.text() };
  }
  const text = await readFile(src, 'utf8');
  if (/\.(json|jsonld)$/i.test(src)) return { kind: 'json', text };
  return { kind: 'html', text };
}

export async function validateSource(src, opts = {}) {
  const { kind, text } = await loadSource(src, opts.timeout ?? 20000);
  const blocks = kind === 'json'
    ? (() => {
        try {
          return [{ index: 0, ok: true, data: JSON.parse(text) }];
        } catch (e) {
          return [{ index: 0, ok: false, error: e instanceof Error ? e.message : String(e) }];
        }
      })()
    : extractJsonLdBlocks(text);
  const results = blocks.map((b) => ({
    index: b.index,
    parseError: b.ok ? undefined : b.error,
    types: b.ok ? Object.fromEntries(collectTypes(b.data)) : {},
    issues: b.ok ? validateJsonLd(b.data, opts) : [{ severity: 'error', path: '$', message: `JSON parse error: ${b.error}` }],
  }));
  const graphIssues = checkIdGraph(blocks.filter((b) => b.ok).map((b) => b.data));
  return { source: src, blockCount: blocks.length, blocks: results, graphIssues };
}

function summarise(report) {
  const all = [...report.blocks.flatMap((b) => b.issues), ...report.graphIssues];
  return {
    errors: all.filter((i) => i.severity === 'error').length,
    warnings: all.filter((i) => i.severity === 'warning').length,
    infos: all.filter((i) => i.severity === 'info').length,
  };
}

function toMarkdown(reports) {
  const lines = ['# JSON-LD validation', ''];
  for (const r of reports) {
    const s = summarise(r);
    lines.push(`## ${r.source}`, '', `- Blocks found: ${r.blockCount}`, `- Errors: ${s.errors}, warnings: ${s.warnings}, notes: ${s.infos}`);
    if (r.blockCount === 0) lines.push('- No JSON-LD in the fetched HTML. If the site adds it with client-side JavaScript, crawlers that do not run JavaScript will not see it.');
    lines.push('');
    for (const b of r.blocks) {
      const types = Object.entries(b.types).map(([t, n]) => (n > 1 ? `${t} x${n}` : t)).join(', ') || 'none';
      lines.push(`### Block ${b.index + 1}: ${types}`);
      if (b.issues.length === 0) lines.push('- OK');
      for (const i of b.issues) lines.push(`- ${i.severity.toUpperCase()} \`${i.path}\`: ${i.message}`);
      lines.push('');
    }
    if (r.graphIssues.length) {
      lines.push('### @id graph');
      for (const i of r.graphIssues) lines.push(`- ${i.severity.toUpperCase()}: ${i.message}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(String(e instanceof Error ? e.message : e));
    console.error('Run with --help for usage.');
    process.exit(2);
  }
  if (args.help || args.sources.length === 0) {
    console.log(HELP);
    process.exit(args.help ? 0 : 2);
  }
  const reports = [];
  let failedLoad = false;
  for (const src of args.sources) {
    try {
      reports.push(await validateSource(src, { currency: args.currency, allowReviews: args.allowReviews, timeout: args.timeout }));
    } catch (e) {
      failedLoad = true;
      reports.push({ source: src, blockCount: 0, blocks: [], graphIssues: [], loadError: e instanceof Error ? e.message : String(e) });
    }
  }
  if (args.json) console.log(JSON.stringify(reports, null, 2));
  else {
    console.log(toMarkdown(reports));
    for (const r of reports) if (r.loadError) console.log(`Could not load ${r.source}: ${r.loadError}`);
  }
  const totals = reports.map(summarise).reduce((a, s) => ({ errors: a.errors + s.errors, warnings: a.warnings + s.warnings }), { errors: 0, warnings: 0 });
  if (failedLoad) process.exit(2);
  process.exit(totals.errors > 0 || (args.strict && totals.warnings > 0) ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
