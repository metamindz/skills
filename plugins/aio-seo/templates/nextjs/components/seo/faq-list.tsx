import { faqPageJsonLd, type Faq } from '../../lib/seo/jsonld';
import { JsonLd } from './json-ld';

/**
 * Visible FAQ as native disclosure widgets (keyboard operable, no JavaScript), with optional FAQPage
 * JSON-LD built from the same array so the markup always matches what people see. Google no longer
 * shows FAQ rich results, so `withJsonLd` defaults to false; the questions themselves are the value.
 * Style with the className props to match the site.
 */
export function FaqList({
  faqs,
  path,
  headingLevel = 3,
  withJsonLd = false,
  className,
  itemClassName,
}: {
  faqs: Faq[];
  path?: string;
  headingLevel?: 2 | 3 | 4;
  withJsonLd?: boolean;
  className?: string;
  itemClassName?: string;
}) {
  const H = (`h${headingLevel}` as 'h2' | 'h3' | 'h4');
  return (
    <>
      <div className={className}>
        {faqs.map((f) => (
          <details key={f.q} className={itemClassName}>
            <summary>
              <H style={{ display: 'inline' }}>{f.q}</H>
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
      {withJsonLd && faqs.length > 0 ? <JsonLd data={faqPageJsonLd(faqs, path)} /> : null}
    </>
  );
}
