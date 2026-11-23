import type { MetadataRoute } from 'next';
import { buildRobotsRules } from '../lib/seo/crawlers';
import { absoluteUrl } from '../lib/seo/site';

/**
 * robots.txt from CRAWLER_POLICY and PRIVATE_PATHS. The Content-Signal line uses the `other` field,
 * which Next.js emits from 16.3.0; older versions drop it silently (check-site.mjs reports it missing).
 */
export default function robots(): MetadataRoute.Robots {
  const rules = buildRobotsRules();
  return {
    rules: rules as MetadataRoute.Robots['rules'],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
