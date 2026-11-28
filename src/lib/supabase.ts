// Nur serverseitig.
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Öffentliche Werte (Projekt „Selfpublishbot“, Frankfurt) – Env geht vor. Der Service-Role-Key steht nur in Vercel.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yiajvoicqqlednkbwuef.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYWp2b2ljcXFsZWRua2J3dWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyNjk2MzYsImV4cCI6MjExMDg0NTYzNn0.B4mqnnxo0XbikGCjShTVIz_RLb-wCqFxhBKLWkZiuyE';

/** Supabase mit der Sitzung des Nutzers (Cookies) – für Login und Zustimmung */
export async function createClient() {
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase ist nicht konfiguriert.');
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server Component */ }
      },
    },
  });
}

/** Service-Client (umgeht RLS) – nur nach Rechteprüfung in der Route */
export function createServiceClient() {
  const url = SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt.');
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
