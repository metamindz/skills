# Human checklist template (wizard step 6)

Write this to `.agents/aio-seo/setup-checklist.md`, replacing `{{...}}`, ticking items already done, and deleting items that do not apply to the business type. Keep the links.

```markdown
# AIO & SEO setup: things only you can do

Last updated: {{date}}. Tick items as you finish them; the kit reads this file on every run.

## Search engines
- [ ] Verify {{site_url}} in Google Search Console as a Domain property (DNS TXT record): https://search.google.com/search-console
- [ ] Submit {{site_url}}/sitemap.xml in Search Console (Indexing, Sitemaps)
- [ ] Verify the site in Bing Webmaster Tools (you can import from Search Console): https://www.bing.com/webmasters
- [ ] Submit the sitemap in Bing Webmaster Tools
- [ ] Bing Webmaster Tools: confirm IndexNow is receiving submissions after the first deploy

## Data source
- [ ] OpenSEO: sign in, then connect Search Console and GA4 for this site in the dashboard (https://app.openseo.so)
- [ ] GA4: mark the conversion events that matter (contact, sign-up, purchase, callout clicks) as key events so the kit can measure them

## Hosting and access for AI crawlers
- [ ] If you use Cloudflare, Vercel Firewall or another WAF/bot manager: check that the AI search crawlers you want (see robots.txt) are allowed, not challenged
- [ ] Keep important content in the server-rendered HTML (not only loaded by JavaScript)

## Entity and listings
- [ ] ChatGPT Business Hub: claim the business at https://chatgpt.com/business-hub (verify by business phone, business email, DNS TXT record or Shopify, then complete Persona identity verification), then add the description, website, logo and category from .agents/aio-seo/offsite/entity-facts.md. Use the legal name exactly as registered.
- [ ] Google Business Profile (businesses with premises or a service area): claim or update with the entity line, categories, hours, URL
- [ ] Bing Places (same businesses): claim, or import from Google Business Profile
- [ ] Apple Business Connect (local and consumer businesses): https://businessconnect.apple.com
- [ ] LinkedIn company page: same name, entity line and URL
- [ ] Review platforms relevant to {{business_type}} (see .agents/aio-seo/offsite/reviews.md)
- [ ] Any directories listed in .agents/aio-seo/offsite/directories.md

## Content and people
- [ ] Author bio page for each byline, with a photo, role and profile links
- [ ] Confirm the facts in .agents/aio-seo/offsite/entity-facts.md are correct

## Schedules
- [ ] Run the skills by hand on your own rhythm (for example `/aio-seo:blog` weekly, `/aio-seo:indexing health` weekly, `/aio-seo:audit` monthly), or schedule them with Pro (`/aio-seo-pro:autopilot`)
```
