#!/usr/bin/env node
/**
 * indexnow.mjs: submit changed URLs to IndexNow (Node 18+, zero dependencies, ESM).
 *
 *   node indexnow.mjs --host https://www.example.com --key <key> --url https://www.example.com/new-page
 *   node indexnow.mjs --host https://example.com --key <key> --urls-file pending.txt --dry-run
 *   node indexnow.mjs --host https://www.example.com --key <key> --sitemap --since 2026-11-01
 *
 * What it does, in order:
 *   1. Follows redirects from --host to find the canonical origin (apex vs www, http vs https).
 *   2. Checks that https://<origin>/<key>.txt serves the key (IndexNow verifies ownership this way).
 *   3. Collects URLs (--url, --urls-file, --sitemap), keeps only those on the same site, and rewrites
 *      them to the canonical origin, because IndexNow rejects URLs whose host differs from the key's host.
 *   4. POSTs them to the IndexNow endpoint in batches of up to 10,000 and accepts HTTP 200 or 202.
 *
 * --dry-run does steps 1 to 3 (read-only GETs) and prints the payload without sending it.
 * Exit codes: 0 success (or dry run), 1 submission or verification failed, 2 usage error.
 */
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

const USER_AGENT = 'aio-seo-check/0.1 (+https://github.com/metamindz/skills)';
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH = 10000; // IndexNow documentation: up to 10,000 URLs per POST.
const KEY_RE = /^[a-zA-Z0-9-]{8,128}$/; // IndexNow documentation: 8 to 128 characters, a-z A-Z 0-9 and "-".

const HELP = `indexnow.mjs: submit URLs to IndexNow (Node 18+, no dependencies)

Usage:
  node indexnow.mjs --host <url> --key <key> [sources] [options]

Sources (combine freely; duplicates are removed):
  --url <url>          A URL to submit (repeatable)
  --urls-file <path>   A file with URLs; the first http(s) URL on each line is used, so a
                       markdown list such as ".agents/aio-seo/indexing/log.md" works ("-" reads stdin)
  --sitemap            Every <loc> in the live sitemap(s) listed in robots.txt (or /sitemap.xml)
  --since <date>       With --sitemap: only URLs whose <lastmod> is on or after this date

Options:
  --host <url>         The site, e.g. https://www.example.com (required). Redirects are followed.
  --key <key>          The IndexNow key (required, or set INDEXNOW_KEY)
  --key-location <url> Key file URL if not https://<origin>/<key>.txt
  --endpoint <url>     IndexNow endpoint (default ${DEFAULT_ENDPOINT})
  --dry-run            Resolve, verify and print the payload; send nothing
  --json               Print a JSON result
  --help               Show this help

The key is public by design (it is served from the site). Google does not take part in IndexNow;
use Search Console for Google.
`;

function parseArgs(argv) {
  const a = { urls: [], files: [], sitemap: false, since: undefined, host: undefined, key: process.env.INDEXNOW_KEY, keyLocation: undefined, endpoint: DEFAULT_ENDPOINT, dryRun: false, json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const val = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${k} needs a value`);
      return v;
    };
    if (k === '--help' || k === '-h') a.help = true;
    else if (k === '--url') a.urls.push(val());
    else if (k === '--urls-file') a.files.push(val());
    else if (k === '--sitemap') a.sitemap = true;
    else if (k === '--since') a.since = val();
    else if (k === '--host') a.host = val();
    else if (k === '--key') a.key = val();
    else if (k === '--key-location') a.keyLocation = val();
    else if (k === '--endpoint') a.endpoint = val();
    else if (k === '--dry-run') a.dryRun = true;
    else if (k === '--json') a.json = true;
    else throw new Error(`Unknown argument ${k}`);
  }
  if (a.help) return a;
  if (!a.host) throw new Error('--host is required');
  if (!/^https?:\/\//i.test(a.host)) a.host = `https://${a.host}`;
  if (!a.key) throw new Error('--key is required (or set INDEXNOW_KEY)');
  if (!KEY_RE.test(a.key)) throw new Error('The key must be 8 to 128 characters: a-z, A-Z, 0-9 and "-"');
  if (!a.urls.length && !a.files.length && !a.sitemap) throw new Error('Give at least one source: --url, --urls-file or --sitemap');
  if (a.since && Number.isNaN(Date.parse(a.since))) throw new Error('--since must be a date such as 2026-11-01');
  return a;
}

async function get(url, accept = '*/*') {
  return fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: accept }, signal: AbortSignal.timeout(20000) });
}

/** Follow redirects from the given URL and return the origin it finally lands on. */
export async function resolveOrigin(start) {
  const res = await get(start, 'text/html,*/*');
  await res.body?.cancel().catch(() => {});
  return new URL(res.url).origin;
}

/** apex and www count as the same site; anything else is a different site. */
function sameSite(hostA, hostB) {
  const strip = (h) => h.toLowerCase().replace(/^www\./, '');
  return strip(hostA) === strip(hostB);
}

export function rewriteToOrigin(urls, origin) {
  const target = new URL(origin);
  const kept = [];
  const skipped = [];
  for (const raw of urls) {
    let u;
    try {
      u = new URL(raw);
    } catch {
      skipped.push({ url: raw, reason: 'not a valid URL' });
      continue;
    }
    if (!sameSite(u.host, target.host)) {
      skipped.push({ url: raw, reason: `different host (${u.host})` });
      continue;
    }
    kept.push(`${target.origin}${u.pathname}${u.search}`);
  }
  return { urls: [...new Set(kept)], skipped };
}

async function readUrlsFile(path) {
  const text = path === '-' ? await new Promise((resolve, reject) => {
    let d = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (d += c));
    process.stdin.on('end', () => resolve(d));
    process.stdin.on('error', reject);
  }) : await readFile(path, 'utf8');
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /https?:\/\/[^\s)<>\]"'`]+/.exec(line);
    if (m) out.push(m[0].replace(/[.,;:]+$/, ''));
  }
  return out;
}

async function sitemapUrls(origin, since) {
  const starts = [];
  try {
    const r = await get(`${origin}/robots.txt`, 'text/plain');
    if (r.ok) for (const m of (await r.text()).matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)) starts.push(m[1]);
  } catch {
    /* fall back below */
  }
  if (!starts.length) starts.push(`${origin}/sitemap.xml`);
  const queue = [...starts];
  const seen = new Set();
  const out = [];
  const sinceMs = since ? Date.parse(since) : undefined;
  while (queue.length && seen.size < 50) {
    const sm = queue.shift();
    if (seen.has(sm)) continue;
    seen.add(sm);
    const r = await get(sm, 'application/xml,text/xml,*/*');
    if (!r.ok) throw new Error(`${sm} returned HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const xml = buf[0] === 0x1f && buf[1] === 0x8b ? gunzipSync(buf).toString('utf8') : buf.toString('utf8');
    const isIndex = /<sitemapindex[\s>]/i.test(xml);
    for (const m of xml.matchAll(isIndex ? /<sitemap>([\s\S]*?)<\/sitemap>/gi : /<url>([\s\S]*?)<\/url>/gi)) {
      const loc = /<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/i.exec(m[1])?.[1]?.replace(/&amp;/g, '&').trim();
      if (!loc) continue;
      if (isIndex) {
        queue.push(loc);
        continue;
      }
      if (sinceMs !== undefined) {
        const lm = /<lastmod>\s*([^<]+?)\s*<\/lastmod>/i.exec(m[1])?.[1];
        if (!lm || Number.isNaN(Date.parse(lm)) || Date.parse(lm) < sinceMs) continue;
      }
      out.push(loc);
    }
  }
  return out;
}

export async function run(args) {
  const result = { dryRun: args.dryRun, endpoint: args.endpoint };
  const origin = await resolveOrigin(args.host);
  const host = new URL(origin).host;
  result.origin = origin;
  if (origin !== new URL(args.host).origin) result.note = `${args.host} redirects to ${origin}; URLs are submitted for ${host}`;

  const keyLocation = args.keyLocation ?? `${origin}/${args.key}.txt`;
  result.keyLocation = keyLocation;
  if (new URL(keyLocation).host !== host) throw Object.assign(new Error(`The key file must be on ${host}, not ${new URL(keyLocation).host}`), { code: 1 });
  const kr = await fetch(keyLocation, { redirect: 'manual', headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(20000) });
  const keyBody = (await kr.text()).trim();
  result.keyFile = { status: kr.status, matches: kr.status === 200 && keyBody === args.key };
  if (!result.keyFile.matches) {
    const msg = `${keyLocation} does not serve the key (HTTP ${kr.status}${kr.status === 200 ? ', body differs' : ''}). Deploy the key file first.`;
    if (!args.dryRun) throw Object.assign(new Error(msg), { code: 1 });
    result.warning = msg;
  }

  const collected = [...args.urls];
  for (const f of args.files) collected.push(...(await readUrlsFile(f)));
  if (args.sitemap) collected.push(...(await sitemapUrls(origin, args.since)));
  const { urls, skipped } = rewriteToOrigin(collected, origin);
  result.skipped = skipped;
  result.count = urls.length;
  if (!urls.length) {
    result.message = 'No URLs to submit.';
    return result;
  }

  const batches = [];
  for (let i = 0; i < urls.length; i += BATCH) batches.push(urls.slice(i, i + BATCH));
  result.batches = [];
  for (const urlList of batches) {
    const payload = { host, key: args.key, keyLocation, urlList };
    if (args.dryRun) {
      result.batches.push({ size: urlList.length, payload });
      continue;
    }
    const res = await fetch(args.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'User-Agent': USER_AGENT },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
    const text = await res.text().catch(() => '');
    // 200 = submitted; 202 = received, key validation pending. 400/403/422/429 are failures.
    const ok = res.status === 200 || res.status === 202;
    result.batches.push({ size: urlList.length, status: res.status, ok, body: text.slice(0, 500) });
    if (!ok) throw Object.assign(new Error(`IndexNow returned HTTP ${res.status}: ${text.slice(0, 300) || explainStatus(res.status)}`), { code: 1, result });
  }
  result.submitted = !args.dryRun;
  return result;
}

function explainStatus(s) {
  return {
    400: 'bad request (invalid format)',
    403: 'key not valid (key file missing or key not in the file)',
    422: 'URLs do not belong to the host, or the key does not match the protocol schema',
    429: 'too many requests (possible spam)',
  }[s] ?? 'unexpected status';
}

function print(result, json) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`Origin: ${result.origin}`);
  if (result.note) console.log(`Note: ${result.note}`);
  console.log(`Key file: ${result.keyLocation} (HTTP ${result.keyFile?.status}, ${result.keyFile?.matches ? 'key matches' : 'KEY NOT SERVED'})`);
  if (result.warning) console.log(`Warning: ${result.warning}`);
  for (const s of result.skipped ?? []) console.log(`Skipped: ${s.url} (${s.reason})`);
  if (result.message) console.log(result.message);
  for (const [i, b] of (result.batches ?? []).entries()) {
    if (result.dryRun) {
      console.log(`Dry run, batch ${i + 1}: would POST ${b.size} URL(s) to ${result.endpoint}`);
      console.log(JSON.stringify({ ...b.payload, urlList: b.payload.urlList.slice(0, 20) }, null, 2));
      if (b.size > 20) console.log(`... and ${b.size - 20} more`);
    } else {
      console.log(`Batch ${i + 1}: ${b.size} URL(s), HTTP ${b.status} ${b.status === 202 ? '(accepted, key validation pending)' : '(accepted)'}`);
    }
  }
  if (result.submitted) console.log(`Done: IndexNow accepted ${result.count} URL(s) for ${new URL(result.origin).host}.`);
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
  try {
    print(await run(args), args.json);
  } catch (e) {
    if (e?.result) print(e.result, args.json);
    console.error(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
