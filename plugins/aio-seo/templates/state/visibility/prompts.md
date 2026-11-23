# AI visibility prompt set

Maintained by `/aio-seo:ai-visibility`. The fixed list of buyer questions used to measure how AI assistants answer. See the skill's `references/prompt-set.md` for how to build it.

- Market: {{project.market}}
- Language: {{project.language}}
- Engines: {{visibility.engines}}
- Target active neutral prompts: {{visibility.prompt_count}}
- OpenSEO tracker id: {{data.ai_visibility_tracker_id}}
- Last reviewed: YYYY-MM-DD

Rules
- Never edit the text of a tracked prompt. Pause it and add a new row.
- Never pause a prompt because the brand does badly on it.
- Neutral prompts never contain the brand name; branded prompts are diagnostics only and are excluded from the KPIs.
- No volume figures: real AI prompt volumes are not observable.

Types: `problem`, `category`, `shortlist`, `comparison`, `alternatives`, `fit`, `price`, `branded`
Sources: `config`, `gsc` (Search Console query, quote it), `openseo-generated`, `openseo-paa-us`, `sales` (from the user), `manual`
Status: `proposed`, `active`, `paused`

## Neutral prompts (KPI set)

| ID | Prompt | Type | Offer | Audience | Source | Status | Tracker prompt id | Added |
|---|---|---|---|---|---|---|---|---|
| P01 | | | | | | proposed | | YYYY-MM-DD |

## Branded diagnostic prompts

| ID | Prompt | Purpose | Status | Tracker prompt id | Added |
|---|---|---|---|---|---|
| B01 | What is {{project.name}} and who is it for? | Facts and positioning | proposed | | YYYY-MM-DD |

## Change log

| Date | Change | Reason | Approved by |
|---|---|---|---|
