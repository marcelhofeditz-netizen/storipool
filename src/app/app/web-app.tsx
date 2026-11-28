'use client';
import { useCallback, useEffect, useState } from 'react';

type Tab = 'chat' | 'buecher' | 'konto';
interface Buch { id: string; titel: string; autor: string; genre: string | null; status: string; siegel: string | null; diktat_quote: number | null; updated_at: string }
interface Stand { kapitel: { nr: number; titel: string | null; woerter: number }[]; woerter_gesamt: number; rohtexte: number; siegel_name: string | null }
interface KontoInfo { email: string | null; connector: { url: string; verbunden: string[] } }

const SIEGEL: Record<string, string> = { selbst_erzaehlt: 'Selbst erzählt', mit_ki: 'Mit KI geschrieben', ki_erzaehlt: 'KI-erzählt' };
const STATUS: Record<string, string> = { entwurf: 'Entwurf', eingereicht: 'Eingereicht', veroeffentlicht: 'Im Regal', gesperrt: 'Gesperrt' };
const MCP = 'https://www.selfpublishbot.de/mcp';

export default function WebApp({ email }: { email: string | null }) {
  const [tab, setTab] = useState<Tab>('chat');
  const [buecher, setBuecher] = useState<Buch[] | null>(null);
  const [offen, setOffen] = useState<string | null>(null);
  const [stand, setStand] = useState<Record<string, Stand>>({});
  const [konto, setKonto] = useState<KontoInfo | null>(null);
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    const h = (location.hash.slice(1) || 'chat') as Tab;
    if (['chat', 'buecher', 'konto'].includes(h)) setTab(h);
  }, []);
  const wechseln = (t: Tab) => { setTab(t); history.replaceState(null, '', `#${t}`); };

  const ladeBuecher = useCallback(async () => {
    setFehler('');
    try { const r = await fetch('/api/web/buecher', { credentials: 'same-origin' }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setBuecher(j.buecher); }
    catch (e) { setFehler(e instanceof Error ? e.message : 'Fehler'); }
  }, []);
  useEffect(() => {
    if (tab === 'buecher') void ladeBuecher();
    if (tab === 'konto' && !konto) void fetch('/api/web/konto', { credentials: 'same-origin' }).then((r) => r.json()).then(setKonto).catch(() => undefined);
  }, [tab, konto, ladeBuecher]);

  useEffect(() => {
    if (tab !== 'chat' || document.querySelector('script[data-spb-chat-js]')) return;
    const s = document.createElement('script'); s.src = '/assets/web-chat.js'; s.defer = true; s.dataset.spbChatJs = '1'; document.body.appendChild(s);
  }, [tab]);

  async function aufklappen(id: string) {
    setOffen(offen === id ? null : id);
    if (stand[id]) return;
    const r = await fetch(`/api/web/buecher?id=${encodeURIComponent(id)}`, { credentials: 'same-origin' });
    if (r.ok) { const j = await r.json(); setStand((s) => ({ ...s, [id]: j })); }
  }
  async function loeschen() {
    if (!confirm('Konto wirklich löschen? Alle deine Bücher, Kapitel und Rohtexte werden entfernt. Das kann nicht rückgängig gemacht werden.')) return;
    const r = await fetch('/api/web/konto', { method: 'DELETE', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ bestaetigt: true }) });
    if (!r.ok) { setFehler((await r.json().catch(() => ({}))).error || 'Fehler'); return; }
    try { localStorage.removeItem('selfpublishbot-chat-v1'); } catch { /* egal */ }
    location.href = '/?geloescht=1';
  }
  const frage = (t: string) => { wechseln('chat'); setTimeout(() => window.dispatchEvent(new CustomEvent('selfpublishbot:frage', { detail: t })), 300); };
  const url = konto?.connector.url ?? MCP;

  return (
    <div className="fbapp">
      <nav className="fbnav">
        {(['chat', 'buecher', 'konto'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => wechseln(t)}>{{ chat: 'Schreiben', buecher: 'Meine Bücher', konto: 'Konto' }[t]}</button>
        ))}
      </nav>
      {fehler && <div className="fbtab" style={{ paddingBottom: 0 }}><div className="fbhin" style={{ borderColor: '#ff8a8a' }}>{fehler}</div></div>}

      <div className="fbchat" style={{ display: tab === 'chat' ? 'flex' : 'none' }}><div data-spb-chat data-modus="app" /></div>

      {tab === 'buecher' && (
        <div className="fbtab">
          <div className="fbkpis">
            <div className="fbkpi"><span>Bücher</span><b>{buecher?.length ?? '–'}</b></div>
            <div className="fbkpi"><span>Eingereicht</span><b>{buecher ? buecher.filter((b) => b.status !== 'entwurf').length : '–'}</b></div>
          </div>
          <div className="fbliste">
            {!buecher && <div className="fbzeile">Lädt …</div>}
            {buecher?.length === 0 && <div className="fbzeile">Noch kein Buch. Erzähl im Chat, worum es gehen soll – der Selfpublishbot legt es für dich an.</div>}
            {buecher?.map((b) => (
              <div key={b.id}>
                <div className="fbzeile" style={{ cursor: 'pointer' }} onClick={() => aufklappen(b.id)}>
                  <div>{b.titel}{b.siegel && <span className="fbtag">{SIEGEL[b.siegel] ?? b.siegel}</span>}<small>{b.autor} · {STATUS[b.status] ?? b.status} · {new Date(b.updated_at).toLocaleDateString('de-DE')}</small></div>
                  <div className="n">{b.diktat_quote != null ? `${Math.round(b.diktat_quote * 100)} % eigene Worte` : ''}</div>
                </div>
                {offen === b.id && (
                  <div className="fbtab" style={{ paddingTop: 8 }}>
                    {!stand[b.id] ? <p>Lädt …</p> : <>
                      <p>{stand[b.id].kapitel.length} Kapitel · {stand[b.id].woerter_gesamt.toLocaleString('de-DE')} Wörter · {stand[b.id].rohtexte} gesicherte Rohtexte</p>
                      {stand[b.id].kapitel.map((k) => <div className="fbzeile" key={k.nr}><div>{k.nr}. {k.titel || 'Ohne Titel'}</div><div className="n">{k.woerter.toLocaleString('de-DE')} Wörter</div></div>)}
                    </>}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
                      <button className="fbbtn" onClick={() => frage(`Lass uns an meinem Buch „${b.titel}“ weiterschreiben.`)}>Weiterschreiben</button>
                      <button className="fbbtn ghost" onClick={() => frage(`Wie ist die Diktat-Quote von „${b.titel}“?`)}>Siegel prüfen</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}><button className="fbbtn" onClick={() => frage('Ich möchte ein neues Buch anfangen.')}>Neues Buch</button></div>
          <p style={{ color: '#a8a8a8' }}>Deine Bücher sind privat, bis du sie einreichst. Die Rechte bleiben bei dir.</p>
        </div>
      )}

      {tab === 'konto' && (
        <div className="fbtab">
          <h2>Angemeldet</h2>
          <p>{konto?.email ?? email}</p>
          <h2 id="ki-verbinden">In Claude oder ChatGPT schreiben</h2>
          {konto?.connector.verbunden.length ? <p>Verbunden ✓ ({konto.connector.verbunden.map((k) => (k === 'claude' ? 'Claude' : 'ChatGPT')).join(', ')})</p> : null}
          <p>In Claude: Einstellungen → Konnektoren → „Eigenen Konnektor hinzufügen“. In ChatGPT: Einstellungen → Apps & Konnektoren → „Erstellen“. Diese Adresse einfügen und mit deinem Selfpublishbot-Konto anmelden – dann diktierst du dein Buch dort weiter:</p>
          <div className="fbcopy"><code>{url}</code><button className="fbbtn ghost" onClick={() => navigator.clipboard?.writeText(url)}>Kopieren</button></div>
          <h2>Pakete</h2>
          <p>Schreiben ist kostenlos. E-Book, Hörbuch und gedrucktes Buch findest du auf der <a href="/preise.html" style={{ color: 'var(--g)' }}>Preisseite</a>.</p>
          <h2>Abmelden & Löschen</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="fbbtn ghost" href="/auth/logout">Abmelden</a>
            <button className="fbbtn rot" onClick={loeschen}>Konto löschen</button>
          </div>
        </div>
      )}
    </div>
  );
}
