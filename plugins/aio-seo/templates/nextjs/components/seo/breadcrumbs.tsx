import Link from 'next/link';
import { breadcrumbJsonLd, type Crumb } from '../../lib/seo/jsonld';
import { JsonLd } from './json-ld';

/**
 * Visible breadcrumb trail plus its BreadcrumbList JSON-LD, built from the same array.
 * The last item is the current page. Style with className to match the site.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={c.path}>
                {last ? (
                  <span aria-current="page">{c.name}</span>
                ) : (
                  <>
                    <Link href={c.path}>{c.name}</Link>
                    <span aria-hidden="true"> / </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
