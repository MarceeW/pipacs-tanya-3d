// Production buildings (3x3, greenhouse 4x4). Each builder adds its parts to `g` and returns
// { spots, anim(t, working) } where spots drive the shared level decorations.
import {
  PAL, M, leafMat, box, cyl, cone, ball, mesh, group, place, GEO, TAU, shade, tiny,
  pad, body, roofX, roofZ, win, doorway, beams, timberWall, chimney, makeSmoke, plaque, hangingSign,
  flowerBox, lantern, levelDecor, ICON, capsuleFlat, barrel, crate, bush,
} from './buildings_kit.js';

const H = Math.PI / 2;

/** Standard cottage block: plinth walls + roof + optional timber upper storey. Returns heights. */
function cottage(g, { x = 0, z = 0, w, d, h, wall = PAL.wall, roof, roofH = 0.7, ridge = 'x', plinth = PAL.stone, timber = null, gable = null, rows = 3, over = 0.14 }) {
  const c = group();
  c.add(body(w, h, d, wall, { plinth }));
  if (timber) {
    c.add(timberWall(w - 0.02, h * 0.55, h - 0.03, d / 2 + 0.01, timber, { posts: 4 }));
    c.add(place(timberWall(d - 0.02, h * 0.55, h - 0.03, w / 2 + 0.01, timber, { posts: 3, braces: false }), 0, 0, 0, 0).rotateY(H));
  }
  const r = ridge === 'x' ? roofX(w, d, roofH, roof, { gable: gable || wall, rows, over }) : roofZ(w, d, roofH, roof, { gable: gable || wall, rows, over });
  r.position.y = h;
  c.add(r);
  c.position.set(x, 0, z);
  g.add(c);
  return { top: h + roofH, h };
}

// ------------------------------------------------------------------ feed mill: shed + tall silo + sacks
function feedmill(g) {
  g.add(pad(2.8, 2.7));
  const x0 = -0.35, z0 = -0.1;
  cottage(g, { x: x0, z: z0, w: 1.75, d: 1.45, h: 1.0, wall: '#f6e2b3', roof: PAL.roofGreen, roofH: 0.62, timber: PAL.woodDark });
  g.add(doorway(x0 - 0.2, z0 + 0.74, 0, { w: 0.5, h: 0.62, color: '#5f8d3a' }));
  g.add(place(beams([[-0.25, 0.16, 0.25, 0.78], [0.25, 0.16, -0.25, 0.78]], 0, PAL.cream, 0.05), x0 - 0.2, 0, z0 + 0.79));
  g.add(win(x0 + 0.5, 0.62, z0 + 0.74, 0, { shutter: '#5f8d3a' }));
  g.add(win(x0 + 0.89, 0.6, z0 + 0.1, H, { w: 0.28 }));
  g.add(place(plaque(ICON.sack(), { r: 0.2 }), x0, 1.3, z0 + 0.74));
  // silo
  const sx = 0.85, sz = -0.55;
  g.add(place(cyl(0.44, 0.47, 0.16, PAL.stone, { seg: 16 }), sx, 0.08, sz));
  g.add(place(cyl(0.42, 0.42, 1.85, '#e0e5e9', { seg: 16 }), sx, 1.05, sz));
  for (const y of [0.45, 0.95, 1.45, 1.9]) g.add(place(mesh(GEO.torus(0.425, 0.025, 6, 20), M('#9fa8b0'), tiny), sx, y, sz).rotateX(H));
  const dome = ball(0.43, PAL.roofRed, { ws: 16, hs: 10 }); dome.scale.y = 0.7; dome.position.set(sx, 1.97, sz); g.add(dome);
  g.add(place(cyl(0.06, 0.06, 0.18, '#9fa8b0', { seg: 8 }), sx, 2.3, sz));
  g.add(place(cone(0.1, 0.1, '#9fa8b0', { seg: 8 }), sx, 2.43, sz));
  // ladder on silo
  for (const s of [-1, 1]) g.add(place(box(0.025, 1.6, 0.025, '#7d7d76', tiny), sx + 0.3 + s * 0.08, 1.0, sz + 0.32));
  for (let i = 0; i < 7; i++) g.add(place(box(0.18, 0.02, 0.02, '#7d7d76', tiny), sx + 0.3, 0.3 + i * 0.22, sz + 0.32));
  // chute from silo into shed
  const chute = cyl(0.07, 0.07, 0.75, '#c3cbd1', { seg: 8 }); chute.rotation.z = 1.0; chute.position.set(sx - 0.55, 1.45, sz); g.add(chute);
  // sacks + scoop wheel
  const sackC = ['#efdcae', '#e3c98d', '#f3e6c4'];
  [[0.55, 0.65], [0.85, 0.7], [0.7, 0.95], [0.7, 0.75, 0.22]].forEach(([x, z, y = 0], i) => { const s = ICON.sack(sackC[i % 3]); s.scale.setScalar(1.6); place(s, x, 0.17 + y, z, i * 0.7); s.traverse((o) => { o.castShadow = true; }); g.add(s); });
  const wheel = group();
  for (let i = 0; i < 6; i++) { const p = box(0.06, 0.5, 0.03, PAL.wood, tiny); p.rotation.z = (i / 6) * Math.PI; wheel.add(p); }
  wheel.add(mesh(GEO.torus(0.25, 0.025, 6, 18), M(PAL.woodDark), tiny));
  wheel.position.set(x0 + 0.92, 0.55, z0 + 0.45); wheel.rotation.y = H;
  g.add(wheel);
  g.add(place(bush(0.17), -1.2, 0, 0.9));
  const dust = makeSmoke(sx, 2.5, sz, { color: '#f4ead2', size: 0.1, rise: 0.8 });
  g.add(dust.group);
  return {
    spots: { boxes: [[x0 + 0.5, 0.4, z0 + 0.8, 0.42]], flag: [x0 - 0.75, 1.55, z0], vane: [sx, 2.47, sz] },
    anim: (t, on) => { wheel.rotation.x = t * (on ? 3 : 0.3); dust.update(t, on); },
  };
}

// ------------------------------------------------------------------ windmill: tall tower + lattice sails
function mill(g) {
  g.add(pad(2.6, 2.6, '#d9cfa8'));
  g.add(place(cyl(0.98, 1.05, 0.32, PAL.stone, { seg: 10 }), 0, 0.16, -0.1));
  g.add(place(cyl(0.62, 0.92, 2.1, PAL.wall, { seg: 10 }), 0, 1.37, -0.1));
  for (const y of [0.9, 1.75]) g.add(place(cyl(0.88 - (y - 0.3) * 0.14, 0.9 - (y - 0.3) * 0.14, 0.06, PAL.woodDark, { seg: 10, shadow: false }), 0, y, -0.1));
  // gallery ring
  g.add(place(cyl(0.86, 0.86, 0.06, PAL.wood, { seg: 16 }), 0, 2.25, -0.1));
  g.add(place(mesh(GEO.torus(0.84, 0.02, 4, 24), M(PAL.woodDark), tiny), 0, 2.45, -0.1).rotateX(H));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.add(place(box(0.025, 0.2, 0.025, PAL.woodDark, tiny), Math.cos(a) * 0.84, 2.35, -0.1 + Math.sin(a) * 0.84)); }
  // cap
  g.add(place(cyl(0.7, 0.7, 0.12, PAL.roofRedDark, { seg: 10 }), 0, 2.48, -0.1));
  g.add(place(cone(0.72, 0.85, PAL.roofRed, { seg: 10 }), 0, 2.96, -0.1));
  g.add(place(ball(0.08, PAL.gold, tiny), 0, 3.42, -0.1));
  // door + windows (tower front radius ~0.88 at the bottom)
  g.add(doorway(0, 0.8, 0, { w: 0.38, h: 0.62, color: PAL.roofRed }));
  // windows hugging the tapered tower: angle a around y (0 = front)
  const rAt = (y) => 0.92 - 0.3 * (y - 0.32) / 2.1 + 0.02;
  const towerWin = (a, y, o) => g.add(win(Math.sin(a) * rAt(y), y, -0.1 + Math.cos(a) * rAt(y), a, o));
  towerWin(0, 1.3, { w: 0.24, h: 0.28, shutter: PAL.roofRed });
  towerWin(1.25, 1.1, { w: 0.22, h: 0.26 });
  towerWin(0.95, 1.95, { w: 0.2, h: 0.24 });
  g.add(place(plaque(ICON.sack('#ffffff'), { r: 0.18 }), 0, 1.8, -0.1 + rAt(1.8)).rotateX(-0.14));
  // sail hub + sails
  g.add(place(cyl(0.09, 0.12, 0.5, PAL.woodDark, { seg: 8 }), 0, 2.72, 0.55).rotateX(H));
  const sails = group();
  sails.add(place(ball(0.13, PAL.woodDark), 0, 0, 0));
  for (let i = 0; i < 4; i++) {
    const arm = group();
    arm.add(place(box(0.07, 1.3, 0.05, PAL.woodDark), 0, 0.7, 0));
    arm.add(place(box(0.3, 1.0, 0.015, PAL.cream, { shadow: true }), 0.18, 0.82, -0.02));
    for (let j = 0; j < 4; j++) arm.add(place(box(0.34, 0.025, 0.03, PAL.wood, tiny), 0.17, 0.38 + j * 0.3, 0.01));
    arm.add(place(box(0.025, 1.0, 0.03, PAL.wood, tiny), 0.33, 0.82, 0.01));
    arm.rotation.z = (i / 4) * TAU;
    sails.add(arm);
  }
  sails.position.set(0, 2.72, 0.83);
  g.add(sails);
  // flour sacks at the door
  [[0.55, 0.85], [-0.6, 0.9], [-0.75, 0.62]].forEach(([x, z], i) => { const s = ICON.sack(i ? '#f3e6c4' : '#efdcae'); s.scale.setScalar(1.5); place(s, x, 0.16, z, i); g.add(s); });
  g.add(place(bush(0.2), 1.05, 0, -0.85));
  g.add(place(bush(0.16, PAL.leafLight), -1.0, 0, -0.6));
  return {
    spots: { boxes: [[0.0, 1.06, 0.73, 0.34]], flag: [0.62, 2.28, 0.45], vane: [0, 3.45, -0.1] },
    anim: (t, on, dt) => { sails.userData.v = (sails.userData.v ?? 0.4) + ((on ? 3.2 : 0.4) - (sails.userData.v ?? 0.4)) * Math.min(1, dt * 1.5); sails.rotation.z -= sails.userData.v * dt; },
  };
}

// ------------------------------------------------------------------ bakery: timber cottage + brick bread oven
function bakery(g) {
  g.add(pad(2.8, 2.7));
  const x0 = -0.35, z0 = -0.25;
  cottage(g, { x: x0, z: z0, w: 1.85, d: 1.4, h: 1.15, wall: PAL.cream, roof: PAL.roofRed, roofH: 0.72, timber: PAL.woodDark });
  g.add(doorway(x0 - 0.45, z0 + 0.71, 0, { color: '#8a4b2a' }));
  // big shop window with loaves on the sill
  g.add(win(x0 + 0.3, 0.58, z0 + 0.72, 0, { w: 0.62, h: 0.36, frame: PAL.woodLight, cross: false }));
  for (const [dx, c] of [[-0.2, '#d08a3c'], [0, '#c27a30'], [0.2, '#e0a050']]) g.add(place(capsuleFlat(0.05, 0.1, c), x0 + 0.3 + dx, 0.39, z0 + 0.8));
  g.add(win(x0 - 0.45, 0.95, z0 + 0.72, 0, { w: 0.24, h: 0.24, frame: PAL.cream }));
  g.add(win(x0 + 0.4, 0.95, z0 + 0.72, 0, { w: 0.24, h: 0.24, frame: PAL.cream }));
  g.add(win(x0 + 0.94, 0.62, z0 - 0.15, H, { shutter: PAL.roofRed }));
  // striped mini awning over the shop window
  for (let i = 0; i < 5; i++) g.add(place(box(0.15, 0.03, 0.3, i % 2 ? PAL.white : PAL.roofRed, tiny), x0 + 0.3 - 0.3 + i * 0.15, 0.86, z0 + 0.86).rotateX(0.45));
  // bread sign
  const s = hangingSign(ICON.bread()); place(s, x0 - 0.8, 1.08, z0 + 0.7, -H); g.add(s);
  // brick oven on the right
  const ox = 0.95, oz = 0.15;
  g.add(place(box(0.95, 0.3, 1.0, PAL.stone, { r: 0.05 }), ox, 0.15, oz));
  const dome = ball(0.46, PAL.brick, { ws: 16, hs: 10 }); dome.scale.set(1, 0.85, 1.05); dome.position.set(ox, 0.3, oz); g.add(dome);
  const mouth = cyl(0.17, 0.17, 0.08, '#3a2418', { seg: 12 }); mouth.rotation.x = H; mouth.scale.set(1, 1, 1); mouth.position.set(ox, 0.45, oz + 0.47); g.add(mouth);
  g.add(place(mesh(GEO.torus(0.18, 0.04, 6, 14, Math.PI), M(PAL.stone)), ox, 0.43, oz + 0.47));
  const fire = ball(0.09, M('#ff8a2b', { emissive: '#ff6a00' }), tiny); fire.position.set(ox, 0.36, oz + 0.43); g.add(fire);
  g.add(place(chimney(1.35, PAL.brick, 0.22), ox, 0.45, oz - 0.15));
  // log pile + peel
  for (const [x, y] of [[-0.08, 0], [0.08, 0], [0, 0.1]]) { const l = cyl(0.05, 0.05, 0.35, PAL.wood, { seg: 8 }); l.rotation.x = H; l.position.set(1.18 + x, 0.36 + y, oz - 0.15); g.add(l); }
  const peel = box(0.04, 0.9, 0.03, PAL.woodLight, tiny); peel.rotation.z = 0.25; peel.position.set(ox - 0.45, 0.55, oz + 0.55); g.add(peel);
  g.add(place(box(0.2, 0.02, 0.18, PAL.woodLight, tiny), ox - 0.56, 0.12, oz + 0.55));
  // bread basket on a little bench
  g.add(place(box(0.6, 0.06, 0.26, PAL.wood, { r: 0.02 }), x0 - 0.05, 0.3, z0 + 1.05));
  for (const sx of [-0.25, 0.25]) g.add(place(box(0.05, 0.28, 0.2, PAL.woodDark, tiny), x0 - 0.05 + sx, 0.14, z0 + 1.05));
  g.add(place(cyl(0.14, 0.1, 0.1, '#c99a55', { seg: 10 }), x0 - 0.15, 0.38, z0 + 1.05));
  g.add(place(capsuleFlat(0.05, 0.1, '#d08a3c'), x0 - 0.15, 0.45, z0 + 1.05));
  g.add(place(capsuleFlat(0.045, 0.18, '#e4ac5a'), x0 + 0.12, 0.37, z0 + 1.05));
  const smoke = makeSmoke(ox, 1.85, oz - 0.15, { size: 0.14 });
  g.add(smoke.group);
  g.add(place(bush(0.18), -1.25, 0, 0.95));
  return {
    spots: { boxes: [[x0 - 0.45, 0.8, z0 + 0.78, 0.3], [x0 + 0.4, 0.8, z0 + 0.78, 0.3]], flag: [x0 - 0.95, 1.85, z0], vane: [x0, 1.95, z0] },
    anim: (t, on) => { smoke.update(t, on); fire.scale.setScalar(on ? 1 + Math.sin(t * 13) * 0.2 : 0.4); },
  };
}

// ------------------------------------------------------------------ workshop: open lean-to shed, saw bench out front, logs, planks
function workshop(g) {
  g.add(pad(2.8, 2.7, '#cdb88c'));
  const blue = PAL.roofBlue, sx0 = -0.32;
  // shed: back + side walls of planks, open front
  g.add(place(box(2.05, 0.14, 1.25, PAL.stone, { r: 0.04 }), sx0, 0.07, -0.7));
  g.add(place(box(2.0, 1.45, 0.14, PAL.wood, { r: 0.04 }), sx0, 0.72, -1.25));
  for (let i = 0; i < 5; i++) g.add(place(box(0.025, 1.4, 0.02, PAL.woodDark, tiny), sx0 - 0.8 + i * 0.4, 0.72, -1.17));
  for (const s of [-1, 1]) g.add(place(box(0.14, 1.3, 1.15, PAL.wood, { r: 0.04 }), sx0 + s * 0.95, 0.65, -0.68));
  g.add(win(sx0 + 1.03, 0.75, -0.68, H, { w: 0.3, h: 0.28, frame: PAL.woodLight, shutter: blue }));
  g.add(place(box(0.12, 1.28, 0.12, PAL.woodDark, { r: 0.03 }), sx0 - 0.95, 0.64, -0.08));
  g.add(place(box(0.12, 1.28, 0.12, PAL.woodDark, { r: 0.03 }), sx0 + 0.95, 0.64, -0.08));
  g.add(place(box(2.05, 0.12, 0.12, PAL.woodDark, { r: 0.03 }), sx0, 1.3, -0.08));
  // single-pitch roof sloping to the front
  const roof = group();
  roof.add(box(2.2, 0.1, 1.5, blue, { r: 0.035 }));
  for (let i = 0; i < 3; i++) roof.add(place(box(2.21, 0.03, 0.05, shade(blue, 0.9), tiny), 0, 0.05, -0.5 + i * 0.45));
  roof.position.set(sx0, 1.55, -0.6);
  roof.rotation.x = 0.27;
  g.add(roof);
  // inside: hanging tools + plank rack + sign
  const hammer = group(place(box(0.03, 0.3, 0.03, PAL.woodLight, tiny), 0, 0, 0), place(box(0.12, 0.05, 0.05, '#555555', tiny), 0, 0.15, 0));
  g.add(place(hammer, sx0 - 0.55, 0.95, -1.16));
  const handsaw = group(place(box(0.35, 0.12, 0.01, '#cfd6dc', tiny), 0, 0, 0), place(box(0.08, 0.08, 0.03, PAL.roofRed, tiny), -0.2, 0.02, 0));
  g.add(place(handsaw, sx0 - 0.1, 1.0, -1.16));
  for (let i = 0; i < 4; i++) g.add(place(box(0.08, 1.0, 0.18, i % 2 ? PAL.plank : PAL.woodLight, { r: 0.01 }), sx0 + 0.45 + i * 0.1, 0.6, -1.05, 0).rotateZ(0.12));
  g.add(place(plaque(ICON.log(), { r: 0.21 }), sx0, 1.32, -0.0));
  // stove pipe through the roof
  g.add(place(cyl(0.07, 0.07, 1.25, '#5d5d5d', { seg: 8 }), sx0 - 0.6, 1.3, -1.0));
  g.add(place(cone(0.12, 0.1, '#5d5d5d', { seg: 8 }), sx0 - 0.6, 1.98, -1.0));
  // saw bench out front
  const bx = -0.45, bz = 0.62;
  g.add(place(box(1.1, 0.08, 0.42, PAL.woodLight, { r: 0.02 }), bx, 0.5, bz));
  for (const [x, z] of [[-0.48, -0.16], [0.48, -0.16], [-0.48, 0.16], [0.48, 0.16]]) g.add(place(box(0.06, 0.46, 0.06, PAL.woodDark, tiny), bx + x, 0.23, bz + z));
  const saw = group();
  const disc = cyl(0.24, 0.24, 0.02, '#cfd6dc', { seg: 16 }); disc.rotation.x = H; saw.add(disc);
  for (let i = 0; i < 10; i++) { const tooth = box(0.05, 0.05, 0.02, '#8a949c', tiny); const a = (i / 10) * TAU; tooth.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0); tooth.rotation.z = a + 0.785; saw.add(tooth); }
  saw.add(place(cyl(0.06, 0.06, 0.05, '#c0392b', { seg: 8, shadow: false }), 0, 0, 0).rotateX(H));
  const sawHolder = group(saw); sawHolder.rotation.y = H; sawHolder.position.set(bx + 0.15, 0.6, bz);
  g.add(sawHolder);
  g.add(place(box(0.5, 0.05, 0.18, PAL.plank, tiny), bx - 0.25, 0.565, bz));
  // plank stack (front left) + stump with axe
  for (let i = 0; i < 4; i++) g.add(place(box(0.85, 0.05, 0.2, i % 2 ? PAL.plank : PAL.woodLight, { r: 0.01 }), -0.75, 0.05 + i * 0.055, 1.12, 0.05 * i));
  g.add(place(cyl(0.18, 0.2, 0.28, PAL.wood, { seg: 12 }), 0.55, 0.14, 1.0));
  g.add(place(cyl(0.16, 0.16, 0.01, PAL.woodLight, { seg: 12, shadow: false }), 0.55, 0.285, 1.0));
  const axe = group(place(box(0.03, 0.42, 0.03, PAL.woodLight, tiny), 0, 0.2, 0), place(box(0.12, 0.09, 0.025, '#b8c0c6', tiny), 0.05, 0.38, 0));
  axe.rotation.z = -0.35; axe.position.set(0.5, 0.28, 1.0); g.add(axe);
  // log pile on the right (logs along z)
  const lx = 1.05, lz = -0.35;
  [[-0.17, 0.09], [0, 0.09], [0.17, 0.09], [-0.085, 0.24], [0.085, 0.24], [0, 0.39]].forEach(([dx, y]) => {
    const l = cyl(0.085, 0.085, 0.95, PAL.wood, { seg: 10 }); l.rotation.x = H; l.position.set(lx + dx, y, lz); g.add(l);
    g.add(place(cyl(0.07, 0.07, 0.01, PAL.woodLight, { seg: 10, shadow: false }), lx + dx, y, lz + 0.476).rotateX(H));
  });
  g.add(place(box(0.06, 0.5, 0.06, PAL.woodDark, tiny), lx + 0.3, 0.25, lz));
  g.add(place(box(0.06, 0.5, 0.06, PAL.woodDark, tiny), lx - 0.3, 0.25, lz));
  const smoke = makeSmoke(sx0 - 0.6, 2.05, -1.0, { size: 0.11, color: '#eeeeee' });
  g.add(smoke.group);
  const chips = makeSmoke(bx + 0.15, 0.62, bz + 0.1, { n: 3, size: 0.04, color: PAL.woodLight, rise: 0.35, drift: 0.35 });
  g.add(chips.group);
  return {
    spots: { boxes: [[sx0 + 1.05, 0.5, -0.68, 0.38, H]], flag: [sx0 - 0.95, 1.55, -0.08], vane: [sx0 + 0.6, 1.5, -1.25] },
    anim: (t, on) => { saw.rotation.z = on ? -t * 18 : 0; smoke.update(t, on); chips.update(t * 3, on); },
  };
}

// ------------------------------------------------------------------ sugar mill: brick hall + tall chimney
function sugarmill(g) {
  g.add(pad(2.8, 2.7, '#d3c39a'));
  const x0 = -0.3, z0 = -0.1, brick = '#c8673f';
  cottage(g, { x: x0, z: z0, w: 1.95, d: 1.45, h: 1.2, wall: brick, roof: '#56708f', roofH: 0.6, plinth: PAL.stoneDark, gable: brick });
  // white trims and arched windows
  g.add(place(box(1.99, 0.07, 1.49, PAL.cream, { r: 0.02, shadow: false }), x0, 1.17, z0));
  for (const dx of [-0.62, 0.62]) g.add(win(x0 + dx, 0.68, z0 + 0.74, 0, { w: 0.3, h: 0.4, frame: PAL.cream }));
  for (const dx of [-0.62, 0.62]) g.add(place(mesh(GEO.torus(0.18, 0.035, 6, 12, Math.PI), M(PAL.cream), tiny), x0 + dx, 0.9, z0 + 0.75));
  g.add(doorway(x0, z0 + 0.73, 0, { w: 0.46, h: 0.7, color: '#4f6a8a', frame: PAL.cream }));
  g.add(win(x0 + 0.99, 0.68, z0, H, { w: 0.3, h: 0.4, frame: PAL.cream }));
  g.add(place(plaque(ICON.cube(), { r: 0.21 }), x0, 1.48, z0 + 0.74));
  // tall round chimney with bands
  const cx = 1.0, cz = -0.85;
  g.add(place(box(0.55, 0.4, 0.55, PAL.stoneDark, { r: 0.04 }), cx, 0.2, cz));
  g.add(place(cyl(0.17, 0.25, 2.75, brick, { seg: 12 }), cx, 1.75, cz));
  for (const y of [1.0, 2.0, 2.9]) g.add(place(cyl(0.23 - (y - 0.4) * 0.025, 0.23 - (y - 0.4) * 0.025, 0.07, PAL.cream, { seg: 12, shadow: false }), cx, y, cz));
  g.add(place(cyl(0.22, 0.18, 0.14, '#3a3a3a', { seg: 12 }), cx, 3.15, cz));
  // sugar cane bundles + sugar cubes
  for (const [x, z] of [[0.95, 0.35], [1.15, 0.6]]) {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; const c = cyl(0.03, 0.03, 0.85, i % 2 ? '#8bc34a' : '#a5cf5a', { seg: 6 }); c.position.set(x + Math.cos(a) * 0.06, 0.43, z + Math.sin(a) * 0.06); c.rotation.set(Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12); g.add(c); }
    g.add(place(cyl(0.1, 0.1, 0.06, '#c49a52', { seg: 8, shadow: false }), x, 0.4, z));
    g.add(place(ball(0.08, leafMat('#7cb342'), { low: true, shadow: false }), x, 0.9, z));
  }
  const cube = ICON.cube(); cube.scale.setScalar(1.7); place(cube, 0.3, 0.12, 0.95, 0.3); cube.traverse((o) => { o.castShadow = true; }); g.add(cube);
  g.add(place(crate(0.3, PAL.plank), -0.95, 0, 0.95, 0.2));
  const sc = ICON.cube(); sc.scale.setScalar(1.1); place(sc, -0.95, 0.38, 0.95); g.add(sc);
  const smoke = makeSmoke(cx, 3.25, cz, { size: 0.17, n: 5, rise: 1.3 });
  g.add(smoke.group);
  return {
    spots: { boxes: [[x0 - 0.62, 0.42, z0 + 0.8, 0.36], [x0 + 0.62, 0.42, z0 + 0.8, 0.36]], flag: [x0 - 0.95, 1.8, z0], vane: [x0, 1.85, z0] },
    anim: (t, on) => smoke.update(t, on, 0.4),
  };
}

// ------------------------------------------------------------------ dairy: white gable-front barn, blue roof, milk cans
function dairy(g) {
  g.add(pad(2.8, 2.7));
  const x0 = -0.2, z0 = -0.3;
  cottage(g, { x: x0, z: z0, w: 1.75, d: 1.75, h: 1.05, wall: PAL.white, roof: PAL.roofBlue, roofH: 0.85, ridge: 'z', plinth: '#9bb4c9' });
  // cow-spot patches on walls
  for (const [x, y, s] of [[-0.6, 0.85, 0.16], [0.6, 0.45, 0.13], [0.5, 0.92, 0.1]]) { const b = cyl(s, s, 0.02, '#3b3b3b', { seg: 10, shadow: false }); b.rotation.x = H; b.scale.set(1.2, 1, 0.8); b.position.set(x0 + x, y, z0 + 0.885); g.add(b); }
  for (const [z, y, s] of [[0.3, 0.75, 0.15], [-0.45, 0.5, 0.12]]) { const b = cyl(s, s, 0.02, '#3b3b3b', { seg: 10, shadow: false }); b.rotation.z = H; b.position.set(x0 + 0.885, y, z0 + z); g.add(b); }
  // big double door with a blue X
  g.add(place(box(0.7, 0.75, 0.05, '#3f7cc4', { r: 0.02 }), x0, 0.53, z0 + 0.88));
  g.add(place(beams([[-0.33, 0.18, 0.33, 0.88], [0.33, 0.18, -0.33, 0.88], [0, 0.18, 0, 0.88]], 0, PAL.white, 0.05), x0, 0, z0 + 0.91));
  // round gable window with milk plaque
  g.add(place(plaque(ICON.can(), { r: 0.22, rim: PAL.roofBlue }), x0, 1.35, z0 + 0.9));
  g.add(win(x0 + 0.885, 0.62, z0 + 0.3, H, { shutter: PAL.roofBlue }));
  g.add(win(x0 + 0.885, 0.62, z0 - 0.4, H, { shutter: PAL.roofBlue }));
  g.add(place(chimney(0.55, '#b9c4cc'), x0 - 0.45, 1.35, z0 - 0.4));
  // milk cans
  [[0.75, 0.75], [0.98, 0.65], [0.88, 0.95], [1.15, 0.9]].forEach(([x, z], i) => { const c = ICON.can(); c.scale.setScalar(1.6 - (i === 3 ? 0.3 : 0)); c.position.set(x, 0.15, z); c.traverse((o) => { o.castShadow = true; }); g.add(c); });
  // butter churn with plunger
  const chx = -0.95, chz = 0.85;
  g.add(place(cyl(0.12, 0.15, 0.42, PAL.woodLight, { seg: 12 }), chx, 0.21, chz));
  for (const y of [0.08, 0.34]) g.add(place(cyl(0.155, 0.155, 0.03, '#5d5d5d', { seg: 12, shadow: false }), chx, y, chz));
  const plunger = group(place(cyl(0.015, 0.015, 0.45, PAL.woodDark, { seg: 6 }), 0, 0, 0), place(box(0.12, 0.03, 0.03, PAL.woodDark, tiny), 0, 0.22, 0));
  plunger.position.set(chx, 0.55, chz); g.add(plunger);
  // cheese wheels on a crate
  g.add(place(crate(0.3, PAL.plank), -0.55, 0, 1.0));
  const cheese = cyl(0.13, 0.13, 0.09, '#ffd54a', { seg: 14 }); cheese.position.set(-0.55, 0.35, 1.0); g.add(cheese);
  const wedge = cyl(0.1, 0.1, 0.08, '#ffca28', { seg: 3 }); wedge.position.set(-0.5, 0.44, 0.98); g.add(wedge);
  const smoke = makeSmoke(x0 - 0.45, 1.95, z0 - 0.4, { size: 0.12 });
  g.add(smoke.group);
  g.add(place(bush(0.18), 1.1, 0, -0.9));
  return {
    spots: { boxes: [[x0 + 0.95, 0.4, z0 + 0.3, 0.36, H], [x0 + 0.95, 0.4, z0 - 0.4, 0.36, H]], flag: [x0 - 0.92, 1.05, z0 + 0.8], vane: [x0, 1.98, z0 + 0.2] },
    anim: (t, on) => { plunger.position.y = 0.55 + (on ? Math.abs(Math.sin(t * 5)) * 0.15 : 0); smoke.update(t, on); },
  };
}

// ------------------------------------------------------------------ loom: green-roof weaving house with spinning wheel + yarn rack
function loom(g) {
  g.add(pad(2.8, 2.7));
  const x0 = -0.26, z0 = -0.3;
  cottage(g, { x: x0, z: z0, w: 2.0, d: 1.4, h: 1.25, wall: '#f8e6c8', roof: '#3f9a7a', roofH: 0.75, timber: '#8b5a3c' });
  // dormer
  const dm = group();
  dm.add(place(box(0.5, 0.42, 0.5, '#f8e6c8', { r: 0.03 }), 0, 0.21, 0));
  const dr = roofZ(0.5, 0.56, 0.25, '#3f9a7a', { rows: 1, over: 0.06, gable: '#f8e6c8' }); dr.position.y = 0.42; dm.add(dr);
  dm.add(win(0, 0.2, 0.26, 0, { w: 0.22, h: 0.22 }));
  dm.position.set(x0 + 0.4, 1.32, z0 + 0.45); g.add(dm);
  g.add(doorway(x0 - 0.55, z0 + 0.71, 0, { color: '#3f9a7a' }));
  g.add(win(x0 + 0.1, 0.62, z0 + 0.72, 0, { shutter: '#3f9a7a' }));
  g.add(win(x0 + 0.7, 0.62, z0 + 0.72, 0, { shutter: '#3f9a7a' }));
  g.add(win(x0 + 1.01, 0.62, z0, H, { w: 0.34 }));
  g.add(place(plaque(ICON.spool('#e94f7a'), { r: 0.2 }), x0 - 0.55, 1.05, z0 + 0.72));
  // yarn rack with colourful spools (rotate when working)
  const spools = [];
  g.add(place(box(0.08, 0.7, 0.08, PAL.woodDark, tiny), -0.95, 0.35, 0.9));
  g.add(place(box(0.08, 0.7, 0.08, PAL.woodDark, tiny), 0.15, 0.35, 0.9));
  g.add(place(box(1.2, 0.06, 0.08, PAL.wood, tiny), -0.4, 0.68, 0.9));
  g.add(place(box(1.2, 0.06, 0.08, PAL.wood, tiny), -0.4, 0.34, 0.9));
  ['#e94f7a', '#ffc83d', '#3f7cc4', '#4caf50', '#ff8a3d', '#9c6ade', '#ffffff', '#e53935'].forEach((c, i) => {
    const s = ICON.spool(c); s.scale.setScalar(0.9); s.position.set(-0.83 + (i % 4) * 0.28, i < 4 ? 0.52 : 0.18, 0.9); s.rotation.x = H;
    g.add(s); spools.push(s);
  });
  // spinning wheel (right)
  const wx = 1.05, wz = 0.4;
  g.add(place(box(0.5, 0.06, 0.16, PAL.wood, tiny), wx, 0.25, wz).rotateY(H));
  for (const [dz, h] of [[-0.2, 0.25], [0.2, 0.25]]) g.add(place(box(0.04, h, 0.04, PAL.woodDark, tiny), wx, h / 2, wz + dz));
  g.add(place(box(0.04, 0.6, 0.04, PAL.woodDark, tiny), wx + 0.06, 0.55, wz - 0.05));
  const wheel = group();
  wheel.add(mesh(GEO.torus(0.26, 0.03, 6, 20), M(PAL.wood)));
  for (let i = 0; i < 4; i++) { const sp = box(0.02, 0.52, 0.02, PAL.woodDark, tiny); sp.rotation.z = (i / 4) * Math.PI; wheel.add(sp); }
  wheel.position.set(wx + 0.11, 0.62, wz - 0.05); wheel.rotation.y = H;
  g.add(wheel);
  g.add(place(ball(0.09, '#f2f2f2', { low: true, shadow: false }), wx + 0.06, 0.9, wz - 0.05));
  // yarn balls in a basket
  g.add(place(cyl(0.18, 0.13, 0.14, '#c99a55', { seg: 12 }), 0.75, 0.07, 1.0));
  for (const [x, z, c] of [[-0.07, 0, '#e94f7a'], [0.08, 0.03, '#3f7cc4'], [0, -0.08, '#ffc83d']]) g.add(place(ball(0.08, c, { shadow: false }), 0.75 + x, 0.2, 1.0 + z));
  const smoke = makeSmoke(x0 - 0.6, 2.1, z0 - 0.3, { size: 0.12 });
  g.add(place(chimney(0.6, PAL.brick), x0 - 0.6, 1.55, z0 - 0.3));
  g.add(smoke.group);
  return {
    spots: { boxes: [[x0 + 0.1, 0.42, z0 + 0.78, 0.36], [x0 + 0.7, 0.42, z0 + 0.78, 0.36]], flag: [x0 + 1.0, 1.9, z0], vane: [x0 + 0.2, 2.05, z0] },
    anim: (t, on) => { const r = on ? t * 4 : 0; wheel.rotation.z = -r; for (const s of spools) s.rotation.y = r * 0.7; smoke.update(t, on); },
  };
}

// ------------------------------------------------------------------ press: stone house, thatch roof, big screw press + barrels
function press(g) {
  g.add(pad(2.8, 2.7, '#d6c8a0'));
  const x0 = -0.3, z0 = -0.45;
  cottage(g, { x: x0, z: z0, w: 1.9, d: 1.3, h: 1.0, wall: '#e3d8c3', roof: PAL.thatch, roofH: 0.75, plinth: PAL.stoneDark, rows: 4, over: 0.15 });
  // stone blocks pattern
  [[-0.7, 0.4], [-0.2, 0.75], [0.45, 0.35], [0.75, 0.8], [-0.55, 0.85]].forEach(([x, y]) => g.add(place(box(0.24, 0.12, 0.03, '#b3aa96', { r: 0.02, shadow: false }), x0 + x, y, z0 + 0.66)));
  g.add(doorway(x0 + 0.35, z0 + 0.66, 0, { color: '#6d4a2c' }));
  g.add(win(x0 - 0.4, 0.62, z0 + 0.67, 0, { frame: PAL.woodLight, shutter: '#7a8f3a' }));
  g.add(win(x0 + 0.96, 0.6, z0, H, { frame: PAL.woodLight }));
  const s = hangingSign(ICON.drop('#c9b330')); place(s, x0 + 0.95, 0.95, z0 + 0.6); g.add(s);
  // screw press
  const px = -0.45, pz = 0.65;
  g.add(place(cyl(0.42, 0.45, 0.22, PAL.wood, { seg: 16 }), px, 0.11, pz));
  g.add(place(cyl(0.36, 0.36, 0.02, '#d7b83a', { seg: 16, shadow: false }), px, 0.23, pz));
  g.add(place(cyl(0.3, 0.3, 0.2, '#8c6a3e', { seg: 16 }), px, 0.34, pz));
  for (const s2 of [-1, 1]) g.add(place(box(0.12, 1.25, 0.12, PAL.woodDark, { r: 0.03 }), px + s2 * 0.48, 0.62, pz));
  g.add(place(box(1.15, 0.16, 0.18, PAL.woodDark, { r: 0.04 }), px, 1.25, pz));
  const screw = group();
  screw.add(cyl(0.05, 0.05, 0.9, '#8c8c84', { seg: 10 }));
  for (let i = 0; i < 6; i++) screw.add(place(mesh(GEO.torus(0.06, 0.015, 4, 10), M('#6f6f68'), tiny), 0, -0.35 + i * 0.13, 0).rotateX(H));
  const bar = box(0.85, 0.05, 0.05, PAL.wood, { r: 0.02 }); bar.position.y = 0.1; screw.add(bar);
  for (const s2 of [-1, 1]) screw.add(place(ball(0.04, PAL.woodDark, tiny), s2 * 0.43, 0.1, 0));
  screw.position.set(px, 0.85, pz);
  g.add(screw);
  // spout + jug
  g.add(place(box(0.08, 0.04, 0.2, PAL.woodDark, tiny), px + 0.4, 0.14, pz + 0.12).rotateY(-0.6));
  g.add(place(cyl(0.07, 0.09, 0.2, '#d98a4a', { seg: 10 }), px + 0.6, 0.1, pz + 0.3));
  // barrel stack
  const bx = 0.95, bz = 0.25;
  for (const dz of [-0.28, 0, 0.28]) { const b = barrel(0.36, 0.14); b.rotation.x = H; b.position.set(bx, 0.15, bz + dz - 0.18); b.rotation.set(0, 0, H); b.position.set(bx - 0.18, 0.15, bz + dz); g.add(b); }
  for (const dz of [-0.14, 0.14]) { const b = barrel(0.36, 0.14); b.rotation.set(0, 0, H); b.position.set(bx - 0.18, 0.41, bz + dz); g.add(b); }
  g.add(place(barrel(0.38, 0.15, '#9b6a3c'), 0.95, 0, 0.95));
  // olives / sunflower basket
  g.add(place(cyl(0.16, 0.12, 0.12, '#c99a55', { seg: 12 }), 0.35, 0.06, 1.0));
  for (let i = 0; i < 5; i++) g.add(place(ball(0.045, i % 2 ? '#6b8e23' : '#556b2f', tiny), 0.35 + Math.cos(i * 1.3) * 0.07, 0.15, 1.0 + Math.sin(i * 1.3) * 0.07));
  g.add(place(bush(0.18, '#6b8e23'), -1.2, 0, -0.95));
  return {
    spots: { boxes: [[x0 - 0.4, 0.42, z0 + 0.72, 0.38]], flag: [x0 - 0.95, 1.75, z0], vane: [x0, 1.85, z0] },
    anim: (t, on) => { if (on) { screw.rotation.y = t * 1.6; screw.position.y = 0.85 + Math.sin(t * 0.8) * 0.06; } },
  };
}

// ------------------------------------------------------------------ cannery: orange roof, copper kettle, jar shelves
function cannery(g) {
  g.add(pad(2.8, 2.7));
  const x0 = -0.33, z0 = -0.35, orange = '#ef8a2e';
  cottage(g, { x: x0, z: z0, w: 1.85, d: 1.4, h: 1.15, wall: '#fff3e0', roof: orange, roofH: 0.68, timber: '#a0522d' });
  g.add(doorway(x0 + 0.45, z0 + 0.71, 0, { color: orange }));
  g.add(win(x0 - 0.4, 0.62, z0 + 0.72, 0, { w: 0.42, h: 0.34, shutter: '#4f9a4a' }));
  g.add(win(x0 + 0.93, 0.62, z0 - 0.1, H, { shutter: '#4f9a4a' }));
  g.add(place(plaque(ICON.jar('#d6334a'), { r: 0.22, rim: '#a0522d' }), x0 - 0.4, 1.35, z0 + 0.72));
  // jar shelf (front)
  g.add(place(box(1.3, 0.05, 0.3, PAL.wood, { r: 0.02 }), -0.5, 0.35, 0.82));
  g.add(place(box(1.3, 0.05, 0.3, PAL.wood, { r: 0.02 }), -0.5, 0.7, 0.82));
  for (const sx of [-1.12, 0.12]) g.add(place(box(0.06, 0.78, 0.3, PAL.woodDark, tiny), sx, 0.39, 0.82));
  const jarC = ['#d6334a', '#ff9800', '#7b3fa0', '#4caf50', '#ffc107', '#e53935', '#8bc34a', '#ff7043'];
  jarC.forEach((c, i) => { const j = ICON.jar(c); j.position.set(-0.98 + (i % 4) * 0.3, i < 4 ? 0.46 : 0.81, 0.82); g.add(j); });
  // copper kettle with pipe
  const kx = 0.93, kz = 0.35;
  g.add(place(box(0.7, 0.3, 0.7, PAL.brick, { r: 0.05 }), kx, 0.15, kz));
  const kettle = ball(0.33, '#d07a3a', { ws: 16, hs: 10 }); kettle.scale.y = 0.8; kettle.position.set(kx, 0.52, kz); g.add(kettle);
  g.add(place(cyl(0.3, 0.3, 0.05, '#b5622a', { seg: 16 }), kx, 0.75, kz));
  g.add(place(cyl(0.05, 0.05, 1.3, '#b5622a', { seg: 8 }), kx + 0.2, 1.25, kz - 0.25));
  g.add(place(cone(0.1, 0.1, '#b5622a', { seg: 8 }), kx + 0.2, 1.95, kz - 0.25));
  g.add(place(mesh(GEO.torus(0.16, 0.02, 6, 12), M('#b5622a'), tiny), kx, 0.85, kz));
  const fire = ball(0.08, M('#ff8a2b', { emissive: '#ff6a00' }), tiny); fire.position.set(kx, 0.13, kz + 0.33); g.add(fire);
  // crates of produce
  g.add(place(crate(0.3, PAL.plank), 0.65, 0, 1.0));
  for (let i = 0; i < 4; i++) g.add(place(ball(0.06, '#e53935', tiny), 0.58 + (i % 2) * 0.13, 0.33, 0.95 + Math.floor(i / 2) * 0.1));
  g.add(place(crate(0.26, PAL.plank), 1.05, 0, 0.95, 0.4));
  for (let i = 0; i < 3; i++) g.add(place(ball(0.05, '#7b3fa0', tiny), 1.0 + i * 0.05, 0.29, 0.95));
  const steam = makeSmoke(kx + 0.2, 2.0, kz - 0.25, { size: 0.12, color: '#f2f2f2' });
  g.add(steam.group);
  const bubble = makeSmoke(kx, 0.8, kz, { n: 3, size: 0.06, rise: 0.3, drift: 0.05, color: '#ffffff' });
  g.add(bubble.group);
  return {
    spots: { boxes: [[x0 - 0.4, 0.4, z0 + 0.78, 0.5]], flag: [x0 - 0.95, 1.75, z0], vane: [x0, 1.9, z0] },
    anim: (t, on) => { steam.update(t, on); bubble.update(t * 2, on); fire.visible = on; },
  };
}

// ------------------------------------------------------------------ greenhouse (4x4): glass house with planter rows
function greenhouse(g) {
  g.add(pad(3.8, 3.7, '#cdbf98'));
  const W = 3.3, D = 2.7, Hh = 1.25, RH = 0.85;
  const glass = M('#bfe8ff', { snow: 0, transparent: true, opacity: 0.26 });
  const frame = PAL.white;
  g.add(place(box(W + 0.1, 0.32, D + 0.1, PAL.brick, { r: 0.04 }), 0, 0.16, -0.1));
  g.add(place(box(W - 0.1, 0.02, D - 0.1, '#c9b48a', tiny), 0, 0.33, -0.1));
  // glass walls
  g.add(place(box(W, Hh - 0.32, 0.03, glass, tiny), 0, 0.32 + (Hh - 0.32) / 2, -0.1 + D / 2));
  g.add(place(box(W, Hh - 0.32, 0.03, glass, tiny), 0, 0.32 + (Hh - 0.32) / 2, -0.1 - D / 2));
  for (const s of [-1, 1]) g.add(place(box(0.03, Hh - 0.32, D, glass, tiny), s * W / 2, 0.32 + (Hh - 0.32) / 2, -0.1));
  // frame posts
  for (let i = 0; i <= 6; i++) { const x = -W / 2 + (i / 6) * W; for (const s of [-1, 1]) g.add(place(box(0.05, Hh - 0.3, 0.05, frame, tiny), x, 0.32 + (Hh - 0.32) / 2, -0.1 + s * D / 2)); }
  for (let i = 1; i < 4; i++) { const z = -0.1 - D / 2 + (i / 4) * D; for (const s of [-1, 1]) g.add(place(box(0.05, Hh - 0.3, 0.05, frame, tiny), s * W / 2, 0.32 + (Hh - 0.32) / 2, z)); }
  for (const s of [-1, 1]) {
    g.add(place(box(W + 0.06, 0.07, 0.07, frame, tiny), 0, Hh, -0.1 + s * D / 2));
    g.add(place(box(0.07, 0.07, D + 0.06, frame, tiny), s * W / 2, Hh, -0.1));
  }
  // glass gable roof (ridge along x)
  const half = D / 2 + 0.05, slope = Math.hypot(half, RH), ang = Math.atan2(RH, half);
  for (const s of [-1, 1]) {
    const piv = group();
    piv.position.set(0, Hh + RH / 2, -0.1 + s * half / 2);
    piv.rotation.x = s * ang;
    piv.add(box(W + 0.1, 0.03, slope, glass, tiny));
    for (let i = 0; i <= 6; i++) piv.add(place(box(0.05, 0.05, slope, frame), -W / 2 + (i / 6) * W, 0.02, 0));
    piv.add(place(box(W + 0.1, 0.05, 0.05, frame, tiny), 0, 0.02, s * slope / 2));
    g.add(piv);
  }
  g.add(place(box(W + 0.15, 0.08, 0.1, '#6fbf73'), 0, Hh + RH + 0.02, -0.1));
  // gable glass triangles
  for (const s of [-1, 1]) { const tri = mesh(GEO.prism(D, RH, 0.03), glass, tiny); tri.rotation.y = H; tri.position.set(s * W / 2, Hh, -0.1); g.add(tri); }
  // roof vent panel (opens when working)
  const vent = group(place(box(0.7, 0.03, 0.5, glass, tiny), 0, 0, 0.25), place(box(0.74, 0.05, 0.05, '#6fbf73', tiny), 0, 0, 0.5));
  vent.position.set(0.6, Hh + RH - 0.02, -0.1);
  vent.rotation.x = ang;
  g.add(vent);
  // door
  g.add(place(box(0.5, 0.85, 0.04, M('#cdeeff', { snow: 0, transparent: true, opacity: 0.5 }), tiny), 0, 0.42, -0.1 + D / 2 + 0.03));
  g.add(place(beams([[-0.27, 0, -0.27, 0.9], [0.27, 0, 0.27, 0.9], [-0.27, 0.9, 0.27, 0.9]], 0, '#6fbf73', 0.07), 0, 0, -0.1 + D / 2 + 0.05));
  g.add(place(box(0.7, 0.08, 0.25, PAL.stone, { r: 0.03 }), 0, 0.04, D / 2 + 0.05));
  // planter rows inside
  // indoor plants: evergreen + no snow (the greenhouse grows all year)
  const lm = leafMat(PAL.leaf, { evergreen: true, snow: 0 }), lm2 = leafMat(PAL.leafLight, { evergreen: true, snow: 0 });
  const fruitC = ['#e53935', '#ffc107', '#ff7043', '#e91e63'];
  for (let r = 0; r < 3; r++) {
    const z = -1.1 + r * 0.8;
    for (const sx of [-0.85, 0.85]) {
      g.add(place(box(1.3, 0.22, 0.42, PAL.woodDark, { r: 0.03 }), sx, 0.43, z));
      g.add(place(box(1.22, 0.04, 0.36, PAL.soil, tiny), sx, 0.55, z));
      for (let i = 0; i < 3; i++) {
        const x = sx - 0.4 + i * 0.4;
        g.add(place(ball(0.19, (i + r) % 2 ? lm : lm2, { low: true }), x, 0.72, z));
        g.add(place(ball(0.065, M(fruitC[(i + r * 2 + (sx > 0 ? 1 : 0)) % 4], { sway: 0.01, snow: 0 }), tiny), x + 0.1, 0.84, z + 0.1));
      }
    }
  }
  // water barrel + watering can + sign
  g.add(place(barrel(0.45, 0.18, PAL.roofBlue), 1.55, 0, 1.45));
  g.add(place(cyl(0.16, 0.16, 0.02, '#4fb3e8', { seg: 12, shadow: false }), 1.55, 0.44, 1.45));
  const can = group(place(cyl(0.08, 0.09, 0.16, '#6fbf73', { seg: 10 }), 0, 0.08, 0), place(cyl(0.015, 0.02, 0.2, '#6fbf73', { seg: 6, shadow: false }), 0.12, 0.14, 0).rotateZ(-0.9));
  g.add(place(can, 1.2, 0, 1.5));
  g.add(place(plaque(ICON.flower('#e53950'), { r: 0.2 }), 0, Hh + 0.32, -0.1 + D / 2 + 0.03));
  for (const [x, c] of [[-1.5, '#ff6fa3'], [-1.15, '#ffd54a'], [1.55, '#ff8a3d']]) { const p = group(place(cyl(0.12, 0.09, 0.18, '#c0583a', { seg: 10 }), 0, 0.09, 0), place(ball(0.12, lm, { low: true }), 0, 0.26, 0), place(ball(0.05, M(c, { sway: 0.01 }), tiny), 0.05, 0.36, 0.04)); g.add(place(p, x, 0, x > 0 ? -1.65 : 1.5)); }
  const mist = makeSmoke(0.6, Hh + RH + 0.1, 0.1, { n: 4, size: 0.11, color: '#e9f6ff', rise: 0.7, opacity: 0.7 });
  g.add(mist.group);
  return {
    spots: { boxes: [[-1.0, 0.36, D / 2 - 0.02, 0.6], [1.0, 0.36, D / 2 - 0.02, 0.6]], flag: [-W / 2 - 0.05, 1.3, D / 2 - 0.1], vane: [-0.8, Hh + RH + 0.06, -0.1] },
    anim: (t, on, dt) => { const target = on ? ang + 0.55 : ang; vent.rotation.x += (target - vent.rotation.x) * Math.min(1, dt * 3); mist.update(t, on, 0.3); },
  };
}

// ------------------------------------------------------------------ pastry: pink shop with a giant cake on the roof
function pastry(g) {
  g.add(pad(2.8, 2.7, '#e9d7c0'));
  const x0 = -0.15, z0 = -0.3, pink = '#f47fa8', wall = '#ffe3ec';
  cottage(g, { x: x0, z: z0, w: 2.0, d: 1.45, h: 1.15, wall, roof: pink, roofH: 0.55, plinth: '#e6cfd6', timber: PAL.white });
  // scalloped eave trim
  for (let i = 0; i < 9; i++) g.add(place(ball(0.075, PAL.white, { shadow: false }), x0 - 0.9 + i * 0.225, 1.08, z0 + 0.83));
  g.add(doorway(x0 + 0.55, z0 + 0.73, 0, { color: '#c2185b', frame: PAL.white }));
  g.add(win(x0 - 0.35, 0.6, z0 + 0.73, 0, { w: 0.7, h: 0.42, frame: PAL.white, cross: false }));
  // cakes in the shop window
  for (const [dx, c] of [[-0.18, '#ffffff'], [0.05, '#8d5a3b'], [0.25, '#f8bbd0']]) { const k = ICON.cake(); k.scale.setScalar(0.55); k.children[0].material = M(c); place(k, x0 - 0.35 + dx, 0.42, z0 + 0.8); g.add(k); }
  // striped awning
  for (let i = 0; i < 6; i++) g.add(place(box(0.14, 0.03, 0.36, i % 2 ? PAL.white : pink, tiny), x0 - 0.35 - 0.35 + i * 0.14, 0.97, z0 + 0.92).rotateX(0.5));
  for (let i = 0; i < 6; i++) g.add(place(ball(0.04, i % 2 ? PAL.white : pink, tiny), x0 - 0.7 + i * 0.14, 0.86, z0 + 1.09));
  g.add(win(x0 + 1.02, 0.65, z0, H, { shutter: pink }));
  // giant 3-tier cake on the roof
  const cake = group();
  cake.add(place(cyl(0.42, 0.42, 0.08, PAL.woodLight, { seg: 18 }), 0, 0.04, 0));
  cake.add(place(cyl(0.36, 0.36, 0.26, '#f8bbd0', { seg: 18 }), 0, 0.21, 0));
  cake.add(place(cyl(0.27, 0.27, 0.22, PAL.cream, { seg: 18 }), 0, 0.45, 0));
  cake.add(place(cyl(0.18, 0.18, 0.18, '#f8bbd0', { seg: 18 }), 0, 0.65, 0));
  for (const [r, y] of [[0.36, 0.34], [0.27, 0.56], [0.18, 0.74]]) cake.add(place(mesh(GEO.torus(r, 0.03, 6, 20), M(PAL.white), tiny), 0, y, 0).rotateX(H));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; cake.add(place(ball(0.045, '#e53950', tiny), Math.cos(a) * 0.33, 0.37, Math.sin(a) * 0.33)); }
  cake.add(place(ball(0.08, '#e53950'), 0, 0.82, 0));
  cake.add(place(cyl(0.008, 0.008, 0.12, '#4caf50', { seg: 4, shadow: false }), 0.03, 0.9, 0).rotateZ(-0.3));
  cake.position.set(x0 - 0.1, 1.15 + 0.55 + 0.02, z0);
  g.add(cake);
  g.add(place(chimney(0.55, '#e6cfd6'), x0 + 0.65, 1.3, z0 - 0.35));
  // little table with ice cream sign stand
  g.add(place(cyl(0.22, 0.22, 0.04, PAL.white, { seg: 14 }), 0.95, 0.45, 0.85));
  g.add(place(cyl(0.03, 0.05, 0.45, PAL.white, { seg: 6 }), 0.95, 0.22, 0.85));
  const ice = group(place(cone(0.05, 0.14, '#e0a050', { seg: 8 }), 0, 0, 0).rotateX(Math.PI), place(ball(0.055, '#f8bbd0', tiny), 0, 0.08, 0), place(ball(0.05, '#8d5a3b', tiny), 0, 0.15, 0));
  g.add(place(ice, 0.9, 0.55, 0.85));
  const cup = ICON.cake(); cup.scale.setScalar(0.6); g.add(place(cup, 1.05, 0.52, 0.8));
  g.add(place(bush(0.17, '#6fbf73'), -1.25, 0, 0.95));
  const smoke = makeSmoke(x0 + 0.65, 1.88, z0 - 0.35, { size: 0.11, color: '#fff0f5' });
  g.add(smoke.group);
  return {
    spots: { boxes: [[x0 + 1.08, 0.42, z0, 0.36, H]], flag: [x0 + 0.9, 1.6, z0], vane: [x0 - 0.75, 1.72, z0] },
    anim: (t, on) => { smoke.update(t, on); cake.rotation.y = on ? t * 0.8 : 0; },
  };
}

// ------------------------------------------------------------------ tailor: teal roof, giant spool + needle, fabric bolts, washing line
function tailor(g) {
  g.add(pad(2.8, 2.7));
  const x0 = -0.3, z0 = -0.35, teal = '#2aa198', wall = '#eef8f3';
  cottage(g, { x: x0, z: z0, w: 1.75, d: 1.35, h: 1.35, wall, roof: teal, roofH: 0.8, ridge: 'z', plinth: PAL.stone, timber: '#6d4c41' });
  g.add(doorway(x0 - 0.45, z0 + 0.68, 0, { color: teal }));
  // bay window with dress form
  g.add(place(box(0.75, 0.62, 0.22, PAL.white, { r: 0.04 }), x0 + 0.3, 0.6, z0 + 0.75));
  g.add(win(x0 + 0.3, 0.6, z0 + 0.87, 0, { w: 0.6, h: 0.42, frame: PAL.white }));
  g.add(place(box(0.85, 0.08, 0.3, teal, { r: 0.03 }), x0 + 0.3, 0.95, z0 + 0.78));
  g.add(win(x0, 1.7, z0 + 0.68, 0, { w: 0.26, h: 0.26 }));
  g.add(win(x0 + 0.88, 0.75, z0 - 0.1, H, { shutter: teal }));
  // dress form in front of the bay window
  const form = group(place(cyl(0.02, 0.02, 0.35, PAL.woodDark, { seg: 6 }), 0, 0.17, 0), place(ball(0.12, '#e94f7a'), 0, 0.42, 0), place(cone(0.16, 0.3, '#e94f7a', { seg: 12 }), 0, 0.3, 0), place(ball(0.03, PAL.woodDark, tiny), 0, 0.57, 0));
  form.children[1].scale.set(1, 1.2, 0.8);
  g.add(place(form, x0 + 0.3, 0.05, z0 + 1.05));
  // giant spool with needle on a post
  const sx = 1.0, sz = 0.65;
  g.add(place(box(0.08, 1.1, 0.08, PAL.woodDark, { r: 0.02 }), sx, 0.55, sz));
  const spool = ICON.needle(); spool.scale.setScalar(2.3); spool.position.set(sx, 1.35, sz); spool.traverse((o) => { o.castShadow = true; });
  g.add(spool);
  // fabric bolts rack
  g.add(place(box(0.9, 0.06, 0.32, PAL.wood, { r: 0.02 }), -0.65, 0.3, 0.95));
  for (const dx of [-0.4, 0.4]) g.add(place(box(0.05, 0.3, 0.3, PAL.woodDark, tiny), -0.65 + dx, 0.15, 0.95));
  ['#3f7cc4', '#ffc83d', '#e53935', '#8bc34a'].forEach((c, i) => { const b = cyl(0.07, 0.07, 0.3, c, { seg: 10 }); b.rotation.x = H; b.position.set(-0.95 + i * 0.2, 0.4, 0.95); g.add(b); });
  // washing line with shirts on the right side
  g.add(place(box(0.05, 0.9, 0.05, PAL.woodDark, tiny), 1.2, 0.45, -0.9));
  const line = box(0.02, 0.02, 1.15, '#eeeeee', tiny); line.position.set(1.2, 0.85, -0.32); g.add(line);
  const shirts = [];
  ['#ff8a3d', '#7cc242', '#ffffff'].forEach((c, i) => { const s = group(place(box(0.03, 0.22, 0.2, c), 0, -0.11, 0), place(box(0.03, 0.06, 0.32, c, tiny), 0, -0.03, 0)); s.position.set(1.2, 0.84, -0.7 + i * 0.32); g.add(s); shirts.push(s); });
  g.add(place(chimney(0.5, PAL.brick), x0 + 0.45, 1.6, z0 - 0.3));
  const smoke = makeSmoke(x0 + 0.45, 2.12, z0 - 0.3, { size: 0.11 });
  g.add(smoke.group);
  return {
    spots: { boxes: [[x0 - 0.45, 1.6, z0 + 0.72, 0.3]], flag: [x0 - 0.88, 1.35, z0 + 0.6], vane: [x0, 2.2, z0 - 0.1] },
    anim: (t, on) => { spool.rotation.y = on ? t * 2.5 : Math.sin(t * 0.5) * 0.15; for (let i = 0; i < 3; i++) shirts[i].rotation.z = Math.sin(t * 2.2 + i) * (on ? 0.25 : 0.1); smoke.update(t, on); },
  };
}

// ------------------------------------------------------------------ bistro: yellow house, terrace with parasol tables
function bistro(g) {
  g.add(pad(2.8, 2.7, '#e4d3ad'));
  const x0 = -0.15, z0 = -0.6, wall = '#ffe79a';
  cottage(g, { x: x0, z: z0, w: 2.05, d: 1.25, h: 1.15, wall, roof: PAL.roofRed, roofH: 0.65, plinth: PAL.stone, timber: '#8d5a3b' });
  g.add(doorway(x0, z0 + 0.64, 0, { color: '#2e7d32' }));
  for (const dx of [-0.65, 0.65]) g.add(win(x0 + dx, 0.62, z0 + 0.64, 0, { w: 0.36, h: 0.36, shutter: '#2e7d32' }));
  g.add(win(x0 + 1.035, 0.62, z0, H, { shutter: '#2e7d32' }));
  g.add(place(plaque(ICON.bowl(), { r: 0.22, rim: '#2e7d32' }), x0, 1.0, z0 + 0.66));
  g.add(place(chimney(0.6, PAL.brick), x0 + 0.65, 1.35, z0 - 0.25));
  // terrace deck + 2 parasol tables
  g.add(place(box(2.6, 0.06, 1.3, PAL.plank, { r: 0.02 }), 0, 0.06, 0.7));
  for (let i = 0; i < 6; i++) g.add(place(box(2.6, 0.01, 0.02, PAL.woodDark, tiny), 0, 0.095, 0.15 + i * 0.22));
  const parasols = [];
  [[-0.65, 0.75, PAL.roofRed], [0.75, 0.7, '#2e7d32']].forEach(([x, z, c]) => {
    g.add(place(cyl(0.25, 0.25, 0.04, PAL.white, { seg: 14 }), x, 0.5, z));
    g.add(place(cyl(0.03, 0.03, 1.3, PAL.woodDark, { seg: 6 }), x, 0.7, z));
    const p = group(place(cone(0.55, 0.28, c, { seg: 8 }), 0, 0, 0), place(cone(0.56, 0.06, PAL.white, { seg: 8, shadow: false }), 0, -0.13, 0));
    p.position.set(x, 1.35, z); g.add(p); parasols.push(p);
    for (const s of [-1, 1]) {
      const ch = group(place(box(0.2, 0.04, 0.2, PAL.wood, tiny), 0, 0.28, 0), place(box(0.2, 0.25, 0.04, PAL.wood, tiny), 0, 0.42, -s * 0.09), place(box(0.03, 0.26, 0.03, PAL.woodDark, tiny), 0, 0.14, 0));
      g.add(place(ch, x, 0.06, z + s * 0.38));
    }
    g.add(place(ICON.bowl(), x - 0.07, 0.58, z));
    g.add(place(cyl(0.03, 0.03, 0.12, '#c0392b', { seg: 6, shadow: false }), x + 0.12, 0.58, z + 0.05));
  });
  // menu easel
  const easel = group(place(box(0.3, 0.38, 0.03, '#3b3b3b', { r: 0.01 }), 0, 0.42, 0), place(box(0.34, 0.03, 0.05, PAL.wood, tiny), 0, 0.62, 0), place(box(0.03, 0.6, 0.03, PAL.wood, tiny), -0.13, 0.3, 0.02), place(box(0.03, 0.6, 0.03, PAL.wood, tiny), 0.13, 0.3, 0.02));
  const ic = ICON.bowl(); ic.scale.setScalar(0.8); ic.position.set(0, 0.42, 0.03); easel.add(ic);
  g.add(place(easel, 0.05, 0.06, 1.2, -0.2));
  // herb pots
  for (const [x, z] of [[-1.25, -0.05], [1.3, -0.05]]) g.add(place(group(place(cyl(0.12, 0.09, 0.2, PAL.brick, { seg: 10 }), 0, 0.1, 0), place(ball(0.14, leafMat(PAL.leaf), { low: true }), 0, 0.27, 0)), x, 0.06, z));
  const smoke = makeSmoke(x0 + 0.65, 1.98, z0 - 0.25, { size: 0.12 });
  g.add(smoke.group);
  return {
    spots: { boxes: [[x0 - 0.65, 0.4, z0 + 0.7, 0.38], [x0 + 0.65, 0.4, z0 + 0.7, 0.38]], flag: [x0 - 1.06, 1.75, z0], vane: [x0 - 0.3, 1.85, z0] },
    anim: (t, on) => { smoke.update(t, on); parasols[0].rotation.z = Math.sin(t * 1.3) * 0.03; parasols[1].rotation.x = Math.sin(t * 1.1) * 0.03; },
  };
}

// ------------------------------------------------------------------ chandler: steep maroon roof, giant candle, glowing windows
function chandler(g) {
  g.add(pad(2.8, 2.7, '#d8c79c'));
  const x0 = -0.35, z0 = -0.3, plum = '#8e2f4f', wood = '#a0663a';
  cottage(g, { x: x0, z: z0, w: 1.65, d: 1.4, h: 1.15, wall: '#f5e4c4', roof: plum, roofH: 1.05, plinth: PAL.stoneDark, gable: '#f5e4c4' });
  // plank cladding lower half
  g.add(place(box(1.69, 0.5, 1.44, wood, { r: 0.03 }), x0, 0.43, z0));
  for (let i = 0; i < 3; i++) g.add(place(box(1.7, 0.02, 1.45, shade(wood, 0.8), tiny), x0, 0.28 + i * 0.14, z0));
  g.add(doorway(x0 - 0.35, z0 + 0.72, 0, { color: plum }));
  g.add(win(x0 + 0.35, 0.82, z0 + 0.73, 0, { w: 0.42, h: 0.34, frame: PAL.cream }));
  g.add(win(x0 + 0.84, 0.82, z0, H, { frame: PAL.cream }));
  // candles on the window sill (glow at night)
  const flameM = M('#ffcf5a', { emissive: '#ffb52e', glow: true });
  for (const dx of [-0.13, 0, 0.13]) { g.add(place(cyl(0.025, 0.025, 0.12, '#fff1c9', { seg: 6, shadow: false }), x0 + 0.35 + dx, 0.66, z0 + 0.8)); g.add(place(ball(0.022, flameM, tiny), x0 + 0.35 + dx, 0.74, z0 + 0.8)); }
  // giant candle sign on a stand
  const cx = 0.95, cz = 0.55;
  g.add(place(cyl(0.3, 0.34, 0.16, PAL.gold, { seg: 14 }), cx, 0.08, cz));
  g.add(place(cyl(0.2, 0.2, 0.06, '#d4a020', { seg: 14 }), cx, 0.18, cz));
  g.add(place(cyl(0.17, 0.17, 1.1, '#fff1c9', { seg: 14 }), cx, 0.76, cz));
  for (let i = 0; i < 4; i++) { const a = i * 1.7; g.add(place(capsuleFlat(0.035, 0.08 + (i % 2) * 0.1, '#fff8e1').rotateZ(H).rotateY(0), cx + Math.cos(a) * 0.16, 1.2 - (i % 2) * 0.1, cz + Math.sin(a) * 0.16)); }
  const flame = group(place(ball(0.1, M('#ff9800', { emissive: '#ff7a00', snow: 0 }), tiny), 0, 0, 0), place(cone(0.08, 0.22, M('#ffd54f', { emissive: '#ffb300', snow: 0 }), tiny), 0, 0.13, 0));
  flame.position.set(cx, 1.42, cz);
  g.add(flame);
  g.add(place(cyl(0.01, 0.01, 0.08, '#3b3b3b', { seg: 4, shadow: false }), cx, 1.33, cz));
  // beeswax blocks + dipping rack
  for (let i = 0; i < 3; i++) g.add(place(box(0.22, 0.12, 0.16, '#f2c14e', { r: 0.02 }), -0.7 + i * 0.25, 0.06, 0.95));
  g.add(place(box(0.2, 0.12, 0.15, '#f2c14e', { r: 0.02 }), -0.58, 0.18, 0.95));
  g.add(place(box(0.8, 0.04, 0.04, PAL.woodDark, tiny), 0.15, 0.75, 0.95));
  for (const dx of [-0.38, 0.38]) g.add(place(box(0.04, 0.75, 0.04, PAL.woodDark, tiny), 0.15 + dx, 0.37, 0.95));
  const dips = [];
  ['#e53935', '#fff1c9', '#9c6ade', '#4caf50', '#ffc83d'].forEach((c, i) => { const d = cyl(0.022, 0.03, 0.3, c, { seg: 6, shadow: false }); d.position.set(-0.1 + i * 0.12, 0.58, 0.95); g.add(d); dips.push(d); });
  g.add(place(chimney(0.5, PAL.stoneDark), x0 - 0.45, 1.5, z0 - 0.3));
  const smoke = makeSmoke(x0 - 0.45, 2.02, z0 - 0.3, { size: 0.11, color: '#e8e8e8' });
  g.add(smoke.group);
  g.add(place(bush(0.17), -1.25, 0, 0.6));
  return {
    spots: { boxes: [[x0 + 0.35, 0.58, z0 + 0.8, 0.46]], flag: [x0 + 0.84, 1.75, z0 + 0.5], vane: [x0, 2.25, z0] },
    anim: (t, on) => {
      const k = on ? 1 + Math.sin(t * 17) * 0.12 + Math.sin(t * 7.3) * 0.08 : 0.85;
      flame.scale.set(k, k * (on ? 1.15 : 1), k);
      for (let i = 0; i < dips.length; i++) dips[i].position.y = 0.58 + (on ? Math.sin(t * 2 + i * 0.9) * 0.05 : 0);
      smoke.update(t, on);
    },
  };
}

// ------------------------------------------------------------------ café: striped awning, giant steaming cup on the roof
function cafe(g) {
  g.add(pad(2.8, 2.7, '#e2d1b0'));
  const x0 = -0.15, z0 = -0.45, brown = '#7a4a2e', wall = '#fff6e8';
  cottage(g, { x: x0, z: z0, w: 2.2, d: 1.35, h: 1.25, wall, roof: brown, roofH: 0.45, plinth: '#a1887f' });
  g.add(place(box(2.24, 0.12, 1.39, '#c49a6c', { r: 0.03 }), x0, 1.2, z0));
  g.add(doorway(x0 + 0.65, z0 + 0.69, 0, { color: brown, frame: '#c49a6c' }));
  g.add(win(x0 - 0.3, 0.62, z0 + 0.7, 0, { w: 0.95, h: 0.45, frame: '#c49a6c', cross: false }));
  g.add(win(x0 + 1.11, 0.68, z0, H, { frame: '#c49a6c' }));
  // long striped awning across the front
  for (let i = 0; i < 12; i++) g.add(place(box(0.18, 0.035, 0.55, i % 2 ? PAL.cream : brown, tiny), x0 - 0.99 + i * 0.18, 1.05, z0 + 0.93).rotateX(0.42));
  for (let i = 0; i < 12; i++) g.add(place(cyl(0.09, 0.09, 0.03, i % 2 ? PAL.cream : brown, { seg: 8, shadow: false }), x0 - 0.99 + i * 0.18, 0.92, z0 + 1.18).rotateX(H));
  // giant cup on the roof
  const cup = ICON.cup(); cup.scale.setScalar(3.3); cup.position.set(x0 - 0.2, 1.95, z0 + 0.1); cup.traverse((o) => { o.castShadow = true; });
  g.add(cup);
  // bistro-free: a bench + two small café tables
  [[-0.7, 0.75], [0.35, 0.95]].forEach(([x, z]) => {
    g.add(place(cyl(0.18, 0.18, 0.03, '#3b3b3b', { seg: 12 }), x, 0.46, z));
    g.add(place(cyl(0.02, 0.07, 0.45, '#3b3b3b', { seg: 6 }), x, 0.22, z));
    const c1 = ICON.cup(); c1.scale.setScalar(0.5); g.add(place(c1, x - 0.05, 0.51, z));
    g.add(place(cyl(0.05, 0.05, 0.04, '#e0a050', { seg: 8, shadow: false }), x + 0.08, 0.49, z + 0.03));
    for (const s of [-1, 1]) g.add(place(group(place(cyl(0.1, 0.1, 0.03, '#3b3b3b', { seg: 10 }), 0, 0.3, 0), place(cyl(0.015, 0.015, 0.3, '#3b3b3b', { seg: 4 }), 0, 0.15, 0)), x + s * 0.32, 0, z));
  });
  // coffee sacks
  for (const [x, z, r] of [[1.15, 0.65, 0], [1.2, 0.95, 0.6]]) { const s = ICON.sack('#a1887f'); s.scale.setScalar(1.5); place(s, x, 0.16, z, r); g.add(s); }
  g.add(place(group(place(cyl(0.12, 0.09, 0.2, PAL.brick, { seg: 10 }), 0, 0.1, 0), place(ball(0.15, leafMat(PAL.leafDark), { low: true }), 0, 0.28, 0)), -1.25, 0, 0.15));
  const steam = makeSmoke(x0 - 0.2, 2.3, z0 + 0.1, { n: 4, size: 0.12, rise: 0.8, drift: 0.05, opacity: 0.85 });
  g.add(steam.group);
  return {
    spots: { boxes: [[x0 + 1.18, 0.45, z0, 0.36, H]], flag: [x0 + 0.9, 1.25, z0 - 0.3], vane: [x0 + 0.8, 1.75, z0] },
    anim: (t, on) => steam.update(t, on, 0.35),
  };
}

// ------------------------------------------------------------------ perfumery: lavender walls, purple roof, onion-dome turret, bottles
function perfumery(g) {
  g.add(pad(2.8, 2.7, '#e6dcef'));
  const x0 = -0.33, z0 = -0.35, purple = '#8e5cc9', wall = '#f4ecff';
  cottage(g, { x: x0, z: z0, w: 1.8, d: 1.4, h: 1.15, wall, roof: purple, roofH: 0.7, plinth: '#cbbfe0', timber: '#b39ddb' });
  g.add(doorway(x0 - 0.35, z0 + 0.71, 0, { color: purple, frame: PAL.gold }));
  g.add(win(x0 + 0.4, 0.62, z0 + 0.72, 0, { w: 0.44, h: 0.38, frame: PAL.white, shutter: '#b39ddb' }));
  // turret with onion dome
  const tx = 0.8, tz = 0.1;
  g.add(place(cyl(0.45, 0.48, 0.18, '#cbbfe0', { seg: 14 }), tx, 0.09, tz));
  g.add(place(cyl(0.42, 0.42, 1.6, wall, { seg: 14 }), tx, 0.95, tz));
  g.add(place(mesh(GEO.torus(0.43, 0.04, 6, 20), M(PAL.gold), tiny), tx, 1.72, tz).rotateX(H));
  const dome = mesh(GEO.lathe('onion', [[0, 0], [0.46, 0.05], [0.5, 0.22], [0.36, 0.48], [0.12, 0.7], [0.03, 0.85], [0, 0.9]], 14), M(purple));
  dome.position.set(tx, 1.74, tz); g.add(dome);
  g.add(place(ball(0.05, PAL.gold, tiny), tx, 2.68, tz));
  g.add(place(cyl(0.012, 0.012, 0.2, PAL.gold, { seg: 4, shadow: false }), tx, 2.78, tz));
  g.add(win(tx, 1.2, tz + 0.42, 0, { w: 0.22, h: 0.32, frame: PAL.white }));
  g.add(win(tx + 0.42, 0.65, tz, H, { w: 0.22, h: 0.32, frame: PAL.white }));
  g.add(place(plaque(ICON.bottle('#e94f9a'), { r: 0.2, rim: PAL.gold }), tx - 0.05, 0.62, tz + 0.43).rotateY(-0.1));
  // bottle display shelf
  g.add(place(box(1.0, 0.06, 0.3, PAL.white, { r: 0.02 }), -0.6, 0.42, 0.85));
  for (const dx of [-0.45, 0.45]) g.add(place(box(0.05, 0.42, 0.28, '#b39ddb', tiny), -0.6 + dx, 0.21, 0.85));
  ['#b57cf0', '#e94f9a', '#4fc3f7', '#ffc83d'].forEach((c, i) => { const b = ICON.bottle(c); b.scale.setScalar(0.9); place(b, -0.92 + i * 0.21, 0.54, 0.85); g.add(b); });
  // lavender pots
  const lav = M('#9c6ade', { sway: 0.02 });
  for (const [x, z] of [[0.3, 1.05], [-1.25, 0.25], [1.25, -0.9]]) {
    const p = group(place(cyl(0.13, 0.1, 0.18, '#d7a86e', { seg: 10 }), 0, 0.09, 0), place(ball(0.12, leafMat('#7aa874'), { low: true }), 0, 0.22, 0));
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4; p.add(place(capsuleFlat(0.025, 0.08, '#9c6ade').rotateZ(H), Math.cos(a) * 0.06, 0.34, Math.sin(a) * 0.06)); }
    p.children.slice(2).forEach((m) => { m.material = lav; });
    g.add(place(p, x, 0, z));
  }
  g.add(place(chimney(0.45, '#cbbfe0'), x0 - 0.45, 1.35, z0 - 0.3));
  const puffs = makeSmoke(x0 - 0.45, 1.8, z0 - 0.3, { size: 0.12, color: '#f3d9ff' });
  g.add(puffs.group);
  const sparkle = makeSmoke(tx, 2.6, tz, { n: 3, size: 0.06, color: '#ffe0f5', rise: 0.5 });
  g.add(sparkle.group);
  return {
    spots: { boxes: [[x0 + 0.4, 0.4, z0 + 0.78, 0.44]], flag: [x0 - 0.92, 1.7, z0], vane: [x0, 1.85, z0] },
    anim: (t, on) => { puffs.update(t, on); sparkle.update(t * 1.5, on); },
  };
}

const BUILDERS = { feedmill, mill, bakery, workshop, sugarmill, dairy, loom, press, cannery, greenhouse, pastry, tailor, bistro, chandler, cafe, perfumery };

/** Build production building `key` at upgrade `level` (1..4). */
export function makeBuilding(key, level = 1) {
  const g = group();
  const make = BUILDERS[key];
  if (!make) throw new Error('unknown building ' + key);
  const { spots, anim } = make(g);
  const lvl = Math.max(1, Math.min(4, level | 0));
  const decor = levelDecor(g, lvl, spots);
  g.name = 'building_' + key;
  g.userData.key = key;
  g.userData.level = lvl;
  g.userData.state = { working: false };
  g.userData.anim = (t, dt = 1 / 60) => { const on = !!g.userData.state.working; anim(t, on, dt); decor(t); };
  return g;
}

const working = (key, level = 1) => () => { const b = makeBuilding(key, level); b.userData.state.working = true; return b; };

export const PROD_CATALOG = {};
for (const key of Object.keys(BUILDERS)) PROD_CATALOG[key] = () => makeBuilding(key, 1);
for (const key of ['mill', 'bakery', 'dairy']) PROD_CATALOG[key + '_lvl4'] = () => makeBuilding(key, 4);
PROD_CATALOG.workshop_lvl2 = () => makeBuilding('workshop', 2);
PROD_CATALOG.pastry_lvl3 = () => makeBuilding('pastry', 3);
for (const key of ['mill', 'bakery', 'workshop', 'sugarmill', 'press', 'chandler', 'cafe', 'greenhouse']) PROD_CATALOG[key + '_working'] = working(key);
