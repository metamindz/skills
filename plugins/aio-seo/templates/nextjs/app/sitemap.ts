import type { MetadataRoute } from 'next';
import { collectionFor } from '../lib/seo/content';
import { ALL_ROUTES, indexableContent } from '../lib/seo/routes';
import { absoluteUrl } from '../lib/seo/site';

/**
 * Public, indexable pages only: noindex, campaign, utility and private routes never appear here.
 * lastModified comes from real content dates (route `lastModified`, content `updated`), never from the
 * build or request time; a lastmod that changes on every deploy teaches search engines to ignore it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = ALL_ROUTES.filter((r) => !r.noindex).map((r) => ({
    url: absoluteUrl(r.path),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    ...(r.lastModified ? { lastModified: r.lastModified } : {}),
  }));

  const content: MetadataRoute.Sitemap = indexableContent().map((e) => ({
    url: absoluteUrl(e.path),
    lastModified: e.updated || e.published,
    changeFrequency: 'monthly' as const,
    priority: collectionFor(e.collection)?.sitemapPriority ?? 0.5,
  }));

  const seen = new Set<string>();
  return [...routes, ...content].filter((entry) => (seen.has(entry.url) ? false : (seen.add(entry.url), true)));
}
