// Herkunftssiegel: Wie viel des fertigen Buchs stammt aus den eigenen Worten des Autors?
// Vergleicht die Kapitel mit den gesicherten Rohtexten (Diktate/getippte Nachrichten) und berechnet
// die Diktat-Quote. Ergebnis ist ein Indiz, kein forensischer Beweis (siehe Bibliotheksordnung).

const FUELL = new Set(('äh ähm ähh äm öh öhm hm hmm mhm halt quasi sozusagen irgendwie ne gell eigentlich mal so ja also genau okay ok naja tja ' +
  'uh um uhm like basically').split(' '));
const STOP = new Set(('der die das den dem des ein eine einer eines einem einen und oder aber doch denn weil dass wenn als wie wo was wer ' +
  'ich du er sie es wir ihr mich mir dich dir sich uns euch ihn ihm ihnen mein meine meinen meinem meiner dein deine sein seine ihre unser ' +
  'nicht kein keine keinen noch schon auch nur sehr dann da hier dort jetzt immer wieder ganz viel mehr ist sind war waren bin bist hat ' +
  'habe hatte hatten haben wird werden wurde wurden kann können konnte muss müssen soll sollte will wollte mit von zu zur zum bei nach ' +
  'aus auf für über unter vor hinter neben zwischen durch gegen ohne um an am im in ins einem diese dieser dieses diesen jede jeder ' +
  'jedes alle alles man einmal etwas nichts dieser selbst wieder dabei damit darauf daran davon dazu wurde würde würden hätte hätten').split(' '));

const STUFEN = ['ki_erzaehlt', 'mit_ki', 'selbst_erzaehlt'];
const NAMEN = { selbst_erzaehlt: 'Selbst erzählt', mit_ki: 'Mit KI geschrieben', ki_erzaehlt: 'KI-erzählt' };

function woerter(t) {
  return String(t || '').toLowerCase()
    .replace(/[„“”"‚‘’'`´«»]/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/).filter(w => w && !FUELL.has(w));
}
function bigramme(ws) { const s = []; for (let i = 0; i + 1 < ws.length; i++) s.push(ws[i] + ' ' + ws[i + 1]); return s; }
function saetze(t) {
  return String(t || '').replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+(?=[„"A-ZÄÖÜ0-9])/).map(s => s.trim()).filter(Boolean);
}

// Sprech-Indizien: Diktierte Rohtexte haben Füllwörter, wenig Satzzeichen, lange Satzketten.
function sprechwert(roh) {
  const t = String(roh || '');
  const alle = t.toLowerCase().split(/\s+/).filter(Boolean);
  if (alle.length < 30) return null;
  const fuell = alle.filter(w => FUELL.has(w.replace(/[^\p{L}]/gu, ''))).length / alle.length;
  const zeichen = (t.match(/[.,;:!?]/g) || []).length / alle.length;
  let s = 0;
  s += Math.min(1, fuell / 0.06) * 0.6;          // ab ~6 % Füllwörter: klar gesprochen
  s += (zeichen < 0.06 ? 1 : zeichen < 0.1 ? 0.5 : 0) * 0.4;
  return Math.round(s * 100) / 100;
}

function stufeAus(quote, inhalt) {
  if (quote >= 0.7) return 'selbst_erzaehlt';
  if (quote >= 0.3 || inhalt >= 0.5) return 'mit_ki';
  return 'ki_erzaehlt';
}

/**
 * @param {{rohtexte:{text:string,quelle:string,zeit:string}[], kapitel:{nr:number,titel:string,text:string}[]}} d
 * @param {string|null} selbstauskunft
 */
function pruefe(d, selbstauskunft) {
  const roh = d.rohtexte || [];
  const kap = (d.kapitel || []).filter(k => k.text && k.text.trim());
  const rohW = roh.map(r => woerter(r.text));
  const B = new Set(); rohW.forEach(ws => bigramme(ws).forEach(b => B.add(b)));
  const V = new Set(); rohW.forEach(ws => ws.forEach(w => V.add(w)));
  // dasselbe nur aus Diktat/Getipptem (ohne eingefügte Texte)
  const Beigen = new Set(); roh.forEach((r, i) => { if (r.quelle !== 'eingefuegt') bigramme(rohW[i]).forEach(b => Beigen.add(b)); });

  let ges = 0, eigen = 0, angelehnt = 0, eigenOhneEingefuegt = 0;
  const kapitel = [], schwach = [];
  for (const k of kap) {
    let kg = 0, ke = 0;
    for (const s of saetze(k.text)) {
      const ws = woerter(s); if (!ws.length) continue;
      const bg = bigramme(ws);
      const cov = bg.length ? bg.filter(b => B.has(b)).length / bg.length : (V.has(ws[0]) ? 1 : 0);
      const covE = bg.length ? bg.filter(b => Beigen.has(b)).length / bg.length : 0;
      const inhaltW = ws.filter(w => w.length >= 4 && !STOP.has(w));
      const inh = inhaltW.length ? inhaltW.filter(w => V.has(w)).length / inhaltW.length : cov;
      const n = ws.length; ges += n; kg += n;
      if (cov >= 0.5) { eigen += n; ke += n; if (covE >= 0.5) eigenOhneEingefuegt += n; }
      else if (inh >= 0.6) angelehnt += n;
      else if (n >= 8) schwach.push({ kapitel: k.nr, satz: s.length > 160 ? s.slice(0, 157) + '…' : s, abdeckung: Math.round(cov * 100) });
    }
    kapitel.push({ nr: k.nr, titel: k.titel || '', woerter: kg, diktat_quote: kg ? Math.round(ke / kg * 100) / 100 : 0 });
  }
  if (!ges) return { fehler: 'Noch keine Kapitel gespeichert – erst kapitel_speichern, dann prüfen.' };

  const quote = Math.round(eigen / ges * 100) / 100;
  const inhalt = Math.round((eigen + angelehnt) / ges * 100) / 100;
  const berechnet = stufeAus(quote, inhalt);

  const hinweise = []; let pruefen = false;
  const tage = new Set(roh.map(r => String(r.zeit || '').slice(0, 10)).filter(Boolean)).size;
  const rohWoerter = rohW.reduce((a, w) => a + w.length, 0);
  const diktate = roh.filter(r => r.quelle === 'diktat');
  const sw = diktate.map(r => sprechwert(r.text)).filter(x => x !== null);
  const sprech = sw.length ? Math.round(sw.reduce((a, b) => a + b, 0) / sw.length * 100) / 100 : null;

  if (eigen && eigenOhneEingefuegt / eigen < 0.5) {
    hinweise.push('Der Großteil der übereinstimmenden Sätze stammt aus eingefügten Texten, nicht aus Diktat oder Getipptem. Eingefügte Texte können von einer KI stammen – ein Mensch liest gegen.');
    pruefen = true;
  }
  if (berechnet === 'selbst_erzaehlt' && roh.length < 3 && rohWoerter > 3000) {
    hinweise.push('Sehr viel Text in sehr wenigen Rohtexten. Bücher, die über viele Diktate entstehen, sind glaubwürdiger – ein Mensch liest gegen.');
    pruefen = true;
  }
  if (sprech !== null && sprech < 0.15 && diktate.length >= 3) {
    hinweise.push('Die als Diktat gesicherten Rohtexte klingen kaum gesprochen (fast keine Füllwörter, viele Satzzeichen).');
    pruefen = true;
  }

  let siegel = berechnet;
  const auskunft = STUFEN.includes(selbstauskunft) ? selbstauskunft : null;
  if (auskunft) {
    const a = STUFEN.indexOf(auskunft), b = STUFEN.indexOf(berechnet);
    if (a < b) siegel = auskunft; // ehrlich niedriger angegeben → Selbstauskunft gilt
    if (a > b) hinweise.push(`Selbstauskunft „${NAMEN[auskunft]}“ ist höher als der Nachweis – das Siegel richtet sich nach dem Nachweis („${NAMEN[berechnet]}“).`);
  }

  return {
    siegel, siegel_name: NAMEN[siegel], berechnet, selbstauskunft: auskunft,
    diktat_quote: quote, inhalt_quote: inhalt,
    woerter_buch: ges, rohtexte: roh.length, woerter_rohtexte: rohWoerter, schreibtage: tage,
    sprechwert: sprech, pruefen, hinweise,
    kapitel, schwaechste_saetze: schwach.slice(0, 5)
  };
}

export { pruefe, woerter, sprechwert, NAMEN, STUFEN };
