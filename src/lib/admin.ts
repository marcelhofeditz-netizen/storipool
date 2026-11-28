/**
 * Admins von Selfpublishbot (Marcel). Nur sie sehen Werkzeuge für die eigene GmbH,
 * die mit dem GmbH-Zertifikat auf der Bridge senden. Liste per Env ELSTERBOT_ADMINS
 * (kommagetrennt) überschreibbar. E-Mail kommt immer aus der Sitzung, nie aus dem Body.
 */
export const ADMINS_STANDARD = ['marcel@offmarketpool.com', 'marcel.hofeditz@googlemail.com'];

export function adminListe(): string[] {
  const env = process.env.SELFPUBLISHBOT_ADMINS;
  return (env ? env.split(',') : ADMINS_STANDARD).map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function istAdmin(email: string | null | undefined): boolean {
  return Boolean(email) && adminListe().includes(String(email).trim().toLowerCase());
}
