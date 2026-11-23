import { LLMS_HEADERS, buildLlmsTxt } from '../../lib/seo/llms';

export const dynamic = 'force-static';

export function GET() {
  return new Response(buildLlmsTxt(), { headers: LLMS_HEADERS });
}
