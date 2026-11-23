# WordPress: implementing the foundations

On WordPress most foundations are plugin settings, not code. The agent cannot click through wp-admin, so split the work:
- **Settings** go into the PR description (or a `docs/seo-settings.md` file in the PR) as an exact, ordered checklist for a human, with the expected result of each step and how to verify it with `check-site.mjs`.
- **Code** (only if the repo contains `wp-content/`: a theme, child theme or must-use plugin) goes into the PR as usual. Prefer a small must-use plugin `wp-content/mu-plugins/aio-seo.php` over editing a third-party theme.

Plugin features change between versions. Before naming a setting, ask which SEO plugin and version is installed (or read `wp-content/plugins/` in the repo) and check that plugin's current documentation. Do not tell the user a feature exists unless you confirmed it in their version; otherwise phrase it as "check whether your version offers X".

## Pick one SEO plugin

Exactly one of Yoast SEO, Rank Math or All in One SEO should own titles, canonicals, sitemaps and schema. Two active SEO plugins produce duplicate tags and conflicting JSON-LD graphs. If check-site shows two canonical tags or two Organization nodes with different `@id`s, this is the likely cause.

## Checklist mapping

| Item | Where on WordPress |
|---|---|
| Canonical host (A1) | Settings, General: WordPress Address and Site Address both equal `project.site_url`. Host or CDN redirects for the other host and http. |
| Canonical tags (A2) | The SEO plugin outputs them; check-site confirms one self-referencing canonical. |
| robots.txt (A3 to A7) | WordPress serves a virtual robots.txt unless a physical `robots.txt` exists in the web root. Use the SEO plugin's robots.txt editor if it has one, or the mu-plugin `robots_txt` filter below. Write the groups from `crawler-policy.md`. |
| Private paths and noindex pages (A4, A9) | Per-page "noindex" in the SEO plugin for thank-you, landing and utility pages; noindex for tag, author or date archives only if they are thin; never noindex the blog index. |
| Sitemap (A10, A11) | WordPress core serves `/wp-sitemap.xml`; SEO plugins usually replace it with their own index. Exclude noindex content types and taxonomies. `lastmod` should come from post modified dates: check that a site-wide change (theme update) does not reset every date. |
| Titles and descriptions (B1, B2) | Plugin templates for each post type plus per-page overrides; run check-site and fix the pages it lists. |
| JSON-LD (C1, C2) | The SEO plugin's schema graph. Set the organisation name, logo and social profiles (`sameAs`) from config `entity`; set the entity line as the site description where the plugin allows. Remove theme or page-builder schema that duplicates it. Never enable review or rating schema for the business's own products or services. |
| llms.txt (C3, C4) | Check whether the installed SEO plugin can generate llms.txt; if not, the mu-plugin below serves one built from published pages. Keep it short. |
| Markdown mirror (C5) | Usually skip on WordPress (low value, no evidence of benefit). If wanted, the mu-plugin can serve `?format=md` from post content converted to markdown. |
| Verification (D1, D2) | DNS for Search Console (Domain property) and Bing; otherwise the SEO plugin's webmaster verification fields. |
| IndexNow (D4, D5) | Use one IndexNow integration only: Microsoft's IndexNow plugin, or the SEO plugin's own IndexNow option if the installed version has one, or Cloudflare's crawler hints if the site is on Cloudflare. These submit on publish and update, which meets D5. Record which one in config `indexing`. |
| CI guard rails (E1, E2) | Only if the repo has CI: run `check-site.mjs` against staging and a Lighthouse budget. |

## Must-use plugin skeleton

```php
<?php
/**
 * Plugin Name: AIO SEO foundations
 * Description: robots.txt AI crawler groups and llms.txt, from .agents/aio-seo/config.json decisions.
 */

// robots.txt: replace the virtual file's body. Ignored if a physical robots.txt exists.
add_filter('robots_txt', function ($output, $public) {
    if (!$public) return $output; // "Discourage search engines" is on: leave WordPress's block in place.
    $private = ['/wp-admin/', '/cart/', '/checkout/', '/my-account/']; // from project.private_paths
    $allowed = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'DuckAssistBot', 'ChatGPT-User',
        'Claude-User', 'Perplexity-User', 'MistralAI-User', 'GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'];
    $blocked = ['CCBot', 'Bytespider', 'meta-externalagent', 'Amazonbot']; // from config crawlers
    $lines = ['User-agent: *', 'Allow: /', 'Allow: /wp-admin/admin-ajax.php'];
    foreach ($private as $p) $lines[] = "Disallow: $p";
    $lines[] = 'Content-Signal: search=yes, ai-input=yes, ai-train=yes';
    $lines[] = '';
    foreach ($allowed as $ua) $lines[] = "User-agent: $ua";
    $lines[] = 'Allow: /';
    foreach ($private as $p) $lines[] = "Disallow: $p";
    $lines[] = '';
    foreach ($blocked as $ua) $lines[] = "User-agent: $ua";
    $lines[] = 'Disallow: /';
    $lines[] = '';
    $lines[] = 'Sitemap: ' . home_url('/sitemap_index.xml'); // the sitemap URL the SEO plugin actually serves
    return implode("\n", $lines) . "\n";
}, 100, 2);

// llms.txt from published pages and recent posts.
add_action('init', function () {
    $path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '', '/');
    if ($path !== 'llms.txt') return;
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Robots-Tag: noindex');
    $out = ['# ' . get_bloginfo('name'), '', '> ' . get_bloginfo('description'), '', '## Pages'];
    foreach (get_pages(['sort_column' => 'menu_order']) as $p) {
        if (get_post_meta($p->ID, '_yoast_wpseo_meta-robots-noindex', true) === '1') continue; // adapt to the SEO plugin's noindex meta key
        $out[] = sprintf('- [%s](%s)', get_the_title($p), get_permalink($p));
    }
    $out[] = '';
    $out[] = '## Posts';
    foreach (get_posts(['numberposts' => 50]) as $p) $out[] = sprintf('- [%s](%s): %s', get_the_title($p), get_permalink($p), wp_strip_all_tags(get_the_excerpt($p)));
    echo implode("\n", $out) . "\n";
    exit;
});
```

Adapt before shipping: the private paths, crawler lists and Content-Signal from config; the sitemap URL the SEO plugin serves; the noindex meta key of the installed SEO plugin. Set the WordPress tagline (Settings, General) to the entity line so `get_bloginfo('description')` matches it, or hard-code `config.entity.entity_line`. Test on staging with `check-site.mjs`.

## Verify

Run `check-site.mjs` against staging or production after the human applies the settings, and attach the before and after summaries to the run log.
