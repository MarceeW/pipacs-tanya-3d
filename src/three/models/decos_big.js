// 2x2 decorations: hay cart, pond, gazebo, fountain, tractor and decorative windmill.
import { PAL, M, leafMat, box, cyl, cone, ball, capsule, mesh, GEO, group, place, windowPane, door, blobShadow } from '../lib.js';
import { wheel } from './decos_props.js';

// ------------------------------------------------------------------ hay cart
export function makeCart() {
  const g = group();
  const c = group();
  g.add(c);
  c.rotation.y = -0.35;
  // bed
  c.add(place(box(0.95, 0.08, 1.25, PAL.woodDark, { r: 0.03 }), 0, 0.42, -0.1));
  for (const s of [-1, 1]) {
    for (const y of [0.53, 0.66]) c.add(place(box(0.06, 0.1, 1.25, y > 0.6 ? PAL.plank : PAL.wood, { r: 0.025 }), s * 0.47, y, -0.1));
    for (const z of [-0.65, 0.0, 0.47]) c.add(place(box(0.07, 0.36, 0.07, PAL.woodDark, { r: 0.02 }), s * 0.5, 0.58, z));
  }
  c.add(place(box(0.95, 0.24, 0.06, PAL.wood, { r: 0.025 }), 0, 0.58, -0.72));
  c.add(place(box(0.95, 0.24, 0.06, PAL.plank, { r: 0.025 }), 0, 0.58, 0.52));
  // hay pile
  const hay = [PAL.thatch, '#f2cd78', '#d9a548'];
  const clumps = [[-0.2, 0.7, -0.4, 0.32], [0.2, 0.72, -0.3, 0.3], [0, 0.82, -0.1, 0.34], [-0.22, 0.7, 0.15, 0.28], [0.22, 0.7, 0.2, 0.27], [0.02, 0.92, -0.32, 0.22]];
  clumps.forEach(([x, y, z, r], i) => c.add(place(ball(r, hay[i % 3], { low: true, scale: [1, 0.75, 1] }), x, y, z, i)));
  for (let i = 0; i < 4; i++) {
    const t = cone(0.025, 0.16, '#f2cd78', { seg: 4, shadow: false });
    t.rotation.z = (i - 1.5) * 0.5;
    c.add(place(t, (i - 1.5) * 0.15, 1.04, -0.15));
  }
  // big wheels
  for (const s of [-1, 1]) {
    const w = wheel(0.32, 0.045, 4, PAL.woodDark, PAL.wood);
    w.rotation.y = Math.PI / 2;
    c.add(place(w, s * 0.56, 0.36, -0.15, Math.PI / 2));
  }
  const axle = cyl(0.03, 0.03, 1.12, PAL.woodDark, { seg: 6 });
  axle.rotation.z = Math.PI / 2;
  c.add(place(axle, 0, 0.36, -0.15));
  // shafts to the front + prop stand
  for (const s of [-1, 1]) {
    const sh = box(0.05, 0.05, 0.6, PAL.wood, { r: 0.015 });
    sh.rotation.x = 0.35;
    c.add(place(sh, s * 0.3, 0.32, 0.8));
  }
  c.add(place(box(0.05, 0.22, 0.05, PAL.woodDark, { r: 0.015 }), 0, 0.12, 0.85));
  c.add(place(box(0.65, 0.05, 0.05, PAL.wood, { r: 0.015 }), 0, 0.24, 0.85));
  // pumpkin + sack riding along
  c.add(place(ball(0.12, '#ff8a1c', { scale: [1, 0.8, 1] }), 0.3, 0.7, 0.38));
  c.add(place(capsule(0.1, 0.12, '#e8dcc0'), -0.28, 0.66, 0.36));
  g.add(blobShadow(0.95));
  return g;
}

// ------------------------------------------------------------------ pond
export function makePond(seed = 0) {
  const g = group();
  const RX = 0.78, RZ = 0.66;
  g.add(place(mesh(GEO.circle(1), '#6a5a3e', { shadow: false, scale: [RX + 0.04, 1, RZ + 0.04] }), 0, 0.012, 0));
  const water = mesh(GEO.circle(1, 32), M('#4fb3e8', { snow: 0 }), { shadow: false, scale: [RX, 1, RZ] });
  water.position.y = 0.035;
  g.add(water);
  g.add(place(mesh(GEO.circle(1, 32), M('#3a98d0', { snow: 0 }), { shadow: false, scale: [RX * 0.6, 1, RZ * 0.55] }), -0.05, 0.037, -0.03));
  // stone rim
  const N = 16;
  const sc = [PAL.stone, '#bdbdb5', PAL.stoneDark, '#c9c4b5'];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const s = 0.1 + ((i * 7 + seed) % 3) * 0.02;
    g.add(place(ball(s, sc[i % 4], { low: true, scale: [1.3, 0.6, 1] }), Math.sin(a) * (RX + 0.06), 0.05, Math.cos(a) * (RZ + 0.06), -a + Math.PI / 2));
  }
  // lily pads with one blossom
  const pad = leafMat('#4fae3c', { snow: 0 });
  const pads = [[0.28, 0.15, 0.11], [-0.32, 0.2, 0.09], [0.1, -0.3, 0.1], [0.38, -0.12, 0.07]];
  const padMeshes = [];
  for (const [x, z, r] of pads) {
    const p = mesh(GEO.cyl(r, r, 0.012, 14), pad, { shadow: false });
    p.position.set(x, 0.045, z);
    g.add(p);
    padMeshes.push(p);
  }
  g.add(place(cone(0.05, 0.06, M('#ff9ac2', { snow: 0 }), { seg: 6 }), 0.28, 0.08, 0.15));
  g.add(place(ball(0.02, PAL.gold, { shadow: false }), 0.28, 0.1, 0.15));
  // frog on a pad
  const frog = group();
  frog.add(ball(0.05, '#6cc04a', { scale: [1, 0.75, 1.1] }));
  for (const s of [-1, 1]) {
    frog.add(place(ball(0.022, PAL.white, { shadow: false }), s * 0.025, 0.035, 0.025));
    frog.add(place(ball(0.011, PAL.black, { shadow: false }), s * 0.027, 0.04, 0.042));
  }
  frog.position.set(-0.32, 0.08, 0.2);
  g.add(frog);
  // reeds + cattails at the back left
  const reed = M('#5e9a3a', { sway: 0.03 }), tail = M('#7a4f2a', { sway: 0.03 });
  for (const [x, z, h] of [[-0.62, -0.38, 0.6], [-0.52, -0.48, 0.5], [-0.7, -0.22, 0.45], [0.6, -0.42, 0.42]]) {
    g.add(place(cyl(0.012, 0.016, h, reed, { seg: 5 }), x, h / 2, z));
    g.add(place(capsule(0.025, 0.08, tail), x, h - 0.02, z));
  }
  for (const [x, z] of [[-0.6, -0.3], [0.62, -0.34]]) g.add(place(ball(0.12, leafMat('#5fb64a'), { low: true, scale: [1, 0.6, 1] }), x, 0.05, z));
  // ripple rings
  const ringMat = M('#e8f7ff', { transparent: true, opacity: 0.55, snow: 0 });
  const rings = [0, 1].map((i) => {
    const r = mesh(GEO.torus(1, 0.012, 3, 28), ringMat, { shadow: false, receive: false });
    r.rotation.x = -Math.PI / 2;
    r.position.set(i ? 0.15 : -0.12, 0.04, i ? -0.1 : 0.05);
    g.add(r);
    return r;
  });
  g.userData.anim = (t) => {
    rings.forEach((r, i) => {
      const p = (t * 0.35 + i * 0.5) % 1;
      const s = 0.05 + p * 0.28;
      r.scale.set(s, s * 0.85, 1);
      r.visible = p < 0.92;
    });
    padMeshes.forEach((p, i) => { p.rotation.y = Math.sin(t * 0.4 + i) * 0.25; p.position.y = 0.045 + Math.sin(t * 1.3 + i * 2) * 0.004; });
    frog.position.y = 0.08 + Math.max(0, Math.sin(t * 1.1)) * 0.012;
  };
  return g;
}

// ------------------------------------------------------------------ gazebo
export function makeGazebo() {
  const g = group();
  const white = '#fbfaf2', roofC = '#d9483b';
  const R = 0.78, oct = Math.PI / 8;
  const base = cyl(0.9, 0.92, 0.12, PAL.woodLight, { seg: 8 });
  g.add(place(base, 0, 0.06, 0, oct));
  g.add(place(cyl(0.84, 0.84, 0.02, PAL.plank, { seg: 8 }), 0, 0.13, 0, oct));
  g.add(place(box(0.5, 0.06, 0.18, PAL.woodLight, { r: 0.02 }), 0, 0.03, 0.95));
  const angs = [...Array(8)].map((_, i) => (i + 0.5) * Math.PI / 4);
  for (const a of angs) g.add(place(box(0.08, 1.0, 0.08, white, { r: 0.02 }), Math.sin(a) * R, 0.62, Math.cos(a) * R, a));
  const chord = 2 * R * Math.sin(Math.PI / 8);
  for (let i = 0; i < 7; i++) {
    const m = (i + 1) * Math.PI / 4;
    const x = Math.sin(m) * R * Math.cos(Math.PI / 8), z = Math.cos(m) * R * Math.cos(Math.PI / 8);
    g.add(place(box(chord - 0.06, 0.05, 0.06, white, { r: 0.015 }), x, 0.52, z, m));
    g.add(place(box(chord - 0.1, 0.26, 0.015, '#f1e8d4', { r: 0.006 }), x, 0.32, z, m));
  }
  // eaves + roof + finial
  g.add(place(cyl(0.98, 0.98, 0.08, white, { seg: 8 }), 0, 1.15, 0, oct));
  g.add(place(cone(1.05, 0.62, roofC, { seg: 8 }), 0, 1.5, 0, oct));
  g.add(place(cone(0.5, 0.3, '#a8322a', { seg: 8 }), 0, 1.68, 0, oct));
  g.add(place(ball(0.06, PAL.gold), 0, 1.85, 0));
  // front arch trim
  g.add(place(box(chord, 0.1, 0.05, white, { r: 0.02 }), 0, 1.05, R * Math.cos(Math.PI / 8)));
  // round table inside with a teapot
  g.add(place(cyl(0.03, 0.04, 0.38, PAL.woodDark, { seg: 6 }), 0, 0.32, -0.05));
  g.add(place(cyl(0.22, 0.22, 0.04, PAL.wood, { seg: 14 }), 0, 0.52, -0.05));
  g.add(place(ball(0.06, '#5aa9ff', { scale: [1, 0.8, 1] }), 0.05, 0.58, -0.05));
  // climbing roses on two posts
  const lm = leafMat('#3e9c45');
  for (const a of [angs[0], angs[7]]) {
    for (const y of [0.3, 0.6, 0.9]) g.add(place(ball(0.08, lm, { low: true }), Math.sin(a) * (R + 0.03), y, Math.cos(a) * (R + 0.03)));
    g.add(place(ball(0.04, M('#ff6f91', { sway: 0.02 }), { shadow: false }), Math.sin(a) * (R + 0.09), 0.62, Math.cos(a) * (R + 0.09)));
  }
  g.add(blobShadow(1.0, 0.18));
  return g;
}

// ------------------------------------------------------------------ fountain
export function makeFountain() {
  const g = group();
  const stone = '#d8d3c4', stone2 = '#bfb9aa';
  const water = M('#4fb3e8', { snow: 0 });
  const spray = M('#bfe6ff', { transparent: true, opacity: 0.6, snow: 0 });
  const basin = [[0, 0], [0.86, 0], [0.9, 0.04], [0.9, 0.26], [0.86, 0.3], [0.78, 0.3], [0.76, 0.26], [0.76, 0.08], [0, 0.08]];
  g.add(mesh(GEO.lathe('fbasin', basin, 24), stone));
  g.add(place(mesh(GEO.circle(0.77, 24), water, { shadow: false }), 0, 0.22, 0));
  const col = [[0, 0], [0.16, 0], [0.12, 0.08], [0.09, 0.3], [0.1, 0.5], [0.14, 0.56], [0, 0.56]];
  g.add(place(mesh(GEO.lathe('fcol', col, 12), stone2), 0, 0.08, 0));
  const bowl = [[0, 0], [0.08, 0], [0.22, 0.06], [0.36, 0.14], [0.38, 0.18], [0.34, 0.18], [0.2, 0.1], [0, 0.1]];
  g.add(place(mesh(GEO.lathe('fbowl', bowl, 18), stone), 0, 0.62, 0));
  g.add(place(mesh(GEO.circle(0.33, 18), water, { shadow: false }), 0, 0.78, 0));
  g.add(place(cyl(0.05, 0.07, 0.25, stone2, { seg: 10 }), 0, 0.88, 0));
  g.add(place(mesh(GEO.lathe('fbowl2', [[0, 0], [0.04, 0], [0.13, 0.06], [0.15, 0.09], [0.12, 0.09], [0, 0.05]], 14), stone), 0, 1.0, 0));
  g.add(place(ball(0.04, '#5aa9ff', { shadow: false }), 0, 1.1, 0));
  // falling water curtain from the upper bowl
  const curtain = mesh(GEO.cyl(0.37, 0.46, 0.55, 18), spray, { shadow: false, receive: false });
  g.add(place(curtain, 0, 0.5, 0));
  // jets arching up from the top
  const drops = [];
  const dgeo = GEO.sphere(0.03, 6, 4);
  for (let a = 0; a < 6; a++) for (let k = 0; k < 4; k++) {
    const d = mesh(dgeo, spray, { shadow: false, receive: false });
    g.add(d);
    drops.push({ d, a: (a / 6) * Math.PI * 2, k });
  }
  // ripples in the basin
  const ringMat = M('#e8f7ff', { transparent: true, opacity: 0.55, snow: 0 });
  const rings = [0, 1, 2].map(() => {
    const r = mesh(GEO.torus(1, 0.012, 3, 28), ringMat, { shadow: false, receive: false });
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.23;
    g.add(r);
    return r;
  });
  // flower pots at the base
  for (const [x, z] of [[0.82, 0.55], [-0.75, 0.62]]) {
    g.add(place(cyl(0.1, 0.07, 0.14, '#c0583a', { seg: 10 }), x, 0.07, z));
    g.add(place(ball(0.1, leafMat('#4caf50'), { low: true }), x, 0.2, z));
    g.add(place(ball(0.035, M('#ff5a7a', { sway: 0.02 }), { shadow: false }), x + 0.04, 0.28, z + 0.04));
  }
  g.add(blobShadow(1.0, 0.18));
  g.userData.anim = (t) => {
    curtain.scale.set(1 + Math.sin(t * 6) * 0.015, 1, 1 + Math.cos(t * 6) * 0.015);
    for (const { d, a, k } of drops) {
      const u = (k / 4 + t * 0.8) % 1;
      const r = u * 0.32;
      d.position.set(Math.sin(a) * r, 1.12 + u * 0.35 - u * u * 0.6, Math.cos(a) * r);
    }
    rings.forEach((r, i) => {
      const p = (t * 0.4 + i / 3) % 1;
      const s = 0.48 + p * 0.27;
      r.scale.set(s, s, 1);
    });
  };
  return g;
}

// ------------------------------------------------------------------ tractor
export function makeTractor() {
  const g = group();
  const c = group();
  g.add(c);
  c.rotation.y = -0.25;
  const red = '#e23b3b', dark = '#2f2f2f', hub = '#ffc83d';
  const tire = (r, tube, x, y, z, w) => {
    const t = mesh(GEO.torus(r, tube, 8, 20), dark);
    t.rotation.y = Math.PI / 2;
    c.add(place(t, x, y, z, Math.PI / 2));
    t.scale.set(1, 1, w);
    const h = cyl(r * 0.85, r * 0.85, tube * 1.4, hub, { seg: 14 });
    h.rotation.z = Math.PI / 2;
    c.add(place(h, x, y, z));
    const cap = cyl(r * 0.3, r * 0.3, tube * 1.7, red, { seg: 10 });
    cap.rotation.z = Math.PI / 2;
    c.add(place(cap, x, y, z));
  };
  tire(0.27, 0.12, -0.5, 0.39, -0.35, 1.3);
  tire(0.27, 0.12, 0.5, 0.39, -0.35, 1.3);
  tire(0.13, 0.07, -0.36, 0.2, 0.5, 1.2);
  tire(0.13, 0.07, 0.36, 0.2, 0.5, 1.2);
  // chassis + hood
  c.add(place(box(0.5, 0.18, 1.3, '#4a4a4a', { r: 0.05 }), 0, 0.3, 0.05));
  c.add(place(box(0.5, 0.36, 0.72, red, { r: 0.1 }), 0, 0.55, 0.34));
  c.add(place(box(0.44, 0.28, 0.06, '#3a3a3a', { r: 0.03 }), 0, 0.53, 0.71));
  for (let i = 0; i < 3; i++) c.add(place(box(0.36, 0.025, 0.03, PAL.metal, { shadow: false }), 0, 0.45 + i * 0.08, 0.745));
  for (const s of [-1, 1]) c.add(place(ball(0.055, M('#fff6c8', { emissive: '#ffe08a', glow: true }), { shadow: false }), s * 0.17, 0.66, 0.71));
  // exhaust pipe
  c.add(place(cyl(0.035, 0.035, 0.4, PAL.metal, { seg: 8 }), 0.14, 0.88, 0.5));
  c.add(place(cyl(0.045, 0.035, 0.06, '#5f6870', { seg: 8 }), 0.14, 1.09, 0.5));
  // cabin area: seat, steering wheel, rear fenders
  c.add(place(box(0.52, 0.2, 0.55, red, { r: 0.06 }), 0, 0.48, -0.32));
  for (const s of [-1, 1]) c.add(place(box(0.26, 0.06, 0.62, red, { r: 0.03 }), s * 0.5, 0.72, -0.35));
  c.add(place(box(0.3, 0.06, 0.26, '#2f2f2f', { r: 0.03 }), 0, 0.62, -0.38));
  c.add(place(box(0.3, 0.24, 0.06, '#2f2f2f', { r: 0.03 }), 0, 0.75, -0.53));
  const steer = cyl(0.02, 0.02, 0.32, '#3a3a3a', { seg: 6 });
  steer.rotation.x = -0.5;
  c.add(place(steer, 0, 0.82, -0.05));
  const sw = mesh(GEO.torus(0.09, 0.016, 5, 16), '#2f2f2f', { shadow: false });
  sw.rotation.x = -Math.PI / 2 + 0.6;
  c.add(place(sw, 0, 0.96, -0.12));
  // canopy roof on 4 posts
  for (const [x, z] of [[-0.25, -0.6], [0.25, -0.6], [-0.25, -0.05], [0.25, -0.05]]) c.add(place(box(0.04, 0.72, 0.04, '#3a3a3a', { shadow: false }), x, 1.0, z));
  c.add(place(box(0.66, 0.06, 0.72, PAL.white, { r: 0.03 }), 0, 1.38, -0.33));
  c.add(place(box(0.7, 0.03, 0.76, red, { r: 0.015 }), 0, 1.34, -0.33));
  // tow hitch
  c.add(place(box(0.12, 0.06, 0.18, '#4a4a4a', { r: 0.02 }), 0, 0.3, -0.72));
  g.add(blobShadow(0.95));
  return g;
}

// ------------------------------------------------------------------ decorative windmill
export function makeWindmill() {
  const g = group();
  const wall = PAL.wall, roofC = PAL.roofRed;
  g.add(place(cyl(0.7, 0.74, 0.16, PAL.stone, { seg: 8 }), 0, 0.08, 0, Math.PI / 8));
  g.add(place(mesh(GEO.lathe('wmtower', [[0, 0], [0.64, 0], [0.54, 0.8], [0.44, 1.45], [0, 1.45]], 8), wall), 0, 0.14, 0, Math.PI / 8));
  g.add(place(cyl(0.49, 0.49, 0.08, PAL.woodDark, { seg: 8 }), 0, 1.59, 0, Math.PI / 8));
  g.add(place(cone(0.58, 0.55, roofC, { seg: 8 }), 0, 1.9, 0, Math.PI / 8));
  g.add(place(ball(0.07, PAL.gold), 0, 2.2, 0));
  // door, windows, flower box
  g.add(place(door(0.3, 0.46, '#7a4f2a'), 0, 0.16, 0.6));
  const win = windowPane(0.18, 0.2, PAL.white);
  win.rotation.x = -0.12;
  g.add(place(win, 0, 1.05, 0.5));
  const side = windowPane(0.16, 0.18, PAL.white);
  side.rotation.x = 0;
  g.add(place(side, 0.53, 0.72, 0.0, Math.PI / 2));
  g.add(place(box(0.28, 0.07, 0.08, PAL.woodDark, { r: 0.02 }), 0, 0.92, 0.55));
  for (const [x, c] of [[-0.08, '#ff5a7a'], [0, '#ffd23f'], [0.08, '#ff5a7a']]) g.add(place(ball(0.04, M(c, { sway: 0.02 }), { shadow: false }), x, 0.98, 0.56));
  // sails
  const hubY = 1.64, hubZ = 0.56;
  g.add(place(cyl(0.05, 0.05, 0.2, PAL.woodDark, { seg: 8, rot: [Math.PI / 2, 0, 0] }), 0, hubY, hubZ - 0.08));
  const sails = group();
  sails.position.set(0, hubY, hubZ);
  g.add(sails);
  for (let i = 0; i < 4; i++) {
    const arm = group();
    arm.rotation.z = (i * Math.PI) / 2 + Math.PI / 4;
    arm.add(place(box(0.05, 0.9, 0.04, PAL.woodDark, { r: 0.01 }), 0, 0.48, 0));
    arm.add(place(box(0.2, 0.62, 0.02, i % 2 ? '#fff8e1' : '#ffe0d6', { r: 0.01 }), 0.12, 0.6, -0.01));
    for (const y of [0.4, 0.6, 0.8]) arm.add(place(box(0.22, 0.02, 0.03, PAL.wood, { shadow: false }), 0.12, y, 0.01));
    sails.add(arm);
  }
  sails.add(place(ball(0.08, roofC), 0, 0, 0.04));
  // bush at the base
  g.add(place(ball(0.17, leafMat('#4caf50'), { low: true }), 0.55, 0.14, 0.5));
  g.add(place(ball(0.13, leafMat('#5fbf4f'), { low: true }), -0.58, 0.12, 0.45));
  g.add(blobShadow(0.9));
  g.userData.anim = (t) => { sails.rotation.z = -t * 0.9; };
  return g;
}
