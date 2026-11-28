// Selfpublishbot: Texte und reine Hilfen (ohne Server-Abhängigkeiten, testbar).

export const SELFPUBLISHBOT_ORIGIN = 'https://www.selfpublishbot.de';
export const SELFPUBLISHBOT_MCP_URL = `${SELFPUBLISHBOT_ORIGIN}/mcp`;

export const SELFPUBLISHBOT_INSTRUCTIONS = [
  'Selfpublishbot hilft Menschen, ihr eigenes Buch oder Hörbuch zu schreiben und zu veröffentlichen – am liebsten, indem sie es dir erzählen oder diktieren. Du bist ein freundlicher Begleiter wie ein alter Bibliothekar: neugierig, warm, stell immer nur eine Frage auf einmal.',
  'Ablauf: 1) selfpublishbot_meine_buecher – gibt es schon ein Buch? Sonst selfpublishbot_buch_anlegen (Titel darf ein Arbeitstitel sein). 2) Erzählen lassen: Worum geht es, wer ist die Hauptfigur, wo beginnt es? Roman, Sachbuch oder Erinnerungen? 3) Kapitel gemeinsam schreiben und mit selfpublishbot_kapitel_speichern ablegen (jede neue Fassung überschreibt die alte). 4) selfpublishbot_herkunft_pruefen zeigt Diktat-Quote und Siegel. 5) selfpublishbot_buch_einreichen schickt das Buch an die Bibliothek – nur nach ausdrücklicher Bestätigung (bestaetigt: true).',
  'Herkunftsnachweis (Pflicht): Rufe selfpublishbot_rohtext_sichern nach JEDER Nachricht auf, in der der Mensch Inhalte für sein Buch erzählt, diktiert oder tippt – mit seinem exakten, unveränderten Wortlaut, inklusive Füllwörtern und Fehlern. Nie eigene, überarbeitete oder zusammengefasste Texte als Rohtext senden. Fertig eingefügte Texte mit quelle "eingefuegt".',
  'Überarbeite behutsam: Je mehr Sätze in seinen eigenen Worten bleiben, desto höher das Herkunftssiegel („Selbst erzählt“ ab 70 % eigene Worte, „Mit KI geschrieben“ ab 30 %, sonst „KI-erzählt“). Jede Stufe ist willkommen. Frag nach, statt Inhalte zu erfinden.',
  'Echte Menschen: Kommen andere reale Personen vor, frag, ob Namen verfremdet werden sollen, bevor das Buch eingereicht wird. Keine Rechtsberatung.',
  'Nichts erfinden: Preise und Stand nur aus selfpublishbot_info. Keine Verlagszusagen, keine Bestseller-Versprechen. Die Rechte am Buch bleiben beim Autor.',
  'Bücher aus dem ersten Connector (mit buch_id und schluessel): mit selfpublishbot_buch_uebernehmen ins Konto holen.',
].join('\n');

export const SELFPUBLISHBOT_INFO = {
  name: 'Selfpublishbot',
  website: SELFPUBLISHBOT_ORIGIN,
  betreiber: 'Dr. Hofeditz Real Estate GmbH, Hamburg',
  stand: {
    schreiben: 'Alpha – Bücher anlegen, Kapitel schreiben und speichern, Rohtexte sichern, Herkunftssiegel prüfen, bei der Bibliothek einreichen',
    regal: 'Leseproben und Hörproben im Regal auf selfpublishbot.de; erste Hörbücher zum Kauf: „Die Rückkehr“ und „Das Ganze“ von Dr. Marcel Hofeditz',
    noch_nicht: ['Pakete buchen (E-Book, Hörbuch, Komplett) – Vormerken auf /preise', 'Hörbuch-Erzeugung aus dem eigenen Buch', 'Instagram- und Foto-Import', 'Druck'],
  },
  preise: [
    { name: 'Schreiben', preis: 'kostenlos', details: 'Buch im Chat schreiben, Cover, Klappentext, Leseprobe im Regal' },
    { name: 'E-Book', preis: '29 € einmalig', details: 'ganzes Buch im Regal, E-Book-Verkauf mit eigenem Preis, 70 % an den Autor' },
    { name: 'Hörbuch', preis: '79 € einmalig', details: 'komplettes Hörbuch mit KI-Stimme, Hörprobe im Regal, MP3-Download' },
    { name: 'Komplett', preis: '199 € einmalig', details: 'E-Book, Hörbuch und gedrucktes Buch' },
    { name: 'Geschenkbuch', preis: '49 € je Exemplar, ab 5 Stück 39 €, inkl. Versand DE', details: 'Hardcover mit eigenem Cover' },
  ],
  scout: 'Bücher oben in der Bestenliste stellen wir mit unserer Partneragentur Verlagen und Produktionen vor – kostenlos, nur bei Vertrag 15 % Provision.',
  rechte: 'Die Rechte am Buch bleiben beim Autor. Nichts ist exklusiv; Rückzug jederzeit.',
  daten: 'Bücher, Kapitel und Rohtexte liegen privat im Konto des Autors (Server in Frankfurt), bis er einreicht. Rohtexte dienen nur dem Herkunftssiegel.',
} as const;

export const SELBSTAUSKUNFT = ['selbst_erzaehlt', 'mit_ki', 'ki_erzaehlt'] as const;
export type Selbstauskunft = (typeof SELBSTAUSKUNFT)[number];

export function woerterZahl(t: string | null | undefined): number {
  return String(t ?? '').trim().split(/\s+/).filter(Boolean).length;
}
