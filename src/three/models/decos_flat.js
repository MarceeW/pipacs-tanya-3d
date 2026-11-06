// Connectable fences/hedges and flat path tiles for the decoration module.
// Connection flags: n = -z, s = +z, e = +x, w = -x (neighbours of the same key).
import { PAL, M, leafMat, box, cyl, cone, ball, group, place, rng } from '../lib.js';

const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

/** Connected arm directions as [dx, dz, key] tuples. */
function armList(connect = {}) {
  return Object.entries(DIRS).filter(([k]) => connect[k]).map(([k, v]) => [v[0], v[1], k]);
}

/** Box stretched along a direction: `len` along the arm axis, `thick` across it. */
function armBox(dx, len, thick, h, c, r) {
  return dx !== 0 ? box(len, h, thick, c, { r }) : box(thick, h, len, c, { r });
}

// ------------------------------------------------------------------ rustic wooden fence
export function makeFence(connect) {
  const g = group();
  const arms = armList(connect);
  const solo = !arms.length;
  const list = solo ? [[1, 0, 'e'], [-1, 0, 'w']] : arms;
  const L = solo ? 0.4 : 0.5;
  const post = (x, z, h = 0.6) => {
    const w = h > 0.55 ? 0.13 : 0.1;
    g.add(place(box(w, h, w, PAL.woodDark, { r: 0.03 }), x, h / 2, z));
    g.add(place(box(w + 0.02, 0.04, w + 0.02, '#8f6136', { r: 0.015 }), x, h + 0.01, z));
  };
  post(0, 0);
  for (const [dx, dz] of list) {
    for (const [y, c] of [[0.22, PAL.wood], [0.44, PAL.plank]]) {
      g.add(place(armBox(dx, L, 0.06, 0.08, c, 0.025), (dx * L) / 2, y, (dz * L) / 2));
    }
    if (solo) post(dx * L, dz * L, 0.52);
  }
  return g;
}

// ------------------------------------------------------------------ white picket fence
export function makePicket(connect) {
  const g = group();
  const white = '#fbfaf2';
  const arms = armList(connect);
  const solo = !arms.length;
  const list = solo ? [[1, 0, 'e'], [-1, 0, 'w']] : arms;
  // centre post with a ball cap
  g.add(place(box(0.11, 0.62, 0.11, white, { r: 0.025 }), 0, 0.31, 0));
  g.add(place(ball(0.055, white, { shadow: false }), 0, 0.66, 0));
  const picket = (x, z, along) => {
    g.add(place(along ? box(0.075, 0.46, 0.035, white, { r: 0.012 }) : box(0.035, 0.46, 0.075, white, { r: 0.012 }), x, 0.23, z));
    const tip = cone(0.055, 0.08, white, { seg: 4, shadow: false });
    tip.scale.set(along ? 1 : 0.45, 1, along ? 0.45 : 1);
    tip.rotation.y = Math.PI / 4;
    g.add(place(tip, x, 0.5, z, Math.PI / 4));
  };
  for (const [dx, dz, key] of list) {
    const L = solo ? 0.375 : 0.5;
    for (const y of [0.15, 0.36]) g.add(place(armBox(dx, L, 0.04, 0.055, white, 0.015), (dx * L) / 2, y, (dz * L) / 2));
    const ds = [0.125, 0.25, 0.375];
    // the picket exactly on the shared edge is drawn only by the s/e side (never doubled)
    if (!solo && (key === 's' || key === 'e')) ds.push(0.5 - 0.04);
    for (const d of ds) picket(dx * d, dz * d, dx !== 0);
  }
  return g;
}

// ------------------------------------------------------------------ boxy hedge
export function makeHedge(connect, seed = 0) {
  const g = group();
  const lm = leafMat('#3f9e3a');
  const lm2 = leafMat('#4fb244');
  const r = rng(seed + 7);
  const arms = armList(connect);
  const H = 0.56;
  if (!arms.length) {
    g.add(place(box(0.86, H, 0.5, lm, { r: 0.12 }), 0, H / 2, 0));
    for (const x of [-0.24, 0.05, 0.28]) g.add(place(ball(0.14, lm2, { low: true, scale: [1, 0.6, 1] }), x, H - 0.02, (r() - 0.5) * 0.12));
  } else {
    g.add(place(box(0.54, H, 0.54, lm, { r: 0.12 }), 0, H / 2, 0));
    g.add(place(ball(0.16, lm2, { low: true, scale: [1, 0.6, 1] }), 0, H - 0.01, 0));
    for (const [dx, dz] of arms) {
      g.add(place(armBox(dx, 0.5, 0.5, H - 0.02, lm, 0.05), dx * 0.25, (H - 0.02) / 2, dz * 0.25));
      g.add(place(ball(0.12, lm2, { low: true, scale: [1, 0.55, 1] }), dx * 0.32, H - 0.04, dz * 0.32));
    }
  }
  // a few tiny blossoms on the sunny faces
  const fl = M('#fff6fa', { sway: 0.02 });
  for (let i = 0; i < 3; i++) {
    const side = r() < 0.5;
    const x = side ? 0.255 : (r() - 0.5) * 0.4, z = side ? (r() - 0.5) * 0.4 : 0.255;
    g.add(place(ball(0.03, i % 2 ? fl : M('#ffb3c7', { sway: 0.02 }), { shadow: false }), x, 0.2 + r() * 0.3, z));
  }
  return g;
}

// ------------------------------------------------------------------ path tiles (flat, top <= 0.04)
export function makePathDirt(seed = 0) {
  const g = group();
  const r = rng(seed + 11);
  g.add(place(box(0.98, 0.02, 0.98, '#c9a26b', { r: 0.008 }), 0, 0.01, 0));
  // darker trodden patches
  for (let i = 0; i < 4; i++) {
    const p = cyl(1, 1, 0.006, i % 2 ? '#bf9660' : '#d2ad77', { seg: 12, shadow: false });
    p.scale.set(0.1 + r() * 0.1, 1, 0.08 + r() * 0.08);
    g.add(place(p, (r() - 0.5) * 0.6, 0.022, (r() - 0.5) * 0.6, r() * 3));
  }
  // pebbles
  const pc = ['#d9cfbd', '#a9a59b', '#bcb4a4', '#8f8a80'];
  const n = 7 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const s = 0.022 + r() * 0.02;
    g.add(place(ball(s, pc[i % 4], { low: true, shadow: false, scale: [1.2, 0.45, 1] }), (r() - 0.5) * 0.86, 0.022, (r() - 0.5) * 0.86, r() * 3));
  }
  return g;
}

export function makePathStone(seed = 0) {
  const g = group();
  const r = rng(seed + 23);
  g.add(place(box(0.98, 0.016, 0.98, '#b9ad91', { r: 0.006 }), 0, 0.008, 0));
  const cols = ['#cfcabc', '#b3afa3', '#c4bba8', '#a8a499', '#d8d0bd'];
  const step = 0.32;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    // irregular flagstone: low-poly disc with random squash + a slight rounded top
    const seg = 5 + Math.floor(r() * 3);
    const st = cyl(1, 1.04, 0.022, cols[Math.floor(r() * cols.length)], { seg, shadow: false });
    const big = r() < 0.3 ? 1.12 : 1;
    st.scale.set((0.13 + r() * 0.035) * big, 1, (0.11 + r() * 0.035) * big);
    const x = i * step + (r() - 0.5) * 0.05, z = j * step + (r() - 0.5) * 0.05;
    st.position.set(Math.max(-0.33, Math.min(0.33, x)), 0.027, Math.max(-0.33, Math.min(0.33, z)));
    st.rotation.y = r() * Math.PI * 2;
    g.add(st);
  }
  // small filler stones in the gaps
  for (let i = 0; i < 4; i++) {
    const x = (Math.floor(r() * 2) - 0.5) * step, z = (Math.floor(r() * 2) - 0.5) * step;
    g.add(place(ball(0.035, '#9d998e', { low: true, shadow: false, scale: [1, 0.35, 1] }), x, 0.018, z));
  }
  return g;
}

export function makePathBrick(seed = 0) {
  const g = group();
  const r = rng(seed + 31);
  g.add(place(box(0.98, 0.018, 0.98, '#d2c2a4', { r: 0.006 }), 0, 0.009, 0));
  const cols = ['#c0583a', '#b44f34', '#cc6a48', '#a94a30', '#c96248'];
  const u = 0.14, N = 7, gap = 0.014, top = 0.026;
  const inside = (x, y) => x >= 0 && x < N && y >= 0 && y < N;
  const cx = (x) => (x - (N - 1) / 2) * u;
  const ox = seed % 2, oy = (seed >> 1) % 2;
  // 90 degree herringbone: H brick cells (0,0),(1,0); V brick cells (0,1),(0,2);
  // lattice (1,1) and (2,-2) tiles the plane (verified offline).
  const add = (cells) => {
    const inn = cells.filter(([x, y]) => inside(x, y));
    if (!inn.length) return;
    const xs = inn.map((c) => c[0]), ys = inn.map((c) => c[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const w = (x1 - x0 + 1) * u - gap, d = (y1 - y0 + 1) * u - gap;
    const b = box(w, 0.02, d, cols[Math.floor(r() * cols.length)], { r: 0.006, shadow: false });
    g.add(place(b, (cx(x0) + cx(x1)) / 2, top - 0.01 + r() * 0.003, (cx(y0) + cx(y1)) / 2));
  };
  for (let k = -10; k <= 10; k++) for (let m = -6; m <= 6; m++) {
    const x = k + 2 * m + ox, y = k - 2 * m + oy;
    add([[x, y], [x + 1, y]]);
    add([[x, y + 1], [x, y + 2]]);
  }
  return g;
}
