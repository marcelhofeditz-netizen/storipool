export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id',
};

export function requestOrigin(req: Request): string {
  const h = req.headers;
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unbekannt';
}

/** DNS-Rebinding-Schutz: ohne Origin (Server-zu-Server) ok, sonst nur bekannte KI-Clients oder wir selbst */
const ALLOWED = [
  /^https:\/\/([a-z0-9-]+\.)*claude\.(ai|com)$/,
  /^https:\/\/([a-z0-9-]+\.)*anthropic\.com$/,
  /^https:\/\/([a-z0-9-]+\.)*chatgpt\.com$/,
  /^https:\/\/([a-z0-9-]+\.)*openai\.com$/,
  /^https:\/\/(www\.)?selfpublishbot\.(de|com)$/,
];
export function isAllowedOrigin(origin: string | null, own?: string): boolean {
  if (!origin || origin === 'null') return true;
  if (own && origin === own) return true;
  if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return ALLOWED.some((r) => r.test(origin));
}

/** Einfaches Ratenlimit je Instanz (für Registrierung/Token; dauerhafte Limits laufen über die DB) */
const buckets = new Map<string, { n: number; until: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.until < now) { buckets.set(key, { n: 1, until: now + windowMs }); return true; }
  b.n += 1;
  return b.n <= max;
}
