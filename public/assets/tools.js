/* Selfpublishbot – Logik der SEO-Tool-Seiten */
(function(){
var A=SPBApp,S=SPB,esc=S.esc;
var box=document.getElementById('tool');if(!box)return;
var mode=box.dataset.mode,go=document.getElementById('go'),out=document.getElementById('out'),st=document.getElementById('st'),inp=document.getElementById('in');
function res(lbl,h,p){var d=document.createElement('div');d.className='res';d.innerHTML=(lbl?'<p class="lbl">'+esc(lbl)+'</p>':'')+(h?'<h3 class="serif">'+esc(h)+'</h3>':'')+(p?'<p>'+esc(p)+'</p>':'');A.copyBtn(d,[h,p].filter(Boolean).join('\n'));out.appendChild(d);return d;}
function busy(on,msg){go.disabled=on;st.textContent=msg||'';}

/* ---- Cover: SVG mit Text als PNG ---- */
function download(b,i){var svg=S.svgCover(b,'dl'+i);var img=new Image();img.onload=function(){var c=document.createElement('canvas');c.width=1200;c.height=1800;c.getContext('2d').drawImage(img,0,0,1200,1800);
 var a=document.createElement('a');a.download=(b.title||'cover').replace(/[^\wäöüÄÖÜß-]+/g,'-')+'.png';a.href=c.toDataURL('image/png');a.click();};
 img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}

function run(){
 if(mode==='vorlesen'){var t=inp.value.trim();if(!t){st.textContent='Füge zuerst einen Text ein.';return;}
  if(go.dataset.on){A.stopSpeak();go.dataset.on='';go.textContent='▶ Vorlesen';return;}
  go.dataset.on='1';go.textContent='■ Stopp';
  A.speak(t,function(){go.dataset.on='';go.textContent='▶ Vorlesen';},parseFloat(document.getElementById('rt').value)||.96);
  return;}
 if(mode==='cover'){var ti=document.getElementById('ti').value.trim(),au=document.getElementById('au').value.trim()||'Dein Name',ge=document.getElementById('ge').value;
  if(!ti){st.textContent='Gib zuerst einen Titel ein.';return;}
  busy(true,'Entwerfe Cover …');A.callBot('cover',ti+' – '+ge).then(function(d){busy(false,'');out.innerHTML='';var g=document.createElement('div');g.className='cgrid';out.appendChild(g);
   (d.items||[]).slice(0,6).forEach(function(c,i){var b={title:ti,author:au,motif:S.M[c.motif]?c.motif:'moonsea',pal:S.P[c.palette]||S.P.night,font:/thriller|krimi|science|sachbuch|ratgeber/i.test(ge)?'caps':'serif',pos:i%3===2?'bottom':'top'};
    var cell=document.createElement('div');cell.style.cssText='display:flex;flex-direction:column;gap:8px';cell.innerHTML=S.cover(b,true);
    var dl=document.createElement('button');dl.type='button';dl.className='chip';dl.textContent='Als Bild laden';dl.onclick=function(){download(b,i);};cell.appendChild(dl);g.appendChild(cell);});});
  return;}
 var t=inp.value.trim();if(t.length<8){st.textContent='Erzähl ein bisschen mehr – ein, zwei Sätze reichen.';return;}
 busy(true,'Die KI denkt nach …');
 A.callBot(mode,t).then(function(d){busy(false,'');out.innerHTML='';
  if(mode==='titel')(d.items||[]).forEach(function(x){res('',x.title,x.subtitle);});
  else if(mode==='klappentext')(d.items||[]).forEach(function(x){res(x.label,'',x.text);});
  else if(mode==='gliederung'){if(d.title)res('Arbeitstitel',d.title,'');var all=(d.items||[]).map(function(x,i){return (i+1)+'. '+x.title+'\n'+x.summary;}).join('\n\n');res('Gliederung','',all);}
  else if(mode==='chat'){res(d.genre||'Dein Buch',d.title,(d.threads||[]).map(function(x){return '• '+x;}).join('\n'));res('Kapitel','',(d.chapters||[]).map(function(x,i){return (i+1)+'. '+x;}).join('\n'));
   var p=res('Die erste Seite','',d.firstPage||'');var rd=document.createElement('button');rd.type='button';rd.className='chip';rd.style.marginTop='12px';rd.textContent='▶ Vorlesen';rd.onclick=function(){A.speak(d.firstPage||'');};p.appendChild(rd);}
  var again=document.createElement('button');again.type='button';again.className='btn btn-ghost';again.textContent='Neue Vorschläge';again.onclick=run;out.appendChild(again);
  var cta=document.createElement('a');cta.className='btn btn-primary';cta.href='/#bot';cta.textContent='Daraus ein ganzes Buch machen';out.appendChild(cta);});}
go.onclick=run;
})();
