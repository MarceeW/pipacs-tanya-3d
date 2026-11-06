// Crop builders for plants.js: one archetype builder per CROPS[*].look.type, coloured by
// look.leaf / look.fruit. Origin y = 0 is the top of the tilled plot (the world adds PLOT_TOP).
// Stages: 0 sown, 1 sprouts, 2 young, 3 nearly grown (unripe), 4 ripe ("juicy" reward moment).
import { THREE, PAL, M, leafMat, GEO, mesh, ball, group, rng } from '../lib.js';

const TAU = Math.PI * 2;

// ------------------------------------------------------------------ small helpers
/** Hex colour lerp (string in, string out) so results can key the material cache. */
export function mix(a, b, t) {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
}

/** Ripe fruit material: slight self-glow in its own colour for a saturated, juicy pop. */
export function juicy(color, sway = 0.015) {
  return M(color, { sway, emissive: mix('#000000', color, 0.28) });
}

/** Scaled unit sphere (ellipsoid); shares one cached geometry. */
export function ellip(rx, ry, rz, mat, x, y, z, o = {}) {
  return mesh(o.low ? GEO.ico(1, 1) : GEO.sphere(1, 10, 8), mat, { at: [x, y, z], scale: [rx, ry, rz], shadow: o.shadow ?? false });
}

/**
 * Orient a y-axis primitive (cone, cylinder, capsule) so it grows from base (x,y,z), leaning
 * `tilt` radians from vertical towards compass direction `yaw` (0 = +z). len = its y length.
 */
export function orient(m, x, y, z, yaw, tilt, len) {
  m.rotation.order = 'YXZ';
  m.rotation.set(tilt, yaw, 0);
  const s = Math.sin(tilt);
  m.position.set(x + Math.sin(yaw) * s * len / 2, y + Math.cos(tilt) * len / 2, z + Math.cos(yaw) * s * len / 2);
  return m;
}

/** Flat leaf ellipsoid from base (x,y,z) pointing towards yaw, raised `pitch` radians above horizontal. */
export function leaf(len, w, mat, x, y, z, yaw, pitch, th = 0.018) {
  const m = mesh(GEO.sphere(1, 8, 6), mat, { scale: [w / 2, th, len / 2], shadow: false });
  m.rotation.order = 'YXZ';
  m.rotation.set(-pitch, yaw, 0);
  const c = Math.cos(pitch);
  m.position.set(x + Math.sin(yaw) * c * len / 2, y + Math.sin(pitch) * len / 2, z + Math.cos(yaw) * c * len / 2);
  return m;
}

const thin = (r, h, mat, o = {}) => mesh(GEO.cone(r, h, o.seg || 5), mat, { shadow: o.shadow ?? false });
const rod = (rt, rb, h, mat, o = {}) => mesh(GEO.cyl(rt, rb, h, o.seg || 6), mat, { shadow: o.shadow ?? false });
const caps = (r, len, mat, o = {}) => mesh(GEO.capsule(r, len, 4, 8), mat, { shadow: o.shadow ?? false });

function hash(s) { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h; }

/** Planting spots inside the 0.8 x 0.8 bed. Rows follow the plot's 3 ridges (z = -0.27, 0, 0.27). */
function spots(n, R) {
  let p;
  if (n === 9) p = [-0.27, 0, 0.27].flatMap((z) => [-0.27, 0, 0.27].map((x) => [x, z]));
  else if (n === 6) p = [-0.27, 0, 0.27].flatMap((z) => [-0.19, 0.19].map((x) => [x + z * 0.15, z]));
  else if (n === 5) p = [[-0.21, -0.21], [0.21, -0.21], [0, 0], [-0.21, 0.21], [0.21, 0.21]];
  else if (n === 3) p = [[-0.2, -0.17], [0.2, -0.12], [0, 0.2]];
  else p = [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]];
  return p.map(([x, z]) => [x + (R() - 0.5) * 0.05, z + (R() - 0.5) * 0.05]);
}

/** Random point on the visible (upper / camera-facing) part of a sphere surface. */
function onSphere(R, cx, cy, cz, r, ymin = -0.25, ymax = 0.75) {
  const a = R() * TAU * 0.75 - 0.6;           // favour the +x/+z (camera) side
  const y = ymin + R() * (ymax - ymin);
  const h = Math.sqrt(1 - y * y);
  return [cx + Math.sin(a + 0.4) * h * r, cy + y * r, cz + Math.cos(a + 0.4) * h * r];
}

const SEED = '#e9d8a6';
const UNRIPE = '#8bc34a';

// ------------------------------------------------------------------ stage 0 / 1 (shared)
function sown(g, R, look) {
  const dark = M(PAL.soilDark, { snow: 0.5 });
  const seed = M(mix(SEED, look.fruit, 0.25));
  for (const [x, z] of spots(6, R)) {
    g.add(ellip(0.065, 0.014, 0.05, dark, x, 0.004, z));
    g.add(ball(0.02, seed, { at: [x + 0.012, 0.016, z + 0.01], shadow: false, ws: 6, hs: 4 }));
  }
}

const BLADE_TYPES = new Set(['grain', 'tall', 'cane', 'bulb', 'spike']);
function sprouts(g, R, look) {
  const lm = leafMat(mix(look.leaf, PAL.leafLight, 0.3));
  const n = 6;
  for (const [x, z] of spots(n, R)) {
    const yaw = R() * TAU;
    if (BLADE_TYPES.has(look.type)) {
      for (let i = 0; i < 3; i++) { const L = 0.15 + R() * 0.05; g.add(orient(thin(0.02, L, lm, { seg: 4 }), x, 0, z, yaw + i * 2.1, 0.3, L)); }
    } else {
      g.add(orient(rod(0.01, 0.012, 0.08, lm), x, 0, z, 0, 0, 0.08));
      g.add(leaf(0.1, 0.07, lm, x, 0.075, z, yaw, 0.45));
      g.add(leaf(0.1, 0.07, lm, x, 0.075, z, yaw + Math.PI, 0.45));
    }
  }
}

// ------------------------------------------------------------------ archetypes (stage 2..4)
// Each receives (g, R, look, st, id). st: 2 young, 3 unripe, 4 ripe.

function grain(g, R, look, st, id) {
  const droop = id === 'rice' || look.droop;
  const H = [0, 0, 0.24, 0.4, 0.5][st];
  const golden = st === 4 && !droop;
  const lm = leafMat(golden ? mix(look.leaf, look.fruit, 0.55) : look.leaf);
  const stalkM = M(golden ? mix(look.fruit, '#c8a040', 0.35) : mix(look.leaf, '#c5e1a5', 0.2), { sway: 0.02 });
  const ear = st === 4 ? juicy(droop ? look.fruit : mix(look.fruit, '#e8a317', 0.3), 0.02) : M(mix(look.leaf, look.fruit, 0.3), { sway: 0.02 });
  for (const [x, z] of spots(6, R)) {
    const yaw0 = R() * TAU;
    if (st === 2) {
      for (let i = 0; i < 4; i++) {
        const L = H * (0.8 + R() * 0.4);
        g.add(orient(thin(0.024, L, lm, { seg: 4 }), x, 0, z, yaw0 + i * 1.6, 0.12 + (i % 2) * 0.22, L));
      }
      continue;
    }
    // two grassy blades at the base
    const nb = droop ? 2 : st === 3 ? 1 : 0;
    for (let i = 0; i < nb; i++) g.add(orient(thin(0.026, H * 0.6, lm, { seg: 4 }), x, 0, z, yaw0 + i * 3.1, 0.45, H * 0.6));
    const n = droop || st === 3 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const yaw = yaw0 + 0.8 + (i * TAU) / n;
      const h = H * (0.88 + R() * 0.22);
      const lean = 0.08 + R() * 0.08;
      const bx = x + Math.sin(yaw) * 0.025, bz = z + Math.cos(yaw) * 0.025;
      g.add(orient(rod(0.009, 0.012, h, stalkM, { seg: 4 }), bx, 0, bz, yaw, lean, h));
      const tx = bx + Math.sin(yaw) * Math.sin(lean) * h, ty = Math.cos(lean) * h, tz = bz + Math.cos(yaw) * Math.sin(lean) * h;
      if (droop) {
        // arched panicle: a torus arc that leaves the stalk upwards and hangs outwards
        const r = st === 4 ? 0.06 : 0.045;
        const arc = mesh(GEO.torus(r, st === 4 ? 0.028 : 0.018, 6, 10, 2.7), ear, { shadow: false });
        arc.rotation.y = yaw + Math.PI / 2;
        arc.position.set(tx + Math.sin(yaw) * r, ty, tz + Math.cos(yaw) * r);  // arc starts at the stalk tip
        g.add(arc);
      } else {
        const len = st === 4 ? 0.09 : 0.065;
        const er = st === 4 ? 0.032 : 0.024;
        g.add(orient(caps(er, len, ear), tx, ty - 0.02, tz, yaw, lean, len + er * 2));
      }
    }
  }
}

function root(g, R, look, st, id) {
  const lm = leafMat(look.leaf);
  if (id === 'potato' || look.bushy) {
    const s = [0, 0, 0.7, 0.95, 1.05][st];
    const flower = M(st === 4 ? '#f3e5f5' : '#ffffff', { sway: 0.015 });
    const tuber = M(look.fruit);
    for (const [x, z] of spots(4, R)) {
      g.add(ball(0.13 * s, lm, { low: true, at: [x, 0.1 * s, z], shadow: true }));
      g.add(ball(0.1 * s, lm, { low: true, at: [x + 0.07 * s, 0.17 * s, z + 0.05 * s] }));
      if (st >= 3) for (let i = 0; i < 2; i++) {
        const p = onSphere(R, x, 0.12 * s, z, 0.13 * s, 0.4, 0.9);
        g.add(ball(0.028, flower, { at: [p[0], p[1] + 0.02, p[2]], shadow: false, ws: 8, hs: 6 }));
        g.add(ball(0.011, M(PAL.gold), { at: [p[0], p[1] + 0.045, p[2]], shadow: false, ws: 6, hs: 4 }));
      }
      if (st === 4) {
        g.add(ellip(0.07, 0.05, 0.055, tuber, x + 0.1, 0.0, z + 0.11, { shadow: true }));
        g.add(ellip(0.055, 0.04, 0.05, tuber, x - 0.08, -0.005, z + 0.12));
      }
    }
    return;
  }
  // carrot-like: feathery fronds + coloured shoulders peeking out of the soil
  const s = [0, 0, 0.7, 0.95, 1.15][st];
  const top = st === 4 ? juicy(look.fruit, 0) : M(mix(look.fruit, '#ffcc80', 0.45));
  for (const [x, z] of spots(6, R)) {
    const yaw0 = R() * TAU;
    const fr = leafMat(mix(look.leaf, PAL.leafLight, 0.35));
    for (let i = 0; i < 4; i++) {
      const L = (0.22 + R() * 0.06) * s;
      g.add(orient(thin(0.05 * s, L, i % 2 ? fr : lm, { seg: 5 }), x, 0.02, z, yaw0 + i * 1.57, 0.35 + (i % 2) * 0.15, L));
    }
    if (st >= 3) {
      const r = st === 4 ? 0.062 : 0.042;
      const c = mesh(GEO.cone(r, r * 3, 10), top, { shadow: false });
      c.rotation.x = Math.PI;
      c.position.set(x + 0.01, r * 0.9 - r * 1.5 + 0.02, z + 0.02);
      g.add(c);
    }
  }
}

function tall(g, R, look, st) {
  const H = [0, 0, 0.42, 0.78, 1.0][st];
  const lm = leafMat(look.leaf);
  const stalkM = leafMat(mix(look.leaf, '#c5e1a5', 0.25));
  const husk = M(mix(look.leaf, '#dce775', 0.4), { sway: 0.015 });
  const cobM = juicy(look.fruit);
  const tassel = M('#e3c77a', { sway: 0.02 });
  for (const [x, z] of spots(4, R)) {
    const h = H * (0.92 + R() * 0.16);
    const yaw0 = R() * TAU;
    g.add(orient(rod(0.03, 0.045, h, stalkM, { shadow: true }), x, 0, z, 0, 0, h));
    for (let i = 0; i < 4; i++) {
      const y = h * (0.12 + i * 0.2);
      g.add(leaf(0.42 * Math.max(0.6, H), 0.11, lm, x, y, z, yaw0 + i * 2.4, 0.3 - i * 0.04, 0.012));
    }
    if (st >= 3) g.add(orient(thin(0.04, 0.16, tassel, { seg: 6 }), x, h - 0.02, z, 0, 0, 0.16));
    if (st >= 3) {
      const yaw = Math.PI / 4 + (R() - 0.5) * 1.2;
      const by = h * 0.5;
      if (st === 4) {
        g.add(orient(caps(0.062, 0.15, cobM), x + Math.sin(yaw) * 0.035, by, z + Math.cos(yaw) * 0.035, yaw, 0.5, 0.274));
        g.add(leaf(0.18, 0.07, husk, x, by - 0.02, z, yaw + 0.55, 0.85, 0.014));
        g.add(leaf(0.18, 0.07, husk, x, by - 0.02, z, yaw - 0.55, 0.85, 0.014));
      } else {
        g.add(orient(caps(0.04, 0.11, husk), x + Math.sin(yaw) * 0.03, by, z + Math.cos(yaw) * 0.03, yaw, 0.35, 0.19));
      }
    }
  }
}

function bush(g, R, look, st, id) {
  const s = [0, 0, 0.65, 0.9, 1.05][st];
  const lm = leafMat(id === 'soy' && st === 4 ? mix(look.leaf, '#cdb94e', 0.4) : look.leaf);
  const lm2 = leafMat(mix(look.leaf, PAL.leafLight, 0.2));
  const tallBush = id === 'coffee' || look.tallBush;
  let fruitC = look.fruit;
  if (id === 'coffee') fruitC = mix(look.fruit, '#e53935', 0.55);
  if (id === 'blueberry') fruitC = mix(look.fruit, '#5c8df6', 0.35);
  if (id === 'soy') fruitC = mix(look.fruit, '#d9b25a', 0.45);
  const ripe = juicy(fruitC);
  const green = M(UNRIPE, { sway: 0.015 });
  const shape = id === 'pepper' ? 'pepper' : id === 'soy' ? 'pod' : 'berry';
  for (const [x, z] of spots(4, R)) {
    const r = 0.15 * s;
    const cy = tallBush ? r * 1.6 : r * 0.95;
    if (tallBush) {
      g.add(orient(rod(0.018, 0.025, 0.12 * s, M(PAL.woodDark)), x, 0, z, 0, 0, 0.12 * s));
      g.add(ellip(r * 1.05, r * 1.35, r * 1.05, lm, x, cy, z, { low: true, shadow: true }));
      g.add(ball(r * 0.65, lm2, { low: true, at: [x + 0.02, cy + r * 1.2, z], shadow: false }));
    } else {
      g.add(ball(r, lm, { low: true, at: [x, cy, z], shadow: true }));
      g.add(ball(r * 0.75, lm2, { low: true, at: [x + r * 0.45, cy + r * 0.35, z + r * 0.35] }));
    }
    if (st < 3) continue;
    const n = st === 4 ? (shape === 'pepper' ? 4 : tallBush ? 7 : 8) : 4;
    const fm = st === 4 ? ripe : green;
    for (let i = 0; i < n; i++) {
      const p = onSphere(R, x, cy, z, tallBush ? r * 1.15 : r * 1.0, tallBush ? -0.6 : -0.3, 0.6);
      if (shape === 'pepper') {
        const pr = st === 4 ? 0.04 : 0.032;
        const pp = onSphere(R, x, cy, z, r * 1.05, -0.5, 0.2);
        g.add(orient(caps(pr, pr * 2.2, fm), pp[0], pp[1] + 0.03, pp[2], R() * TAU, Math.PI - 0.25, pr * 4.2));
        if (i >= 3) break;
      } else if (shape === 'pod') {
        g.add(orient(caps(0.024, 0.065, fm), p[0], p[1] + 0.01, p[2], R() * TAU, 2.6, 0.113));
      } else {
        const br = (tallBush ? 0.028 : 0.034) * (st === 4 ? 1 : 0.8);
        g.add(ball(br, fm, { at: p, shadow: false, ws: 8, hs: 6 }));
      }
    }
  }
}

function staked(g, R, look, st) {
  const s = [0, 0, 0.65, 0.9, 1.05][st];
  const H = 0.68;
  const lm = leafMat(look.leaf);
  const lm2 = leafMat(mix(look.leaf, PAL.leafDark, 0.25));
  const stake = M(PAL.woodLight);
  const ripe = juicy(look.fruit);
  const mid = M(mix(look.fruit, '#ffb300', 0.55), { sway: 0.015 });
  const green = M(UNRIPE, { sway: 0.015 });
  for (const [x, z] of spots(4, R)) {
    g.add(mesh(GEO.rbox(0.035, H, 0.035, 0.012), stake, { at: [x - 0.05, H / 2, z - 0.05] }));
    for (let i = 0; i < 3; i++) {
      const y = (0.12 + i * 0.17) * s + 0.05;
      g.add(ball((0.12 - i * 0.015) * s, i % 2 ? lm2 : lm, { low: true, at: [x + (i % 2 ? 0.04 : -0.02), y, z + (i % 2 ? -0.02 : 0.04)], shadow: i === 0 }));
    }
    if (st < 3) continue;
    const n = st === 4 ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const p = onSphere(R, x, 0.12 + (i % 3) * 0.12 * s, z, 0.12 * s, -0.4, 0.3);
      const fm = st === 3 ? green : i === 4 ? mid : ripe;
      const r = st === 4 ? 0.055 : 0.04;
      g.add(ellip(r, r * 0.88, r, fm, p[0], p[1], p[2]));
    }
  }
}

function cane(g, R, look, st) {
  const H = [0, 0, 0.36, 0.66, 0.9][st];
  const lm = leafMat(mix(look.leaf, PAL.leaf, 0.2));
  const c1 = st === 4 ? M(look.fruit, { sway: 0.015 }) : M(mix(look.leaf, look.fruit, 0.4), { sway: 0.015 });
  const c2 = st === 4 ? M(mix(look.fruit, '#8d9f3a', 0.45), { sway: 0.015 }) : M(mix(look.leaf, '#558b2f', 0.3), { sway: 0.015 });
  for (const [x, z] of spots(4, R)) {
    const yaw0 = R() * TAU;
    for (let i = 0; i < 3; i++) {
      const a = yaw0 + i * 2.1;
      const cx = x + Math.sin(a) * 0.05, cz = z + Math.cos(a) * 0.05;
      const h = H * (0.85 + R() * 0.25);
      g.add(orient(rod(0.026, 0.03, h * 0.5, c2, { seg: 7 }), cx, 0, cz, 0, 0, h * 0.5));
      g.add(orient(rod(0.024, 0.027, h * 0.48, c1, { seg: 7 }), cx, h * 0.52, cz, 0, 0, h * 0.48));
      g.add(leaf(0.3 * Math.max(0.65, H), 0.06, lm, cx, h * 0.92, cz, a, 0.5, 0.012));
    }
  }
}

function sunflower(g, R, look, st) {
  const H = [0, 0, 0.36, 0.72, 0.95][st];
  const lm = leafMat(look.leaf);
  const stem = leafMat(mix(look.leaf, '#9ccc65', 0.3));
  const petal = juicy(look.fruit);
  const petal2 = M(mix(look.fruit, '#ff8f00', 0.4), { sway: 0.015 });
  const centre = M('#5d3a1a', { sway: 0.015 });
  const bud = M(mix(look.leaf, '#cddc39', 0.3), { sway: 0.015 });
  for (const [x, z] of spots(4, R)) {
    const h = H * (0.92 + R() * 0.14);
    const yaw0 = R() * TAU;
    g.add(orient(rod(0.022, 0.032, h, stem, { shadow: true }), x, 0, z, 0, 0, h));
    g.add(leaf(0.2, 0.14, lm, x, h * 0.35, z, yaw0, 0.15, 0.015));
    g.add(leaf(0.18, 0.13, lm, x, h * 0.6, z, yaw0 + 2.6, 0.2, 0.015));
    if (st === 2) { g.add(leaf(0.14, 0.1, lm, x, h * 0.9, z, yaw0 + 1.3, 0.4, 0.015)); continue; }
    if (st === 3) { g.add(ball(0.065, bud, { at: [x, h + 0.03, z], ws: 10, hs: 8 })); continue; }
    // big open head facing the camera (+x +z), tipped slightly upwards
    const head = group(
      mesh(GEO.cyl(0.16, 0.16, 0.02, 9), petal, { shadow: true }),
      mesh(GEO.cyl(0.15, 0.15, 0.02, 9), petal2, { at: [0, -0.012, 0], rot: [0, Math.PI / 9, 0], shadow: false }),
      mesh(GEO.cyl(0.09, 0.1, 0.05, 14), centre, { at: [0, 0.012, 0], shadow: false }),
    );
    head.rotation.order = 'YXZ';
    head.rotation.set(1.05, Math.PI / 4 + (R() - 0.5) * 0.7, 0);
    head.position.set(x, h + 0.02, z);
    g.add(head);
  }
}

function rose(g, R, look, st) {
  const s = [0, 0, 0.7, 0.92, 1.05][st];
  const lm = leafMat(look.leaf);
  const lm2 = leafMat(mix(look.leaf, PAL.leafLight, 0.15));
  const petal = juicy(look.fruit);
  const heart = M(mix(look.fruit, '#880e4f', 0.4), { sway: 0.015 });
  const bud = M(mix(look.fruit, look.leaf, 0.45), { sway: 0.015 });
  for (const [x, z] of spots(4, R)) {
    const r = 0.14 * s;
    g.add(ellip(r, r * 1.2, r, lm, x, r * 1.15, z, { low: true, shadow: true }));
    g.add(ball(r * 0.7, lm2, { low: true, at: [x + r * 0.4, r * 1.9, z + r * 0.3] }));
    if (st < 3) continue;
    for (let i = 0; i < 3; i++) {
      const p = onSphere(R, x, r * 1.3, z, r * 1.1, 0.1, 0.8);
      if (st === 3) { g.add(ellip(0.03, 0.045, 0.03, bud, p[0], p[1] + 0.02, p[2])); continue; }
      g.add(ellip(0.06, 0.05, 0.06, petal, p[0], p[1] + 0.02, p[2]));
      g.add(ellip(0.035, 0.03, 0.035, heart, p[0] + 0.005, p[1] + 0.055, p[2] + 0.005));
    }
  }
}

function berry(g, R, look, st) {
  const s = [0, 0, 0.75, 0.95, 1.05][st];
  const lm = leafMat(look.leaf);
  const ripe = juicy(look.fruit, 0);
  const green = M('#c5e1a5');
  const flower = M('#ffffff', { sway: 0.01 });
  const eye = M(PAL.gold);
  for (const [x, z] of spots(4, R)) {
    const yaw0 = R() * TAU;
    for (let i = 0; i < 3; i++) g.add(leaf(0.21 * s, 0.17 * s, lm, x, 0.04, z, yaw0 + i * 2.1, 0.5, 0.022));
    if (st < 3) continue;
    const nb = st === 4 ? 3 : 1;
    for (let i = 0; i < nb; i++) {
      const a = Math.PI / 4 + (i - 1) * 1.1 + (R() - 0.5) * 0.4;
      const d = 0.15 * s;
      const r = st === 4 ? 0.058 : 0.035;
      const c = mesh(GEO.cone(r, r * 2, 9), st === 4 ? ripe : green, { shadow: false });
      c.rotation.x = Math.PI;
      c.position.set(x + Math.sin(a) * d, r + 0.005, z + Math.cos(a) * d);
      g.add(c);
      if (st === 4) g.add(ellip(r * 0.8, r * 0.25, r * 0.8, lm, c.position.x, r * 2 + 0.005, c.position.z));
    }
    const nf = st === 4 ? 0 : 2;
    for (let i = 0; i < nf; i++) {
      const a = yaw0 + 1 + i * 2.5;
      const px = x + Math.sin(a) * 0.05, pz = z + Math.cos(a) * 0.05;
      g.add(ellip(0.035, 0.012, 0.035, flower, px, 0.13 * s, pz));
      g.add(ball(0.012, eye, { at: [px, 0.142 * s, pz], shadow: false, ws: 6, hs: 4 }));
    }
  }
}

function puff(g, R, look, st) {
  const s = [0, 0, 0.7, 0.92, 1.05][st];
  const lm = leafMat(st === 4 ? mix(look.leaf, '#8d6e63', 0.35) : look.leaf);
  const stem = M('#7a5a3a', { sway: 0.015 });
  const white = M(look.fruit, { sway: 0.015, flat: true, emissive: '#3a3a3a' });
  const boll = M(mix(look.leaf, '#cddc39', 0.3), { sway: 0.015 });
  const husk = M('#6d4c2f', { sway: 0.015 });
  for (const [x, z] of spots(4, R)) {
    const h = 0.42 * s;
    g.add(orient(rod(0.015, 0.022, h, stem), x, 0, z, 0, 0, h));
    g.add(ball(0.11 * s, lm, { low: true, at: [x, h * 0.45, z], shadow: true }));
    g.add(ball(0.09 * s, lm, { low: true, at: [x - 0.03, h * 0.75, z - 0.03] }));
    if (st < 3) continue;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i - 1.5) * 1.3;
      const d = i === 3 ? 0.02 : 0.08 * s;
      const p = [x + Math.sin(a) * d, h * (i === 3 ? 1.02 : 0.55 + i * 0.12), z + Math.cos(a) * d];
      if (st === 3) { g.add(ellip(0.035, 0.045, 0.035, boll, ...p)); continue; }
      g.add(ball(0.064, white, { low: true, at: p, shadow: i === 3 }));
      if (i < 2) g.add(ellip(0.04, 0.02, 0.04, husk, p[0], p[1] - 0.05, p[2]));
    }
  }
}

function headCrop(g, R, look, st, id) {
  const s = [0, 0, 0.65, 0.88, 1.05][st];
  if (look.curly || id === 'kale') {
    // ruffled, faceted leaf fountains
    const lm = leafMat(look.leaf, { flat: true });
    const lm2 = leafMat(mix(look.leaf, look.fruit, 0.6), { flat: true });
    const rib = leafMat('#9ccc65');
    for (const [x, z] of spots(4, R)) {
      const yaw0 = R() * TAU;
      for (let i = 0; i < 6; i++) {
        const yaw = yaw0 + i * 1.05;
        const tilt = i % 2 ? 0.75 : 0.35;
        const L = (i % 2 ? 0.2 : 0.25) * s;
        const m = mesh(GEO.ico(1, 1), i % 2 ? lm2 : lm, { scale: [0.075 * s, L / 2, 0.035 * s], shadow: i === 0 });
        orient(m, x, 0, z, yaw, tilt, L);
        g.add(m);
      }
      g.add(ball(0.05 * s, rib, { low: true, at: [x, 0.05 * s, z], shadow: false }));
    }
    return;
  }
  const lm = leafMat(look.leaf);
  const head = st === 4 ? M(look.fruit, { emissive: mix('#000000', look.fruit, 0.18) }) : M(mix(look.fruit, look.leaf, 0.4));
  const wrap = leafMat(mix(look.leaf, look.fruit, 0.5));
  for (const [x, z] of spots(4, R)) {
    const yaw0 = R() * TAU;
    for (let i = 0; i < 4; i++) g.add(leaf(0.22 * s, 0.17 * s, lm, x, 0.02, z, yaw0 + i * 1.57, 0.35, 0.02));
    if (st < 3) { g.add(ball(0.05 * s, wrap, { at: [x, 0.05, z], ws: 8, hs: 6 })); continue; }
    const r = st === 4 ? 0.12 : 0.085;
    g.add(ellip(r, r * 0.9, r, head, x, r * 0.85, z, { shadow: true }));
    g.add(ellip(r * 1.04, r * 0.6, r * 0.8, wrap, x + 0.02, r * 0.6, z + 0.02));
  }
}

function pumpkinFruit(g, r, mat, x, z, yaw) {
  const p = group();
  for (let i = 0; i < 5; i++) {
    const a = (i * TAU) / 5;
    p.add(ellip(r * 0.55, r * 0.8, r * 0.75, mat, Math.sin(a) * r * 0.42, 0, Math.cos(a) * r * 0.42, { shadow: i === 0 }));
    p.children[i].rotation.y = a;
  }
  p.add(orient(rod(r * 0.1, r * 0.14, r * 0.45, M('#6d7c2f')), 0, r * 0.62, 0, yaw, 0.35, r * 0.45));
  p.position.set(x, r * 0.7, z);
  p.rotation.y = yaw;
  g.add(p);
}

function melonFruit(g, r, light, dark, x, z, yaw) {
  const p = group(ellip(r * 1.3, r * 0.95, r * 0.95, light, 0, 0, 0, { shadow: true }));
  for (let i = 0; i < 4; i++) {
    const s = ellip(r * 1.315, r * 0.975, r * 0.2, dark, 0, 0, 0);
    s.rotation.x = (i * Math.PI) / 4;
    p.add(s);
  }
  p.position.set(x, r * 0.8, z);
  p.rotation.y = yaw;
  g.add(p);
}

function vine(g, R, look, st, id) {
  const s = [0, 0, 0.75, 0.95, 1.05][st];
  const lm = leafMat(look.leaf);
  const lm2 = leafMat(mix(look.leaf, PAL.leafLight, 0.2));
  const vineM = leafMat(mix(look.leaf, '#9ccc65', 0.3));
  const melon = look.striped || id === 'watermelon';
  // vines snaking across the bed
  for (const [a, x, z] of [[0.5, -0.05, -0.15], [-0.7, 0.05, 0.12]]) {
    const v = caps(0.018, 0.62 * s, vineM);
    v.rotation.order = 'YXZ'; v.rotation.set(Math.PI / 2, a, 0);
    v.position.set(x, 0.02, z);
    g.add(v);
  }
  const leaves = [[-0.28, -0.25], [0.25, -0.28], [-0.3, 0.2], [0.05, -0.05], [0.3, 0.05], [-0.05, 0.3]];
  leaves.forEach(([x, z], i) => {
    const m = ellip(0.13 * s, 0.03, 0.12 * s, i % 2 ? lm2 : lm, x, 0.07 + (i % 3) * 0.03, z, { shadow: i < 2 });
    m.rotation.set((R() - 0.5) * 0.5, R() * TAU, (R() - 0.5) * 0.5);
    g.add(m);
  });
  if (st === 2) {
    const fl = M('#ffd54f', { sway: 0.01 });
    g.add(ball(0.035, fl, { at: [0.12, 0.08, 0.2], shadow: false, ws: 8, hs: 6 }));
    g.add(ball(0.035, fl, { at: [-0.18, 0.08, -0.02], shadow: false, ws: 8, hs: 6 }));
    return;
  }
  if (melon) {
    const light = st === 4 ? M(mix(look.fruit, '#aed581', 0.65)) : M('#c5e1a5');
    const dark = st === 4 ? M(look.fruit, { emissive: mix('#000000', look.fruit, 0.2) }) : M('#8bc34a');
    if (st === 3) melonFruit(g, 0.14, light, dark, 0.08, 0.1, 0.6);
    else { melonFruit(g, 0.23, light, dark, -0.04, 0.12, 0.7); melonFruit(g, 0.15, light, dark, 0.26, -0.2, -0.4); }
  } else {
    const fm = st === 4 ? juicy(look.fruit, 0) : M(mix(look.fruit, UNRIPE, 0.7));
    if (st === 3) pumpkinFruit(g, 0.14, fm, 0.08, 0.1, 0.3);
    else { pumpkinFruit(g, 0.25, fm, -0.06, 0.1, 0.3); pumpkinFruit(g, 0.15, fm, 0.27, -0.2, 1.1); }
  }
}

function bulb(g, R, look, st, id) {
  const garlic = id === 'garlic';
  const s = [0, 0, 0.75, 0.95, 1.05][st];
  const lm = leafMat(st === 4 && !garlic ? mix(look.leaf, '#c9b458', 0.3) : look.leaf);
  const bm = st === 4 ? M(look.fruit, { emissive: mix('#000000', look.fruit, 0.15) }) : M(mix(look.fruit, '#f1f8e9', 0.5));
  const tip = M(garlic ? '#d1c4e9' : mix(look.fruit, '#8d6e63', 0.4));
  for (const [x, z] of spots(6, R)) {
    const yaw0 = R() * TAU;
    for (let i = 0; i < 3; i++) {
      const L = (0.24 + R() * 0.07) * s * (garlic ? 0.95 : 1.05);
      const tilt = (st === 4 && !garlic ? 0.45 : 0.18) + i * 0.12;
      const m = garlic ? thin(0.022, L, lm, { seg: 4 }) : rod(0.006, 0.016, L, lm, { seg: 5 });
      g.add(orient(m, x, 0.03, z, yaw0 + i * 2.1, tilt, L));
    }
    if (st < 3) continue;
    const r = st === 4 ? 0.085 : 0.05;
    g.add(ellip(r, r * (garlic ? 0.85 : 0.9), r, bm, x + 0.01, r * 0.45, z + 0.01, { shadow: st === 4 }));
    g.add(orient(thin(r * 0.35, r * 0.7, tip, { seg: 6 }), x + 0.01, r * 1.15, z + 0.01, 0, 0, r * 0.7));
  }
}

function spike(g, R, look, st) {
  const s = [0, 0, 0.7, 0.9, 1.05][st];
  const lm = leafMat(look.leaf);
  const stems = leafMat(mix(look.leaf, '#9e9d24', 0.15));
  const flower = st === 4 ? juicy(look.fruit, 0.02) : M(mix(look.fruit, look.leaf, 0.55), { sway: 0.02 });
  for (const [x, z] of spots(4, R)) {
    const r = 0.13 * s;
    g.add(ellip(r * 1.15, r * 0.85, r * 1.15, lm, x, r * 0.6, z, { low: true, shadow: true }));
    if (st < 3) { g.add(ball(r * 0.6, stems, { low: true, at: [x + 0.03, r * 1.1, z + 0.02] })); continue; }
    const yaw0 = R() * TAU;
    for (let i = 0; i < 4; i++) {
      const yaw = yaw0 + (i * TAU) / 4;
      const tilt = 0.18 + (i % 2) * 0.2;
      const sl = (st === 4 ? 0.16 : 0.12) * (0.85 + R() * 0.3);
      const bx = x + Math.sin(yaw) * r * 0.3, bz = z + Math.cos(yaw) * r * 0.3, by = r * 0.9;
      g.add(orient(rod(0.008, 0.01, sl, stems, { seg: 4 }), bx, by, bz, yaw, tilt, sl));
      const len = st === 4 ? 0.1 : 0.07;
      const rr = st === 4 ? 0.03 : 0.022;
      const tx = bx + Math.sin(yaw) * Math.sin(tilt) * sl, ty = by + Math.cos(tilt) * sl, tz = bz + Math.cos(yaw) * Math.sin(tilt) * sl;
      g.add(orient(caps(rr, len, flower), tx, ty - rr, tz, yaw, tilt, len + rr * 2));
    }
  }
}

const ARCH = {
  grain, root, tall, bush, staked, cane, berry, puff, vine, bulb, spike, head: headCrop,
  flower: (g, R, look, st, id) => (look.rose || id === 'rose' ? rose : sunflower)(g, R, look, st, id),
};

/** Build a crop model for CROPS[id] at growth stage 0..4. Origin is the plot top. */
export function buildCrop(id, look, stage) {
  const g = group();
  const R = rng(hash(id));
  const st = Math.max(0, Math.min(4, stage | 0));
  if (st === 0) sown(g, R, look);
  else if (st === 1) sprouts(g, R, look);
  else (ARCH[look.type] || bush)(g, R, look, st, id);
  g.userData.state = { crop: id, stage: st };
  return g;
}
