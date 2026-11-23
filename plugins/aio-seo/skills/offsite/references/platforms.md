# Where to check and where to be listed

Pick by business type. Skip platforms that do not fit; do not pad the list. Platform rules change often: open the platform's own guidelines before drafting anything and link them in the state file.

## Core profiles (almost every business)

| Platform | Check | Notes |
|---|---|---|
| ChatGPT Business Hub | Whether a listing exists and is claimed; name, website, description, category, logo | Claim at https://chatgpt.com/business-hub. Verification by business phone, business email, DNS TXT or Shopify, then Persona identity verification (the human's). Claiming lets the business manage its information and see mentions and website clicks; OpenAI says it does not guarantee more visibility (knowledge-base.md section 7) |
| Google Business Profile | Name, category, address or service area, phone, website, hours, description | Only for businesses with premises or a service area that serve customers in person or locally. Google's rules forbid incentives for reviews and selectively soliciting positive ones: https://support.google.com/business/answer/7400114 |
| Bing Places for Business | Same fields as Google Business Profile | Bing feeds Copilot (knowledge-base.md section 1) |
| Apple Business Connect | Same fields | Local businesses |
| LinkedIn company page | Name, tagline, about, website, industry, size, location | Also the people in `entity.people`: their headline and current role should name the business the same way |
| National company register | Legal name, number, registered office | UK: Companies House. Read-only reference; the trading address can differ from the registered office, so record both and say which one public profiles should show |
| Crunchbase | Name, description, website, founders, founded date | Relevant for startups, software and investor-facing businesses |
| Own social profiles | Bio, link, name | Only the ones the business actually uses |

## Wikidata (only if notable)

- An item is acceptable only if it meets at least one Wikidata notability criterion: a valid sitelink to a Wikimedia project page; a "clearly identifiable conceptual or material entity" that can be described using serious and publicly available references; or a structural need. https://www.wikidata.org/wiki/Wikidata:Notability (read 2026-11-17)
- Rules for this plugin:
  - Check whether an item already exists before anything else; if it does, record its Q-id in `entity-facts.md` and propose it for `sameAs`.
  - Propose creating an item only if you can list at least two serious, independent, publicly available references about the business (not its own site, not press releases, not paid listings). Put them in the draft.
  - Never draft a Wikipedia article. Wikipedia has its own notability and conflict-of-interest rules; if the user wants one, tell them it needs independent editors.
  - The human makes any edit, under their own account, and should follow Wikidata's disclosure policies for paid or connected editing.

