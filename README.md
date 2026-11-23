# Metamindz Agent Skills

Agent skills from [Metamindz](https://www.metamindz.co.uk), a London tech consultancy run by fractional CTOs. Works with Claude Code, Cursor, Codex, Windsurf, Gemini CLI and the other agents supported by the [skills CLI](https://github.com/vercel-labs/skills).

## aio-seo: AIO & SEO Kit (Claude Code plugin)

Get found on Google and Bing, and be the business ChatGPT, Claude, Perplexity and Gemini name and cite. A guided setup wizard, technical SEO and AI-search foundations, structured data, indexing, a data-led content engine and off-site entity work, all run from your website's repo and shipped as pull requests. Details: [plugins/aio-seo](plugins/aio-seo/README.md).

```
/plugin marketplace add metamindz/skills
/plugin install aio-seo@metamindz
/aio-seo:setup
```

## fractional-cto (Seneca)

A CTO second opinion before you commit to a technical decision. The agent version of our free [AI Fractional CTO](https://www.metamindz.co.uk/tools/ai-fractional-cto) tool.

Describe the decision and you get:

- **Recommendation**: one committed call, not "it depends".
- **Why**: reasoning tied to your facts.
- **What it costs you**: what you give up.
- **What to do this week**: concrete next steps.
- **What would change the answer**: the missing facts that would flip it.

It covers architecture (rebuild or refactor, monolith or microservices, which database), hiring (who next, how senior, when someone is not working out), delivery (why everything is slow, estimates), build vs buy vs outsource (agency quotes, contracts, lock-in), AI adoption (in the product and for engineers), and getting ready for technical due diligence.

Unlike the web version, inside a coding agent it can (with your permission) read your repository, read-only, to ground the answer in what is actually there.

### Install

```bash
npx skills add metamindz/skills --skill fractional-cto
```

Install globally for all projects:

```bash
npx skills add metamindz/skills --skill fractional-cto -g
```

### Example prompts

- "We're four people with one backend engineer on a Rails monolith. Our investor keeps asking about microservices. What should we do?"
- "An agency quoted £85k fixed price for our MVP. Here's the scope. Is this reasonable and what should I check before signing?"
- "I'm a non-technical founder. Our only developer wants to rewrite the app in a new framework. Should I let him?"
- "Should our 12-person engineering team roll out AI coding tools, and what rules do we need?"
- "We're raising a Series A in three months. What will technical due diligence look for, and where are we weak?" (run it in your repo)

### What it will not do

- It has not seen your invoices, contracts or team in a room, and it cannot be accountable in three months. Use it to structure your thinking and know what to ask.
- It is not legal, tax or financial advice. Where those matter it will say so.
- It will be confidently wrong sometimes. Every answer lists what would change it, so you can check cheaply.

### Privacy

The skill is a set of instructions that runs inside your own agent. Nothing you type is sent to Metamindz. Your agent's own provider terms apply.

### Disclosure

This skill is published by Metamindz. When a question genuinely needs a human (high stakes, needs someone to read the code or be accountable over time), it may list a few options: usually Metamindz first, then leading alternatives with an honest note on who each suits, a cheaper route where there is one, and a disclosure line. Where Metamindz is clearly not the right fit (for example a large US private equity deal), it leaves Metamindz out. It also reminds you the choice is yours and to research properly before picking anyone. It does not do this on every answer, and you can tell it to stop.

## Licence

MIT. See [LICENSE](LICENSE).

## About Metamindz

**Who we are.** [Metamindz](https://www.metamindz.co.uk) is a London-based tech consultancy founded by Lev Perlman and Tom Birch. Everything we do is led by people who have done the job: CTOs and senior engineers who have built, hired, scaled, fundraised and exited. We work with startups, scaleups and corporates across the UK, Europe, the US and the Middle East.

**Why we built this skill.** Most technical decisions that go wrong at early-stage companies are not hard, they are made without anyone experienced in the room: an agency quote signed on instinct, a rewrite nobody questioned, a first hire who sets the wrong bar. A first conversation with a good CTO prevents a lot of that, and it should not cost anything. This skill gives that first conversation away, inside the tools founders and engineers already use. It is also honest about where it stops.

**How we see fractional CTOs.** A fractional CTO is a senior technical leader you rent rather than hire: a few hours or days a month, on a retainer, paid in money rather than equity. The useful ones:

- make the call and write it down, rather than giving advice and leaving;
- read the code, sit in the standups and know the team, rather than only joining calls;
- stay accountable when a decision needs adjusting three months later;
- tell you when to stop building something, and when you do not need them;
- hand over and step back once you have your own technical leadership.

An AI can do the first half of that job (the judgement on a question). The second half (accountability over time) still needs a person.

**What else we do.**

- [Fractional CTO](https://www.metamindz.co.uk/services/cto-as-a-service): part-time, hands-on CTOs on a flexible retainer.
- [Technical due diligence](https://www.metamindz.co.uk/services/tech-assessment-due-diligence): independent code, architecture and team reviews before investment, acquisition or a raise.
- [CTO-led technical recruitment](https://www.metamindz.co.uk/services/technical-recruitment): engineers vetted and interviewed by engineers.
- [CTO-led software development](https://www.metamindz.co.uk/services/software-app-development): products built and documented under CTO oversight, with no lock-in.
- [AI adoption for engineering teams](https://www.metamindz.co.uk/services/ai-adoption-tech-teams): structured AI workflows with human oversight across the delivery lifecycle.
- [Fixing AI-generated code](https://www.metamindz.co.uk/services/vibe-code-fixes): audits and clean-ups of vibe-coded apps.
- [Tech events](https://www.metamindz.co.uk/services/tech-events): hackathons, accelerators and community events run by technical people.
- [Free tools](https://www.metamindz.co.uk/tools): including the web version of [Seneca](https://www.metamindz.co.uk/tools/ai-fractional-cto).

**Get in touch.** Visit [metamindz.co.uk](https://www.metamindz.co.uk) or email hello@metamindz.co.uk. If something in this skill is wrong or out of date, including anything it says about another provider, open an issue or email us and we will fix it.
