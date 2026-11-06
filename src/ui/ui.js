// HUD, tools, toasts, floating rewards, tooltip, popover, seed picker and quest hints.
import * as G from '../core/game.js';
import { CROPS, ITEMS, HOUSINGS, ANIMALS, TREES, DECOS, OBSTACLES, BUILDINGS, FIXED, SEASONS } from '../data/content.js';
import { xpToNext, NPC_NAMES } from '../data/progression.js';
import { iconURL } from '../three/icons.js';
import { worldToScreen, focusOn, rotate, zoomAt } from '../three/scene.js';
import { setGhost, showGrid, entOf, expansionSign, visitorScreenAnchor } from '../three/world.js';
import { $, $$, esc, ic, itemIc, itemName, fmtNum, fmtTime, price } from './dom.js';
import { openModal, closeModal, modalOpen, MODAL_ACTIONS, renderModal } from './modals.js';
import { sfx } from '../audio.js';

export const state = { tool: 'hand', placing: null, moving: null };

// ------------------------------------------------------------------ init
export function initUI() {
  $$('img[data-icon]').forEach((img) => { img.src = iconURL(img.dataset.icon); });
  $('#avatar-img').src = iconURL('portrait:farmer');
  document.addEventListener('click', onClick);
  G.bus.on('toast', (t) => toast(t.text, t.kind, t.icon));
  G.bus.on('reward', onReward);
  G.bus.on('change', () => { refresh(); if (modalOpen()) renderModal(); updatePopover(); });
  G.bus.on('levelup', (e) => openModal('levelup', e, true));
  G.bus.on('questDone', () => { const q = $('#quest'); q.classList.remove('done'); });
  G.bus.on('dailyReady', () => openModal('daily', {}, true));
  setTool('hand');
  refresh(true);
  setInterval(() => { refreshClock(); updatePopover(); updateHint(); }, 500);
}

function onClick(e) {
  const t = e.target.closest('[data-act],[data-tool]');
  if (!t) return;
  if (t.dataset.tool) {
    const tool = t.dataset.tool;
    if (tool === 'seed' && state.tool === 'seed') { const r = t.getBoundingClientRect(); openSeedPicker(r.left + r.width / 2, r.top, null); }
    setTool(tool);
    sfx('click');
    return;
  }
  const act = t.dataset.act;
  const arg = t.dataset.arg;
  if (ACTIONS[act]) { ACTIONS[act](arg, t, e); sfx('click'); return; }
  if (MODAL_ACTIONS[act]) { MODAL_ACTIONS[act](arg, t, e); return; }
}

const ACTIONS = {
  shop: () => openModal('shop', { tab: 'animals' }),
  storage: () => openModal('storage', {}),
  orders: () => openModal('orders'),
  market: () => openModal('market', {}),
  visitors: () => { if (G.S.visitors.length) openModal('visitor', { id: G.S.visitors[0].id }); else toast(G.S.level < 4 ? 'Látogatók a 4. szinttől érkeznek.' : 'Most nincs látogató. Hamarosan jön valaki!', 'info', 'ui:visitor'); },
  barge: () => openModal('barge'),
  fishing: () => openModal('fishing'),
  tasks: () => openModal('journal', { tab: 'tasks' }),
  journal: () => openModal('journal', { tab: 'tasks' }),
  calendar: () => openModal('calendar'),
  settings: () => openModal('settings'),
  rotL: () => rotate(-1), rotR: () => rotate(1),
  zoomIn: () => zoomAt(innerWidth / 2, innerHeight / 2, 1.2), zoomOut: () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.2),
  rotate: () => rotatePlacing(),
  cancelPlace: () => cancelPlacing(),
  claimQuest: () => G.claimQuest(),
  questHint: () => focusHint(),
  closePop: () => hidePopover(),
  pop: (arg) => POP_ACTIONS[arg]?.(),
};

// ------------------------------------------------------------------ tools / placement
export function setTool(t) {
  if (state.placing || state.moving) cancelPlacing();
  state.tool = t;
  $$('.tool').forEach((b) => b.classList.toggle('active', b.dataset.tool === t));
  showGrid(t === 'plow' || t === 'move');
  hidePopover();
  if (t !== 'seed') closeSeedPicker();
}
export function startPlacing(kind, key) {
  closeModal();
  hidePopover();
  state.placing = { kind, key, rot: 0 };
  state.moving = null;
  const name = G.shopEntry(kind, key).def.name;
  $('#place-text').textContent = `Helyezd el: ${name}`;
  $('#place-bar').classList.remove('hidden');
  showGrid(true);
}
export function startMoving(o) {
  hidePopover();
  state.moving = { obj: o, rot: o.rot || 0 };
  state.placing = null;
  $('#place-text').textContent = `Áthelyezés: ${G.objName(o)}`;
  $('#place-bar').classList.remove('hidden');
  showGrid(true);
}
export function cancelPlacing() {
  state.placing = null; state.moving = null;
  $('#place-bar').classList.add('hidden');
  setGhost(null);
  showGrid(state.tool === 'plow' || state.tool === 'move');
}
export function rotatePlacing() {
  const p = state.placing || state.moving;
  if (p) { p.rot = (p.rot + 1) % 4; sfx('click'); }
}

// ------------------------------------------------------------------ HUD refresh
const shown = { coins: null, gems: null };
export function refresh(instant = false) {
  const S = G.S;
  animateCounter('coins', S.coins, instant);
  animateCounter('gems', S.gems, instant);
  $('#lvl').textContent = S.level;
  const need = xpToNext(S.level);
  $('#xp-fill').style.width = `${Math.min(100, (S.xp / need) * 100)}%`;
  $('#xp-text').textContent = S.level >= 80 ? 'MAX' : `${fmtNum(S.xp)} / ${fmtNum(need)} XP`;
  $('#farm-name').textContent = S.farmName;
  const used = G.used(), cap = G.capacity();
  $('#storage').textContent = `${used}/${cap}`;
  $('#storage-fill').style.transform = `scaleX(${Math.min(1, used / cap)})`;
  $('#c-barn').classList.toggle('full', used >= cap);
  const sum = G.readySummary();
  badge('#b-orders', sum.orders);
  badge('#b-market', sum.sold);
  badge('#b-visitors', sum.visitors);
  badge('#b-tasks', G.tasksReady());
  badge('#b-barge', S.barge.state === 'docked' ? S.barge.crates.filter((c) => !c.filled && G.has(c.id, c.qty)).length || '!' : '');
  $('#btn-barge').classList.toggle('off', S.level < 12);
  $('#seed-img').src = iconURL('item:' + S.seedItem);
  renderQuest();
  refreshClock();
}
function badge(sel, n) { const b = $(sel); b.textContent = n ? n : ''; b.classList.toggle('pulse', !!n); }
function animateCounter(key, value, instant) {
  const el = $('#' + key);
  if (shown[key] === null || instant) { shown[key] = value; el.textContent = fmtNum(value); return; }
  if (shown[key] === value) return;
  const from = shown[key]; shown[key] = value;
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / 500);
    el.textContent = fmtNum(from + (value - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  const c = el.parentElement; c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
}
const WEATHER_ICON = { sun: 'sun', cloud: 'cloud', rain: 'rain', snow: 'snow' };
export function refreshClock() {
  if (!G.S) return;
  const c = G.clock();
  $('#clock-time').textContent = G.fmtClock(c.hour);
  $('#clock-date').textContent = `${c.seasonName}, ${c.dayOfSeason}. nap`;
  const si = $('#season-img'), wi = $('#weather-img');
  const night = G.isNight(c.hour) && c.weather !== 'rain' && c.weather !== 'snow';
  const sn = iconURL('ui:' + c.season), wn = iconURL('ui:' + (night ? 'moon' : WEATHER_ICON[c.weather]));
  if (si.dataset.cur !== sn) { si.src = sn; si.dataset.cur = sn; }
  if (wi.dataset.cur !== wn) { wi.src = wn; wi.dataset.cur = wn; }
}

// ------------------------------------------------------------------ quest card + hint arrow
export function renderQuest() {
  const { q, v, done } = G.questProgress();
  const r = q.reward;
  const html = `
    <div class="q-portrait">${ic('portrait:' + (q.npc ?? 0))}</div>
    <div class="q-body">
      <div class="q-npc">${esc(NPC_NAMES[q.npc ?? 0])}</div>
      <div class="q-text">${esc(q.text)}</div>
      <div class="q-prog"><div class="bar"><i style="width:${(v / q.n) * 100}%"></i></div><span class="q-num">${fmtNum(v)}/${fmtNum(q.n)}</span></div>
      <div class="q-reward">${r.coins ? `${ic('ui:coin')}${r.coins}` : ''} ${r.xp ? `${ic('ui:xp')}${r.xp}` : ''} ${r.gems ? `${ic('ui:gem')}${r.gems}` : ''} ${r.items ? Object.entries(r.items).map(([id, n]) => `${itemIc(id)}${n}`).join(' ') : ''}</div>
    </div>
    ${done ? '<button class="btn small" data-act="claimQuest">Begyűjt!</button>' : q.hint ? '<button class="mini" data-act="questHint" title="Mutasd!">?</button>' : ''}`;
  const el = $('#quest');
  if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
  el.classList.toggle('done', done);
}
function hintTarget() {
  const { q, done } = G.questProgress();
  if (done || !q.hint || modalOpen()) return null;
  const h = q.hint;
  if (h.ui) return { el: { shop: '.bigbtn.shop', visitors: '[data-act=visitors]', orders: '[data-act=orders]' }[h.ui] };
  if (h.tool) return { el: `.tool[data-tool=${h.tool}]` };
  if (h.obj) {
    const find = (pred) => G.S.objects.find(pred);
    let o = null;
    if (h.obj === 'ripe') o = find((x) => x.type === 'plot' && G.cropState(x)?.ready);
    else if (h.obj === 'emptyplot') o = find((x) => x.type === 'plot' && !x.crop);
    else if (h.obj === 'thirsty') o = find((x) => x.type === 'plot' && G.cropState(x)?.thirsty);
    else if (h.obj === 'obstacle') o = find((x) => x.type === 'obstacle' && (!OBSTACLES[x.key].tool || G.has(OBSTACLES[x.key].tool)));
    else if (h.obj === 'expandsign') { const s = expansionSign(); return s ? { world: { x: s.position.x, y: 1.6, z: s.position.z } } : null; }
    else { const [type, key] = h.obj.split(':'); o = find((x) => x.type === type && x.key === key); }
    if (o) { const n = G.sizeOf(o); return { world: { x: o.x + n / 2, y: Math.min(2.6, 0.6 + n * 0.55), z: o.y + n / 2 }, obj: o }; }
  }
  return null;
}
let hintEl = null;
function updateHint() {
  const arrow = $('#hint-arrow');
  const t = hintTarget();
  if (hintEl) { hintEl.classList.remove('hint-pulse'); hintEl = null; }
  if (!t || state.placing) { arrow.classList.add('hidden'); return; }
  if (t.el) {
    const el = $(t.el);
    if (el) { hintEl = el; el.classList.add('hint-pulse'); }
    arrow.classList.add('hidden');
    return;
  }
  const p = worldToScreen(t.world.x, t.world.y, t.world.z);
  if (p.x < 0 || p.y < 0 || p.x > innerWidth || p.y > innerHeight) { arrow.classList.add('hidden'); return; }
  arrow.classList.remove('hidden');
  arrow.style.left = p.x + 'px'; arrow.style.top = p.y + 'px';
}
function focusHint() {
  const t = hintTarget();
  if (t?.world) focusOn(t.world.x, t.world.z);
  else if (t?.el) toast('Kattints a villogó gombra!', 'info');
}

// ------------------------------------------------------------------ toasts
const recent = new Map();
export function toast(text, kind = 'info', icon = null) {
  const n = performance.now();
  if (recent.get(text) > n - 1500) return;
  recent.set(text, n);
  const box = $('#toasts');
  const d = document.createElement('div');
  d.className = `toast ${kind}`;
  d.innerHTML = `${icon ? ic(icon) : kind === 'bad' ? '' : ''}<span>${esc(text)}</span>`;
  box.appendChild(d);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, kind === 'bad' ? 2600 : 3400);
}

// ------------------------------------------------------------------ floating rewards + fly-to-HUD
function onReward(r) {
  let sx = innerWidth / 2, sy = innerHeight / 2;
  if (r.x != null) { const p = worldToScreen(r.x, 1.2, r.y); sx = p.x; sy = p.y; }
  const lines = [];
  if (r.coins) lines.push([r.coins > 0 ? `+${fmtNum(r.coins)}` : `${fmtNum(r.coins)}`, 'ui:coin', r.coins > 0 ? 'coin' : 'neg', '#c-coins']);
  if (r.xp) lines.push([`+${r.xp}`, 'ui:xp', 'xp', '#profile .lvl-badge']);
  if (r.gems) lines.push([`+${r.gems}`, 'ui:gem', 'gem', '#c-gems']);
  if (r.items) for (const [id, n] of Object.entries(r.items)) lines.push([`+${n}`, 'item:' + id, 'item', '#c-barn']);
  lines.forEach(([txt, icon, cls, target], i) => {
    setTimeout(() => {
      const f = document.createElement('div');
      f.className = `float ${cls}`;
      f.style.left = sx + 'px'; f.style.top = (sy - i * 28) + 'px';
      f.innerHTML = `${ic(icon)}${txt}`;
      $('#floaters').appendChild(f);
      setTimeout(() => f.remove(), 1500);
      if (!r.quiet && cls !== 'neg') fly(icon, sx, sy - i * 28, target);
    }, (r.delay || 0) + i * 110);
  });
}
function fly(icon, x, y, targetSel) {
  const t = $(targetSel);
  if (!t) return;
  const tr = t.getBoundingClientRect();
  const img = document.createElement('img');
  img.className = 'fly'; img.src = iconURL(icon);
  img.style.left = x - 20 + 'px'; img.style.top = y - 20 + 'px';
  document.body.appendChild(img);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    img.style.left = tr.left + tr.width / 2 - 20 + 'px';
    img.style.top = tr.top + tr.height / 2 - 20 + 'px';
    img.style.transform = 'scale(.6)';
    img.style.opacity = '0';
  }));
  setTimeout(() => { img.remove(); t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); }, 800);
}

// ------------------------------------------------------------------ tooltip
export function tooltip(html, x, y) {
  const t = $('#tooltip');
  if (!html) { t.classList.add('hidden'); return; }
  if (t.dataset.html !== html) { t.innerHTML = html; t.dataset.html = html; }
  t.classList.remove('hidden');
  const w = t.offsetWidth;
  t.style.left = Math.min(x, innerWidth - w - 24) + 'px';
  t.style.top = y + 'px';
}
export function describe(o) {
  const name = esc(G.objName(o));
  if (o.type === 'plot') {
    const s = G.cropState(o);
    if (!s) return `${name}<small>Üres – vess bele!</small>`;
    if (s.ready) return `${name}<small>Érett – arasd le!</small>`;
    if (s.thirsty) return `${name}<small>Öntözésre vár</small>`;
    return `${name}<small>Még ${fmtTime(s.remaining)}</small>`;
  }
  if (o.type === 'tree') { const s = G.treeState(o); return `${name}<small>${s.ready ? 'Szedhető!' : 'Még ' + fmtTime(s.remaining)}</small>`; }
  if (o.type === 'housing') { const h = G.housingSummary(o); return `${name}<small>${h.count}/${h.cap} állat · ${h.ready ? h.ready + ' kész' : h.hungry ? h.hungry + ' éhes' : h.busy ? 'Még ' + fmtTime(h.next) : 'Üres'}</small>`; }
  if (o.type === 'building') { const q = G.queueState(o); const d = q.filter((x) => x.done).length; return `${name}<small>${d ? d + ' termék kész!' : q.length ? 'Dolgozik… ' + fmtTime(q.find((x) => !x.done)?.remaining || 0) : 'Tétlen – indíts gyártást'}</small>`; }
  if (o.type === 'obstacle') { const d = OBSTACLES[o.key]; return `${name}<small>${d.tool ? 'Kell: ' + itemName(d.tool) : d.coins ? 'Takarítás: ' + d.coins + ' érme' : 'Kattints a takarításhoz'}</small>`; }
  if (o.type === 'deco') return `${name}<small>+${DECOS[o.key].charm} bájpont</small>`;
  if (o.type === 'fixed') return `${name}<small>${{ house: 'Az otthonod', barn: 'Raktár és eladás', board: 'Megrendelések', truck: 'Kiszállítás', market: 'Saját árakon árulhatsz', dock: 'Uszály-rakodás', pier: 'Horgászhely' }[o.key] || ''}</small>`;
  return name;
}

// ------------------------------------------------------------------ popover (object details)
let pop = null; // { obj, x, y }
const POP_ACTIONS = {};
export function inspect(o, sx, sy) { pop = { obj: o, x: sx, y: sy }; renderPopover(true); }
export function hidePopover() { pop = null; $('#popover').classList.add('hidden'); }
export function updatePopover() { if (pop) renderPopover(false); }
function renderPopover(first) {
  const o = pop.obj;
  if (!G.getObj(o.id)) { hidePopover(); return; }
  const el = $('#popover');
  let title = esc(G.objName(o)), iconName = null, lines = [], prog = null;
  const btns = [];
  const rem = G.remainingOf(o);
  if (o.type === 'plot') {
    const s = G.cropState(o);
    if (s) {
      iconName = 'item:' + o.crop.id;
      const c = CROPS[o.crop.id];
      lines.push(s.thirsty ? 'Öntözésre vár — öntözés után indul a növekedés.' : s.ready ? 'Érett, arasd le!' : `Hátralévő idő: <b>${fmtTime(s.remaining)}</b>`);
      lines.push(`Termés: ${c.yield} db · ${G.inSeason(o.crop.id) ? 'Szezonban van 🌱' : 'Nincs szezonban (lassabb)'}`);
      if (!s.thirsty) prog = s.progress;
      if (s.thirsty) { btns.push(['water', 'Öntözés', 'blue']); POP_ACTIONS.water = () => G.water(o); }
    } else { lines.push('Üres szántóföld.'); btns.push(['seeds', 'Vetés…', '']); POP_ACTIONS.seeds = () => { const p = pop; hidePopover(); openSeedPicker(p.x, p.y, o); }; }
  } else if (o.type === 'tree') {
    const s = G.treeState(o); iconName = 'item:' + TREES[o.key].item;
    lines.push(s.ready ? 'Szedhető gyümölcs!' : `Következő termés: <b>${fmtTime(s.remaining)}</b>`);
    lines.push(`${TREES[o.key].yield} db ${itemName(TREES[o.key].item)} szüretenként`);
    prog = s.ready ? 1 : s.progress;
  } else if (o.type === 'deco') {
    const d = DECOS[o.key]; lines.push(`+${d.charm} bájpont${d.desc ? ' · ' + esc(d.desc) : ''}`);
  } else if (o.type === 'obstacle') {
    const d = OBSTACLES[o.key];
    lines.push(d.tool ? `Eltakarításához kell: <b>${itemName(d.tool)}</b> (van: ${G.qty(d.tool)})` : d.coins ? `Takarítás ára: ${d.coins} érme` : 'Kézzel kitéphető.');
    if (d.drops.length) lines.push('Jutalom: ' + d.drops.map(([id]) => itemIc(id) + itemName(id)).join(', '));
    btns.push(['clear', 'Eltakarítás', 'gold']); POP_ACTIONS.clear = () => { if (G.clearObstacle(o)) hidePopover(); };
  }
  if (rem > 0) {
    const cost = G.speedCost(rem);
    btns.push(['speed', `${ic('ui:gem')}${cost} Gyorsítás`, 'purple']);
    POP_ACTIONS.speed = () => G.speedUp(o);
  }
  if (G.movable(o) && o.type !== 'plot') { btns.push(['move', 'Áthelyez', 'blue']); POP_ACTIONS.move = () => startMoving(o); }
  if (o.type === 'deco' || o.type === 'tree') { btns.push(['rot', '⟳', 'blue']); POP_ACTIONS.rot = () => G.rotateObj(o); }
  const html = `<button class="x" data-act="closePop">✕</button>
    <h4>${iconName ? ic(iconName) : ''}${title}</h4>
    ${lines.map((l) => `<div class="p-line">${l}</div>`).join('')}
    ${prog != null ? `<div class="bar"><i style="width:${Math.round(prog * 100)}%"></i></div>` : ''}
    <div class="p-btns">${btns.map(([k, label, cls]) => `<button class="btn small ${cls}" data-act="pop" data-arg="${k}">${label}</button>`).join('')}</div>`;
  if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
  el.classList.remove('hidden');
  if (first) {
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.max(8, Math.min(innerWidth - w - 8, pop.x + 16)) + 'px';
    el.style.top = Math.max(8, Math.min(innerHeight - h - 8, pop.y - h / 2)) + 'px';
  }
}

// ------------------------------------------------------------------ seed picker
let pickerPlot = null;
export function openSeedPicker(sx, sy, plot) {
  pickerPlot = plot;
  const el = $('#seed-picker');
  const season = G.clock().season;
  const list = Object.entries(CROPS).map(([id, c]) => {
    const locked = c.level > G.S.level;
    const stars = G.masteryStars(id);
    return `<div class="seed ${locked ? 'off' : ''} ${G.S.seedItem === id ? 'on' : ''}" data-act="pickSeed" data-arg="${id}" title="${esc(c.name)} – ${c.seed} érme, ${fmtTime(c.time)}">
      ${c.seasons.includes(season) ? `<img class="season" src="${iconURL('ui:' + season)}">` : ''}
      ${stars ? `<span class="stars">${'★'.repeat(stars)}</span>` : ''}
      ${itemIc(id)}<span>${esc(c.name)}</span>
      <span class="t">${locked ? c.level + '. szint' : `${ic('ui:coin')}${c.seed} · ${fmtTime(c.time)}`}</span></div>`;
  }).join('');
  el.innerHTML = `<div class="sp-title"><span>Vetőmagok <small class="sub">(ikon = szezonban)</small></span><button class="x" style="position:static" data-act="closeSeeds">✕</button></div><div class="sp-grid">${list}</div>`;
  el.classList.remove('hidden');
  const w = el.offsetWidth, h = el.offsetHeight;
  el.style.left = Math.max(8, Math.min(innerWidth - w - 8, sx - w / 2)) + 'px';
  el.style.top = Math.max(8, Math.min(innerHeight - h - 8, sy - h - 16)) + 'px';
}
export function closeSeedPicker() { $('#seed-picker').classList.add('hidden'); pickerPlot = null; }
MODAL_ACTIONS.closeSeeds = () => closeSeedPicker();
MODAL_ACTIONS.pickSeed = (id) => {
  const c = CROPS[id];
  if (c.level > G.S.level) { toast(`${c.name}: ${c.level}. szinttől`, 'bad'); return; }
  G.S.seedItem = id;
  const plot = pickerPlot;
  closeSeedPicker();
  setTool('seed');
  if (plot && !plot.crop) G.plant(plot, id);
  refresh();
  toast(`${c.name} kiválasztva – húzd végig a földeken a vetéshez!`, 'info', 'item:' + id);
};

// ------------------------------------------------------------------ visitor anchor for modals
export function visitorPos(id) { const p = visitorScreenAnchor(id); return p ? worldToScreen(p.x, 1.4, p.z) : null; }
export { openModal, closeModal, modalOpen, entOf };
