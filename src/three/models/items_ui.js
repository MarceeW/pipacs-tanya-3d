// UI pictogram models (coins, gems, tools, weather, season and status icons) in the same
// chunky glossy style as the item icons. Each builder returns an Object3D facing +z.
import { B, Cy, Co, S, Ca, T, L, Pr, shine, sparkle, at, group, shade, M, LIT, FLAT, mat } from './items_kit.js';
import { leaf } from './items_goods.js';

const PI = Math.PI;
const WHITE = '#ffffff', GOLD = '#ffc83d', GOLD_D = '#e09a12', GOLD_L = '#ffe07a', WOOD = '#b07a45', METAL = '#a7b4bf', METAL_L = '#dfe8ee';
const FX = { rot: [PI / 2, 0, 0] }; // cylinder facing +z

// ------------------------------------------------------------------ shared pieces
function coin(s = 1) {
  const g = group(
    Cy(0.45, 0.45, 0.14, GOLD_D, { ...FX, seg: 32 }),
    Cy(0.4, 0.4, 0.16, GOLD, { ...FX, seg: 32 }),
    T(0.4, 0.035, GOLD_L, { at: [0, 0, 0.08], ts: 32 }),
    T(0.4, 0.035, GOLD_L, { at: [0, 0, -0.08], ts: 32 }),
  );
  for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 4; g.add(S(0.1, GOLD_D, { at: [Math.cos(a) * 0.1, Math.sin(a) * 0.1 + 0.03, 0.085], scale: [1, 1, 0.3] })); }
  g.add(B(0.04, 0.2, 0.03, GOLD_D, { at: [0.03, -0.14, 0.085], rot: [0, 0, -0.35], r: 0.01 }));
  g.add(shine(-0.2, 0.2, 0.1, 0.06, [1, 0.6, 0.4], [0, 0, 0.8]));
  g.scale.setScalar(s);
  return g;
}
function star(c = GOLD, s = 1) {
  const g = group(
    Cy(0.22, 0.22, 0.12, FLAT(shade(c, -0.03)), { rot: [PI / 2, 0, 0], seg: 10 }),
    Co(0.22, 0.09, FLAT(c), { at: [0, 0, 0.105], rot: [PI / 2, 0, 0], seg: 10 }),
    Co(0.22, 0.09, FLAT(c), { at: [0, 0, -0.105], rot: [-PI / 2, 0, 0], seg: 10 }),
  );
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2;
    g.add(Co(0.18, 0.36, FLAT(i % 2 ? c : shade(c, 0.04)), { at: [Math.sin(a) * 0.3, Math.cos(a) * 0.3, 0], rot: [0, 0, -a], scale: [1, 1, 0.5], seg: 4 }));
  }
  g.add(shine(-0.1, 0.12, 0.12, 0.05, [1, 0.6, 0.4], [0, 0, 0.6]));
  g.scale.setScalar(s);
  return g;
}
function cloudShape(c = WHITE, base = '#d6e6f5') {
  return group(
    S(0.3, c, { at: [0, 0.38, 0] }),
    S(0.24, c, { at: [-0.3, 0.27, 0.02] }),
    S(0.25, c, { at: [0.3, 0.28, 0.0] }),
    S(0.2, c, { at: [0.12, 0.5, 0.05] }),
    Ca(0.17, 0.62, base, { at: [0, 0.2, 0], rot: [0, 0, PI / 2], scale: [1, 1, 1.3] }),
    shine(-0.12, 0.55, 0.22, 0.05, [1.2, 0.6, 0.4]),
  );
}
function drop(c = '#29b6f6', s = 1) {
  const g = group(
    S(0.32, c, { at: [0, 0.32, 0] }),
    Co(0.265, 0.44, c, { at: [0, 0.72, 0], seg: 22 }),
    shine(-0.12, 0.42, 0.22, 0.06, [0.7, 1.3, 0.5], [0, 0, 0.3]),
  );
  g.scale.setScalar(s);
  return g;
}
function miniFlake(c, s) {
  const g = group();
  for (let i = 0; i < 3; i++) g.add(B(0.08, 0.6, 0.06, c, { rot: [0, 0, (i * PI) / 3], r: 0.03 }));
  g.scale.setScalar(s);
  return g;
}
function snowflake(c = '#81d4fa', s = 1) {
  const g = group(Cy(0.1, 0.1, 0.08, WHITE, { ...FX, seg: 6 }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    const arm = group(
      B(0.07, 0.44, 0.07, c, { at: [0, 0.27, 0], r: 0.03 }),
      B(0.05, 0.16, 0.05, c, { at: [-0.06, 0.36, 0], rot: [0, 0, 0.8], r: 0.02 }),
      B(0.05, 0.16, 0.05, c, { at: [0.06, 0.36, 0], rot: [0, 0, -0.8], r: 0.02 }),
    );
    arm.rotation.z = a;
    g.add(arm);
  }
  g.scale.setScalar(s);
  return g;
}
function sunShape(core = '#ffca28', ray = '#ffa000', face = false) {
  const g = group(
    S(0.3, core),
    S(0.26, shade(core, 0.08), { at: [0, 0, 0.06], scale: [1, 1, 0.9] }),
    shine(-0.12, 0.12, 0.27, 0.05, [1, 0.7, 0.4]),
  );
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    g.add(Co(0.09, 0.2, ray, { at: [Math.sin(a) * 0.43, Math.cos(a) * 0.43, 0], rot: [0, 0, -a], scale: [1, 1, 0.4], seg: 8 }));
  }
  if (face) {
    for (const s of [-1, 1]) {
      g.add(S(0.035, '#5d3a1a', { at: [s * 0.1, 0.06, 0.28], scale: [1, 1.3, 0.5] }));
      g.add(S(0.045, '#ff7043', { at: [s * 0.17, -0.05, 0.25], scale: [1, 0.6, 0.4] }));
    }
    g.add(T(0.08, 0.02, '#5d3a1a', { at: [0, -0.04, 0.28], rot: [0, 0, PI], arc: PI, rs: 5 }));
  }
  return g;
}
function arrow(c, len = 0.3) {
  return group(
    B(0.13, len, 0.13, c, { at: [0, len / 2, 0], r: 0.04 }),
    Co(0.17, 0.2, c, { at: [0, len + 0.09, 0], seg: 4, scale: [1, 1, 0.55], rot: [0, PI / 4, 0] }),
  );
}
/** Outline trick: a slightly larger dark copy behind a light shape. */
function backing(w, h, d, c, r = 0.1) { return B(w, h, d, c, { r }); }

// ------------------------------------------------------------------ icons
const UI = {
  coin: () => coin(),
  coins: () => {
    const g = group();
    for (let i = 0; i < 4; i++) {
      g.add(Cy(0.32, 0.32, 0.09, i % 2 ? GOLD : shade(GOLD, -0.03), { at: [(i % 2) * 0.03 - 0.02 - 0.2, 0.045 + i * 0.095, (i % 3) * 0.02 - 0.12], seg: 28 }));
      g.add(T(0.32, 0.02, GOLD_D, { at: [(i % 2) * 0.03 - 0.02 - 0.2, 0.045 + i * 0.095, (i % 3) * 0.02 - 0.12], rot: [PI / 2, 0, 0], ts: 28, shadow: false }));
    }
    g.add(Cy(0.26, 0.26, 0.02, GOLD_L, { at: [-0.19, 0.42, -0.1], seg: 28 }));
    g.add(at(coin(0.75), 0.25, 0.34, 0.15, -0.15, -0.2, 0.1));
    g.add(sparkle(-0.35, 0.65, 0.1, 0.16));
    return g;
  },
  gem: () => {
    const c = '#ec407a';
    return group(
      Cy(0.25, 0.42, 0.2, FLAT(shade(c, 0.06)), { at: [0, 0.6, 0], seg: 8 }),
      Cy(0.25, 0.25, 0.02, FLAT(shade(c, 0.16)), { at: [0, 0.71, 0], seg: 8 }),
      Co(0.42, 0.5, FLAT(shade(c, -0.05)), { at: [0, 0.25, 0], rot: [PI, 0, 0], seg: 8 }),
      shine(-0.12, 0.66, 0.2, 0.04, [1.5, 0.5, 0.5], [0, 0, 0.3]),
      sparkle(0.3, 0.78, 0.2, 0.2),
    );
  },
  xp: () => group(at(star(GOLD), 0, 0.5, 0), sparkle(0.4, 0.85, 0.1, 0.18), sparkle(-0.42, 0.2, 0.1, 0.13)),
  star: () => at(star('#ffd740'), 0, 0.5, 0),
  heart: () => {
    const c = '#ff3d57', k = 0.25;
    return group(
      B(0.5, 0.5, 0.32, c, { at: [0, 0.4, 0], rot: [0, 0, PI / 4], r: 0.08 }),
      S(k, c, { at: [-0.177, 0.577, 0], scale: [1, 1, 0.64] }),
      S(k, c, { at: [0.177, 0.577, 0], scale: [1, 1, 0.64] }),
      shine(-0.22, 0.68, 0.14, 0.065, [1, 0.6, 0.4], [0, 0, 0.7]),
      shine(-0.3, 0.55, 0.12, 0.025),
    );
  },
  clock: () => {
    const red = '#e53935';
    const g = group(
      Cy(0.4, 0.4, 0.22, red, { ...FX, at: [0, 0.5, 0], seg: 32 }),
      Cy(0.33, 0.33, 0.23, WHITE, { ...FX, at: [0, 0.5, 0], seg: 32 }),
      B(0.05, 0.22, 0.03, '#37474f', { at: [0, 0.59, 0.125], r: 0.015 }),
      B(0.18, 0.05, 0.03, '#37474f', { at: [0.08, 0.5, 0.125], r: 0.015 }),
      S(0.035, red, { at: [0, 0.5, 0.135] }),
    );
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2; g.add(B(0.04, 0.04, 0.02, '#90a4ae', { at: [Math.sin(a) * 0.26, 0.5 + Math.cos(a) * 0.26, 0.12], r: 0.01 })); }
    for (const s of [-1, 1]) {
      g.add(S(0.13, GOLD, { at: [s * 0.27, 0.86, -0.02], scale: [1, 0.8, 1] }));
      g.add(B(0.06, 0.16, 0.06, '#37474f', { at: [s * 0.24, 0.1, 0], rot: [0, 0, s * 0.5], r: 0.02 }));
    }
    g.add(B(0.05, 0.12, 0.05, '#37474f', { at: [0, 0.93, 0], r: 0.015 }));
    g.add(shine(-0.18, 0.72, 0.12, 0.04));
    return g;
  },
  water: () => drop('#29b6f6'),
  hoe: () => {
    const g = group(
      Cy(0.04, 0.05, 1.1, WOOD, { at: [0, 0.6, 0] }),
      B(0.12, 0.12, 0.1, '#5f6b76', { at: [0, 0.08, 0.04], r: 0.02 }),
      B(0.42, 0.22, 0.04, METAL, { at: [0, -0.02, 0.12], rot: [-0.5, 0, 0], r: 0.015 }),
      B(0.42, 0.04, 0.045, METAL_L, { at: [0, -0.12, 0.18], rot: [-0.5, 0, 0], r: 0.015 }),
      Cy(0.06, 0.06, 0.16, '#43a047', { at: [0, 1.05, 0] }),
    );
    return at(group(g), 0, 0, 0, 0, 0, 0.6);
  },
  seedbag: () => {
    const pts = [[0, 0], [0.28, 0], [0.36, 0.06], [0.4, 0.24], [0.37, 0.42], [0.25, 0.56], [0.15, 0.62], [0.13, 0.66], [0.2, 0.72], [0.25, 0.78], [0.24, 0.8]];
    const g = group(
      L('seedbag', pts, '#c8955a', { scale: [1, 1, 0.85] }),
      S(0.23, '#8d5a2b', { at: [0, 0.78, 0], scale: [1, 0.35, 0.8] }),
      T(0.14, 0.03, '#d84343', { at: [0, 0.65, 0], rot: [PI / 2, 0, 0], scale: [1, 0.85, 1] }),
      Cy(0.17, 0.17, 0.04, '#fff3c4', { ...FX, at: [0, 0.3, 0.33], seg: 22 }),
      Cy(0.015, 0.015, 0.14, '#43a047', { at: [0, 0.27, 0.36] }),
      at(group(S(0.06, '#66bb6a', { at: [0.06, 0, 0], scale: [1.4, 0.4, 0.4] })), 0, 0.35, 0.36, 0, 0, 0.5),
      at(group(S(0.06, '#43a047', { at: [-0.06, 0, 0], scale: [1.4, 0.4, 0.4] })), 0, 0.33, 0.36, 0, 0, -0.5),
      shine(-0.24, 0.4, 0.24, 0.04, [0.6, 1.4, 0.5]),
    );
    for (const [x, z] of [[0.38, 0.25], [0.45, 0.1], [0.3, 0.35], [0.48, 0.3]]) g.add(S(0.04, '#8d5a2b', { at: [x, 0.03, z], scale: [0.8, 0.6, 1.1], shadow: false }));
    return g;
  },
  wateringcan: () => {
    const c = '#4caf50';
    const g = group(
      Cy(0.3, 0.32, 0.5, c, { at: [0, 0.25, 0], seg: 26 }),
      T(0.3, 0.03, shade(c, 0.12), { at: [0, 0.5, 0], rot: [PI / 2, 0, 0] }),
      Cy(0.3, 0.3, 0.02, shade(c, -0.15), { at: [0, 0.49, 0] }),
      T(0.22, 0.045, shade(c, -0.05), { at: [-0.05, 0.5, 0], arc: PI, rot: [0, 0, 0] }),
      Cy(0.04, 0.06, 0.6, c, { at: [0.45, 0.42, 0], rot: [0, 0, -0.9] }),
      Co(0.11, 0.1, shade(c, -0.1), { at: [0.7, 0.62, 0], rot: [0, 0, -0.9 + PI], seg: 14 }),
      Cy(0.11, 0.11, 0.015, METAL_L, { at: [0.735, 0.645, 0], rot: [0, 0, -0.9] }),
      Cy(0.305, 0.305, 0.08, '#ffeb3b', { at: [0, 0.2, 0], seg: 26 }),
      shine(-0.2, 0.32, 0.2, 0.045, [0.5, 2, 0.5], [0, 0, 0]),
    );
    g.add(at(drop('#29b6f6', 0.18), 0.82, 0.38, 0), at(drop('#29b6f6', 0.14), 0.92, 0.5, 0.05));
    return g;
  },
  sickle: () => {
    const g = group(
      T(0.32, 0.085, METAL, { at: [0.02, 0.62, 0], rot: [0, 0, -0.3], arc: PI * 1.25, scale: [1, 1, 0.3], ts: 28 }),
      T(0.39, 0.02, METAL_L, { at: [0.02, 0.62, 0], rot: [0, 0, -0.3], arc: PI * 1.2, ts: 28, shadow: false }),
      Cy(0.05, 0.055, 0.4, '#d84343', { at: [0.36, 0.3, 0], rot: [0, 0, 0.15] }),
      Cy(0.06, 0.06, 0.06, '#5f6b76', { at: [0.335, 0.5, 0], rot: [0, 0, 0.15] }),
    );
    return g;
  },
  hand: () => {
    const c = '#ffca28', cuff = '#ff7043';
    const g = group(
      B(0.42, 0.4, 0.2, c, { at: [0, 0.42, 0], r: 0.09 }),
      B(0.46, 0.16, 0.24, cuff, { at: [0, 0.14, 0], r: 0.06 }),
      B(0.48, 0.04, 0.25, shade(cuff, 0.1), { at: [0, 0.2, 0], r: 0.015 }),
    );
    for (const [i, [x, h]] of [[-0.15, 0.16], [-0.05, 0.22], [0.05, 0.22], [0.15, 0.18]].entries()) g.add(Ca(0.055, h, i % 2 ? c : shade(c, -0.03), { at: [x, 0.7 + h / 2, 0], rot: [0, 0, -x * 0.6] }));
    g.add(Ca(0.06, 0.14, c, { at: [-0.27, 0.45, 0.02], rot: [0, 0, 0.8] }));
    for (const x of [-0.08, 0.08]) g.add(B(0.015, 0.2, 0.01, shade(c, -0.12), { at: [x, 0.43, 0.1], r: 0, shadow: false }));
    g.add(shine(-0.12, 0.55, 0.1, 0.04, [0.8, 1.4, 0.5]));
    return g;
  },
  shovel: () => {
    const g = group(
      Cy(0.04, 0.045, 0.75, WOOD, { at: [0, 0.75, 0] }),
      B(0.3, 0.06, 0.06, WOOD, { at: [0, 1.14, 0], r: 0.025 }),
      B(0.32, 0.26, 0.05, METAL, { at: [0, 0.27, 0], r: 0.02 }),
      S(0.16, METAL, { at: [0, 0.15, 0], scale: [1, 1.1, 0.16] }),
      B(0.1, 0.1, 0.07, '#5f6b76', { at: [0, 0.42, 0], r: 0.02 }),
      shine(-0.08, 0.3, 0.035, 0.03, [0.6, 2, 0.4], [0, 0, 0]),
    );
    return at(group(g), 0, 0, 0, 0, 0, -0.6);
  },
  move: () => {
    const c = '#42a5f5';
    const g = group(Cy(0.14, 0.14, 0.15, shade(c, -0.1), { ...FX, seg: 20 }));
    for (let i = 0; i < 4; i++) { const a = at(arrow(i % 2 ? c : shade(c, 0.05), 0.24), 0, 0, 0, 0, 0, (i * PI) / 2); a.children.forEach((m) => { m.position.y += 0.08; }); g.add(a); }
    g.add(shine(-0.04, 0.05, 0.08, 0.03));
    return group(at(g, 0, 0.55, 0));
  },
  shop: () => {
    const g = group(
      B(0.9, 0.6, 0.6, '#fff3e0', { at: [0, 0.3, 0], r: 0.04 }),
      Pr(1.0, 0.32, 0.7, '#3f7cc4', { at: [0, 0.6, 0] }),
      B(0.95, 0.06, 0.66, '#2d5f9a', { at: [0, 0.62, 0], r: 0.02 }),
      B(0.22, 0.38, 0.04, '#8d5524', { at: [-0.24, 0.19, 0.3], r: 0.02 }),
      S(0.02, GOLD, { at: [-0.17, 0.2, 0.33] }),
      B(0.36, 0.24, 0.04, '#8fd3ff', { at: [0.18, 0.28, 0.3], r: 0.02 }),
      B(0.4, 0.04, 0.06, WHITE, { at: [0.18, 0.15, 0.31], r: 0.01 }),
      B(0.5, 0.14, 0.04, '#ffca28', { at: [0, 0.72, 0.36], r: 0.03 }),
      S(0.04, '#e53935', { at: [0.12, 0.2, 0.33] }), S(0.04, '#ffeb3b', { at: [0.22, 0.2, 0.33] }),
    );
    for (let i = 0; i < 4; i++) g.add(B(0.1, 0.05, 0.16, i % 2 ? WHITE : '#e53935', { at: [0.05 + i * 0.1, 0.45, 0.36], rot: [0.5, 0, 0], r: 0.01 }));
    return g;
  },
  barn: () => {
    const red = '#d9483b';
    const g = group(
      B(0.9, 0.55, 0.6, red, { at: [0, 0.275, 0], r: 0.03 }),
      Pr(1.0, 0.4, 0.7, '#6d4c41', { at: [0, 0.55, 0] }),
      Pr(0.82, 0.32, 0.62, red, { at: [0, 0.55, 0.005] }),
      B(0.36, 0.38, 0.03, '#a8322a', { at: [0, 0.19, 0.31], r: 0.01 }),
      B(0.16, 0.12, 0.03, '#fff3c4', { at: [0, 0.66, 0.32], r: 0.01 }),
    );
    for (const [w, h, x, y, rz] of [[0.04, 0.4, -0.18, 0.19, 0], [0.04, 0.4, 0.18, 0.19, 0], [0.4, 0.04, 0, 0.38, 0], [0.04, 0.5, 0, 0.19, 0.75], [0.04, 0.5, 0, 0.19, -0.75]]) g.add(B(w, h, 0.03, WHITE, { at: [x, y, 0.325], rot: [0, 0, rz], r: 0.01 }));
    for (const s of [-1, 1]) g.add(B(0.6, 0.04, 0.05, WHITE, { at: [s * 0.22, 0.7, 0.355], rot: [0, 0, -s * 0.66], r: 0.01 }));
    return g;
  },
  orders: () => {
    const g = group(
      B(0.64, 0.84, 0.05, '#a86b32', { at: [0, 0.42, 0], r: 0.04 }),
      B(0.54, 0.68, 0.02, WHITE, { at: [0, 0.4, 0.035], r: 0.01 }),
      B(0.28, 0.1, 0.08, METAL, { at: [0, 0.82, 0.04], r: 0.025 }),
      T(0.05, 0.015, METAL_L, { at: [0, 0.9, 0.04] }),
    );
    for (let i = 0; i < 4; i++) {
      const y = 0.64 - i * 0.14;
      g.add(B(0.28, 0.035, 0.01, '#90a4ae', { at: [0.07, y, 0.05], r: 0 }));
      if (i < 3) {
        g.add(B(0.035, 0.06, 0.02, '#43a047', { at: [-0.19, y - 0.01, 0.05], rot: [0, 0, 0.7], r: 0.008 }));
        g.add(B(0.035, 0.11, 0.02, '#43a047', { at: [-0.155, y + 0.01, 0.05], rot: [0, 0, -0.6], r: 0.008 }));
      } else g.add(B(0.07, 0.07, 0.02, '#cfd8dc', { at: [-0.17, y, 0.05], r: 0.01 }));
    }
    return g;
  },
  truck: () => {
    const red = '#e53935';
    const g = group(
      B(0.36, 0.38, 0.5, red, { at: [0.32, 0.33, 0], r: 0.06 }),
      B(0.2, 0.16, 0.51, '#8fd3ff', { at: [0.36, 0.42, 0], r: 0.03 }),
      B(0.68, 0.1, 0.52, '#8d5524', { at: [-0.2, 0.2, 0], r: 0.03 }),
      B(0.68, 0.14, 0.04, '#b07a45', { at: [-0.2, 0.31, 0.24], r: 0.02 }),
      B(0.68, 0.14, 0.04, '#b07a45', { at: [-0.2, 0.31, -0.24], r: 0.02 }),
      B(0.26, 0.2, 0.22, '#d7a86e', { at: [-0.35, 0.35, 0.0], r: 0.03 }),
      S(0.07, '#e53935', { at: [-0.4, 0.47, 0.04] }), S(0.07, '#ff9800', { at: [-0.3, 0.47, -0.04] }),
      B(0.24, 0.2, 0.22, '#d7a86e', { at: [-0.08, 0.35, 0.0], r: 0.03 }),
      S(0.07, '#66bb6a', { at: [-0.08, 0.47, 0.02] }),
      S(0.04, LIT('#fff59d', '#ffeb3b'), { at: [0.5, 0.25, 0.17] }),
      B(0.06, 0.06, 0.52, '#37474f', { at: [0.5, 0.15, 0], r: 0.02 }),
    );
    for (const x of [-0.34, 0.3]) for (const z of [-0.26, 0.26]) {
      g.add(Cy(0.12, 0.12, 0.09, '#2b2b2b', { ...FX, at: [x, 0.12, z], seg: 18 }));
      g.add(Cy(0.055, 0.055, 0.1, '#cfd8dc', { ...FX, at: [x, 0.12, z], seg: 12 }));
    }
    return g;
  },
  map: () => {
    const g = group();
    const cols = ['#f3e2b3', '#ead39b', '#f3e2b3'];
    for (let i = 0; i < 3; i++) {
      const p = group(B(0.32, 0.7, 0.02, cols[i], { r: 0.008 }));
      if (i === 0) p.add(S(0.1, '#81c784', { at: [-0.02, 0.15, 0.012], scale: [1.2, 1, 0.1] }));
      if (i === 1) p.add(B(0.07, 0.72, 0.01, '#4fc3f7', { at: [0, 0, 0.015], rot: [0, 0, 0.3], r: 0 }));
      if (i === 2) p.add(S(0.09, '#81c784', { at: [0.03, -0.18, 0.012], scale: [1.2, 1, 0.1] }));
      for (let k = 0; k < 3; k++) p.add(B(0.05, 0.02, 0.01, '#d84343', { at: [-0.08 + k * 0.08, -0.05 + i * 0.05 + k * 0.03, 0.016], rot: [0, 0, 0.3], r: 0, shadow: false }));
      g.add(at(p, -0.31 + i * 0.31, 0.38, i % 2 ? 0.0 : 0.05, 0, i % 2 ? -0.3 : 0.3, 0));
    }
    g.add(at(group(S(0.07, '#e53935', { at: [0, 0.12, 0] }), Co(0.05, 0.1, '#e53935', { at: [0, 0.04, 0], rot: [PI, 0, 0], seg: 12 }), shine(-0.025, 0.14, 0.05, 0.015)), 0.32, 0.4, 0.1));
    return g;
  },
  fishing: () => {
    const g = group(
      Cy(0.04, 0.05, 0.36, '#8d5524', { at: [-0.32, 0.22, 0], rot: [0, 0, -0.75] }),
      Cy(0.015, 0.035, 0.95, '#3f7cc4', { at: [0.07, 0.68, 0], rot: [0, 0, -0.75] }),
      Cy(0.08, 0.08, 0.06, METAL, { at: [-0.22, 0.26, 0.06], rot: [PI / 2, 0, 0] }),
      Cy(0.006, 0.006, 0.6, '#eeeeee', { at: [0.42, 0.7, 0], shadow: false }),
      S(0.08, '#e53935', { at: [0.42, 0.42, 0] }),
      S(0.075, WHITE, { at: [0.42, 0.36, 0], scale: [1, 0.6, 1] }),
      Cy(0.012, 0.012, 0.08, '#2b2b2b', { at: [0.42, 0.52, 0] }),
      shine(0.38, 0.47, 0.06, 0.02),
    );
    g.add(S(0.25, M('#4fc3f7', { snow: 0, transparent: true, opacity: 0.6 }), { at: [0.42, 0.3, 0], scale: [1, 0.08, 1], shadow: false }));
    return g;
  },
  gift: () => {
    const c = '#e53935', rib = '#ffd54f';
    return group(
      B(0.6, 0.48, 0.6, c, { at: [0, 0.24, 0], r: 0.04 }),
      B(0.68, 0.14, 0.68, shade(c, 0.05), { at: [0, 0.53, 0], r: 0.04 }),
      B(0.12, 0.62, 0.62, rib, { at: [0, 0.31, 0], r: 0.02 }),
      B(0.62, 0.62, 0.12, rib, { at: [0, 0.31, 0], r: 0.02 }),
      B(0.13, 0.15, 0.7, rib, { at: [0, 0.53, 0], r: 0.02 }),
      B(0.7, 0.15, 0.13, rib, { at: [0, 0.53, 0], r: 0.02 }),
      T(0.12, 0.045, rib, { at: [-0.12, 0.68, 0], rot: [0, 0, 0.5], scale: [1.3, 1, 1] }),
      T(0.12, 0.045, rib, { at: [0.12, 0.68, 0], rot: [0, 0, -0.5], scale: [1.3, 1, 1] }),
      S(0.06, shade(rib, -0.06), { at: [0, 0.64, 0] }),
      shine(-0.2, 0.4, 0.31, 0.04, [0.8, 1.6, 0.4]),
    );
  },
  trophy: () => {
    const pts = [[0, 0.42], [0.07, 0.42], [0.2, 0.48], [0.3, 0.62], [0.34, 0.85], [0.35, 0.9], [0.32, 0.9]];
    return group(
      B(0.5, 0.16, 0.36, '#6d4c41', { at: [0, 0.08, 0], r: 0.03 }),
      B(0.26, 0.07, 0.02, GOLD_L, { at: [0, 0.08, 0.185], r: 0.01 }),
      Cy(0.18, 0.22, 0.06, GOLD_D, { at: [0, 0.19, 0] }),
      Cy(0.05, 0.08, 0.22, GOLD, { at: [0, 0.32, 0] }),
      L('trophy', pts, GOLD),
      Cy(0.32, 0.32, 0.01, GOLD_D, { at: [0, 0.885, 0] }),
      T(0.12, 0.035, GOLD, { at: [-0.34, 0.7, 0], rot: [0, 0, PI / 2], arc: PI }),
      T(0.12, 0.035, GOLD, { at: [0.34, 0.7, 0], rot: [0, 0, -PI / 2], arc: PI }),
      at(star('#fff3c4', 0.28), 0, 0.68, 0.32),
      shine(-0.2, 0.75, 0.22, 0.04, [0.5, 1.8, 0.5], [0, 0, 0]),
    );
  },
  calendar: () => {
    const g = group(
      B(0.72, 0.66, 0.1, WHITE, { at: [0, 0.33, 0], r: 0.03 }),
      B(0.74, 0.2, 0.12, '#e53935', { at: [0, 0.68, 0], r: 0.04 }),
    );
    for (const x of [-0.2, 0.2]) g.add(T(0.06, 0.02, METAL, { at: [x, 0.79, 0], rot: [0, PI / 2, 0] }));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const hot = r === 1 && c === 2;
      g.add(B(0.11, 0.1, 0.02, hot ? '#e53935' : '#cfd8dc', { at: [-0.24 + c * 0.16, 0.47 - r * 0.15, 0.055], r: 0.015 }));
    }
    return g;
  },
  settings: () => {
    const c = '#90a4ae';
    const g = group(
      Cy(0.32, 0.32, 0.18, c, { ...FX, seg: 28 }),
      T(0.21, 0.04, shade(c, 0.1), { at: [0, 0, 0.09], ts: 24 }),
      Cy(0.11, 0.11, 0.2, '#546e7a', { ...FX, seg: 20 }),
      shine(-0.15, 0.15, 0.1, 0.04),
    );
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; g.add(B(0.15, 0.16, 0.18, c, { at: [Math.sin(a) * 0.36, Math.cos(a) * 0.36, 0], rot: [0, 0, -a], r: 0.03 })); }
    return group(at(g, 0, 0.45, 0));
  },
  sun: () => at(sunShape(), 0, 0.55, 0),
  summer: () => at(sunShape('#ffb300', '#ff7043', true), 0, 0.55, 0),
  cloud: () => cloudShape(),
  rain: () => {
    const g = at(cloudShape(WHITE, '#b0c4d8'), 0, 0.35, 0);
    return group(g, at(drop('#29b6f6', 0.22), -0.25, 0.08, 0.1), at(drop('#29b6f6', 0.22), 0.05, 0.0, 0.15), at(drop('#29b6f6', 0.22), 0.3, 0.1, 0.05));
  },
  snow: () => {
    const g = at(cloudShape(WHITE, '#c5d9ec'), 0, 0.35, 0);
    return group(g, at(miniFlake('#4fc3f7', 0.3), -0.25, 0.14, 0.1), at(miniFlake('#4fc3f7', 0.3), 0.08, 0.06, 0.15), at(miniFlake('#4fc3f7', 0.25), 0.36, 0.16, 0.05));
  },
  spring: () => {
    const g = group();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2; g.add(S(0.2, i % 2 ? '#f48fb1' : '#f8a5c2', { at: [Math.sin(a) * 0.2, Math.cos(a) * 0.2, 0], scale: [0.85, 1.05, 0.35], rot: [0, 0, -a] })); }
    g.add(S(0.11, '#ffd54f', { at: [0, 0, 0.06], scale: [1, 1, 0.6] }));
    for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2 + 0.6; g.add(S(0.025, '#ff8f00', { at: [Math.sin(a) * 0.07, Math.cos(a) * 0.07, 0.12], shadow: false })); }
    g.add(at(group(S(0.13, '#66bb6a', { at: [0.17, 0, 0], scale: [1.5, 0.7, 0.25] })), 0.12, -0.25, -0.05, 0, 0, -0.5));
    g.add(at(group(S(0.11, '#43a047', { at: [-0.15, 0, 0], scale: [1.5, 0.7, 0.25] })), -0.12, -0.27, -0.05, 0, 0, 0.5));
    g.add(shine(-0.15, 0.25, 0.08, 0.035));
    return group(at(g, 0, 0.5, 0));
  },
  autumn: () => {
    const c = '#ef6c00';
    const g = group(S(0.2, FLAT(c), { low: true, det: 1, scale: [1, 1, 0.3] }));
    for (const [a, len, w] of [[0, 0.5, 0.17], [0.95, 0.42, 0.15], [-0.95, 0.42, 0.15], [1.9, 0.3, 0.11], [-1.9, 0.3, 0.11]]) {
      g.add(Co(w, len, FLAT(Math.abs(a) > 1 ? '#e64a19' : a === 0 ? '#f57c00' : c), { at: [Math.sin(a) * (len / 2 + 0.08), Math.cos(a) * (len / 2 + 0.08), 0], rot: [0, 0, -a], scale: [1, 1, 0.3], seg: 4 }));
    }
    g.add(Cy(0.025, 0.03, 0.34, '#6d4c41', { at: [0.05, -0.3, 0], rot: [0, 0, 0.3] }));
    for (const a of [0, 0.95, -0.95]) g.add(B(0.02, 0.36, 0.02, '#ffb74d', { at: [Math.sin(a) * 0.18, Math.cos(a) * 0.18, 0.06], rot: [0, 0, -a], r: 0, shadow: false }));
    return group(at(g, 0, 0.5, 0));
  },
  winter: () => at(snowflake('#81d4fa'), 0, 0.55, 0),
  lock: () => group(
    T(0.2, 0.06, METAL, { at: [0, 0.55, 0], arc: PI, ts: 20 }),
    Cy(0.06, 0.06, 0.1, METAL, { at: [-0.2, 0.5, 0] }), Cy(0.06, 0.06, 0.1, METAL, { at: [0.2, 0.5, 0] }),
    B(0.6, 0.48, 0.26, GOLD, { at: [0, 0.26, 0], r: 0.07 }),
    B(0.62, 0.06, 0.27, GOLD_D, { at: [0, 0.42, 0], r: 0.02 }),
    S(0.06, '#4e342e', { at: [0, 0.27, 0.12], scale: [1, 1, 0.4] }),
    B(0.04, 0.12, 0.03, '#4e342e', { at: [0, 0.2, 0.125], r: 0.01 }),
    shine(-0.2, 0.33, 0.13, 0.04, [0.6, 1.4, 0.5]),
  ),
  check: () => {
    const c = '#43a047';
    return group(
      B(0.2, 0.42, 0.2, c, { at: [-0.22, 0.32, 0], rot: [0, 0, 0.75], r: 0.08 }),
      B(0.2, 0.86, 0.2, c, { at: [0.15, 0.48, 0], rot: [0, 0, -0.6], r: 0.08 }),
      B(0.06, 0.6, 0.02, shade(c, 0.2), { at: [0.12, 0.52, 0.1], rot: [0, 0, -0.6], r: 0.02, shadow: false }),
    );
  },
  plus: () => {
    const c = '#43a047';
    return group(
      B(0.26, 0.86, 0.26, c, { at: [0, 0.43, 0], r: 0.09 }),
      B(0.86, 0.26, 0.26, c, { at: [0, 0.43, 0], r: 0.09 }),
      B(0.06, 0.6, 0.02, shade(c, 0.2), { at: [-0.06, 0.48, 0.13], r: 0.02, shadow: false }),
    );
  },
  level: () => {
    const g = group(
      B(0.14, 0.4, 0.04, '#1e88e5', { at: [-0.13, 0.2, -0.06], rot: [0, 0, 0.3], r: 0.02 }),
      B(0.14, 0.4, 0.04, '#e53935', { at: [0.13, 0.2, -0.06], rot: [0, 0, -0.3], r: 0.02 }),
      Cy(0.38, 0.38, 0.14, '#43a047', { ...FX, at: [0, 0.58, 0], seg: 30 }),
      T(0.38, 0.05, GOLD, { at: [0, 0.58, 0.04], ts: 30 }),
      at(star(GOLD, 0.55), 0, 0.58, 0.09),
    );
    return g;
  },
  boat: () => {
    const g = group(
      S(0.6, M('#4fc3f7', { snow: 0, transparent: true, opacity: 0.85 }), { at: [0, 0.02, 0], scale: [1, 0.04, 0.6], shadow: false }),
      B(1.0, 0.22, 0.42, '#8d5524', { at: [0, 0.14, 0], r: 0.08 }),
      Cy(0.21, 0.21, 0.22, '#8d5524', { at: [0.5, 0.14, 0], seg: 16 }),
      B(1.02, 0.05, 0.43, '#e53935', { at: [0, 0.2, 0], r: 0.02 }),
      Cy(0.215, 0.215, 0.05, '#e53935', { at: [0.5, 0.2, 0], seg: 16 }),
      B(0.3, 0.24, 0.3, WHITE, { at: [-0.3, 0.37, 0], r: 0.03 }),
      B(0.36, 0.05, 0.36, '#3f7cc4', { at: [-0.3, 0.51, 0], r: 0.02 }),
      B(0.12, 0.08, 0.02, '#8fd3ff', { at: [-0.3, 0.38, 0.155], r: 0.01 }),
      Cy(0.04, 0.04, 0.16, '#37474f', { at: [-0.38, 0.6, -0.05] }),
      B(0.2, 0.18, 0.2, '#d7a86e', { at: [0.05, 0.34, 0], r: 0.02 }),
      B(0.18, 0.16, 0.18, '#c8955a', { at: [0.28, 0.33, 0.05], r: 0.02 }),
      Cy(0.012, 0.012, 0.4, '#5d4037', { at: [0.12, 0.6, -0.1] }),
      B(0.16, 0.1, 0.01, '#ffca28', { at: [0.2, 0.74, -0.1], r: 0 }),
    );
    return g;
  },
  visitor: () => {
    const g = group(
      backing(0.86, 0.6, 0.18, '#42a5f5', 0.2),
      B(0.8, 0.54, 0.22, WHITE, { r: 0.18 }),
      Co(0.13, 0.28, '#42a5f5', { at: [-0.2, -0.33, -0.01], rot: [0, 0, PI - 0.5], scale: [1, 1, 0.6] }),
      Co(0.1, 0.22, WHITE, { at: [-0.19, -0.29, 0.02], rot: [0, 0, PI - 0.5], scale: [1, 1, 0.8] }),
    );
    for (const x of [-0.2, 0, 0.2]) g.add(S(0.06, '#3f7cc4', { at: [x, 0, 0.11], scale: [1, 1, 0.5] }));
    return group(at(g, 0, 0.55, 0));
  },
  market: () => {
    const g = group(
      B(0.9, 0.36, 0.45, '#b07a45', { at: [0, 0.18, 0.05], r: 0.03 }),
      B(0.94, 0.05, 0.5, '#d7a86e', { at: [0, 0.38, 0.05], r: 0.02 }),
    );
    for (const x of [-0.42, 0.42]) g.add(B(0.06, 0.95, 0.06, '#8d5524', { at: [x, 0.47, -0.15], r: 0.02 }));
    for (let i = 0; i < 6; i++) g.add(B(0.17, 0.05, 0.6, i % 2 ? WHITE : '#43a047', { at: [-0.425 + i * 0.17, 0.92, 0.0], rot: [0.35, 0, 0], r: 0.015 }));
    for (let i = 0; i < 6; i++) g.add(S(0.085, i % 2 ? WHITE : '#43a047', { at: [-0.425 + i * 0.17, 0.82, 0.29], scale: [1, 0.7, 0.4] }));
    for (const [x, c] of [[-0.3, '#e53935'], [-0.15, '#ff9800'], [0.05, '#ffeb3b'], [0.2, '#8bc34a'], [0.33, '#e53935']]) g.add(S(0.075, c, { at: [x, 0.47, 0.1] }));
    g.add(B(0.18, 0.12, 0.18, '#d7a86e', { at: [0.3, 0.48, -0.08], r: 0.02 }));
    return g;
  },
  moon: () => {
    const c = '#ffe082';
    const g = group();
    const n = 21;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5;
      const a = t * 3.6;
      const r = 0.19 * Math.cos(t * 2.6) + 0.02;
      g.add(S(r, c, { at: [-Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0], scale: [1, 1, 0.7], ws: 16, hs: 12 }));
    }
    g.add(shine(-0.36, 0.1, 0.13, 0.05, [0.7, 1.4, 0.4], [0, 0, 0]));
    g.add(at(star('#fff3c4', 0.28), 0.3, 0.25, 0), sparkle(0.25, -0.2, 0.05, 0.14));
    return group(at(g, 0, 0.5, 0));
  },
  dog: () => {
    const c = '#8d6e63';
    const g = group(S(0.27, c, { at: [0, -0.1, 0], scale: [1.1, 0.85, 0.35] }));
    for (const [x, y] of [[-0.3, 0.17], [-0.11, 0.3], [0.11, 0.3], [0.3, 0.17]]) g.add(S(0.12, c, { at: [x, y, 0], scale: [0.85, 1.05, 0.35] }));
    g.add(shine(-0.1, -0.03, 0.08, 0.04));
    return group(at(g, 0, 0.45, 0));
  },
};

export const UI_ICONS = UI;
/** View overrides for UI icons: flat pictograms face the camera and lean back a little. */
const FLAT_ICON = { yaw: Math.PI / 4 - 0.2, tilt: -0.3 };
export const UI_VIEW = {
  coin: FLAT_ICON, xp: FLAT_ICON, star: FLAT_ICON, heart: FLAT_ICON, clock: FLAT_ICON, moon: FLAT_ICON, water: FLAT_ICON, hand: FLAT_ICON,
  move: FLAT_ICON, orders: FLAT_ICON, calendar: FLAT_ICON, settings: FLAT_ICON, sun: FLAT_ICON, summer: FLAT_ICON,
  cloud: FLAT_ICON, rain: FLAT_ICON, snow: FLAT_ICON, spring: FLAT_ICON, autumn: FLAT_ICON, winter: FLAT_ICON,
  lock: FLAT_ICON, moon: FLAT_ICON, check: FLAT_ICON, plus: FLAT_ICON, level: FLAT_ICON, visitor: FLAT_ICON, dog: FLAT_ICON,
  map: FLAT_ICON, trophy: { yaw: Math.PI / 4 - 0.2 }, gem: { yaw: 0.2 }, hoe: { yaw: Math.PI / 4 }, shovel: { yaw: Math.PI / 4 },
  sickle: { yaw: Math.PI / 4 }, fishing: { yaw: Math.PI / 4 }, truck: { yaw: -0.15 }, boat: { yaw: -0.2 },
};
