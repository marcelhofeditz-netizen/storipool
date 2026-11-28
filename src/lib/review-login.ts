import { timingSafeEqual } from 'crypto';

/**
 * Zugang für die App-Prüfung bei Apple und Google: die Prüfer können keine E-Mail-Codes empfangen.
 * Env SELFPUBLISHBOT_REVIEW_LOGIN = "pruefer@selfpublishbot.de:123456" (nur dieses eine Konto, fester Code).
 * Ohne Env ist der Zugang aus. Das Konto ist ein normales Nutzerkonto ohne Sonderrechte.
 */
export function reviewZugang(email: string, code: string | null, env: string | undefined): { istReview: boolean; codeOk: boolean } {
  const m = /^([^\s:@]+@[^\s:@]+\.[^\s:@]+):(\d{6,10})$/.exec((env ?? '').trim());
  if (!m || email.trim().toLowerCase() !== m[1].toLowerCase()) return { istReview: false, codeOk: false };
  if (code == null) return { istReview: true, codeOk: false };
  const a = Buffer.from(code);
  const b = Buffer.from(m[2]);
  return { istReview: true, codeOk: a.length === b.length && timingSafeEqual(a, b) };
}
