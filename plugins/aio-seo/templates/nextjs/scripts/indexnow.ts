/**
 * Tell IndexNow (Bing, Yandex, Seznam, Naver, Yep and other participating engines) which public URLs
 * changed. Run by .github/workflows/indexnow.yml after a successful production deploy, or by hand:
 *
 *   npx tsx scripts/indexnow.ts --changed HEAD~1..HEAD      # URLs affected by the last commit
 *   npx tsx scripts/indexnow.ts --sitemap --since 2026-03-01 # sitemap URLs with lastmod on or after a date
 *   npx tsx scripts/indexnow.ts --url /pricing --url /blog/new-post
 *   add --dry-run to print the payload without sending
 *
 * The key is public by design: it is served from public/<key>.txt so engines can verify ownership.
 * Set INDEXNOW_KEY (repo variable or env). URLs are rewritten to the origin the site actually resolves to
 * (apex vs www), because IndexNow rejects URLs whose host differs from the key file's host.
 * Google does not take part in IndexNow; Search Console and the sitemap cover Google.
 */
import { execFileSync } from 'node:child_process';
import { pathsForChangedFiles } from '../lib/seo/routes';
import { PRODUCTION_URL } from '../lib/seo/site';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH = 10000;
const UA = 'aio-seo-indexnow/0.1 (+https://github.com/metamindz/skills)';

function fail(message: string): never {
  console.error(`\nIndexNow: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv: string[]) {
  const a = { urls: [] as string[], changed: undefined as string | undefined, sitemap: false, since: undefined as string | undefined, host: PRODUCTION_URL, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const next = () => argv[++i] ?? fail(`${k} needs a value`);
    if (k === '--url') a.urls.push(next());
    else if (k === '--changed') a.changed = next();
    else if (k === '--sitemap') a.sitemap = true;
    else if (k === '--since') a.since = next();
    else if (k === '--host') a.host = next();
    else if (k === '--dry-run') a.dryRun = true;
    else fail(`unknown argument ${k}`);
  }
  return a;
}

async function get(url: string, init: RequestInit = {}) {
  return fetch(url, { ...init, headers: { 'User-Agent': UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(20000) });
}

async function sitemapUrls(origin: string, since?: string): Promise<string[]> {
  const sinceMs = since ? Date.parse(since) : undefined;
  const queue = [`${origin}/sitemap.xml`];
  const out: string[] = [];
  const seen = new Set<string>();
  while (queue.length && seen.size < 50) {
    const sm = queue.shift()!;
    if (seen.has(sm)) continue;
    seen.add(sm);
    const res = await get(sm);
    if (!res.ok) fail(`${sm} returned HTTP ${res.status}`);
    const xml = await res.text();
    const isIndex = /<sitemapindex[\s>]/i.test(xml);
    for (const m of xml.matchAll(isIndex ? /<sitemap>([\s\S]*?)<\/sitemap>/gi : /<url>([\s\S]*?)<\/url>/gi)) {
      const loc = /<loc>\s*([\s\S]*?)\s*<\/loc>/i.exec(m[1]!)?.[1]?.replace(/&amp;/g, '&');
      if (!loc) continue;
      if (isIndex) {
        queue.push(loc);
        continue;
      }
      const lastmod = /<lastmod>\s*([^<]+?)\s*<\/lastmod>/i.exec(m[1]!)?.[1];
      if (sinceMs !== undefined && (!lastmod || Date.parse(lastmod) < sinceMs)) continue;
      out.push(loc);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) fail('set INDEXNOW_KEY to the 8 to 128 character key served at /<key>.txt');

  // Follow redirects once so host, key file and URLs all agree (apex vs www).
  const home = await get(args.host);
  const origin = new URL(home.url).origin;
  const host = new URL(origin).host;
  const keyLocation = `${origin}/${key}.txt`;

  // The key file ships with the deploy; allow a short delay for the CDN.
  let keyOk = false;
  for (let attempt = 0; attempt < 5 && !keyOk; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 10000));
    const res = await get(keyLocation, { redirect: 'manual' });
    keyOk = res.status === 200 && (await res.text()).trim() === key;
  }
  if (!keyOk && !args.dryRun) fail(`${keyLocation} is not serving the key. Add public/${key}.txt and deploy first.`);

  const collected: string[] = [...args.urls];
  if (args.changed) {
    const files = execFileSync('git', ['diff', '--name-only', args.changed], { encoding: 'utf8' }).split('\n').filter(Boolean);
    collected.push(...pathsForChangedFiles(files));
  }
  if (args.sitemap) collected.push(...(await sitemapUrls(origin, args.since)));

  const strip = (h: string) => h.replace(/^www\./, '');
  const urlList = [
    ...new Set(
      collected.flatMap((raw) => {
        const u = new URL(raw, origin);
        if (strip(u.host) !== strip(host)) return [];
        return [`${origin}${u.pathname}${u.search}`];
      }),
    ),
  ];
  if (!urlList.length) {
    console.log('IndexNow: no public URLs changed; nothing to submit.');
    return;
  }

  for (let i = 0; i < urlList.length; i += BATCH) {
    const payload = { host, key, keyLocation, urlList: urlList.slice(i, i + BATCH) };
    if (args.dryRun) {
      console.log(JSON.stringify(payload, null, 2));
      continue;
    }
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'User-Agent': UA },
      body: JSON.stringify(payload),
    });
    // 200 = submitted, 202 = received while the key is still being validated.
    if (res.status !== 200 && res.status !== 202) fail(`IndexNow returned HTTP ${res.status}: ${await res.text()}`);
    console.log(`IndexNow accepted ${payload.urlList.length} URL(s) for ${host} (HTTP ${res.status}).`);
  }
  for (const u of urlList) console.log(`  ${u}`);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
