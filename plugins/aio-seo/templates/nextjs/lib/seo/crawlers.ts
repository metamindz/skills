/**
 * robots.txt rules, built from CRAWLER_POLICY (lib/seo/site.ts) and PRIVATE_PATHS (lib/seo/routes.ts).
 *
 * Every current AI crawler gets its own group, so the choice is visible in the file rather than implied by
 * `User-agent: *`. A crawler that matches its own group ignores the * group, so each group repeats the
 * private-path disallows. Retired tokens (anthropic-ai, Claude-Web) are deliberately absent.
 *
 * Crawler list and categories as recorded in the aio-seo knowledge base (sources: OpenAI, Anthropic,
 * Perplexity, Google and Apple crawler documentation; Cloudflare's AI crawler reference). Re-check them
 * when you touch this file: vendors add and retire tokens.
 */
import { CRAWLER_POLICY } from './site';
import { PRIVATE_PATHS } from './routes';

export type CrawlerCategory = 'search' | 'user' | 'training' | 'bulk' | 'control';

export interface Crawler {
  token: string;
  owner: string;
  category: CrawlerCategory;
  note: string;
}

export const AI_CRAWLERS: Crawler[] = [
  { token: 'OAI-SearchBot', owner: 'OpenAI', category: 'search', note: 'ChatGPT search results' },
  { token: 'Claude-SearchBot', owner: 'Anthropic', category: 'search', note: 'Claude search results' },
  { token: 'PerplexityBot', owner: 'Perplexity', category: 'search', note: 'Perplexity index; documented as not used for foundation-model training' },
  { token: 'DuckAssistBot', owner: 'DuckDuckGo', category: 'search', note: 'DuckDuckGo AI answers' },
  { token: 'ChatGPT-User', owner: 'OpenAI', category: 'user', note: 'Fetches a page when a ChatGPT user asks' },
  { token: 'Claude-User', owner: 'Anthropic', category: 'user', note: 'Fetches a page when a Claude user asks' },
  { token: 'Perplexity-User', owner: 'Perplexity', category: 'user', note: 'Documented as generally ignoring robots.txt' },
  { token: 'MistralAI-User', owner: 'Mistral', category: 'user', note: 'Fetches a page when a Le Chat user asks' },
  { token: 'GPTBot', owner: 'OpenAI', category: 'training', note: 'Model training' },
  { token: 'ClaudeBot', owner: 'Anthropic', category: 'training', note: 'Model training' },
  { token: 'CCBot', owner: 'Common Crawl', category: 'bulk', note: 'Open web crawl used by many model builders' },
  { token: 'Bytespider', owner: 'ByteDance', category: 'bulk', note: 'Bulk crawler, no referral path' },
  { token: 'meta-externalagent', owner: 'Meta', category: 'bulk', note: 'Model training' },
  { token: 'Amazonbot', owner: 'Amazon', category: 'bulk', note: 'Amazon crawler' },
  { token: 'Google-Extended', owner: 'Google', category: 'control', note: 'Gemini training AND grounding. Does not affect Google Search.' },
  { token: 'Applebot-Extended', owner: 'Apple', category: 'control', note: 'Apple model training. Does not affect Apple search.' },
];

export const RETIRED_TOKENS = ['anthropic-ai', 'Claude-Web'];

export interface RobotsRule {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  /** Non-standard lines (Content-Signal). Emitted by Next.js 16.3 and later; ignored by older versions. */
  other?: Record<string, string | string[]>;
}

export function isBlocked(c: Crawler, policy: typeof CRAWLER_POLICY = CRAWLER_POLICY): boolean {
  switch (c.category) {
    case 'search':
    case 'user':
      return false; // never blocked here: blocking removes the site from that assistant's answers
    case 'training':
      return policy.training === 'block';
    case 'bulk':
      return policy.bulk === 'block';
    case 'control':
      return c.token === 'Google-Extended' ? policy.googleExtended === 'block' : policy.applebotExtended === 'block';
  }
}

export function contentSignalLine(policy: typeof CRAWLER_POLICY = CRAWLER_POLICY): string | null {
  if (!policy.contentSignal) return null;
  const s = policy.contentSignal;
  return `search=${s.search}, ai-input=${s['ai-input']}, ai-train=${s['ai-train']}`;
}

/** Problems that make the file contradict itself. Tests require this to be empty. */
export function crawlerPolicyProblems(policy: typeof CRAWLER_POLICY = CRAWLER_POLICY): string[] {
  const problems: string[] = [];
  const s = policy.contentSignal;
  if (s?.['ai-train'] === 'no' && policy.training === 'allow') problems.push('Content-Signal says ai-train=no but training crawlers (GPTBot, ClaudeBot) are allowed.');
  if (s?.['ai-train'] === 'no' && policy.bulk === 'allow') problems.push('Content-Signal says ai-train=no but bulk crawlers (CCBot and others) are allowed.');
  if (s?.['ai-train'] === 'yes' && policy.training === 'block') problems.push('Content-Signal says ai-train=yes but training crawlers are blocked.');
  if (s?.['ai-input'] === 'no') problems.push('ai-input=no asks AI assistants not to use pages in answers; that defeats the purpose of this kit. Confirm it is intended, then remove this check.');
  return problems;
}

export function buildRobotsRules(policy: typeof CRAWLER_POLICY = CRAWLER_POLICY, privatePaths: string[] = PRIVATE_PATHS): RobotsRule[] {
  const signal = contentSignalLine(policy);
  const allowed = AI_CRAWLERS.filter((c) => !isBlocked(c, policy)).map((c) => c.token);
  const blocked = AI_CRAWLERS.filter((c) => isBlocked(c, policy)).map((c) => c.token);
  const rules: RobotsRule[] = [
    { userAgent: '*', allow: '/', disallow: privatePaths, ...(signal ? { other: { 'Content-Signal': signal } } : {}) },
  ];
  if (allowed.length) rules.push({ userAgent: allowed, allow: '/', disallow: privatePaths });
  if (blocked.length) rules.push({ userAgent: blocked, disallow: '/' });
  return rules;
}

/** RFC 9309 matching, for tests: the longest matching rule wins and allow wins a tie. */
export function robotsAllows(rules: RobotsRule[], token: string, path: string): boolean {
  const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
  const t = token.toLowerCase();
  const own = rules.filter((r) => list(r.userAgent).some((a) => a.toLowerCase() === t));
  const groups = own.length ? own : rules.filter((r) => list(r.userAgent).includes('*'));
  const matches = (pattern: string) => {
    if (!pattern) return false;
    const re = pattern.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${re}`).test(path);
  };
  const hits = groups.flatMap((g) => [
    ...list(g.allow).filter(matches).map((p) => ({ len: p.length, allow: true })),
    ...list(g.disallow).filter(matches).map((p) => ({ len: p.length, allow: false })),
  ]);
  if (!hits.length) return true;
  const longest = Math.max(...hits.map((h) => h.len));
  return hits.some((h) => h.len === longest && h.allow);
}
