// Trading: order board + delivery truck, market stall, visiting villagers and the river barge.
import {
  CROPS, TREES, ANIMALS, RECIPES, ITEMS, FISH, FISHING_LEVEL, MARKET_SLOTS, BARGE_LEVEL, BARGE_STAY,
  BARGE_AWAY, VISITOR_LEVEL, MARKET_LEVEL, DECOS,
} from '../data/content.js';
import { NPC_NAMES } from '../data/progression.js';
import {
  S, bus, now, fail, changed, rnd, irnd, pick, has, takeItem, addItem, addCoins, addXp, stat, countOf, objectsOf,
  fixedObj, reward, roomFor, qty,
} from './state.js';
import { inSeason } from './farm.js';

export function charm() { return S.objects.reduce((n, o) => n + (o.type === 'deco' ? DECOS[o.key].charm : 0), 0); }
export const charmBonus = () => Math.min(30, Math.floor(charm() / 5));

// ------------------------------------------------------------------ what can the player make right now?
function producible({ fish = true } = {}) {
  const L = S.level, out = [];
  const owns = (type, key) => countOf(type, key) > 0;
  const ownsAnimal = (key) => objectsOf('housing', ANIMALS[key].housing).some((h) => h.animals.length);
  for (const [id, c] of Object.entries(CROPS)) if (c.level <= L) out.push({ id, w: inSeason(id) ? 3 : 1.2 });
  for (const [k, t] of Object.entries(TREES)) if (t.level <= L && owns('tree', k)) out.push({ id: t.item, w: 2 });
  for (const [k, a] of Object.entries(ANIMALS)) if (a.level <= L && ownsAnimal(k)) out.push({ id: a.item, w: 2.5 });
  for (const [id, r] of Object.entries(RECIPES)) {
    if (r.level > L || r.out || !owns('building', r.building)) continue;
    if (['axe', 'pickaxe', 'plank', 'brick'].includes(id) || r.building === 'feedmill') continue;
    out.push({ id, w: 2 });
  }
  if (fish && L >= FISHING_LEVEL + 1) for (const [id, f] of Object.entries(FISH)) if (!f.junk && f.difficulty <= 3) out.push({ id, w: 0.5 });
  return out;
}
function weighted(pool) {
  const tot = pool.reduce((a, p) => a + p.w, 0);
  let r = Math.random() * tot, i = 0;
  while (r > pool[i].w && i < pool.length - 1) { r -= pool[i].w; i++; }
  return pool.splice(i, 1)[0].id;
}
const valueOf = (items) => Object.entries(items).reduce((a, [id, q]) => a + ITEMS[id].sell * q, 0);
const xpOf = (items) => Object.entries(items).reduce((a, [id, q]) => a + ITEMS[id].xp * q, 0);

// ------------------------------------------------------------------ order board
export const orderSlots = () => Math.min(9, 3 + Math.floor(S.level / 4));
function genOrder() {
  const pool = producible(); const L = S.level;
  let n = 1; if (L >= 3 && Math.random() < 0.55) n++; if (L >= 7 && Math.random() < 0.35) n++;
  const items = {};
  const target = 25 + L * 16;
  for (let k = 0; k < n && pool.length; k++) {
    const id = weighted(pool);
    items[id] = Math.max(1, Math.min(16, Math.round((rnd(0.6, 1.3) * target) / n / ITEMS[id].sell)));
  }
  const bonus = L >= 4 && Math.random() < 0.18 ? { [pick(['plank', 'brick', 'axe', 'pickaxe', 'plank', 'brick'])]: 1 } : null;
  return { npc: irnd(0, NPC_NAMES.length - 1), items, coins: Math.round(valueOf(items) * 1.35), xp: Math.round(xpOf(items) * 1.2) + 2, gems: Math.random() < 0.05 ? 1 : 0, bonus };
}
export function ensureOrders() {
  let dirty = false;
  const n = orderSlots();
  while (S.orders.length < n) { S.orders.push(genOrder()); dirty = true; }
  for (let i = 0; i < S.orders.length; i++) if (S.orders[i].wait && now() >= S.orders[i].wait) { S.orders[i] = genOrder(); dirty = true; }
  return dirty;
}
export const canFulfill = (o) => !o.wait && Object.entries(o.items).every(([id, q]) => has(id, q));
export function fulfill(i) {
  const o = S.orders[i];
  if (!o || o.wait) return false;
  if (!canFulfill(o)) return fail('Még nincs meg minden kért termék.');
  for (const [id, q] of Object.entries(o.items)) takeItem(id, q);
  const coins = Math.round(o.coins * (1 + charmBonus() / 100));
  if (o.bonus) for (const [id, q] of Object.entries(o.bonus)) addItem(id, q, false);
  stat('order'); bus.emit('sfx', 'truck');
  reward(fixedObj('truck'), { coins, xp: o.xp, gems: o.gems, items: o.bonus, delay: 900 });
  bus.emit('truck', { items: o.items });
  S.orders[i] = { wait: now() + 20000 };
  changed(); return true;
}
export function discardOrder(i) {
  if (!S.orders[i] || S.orders[i].wait) return false;
  S.orders[i] = { wait: now() + 120000 }; bus.emit('sfx', 'remove'); changed(); return true;
}

// ------------------------------------------------------------------ market stall
export function marketRange(id, q) {
  const base = ITEMS[id].sell * q;
  return { min: Math.max(1, Math.ceil(base * 0.5)), max: Math.max(2, Math.round(base * 2)), base: Math.max(1, base), def: Math.max(1, Math.round(base * 1.25)) };
}
export function saleDelay(ratio) { return 60 * (0.5 + 2.5 * Math.pow(ratio, 3)) * rnd(0.75, 1.25); }
export function listItem(i, id, q, price) {
  if (S.level < MARKET_LEVEL) return fail(`A piac ${MARKET_LEVEL}. szinttől nyit.`);
  if (S.market.slots[i]) return false;
  if (!has(id, q)) return fail('Nincs ennyi a raktárban.');
  const r = marketRange(id, q);
  price = Math.max(r.min, Math.min(r.max, Math.round(price)));
  takeItem(id, q);
  S.market.slots[i] = { id, qty: q, price, listedAt: now(), sellAt: now() + saleDelay(price / r.base) * 1000, sold: false, npc: irnd(0, NPC_NAMES.length - 1) };
  bus.emit('sfx', 'place'); bus.emit('market'); changed(); return true;
}
export function cancelListing(i) {
  const s = S.market.slots[i];
  if (!s || s.sold) return false;
  if (!roomFor(s.qty)) return false;
  addItem(s.id, s.qty, false);
  S.market.slots[i] = null;
  bus.emit('sfx', 'remove'); bus.emit('market'); changed(); return true;
}
export function collectSale(i) {
  const s = S.market.slots[i];
  if (!s || !s.sold) return false;
  S.market.slots[i] = null;
  stat('market_sold'); stat('market_coins', s.price);
  reward(fixedObj('market'), { coins: s.price, xp: Math.max(1, Math.round(ITEMS[s.id].xp * s.qty * 0.5)) });
  bus.emit('sfx', 'coin'); bus.emit('market'); changed(); return true;
}
export function collectAllSales() { let n = 0; for (let i = 0; i < MARKET_SLOTS; i++) if (collectSale(i)) n++; return n; }
function marketTick() {
  let dirty = false;
  for (const s of S.market.slots) {
    if (s && !s.sold && now() >= s.sellAt) {
      s.sold = true; dirty = true;
      bus.emit('marketSold', s);
      bus.emit('toast', { text: `${NPC_NAMES[s.npc]} megvette: ${s.qty} × ${ITEMS[s.id].name} (${s.price} érme)`, kind: 'good', icon: 'ui:coin' });
    }
  }
  return dirty;
}

// ------------------------------------------------------------------ visitors
export const VISITOR_MAX = 3;
function genVisitor() {
  const pool = producible({ fish: true });
  // prefer things the player actually has in stock
  for (const p of pool) if (qty(p.id) > 0) p.w *= 3;
  const items = {};
  const n = Math.random() < 0.45 ? 2 : 1;
  const target = 20 + S.level * 10;
  for (let k = 0; k < n && pool.length; k++) {
    const id = weighted(pool);
    items[id] = Math.max(1, Math.min(10, Math.round((rnd(0.5, 1.1) * target) / n / ITEMS[id].sell)));
  }
  const used = new Set(S.visitors.map((v) => v.npc));
  let npc = irnd(0, NPC_NAMES.length - 1);
  for (let t = 0; t < 12 && used.has(npc); t++) npc = irnd(0, NPC_NAMES.length - 1);
  return { id: Math.floor(Math.random() * 1e9), npc, items, coins: Math.round(valueOf(items) * rnd(1.5, 1.9)), xp: Math.round(xpOf(items) * 1.5) + 3, arrivedAt: now(), leaveAt: now() + 40 * 60000 };
}
function visitorTick() {
  if (S.level < VISITOR_LEVEL) return false;
  let dirty = false;
  const before = S.visitors.length;
  S.visitors = S.visitors.filter((v) => now() < v.leaveAt);
  if (S.visitors.length !== before) dirty = true;
  if (!S.nextVisitorAt) S.nextVisitorAt = now() + 30000;
  if (now() >= S.nextVisitorAt) {
    S.nextVisitorAt = now() + rnd(4, 10) * 60000;
    if (S.visitors.length < VISITOR_MAX) {
      const v = genVisitor();
      S.visitors.push(v);
      bus.emit('visitor', v);
      bus.emit('toast', { text: `${NPC_NAMES[v.npc]} benézett hozzád — vásárolna valamit!`, kind: 'info', icon: 'ui:visitor' });
      bus.emit('sfx', 'bell');
      dirty = true;
    }
  }
  return dirty;
}
export function serveVisitor(id) {
  const v = S.visitors.find((x) => x.id === id);
  if (!v) return false;
  if (!Object.entries(v.items).every(([k, q]) => has(k, q))) return fail('Még nincs meg minden, amit kér.');
  for (const [k, q] of Object.entries(v.items)) takeItem(k, q);
  S.visitors = S.visitors.filter((x) => x !== v);
  const coins = Math.round(v.coins * (1 + charmBonus() / 100));
  stat('visitor');
  reward(fixedObj('house'), { coins, xp: v.xp });
  bus.emit('visitorLeft', { v, happy: true });
  bus.emit('sfx', 'coin'); changed(); return true;
}
export function declineVisitor(id) {
  const v = S.visitors.find((x) => x.id === id);
  if (!v) return false;
  S.visitors = S.visitors.filter((x) => x !== v);
  bus.emit('visitorLeft', { v, happy: false });
  bus.emit('sfx', 'remove'); changed(); return true;
}

// ------------------------------------------------------------------ barge
function genBarge() {
  const crates = [];
  const L = S.level;
  for (let i = 0; i < 6; i++) {
    const pool = producible({ fish: false });
    const id = weighted(pool);
    const q = Math.max(2, Math.min(12, Math.round(rnd(0.8, 1.4) * (40 + L * 8) / ITEMS[id].sell)));
    crates.push({ id, qty: q, filled: false, coins: Math.round(ITEMS[id].sell * q * 1.3), xp: Math.round(ITEMS[id].xp * q * 1.1) + 2 });
  }
  return { state: 'docked', leaveAt: now() + BARGE_STAY * 1000, crates, bonus: { gems: irnd(2, 4), items: { [pick(['plank', 'brick'])]: irnd(2, 4) } } };
}
export function fillCrate(i) {
  const b = S.barge;
  if (b.state !== 'docked') return false;
  const c = b.crates[i];
  if (!c || c.filled) return false;
  if (!has(c.id, c.qty)) return fail(`Ehhez ${c.qty} × ${ITEMS[c.id].name} kell.`);
  takeItem(c.id, c.qty);
  c.filled = true;
  stat('barge_crate');
  reward(fixedObj('dock'), { coins: c.coins, xp: c.xp });
  bus.emit('sfx', 'collect'); bus.emit('barge', { crates: true });
  if (b.crates.every((x) => x.filled)) {
    for (const [id, q] of Object.entries(b.bonus.items)) addItem(id, q, false);
    reward(fixedObj('dock'), { gems: b.bonus.gems, items: b.bonus.items, delay: 600 });
    stat('barge');
    bus.emit('toast', { text: 'Az uszály teli rakománnyal útnak indult! Jutalom: ' + b.bonus.gems + ' drágakő', kind: 'gem' });
    bus.emit('sfx', 'quest');
    S.barge = { state: 'away', at: now() + BARGE_AWAY * 1000 };
    bus.emit('barge', { leave: true });
  }
  changed(); return true;
}
function bargeTick() {
  if (S.level < BARGE_LEVEL) return false;
  const b = S.barge;
  if (b.state === 'away' && now() >= b.at) {
    S.barge = genBarge();
    bus.emit('barge', { arrive: true });
    bus.emit('toast', { text: 'Megérkezett az uszály a kikötőbe! Rakd meg a ládákat.', kind: 'info', icon: 'ui:boat' });
    return true;
  }
  if (b.state === 'docked' && now() >= b.leaveAt) {
    S.barge = { state: 'away', at: now() + BARGE_AWAY * 1000 };
    bus.emit('barge', { leave: true });
    return true;
  }
  return false;
}

export function tradeTick() {
  let d = ensureOrders();
  if (marketTick()) d = true;
  if (visitorTick()) d = true;
  if (bargeTick()) d = true;
  return d;
}
export { NPC_NAMES, addCoins, addXp, irnd };
