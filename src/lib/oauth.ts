// OAuth 2.1 für den Selfpublishbot-Connector (Authorization Code + PKCE S256, dynamische
// Client-Registrierung, rotierende Refresh-Tokens). Reine Funktionen oben, DB unten.
import { createHash, randomBytes, randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export const OAUTH_SCOPE = 'mcp';
export const OFFLINE_SCOPE = 'offline_access';
export const CODE_TTL_SECONDS = 300;
export const ACCESS_TOKEN_TTL_SECONDS = 24 * 3600;
export const REFRESH_TOKEN_TTL_SECONDS = 90 * 86_400;
export const REFRESH_REUSE_GRACE_SECONDS = 60;
const MAX_ACTIVE_TOKENS = 10;

export const ACCESS_PREFIX = 'ebt_';
export const REFRESH_PREFIX = 'ebr_';

export const sha256 = (v: string) => createHash('sha256').update(v, 'utf8').digest('hex');
export const newClientId = () => `ebc_${randomBytes(16).toString('base64url')}`;
export const newCode = () => randomBytes(32).toString('base64url');
export const newAccessToken = () => `${ACCESS_PREFIX}${randomBytes(32).toString('base64url')}`;
export const newRefreshToken = () => `${REFRESH_PREFIX}${randomBytes(32).toString('base64url')}`;
export const looksLikeAccessToken = (v: unknown): v is string => typeof v === 'string' && /^ebt_[A-Za-z0-9_-]{43}$/.test(v);
export const looksLikeRefreshToken = (v: unknown): v is string => typeof v === 'string' && /^ebr_[A-Za-z0-9_-]{43}$/.test(v);

export function bearerToken(authorization: string | null): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(authorization ?? '');
  return m && looksLikeAccessToken(m[1]) ? m[1] : null;
}

export const mcpResourceUrl = (origin: string) => `${origin}/mcp`;
export const resourceMetadataUrl = (origin: string) => `${origin}/.well-known/oauth-protected-resource/mcp`;

export function oauthMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    // Schlank wie beim Trainingsbot (OpenAI-App-Verzeichnis nimmt sonst den alten Portal-Rücksprung):
    // offline_access wird weiter akzeptiert, resource weiter geprüft, aber nicht beworben.
    scopes_supported: [OAUTH_SCOPE],
  };
}

export function resourceMetadata(origin: string) {
  return {
    resource: mcpResourceUrl(origin),
    authorization_servers: [origin],
    bearer_methods_supported: ['header'],
    scopes_supported: [OAUTH_SCOPE],
    resource_name: 'Selfpublishbot',
  };
}

/** RFC 8707: fehlt resource, ist das ok; sonst muss er unseren Connector meinen. */
export function isValidResource(resource: string | null | undefined, origin: string): boolean {
  if (resource == null || resource === '') return true;
  let u: URL;
  try { u = new URL(resource); } catch { return false; }
  if (u.hash || u.search || u.username || u.password) return false;
  const o = new URL(origin);
  if (u.protocol !== o.protocol || u.host !== o.host) return false;
  const path = u.pathname.replace(/\/+$/, '');
  return path === '' || path === '/mcp' || path === '/api/mcp';
}

export type OAuthClientKind = 'claude' | 'chatgpt' | 'other';

/** Web-Rücksprungadressen nur für bekannte KI-Clients (keine offenen Weiterleitungen). */
export const REDIRECT_HOSTS: Readonly<Record<string, OAuthClientKind>> = {
  'claude.ai': 'claude',
  'claude.com': 'claude',
  'chatgpt.com': 'chatgpt',
  'chat.openai.com': 'chatgpt',
  'platform.openai.com': 'chatgpt',
  'vscode.dev': 'other',
  'insiders.vscode.dev': 'other',
};
const LOOPBACK = ['localhost', '127.0.0.1', '[::1]'];

export function isAllowedRedirectUri(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 500) return false;
  let u: URL;
  try { u = new URL(v); } catch { return false; }
  if (u.hash) return false;
  if (u.protocol === 'https:') return !u.port && !u.username && !u.password && Object.hasOwn(REDIRECT_HOSTS, u.hostname);
  if (u.protocol === 'http:') return LOOPBACK.includes(u.hostname);
  if (['javascript:', 'data:', 'file:', 'vbscript:', 'blob:', 'about:', 'ftp:', 'ws:', 'wss:'].includes(u.protocol)) return false;
  return /^[a-z][a-z0-9+.-]*:$/.test(u.protocol);
}

export function clientKindFor(redirectUris: readonly string[], clientName?: string | null): OAuthClientKind {
  for (const r of redirectUris) {
    try { const k = REDIRECT_HOSTS[new URL(r).hostname]; if (k && k !== 'other') return k; } catch { /* weiter */ }
  }
  const n = (clientName ?? '').toLowerCase();
  if (/chatgpt|openai/.test(n)) return 'chatgpt';
  if (/claude|anthropic/.test(n)) return 'claude';
  return 'other';
}

export function redirectMatches(requested: string, registered: readonly string[]): boolean {
  if (registered.includes(requested)) return true;
  let r: URL;
  try { r = new URL(requested); } catch { return false; }
  if (r.protocol !== 'http:' || !LOOPBACK.includes(r.hostname)) return false;
  return registered.some((x) => {
    try { const g = new URL(x); return g.protocol === 'http:' && g.hostname === r.hostname && g.pathname === r.pathname && g.search === r.search; } catch { return false; }
  });
}

export function verifyPkce(verifier: unknown, challenge: string): boolean {
  if (typeof verifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false;
  return createHash('sha256').update(verifier).digest('base64url') === challenge;
}
export const isPkceChallenge = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v);

export function clientLabel(name: string | null | undefined): string {
  const n = (name ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40);
  return n || 'KI-Assistent';
}

export interface AuthorizeParams { clientId: string; redirectUri: string; codeChallenge: string; state: string | null; scope: string | null; resource: string | null }

export function parseAuthorizeParams(get: (k: string) => string | null | undefined): AuthorizeParams | { error: string } {
  if (get('response_type') !== 'code') return { error: 'unsupported_response_type' };
  const clientId = get('client_id');
  const redirectUri = get('redirect_uri');
  const challenge = get('code_challenge');
  if (!clientId) return { error: 'invalid_client' };
  if (!isAllowedRedirectUri(redirectUri)) return { error: 'invalid_redirect_uri' };
  if ((get('code_challenge_method') ?? 'S256') !== 'S256' || !isPkceChallenge(challenge)) return { error: 'invalid_pkce' };
  const state = get('state');
  return {
    clientId, redirectUri, codeChallenge: challenge,
    state: state ? state.slice(0, 8192) : null, // ChatGPT schickt lange state-Werte (~700 Zeichen) – nie kürzen, sonst scheitert deren Prüfung still
    scope: get('scope')?.slice(0, 200) ?? null,
    resource: get('resource')?.slice(0, 300) ?? null,
  };
}

// ---- Datenbank (nur Service-Client) ----

export interface OAuthClient { client_id: string; client_name: string | null; redirect_uris: string[]; client_kind: string | null }

export async function loadClient(db: SupabaseClient, clientId: string): Promise<OAuthClient | null> {
  const { data } = await db.from('oauth_clients').select('client_id, client_name, redirect_uris, client_kind').eq('client_id', clientId).maybeSingle();
  return (data as OAuthClient | null) ?? null;
}

export interface TokenPair { access_token: string; token_type: 'Bearer'; expires_in: number; refresh_token: string; scope: string }

async function issueAccessToken(db: SupabaseClient, userId: string, client: OAuthClient) {
  const { data: active } = await db.from('api_tokens').select('id').eq('user_id', userId).is('revoked_at', null).order('created_at', { ascending: true });
  const rows = (active ?? []) as { id: string }[];
  const excess = rows.length - (MAX_ACTIVE_TOKENS - 1);
  if (excess > 0) await db.from('api_tokens').update({ revoked_at: new Date().toISOString() }).in('id', rows.slice(0, excess).map((r) => r.id));
  const token = newAccessToken();
  const { data, error } = await db.from('api_tokens').insert({
    user_id: userId,
    token_hash: sha256(token),
    token_prefix: token.slice(0, 10),
    label: clientLabel(client.client_name),
    oauth_client_id: client.client_id,
    client_kind: client.client_kind ?? clientKindFor(client.redirect_uris, client.client_name),
    expires_at: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
  }).select('id').single();
  if (error) throw error;
  await db.from('oauth_clients').update({ last_used_at: new Date().toISOString() }).eq('client_id', client.client_id);
  return { token, id: (data as { id: string }).id };
}

export async function issueTokenPair(db: SupabaseClient, userId: string, client: OAuthClient, opts: { resource: string | null; familyId?: string }): Promise<TokenPair> {
  const access = await issueAccessToken(db, userId, client);
  const refresh = newRefreshToken();
  const { error } = await db.from('oauth_refresh_tokens').insert({
    token_hash: sha256(refresh),
    family_id: opts.familyId ?? randomUUID(),
    api_token_id: access.id,
    client_id: client.client_id,
    user_id: userId,
    resource: opts.resource,
    expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
  });
  if (error) throw error;
  return { access_token: access.token, token_type: 'Bearer', expires_in: ACCESS_TOKEN_TTL_SECONDS, refresh_token: refresh, scope: `${OAUTH_SCOPE} ${OFFLINE_SCOPE}` };
}

export async function revokeRefreshFamily(db: SupabaseClient, familyId: string): Promise<void> {
  const now = new Date().toISOString();
  const { data } = await db.from('oauth_refresh_tokens').select('api_token_id').eq('family_id', familyId);
  const ids = ((data ?? []) as { api_token_id: string | null }[]).map((r) => r.api_token_id).filter((x): x is string => !!x);
  if (ids.length) await db.from('api_tokens').update({ revoked_at: now }).in('id', ids).is('revoked_at', null);
  await db.from('oauth_refresh_tokens').update({ used_at: now }).eq('family_id', familyId).is('used_at', null);
}

export type RefreshOutcome = { ok: true; tokens: TokenPair } | { ok: false; error: 'invalid_grant' | 'invalid_client' | 'invalid_target'; description: string };

export async function refreshTokens(db: SupabaseClient, input: { refreshToken: string; clientId: string; resource: string | null; origin: string }): Promise<RefreshOutcome> {
  if (!isValidResource(input.resource, input.origin)) return { ok: false, error: 'invalid_target', description: 'resource passt nicht.' };
  if (!looksLikeRefreshToken(input.refreshToken)) return { ok: false, error: 'invalid_grant', description: 'Refresh-Token ungültig.' };
  const hash = sha256(input.refreshToken);
  const now = new Date().toISOString();
  const { data: rows } = await db.from('oauth_refresh_tokens').update({ used_at: now })
    .eq('token_hash', hash).is('used_at', null).gt('expires_at', now)
    .select('family_id, api_token_id, client_id, user_id, resource');
  const row = (rows ?? [])[0] as { family_id: string; api_token_id: string | null; client_id: string; user_id: string; resource: string | null } | undefined;
  if (!row) {
    const { data: used } = await db.from('oauth_refresh_tokens').select('family_id, used_at').eq('token_hash', hash).maybeSingle();
    const u = used as { family_id: string; used_at: string | null } | null;
    if (u?.used_at && Date.now() - new Date(u.used_at).getTime() > REFRESH_REUSE_GRACE_SECONDS * 1000) await revokeRefreshFamily(db, u.family_id);
    return { ok: false, error: 'invalid_grant', description: 'Refresh-Token ungültig, abgelaufen oder bereits verwendet.' };
  }
  if (row.client_id !== input.clientId) {
    await revokeRefreshFamily(db, row.family_id);
    return { ok: false, error: 'invalid_grant', description: 'Refresh-Token gehört zu einem anderen Client.' };
  }
  if (row.api_token_id) {
    const { data: at } = await db.from('api_tokens').select('revoked_at').eq('id', row.api_token_id).maybeSingle();
    if (!at || (at as { revoked_at: string | null }).revoked_at) {
      await revokeRefreshFamily(db, row.family_id);
      return { ok: false, error: 'invalid_grant', description: 'Verbindung wurde getrennt – bitte neu verbinden.' };
    }
    await db.from('api_tokens').update({ revoked_at: now }).eq('id', row.api_token_id);
  }
  const client = await loadClient(db, row.client_id);
  if (!client) return { ok: false, error: 'invalid_client', description: 'Client unbekannt.' };
  const tokens = await issueTokenPair(db, row.user_id, client, { resource: row.resource ?? input.resource, familyId: row.family_id });
  await db.from('oauth_refresh_tokens').delete().lt('expires_at', new Date(Date.now() - 86_400_000).toISOString());
  return { ok: true, tokens };
}
