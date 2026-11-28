/* Selfpublishbot – KI-Chat auf der Website (selfpublishbot.de) und in der Web-App.
 * Einbinden: <div data-spb-chat></div> + <script defer src="/assets/web-chat.js"></script>
 * Optional data-modus="app" (Vollbild in /app). Der Verlauf liegt nur in diesem Browser; der Server speichert nichts.
 */
(function () {
  'use strict';
  var root = document.querySelector('[data-spb-chat]');
  if (!root) return;
  var APP = root.getAttribute('data-modus') === 'app';
  var KEY = 'selfpublishbot-chat-v1';
  var TTL = (APP ? 30 : 7) * 24 * 60 * 60 * 1000;
  var GRUEN = '#F2B544';
  var BEGRUESSUNG = 'Willkommen in der Bibliothek! Ich bin dein Selfpublishbot. Erzähl mir von deinem Buch – gern per Spracheingabe, ganz wie es dir einfällt. Worum soll es gehen?';
  var CHIPS = ['Ich will meine Lebensgeschichte aufschreiben', 'Ich habe eine Idee für einen Roman', 'Hilf mir mit einem Buchtitel', 'Was kostet ein Hörbuch?'];

  var css = '' +
    '.spc{width:100%;max-width:' + (APP ? 'none' : '640px') + ';margin-top:' + (APP ? '0' : '8px') + ';background:#0b0b0bf2;border:1px solid #ffffff33;color:#fff;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;text-align:left;display:flex;flex-direction:column;' + (APP ? 'flex:1;height:100%;border:0;' : '') + '}' +
    '.spc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid #ffffff1f}' +
    '.spc-title{margin:0;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}' +
    '.spc-status{font-size:11px;letter-spacing:.08em;color:#a8a8a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.spc-status b{display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%;background:' + GRUEN + ';vertical-align:middle}' +
    '.spc-beta{padding:10px 18px;border-bottom:1px solid #ffffff1f;font-size:12px;line-height:1.45;color:#ddd;background:#ffffff0d}.spc-beta b{display:inline-block;margin-right:8px;padding:2px 6px;border:1px solid ' + GRUEN + ';font-size:10px;letter-spacing:.16em;color:' + GRUEN + '}' +
    '.spc-log{display:flex;flex-direction:column;gap:10px;padding:16px 18px;overflow-y:auto;' + (APP ? 'flex:1;' : 'max-height:460px;min-height:220px;') + '}' +
    '.spc-m{max-width:88%;padding:11px 14px;font-size:15px;line-height:1.5;word-wrap:break-word}.spc-m p{margin:0 0 8px}.spc-m p:last-child{margin:0}.spc-m ul{margin:4px 0 8px;padding-left:18px}' +
    '.spc-m table{border-collapse:collapse;margin:6px 0;font-size:14px;width:100%}.spc-m td,.spc-m th{border-bottom:1px solid #ffffff26;padding:4px 6px;text-align:left}.spc-m td:last-child,.spc-m th:last-child{text-align:right}' +
    '.spc-m a{color:' + GRUEN + ';text-decoration:underline}' +
    '.spc-u{align-self:flex-end;background:#fff;color:#000}' +
    '.spc-a{align-self:flex-start;background:#1a1a1a;border:1px solid #ffffff1a}' +
    '.spc-f{align-self:center;font-size:13px;color:#ffb4b4;background:none;padding:2px}' +
    '.spc-chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 12px}' +
    '.spc-chip{border:1px solid #ffffff4d;background:transparent;color:#ddd;font-size:13px;padding:8px 12px;cursor:pointer;border-radius:999px}.spc-chip:hover{border-color:' + GRUEN + ';color:#fff}' +
    '.spc-in{display:flex;align-items:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #ffffff1f}' +
    '.spc-in textarea{flex:1;min-height:44px;max-height:140px;resize:none;background:#000;color:#fff;border:1px solid #ffffff40;padding:11px 12px;font:16px/1.4 "Helvetica Neue",Helvetica,Arial,sans-serif}' +
    '.spc-in textarea:focus{outline:none;border-color:' + GRUEN + '}' +
    '.spc-send{flex:none;height:44px;padding:0 18px;border:1px solid ' + GRUEN + ';background:' + GRUEN + ';color:#000;font:700 11px/1 "Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}.spc-send:disabled{opacity:.4;cursor:default}' +
    '.spc-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 14px;margin:6px 6px 0 0;border:1px solid ' + GRUEN + ';color:' + GRUEN + ';font:700 11px/1 "Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;text-decoration:none}' +
    '.spc-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 14px;padding:0 18px 14px;font-size:11px;line-height:1.45;color:#8a8a8a}' +
    '.spc-foot a,.spc-foot button{color:#bbb;background:none;border:0;padding:0;font:inherit;text-decoration:underline;cursor:pointer}' +
    '.spc-typing{align-self:flex-start;display:flex;gap:5px;padding:12px 14px;background:#1a1a1a}.spc-typing i{width:6px;height:6px;border-radius:50%;background:' + GRUEN + ';animation:spcb 1s infinite}.spc-typing i:nth-child(2){animation-delay:.15s}.spc-typing i:nth-child(3){animation-delay:.3s}' +
    '@keyframes spcb{0%,80%,100%{opacity:.25}40%{opacity:1}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var state = { verlauf: [], anzeige: [], angemeldet: false, email: null, aktiv: true, busy: false };
  function laden() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.ts && Date.now() - s.ts < TTL && Array.isArray(s.verlauf) && Array.isArray(s.anzeige)) { state.verlauf = s.verlauf; state.anzeige = s.anzeige; }
      else localStorage.removeItem(KEY);
    } catch (e) { /* privat-modus */ }
  }
  function speichern() { try { localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), verlauf: state.verlauf, anzeige: state.anzeige })); } catch (e) { /* voll */ } }

  // ---------- Markdown (klein, sicher) ----------
  function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function inline(s) {
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\(((?:https:\/\/|\/)[^\s)]+)\)/g, function (_, t, u) { return '<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>'; });
    s = s.replace(/(^|[\s(])(https:\/\/[^\s<)]+)/g, function (_, p, u) { return p + '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return s;
  }
  function md(text) {
    var lines = String(text || '').split('\n'), out = [], i = 0;
    while (i < lines.length) {
      var l = lines[i];
      if (/^\s*\|.*\|\s*$/.test(l)) {
        var rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++; }
        var html = '<table>';
        rows.forEach(function (r, ri) {
          if (/^\s*\|[\s:|-]+\|\s*$/.test(r)) return;
          var cells = r.trim().replace(/^\||\|$/g, '').split('|');
          var tag = ri === 0 ? 'th' : 'td';
          html += '<tr>' + cells.map(function (c) { return '<' + tag + '>' + inline(c.trim()) + '</' + tag + '>'; }).join('') + '</tr>';
        });
        out.push(html + '</table>'); continue;
      }
      if (/^\s*[-*•]\s+/.test(l)) {
        var items = [];
        while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) { items.push('<li>' + inline(lines[i].replace(/^\s*[-*•]\s+/, '')) + '</li>'); i++; }
        out.push('<ul>' + items.join('') + '</ul>'); continue;
      }
      if (/^\s*$/.test(l)) { i++; continue; }
      var para = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^\s*\|.*\|\s*$/.test(lines[i]) && !/^\s*[-*•]\s+/.test(lines[i])) { para.push(inline(lines[i].replace(/^#+\s*/, ''))); i++; }
      out.push('<p>' + para.join('<br>') + '</p>');
    }
    return out.join('');
  }

  root.innerHTML = '' +
    '<div class="spc" role="region" aria-label="Selfpublishbot KI-Chat">' +
      '<div class="spc-head"><p class="spc-title">Dein Buch im KI-Chat</p><span class="spc-status" aria-live="polite"><b></b>Ohne Anmeldung</span></div>' +
      '<div class="spc-beta"><b>BETA</b>Ohne Anmeldung kannst du deine Idee besprechen. Damit Kapitel und Herkunftssiegel gespeichert werden, melde dich an – die Rechte bleiben bei dir.</div>' +
      '<div class="spc-log" aria-live="polite"></div>' +
      '<div class="spc-chips"></div>' +
      '<form class="spc-in"><textarea rows="1" placeholder="Erzähl oder schreib hier …" aria-label="Nachricht an den Selfpublishbot" maxlength="8000"></textarea><button class="spc-send" type="submit">Senden</button></form>' +
      '<div class="spc-foot"><span>KI-Assistent. Ohne Anmeldung gehen Nachrichten nur zur Beantwortung an unseren KI-Dienstleister – wir speichern nichts. <a href="/datenschutz.html">Datenschutz</a></span><span><a class="spc-login" href="/login?next=/app">Anmelden</a> · <button type="button" class="spc-clear">Chat löschen</button></span></div>' +
    '</div>';
  var log = root.querySelector('.spc-log'), chips = root.querySelector('.spc-chips'), form = root.querySelector('.spc-in');
  var ta = root.querySelector('textarea'), send = root.querySelector('.spc-send'), status = root.querySelector('.spc-status');

  function zeichnen() {
    log.innerHTML = '';
    var alle = [{ rolle: 'a', text: BEGRUESSUNG }].concat(state.anzeige);
    alle.forEach(function (m) {
      var d = document.createElement('div');
      d.className = 'spc-m ' + (m.rolle === 'u' ? 'spc-u' : m.rolle === 'f' ? 'spc-f' : 'spc-a');
      if (m.rolle === 'u') d.textContent = m.text; else d.innerHTML = md(m.text);
      (m.links || []).forEach(function (l) { var a = document.createElement('a'); a.className = 'spc-btn'; a.href = l.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = l.label; d.appendChild(a); });
      log.appendChild(d);
    });
    if (state.busy) { var t = document.createElement('div'); t.className = 'spc-typing'; t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); }
    chips.innerHTML = '';
    if (!state.anzeige.length) CHIPS.forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.className = 'spc-chip'; b.textContent = c; b.onclick = function () { senden(c); }; chips.appendChild(b); });
    send.disabled = state.busy || !state.aktiv;
    log.scrollTop = log.scrollHeight;
  }
  function linkLabel(u) {
    if (/checkout\.stripe|billing\.stripe/.test(u)) return 'Bezahlen';
    if (/\/preise/.test(u)) return 'Preise';
    if (/\/login/.test(u)) return 'Anmelden';
    return 'Öffnen';
  }
  function senden(text) {
    text = String(text || '').trim();
    if (!text || state.busy) return;
    state.verlauf.push({ role: 'user', content: [{ type: 'text', text: text }] });
    state.anzeige.push({ rolle: 'u', text: text });
    state.busy = true; zeichnen(); speichern();
    fetch('/api/web/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ messages: state.verlauf }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        state.busy = false;
        if (!x.ok) {
          state.verlauf.pop();
          state.anzeige.push({ rolle: 'f', text: x.j.error || 'Da ist etwas schiefgelaufen.' });
          if (x.j.login_noetig) state.anzeige.push({ rolle: 'a', text: 'Melde dich kurz an – dein Chat bleibt erhalten.', links: [{ url: '/login?next=' + encodeURIComponent(APP ? '/app' : location.pathname + '#chat'), label: 'Anmelden' }] });
        } else {
          (x.j.neu || []).forEach(function (m) { state.verlauf.push(m); });
          var links = (x.j.links || []).map(function (u) { return { url: u, label: linkLabel(u) }; });
          if (x.j.login_noetig) links.push({ url: '/login?next=' + encodeURIComponent(APP ? '/app' : location.pathname + '#chat'), label: 'Anmelden' });
          state.anzeige.push({ rolle: 'a', text: x.j.antwort || 'Erledigt.', links: links });
        }
        zeichnen(); speichern();
      })
      .catch(function () { state.busy = false; state.verlauf.pop(); state.anzeige.push({ rolle: 'f', text: 'Keine Verbindung – bitte nochmal versuchen.' }); zeichnen(); });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); var t = ta.value; ta.value = ''; senden(t); });
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); } });
  ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; });
  root.querySelector('.spc-clear').addEventListener('click', function () { state.verlauf = []; state.anzeige = []; try { localStorage.removeItem(KEY); } catch (e) { /* egal */ } zeichnen(); });
  window.addEventListener('selfpublishbot:frage', function (e) { if (e.detail) senden(String(e.detail)); });

  laden(); zeichnen();
  fetch('/api/web/chat', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
    state.aktiv = j.aktiv !== false; state.angemeldet = !!j.angemeldet; state.email = j.email || null;
    status.innerHTML = '<b></b>' + (state.angemeldet ? 'Angemeldet' + (state.email ? ' · ' + esc(state.email) : '') : 'Ohne Anmeldung');
    if (state.angemeldet) { var l = root.querySelector('.spc-login'); if (l) { l.textContent = 'Konto'; l.href = '/app#konto'; } }
    if (!state.aktiv) { state.anzeige.push({ rolle: 'f', text: 'Der Chat ist gerade nicht verfügbar.' }); }
    zeichnen();
  }).catch(function () { /* offline */ });
})();
