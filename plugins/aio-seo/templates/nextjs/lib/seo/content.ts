/**
 * Content source adapter: the one place that knows where articles live.
 *
 * The default implementation reads `.md` / `.mdx` files with YAML-style frontmatter from the folders in
 * CONTENT_COLLECTIONS. If the repo already has a content loader (Contentlayer, Velite, a CMS client,
 * `lib/content/load.ts`), replace the body of `loadCollection` with a call to it and keep the
 * ContentEntry shape. Everything else (sitemap, llms.txt, markdown mirror, IndexNow mapping, tests)
 * reads content only through `getContentEntries()`.
 *
 * Server-only: uses node:fs. Never import this from a client component.
 */
import fs from 'node:fs';
import path from 'node:path';

export type ArticleSchemaType = 'BlogPosting' | 'TechArticle' | 'Article' | 'NewsArticle';

export interface ContentCollection {
  /** Stable id, for example "blog". */
  id: string;
  /** Folder relative to the repo root, from config `project.content_dirs`. */
  dir: string;
  /** URL prefix, from config `project.url_patterns` (the part before /<slug>). */
  urlPrefix: string;
  /** Section heading in llms.txt and the index page label. */
  label: string;
  schemaType: ArticleSchemaType;
  sitemapPriority: number;
}

/** Filled by /aio-seo:foundation from config `project.content_dirs` and `project.url_patterns`. */
export const CONTENT_COLLECTIONS: ContentCollection[] = [
  { id: 'blog', dir: 'content/blog', urlPrefix: '/blog', label: 'Blog', schemaType: 'BlogPosting', sitemapPriority: 0.6 },
  // { id: 'guides', dir: 'content/guides', urlPrefix: '/guides', label: 'Guides', schemaType: 'TechArticle', sitemapPriority: 0.7 },
  // { id: 'releases', dir: 'content/releases', urlPrefix: '/releases', label: 'Release notes', schemaType: 'Article', sitemapPriority: 0.4 },
];

export interface ContentEntry {
  collection: string;
  slug: string;
  /** URL path, for example /blog/how-to-x. */
  path: string;
  title: string;
  /** Optional shorter <title> when the H1 is long. */
  seoTitle?: string;
  description: string;
  /** ISO date the piece was first published. */
  published: string;
  /** ISO date of the last meaningful content change. Drives sitemap lastmod and dateModified. */
  updated: string;
  /** Author slug, matching SITE.people[].slug. */
  author?: string;
  keywords: string[];
  image?: string;
  draft: boolean;
  noindex: boolean;
  /** Markdown body with MDX imports, exports and JSX-only lines removed. */
  body: string;
  /** Repo-relative path of the source file, used to map git changes to URLs for IndexNow. */
  sourceFile: string;
}

// ---------------------------------------------------------------------------
// Minimal frontmatter parser (strings, numbers, booleans, [a, b] lists and "- item" lists).
// Swap for gray-matter or the repo's own parser if one is already installed.
// ---------------------------------------------------------------------------

type FrontValue = string | number | boolean | string[];

function unquote(v: string): string {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function parseScalar(v: string): FrontValue {
  const t = v.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^\[.*\]$/.test(t)) return t.slice(1, -1).split(',').map(unquote).filter(Boolean);
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return unquote(t);
}

export function parseFrontmatter(source: string): { data: Record<string, FrontValue>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!m) return { data: {}, body: source };
  const data: Record<string, FrontValue> = {};
  let listKey: string | null = null;
  for (const line of m[1]!.split(/\r?\n/)) {
    const item = /^\s+-\s+(.*)$/.exec(line) ?? /^-\s+(.*)$/.exec(line);
    if (item && listKey) {
      (data[listKey] as string[]).push(unquote(item[1]!));
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, value] = kv as unknown as [string, string, string];
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = parseScalar(value);
      listKey = null;
    }
  }
  return { data, body: source.slice(m[0].length) };
}

/** Remove MDX-only syntax so the body reads as plain markdown for agents. */
export function mdxToMarkdown(body: string): string {
  return body
    .split(/\r?\n/)
    .filter((l) => !/^\s*(import|export)\s/.test(l))
    .filter((l) => !/^\s*<[A-Z][A-Za-z0-9.]*\b[^>]*\/>\s*$/.test(l))
    .filter((l) => !/^\s*<\/?[A-Z][A-Za-z0-9.]*\b[^>]*>\s*$/.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const str = (v: FrontValue | undefined): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : undefined);
const list = (v: FrontValue | undefined): string[] => (Array.isArray(v) ? v : typeof v === 'string' && v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

/** Dates may be written 2026-03-01 or as a full timestamp; keep them as ISO strings. */
function isoDate(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return Number.isNaN(Date.parse(v)) ? undefined : v;
}

function loadCollection(c: ContentCollection): ContentEntry[] {
  const root = path.join(process.cwd(), c.dir);
  if (!fs.existsSync(root)) return [];
  const files: { file: string; slug: string }[] = [];
  for (const name of fs.readdirSync(root)) {
    const full = path.join(root, name);
    if (fs.statSync(full).isDirectory()) {
      for (const idx of ['index.mdx', 'index.md']) if (fs.existsSync(path.join(full, idx))) files.push({ file: path.join(full, idx), slug: name });
    } else if (/\.(md|mdx)$/.test(name)) {
      files.push({ file: full, slug: name.replace(/\.(md|mdx)$/, '') });
    }
  }
  return files.map(({ file, slug: fileSlug }) => {
    const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    const slug = str(data.slug) ?? fileSlug;
    const published = isoDate(str(data.published) ?? str(data.date) ?? str(data.pubDate) ?? str(data.datePublished)) ?? '';
    const updated = isoDate(str(data.updated) ?? str(data.lastModified) ?? str(data.dateModified) ?? str(data.updatedDate)) ?? published;
    return {
      collection: c.id,
      slug,
      path: `${c.urlPrefix}/${slug}`,
      title: str(data.title) ?? slug,
      seoTitle: str(data.seoTitle),
      description: str(data.description) ?? str(data.summary) ?? '',
      published,
      updated,
      author: str(data.author),
      keywords: list(data.keywords ?? data.tags),
      image: str(data.image) ?? str(data.cover),
      draft: data.draft === true || data.status === 'draft',
      noindex: data.noindex === true,
      body: mdxToMarkdown(body),
      sourceFile: path.relative(process.cwd(), file).split(path.sep).join('/'),
    };
  });
}

let cache: ContentEntry[] | null = null;

/**
 * Every published entry (drafts and future-dated entries removed), newest first.
 * noindex entries are included here; the sitemap, llms.txt and markdown mirror filter them out.
 */
export function getContentEntries(collectionId?: string): ContentEntry[] {
  if (!cache || process.env.NODE_ENV === 'development') {
    const today = new Date().toISOString().slice(0, 10);
    cache = CONTENT_COLLECTIONS.flatMap(loadCollection)
      .filter((e) => !e.draft && e.published !== '' && e.published.slice(0, 10) <= today)
      .sort((a, b) => b.published.localeCompare(a.published));
  }
  return collectionId ? cache.filter((e) => e.collection === collectionId) : cache;
}

export function getContentEntry(pathname: string): ContentEntry | undefined {
  return getContentEntries().find((e) => e.path === pathname);
}

export function collectionFor(id: string): ContentCollection | undefined {
  return CONTENT_COLLECTIONS.find((c) => c.id === id);
}
