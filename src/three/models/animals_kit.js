// Shared private helpers for the creature models (animals.js, animals_people.js).
// Faces, pivots and small animation utilities. Everything builds on lib.js helpers.
import { M, GEO, mesh, group } from '../lib.js';

/** Creature material: living things never collect snow on their backs. */
export const C = (color, o = {}) => M(color, { snow: 0, ...o });

export const NS = { shadow: false };
export const INK = '#231b17';
export const BLUSH = '#ff8fa3';

/** Empty group placed at (x, y, z) holding children; used as a rotation joint. */
export function pivot(x, y, z, ...children) {
  const p = group(...children);
  p.position.set(x, y, z);
  return p;
}

/** Shiny black bead eye (faces +z) with a tiny white highlight. */
export function bead(r, white = false) {
  const g = group();
  if (white) {
    g.add(mesh(GEO.sphere(r * 1.45, 10, 8), C('#ffffff'), NS));
    const p = mesh(GEO.sphere(r, 10, 8), C(INK), NS);
    p.position.z = r * 0.62;
    g.add(p);
    const h = mesh(GEO.sphere(r * 0.38, 6, 5), C('#ffffff'), NS);
    h.position.set(r * 0.32, r * 0.38, r * 1.4);
    g.add(h);
    return g;
  }
  g.add(mesh(GEO.sphere(r, 10, 8), C(INK), NS));
  const h = mesh(GEO.sphere(r * 0.4, 6, 5), C('#ffffff'), NS);
  h.position.set(r * 0.34, r * 0.38, r * 0.66);
  g.add(h);
  return g;
}

/** Adds a mirrored pair of eyes to `parent`; returns them (for blinking). */
export function eyes(parent, x, y, z, r, { yaw = 0.3, white = false } = {}) {
  const out = [];
  for (const s of [-1, 1]) {
    const e = bead(r, white);
    e.position.set(s * x, y, z);
    e.rotation.y = s * yaw;
    parent.add(e);
    out.push(e);
  }
  return out;
}

/** Mirrored pair of rosy cheeks. */
export function cheeks(parent, x, y, z, r, color = BLUSH) {
  for (const s of [-1, 1]) {
    const c = mesh(GEO.sphere(r, 10, 6), C(color), NS);
    c.position.set(s * x, y, z);
    c.scale.set(1, 0.62, 0.4);
    c.rotation.y = s * 0.55;
    parent.add(c);
  }
}

/** Frame-rate independent approach of `cur` towards `target`. */
export const ease = (cur, target, dt, k = 8) => cur + (target - cur) * Math.min(1, dt * k);

/** Occasional short pulse 0..1 (high `sharp` = rarer/shorter). */
export const blip = (x, sharp = 8) => Math.pow(Math.max(0, Math.sin(x)), sharp);

/** Blink: squash eye groups vertically now and then. */
export function blink(eyeList, tt, rate = 0.7) {
  const b = 1 - blip(tt * rate, 80) * 0.9;
  for (const e of eyeList) e.scale.y = b;
}
