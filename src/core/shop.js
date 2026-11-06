// Shop, placement, moving, selling, storage, expansions and gem speed-ups.
import {
  TREES, BUILDINGS, HOUSINGS, DECOS, ANIMALS, CROPS, ITEMS, EXPANSIONS, storageUpgradeCost, TREE_SIZE,
} from '../data/content.js';
import {
  S, bus, now, fail, changed, fx, pay, canPay, stat, reward, addObj, delObj, canPlace, countOf, rebuildOcc,
  sizeOf, defOf, addCoins, takeItem, addItem, roomFor, capacity, bounds,
} from './state.js';
import { newTree, cropState, treeState, populateExpansion } from './farm.js';
import { animalState, queueState } from './ranch.js';

// ------------------------------------------------------------------ shop catalogue
export const SHOP_TABS = [
  { id: 'animals', name: 'Állatok', icon: 'ui:heart' },
  { id: 'buildings', name: 'Épületek', icon: 'ui:barn' },
  { id: 'trees', name: 'Fák', icon: 'item:apple' },
  { id: 'decos', name: 'Dekoráció', icon: 'ui:star' },
  { id: 'supplies', name: 'Kellékek', icon: 'item:bait' },
];
export const SUPPLIES = {
  bait: { coins: 6, qty: 5 },
  axe: { coins: 60, qty: 1 },
  pickaxe: { coins: 80, qty: 1 },
};
export function housingMax(key) {
  return HOUSINGS[key].max;
}
export function shopEntry(kind, key) {
  if (kind === 'housing') { const d = HOUSINGS[key]; return { def: d, size: d.size, cost: d.cost, gems: 0, level: d.level, max: d.max, owned: countOf('housing', key) }; }
  if (kind === 'building') { const d = BUILDINGS[key]; return { def: d, size: d.size, cost: d.cost, gems: 0, level: d.level, max: 1, owned: countOf('building', key) }; }
  if (kind === 'tree') { const d = TREES[key]; return { def: d, size: TREE_SIZE, cost: d.cost, gems: 0, level: d.level, max: Infinity, owned: countOf('tree', key) }; }
  if (kind === 'deco') { const d = DECOS[key]; return { def: d, size: d.size || 1, cost: d.cost || 0, gems: d.gems || 0, level: d.level, max: d.max || Infinity, owned: countOf('deco', key) }; }
  if (kind === 'animal') { const d = ANIMALS[key]; return { def: d, size: 0, cost: d.cost, gems: 0, level: d.level, max: Infinity, owned: S.objects.filter((o) => o.type === 'housing' && HOUSINGS[o.key].animal === key).reduce((n, h) => n + h.animals.length, 0) }; }
  return null;
}
export function canBuy(kind, key) {
  const e = shopEntry(kind, key);
  if (e.level > S.level) return { ok: false, why: `${e.level}. szinttől`, locked: true };
  if (e.owned >= e.max) return { ok: false, why: 'Elérted a maximumot' };
  if (S.coins < e.cost || S.gems < e.gems) return { ok: false, why: 'Nincs elég pénzed' };
  return { ok: true };
}
export function buyPlace(kind, key, x, y, rot = 0) {
  const e = shopEntry(kind, key);
  const c = canBuy(kind, key);
  if (!c.ok) return fail(c.why);
  if (!canPlace(x, y, e.size)) return fail('Ide nem fér el.');
  if (!pay({ coins: e.cost, gems: e.gems })) return false;
  const o = { type: kind, key, x, y, rot };
  if (kind === 'tree') Object.assign(o, newTree(key));
  if (kind === 'building') { o.queue = []; o.level = 1; }
  if (kind === 'housing') { o.animals = []; o.level = 1; }
  if (kind === 'deco') { o.seed = Math.floor(Math.random() * 9999); }
  addObj(o);
  stat('buy_' + key);
  if (kind === 'deco') stat('deco');
  if (kind === 'building' || kind === 'housing') stat('build');
  fx('build', o); bus.emit('sfx', 'build');
  reward(o, { xp: Math.max(1, Math.round((e.cost + e.gems * 100) / 40)) });
  if (kind === 'housing') bus.emit('toast', { text: `${e.def.name} kész! Vegyél bele állatot (kattints rá).`, kind: 'good' });
  changed(); return o;
}
export function buySupply(id) {
  const s = SUPPLIES[id];
  if (!roomFor(s.qty)) return false;
  if (!pay({ coins: s.coins * (id === 'bait' ? s.qty : 1) })) return false;
  addItem(id, s.qty, false);
  bus.emit('sfx', 'coin');
  bus.emit('toast', { text: `Megvetted: ${s.qty} × ${ITEMS[id].name}`, kind: 'good' });
  changed(); return true;
}

// ------------------------------------------------------------------ edit mode
export const movable = (o) => !(o.type === 'fixed' && ['board', 'truck', 'market', 'dock', 'pier'].includes(o.key)) && o.type !== 'obstacle';
export function moveObj(o, x, y, rot = o.rot || 0) {
  if (!movable(o)) return fail('Ezt nem lehet áthelyezni.');
  if (!canPlace(x, y, sizeOf(o), o)) return fail('Ide nem fér el.');
  o.x = x; o.y = y; o.rot = rot;
  rebuildOcc(); fx('build', o); bus.emit('sfx', 'place');
  bus.emit('objMoved', o); changed(); return true;
}
export function rotateObj(o) {
  if (!movable(o)) return false;
  o.rot = ((o.rot || 0) + 1) % 4;
  bus.emit('objMoved', o); bus.emit('sfx', 'place'); changed(); return true;
}
export const removable = (o) => o.type === 'plot' || o.type === 'deco' || o.type === 'tree';
export function refundOf(o) {
  if (o.type === 'deco' || o.type === 'tree') return Math.floor((defOf(o).cost || 0) * 0.5);
  return 0;
}
export function removeObj(o) {
  if (!removable(o)) return fail('Ezt nem bonthatod le.');
  const r = refundOf(o);
  delObj(o);
  if (r) addCoins(r);
  fx('dust', o); bus.emit('sfx', 'remove');
  if (r) bus.emit('reward', { x: o.x + 0.5, y: o.y + 0.5, coins: r, quiet: true });
  changed(); return true;
}

// ------------------------------------------------------------------ selling & storage
export function sellPrice(id, q) { return Math.round(ITEMS[id].sell * q); }
export function sell(id, q) {
  q = Math.min(q, S.inv[id] || 0);
  if (q <= 0) return false;
  takeItem(id, q);
  const coins = sellPrice(id, q);
  addCoins(coins); stat('sold', q); bus.emit('sfx', 'coin');
  bus.emit('toast', { text: `Eladva: ${q} × ${ITEMS[id].name} (+${coins} érme)`, kind: 'good' });
  changed(); return true;
}
export const storageCost = () => storageUpgradeCost(S.storageLevel);
export function upgradeStorage() {
  if (!pay(storageCost())) return false;
  S.storageLevel++; stat('storage'); bus.emit('sfx', 'build');
  bus.emit('toast', { text: `A csűr bővült: ${capacity()} férőhely`, kind: 'good' });
  changed(); return true;
}

// ------------------------------------------------------------------ expansions
export const nextExpansion = () => EXPANSIONS[S.expansion + 1] || null;
export function expand() {
  const nx = nextExpansion();
  if (!nx) return false;
  if (S.level < nx.level) return fail(`A bővítéshez ${nx.level}. szint kell.`);
  if (!pay({ coins: nx.coins, plank: nx.plank, brick: nx.brick })) return false;
  const prev = bounds();
  S.expansion++;
  populateExpansion(prev, nx);
  stat('expand'); bus.emit('sfx', 'levelup');
  bus.emit('expand');
  bus.emit('toast', { text: `Új földterület! A farm mérete mostantól ${nx.x1 - nx.x0}×${nx.y1 - nx.y0}.`, kind: 'good' });
  changed(); return true;
}
export const canExpand = () => { const nx = nextExpansion(); return nx && S.level >= nx.level && canPay({ coins: nx.coins, plank: nx.plank, brick: nx.brick }); };

// ------------------------------------------------------------------ gem speed-ups
export const speedCost = (sec) => Math.max(1, Math.ceil(sec / 600));
export function remainingOf(o) {
  if (o.type === 'plot') { const s = cropState(o); return s && !s.ready && !s.thirsty ? s.remaining : 0; }
  if (o.type === 'tree') { const s = treeState(o); return s.ready ? 0 : s.remaining; }
  if (o.type === 'building') { const q = queueState(o).find((x) => !x.done); return q ? q.remaining : 0; }
  if (o.type === 'housing') {
    const key = HOUSINGS[o.key].animal;
    return Math.max(0, ...o.animals.map((a) => { const s = animalState(a, key); return s.hungry || s.ready ? 0 : s.remaining; }));
  }
  return 0;
}
export function speedUp(o) {
  const rem = remainingOf(o);
  if (rem <= 0) return false;
  if (!pay({ gems: speedCost(rem) })) return false;
  const t = now();
  if (o.type === 'plot') o.crop.wateredAt = t - o.crop.dur;
  else if (o.type === 'tree') o.readyAt = t;
  else if (o.type === 'housing') { for (const a of o.animals) if (a.readyAt && a.readyAt > t) a.readyAt = t; }
  else if (o.type === 'building') {
    const i = o.queue.findIndex((q) => q.end > t);
    const shift = o.queue[i].end - t;
    for (let k = i; k < o.queue.length; k++) { o.queue[k].end -= shift; o.queue[k].start -= shift; }
  }
  stat('speedup');
  fx('sparkle', o); bus.emit('sfx', 'magic'); changed(); return true;
}
export { CROPS };
