import { CORS_HEADERS, requestOrigin } from '@/lib/http';
import { resourceMetadata } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

/** RFC 9728: Wo meldet man sich für /mcp an? */
export function GET(req: Request) {
  return Response.json(resourceMetadata(requestOrigin(req)), { headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=3600' } });
}
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
