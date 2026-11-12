# Decision playbooks

Heuristics Metamindz CTOs use in first conversations. They are defaults, not laws: the user's facts override them, and your answer should say when they do. Load only the section that matches the decision.

## Contents

1. Architecture
2. Hiring and team
3. Delivery and process
4. Build, buy or outsource
5. AI adoption
6. Investor readiness and technical due diligence
7. Red flags worth naming in any answer

---

## 1. Architecture

**Defaults**
- Monolith (ideally a modular one) until there is a measured reason not to. Typical reasons: separate teams that must deploy independently, a component with very different scaling or compliance needs.
- Postgres as the default database. Choose something else when the access pattern clearly demands it (search, time series, graph, very high write volume), and keep Postgres as the system of record where possible.
- Mainstream stack the team already knows and the local market can hire for. A technically better but niche stack is a hiring tax every year.
- Managed services over self-hosting until the bill or a hard requirement says otherwise.

**Rebuild vs refactor**
- The default is refactor in place. Full rewrites usually take longer than estimated, freeze feature work and reintroduce old bugs.
- A rebuild is justified when most of these are true: the platform cannot support a business-critical requirement; nobody can safely change the code (no tests, no one who understands it); the stack is unsupported or unhireable; the product has changed so much the old model is wrong.
- Prefer the strangler pattern: build new pieces alongside the old, move traffic over gradually, delete the old parts.
- A contractor or agency saying "it needs a rewrite" is not evidence on its own. They may be right; the check is an independent person reading the code.

**Questions that flip the answer**
- Who will maintain it in a year?
- What is the actual measured bottleneck?
- What compliance or customer contract requirements apply?

## 2. Hiring and team

**Defaults**
- First engineering hire: a senior, product-minded generalist who has owned production systems. Not a junior (nobody to learn from), not a "CTO" title too early (you are paying for a title and equity, not the work you need).
- That first hire will interview the next ones, so they set the bar for everyone after them.
- Contractors and agencies are fine for defined, short-lived work. Core product knowledge should end up inside the company.
- A fractional CTO makes sense when technical decisions are constant but there is not enough leadership work to justify a full-time CTO.

**Assessing engineers**
- Use work that resembles the job: a paid take-home or a pairing session on a realistic problem, then a deep-dive on how they would design and operate it.
- Ask them to explain past systems they owned: what broke, what they would change, what they measured.
- Watch for deepfake or proxy interviews on remote hiring: camera on, ask follow-ups that need live reasoning, verify identity before an offer.

**When someone is not working out**
- First check the setup: unclear priorities, constant context switching, no review process and no product owner make good engineers look bad.
- If the setup is sound, agree specific expectations in writing, a short time frame and regular check-ins. Then decide. Point to UK employment law and an HR adviser for the process itself.
- A single developer who is the only person who can deploy or understands the code is a business risk regardless of how good they are. Fix the bus factor: documentation, shared access, a second person able to deploy.

**Not your call**
- Employment contracts, IR35 status, visas, equity schemes: name the issue, send them to a solicitor or accountant.

## 3. Delivery and process

**Diagnosing "everything is slow"**
Check in this order, because the cheaper causes are more common:
1. Too much work in progress and shifting priorities.
2. Unclear requirements reaching engineers.
3. No automated tests or deployment, so every release is risky and manual.
4. Technical debt in the specific areas being changed most.
5. Team capacity or skill gaps.

**What to measure**
- The four DORA metrics are a sensible start: deployment frequency, lead time for changes, change failure rate, time to restore service.
- Avoid measuring individuals by lines of code, tickets closed or story points.

**Estimates**
- Ask for ranges, not single numbers, and for the assumptions behind them.
- Break work into pieces small enough to ship in days. Big estimates hide unknowns.
- Re-estimate when scope changes, and make the trade-off visible: what moves out for what moves in.

## 4. Build, buy or outsource

**Build vs buy**
- Buy (SaaS) for anything that is not your differentiator: auth, payments, email, analytics, CRM, support tooling.
- Build what customers choose you for.
- Check the exit: can you export your data, what happens if the vendor raises prices or shuts down?

**Reviewing an agency quote**
- Fixed price suits tightly defined scope. Time and materials suits discovery and evolving products. Fixed price on vague scope usually ends in change requests.
- Ask for the named team, their seniority and how much of their time you get.
- Contract essentials: IP assignment to you on payment, code in your own repository, cloud and third-party accounts in your company's name, documentation and handover obligations, a clear exit clause. Have a solicitor review the contract.
- Ask for two client references with a similar project and speak to them.
- A quote much lower than others usually means misunderstood scope, very junior staff or a plan to recover margin through change requests.

**Outsource vs in-house**
- Outsource when speed matters, the work is well defined, and someone on your side (a technical founder, lead or fractional CTO) can judge the quality.
- Bring in-house when the product is the business and you need continuous iteration and retained knowledge.
- Without anyone technical on your side, outsourcing is high risk regardless of the vendor.

## 5. AI adoption

**AI in the product**
- Start from a specific user problem, not "add AI".
- Build a small evaluation set of real examples with expected outputs before choosing a model. Re-run it when prompts or models change.
- Model the cost per request and latency at expected volume early.
- Data protection: if personal data goes to a model provider, check the provider's data processing terms, where data is processed, retention and training use, and update the privacy notice. UK GDPR applies; the EU AI Act may apply if you serve EU users. Recommend legal review for regulated sectors.
- Keep a human in the loop for decisions with legal or significant effects on people.

**AI tools for the engineering team**
- Structured workflows over "vibe coding": AI drafts, humans own design, review and merge.
- Set clear rules on what AI may not change without senior review: authentication, payments, permissions, data deletion, infrastructure.
- Every AI-written change goes through the same review and tests as human code. If there are no tests, fixing that comes first.
- Roll out in a pilot team, agree what you will measure (lead time, review load, defects) and compare before and after.
- Expect gains to vary a lot by task and by engineer. Do not plan headcount on vendor claims.

**Inherited AI-generated code ("vibe-coded" apps)**
- Common problems: no authorisation checks, secrets in the client or repository, no input validation, duplicated logic, no tests, a database schema that grew by accident.
- Triage order: security holes, data integrity, then maintainability.

## 6. Investor readiness and technical due diligence

What investors and acquirers usually ask for, and what to prepare:
- Architecture overview: one diagram and one page of explanation.
- Ownership: code, IP assignments from every contractor and agency, open-source licence compliance.
- Security: access control, secrets management, backups and tested restores, any penetration test, incident history.
- Data protection: data map, lawful basis, processors and data processing agreements.
- Team: who knows what, bus factor, hiring plan.
- Delivery: how code reaches production, how often, how failures are handled.
- Technical debt: an honest list with a plan. A known, managed list reads better than a surprise found in diligence.

Start four to eight weeks before diligence if possible. Gaps found by the founder are cheaper than gaps found by the investor.

## 7. Red flags worth naming in any answer

- Code, cloud accounts or domains owned by a contractor or agency rather than the company.
- One person who is the only one able to deploy or explain the system.
- No backups, or backups that have never been restored.
- Secrets committed to the repository.
- No tests on the code that handles money, authentication or personal data.
- A rewrite proposed by the people who will be paid to do it, with no independent review.
- An AI feature handling personal data without a data processing agreement.
