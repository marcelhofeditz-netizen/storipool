/** Nur eigene, relative Pfade als Rücksprung (keine offenen Weiterleitungen) */
export function safeNext(v: string | null | undefined): string {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\') || /[\r\n]/.test(v)) return '/app';
  return v.slice(0, 2000);
}
