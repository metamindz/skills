# Distribution drafts: LinkedIn and X

One draft per enabled channel for each post written this run. **Never post.** A human posts it, or explicitly approves posting in the session; even then, the plugin does not post on anyone's behalf.

Config: `blog.distribution.linkedin` (bool), `blog.distribution.x` (bool), `house_rules.author`, `house_rules.voice_skill`. Optional keys read if present: `blog.distribution.linkedin_author`, `blog.distribution.linkedin_target_chars` (default 1300), `blog.distribution.link_placement` (`comment` or `post`, default `comment`), `blog.distribution.hashtags` (default false). Log the defaults used under "Assumptions made".

## Rules for both

- **Voice:** `house_rules.voice_skill`; its rules override this file on tone. House rules apply (spelling, banned characters and phrases).
- **Material:** the strongest point from the research file: a dated statistic with its source, a contrarian point, a real example. Same sourcing rules as the post: no invented numbers, clients or quotes.
- **Not a repeat of the post's intro.** Different angle, same topic. The draft must work on its own in the feed.
- **Mentions:** only people or organisations actually named in the post who would reasonably expect it. Never tag to farm reach.
- **Tracked link:** the post's public URL with `?utm_source=<linkedin|x>&utm_medium=social&utm_campaign=<post slug>&utm_content=<author first name, lowercase>`.

## LinkedIn

- Hook in the first one or two lines (all most people see before "see more"); one specific insight or story from the post; a short close with a question or a clear opinion.
- Aim for the target length; never over 3,000 characters.
- Link placement: `comment` (link in the first comment, include that comment text) or `post` (link at the end).
- 0 to 3 hashtags, only if hashtags are enabled.

## X

- One post under 280 characters, or a thread of 3 to 6 posts when the material needs it. First post stands alone.
- Link in the last post of a thread, or at the end of a single post.
- No hashtags unless enabled.

## Save

`.agents/aio-seo/blog/social/YYYY-MM-DD-<slug>-linkedin.md` and `...-x.md`, using `${CLAUDE_PLUGIN_ROOT}/templates/state/blog/social/_template.md`. Record the paths in the post's `blog-log.md` entry and put the full text in the report, ready to paste.

## Measure

In step 2 of later runs, for posts with a draft marked posted (or unknown):

```
get_google_analytics_traffic_acquisition(projectId, breakdown: "campaign", startDate, endDate)
```

Look for the post slug as the campaign. Record sessions and key events in `post-performance.md` (Social column). No campaign row: "no tracked social sessions" (it may not have been posted, or got no clicks; say which if known). After 8+ posts, note in "Learnings" which angles drove sessions, numbers only.
