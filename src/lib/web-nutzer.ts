// Nur serverseitig: angemeldeter Nutzer aus dem Supabase-Cookie (Website/Web-App) bzw. Bearer-Token (App).
import { createClient } from './supabase';
import { authenticate } from './session';
import { requestOrigin } from './http';
import { webOriginErlaubt } from './web-chat';

export interface Nutzer { id: string; email: string | null; kanal: 'web' | 'app' }

export async function cookieNutzer(): Promise<Nutzer | null> {
  try {
    const { data: { user } } = await (await createClient()).auth.getUser();
    return user ? { id: user.id, email: user.email ?? null, kanal: 'web' } : null;
  } catch { return null; }
}

/** Web: Cookie + eigene Origin (CSRF). App: Bearer-Token. */
export async function nutzerAusAnfrage(req: Request, schreibend = false): Promise<Nutzer | null> {
  if (req.headers.get('authorization')) {
    const a = await authenticate(req);
    return a.ok ? { id: a.session.userId, email: a.session.email, kanal: 'app' } : null;
  }
  if (schreibend && !webOriginErlaubt(req.headers.get('origin'), requestOrigin(req), process.env.NODE_ENV !== 'production')) return null;
  return cookieNutzer();
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
