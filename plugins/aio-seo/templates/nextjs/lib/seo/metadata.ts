import type { Metadata } from 'next';
import { SITE, SITE_URL, VERIFICATION, absoluteUrl } from './site';
import { hasMarkdown, markdownPathFor } from './markdown';

/**
 * House limits, enforced by tests/seo/metadata.test.ts. Google sets no hard limit on either; titles of
 * roughly 50 to 60 characters are the least often rewritten, and longer descriptions are cut on display.
 */
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 50;
export const DESCRIPTION_MAX = 160;

export interface PageMeta {
  /** Full document title, used as-is (the root template is bypassed so the length is exact). */
  title: string;
  description: string;
  /** Path beginning with "/", used for the canonical URL and og:url. */
  path: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
  /** noindex, follow. Use for campaign, utility and thin pages; they also stay out of the sitemap and llms.txt. */
  noindex?: boolean;
  /** Share image path or URL. Omit when the route has its own opengraph-image file. */
  image?: string;
}

/** Title with the brand appended when it fits within the limit. */
export function brandedTitle(title: string): string {
  const withBrand = `${title} | ${SITE.name}`;
  return withBrand.length <= TITLE_MAX ? withBrand : title;
}

/**
 * Root layout metadata: metadataBase, the entity line as the default description, verification tags
 * and default robots. Use in app/layout.tsx: `export const metadata = rootMetadata();`
 */
export function rootMetadata(): Metadata {
  const other: Record<string, string> = {};
  if (VERIFICATION.bing) other['msvalidate.01'] = VERIFICATION.bing;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE.name, template: `%s | ${SITE.name}` },
    description: SITE.entityLine,
    applicationName: SITE.name,
    alternates: { canonical: '/' },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 } },
    openGraph: { siteName: SITE.name, locale: SITE.locale, type: 'website', url: SITE_URL, title: SITE.name, description: SITE.entityLine },
    verification: {
      ...(VERIFICATION.google ? { google: VERIFICATION.google } : {}),
      ...(Object.keys(other).length ? { other } : {}),
    },
  };
}

/**
 * Page metadata. Statically resolvable on purpose: with Next.js Cache Components, uncached data inside
 * generateMetadata blocks metadata from prerendering, so derive titles from the registry or cached data.
 */
export function buildMetadata(m: PageMeta): Metadata {
  const images = m.image ? [{ url: absoluteUrl(m.image), width: 1200, height: 630, alt: m.title }] : undefined;
  const markdown = !m.noindex && hasMarkdown(m.path) ? { types: { 'text/markdown': markdownPathFor(m.path) } } : {};
  return {
    title: { absolute: m.title },
    description: m.description,
    keywords: m.keywords,
    alternates: { canonical: m.path, ...markdown },
    robots: m.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: m.title,
      description: m.description,
      url: absoluteUrl(m.path),
      siteName: SITE.name,
      locale: SITE.locale,
      type: m.type ?? 'website',
      ...(images ? { images } : {}),
      ...(m.type === 'article' ? { publishedTime: m.publishedTime, modifiedTime: m.modifiedTime, authors: m.authors } : {}),
    },
    twitter: { card: 'summary_large_image', title: m.title, description: m.description, ...(images ? { images } : {}) },
  };
}

/** Page metadata for a content entry (blog post, guide, release note). */
export function contentPageMeta(e: { title: string; seoTitle?: string; description: string; path: string; published: string; updated: string; keywords: string[]; noindex: boolean; image?: string }, authorName?: string): PageMeta {
  return {
    title: brandedTitle(e.seoTitle ?? e.title),
    description: e.description,
    path: e.path,
    type: 'article',
    publishedTime: e.published,
    modifiedTime: e.updated,
    authors: authorName ? [authorName] : undefined,
    keywords: e.keywords,
    noindex: e.noindex,
    image: e.image,
  };
}
