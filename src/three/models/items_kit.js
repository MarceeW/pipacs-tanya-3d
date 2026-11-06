// Private building kit for item / UI icon models (used by items*.js only).
// Every helper takes a colour string (or a material) and returns a mesh, so models read as
// one-liners. All item materials are created with `snow: 0` so icons never pick up the winter
// snow effect, and never use leafMat (icons must not change colour with the seasons).
import { THREE, M, GEO, mesh, group } from '../lib.js';

export { THREE, group, M };

/** Item material: cached M() without snow. Strings become materials, materials pass through. */
export const mat = (c, o = {}) => (typeof c === 'string' ? M(c, { snow: 0, ...o }) : c);
/** Unlit-looking white used for glossy highlights. */
export const HI = () => M('#ffffff', { snow: 0, emissive: '#ffffff' });
/** Self-lit colour (flames, sparkles). */
export const LIT = (c, k = c) => M(c, { snow: 0, emissive: k });
/** Flat-shaded variant (faceted gems, stones, low-poly leaves). */
export const FLAT = (c) => M(c, { snow: 0, flat: true });

/** Lighten/darken a hex colour: dl in -1..1 (lightness offset), ds saturation offset. */
export function shade(hex, dl = 0, ds = 0) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, ds, dl);
  return '#' + c.getHexString();
}

const m = (geo, c, o) => mesh(geo, mat(c), { shadow: o.shadow ?? true, ...o });

/** Rounded box; o.r = corner radius (default 22% of the smallest side), o.r = 0 for a sharp box. */
export const B = (w, h, d, c, o = {}) => {
  const r = o.r ?? Math.min(w, h, d) * 0.22;
  return m(r > 0 ? GEO.rbox(w, h, d, r) : GEO.box(w, h, d), c, o);
};
export const Cy = (rt, rb, h, c, o = {}) => m(GEO.cyl(rt, rb, h, o.seg || 22), c, o);
export const Co = (r, h, c, o = {}) => m(GEO.cone(r, h, o.seg || 18), c, o);
export const S = (r, c, o = {}) => m(o.low ? GEO.ico(r, o.det ?? 1) : GEO.sphere(r, o.ws || 20, o.hs || 14), c, o);
export const Ca = (r, len, c, o = {}) => m(GEO.capsule(r, len), c, o);
export const T = (r, t, c, o = {}) => m(GEO.torus(r, t, o.rs || 8, o.ts || 24, o.arc ?? Math.PI * 2), c, o);
export const L = (key, pts, c, o = {}) => m(GEO.lathe('it_' + key, pts, o.seg || 22), c, o);
/** Triangular prism: base w along x, apex height h along +y, depth d along z (centred). */
export const Pr = (w, h, d, c, o = {}) => m(GEO.prism(w, h, d), c, o);

/** Glossy highlight dot (white, self-lit). */
export const shine = (x, y, z, r = 0.05, sc = [1, 0.7, 0.5], rot = [0, 0, 0.5]) =>
  S(r, HI(), { at: [x, y, z], scale: sc, rot, shadow: false, ws: 10, hs: 8 });

/** Sparkle: two crossed thin self-lit bars (a 4-point twinkle). */
export function sparkle(x, y, z, s = 0.12, c = '#fff6c2') {
  const g = group(
    B(s, s * 0.22, 0.02, LIT(c), { r: 0.008, shadow: false }),
    B(s * 0.22, s, 0.02, LIT(c), { r: 0.008, shadow: false }),
  );
  g.position.set(x, y, z);
  g.rotation.z = Math.PI / 4;
  return g;
}

/** Position/rotate/scale helper for groups. */
export function at(o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = null) {
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  if (s != null) Array.isArray(s) ? o.scale.set(...s) : o.scale.setScalar(s);
  return o;
}

/**
 * Normalise a model for icon rendering: optional tilt (around x, towards the camera) and yaw,
 * then scale uniformly so the largest bounding-box side is 1, centre on x/z and sit on y = 0.
 */
export function finish(obj, { yaw = 0.42, tilt = 0 } = {}) {
  const inner = group(obj);
  inner.rotation.order = 'YXZ';
  inner.rotation.set(tilt, yaw, 0);
  const outer = group(inner);
  outer.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(outer, true);
  const s = b.getSize(new THREE.Vector3());
  const c = b.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -b.min.y, -c.z);
  outer.scale.setScalar(1 / Math.max(s.x, s.y, s.z, 1e-3));
  let n = 0;
  outer.traverse((o) => { if (o.isMesh) n++; });
  outer.userData.meshes = n;
  return outer;
}
