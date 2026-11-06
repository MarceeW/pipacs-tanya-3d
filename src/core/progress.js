// Quests, achievements, daily login reward, daily tasks and fishing outcomes.
import { FISH, FISHING_LEVEL, ITEMS } from '../data/content.js';
import {
  QUESTS, QUEST_TEMPLATES, ACHIEVEMENTS, ACH_GEMS, TIER_NAMES, DAILY_LOGIN, DAILY_TASKS,
} from '../data/progression.js';
import { S, bus, now, fail, changed, pick, irnd, addCoins, addXp, addItem, has, takeItem, stat, roomFor, reward, fixedObj } from './state.js';
import { clock, isNight } from './clock.js';
import { charm } from './trade.js';

// ------------------------------------------------------------------ story quests
export function currentQuest() {
  const q = S.quest;
  if (q.i < QUESTS.length) return QUESTS[q.i];
  if (!q.gen) {
    const L = S.level; const t = pick(QUEST_TEMPLATES)(L);
    t.npc = irnd(0, 11);
    t.reward = { coins: 60 + L * 25, xp: 10 + L * 3, gems: Math.random() < 0.3 ? 1 : 0 };
    q.gen = t; q.base = S.stats[t.stat] || 0;
  }
  return q.gen;
}
export function questProgress() {
  const q = currentQuest();
  let v;
  if (q.check === 'level') v = S.level;
  else if (q.check === 'charm') v = charm();
  // story quests count lifetime totals so work done early still counts; generated ones count from their start
  else v = (S.stats[q.stat] || 0) - (S.quest.i < QUESTS.length ? 0 : S.quest.base || 0);
  return { q, v: Math.min(v, q.n), done: v >= q.n };
}
export function claimQuest() {
  const { q, done } = questProgress();
  if (!done) return false;
  const r = q.reward;
  if (r.items) { for (const [id, n] of Object.entries(r.items)) addItem(id, n, false); }
  reward(null, { coins: r.coins || 0, gems: r.gems || 0, items: r.items || null });
  bus.emit('questDone', r);
  bus.emit('sfx', 'quest');
  S.quest = { i: S.quest.i + 1, base: 0 };
  const nq = currentQuest();
  if (nq.stat) S.quest.base = S.stats[nq.stat] || 0;
  if (r.xp) addXp(r.xp);
  changed(); return true;
}

// ------------------------------------------------------------------ achievements
export function achValue(a) { return a.check === 'level' ? S.level : S.stats[a.stat] || 0; }
export function checkAch() {
  for (const a of ACHIEVEMENTS) {
    const tier = S.ach[a.id] || 0;
    if (tier < a.tiers.length && achValue(a) >= a.tiers[tier]) {
      S.ach[a.id] = tier + 1; S.gems += ACH_GEMS[tier];
      bus.emit('toast', { text: `Kitüntetés: ${a.name} (${TIER_NAMES[tier]}) +${ACH_GEMS[tier]} drágakő`, kind: 'gem', icon: 'ui:trophy' });
      bus.emit('sfx', 'quest');
    }
  }
}

// ------------------------------------------------------------------ daily login + tasks
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
export function checkDaily() {
  const today = dayKey();
  if (S.daily.last === today) return false;
  const y = new Date(); y.setDate(y.getDate() - 1);
  S.daily.streak = S.daily.last === dayKey(y) ? (S.daily.streak % 7) + 1 : 1;
  S.daily.last = today; S.daily.pending = true;
  rollTasks();
  return true;
}
export function claimDaily() {
  if (!S.daily.pending) return null;
  const r = DAILY_LOGIN[S.daily.streak - 1];
  S.daily.pending = false;
  if (r.items) for (const [id, n] of Object.entries(r.items)) addItem(id, n, false);
  reward(null, { coins: r.coins, gems: r.gems || 0, items: r.items || null });
  bus.emit('sfx', 'quest'); changed(); return r;
}
function rollTasks() {
  const L = S.level;
  const pool = DAILY_TASKS.filter((t) => (t.level || 1) <= L);
  const chosen = [];
  while (chosen.length < 3 && pool.length) chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  S.tasks = {
    day: dayKey(),
    list: chosen.map((t) => ({ id: t.id, stat: t.stat, n: t.n(L), base: S.stats[t.stat] || 0, claimed: false, coins: 40 + L * 12, xp: 8 + L * 2 })),
    bonusClaimed: false,
  };
}
export function taskText(t) { return DAILY_TASKS.find((d) => d.id === t.id).text.replace('{n}', t.n); }
export function taskProgress(t) { const v = (S.stats[t.stat] || 0) - t.base; return { v: Math.min(v, t.n), done: v >= t.n }; }
export function claimTask(i) {
  const t = S.tasks?.list[i];
  if (!t || t.claimed || !taskProgress(t).done) return false;
  t.claimed = true;
  reward(null, { coins: t.coins, xp: t.xp });
  stat('tasks');
  bus.emit('sfx', 'quest');
  if (S.tasks.list.every((x) => x.claimed) && !S.tasks.bonusClaimed) {
    S.tasks.bonusClaimed = true;
    reward(null, { gems: 2, delay: 500 });
    bus.emit('toast', { text: 'Mind a 3 napi feladat kész! +2 drágakő', kind: 'gem' });
  }
  changed(); return true;
}
export const tasksReady = () => (S.tasks?.list || []).filter((t) => !t.claimed && taskProgress(t).done).length;

// ------------------------------------------------------------------ fishing
export function fishWeights() {
  const c = clock();
  const night = isNight(c.hour);
  return Object.entries(FISH).map(([id, f]) => {
    let w = f.weight;
    if (f.seasons) w *= f.seasons.includes(c.season) ? 2.2 : 0.35;
    if (f.night) w *= night ? 3 : 0.3;
    if (c.weather === 'rain') w *= f.junk ? 0.6 : 1.2;
    return { id, w };
  });
}
export function rollFish() {
  const pool = fishWeights();
  const tot = pool.reduce((a, p) => a + p.w, 0);
  let r = Math.random() * tot;
  for (const p of pool) { if ((r -= p.w) <= 0) return p.id; }
  return 'perch';
}
export function startCast() {
  if (S.level < FISHING_LEVEL) return fail(`Horgászni ${FISHING_LEVEL}. szinttől tudsz.`);
  if (!has('bait')) return fail('Elfogyott a csali! Vegyél a boltban (Kellékek).');
  if (!roomFor(1)) return false;
  takeItem('bait', 1);
  stat('cast');
  changed();
  return rollFish();
}
export function landFish(id) {
  if (!roomFor(1)) return false;
  addItem(id, 1);
  stat('fish');
  if (FISH[id].junk) stat('junk');
  reward(fixedObj('pier'), { xp: ITEMS[id].xp, items: { [id]: 1 } });
  bus.emit('sfx', FISH[id].junk ? 'remove' : 'harvest');
  changed(); return true;
}
export function lostFish() { stat('fish_lost'); changed(); }
export { now };
