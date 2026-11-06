// Fishing minigame: cast → wait for a bite → strike in time → reel (keep the fish inside the
// green zone by holding the button / mouse / space) → catch.
import * as G from '../core/game.js';
import { FISH, FISHING_LEVEL, ITEMS } from '../data/content.js';
import { $, esc, ic, itemIc, itemName } from './dom.js';
import { iconURL } from '../three/icons.js';
import { sfx } from '../audio.js';

const F = { phase: 'idle', raf: 0, fish: null, t: 0, zone: 0.4, zoneV: 0, fishY: 0.5, fishV: 0, fishT: 0.5, prog: 0.3, hold: false, last: 0, result: null };

export function fishingModal() {
  if (G.S.level < FISHING_LEVEL) return { title: 'Horgászat', icon: 'ui:fishing', cls: 'narrow', body: `<p class="center">Horgászni a ${FISHING_LEVEL}. szinttől tudsz.</p>` };
  return {
    title: 'Horgászat a tavon', icon: 'ui:fishing',
    body: `<div class="fish-wrap">
      <div class="fish-scene" id="fs"><div class="line" id="fline"></div><div class="ripple" id="fripple" style="display:none"></div><div class="bobber" id="fbob" style="display:none"></div><div class="msg" id="fmsg">Dobj be a horgot!</div></div>
      <div class="reel" id="freel"><div class="zone" id="fzone"></div><img class="fishy" id="ffish" src="${iconURL('item:perch')}"><div class="catch" id="fcatch"></div></div>
    </div>
    <div class="fish-info"><span>${itemIc('bait')} Csali: <b id="fbait">${G.qty('bait')}</b></span><span class="sub">Tipp: este a harcsa, ősszel a csuka, tavasszal a pisztráng harap jobban.</span></div>`,
    foot: `<button class="btn blue" data-act="fishBuy">${ic('ui:coin')} Csali (5 db)</button><button class="btn gold" id="fbtn" data-act="fishAct">Bedobás!</button>`,
    after: () => { syncDom(); },
  };
}

export const fishingActions = {
  fishAct: () => {
    if (F.phase === 'idle' || F.phase === 'result') cast();
    else if (F.phase === 'bite') strike();
  },
  fishBuy: () => { G.buySupply('bait'); syncDom(); },
};

function cast() {
  const fish = G.startCast();
  if (!fish) return;
  F.fish = fish; F.phase = 'wait'; F.t = 0; F.waitFor = 1.2 + Math.random() * 3.5;
  sfx('cast');
  ensureLoop();
}
function strike() {
  F.phase = 'reel'; F.t = 0; F.prog = 0.3; F.zone = 0.35; F.zoneV = 0; F.fishY = 0.5; F.fishV = 0; F.fishT = 0.5;
  sfx('click');
}
function finish(win) {
  F.phase = 'result';
  F.result = win ? F.fish : null;
  if (win) { G.landFish(F.fish); sfx('quest'); } else { G.lostFish(); sfx('error'); }
  syncDom();
}

function ensureLoop() {
  if (F.raf) return;
  F.last = performance.now();
  const step = (now) => {
    const dt = Math.min(0.05, (now - F.last) / 1000); F.last = now;
    update(dt);
    if (!document.getElementById('fs')) { F.raf = 0; F.phase = 'idle'; return; }
    F.raf = requestAnimationFrame(step);
  };
  F.raf = requestAnimationFrame(step);
}
export function stopFishing() { if (F.raf) cancelAnimationFrame(F.raf); F.raf = 0; F.phase = 'idle'; F.hold = false; }

function update(dt) {
  F.t += dt;
  if (F.phase === 'wait' && F.t > F.waitFor) { F.phase = 'bite'; F.t = 0; sfx('splash'); }
  else if (F.phase === 'bite' && F.t > 1.0) { F.phase = 'result'; F.result = null; G.lostFish(); sfx('error'); F.missed = true; }
  else if (F.phase === 'reel') reel(dt);
  syncDom();
}
function reel(dt) {
  const d = FISH[F.fish].difficulty;
  // fish darts to new random targets; harder fish move more often and further
  if (Math.random() < dt * (0.6 + d * 0.5)) F.fishT = Math.max(0.05, Math.min(0.95, F.fishY + (Math.random() - 0.5) * (0.4 + d * 0.15)));
  F.fishV += (F.fishT - F.fishY) * dt * (3 + d * 1.6);
  F.fishV *= 0.9;
  F.fishY = Math.max(0.02, Math.min(0.98, F.fishY + F.fishV * dt * 10));
  // player zone: hold to rise, gravity otherwise
  F.zoneV += (F.hold ? 2.4 : -2.0) * dt;
  F.zoneV *= 0.93;
  F.zone += F.zoneV * dt;
  const zh = 0.24 - d * 0.015;
  if (F.zone < 0) { F.zone = 0; F.zoneV *= -0.3; }
  if (F.zone > 1 - zh) { F.zone = 1 - zh; F.zoneV *= -0.3; }
  const inside = F.fishY >= F.zone && F.fishY <= F.zone + zh;
  F.prog += (inside ? 0.32 : -0.22 - d * 0.03) * dt;
  F.zh = zh;
  if (F.prog >= 1) finish(true);
  else if (F.prog <= 0) finish(false);
}

function syncDom() {
  const fs = document.getElementById('fs'); if (!fs) return;
  const bob = $('#fbob'), rip = $('#fripple'), msg = $('#fmsg'), btn = $('#fbtn'), line = $('#fline');
  const reel = $('#freel'), zone = $('#fzone'), fishy = $('#ffish'), cat = $('#fcatch');
  $('#fbait').textContent = G.qty('bait');
  const p = F.phase;
  bob.style.display = p === 'wait' || p === 'bite' ? '' : 'none';
  line.style.display = p === 'wait' || p === 'bite' || p === 'reel' ? '' : 'none';
  rip.style.display = p === 'wait' || p === 'bite' ? '' : 'none';
  bob.classList.toggle('bite', p === 'bite');
  reel.style.opacity = p === 'reel' ? 1 : 0.35;
  if (p === 'idle') { msg.textContent = 'Dobj be a horgot!'; btn.textContent = 'Bedobás!'; btn.className = 'btn gold'; }
  else if (p === 'wait') { msg.textContent = 'Várj a kapásra…'; btn.textContent = 'Várakozás…'; btn.className = 'btn gray'; }
  else if (p === 'bite') { msg.textContent = 'KAPÁS! Gyorsan!'; btn.textContent = 'Bevágás!'; btn.className = 'btn red'; }
  else if (p === 'reel') { msg.textContent = 'Tartsd lenyomva a gombot / egeret, hogy a zöld sáv a halon maradjon!'; btn.textContent = 'Húzd! (tartsd)'; btn.className = 'btn blue'; }
  else if (p === 'result') {
    if (F.result) { msg.innerHTML = `<img src="${iconURL('item:' + F.result)}" style="width:90px;height:90px;display:block;margin:0 auto"> ${esc(itemName(F.result))}! (+${ITEMS[F.result].xp} XP)`; }
    else msg.textContent = F.missed ? 'Elszalasztottad a kapást…' : 'Elúszott! Próbáld újra.';
    F.missed = false;
    btn.textContent = 'Újra dobás!'; btn.className = 'btn gold';
  }
  if (p === 'reel') {
    const H = reel.clientHeight;
    zone.style.height = (F.zh || 0.24) * H + 'px';
    zone.style.bottom = F.zone * H + 'px';
    fishy.style.top = (1 - F.fishY) * H + 'px';
    fishy.src = iconURL('item:' + F.fish);
    cat.style.height = Math.max(0, Math.min(1, F.prog)) * 100 + '%';
  }
}

// hold controls for reeling (pointer anywhere on the modal button/reel, or space)
const down = (e) => { if (F.phase !== 'reel') return; if (e.type === 'keydown' && e.code !== 'Space') return; if (e.type === 'keydown') e.preventDefault(); F.hold = true; };
const up = (e) => { if (e.type === 'keyup' && e.code !== 'Space') return; F.hold = false; };
addEventListener('pointerdown', (e) => { if (F.phase === 'reel' && e.target.closest('#modal')) down(e); });
addEventListener('pointerup', up);
addEventListener('pointercancel', up);
addEventListener('keydown', (e) => { if (F.phase === 'reel' && e.code === 'Space') down(e); else if (e.code === 'Space' && document.getElementById('fs') && !e.repeat) { e.preventDefault(); fishingActions.fishAct(); } });
addEventListener('keyup', up);
