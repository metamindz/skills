# Config keys used by the blog skill

All settings come from `.agents/aio-seo/config.json` (template: `${CLAUDE_PLUGIN_ROOT}/templates/config.template.json`; full reference: `${CLAUDE_PLUGIN_ROOT}/references/config-reference.md`). There is no separate blog config file. Never edit config in a scheduled run; propose changes in the report.

## Keys read

| Key | Used for |
|---|---|
| `project.name`, `project.site_url`, `project.market`, `project.language`, `project.currency` | Brand, URLs, spelling, examples, currency |
| `project.content_dirs.blog`, `project.url_patterns.blog` | Where posts live, public URL pattern |
| `project.build_commands.*` | Checks before a PR |
| `entity.entity_line`, `entity.knows_about`, `entity.people[]` | Positioning lines, discovery scope, author details |
| `offer[]` (`name`, `weight`, `keywords`, `url`, `type`, `audience`) | High-value classification, offer weight in scoring, matched-offer callout |
| `audiences[]` | Reader framing |
| `competitors[]` | Seed `competitors.md`, research-led mode |
| `branded_terms`, `excluded_patterns` | Query classification |
| `data.provider`, `data.openseo_project_id`, `data.credit_budget_per_run`, `data.credit_budget_per_month`, `data.rank_tracker_id`, `data.ai_visibility_tracker_id`, `data.fallback` | Data access and budget |
| `house_rules.*` | Spelling, author, voice skill, banned characters and phrases, compliance |
| `blog.*` | Everything in the table below |
| `sister_sites[]` | Callout targets with UTMs |
| `git.ship_mode`, `git.branch_prefix`, `git.commit_state`, `git.push` | Shipping |

## Mapping from the old `weekly-blog-post` config.md

For users migrating from `.agents/blog-agent/config.md`. `/aio-seo:setup` does this migration; this table is for checking it.

| Old key (config.md) | New key (config.json) | Notes |
|---|---|---|
| `project.name`, `project.site_url`, `project.market`, `project.language` | same | |
| `project.blog_base_url` | `project.site_url` + `project.url_patterns.blog` | |
| `openseo.project_id` | `data.openseo_project_id` | |
| `openseo.credit_budget_per_run` | `data.credit_budget_per_run` | plus new `data.credit_budget_per_month` |
| `openseo.competitor_research_every_n_runs` | `blog.competitor_research_every_n_runs` | |
| `selection.gsc_range` | `blog.gsc_range` | |
| `selection.ga4_lookback_days` | `blog.ga4_lookback_days` | |
| `selection.min_impressions_striking` | `blog.min_impressions_striking` | |
| `selection.min_impressions_buried` | `blog.min_impressions_buried` | |
| `selection.target_ctr` | `blog.target_ctr` | |
| `selection.min_high_value_queries` | `blog.min_high_value_queries` | |
| `selection.measurement_window_weeks` | `blog.measurement_window_weeks` | |
| `selection.branded_terms` | `branded_terms` | top level, shared by all skills |
| `selection.excluded_patterns` | `excluded_patterns` | top level |
| `services[]` (`name`, `weight`, `keywords`, `url`) | `offer[]` | same fields, plus `type`, `price_from`, `audience` |
| `callouts.min_per_post`, `words_per_callout`, `component`, `ga4_event` | `blog.callouts.*` | |
| `callouts.sister_sites[]` | `sister_sites[]` | top level; optional `openseo_project_id` per entry is read if present |
| `community_research.enabled`, `max_runs_per_post` | `blog.community_research.*` | |
| `community_research.discovery_every_n_runs`, `discovery_domains`, `allow_paid_backfill` | `blog.community_research.*` (optional) | defaults if absent: 4, `entity.knows_about`, false |
| `skills.voice_skill` | `house_rules.voice_skill` | |
| `skills.services_skill` | dropped | use `entity` and `offer[]` |
| `skills.aeo_skill` | dropped | use `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base.md` and `writing-standards.md` |
| `skills.image_style_guide` | `blog.images.style_guide` | |
| `skills.marketing_context` | dropped | still read `.agents/product-marketing-context.md` if it exists |
| `house_rules.author`, `banned_characters`, `banned_phrases` | same | |
| `house_rules.word_count` | `blog.word_count` | |
| `house_rules.categories` | `blog.categories` | |
| `images.enabled`, `command`, `min`, `max` | `blog.images.*` | |
| `publish.target: repo` | `blog.ship_mode: pr` or `commit` | |
| `publish.target: draft-only` | `blog.ship_mode: draft-only` | |
| `publish.target: notion` | removed | no CMS adapter; use `draft-only` until the blog renders from the repo |
| `publish.status` | `blog.status` | |
| `publish.repo.content_dir` | `project.content_dirs.blog` | |
| `publish.repo.format` | `blog.format` | |
| `publish.repo.frontmatter_example` | `blog.frontmatter_example` | |
| `publish.repo.ship_mode` | `blog.ship_mode` | falls back to `git.ship_mode` |
| `distribution.linkedin.enabled` | `blog.distribution.linkedin` | boolean; X drafts via `blog.distribution.x` |
| `distribution.linkedin.author`, `target_chars`, `link_placement`, `hashtags` | optional `blog.distribution.linkedin_author`, `linkedin_target_chars`, `link_placement`, `hashtags` | defaults: `house_rules.author`, 1300, `comment`, false |
| `maintenance.every_n_runs` | `blog.maintenance_every_n_runs` | the maintenance run itself is `/aio-seo:maintain` |
| `maintenance.max_jobs_per_run` | `blog.max_maintenance_jobs_per_run` | |
| `rank_tracker.tracker_id` | `data.rank_tracker_id` | |
| `rank_tracker.add_targeted_keywords` | dropped | adding tracker keywords spends credits: propose it, never do it in a run |
| `git.pull_before_run` | optional `git.pull_before_run` | default false |
| `git.commit_state`, `git.push` | same | plus `git.branch_prefix` |

Old state files move from `.agents/blog-agent/` to `.agents/aio-seo/blog/` unchanged; `config.md` is retired once `config.json` is filled.

## Optional keys this skill reads if present

Not in the template; defaults apply when absent. Log any default used under "Assumptions made".

| Key | Default |
|---|---|
| `blog.ctr_rewrite_below` | 0.03 |
| `blog.community_research.discovery_every_n_runs` | 4 |
| `blog.community_research.discovery_domains` | `entity.knows_about` |
| `blog.community_research.allow_paid_backfill` | false |
| `blog.distribution.linkedin_author` | `house_rules.author` |
| `blog.distribution.linkedin_target_chars` | 1300 |
| `blog.distribution.link_placement` | `comment` |
| `blog.distribution.hashtags` | false |
| `git.pull_before_run` | false |
