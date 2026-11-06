// Plant-like decorations: bushes, flowers, trees, pumpkins and hay.
import { PAL, M, leafMat, box, cyl, cone, ball, mesh, GEO, group, place, blobShadow, rng } from '../lib.js';

export function makeBush(seed = 0) {
  const g = group();
  const r = rng(seed + 3);
  const lm = leafMat('#4caf50'), lm2 = leafMat('#5fbf4f'), lm3 = leafMat('#3b9440');
  g.add(place(ball(0.3, lm, { low: true }), 0, 0.26, 0));
  g.add(place(ball(0.22, lm2, { low: true }), 0.2, 0.2, 0.12));
  g.add(place(ball(0.22, lm3, { low: true }), -0.22, 0.19, 0.05));
  g.add(place(ball(0.18, lm2, { low: true }), 0.02, 0.17, 0.25));
  g.add(place(ball(0.17, lm, { low: true }), 0.04, 0.47, -0.04));
  // a sprinkle of berries
  const berry = M('#d8344a', { sway: 0.015 });
  for (let i = 0; i < 6; i++) {
    const a = r() * Math.PI * 1.1 - 0.05, e = 0.15 + r() * 0.9;
    g.add(place(ball(0.04, berry, { shadow: false }), Math.sin(a) * Math.cos(e) * 0.36, 0.22 + Math.sin(e) * 0.3, Math.cos(a) * Math.cos(e) * 0.36));
  }
  g.add(blobShadow(0.45));
  return g;
}

function flower(g, x, z, h, petal, center = '#ffd84a') {
  g.add(place(cyl(0.012, 0.014, h, M('#4f9a3a', { sway: 0.02 }), { seg: 5, shadow: false }), x, h / 2 + 0.14, z));
  g.add(place(mesh(GEO.sphere(0.06, 10, 6), M(petal, { sway: 0.02 }), { scale: [1, 0.45, 1] }), x, h + 0.15, z));
  g.add(place(ball(0.026, M(center, { sway: 0.02 }), { shadow: false }), x, h + 0.175, z));
}

export function makeFlowerbed(seed = 0) {
  const g = group();
  const r = rng(seed + 5);
  const W = 0.86;
  // wooden edging
  for (const s of [-1, 1]) {
    g.add(place(box(W, 0.16, 0.07, PAL.wood, { r: 0.02 }), 0, 0.08, s * (W / 2 - 0.035)));
    g.add(place(box(0.07, 0.16, W - 0.14, PAL.plank, { r: 0.02 }), s * (W / 2 - 0.035), 0.08, 0));
  }
  g.add(place(box(W - 0.12, 0.12, W - 0.12, PAL.soil, { r: 0.02 }), 0, 0.07, 0));
  const lm = leafMat('#5cb547');
  for (const [x, z] of [[-0.2, -0.05], [0.18, 0.12], [0.02, -0.22], [-0.05, 0.22]]) {
    g.add(place(ball(0.09, lm, { low: true, scale: [1, 0.6, 1] }), x, 0.15, z));
  }
  const cols = ['#ff5a7a', '#ffd23f', '#b66dff', '#ff8a3d', '#ffffff', '#ff6fb5', '#5aa9ff'];
  let ci = Math.floor(r() * cols.length);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const x = i * 0.24 + (r() - 0.5) * 0.06, z = j * 0.24 + (r() - 0.5) * 0.06;
    const c = cols[ci++ % cols.length];
    flower(g, x, z, 0.1 + r() * 0.1, c, c === '#ffd23f' ? '#c96a1a' : '#ffd84a');
  }
  return g;
}

export function makeTulips(seed = 0) {
  const g = group();
  const r = rng(seed + 9);
  g.add(place(mesh(GEO.sphere(0.36, 14, 6), PAL.soilDark, { scale: [1, 0.12, 0.9] }), 0, 0.0, 0));
  const cup = GEO.lathe('tulip', [[0, 0], [0.045, 0.012], [0.062, 0.05], [0.058, 0.09], [0.04, 0.115], [0.048, 0.125], [0.03, 0.118]], 6);
  const cols = ['#ff3b4f', '#ffd23f', '#ff7eb6', '#ff3b4f', '#ff9a2e', '#ffffff', '#c94dff'];
  const leaf = leafMat('#5bb043');
  const spots = [[0, 0], [0.18, 0.06], [-0.17, 0.08], [0.06, 0.2], [-0.06, -0.17], [0.17, -0.15], [-0.2, -0.08]];
  spots.forEach(([x, z], i) => {
    const h = 0.26 + r() * 0.14;
    g.add(place(cyl(0.013, 0.016, h, M('#4f9a3a', { sway: 0.02 }), { seg: 5, shadow: false }), x, h / 2, z));
    g.add(place(mesh(cup, M(cols[(i + seed) % cols.length], { sway: 0.02 })), x, h - 0.01, z, r() * 2));
    const lf = mesh(GEO.sphere(0.06, 8, 6), leaf, { scale: [0.35, 1.5, 0.9], shadow: false });
    lf.rotation.z = (r() - 0.5) * 0.8;
    g.add(place(lf, x + 0.03, 0.08, z + 0.02, r() * 3));
  });
  g.add(blobShadow(0.38, 0.16));
  return g;
}

export function makeRosebush(seed = 0) {
  const g = group();
  const r = rng(seed + 13);
  const lm = leafMat('#2f8a3a'), lm2 = leafMat('#3e9c45');
  g.add(place(ball(0.3, lm, { low: true }), 0, 0.3, 0));
  g.add(place(ball(0.22, lm2, { low: true }), 0.2, 0.22, 0.1));
  g.add(place(ball(0.21, lm2, { low: true }), -0.2, 0.22, 0.08));
  g.add(place(ball(0.2, lm, { low: true }), 0.0, 0.52, 0.0));
  g.add(place(ball(0.18, lm, { low: true }), 0.02, 0.2, 0.24));
  const roses = [M('#e8304f', { sway: 0.02 }), M('#ff6f91', { sway: 0.02 }), M('#ffd1dc', { sway: 0.02 })];
  const geo = GEO.sphere(0.065, 10, 8);
  for (let i = 0; i < 13; i++) {
    // roses sit on the outer surface of the foliage dome, biased to the visible +x/+z side
    const a = (i / 13) * Math.PI * 2 + r() * 0.3;
    const e = i === 12 ? 1.45 : 0.1 + r() * 0.95;
    const m = mesh(geo, roses[i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0], { shadow: false, scale: [1, 0.85, 1] });
    g.add(place(m, Math.sin(a) * Math.cos(e) * 0.38, 0.26 + Math.sin(e) * 0.42, Math.cos(a) * Math.cos(e) * 0.38));
  }
  g.add(blobShadow(0.45));
  return g;
}

export function makePine(seed = 0) {
  const g = group();
  const lm = leafMat('#2f7d3a', { evergreen: true });
  const lm2 = leafMat('#3a9146', { evergreen: true });
  g.add(place(cyl(0.07, 0.1, 0.4, PAL.woodDark), 0, 0.2, 0));
  const tiers = [[0.42, 0.55, 0.35], [0.34, 0.5, 0.68], [0.25, 0.45, 0.98], [0.15, 0.36, 1.25]];
  tiers.forEach(([rad, h, y], i) => g.add(place(cone(rad, h, i % 2 ? lm2 : lm, { seg: 9 }), 0, y, 0, i * 0.4 + seed)));
  g.add(blobShadow(0.42));
  return g;
}

export function makeOak(seed = 0) {
  const g = group();
  const r = rng(seed + 17);
  const bark = '#7a5232';
  g.add(place(cyl(0.18, 0.28, 1.1, bark, { seg: 10 }), 0, 0.55, 0));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const root = cone(0.1, 0.35, bark, { seg: 6 });
    root.rotation.set(Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2);
    g.add(place(root, Math.sin(a) * 0.22, 0.07, Math.cos(a) * 0.22));
  }
  for (const s of [-1, 1]) {
    const br = cyl(0.06, 0.1, 0.6, bark, { seg: 7 });
    br.rotation.z = -s * 0.8;
    g.add(place(br, s * 0.25, 1.15, 0));
  }
  const lm = leafMat('#3f9a3a'), lm2 = leafMat('#52ad45'), lm3 = leafMat('#348534');
  const clumps = [[0, 1.75, 0, 0.62, lm], [0.5, 1.5, 0.15, 0.48, lm2], [-0.5, 1.5, 0.05, 0.5, lm3], [0.1, 1.45, 0.48, 0.45, lm2],
    [-0.12, 1.5, -0.45, 0.46, lm], [0.3, 2.05, -0.1, 0.4, lm2], [-0.3, 1.95, 0.2, 0.38, lm3]];
  for (const [x, y, z, rad, m] of clumps) g.add(place(ball(rad, m, { low: true }), x, y, z, r() * 3));
  // acorns peeking out
  for (let i = 0; i < 5; i++) {
    const a = r() * Math.PI * 1.4 - 0.2;
    g.add(place(ball(0.045, M('#b5762f', { sway: 0.025 }), { shadow: false, scale: [1, 1.25, 1] }), Math.sin(a) * 0.68, 1.35 + r() * 0.4, Math.cos(a) * 0.62));
  }
  g.add(blobShadow(0.95));
  return g;
}

export function makeBirch(seed = 0) {
  const g = group();
  const r = rng(seed + 19);
  g.add(place(cyl(0.065, 0.1, 1.3, '#f3f0e6', { seg: 9 }), 0, 0.65, 0));
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2, y = 0.15 + i * 0.16;
    const rad = 0.098 - y * 0.026;
    g.add(place(box(0.06 + r() * 0.04, 0.025, 0.02, '#3a3a36', { shadow: false }), Math.sin(a) * rad, y, Math.cos(a) * rad, a + Math.PI / 2));
  }
  const br = cyl(0.025, 0.04, 0.4, '#f3f0e6', { seg: 6 });
  br.rotation.z = -0.7;
  g.add(place(br, 0.14, 1.05, 0));
  const lm = leafMat('#8cc43f'), lm2 = leafMat('#a3d34e'), lm3 = leafMat('#76b23a');
  const cl = [[0, 1.55, 0, 0.36, lm], [0.22, 1.32, 0.08, 0.27, lm2], [-0.2, 1.36, 0.06, 0.27, lm3], [0.05, 1.86, 0, 0.25, lm2], [0.02, 1.25, -0.2, 0.25, lm]];
  for (const [x, y, z, rad, m] of cl) g.add(place(ball(rad, m, { low: true, scale: [1, 1.2, 1] }), x, y, z, r() * 3));
  g.add(blobShadow(0.42));
  return g;
}

function pumpkin(r, color = '#ff8a1c') {
  const g = group();
  const m = M(color);
  const geo = GEO.sphere(r, 12, 8);
  for (let i = 0; i < 4; i++) {
    const lobe = mesh(geo, m, { scale: [1, 0.78, 0.55] });
    lobe.rotation.y = (i * Math.PI) / 4;
    lobe.position.y = r * 0.78;
    g.add(lobe);
  }
  const st = cyl(r * 0.12, r * 0.16, r * 0.4, '#6b8e23', { seg: 6, shadow: false });
  st.rotation.z = 0.3;
  g.add(place(st, 0.02, r * 1.6, 0));
  return g;
}

export function makePumpkins() {
  const g = group();
  g.add(place(pumpkin(0.24), -0.08, 0, -0.1, 0.3));
  g.add(place(pumpkin(0.17, '#ffa52e'), 0.24, 0, 0.12, 1));
  g.add(place(pumpkin(0.14, '#f57c12'), -0.22, 0, 0.24, 2));
  g.add(place(pumpkin(0.11, '#ffc04a'), 0.12, 0.36, -0.06, 0.6));
  g.add(place(pumpkin(0.08, '#fff2d8'), 0.32, 0, -0.22, 0.2));
  const lm = leafMat('#5aa83e');
  for (const [x, z, a] of [[0.1, 0.32, 0.4], [-0.35, -0.05, 2], [0.32, -0.08, 4]]) {
    g.add(place(mesh(GEO.sphere(0.09, 8, 6), lm, { scale: [1, 0.22, 0.75], shadow: false }), x, 0.025, z, a));
  }
  const vine = mesh(GEO.torus(0.14, 0.012, 5, 14, Math.PI * 1.3), '#5f8f2c', { shadow: false });
  vine.rotation.x = -Math.PI / 2;
  g.add(place(vine, 0.04, 0.02, 0.15));
  vine.rotation.x = -Math.PI / 2;
  g.add(blobShadow(0.48));
  return g;
}

export function makeHaybale(seed = 0) {
  const g = group();
  const straw = PAL.thatch, light = '#f2cd78', twine = '#b06a2a';
  if (seed % 2 === 0) {
    // rolled bale lying on its side, axis along x
    const roll = cyl(0.32, 0.32, 0.58, straw, { seg: 18 });
    roll.rotation.z = Math.PI / 2;
    g.add(place(roll, 0, 0.32, 0));
    for (const s of [-1, 1]) {
      g.add(place(cyl(0.3, 0.3, 0.02, '#eccb7a', { seg: 18, rot: [0, 0, Math.PI / 2], shadow: false }), s * 0.285, 0.32, 0));
      for (const [rad, c] of [[0.2, '#d9a548'], [0.1, '#c99238']]) {
        const ring = mesh(GEO.torus(rad, 0.025, 5, 20), c, { shadow: false });
        ring.rotation.y = Math.PI / 2;
        g.add(place(ring, s * 0.297, 0.32, 0));
      }
      const band = mesh(GEO.torus(0.322, 0.01, 4, 24), '#a0602a', { shadow: false });
      band.rotation.y = Math.PI / 2;
      g.add(place(band, s * 0.13, 0.32, 0));
    }
    for (let i = 0; i < 4; i++) {
      const tuft = cone(0.03, 0.12, light, { seg: 4, shadow: false });
      tuft.rotation.z = (i - 1.5) * 0.5;
      g.add(place(tuft, (i - 1.5) * 0.12, 0.66, 0.02));
    }
  } else {
    // square bale, slightly turned
    g.add(place(box(0.72, 0.4, 0.46, straw, { r: 0.06 }), 0, 0.2, 0));
    g.add(place(box(0.4, 0.26, 0.3, light, { r: 0.05 }), 0.06, 0.53, -0.02, 0.3));
    for (const x of [-0.18, 0.18]) g.add(place(box(0.025, 0.42, 0.48, twine, { r: 0.01, shadow: false }), x, 0.2, 0));
    for (let i = 0; i < 5; i++) {
      const tuft = cone(0.025, 0.1, light, { seg: 4, shadow: false });
      tuft.rotation.x = Math.PI / 2;
      g.add(place(tuft, -0.3 + i * 0.15, 0.08 + (i % 2) * 0.22, 0.25));
    }
  }
  g.add(blobShadow(0.48));
  return g;
}
