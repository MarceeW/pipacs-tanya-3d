// Renders 3D item / UI / portrait models once into small PNG icons (data URLs + canvases),
// so the DOM UI and in-world bubbles share the exact same art.
import { THREE, U, applySeason } from './lib.js';
import { ISO_PITCH } from './look.js';
import { makeItem, makeUiIcon } from './models/items.js';
import { makePortrait, VILLAGERS, makeFarmer, makeAnimal } from './models/animals.js';
import { makeBuilding, makeHousing } from './models/buildings.js';
import { makeDeco } from './models/decos.js';
import { makeFruitTree } from './models/plants.js';

const SIZE = 128;
const urls = {}, canvases = {};
let r = null, scene, cam;

function setup() {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(SIZE, SIZE, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1.1;
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a60, 1.6));
  const key = new THREE.DirectionalLight(0xfff4e0, 2.2); key.position.set(3, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe6ff, 0.8); rim.position.set(-4, 3, -3); scene.add(rim);
  cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 50);
}

const box = new THREE.Box3(), sph = new THREE.Sphere(), center = new THREE.Vector3();
function renderModel(obj, { pitch = ISO_PITCH * 0.8, yaw = Math.PI / 4, pad = 1.08, portrait = false } = {}) {
  scene.add(obj);
  obj.updateMatrixWorld(true);
  box.setFromObject(obj);
  box.getBoundingSphere(sph);
  box.getCenter(center);
  const rad = sph.radius * pad;
  cam.left = -rad; cam.right = rad; cam.top = rad; cam.bottom = -rad;
  if (portrait) { cam.top = rad * 0.92; cam.bottom = -rad * 1.08; }
  cam.updateProjectionMatrix();
  cam.position.set(center.x + Math.sin(yaw) * Math.cos(pitch) * 10, center.y + Math.sin(pitch) * 10, center.z + Math.cos(yaw) * Math.cos(pitch) * 10);
  cam.lookAt(center);
  r.setClearColor(0x000000, 0);
  r.clear();
  r.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = out.height = SIZE;
  out.getContext('2d').drawImage(r.domElement, 0, 0);
  scene.remove(obj);
  return out;
}

function fallback(name) {
  const c = document.createElement('canvas'); c.width = c.height = SIZE;
  const g = c.getContext('2d');
  g.fillStyle = '#e0c48a'; g.beginPath(); g.arc(64, 64, 46, 0, 6.3); g.fill();
  g.fillStyle = '#6b4a22'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText((name.split(':')[1] || '?')[0].toUpperCase(), 64, 68);
  return c;
}

function store(name, canvas) { canvases[name] = canvas; urls[name] = canvas.toDataURL('image/png'); }

/** Build icons for every item id, ui name and villager portrait. Yields to keep the loader animating. */
export async function buildIcons(itemIds, uiNames, onProgress) {
  setup();
  const snow = U.uSnow.value; U.uSnow.value = 0;
  applySeason('summer');
  const jobs = [
    ...itemIds.map((id) => ['item:' + id, () => renderModel(makeItem(id))]),
    ...uiNames.map((n) => ['ui:' + n, () => renderModel(makeUiIcon(n))]),
    ...VILLAGERS.map((v, i) => ['portrait:' + i, () => renderModel(makePortrait(v), { pitch: 0.12, yaw: 0.25, pad: 0.95, portrait: true })]),
    ['portrait:farmer', () => renderModel(makePortrait(makeFarmer.spec || VILLAGERS[1]), { pitch: 0.12, yaw: 0.25, pad: 0.95, portrait: true })],
  ];
  for (let i = 0; i < jobs.length; i++) {
    const [name, fn] = jobs[i];
    let c;
    try { c = fn(); } catch (e) { console.warn('icon failed', name, e); c = fallback(name); }
    store(name, c);
    if (i % 8 === 7) { onProgress?.((i + 1) / jobs.length); await new Promise((res) => setTimeout(res, 0)); }
  }
  U.uSnow.value = snow;
  onProgress?.(1);
}

/** Shop thumbnails of placeable things (buildings, housings, decorations, trees). */
export async function registerShopIcons(groups, onProgress) {
  if (!r) setup();
  const snow = U.uSnow.value; U.uSnow.value = 0;
  const make = {
    building: (k) => makeBuilding(k, 1),
    housing: (k) => makeHousing(k, 1),
    deco: (k) => (k === 'dog' || k === 'cat' ? makeAnimal(k) : makeDeco(k, { connect: { e: true, w: true }, seed: 3 })),
    tree: (k) => makeFruitTree(k),
  };
  const jobs = [];
  for (const [kind, keys] of Object.entries(groups)) for (const k of keys) jobs.push(['shop:' + kind + ':' + k, () => renderModel(make[kind](k), { pitch: ISO_PITCH, pad: 1.0 })]);
  for (let i = 0; i < jobs.length; i++) {
    const [name, fn] = jobs[i];
    let c;
    try { c = fn(); } catch (e) { console.warn('icon failed', name, e); c = fallback(name); }
    store(name, c);
    if (i % 6 === 5) { onProgress?.((i + 1) / jobs.length); await new Promise((res) => setTimeout(res, 0)); }
  }
  U.uSnow.value = snow;
  r.dispose(); r.forceContextLoss?.(); r = null;
  onProgress?.(1);
}

export const iconURL = (name) => urls[name] || urls['ui:star'] || '';
export const iconCanvas = (name) => canvases[name] || null;
export const itemIcon = (id) => iconURL('item:' + id);
export const uiIcon = (n) => iconURL('ui:' + n);
