/* Selfpublishbot – gemeinsame Helfer: KI-Aufruf mit Offline-Fallback, Vorlesen, Kopieren */
(function(w){
var MOT=['moonsea','city','rain','mountains','forest','planet','sunstripes','bloom','castle','dunes','house','lighthouse','road','birds','wave','keyhole','eye','balloon'];
var PAL=['night','noir','crimson','alpine','fog','cosmos','retro','blush','royal','sahara','mint','dusk','northsea','highway','sky','ocean','lilac','sunrise','forestN'];
function hash(s){var h=7;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}
function pick(a,h,o){return a[(h+(o||0))%a.length];}

var G=[
 {k:/mord|leiche|kommissar|krimi|ermitt|verbrech|täter|thriller|entführ/i,g:'Thriller',m:['rain','keyhole','city','eye'],p:['noir','crimson','lilac'],t:['Die Nacht von %','Was % verschweigt','Der letzte Zeuge','Kaltes Wasser','Spur ins Dunkel'],ch:['Der Anruf','Spuren im Regen','Ein Name zu viel','Die zweite Leiche','Wer lügt','Der Keller','Kein Zurück','Das Geständnis']},
 {k:/liebe|verliebt|hochzeit|herz|beziehung|romanze|kuss/i,g:'Liebesroman',m:['bloom','balloon','wave'],p:['blush','sunrise','ocean'],t:['Ein Sommer für %','Alles, was bleibt','Zwei Herzen, ein Ozean','Leicht wie Luft'],ch:['Der erste Blick','Ein falsches Wort','Sommerregen','Was wir nicht sagen','Die Abreise','Briefe','Zurück ans Meer','Ja']},
 {k:/ki |roboter|zukunft|planet|weltall|raumschiff|drache|magie|zauber|elf|maschine/i,g:'Science-Fiction',m:['planet','city','castle'],p:['cosmos','royal','night'],t:['Signal aus %','Die letzte Station','Das Erwachen','Code der Sterne'],ch:['Das Signal','Erster Kontakt','Unter Strom','Die Entscheidung','Abschalten','Was lebt','Der Riss','Neuer Morgen']},
 {k:/firma|gründ|job|karriere|business|geld|erfolg|führung|start-?up|unternehm|lernen|ratgeber|wie ich/i,g:'Sachbuch',m:['chart','sunstripes','road'],p:['retro','gold','highway'],t:['Von null auf %','Der Mut zum Anfang','Allein, aber nicht einsam','Die Rückkehr der Einzelnen'],ch:['Der Moment davor','Der Sprung','Die ersten Fehler','Was wirklich zählt','Das System','Rückschläge','Durchbruch','Was ich heute weiß']},
 {k:/oma|opa|mutter|vater|familie|kindheit|krieg|leben|erinner|tochter|sohn|heimat|aufgewachsen/i,g:'Lebensgeschichte',m:['house','forest','lighthouse','birds'],p:['dusk','forestN','northsea','sky'],t:['Was bleibt, wenn alle gehen','Brief an %','Zugvögel','Das Haus am Ende der Straße'],ch:['Woher wir kommen','Das alte Haus','Die Jahre dazwischen','Was niemand erzählte','Der Abschied','Neue Wege','Heimkehr','Was ich weitergebe']}
];
var DEF={g:'Roman',m:['moonsea','dunes','mountains','road','wave'],p:['night','sahara','alpine','dusk','ocean'],t:['Wo der Wind beginnt','Gegen den Strom','Die Reise nach %','Alles auf Anfang'],ch:['Der letzte normale Tag','Aufbruch','Fremdes Land','Begegnung','Der Sturm','Was zerbricht','Ankommen','Danach']};
function genreOf(t){for(var i=0;i<G.length;i++)if(G[i].k.test(t))return G[i];return DEF;}
function keyword(t){var m=t.match(/\b(?:in|nach|aus|von)\s+([A-ZÄÖÜ][a-zäöüß]{2,})/);if(m)return m[1];var w=(t.match(/[A-ZÄÖÜ][a-zäöüß]{3,}/g)||[]).filter(function(x){return !/^(Ein|Eine|Mein|Meine|Wie|Als|Nach|Der|Die|Das|Und|Mit|Von|Ich)$/.test(x);});return w[0]||'Morgen';}
function fill(s,t){return s.replace('%',keyword(t));}

function fallback(mode,t){var h=hash(t),g=genreOf(t);var title=fill(pick(g.t,h),t);
 if(mode==='book')return{title:title,subtitle:g.g==='Sachbuch'?'Eine wahre Geschichte':'',genre:g.g,motif:pick(g.m,h),palette:pick(g.p,h),
  blurb:'„'+t.replace(/\.$/,'')+'.“ – so fängt es an. Und dann nimmt die Geschichte eine Richtung, mit der niemand gerechnet hat.\n\nEin Buch über Mut, Zweifel und den einen Moment, in dem sich alles entscheidet.',
  chapters:g.ch,firstPage:'Es war einer dieser Tage, an denen man später sagt, man hätte es kommen sehen. Aber an diesem Morgen sah ich nichts kommen.\n\nIch weiß noch, wie das Licht durch das Küchenfenster fiel. Wie der Kaffee zu stark war. Wie ich dachte: Heute wird ein ganz normaler Tag.\n\nEs wurde der Tag, an dem meine Geschichte begann.'};
 if(mode==='titel'){var out=[];var all=G.concat([DEF]);for(var i=0;i<10;i++){var gg=i<4?g:all[(h+i)%all.length];out.push({title:fill(pick(gg.t,h,i),t),subtitle:gg.g});}
  var seen={};return{items:out.filter(function(x){if(seen[x.title])return false;return seen[x.title]=1;})};}
 if(mode==='klappentext')return{items:[{label:'Spannend',text:'Nichts ist, wie es scheint. '+t+' – und plötzlich steht alles auf dem Spiel. Ein Buch, das man nicht weglegen kann, bis die letzte Frage beantwortet ist.'},{label:'Emotional',text:'Manche Geschichten muss man erzählen, bevor sie verloren gehen. '+t+'. Ehrlich, verletzlich und voller Hoffnung.'},{label:'Verkaufsstark',text:t+'. Für alle, die wissen wollen, wie es wirklich ist – direkt, persönlich und mit einem Ende, über das man noch lange spricht.'}]};
 if(mode==='gliederung')return{title:title,items:g.ch.map(function(c,i){return{title:c,summary:i===0?'Der Einstieg: Wir lernen die Hauptfigur in ihrem Alltag kennen – kurz bevor sich alles ändert.':'Die Geschichte entwickelt sich weiter; ein neuer Konflikt verändert die Richtung.'};})};
 if(mode==='chat')return{title:title,genre:g.g,threads:['Ein Neuanfang, der mehr kostet als gedacht.','Menschen, die bleiben – und solche, die gehen.','Die Frage, was am Ende wirklich zählt.'],chapters:g.ch,firstPage:fallback('book',t).firstPage};
 if(mode==='cover'){var it=[];for(var j=0;j<6;j++)it.push({motif:pick(MOT,h,j*5),palette:pick(PAL,h,j*7)});return{items:it};}
 return{};}

function callBot(mode,text){
 return fetch('/api/bot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:mode,text:text})})
  .then(function(r){return r.json().then(function(j){if(!r.ok||!j.ok)throw new Error(j.error||'fehler');return j.data;});})
  .catch(function(){return fallback(mode,text);});}

var voice=null;
function pickVoice(){if(!w.speechSynthesis)return null;var v=speechSynthesis.getVoices().filter(function(x){return /^de/i.test(x.lang);});
 var best=v.filter(function(x){return /natural|neural|premium|enhanced|google/i.test(x.name);})[0];return best||v[0]||null;}
if(w.speechSynthesis){speechSynthesis.onvoiceschanged=function(){voice=pickVoice();};voice=pickVoice();}
function browserSpeak(text,onend,rate){if(!w.speechSynthesis){if(onend)setTimeout(onend,Math.min(9000,1500+text.length*45));return;}speechSynthesis.cancel();
 if(!voice)voice=pickVoice();var u=new SpeechSynthesisUtterance(text);u.lang='de-DE';if(voice)u.voice=voice;u.rate=rate||.96;u.onend=u.onerror=onend||null;speechSynthesis.speak(u);}
/* Stimme des Zauberbuchs: ElevenLabs über /api/speak, sonst Browser-Stimme. level() liefert die Lautstärke für den Mund. */
var player=null,actx=null,anl=null,abuf=null,elOff=false,speakId=0;
function tap(){if(anl||!(w.AudioContext||w.webkitAudioContext))return;try{actx=new(w.AudioContext||w.webkitAudioContext)();var src=actx.createMediaElementSource(player);anl=actx.createAnalyser();anl.fftSize=256;src.connect(anl);anl.connect(actx.destination);abuf=new Uint8Array(anl.fftSize);}catch(e){anl=null;}}
function level(){if(!anl||!player||player.paused)return 0;if(actx.state==='suspended')actx.resume();anl.getByteTimeDomainData(abuf);var q=0;for(var i=0;i<abuf.length;i++){var v=(abuf[i]-128)/128;q+=v*v;}return Math.min(1,Math.sqrt(q/abuf.length)*4);}
function speak(text,onend,rate){stopSpeak();var id=++speakId;
 if(rate||elOff){browserSpeak(text,onend,rate);return;}
 if(!player){player=new Audio();player.playsInline=true;}
 fetch('/api/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text})})
  .then(function(r){if(r.status===503)elOff=true;if(!r.ok)throw 0;return r.json();})
  .then(function(d){if(id!==speakId)return;if(!d.audio)throw 0;tap();player.onended=function(){if(onend)onend();};player.src='data:audio/mpeg;base64,'+d.audio;return player.play();})
  .catch(function(){if(id===speakId)browserSpeak(text,onend,rate);});}
function stopSpeak(){speakId++;if(player)try{player.pause();}catch(e){}if(w.speechSynthesis)speechSynthesis.cancel();}

function copyBtn(el,text){var b=document.createElement('button');b.type='button';b.className='copy';b.textContent='Kopieren';
 b.onclick=function(){(navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).then(function(){b.textContent='Kopiert';setTimeout(function(){b.textContent='Kopieren';},1500);}).catch(function(){});};el.appendChild(b);}

w.SPBApp={callBot:callBot,speak:speak,stopSpeak:stopSpeak,level:level,copyBtn:copyBtn,fallback:fallback};
})(window);
