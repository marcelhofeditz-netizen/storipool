// Selfpublishbot – der Zauberbuch-Charakter in Echtzeit-3D aus /assets/zauberbuch.glb
// (Runway-Bild → 3D, texturiert, ohne Rig). Gesicht ohne Rig:
//  · Augen: Bernstein-Steine glühen, Lider (Leder-Scheiben) blinzeln, Pupillen folgen der Maus
//  · Pergament-Feld = Display: Tinten-Mund (spricht), Tinten-Wirbel (denkt), danach Cover + Titel
//  · Rückseite: Klappentext auf dem Pergament
// Schnittstelle für index.js: window.Book3D = { ready, setCover(canvas, title, genre), setBack(canvas),
//   state('idle'|'think'|'front'|'back'), talking(bool), level: () => 0..1, reset() }.
// Ohne WebGL oder Modell bleibt das CSS-Buch (#b3d) sichtbar.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('book3d');
const stage = document.querySelector('.stage');
const ROT = -Math.PI / 2;                                        // Vorderseite nach +z
const PANEL = { x0: -0.195, x1: 0.285, y0: -0.33, y1: 0.145 };   // Pergament-Feld (gemessen)
const EYES = [[-0.082, 0.315], [0.165, 0.315]], EYE_R = 0.047;   // Bernstein-Augen
const PARCH = '#EADCBC', INK = '#2B1A12';

function ok() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
if (canvas && ok()) new GLTFLoader().loadAsync('/assets/zauberbuch.glb').then(start).catch(e => console.warn('zauberbuch.glb', e));

function start(gltf) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight(0xfff0d6, 1.7); key.position.set(2, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xf2b544, 1.3); rim.position.set(-3, 2, -3); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
  camera.position.set(0, 0.02, 3.5); camera.lookAt(0, 0, 0);

  const model = gltf.scene; model.rotation.y = ROT;
  const holder = new THREE.Group(); holder.add(model); holder.updateMatrixWorld(true);
  const meshes = []; model.traverse(o => { if (o.isMesh) meshes.push(o); });
  const ray = new THREE.Raycaster();
  function surfaceZ(x, y, front) {
    ray.set(new THREE.Vector3(x, y, front ? 3 : -3), new THREE.Vector3(0, 0, front ? -1 : 1));
    const h = ray.intersectObjects(meshes, false)[0];
    return h ? h.point.z : (front ? 0.17 : -0.17);
  }

  // Pergament-Netz (vorne/hinten) per Raycast auf die Fläche gelegt
  function skin(front, cnv) {
    const w = PANEL.x1 - PANEL.x0, h = PANEL.y1 - PANEL.y0, cx = (PANEL.x0 + PANEL.x1) / 2, cy = (PANEL.y0 + PANEL.y1) / 2;
    const g = new THREE.PlaneGeometry(w, h, 20, 20); if (!front) g.rotateY(Math.PI);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx, y = pos.getY(i) + cy;
      pos.setXYZ(i, x, y, surfaceZ(x, y, front) + (front ? 0.003 : -0.003));
    }
    g.computeVertexNormals();
    const t = new THREE.CanvasTexture(cnv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, metalness: 0 }));
    holder.add(m); return m;
  }
  const disp = document.createElement('canvas'); disp.width = disp.height = 1024;
  const dx = disp.getContext('2d');
  const front = skin(true, disp);
  const backC = document.createElement('canvas'); backC.width = backC.height = 1024;
  const back = skin(false, backC); back.visible = false;

  // Augen: Glühen, Pupille, Lid
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,210,120,1)'); g.addColorStop(.4, 'rgba(242,160,50,.5)'); g.addColorStop(1, 'rgba(242,160,50,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const eyes = EYES.map(([x, y]) => {
    const z = surfaceZ(x, y, true);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow.position.set(x, y, z + 0.02); glow.scale.setScalar(0.16); holder.add(glow);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(EYE_R * 0.32, 24), new THREE.MeshBasicMaterial({ color: 0x2a1206, transparent: true, opacity: 0.85 }));
    pupil.position.set(x, y, z + 0.006); holder.add(pupil);
    const lid = new THREE.Mesh(new THREE.CircleGeometry(EYE_R * 1.08, 32), new THREE.MeshStandardMaterial({ color: 0x5a1a1c, roughness: 0.7 }));
    lid.position.set(x, y, z + 0.009); lid.scale.y = 0.001; holder.add(lid);
    return { x, y, glow, pupil, lid };
  });
  // Goldlicht aus den Seiten
  const pageLight = new THREE.PointLight(0xffc860, 0, 1.4); pageLight.position.set(0.48, 0, 0.05); holder.add(pageLight);

  const root = new THREE.Group(); root.add(holder); scene.add(root);

  // ---------- Display ----------
  let st = 'idle', talk = false, lvl = 0, coverImg = null, title = '', genre = '', reveal = 0;
  function parchment() {
    dx.fillStyle = PARCH; dx.fillRect(0, 0, 1024, 1024);
    const g = dx.createRadialGradient(512, 512, 200, 512, 512, 720); g.addColorStop(0, 'rgba(255,248,230,0)'); g.addColorStop(1, 'rgba(120,80,40,.35)');
    dx.fillStyle = g; dx.fillRect(0, 0, 1024, 1024);
  }
  function mouth(cx, cy, w, open, t) {
    dx.save(); dx.strokeStyle = INK; dx.fillStyle = INK; dx.lineCap = 'round'; dx.lineWidth = 22;
    if (open > 0.05) {
      dx.beginPath(); dx.ellipse(cx, cy, w * (0.55 + open * 0.15), 18 + open * 110, 0, 0, Math.PI * 2); dx.fill();
      dx.fillStyle = '#7a2a22'; dx.beginPath(); dx.ellipse(cx, cy + open * 50, w * 0.3, 10 + open * 40, 0, 0, Math.PI); dx.fill();
    } else {
      dx.beginPath(); dx.moveTo(cx - w, cy - 20); dx.quadraticCurveTo(cx, cy + 90 + Math.sin(t * 2) * 6, cx + w, cy - 20); dx.stroke();
    }
    dx.restore();
  }
  function swirl(t) {
    dx.save(); dx.strokeStyle = INK; dx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      dx.lineWidth = 14 - k * 3; dx.globalAlpha = 0.8 - k * 0.2; dx.beginPath();
      for (let a = 0; a < 7; a += 0.05) { const r = 40 + a * 38 + k * 30, ang = a + t * (2.2 + k * 0.6); const x = 512 + Math.cos(ang) * r, y = 520 + Math.sin(ang) * r * 0.75; a ? dx.lineTo(x, y) : dx.moveTo(x, y); }
      dx.stroke();
    }
    dx.restore();
  }
  function wrapLines(text, max) { const w = String(text).split(/\s+/), l = []; let c = ''; w.forEach(s => { const t = c ? c + ' ' + s : s; if (dx.measureText(t).width > max && c) { l.push(c); c = s; } else c = t; }); if (c) l.push(c); return l; }
  function drawDisplay(t) {
    parchment();
    if (st === 'think') { swirl(t); }
    else if (coverImg) {
      dx.save(); dx.globalAlpha = Math.min(1, reveal);
      const ih = 560, iw = ih * coverImg.width / coverImg.height; dx.drawImage(coverImg, 512 - iw / 2, 60, iw, ih);
      dx.strokeStyle = 'rgba(43,26,18,.5)'; dx.lineWidth = 4; dx.strokeRect(512 - iw / 2, 60, iw, ih);
      dx.fillStyle = INK; dx.textAlign = 'center'; dx.textBaseline = 'top';
      dx.font = '600 64px Georgia,"Times New Roman",serif'; let y = 660;
      wrapLines(title, 860).slice(0, 2).forEach(l => { dx.fillText(l, 512, y); y += 72; });
      dx.font = 'italic 38px Georgia,serif'; dx.fillStyle = '#6b4a30'; dx.fillText(genre, 512, y + 6);
      dx.restore();
      if (talk) { dx.save(); dx.globalAlpha = .92; mouth(512, 960, 90, lvl, t); dx.restore(); }
    } else {
      mouth(512, 560, 190, talk ? lvl : 0, t);
    }
    front.material.map.needsUpdate = true;
  }

  // ---------- Schnittstelle ----------
  const api = window.Book3D = window.Book3D || {};
  api.ready = true;
  api.level = api.level || (() => 0);
  api.setCover = (c, t, g) => { coverImg = c; title = t || ''; genre = g || ''; reveal = 0; };
  api.setBack = c => { const x = backC.getContext('2d'); x.drawImage(c, 0, 0, 1024, 1024); back.material.map.needsUpdate = true; back.visible = true; };
  api.state = s => { st = s; };
  api.talking = on => { talk = !!on; };
  api.reset = () => { coverImg = null; title = ''; back.visible = false; };

  const look = { x: 0, y: 0, tx: 0, ty: 0, last: 0 };
  window.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    look.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
    look.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.35)) / (window.innerHeight / 2)));
    look.last = performance.now();
  }, { passive: true });
  let drag = null, spin = 0;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, s: spin }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (drag) spin = drag.s + (e.clientX - drag.x) * 0.012; });
  canvas.addEventListener('pointerup', () => { drag = null; });

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  function resize() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight, pr = renderer.getPixelRatio();
    if (canvas.width !== Math.round(cw * pr) || canvas.height !== Math.round(ch * pr)) { renderer.setSize(cw, ch, false); camera.aspect = cw / ch; camera.updateProjectionMatrix(); }
  }

  let blink = 0, nextBlink = 2, wander = 0, rotY = -0.3;
  const timer = new THREE.Timer();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    timer.update(); const dt = Math.min(0.05, timer.getDelta()), t = timer.getElapsed();
    resize();
    if (performance.now() - look.last > 3000) { wander += dt; look.tx = Math.sin(wander * 0.4) * 0.4; look.ty = Math.sin(wander * 0.27) * 0.2; }
    look.x += (look.tx - look.x) * Math.min(1, dt * 4); look.y += (look.ty - look.y) * Math.min(1, dt * 4);
    if (!drag) spin *= Math.pow(0.04, dt);

    let raw = 0; try { raw = talk ? Math.max(0, Math.min(1, api.level() || 0)) : 0; } catch (e) {}
    if (talk && raw === 0) raw = 0.25 + 0.6 * Math.abs(Math.sin(t * 9) * Math.sin(t * 5.3 + 1));
    lvl += (raw - lvl) * Math.min(1, dt * 16);
    reveal = Math.min(1.2, reveal + dt * 0.8);

    nextBlink -= dt; if (nextBlink < 0) { blink = 1; nextBlink = (st === 'think' ? 0.9 : 2.2) + Math.random() * 3; }
    blink = Math.max(0, blink - dt * 7);
    const lidS = Math.max(0.001, Math.sin(Math.min(1, blink) * Math.PI));
    const glowA = st === 'think' ? 0.55 + 0.45 * Math.sin(t * 9) : talk ? 0.6 + lvl * 0.4 : 0.5 + 0.12 * Math.sin(t * 1.8);
    eyes.forEach(e => {
      e.lid.scale.y = lidS;
      e.pupil.position.x = e.x + look.x * EYE_R * 0.42; e.pupil.position.y = e.y - look.y * EYE_R * 0.35;
      e.glow.material.opacity = glowA * (1 - lidS); e.glow.scale.setScalar(0.12 + glowA * 0.08);
    });
    pageLight.intensity = st === 'think' ? 1.2 + Math.sin(t * 7) * 0.6 : talk ? 0.6 + lvl : 0.25;

    let ty;
    if (st === 'back') ty = Math.PI - 0.2;
    else if (st === 'think') ty = -0.25 + Math.sin(t * 3) * 0.22;
    else if (st === 'front') ty = -0.18 + Math.sin(t * 0.6) * 0.05;
    else ty = -0.3 + Math.sin(t * 0.45) * 0.3;
    rotY += (ty - rotY) * Math.min(1, dt * (st === 'back' ? 2.2 : 3));
    holder.rotation.y = rotY + look.x * 0.22 + spin;
    holder.rotation.x = look.y * 0.07 + (talk ? Math.sin(t * 6) * 0.02 * (0.4 + lvl) : 0);
    holder.rotation.z = Math.sin(t * 0.8) * 0.015;
    root.position.y = Math.sin(t * 1.6) * 0.025 + (st === 'think' ? Math.abs(Math.sin(t * 6)) * 0.025 : 0);

    drawDisplay(t);
    renderer.render(scene, camera);
  }
  resize(); drawDisplay(0); renderer.render(scene, camera);
  stage.classList.add('r3d');
  document.dispatchEvent(new Event('book3d-ready'));
  frame();
}
