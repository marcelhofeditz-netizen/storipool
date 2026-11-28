import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { safeNext } from '@/lib/redirect';
import { AGB_STAND, AGB_VERSION } from '@/lib/rechtstexte';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Anmelden · Selfpublishbot', robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

/** Wartende E-Mail zwischen Schritt 1 und 2 – im Cookie, nie in der URL (gesetzt in ./aktion) */
const PENDING = 'fb_login_email';

const FEHLER: Record<string, string> = {
  email: 'Bitte eine gültige E-Mail-Adresse eingeben.',
  senden: 'Der Code konnte gerade nicht verschickt werden. Bitte in einer Minute noch einmal.',
  limit: 'Zu viele Versuche in kurzer Zeit. Bitte ein paar Minuten warten und dann noch einmal.',
  code: 'Der Code stimmt nicht oder ist abgelaufen. Bitte noch einmal eingeben oder einen neuen anfordern.',
  abgelaufen: 'Die Anmeldung ist abgelaufen. Bitte die E-Mail-Adresse noch einmal eingeben.',
  zustimmung: 'Bitte stimme den AGB und der Datenschutzerklärung zu.',
};

/** Anmeldung mit Einmal-Code aus der E-Mail – bleibt im selben Fenster (wichtig für Claude/ChatGPT am Handy). */
export default async function LoginPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const next = safeNext(one(sp.next) ?? '/app');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(next);
  const pending = (await cookies()).get(PENDING)?.value ?? null;
  const fehler = one(sp.fehler);
  const codeStep = one(sp.schritt) === 'code' && !!pending;

  return (
    <>
      <div className="eyebrow">Anmelden</div>
      {codeStep ? (
        <>
          <h1>Code eingeben</h1>
          <p>Wir haben dir einen Code an <strong>{pending}</strong> geschickt. Gib ihn hier ein – dieses Fenster offen lassen.</p>
          <form action="/login/aktion" method="post">
            <input type="hidden" name="schritt" value="pruefen" />
            <input type="hidden" name="next" value={next} />
            <input className="code" type="text" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={8} required placeholder="12345678" autoFocus />
            {fehler ? <p className="muted">{FEHLER[fehler] ?? FEHLER.code}</p> : null}
            <button className="btn solid" type="submit">Anmelden</button>
          </form>
          <form action="/login/aktion" method="post" style={{ marginTop: 18 }}>
            <input type="hidden" name="schritt" value="neu" />
            <input type="hidden" name="next" value={next} />
            <button className="btn" type="submit">Andere E-Mail / neuen Code</button>
          </form>
          <p className="muted" style={{ marginTop: 22 }}>Keine Mail? Bitte auch im Spam-Ordner nachsehen.</p>
        </>
      ) : (
        <>
          <h1>Mit deiner E-Mail anmelden</h1>
          <p>Wir schicken dir einen Code – kein Passwort nötig.</p>
          <form action="/login/aktion" method="post">
            <input type="hidden" name="schritt" value="senden" />
            <input type="hidden" name="next" value={next} />
            <input type="email" name="email" required placeholder="du@beispiel.de" autoComplete="email" defaultValue={pending ?? undefined} />
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '14px 0', fontSize: 14, lineHeight: 1.45, textAlign: 'left' }}>
              <input type="checkbox" name="zustimmung" value="1" required style={{ width: 18, height: 18, marginTop: 2, flex: 'none' }} />
              <span>Ich akzeptiere die <a href="/agb" target="_blank" rel="noopener">AGB</a> (Version {AGB_VERSION}, Stand {AGB_STAND}) und habe die <a href="/datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen.</span>
            </label>
            {fehler ? <p className="muted">{FEHLER[fehler] ?? FEHLER.senden}</p> : null}
            <button className="btn solid" type="submit">Code schicken</button>
          </form>
          <p className="muted" style={{ marginTop: 28 }}>Mit der Anmeldung entsteht ein Selfpublishbot-Konto. Gespeichert werden E-Mail, deine Bücher mit Kapiteln und die Rohtexte für das Herkunftssiegel. Deine Bücher sind privat, bis du sie einreichst. Server in Frankfurt.</p>
        </>
      )}
    </>
  );
}
