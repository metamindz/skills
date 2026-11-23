# AI visibility scoring and results format

## KPIs

Compute from neutral prompts only, per engine and overall. Show the counts behind every rate (for example "7 of 25 answers, 28%").

| KPI | Definition | Notes |
|---|---|---|
| Mention rate | Answers that name the brand (or an alias in `branded_terms`) / answers collected | OpenSEO reports this; use its figure and say so |
| Citation rate | Answers that link to a URL on `project.site_url` / answers collected | OpenSEO "owned-site citation rate" |
| Position | Rank of the brand's first mention among all brands named in the answer; report the median across answers that mention the brand | Unranked prose: order of first appearance |
| Sentiment | Positive, neutral or negative framing of the brand, judged from the answer text, on answers that mention the brand | Record the deciding phrase; count each class |
| Factual errors | Statements about the brand that contradict `offsite/entity-facts.md` or the live site | Count, plus a list with engine and prompt |
| Competitor share | For each configured competitor, answers that name it / answers collected | Shows who wins where the brand is absent |
| Source gaps | Third-party URLs cited on prompts where the brand is absent | Feeds `citation-sources.md` |

Rules:
- Failed or empty collections count as coverage gaps, never as lost visibility.
- Compare periods only across runs with the same prompt set and engines (manual), or with `get_ai_visibility_trend` reporting "comparable" (tracker runs, Pro).
- One run of sentiment is not a trend (knowledge-base.md section 8).
- Google AI Overviews do not show on every query; record "no AI Overview shown" separately from "shown, brand absent".

## Results file

Write `.agents/aio-seo/visibility/results/YYYY-MM-DD.md`:

```markdown
# AI visibility results: YYYY-MM-DD

- Source: manual (engines, who collected, how) | explore_prompt sample | OpenSEO tracker (run id, collected YYYY-MM-DD to YYYY-MM-DD, coverage N%; Pro)
- Prompt set: visibility/prompts.md as of YYYY-MM-DD (N neutral, M branded)
- Engines: ...
- Market and language: ...
- Cost: OpenSEO credits or USD as reported | none

## Headline

- Mention rate overall: x of y (z%); citation rate: x of y (z%)
- Compared with: earlier results file with the same prompt set and engines, or "no comparable run"

## By engine

| Engine | Answers | Mentioned | Mention rate | Cited | Citation rate | Median position | Pos / neu / neg |
|---|---|---|---|---|---|---|---|

## Competitors

| Competitor | Answers naming it | Share |
|---|---|---|

## Factual errors

| Engine | Prompt id | Claim (short quote) | Correct fact | Likely source |
|---|---|---|---|---|

## Top cited sources where we are absent

| Source (domain or URL) | Type | Engines | Prompts | Action |
|---|---|---|---|---|

## Findings for follow-up

| # | Finding | Suggested next step | Skill that could do it | Evidence |
|---|---|---|---|---|

## Decisions for the human

## Assumptions made

## Not verified
```

Keep quotes from AI answers short (one sentence at most) and put the full answer reference (observation id or saved file) next to it.
