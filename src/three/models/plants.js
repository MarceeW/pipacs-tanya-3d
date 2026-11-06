// Plants: tilled plots, crops (5 growth stages), fruit trees, wild trees, obstacles and
// wildflowers. All procedural, built from lib.js helpers so sway / snow / seasons work.
//
// Integration notes:
//  * makePlot() top surface is at y = PLOT_TOP. Crops are built with origin y = 0 at the plot top,
//    so place a crop at world y = PLOT_TOP on top of its plot.
//  * Crops are 1 tile, fruit trees / log / boulder / oak are 2 tiles, everything else 1 tile.
import { PAL, M, leafMat, GEO, mesh, ball, group, place, blobShadow, rng } from '../lib.js';
import { CROPS, TREES, OBSTACLES } from '../../data/content.js';
import { buildCrop, mix, ellip, orient } from './plants_crops.js';

const TAU = Math.PI * 2;

// ------------------------------------------------------------------ plot
export const PLOT_TOP = 0.1;

/** 1x1 tilled soil bed with 3 furrow ridges along x. userData.setWet(bool) darkens the soil. */
export function makePlot() {
  const g = group();
  const dry = M(PAL.soil, { snow: 0.5 });
  const wet = M(PAL.soilWet, { snow: 0.5 });
  const rim = M(PAL.soilDark, { snow: 0.5 });
  const soil = [];
  g.add(mesh(GEO.rbox(0.94, 0.045, 0.94, 0.02), rim, { at: [0, 0.0225, 0], shadow: false }));
  const bed = mesh(GEO.rbox(0.9, 0.05, 0.9, 0.025), dry, { at: [0, 0.03, 0], shadow: false });
  soil.push(bed);
  for (const z of [-0.27, 0, 0.27]) {
    const ridge = mesh(GEO.capsule(0.1, 0.62, 4, 10), dry, { rot: [0, 0, Math.PI / 2], shadow: false });
    ridge.scale.set(0.5, 1, 1);          // flatten vertically (local x is world y after the z-turn)
    ridge.position.set(0, PLOT_TOP - 0.05, z);
    soil.push(ridge);
    g.add(ridge);
  }
  g.add(bed);
  g.userData.state = { wet: false };
  g.userData.setWet = (v) => {
    g.userData.state.wet = !!v;
    for (const m of soil) m.material = v ? wet : dry;
  };
  return g;
}

// ------------------------------------------------------------------ crops
/** Crop `id` (key of CROPS) at growth stage 0..4. Origin y = 0 is the plot top. */
export function makeCrop(id, stage) {
  const c = CROPS[id];
  return buildCrop(id, c ? c.look : { type: 'bush', leaf: PAL.leaf, fruit: '#e53935' }, stage);
}

// ------------------------------------------------------------------ fruit trees
const FRUIT_SIZE = { cherry: 0.075, plum: 0.09, walnut: 0.085 };

/**
 * Fruit tree (2x2). opts: { fruit = true, blossom = false, seed }.
 * userData.setFruit(bool) / userData.setBlossom(bool) toggle the fruit and blossom groups.
 */
export function makeFruitTree(key, opts = {}) {
  const look = (TREES[key] || TREES.apple).look;
  const R = rng((opts.seed ?? 3) + key.length * 17);
  const big = key === 'walnut';
  const S = big ? 1.12 : 1;
  const g = group();
  const bark = M(big ? '#5d4030' : PAL.woodDark);
  const lm = leafMat(look.leaf);
  const lm2 = leafMat(mix(look.leaf, big ? PAL.leafDark : PAL.leafLight, 0.25));
  // trunk + two branches
  g.add(mesh(GEO.cyl(0.11 * S, 0.17 * S, 1.0 * S, 9), bark, { at: [0, 0.5 * S, 0] }));
  g.add(orient(mesh(GEO.cyl(0.05, 0.08, 0.5 * S, 7), bark), 0, 0.75 * S, 0, 0.8, 0.7, 0.5 * S));
  g.add(orient(mesh(GEO.cyl(0.05, 0.08, 0.45 * S, 7), bark), 0, 0.8 * S, 0, 3.8, 0.65, 0.45 * S));
  g.add(ellip(0.24 * S, 0.06, 0.24 * S, bark, 0, 0.02, 0));
  // canopy clumps [x, y, z, r]: wide rounded crown that stays inside the 2x2 footprint
  const W = big ? 1.04 : 1;
  const clumps = [
    [0, 1.45, 0, 0.66], [0.47, 1.25, 0.22, 0.46], [-0.47, 1.3, -0.2, 0.48],
    [0.16, 1.27, -0.5, 0.45], [-0.22, 1.22, 0.48, 0.45], [0.06, 1.88, 0.04, 0.44],
  ].map(([x, y, z, r]) => [x * W, y * S, z * W, r * W]);
  clumps.forEach(([x, y, z, r], i) => g.add(ball(r, i % 2 ? lm2 : lm, { low: true, at: [x, y, z], rot: [0, i, 0] })));
  // fruit + blossom: points on a clump surface that are not buried inside another clump
  const fruits = group();
  const blossoms = group();
  const fr = (FRUIT_SIZE[key] || 0.1) * W;
  const fm = M(look.fruit, { sway: 0.015, emissive: mix('#000000', look.fruit, 0.25) });
  const bm = M(look.blossom, { sway: 0.02, emissive: mix('#000000', look.blossom, 0.2) });
  const surf = (minY) => {
    for (let t = 0; t < 40; t++) {
      const [cx, cy, cz, r] = clumps[Math.floor(R() * clumps.length)];
      const a = R() * TAU;
      const y = minY + R() * (0.85 - minY);
      const h = Math.sqrt(1 - y * y);
      const p = [cx + Math.sin(a) * h * r, cy + y * r, cz + Math.cos(a) * h * r];
      const buried = clumps.some(([x2, y2, z2, r2]) => Math.hypot(p[0] - x2, p[1] - y2, p[2] - z2) < r2 * 0.93);
      if (!buried) return p;
    }
    return [clumps[0][0], clumps[0][1] + clumps[0][3], clumps[0][2]];
  };
  const nf = key === 'cherry' ? 13 : 12;
  for (let i = 0; i < nf; i++) {
    const p = surf(-0.55);
    if (key === 'pear') fruits.add(ellip(fr * 0.85, fr * 1.2, fr * 0.85, fm, p[0], p[1] - fr * 0.2, p[2], { shadow: false }));
    else fruits.add(ball(fr, fm, { at: p, shadow: false, ws: 10, hs: 8 }));
  }
  for (let i = 0; i < 15; i++) blossoms.add(ball(0.085 * W, bm, { low: true, at: surf(-0.3), shadow: false }));
  fruits.visible = opts.fruit ?? true;
  blossoms.visible = opts.blossom ?? false;
  g.add(fruits, blossoms);
  g.add(blobShadow(0.95 * S, 0.25));
  g.userData.state = { fruit: fruits.visible, blossom: blossoms.visible };
  g.userData.setFruit = (v) => { fruits.visible = !!v; g.userData.state.fruit = !!v; };
  g.userData.setBlossom = (v) => { blossoms.visible = !!v; g.userData.state.blossom = !!v; };
  return g;
}

// ------------------------------------------------------------------ wild trees (cheap, <= 8 meshes)
/** kind: 'oak' | 'birch' | 'pine' | 'poplar' | 'bush'; seed varies size / shape / rotation. */
export function makeWildTree(kind = 'oak', seed = 1) {
  const R = rng(seed * 13 + 5);
  const S = 0.85 + R() * 0.3;
  const g = group();
  const j = () => (R() - 0.5) * 0.16;
  if (kind === 'pine') {
    g.add(mesh(GEO.cyl(0.07, 0.11, 0.5, 7), PAL.woodDark, { at: [0, 0.25, 0] }));
    const lm = leafMat('#2f6b3a', { evergreen: true, sway: 0.012 });
    const lm2 = leafMat('#3b7d45', { evergreen: true, sway: 0.012 });
    [[0.6, 0.85, 0.75], [0.48, 0.8, 1.2], [0.34, 0.75, 1.65]].forEach(([r, h, y], i) =>
      g.add(mesh(GEO.cone(r, h, 8), i % 2 ? lm2 : lm, { at: [0, y, 0], rot: [0, R() * TAU, 0] })));
    g.add(blobShadow(0.6, 0.25));
  } else if (kind === 'birch') {
    const white = M('#f4f1e8');
    g.add(mesh(GEO.cyl(0.07, 0.1, 1.5, 8), white, { at: [0, 0.75, 0] }));
    const dark = M('#3a3a3a');
    g.add(mesh(GEO.box(0.06, 0.03, 0.03), dark, { at: [0.06, 0.5, 0.05], rot: [0, 0.8, 0.2], shadow: false }));
    g.add(mesh(GEO.box(0.07, 0.025, 0.03), dark, { at: [-0.04, 0.95, 0.07], rot: [0, -0.5, -0.15], shadow: false }));
    const lm = leafMat('#9ccc65');
    const lm2 = leafMat('#b5d86a');
    g.add(ellip(0.42, 0.55, 0.42, lm, j(), 1.65, j(), { low: true, shadow: true }));
    g.add(ellip(0.3, 0.4, 0.3, lm2, 0.25 + j(), 1.35, 0.1 + j(), { low: true, shadow: true }));
    g.add(ellip(0.28, 0.36, 0.28, lm2, -0.22 + j(), 1.45, -0.12 + j(), { low: true, shadow: true }));
    g.add(blobShadow(0.55, 0.22));
  } else if (kind === 'poplar') {
    g.add(mesh(GEO.cyl(0.07, 0.1, 0.6, 7), PAL.woodDark, { at: [0, 0.3, 0] }));
    const lm = leafMat('#5a9e3a');
    g.add(ellip(0.34, 1.0, 0.34, lm, 0, 1.4, 0, { low: true, shadow: true }));
    g.add(ellip(0.25, 0.6, 0.25, leafMat('#6fb04a'), 0.12 + j() * 0.5, 1.15, 0.1, { low: true, shadow: true }));
    g.add(blobShadow(0.45, 0.22));
  } else if (kind === 'bush') {
    const lm = leafMat('#4f9a3c');
    const lm2 = leafMat('#63ad45');
    g.add(ball(0.3, lm, { low: true, at: [0, 0.25, 0] }));
    g.add(ball(0.22, lm2, { low: true, at: [0.2 + j(), 0.2, 0.12 + j()] }));
    g.add(ball(0.2, lm2, { low: true, at: [-0.2 + j(), 0.18, -0.08 + j()] }));
    g.add(blobShadow(0.45, 0.22));
  } else {
    // oak: big round 2x2 tree
    g.add(mesh(GEO.cyl(0.15, 0.24, 1.0, 9), '#6e4a2b', { at: [0, 0.5, 0] }));
    const lm = leafMat('#3f9142');
    const lm2 = leafMat('#55a447');
    g.add(ball(0.68, lm, { low: true, at: [j(), 1.55, j()] }));
    g.add(ball(0.5, lm2, { low: true, at: [0.48 + j(), 1.3, 0.2 + j()] }));
    g.add(ball(0.5, lm2, { low: true, at: [-0.45 + j(), 1.32, -0.18 + j()] }));
    g.add(ball(0.45, lm, { low: true, at: [0.05 + j(), 1.3, -0.5 + j()] }));
    g.add(ball(0.42, lm, { low: true, at: [-0.1 + j(), 1.95, 0.15 + j()] }));
    g.add(blobShadow(0.95, 0.25));
  }
  g.scale.setScalar(S);
  g.rotation.y = R() * TAU;
  return g;
}

// ------------------------------------------------------------------ obstacles
const grassTuft = (g, R, x, z, h, mats) => {
  for (let i = 0; i < 3; i++) {
    const L = h * (0.75 + R() * 0.5);
    g.add(orient(mesh(GEO.cone(0.045, L, 4), mats[i % mats.length], { shadow: false }), x, 0, z, R() * TAU, 0.2 + R() * 0.35, L));
  }
};

/** Obstacle `key` of OBSTACLES (weeds, bush, stump, log, rock, boulder). */
export function makeObstacle(key, seed = 1) {
  const R = rng(seed * 7 + key.length * 31);
  const g = group();
  const size = OBSTACLES[key]?.size || 1;
  if (key === 'weeds') {
    const mats = [leafMat('#6b9e32'), leafMat('#88b23c'), leafMat('#5a8a2c')];
    for (const [x, z] of [[-0.24, -0.18], [0.18, -0.24], [0, 0.02], [-0.22, 0.22], [0.25, 0.16], [0.05, 0.3]]) grassTuft(g, R, x, z, 0.38, mats);
    const cols = ['#ffeb3b', '#ffffff', '#ce93d8'];
    for (let i = 0; i < 4; i++) {
      const x = (R() - 0.5) * 0.6, z = (R() - 0.5) * 0.6;
      g.add(ball(0.045, M(cols[i % 3], { sway: 0.02 }), { at: [x, 0.26 + R() * 0.1, z], shadow: false, ws: 8, hs: 6 }));
    }
    g.add(blobShadow(0.45, 0.18));
  } else if (key === 'bush') {
    const lm = leafMat('#3f7a34', { flat: true });
    const lm2 = leafMat('#55913c', { flat: true });
    g.add(ball(0.34, lm, { low: true, at: [0, 0.3, 0] }));
    g.add(ball(0.25, lm2, { low: true, at: [0.2, 0.22, 0.16] }));
    g.add(ball(0.23, lm2, { low: true, at: [-0.22, 0.2, -0.1] }));
    const thorn = M('#6d4c2f', { sway: 0.015 });
    for (let i = 0; i < 6; i++) {
      const a = R() * TAU;
      g.add(orient(mesh(GEO.cone(0.018, 0.22, 4), thorn, { shadow: false }), Math.sin(a) * 0.2, 0.2 + R() * 0.2, Math.cos(a) * 0.2, a, 1.0 + R() * 0.6, 0.22));
    }
    const berry = M('#c62828', { sway: 0.015, emissive: '#3a0a0a' });
    for (let i = 0; i < 7; i++) {
      const a = R() * TAU * 0.7 - 0.2, y = 0.15 + R() * 0.3;
      g.add(ball(0.042, berry, { at: [Math.sin(a) * 0.33, y, Math.cos(a) * 0.33], shadow: false, ws: 8, hs: 6 }));
    }
    g.add(blobShadow(0.48, 0.25));
  } else if (key === 'stump') {
    const bark = M('#6e4a2b');
    g.add(mesh(GEO.cyl(0.26, 0.31, 0.34, 11), bark, { at: [0, 0.17, 0] }));
    g.add(mesh(GEO.cyl(0.235, 0.235, 0.02, 20), '#e3bd85', { at: [0, 0.345, 0], shadow: false }));
    for (const r of [0.16, 0.09]) g.add(mesh(GEO.torus(r, 0.008, 4, 22), '#b98a55', { at: [0, 0.356, 0], rot: [Math.PI / 2, 0, 0], shadow: false }));
    g.add(ball(0.025, '#b98a55', { at: [0, 0.356, 0], shadow: false, ws: 6, hs: 4 }));
    for (let i = 0; i < 4; i++) {
      const a = i * 1.57 + 0.4 + R() * 0.3;
      g.add(orient(mesh(GEO.capsule(0.06, 0.18, 4, 8), bark), Math.sin(a) * 0.2, 0.0, Math.cos(a) * 0.2, a, 1.25, 0.3));
    }
    g.add(ellip(0.12, 0.04, 0.1, leafMat('#6aa84f'), -0.15, 0.3, 0.12, { low: true }));
    g.add(blobShadow(0.45, 0.25));
  } else if (key === 'log') {
    const bark = M('#6e4a2b');
    const log = group(
      mesh(GEO.cyl(0.27, 0.3, 2.0, 12), bark),
      mesh(GEO.cyl(0.25, 0.25, 0.02, 18), '#e3bd85', { at: [0, 1.0, 0], shadow: false }),
      mesh(GEO.torus(0.15, 0.01, 4, 20), '#b98a55', { at: [0, 1.012, 0], rot: [Math.PI / 2, 0, 0], shadow: false }),
      mesh(GEO.cyl(0.28, 0.28, 0.02, 18), '#d4a870', { at: [0, -1.0, 0], shadow: false }),
    );
    log.rotation.set(0, 0, Math.PI / 2);
    const holder = group(log);
    holder.rotation.y = Math.PI / 4 + (R() - 0.5) * 0.3;
    holder.position.y = 0.27;
    // moss + branch stub + mushrooms
    const moss = leafMat('#6aa84f', { flat: true });
    holder.add(ellip(0.45, 0.08, 0.2, moss, -0.2, 0.25, 0, { low: true }));
    holder.add(ellip(0.3, 0.07, 0.16, moss, 0.55, 0.22, 0.05, { low: true }));
    holder.add(orient(mesh(GEO.cyl(0.05, 0.08, 0.3, 7), bark), 0.25, 0.15, 0.1, 0.2, 0.8, 0.3));
    g.add(holder);
    const cap = M('#e53935'), dot = M('#fff8e1');
    for (const [x, z] of [[0.45, 0.25], [0.6, 0.12]]) {
      g.add(mesh(GEO.cyl(0.02, 0.025, 0.08, 6), dot, { at: [x, 0.04, z], shadow: false }));
      g.add(mesh(GEO.sphere(0.06, 10, 6), cap, { at: [x, 0.08, z], scale: [1, 0.6, 1], shadow: false }));
    }
    g.add(blobShadow(1.0, 0.25));
  } else if (key === 'rock') {
    const st = M(PAL.stone, { flat: true });
    const st2 = M(PAL.stoneDark, { flat: true });
    g.add(ellip(0.32, 0.24, 0.28, st, -0.04, 0.16, -0.04, { low: true, shadow: true }));
    g.add(ellip(0.16, 0.12, 0.15, st2, 0.22, 0.08, 0.16, { low: true, shadow: true }));
    g.add(ellip(0.11, 0.08, 0.1, st, -0.22, 0.05, 0.22, { low: true }));
    g.children.forEach((c) => { c.rotation.y = R() * TAU; });
    g.add(blobShadow(0.45, 0.25));
  } else if (key === 'boulder') {
    const st = M(PAL.stone, { flat: true });
    const st2 = M(PAL.stoneDark, { flat: true });
    const moss = leafMat('#6aa84f', { flat: true });
    g.add(ellip(0.72, 0.55, 0.62, st, -0.05, 0.42, -0.05, { low: true, shadow: true }));
    g.add(ellip(0.45, 0.14, 0.38, moss, -0.12, 0.88, -0.1, { low: true }));
    g.add(ellip(0.32, 0.24, 0.3, st2, 0.55, 0.18, 0.45, { low: true, shadow: true }));
    g.add(ellip(0.2, 0.15, 0.18, st, -0.6, 0.1, 0.55, { low: true, shadow: true }));
    g.add(ellip(0.14, 0.1, 0.13, st2, 0.7, 0.07, -0.4, { low: true }));
    g.children.forEach((c, i) => { if (i !== 1) c.rotation.y = R() * TAU; });
    g.add(blobShadow(0.95, 0.28));
  }
  g.userData.size = size;
  return g;
}

// ------------------------------------------------------------------ wildflowers (<= 8 meshes)
const FLOWER_COLS = ['#ffeb3b', '#ffffff', '#f06292', '#ba68c8', '#64b5f6', '#ff8a65'];

/** Small meadow cluster (~0.5 wide): 2 grass tufts + 3..5 flower heads. */
export function makeWildflowers(seed = 1) {
  const R = rng(seed * 11 + 3);
  const g = group();
  const gm = leafMat('#6fb33a');
  for (let i = 0; i < 2; i++) {
    const L = 0.2 + R() * 0.08;
    g.add(orient(mesh(GEO.cone(0.07, L, 5), gm, { shadow: false }), (R() - 0.5) * 0.3, 0, (R() - 0.5) * 0.3, R() * TAU, 0.15, L));
  }
  const n = 3 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const c = FLOWER_COLS[Math.floor(R() * FLOWER_COLS.length)];
    const a = R() * TAU, d = 0.06 + R() * 0.17;
    g.add(mesh(GEO.sphere(0.06, 8, 6), M(c, { sway: 0.02 }), { at: [Math.sin(a) * d, 0.13 + R() * 0.09, Math.cos(a) * d], scale: [1, 0.6, 1], shadow: false }));
  }
  g.rotation.y = R() * TAU;
  return g;
}

// ------------------------------------------------------------------ gallery catalog
const onPlot = (crop, wet = false) => {
  const p = makePlot();
  if (wet) p.userData.setWet(true);
  crop.position.y = PLOT_TOP;
  p.add(crop);
  return p;
};

export const CATALOG = {};
for (const id of Object.keys(CROPS)) {
  for (let s = 0; s <= 4; s++) CATALOG[`${id}_${s}`] = () => onPlot(makeCrop(id, s));
}
CATALOG.plot = () => makePlot();
CATALOG.plot_wet = () => { const p = makePlot(); p.userData.setWet(true); return p; };
for (const key of Object.keys(TREES)) {
  CATALOG[`tree_${key}`] = () => makeFruitTree(key);
  CATALOG[`tree_${key}_blossom`] = () => makeFruitTree(key, { fruit: false, blossom: true });
}
for (const kind of ['oak', 'birch', 'pine', 'poplar', 'bush']) CATALOG[`wild_${kind}`] = () => makeWildTree(kind, 1);
for (const key of Object.keys(OBSTACLES)) CATALOG[`obs_${key}`] = () => makeObstacle(key, 1);
CATALOG.wildflowers = () => group(makeWildflowers(1), place(makeWildflowers(2), 0.45, 0, 0.3), place(makeWildflowers(3), -0.35, 0, 0.35));
