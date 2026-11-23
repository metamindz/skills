#!/usr/bin/env node
/**
 * check-site.mjs: live technical SEO and AI-crawler check for one website (Node 18+, zero dependencies, ESM).
 *
 *   node check-site.mjs --url https://www.example.com [--sitemap-sample 20] [--json] [--indexnow-key <key>]
 *
 * Read-only: every request is a GET with a polite User-Agent, at most 4 in flight at once.
 * It checks robots.txt (per AI bot), the sitemap, a sample of pages, llms.txt / llms-full.txt, the
 * markdown mirror, an optional IndexNow key file and apex/www/https redirects, then prints a markdown
 * report (or JSON with --json).
 *
 * Exit codes: 0 no FAIL findings, 1 at least one FAIL finding, 2 usage error or the site was unreachable.
 */
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { validateJsonLd, extractJsonLdBlocks, collectTypes, checkIdGraph } from './validate-jsonld.mjs';

const USER_AGENT = 'aio-seo-check/0.1 (+https://github.com/metamindz/skills)';
const CONCURRENCY = 4;
const MAX_REDIRECTS = 10;
const MAX_CHILD_SITEMAPS = 50;
const HTML_LIMIT_BYTES = 2 * 1024 * 1024; // Googlebot reportedly fetches up to 2MB per URL; bytes beyond are not indexed.

/**
 * AI and search crawlers checked in robots.txt. Categories follow the plugin knowledge base:
 * search = indexes pages for search or AI answers; user = fetches a page because a person asked;
 * training = collects data for model training; control = a robots.txt token only, no crawler of its own.
 */
export const BOTS = [
  { token: 'Googlebot', owner: 'Google', category: 'search', note: 'Google Search, AI Overviews and AI Mode' },
  { token: 'Bingbot', owner: 'Microsoft', category: 'search', note: 'Bing and Copilot' },
  { token: 'Applebot', owner: 'Apple', category: 'search', note: 'Apple search features' },
  { token: 'OAI-SearchBot', owner: 'OpenAI', category: 'search', note: 'ChatGPT search results' },
  { token: 'Claude-SearchBot', owner: 'Anthropic', category: 'search', note: 'Claude search results' },
  { token: 'PerplexityBot', owner: 'Perplexity', category: 'search', note: 'Perplexity index; documented as not used for model training' },
  { token: 'DuckAssistBot', owner: 'DuckDuckGo', category: 'search', note: 'DuckDuckGo AI answers' },
  { token: 'ChatGPT-User', owner: 'OpenAI', category: 'user', note: 'Fetches a page when a ChatGPT user asks' },
  { token: 'Claude-User', owner: 'Anthropic', category: 'user', note: 'Fetches a page when a Claude user asks' },
  { token: 'Perplexity-User', owner: 'Perplexity', category: 'user', note: 'Documented as generally ignoring robots.txt; blocking needs a WAF rule' },
  { token: 'MistralAI-User', owner: 'Mistral', category: 'user', note: 'Fetches a page when a Le Chat user asks' },
  { token: 'meta-externalfetcher', owner: 'Meta', category: 'user', note: 'Documented as possibly bypassing robots.txt' },
  { token: 'GPTBot', owner: 'OpenAI', category: 'training', note: 'Model training' },
  { token: 'ClaudeBot', owner: 'Anthropic', category: 'training', note: 'Model training' },
  { token: 'CCBot', owner: 'Common Crawl', category: 'training', note: 'Open web crawl, widely used for training' },
  { token: 'Bytespider', owner: 'ByteDance', category: 'training', note: 'Bulk crawler' },
  { token: 'meta-externalagent', owner: 'Meta', category: 'training', note: 'Model training' },
  { token: 'Amazonbot', owner: 'Amazon', category: 'training', note: 'Amazon crawler' },
  { token: 'Google-Extended', owner: 'Google', category: 'control', note: 'Gemini training AND grounding; blocking it costs Gemini grounding, not Google Search' },
  { token: 'Applebot-Extended', owner: 'Apple', category: 'control', note: 'Apple model training; blocking it does not remove you from Apple search' },
];
const RETIRED_TOKENS = ['anthropic-ai', 'Claude-Web'];

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

const clean = (s) => decodeEntities(String(s ?? '')).replace(/\s+/g, ' ').trim();
const charLength = (s) => [...s].length;

function normaliseUrl(u) {
  try {
    const x = new URL(u);
    x.hash = '';
    let s = x.toString();
    if (x.pathname !== '/' && s.endsWith('/')) s = s.slice(0, -1);
    return s;
  } catch {
    return u;
  }
}

function sampleEvenly(list, n) {
  if (list.length <= n) return [...list];
  const step = list.length / n;
  return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)]);
}

function parseAttributes(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  const body = tag.replace(/^<\w+/, '').replace(/\/?>$/, '');
  while ((m = re.exec(body))) attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  return attrs;
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

/**
 * GET a URL following redirects by hand so the whole chain is visible.
 * Returns { chain: [{url, status, location}], finalUrl, status, headers, body?, error? }.
 */
async function fetchChain(url, { timeout, readBody = true, accept } = {}) {
  const chain = [];
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res;
    try {
      res = await fetch(current, {
        redirect: 'manual',
        headers: { 'User-Agent': USER_AGENT, Accept: accept ?? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        signal: AbortSignal.timeout(timeout),
      });
    } catch (e) {
      const cause = e && typeof e === 'object' && 'cause' in e && e.cause ? `: ${e.cause.code ?? e.cause.message ?? e.cause}` : '';
      return { chain, finalUrl: current, status: 0, headers: new Headers(), error: `${e instanceof Error ? e.message : String(e)}${cause}` };
    }
    const location = res.headers.get('location');
    chain.push({ url: current, status: res.status, location: location ?? undefined });
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel().catch(() => {});
      current = new URL(location, current).toString();
      continue;
    }
    let body;
    let bytes = 0;
    if (readBody) {
      const buf = Buffer.from(await res.arrayBuffer());
      bytes = buf.length;
      body = buf;
    } else {
      await res.body?.cancel().catch(() => {});
    }
    return { chain, finalUrl: current, status: res.status, headers: res.headers, body, bytes };
  }
  return { chain, finalUrl: current, status: 0, headers: new Headers(), error: `more than ${MAX_REDIRECTS} redirects` };
}

// ---------------------------------------------------------------------------
// robots.txt (RFC 9309 matching)
// ---------------------------------------------------------------------------

export function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  const other = [];
  let current = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [], extras: [] };
        groups.push(current);
      }
      current.agents.push(value);
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (key === 'sitemap') sitemaps.push(value);
    else if ((key === 'allow' || key === 'disallow') && current) current.rules.push({ type: key, path: value });
    else if (current) current.extras.push({ key: line.slice(0, idx).trim(), value });
    else other.push({ key: line.slice(0, idx).trim(), value });
  }
  return { groups, sitemaps, other };
}

function ruleMatches(pattern, path) {
  if (pattern === '') return false;
  let re = '';
  for (const ch of pattern) {
    if (ch === '*') re += '.*';
    else if (ch === '$') re += '$';
    else re += ch.replace(/[.+?^{}()|[\]\\]/g, '\\$&');
  }
  try {
    return new RegExp(`^${re}`).test(path);
  } catch {
    return path.startsWith(pattern);
  }
}

/** Which groups apply to a bot: those naming it exactly (case-insensitive), else the * group. */
export function groupsFor(robots, token) {
  const t = token.toLowerCase();
  const specific = robots.groups.filter((g) => g.agents.some((a) => a.toLowerCase() === t));
  if (specific.length) return { groups: specific, matched: token };
  const star = robots.groups.filter((g) => g.agents.includes('*'));
  return { groups: star, matched: star.length ? '*' : 'none' };
}

/** RFC 9309: the longest matching rule wins; on a tie, allow wins. No matching rule means allowed. */
export function isAllowed(robots, token, path) {
  const { groups, matched } = groupsFor(robots, token);
  let best = null;
  for (const g of groups) {
    for (const r of g.rules) {
      if (!ruleMatches(r.path, path)) continue;
      const len = r.path.length;
      if (!best || len > best.len || (len === best.len && r.type === 'allow')) best = { len, type: r.type, path: r.path };
    }
  }
  return { allowed: !best || best.type === 'allow', rule: best ? `${best.type === 'allow' ? 'Allow' : 'Disallow'}: ${best.path}` : '(no rule)', group: matched };
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

function xmlText(s) {
  return decodeEntities(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim();
}

export function parseSitemap(xml) {
  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const entries = [];
  const blockRe = isIndex ? /<sitemap>([\s\S]*?)<\/sitemap>/gi : /<url>([\s\S]*?)<\/url>/gi;
  let m;
  while ((m = blockRe.exec(xml))) {
    const loc = /<loc>([\s\S]*?)<\/loc>/i.exec(m[1]);
    const lastmod = /<lastmod>([\s\S]*?)<\/lastmod>/i.exec(m[1]);
    if (loc) entries.push({ loc: xmlText(loc[1]), lastmod: lastmod ? xmlText(lastmod[1]) : undefined });
  }
  return { isIndex, entries };
}

async function loadSitemaps(startUrls, timeout, findings) {
  const urls = [];
  const files = [];
  const queue = [...new Set(startUrls)];
  const seen = new Set();
  while (queue.length && files.length < MAX_CHILD_SITEMAPS) {
    const sm = queue.shift();
    if (seen.has(sm)) continue;
    seen.add(sm);
    const r = await fetchChain(sm, { timeout, accept: 'application/xml,text/xml,*/*' });
    const file = { url: sm, status: r.status, redirects: r.chain.length - 1, entries: 0, isIndex: false, error: r.error };
    files.push(file);
    if (r.status !== 200 || !r.body) continue;
    let text;
    try {
      text = /\.gz$/i.test(sm) || (r.body[0] === 0x1f && r.body[1] === 0x8b) ? gunzipSync(r.body).toString('utf8') : r.body.toString('utf8');
    } catch (e) {
      file.error = `could not decompress: ${e instanceof Error ? e.message : e}`;
      continue;
    }
    const parsed = parseSitemap(text);
    file.isIndex = parsed.isIndex;
    file.entries = parsed.entries.length;
    if (parsed.isIndex) queue.push(...parsed.entries.map((e) => e.loc));
    else urls.push(...parsed.entries);
  }
  if (queue.length) findings.push({ level: 'info', area: 'sitemap', message: `Stopped after ${MAX_CHILD_SITEMAPS} sitemap files; ${queue.length} more not read.` });
  return { urls, files };
}

// ---------------------------------------------------------------------------
// Page analysis
// ---------------------------------------------------------------------------

export function analyseHtml(html) {
  const headEnd = html.search(/<\/head\s*>/i);
  const head = headEnd === -1 ? html : html.slice(0, headEnd);
  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(head);
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => parseAttributes(m[0]));
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => parseAttributes(m[0]));
  const metaContent = (name) => metas.filter((a) => (a.name ?? '').toLowerCase() === name).map((a) => a.content ?? '');
  const canonicals = links.filter((a) => (a.rel ?? '').toLowerCase().split(/\s+/).includes('canonical')).map((a) => a.href);
  const markdownAlt = links.find((a) => (a.rel ?? '').toLowerCase().split(/\s+/).includes('alternate') && (a.type ?? '').toLowerCase() === 'text/markdown');
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)].map((m) => clean(m[1].replace(/<[^>]+>/g, ' ')));
  return {
    title: titleMatch ? clean(titleMatch[1]) : undefined,
    description: metaContent('description')[0] !== undefined ? clean(metaContent('description')[0]) : undefined,
    robots: [...new Set([...metaContent('robots'), ...metaContent('googlebot')].flatMap((s) => s.toLowerCase().split(',')).map((s) => s.trim()).filter(Boolean))].join(', ') || undefined,
    canonicals,
    markdownAlternate: markdownAlt?.href,
    h1s,
    verification: {
      google: metaContent('google-site-verification').length > 0,
      bing: metaContent('msvalidate.01').length > 0,
    },
  };
}

async function checkPage(url, ctx) {
  const r = await fetchChain(url, { timeout: ctx.timeout });
  const page = {
    url,
    status: r.status,
    finalUrl: r.finalUrl,
    redirects: r.chain.length - 1,
    redirectChain: r.chain.map((h) => `${h.status} ${h.url}`),
    error: r.error,
    issues: [],
  };
  if (r.error) {
    page.issues.push({ level: 'fail', message: `fetch failed: ${r.error}` });
    return page;
  }
  const xRobots = r.headers.get('x-robots-tag');
  page.xRobotsTag = xRobots ?? undefined;
  page.contentType = r.headers.get('content-type') ?? undefined;
  page.bytes = r.bytes;
  if (page.redirects > 0) page.issues.push({ level: 'warn', message: `listed URL redirects (${page.redirects} hop${page.redirects > 1 ? 's' : ''}) to ${r.finalUrl}; list the final URL instead` });
  if (r.status !== 200) {
    page.issues.push({ level: 'fail', message: `final status ${r.status}` });
    return page;
  }
  if (!/html/i.test(page.contentType ?? '')) {
    page.issues.push({ level: 'info', message: `not HTML (${page.contentType ?? 'no content-type'}); page checks skipped` });
    return page;
  }
  const html = r.body.toString('utf8');
  const a = analyseHtml(html);
  Object.assign(page, {
    title: a.title,
    titleLength: a.title ? charLength(a.title) : 0,
    description: a.description,
    descriptionLength: a.description ? charLength(a.description) : 0,
    metaRobots: a.robots,
    canonical: a.canonicals[0],
    h1Count: a.h1s.length,
    markdownAlternate: a.markdownAlternate,
    verification: a.verification,
  });
  const noindex = /noindex|none/.test(`${a.robots ?? ''} ${xRobots ?? ''}`.toLowerCase());
  page.noindex = noindex;
  if (noindex && ctx.inSitemap) page.issues.push({ level: 'fail', message: 'noindex page is listed in the sitemap' });
  if (!a.title) page.issues.push({ level: 'fail', message: 'missing <title>' });
  else if (page.titleLength > 60) page.issues.push({ level: 'warn', message: `title is ${page.titleLength} characters (house limit 60)` });
  else if (page.titleLength < 15) page.issues.push({ level: 'warn', message: `title is only ${page.titleLength} characters` });
  if (a.description === undefined) page.issues.push({ level: 'warn', message: 'missing meta description' });
  else if (page.descriptionLength < 50 || page.descriptionLength > 160)
    page.issues.push({ level: 'warn', message: `meta description is ${page.descriptionLength} characters (house range 50 to 160)` });
  if (a.canonicals.length === 0) page.issues.push({ level: 'warn', message: 'no rel=canonical in the HTML head' });
  else if (a.canonicals.length > 1) page.issues.push({ level: 'fail', message: `${a.canonicals.length} canonical tags` });
  else {
    const abs = (() => {
      try {
        return new URL(a.canonicals[0], r.finalUrl).toString();
      } catch {
        return a.canonicals[0];
      }
    })();
    page.canonical = abs;
    if (normaliseUrl(abs) !== normaliseUrl(r.finalUrl)) page.issues.push({ level: ctx.inSitemap ? 'fail' : 'warn', message: `canonical points elsewhere: ${abs}` });
    if (ctx.origin && new URL(abs).origin !== ctx.origin) page.issues.push({ level: 'fail', message: `canonical uses a different origin (${new URL(abs).origin}) from the site (${ctx.origin})` });
  }
  if (a.h1s.length !== 1) page.issues.push({ level: 'warn', message: `${a.h1s.length} <h1> elements (expected 1)` });
  if (page.bytes > HTML_LIMIT_BYTES) page.issues.push({ level: 'fail', message: `HTML is ${(page.bytes / 1024 / 1024).toFixed(2)} MB; Googlebot reportedly indexes only the first 2MB` });
  else if (page.bytes > HTML_LIMIT_BYTES / 2) page.issues.push({ level: 'warn', message: `HTML is ${(page.bytes / 1024).toFixed(0)} KB (over half the reported 2MB fetch limit)` });

  const blocks = extractJsonLdBlocks(html);
  const types = new Map();
  let errors = 0;
  let warnings = 0;
  const jsonLdIssues = [];
  for (const b of blocks) {
    if (!b.ok) {
      errors++;
      jsonLdIssues.push(`block ${b.index + 1}: JSON parse error: ${b.error}`);
      continue;
    }
    collectTypes(b.data, types);
    for (const i of validateJsonLd(b.data, { currency: ctx.currency })) {
      if (i.severity === 'error') {
        errors++;
        jsonLdIssues.push(`block ${b.index + 1} ${i.path}: ${i.message}`);
      } else if (i.severity === 'warning') warnings++;
    }
  }
  warnings += checkIdGraph(blocks.filter((b) => b.ok).map((b) => b.data)).length;
  page.jsonLd = { blocks: blocks.length, types: Object.fromEntries(types), errors, warnings, errorSamples: jsonLdIssues.slice(0, 5) };
  if (errors) page.issues.push({ level: 'warn', message: `JSON-LD: ${errors} error(s), e.g. ${jsonLdIssues[0]}` });
  if (ctx.robots) {
    const path = new URL(r.finalUrl).pathname + new URL(r.finalUrl).search;
    const g = isAllowed(ctx.robots, 'Googlebot', path);
    if (!g.allowed && ctx.inSitemap) page.issues.push({ level: 'fail', message: `listed in the sitemap but blocked for Googlebot by "${g.rule}"` });
  }
  return page;
}

// ---------------------------------------------------------------------------
// llms.txt
// ---------------------------------------------------------------------------

async function checkLlms(origin, file, timeout, sampleLinks) {
  const r = await fetchChain(`${origin}/${file}`, { timeout, accept: 'text/plain,text/markdown,*/*' });
  const out = { url: `${origin}/${file}`, status: r.status, contentType: r.headers.get('content-type') ?? undefined, redirects: r.chain.length - 1, issues: [] };
  if (r.status !== 200 || !r.body) return out;
  const text = r.body.toString('utf8');
  out.bytes = r.bytes;
  const lines = text.split(/\r?\n/);
  const first = lines.find((l) => l.trim());
  out.hasH1 = Boolean(first && /^# \S/.test(first));
  out.hasBlockquote = lines.some((l) => /^> \S/.test(l));
  out.sections = lines.filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim());
  const links = [...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[2]);
  out.linkCount = links.length;
  if (/html/i.test(out.contentType ?? '')) out.issues.push({ level: 'warn', message: `${file} served as ${out.contentType}; use text/plain or text/markdown` });
  if (!out.hasH1) out.issues.push({ level: 'warn', message: `${file} does not start with a "# Title" line` });
  if (file === 'llms.txt' && !out.hasBlockquote) out.issues.push({ level: 'info', message: 'llms.txt has no "> summary" blockquote (the format expects one)' });
  if (sampleLinks && links.length) {
    const sample = sampleEvenly([...new Set(links)], 5);
    out.linkSample = await pool(sample, CONCURRENCY, async (u) => {
      const lr = await fetchChain(u, { timeout, readBody: false });
      return { url: u, status: lr.status, redirects: lr.chain.length - 1 };
    });
    for (const l of out.linkSample) {
      if (l.status !== 200) out.issues.push({ level: 'warn', message: `link ${l.url} returns ${l.status || l.status === 0 ? l.status : '?'}` });
      else if (l.redirects > 0) out.issues.push({ level: 'info', message: `link ${l.url} redirects; link the final URL` });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main check
// ---------------------------------------------------------------------------

export async function checkSite({ url, sample = 20, indexnowKey, timeout = 20000, currency }) {
  const findings = [];
  const add = (level, area, message) => findings.push({ level, area, message });
  const report = { checkedAt: new Date().toISOString(), input: url, userAgent: USER_AGENT, findings };

  // 1. Canonical origin and redirects
  const home = await fetchChain(url, { timeout });
  if (home.error || home.status === 0) {
    report.fatal = `Could not reach ${url}: ${home.error ?? 'no response'}`;
    return report;
  }
  const origin = new URL(home.finalUrl).origin;
  const host = new URL(origin).host;
  report.origin = origin;
  report.homeRedirects = home.chain.map((h) => `${h.status} ${h.url}`);
  if (home.status !== 200) add('fail', 'host', `Home page returns ${home.status}`);
  if (home.chain.length > 2) add('warn', 'host', `Home page takes ${home.chain.length - 1} redirects to reach ${origin}`);

  const variants = [];
  const bareHost = host.replace(/^www\./, '');
  const altHost = host.startsWith('www.') ? bareHost : `www.${host}`;
  for (const v of [`https://${altHost}/`, `http://${host}/`, `http://${altHost}/`]) {
    const r = await fetchChain(v, { timeout, readBody: false });
    const first = r.chain[0];
    const entry = { from: v, chain: r.chain.map((h) => `${h.status} ${h.url}`), finalUrl: r.finalUrl, error: r.error };
    variants.push(entry);
    if (r.error) {
      add(v.startsWith(`https://${altHost}`) ? 'warn' : 'info', 'host', `${v} did not respond (${r.error}). If people type this address, add DNS and a redirect.`);
      continue;
    }
    if (new URL(r.finalUrl).origin !== origin) add('fail', 'host', `${v} ends at ${r.finalUrl}, not the canonical origin ${origin}`);
    else if (first && (first.status === 302 || first.status === 307)) add('warn', 'host', `${v} uses a temporary ${first.status} redirect; use 301 or 308`);
    if (r.chain.length > 3) add('warn', 'host', `${v} takes ${r.chain.length - 1} redirects`);
  }
  report.hostVariants = variants;

  const homeAnalysis = home.body ? analyseHtml(home.body.toString('utf8')) : undefined;
  report.homeLinkHeader = home.headers.get('link') ?? undefined;

  // 2. robots.txt
  const rr = await fetchChain(`${origin}/robots.txt`, { timeout, accept: 'text/plain,*/*' });
  let robots;
  const robotsReport = { url: `${origin}/robots.txt`, status: rr.status, redirects: rr.chain.length - 1 };
  report.robots = robotsReport;
  if (rr.status === 200 && rr.body) {
    const text = rr.body.toString('utf8');
    robots = parseRobots(text);
    robotsReport.groups = robots.groups.length;
    robotsReport.sitemaps = robots.sitemaps;
    const extras = robots.groups.flatMap((g) => g.extras.map((e) => ({ ...e, agents: g.agents.join(', ') }))).concat(robots.other.map((e) => ({ ...e, agents: '(global)' })));
    robotsReport.contentSignal = extras.filter((e) => /^content-signal$/i.test(e.key)).map((e) => `${e.agents}: ${e.value}`);
    robotsReport.contentUsage = extras.filter((e) => /^content-usage$/i.test(e.key)).map((e) => `${e.agents}: ${e.value}`);
    robotsReport.bots = BOTS.map((b) => {
      const res = isAllowed(robots, b.token, '/');
      const explicit = res.group !== '*' && res.group !== 'none';
      return { ...b, allowedRoot: res.allowed, rule: res.rule, group: explicit ? 'own group' : res.group };
    });
    const retired = robots.groups.flatMap((g) => g.agents).filter((a) => RETIRED_TOKENS.some((t) => t.toLowerCase() === a.toLowerCase()));
    if (retired.length) add('info', 'robots', `robots.txt names retired tokens (${[...new Set(retired)].join(', ')}); Anthropic's current docs list ClaudeBot, Claude-User and Claude-SearchBot instead`);
    for (const b of robotsReport.bots) {
      if (b.allowedRoot) continue;
      if (b.token === 'Googlebot' || b.token === 'Bingbot') add('fail', 'robots', `${b.token} is blocked from / (${b.rule})`);
      else if (b.category === 'search' || b.category === 'user') add('warn', 'robots', `${b.token} (${b.owner}, ${b.category}) is blocked from /; the site cannot appear in its answers`);
      else if (b.token === 'Google-Extended') add('warn', 'robots', 'Google-Extended is blocked: this opts out of Gemini training AND Gemini grounding. Google Search is unaffected. Confirm this was deliberate.');
    }
    const trainingAllowed = robotsReport.bots.filter((b) => b.category === 'training' && b.allowedRoot).map((b) => b.token);
    const signals = robotsReport.contentSignal.join(' ').toLowerCase();
    if (/ai-train\s*=\s*no/.test(signals) && trainingAllowed.some((t) => t === 'GPTBot' || t === 'ClaudeBot'))
      add('warn', 'robots', `Content-Signal says ai-train=no but ${trainingAllowed.join(', ')} are allowed; make the file consistent`);
    if (robotsReport.contentSignal.length === 0) add('info', 'robots', 'No Content-Signal line. Optional: it states search / ai-input / ai-train preferences (Cloudflare syntax, no formal standing).');
    if (robots.sitemaps.length === 0) add('warn', 'robots', 'robots.txt has no Sitemap: line');
    const explicitAi = robotsReport.bots.filter((b) => b.group === 'own group').length;
    if (explicitAi === 0) add('info', 'robots', 'No AI crawler has its own group; every bot follows the * rules. Explicit groups make the choice visible.');
  } else {
    add(rr.status === 404 ? 'warn' : 'fail', 'robots', `robots.txt returned ${rr.status || rr.error}`);
  }

  // 3. Sitemap
  const sitemapStarts = robots?.sitemaps.length ? robots.sitemaps : [`${origin}/sitemap.xml`];
  const sm = await loadSitemaps(sitemapStarts, timeout, findings);
  const smReport = { files: sm.files, urlCount: sm.urls.length };
  report.sitemap = smReport;
  for (const f of sm.files) {
    if (f.status !== 200) add('fail', 'sitemap', `${f.url} returned ${f.status || f.error}`);
    if (f.redirects > 0) add('warn', 'sitemap', `${f.url} redirects; reference the final URL in robots.txt`);
    if (new URL(f.url).origin !== origin) add('warn', 'sitemap', `sitemap ${f.url} is on a different origin from ${origin}`);
  }
  if (sm.urls.length) {
    const offOrigin = sm.urls.filter((u) => {
      try {
        return new URL(u.loc).origin !== origin;
      } catch {
        return true;
      }
    });
    if (offOrigin.length) add('fail', 'sitemap', `${offOrigin.length} sitemap URL(s) are not on ${origin}, e.g. ${offOrigin[0].loc}`);
    const withLastmod = sm.urls.filter((u) => u.lastmod);
    smReport.lastmodShare = Math.round((withLastmod.length / sm.urls.length) * 100);
    const counts = new Map();
    for (const u of withLastmod) counts.set(u.lastmod, (counts.get(u.lastmod) ?? 0) + 1);
    const [topValue, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
    smReport.distinctLastmod = counts.size;
    if (withLastmod.length >= 5 && topCount >= 5 && topCount / withLastmod.length >= 0.2)
      add('warn', 'sitemap', `${topCount} of ${withLastmod.length} lastmod values are identical (${topValue}); this usually means build or request time, not the real content date`);
    const future = withLastmod.filter((u) => Date.parse(u.lastmod) > Date.now() + 36 * 3600 * 1000);
    if (future.length) add('warn', 'sitemap', `${future.length} lastmod value(s) are in the future`);
    const invalid = withLastmod.filter((u) => Number.isNaN(Date.parse(u.lastmod)));
    if (invalid.length) add('fail', 'sitemap', `${invalid.length} lastmod value(s) are not valid W3C dates, e.g. ${invalid[0].lastmod}`);
    if (withLastmod.length === 0) add('info', 'sitemap', 'No lastmod values. Add them from real content dates (never the build time).');
    const dupes = sm.urls.length - new Set(sm.urls.map((u) => u.loc)).size;
    if (dupes) add('warn', 'sitemap', `${dupes} duplicate URL(s) in the sitemap`);
  } else if (sm.files.some((f) => f.status === 200)) {
    add('fail', 'sitemap', 'sitemap has no URLs');
  }

  // 4. Sampled pages
  const homeUrl = `${origin}/`;
  const listed = sm.urls.map((u) => u.loc);
  const homeListed = listed.some((u) => normaliseUrl(u) === normaliseUrl(homeUrl));
  const pageUrls = sampleEvenly(listed.filter((u) => !/\.(txt|xml|pdf|json|md)$/i.test(u) && normaliseUrl(u) !== normaliseUrl(homeUrl)), sample);
  const ctx = { timeout, robots, origin, currency, inSitemap: true };
  report.pages = await pool(pageUrls, CONCURRENCY, (u) => checkPage(u, ctx));
  report.homePage = await checkPage(homeUrl, { ...ctx, inSitemap: homeListed });
  if (sm.urls.length && !homeListed) add('warn', 'sitemap', 'The home page is not listed in the sitemap');
  for (const p of [report.homePage, ...report.pages]) for (const i of p.issues) if (i.level !== 'info') add(i.level, 'page', `${p.url}: ${i.message}`);

  // 5. Verification tags (home page only; DNS verification leaves no trace in HTML)
  if (homeAnalysis) report.verificationMeta = homeAnalysis.verification;

  // 6. llms.txt and llms-full.txt
  report.llms = await checkLlms(origin, 'llms.txt', timeout, true);
  report.llmsFull = await checkLlms(origin, 'llms-full.txt', timeout, false);
  for (const l of [report.llms, report.llmsFull]) {
    if (l.status !== 200) add('info', 'llms', `${l.url} returned ${l.status}. Optional file; no major AI vendor has said it reads third-party llms.txt.`);
    for (const i of l.issues) add(i.level, 'llms', i.message);
  }
  if (report.homeLinkHeader && /describedby/i.test(report.homeLinkHeader)) report.linkHeaderAdvertisesLlms = true;

  // 7. Markdown mirror
  const mdHref = report.homePage.markdownAlternate;
  const mdUrl = mdHref ? new URL(mdHref, origin).toString() : `${origin}/index.md`;
  const md = await fetchChain(mdUrl, { timeout, accept: 'text/markdown,text/plain;q=0.9,*/*;q=0.1' });
  const neg = await fetchChain(`${origin}/`, { timeout, readBody: false, accept: 'text/markdown' });
  report.markdown = {
    advertised: Boolean(mdHref),
    url: mdUrl,
    status: md.status,
    contentType: md.headers.get('content-type') ?? undefined,
    acceptNegotiation: neg.headers.get('content-type') ?? undefined,
    vary: neg.headers.get('vary') ?? undefined,
  };
  if (mdHref && md.status !== 200) add('warn', 'markdown', `HTML advertises ${mdUrl} as text/markdown but it returns ${md.status}`);
  if (/markdown/i.test(report.markdown.acceptNegotiation ?? '') && !/accept/i.test(report.markdown.vary ?? ''))
    add('warn', 'markdown', 'The home page returns markdown for Accept: text/markdown without "Vary: Accept"; caches may serve markdown to browsers');

  // 8. IndexNow key file
  if (indexnowKey) {
    const valid = /^[a-zA-Z0-9-]{8,128}$/.test(indexnowKey);
    const kr = await fetchChain(`${origin}/${indexnowKey}.txt`, { timeout, accept: 'text/plain,*/*' });
    const body = kr.body ? kr.body.toString('utf8').trim() : '';
    report.indexnow = { keyFormatValid: valid, url: `${origin}/${indexnowKey}.txt`, status: kr.status, redirects: kr.chain.length - 1, matches: body === indexnowKey };
    if (!valid) add('fail', 'indexnow', 'IndexNow key must be 8 to 128 characters of a-z, A-Z, 0-9 and "-"');
    if (kr.status !== 200 || body !== indexnowKey) add('fail', 'indexnow', `${origin}/${indexnowKey}.txt does not serve the key (HTTP ${kr.status})`);
    if (kr.chain.length > 1) add('warn', 'indexnow', 'The key file URL redirects; serve it directly on the canonical host');
  }

  report.summary = {
    fail: findings.filter((f) => f.level === 'fail').length,
    warn: findings.filter((f) => f.level === 'warn').length,
    info: findings.filter((f) => f.level === 'info').length,
  };
  return report;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');

export function toMarkdown(r) {
  if (r.fatal) return `# Site check\n\n- FAIL: ${r.fatal}\n`;
  const L = [];
  L.push(`# Site check: ${r.origin}`, '', `- Checked: ${r.checkedAt} (User-Agent: ${r.userAgent})`, `- Result: ${r.summary.fail} fail, ${r.summary.warn} warn, ${r.summary.info} info`, '');
  L.push('## Findings', '');
  const order = { fail: 0, warn: 1, info: 2 };
  const sorted = [...r.findings].sort((a, b) => order[a.level] - order[b.level]);
  if (!sorted.length) L.push('- No findings.');
  for (const f of sorted) L.push(`- ${f.level.toUpperCase()} [${f.area}] ${f.message}`);
  L.push('', '## Host and redirects', '', `- Canonical origin: ${r.origin}`, `- Input chain: ${r.homeRedirects.join(' -> ')}`);
  for (const v of r.hostVariants) L.push(`- ${v.from}: ${v.error ? `no response (${v.error})` : v.chain.join(' -> ')}`);
  L.push('', '## robots.txt', '', `- ${r.robots.url}: HTTP ${r.robots.status}`);
  if (r.robots.bots) {
    L.push(`- Sitemap lines: ${r.robots.sitemaps.length ? r.robots.sitemaps.join(', ') : 'none'}`);
    L.push(`- Content-Signal: ${r.robots.contentSignal.length ? r.robots.contentSignal.join('; ') : 'none'}`);
    L.push(`- Content-Usage: ${r.robots.contentUsage.length ? r.robots.contentUsage.join('; ') : 'none'}`, '');
    L.push('| Bot | Owner | Type | / allowed | Rule | Group |', '|---|---|---|---|---|---|');
    for (const b of r.robots.bots) L.push(`| ${b.token} | ${b.owner} | ${b.category} | ${b.allowedRoot ? 'yes' : 'NO'} | ${esc(b.rule)} | ${b.group} |`);
    L.push('', 'Types: search = indexes for search or AI answers; user = fetches when a person asks; training = model training; control = robots.txt token only.');
  }
  L.push('', '## Sitemap', '');
  for (const f of r.sitemap.files) L.push(`- ${f.url}: HTTP ${f.status}${f.isIndex ? ' (index)' : ''}, ${f.entries} entries${f.error ? `, ${f.error}` : ''}`);
  L.push(`- URLs: ${r.sitemap.urlCount}${r.sitemap.lastmodShare !== undefined ? `, with lastmod: ${r.sitemap.lastmodShare}%, distinct lastmod values: ${r.sitemap.distinctLastmod}` : ''}`);
  L.push('', `## Pages (home + ${r.pages.length} sampled from the sitemap)`, '');
  L.push('| URL | Status | Title | Desc | H1 | Canonical | Robots | JSON-LD types | LD errors | KB |', '|---|---|---|---|---|---|---|---|---|---|');
  const homeTypes = new Set(Object.keys(r.homePage.jsonLd?.types ?? {}));
  for (const p of [r.homePage, ...r.pages]) {
    const path = (() => {
      try {
        const u = new URL(p.url);
        return u.pathname + u.search;
      } catch {
        return p.url;
      }
    })();
    const canon = p.canonical === undefined ? 'none' : normaliseUrl(p.canonical) === normaliseUrl(p.finalUrl) ? 'self' : 'other';
    const own = p.jsonLd ? Object.keys(p.jsonLd.types).filter((t) => p === r.homePage || !homeTypes.has(t)) : [];
    const types = own.length > 6 ? `${own.slice(0, 6).join(', ')} +${own.length - 6}` : own.join(', ');
    L.push(`| ${esc(path)} | ${p.status}${p.redirects ? ` (${p.redirects} redir)` : ''} | ${p.titleLength ?? ''} | ${p.descriptionLength ?? ''} | ${p.h1Count ?? ''} | ${canon} | ${esc([p.metaRobots, p.xRobotsTag].filter(Boolean).join(' / ') || 'default')} | ${esc(types)} | ${p.jsonLd ? p.jsonLd.errors : ''} | ${p.bytes ? Math.round(p.bytes / 1024) : ''} |`);
  }
  L.push('', 'Title and description columns are character counts. JSON-LD types on other pages omit types already on the home page (usually the sitewide Organization and WebSite).', '', '## Verification meta tags (home page)', '');
  if (r.verificationMeta) L.push(`- google-site-verification: ${r.verificationMeta.google ? 'present' : 'absent'}`, `- msvalidate.01 (Bing): ${r.verificationMeta.bing ? 'present' : 'absent'}`, '- Absent is fine when the site is verified by DNS (preferred); this check cannot see DNS records.');
  L.push('', '## llms.txt and llms-full.txt', '');
  for (const l of [r.llms, r.llmsFull]) {
    L.push(`- ${l.url}: HTTP ${l.status}${l.contentType ? `, ${l.contentType}` : ''}${l.bytes !== undefined ? `, ${Math.round(l.bytes / 1024)} KB, H1: ${l.hasH1 ? 'yes' : 'no'}, blockquote: ${l.hasBlockquote ? 'yes' : 'no'}, links: ${l.linkCount}, sections: ${l.sections.length}` : ''}`);
    if (l.linkSample) for (const s of l.linkSample) L.push(`  - sample link ${s.url}: HTTP ${s.status}${s.redirects ? `, ${s.redirects} redirect(s)` : ''}`);
  }
  L.push(`- Home page Link header advertises llms.txt: ${r.linkHeaderAdvertisesLlms ? 'yes' : 'no'}`);
  L.push('', '## Markdown mirror', '', `- Advertised with rel=alternate type=text/markdown: ${r.markdown.advertised ? 'yes' : 'no'}`, `- ${r.markdown.url}: HTTP ${r.markdown.status}${r.markdown.contentType ? `, ${r.markdown.contentType}` : ''}`, `- Home page with Accept: text/markdown returns: ${r.markdown.acceptNegotiation ?? 'unknown'}${r.markdown.vary ? ` (Vary: ${r.markdown.vary})` : ''}`);
  if (r.indexnow) L.push('', '## IndexNow key file', '', `- ${r.indexnow.url}: HTTP ${r.indexnow.status}, key matches: ${r.indexnow.matches ? 'yes' : 'no'}, key format valid: ${r.indexnow.keyFormatValid ? 'yes' : 'no'}`);
  L.push('', '## Not checked here', '', '- JSON-LD or content added by client-side JavaScript (a plain fetch does not run scripts). Use the Rich Results Test or URL Inspection for the rendered page.', '- Search Console and Bing Webmaster verification by DNS, sitemap submission status and index coverage.', '- Core Web Vitals (use Lighthouse or field data).', '');
  return L.join('\n');
}

const HELP = `check-site.mjs: live technical SEO and AI-crawler check (Node 18+, no dependencies)

Usage:
  node check-site.mjs --url https://www.example.com [options]

Options:
  --url <url>              Site to check (required). Redirects are followed to find the canonical origin.
  --sitemap-sample <n>     Number of sitemap URLs to fetch and check (default 20)
  --indexnow-key <key>     Also verify https://<origin>/<key>.txt serves this IndexNow key
  --currency <CODE>        Expected currency for JSON-LD offers (for example GBP)
  --timeout <ms>           Per-request timeout (default 20000)
  --json                   Print JSON instead of a markdown report
  --help                   Show this help

All requests are read-only GETs with User-Agent "${USER_AGENT}",
at most ${CONCURRENCY} at a time. Exit code 1 when any FAIL finding exists, 2 on usage errors or an unreachable site.
`;

function parseArgs(argv) {
  const a = { url: undefined, sample: 20, json: false, indexnowKey: undefined, timeout: 20000, currency: undefined, help: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--help' || k === '-h') a.help = true;
    else if (k === '--url') a.url = argv[++i];
    else if (k === '--sitemap-sample') a.sample = Number(argv[++i]);
    else if (k === '--indexnow-key') a.indexnowKey = argv[++i];
    else if (k === '--currency') a.currency = String(argv[++i] ?? '').toUpperCase();
    else if (k === '--timeout') a.timeout = Number(argv[++i]);
    else if (k === '--json') a.json = true;
    else throw new Error(`Unknown argument ${k}`);
  }
  if (!a.help) {
    if (!a.url) throw new Error('--url is required');
    if (!/^https?:\/\//i.test(a.url)) a.url = `https://${a.url}`;
    if (!Number.isInteger(a.sample) || a.sample < 0) throw new Error('--sitemap-sample must be a whole number');
    if (!Number.isFinite(a.timeout) || a.timeout <= 0) throw new Error('--timeout must be a positive number');
  }
  return a;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    console.error('Run with --help for usage.');
    process.exit(2);
  }
  if (args.help) {
    console.log(HELP);
    return;
  }
  const report = await checkSite({ url: args.url, sample: args.sample, indexnowKey: args.indexnowKey, timeout: args.timeout, currency: args.currency });
  console.log(args.json ? JSON.stringify(report, null, 2) : toMarkdown(report));
  if (report.fatal) process.exit(2);
  process.exit(report.summary.fail > 0 ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.stack : String(e));
    process.exit(2);
  });
}
