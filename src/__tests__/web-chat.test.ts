import { describe, expect, it } from 'vitest';
import { anonymSperre, anonymWerkzeug, webOriginErlaubt, webSystem } from '@/lib/web-chat';

describe('Website-Chat', () => {
  it('ohne Anmeldung nur Info, nichts speichern', () => {
    expect(anonymWerkzeug('selfpublishbot_info')).toBe(true);
    expect(anonymWerkzeug('selfpublishbot_buch_anlegen')).toBe(false);
    expect(anonymSperre('selfpublishbot_kapitel_speichern')).toMatch(/anmelden/);
    expect(anonymSperre('selfpublishbot_info')).toBeNull();
  });
  it('nur eigene Origin', () => {
    expect(webOriginErlaubt('https://www.selfpublishbot.de', 'https://x')).toBe(true);
    expect(webOriginErlaubt('https://selfpublishbot.com', 'https://x')).toBe(true);
    expect(webOriginErlaubt('https://boese.de', 'https://x')).toBe(false);
    expect(webOriginErlaubt(null, 'https://x')).toBe(false);
  });
  it('System-Text: angemeldet zuerst Bücher, anonym ohne Speichern', () => {
    expect(webSystem(true)).toMatch(/meine_buecher/);
    expect(webSystem(false)).toMatch(/nichts gespeichert/);
  });
});
