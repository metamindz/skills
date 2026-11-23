/**
 * Every JSON-LD builder produces a document the offline validator accepts, review markup is impossible,
 * the entity line is used verbatim, and serialisation cannot break out of the script element.
 * Add a case here whenever you add a builder or a new page type.
 */
import { describe, expect, it } from 'vitest';
import {
  ORG_ID,
  articleJsonLd,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  contactPageJsonLd,
  faqPageJsonLd,
  graph,
  howToJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  personJsonLd,
  profilePageJsonLd,
  releaseNoteJsonLd,
  serializeJsonLd,
  siteGraph,
  softwareApplicationJsonLd,
  techArticleJsonLd,
  videoObjectJsonLd,
  webApplicationJsonLd,
  websiteJsonLd,
  type JsonLd,
} from '../../lib/seo/jsonld';
import { errorsOf, validateJsonLd } from '../../lib/seo/validate';
import { SITE } from '../../lib/seo/site';

const author = { slug: 'jane-doe', name: 'Jane Doe', jobTitle: 'Head of Product' };
const article = {
  headline: 'How to measure feature retention',
  description: 'A step-by-step method.',
  path: '/blog/feature-retention',
  datePublished: '2026-01-10',
  dateModified: '2026-02-01',
  author,
  keywords: ['feature retention'],
  image: '/images/feature-retention.png',
};
const offers = [
  { name: 'Free', price: '0.00', sku: 'free' },
  { name: 'Team', price: '29.00', sku: 'team_month', interval: 'month' as const },
];

function expectValid(doc: JsonLd | JsonLd[]) {
  expect(errorsOf(validateJsonLd(doc, { currency: SITE.currency }))).toEqual([]);
}

describe('builders produce valid schema.org documents', () => {
  it('Organization and WebSite use the entity line verbatim and stable @ids', () => {
    const org = organizationJsonLd();
    const site = websiteJsonLd();
    expectValid(org);
    expectValid(site);
    expect(org['@id']).toBe(ORG_ID);
    expect(org.description).toBe(SITE.entityLine);
    expect(site.description).toBe(SITE.entityLine);
    expect(site.publisher).toEqual({ '@id': ORG_ID });
  });

  it('Organization.sameAs comes from config and only when there are profiles', () => {
    const org = organizationJsonLd() as Record<string, unknown>;
    if (SITE.sameAs.length) expect(org.sameAs).toEqual([...SITE.sameAs]);
    else expect(org.sameAs).toBeUndefined();
  });

  it('the site graph validates as one document', () => {
    expectValid(siteGraph());
  });

  it('articles, release notes and people', () => {
    expectValid(blogPostingJsonLd(article));
    expectValid(techArticleJsonLd(article));
    expectValid(articleJsonLd(article));
    expectValid(releaseNoteJsonLd({ ...article, path: '/releases/2-4-0', headline: 'Version 2.4.0', version: '2.4.0' }));
    expectValid(personJsonLd(author));
    expectValid(profilePageJsonLd(author, '/authors/jane-doe'));
  });

  it('navigation and lists', () => {
    expectValid(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: 'Post', path: '/blog/post' }]));
    expectValid(itemListJsonLd({ name: 'Guides', items: [{ name: 'A', path: '/guides/a' }, { name: 'B', path: '/guides/b' }] }));
    expectValid(collectionPageJsonLd({ name: 'Blog', description: 'All posts', path: '/blog', items: [{ name: 'A', path: '/blog/a' }] }));
    expectValid(contactPageJsonLd({ name: 'Contact', description: 'How to reach us', path: '/contact' }));
  });

  it('FAQ and HowTo (content structures, no rich result)', () => {
    expectValid(faqPageJsonLd([{ q: 'Is there a free plan?', a: 'Yes.' }], '/pricing'));
    expectValid(howToJsonLd({ name: 'Use the calculator', description: 'Three steps', path: '/tools/calc', steps: [{ name: 'Enter', text: 'Enter your numbers.' }, { name: 'Read', text: 'Read the result.' }] }));
  });

  it('software, free tools and video use the configured currency', () => {
    const app = softwareApplicationJsonLd({ offers, applicationCategory: 'BusinessApplication', operatingSystem: 'Web browser' });
    expectValid(app);
    const first = (app.offers as Record<string, unknown>[])[0]!;
    expect(first.priceCurrency).toBe(SITE.currency);
    expect(first.priceSpecification).toMatchObject({ valueAddedTaxIncluded: SITE.pricesIncludeVat });
    expectValid(webApplicationJsonLd({ name: 'ROI calculator', description: 'Free calculator', path: '/tools/roi', applicationCategory: 'BusinessApplication' }));
    expectValid(videoObjectJsonLd({ name: 'Demo', description: 'Product demo', thumbnailUrl: '/demo.jpg', uploadDate: '2026-01-01', duration: 'PT2M', embedUrl: 'https://www.youtube.com/embed/xyz' }));
  });

  it('graph() merges documents under one @context', () => {
    const g = graph(organizationJsonLd(), websiteJsonLd(), breadcrumbJsonLd([{ name: 'Home', path: '/' }]));
    expect(g['@context']).toBe('https://schema.org');
    expect((g as { '@graph': unknown[] })['@graph']).toHaveLength(3);
    expectValid(g);
  });
});

describe('validator catches problems', () => {
  it('missing required properties', () => {
    const bad = { '@context': 'https://schema.org', '@type': 'Organization', url: 'https://x.test' };
    expect(errorsOf(validateJsonLd(bad)).map((i) => i.path)).toContain('$.name');
  });

  it('relative URLs and invalid dates', () => {
    const bad = { ...blogPostingJsonLd(article), url: '/relative', datePublished: '2026-13-40' };
    const paths = errorsOf(validateJsonLd(bad)).map((i) => i.path);
    expect(paths).toContain('$.url');
    expect(paths).toContain('$.datePublished');
  });

  it('dateModified before datePublished', () => {
    expect(errorsOf(validateJsonLd(blogPostingJsonLd({ ...article, dateModified: '2025-01-01' }))).length).toBeGreaterThan(0);
  });

  it('a wrong currency', () => {
    const app = softwareApplicationJsonLd({ offers, applicationCategory: 'BusinessApplication', operatingSystem: 'Web' });
    const other = SITE.currency === 'EUR' ? 'USD' : 'EUR';
    expect(errorsOf(validateJsonLd(app, { currency: other })).length).toBeGreaterThan(0);
  });

  it('bans Review and AggregateRating anywhere', () => {
    const org = organizationJsonLd();
    expect(errorsOf(validateJsonLd({ ...org, aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', reviewCount: '10' } })).length).toBeGreaterThan(0);
    expect(errorsOf(validateJsonLd({ ...org, subjectOf: { '@type': 'Review', reviewBody: 'Great' } })).length).toBeGreaterThan(0);
  });

  it('warns about unknown types', () => {
    const issues = validateJsonLd({ '@context': 'https://schema.org', '@type': 'Widget' });
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('Widget'))).toBe(true);
  });
});

describe('serialisation', () => {
  it('escapes <, >, &, U+2028 and U+2029 and round-trips', () => {
    const doc = faqPageJsonLd([{ q: 'What about </script><script>alert(1)</script>?', a: 'Line\u2028break & more\u2029 >' }]);
    const out = serializeJsonLd(doc);
    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
    expect(out).toContain('\\u003c/script\\u003e');
    expect(JSON.parse(out)).toEqual(doc);
  });

  it('no builder output contains review markup', () => {
    const text = serializeJsonLd([
      siteGraph(),
      softwareApplicationJsonLd({ offers, applicationCategory: 'BusinessApplication', operatingSystem: 'Web' }),
      blogPostingJsonLd(article),
      faqPageJsonLd([{ q: 'Q?', a: 'A.' }]),
    ]);
    expect(text).not.toMatch(/AggregateRating|"Review"|aggregateRating|"review"/);
  });
});
