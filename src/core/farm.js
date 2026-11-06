// Fields, crops, fruit trees, obstacles, sprinklers, weather effects and pets.
import {
  CROPS, TREES, OBSTACLES, PLOW_COST, OUT_OF_SEASON_SLOWDOWN, MASTERY, MASTERY_BONUS, ITEMS, TREE_SIZE,
} from '../data/content.js';
import {
  S, bus, now, fail, changed, fx, addObj, delObj, objAt, inFarm, canPlace, bounds, pay, stat, reward,
  rareGem, addItem, roomFor, has, takeItem, irnd, pick, countOf, objectsOf, sizeOf,
} from './state.js';
import { clock } from './clock.js';

// ------------------------------------------------------------------ mastery
export function masteryStars(id) {
  const n = S.stats['harvest_' + id] || 0;
  return MASTERY.filter((t) => n >= t).length;
}
export const inSeason = (id, season = clock().season) => CROPS[id].seasons.includes(season);
export function growDuration(id) {
  const c = CROPS[id];
  let t = c.time * 1000;
  if (!inSeason(id)) t *= OUT_OF_SEASON_SLOWDOWN;
  if (masteryStars(id) >= 1) t *= 0.9;
  return t;
}

// ------------------------------------------------------------------ plots
export function cropState(p) {
  const c = p.crop;
  if (!c) return null;
  if (!c.wateredAt) return { stage: 0, thirsty: true, ready: false, progress: 0, remaining: growDuration(c.id) / 1000 };
  const prog = Math.max(0, Math.min(1, (now() - c.wateredAt) / c.dur));
  const ready = prog >= 1;
  return {
    stage: ready ? 4 : 1 + Math.min(2, Math.floor(prog * 3)),
    ready, thirsty: false, progress: prog,
    remaining: Math.max(0, (c.dur - (now() - c.wateredAt)) / 1000),
  };
}
export function plow(x, y) {
  if (!inFarm(x, y)) return fail('Ez a terület még nem a tiéd. Bővítsd a farmot!');
  if (objAt(x, y)) return false;
  if (!pay({ coins: PLOW_COST })) return false;
  const o = addObj({ type: 'plot', x, y, crop: null });
  stat('plow'); fx('dust', o); bus.emit('sfx', 'plow');
  reward(o, { xp: 1 });
  bus.emit('reward', { x: x + 0.5, y: y + 0.5, coins: -PLOW_COST, quiet: true });
  changed(); return true;
}
export function plant(o, id = S.seedItem) {
  if (o.type !== 'plot' || o.crop) return false;
  const c = CROPS[id];
  if (!c || c.level > S.level) return fail('Ezt a vetőmagot még nem használhatod.');
  if (!pay({ coins: c.seed })) return false;
  o.crop = { id, plantedAt: now(), wateredAt: null, dur: 0 };
  stat('plant'); stat('plant_' + id);
  const w = clock().weather;
  if (sprinklerNear(o.x, o.y) || w === 'rain') startGrowth(o);
  fx('seed', o, { color: c.look.fruit }); bus.emit('sfx', 'plant'); changed(); return true;
}
function startGrowth(o) { o.crop.wateredAt = now(); o.crop.dur = growDuration(o.crop.id); }
export function water(o, auto = false) {
  if (o.type !== 'plot' || !o.crop || o.crop.wateredAt) return false;
  startGrowth(o);
  stat('water');
  fx('water', o);
  if (!auto) bus.emit('sfx', 'water');
  changed(); return true;
}
export function harvest(o) {
  const st = o.type === 'plot' && cropState(o);
  if (!st || !st.ready) return false;
  const id = o.crop.id, c = CROPS[id];
  let n = c.yield;
  const stars = masteryStars(id);
  if (Math.random() < MASTERY_BONUS[stars]) n++;
  if (countOf('deco', 'cat') && Math.random() < 0.05) n++;
  if (!roomFor(n)) return false;
  addItem(id, n);
  stat('harvest'); stat('harvest_' + id);
  o.crop = null;
  fx('harvest', o, { color: c.look.fruit, item: id }); bus.emit('sfx', 'harvest');
  reward(o, { xp: c.xp, items: { [id]: n } });
  rareGem(o, 0.01);
  if (masteryStars(id) > stars) {
    bus.emit('toast', { text: `Mesterség: ${c.name} ${'★'.repeat(stars + 1)} — nagyobb termés!`, kind: 'gem' });
    bus.emit('sfx', 'quest');
  }
  changed(); return true;
}
export function sprinklerNear(x, y) {
  return S.objects.some((s) => s.type === 'deco' && s.key === 'sprinkler' && Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);
}

// ------------------------------------------------------------------ trees
export function treeState(o) {
  const t = TREES[o.key];
  const rem = (o.readyAt - now()) / 1000;
  return { ready: rem <= 0, remaining: Math.max(0, rem), progress: Math.min(1, 1 - rem / (o.dur || t.time)) };
}
function treeDuration(key) { return TREES[key].time * (clock().season === 'winter' ? 1.5 : 1); }
export function harvestTree(o) {
  const t = TREES[o.key];
  if (!treeState(o).ready) return false;
  if (!roomFor(t.yield)) return false;
  addItem(t.item, t.yield);
  o.dur = treeDuration(o.key);
  o.readyAt = now() + o.dur * 1000;
  stat('harvest'); stat('harvest_' + t.item);
  fx('harvest', o, { color: t.look.fruit, item: t.item }); bus.emit('sfx', 'harvest');
  reward(o, { xp: ITEMS[t.item].xp, items: { [t.item]: t.yield } });
  rareGem(o, 0.02); changed(); return true;
}
export function newTree(key) { const d = treeDuration(key); return { readyAt: now() + d * 1000, dur: d }; }

// ------------------------------------------------------------------ obstacles
export function clearObstacle(o) {
  const d = OBSTACLES[o.key];
  if (d.tool && !has(d.tool)) {
    return fail(`Ehhez ${ITEMS[d.tool].name.toLowerCase()} kell. A műhelyben készíthetsz, vagy vehetsz a boltban.`);
  }
  const drops = {};
  let count = 0;
  for (const [id, a, b] of d.drops) { const n = irnd(a, b); if (n > 0) { drops[id] = n; count += n; } }
  if (count && !roomFor(count)) return false;
  if (d.coins && !pay({ coins: d.coins })) return false;
  if (d.tool) takeItem(d.tool, 1);
  for (const [id, n] of Object.entries(drops)) addItem(id, n);
  delObj(o);
  stat('clear'); stat('clear_' + o.key);
  fx(o.key === 'rock' || o.key === 'boulder' ? 'rocks' : 'leaves', o);
  bus.emit('sfx', d.tool === 'pickaxe' ? 'pick' : d.tool === 'axe' ? 'chop' : 'remove');
  reward(o, { xp: d.xp, items: count ? drops : null });
  if (d.coins) bus.emit('reward', { x: o.x + 0.5, y: o.y + 0.5, coins: -d.coins, quiet: true });
  rareGem(o, d.gemChance || 0.03);
  changed(); return true;
}

const SPAWN_POOL = ['weeds', 'weeds', 'weeds', 'bush', 'bush', 'stump', 'rock'];
const AREA_POOL = ['weeds', 'bush', 'bush', 'stump', 'stump', 'rock', 'rock', 'log', 'boulder'];
/** Scatter obstacles on free farm tiles, optionally only inside rect. */
export function spawnObstacles(n, rect = null, pool = SPAWN_POOL) {
  const b = rect || bounds();
  let placed = 0;
  for (let tries = 0; tries < n * 30 && placed < n; tries++) {
    const key = pick(pool);
    const sz = OBSTACLES[key].size;
    const x = irnd(b.x0, b.x1 - sz), y = irnd(b.y0, b.y1 - sz);
    if (!canPlace(x, y, sz)) continue;
    // keep a free ring around landmarks so the farm doesn't look cluttered
    if (sz === 1 && neighbours(x, y) > 2) continue;
    addObj({ type: 'obstacle', key, x, y, seed: irnd(1, 9999) });
    placed++;
  }
  return placed;
}
function neighbours(x, y) {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && objAt(x + dx, y + dy)) n++;
  return n;
}
/** Fill a freshly bought expansion strip. */
export function populateExpansion(prev, next) {
  const area = (next.x1 - next.x0) * (next.y1 - next.y0) - (prev.x1 - prev.x0) * (prev.y1 - prev.y0);
  const strips = [];
  if (next.x0 < prev.x0) strips.push({ x0: next.x0, y0: next.y0, x1: prev.x0, y1: next.y1 });
  if (next.x1 > prev.x1) strips.push({ x0: prev.x1, y0: next.y0, x1: next.x1, y1: next.y1 });
  if (next.y0 < prev.y0) strips.push({ x0: next.x0, y0: next.y0, x1: next.x1, y1: prev.y0 });
  if (next.y1 > prev.y1) strips.push({ x0: next.x0, y0: prev.y1, x1: next.x1, y1: next.y1 });
  const per = Math.max(3, Math.round(area / 9 / strips.length));
  for (const r of strips) spawnObstacles(per, r, AREA_POOL);
}
export const obstacleCount = () => S.objects.reduce((n, o) => n + (o.type === 'obstacle' ? 1 : 0), 0);

// ------------------------------------------------------------------ pets
const DOG_FINDS = [['wood', 2, 4], ['stone', 2, 4], ['bait', 3, 6], ['axe', 1, 1], ['pickaxe', 1, 1], ['coins', 40, 120], ['gems', 1, 1]];
export function petTick(day) {
  const dog = objectsOf('deco', 'dog')[0];
  if (!dog) return false;
  if (S.pets.dogDay === day) return false;
  S.pets.dogDay = day;
  const r = Math.random();
  const f = r < 0.05 ? DOG_FINDS[6] : r < 0.3 ? DOG_FINDS[5] : pick(DOG_FINDS.slice(0, 5));
  S.pets.dogFind = { id: f[0], n: irnd(f[1], f[2]) };
  return true;
}
export function collectDogFind() {
  const f = S.pets.dogFind;
  const dog = objectsOf('deco', 'dog')[0];
  if (!f || !dog) return false;
  if (f.id === 'coins') reward(dog, { coins: f.n });
  else if (f.id === 'gems') reward(dog, { gems: f.n });
  else { if (!roomFor(f.n)) return false; addItem(f.id, f.n); reward(dog, { items: { [f.id]: f.n } }); }
  S.pets.dogFind = null;
  bus.emit('toast', { text: 'Bodri kiásott valamit! Jó kutya!', kind: 'good' });
  bus.emit('sfx', 'collect'); fx('sparkle', dog); changed(); return true;
}

// ------------------------------------------------------------------ periodic farm upkeep
export function farmTick(c) {
  let dirty = false;
  // sprinklers + rain water fields
  const raining = c.weather === 'rain';
  for (const p of S.objects) {
    if (p.type !== 'plot' || !p.crop || p.crop.wateredAt) continue;
    if (raining || sprinklerNear(p.x, p.y)) { water(p, true); dirty = true; }
  }
  // a little new clutter every in-game day
  if (S.lastSpawnDay !== c.day) {
    const missed = S.lastSpawnDay == null ? 1 : Math.min(4, c.day - S.lastSpawnDay);
    S.lastSpawnDay = c.day;
    if (obstacleCount() < 14) spawnObstacles(Math.min(4, missed * 2));
    if (petTick(c.day)) dirty = true;
    dirty = true;
  }
  return dirty;
}
export { TREE_SIZE, sizeOf };
