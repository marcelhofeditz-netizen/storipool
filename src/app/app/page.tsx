import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookieNutzer } from '@/lib/web-nutzer';
import WebApp from './web-app';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Selfpublishbot', robots: { index: false, follow: false } };

/** Web-App: gleiche Funktionen wie die App (Schreiben · Meine Bücher · Konto). Nur mit Login. */
export default async function AppPage() {
  const u = await cookieNutzer();
  if (!u) redirect('/login?next=/app');
  return <WebApp email={u.email} />;
}
