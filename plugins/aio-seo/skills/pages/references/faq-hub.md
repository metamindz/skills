# Page type: central FAQ hub and reusable FAQ banks

Read when building or auditing the FAQ hub (for example `/faq`) or adding FAQs to any page.

## Principle

One source of truth per answer. FAQ answers live in **banks** (typed data modules or content files), grouped by topic, and every page that shows an FAQ pulls from a bank. The same question is never answered two different ways on two pages.

## Banks

```ts
export interface Faq {
  q: string; // phrased as people ask it
  a: string; // 40 to 80 words, plain text, self-contained
}
export const PRODUCT_FAQS: Faq[] = [/* ... */];
export const PRICING_FAQS: Faq[] = [/* ... */];
export const PRIVACY_FAQS: Faq[] = [/* ... */];
```

- Answers that quote numbers (limits, prices, retention) interpolate them from the same constants the product and pricing pages use, never retyped.
- Every answer must be true today and based on our own published facts. No performance claims without a source.
- Page-specific FAQs (comparison pages, tools) may live with the page, but must not contradict a bank answer.

## Hub structure

1. **H1** ("Frequently asked questions" or "{{Name}} FAQ") and a **40 to 60 word lede**.
2. **Topic sections** with H2s, each rendering one bank. Order by how often the questions are asked (Search Console question queries, support and sales notes) and record the basis in the plan.
3. Each question as an H3 (or `<details>` with the answer text present in the HTML), with a stable anchor so other pages and AI answers can link to it.
4. **Links**: each answer links to the page that covers it in depth (guide, pricing, tool).
5. **Contact** for questions not answered.
6. Visible **"Last updated"** date.

## Finding questions

- Search Console queries starting with how, what, can, does, is, why, which, or containing "vs", "cost", "free".
- `get_search_opportunities` question variants.
- `get_serp_results` "People also ask" for 2 to 3 head terms (paid; shortlist only).
- Existing FAQ blocks across the site (merge duplicates into the bank).

## Schema

- `FAQPage` for the visible Q&A only. FAQ rich results ended on 7 May 2026, so the markup is harmless rather than an asset; keep it accurate or leave it off [VERIFIED 2026-09] (https://developers.google.com/search/docs/appearance/structured-data/search-gallery).
- `BreadcrumbList`.

## Checks

- No duplicate questions across banks; a test can assert unique `q` values.
- Every answer 40 to 80 words, no em or en dashes, no banned phrases.
- JSON-LD text matches the visible text exactly.
