#!/usr/bin/env node
// content-lint.mjs: mechanical checks for Markdown/MDX articles (blog posts, guides).
// Node 18+, ESM, zero dependencies. Part of the aio-seo plugin.
// Usage: node content-lint.mjs <file...> [--config .agents/aio-seo/config.json] [--json]

import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const HELP = `content-lint: mechanical checks for Markdown/MDX articles.

Usage:
  node content-lint.mjs <file...> [options]

Options:
  --config <path>     Settings file (default: .agents/aio-seo/config.json if it exists).
                      Reads blog.word_count, house_rules.banned_characters,
                      house_rules.banned_phrases and project.site_url.
  --json              Print results as JSON instead of a text report.
  --words <min,max>   Override the word-count range (default: config blog.word_count,
                      else 1500,3000). Use --words off to skip.
  --answer <min,max>  Answer-block word range (default 40,60).
  --min-internal <n>  Minimum internal links (default 3).
  --skip <a,b,...>    Skip checks by id. Ids: frontmatter, title, description, dates,
                      answer-block, question-h2, faq, sources, words, internal-links,
                      banned, https.
  --help              Show this help.

Checks (errors fail the file, warnings do not):
  frontmatter     Frontmatter block present.
  title           title present; SEO title (metaTitle/seoTitle/title) 30 to 60 characters.
  description     description/metaDescription/summary present, 50 to 160 characters.
  dates           Published date present (date/published/datePublished/pubDate), ISO
                  YYYY-MM-DD; updated date (updated/dateModified/lastmod) not before it.
  answer-block    First paragraph after frontmatter/H1 is 40 to 60 words.
  question-h2     At least one H2 phrased as a question.
  faq             If an FAQ section or frontmatter faqs exist: 3 to 6 questions, each ending "?".
  sources         If the text has percentages or "N times"/"Nx" figures: a Sources/References
                  section or footnote definitions exist.
  words           Body word count within range.
  internal-links  At least 3 internal links.
  banned          No banned characters or phrases from config house_rules.
  https           External links use https.

Exit code: 0 if every file passes, 1 if any file has an error, 2 on usage error.
`;

// ---------- args ----------
function parseArgs(argv) {
  const opts = { files: [], json: false, config: null, words: null, answer: [40, 60], minInternal: 3, skip: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) usage(`Missing value for ${a}`);
      return argv[++i];
    };
    if (a === '--help' || a === '-h') { process.stdout.write(HELP); process.exit(0); }
    else if (a === '--json') opts.json = true;
    else if (a === '--config') opts.config = next();
    else if (a === '--words') opts.words = next();
    else if (a === '--answer') opts.answer = parseRange(next(), '--answer');
    else if (a === '--min-internal') opts.minInternal = Number(next());
    else if (a === '--skip') next().split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => opts.skip.add(s));
    else if (a.startsWith('--')) usage(`Unknown option ${a}`);
    else opts.files.push(a);
  }
  if (!opts.files.length) usage('No files given.');
  return opts;
}

function parseRange(v, name) {
  const parts = String(v).split(',').map((n) => Number(n.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) usage(`${name} expects min,max`);
  return parts;
}

function usage(msg) {
  process.stderr.write(`content-lint: ${msg}\nRun with --help for usage.\n`);
  process.exit(2);
}

// ---------- config ----------
function loadConfig(path) {
  const candidate = path || '.agents/aio-seo/config.json';
  if (!existsSync(candidate)) {
    if (path) usage(`Config not found: ${path}`);
    return {};
  }
  try {
    return JSON.parse(readFileSync(candidate, 'utf8'));
  } catch (e) {
    usage(`Could not parse config ${candidate}: ${e.message}`);
  }
}

// ---------- minimal YAML frontmatter parser ----------
// Handles: key: value, quoted strings, >- / | blocks, inline [a, b] lists,
// "- item" lists, and lists of flat objects (faqs: - q: ... a: ...).
function parseFrontmatter(src) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { data: null, raw: '', bodyStart: 0, bodyLineOffset: 0 };
  const raw = m[1];
  const lines = raw.split(/\r?\n/);
  const data = {};
  let i = 0;
  const indentOf = (l) => l.length - l.trimStart().length;
  const scalar = (v) => {
    v = v.trim();
    if (v === '') return '';
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      const inner = v.slice(1, -1);
      return v.startsWith("'") ? inner.replace(/''/g, "'") : inner.replace(/\\"/g, '"');
    }
    if (v.startsWith('[') && v.endsWith(']')) {
      return v.slice(1, -1).split(',').map((s) => scalar(s)).filter((s) => s !== '');
    }
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v.replace(/\s+#.*$/, '');
  };
  const readBlock = (startIdx, baseIndent, folded) => {
    const out = [];
    let j = startIdx;
    while (j < lines.length && (lines[j].trim() === '' || indentOf(lines[j]) > baseIndent)) {
      out.push(lines[j].trim());
      j++;
    }
    const text = folded ? out.join(' ').replace(/\s+/g, ' ').trim() : out.join('\n').trim();
    return { text, next: j };
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    const km = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!km || indentOf(line) !== 0) { i++; continue; }
    const key = km[1];
    const rest = km[2];
    if (/^[>|][-+]?\s*$/.test(rest)) {
      const { text, next } = readBlock(i + 1, 0, rest.startsWith('>'));
      data[key] = text;
      i = next;
      continue;
    }
    if (rest.trim() !== '') { data[key] = scalar(rest); i++; continue; }
    // nested list or map
    i++;
    const items = [];
    let current = null;
    while (i < lines.length && (lines[i].trim() === '' || indentOf(lines[i]) > 0 || lines[i].startsWith('-'))) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      const t = l.trim();
      if (t.startsWith('- ')) {
        const itemBody = t.slice(2);
        const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(itemBody);
        if (kv) {
          current = {};
          items.push(current);
          if (/^[>|][-+]?\s*$/.test(kv[2])) {
            const { text, next } = readBlock(i + 1, indentOf(l) + 2, kv[2].startsWith('>'));
            current[kv[1]] = text; i = next; continue;
          }
          current[kv[1]] = scalar(kv[2]);
        } else {
          current = null;
          items.push(scalar(itemBody));
        }
        i++;
        continue;
      }
      const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(t);
      if (kv && current && typeof current === 'object') {
        if (/^[>|][-+]?\s*$/.test(kv[2])) {
          const { text, next } = readBlock(i + 1, indentOf(l), kv[2].startsWith('>'));
          current[kv[1]] = text; i = next; continue;
        }
        current[kv[1]] = scalar(kv[2]);
      } else if (kv && !current) {
        // nested map under key
        if (!items.length || Array.isArray(items[0])) items.push({});
        if (typeof items[items.length - 1] !== 'object') items.push({});
        items[items.length - 1][kv[1]] = scalar(kv[2]);
        current = items[items.length - 1];
      }
      i++;
    }
    // Lists stay arrays; a nested map is returned as a one-element array of its object.
    data[key] = items;
  }
  const bodyStart = m[0].length;
  const bodyLineOffset = m[0].split('\n').length - 1;
  return { data, raw, bodyStart, bodyLineOffset };
}

// ---------- body normalisation ----------
function looksLikeHtml(body, fm) {
  if (fm && String(fm.format || '').toLowerCase() === 'html') return true;
  const t = body.trimStart();
  return /^<(div|article|section|p|h[1-6])[\s>]/i.test(t) && !/^#{1,6}\s/m.test(body);
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&pound;/g, '£')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013');
}

// Convert an HTML body into pseudo-Markdown so the same checks apply.
function htmlToMarkdownish(html) {
  let s = html;
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, inner) => `\n\n${'#'.repeat(Number(n))} ${inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()}\n\n`);
  s = s.replace(/<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => `[${inner.replace(/<[^>]+>/g, '').trim()}](${href})`);
  s = s.replace(/<img\s[^>]*>/gi, '\n\n![image]()\n\n');
  s = s.replace(/<li[^>]*>/gi, '\n- ');
  s = s.replace(/<\/(p|div|ul|ol|table|tr|blockquote|section|article|figure)>/gi, '\n\n');
  s = s.replace(/<(p|div|ul|ol|table|tr|blockquote|section|article|figure)(\s[^>]*)?>/gi, '\n\n');
  s = s.replace(/<(th|td)[^>]*>/gi, ' | ');
  s = s.replace(/<strong>|<\/strong>|<b>|<\/b>/gi, '**');
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  s = s.split('\n').map((l) => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n');
  return s;
}

// Blank out fenced code and inline code, keeping line numbers stable.
function stripCode(md) {
  let out = md.replace(/^(```|~~~)[\s\S]*?^\1\s*$/gm, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length));
  return out;
}

function plainText(md) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\^[^\]]+\]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_~#>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text) {
  const t = plainText(text);
  if (!t) return 0;
  return t.split(/\s+/).filter((w) => /[A-Za-z0-9£$€]/.test(w)).length;
}

const FAQ_HEADING = /^(#{2})\s+(frequently asked questions|faqs?|common questions|questions and answers)\b/i;
const SOURCES_HEADING = /^#{2,3}\s+(sources|references|sources and notes|sources and methodology|notes and sources|bibliography|citations)\b/i;
const QUESTION_START = /^(what|how|why|when|where|which|who|whose|is|are|can|could|do|does|did|should|will|would|was|were|has|have)\b/i;

// ---------- the checks ----------
function lintFile(file, cfg, opts) {
  const results = [];
  const add = (id, level, message, line) => {
    if (!opts.skip.has(id)) results.push({ check: id, level, message, ...(line ? { line } : {}) });
  };
  const pass = (id, message) => { if (!opts.skip.has(id)) results.push({ check: id, level: 'pass', message }); };

  let src;
  try { src = readFileSync(file, 'utf8'); } catch (e) {
    return { file, ok: false, results: [{ check: 'read', level: 'error', message: e.message }] };
  }
  const fmParsed = parseFrontmatter(src);
  const fm = fmParsed.data;
  const lineOffset = fmParsed.bodyLineOffset;
  const rawBody = src.slice(fmParsed.bodyStart);
  const isHtml = looksLikeHtml(rawBody, fm);
  const bodyMd = isHtml ? htmlToMarkdownish(rawBody) : rawBody;
  const bodyNoCode = stripCode(bodyMd);
  const lines = bodyNoCode.split('\n');
  const lineNo = (idx) => (isHtml ? null : idx + 1 + lineOffset);

  // frontmatter
  if (!fm) add('frontmatter', 'error', 'No frontmatter block (--- ... ---) at the top of the file.');
  else pass('frontmatter', 'Frontmatter present.');
  const f = fm || {};

  // title
  const title = f.title;
  const seoTitle = f.metaTitle || f.seoTitle || f.meta_title || title;
  if (!title) add('title', 'error', 'Frontmatter has no title.');
  else if (seoTitle.length > 60) add('title', 'error', `SEO title is ${seoTitle.length} characters (max 60): "${seoTitle}". Add a shorter metaTitle/seoTitle or shorten the title.`);
  else if (seoTitle.length < 30) add('title', 'warn', `SEO title is ${seoTitle.length} characters; under 30 is usually too thin to describe the page.`);
  else pass('title', `SEO title ${seoTitle.length} characters.`);

  // description
  const descKey = ['description', 'metaDescription', 'meta_description', 'summary', 'excerpt'].find((k) => typeof f[k] === 'string' && f[k].trim());
  if (!descKey) add('description', 'error', 'No description (description, metaDescription or summary) in frontmatter.');
  else {
    const d = f[descKey].trim();
    if (d.length < 50 || d.length > 160) add('description', 'error', `${descKey} is ${d.length} characters (needs 50 to 160).`);
    else pass('description', `${descKey} ${d.length} characters.`);
  }

  // dates
  const pubKey = ['date', 'published', 'datePublished', 'pubDate', 'publishedAt'].find((k) => f[k]);
  const updKey = ['updated', 'dateModified', 'lastmod', 'updatedAt', 'modified'].find((k) => f[k]);
  const iso = (v) => /^\d{4}-\d{2}-\d{2}([T ][\d:.]+Z?)?$/.test(String(v)) && !Number.isNaN(Date.parse(String(v)));
  if (!pubKey) add('dates', 'error', 'No published date (date, published, datePublished or pubDate) in frontmatter.');
  else if (!iso(f[pubKey])) add('dates', 'error', `${pubKey} "${f[pubKey]}" is not an ISO date (YYYY-MM-DD).`);
  else {
    if (!updKey) add('dates', 'warn', 'No updated/dateModified field; a visible "last updated" date is recommended.');
    else if (!iso(f[updKey])) add('dates', 'error', `${updKey} "${f[updKey]}" is not an ISO date (YYYY-MM-DD).`);
    else if (String(f[updKey]).slice(0, 10) < String(f[pubKey]).slice(0, 10)) add('dates', 'error', `${updKey} (${f[updKey]}) is before ${pubKey} (${f[pubKey]}).`);
    else pass('dates', `${pubKey} ${String(f[pubKey]).slice(0, 10)}${updKey ? `, ${updKey} ${String(f[updKey]).slice(0, 10)}` : ''}.`);
  }

  // headings
  const headings = [];
  lines.forEach((l, idx) => {
    const hm = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(l);
    if (hm) headings.push({ level: hm[1].length, text: hm[2].trim(), idx });
  });

  // answer block: first prose paragraph after frontmatter (and after an H1 if one opens the body)
  {
    let idx = 0;
    let para = null;
    while (idx < lines.length) {
      const l = lines[idx].trim();
      const skippable =
        !l ||
        /^#{1,6}\s/.test(l) ||
        /^!\[/.test(l) ||
        /^(import|export)\s/.test(l) ||
        /^<[^>]*\/?>\s*$/.test(l) ||
        /^<\/?[A-Za-z][^>]*>?$/.test(l) ||
        /^\{\/\*.*\*\/\}$/.test(l) ||
        /^(-{3,}|\*{3,})$/.test(l) ||
        /^\[\^[^\]]+\]:/.test(l) ||
        /^\|/.test(l);
      if (skippable) {
        // skip multi-line JSX blocks such as <Figure ... /> spanning lines
        if (/^<[A-Za-z]/.test(l) && !/>\s*$/.test(l)) {
          while (idx < lines.length && !/>\s*$/.test(lines[idx])) idx++;
        }
        idx++;
        continue;
      }
      const start = idx;
      const buf = [];
      while (idx < lines.length && lines[idx].trim() && !/^#{1,6}\s/.test(lines[idx].trim())) { buf.push(lines[idx]); idx++; }
      const text = buf.join(' ');
      // Datelines and bylines ("Last updated: 14 October 2026", "By Jane Doe") are not the answer block.
      const plain = plainText(text);
      if (countWords(text) < 15 && /^(last updated|updated|published|posted|written by|reviewed by|by)\b/i.test(plain)) continue;
      para = { text, start };
      break;
    }
    if (!para) add('answer-block', 'error', 'No opening paragraph found after the frontmatter/H1.');
    else {
      const n = countWords(para.text);
      const [lo, hi] = opts.answer;
      if (n < lo || n > hi) add('answer-block', 'error', `Opening paragraph is ${n} words (answer block needs ${lo} to ${hi}). Lead with a self-contained direct answer.`, lineNo(para.start));
      else pass('answer-block', `Opening paragraph ${n} words.`);
    }
  }

  // question H2
  {
    const h2 = headings.filter((h) => h.level === 2 && !FAQ_HEADING.test(`## ${h.text}`) && !SOURCES_HEADING.test(`## ${h.text}`));
    const q = h2.filter((h) => h.text.replace(/[*_`]/g, '').trim().endsWith('?') || QUESTION_START.test(h.text.replace(/[*_`]/g, '').trim()));
    if (!h2.length) add('question-h2', 'error', 'No H2 headings found.');
    else if (!q.length) add('question-h2', 'error', `None of the ${h2.length} H2s is phrased as a question (end with "?" or start with what/how/why/when/which/...).`);
    else pass('question-h2', `${q.length} of ${h2.length} H2s phrased as questions.`);
  }

  // FAQ
  {
    let questions = null;
    let where = '';
    let faqLine = null;
    const fmFaqs = Array.isArray(f.faqs) ? f.faqs : Array.isArray(f.faq) ? f.faq : null;
    if (fmFaqs && fmFaqs.length) {
      questions = fmFaqs.map((x) => (typeof x === 'object' ? x.q || x.question || x.name || '' : String(x)));
      where = 'frontmatter faqs';
    }
    const faqHeading = headings.find((h) => h.level === 2 && FAQ_HEADING.test(`## ${h.text}`));
    if (faqHeading) {
      const end = headings.find((h) => h.idx > faqHeading.idx && h.level <= 2);
      const section = lines.slice(faqHeading.idx + 1, end ? end.idx : lines.length);
      const h3 = section.filter((l) => /^###\s+/.test(l.trim())).map((l) => l.trim().replace(/^###\s+/, '').replace(/[*_`]/g, '').trim());
      const bold = section.map((l) => /^\s*(?:[-*]\s+)?\*\*(.+?)\*\*/.exec(l)).filter(Boolean).map((m) => m[1].trim());
      const body = h3.length ? h3 : bold;
      if (!questions || body.length) { questions = body; where = h3.length ? 'FAQ section (H3s)' : 'FAQ section (bold questions)'; }
      faqLine = lineNo(faqHeading.idx);
    }
    if (questions === null) pass('faq', 'No FAQ section (optional).');
    else {
      const bad = questions.filter((q) => !q.trim().endsWith('?'));
      if (questions.length < 3 || questions.length > 6) add('faq', 'error', `${where} has ${questions.length} questions (needs 3 to 6).`, faqLine);
      else if (bad.length) add('faq', 'error', `${where}: ${bad.length} question(s) do not end with "?": ${bad.slice(0, 3).map((b) => `"${b}"`).join(', ')}`, faqLine);
      else pass('faq', `${where}: ${questions.length} questions.`);
    }
  }

  // sources
  {
    const proseOnly = lines.filter((l) => !/^\[\^[^\]]+\]:/.test(l.trim())).join('\n').replace(/\]\([^)]*\)/g, ']').replace(/https?:\/\/\S+/g, '');
    const statMatch = /\b\d+(?:[.,]\d+)?\s?(?:%|per ?cent\b)|\b\d+(?:\.\d+)?\s?(?:x|times)\b(?!\s*\d)/i.exec(proseOnly);
    if (!statMatch) pass('sources', 'No percentage or multiplier figures found.');
    else {
      const hasSection = headings.some((h) => SOURCES_HEADING.test(`${'#'.repeat(h.level)} ${h.text}`));
      const hasFootnotes = lines.some((l) => /^\[\^[^\]]+\]:/.test(l.trim()));
      if (hasSection || hasFootnotes) pass('sources', `Figures present (e.g. "${statMatch[0].trim()}"); ${hasSection ? 'Sources section' : 'footnotes'} found.`);
      else add('sources', 'error', `Figures present (e.g. "${statMatch[0].trim()}") but no Sources/References section or footnote definitions.`);
    }
  }

  // word count
  {
    let range = null;
    if (opts.words === 'off') range = null;
    else if (opts.words) range = parseRange(opts.words, '--words');
    else if (Array.isArray(cfg?.blog?.word_count) && cfg.blog.word_count.length === 2) range = cfg.blog.word_count.map(Number);
    else range = [1500, 3000];
    const textForCount = lines.filter((l) => !/^\[\^[^\]]+\]:/.test(l.trim())).join('\n');
    const n = countWords(textForCount);
    if (!range) pass('words', `${n} words (range check off).`);
    else if (n < range[0] || n > range[1]) add('words', 'error', `${n} words (needs ${range[0]} to ${range[1]}).`);
    else pass('words', `${n} words.`);
  }

  // links
  const siteHost = (() => {
    try { return cfg?.project?.site_url ? new URL(cfg.project.site_url).hostname.replace(/^www\./, '') : null; } catch { return null; }
  })();
  const links = [];
  const linkRe = /(!?)\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)|href\s*=\s*\{?\s*["'`]([^"'`]+)["'`]/g;
  const fullForLinks = isHtml ? rawBody : stripCode(rawBody);
  const fullLines = fullForLinks.split('\n');
  fullLines.forEach((l, idx) => {
    let m;
    linkRe.lastIndex = 0;
    while ((m = linkRe.exec(l))) {
      if (m[1] === '!') continue;
      links.push({ url: m[2] || m[3], line: isHtml ? null : idx + 1 + lineOffset });
    }
    // bare URLs in footnote definitions count as external links
    if (/^\[\^[^\]]+\]:/.test(l.trim())) {
      for (const u of l.match(/\bhttps?:\/\/[^\s)>\]]+/g) || []) links.push({ url: u, line: isHtml ? null : idx + 1 + lineOffset });
    }
  });
  {
    const internal = links.filter((x) => {
      if (/^(\/(?!\/)|\.\.?\/)/.test(x.url)) return true;
      if (siteHost && /^https?:\/\//.test(x.url)) {
        try { return new URL(x.url).hostname.replace(/^www\./, '') === siteHost; } catch { return false; }
      }
      return false;
    });
    const unique = new Set(internal.map((x) => x.url.split('#')[0]));
    if (unique.size < opts.minInternal) add('internal-links', 'error', `${unique.size} distinct internal link(s) (needs at least ${opts.minInternal}).`);
    else pass('internal-links', `${unique.size} distinct internal links.`);
  }
  {
    const seen = new Set();
    const insecure = links.filter((x) => /^http:\/\//i.test(x.url) && !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(x.url) && !seen.has(x.url) && seen.add(x.url));
    if (insecure.length) insecure.slice(0, 10).forEach((x) => add('https', 'error', `External link is not https: ${x.url}`, x.line));
    else pass('https', 'All external links use https.');
  }

  // banned characters and phrases (whole file, including frontmatter)
  {
    const hr = cfg?.house_rules || {};
    const chars = Array.isArray(hr.banned_characters) ? hr.banned_characters : ['\u2014', '\u2013'];
    const phrases = Array.isArray(hr.banned_phrases) ? hr.banned_phrases : [];
    const srcLines = src.split('\n');
    let found = 0;
    for (const ch of chars.filter(Boolean)) {
      srcLines.forEach((l, idx) => {
        if (l.includes(ch)) {
          found++;
          if (found <= 20) add('banned', 'error', `Banned character "${ch}" (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`, idx + 1);
        }
      });
    }
    for (const p of phrases.filter(Boolean)) {
      const re = phraseToRegex(p);
      srcLines.forEach((l, idx) => {
        const m = re.exec(l);
        if (m) {
          found++;
          if (found <= 20) add('banned', 'error', `Banned phrase "${p}" matched: "${m[0].trim().slice(0, 80)}"`, idx + 1);
        }
      });
    }
    if (found > 20) add('banned', 'error', `${found - 20} more banned character/phrase hits not shown.`);
    if (!found) pass('banned', 'No banned characters or phrases.');
  }

  const ok = !results.some((r) => r.level === 'error');
  return { file, ok, format: isHtml ? 'html' : 'markdown', results };
}

// "it's not X, it's Y" -> pattern with X/Y as wildcards; apostrophes match straight or curly.
function phraseToRegex(phrase) {
  const tokens = phrase.trim().split(/(\s+)/);
  const parts = tokens.map((t) => {
    if (/^\s+$/.test(t)) return '\\s+';
    const core = /^([A-Z])([,.;:!?]?)$/.exec(t);
    if (core) return `[^.!?\\n]{1,80}?${escapeRe(core[2])}`;
    return escapeRe(t).replace(/'/g, "['’]");
  });
  const startsWord = /^\w/.test(phrase.trim());
  const endsWord = /\w$/.test(phrase.trim()) && !/\b[A-Z]$/.test(phrase.trim());
  return new RegExp(`${startsWord ? '\\b' : ''}${parts.join('')}${endsWord ? '\\b' : ''}`, 'i');
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------- report ----------
function main() {
  const opts = parseArgs(process.argv.slice(2));
  const cfg = loadConfig(opts.config);
  const reports = opts.files.map((f) => lintFile(resolve(f), cfg, opts));
  if (opts.json) {
    process.stdout.write(JSON.stringify(reports, null, 2) + '\n');
  } else {
    for (const r of reports) {
      const errors = r.results.filter((x) => x.level === 'error');
      const warns = r.results.filter((x) => x.level === 'warn');
      process.stdout.write(`\n${r.ok ? 'PASS' : 'FAIL'}  ${r.file}${r.format === 'html' ? '  (HTML body, line numbers omitted)' : ''}\n`);
      for (const x of r.results) {
        const tag = x.level === 'error' ? '  x' : x.level === 'warn' ? '  !' : '  ok';
        process.stdout.write(`${tag} [${x.check}] ${x.message}${x.line ? ` (line ${x.line})` : ''}\n`);
      }
      process.stdout.write(`  ${errors.length} error(s), ${warns.length} warning(s)\n`);
    }
    const failed = reports.filter((r) => !r.ok).length;
    process.stdout.write(`\n${reports.length} file(s) checked, ${failed} failed.\n`);
  }
  process.exit(reports.every((r) => r.ok) ? 0 : 1);
}

main();
