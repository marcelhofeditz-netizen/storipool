import { authenticate } from '@/lib/session';
import { APP_SYSTEM, pruefeVerlauf } from '@/lib/app-chat';
import { chatFehlerText, chatLauf, kiAktiv } from '@/lib/chat-lauf';
import { rateLimit } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Chat der Selfpublishbot-App (iOS/Android). Anmeldung wie beim Connector (OAuth-Token der App).
 * Claude bekommt exakt die Connector-Werkzeuge (In-Process-MCP). Der Verlauf wird
 * nur in dieser Anfrage verarbeitet – nichts davon wird gespeichert oder protokolliert.
 */
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

const MODEL = () => process.env.SELFPUBLISHBOT_APP_MODEL || 'claude-sonnet-5-5';

export async function POST(req: Request) {
  if (!kiAktiv()) return json(503, { error: 'Der App-Chat ist noch nicht freigeschaltet.' });
  const auth = await authenticate(req);
  if (!auth.ok) return json(auth.status, { error: auth.error });
  if (!rateLimit(`app-chat:${auth.session.userId}`, 20, 60_000)) return json(429, { error: 'Zu viele Nachrichten – bitte kurz warten.' });

  let body: unknown;
  try { body = await req.json(); } catch { return json(400, { error: 'Ungültige Anfrage.' }); }
  const v = pruefeVerlauf((body as { messages?: unknown } | null)?.messages);
  if (!v.ok) return json(400, { error: v.error });

  try {
    const r = await chatLauf({ session: { ...auth.session, clientKind: 'app' }, messages: v.messages, system: APP_SYSTEM, model: MODEL(), maxTokens: 4096 });
    return json(200, { neu: r.neu, antwort: r.antwort, links: r.links });
  } catch (e) {
    console.error('[app-chat] Fehler', { user: auth.session.userId, error: e instanceof Error ? e.message : String(e) });
    return json(502, { error: chatFehlerText(e) });
  }
}
