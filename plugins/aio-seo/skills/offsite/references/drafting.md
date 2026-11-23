# Drafting listings, corrections, review requests and pitches

Every draft is written into a state file with status `drafted`. The human edits, sends or submits it, then sets the status. Write in the house voice (`house_rules`) and British English unless the market says otherwise. Use only facts from `entity-facts.md` and sources you can link.

## Status values (all offsite files)

`idea` (found, not yet drafted) → `drafted` (ready for the human) → `sent` or `submitted` (by the human) → `live`, `declined` or `no reply` (after 4 weeks) → `closed`.

Never set `sent`, `submitted` or `live` yourself unless the user tells you it happened or you can see the live result (then record the URL and date).

## Listing copy

For each new listing, draft:
- Business name exactly as in `entity-facts.md`.
- Category: the platform's closest category, plus the reason.
- Short description (platform's limit) built from `entity.entity_line`; long description from `entity.short_description` and the offers. No superlatives without a source.
- Address, phone, email, website, founded, company number, as in `entity-facts.md`. Say which address to use if trading and registered offices differ.
- Logo path from `entity.logo_path`.
- Services or products from `offer[]` names.
- Links to other profiles only if the platform asks.
- A checklist of fields the human must fill that you cannot (verification codes, account owner, payment if any).

## Correction request

```
Subject: Correction to [business name] on [page title]

Hello [name if published, otherwise team],

I'm [sender name], [role] at [business name]. Your page [URL] lists [field] as "[current value]". The correct [field] is "[correct value]" (see [own page URL or register URL]).

Could you update it when you next edit the page?

Thanks,
[sender name]
[business name], [website]

I found this page while reviewing where we are listed. If you'd rather not hear from me again, reply "no thanks" and I won't contact you again.
```

## Inclusion pitch for a list or roundup

- Lead with why the business fits the list's stated criteria (quote the criteria if published).
- Give 3 to 5 verifiable facts with links: what it does, for whom, where, price model if public, one proof point the user has confirmed.
- Offer what the author needs (screenshots, a short quote, a contact for questions). Never offer payment, a reciprocal link or a free product in exchange for inclusion; if the publisher charges for inclusion, record that and leave the decision to the user (a paid inclusion must be labelled as advertising).
- Close with the opt-out line.

## Podcast pitch

- One line on who the guest is, from `entity.people`.
- Three talking points the guest can genuinely speak on, each tied to the show's audience.
- One link to the guest's profile page and one to relevant original material.
- Opt-out line.

## Review request

- Send to all comparable customers in a period (for example everyone whose project ended this quarter), not only happy ones. Record the selection rule in `reviews.md`.
- Ask for an honest review; do not suggest a rating, wording or staff names to mention.
- No incentive unless the platform allows it and it is disclosed; Google Business Profile forbids incentives outright (https://support.google.com/business/answer/7400114).
- Include the direct review link for the platform.
- Do not draft replies that pressure a reviewer to change or remove a negative review. A reply to a negative review should be factual and polite and offer a route to resolve it.

Template:

```
Subject: Would you review your experience with [business name]?

Hi [first name],

Thanks for working with us on [project or product]. We're asking every client from [period] for an honest review on [platform]. Good or bad, it helps other buyers decide, and it helps us improve.

It takes about five minutes: [review link]

Thanks,
[sender name]
```

## PECR and data notes for every outreach row

- Recipient type: `corporate` (limited company, LLP) or `individual` (sole trader, partnership, personal address) or `unknown` (treat as individual). For individuals, first contact should be through a route they invite (contact form, published press email) rather than unsolicited marketing email.
- Where the contact was found (URL).
- Store only business contact details; no personal phone numbers, no notes about the person beyond the role.
- Honour opt-outs: if a row is marked `opted out`, never draft to that contact again.
