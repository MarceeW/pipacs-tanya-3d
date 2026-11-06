// Item & UI icon models. Rendered once at startup into small PNG icons (inventory, shop, orders,
// rewards), so every model is bold, chunky and glossy, with a clear silhouette.
//
// API
//   makeItem(id)     -> Object3D for every key of ITEMS (crops, fruits, animal products, feeds,
//                       processed goods, materials, fish). Goods use parametric builders keyed by
//                       ITEMS[id].look.shape; raw produce has hand-made models.
//   makeUiIcon(name) -> Object3D for UI pictograms (see UI_ICON_NAMES).
//   CATALOG          -> { item_<id>, ui_<name> } for the gallery / icon renderer.
// Every returned model is normalised: largest bounding-box side = 1, centred on x/z, sitting on
// y = 0, already turned towards the default isometric camera. userData.meshes = mesh count.
import { ITEMS, CROPS, TREES } from '../../data/content.js';
import { finish, group, B, S, Cy } from './items_kit.js';
import { SHAPES, SHAPE_VIEW } from './items_goods.js';
import { PRODUCE, PRODUCE_VIEW } from './items_produce.js';
import { UI_ICONS, UI_VIEW } from './items_ui.js';

/** Fallback for unknown ids: a wooden crate with a question-mark-ish knob. */
function crate() {
  return group(B(0.8, 0.6, 0.6, '#c8955a', { at: [0, 0.3, 0], r: 0.05 }), B(0.84, 0.08, 0.64, '#8d5524', { at: [0, 0.45, 0], r: 0.02 }),
    S(0.12, '#ffc83d', { at: [0, 0.3, 0.31], scale: [1, 1, 0.4] }), Cy(0.05, 0.05, 0.02, '#8d5524', { at: [0, 0.3, 0.34], rot: [Math.PI / 2, 0, 0] }));
}

export function makeItem(id) {
  const def = ITEMS[id];
  const look = def?.look;
  if (PRODUCE[id]) {
    const hint = CROPS[id]?.look || TREES[id]?.look || {};
    return finish(PRODUCE[id](hint), PRODUCE_VIEW[id]);
  }
  if (look?.shape && SHAPES[look.shape]) return finish(SHAPES[look.shape](look, id), SHAPE_VIEW[look.shape]);
  return finish(crate());
}

export const UI_ICON_NAMES = Object.keys(UI_ICONS);

export function makeUiIcon(name) {
  const make = UI_ICONS[name];
  return finish(make ? make() : crate(), UI_VIEW[name]);
}

export const CATALOG = {};
for (const id of Object.keys(ITEMS)) CATALOG['item_' + id] = () => makeItem(id);
for (const name of UI_ICON_NAMES) CATALOG['ui_' + name] = () => makeUiIcon(name);
