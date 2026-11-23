# Canonical entity facts

The single source of truth for how the business is described everywhere: the website, structured data, third-party profiles, directories, review platforms and outreach drafts. Created by `/aio-seo:offsite` (or `/aio-seo:setup`) from `config.entity`, then checked against the live site and the company register.

- Last checked: YYYY-MM-DD
- Checked by: (skill run log path, or the person who confirmed it)

Rules
- Change a fact here first, then update config, the site and every profile listed in citations.md.
- Mark anything unconfirmed as `TBC`. Never fill a gap with a guess.
- If a source disagrees with this file, record it under Conflicts; do not silently change this file.

## Identity

| Fact | Value | Source / confirmed by |
|---|---|---|
| Trading name | {{project.name}} | |
| Legal name | {{project.legal_name}} | Company register URL |
| Company number | {{entity.company_number}} | |
| VAT number | {{entity.vat_number}} | |
| Entity line (one sentence: who, what, for whom, where) | {{entity.entity_line}} | |
| Short description (2 to 3 sentences) | {{entity.short_description}} | |
| Category | {{entity.category}} | |
| Disambiguation (how to tell us apart from similarly named entities) | {{entity.disambiguation}} | |
| Founded | {{entity.founded}} | |
| Website | {{project.site_url}} | |
| Logo URL | {{project.site_url}}{{entity.logo_path}} | |

## Contact and location

| Fact | Value | Notes |
|---|---|---|
| Trading address (shown publicly) | {{entity.address}} | |
| Registered office (if different) | | Usually not shown on listings |
| Phone (public format) | {{entity.phone}} | |
| Email | {{entity.contact_email}} | |
| Area served | {{entity.area_served}} | |

## People

| Name | Role | Profile page on site | sameAs (LinkedIn etc.) |
|---|---|---|---|
| | | | |

## Offers (names as they should appear)

| Name | URL | One-line description |
|---|---|---|
| | | |

## Official profiles (sameAs)

Only profiles the business controls or that are authoritative about it (register, Wikidata if it exists).

| Platform | URL | Confirmed live | In Organization schema |
|---|---|---|---|
| | | YYYY-MM-DD | yes/no |

## Name collisions

| Other entity | How it is confused | Disambiguation used |
|---|---|---|

## Conflicts to resolve

| Fact | This file says | Other source says | Source URL, date read | Decision (by whom, date) |
|---|---|---|---|---|
