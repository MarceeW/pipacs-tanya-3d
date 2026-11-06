// Farm animals, villagers and ambient critters for Pipacs Tanya 3D.
// Chunky, rounded cartoon creatures with big heads and bead eyes. All face +z at rotation 0.
//
// Animal contract (makeAnimal):
//   g.userData.state = { moving, eating, happy, ready }   – mutated by the world
//   g.userData.anim  = (t, dt) => {}                       – reads state every frame
//   moving → leg swing + body bob; eating → head dips to the ground (peck / graze);
//   happy → little hops; idle → breathing, head turns, tail wags, ear flicks, blinks.
//   The world owns g.position / g.rotation; animation only touches an inner rig.
import { PAL, GEO, mesh, box, cyl, cone, ball, capsule, group, place, blobShadow } from '../lib.js';
import { C, NS, INK, BLUSH, pivot, eyes, cheeks, ease, blip, blink } from './animals_kit.js';
import { makeVillager, makeFarmer, makePortrait, VILLAGERS } from './animals_people.js';

export { makeVillager, makeFarmer, makePortrait, VILLAGERS };

// ------------------------------------------------------------------ shared rig + animator
function base() {
  const g = group();
  const rig = group();
  const torso = group();
  rig.add(torso);
  g.add(rig);
  g.userData.state = { moving: false, eating: false, happy: false, ready: false };
  return { g, rig, torso };
}

/** Leg on a hip pivot: capsule + hoof/foot. Returns the pivot. */
function leg(x, y, z, len, r, color, footColor, footScale = [1, 0.7, 1.2]) {
  const p = pivot(x, y, z);
  p.add(place(capsule(r, Math.max(0.01, len - 2 * r), C(color)), 0, -len / 2 + r * 0.3, 0));
  if (footColor) {
    const f = ball(r * 1.15, C(footColor), NS);
    f.scale.set(...footScale);
    f.position.set(0, -len + r * 0.5, r * 0.25);
    p.add(f);
  }
  return p;
}

/**
 * Generic creature animator.
 * P: { rig, torso, neck, legs:[{p, ph}], tail, tailBase, tailAmp, ears:[{p, s, base}], wings:[{p, s}],
 *      eyes, speed, swing, bob, hop, eat:{ rot, drop, fwd, rate, peck } }
 */
function animate(g, P) {
  const st = g.userData.state;
  const ph = Math.random() * 100;
  const k = { move: 0, eat: 0, happy: 0 };
  const n0 = P.neck.position.clone();
  const r0 = P.neck.rotation.x;
  const tailBase = P.tailBase ?? 0;
  g.userData.anim = (t, dt) => {
    dt = Math.min(dt || 0.016, 0.1);
    const tt = t + ph;
    k.move = ease(k.move, st.moving ? 1 : 0, dt, 6);
    k.eat = ease(k.eat, st.eating && !st.moving ? 1 : 0, dt, 5);
    k.happy = ease(k.happy, st.happy ? 1 : 0, dt, 5);
    const w = tt * P.speed;

    for (const L of P.legs) L.p.rotation.x = Math.sin(w + L.ph) * P.swing * k.move;
    let y = Math.abs(Math.sin(w)) * P.bob * k.move;
    y += Math.max(0, Math.sin(tt * 7)) * (P.hop ?? 0.08) * k.happy;
    P.rig.position.y = y;
    P.rig.rotation.x = -Math.sin(w * 2) * 0.03 * k.move;

    const breath = Math.sin(tt * 2.4) * 0.025 * (1 - k.move);
    P.torso.scale.set(1 + breath * 0.5, 1 + breath, 1);

    // head: occasional look left/right while idle, dip to the ground while eating
    const look = (blip(tt * 0.31, 4) - blip(tt * 0.31 + Math.PI, 4)) * 0.55;
    const E = P.eat;
    const amt = E.peck
      ? 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(tt * E.rate)), 0.6)
      : 0.88 + 0.12 * Math.sin(tt * E.rate);
    const d = amt * k.eat;
    P.neck.rotation.x = r0 + d * E.rot + Math.sin(tt * 1.3) * 0.04 * (1 - k.eat);
    P.neck.position.y = n0.y - d * E.drop;
    P.neck.position.z = n0.z + d * (E.fwd || 0);
    P.neck.rotation.y = look * (1 - k.eat) * (1 - 0.7 * k.move);
    P.neck.rotation.z = Math.sin(tt * 6) * 0.18 * k.happy;

    if (P.tail) {
      const wag = 0.35 + blip(tt * 0.5, 3) * 0.8 + k.happy * 1.2 + k.move * 0.4;
      P.tail.rotation.z = Math.sin(tt * (P.tailRate || 9)) * (P.tailAmp ?? 0.3) * wag;
      P.tail.rotation.x = tailBase;
    }
    if (P.ears) P.ears.forEach((E2, i) => {
      E2.p.rotation.z = E2.base + blip(tt * 0.9 + i * 1.7, 40) * 0.5 * E2.s;
    });
    if (P.wings) {
      const flap = Math.min(1, blip(tt * 0.45, 30) * 1.5 + k.happy);
      const a = 0.05 + flap * (0.35 + 0.55 * Math.abs(Math.sin(tt * 26)));
      for (const W of P.wings) W.p.rotation.z = W.s * a;
    }
    if (P.eyes) blink(P.eyes, tt);
    if (P.extra) P.extra(tt, k);
  };
}

// ------------------------------------------------------------------ birds of the yard
function makeChicken() {
  const { g, rig, torso } = base();
  const body = '#fff7ea', red = '#e53935', beak = '#ffb300';
  torso.add(place(ball(0.14, C(body)), 0, 0.2, -0.01));
  torso.children[0].scale.set(1, 0.92, 1.18);
  // tail feathers
  for (const [x, y, z, r] of [[0, 0.32, -0.15, 0.065], [-0.05, 0.28, -0.16, 0.05], [0.05, 0.28, -0.16, 0.05]]) {
    torso.add(place(ball(r, C(body), NS), x, y, z));
  }
  const wings = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.12, 0.25, 0);
    const wgt = ball(0.075, C('#f3e6cf'), NS);
    wgt.scale.set(0.45, 0.75, 1.25);
    wgt.position.set(s * 0.015, -0.04, -0.02);
    p.add(wgt);
    torso.add(p);
    wings.push({ p, s });
  }
  // head
  const neck = pivot(0, 0.27, 0.09);
  neck.add(place(ball(0.1, C(body)), 0, 0.08, 0.04));
  for (const [y, z, r] of [[0.19, 0.03, 0.035], [0.2, 0.07, 0.03], [0.18, -0.01, 0.028]]) neck.add(place(ball(r, C(red), NS), 0, y, z));
  const bk = cone(0.035, 0.07, C(beak), { ...NS, seg: 8 });
  bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.07, 0.16);
  neck.add(bk);
  neck.add(place(ball(0.022, C(red), NS), 0, 0.02, 0.13));
  const ey = eyes(neck, 0.055, 0.11, 0.105, 0.024, { yaw: 0.5 });
  cheeks(neck, 0.07, 0.06, 0.1, 0.022);
  torso.add(neck);
  // legs
  const legs = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.05, 0.11, 0);
    p.add(place(cyl(0.012, 0.012, 0.1, C(beak), NS), 0, -0.05, 0));
    p.add(place(box(0.05, 0.015, 0.06, C(beak), { ...NS, r: 0.007 }), 0, -0.1, 0.02));
    rig.add(p);
    legs.push({ p, ph: s > 0 ? 0 : Math.PI });
  }
  g.add(blobShadow(0.17, 0.25));
  animate(g, {
    rig, torso, neck, legs, wings, eyes: ey, speed: 16, swing: 0.7, bob: 0.025, hop: 0.07,
    eat: { rot: 1.0, drop: 0.13, fwd: 0.05, rate: 9, peck: true },
  });
  return g;
}

function makeDuck() {
  const { g, rig, torso } = base();
  const body = '#fdfdf8', bill = '#ff9f1c';
  const b = ball(0.15, C(body)); b.scale.set(1, 0.82, 1.3); b.position.set(0, 0.18, -0.02);
  torso.add(b);
  const tl = cone(0.06, 0.12, C(body), { ...NS, seg: 8 });
  tl.rotation.x = -2.2; tl.position.set(0, 0.25, -0.2);
  torso.add(tl);
  const wings = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.13, 0.22, -0.01);
    const wg = ball(0.085, C('#eef1ea'), NS);
    wg.scale.set(0.42, 0.62, 1.35); wg.position.set(s * 0.01, -0.03, -0.03);
    p.add(wg);
    torso.add(p);
    wings.push({ p, s });
  }
  const neck = pivot(0, 0.24, 0.12);
  neck.add(place(ball(0.065, C(body), NS), 0, 0.05, 0.0));
  neck.add(place(ball(0.11, C(body)), 0, 0.15, 0.03));
  neck.add(place(ball(0.04, C('#ffe066'), NS), 0, 0.26, 0.0));   // little yellow tuft
  const bl = box(0.11, 0.035, 0.11, C(bill), { ...NS, r: 0.016 });
  bl.position.set(0, 0.12, 0.16); bl.rotation.x = 0.12;
  neck.add(bl);
  const ey = eyes(neck, 0.055, 0.18, 0.095, 0.025, { yaw: 0.55 });
  cheeks(neck, 0.075, 0.12, 0.09, 0.022);
  torso.add(neck);
  const legs = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.055, 0.08, 0.0);
    p.add(place(cyl(0.013, 0.013, 0.07, C(bill), NS), 0, -0.035, 0));
    p.add(place(box(0.07, 0.014, 0.075, C(bill), { ...NS, r: 0.006 }), 0, -0.072, 0.025));
    rig.add(p);
    legs.push({ p, ph: s > 0 ? 0 : Math.PI });
  }
  g.add(blobShadow(0.19, 0.25));
  animate(g, {
    rig, torso, neck, legs, wings, eyes: ey, speed: 12, swing: 0.6, bob: 0.02, hop: 0.06,
    eat: { rot: 1.0, drop: 0.1, fwd: 0.06, rate: 6, peck: true },
    extra: (tt, k) => { torso.rotation.z = Math.sin(tt * 6) * 0.08 * k.move; },   // waddle
  });
  return g;
}

// ------------------------------------------------------------------ hoofed animals
function makeCow() {
  const { g, rig, torso } = base();
  const W = '#fffdf7', P = '#2f2826', pink = '#f7a7b0', hoof = '#5a4639';
  torso.add(place(box(0.52, 0.42, 0.84, C(W), { r: 0.17 }), 0, 0.56, 0));
  for (const [x, y, z, sx, sy, sz, r] of [
    [0.19, 0.6, 0.1, 0.5, 1, 1.25, 0.16], [0.17, 0.5, -0.24, 0.5, 0.9, 1, 0.13],
    [-0.19, 0.6, -0.05, 0.5, 1.1, 1.6, 0.15],
  ]) {
    const s = ball(r, C(P), NS); s.scale.set(sx, sy, sz); s.position.set(x, y, z); torso.add(s);
  }
  // head on neck pivot
  const neck = pivot(0, 0.66, 0.38);
  neck.add(place(box(0.34, 0.31, 0.3, C(W), { r: 0.11 }), 0, 0.03, 0.15));
  neck.add(place(box(0.36, 0.17, 0.15, C(pink), { r: 0.07 }), 0, -0.07, 0.29));
  for (const s of [-1, 1]) neck.add(place(ball(0.022, C('#b5606d'), NS), s * 0.07, -0.05, 0.37));
  const ey = eyes(neck, 0.095, 0.08, 0.29, 0.042, { yaw: 0.3 });
  const hp = ball(0.09, C(P), NS); hp.scale.set(0.6, 0.9, 1); hp.position.set(0.14, 0.08, 0.12);   // patch round one ear
  neck.add(hp);
  const ears = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.17, 0.09, 0.1);
    const e = ball(0.07, C(s > 0 ? P : W), NS); e.scale.set(1.5, 0.5, 0.9); e.position.x = s * 0.06;
    p.add(e);
    const h = cone(0.04, 0.13, C('#f6e7c1'), { ...NS, seg: 8 });
    h.position.set(-s * 0.05, 0.12, -0.01); h.rotation.z = -s * 0.45;
    p.add(h);
    neck.add(p);
    ears.push({ p, s, base: -s * 0.15 });
  }
  // collar + bell
  const col = mesh(GEO.torus(0.15, 0.022, 6, 16), C('#e53935'), NS);
  col.rotation.x = Math.PI / 2 + 0.5; col.position.set(0, -0.08, 0.06);
  neck.add(col);
  neck.add(place(cyl(0.035, 0.06, 0.08, C(PAL.gold), NS), 0, -0.2, 0.17));
  torso.add(neck);
  // tail
  const tail = pivot(0, 0.7, -0.42);
  tail.add(place(cyl(0.018, 0.018, 0.32, C(W), NS), 0, -0.16, 0));
  tail.add(place(ball(0.045, C(P), NS), 0, -0.33, 0));
  torso.add(tail);
  const legs = [];
  for (const [x, z, ph] of [[0.15, 0.27, 0], [-0.15, 0.27, Math.PI], [0.15, -0.27, Math.PI], [-0.15, -0.27, 0]]) {
    const p = leg(x, 0.36, z, 0.36, 0.068, W, hoof, [1, 0.6, 1.05]);
    rig.add(p);
    legs.push({ p, ph });
  }
  g.add(blobShadow(0.55, 0.25));
  animate(g, {
    rig, torso, neck, legs, tail, tailBase: 0.15, tailAmp: 0.35, tailRate: 4, ears, eyes: ey,
    speed: 7, swing: 0.45, bob: 0.025, hop: 0.06,
    eat: { rot: 0.95, drop: 0.28, fwd: 0.05, rate: 3.5 },
  });
  return g;
}

function makePig() {
  const { g, rig, torso } = base();
  const P = '#f9a9bc', D = '#ee8ba3', N = '#a24b62';
  const b = ball(0.24, C(P)); b.scale.set(1, 0.88, 1.38); b.position.set(0, 0.31, -0.02);
  torso.add(b);
  const neck = pivot(0, 0.34, 0.26);
  neck.add(place(ball(0.18, C(P)), 0, 0.03, 0.08));
  const sn = cyl(0.075, 0.085, 0.08, C(D), NS);
  sn.rotation.x = Math.PI / 2; sn.position.set(0, -0.02, 0.26);
  neck.add(sn);
  for (const s of [-1, 1]) neck.add(place(ball(0.017, C(N), NS), s * 0.03, -0.015, 0.3));
  const ey = eyes(neck, 0.075, 0.08, 0.215, 0.032);
  cheeks(neck, 0.12, 0.0, 0.18, 0.035, '#ff7f9c');
  const ears = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.11, 0.17, 0.04);
    const e = cone(0.065, 0.12, C(D), { ...NS, seg: 8 });
    e.position.set(0, 0.04, 0.02); e.rotation.set(0.7, 0, -s * 0.25);
    p.add(e);
    neck.add(p);
    ears.push({ p, s, base: 0 });
  }
  torso.add(neck);
  const tail = pivot(0, 0.36, -0.34);
  const tw = mesh(GEO.torus(0.035, 0.012, 6, 12, Math.PI * 1.6), C(D), NS);
  tw.position.set(0, 0.03, -0.02); tw.rotation.y = Math.PI / 2;
  tail.add(tw);
  torso.add(tail);
  const legs = [];
  for (const [x, z, ph] of [[0.12, 0.17, 0], [-0.12, 0.17, Math.PI], [0.12, -0.2, Math.PI], [-0.12, -0.2, 0]]) {
    const p = leg(x, 0.17, z, 0.17, 0.055, P, '#c9738a', [1, 0.6, 1]);
    rig.add(p);
    legs.push({ p, ph });
  }
  g.add(blobShadow(0.38, 0.25));
  animate(g, {
    rig, torso, neck, legs, tail, tailAmp: 0.5, tailRate: 12, ears, eyes: ey,
    speed: 11, swing: 0.55, bob: 0.025, hop: 0.07,
    eat: { rot: 0.75, drop: 0.16, fwd: 0.05, rate: 7 },
  });
  return g;
}

function makeSheep() {
  const { g, rig, torso } = base();
  const wool = '#fbf8f0', wool2 = '#f1ece0', face = '#54443b', leg2 = '#3a302b';
  const core = ball(0.26, C(wool), { low: true }); core.scale.set(1, 0.85, 1.25); core.position.set(0, 0.44, -0.02);
  torso.add(core);
  const puffs = [
    [0.17, 0.53, 0.14, 0.14], [-0.17, 0.53, 0.14, 0.14], [0.2, 0.47, -0.14, 0.14], [-0.2, 0.47, -0.14, 0.14],
    [0, 0.63, 0.04, 0.15], [0, 0.6, -0.2, 0.14], [0.22, 0.36, 0.02, 0.12], [-0.22, 0.36, 0.02, 0.12],
  ];
  puffs.forEach(([x, y, z, r], i) => torso.add(place(ball(r, C(i % 2 ? wool2 : wool), { low: true, shadow: i < 5 }), x, y, z)));
  const neck = pivot(0, 0.5, 0.36);
  const hd = ball(0.145, C(face)); hd.scale.set(0.92, 1, 1.1); hd.position.set(0, -0.01, 0.1);
  neck.add(hd);
  neck.add(place(ball(0.085, C(wool), { low: true, shadow: false }), 0, 0.125, 0.05));
  neck.add(place(ball(0.032, C('#f29bb0'), NS), 0, -0.05, 0.26));
  const ey = eyes(neck, 0.068, 0.035, 0.235, 0.026, { white: true, yaw: 0.4 });
  const ears = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.12, 0.04, 0.06);
    const e = ball(0.055, C(face), NS); e.scale.set(1.6, 0.5, 0.8); e.position.x = s * 0.06;
    p.add(e);
    neck.add(p);
    ears.push({ p, s, base: -s * 0.3 });
  }
  torso.add(neck);
  const tail = pivot(0, 0.5, -0.4, place(ball(0.07, C(wool), { low: true, shadow: false }), 0, 0, -0.02));
  torso.add(tail);
  const legs = [];
  for (const [x, z, ph] of [[0.12, 0.2, 0], [-0.12, 0.2, Math.PI], [0.12, -0.22, Math.PI], [-0.12, -0.22, 0]]) {
    const p = leg(x, 0.26, z, 0.26, 0.04, leg2, '#2a2220', [1, 0.6, 1.1]);
    rig.add(p);
    legs.push({ p, ph });
  }
  g.add(blobShadow(0.42, 0.25));
  animate(g, {
    rig, torso, neck, legs, tail, tailAmp: 0.4, tailRate: 10, ears, eyes: ey,
    speed: 9, swing: 0.5, bob: 0.03, hop: 0.08,
    eat: { rot: 1.0, drop: 0.2, fwd: 0.04, rate: 4 },
  });
  return g;
}

function makeGoat() {
  const { g, rig, torso } = base();
  const W = '#d3a679', B = '#7a5236', Cr = '#fbf1df', horn = '#9c917f', beard = '#fbf1df';
  torso.add(place(box(0.34, 0.3, 0.6, C(W), { r: 0.13 }), 0, 0.46, -0.02));
  const st = ball(0.1, C(B), NS); st.scale.set(0.6, 0.3, 2.6); st.position.set(0, 0.585, -0.04); torso.add(st);   // dark back stripe
  const belly = ball(0.15, C(Cr), NS); belly.scale.set(1.05, 0.5, 1.6); belly.position.set(0, 0.36, 0); torso.add(belly);
  const neck = pivot(0, 0.56, 0.24);
  const nk = capsule(0.075, 0.12, C(W)); nk.rotation.x = 0.5; nk.position.set(0, 0.07, 0.04);
  neck.add(nk);
  neck.add(place(box(0.21, 0.21, 0.27, C(W), { r: 0.09 }), 0, 0.17, 0.12));
  neck.add(place(box(0.17, 0.1, 0.07, C(Cr), { ...NS, r: 0.035 }), 0, 0.12, 0.245));
  neck.add(place(ball(0.02, C('#6b3f2a'), NS), 0, 0.15, 0.285));
  const ey = eyes(neck, 0.07, 0.22, 0.2, 0.03, { yaw: 0.45 });
  const bd = cone(0.04, 0.12, C(beard), { ...NS, seg: 8 });
  bd.rotation.x = Math.PI; bd.position.set(0, 0.02, 0.2);
  neck.add(bd);
  const ears = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.1, 0.22, 0.07);
    const e = ball(0.05, C(W), NS); e.scale.set(1.6, 0.5, 0.85); e.position.x = s * 0.06;
    p.add(e);
    neck.add(p);
    ears.push({ p, s, base: s * 0.25 });
    const h1 = cone(0.03, 0.13, C(horn), { ...NS, seg: 8 });
    h1.position.set(s * 0.05, 0.33, 0.04); h1.rotation.set(-0.75, 0, -s * 0.15);
    neck.add(h1);
  }
  torso.add(neck);
  const tail = pivot(0, 0.58, -0.31);
  const tl = cone(0.035, 0.1, C(W), { ...NS, seg: 8 }); tl.position.set(0, 0.04, -0.01); tl.rotation.x = -0.5;
  tail.add(tl);
  torso.add(tail);
  const legs = [];
  for (const [x, z, ph] of [[0.11, 0.18, 0], [-0.11, 0.18, Math.PI], [0.11, -0.2, Math.PI], [-0.11, -0.2, 0]]) {
    const p = leg(x, 0.33, z, 0.33, 0.045, W, '#4e3b30', [1, 0.6, 1]);
    rig.add(p);
    legs.push({ p, ph });
  }
  g.add(blobShadow(0.38, 0.25));
  animate(g, {
    rig, torso, neck, legs, tail, tailAmp: 0.5, tailRate: 14, ears, eyes: ey,
    speed: 9, swing: 0.5, bob: 0.03, hop: 0.12,
    eat: { rot: 1.05, drop: 0.28, fwd: 0.04, rate: 4.5 },
  });
  return g;
}

// ------------------------------------------------------------------ pets
function makeDog() {
  const { g, rig, torso } = base();
  const T = '#d79a5c', Wt = '#fff4e2', E = '#8a5531';
  torso.add(place(box(0.24, 0.22, 0.42, C(T), { r: 0.1 }), 0, 0.3, -0.03));
  torso.add(place(ball(0.09, C(Wt), NS), 0, 0.28, 0.13));
  const neck = pivot(0, 0.37, 0.16);
  neck.add(place(ball(0.15, C(T)), 0, 0.08, 0.07));
  const mz = ball(0.08, C(Wt), NS); mz.scale.set(1.15, 0.8, 1); mz.position.set(0, 0.03, 0.19); neck.add(mz);
  neck.add(place(ball(0.032, C(INK), NS), 0, 0.065, 0.265));
  const tongue = box(0.045, 0.012, 0.05, C('#ff6f91'), { ...NS, r: 0.006 });
  tongue.position.set(0.0, -0.025, 0.22); tongue.rotation.x = 0.5;
  neck.add(tongue);
  const ey = eyes(neck, 0.065, 0.13, 0.19, 0.03, { yaw: 0.35 });
  cheeks(neck, 0.1, 0.06, 0.17, 0.026);
  const ears = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.13, 0.17, 0.05);
    const e = box(0.05, 0.16, 0.11, C(E), { ...NS, r: 0.025 }); e.position.set(s * 0.02, -0.07, 0); e.rotation.z = s * 0.15;
    p.add(e);
    neck.add(p);
    ears.push({ p, s, base: 0 });
  }
  const col = mesh(GEO.torus(0.09, 0.018, 6, 14), C('#e53935'), NS);
  col.rotation.x = Math.PI / 2 + 0.4; col.position.set(0, -0.02, 0.04);
  neck.add(col);
  neck.add(place(ball(0.022, C(PAL.gold), NS), 0, -0.07, 0.12));
  torso.add(neck);
  const tail = pivot(0, 0.37, -0.24);
  const tl = capsule(0.028, 0.11, C(T)); tl.position.set(0, 0.06, -0.03); tl.rotation.x = -0.5;
  tail.add(tl);
  tail.add(place(ball(0.03, C(Wt), NS), 0, 0.13, -0.065));
  torso.add(tail);
  const legs = [];
  for (const [x, z, ph] of [[0.08, 0.1, 0], [-0.08, 0.1, Math.PI], [0.08, -0.16, Math.PI], [-0.08, -0.16, 0]]) {
    const p = leg(x, 0.22, z, 0.22, 0.042, T, Wt, [1, 0.7, 1.3]);
    rig.add(p);
    legs.push({ p, ph });
  }
  g.add(blobShadow(0.3, 0.25));
  animate(g, {
    rig, torso, neck, legs, tail, tailAmp: 0.55, tailRate: 16, ears, eyes: ey,
    speed: 12, swing: 0.65, bob: 0.03, hop: 0.12,
    eat: { rot: 0.9, drop: 0.2, fwd: 0.05, rate: 5 },
    extra: (tt, k) => { tongue.visible = k.happy > 0.3 || k.move > 0.5; },
  });
  return g;
}

function makeCat() {
  const { g, rig, torso } = base();
  const O = '#f5a04a', S = '#d9752a', Wt = '#fff4e2', pink = '#ff9db2';
  torso.add(place(box(0.2, 0.18, 0.34, C(O), { r: 0.085 }), 0, 0.23, -0.03));
  for (const z of [-0.12, -0.03, 0.06]) torso.add(place(box(0.2, 0.03, 0.035, C(S), { ...NS, r: 0.012 }), 0, 0.318, z));
  const neck = pivot(0, 0.3, 0.13);
  const hd = ball(0.135, C(O)); hd.scale.set(1.12, 0.95, 1); hd.position.set(0, 0.07, 0.05); neck.add(hd);
  const mz = ball(0.06, C(Wt), NS); mz.scale.set(1.3, 0.8, 0.9); mz.position.set(0, 0.02, 0.165); neck.add(mz);
  neck.add(place(ball(0.018, C(pink), NS), 0, 0.045, 0.215));
  const ey = eyes(neck, 0.062, 0.1, 0.16, 0.028, { yaw: 0.4 });
  cheeks(neck, 0.1, 0.04, 0.14, 0.024);
  const ears = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.08, 0.17, 0.04);
    const e = cone(0.05, 0.1, C(O), { ...NS, seg: 6 }); e.position.y = 0.035; e.rotation.z = -s * 0.25;
    const ei = cone(0.03, 0.06, C(pink), { ...NS, seg: 6 }); ei.position.set(0, 0.025, 0.022); ei.rotation.z = -s * 0.25;
    p.add(e, ei);
    neck.add(p);
    ears.push({ p, s, base: 0 });
  }
  torso.add(neck);
  const tail = pivot(0, 0.28, -0.19);
  const tl = capsule(0.024, 0.2, C(O)); tl.position.set(0, 0.11, -0.04); tl.rotation.x = -0.35;
  tail.add(tl);
  tail.add(place(ball(0.027, C(S), NS), 0, 0.22, -0.08));
  torso.add(tail);
  const legs = [];
  for (const [x, z, ph] of [[0.065, 0.07, 0], [-0.065, 0.07, Math.PI], [0.065, -0.13, Math.PI], [-0.065, -0.13, 0]]) {
    const p = leg(x, 0.16, z, 0.16, 0.036, O, Wt, [1, 0.7, 1.2]);
    rig.add(p);
    legs.push({ p, ph });
  }
  g.add(blobShadow(0.24, 0.25));
  animate(g, {
    rig, torso, neck, legs, tail, tailAmp: 0.4, tailRate: 3, ears, eyes: ey,
    speed: 12, swing: 0.6, bob: 0.02, hop: 0.1,
    eat: { rot: 0.85, drop: 0.15, fwd: 0.05, rate: 6 },
  });
  return g;
}

// ------------------------------------------------------------------ beehive
function makeBeeling() {
  const b = group();
  const body = ball(0.036, C('#ffd23f'), NS); body.scale.set(1, 1, 1.35);
  b.add(body);
  const stripe = cyl(0.037, 0.037, 0.016, C(INK), { ...NS, seg: 10 }); stripe.rotation.x = Math.PI / 2; stripe.position.z = -0.008;
  b.add(stripe);
  const wings = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.012, 0.03, 0);
    const w = ball(0.028, C('#e6f6ff', { transparent: true, opacity: 0.6 }), NS);
    w.scale.set(1.3, 0.25, 0.8); w.position.x = s * 0.026;
    p.add(w);
    b.add(p);
    wings.push({ p, s });
  }
  b.userData.wings = wings;
  return b;
}

function makeBeehive() {
  const g = group();
  g.userData.state = { moving: false, eating: false, happy: false, ready: false };
  const wood = PAL.woodDark;
  for (const [x, z] of [[0.22, 0.16], [-0.22, 0.16], [0.22, -0.16], [-0.22, -0.16]]) g.add(place(cyl(0.03, 0.035, 0.22, wood), x, 0.11, z));
  g.add(place(box(0.6, 0.05, 0.44, PAL.wood, { r: 0.02 }), 0, 0.23, 0));
  const supers = ['#fffaf0', '#ffd54f', '#fffaf0'];
  supers.forEach((c, i) => {
    g.add(place(box(0.52, 0.17, 0.4, c, { r: 0.035 }), 0, 0.345 + i * 0.175, 0));
  });
  g.add(place(box(0.62, 0.07, 0.5, PAL.roofRed, { r: 0.03 }), 0, 0.88, 0));
  g.add(place(box(0.48, 0.04, 0.36, PAL.roofRedDark, { r: 0.02 }), 0, 0.93, 0));
  g.add(place(box(0.24, 0.035, 0.02, '#3b2716', { shadow: false }), 0, 0.28, 0.2));
  g.add(place(box(0.3, 0.02, 0.09, PAL.woodLight, { r: 0.008 }), 0, 0.26, 0.24));
  const hex = cyl(0.055, 0.055, 0.012, C('#f6a623'), { shadow: false, seg: 6 });
  hex.rotation.x = Math.PI / 2; hex.position.set(0, 0.52, 0.205);
  g.add(hex);
  g.add(blobShadow(0.45, 0.22));
  const bees = [];
  for (let i = 0; i < 4; i++) {
    const b = makeBeeling();
    b.userData.o = { r: 0.38 + i * 0.05, h: 0.5 + (i % 2) * 0.25, sp: (i % 2 ? -1 : 1) * (1.1 + i * 0.25), ph: i * 1.7 };
    g.add(b);
    bees.push(b);
  }
  const ph = Math.random() * 100;
  let speedK = 1;
  g.userData.anim = (t, dt) => {
    const st = g.userData.state;
    speedK = ease(speedK, st.happy ? 1.8 : 1, Math.min(dt || 0.016, 0.1), 3);
    const tt = (t + ph);
    for (const b of bees) {
      const o = b.userData.o;
      const a = tt * o.sp * speedK + o.ph;
      const r = o.r + Math.sin(a * 2.3) * 0.08;
      b.position.set(Math.cos(a) * r, o.h + Math.sin(a * 3 + o.ph) * 0.08, Math.sin(a) * r);
      // heading along the tangent of the orbit
      const vx = -Math.sin(a) * o.sp, vz = Math.cos(a) * o.sp;
      b.rotation.y = Math.atan2(vx, vz);
      const f = Math.sin(tt * 60 + o.ph) * 0.7;
      for (const w of b.userData.wings) w.p.rotation.z = w.s * (0.3 + f);
    }
  };
  return g;
}

// ------------------------------------------------------------------ ambient critters
/** Butterfly ~0.12 wide, centred on origin; anim flaps the wings (the world moves it). */
export function makeButterfly(color = '#ff7eb6') {
  const g = group();
  const rig = group();
  g.add(rig);
  rig.add(place(capsule(0.008, 0.04, C(INK)), 0, 0, 0));
  rig.children[0].rotation.x = Math.PI / 2;
  const wings = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.006, 0, 0);
    const up = ball(0.03, C(color, { side: 2 }), NS); up.scale.set(1, 0.18, 0.9); up.position.set(s * 0.028, 0, 0.012);
    const lo = ball(0.02, C(color, { side: 2 }), NS); lo.scale.set(1, 0.18, 0.9); lo.position.set(s * 0.022, 0, -0.018);
    const dot = ball(0.009, C('#ffffff'), NS); dot.scale.set(1, 0.3, 1); dot.position.set(s * 0.036, 0.005, 0.016);
    p.add(up, lo, dot);
    rig.add(p);
    wings.push({ p, s });
  }
  for (const s of [-1, 1]) {
    const a = cyl(0.002, 0.002, 0.035, C(INK), NS); a.position.set(s * 0.008, 0.012, 0.034); a.rotation.set(1.0, 0, -s * 0.3);
    rig.add(a);
  }
  const ph = Math.random() * 100;
  g.userData.anim = (t) => {
    const tt = t + ph;
    const f = Math.sin(tt * 18);
    for (const w of wings) w.p.rotation.z = w.s * (0.25 + f * 0.9);
    rig.position.y = Math.sin(tt * 18 + 1) * 0.006;
  };
  return g;
}

/** Small songbird ~0.2 long, centred on origin, faces +z; anim flaps the wings. */
export function makeBird(color = '#4f8fe6') {
  const g = group();
  const rig = group();
  g.add(rig);
  const b = ball(0.055, C(color)); b.scale.set(1, 0.9, 1.35); rig.add(b);
  rig.add(place(ball(0.04, C('#ffe2b8'), NS), 0, -0.018, 0.035));     // belly
  rig.add(place(ball(0.045, C(color), NS), 0, 0.04, 0.06));
  const bk = cone(0.014, 0.035, C('#ffb300'), { ...NS, seg: 6 }); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.035, 0.115);
  rig.add(bk);
  const ey = eyes(rig, 0.028, 0.05, 0.09, 0.011, { yaw: 0.6 });
  const tl = box(0.05, 0.01, 0.07, C(color), { ...NS, r: 0.004 }); tl.position.set(0, 0.01, -0.09); tl.rotation.x = -0.3;
  rig.add(tl);
  const wings = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.035, 0.02, 0);
    const w = ball(0.05, C(color, { side: 2 }), NS); w.scale.set(1.4, 0.18, 0.8); w.position.x = s * 0.06;
    p.add(w);
    rig.add(p);
    wings.push({ p, s });
  }
  const ph = Math.random() * 100;
  g.userData.anim = (t) => {
    const tt = t + ph;
    const f = Math.sin(tt * 14);
    for (const w of wings) w.p.rotation.z = w.s * f * 0.8;
    rig.position.y = -f * 0.01;
    blink(ey, tt);
  };
  return g;
}

// ------------------------------------------------------------------ public API
const MAKERS = {
  chicken: makeChicken, duck: makeDuck, cow: makeCow, sheep: makeSheep, pig: makePig,
  goat: makeGoat, dog: makeDog, cat: makeCat, bee: makeBeehive,
};

/** Build an animal by key (chicken, cow, sheep, pig, goat, duck, bee, dog, cat). */
export function makeAnimal(key) {
  const f = MAKERS[key];
  if (!f) throw new Error('makeAnimal: unknown animal ' + key);
  const g = f();
  g.name = 'animal:' + key;
  return g;
}

const withState = (key, patch) => () => {
  const g = makeAnimal(key);
  Object.assign(g.userData.state, patch);
  return g;
};
const lifted = (make, y) => () => { const o = make(); o.position.y = y; return o; };

export const CATALOG = {};
for (const key of Object.keys(MAKERS)) {
  CATALOG[key] = () => makeAnimal(key);
  if (key === 'bee') { CATALOG.bee_happy = withState(key, { happy: true }); continue; }
  CATALOG[key + '_moving'] = withState(key, { moving: true });
  CATALOG[key + '_eating'] = withState(key, { eating: true });
  CATALOG[key + '_happy'] = withState(key, { happy: true });
}
VILLAGERS.forEach((spec, i) => {
  CATALOG['villager_' + String(i + 1).padStart(2, '0') + '_' + spec.id] = () => makeVillager(spec);
});
CATALOG.villager_walking = () => { const g = makeVillager(VILLAGERS[3]); g.userData.state.moving = true; return g; };
CATALOG.villager_waving = () => { const g = makeVillager(VILLAGERS[0]); g.userData.state.wave = true; return g; };
CATALOG.villager_carrying = () => { const g = makeVillager(VILLAGERS[1]); g.userData.state.carrying = 'basket'; return g; };
CATALOG.farmer = makeFarmer;
CATALOG.farmer_walking = () => { const g = makeFarmer(); g.userData.state.moving = true; return g; };
CATALOG.portrait_villager = () => lifted(() => makePortrait(VILLAGERS[5]), 0.5)();
CATALOG.portrait_farmer = () => lifted(() => makePortrait(makeFarmer.spec), 0.5)();
CATALOG.butterfly = lifted(() => makeButterfly('#ff7eb6'), 0.35);
CATALOG.butterfly_blue = lifted(() => makeButterfly('#5ab4ff'), 0.35);
CATALOG.butterfly_yellow = lifted(() => makeButterfly('#ffd23f'), 0.35);
CATALOG.bird = lifted(() => makeBird(), 0.4);
CATALOG.bird_red = lifted(() => makeBird('#e5533d'), 0.4);
