// All modal windows: shop, barn, production, animals, orders, market, visitors, barge, journal...
import * as G from '../core/game.js';
import {
  CROPS, TREES, ANIMALS, HOUSINGS, BUILDINGS, RECIPES, DECOS, ITEMS, CATEGORY_NAMES, EXPANSIONS, OBSTACLES,
  housingCapacity, housingUpgradeCost, buildingUpgradeCost, HOUSING_MAX_LEVEL, BUILDING_MAX_LEVEL, buildingSlots,
  MARKET_SLOTS, BARGE_LEVEL, MARKET_LEVEL, FISH, SEASONS, MASTERY, DAY_LENGTH, SEASON_DAYS,
} from '../data/content.js';
import { ACHIEVEMENTS, TIER_NAMES, DAILY_LOGIN, NPC_NAMES, xpToNext } from '../data/progression.js';
import { $, $$, esc, ic, itemIc, itemName, fmtNum, fmtTime, price, costHTML, pills } from './dom.js';
import { iconURL } from '../three/icons.js';
import { sfx, setAudio } from '../audio.js';
import { setQuality } from '../three/scene.js';
import { fishingModal, fishingActions, stopFishing } from './fishing.js';
import * as UI from './ui.js';

let cur = null;            // { name, args }
const queue = [];
export const modalOpen = () => !!cur;
export const MODAL_ACTIONS = {};

export function openModal(name, args = {}, queued = false) {
  if (queued && cur) { queue.push([name, args]); return; }
  if (cur?.name === 'fishing' && name !== 'fishing') stopFishing();
  cur = { name, args };
  UI.hidePopover?.();
  $('#modal-wrap').classList.remove('hidden');
  renderModal(true);
  sfx('open');
}
export function closeModal() {
  if (!cur) return;
  if (cur.name === 'fishing') stopFishing();
  cur = null;
  $('#modal-wrap').classList.add('hidden');
  $('#modal').innerHTML = '';
  sfx('close');
  if (queue.length) { const [n, a] = queue.shift(); setTimeout(() => openModal(n, a), 180); }
}
export function renderModal(first = false) {
  if (!cur) return;
  const m = MODALS[cur.name](cur.args);
  if (!m) { closeModal(); return; }
  const html = `
    ${m.noClose ? '' : '<button class="m-close" data-act="close">✕</button>'}
    <div class="m-head">${m.icon ? ic(m.icon) : ''}${m.title}</div>
    <div class="m-body">${m.body}</div>
    ${m.foot ? `<div class="m-foot">${m.foot}</div>` : ''}`;
  const el = $('#modal');
  el.className = m.cls || '';
  if (first || el.dataset.html !== html) {
    const body = el.querySelector('.m-body');
    const scroll = body ? body.scrollTop : 0;
    el.innerHTML = html; el.dataset.html = html;
    if (!first) { const nb = el.querySelector('.m-body'); if (nb) nb.scrollTop = scroll; }
    m.after?.(el);
  }
  tickModal();
}
// live countdowns + progress bars without re-rendering
export function tickModal() {
  if (!cur) return;
  const t = Date.now();
  $$('#modal [data-end]').forEach((e) => { e.textContent = fmtTime((Number(e.dataset.end) - t) / 1000); });
  $$('#modal [data-ps]').forEach((e) => { const s = Number(e.dataset.ps), en = Number(e.dataset.pe); e.style.width = `${Math.max(0, Math.min(1, (t - s) / (en - s))) * 100}%`; });
}
setInterval(tickModal, 500);

document.addEventListener('pointerdown', (e) => {
  if (e.target.id === 'modal-wrap' && cur && !['levelup', 'welcome', 'daily'].includes(cur.name)) closeModal();
});
MODAL_ACTIONS.close = () => closeModal();

// ------------------------------------------------------------------ helpers
const have = (id) => G.qty(id);
const reqHTML = (req) => pills(req, have);
const timer = (end) => `<b data-end="${end}">${fmtTime((end - Date.now()) / 1000)}</b>`;
const bar = (s, e) => `<div class="bar"><i data-ps="${s}" data-pe="${e}"></i></div>`;
const lockTag = (lvl) => `<span class="lock">🔒 ${lvl}. szint</span>`;
const unlocked = (lvl) => G.S.level >= lvl;

// ------------------------------------------------------------------ modal registry
const MODALS = {};

// ---------- SHOP
MODALS.shop = (a) => {
  const tab = a.tab || 'animals';
  const tabs = G.SHOP_TABS.map((t) => `<button class="tab ${t.id === tab ? 'on' : ''}" data-act="shopTab" data-arg="${t.id}">${ic(t.icon)}${t.name}</button>`).join('');
  let cards = '';
  const card = (kind, key, def, extra = '') => {
    const e = G.shopEntry(kind, key);
    const c = G.canBuy(kind, key);
    const img = kind === 'animal' ? 'item:' + def.item : 'shop:' + kind + ':' + key;
    const src = iconURL(img) || iconURL('ui:star');
    return `<div class="card ${c.locked ? 'locked' : ''}">
      ${c.locked ? lockTag(e.level) : e.owned ? `<span class="owned">${e.max !== Infinity ? `${e.owned}/${e.max}` : `×${e.owned}`}</span>` : ''}
      <div class="c-img"><img src="${src}" alt=""></div>
      <div class="c-name">${esc(def.name)}</div>
      <div class="c-meta">${extra}</div>
      <button class="btn small ${c.ok ? (e.gems ? 'purple' : '') : 'gray'}" data-act="buy" data-arg="${kind}:${key}">${price(e.cost, e.gems)}</button>
    </div>`;
  };
  if (tab === 'animals') {
    for (const [k, h] of Object.entries(HOUSINGS)) {
      const an = ANIMALS[h.animal];
      cards += card('housing', k, h, `${housingCapacity(1)}–${housingCapacity(HOUSING_MAX_LEVEL)} ${an.name.toLowerCase()} fér el`);
      cards += card('animal', h.animal, an, `${itemName(an.item)} ${fmtTime(an.time)} alatt · eszik: ${itemName(an.feed)}`);
    }
  } else if (tab === 'buildings') {
    for (const [k, b] of Object.entries(BUILDINGS)) cards += card('building', k, b, esc(b.desc));
  } else if (tab === 'trees') {
    for (const [k, t] of Object.entries(TREES)) cards += card('tree', k, t, `${t.yield} ${itemName(t.item)} / ${fmtTime(t.time)}`);
  } else if (tab === 'decos') {
    for (const [k, d] of Object.entries(DECOS)) cards += card('deco', k, d, `+${d.charm} bájpont${d.desc ? '<br>' + esc(d.desc) : ''}`);
  } else {
    for (const [id, s] of Object.entries(G.SUPPLIES)) {
      const total = id === 'bait' ? s.coins * s.qty : s.coins;
      cards += `<div class="card"><div class="c-img">${itemIc(id)}</div><div class="c-name">${s.qty} × ${esc(itemName(id))}</div>
        <div class="c-meta">${{ bait: 'Horgászathoz kell', axe: 'Fatönkökhöz, rönkökhöz', pickaxe: 'Kövekhez, sziklákhoz' }[id]}</div>
        <button class="btn small ${G.S.coins >= total ? '' : 'gray'}" data-act="buySupply" data-arg="${id}">${price(total)}</button></div>`;
    }
  }
  return { title: 'Bolt', icon: 'ui:shop', cls: 'wide', body: `<div class="tabs">${tabs}</div><div class="grid">${cards}</div>` };
};
MODAL_ACTIONS.shopTab = (t) => { cur.args.tab = t; renderModal(); sfx('click'); };
MODAL_ACTIONS.buy = (arg) => {
  const [kind, key] = arg.split(':');
  const c = G.canBuy(kind, key);
  if (!c.ok) { UI.toast(c.why, 'bad'); sfx('error'); return; }
  if (kind === 'animal') { G.buyAnimal(key); return; }
  UI.startPlacing(kind, key);
};
MODAL_ACTIONS.buySupply = (id) => G.buySupply(id);

// ---------- STORAGE / BARN
MODALS.storage = (a) => {
  const S = G.S;
  const used = G.used(), cap = G.capacity();
  const cats = {};
  for (const [id, n] of Object.entries(S.inv)) { const c = ITEMS[id]?.cat || 'goods'; (cats[c] ||= []).push([id, n]); }
  let body = `<div class="storebar ${used >= cap ? 'full' : ''}"><i style="width:${Math.min(100, (used / cap) * 100)}%"></i><span>${used} / ${cap} hely foglalt</span></div>`;
  if (!used) body += '<p class="center sub">A csűr üres. Arass le valamit!</p>';
  for (const c of Object.keys(CATEGORY_NAMES)) {
    if (!cats[c]) continue;
    body += `<h3>${CATEGORY_NAMES[c]}</h3><div class="inv">${cats[c].sort((x, y) => ITEMS[x[0]].level - ITEMS[y[0]].level).map(([id, n]) => `
      <div class="slot ${a.sel === id ? 'sel' : ''}" data-act="invSel" data-arg="${id}" title="${esc(itemName(id))}">${itemIc(id)}<span class="n">${n}</span><span class="nm">${esc(itemName(id))}</span></div>`).join('')}</div>`;
  }
  if (a.sel && S.inv[a.sel]) {
    const id = a.sel, n = S.inv[id];
    a.q = Math.max(1, Math.min(n, a.q || 1));
    body += `<div class="sellbox">${itemIc(id)}<div><b>${esc(itemName(id))}</b><div class="sub">Eladási ár: ${ITEMS[id].sell} érme / db · Van: ${n}</div>
      <div class="row"><input type="range" min="1" max="${n}" value="${a.q}" data-input="sellQ"><b id="sellQ">${a.q} db</b></div></div>
      <div class="row"><button class="btn gold" data-act="sell">Eladás: ${price(G.sellPrice(id, a.q))}</button>
      <button class="btn small blue" data-act="sellAll">Mind (${n})</button></div></div>`;
  }
  const cost = G.storageCost();
  return {
    title: 'Csűr', icon: 'ui:barn', body,
    foot: `<div class="row"><span class="sub">Bővítés +40 hely:</span> ${costHTML(cost)} <button class="btn ${G.canPay(cost) ? '' : 'gray'}" data-act="upStorage">Bővítés</button></div>`,
    after: (el) => bindInput(el, 'sellQ', (v) => { cur.args.q = v; renderModal(); }),
  };
};
MODAL_ACTIONS.invSel = (id) => { cur.args.sel = id; cur.args.q = 1; renderModal(); sfx('click'); };
MODAL_ACTIONS.sell = () => { const a = cur.args; if (G.sell(a.sel, a.q)) { a.q = 1; } };
MODAL_ACTIONS.sellAll = () => { const a = cur.args; G.sell(a.sel, G.qty(a.sel)); };
MODAL_ACTIONS.upStorage = () => G.upgradeStorage();
function bindInput(el, name, fn) {
  const i = el.querySelector(`[data-input=${name}]`);
  if (!i) return;
  i.addEventListener('input', () => { const out = el.querySelector('#' + name); if (out) out.textContent = i.value + (name === 'sellQ' ? ' db' : ''); });
  i.addEventListener('change', () => fn(Number(i.value)));
}

// ---------- PRODUCTION BUILDING
MODALS.building = (a) => {
  const b = G.getObj(a.id); if (!b) return null;
  const d = BUILDINGS[b.key];
  const q = G.queueState(b);
  const slots = G.slotsOf(b);
  let qhtml = '';
  for (let i = 0; i < slots; i++) {
    const x = q[i];
    if (!x) { qhtml += `<div class="qslot"><span class="sub" style="margin:auto">Szabad gyártóhely</span></div>`; continue; }
    const out = G.recipeOut(x.id), n = G.recipeQty(x.id);
    qhtml += `<div class="qslot ${x.done ? 'done' : 'busy'}">${itemIc(out)}<div class="q-info">${esc(RECIPES[x.id].name)}${n > 1 ? ` ×${n}` : ''}
      ${x.done ? '<div style="color:#3f8a1c">Kész!</div>' : x.progress > 0 ? `${bar(x.start, x.end)}<span class="sub">${timer(x.end)}</span>` : '<div class="sub">Sorban áll…</div>'}</div>
      ${!x.done ? `<button class="x" style="position:static" data-act="cancelJob" data-arg="${i}" title="Mégse">✕</button>` : ''}</div>`;
  }
  const recs = G.recipesOf(b.key).map((r) => {
    const locked = r.level > G.S.level;
    const c = G.canStart(b, r.id);
    const out = G.recipeOut(r.id), n = G.recipeQty(r.id);
    return `<div class="recipe ${locked ? 'locked' : c.ok ? '' : 'no'}" data-act="startJob" data-arg="${r.id}">
      <div class="r-top">${itemIc(out)}<div><div class="r-name">${esc(r.name)}${n > 1 ? ` ×${n}` : ''}</div>
      <div class="sub">${locked ? `🔒 ${r.level}. szint` : `⏱ ${fmtTime(G.recipeTime(b, r.id))} · ${ITEMS[out].sell * n} érme`}</div></div></div>
      <div class="r-ing">${reqHTML(r.in)}${r.coins ? `<span class="pill ${G.S.coins >= r.coins ? 'ok' : 'miss'}">${ic('ui:coin')}${r.coins}</span>` : ''}</div></div>`;
  }).join('');
  const done = q.filter((x) => x.done).length;
  const lvl = b.level || 1;
  const up = lvl < BUILDING_MAX_LEVEL ? buildingUpgradeCost(d, lvl) : null;
  return {
    title: `${esc(d.name)} <small style="font-size:14px">${lvl}. szint</small>`, icon: 'shop:building:' + b.key, cls: 'wide',
    body: `<div class="prod"><div class="queue"><h3>Gyártósor (${q.length}/${slots})</h3>${qhtml}
      ${done ? `<button class="btn" data-act="collectJobs">Begyűjtés (${done})</button>` : ''}
      ${q.some((x) => !x.done) ? `<button class="btn small purple" data-act="speedB">${ic('ui:gem')}${G.speedCost(G.remainingOf(b))} Gyorsítás</button>` : ''}</div>
      <div><h3>Receptek <span class="sub">— kattints a gyártáshoz</span></h3><div class="recipes">${recs}</div></div></div>`,
    foot: up ? `<div class="row"><span class="sub">Fejlesztés (${lvl + 1}. szint: ${buildingSlots(lvl + 1)} gyártóhely, gyorsabb):</span> ${costHTML(up)} <button class="btn ${G.canPay(up) ? 'gold' : 'gray'}" data-act="upB">Fejlesztés</button></div>` : '<span class="sub">Maximális szinten ✔</span>',
  };
};
MODAL_ACTIONS.startJob = (rid) => { const b = G.getObj(cur.args.id); if (RECIPES[rid].level > G.S.level) return; G.startRecipe(b, rid); };
MODAL_ACTIONS.collectJobs = () => G.collectBuilding(G.getObj(cur.args.id));
MODAL_ACTIONS.cancelJob = (i) => G.cancelRecipe(G.getObj(cur.args.id), Number(i));
MODAL_ACTIONS.speedB = () => G.speedUp(G.getObj(cur.args.id));
MODAL_ACTIONS.upB = () => G.upgradeBuilding(G.getObj(cur.args.id));

// ---------- HOUSING (animals)
MODALS.housing = (a) => {
  const h = G.getObj(a.id); if (!h) return null;
  const d = HOUSINGS[h.key], an = ANIMALS[d.animal];
  const s = G.housingSummary(h);
  const cells = h.animals.map((x, i) => {
    const st = G.animalState(x, d.animal);
    return `<div class="qslot ${st.ready ? 'done' : st.hungry ? '' : 'busy'}" style="min-height:58px">${itemIc(st.ready ? an.item : st.hungry ? an.feed : an.item)}
      <div class="q-info">${an.name} #${i + 1} ${x.happyDay === G.clock().day ? '❤️' : ''}<div class="sub">${st.ready ? 'Kész a termék!' : st.hungry ? 'Éhes' : ''}</div>
      ${!st.ready && !st.hungry ? `${bar(x.readyAt - an.time * 1000, x.readyAt)}<span class="sub">${timer(x.readyAt)}</span>` : ''}</div></div>`;
  }).join('');
  const emptyCells = Array.from({ length: s.cap - s.count }, () => `<div class="qslot"><button class="btn small ${G.canBuy('animal', d.animal).ok ? '' : 'gray'}" style="margin:auto" data-act="buyAnimal">${price(an.cost)} + ${an.name}</button></div>`).join('');
  const up = h.level < HOUSING_MAX_LEVEL ? housingUpgradeCost(d, h.level) : null;
  return {
    title: `${esc(d.name)} <small style="font-size:14px">${s.count}/${s.cap}</small>`, icon: 'item:' + an.item,
    body: `<p class="sub center">${an.name}: ${itemName(an.feed)} → ${itemName(an.item)} (${fmtTime(an.time)}). Simogasd meg őket naponta (kattints rájuk) – a boldog állat néha dupla terméket ad!</p>
      <div class="row" style="justify-content:center;margin-bottom:10px">
        <button class="btn ${s.ready ? '' : 'gray'}" data-act="collectH">${itemIc(an.item)} Begyűjtés (${s.ready})</button>
        <button class="btn blue ${s.hungry && G.has(an.feed) ? '' : 'gray'}" data-act="feedH">${itemIc(an.feed)} Etetés (${s.hungry}) · van ${G.qty(an.feed)}</button>
        ${s.busy ? `<button class="btn small purple" data-act="speedH">${ic('ui:gem')}${G.speedCost(G.remainingOf(h))}</button>` : ''}
      </div>
      <div class="queue" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">${cells}${emptyCells}</div>`,
    foot: up ? `<div class="row"><span class="sub">Bővítés (+3 hely):</span> ${costHTML(up)} <button class="btn ${G.canPay(up) ? 'gold' : 'gray'}" data-act="upH">Bővítés</button></div>` : '<span class="sub">Maximális méret ✔</span>',
  };
};
MODAL_ACTIONS.buyAnimal = () => { const h = G.getObj(cur.args.id); G.buyAnimal(HOUSINGS[h.key].animal); };
MODAL_ACTIONS.collectH = () => G.collectHousing(G.getObj(cur.args.id));
MODAL_ACTIONS.feedH = () => G.feedHousing(G.getObj(cur.args.id));
MODAL_ACTIONS.speedH = () => G.speedUp(G.getObj(cur.args.id));
MODAL_ACTIONS.upH = () => G.upgradeHousing(G.getObj(cur.args.id));

// ---------- ORDERS
MODALS.orders = () => {
  const cards = G.S.orders.map((o, i) => {
    if (o.wait) return `<div class="order wait"><div>🚚 Új megrendelés érkezik…<br>${timer(o.wait)}</div></div>`;
    const ok = G.canFulfill(o);
    return `<div class="order ${ok ? 'ready' : ''}"><button class="x" data-act="discard" data-arg="${i}" title="Elutasítás">✕</button>
      <div class="o-head">${ic('portrait:' + o.npc)}<div class="o-name">${esc(NPC_NAMES[o.npc])}</div></div>
      <div class="o-items">${reqHTML(o.items)}</div>
      <div class="o-rew">${ic('ui:coin')}${fmtNum(Math.round(o.coins * (1 + G.charmBonus() / 100)))} ${ic('ui:xp')}${o.xp} ${o.gems ? ic('ui:gem') + o.gems : ''} ${o.bonus ? Object.entries(o.bonus).map(([id, n]) => itemIc(id) + n).join('') : ''}</div>
      <button class="btn ${ok ? '' : 'gray'}" data-act="fulfill" data-arg="${i}">${ic('ui:truck')} Kiszállítás</button></div>`;
  }).join('');
  return { title: 'Megrendelések', icon: 'ui:orders', cls: 'wide', body: `<p class="sub center">Bájpont-bónusz: +${G.charmBonus()}% érme · Megrendelőhelyek: ${G.orderSlots()}</p><div class="orders">${cards}</div>` };
};
MODAL_ACTIONS.fulfill = (i) => G.fulfill(Number(i));
MODAL_ACTIONS.discard = (i) => G.discardOrder(Number(i));

// ---------- MARKET STALL
MODALS.market = (a) => {
  if (G.S.level < MARKET_LEVEL) return { title: 'Piaci stand', icon: 'ui:market', cls: 'narrow', body: `<p class="center">A piac a ${MARKET_LEVEL}. szinttől nyit ki.</p>` };
  if (a.slot != null && !G.S.market.slots[a.slot]) return marketPick(a);
  const slots = G.S.market.slots.map((s, i) => {
    if (!s) return `<div class="mslot" data-act="mSlot" data-arg="${i}"><span class="plus">+</span><span class="sub">Árucikk kirakása</span></div>`;
    if (s.sold) return `<div class="mslot sold" data-act="mCollect" data-arg="${i}">${ic('ui:coins')}<b>Eladva!</b><span>${esc(NPC_NAMES[s.npc])} vette meg</span><button class="btn small gold">${price(s.price)} Begyűjt</button></div>`;
    return `<div class="mslot full">${itemIc(s.id)}<b>${s.qty} × ${esc(itemName(s.id))}</b><span class="price">${ic('ui:coin')}${s.price}</span><span class="sub">Vevőre vár… ~${timer(s.sellAt)}</span>
      <button class="btn tiny red" data-act="mCancel" data-arg="${i}">Visszavesz</button></div>`;
  }).join('');
  return { title: 'Piaci stand', icon: 'ui:market', cls: 'wide', body: `<p class="sub center">Állítsd be te az árat! Olcsón gyorsan elkel, drágán tovább tart – de többet hoz.</p><div class="mslots">${slots}</div>` };
};
function marketPick(a) {
  const items = Object.entries(G.S.inv).filter(([, n]) => n > 0).sort((x, y) => ITEMS[y[0]].sell - ITEMS[x[0]].sell);
  let body = `<div class="inv" style="max-height:260px;overflow:auto">${items.map(([id, n]) => `<div class="slot ${a.item === id ? 'sel' : ''}" data-act="mItem" data-arg="${id}">${itemIc(id)}<span class="n">${n}</span><span class="nm">${esc(itemName(id))}</span></div>`).join('') || '<p class="sub">Üres a csűr.</p>'}</div>`;
  if (a.item && G.has(a.item)) {
    const max = Math.min(10, G.qty(a.item));
    a.q = Math.max(1, Math.min(max, a.q || 1));
    const r = G.marketRange(a.item, a.q);
    a.price = Math.max(r.min, Math.min(r.max, a.price ?? r.def));
    const ratio = a.price / r.base;
    const est = G.saleDelay(ratio) / 1.0;
    body += `<div class="pricebox" style="margin-top:10px">
      <div class="row">${itemIc(a.item)}<b>${esc(itemName(a.item))}</b><span class="sub">Alapár: ${ITEMS[a.item].sell} érme/db</span></div>
      <div class="row">Mennyiség: <input type="range" min="1" max="${max}" value="${a.q}" data-input="mq"><b id="mq">${a.q}</b></div>
      <div class="row">Ár: <input type="range" min="${r.min}" max="${r.max}" value="${a.price}" data-input="mp"><b id="mp">${a.price}</b> érme
        <button class="btn tiny blue" data-act="mPrice" data-arg="${r.min}">Olcsó</button><button class="btn tiny blue" data-act="mPrice" data-arg="${r.base}">Alapár</button><button class="btn tiny blue" data-act="mPrice" data-arg="${r.max}">Drága</button></div>
      <div class="speed">Várható eladás: <b class="${ratio > 1.4 ? 'slow' : ''}">~${fmtTime(est)}</b> (${Math.round(ratio * 100)}% az alapárhoz képest)</div>
    </div>`;
  }
  return {
    title: 'Mit árulsz?', icon: 'ui:market', cls: 'wide', body,
    foot: `<button class="btn red" data-act="mBack">Vissza</button><button class="btn ${a.item ? '' : 'gray'}" data-act="mList">Kirakás a standra</button>`,
    after: (el) => {
      bindInput(el, 'mq', (v) => { cur.args.q = v; cur.args.price = null; renderModal(); });
      bindInput(el, 'mp', (v) => { cur.args.price = v; renderModal(); });
    },
  };
}
MODAL_ACTIONS.mSlot = (i) => { Object.assign(cur.args, { slot: Number(i), item: null, q: 1, price: null }); renderModal(); };
MODAL_ACTIONS.mItem = (id) => { Object.assign(cur.args, { item: id, q: 1, price: null }); renderModal(); sfx('click'); };
MODAL_ACTIONS.mPrice = (p) => { cur.args.price = Number(p); renderModal(); };
MODAL_ACTIONS.mBack = () => { cur.args.slot = null; renderModal(); };
MODAL_ACTIONS.mList = () => { const a = cur.args; if (a.item && G.listItem(a.slot, a.item, a.q, a.price)) { a.slot = null; a.item = null; renderModal(); } };
MODAL_ACTIONS.mCancel = (i) => G.cancelListing(Number(i));
MODAL_ACTIONS.mCollect = (i) => G.collectSale(Number(i));

// ---------- VISITOR
MODALS.visitor = (a) => {
  const list = G.S.visitors;
  if (!list.length) return null;
  const v = list.find((x) => x.id === a.id) || list[0];
  a.id = v.id;
  const ok = Object.entries(v.items).every(([k, q]) => G.has(k, q));
  const others = list.length > 1 ? `<div class="row" style="justify-content:center;margin-top:8px">${list.map((x) => `<button class="tab ${x.id === v.id ? 'on' : ''}" data-act="visSel" data-arg="${x.id}">${ic('portrait:' + x.npc)}${esc(NPC_NAMES[x.npc])}</button>`).join('')}</div>` : '';
  return {
    title: esc(NPC_NAMES[v.npc]), icon: 'ui:visitor', cls: 'narrow',
    body: `<div class="center"><img src="${iconURL('portrait:' + v.npc)}" style="width:110px;height:110px;border-radius:24px;background:linear-gradient(#cdeeff,#8ccff0);border:4px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.2)">
      <p style="font-weight:600">„Jó napot! Megvenném ezeket, jó áron!”</p>
      <div class="row" style="justify-content:center">${reqHTML(v.items)}</div>
      <p class="o-rew row" style="justify-content:center;font-weight:700">${ic('ui:coin')}${fmtNum(Math.round(v.coins * (1 + G.charmBonus() / 100)))} ${ic('ui:xp')}${v.xp}</p>
      <p class="sub">Még ${timer(v.leaveAt)} -ig vár.</p></div>${others}`,
    foot: `<button class="btn red" data-act="visNo">Nem adom</button><button class="btn ${ok ? '' : 'gray'}" data-act="visYes">Eladom!</button>`,
  };
};
MODAL_ACTIONS.visSel = (id) => { cur.args.id = Number(id); renderModal(); };
MODAL_ACTIONS.visYes = () => { if (G.serveVisitor(cur.args.id)) { if (!G.S.visitors.length) closeModal(); else { cur.args.id = G.S.visitors[0].id; renderModal(); } } };
MODAL_ACTIONS.visNo = () => { G.declineVisitor(cur.args.id); if (!G.S.visitors.length) closeModal(); else { cur.args.id = G.S.visitors[0].id; renderModal(); } };

// ---------- BARGE
MODALS.barge = () => {
  const b = G.S.barge;
  if (G.S.level < BARGE_LEVEL) return { title: 'Uszály', icon: 'ui:boat', cls: 'narrow', body: `<p class="center">Az uszály a ${BARGE_LEVEL}. szinttől köt ki a folyón. Nagy rakományokért sok érmét és drágakövet ad!</p>` };
  if (b.state !== 'docked') return { title: 'Uszály', icon: 'ui:boat', cls: 'narrow', body: `<p class="center">Az uszály úton van.<br>Visszaérkezik: ${timer(b.at)}</p>` };
  const crates = b.crates.map((c, i) => `<div class="crate ${c.filled ? 'filled' : ''}">${itemIc(c.id)}<span>${c.filled ? '✔ Megrakva' : `${G.qty(c.id)}/${c.qty} ${esc(itemName(c.id))}`}</span>
    ${c.filled ? '' : `<span class="o-rew">${ic('ui:coin')}${c.coins} ${ic('ui:xp')}${c.xp}</span><button class="btn small ${G.has(c.id, c.qty) ? '' : 'gray'}" data-act="crate" data-arg="${i}">Berakás</button>`}</div>`).join('');
  return {
    title: 'Uszály a kikötőben', icon: 'ui:boat',
    body: `<p class="center sub">Indulásig: ${timer(b.leaveAt)} · Ha mind a 6 láda megtelik: ${ic('ui:gem')}${b.bonus.gems} + ${Object.entries(b.bonus.items).map(([id, n]) => itemIc(id) + n).join('')}</p><div class="crates">${crates}</div>`,
  };
};
MODAL_ACTIONS.crate = (i) => G.fillCrate(Number(i));

// ---------- FISHING
MODALS.fishing = (a) => fishingModal(a);
Object.assign(MODAL_ACTIONS, fishingActions);

// ---------- EXPANSION
MODALS.expand = () => {
  const nx = G.nextExpansion();
  if (!nx) return { title: 'Bővítés', icon: 'ui:map', cls: 'narrow', body: '<p class="center">A farm elérte a legnagyobb méretét. Gratulálok!</p>' };
  const cost = { coins: nx.coins, plank: nx.plank, brick: nx.brick };
  const okLvl = G.S.level >= nx.level;
  return {
    title: 'Új földterület', icon: 'ui:map', cls: 'narrow',
    body: `<div class="center"><p>Új méret: <b>${nx.x1 - nx.x0} × ${nx.y1 - nx.y0}</b> mező</p>
      <p>${costHTML(cost)}</p>
      <p class="sub">Az új területen fák, kövek és bokrok lesznek – takarítsd el őket fáért és kőért!<br>Deszkát és téglát a Műhelyben készíthetsz.</p>
      ${okLvl ? '' : `<p style="color:#a8302a;font-weight:700">Szükséges szint: ${nx.level}</p>`}</div>`,
    foot: `<button class="btn ${okLvl && G.canPay(cost) ? 'gold' : 'gray'}" data-act="doExpand">Megveszem!</button>`,
  };
};
MODAL_ACTIONS.doExpand = () => { if (G.expand()) closeModal(); };

// ---------- DAILY LOGIN
MODALS.daily = () => {
  const s = G.S.daily.streak;
  const days = DAILY_LOGIN.map((r, i) => `<div class="day ${i + 1 < s ? 'past' : i + 1 === s ? 'today' : ''}">${i + 1}. nap
    ${ic(r.gems ? 'ui:gem' : r.items ? 'item:' + Object.keys(r.items)[0] : 'ui:coins')}${r.coins}${r.gems ? ` +${r.gems}💎` : ''}</div>`).join('');
  return {
    title: 'Napi jutalom', icon: 'ui:gift', noClose: true,
    body: `<p class="center">Gyere vissza minden nap – egyre nagyobb ajándék vár! Sorozat: <b>${s}. nap</b></p><div class="days">${days}</div>`,
    foot: `<button class="btn gold" data-act="claimDaily">Átveszem!</button>`,
  };
};
MODAL_ACTIONS.claimDaily = () => { G.claimDaily(); closeModal(); };

// ---------- JOURNAL (tasks, achievements, mastery, stats)
MODALS.journal = (a) => {
  const tab = a.tab || 'tasks';
  const tabs = [['tasks', 'Napi feladatok', 'ui:calendar'], ['ach', 'Kitüntetések', 'ui:trophy'], ['mastery', 'Mesterség', 'ui:star'], ['stats', 'Statisztika', 'ui:orders']]
    .map(([id, n, i]) => `<button class="tab ${tab === id ? 'on' : ''}" data-act="jTab" data-arg="${id}">${ic(i)}${n}</button>`).join('');
  let body = '';
  if (tab === 'tasks') {
    const list = G.S.tasks?.list || [];
    body = `<div class="list">${list.map((t, i) => {
      const p = G.taskProgress(t);
      return `<div class="ach"><div class="medal ${t.claimed ? 't3' : ''}">${t.claimed ? '✔' : '📋'}</div><div style="flex:1"><b>${esc(G.taskText(t))}</b>
        <div class="bar"><i style="width:${(p.v / t.n) * 100}%"></i></div><span class="sub">${p.v}/${t.n} · ${ic('ui:coin')}${t.coins} ${ic('ui:xp')}${t.xp}</span></div>
        ${t.claimed ? '<span class="sub">Kész</span>' : `<button class="btn small ${p.done ? '' : 'gray'}" data-act="claimTask" data-arg="${i}">Begyűjt</button>`}</div>`;
    }).join('')}</div><p class="center sub">Mindhárom teljesítése: +2 ${ic('ui:gem')} · Új feladatok minden nap!</p>`;
  } else if (tab === 'ach') {
    body = `<div class="list">${ACHIEVEMENTS.map((x) => {
      const t = G.S.ach[x.id] || 0, v = G.achValue(x), next = x.tiers[Math.min(t, 2)];
      return `<div class="ach"><div class="medal ${t ? 't' + t : ''}">${t ? '🏅' : '·'}</div><div style="flex:1"><b>${esc(x.name)}</b> ${t ? `<span class="sub">(${TIER_NAMES[t - 1]})</span>` : ''}
        <div class="sub">${esc(x.desc.replace('{n}', fmtNum(next)))}</div><div class="bar"><i style="width:${Math.min(100, (v / next) * 100)}%"></i></div></div><span class="sub">${fmtNum(Math.min(v, next))}/${fmtNum(next)}</span></div>`;
    }).join('')}</div>`;
  } else if (tab === 'mastery') {
    body = `<p class="sub center">Arass le sokat egy növényből: ★ = 10%-kal gyorsabb, ★★/★★★ = nagyobb eséllyel +1 termés. Határok: ${MASTERY.join(' / ')}</p><div class="mastery">${Object.entries(CROPS).map(([id, c]) => {
      const st = G.masteryStars(id); const n = G.S.stats['harvest_' + id] || 0;
      return `<div class="m">${itemIc(id)}<div>${esc(c.name)}<div class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div><span class="sub">${n} aratás</span></div></div>`;
    }).join('')}</div>`;
  } else {
    const st = G.S.stats;
    const rows = [['Aratás', st.harvest], ['Vetés', st.plant], ['Öntözés', st.water], ['Etetés', st.feed], ['Gyártott termék', st.craft], ['Megrendelés', st.order],
      ['Piaci eladás', st.market_sold], ['Látogató', st.visitor], ['Kifogott hal', st.fish], ['Takarított akadály', st.clear], ['Uszály', st.barge], ['Keresett érme', st.coinsEarned], ['Bájpont', G.charm()]];
    body = `<div class="stats">${rows.map(([n, v]) => `<div class="stat"><span>${n}</span><b>${fmtNum(v || 0)}</b></div>`).join('')}</div>`;
  }
  return { title: 'Gazda naplója', icon: 'ui:trophy', body: `<div class="tabs">${tabs}</div>${body}` };
};
MODAL_ACTIONS.jTab = (t) => { cur.args.tab = t; renderModal(); sfx('click'); };
MODAL_ACTIONS.claimTask = (i) => G.claimTask(Number(i));

// ---------- CALENDAR
MODALS.calendar = () => {
  const c = G.clock();
  const crops = Object.entries(CROPS).filter(([, x]) => x.seasons.includes(c.season) && x.level <= G.S.level);
  const next = SEASONS[(c.seasonIndex + 1) % 4];
  const daysLeft = SEASON_DAYS - c.dayOfSeason + 1;
  return {
    title: `${c.seasonName}, ${c.dayOfSeason}. nap · ${c.year}. év`, icon: 'ui:' + c.season, cls: 'narrow',
    body: `<p class="center">Egy játéknap ${DAY_LENGTH / 60} perc. Egy évszak ${SEASON_DAYS} napig tart.<br>Következő évszak: <b>${next.name}</b> (${daysLeft} nap múlva)</p>
      <h3>Szezonális vetőmagok most</h3><div class="row">${crops.map(([id, x]) => `<span class="pill">${itemIc(id)}${esc(x.name)}</span>`).join('') || '<span class="sub">Nincs – használd az üvegházat!</span>'}</div>
      <p class="sub">Szezonon kívül is vethetsz, de lassabban nő. Esőben a vetések maguktól öntöződnek. Télen a búza, káposzta, hagyma, fokhagyma és a fodros kel érzi jól magát.</p>`,
  };
};

// ---------- LEVEL UP
MODALS.levelup = (a) => {
  const L = a.level;
  const un = [];
  for (const [id, c] of Object.entries(CROPS)) if (c.level === L) un.push(['item:' + id, c.name]);
  for (const [, t] of Object.entries(TREES)) if (t.level === L) un.push(['item:' + t.item, t.name]);
  for (const [k, h] of Object.entries(HOUSINGS)) if (h.level === L) un.push(['shop:housing:' + k, h.name]);
  for (const [, x] of Object.entries(ANIMALS)) if (x.level === L) un.push(['item:' + x.item, x.name]);
  for (const [k, b] of Object.entries(BUILDINGS)) if (b.level === L) un.push(['shop:building:' + k, b.name]);
  for (const [id, r] of Object.entries(RECIPES)) if (r.level === L && !r.out) un.push(['item:' + id, r.name]);
  for (const [k, d] of Object.entries(DECOS)) if (d.level === L) un.push(['shop:deco:' + k, d.name]);
  const nx = EXPANSIONS.find((e) => e.level === L);
  return {
    title: 'Szintlépés!', icon: 'ui:level', noClose: true, cls: 'narrow',
    body: `<div class="lvlup" style="position:relative;overflow:hidden"><div class="rays"></div><div class="big">${L}</div>
      <p class="row" style="justify-content:center;font-weight:700">${ic('ui:coin')}+${a.coins} ${ic('ui:gem')}+${a.gems}</p>
      ${un.length ? `<h3>Új dolgok érhetők el:</h3><div class="unlocks">${un.slice(0, 12).map(([i, n]) => `<div class="unlock"><img src="${iconURL(i)}">${esc(n)}</div>`).join('')}</div>` : ''}
      ${nx ? '<p><b>Új földterület vásárolható!</b></p>' : ''}</div>`,
    foot: '<button class="btn gold" data-act="close">Szuper!</button>',
  };
};

// ---------- SETTINGS
MODALS.settings = (a) => {
  const s = G.S.settings;
  const q = s.quality || 'high';
  return {
    title: 'Beállítások', icon: 'ui:settings', cls: 'narrow',
    body: `<div class="list">
      <div class="row spread"><b>Farm neve</b><input id="farmname" maxlength="24" value="${esc(G.S.farmName)}" style="font:inherit;padding:4px 8px;border-radius:10px;border:2px solid #ecd9ad;width:180px"></div>
      <div class="row spread"><b>Hangeffektek</b><button class="btn small ${s.sfx ? '' : 'gray'}" data-act="tgl" data-arg="sfx">${s.sfx ? 'Be' : 'Ki'}</button></div>
      <div class="row spread"><b>Zene</b><button class="btn small ${s.music ? '' : 'gray'}" data-act="tgl" data-arg="music">${s.music ? 'Be' : 'Ki'}</button></div>
      <div class="row spread"><b>Grafika</b><span>${['low', 'medium', 'high'].map((x) => `<button class="btn tiny ${q === x ? '' : 'gray'}" data-act="quality" data-arg="${x}">${{ low: 'Gyors', medium: 'Közepes', high: 'Szép' }[x]}</button>`).join(' ')}</span></div>
      <h3>Irányítás</h3>
      <p class="sub">Bal egér: művelet / húzva sorozat (pl. vetés), üres helyen húzva mozgatás · Jobb vagy középső egér: mozgatás · Görgő / csípés: nagyítás · Q/E: forgatás · 1–7: eszközök · B: bolt · I: csűr · O: rendelések · R: forgatás lerakáskor · Esc: mégse</p>
      <h3>Mentés</h3>
      <div class="row"><button class="btn small blue" data-act="export">Mentés exportálása</button><button class="btn small blue" data-act="import">Importálás</button><button class="btn small red" data-act="reset">Új játék</button></div>
      ${a.exported ? `<textarea readonly style="width:100%;height:70px;font-size:11px">${esc(a.exported)}</textarea>` : ''}
    </div>`,
    after: (el) => { const i = el.querySelector('#farmname'); i?.addEventListener('change', () => { const v = i.value.trim().slice(0, 24); if (v) { G.S.farmName = v; G.changed(); } }); },
  };
};
MODAL_ACTIONS.tgl = (k) => { G.S.settings[k] = !G.S.settings[k]; setAudio(G.S.settings); renderModal(); G.save(); };
MODAL_ACTIONS.quality = (q) => { G.S.settings.quality = q; setQuality(q); renderModal(); G.save(); };
MODAL_ACTIONS.export = () => { cur.args.exported = G.exportSave(); renderModal(); };
MODAL_ACTIONS.import = () => {
  const s = prompt('Illeszd be a mentést:');
  if (!s) return;
  if (G.importSave(s)) { UI.toast('Mentés betöltve!', 'good'); closeModal(); } else UI.toast('Hibás mentés.', 'bad');
};
MODAL_ACTIONS.reset = () => openModal('confirm', { title: 'Új játék', text: 'Biztosan elölről kezded? A mostani farm elveszik!', ok: 'Igen, új játék', fn: () => G.resetGame() });

// ---------- CONFIRM
MODALS.confirm = (a) => ({ title: esc(a.title), cls: 'narrow', body: `<p class="center">${a.text}</p>`, foot: `<button class="btn gray" data-act="close">Mégse</button><button class="btn red" data-act="confirmOk">${esc(a.ok || 'OK')}</button>` });
MODAL_ACTIONS.confirmOk = () => { const fn = cur.args.fn; closeModal(); fn?.(); };
export function confirmBox(title, text, ok, fn) { openModal('confirm', { title, text, ok, fn }); }

// ---------- WELCOME + AWAY
MODALS.welcome = () => ({
  title: 'Üdv a Pipacs Tanyán!', icon: 'ui:heart', noClose: true,
  body: `<div class="center"><img src="${iconURL('portrait:1')}" style="width:110px;height:110px;border-radius:24px;background:linear-gradient(#cdeeff,#8ccff0);border:4px solid #fff">
    <p style="font-size:17px">„Szervusz, szomszéd! Gazsi bácsi vagyok. Rád hagytam ezt a kis tanyát – segítek az első lépésekben!”</p>
    <p class="sub">Kattints az érett búzára az aratáshoz, az üres földre a vetéshez. A bal felső sarokban mindig látod a következő feladatot, a <b>?</b> gomb megmutatja, hova kattints.</p>
    <p class="sub">Az idő a valóságban is telik: a növények akkor is nőnek, amikor nem játszol. Váltakoznak az évszakok és az időjárás is!</p></div>`,
  foot: '<button class="btn gold" data-act="close">Kezdjük!</button>',
});
MODALS.away = (a) => {
  const s = a.sum;
  const lines = [
    [s.crops, 'item:wheat', 'érett termés'], [s.trees, 'item:apple', 'szedhető fa'], [s.animals, 'item:egg', 'állati termék'],
    [s.goods, 'ui:check', 'kész termék'], [s.sold, 'ui:coins', 'piaci eladás'], [s.orders, 'ui:orders', 'teljesíthető rendelés'], [s.visitors, 'ui:visitor', 'látogató'],
  ].filter((l) => l[0]);
  return {
    title: 'Üdv újra!', icon: 'ui:heart', cls: 'narrow',
    body: `<p class="center">Távol voltál: <b>${fmtTime(a.away / 1000)}</b>. Ez történt közben:</p>
      <div class="list">${lines.map(([n, i, t]) => `<div class="ach">${ic(i)}<b style="flex:1">${t}</b><b>${n}</b></div>`).join('') || '<p class="center sub">Csend volt a tanyán.</p>'}</div>`,
    foot: '<button class="btn" data-act="close">Irány dolgozni!</button>',
  };
};
