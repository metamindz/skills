/**
 * The route registry: every static public page with its metadata, in one place.
 * Pages read their metadata from here (`buildMetadata(ROUTES.pricing)`), and the sitemap, robots.txt,
 * llms.txt, llms-full.txt, the markdown mirror, IndexNow and the tests all enumerate it, so a page
 * cannot be forgotten in one file and present in another.
 *
 * Content pages (blog, guides, release notes) come from lib/seo/content.ts instead.
 * The entries below are EXAMPLES for "Acme Analytics": /aio-seo:foundation replaces them with the
 * site's real routes, titles and descriptions.
 */
import type { PageMeta } from './metadata';
import { CONTENT_COLLECTIONS, getContentEntries, type ContentEntry } from './content';

export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

/** Route groups, in llms.txt order. `optional: true` puts the group under "## Optional" in llms.txt. */
export const ROUTE_GROUPS = {
  product: { heading: 'Product', optional: false },
  company: { heading: 'Company', optional: false },
  legal: { heading: 'Legal', optional: true },
} as const;
export type RouteGroup = keyof typeof ROUTE_GROUPS;

export interface SeoRoute extends PageMeta {
  /** Short label for navigation, breadcrumbs and llms.txt. */
  label: string;
  /** One factual line for llms.txt. */
  summary: string;
  group: RouteGroup;
  priority: number;
  changeFrequency: ChangeFrequency;
  /**
   * ISO date of the last real content change. Update it when the copy changes; never compute it from
   * the build time (search engines learn to ignore a lastmod that changes on every deploy).
   * Omit when unknown: no lastmod is better than a wrong one.
   */
  lastModified?: string;
  /** Repo-relative markdown file with the page's visible copy, served at <path>.md. Optional. */
  markdownFile?: string;
  /** Repo-relative source files; a change to any of them submits this URL to IndexNow. */
  sourceFiles?: string[];
}

export const ROUTES = {
  home: {
    path: '/',
    label: 'Home',
    title: 'Product analytics for small SaaS teams | Acme Analytics',
    description: 'Acme Analytics shows small SaaS teams which features drive retention, with privacy-first tracking and plain-English reports.',
    summary: 'What Acme Analytics does, who it is for, pricing overview and common questions.',
    group: 'product',
    priority: 1,
    changeFrequency: 'weekly',
    lastModified: '2026-01-15',
    sourceFiles: ['app/page.tsx'],
  },
  pricing: {
    path: '/pricing',
    label: 'Pricing',
    title: 'Pricing: plans from free to team | Acme Analytics',
    description: 'Acme Analytics plans and prices, what each plan includes, VAT, billing periods and how to cancel.',
    summary: 'Every plan with its price, limits and billing terms.',
    group: 'product',
    priority: 0.9,
    changeFrequency: 'monthly',
    lastModified: '2026-01-15',
    sourceFiles: ['app/pricing/page.tsx'],
  },
  about: {
    path: '/about',
    label: 'About',
    title: 'About Acme Analytics: team and company details',
    description: 'Who runs Acme Analytics, where the company is registered, how to reach the team and what the product is for.',
    summary: 'Company details, team and contact routes.',
    group: 'company',
    priority: 0.5,
    changeFrequency: 'yearly',
    sourceFiles: ['app/about/page.tsx'],
  },
  privacy: {
    path: '/privacy',
    label: 'Privacy policy',
    title: 'Privacy policy | Acme Analytics',
    description: 'How Acme Analytics collects, uses and protects personal data under UK GDPR, and how to exercise your rights.',
    summary: 'Privacy policy.',
    group: 'legal',
    priority: 0.2,
    changeFrequency: 'yearly',
    lastModified: '2026-01-10',
  },
} as const satisfies Record<string, SeoRoute>;

export type RouteKey = keyof typeof ROUTES;
export const ALL_ROUTES: SeoRoute[] = Object.values(ROUTES);

/**
 * Campaign landing pages (launches, ads, partner links). Indexing them would compete with the main
 * pages, so they are noindex and never appear in the sitemap, llms.txt or IndexNow submissions.
 */
export const CAMPAIGN_ROUTES: Record<string, PageMeta> = {
  // launch: { path: '/launch', title: 'Acme Analytics launch offer', description: 'Launch offer details for new customers who arrive from a launch announcement this month.', noindex: true },
};

/** Utility pages with no search value (thank-you, search results, confirmations). noindex, follow. */
export const UTILITY_ROUTES: Record<string, PageMeta> = {
  thanks: { path: '/thanks', title: 'Thanks for getting in touch | Acme Analytics', description: 'Confirmation that your message reached the Acme Analytics team, with what happens next.', noindex: true },
};

export const NOINDEX_ROUTES: PageMeta[] = [...Object.values(CAMPAIGN_ROUTES), ...Object.values(UTILITY_ROUTES)];

/**
 * Private areas, from config `project.private_paths`. Disallowed in robots.txt for every crawler and
 * cross-checked by tests against every indexable URL. Robots rules are prefix matches: "/auth" would
 * also block "/authors", so prefer a trailing slash ("/auth/") and an anchored exact path ("/auth$").
 */
export const PRIVATE_PATHS: string[] = ['/api/', '/admin/', '/account/'];

/** Indexable content entries (published, not noindex). */
export function indexableContent(): ContentEntry[] {
  return getContentEntries().filter((e) => !e.noindex);
}

/** Every indexable path on the site: static routes plus content. */
export function indexablePaths(): string[] {
  return [...ALL_ROUTES.filter((r) => !r.noindex).map((r) => r.path), ...indexableContent().map((e) => e.path)];
}

/**
 * Map changed repo files (for example from `git diff --name-only`) to the public URLs they affect,
 * for IndexNow. Content files map to their entry; static pages map through `sourceFiles`.
 * Shared code (layouts, components) maps to nothing: a header change does not need re-indexing.
 */
export function pathsForChangedFiles(files: string[]): string[] {
  const changed = new Set(files.map((f) => f.replace(/^\.\//, '')));
  const out = new Set<string>();
  for (const r of ALL_ROUTES) {
    if (r.noindex) continue;
    if ((r.sourceFiles ?? []).some((f) => changed.has(f)) || (r.markdownFile && changed.has(r.markdownFile))) out.add(r.path);
  }
  for (const e of indexableContent()) if (changed.has(e.sourceFile)) out.add(e.path);
  // A new or changed content file also changes its collection index page, when that page is a route.
  for (const c of CONTENT_COLLECTIONS) {
    if ([...changed].some((f) => f.startsWith(`${c.dir}/`)) && ALL_ROUTES.some((r) => r.path === c.urlPrefix)) out.add(c.urlPrefix);
  }
  return [...out];
}
