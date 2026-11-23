# Interview guide (wizard step 3)

Goal: fill the `project`, `entity`, `offer`, `audiences`, `competitors`, `branded_terms`, `excluded_patterns`, `sister_sites`, `house_rules` and module switches in config, with the user's confirmation. Keep it to four AskUserQuestion rounds. Draft first, ask second.

## Drafting from evidence

Before each round, gather evidence and draft answers:
- Fetch the homepage, about, pricing and services/product pages (if live). Read existing `Organization` JSON-LD, meta descriptions, README, package.json `description`.
- If OpenSEO is connected (it may be connected later in step 4; if so, revisit), `get_project_context` and free Search Console reads show what the site is already found for.
- Never fill legal facts (company number, VAT, address) from guesswork. Read them from the site footer or legal pages only, and ask the user to confirm.

## Round A: the entity

- **Brand name** and **legal name**.
- **Entity line**: one factual sentence, 20 to 35 words, in the form "<Brand> is a <category> that <does what> for <whom>[, based in <place>]." It is used verbatim in Organization and WebSite schema, llms.txt, the homepage meta description and every directory profile, so AI systems see one consistent description. No superlatives, no claims that need proof. Offer your draft plus one alternative.
- **Category**: the noun people use when searching (for example "fractional CTO service", "podcast editing software").
- **Disambiguation**: if the brand name matches another company, product or common word, one sentence that separates them.

## Round B: the offer

- List each service or product with its page URL. Mark core (weight 1.0) and secondary (0.5). Include free tools and lead magnets as `type: "tool"` or `"resource"`.
- Keywords per offer item: 3 to 6 seed phrases a buyer would type. Draft them from the page copy and Search Console queries.
- Audiences / ICP: who buys, in their words.
- Price-from only if the site publishes it.

## Round C: the landscape

- Competitors: 3 to 8 names with URLs. Draft from the user's own comparison pages, Search Console queries containing "vs" or "alternative", and (if OpenSEO is connected and the user approves a small spend) `find_serp_competitors`. Mark which offer each competes on.
- Branded terms: brand, misspellings, founder names, product names.
- Excluded patterns: queries to ignore (jobs, careers, salary by default; add any irrelevant meanings of the brand name).
- Sister sites: other sites or products the user owns that content may link to.

## Round D: voice and modules

- Voice: path to an existing voice skill, or "default house rules" (British English, no em dashes, no hype, the banned phrases list). Ask whether to add any phrases they dislike.
- Author and people: who bylines content, job titles, LinkedIn or profile URLs for `sameAs`.
- Modules: blog engine, pages (guides hub, FAQ hub, glossary), AI visibility (prompt set and checks), off-site authority. Default all on. If the Pro plugin is installed, also ask about commercial page types and free tools (client-side only, or LLM-backed with budget controls; LLM-backed off by default); `tools.enabled` stays false otherwise.
- Compliance: UK defaults (CAP Code, DMCC Act on reviews, UK GDPR, PECR). If the main market is not the UK, ask which rules apply and set `house_rules.compliance` accordingly.
- Reports: Slack channel name, or none (reports are then written to `.agents/aio-seo/reports/`).

## After the rounds

Summarise the config in a compact table and ask for a final yes. Anything the user did not confirm goes into `_inferred` in config.
