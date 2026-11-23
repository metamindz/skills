/**
 * Markdown mirror. Reached through the rewrites in next.config (see next.config.seo.ts):
 *   /pricing.md                       -> /md/pricing
 *   /pricing with Accept: text/markdown -> /md/pricing
 *   /index.md                         -> /md/index
 * Returns 404 for pages without a markdown source. The HTML page stays canonical (Link header).
 */
import { markdownForPath, markdownHeaders, markdownPathFor, markdownPaths, pagePathForMarkdown } from '../../../lib/seo/markdown';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { slug: string[] }[] {
  return markdownPaths().map((p) => ({ slug: markdownPathFor(p).replace(/\.md$/, '').split('/').filter(Boolean) }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await ctx.params;
  const doc = markdownForPath(pagePathForMarkdown(`/${slug.join('/')}`));
  if (!doc) return new Response('Not found\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(doc.markdown, { headers: markdownHeaders(doc) });
}
