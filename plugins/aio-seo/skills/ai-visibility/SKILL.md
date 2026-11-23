---
name: ai-visibility
description: Build and maintain the buyer prompt set, and check by hand how ChatGPT, Claude, Perplexity, Gemini and Google AI Overviews/AI Mode answer it. Measures mention rate, citation rate, position, sentiment and factual errors per engine from manual checks, a small explore_prompt sample or answers the user pastes, and writes a dated results file listing wrong facts, cited sources the business is missing from, and topic gaps. Use when the user asks "are we showing up in ChatGPT", "AI visibility", "share of model", "what do AI assistants say about us", "build our prompt set", "check our AI answers", or pastes AI answers to score.
argument-hint: "[prompts|baseline|review] [--no-paid]"
---

# AI visibility

Know what AI assistants say when a buyer asks about the problem the business solves, and measure it the same way every time. This skill builds the prompt set, collects answers by hand (or from a small paid sample), scores them and writes the findings down. It does not edit pages or contact anyone.

Saved OpenSEO trackers, scheduled tracking, trend reporting and turning findings into tickets for other skills come with Pro (`/aio-seo-pro:visibility-tracking`). Without Pro, a person acts on the findings in the results file.

## Non-negotiables

- **Only report what the answers say.** Every metric comes from an `explore_prompt` result or a manual check logged with date, engine and the answer text. No estimated or modelled visibility figures.
- **Paid calls stay small and inside budget.** `explore_prompt`, `generate_ai_visibility_prompts` and `research_ai_visibility_prompts` cost credits: stay within `data.credit_budget_per_run`. This skill never saves a tracker, runs a tracker check, sets a schedule or calls `update_project_context`.
- **Do not rewrite the prompt set without the user's direction.** Changing a prompt's text breaks comparison with earlier runs. Add new prompts; pause old ones.
- **Single runs are noisy.** Sentiment and mentions vary between runs (knowledge-base.md section 8). Do not claim movement from one run to the next; compare only runs with the same prompt set and engines, and say how many runs the comparison rests on.
- **Never seed fake mentions.** No posting as a customer, no planted reviews, no paid unlabelled mentions (compliance-uk.md sections 2 and 3; inauthentic mentions are on Google's myth list, knowledge-base.md section 4).
- **Fix facts at the source.** When an engine states a wrong fact, the first fix is the business's own pages stating the right fact plainly in server-rendered HTML; off-site corrections come second. Record both in the results file.

## Inputs

From `.agents/aio-seo/config.json` (if missing, tell the user to run `/aio-seo:setup`; a manual `review` of answers the user pastes can still run):

- `project.site_url`, `project.market`, `project.language`
- `entity.entity_line`, `entity.short_description`, `entity.category`, `entity.disambiguation`, `entity.people`
- `offer[]` (name, keywords, audience, url), `audiences`, `competitors[]`, `branded_terms`, `excluded_patterns`
- `visibility.engines`, `visibility.prompt_count`
- `data.openseo_project_id`, `data.credit_budget_per_run`

State: `.agents/aio-seo/visibility/prompts.md`, `.agents/aio-seo/visibility/results/` (newest files), `.agents/aio-seo/visibility/citation-sources.md`, `.agents/aio-seo/offsite/entity-facts.md`.

## Run modes

| Mode | What it does |
|---|---|
| `prompts` | Build or refresh the prompt set in `visibility/prompts.md`; no answer collection |
| `baseline` (default) | Prompt set if missing, then a manual check (checklist or `explore_prompt` sample), first results file |
| `review` | Score answers already collected (pasted by the user or a filled checklist) without new collection |

`--no-paid` skips every credit-using call; use free reads and the manual checklist.

## Workflow

1. **Load context.** Read config, `state.md`, the files under `visibility/`, and `offsite/entity-facts.md`. If `entity-facts.md` is missing, copy `${CLAUDE_PLUGIN_ROOT}/templates/state/offsite/entity-facts.md` and fill it from `config.entity`, marking unknowns `TBC`. You need the canonical facts to judge factual errors.

2. **Build or refresh the prompt set** (`prompts` and `baseline`, or when `prompts.md` has fewer than `visibility.prompt_count` active prompts). Follow `${CLAUDE_SKILL_DIR}/references/prompt-set.md`:
   - Draft from config: offers, audiences, competitors, category and market.
   - Mine Search Console with `get_search_console_performance` (free) for question-shaped and long conversational queries; these are first-party evidence of what fans out to the site.
   - Optionally add from `generate_ai_visibility_prompts` and `research_ai_visibility_prompts` (paid; the latter is US English only and built mostly from "People also ask"; label prompts from it accordingly).
   - Cover the awareness stages and prompt types listed in the reference. Keep branded prompts (diagnostic) separate from neutral prompts (the KPI set).
   - Remove anything matching `excluded_patterns`. Write the set to `visibility/prompts.md` using the template at `${CLAUDE_PLUGIN_ROOT}/templates/state/visibility/prompts.md`.

3. **Collect answers.** Follow `${CLAUDE_SKILL_DIR}/references/manual-checks.md`: a small `explore_prompt` sample inside budget, a browser check only with the user's agreement in this session, or a checklist the user fills in. Save raw answers or tool output under `.agents/aio-seo/visibility/results/data/YYYY-MM-DD-*`. Mark any engine you could not reach "not collected".

4. **Score.** For each engine and overall, from neutral prompts only, compute the KPIs defined in `${CLAUDE_SKILL_DIR}/references/scoring.md`: mention rate, citation rate, position, sentiment, factual errors, competitor share. Show numerator and denominator for every rate. State the coverage (prompts and engines actually collected).

5. **Check facts.** Compare every statement about the business in the answers with `offsite/entity-facts.md` and the live site. Log each wrong or outdated fact with engine, prompt, the quoted claim (short), the correct fact and where the engine probably got it (a cited source, or "no source shown").

6. **Write the results file.** `.agents/aio-seo/visibility/results/YYYY-MM-DD.md` in the format in `${CLAUDE_SKILL_DIR}/references/scoring.md`, labelled "Source: manual" or "Source: explore_prompt sample". List the findings (wrong facts, cited sources we are absent from, topic gaps, own pages never cited) under "Findings for follow-up" with a suggested next step and the skill that could do it, for a person to decide. Never overwrite an earlier results file.

7. **Update state.** Append new cited sources to `visibility/citation-sources.md` (update counts and last-seen dates, never delete rows), update the `## AI visibility` section of `state.md` (one row per engine: date, mention rate, citation rate, source), and write `.agents/aio-seo/runs/YYYY-MM-DD-ai-visibility.md` with "Assumptions made" and "Not verified".

8. **Commit state if configured,** on a branch with a PR, as in the other skills. Never push to the default branch or merge.

## Outputs

- `.agents/aio-seo/visibility/prompts.md`
- `.agents/aio-seo/visibility/results/YYYY-MM-DD.md` and `results/data/`
- `.agents/aio-seo/visibility/citation-sources.md`
- `.agents/aio-seo/state.md` (`## AI visibility` only) and the run log

## Report to the user

Under 250 words, bullets: date and source of the answers; overall and per-engine mention rate and citation rate (with counts) and coverage; factual errors found; top 3 cited sources we are absent from; the findings listed for follow-up; anything not collected and why.

## References

- `${CLAUDE_SKILL_DIR}/references/prompt-set.md`: read in step 2 to build the prompt set.
- `${CLAUDE_SKILL_DIR}/references/manual-checks.md`: read in step 3.
- `${CLAUDE_SKILL_DIR}/references/scoring.md`: read in steps 4 to 6 for KPI definitions and the results file format.
- `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` sections 1, 4, 7 and 8: how engines pick sources and what the KPIs can and cannot show.
- `${CLAUDE_PLUGIN_ROOT}/references/openseo-playbook.md`: tool costs and approval rules.
- `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`: before suggesting any correction or outreach.
