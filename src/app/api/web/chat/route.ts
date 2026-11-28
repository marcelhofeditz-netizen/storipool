import { createClient } from '@/lib/supabase';
import { pruefeVerlauf } from '@/lib/app-chat';
import { chatFehlerText, chatLauf, kiAktiv } from '@/lib/chat-lauf';
import { clientIp, rateLimit, requestOrigin } from '@/lib/http';
import type { ConnectorSession } from '@/lib/session';
import { WEB_ANON_MAX_NACHRICHTEN, anonymSperre, anonymWerkzeug, webOriginErlaubt, webSystem, zaehleNutzerNachrichten } from '@/lib/web-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Chat auf selfpublishbot.de und in der Web-App /app. Ohne Anmeldung: nur Beraten (begrenzt).
 * Mit Anmeldung (Login-Cookie): alle Werkzeuge wie in der App.
 * Verlauf liegt nur im Browser.
 */
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

const aktiv = () => kiAktiv() && process.env.SELFPUBLISHBOT_WEB_CHAT !== '0';
const anonAktiv = () => process.env.SELFPUBLISHBOT_WEB_ANON !== '0';
const model = (angemeldet: boolean) =>
  (angemeldet ? undefined : process.env.SELFPUBLISHBOT_WEB_ANON_MODEL) || process.env.SELFPUBLISHBOT_WEB_MODEL || process.env.SELFPUBLISHBOT_APP_MODEL || 'claude-sonnet-5-5';

async function webNutzer(): Promise<{ id: string; email: string | null } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email ?? null } : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const u = await webNutzer();
  return json(200, { aktiv: aktiv() && (!!u || anonAktiv()), angemeldet: !!u, email: u?.email ?? null, beta: true });
}

export async function POST(req: Request) {
  if (!webOriginErlaubt(req.headers.get('origin'), requestOrigin(req), process.env.NODE_ENV !== 'production')) return json(403, { error: 'Nicht erlaubt.' });
  if (!aktiv()) return json(503, { error: 'Der Chat ist gerade nicht verfügbar.' });

  const ip = clientIp(req);
  const u = await webNutzer();
  if (!u && !anonAktiv()) return json(401, { error: 'Bitte melde dich an, um den Chat zu nutzen.', login_noetig: true });

  let body: unknown;
  try { body = await req.json(); } catch { return json(400, { error: 'Ungültige Anfrage.' }); }
  const v = pruefeVerlauf((body as { messages?: unknown } | null)?.messages);
  if (!v.ok) return json(400, { error: v.error });

  if (u) {
    if (!rateLimit(`web-chat:${u.id}`, 20, 60_000)) return json(429, { error: 'Zu viele Nachrichten – bitte kurz warten.' });
  } else {
    if (!rateLimit(`web-anon-min:${ip}`, 8, 60_000)) return json(429, { error: 'Zu viele Nachrichten – bitte kurz warten.' });
    if (!rateLimit(`web-anon-tag:${ip}`, 80, 24 * 60 * 60_000)) return json(429, { error: 'Für heute ist das Limit ohne Anmeldung erreicht. Melde dich kurz an, dann geht es weiter.', login_noetig: true });
    if (zaehleNutzerNachrichten(v.messages) > WEB_ANON_MAX_NACHRICHTEN) return json(401, { error: 'Um weiterzumachen, melde dich bitte kurz an – dein Chat bleibt erhalten.', login_noetig: true });
  }

  const session: ConnectorSession = u
    ? { userId: u.id, email: u.email, clientKind: 'web', tokenId: 'web' }
    : { userId: '', email: null, clientKind: 'web', tokenId: 'web-anon' };

  try {
    const r = await chatLauf({
      session, messages: v.messages, system: webSystem(!!u), model: model(!!u), maxTokens: u ? 4096 : 2048,
      ...(u ? {} : { werkzeugFilter: anonymWerkzeug, aufrufSperre: (name: string) => anonymSperre(name) }),
    });
    return json(200, { neu: r.neu, antwort: r.antwort, links: r.links, login_noetig: !u && r.gesperrt });
  } catch (e) {
    console.error('[web-chat] Fehler', { angemeldet: !!u, error: e instanceof Error ? e.message : String(e) });
    return json(502, { error: chatFehlerText(e) });
  }
}
