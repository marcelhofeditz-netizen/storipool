import { createServiceClient } from '@/lib/supabase';
import { CORS_HEADERS, clientIp, rateLimit, requestOrigin } from '@/lib/http';
import { isValidResource, issueTokenPair, loadClient, refreshTokens, sha256, verifyPkce } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

const HEADERS = { ...CORS_HEADERS, 'Cache-Control': 'no-store', Pragma: 'no-cache' };
const err = (error: string, description: string, status = 400) => Response.json({ error, error_description: description }, { status, headers: HEADERS });

async function readBody(req: Request): Promise<Record<string, string>> {
  if ((req.headers.get('content-type') ?? '').includes('application/json')) {
    const j = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, typeof v === 'string' ? v : '']));
  }
  return Object.fromEntries(new URLSearchParams(await req.text().catch(() => '')).entries());
}

/** Token-Endpunkt: authorization_code (PKCE, einmalig, 5 Min.) und rotierendes refresh_token. */
export async function POST(req: Request) {
  if (!rateLimit(`token:${clientIp(req)}`, 30, 60_000)) return err('rate_limited', 'Zu viele Anfragen.', 429);
  const b = await readBody(req);
  const origin = requestOrigin(req);
  if (b.resource && !isValidResource(b.resource, origin)) return err('invalid_target', 'resource passt nicht.');
  const db = createServiceClient();

  if (b.grant_type === 'refresh_token') {
    if (!b.refresh_token || !b.client_id) return err('invalid_request', 'refresh_token und client_id sind Pflicht.');
    try {
      const r = await refreshTokens(db, { refreshToken: b.refresh_token, clientId: b.client_id, resource: b.resource || null, origin });
      return r.ok ? Response.json(r.tokens, { headers: HEADERS }) : err(r.error, r.description, r.error === 'invalid_client' ? 401 : 400);
    } catch { return err('server_error', 'Token konnte nicht erneuert werden.', 500); }
  }
  if (b.grant_type !== 'authorization_code') return err('unsupported_grant_type', 'Nur authorization_code und refresh_token.');
  if (!b.code || !b.client_id || !b.redirect_uri) return err('invalid_request', 'code, client_id und redirect_uri sind Pflicht.');

  const now = new Date().toISOString();
  const { data: rows } = await db.from('oauth_codes').update({ used_at: now })
    .eq('code_hash', sha256(b.code)).is('used_at', null).gt('expires_at', now)
    .select('client_id, user_id, redirect_uri, code_challenge, resource');
  const code = (rows ?? [])[0] as { client_id: string; user_id: string; redirect_uri: string; code_challenge: string; resource: string | null } | undefined;
  if (!code) return err('invalid_grant', 'Code ungültig, abgelaufen oder bereits verwendet.');
  if (code.client_id !== b.client_id || code.redirect_uri !== b.redirect_uri) return err('invalid_grant', 'Code passt nicht zu Client oder Rücksprungadresse.');
  if (!verifyPkce(b.code_verifier, code.code_challenge)) return err('invalid_grant', 'PKCE-Prüfung fehlgeschlagen.');
  if (b.resource && code.resource && b.resource.replace(/\/+$/, '') !== code.resource.replace(/\/+$/, '')) return err('invalid_target', 'resource weicht von der Anmeldung ab.');
  const client = await loadClient(db, code.client_id);
  if (!client) return err('invalid_client', 'Client unbekannt.');
  try {
    return Response.json(await issueTokenPair(db, code.user_id, client, { resource: code.resource ?? (b.resource || null) }), { headers: HEADERS });
  } catch { return err('server_error', 'Token konnte nicht ausgestellt werden.', 500); }
}
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
