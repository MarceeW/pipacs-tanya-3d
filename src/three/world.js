// Keeps the 3D scene in sync with the game state and runs all world animation:
// crops growing, animals wandering in their yards, visitors walking in, the delivery truck,
// the barge, pets, ambient wildlife, status bubbles, placement ghost and hover highlight.
import * as G from '../core/game.js';
import {
  CROPS, ITEMS, HOUSINGS, ANIMALS, WORLD, DECOS, EXPANSIONS, MAP,
} from '../data/content.js';
import { THREE, U, M, PAL, GEO, mesh, place, group, box, cyl, ball, blobShadow } from './lib.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { scene, setRay, screenToGround, cam } from './scene.js';
import { burst } from './fx.js';
import { iconCanvas } from './icons.js';
import { paintGround } from './terrain.js';
import * as Plants from './models/plants.js';
import * as Animals from './models/animals.js';
import * as Buildings from './models/buildings.js';
import * as Decos from './models/decos.js';

const ents = new Map();          // object id -> entity
let root, overlay;
const PLOT_TOP = Plants.PLOT_TOP ?? 0.1;
export const worldState = { night: 0, season: 'spring', hoverId: null };

export function initWorld() {
  root = new THREE.Group(); root.name = 'world';
  overlay = new THREE.Group(); overlay.name = 'overlay';
  scene.add(root, overlay);
  initAmbient();
  initGhost();
  rebuildAll();
  G.bus.on('objAdded', (o) => { addEnt(o); refreshNeighbours(o); });
  G.bus.on('objRemoved', (o) => { removeEnt(o.id); refreshNeighbours(o); });
  G.bus.on('objMoved', (o) => { removeEnt(o.id); addEnt(o); refreshNeighbours(o); });
  G.bus.on('objChanged', (o) => { removeEnt(o.id); addEnt(o); });
  G.bus.on('expand', () => { paintGround(G.bounds()); placeExpansionSign(); });
  G.bus.on('reset', () => rebuildAll());
  G.bus.on('fx', onFx);
  G.bus.on('truck', () => truckGo());
  G.bus.on('barge', (e) => { if (e.arrive) bargeArrive(); if (e.leave) bargeLeave(); });
  G.bus.on('marketSold', () => spawnShopper());
  G.bus.on('visitorLeft', ({ v, happy }) => visitorLeave(v.id, happy));
  G.bus.on('animalAdded', ({ h }) => { const e = ents.get(h.id); if (e) syncAnimals(e, true); });
}

export function rebuildAll() {
  for (const id of [...ents.keys()]) removeEnt(id);
  for (const o of G.S.objects) addEnt(o);
  paintGround(G.bounds());
  placeExpansionSign();
  for (const v of [...visitors.keys()]) dropVisitor(v);
  if (G.S.barge.state === 'docked') bargeArrive(true); else bargeLeave(true);
}

// ------------------------------------------------------------------ entity build
function tagTree(obj, id) { obj.traverse((c) => { c.userData.objId = id; }); }
function connectFlags(o) {
  if (!DECOS[o.key]?.connect) return null;
  const same = (dx, dy) => { const n = G.objAt(o.x + dx, o.y + dy); return !!n && n.type === 'deco' && n.key === o.key; };
  return { n: same(0, -1), s: same(0, 1), e: same(1, 0), w: same(-1, 0) };
}
function refreshNeighbours(o) {
  if (o.type !== 'deco' || !DECOS[o.key]?.connect) return;
  for (const [dx, dy] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) {
    const n = G.objAt(o.x + dx, o.y + dy);
    if (n && n.type === 'deco' && n.key === o.key) { removeEnt(n.id); addEnt(n); }
  }
}
function safe(fn, label) {
  try { return fn(); } catch (e) { console.warn('model failed', label, e); return place(box(0.8, 0.5, 0.8, '#ff00ff', { r: 0.05 }), 0, 0.25, 0); }
}
/** Merge a static model's meshes into one mesh per material (big draw-call saver). */
const bakeCache = new Map();
function bakeStatic(model, cacheKey = null) {
  const ud = model.userData;
  if (ud.anim || ud.state || ud.setSlots || ud.setFruit || ud.setWet || ud.light) return model;
  if (cacheKey && bakeCache.has(cacheKey)) return bakeCache.get(cacheKey).clone();
  model.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const byMat = new Map();
  let ok = true;
  const keep = [];
  model.traverse((o) => {
    if (o.isSprite || o.isPoints || o.isLine) ok = false;
    if (!o.isMesh || !ok) return;
    if (!o.visible) { ok = false; return; }
    if (o.material.transparent || Array.isArray(o.material)) {
      const c = new THREE.Mesh(o.geometry, o.material);
      new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld).decompose(c.position, c.quaternion, c.scale);
      c.renderOrder = o.renderOrder; c.castShadow = o.castShadow; c.receiveShadow = o.receiveShadow;
      keep.push(c); return;
    }
    const g = o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const key = o.material.uuid + (o.castShadow ? 's' : 'n');
    if (!byMat.has(key)) byMat.set(key, { mat: o.material, shadow: o.castShadow, geos: [] });
    byMat.get(key).geos.push(g.index ? g.toNonIndexed() : g);
  });
  if (!ok) return model;
  const out = new THREE.Group();
  for (const { mat, shadow, geos } of byMat.values()) {
    const merged = mergeGeometries(geos, false);
    if (!merged) return model;
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = shadow; m.receiveShadow = true;
    out.add(m);
  }
  for (const k of keep) out.add(k);
  if (cacheKey) bakeCache.set(cacheKey, out);
  return cacheKey ? out.clone() : out;
}
/**
 * Bake the static part of an animated model: probe its animation and setters, find every
 * object that moves / toggles, and merge all other opaque meshes into one mesh per material.
 */
function partialBake(model) {
  const objs = [];
  model.traverse((o) => objs.push(o));
  const snap = () => objs.map((o) => [o.position.clone(), o.quaternion.clone(), o.scale.clone(), o.visible, o.material]);
  const s0 = snap();
  const changed = new Set();
  const probe = () => {
    const s1 = snap();
    objs.forEach((o, i) => {
      const a = s0[i], b = s1[i];
      if (!a[0].equals(b[0]) || !a[1].equals(b[1]) || !a[2].equals(b[2]) || a[3] !== b[3] || a[4] !== b[4]) changed.add(o);
    });
  };
  const ud = model.userData;
  const st0 = ud.state ? { ...ud.state } : null;
  try {
    for (const flip of [false, true]) {
      if (ud.state) for (const k of Object.keys(ud.state)) if (typeof ud.state[k] === 'boolean') ud.state[k] = flip;
      for (const t of [0.13, 0.9, 1.7, 2.6, 3.9, 5.3, 7.4, 9.9, 13.1]) { ud.anim?.(t, 0.35); probe(); }
    }
    const colors = ['#e53935', '#ffd54f', '#8bc34a', '#90caf9', '#ce93d8', '#ffab76'];
    ud.setSlots?.(colors); probe(); ud.setSlots?.(Array(6).fill(null)); probe();
    ud.setCrates?.(Array(6).fill(true)); probe(); ud.setCrates?.(Array(6).fill(false)); probe();
    ud.setFruit?.(false); probe(); ud.setFruit?.(true); probe();
    ud.setBlossom?.(true); probe(); ud.setBlossom?.(false); probe();
  } catch (e) { console.warn('bake probe failed', e); return model; }
  // restore
  objs.forEach((o, i) => { const a = s0[i]; o.position.copy(a[0]); o.quaternion.copy(a[1]); o.scale.copy(a[2]); o.visible = a[3]; if (a[4]) o.material = a[4]; });
  if (st0) Object.assign(ud.state, st0);
  ud.setSlots?.(Array(6).fill(null)); ud.setCrates?.(Array(6).fill(false)); ud.setFruit?.(true); ud.setBlossom?.(false);
  // dynamic = changed object or anything below it; also keep ancestors of dynamic objects
  const dynamic = new Set();
  for (const c of changed) c.traverse((d) => dynamic.add(d));
  const needed = new Set();
  for (const d of dynamic) { let p = d.parent; while (p && p !== model) { needed.add(p); p = p.parent; } }
  model.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const byMat = new Map(), victims = [];
  model.traverse((o) => {
    if (!o.isMesh || dynamic.has(o) || needed.has(o) || o.children.length) return;
    if (o.material.transparent || Array.isArray(o.material) || !o.visible || o.name === 'truck') return;
    let p = o.parent, named = false;
    while (p && p !== model) { if (p.name === 'truck') named = true; p = p.parent; }
    if (named) return;
    const g = o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const key = o.material.uuid + (o.castShadow ? 's' : 'n');
    if (!byMat.has(key)) byMat.set(key, { mat: o.material, shadow: o.castShadow, geos: [] });
    byMat.get(key).geos.push(g.index ? g.toNonIndexed() : g);
    victims.push(o);
  });
  if (victims.length < 8) return model;
  for (const v of victims) v.parent.remove(v);
  for (const { mat, shadow, geos } of byMat.values()) {
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = shadow; m.receiveShadow = true; m.name = 'baked';
    model.add(m);
  }
  return model;
}
function buildModel(o) {
  switch (o.type) {
    case 'plot': {
      const g = group();
      g.userData.setWet = (w) => {
        if (g.userData.base) g.remove(g.userData.base);
        g.userData.base = bakeStatic(safe(() => { const p = Plants.makePlot(); p.userData.setWet?.(w); delete p.userData.setWet; delete p.userData.state; return p; }, 'plot'), 'plot' + w);
        g.add(g.userData.base);
      };
      g.userData.setWet(false);
      return g;
    }
    case 'tree': return partialBake(safe(() => Plants.makeFruitTree(o.key), o.key));
    case 'building': return partialBake(safe(() => Buildings.makeBuilding(o.key, o.level || 1), o.key));
    case 'housing': return partialBake(safe(() => Buildings.makeHousing(o.key, o.level || 1), o.key));
    case 'fixed': return partialBake(safe(() => Buildings.makeFixed(o.key), o.key));
    case 'obstacle': return bakeStatic(safe(() => Plants.makeObstacle(o.key, o.seed || 1), o.key));
    case 'deco':
      if (o.key === 'dog' || o.key === 'cat') return makePetHome(o.key);
      return bakeStatic(safe(() => Decos.makeDeco(o.key, { connect: connectFlags(o) || {}, seed: o.seed || 1 }), o.key));
    default: return group();
  }
}
function addEnt(o) {
  if (ents.has(o.id)) return;
  const n = G.sizeOf(o);
  const g = new THREE.Group();
  g.position.set(o.x + n / 2, 0, o.y + n / 2);
  const model = buildModel(o);
  model.rotation.y = -(o.rot || 0) * Math.PI / 2;
  g.add(model);
  const ent = { o, g, n, model, sig: '', bubble: null, pop: 0, crop: null, cropSig: '', animals: [], extra: {} };
  if (o.type === 'housing') syncAnimals(ent, false);
  if (o.type === 'deco' && (o.key === 'dog' || o.key === 'cat')) spawnPet(ent);
  if (o.type === 'deco' && model.userData.light) addHalo(ent, model.userData.light.y ?? 1.2);
  if (o.type === 'fixed' && o.key === 'truck') ent.extra.truck = model.getObjectByName('truck');
  tagTree(g, o.id);
  root.add(g);
  ents.set(o.id, ent);
  slowUpdate(ent, true);
}
function removeEnt(id) {
  const e = ents.get(id);
  if (!e) return;
  root.remove(e.g);
  if (e.pet) root.remove(e.pet.m);
  ents.delete(id);
}
export const entOf = (id) => ents.get(id);

// tiny pet homes (the pet itself roams)
function makePetHome(key) {
  const g = group();
  if (key === 'dog') {
    g.add(place(box(0.6, 0.42, 0.55, '#c0392b', { r: 0.04 }), 0, 0.21, -0.05));
    const roofL = place(box(0.42, 0.06, 0.66, PAL.woodDark, { r: 0.02 }), -0.16, 0.52, -0.05); roofL.rotation.z = 0.7;
    const roofR = place(box(0.42, 0.06, 0.66, PAL.woodDark, { r: 0.02 }), 0.16, 0.52, -0.05); roofR.rotation.z = -0.7;
    g.add(roofL, roofR);
    g.add(place(box(0.24, 0.26, 0.03, '#3b2a1a', { r: 0.02 }), 0, 0.15, 0.23));
    g.add(place(cyl(0.11, 0.09, 0.06, '#9aa5ad'), 0.25, 0.03, 0.32));
  } else {
    g.add(place(cyl(0.3, 0.26, 0.12, '#8e5ea2'), 0, 0.06, 0));
    g.add(place(cyl(0.24, 0.24, 0.05, '#f3d9f7'), 0, 0.12, 0));
    g.add(place(ball(0.06, '#ff8a65'), 0.22, 0.06, 0.25));
  }
  g.add(blobShadow(0.45));
  return g;
}

// ------------------------------------------------------------------ status bubbles
const bubbleMats = {};
function bubbleMat(icon) {
  if (bubbleMats[icon]) return bubbleMats[icon];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(64, 56, 44, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(50, 92); g.lineTo(64, 118); g.lineTo(78, 92); g.fill();
  g.shadowColor = 'transparent';
  g.strokeStyle = '#f0c94b'; g.lineWidth = 5; g.beginPath(); g.arc(64, 56, 41, 0, Math.PI * 2); g.stroke();
  const ic = iconCanvas(icon);
  if (ic) g.drawImage(ic, 22, 14, 84, 84);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (bubbleMats[icon] = new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
}
function setBubble(ent, icon, height, small = false) {
  if (!icon) { if (ent.bubble) ent.bubble.visible = false; return; }
  if (!ent.bubble) {
    ent.bubble = new THREE.Sprite(bubbleMat(icon));
    ent.bubble.renderOrder = 20;
    ent.bubble.userData.objId = ent.o.id;
    ent.g.add(ent.bubble);
  }
  if (ent.bubble.userData.icon !== icon) { ent.bubble.material = bubbleMat(icon); ent.bubble.userData.icon = icon; }
  ent.bubble.visible = true;
  ent.bubble.userData.h = height;
  ent.bubble.userData.s = small ? 0.55 : 0.85;
}

// ------------------------------------------------------------------ per-object state sync (4x / second)
const modelHeight = (ent) => { const b = new THREE.Box3().setFromObject(ent.model); return b.max.y; };
function slowUpdate(ent, first = false) {
  const o = ent.o;
  if (o.type === 'plot') {
    const st = G.cropState(o);
    const sig = st ? `${o.crop.id}|${st.stage}` : '';
    if (sig !== ent.cropSig) {
      if (ent.crop) ent.model.remove(ent.crop);
      ent.crop = null;
      if (st) {
        ent.crop = bakeStatic(safe(() => { const c = Plants.makeCrop(o.crop.id, st.stage); delete c.userData.state; return c; }, o.crop.id), o.crop.id + st.stage);
        ent.crop.position.y = PLOT_TOP;
        tagTree(ent.crop, o.id);
        ent.model.add(ent.crop);
        if (!first && st.stage > 0) ent.pop = 0.6;
      }
      ent.cropSig = sig;
    }
    const wet = !!(st && !st.thirsty && !st.ready);
    if (ent.extra.wet !== wet) { ent.model.userData.setWet?.(wet); ent.extra.wet = wet; tagTree(ent.model, o.id); }
    setBubble(ent, st?.thirsty ? 'ui:water' : null, 0.9, true);
    return;
  }
  if (o.type === 'tree') {
    const st = G.treeState(o);
    if (ent.extra.ready !== st.ready || ent.extra.season !== worldState.season) {
      ent.model.userData.setFruit?.(st.ready);
      ent.model.userData.setBlossom?.(!st.ready && worldState.season === 'spring');
      ent.extra.ready = st.ready; ent.extra.season = worldState.season;
    }
    return;
  }
  if (o.type === 'building') {
    const q = G.queueState(o);
    const done = q.find((x) => x.done);
    const working = q.some((x) => !x.done && x.progress > 0);
    if (ent.model.userData.state) ent.model.userData.state.working = working;
    setBubble(ent, done ? 'item:' + G.recipeOut(done.id) : null, (ent.extra.h ||= modelHeight(ent)) + 0.5);
    return;
  }
  if (o.type === 'housing') {
    const s = G.housingSummary(o);
    const a = ANIMALS[s.key];
    let icon = null;
    if (s.ready) icon = 'item:' + a.item;
    else if (s.hungry && s.count) icon = 'item:' + a.feed;
    setBubble(ent, icon, 2.4);
    if (ent.animals.length !== o.animals.length) syncAnimals(ent, false);
    o.animals.forEach((x, i) => { const m = ent.animals[i]; if (m) m.ready = G.animalState(x, s.key).ready; });
    return;
  }
  if (o.type === 'fixed') {
    if (o.key === 'market') {
      ent.model.userData.setSlots?.(G.S.market.slots.map((s) => (s ? itemColor(s.id) : null)));
      setBubble(ent, G.S.market.slots.some((s) => s && s.sold) ? 'ui:coin' : null, 2.6);
    } else if (o.key === 'board') {
      setBubble(ent, G.S.orders.some(G.canFulfill) ? 'ui:check' : null, 2.3);
    } else if (o.key === 'dock') {
      setBubble(ent, G.S.barge.state === 'docked' ? 'ui:boat' : null, 1.8);
    } else if (o.key === 'pier') {
      setBubble(ent, G.S.level >= 3 ? 'ui:fishing' : null, 1.6, true);
    } else if (o.key === 'house') {
      setBubble(ent, G.S.daily.pending ? 'ui:gift' : null, 3.2);
    }
    return;
  }
  if (o.type === 'deco' && o.key === 'sprinkler' && ent.model.userData.state) {
    ent.model.userData.state.on = G.S.objects.some((p) => p.type === 'plot' && p.crop && Math.abs(p.x - o.x) <= 1 && Math.abs(p.y - o.y) <= 1 && G.cropState(p)?.progress < 0.15);
  }
}
function itemColor(id) {
  const c = CROPS[id];
  if (c) return c.look.fruit;
  const l = ITEMS[id]?.look;
  return l?.color || '#d7a86e';
}

// ------------------------------------------------------------------ housing animals
function syncAnimals(ent, announce) {
  const h = ent.o;
  const key = HOUSINGS[h.key].animal;
  const yard = ent.model.userData.yard || { x0: -1.6, z0: -0.2, x1: 1.6, z1: 1.6 };
  while (ent.animals.length < h.animals.length) {
    const i = ent.animals.length;
    const m = safe(() => Animals.makeAnimal(key), key);
    let x, z;
    if (key === 'bee') {
      // hives stand in a tidy grid
      const cols = 3, gx = i % cols, gz = Math.floor(i / cols);
      x = yard.x0 + (gx + 0.5) * (yard.x1 - yard.x0) / cols;
      z = yard.z0 + (gz + 0.5) * (yard.z1 - yard.z0) / 3;
    } else {
      x = yard.x0 + Math.random() * (yard.x1 - yard.x0);
      z = yard.z0 + Math.random() * (yard.z1 - yard.z0);
    }
    m.position.set(x, 0, z);
    m.rotation.y = Math.random() * 6.28;
    tagTree(m, h.id);
    m.userData.animalIndex = i;
    ent.model.add(m);
    ent.animals.push({ m, x, z, tx: x, tz: z, wait: Math.random() * 3, eat: false, still: key === 'bee', ready: false });
    if (announce) { m.scale.setScalar(0.01); ent.animals[i].grow = 0; }
  }
  while (ent.animals.length > h.animals.length) ent.model.remove(ent.animals.pop().m);
}
function updateAnimals(ent, dt) {
  const yard = ent.model.userData.yard || { x0: -1.6, z0: -0.2, x1: 1.6, z1: 1.6 };
  for (const a of ent.animals) {
    const st = a.m.userData.state;
    if (a.grow !== undefined) { a.grow = Math.min(1, a.grow + dt * 2.5); a.m.scale.setScalar(easeOutBack(a.grow)); if (a.grow >= 1) delete a.grow; }
    if (st) st.ready = a.ready;
    if (a.still) continue;
    if (a.wait > 0) {
      a.wait -= dt;
      if (st) { st.moving = false; st.eating = a.eat; }
      if (a.wait <= 0) {
        a.tx = yard.x0 + Math.random() * (yard.x1 - yard.x0);
        a.tz = yard.z0 + Math.random() * (yard.z1 - yard.z0);
      }
      continue;
    }
    const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { a.wait = 1 + Math.random() * 4; a.eat = Math.random() < 0.5; continue; }
    const sp = 0.45 * dt;
    a.x += (dx / d) * Math.min(sp, d); a.z += (dz / d) * Math.min(sp, d);
    a.m.position.set(a.x, 0, a.z);
    const want = Math.atan2(dx, dz);
    a.m.rotation.y = lerpAngle(a.m.rotation.y, want, Math.min(1, dt * 8));
    if (st) { st.moving = true; st.eating = false; }
  }
}
export function animalAtHit(obj) {
  // walk up from a raycast hit to find an animal model inside a housing
  let o = obj;
  while (o && o.userData.animalIndex === undefined) o = o.parent;
  return o ? o.userData.animalIndex : null;
}
export function animalPopped(hId, idx) {
  const e = ents.get(hId); const a = e?.animals[idx];
  if (a && a.m.userData.state) { a.m.userData.state.happy = true; setTimeout(() => { if (a.m.userData.state) a.m.userData.state.happy = false; }, 900); }
}

// ------------------------------------------------------------------ pets
function spawnPet(ent) {
  const key = ent.o.key;
  const m = safe(() => Animals.makeAnimal(key), key);
  const x = ent.o.x + 0.5, z = ent.o.y + 1.2;
  m.position.set(x, 0, z);
  tagTree(m, ent.o.id);
  root.add(m);
  ent.pet = { m, x, z, tx: x, tz: z, wait: 1 };
}
function updatePet(ent, dt) {
  const p = ent.pet; if (!p) return;
  const st = p.m.userData.state;
  if (p.wait > 0) {
    p.wait -= dt; if (st) st.moving = false;
    if (p.wait <= 0) {
      const b = G.bounds();
      for (let t = 0; t < 8; t++) {
        const tx = Math.max(b.x0 + 0.5, Math.min(b.x1 - 0.5, p.x + (Math.random() - 0.5) * 7));
        const tz = Math.max(b.y0 + 0.5, Math.min(b.y1 - 0.5, p.z + (Math.random() - 0.5) * 7));
        if (clearLine(p.x, p.z, tx, tz, ent.o.id)) { p.tx = tx; p.tz = tz; break; }
      }
    }
  } else {
    const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { p.wait = 2 + Math.random() * 5; }
    else {
      const sp = (ent.o.key === 'dog' ? 1.1 : 0.7) * dt;
      p.x += (dx / d) * Math.min(sp, d); p.z += (dz / d) * Math.min(sp, d);
      p.m.rotation.y = lerpAngle(p.m.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 8));
      if (st) st.moving = true;
    }
  }
  p.m.position.set(p.x, 0, p.z);
  // dog's daily find shows a bubble over the dog
  if (ent.o.key === 'dog') {
    const f = G.S.pets.dogFind;
    const icon = f ? (f.id === 'coins' ? 'ui:coin' : f.id === 'gems' ? 'ui:gem' : 'item:' + f.id) : null;
    if (!ent.petBubble && icon) { ent.petBubble = new THREE.Sprite(bubbleMat(icon)); ent.petBubble.renderOrder = 20; ent.petBubble.userData.objId = ent.o.id; p.m.add(ent.petBubble); }
    if (ent.petBubble) {
      ent.petBubble.visible = !!icon;
      if (icon) { ent.petBubble.material = bubbleMat(icon); ent.petBubble.position.y = 1 + Math.sin(U.uTime.value * 3) * 0.06; ent.petBubble.scale.setScalar(0.6); }
    }
  }
}
function clearLine(x0, z0, x1, z1, selfId) {
  const steps = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 2);
  for (let i = 1; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps, z = z0 + ((z1 - z0) * i) / steps;
    const o = G.objAt(Math.floor(x), Math.floor(z));
    if (o && o.id !== selfId && !(o.type === 'deco' && DECOS[o.key]?.flat) && o.type !== 'plot') return false;
  }
  return true;
}

// ------------------------------------------------------------------ lamp halos
let haloTex = null;
function addHalo(ent, y) {
  if (!haloTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,230,160,0.9)'); gr.addColorStop(0.4, 'rgba(255,200,110,0.35)'); gr.addColorStop(1, 'rgba(255,190,90,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    haloTex = new THREE.CanvasTexture(c);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  s.position.y = y; s.scale.setScalar(2.2);
  s.raycast = () => {};
  ent.g.add(s);
  ent.halo = s;
  // warm light pool on the ground
  const pool = mesh(GEO.circle(1.3), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }), { shadow: false, receive: false });
  pool.position.y = 0.03; pool.raycast = () => {};
  ent.g.add(pool);
  ent.pool = pool;
}

// ------------------------------------------------------------------ visitors (walk in from the road)
const visitors = new Map();
const ROAD_X = (WORLD.road.x0 + WORLD.road.x1) / 2;
function visitorSpot(i) { const b = G.bounds(); return { x: b.x1 + 1.3 + i * 1.15, z: 22.4 }; }
function makeNpc(npc) {
  const spec = Animals.VILLAGERS?.[npc] || Animals.VILLAGERS?.[0];
  return safe(() => Animals.makeVillager(spec), 'villager');
}
function syncVisitors() {
  const list = G.S.visitors;
  list.forEach((v, i) => {
    let e = visitors.get(v.id);
    if (!e) {
      const m = makeNpc(v.npc);
      m.userData.visitorId = v.id;
      m.traverse((c) => { c.userData.visitorId = v.id; });
      const fresh = G.now() - v.arrivedAt < 5000;
      const spot = visitorSpot(i);
      const path = fresh ? [{ x: ROAD_X, z: -6 }, { x: ROAD_X, z: 23.5 }, spot] : [spot];
      m.position.set(path[0].x, 0, path[0].z);
      root.add(m);
      e = { m, path, spot, bubble: null, leaving: false };
      visitors.set(v.id, e);
    }
    const s = visitorSpot(i);
    if (!e.leaving && (e.spot.x !== s.x)) { e.spot = s; if (!e.path.length) e.path = [s]; }
  });
}
function visitorLeave(id, happy) {
  const e = visitors.get(id);
  if (!e) return;
  e.leaving = true;
  if (e.bubble) e.bubble.visible = false;
  if (happy) { burst('hearts', e.m.position.x, e.m.position.z, { y: 1 }); if (e.m.userData.state) e.m.userData.state.wave = true; }
  e.path = [{ x: ROAD_X, z: 23.5 }, { x: ROAD_X, z: MAP + 8 }];
  e.delay = happy ? 1.2 : 0.3;
}
function dropVisitor(id) { const e = visitors.get(id); if (e) { root.remove(e.m); visitors.delete(id); } }
function updateWalker(e, dt, speed = 2) {
  const st = e.m.userData.state;
  if (e.delay > 0) { e.delay -= dt; if (st) st.moving = false; return false; }
  if (st && e.leaving) st.wave = false;
  const t = e.path[0];
  if (!t) { if (st) st.moving = false; return true; }
  const p = e.m.position, dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
  if (d < 0.05) { e.path.shift(); return !e.path.length; }
  const sp = speed * dt;
  p.x += (dx / d) * Math.min(sp, d); p.z += (dz / d) * Math.min(sp, d);
  e.m.rotation.y = lerpAngle(e.m.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10));
  if (st) st.moving = true;
  return false;
}
function updateVisitors(dt) {
  for (const [id, e] of visitors) {
    const arrived = updateWalker(e, dt, 2.4);
    if (e.leaving) { if (arrived) dropVisitor(id); continue; }
    if (arrived) {
      e.m.rotation.y = lerpAngle(e.m.rotation.y, -Math.PI / 2 - 0.4, Math.min(1, dt * 4));
      if (!e.bubble) { e.bubble = new THREE.Sprite(bubbleMat('ui:visitor')); e.bubble.renderOrder = 20; e.bubble.userData.visitorId = id; e.m.add(e.bubble); e.bubble.scale.setScalar(0.65); }
      e.bubble.visible = true;
      e.bubble.position.y = 1.35 + Math.sin(U.uTime.value * 3 + id) * 0.05;
    }
  }
}

// shoppers walk to the market stall after a sale
const shoppers = [];
function spawnShopper() {
  const f = WORLD.fixed.find((x) => x.key === 'market');
  const m = makeNpc(Math.floor(Math.random() * 12));
  m.position.set(ROAD_X, 0, -4);
  root.add(m);
  shoppers.push({ m, path: [{ x: ROAD_X, z: f.y + 3.6 }, { x: f.x + 1.5, z: f.y + 3.5 }, { x: ROAD_X, z: f.y + 4 }, { x: ROAD_X, z: MAP + 8 }], delay: 0, leaving: false, stop: 1 });
}
function updateShoppers(dt) {
  for (let i = shoppers.length - 1; i >= 0; i--) {
    const s = shoppers[i];
    const before = s.path.length;
    const done = updateWalker(s, dt, 2.6);
    if (before === 3 && s.path.length === 2 && s.stop) { s.delay = 1.5; s.stop = 0; burst('sparkle', s.m.position.x, s.m.position.z); }
    if (done) { root.remove(s.m); shoppers.splice(i, 1); }
  }
}

// ------------------------------------------------------------------ delivery truck
let truckAnim = null;
function truckGo() {
  const e = [...ents.values()].find((x) => x.o.type === 'fixed' && x.o.key === 'truck');
  const t = e?.extra.truck;
  if (!t || truckAnim) return;
  const home = { p: t.position.clone(), r: t.rotation.y };
  // local coords of the parking pad: road is to the west (−x)
  const roadLocal = ROAD_X - (e.o.x + e.n / 2);
  truckAnim = { t, home, time: 0, path: [{ x: home.p.x, z: home.p.z - 0.2 }, { x: roadLocal, z: home.p.z - 0.6 }, { x: roadLocal, z: -40 }], back: false, wait: 0 };
  burst('puff', e.o.x + 1.5, e.o.y + 1.5);
}
function updateTruck(dt) {
  const a = truckAnim; if (!a) return;
  if (a.wait > 0) { a.wait -= dt; if (a.wait <= 0) { a.t.visible = true; } return; }
  const target = a.path[0];
  if (!target) {
    if (!a.back) { a.back = true; a.wait = 6; a.t.visible = false; a.path = [{ x: a.path0x ?? a.t.position.x, z: a.home.p.z - 0.6 }, { x: a.home.p.x, z: a.home.p.z }]; return; }
    a.t.position.copy(a.home.p); a.t.rotation.y = a.home.r; truckAnim = null; return;
  }
  const p = a.t.position, dx = target.x - p.x, dz = target.z - p.z, d = Math.hypot(dx, dz);
  if (d < 0.05) { a.path.shift(); return; }
  const sp = (a.back ? 5 : 6) * dt * Math.min(1, 0.4 + a.time);
  a.time += dt;
  p.x += (dx / d) * Math.min(sp, d); p.z += (dz / d) * Math.min(sp, d);
  const want = a.back && a.path.length === 1 ? a.home.r : Math.atan2(dx, dz);
  a.t.rotation.y = lerpAngle(a.t.rotation.y, want, Math.min(1, dt * 5));
  if (Math.random() < 0.3) { const w = a.t.getWorldPosition(new THREE.Vector3()); burst('smoke', w.x, w.z, { y: 0.4, color: '#dddddd' }); }
}

// ------------------------------------------------------------------ barge
let barge = null, bargeAnim = null;
const DOCK = WORLD.fixed.find((f) => f.key === 'dock');
const BARGE_POS = { x: DOCK.x + 1.5, z: (WORLD.river.y0 + WORLD.river.y1) / 2 };
function ensureBarge() {
  if (barge) return barge;
  barge = safe(() => Buildings.makeBarge(), 'barge');
  barge.traverse((c) => { c.userData.special = 'barge'; });
  root.add(barge);
  return barge;
}
function bargeArrive(instant = false) {
  const b = ensureBarge();
  b.visible = true;
  bargeAnim = { from: instant ? BARGE_POS.x : -12, to: BARGE_POS.x, t: instant ? 1 : 0, dur: 7 };
  b.position.set(bargeAnim.from, 0, BARGE_POS.z);
}
function bargeLeave(instant = false) {
  if (!barge) return;
  if (instant) { barge.visible = false; bargeAnim = null; return; }
  bargeAnim = { from: barge.position.x, to: MAP + 14, t: 0, dur: 8, hide: true };
}
function updateBarge(dt) {
  if (!barge) return;
  if (bargeAnim) {
    bargeAnim.t = Math.min(1, bargeAnim.t + dt / bargeAnim.dur);
    const k = bargeAnim.hide ? bargeAnim.t * bargeAnim.t : 1 - Math.pow(1 - bargeAnim.t, 3);
    barge.position.x = bargeAnim.from + (bargeAnim.to - bargeAnim.from) * k;
    if (bargeAnim.t >= 1) { if (bargeAnim.hide) barge.visible = false; bargeAnim = null; }
  }
  if (barge.visible && G.S.barge.state === 'docked') barge.userData.setCrates?.(G.S.barge.crates.map((c) => c.filled));
}

// ------------------------------------------------------------------ expansion sign
let sign = null;
function placeExpansionSign() {
  if (sign) { root.remove(sign); sign = null; }
  const nx = G.nextExpansion(); if (!nx) return;
  const b = G.bounds();
  let x, z;
  if (nx.x0 < b.x0) { x = b.x0 - 1.2; z = (b.y0 + b.y1) / 2; }
  else if (nx.y0 < b.y0) { x = (b.x0 + b.x1) / 2; z = b.y0 - 1.2; }
  else if (nx.x1 > b.x1) { x = b.x1 + 1.2; z = b.y0 + 3; }
  else { x = (b.x0 + b.x1) / 2; z = b.y1 + 1.2; }
  sign = safe(() => Buildings.makeExpansionSign(), 'sign');
  sign.position.set(x, 0, z);
  sign.traverse((c) => { c.userData.special = 'expand'; });
  sign.userData.nx = nx;
  root.add(sign);
}
export const expansionSign = () => sign;

// ------------------------------------------------------------------ ambient life
const butterflies = [], birds = [];
let fireflies;
function initAmbient() {
  const colors = ['#ffd54f', '#f48fb1', '#90caf9', '#ffffff', '#ffab40', '#ce93d8'];
  for (let i = 0; i < 9; i++) {
    const m = safe(() => Animals.makeButterfly(colors[i % colors.length]), 'butterfly');
    m.traverse((c) => { c.raycast = () => {}; });
    m.position.set(22 + Math.random() * 10, 0.8, 20 + Math.random() * 10);
    scene.add(m);
    butterflies.push({ m, ph: Math.random() * 10, cx: m.position.x, cz: m.position.z });
  }
  for (let i = 0; i < 4; i++) {
    const m = safe(() => Animals.makeBird(), 'bird');
    m.traverse((c) => { c.raycast = () => {}; });
    m.visible = false;
    scene.add(m);
    birds.push({ m, t: -Math.random() * 30 });
  }
  const n = 120, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pos.set([10 + Math.random() * 36, 0.3 + Math.random() * 1.5, 8 + Math.random() * 36], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const x = c.getContext('2d'); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,180,1)'); gr.addColorStop(1, 'rgba(255,240,120,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  fireflies = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.25, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  fireflies.raycast = () => {};
  scene.add(fireflies);
}
function updateAmbient(t, dt) {
  const warm = worldState.season !== 'winter';
  const day = 1 - worldState.night;
  for (const b of butterflies) {
    b.m.visible = warm && day > 0.5;
    if (!b.m.visible) continue;
    b.ph += dt;
    const r = 1.6;
    b.m.position.set(b.cx + Math.sin(b.ph * 0.7) * r + Math.sin(b.ph * 2.1) * 0.3, 0.7 + Math.sin(b.ph * 3) * 0.25 + Math.sin(b.ph * 0.5) * 0.2, b.cz + Math.cos(b.ph * 0.5) * r);
    b.m.rotation.y = b.ph * 0.7 + Math.PI / 2;
    if (Math.random() < dt * 0.05) { const bb = G.bounds(); b.cx = bb.x0 + Math.random() * (bb.x1 - bb.x0); b.cz = bb.y0 + Math.random() * (bb.y1 - bb.y0); }
  }
  for (const b of birds) {
    b.t += dt;
    if (b.t < 0) { b.m.visible = false; continue; }
    if (!b.path) { const z = 5 + Math.random() * 40; b.path = { x0: -8, z0: z, x1: MAP + 8, z1: z + (Math.random() - 0.5) * 20, h: 4 + Math.random() * 3 }; }
    const k = b.t / 14;
    if (k >= 1) { b.t = -10 - Math.random() * 40; b.path = null; continue; }
    b.m.visible = day > 0.3;
    b.m.position.set(b.path.x0 + (b.path.x1 - b.path.x0) * k, b.path.h + Math.sin(b.t * 2) * 0.2, b.path.z0 + (b.path.z1 - b.path.z0) * k);
    b.m.rotation.y = Math.atan2(b.path.x1 - b.path.x0, b.path.z1 - b.path.z0);
  }
  fireflies.material.opacity = warm ? worldState.night * (0.6 + 0.4 * Math.sin(t * 3)) : 0;
  fireflies.visible = fireflies.material.opacity > 0.02;
  if (fireflies.visible) { fireflies.position.y = Math.sin(t * 0.7) * 0.2; fireflies.position.x = Math.sin(t * 0.3) * 0.3; }
}

// ------------------------------------------------------------------ placement ghost / grid / hover
let ghost = null, ghostKey = '', footprint, grid, hoverRing;
const ghostMats = new Map();
function initGhost() {
  footprint = mesh(GEO.plane(1, 1), new THREE.MeshBasicMaterial({ color: 0x66ff66, transparent: true, opacity: 0.35, depthWrite: false }), { shadow: false, receive: false });
  footprint.position.y = 0.03; footprint.visible = false; footprint.raycast = () => {};
  footprint.material.depthTest = false; footprint.material.opacity = 0.42; footprint.renderOrder = 15;
  overlay.add(footprint);
  hoverRing = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.54, 4, 1).rotateX(-Math.PI / 2).rotateY(Math.PI / 4), new THREE.MeshBasicMaterial({ color: 0xfff176, transparent: true, opacity: 0.85, depthWrite: false }));
  hoverRing.visible = false; hoverRing.raycast = () => {};
  overlay.add(hoverRing);
}
function ghostModel(spec) {
  const o = { type: spec.kind, key: spec.key, level: 1, rot: 0, seed: 7, animals: [], queue: [], x: 0, y: 0 };
  if (spec.moving) Object.assign(o, spec.moving);
  const m = spec.kind === 'deco' && (spec.key === 'dog' || spec.key === 'cat') ? makePetHome(spec.key) : buildModel(o);
  m.traverse((c) => {
    if (!c.isMesh && !c.isSprite) return;
    c.castShadow = false; c.raycast = () => {};
    const src = c.material;
    if (!ghostMats.has(src)) { const gm = src.clone(); gm.transparent = true; gm.opacity = 0.62; gm.depthWrite = false; ghostMats.set(src, gm); }
    c.material = ghostMats.get(src);
  });
  return m;
}
/** spec: null | { kind, key, x, y, size, rot, ok, moving } */
export function setGhost(spec) {
  if (!spec) {
    if (ghost) { overlay.remove(ghost); ghost = null; ghostKey = ''; }
    footprint.visible = false; return;
  }
  const k = spec.kind + spec.key + (spec.moving ? 'm' + spec.moving.id : '');
  if (k !== ghostKey) {
    if (ghost) overlay.remove(ghost);
    ghost = ghostModel(spec); ghostKey = k;
    overlay.add(ghost);
  }
  const n = spec.size;
  ghost.position.set(spec.x + n / 2, 0.02, spec.y + n / 2);
  ghost.rotation.y = -(spec.rot || 0) * Math.PI / 2;
  footprint.visible = true;
  footprint.scale.set(n, 1, n);
  footprint.position.set(spec.x + n / 2, 0.03, spec.y + n / 2);
  footprint.material.color.set(spec.ok ? 0x66ff66 : 0xff5252);
}
export function showGrid(on) {
  if (!on) { if (grid) grid.visible = false; return; }
  const b = G.bounds();
  const key = `${b.x0},${b.y0},${b.x1},${b.y1}`;
  if (!grid || grid.userData.key !== key) {
    if (grid) overlay.remove(grid);
    const pts = [];
    for (let x = b.x0; x <= b.x1; x++) pts.push(x, 0.025, b.y0, x, 0.025, b.y1);
    for (let y = b.y0; y <= b.y1; y++) pts.push(b.x0, 0.025, y, b.x1, 0.025, y);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    grid = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }));
    grid.userData.key = key; grid.raycast = () => {};
    overlay.add(grid);
  }
  grid.visible = true;
}
export function setHover(o) {
  if (!o) { hoverRing.visible = false; worldState.hoverId = null; return; }
  const n = G.sizeOf(o);
  hoverRing.visible = true;
  hoverRing.scale.set(n * 1.414, 1, n * 1.414);
  hoverRing.position.set(o.x + n / 2, 0.035, o.y + n / 2);
  worldState.hoverId = o.id;
}

// ------------------------------------------------------------------ picking
const hits = [];
/** Returns { obj, special, visitorId, animalIndex } for the screen point. */
export function pickAt(sx, sy) {
  const ray = setRay(sx, sy);
  hits.length = 0;
  ray.intersectObject(root, true, hits);
  for (const h of hits) {
    const u = h.object.userData;
    if (u.visitorId) return { visitorId: u.visitorId };
    if (u.special) return { special: u.special };
    if (u.objId) {
      const o = G.getObj(u.objId);
      if (!o) continue;
      // flat things: trust the ground tile instead (more precise when dragging over fields)
      if (o.type === 'plot' || (o.type === 'deco' && DECOS[o.key]?.flat)) break;
      return { obj: o, animalIndex: o.type === 'housing' ? animalAtHit(h.object) : null };
    }
  }
  const p = screenToGround(sx, sy);
  if (!p) return {};
  const tile = { x: Math.floor(p.x), y: Math.floor(p.z) };
  return { obj: G.objAt(tile.x, tile.y), tile };
}
export function tileAt(sx, sy) { const p = screenToGround(sx, sy); return p ? { x: Math.floor(p.x), y: Math.floor(p.z) } : null; }

// ------------------------------------------------------------------ fx hook: particles + object bounce
function onFx(e) {
  burst(e.type, e.x, e.y, { color: e.color });
  const o = G.objAt(Math.floor(e.x), Math.floor(e.y));
  const ent = o && ents.get(o.id);
  if (ent) ent.pop = 1;
  if (e.animal) animalPopped(e.animal.h, e.animal.idx);
}

// ------------------------------------------------------------------ frame update
let slowT = 0, slowIdx = 0;
export function updateWorld(t, dt, env) {
  worldState.night = env.night;
  worldState.season = env.season;
  // stagger state sync over frames
  slowT += dt;
  const list = [...ents.values()];
  if (slowT > 0.05 && list.length) {
    slowT = 0;
    const per = Math.max(8, Math.ceil(list.length / 5));
    for (let i = 0; i < per; i++) slowUpdate(list[(slowIdx + i) % list.length]);
    slowIdx = (slowIdx + per) % list.length;
    syncVisitors();
  }
  for (const ent of list) {
    const ud = ent.model.userData;
    if (ud.anim) ud.anim(t, dt);
    if (ent.crop?.userData.anim) ent.crop.userData.anim(t, dt);
    if (ent.animals.length) { updateAnimals(ent, dt); for (const a of ent.animals) a.m.userData.anim?.(t, dt); }
    if (ent.pet) { updatePet(ent, dt); ent.pet.m.userData.anim?.(t, dt); }
    if (ent.pop > 0) {
      ent.pop = Math.max(0, ent.pop - dt * 3.2);
      const k = ent.pop;
      ent.model.scale.set(1 + Math.sin(k * Math.PI) * 0.12, 1 - Math.sin(k * Math.PI * 2) * 0.08, 1 + Math.sin(k * Math.PI) * 0.12);
    }
    if (ent.bubble?.visible) {
      const s = ent.bubble.userData.s;
      ent.bubble.position.y = ent.bubble.userData.h + Math.sin(t * 3 + ent.o.id) * 0.07;
      ent.bubble.scale.setScalar(s * (worldState.hoverId === ent.o.id ? 1.15 : 1));
    }
    if (ent.halo) { ent.halo.material.opacity = env.night * 0.9; ent.pool.material.opacity = env.night * 0.5; }
  }
  for (const [, e] of visitors) e.m.userData.anim?.(t, dt);
  for (const s of shoppers) s.m.userData.anim?.(t, dt);
  updateVisitors(dt);
  updateShoppers(dt);
  updateTruck(dt);
  updateBarge(dt);
  if (barge?.visible) barge.userData.anim?.(t, dt);
  if (sign) { sign.userData.anim?.(t, dt); sign.position.y = 0; }
  updateAmbient(t, dt);
  if (ghost) ghost.userData.anim?.(t, dt);
}

// ------------------------------------------------------------------ utils
function lerpAngle(a, b, k) { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * k; }
function easeOutBack(x) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
export function worldPosOf(o) { const n = G.sizeOf(o); return { x: o.x + n / 2, z: o.y + n / 2 }; }
export function visitorScreenAnchor(id) { const e = visitors.get(id); return e ? e.m.position : null; }
export { cam };
