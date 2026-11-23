/**
 * Every page's title and description, from the route registry and the content source.
 * Limits are house rules (lib/seo/metadata.ts): Google sets no hard limit, but long titles are rewritten
 * more often and long descriptions are cut on display.
 */
import { describe, expect, it } from 'vitest';
import { getContentEntries } from '../../lib/seo/content';
import { DESCRIPTION_MAX, DESCRIPTION_MIN, TITLE_MAX, buildMetadata, contentPageMeta, rootMetadata, type PageMeta } from '../../lib/seo/metadata';
import { ALL_ROUTES, NOINDEX_ROUTES, PRIVATE_PATHS } from '../../lib/seo/routes';
import { SITE } from '../../lib/seo/site';

function allPages(): PageMeta[] {
  return [...ALL_ROUTES, ...NOINDEX_ROUTES, ...getContentEntries().map((e) => contentPageMeta(e))];
}

const pages = allPages();
const cases = pages.map((p) => [p.path, p] as const);

describe('page metadata', () => {
  it('site config has been filled in (no {{placeholders}} left)', () => {
    expect(JSON.stringify(SITE)).not.toMatch(/\{\{[^}]+\}\}/);
    expect(SITE.entityLine.length).toBeGreaterThan(20);
  });

  it.each(cases)('%s has a title of 1 to 60 characters', (_path, p) => {
    expect(p.title.trim().length).toBeGreaterThan(0);
    expect(p.title.length, p.title).toBeLessThanOrEqual(TITLE_MAX);
  });

  it.each(cases)('%s has a description of 50 to 160 characters', (_path, p) => {
    expect(p.description.length, p.description).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(p.description.length, p.description).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it('titles, descriptions and paths are unique', () => {
    const dupes = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);
    expect(dupes(pages.map((p) => p.title))).toEqual([]);
    expect(dupes(pages.map((p) => p.description))).toEqual([]);
    expect(dupes(pages.map((p) => p.path))).toEqual([]);
  });

  it('no em or en dashes in titles or descriptions', () => {
    for (const p of pages) expect(p.title + p.description, p.path).not.toMatch(/[\u2013\u2014]/);
  });

  it('buildMetadata sets an absolute title, a canonical and Open Graph fields', () => {
    for (const p of pages) {
      const m = buildMetadata(p);
      expect(m.title).toEqual({ absolute: p.title });
      expect(m.alternates?.canonical).toBe(p.path);
      expect(m.openGraph).toMatchObject({ title: p.title, description: p.description, locale: SITE.locale });
    }
  });

  it('noindex pages get robots noindex, follow', () => {
    for (const p of pages.filter((x) => x.noindex)) expect(buildMetadata(p).robots).toEqual({ index: false, follow: true });
  });

  it('no indexable page lives under a private path', () => {
    for (const p of pages.filter((x) => !x.noindex)) {
      for (const priv of PRIVATE_PATHS) {
        const prefix = priv.replace(/\$$/, '');
        const hit = priv.endsWith('$') ? p.path === prefix : p.path.startsWith(prefix);
        expect(hit, `${p.path} is under private path ${priv}`).toBe(false);
      }
    }
  });

  it('the root description is the entity line, verbatim', () => {
    expect(rootMetadata().description).toBe(SITE.entityLine);
  });
});
