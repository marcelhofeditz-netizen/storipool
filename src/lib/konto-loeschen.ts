// Nur serverseitig: Konto vollständig löschen (Web-App und App).
// Bücher, Kapitel, Rohtexte und Prüfungen hängen per on delete cascade am Nutzer bzw. am Buch.
import { createServiceClient } from './supabase';

export async function kontoLoeschen(userId: string): Promise<void> {
  const db = createServiceClient();
  await db.from('api_tokens').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId);
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error('Konto konnte nicht gelöscht werden.');
}
