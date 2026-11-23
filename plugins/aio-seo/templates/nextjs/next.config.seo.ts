/**
 * Rewrites and headers for the SEO kit. Merge into the repo's existing next.config instead of replacing it:
 *
 *   import { seoHeaders, seoRewrites } from './next.config.seo';
 *   const nextConfig = {
 *     async rewrites() { return { beforeFiles: [...seoRewrites()], afterFiles: [], fallback: [] }; },
 *     async headers() { return [...seoHeaders()]; },
 *   };
 *
 * If the config already returns rewrites or headers, append these to its arrays. Keep apex-to-www (or
 * www-to-apex) redirects at the host or CDN level as permanent (301/308) redirects.
 *
 * Self-contained on purpose (no imports from lib/), so it loads in any next.config format.
 */

type Rewrite = { source: string; destination: string; has?: { type: 'header'; key: string; value?: string }[] };
type HeaderRule = { source: string; headers: { key: string; value: string }[] };

const ACCEPTS_MARKDOWN = { type: 'header' as const, key: 'accept', value: '(.*)text/markdown(.*)' };
/** `.md` URLs, except the markdown route itself, Next internals and API routes. */
const MD_SOURCE = '/:path((?!md/|_next/|api/).+)\\.md';
/** Page URLs without a file extension, for Accept negotiation. */
const PAGE_SOURCE = '/:path((?!md/|_next/|api/)[^.]+)';

/**
 * - `/<path>.md` serves the markdown mirror (durable URL, works everywhere).
 * - `Accept: text/markdown` on the HTML URL serves the same markdown (content negotiation). Only enable
 *   negotiation when the CDN keys its cache on Accept (Vercel does); otherwise a cached markdown response
 *   could be served to browsers. Pass `{ negotiate: false }` to keep only the .md URLs.
 */
export function seoRewrites(opts: { negotiate?: boolean } = {}): Rewrite[] {
  const rewrites: Rewrite[] = [
    { source: '/index.md', destination: '/md/index' },
    { source: MD_SOURCE, destination: '/md/:path' },
  ];
  if (opts.negotiate ?? true) {
    rewrites.push(
      { source: '/', has: [ACCEPTS_MARKDOWN], destination: '/md/index' },
      { source: PAGE_SOURCE, has: [ACCEPTS_MARKDOWN], destination: '/md/:path' },
    );
  }
  return rewrites;
}

/**
 * - Link header on the home page advertising llms.txt, llms-full.txt and the sitemap (llms.txt v2
 *   describes rel="describedby" discovery; no crawler is known to rely on it).
 * - noindex on the markdown route itself, so /md/... never competes with the HTML pages.
 */
export function seoHeaders(): HeaderRule[] {
  return [
    {
      source: '/',
      headers: [
        {
          key: 'Link',
          value: [
            '</llms.txt>; rel="describedby"; type="text/plain"',
            '</llms-full.txt>; rel="describedby"; type="text/plain"',
            '</sitemap.xml>; rel="sitemap"; type="application/xml"',
          ].join(', '),
        },
      ],
    },
    { source: '/md/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
  ];
}
