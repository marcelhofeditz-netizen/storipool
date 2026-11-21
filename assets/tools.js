/* Selfpublishbot – Logik der SEO-Tool-Seiten */
(function(){
var A=SPBApp,S=SPB,esc=S.esc;
var box=document.getElementById('tool');if(!box)return;
var mode=box.dataset.mode,go=document.getElementById('go'),out=document.getElementById('out'),st=document.getElementById('st'),inp=document.getElementById('in');
function res(lbl,h,p){var d=document.createElement('div');d.className='res';d.innerHTML=(lbl?'<p class="lbl">'+esc(lbl)+'</p>':'')+(h?'<h3 class="serif">'+esc(h)+'</h3>':'')+(p?'<p>'+esc(p)+'</p>':'');A.copyBtn(d,[h,p].filter(Boolean).join('\n'));out.appendChild(d);return d;}
function busy(on,msg){go.disabled=on;st.textContent=msg||'';}

/* ---- Cover: SVG mit Text als PNG ---- */
function wrap(t,max){var w=t.split(/\s+/),l=[],c='';w.forEach(function(x){if((c+' '+x).trim().length>max&&c){l.push(c);c=x;}else c=(c+' '+x).trim();});if(c)l.push(c);return l;}
function svgCover(b,id){var lines=wrap(b.title,12),fs=lines.length>2?22:26,top=b.pos!=='bottom';
 var y0=top?34:300-60-lines.length*fs*1.1;var serif=b.font==='serif';
 var txt=lines.map(function(l,i){return '<text x="18" y="'+(y0+i*fs*1.1)+'" font-size="'+fs+'" font-weight="'+(serif?600:800)+'" font-family="'+(serif?'Georgia,serif':'Helvetica,Arial,sans-serif')+'" fill="'+b.pal.ink+'"'+(serif?'':' letter-spacing="1"')+'>'+esc(serif?l:l.toUpperCase())+'</text>';}).join('');
 var ay=top?285:22;return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="1200" height="1800">'+S.M[b.motif](b.pal,id)+txt+'<text x="18" y="'+ay+'" font-size="10" letter-spacing="2" font-family="Helvetica,Arial,sans-serif" fill="'+(b.pal.ink2||b.pal.ink)+'">'+esc(b.author.toUpperCase())+'</text></svg>';}
function download(b,i){var svg=svgCover(b,'dl'+i);var img=new Image();img.onload=function(){var c=document.createElement('canvas');c.width=1200;c.height=1800;c.getContext('2d').drawImage(img,0,0,1200,1800);
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
