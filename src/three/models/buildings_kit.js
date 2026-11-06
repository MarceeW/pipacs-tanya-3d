// Private building kit: shared parts (roofs with shingle rows, timber framing, chimneys with
// smoke, signs, flower boxes, level decorations, pictogram icons) used by every building module.
import { PAL, M, leafMat, box, cyl, cone, ball, mesh, group, place, windowPane, door, GEO } from '../lib.js';

export const TAU = Math.PI * 2;

// Slightly darker shade of a hex colour (for shingle rows / trims).
export function shade(hex, k = 0.82) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return '#' + ((1 << 24) | (Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b)).toString(16).slice(1);
}

export const tiny = { shadow: false };

/** Flat ground pad under a building (soft cobble/dirt). */
export function pad(w, d, color = '#d8c79c') {
  return place(box(w, 0.05, d, color, { r: 0.025, shadow: false }), 0, 0.025, 0);
}

/** Plain wall block with a stone plinth. Returns group; block sits on y=0. */
export function body(w, h, d, wall = PAL.wall, { plinth = PAL.stone, ph = 0.18, r = 0.05 } = {}) {
  const g = group();
  g.add(place(box(w, h, d, wall, { r }), 0, h / 2, 0));
  if (plinth) g.add(place(box(w + 0.08, ph, d + 0.08, plinth, { r: 0.05 }), 0, ph / 2, 0));
  return g;
}

/**
 * Gable roof with the ridge running along x (slopes face +z / -z), shingle rows and a ridge cap.
 * w: width along x, d: depth along z, h: rise. Group sits at y=0 (the eave line).
 */
export function roofX(w, d, h, color, { over = 0.14, thick = 0.09, rows = 3, gable = PAL.wall, ridge = null, gableEnds = true } = {}) {
  const g = group();
  const half = d / 2 + over;
  const slope = Math.hypot(half, h);
  const ang = Math.atan2(h, half);
  const dark = shade(color, 0.9);
  for (const s of [-1, 1]) {
    const piv = group();
    piv.position.set(0, h / 2 + 0.02, (s * half) / 2);
    piv.rotation.x = s * ang;
    piv.add(mesh(GEO.rbox(w + over * 2, thick, slope + 0.04, 0.035), M(color)));
    for (let i = 0; i < rows; i++) {
      const z = (-slope / 2 + ((i + 0.75) / (rows + 0.25)) * slope) * s;
      piv.add(place(mesh(GEO.rbox(w + over * 2 + 0.01, 0.03, 0.05, 0.012), M(dark), tiny), 0, thick / 2, z));
    }
    g.add(piv);
  }
  if (gableEnds) {
    const tri = mesh(GEO.prism(d, h, w - 0.02), gable);
    tri.rotation.y = Math.PI / 2;
    g.add(tri);
  }
  const cap = cyl(0.07, 0.07, w + over * 2 + 0.06, ridge || shade(color, 0.7), { seg: 8 });
  cap.rotation.z = Math.PI / 2;
  cap.position.y = h + 0.05;
  g.add(cap);
  return g;
}

/** Gable roof with the ridge along z (gable triangle faces the front). w along x, d along z. */
export function roofZ(w, d, h, color, opts = {}) {
  const r = roofX(d, w, h, color, opts);
  return group(place(r, 0, 0, 0, Math.PI / 2));
}

/** Window helper: framed window (+ optional shutters) at x,y,z facing rotation ry. */
export function win(x, y, z, ry = 0, { w = 0.3, h = 0.34, frame = PAL.white, shutter = null, cross = true, sill = true } = {}) {
  const g = group(windowPane(w, h, frame, { cross }));
  if (shutter) for (const s of [-1, 1]) g.add(place(box(w * 0.42, h + 0.04, 0.03, shutter, { r: 0.01, shadow: false }), s * (w / 2 + w * 0.26), 0, 0.01));
  if (sill) g.add(place(box(w + 0.12, 0.04, 0.08, frame, { shadow: false }), 0, -h / 2 - 0.04, 0.03));
  return place(g, x, y, z, ry);
}

/** Front door with frame + step. */
export function doorway(x, z, ry = 0, { w = 0.36, h = 0.6, color = PAL.woodDark, frame = PAL.wood } = {}) {
  const g = group();
  g.add(place(box(w + 0.1, h + 0.06, 0.04, frame, { r: 0.015 }), 0, (h + 0.06) / 2 + 0.16, -0.01));
  g.add(place(door(w, h, color), 0, 0.16, 0.01));
  g.add(place(box(w + 0.2, 0.08, 0.2, PAL.stone, { r: 0.03 }), 0, 0.04, 0.1));
  return place(g, x, 0, z, ry);
}

/** Wooden beams: list of [x1,y1,x2,y2] segments on a wall plane at z (local, faces +z). */
export function beams(segs, z, color = PAL.woodDark, t = 0.06) {
  const g = group();
  for (const [x1, y1, x2, y2] of segs) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const b = box(len + t * 0.6, t, 0.04, color, { shadow: false });
    b.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
    b.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    g.add(b);
  }
  return g;
}

/** Timber frame for a wall w wide, from y0 to y1, at plane z (faces +z). Posts + top/bottom rail + braces. */
export function timberWall(w, y0, y1, z, color = PAL.woodDark, { posts = 3, braces = true } = {}) {
  const segs = [[-w / 2, y0, w / 2, y0], [-w / 2, y1, w / 2, y1]];
  for (let i = 0; i < posts; i++) {
    const x = -w / 2 + (i / (posts - 1)) * w;
    segs.push([x, y0, x, y1]);
  }
  if (braces) {
    const x0 = -w / 2, x1 = -w / 2 + w / (posts - 1);
    segs.push([x0, y0, x1, y1]);
    segs.push([w / 2, y0, w / 2 - w / (posts - 1), y1]);
  }
  return beams(segs, z, color);
}

/** Brick/stone chimney with cap; returns group whose top is at y=h. */
export function chimney(h = 0.6, color = PAL.brick, w = 0.24) {
  const g = group();
  g.add(place(box(w, h, w, color, { r: 0.03 }), 0, h / 2, 0));
  g.add(place(box(w + 0.07, 0.08, w + 0.07, shade(color, 0.75), { r: 0.025 }), 0, h - 0.02, 0));
  return g;
}

/**
 * Smoke puffs: n balls re-used in a loop. update(t, on, speed) moves them; no allocations per frame.
 * Positioned in the parent's local space at (x, y, z).
 */
export function makeSmoke(x, y, z, { n = 4, size = 0.13, rise = 1.0, color = '#ffffff', drift = 0.25, opacity = 0.9 } = {}) {
  const g = group();
  g.position.set(x, y, z);
  const mat = M(color, { snow: 0, transparent: true, opacity });
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const p = mesh(GEO.ico(size, 1), mat, { shadow: false, receive: false });
    p.visible = false;
    g.add(p);
    puffs.push(p);
  }
  return {
    group: g,
    update(t, on, speed = 0.45) {
      for (let i = 0; i < n; i++) {
        const p = puffs[i];
        if (!on) { p.visible = false; continue; }
        const ph = (t * speed + i / n) % 1;
        p.visible = true;
        p.position.set(Math.sin(ph * 3 + i) * 0.05 + ph * drift, ph * rise, ph * drift * 0.4);
        const s = Math.sin(Math.min(1, ph * 1.4) * Math.PI) * 0.6 + ph * 0.9;
        p.scale.setScalar(Math.max(0.01, s * (1 - ph * 0.7)));
      }
    },
  };
}

/** Round plaque sign with a pictogram (icon group ~0.3 tall), facing +z. */
export function plaque(icon, { r = 0.25, board = PAL.cream, rim = PAL.woodDark } = {}) {
  const g = group();
  const disc = cyl(r, r, 0.05, board, { seg: 20 });
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  const ring = mesh(GEO.torus(r, 0.03, 6, 22), M(rim), tiny);
  g.add(ring);
  if (icon) { icon.position.z = 0.05; g.add(icon); }
  return g;
}

/** Hanging sign on an iron bracket sticking out towards +x; the board hangs under it facing +z (icon on both sides). */
export function hangingSign(icon, { board = PAL.cream, rim = PAL.woodDark } = {}) {
  const g = group();
  const arm = box(0.42, 0.04, 0.04, '#4a4a4a', tiny);
  arm.position.set(0.21, 0, 0);
  g.add(arm);
  g.add(place(box(0.04, 0.12, 0.04, '#4a4a4a', tiny), 0.03, -0.06, 0));
  for (const s of [0.1, 0.34]) g.add(place(box(0.015, 0.1, 0.015, '#4a4a4a', tiny), s, -0.05, 0));
  const b = group();
  b.add(box(0.36, 0.3, 0.05, rim, { r: 0.02 }));
  b.add(place(box(0.3, 0.24, 0.06, board, { r: 0.02, shadow: false }), 0, 0, 0));
  if (icon) { icon.position.z = 0.04; b.add(icon); const ic2 = icon.clone(); ic2.position.z = -0.04; ic2.rotation.y = Math.PI; b.add(ic2); }
  b.position.set(0.22, -0.25, 0);
  g.add(b);
  g.userData.board = b;
  return g;
}

/** Flower box with a few blooms, w wide, faces +z. */
export function flowerBox(w = 0.4, colors = ['#ff6fa3', '#ffd54a', '#ff8a3d']) {
  const g = group();
  g.add(place(box(w, 0.09, 0.11, PAL.wood, { r: 0.02, shadow: false }), 0, 0, 0));
  const lm = leafMat(PAL.leaf);
  const n = Math.max(2, Math.round(w / 0.12));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.06 + (i / (n - 1)) * (w - 0.12);
    g.add(place(ball(0.045, lm, { low: true, shadow: false }), x, 0.06, 0));
    g.add(place(ball(0.035, M(colors[i % colors.length], { sway: 0.01 }), { low: true, shadow: false }), x + 0.01, 0.1, 0.02));
  }
  return g;
}

/** Small lantern that glows at night. */
export function lantern() {
  const g = group();
  g.add(place(box(0.08, 0.1, 0.08, M('#ffd36b', { emissive: '#ffcf5a', glow: true }), tiny), 0, 0, 0));
  g.add(place(cone(0.07, 0.06, '#3b3b3b', { seg: 4, shadow: false }), 0, 0.08, 0));
  g.add(place(box(0.1, 0.02, 0.1, '#3b3b3b', tiny), 0, -0.06, 0));
  return g;
}

/** Pennant flag on a pole (pole height h). Flag waves via anim (call flag.userData.wave(t)). */
export function pennant(h = 0.6, color = PAL.roofRed) {
  const g = group();
  g.add(place(cyl(0.015, 0.015, h, PAL.woodDark, { seg: 6, shadow: false }), 0, h / 2, 0));
  g.add(place(ball(0.03, PAL.gold, tiny), 0, h + 0.02, 0));
  const f = cone(0.07, 0.3, color, { seg: 3, shadow: false });
  f.rotation.z = -Math.PI / 2;
  f.position.set(0.15, h - 0.08, 0);
  f.scale.set(1, 1, 0.25);
  g.add(f);
  g.userData.wave = (t) => { f.rotation.y = Math.sin(t * 3 + h) * 0.35; };
  return g;
}

/** Gold weathervane (rooster-ish arrow) for level 4. */
export function weathervane() {
  const g = group();
  const gold = M(PAL.gold, { snow: 0 });
  g.add(place(cyl(0.015, 0.015, 0.4, gold, { seg: 6, shadow: false }), 0, 0.2, 0));
  g.add(place(ball(0.04, gold, tiny), 0, 0.22, 0));
  const top = group();
  top.add(box(0.36, 0.025, 0.025, gold, tiny));
  const tip = cone(0.04, 0.08, gold, { seg: 4, shadow: false }); tip.rotation.z = -Math.PI / 2; tip.position.x = 0.2; top.add(tip);
  top.add(place(box(0.08, 0.1, 0.015, gold, tiny), -0.15, 0.04, 0));
  // little star at the top
  top.add(place(ball(0.035, gold, tiny), 0, 0.06, 0));
  top.position.y = 0.38;
  g.add(top);
  g.userData.top = top;
  return g;
}

/**
 * Level upgrades shared by all production buildings:
 * L2 flower boxes, L3 + pennant flag, L4 + gold weathervane (and gold trim star).
 * spots: { boxes: [[x,y,z,w,ry]], flag: [x,y,z], vane: [x,y,z] }
 * Returns an update function for waving / spinning.
 */
export function levelDecor(g, level, spots) {
  const wavers = [];
  if (level >= 2 && spots.boxes) for (const [x, y, z, w = 0.4, ry = 0] of spots.boxes) g.add(place(flowerBox(w), x, y, z, ry));
  if (level >= 3 && spots.flag) { const f = pennant(0.55, level >= 4 ? '#7b4fd0' : PAL.roofRed); place(f, ...spots.flag); g.add(f); wavers.push(f.userData.wave); }
  if (level >= 4 && spots.vane) { const v = weathervane(); place(v, ...spots.vane); g.add(v); const top = v.userData.top; wavers.push((t) => { top.rotation.y = Math.sin(t * 0.4) * 1.2; }); }
  return (t) => { for (const w of wavers) w(t); };
}

// ------------------------------------------------------------------ pictogram icons (~0.25 tall, face +z)
const ic = (...parts) => group(...parts);
export const ICON = {
  sack(c = '#e8d3a2') {
    return ic(place(ball(0.11, c, { ...tiny, ws: 10, hs: 8 }), 0, -0.02, 0), place(cyl(0.035, 0.06, 0.06, c, tiny), 0, 0.1, 0),
      place(box(0.09, 0.015, 0.02, '#a0522d', tiny), 0, 0.08, 0.02), place(ball(0.03, '#f2c14e', tiny), 0.0, -0.02, 0.09));
  },
  bread() {
    const loaf = capsuleFlat(0.08, 0.16, '#d08a3c');
    const g = ic(loaf);
    for (const x of [-0.06, 0, 0.06]) g.add(place(box(0.02, 0.012, 0.09, '#f3c77a', tiny), x, 0.06, 0.04, 0));
    return g;
  },
  can() {
    const g = ic();
    const c = cyl(0.07, 0.08, 0.18, '#d8dde2', tiny); g.add(c);
    g.add(place(cyl(0.045, 0.07, 0.05, '#d8dde2', tiny), 0, 0.11, 0));
    g.add(place(cyl(0.05, 0.05, 0.02, '#9fa8b0', tiny), 0, 0.145, 0));
    g.add(place(box(0.12, 0.04, 0.01, '#3f7cc4', tiny), 0, 0, 0.075));
    return g;
  },
  log() {
    const g = ic();
    const l = cyl(0.07, 0.07, 0.22, PAL.wood, tiny); l.rotation.z = Math.PI / 2; g.add(l);
    const e = cyl(0.06, 0.06, 0.01, PAL.woodLight, tiny); e.rotation.z = Math.PI / 2; e.position.x = 0.11; g.add(e);
    return g;
  },
  cube() {
    return ic(place(box(0.13, 0.13, 0.13, '#ffffff', { r: 0.015, ...tiny }), 0, 0, 0, 0.5), place(box(0.1, 0.1, 0.1, '#ffffff', { r: 0.015, ...tiny }), 0.08, -0.02, 0.04, -0.3));
  },
  spool(c = '#e94f7a') {
    const g = ic();
    for (const y of [-0.08, 0.08]) g.add(place(cyl(0.08, 0.08, 0.03, PAL.woodLight, tiny), 0, y, 0));
    g.add(cyl(0.06, 0.06, 0.14, c, tiny));
    return g;
  },
  drop(c = '#c9b330') {
    const g = ic(place(ball(0.08, c, tiny), 0, -0.03, 0));
    const t = cone(0.065, 0.12, c, tiny); t.position.y = 0.07; g.add(t);
    return g;
  },
  jar(c = '#d6334a') {
    const g = ic(cyl(0.07, 0.07, 0.16, M('#e8f6ff', { snow: 0, transparent: true, opacity: 0.35 }), tiny));
    g.add(place(cyl(0.062, 0.062, 0.11, c, tiny), 0, -0.02, 0));
    g.add(place(cyl(0.075, 0.075, 0.035, '#e8c24a', tiny), 0, 0.09, 0));
    return g;
  },
  cake() {
    const g = ic(place(cyl(0.11, 0.11, 0.08, '#f7c7d9', tiny), 0, -0.05, 0), place(cyl(0.075, 0.075, 0.07, '#fff3e0', tiny), 0, 0.025, 0));
    g.add(place(ball(0.03, '#e53950', tiny), 0, 0.08, 0));
    return g;
  },
  bowl() {
    const g = ic(place(mesh(GEO.sphere(0.11, 14, 8), M('#e05a3a'), tiny), 0, 0.01, 0));
    g.children[0].scale.set(1, 0.6, 1);
    g.add(place(cyl(0.1, 0.1, 0.02, '#b33a1e', tiny), 0, 0.04, 0));
    g.add(place(cyl(0.11, 0.11, 0.02, '#ffffff', tiny), 0, 0.055, 0));
    return g;
  },
  candle() {
    const g = ic(place(cyl(0.045, 0.045, 0.18, '#fff1c9', tiny), 0, -0.03, 0));
    g.add(place(cone(0.03, 0.08, M('#ffb52e', { emissive: '#ffb52e' }), tiny), 0, 0.1, 0));
    return g;
  },
  cup() {
    const g = ic(place(cyl(0.08, 0.06, 0.12, '#ffffff', tiny), 0, -0.02, 0));
    g.add(place(cyl(0.07, 0.07, 0.01, '#6b3d1f', tiny), 0, 0.04, 0));
    const h = mesh(GEO.torus(0.04, 0.014, 6, 12), M('#ffffff'), tiny); h.position.set(0.085, -0.02, 0); g.add(h);
    g.add(place(cyl(0.12, 0.12, 0.015, '#ffffff', tiny), 0, -0.085, 0));
    return g;
  },
  bottle(c = '#b57cf0') {
    const g = ic(place(ball(0.085, M(c, { snow: 0 }), tiny), 0, -0.04, 0));
    g.add(place(cyl(0.025, 0.03, 0.08, M(c, { snow: 0 }), tiny), 0, 0.06, 0));
    g.add(place(ball(0.035, PAL.gold, tiny), 0, 0.12, 0));
    return g;
  },
  needle() {
    const g = ICON.spool('#3fb6c9');
    const n = cyl(0.008, 0.008, 0.3, '#c9ced4', tiny); n.rotation.z = 0.7; n.position.set(0.02, 0.0, 0.09); g.add(n);
    return g;
  },
  flower(c = '#c36ae0') {
    const g = ic();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; g.add(place(ball(0.045, c, tiny), Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0)); }
    g.add(place(ball(0.04, PAL.gold, tiny), 0, 0, 0.02));
    return g;
  },
  coin() {
    const c = cyl(0.11, 0.11, 0.03, PAL.gold, tiny); c.rotation.x = Math.PI / 2;
    const in2 = cyl(0.075, 0.075, 0.035, '#f5a623', tiny); in2.rotation.x = Math.PI / 2;
    return ic(c, in2);
  },
  fleece() {
    const g = ic();
    for (const [x, y] of [[-0.06, 0], [0.06, 0], [0, 0.05], [0, -0.04]]) g.add(place(ball(0.065, '#fbfbf5', { ...tiny, low: true }), x, y, 0));
    return g;
  },
};

/** Squashed capsule lying along x (bread loaves etc.). */
export function capsuleFlat(r, len, color, o = tiny) {
  const c = mesh(GEO.capsule(r, len), M(color), o);
  c.rotation.z = Math.PI / 2;
  c.scale.set(1, 1, 0.8);
  return c;
}

/** Wooden barrel standing on y=0. */
export function barrel(h = 0.34, r = 0.13, color = PAL.wood) {
  const g = group();
  const pts = [[0, 0], [r * 0.85, 0], [r, h * 0.5], [r * 0.85, h], [0, h]];
  g.add(mesh(GEO.lathe('barrel' + h + r, pts, 12), M(color)));
  for (const y of [0.15, 0.85]) g.add(place(cyl(r * 0.95, r * 0.95, 0.03, '#5d5d5d', { seg: 12, shadow: false }), 0, h * y, 0));
  return g;
}

/** Wooden crate on y=0. */
export function crate(s = 0.26, color = PAL.plank) {
  const g = group(place(box(s, s, s, color, { r: 0.02 }), 0, s / 2, 0));
  g.add(place(box(s + 0.01, 0.04, s + 0.01, shade(color, 0.8), tiny), 0, s * 0.8, 0));
  g.add(place(box(s + 0.01, 0.04, s + 0.01, shade(color, 0.8), tiny), 0, s * 0.2, 0));
  return g;
}

/** Bush clump next to buildings. */
export function bush(r = 0.18, color = PAL.leaf) {
  const lm = leafMat(color);
  return group(place(ball(r, lm, { low: true }), 0, r * 0.8, 0), place(ball(r * 0.7, lm, { low: true }), r * 0.8, r * 0.6, r * 0.2));
}

export { PAL, M, leafMat, box, cyl, cone, ball, mesh, group, place, windowPane, door, GEO };
