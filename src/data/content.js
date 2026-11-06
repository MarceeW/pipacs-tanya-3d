// Static game content. Every balancing number and every key that models/logic share lives here.
// `look` fields are art hints for the procedural 3D models (see src/three/models/*).

export const SAVE_KEY = 'pipacs-tanya-3d-save-v2';
export const MAP = 56;                 // world is MAP x MAP tiles, 1 tile = 1 world unit
export const MAX_LEVEL = 80;
export const DAY_LENGTH = 24 * 60;     // real seconds per in-game day
export const SEASON_DAYS = 7;          // in-game days per season
export const PLOW_COST = 5;

export const SEASONS = [
  { id: 'spring', name: 'Tavasz', icon: 'spring' },
  { id: 'summer', name: 'Nyár',   icon: 'summer' },
  { id: 'autumn', name: 'Ősz',    icon: 'autumn' },
  { id: 'winter', name: 'Tél',    icon: 'winter' },
];
export const OUT_OF_SEASON_SLOWDOWN = 1.6;

const ALL = ['spring', 'summer', 'autumn', 'winter'];

// ------------------------------------------------------------------ crops
// time: seconds, yield: items per harvest, look: model hint
export const CROPS = {
  wheat:      { name: 'Búza',         level: 1,  seed: 2,  time: 30,   yield: 2, sell: 3,   xp: 1,  seasons: ALL,                  look: { type: 'grain', leaf: '#8cc63f', fruit: '#f2c14e' } },
  carrot:     { name: 'Sárgarépa',    level: 1,  seed: 4,  time: 60,   yield: 2, sell: 5,   xp: 2,  seasons: ['spring', 'autumn'], look: { type: 'root', leaf: '#4caf50', fruit: '#f57c00' } },
  corn:       { name: 'Kukorica',     level: 2,  seed: 6,  time: 120,  yield: 2, sell: 8,   xp: 3,  seasons: ['summer', 'autumn'], look: { type: 'tall', leaf: '#6fb33a', fruit: '#ffd54f' } },
  soy:        { name: 'Szója',        level: 3,  seed: 8,  time: 180,  yield: 2, sell: 9,   xp: 3,  seasons: ['summer'],           look: { type: 'bush', leaf: '#7cb342', fruit: '#c5d86d' } },
  tomato:     { name: 'Paradicsom',   level: 4,  seed: 10, time: 240,  yield: 3, sell: 7,   xp: 4,  seasons: ['summer'],           look: { type: 'staked', leaf: '#43a047', fruit: '#e53935' } },
  sugarcane:  { name: 'Cukornád',     level: 5,  seed: 12, time: 300,  yield: 2, sell: 12,  xp: 5,  seasons: ['summer', 'autumn'], look: { type: 'cane', leaf: '#9ccc65', fruit: '#c0d860' } },
  potato:     { name: 'Burgonya',     level: 6,  seed: 16, time: 480,  yield: 3, sell: 10,  xp: 6,  seasons: ['spring', 'autumn'], look: { type: 'root', leaf: '#5d9b45', fruit: '#c8a165' } },
  sunflower:  { name: 'Napraforgó',   level: 7,  seed: 14, time: 360,  yield: 2, sell: 13,  xp: 5,  seasons: ['summer'],           look: { type: 'flower', leaf: '#5a9e34', fruit: '#ffc107' } },
  strawberry: { name: 'Eper',         level: 8,  seed: 20, time: 600,  yield: 3, sell: 12,  xp: 7,  seasons: ['spring'],           look: { type: 'berry', leaf: '#43a047', fruit: '#e8304a' } },
  cotton:     { name: 'Gyapot',       level: 9,  seed: 24, time: 720,  yield: 2, sell: 21,  xp: 8,  seasons: ['summer'],           look: { type: 'puff', leaf: '#6d8f3c', fruit: '#ffffff' } },
  cabbage:    { name: 'Káposzta',     level: 10, seed: 28, time: 900,  yield: 2, sell: 24,  xp: 9,  seasons: ['autumn', 'winter'], look: { type: 'head', leaf: '#7cb342', fruit: '#c5e1a5' } },
  pumpkin:    { name: 'Sütőtök',      level: 11, seed: 35, time: 1200, yield: 1, sell: 65,  xp: 11, seasons: ['autumn'],           look: { type: 'vine', leaf: '#558b2f', fruit: '#f57f17' } },
  pepper:     { name: 'Paprika',      level: 12, seed: 32, time: 1500, yield: 3, sell: 21,  xp: 12, seasons: ['summer'],           look: { type: 'bush', leaf: '#2e7d32', fruit: '#d32f2f' } },
  onion:      { name: 'Hagyma',       level: 13, seed: 20, time: 1100, yield: 3, sell: 16,  xp: 10, seasons: ['spring', 'winter'], look: { type: 'bulb', leaf: '#689f38', fruit: '#d7a86e' } },
  lavender:   { name: 'Levendula',    level: 14, seed: 40, time: 1800, yield: 2, sell: 42,  xp: 14, seasons: ['spring', 'summer'], look: { type: 'spike', leaf: '#7b9e6b', fruit: '#9575cd' } },
  garlic:     { name: 'Fokhagyma',    level: 15, seed: 30, time: 1600, yield: 3, sell: 22,  xp: 13, seasons: ['autumn', 'winter'], look: { type: 'bulb', leaf: '#8bc34a', fruit: '#f5f0e6' } },
  watermelon: { name: 'Görögdinnye',  level: 16, seed: 55, time: 2700, yield: 1, sell: 110, xp: 18, seasons: ['summer'],           look: { type: 'vine', leaf: '#4e8a2e', fruit: '#2e7d32', striped: true } },
  kale:       { name: 'Fodros kel',   level: 17, seed: 30, time: 2000, yield: 2, sell: 40,  xp: 16, seasons: ['winter'],           look: { type: 'head', leaf: '#33691e', fruit: '#558b2f', curly: true } },
  blueberry:  { name: 'Áfonya',       level: 18, seed: 60, time: 3600, yield: 3, sell: 45,  xp: 22, seasons: ['summer'],           look: { type: 'bush', leaf: '#386641', fruit: '#3f51b5' } },
  rice:       { name: 'Rizs',         level: 20, seed: 40, time: 2400, yield: 3, sell: 30,  xp: 18, seasons: ['summer'],           look: { type: 'grain', leaf: '#9ccc65', fruit: '#f0e6c8' } },
  coffee:     { name: 'Kávé',         level: 22, seed: 70, time: 4200, yield: 3, sell: 55,  xp: 25, seasons: ['summer'],           look: { type: 'bush', leaf: '#2e5e2a', fruit: '#8e2a1a' } },
  rose:       { name: 'Rózsa',        level: 24, seed: 80, time: 5400, yield: 2, sell: 90,  xp: 30, seasons: ['spring', 'summer'], look: { type: 'flower', leaf: '#2e7d32', fruit: '#e91e63', rose: true } },
};

// ------------------------------------------------------------------ fruit trees (2x2 footprint)
export const TREES = {
  apple:  { name: 'Almafa',       item: 'apple',  level: 7,  cost: 180,  time: 1800, yield: 3, look: { leaf: '#4caf50', fruit: '#e53935', blossom: '#ffffff' } },
  cherry: { name: 'Cseresznyefa', item: 'cherry', level: 12, cost: 400,  time: 2700, yield: 4, look: { leaf: '#43a047', fruit: '#b71c1c', blossom: '#f8bbd0' } },
  pear:   { name: 'Körtefa',      item: 'pear',   level: 17, cost: 700,  time: 3600, yield: 4, look: { leaf: '#689f38', fruit: '#d4c34a', blossom: '#fffde7' } },
  plum:   { name: 'Szilvafa',     item: 'plum',   level: 20, cost: 900,  time: 4200, yield: 4, look: { leaf: '#558b2f', fruit: '#5e35b1', blossom: '#ffffff' } },
  peach:  { name: 'Őszibarackfa', item: 'peach',  level: 23, cost: 1200, time: 4800, yield: 4, look: { leaf: '#7cb342', fruit: '#ffab76', blossom: '#f48fb1' } },
  walnut: { name: 'Diófa',        item: 'walnut', level: 26, cost: 1500, time: 6000, yield: 5, look: { leaf: '#33691e', fruit: '#8d6e63', blossom: '#dcedc8' } },
};
export const TREE_SIZE = 2;

// ------------------------------------------------------------------ animals live inside housing buildings
export const ANIMALS = {
  chicken: { name: 'Tyúk',   level: 2,  cost: 50,   housing: 'coop',      feed: 'chickenfeed', time: 300,  item: 'egg' },
  cow:     { name: 'Tehén',  level: 5,  cost: 250,  housing: 'cowshed',   feed: 'cowfeed',     time: 900,  item: 'milk' },
  sheep:   { name: 'Juh',    level: 8,  cost: 400,  housing: 'sheepfold', feed: 'sheepfeed',   time: 1500, item: 'wool' },
  bee:     { name: 'Méhcsalád', level: 10, cost: 500, housing: 'apiary',  feed: 'sunflower',   time: 2400, item: 'honey' },
  pig:     { name: 'Malac',  level: 11, cost: 650,  housing: 'pigsty',    feed: 'pigfeed',     time: 1800, item: 'truffle' },
  goat:    { name: 'Kecske', level: 14, cost: 900,  housing: 'goatpen',   feed: 'goatfeed',    time: 1500, item: 'goatmilk' },
  duck:    { name: 'Kacsa',  level: 17, cost: 1100, housing: 'duckhouse', feed: 'duckfeed',    time: 1200, item: 'feather' },
};

// Housing: 4x4 fenced yard with a shelter. capacity = 3 * level (level 1..3).
export const HOUSINGS = {
  coop:      { name: 'Tyúkól',          animal: 'chicken', level: 2,  cost: 150,  size: 4, max: 3 },
  cowshed:   { name: 'Tehénistálló',    animal: 'cow',     level: 5,  cost: 600,  size: 4, max: 3 },
  sheepfold: { name: 'Juhakol',         animal: 'sheep',   level: 8,  cost: 1000, size: 4, max: 2 },
  apiary:    { name: 'Méhes',           animal: 'bee',     level: 10, cost: 1100, size: 4, max: 2 },
  pigsty:    { name: 'Disznóól',        animal: 'pig',     level: 11, cost: 1400, size: 4, max: 2 },
  goatpen:   { name: 'Kecskekarám',     animal: 'goat',    level: 14, cost: 1800, size: 4, max: 2 },
  duckhouse: { name: 'Kacsaúsztató',    animal: 'duck',    level: 17, cost: 2200, size: 4, max: 2 },
};
export const HOUSING_MAX_LEVEL = 3;
export const housingCapacity = (lvl) => 3 * lvl;
export const housingUpgradeCost = (h, lvl) => ({ coins: Math.round(h.cost * 0.8 * lvl), plank: 2 * lvl, brick: 1 * lvl });

// ------------------------------------------------------------------ production buildings (3x3 unless noted)
export const BUILDINGS = {
  feedmill:  { name: 'Takarmánykeverő', level: 2,  cost: 200,  size: 3, desc: 'Takarmányt kever az állatoknak.' },
  mill:      { name: 'Szélmalom',       level: 3,  cost: 300,  size: 3, desc: 'Gabonából lisztet őröl.' },
  bakery:    { name: 'Pékség',          level: 4,  cost: 600,  size: 3, desc: 'Friss kenyér és pékáru.' },
  workshop:  { name: 'Műhely',          level: 5,  cost: 500,  size: 3, desc: 'Deszka, tégla és szerszámok.' },
  sugarmill: { name: 'Cukorgyár',       level: 6,  cost: 900,  size: 3, desc: 'Cukornádból cukor és szirup.' },
  dairy:     { name: 'Tejüzem',         level: 7,  cost: 1000, size: 3, desc: 'Vaj, tejszín és sajtok.' },
  loom:      { name: 'Szövöde',         level: 9,  cost: 1400, size: 3, desc: 'Fonal és vászon.' },
  press:     { name: 'Olajprés',        level: 10, cost: 1800, size: 3, desc: 'Olajok és gyümölcslevek.' },
  cannery:   { name: 'Befőzde',         level: 11, cost: 2200, size: 3, desc: 'Lekvárok, befőttek, lecsó.' },
  greenhouse:{ name: 'Üvegház',         level: 12, cost: 3000, size: 4, desc: 'Évszaktól függetlenül nevel növényeket.' },
  pastry:    { name: 'Cukrászda',       level: 13, cost: 2800, size: 3, desc: 'Torták, sütemények, fagyi.' },
  tailor:    { name: 'Varroda',         level: 15, cost: 3400, size: 3, desc: 'Pulóver, sál, párna, dunyha.' },
  bistro:    { name: 'Bisztró',         level: 16, cost: 4000, size: 3, desc: 'Gulyás, halászlé, lángos.' },
  chandler:  { name: 'Gyertyaöntő',     level: 19, cost: 4800, size: 3, desc: 'Méhviasz gyertyák.' },
  cafe:      { name: 'Kávézó',          level: 22, cost: 6000, size: 3, desc: 'Kávékülönlegességek.' },
  perfumery: { name: 'Illatszerész',    level: 24, cost: 7500, size: 3, desc: 'Szappan és parfüm.' },
};
export const BUILDING_MAX_LEVEL = 4;
export const buildingSlots = (lvl) => 1 + lvl;                 // 2..5 queue slots
export const buildingSpeed = (lvl) => 1 - 0.08 * (lvl - 1);   // time multiplier
export const buildingUpgradeCost = (b, lvl) => ({ coins: Math.round(b.cost * 0.7 * lvl), plank: 2 + 2 * lvl, brick: 1 + 2 * lvl });

// in: ingredients, qty: items produced (default 1), coins: extra coin cost.
// sell/xp of products are derived from inputs + time (see ITEMS below).
export const RECIPES = {
  // feed mill
  chickenfeed:  { name: 'Csirketáp',        building: 'feedmill', level: 2,  time: 90,   in: { wheat: 2, corn: 1 }, qty: 3 },
  cowfeed:      { name: 'Marhatáp',         building: 'feedmill', level: 5,  time: 180,  in: { corn: 2, soy: 1 }, qty: 3 },
  sheepfeed:    { name: 'Juhtáp',           building: 'feedmill', level: 8,  time: 240,  in: { wheat: 2, soy: 2 }, qty: 3 },
  pigfeed:      { name: 'Malactáp',         building: 'feedmill', level: 11, time: 300,  in: { carrot: 2, soy: 1 }, qty: 3 },
  goatfeed:     { name: 'Kecsketáp',        building: 'feedmill', level: 14, time: 300,  in: { cabbage: 1, wheat: 2 }, qty: 3 },
  duckfeed:     { name: 'Kacsatáp',         building: 'feedmill', level: 17, time: 300,  in: { corn: 1, wheat: 2, soy: 1 }, qty: 3 },
  // mill
  flour:        { name: 'Liszt',            building: 'mill',     level: 3,  time: 90,   in: { wheat: 3 } },
  cornflour:    { name: 'Kukoricaliszt',    building: 'mill',     level: 4,  time: 150,  in: { corn: 2 } },
  riceflour:    { name: 'Rizsliszt',        building: 'mill',     level: 20, time: 300,  in: { rice: 2 } },
  // bakery
  bread:        { name: 'Kenyér',           building: 'bakery',   level: 4,  time: 240,  in: { flour: 2, egg: 1 } },
  cornbread:    { name: 'Kukoricás lepény', building: 'bakery',   level: 6,  time: 360,  in: { cornflour: 2, milk: 1 } },
  cookie:       { name: 'Keksz',            building: 'bakery',   level: 8,  time: 300,  in: { flour: 1, sugar: 1, egg: 1 } },
  pie:          { name: 'Tökös pite',       building: 'bakery',   level: 11, time: 600,  in: { flour: 1, pumpkin: 1, egg: 2 } },
  croissant:    { name: 'Kifli',            building: 'bakery',   level: 12, time: 480,  in: { flour: 2, butter: 1 } },
  garlicbread:  { name: 'Fokhagymás kenyér', building: 'bakery',  level: 16, time: 420,  in: { bread: 1, garlic: 2, butter: 1 } },
  // workshop
  plank:        { name: 'Deszka',           building: 'workshop', level: 5,  time: 180,  in: { wood: 2 } },
  brick:        { name: 'Tégla',            building: 'workshop', level: 5,  time: 240,  in: { stone: 2 } },
  axe:          { name: 'Fejsze',           building: 'workshop', level: 5,  time: 300,  in: { plank: 1, stone: 1 } },
  pickaxe:      { name: 'Csákány',          building: 'workshop', level: 5,  time: 300,  in: { plank: 1, stone: 2 } },
  // sugar mill
  sugar:        { name: 'Cukor',            building: 'sugarmill', level: 6, time: 240,  in: { sugarcane: 2 } },
  syrup:        { name: 'Szirup',           building: 'sugarmill', level: 9, time: 480,  in: { sugarcane: 3 } },
  // dairy
  butter:       { name: 'Vaj',              building: 'dairy',    level: 7,  time: 300,  in: { milk: 2 } },
  cream:        { name: 'Tejszín',          building: 'dairy',    level: 8,  time: 240,  in: { milk: 2 } },
  cheese:       { name: 'Sajt',             building: 'dairy',    level: 9,  time: 600,  in: { milk: 3 } },
  goatcheese:   { name: 'Kecskesajt',       building: 'dairy',    level: 14, time: 900,  in: { goatmilk: 2 } },
  // loom
  fabric:       { name: 'Vászon',           building: 'loom',     level: 9,  time: 600,  in: { cotton: 3 } },
  yarn:         { name: 'Fonal',            building: 'loom',     level: 9,  time: 480,  in: { wool: 2 } },
  // press
  sunoil:       { name: 'Napraforgóolaj',   building: 'press',    level: 10, time: 480,  in: { sunflower: 3 } },
  applejuice:   { name: 'Almalé',           building: 'press',    level: 10, time: 600,  in: { apple: 3 } },
  lavenderoil:  { name: 'Levendulaolaj',    building: 'press',    level: 14, time: 900,  in: { lavender: 2 } },
  peachjuice:   { name: 'Barackié',         building: 'press',    level: 23, time: 900,  in: { peach: 3 } },
  // cannery
  ketchup:      { name: 'Ketchup',          building: 'cannery',  level: 11, time: 420,  in: { tomato: 4, sugar: 1 } },
  strawberryjam:{ name: 'Eperlekvár',       building: 'cannery',  level: 11, time: 600,  in: { strawberry: 3, sugar: 1 } },
  cherrycompote:{ name: 'Cseresznyebefőtt', building: 'cannery',  level: 12, time: 900,  in: { cherry: 4, sugar: 1 } },
  lecso:        { name: 'Lecsó',            building: 'cannery',  level: 13, time: 600,  in: { tomato: 2, pepper: 2, onion: 1 } },
  blueberryjam: { name: 'Áfonyalekvár',     building: 'cannery',  level: 18, time: 900,  in: { blueberry: 3, sugar: 1 } },
  plumjam:      { name: 'Szilvalekvár',     building: 'cannery',  level: 20, time: 900,  in: { plum: 3, sugar: 1 } },
  // greenhouse: grows crops regardless of season, paid with coins
  gh_tomato:    { name: 'Üvegházi paradicsom', building: 'greenhouse', level: 12, time: 600,  in: {}, coins: 40,  out: 'tomato',     qty: 6 },
  gh_strawberry:{ name: 'Üvegházi eper',    building: 'greenhouse', level: 12, time: 900,  in: {}, coins: 70,  out: 'strawberry', qty: 6 },
  gh_pepper:    { name: 'Üvegházi paprika', building: 'greenhouse', level: 13, time: 1200, in: {}, coins: 90,  out: 'pepper',     qty: 6 },
  gh_cotton:    { name: 'Üvegházi gyapot',  building: 'greenhouse', level: 14, time: 1200, in: {}, coins: 100, out: 'cotton',     qty: 4 },
  gh_sunflower: { name: 'Üvegházi napraforgó', building: 'greenhouse', level: 15, time: 900, in: {}, coins: 60, out: 'sunflower', qty: 5 },
  gh_coffee:    { name: 'Üvegházi kávé',    building: 'greenhouse', level: 22, time: 2400, in: {}, coins: 220, out: 'coffee',     qty: 5 },
  // pastry
  cake:         { name: 'Epertorta',        building: 'pastry',   level: 13, time: 1200, in: { flour: 2, strawberry: 3, egg: 2, cream: 1 } },
  honeycake:    { name: 'Mézes sütemény',   building: 'pastry',   level: 13, time: 900,  in: { flour: 2, honey: 1, egg: 1 } },
  pancake:      { name: 'Palacsinta',       building: 'pastry',   level: 14, time: 600,  in: { flour: 1, milk: 1, egg: 1, strawberryjam: 1 } },
  icecream:     { name: 'Fagylalt',         building: 'pastry',   level: 15, time: 600,  in: { cream: 1, sugar: 1, strawberry: 1 } },
  bejgli:       { name: 'Diós bejgli',      building: 'pastry',   level: 26, time: 1500, in: { flour: 2, walnut: 3, sugar: 1 } },
  // tailor
  scarf:        { name: 'Sál',              building: 'tailor',   level: 15, time: 900,  in: { yarn: 2 } },
  sweater:      { name: 'Pulóver',          building: 'tailor',   level: 15, time: 1500, in: { yarn: 2, fabric: 1 } },
  pillow:       { name: 'Párna',            building: 'tailor',   level: 17, time: 1200, in: { feather: 3, fabric: 1 } },
  quilt:        { name: 'Dunyha',           building: 'tailor',   level: 19, time: 2400, in: { feather: 4, fabric: 2 } },
  // bistro
  omelette:     { name: 'Omlett',           building: 'bistro',   level: 16, time: 420,  in: { egg: 3, pepper: 1 } },
  goulash:      { name: 'Gulyásleves',      building: 'bistro',   level: 16, time: 900,  in: { potato: 2, onion: 1, pepper: 1, carrot: 1 } },
  fishsoup:     { name: 'Halászlé',         building: 'bistro',   level: 17, time: 900,  in: { carp: 2, onion: 1, pepper: 1 } },
  langos:       { name: 'Lángos',           building: 'bistro',   level: 18, time: 600,  in: { flour: 1, potato: 1, sunoil: 1, cheese: 1 } },
  ricepudding:  { name: 'Tejberizs',        building: 'bistro',   level: 20, time: 600,  in: { rice: 2, milk: 1, sugar: 1 } },
  grilledfish:  { name: 'Grillezett pisztráng', building: 'bistro', level: 21, time: 720, in: { trout: 1, garlic: 1, sunoil: 1 } },
  // chandler
  candle:       { name: 'Méhviasz gyertya', building: 'chandler', level: 19, time: 900,  in: { honey: 2 } },
  lavendercandle:{ name: 'Levendulás gyertya', building: 'chandler', level: 19, time: 1200, in: { honey: 1, lavenderoil: 1 } },
  // cafe
  espresso:     { name: 'Eszpresszó',       building: 'cafe',     level: 22, time: 300,  in: { coffee: 2 } },
  cappuccino:   { name: 'Cappuccino',       building: 'cafe',     level: 22, time: 420,  in: { coffee: 2, milk: 1, sugar: 1 } },
  coffeecake:   { name: 'Kávés sütemény',   building: 'cafe',     level: 23, time: 900,  in: { coffee: 1, flour: 1, egg: 1, sugar: 1 } },
  // perfumery
  soap:         { name: 'Levendulaszappan', building: 'perfumery', level: 24, time: 900,  in: { sunoil: 1, lavenderoil: 1 } },
  perfume:      { name: 'Rózsaparfüm',      building: 'perfumery', level: 24, time: 1800, in: { rose: 3, lavenderoil: 1 } },
};

// ------------------------------------------------------------------ decorations
// size: footprint (default 1), charm: beauty points, gems: premium price, walk: pet that roams
export const DECOS = {
  fence:      { name: 'Fakerítés',        level: 1,  cost: 10,   charm: 1, connect: true },
  picket:     { name: 'Fehér léckerítés', level: 4,  cost: 18,   charm: 2, connect: true },
  hedge:      { name: 'Sövény',           level: 6,  cost: 30,   charm: 2, connect: true },
  path_dirt:  { name: 'Földút',           level: 1,  cost: 5,    charm: 0, flat: true },
  path_stone: { name: 'Kőút',             level: 3,  cost: 15,   charm: 1, flat: true },
  path_brick: { name: 'Téglaút',          level: 9,  cost: 25,   charm: 1, flat: true },
  bush:       { name: 'Bokor',            level: 1,  cost: 25,   charm: 1 },
  flowerbed:  { name: 'Virágágyás',       level: 1,  cost: 40,   charm: 2 },
  tulips:     { name: 'Tulipánok',        level: 3,  cost: 50,   charm: 3 },
  haybale:    { name: 'Szalmabála',       level: 2,  cost: 30,   charm: 1 },
  scarecrow:  { name: 'Madárijesztő',     level: 2,  cost: 90,   charm: 3 },
  barrel:     { name: 'Hordó',            level: 3,  cost: 40,   charm: 1 },
  pine:       { name: 'Fenyőfa',          level: 3,  cost: 60,   charm: 2 },
  oak:        { name: 'Tölgyfa',          level: 5,  cost: 110,  charm: 4, size: 2 },
  birch:      { name: 'Nyírfa',           level: 5,  cost: 90,   charm: 3 },
  bench:      { name: 'Pad',              level: 3,  cost: 80,   charm: 3 },
  lamp:       { name: 'Lámpás',           level: 4,  cost: 120,  charm: 4, light: true },
  mailbox:    { name: 'Postaláda',        level: 4,  cost: 70,   charm: 2 },
  cart:       { name: 'Szekér',           level: 6,  cost: 220,  charm: 5, size: 2 },
  well:       { name: 'Kút',              level: 6,  cost: 350,  charm: 7 },
  birdhouse:  { name: 'Madárodú',         level: 7,  cost: 140,  charm: 4 },
  rosebush:   { name: 'Rózsabokor',       level: 7,  cost: 150,  charm: 5 },
  wheelbarrow:{ name: 'Talicska',         level: 8,  cost: 120,  charm: 3 },
  pond:       { name: 'Tavacska',         level: 8,  cost: 700,  charm: 12, size: 2 },
  swing:      { name: 'Hinta',            level: 9,  cost: 300,  charm: 8 },
  dog:        { name: 'Bodri, a kutya',   level: 9,  cost: 800,  charm: 10, walk: true, max: 1, desc: 'Naponta kiás valami hasznosat.' },
  gnome:      { name: 'Kerti törpe',      level: 10, gems: 4,    charm: 12 },
  pumpkins:   { name: 'Tökhalom',         level: 11, cost: 160,  charm: 5 },
  sprinkler:  { name: 'Öntözőszóró',      level: 12, cost: 600,  charm: 0, desc: 'Automatikusan öntözi a körülötte lévő 8 földet.' },
  cat:        { name: 'Cirmi, a macska',  level: 13, cost: 1200, charm: 12, walk: true, max: 1, desc: 'Távol tartja a varjakat: +5% termés.' },
  gazebo:     { name: 'Lugas',            level: 14, cost: 1800, charm: 20, size: 2 },
  fountain:   { name: 'Szökőkút',         level: 15, cost: 2500, charm: 25, size: 2 },
  windwheel:  { name: 'Szélkerék',        level: 18, cost: 1200, charm: 14 },
  tractor:    { name: 'Traktor',          level: 20, gems: 15,   charm: 30, size: 2 },
  statue:     { name: 'Aranyszobor',      level: 22, gems: 12,   charm: 40 },
  windmill:   { name: 'Díszszélmalom',    level: 25, gems: 20,   charm: 50, size: 2 },
};

// ------------------------------------------------------------------ obstacles (clutter on the farm)
// tool: inventory item consumed, drops: [item, min, max]
export const OBSTACLES = {
  weeds:   { name: 'Gaz',          size: 1, tool: null,      coins: 0,  xp: 1, drops: [] },
  bush:    { name: 'Vadbokor',     size: 1, tool: null,      coins: 15, xp: 2, drops: [['wood', 0, 1]] },
  stump:   { name: 'Fatönk',       size: 1, tool: 'axe',     coins: 0,  xp: 4, drops: [['wood', 2, 3]] },
  log:     { name: 'Kidőlt rönk',  size: 2, tool: 'axe',     coins: 0,  xp: 6, drops: [['wood', 3, 5]] },
  rock:    { name: 'Kő',           size: 1, tool: 'pickaxe', coins: 0,  xp: 4, drops: [['stone', 2, 3]] },
  boulder: { name: 'Szikla',       size: 2, tool: 'pickaxe', coins: 0,  xp: 8, drops: [['stone', 4, 6]], gemChance: 0.15 },
};

// ------------------------------------------------------------------ fixed landmarks (cannot be bought/sold)
export const FIXED = {
  house:   { name: 'Parasztház',          size: 3 },
  barn:    { name: 'Csűr (Raktár)',       size: 3 },
  board:   { name: 'Megrendelőtábla',     size: 2 },
  truck:   { name: 'Szállítóautó',        size: 3 },
  market:  { name: 'Piaci stand',         size: 3 },
  dock:    { name: 'Kikötő',              size: 3 },
  pier:    { name: 'Horgászstég',         size: 2 },
};

// ------------------------------------------------------------------ fish (fishing minigame)
// difficulty 1..5, seasons/time: when they bite more (night = 20:00-05:00)
export const FISH = {
  boot:     { name: 'Régi csizma',   sell: 1,   xp: 1,  difficulty: 1, weight: 6,  junk: true },
  perch:    { name: 'Sügér',         sell: 14,  xp: 4,  difficulty: 1, weight: 30 },
  carp:     { name: 'Ponty',         sell: 22,  xp: 6,  difficulty: 2, weight: 26 },
  trout:    { name: 'Pisztráng',     sell: 35,  xp: 9,  difficulty: 3, weight: 16, seasons: ['spring', 'autumn'] },
  pike:     { name: 'Csuka',         sell: 48,  xp: 12, difficulty: 4, weight: 10, seasons: ['autumn', 'winter'] },
  catfish:  { name: 'Harcsa',        sell: 65,  xp: 15, difficulty: 4, weight: 8, night: true },
  goldfish: { name: 'Aranyhal',      sell: 250, xp: 40, difficulty: 5, weight: 1.5 },
};
export const FISHING_LEVEL = 3;

// ------------------------------------------------------------------ farm expansions (rectangles in tile coords)
export const EXPANSIONS = [
  { x0: 18, y0: 16, x1: 34, y1: 32 },
  { x0: 14, y0: 16, x1: 34, y1: 32, level: 4,  coins: 800,   plank: 2,  brick: 0 },
  { x0: 14, y0: 12, x1: 34, y1: 32, level: 7,  coins: 2000,  plank: 4,  brick: 2 },
  { x0: 14, y0: 12, x1: 38, y1: 32, level: 10, coins: 4000,  plank: 6,  brick: 4 },
  { x0: 14, y0: 12, x1: 38, y1: 36, level: 13, coins: 8000,  plank: 8,  brick: 6 },
  { x0: 10, y0: 12, x1: 38, y1: 36, level: 17, coins: 15000, plank: 10, brick: 8 },
  { x0: 10, y0: 8,  x1: 38, y1: 36, level: 21, coins: 25000, plank: 12, brick: 10 },
  { x0: 10, y0: 8,  x1: 42, y1: 36, level: 26, coins: 40000, plank: 15, brick: 12 },
  { x0: 10, y0: 8,  x1: 42, y1: 40, level: 32, coins: 60000, plank: 18, brick: 15 },
  { x0: 8,  y0: 6,  x1: 44, y1: 42, level: 38, coins: 90000, plank: 20, brick: 20 },
];

// World layout outside the farm (tile coords)
export const WORLD = {
  road: { x0: 46, x1: 48 },              // vertical road, full height
  river: { y0: 47, y1: 53 },             // horizontal river, full width
  pond: { x0: 1, y0: 19, x1: 7, y1: 28 },  // fishing pond (west)
  forestDepth: 5,                         // trees along north + west edge
  fixed: [
    { key: 'board',  x: 49, y: 14 },
    { key: 'truck',  x: 49, y: 18 },
    { key: 'market', x: 49, y: 24 },
    { key: 'dock',   x: 36, y: 44 },
    { key: 'pier',   x: 6,  y: 22 },
  ],
};

// ------------------------------------------------------------------ storage
export const STORAGE_BASE = 80;
export const STORAGE_STEP = 40;
export const storageUpgradeCost = (n) => ({ coins: Math.round(200 * Math.pow(1.5, n)), plank: 2 + n * 2, brick: 1 + n * 2 });

// ------------------------------------------------------------------ market stall / barge
export const MARKET_SLOTS = 6;
export const BARGE_LEVEL = 12;
export const BARGE_STAY = 4 * 3600;     // seconds the barge waits at the dock
export const BARGE_AWAY = 45 * 60;      // seconds until next barge
export const VISITOR_LEVEL = 4;
export const MARKET_LEVEL = 3;

// ------------------------------------------------------------------ item registry
const ANIMAL_ITEMS = {
  egg:      { name: 'Tojás',      sell: 12, xp: 3 },
  milk:     { name: 'Tej',        sell: 32, xp: 8 },
  wool:     { name: 'Gyapjú',     sell: 38, xp: 10 },
  honey:    { name: 'Méz',        sell: 62, xp: 14 },
  truffle:  { name: 'Szarvasgomba', sell: 60, xp: 14 },
  goatmilk: { name: 'Kecsketej',  sell: 55, xp: 13 },
  feather:  { name: 'Toll',       sell: 45, xp: 12 },
};
const FRUIT_ITEMS = {
  apple:  { name: 'Alma',        sell: 10, xp: 5 },
  cherry: { name: 'Cseresznye',  sell: 14, xp: 8 },
  pear:   { name: 'Körte',       sell: 20, xp: 10 },
  plum:   { name: 'Szilva',      sell: 24, xp: 11 },
  peach:  { name: 'Őszibarack',  sell: 28, xp: 12 },
  walnut: { name: 'Dió',         sell: 30, xp: 13 },
};
const MATERIAL_ITEMS = {
  wood:    { name: 'Fa',      sell: 6,  xp: 1, cat: 'material' },
  stone:   { name: 'Kő',      sell: 6,  xp: 1, cat: 'material' },
  bait:    { name: 'Csali',   sell: 1,  xp: 0, cat: 'material', buy: 6 },
};

// Art hints for item icons (models in src/three/models/items.js)
export const ITEM_LOOK = {
  // feeds: sacks with an animal badge colour
  chickenfeed: { shape: 'feedsack', color: '#ffe082' }, cowfeed: { shape: 'feedsack', color: '#a5d6a7' },
  sheepfeed: { shape: 'feedsack', color: '#e0e0e0' }, pigfeed: { shape: 'feedsack', color: '#f8bbd0' },
  goatfeed: { shape: 'feedsack', color: '#bcaaa4' }, duckfeed: { shape: 'feedsack', color: '#90caf9' },
  flour: { shape: 'sack', color: '#f7f2e8' }, cornflour: { shape: 'sack', color: '#ffe082' }, riceflour: { shape: 'sack', color: '#fffde7' },
  sugar: { shape: 'sack', color: '#ffffff' }, syrup: { shape: 'bottle', color: '#c77d1a' },
  bread: { shape: 'loaf', color: '#d8954a' }, cornbread: { shape: 'flatbread', color: '#f0c050' },
  cookie: { shape: 'cookies', color: '#c98a4b' }, pie: { shape: 'pie', color: '#f57f17' },
  croissant: { shape: 'kifli', color: '#e0a050' }, garlicbread: { shape: 'loaf', color: '#e8b060', topping: '#7cb342' },
  plank: { shape: 'planks', color: '#c8955a' }, brick: { shape: 'bricks', color: '#c0583a' },
  axe: { shape: 'axe' }, pickaxe: { shape: 'pickaxe' }, wood: { shape: 'logs', color: '#8d6e63' }, stone: { shape: 'stones', color: '#9e9e9e' },
  bait: { shape: 'baitcan' },
  butter: { shape: 'butter', color: '#ffe57f' }, cream: { shape: 'jug', color: '#fffdf5' },
  cheese: { shape: 'cheese', color: '#ffca28' }, goatcheese: { shape: 'cheesewheel', color: '#fff8e1' },
  fabric: { shape: 'cloth', color: '#efe6d2' }, yarn: { shape: 'yarn', color: '#ef5350' },
  sunoil: { shape: 'bottle', color: '#ffca28' }, applejuice: { shape: 'bottle', color: '#ffb74d' },
  lavenderoil: { shape: 'smallbottle', color: '#b39ddb' }, peachjuice: { shape: 'bottle', color: '#ffab76' },
  ketchup: { shape: 'bottle', color: '#d32f2f' }, strawberryjam: { shape: 'jar', color: '#d81b60' },
  cherrycompote: { shape: 'jar', color: '#8e0f2a' }, lecso: { shape: 'jar', color: '#e65100' },
  blueberryjam: { shape: 'jar', color: '#3949ab' }, plumjam: { shape: 'jar', color: '#4a148c' },
  cake: { shape: 'cake', color: '#f8bbd0', topping: '#e8304a' }, honeycake: { shape: 'cakeslice', color: '#d4a04a' },
  pancake: { shape: 'pancakes', color: '#f0c070' }, icecream: { shape: 'icecream', color: '#f48fb1' },
  bejgli: { shape: 'roll', color: '#b9783c' },
  scarf: { shape: 'scarf', color: '#e53935' }, sweater: { shape: 'sweater', color: '#5c6bc0' },
  pillow: { shape: 'pillow', color: '#fafafa' }, quilt: { shape: 'quilt', color: '#e57373' },
  omelette: { shape: 'plate', color: '#ffd54f' }, goulash: { shape: 'pot', color: '#bf360c' },
  fishsoup: { shape: 'pot', color: '#e53935' }, langos: { shape: 'plate', color: '#e0a050', topping: '#fff3c4' },
  ricepudding: { shape: 'bowl', color: '#fff8e1' }, grilledfish: { shape: 'plate', color: '#bcaaa4' },
  candle: { shape: 'candle', color: '#ffe082' }, lavendercandle: { shape: 'candle', color: '#b39ddb' },
  espresso: { shape: 'cup', color: '#4e342e' }, cappuccino: { shape: 'mug', color: '#d7b899' },
  coffeecake: { shape: 'cakeslice', color: '#795548' },
  soap: { shape: 'soap', color: '#ce93d8' }, perfume: { shape: 'perfume', color: '#f06292' },
};

export const ITEMS = {};
for (const [id, c] of Object.entries(CROPS)) ITEMS[id] = { name: c.name, sell: c.sell, xp: c.xp, cat: 'crop', level: c.level };
for (const [id, f] of Object.entries(FRUIT_ITEMS)) {
  const tree = Object.values(TREES).find((t) => t.item === id);
  ITEMS[id] = { ...f, cat: 'fruit', level: tree.level };
}
for (const [id, a] of Object.entries(ANIMAL_ITEMS)) {
  const animal = Object.values(ANIMALS).find((x) => x.item === id);
  ITEMS[id] = { ...a, cat: 'animal', level: animal.level };
}
for (const [id, m] of Object.entries(MATERIAL_ITEMS)) ITEMS[id] = { level: 1, ...m };
for (const [id, f] of Object.entries(FISH)) ITEMS[id] = { name: f.name, sell: f.sell, xp: f.xp, cat: 'fish', level: FISHING_LEVEL };

// Processed goods: value grows with ingredient value and production time.
// Recipes may use other products as ingredients, so resolve in dependency order.
for (const r of Object.values(RECIPES)) r.level = Math.max(r.level, BUILDINGS[r.building].level);
let pending = Object.entries(RECIPES).filter(([, r]) => !r.out);
for (let pass = 0; pending.length && pass < 10; pass++) {
  pending = pending.filter(([id, r]) => {
    if (!Object.keys(r.in).every((ing) => ITEMS[ing])) return true;
    let v = r.coins || 0, x = 0;
    for (const [ing, q] of Object.entries(r.in)) { v += ITEMS[ing].sell * q; x += ITEMS[ing].xp * q; }
    const qty = r.qty || 1;
    const cat = r.building === 'feedmill' ? 'feed' : ['axe', 'pickaxe', 'plank', 'brick'].includes(id) ? 'material' : 'goods';
    ITEMS[id] = { name: r.name, sell: Math.max(1, Math.round((v * 1.25 + r.time / 30) / qty)), xp: Math.max(1, Math.round((x * 0.5 + r.time / 60) / qty)), cat, level: r.level };
    return false;
  });
}
if (pending.length) throw new Error('Unresolvable recipes: ' + pending.map(([id]) => id).join(', '));
for (const id of Object.keys(ITEMS)) ITEMS[id].look = ITEM_LOOK[id] || null;

export const CATEGORY_NAMES = {
  crop: 'Termények', fruit: 'Gyümölcsök', animal: 'Állati termékek', feed: 'Takarmány',
  goods: 'Termékek', material: 'Anyagok', fish: 'Halak',
};

// Mastery: lifetime harvest counts per crop give stars.
export const MASTERY = [50, 250, 1000];
export const MASTERY_BONUS = [0, 0.15, 0.3, 0.5]; // chance of +1 yield
