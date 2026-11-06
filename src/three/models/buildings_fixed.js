// Fixed landmarks (farmhouse, storage barn, order board, truck pad, market stall, river dock,
// fishing pier), the delivery truck, the river barge and the farm-expansion signpost.
import {
  PAL, M, leafMat, box, cyl, cone, ball, mesh, group, place, GEO,
  shade, tiny, pad, body, roofX, roofZ, win, doorway, timberWall, beams, chimney, makeSmoke,
  plaque, flowerBox, lantern, pennant, ICON, barrel, crate, bush,
} from './buildings_kit.js';

const HALF_PI = Math.PI / 2;

// ------------------------------------------------------------------ local helpers
/** Row of planks along x (each plank spans `len` along x), laid side by side along z. */
function plankDeck(x0, x1, z0, z1, y, { plank = 0.22, color = PAL.plank, alongZ = false, thick = 0.07 } = {}) {
  const g = group();
  const span = alongZ ? x1 - x0 : z1 - z0;
  const n = Math.max(1, Math.round(span / plank));
  const step = span / n;
  for (let i = 0; i < n; i++) {
    const c = i % 3 === 1 ? shade(color, 0.9) : i % 3 === 2 ? shade(color, 1.06) : color;
    if (alongZ) g.add(place(box(step - 0.025, thick, z1 - z0, c, { r: 0.015 }), x0 + step * (i + 0.5), y, (z0 + z1) / 2));
    else g.add(place(box(x1 - x0, thick, step - 0.025, c, { r: 0.015 }), (x0 + x1) / 2, y, z0 + step * (i + 0.5)));
  }
  return g;
}

/** Wooden post from y0 up to y1. */
const post = (x, z, y0, y1, r = 0.07, c = PAL.woodDark) => place(cyl(r, r * 1.05, y1 - y0, c, { seg: 8 }), x, (y0 + y1) / 2, z);

/** Hay bale lying along x. */
function hayBale(len = 0.42) {
  const g = group();
  const b = cyl(0.16, 0.16, len, '#e8c45a', { seg: 12 }); b.rotation.z = HALF_PI; b.position.y = 0.16; g.add(b);
  for (const s of [-1, 1]) { const e = cyl(0.13, 0.13, 0.012, '#d4a93e', { seg: 12, shadow: false }); e.rotation.z = HALF_PI; e.position.set(s * len / 2, 0.16, 0); g.add(e); }
  return g;
}

/** Small flower clump. */
function flowers(colors = ['#ff6fa3', '#ffd54a', '#ffffff']) {
  const g = group(place(ball(0.11, leafMat(PAL.leafDark), { low: true }), 0, 0.08, 0));
  colors.forEach((c, i) => g.add(place(ball(0.04, M(c, { sway: 0.015 }), { low: true, shadow: false }), Math.cos(i * 2.1) * 0.08, 0.17, Math.sin(i * 2.1) * 0.08)));
  return g;
}

/** Striped awning slab: n stripes alternating colours, tilted down to the front (+z). */
function stripedAwning(w, d, n, c1, c2, tilt = 0.35) {
  const g = group();
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    const c = i % 2 ? c2 : c1;
    g.add(place(box(sw + 0.002, 0.04, d, c, { r: 0.012 }), -w / 2 + sw * (i + 0.5), 0, 0));
    // scalloped valance
    const sc = place(ball(sw * 0.5, c, { ws: 10, hs: 6, shadow: false }), -w / 2 + sw * (i + 0.5), -0.02, d / 2); sc.scale.set(1, 0.6, 0.35); g.add(sc);
  }
  g.rotation.x = tilt;
  return g;
}

// ------------------------------------------------------------------ farmhouse (3x3)
function makeHouse() {
  const g = group();
  g.add(pad(2.85, 2.85, '#d9c9a0'));
  const W = 2.1, D = 1.5, H = 1.55, Z = -0.3;
  // body: stone ground floor band + cream walls
  const b = body(W, H, D, PAL.wall, { ph: 0.22 }); b.position.z = Z; g.add(b);
  // upper storey timber framing on front and right side
  const front = Z + D / 2 + 0.005;
  g.add(timberWall(W, 0.82, H - 0.03, front, PAL.woodDark, { posts: 5 }));
  g.add(place(box(W + 0.06, 0.07, D + 0.06, PAL.woodDark, { r: 0.02 }), 0, 0.82, Z));
  const side = timberWall(D, 0.82, H - 0.03, 0, PAL.woodDark, { posts: 3 });
  side.rotation.y = HALF_PI; side.position.set(W / 2 + 0.005, 0, Z); g.add(side);
  // roof (ridge along x) + chimney
  const roof = roofX(W, D, 0.85, PAL.roofRed, { rows: 4 }); roof.position.set(0, H, Z); g.add(roof);
  const ch = chimney(0.75, PAL.brick, 0.26); ch.position.set(0.62, H + 0.35, Z - 0.25); g.add(ch);
  const smoke = makeSmoke(0.62, H + 1.15, Z - 0.25, { n: 4, size: 0.1, rise: 0.9 }); g.add(smoke.group);
  // dormer window in the front roof slope
  const dorm = group();
  dorm.add(place(box(0.5, 0.42, 0.5, PAL.wall, { r: 0.03 }), 0, 0.21, 0));
  const dr = roofZ(0.5, 0.56, 0.24, PAL.roofRed, { rows: 1, over: 0.06 }); dr.position.y = 0.42; dorm.add(dr);
  dorm.add(win(0, 0.22, 0.26, 0, { w: 0.24, h: 0.24 }));
  dorm.position.set(-0.45, H + 0.12, Z + 0.32); g.add(dorm);
  // ground floor: door + windows
  g.add(doorway(0.05, front, 0, { w: 0.38, h: 0.62, color: '#3f7cc4' }));
  for (const x of [-0.65, 0.68]) g.add(win(x, 0.55, front + 0.01, 0, { shutter: '#3f7cc4', w: 0.3, h: 0.3 }));
  for (const x of [-0.6, 0.6]) g.add(win(x, 1.2, front + 0.02, 0, { w: 0.28, h: 0.28, frame: PAL.cream }));
  g.add(win(W / 2 + 0.01, 0.55, Z, HALF_PI, { shutter: '#3f7cc4', w: 0.3, h: 0.3 }));
  g.add(win(W / 2 + 0.02, 1.2, Z, HALF_PI, { w: 0.28, h: 0.28, frame: PAL.cream }));
  // flower boxes under the windows
  for (const x of [-0.65, 0.68]) g.add(place(flowerBox(0.38), x, 0.33, front + 0.07));
  g.add(place(flowerBox(0.38), W / 2 + 0.07, 0.33, Z, HALF_PI));
  // porch: deck, posts, little lean-to roof
  const pz0 = front, pz1 = front + 0.6;
  g.add(plankDeck(-0.55, 0.65, pz0, pz1, 0.1, { alongZ: true, plank: 0.2, thick: 0.08 }));
  for (const x of [-0.5, 0.6]) g.add(post(x, pz1 - 0.06, 0.12, 0.98, 0.045, PAL.wood));
  const pr = group();
  pr.add(place(box(1.45, 0.06, 0.78, PAL.roofRedDark, { r: 0.02 }), 0, 0, 0));
  for (const z of [-0.15, 0.15]) pr.add(place(box(1.47, 0.035, 0.05, shade(PAL.roofRedDark, 0.85), tiny), 0, 0.04, z));
  pr.position.set(0.05, 1.02, (pz0 + pz1) / 2 + 0.02); pr.rotation.x = 0.28; g.add(pr);
  // railing on the porch sides
  for (const x of [-0.55, 0.65]) g.add(place(box(0.04, 0.04, 0.55, PAL.woodLight, tiny), x, 0.42, (pz0 + pz1) / 2));
  // lantern by the door + bench
  const l = lantern(); l.position.set(-0.32, 0.86, front + 0.06); g.add(l);
  g.add(place(box(0.42, 0.05, 0.16, PAL.wood, { r: 0.015 }), -0.95, 0.24, front + 0.2));
  for (const x of [-1.12, -0.78]) g.add(place(box(0.05, 0.22, 0.12, PAL.woodDark, tiny), x, 0.11, front + 0.2));
  // garden: path, flowers, bushes, mailbox
  g.add(place(cyl(0.12, 0.12, 0.03, PAL.stone, { seg: 8, shadow: false }), 0.05, 0.04, pz1 + 0.2));
  g.add(place(flowers(), -1.15, 0, 1.15));
  g.add(place(flowers(['#c36ae0', '#ff8a3d', '#ffd54a']), 1.15, 0, 0.75));
  g.add(place(bush(0.2), -1.25, 0, -0.95));
  g.add(place(bush(0.17, PAL.leafLight), 1.12, 0, -1.2));
  const mb = group(post(0, 0, 0, 0.5, 0.03, PAL.wood));
  mb.add(place(box(0.14, 0.13, 0.24, '#d9483b', { r: 0.04 }), 0, 0.55, 0));
  mb.add(place(box(0.02, 0.1, 0.05, PAL.gold, tiny), 0.08, 0.62, -0.05));
  mb.position.set(0.85, 0, 1.25); g.add(mb);
  g.add(place(pennant(0.5, '#3f7cc4'), -W / 2 + 0.05, H + 0.02, Z + D / 2 - 0.05));
  g.userData.anim = (t) => smoke.update(t, true, 0.3);
  return g;
}

// ------------------------------------------------------------------ storage barn (3x3)
function makeBarn() {
  const g = group();
  g.add(pad(2.85, 2.85, '#d8c79c'));
  const W = 2.2, D = 2.0, H = 1.35, Z = -0.24;
  const red = '#c9402f', white = '#fff8ec';
  const b = body(W, H, D, red, { ph: 0.16 }); b.position.z = Z; g.add(b);
  // white corner trims
  for (const x of [-1, 1]) for (const z of [-1, 1]) g.add(place(box(0.08, H, 0.08, white, { r: 0.02, shadow: false }), x * W / 2, H / 2, Z + z * D / 2));
  g.add(place(box(W + 0.04, 0.08, D + 0.04, white, { r: 0.02 }), 0, H, Z));
  // vertical board grooves on front
  const front = Z + D / 2 + 0.005;
  for (let i = 0; i < 9; i++) { const x = -W / 2 + 0.2 + i * 0.225; if (Math.abs(x) > 0.5) g.add(place(box(0.025, H - 0.25, 0.02, shade(red, 0.8), tiny), x, H / 2 + 0.08, front)); }
  // roof with the gable facing the front, red gable + white trim
  const roof = roofZ(W, D, 1.0, '#6d6a75', { rows: 4, gable: red, over: 0.16 }); roof.position.set(0, H, Z); g.add(roof);
  // gable trim (white fascia along the two front edges)
  const half = W / 2 + 0.16, ang = Math.atan2(1.0, half), len = Math.hypot(half, 1.0);
  for (const s of [-1, 1]) {
    const f = box(len, 0.08, 0.06, white, { r: 0.02 }); f.position.set(s * half / 2, H + 0.5, front + 0.17); f.rotation.z = -s * ang; g.add(f);
  }
  // big double doors with white X bracing
  const dw = 0.5, dh = 0.95;
  for (const s of [-1, 1]) {
    const d = group();
    d.add(place(box(dw, dh, 0.06, '#a8322a', { r: 0.02 }), 0, 0, 0));
    d.add(place(box(dw, 0.06, 0.08, white, tiny), 0, dh / 2 - 0.03, 0));
    d.add(place(box(dw, 0.06, 0.08, white, tiny), 0, -dh / 2 + 0.03, 0));
    d.add(place(box(0.06, dh, 0.08, white, tiny), s * (dw / 2 - 0.03), 0, 0));
    d.add(place(box(0.06, dh, 0.08, white, tiny), -s * (dw / 2 - 0.03), 0, 0));
    const diag = Math.hypot(dw, dh) - 0.08;
    for (const r of [1, -1]) d.add(place(box(0.06, diag, 0.075, white, tiny), 0, 0, 0, 0).rotateZ(r * Math.atan2(dw, dh)));
    d.position.set(s * dw / 2, 0.16 + dh / 2, front + 0.03); g.add(d);
  }
  g.add(place(box(dw * 2 + 0.16, 0.08, 0.08, white, { r: 0.02 }), 0, 0.16 + dh + 0.06, front + 0.04));
  // hay loft door in the gable with hay poking out + hoist beam
  g.add(place(box(0.48, 0.42, 0.06, white, { r: 0.02 }), 0, H + 0.32, front + 0.02));
  g.add(place(box(0.4, 0.34, 0.07, '#5b3a22', { r: 0.02 }), 0, H + 0.32, front + 0.03));
  const hay = M('#f0cf63', { sway: 0.01 });
  for (let i = 0; i < 5; i++) g.add(place(ball(0.08, hay, { low: true, shadow: false }), -0.13 + i * 0.065, H + 0.2 + (i % 2) * 0.04, front + 0.07));
  g.add(place(box(0.08, 0.08, 0.5, PAL.woodDark, { r: 0.02 }), 0, H + 0.72, front + 0.2));
  g.add(place(cyl(0.008, 0.008, 0.35, '#8a7a5a', { seg: 4, shadow: false }), 0, H + 0.52, front + 0.42));
  g.add(place(mesh(GEO.torus(0.04, 0.012, 6, 10), M('#555555'), tiny), 0, H + 0.33, front + 0.42));
  // round vent / storage pictogram above loft: a crate icon plaque
  const pl = plaque(ICON.sack('#f2c14e'), { r: 0.17, board: white }); pl.position.set(0, H + 0.78, front + 0.04); g.add(pl);
  // side window + cupola on the ridge
  g.add(win(W / 2 + 0.01, 0.75, Z - 0.2, HALF_PI, { frame: white, w: 0.34, h: 0.34 }));
  const cup = group();
  cup.add(place(box(0.34, 0.3, 0.34, white, { r: 0.03 }), 0, 0.15, 0));
  for (const s of [-1, 1]) cup.add(place(box(0.2, 0.18, 0.02, '#5b3a22', tiny), 0, 0.16, s * 0.17));
  const cr = roofZ(0.34, 0.34, 0.22, '#6d6a75', { rows: 1, over: 0.06, gable: white }); cr.position.y = 0.3; cup.add(cr);
  cup.add(place(cyl(0.012, 0.012, 0.3, '#444', { seg: 4, shadow: false }), 0, 0.65, 0));
  cup.add(place(cone(0.05, 0.1, PAL.gold, { seg: 4, shadow: false }), 0.06, 0.72, 0, 0).rotateZ(-HALF_PI));
  cup.position.set(0, H + 0.95, Z); g.add(cup);
  // hay bales, pitchfork, barrel
  g.add(place(hayBale(), 1.1, 0, 0.95, 0.3));
  g.add(place(hayBale(), 1.15, 0, 0.55, -0.1));
  g.add(place(hayBale(), 1.12, 0.3, 0.75, 0.1));
  g.add(place(hayBale(0.38), -1.15, 0, 1.0, HALF_PI));
  g.add(place(barrel(0.32, 0.12), -0.95, 0, 1.2));
  const pf = group(place(cyl(0.015, 0.015, 0.9, PAL.woodLight, { seg: 5, shadow: false }), 0, 0.45, 0));
  for (const x of [-0.04, 0, 0.04]) pf.add(place(cyl(0.008, 0.008, 0.16, '#9aa0a6', { seg: 4, shadow: false }), x, 0.97, 0));
  pf.add(place(box(0.1, 0.02, 0.02, '#9aa0a6', tiny), 0, 0.89, 0));
  pf.position.set(0.72, 0, front + 0.07); pf.rotation.z = -0.25; g.add(pf);
  g.add(place(lantern(), -0.62, 1.1, front + 0.05));
  return g;
}

// ------------------------------------------------------------------ order board (2x2)
function makeBoard() {
  const g = group();
  g.add(place(box(1.8, 0.05, 1.2, '#d8c79c', { r: 0.025, shadow: false }), 0, 0.025, 0.1));
  const BW = 1.5, BH = 0.85, BY = 0.95;
  for (const s of [-1, 1]) {
    g.add(post(s * (BW / 2 + 0.05), 0, 0, 1.72, 0.065));
    g.add(place(box(0.2, 0.08, 0.2, PAL.stone, { r: 0.03 }), s * (BW / 2 + 0.05), 0.04, 0));
  }
  // board: frame + cork-ish panel
  g.add(place(box(BW + 0.08, BH + 0.08, 0.08, PAL.woodDark, { r: 0.03 }), 0, BY, 0));
  g.add(place(box(BW - 0.04, BH - 0.04, 0.09, '#d9a066', { r: 0.02, shadow: false }), 0, BY, 0));
  // little roof
  const roof = roofX(BW + 0.2, 0.36, 0.22, PAL.roofGreen, { rows: 1, over: 0.06, gable: PAL.woodDark }); roof.position.set(0, BY + BH / 2 + 0.06, 0); g.add(roof);
  // pinned notes
  const notes = [
    [-0.5, 0.18, '#fffdf5', '#e53935', 0.08], [-0.12, 0.22, '#fff59d', '#3f7cc4', -0.06], [0.3, 0.16, '#ffffff', '#43a047', 0.1],
    [-0.42, -0.2, '#ffe0b2', '#8e24aa', -0.1], [0.0, -0.17, '#fffdf5', '#ffb300', 0.04], [0.45, -0.18, '#c8e6c9', '#e53935', -0.05],
  ];
  for (const [x, y, c, pin, r] of notes) {
    const n = group();
    n.add(box(0.28, 0.32, 0.015, c, tiny));
    for (let i = 0; i < 3; i++) n.add(place(box(0.18 - i * 0.03, 0.02, 0.018, '#9e9e9e', tiny), -0.02, 0.06 - i * 0.06, 0.003));
    n.add(place(ball(0.03, pin, tiny), 0, 0.13, 0.02));
    n.position.set(x, BY + y, 0.055); n.rotation.z = r; g.add(n);
  }
  // crate + bucket of paint, flowers at the posts
  g.add(place(crate(0.24), 0.62, 0, 0.45, 0.3));
  g.add(place(flowers(), -0.85, 0, 0.35));
  g.add(place(flowers(['#ff8a3d', '#ffffff', '#c36ae0']), 0.85, 0, -0.3));
  // little lantern hanging under the roof
  g.add(place(lantern(), -BW / 2 + 0.05, BY + BH / 2 - 0.05, 0.12));
  return g;
}

// ------------------------------------------------------------------ delivery truck
export function makeTruck() {
  const t = group();
  t.name = 'truck';
  const body_ = '#3f9be0', trim = '#ffffff', dark = '#2b2b2b';
  const inner = group(); t.add(inner);
  // chassis
  inner.add(place(box(0.95, 0.14, 1.9, '#555b61', { r: 0.04 }), 0, 0.3, 0));
  // wheels (4) with hubs
  const wheels = [];
  for (const x of [-0.48, 0.48]) for (const z of [-0.58, 0.55]) {
    const w = group();
    const tire = cyl(0.21, 0.21, 0.16, dark, { seg: 16 }); tire.rotation.z = HALF_PI; w.add(tire);
    const hub = cyl(0.1, 0.1, 0.17, '#e8e8e8', { seg: 10, shadow: false }); hub.rotation.z = HALF_PI; w.add(hub);
    w.position.set(x, 0.21, z); inner.add(w); wheels.push(w);
  }
  // cab (front = +z)
  const cab = group();
  cab.add(place(box(1.0, 0.5, 0.65, body_, { r: 0.12 }), 0, 0.25, 0));
  cab.add(place(box(0.94, 0.42, 0.55, body_, { r: 0.14 }), 0, 0.62, -0.05));
  cab.add(place(box(0.8, 0.28, 0.04, M('#bfe6ff', { snow: 0, emissive: '#fff1b0', glow: true }), tiny), 0, 0.66, 0.21).rotateX(-0.25));
  for (const s of [-1, 1]) cab.add(place(box(0.03, 0.24, 0.32, M('#bfe6ff', { snow: 0 }), tiny), s * 0.475, 0.65, -0.05));
  // hood stripe, grille, bumper, headlights
  cab.add(place(box(1.02, 0.08, 0.67, trim, { r: 0.03, shadow: false }), 0, 0.38, 0));
  cab.add(place(box(0.5, 0.2, 0.04, '#cfd5da', { r: 0.02, shadow: false }), 0, 0.2, 0.33));
  for (let i = 0; i < 3; i++) cab.add(place(box(0.44, 0.02, 0.05, '#8c959c', tiny), 0, 0.14 + i * 0.06, 0.335));
  cab.add(place(box(1.04, 0.1, 0.12, '#d0d4d8', { r: 0.04 }), 0, 0.02, 0.33));
  for (const s of [-1, 1]) {
    cab.add(place(cyl(0.075, 0.075, 0.05, M('#fff6c8', { emissive: '#ffe9a3', glow: true }), { seg: 12, shadow: false }), s * 0.36, 0.22, 0.33).rotateX(HALF_PI));
    cab.add(place(box(0.05, 0.09, 0.03, dark, tiny), s * 0.53, 0.66, 0.08));
  }
  // roof beacon + little star badge
  cab.add(place(ball(0.06, '#ffc83d', tiny), 0, 0.86, -0.05));
  cab.position.set(0, 0.3, 0.6); inner.add(cab);
  // cargo bed with wooden slat sides
  const bed = group();
  bed.add(place(box(1.0, 0.08, 1.15, PAL.woodDark, { r: 0.02 }), 0, 0, 0));
  for (const s of [-1, 1]) {
    bed.add(place(box(0.05, 0.36, 1.15, PAL.wood, { r: 0.02 }), s * 0.48, 0.2, 0));
    for (const y of [0.12, 0.28]) bed.add(place(box(0.06, 0.04, 1.17, PAL.woodLight, tiny), s * 0.48, y, 0));
  }
  bed.add(place(box(1.0, 0.36, 0.05, PAL.wood, { r: 0.02 }), 0, 0.2, -0.56));
  bed.add(place(box(1.0, 0.36, 0.05, PAL.wood, { r: 0.02 }), 0, 0.2, 0.56));
  // cargo: crates + sacks + a milk can
  bed.add(place(crate(0.3, PAL.plank), -0.24, 0.04, -0.25));
  bed.add(place(crate(0.26, '#d9a066'), 0.24, 0.04, -0.3, 0.3));
  bed.add(place(crate(0.24, PAL.plank), -0.22, 0.34, -0.22, 0.2));
  bed.add(place(ICON.sack(), 0.22, 0.17, 0.2));
  bed.add(place(ICON.can(), -0.2, 0.13, 0.25));
  bed.position.set(0, 0.42, -0.35); inner.add(bed);
  // tail lights
  for (const s of [-1, 1]) inner.add(place(box(0.1, 0.06, 0.03, M('#ff4b3a', { emissive: '#ff4b3a', glow: true }), tiny), s * 0.4, 0.35, -0.95));
  t.userData.wheels = wheels;
  return t;
}

function makeTruckPad() {
  const g = group();
  // gravel pad with white parking lines and a kerb
  g.add(place(box(2.8, 0.05, 2.8, '#c9c2b2', { r: 0.03, shadow: false }), 0, 0.025, 0));
  for (const s of [-1, 1]) g.add(place(box(0.07, 0.01, 2.3, '#ffffff', tiny), s * 0.82, 0.055, 0));
  g.add(place(box(1.71, 0.01, 0.07, '#ffffff', tiny), 0, 0.055, -1.15));
  for (const s of [-1, 1]) g.add(place(box(0.12, 0.12, 2.8, PAL.stone, { r: 0.03 }), s * 1.34, 0.06, 0));
  const truck = makeTruck(); truck.position.set(0, 0.05, 0.05); g.add(truck);
  // loading crates + traffic cone + sign post with truck-ish arrow
  g.add(place(crate(0.26), 1.15, 0.12, -1.1, 0.2));
  g.add(place(crate(0.22, '#d9a066'), 1.12, 0.38, -1.12, -0.1));
  g.add(place(ICON.sack(), -1.12, 0.22, -1.1));
  const cn = group(place(cone(0.1, 0.3, '#ff7a1a', { seg: 10 }), 0, 0.2, 0), place(cyl(0.065, 0.075, 0.04, '#ffffff', { seg: 10, shadow: false }), 0, 0.17, 0), place(box(0.24, 0.03, 0.24, '#ff7a1a', tiny), 0, 0.07, 0));
  cn.position.set(-1.12, 0.0, 1.15); g.add(cn);
  const sp = group(post(0, 0, 0.05, 1.0, 0.03, '#8c959c'));
  const sign = cyl(0.18, 0.18, 0.04, '#3f7cc4', { seg: 18 }); sign.rotation.x = HALF_PI; sign.position.y = 1.05; sp.add(sign);
  const arrow = group(place(box(0.16, 0.05, 0.02, '#ffffff', tiny), -0.03, 0, 0));
  const tip = cone(0.07, 0.1, '#ffffff', { seg: 3, shadow: false }); tip.rotation.z = -HALF_PI; tip.position.x = 0.08; arrow.add(tip);
  arrow.position.set(0, 1.05, 0.03); sp.add(arrow);
  sp.position.set(1.15, 0.05, 1.15); g.add(sp);
  return g;
}

// ------------------------------------------------------------------ market stall (3x3)
function makeMarket() {
  const g = group();
  g.add(pad(2.85, 2.6, '#d8c79c'));
  const CW = 2.5, CY = 0.7, CZ = 0.25;
  // counter: front panel + top
  g.add(place(box(CW, CY - 0.06, 0.62, PAL.wood, { r: 0.04 }), 0, (CY - 0.06) / 2, CZ));
  for (let i = 0; i < 6; i++) g.add(place(box(0.025, CY - 0.2, 0.02, PAL.woodDark, tiny), -CW / 2 + 0.2 + i * 0.42, CY / 2, CZ + 0.315));
  g.add(place(box(CW + 0.1, 0.07, 0.72, PAL.woodLight, { r: 0.03 }), 0, CY, CZ));
  // back shelf with jars/baskets
  g.add(place(box(CW - 0.2, 0.9, 0.35, PAL.woodDark, { r: 0.03 }), 0, 0.45, -0.85));
  g.add(place(box(CW - 0.16, 0.05, 0.4, PAL.woodLight, { r: 0.015 }), 0, 0.92, -0.85));
  for (let i = 0; i < 5; i++) g.add(place(ICON.jar(['#d6334a', '#f2a93b', '#7b4fd0', '#43a047', '#e94f7a'][i]), -0.9 + i * 0.45, 0.99, -0.85));
  // posts + striped awning
  for (const x of [-CW / 2 - 0.02, CW / 2 + 0.02]) { g.add(post(x, CZ + 0.32, 0, 1.75, 0.05, PAL.woodDark)); g.add(post(x, -1.0, 0, 1.95, 0.05, PAL.woodDark)); }
  const aw = stripedAwning(CW + 0.3, 1.55, 8, '#e53935', '#ffffff', 0.18);
  aw.position.set(0, 1.86, -0.2); g.add(aw);
  // sign on top of awning with a basket pictogram
  const sign = group(place(box(0.7, 0.32, 0.06, PAL.woodDark, { r: 0.03 }), 0, 0, 0), place(box(0.62, 0.24, 0.07, PAL.cream, { r: 0.02, shadow: false }), 0, 0, 0));
  const apple = group(place(ball(0.07, '#e53935', tiny), -0.12, 0, 0.05), place(ball(0.07, '#ffb300', tiny), 0.0, 0, 0.05), place(ball(0.07, '#43a047', tiny), 0.12, 0, 0.05));
  sign.add(apple);
  sign.position.set(0, 2.12, -0.95); g.add(sign);
  // 6 crate slots on the counter with goods piles
  const piles = [];
  for (let i = 0; i < 6; i++) {
    const x = -CW / 2 + 0.21 + i * 0.416;
    const s = group();
    s.add(place(box(0.36, 0.04, 0.42, PAL.plank, { r: 0.01 }), 0, 0.02, 0));
    for (const zz of [-1, 1]) s.add(place(box(0.36, 0.12, 0.03, PAL.plank, { r: 0.01, shadow: false }), 0, 0.07, zz * 0.2));
    for (const xx of [-1, 1]) s.add(place(box(0.03, 0.12, 0.42, shade(PAL.plank, 0.85), { r: 0.01, shadow: false }), xx * 0.17, 0.07, 0));
    const pile = group();
    const pm = [];
    for (const [px, py, pz, r] of [[-0.08, 0.1, -0.08, 0.08], [0.08, 0.1, -0.08, 0.08], [-0.08, 0.1, 0.08, 0.08], [0.08, 0.1, 0.08, 0.08], [0, 0.2, 0, 0.085]]) {
      const b = ball(r, '#e53935', { low: false, ws: 10, hs: 8, shadow: false }); b.position.set(px, py, pz); pile.add(b); pm.push(b);
    }
    pile.visible = false;
    s.add(pile);
    s.position.set(x, CY + 0.035, CZ); g.add(s);
    piles.push({ pile, pm });
  }
  // decorations: bunting, baskets, flowers, scale
  for (let i = 0; i < 7; i++) g.add(place(cone(0.07, 0.14, ['#ffd54a', '#3f7cc4', '#43a047', '#e94f7a'][i % 4], { seg: 3, shadow: false }), -1.1 + i * 0.37, 1.62, CZ + 0.38, 0).rotateX(Math.PI));
  g.add(place(barrel(0.36, 0.13), 1.18, 0, 1.0));
  g.add(place(crate(0.26), -1.15, 0, 0.95, 0.2));
  g.add(place(flowers(), -1.2, 0.26, 0.95));
  g.add(place(flowers(['#ffd54a', '#ffffff', '#ff8a3d']), 1.18, 0.36, 1.0));
  g.add(place(lantern(), CW / 2 - 0.05, 1.5, CZ + 0.32));
  g.userData.setSlots = (arr = []) => {
    for (let i = 0; i < piles.length; i++) {
      const c = arr[i];
      piles[i].pile.visible = !!c;
      if (c) for (const m of piles[i].pm) m.material = M(c);
    }
  };
  return g;
}

// ------------------------------------------------------------------ river dock (3x3)
function makeDock() {
  const g = group();
  const DY = 0.22;
  // shore landing (back) + long pier towards +z
  g.add(plankDeck(-1.35, 1.35, -1.4, -0.35, DY, { plank: 0.2, color: PAL.plank }));
  g.add(plankDeck(-0.75, 0.75, -0.35, 1.42, DY, { plank: 0.2, color: PAL.plank }));
  // stringers under deck edges
  for (const x of [-0.72, 0.72]) g.add(place(box(0.08, 0.1, 1.8, PAL.woodDark, tiny), x, DY - 0.08, 0.5));
  // posts down into the water
  for (const [x, z] of [[-1.3, -1.35], [1.3, -1.35], [-1.3, -0.4], [1.3, -0.4], [-0.78, 0.3], [0.78, 0.3], [-0.78, 1.33], [0.78, 1.33]]) {
    g.add(post(x, z, -0.6, DY + 0.18, 0.08, '#6b4426'));
    g.add(place(cyl(0.085, 0.085, 0.03, shade('#6b4426', 0.8), { seg: 8, shadow: false }), x, DY + 0.19, z));
  }
  // side rope rail along the pier
  for (const x of [-0.78, 0.78]) {
    const r = cyl(0.015, 0.015, 1.08, '#d8c08a', { seg: 4, shadow: false }); r.rotation.x = HALF_PI; r.position.set(x, DY + 0.32, 0.84); g.add(r);
    g.add(post(x, 0.84, DY, DY + 0.36, 0.035, '#6b4426'));
  }
  // bollard with rope + rope coil
  const bol = group(place(cyl(0.09, 0.11, 0.24, '#3b3f44', { seg: 12 }), 0, 0.12, 0), place(cyl(0.13, 0.13, 0.05, '#3b3f44', { seg: 12 }), 0, 0.26, 0));
  bol.add(place(mesh(GEO.torus(0.1, 0.025, 6, 14), M('#d8c08a'), tiny), 0, 0.14, 0).rotateX(HALF_PI));
  bol.position.set(0.5, DY + 0.035, 1.18); g.add(bol);
  const coil = group();
  for (let i = 0; i < 3; i++) { const t = mesh(GEO.torus(0.14 - i * 0.03, 0.025, 6, 16), M('#d8c08a'), tiny); t.rotation.x = HALF_PI; t.position.y = 0.03 + i * 0.04; coil.add(t); }
  coil.position.set(-0.45, DY + 0.035, 0.9); g.add(coil);
  // crates, barrels, life ring, lamp post at the landing
  g.add(place(crate(0.3), -1.0, DY + 0.035, -1.0, 0.2));
  g.add(place(crate(0.26, '#d9a066'), -0.65, DY + 0.035, -1.05, -0.15));
  g.add(place(crate(0.26), -0.98, DY + 0.335, -1.0, 0.4));
  g.add(place(barrel(0.36, 0.13), 1.0, DY + 0.035, -1.0));
  g.add(place(barrel(0.36, 0.13, '#9a6838'), 1.05, DY + 0.035, -0.65));
  const ring = mesh(GEO.torus(0.14, 0.045, 8, 16), M('#ff5a3c'), {}); ring.position.set(0.78, DY + 0.5, 0.3); ring.rotation.y = HALF_PI; g.add(ring);
  for (let i = 0; i < 4; i++) { const s = box(0.06, 0.1, 0.1, '#ffffff', tiny); const a = (i / 4) * Math.PI * 2 + 0.78; s.position.set(0.8, DY + 0.5 + Math.sin(a) * 0.14, 0.3 + Math.cos(a) * 0.14); g.add(s); }
  g.add(post(0.78, 0.3, DY, DY + 0.45, 0.04, '#6b4426'));
  const lp = group(post(0, 0, 0, 1.15, 0.035, '#3b3f44'));
  lp.add(place(box(0.25, 0.03, 0.03, '#3b3f44', tiny), 0.1, 1.12, 0));
  lp.add(place(lantern(), 0.2, 0.98, 0));
  lp.position.set(-0.65, DY + 0.035, -0.45); g.add(lp);
  // flag pole at the corner
  g.add(place(pennant(0.85, "#3f7cc4"), 1.05, DY + 0.035, -1.3));
  return g;
}

// ------------------------------------------------------------------ fishing pier (2x2), extends to -x over the pond
function makePier() {
  const g = group();
  const DY = 0.18;
  g.add(plankDeck(-0.95, 0.95, -0.36, 0.36, DY, { alongZ: true, plank: 0.19, color: '#c49159' }));
  for (const z of [-0.33, 0.33]) g.add(place(box(1.9, 0.08, 0.06, PAL.woodDark, tiny), 0, DY - 0.07, z));
  for (const x of [-0.88, 0, 0.82]) for (const z of [-0.38, 0.38]) g.add(post(x, z, -0.5, DY + (x < -0.5 ? 0.3 : 0.12), 0.055, '#6b4426'));
  // bucket with a fish tail
  const bk = group();
  const pts = [[0, 0], [0.09, 0], [0.12, 0.2], [0.115, 0.2], [0.085, 0.015], [0, 0.015]];
  bk.add(mesh(GEO.lathe('bucket', pts, 14), M('#9fb4c4', { side: 2 })));
  bk.add(place(cyl(0.11, 0.11, 0.02, M('#4fb3e8', { snow: 0 }), { seg: 14, shadow: false }), 0, 0.16, 0));
  bk.add(place(mesh(GEO.torus(0.12, 0.008, 4, 14, Math.PI), M('#6b737a'), tiny), 0, 0.2, 0));
  const tail = cone(0.05, 0.08, '#f2a93b', { seg: 3, shadow: false }); tail.position.set(0.03, 0.22, 0); tail.rotation.z = Math.PI; bk.add(tail);
  bk.position.set(0.35, DY + 0.035, -0.15); g.add(bk);
  // fishing rod leaning on the end post, line into the water
  const rod = group();
  rod.add(place(cyl(0.012, 0.02, 1.05, '#8a5a33', { seg: 6, shadow: false }), 0, 0.52, 0));
  rod.add(place(cyl(0.035, 0.035, 0.04, '#3b3b3b', { seg: 8, shadow: false }), 0.03, 0.25, 0).rotateZ(HALF_PI));
  rod.position.set(-0.2, DY + 0.035, 0.3); rod.rotation.z = 0.6; g.add(rod);
  const line = cyl(0.003, 0.003, 0.55, '#ffffff', { seg: 3, shadow: false }); line.position.set(-1.45 + 0.55, 0.32, 0.38); g.add(line);
  const bob = group(place(ball(0.035, '#e53935', tiny), 0, 0.02, 0), place(ball(0.03, '#ffffff', tiny), 0, 0.05, 0));
  // float sits on the water just past the pier end (still within the 2x2 footprint)
  bob.position.set(-0.8, 0.03, 0.3); g.add(bob);
  line.scale.y = 1.05 / 0.55; line.position.set(-0.8, 0.56, 0.3);
  // little stool + tackle box
  const st = group(place(cyl(0.12, 0.12, 0.04, PAL.wood, { seg: 10 }), 0, 0.22, 0));
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; st.add(place(cyl(0.015, 0.015, 0.22, PAL.woodDark, { seg: 4, shadow: false }), Math.cos(a) * 0.08, 0.11, Math.sin(a) * 0.08)); }
  st.position.set(-0.15, DY + 0.035, 0.12); g.add(st);
  g.add(place(box(0.26, 0.12, 0.16, '#3f9a4a', { r: 0.02 }), 0.6, DY + 0.095, 0.15));
  g.add(place(box(0.1, 0.03, 0.04, '#2b2b2b', tiny), 0.6, DY + 0.17, 0.15));
  // reeds at the shore end
  const rm = leafMat('#6fa83a');
  for (const [x, z] of [[0.72, 0.6], [0.6, 0.75], [0.75, -0.65]]) for (let i = 0; i < 3; i++) g.add(place(cyl(0.012, 0.018, 0.45, rm, { seg: 4, shadow: false }), x + i * 0.05, 0.22, z + (i % 2) * 0.05));
  g.add(place(cyl(0.025, 0.025, 0.1, "#7a4f2a", { seg: 6, shadow: false }), 0.62, 0.47, 0.6));
  return g;
}

// ------------------------------------------------------------------ river barge
export function makeBarge() {
  const g = group();
  const boat = group(); g.add(boat);
  const hull = '#2f6fa8', stripe = '#ffffff';
  // hull: rounded main block + bow/stern caps, waterline at y=0
  boat.add(place(box(3.4, 0.5, 1.5, hull, { r: 0.18 }), 0, 0.05, 0));
  for (const s of [-1, 1]) { const cap = cyl(0.75, 0.75, 0.5, hull, { seg: 16 }); cap.position.set(s * 1.55, 0.05, 0); cap.scale.set(0.45, 1, 1); boat.add(cap); }
  boat.add(place(box(3.45, 0.07, 1.54, stripe, { r: 0.03, shadow: false }), 0, 0.12, 0));
  for (const s of [-1, 1]) { const c = cyl(0.77, 0.77, 0.07, stripe, { seg: 16, shadow: false }); c.position.set(s * 1.55, 0.12, 0); c.scale.set(0.45, 1, 1); boat.add(c); }
  boat.add(place(box(3.42, 0.08, 1.52, '#c9402f', { r: 0.03, shadow: false }), 0, -0.1, 0));
  // deck + gunwale rim
  boat.add(place(box(3.3, 0.05, 1.32, PAL.plank, { r: 0.02 }), 0, 0.31, 0));
  for (let i = 0; i < 6; i++) boat.add(place(box(0.02, 0.055, 1.3, shade(PAL.plank, 0.85), tiny), -1.4 + i * 0.55, 0.315, 0));
  for (const s of [-1, 1]) boat.add(place(box(3.4, 0.1, 0.08, PAL.woodDark, { r: 0.03 }), 0, 0.36, s * 0.7));
  // cabin at the stern (-x)
  const cab = group();
  cab.add(place(box(0.8, 0.55, 1.0, PAL.cream, { r: 0.05 }), 0, 0.275, 0));
  const cr = roofZ(0.8, 1.0, 0.3, PAL.roofRed, { rows: 2, over: 0.08 }); cr.position.y = 0.55; cab.add(cr);
  cab.add(win(0.41, 0.32, -0.2, HALF_PI, { w: 0.22, h: 0.22 }));
  cab.add(win(0.41, 0.32, 0.22, HALF_PI, { w: 0.22, h: 0.22 }));
  cab.add(win(0, 0.32, 0.51, 0, { w: 0.24, h: 0.22 }));
  const pipe = place(cyl(0.05, 0.05, 0.4, '#3b3f44', { seg: 8 }), -0.22, 0.85, -0.25);
  cab.add(pipe);
  cab.add(place(lantern(), 0.42, 0.62, 0.45));
  cab.position.set(-1.25, 0.33, 0); boat.add(cab);
  const smoke = makeSmoke(-1.47, 1.42, -0.25, { n: 3, size: 0.08, rise: 0.7 }); boat.add(smoke.group);
  // flag pole at the stern tip, flag at the bow
  const fl = pennant(0.9, '#e53935'); fl.position.set(-1.75, 0.33, 0); boat.add(fl);
  const fl2 = pennant(0.55, '#ffd54a'); fl2.position.set(1.75, 0.33, 0); boat.add(fl2);
  // life ring on the cabin side
  const ring = mesh(GEO.torus(0.11, 0.035, 8, 14), M('#ff5a3c'), tiny); ring.position.set(-1.25, 0.6, 0.52); boat.add(ring);
  // 6 crate spots: 3 along x x 2 rows; spot markers + crates
  const crates = [];
  for (let i = 0; i < 6; i++) {
    const x = -0.35 + (i % 3) * 0.6, z = i < 3 ? -0.32 : 0.32;
    boat.add(place(box(0.48, 0.012, 0.48, '#a77a48', tiny), x, 0.34, z));
    const c = crate(0.42, i % 2 ? '#d9a066' : PAL.plank); c.position.set(x, 0.34, z); c.rotation.y = (i % 3 - 1) * 0.08;
    c.add(place(box(0.28, 0.02, 0.02, '#7a4f2a', tiny), 0, 0.43, 0));
    c.visible = false; boat.add(c); crates.push(c);
  }
  // tyre fenders on the side facing the dock (-z and +z)
  for (const x of [-0.6, 0.6]) for (const s of [-1, 1]) { const f = mesh(GEO.torus(0.09, 0.04, 6, 12), M('#2b2b2b'), tiny); f.position.set(x, 0.15, s * 0.79); boat.add(f); }
  g.userData.setCrates = (arr = []) => { for (let i = 0; i < 6; i++) crates[i].visible = !!arr[i]; };
  g.userData.anim = (t) => {
    boat.position.y = Math.sin(t * 1.3) * 0.035;
    boat.rotation.z = Math.sin(t * 0.9) * 0.02;
    boat.rotation.x = Math.sin(t * 1.1 + 1) * 0.015;
    fl.userData.wave(t); fl2.userData.wave(t);
    smoke.update(t, true, 0.35);
  };
  return g;
}

// ------------------------------------------------------------------ expansion signpost (1x1)
export function makeExpansionSign() {
  const g = group();
  g.add(place(cyl(0.16, 0.2, 0.08, '#8a5a33', { seg: 10, shadow: false }), -0.2, 0.04, 0));
  g.add(post(-0.2, 0, 0, 1.0, 0.045, PAL.woodDark));
  g.add(place(box(0.55, 0.06, 0.06, PAL.woodDark, { r: 0.02 }), 0.05, 0.95, 0));
  g.add(place(ball(0.045, PAL.gold, tiny), -0.2, 1.03, 0));
  const board = group();
  for (const s of [-0.14, 0.14]) board.add(place(cyl(0.008, 0.008, 0.16, '#555', { seg: 3, shadow: false }), s, 0.22, 0));
  board.add(place(box(0.44, 0.34, 0.05, PAL.woodDark, { r: 0.03 }), 0, 0, 0));
  board.add(place(box(0.38, 0.28, 0.06, PAL.cream, { r: 0.02, shadow: false }), 0, 0, 0));
  const c1 = ICON.coin(); c1.position.z = 0.04; board.add(c1);
  const c2 = ICON.coin(); c2.position.z = -0.04; board.add(c2);
  board.position.set(0.12, 0.66, 0); g.add(board);
  // tiny ribbon + grass tuft + stakes
  const lm = leafMat(PAL.grassDark);
  for (const [x, z] of [[-0.3, 0.12], [-0.1, -0.12], [0.25, 0.2]]) g.add(place(ball(0.08, lm, { low: true, shadow: false }), x, 0.04, z));
  g.userData.anim = (t) => { board.rotation.x = Math.sin(t * 1.6) * 0.06; };
  return g;
}

// ------------------------------------------------------------------ public
const FIXED_MAKERS = {
  house: makeHouse, barn: makeBarn, board: makeBoard, truck: makeTruckPad,
  market: makeMarket, dock: makeDock, pier: makePier,
};

export function makeFixed(key) {
  const fn = FIXED_MAKERS[key];
  if (!fn) throw new Error('unknown fixed landmark: ' + key);
  const g = fn();
  g.name = 'fixed_' + key;
  return g;
}

export const FIXED_CATALOG = {
  ...Object.fromEntries(Object.keys(FIXED_MAKERS).map((k) => ['fixed_' + k, () => makeFixed(k)])),
  market_full: () => { const m = makeFixed('market'); m.userData.setSlots(['#e53935', '#ffb300', null, '#7cb342', '#8e5cc9', '#f57c00']); return m; },
  truck: makeTruck,
  barge: () => { const b = makeBarge(); b.userData.setCrates([true, true, false, true, false, true]); return b; },
  barge_empty: makeBarge,
  expansion_sign: makeExpansionSign,
};
