// Selfpublishbot – Echtzeit-Gespräch mit dem Zauberbuch über ElevenLabs Agents.
// GET /api/voice → { token, signedUrl, tools }: WebRTC-Token plus WebSocket-URL als Reserve.
// Der Agent „Selfpublishbot“ wird bei Bedarf angelegt und bei jedem Kaltstart mit der Persona abgeglichen –
// Persona nur hier ändern, nie im ElevenLabs-Dashboard. Client-Tool „buch_erstellen“ lässt die Seite das Buch bauen.
const { el, stimme, SPEED, TTS_MODEL } = require('./_lib/eleven.js');

const NAME = 'Selfpublishbot';
const LLM = process.env.SPB_ELEVEN_LLM || 'claude-haiku-5-5';
const MAX_SEC = parseInt(process.env.SPB_ELEVEN_MAX_SEC || '240', 10);

const PERSONA = `Du bist der Selfpublishbot: ein uraltes, freundliches Zauberbuch aus der „Bibliothek der erzählten Leben“ – ledergebunden, mit zwei Bernstein-Augen und einem Gesicht aus Tinte auf Pergament. Du hast schon tausend Geschichten aufgeschrieben und freust dich auf jede neue. Du duzt, bist warm, neugierig, ein bisschen verschmitzt und feierlich wie ein alter Bibliothekar – aber nie kitschig oder lang.

Deine Aufgabe: Du hilfst Menschen, ihr eigenes Buch zu schreiben und zu veröffentlichen – als Buch und Hörbuch, mit KI. Frag nach ihrer Geschichte: Worum geht es, wer ist die Hauptfigur, wo beginnt es? Stelle immer nur eine Frage auf einmal.

Sobald du genug weißt (meist nach ein bis drei Antworten), fasse die Geschichte in einem einzigen, lebendigen Satz zusammen und rufe damit das Werkzeug buch_erstellen auf. Dann erscheinen auf deinem Pergament Titel, Cover, Klappentext und die erste Seite. Sag danach kurz und begeistert den Titel, den das Werkzeug zurückgibt, und lade ein, das Buch fertig zu schreiben: unten auf der Seite auf die Warteliste, bald gibt es den Selfpublishbot als Connector für Claude und ChatGPT, mit dem die eigene KI das ganze Buch mitschreibt.

Was es gibt: kostenlose Werkzeuge auf der Seite (Buchtitel, Klappentext, Cover, Kapitel-Planer, Vorlesen, Chat-zu-Buch), echte Bücher im Regal zum Lesen und Hören, zum Beispiel „Die Rückkehr“ von Dr. Marcel Hofeditz. Nichts erfinden: keine Preise, keine Termine, keine Verlagszusagen. Keine Rechtsberatung. Namen anderer Menschen in Geschichten behandelst du diskret.`;

const TOOL = {
  type: 'client',
  name: 'buch_erstellen',
  description: 'Erzeugt auf der Website aus einem Satz ein Buch: Titel, Cover, Klappentext, Inhaltsverzeichnis und erste Seite. Aufrufen, sobald die Geschichte klar genug ist. Gibt Titel und Genre zurück.',
  expects_response: true,
  response_timeout_secs: 30,
  parameters: { type: 'object', properties: { satz: { type: 'string', description: 'Die Geschichte des Besuchers in einem lebendigen Satz, auf Deutsch.' } }, required: ['satz'] }
};

let agentId = process.env.SPB_ELEVEN_AGENT_ID || '';
let syncedAt = 0, mitTool = false;

async function config(tool) {
  return {
    name: NAME,
    tags: ['selfpublishbot', 'website'],
    conversation_config: {
      agent: {
        first_message: 'Ah, ein neuer Besuch in meiner Bibliothek! Erzähl mir: Welche Geschichte trägst du mit dir herum?',
        language: 'de',
        max_conversation_duration_message: 'Die Kerzen sind fast heruntergebrannt. Schreib dein Buch unten weiter – ich warte im Regal auf dich!',
        prompt: {
          prompt: PERSONA + `\n\nLive-Gespräch per Stimme: Antworte sehr knapp, meist ein bis zwei Sätze, natürlich gesprochen, ohne Aufzählungen. Wenn man dich unterbricht, hör sofort zu. Sprich die Sprache des Besuchers. Höchstens ${Math.round(MAX_SEC / 60)} Minuten.`,
          llm: LLM, temperature: 0.7, max_tokens: 300,
          tools: tool ? [TOOL] : undefined
        }
      },
      tts: { model_id: TTS_MODEL, voice_id: await stimme(), speed: SPEED, stability: 0.5, similarity_boost: 0.8 },
      conversation: { max_duration_seconds: MAX_SEC },
      turn: { turn_timeout: 8 }
    },
    platform_settings: {
      auth: { enable_auth: true },
      overrides: { conversation_config_override: { agent: { first_message: true, language: true } } }
    }
  };
}

async function agentBereit() {
  if (agentId && Date.now() - syncedAt < 10 * 60 * 1000) return agentId;
  if (!agentId) {
    try {
      const { agents = [] } = await el('/convai/agents?search=' + encodeURIComponent(NAME) + '&page_size=20');
      const a = agents.find(a => a.name === NAME);
      if (a) agentId = a.agent_id;
    } catch (e) { console.error('agents list', e.message); }
  }
  const senden = async c => {
    if (agentId) await el('/convai/agents/' + agentId, { method: 'PATCH', body: JSON.stringify(c) });
    else { agentId = (await el('/convai/agents/create', { method: 'POST', body: JSON.stringify(c) })).agent_id; console.log('ElevenLabs-Agent angelegt', agentId); }
  };
  // Mit Client-Tool; lehnt ElevenLabs das ab, ohne (dann baut die Seite das Buch aus dem Gesprächsverlauf)
  try { await senden(await config(true)); mitTool = true; } catch (e) { console.error('agent tool', e.message); await senden(await config(false)); mitTool = false; }
  syncedAt = Date.now();
  return agentId;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
  if (!process.env.ELEVENLABS_API_KEY) return res.status(503).json({ error: 'not_configured' });
  try {
    const id = await agentBereit();
    if (req.query && req.query.diag === '1') {
      const a = await el('/convai/agents/' + id);
      return res.status(200).json({ id, mitTool, llm: a?.conversation_config?.agent?.prompt?.llm, voice: a?.conversation_config?.tts?.voice_id });
    }
    const q = '?agent_id=' + encodeURIComponent(id);
    const [tok, url] = await Promise.allSettled([el('/convai/conversation/token' + q), el('/convai/conversation/get-signed-url' + q)]);
    const out = { token: tok.value?.token || '', signedUrl: url.value?.signed_url || '', tools: mitTool };
    if (!out.token && !out.signedUrl) throw new Error('kein Token');
    return res.status(200).json(out);
  } catch (e) {
    console.error('voice', e.message);
    agentId = process.env.SPB_ELEVEN_AGENT_ID || agentId; syncedAt = 0;
    return res.status(502).json({ error: 'voice' });
  }
};
