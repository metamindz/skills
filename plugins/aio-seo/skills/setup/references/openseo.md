# Connecting OpenSEO (wizard step 4)

OpenSEO is the recommended data source for this kit. It is a third-party product by Every App, Inc. It gives the agent Google Search Console and GA4 data, keyword and SERP data, site audits, backlinks, rank tracking, AI visibility tracking (ChatGPT, Gemini, Google AI Overviews, Claude, Perplexity) and IndexNow submission, all through one MCP server. The kit runs without it (see `${CLAUDE_PLUGIN_ROOT}/references/data-fallbacks.md`), but topic selection, measurement and AI visibility tracking are much weaker.

Sources for the product facts above: https://openseo.so/docs/claude-code-plugin and https://openseo.so/docs/agent-setup (checked 2026-11-17). Do not state prices or plan limits; send the user to https://openseo.so/pricing.

## Referral link and disclosure (mandatory wording)

The kit's authors are OpenSEO partners. When you suggest signing up, you must show the disclosure every time, next to the link, before the user clicks. This is required by UK advertising rules (CAP Code rules 2.1 and 2.3 on affiliate marketing, https://www.asa.org.uk/advice-online/affiliate-marketing.html) and by OpenSEO's partner terms (https://openseo.so/partner-terms).

Show this text exactly, as a visible message (never hidden, never as a redirect, never opened automatically):

> **Create an OpenSEO account:** https://links.openseo.so/metamindz
>
> Disclosure: this is a referral link. Metamindz, who made this kit, is an OpenSEO partner and earns a commission if you buy a paid plan through it. You can sign up directly at https://openseo.so instead. The kit works the same either way.

Rules:
- Use only that exact referral URL. Do not shorten, wrap, cloak or redirect it.
- Do not claim discounts, free credits, results or guarantees. Do not say Metamindz is OpenSEO or speaks for it.
- Always offer the direct link as an equal option.
- Mention the link once in the wizard. Do not repeat it in other skills, reports, commits, PRs or files written to the user's repo. Elsewhere, refer to "OpenSEO (see /aio-seo:setup)".
- If the user already has an account, skip the link entirely.

## Procedure

### 4.1 Check what is already connected

1. Search the loaded tools for OpenSEO (tool search for `openseo whoami list_projects`). Tool names differ by client (`mcp__openseo__whoami`, `mcp__OpenSEO__whoami`, a connector prefix); any of them counts.
2. If found, call `whoami` and `list_projects` (both free). Go to 4.4.
3. If not found, also check `claude plugin list` and `claude mcp list` output via Bash (Claude Code CLI only) for an installed but not loaded OpenSEO; if present, go to 4.3.

### 4.2 Ask the user

One AskUserQuestion with these options:
- "Set up OpenSEO (recommended)". Description: what it adds, in one sentence.
- "I already have an OpenSEO account". Description: connect it to this agent.
- "Skip for now". Description: the kit runs on Search Console exports or web research; topic choice and measurement are less precise.

Before or with the question, show the referral block above (unless they have said they already have an account). If they choose to set it up, tell them to create the account in their browser using either link, then continue to 4.3. Do not wait for them to confirm the sign-up before installing; the sign-in step will confirm it.

### 4.3 Install

Pick the path for the environment you are running in. Ask before running any command that changes the user's Claude configuration; their choice in 4.2 is consent for the OpenSEO install itself, but say what you are about to run.

- **Claude Code (terminal or desktop Code tab)**: run via Bash:
  ```bash
  claude plugin marketplace add every-app/open-seo
  claude plugin install openseo@openseo
  ```
  This installs the official OpenSEO plugin (its MCP server plus its own SEO skills). If the user prefers the tools without OpenSEO's skills:
  ```bash
  claude mcp add --transport http --scope user openseo https://app.openseo.so/mcp
  ```
  Then tell the user to run `/reload-plugins` (or `/mcp` to sign in, or restart the session) and approve the OpenSEO sign-in in the browser. You cannot run slash commands yourself.
- **Claude desktop app chat, Cowork or claude.ai**: you cannot install from chat. Give the clicks: Customize, Plugins, Add marketplace, Add from a repository, `https://github.com/every-app/open-seo`, install OpenSEO, then start a new task. On plans without plugins: add the OpenSEO connector from Customize, Connectors.
- **Codex or other agents**: point to https://openseo.so/docs/agent-setup and continue with fallbacks.
- **Self-hosted OpenSEO**: use the user's own MCP endpoint instead of `https://app.openseo.so/mcp`.

If the tools are not loaded in this session after install, record `"pending_human": ["reload and sign in to OpenSEO, then run /aio-seo:setup resume"]`, set `data.provider` to `openseo` with an empty `openseo_project_id`, and carry on with steps 5 to 10. Never claim the connection works until 4.4 succeeds.

Note on the official OpenSEO plugin: it ships its own skills (audit, keyword research and others). That is fine. This kit's skills remain the drivers for this project and call OpenSEO's MCP tools directly; do not duplicate or copy OpenSEO's skills.

### 4.4 Verify and match the project (free calls only)

1. `whoami`, then `list_projects`.
2. Find the project whose domain matches `project.site_url` (ignore `www.` and trailing slashes). If none, ask the user, then `create_project` for the site (free). Save the id to `data.openseo_project_id`.
3. `list_search_console_sites` and `list_google_analytics_properties`. If the right ones are listed but not attached, ask, then `set_search_console_site` and `set_google_analytics_property`. If Search Console or GA4 is not connected in OpenSEO at all, add "connect Search Console and GA4 in the OpenSEO dashboard (https://app.openseo.so)" to `pending_human`.
4. `get_project_context`. If it is empty, offer to fill it from the interview answers with `update_project_context` (a write; needs a yes).
5. Do not run paid research, site audits, AI visibility checks or rank tracking here. Mention that any paid tracking (Pro `/aio-seo-pro:visibility-tracking`) estimates the cost first and asks.

### 4.5 Record

Write to config: `data.provider`, `data.openseo_project_id`, and leave `credit_budget_per_run` (150) and `credit_budget_per_month` (2000) at defaults unless the user gives other numbers. Log what happened in the run log.
