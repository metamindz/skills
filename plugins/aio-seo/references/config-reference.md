# Config reference: `.agents/aio-seo/config.json`

One settings file for the whole kit, created by `/aio-seo:setup` from `${CLAUDE_PLUGIN_ROOT}/templates/config.template.json`. Every skill reads it first. Edit by hand or run `/aio-seo:setup reconfigure`. Keys starting with `_` are wizard bookkeeping (`_setup`, `_inferred`).

## project
| Key | Meaning |
|---|---|
| `name`, `legal_name` | Brand as written in copy; registered legal name |
| `site_url` | Canonical origin, no trailing slash (`https://www.example.com`) |
| `market`, `language`, `locale`, `currency`, `prices_include_vat` | Drive spelling, examples, schema `inLanguage`, Offer currency and VAT flag |
| `stack` | `nextjs-app-router`, `nextjs-pages-router`, `astro`, `wordpress`, `static`, or another framework name |
| `repo_root` | Folder of the site inside a monorepo (`apps/web`); `.` otherwise |
| `content_dirs.*` | Where each content type lives in the repo (empty = not used) |
| `url_patterns.*` | Public URL pattern per content type, `<slug>` placeholder |
| `private_paths` | Prefixes that must never be indexed (robots disallow + noindex) |
| `build_commands.*` | `lint`, `typecheck`, `test`, `build`, run before any PR |

## entity
The single source of truth for who the business is. Used verbatim in structured data, llms.txt and directory profiles.
| Key | Meaning |
|---|---|
| `entity_line` | One factual sentence describing the business, reused word for word everywhere |
| `short_description`, `category`, `disambiguation` | Short blurb; the noun people search for; how to tell it apart from same-name entities |
| `logo_path`, `contact_email`, `phone`, `address.*`, `company_number`, `vat_number`, `founded` | Trust facts; leave empty if not public |
| `people[]` | Authors and founders: `name`, `job_title`, `slug` (author page), `same_as` (profile URLs) |
| `same_as` | Official profiles of the business (LinkedIn, Crunchbase, GitHub, directories) |
| `area_served`, `knows_about` | Schema hints for services businesses |

## offer, audiences, competitors
- `offer[]`: each service, product, tool or resource: `name`, `type` (`service`, `product`, `tool`, `resource`), `weight` (1.0 core, 0.5 secondary), `url`, `keywords` (seed phrases), `price_from`, `audience`.
- `audiences`: who buys, in their words.
- `competitors[]`: `name`, `url`, `competes_on` (offer names).
- `branded_terms`, `excluded_patterns`: classify or ignore queries.
- `sister_sites[]`: other sites you own that content can link to.

## data
| Key | Meaning |
|---|---|
| `provider` | `openseo`, `gsc-mcp` or `manual-exports` |
| `openseo_project_id` | From `list_projects` |
| `credit_budget_per_run`, `credit_budget_per_month` | Hard caps on paid OpenSEO calls |
| `ai_visibility_tracker_id`, `rank_tracker_id` | Saved trackers to read |
| `fallback` | What to do when the provider is down: `manual-exports` or `research-led` |
| `scheduled_paid.*` | Standing approval for unattended (scheduled, Pro) runs: `site_audit` (paid OpenSEO crawl, capped by `site_audit_max_pages`), `ai_visibility_check` (paid AI visibility run), `indexnow_submit` (submit queued URLs; free). All paid ones default to false |

## indexing
`indexnow_key` (32 hex characters), `indexnow_key_path` (where the key file is served), `submit` (`after-deploy`, `scheduled`, `manual`), `search_console_verified`, `bing_verified`, `google_site_verification` and `bing_site_verification` (meta-tag tokens, only if you verify by meta tag rather than DNS).

## crawlers
The recorded AI crawler decision that `/aio-seo:foundation` turns into robots.txt rules. `training` (`allow` or `block` AI training crawlers), `bulk` (bulk dataset crawlers such as CCBot), `google_extended` (also controls Gemini grounding, so blocking it has a visibility cost), `applebot_extended`, `content_signal` (the Content-Signal line for robots.txt). Search and user-triggered assistant crawlers are always allowed. See `skills/foundation/references/crawler-policy.md`.

## house_rules
`spelling`, `author`, `voice_skill` (path to a voice skill), `banned_characters`, `banned_phrases` (X and Y act as wildcards), `check_globs` (files the house-style hook checks after every edit), `compliance` (`uk-cap-code`, `uk-dmcc-reviews`, `uk-gdpr`, `pecr`; remove for other markets and add your own).

## blog
Settings for `/aio-seo:blog` and `/aio-seo:maintain` (and Pro `/aio-seo-pro:maintain-advanced`): word count range, categories, data windows and thresholds (`min_impressions_striking`, `min_impressions_buried`, `target_ctr`, `min_high_value_queries`, `measurement_window_weeks`), cadence (`competitor_research_every_n_runs`, `maintenance_every_n_runs`, `max_maintenance_jobs_per_run`), output (`format`, `frontmatter_example`, `ship_mode`, `status`), `images.*`, `callouts.*`, `community_research.*`, `distribution.*`.

## pages
`enabled` (page types that may be built: `guides`, `faq`, `glossary` by `/aio-seo:pages`; `compare`, `alternatives`, `use-cases`, plus opt-in `competitor-vs-competitor`, `keyword-landing`, `programmatic` by Pro `/aio-seo-pro:commercial-pages`), `compare_checked_within_days` (Pro: comparison data older than this is refreshed before reuse).

## tools
Used by Pro `/aio-seo-pro:free-tools`; ignored by the free plugin. `enabled`, `uses_llm` (false = client-side tools only), `model_env` (name of the environment variable that holds the model id, default `TOOLS_MODEL`; the templates also use `TOOLS_LLM_API_KEY`, `TOOLS_LLM_BASE_URL`, `TOOLS_SECRET`, `TOOLS_LEAD_WEBHOOK_URL`), `daily_token_budget`, `monthly_token_budget`, `runs_per_person_per_day`, `health_url`, `max_budget_percent_to_build` (stop gate).

## visibility, offsite
`visibility.engines`, `prompt_count`, `cadence` (the tracking cadence, used by Pro `/aio-seo-pro:visibility-tracking`); `offsite.directories`, `review_platforms`.

## notifications, schedules, git
- `notifications.slack_channel`: reports go here if a Slack tool is available.
- `schedules.*`: `weekly_blog`, `weekly_tool`, `weekly_visibility`, `weekly_indexing`, `monthly_maintenance`, `monthly_audit`, each with `enabled`, `cron`, plus `mechanism` and `id` once created. Recurring runs are created by Pro (`/aio-seo-pro:autopilot`); the free plugin leaves them off and every skill can be run by hand.
- `git`: `ship_mode` (`pr`), `branch_prefix`, `commit_state`, `push` (false: the agent never pushes unless you change this).
