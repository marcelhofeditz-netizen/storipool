// Nur serverseitig: Bücher, Kapitel, Rohtexte und Herkunftssiegel – immer an das Konto (user_id) gebunden.
import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import herkunft from '@/legacy/_lib/herkunft.js';
import { woerterZahl, type Selbstauskunft } from './info';

export interface Buch { id: string; titel: string; autor: string; genre: string | null; status: string; siegel: string | null; diktat_quote: number | null; selbstauskunft: string | null; pruefen: boolean; updated_at: string }
const SPALTEN = 'id, titel, autor, genre, status, siegel, diktat_quote, selbstauskunft, pruefen, updated_at';

export const MAX_BUECHER = 50;
export const MAX_KAPITEL_ZEICHEN = 200_000;
export const MAX_ROHTEXT_ZEICHEN = 100_000;

export async function meineBuecher(db: SupabaseClient, userId: string): Promise<Buch[]> {
  const { data, error } = await db.from('spb_buecher').select(SPALTEN).eq('user_id', userId).order('updated_at', { ascending: false }).limit(MAX_BUECHER);
  if (error) throw new Error('Bücher nicht lesbar');
  return (data ?? []) as Buch[];
}

/** Buch nur, wenn es diesem Konto gehört (sonst Fehler, nie fremde Bücher) */
export async function eigenesBuch(db: SupabaseClient, userId: string, buchId: string): Promise<Buch> {
  if (!/^[0-9a-f-]{36}$/i.test(buchId)) throw new Error('Unbekanntes Buch');
  const { data } = await db.from('spb_buecher').select(SPALTEN).eq('id', buchId).eq('user_id', userId).maybeSingle();
  if (!data) throw new Error('Unbekanntes Buch – mit selfpublishbot_meine_buecher nachsehen');
  if ((data as Buch).status === 'gesperrt') throw new Error('Dieses Buch ist gesperrt.');
  return data as Buch;
}

export async function buchAnlegen(db: SupabaseClient, userId: string, a: { titel: string; autor: string; genre?: string; email?: string | null }): Promise<Buch> {
  const { count } = await db.from('spb_buecher').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  if ((count ?? 0) >= MAX_BUECHER) throw new Error(`Höchstens ${MAX_BUECHER} Bücher je Konto.`);
  const { data, error } = await db.from('spb_buecher').insert({ user_id: userId, titel: a.titel.trim(), autor: a.autor.trim(), genre: a.genre ?? null, email: a.email ?? null, key_hash: null }).select(SPALTEN).single();
  if (error || !data) throw new Error('Buch konnte nicht angelegt werden');
  return data as Buch;
}

async function beruehren(db: SupabaseClient, buchId: string) {
  await db.from('spb_buecher').update({ updated_at: new Date().toISOString() }).eq('id', buchId);
}

export async function rohtextSichern(db: SupabaseClient, userId: string, buchId: string, text: string, quelle: 'diktat' | 'getippt' | 'eingefuegt') {
  await eigenesBuch(db, userId, buchId);
  const t = text.slice(0, MAX_ROHTEXT_ZEICHEN);
  if (!t.trim()) throw new Error('text fehlt');
  const { error } = await db.from('spb_rohtexte').insert({ buch_id: buchId, text: t, quelle });
  if (error) throw new Error('Rohtext nicht gespeichert');
  await beruehren(db, buchId);
  return { gesichert: true, woerter: woerterZahl(t) };
}

export async function kapitelSpeichern(db: SupabaseClient, userId: string, buchId: string, k: { nr: number; titel?: string; text: string }) {
  await eigenesBuch(db, userId, buchId);
  const { error } = await db.from('spb_kapitel').upsert({ buch_id: buchId, nr: k.nr, titel: k.titel ?? null, text: k.text.slice(0, MAX_KAPITEL_ZEICHEN), updated_at: new Date().toISOString() }, { onConflict: 'buch_id,nr' });
  if (error) throw new Error('Kapitel nicht gespeichert');
  await beruehren(db, buchId);
  return { gespeichert: true, nr: k.nr, woerter: woerterZahl(k.text) };
}

export async function kapitelLaden(db: SupabaseClient, buchId: string) {
  const { data } = await db.from('spb_kapitel').select('nr, titel, text, updated_at').eq('buch_id', buchId).order('nr');
  return (data ?? []) as { nr: number; titel: string | null; text: string; updated_at: string }[];
}

export async function buchStand(db: SupabaseClient, userId: string, buchId: string) {
  const buch = await eigenesBuch(db, userId, buchId);
  const kapitel = await kapitelLaden(db, buchId);
  const { data: roh } = await db.from('spb_rohtexte').select('text').eq('buch_id', buchId);
  return {
    buch,
    siegel_name: buch.siegel ? (herkunft.NAMEN as Record<string, string>)[buch.siegel] ?? null : null,
    kapitel: kapitel.map((k) => ({ nr: k.nr, titel: k.titel, woerter: woerterZahl(k.text) })),
    woerter_gesamt: kapitel.reduce((s, k) => s + woerterZahl(k.text), 0),
    rohtexte: (roh ?? []).length,
    woerter_rohtexte: (roh ?? []).reduce((s, r) => s + woerterZahl((r as { text: string }).text), 0),
  };
}

/** Herkunftssiegel berechnen (gleicher Algorithmus wie die Supabase-Funktion „herkunft“) und speichern */
export async function herkunftPruefen(db: SupabaseClient, userId: string, buchId: string, auskunft: Selbstauskunft | null, einreichen: boolean) {
  const buch = await eigenesBuch(db, userId, buchId);
  const kapitel = await kapitelLaden(db, buchId);
  const { data: roh } = await db.from('spb_rohtexte').select('text, quelle, created_at').eq('buch_id', buchId).order('created_at');
  const e = herkunft.pruefe({ kapitel, rohtexte: (roh ?? []).map((r) => ({ text: r.text, quelle: r.quelle, zeit: r.created_at })) }, auskunft);
  if (e.fehler) return e;
  const { schwaechste_saetze, ...speichern } = e;
  await db.from('spb_pruefungen').insert({ buch_id: buchId, ergebnis: speichern });
  const status = einreichen && buch.status === 'entwurf' ? 'eingereicht' : buch.status;
  await db.from('spb_buecher').update({
    selbstauskunft: auskunft ?? buch.selbstauskunft, siegel: e.siegel, diktat_quote: e.diktat_quote, pruefen: Boolean(e.pruefen), status, updated_at: new Date().toISOString(),
  }).eq('id', buchId);
  return { ...e, schwaechste_saetze, status };
}

/** Buch aus dem ersten Connector (buch_id + schluessel) ins Konto holen */
export async function buchUebernehmen(db: SupabaseClient, userId: string, buchId: string, schluessel: string) {
  if (!/^[0-9a-f-]{36}$/i.test(buchId)) throw new Error('Unbekanntes Buch');
  const hash = createHash('sha256').update(schluessel).digest('hex');
  const { data } = await db.from('spb_buecher').select('id, user_id, status').eq('id', buchId).eq('key_hash', hash).maybeSingle();
  if (!data || data.status === 'gesperrt') throw new Error('Buch oder Schlüssel ungültig');
  if (data.user_id && data.user_id !== userId) throw new Error('Dieses Buch gehört schon zu einem anderen Konto.');
  await db.from('spb_buecher').update({ user_id: userId, key_hash: null, updated_at: new Date().toISOString() }).eq('id', buchId);
  return eigenesBuch(db, userId, buchId);
}
