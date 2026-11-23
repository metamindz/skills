import { serializeJsonLd, type JsonLd as JsonLdData } from '../../lib/seo/jsonld';

/**
 * Renders one structured-data block in the server HTML. Always pass builder output from
 * lib/seo/jsonld.ts; never hand-write JSON-LD in a page. Keep it in a Server Component: JSON-LD added
 * by client-side JavaScript is invisible to crawlers that do not run scripts.
 */
export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
