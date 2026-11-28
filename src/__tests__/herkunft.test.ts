import { describe, expect, it } from 'vitest';
import herkunft from '@/legacy/_lib/herkunft.js';
import { SELFPUBLISHBOT_INFO, woerterZahl } from '@/lib/info';

const diktat = 'also ich bin damals äh mit dem Zug nach Hamburg gefahren und hab da meine erste Wohnung gefunden die war direkt am Hafen und ganz klein';

describe('Herkunftssiegel', () => {
  it('eigene Worte → Selbst erzählt', () => {
    const e = herkunft.pruefe({ kapitel: [{ nr: 1, titel: 'Ankunft', text: 'Ich bin damals mit dem Zug nach Hamburg gefahren und hab da meine erste Wohnung gefunden. Die war direkt am Hafen und ganz klein.' }], rohtexte: [{ text: diktat, quelle: 'diktat', zeit: '2026-11-27T10:00:00Z' }] }, null);
    expect(e.siegel).toBe('selbst_erzaehlt');
  });
  it('fremder Text → KI-erzählt', () => {
    const e = herkunft.pruefe({ kapitel: [{ nr: 1, titel: null, text: 'Die Morgensonne tauchte die Speicherstadt in goldenes Licht, während Möwen kreischend über die Elbe zogen und Schiffe gemächlich vorbeiglitten.' }], rohtexte: [{ text: diktat, quelle: 'diktat', zeit: '2026-11-27T10:00:00Z' }] }, null);
    expect(e.siegel).toBe('ki_erzaehlt');
  });
  it('ehrlich niedrigere Selbstauskunft gilt', () => {
    const e = herkunft.pruefe({ kapitel: [{ nr: 1, titel: null, text: 'Ich bin damals mit dem Zug nach Hamburg gefahren.' }], rohtexte: [{ text: diktat, quelle: 'diktat', zeit: '2026-11-27' }] }, 'mit_ki');
    expect(e.siegel).toBe('mit_ki');
  });
  it('ohne Kapitel → Fehler', () => {
    expect(herkunft.pruefe({ kapitel: [], rohtexte: [] }, null).fehler).toBeTruthy();
  });
});

describe('Info', () => {
  it('Wörter zählen', () => { expect(woerterZahl('  eins zwei\ndrei ')).toBe(3); expect(woerterZahl(null)).toBe(0); });
  it('nie „provisionsfrei“ oder Verlagszusagen', () => {
    const t = JSON.stringify(SELFPUBLISHBOT_INFO).toLowerCase();
    expect(t).not.toContain('provisionsfrei');
    expect(t).not.toContain('garantiert');
  });
});
