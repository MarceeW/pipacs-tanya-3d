// Small 1x1 garden props: scarecrow, barrel, bench, lamp, mailbox, well, birdhouse,
// wheelbarrow, swing, gnome, sprinkler, wind wheel and golden statue.
import { PAL, M, leafMat, box, cyl, cone, ball, capsule, mesh, GEO, group, place, gableRoof, blobShadow } from '../lib.js';

/** Spoked wheel facing +z (axle along z). */
export function wheel(r, tube, spokes, rim, hub) {
  const g = group();
  g.add(mesh(GEO.torus(r, tube, 6, 18), rim));
  for (let i = 0; i < spokes; i++) {
    const s = box(0.03, r * 2 - tube, 0.025, rim, { shadow: false });
    s.rotation.z = (i * Math.PI) / spokes;
    g.add(s);
  }
  const h = cyl(r * 0.22, r * 0.22, 0.08, hub, { seg: 10 });
  h.rotation.x = Math.PI / 2;
  g.add(h);
  return g;
}

// ------------------------------------------------------------------ scarecrow
export function makeScarecrow() {
  const g = group();
  g.add(place(cyl(0.035, 0.045, 1.0, PAL.woodDark, { seg: 7 }), 0, 0.5, -0.03));
  const up = group();
  g.add(up);
  const shirt = '#4f86c6', patch = '#f2c94c', pants = '#7a5a3a', straw = PAL.thatch;
  // legs + pants
  for (const s of [-1, 1]) {
    up.add(place(box(0.11, 0.3, 0.11, pants, { r: 0.03 }), s * 0.07, 0.42, 0));
    up.add(place(cone(0.05, 0.1, straw, { seg: 5, shadow: false, rot: [Math.PI, 0, 0] }), s * 0.07, 0.24, 0));
  }
  // shirt body + patches
  up.add(place(box(0.3, 0.32, 0.2, shirt, { r: 0.06 }), 0, 0.72, 0));
  up.add(place(box(0.09, 0.08, 0.02, patch, { r: 0.01, shadow: false }), 0.07, 0.68, 0.1, 0.2));
  up.add(place(box(0.07, 0.07, 0.02, '#e05a4a', { r: 0.01, shadow: false }), -0.08, 0.79, 0.1, -0.3));
  up.add(place(box(0.32, 0.04, 0.21, '#6b4226', { r: 0.015, shadow: false }), 0, 0.58, 0));
  // arms on the crossbar
  const bar = cyl(0.028, 0.028, 0.78, PAL.woodDark, { seg: 6 });
  bar.rotation.z = Math.PI / 2;
  up.add(place(bar, 0, 0.82, -0.02));
  for (const s of [-1, 1]) {
    const sleeve = cyl(0.06, 0.07, 0.24, shirt, { seg: 8 });
    sleeve.rotation.z = Math.PI / 2;
    up.add(place(sleeve, s * 0.25, 0.82, 0));
    const hand = cone(0.05, 0.12, straw, { seg: 5, shadow: false });
    hand.rotation.z = -s * Math.PI / 2;
    up.add(place(hand, s * 0.42, 0.82, 0));
  }
  // burlap head with stitched face
  up.add(place(ball(0.13, '#e8cf9a'), 0, 1.0, 0));
  for (const s of [-1, 1]) up.add(place(ball(0.022, PAL.black, { shadow: false }), s * 0.045, 1.02, 0.115));
  up.add(place(box(0.08, 0.012, 0.01, PAL.black, { shadow: false }), 0, 0.96, 0.125));
  up.add(place(cone(0.025, 0.07, '#ff8a1c', { rot: [Math.PI / 2, 0, 0], shadow: false }), 0, 0.99, 0.15));
  // straw hat
  up.add(place(cyl(0.24, 0.25, 0.025, straw, { seg: 16 }), 0, 1.08, 0));
  up.add(place(cyl(0.11, 0.13, 0.13, straw, { seg: 12 }), 0, 1.15, 0));
  up.add(place(cyl(0.132, 0.132, 0.035, '#d9483b', { seg: 12, shadow: false }), 0, 1.11, 0));
  up.add(place(cone(0.04, 0.1, '#f2cd78', { seg: 4, shadow: false, rot: [0, 0, 0.4] }), -0.12, 0.92, 0.04));
  g.add(blobShadow(0.38));
  g.userData.anim = (t) => {
    up.rotation.z = Math.sin(t * 1.3) * 0.05;
    up.rotation.y = Math.sin(t * 0.7) * 0.08;
  };
  return g;
}

// ------------------------------------------------------------------ barrel
export function makeBarrel() {
  const g = group();
  const prof = [[0, 0], [0.2, 0], [0.235, 0.14], [0.248, 0.27], [0.235, 0.4], [0.2, 0.54], [0, 0.54]];
  g.add(place(mesh(GEO.lathe('barrel', prof, 14), PAL.wood), 0, 0, 0));
  for (const [y, rad] of [[0.07, 0.218], [0.27, 0.249], [0.47, 0.218]]) {
    const hoop = mesh(GEO.torus(rad, 0.016, 5, 20), '#5f6870', { shadow: false });
    hoop.rotation.x = Math.PI / 2;
    g.add(place(hoop, 0, y, 0));
  }
  g.add(place(cyl(0.19, 0.19, 0.02, PAL.woodDark, { seg: 14 }), 0, 0.545, 0));
  // a few apples on the lid
  for (const [x, z, c] of [[0.05, 0.03, '#e53935'], [-0.06, -0.02, '#e53935'], [0.0, -0.08, '#8bc34a']]) {
    g.add(place(ball(0.05, c), x, 0.6, z));
  }
  g.add(blobShadow(0.32));
  return g;
}

// ------------------------------------------------------------------ bench
export function makeBench() {
  const g = group();
  const iron = '#2f5a3c';
  for (let i = 0; i < 3; i++) g.add(place(box(0.84, 0.035, 0.08, i % 2 ? PAL.plank : PAL.wood, { r: 0.012 }), 0, 0.3, 0.1 - i * 0.09));
  for (let i = 0; i < 2; i++) {
    const b = box(0.84, 0.08, 0.035, i ? PAL.plank : PAL.wood, { r: 0.012 });
    b.rotation.x = -0.18;
    g.add(place(b, 0, 0.47 + i * 0.12, -0.11 - i * 0.02));
  }
  for (const s of [-1, 1]) {
    g.add(place(box(0.05, 0.3, 0.05, iron, { r: 0.015 }), s * 0.38, 0.15, 0.12));
    g.add(place(box(0.05, 0.65, 0.05, iron, { r: 0.015 }), s * 0.38, 0.32, -0.12));
    g.add(place(box(0.05, 0.04, 0.3, iron, { r: 0.015 }), s * 0.38, 0.43, 0.0));
    g.add(place(ball(0.035, iron, { shadow: false }), s * 0.38, 0.45, 0.15));
  }
  g.add(blobShadow(0.48, 0.18));
  return g;
}

// ------------------------------------------------------------------ lamp post (lantern)
export function makeLamp() {
  const g = group();
  const iron = '#2d3a33';
  const glass = M('#fff3c0', { emissive: '#ffd36b', glow: true, snow: 0 });
  g.add(place(cyl(0.13, 0.16, 0.1, PAL.stone, { seg: 8 }), 0, 0.05, 0));
  g.add(place(cyl(0.035, 0.045, 1.0, iron, { seg: 8 }), 0, 0.6, 0));
  g.add(place(cyl(0.06, 0.06, 0.05, iron, { seg: 8 }), 0, 0.22, 0));
  g.add(place(cyl(0.07, 0.05, 0.04, iron, { seg: 8 }), 0, 1.1, 0));
  // lantern
  const Y = 1.24;
  g.add(place(box(0.18, 0.2, 0.18, glass, { r: 0.02 }), 0, Y, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(place(box(0.025, 0.22, 0.025, iron, { shadow: false }), x * 0.09, Y, z * 0.09));
  g.add(place(cyl(0.13, 0.11, 0.03, iron, { seg: 4, rot: [0, Math.PI / 4, 0] }), 0, Y + 0.12, 0, Math.PI / 4));
  g.add(place(cone(0.13, 0.12, iron, { seg: 4 }), 0, Y + 0.19, 0, Math.PI / 4));
  g.add(place(ball(0.03, PAL.gold, { shadow: false }), 0, Y + 0.27, 0));
  // hanging flower basket
  g.add(place(box(0.24, 0.025, 0.025, iron, { shadow: false }), 0.12, 0.88, 0));
  g.add(place(cyl(0.08, 0.05, 0.08, PAL.woodDark, { seg: 8 }), 0.23, 0.78, 0));
  g.add(place(ball(0.08, leafMat('#4caf50'), { low: true, scale: [1, 0.6, 1] }), 0.23, 0.83, 0));
  for (const [x, z] of [[0.19, 0.05], [0.27, 0.03], [0.24, -0.05]]) g.add(place(ball(0.025, M('#ff5a7a', { sway: 0.02 }), { shadow: false }), x, 0.87, z));
  g.add(blobShadow(0.22));
  g.userData.light = { y: Y };
  return g;
}

// ------------------------------------------------------------------ mailbox
export function makeMailbox() {
  const g = group();
  g.add(place(box(0.08, 0.7, 0.08, PAL.wood, { r: 0.02 }), 0, 0.35, 0));
  g.add(place(box(0.24, 0.04, 0.38, PAL.woodDark, { r: 0.015 }), 0, 0.7, 0));
  const body = '#3f7cc4';
  g.add(place(box(0.22, 0.13, 0.36, body, { r: 0.03 }), 0, 0.785, 0));
  const top = cyl(0.11, 0.11, 0.36, body, { seg: 14 });
  top.rotation.x = Math.PI / 2;
  g.add(place(top, 0, 0.85, 0));
  // front door with a heart
  g.add(place(cyl(0.1, 0.1, 0.02, '#2f64a6', { seg: 14, rot: [Math.PI / 2, 0, 0] }), 0, 0.85, 0.182));
  g.add(place(box(0.2, 0.11, 0.02, '#2f64a6', { r: 0.008 }), 0, 0.79, 0.182));
  g.add(place(ball(0.022, PAL.gold, { shadow: false }), 0, 0.86, 0.2));
  g.add(place(ball(0.032, '#ff5a7a', { shadow: false, scale: [1, 1, 0.4] }), 0, 0.8, 0.195));
  // red flag on the +x side
  g.add(place(box(0.02, 0.2, 0.025, '#d9483b', { shadow: false }), 0.125, 0.89, -0.06));
  g.add(place(box(0.02, 0.07, 0.1, '#d9483b', { shadow: false }), 0.125, 0.96, -0.02));
  // letter sticking out
  g.add(place(box(0.12, 0.06, 0.008, PAL.cream, { shadow: false }), 0, 0.84, 0.2, 0));
  // grass tuft at the base
  g.add(place(ball(0.1, leafMat('#5fb64a'), { low: true, scale: [1, 0.5, 1] }), 0.04, 0.03, 0.04));
  g.add(blobShadow(0.25));
  return g;
}

// ------------------------------------------------------------------ well
export function makeWellDeco() {
  const g = group();
  const prof = [[0, 0], [0.36, 0], [0.38, 0.05], [0.38, 0.34], [0.33, 0.36], [0.3, 0.3], [0, 0.3]];
  g.add(mesh(GEO.lathe('wellbase', prof, 14), PAL.stone));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    g.add(place(ball(0.08, i % 2 ? PAL.stoneDark : '#bdbdb5', { low: true, scale: [1.3, 0.55, 1] }), Math.sin(a) * 0.36, 0.36, Math.cos(a) * 0.36, a));
    g.add(place(box(0.13, 0.08, 0.02, i % 2 ? '#bdbdb5' : PAL.stoneDark, { r: 0.015, shadow: false }), Math.sin(a + 0.35) * 0.382, 0.18 + (i % 2) * 0.08, Math.cos(a + 0.35) * 0.382, a + 0.35));
  }
  g.add(place(cyl(0.3, 0.3, 0.01, M('#2d6fa3', { snow: 0 }), { seg: 14 }), 0, 0.26, 0));
  for (const s of [-1, 1]) g.add(place(box(0.07, 0.72, 0.07, PAL.wood, { r: 0.02 }), s * 0.33, 0.62, 0));
  const roof = gableRoof(0.82, 0.3, 0.62, PAL.roofRed, { gableColor: PAL.wood });
  roof.position.y = 0.96; roof.rotation.y = Math.PI / 2;
  g.add(roof);
  const axle = cyl(0.03, 0.03, 0.72, PAL.woodDark, { seg: 8 });
  axle.rotation.z = Math.PI / 2;
  g.add(place(axle, 0, 0.8, 0));
  g.add(place(cyl(0.06, 0.06, 0.16, '#d7a86e', { seg: 10, rot: [0, 0, Math.PI / 2] }), 0, 0.8, 0));
  g.add(place(box(0.03, 0.14, 0.03, PAL.woodDark), 0.41, 0.74, 0));
  g.add(place(cyl(0.006, 0.006, 0.22, '#c9b38a', { seg: 4, shadow: false }), 0, 0.68, 0));
  // bucket resting on the rim
  g.add(place(cyl(0.08, 0.065, 0.12, PAL.wood, { seg: 10 }), 0.2, 0.45, 0.22));
  const handle = mesh(GEO.torus(0.07, 0.008, 4, 12, Math.PI), '#5f6870', { shadow: false });
  g.add(place(handle, 0.2, 0.5, 0.22));
  g.add(blobShadow(0.5));
  return g;
}

// ------------------------------------------------------------------ birdhouse (bird pops out)
export function makeBirdhouse(seed = 0) {
  const g = group();
  g.add(place(cyl(0.04, 0.05, 1.0, PAL.wood, { seg: 8 }), 0, 0.5, 0));
  g.add(place(ball(0.12, leafMat('#5fb64a'), { low: true, scale: [1, 0.5, 1] }), 0, 0.03, 0));
  const Y = 1.0;
  g.add(place(box(0.3, 0.06, 0.3, PAL.woodDark, { r: 0.02 }), 0, Y, 0));
  g.add(place(box(0.26, 0.28, 0.26, '#f3dfb8', { r: 0.03 }), 0, Y + 0.17, 0));
  const roof = gableRoof(0.26, 0.17, 0.26, '#4f9a4a', { overhang: 0.05, thick: 0.05, gableColor: '#f3dfb8' });
  roof.position.y = Y + 0.31;
  roof.rotation.y = Math.PI / 2;
  g.add(roof);
  g.add(place(cyl(0.055, 0.055, 0.02, '#2b1d12', { seg: 12, rot: [Math.PI / 2, 0, 0] }), 0, Y + 0.2, 0.13));
  g.add(place(cyl(0.012, 0.012, 0.08, PAL.woodDark, { seg: 5, rot: [Math.PI / 2, 0, 0], shadow: false }), 0, Y + 0.1, 0.16));
  g.add(place(ball(0.03, '#e05a4a', { shadow: false, scale: [1, 1, 0.4] }), 0, Y + 0.34, 0.14));
  // the bird
  const bird = group();
  bird.add(ball(0.05, '#f2a03d'));
  bird.add(place(ball(0.035, '#fff3d6', { shadow: false }), 0, -0.015, 0.025));
  for (const s of [-1, 1]) bird.add(place(ball(0.01, PAL.black, { shadow: false }), s * 0.025, 0.015, 0.038));
  bird.add(place(cone(0.014, 0.04, PAL.gold, { rot: [Math.PI / 2, 0, 0], shadow: false }), 0, 0.0, 0.06));
  bird.position.set(0, Y + 0.2, -0.02);
  g.add(bird);
  g.add(blobShadow(0.25));
  const off = (seed % 5) * 1.3;
  g.userData.anim = (t) => {
    const p = (t + off) % 7;
    let o = 0;
    if (p > 2 && p < 2.4) o = (p - 2) / 0.4;
    else if (p >= 2.4 && p < 5) o = 1;
    else if (p >= 5 && p < 5.4) o = 1 - (p - 5) / 0.4;
    bird.position.z = -0.04 + o * 0.17;
    bird.rotation.y = o > 0.99 ? Math.sin(t * 3) * 0.5 : 0;
    bird.position.y = Y + 0.2 + (o > 0.99 ? Math.abs(Math.sin(t * 6)) * 0.015 : 0);
  };
  return g;
}

// ------------------------------------------------------------------ wheelbarrow
export function makeWheelbarrow() {
  const g = group();
  const g2 = group();
  g.add(g2);
  g2.rotation.y = -0.5;
  const red = '#d9483b';
  // tray: bottom + sloped sides
  g2.add(place(box(0.34, 0.04, 0.42, red, { r: 0.015 }), 0, 0.3, 0));
  for (const s of [-1, 1]) {
    const side = box(0.04, 0.17, 0.5, red, { r: 0.015 });
    side.rotation.z = s * 0.35;
    g2.add(place(side, s * 0.2, 0.38, 0));
  }
  const front = box(0.42, 0.17, 0.04, red, { r: 0.015 });
  front.rotation.x = 0.5;
  g2.add(place(front, 0, 0.38, 0.25));
  g2.add(place(box(0.42, 0.17, 0.04, red, { r: 0.015 }), 0, 0.38, -0.24));
  // soil + seedlings inside
  g2.add(place(box(0.38, 0.06, 0.44, PAL.soil, { r: 0.03 }), 0, 0.42, 0));
  const lm = leafMat('#6cc04a');
  for (const [x, z] of [[-0.08, -0.08], [0.09, 0.05], [-0.05, 0.12]]) g2.add(place(ball(0.06, lm, { low: true }), x, 0.48, z));
  // wheel at the front, handles and legs at the back
  const w = wheel(0.12, 0.035, 3, '#3a3a3a', PAL.gold);
  w.rotation.y = Math.PI / 2;
  g2.add(place(w, 0, 0.15, 0.36, Math.PI / 2));
  for (const s of [-1, 1]) {
    const h = box(0.035, 0.035, 0.75, PAL.wood, { r: 0.012 });
    h.rotation.x = -0.25;
    g2.add(place(h, s * 0.13, 0.3, -0.05));
    g2.add(place(box(0.035, 0.24, 0.035, PAL.woodDark, { r: 0.01 }), s * 0.12, 0.12, -0.18));
  }
  g.add(blobShadow(0.42));
  return g;
}

// ------------------------------------------------------------------ swing (A-frame)
export function makeSwing() {
  const g = group();
  const H = 1.15, spread = 0.3;
  const ang = Math.atan2(spread, H);
  const len = Math.hypot(spread, H);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = box(0.07, len, 0.07, PAL.wood, { r: 0.02 });
    leg.rotation.x = sz * ang;
    g.add(place(leg, sx * 0.42, H / 2, (sz * spread) / 2));
  }
  const beam = cyl(0.045, 0.045, 0.94, PAL.woodDark, { seg: 8 });
  beam.rotation.z = Math.PI / 2;
  g.add(place(beam, 0, H, 0));
  for (const s of [-1, 1]) g.add(place(box(0.08, 0.06, 0.24, PAL.woodDark, { r: 0.02 }), s * 0.42, 0.4, 0));
  const piv = group();
  piv.position.y = H;
  g.add(piv);
  for (const s of [-1, 1]) piv.add(place(cyl(0.008, 0.008, 0.8, '#d8c6a0', { seg: 4, shadow: false }), s * 0.17, -0.4, 0));
  piv.add(place(box(0.42, 0.04, 0.17, '#e05a4a', { r: 0.015 }), 0, -0.8, 0));
  // flowers climbing the frame
  for (const [y, c] of [[0.25, '#ffd23f'], [0.5, '#ff6fb5'], [0.75, '#ffffff']]) {
    g.add(place(ball(0.04, M(c, { sway: 0.015 }), { shadow: false }), 0.45, y, 0.14 - y * 0.1));
  }
  g.add(place(ball(0.08, leafMat('#5fb64a'), { low: true, scale: [1, 0.6, 1] }), 0.43, 0.04, 0.17));
  g.add(blobShadow(0.5, 0.18));
  g.userData.anim = (t) => { piv.rotation.x = Math.sin(t * 1.8) * 0.38; };
  return g;
}

// ------------------------------------------------------------------ garden gnome
export function makeGnome() {
  const root = group();
  const g = group();
  g.scale.setScalar(1.35);
  root.add(g);
  const coat = '#3f7cc4', red = '#e23b3b', skin = PAL.skinLight;
  for (const s of [-1, 1]) g.add(place(ball(0.06, '#6b4226', { scale: [1, 0.6, 1.4] }), s * 0.06, 0.035, 0.02));
  g.add(place(mesh(GEO.lathe('gnomebody', [[0, 0], [0.15, 0.02], [0.14, 0.14], [0.1, 0.26], [0, 0.27]], 14), coat), 0, 0.04, 0));
  g.add(place(cyl(0.135, 0.14, 0.035, '#3a2a1a', { seg: 14 }), 0, 0.14, 0));
  g.add(place(box(0.05, 0.04, 0.02, PAL.gold, { shadow: false }), 0, 0.14, 0.14));
  for (const s of [-1, 1]) {
    const arm = capsule(0.035, 0.1, coat);
    arm.rotation.z = s * 0.5;
    arm.rotation.x = -0.6;
    g.add(place(arm, s * 0.12, 0.22, 0.05));
    g.add(place(ball(0.035, skin, { shadow: false }), s * 0.13, 0.16, 0.12));
  }
  // head, beard, nose, eyes
  g.add(place(ball(0.1, skin), 0, 0.37, 0));
  const beard = cone(0.1, 0.22, PAL.white, { seg: 12 });
  beard.rotation.x = Math.PI + 0.25;
  g.add(place(beard, 0, 0.24, 0.07));
  g.add(place(ball(0.075, PAL.white), 0, 0.33, 0.06));
  g.add(place(ball(0.035, '#f2a28a', { shadow: false }), 0, 0.37, 0.1));
  for (const s of [-1, 1]) {
    g.add(place(ball(0.014, PAL.black, { shadow: false }), s * 0.04, 0.4, 0.088));
    g.add(place(ball(0.022, '#ffb0a0', { shadow: false, scale: [1, 0.7, 0.5] }), s * 0.06, 0.36, 0.08));
  }
  // tall red hat with a slight bend
  g.add(place(cyl(0.115, 0.115, 0.04, red, { seg: 14 }), 0, 0.43, 0));
  const hat = cone(0.11, 0.32, red, { seg: 14 });
  hat.rotation.x = -0.2;
  g.add(place(hat, 0, 0.6, -0.03));
  // little toadstool friend
  g.add(place(cyl(0.025, 0.03, 0.08, PAL.cream, { seg: 8 }), 0.2, 0.04, 0.16));
  g.add(place(mesh(GEO.sphere(0.065, 12, 6), red, { scale: [1, 0.55, 1] }), 0.2, 0.09, 0.16));
  g.add(place(ball(0.014, PAL.white, { shadow: false }), 0.2, 0.125, 0.18));
  g.add(place(ball(0.012, PAL.white, { shadow: false }), 0.24, 0.11, 0.15));
  root.add(blobShadow(0.36));
  return root;
}

// ------------------------------------------------------------------ sprinkler (state.on => spraying)
export function makeSprinkler() {
  const g = group();
  const metal = PAL.metal, dark = '#6c757d';
  g.add(place(cyl(0.16, 0.19, 0.05, dark, { seg: 12 }), 0, 0.025, 0));
  g.add(place(cyl(0.035, 0.04, 0.2, metal, { seg: 10 }), 0, 0.15, 0));
  g.add(place(cyl(0.06, 0.06, 0.04, '#ffc83d', { seg: 10 }), 0, 0.06, 0));
  // green hose curling away to -x
  const hose = mesh(GEO.torus(0.16, 0.022, 5, 14, Math.PI * 1.2), '#4caf50', { shadow: false });
  hose.rotation.x = -Math.PI / 2;
  g.add(place(hose, -0.2, 0.025, 0.06));
  const head = group();
  head.position.y = 0.26;
  g.add(head);
  head.add(cyl(0.05, 0.045, 0.05, metal, { seg: 10 }));
  for (let i = 0; i < 3; i++) {
    const arm = group();
    arm.rotation.y = (i * Math.PI * 2) / 3;
    arm.add(place(box(0.16, 0.025, 0.025, metal, { shadow: false }), 0.08, 0.01, 0));
    arm.add(place(cone(0.02, 0.05, dark, { rot: [0, 0, -1.0], shadow: false }), 0.17, 0.025, 0));
    head.add(arm);
  }
  head.add(place(ball(0.03, '#ffc83d', { shadow: false }), 0, 0.04, 0));
  // spray: droplets along parabolic arcs
  const spray = group();
  spray.position.y = 0.28;
  spray.visible = false;
  g.add(spray);
  const water = M('#bfe6ff', { transparent: true, opacity: 0.6, snow: 0 });
  const geo = GEO.sphere(0.042, 8, 6);
  const drops = [];
  const ARCS = 4, PER = 9, R = 1.15, Hh = 0.45;
  for (let a = 0; a < ARCS; a++) {
    const arc = group();
    arc.rotation.y = (a * Math.PI * 2) / ARCS;
    spray.add(arc);
    for (let k = 0; k < PER; k++) {
      const d = mesh(geo, water, { shadow: false, receive: false });
      arc.add(d);
      drops.push({ d, k, a });
    }
  }
  g.add(blobShadow(0.24));
  g.userData.state = { on: false };
  g.userData.anim = (t) => {
    const on = !!g.userData.state.on;
    spray.visible = on;
    if (!on) return;
    head.rotation.y = t * 2.2;
    spray.rotation.y = t * 2.2;
    for (const { d, k, a } of drops) {
      const u = (k / PER + t * 0.9 + a * 0.11) % 1;
      d.position.set(0.17 + u * R, 4 * Hh * u * (1 - u) - u * 0.25, 0);
      d.scale.setScalar(1.2 - u * 0.6);
    }
  };
  return g;
}

// ------------------------------------------------------------------ decorative wind wheel
export function makeWindwheel() {
  const g = group();
  g.add(place(cyl(0.16, 0.2, 0.08, PAL.stone, { seg: 8 }), 0, 0.04, 0));
  g.add(place(cyl(0.035, 0.045, 1.3, PAL.wood, { seg: 8 }), 0, 0.7, 0));
  const Y = 1.38;
  g.add(place(box(0.1, 0.1, 0.18, PAL.woodDark, { r: 0.03 }), 0, Y, 0));
  // tail vane to the back
  g.add(place(box(0.02, 0.02, 0.32, PAL.woodDark, { shadow: false }), 0, Y, -0.24));
  g.add(place(box(0.015, 0.2, 0.18, '#d9483b', { r: 0.01 }), 0, Y + 0.02, -0.4));
  const w = group();
  w.position.set(0, Y, 0.12);
  g.add(w);
  const cols = ['#d9483b', '#ffc83d', '#3f7cc4', '#ffffff'];
  const N = 8;
  for (let i = 0; i < N; i++) {
    const p = group();
    p.rotation.z = (i * Math.PI * 2) / N;
    const blade = box(0.11, 0.3, 0.015, cols[i % 4], { r: 0.008 });
    blade.rotation.y = 0.45;
    p.add(place(blade, 0, 0.22, 0, 0.45));
    w.add(p);
  }
  const rim = mesh(GEO.torus(0.38, 0.014, 4, 24), PAL.woodDark, { shadow: false });
  w.add(rim);
  w.add(place(cyl(0.06, 0.06, 0.06, PAL.gold, { seg: 10, rot: [Math.PI / 2, 0, 0] }), 0, 0, 0.02));
  g.add(place(ball(0.12, leafMat('#5fb64a'), { low: true, scale: [1, 0.5, 1] }), 0.12, 0.06, 0.12));
  for (const [x, z, c] of [[0.17, 0.08, '#ff5a7a'], [0.08, 0.2, '#ffd23f']]) g.add(place(ball(0.03, M(c, { sway: 0.02 }), { shadow: false }), x, 0.14, z));
  g.add(blobShadow(0.3));
  g.userData.anim = (t) => { w.rotation.z = -t * 2.5; };
  return g;
}

// ------------------------------------------------------------------ golden rooster statue
export function makeStatue() {
  const g = group();
  const G = M('#ffcf3a', { emissive: '#7a5200' });
  const G2 = M('#f0b21c', { emissive: '#5a3a00' });
  const stone = '#e9e3d4';
  g.add(place(box(0.78, 0.12, 0.78, PAL.stone, { r: 0.04 }), 0, 0.06, 0));
  g.add(place(box(0.6, 0.42, 0.6, stone, { r: 0.05 }), 0, 0.33, 0));
  g.add(place(box(0.68, 0.07, 0.68, PAL.stone, { r: 0.03 }), 0, 0.575, 0));
  g.add(place(box(0.32, 0.12, 0.02, G2, { r: 0.01 }), 0, 0.33, 0.305));
  g.add(place(box(0.02, 0.12, 0.32, G2, { r: 0.01 }), 0.305, 0.33, 0));
  const r = group();
  r.position.y = 0.61;
  g.add(r);
  for (const s of [-1, 1]) {
    r.add(place(cyl(0.02, 0.025, 0.16, G2, { seg: 6 }), s * 0.06, 0.08, 0.0));
    r.add(place(box(0.07, 0.02, 0.1, G2, { r: 0.008 }), s * 0.06, 0.01, 0.02));
  }
  r.add(place(ball(0.17, G, { scale: [0.85, 0.9, 1.15] }), 0, 0.3, -0.02));
  r.add(place(ball(0.12, G, { scale: [0.9, 1.1, 0.9] }), 0, 0.4, 0.12));
  for (const s of [-1, 1]) r.add(place(ball(0.1, G2, { scale: [0.35, 0.7, 1.2] }), s * 0.13, 0.3, -0.02));
  // tail feathers fanned up and back
  for (let i = 0; i < 5; i++) {
    const f = capsule(0.035, 0.24, i % 2 ? G2 : G);
    f.rotation.x = -0.5 - i * 0.18;
    f.rotation.z = (i - 2) * 0.12;
    r.add(place(f, (i - 2) * 0.03, 0.46, -0.2));
  }
  r.add(place(ball(0.09, G), 0, 0.55, 0.16));
  for (let i = 0; i < 3; i++) r.add(place(ball(0.04, G2), 0, 0.64 + (i === 1 ? 0.02 : 0), 0.11 + i * 0.05));
  r.add(place(cone(0.03, 0.08, G2, { rot: [Math.PI / 2, 0, 0] }), 0, 0.54, 0.27));
  r.add(place(ball(0.03, G2, { scale: [0.8, 1.3, 0.8] }), 0, 0.48, 0.23));
  for (const s of [-1, 1]) r.add(place(ball(0.016, '#3b2a10', { shadow: false }), s * 0.06, 0.58, 0.21));
  g.add(blobShadow(0.5));
  return g;
}
