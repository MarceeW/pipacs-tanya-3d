// Dev-only model gallery: /gallery.html?set=plants[&filter=wheat][&season=winter][&night=1][&yaw=0..3][&cols=6]
// Lays out every CATALOG entry of a model module on a grass grid and labels it.
import { THREE, U, applySeason, setNightGlow } from './three/lib.js';
import { createRenderer, createLights, createIsoCamera, aimIsoCamera } from './three/look.js';

const MODULES = {
  plants: () => import('./three/models/plants.js'),
  animals: () => import('./three/models/animals.js'),
  buildings: () => import('./three/models/buildings.js'),
  decos: () => import('./three/models/decos.js'),
  items: () => import('./three/models/items.js'),
  example: () => import('./three/models/_example.js'),
};

const q = new URLSearchParams(location.search);
const set = q.get('set') || 'example';
const filter = q.get('filter');
const season = q.get('season') || 'summer';
const night = q.get('night') === '1';
const yawIdx = Number(q.get('yaw') || 0);

const canvas = document.getElementById('c');
const renderer = createRenderer(canvas);
const scene = new THREE.Scene();
scene.background = new THREE.Color(night ? 0x1c2848 : 0xa8dcf5);
const lights = createLights(scene, { shadowSize: 40 });
lights.setDay(night ? 0.05 : 1);
U.uSnow.value = season === 'winter' ? 1 : 0;

const { CATALOG } = await MODULES[set]();
let entries = Object.entries(CATALOG);
if (filter) entries = entries.filter(([k]) => k.includes(filter));
const n = entries.length;
const cols = Number(q.get('cols')) || Math.ceil(Math.sqrt(n * 1.4));
const cell = Number(q.get('cell')) || 0;

// measure each model to size the grid cells
const objs = entries.map(([name, make]) => {
  const o = make();
  const b = new THREE.Box3().setFromObject(o);
  const s = b.getSize(new THREE.Vector3());
  return { name, o, w: Math.max(s.x, s.z, 1), h: s.y };
});
// materials are created lazily by the factories, so apply global looks afterwards
setNightGlow(night ? 1 : 0);
applySeason(season);
const C = cell || Math.max(...objs.map((x) => x.w)) + 1.2;
const rows = Math.ceil(n / cols);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(cols * C + 4, rows * C + 4).rotateX(-Math.PI / 2),
  new THREE.MeshLambertMaterial({ color: season === 'winter' ? 0xeef4fa : 0x7cc242 }));
ground.receiveShadow = true;
scene.add(ground);

objs.forEach((e, i) => {
  const cx = (i % cols - (cols - 1) / 2) * C, cz = (Math.floor(i / cols) - (rows - 1) / 2) * C;
  e.o.position.x += cx; e.o.position.z += cz;
  e.cx = cx; e.cz = cz;
  scene.add(e.o);
});

const aspect = innerWidth / innerHeight;
const half = Math.max(cols, rows) * C * 0.42;
const cam = createIsoCamera(aspect, half);
const yaw = Math.PI / 4 + yawIdx * Math.PI / 2;
aimIsoCamera(cam, new THREE.Vector3(0, 0, 0), yaw);
lights.follow(0, 0);
lights.sun.shadow.camera.left = lights.sun.shadow.camera.bottom = -half * 1.6;
lights.sun.shadow.camera.right = lights.sun.shadow.camera.top = half * 1.6;
lights.sun.shadow.camera.updateProjectionMatrix();

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  const a = innerWidth / innerHeight;
  cam.left = -half * a; cam.right = half * a; cam.top = half; cam.bottom = -half; cam.updateProjectionMatrix();
}
resize();

// labels
const v = new THREE.Vector3();
const labels = objs.map((e) => { const d = document.createElement('div'); d.className = 'lbl'; d.textContent = e.name; document.body.appendChild(d); return d; });
function placeLabels() {
  objs.forEach((e, i) => {
    v.set(e.cx, 0, e.cz + C * 0.38).project(cam);
    labels[i].style.left = ((v.x + 1) / 2) * innerWidth + 'px';
    labels[i].style.top = ((1 - v.y) / 2) * innerHeight + 'px';
  });
}

const clock = new THREE.Clock();
let frames = 0;
function loop() {
  const t = clock.getElapsedTime();
  U.uTime.value = t;
  scene.traverse((o) => { if (o.userData.anim) o.userData.anim(t, 1 / 60); });
  renderer.render(scene, cam);
  placeLabels();
  if (++frames === 3) window.__ready = true;
  requestAnimationFrame(loop);
}
loop();
