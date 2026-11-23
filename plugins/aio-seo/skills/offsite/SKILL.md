---
name: offsite
description: Off-site entity consistency, phase 1, drafted for a human to carry out. Keeps one canonical entity facts file (name, entity line, address, company number, people, sameAs), checks how the core profiles describe the business (ChatGPT Business Hub, Google Business Profile, Bing Places, Apple Business Connect, LinkedIn, Crunchbase, the company register, Wikidata if notable), and drafts corrections and claim steps. Never creates accounts, submits listings or sends messages. Use when the user asks about "NAP consistency", "entity SEO", "claim our ChatGPT business profile", "Google Business Profile", "Bing Places", "why do AI assistants get our details wrong", or after /aio-seo:ai-visibility finds wrong facts. Reviews, earned mentions, industry directories and assisted submission are in Pro.
argument-hint: "[facts|audit|plan]"
---

# Off-site

AI assistants and search engines trust a business more when independent sources agree on who it is and mention it in context. This skill keeps the business's facts identical everywhere, finds where it should be listed or mentioned, and drafts every listing, correction, review request and pitch for a human to send.

## Non-negotiables

- **Draft only.** Never create, claim or edit an account, never submit a listing or form, never send an email, DM or message, never post anywhere, never accept terms. Write drafts into the state files with status `drafted`; the human sends them and updates the status.
- **One source of truth.** `.agents/aio-seo/offsite/entity-facts.md` holds the canonical facts. Every draft copies from it. If config and the facts file disagree, stop and ask the user which is right; do not guess.
- **Reviews are genuine or absent.** No fake, edited, gated or undisclosed-incentivised reviews; follow the platform's own rules, which may forbid incentives entirely (compliance-uk.md section 3). Never add Review or AggregateRating markup for the business's own reviews.
- **Earned, not bought.** No paid links, link schemes, link-selling services or paid unlabelled mentions. A paid placement must be labelled as advertising (compliance-uk.md section 2).
- **Outreach is lawful.** Every outreach draft states who is sending, where the contact was found and a one-line opt-out, and notes whether the recipient is a corporate or individual subscriber under PECR (compliance-uk.md section 5). Store business contact details only; no personal data beyond what the draft needs.
- **Wikidata only if notable.** See `${CLAUDE_SKILL_DIR}/references/platforms.md`. Never draft a Wikipedia article about the business.
- **Evidence for every observation.** "Profile says X" needs the URL and the date read. If a page could not be opened, say "seen in a search snippet only" or "not checked".

## Inputs

From `.agents/aio-seo/config.json` (if missing, tell the user to run `/aio-seo:setup`):

- `project.name`, `project.legal_name`, `project.site_url`, `project.market`
- `entity.*` (entity line, short description, category, disambiguation, founded, logo, contact email, phone, address, company number, VAT number, people, `same_as`, area served, knows about)
- `offer`, `audiences`, `competitors`
- `offsite.directories`, `offsite.review_platforms`
- `data.openseo_project_id`, `data.credit_budget_per_run`

State: everything under `.agents/aio-seo/offsite/`, `.agents/aio-seo/visibility/citation-sources.md`, the newest results file in `.agents/aio-seo/visibility/results/`, the newest audit's area H and I findings.

## Run modes

| Mode | What it does |
|---|---|
| `facts` | Create or refresh `entity-facts.md` from config and the live site; flag conflicts |
| `audit` | Check every core profile against the facts; update `citations.md` and `directories.md` |
| `plan` (default) | Run `facts` and `audit`, then list the phase 1 actions in priority order |

## The programme

1. **Entity consistency (this skill).** Same name, entity line, address, phone, company number and URL on every core profile, and the engine-run profiles claimed: ChatGPT Business Hub, Google Business Profile and Bing Places where the business serves customers in person or in a service area, Apple Business Connect for local and consumer businesses.
2. **Reviews**, 3. **industry directories and listings**, 4. **earned mentions** (roundups, podcasts, trade press, original data). These are in Pro: `/aio-seo-pro:authority` plans and drafts them, `/aio-seo-pro:listings` collects the assets once and fills listing forms in the user's Chrome with their approval. Without Pro, the user can do them by hand from the knowledge base (section 7).

Once profiles are consistent and live, list them in `entity.same_as` and hand off to `/aio-seo:schema` so Organization markup links to them.

## Workflow

1. **Load context** and read `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` section 7 (entity and authority evidence, engine-run business profiles).

2. **Canonical facts.** If `entity-facts.md` is missing, copy `${CLAUDE_PLUGIN_ROOT}/templates/state/offsite/entity-facts.md`. Fill it from config, then check the live site footer, contact page, about page and Organization JSON-LD. Record every disagreement in its "Conflicts" table and ask the user to resolve them (in a scheduled run, record them and stop). Check the legal name and company number against the national company register if the user agrees to a web lookup (for the UK, Companies House); quote the register URL. Engine-run profiles such as ChatGPT Business Hub ask for the legal name exactly as registered, so get it right here.

3. **Name collisions.** Search the brand name (web search; `get_serp_results` only within budget). List other entities with the same or similar name and whether AI answers or search results confuse them. Propose a disambiguation line for `entity.disambiguation` and hand off markup changes to `/aio-seo:schema`.

4. **Core profile audit** (`audit`). For each core profile in `${CLAUDE_SKILL_DIR}/references/platforms.md` that fits the business type, plus anything already in `entity.same_as`: find whether a profile exists (web search, `get_business_profile` for Google Business Profile where available, a search inside ChatGPT Business Hub only if the user opens it), open it, and record what it says for each fact. Write one row per profile in `citations.md` (existing profiles) or `directories.md` (core profiles not yet created or claimed) with the URL, date read, mismatches and the proposed action. Do not log in.

5. **Drafts.** For each wrong fact, draft a correction (`${CLAUDE_SKILL_DIR}/references/drafting.md`). For each unclaimed engine-run profile, write the claim steps the human follows, with the exact values to enter copied from `entity-facts.md` and the verification options the platform documents (for ChatGPT Business Hub: business phone, business email, DNS TXT record or Shopify, then Persona identity verification). Status `drafted`.

6. **Prioritise.** Engine-run profiles with wrong or missing facts first, then LinkedIn and the company register mismatches, then the rest. Keep a top 10 in the `## Off-site` section of `state.md`.

7. **Hand-offs.** New confirmed profile URLs go to `entity.same_as` in config (propose the edit; apply only in an interactive run with the user's yes) and to a ticket for `/aio-seo:schema`. Facts the site states wrongly go to `/aio-seo:maintain`.

8. **Update state and log.** Update the `## Off-site` section of `state.md` (phase, open conflicts, drafts awaiting the human, top 10 actions) and write `.agents/aio-seo/runs/YYYY-MM-DD-offsite.md` with "Assumptions made" and "Not verified". Never delete rows from the offsite files; change their status. Commit state on a branch with a PR if `git.commit_state` is true.

## Outputs

- `.agents/aio-seo/offsite/entity-facts.md`
- `.agents/aio-seo/offsite/citations.md` (existing profiles and their accuracy)
- `.agents/aio-seo/offsite/directories.md` (core profiles to create or claim, with steps and copy)
- `state.md` (`## Off-site` only) and the run log

## Report to the user

Under 200 words, bullets: conflicts in the canonical facts needing a decision; core profiles with wrong facts (platform, field, fix); engine-run profiles to claim, with the first step for each; drafts ready for the human, with file and row; reminder that nothing was sent or submitted.

## References

- `${CLAUDE_SKILL_DIR}/references/platforms.md`: core profiles to check and Wikidata rules. Read in step 4.
- `${CLAUDE_SKILL_DIR}/references/drafting.md`: read before writing any correction or claim steps.
- `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`: sections 2 and 5.
- `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md`: section 7.
