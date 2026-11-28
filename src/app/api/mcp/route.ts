import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { authenticate } from '@/lib/session';
import { buildServer } from '@/lib/connector';
import { CORS_HEADERS, isAllowedOrigin, requestOrigin } from '@/lib/http';
import { resourceMetadataUrl } from '@/lib/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Selfpublishbot-Connector (www.selfpublishbot.de/mcp): zustandsloses Remote-MCP über Streamable HTTP. */
const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra } });

function browserHint(origin: string): Response {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Selfpublishbot-Connector</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;padding:48px 20px;line-height:1.6;color:#111;background:#fff}h1{font-size:24px;margin:0 0 12px}code{background:#f2f2f2;padding:2px 6px}a{color:#111;font-weight:600}</style></head>
<body><h1>Das ist die Connector-Adresse von Selfpublishbot</h1><p>Diese Adresse trägst du in Claude oder ChatGPT ein, nicht im Browser:</p><ol><li>Claude: Einstellungen → Connectors → Eigenen Connector hinzufügen → <code>${origin}/mcp</code></li><li>ChatGPT: Einstellungen → Apps &amp; Connectors → Erstellen → dieselbe Adresse</li><li>Mit deiner E-Mail anmelden – fertig.</li></ol><p><a href="${origin}/#verbinden">Zur Anleitung</a></p></body></html>`;
  return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function handle(req: Request): Promise<Response> {
  const own = requestOrigin(req);
  if (!isAllowedOrigin(req.headers.get('origin'), own)) return json(403, { jsonrpc: '2.0', error: { code: -32003, message: 'Origin nicht erlaubt' }, id: null });
  const auth = await authenticate(req);
  if (!auth.ok) {
    if (req.method === 'GET' && auth.status === 401 && (req.headers.get('accept') ?? '').includes('text/html')) return browserHint(own);
    const headers: Record<string, string> = { ...CORS_HEADERS };
    if (auth.status === 401) headers['WWW-Authenticate'] = `Bearer realm="selfpublishbot", resource_metadata="${resourceMetadataUrl(own)}"`;
    return json(auth.status, { jsonrpc: '2.0', error: { code: auth.status === 429 ? -32029 : -32001, message: auth.error }, id: null }, headers);
  }
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const server = buildServer(auth.session);
  try {
    await server.connect(transport);
    return await transport.handleRequest(req);
  } catch (e) {
    console.error('[mcp] Fehler', { user: auth.session.userId, error: e instanceof Error ? e.message : String(e) });
    return json(500, { jsonrpc: '2.0', error: { code: -32603, message: 'Interner Fehler' }, id: null });
  } finally {
    void server.close();
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
