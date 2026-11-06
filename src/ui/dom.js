// Small DOM helpers shared by the UI modules.
import { iconURL } from '../three/icons.js';
import { ITEMS } from '../data/content.js';

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
/** Escape untrusted text before it goes into innerHTML (farm name, imported saves...). */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const ic = (name, cls = '') => `<img class="ic ${cls}" src="${iconURL(name)}" alt="" draggable="false">`;
export const itemIc = (id, cls = '') => ic('item:' + id, cls);
export const itemName = (id) => ITEMS[id]?.name || id;
export const fmtNum = (n) => Math.floor(n).toLocaleString('hu-HU');
export const fmtTime = (sec) => {
  sec = Math.max(0, Math.ceil(sec));
  if (sec < 60) return `${sec} mp`;
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (d > 0) return `${d} n ${h} ó`;
  if (h > 0) return `${h} ó ${m} p`;
  return s && m < 10 ? `${m} p ${s} mp` : `${m} p`;
};
export const price = (coins, gems = 0) => (gems ? `<span class="price">${ic('ui:gem')}${fmtNum(gems)}</span>` : `<span class="price">${ic('ui:coin')}${fmtNum(coins)}</span>`);
export function costHTML(cost) {
  const parts = [];
  for (const [k, v] of Object.entries(cost)) {
    if (!v) continue;
    if (k === 'coins') parts.push(`<span class="price">${ic('ui:coin')}${fmtNum(v)}</span>`);
    else if (k === 'gems') parts.push(`<span class="price">${ic('ui:gem')}${fmtNum(v)}</span>`);
    else parts.push(`<span class="price">${itemIc(k)}${v}</span>`);
  }
  return parts.join(' ');
}
export function pills(req, haveFn) {
  return Object.entries(req).map(([id, q]) => {
    const have = haveFn(id);
    return `<span class="pill ${have >= q ? 'ok' : 'miss'}" title="${esc(itemName(id))}">${itemIc(id)}${Math.min(have, q)}/${q}</span>`;
  }).join('');
}
