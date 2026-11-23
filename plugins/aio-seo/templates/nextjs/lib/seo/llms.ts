/**
 * /llms.txt and /llms-full.txt, generated from the route registry and the content source, so they can
 * never list a page the sitemap does not (or a private or noindex page).
 *
 * Honest status, from the aio-seo knowledge base:
 * - llms.txt is a community proposal (llmstxt.org), not adopted by any standards body.
 * - Google Search states it does not use it; no major AI vendor has said it reads third-party files.
 * - llms-full.txt is not part of the llms.txt spec at all; it is a platform convention.
 * They are cheap to generate from data you already have, which is the only reason they are here.
 * Never treat them as a ranking or citation lever.
 */
import { CONTENT_COLLECTIONS, getContentEntries } from './content';
import { markdownForPath } from './markdown';
import { ALL_ROUTES, ROUTE_GROUPS, indexableContent, type RouteGroup } from './routes';
import { SITE, absoluteUrl } from './site';

const link = (title: string, path: string, note?: string) => `- [${title}](${absoluteUrl(path)})${note ? `: ${note}` : ''}`;

function header(): string[] {
  const lines = [`# ${SITE.name}`, '', `> ${SITE.entityLine}`, ''];
  const details = [SITE.shortDescription, SITE.disambiguation].filter((s) => s && s.trim());
  if (details.length) lines.push(details.join(' '), '');
  return lines;
}

function routeSection(group: RouteGroup): string[] {
  const routes = ALL_ROUTES.filter((r) => r.group === group && !r.noindex);
  if (!routes.length) return [];
  return [`## ${ROUTE_GROUPS[group].heading}`, ...routes.map((r) => link(r.label, r.path, r.summary)), ''];
}

/** /llms.txt: a title, the entity line as the summary, and grouped links to the key pages. */
export function buildLlmsTxt(): string {
  const groups = Object.keys(ROUTE_GROUPS) as RouteGroup[];
  const lines = [...header()];
  for (const g of groups.filter((g) => !ROUTE_GROUPS[g].optional)) lines.push(...routeSection(g));
  for (const c of CONTENT_COLLECTIONS) {
    const entries = indexableContent().filter((e) => e.collection === c.id);
    if (!entries.length) continue;
    lines.push(`## ${c.label}`);
    if (ALL_ROUTES.some((r) => r.path === c.urlPrefix)) lines.push(link(`All ${c.label.toLowerCase()}`, c.urlPrefix));
    lines.push(...entries.map((e) => link(e.title, e.path, e.description)), '');
  }
  const optional = groups.filter((g) => ROUTE_GROUPS[g].optional).flatMap((g) => ALL_ROUTES.filter((r) => r.group === g && !r.noindex));
  if (optional.length) lines.push('## Optional', ...optional.map((r) => link(r.label, r.path, r.summary)), '');
  lines.push(`Full text of pages with a markdown version: ${absoluteUrl('/llms-full.txt')}`, '');
  return lines.join('\n');
}

/**
 * /llms-full.txt: the same header, then the full markdown of every indexable page that has a markdown
 * source, each preceded by its canonical URL. Pages without a markdown source are listed by summary.
 */
export function buildLlmsFullTxt(): string {
  const lines = [...header()];
  const covered = new Set<string>();
  const pages = [...ALL_ROUTES.filter((r) => !r.noindex).map((r) => r.path), ...getContentEntries().filter((e) => !e.noindex).map((e) => e.path)];
  for (const p of [...new Set(pages)]) {
    const doc = markdownForPath(p);
    if (!doc) continue;
    covered.add(p);
    lines.push('---', '', `URL: ${doc.canonical}`, '', doc.markdown.trim(), '');
  }
  const rest = ALL_ROUTES.filter((r) => !r.noindex && !covered.has(r.path));
  if (rest.length) {
    lines.push('---', '', '## Other pages', ...rest.map((r) => link(r.label, r.path, r.summary)), '');
  }
  return lines.join('\n');
}

/** noindex keeps the files out of search results; crawlers and agents can still fetch them. */
export const LLMS_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'X-Robots-Tag': 'noindex',
} as const;
