# Building the buyer prompt set

The prompt set is the fixed list of questions a real buyer might ask an AI assistant. It is the measuring stick, so it must be stable, representative and free of wishful thinking.

## Size and mix

- Target `visibility.prompt_count` active neutral prompts (default 25). Add up to 5 branded diagnostic prompts on top.
- Spread across offers by `offer[].weight` (a weight of 0.5 gets roughly half the prompts of a weight of 1.0).
- Spread across `audiences`; each audience should appear in at least 2 prompts.
- Use the market and language in config (`project.market`, `project.language`). Write UK prompts in British English with UK context where a buyer would add it ("in the UK", "for a London startup").

## Prompt types

Cover each type at least once per main offer:

| Type | Awareness stage | Example shape (generic) |
|---|---|---|
| Problem | Unaware of solutions | "Why does our analytics dashboard show different numbers from our billing system?" |
| Solution category | Solution-aware | "What tools reconcile product analytics with billing data?" |
| Shortlist | Comparing | "Best product analytics tools for B2B SaaS in the UK" |
| Comparison | Comparing | "Acme Analytics vs Example Metrics for a 20-person team" |
| Alternatives | Switching | "Alternatives to Example Metrics that keep data in the EU" |
| Fit and constraints | Deciding | "Which analytics tool works without cookies and is GDPR friendly?" |
| Price and process | Deciding | "How much does a product analytics tool cost for a startup?" |
| Branded (diagnostic only) | Brand-aware | "What is Acme Analytics and who is it for?" "Is Acme Analytics any good?" |

- Comparison and alternatives prompts use names from `competitors[]` only.
- Keep branded prompts out of the KPI set: they measure what engines believe about the brand (facts, sentiment), not whether buyers find it.

## Sources for candidate prompts

1. **Config:** offers, keywords, audiences, competitors, category, `entity.disambiguation`.
2. **Search Console (free):** `get_search_console_performance` with query dimension, last 3 months. Keep queries that are questions (who, what, which, how, best, vs, alternative, cost) or longer than about eight words. Prompt-shaped queries with strong positions are first-party evidence of AI fan-out (knowledge-base.md section 8). Quote them as they appear, lightly normalised.
3. **OpenSEO generation (paid, one model call):** `generate_ai_visibility_prompts` with the project's location and language codes. Treat the output as suggestions; edit for realism.
4. **OpenSEO research (paid, US English only):** `research_ai_visibility_prompts` with a short head term. It is built mostly from "People also ask"; it is not logged ChatGPT prompt volume. Use it for US-market projects or label prompts from it "US PAA-derived".
5. **Sales and support language:** if the user can share common questions from calls or support tickets, use them verbatim (no personal data).

Nobody can see real prompt volumes for AI assistants. Never attach a volume figure to a prompt.

## Quality filter

Drop or rewrite a candidate if it:
- contains the brand name (unless it is in the branded diagnostic group);
- matches `excluded_patterns` (for example jobs and careers);
- is leading ("Why is Acme the best...");
- is a keyword rather than a question a person would type or say;
- duplicates another prompt's intent.

## Stability rules

- Once a prompt is tracked, do not edit its text. Pause it and add a new one, so earlier answers stay attached to the exact wording.
- Review the set at most once a quarter, or when offers or competitors change in config. Log every change in the "Change log" table of `prompts.md`.
- Never pause a prompt because the brand performs badly on it.

## Writing to `prompts.md`

Use the template columns: ID, prompt, type, offer, audience, source, status (`active`, `paused`, `proposed`), tracker prompt id (from OpenSEO once saved), date added. New prompts start as `proposed` until the user approves the tracker change, or until the first manual run if there is no tracker.
