# Blog quality gate

Run in step 9 after writing, and again after every fix. Record pass/fail for each line in the run log, with a one-line reason for each fail. Publish live only if every line passes. The `content-reviewer` agent can run this gate independently; prefer that for a second opinion that is not anchored on the writer's view.

Structure and sourcing rules behind each line are in `${CLAUDE_PLUGIN_ROOT}/references/writing-standards.md`.

## Mechanical pre-check

Before the 15 lines, run on the post file (and any edited older posts):

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/content-lint.mjs <post file> --config .agents/aio-seo/config.json
node ${CLAUDE_PLUGIN_ROOT}/scripts/house-style.mjs <post file>
```

Fix every error. If a lint rule clashes with the site's own frontmatter schema (for example a different date field), follow the schema and record the exception in the run log.

## The 15 lines

1. **Target placement.** The primary query is the selected target and appears in the title, meta title, slug, answer block and at least one H2.
2. **Answer block.** The first paragraph after the H1 (ignoring a byline/dateline) is 40 to 60 words and answers the query without needing the rest of the post.
3. **Length.** Word count within `blog.word_count`, and justified by the topic's depth and what the top-ranking pages cover. Padding to hit a number is a fail.
4. **Statistics.** 3 to 5 specific, dated statistics, each linked to its primary source and traceable to the research file. A `## Sources` section or footnotes exist. (An original-data post replaces this with its method section and dataset.)
5. **Nothing invented.** No statistic, quote, client, result or product fact appears that is not in the research file or the user's own input. The `fact-checker` agent verdicts are all "supported".
6. **Table.** At least one comparison or summary table, as real Markdown/HTML table markup.
7. **FAQ.** A visible FAQ with 3 to 6 questions ending in "?", taken from real queries where possible, each answered in 40 to 60 words, consistent with the body.
8. **Internal links.** At least 3 internal links with descriptive anchors, including 1 to 3 related existing posts (when they exist) and the matched offer page. Every linked URL verified as loading this run.
9. **Callouts.** Matched-offer callout present; roughly 1 per `blog.callouts.words_per_callout` words, maximum 4; each after a relevant section, none before the answer block, none adjacent; each carries its inventory ID; same-site links have no UTMs, sister-site links do (`callouts.md`).
10. **House rules.** `content-lint.mjs` and `house-style.mjs` pass; no banned characters or phrases from `house_rules`; spelling variant consistent; external links are https.
11. **Comparisons and disclosure.** Claims about named competitors are sourced and dated ("as of"), or removed. If the post compares or recommends anything the business sells, the disclosure line is present under the answer block. CAP Code checks in `${CLAUDE_PLUGIN_ROOT}/references/compliance-uk.md` pass.
12. **Images** (when `blog.images.enabled`). Thumbnail only in the frontmatter hero field, not in the body; no image repeated; every body image has descriptive alt text; real files or URLs only.
13. **Voice.** Reread the opening, the closing and every callout against `house_rules.voice_skill`. These are where filler creeps in.
14. **Authorship and structured data.** Byline is `house_rules.author` with a linked author page; published and updated dates set; the frontmatter fields the template reads for Article/BlogPosting and BreadcrumbList are filled (and FAQ fields if the site emits FAQPage). If the template does not emit them, a `/aio-seo:schema` ticket is open.
15. **No overlap.** Not substantially overlapping an existing post or page (re-check after writing, because outlines drift), and not on a topic a past consolidation marked "do not write new posts on".

## Outcome

- All pass: publish per `blog.status`.
- Any fail after one fix attempt: ship as draft, list the failing lines in the run log, the PR description and the report.
