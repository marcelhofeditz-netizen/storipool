import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient, createServiceClient } from '@/lib/supabase';
import { requestOrigin } from '@/lib/http';
import { clientLabel, isValidResource, loadClient, parseAuthorizeParams, redirectMatches } from '@/lib/oauth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'KI verbinden · Selfpublishbot', robots: { index: false, follow: false }, referrer: 'no-referrer' };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

/** Zustimmung „KI verbinden“: Claude/ChatGPT schicken den Nutzer hierher, ohne Login erst /login. */
export default async function AuthorizePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const fail = (
    <>
      <div className="eyebrow">KI verbinden</div>
      <h1>Das hat nicht geklappt</h1>
      <p>Die Anfrage ist ungültig oder abgelaufen. Bitte starte die Verbindung in Claude oder ChatGPT neu.</p>
    </>
  );
  const params = parseAuthorizeParams((k) => one(sp[k]));
  if ('error' in params) return fail;
  const origin = requestOrigin(new Request('https://www.selfpublishbot.de/oauth/authorize', { headers: await headers() }));
  if (!isValidResource(params.resource, origin)) return fail;
  const client = await loadClient(createServiceClient(), params.clientId);
  if (!client || !redirectMatches(params.redirectUri, client.redirect_uris)) return fail;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) { const x = one(v); if (x !== null) qs.set(k, x); }
    redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${qs.toString()}`)}`);
  }
  const name = clientLabel(client.client_name);
  const host = (() => { try { return new URL(params.redirectUri).host || params.redirectUri; } catch { return params.redirectUri; } })();
  const hidden: Record<string, string> = {
    client_id: params.clientId, redirect_uri: params.redirectUri, code_challenge: params.codeChallenge,
    state: params.state ?? '', scope: params.scope ?? '', resource: params.resource ?? '',
  };
  return (
    <>
      <div className="eyebrow">KI verbinden</div>
      <h1>{name} mit Selfpublishbot verbinden?</h1>
      <p>{name} darf dann für dich:</p>
      <ul>
        <li>deine Bücher anlegen, Kapitel speichern und lesen,</li>
        <li>deine erzählten Rohtexte als Herkunftsnachweis sichern,</li>
        <li>auf deinen ausdrücklichen Wunsch ein Buch bei der Bibliothek einreichen.</li>
      </ul>
      <p className="muted">Deine Bücher bleiben privat, bis du selbst einreichst. Die Rechte an deinem Buch bleiben bei dir.</p>
      <p className="muted">Konto: {user.email} · Rücksprung zu {host}</p>
      <form method="post" action="/api/oauth/authorize" className="row">
        {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <button type="submit" name="decision" value="allow" className="btn solid">Erlauben</button>
        <button type="submit" name="decision" value="deny" className="btn">Ablehnen</button>
      </form>
      <p className="muted">Trennen kannst du die Verbindung jederzeit unter <a href="/app#konto">Konto</a>.</p>
    </>
  );
}
