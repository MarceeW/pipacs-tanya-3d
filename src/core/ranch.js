// Animals living in housings, and production buildings with queues + upgrades.
import {
  ANIMALS, HOUSINGS, HOUSING_MAX_LEVEL, housingCapacity, housingUpgradeCost,
  BUILDINGS, RECIPES, BUILDING_MAX_LEVEL, buildingSlots, buildingSpeed, buildingUpgradeCost, ITEMS,
} from '../data/content.js';
import {
  S, bus, now, fail, changed, fx, pay, stat, reward, rareGem, addItem, roomFor, has, takeItem, qty, objectsOf,
  missingOf,
} from './state.js';
import { clock } from './clock.js';

// ------------------------------------------------------------------ animals
export function animalState(a, key) {
  if (!a.readyAt) return { hungry: true, ready: false, progress: 0, remaining: 0 };
  const rem = (a.readyAt - now()) / 1000;
  return { hungry: false, ready: rem <= 0, remaining: Math.max(0, rem), progress: Math.min(1, 1 - rem / ANIMALS[key].time) };
}
export function housingSummary(h) {
  const key = HOUSINGS[h.key].animal;
  let ready = 0, hungry = 0, busy = 0, next = Infinity;
  for (const a of h.animals) {
    const s = animalState(a, key);
    if (s.ready) ready++; else if (s.hungry) hungry++; else { busy++; next = Math.min(next, s.remaining); }
  }
  return { key, ready, hungry, busy, next: next === Infinity ? 0 : next, cap: housingCapacity(h.level), count: h.animals.length };
}
export function housingFor(animalKey) {
  const hk = ANIMALS[animalKey].housing;
  return objectsOf('housing', hk).find((h) => h.animals.length < housingCapacity(h.level)) || null;
}
export function buyAnimal(animalKey) {
  const a = ANIMALS[animalKey];
  if (a.level > S.level) return fail(`${a.name}: ${a.level}. szinttől.`);
  const hk = a.housing;
  if (!objectsOf('housing', hk).length) return fail(`Ehhez kell egy épület: ${HOUSINGS[hk].name}. Építsd meg a boltban!`);
  const h = housingFor(animalKey);
  if (!h) return fail(`Nincs több hely (${HOUSINGS[hk].name}). Bővítsd az épületet, vagy építs újat!`);
  if (!pay({ coins: a.cost })) return false;
  h.animals.push({ readyAt: null, happyDay: -1 });
  stat('buy_' + animalKey); stat('animals');
  fx('hearts', h); bus.emit('sfx', 'animal_' + animalKey);
  reward(h, { xp: Math.max(2, Math.round(a.cost / 30)) });
  bus.emit('animalAdded', { h });
  changed(); return h;
}
/** Feed every hungry animal in the housing as far as feed allows. */
export function feedHousing(h) {
  const key = HOUSINGS[h.key].animal, a = ANIMALS[key];
  const hungry = h.animals.filter((x) => animalState(x, key).hungry);
  if (!hungry.length) return false;
  const can = Math.min(hungry.length, qty(a.feed));
  if (!can) return fail(`Nincs ${ITEMS[a.feed].name.toLowerCase()}! ${a.feed === 'sunflower' ? 'Termessz napraforgót.' : 'Készíts a takarmánykeverőben.'}`);
  for (let i = 0; i < can; i++) { hungry[i].readyAt = now() + a.time * 1000; }
  takeItem(a.feed, can);
  stat('feed', can); stat('feed_' + key, can);
  fx('feed', h); bus.emit('sfx', 'feed');
  if (can < hungry.length) bus.emit('toast', { text: `Csak ${can} állatra volt elég takarmány.`, kind: 'warn' });
  changed(); return true;
}
export function collectHousing(h) {
  const key = HOUSINGS[h.key].animal, a = ANIMALS[key];
  const ready = h.animals.filter((x) => animalState(x, key).ready);
  if (!ready.length) return false;
  const day = clock().day;
  let n = 0, got = 0;
  for (const x of ready) {
    const k = x.happyDay === day && Math.random() < 0.35 ? 2 : 1;
    if (!roomFor(n + k)) break;
    n += k; got++;
    x.readyAt = null;
  }
  if (!n) return false;
  addItem(a.item, n);
  stat('collect_animal', n);
  fx('harvest', h, { color: '#fff8e1', item: a.item }); bus.emit('sfx', 'collect');
  reward(h, { xp: ITEMS[a.item].xp * n, items: { [a.item]: n } });
  rareGem(h, 0.015 * got);
  changed(); return true;
}
export function petAnimal(h, idx) {
  const x = h.animals[idx];
  if (!x) return false;
  const day = clock().day;
  if (x.happyDay === day) return false;
  x.happyDay = day;
  stat('pet');
  bus.emit('fx', { type: 'hearts', x: h.x + 2, y: h.y + 2, animal: { h: h.id, idx } });
  bus.emit('sfx', 'animal_' + HOUSINGS[h.key].animal);
  reward(h, { xp: 1 });
  changed(); return true;
}
export function upgradeHousing(h) {
  const d = HOUSINGS[h.key];
  if (h.level >= HOUSING_MAX_LEVEL) return fail('Ez már a legnagyobb szint.');
  if (!pay(housingUpgradeCost(d, h.level))) return false;
  h.level++; stat('upgrade');
  fx('build', h); bus.emit('sfx', 'build');
  bus.emit('toast', { text: `${d.name} bővítve: ${housingCapacity(h.level)} férőhely`, kind: 'good' });
  reward(h, { xp: 10 * h.level });
  bus.emit('objChanged', h); changed(); return true;
}

// ------------------------------------------------------------------ production buildings
export function queueState(b) {
  const t = now();
  return b.queue.map((q) => ({ ...q, done: t >= q.end, remaining: Math.max(0, (q.end - t) / 1000), progress: Math.min(1, Math.max(0, (t - q.start) / (q.end - q.start))) }));
}
export const slotsOf = (b) => buildingSlots(b.level || 1);
export const recipeTime = (b, rid) => Math.round(RECIPES[rid].time * buildingSpeed(b.level || 1));
export const recipeOut = (rid) => RECIPES[rid].out || rid;
export const recipeQty = (rid) => RECIPES[rid].qty || 1;
export function recipesOf(key) { return Object.entries(RECIPES).filter(([, r]) => r.building === key).map(([id, r]) => ({ id, ...r })); }
export function canStart(b, rid) {
  const r = RECIPES[rid];
  if (r.level > S.level) return { ok: false, why: `${r.level}. szinttől` };
  if (b.queue.length >= slotsOf(b)) return { ok: false, why: 'A gyártósor megtelt' };
  const miss = missingOf(r.in);
  if (miss.length) return { ok: false, why: 'Hiányzó alapanyag', miss };
  if (r.coins && S.coins < r.coins) return { ok: false, why: 'Nincs elég érméd' };
  return { ok: true };
}
export function startRecipe(b, rid) {
  const r = RECIPES[rid];
  const c = canStart(b, rid);
  if (!c.ok) return fail(c.miss ? `Hiányzik: ${c.miss.map((m) => `${m.need} ${ITEMS[m.id].name}`).join(', ')}` : c.why);
  if (!pay({ coins: r.coins || 0, ...r.in })) return false;
  const last = b.queue.length ? b.queue[b.queue.length - 1].end : 0;
  const start = Math.max(now(), last);
  b.queue.push({ id: rid, start, end: start + recipeTime(b, rid) * 1000 });
  stat('start_' + rid);
  bus.emit('sfx', 'craft'); fx('puff', b); changed(); return true;
}
export function collectBuilding(b) {
  let got = 0, xp = 0;
  const items = {};
  while (b.queue.length && now() >= b.queue[0].end) {
    const q = b.queue[0];
    const out = recipeOut(q.id), n = recipeQty(q.id);
    if (!roomFor(n)) break;
    b.queue.shift();
    addItem(out, n);
    got++; items[out] = (items[out] || 0) + n;
    xp += Math.max(1, ITEMS[out].xp * (RECIPES[q.id].out ? 1 : n));
    stat('craft'); stat('craft_' + q.id);
  }
  if (!got) return false;
  fx('harvest', b, { color: '#ffe082', item: Object.keys(items)[0] }); bus.emit('sfx', 'collect');
  reward(b, { xp, items });
  changed(); return true;
}
export function cancelRecipe(b, i) {
  const q = b.queue[i];
  if (!q || now() >= q.end) return false;
  const r = RECIPES[q.id];
  // refund ingredients (not coins) and shift following jobs earlier
  for (const [id, n] of Object.entries(r.in)) addItem(id, n, false);
  const dur = q.end - Math.max(q.start, now());
  b.queue.splice(i, 1);
  for (let k = i; k < b.queue.length; k++) { b.queue[k].start -= dur; b.queue[k].end -= dur; }
  bus.emit('sfx', 'remove'); changed(); return true;
}
export function upgradeBuilding(b) {
  const d = BUILDINGS[b.key];
  if ((b.level || 1) >= BUILDING_MAX_LEVEL) return fail('Ez már a legnagyobb szint.');
  if (!pay(buildingUpgradeCost(d, b.level || 1))) return false;
  b.level = (b.level || 1) + 1; stat('upgrade');
  fx('build', b); bus.emit('sfx', 'build');
  bus.emit('toast', { text: `${d.name} fejlesztve (${b.level}. szint): ${slotsOf(b)} gyártóhely, gyorsabb munka`, kind: 'good' });
  reward(b, { xp: 15 * b.level });
  bus.emit('objChanged', b); changed(); return true;
}
export { HOUSINGS, BUILDINGS, has };
