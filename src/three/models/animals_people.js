// Chibi villagers (~0.95 tall, head ~40% of the height), the player's farmer and UI portraits.
//
// spec = { name, skin, hair, hairStyle: 'short'|'long'|'bun'|'bald'|'curly', shirt, pants,
//          hat: 'none'|'straw'|'cap'|'chef'|'crown'|'scarf'|'beret', hatColor?, female, beard,
//          apron: color|null, overalls?: color, neckerchief?: color }
// State: g.userData.state = { moving, wave, carrying } (carrying: null | any truthy | Object3D to hold).
import { THREE, GEO, mesh, box, cyl, cone, ball, capsule, group, place, blobShadow } from '../lib.js';
import { C, NS, INK, pivot, eyes, cheeks, ease, blip, blink } from './animals_kit.js';

const HEAD_R = 0.2;
const HEAD_Y = 0.19;     // head centre above the neck pivot

function shade(hex, k) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l * k)));
  return '#' + c.getHexString();
}

// ------------------------------------------------------------------ hair + hats
function addHair(h, spec) {
  const hc = C(spec.hair || '#5d4037');
  const style = spec.hairStyle || 'short';
  if (style === 'bald') {
    for (const s of [-1, 1]) {
      const t = ball(0.075, hc, NS); t.scale.set(0.7, 1, 1.2); t.position.set(s * 0.18, HEAD_Y - 0.01, -0.06);
      h.add(t);
    }
    return;
  }
  if (style === 'curly') {
    const cap = ball(0.2, hc, { low: true }); cap.position.set(0, HEAD_Y + 0.05, -0.04); cap.scale.set(1.04, 0.95, 1);
    h.add(cap);
    const hatted = spec.hat && spec.hat !== 'none';
    for (const [x, y, z, r, top] of [[-0.13, 0.33, 0.09, 0.075, 1], [0, 0.37, 0.11, 0.08, 1], [0.13, 0.33, 0.09, 0.075, 1],
      [-0.19, 0.2, 0.0, 0.075, 0], [0.19, 0.2, 0.0, 0.075, 0], [0, 0.4, -0.04, 0.08, 1], [-0.12, 0.17, -0.13, 0.08, 0], [0.12, 0.17, -0.13, 0.08, 0]]) {
      if (top && hatted) continue;
      h.add(place(ball(r, hc, { low: true, shadow: false }), x, y, z));
    }
    return;
  }
  // short cap (base of short / long / bun): sits up and back so the face stays clear
  const cap = ball(0.208, hc); cap.position.set(0, HEAD_Y + 0.045, -0.035); cap.scale.set(1.03, 0.94, 1);
  h.add(cap);
  if (spec.hat !== 'cap' && spec.hat !== 'beret') {
    const fr = ball(0.11, hc, NS); fr.scale.set(1.55, 0.5, 0.8); fr.position.set(0.03, HEAD_Y + 0.135, 0.12); fr.rotation.z = -0.25;
    h.add(fr);
  }
  if (style === 'long') {
    h.add(place(box(0.38, 0.34, 0.14, hc, { r: 0.06 }), 0, HEAD_Y - 0.08, -0.1));
    for (const s of [-1, 1]) h.add(place(box(0.07, 0.26, 0.1, hc, { ...NS, r: 0.03 }), s * 0.19, HEAD_Y - 0.07, -0.01));
  } else if (style === 'bun') {
    h.add(place(ball(0.085, hc, NS), 0, HEAD_Y + 0.21, -0.11));
  } else {
    for (const s of [-1, 1]) h.add(place(ball(0.05, hc, NS), s * 0.185, HEAD_Y + 0.0, -0.02));   // sideburns
  }
}

function addHat(h, spec) {
  const hat = spec.hat || 'none';
  const top = HEAD_Y + HEAD_R;
  if (hat === 'straw') {
    const straw = C('#f4cd6a'), band = C(spec.hatColor || '#d9483b');
    const hat = group(
      place(cyl(0.27, 0.28, 0.03, straw, { shadow: false, seg: 20 }), 0, 0, 0),
      place(cyl(0.15, 0.172, 0.13, straw, { seg: 16 }), 0, 0.07, 0),
      place(cyl(0.175, 0.175, 0.035, band, { ...NS, seg: 16 }), 0, 0.03, 0),
    );
    hat.position.set(0, top - 0.04, -0.02); hat.rotation.x = -0.22;
    h.add(hat);
  } else if (hat === 'cap') {
    const cc = C(spec.hatColor || '#2f7bd9');
    const d = ball(0.218, cc); d.scale.set(1.02, 0.66, 1.02); d.position.set(0, top - 0.085, -0.02);
    h.add(d);
    const bill = box(0.22, 0.025, 0.15, cc, { ...NS, r: 0.012 }); bill.position.set(0, top - 0.1, 0.2); bill.rotation.x = 0.12;
    h.add(bill);
    h.add(place(ball(0.025, C('#ffffff'), NS), 0, top + 0.04, -0.01));
  } else if (hat === 'chef') {
    const w = C('#ffffff');
    h.add(place(cyl(0.19, 0.2, 0.09, w), 0, top - 0.06, -0.01));
    h.add(place(cyl(0.21, 0.17, 0.15, w), 0, top + 0.06, -0.01));
    const p = ball(0.21, w); p.scale.set(1, 0.55, 1); p.position.set(0, top + 0.14, -0.01);
    h.add(p);
  } else if (hat === 'crown') {
    const gold = C('#ffc83d');
    h.add(place(cyl(0.14, 0.13, 0.07, gold), 0, top - 0.01, -0.01));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
      h.add(place(cone(0.03, 0.08, gold, { ...NS, seg: 6 }), Math.cos(a) * 0.12, top + 0.06, Math.sin(a) * 0.12 - 0.01));
    }
    h.add(place(ball(0.03, C('#e53935'), NS), 0, top - 0.005, 0.13));
  } else if (hat === 'scarf') {
    const sc = C(spec.hatColor || '#d64f6e');
    const d = ball(0.218, sc); d.scale.set(1.04, 0.98, 1.02); d.position.set(0, HEAD_Y + 0.05, -0.05);
    h.add(d);
    h.add(place(ball(0.04, sc, NS), 0.0, HEAD_Y - 0.2, 0.06));                         // knot under the chin
    const tail = cone(0.1, 0.16, sc, { ...NS, seg: 4 }); tail.rotation.set(Math.PI + 0.3, 0, 0); tail.position.set(0, HEAD_Y - 0.12, -0.2);
    h.add(tail);
    for (const [x, y] of [[-0.12, 0.33], [0.1, 0.36], [0.17, 0.24], [-0.18, 0.22]]) {
      h.add(place(ball(0.022, C('#ffffff'), NS), x, y, Math.sqrt(Math.max(0, 0.051 - x * x - (y - HEAD_Y - 0.05) ** 2)) - 0.03));
    }
  } else if (hat === 'beret') {
    const bc = C(spec.hatColor || '#7b3fa0');
    const b = ball(0.19, bc); b.scale.set(1.08, 0.3, 1.08); b.position.set(0.03, top - 0.005, -0.03); b.rotation.set(-0.15, 0, -0.25);
    h.add(b);
    h.add(place(ball(0.022, bc, NS), 0.0, top + 0.05, -0.02));
  }
}

/** Head (with face, hair, hat, beard) built inside a group whose origin is the neck. */
function buildHead(spec) {
  const h = group();
  const skin = spec.skin || '#f6d0b0';
  h.add(place(ball(HEAD_R, C(skin), { ws: 18, hs: 14 }), 0, HEAD_Y, 0));
  const ey = eyes(h, 0.078, HEAD_Y + 0.005, 0.168, 0.036, { yaw: 0.38 });
  cheeks(h, 0.12, HEAD_Y - 0.05, 0.15, 0.035);
  h.add(place(ball(0.022, C(shade(skin, 0.9)), NS), 0, HEAD_Y - 0.035, 0.2));
  if (spec.beard) {
    const b = ball(0.15, C(spec.hair || '#5d4037')); b.scale.set(1.08, 0.75, 0.75); b.position.set(0, HEAD_Y - 0.13, 0.08);
    h.add(b);
    const mu = ball(0.05, C(spec.hair || '#5d4037'), NS); mu.scale.set(1.6, 0.55, 0.8); mu.position.set(0, HEAD_Y - 0.065, 0.185);
    h.add(mu);
  } else {
    const m = mesh(GEO.torus(0.034, 0.009, 6, 10, Math.PI), C('#8a3b2c'), NS);
    m.rotation.set(-0.25, 0, Math.PI); m.position.set(0, HEAD_Y - 0.075, 0.19);
    h.add(m);
  }
  if (spec.female) {
    for (const s of [-1, 1]) {   // eyelashes: a little flick at the outer corner
      const l = box(0.03, 0.008, 0.01, C(INK), NS); l.position.set(s * 0.1, HEAD_Y + 0.035, 0.17); l.rotation.set(0, s * 0.4, s * 0.5);
      h.add(l);
    }
  }
  if (spec.hat !== 'scarf') addHair(h, spec);
  addHat(h, spec);
  // ears
  for (const s of [-1, 1]) {
    if (spec.hairStyle === 'long' && spec.hat !== 'scarf') break;
    if (spec.hat === 'scarf') break;
    h.add(place(ball(0.04, C(skin), NS), s * 0.195, HEAD_Y - 0.01, 0.0));
  }
  return { h, eyes: ey };
}

/** Upper body clothes (bib/apron/overalls/neckerchief) on top of the torso. */
function addClothes(t, spec) {
  if (spec.overalls) {
    const o = C(spec.overalls);
    t.add(place(box(0.2, 0.13, 0.04, o, { r: 0.015 }), 0, 0.455, 0.09));
    for (const s of [-1, 1]) {
      t.add(place(box(0.035, 0.03, 0.2, o, { ...NS, r: 0.01 }), s * 0.08, 0.555, 0.0));
      t.add(place(ball(0.017, C('#ffc83d'), NS), s * 0.07, 0.505, 0.115));
    }
  }
  if (spec.apron) {
    const a = C(spec.apron);
    t.add(place(box(0.15, 0.12, 0.02, a, { ...NS, r: 0.008 }), 0, 0.47, 0.096));
    const sk = box(0.2, 0.19, 0.02, a, { ...NS, r: 0.008 });
    sk.position.set(0, 0.3, spec.female ? 0.158 : 0.1); sk.rotation.x = spec.female ? -0.3 : 0;
    t.add(sk);
  }
  if (spec.neckerchief) {
    const n = cone(0.06, 0.08, C(spec.neckerchief), { ...NS, seg: 3 }); n.rotation.set(Math.PI + 0.25, 0, 0); n.position.set(0, 0.52, 0.09);
    t.add(n);
  }
}

// ------------------------------------------------------------------ villager
export function makeVillager(spec = {}) {
  const g = group();
  const rig = group();
  g.add(rig);
  g.userData.state = { moving: false, wave: false, carrying: null };
  g.userData.spec = spec;
  const skin = spec.skin || '#f6d0b0';
  const shirt = C(spec.shirt || '#4f9a4a');
  const pantsC = spec.overalls || spec.pants || '#3f5f9a';
  const pants = C(pantsC);
  const shoe = C(shade(pantsC, 0.45));

  // legs
  const legs = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.065, 0.26, 0);
    p.add(place(capsule(0.055, 0.12, spec.female ? C(skin) : pants), 0, -0.11, 0));
    const sh = ball(0.062, shoe, NS); sh.scale.set(1, 0.62, 1.4); sh.position.set(0, -0.215, 0.025);
    p.add(sh);
    rig.add(p);
    legs.push(p);
  }
  // torso
  const torso = group();
  rig.add(torso);
  if (spec.female) torso.add(place(cyl(0.13, 0.2, 0.2, pants), 0, 0.29, 0));
  else torso.add(place(box(0.27, 0.12, 0.19, pants, { r: 0.05 }), 0, 0.3, 0));
  torso.add(place(box(0.28, 0.25, 0.19, shirt, { r: 0.085 }), 0, 0.44, 0));
  addClothes(torso, spec);
  // arms
  const arms = [];
  for (const s of [-1, 1]) {
    const p = pivot(s * 0.165, 0.535, 0);
    p.add(place(capsule(0.045, 0.12, shirt), 0, -0.09, 0));
    p.add(place(ball(0.05, C(skin), NS), 0, -0.19, 0));
    p.rotation.z = s * 0.12;
    torso.add(p);
    arms.push({ p, s });
  }
  const carry = pivot(0, 0.36, 0.2);
  torso.add(carry);
  g.userData.carryAnchor = carry;
  // head
  const neck = pivot(0, 0.555, 0);
  const { h, eyes: ey } = buildHead(spec);
  neck.add(h);
  torso.add(neck);
  g.add(blobShadow(0.24, 0.25));

  const st = g.userData.state;
  const ph = Math.random() * 100;
  const k = { move: 0, wave: 0, carry: 0 };
  let held = null;
  g.userData.anim = (t, dt) => {
    dt = Math.min(dt || 0.016, 0.1);
    const tt = t + ph;
    k.move = ease(k.move, st.moving ? 1 : 0, dt, 7);
    k.wave = ease(k.wave, st.wave ? 1 : 0, dt, 6);
    k.carry = ease(k.carry, st.carrying ? 1 : 0, dt, 6);
    // attach a carried Object3D to the hands
    const want = st.carrying && st.carrying.isObject3D ? st.carrying : null;
    if (want !== held) { if (held && held.parent === carry) carry.remove(held); held = want; if (held) carry.add(held); }

    const w = tt * 11;
    const sw = Math.sin(w) * 0.65 * k.move;
    legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
    rig.position.y = Math.abs(Math.cos(w)) * 0.03 * k.move;
    rig.rotation.z = Math.sin(tt * 1.3) * 0.035 * (1 - k.move);
    rig.rotation.x = 0.06 * k.move;
    torso.rotation.y = Math.sin(w) * 0.08 * k.move;
    const breath = Math.sin(tt * 2.2) * 0.015;
    torso.scale.set(1, 1 + breath * (1 - k.move), 1);

    for (const { p, s } of arms) {
      const walkSwing = -Math.sin(w) * s * 0.6 * k.move;
      let rx = walkSwing * (1 - k.carry) - 1.15 * k.carry;
      let rz = s * (0.12 + 0.03 * Math.sin(tt * 2.2));
      if (s > 0 && k.wave > 0.01) {     // the +x arm waves (faces the iso camera)
        rz = rz * (1 - k.wave) + k.wave * (2.55 + Math.sin(tt * 11) * 0.35);
        rx *= (1 - k.wave);
      }
      if (k.carry > 0.01) rz *= (1 - k.carry * 0.6);
      p.rotation.x = rx; p.rotation.z = rz;
    }
    neck.rotation.y = (blip(tt * 0.27, 6) - blip(tt * 0.27 + Math.PI, 6)) * 0.4 * (1 - k.move);
    neck.rotation.z = Math.sin(tt * 1.1) * 0.05 + k.wave * 0.12 * Math.sin(tt * 3);
    blink(ey, tt, 0.6);
  };
  return g;
}

// ------------------------------------------------------------------ farmer
const FARMER = {
  id: 'farmer', name: 'Gazda', skin: '#f2c19b', hair: '#7a4a2a', hairStyle: 'short', shirt: '#e0403a',
  pants: '#3466c2', overalls: '#3466c2', hat: 'straw', hatColor: '#d9483b', female: false, beard: false,
  apron: null, neckerchief: '#ffd23f',
};

/** The player's farmer: straw hat, red shirt with a check-like pattern, blue overalls. */
export function makeFarmer() {
  const g = makeVillager(FARMER);
  // red "checked" shirt look: a few darker stripes across the sleeves
  g.traverse((o) => { if (o.isMesh && o.geometry === GEO.capsule(0.045, 0.12) && o.material === C(FARMER.shirt)) o.userData.sleeve = true; });
  const sleeves = [];
  g.traverse((o) => { if (o.userData.sleeve) sleeves.push(o); });
  for (const sl of sleeves) {
    for (const dy of [-0.02]) {
      const ring = cyl(0.048, 0.048, 0.03, C('#9e1f1a'), { ...NS, seg: 10 }); ring.position.set(0, dy, 0);
      sl.add(ring);
    }
  }
  g.name = 'farmer';
  return g;
}
makeFarmer.spec = FARMER;

// ------------------------------------------------------------------ portraits
/** Head + shoulders of a villager, bounding box centred on the face (origin = face centre). */
export function makePortrait(spec = {}) {
  const g = group();
  const inner = group();
  g.add(inner);
  const { h } = buildHead(spec);
  inner.add(h);
  const shirt = C(spec.shirt || '#4f9a4a');
  inner.add(place(box(0.42, 0.24, 0.24, shirt, { r: 0.1 }), 0, -0.1, 0));
  if (spec.overalls) {
    inner.add(place(box(0.22, 0.12, 0.04, C(spec.overalls), { r: 0.015 }), 0, -0.15, 0.115));
    for (const s of [-1, 1]) inner.add(place(box(0.04, 0.03, 0.25, C(spec.overalls), { ...NS, r: 0.01 }), s * 0.09, 0.0, 0.0));
  } else if (spec.apron) {
    inner.add(place(box(0.2, 0.14, 0.03, C(spec.apron), { r: 0.012 }), 0, -0.15, 0.115));
  }
  if (spec.neckerchief) {
    const n = cone(0.07, 0.09, C(spec.neckerchief), { ...NS, seg: 3 }); n.rotation.set(Math.PI + 0.25, 0, 0); n.position.set(0, -0.03, 0.12);
    inner.add(n);
  }
  inner.position.y = -HEAD_Y;   // face centre at the origin
  // balance the bounding box around the face with an invisible spacer
  const b = new THREE.Box3().setFromObject(g);
  const sp = mesh(GEO.box(0.001, 0.001, 0.001), C('#000000'), { shadow: false, receive: false });
  sp.visible = false;
  sp.position.set(
    Math.abs(b.max.x) > Math.abs(b.min.x) ? -b.max.x : -b.min.x,
    Math.abs(b.max.y) > Math.abs(b.min.y) ? -b.max.y : -b.min.y,
    Math.abs(b.max.z) > Math.abs(b.min.z) ? -b.max.z : -b.min.z,
  );
  g.add(sp);
  g.userData.spec = spec;
  return g;
}

// ------------------------------------------------------------------ preset villagers
export const VILLAGERS = [
  { id: 'rozsi', name: 'Rózsi néni', skin: '#f7d3b8', hair: '#d9d9d9', hairStyle: 'bun', shirt: '#4f8fd9', pants: '#c2185b', hat: 'scarf', hatColor: '#e53950', female: true, beard: false, apron: '#fff3d6' },
  { id: 'gazsi', name: 'Gazsi bácsi', skin: '#e6b48c', hair: '#9e9e9e', hairStyle: 'bald', shirt: '#7cb342', pants: '#6d4c41', hat: 'none', female: false, beard: true, apron: null },
  { id: 'panni', name: 'Pék Panni', skin: '#f6d0b0', hair: '#e8a33c', hairStyle: 'bun', shirt: '#ff8a65', pants: '#8d6e63', hat: 'chef', female: true, beard: false, apron: '#ffffff' },
  { id: 'bence', name: 'Kis Bence', skin: '#c98e62', hair: '#3e2723', hairStyle: 'short', shirt: '#ffca28', pants: '#1e88e5', hat: 'cap', hatColor: '#e53935', female: false, beard: false, apron: null },
  { id: 'vilma', name: 'Doktor Vilma', skin: '#8d5a3b', hair: '#1f1a17', hairStyle: 'curly', shirt: '#f5f7fa', pants: '#26a69a', hat: 'none', female: true, beard: false, apron: null },
  { id: 'feri', name: 'Halász Feri', skin: '#eab48f', hair: '#a1582b', hairStyle: 'short', shirt: '#2e7d9a', pants: '#455a64', hat: 'beret', hatColor: '#37474f', female: false, beard: true, apron: null },
  { id: 'teri', name: 'Tanító Teri', skin: '#fbe0cc', hair: '#6d3b1f', hairStyle: 'long', shirt: '#ab47bc', pants: '#3949ab', hat: 'none', female: true, beard: false, apron: null },
  { id: 'miki', name: 'Molnár Miki', skin: '#f2c19b', hair: '#f1e3c6', hairStyle: 'short', shirt: '#fafafa', pants: '#9e8c74', hat: 'cap', hatColor: '#c8b28a', female: false, beard: false, apron: '#e9dcc0' },
  { id: 'pista', name: 'Postás Pista', skin: '#d9a07a', hair: '#212121', hairStyle: 'short', shirt: '#1565c0', pants: '#0d3c78', hat: 'cap', hatColor: '#ffb300', female: false, beard: false, apron: null, neckerchief: '#ffb300' },
  { id: 'grofno', name: 'Grófnő', skin: '#fde6d6', hair: '#ffd54f', hairStyle: 'long', shirt: '#ec407a', pants: '#8e24aa', hat: 'crown', female: true, beard: false, apron: null },
  { id: 'jani', name: 'Juhász Jani', skin: '#a8714d', hair: '#4e342e', hairStyle: 'curly', shirt: '#8bc34a', pants: '#5d4037', hat: 'straw', hatColor: '#2e7d32', female: false, beard: false, apron: null },
  { id: 'marcsi', name: 'Méhész Marcsi', skin: '#f3c9a8', hair: '#c0582c', hairStyle: 'long', shirt: '#ffd23f', pants: '#795548', hat: 'straw', hatColor: '#ffb300', female: true, beard: false, apron: null },
];
