import { createServiceClient } from '@/lib/supabase';
import { kontoLoeschen } from '@/lib/konto-loeschen';
import { SELFPUBLISHBOT_MCP_URL } from '@/lib/info';
import { json, nutzerAusAnfrage } from '@/lib/web-nutzer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = await nutzerAusAnfrage(req);
  if (!u) return json(401, { error: 'Bitte anmelden.' });
  const { data: tokens } = await createServiceClient().from('api_tokens').select('client_kind').eq('user_id', u.id).is('revoked_at', null).in('client_kind', ['claude', 'chatgpt']);
  const ki = [...new Set(((tokens ?? []) as { client_kind: string }[]).map((t) => t.client_kind))];
  return json(200, { email: u.email, connector: { url: SELFPUBLISHBOT_MCP_URL, verbunden: ki } });
}

/** Konto löschen – nur mit { bestaetigt: true } nach ausdrücklicher Bestätigung; löscht alle Bücher */
export async function DELETE(req: Request) {
  const u = await nutzerAusAnfrage(req, true);
  if (!u) return json(401, { error: 'Bitte anmelden.' });
  const b = (await req.json().catch(() => null)) as { bestaetigt?: unknown } | null;
  if (b?.bestaetigt !== true) return json(400, { error: 'Bitte das Löschen ausdrücklich bestätigen.', bestaetigung_erforderlich: true });
  try {
    await kontoLoeschen(u.id);
    return json(200, { geloescht: true });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : 'Löschen fehlgeschlagen.' });
  }
}
