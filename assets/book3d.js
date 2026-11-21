// Selfpublishbot – Echtzeit-3D-Buch-Bot aus /assets/book.glb (Runway-Bild → Tripo-3D, texturiert, ohne Rig).
// Das erzeugte Cover und der Klappentext werden als Netz exakt auf Vorder- bzw. Rückseite gelegt (Raycast).
// Schnittstelle für index.js: window.Book3D = { ready, setCover(canvas), setBack(canvas), state('idle'|'think'|'front'|'back'), talking(bool) }.
// Ohne WebGL oder Modell bleibt das CSS-Buch (#b3d) sichtbar.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('book3d');
const stage = document.querySelector('.stage');
const ROT = -145 * Math.PI / 180;                    // Modell so drehen, dass die Vorderseite nach +z zeigt
const RECT = { x0: -0.262, x1: 0.284, y0: -0.432, y1: 0.302 }; // Cover-Fläche (gemessen)
const BULB = new THREE.Vector3(-0.238, 0.49, 0.012);  // Antennen-Lämpchen

function ok() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

if (canvas && ok()) {
  new GLTFLoader().loadAsync('/assets/book.glb').then(start).catch(e => console.warn('book.glb', e));
}

function start(gltf) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const key = new THREE.DirectionalLight(0xfff1d6, 1.8); key.position.set(2, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xf2b544, 1.4); rim.position.set(-3, 2, -3); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
  camera.position.set(0, 0.05, 3.6); camera.lookAt(0, 0, 0);

  const model = gltf.scene; model.rotation.y = ROT;
  const holder = new THREE.Group(); holder.add(model);
  holder.updateMatrixWorld(true);
  const meshes = []; model.traverse(o => { if (o.isMesh) meshes.push(o); });

  // Netz über eine Seite legen: Gitter, jeder Punkt per Raycast auf die Oberfläche
  function skin(front) {
    const w = RECT.x1 - RECT.x0, h = RECT.y1 - RECT.y0, cx = (RECT.x0 + RECT.x1) / 2, cy = (RECT.y0 + RECT.y1) / 2;
    const g = new THREE.PlaneGeometry(w, h, 24, 32);
    if (!front) g.rotateY(Math.PI);
    const pos = g.attributes.position, ray = new THREE.Raycaster();
    const dir = new THREE.Vector3(0, 0, front ? -1 : 1);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx, y = pos.getY(i) + cy;
      ray.set(new THREE.Vector3(x, y, front ? 3 : -3), dir);
      const hit = ray.intersectObjects(meshes, false)[0];
      pos.setXYZ(i, x, y, hit ? hit.point.z + (front ? 0.004 : -0.004) : (front ? 0.11 : -0.11));
    }
    g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.0, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(g, m); holder.add(mesh); return mesh;
  }
  const front = skin(true), back = skin(false);

  // Leuchten an der Antenne
  const gc = document.createElement('canvas'); gc.width = gc.height = 64;
  const gx = gc.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,220,140,1)'); gr.addColorStop(0.35, 'rgba(242,181,68,.55)'); gr.addColorStop(1, 'rgba(242,181,68,0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.position.copy(BULB); glow.scale.setScalar(0.12); holder.add(glow);
  const bulbLight = new THREE.PointLight(0xf2b544, 0.4, 1.2); bulbLight.position.copy(BULB); holder.add(bulbLight);

  const root = new THREE.Group(); root.add(holder); scene.add(root);

  // Zustand
  let st = 'idle', talk = false, fade = { f: 0, b: 0, tf: 0, tb: 0 };
  const target = { y: -0.42 };
  function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  const api = window.Book3D = {
    ready: true,
    setCover(c) { if (front.material.map) front.material.map.dispose(); front.material.map = tex(c); front.material.needsUpdate = true; fade.f = 0; fade.tf = 1; },
    setBack(c) { if (back.material.map) back.material.map.dispose(); back.material.map = tex(c); back.material.needsUpdate = true; fade.tb = 1; },
    state(s) { st = s; },
    talking(on) { talk = !!on; }
  };

  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    look.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
    look.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
  }, { passive: true });
  // Ziehen zum Drehen
  let drag = null, spin = 0;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, s: spin }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (drag) spin = drag.s + (e.clientX - drag.x) * 0.012; });
  canvas.addEventListener('pointerup', () => { drag = null; });

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  function resize() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight, pr = renderer.getPixelRatio();
    if (canvas.width !== Math.round(cw * pr) || canvas.height !== Math.round(ch * pr)) {
      renderer.setSize(cw, ch, false); camera.aspect = cw / ch; camera.updateProjectionMatrix();
    }
  }

  const timer = new THREE.Timer();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    timer.update(); const dt = Math.min(0.05, timer.getDelta()), t = timer.getElapsed();
    resize();
    look.x += (look.tx - look.x) * Math.min(1, dt * 3); look.y += (look.ty - look.y) * Math.min(1, dt * 3);
    if (!drag) spin *= Math.pow(0.04, dt);

    let ty;
    if (st === 'back') ty = Math.PI - 0.18;
    else if (st === 'front') ty = -0.22 + Math.sin(t * 0.6) * 0.06;
    else if (st === 'think') ty = -0.35 + Math.sin(t * 3.2) * 0.32;
    else ty = -0.42 + Math.sin(t * 0.45) * 0.38;
    target.y += (ty - target.y) * Math.min(1, dt * (st === 'back' ? 2.2 : 3));
    holder.rotation.y = target.y + look.x * 0.25 + spin;
    holder.rotation.x = look.y * 0.08 + (st === 'think' ? Math.sin(t * 5) * 0.03 : 0);
    root.position.y = Math.sin(t * 1.6) * 0.025 + (st === 'think' ? Math.abs(Math.sin(t * 6)) * 0.03 : 0);

    const pulse = st === 'think' ? 0.6 + 0.4 * Math.sin(t * 10) : talk ? 0.55 + 0.45 * Math.abs(Math.sin(t * 9) * Math.sin(t * 5.3)) : 0.35 + 0.15 * Math.sin(t * 2);
    glow.scale.setScalar(0.08 + pulse * 0.12); bulbLight.intensity = pulse * 0.9;

    fade.f += (fade.tf - fade.f) * Math.min(1, dt * 2.5); fade.b += (fade.tb - fade.b) * Math.min(1, dt * 2.5);
    front.material.opacity = fade.f; front.visible = fade.f > 0.01;
    back.material.opacity = fade.b; back.visible = fade.b > 0.01;

    renderer.render(scene, camera);
  }
  resize(); renderer.render(scene, camera);
  stage.classList.add('r3d');
  document.dispatchEvent(new Event('book3d-ready'));
  frame();
}
