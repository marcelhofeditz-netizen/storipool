declare module '@/legacy/_lib/herkunft.js' {
  interface Ergebnis { fehler?: string; siegel?: string; diktat_quote?: number; pruefen?: boolean; schwaechste_saetze?: unknown[]; [k: string]: unknown }
  const herkunft: {
    pruefe(d: { kapitel: { nr: number; titel: string | null; text: string }[]; rohtexte: { text: string; quelle: string; zeit: string }[] }, selbstauskunft: string | null): Ergebnis;
    NAMEN: Record<string, string>;
    STUFEN: string[];
    woerter(t: string): string[];
  };
  export default herkunft;
}
declare module '@/legacy/*.js' {
  const handler: (req: unknown, res: unknown) => unknown;
  export default handler;
}
