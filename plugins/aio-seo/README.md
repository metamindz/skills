# AIO & SEO Kit by Metamindz

A Claude Code plugin that sets up and runs SEO and AI search optimisation (AIO, also called GEO or AEO) for any website, from your repo. The goal: be found on Google and Bing, and be the business that ChatGPT, Claude, Perplexity, Gemini and Google AI Overviews name and cite when your buyers ask.

It packages the processes Metamindz runs on its own sites, generalised for any project: technical foundations, structured data, indexing, a data-led content engine, guides, FAQ and glossary pages, AI visibility checks, maintenance of existing pages and off-site entity work. A guided wizard sets it all up.

## Install

In Claude Code:

```
/plugin marketplace add metamindz/skills
/plugin install aio-seo@metamindz
```

Or from your shell:

```bash
claude plugin marketplace add metamindz/skills
claude plugin install aio-seo@metamindz
```

Then open your website's repo and run:

```
/aio-seo:setup
```

## What the wizard does

1. Detects your stack (Next.js, Astro, WordPress, static and others), content folders and current SEO setup.
2. Interviews you about the business: one-sentence entity description, offer, audiences, competitors, voice.
3. Connects a search data source. OpenSEO is recommended (Search Console, GA4, keywords, SERPs, AI visibility tracking); the kit also runs on Search Console exports.
4. Writes `.agents/aio-seo/config.json` and the state files the other skills use.
5. Runs a free baseline check of the live site.
6. Offers a foundations pull request, a first content plan, a buyer prompt set and an entity consistency review.
7. Explains how to run each skill by hand when you want it.

Nothing is merged, published, sent or paid for without your OK. Every change arrives as a pull request.

## Skills

| Command | What it does |
|---|---|
| `/aio-seo:setup` | Guided setup, resume and reconfigure |
| `/aio-seo:audit` | Full SEO and AIO audit with a prioritised backlog |
| `/aio-seo:foundation` | robots.txt with AI crawler rules, sitemap, llms.txt and llms-full.txt, markdown versions of pages, metadata, verification, IndexNow |
| `/aio-seo:schema` | Structured data from typed builders, with an offline validator |
| `/aio-seo:indexing` | IndexNow submission, URL inspection, weekly indexing health, and sitemap submission in Search Console and Bing done in your Chrome with your approval |
| `/aio-seo:blog` | One data-led post per run, chosen from real search data |
| `/aio-seo:pages` | Guides hub with topic clusters, FAQ hub with reusable FAQ banks, glossary |
| `/aio-seo:ai-visibility` | Buyer prompt set and manual checks of how AI assistants answer |
| `/aio-seo:offsite` | Entity consistency and the core profiles: ChatGPT Business Hub, Google Business Profile, Bing Places, Apple Business Connect, LinkedIn (drafts and claim steps only) |
| `/aio-seo:maintain` | Near-miss rankings, low-CTR titles, internal links, product fact checks |
| `/aio-seo:report` | Weekly or monthly report from your own data |

Also included: three subagents (`seo-auditor`, `fact-checker`, `content-reviewer`), a house-style hook that checks content files after every edit, zero-dependency scripts (`check-site`, `indexnow`, `validate-jsonld`, `content-lint`, `house-style`), a Next.js reference implementation and templates for state files.

## Pro

AIO & SEO Kit Pro is a paid add-on with comparison and alternatives pages, weekly free tools, recurring runs, AI visibility tracking, advanced maintenance and agency mode. See https://www.metamindz.co.uk.

## Data source: OpenSEO (recommended)

The kit uses [OpenSEO](https://openseo.so) for search data through its MCP server. The wizard installs and connects it for you. If you do not have an account:

**Create an OpenSEO account:** https://links.openseo.so/metamindz

> Disclosure: this is a referral link. Metamindz, who made this kit, is an OpenSEO partner and earns a commission if you buy a paid plan through it. You can sign up directly at https://openseo.so instead. The kit works the same either way.

Without OpenSEO the kit falls back to Search Console MCP servers or CSV exports, and labels anything it cannot measure.

## Principles

- **Data first.** Topics and fixes come from your Search Console, analytics and keyword data. No invented numbers; every claim in content has a source.
- **Your repo is the system.** Settings and state live in `.agents/aio-seo/`, so every run picks up where the last one stopped and you can review everything in git.
- **Pull requests only.** The agent never merges, pushes to your main branch, posts, emails or pays.
- **Honest marketing.** No fake reviews or self-serving review markup, fair and sourced comparisons, clear disclosures. UK rules (CAP Code, DMCC Act, UK GDPR, PECR) are on by default and can be switched for other markets.

## Requirements

- Claude Code (CLI, desktop app Code tab or IDE extension). Some skills also work in Cowork without the hook and scripts.
- Node.js 18 or later for the bundled scripts.
- A git repo for the website. GitHub CLI (`gh`) for opening pull requests.

## Privacy

The plugin itself collects nothing. Skills read your repo and the tools you connect (for example OpenSEO), and write only to your repo. `check-site` sends ordinary GET requests to your own site.

## Need help?

Metamindz is a London tech consultancy run by fractional CTOs. If you want this kit installed and run for you, or help with the engineering behind it, see https://www.metamindz.co.uk.

## Licence

MIT. See [LICENSE](../../LICENSE).
