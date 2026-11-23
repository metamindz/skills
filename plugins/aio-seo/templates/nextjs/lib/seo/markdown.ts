/**
 * Markdown versions of pages, for agents that ask for them (`/<path>.md`, or `Accept: text/markdown`
 * rewritten to the same route by next.config). Served by app/md/[[...slug]]/route.ts.
 *
 * Honest status: the plumbing is real (Vercel and Cloudflare both ship it) but there is no evidence yet
 * that markdown versions raise citations; major AI crawlers were not observed requesting them. Keep it
 * because it is cheap, and keep every markdown file in step with the visible page: different content
 * for agents and people is a cloaking-shaped problem.
 *
 * Only pages with a real markdown source get a mirror: content entries (their body) and static routes
 * with a `markdownFile`. Everything else returns null (404), never a thin auto-summary.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getContentEntries } from './content';
import { ALL_ROUTES } from './routes';
import { absoluteUrl } from './site';

/** "/" -> "/index.md", "/blog/x" -> "/blog/x.md". */
export function markdownPathFor(pagePath: string): string {
  const clean = pagePath.replace(/\/+$/, '');
  return clean === '' ? '/index.md' : `${clean}.md`;
}

/** Inverse of markdownPathFor. */
export function pagePathForMarkdown(mdPath: string): string {
  const p = mdPath.replace(/\.md$/, '');
  return p === '/index' || p === '' ? '/' : p;
}

function readRepoFile(rel: string): string | null {
  const full = path.join(process.cwd(), rel);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
}

export interface MarkdownDoc {
  /** Canonical HTML URL of the page this markdown mirrors. */
  canonical: string;
  title: string;
  markdown: string;
}

/** Markdown for a page path, or null when the page has no markdown source. */
export function markdownForPath(pagePath: string): MarkdownDoc | null {
  const entry = getContentEntries().find((e) => e.path === pagePath && !e.noindex);
  if (entry) {
    const meta = [`Source: ${absoluteUrl(entry.path)}`, `Published: ${entry.published.slice(0, 10)}`];
    if (entry.updated && entry.updated !== entry.published) meta.push(`Updated: ${entry.updated.slice(0, 10)}`);
    return {
      canonical: absoluteUrl(entry.path),
      title: entry.title,
      markdown: [`# ${entry.title}`, '', `> ${entry.description}`, '', meta.join('  \n'), '', entry.body, ''].join('\n'),
    };
  }
  const route = ALL_ROUTES.find((r) => r.path === pagePath && !r.noindex && r.markdownFile);
  if (route?.markdownFile) {
    const body = readRepoFile(route.markdownFile);
    if (body === null) return null;
    const hasH1 = /^#\s/m.test(body);
    return {
      canonical: absoluteUrl(route.path),
      title: route.title,
      markdown: [hasH1 ? '' : `# ${route.label}\n`, `Source: ${absoluteUrl(route.path)}`, '', body.trim(), ''].join('\n').trimStart(),
    };
  }
  return null;
}

export function hasMarkdown(pagePath: string): boolean {
  if (getContentEntries().some((e) => e.path === pagePath && !e.noindex)) return true;
  const route = ALL_ROUTES.find((r) => r.path === pagePath && !r.noindex && r.markdownFile);
  return Boolean(route?.markdownFile && fs.existsSync(path.join(process.cwd(), route.markdownFile)));
}

/** Every page path that has a markdown mirror (for generateStaticParams and llms-full.txt). */
export function markdownPaths(): string[] {
  const paths = [...ALL_ROUTES.map((r) => r.path), ...getContentEntries().map((e) => e.path)];
  return [...new Set(paths)].filter(hasMarkdown);
}

export const MARKDOWN_HEADERS = {
  'Content-Type': 'text/markdown; charset=utf-8',
  Vary: 'Accept',
  'X-Content-Type-Options': 'nosniff',
} as const;

/** Response headers for one markdown document: the HTML page stays the canonical URL. */
export function markdownHeaders(doc: MarkdownDoc): Record<string, string> {
  return { ...MARKDOWN_HEADERS, Link: `<${doc.canonical}>; rel="canonical"` };
}
