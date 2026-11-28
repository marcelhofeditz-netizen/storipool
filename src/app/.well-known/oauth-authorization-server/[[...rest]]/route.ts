import { CORS_HEADERS, requestOrigin } from '@/lib/http';
import { oauthMetadata } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

/** RFC 8414: Metadaten des Anmeldeservers */
export function GET(req: Request) {
  return Response.json(oauthMetadata(requestOrigin(req)), { headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=3600' } });
}
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
