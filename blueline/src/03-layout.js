/* ============================================================
   Text: font catalog, loading, measurement, wrapping
   ============================================================ */
const GFONTS = {
  'Inter': '100;200;300;400;500;600;700;800;900', 'Roboto': '100;300;400;500;700;900', 'Open Sans': '300;400;500;600;700;800',
  'Lato': '100;300;400;700;900', 'Montserrat': '100;200;300;400;500;600;700;800;900', 'Poppins': '100;200;300;400;500;600;700;800;900',
  'Work Sans': '100;200;300;400;500;600;700;800;900', 'DM Sans': '100;200;300;400;500;600;700;800;900', 'Manrope': '200;300;400;500;600;700;800',
  'IBM Plex Sans': '100;200;300;400;500;600;700', 'Space Grotesk': '300;400;500;600;700', 'Geist': '100;200;300;400;500;600;700;800;900',
  'Nunito': '200;300;400;500;600;700;800;900', 'Rubik': '300;400;500;600;700;800;900', 'Raleway': '100;200;300;400;500;600;700;800;900',
  'Archivo': '100;200;300;400;500;600;700;800;900', 'Bricolage Grotesque': '200;300;400;500;600;700;800',
  'Playfair Display': '400;500;600;700;800;900', 'Fraunces': '100;200;300;400;500;600;700;800;900', 'Lora': '400;500;600;700',
  'Merriweather': '300;400;700;900', 'DM Serif Display': '400', 'Source Serif 4': '200;300;400;500;600;700;800;900', 'Instrument Serif': '400',
  'Bebas Neue': '400', 'Oswald': '200;300;400;500;600;700', 'Archivo Black': '400', 'Anton': '400',
  'JetBrains Mono': '100;200;300;400;500;600;700;800', 'IBM Plex Mono': '100;200;300;400;500;600;700', 'Space Mono': '400;700',
  'Caveat': '400;500;600;700', 'Pacifico': '400', 'Permanent Marker': '400',
};
const SYSFONTS = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'system-ui'];
const FONT_FALLBACK = f => /mono|courier/i.test(f) ? 'monospace' : /serif|playfair|lora|merriweather|fraunces|georgia|times/i.test(f) && !/sans/i.test(f) ? 'serif' : 'sans-serif';
const WEIGHT_NAMES = { 100: 'Thin', 200: 'Extra Light', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semi Bold', 700: 'Bold', 800: 'Extra Bold', 900: 'Black' };
const fontWeights = fam => GFONTS[fam] ? GFONTS[fam].split(';').map(Number) : [400, 700];
const loadedFonts = new Set(), pendingFonts = new Map();
function ensureFont(family) {
  if (!GFONTS[family] || loadedFonts.has(family)) return Promise.resolve();
  if (pendingFonts.has(family)) return pendingFonts.get(family);
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${GFONTS[family]}&display=swap`;
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; link.dataset.family = family;
  const p = new Promise(res => {
    link.onload = () => {
      Promise.all(fontWeights(family).map(w => document.fonts.load(`${w} 16px "${family}"`).catch(() => { })))
        .then(() => { loadedFonts.add(family); res(); onFontsChanged(); });
    };
    link.onerror = () => { loadedFonts.add(family); res(); };
  });
  document.head.appendChild(link); pendingFonts.set(family, p);
  return p;
}
let _fontsChangedT = 0;
function onFontsChanged() { clearTimeout(_fontsChangedT); _fontsChangedT = setTimeout(() => { textCache.clear(); if (typeof silentRelayout === 'function') silentRelayout(); }, 30); }

const measureCtx = document.createElement('canvas').getContext('2d');
const textCache = new Map();
const hasLS = 'letterSpacing' in measureCtx;
function fontCSS(n) { return `${n.italic ? 'italic ' : ''}${n.fontWeight || 400} ${n.fontSize}px "${n.fontFamily}", ${FONT_FALLBACK(n.fontFamily)}`; }
function lineHeightPx(n) { const lh = n.lineHeight || { u: 'AUTO' }; return lh.u === 'PX' ? lh.v : lh.u === '%' ? n.fontSize * lh.v / 100 : n.fontSize * 1.21; }
function caseText(n) {
  const s = n.characters || '';
  switch (n.textCase) { case 'UPPER': return s.toUpperCase(); case 'LOWER': return s.toLowerCase(); case 'TITLE': return s.replace(/\b\w/g, c => c.toUpperCase()); }
  return s;
}
function measureW(s, ls) {
  if (!s) return 0;
  const w = measureCtx.measureText(s).width;
  return hasLS ? w : w + ls * s.length;
}
/* returns {lines:[{t,w}], lh, asc, desc, maxW} */
function textLayout(n, wrapW) {
  const key = [n.characters, n.fontFamily, n.fontWeight, n.italic, n.fontSize, n.letterSpacing, n.textCase, JSON.stringify(n.lineHeight), wrapW === undefined ? 'nw' : round(wrapW, 2)].join('|');
  const hit = textCache.get(key); if (hit) return hit;
  measureCtx.font = fontCSS(n);
  if (hasLS) measureCtx.letterSpacing = (n.letterSpacing || 0) + 'px';
  const ls = n.letterSpacing || 0;
  const m = measureCtx.measureText('Hgjy');
  const asc = m.fontBoundingBoxAscent ?? n.fontSize * 0.93, desc = m.fontBoundingBoxDescent ?? n.fontSize * 0.24;
  const lines = [];
  const paras = caseText(n).split('\n');
  for (const para of paras) {
    if (wrapW === undefined) { lines.push({ t: para, w: measureW(para, ls) }); continue; }
    const words = para.split(/(\s+)/); let cur = '';
    for (const wd of words) {
      if (!wd) continue;
      const tryS = cur + wd;
      if (measureW(tryS.replace(/\s+$/, ''), ls) <= wrapW + 0.01 || !cur.trim()) {
        if (!cur.trim() && measureW(wd, ls) > wrapW && /\S/.test(wd)) {   // break long word
          let chunk = cur;
          for (const ch of wd) { if (measureW(chunk + ch, ls) > wrapW && chunk.trim()) { lines.push({ t: chunk, w: measureW(chunk, ls) }); chunk = ''; } chunk += ch; }
          cur = chunk;
        } else cur = tryS;
      } else { const t = cur.replace(/\s+$/, ''); lines.push({ t, w: measureW(t, ls) }); cur = /^\s+$/.test(wd) ? '' : wd; }
    }
    const t = cur.replace(/\s+$/, ''); lines.push({ t, w: measureW(t, ls) });
  }
  const res = { lines, lh: lineHeightPx(n), asc, desc, maxW: Math.max(0, ...lines.map(l => l.w)) };
  if (textCache.size > 4000) textCache.clear();
  textCache.set(key, res);
  return res;
}
function measureTextNode(n) {
  ensureFont(n.fontFamily);
  if (n.sizingH === 'HUG') { const L = textLayout(n); n.w = Math.max(1, Math.ceil(L.maxW * 100) / 100); }
  if (n.sizingV === 'HUG') { const L = textLayout(n, n.sizingH === 'HUG' ? undefined : n.w); n.h = Math.max(L.lh, L.lines.length * L.lh); }
}
function textRenderLayout(n) { return textLayout(n, n.sizingH === 'HUG' ? undefined : n.w); }

/* ============================================================
   Layout pass: text, auto layout, groups, booleans, instances
   ============================================================ */
function layoutAll() {
  if (!root()) return;
  syncStyles();
  const pages = kids(root());
  pages.forEach(p => kids(p).forEach(layoutNode));
  syncInstances();
  pages.forEach(p => kids(p).forEach(layoutNode));
}
function layoutNode(n) {
  if (!n) return;
  if (n.children) n.children.slice().forEach(id => layoutNode(N(id)));
  switch (n.type) {
    case 'TEXT': measureTextNode(n); break;
    case 'GROUP': if (!n.children.length) { removeNode(n.id); return; } fitGroup(n); break;
    case 'BOOLEAN': if (!n.children.length) { removeNode(n.id); return; } computeBoolean(n); break;
    case 'VECTOR': normalizeVector(n); break;
    case 'FRAME': case 'COMPONENT': case 'INSTANCE': if (isAuto(n)) autoLayout(n); break;
  }
}
function fitGroup(n) {
  let ks = kids(n).filter(c => c.visible); if (!ks.length) ks = kids(n);
  const b = aabb(ks.flatMap(c => corners(c, localMatrix(c))));
  if (refit(n, b)) ks.length && kids(n).forEach(c => { c.x -= b.x; c.y -= b.y; });
}
/* ---------- auto layout ---------- */
function extent(c, horiz) { if (!c.rotation) return horiz ? c.w : c.h; const b = localBox(c); return horiz ? b.w : b.h; }
function setExtent(c, horiz, v) {
  v = Math.max(v, 0.01);
  if (horiz) resizeNode(c, v, c.h); else resizeNode(c, c.w, v);
  if (c.type === 'TEXT') measureTextNode(c);
  if (isAuto(c)) autoLayout(c);
}
function autoLayout(f) {
  const H = f.layoutMode === 'HORIZONTAL';
  const [pt_, pr, pb, pl] = f.padding || [0, 0, 0, 0];
  const items = kids(f).filter(c => c.visible && !c.absolute);
  const sMain = H ? 'sizingH' : 'sizingV', sCross = H ? 'sizingV' : 'sizingH';
  const padMain = H ? pl + pr : pt_ + pb, padCross = H ? pt_ + pb : pl + pr;
  const between = f.primaryAlign === 'SPACE_BETWEEN';
  const gap = f.itemSpacing || 0;
  const n = items.length;
  // main axis
  let fixedSum = 0, fills = [];
  items.forEach(c => { if (c[sMain] === 'FILL' && f[sMain] !== 'HUG') fills.push(c); else fixedSum += extent(c, H); });
  const gapsTotal = n > 1 ? gap * (n - 1) : 0;
  if (f[sMain] === 'HUG') {
    const sz = padMain + fixedSum + gapsTotal;
    if (H) f.w = Math.max(sz, 0.01); else f.h = Math.max(sz, 0.01);
  } else if (fills.length) {
    const avail = (H ? f.w : f.h) - padMain - fixedSum - (between ? 0 : gapsTotal);
    const per = Math.max(1, avail / fills.length);
    fills.forEach(c => { if (Math.abs(extent(c, H) - per) > 0.001) setExtent(c, H, per); });
  }
  // cross axis
  if (f[sCross] === 'HUG') {
    const mx = Math.max(0, ...items.map(c => extent(c, !H)));
    const sz = padCross + mx; if (H) f.h = Math.max(sz, 0.01); else f.w = Math.max(sz, 0.01);
  }
  const innerCross = (H ? f.h : f.w) - padCross;
  items.forEach(c => { if (c[sCross] === 'FILL' && f[sCross] !== 'HUG' && Math.abs(extent(c, !H) - innerCross) > 0.001) setExtent(c, !H, Math.max(innerCross, 1)); });
  // positions
  const exts = items.map(c => extent(c, H));
  const total = exts.reduce((a, b) => a + b, 0);
  const innerMain = (H ? f.w : f.h) - padMain;
  let g = gap, pos = H ? pl : pt_;
  if (between) { g = n > 1 ? (innerMain - total) / (n - 1) : 0; if (n === 1) pos += 0; }
  else if (f.primaryAlign === 'CENTER') pos += (innerMain - total - gapsTotal) / 2;
  else if (f.primaryAlign === 'MAX') pos += innerMain - total - gapsTotal;
  const crossStart = H ? pt_ : pl;
  items.forEach((c, i) => {
    const ce = extent(c, !H);
    let cp = crossStart;
    if (f.counterAlign === 'CENTER') cp += (innerCross - ce) / 2; else if (f.counterAlign === 'MAX') cp += innerCross - ce;
    const b = localBox(c);   // aabb of child in parent coords
    const offX = c.x - b.x, offY = c.y - b.y;
    if (H) { c.x = pos + offX; c.y = cp + offY; } else { c.y = pos + offY; c.x = cp + offX; }
    pos += exts[i] + g;
  });
}
/* ---------- boolean ---------- */
const hasPaper = () => typeof paper !== 'undefined' && paper.Path;
let paperReady = false;
function paperInit() { if (!hasPaper()) return false; if (!paperReady) { paper.setup(new paper.Size(10, 10)); paperReady = true; } return true; }
function toPaper(paths) {
  const cp = new paper.CompoundPath({ insert: false });
  paths.forEach(sp => { if (sp.pts.length < 2) return; cp.addChild(new paper.Path({ insert: false, closed: true, segments: sp.pts.map(p => new paper.Segment(new paper.Point(p.x, p.y), new paper.Point(p.ix, p.iy), new paper.Point(p.ox, p.oy))) })); });
  return cp;
}
function fromPaper(item) {
  const list = item.children && item.className === 'CompoundPath' ? item.children : (item.segments ? [item] : (item.children || []));
  return list.filter(p => p.segments && p.segments.length).map(p => ({ closed: p.closed, pts: p.segments.map(s => pt(s.point.x, s.point.y, s.handleIn.x, s.handleIn.y, s.handleOut.x, s.handleOut.y)) }));
}
function boolSig(n, ks) {
  return hashStr(JSON.stringify([n.booleanOp, ks.map(c => [c.type, c.x, c.y, c.w, c.h, c.rotation, c.flipX, c.flipY, c.cornerRadius, c.cornerRadii, c.pointCount, c.innerRadius, c.paths, c.bpaths, c.type === 'GROUP' ? outlinePaths(c) : 0])]));
}
function booleanPaths(n, ks) {
  const parts = ks.map(c => transformPaths(outlinePaths(c), localMatrix(c)));
  if (!parts.length) return [];
  if (paperInit()) {
    try {
      const op = { UNION: 'unite', SUBTRACT: 'subtract', INTERSECT: 'intersect', EXCLUDE: 'exclude' }[n.booleanOp] || 'unite';
      let acc = toPaper(parts[0]);
      for (let i = 1; i < parts.length; i++) acc = acc[op](toPaper(parts[i]), { insert: false });
      return fromPaper(acc);
    } catch (e) { console.warn('boolean failed', e); }
  }
  return parts.flat();
}
function computeBoolean(n) {
  const ks = kids(n).filter(c => c.visible);
  if (!ks.length) return;
  if (!n.bpaths || n.bkey !== boolSig(n, ks)) {
    n.bpaths = booleanPaths(n, ks);
    n.fillRule = hasPaper() ? 'nonzero' : (n.booleanOp === 'UNION' ? 'nonzero' : 'evenodd');
  }
  const b = pathsBBox(n.bpaths);
  if (isFinite(b.x) && b.w + b.h > 0 && refit(n, b)) {
    kids(n).forEach(c => { c.x -= b.x; c.y -= b.y; });
    n.bpaths = shiftPaths(n.bpaths, -b.x, -b.y);
  }
  n.bkey = boolSig(n, ks);
}

/* ---------- components & instances ---------- */
const SKIP_CHILD = new Set(['id', 'parent', 'children', 'mainRef', 'overrides', 'x', 'y', 'w', 'h']);
const SKIP_ROOT = new Set([...SKIP_CHILD, 'type', 'rotation', 'flipX', 'flipY', 'name', 'constraints', 'sizingH', 'sizingV', 'absolute', 'reactions', 'exportSettings', 'visible', 'locked', 'componentId', 'description']);
function copyProps(src, dst, skip) {
  const ov = new Set(dst.overrides || []);
  for (const k in src) {
    if (skip.has(k) || ov.has(k)) continue;
    const v = src[k];
    if (typeof v === 'object' && v !== null) { const s = JSON.stringify(v); if (JSON.stringify(dst[k]) !== s) dst[k] = JSON.parse(s); }
    else if (dst[k] !== v) dst[k] = v;
  }
}
function syncInstances() {
  const done = new Set();
  Object.values(D.nodes).forEach(n => { if (n.type === 'INSTANCE' && !n.mainRef) syncInstance(n, done); });
}
function syncInstance(inst, done) {
  if (done.has(inst.id)) return; done.add(inst.id);
  const master = N(inst.componentId);
  if (!master || master.type !== 'COMPONENT') return;
  descendants(master).forEach(d => { if (d.type === 'INSTANCE' && !d.mainRef) syncInstance(d, done); });
  copyProps(master, inst, SKIP_ROOT);
  syncChildren(master, inst);
  if (!isAuto(inst) && (Math.abs(master.w - inst.w) > 1e-6 || Math.abs(master.h - inst.h) > 1e-6))
    kids(inst).forEach(c => applyConstraints(c, master.w, master.h, inst.w, inst.h));
}
function syncChildren(src, dst) {
  const existing = new Map(); kids(dst).forEach(c => { if (c.mainRef) existing.set(c.mainRef, c); });
  const next = [];
  kids(src).forEach(s => {
    let d = existing.get(s.id);
    if (d) existing.delete(s.id);
    else {
      d = clone(s); d.id = uid(); d.parent = dst.id; d.mainRef = s.id; d.overrides = []; d.children = s.children ? [] : undefined;
      if (!s.children) delete d.children;
      D.nodes[d.id] = d;
    }
    copyProps(s, d, SKIP_CHILD);
    const ov = new Set(d.overrides || []);
    ['x', 'y', 'w', 'h'].forEach(k => { if (!ov.has(k)) d[k] = s[k]; });
    if (s.children) syncChildren(s, d);
    next.push(d.id);
  });
  existing.forEach(d => { d.parent = null; removeNode(d.id); });
  // remove non-ref children (shouldn't exist) -- keep only synced
  kids(dst).forEach(c => { if (!c.mainRef && !next.includes(c.id)) removeNode(c.id); });
  dst.children = next;
}
function createInstance(componentId, parentId, x, y) {
  const master = N(componentId);
  const inst = clone(master); inst.id = uid(); inst.type = 'INSTANCE'; inst.componentId = componentId; inst.children = []; inst.overrides = [];
  delete inst.description; inst.reactions = clone(master.reactions || []); inst.exportSettings = [];
  inst.x = x; inst.y = y; inst.rotation = 0; inst.name = master.name;
  addNode(inst, parentId);
  syncInstance(inst, new Set());
  return inst;
}
function markOverride(n, key) {
  if (!n.mainRef && !(n.type === 'INSTANCE' && !SKIP_ROOT.has(key))) return;
  if (n.mainRef && SKIP_CHILD.has(key)) return;
  n.overrides = n.overrides || [];
  if (!n.overrides.includes(key)) n.overrides.push(key);
}
