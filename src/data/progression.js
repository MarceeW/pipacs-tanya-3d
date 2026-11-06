// Progression content: levels, quests, achievements, daily rewards and tasks, NPC names.

export const xpToNext = (lvl) => Math.round(18 * Math.pow(lvl, 1.8) + 12);

// Must match the order of VILLAGERS in src/three/models/animals.js
export const NPC_NAMES = [
  'Rózsi néni', 'Gazsi bácsi', 'Pék Panni', 'Kis Bence', 'Doktor Vilma', 'Halász Feri',
  'Tanító Teri', 'Molnár Miki', 'Postás Pista', 'Grófnő', 'Juhász Jani', 'Méhész Marcsi',
];

export const DAILY_LOGIN = [
  { coins: 60 }, { coins: 100 }, { coins: 150, gems: 1 }, { coins: 200, items: { bait: 5 } },
  { coins: 260, gems: 1 }, { coins: 340, items: { axe: 1, pickaxe: 1 } }, { coins: 600, gems: 3 },
];

// Story quest chain. `stat` quests count lifetime stats; `check` quests read live values.
// hint: what the UI should point at ({ ui: 'shop' } | { obj: 'fixed:board' } | { tool: 'plow' } …)
export const QUESTS = [
  { npc: 1, text: 'Arasd le az érett búzát!', stat: 'harvest', n: 3, reward: { coins: 30, xp: 5 }, hint: { obj: 'ripe' } },
  { npc: 1, text: 'Vess búzát az üres földekbe.', stat: 'plant_wheat', n: 4, reward: { coins: 30, xp: 5 }, hint: { obj: 'emptyplot' } },
  { npc: 1, text: 'Öntözd meg a vetést.', stat: 'water', n: 4, reward: { coins: 30, xp: 5 }, hint: { obj: 'thirsty' } },
  { npc: 1, text: 'Szánts fel új földeket a kapával.', stat: 'plow', n: 3, reward: { coins: 40, xp: 6 }, hint: { tool: 'plow' } },
  { npc: 0, text: 'Takarítsd el a gazt és a bokrokat.', stat: 'clear', n: 3, reward: { coins: 50, xp: 8 }, hint: { obj: 'obstacle' } },
  { npc: 8, text: 'Teljesíts egy megrendelést a táblánál.', stat: 'order', n: 1, reward: { coins: 60, xp: 10 }, hint: { obj: 'fixed:board' } },
  { npc: 0, text: 'Érd el a 2. szintet.', check: 'level', n: 2, reward: { coins: 50, gems: 1 } },
  { npc: 0, text: 'Építs tyúkólat a boltban.', stat: 'buy_coop', n: 1, reward: { coins: 60, xp: 10 }, hint: { ui: 'shop' } },
  { npc: 0, text: 'Vegyél 3 tyúkot az ólba.', stat: 'buy_chicken', n: 3, reward: { coins: 60, xp: 10 }, hint: { obj: 'housing:coop' } },
  { npc: 7, text: 'Építs takarmánykeverőt.', stat: 'buy_feedmill', n: 1, reward: { coins: 80, xp: 12 }, hint: { ui: 'shop' } },
  { npc: 7, text: 'Keverj csirketápot.', stat: 'craft_chickenfeed', n: 3, reward: { coins: 60, xp: 12 }, hint: { obj: 'building:feedmill' } },
  { npc: 0, text: 'Etesd meg a tyúkokat.', stat: 'feed_chicken', n: 3, reward: { coins: 50, xp: 10 }, hint: { obj: 'housing:coop' } },
  { npc: 0, text: 'Gyűjts tojást.', stat: 'collect_egg', n: 3, reward: { coins: 60, xp: 12 }, hint: { obj: 'housing:coop' } },
  { npc: 7, text: 'Építs szélmalmot.', stat: 'buy_mill', n: 1, reward: { coins: 100, xp: 15 }, hint: { ui: 'shop' } },
  { npc: 7, text: 'Őrölj lisztet.', stat: 'craft_flour', n: 2, reward: { coins: 80, xp: 15 }, hint: { obj: 'building:mill' } },
  { npc: 5, text: 'Fogj halat a tavon (csali a boltban).', stat: 'fish', n: 2, reward: { coins: 80, xp: 15, items: { bait: 3 } }, hint: { obj: 'fixed:pier' } },
  { npc: 2, text: 'Építs pékséget.', stat: 'buy_bakery', n: 1, reward: { coins: 150, xp: 20 }, hint: { ui: 'shop' } },
  { npc: 2, text: 'Süss kenyeret.', stat: 'craft_bread', n: 2, reward: { coins: 150, xp: 25 }, hint: { obj: 'building:bakery' } },
  { npc: 3, text: 'Tegyél ki dekorációkat.', stat: 'deco', n: 3, reward: { coins: 60, xp: 10 }, hint: { ui: 'shop' } },
  { npc: 6, text: 'Adj el valamit a piaci standon.', stat: 'market_sold', n: 2, reward: { coins: 100, xp: 15 }, hint: { obj: 'fixed:market' } },
  { npc: 8, text: 'Teljesíts 5 megrendelést.', stat: 'order', n: 5, reward: { coins: 150, xp: 20 }, hint: { obj: 'fixed:board' } },
  { npc: 1, text: 'Építs műhelyt.', stat: 'buy_workshop', n: 1, reward: { coins: 120, xp: 20 }, hint: { ui: 'shop' } },
  { npc: 1, text: 'Készíts fejszét a műhelyben.', stat: 'craft_axe', n: 1, reward: { coins: 80, xp: 15 }, hint: { obj: 'building:workshop' } },
  { npc: 1, text: 'Vágj ki egy fatönköt.', stat: 'clear_stump', n: 1, reward: { coins: 100, xp: 15 }, hint: { obj: 'obstacle' } },
  { npc: 0, text: 'Érd el az 5. szintet.', check: 'level', n: 5, reward: { coins: 200, gems: 2 } },
  { npc: 4, text: 'Szolgálj ki egy látogatót.', stat: 'visitor', n: 1, reward: { coins: 150, xp: 20 }, hint: { ui: 'visitors' } },
  { npc: 0, text: 'Építs tehénistállót.', stat: 'buy_cowshed', n: 1, reward: { coins: 200, xp: 25 }, hint: { ui: 'shop' } },
  { npc: 0, text: 'Vegyél tehenet.', stat: 'buy_cow', n: 2, reward: { coins: 150, xp: 25 }, hint: { obj: 'housing:cowshed' } },
  { npc: 0, text: 'Fejj tejet.', stat: 'collect_milk', n: 3, reward: { coins: 200, xp: 30 } },
  { npc: 3, text: 'Bővítsd a farmot (kattints a táblára a határon).', stat: 'expand', n: 1, reward: { coins: 300, xp: 30 }, hint: { obj: 'expandsign' } },
  { npc: 10, text: 'Érj el 30 bájpontot dekorációkkal.', check: 'charm', n: 30, reward: { coins: 250, gems: 2 } },
  { npc: 8, text: 'Bővítsd a raktárt a csűrben.', stat: 'storage', n: 1, reward: { coins: 200, xp: 30 }, hint: { obj: 'fixed:barn' } },
  { npc: 2, text: 'Építs tejüzemet.', stat: 'buy_dairy', n: 1, reward: { coins: 300, xp: 40 }, hint: { ui: 'shop' } },
  { npc: 2, text: 'Köpülj vajat.', stat: 'craft_butter', n: 3, reward: { coins: 300, xp: 40 } },
  { npc: 0, text: 'Ültess almafát.', stat: 'buy_apple', n: 2, reward: { coins: 250, xp: 35 }, hint: { ui: 'shop' } },
  { npc: 10, text: 'Építs juhaklot és vegyél juhot.', stat: 'buy_sheep', n: 2, reward: { coins: 400, xp: 45 } },
  { npc: 5, text: 'Fogj 10 halat.', stat: 'fish', n: 10, reward: { coins: 300, xp: 40, items: { bait: 5 } } },
  { npc: 11, text: 'Építs méhest a méheknek.', stat: 'buy_apiary', n: 1, reward: { coins: 400, xp: 50 } },
  { npc: 11, text: 'Gyűjts mézet.', stat: 'collect_honey', n: 3, reward: { coins: 400, xp: 50, gems: 1 } },
  { npc: 0, text: 'Érd el a 10. szintet.', check: 'level', n: 10, reward: { coins: 800, gems: 3 } },
  { npc: 6, text: 'Építs befőzdét.', stat: 'buy_cannery', n: 1, reward: { coins: 500, xp: 60 } },
  { npc: 6, text: 'Főzz lecsót.', stat: 'craft_lecso', n: 2, reward: { coins: 500, xp: 60 } },
  { npc: 5, text: 'Rakj meg 6 ládát az uszályon.', stat: 'barge_crate', n: 6, reward: { coins: 800, gems: 2 }, hint: { obj: 'fixed:dock' } },
  { npc: 9, text: 'Építs üvegházat.', stat: 'buy_greenhouse', n: 1, reward: { coins: 800, xp: 80 } },
  { npc: 9, text: 'Érd el a 15. szintet.', check: 'level', n: 15, reward: { coins: 1500, gems: 5 } },
  { npc: 4, text: 'Építs bisztrót, és főzz gulyáslevest.', stat: 'craft_goulash', n: 2, reward: { coins: 1200, xp: 120 } },
  { npc: 9, text: 'Teljesíts 50 megrendelést.', stat: 'order', n: 50, reward: { coins: 2000, gems: 5 } },
  { npc: 9, text: 'Érd el a 20. szintet.', check: 'level', n: 20, reward: { coins: 3000, gems: 6 } },
];

// Generated quests after the story ends.
export const QUEST_TEMPLATES = [
  (L) => ({ text: 'Arass le terményeket.', stat: 'harvest', n: 20 + L * 2 }),
  (L) => ({ text: 'Teljesíts megrendeléseket.', stat: 'order', n: 3 + Math.floor(L / 6) }),
  (L) => ({ text: 'Etesd meg az állataidat.', stat: 'feed', n: 8 + Math.floor(L / 2) }),
  (L) => ({ text: 'Készíts termékeket.', stat: 'craft', n: 5 + Math.floor(L / 4) }),
  (L) => ({ text: 'Fogj halakat.', stat: 'fish', n: 4 + Math.floor(L / 8) }),
  (L) => ({ text: 'Adj el a piacon.', stat: 'market_sold', n: 3 + Math.floor(L / 8) }),
  (L) => ({ text: 'Szolgálj ki látogatókat.', stat: 'visitor', n: 2 + Math.floor(L / 10) }),
  (L) => ({ text: 'Keress érméket.', stat: 'coinsEarned', n: 500 + L * 150 }),
];

// Daily tasks: 3 per real day, picked from these templates.
export const DAILY_TASKS = [
  { id: 'harvest', text: 'Arass le {n} terményt', stat: 'harvest', n: (L) => 15 + L },
  { id: 'plant',   text: 'Vess el {n} magot',      stat: 'plant',   n: (L) => 15 + L },
  { id: 'feed',    text: 'Etess meg {n} állatot',  stat: 'feed',    n: (L) => 6 + Math.floor(L / 2), level: 3 },
  { id: 'craft',   text: 'Készíts {n} terméket',   stat: 'craft',   n: (L) => 4 + Math.floor(L / 4), level: 3 },
  { id: 'order',   text: 'Teljesíts {n} megrendelést', stat: 'order', n: (L) => 2 + Math.floor(L / 10) },
  { id: 'fish',    text: 'Fogj {n} halat',         stat: 'fish',    n: (L) => 3 + Math.floor(L / 10), level: 3 },
  { id: 'clear',   text: 'Takaríts el {n} akadályt', stat: 'clear', n: () => 3 },
  { id: 'market',  text: 'Adj el {n} tételt a piacon', stat: 'market_sold', n: () => 2, level: 3 },
  { id: 'visitor', text: 'Szolgálj ki {n} látogatót', stat: 'visitor', n: () => 2, level: 4 },
  { id: 'water',   text: 'Öntözz meg {n} növényt',  stat: 'water',   n: (L) => 10 + L },
];

export const ACHIEVEMENTS = [
  { id: 'harvester', name: 'Arató',          stat: 'harvest',     tiers: [50, 500, 5000],       desc: 'Arass le {n} terményt' },
  { id: 'rich',      name: 'Tőkés gazda',    stat: 'coinsEarned', tiers: [2000, 50000, 500000], desc: 'Keress {n} érmét' },
  { id: 'trader',    name: 'Kereskedő',      stat: 'order',       tiers: [10, 100, 1000],       desc: 'Teljesíts {n} megrendelést' },
  { id: 'rancher',   name: 'Állattartó',     stat: 'feed',        tiers: [25, 250, 2500],       desc: 'Etess {n} alkalommal' },
  { id: 'artisan',   name: 'Kézműves',       stat: 'craft',       tiers: [10, 150, 1500],       desc: 'Készíts {n} terméket' },
  { id: 'gardener',  name: 'Kertész',        stat: 'water',       tiers: [100, 1000, 10000],    desc: 'Öntözz {n} alkalommal' },
  { id: 'planner',   name: 'Tájépítész',     stat: 'deco',        tiers: [10, 50, 200],         desc: 'Helyezz el {n} dekorációt' },
  { id: 'angler',    name: 'Horgász',        stat: 'fish',        tiers: [10, 100, 500],        desc: 'Fogj {n} halat' },
  { id: 'lumberjack',name: 'Favágó',         stat: 'clear',       tiers: [20, 150, 600],        desc: 'Takaríts el {n} akadályt' },
  { id: 'merchant',  name: 'Piacos',         stat: 'market_sold', tiers: [10, 100, 600],        desc: 'Adj el {n} tételt a piacon' },
  { id: 'host',      name: 'Vendéglátó',     stat: 'visitor',     tiers: [10, 75, 400],         desc: 'Szolgálj ki {n} látogatót' },
  { id: 'sailor',    name: 'Hajós',          stat: 'barge',       tiers: [3, 25, 120],          desc: 'Indíts útnak {n} teli uszályt' },
  { id: 'goldfish',  name: 'Szerencsés',     stat: 'collect_goldfish', tiers: [1, 5, 25],       desc: 'Fogj {n} aranyhalat' },
  { id: 'veteran',   name: 'Veterán',        check: 'level',      tiers: [10, 30, 60],          desc: 'Érd el a(z) {n}. szintet' },
];
export const ACH_GEMS = [2, 5, 10];
export const TIER_NAMES = ['bronz', 'ezüst', 'arany'];
