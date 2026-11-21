// Edge Function „herkunft“: berechnet das Herkunftssiegel serverseitig und speichert es.
// Nur hier darf das Siegel gesetzt werden (spb_pruefung_speichern ist nur für service_role freigegeben).
// Quelle des Algorithmus: api/_lib/herkunft.js (Kopie per build.py).
import { pruefe } from "./herkunft.js";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization, apikey", "Content-Type": "application/json" };

async function rpc(fn: string, args: unknown) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: SR, Authorization: `Bearer ${SR}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  const t = await r.text(); let j: any; try { j = JSON.parse(t); } catch { j = t; }
  if (!r.ok) throw new Error((j && j.message) || `Datenbankfehler ${r.status}`);
  return j;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ fehler: "POST erwartet" }), { status: 405, headers: CORS });
  try {
    const a = await req.json();
    const auskunft = ["selbst_erzaehlt", "mit_ki", "ki_erzaehlt"].includes(a.selbstauskunft) ? a.selbstauskunft : null;
    const einreichen = a.einreichen === true;
    if (einreichen && !auskunft) throw new Error("Zum Einreichen ist eine Selbstauskunft nötig.");
    const d = await rpc("spb_buch_daten", { p_buch: a.buch_id, p_key: a.schluessel });
    const e: any = pruefe(d, auskunft);
    if (e.fehler) return new Response(JSON.stringify(e), { headers: CORS });
    const { schwaechste_saetze, ...speichern } = e;
    await rpc("spb_pruefung_speichern", { p_buch: a.buch_id, p_key: a.schluessel, p_ergebnis: speichern, p_selbstauskunft: auskunft, p_einreichen: einreichen });
    return new Response(JSON.stringify({ ...e, eingereicht: einreichen }), { headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ fehler: String((err as Error).message || err) }), { status: 400, headers: CORS });
  }
});
