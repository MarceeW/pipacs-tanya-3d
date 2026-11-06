// Static world: painted ground, river + pond water, road and bridge, forest and meadow scenery,
// farm border fence. Scenery is baked into a few merged meshes for speed.
import { THREE, U, M, PAL, box, cyl, place, group, mesh, GEO, rng } from './lib.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAP, WORLD, EXPANSIONS } from '../data/content.js';
import { makeWildTree, makeWildflowers } from './models/plants.js';

const PX = 40;                // texture pixels per tile
const SIZE = MAP * PX;
let groundTex, groundCanvas, groundMesh, borderGroup, sceneRef;
export const terrain = { root: new THREE.Group() };

const MAXF = EXPANSIONS[EXPANSIONS.length - 1];
const inMaxFarm = (x, y) => x >= MAXF.x0 - 0.5 && x < MAXF.x1 + 0.5 && y >= MAXF.y0 - 0.5 && y < MAXF.y1 + 0.5;
const onRoad = (x) => x >= WORLD.road.x0 - 0.6 && x < WORLD.road.x1 + 0.6;
const inRiver = (y) => y >= WORLD.river.y0 - 0.8 && y < WORLD.river.y1 + 0.3;
const P = WORLD.pond;
const pondC = { x: (P.x0 + P.x1) / 2, y: (P.y0 + P.y1) / 2, rx: (P.x1 - P.x0) / 2, ry: (P.y1 - P.y0) / 2 };
const inPond = (x, y, pad = 0) => ((x - pondC.x) / (pondC.rx + pad)) ** 2 + ((y - pondC.y) / (pondC.ry + pad)) ** 2 < 1;
const nearLandmark = (x, y) => WORLD.fixed.some((f) => x > f.x - 1.5 && x < f.x + 4.5 && y > f.y - 1.5 && y < f.y + 4.5);
const riverEdge = (x, side) => (side < 0 ? WORLD.river.y0 : WORLD.river.y1) + Math.sin(x * 0.45) * 0.35 + Math.sin(x * 1.3 + 2) * 0.15;

export function initTerrain(scene) {
  sceneRef = scene;
  scene.add(terrain.root);
  // far ground so the world never ends in the void
  const far = mesh(GEO.plane(400, 400), M('#62a83a', { snow: 0.9 }), { shadow: false });
  far.position.set(MAP / 2, -0.04, MAP / 2);
  terrain.root.add(far);

  groundCanvas = document.createElement('canvas');
  groundCanvas.width = groundCanvas.height = SIZE;
  groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.anisotropy = 4;
  const gm = new THREE.MeshLambertMaterial({ map: groundTex });
  patchSnow(gm, 0.92);
  groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP, MAP).rotateX(-Math.PI / 2), gm);
  groundMesh.position.set(MAP / 2, 0, MAP / 2);
  groundMesh.receiveShadow = true;
  groundMesh.name = 'ground';
  terrain.root.add(groundMesh);

  buildWater();
  buildBridge();
  buildScenery();
}

// Snow-capable copy of lib's patch for the textured ground material.
function patchSnow(mat, k) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSnow = U.uSnow;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uSnow;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.96, 1.0), uSnow * ${k.toFixed(2)} * (0.85 + 0.15 * sin(vMapUv.x * 900.0) * sin(vMapUv.y * 870.0)));`);
  };
}

// ------------------------------------------------------------------ ground painting
export function paintGround(b) {
  const g = groundCanvas.getContext('2d');
  const r = rng(7);
  const T = (v) => v * PX;
  // wild meadow base
  g.fillStyle = '#6cb23c'; g.fillRect(0, 0, SIZE, SIZE);
  blotches(g, r, 2600, ['#79bd45', '#5fa634', '#83c64d', '#68ad3a'], 8, 34);
  // not-yet-owned land inside the max farm: slightly wilder/darker
  g.fillStyle = 'rgba(70,120,40,0.18)';
  g.fillRect(T(MAXF.x0), T(MAXF.y0), T(MAXF.x1 - MAXF.x0), T(MAXF.y1 - MAXF.y0));
  // owned farm: lush, bright, well kept
  roundRect(g, T(b.x0) - 6, T(b.y0) - 6, T(b.x1 - b.x0) + 12, T(b.y1 - b.y0) + 12, 18, '#86c84b');
  g.save();
  g.beginPath(); g.rect(T(b.x0), T(b.y0), T(b.x1 - b.x0), T(b.y1 - b.y0)); g.clip();
  blotches(g, r, 900, ['#8fcf52', '#7fc246', '#97d45b', '#88c94e'], 10, 30, b);
  // subtle mown stripes
  g.globalAlpha = 0.06; g.fillStyle = '#ffffff';
  for (let y = b.y0; y < b.y1; y += 2) g.fillRect(T(b.x0), T(y), T(b.x1 - b.x0), T(1));
  g.globalAlpha = 1;
  g.restore();
  // grass flecks everywhere
  for (let i = 0; i < 9000; i++) {
    const x = r() * SIZE, y = r() * SIZE;
    g.fillStyle = r() < 0.5 ? 'rgba(40,90,20,0.22)' : 'rgba(210,240,140,0.22)';
    g.fillRect(x, y, 2, 5);
  }
  // road (vertical, full height) + path to the farm
  const rx0 = T(WORLD.road.x0), rx1 = T(WORLD.road.x1);
  g.fillStyle = '#c9a66b'; g.fillRect(rx0 - 6, 0, rx1 - rx0 + 12, SIZE);
  g.fillStyle = '#d8b97e'; g.fillRect(rx0, 0, rx1 - rx0, SIZE);
  g.fillStyle = 'rgba(140,100,50,0.35)';
  g.fillRect(rx0 + PX * 0.35, 0, 7, SIZE); g.fillRect(rx1 - PX * 0.35 - 7, 0, 7, SIZE);
  const py = T(23.5);
  g.fillStyle = '#c9a66b'; g.fillRect(T(b.x1) - 4, py - PX * 0.6, rx0 - T(b.x1) + 8, PX * 1.2);
  g.fillStyle = '#d8b97e'; g.fillRect(T(b.x1), py - PX * 0.45, rx0 - T(b.x1), PX * 0.9);
  // landmark yards (packed dirt)
  for (const f of WORLD.fixed) {
    if (f.key === 'dock' || f.key === 'pier') continue;
    roundRect(g, T(f.x) - 8, T(f.y) - 8, T(3) + 16, T(f.key === 'board' ? 2 : 3) + 16, 14, 'rgba(200,165,105,0.85)');
  }
  for (let i = 0; i < 1600; i++) {
    const x = rx0 + r() * (rx1 - rx0), y = r() * SIZE;
    g.fillStyle = r() < 0.5 ? 'rgba(120,90,50,0.4)' : 'rgba(255,240,200,0.4)';
    g.beginPath(); g.arc(x, y, 1 + r() * 2.5, 0, 6.3); g.fill();
  }
  // river banks (sand) + pond banks
  g.fillStyle = '#e2cf98';
  g.beginPath();
  g.moveTo(0, T(riverEdge(0, -1) - 0.6));
  for (let x = 0; x <= MAP; x += 0.25) g.lineTo(T(x), T(riverEdge(x, -1) - 0.6));
  for (let x = MAP; x >= 0; x -= 0.25) g.lineTo(T(x), T(riverEdge(x, 1) + 0.6));
  g.closePath(); g.fill();
  g.beginPath(); g.ellipse(T(pondC.x), T(pondC.y), T(pondC.rx + 0.7), T(pondC.ry + 0.7), 0, 0, 6.3); g.fill();
  // farm border dirt edge
  g.strokeStyle = 'rgba(120,85,45,0.45)'; g.lineWidth = 5;
  g.strokeRect(T(b.x0) - 2, T(b.y0) - 2, T(b.x1 - b.x0) + 4, T(b.y1 - b.y0) + 4);
  groundTex.needsUpdate = true;
  buildBorder(b);
}
function blotches(g, r, n, colors, rmin, rmax, clip) {
  for (let i = 0; i < n; i++) {
    const x = clip ? (clip.x0 + r() * (clip.x1 - clip.x0)) * PX : r() * SIZE;
    const y = clip ? (clip.y0 + r() * (clip.y1 - clip.y0)) * PX : r() * SIZE;
    const rad = rmin + r() * (rmax - rmin);
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    g.globalAlpha = 0.35 + r() * 0.35;
    g.beginPath(); g.ellipse(x, y, rad, rad * (0.6 + r() * 0.4), r() * 3, 0, 6.3); g.fill();
  }
  g.globalAlpha = 1;
}
function roundRect(g, x, y, w, h, rad, fill) {
  g.fillStyle = fill; g.beginPath();
  g.moveTo(x + rad, y); g.arcTo(x + w, y, x + w, y + h, rad); g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad); g.arcTo(x, y, x + w, y, rad); g.closePath(); g.fill();
}

// ------------------------------------------------------------------ water
let waterMat;
function makeWaterMat() {
  waterMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: U.uTime, uSnow: U.uSnow, uNight: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform float uTime; uniform float uSnow; uniform float uNight; varying vec3 vP;
      float n(vec2 p){ return sin(p.x)*sin(p.y); }
      void main(){
        vec2 p = vP.xz;
        float w = n(p*1.3 + vec2(uTime*0.6, uTime*0.4)) + 0.6*n(p*2.7 - vec2(uTime*0.5, -uTime*0.7));
        vec3 deep = vec3(0.16, 0.55, 0.82), shallow = vec3(0.36, 0.76, 0.93);
        vec3 c = mix(deep, shallow, 0.5 + 0.25*w);
        float sp = smoothstep(1.15, 1.45, w + 0.4*n(p*6.0 + uTime));
        c += vec3(0.9)*sp*0.5;
        vec3 ice = vec3(0.78, 0.9, 0.97);
        c = mix(c, ice + 0.05*w, uSnow*0.75);
        c *= mix(1.0, 0.38, uNight);
        gl_FragColor = vec4(c, 0.93);
        #include <colorspace_fragment>
      }`,
  });
  return waterMat;
}
export function setWaterNight(k) { if (waterMat) waterMat.uniforms.uNight.value = k; }
function buildWater() {
  const mat = makeWaterMat();
  // river: strip with wavy banks
  const pts = [];
  for (let x = -40; x <= MAP + 40; x += 0.5) pts.push([x, riverEdge(x, -1)]);
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], -pts[0][1]);
  for (const [x, y] of pts) shape.lineTo(x, -y);
  for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(pts[i][0], -riverEdge(pts[i][0], 1));
  const rg = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
  const river = new THREE.Mesh(rg, mat);
  river.position.y = 0.03;
  river.name = 'water';
  terrain.root.add(river);
  // pond
  const pg = new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2);
  const pond = new THREE.Mesh(pg, mat);
  pond.scale.set(pondC.rx, 1, pondC.ry);
  pond.position.set(pondC.x, 0.03, pondC.y);
  pond.name = 'water';
  terrain.root.add(pond);
  // reeds and lily pads around the pond
  const r = rng(31), deco = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, rr = 0.9 + r() * 0.15;
    const x = pondC.x + Math.cos(a) * pondC.rx * rr, z = pondC.y + Math.sin(a) * pondC.ry * rr;
    if (x > P.x1 - 1.2 && Math.abs(z - 23) < 1.6) continue; // keep the pier side clear
    for (let k = 0; k < 3; k++) deco.add(place(cyl(0.02, 0.025, 0.5 + r() * 0.4, M('#6f9a3a', { sway: 0.04 })), x + (r() - 0.5) * 0.3, 0.3, z + (r() - 0.5) * 0.3));
    if (r() < 0.4) deco.add(place(cyl(0.05, 0.05, 0.16, M('#6d4c41', { sway: 0.04 })), x, 0.72, z));
  }
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, rr = r() * 0.7;
    deco.add(place(cyl(0.22, 0.22, 0.02, M('#5aa33a', { snow: 0 })), pondC.x + Math.cos(a) * pondC.rx * rr, 0.05, pondC.y + Math.sin(a) * pondC.ry * rr));
  }
  bake(deco, 'reeds');
}
function buildBridge() {
  const g = group();
  const x0 = WORLD.road.x0 - 0.3, w = WORLD.road.x1 - WORLD.road.x0 + 0.6;
  const y0 = WORLD.river.y0 - 1.2, y1 = WORLD.river.y1 + 1.2;
  for (let y = y0; y < y1; y += 0.34) g.add(place(box(w, 0.1, 0.3, (Math.round(y * 3) % 2) ? PAL.plank : PAL.woodLight, { r: 0.02 }), x0 + w / 2, 0.32 + Math.sin(((y - y0) / (y1 - y0)) * Math.PI) * 0.35, y + 0.15));
  for (const s of [0, 1]) {
    for (let y = y0; y <= y1; y += 1.2) {
      const h = 0.32 + Math.sin(((y - y0) / (y1 - y0)) * Math.PI) * 0.35;
      g.add(place(box(0.12, 0.6, 0.12, PAL.woodDark, { r: 0.03 }), x0 + s * w, h + 0.2, y));
    }
    const rail = place(box(0.08, 0.08, y1 - y0, PAL.wood, { r: 0.03 }), x0 + s * w, 0.95, (y0 + y1) / 2);
    g.add(rail);
  }
  terrain.root.add(g);
}

// ------------------------------------------------------------------ scenery (forest, meadow)
function buildScenery() {
  const r = rng(99);
  const forest = new THREE.Group(), meadow = new THREE.Group();
  let seed = 1;
  const addTree = (x, z, kinds) => {
    const t = makeWildTree(kinds[Math.floor(r() * kinds.length)], seed++);
    t.position.set(x, 0, z); t.rotation.y = r() * 6.28;
    forest.add(t);
  };
  // dense forest beyond the map edges and along north/west/south
  for (let i = 0; i < 520; i++) {
    const x = -10 + r() * (MAP + 20), z = -10 + r() * (MAP + 20);
    const edge = Math.min(x, z, MAP - x, MAP - z);
    const dens = edge < 0 ? 0.9 : edge < 4 ? 0.7 : edge < 7 ? 0.35 : 0.06;
    if (r() > dens) continue;
    if (inMaxFarm(x, z) || onRoad(x) || inRiver(z) || inPond(x, z, 1.4) || nearLandmark(x, z)) continue;
    if (z > WORLD.river.y1 + 1 && edge > 0 && r() < 0.5) continue;
    addTree(x, z, edge < 3 ? ['pine', 'pine', 'oak', 'poplar'] : ['oak', 'birch', 'pine', 'bush', 'poplar']);
  }
  // meadow flowers outside the farm
  for (let i = 0; i < 420; i++) {
    const x = r() * MAP, z = r() * MAP;
    if (inMaxFarm(x, z) || onRoad(x) || inRiver(z) || inPond(x, z, 0.8) || nearLandmark(x, z)) continue;
    const f = makeWildflowers(seed++);
    f.position.set(x, 0, z); f.rotation.y = r() * 6.28;
    meadow.add(f);
  }
  bake(forest, 'forest');
  bake(meadow, 'meadow', false);
}

/** Merge every mesh of a subtree into one mesh per material. */
function bake(root, name, shadows = true) {
  root.updateMatrixWorld(true);
  const byMat = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    // merged geometries need the same attribute set
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const ng = g.index ? g.toNonIndexed() : g;
    const list = byMat.get(o.material) || [];
    list.push(ng);
    byMat.set(o.material, list);
  });
  const out = new THREE.Group(); out.name = name;
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = shadows && !mat.transparent && mat.type !== 'MeshBasicMaterial';
    m.receiveShadow = mat.type !== 'MeshBasicMaterial';
    out.add(m);
  }
  terrain.root.add(out);
  return out;
}

// ------------------------------------------------------------------ farm border fence
function buildBorder(b) {
  if (borderGroup) { terrain.root.remove(borderGroup); borderGroup.traverse((o) => o.geometry?.dispose?.()); }
  const g = new THREE.Group();
  const post = (x, z) => g.add(place(box(0.1, 0.42, 0.1, PAL.woodDark, { r: 0.03 }), x, 0.21, z));
  const rail = (x, z, len, alongX) => g.add(place(box(alongX ? len : 0.05, 0.06, alongX ? 0.05 : len, PAL.wood, { r: 0.02 }), x, 0.3, z));
  const gateZ0 = 22.6, gateZ1 = 24.4; // opening on the east side where the farm path comes in
  for (let x = b.x0; x < b.x1; x++) {
    post(x, b.y0 - 0.08); rail(x + 0.5, b.y0 - 0.08, 1, true);
    post(x, b.y1 + 0.08); rail(x + 0.5, b.y1 + 0.08, 1, true);
  }
  for (let y = b.y0; y < b.y1; y++) {
    post(b.x0 - 0.08, y); rail(b.x0 - 0.08, y + 0.5, 1, false);
    if (y + 1 <= gateZ0 || y >= gateZ1) { post(b.x1 + 0.08, y); rail(b.x1 + 0.08, y + 0.5, 1, false); }
  }
  post(b.x1 + 0.08, b.y1 + 0.08); post(b.x0 - 0.08, b.y1 + 0.08);
  g.updateMatrixWorld(true);
  borderGroup = new THREE.Group();
  const byMat = new Map();
  g.traverse((o) => { if (!o.isMesh) return; const ge = o.geometry.clone().applyMatrix4(o.matrixWorld); (byMat.get(o.material) || byMat.set(o.material, []).get(o.material)).push(ge.index ? ge.toNonIndexed() : ge); });
  for (const [mat, geos] of byMat) { const m = new THREE.Mesh(mergeGeometries(geos, false), mat); m.castShadow = true; m.receiveShadow = true; borderGroup.add(m); }
  terrain.root.add(borderGroup);
}

export function groundMeshes() { return [groundMesh]; }
export { pondC };
