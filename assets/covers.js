/* Selfpublishbot – Cover-Engine (geteilt von Startseite und Tools) */
(function(w){
/* ---------- Cover-Motive (SVG 200×300) ---------- */
function grad(id,a,b,vert){return '<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="'+(vert?0:1)+'" y2="'+(vert?1:1)+'"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient></defs>';}
function stars(n,seed,col,maxY){var s='';for(var i=0;i<n;i++){seed=(seed*9301+49297)%233280;var x=seed/233280*200;seed=(seed*9301+49297)%233280;var y=seed/233280*(maxY||180);var r=(i%5===0)?1.2:.6;s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" fill="'+col+'" opacity="'+(0.4+(i%3)*0.2)+'"/>';}return s;}
var M={
moonsea:function(c,id){return grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/>'+stars(40,7,'#fff',170)+'<circle cx="138" cy="92" r="30" fill="'+c.c+'"/><circle cx="150" cy="84" r="26" fill="'+c.a+'" opacity=".25"/><rect y="200" width="200" height="100" fill="'+c.b+'"/><path d="M0 205h200" stroke="'+c.c+'" stroke-width="1" opacity=".5"/><g stroke="'+c.c+'" stroke-width="2" opacity=".7"><path d="M120 215h36M126 228h24M131 241h14M134 254h8"/></g>';},
city:function(c,id){var s=grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/>';var x=0,seed=3;while(x<200){seed=(seed*7+11)%97;var w=18+seed%22,h=90+seed*1.6;s+='<rect x="'+x+'" y="'+(300-h)+'" width="'+(w-2)+'" height="'+h+'" fill="'+c.d+'"/>';for(var yy=300-h+8;yy<290;yy+=10){for(var xx=x+4;xx<x+w-6;xx+=6){if((xx*yy+seed)%7<2)s+='<rect x="'+xx+'" y="'+yy+'" width="2.5" height="4" fill="'+c.c+'"/>';}}x+=w;}return s;},
rain:function(c,id){var s=grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/><path d="M60 300V170" stroke="'+c.d+'" stroke-width="5"/><path d="M60 172q0-10 14-10h18" stroke="'+c.d+'" stroke-width="5" fill="none"/><path d="M80 166l12 0 8 12h-28z" fill="'+c.d+'"/><path d="M58 178l-40 122h170L104 178z" fill="'+c.c+'" opacity=".22"/><g fill="'+c.d+'"><circle cx="140" cy="222" r="8"/><path d="M128 300v-58q12-14 24 0v58z"/></g>';for(var i=0;i<70;i++){var x=(i*37)%200,y=(i*53)%300;s+='<path d="M'+x+' '+y+'l-4 12" stroke="#fff" stroke-width=".7" opacity=".35"/>';}return s;},
mountains:function(c,id){return grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/><circle cx="100" cy="150" r="46" fill="'+c.c+'"/><path d="M-10 230L50 140l30 40 40-70 90 120v70H-10z" fill="'+c.d+'"/><path d="M-10 260l50-50 40 30 50-50 80 70v40H-10z" fill="'+c.e+'"/><path d="M110 110l-10 15 8-2 5 6 8-6z" fill="#fff" opacity=".8"/>';},
forest:function(c,id){var s=grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/>';function tree(x,y,h,f,o){return '<path d="M'+x+' '+(y-h)+'l'+(h*0.28)+' '+h+'h-'+(h*0.56)+'z" fill="'+f+'" opacity="'+o+'"/>';}for(var i=0;i<9;i++)s+=tree(i*26+6,230,110+(i%3)*20,c.d,.55);s+='<rect y="190" width="200" height="30" fill="'+c.b+'" opacity=".55"/>';for(var j=0;j<8;j++)s+=tree(j*30-4,310,160+(j%2)*30,c.e,1);s+='<circle cx="150" cy="70" r="14" fill="'+c.c+'" opacity=".85"/>';return s;},
planet:function(c,id){return grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/>'+stars(60,11,'#fff',300)+'<circle cx="104" cy="150" r="52" fill="'+c.c+'"/><path d="M52 150a52 52 0 0 0 104 0" fill="'+c.d+'" opacity=".35"/><ellipse cx="104" cy="150" rx="90" ry="18" fill="none" stroke="'+c.e+'" stroke-width="5" transform="rotate(-18 104 150)"/><circle cx="40" cy="60" r="7" fill="'+c.e+'"/>';},
sunstripes:function(c,id){var s='<rect width="200" height="300" fill="'+c.a+'"/><clipPath id="'+id+'"><circle cx="100" cy="140" r="70"/></clipPath><g clip-path="url(#'+id+')"><rect x="20" y="60" width="160" height="160" fill="'+c.c+'"/>';for(var i=0;i<6;i++)s+='<rect x="20" y="'+(152+i*12)+'" width="160" height="'+(3+i)+'" fill="'+c.a+'"/>';return s+'</g><rect y="232" width="200" height="68" fill="'+c.b+'"/>';},
bloom:function(c,id){var s='<rect width="200" height="300" fill="'+c.a+'"/>';for(var i=0;i<8;i++){s+='<ellipse cx="100" cy="128" rx="18" ry="52" fill="'+c.c+'" opacity=".55" transform="rotate('+(i*22.5)+' 100 150)"/>';}return s+'<circle cx="100" cy="150" r="16" fill="'+c.d+'"/><path d="M100 205c0 40 0 60 4 95" stroke="'+c.e+'" stroke-width="3" fill="none"/><path d="M102 250c18-14 30-12 38-6-14 10-26 10-38 6z" fill="'+c.e+'"/>';},
castle:function(c,id){return grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/>'+stars(30,5,'#fff',150)+'<circle cx="60" cy="80" r="22" fill="'+c.c+'"/><path d="M40 300V200h12v-10h8v10h12v-30l14-26 14 26v-50l16-30 16 30v80h12v-10h8v10h12v100z" fill="'+c.d+'"/><rect x="113" y="150" width="6" height="10" fill="'+c.c+'"/><rect x="82" y="190" width="5" height="8" fill="'+c.c+'"/>';},
dunes:function(c,id){return grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/><circle cx="64" cy="110" r="26" fill="'+c.c+'"/><path d="M-10 220q60-60 120-10t100-20v120H-10z" fill="'+c.d+'"/><path d="M-10 260q70-40 130 0t90-10v60H-10z" fill="'+c.e+'"/><g fill="'+c.b+'"><path d="M140 206l3-10 3 10z"/><circle cx="143" cy="194" r="2"/></g>';},
chart:function(c,id){var s='<rect width="200" height="300" fill="'+c.a+'"/>';var h=[40,58,50,82,96,128,150];for(var i=0;i<h.length;i++)s+='<rect x="'+(26+i*22)+'" y="'+(250-h[i])+'" width="14" height="'+h[i]+'" fill="'+(i===h.length-1?c.c:c.d)+'"/>';return s+'<path d="M24 196L54 176 76 182 98 150 120 136 142 104 166 82" stroke="'+c.c+'" stroke-width="3" fill="none"/><circle cx="166" cy="82" r="5" fill="'+c.c+'"/>';},
house:function(c,id){return grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/>'+stars(25,13,'#fff',140)+'<rect y="236" width="200" height="64" fill="'+c.e+'"/><path d="M58 236v-64l42-34 42 34v64z" fill="'+c.d+'"/><rect x="88" y="180" width="24" height="22" fill="'+c.c+'"/><path d="M100 180v22M88 191h24" stroke="'+c.d+'" stroke-width="2"/><rect x="122" y="140" width="10" height="20" fill="'+c.d+'"/><path d="M127 136q6-10 0-18t2-16" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>';},
plate:function(c,id){return '<rect width="200" height="300" fill="'+c.a+'"/><circle cx="100" cy="150" r="62" fill="'+c.b+'"/><circle cx="100" cy="150" r="46" fill="'+c.c+'"/><circle cx="88" cy="140" r="9" fill="'+c.d+'"/><circle cx="112" cy="160" r="7" fill="'+c.e+'"/><circle cx="108" cy="134" r="5" fill="'+c.d+'"/><path d="M26 110v90M20 110v26q6 8 12 0v-26" stroke="'+c.b+'" stroke-width="3" fill="none"/><path d="M176 110q-12 20 0 46v44" stroke="'+c.b+'" stroke-width="4" fill="none"/>';},
lighthouse:function(c,id){return grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/><path d="M112 98L300 40v120z" fill="'+c.c+'" opacity=".25"/><path d="M92 240l6-130h16l6 130z" fill="'+c.e+'"/><path d="M95 170h22M94 205h24" stroke="'+c.d+'" stroke-width="10"/><rect x="96" y="92" width="20" height="18" fill="'+c.c+'"/><path d="M92 92l14-12 14 12z" fill="'+c.d+'"/><path d="M0 240q50-10 100 0t100 0v60H0z" fill="'+c.d+'"/>';},
road:function(c,id){return grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/><rect y="170" width="200" height="130" fill="'+c.d+'"/><path d="M96 170h8l70 130H26z" fill="'+c.e+'"/><path d="M100 176v8M100 196v14M100 224v20M100 260v30" stroke="'+c.c+'" stroke-width="3"/><circle cx="150" cy="120" r="22" fill="'+c.c+'"/>';},
birds:function(c,id){var s='<rect width="200" height="300" fill="'+c.a+'"/><circle cx="100" cy="230" r="120" fill="'+c.b+'"/>';var pts=[[40,90,1.4],[70,70,1],[96,100,1.8],[130,60,.9],[150,96,1.2],[118,130,.8],[60,124,.9],[160,140,.7]];pts.forEach(function(p){s+='<path d="M'+p[0]+' '+p[1]+'q'+(6*p[2])+' '+(-6*p[2])+' '+(12*p[2])+' 0q'+(6*p[2])+' '+(-6*p[2])+' '+(12*p[2])+' 0" stroke="'+c.d+'" stroke-width="2.4" fill="none"/>';});return s;},
wave:function(c,id){var s='<rect width="200" height="300" fill="'+c.a+'"/><circle cx="150" cy="70" r="20" fill="'+c.c+'"/>';for(var i=0;i<5;i++){var y=150+i*30;s+='<path d="M-20 '+y+'q30-40 60-10t60 0 60-10 60 10v'+(310-y)+'H-20z" fill="'+(i%2?c.d:c.e)+'" opacity="'+(0.6+i*0.1)+'"/>';}return s;},
keyhole:function(c,id){return '<rect width="200" height="300" fill="'+c.a+'"/><circle cx="100" cy="128" r="30" fill="'+c.c+'"/><path d="M84 150l-12 70h56l-12-70z" fill="'+c.c+'"/><circle cx="100" cy="128" r="12" fill="'+c.d+'"/>';},
spiral:function(c,id){var s='<rect width="200" height="300" fill="'+c.a+'"/>';for(var i=9;i>0;i--)s+='<circle cx="100" cy="150" r="'+(i*11)+'" fill="'+(i%2?c.c:c.d)+'"/>';return s+'<circle cx="100" cy="150" r="5" fill="'+c.e+'"/>';},
eye:function(c,id){return '<rect width="200" height="300" fill="'+c.a+'"/><path d="M20 150q80-90 160 0-80 90-160 0z" fill="'+c.b+'"/><circle cx="100" cy="150" r="30" fill="'+c.c+'"/><circle cx="100" cy="150" r="14" fill="'+c.d+'"/><circle cx="108" cy="142" r="4" fill="#fff"/>';},
balloon:function(c,id){return grad(id,c.a,c.b,1)+'<rect width="200" height="300" fill="url(#'+id+')"/><ellipse cx="110" cy="120" rx="40" ry="48" fill="'+c.c+'"/><path d="M80 110q30 18 60 0" stroke="'+c.d+'" stroke-width="3" fill="none"/><path d="M98 166l4 22h16l4-22" stroke="'+c.d+'" stroke-width="1.5" fill="none"/><rect x="102" y="188" width="16" height="12" fill="'+c.d+'"/><ellipse cx="40" cy="80" rx="22" ry="8" fill="#fff" opacity=".5"/><ellipse cx="160" cy="220" rx="30" ry="9" fill="#fff" opacity=".4"/>';},
/* Marcels Bücher */
pier:function(c,id,whale){
 var s='<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c.a+'"/><stop offset="1" stop-color="'+c.b+'"/></linearGradient><linearGradient id="'+id+'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c.e+'" stop-opacity=".55"/><stop offset="1" stop-color="'+c.d+'"/></linearGradient><filter id="'+id+'f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="'+id+'r"><stop offset="0" stop-color="'+c.c+'" stop-opacity=".35"/><stop offset="1" stop-color="'+c.c+'" stop-opacity="0"/></radialGradient></defs>';
 s+='<rect width="200" height="300" fill="url(#'+id+')"/>'+stars(70,21,'#fff',150);
 if(!whale){s+='<circle cx="152" cy="62" r="16" fill="'+c.c+'" opacity=".9"/><circle cx="152" cy="62" r="34" fill="url(#'+id+'r)"/>';}
 s+='<rect y="150" width="200" height="150" fill="url(#'+id+'w)"/><path d="M0 150h200" stroke="'+c.c+'" stroke-width=".5" opacity=".35"/>';
 /* Glow unter Wasser */
 s+='<ellipse cx="'+(whale?110:104)+'" cy="'+(whale?232:226)+'" rx="'+(whale?92:70)+'" ry="'+(whale?44:34)+'" fill="url(#'+id+'r)"/>';
 /* Fische */
 var seed=whale?17:5,f='';
 function rnd(){seed=(seed*9301+49297)%233280;return seed/233280;}
 if(whale){
  for(var i=0;i<260;i++){var t=rnd(),u=rnd();var x=28+t*150;var cx=(x-28)/150;var half=cx<0.82?(8+Math.sin(cx/0.82*Math.PI)*28):(4+(cx-0.82)*40);var y0=232+(cx<0.82?Math.sin(cx*3)*3:-(cx-0.82)*30);var y=y0+(u*2-1)*half*(cx>0.82?1.2:1);
   if(cx>0.9&&Math.abs(y-y0)<4)continue;
   var sc=0.7+rnd()*0.7;f+='<path transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+sc.toFixed(2)+')" d="M0 0q2.6-1.8 5.2 0q-2.6 1.8-5.2 0zm5.2 0l1.8-1.3v2.6z" fill="'+c.c+'" opacity="'+(0.35+rnd()*0.65).toFixed(2)+'"/>';}
 }else{
  for(var j=0;j<120;j++){var a=rnd()*Math.PI*1.7+0.7,r=18+rnd()*46;var x2=104+Math.cos(a)*r*1.5,y2=228+Math.sin(a)*r*0.55;var sc2=0.7+rnd()*0.8;
   f+='<path transform="translate('+x2.toFixed(1)+' '+y2.toFixed(1)+') rotate('+((a*57)%40-20).toFixed(0)+') scale('+sc2.toFixed(2)+')" d="M0 0q2.6-1.8 5.2 0q-2.6 1.8-5.2 0zm5.2 0l1.8-1.3v2.6z" fill="'+c.c+'" opacity="'+(0.35+rnd()*0.65).toFixed(2)+'"/>';}
 }
 s+='<g filter="url(#'+id+'f)">'+f+'</g>';
 /* Steg */
 s+='<path d="M10 300L92 176h14L70 300z" fill="#06070A"/>';
 for(var k=0;k<9;k++){var tt=k/8;var yy=176+tt*124;var xl=92-tt*82,xr=106-tt*36;s+='<path d="M'+xl.toFixed(1)+' '+yy.toFixed(1)+'H'+xr.toFixed(1)+'" stroke="#1C2029" stroke-width=".7"/>';s+='<rect x="'+(xl-1).toFixed(1)+'" y="'+yy.toFixed(1)+'" width="'+(1.2+tt*2).toFixed(1)+'" height="'+(4+tt*16).toFixed(1)+'" fill="#06070A"/>';}
 /* Mann am Ende, Laptop */
 s+='<g fill="#030405"><circle cx="98" cy="156" r="3.4"/><path d="M94.5 176v-15q3.5-3.5 7 0v15z"/><path d="M101 168l6 3v5h-3v-3l-4-1z"/></g>';
 s+='<path d="M103 169h7l-1.2 4h-6z" fill="'+c.c+'"/><circle cx="106" cy="170" r="9" fill="url(#'+id+'r)"/>';
 return s;}
};

/* ---------- Bücher ---------- */
var P={
 night:{a:'#0E1A33',b:'#1F3B63',c:'#F4E3B2',d:'#0A1426',e:'#2B4F80',ink:'#F4E3B2'},
 noir:{a:'#16181D',b:'#2B2F38',c:'#F2C14E',d:'#0C0D10',e:'#3A3F4A',ink:'#FFFFFF'},
 crimson:{a:'#2A0E12',b:'#5C1A22',c:'#F25C54',d:'#120607',e:'#8A2A33',ink:'#FDE8E4'},
 alpine:{a:'#F2B880',b:'#E07A5F',c:'#FFF1D6',d:'#3D405B',e:'#24263A',ink:'#24263A',ink2:'#FFF1D6'},
 fog:{a:'#9FB4B0',b:'#5E7C78',c:'#F3EBD3',d:'#3F5B57',e:'#1E2E2C',ink:'#F3EBD3'},
 cosmos:{a:'#120B2E',b:'#3A1C71',c:'#FF8C61',d:'#2A0F45',e:'#7EE0D0',ink:'#FFFFFF'},
 retro:{a:'#F4E9D8',b:'#1D3557',c:'#E63946',d:'#F4E9D8',e:'#1D3557',ink:'#1D3557'},
 blush:{a:'#F6DDE0',b:'#E8A0A8',c:'#D45D79',d:'#8E3B54',e:'#3E7C59',ink:'#5A1E33'},
 royal:{a:'#1B1F3B',b:'#4B2C5E',c:'#F7D488',d:'#0E1022',e:'#B98BD0',ink:'#F7D488'},
 sahara:{a:'#F6C177',b:'#EE8B60',c:'#FFF4D6',d:'#D9734E',e:'#B5523B',ink:'#3B1F14',ink2:'#FFF4D6'},
 mint:{a:'#E9F5EF',b:'#2D6A4F',c:'#E76F51',d:'#2D6A4F',e:'#95D5B2',ink:'#1B4332'},
 dusk:{a:'#3D2C5E',b:'#E07A5F',c:'#FFD27A',d:'#1E1633',e:'#2A1F45',ink:'#FFF3DA'},
 kitchen:{a:'#F2E3C9',b:'#FFFFFF',c:'#F4A259',d:'#BC4B51',e:'#5B8E7D',ink:'#3B2A20'},
 northsea:{a:'#22334F',b:'#5B7DA8',c:'#FFE08A',d:'#16233A',e:'#ECEFF4',ink:'#ECEFF4'},
 highway:{a:'#FF9F68',b:'#FFD6A5',c:'#FFF8E7',d:'#2E2B3A',e:'#46415A',ink:'#2E2B3A',ink2:'#FFF8E7'},
 sky:{a:'#BFD7EA',b:'#FFFFFF',c:'#FFFFFF',d:'#1F2A44',e:'#FFFFFF',ink:'#1F2A44'},
 ocean:{a:'#F1E9DA',b:'#2E5266',c:'#E2725B',d:'#2E5266',e:'#6E8898',ink:'#2E5266',ink2:'#F1E9DA'},
 gold:{a:'#141414',b:'#141414',c:'#D4AF37',d:'#141414',e:'#D4AF37',ink:'#D4AF37'},
 hypno:{a:'#0F0F0F',b:'#0F0F0F',c:'#F2F2F2',d:'#0F0F0F',e:'#E63946',ink:'#F2F2F2'},
 lilac:{a:'#E5DEFF',b:'#FFFFFF',c:'#5B4BC4',d:'#1B1446',e:'#5B4BC4',ink:'#1B1446'},
 sunrise:{a:'#FFB4A2',b:'#FFE5D9',c:'#E5989B',d:'#6D597A',e:'#FFFFFF',ink:'#3D2C3F'},
 forestN:{a:'#0F2A24',b:'#1F4A3F',c:'#F6E7B4',d:'#2E6150',e:'#081A16',ink:'#F6E7B4'},
 rueckkehr:{a:'#0B1A35',b:'#1E3A6B',c:'#F2C35B',d:'#08142A',e:'#3B5E95',ink:'#F7E3B0'},
 ganze:{a:'#05070C',b:'#0F1C2E',c:'#7FE3F0',d:'#040A13',e:'#2A5B73',ink:'#E8FBFF'}
};
var hpIcon='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><rect x="3" y="15" width="4" height="6" rx="1.5"/><rect x="17" y="15" width="4" height="6" rx="1.5"/></svg>';
function esc(s){return String(s).replace(/[&<>"]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}
var uid=0;
function cover(b,big){var id='g'+(uid++);var svg='<svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+M[b.motif](b.pal,id,b.whale)+'</svg>';
 var top=b.pos==='top';var tStyle=(top?'top:7%;':'bottom:15%;')+'color:'+b.pal.ink;var aStyle=(top?'bottom:5%;':'top:6%;')+'color:'+(b.pal.ink2||b.pal.ink);
 var fc=b.font==='serif'?'serif':(b.font==='caps'?'sans caps':b.font);
 return '<div class="cover">'+svg+'<span class="ct '+fc+'" style="'+tStyle+'">'+esc(b.title)+'</span><span class="ca" style="'+aStyle+'">'+esc(b.author)+'</span>'+(b.audio&&!big?'<span class="hp">'+hpIcon+'</span>':'')+'</div>';}
w.SPB={M:M,P:P,cover:cover,esc:esc,hpIcon:hpIcon};
})(window);
