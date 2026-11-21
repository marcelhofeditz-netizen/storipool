// Selfpublishbot – KI-Endpunkt für den Buch-Bot und die Tools.
// Läuft als Vercel Function und spricht über das Vercel AI Gateway (OIDC, kein eigener Key nötig;
// optional AI_GATEWAY_API_KEY als Env-Variable).

const MODELS = ['anthropic/claude-haiku-4.5', 'anthropic/claude-sonnet-4.5', 'openai/gpt-4o-mini'];
const MOTIFS = ['moonsea','city','rain','mountains','forest','planet','sunstripes','bloom','castle','dunes','chart','house','plate','lighthouse','road','birds','wave','keyhole','spiral','eye','balloon','pier'];
const PALS = ['night','noir','crimson','alpine','fog','cosmos','retro','blush','royal','sahara','mint','dusk','kitchen','northsea','highway','sky','ocean','gold','hypno','lilac','sunrise','forestN'];

const BASE = 'Du bist Selfpublishbot, ein erfahrener deutscher Lektor und Buchentwickler. Du schreibst lebendig, konkret, ohne Floskeln und ohne Klischees. Antworte ausschließlich mit gültigem JSON ohne Markdown, ohne Text davor oder danach.';

const PROMPTS = {
  book: (t) => `Ein Mensch beschreibt sein Buch in einem Satz: "${t}"
Entwickle daraus ein Buch. JSON-Felder:
{"title": "kurzer, starker Titel (max. 5 Wörter)", "subtitle": "Untertitel (max. 8 Wörter)", "genre": "z. B. Roman, Thriller, Lebensgeschichte, Sachbuch, Ratgeber, Fantasy, Liebesroman", "motif": eines von ${JSON.stringify(MOTIFS)}, "palette": eine von ${JSON.stringify(PALS)}, "blurb": "Klappentext, 2 kurze Absätze getrennt durch \\n\\n, zusammen max. 90 Wörter", "chapters": [8 Kapiteltitel, je max. 5 Wörter], "firstPage": "erste Seite des Buchs, ca. 140 Wörter, starker Einstieg, Absätze mit \\n\\n"}`,
  titel: (t) => `Thema/Idee des Buchs: "${t}"
Schlage 10 Buchtitel vor, abwechslungsreich (poetisch, prägnant, provokant, sachlich). JSON: {"items":[{"title":"…","subtitle":"…"}]}`,
  klappentext: (t) => `Angaben zum Buch: "${t}"
Schreibe drei Klappentext-Varianten (je 70–110 Wörter): 1) spannend, 2) emotional, 3) sachlich-verkaufsstark. JSON: {"items":[{"label":"Spannend","text":"…"},{"label":"Emotional","text":"…"},{"label":"Verkaufsstark","text":"…"}]}`,
  gliederung: (t) => `Buchidee: "${t}"
Erstelle eine Kapitelgliederung mit 10–12 Kapiteln. JSON: {"title":"Arbeitstitel","items":[{"title":"Kapiteltitel","summary":"1–2 Sätze, was passiert bzw. worum es geht"}]}`,
  chat: (t) => `Hier ist ein Auszug aus Gesprächen eines Menschen mit einer KI:
"""${t}"""
Finde darin die Geschichte. Nenne keine echten Namen dritter Personen (ersetze sie). JSON: {"title":"Titelvorschlag","genre":"Roman oder Lebensgeschichte oder Sachbuch","threads":[3 große Erzählstränge, je 1 Satz],"chapters":[8 Kapiteltitel],"firstPage":"erste Seite, ca. 140 Wörter, Absätze mit \\n\\n"}`,
  cover: (t) => `Buchtitel und Genre: "${t}"
Wähle passende Cover-Motive. JSON: {"items":[{"motif": eines von ${JSON.stringify(MOTIFS)}, "palette": eine von ${JSON.stringify(PALS)}}] mit genau 6 unterschiedlichen Kombinationen}`
};

const LIMITS = { chat: 8000 };
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 40;
}

function parseJson(s) {
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('no json');
  return JSON.parse(s.slice(a, b + 1));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const mode = String((body && body.mode) || 'book');
  let text = String((body && body.text) || '').trim();
  if (!PROMPTS[mode] || text.length < 3) { res.status(400).json({ error: 'Bitte etwas mehr erzählen.' }); return; }
  text = text.slice(0, LIMITS[mode] || 600).replace(/"""/g, '“');

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x';
  if (limited(ip)) { res.status(429).json({ error: 'Kurz durchatmen – zu viele Anfragen. Versuch es gleich nochmal.' }); return; }

  const token = process.env.AI_GATEWAY_API_KEY || req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN;
  if (!token) { res.status(503).json({ error: 'KI gerade nicht erreichbar.' }); return; }

  for (const model of MODELS) {
    try {
      const r = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          model,
          max_tokens: 1400,
          temperature: 0.9,
          messages: [{ role: 'system', content: BASE }, { role: 'user', content: PROMPTS[mode](text) }]
        })
      });
      if (!r.ok) continue;
      const j = await r.json();
      const out = parseJson(j.choices[0].message.content);
      if (out.motif && !MOTIFS.includes(out.motif)) out.motif = 'moonsea';
      if (out.palette && !PALS.includes(out.palette)) out.palette = 'night';
      res.status(200).json({ ok: true, data: out });
      return;
    } catch (e) { /* nächstes Modell */ }
  }
  res.status(502).json({ error: 'KI gerade nicht erreichbar.' });
};
