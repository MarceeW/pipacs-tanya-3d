// Pointer, touch and keyboard handling for the 3D farm.
import * as G from './core/game.js';
import { OBSTACLES, ANIMALS, HOUSINGS } from './data/content.js';
import { cam, panBy, zoomAt, rotate, screenToGround, clampTarget } from './three/scene.js';
import { pickAt, tileAt, setGhost, setHover } from './three/world.js';
import * as UI from './ui/ui.js';
import { openModal, closeModal, modalOpen, confirmBox } from './ui/modals.js';
import { unlockAudio, sfx } from './audio.js';

const pointers = new Map();
let mode = null, start = null, lastTile = null, pinch = null, spaceDown = false, actKind = null, panStart = null;
let hoverT = 0;

// What does `tool` do on object/tile? Returns [kind, fn] or null.
function actionFor(tool, x, y, o = G.objAt(x, y)) {
  if (tool === 'plow') return !o && G.inFarm(x, y) ? ['plow', () => G.plow(x, y)] : null;
  if (!o) return null;
  if (tool === 'seed') return o.type === 'plot' && !o.crop ? ['plant', () => G.plant(o)] : null;
  if (tool === 'water') return o.type === 'plot' && G.cropState(o)?.thirsty ? ['water', () => G.water(o)] : null;
  const ready = () => {
    if (o.type === 'plot' && G.cropState(o)?.ready) return ['harvest', () => G.harvest(o)];
    if (o.type === 'tree' && G.treeState(o).ready) return ['harvest', () => G.harvestTree(o)];
    if (o.type === 'housing' && G.housingSummary(o).ready) return ['harvest', () => G.collectHousing(o)];
    if (o.type === 'building' && G.queueState(o).some((q) => q.done)) return ['harvest', () => G.collectBuilding(o)];
    return null;
  };
  if (tool === 'harvest') return ready();
  if (tool === 'hand') {
    const r = ready(); if (r) return r;
    if (o.type === 'plot') {
      const st = G.cropState(o);
      if (st?.thirsty) return ['water', () => G.water(o)];
    }
    if (o.type === 'housing') { const s = G.housingSummary(o); if (s.hungry && G.has(ANIMALS[HOUSINGS[o.key].animal].feed)) return ['feed', () => G.feedHousing(o)]; }
    if (o.type === 'obstacle' && !OBSTACLES[o.key].tool && !OBSTACLES[o.key].coins) return ['clear', () => G.clearObstacle(o)];
  }
  return null;
}
// objects whose click opens a panel instead of starting a drag action
const panelObj = (o) => o && (o.type === 'building' || o.type === 'fixed');

// Single click (no drag) on the world.
function click(sx, sy) {
  const tool = UI.state.tool;
  const hit = pickAt(sx, sy);
  if (UI.state.placing || UI.state.moving) return placeAt(sx, sy);
  if (hit.special === 'expand') { openModal('expand'); return; }
  if (hit.special === 'barge') { openModal('barge'); return; }
  if (hit.visitorId) { openModal('visitor', { id: hit.visitorId }); return; }
  const o = hit.obj;
  const t = hit.tile || (o ? { x: o.x, y: o.y } : null);
  if (tool === 'move') { if (o && G.movable(o)) { UI.startMoving(o); sfx('click'); } else if (o) UI.toast('Ezt nem lehet áthelyezni.', 'bad'); return; }
  if (tool === 'remove') {
    if (!o) return;
    if (o.type === 'obstacle') { G.clearObstacle(o); return; }
    if (!G.removable(o)) { UI.toast('Ezt nem bonthatod le.', 'bad'); sfx('error'); return; }
    if (o.type === 'plot' && !o.crop) { G.removeObj(o); return; }
    const r = G.refundOf(o);
    confirmBox(`${G.objName(o)} eltávolítása`, r ? `Visszakapsz <b>${r}</b> érmét.` : 'Ezért nem jár visszatérítés.', 'Eltávolítás', () => G.removeObj(o));
    return;
  }
  // pets
  if (o && o.type === 'deco' && o.key === 'dog' && G.S.pets.dogFind) { G.collectDogFind(); return; }
  if (o && o.type === 'deco' && (o.key === 'dog' || o.key === 'cat')) { G.bus.emit('fx', { type: 'hearts', x: o.x + 0.5, y: o.y + 0.5 }); sfx('animal_' + o.key); }
  // petting a specific animal inside a housing
  if (o && o.type === 'housing' && hit.animalIndex != null && tool === 'hand') {
    const a = o.animals[hit.animalIndex];
    const key = HOUSINGS[o.key].animal;
    if (a && !G.animalState(a, key).ready && G.petAnimal(o, hit.animalIndex)) return;
  }
  const act = t ? actionFor(tool, t.x, t.y, o) : null;
  if (act) { act[1](); return; }
  if (!o) { UI.hidePopover(); UI.closeSeedPicker(); return; }
  if (o.type === 'plot' && !o.crop && (tool === 'hand' || tool === 'seed')) { UI.openSeedPicker(sx, sy, o); return; }
  if (o.type === 'fixed') {
    const m = { barn: ['storage', {}], board: ['orders'], truck: ['orders'], market: ['market', {}], dock: ['barge'], pier: ['fishing'], house: G.S.daily.pending ? ['daily'] : ['journal', { tab: 'tasks' }] }[o.key];
    if (m) openModal(m[0], m[1] || {});
    return;
  }
  if (o.type === 'building') { openModal('building', { id: o.id }); return; }
  if (o.type === 'housing') { openModal('housing', { id: o.id }); return; }
  UI.inspect(o, sx, sy);
}

function placeAt(sx, sy) {
  const g = ghostSpec(sx, sy);
  if (!g) return;
  if (UI.state.moving) { if (G.moveObj(UI.state.moving.obj, g.x, g.y, g.rot)) UI.cancelPlacing(); return; }
  const p = UI.state.placing;
  const o = G.buyPlace(p.kind, p.key, g.x, g.y, g.rot);
  if (o) {
    const again = (p.kind === 'deco' || p.kind === 'tree') && G.canBuy(p.kind, p.key).ok;
    if (!again) UI.cancelPlacing();
  }
}
function ghostSpec(sx, sy) {
  const t = tileAt(sx, sy);
  if (!t) return null;
  const mv = UI.state.moving, pl = UI.state.placing;
  if (!mv && !pl) return null;
  const n = mv ? G.sizeOf(mv.obj) : G.shopEntry(pl.kind, pl.key).size;
  const x = t.x - Math.floor((n - 1) / 2), y = t.y - Math.floor((n - 1) / 2);
  const ok = mv ? G.canPlace(x, y, n, mv.obj) : G.canPlace(x, y, n) && G.canBuy(pl.kind, pl.key).ok;
  return { kind: mv ? mv.obj.type : pl.kind, key: mv ? mv.obj.key : pl.key, x, y, size: n, rot: (mv || pl).rot, ok, moving: mv?.obj };
}

function rel(e) { return { x: e.clientX, y: e.clientY }; }

export function initInput(canvas) {
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    unlockAudio();
    canvas.setPointerCapture(e.pointerId);
    const p = rel(e);
    pointers.set(e.pointerId, p);
    UI.tooltip(null);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      mode = 'pinch'; return;
    }
    start = { ...p };
    panStart = screenToGround(p.x, p.y);
    const t = tileAt(p.x, p.y);
    lastTile = t;
    if (e.button === 1 || e.button === 2 || spaceDown) { mode = 'pan'; return; }
    if (UI.state.placing || UI.state.moving) { mode = 'pending'; return; }
    const hit = pickAt(p.x, p.y);
    const o = hit.obj;
    if (t && !panelObj(o) && !hit.visitorId && !hit.special && hit.animalIndex == null) {
      const act = actionFor(UI.state.tool, t.x, t.y, o);
      if (act && o?.type !== 'housing') { act[1](); actKind = act[0]; mode = 'act'; return; }
    }
    mode = 'pending';
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = rel(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
    if (mode === 'pinch' && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      zoomAt(cx, cy, d / pinch.d);
      const g0 = screenToGround(pinch.cx, pinch.cy), g1 = screenToGround(cx, cy);
      if (g0 && g1) panBy(g0.x - g1.x, g0.z - g1.z);
      pinch = { d, cx, cy }; return;
    }
    if (UI.state.placing || UI.state.moving) setGhost(ghostSpec(p.x, p.y));
    if (e.pointerType === 'mouse' && !pointers.size) {
      const n = performance.now();
      if (n - hoverT > 60) {
        hoverT = n;
        const hit = pickAt(p.x, p.y);
        const o = hit.obj;
        setHover(UI.state.placing || UI.state.moving ? null : o);
        const t = hit.tile;
        let tip = null;
        if (hit.visitorId) tip = 'Látogató<small>Kattints, hogy megnézd, mit szeretne</small>';
        else if (hit.special === 'expand') tip = 'Új földterület<small>Kattints a bővítéshez</small>';
        else if (hit.special === 'barge') tip = 'Uszály<small>Rakd meg a ládákat</small>';
        else if (o && !UI.state.placing && !UI.state.moving) tip = UI.describe(o);
        else if (!o && t && UI.state.tool === 'plow' && G.inFarm(t.x, t.y)) tip = 'Szántás<small>5 érme</small>';
        UI.tooltip(tip, e.clientX, e.clientY);
        canvas.style.cursor = o || hit.visitorId || hit.special ? 'pointer' : '';
      }
    }
    if (!pointers.has(e.pointerId)) return;
    if (mode === 'pending' && Math.hypot(p.x - start.x, p.y - start.y) > 8) mode = 'pan';
    if (mode === 'pan') {
      const g = screenToGround(p.x, p.y);
      if (g && panStart) { panBy(panStart.x - g.x, panStart.z - g.z); }
      canvas.style.cursor = 'grabbing';
    } else if (mode === 'act') {
      const t = tileAt(p.x, p.y);
      if (!t || (lastTile && t.x === lastTile.x && t.y === lastTile.y)) return;
      // walk every tile between the last and current one so fast drags don't skip
      const from = lastTile || t;
      const steps = Math.max(Math.abs(t.x - from.x), Math.abs(t.y - from.y));
      for (let i = 1; i <= steps; i++) {
        const x = Math.round(from.x + ((t.x - from.x) * i) / steps), y = Math.round(from.y + ((t.y - from.y) * i) / steps);
        const o = G.objAt(x, y);
        if (panelObj(o) || o?.type === 'housing') continue;
        const act = actionFor(UI.state.tool, x, y, o);
        if (act && act[0] === actKind) act[1]();
      }
      lastTile = t;
    }
  });
  const end = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    canvas.style.cursor = '';
    if (mode === 'pinch') { if (pointers.size === 0) mode = null; return; }
    if (mode === 'pending') click(e.clientX, e.clientY);
    mode = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); mode = null; });
  canvas.addEventListener('pointerleave', () => { if (!pointers.size) { setHover(null); UI.tooltip(null); } });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0012)); }, { passive: false });

  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { spaceDown = true; if (!modalOpen()) e.preventDefault(); }
    if (e.key === 'Escape') {
      if (modalOpen()) closeModal();
      else if (UI.state.placing || UI.state.moving) UI.cancelPlacing();
      else { UI.hidePopover(); UI.closeSeedPicker(); UI.setTool('hand'); }
      return;
    }
    if (modalOpen()) return;
    const tools = ['hand', 'plow', 'seed', 'water', 'harvest', 'move', 'remove'];
    if (e.key >= '1' && e.key <= '7') UI.setTool(tools[Number(e.key) - 1]);
    const k = e.key.toLowerCase();
    if (k === 'b') openModal('shop', { tab: 'animals' });
    if (k === 'i') openModal('storage', {});
    if (k === 'o') openModal('orders');
    if (k === 'r') UI.rotatePlacing();
    if (k === 'q') rotate(-1);
    if (k === 'e') rotate(1);
    if (e.key === '+' || e.key === '=') zoomAt(innerWidth / 2, innerHeight / 2, 1.2);
    if (e.key === '-') zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.2);
    const step = cam.zoom * 0.12;
    const yaw = Math.PI / 4 + Math.round(cam.yawTarget) * Math.PI / 2;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    if (k === 'arrowup' || k === 'w') { cam.tx += fx * step; cam.tz += fz * step; }
    if (k === 'arrowdown' || k === 's') { cam.tx -= fx * step; cam.tz -= fz * step; }
    if (k === 'arrowleft' || k === 'a') { cam.tx -= rx * step; cam.tz -= rz * step; }
    if (k === 'arrowright' || k === 'd') { cam.tx += rx * step; cam.tz += rz * step; }
    clampTarget();
  });
  addEventListener('keyup', (e) => { if (e.code === 'Space') spaceDown = false; });
}
