(function(){
var M=SPB.M,P=SPB.P,cover=SPB.cover,esc=SPB.esc,hpIcon=SPB.hpIcon,A=SPBApp;
var mine=[
 {id:'rueckkehr',title:'Die Rückkehr',sub:'Ein Jahr allein mit den Maschinen',author:'Dr. Marcel Hofeditz',genre:'Sachbuch · Hörbuch',cat:'sachbuch',motif:'pier',pal:P.rueckkehr,font:'serif',pos:'top',audio:true,
  blurb:['Ein Immobilienmakler aus Hamburg baut 2026 mit KI eine ganze Firma – allein. Eine Plattform, auf der Immobilien in ganz Europa gehandelt werden, eine eigene Steuersoftware, eine Belegschaft, die nicht schläft. Kein Ratgeber, sondern ein ehrliches Logbuch aus dem Jahr, in dem die KI an unseren Küchentischen angekommen ist.','Über Stolz und Angst in derselben Sekunde, über Nächte mit vier Stunden Schlaf – und über die Frage, die sich gerade alle stellen: Und ich?'],
  summary:['Die Firma, wie wir sie kennen, ist eine Ausnahme der letzten 200 Jahre. KI macht Koordination fast kostenlos – die Arbeit kehrt zum Einzelnen zurück.','Erzählt in fünf Akten: Der Bruch, die neue Firma, der Preis, die Gesellschaft, die Zukunft.','Mit Nachtnotizen, Stimmen aus dem Jahr (Übersetzerin, Sachbearbeiter, Lehrerin …) und einem Brief an den Leser von 2036.','Theorie mit Herz: Coase trifft Kahneman – warum die Ökonomie zur Ein-Mann-Firma zieht und die Psychologie dagegenhält.'],
  lese:'lp-rueckkehr',hoer:{src:'die-rueckkehr-prolog.mp3',title:'Prolog – Eine Nacht in der leeren Firma',len:'ca. 4 Min.'}},
 {id:'ganze',title:'Das Ganze',sub:'Roman',author:'Marcel Hofeditz',genre:'Roman · Hörbuch',cat:'roman',motif:'pier',whale:true,pal:P.ganze,font:'serif',pos:'top',audio:true,
  blurb:['Ein Moby Dick der Gegenwart. Erzählt von einem Fremden, der gerade seinen Job verloren hat – und der einem Mann namens Marcel begegnet, der nachts am Ende eines Stegs sitzt und mit Maschinen eine ganze Welt baut.','Dieselbe Geschichte wie „Die Rückkehr“ – nur als Fiktion. Größer, dunkler, freier. Über Besessenheit, Einsamkeit und die Jagd nach dem einen großen Ganzen.'],
  summary:['Der Erzähler: ein entlassener Angestellter, Ismael unserer Zeit.','Die Hauptfigur: Marcel, ein Getriebener zwischen Genie und Rausch.','Fast jeder Mensch aus seinem Leben taucht auf – verfremdet, aber erkennbar.','Das Gegenstück zum Sachbuch „Die Rückkehr“: Was dort erzählt wird, wird hier erfunden.'],
  lese:null,hoer:null}
];

/* ---------- Dialog ---------- */
var dlg=document.getElementById('dlg'),audio=null;
document.getElementById('dClose').onclick=function(){dlg.close();};
dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();});
dlg.addEventListener('close',function(){if(audio){audio.pause();}});
function openBook(b){
 document.getElementById('dCover').innerHTML=cover(b,true);
 document.getElementById('dKind').textContent=b.genre+(b.audio&&!b.blurb?' · mit Hörbuch':'');
 document.getElementById('dTitle').textContent=b.title;
 document.getElementById('dSub').textContent=b.sub&&b.sub!=='Roman'?b.sub:'';
 document.getElementById('dBy').textContent='von '+b.author;
 var bl=document.getElementById('dBlurb');
 var tabs=document.getElementById('dTabs'),pane=document.getElementById('dPane');tabs.innerHTML='';pane.innerHTML='';
 if(!b.blurb){bl.innerHTML='<p class="blurb">Ein Beispiel aus dem Regal. So wird es aussehen, wenn hier echte Bücher stehen: Leseprobe, Hörprobe und das ganze Buch – geschrieben mit KI, aus dem Leben echter Menschen.</p><a class="btn btn-primary" href="#start">Eigenes Buch schreiben</a>';tabs.style.display='none';pane.style.display='none';}
 else{tabs.style.display='';pane.style.display='';bl.innerHTML=b.blurb.map(function(p){return '<p class="blurb">'+esc(p)+'</p>';}).join('');
  var T=[['lese','Leseprobe'],['hoer','Hörprobe'],['sum','Worum es geht']];
  T.forEach(function(t,i){var btn=document.createElement('button');btn.type='button';btn.className='tab';btn.setAttribute('role','tab');btn.textContent=t[1];btn.onclick=function(){sel(t[0]);};btn.dataset.k=t[0];tabs.appendChild(btn);});
  function lock(){return '<div class="lock"><p><b>Das ganze Buch und Hörbuch</b> erscheinen mit dem Alpha-Start des Selfpublishbot.<br>Freunde und Familie bekommen es schon vorher – auf Anfrage.</p><a class="btn btn-primary" href="mailto:marcel@offmarketpool.com?subject='+encodeURIComponent('Vollversion: '+b.title)+'&body='+encodeURIComponent('Hallo Marcel, ich würde gern „'+b.title+'“ ganz lesen bzw. hören.')+'">Vollversion anfragen</a></div>';}
  function sel(k){Array.prototype.forEach.call(tabs.children,function(x){x.setAttribute('aria-selected',String(x.dataset.k===k));});if(audio){audio.pause();}
   if(k==='lese'){pane.innerHTML=b.lese?document.getElementById(b.lese).innerHTML+lock():'<div class="lock"><p>Die Leseprobe zu „'+esc(b.title)+'“ kommt in den nächsten Tagen.</p></div>'+lock();}
   else if(k==='hoer'){if(!b.hoer){pane.innerHTML='<div class="lock"><p>Die Hörprobe zu „'+esc(b.title)+'“ wird gerade eingesprochen.</p></div>'+lock();return;}
    pane.innerHTML='<div class="player"><div class="row2"><button class="play" type="button" id="pBtn" aria-label="Abspielen"></button><div class="ptxt"><b>'+esc(b.hoer.title)+'</b><span>Gelesen von einer KI-Stimme · '+esc(b.hoer.len)+'</span><div class="prog" id="pProg"><i id="pBar"></i></div></div></div></div>'+lock();
    audio=new Audio(b.hoer.src);audio.preload='metadata';var pb=document.getElementById('pBtn'),bar=document.getElementById('pBar'),prog=document.getElementById('pProg');
    var playI='<svg width="22" height="22" viewBox="0 0 24 24" fill="#15171C" aria-hidden="true"><path d="M7 4l14 8-14 8z"/></svg>',pauseI='<svg width="22" height="22" viewBox="0 0 24 24" fill="#15171C" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
    pb.innerHTML=playI;pb.onclick=function(){if(audio.paused){audio.play();}else{audio.pause();}};
    audio.onplay=function(){pb.innerHTML=pauseI;pb.setAttribute('aria-label','Pause');};audio.onpause=function(){pb.innerHTML=playI;pb.setAttribute('aria-label','Abspielen');};
    audio.ontimeupdate=function(){if(audio.duration)bar.style.width=(audio.currentTime/audio.duration*100)+'%';};
    prog.onclick=function(e){if(audio.duration){var r=prog.getBoundingClientRect();audio.currentTime=(e.clientX-r.left)/r.width*audio.duration;}};}
   else{pane.innerHTML='<div class="reading" style="font-family:inherit;font-size:16px"><ul class="summary">'+b.summary.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ul></div>'+lock();}}
  sel(b.lese?'lese':'sum');}
 if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');dlg.querySelector('.dlg').scrollTop=0;}

window.openBook=openBook;

/* ---------- Echte Bücher (direkt hörbar) ---------- */
var playI='<svg width="18" height="18" viewBox="0 0 24 24" fill="#15171C" aria-hidden="true"><path d="M7 4l14 8-14 8z"/></svg>',pauseI='<svg width="18" height="18" viewBox="0 0 24 24" fill="#15171C" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
var cardAudio=null,cardBtn=null;
var rb=document.getElementById('realBooks');
mine.forEach(function(b){var el=document.createElement('div');el.className='rcard';
 el.innerHTML='<div class="cv" role="button" tabindex="0" aria-label="'+esc(b.title)+' öffnen">'+cover(b,true)+'</div><div class="bd"><span class="tag" style="align-self:flex-start;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#15171C;background:var(--accent);border-radius:999px;padding:3px 9px;font-weight:700">'+esc(b.genre)+'</span><h3 class="serif">'+esc(b.title)+'</h3><p class="sub">'+esc(b.sub==='Roman'?'Roman von '+b.author:b.sub+' · '+b.author)+'</p>'+
 (b.hoer?'<div class="mini-play"><button type="button" aria-label="Hörprobe abspielen">'+playI+'</button><div class="t"><b>'+esc(b.hoer.title)+'</b>Hörprobe · '+esc(b.hoer.len)+'<div class="prog"><i></i></div></div></div>':'<div class="soon">Hörbuch wird gerade eingesprochen</div>')+
 '<div class="acts"><button class="btn btn-ghost" type="button" data-o>'+(b.lese?'Leseprobe lesen':'Worum es geht')+'</button></div></div>';
 var open=function(){if(cardAudio)cardAudio.pause();openBook(b);};
 el.querySelector('.cv').onclick=open;el.querySelector('.cv').onkeydown=function(e){if(e.key==='Enter')open();};el.querySelector('[data-o]').onclick=open;
 if(b.hoer){var btn=el.querySelector('.mini-play button'),bar=el.querySelector('.mini-play .prog i'),prog=el.querySelector('.mini-play .prog');
  btn.onclick=function(){if(cardBtn!==btn){if(cardAudio)cardAudio.pause();cardAudio=new Audio(b.hoer.src);cardBtn=btn;
    cardAudio.onplay=function(){btn.innerHTML=pauseI;};cardAudio.onpause=function(){btn.innerHTML=playI;};
    cardAudio.ontimeupdate=function(){if(cardAudio.duration)bar.style.width=(cardAudio.currentTime/cardAudio.duration*100)+'%';};}
   A.stopSpeak();if(cardAudio.paused)cardAudio.play();else cardAudio.pause();};
  prog.onclick=function(e){if(cardBtn===btn&&cardAudio.duration){var r=prog.getBoundingClientRect();cardAudio.currentTime=(e.clientX-r.left)/r.width*cardAudio.duration;}};}
 rb.appendChild(el);});

/* ---------- Autoren ---------- */
var au=document.getElementById('authors');
var a1=document.createElement('div');a1.className='au';
a1.innerHTML='<div class="av">MH</div><div><h3>Dr. Marcel Hofeditz</h3><p class="r">Hamburg · 2 Bücher · Hörbuch</p><p>Immobilienunternehmer und Gründer von Offmarketpool. Hat 2026 mit KI eine ganze Firma allein gebaut – und darüber ein Sachbuch und einen Roman geschrieben.</p><div class="bk" id="auBooks"></div></div>';
au.appendChild(a1);
mine.forEach(function(b){var s=document.createElement('button');s.type='button';s.style.cssText='background:none;border:0;padding:0;cursor:pointer';s.setAttribute('aria-label',b.title+' öffnen');s.innerHTML=cover(b,true);s.onclick=function(){openBook(b);};a1.querySelector('#auBooks').appendChild(s);});
var a2=document.createElement('div');a2.className='au you2';
a2.innerHTML='<div class="av">+</div><div><h3>Dein Name hier</h3><p class="r">Werde Autor:in</p><p>Jeder Mensch hat ein Buch in sich. Erzähl es dem Bot in einem Satz – und steh bald selbst in diesem Regal.</p><div class="row" style="justify-content:flex-start;margin-top:14px"><a class="btn btn-primary" href="#bot">Jetzt starten</a></div></div>';
au.appendChild(a2);

/* ---------- Steps ---------- */
var steps=[
['Connector verbinden','Füge den Selfpublishbot in Claude oder ChatGPT hinzu. Ein Klick, dann kennt deine KI den Weg zum Regal.','Verbinde dich mit dem Selfpublishbot.','Verbunden. Sollen wir dein Buch beginnen?'],
['Deine Geschichte zusammenfassen lassen','Die KI fasst zusammen, was du bisher mit ihr erlebt und besprochen hast. Daraus entsteht der rote Faden.','Fasse zusammen, was du über mein Leben weißt.','Ich sehe drei große Linien: dein Neustart, die Gründung und die Familie. Womit fangen wir an?'],
['Roman oder Sachbuch wählen','Erzählt als Roman, ehrlich als Lebensgeschichte oder als Sachbuch mit deinen Lehren. Der Bot schlägt Aufbau und Kapitel vor.','Mach einen Roman daraus.','Hier ist ein Entwurf mit 12 Kapiteln. Kapitel 1 beginnt an dem Abend, an dem alles kippt.'],
['Überarbeiten und Cover gestalten','Kapitel für Kapitel fragt der Bot nach, kürzt und schärft. Die KI entwirft dein Cover, du wählst aus.','Kapitel 3 ist zu lang. Und zeig mir Cover-Ideen.','Gekürzt. Hier sind vier Cover-Entwürfe.'],
['Veröffentlichen','Ein Satz, und dein Buch steht im Regal – zum Lesen und als Hörbuch. Privat, für Freunde oder für alle.','Veröffentliche es öffentlich.','Fertig. Dein Buch steht jetzt im Regal.']];
var sEl=document.getElementById('steps');
steps.forEach(function(s,i){var d=document.createElement('div');d.className='step';d.innerHTML='<div class="l"><span class="num">'+(i+1)+'</span><div><h3>'+esc(s[0])+'</h3><p>'+esc(s[1])+'</p></div></div><div class="chat"><div class="you">'+esc(s[2])+'</div><div class="ai">'+esc(s[3])+'</div></div>';sEl.appendChild(d);});

/* ---------- Der Buch-Bot ---------- */
var ideas=['Ein Mann verliert mit 50 seinen Job und segelt allein nach Portugal.','Meine Oma hat den Krieg überlebt und nie darüber geredet.','Eine KI verliebt sich in die Frau, die sie abschalten soll.','Wie ich ohne Team mit KI eine Firma gebaut habe.','Eine Kommissarin in Kiel jagt den Mörder ihres Vaters.'];
var ask=document.getElementById('ask'),form=document.getElementById('askForm'),btn=document.getElementById('askBtn'),st=document.getElementById('botStatus');
var b3d=document.getElementById('b3d'),front=document.getElementById('bFront'),back=document.getElementById('bBack'),spine=document.getElementById('bSpine');
var scene=document.getElementById('scene'),spread=document.getElementById('spread'),ctrl=document.getElementById('ctrl'),writeOn=document.getElementById('writeOn');
var ideasEl=document.getElementById('ideas');
ideas.forEach(function(t){var b=document.createElement('button');b.type='button';b.className='idea';b.textContent=t;b.onclick=function(){ask.value=t;run();};ideasEl.appendChild(b);});
var blank={title:'Dein Buch',author:'Dein Name',motif:'pier',pal:P.rueckkehr,font:'serif',pos:'top'};
front.innerHTML=cover(blank,true);
var cur=null,timers=[],busy=false;
function clearT(){timers.forEach(clearTimeout);timers=[];}
function later(f,ms){timers.push(setTimeout(f,ms));}
function B3(x){if(window.Book3D)Book3D.state(x);}
function view(v){B3(v==='back'?'back':v==='open'?'front':'front');scene.style.display=v==='open'?'none':'';spread.classList.toggle('on',v==='open');
 b3d.classList.remove('idle','think','back','front');if(v==='back')b3d.classList.add('back');else if(v==='front')b3d.classList.add('front');
 Array.prototype.forEach.call(ctrl.querySelectorAll('[data-v]'),function(c){c.setAttribute('aria-pressed',String(c.dataset.v===v));});}
Array.prototype.forEach.call(ctrl.querySelectorAll('[data-v]'),function(c){c.onclick=function(){clearT();view(c.dataset.v);if(c.dataset.v==='open')typeOut(true);};});
function paras(t){return String(t||'').split(/\n\s*\n/).filter(Boolean);}
var typed=false;
function typeOut(instant){var el=document.getElementById('page1');var ps=paras(cur.firstPage);
 if(instant||typed){el.innerHTML=ps.map(function(p){return '<p>'+esc(p)+'</p>';}).join('');return;}
 typed=true;el.innerHTML='';var full=ps.join('\n\n'),i=0;
 (function step(){if(!cur)return;i=Math.min(full.length,i+3);var shown=full.slice(0,i).split('\n\n');
  el.innerHTML=shown.map(function(p,k){return '<p>'+esc(p)+(k===shown.length-1&&i<full.length?'<span class="caret"></span>':'')+'</p>';}).join('');
  if(i<full.length)timers.push(setTimeout(step,18));})();}
var stages=['Lese deinen Satz …','Finde den Titel …','Male das Cover …','Schreibe den Klappentext …','Schreibe die erste Seite …'];
function run(){var t=ask.value.trim();if(busy)return;if(t.length<8){st.textContent='Erzähl mir ein bisschen mehr – ein ganzer Satz reicht.';ask.focus();return;}
 busy=true;btn.disabled=true;clearT();A.stopSpeak();typed=false;view('front');b3d.classList.add('think');B3('think');scene.style.display='';spread.classList.remove('on');
 ctrl.hidden=true;writeOn.hidden=true;if(window.innerWidth<860)document.querySelector('.stage').scrollIntoView({behavior:'smooth',block:'center'});var si=0;st.textContent=stages[0];var iv=setInterval(function(){si=Math.min(stages.length-1,si+1);st.textContent=stages[si];},1300);
 A.callBot('book',t).then(function(d){clearInterval(iv);busy=false;btn.disabled=false;
  cur={title:d.title||'Ohne Titel',subtitle:d.subtitle||'',genre:d.genre||'Roman',author:'Dein Name',motif:SPB.M[d.motif]?d.motif:'moonsea',pal:P[d.palette]||P.night,font:/thriller|krimi|sci|sachbuch|ratgeber/i.test(d.genre||'')?'caps':'serif',pos:'top',blurb:d.blurb||'',chapters:(d.chapters||[]).slice(0,10),firstPage:d.firstPage||''};
  front.innerHTML=cover(cur,true);spine.textContent=cur.title;
  if(window.Book3D){SPB.coverCanvas(cur,1024,1376,function(c){Book3D.setCover(c);});Book3D.setBack(backCanvas(cur));}
  back.innerHTML='<h4>'+esc(cur.title)+'</h4>'+paras(cur.blurb).map(function(p){return '<p>'+esc(p)+'</p>';}).join('')+'<div class="bc"><span>'+esc(cur.genre)+' · Selfpublishbot</span><i></i></div>';
  document.getElementById('toc').innerHTML=cur.chapters.map(function(c){return '<li>'+esc(c)+'</li>';}).join('');
  st.textContent='„'+cur.title+'“ – '+cur.genre+(cur.subtitle?' · '+cur.subtitle:'');
  view('front');ctrl.hidden=false;writeOn.hidden=false;
  if(window.innerWidth<860)document.querySelector('.stage').scrollIntoView({behavior:'smooth',block:'center'});
  later(function(){view('back');},2600);
  later(function(){view('open');typeOut(false);},7600);});}
form.onsubmit=function(e){e.preventDefault();run();};
ask.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run();}});
function backCanvas(b){var W=1024,H=1376,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');
 x.fillStyle='#F4EFE4';x.fillRect(0,0,W,H);x.fillStyle='#2A2622';x.textBaseline='top';
 x.font='600 68px Georgia,serif';var y=110;wrapT(x,b.title.toUpperCase(),110,W-220).forEach(function(l){x.fillText(l,110,y);y+=80;});y+=34;
 x.font='44px Georgia,serif';paras(b.blurb).forEach(function(p){wrapT(x,p,110,W-220).forEach(function(l){if(y<H-280)x.fillText(l,110,y);y+=62;});y+=30;});
 x.font='32px Helvetica,Arial,sans-serif';x.fillStyle='#6B645B';x.fillText(b.genre+' · Selfpublishbot',110,H-150);
 x.fillStyle='#2A2622';for(var i=0,bx=W-330;i<46;i++){var bw=(i*7%5===0)?6:3;x.fillRect(bx,H-200,bw,110);bx+=bw+((i*3)%4)+2;}return c;}
function wrapT(x,t,_,max){var w=String(t).split(/\s+/),l=[],cur2='';w.forEach(function(s){var tt=cur2?cur2+' '+s:s;if(x.measureText(tt).width>max&&cur2){l.push(cur2);cur2=s;}else cur2=tt;});if(cur2)l.push(cur2);return l;}
var reading=false,rb2=document.getElementById('readBtn');
rb2.onclick=function(){if(!cur)return;if(reading){A.stopSpeak();if(window.Book3D)Book3D.talking(false);reading=false;rb2.textContent='▶ Vorlesen';return;}
 if(cardAudio)cardAudio.pause();clearT();view('open');typeOut(true);reading=true;rb2.textContent='■ Stopp';if(window.Book3D)Book3D.talking(true);
 A.speak(cur.title+'. '+(cur.subtitle?cur.subtitle+'. ':'')+'Kapitel eins. '+paras(cur.firstPage).join(' '),function(){reading=false;rb2.textContent='▶ Vorlesen';if(window.Book3D)Book3D.talking(false);});};
})();
