import { createServiceClient } from '@/lib/supabase';
import { buchStand, meineBuecher } from '@/lib/buecher';
import { json, nutzerAusAnfrage } from '@/lib/web-nutzer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Eigene Bücher (Liste) bzw. ?id= Stand eines eigenen Buchs – Web-App (Cookie) und App (Token). */
export async function GET(req: Request) {
  const u = await nutzerAusAnfrage(req);
  if (!u) return json(401, { error: 'Bitte anmelden.' });
  const db = createServiceClient();
  const id = new URL(req.url).searchParams.get('id');
  try {
    if (id) return json(200, await buchStand(db, u.id, id));
    return json(200, { buecher: await meineBuecher(db, u.id) });
  } catch (e) {
    return json(404, { error: e instanceof Error ? e.message : 'Nicht gefunden' });
  }
}
