/**
 * robots.txt, sitemap, llms.txt, llms-full.txt and the markdown mirror all come from the same registry.
 * These tests stop them drifting apart and stop private or noindex pages leaking into any of them.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from '../../app/robots';
import sitemap from '../../app/sitemap';
import { AI_CRAWLERS, RETIRED_TOKENS, buildRobotsRules, crawlerPolicyProblems, robotsAllows, type RobotsRule } from '../../lib/seo/crawlers';
import { getContentEntries } from '../../lib/seo/content';
import { buildLlmsFullTxt, buildLlmsTxt } from '../../lib/seo/llms';
import { markdownForPath, markdownPathFor, pagePathForMarkdown } from '../../lib/seo/markdown';
import { ALL_ROUTES, NOINDEX_ROUTES, PRIVATE_PATHS, indexablePaths } from '../../lib/seo/routes';
import { CRAWLER_POLICY, SITE, absoluteUrl } from '../../lib/seo/site';

const rules = buildRobotsRules();

describe('robots.txt', () => {
  it('disallows every private path for every crawler', () => {
    for (const token of ['*', 'Googlebot', ...AI_CRAWLERS.map((c) => c.token)]) {
      for (const p of PRIVATE_PATHS) {
        const sample = p.replace(/\$$/, '').replace(/\*$/, '') + (p.endsWith('/') ? 'x' : '');
        expect(robotsAllows(rules, token, sample), `${token} may crawl ${sample}`).toBe(false);
      }
    }
  });

  it('allows every indexable page for Googlebot, Bingbot and every search or user-triggered AI crawler', () => {
    const tokens = ['Googlebot', 'Bingbot', ...AI_CRAWLERS.filter((c) => c.category === 'search' || c.category === 'user').map((c) => c.token)];
    for (const path of indexablePaths()) for (const t of tokens) expect(robotsAllows(rules, t, path), `${t} blocked from ${path}`).toBe(true);
  });

  it('names every current AI crawler explicitly and no retired token', () => {
    const agents = rules.flatMap((r: RobotsRule) => (Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent]));
    for (const c of AI_CRAWLERS) expect(agents).toContain(c.token);
    for (const t of RETIRED_TOKENS) expect(agents).not.toContain(t);
  });

  it('crawler policy is internally consistent (Content-Signal matches the allow/block choices)', () => {
    expect(crawlerPolicyProblems(CRAWLER_POLICY)).toEqual([]);
  });

  it('blocking training flips GPTBot and ClaudeBot but never the search crawlers', () => {
    const strict = buildRobotsRules({ ...CRAWLER_POLICY, training: 'block', bulk: 'block', contentSignal: { search: 'yes', 'ai-input': 'yes', 'ai-train': 'no' } });
    expect(robotsAllows(strict, 'GPTBot', '/')).toBe(false);
    expect(robotsAllows(strict, 'ClaudeBot', '/')).toBe(false);
    expect(robotsAllows(strict, 'OAI-SearchBot', '/')).toBe(true);
    expect(robotsAllows(strict, 'Claude-SearchBot', '/')).toBe(true);
  });

  it('points at the sitemap on the canonical origin', () => {
    expect(robots().sitemap).toBe(absoluteUrl('/sitemap.xml'));
  });
});

describe('sitemap', () => {
  afterEach(() => vi.useRealTimers());
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it('lists every indexable page once, on the site origin', () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const p of indexablePaths()) expect(urls).toContain(absoluteUrl(p));
    for (const u of urls) expect(new URL(u).origin).toBe(new URL(SITE.url).origin);
  });

  it('never lists noindex, campaign, utility or private URLs', () => {
    for (const r of NOINDEX_ROUTES) expect(urls).not.toContain(absoluteUrl(r.path));
    for (const e of getContentEntries().filter((x) => x.noindex)) expect(urls).not.toContain(absoluteUrl(e.path));
    for (const u of urls) for (const p of PRIVATE_PATHS) expect(new URL(u).pathname.startsWith(p.replace(/\$$/, '')), u).toBe(false);
  });

  it('lastModified values are real dates, not build or request time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-01-01T00:00:00Z'));
    const later = sitemap();
    vi.useRealTimers();
    expect(later.map((e) => String(e.lastModified ?? ''))).toEqual(entries.map((e) => String(e.lastModified ?? '')));
    for (const e of entries) {
      if (e.lastModified === undefined) continue;
      expect(Number.isNaN(Date.parse(String(e.lastModified))), e.url).toBe(false);
      expect(Date.parse(String(e.lastModified)), `${e.url} lastModified is in the future`).toBeLessThanOrEqual(Date.now() + 36 * 3600 * 1000);
    }
  });
});

describe('llms.txt and llms-full.txt', () => {
  const txt = buildLlmsTxt();
  const full = buildLlmsFullTxt();

  it('starts with the site name and the entity line, verbatim', () => {
    expect(txt.startsWith(`# ${SITE.name}\n`)).toBe(true);
    expect(txt).toContain(`> ${SITE.entityLine}`);
    expect(full.startsWith(`# ${SITE.name}\n`)).toBe(true);
    expect(full).toContain(`> ${SITE.entityLine}`);
  });

  it('links every indexable page and nothing private or noindex', () => {
    for (const p of indexablePaths()) expect(txt).toContain(`](${absoluteUrl(p)})`);
    for (const r of NOINDEX_ROUTES) expect(txt).not.toContain(`](${absoluteUrl(r.path)})`);
    for (const p of PRIVATE_PATHS) expect(txt).not.toContain(absoluteUrl(p.replace(/\$$/, '')));
  });

  it('llms-full.txt carries the full text of every content entry', () => {
    for (const e of getContentEntries().filter((x) => !x.noindex)) expect(full).toContain(`URL: ${absoluteUrl(e.path)}`);
  });
});

describe('markdown mirror', () => {
  it('maps paths both ways', () => {
    expect(markdownPathFor('/')).toBe('/index.md');
    expect(markdownPathFor('/blog/a')).toBe('/blog/a.md');
    expect(pagePathForMarkdown('/index.md')).toBe('/');
    expect(pagePathForMarkdown('/blog/a.md')).toBe('/blog/a');
  });

  it('serves content entries with their title and canonical URL, and nothing for unknown pages', () => {
    const e = getContentEntries().find((x) => !x.noindex);
    if (e) {
      const doc = markdownForPath(e.path);
      expect(doc?.markdown).toContain(`# ${e.title}`);
      expect(doc?.canonical).toBe(absoluteUrl(e.path));
    }
    expect(markdownForPath('/this-page-does-not-exist')).toBeNull();
  });

  it('never mirrors a noindex page', () => {
    for (const r of NOINDEX_ROUTES) expect(markdownForPath(r.path)).toBeNull();
    for (const r of ALL_ROUTES.filter((x) => x.noindex)) expect(markdownForPath(r.path)).toBeNull();
  });
});
