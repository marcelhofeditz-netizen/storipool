// Brücke für die bisherigen Vercel-Funktionen (api/*.js, Node-Stil req/res) unter Next.js:
// Zauberbuch-KI (/api/bot), Stimme (/api/speak) und Live-Gespräch (/api/voice) laufen unverändert weiter.
/* eslint-disable @typescript-eslint/no-explicit-any */
type LegacyHandler = (req: any, res: any) => unknown;

export async function runLegacy(handler: LegacyHandler, req: Request): Promise<Response> {
  const url = new URL(req.url);
  const raw = req.method === 'GET' || req.method === 'HEAD' ? '' : await req.text();
  let body: unknown = raw;
  try { body = raw ? JSON.parse(raw) : {}; } catch { /* Text bleibt Text */ }
  const fakeReq = {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    body,
    url: url.pathname + url.search,
    query: Object.fromEntries(url.searchParams.entries()),
  };
  return new Promise<Response>((resolve) => {
    let status = 200;
    let done = false;
    const headers = new Headers();
    const finish = (b: BodyInit | null) => {
      if (done) return;
      done = true;
      resolve(new Response(b, { status, headers }));
    };
    const res: any = {
      statusCode: 200,
      setHeader(k: string, v: unknown) { headers.set(k, String(v)); return res; },
      getHeader(k: string) { return headers.get(k); },
      status(c: number) { status = c; res.statusCode = c; return res; },
      json(o: unknown) { if (!headers.has('content-type')) headers.set('content-type', 'application/json; charset=utf-8'); finish(JSON.stringify(o)); return res; },
      send(b: unknown) { finish(typeof b === 'string' || b instanceof Uint8Array ? (b as BodyInit) : JSON.stringify(b)); return res; },
      end(b?: unknown) { finish((b as BodyInit) ?? null); return res; },
    };
    Promise.resolve()
      .then(() => handler(fakeReq, res))
      .then(() => { if (!done) finish(null); }, (e) => {
        console.error('[legacy]', e instanceof Error ? e.message : e);
        if (!done) { status = 500; headers.set('content-type', 'application/json'); finish(JSON.stringify({ error: 'intern' })); }
      });
  });
}
