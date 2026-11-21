/* Selfpublishbot · Magie der Bibliothek: Sternenhimmel, Kerzen, Funken, Siegel, Sterne-Bewertungen */
(function(w,d){
var reduce=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Himmel & Kerzen ---------- */
function decor(){
 var sky=d.createElement('div');sky.className='sky';d.body.insertBefore(sky,d.body.firstChild);
 var c=d.createElement('div');c.className='candles';c.setAttribute('aria-hidden','true');
 var spots=[[3,140],[9,320],[14,90],[47,560],[93,150],[96,330],[87,90]];
 spots.forEach(function(s,i){var e=d.createElement('div');e.className='candle';e.style.left=s[0]+'%';e.style.top=s[1]+'px';
  e.style.animationDelay=(-i*1.3)+'s';e.style.opacity=String(.55+((i*37)%40)/100);e.style.transform='scale('+(.7+((i*13)%30)/100)+')';c.appendChild(e);});
 d.body.insertBefore(c,sky.nextSibling);
 if(reduce)return;
 var cv=d.createElement('canvas');cv.id='motes';d.body.insertBefore(cv,c.nextSibling);
 var ctx=cv.getContext('2d'),W,H,P=[];
 function size(){W=cv.width=w.innerWidth;H=cv.height=w.innerHeight;}
 size();w.addEventListener('resize',size);
 var n=Math.min(70,Math.round(w.innerWidth/18));
 for(var i=0;i<n;i++)P.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.4,vy:-(Math.random()*.25+.05),vx:(Math.random()-.5)*.15,a:Math.random()*Math.PI*2});
 (function tick(){ctx.clearRect(0,0,W,H);
  for(var i=0;i<P.length;i++){var p=P[i];p.x+=p.vx+Math.sin(p.a)*.12;p.y+=p.vy;p.a+=.01;
   if(p.y<-10){p.y=H+10;p.x=Math.random()*W;}
   var al=.35+.35*Math.sin(p.a*3);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fillStyle='rgba(246,221,160,'+al+')';
   ctx.shadowColor='rgba(246,200,110,.9)';ctx.shadowBlur=8;ctx.fill();}
  w.requestAnimationFrame(tick);})();
}

/* ---------- Funkenregen (z. B. wenn ein Buch entsteht) ---------- */
function sparkle(el,count){if(reduce||!el)return;var r=el.getBoundingClientRect();count=count||26;
 for(var i=0;i<count;i++){var s=d.createElement('span');s.textContent=['✦','✧','·','✶'][i%4];
  s.style.cssText='position:fixed;z-index:50;pointer-events:none;color:#F6DDA0;text-shadow:0 0 10px #E8C377;font-size:'+(8+Math.random()*14)+'px;left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height/2)+'px;transition:transform 1.4s cubic-bezier(.2,.7,.2,1),opacity 1.4s';
  d.body.appendChild(s);(function(s){var a=Math.random()*6.283,dist=60+Math.random()*160;
   requestAnimationFrame(function(){s.style.transform='translate('+Math.cos(a)*dist+'px,'+(Math.sin(a)*dist-40)+'px) rotate('+(Math.random()*180)+'deg)';s.style.opacity='0';});
   setTimeout(function(){s.remove();},1500);})(s);}}

/* ---------- Alters-Siegel ---------- */
var AGES=[0,6,12,16,18];
function seal(age,big){age=AGES.indexOf(+age)>=0?+age:0;
 return '<span class="seal s'+age+(big?' big':'')+'" title="Altersempfehlung: ab '+age+' Jahren" aria-label="Altersempfehlung ab '+age+' Jahren"><span><small>AB</small>'+age+'</span></span>';}

/* ---------- Sterne ---------- */
function stars(v){var h='';for(var i=1;i<=5;i++){h+='<i class="'+(v>=i-.25?'on':(v>=i-.75?'half':''))+'">★</i>';}return '<span class="stars" aria-hidden="true">'+h+'</span>';}
function fmt(n){return (Math.round(n*10)/10).toFixed(1).replace('.',',');}

/* ---------- Supabase (nur öffentlicher Schlüssel; Schreiben nur über spb_rate) ---------- */
var SB='https://rfldzzgeikcntmhvwjwk.supabase.co/rest/v1/',KEY='sb_publishable_yztsoo_gSmwHJffGR_Jjsg_EJxGSx-3';
function api(path,opt){opt=opt||{};opt.headers=Object.assign({apikey:KEY,'Content-Type':'application/json'},opt.headers||{});
 return fetch(SB+path,opt).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&j.message)||'Fehler');return j;});});}
function voter(){var k='spb_voter',v=null;try{v=localStorage.getItem(k);}catch(e){}
 if(!v){v=(w.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g,function(){return(Math.random()*16|0).toString(16);});try{localStorage.setItem(k,v);}catch(e){}}
 return v;}
function myVote(id){try{return JSON.parse(localStorage.getItem('spb_vote_'+id)||'null');}catch(e){return null;}}
function saveMyVote(id,o){try{localStorage.setItem('spb_vote_'+id,JSON.stringify(o));}catch(e){}}
var statsCache=null;
function getStats(force){if(statsCache&&!force)return statsCache;statsCache=api('spb_book_stats?select=*&order=score.desc').catch(function(){return [];});return statsCache;}
function getReviews(id){return api('spb_reviews?book_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc&limit=30').catch(function(){return [];});}
function rate(id,starsN,review,name){return api('rpc/spb_rate',{method:'POST',body:JSON.stringify({p_book:id,p_voter:voter(),p_stars:starsN,p_review:review||null,p_name:name||null})})
 .then(function(r){statsCache=null;saveMyVote(id,{s:starsN,r:review||'',n:name||''});return r;});}

/* ---------- Bewertungs-Bereich für ein Buch ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function ratingPane(pane,id,title,onChange){
 var mine=myVote(id)||{s:0,r:'',n:''},cur=mine.s;
 pane.innerHTML='<div class="rform"><p style="margin:0 0 6px;font-family:var(--disp);font-size:20px;color:var(--parch)">'+(mine.s?'Deine Bewertung ändern':'Wie hat dir „'+esc(title)+'“ gefallen?')+'</p>'+
  '<div class="rate-in" role="radiogroup" aria-label="Sterne vergeben"></div>'+
  '<label class="sr" for="rvT" style="position:absolute;left:-9999px">Deine Rezension</label><textarea id="rvT" maxlength="600" placeholder="Deine Rezension (freiwillig, max. 600 Zeichen) – sie erscheint öffentlich unter dem Buch.">'+esc(mine.r)+'</textarea>'+
  '<label class="sr" for="rvN" style="position:absolute;left:-9999px">Dein Name</label><input id="rvN" maxlength="40" placeholder="Name oder Kürzel (freiwillig)" value="'+esc(mine.n)+'">'+
  '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><button class="btn btn-primary" type="button" id="rvGo">Bewertung absenden</button><span id="rvSt" class="note" role="status" aria-live="polite"></span></div>'+
  '<p class="note" style="margin-top:10px">Eine Stimme je Gerät und Buch. Beleidigungen und Werbung werden entfernt – siehe <a href="/bibliotheksordnung.html">Bibliotheksordnung</a>.</p></div><div class="rlist" id="rvL"><p class="note" style="text-align:center">Lade Rezensionen …</p></div>';
 var box=pane.querySelector('.rate-in');
 function paint(){Array.prototype.forEach.call(box.children,function(b,i){b.classList.toggle('on',i<cur);b.setAttribute('aria-checked',String(i+1===cur));});}
 for(var i=1;i<=5;i++){(function(i){var b=d.createElement('button');b.type='button';b.textContent='★';b.setAttribute('role','radio');b.setAttribute('aria-label',i+' von 5 Sternen');
  b.onclick=function(){cur=i;paint();};box.appendChild(b);})(i);}paint();
 function list(){getReviews(id).then(function(rs){var L=pane.querySelector('#rvL');if(!L)return;
  L.innerHTML=rs.length?rs.map(function(r){return '<div class="rv"><div class="rmeta">'+stars(r.stars)+'<span class="who">'+esc(r.reviewer_name)+' · '+new Date(r.created_at).toLocaleDateString('de-DE')+'</span></div><p>'+esc(r.review)+'</p></div>';}).join('')
   :'<p class="note" style="text-align:center">Noch keine Rezension. Schreib die erste!</p>';});}
 list();
 pane.querySelector('#rvGo').onclick=function(){var st=pane.querySelector('#rvSt'),btn=this;if(!cur){st.textContent='Bitte zuerst Sterne wählen.';return;}
  btn.disabled=true;st.textContent='Die Feder trägt es ins Buch der Leser …';
  rate(id,cur,pane.querySelector('#rvT').value.trim(),pane.querySelector('#rvN').value.trim()).then(function(s){st.textContent='Danke! Deine Stimme steht jetzt im Buch der Leser.';btn.disabled=false;sparkle(btn,18);list();if(onChange)onChange(s);})
  .catch(function(e){st.textContent='Das hat nicht geklappt: '+e.message;btn.disabled=false;});};
}

w.SPBMagic={sparkle:sparkle,seal:seal,stars:stars,fmt:fmt,getStats:getStats,ratingPane:ratingPane,esc:esc};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',decor);else decor();
})(window,document);
