// Nur serverseitig: Bearer-Token des Connectors prüfen.
import { createServiceClient } from './supabase';
import { bearerToken, sha256 } from './oauth';
import { rateLimit } from './http';

export interface ConnectorSession { userId: string; email: string | null; clientKind: string | null; tokenId: string }
export type AuthResult = { ok: true; session: ConnectorSession } | { ok: false; status: 401 | 429 | 503; error: string };

export const RATE_LIMIT_PER_MINUTE = 60;

export async function authenticate(req: Request): Promise<AuthResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, status: 503, error: 'Selfpublishbot ist noch nicht eingerichtet.' };
  const token = bearerToken(req.headers.get('authorization'));
  if (!token) return { ok: false, status: 401, error: 'Anmeldung erforderlich.' };
  const db = createServiceClient();
  const { data } = await db.from('api_tokens').select('id, user_id, client_kind, expires_at, revoked_at').eq('token_hash', sha256(token)).maybeSingle();
  const row = data as { id: string; user_id: string; client_kind: string | null; expires_at: string | null; revoked_at: string | null } | null;
  if (!row || row.revoked_at || (row.expires_at && new Date(row.expires_at).getTime() < Date.now())) {
    return { ok: false, status: 401, error: 'Token ungültig oder abgelaufen.' };
  }
  if (!rateLimit(`mcp:${row.id}`, RATE_LIMIT_PER_MINUTE, 60_000)) return { ok: false, status: 429, error: 'Zu viele Anfragen – bitte kurz warten.' };
  const { data: u } = await db.auth.admin.getUserById(row.user_id);
  if (!u?.user || (u.user as { banned_until?: string | null }).banned_until) return { ok: false, status: 401, error: 'Konto nicht aktiv.' };
  void db.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', row.id).then(() => undefined, () => undefined);
  return { ok: true, session: { userId: row.user_id, email: u.user.email ?? null, clientKind: row.client_kind, tokenId: row.id } };
}
