// Bootstrap: build icons, load the save, create the 3D world, start the loop.
import * as G from './core/game.js';
import { ITEMS, BUILDINGS, HOUSINGS, DECOS, TREES } from './data/content.js';
import { U } from './three/lib.js';
import { initScene, renderer, scene, camera, cam, updateCamera, applyEnvironment, updateWeather, focusOn, setQuality, worldToScreen } from './three/scene.js';
import { initTerrain, setWaterNight } from './three/terrain.js';
import { initWorld, updateWorld } from './three/world.js';
import { initFx, updateFx } from './three/fx.js';
import { buildIcons, registerShopIcons } from './three/icons.js';
import { initUI, refresh } from './ui/ui.js';
import { openModal } from './ui/modals.js';
import { initInput } from './input.js';
import { setAudio, sfx } from './audio.js';

const UI_ICONS = ['coin', 'coins', 'gem', 'xp', 'heart', 'clock', 'water', 'hoe', 'seedbag', 'wateringcan', 'sickle', 'hand', 'shovel', 'move',
  'shop', 'barn', 'orders', 'truck', 'map', 'fishing', 'gift', 'trophy', 'calendar', 'settings', 'sun', 'rain', 'snow', 'cloud',
  'spring', 'summer', 'autumn', 'winter', 'moon', 'lock', 'check', 'plus', 'level', 'boat', 'visitor', 'market', 'dog', 'star'];

const loadFill = document.getElementById('load-fill');
const loadText = document.getElementById('load-text');
const progress = (k, txt) => { loadFill.style.width = `${Math.round(k * 100)}%`; if (txt) loadText.textContent = txt; };

async function boot() {
  progress(0.02, 'Ikonok festése…');
  await buildIcons(Object.keys(ITEMS), UI_ICONS, (k) => progress(0.05 + k * 0.55));
  progress(0.62, 'Épületek makettjei…');
  await registerShopIcons({ building: Object.keys(BUILDINGS), housing: Object.keys(HOUSINGS), deco: Object.keys(DECOS), tree: Object.keys(TREES) }, (k) => progress(0.62 + k * 0.2));
  progress(0.84, 'A tanya ébredezik…');
  const away = G.load();
  setAudio(G.S.settings);

  const canvas = document.getElementById('game');
  initScene(canvas);
  initTerrain(scene);
  initFx(scene);
  initWorld();
  setQuality(G.S.settings.quality || 'high');
  progress(0.94, 'Utolsó simítások…');
  initUI();
  initInput(canvas);
  if (G.S.cam) Object.assign(cam, { tx: G.S.cam.x, tz: G.S.cam.z, tzoom: G.S.cam.zoom, x: G.S.cam.x, z: G.S.cam.z, zoom: G.S.cam.zoom, yaw: G.S.cam.yaw || 0, yawTarget: G.S.cam.yaw || 0 });
  else focusOn(24, 24, 9.5);
  updateCamera(true);

  if (import.meta.env.DEV) window.__pt = { G, cam, scene, renderer, w2s: worldToScreen };

  // first-run + returning player flow
  if (!G.S.stats.welcomed) { G.S.stats.welcomed = 1; openModal('welcome', {}, true); }
  else if (away > 120000) openModal('away', { away, sum: G.readySummary() }, true);
  if (G.S.daily.pending) openModal('daily', {}, true);

  progress(1);
  setTimeout(() => document.getElementById('loading').classList.add('gone'), 150);
  setTimeout(() => document.getElementById('loading').remove(), 900);
  loop();
}

let last = performance.now(), tickAcc = 0, saveAcc = 0, t = 0;
let env = { night: 0, season: 'spring' };
function loop() {
  requestAnimationFrame(loop);
  const n = performance.now();
  const dt = Math.min(0.1, (n - last) / 1000);
  last = n; t += dt;
  U.uTime.value = t;
  tickAcc += dt; saveAcc += dt;
  let c = null;
  if (tickAcc >= 1) { tickAcc = 0; c = G.tick(); }
  c ||= G.clock();
  const night = G.nightFactor(c.hour), dusk = G.duskFactor(c.hour);
  env = { night, season: c.season, weather: c.weather };
  applyEnvironment(c, night, dusk, dt);
  setWaterNight(night * 0.6);
  updateCamera();
  updateWeather(dt);
  updateWorld(t, dt, env);
  updateFx(dt);
  renderer.render(scene, camera);
  if (saveAcc > 10) { saveAcc = 0; persist(); }
}
function persist() {
  if (!G.S) return;
  G.S.cam = { x: cam.tx, z: cam.tz, zoom: cam.tzoom, yaw: Math.round(cam.yawTarget) };
  G.save();
}
addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
addEventListener('pagehide', persist);
addEventListener('beforeunload', persist);

boot().catch((e) => {
  console.error(e);
  loadText.textContent = 'Hiba történt a betöltéskor: ' + e.message;
});
