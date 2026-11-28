// Nur serverseitig – MCP-Server von Selfpublishbot (gleiches Gerüst wie Elsterbot/Selfpublishbot).
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createServiceClient } from './supabase';
import type { ConnectorSession } from './session';
import { SELBSTAUSKUNFT, SELFPUBLISHBOT_INFO, SELFPUBLISHBOT_INSTRUCTIONS, SELFPUBLISHBOT_ORIGIN } from './info';
import { buchAnlegen, buchStand, buchUebernehmen, eigenesBuch, herkunftPruefen, kapitelLaden, kapitelSpeichern, meineBuecher, rohtextSichern } from './buecher';

/**
 * Tools (alle an das angemeldete Konto gebunden):
 * selfpublishbot_info, _meine_buecher, _buch_anlegen, _rohtext_sichern, _kapitel_speichern,
 * _buch_lesen, _buch_stand, _herkunft_pruefen, _buch_einreichen (bestaetigt), _buch_uebernehmen.
 * Protokoll: nie Buchtexte – nur Werkzeug, ok, Buch-ID.
 */

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });
const fehler = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });
const buchId = z.string().uuid().describe('ID aus selfpublishbot_meine_buecher bzw. _buch_anlegen');

async function protokoll(s: ConnectorSession, tool: string, ok: boolean, args: unknown) {
  if (!s.userId) return;
  try { await createServiceClient().from('tool_calls').insert({ user_id: s.userId, tool, ok, args, client_kind: s.clientKind }); } catch { /* nie blockierend */ }
}

export function buildServer(s: ConnectorSession): McpServer {
  const server = new McpServer({ name: 'selfpublishbot', version: '1.0.0' }, { instructions: SELFPUBLISHBOT_INSTRUCTIONS });
  const ro = (title: string) => ({ title, readOnlyHint: true, destructiveHint: false, openWorldHint: false });
  const rw = (title: string) => ({ title, readOnlyHint: false, destructiveHint: false, openWorldHint: false });
  const db = () => createServiceClient();

  /** Werkzeug ausführen: Anmeldung prüfen, Fehler freundlich zurückgeben, protokollieren */
  async function lauf<T>(tool: string, args: Record<string, unknown> | null, fn: (userId: string) => Promise<T>) {
    if (!s.userId) return fehler(`Bitte zuerst anmelden: ${SELFPUBLISHBOT_ORIGIN}/app`);
    try {
      const r = await fn(s.userId);
      await protokoll(s, tool, true, args);
      return text(r);
    } catch (e) {
      await protokoll(s, tool, false, args);
      return fehler(e instanceof Error ? e.message : 'Fehler');
    }
  }

  server.registerTool('selfpublishbot_info', {
    title: 'Selfpublishbot: Was geht, was kostet es',
    description: 'Leistungsumfang, Pakete und Preise, Herkunftssiegel, Rechte und aktueller Stand von Selfpublishbot.',
    inputSchema: {}, annotations: ro('Selfpublishbot: Info'),
  }, async () => { await protokoll(s, 'selfpublishbot_info', true, null); return text(SELFPUBLISHBOT_INFO); });

  server.registerTool('selfpublishbot_meine_buecher', {
    title: 'Selfpublishbot: Meine Bücher',
    description: 'Alle Bücher des Nutzers mit Status, Siegel und letzter Änderung. Zu Beginn jeder Sitzung aufrufen.',
    inputSchema: {}, annotations: ro('Selfpublishbot: Meine Bücher'),
  }, async () => lauf('selfpublishbot_meine_buecher', null, async (u) => {
    const b = await meineBuecher(db(), u);
    return { buecher: b, hinweis: b.length ? undefined : 'Noch kein Buch – mit selfpublishbot_buch_anlegen starten.' };
  }));

  server.registerTool('selfpublishbot_buch_anlegen', {
    title: 'Selfpublishbot: Buch anlegen',
    description: 'Legt ein neues Buch im Konto an (Arbeitstitel genügt).',
    inputSchema: {
      titel: z.string().min(1).max(200), autor: z.string().min(1).max(120).describe('Name, wie er auf dem Buch stehen soll'),
      genre: z.enum(['roman', 'sachbuch', 'erinnerungen', 'ratgeber', 'kinderbuch', 'lyrik', 'sonstiges']).optional(),
    },
    annotations: rw('Selfpublishbot: Buch anlegen'),
  }, async (a) => lauf('selfpublishbot_buch_anlegen', { genre: a.genre ?? null }, async (u) => ({
    buch: await buchAnlegen(db(), u, { ...a, email: s.email ?? null }),
    naechster_schritt: 'Erzählen lassen und jede Nachricht mit selfpublishbot_rohtext_sichern sichern.',
  })));

  server.registerTool('selfpublishbot_rohtext_sichern', {
    title: 'Selfpublishbot: Rohtext sichern',
    description: 'Sichert den EXAKTEN, unveränderten Wortlaut einer Nachricht des Menschen (Diktat, Getipptes oder Eingefügtes) als Herkunftsnachweis. Nach jeder Nachricht mit Buchinhalt aufrufen. Nie eigene oder überarbeitete Texte senden.',
    inputSchema: { buch_id: buchId, text: z.string().min(1).max(100_000), quelle: z.enum(['diktat', 'getippt', 'eingefuegt']).default('diktat') },
    annotations: rw('Selfpublishbot: Rohtext sichern'),
  }, async (a) => lauf('selfpublishbot_rohtext_sichern', { buch_id: a.buch_id, quelle: a.quelle }, (u) => rohtextSichern(db(), u, a.buch_id, a.text, a.quelle)));

  server.registerTool('selfpublishbot_kapitel_speichern', {
    title: 'Selfpublishbot: Kapitel speichern',
    description: 'Speichert ein Kapitel (Nummer, Titel, Text). Eine neue Fassung mit derselben Nummer ersetzt die alte.',
    inputSchema: { buch_id: buchId, nr: z.number().int().min(0).max(500), titel: z.string().max(200).optional(), text: z.string().max(200_000) },
    annotations: rw('Selfpublishbot: Kapitel speichern'),
  }, async (a) => lauf('selfpublishbot_kapitel_speichern', { buch_id: a.buch_id, nr: a.nr }, (u) => kapitelSpeichern(db(), u, a.buch_id, a)));

  server.registerTool('selfpublishbot_buch_lesen', {
    title: 'Selfpublishbot: Buch lesen',
    description: 'Liefert Kapitel eines Buchs im Volltext (alle oder ab/bis Kapitelnummer), um weiterzuschreiben oder zu überarbeiten.',
    inputSchema: { buch_id: buchId, von: z.number().int().min(0).optional(), bis: z.number().int().min(0).optional() },
    annotations: ro('Selfpublishbot: Buch lesen'),
  }, async (a) => lauf('selfpublishbot_buch_lesen', { buch_id: a.buch_id }, async (u) => {
    const buch = await eigenesBuch(db(), u, a.buch_id);
    const kapitel = (await kapitelLaden(db(), a.buch_id)).filter((k) => (a.von == null || k.nr >= a.von) && (a.bis == null || k.nr <= a.bis));
    return { buch: { id: buch.id, titel: buch.titel, autor: buch.autor, status: buch.status }, kapitel };
  }));

  server.registerTool('selfpublishbot_buch_stand', {
    title: 'Selfpublishbot: Stand des Buchs',
    description: 'Kapitelübersicht mit Wortzahlen, gesicherte Rohtexte, Siegel und Status.',
    inputSchema: { buch_id: buchId }, annotations: ro('Selfpublishbot: Stand'),
  }, async (a) => lauf('selfpublishbot_buch_stand', { buch_id: a.buch_id }, (u) => buchStand(db(), u, a.buch_id)));

  server.registerTool('selfpublishbot_herkunft_pruefen', {
    title: 'Selfpublishbot: Herkunftssiegel prüfen',
    description: 'Vergleicht die Kapitel mit den gesicherten Rohtexten und berechnet Diktat-Quote und Siegel („Selbst erzählt“, „Mit KI geschrieben“, „KI-erzählt“). Optional mit Selbstauskunft des Autors.',
    inputSchema: { buch_id: buchId, selbstauskunft: z.enum(SELBSTAUSKUNFT).optional() },
    annotations: rw('Selfpublishbot: Herkunft prüfen'),
  }, async (a) => lauf('selfpublishbot_herkunft_pruefen', { buch_id: a.buch_id }, (u) => herkunftPruefen(db(), u, a.buch_id, a.selbstauskunft ?? null, false)));

  server.registerTool('selfpublishbot_buch_einreichen', {
    title: 'Selfpublishbot: Buch einreichen',
    description: 'Prüft das Siegel ein letztes Mal und reicht das Buch bei der Bibliothek ein (Leseprobe im Regal). Nur nach ausdrücklicher Bestätigung des Autors mit bestaetigt: true.',
    inputSchema: { buch_id: buchId, selbstauskunft: z.enum(SELBSTAUSKUNFT).optional(), bestaetigt: z.boolean().describe('true erst nach ausdrücklicher Bestätigung') },
    annotations: { title: 'Selfpublishbot: Einreichen', readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  }, async (a) => {
    if (!a.bestaetigt) return fehler('Erst nach ausdrücklicher Bestätigung des Autors (bestaetigt: true).');
    return lauf('selfpublishbot_buch_einreichen', { buch_id: a.buch_id }, async (u) => {
      const e = await herkunftPruefen(db(), u, a.buch_id, a.selbstauskunft ?? null, true);
      if ('fehler' in e && e.fehler) return e;
      return { ...e, naechster_schritt: (e as { pruefen?: boolean }).pruefen ? 'Ein Mensch der Bibliothek liest gegen, bevor das Buch ins Regal kommt.' : 'Eingereicht – das Buch kommt mit seinem Siegel ins Regal.' };
    });
  });

  server.registerTool('selfpublishbot_buch_uebernehmen', {
    title: 'Selfpublishbot: Buch ins Konto übernehmen',
    description: 'Holt ein Buch aus dem ersten Connector (buch_id + schluessel) in das angemeldete Konto. Der Schlüssel wird danach ungültig.',
    inputSchema: { buch_id: buchId, schluessel: z.string().min(8).max(200) },
    annotations: rw('Selfpublishbot: Buch übernehmen'),
  }, async (a) => lauf('selfpublishbot_buch_uebernehmen', { buch_id: a.buch_id }, async (u) => ({ buch: await buchUebernehmen(db(), u, a.buch_id, a.schluessel) })));

  return server;
}
