# Manual AI visibility checks

Use when OpenSEO AI visibility tracking is not connected, the user declined the cost, or `--no-paid` is set.

## Option 1: the agent asks the assistants (only where it genuinely can)

- `explore_prompt` (OpenSEO, paid per uncached model, cached answers free for seven days) can ask ChatGPT, Claude, Gemini and Perplexity. Use it only within `data.credit_budget_per_run` and only for a small sample (for example the 5 highest-weight prompts) unless the user approves more.
- If a browser tool is connected, the agent may open an assistant's public web interface and ask the prompts only after the user agrees in this session. Use a fresh chat with no custom instructions or memory where possible, record whether the session was logged in, and never enter credentials. Do not do this in a scheduled run.
- Do not claim to have checked an engine you could not reach. Mark it "not collected".

## Option 2: a checklist for the user

When the agent cannot reach the engines, write `.agents/aio-seo/visibility/results/YYYY-MM-DD-manual-checklist.md` and ask the user (or a colleague) to fill it in. Keep it short enough to do in about 30 minutes: by default the top 10 neutral prompts on the engines in `visibility.engines`.

```markdown
# Manual AI visibility check: YYYY-MM-DD

How to run it
- Use a private or logged-out window where the engine allows it; otherwise a fresh chat with memory and custom instructions turned off.
- Paste each prompt exactly as written. Do not add the company name.
- For Google, run the search on google.co.uk (or the market's Google) and note whether an AI Overview appears; try AI Mode if available.
- Copy the answer text into the "answer" file or paste it back to Claude Code. Note the date and time.

For each prompt and engine, record
- Was the brand named? (yes/no)
- Position among brands named (1, 2, 3...)
- Did it link to our site? Which URL?
- Tone about us: positive / neutral / negative (copy the phrase)
- Any wrong fact about us (copy the sentence)
- Which competitors were named
- Which sources were cited (URLs)

| # | Prompt | ChatGPT | Claude | Perplexity | Gemini | Google AIO / AI Mode |
|---|---|---|---|---|---|---|
```

When the user returns the answers, run this skill in `review` mode: score them with `scoring.md`, label the results file "Source: manual", and never mix manual and tracker figures in one rate.

## Free first-party signals to add every time

- Search Console Generative AI performance report (impressions only, UI export only, knowledge-base.md section 8): ask the user to export the Pages view for the last 28 days and save it under `visibility/results/data/`.
- Search Console queries that look like prompts (free via `get_search_console_performance`).
- AI referral sessions in GA4 (`get_google_analytics_traffic_acquisition`), reported as counts by referrer.
