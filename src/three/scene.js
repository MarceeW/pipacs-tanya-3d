// Renderer, isometric camera with smooth pan/zoom/rotate, day-night lighting and weather.
import { THREE, U, applySeason, setNightGlow } from './lib.js';
import { createRenderer, createLights, ISO_PITCH } from './look.js';
import { MAP } from '../data/content.js';

export let renderer, scene, camera, lights;
export const cam = {
  x: 26, z: 24,            // look-at target on the ground (world units)
  zoom: 11,                // half height of the view in world units (smaller = closer)
  yaw: 0, yawTarget: 0,    // yaw index (0..3) animated
  tx: 26, tz: 24, tzoom: 11,
};
const ZMIN = 4.5, ZMAX = 24;
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const tmpV = new THREE.Vector3();
const ndc = new THREE.Vector2();
let W = 1, H = 1;

const SKY = {
  day: new THREE.Color('#9fd8f5'), night: new THREE.Color('#1a2547'), dusk: new THREE.Color('#f6b17a'),
};

export function initScene(canvas) {
  renderer = createRenderer(canvas);
  scene = new THREE.Scene();
  scene.background = SKY.day.clone();
  lights = createLights(scene, { shadowSize: 26, mapSize: 2048 });
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -300, 400);
  initWeather();
  resize();
  addEventListener('resize', resize);
}

export function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false);
  updateCamera(true);
}
export function setQuality(q) {
  const ratio = q === 'low' ? 1 : Math.min(2, devicePixelRatio || 1);
  renderer.setPixelRatio(ratio);
  renderer.shadowMap.enabled = q !== 'low';
  lights.sun.castShadow = q !== 'low';
  lights.sun.shadow.mapSize.set(q === 'high' ? 2048 : 1024, q === 'high' ? 2048 : 1024);
  if (lights.sun.shadow.map) { lights.sun.shadow.map.dispose(); lights.sun.shadow.map = null; }
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  resize();
}

// ------------------------------------------------------------------ camera
const yawAngle = (y) => Math.PI / 4 + y * Math.PI / 2;
export function updateCamera(force = false) {
  const k = force ? 1 : 0.2;
  cam.x += (cam.tx - cam.x) * k; cam.z += (cam.tz - cam.z) * k;
  cam.zoom += (cam.tzoom - cam.zoom) * k;
  cam.yaw += (cam.yawTarget - cam.yaw) * (force ? 1 : 0.14);
  const a = W / H, z = cam.zoom;
  camera.left = -z * a; camera.right = z * a; camera.top = z; camera.bottom = -z;
  camera.updateProjectionMatrix();
  const yaw = yawAngle(cam.yaw), d = 80;
  camera.position.set(cam.x + Math.sin(yaw) * Math.cos(ISO_PITCH) * d, Math.sin(ISO_PITCH) * d, cam.z + Math.cos(yaw) * Math.cos(ISO_PITCH) * d);
  camera.lookAt(cam.x, 0, cam.z);
  camera.updateMatrixWorld();
  lights.follow(Math.round(cam.x), Math.round(cam.z));
  const s = Math.max(14, z * 1.7);
  const sc = lights.sun.shadow.camera;
  if (Math.abs(sc.right - s) > 0.5) { sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.updateProjectionMatrix(); }
}
export function clampTarget() {
  cam.tx = Math.max(4, Math.min(MAP - 4, cam.tx));
  cam.tz = Math.max(4, Math.min(MAP - 2, cam.tz));
}
export function panBy(dxWorld, dzWorld) { cam.tx += dxWorld; cam.tz += dzWorld; clampTarget(); cam.x = cam.tx; cam.z = cam.tz; }
export function zoomAt(sx, sy, factor) {
  const before = screenToGround(sx, sy);
  cam.tzoom = Math.max(ZMIN, Math.min(ZMAX, cam.tzoom / factor));
  // keep the point under the cursor fixed
  const oldZoom = cam.zoom; cam.zoom = cam.tzoom; updateCamera(true);
  const after = screenToGround(sx, sy);
  cam.zoom = oldZoom;
  if (before && after) { cam.tx += before.x - after.x; cam.tz += before.z - after.z; clampTarget(); }
  cam.x = cam.tx; cam.z = cam.tz; updateCamera(true);
}
export function rotate(dir) { cam.yawTarget += dir; }
export function focusOn(x, z, zoom) { cam.tx = x; cam.tz = z; if (zoom) cam.tzoom = zoom; clampTarget(); }
export const yawIndex = () => ((Math.round(cam.yawTarget) % 4) + 4) % 4;

// ------------------------------------------------------------------ picking helpers
export function setRay(sx, sy) {
  ndc.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster;
}
export function screenToGround(sx, sy) {
  setRay(sx, sy);
  const p = raycaster.ray.intersectPlane(groundPlane, tmpV);
  return p ? { x: p.x, z: p.z } : null;
}
export function worldToScreen(x, y, z) {
  tmpV.set(x, y, z).project(camera);
  return { x: ((tmpV.x + 1) / 2) * W, y: ((1 - tmpV.y) / 2) * H, visible: tmpV.z < 1 };
}

// ------------------------------------------------------------------ environment
let curSeason = null;
export function applyEnvironment(c, nightK, duskK, dt) {
  // sky colour
  const sky = SKY.day.clone();
  if (c.weather === 'rain' || c.weather === 'snow') sky.lerp(new THREE.Color('#9fb4c4'), 0.6);
  else if (c.weather === 'cloud') sky.lerp(new THREE.Color('#b8cfdc'), 0.4);
  sky.lerp(SKY.dusk, duskK * 0.55).lerp(SKY.night, nightK);
  scene.background.lerp(sky, Math.min(1, dt * 2));
  const overcast = c.weather === 'sun' ? 0 : c.weather === 'cloud' ? 0.15 : 0.3;
  lights.setDay((1 - nightK) * (1 - overcast), duskK);
  setNightGlow(nightK);
  U.uWind.value += ((c.weather === 'rain' || c.weather === 'snow' ? 2.2 : 1) - U.uWind.value) * Math.min(1, dt);
  // seasons: snow fades in/out smoothly
  const snowTarget = c.season === 'winter' ? 1 : 0;
  U.uSnow.value += (snowTarget - U.uSnow.value) * Math.min(1, dt * 0.25);
  if (c.season !== curSeason) { curSeason = c.season; applySeason(c.season); }
  weatherTarget = c.weather;
}

// ------------------------------------------------------------------ weather particles
let rain, snow, weatherTarget = 'sun', rainK = 0, snowK = 0;
const RAIN_N = 1400, SNOW_N = 900, BOX = 34, TOP = 22;
function initWeather() {
  const rg = new THREE.BufferGeometry();
  const rp = new Float32Array(RAIN_N * 6);
  for (let i = 0; i < RAIN_N; i++) {
    const x = (Math.random() - 0.5) * BOX, y = Math.random() * TOP, z = (Math.random() - 0.5) * BOX;
    rp.set([x, y, z, x - 0.06, y - 0.55, z + 0.03], i * 6);
  }
  rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0, depthWrite: false }));
  rain.frustumCulled = false;
  scene.add(rain);

  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(SNOW_N * 3);
  for (let i = 0; i < SNOW_N; i++) sp.set([(Math.random() - 0.5) * BOX, Math.random() * TOP, (Math.random() - 0.5) * BOX], i * 3);
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const x = c.getContext('2d'); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  snow = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.22, map: new THREE.CanvasTexture(c), transparent: true, opacity: 0, depthWrite: false }));
  snow.frustumCulled = false;
  scene.add(snow);
}
export function updateWeather(dt) {
  rainK += ((weatherTarget === 'rain' ? 1 : 0) - rainK) * Math.min(1, dt * 0.8);
  snowK += ((weatherTarget === 'snow' ? 1 : 0) - snowK) * Math.min(1, dt * 0.8);
  rain.visible = rainK > 0.01; snow.visible = snowK > 0.01;
  rain.material.opacity = 0.55 * rainK; snow.material.opacity = 0.95 * snowK;
  rain.position.set(cam.x, 0, cam.z); snow.position.set(cam.x, 0, cam.z);
  if (rain.visible) {
    const p = rain.geometry.attributes.position.array;
    const fall = dt * 22;
    for (let i = 0; i < RAIN_N; i++) {
      const o = i * 6;
      p[o + 1] -= fall; p[o + 4] -= fall; p[o] -= fall * 0.1; p[o + 3] -= fall * 0.1;
      if (p[o + 4] < 0) { const x = (Math.random() - 0.5) * BOX, z = (Math.random() - 0.5) * BOX; p[o] = x; p[o + 1] = TOP; p[o + 2] = z; p[o + 3] = x - 0.06; p[o + 4] = TOP - 0.55; p[o + 5] = z + 0.03; }
    }
    rain.geometry.attributes.position.needsUpdate = true;
  }
  if (snow.visible) {
    const p = snow.geometry.attributes.position.array, t = U.uTime.value;
    for (let i = 0; i < SNOW_N; i++) {
      const o = i * 3;
      p[o + 1] -= dt * (1.2 + (i % 5) * 0.15);
      p[o] += Math.sin(t + i) * dt * 0.4;
      if (p[o + 1] < 0) { p[o] = (Math.random() - 0.5) * BOX; p[o + 1] = TOP; p[o + 2] = (Math.random() - 0.5) * BOX; }
    }
    snow.geometry.attributes.position.needsUpdate = true;
  }
}
export const weatherLevel = () => ({ rain: rainK, snow: snowK });
