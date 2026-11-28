// Selfpublishbot-App: Chat über die Claude-API mit denselben Werkzeugen wie der Connector.
// Reine Funktionen (getestet in src/__tests__/app-chat.test.ts). Der Verlauf liegt nur auf dem
// Gerät des Nutzers; der Server verarbeitet ihn je Anfrage und speichert nichts davon.
import { SELFPUBLISHBOT_INSTRUCTIONS } from './info';

export const APP_MAX_MESSAGES = 60;
export const APP_MAX_TEXT = 20_000;
export const APP_MAX_ANHAENGE = 6;
/** Base64-Länge je Anhang (≈ 2,2 MB Datei); Vercel nimmt bis 4,5 MB je Anfrage */
export const APP_MAX_ANHANG_B64 = 3_000_000;
export const APP_MAX_TOOL_RUNDEN = 10;

export const APP_BILD_TYPEN = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AppBildTyp = (typeof APP_BILD_TYPEN)[number];

export type TextBlock = { type: 'text'; text: string };
export type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: AppBildTyp; data: string } };
export type DocumentBlock = { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string }; title?: string };
export type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
export type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };
export type Block = TextBlock | ImageBlock | DocumentBlock | ToolUseBlock | ToolResultBlock;
export interface ChatMessage { role: 'user' | 'assistant'; content: Block[] }

export const APP_SYSTEM = [
  SELFPUBLISHBOT_INSTRUCTIONS,
  'Du läufst in der Selfpublishbot-App auf dem Handy. Viele Menschen diktieren dort per Spracheingabe – Füllwörter und Tippfehler sind normal. Schreib wie in einem guten Gespräch: warm, natürlich, in Du-Form, höchstens eine Frage auf einmal. Keine Emoji-Flut.',
  'Lange Kapitel nicht komplett in den Chat schreiben: speichern und kurz zusammenfassen, was drinsteht. Nie nach Passwörtern fragen.',
  'Links aus den Werkzeugen vollständig als Markdown-Link ausgeben, damit der Nutzer sie antippen kann.',
].join('\n');

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** Eingehenden Verlauf aus der App streng prüfen (nur bekannte Blöcke, Größen begrenzt). */
export function pruefeVerlauf(raw: unknown): { ok: true; messages: ChatMessage[] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: 'Leerer Verlauf.' };
  if (raw.length > APP_MAX_MESSAGES) raw = raw.slice(-APP_MAX_MESSAGES);
  const out: ChatMessage[] = [];
  let anhaenge = 0;
  for (const m of raw as unknown[]) {
    if (!isObj(m) || (m.role !== 'user' && m.role !== 'assistant')) return { ok: false, error: 'Ungültige Nachricht.' };
    const content = typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : m.content;
    if (!Array.isArray(content) || content.length === 0) return { ok: false, error: 'Ungültiger Inhalt.' };
    const blocks: Block[] = [];
    for (const b of content as unknown[]) {
      if (!isObj(b)) return { ok: false, error: 'Ungültiger Block.' };
      if (b.type === 'text' && typeof b.text === 'string') {
        if (b.text.length > APP_MAX_TEXT) return { ok: false, error: 'Nachricht zu lang.' };
        if (b.text.trim()) blocks.push({ type: 'text', text: b.text });
      } else if ((b.type === 'image' || b.type === 'document') && m.role === 'user' && isObj(b.source)) {
        const s = b.source;
        if (s.type !== 'base64' || typeof s.data !== 'string' || s.data.length > APP_MAX_ANHANG_B64 || !B64.test(s.data)) return { ok: false, error: 'Beleg zu groß oder ungültig.' };
        if (++anhaenge > APP_MAX_ANHAENGE) return { ok: false, error: 'Zu viele Belege auf einmal.' };
        if (b.type === 'image') {
          if (!APP_BILD_TYPEN.includes(s.media_type as AppBildTyp)) return { ok: false, error: 'Bildformat nicht unterstützt.' };
          blocks.push({ type: 'image', source: { type: 'base64', media_type: s.media_type as AppBildTyp, data: s.data } });
        } else {
          if (s.media_type !== 'application/pdf') return { ok: false, error: 'Nur PDF als Dokument.' };
          blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: s.data } });
        }
      } else if (b.type === 'tool_use' && m.role === 'assistant' && typeof b.id === 'string' && typeof b.name === 'string' && isObj(b.input)) {
        blocks.push({ type: 'tool_use', id: b.id.slice(0, 100), name: b.name.slice(0, 64), input: b.input });
      } else if (b.type === 'tool_result' && m.role === 'user' && typeof b.tool_use_id === 'string' && typeof b.content === 'string') {
        blocks.push({ type: 'tool_result', tool_use_id: b.tool_use_id.slice(0, 100), content: b.content.slice(0, 60_000), ...(b.is_error === true ? { is_error: true } : {}) });
      } else {
        return { ok: false, error: 'Unbekannter Block.' };
      }
    }
    if (blocks.length) out.push({ role: m.role, content: blocks });
  }
  // Muss mit einer Nutzernachricht beginnen und enden; tool_use ohne Ergebnis am Anfang abschneiden
  while (out.length && (out[0].role !== 'user' || out[0].content.some((b) => b.type === 'tool_result'))) out.shift();
  if (!out.length || out[out.length - 1].role !== 'user') return { ok: false, error: 'Letzte Nachricht muss vom Nutzer sein.' };
  return { ok: true, messages: out };
}

export interface McpToolDef { name: string; description?: string; inputSchema: Record<string, unknown> }
export interface ClaudeTool { name: string; description: string; input_schema: Record<string, unknown> }

/** MCP-Werkzeuge als Claude-Tools (dieselben Namen und Schemata wie im Connector). */
export function alsClaudeTools(tools: McpToolDef[]): ClaudeTool[] {
  return tools.map((t) => {
    const { $schema: _s, ...schema } = t.inputSchema as Record<string, unknown> & { $schema?: unknown };
    void _s;
    return { name: t.name, description: (t.description ?? t.name).slice(0, 4000), input_schema: { type: 'object', properties: {}, ...schema } };
  });
}

/** Ergebnis eines MCP-Werkzeugs als Text für Claude. */
export function toolErgebnisText(result: { content?: unknown; isError?: unknown }): { text: string; isError: boolean } {
  const parts = Array.isArray(result.content) ? result.content : [];
  const text = parts.map((p) => (isObj(p) && p.type === 'text' && typeof p.text === 'string' ? p.text : '')).filter(Boolean).join('\n');
  return { text: text || '(kein Ergebnis)', isError: result.isError === true };
}

/** Bei älteren Nachrichten Bilder/PDFs durch einen Hinweis ersetzen (Größe der Anfrage klein halten). */
export function anhaengeEntlasten(messages: ChatMessage[], behalteLetzte = 2): ChatMessage[] {
  let userSeen = 0;
  const result = [...messages];
  for (let i = result.length - 1; i >= 0; i--) {
    const m = result[i];
    if (m.role !== 'user' || !m.content.some((b) => b.type === 'text' || b.type === 'image' || b.type === 'document')) continue;
    userSeen++;
    if (userSeen > behalteLetzte && m.content.some((b) => b.type === 'image' || b.type === 'document')) {
      result[i] = { ...m, content: m.content.map((b) => (b.type === 'image' || b.type === 'document' ? { type: 'text', text: '[Anhang wurde bereits gelesen – siehe Antwort oben]' } : b)) };
    }
  }
  return result;
}

/** Links, die die App als Knöpfe anzeigt. */
export function linksAusText(text: string): string[] {
  const found = text.match(/https:\/\/[^\s)\]"'<>]+/g) ?? [];
  return [...new Set(found)].slice(0, 5);
}
