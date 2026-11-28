import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { requestOrigin } from '@/lib/http';
import { safeNext } from '@/lib/redirect';

export const dynamic = 'force-dynamic';

/** Rückkehr aus dem E-Mail-Link: Code gegen Sitzung tauschen (PKCE von Supabase Auth). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = requestOrigin(req);
  const next = safeNext(url.searchParams.get('next'));
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?fehler=senden&next=${encodeURIComponent(next)}`);
}
