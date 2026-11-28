import { createServiceClient } from '@/lib/supabase';
import { CORS_HEADERS, clientIp, rateLimit } from '@/lib/http';
import { clientKindFor, clientLabel, isAllowedRedirectUri, newClientId } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

const err = (error: string, description: string, status = 400) =>
  Response.json({ error, error_description: description }, { status, headers: CORS_HEADERS });

/** RFC 7591: öffentliche Clients (Claude, ChatGPT) registrieren sich selbst; Zugriff erst nach Zustimmung. */
export async function POST(req: Request) {
  if (!rateLimit(`register:${clientIp(req)}`, 20, 3_600_000)) return err('rate_limited', 'Zu viele Registrierungen.', 429);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const uris = Array.isArray(b?.redirect_uris) ? (b!.redirect_uris as unknown[]) : [];
  if (!uris.length || uris.length > 5 || !uris.every(isAllowedRedirectUri)) return err('invalid_redirect_uri', 'redirect_uris fehlen oder sind nicht erlaubt.');
  if ((b?.token_endpoint_auth_method ?? 'none') !== 'none') return err('invalid_client_metadata', 'Nur öffentliche Clients.');
  const grants = Array.isArray(b?.grant_types) ? (b!.grant_types as unknown[]) : ['authorization_code'];
  if (!grants.every((g) => g === 'authorization_code' || g === 'refresh_token')) return err('invalid_client_metadata', 'Nur authorization_code und refresh_token.');

  const clientId = newClientId();
  const name = clientLabel(typeof b?.client_name === 'string' ? b.client_name : null);
  const { error } = await createServiceClient().from('oauth_clients').insert({
    client_id: clientId, client_name: name, redirect_uris: uris as string[], client_kind: clientKindFor(uris as string[], name),
  });
  if (error) return err('server_error', 'Registrierung fehlgeschlagen.', 500);
  return Response.json({
    client_id: clientId, client_id_issued_at: Math.floor(Date.now() / 1000), client_name: name, redirect_uris: uris,
    grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none',
  }, { status: 201, headers: CORS_HEADERS });
}
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
