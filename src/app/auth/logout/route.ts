import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { SELFPUBLISHBOT_ORIGIN } from '@/lib/info';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await (await createClient()).auth.signOut(); } catch { /* egal */ }
  return NextResponse.redirect(`${SELFPUBLISHBOT_ORIGIN}/`);
}
