// Pooled sprite particles for juicy feedback (dust, water, leaves, sparkles, hearts, smoke...).
import { THREE } from './lib.js';

const POOL = 420;
let root;
const parts = [];
const texCache = {};

function tex(kind) {
  if (texCache[kind]) return texCache[kind];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.translate(32, 32);
  if (kind === 'soft') {
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 30);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(-32, -32, 64, 64);
  } else if (kind === 'star') {
    g.fillStyle = '#fff'; g.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 11 : 28, a = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.fill();
  } else if (kind === 'heart') {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, 22);
    g.bezierCurveTo(-34, -2, -18, -30, 0, -12); g.bezierCurveTo(18, -30, 34, -2, 0, 22); g.fill();
  } else if (kind === 'drop') {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -26); g.bezierCurveTo(16, -4, 18, 22, 0, 22); g.bezierCurveTo(-18, 22, -16, -4, 0, -26); g.fill();
  } else if (kind === 'leaf') {
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, 26, 12, 0.6, 0, 6.3); g.fill();
  } else { // chunk
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-20, -10); g.lineTo(4, -24); g.lineTo(24, -4); g.lineTo(12, 20); g.lineTo(-16, 16); g.closePath(); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return (texCache[kind] = t);
}

export function initFx(scene) {
  root = new THREE.Group();
  root.renderOrder = 10;
  scene.add(root);
  for (let i = 0; i < POOL; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('soft'), transparent: true, depthWrite: false }));
    s.visible = false;
    root.add(s);
    parts.push({ s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, g: 0, size: 0.2, grow: 0, spin: 0, drag: 0 });
  }
}
let cursor = 0;
function emit(kind, color, x, y, z, o) {
  const p = parts[cursor]; cursor = (cursor + 1) % POOL;
  const m = p.s.material;
  if (m.map !== tex(kind)) { m.map = tex(kind); m.needsUpdate = true; }
  m.color.set(color);
  m.opacity = 1;
  m.rotation = Math.random() * 6.28;
  p.s.position.set(x, y, z);
  p.s.visible = true;
  Object.assign(p, { life: 0, max: o.life ?? 1, vx: o.vx ?? 0, vy: o.vy ?? 0, vz: o.vz ?? 0, g: o.g ?? 0, size: o.size ?? 0.2, grow: o.grow ?? 0, spin: o.spin ?? 0, drag: o.drag ?? 0.98, fade: o.fade ?? 0.6 });
  p.s.scale.setScalar(p.size);
}
const R = (a) => (Math.random() - 0.5) * a;

/** Spawn a named effect at world position (x = tile x centre, z = tile y centre). */
export function burst(type, x, z, opt = {}) {
  const y = opt.y ?? 0.4;
  const color = opt.color;
  switch (type) {
    case 'dust':
      for (let i = 0; i < 12; i++) emit('soft', '#c8a272', x + R(0.8), 0.15, z + R(0.8), { vx: R(1.6), vy: 0.6 + Math.random(), vz: R(1.6), g: -1.5, size: 0.35, grow: 0.6, life: 0.9 });
      break;
    case 'seed':
      for (let i = 0; i < 8; i++) emit('chunk', '#7a5230', x + R(0.4), 0.5, z + R(0.4), { vx: R(1), vy: 1.5, vz: R(1), g: -7, size: 0.08, life: 0.6, fade: 0.1 });
      for (let i = 0; i < 4; i++) emit('star', color || '#c5e1a5', x + R(0.5), 0.3, z + R(0.5), { vy: 0.8, size: 0.14, life: 0.7 });
      break;
    case 'water':
      for (let i = 0; i < 14; i++) emit('drop', '#5fb8f2', x + R(0.3), 1.0, z + R(0.3), { vx: R(2), vy: 1 + Math.random() * 1.5, vz: R(2), g: -9, size: 0.12, life: 0.7, fade: 0.2 });
      emit('soft', '#bfe6ff', x, 0.2, z, { size: 0.6, grow: 1.2, life: 0.6 });
      break;
    case 'harvest':
      for (let i = 0; i < 10; i++) emit('leaf', '#7cb342', x + R(0.4), 0.4, z + R(0.4), { vx: R(2.4), vy: 1.5 + Math.random() * 1.5, vz: R(2.4), g: -6, size: 0.14, spin: R(8), life: 0.9 });
      for (let i = 0; i < 8; i++) emit('star', color || '#ffe082', x + R(0.4), 0.6, z + R(0.4), { vx: R(1.5), vy: 1.6, vz: R(1.5), g: -3, size: 0.18, life: 0.8 });
      break;
    case 'leaves':
      for (let i = 0; i < 18; i++) emit('leaf', i % 3 ? '#6aa84f' : '#a0763e', x + R(0.8), 0.5, z + R(0.8), { vx: R(3), vy: 1.5 + Math.random() * 2, vz: R(3), g: -6, size: 0.16, spin: R(10), life: 1.1 });
      burst('dust', x, z);
      break;
    case 'rocks':
      for (let i = 0; i < 16; i++) emit('chunk', i % 2 ? '#9e9e9e' : '#757575', x + R(0.8), 0.4, z + R(0.8), { vx: R(3.5), vy: 2 + Math.random() * 2, vz: R(3.5), g: -10, size: 0.14, spin: R(8), life: 0.9, fade: 0.2 });
      burst('dust', x, z);
      break;
    case 'hearts':
      for (let i = 0; i < 6; i++) emit('heart', '#ff5c8a', x + R(0.8), y + 0.3 + Math.random() * 0.3, z + R(0.8), { vy: 0.9, vx: R(0.4), size: 0.2, life: 1.3, drag: 0.99 });
      break;
    case 'feed':
      for (let i = 0; i < 14; i++) emit('chunk', '#e8c76a', x + R(1.6), 1.2, z + R(1.6), { vx: R(1), vy: 0.5, vz: R(1), g: -8, size: 0.07, life: 0.8, fade: 0.1 });
      burst('hearts', x, z, { y: 0.6 });
      break;
    case 'sparkle':
      for (let i = 0; i < 18; i++) emit('star', i % 2 ? '#ffe36b' : '#ffffff', x + R(1.2), 0.3 + Math.random() * 1.2, z + R(1.2), { vy: 0.6, size: 0.16 + Math.random() * 0.1, life: 1.1, spin: R(4) });
      break;
    case 'build':
      for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.28; emit('soft', '#f0e2c4', x + Math.cos(a) * 0.8, 0.2, z + Math.sin(a) * 0.8, { vx: Math.cos(a) * 1.6, vy: 0.7, vz: Math.sin(a) * 1.6, size: 0.5, grow: 0.8, life: 1 }); }
      burst('sparkle', x, z);
      break;
    case 'puff':
      for (let i = 0; i < 6; i++) emit('soft', '#ffffff', x + R(0.6), 1.2, z + R(0.6), { vy: 0.8, size: 0.4, grow: 0.8, life: 0.9 });
      break;
    case 'smoke':
      emit('soft', opt.color || '#eeeeee', x + R(0.08), y, z + R(0.08), { vy: 0.55, vx: 0.15, size: 0.22, grow: 0.5, life: 2.4, fade: 0.9, drag: 1 });
      break;
    case 'splash':
      for (let i = 0; i < 16; i++) emit('drop', '#a9dcff', x + R(0.3), 0.1, z + R(0.3), { vx: R(2.5), vy: 1.5 + Math.random() * 2, vz: R(2.5), g: -9, size: 0.1, life: 0.7, fade: 0.2 });
      emit('soft', '#ffffff', x, 0.08, z, { size: 0.5, grow: 1.6, life: 0.7 });
      break;
    case 'zzz':
      emit('soft', '#ffffff', x, y, z, { vy: 0.3, size: 0.1, life: 1 });
      break;
    default:
      burst('sparkle', x, z);
  }
}

export function updateFx(dt) {
  for (const p of parts) {
    if (!p.s.visible) continue;
    p.life += dt;
    if (p.life >= p.max) { p.s.visible = false; continue; }
    p.vy += p.g * dt;
    p.vx *= p.drag; p.vz *= p.drag;
    p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt;
    if (p.s.position.y < 0.03) { p.s.position.y = 0.03; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; }
    const k = p.life / p.max;
    p.s.scale.setScalar(p.size * (1 + p.grow * k));
    p.s.material.rotation += p.spin * dt;
    p.s.material.opacity = k > 1 - p.fade ? (1 - k) / p.fade : 1;
  }
}
