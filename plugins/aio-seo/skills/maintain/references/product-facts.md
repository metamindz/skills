# Product fact check

Pages drift from the product: prices change, plans are renamed, features ship or are removed. Stale prices and feature claims mislead readers and are a misleading-advertising risk under the CAP Code (see `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md`). This job finds every page that states a product fact and checks it against the current source of truth.

## 1. Build the current fact sheet

Sources, in order of authority:

1. The code or content that renders the live pricing, plans and features (pricing page component, plan config, billing constants, feature flags, a product data file).
2. `.agents/aio-seo/offsite/entity-facts.md` if it exists.
3. `offer[]` in config (`name`, `price_from`, `url`).
4. The live pricing and product pages (fetch them; they show what is deployed).

If sources disagree, the deployed page and the code that renders it win; flag the disagreement in the report and do not guess which is intended.

Record the fact sheet in the run log: fact, value, source file or URL, date checked.

## 2. Find what changed recently

Since the last maintain run (or the last 90 days on a first run):

```bash
git log --since=<date> --name-only --format='%h %cs %s' -- <pricing, plans, billing, product data, features paths>
git log --since=<date> -p -- <those paths> | grep -nE '[£$€][0-9]|per (month|year|seat|user)|plan|tier|trial|limit|feature'
```

Find the paths by searching the repo for the pricing route, plan or price constants, and words like `pricing`, `plans`, `tiers`, `billing`, `features`. Record the paths you used.

For each change, note old value, new value, commit, date.

## 3. Find pages that state those facts

Search every `project.content_dirs.*` folder and page components for:

- Old values from step 2 (exact prices, old plan names, removed feature names).
- Any price pattern (`£`, `$`, `€` followed by digits; "per month"; "free plan"; "free trial") and plan names from the fact sheet.
- Feature claims for features that changed.

## 4. Fix

- Update each stale fact to the current value and add or update the "as of" date, or link to the pricing page instead of repeating a price where the page does not need the number.
- Comparison pages: update our own row and re-check competitor facts that are older than `pages.compare_checked_within_days` (default 90) against the competitor's own site; change the checked date only for facts you re-checked.
- Do not change facts you cannot confirm from step 1. List them under "Not verified".
- Spawn the `fact-checker` agent on the changed files with the fact sheet as the source list.
- Set `updated` on pages where a fact changed (it is substantive).

## 5. Record

- Job row: facts changed, pages touched, source of truth used.
- If the repo has no single source of truth for prices (values repeated by hand across pages), open a job proposing one (for example a shared constants file) and do not build it in this run.
