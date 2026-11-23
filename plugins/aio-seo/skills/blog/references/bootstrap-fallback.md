# Bootstrap fallback

The normal way to set up is `/aio-seo:setup`: it writes `.agents/aio-seo/config.json`, connects data, and creates every module's state files. Use this fallback only when `config.json` exists but the blog state folder does not (for example the user enabled the blog after setup), or the user asks the blog skill to "set up the blog state".

If `config.json` does not exist: stop and tell the user to run `/aio-seo:setup`. Do not create config from this skill.

## Steps

1. **Migrate if an old setup exists.** If `.agents/blog-agent/` exists, copy its files into `.agents/aio-seo/blog/` without reformatting (history stays as written), skip `config.md`, and list in the run log every old config value that has no matching key in `config.json` (mapping in `config-keys.md`). Do not delete the old folder; tell the user they can remove it after checking.
2. **Create missing files** from `${CLAUDE_PLUGIN_ROOT}/templates/state/blog/`: copy each file that does not already exist (including `research/_template.md`, `runs/_template.md`, `social/_template.md` and the `.gitkeep` files in `data/` and `drafts/`). Replace `YYYY-MM-DD` in the "updated" headers with today's date.
3. **Seed what you can verify:**
   - `keywords.md` "Core offer keywords" from `offer[].keywords`.
   - `competitors.md` from `competitors[]` and, if OpenSEO is connected, `get_project_context` (source: "OpenSEO project context").
   - `link-inventory.md` per `callouts.md` section 1 (offers, route scan, sitemap, sister sites). Mark scanned entries `inferred`. Fetch each URL and record status.
   - `blog-log.md`: backfill existing posts from the content dir (title, URL, date from frontmatter). Mark unknown fields `unknown`, never estimated.
4. **Learn the site's conventions** (`publishing.md` section 1) and record them in `blog/state.md`.
5. **Baseline pull, if data is available:** run workflow steps 3 and 4 (demand pull, classify, score) so the first `state.md` has a real candidate queue. Without data, say so and leave the queue empty.
6. **Stop and show:** the files created, inferred inventory entries, the top 5 candidates with reasons, and the maintenance jobs found. No post is written on a bootstrap run. Commit the state only if `git.commit_state` is true, on a branch, as a PR.
