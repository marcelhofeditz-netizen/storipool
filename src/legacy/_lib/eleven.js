// Selfpublishbot – ElevenLabs-Helfer für Sprach-Agent (api/voice.js) und Stimme (api/speak.js).
// Schlüssel nur als Env-Variable ELEVENLABS_API_KEY (Vercel), nie im Repo.
const API = 'https://api.elevenlabs.io/v1';
const SPEED = parseFloat(process.env.SPB_ELEVEN_SPEED || '1.0');
const TTS_MODEL = process.env.SPB_ELEVEN_TTS || 'eleven_v4_turbo';

const hatKey = () => !!process.env.ELEVENLABS_API_KEY;

async function el(path, opts = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  if (opts.raw) { if (!r.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${r.status} ${(await r.text()).slice(0, 300)}`); return r; }
  const text = await r.text();
  if (!r.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${r.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

// Stimme des Zauberbuchs: alter, warmer Erzähler. Feste Wahl per Env SPB_ELEVEN_VOICE, sonst „Bill“, sonst „George“.
let voiceId = process.env.SPB_ELEVEN_VOICE || '';
async function stimme() {
  if (voiceId) return voiceId;
  try {
    const { voices = [] } = await el('/voices');
    const v = voices.find(v => /^bill\b/i.test(v.name)) || voices.find(v => /^george\b/i.test(v.name)) || voices.find(v => /old|narrat/i.test(JSON.stringify(v.labels || {})));
    if (v) return (voiceId = v.voice_id);
  } catch (e) { console.error('voices', e.message); }
  return (voiceId = 'JBFqnCBsd6RMkjVDRZzb');
}

// Text → MP3 (Base64)
async function sprich(text, lang) {
  const id = await stimme();
  const r = await el(`/text-to-speech/${id}?output_format=mp3_44100_128`, {
    method: 'POST', raw: true,
    body: JSON.stringify({ text, model_id: TTS_MODEL, language_code: lang || 'de', voice_settings: { speed: SPEED, stability: 0.5, similarity_boost: 0.8 } })
  });
  return Buffer.from(await r.arrayBuffer()).toString('base64');
}

module.exports = { API, SPEED, TTS_MODEL, hatKey, el, stimme, sprich };
