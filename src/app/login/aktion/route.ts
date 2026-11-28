import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { safeNext } from '@/lib/redirect';
import { reviewZugang } from '@/lib/review-login';
import { createServiceClient } from '@/lib/supabase';
import { zustimmungSpeichern } from '@/lib/zustimmung';

/**
 * Login-Schritte als normaler Formular-POST mit 303-Weiterleitung.
 * Funktioniert ohne JavaScript und ohne Client-Router – wichtig für In-App-Browser
 * (Claude/ChatGPT am Handy), in denen die Weiterleitung nach Server Actions hängen blieb.
 */
const PENDING = 'fb_login_email';
const ZUSTIMMUNG = 'fb_login_zustimmung';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function go(req: Request, path: string) {
  return NextResponse.redirect(new URL(path, req.url), 303);
}

export async function POST(req: Request) {
  // Nur Formulare von der eigenen Seite
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const form = await req.formData();
  const schritt = String(form.get('schritt') ?? '');
  const next = safeNext(String(form.get('next') ?? ''));
  const q = `next=${encodeURIComponent(next)}`;
  const store = await cookies();

  if (schritt === 'senden') {
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 200) return go(req, `/login?fehler=email&${q}`);
    // AGB + Datenschutz: Zustimmung vor der Registrierung (gespeichert mit Version nach erfolgreichem Code)
    if (String(form.get('zustimmung') ?? '') !== '1') return go(req, `/login?fehler=zustimmung&${q}`);
    store.set(ZUSTIMMUNG, '1', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 900, path: '/' });
    // App-Store-/Play-Prüfer: kein Mailversand, fester Code aus der Umgebung
    if (reviewZugang(email, null, process.env.SELFPUBLISHBOT_REVIEW_LOGIN).istReview) {
      store.set(PENDING, email, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 900, path: '/' });
      return go(req, `/login?schritt=code&${q}`);
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) {
      console.error('[login] Code nicht verschickt', { status: error.status, code: error.code, message: error.message });
      return go(req, `/login?fehler=${error.status === 429 ? 'limit' : 'senden'}&${q}`);
    }
    store.set(PENDING, email, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 900, path: '/' });
    return go(req, `/login?schritt=code&${q}`);
  }

  /** Zustimmung zum gerade angemeldeten Nutzer speichern (Nutzer aus der Sitzung, nie aus dem Formular) */
  async function zustimmungNachLogin() {
    const zustimmung = store.get(ZUSTIMMUNG)?.value === '1';
    if (!zustimmung) return;
    store.delete(ZUSTIMMUNG);
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (!user) return;
    if (zustimmung) await zustimmungSpeichern(user.id, next);
  }

  if (schritt === 'pruefen') {
    const email = store.get(PENDING)?.value ?? '';
    const token = String(form.get('code') ?? '').replace(/\D/g, '');
    if (!email) return go(req, `/login?fehler=abgelaufen&${q}`);
    if (token.length < 6) return go(req, `/login?schritt=code&fehler=code&${q}`);
    const supabase = await createClient();
    const review = reviewZugang(email, token, process.env.SELFPUBLISHBOT_REVIEW_LOGIN);
    if (review.istReview) {
      if (!review.codeOk) return go(req, `/login?schritt=code&fehler=code&${q}`);
      const { data: link, error: linkErr } = await createServiceClient().auth.admin.generateLink({ type: 'magiclink', email });
      const otp = link?.properties?.email_otp;
      if (linkErr || !otp) return go(req, `/login?schritt=code&fehler=code&${q}`);
      const { error: rErr } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (rErr) return go(req, `/login?schritt=code&fehler=code&${q}`);
      store.delete(PENDING);
      await zustimmungNachLogin();
      return go(req, next);
    }
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) {
      console.warn('[login] Code abgelehnt', { status: error.status, code: error.code });
      return go(req, `/login?schritt=code&fehler=code&${q}`);
    }
    store.delete(PENDING);
    await zustimmungNachLogin();
    return go(req, next);
  }

  // neu: andere E-Mail / neuen Code
  store.delete(PENDING);
  return go(req, `/login?${q}`);
}
