'use strict';
/* ============================================================
   Blueline — utilities: ids, math, matrices, colors, DOM helpers
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round = (v, p = 2) => { const m = Math.pow(10, p); return Math.round(v * m) / m; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => o === undefined ? undefined : JSON.parse(JSON.stringify(o));
let _idc = 0;
const uid = () => (Date.now().toString(36).slice(-5) + (_idc++).toString(36) + Math.random().toString(36).slice(2, 6));
const fmt = v => { if (v === null || v === undefined || Number.isNaN(v)) return ''; const r = Math.round(v * 100) / 100; return String(Object.is(r, -0) ? 0 : r); };
const deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl+';
const ALT = isMac ? '⌥' : 'Alt+';
const SHIFT = isMac ? '⇧' : 'Shift+';

/* 2D affine matrix [a,b,c,d,e,f] -> x' = a x + c y + e ; y' = b x + d y + f */
const M = {
  I: () => [1, 0, 0, 1, 0, 0],
  mul: (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]],
  inv: m => { const det = m[0] * m[3] - m[1] * m[2] || 1e-12; return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det]; },
  apply: (m, p) => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] }),
  applyV: (m, p) => ({ x: m[0] * p.x + m[2] * p.y, y: m[1] * p.x + m[3] * p.y }),
  tr: (x, y) => [1, 0, 0, 1, x, y],
  sc: (x, y = x) => [x, 0, 0, y, 0, 0],
  rot: d => { const r = rad(d), c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, 0, 0]; },
  str: m => `matrix(${m.map(v => round(v, 5)).join(' ')})`,
  isI: m => Math.abs(m[0] - 1) < 1e-9 && Math.abs(m[1]) < 1e-9 && Math.abs(m[2]) < 1e-9 && Math.abs(m[3] - 1) < 1e-9 && Math.abs(m[4]) < 1e-9 && Math.abs(m[5]) < 1e-9,
};

/* ---------- color ---------- */
function hexToRgb(hex) {
  hex = String(hex || '#000').replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex.slice(0, 6), 16);
  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const rgbToHex = ({ r, g, b }) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
function rgbToHsv({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return { h, s: mx ? d / mx : 0, v: mx };
}
function hsvToRgb({ h, s, v }) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
function normHex(v) {
  v = String(v || '').trim().replace('#', '');
  if (/^[0-9a-f]{1,2}$/i.test(v)) v = v.length === 1 ? v.repeat(6) : v.repeat(3);
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.split('').map(c => c + c).join('');
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v)) return '#' + v.slice(0, 6).toUpperCase();
  return null;
}
function cssToHex(css) {
  if (!css) return null;
  if (css[0] === '#') return normHex(css);
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (m) { const p = m[1].split(/[ ,/]+/).map(parseFloat); return rgbToHex({ r: p[0], g: p[1], b: p[2] }); }
  try { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = css; return normHex(c.fillStyle); } catch (e) { return null; }
}
const rgba = (hex, a = 1) => { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${round(a, 3)})`; };
const luminance = hex => { const { r, g, b } = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

/* ---------- expression input: "100/2", "+10", "*2" relative ---------- */
function evalNum(str, current) {
  str = String(str).trim().replace(/,/g, '.').replace(/px|%|°/g, '');
  if (str === '') return null;
  if (/^[+\-*/]\s*[\d.]/.test(str) && current !== undefined && current !== null && !/^-\s*\d+(\.\d+)?$/.test(str)) str = current + str;
  if (!/^[\d.+\-*/()\s]+$/.test(str)) return null;
  // small arithmetic parser (no eval, so it works under strict CSPs)
  let i = 0; const s = str.replace(/\s+/g, '');
  const num = () => { const m = s.slice(i).match(/^\d*\.?\d+/); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]); };
  const factor = () => { if (s[i] === '-') { i++; return -factor(); } if (s[i] === '+') { i++; return factor(); } if (s[i] === '(') { i++; const v = expr(); if (s[i] !== ')') throw 0; i++; return v; } return num(); };
  const term = () => { let v = factor(); while (s[i] === '*' || s[i] === '/') { const op = s[i++]; const r = factor(); v = op === '*' ? v * r : v / r; } return v; };
  const expr = () => { let v = term(); while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; };
  try { const v = expr(); if (i !== s.length) return null; return Number.isFinite(v) ? v : null; } catch (e) { return null; }
}

/* ---------- misc ---------- */
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function toast(msg, ms = 2200) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false; el.classList.remove('out');
  clearTimeout(toast._t); toast._t = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.hidden = true, 200); }, ms);
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function lerp(a, b, t) { return a + (b - a) * t; }
function hashStr(s) { let h1 = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h1 ^= s.charCodeAt(i); h1 = Math.imul(h1, 16777619); } return (h1 >>> 0).toString(36); }
// Inside the Claude artifact viewer, files go through the host's download prompt; elsewhere a plain download link works.
const hostDownloads = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
async function downloadBlob(blob, name) {
  const dl = await hostDownloads;
  if (dl) {
    try { await dl.save({ filename: name, data: blob }); toast('Saved ' + name); return true; }
    catch (e) {
      const code = e && e.code;
      if (code === 'declined') return false;
      if (code === 'rate_limited') { toast('A save is already waiting for your answer'); return false; }
      if (code === 'rejected_extension' || code === 'extension_not_enabled') { toast("That file type can't be saved here"); return false; }
      if (code === 'too_large') { toast('That file is too large to save here'); return false; }
    }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  return true;
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { } ta.remove(); return ok;
  }
}
const safeLS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
};
