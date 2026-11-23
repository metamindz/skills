/**
 * Site-wide facts: the single source for metadata, JSON-LD, robots.txt, the sitemap, llms.txt and the
 * markdown mirror. Every value here comes from `.agents/aio-seo/config.json` (the `{{...}}` markers name
 * the config key). `/aio-seo:foundation` fills them in; if you edit by hand, keep config.json in sync.
 *
 * Nothing else in the app should hard-code the brand name, the entity line, the domain or the currency.
 */

/**
 * The canonical origin, exactly as the site resolves after redirects (apex or www, always https).
 * IndexNow, canonical tags and the sitemap all depend on this being the final host.
 */
export const PRODUCTION_URL = '{{project.site_url}}';

/** Local and preview builds use NEXT_PUBLIC_SITE_URL; production falls back to PRODUCTION_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.NODE_ENV === 'production' ? PRODUCTION_URL : 'http://localhost:3000')
).replace(/\/+$/, '');

export interface PostalAddressInput {
  street: string;
  locality: string;
  region: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2, for example GB. */
  country: string;
}

export interface SitePerson {
  name: string;
  jobTitle: string;
  /** Used for the author page path and the Person @id. */
  slug: string;
  /** Official profiles only (LinkedIn, personal site, ORCID). */
  sameAs: string[];
}

export interface SiteConfig {
  name: string;
  legalName: string;
  url: string;
  locale: string;
  language: string;
  currency: string;
  pricesIncludeVat: boolean;
  entityLine: string;
  shortDescription: string;
  disambiguation: string;
  category: string;
  founded: string;
  logoPath: string;
  contactEmail: string;
  phone: string;
  address: PostalAddressInput;
  companyNumber: string;
  companyRegister: string;
  vatNumber: string;
  sameAs: string[];
  areaServed: string[];
  knowsAbout: string[];
  people: SitePerson[];
  personPath: (slug: string) => string;
}

export const SITE: SiteConfig = {
  name: '{{project.name}}',
  legalName: '{{project.legal_name}}',
  url: SITE_URL,
  /** Open Graph locale, for example en_GB. */
  locale: '{{project.locale}}',
  /** BCP 47 language tag, for example en-GB. */
  language: '{{project.language}}',
  /** ISO 4217 code used by every Offer, for example GBP. */
  currency: '{{project.currency}}',
  /** Whether listed prices include VAT (or sales tax). Drives valueAddedTaxIncluded on offers. */
  pricesIncludeVat: true, // {{project.prices_include_vat}}

  /**
   * The entity line: one factual sentence saying what the organisation is and does.
   * Used VERBATIM as the root meta description, Organization.description, WebSite.description and the
   * llms.txt summary, so search engines and assistants see one consistent definition.
   */
  entityLine: '{{entity.entity_line}}',
  shortDescription: '{{entity.short_description}}',
  /** Says what this organisation is NOT confused with. Leave empty if there is no namesake. */
  disambiguation: '{{entity.disambiguation}}',
  category: '{{entity.category}}',
  /** Year or ISO date, for example 2021. Empty when unknown. */
  founded: '{{entity.founded}}',
  logoPath: '{{entity.logo_path}}',
  contactEmail: '{{entity.contact_email}}',
  phone: '{{entity.phone}}',
  address: {
    street: '{{entity.address.street}}',
    locality: '{{entity.address.locality}}',
    region: '{{entity.address.region}}',
    postalCode: '{{entity.address.postal_code}}',
    country: '{{entity.address.country}}',
  },
  /** Company registration number, shown as an identifier. Empty if not a registered company. */
  companyNumber: '{{entity.company_number}}',
  /** Name of the register, for example "Companies House company number" in the UK. */
  companyRegister: 'Companies House company number',
  vatNumber: '{{entity.vat_number}}',
  /** Official profiles for Organization.sameAs: LinkedIn, Wikidata, Crunchbase, Companies House, GitHub. */
  sameAs: [], // {{entity.same_as}}
  /** ISO 3166-1 country codes or region names. */
  areaServed: [], // {{entity.area_served}}
  knowsAbout: [], // {{entity.knows_about}}
  people: [], // {{entity.people}}

  /** Path of an author or team-member page. Change to match the site's routes. */
  personPath: (slug) => `/authors/${slug}`,
};

/**
 * Search engine verification. DNS verification is preferred (it survives redesigns and covers every
 * subdomain); these meta tags are the fallback. Values come from environment variables so tokens
 * are not committed, or paste them from config `indexing.google_site_verification` /
 * `indexing.bing_site_verification` if the repo already commits them.
 */
export const VERIFICATION = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  /** Bing Webmaster Tools meta tag value (the tag Bing shows you is named msvalidate.01). */
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? '',
} as const;

/**
 * AI crawler policy for robots.txt. This is a business decision, made by the site owner, recorded in
 * `.agents/aio-seo/config.json` (key `crawlers`) and explained by `/aio-seo:foundation`:
 * - search and user-triggered crawlers are always allowed (blocking them removes you from AI answers);
 * - `training` covers crawlers that collect model training data (GPTBot, ClaudeBot);
 * - `bulk` covers bulk harvesters with no referral path (CCBot, Bytespider, meta-externalagent, Amazonbot);
 * - `googleExtended` also controls Gemini grounding, not only training: blocking it costs Gemini answers;
 * - `contentSignal` is Cloudflare's Content-Signal syntax (no formal standing); `null` omits the line.
 * Keep it consistent: ai-train=no must go with training: 'block'. tests/seo/seo-files.test.ts enforces this.
 */
export const CRAWLER_POLICY = {
  // Defaults are the knowledge base's suggested starting point (a commercial judgement, not a fact):
  // allow the major assistants' training crawlers, block bulk harvesters with no referral path.
  training: 'allow' as 'allow' | 'block',
  bulk: 'block' as 'allow' | 'block',
  googleExtended: 'allow' as 'allow' | 'block',
  applebotExtended: 'allow' as 'allow' | 'block',
  contentSignal: { search: 'yes', 'ai-input': 'yes', 'ai-train': 'yes' } as Record<'search' | 'ai-input' | 'ai-train', 'yes' | 'no'> | null,
} as const;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
