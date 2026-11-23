#!/usr/bin/env node
// house-style.mjs: checks content files against the house rules in .agents/aio-seo/config.json.
// Zero dependencies, Node 18+.
//
// CLI:   node house-style.mjs <file...> [--config path] [--spelling] [--json]
// Hook:  node house-style.mjs --hook   (reads a Claude Code PostToolUse payload on stdin)
//
// In hook mode it only checks files that match house_rules.check_globs, stays silent when the
// project has no aio-seo config, and exits 2 with a report on stderr so Claude fixes the file.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, join, isAbsolute } from 'node:path';

const HELP = `house-style.mjs: check files against aio-seo house rules

Usage:
  node house-style.mjs <file...> [--config .agents/aio-seo/config.json] [--spelling] [--json]
  node house-style.mjs --hook            (Claude Code PostToolUse hook, payload on stdin)

Checks:
  - banned characters (default: em dash, en dash)
  - banned phrases; a phrase with X / Y placeholders becomes a pattern,
    e.g. "it's not X, it's Y" also matches "it isn't speed, it's focus"
  - --spelling: advisory list of common American spellings (CLI only)

Skips fenced code blocks, inline code, URLs and frontmatter keys.
Exit codes: 0 clean, 1 violations (CLI), 2 violations (hook), 3 usage error.`;

const DEFAULT_RULES = {
  banned_characters: ['\u2014', '\u2013'],
  banned_phrases: ["it's not X, it's Y", "here's the thing", "let's be honest", "in today's fast-paced world"],
  check_globs: ['content/**/*.md', 'content/**/*.mdx'],
  spelling: 'British English',
};

const AMERICANISMS = [
  ['optimize', 'optimise'], ['optimization', 'optimisation'], ['organize', 'organise'],
  ['organization', 'organisation'], ['analyze', 'analyse'], ['prioritize', 'prioritise'],
  ['recognize', 'recognise'], ['customize', 'customise'], ['behavior', 'behaviour'],
  ['color', 'colour'], ['favorite', 'favourite'], ['center', 'centre'], ['license', 'licence (noun)'],
  ['catalog', 'catalogue'], ['modeling', 'modelling'], ['labeled', 'labelled'], ['traveling', 'travelling'],
  ['canceled', 'cancelled'], ['fulfill', 'fulfil'], ['enroll', 'enrol'], ['defense', 'defence'],
  ['program ', 'programme (unless software)'], ['analyzing', 'analysing'], ['utilize', 'use'],
];

function parseArgs(argv) {
  const out = { files: [], config: null, hook: false, json: false, spelling: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--hook') out.hook = true;
    else if (a === '--json') out.json = true;
    else if (a === '--spelling') out.spelling = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--config') out.config = argv[++i];
    else if (a.startsWith('--')) { console.error(`Unknown option ${a}`); process.exit(3); }
    else out.files.push(a);
  }
  return out;
}

function loadConfig(projectDir, explicit) {
  const path = explicit ? resolve(explicit) : join(projectDir, '.agents', 'aio-seo', 'config.json');
  if (!existsSync(path)) return null;
  try {
    const cfg = JSON.parse(readFileSync(path, 'utf8'));
    return { ...DEFAULT_RULES, ...(cfg.house_rules || {}) };
  } catch (e) {
    console.error(`house-style: could not parse ${path}: ${e.message}`);
    return null;
  }
}

function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '(?:.*/)?';
        i++;
        if (glob[i + 1] === '/') i++;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if ('.+^${}()|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Turn "it's not X, it's Y" into a tolerant regex: apostrophe variants, contractions, placeholders.
function phraseToRegex(phrase) {
  const APOS = "['\u2019]";
  const tokens = phrase.toLowerCase().split(/\b(x|y)\b/);
  let re = '';
  for (const t of tokens) {
    if (t === 'x' || t === 'y') { re += '[^.!?\\n]{1,60}?'; continue; }
    const words = t.split(/\s+/);
    re += words.map((w) => {
      if (w === "it's") return `it(?:${APOS}s|\\s+is)`; // it's / it is
      if (w === 'not') return `(?:not|n${APOS}t)`;
      return escapeRe(w).replace(/'/g, APOS);
    }).join('\\s*');
  }
  // "it's not" also catches "it isn't" and "it is not"
  re = re.replace(`it(?:${APOS}s|\\s+is)\\s*(?:not|n${APOS}t)`, `it(?:${APOS}s\\s+not|\\s+isn${APOS}t|\\s+is\\s+not)`);
  return new RegExp(re, 'gi');
}

function stripIgnored(text) {
  // Blank out frontmatter keys, fenced code, inline code and URLs but keep line numbers.
  const lines = text.split('\n');
  let inFence = false;
  let inFront = lines[0]?.trim() === '---';
  return lines.map((line, idx) => {
    if (idx === 0 && inFront) return '';
    if (inFront) {
      if (line.trim() === '---') { inFront = false; return ''; }
      return line.replace(/^\s*[\w-]+\s*:/, ''); // keep values (titles, descriptions), drop keys
    }
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return ''; }
    if (inFence) return '';
    return line.replace(/`[^`]*`/g, '').replace(/https?:\/\/\S+/g, '');
  });
}

function checkText(text, rules, { spelling }) {
  const issues = [];
  const lines = stripIgnored(text);
  const phraseRes = (rules.banned_phrases || []).map((p) => [p, phraseToRegex(p)]);
  lines.forEach((line, i) => {
    for (const ch of rules.banned_characters || []) {
      let col = line.indexOf(ch);
      while (col !== -1) {
        issues.push({ line: i + 1, col: col + 1, rule: 'banned-character', detail: `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`, excerpt: line.trim().slice(0, 120) });
        col = line.indexOf(ch, col + 1);
      }
    }
    for (const [phrase, re] of phraseRes) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line))) {
        issues.push({ line: i + 1, col: m.index + 1, rule: 'banned-phrase', detail: phrase, excerpt: m[0].slice(0, 120) });
        if (!re.global) break;
      }
    }
    if (spelling && /british/i.test(rules.spelling || '')) {
      for (const [us, uk] of AMERICANISMS) {
        const re = new RegExp(`\\b${escapeRe(us.trim())}\\w*`, 'gi');
        let m;
        while ((m = re.exec(line))) {
          issues.push({ line: i + 1, col: m.index + 1, rule: 'spelling-advisory', detail: `${m[0]} -> ${uk}`, excerpt: line.trim().slice(0, 120) });
        }
      }
    }
  });
  return issues;
}

function formatReport(results) {
  const out = [];
  for (const r of results) {
    if (!r.issues.length) continue;
    out.push(`${r.file}`);
    for (const i of r.issues) out.push(`  ${i.line}:${i.col}  ${i.rule}  ${i.detail}  | ${i.excerpt}`);
  }
  return out.join('\n');
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return 0; }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  if (args.hook) {
    let payload = {};
    try { payload = JSON.parse(await readStdin()); } catch { return 0; }
    const file = payload?.tool_input?.file_path || payload?.tool_input?.path;
    if (!file) return 0;
    const rules = loadConfig(projectDir, args.config);
    if (!rules) return 0; // project not set up for aio-seo: stay silent
    const abs = isAbsolute(file) ? file : resolve(projectDir, file);
    const rel = relative(projectDir, abs).split('\\').join('/');
    if (rel.startsWith('..')) return 0;
    const globs = (rules.check_globs || []).map(globToRegex);
    if (!globs.some((g) => g.test(rel))) return 0;
    if (!existsSync(abs)) return 0;
    const issues = checkText(readFileSync(abs, 'utf8'), rules, { spelling: false });
    if (!issues.length) return 0;
    console.error(`aio-seo house rules: ${issues.length} issue(s) in ${rel}. Fix them before continuing (see .agents/aio-seo/config.json house_rules).\n` + formatReport([{ file: rel, issues }]));
    return 2;
  }

  if (!args.files.length) { console.error(HELP); return 3; }
  const rules = loadConfig(projectDir, args.config) || DEFAULT_RULES;
  const results = args.files.map((f) => {
    const abs = resolve(f);
    if (!existsSync(abs)) return { file: f, issues: [{ line: 0, col: 0, rule: 'missing-file', detail: 'not found', excerpt: '' }] };
    return { file: f, issues: checkText(readFileSync(abs, 'utf8'), rules, { spelling: args.spelling }) };
  });
  const blocking = results.some((r) => r.issues.some((i) => i.rule !== 'spelling-advisory'));
  if (args.json) console.log(JSON.stringify({ ok: !blocking, results }, null, 2));
  else {
    const rep = formatReport(results);
    console.log(rep || 'house-style: no issues');
  }
  return blocking ? 1 : 0;
}

main().then((code) => process.exit(code ?? 0)).catch((e) => { console.error(e); process.exit(3); });
