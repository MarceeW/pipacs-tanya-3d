// In-game calendar: time of day, seasons and weather, all derived from real time so the farm
// keeps living while the game is closed.
import { DAY_LENGTH, SEASON_DAYS, SEASONS } from '../data/content.js';
import { S, now } from './state.js';

const DAY_MS = DAY_LENGTH * 1000;

function hash(n) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export function clock(t = now()) {
  const f = (t - S.clockEpoch) / DAY_MS;
  const day = Math.floor(f);
  const tod = f - day;
  const si = Math.floor(day / SEASON_DAYS) % 4;
  return {
    day, tod,
    hour: tod * 24,
    season: SEASONS[si].id,
    seasonIndex: si,
    seasonName: SEASONS[si].name,
    dayOfSeason: (day % SEASON_DAYS) + 1,
    year: Math.floor(day / (SEASON_DAYS * 4)) + 1,
    weather: weatherAt(day, tod, SEASONS[si].id),
  };
}

/** Weather changes every quarter day. */
export function weatherAt(day, tod, season) {
  if (day === 0) return 'sun';
  const q = Math.floor(tod * 4);
  const r = hash((S.seed | 0) + day * 7 + q * 131);
  if (season === 'winter') return r < 0.3 ? 'snow' : r < 0.55 ? 'cloud' : 'sun';
  const rain = season === 'autumn' ? 0.26 : season === 'spring' ? 0.22 : 0.14;
  return r < rain ? 'rain' : r < rain + 0.2 ? 'cloud' : 'sun';
}

/** 0 = full day, 1 = deep night */
export function nightFactor(hour) {
  if (hour >= 21 || hour < 4.5) return 1;
  if (hour >= 19.5) return (hour - 19.5) / 1.5;
  if (hour < 6.5) return 1 - (hour - 4.5) / 2;
  return 0;
}
/** golden hour amount 0..1 */
export function duskFactor(hour) {
  const a = Math.max(0, 1 - Math.abs(hour - 19.2) / 1.6);
  const b = Math.max(0, 1 - Math.abs(hour - 6) / 1.3);
  return Math.max(a, b);
}
export const isNight = (hour) => hour >= 20 || hour < 5;
export const fmtClock = (hour) => {
  const h = Math.floor(hour), m = Math.floor((hour - h) * 60 / 10) * 10;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
export const WEATHER_NAMES = { sun: 'Napsütés', cloud: 'Felhős', rain: 'Eső', snow: 'Havazás' };
