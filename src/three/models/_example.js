// Style reference for model authors. Conventions:
//  * 1 tile = 1 world unit. A model with footprint n is centred on the origin and stays inside
//    x,z in [-n/2 + 0.05, n/2 - 0.05]; ground is y = 0; "front" faces +z (towards the camera).
//  * Build only from lib.js helpers + cached materials (M / leafMat), never `new Material` directly,
//    so snow, wind sway, night glow and season colours work automatically.
//  * Chunky, rounded, slightly exaggerated proportions; bright saturated colours from PAL;
//    soft bevels (rbox) instead of sharp boxes; 2-3 tone details (trim, window frames).
//  * Optional per-frame animation: set `group.userData.anim = (t, dt) => {...}`.
import { PAL, M, leafMat, box, cyl, cone, ball, group, place, gableRoof, windowPane, door, blobShadow, GEO, mesh } from '../lib.js';

export function makeWell() {
  const g = group();
  // stone ring
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(place(box(0.2, 0.16, 0.14, i % 2 ? PAL.stone : PAL.stoneDark, { r: 0.04 }), Math.cos(a) * 0.3, 0.08, Math.sin(a) * 0.3, -a));
    g.add(place(box(0.2, 0.16, 0.14, i % 2 ? PAL.stoneDark : PAL.stone, { r: 0.04 }), Math.cos(a + 0.3) * 0.3, 0.24, Math.sin(a + 0.3) * 0.3, -a - 0.3));
  }
  g.add(place(cyl(0.26, 0.26, 0.02, M('#2d6fa3')), 0, 0.28, 0));
  // posts + roof
  for (const s of [-1, 1]) g.add(place(box(0.07, 0.75, 0.07, PAL.wood, { r: 0.02 }), s * 0.33, 0.5, 0));
  const roof = gableRoof(0.8, 0.28, 0.6, PAL.roofRed);
  roof.position.y = 0.86; roof.rotation.y = Math.PI / 2;
  g.add(roof);
  const crank = place(cyl(0.035, 0.035, 0.72, PAL.woodDark), 0, 0.68, 0);
  crank.rotation.z = Math.PI / 2;
  g.add(crank);
  g.add(place(cyl(0.07, 0.06, 0.11, PAL.wood), 0, 0.5, 0));
  g.add(blobShadow(0.55));
  return g;
}

export function makeCottage() {
  const g = group();
  g.add(place(box(1.6, 0.9, 1.3, PAL.wall, { r: 0.05 }), 0, 0.45, 0));
  g.add(place(box(1.66, 0.12, 1.36, PAL.stone, { r: 0.04 }), 0, 0.06, 0));
  const roof = gableRoof(1.6, 0.7, 1.3, PAL.roofRed);
  roof.position.y = 0.9; roof.rotation.y = Math.PI / 2;
  g.add(roof);
  g.add(place(door(), 0, 0.12, 0.66));
  for (const s of [-1, 1]) g.add(place(windowPane(), s * 0.5, 0.52, 0.66));
  g.add(place(box(0.2, 0.5, 0.2, PAL.brick, { r: 0.03 }), 0.45, 1.45, -0.2));
  return g;
}

export function makeTree() {
  const g = group();
  g.add(place(cyl(0.09, 0.14, 0.7, PAL.woodDark), 0, 0.35, 0));
  const lm = leafMat(PAL.leaf);
  g.add(place(ball(0.45, lm, { low: true }), 0, 0.95, 0));
  g.add(place(ball(0.32, lm, { low: true }), 0.28, 0.8, 0.12));
  g.add(place(ball(0.3, lm, { low: true }), -0.25, 0.85, -0.1));
  g.add(blobShadow(0.6));
  return g;
}

export function makeSpinner() {
  const g = group();
  g.add(place(cyl(0.04, 0.05, 1, PAL.wood), 0, 0.5, 0));
  const blades = group();
  for (let i = 0; i < 4; i++) {
    const b = place(box(0.08, 0.5, 0.02, i % 2 ? PAL.roofRed : PAL.white, { r: 0.01 }), 0, 0.25, 0);
    const piv = group(b); piv.rotation.z = (i * Math.PI) / 2; blades.add(piv);
  }
  blades.position.set(0, 1, 0.06);
  g.add(blades);
  g.userData.anim = (t) => { blades.rotation.z = t * 2; };
  return g;
}

export const CATALOG = {
  well: makeWell,
  cottage: makeCottage,
  tree: makeTree,
  spinner: makeSpinner,
  sphereRef: () => place(mesh(GEO.sphere(0.4), M('#e53935')), 0, 0.4, 0),
  coneRef: () => place(cone(0.35, 0.8, M('#ffc107')), 0, 0.4, 0),
};
