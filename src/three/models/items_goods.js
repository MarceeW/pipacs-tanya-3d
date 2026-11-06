// Parametric builders for processed goods / materials, keyed by ITEM_LOOK.shape.
// Each builder: (look, id) => Object3D built facing +z, roughly 1 unit tall/wide (items.js normalises).
import { B, Cy, Co, S, Ca, T, L, Pr, shine, sparkle, at, group, shade, mat, LIT, FLAT, M } from './items_kit.js';

const PI = Math.PI;
const WHITE = '#ffffff', BURLAP = '#d6ae72', TWINE = '#b98a4e', WOOD = '#b07a45', WOOD_D = '#7a4f2a';
const METAL = '#a7b4bf', METAL_L = '#dfe8ee', GOLD = '#ffc83d', CREAM = '#fff4d6';
const STEAM = () => M('#ffffff', { snow: 0, transparent: true, opacity: 0.75 });

// ------------------------------------------------------------------ small reusable bits
function leaf(c = '#4caf50', s = 1) {
  return S(0.09 * s, c, { scale: [1, 0.25, 0.5], ws: 10, hs: 6 });
}
function berry(c, s = 1) { // strawberry-ish berry with green cap
  return group(
    S(0.065 * s, c, { scale: [1, 1.15, 1], at: [0, 0.06 * s, 0] }),
    Co(0.05 * s, 0.035 * s, '#43a047', { at: [0, 0.13 * s, 0], seg: 6 }),
  );
}
function steam(n = 3, y = 0.7, spread = 0.18) {
  const g = group();
  for (let i = 0; i < n; i++) {
    g.add(S(0.07 + i * 0.015, STEAM(), { at: [(i % 2 ? 1 : -1) * spread * 0.5 + i * 0.03, y + i * 0.13, 0], shadow: false, ws: 12, hs: 8 }));
  }
  return g;
}
function lavenderSprig(s = 1) {
  return group(
    Cy(0.012 * s, 0.012 * s, 0.4 * s, '#6d8f4a', { at: [0, 0.2 * s, 0] }),
    Ca(0.035 * s, 0.16 * s, FLAT('#8e6cc9'), { at: [0, 0.42 * s, 0] }),
    Ca(0.028 * s, 0.1 * s, FLAT('#a888dd'), { at: [0.05 * s, 0.33 * s, 0], rot: [0, 0, -0.6] }),
  );
}
/** Small emblem (fruit / symbol) for labels, roughly 0.16 wide, facing +z. */
function emblem(kind) {
  switch (kind) {
    case 'wheat': return group(
      Ca(0.035, 0.1, '#e8b33a', { at: [0, 0.03, 0.02] }),
      Ca(0.03, 0.06, '#e8b33a', { at: [-0.05, 0.0, 0.02], rot: [0, 0, 0.6] }),
      Ca(0.03, 0.06, '#e8b33a', { at: [0.05, 0.0, 0.02], rot: [0, 0, -0.6] }),
      B(0.02, 0.14, 0.02, '#8d6e3a', { at: [0, -0.08, 0.02], r: 0.005 }));
    case 'corn': return group(Ca(0.045, 0.1, '#ffd23f', { at: [0, 0, 0.02] }), S(0.05, '#6fb33a', { at: [0.03, -0.06, 0.02], scale: [0.6, 1.4, 0.5], rot: [0, 0, -0.4] }));
    case 'rice': return group(...[-0.05, 0, 0.05].map((x, i) => S(0.03, '#fffbe8', { at: [x, i === 1 ? 0.03 : -0.01, 0.025], scale: [0.7, 1.4, 0.6], rot: [0, 0, x * 6] })));
    case 'cube': return group(B(0.1, 0.1, 0.1, WHITE, { r: 0.015, at: [0, 0, 0.04], rot: [0.4, 0.6, 0] }));
    case 'tomato': return group(S(0.065, '#e53935', { at: [0, 0, 0.03], scale: [1, 0.85, 0.6] }), Co(0.035, 0.02, '#2e7d32', { at: [0, 0.06, 0.03], seg: 5 }));
    case 'apple': return group(S(0.065, '#e53935', { at: [0, 0, 0.03], scale: [1, 0.9, 0.6] }), leaf('#43a047', 0.6).translateX(0.04).translateY(0.07));
    case 'peach': return group(S(0.065, '#ffab76', { at: [0, 0, 0.03], scale: [1, 0.95, 0.6] }), leaf('#7cb342', 0.6).translateX(0.04).translateY(0.07));
    case 'sun': return group(Cy(0.075, 0.075, 0.02, '#ffc107', { rot: [PI / 2, 0, 0], at: [0, 0, 0.02], seg: 10 }), Cy(0.04, 0.04, 0.03, '#6d4c1d', { rot: [PI / 2, 0, 0], at: [0, 0, 0.03] }));
    case 'drop': return group(S(0.05, '#a0522d', { at: [0, -0.02, 0.03] }), Co(0.045, 0.07, '#a0522d', { at: [0, 0.04, 0.03] }));
    case 'strawberry': return group(berry('#e8304a', 1).translateZ(0.03).translateY(-0.07));
    case 'cherry': return group(S(0.045, '#b71c1c', { at: [-0.04, -0.02, 0.03] }), S(0.045, '#c62828', { at: [0.04, -0.03, 0.03] }), B(0.015, 0.1, 0.015, '#5d4037', { at: [0, 0.05, 0.03], r: 0.005 }));
    case 'pepper': return group(S(0.055, '#d32f2f', { at: [-0.03, 0, 0.03], scale: [0.8, 1.2, 0.6] }), S(0.05, '#ff9800', { at: [0.05, -0.01, 0.03], scale: [0.8, 1.1, 0.6] }));
    case 'blueberry': return group(...[[-0.04, -0.02], [0.04, -0.02], [0, 0.04]].map(([x, y]) => S(0.04, '#3949ab', { at: [x, y, 0.03] })));
    case 'plum': return group(S(0.06, '#5e35b1', { at: [0, 0, 0.03], scale: [0.85, 1.05, 0.6] }), leaf('#558b2f', 0.6).translateX(0.04).translateY(0.07));
    case 'heart': return group(S(0.04, '#e53935', { at: [-0.03, 0.02, 0.03] }), S(0.04, '#e53935', { at: [0.03, 0.02, 0.03] }), Co(0.055, 0.07, '#e53935', { at: [0, -0.035, 0.03], rot: [0, 0, PI], seg: 12 }));
    default: return group(S(0.05, '#e53935', { at: [0, 0, 0.03] }));
  }
}

// ------------------------------------------------------------------ sacks
const SACK_PATCH = { flour: ['#4f86c6', 'wheat'], cornflour: ['#e8892c', 'corn'], riceflour: ['#6aa84f', 'rice'], sugar: ['#e0457b', 'cube'] };
function sack(look, id) {
  const [patch, emb] = SACK_PATCH[id] || ['#4f86c6', 'wheat'];
  const pts = [[0, 0], [0.32, 0], [0.42, 0.06], [0.47, 0.26], [0.45, 0.5], [0.36, 0.68], [0.21, 0.79], [0.17, 0.83], [0.23, 0.9], [0.3, 0.96], [0.31, 0.99]];
  const g = group(
    L('sack', pts, BURLAP, { scale: [1, 1, 0.82] }),
    S(0.3, look.color, { at: [0, 0.97, 0], scale: [1, 0.42, 0.8] }),
    T(0.18, 0.035, TWINE, { at: [0, 0.84, 0], rot: [PI / 2, 0, 0], scale: [1, 0.82, 1] }),
    B(0.36, 0.3, 0.05, patch, { at: [0, 0.4, 0.37], rot: [-0.05, 0, 0], r: 0.04 }),
    B(0.3, 0.24, 0.02, shade(patch, 0.12), { at: [0, 0.4, 0.4], rot: [-0.05, 0, 0], r: 0.02 }),
    at(emblem(emb), 0, 0.41, 0.39, -0.05, 0, 0, 1.15),
    shine(-0.22, 0.52, 0.3, 0.05, [0.6, 1.4, 0.5], [0, 0, 0.2]),
  );
  // a few loose specks of the contents spilling at the foot
  for (const [x, z] of [[0.42, 0.25], [0.5, 0.12], [0.36, 0.38]]) g.add(S(0.04, look.color, { at: [x, 0.02, z], scale: [1, 0.5, 1], shadow: false }));
  return g;
}

function animalFace(kind) {
  const g = group();
  const eyes = (y = 0.03, dx = 0.055, z = 0.06) => { for (const s of [-1, 1]) g.add(S(0.022, '#2b2b2b', { at: [s * dx, y, z], shadow: false })); };
  switch (kind) {
    case 'chickenfeed':
      g.add(S(0.13, WHITE, { scale: [1, 1, 0.5] }));
      for (const x of [-0.04, 0, 0.04]) g.add(S(0.035, '#e53935', { at: [x, 0.13, 0.01] }));
      g.add(Co(0.035, 0.07, '#ff9800', { at: [0, -0.02, 0.08], rot: [PI / 2, 0, 0], seg: 8 }));
      g.add(S(0.025, '#e53935', { at: [0, -0.07, 0.05], scale: [0.7, 1.2, 0.6] }));
      eyes(0.04, 0.05);
      break;
    case 'cowfeed':
      g.add(S(0.13, WHITE, { scale: [1, 1, 0.5] }));
      g.add(S(0.06, '#3b3b3b', { at: [-0.06, 0.06, 0.03], scale: [1, 0.8, 0.5] }));
      g.add(S(0.08, '#f4a6b8', { at: [0, -0.06, 0.06], scale: [1, 0.6, 0.5] }));
      for (const s of [-1, 1]) g.add(Co(0.025, 0.08, '#fff3d6', { at: [s * 0.11, 0.13, 0], rot: [0, 0, -s * 0.7], seg: 8 }));
      eyes(0.04, 0.05);
      break;
    case 'sheepfeed':
      for (const [x, y] of [[-0.09, 0.08], [0, 0.12], [0.09, 0.08], [-0.12, -0.01], [0.12, -0.01]]) g.add(S(0.06, '#fafafa', { at: [x, y, 0], low: true }));
      g.add(S(0.09, '#4e4e4e', { at: [0, -0.02, 0.04], scale: [0.85, 1.05, 0.5] }));
      for (const s of [-1, 1]) g.add(S(0.022, WHITE, { at: [s * 0.035, 0.0, 0.085], shadow: false }));
      break;
    case 'pigfeed':
      g.add(S(0.13, '#f8a5c2', { scale: [1, 0.95, 0.5] }));
      for (const s of [-1, 1]) g.add(Co(0.04, 0.07, '#f48fb1', { at: [s * 0.09, 0.12, 0], rot: [0, 0, -s * 0.5], seg: 6 }));
      g.add(Cy(0.055, 0.055, 0.04, '#f06292', { at: [0, -0.03, 0.07], rot: [PI / 2, 0, 0] }));
      for (const s of [-1, 1]) g.add(S(0.012, '#8d2a4f', { at: [s * 0.02, -0.03, 0.09], shadow: false }));
      eyes(0.045, 0.05);
      break;
    case 'goatfeed':
      g.add(S(0.12, '#d7ccc8', { scale: [0.9, 1.05, 0.5] }));
      for (const s of [-1, 1]) g.add(T(0.06, 0.018, '#8d6e63', { at: [s * 0.06, 0.14, 0], rot: [0, 0, s > 0 ? 0 : PI], arc: PI * 0.8 }));
      g.add(Co(0.03, 0.08, '#efebe9', { at: [0, -0.15, 0.03], rot: [PI, 0, 0], seg: 8 }));
      eyes(0.03, 0.045);
      break;
    default: // duckfeed
      g.add(S(0.12, '#fff176', { scale: [1, 1, 0.5] }));
      g.add(S(0.07, '#ff9800', { at: [0, -0.04, 0.07], scale: [1, 0.4, 0.7] }));
      eyes(0.04, 0.05);
  }
  return g;
}
function feedsack(look, id) {
  const bag = '#f1e4c6';
  const g = group(
    B(0.8, 0.86, 0.46, bag, { at: [0, 0.43, 0], r: 0.12 }),
    B(0.84, 0.14, 0.22, shade(bag, -0.06), { at: [0, 0.9, 0], r: 0.05 }),
    B(0.86, 0.02, 0.23, '#b0956a', { at: [0, 0.9, 0], r: 0 }),
    B(0.82, 0.26, 0.48, look.color, { at: [0, 0.42, 0], r: 0.06 }),
    B(0.82, 0.04, 0.485, shade(look.color, -0.18), { at: [0, 0.56, 0], r: 0.015 }),
    B(0.82, 0.04, 0.485, shade(look.color, -0.18), { at: [0, 0.28, 0], r: 0.015 }),
    Cy(0.2, 0.2, 0.05, WHITE, { at: [0, 0.44, 0.24], rot: [PI / 2, 0, 0], seg: 28 }),
    T(0.2, 0.02, shade(look.color, -0.3), { at: [0, 0.44, 0.27], seg: 28 }),
    at(animalFace(id), 0, 0.44, 0.28, 0, 0, 0, 1.15),
    shine(-0.28, 0.72, 0.24, 0.05, [0.6, 1.4, 0.4]),
  );
  for (const [x, z] of [[0.48, 0.24], [0.56, 0.08], [0.42, 0.36], [0.55, 0.3]]) g.add(S(0.035, shade(look.color, -0.2, 0.1), { at: [x, 0.02, z], scale: [1, 0.6, 1], shadow: false, low: true }));
  return g;
}

// ------------------------------------------------------------------ bottles & jars
const BOTTLE = {
  ketchup: { cap: '#c62828', label: WHITE, emb: 'tomato' },
  syrup: { cap: WOOD, label: '#fff3c4', emb: 'drop' },
  sunoil: { cap: '#43a047', label: '#2e7d32', emb: 'sun' },
  applejuice: { cap: '#43a047', label: WHITE, emb: 'apple' },
  peachjuice: { cap: '#ff7043', label: WHITE, emb: 'peach' },
};
function bottle(look, id) {
  const o = BOTTLE[id] || BOTTLE.applejuice;
  const pts = [[0, 0], [0.24, 0], [0.27, 0.03], [0.27, 0.5], [0.24, 0.6], [0.13, 0.72], [0.1, 0.84], [0.115, 0.86], [0.115, 0.9], [0, 0.9]];
  return group(
    L('bottle', pts, look.color),
    Cy(0.276, 0.276, 0.26, o.label, { at: [0, 0.3, 0], seg: 28 }),
    Cy(0.278, 0.278, 0.03, shade(o.cap, 0), { at: [0, 0.44, 0], seg: 28 }),
    Cy(0.278, 0.278, 0.03, shade(o.cap, 0), { at: [0, 0.16, 0], seg: 28 }),
    at(emblem(o.emb), 0, 0.3, 0.26, 0, 0, 0, 1.3),
    o.cap === WOOD ? Cy(0.09, 0.08, 0.14, WOOD, { at: [0, 0.94, 0] }) : Cy(0.125, 0.125, 0.12, o.cap, { at: [0, 0.92, 0] }),
    o.cap === WOOD ? null : T(0.125, 0.015, shade(o.cap, -0.15), { at: [0, 0.88, 0], rot: [PI / 2, 0, 0] }),
    shine(-0.16, 0.56, 0.2, 0.045, [0.5, 2.2, 0.5], [0, 0, 0.15]),
    shine(-0.07, 0.75, 0.09, 0.025, [0.6, 1.6, 0.5], [0, 0, 0.5]),
  );
}
function smallbottle(look) {
  return group(
    S(0.3, look.color, { at: [0, 0.3, 0] }),
    Cy(0.08, 0.1, 0.22, shade(look.color, 0.1), { at: [0, 0.66, 0] }),
    Cy(0.075, 0.065, 0.12, WOOD, { at: [0, 0.81, 0] }),
    T(0.09, 0.015, TWINE, { at: [0, 0.6, 0], rot: [PI / 2, 0, 0] }),
    B(0.2, 0.13, 0.02, CREAM, { at: [0.12, 0.42, 0.29], rot: [0, 0.4, -0.2], r: 0.02 }),
    at(lavenderSprig(1), 0.12, 0.38, 0.12, 0.2, 0, -0.5),
    shine(-0.14, 0.42, 0.22, 0.06, [0.6, 1.3, 0.5]),
  );
}
const JAR = {
  strawberryjam: { cloth: '#e53935', emb: 'strawberry' }, cherrycompote: { cloth: '#d81b60', emb: 'cherry' },
  lecso: { cloth: '#43a047', emb: 'pepper' }, blueberryjam: { cloth: '#1e88e5', emb: 'blueberry' },
  plumjam: { cloth: '#8e24aa', emb: 'plum' },
};
function jar(look, id) {
  const o = JAR[id] || JAR.strawberryjam;
  const g = group(
    Cy(0.3, 0.3, 0.56, look.color, { at: [0, 0.29, 0], seg: 28 }),
    T(0.29, 0.02, shade(look.color, 0.15), { at: [0, 0.02, 0], rot: [PI / 2, 0, 0] }),
    Cy(0.32, 0.4, 0.13, o.cloth, { at: [0, 0.62, 0], seg: 28 }),
    Cy(0.32, 0.32, 0.05, o.cloth, { at: [0, 0.7, 0], seg: 28 }),
    T(0.31, 0.02, TWINE, { at: [0, 0.6, 0], rot: [PI / 2, 0, 0] }),
    S(0.035, TWINE, { at: [0, 0.6, 0.32] }),
    B(0.36, 0.22, 0.04, CREAM, { at: [0, 0.3, 0.295], r: 0.03 }),
    at(emblem(o.emb), 0, 0.31, 0.3, 0, 0, 0, 1.3),
    shine(-0.2, 0.36, 0.22, 0.04, [0.5, 2.6, 0.5], [0, 0, 0]),
  );
  for (const s of [-0.1, 0.1]) {
    g.add(B(0.06, 0.012, 0.66, WHITE, { at: [s, 0.727, 0], r: 0.004, shadow: false }));
    g.add(B(0.66, 0.012, 0.06, WHITE, { at: [0, 0.727, s], r: 0.004, shadow: false }));
  }
  // chunky fruit pieces pressed against the glass
  for (const [a, y] of [[0.4, 0.12], [1.1, 0.48], [1.6, 0.16], [-0.3, 0.5]]) g.add(S(0.06, shade(look.color, 0.12), { at: [Math.sin(a) * 0.27, y, Math.cos(a) * 0.27], scale: [1, 1, 0.5], rot: [0, a, 0], shadow: false }));
  return g;
}

// ------------------------------------------------------------------ bakery
function loaf(look, id) {
  const crumb = '#fbe3b0';
  if (id === 'garlicbread') {
    const g = group(Ca(0.17, 0.8, look.color, { at: [-0.05, 0.17, -0.1], rot: [0, 0.15, PI / 2], scale: [1, 1, 0.85] }));
    for (let i = 0; i < 3; i++) g.add(B(0.05, 0.03, 0.22, shade(look.color, 0.12), { at: [-0.35 + i * 0.25, 0.32, -0.12], rot: [0, 0.7, 0], r: 0.01 }));
    for (const [x, rz] of [[0.0, 0.25], [0.32, -0.25]]) {
      const sl = group(
        Cy(0.17, 0.17, 0.08, look.color, { rot: [PI / 2, 0, 0] }),
        Cy(0.145, 0.145, 0.085, crumb, { rot: [PI / 2, 0, 0] }),
        Cy(0.12, 0.12, 0.09, '#9ccc65', { rot: [PI / 2, 0, 0] }),
      );
      for (const [dx, dy] of [[-0.05, 0.03], [0.04, -0.04], [0.05, 0.05], [-0.03, -0.06]]) sl.add(S(0.022, look.topping, { at: [dx, dy, 0.05], shadow: false }));
      g.add(at(sl, x, 0.17, 0.18, -0.25, 0, rz));
    }
    g.add(S(0.07, '#f5f0e6', { at: [0.45, 0.06, -0.05], scale: [0.8, 1, 0.8] }), Co(0.03, 0.06, '#f5f0e6', { at: [0.45, 0.14, -0.05] }));
    return g;
  }
  const g = group(
    S(0.5, look.color, { at: [0, 0.24, -0.05], scale: [1, 0.55, 0.62] }),
    S(0.46, shade(look.color, -0.1), { at: [0, 0.2, -0.05], scale: [1.02, 0.4, 0.64], shadow: false }),
    shine(-0.2, 0.46, 0.08, 0.06, [1.6, 0.6, 0.6], [0, 0, 0.2]),
  );
  for (let i = 0; i < 3; i++) g.add(S(0.12, shade(look.color, 0.14, 0.05), { at: [-0.25 + i * 0.25, 0.5, -0.05], rot: [0, 0.6, 0], scale: [1.4, 0.18, 0.3], shadow: false }));
  const sl = group(
    B(0.42, 0.07, 0.34, look.color, { r: 0.03 }),
    B(0.36, 0.075, 0.28, crumb, { r: 0.03 }),
    S(0.17, crumb, { at: [0, 0, -0.13], scale: [1.15, 0.2, 0.5], shadow: false }),
  );
  g.add(at(sl, 0.25, 0.05, 0.38, 0, -0.3, 0));
  return g;
}
function flatbread(look) {
  const g = group(
    Cy(0.5, 0.45, 0.12, '#3c3c3c', { at: [0, 0.06, 0], seg: 28 }),
    B(0.5, 0.06, 0.1, '#3c3c3c', { at: [0.7, 0.1, 0], r: 0.03 }),
    Cy(0.44, 0.44, 0.12, look.color, { at: [0, 0.14, 0], seg: 28 }),
    Cy(0.44, 0.44, 0.02, shade(look.color, 0.08), { at: [0, 0.205, 0], seg: 28 }),
    B(0.15, 0.06, 0.12, '#fff59d', { at: [0.05, 0.25, 0.05], rot: [0, 0.4, 0], r: 0.02 }),
    shine(-0.05, 0.27, 0.07, 0.03),
  );
  for (const a of [0, PI / 3, -PI / 3]) g.add(B(0.88, 0.025, 0.02, shade(look.color, -0.2), { at: [0, 0.215, 0], rot: [0, a, 0], r: 0 }));
  return g;
}
function cookies(look) {
  const g = group();
  const chip = '#4e2a14';
  const cookie = (x, y, z, rx = 0, rz = 0) => {
    const c = group(S(0.3, look.color, { scale: [1, 0.22, 1] }));
    for (const [dx, dz] of [[-0.12, 0.05], [0.1, -0.08], [0.02, 0.13], [0.12, 0.1], [-0.06, -0.14]]) c.add(S(0.035, chip, { at: [dx, 0.055, dz], shadow: false, ws: 8, hs: 6 }));
    return at(c, x, y, z, rx, 0, rz);
  };
  g.add(cookie(-0.08, 0.07, -0.08), cookie(-0.05, 0.19, -0.1, 0.05), cookie(-0.1, 0.31, -0.07, -0.05));
  g.add(cookie(0.25, 0.3, 0.22, 1.2, -0.15));
  return g;
}
function pie(look) {
  const crust = '#e6ad5c';
  const g = group(
    Cy(0.5, 0.42, 0.14, '#5c8fd6', { at: [0, 0.07, 0], seg: 28 }),
    T(0.47, 0.035, '#7aa8e8', { at: [0, 0.14, 0], rot: [PI / 2, 0, 0], ts: 32 }),
    Cy(0.43, 0.43, 0.04, look.color, { at: [0, 0.16, 0], seg: 28 }),
    T(0.42, 0.065, crust, { at: [0, 0.18, 0], rot: [PI / 2, 0, 0], ts: 32, rs: 10 }),
  );
  for (const s of [-0.22, 0, 0.22]) {
    const len = 2 * Math.sqrt(0.42 * 0.42 - s * s);
    g.add(B(0.08, 0.035, len, crust, { at: [s, 0.2, 0], r: 0.015 }));
    g.add(B(len, 0.035, 0.08, shade(crust, 0.05), { at: [0, 0.225, s], r: 0.015 }));
  }
  g.add(S(0.09, '#fffaf0', { at: [0.1, 0.27, 0.1], scale: [1, 0.7, 1] }), Co(0.05, 0.08, '#fffaf0', { at: [0.1, 0.33, 0.1], seg: 8 }));
  return g;
}
function kifli(look) {
  const g = group();
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) - 0.5;          // -0.5..0.5
    const a = t * 3.6;
    const r = 0.15 * (1 - Math.abs(t) * 1.4) + 0.04;
    const x = Math.sin(a) * 0.36, z = Math.cos(a) * 0.36 - 0.18;
    g.add(S(r, i % 2 ? look.color : shade(look.color, -0.07, 0.05), { at: [x, r * 0.85, z], rot: [0, a, 0], scale: [1.05, 0.85, 0.85] }));
  }
  g.add(shine(-0.05, 0.27, 0.2, 0.04, [1.5, 0.5, 0.5]));
  for (const [x, z] of [[0.05, 0.18], [-0.12, 0.16], [0.18, 0.12]]) g.add(B(0.025, 0.025, 0.025, WHITE, { at: [x, 0.3, z], r: 0.006, shadow: false }));
  return g;
}

// ------------------------------------------------------------------ workshop / materials
function planks(look) {
  const g = group();
  const c = look.color;
  for (let i = 0; i < 3; i++) g.add(B(1, 0.1, 0.24, i === 1 ? shade(c, 0.05) : c, { at: [0, 0.05, -0.27 + i * 0.27], r: 0.02 }));
  for (let i = 0; i < 2; i++) g.add(B(1, 0.1, 0.24, shade(c, i ? -0.04 : 0.03), { at: [0.05, 0.15, -0.13 + i * 0.27], rot: [0, 0.12, 0], r: 0.02 }));
  g.add(B(1, 0.1, 0.24, shade(c, 0.07), { at: [-0.02, 0.25, 0.0], rot: [0, -0.18, 0], r: 0.02 }));
  // grain lines on the top plank + end grain on the front ends
  for (const dz of [-0.05, 0.05]) g.add(B(0.75, 0.01, 0.015, shade(c, -0.15), { at: [-0.02, 0.302, dz], rot: [0, -0.18, 0], r: 0 }));
  for (const [x, y, z, ry] of [[0.42, 0.3, 0.1, -0.18], [-0.48, 0.25, 0.02, -0.18]]) g.add(S(0.025, shade(c, -0.2), { at: [x, y, z], rot: [0, ry, 0], scale: [1, 0.2, 1.4], shadow: false }));
  return g;
}
function bricks(look) {
  const g = group();
  const c = look.color;
  const cs = [c, shade(c, 0.05), shade(c, -0.04), shade(c, 0.08, -0.05), shade(c, -0.07), shade(c, 0.03)];
  let k = 0;
  for (const [n, y] of [[3, 0.1], [2, 0.3], [1, 0.5]]) {
    for (let i = 0; i < n; i++) g.add(B(0.4, 0.19, 0.24, cs[k++], { at: [(i - (n - 1) / 2) * 0.42, y, 0], r: 0.035 }));
  }
  for (const [x, y] of [[-0.42, 0.1], [0.21, 0.3]]) g.add(B(0.4, 0.19, 0.24, shade(c, -0.03), { at: [x, y, -0.27], r: 0.035 }));
  g.add(shine(-0.12, 0.6, 0.09, 0.03, [1.6, 0.5, 0.6]));
  return g;
}
function axe() {
  const g = group(
    Cy(0.045, 0.055, 1.05, WOOD, { at: [0, 0.5, 0] }),
    Cy(0.06, 0.06, 0.2, '#c62828', { at: [0, 0.1, 0] }),
    B(0.32, 0.22, 0.1, '#7d8a96', { at: [0.13, 0.88, 0], r: 0.03 }),
    B(0.12, 0.36, 0.08, METAL_L, { at: [0.33, 0.88, 0], r: 0.03 }),
    B(0.1, 0.16, 0.12, '#5f6b76', { at: [-0.04, 0.88, 0], r: 0.03 }),
    shine(0.33, 0.95, 0.045, 0.025, [0.6, 2, 0.5], [0, 0, 0]),
  );
  return at(group(g), 0, 0, 0, 0, 0, -0.55);
}
function pickaxe() {
  const arc = 2.2, r = 0.55, top = 1.0;
  const g = group(
    Cy(0.045, 0.055, 1.05, WOOD, { at: [0, 0.5, 0] }),
    Cy(0.06, 0.06, 0.2, '#1e88e5', { at: [0, 0.1, 0] }),
    T(r, 0.06, '#8a96a2', { at: [0, top - r, 0], rot: [0, 0, PI / 2 - arc / 2], arc, rs: 8, ts: 20, scale: [1, 1, 0.9] }),
    B(0.16, 0.16, 0.14, '#5f6b76', { at: [0, top, 0], r: 0.03 }),
  );
  for (const [a, phi] of [[PI / 2 + arc / 2, PI / 2 + arc / 2], [PI / 2 - arc / 2, PI / 2 - arc / 2 + PI]]) {
    g.add(Co(0.06, 0.14, METAL_L, { at: [Math.cos(a) * r, top - r + Math.sin(a) * r, 0], rot: [0, 0, phi], seg: 8 }));
  }
  g.add(shine(-0.15, top + 0.04, 0.05, 0.025, [2, 0.6, 0.5]));
  return at(group(g), 0, 0, 0, 0, 0, -0.5);
}
function logs(look) {
  const g = group();
  const bark = look.color;
  for (const [x, y, ln] of [[-0.19, 0.18, 0.85], [0.19, 0.18, 0.8], [0, 0.5, 0.9]]) {
    g.add(Cy(0.18, 0.18, ln, bark, { at: [x, y, 0], rot: [PI / 2, 0, 0], seg: 14 }));
    g.add(Cy(0.155, 0.155, 0.02, '#ecc58c', { at: [x, y, ln / 2 + 0.005], rot: [PI / 2, 0, 0], seg: 18 }));
    g.add(T(0.09, 0.012, '#c4914f', { at: [x, y, ln / 2 + 0.017], ts: 18, rs: 4, shadow: false }));
  }
  g.add(leaf('#7cb342', 1.1).translateY(0.69).translateX(0.05).rotateY(0.6));
  return g;
}
function stones(look) {
  const g = group();
  for (const [x, z, r, sy, d] of [[-0.2, -0.05, 0.3, 0.75, 0], [0.22, -0.1, 0.26, 0.8, -0.05], [0.02, 0.22, 0.22, 0.7, 0.06], [0.0, -0.05, 0.2, 0.9, 0.1]]) {
    g.add(S(r, FLAT(shade(look.color, d)), { low: true, at: [x, r * sy * 0.85 + (x === 0 && z < 0 ? 0.28 : 0), z], scale: [1, sy, 0.95], rot: [x * 2, z * 3, 0] }));
  }
  g.add(S(0.06, FLAT('#7cb342'), { low: true, det: 0, at: [-0.3, 0.05, 0.25], scale: [1, 0.5, 1] }));
  return g;
}
function baitcan() {
  const g = group(
    Cy(0.28, 0.28, 0.42, METAL, { at: [0, 0.21, 0], seg: 28 }),
    Cy(0.285, 0.285, 0.24, '#2f8f4e', { at: [0, 0.2, 0], seg: 28 }),
    T(0.28, 0.022, METAL_L, { at: [0, 0.42, 0], rot: [PI / 2, 0, 0] }),
    T(0.28, 0.022, METAL_L, { at: [0, 0.01, 0], rot: [PI / 2, 0, 0] }),
    Cy(0.26, 0.26, 0.02, '#5d3a20', { at: [0, 0.4, 0] }),
    Cy(0.27, 0.27, 0.02, METAL_L, { at: [0, 0.62, -0.27], rot: [-1.25, 0, 0] }),
    shine(-0.2, 0.3, 0.2, 0.035, [0.5, 2, 0.5], [0, 0, 0]),
  );
  const pink = '#f48fb1';
  const worm = (pts) => { for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]]; const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const len = Math.hypot(dx, dy, dz); const w = Ca(0.05, len, i % 2 ? pink : shade(pink, -0.06), { at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] }); w.lookAt(w.position.x + dx, w.position.y + dy, w.position.z + dz); w.rotateX(PI / 2); g.add(w); } };
  worm([[0.05, 0.38, 0.05], [0.12, 0.56, 0.12], [0.25, 0.6, 0.25], [0.32, 0.45, 0.3]]);
  worm([[-0.1, 0.38, 0.0], [-0.14, 0.58, 0.05], [-0.04, 0.68, 0.12]]);
  g.add(S(0.022, '#2b2b2b', { at: [-0.04, 0.71, 0.16], shadow: false }));
  return g;
}

// ------------------------------------------------------------------ dairy
function butter(look) {
  return group(
    B(0.95, 0.07, 0.62, WOOD, { at: [0, 0.035, 0], r: 0.03 }),
    B(0.66, 0.02, 0.46, WHITE, { at: [-0.05, 0.08, -0.02], rot: [0, 0.1, 0], r: 0.005 }),
    B(0.5, 0.28, 0.34, look.color, { at: [-0.08, 0.23, -0.04], rot: [0, 0.1, 0], r: 0.05 }),
    B(0.07, 0.26, 0.32, shade(look.color, 0.05), { at: [0.27, 0.19, 0.04], rot: [0, 0.1, -0.35], r: 0.03 }),
    B(0.42, 0.02, 0.08, METAL_L, { at: [0.15, 0.085, 0.25], rot: [0, -0.3, 0], r: 0.01 }),
    B(0.2, 0.05, 0.07, WOOD_D, { at: [-0.18, 0.1, 0.33], rot: [0, -0.3, 0], r: 0.02 }),
    S(0.07, look.color, { at: [-0.1, 0.4, -0.02], scale: [1.2, 0.5, 0.8] }),
    shine(-0.22, 0.38, 0.12, 0.03, [1.6, 0.5, 0.5]),
  );
}
function jug(look) {
  const blue = '#5c9ce0';
  const pts = [[0, 0], [0.24, 0], [0.28, 0.05], [0.31, 0.25], [0.27, 0.5], [0.22, 0.62], [0.25, 0.72], [0.27, 0.76]];
  return group(
    L('jug', pts, blue),
    Cy(0.31, 0.3, 0.08, WHITE, { at: [0, 0.27, 0], seg: 28 }),
    Cy(0.25, 0.25, 0.02, look.color, { at: [0, 0.72, 0] }),
    Co(0.09, 0.16, blue, { at: [0.3, 0.72, 0.12], rot: [0, 0.4, -1.8], seg: 10, scale: [1, 1, 0.6] }),
    T(0.15, 0.04, blue, { at: [-0.3, 0.44, 0], rot: [0, 0, PI / 2], arc: PI }),
    Ca(0.035, 0.12, look.color, { at: [0.18, 0.66, 0.18] }),
    S(0.05, look.color, { at: [0.0, 0.74, 0.0], scale: [1.2, 0.5, 1] }),
    shine(-0.17, 0.45, 0.22, 0.045, [0.5, 1.8, 0.5], [0, 0, 0]),
  );
}
function cheese(look) {
  const c = look.color, w = 0.9, h = 0.62, d = 0.4;
  const wedge = group(
    Pr(w, h, d, c, { rot: [-PI / 2, 0, 0], at: [0, d / 2, 0] }),
    B(w + 0.01, d, 0.05, shade(c, -0.12, 0.05), { at: [0, d / 2, 0.005], r: 0.015 }),
  );
  // holes: dark caps pressed into the right-hand cut face and the top
  const hole = shade(c, -0.15, 0.1);
  const n = [0.8, 0, -0.6];
  for (const [t, y, r] of [[0.25, 0.12, 0.07], [0.55, 0.26, 0.05], [0.38, 0.3, 0.04], [0.7, 0.1, 0.045], [0.18, 0.3, 0.035]]) {
    const px = w / 2 - t * (w / 2), pz = -t * h;
    wedge.add(S(r, hole, { at: [px + n[0] * r * 0.55, y, pz + n[2] * r * 0.55], shadow: false }));
  }
  for (const [x, z, r] of [[-0.1, -0.15, 0.06], [0.1, -0.3, 0.04], [0.0, -0.45, 0.03]]) wedge.add(Cy(r, r, 0.01, hole, { at: [x, d + 0.004, z], shadow: false }));
  return at(group(wedge), 0, 0, 0, 0, -PI / 2, 0);
}
function cheesewheel(look) {
  const rind = '#efe0bd';
  const g = group(
    Cy(0.45, 0.45, 0.3, rind, { at: [0, 0.17, 0], seg: 32 }),
    T(0.43, 0.04, rind, { at: [0, 0.32, 0], rot: [PI / 2, 0, 0], ts: 32 }),
    T(0.43, 0.04, rind, { at: [0, 0.02, 0], rot: [PI / 2, 0, 0], ts: 32 }),
    Cy(0.43, 0.43, 0.02, look.color, { at: [0, 0.34, 0], seg: 32 }),
    Pr(0.36, 0.45, 0.24, look.color, { at: [0.42, 0.12, 0.38], rot: [-PI / 2, 0, 0.0] }),
    B(0.37, 0.24, 0.03, rind, { at: [0.42, 0.12, 0.385], r: 0.01 }),
    leaf('#558b2f', 1.2).translateY(0.37).translateX(-0.12),
  );
  for (const [x, z] of [[0.1, 0.15], [-0.15, -0.1], [0.2, -0.15], [-0.05, 0.25], [0.25, 0.05], [-0.25, 0.12]]) g.add(B(0.04, 0.012, 0.02, '#4e7d2a', { at: [x, 0.355, z], rot: [0, x * 10, 0], r: 0, shadow: false }));
  return g;
}

// ------------------------------------------------------------------ textiles
function cloth(look) {
  const c = look.color, d = shade(c, -0.08);
  const g = group();
  for (let i = 0; i < 3; i++) g.add(B(0.85, 0.13, 0.58, i % 2 ? d : c, { at: [(i % 2 ? 0.03 : -0.02), 0.07 + i * 0.13, 0], r: 0.06 }));
  g.add(Cy(0.14, 0.14, 0.9, '#d98c7a', { at: [0, 0.52, 0], rot: [0, 0, PI / 2], seg: 20 }));
  g.add(Cy(0.08, 0.08, 0.905, shade('#d98c7a', -0.08), { at: [0, 0.52, 0], rot: [0, 0, PI / 2], seg: 16 }));
  for (const x of [-0.25, 0.25]) g.add(B(0.07, 0.04, 0.6, '#c94f40', { at: [x, 0.39, 0], r: 0.01 }));
  g.add(B(0.1, 0.41, 0.6, '#3f7cc4', { at: [0, 0.2, 0.0], r: 0.03 }));
  g.add(S(0.06, '#3f7cc4', { at: [0, 0.3, 0.3], scale: [1.4, 1, 0.6] }));
  return g;
}
function yarn(look) {
  const c = look.color;
  const g = group(S(0.4, c, { at: [0, 0.4, 0] }));
  for (const [rx, ry, col] of [[0.3, 0, -0.1], [1.2, 0.4, -0.06], [-0.5, 1.2, -0.12], [1.6, -0.6, 0.06], [0.9, 2.0, -0.04]]) {
    g.add(T(0.4, 0.024, shade(c, col), { at: [0, 0.4, 0], rot: [rx, ry, 0], ts: 32, rs: 5, shadow: false }));
  }
  for (let i = 0; i < 3; i++) g.add(Ca(0.025, 0.16, c, { at: [0.3 + i * 0.12, 0.03, 0.3 - i * 0.04], rot: [PI / 2, 0, PI / 2 + (i % 2 ? 0.5 : -0.5)] }));
  for (const s of [-1, 1]) {
    g.add(at(group(Cy(0.02, 0.02, 0.9, '#d7b06e'), S(0.045, '#3f7cc4', { at: [0, 0.46, 0] })), s * 0.1, 0.62, -0.05, -0.2, 0, -s * 0.45));
  }
  g.add(shine(-0.16, 0.6, 0.27, 0.06, [1, 0.7, 0.5]));
  return g;
}
function scarf(look) {
  const c = look.color, st = WHITE;
  const g = group();
  for (let i = 0; i < 3; i++) {
    g.add(B(0.9, 0.13, 0.32, c, { at: [i % 2 ? 0.05 : -0.05, 0.065 + i * 0.13, 0], r: 0.06 }));
    for (const x of [-0.2, 0.2]) g.add(B(0.07, 0.135, 0.325, st, { at: [x + (i % 2 ? 0.05 : -0.05), 0.065 + i * 0.13, 0], r: 0.02 }));
  }
  const tail = group(B(0.3, 0.5, 0.1, c, { r: 0.05 }), B(0.305, 0.07, 0.105, st, { at: [0, 0.08, 0], r: 0.02 }), B(0.305, 0.07, 0.105, st, { at: [0, -0.1, 0], r: 0.02 }));
  for (let i = 0; i < 5; i++) tail.add(B(0.035, 0.12, 0.04, c, { at: [-0.12 + i * 0.06, -0.3, 0], r: 0.012 }));
  g.add(at(tail, 0.15, 0.25, 0.22, 0.1, 0, 0.05));
  return g;
}
function sweater(look) {
  const c = look.color, dk = shade(c, -0.1);
  const g = group(
    B(0.62, 0.62, 0.16, c, { at: [0, 0.42, 0], r: 0.06 }),
    B(0.64, 0.1, 0.17, dk, { at: [0, 0.12, 0], r: 0.04 }),
    T(0.11, 0.035, dk, { at: [0, 0.72, 0], rot: [PI / 2, 0, 0] }),
  );
  for (const s of [-1, 1]) {
    g.add(B(0.18, 0.56, 0.15, c, { at: [s * 0.4, 0.43, 0], rot: [0, 0, s * 0.5], r: 0.06 }));
    g.add(B(0.19, 0.09, 0.16, dk, { at: [s * 0.52, 0.2, 0], rot: [0, 0, s * 0.5], r: 0.03 }));
  }
  for (let i = 0; i < 5; i++) g.add(B(0.07, 0.07, 0.02, i % 2 ? '#ffd54f' : WHITE, { at: [-0.22 + i * 0.11, 0.45, 0.085], rot: [0, 0, PI / 4], r: 0.01 }));
  for (const y of [0.33, 0.57]) g.add(B(0.6, 0.025, 0.02, WHITE, { at: [0, y, 0.085], r: 0 }));
  return g;
}
function pillow(look) {
  const c = look.color, pip = '#f48fb1';
  const p = group(
    B(0.9, 0.3, 0.72, c, { r: 0.14 }),
    B(0.94, 0.06, 0.76, pip, { r: 0.03 }),
  );
  for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2; p.add(S(0.07, '#e91e63', { at: [Math.cos(a) * 0.08, 0.15, Math.sin(a) * 0.08], scale: [1, 0.35, 1] })); }
  p.add(S(0.05, '#ffd54f', { at: [0, 0.17, 0], scale: [1, 0.5, 1] }));
  p.add(leaf('#66bb6a', 1).translateY(0.15).translateX(0.18).translateZ(0.12));
  for (const [x, z] of [[-0.45, -0.36], [0.45, -0.36], [-0.45, 0.36], [0.45, 0.36]]) p.add(S(0.05, pip, { at: [x, 0, z] }));
  return at(group(p), 0, 0.42, 0, 1.15, 0, 0);
}
function quilt(look) {
  const c = look.color;
  const g = group();
  for (let i = 0; i < 3; i++) g.add(B(0.92, 0.13, 0.62, i % 2 ? shade(c, -0.06) : c, { at: [(i % 2 ? 0.02 : -0.02), 0.065 + i * 0.13, 0], r: 0.06 }));
  const cols = [CREAM, '#ffd54f', '#64b5f6', CREAM, '#81c784', '#ffd54f'];
  for (let i = 0; i < 6; i++) g.add(B(0.24, 0.02, 0.22, cols[i], { at: [-0.29 + (i % 3) * 0.29, 0.395, -0.13 + Math.floor(i / 3) * 0.26], r: 0.01 }));
  for (let i = 0; i < 3; i++) g.add(B(0.2, 0.09, 0.02, cols[(i + 2) % 6], { at: [-0.3 + i * 0.3, 0.33, 0.315], r: 0.01 }));
  return g;
}

// ------------------------------------------------------------------ patisserie
function cake(look) {
  const c = look.color, cream = WHITE;
  const g = group(
    Cy(0.52, 0.52, 0.04, '#e8eef3', { at: [0, 0.2, 0], seg: 32 }),
    Cy(0.08, 0.16, 0.2, '#e8eef3', { at: [0, 0.1, 0] }),
    Cy(0.42, 0.42, 0.34, c, { at: [0, 0.39, 0], seg: 32 }),
    T(0.42, 0.04, cream, { at: [0, 0.23, 0], rot: [PI / 2, 0, 0], ts: 32 }),
    Cy(0.28, 0.28, 0.24, c, { at: [0, 0.68, 0], seg: 28 }),
    T(0.42, 0.035, cream, { at: [0, 0.56, 0], rot: [PI / 2, 0, 0], ts: 32 }),
    Cy(0.285, 0.285, 0.04, cream, { at: [0, 0.79, 0], seg: 28 }),
  );
  for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2 + 0.3; g.add(Ca(0.035, 0.05 + (i % 2) * 0.04, cream, { at: [Math.sin(a) * 0.285, 0.74 - (i % 2) * 0.02, Math.cos(a) * 0.285] })); }
  g.add(at(berry(look.topping, 1.4), 0, 0.8, 0));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; g.add(at(berry(look.topping, 1), Math.sin(a) * 0.35, 0.56, Math.cos(a) * 0.35, 0, a, 0)); }
  g.add(shine(-0.2, 0.5, 0.33, 0.04, [0.5, 1.5, 0.5], [0, 0, 0]));
  return g;
}
function cakeslice(look, id) {
  const c = look.color;
  const coffee = id === 'coffeecake';
  const cream = coffee ? '#d7b899' : '#fff5dd';
  const top = coffee ? '#3e2418' : '#7a4a1e';
  const g = group(
    Cy(0.5, 0.44, 0.05, WHITE, { at: [0, 0.025, 0], seg: 28 }),
    T(0.46, 0.025, '#d6e4f0', { at: [0, 0.05, 0], rot: [PI / 2, 0, 0], ts: 32 }),
  );
  const w = 0.5, h = 0.75;
  const layers = [[c, 0.12], [cream, 0.06], [c, 0.12], [cream, 0.06], [top, 0.05]];
  let y = 0.05;
  for (const [col, th] of layers) {
    g.add(Pr(w, h, th, col, { rot: [-PI / 2, 0, 0], at: [0, y + th / 2, 0.38] }));
    y += th;
  }
  if (coffee) {
    for (const [x, z] of [[0, 0.15], [-0.05, 0.0], [0.05, -0.12]]) g.add(S(0.05, '#5d3a1a', { at: [x, y + 0.03, z], scale: [0.8, 0.5, 1.1] }));
  } else {
    g.add(S(0.07, '#ffb300', { at: [0, y + 0.02, 0.1], scale: [1.2, 0.4, 1.5] }));
    g.add(Ca(0.03, 0.08, '#ffb300', { at: [0.13, y - 0.09, 0.2] }));
    g.add(S(0.035, '#ffb300', { at: [-0.12, y - 0.08, 0.22], scale: [1, 1.4, 1] }));
  }
  return at(group(g), 0, 0, 0, 0, -PI / 2 + 0.4, 0);
}
function pancakes(look) {
  const jam = '#c2185b';
  const g = group(
    Cy(0.52, 0.46, 0.05, WHITE, { at: [0, 0.025, 0], seg: 28 }),
    T(0.48, 0.025, '#d6e4f0', { at: [0, 0.05, 0], rot: [PI / 2, 0, 0], ts: 32 }),
  );
  for (const [z, y, x] of [[-0.12, 0.17, 0], [0.12, 0.17, 0], [0, 0.36, 0.02]]) {
    g.add(Cy(0.12, 0.12, 0.62, look.color, { at: [x, y, z], rot: [0, 0, PI / 2], seg: 18 }));
    g.add(Cy(0.075, 0.075, 0.635, jam, { at: [x, y, z], rot: [0, 0, PI / 2], seg: 14 }));
    g.add(Cy(0.04, 0.04, 0.64, shade(look.color, 0.1), { at: [x, y, z], rot: [0, 0, PI / 2], seg: 10 }));
  }
  g.add(Ca(0.03, 0.4, jam, { at: [0.02, 0.48, 0.0], rot: [0, 0.5, PI / 2] }));
  for (const [x, z] of [[-0.2, 0.05], [0.15, -0.05], [0.0, 0.08], [-0.05, -0.1]]) g.add(S(0.022, WHITE, { at: [x, 0.48, z], shadow: false }));
  g.add(at(berry('#e8304a', 1.5), 0.36, 0.05, 0.28, 0.2, 0, -0.3));
  return g;
}
function icecream(look) {
  const waffle = '#e0a35a';
  const g = group(
    Co(0.22, 0.62, waffle, { at: [0, 0.31, 0], rot: [PI, 0, 0], seg: 20 }),
    T(0.22, 0.04, shade(waffle, -0.06), { at: [0, 0.62, 0], rot: [PI / 2, 0, 0] }),
  );
  for (const y of [0.22, 0.4]) g.add(T(0.22 * (y / 0.62), 0.012, shade(waffle, -0.18), { at: [0, y, 0], rot: [PI / 2, 0, 0], rs: 4, shadow: false }));
  const scoops = [[look.color, 0, 0.74, 0.22], ['#fff1cf', 0.0, 0.98, 0.19]];
  for (const [c, x, y, r] of scoops) {
    g.add(S(r, c, { at: [x, y, 0] }));
    g.add(T(r * 0.92, 0.04, c, { at: [x, y - r * 0.45, 0], rot: [PI / 2, 0, 0], rs: 6, ts: 14 }));
    g.add(shine(x - r * 0.45, y + r * 0.35, r * 0.6, 0.035));
  }
  g.add(S(0.075, '#d81b60', { at: [0.02, 1.2, 0.02] }), Cy(0.01, 0.01, 0.12, '#5d4037', { at: [0.04, 1.3, 0], rot: [0, 0, -0.3] }));
  g.add(B(0.05, 0.3, 0.05, '#c9853f', { at: [-0.14, 1.1, -0.05], rot: [0, 0, 0.5], r: 0.015 }));
  return g;
}
function roll(look) {
  const crust = look.color, dough = '#f6dfaa', fill = '#4e2a12';
  const g = group(
    Ca(0.22, 0.55, crust, { at: [-0.18, 0.22, -0.05], rot: [0, 0, PI / 2] }),
    Cy(0.22, 0.22, 0.2, crust, { at: [0.12, 0.22, -0.05], rot: [0, 0, PI / 2] }),
    shine(-0.3, 0.4, 0.06, 0.05, [2.2, 0.5, 0.6], [0, 0, 0]),
  );
  for (const x of [-0.35, -0.12]) g.add(B(0.03, 0.02, 0.22, shade(crust, 0.15), { at: [x, 0.43, -0.03], rot: [0, 0.4, 0.15], r: 0 }));
  const spiral = (n = 5) => { const s = group(); const rs = [0.2, 0.17, 0.13, 0.095, 0.06]; for (let i = 0; i < n; i++) s.add(Cy(rs[i], rs[i], 0.07 + i * 0.008, i === 0 ? crust : i % 2 ? dough : fill, { rot: [PI / 2, 0, 0], seg: 22 })); return s; };
  g.add(at(spiral(), 0.23, 0.22, -0.05, 0, PI / 2, 0, [1.08, 1.08, 1]));
  g.add(at(spiral(), 0.3, 0.2, 0.3, -0.2, 0.25, 0));
  g.add(at(spiral(), 0.0, 0.2, 0.33, -0.25, -0.15, 0));
  return g;
}

// ------------------------------------------------------------------ meals
function plateBase() {
  return group(
    Cy(0.5, 0.38, 0.06, WHITE, { at: [0, 0.03, 0], seg: 32 }),
    T(0.47, 0.03, '#cfe0f0', { at: [0, 0.06, 0], rot: [PI / 2, 0, 0], ts: 32 }),
  );
}
function plate(look, id) {
  const g = plateBase();
  if (id === 'omelette') {
    g.add(S(0.34, look.color, { at: [0, 0.07, 0], scale: [1, 0.38, 0.62], rot: [0, 0.3, 0] }));
    g.add(shine(-0.1, 0.18, 0.05, 0.04, [1.6, 0.5, 0.8]));
    for (const [x, z] of [[0.2, 0.18], [-0.25, 0.15], [0.3, -0.05]]) g.add(T(0.06, 0.02, '#d32f2f', { at: [x, 0.08, z], rot: [PI / 2, 0, 0], rs: 5, ts: 10 }));
    for (const [x, z] of [[0.05, 0.1], [-0.1, -0.05], [0.12, -0.08], [-0.02, 0.0]]) g.add(B(0.05, 0.015, 0.015, '#43a047', { at: [x, 0.2, z], rot: [0, x * 20, 0], r: 0, shadow: false }));
  } else if (id === 'langos') {
    g.add(S(0.44, look.color, { at: [0, 0.07, 0], scale: [1, 0.2, 0.95] }));
    g.add(S(0.32, look.topping, { at: [0, 0.13, 0], scale: [1, 0.12, 0.9] }));
    for (let i = 0; i < 12; i++) { const a = i * 2.4, r = 0.06 + (i % 4) * 0.06; g.add(B(0.07, 0.02, 0.02, '#ffc107', { at: [Math.cos(a) * r, 0.17, Math.sin(a) * r], rot: [0, a, 0], r: 0, shadow: false })); }
    g.add(B(0.04, 0.012, 0.012, '#7cb342', { at: [0.1, 0.18, 0.05], r: 0 }), B(0.04, 0.012, 0.012, '#7cb342', { at: [-0.1, 0.18, -0.08], rot: [0, 1, 0], r: 0 }));
  } else { // grilled fish
    const fish = group(
      S(0.34, look.color, { scale: [1, 0.32, 0.4] }),
      Pr(0.22, 0.2, 0.05, look.color, { at: [-0.4, 0, 0], rot: [-PI / 2, 0, PI / 2] }),
      S(0.035, WHITE, { at: [0.22, 0.04, 0.08] }),
      S(0.02, '#2b2b2b', { at: [0.23, 0.045, 0.1] }),
    );
    for (const x of [-0.12, 0, 0.12]) fish.add(B(0.025, 0.02, 0.2, '#4e342e', { at: [x, 0.105, 0], rot: [0, 0.5, 0], r: 0, shadow: false }));
    g.add(at(fish, 0, 0.12, -0.02, 0, 0.15, 0));
    g.add(S(0.1, '#ffeb3b', { at: [0.28, 0.08, 0.25], scale: [1, 0.6, 0.6] }), S(0.085, '#fff59d', { at: [0.28, 0.08, 0.27], scale: [0.95, 0.5, 0.55] }));
    g.add(leaf('#43a047', 1.2).translateY(0.09).translateX(-0.25).translateZ(0.26));
  }
  return g;
}
function pot(look, id) {
  const fish = id === 'fishsoup';
  const body = fish ? '#e8eef3' : '#3a3a3a';
  const rim = fish ? '#3f7cc4' : '#555555';
  const g = group(
    Cy(0.42, 0.36, 0.52, body, { at: [0, 0.26, 0], seg: 28 }),
    T(0.42, 0.04, rim, { at: [0, 0.52, 0], rot: [PI / 2, 0, 0], ts: 32 }),
    Cy(0.4, 0.4, 0.02, look.color, { at: [0, 0.48, 0], seg: 28 }),
    steam(3, 0.72, 0.2),
  );
  if (fish) {
    for (const s of [-1, 1]) g.add(T(0.08, 0.03, rim, { at: [s * 0.44, 0.4, 0], rot: [0, 0, s * PI / 2], arc: PI }));
    for (const [x, z] of [[-0.12, 0.1], [0.15, -0.05], [0.02, -0.2]]) g.add(B(0.12, 0.06, 0.08, '#fff3e6', { at: [x, 0.5, z], rot: [0, x * 5, 0], r: 0.02 }));
    g.add(T(0.06, 0.02, '#ff7043', { at: [0.15, 0.5, 0.18], rot: [PI / 2, 0, 0], rs: 5, ts: 10 }));
    g.add(B(0.4, 0.06, 0.02, rim, { at: [0, 0.25, 0.395], r: 0.01 }));
  } else {
    g.add(T(0.44, 0.02, '#777777', { at: [0, 0.52, 0], rot: [0, 0, 0], arc: PI, rs: 5 }));
    for (const [x, z, c] of [[-0.15, 0.1, '#ffe082'], [0.12, -0.12, '#ffe082'], [0.18, 0.12, '#ff9800'], [-0.05, -0.2, '#ff9800'], [0.0, 0.05, '#7cb342']]) {
      g.add(B(0.09, 0.06, 0.09, c, { at: [x, 0.5, z], rot: [0.3, x * 5, 0.2], r: 0.02 }));
    }
  }
  g.add(shine(-0.25, 0.32, 0.27, 0.04, [0.5, 1.8, 0.5], [0, 0, 0]));
  return g;
}
function bowl(look) {
  const pts = [[0, 0], [0.18, 0], [0.2, 0.03], [0.34, 0.13], [0.43, 0.28], [0.45, 0.31], [0.43, 0.32]];
  const g = group(
    L('bowl', pts, '#5c8fd6'),
    T(0.44, 0.02, WHITE, { at: [0, 0.31, 0], rot: [PI / 2, 0, 0], ts: 32 }),
    S(0.42, look.color, { at: [0, 0.27, 0], scale: [1, 0.14, 1] }),
    S(0.09, '#d81b60', { at: [0.02, 0.32, 0.02], scale: [1, 0.5, 1] }),
    shine(-0.18, 0.33, 0.05, 0.04, [1.4, 0.5, 0.8]),
  );
  for (const [x, z] of [[0.15, 0.15], [-0.18, 0.12], [0.15, -0.15], [-0.1, -0.2], [0.24, 0.0]]) g.add(S(0.025, '#8d5524', { at: [x, 0.32, z], scale: [1, 0.5, 1], shadow: false }));
  g.add(B(0.04, 0.02, 0.5, METAL_L, { at: [-0.2, 0.42, -0.2], rot: [0.5, 0.6, 0], r: 0.008 }));
  g.add(S(0.07, METAL_L, { at: [-0.1, 0.32, -0.08], scale: [1, 0.3, 1.4], rot: [0, 0.6, 0] }));
  return g;
}

// ------------------------------------------------------------------ chandler / cafe / perfumery
function candle(look, id) {
  const c = look.color;
  const g = group(
    Cy(0.36, 0.3, 0.06, '#d4a62a', { at: [0, 0.03, 0], seg: 28 }),
    T(0.33, 0.025, '#f0c94a', { at: [0, 0.06, 0], rot: [PI / 2, 0, 0] }),
    Cy(0.2, 0.2, 0.62, c, { at: [0, 0.37, 0], seg: 24 }),
    T(0.18, 0.03, shade(c, 0.08), { at: [0, 0.68, 0], rot: [PI / 2, 0, 0] }),
    Cy(0.012, 0.012, 0.07, '#3a2a1a', { at: [0, 0.71, 0] }),
    S(0.075, LIT('#ffd54f', '#ffb300'), { at: [0, 0.82, 0], scale: [1, 1.9, 1], shadow: false }),
    S(0.04, LIT('#ff7043', '#ff5722'), { at: [0, 0.77, 0], scale: [1, 1.5, 1], shadow: false }),
    S(0.14, M('#ffe082', { snow: 0, transparent: true, opacity: 0.25, emissive: '#ffcc33' }), { at: [0, 0.82, 0], scale: [1, 1.3, 1], shadow: false }),
    shine(-0.13, 0.45, 0.13, 0.035, [0.5, 2.5, 0.5], [0, 0, 0]),
  );
  for (const [a, len] of [[0.3, 0.12], [1.1, 0.2], [-0.6, 0.08], [2.2, 0.15]]) g.add(Ca(0.035, len, shade(c, 0.06), { at: [Math.sin(a) * 0.195, 0.66 - len / 2, Math.cos(a) * 0.195] }));
  if (id === 'lavendercandle') {
    g.add(T(0.205, 0.03, '#7e57c2', { at: [0, 0.3, 0], rot: [PI / 2, 0, 0] }));
    g.add(at(lavenderSprig(0.9), 0.08, 0.15, 0.2, 0.15, 0, -0.35));
  } else {
    g.add(T(0.205, 0.02, TWINE, { at: [0, 0.3, 0], rot: [PI / 2, 0, 0] }));
    g.add(B(0.14, 0.1, 0.02, '#ffb300', { at: [0, 0.3, 0.21], r: 0.02 }));
  }
  return g;
}
function cup(look) {
  const pts = [[0, 0], [0.12, 0], [0.15, 0.03], [0.19, 0.16], [0.2, 0.26]];
  return group(
    Cy(0.36, 0.3, 0.04, WHITE, { at: [0, 0.02, 0], seg: 28 }),
    T(0.33, 0.02, '#cfe0f0', { at: [0, 0.04, 0], rot: [PI / 2, 0, 0], ts: 32 }),
    at(group(L('cup', pts, WHITE), Cy(0.185, 0.185, 0.01, look.color, { at: [0, 0.24, 0] }), T(0.15, 0.02, '#c8935a', { at: [0, 0.245, 0], rot: [PI / 2, 0, 0], rs: 4, shadow: false }), T(0.07, 0.022, WHITE, { at: [0.21, 0.16, 0], rot: [0, 0, PI / 2], arc: PI })), 0, 0.04, 0),
    B(0.08, 0.08, 0.08, WHITE, { at: [-0.22, 0.09, 0.15], rot: [0, 0.4, 0], r: 0.012 }),
    B(0.03, 0.015, 0.3, METAL_L, { at: [0.12, 0.05, 0.22], rot: [0, 0.9, 0], r: 0.005 }),
    steam(2, 0.45, 0.12),
    shine(-0.1, 0.22, 0.13, 0.025, [0.5, 1.5, 0.5], [0, 0, 0]),
  );
}
function mug(look) {
  const body = '#d84343';
  return group(
    Cy(0.3, 0.27, 0.55, body, { at: [0, 0.275, 0], seg: 28 }),
    Cy(0.305, 0.3, 0.08, WHITE, { at: [0, 0.18, 0], seg: 28 }),
    T(0.29, 0.02, shade(body, 0.1), { at: [0, 0.55, 0], rot: [PI / 2, 0, 0] }),
    S(0.28, '#f7ebd8', { at: [0, 0.55, 0], scale: [1, 0.22, 1] }),
    S(0.06, look.color, { at: [-0.04, 0.615, 0.02], scale: [1, 0.25, 1] }),
    S(0.06, look.color, { at: [0.04, 0.615, 0.02], scale: [1, 0.25, 1] }),
    Co(0.08, 0.1, look.color, { at: [0, 0.613, 0.09], rot: [PI / 2, 0, 0], scale: [1, 1, 0.15], seg: 12 }),
    T(0.13, 0.04, body, { at: [0.3, 0.3, 0], rot: [0, 0, PI / 2], arc: PI }),
    steam(2, 0.85, 0.15),
    shine(-0.18, 0.4, 0.22, 0.04, [0.5, 2, 0.5], [0, 0, 0]),
  );
}
function soap(look) {
  const c = look.color;
  const bub = M('#e8f6ff', { snow: 0, transparent: true, opacity: 0.6 });
  const g = group(
    B(0.62, 0.2, 0.42, c, { at: [0, 0.1, 0], r: 0.08 }),
    B(0.52, 0.18, 0.36, shade(c, 0.08), { at: [0.03, 0.29, 0.0], rot: [0, 0.25, 0], r: 0.08 }),
    S(0.13, shade(c, 0.16), { at: [0.03, 0.375, 0.0], scale: [1.3, 0.12, 0.8], rot: [0, 0.25, 0] }),
    at(lavenderSprig(0.9), -0.1, 0.38, 0.05, PI / 2 - 0.1, 0.3, 0),
  );
  for (const [x, y, z, r] of [[0.35, 0.45, 0.2, 0.09], [0.42, 0.25, 0.3, 0.06], [-0.32, 0.4, 0.18, 0.07], [0.25, 0.62, 0.1, 0.05]]) {
    g.add(S(r, bub, { at: [x, y, z], shadow: false }));
    g.add(shine(x - r * 0.4, y + r * 0.4, z + r * 0.6, r * 0.25));
  }
  return g;
}
function perfume(look) {
  const c = look.color;
  return group(
    Cy(0.3, 0.34, 0.44, FLAT(c), { at: [0, 0.22, 0], seg: 8 }),
    Cy(0.16, 0.3, 0.1, FLAT(shade(c, 0.08)), { at: [0, 0.49, 0], seg: 8 }),
    Cy(0.09, 0.09, 0.1, GOLD, { at: [0, 0.59, 0], seg: 16 }),
    S(0.15, FLAT(shade(c, 0.15)), { at: [0, 0.76, 0], low: true, det: 0, scale: [1, 1.2, 1] }),
    Cy(0.1, 0.1, 0.04, GOLD, { at: [0, 0.25, 0.29], rot: [PI / 2, 0, 0], seg: 16 }),
    at(emblem('heart'), 0, 0.25, 0.29, 0, 0, 0, 1.1),
    Cy(0.015, 0.015, 0.3, GOLD, { at: [-0.18, 0.62, 0], rot: [0, 0, -1.2] }),
    S(0.1, '#ffb74d', { at: [-0.36, 0.55, 0], scale: [1, 1.25, 1] }),
    B(0.03, 0.14, 0.03, '#ffb74d', { at: [-0.36, 0.4, 0], r: 0.01 }),
    shine(-0.17, 0.32, 0.25, 0.04, [0.5, 2.2, 0.5], [0, 0, 0]),
    sparkle(0.3, 0.75, 0.2, 0.14),
  );
}

export const SHAPES = {
  sack, feedsack, bottle, smallbottle, jar, loaf, flatbread, cookies, pie, kifli, planks, bricks, axe, pickaxe,
  logs, stones, baitcan, butter, jug, cheese, cheesewheel, cloth, yarn, cake, cakeslice, pancakes, icecream, roll,
  scarf, sweater, pillow, quilt, plate, pot, bowl, candle, cup, mug, soap, perfume,
};
// Per-shape icon yaw/tilt overrides (default yaw 0.42 rad = mostly facing the camera).
export const SHAPE_VIEW = { axe: { yaw: Math.PI / 4 }, pickaxe: { yaw: Math.PI / 4 }, sweater: { yaw: Math.PI / 4 - 0.15 }, cheese: { yaw: 0.3 } };
export { emblem, leaf, berry, steam, animalFace, lavenderSprig };
