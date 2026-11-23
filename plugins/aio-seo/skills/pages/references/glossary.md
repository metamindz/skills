# Page type: glossary and definition pages

Read when building or auditing the glossary index (`project.url_patterns.glossary` parent) or a single definition page.

## When to build

- "What is <term>", "<term> meaning" or "<term> definition" queries in Search Console or keyword data, in our category.
- Terms we use across our content without defining them.
- **A separate page per term only when the term has enough to say** (roughly 300+ words of genuinely useful content: definition, how it works, example, how it relates to adjacent terms). Otherwise the term lives as an entry on the glossary index with an anchor. Do not create one thin page per term.

## Glossary index

1. **H1** ("{{Category}} glossary") and a 40 to 60 word lede.
2. **A to Z** sections; each entry: term (H2 or H3 with anchor), a one or two sentence definition, link to its full page if one exists.
3. Visible "Last updated" date.

## Definition page, required sections

1. **H1**: "What is {{term}}?" (or the phrasing searchers use).
2. **Direct answer, 40 to 60 words**: a definition that stands alone. Plain words; no circular definitions.
3. **How it works** or **why it matters**, with a concrete, generic example (no invented statistics or named-company anecdotes).
4. **Related terms**: links to 3 to 5 other glossary entries, with one line each on how they differ.
5. **Common mistakes or misconceptions** (only if real and sourced).
6. **Where this shows up in our product or service** (one short paragraph, factual), and a link to the matched offer or tool.
7. **FAQ** (optional, 2 to 4).
8. **Sources** for any standard, regulation or figure.

## Schema

- Index: `DefinedTermSet` with each entry a `DefinedTerm` (`name`, `description`, `url` with anchor), plus `BreadcrumbList`.
- Definition page: `DefinedTerm` (with `inDefinedTermSet` pointing at the index) inside a `WebPage` or `Article` with dates, plus `BreadcrumbList`. Only visible text in `description`.

## Checks

- No term page under the content threshold; merge thin ones into the index.
- No two pages defining the same term; check the blog log for "what is" posts first (cannibalisation).
- Definitions consistent across the glossary, FAQ banks and guides.
