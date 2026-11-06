// Core game state: event bus, persistence, occupancy grid, inventory, currencies and XP.
import {
  SAVE_KEY, MAP, MAX_LEVEL, CROPS, TREES, TREE_SIZE, BUILDINGS, HOUSINGS, DECOS, FIXED, OBSTACLES,
  EXPANSIONS, STORAGE_BASE, STORAGE_STEP, ITEMS, WORLD,
} from '../data/content.js';
import { xpToNext } from '../data/progression.js';

// ------------------------------------------------------------------ event bus
// Events: toast, reward, fx, sfx, levelup, change, questDone, expand, truck, barge, visitor, objAdded, objRemoved
export const bus = {
  h: {},
  on(e, f) { (this.h[e] ||= []).push(f); },
  emit(e, a) { (this.h[e] || []).forEach((f) => f(a)); },
};

export let S = null;
export const now = () => Date.now();
export const rnd = (a, b) => a + Math.random() * (b - a);
export const irnd = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const fail = (msg) => { bus.emit('toast', { text: msg, kind: 'bad' }); bus.emit('sfx', 'error'); return false; };
export const changed = () => bus.emit('change');
export const fx = (type, obj, extra = {}) => bus.emit('fx', { type, x: obj.x + sizeOf(obj) / 2, y: obj.y + sizeOf(obj) / 2, ...extra });

// ------------------------------------------------------------------ object helpers
export function sizeOf(o) {
  switch (o.type) {
    case 'building': return BUILDINGS[o.key].size;
    case 'housing': return HOUSINGS[o.key].size;
    case 'fixed': return FIXED[o.key].size;
    case 'deco': return DECOS[o.key].size || 1;
    case 'tree': return TREE_SIZE;
    case 'obstacle': return OBSTACLES[o.key].size;
    default: return 1;
  }
}
export function defOf(o) {
  return ({ building: BUILDINGS, housing: HOUSINGS, fixed: FIXED, deco: DECOS, tree: TREES, obstacle: OBSTACLES })[o.type]?.[o.key];
}
export function objName(o) {
  if (o.type === 'plot') return o.crop ? CROPS[o.crop.id].name : 'Szántóföld';
  return defOf(o)?.name || '?';
}

// ------------------------------------------------------------------ persistence
export function setState(s) { S = s; rebuildOcc(); }
export function save() {
  if (!S) return;
  S.lastSeen = now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch { /* storage unavailable */ }
}
export function readSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }

// ------------------------------------------------------------------ grid
let occ = new Int32Array(MAP * MAP);
const byId = new Map();
export function rebuildOcc() {
  occ = new Int32Array(MAP * MAP); byId.clear();
  for (const o of S.objects) {
    byId.set(o.id, o);
    const n = sizeOf(o);
    for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) {
      const x = o.x + dx, y = o.y + dy;
      if (x >= 0 && y >= 0 && x < MAP && y < MAP) occ[y * MAP + x] = o.id;
    }
  }
}
export function addObj(o, quiet = false) {
  o.id = S.nextId++;
  S.objects.push(o);
  rebuildOcc();
  if (!quiet) bus.emit('objAdded', o);
  return o;
}
export function delObj(o) {
  S.objects = S.objects.filter((x) => x !== o);
  rebuildOcc();
  bus.emit('objRemoved', o);
}
export const getObj = (id) => byId.get(id);
export function objAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP || y >= MAP) return null;
  const id = occ[y * MAP + x];
  return id ? byId.get(id) : null;
}
export const bounds = () => EXPANSIONS[S.expansion];
export function inFarm(x, y) {
  const b = bounds();
  return x >= b.x0 && y >= b.y0 && x < b.x1 && y < b.y1;
}
export function canPlace(x, y, size, ignore = null) {
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) {
    if (!inFarm(x + dx, y + dy)) return false;
    const o = objAt(x + dx, y + dy);
    if (o && o !== ignore) return false;
  }
  return true;
}
export const countOf = (type, key) => S.objects.reduce((n, o) => n + (o.type === type && o.key === key ? 1 : 0), 0);
export const objectsOf = (type, key) => S.objects.filter((o) => o.type === type && (!key || o.key === key));
export const fixedObj = (key) => S.objects.find((o) => o.type === 'fixed' && o.key === key);

// ------------------------------------------------------------------ inventory
export const capacity = () => STORAGE_BASE + STORAGE_STEP * S.storageLevel;
export const used = () => Object.values(S.inv).reduce((a, b) => a + b, 0);
export const free = () => capacity() - used();
export const has = (id, q = 1) => (S.inv[id] || 0) >= q;
export const qty = (id) => S.inv[id] || 0;
export function addItem(id, q, countStat = true) {
  if (q <= 0) return;
  S.inv[id] = (S.inv[id] || 0) + q;
  if (countStat) stat('collect_' + id, q);
}
export function takeItem(id, q) { S.inv[id] -= q; if (S.inv[id] <= 0) delete S.inv[id]; }
export function hasAll(req) { return Object.entries(req).every(([id, q]) => has(id, q)); }
export function missingOf(req) { return Object.entries(req).filter(([id, q]) => !has(id, q)).map(([id, q]) => ({ id, need: q - qty(id) })); }
export function roomFor(n) {
  if (used() + n > capacity()) return fail('Megtelt a raktár! Adj el valamit vagy bővítsd a csűrt.');
  return true;
}

// ------------------------------------------------------------------ stats / currencies / xp
export function stat(k, n = 1) { S.stats[k] = (S.stats[k] || 0) + n; }
export function addCoins(n) { S.coins += n; if (n > 0) stat('coinsEarned', n); }
export function addGems(n) { S.gems += n; }
/** Pay a cost object { coins, gems, plank, brick, ... } atomically. */
export function pay(cost = {}) {
  const { coins = 0, gems = 0, ...items } = cost;
  if (S.coins < coins) return fail('Nincs elég érméd!');
  if (S.gems < gems) return fail('Nincs elég drágaköved!');
  for (const [id, q] of Object.entries(items)) if (q > 0 && !has(id, q)) return fail(`Hiányzik: ${q - qty(id)} db ${ITEMS[id].name}`);
  S.coins -= coins; S.gems -= gems;
  for (const [id, q] of Object.entries(items)) if (q > 0) takeItem(id, q);
  return true;
}
export function canPay(cost = {}) {
  const { coins = 0, gems = 0, ...items } = cost;
  return S.coins >= coins && S.gems >= gems && Object.entries(items).every(([id, q]) => q <= 0 || has(id, q));
}
export function addXp(n) {
  if (S.level >= MAX_LEVEL || n <= 0) return;
  S.xp += n;
  while (S.level < MAX_LEVEL && S.xp >= xpToNext(S.level)) {
    S.xp -= xpToNext(S.level);
    S.level++;
    const coins = 40 * S.level, gems = S.level % 5 === 0 ? 3 : 1;
    addCoins(coins); S.gems += gems;
    bus.emit('levelup', { level: S.level, coins, gems });
    bus.emit('sfx', 'levelup');
  }
}
/** Give rewards at a world object (floating texts + fly-to-HUD). */
export function reward(obj, { coins = 0, xp = 0, gems = 0, items = null, delay = 0 } = {}) {
  if (coins) addCoins(coins);
  if (gems) S.gems += gems;
  const s = obj ? sizeOf(obj) : 1;
  bus.emit('reward', { x: obj ? obj.x + s / 2 : null, y: obj ? obj.y + s / 2 : null, coins, xp, gems, items, delay });
  if (xp) addXp(xp);
}
export function rareGem(obj, chance) {
  if (Math.random() >= chance) return;
  S.gems++;
  bus.emit('reward', { x: obj.x + sizeOf(obj) / 2, y: obj.y + sizeOf(obj) / 2, gems: 1, delay: 350 });
  bus.emit('toast', { text: 'Szerencse! Találtál egy drágakövet!', kind: 'gem' });
}
export function isLandmark(o) { return o.type === 'fixed' && WORLD.fixed.some((f) => f.key === o.key); }
