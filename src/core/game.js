// Facade over all game rules + new game / load / periodic tick.
import { WORLD, MARKET_SLOTS, BARGE_LEVEL, DAY_LENGTH } from '../data/content.js';
import {
  S, bus, now, setState, save, readSave, clearSave, addObj, rebuildOcc, changed, irnd,
} from './state.js';
import { clock } from './clock.js';
import { farmTick, spawnObstacles, cropState, treeState } from './farm.js';
import { animalState, queueState, housingSummary } from './ranch.js';
import { tradeTick, ensureOrders, canFulfill } from './trade.js';
import { checkAch, checkDaily } from './progress.js';

export * from './state.js';
export * from './clock.js';
export * from './farm.js';
export * from './ranch.js';
export * from './shop.js';
export * from './trade.js';
export * from './progress.js';

const VERSION = 2;

function newGame() {
  const t = now();
  const s = {
    v: VERSION, farmName: 'Pipacs Tanya', coins: 300, gems: 10, xp: 0, level: 1,
    objects: [], nextId: 1, inv: { wheat: 6, corn: 2, bait: 5, axe: 1 }, storageLevel: 0, expansion: 0,
    orders: [], quest: { i: 0, base: 0 }, stats: {}, ach: {},
    daily: { last: null, streak: 0, pending: false }, tasks: null,
    market: { slots: Array(MARKET_SLOTS).fill(null) },
    visitors: [], nextVisitorAt: 0,
    barge: { state: 'away', at: 0 },
    pets: { dogDay: -1, dogFind: null },
    settings: { sfx: true, music: true, shadows: true, quality: 'high' },
    seed: Math.floor(Math.random() * 1e6), seedItem: 'wheat',
    clockEpoch: t - (8 / 24) * DAY_LENGTH * 1000,   // day 0 starts at 08:00
    createdAt: t, lastSeen: t, lastSpawnDay: 0, cam: null,
  };
  s.seedItem = 'wheat';
  setState(s);
  for (const f of WORLD.fixed) addObj({ type: 'fixed', key: f.key, x: f.x, y: f.y }, true);
  addObj({ type: 'fixed', key: 'house', x: 19, y: 17 }, true);
  addObj({ type: 'fixed', key: 'barn', x: 23, y: 17 }, true);
  // starter field: 3x3 plots, some ripe wheat
  for (let i = 0; i < 9; i++) {
    const x = 20 + (i % 3), y = 22 + Math.floor(i / 3);
    const ripe = i < 4;
    addObj({ type: 'plot', x, y, crop: ripe ? { id: 'wheat', plantedAt: t - 60000, wateredAt: t - 60000, dur: 30000 } : null }, true);
  }
  const deco = (key, x, y) => addObj({ type: 'deco', key, x, y, rot: 0, seed: irnd(1, 9999) }, true);
  deco('flowerbed', 18, 17); deco('flowerbed', 18, 19); deco('bush', 22, 17); deco('lamp', 22, 20);
  deco('path_stone', 20, 20); deco('path_stone', 20, 21); deco('mailbox', 18, 20);
  for (let x = 24; x <= 27; x++) deco('fence', x, 26);
  deco('pine', 32, 17); deco('birch', 31, 29); deco('haybale', 26, 21);
  spawnObstacles(10);
  s.lastSpawnDay = 0;
  ensureOrders();
  return s;
}

/** Bring older/partial saves up to date (defensive: never trust stored shape). */
function migrate(s) {
  if (!s || s.v !== VERSION || !Array.isArray(s.objects)) return null;
  s.market ||= { slots: Array(MARKET_SLOTS).fill(null) };
  s.visitors ||= [];
  s.barge ||= { state: 'away', at: 0 };
  s.pets ||= { dogDay: -1, dogFind: null };
  s.settings = { sfx: true, music: true, shadows: true, quality: 'high', ...(s.settings || {}) };
  s.stats ||= {}; s.ach ||= {}; s.inv ||= {};
  for (const o of s.objects) {
    if (o.type === 'building') { o.queue ||= []; o.level ||= 1; }
    if (o.type === 'housing') { o.animals ||= []; o.level ||= 1; }
  }
  return s;
}

export function load() {
  const s = migrate(readSave());
  if (s) setState(s); else newGame();
  rebuildOcc();
  ensureOrders();
  if (S.level >= BARGE_LEVEL && S.barge.state === 'away' && !S.barge.at) S.barge.at = now() + 60000;
  const away = now() - (S.lastSeen || now());
  checkDaily();
  return away;
}
export function resetGame() { clearSave(); newGame(); checkDaily(); bus.emit('reset'); changed(); }
export function exportSave() { save(); return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
export function importSave(str) {
  try {
    const s = migrate(JSON.parse(decodeURIComponent(escape(atob(str.trim())))));
    if (!s) return false;
    setState(s); ensureOrders(); save(); bus.emit('reset'); changed(); return true;
  } catch { return false; }
}

let lastAch = 0, lastDay = null, lastSeason = null, lastWeather = null;
export function tick() {
  const c = clock();
  let dirty = false;
  if (farmTick(c)) dirty = true;
  if (tradeTick()) dirty = true;
  if (S.level >= BARGE_LEVEL && S.barge.state === 'away' && !S.barge.at) S.barge.at = now() + 60000;
  if (now() - lastAch > 2000) { lastAch = now(); checkAch(); if (checkDaily()) bus.emit('dailyReady'); }
  if (lastSeason !== null && c.season !== lastSeason) {
    bus.emit('toast', { text: `Beköszöntött: ${c.seasonName}! Nézd meg, mely magok szeretik ezt az évszakot.`, kind: 'info', icon: 'ui:' + c.season });
    bus.emit('sfx', 'quest');
  }
  if (lastWeather !== null && c.weather !== lastWeather && c.weather === 'rain') bus.emit('toast', { text: 'Esik az eső — a vetések maguktól öntöződnek.', kind: 'info', icon: 'ui:rain' });
  if (lastDay !== null && c.day !== lastDay) bus.emit('newDay', c);
  lastDay = c.day; lastSeason = c.season; lastWeather = c.weather;
  if (dirty) changed();
  return c;
}

/** Everything waiting for the player (badges + welcome-back message). */
export function readySummary() {
  let crops = 0, animals = 0, goods = 0, trees = 0, thirsty = 0, hungry = 0;
  for (const o of S.objects) {
    if (o.type === 'plot') { const s = cropState(o); if (s?.ready) crops++; else if (s?.thirsty) thirsty++; }
    else if (o.type === 'housing') { const h = housingSummary(o); animals += h.ready; hungry += h.hungry; }
    else if (o.type === 'tree' && treeState(o).ready) trees++;
    else if (o.type === 'building') goods += queueState(o).filter((q) => q.done).length;
  }
  const sold = S.market.slots.filter((x) => x && x.sold).length;
  return { crops, animals, goods, trees, thirsty, hungry, sold, orders: S.orders.filter(canFulfill).length, visitors: S.visitors.length };
}
export { animalState };
