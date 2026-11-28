/**
 * Domain-Nachweis für die Einreichung im ChatGPT-Plugin-Verzeichnis (OpenAI, 19.11.2026).
 * Das Token ist öffentlich (OpenAI liest es von dieser URL) und kein Geheimnis.
 * Vorrang hat die Umgebungsvariable OPENAI_APPS_CHALLENGE, sonst gilt der Wert der aktuellen Einreichung.
 */
export const dynamic = 'force-dynamic';

const DEFAULT_CHALLENGE = ''; // Selfpublishbot: Token kommt mit der eigenen Einreichung (Env OPENAI_APPS_CHALLENGE)

export function GET(): Response {
  const token = process.env.OPENAI_APPS_CHALLENGE?.trim() || DEFAULT_CHALLENGE;
  if (!token) return new Response('Not found', { status: 404 });
  return new Response(token, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
