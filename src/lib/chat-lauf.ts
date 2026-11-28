// Nur serverseitig: gemeinsame Chat-Schleife für App (/api/app/chat) und Website (/api/web/chat).
// Claude bekommt die Connector-Werkzeuge (In-Process-MCP). Der Verlauf wird nur in der
// jeweiligen Anfrage verarbeitet – nichts davon wird gespeichert oder protokolliert.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { getVercelOidcToken } from '@vercel/oidc';
import { buildServer } from './connector';
import type { ConnectorSession } from './session';
import {
  APP_MAX_TOOL_RUNDEN, alsClaudeTools, anhaengeEntlasten, linksAusText, toolErgebnisText,
  type Block, type ChatMessage, type ClaudeTool, type ToolResultBlock, type ToolUseBlock,
} from './app-chat';

export interface ChatLaufOptionen {
  session: ConnectorSession;
  messages: ChatMessage[];
  system: string;
  model: string;
  maxTokens: number;
  /** Werkzeuge, die Claude überhaupt sieht (Standard: alle) */
  werkzeugFilter?: (name: string) => boolean;
  /** Prüfung je Aufruf; liefert einen Text, wenn der Aufruf nicht ausgeführt werden darf */
  aufrufSperre?: (name: string, input: Record<string, unknown>) => string | null;
}

export interface ChatLaufErgebnis { neu: ChatMessage[]; antwort: string; links: string[]; gesperrt: boolean }

/** Direkt bei Anthropic (ANTHROPIC_API_KEY) oder über das Vercel AI Gateway (OIDC, kein eigener Schlüssel nötig) */
export const GATEWAY_MODEL = () => process.env.SELFPUBLISHBOT_GATEWAY_MODEL || 'anthropic/claude-sonnet-4.5';
export function kiAktiv(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL);
}

async function claude(model: string, maxTokens: number, system: string, messages: ChatMessage[], tools: ClaudeTool[]) {
  const direkt = !!process.env.ANTHROPIC_API_KEY;
  const key = direkt ? process.env.ANTHROPIC_API_KEY! : (process.env.AI_GATEWAY_API_KEY || await getVercelOidcToken());
  const res = await fetch(direkt ? 'https://api.anthropic.com/v1/messages' : 'https://ai-gateway.vercel.sh/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', ...(direkt ? {} : { authorization: `Bearer ${key}` }) },
    body: JSON.stringify({ model: direkt ? model : GATEWAY_MODEL(), max_tokens: maxTokens, system, ...(tools.length ? { tools } : {}), messages }),
  });
  if (!res.ok) {
    console.error('[chat] Claude-Fehler', { status: res.status });
    throw new Error(res.status === 429 || res.status === 529 ? 'ueberlastet' : 'claude');
  }
  return (await res.json()) as { content: Block[]; stop_reason: string };
}

export async function chatLauf(o: ChatLaufOptionen): Promise<ChatLaufErgebnis> {
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const server = buildServer(o.session);
  const mcp = new Client({ name: `selfpublishbot-${o.session.clientKind ?? 'chat'}`, version: '1.0.0' });
  let gesperrt = false;
  try {
    await server.connect(serverT);
    await mcp.connect(clientT);
    const alle = alsClaudeTools((await mcp.listTools()).tools as never);
    const tools = o.werkzeugFilter ? alle.filter((t) => o.werkzeugFilter!(t.name)) : alle;
    const verlauf = anhaengeEntlasten(o.messages);
    const neu: ChatMessage[] = [];
    for (let runde = 0; runde < APP_MAX_TOOL_RUNDEN; runde++) {
      const r = await claude(o.model, o.maxTokens, o.system, [...verlauf, ...neu], tools);
      const gefiltert = r.content.filter((b) => b.type === 'text' || b.type === 'tool_use');
      const content: Block[] = gefiltert.length ? gefiltert : [{ type: 'text', text: 'Erledigt.' }];
      neu.push({ role: 'assistant', content });
      const uses = content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
      if (r.stop_reason !== 'tool_use' || uses.length === 0) break;
      const results: ToolResultBlock[] = [];
      for (const u of uses) {
        const sperre = (o.werkzeugFilter && !o.werkzeugFilter(u.name))
          ? 'Dieses Werkzeug steht hier nicht zur Verfügung.'
          : o.aufrufSperre?.(u.name, u.input) ?? null;
        if (sperre) {
          gesperrt = true;
          results.push({ type: 'tool_result', tool_use_id: u.id, content: sperre, is_error: true });
          continue;
        }
        try {
          const t = toolErgebnisText((await mcp.callTool({ name: u.name, arguments: u.input })) as never);
          results.push({ type: 'tool_result', tool_use_id: u.id, content: t.text, ...(t.isError ? { is_error: true } : {}) });
        } catch (e) {
          results.push({ type: 'tool_result', tool_use_id: u.id, content: `Werkzeugfehler: ${e instanceof Error ? e.message : 'unbekannt'}`, is_error: true });
        }
      }
      neu.push({ role: 'user', content: results });
    }
    const letzte = [...neu].reverse().find((m) => m.role === 'assistant');
    const antwort = (letzte?.content ?? []).filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n\n').trim();
    if (neu.length && neu[neu.length - 1].role === 'user') neu.push({ role: 'assistant', content: [{ type: 'text', text: antwort || 'Ich brauche noch einen Moment – schreib einfach „weiter“.' }] });
    return { neu, antwort: antwort || 'Erledigt.', links: linksAusText(antwort), gesperrt };
  } finally {
    void mcp.close().catch(() => undefined);
    void server.close().catch(() => undefined);
  }
}

export function chatFehlerText(e: unknown): string {
  return e instanceof Error && e.message === 'ueberlastet'
    ? 'Selfpublishbot ist gerade stark ausgelastet – bitte gleich nochmal.'
    : 'Da ist etwas schiefgelaufen – bitte nochmal versuchen.';
}
