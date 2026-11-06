// Buildings module: production buildings, animal housings, fixed landmarks, barge, truck and the
// farm-expansion sign. The models live in private helper files (buildings_*.js); this file is the
// public API + gallery catalog.
//
// Contracts:
//  * makeBuilding(key, level=1): footprint BUILDINGS[key].size, front +z.
//      userData.state = { working:false }  (set true while producing: smoke, sails, saws... animate)
//      userData.anim(t, dt)
//  * makeHousing(key, level=1): 4x4 fenced yard, shelter at the back (-z), gate + trough at the front.
//      userData.yard = { x0, z0, x1, z1 } local rectangle where animals may roam.
//      userData.state = { level }
//  * makeFixed(key): FIXED landmarks. 'truck' contains a child named 'truck' (the vehicle, faces +z).
//      'market': userData.setSlots(arr) – arr[i] CSS colour or null shows/hides goods pile in slot i (6).
//  * makeTruck(): the delivery truck alone (faces +z).
//  * makeBarge(): ~4 x 1.6 river barge along x; userData.setCrates(arr6 of booleans); gentle bobbing.
//  * makeExpansionSign(): 1x1 "for sale" signpost with a coin pictogram.
export { makeBuilding } from './buildings_prod.js';
export { makeHousing } from './buildings_farm.js';
export { makeFixed, makeTruck, makeBarge, makeExpansionSign } from './buildings_fixed.js';
import { PROD_CATALOG } from './buildings_prod.js';
import { FARM_CATALOG } from './buildings_farm.js';
import { FIXED_CATALOG } from './buildings_fixed.js';

export const CATALOG = { ...PROD_CATALOG, ...FARM_CATALOG, ...FIXED_CATALOG };
