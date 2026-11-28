import { createClient, createServiceClient } from '@/lib/supabase';
import { requestOrigin } from '@/lib/http';
import { CODE_TTL_SECONDS, isValidResource, loadClient, newCode, parseAuthorizeParams, redirectMatches, sha256 } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

const back = (redirectUri: string, params: Record<string, string | null>) => {
  const u = new URL(redirectUri);
  // kein iss (Metadaten werben RFC 9207 nicht mehr) – wie Offmarketpool/Trainingsbot im OpenAI-Portal
  for (const [k, v] of Object.entries(params)) if (v && k !== 'iss') u.searchParams.set(k, v);
  return Response.redirect(u.toString(), 303);
};

/** Entscheidung der Zustimmungsseite: Erlauben → einmaliger Code (PKCE), Ablehnen → access_denied. Nutzer aus der Sitzung. */
export async function POST(req: Request) {
  const origin = requestOrigin(req);
  const form = await req.formData().catch(() => null);
  if (!form) return new Response('Ungültige Anfrage', { status: 400 });
  const get = (k: string) => { const v = form.get(k); return typeof v === 'string' && v !== '' ? v : null; };
  const params = parseAuthorizeParams((k) => (k === 'response_type' ? 'code' : k === 'code_challenge_method' ? 'S256' : get(k)));
  if ('error' in params) return new Response('Ungültige Anfrage', { status: 400 });

  const db = createServiceClient();
  const client = await loadClient(db, params.clientId);
  if (!client || !redirectMatches(params.redirectUri, client.redirect_uris)) return new Response('Ungültige Anfrage', { status: 400 });
  if (!isValidResource(params.resource, origin)) return back(params.redirectUri, { error: 'invalid_target', state: params.state, iss: origin });
  if (get('decision') !== 'allow') return back(params.redirectUri, { error: 'access_denied', state: params.state, iss: origin });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.redirect(`${origin}/login`, 303);

  const code = newCode();
  const { error } = await db.from('oauth_codes').insert({
    code_hash: sha256(code), client_id: params.clientId, user_id: user.id, redirect_uri: params.redirectUri,
    code_challenge: params.codeChallenge, resource: params.resource,
    expires_at: new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString(),
  });
  if (error) return back(params.redirectUri, { error: 'server_error', state: params.state, iss: origin });
  await db.from('oauth_codes').delete().lt('expires_at', new Date(Date.now() - 86_400_000).toISOString());
  return back(params.redirectUri, { code, state: params.state, iss: origin });
}
