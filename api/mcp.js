// Selfpublishbot-Connector (MCP, Streamable HTTP, zustandslos) für Claude und ChatGPT.
// Endpunkt: https://www.selfpublishbot.de/api/mcp
// Daten: Supabase-Projekt „Selfpublishbot“, Zugriff nur über RPC-Funktionen mit Buch-Schlüssel.

const { NAMEN } = require('./_lib/herkunft.js');

const SB_URL = process.env.SPB_SUPABASE_URL || 'https://yiajvoicqqlednkbwuef.supabase.co';
const SB_KEY = process.env.SPB_SUPABASE_KEY || 'sb_publishable_A-FrO5j2cX4fBCvkWK0jPg_QyXVSbbf';

const ANLEITUNG = `Selfpublishbot hilft Menschen, ihr eigenes Buch oder Hörbuch zu schreiben – am liebsten, indem sie es dir erzählen oder diktieren.
So arbeitest du mit dem Connector:
1. Zu Beginn buch_anlegen (oder mit vorhandener buch_id + schluessel weiterarbeiten). Nenne dem Menschen buch_id und schluessel, damit er in neuen Chats weiterschreiben kann.
2. WICHTIG – Herkunftsnachweis: Rufe rohtext_sichern nach JEDER Nachricht auf, in der der Mensch Inhalte für sein Buch erzählt, diktiert oder tippt – mit seinem exakten, unveränderten Wortlaut, inklusive Füllwörtern, Wiederholungen und Fehlern. Sende niemals eigene, überarbeitete oder zusammengefasste Texte als Rohtext. Hat er einen fertigen Text eingefügt, sichere ihn mit quelle="eingefuegt".
3. Überarbeite behutsam: Je mehr Sätze in seinen eigenen Worten bleiben, desto höher die Diktat-Quote und das Herkunftssiegel. Frag nach, statt Inhalte zu erfinden.
4. Fertige Kapitel mit kapitel_speichern ablegen (jede neue Fassung überschreibt die alte).
5. herkunft_pruefen zeigt jederzeit Diktat-Quote und voraussichtliches Siegel. buch_einreichen schickt das Buch mit Selbstauskunft an die Bibliothek.
Herkunftssiegel: „Selbst erzählt“ (ab 70 % eigene Worte), „Mit KI geschrieben“ (ab 30 % eigene Worte oder überwiegend eigene Inhalte), „KI-erzählt“ (sonst). Jede Stufe ist willkommen – das Siegel macht nur ehrlich sichtbar, wie das Buch entstanden ist.`;

const S = { type: 'string' };
const ID = { buch_id: { type: 'string', description: 'ID des Buchs aus buch_anlegen' }, schluessel: { type: 'string', description: 'Geheimer Schlüssel des Buchs aus buch_anlegen' } };
const STUFE = { type: 'string', enum: ['selbst_erzaehlt', 'mit_ki', 'ki_erzaehlt'] };

const TOOLS = [
  { name: 'selfpublishbot_start', description: 'Zuerst aufrufen: erklärt, wie man mit dem Selfpublishbot ein Buch schreibt und wie das Herkunftssiegel funktioniert.',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'buch_anlegen', description: 'Legt ein neues Buch an. Gibt buch_id und schluessel zurück – beide dem Menschen nennen, sie werden für alle weiteren Schritte gebraucht.',
    inputSchema: { type: 'object', required: ['titel', 'autor'], properties: { titel: { ...S, description: 'Arbeitstitel' }, autor: { ...S, description: 'Name oder Pseudonym' }, email: { ...S, description: 'optional, für die Einladung zum Start' } } } },
  { name: 'rohtext_sichern', description: 'Sichert den exakten, unveränderten Wortlaut einer Nachricht des Menschen (Diktat oder Getipptes) als Herkunftsnachweis. Nach JEDER inhaltlichen Nachricht aufrufen. Nie eigene oder überarbeitete Texte senden.',
    inputSchema: { type: 'object', required: ['buch_id', 'schluessel', 'text'], properties: { ...ID, text: { ...S, description: 'Originalwortlaut des Menschen, unverändert' }, quelle: { type: 'string', enum: ['diktat', 'getippt', 'eingefuegt'], description: 'diktat = gesprochen/Spracheingabe, getippt = selbst geschrieben, eingefuegt = fertiger Text hineinkopiert' } } } },
  { name: 'kapitel_speichern', description: 'Speichert die aktuelle Fassung eines Kapitels (überschreibt die vorige Fassung mit derselben Nummer).',
    inputSchema: { type: 'object', required: ['buch_id', 'schluessel', 'nr', 'text'], properties: { ...ID, nr: { type: 'integer', description: 'Kapitelnummer, 0 = Prolog' }, titel: S, text: S } } },
  { name: 'buch_stand', description: 'Zeigt den Stand eines Buchs: Kapitel, Wörter, gesicherte Rohtexte, Siegel.',
    inputSchema: { type: 'object', required: ['buch_id', 'schluessel'], properties: { ...ID } } },
  { name: 'herkunft_pruefen', description: 'Berechnet die Diktat-Quote (Anteil der Sätze in den eigenen Worten des Menschen) und das voraussichtliche Herkunftssiegel, je Kapitel, mit den Sätzen, die am weitesten vom Rohtext entfernt sind.',
    inputSchema: { type: 'object', required: ['buch_id', 'schluessel'], properties: { ...ID, selbstauskunft: { ...STUFE, description: 'optional: wie der Mensch selbst sagt, dass er gearbeitet hat' } } } },
  { name: 'buch_einreichen', description: 'Reicht das Buch mit Selbstauskunft bei der Bibliothek ein. Vorher den Menschen fragen, wie er gearbeitet hat (selbst erzählt, mit KI geschrieben oder KI-erzählt).',
    inputSchema: { type: 'object', required: ['buch_id', 'schluessel', 'selbstauskunft'], properties: { ...ID, selbstauskunft: STUFE } } },
];

async function rpc(fn, args) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {})
  });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!r.ok) throw new Error((j && j.message) || `Datenbankfehler ${r.status}`);
  return j;
}

function wc(t) { return String(t || '').trim().split(/\s+/).filter(Boolean).length; }

async function rufe(name, a) {
  a = a || {};
  switch (name) {
    case 'selfpublishbot_start': return { anleitung: ANLEITUNG };
    case 'buch_anlegen': {
      const r = await rpc('spb_buch_anlegen', { p_titel: a.titel, p_autor: a.autor, p_email: a.email || null });
      return { ...r, hinweis: 'buch_id und schluessel dem Menschen nennen und gut aufheben lassen. Ab jetzt jede inhaltliche Nachricht mit rohtext_sichern sichern.' };
    }
    case 'rohtext_sichern':
      if (!a.text || !String(a.text).trim()) throw new Error('text fehlt');
      return rpc('spb_rohtext', { p_buch: a.buch_id, p_key: a.schluessel, p_text: String(a.text).slice(0, 100000), p_quelle: a.quelle || 'diktat' });
    case 'kapitel_speichern':
      return rpc('spb_kapitel_speichern', { p_buch: a.buch_id, p_key: a.schluessel, p_nr: a.nr, p_titel: a.titel || null, p_text: String(a.text || '') });
    case 'buch_stand': {
      const d = await rpc('spb_buch_daten', { p_buch: a.buch_id, p_key: a.schluessel });
      return { buch: d.buch, siegel_name: d.buch.siegel ? NAMEN[d.buch.siegel] : null,
        kapitel: d.kapitel.map(k => ({ nr: k.nr, titel: k.titel, woerter: wc(k.text) })),
        rohtexte: d.rohtexte.length, woerter_rohtexte: d.rohtexte.reduce((s, r) => s + wc(r.text), 0) };
    }
    case 'herkunft_pruefen':
    case 'buch_einreichen': {
      // Siegel wird serverseitig in der Supabase-Funktion „herkunft“ berechnet und gespeichert
      const einreichen = name === 'buch_einreichen';
      const r = await fetch(`${SB_URL}/functions/v1/herkunft`, { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ buch_id: a.buch_id, schluessel: a.schluessel, selbstauskunft: a.selbstauskunft || null, einreichen }) });
      const e = await r.json().catch(() => ({ fehler: 'Prüfdienst nicht erreichbar' }));
      if (e.fehler && !r.ok) throw new Error(e.fehler);
      if (e.fehler) return e;
      return einreichen
        ? { ...e, naechster_schritt: e.pruefen ? 'Ein Mensch der Bibliothek liest gegen, bevor das Buch ins Regal kommt.' : 'Das Buch ist eingereicht und bekommt zum Start sein Siegel im Regal.' }
        : e;
    }
    default: throw new Error('Unbekanntes Werkzeug: ' + name);
  }
}

function antwort(id, result) { return { jsonrpc: '2.0', id, result }; }
function fehler(id, code, message) { return { jsonrpc: '2.0', id, error: { code, message } }; }

async function behandle(msg) {
  const { id, method, params } = msg || {};
  if (method === 'initialize') {
    return antwort(id, { protocolVersion: (params && params.protocolVersion) || '2025-06-18', capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'selfpublishbot', title: 'Selfpublishbot', version: '1.0.0' }, instructions: ANLEITUNG });
  }
  if (method === 'ping') return antwort(id, {});
  if (method === 'tools/list') return antwort(id, { tools: TOOLS });
  if (method === 'tools/call') {
    try {
      const r = await rufe(params && params.name, params && params.arguments);
      return antwort(id, { content: [{ type: 'text', text: JSON.stringify(r, null, 1) }], structuredContent: r });
    } catch (e) {
      return antwort(id, { content: [{ type: 'text', text: 'Fehler: ' + (e.message || e) }], isError: true });
    }
  }
  if (id === undefined || id === null) return null; // Notification
  return fehler(id, -32601, 'Methode nicht unterstützt: ' + method);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    if ((req.headers.accept || '').includes('text/event-stream')) return res.status(405).end();
    return res.status(200).json({ name: 'Selfpublishbot-Connector', mcp: 'POST JSON-RPC an diese Adresse', werkzeuge: TOOLS.map(t => t.name) });
  }
  if (req.method !== 'POST') return res.status(405).end();
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json(fehler(null, -32700, 'Parse error')); } }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(behandle))).filter(Boolean);
    return out.length ? res.status(200).json(out) : res.status(202).end();
  }
  const out = await behandle(body);
  if (!out) return res.status(202).end();
  return res.status(200).json(out);
};

module.exports.rufe = rufe;
module.exports.behandle = behandle;
