// Renderer + lighting setup shared by the game, the model gallery and the icon renderer,
// so a model looks identical everywhere.
import { THREE } from './lib.js';

export const ISO_PITCH = Math.atan(1 / Math.sqrt(2)); // classic isometric elevation (~35.26deg)

export function createRenderer(canvas, { alpha = false, preserve = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: preserve, powerPreference: 'high-performance' });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  return r;
}

/** Sun + sky lights. Call `lights.setDay(k, tint)` with k in 0 (night) .. 1 (noon). */
export function createLights(scene, { shadowSize = 30, mapSize = 2048 } = {}) {
  const hemi = new THREE.HemisphereLight(0xdff3ff, 0x6a8f3a, 1.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.1);
  sun.position.set(7, 24, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mapSize, mapSize);
  const s = shadowSize;
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 120 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xbfd9ff, 0.35);
  fill.position.set(12, 10, -14);
  scene.add(fill);

  const dayHemiSky = new THREE.Color(0xdff3ff), nightHemiSky = new THREE.Color(0x7d90d0);
  const dayHemiGround = new THREE.Color(0x6a8f3a), nightHemiGround = new THREE.Color(0x34465e);
  const daySun = new THREE.Color(0xfff1d6), duskSun = new THREE.Color(0xffa05a), nightSun = new THREE.Color(0x8fa6ff);

  return {
    hemi, sun, fill,
    /** k: 0 night .. 1 day, dusk: 0..1 amount of golden-hour tint */
    setDay(k, dusk = 0) {
      hemi.color.copy(nightHemiSky).lerp(dayHemiSky, k);
      hemi.groundColor.copy(nightHemiGround).lerp(dayHemiGround, k);
      hemi.intensity = 1.05 + 0.3 * k;
      sun.color.copy(nightSun).lerp(daySun, k).lerp(duskSun, dusk * 0.6);
      sun.intensity = 0.7 + 1.4 * k;
      fill.intensity = 0.2 + 0.15 * k;
    },
    /** keep the shadow camera centred on what the player looks at */
    follow(x, z) {
      sun.target.position.set(x, 0, z);
      sun.position.set(x + 7, 24, z + 15);
    },
  };
}

/** Orthographic isometric camera looking at the origin from yaw `rot` (multiples of 90deg + 45deg). */
export function createIsoCamera(aspect, viewSize = 14) {
  const cam = new THREE.OrthographicCamera(-viewSize * aspect, viewSize * aspect, viewSize, -viewSize, -200, 400);
  return cam;
}
export function aimIsoCamera(cam, target, yaw, dist = 60) {
  const p = ISO_PITCH;
  cam.position.set(
    target.x + Math.sin(yaw) * Math.cos(p) * dist,
    target.y + Math.sin(p) * dist,
    target.z + Math.cos(yaw) * Math.cos(p) * dist,
  );
  cam.lookAt(target);
}
