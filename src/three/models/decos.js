// Decoration models (Pipacs Tanya 3D). Every DECOS key except the animals (dog, cat).
//
// API:
//   makeDeco(key, opts = {}) -> THREE.Group
//     opts.connect = { n, e, s, w }  booleans: neighbour of the same key (n = -z, s = +z, e = +x, w = -x);
//                                    used by fence / picket / hedge.
//     opts.seed    = int             small deterministic variation (paths, bushes, flowers, hay, ...).
//   Footprint = DECOS[key].size || 1, centred on origin, front faces +z, ground at y = 0.
//   Contracts on the returned group:
//     lamp:      userData.light = { y }      height of the lantern (attach a point light there).
//     sprinkler: userData.state = { on }     set on = true to show the spinning water spray.
//     animated (scarecrow, birdhouse, swing, pond, fountain, windwheel, windmill, sprinkler):
//                userData.anim(t, dt)        called every frame by the world.
//   Flat paths (path_*) stay below y = 0.04 and cover the full tile (0.98).
import { group } from '../lib.js';
import { makeFence, makePicket, makeHedge, makePathDirt, makePathStone, makePathBrick } from './decos_flat.js';
import { makeBush, makeFlowerbed, makeTulips, makeRosebush, makePine, makeOak, makeBirch, makePumpkins, makeHaybale } from './decos_garden.js';
import {
  makeScarecrow, makeBarrel, makeBench, makeLamp, makeMailbox, makeWellDeco, makeBirdhouse, makeWheelbarrow,
  makeSwing, makeGnome, makeSprinkler, makeWindwheel, makeStatue,
} from './decos_props.js';
import { makeCart, makePond, makeGazebo, makeFountain, makeTractor, makeWindmill } from './decos_big.js';

const MAKERS = {
  fence: (o) => makeFence(o.connect),
  picket: (o) => makePicket(o.connect),
  hedge: (o) => makeHedge(o.connect, o.seed),
  path_dirt: (o) => makePathDirt(o.seed),
  path_stone: (o) => makePathStone(o.seed),
  path_brick: (o) => makePathBrick(o.seed),
  bush: (o) => makeBush(o.seed),
  flowerbed: (o) => makeFlowerbed(o.seed),
  tulips: (o) => makeTulips(o.seed),
  haybale: (o) => makeHaybale(o.seed),
  scarecrow: () => makeScarecrow(),
  barrel: () => makeBarrel(),
  pine: (o) => makePine(o.seed),
  oak: (o) => makeOak(o.seed),
  birch: (o) => makeBirch(o.seed),
  bench: () => makeBench(),
  lamp: () => makeLamp(),
  mailbox: () => makeMailbox(),
  cart: () => makeCart(),
  well: () => makeWellDeco(),
  birdhouse: (o) => makeBirdhouse(o.seed),
  rosebush: (o) => makeRosebush(o.seed),
  wheelbarrow: () => makeWheelbarrow(),
  pond: (o) => makePond(o.seed),
  swing: () => makeSwing(),
  gnome: () => makeGnome(),
  pumpkins: () => makePumpkins(),
  sprinkler: () => makeSprinkler(),
  gazebo: () => makeGazebo(),
  fountain: () => makeFountain(),
  windwheel: () => makeWindwheel(),
  tractor: () => makeTractor(),
  statue: () => makeStatue(),
  windmill: () => makeWindmill(),
};

export const DECO_KEYS = Object.keys(MAKERS);

export function makeDeco(key, opts = {}) {
  const make = MAKERS[key];
  if (!make) return group();
  const g = make({ connect: opts.connect || {}, seed: opts.seed | 0 });
  g.name = 'deco:' + key;
  return g;
}

const C = (n, e, s, w) => ({ connect: { n, e, s, w } });
export const CATALOG = {
  fence_single: () => makeDeco('fence', C()),
  fence_ew: () => makeDeco('fence', C(0, 1, 0, 1)),
  fence_ns: () => makeDeco('fence', C(1, 0, 1, 0)),
  fence_corner: () => makeDeco('fence', C(1, 1, 0, 0)),
  fence_cross: () => makeDeco('fence', C(1, 1, 1, 1)),
  picket_single: () => makeDeco('picket', C()),
  picket_ew: () => makeDeco('picket', C(0, 1, 0, 1)),
  picket_tee: () => makeDeco('picket', C(0, 1, 1, 1)),
  picket_cross: () => makeDeco('picket', C(1, 1, 1, 1)),
  hedge_single: () => makeDeco('hedge', C()),
  hedge_ns: () => makeDeco('hedge', C(1, 0, 1, 0)),
  hedge_corner: () => makeDeco('hedge', C(0, 1, 1, 0)),
  hedge_cross: () => makeDeco('hedge', C(1, 1, 1, 1)),
  path_dirt: () => makeDeco('path_dirt', { seed: 1 }),
  path_dirt_2: () => makeDeco('path_dirt', { seed: 2 }),
  path_stone: () => makeDeco('path_stone', { seed: 1 }),
  path_stone_2: () => makeDeco('path_stone', { seed: 2 }),
  path_brick: () => makeDeco('path_brick', { seed: 1 }),
  path_brick_2: () => makeDeco('path_brick', { seed: 2 }),
  bush: () => makeDeco('bush'),
  flowerbed: () => makeDeco('flowerbed'),
  tulips: () => makeDeco('tulips'),
  haybale: () => makeDeco('haybale', { seed: 0 }),
  haybale_square: () => makeDeco('haybale', { seed: 1 }),
  scarecrow: () => makeDeco('scarecrow'),
  barrel: () => makeDeco('barrel'),
  pine: () => makeDeco('pine'),
  oak: () => makeDeco('oak'),
  birch: () => makeDeco('birch'),
  bench: () => makeDeco('bench'),
  lamp: () => makeDeco('lamp'),
  mailbox: () => makeDeco('mailbox'),
  cart: () => makeDeco('cart'),
  well: () => makeDeco('well'),
  birdhouse: () => makeDeco('birdhouse'),
  rosebush: () => makeDeco('rosebush'),
  wheelbarrow: () => makeDeco('wheelbarrow'),
  pond: () => makeDeco('pond'),
  swing: () => makeDeco('swing'),
  gnome: () => makeDeco('gnome'),
  pumpkins: () => makeDeco('pumpkins'),
  sprinkler: () => makeDeco('sprinkler'),
  sprinkler_on: () => { const g = makeDeco('sprinkler'); g.userData.state.on = true; return g; },
  gazebo: () => makeDeco('gazebo'),
  fountain: () => makeDeco('fountain'),
  windwheel: () => makeDeco('windwheel'),
  tractor: () => makeDeco('tractor'),
  statue: () => makeDeco('statue'),
  windmill: () => makeDeco('windmill'),
};
