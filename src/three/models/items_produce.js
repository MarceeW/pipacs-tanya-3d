// Hand-made icon models for raw produce: crops, fruits, animal products and fish.
// Each builder: (look) => Object3D facing +z (look = CROPS/TREES look hints, may be empty).
import { B, Cy, Co, S, Ca, T, L, Pr, shine, sparkle, at, group, shade, M, LIT, FLAT, HI } from './items_kit.js';
import { leaf, animalFace } from './items_goods.js';

const PI = Math.PI;
const WHITE = '#ffffff', TWINE = '#b98a4e', STEM = '#6d4c2f';

/** Wrap `obj` so it is pushed out along +z by `r`, tilted by `tilt` and turned to angle `a` around y. */
function radial(obj, a, r = 0, tilt = 0, y = 0) {
  obj.position.z += r;
  const inner = group(obj); inner.rotation.x = tilt;
  const outer = group(inner); outer.rotation.y = a; outer.position.y = y;
  return outer;
}
/** Thin meridian "sliver" of a scaled sphere: draws a stripe line on a sphere of radius r. */
function stripe(r, c, sx, sy, angle, at3, axis = 'y') {
  const o = S(r, c, { at: at3, scale: axis === 'y' ? [0.1, sy * 1.015, sx * 1.015] : [sx * 1.015, sy * 1.015, 0.1], shadow: false });
  if (axis === 'y') o.rotation.y = angle; else o.rotation.x = angle;
  return o;
}
function stalk(len, c, w = 0.02) { return Cy(w, w * 1.2, len, c, { at: [0, len / 2, 0] }); }

// ------------------------------------------------------------------ crops
function wheat(l) {
  const gold = l.fruit || '#f2c14e', straw = '#dcb257';
  const g = group(
    Cy(0.13, 0.2, 0.42, straw, { at: [0, 0.21, 0], seg: 16 }),
    Cy(0.19, 0.19, 0.015, '#b98b35', { at: [0, 0.005, 0], seg: 16 }),
    Cy(0.22, 0.13, 0.22, straw, { at: [0, 0.52, 0], seg: 16 }),
    T(0.14, 0.035, '#d84343', { at: [0, 0.42, 0], rot: [PI / 2, 0, 0] }),
    T(0.05, 0.022, '#d84343', { at: [-0.05, 0.42, 0.16], rot: [0, 0.2, 0.6] }),
    T(0.05, 0.022, '#d84343', { at: [0.05, 0.42, 0.16], rot: [0, -0.2, -0.6] }),
  );
  const ears = [[0, 0], [0.35, 0], [0.35, 1.25], [0.35, 2.5], [0.35, 3.75], [0.35, 5.0], [0.6, 0.6], [0.6, 2.2], [0.6, 3.9], [0.6, 5.4]];
  for (const [tilt, a] of ears) {
    const e = group(Cy(0.012, 0.012, 0.22, '#c9a043', { at: [0, 0.11, 0] }), Ca(0.055, 0.16, gold, { at: [0, 0.31, 0], scale: [1, 1, 0.8] }));
    const w = group(e); w.rotation.x = tilt;
    g.add(at(group(w), 0, 0.6, 0, 0, a, 0));
  }
  return g;
}
function carrot(l) {
  const or = l.fruit || '#f57c00', gr = l.leaf || '#4caf50';
  const g = group();
  for (const [a, s] of [[-0.45, 0.9], [0, 1], [0.45, 0.85]]) {
    const c = group(
      Co(0.13 * s, 0.7 * s, or, { rot: [0, 0, -PI / 2], at: [0.35 * s, 0, 0], seg: 14 }),
      T(0.1 * s, 0.012, shade(or, -0.12), { at: [0.2 * s, 0, 0], rot: [0, PI / 2, 0], rs: 4, ts: 14, shadow: false }),
      T(0.07 * s, 0.01, shade(or, -0.12), { at: [0.38 * s, 0, 0], rot: [0, PI / 2, 0], rs: 4, ts: 14, shadow: false }),
      S(0.13 * s, or, { scale: [0.6, 1, 1] }),
    );
    g.add(at(c, 0, 0.13, 0, 0, a, 0));
  }
  for (const [a, t] of [[-0.6, 0.5], [-0.2, 0.9], [0.2, 0.7], [0.6, 0.4], [0, 0.3]]) {
    g.add(at(group(S(0.1, gr, { at: [-0.22, 0, 0], scale: [2.4, 0.5, 0.9] })), -0.05, 0.2, 0, 0, a, t));
  }
  return g;
}
function corn(l) {
  const y = l.fruit || '#ffd54f', husk = l.leaf || '#6fb33a';
  const g = group(
    Ca(0.16, 0.5, y, { at: [0.05, 0.18, 0], rot: [0, 0, PI / 2] }),
  );
  for (let i = 0; i < 5; i++) g.add(T(0.155, 0.018, shade(y, -0.08, 0.1), { at: [-0.15 + i * 0.1, 0.18, 0], rot: [0, PI / 2, 0], rs: 4, ts: 16, shadow: false }));
  for (const [rx, dz] of [[0.5, 0.1], [-0.5, -0.1], [0, 0], [1.3, 0.08]]) g.add(at(group(S(0.18, rx > 1 ? shade(husk, 0.12) : husk, { at: [0.2, 0, 0], scale: [1.9, 0.22, 0.75] })), -0.35, 0.18, dz, rx, 0, 0.25));
  for (const dz of [-0.04, 0, 0.04]) g.add(Ca(0.012, 0.12, '#a0522d', { at: [0.45, 0.2, dz], rot: [0, 0, -1.2] }));
  g.add(shine(0.0, 0.31, 0.06, 0.035, [2, 0.5, 0.5]));
  return g;
}
function soy(l) {
  const pod = '#8bc34a', bean = l.fruit || '#c5d86d';
  const g = group();
  const mk = () => { const p = group(Ca(0.075, 0.32, pod, { rot: [0, 0, PI / 2], scale: [1, 1, 0.8] })); for (const x of [-0.13, 0, 0.13]) p.add(S(0.075, shade(pod, 0.04), { at: [x, 0.02, 0.0], scale: [1, 1, 0.85] })); return p; };
  g.add(at(mk(), -0.05, 0.08, 0.0, 0, 0.3, 0.2), at(mk(), 0.08, 0.1, -0.15, 0, -0.4, -0.1), at(mk(), 0.02, 0.22, -0.05, 0.4, 0.0, 0.5));
  for (const [x, z] of [[0.3, 0.25], [0.18, 0.32], [0.38, 0.12]]) g.add(S(0.06, bean, { at: [x, 0.05, z], scale: [1, 0.85, 1.2] }));
  for (const a of [-0.6, 0.3, 1.2]) g.add(at(group(S(0.13, l.leaf || '#7cb342', { at: [0, 0, -0.2], scale: [0.8, 0.2, 1.6] })), -0.1, 0.06, -0.1, 0, a + PI, 0));
  return g;
}
function tomato(l) {
  const red = l.fruit || '#e53935', gr = l.leaf || '#43a047';
  const one = (r) => {
    const t = group(S(r, red, { scale: [1, 0.82, 1] }), Cy(0.015, 0.02, 0.08, gr, { at: [0, r * 0.85, 0] }));
    for (let i = 0; i < 5; i++) t.add(radial(S(r * 0.22, gr, { scale: [0.5, 0.2, 1.4] }), (i / 5) * PI * 2, r * 0.25, 0.25, r * 0.78));
    t.add(shine(-r * 0.4, r * 0.4, r * 0.65, r * 0.15));
    return t;
  };
  return group(at(one(0.36), 0, 0.3, 0.05), at(one(0.24), 0.42, 0.2, -0.2, 0, 1, 0));
}
function sugarcane(l) {
  const cane = l.fruit || '#c0d860', lf = l.leaf || '#9ccc65';
  const g = group();
  for (const [x, z, rz] of [[-0.12, 0, 0.12], [0.06, 0.06, -0.05], [0.18, -0.06, -0.2]]) {
    const s = group();
    for (let i = 0; i < 3; i++) {
      s.add(Cy(0.065, 0.065, 0.3, i % 2 ? cane : shade(cane, -0.05), { at: [0, 0.15 + i * 0.3, 0], seg: 12 }));
      s.add(T(0.066, 0.016, shade(cane, -0.25), { at: [0, 0.3 + i * 0.3, 0], rot: [PI / 2, 0, 0], rs: 4, ts: 14, shadow: false }));
    }
    s.add(at(group(S(0.08, lf, { at: [0.2, 0, 0], scale: [3, 0.6, 0.25] })), 0, 0.9, 0, 0, 0.3, 0.6));
    s.add(at(group(S(0.08, shade(lf, -0.08), { at: [-0.2, 0, 0], scale: [3, 0.6, 0.25] })), 0, 0.85, 0, 0, -0.3, -0.5));
    g.add(at(s, x, 0, z, 0, 0, rz));
  }
  g.add(T(0.17, 0.03, TWINE, { at: [0.03, 0.35, 0], rot: [PI / 2, 0, 0] }));
  g.add(at(group(Cy(0.065, 0.065, 0.42, cane, { rot: [0, 0, PI / 2], seg: 12 }), T(0.066, 0.016, shade(cane, -0.25), { rot: [0, PI / 2, 0], rs: 4, ts: 14 })), 0.15, 0.065, 0.3, 0, 0.3, 0));
  return g;
}
function potato(l) {
  const c = l.fruit || '#c8a165';
  const g = group();
  for (const [x, y, z, r, ry] of [[-0.2, 0.17, 0, 0.25, 0.4], [0.2, 0.15, 0.05, 0.22, -0.3], [0, 0.38, -0.05, 0.21, 1.2]]) {
    const p = group(S(r, c, { scale: [1.3, 0.8, 0.95] }), S(r * 0.45, shade(c, 0.02), { at: [r * 0.7, r * 0.25, 0], scale: [1, 0.8, 1] }));
    for (const [dx, dy, dz] of [[-0.3, 0.3, 0.75], [0.2, 0.5, 0.65], [0.5, -0.1, 0.7]]) p.add(S(r * 0.08, shade(c, -0.25), { at: [dx * r * 1.3, dy * r * 0.8, dz * r * 0.95], shadow: false }));
    g.add(at(p, x, y, z, 0, ry, 0));
  }
  g.add(shine(-0.1, 0.52, 0.05, 0.03, [1.6, 0.5, 0.5]));
  return g;
}
function sunflower(l) {
  const y = l.fruit || '#ffc107';
  const head = group(
    Cy(0.21, 0.21, 0.08, '#6d4c1d', { rot: [PI / 2, 0, 0], seg: 22 }),
    Cy(0.14, 0.14, 0.09, '#4a3212', { rot: [PI / 2, 0, 0], seg: 18 }),
  );
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * PI * 2;
    head.add(at(group(S(0.085, i % 2 ? y : shade(y, 0.06), { at: [0, 0.31, 0], scale: [0.65, 1.6, 0.22] })), 0, 0, i % 2 ? -0.02 : 0.0, 0, 0, a));
  }
  for (const [x, yy] of [[-0.05, 0.04], [0.05, -0.03], [0.0, -0.07], [0.07, 0.06], [-0.07, -0.05]]) head.add(S(0.018, '#2b1a08', { at: [x, yy, 0.05], shadow: false }));
  const g = group(
    Cy(0.03, 0.035, 0.6, l.leaf || '#5a9e34', { at: [0.05, 0.3, -0.08], rot: [0.1, 0, -0.1] }),
    at(group(S(0.12, l.leaf || '#5a9e34', { at: [0.17, 0, 0], scale: [1.6, 0.25, 0.8] })), 0.05, 0.25, -0.05, 0, 0.3, 0.4),
    at(head, 0, 0.72, 0, -0.35, 0, 0),
  );
  return g;
}
function strawberry(l) {
  const red = l.fruit || '#e8304a', gr = l.leaf || '#43a047';
  const pts = [[0, 0], [0.06, 0.02], [0.16, 0.1], [0.24, 0.23], [0.27, 0.34], [0.25, 0.44], [0.16, 0.5], [0, 0.52]];
  const one = (s, nSeeds) => {
    const g = group(L('strawberry', pts, red));
    for (let i = 0; i < 6; i++) g.add(radial(S(0.06, gr, { scale: [0.55, 0.2, 1.5] }), (i / 6) * PI * 2, 0.08, 0.35, 0.5));
    g.add(Cy(0.015, 0.02, 0.1, gr, { at: [0, 0.57, 0] }));
    const seeds = [[0.2, 0.15], [0.35, -0.35], [0.3, 0.45], [0.18, -0.15], [0.42, 0.1], [0.1, 0.4], [0.1, -0.45], [0.27, 0.9], [0.26, -0.8]];
    for (const [h, a] of seeds.slice(0, nSeeds)) { const y = 0.08 + h; const r = h < 0.13 ? 0.06 + h * 1.0 : 0.24 + (0.32 - h) * 0.1; g.add(S(0.018, '#ffe082', { at: [Math.sin(a) * r, y, Math.cos(a) * r], scale: [1, 1.4, 0.6], shadow: false })); }
    g.add(shine(-0.12, 0.38, 0.17, 0.035, [0.6, 1.4, 0.5]));
    return at(g, 0, 0, 0, 0, 0, 0, s);
  };
  return group(at(one(1, 9), -0.1, 0, 0.05, 0, 0, -0.15), at(one(0.72, 5), 0.25, 0, -0.12, 0, 0.6, 0.25));
}
function cotton(l) {
  const g = group(Cy(0.03, 0.035, 0.35, STEM, { at: [0, 0.17, 0] }));
  for (let i = 0; i < 4; i++) g.add(radial(Co(0.09, 0.28, '#8d6e4f', { rot: [PI / 2 - 0.3, 0, 0], scale: [1, 1, 0.3], seg: 6 }), (i / 4) * PI * 2 + 0.4, 0.15, 0, 0.36));
  for (const [x, y, z, r] of [[0, 0.62, 0, 0.2], [-0.17, 0.5, 0.05, 0.17], [0.17, 0.5, 0.05, 0.17], [0, 0.48, 0.16, 0.16], [0, 0.48, -0.15, 0.16]]) g.add(S(r, l.fruit || WHITE, { at: [x, y, z], low: true, det: 2 }));
  g.add(at(group(S(0.12, l.leaf || '#6d8f3c', { at: [0.16, 0, 0], scale: [1.4, 0.2, 0.9] })), 0, 0.2, 0, 0, -0.5, 0.4));
  return g;
}
function cabbage(l) {
  const core = l.fruit || '#c5e1a5', lf = l.leaf || '#7cb342', curly = !!l.curly;
  const g = group(S(0.25, core, { at: [0, 0.4, 0] }), S(0.18, shade(core, 0.06), { at: [0.03, 0.55, 0.03] }));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * PI * 2;
    g.add(radial(S(0.3, i % 2 ? lf : shade(lf, 0.07), { at: [0, 0.24, 0], scale: [1.1, 1, 0.28] }), a, 0.25, -0.55, 0.02));
    g.add(radial(B(0.025, 0.36, 0.02, shade(core, 0.12), { at: [0, 0.22, 0.09], r: 0, shadow: false }), a, 0.25, -0.55, 0.02));
  }
  g.add(shine(-0.08, 0.66, 0.12, 0.04));
  if (curly) g.scale.set(1, 1, 1);
  return g;
}
function kale(l) {
  const dk = l.leaf || '#33691e', md = l.fruit || '#558b2f';
  const g = group();
  for (const [a, t, s] of [[-0.9, 0.55, 0.9], [-0.3, 0.3, 1], [0.3, 0.35, 1], [0.9, 0.55, 0.9], [0, 0.05, 1.05]]) {
    const leafG = group(Cy(0.02, 0.025, 0.5 * s, '#a5c27a', { at: [0, 0.25 * s, 0] }));
    for (const [y, r] of [[0.32, 0.13], [0.5, 0.12], [0.66, 0.09]]) leafG.add(S(r * s, FLAT(y > 0.45 ? md : dk), { at: [0, y * s, 0], low: true, det: 1, scale: [1.2, 0.9, 0.55] }));
    g.add(at(group(at(leafG, 0, 0, 0, 0, 0, t)), 0, 0, 0, 0, a + PI / 2, 0));
  }
  g.add(T(0.06, 0.025, '#d84343', { at: [0, 0.12, 0], rot: [PI / 2, 0, 0] }));
  return g;
}
function pumpkin(l) {
  const o = l.fruit || '#f57f17';
  const g = group(S(0.33, shade(o, -0.04), { at: [0, 0.3, 0], scale: [1.1, 0.85, 1.1] }));
  for (let i = 0; i < 8; i++) g.add(radial(S(0.3, i % 2 ? o : shade(o, 0.04), { scale: [0.45, 0.92, 0.75] }), (i / 8) * PI * 2, 0.17, 0, 0.3));
  g.add(Cy(0.045, 0.07, 0.2, '#6d8f3c', { at: [0.02, 0.62, 0], rot: [0, 0, -0.25] }));
  g.add(at(group(S(0.13, l.leaf || '#558b2f', { at: [0.15, 0, 0], scale: [1.4, 0.2, 1.1] })), 0.03, 0.56, 0.05, 0.2, -0.8, 0.3));
  g.add(T(0.06, 0.012, '#6d8f3c', { at: [-0.12, 0.62, 0.06], rot: [0, 0.5, 0], arc: PI * 1.5, rs: 4 }));
  g.add(shine(-0.18, 0.45, 0.22, 0.04, [1, 1.2, 0.5]));
  return g;
}
function pepper(l) {
  const gr = '#2e7d32';
  const bell = (c) => {
    const g = group();
    for (let i = 0; i < 4; i++) g.add(radial(S(0.19, i % 2 ? c : shade(c, 0.04), { scale: [0.85, 1.25, 0.9] }), (i / 4) * PI * 2 + 0.4, 0.08, 0, 0.24));
    g.add(S(0.12, gr, { at: [0, 0.46, 0], scale: [1, 0.35, 1] }), Cy(0.025, 0.035, 0.14, gr, { at: [0.02, 0.53, 0], rot: [0, 0, -0.3] }));
    g.add(shine(-0.14, 0.33, 0.18, 0.035, [0.6, 1.6, 0.5]));
    return g;
  };
  return group(at(bell(l.fruit || '#d32f2f'), -0.08, 0, 0), at(bell('#ffc107'), 0.3, 0, 0.18, 0, 0.8, -0.1, 0.72));
}
function onion(l) {
  const c = l.fruit || '#d7a86e';
  const pts = [[0, 0], [0.12, 0.02], [0.25, 0.1], [0.31, 0.22], [0.29, 0.35], [0.2, 0.46], [0.09, 0.54], [0.04, 0.62], [0, 0.64]];
  const one = (col, s) => {
    const g = group(L('onion', pts, col));
    for (const a of [0.3, 1.2, 2.1, -0.6]) g.add(at(L('onion', pts, shade(col, -0.12)), 0, 0, 0, 0, a, 0, [1.015, 1.005, 0.08]));
    for (const a of [-0.4, 0, 0.4]) g.add(Cy(0.008, 0.008, 0.08, '#e8d8b8', { at: [Math.sin(a) * 0.04, -0.02, Math.cos(a) * 0.03], rot: [0.3, 0, a] }));
    g.add(Co(0.03, 0.22, '#7cb342', { at: [0, 0.72, 0], seg: 8 }));
    g.add(shine(-0.12, 0.32, 0.22, 0.035, [0.6, 1.4, 0.5]));
    return at(g, 0, 0.02, 0, 0, 0, 0, s);
  };
  return group(at(one(c, 1), -0.12, 0, 0, 0, 0, 0), at(one('#9c3d6b', 0.72), 0.27, 0, 0.12, 0, 0, -0.2));
}
function lavender(l) {
  const p = l.fruit || '#9575cd', st = l.leaf || '#7b9e6b';
  const g = group(Cy(0.07, 0.1, 0.4, st, { at: [0, 0.2, 0], seg: 10 }));
  const spikes = [[0, 0], [0.25, 0], [0.25, 1.6], [0.25, 3.2], [0.25, 4.8], [0.45, 0.8], [0.45, 2.4], [0.45, 4.0]];
  for (const [t, a] of spikes) {
    const s = group(Cy(0.012, 0.012, 0.35, st, { at: [0, 0.17, 0] }), Ca(0.05, 0.22, FLAT(p), { at: [0, 0.48, 0], scale: [1, 1, 1] }), S(0.035, FLAT(shade(p, 0.08)), { at: [0, 0.63, 0], low: true, det: 0 }));
    const w = group(s); w.rotation.x = t;
    g.add(at(group(w), 0, 0.38, 0, 0, a, 0));
  }
  g.add(T(0.09, 0.03, '#7e57c2', { at: [0, 0.36, 0], rot: [PI / 2, 0, 0] }));
  for (const s of [-1, 1]) g.add(T(0.05, 0.02, '#7e57c2', { at: [s * 0.05, 0.36, 0.11], rot: [0, s * 0.2, s * 0.6] }));
  return g;
}
function garlic(l) {
  const w = l.fruit || '#f5f0e6', streak = '#c9a2c9';
  const g = group(S(0.22, w, { at: [0, 0.26, 0] }));
  for (let i = 0; i < 6; i++) g.add(radial(S(0.15, i % 2 ? w : shade(w, -0.03), { scale: [0.75, 1.3, 0.85] }), (i / 6) * PI * 2, 0.13, -0.12, 0.25));
  for (const a of [0.4, -0.6, 1.6]) g.add(radial(B(0.015, 0.25, 0.01, streak, { r: 0 }), a, 0.27, -0.1, 0.25));
  g.add(Co(0.09, 0.28, w, { at: [0, 0.55, 0], seg: 12 }));
  for (const a of [-0.5, 0, 0.5]) g.add(Cy(0.008, 0.008, 0.1, '#e0d0b0', { at: [Math.sin(a) * 0.06, 0.03, Math.cos(a) * 0.06], rot: [0.4, 0, a] }));
  g.add(at(group(S(0.1, w, { scale: [0.8, 1.3, 0.7] }), Co(0.04, 0.1, w, { at: [0, 0.15, 0], seg: 8 })), 0.35, 0.1, 0.2, 0, 0, -0.9));
  g.add(shine(-0.13, 0.36, 0.22, 0.03, [0.6, 1.4, 0.5]));
  return g;
}
function watermelon(l) {
  const dk = l.fruit || '#2e7d32', lt = '#7cb342';
  const g = group(S(0.4, dk, { at: [-0.1, 0.36, -0.12], scale: [1.3, 0.9, 1] }));
  for (let i = 0; i < 5; i++) {
    const o = S(0.4, lt, { at: [-0.1, 0.36, -0.12], scale: [1.32, 0.915, 0.1], shadow: false });
    const w = group(o); w.position.set(-0.1, 0.36, -0.12); o.position.set(0, 0, 0); w.rotation.x = (i / 5) * PI;
    g.add(w);
  }
  g.add(shine(-0.3, 0.6, 0.1, 0.05, [1.5, 0.7, 0.5]));
  const slice = group(
    Pr(0.62, 0.42, 0.14, '#ef4f5f', { at: [0, 0.07, 0] }),
    B(0.68, 0.06, 0.15, '#f1f8e9', { at: [0, 0.05, 0], r: 0.02 }),
    B(0.72, 0.06, 0.16, '#388e3c', { at: [0, 0.01, 0], r: 0.025 }),
  );
  for (const [x, y] of [[-0.1, 0.17], [0.1, 0.17], [0, 0.28], [-0.18, 0.11], [0.18, 0.11]]) slice.add(S(0.022, '#2b2b2b', { at: [x, y, 0.075], scale: [0.7, 1.2, 0.4], shadow: false }));
  g.add(at(slice, 0.28, 0.03, 0.3, -0.15, -0.3, 0));
  return g;
}
function blueberry(l) {
  const c = l.fruit || '#3f51b5';
  const g = group();
  const pos = [[-0.2, 0, -0.1], [0.05, 0, -0.18], [0.25, 0, -0.02], [-0.12, 0, 0.16], [0.12, 0, 0.18], [-0.05, 0.18, -0.02], [0.13, 0.18, 0.02], [0.02, 0.33, 0.04]];
  for (const [i, [x, y, z]] of pos.entries()) {
    const r = 0.13;
    g.add(S(r, i % 3 ? c : shade(c, 0.08), { at: [x, y + r, z] }));
    g.add(Cy(0.035, 0.03, 0.03, '#1a237e', { at: [x + 0.02, y + r * 1.95, z + 0.03], rot: [0.4, 0, -0.2], seg: 6 }));
  }
  g.add(shine(-0.01, 0.53, 0.1, 0.03));
  for (const a of [0.8, 2.2]) g.add(at(group(S(0.12, l.leaf || '#386641', { at: [0.22, 0, 0], scale: [1.6, 0.2, 0.8] })), 0, 0.05, -0.1, 0, a, 0));
  return g;
}
function rice(l) {
  const grain = '#e8c873', stem = '#a5b84a';
  const g = group(
    Cy(0.07, 0.11, 0.36, stem, { at: [0, 0.18, 0], seg: 10 }),
    T(0.09, 0.03, '#d84343', { at: [0, 0.22, 0], rot: [PI / 2, 0, 0] }),
  );
  for (const [ry, lean] of [[0, 0.3], [2.1, 0.55], [4.2, 0.5]]) {
    const st = group(Cy(0.014, 0.014, 0.6, stem, { at: [0, 0.3, 0] }));
    for (let i = 0; i < 6; i++) {
      const t = 0.25 + i * 0.32;
      st.add(S(0.045, i % 2 ? grain : shade(grain, 0.06), { at: [Math.sin(t) * 0.2, 0.6 + (Math.cos(t) - 1) * 0.2 + 0.05, 0], rot: [0, 0, -t], scale: [0.7, 1.5, 0.7] }));
    }
    st.add(at(group(S(0.06, '#9ccc65', { at: [0, 0.2, 0], scale: [0.35, 3.2, 0.2] })), 0, 0.25, 0, 0, 0, -0.5));
    g.add(at(group(at(st, 0, 0, 0, 0, 0, lean)), 0, 0.3, 0, 0, ry + 0.4, 0));
  }
  g.add(S(0.24, '#fffbea', { at: [0.3, 0.0, 0.28], scale: [1, 0.5, 1] }));
  for (const [x, z] of [[0.18, 0.38], [0.48, 0.35], [0.45, 0.12]]) g.add(S(0.03, WHITE, { at: [x, 0.02, z], scale: [0.7, 0.6, 1.4] }));
  return g;
}
function coffee(l) {
  const ch = '#c62828';
  const g = group(Cy(0.02, 0.025, 0.7, STEM, { at: [-0.05, 0.3, -0.1], rot: [0, 0, 1.2] }));
  for (const [x, y, z] of [[-0.15, 0.36, -0.05], [0.0, 0.42, -0.02], [-0.05, 0.25, 0.06], [0.12, 0.3, 0.0]]) { g.add(S(0.1, ch, { at: [x, y, z], scale: [1, 0.9, 1] })); g.add(shine(x - 0.04, y + 0.04, z + 0.07, 0.02)); }
  for (const [a, x] of [[0.5, -0.3], [-0.6, 0.25]]) g.add(at(group(S(0.13, l.leaf || '#2e5e2a', { at: [0.18, 0, 0], scale: [1.6, 0.2, 0.8] })), x, 0.42, -0.12, 0.3, a, 0.3));
  for (const [x, z, ry] of [[0.2, 0.3, 0.3], [0.38, 0.15, -0.5], [0.05, 0.35, 1.2]]) {
    g.add(at(group(S(0.1, '#5d3a1a', { scale: [0.8, 0.5, 1.15] }), B(0.015, 0.02, 0.18, '#2b1709', { at: [0, 0.045, 0], r: 0 })), x, 0.05, z, 0, ry, 0));
  }
  return g;
}
function rose(l) {
  const red = l.fruit || '#e91e63', gr = l.leaf || '#2e7d32';
  const head = group(S(0.11, shade(red, -0.08), { at: [0, 0.06, 0], scale: [1, 1.3, 1] }));
  for (let i = 0; i < 3; i++) head.add(radial(S(0.12, shade(red, -0.03), { scale: [1, 1.15, 0.35] }), (i / 3) * PI * 2, 0.07, -0.12, 0.05));
  for (let i = 0; i < 5; i++) head.add(radial(S(0.16, red, { scale: [1, 0.95, 0.32] }), (i / 5) * PI * 2 + 0.3, 0.13, -0.45, 0.0));
  for (let i = 0; i < 4; i++) head.add(radial(Co(0.04, 0.14, gr, { rot: [PI / 2 + 0.7, 0, 0], scale: [1, 1, 0.3], seg: 5 }), (i / 4) * PI * 2, 0.06, 0, -0.07));
  const g = group(
    Cy(0.025, 0.025, 0.8, gr, { at: [0, 0.4, 0] }),
    at(group(S(0.1, gr, { at: [0.14, 0, 0], scale: [1.5, 0.25, 0.9] })), 0, 0.35, 0, 0, 0.3, 0.3),
    at(group(S(0.09, gr, { at: [-0.13, 0, 0], scale: [1.5, 0.25, 0.9] })), 0, 0.55, 0, 0, -0.2, -0.3),
    Co(0.02, 0.05, gr, { at: [0.03, 0.2, 0], rot: [0, 0, -1.2], seg: 5 }),
    at(head, 0, 0.88, 0, 0.5, 0, 0, 1.25),
  );
  return at(group(g), 0, 0, 0, 0, 0, -0.5);
}

// ------------------------------------------------------------------ fruits
function stemLeaf(y, lc = '#43a047', s = 1) {
  return group(
    Cy(0.02 * s, 0.025 * s, 0.14 * s, STEM, { at: [0.01, y + 0.05 * s, 0], rot: [0, 0, -0.25] }),
    at(group(S(0.1 * s, lc, { at: [0.12 * s, 0, 0], scale: [1.4, 0.22, 0.75] })), 0.02, y + 0.07 * s, 0, 0.4, -0.5, 0.35),
  );
}
function apple(l) {
  const c = l.fruit || '#e53935';
  return group(
    S(0.38, c, { at: [0, 0.35, 0], scale: [1, 0.9, 1] }),
    S(0.3, shade(c, 0.06, 0.05), { at: [0.12, 0.38, 0.12], scale: [1, 0.9, 1], shadow: false }),
    Cy(0.07, 0.03, 0.05, shade(c, -0.18), { at: [0, 0.67, 0] }),
    stemLeaf(0.66, l.leaf || '#4caf50'),
    shine(-0.17, 0.5, 0.25, 0.06, [0.8, 1.2, 0.5]),
  );
}
function cherry(l) {
  const c = l.fruit || '#b71c1c';
  return group(
    S(0.2, c, { at: [-0.2, 0.2, 0] }), S(0.2, shade(c, 0.04), { at: [0.18, 0.18, 0.08] }),
    shine(-0.28, 0.27, 0.15, 0.035), shine(0.1, 0.25, 0.23, 0.035),
    Cy(0.016, 0.016, 0.62, '#558b2f', { at: [-0.12, 0.65, 0], rot: [0, 0, -0.32] }),
    Cy(0.016, 0.016, 0.6, '#558b2f', { at: [0.11, 0.64, 0.04], rot: [0.12, 0, 0.42] }),
    at(group(S(0.13, l.leaf || '#43a047', { at: [0.17, 0, 0], scale: [1.5, 0.22, 0.75] })), 0, 0.93, 0, 0.5, -0.4, 0.3),
  );
}
function pear(l) {
  const c = l.fruit || '#d4c34a';
  const pts = [[0, 0], [0.15, 0.01], [0.27, 0.08], [0.33, 0.2], [0.31, 0.33], [0.22, 0.45], [0.16, 0.56], [0.13, 0.66], [0.08, 0.74], [0, 0.76]];
  return group(
    L('pear', pts, c),
    S(0.22, shade('#ff8a65', 0, -0.1), { at: [0.12, 0.2, 0.15], scale: [1, 1, 0.8], shadow: false }),
    stemLeaf(0.74, l.leaf || '#689f38'),
    shine(-0.15, 0.3, 0.24, 0.05, [0.7, 1.4, 0.5]),
  );
}
function plum(l) {
  const c = l.fruit || '#5e35b1';
  const a = group(S(0.26, c, { at: [0, 0.27, 0], scale: [0.9, 1.05, 0.95] }), stripe(0.26, shade(c, -0.12), 0.95, 1.05, 0.3, [0, 0.27, 0]), shine(-0.1, 0.4, 0.2, 0.04, [0.7, 1.3, 0.5]));
  const b = group(S(0.26, shade(c, 0.05), { at: [0, 0.27, 0], scale: [0.9, 1.05, 0.95] }), stripe(0.26, shade(c, -0.08), 0.95, 1.05, 0.6, [0, 0.27, 0]), shine(-0.1, 0.4, 0.2, 0.04, [0.7, 1.3, 0.5]));
  return group(at(a, -0.15, 0, 0), at(b, 0.24, 0, 0.1, 0, 0.5, 0, 0.85), stemLeaf(0.55, l.leaf || '#558b2f').translateX(-0.15));
}
function peach(l) {
  const c = l.fruit || '#ffab76';
  return group(
    S(0.36, c, { at: [0, 0.36, 0] }),
    S(0.355, '#ff7043', { at: [0.05, 0.36, 0.05], scale: [1, 0.95, 1], shadow: false }),
    S(0.33, shade(c, 0.03), { at: [-0.06, 0.38, 0.0], shadow: false }),
    stripe(0.36, shade('#ff7043', -0.1), 1, 1, 0.5, [0, 0.36, 0]),
    stemLeaf(0.7, l.leaf || '#7cb342'),
    shine(-0.17, 0.5, 0.24, 0.05, [0.8, 1.2, 0.5]),
  );
}
function walnut(l) {
  const c = l.fruit || '#a1887f';
  const nut = (s) => group(
    S(0.25, FLAT(c), { at: [0, 0.24, 0], low: true, det: 2, scale: [1, 0.95, 0.9] }),
    T(0.24, 0.02, shade(c, -0.15), { at: [0, 0.24, 0], rot: [0, 0, 0], ts: 24, rs: 4, scale: [1, 0.95, 1] }),
    Co(0.05, 0.08, shade(c, -0.1), { at: [0, 0.5, 0], seg: 6 }),
  );
  const kernel = group(
    S(0.13, FLAT('#d7a96b'), { low: true, det: 1, scale: [1.1, 0.6, 0.8] }),
    S(0.09, FLAT('#c8955a'), { low: true, det: 1, at: [0.08, 0.04, 0.02], scale: [1, 0.6, 0.8] }),
  );
  return group(at(nut(), -0.15, 0, -0.05, 0, 0.3, 0), at(nut(), 0.27, 0, -0.1, 0, -0.4, 0, 0.85), at(kernel, 0.1, 0.08, 0.3, 0, 0.4, 0));
}

// ------------------------------------------------------------------ animal products
function egg() {
  const straw = '#c99a55';
  const g = group(
    Cy(0.38, 0.28, 0.14, shade(straw, -0.08), { at: [0, 0.07, 0], seg: 20 }),
    T(0.4, 0.11, straw, { at: [0, 0.16, 0], rot: [PI / 2, 0, 0], rs: 8, ts: 24 }),
  );
  for (let i = 0; i < 7; i++) { const a = (i / 7) * PI * 2; g.add(Ca(0.015, 0.22, i % 2 ? '#e0b56a' : '#a87a3c', { at: [Math.cos(a) * 0.42, 0.2, Math.sin(a) * 0.42], rot: [PI / 2, 0, a + 0.8], shadow: false })); }
  for (const [x, z, c, rx, rz] of [[-0.12, -0.06, '#fff8ec', -0.2, 0.25], [0.13, -0.04, '#e3b27a', -0.1, -0.2], [0.0, 0.14, WHITE, 0.35, 0.05]]) {
    g.add(at(group(S(0.18, c, { scale: [1, 1.3, 1] }), shine(-0.06, 0.1, 0.13, 0.03)), x * 1.2, 0.33, z * 1.2, rx, 0, rz));
  }
  g.add(at(group(S(0.08, '#fff59d', { at: [0.1, 0, 0], scale: [1.6, 0.2, 0.7] })), 0.25, 0.25, 0.25, 0, -0.3, 0.3));
  return g;
}
function milk() {
  const pts = [[0, 0], [0.25, 0], [0.28, 0.04], [0.28, 0.5], [0.22, 0.62], [0.15, 0.72], [0.15, 0.82], [0, 0.82]];
  const g = group(
    L('milk', pts, '#fdfdfb'),
    Cy(0.285, 0.285, 0.24, '#1e88e5', { at: [0, 0.28, 0], seg: 28 }),
    Cy(0.165, 0.165, 0.07, '#1565c0', { at: [0, 0.83, 0] }),
    T(0.165, 0.018, '#90caf9', { at: [0, 0.8, 0], rot: [PI / 2, 0, 0] }),
    Cy(0.11, 0.11, 0.03, WHITE, { at: [0, 0.28, 0.275], rot: [PI / 2, 0, 0] }),
    shine(-0.17, 0.55, 0.2, 0.04, [0.5, 2.2, 0.5], [0, 0, 0]),
  );
  for (const [x, y, s] of [[-0.03, 0.3, 1], [0.04, 0.25, 0.7]]) g.add(S(0.035 * s, '#2b2b2b', { at: [x, y, 0.29], scale: [1.3, 1, 0.4], shadow: false }));
  for (const [a, y] of [[1.0, 0.38], [-0.9, 0.2]]) g.add(S(0.035, WHITE, { at: [Math.sin(a) * 0.285, y, Math.cos(a) * 0.285], scale: [1.4, 1, 0.4], rot: [0, a, 0], shadow: false }));
  return g;
}
function wool() {
  const c = '#fbf5e6';
  const g = group();
  const pos = [[0, 0.2, 0, 0.26], [-0.25, 0.16, 0.05, 0.2], [0.25, 0.16, 0.0, 0.21], [0.05, 0.16, 0.24, 0.18], [-0.08, 0.16, -0.22, 0.2], [0.18, 0.36, -0.05, 0.18], [-0.15, 0.36, 0.05, 0.18], [0.02, 0.48, 0.02, 0.15], [0.22, 0.14, 0.24, 0.13]];
  for (const [i, [x, y, z, r]] of pos.entries()) g.add(S(r, i % 3 ? c : shade(c, -0.04), { at: [x, y, z], low: true, det: 2 }));
  g.add(T(0.3, 0.035, '#64b5f6', { at: [0, 0.3, 0], rot: [PI / 2 - 0.15, 0, 0], ts: 28 }));
  g.add(T(0.06, 0.025, '#64b5f6', { at: [-0.05, 0.33, 0.3], rot: [0, 0.3, 0.6] }), T(0.06, 0.025, '#64b5f6', { at: [0.07, 0.33, 0.3], rot: [0, -0.3, -0.6] }));
  return g;
}
function honey() {
  const pot = '#c47a2c', hn = '#ffb300';
  const pts = [[0, 0], [0.25, 0], [0.32, 0.1], [0.36, 0.28], [0.32, 0.46], [0.24, 0.54], [0.26, 0.6], [0.27, 0.63]];
  const g = group(
    L('honeypot', pts, pot),
    T(0.255, 0.03, shade(pot, -0.05), { at: [0, 0.62, 0], rot: [PI / 2, 0, 0] }),
    Cy(0.24, 0.24, 0.02, hn, { at: [0, 0.6, 0] }),
    Cy(0.37, 0.37, 0.12, '#fff3c4', { at: [0, 0.28, 0], seg: 28 }),
    shine(-0.2, 0.42, 0.22, 0.04, [0.5, 1.8, 0.5], [0, 0, 0]),
  );
  for (const [a, len] of [[0.2, 0.14], [0.8, 0.22], [-0.5, 0.1], [1.5, 0.16]]) {
    const r = 0.27;
    g.add(Ca(0.035, len, hn, { at: [Math.sin(a) * r, 0.6 - len / 2, Math.cos(a) * r] }));
    g.add(S(0.045, hn, { at: [Math.sin(a) * r, 0.6 - len, Math.cos(a) * r] }));
  }
  // honey dipper
  const dip = group(Cy(0.025, 0.025, 0.6, '#d7a86e', { at: [0, 0.3, 0] }));
  for (let i = 0; i < 3; i++) dip.add(T(0.06 - i * 0.008, 0.025, '#e0a050', { at: [0, 0.04 + i * 0.06, 0], rot: [PI / 2, 0, 0], ts: 14, rs: 6 }));
  dip.add(S(0.05, hn, { at: [0, 0.01, 0] }));
  g.add(at(dip, 0.1, 0.48, -0.05, 0, 0, -0.45));
  // little bee
  const bee = group(
    S(0.07, '#ffd54f', { scale: [1.3, 1, 1] }),
    T(0.062, 0.018, '#2b2b2b', { rot: [0, PI / 2, 0], at: [0.02, 0, 0], scale: [1, 1, 1] }),
    S(0.05, M('#e3f2fd', { snow: 0, transparent: true, opacity: 0.8 }), { at: [-0.01, 0.07, -0.02], scale: [0.6, 0.3, 1.2], rot: [0, 0, 0.3] }),
    S(0.012, '#2b2b2b', { at: [0.08, 0.02, 0.04] }),
  );
  g.add(at(bee, -0.32, 0.72, 0.15, 0, 0.5, 0));
  return g;
}
function truffle() {
  const g = group(
    at(group(S(0.24, '#d4e157', { at: [0.2, 0, 0], scale: [1.8, 0.12, 1] })), -0.15, 0.02, -0.05, 0, 0.3, 0),
    S(0.25, FLAT('#3e2723'), { at: [-0.1, 0.24, -0.05], low: true, det: 1, scale: [1, 0.9, 0.95] }),
    S(0.12, FLAT('#4e342e'), { at: [0.1, 0.36, -0.1], low: true, det: 1 }),
  );
  const half = group(
    S(0.18, FLAT('#3e2723'), { low: true, det: 1, scale: [1, 1, 0.5] }),
    Cy(0.16, 0.16, 0.02, '#d7c4a8', { at: [0, 0, 0.0], rot: [PI / 2, 0, 0], seg: 18 }),
  );
  for (const [x, y, rz] of [[-0.03, 0.03, 0.5], [0.05, -0.04, -0.4], [0.0, 0.07, 1.2], [-0.06, -0.06, 2.0]]) half.add(B(0.12, 0.012, 0.015, '#6d4c41', { at: [x, y, 0.012], rot: [0, 0, rz], r: 0, shadow: false }));
  g.add(at(half, 0.25, 0.18, 0.18, -0.3, 0.3, 0));
  return g;
}
function goatmilk() {
  const metal = '#b8c4cc';
  const pts = [[0, 0], [0.3, 0], [0.32, 0.03], [0.32, 0.5], [0.25, 0.62], [0.16, 0.7], [0.16, 0.8], [0.2, 0.82], [0.2, 0.86], [0, 0.86]];
  return group(
    L('churn', pts, metal),
    T(0.322, 0.02, shade(metal, -0.12), { at: [0, 0.06, 0], rot: [PI / 2, 0, 0] }),
    T(0.322, 0.02, shade(metal, -0.12), { at: [0, 0.46, 0], rot: [PI / 2, 0, 0] }),
    S(0.06, shade(metal, -0.1), { at: [0, 0.9, 0] }),
    T(0.09, 0.025, shade(metal, -0.15), { at: [-0.28, 0.62, 0], rot: [0, 0, PI / 2 + 0.6], arc: PI }),
    T(0.09, 0.025, shade(metal, -0.15), { at: [0.28, 0.62, 0], rot: [0, 0, -PI / 2 - 0.6], arc: PI, scale: [1, 1, 1] }),
    Cy(0.15, 0.15, 0.03, WHITE, { at: [0, 0.27, 0.315], rot: [PI / 2, 0, 0], seg: 22 }),
    at(animalFace('goatfeed'), 0, 0.27, 0.33, 0, 0, 0, 0.85),
    shine(-0.2, 0.36, 0.22, 0.04, [0.5, 2.2, 0.5], [0, 0, 0]),
  );
}
function feather() {
  const w = '#fdfdfd', tip = '#26a69a';
  const f = group(Cy(0.014, 0.022, 1.0, '#e8e2d0', { at: [0, 0.5, 0] }));
  for (const s of [-1, 1]) {
    f.add(S(0.17, w, { at: [s * 0.07, 0.56, 0], scale: [0.55, 2.6, 0.12] }));
    f.add(S(0.1, tip, { at: [s * 0.065, 0.85, 0.005], scale: [0.6, 1.3, 0.12] }));
    f.add(B(0.1, 0.012, 0.03, '#e0e0e0', { at: [s * 0.1, 0.48, 0.02], rot: [0, 0, s * 0.5], r: 0, shadow: false }));
  }
  f.add(S(0.04, w, { at: [0.05, 0.14, 0], low: true }), S(0.035, w, { at: [-0.05, 0.17, 0], low: true }));
  return at(group(f), 0, 0, 0, 0, 0, -0.75);
}

// ------------------------------------------------------------------ fish
/**
 * Side-view cartoon fish along +x (head), side facing +z.
 * o: { c, belly, fin, len, h, tail: 'fork'|'round'|'fan', spots, stripes, whisk, glow }
 */
function fishBody(o) {
  const c = o.mat || o.c, len = o.len || 0.5, h = o.h || 0.22, w = o.w || 0.14;
  const fin = o.fin || shade(o.c, -0.08);
  const g = group(
    S(0.5, c, { scale: [len, h, w] }),
    S(0.5, o.belly, { at: [0.02, -h * 0.18, 0], scale: [len * 0.86, h * 0.78, w * 1.02], shadow: false }),
  );
  // tail
  const tl = o.tail || 'fork';
  if (tl === 'fan') {
    for (const s of [-1, 0, 1]) g.add(at(group(S(0.2, fin, { at: [-0.18, 0, 0], scale: [1.3, 0.55, 0.12] })), -len * 0.42, 0, 0, 0, 0, s * 0.55));
  } else {
    for (const s of [-1, 1]) g.add(at(group(Co(0.12, 0.3, fin, { at: [0, -0.15, 0], scale: [1, 1, 0.22], seg: 10 })), -len * 0.42, s * 0.03, 0, 0, 0, s * (tl === 'round' ? 0.95 : 0.75)));
  }
  // dorsal + pectoral fins
  g.add(Pr(len * 0.42, h * 0.38, 0.03, fin, { at: [-len * 0.02, h * 0.42, 0], rot: [0, 0, -0.08] }));
  g.add(S(0.07, fin, { at: [len * 0.12, -h * 0.12, w * 0.5], scale: [1.3, 0.6, 0.25], rot: [0, 0.3, -0.5] }));
  g.add(Pr(len * 0.18, h * 0.25, 0.025, fin, { at: [-len * 0.12, -h * 0.42, 0], rot: [PI, 0, 0] }));
  // eye
  const ex = len * 0.32, ey = h * 0.1, ez = w * 0.38;
  g.add(S(o.eye || 0.055, WHITE, { at: [ex, ey, ez] }), S((o.eye || 0.055) * 0.55, '#1b1b1b', { at: [ex + 0.01, ey, ez + 0.03] }), S(0.012, HI(), { at: [ex + 0.02, ey + 0.015, ez + 0.055], shadow: false }));
  g.add(B(0.05, 0.012, 0.02, shade(o.c, -0.3), { at: [len * 0.47, -h * 0.05, w * 0.18], rot: [0, -0.4, -0.2], r: 0, shadow: false }));
  for (const [x, y, s] of o.spots || []) g.add(S(0.03 * s, o.spotC || '#2b2b2b', { at: [x * len, y * h, w * 0.47], scale: [1, 1, 0.3], shadow: false }));
  for (const x of o.stripes || []) g.add(S(0.5, o.stripeC || shade(o.c, -0.2), { at: [x * len, 0.02, 0], scale: [0.05, h * 0.92, w * 1.02], shadow: false }));
  if (o.lateral) g.add(S(0.5, o.lateral, { at: [0, 0, 0], scale: [len * 0.88, h * 0.22, w * 1.01], shadow: false }));
  for (const s of o.whisk ? [-1, 1] : []) {
    g.add(Cy(0.008, 0.008, 0.32, '#2b2b2b', { at: [len * 0.52, -h * 0.05 + s * 0.02, w * 0.25], rot: [0, 0, -PI / 2 - s * 0.6 - 0.4] }));
  }
  g.add(shine(len * 0.1, h * 0.33, w * 0.45, 0.04, [1.8, 0.5, 0.4], [0, 0, 0]));
  return g;
}
const FISHES = {
  perch: () => fishBody({ c: '#8bbf3f', belly: '#f2e7a0', fin: '#ff7043', len: 0.6, h: 0.3, stripes: [-0.15, 0.0, 0.15, 0.28], stripeC: '#3f6b1e' }),
  carp: () => fishBody({ c: '#c9963a', belly: '#f3d98b', fin: '#b0703a', len: 0.62, h: 0.34, w: 0.18, whisk: false, spots: [[-0.1, 0.1, 0.8], [0.05, 0.15, 0.8], [-0.2, 0.0, 0.8], [0.0, 0.0, 0.8], [0.12, 0.02, 0.8], [-0.08, -0.1, 0.8]], spotC: '#a8742a' }),
  trout: () => fishBody({ c: '#7e9c8c', belly: '#eef2ee', fin: '#8aa898', len: 0.64, h: 0.24, lateral: '#f06292', spots: [[-0.25, 0.22, 0.6], [-0.1, 0.3, 0.6], [0.05, 0.22, 0.6], [0.18, 0.3, 0.6], [-0.18, -0.15, 0.5], [0.1, -0.2, 0.5]] }),
  pike: () => {
    const g = fishBody({ c: '#5f8a3a', belly: '#e9efc9', fin: '#c0703a', len: 0.8, h: 0.2, w: 0.13, spots: [[-0.25, 0.1, 0.7], [-0.1, 0.2, 0.6], [0.05, 0.05, 0.7], [0.2, 0.15, 0.6], [-0.15, -0.05, 0.6], [0.1, -0.12, 0.6]], spotC: '#e8f0b0' });
    g.add(S(0.08, '#5f8a3a', { at: [0.42, -0.01, 0], scale: [1.6, 0.45, 0.8] }));
    return g;
  },
  catfish: () => fishBody({ c: '#5d5048', belly: '#cbb9a6', fin: '#4a3f38', len: 0.75, h: 0.24, w: 0.2, eye: 0.04, tail: 'round', whisk: true, spots: [[-0.2, 0.2, 0.7], [0.0, 0.25, 0.6], [-0.3, 0.05, 0.6]], spotC: '#3e342e' }),
  goldfish: () => {
    const gold = M('#ffb300', { snow: 0, emissive: '#7a3f00' });
    const g = fishBody({ c: '#ffb300', mat: gold, belly: '#ffe082', fin: '#ff8f00', len: 0.48, h: 0.34, w: 0.2, tail: 'fan', eye: 0.065 });
    g.add(S(0.04, LIT('#ffe57f', '#ffcc33'), { at: [0.0, 0.18, 0.0], scale: [1.4, 0.5, 0.6] }));
    g.add(sparkle(0.12, 0.3, 0.12, 0.16), sparkle(-0.35, 0.25, 0.08, 0.12), sparkle(0.32, -0.15, 0.1, 0.1));
    return g;
  },
  boot: () => {
    const lea = '#8a5a33';
    const g = group(
      B(0.3, 0.55, 0.3, lea, { at: [-0.12, 0.42, 0], r: 0.08 }),
      Ca(0.16, 0.36, lea, { at: [0.14, 0.18, 0], rot: [0, 0, PI / 2], scale: [1, 1, 1.05] }),
      B(0.78, 0.07, 0.36, '#3e2a1c', { at: [0.05, 0.035, 0], r: 0.03 }),
      B(0.2, 0.1, 0.34, '#3e2a1c', { at: [-0.18, 0.06, 0], r: 0.03 }),
      B(0.34, 0.08, 0.34, shade(lea, -0.1), { at: [-0.12, 0.7, 0], r: 0.04 }),
      S(0.05, '#2b1c12', { at: [-0.05, 0.4, 0.15], scale: [1, 1.2, 0.3] }),
      B(0.12, 0.1, 0.02, '#c8a165', { at: [0.18, 0.24, 0.16], rot: [0, 0, 0.3], r: 0.01 }),
    );
    for (let i = 0; i < 3; i++) g.add(B(0.2, 0.02, 0.02, '#e8d8b8', { at: [0.0 - i * 0.02, 0.32 + i * 0.1, 0.155], rot: [0, 0, (i % 2 ? 1 : -1) * 0.4], r: 0, shadow: false }));
    const weed = group();
    for (let i = 0; i < 3; i++) weed.add(Ca(0.025, 0.12, '#558b2f', { at: [Math.sin(i * 1.5) * 0.03, -i * 0.13, 0], rot: [0, 0, Math.sin(i * 1.5) * 0.4] }));
    g.add(at(weed, -0.22, 0.72, 0.12));
    g.add(S(0.04, '#64b5f6', { at: [0.3, 0.14, 0.2], scale: [1, 1.4, 1] }));
    return g;
  },
};

export const PRODUCE = {
  wheat, carrot, corn, soy, tomato, sugarcane, potato, sunflower, strawberry, cotton, cabbage, pumpkin, pepper, onion,
  lavender, garlic, watermelon, kale, blueberry, rice, coffee, rose,
  apple, cherry, pear, plum, peach, walnut,
  egg, milk, wool, honey, truffle, goatmilk, feather,
  ...FISHES,
};
/** Per-item view overrides (fish & flat things face the camera fully). */
export const PRODUCE_VIEW = {
  perch: { yaw: Math.PI / 4 }, carp: { yaw: Math.PI / 4 }, trout: { yaw: Math.PI / 4 }, pike: { yaw: Math.PI / 4 },
  catfish: { yaw: Math.PI / 4 }, goldfish: { yaw: Math.PI / 4 }, boot: { yaw: Math.PI / 4 - 0.2 },
  feather: { yaw: Math.PI / 4, tilt: -0.2 }, rose: { yaw: Math.PI / 4 }, sunflower: { yaw: Math.PI / 4 - 0.1 },
  carrot: { yaw: 0.2 }, corn: { yaw: Math.PI / 4 - 0.1 },
};
