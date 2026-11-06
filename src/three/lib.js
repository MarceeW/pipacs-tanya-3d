// Shared 3D style kit: cached materials, geometry helpers and global shader effects
// (wind sway, seasonal snow, night glow). Every model module builds from these so the
// whole world reads as one bright, soft, cartoon style.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export { THREE };

// Global uniforms shared by every patched material.
export const U = {
  uTime: { value: 0 },
  uSnow: { value: 0 },   // 0..1 winter snow cover on upward faces
  uWind: { value: 1 },   // wind strength multiplier
};

// ------------------------------------------------------------------ palette
// Bright, saturated "storybook farm" colours. Use these names in models where possible.
export const PAL = {
  grass: '#7cc242', grassDark: '#5ea83a', grassLight: '#a6d85b',
  leaf: '#4caf50', leafDark: '#2e7d32', leafLight: '#8bc34a',
  soil: '#8a5a33', soilDark: '#6b4226', soilWet: '#5d3a20',
  wood: '#b07a45', woodDark: '#7a4f2a', woodLight: '#d7a86e', plank: '#c8955a',
  roofRed: '#d9483b', roofRedDark: '#a8322a', roofBlue: '#3f7cc4', roofGreen: '#4f9a4a', thatch: '#e3b65c',
  wall: '#fbf3e1', wallWarm: '#f3dfb8', brick: '#c0583a', stone: '#a9a9a1', stoneDark: '#7d7d76',
  white: '#ffffff', cream: '#fff8e1', black: '#2b2b2b', metal: '#9fa8b0', gold: '#ffc83d',
  water: '#4fb3e8', glass: '#bfe6ff', window: '#ffe9a3', skinLight: '#f6d0b0', skin: '#e0ac86',
};

// ------------------------------------------------------------------ shader patch
function patch(mat, { sway = 0, snow = 1 } = {}) {
  mat.userData.sway = sway;
  mat.userData.snowK = snow;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.uniforms.uSnow = U.uSnow;
    sh.uniforms.uWind = U.uWind;
    sh.uniforms.uSway = { value: sway };
    sh.uniforms.uSnowK = { value: snow };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uSway; uniform float uWind;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        if (uSway > 0.0) {
          #ifdef USE_INSTANCING
            vec4 swp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
          #else
            vec4 swp = modelMatrix * vec4(transformed, 1.0);
          #endif
          float sh = clamp(swp.y, 0.0, 3.0);
          float ph = swp.x * 0.8 + swp.z * 0.6;
          float a = uSway * uWind * sh * sh;
          transformed.x += (sin(uTime * 1.9 + ph) + 0.4 * sin(uTime * 4.3 + ph * 2.0)) * a;
          transformed.z += cos(uTime * 1.5 + ph * 1.3) * a * 0.7;
        }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uSnow; uniform float uSnowK;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (uSnow > 0.001 && uSnowK > 0.0) {
          vec3 wN = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
          float sf = smoothstep(0.45, 0.85, wN.y) * uSnow * uSnowK;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.97, 1.0), sf);
        }`);
  };
  mat.customProgramCacheKey = () => 'farm';
  return mat;
}

// ------------------------------------------------------------------ materials (cached)
const matCache = new Map();
const glowMats = [];     // emissive materials that light up at night
const seasonMats = [];   // foliage that changes colour with the season

/**
 * Cached cartoon material.
 * opts: { sway: 0..0.1 (wind bend for plants), snow: 0..1, emissive: hex, glow: bool (night glow),
 *         transparent, opacity, side, flat: flatShading, rough: unused hint }
 */
export function M(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  let m = matCache.get(key);
  if (m) return m;
  m = new THREE.MeshLambertMaterial({
    color: new THREE.Color(color),
    flatShading: !!opts.flat,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  });
  if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = opts.glow ? 0 : 1; }
  if (opts.glow) glowMats.push(m);
  patch(m, { sway: opts.sway || 0, snow: opts.snow ?? 1 });
  matCache.set(key, m);
  return m;
}

/** Foliage material whose colour follows the season (spring fresh, autumn orange, winter dull). */
export function leafMat(color, opts = {}) {
  const key = 'leaf' + color + JSON.stringify(opts);
  let m = matCache.get(key);
  if (m) return m;
  m = M(color, { sway: 0.025, ...opts, _leaf: 1 });
  m.userData.base = new THREE.Color(color);
  m.userData.evergreen = !!opts.evergreen;
  seasonMats.push(m);
  matCache.set(key, m);
  tintLeaf(m, seasonMats.length - 1, curSeason);
  return m;
}

const AUTUMN = ['#e8a33c', '#d9662b', '#c9442a', '#f0c44a', '#b5652a'].map((c) => new THREE.Color(c));
let curSeason = 'summer';
function tintLeaf(m, i, season) {
  const b = m.userData.base;
  const hsl = {}; b.getHSL(hsl);
  if (m.userData.evergreen) {
    m.color.setHSL(hsl.h, hsl.s * (season === 'winter' ? 0.7 : 1), hsl.l * (season === 'winter' ? 0.85 : 1));
    return;
  }
  if (season === 'spring') m.color.setHSL(hsl.h - 0.02, Math.min(1, hsl.s * 1.1), Math.min(0.8, hsl.l * 1.12));
  else if (season === 'summer') m.color.copy(b);
  else if (season === 'autumn') m.color.copy(b).lerp(AUTUMN[i % AUTUMN.length], 0.78);
  else m.color.setHSL(0.09, 0.25, 0.42);
}
/** Recolour all foliage (and every foliage material created later) for the season. */
export function applySeason(season) {
  curSeason = season;
  seasonMats.forEach((m, i) => tintLeaf(m, i, season));
}
export function setNightGlow(k) { for (const m of glowMats) m.emissiveIntensity = k; }

// ------------------------------------------------------------------ geometry cache
const geoCache = new Map();
function geo(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
const k = (...a) => a.map((v) => (typeof v === 'number' ? +v.toFixed(3) : v)).join('|');

export const GEO = {
  box: (w, h, d) => geo(k('box', w, h, d), () => new THREE.BoxGeometry(w, h, d)),
  rbox: (w, h, d, r = 0.06, seg = 2) => geo(k('rbox', w, h, d, r, seg), () => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) * 0.999)),
  cyl: (rt, rb, h, seg = 12) => geo(k('cyl', rt, rb, h, seg), () => new THREE.CylinderGeometry(rt, rb, h, seg)),
  cone: (r, h, seg = 12) => geo(k('cone', r, h, seg), () => new THREE.ConeGeometry(r, h, seg)),
  sphere: (r, ws = 14, hs = 10) => geo(k('sph', r, ws, hs), () => new THREE.SphereGeometry(r, ws, hs)),
  ico: (r, d = 1) => geo(k('ico', r, d), () => new THREE.IcosahedronGeometry(r, d)),
  torus: (r, t, rs = 8, ts = 16, arc = Math.PI * 2) => geo(k('tor', r, t, rs, ts, arc), () => new THREE.TorusGeometry(r, t, rs, ts, arc)),
  capsule: (r, len, cs = 6, rs = 12) => geo(k('cap', r, len, cs, rs), () => new THREE.CapsuleGeometry(r, len, cs, rs)),
  plane: (w, h) => geo(k('pl', w, h), () => new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2)),
  circle: (r, seg = 24) => geo(k('circ', r, seg), () => new THREE.CircleGeometry(r, seg).rotateX(-Math.PI / 2)),
  // triangular prism used for gable roofs: width along x, depth along z, height up
  prism: (w, h, d) => geo(k('prism', w, h, d), () => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    g.computeVertexNormals();
    return g;
  }),
  lathe: (key, pts, seg = 16) => geo(k('lathe', key, seg), () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg)),
};

// ------------------------------------------------------------------ mesh helpers
/**
 * Create a mesh. `m` is a material or a colour string (then M(color) is used).
 * opts: { at:[x,y,z], rot:[x,y,z], scale: n|[x,y,z], shadow: true, receive: true, name }
 */
export function mesh(geometry, m, opts = {}) {
  const mat = typeof m === 'string' ? M(m) : m;
  const o = new THREE.Mesh(geometry, mat);
  if (opts.at) o.position.set(...opts.at);
  if (opts.rot) o.rotation.set(...opts.rot);
  if (opts.scale != null) Array.isArray(opts.scale) ? o.scale.set(...opts.scale) : o.scale.setScalar(opts.scale);
  o.castShadow = opts.shadow ?? true;
  o.receiveShadow = opts.receive ?? true;
  if (opts.name) o.name = opts.name;
  return o;
}

// Convenience builders: all return the mesh so they can be added in one line.
export const box = (w, h, d, c, o = {}) => mesh(o.r ? GEO.rbox(w, h, d, o.r) : GEO.box(w, h, d), c, o);
export const cyl = (rt, rb, h, c, o = {}) => mesh(GEO.cyl(rt, rb, h, o.seg || 12), c, o);
export const cone = (r, h, c, o = {}) => mesh(GEO.cone(r, h, o.seg || 12), c, o);
export const ball = (r, c, o = {}) => mesh(o.low ? GEO.ico(r, 1) : GEO.sphere(r, o.ws || 14, o.hs || 10), c, o);
export const capsule = (r, len, c, o = {}) => mesh(GEO.capsule(r, len), c, o);

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children.flat()) if (c) g.add(c);
  return g;
}
export function place(obj, x = 0, y = 0, z = 0, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; return obj; }

/** Gable roof: two sloped slabs + triangle ends. Ridge runs along z. Returns group sitting at y=0. */
export function gableRoof(w, h, d, color, opts = {}) {
  const g = new THREE.Group();
  const over = opts.overhang ?? 0.12;
  const thick = opts.thick ?? 0.08;
  const slope = Math.hypot(w / 2 + over, h);
  const ang = Math.atan2(h, w / 2 + over);
  const mat = typeof color === 'string' ? M(color) : color;
  for (const s of [-1, 1]) {
    const slab = mesh(GEO.rbox(slope, thick, d + over * 2, 0.03), mat);
    slab.position.set(s * (w / 2 + over) / 2, h / 2, 0);
    slab.rotation.z = -s * ang;
    g.add(slab);
  }
  if (opts.gable !== false) {
    const tri = mesh(GEO.prism(w, h, d - 0.02), opts.gableColor || PAL.wall);
    g.add(tri);
  }
  return g;
}

/** Simple window with frame + glowing pane (pane glows at night). Faces +z. */
export function windowPane(w = 0.3, h = 0.32, frame = PAL.white, opts = {}) {
  const g = new THREE.Group();
  g.add(mesh(GEO.box(w + 0.06, h + 0.06, 0.04), frame));
  const pane = mesh(GEO.box(w, h, 0.05), M(opts.pane || '#8fd3ff', { emissive: PAL.window, glow: true }), { shadow: false });
  pane.position.z = 0.005;
  g.add(pane);
  if (opts.cross !== false) {
    g.add(mesh(GEO.box(0.025, h, 0.06), frame, { shadow: false }));
    g.add(mesh(GEO.box(w, 0.025, 0.06), frame, { shadow: false }));
  }
  return g;
}

/** Door slab facing +z. */
export function door(w = 0.34, h = 0.55, color = PAL.woodDark) {
  const g = new THREE.Group();
  g.add(place(mesh(GEO.rbox(w, h, 0.05, 0.02), color), 0, h / 2, 0));
  g.add(place(ball(0.025, PAL.gold, { shadow: false }), w * 0.3, h * 0.48, 0.035));
  return g;
}

/** Disable shadows for a subtree (for tiny details). */
export function noShadow(obj) { obj.traverse((o) => { o.castShadow = false; }); return obj; }

/** Deterministic pseudo random from integer seed. */
export function rng(seed) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/** Soft round blob shadow (cheap fake contact shadow), radius in tiles. */
export function blobShadow(r = 0.5, opacity = 0.22) {
  const m = mesh(GEO.circle(r), shadowMat(opacity), { shadow: false, receive: false });
  m.position.y = 0.012;
  m.renderOrder = -1;
  return m;
}
let _shadowTex = null;
function shadowMat(opacity) {
  const key = 'blob' + opacity;
  if (matCache.has(key)) return matCache.get(key);
  if (!_shadowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    _shadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.MeshBasicMaterial({ map: _shadowTex, transparent: true, opacity, depthWrite: false, color: 0x1a2a10 });
  matCache.set(key, m);
  return m;
}
