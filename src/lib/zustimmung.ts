// Nur serverseitig: Zustimmung zu AGB und Datenschutz mit Version speichern (Rechtspaket 24.11.2026).
import { createServiceClient } from './supabase';
import { AGB_VERSION, DATENSCHUTZ_VERSION } from './rechtstexte';

/** Kanal aus dem Rücksprungziel der Anmeldung: App (OAuth mit selfpublishbot://), Connector (OAuth) oder Website */
export function zustimmungsKanal(next: string): 'web' | 'app' | 'connector' {
  if (!next.startsWith('/oauth/')) return 'web';
  return /selfpublishbot(%3A|:)(%2F|\/){2}oauth/i.test(next) ? 'app' : 'connector';
}

export async function zustimmungSpeichern(userId: string, next: string): Promise<void> {
  const db = createServiceClient();
  const { data } = await db.from('selfpublishbot_zustimmungen').select('id')
    .eq('user_id', userId).eq('agb_version', AGB_VERSION).eq('datenschutz_version', DATENSCHUTZ_VERSION).limit(1);
  if (data?.length) return;
  const { error } = await db.from('selfpublishbot_zustimmungen').insert({ user_id: userId, agb_version: AGB_VERSION, datenschutz_version: DATENSCHUTZ_VERSION, kanal: zustimmungsKanal(next) });
  if (error) console.error('[zustimmung] nicht gespeichert', { code: error.code });
}
