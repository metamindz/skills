# AI crawler policy

Read this before writing robots.txt rules for AI crawlers, and use it to explain the choice to the user. The crawler list, categories and quotes come from `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` section 1 ("Crawler user agents", "Crawler control default", "Hosting and CDN defaults"). Re-check the vendor docs linked there if the labels are more than six months old.

## The four kinds of crawler

| Kind | Tokens | What blocking does |
|---|---|---|
| Search and retrieval | `Googlebot`, `bingbot`, `Applebot`, `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `DuckAssistBot` | Removes the site from that engine's results and AI answers. Never block. |
| User-triggered fetch | `ChatGPT-User`, `Claude-User`, `Perplexity-User`, `MistralAI-User`, `meta-externalfetcher` | Stops the assistant opening the page when a person asks about it. Never block. `Perplexity-User` "generally ignores robots.txt rules" and `meta-externalfetcher` "may bypass robots.txt", so blocking them needs a WAF rule anyway. |
| Training | `GPTBot`, `ClaudeBot` (major assistants); `CCBot`, `Bytespider`, `meta-externalagent`, `Amazonbot` (bulk harvesters) | Opts out of future model training by that operator. Does not remove the site from search-based answers. |
| Control tokens (no crawler of their own) | `Google-Extended`, `Applebot-Extended` | `Google-Extended` governs Gemini training AND grounding, so blocking it costs Gemini answers; Google Search is unaffected. Blocking `Applebot-Extended` does not remove the site from Apple search. |

Retired tokens: `anthropic-ai` and `Claude-Web` no longer appear in Anthropic's docs [VERIFIED 2026-09]. Remove them when you touch the file (explain in the PR) and never add them.

## Presets to offer

Recommend preset 1 unless the user has a reason to restrict training. Record the answer in config:

```json
"crawlers": {
  "training": "allow",
  "bulk": "block",
  "google_extended": "allow",
  "applebot_extended": "allow",
  "content_signal": "search=yes, ai-input=yes, ai-train=yes"
}
```

1. **Visible everywhere, no bulk harvesting (knowledge base suggested starting point, a commercial judgement):** allow search, user-triggered and the major assistants' training crawlers (brand presence in model weights); block bulk harvesters with no attribution or referral path (`CCBot`, `Bytespider`, `meta-externalagent`, `Amazonbot`). Content-Signal `search=yes, ai-input=yes, ai-train=yes`.
2. **Allow everything:** as 1 but bulk harvesters allowed too. Simplest; suits sites that want the widest distribution.
3. **Answers yes, training no:** search and user-triggered allowed; `GPTBot`, `ClaudeBot`, bulk harvesters and `Applebot-Extended` blocked; Content-Signal `search=yes, ai-input=yes, ai-train=no`. Ask separately about `Google-Extended`: blocking it also removes Gemini grounding. Most sites that want AI visibility keep it allowed even in this preset.

Rules that apply to every preset:
- Search and user-triggered crawlers are always allowed. If the user asks to block them, explain the consequence and record it as their explicit instruction.
- Keep the file consistent: `ai-train=no` goes with training crawlers blocked, and `ai-train=yes` with them allowed [VERIFIED 2026-09, knowledge-base section 1]. The Next.js template's tests fail otherwise.
- `ai-input=yes` is the Content-Signal value that matters for AI answers; Cloudflare's `search` definition excludes AI-generated summaries [VERIFIED 2026-09].
- Content-Signal is Cloudflare syntax with no formal standing; its IETF draft expired [VERIFIED 2026-09]. `Content-Usage` (IETF AIPREF) is a draft whose text says it does not reflect consensus [VERIFIED 2026-09]. Treat both as optional statements of preference, not enforcement.
- Give each AI crawler an explicit group even when the rules equal `*`, so the decision is visible. Repeat the private-path disallows in every group: a crawler that matches its own group ignores the `*` group (RFC 9309).

## Check the CDN and WAF too

robots.txt is a request, and CDNs can override it:
- Cloudflare: from 15 September 2026, new domains get defaults that block Training and Agent bots on pages with ads; the single "Block AI bots" toggle became three controls [VERIFIED 2026-09, announced before it took effect; re-check]. Its Markdown for Agents feature injects a default Content-Signal if the origin sets none [VERIFIED 2026-09].
- Vercel: the AI Bots managed ruleset defaults to Allow; setting it to Deny also blocks agentic traffic [VERIFIED 2026-09].
Ask the user to confirm the dashboard settings match the chosen preset, and put it in the PR's human steps.

## Copyright angle

Training opt-outs interact with UK and EU copyright rules (EU text and data mining reservation; no UK equivalent). See `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`. Say "not legal advice" if the user asks.

## Unattended runs

Never change the crawler policy in a scheduled run. If the live robots.txt disagrees with config `crawlers`, log the difference under "Assumptions made" and in `state.md` for a human to decide.
