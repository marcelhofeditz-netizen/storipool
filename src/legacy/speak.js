// Selfpublishbot – Stimme des Zauberbuchs (ElevenLabs, dieselbe Stimme wie im Live-Gespräch).
// POST { text } → { audio: base64-mp3 }. Ohne Schlüssel 503 – die Seite liest dann mit der Browser-Stimme vor.
const { hatKey, sprich } = require('./_lib/eleven.js');
const hits = new Map();

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!hatKey()) return res.status(503).json({ error: 'not_configured' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 3600e3); arr.push(now); hits.set(ip, arr);
  if (arr.length > 30) return res.status(429).json({ error: 'limit' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const text = String(body.text || '').replace(/[„“"*#_]/g, '').trim().slice(0, 1200);
    if (!text) return res.status(400).json({ error: 'input' });
    return res.status(200).json({ audio: await sprich(text, 'de') });
  } catch (e) {
    console.error('speak', e.message);
    return res.status(502).json({ error: 'tts' });
  }
};
