// Website-Chat auf selfpublishbot.de (/api/web/chat): reine Regeln, getestet in src/__tests__/web-chat.test.ts.
// Ohne Anmeldung nur Beraten und Erklären (nichts wird gespeichert); Bücher speichern erst nach Login.
// Der Verlauf liegt nur im Browser des Nutzers – der Server speichert nichts davon.
import { APP_SYSTEM, type ChatMessage } from './app-chat';

/** Werkzeuge ohne Anmeldung – speichern nichts */
export const WEB_ANON_WERKZEUGE = ['selfpublishbot_info'] as const;
export const WEB_ANON_MAX_NACHRICHTEN = 20;

export const WEB_LOGIN_HINWEIS = 'Dafür muss sich der Nutzer kurz anmelden (E-Mail-Code, kein Passwort). '
  + 'Sag ihm, dass er unter dem Chat auf „Anmelden“ tippen kann – der bisherige Chat bleibt erhalten. '
  + 'Ohne Anmeldung kann man schon die Idee besprechen, Titel und Klappentext entwerfen – gespeichert wird erst im Konto.';

export function anonymWerkzeug(name: string): boolean {
  return (WEB_ANON_WERKZEUGE as readonly string[]).includes(name);
}

export function anonymSperre(name: string): string | null {
  return anonymWerkzeug(name) ? null : WEB_LOGIN_HINWEIS;
}

export function zaehleNutzerNachrichten(messages: ChatMessage[]): number {
  return messages.filter((m) => m.role === 'user' && m.content.some((b) => b.type === 'text' || b.type === 'image' || b.type === 'document')).length;
}

export function webSystem(angemeldet: boolean): string {
  return [
    APP_SYSTEM.replace('Du läufst in der Selfpublishbot-App auf dem Handy.', 'Du läufst als Chat auf der Website selfpublishbot.de (Browser, oft am Handy).'),
    'Die Website hat den Nutzer schon begrüßt – nicht noch einmal begrüßen.',
    angemeldet
      ? 'Der Nutzer ist angemeldet: Alle Werkzeuge stehen zur Verfügung. Zuerst selfpublishbot_meine_buecher aufrufen.'
      : `Der Nutzer ist NICHT angemeldet. Hilf bei Idee, Titel, Gliederung und Klappentext, aber sag dazu, dass noch nichts gespeichert wird. Um ein Buch anzulegen und Kapitel zu sichern: ${WEB_LOGIN_HINWEIS}`,
    'Der Website-Chat ist eine Beta.',
  ].join('\n');
}

/** Nur Anfragen von der eigenen Website (Cookie-Login → CSRF-Schutz). */
export function webOriginErlaubt(origin: string | null, own: string, dev = false): boolean {
  if (!origin || origin === 'null') return false;
  if (origin === own) return true;
  if (/^https:\/\/(www\.)?selfpublishbot\.(de|com)$/.test(origin)) return true;
  return dev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}
