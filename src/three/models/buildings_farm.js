// Animal housings: 4x4 fenced yards (gate at the front +z) with a shelter at the back (-z),
// a tinted yard patch and a feeding trough near the front-left corner.
// Contract: userData.yard = { x0, z0, x1, z1 } (local roaming rectangle), userData.state = { level }.
import {
  PAL, M, leafMat, box, cyl, cone, ball, mesh, group, place, GEO, TAU,
  roofX, roofZ, win, beams, plaque, ICON, levelDecor, weathervane, shade, tiny, body, lantern,
} from './buildings_kit.js';

const H = 1.85;          // fence line (half size)
const GATE = 0.8;        // gate opening width

// ------------------------------------------------------------------ shared yard parts
function yardGround(color, w = 3.76) {
  return place(box(w, 0.04, w, color, { r: 0.02, shadow: false }), 0, 0.02, 0);
}

/** Perimeter fence with a double gate in the front (+z). */
function fence(post = PAL.woodLight, rail = PAL.wood) {
  const g = group();
  const pm = M(post), rm = M(rail);
  const step = 0.62;
  const n = Math.round((2 * H) / step);
  const addPost = (x, z, tall = 0.44) => g.add(place(mesh(GEO.rbox(0.08, tall, 0.08, 0.02), pm), x, tall / 2, z));
  for (let i = 0; i <= n; i++) {
    const v = -H + (i / n) * 2 * H;
    addPost(v, -H);                       // back
    if (i > 0 && i < n) { addPost(-H, v); addPost(H, v); }   // sides (corners from back/front)
    if (Math.abs(v) > GATE / 2 + 0.1) addPost(v, H);   // front, skipping the gate opening
  }
  const rail2 = (len, x, z, ry) => {
    for (const y of [0.17, 0.33]) g.add(place(mesh(GEO.rbox(len, 0.06, 0.04, 0.015), rm, tiny), x, y, z, ry));
  };
  rail2(2 * H, 0, -H, 0);
  rail2(2 * H, -H, 0, Math.PI / 2);
  rail2(2 * H, H, 0, Math.PI / 2);
  const seg = H - GATE / 2;
  rail2(seg, -(GATE / 2 + seg / 2), H, 0);
  rail2(seg, GATE / 2 + seg / 2, H, 0);
  // gate posts with ball caps
  for (const s of [-1, 1]) {
    addPost(s * (GATE / 2 + 0.03), H, 0.56);
    g.add(place(ball(0.055, pm, tiny), s * (GATE / 2 + 0.03), 0.6, H));
  }
  // two gate leaves (slightly ajar)
  for (const s of [-1, 1]) {
    const leaf = group();
    const lw = GATE / 2 - 0.05;
    for (const y of [0.14, 0.38]) leaf.add(place(box(lw, 0.06, 0.04, rail, tiny), (s * -lw) / 2, y, 0));
    leaf.add(place(box(0.05, 0.36, 0.04, rail, tiny), s * -lw + s * 0.02, 0.26, 0));
    const d = box(Math.hypot(lw, 0.24), 0.05, 0.035, post, tiny);
    d.position.set((s * -lw) / 2, 0.26, 0.005);
    d.rotation.z = s * Math.atan2(0.24, lw);
    leaf.add(d);
    leaf.position.set(s * (GATE / 2 - 0.02), 0, H);
    leaf.rotation.y = s * -0.35;
    g.add(leaf);
  }
  return g;
}

/** Wooden feeding trough on little legs, length along z, at (x, z). */
function trough(x, z, feed = '#e8c45a') {
  const g = group();
  g.add(place(box(0.28, 0.16, 0.72, PAL.wood, { r: 0.03 }), 0, 0.16, 0));
  g.add(place(box(0.2, 0.04, 0.62, feed, tiny), 0, 0.23, 0));
  for (const zz of [-0.28, 0.28]) g.add(place(box(0.34, 0.08, 0.06, PAL.woodDark, tiny), 0, 0.05, zz));
  return place(g, x, 0, z);
}

/** Round-ish hay bale with two bands. */
function hayBale(x, z, ry = 0, y = 0) {
  const g = group(place(box(0.42, 0.26, 0.28, PAL.thatch, { r: 0.07 }), 0, 0.13, 0));
  for (const xx of [-0.1, 0.1]) g.add(place(box(0.03, 0.27, 0.29, '#b8862f', tiny), xx, 0.13, 0));
  return place(g, x, y, z, ry);
}

/** Small tuft of grass / straw. */
function tuft(x, z, color = PAL.grassDark) {
  return place(cone(0.07, 0.14, leafMat(color), { seg: 5, shadow: false }), x, 0.08, z);
}

function finish(g, key, level, yard, spots, extraAnim) {
  const deco = levelDecor(g, level, spots);
  g.userData.yard = yard;
  g.userData.state = { level };
  g.userData.kind = key;
  g.userData.anim = (t, dt) => { deco(t); if (extraAnim) extraAnim(t, dt); };
  return g;
}

// trough sits along the left side near the front; yards start right of it
const TROUGH_X = -1.42, TROUGH_Z = 1.05;

// ------------------------------------------------------------------ coop
function coop(level) {
  const g = group(yardGround('#d8c487'), fence(PAL.white, '#f1ece0'));
  g.add(trough(TROUGH_X, TROUGH_Z, '#f2d16b'));
  const hx = 0.25, hz = -1.12;
  const hh = group();
  // stilts
  for (const [x, z] of [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]]) hh.add(place(box(0.08, 0.5, 0.08, PAL.woodDark, { r: 0.02 }), x, 0.25, z));
  // floor + body
  hh.add(place(box(1.24, 0.08, 0.86, PAL.wood, { r: 0.02 }), 0, 0.48, 0));
  hh.add(place(box(1.14, 0.62, 0.76, '#d9483b', { r: 0.04 }), 0, 0.82, 0));
  // white corner trims
  for (const x of [-0.57, 0.57]) for (const z of [-0.38, 0.38]) hh.add(place(box(0.07, 0.64, 0.07, PAL.white, tiny), x, 0.82, z));
  hh.add(place(box(1.2, 0.06, 0.82, PAL.white, tiny), 0, 1.13, 0));
  const r = roofX(1.14, 0.76, 0.46, PAL.roofBlue, { gable: '#d9483b', rows: 2 });
  r.position.y = 1.15;
  hh.add(r);
  // round door opening + frame
  const door = cyl(0.14, 0.14, 0.04, '#3a2416', { seg: 16 });
  door.rotation.x = Math.PI / 2; door.position.set(-0.18, 0.75, 0.39);
  hh.add(door);
  hh.add(place(mesh(GEO.torus(0.15, 0.025, 6, 16), M(PAL.white), tiny), -0.18, 0.75, 0.4));
  hh.add(place(box(0.32, 0.18, 0.04, '#3a2416', tiny), -0.18, 0.62, 0.39));
  hh.add(win(0.28, 0.85, 0.39, 0, { w: 0.2, h: 0.2 }));
  hh.add(win(0.58, 0.85, 0, Math.PI / 2, { w: 0.2, h: 0.2 }));
  // ramp with slats down to the yard
  const ramp = group();
  const len = 0.78;
  ramp.add(place(box(0.3, 0.04, len, PAL.plank, { r: 0.01 }), 0, 0, len / 2));
  for (let i = 1; i < 4; i++) ramp.add(place(box(0.3, 0.03, 0.03, PAL.woodDark, tiny), 0, 0.03, (i / 4) * len));
  ramp.position.set(-0.18, 0.5, 0.42);
  ramp.rotation.x = Math.atan2(0.5, len) * 1.02;
  hh.add(ramp);
  // nest box on the side
  hh.add(place(box(0.3, 0.3, 0.5, '#d9483b', { r: 0.03 }), 0.72, 0.72, 0));
  const lid = box(0.38, 0.05, 0.58, PAL.roofBlue, { r: 0.02 });
  lid.position.set(0.74, 0.9, 0); lid.rotation.z = -0.35;
  hh.add(lid);
  place(hh, hx, 0, hz);
  hh.scale.setScalar(1.2);
  g.add(hh);
  // straw scattered + hay bale
  g.add(hayBale(-1.3, -1.45, 0.3));
  g.add(place(cyl(0.45, 0.5, 0.03, '#ecd27a', { seg: 14, shadow: false }), 0.25, 0.05, -0.2));
  if (level >= 3) { g.add(hayBale(-1.3, -1.1, -0.2)); g.add(hayBale(-1.3, -1.3, 0.1, 0.26)); }
  return finish(g, 'coop', level,
    { x0: -1.05, z0: -0.15, x1: 1.6, z1: 1.55 },
    { boxes: [[hx + 0.34, 0.75, hz + 0.53, 0.3]], flag: [hx - 0.72, 1.4, hz - 0.25] });
}

// ------------------------------------------------------------------ cowshed
function cowshed(level) {
  const g = group(yardGround('#b9a26a'), fence());
  g.add(trough(TROUGH_X, TROUGH_Z, '#9ccc4a'));
  const sx = 0.15, sz = -1.12;
  const s = group();
  const red = '#c8402f';
  s.add(body(2.5, 1.05, 1.3, red, { ph: 0.16 }));
  // white corner trims
  for (const x of [-1.25, 1.25]) for (const z of [-0.65, 0.65]) s.add(place(box(0.08, 1.05, 0.08, PAL.white, tiny), x, 0.53, z));
  s.add(place(box(2.56, 0.07, 1.36, PAL.white, tiny), 0, 1.06, 0));
  const r = roofZ(2.5, 1.3, 0.8, '#5b6f8a', { gable: red, rows: 3 });
  r.position.y = 1.08;
  s.add(r);
  // big door with white frame + X
  const fz = 0.66;
  s.add(place(box(0.8, 0.78, 0.04, '#9e2f22', { r: 0.02 }), 0, 0.47, fz));
  s.add(beams([[-0.4, 0.08, -0.4, 0.86], [0.4, 0.08, 0.4, 0.86], [-0.4, 0.86, 0.4, 0.86], [0, 0.08, 0, 0.86],
    [-0.4, 0.08, 0, 0.86], [0, 0.08, -0.4, 0.86], [0, 0.08, 0.4, 0.86], [0.4, 0.08, 0, 0.86]], fz + 0.02, PAL.white, 0.06));
  // hay loft door in the gable with hay poking out
  s.add(place(box(0.38, 0.32, 0.04, PAL.white, tiny), 0, 1.36, fz - 0.01));
  s.add(place(box(0.3, 0.24, 0.05, '#5a2a1e', tiny), 0, 1.36, fz));
  s.add(place(ball(0.12, M(PAL.thatch), { low: true, shadow: false }), 0, 1.28, fz + 0.03));
  s.add(place(box(0.05, 0.05, 0.3, PAL.woodDark, tiny), 0, 1.6, fz + 0.12));
  for (const x of [-0.85, 0.85]) s.add(win(x, 0.68, fz, 0, { w: 0.28, h: 0.24, shutter: PAL.white }));
  s.add(win(1.26, 0.68, 0, Math.PI / 2, { w: 0.3, h: 0.24 }));
  s.add(place(lantern(), 0.55, 0.95, fz + 0.06));
  place(s, sx, 0, sz);
  g.add(s);
  g.add(hayBale(-1.45, -0.25, 0.2));
  g.add(hayBale(-1.45, -0.25, -0.1, 0.26));
  let vane = null;
  if (level >= 3) {
    vane = weathervane();
    g.add(place(vane, sx, 1.95, sz));
    g.add(hayBale(1.55, -0.1, 1.2));
  }
  const top = vane && vane.userData.top;
  return finish(g, 'cowshed', level,
    { x0: -1.05, z0: -0.05, x1: 1.6, z1: 1.55 },
    { boxes: [[sx - 0.85, 0.49, sz + 0.71, 0.36], [sx + 0.85, 0.49, sz + 0.71, 0.36]], flag: [sx + 1.15, 1.05, sz - 0.5] },
    top ? (t) => { top.rotation.y = Math.sin(t * 0.4) * 1.2; } : null);
}

// ------------------------------------------------------------------ sheepfold
function sheepfold(level) {
  const g = group(yardGround('#a9c26a'), fence());
  g.add(trough(TROUGH_X, TROUGH_Z, '#d9c25a'));
  const sx = 0.2, sz = -1.1, w = 2.5, d = 1.24;
  const s = group();
  const stone = '#b3ada0', planks = '#c08a52';
  // stone lower walls (back + sides), plank upper walls
  s.add(place(box(w, 0.48, 0.16, stone, { r: 0.05 }), 0, 0.24, -d / 2));
  s.add(place(box(w - 0.06, 0.52, 0.12, planks, { r: 0.03 }), 0, 0.74, -d / 2));
  for (const x of [-w / 2, w / 2]) {
    s.add(place(box(0.16, 0.48, d, stone, { r: 0.05 }), x, 0.24, 0));
    s.add(place(box(0.12, 0.52, d - 0.06, planks, { r: 0.03 }), x, 0.74, 0));
  }
  // stones pattern on the visible +x side
  for (const [z, y] of [[-0.35, 0.14], [0.1, 0.3], [0.38, 0.12]]) s.add(place(box(0.03, 0.12, 0.22, '#8f8a7e', tiny), w / 2 + 0.08, y, z));
  // dark inner back so the open front reads as a shelter
  s.add(place(box(w - 0.2, 0.9, 0.04, '#5a4430', tiny), 0, 0.5, -d / 2 + 0.1));
  // open front: posts + beam
  for (const x of [-w / 2, 0, w / 2]) s.add(place(box(0.12, 1.0, 0.12, PAL.woodDark, { r: 0.03 }), x, 0.5, d / 2 - 0.04));
  s.add(place(box(w + 0.1, 0.1, 0.12, PAL.woodDark, { r: 0.03 }), 0, 0.98, d / 2 - 0.04));
  const r = roofX(w, d, 0.7, PAL.thatch, { gable: planks, rows: 4, thick: 0.16, over: 0.15 });
  r.position.y = 1.02;
  s.add(r);
  // hay rack + straw bedding inside
  s.add(place(box(1.0, 0.3, 0.2, PAL.wood, { r: 0.03 }), -0.5, 0.55, -d / 2 + 0.22));
  s.add(place(ball(0.2, M(PAL.thatch), { low: true }), -0.6, 0.72, -d / 2 + 0.22));
  s.add(place(ball(0.18, M(PAL.thatch), { low: true }), -0.35, 0.7, -d / 2 + 0.24));
  s.add(place(box(w - 0.3, 0.05, d - 0.3, '#e3c56c', tiny), 0, 0.04, 0));
  place(s, sx, 0, sz);
  g.add(s);
  // wool-sign plaque on the gable
  const p = plaque(ICON.fleece(), { r: 0.18 }); p.rotation.y = Math.PI / 2;
  g.add(place(p, sx + w / 2 + 0.07, 1.25, sz));
  for (const [x, z] of [[1.2, 0.6], [0.4, 1.3], [-0.5, 0.4], [1.5, 1.4]]) g.add(tuft(x, z));
  if (level >= 3) g.add(hayBale(-1.45, -0.25, 0.3));
  return finish(g, 'sheepfold', level,
    { x0: -1.05, z0: -0.2, x1: 1.6, z1: 1.55 },
    { boxes: [[sx + w / 2 + 0.1, 0.62, sz + 0.25, 0.32, Math.PI / 2]], flag: [sx - w / 2 + 0.1, 1.05, sz - 0.4] });
}

// ------------------------------------------------------------------ apiary
function apiary(level) {
  const g = group(yardGround('#93d05a'), fence(PAL.white, '#f1ece0'));
  g.add(trough(TROUGH_X, TROUGH_Z, '#7fc3ea'));   // water trough for the bees
  // honey hut (back-left)
  const hx = -0.85, hz = -1.2;
  const h = group();
  h.add(body(1.2, 0.85, 0.9, '#e7b86a', { ph: 0.12 }));
  for (let i = 0; i < 4; i++) h.add(place(box(1.22, 0.025, 0.92, '#c99245', tiny), 0, 0.3 + i * 0.16, 0));
  const r = roofX(1.2, 0.9, 0.55, '#f0a21e', { gable: '#e7b86a', rows: 2 });
  r.position.y = 0.86;
  h.add(r);
  h.add(place(box(0.36, 0.58, 0.05, PAL.woodDark, { r: 0.02 }), -0.25, 0.42, 0.46));
  h.add(place(ball(0.025, PAL.gold, tiny), -0.15, 0.42, 0.5));
  h.add(win(0.28, 0.55, 0.46, 0, { w: 0.24, h: 0.22, shutter: '#f0a21e' }));
  h.add(win(0.61, 0.55, 0, Math.PI / 2, { w: 0.24, h: 0.22 }));
  h.add(place(lantern(), 0.0, 0.7, 0.5));
  // honey pot sign on the gable
  const p = plaque(ICON.jar('#f2a81d'), { r: 0.17 });
  h.add(place(p, 0.63, 1.08, 0, Math.PI / 2));
  place(h, hx, 0, hz);
  g.add(h);
  // three box hives on stands (back-right)
  const hives = [[0.45, -1.35], [1.0, -1.35], [1.5, -1.05]];
  for (const [x, z] of hives) {
    const v = group();
    v.add(place(box(0.42, 0.12, 0.36, PAL.woodDark, { r: 0.02 }), 0, 0.06, 0));
    v.add(place(box(0.36, 0.2, 0.32, '#ffffff', { r: 0.02 }), 0, 0.22, 0));
    v.add(place(box(0.36, 0.2, 0.32, '#ffd54a', { r: 0.02 }), 0, 0.42, 0));
    v.add(place(box(0.42, 0.07, 0.38, '#f0a21e', { r: 0.02 }), 0, 0.555, 0));
    v.add(place(box(0.14, 0.03, 0.02, '#3a2416', tiny), 0, 0.15, 0.165));
    g.add(place(v, x, 0, z, x > 1.2 ? -0.5 : 0));
  }
  // straw skep on a stump
  g.add(place(cyl(0.16, 0.18, 0.22, PAL.wood), 1.5, 0.11, -0.4));
  const skep = mesh(GEO.sphere(0.2, 12, 8), M(PAL.thatch));
  skep.scale.set(1, 1.15, 1); skep.position.set(1.5, 0.3, -0.4);
  g.add(skep);
  for (let i = 0; i < 2; i++) {
    const ring = mesh(GEO.torus(0.19 - i * 0.05, 0.02, 5, 14), M('#c9922f'), tiny);
    ring.rotation.x = Math.PI / 2; ring.position.set(1.5, 0.3 + i * 0.13, -0.4);
    g.add(ring);
  }
  // meadow flowers
  const cols = ['#ff6fa3', '#ffd54a', '#ffffff', '#c36ae0', '#ff8a3d'];
  const lm = leafMat(PAL.leaf);
  const fl = [[-0.6, 0.2], [-0.2, 0.9], [0.3, 0.3], [0.8, 0.9], [1.3, 0.4], [0.1, 1.45], [1.1, 1.5], [-0.75, 1.35], [0.6, -0.35], [-0.3, -0.4], [1.55, 0.95], [-1.6, -0.3]];
  fl.forEach(([x, z], i) => {
    g.add(place(cone(0.06, 0.12, lm, { seg: 5, shadow: false }), x, 0.08, z));
    g.add(place(ball(0.045, M(cols[i % cols.length], { sway: 0.015 }), { low: true, shadow: false }), x, 0.16, z));
  });
  // buzzing bees
  const bees = [];
  const bm = M('#ffcc1a', { snow: 0 }), bk = M('#2b2b2b', { snow: 0 });
  for (let i = 0; i < 6; i++) {
    const b = group(mesh(GEO.sphere(0.03, 8, 6), bm, tiny), place(mesh(GEO.box(0.012, 0.045, 0.045), bk, tiny), 0, 0, 0));
    b.children[0].scale.set(1.3, 1, 1);
    g.add(b);
    bees.push(b);
  }
  const anchors = [hives[0], hives[1], hives[2], [1.5, -0.4], [0.3, 0.3], [0.8, 0.9]];
  const buzz = (t) => {
    for (let i = 0; i < bees.length; i++) {
      const [ax, az] = anchors[i];
      const a = t * (1.6 + i * 0.23) + i;
      bees[i].position.set(ax + Math.cos(a) * 0.25, 0.75 + Math.sin(a * 2.3) * 0.08 - (i > 3 ? 0.4 : 0), az + Math.sin(a) * 0.2);
      bees[i].rotation.y = -a;
    }
  };
  if (level >= 3) g.add(place(group(...[0, 1].map((k) => place(box(0.36, 0.2, 0.32, k ? '#ffd54a' : '#ffffff', { r: 0.02 }), 0, 0.62 + k * 0.2, 0))), 0.45, 0, -1.35));
  return finish(g, 'apiary', level,
    { x0: -1.05, z0: -0.3, x1: 1.6, z1: 1.55 },
    { boxes: [[hx + 0.28, 0.33, hz + 0.53, 0.28]], flag: [hx - 0.5, 0.9, hz - 0.35] }, buzz);
}

// ------------------------------------------------------------------ pigsty
function pigsty(level) {
  const g = group(yardGround('#b48d5a'), fence(PAL.wood, PAL.woodDark));
  g.add(trough(TROUGH_X, TROUGH_Z, '#c9a24a'));
  // mud puddle with bubbles
  const mud = cyl(0.8, 0.82, 0.03, M('#6b4426', { snow: 0.3 }), { seg: 20, shadow: false });
  mud.scale.set(1, 1, 0.7);
  g.add(place(mud, 0.45, 0.05, 0.65));
  const m2 = cyl(0.45, 0.45, 0.03, M('#5a3820', { snow: 0.3 }), { seg: 16, shadow: false });
  g.add(place(m2, 0.75, 0.06, 0.55));
  const bubbles = [0, 1, 2].map((i) => { const b = ball(0.04, M('#7a5232', { snow: 0 }), tiny); g.add(place(b, 0.2 + i * 0.35, 0.07, 0.5 + (i % 2) * 0.3)); return b; });
  // arched wooden hut (back)
  const hx = 0.15, hz = -1.1;
  const hut = group();
  // arch built from plank slabs along a half ellipse (nothing below ground)
  const R = 0.95, K = 1.25, N = 8, L = 1.2;
  const pt = (a) => [Math.cos(a) * R, Math.sin(a) * R * K];
  for (let i = 0; i < N; i++) {
    const [x0, y0] = pt((i / N) * Math.PI), [x1, y1] = pt(((i + 1) / N) * Math.PI);
    const slab = mesh(GEO.rbox(Math.hypot(x1 - x0, y1 - y0) + 0.04, 0.09, L, 0.03), M(i % 2 ? '#d0603e' : '#c4573a'));
    slab.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    slab.rotation.z = Math.atan2(y1 - y0, x1 - x0);
    hut.add(slab);
  }
  // plank ribs over the arch
  for (const z of [-0.45, 0, 0.45]) {
    const rib = mesh(GEO.torus(R + 0.03, 0.04, 6, 20, Math.PI), M(PAL.woodDark), tiny);
    rib.scale.set(1, K, 1); rib.position.z = z;
    hut.add(rib);
  }
  // front wall: stacked planks approximating the half ellipse, with an arched door
  const rowsF = 8;
  for (let i = 0; i < rowsF; i++) {
    const y = ((i + 0.5) / rowsF) * R * K;
    const w = 2 * R * Math.sqrt(Math.max(0, 1 - (y / (R * K)) ** 2)) - 0.04;
    hut.add(place(box(w, (R * K) / rowsF + 0.01, 0.05, i % 2 ? '#e3a868' : '#d99a5a', { r: 0.01 }), 0, y, L / 2 - 0.02));
  }
  hut.add(place(box(0.5, 0.42, 0.06, '#3a2416', tiny), -0.25, 0.21, L / 2 + 0.01));
  const dh = cyl(0.25, 0.25, 0.06, '#3a2416', { seg: 14, shadow: false });
  dh.rotation.x = Math.PI / 2; dh.position.set(-0.25, 0.42, L / 2 + 0.01);
  hut.add(dh);
  hut.add(win(0.4, 0.72, 0.62, 0, { w: 0.22, h: 0.22, frame: PAL.woodDark }));
  // tin chimney pipe
  hut.add(place(cyl(0.07, 0.07, 0.5, PAL.metal, { seg: 10 }), 0.45, 1.25, -0.2));
  hut.add(place(cone(0.13, 0.1, PAL.metal, { seg: 10 }), 0.45, 1.53, -0.2));
  // heart plaque
  const heart = group(place(ball(0.06, '#f48fb1', tiny), -0.045, 0.02, 0), place(ball(0.06, '#f48fb1', tiny), 0.045, 0.02, 0));
  const ht = cone(0.085, 0.12, '#f48fb1', tiny); ht.rotation.z = Math.PI; ht.position.y = -0.06; heart.add(ht);
  hut.add(place(plaque(heart, { r: 0.15 }), 0, 1.0, 0.65));
  place(hut, hx, 0, hz);
  hut.scale.setScalar(1.12);
  g.add(hut);
  for (const [x, z] of [[1.4, 1.3], [-0.6, 1.4], [1.5, 0.0], [-0.8, -0.2]]) g.add(tuft(x, z, '#7aa83a'));
  g.add(hayBale(-1.45, -0.6, 0.3));
  if (level >= 3) g.add(hayBale(-1.45, -1.05, 0));
  const anim = (t) => {
    for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; bubbles[i].scale.setScalar(Math.sin(ph * Math.PI) + 0.01); }
  };
  return finish(g, 'pigsty', level,
    { x0: -1.05, z0: 0.0, x1: 1.6, z1: 1.55 },
    { boxes: [[hx + 0.4, 0.5, hz + 0.68, 0.3]], flag: [hx - 0.75, 0.9, hz] }, anim);
}

// ------------------------------------------------------------------ goatpen
function goatpen(level) {
  const g = group(yardGround('#c2b07c'), fence());
  g.add(trough(TROUGH_X, TROUGH_Z, '#a8cf52'));
  // rocky hill (back-left): stacked flat-shaded boulders
  const rk = (r, x, y, z, c = '#a8a49a', sy = 0.75) => {
    const m = mesh(GEO.ico(r, 0), M(c, { flat: true }));
    m.position.set(x, y, z); m.scale.set(1, sy, 1); m.rotation.y = x * 3 + z;
    g.add(m);
  };
  rk(0.6, -1.05, 0.25, -1.1); rk(0.5, -0.35, 0.18, -1.28, '#97938a'); rk(0.45, -1.35, 0.2, -0.45, '#b8b4aa');
  rk(0.42, -0.85, 0.65, -1.2, '#b8b4aa'); rk(0.32, -0.45, 0.5, -1.0); rk(0.3, -1.15, 1.0, -1.3, '#97938a', 0.85);
  rk(0.2, -0.9, 1.25, -1.1, '#c3bfb5', 0.9);
  // little bushes on the rocks
  const lm = leafMat(PAL.leafDark);
  g.add(place(ball(0.14, lm, { low: true }), -0.3, 0.6, -0.8));
  g.add(place(ball(0.12, lm, { low: true }), -1.5, 0.45, -0.75));
  // shed (back-right)
  const sx = 0.95, sz = -1.15;
  const s = group();
  s.add(body(1.4, 0.85, 1.0, '#d9b98a', { ph: 0.14 }));
  for (let i = 0; i < 4; i++) s.add(place(box(1.42, 0.025, 1.02, '#b8925e', tiny), 0, 0.3 + i * 0.16, 0));
  const r = roofX(1.4, 1.0, 0.55, PAL.roofGreen, { gable: '#d9b98a', rows: 2 });
  r.position.y = 0.86;
  s.add(r);
  s.add(place(box(0.5, 0.62, 0.04, '#3a2416', { r: 0.02 }), -0.2, 0.43, 0.51));
  s.add(beams([[-0.45, 0.14, -0.45, 0.74], [0.05, 0.14, 0.05, 0.74], [-0.45, 0.74, 0.05, 0.74], [-0.45, 0.14, 0.05, 0.74]], 0.53, PAL.white, 0.05));
  s.add(win(0.38, 0.55, 0.51, 0, { w: 0.22, h: 0.22, shutter: PAL.roofGreen }));
  s.add(win(0.71, 0.55, 0, Math.PI / 2, { w: 0.24, h: 0.22 }));
  place(s, sx, 0, sz);
  g.add(s);
  for (const [x, z] of [[0.6, 0.4], [1.3, 1.2], [-0.3, 1.1], [1.5, 0.2]]) g.add(tuft(x, z, '#8aa83a'));
  if (level >= 3) g.add(hayBale(sx + 0.55, sz + 0.8, 0.4));
  return finish(g, 'goatpen', level,
    { x0: -1.05, z0: -0.4, x1: 1.6, z1: 1.55 },
    { boxes: [[sx + 0.38, 0.33, sz + 0.58, 0.28]], flag: [-1.15, 1.25, -1.3] });
}

// ------------------------------------------------------------------ duckhouse
function duckhouse(level) {
  const g = group(yardGround('#a6d06a'), fence(PAL.white, '#f1ece0'));
  g.add(trough(TROUGH_X, TROUGH_Z, '#e8c45a'));
  // pond with stone rim
  const px = 0.45, pz = 0.5, pr = 0.82;
  g.add(place(cyl(pr + 0.08, pr + 0.1, 0.05, '#7a6a4a', { seg: 24, shadow: false }), px, 0.04, pz));
  g.add(place(cyl(pr, pr, 0.04, M(PAL.water, { snow: 0 }), { seg: 24, shadow: false }), px, 0.075, pz));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const st = mesh(GEO.ico(0.11, 0), M(i % 2 ? PAL.stone : '#c3bfb5', { flat: true }));
    st.position.set(px + Math.cos(a) * (pr + 0.04), 0.07, pz + Math.sin(a) * (pr + 0.04));
    st.scale.set(1, 0.6, 1); st.rotation.y = a;
    g.add(st);
  }
  // lily pads + reeds
  for (const [x, z] of [[0.25, 0.25], [0.75, 0.75]]) {
    g.add(place(cyl(0.11, 0.11, 0.015, leafMat('#4caf50', { evergreen: true }), { seg: 12, shadow: false }), px + x - 0.5, 0.1, pz + z - 0.5));
  }
  g.add(place(ball(0.04, '#ff9ec4', tiny), px + 0.25, 0.13, pz + 0.27));
  for (const [x, z, h] of [[1.15, -0.1, 0.5], [1.22, 0.05, 0.42], [1.05, -0.2, 0.38]]) {
    g.add(place(cyl(0.012, 0.015, h, leafMat('#5e9d3a'), { seg: 5, shadow: false }), x, h / 2, z));
    g.add(place(capsuleV(0.03, 0.08, '#7a4a2a'), x, h, z));
  }
  // ripples
  const ripples = [0, 1].map(() => {
    const rr = mesh(GEO.torus(0.2, 0.012, 4, 24), M('#d8f1ff', { snow: 0, transparent: true, opacity: 0.8 }), { shadow: false, receive: false });
    rr.rotation.x = Math.PI / 2; rr.position.set(px - 0.15, 0.1, pz + 0.1);
    g.add(rr);
    return rr;
  });
  // A-frame duck hut (back-left) on a deck
  const hx = -0.85, hz = -1.15;
  const h = group();
  h.add(place(box(1.4, 0.12, 1.2, PAL.plank, { r: 0.03 }), 0, 0.12, 0));
  for (const [x, z] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]]) h.add(place(box(0.08, 0.12, 0.08, PAL.woodDark), x, 0.03, z));
  h.add(place(box(1.1, 0.35, 0.9, '#e9f3fb', { r: 0.03 }), 0, 0.35, 0));
  const r = roofZ(1.1, 0.9, 0.95, PAL.roofBlue, { gable: '#e9f3fb', rows: 3, over: 0.12 });
  r.position.y = 0.52;
  h.add(r);
  const dh = cyl(0.17, 0.17, 0.04, '#2f2a3a', { seg: 14 });
  dh.rotation.x = Math.PI / 2; dh.position.set(0, 0.48, 0.46);
  h.add(dh);
  h.add(place(box(0.34, 0.18, 0.04, '#2f2a3a', tiny), 0, 0.33, 0.46));
  h.add(place(mesh(GEO.torus(0.18, 0.025, 6, 16, Math.PI), M(PAL.white), tiny), 0, 0.48, 0.48));
  h.add(win(0, 0.92, 0.46, 0, { w: 0.16, h: 0.16, cross: false }));
  // little ramp to the yard
  const ramp = box(0.32, 0.03, 0.5, PAL.plank, { r: 0.01 });
  ramp.position.set(0, 0.1, 0.82); ramp.rotation.x = 0.33;
  h.add(ramp);
  place(h, hx, 0, hz);
  g.add(h);
  // feather plaque on a post
  g.add(place(box(0.06, 0.7, 0.06, PAL.wood, { r: 0.02 }), 0.6, 0.35, -1.45));
  const fea = group(place(capsuleV(0.05, 0.16, '#ffffff'), 0, 0, 0));
  fea.children[0].rotation.z = 0.6; fea.add(place(box(0.01, 0.2, 0.01, '#c9ced4', tiny), 0.02, -0.03, 0.02, 0));
  fea.children[1].rotation.z = 0.6;
  g.add(place(plaque(fea, { r: 0.16 }), 0.6, 0.8, -1.4));
  if (level >= 3) g.add(hayBale(1.3, -1.35, 0.1));
  const anim = (t) => {
    for (let i = 0; i < 2; i++) {
      const ph = (t * 0.35 + i * 0.5) % 1;
      const r0 = ripples[i];
      r0.scale.setScalar(0.4 + ph * 2.2);
      r0.visible = ph < 0.92;
    }
  };
  return finish(g, 'duckhouse', level,
    { x0: -1.05, z0: -0.3, x1: 1.6, z1: 1.55 },
    { boxes: [[hx, 0.22, hz + 0.66, 0.4]], flag: [hx + 0.55, 0.15, hz - 0.45] }, anim);
}

/** Small vertical capsule (cattails, feathers). */
function capsuleV(r, len, color) {
  return mesh(GEO.capsule(r, len, 4, 8), M(color), tiny);
}

// ------------------------------------------------------------------ public API
const MAKERS = { coop, cowshed, sheepfold, apiary, pigsty, goatpen, duckhouse };

export function makeHousing(key, level = 1) {
  const f = MAKERS[key];
  if (!f) throw new Error('Unknown housing: ' + key);
  return f(Math.max(1, Math.min(3, level)));
}

export const FARM_CATALOG = {
  ...Object.fromEntries(Object.keys(MAKERS).map((k) => ['housing_' + k, () => makeHousing(k, 1)])),
  housing_coop_lvl3: () => makeHousing('coop', 3),
  housing_cowshed_lvl3: () => makeHousing('cowshed', 3),
};
