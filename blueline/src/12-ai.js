/* ============================================================
   AI layer — the "Blueline spec" (a compact JSON form an AI can
   read and write), AI-friendly exports, and the tool registry
   that every remote-control transport calls into.
   ============================================================ */
const AI_VERSION = '1.0';
const SPEC_TYPES = { frame: 'FRAME', group: 'GROUP', component: 'COMPONENT', instance: 'INSTANCE', rect: 'RECT', rectangle: 'RECT', image: 'RECT', ellipse: 'ELLIPSE', circle: 'ELLIPSE', oval: 'ELLIPSE', polygon: 'POLYGON', triangle: 'POLYGON', star: 'STAR', vector: 'VECTOR', path: 'VECTOR', line: 'VECTOR', arrow: 'VECTOR', text: 'TEXT', boolean: 'BOOLEAN' };
const TYPE_TO_SPEC = { FRAME: 'frame', GROUP: 'group', COMPONENT: 'component', INSTANCE: 'instance', RECT: 'rect', ELLIPSE: 'ellipse', POLYGON: 'polygon', STAR: 'star', VECTOR: 'vector', TEXT: 'text', BOOLEAN: 'boolean' };
const ENUM = {
  align: { start: 'MIN', min: 'MIN', left: 'MIN', top: 'MIN', center: 'CENTER', middle: 'CENTER', end: 'MAX', max: 'MAX', right: 'MAX', bottom: 'MAX', 'space-between': 'SPACE_BETWEEN', between: 'SPACE_BETWEEN' },
  sizing: { fixed: 'FIXED', hug: 'HUG', fill: 'FILL', auto: 'HUG' },
  conH: { left: 'LEFT', right: 'RIGHT', 'left-right': 'LEFT_RIGHT', stretch: 'LEFT_RIGHT', center: 'CENTER', scale: 'SCALE' },
  conV: { top: 'TOP', bottom: 'BOTTOM', 'top-bottom': 'TOP_BOTTOM', stretch: 'TOP_BOTTOM', center: 'CENTER', scale: 'SCALE' },
  strokeAlign: { inside: 'INSIDE', center: 'CENTER', outside: 'OUTSIDE' },
  cap: { none: 'NONE', butt: 'NONE', round: 'ROUND', square: 'SQUARE' },
  join: { miter: 'MITER', round: 'ROUND', bevel: 'BEVEL' },
  marker: { none: 'NONE', arrow: 'ARROW_LINES', 'arrow-lines': 'ARROW_LINES', triangle: 'TRIANGLE', circle: 'CIRCLE' },
  textAlign: { left: 'LEFT', center: 'CENTER', right: 'RIGHT', justify: 'JUSTIFIED' },
  vAlign: { top: 'TOP', center: 'CENTER', middle: 'CENTER', bottom: 'BOTTOM' },
  textCase: { none: 'ORIGINAL', original: 'ORIGINAL', upper: 'UPPER', uppercase: 'UPPER', lower: 'LOWER', lowercase: 'LOWER', title: 'TITLE', capitalize: 'TITLE' },
  deco: { none: 'NONE', underline: 'UNDERLINE', strikethrough: 'STRIKETHROUGH', 'line-through': 'STRIKETHROUGH' },
  bool: { union: 'UNION', subtract: 'SUBTRACT', intersect: 'INTERSECT', exclude: 'EXCLUDE' },
  fit: { fill: 'FILL', cover: 'FILL', fit: 'FIT', contain: 'FIT', stretch: 'STRETCH', tile: 'TILE' },
  transition: { instant: 'INSTANT', none: 'INSTANT', dissolve: 'DISSOLVE', fade: 'DISSOLVE', 'slide-left': 'SLIDE_LEFT', 'slide-right': 'SLIDE_RIGHT', 'slide-up': 'SLIDE_UP', 'push-left': 'PUSH_LEFT', 'push-right': 'PUSH_RIGHT' },
};
const rev = obj => { const o = {}; for (const k in obj) if (!(obj[k] in o)) o[obj[k]] = k; return o; };
const ENUM_OUT = Object.fromEntries(Object.entries(ENUM).map(([k, v]) => [k, rev(v)]));
ENUM_OUT.align.MIN = 'start'; ENUM_OUT.align.MAX = 'end'; ENUM_OUT.conH.LEFT_RIGHT = 'left-right'; ENUM_OUT.conV.TOP_BOTTOM = 'top-bottom'; ENUM_OUT.marker.ARROW_LINES = 'arrow'; ENUM_OUT.textCase.ORIGINAL = 'none';
function en(table, v, field) {
  if (v === undefined) return undefined;
  const key = String(v).toLowerCase().replace(/_/g, '-');
  const r = ENUM[table][key] || (Object.values(ENUM[table]).includes(String(v).toUpperCase()) ? String(v).toUpperCase() : null);
  if (!r) throw aiErr('invalid_argument', `${field}: "${v}" is not one of ${Object.keys(ENUM[table]).join(', ')}`);
  return r;
}
function aiErr(code, message) { const e = new Error(message); e.code = code; return e; }

/* ---------- colors & paints ---------- */
function parseColor(v) {
  if (typeof v !== 'string') throw aiErr('invalid_argument', `color must be a string like "#1F6B4F", got ${JSON.stringify(v)}`);
  const s = v.trim();
  if (s.toLowerCase() === 'transparent') return { hex: '#000000', a: 0 };
  let m = s.match(/^#?([0-9a-f]{8})$/i);
  if (m) return { hex: '#' + m[1].slice(0, 6).toUpperCase(), a: round(parseInt(m[1].slice(6), 16) / 255, 3) };
  m = s.match(/^#?([0-9a-f]{4})$/i);
  if (m) { const h4 = m[1].split('').map(c => c + c).join(''); return { hex: '#' + h4.slice(0, 6).toUpperCase(), a: round(parseInt(h4.slice(6), 16) / 255, 3) }; }
  const hx = normHex(s); if (hx && /^#?[0-9a-f]{3,6}$/i.test(s)) return { hex: hx, a: 1 };
  m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
    const ch = parts.slice(0, 3).map(x => x.endsWith('%') ? parseFloat(x) * 2.55 : parseFloat(x));
    const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    if (ch.some(v => !isFinite(v))) throw aiErr('invalid_argument', `unrecognised color "${v}"`);
    return { hex: rgbToHex({ r: ch[0], g: ch[1], b: ch[2] }), a: clamp(a, 0, 1) };
  }
  const css = cssToHex(s); if (css) return { hex: css, a: 1 };
  throw aiErr('invalid_argument', `unrecognised color "${v}" — use hex like "#1F6B4F" or "#1F6B4F80" for alpha`);
}
const colorOut = (hex, a = 1) => a >= 0.999 ? hex.toUpperCase() : hex.toUpperCase() + Math.round(clamp(a, 0, 1) * 255).toString(16).padStart(2, '0').toUpperCase();
const pendingImages = [];
function specPaint(v) {
  if (v === null || v === undefined || v === false) return null;
  if (typeof v === 'string') { const c = parseColor(v); return solid(c.hex, c.a); }
  if (typeof v !== 'object') throw aiErr('invalid_argument', 'paint must be a color string or an object');
  const op = v.opacity !== undefined ? clamp(+v.opacity, 0, 1) : 1;
  const stopsOf = arr => (arr || []).map((s, i, all) => {
    if (typeof s === 'string') { const c = parseColor(s); return { pos: all.length > 1 ? i / (all.length - 1) : 0, color: c.hex, opacity: c.a }; }
    if (Array.isArray(s)) { const c = parseColor(s[1]); return { pos: clamp(+s[0], 0, 1), color: c.hex, opacity: c.a }; }
    const c = parseColor(s.color); return { pos: clamp(+(s.pos ?? s.position ?? s.offset ?? i / Math.max(1, all.length - 1)), 0, 1), color: c.hex, opacity: (s.opacity ?? 1) * c.a };
  });
  const t = String(v.type || (v.linear ? 'linear' : v.radial ? 'radial' : v.image || v.src ? 'image' : v.color ? 'solid' : '')).toLowerCase();
  if (t === 'solid') { const c = parseColor(v.color); return Object.assign(solid(c.hex, c.a * op), { visible: v.visible !== false }); }
  if (t === 'linear' || t === 'radial') {
    const stops = stopsOf(v.stops || v.linear || v.radial);
    if (stops.length < 2) throw aiErr('invalid_argument', 'gradients need at least two stops');
    return { type: t === 'linear' ? 'LINEAR' : 'RADIAL', angle: v.angle ?? 90, stops, opacity: op, visible: v.visible !== false };
  }
  if (t === 'image') {
    const src = v.src || v.image || v.url; const p = { type: 'IMAGE', imageRef: v.ref || null, scaleMode: en('fit', v.fit || 'fill', 'fit'), opacity: op, visible: v.visible !== false };
    if (src && !v.ref) pendingImages.push(loadImageSrc(src).then(ref => { p.imageRef = ref; }));
    return p;
  }
  throw aiErr('invalid_argument', `unknown paint type "${v.type}" — use a color string, {type:"linear"|"radial", stops:[...]}, or {type:"image", src}`);
}
const specPaints = v => (v === null || v === false ? [] : (Array.isArray(v) ? v : [v]).map(specPaint).filter(Boolean));
async function loadImageSrc(src) {
  if (/^img[a-z0-9]+$/i.test(src) && D.images[src]) return src;
  let data = src;
  if (!/^data:image\//.test(src)) {
    try { const blob = await (await fetch(src)).blob(); data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); }); }
    catch (e) { throw aiErr('fetch_failed', `could not load image from ${String(src).slice(0, 80)} — send a data: URL instead`); }
  }
  return addImageAsset(data);
}
function paintOut(p, opts) {
  if (p.type === 'SOLID') { const c = colorOut(p.color, p.opacity ?? 1); return p.visible === false ? { type: 'solid', color: c, visible: false } : c; }
  if (p.type === 'LINEAR' || p.type === 'RADIAL') {
    const o = { type: p.type.toLowerCase(), stops: p.stops.map(s => [round(s.pos, 3), colorOut(s.color, s.opacity ?? 1)]) };
    if (p.type === 'LINEAR') o.angle = round(p.angle ?? 90, 2);
    if ((p.opacity ?? 1) < 1) o.opacity = round(p.opacity, 3);
    if (p.visible === false) o.visible = false;
    return o;
  }
  if (p.type === 'IMAGE') {
    const o = { type: 'image', fit: ENUM_OUT.fit[p.scaleMode] || 'fill', ref: p.imageRef };
    if (opts && opts.images && D.images[p.imageRef]) o.src = D.images[p.imageRef].data;
    if ((p.opacity ?? 1) < 1) o.opacity = round(p.opacity, 3);
    return o;
  }
  return null;
}
function paintsOut(list, opts) { const v = (list || []).map(p => paintOut(p, opts)).filter(Boolean); return v.length === 0 ? undefined : v.length === 1 ? v[0] : v; }
function effectsIn(v, n) {
  const arr = Array.isArray(v) ? v : [v];
  return arr.filter(Boolean).map(e => {
    if (typeof e === 'number') return { type: 'LAYER_BLUR', blur: e, visible: true };
    const t = String(e.type || (e.inner ? 'inner-shadow' : 'drop-shadow')).toLowerCase();
    if (t.includes('blur')) return { type: 'LAYER_BLUR', blur: +e.blur || 0, visible: e.visible !== false };
    const c = parseColor(e.color || '#00000040');
    return { type: t.includes('inner') ? 'INNER_SHADOW' : 'DROP_SHADOW', x: +e.x || 0, y: +(e.y ?? 4), blur: +(e.blur ?? 8), spread: +e.spread || 0, color: c.hex, opacity: e.opacity !== undefined ? +e.opacity : c.a, visible: e.visible !== false };
  });
}
function effectsOut(list) {
  const out = (list || []).map(e => e.type === 'LAYER_BLUR' ? { type: 'blur', blur: e.blur } : Object.assign({ type: e.type === 'INNER_SHADOW' ? 'inner-shadow' : 'drop-shadow', x: e.x, y: e.y, blur: e.blur, color: colorOut(e.color, e.opacity ?? 0.25) }, e.spread ? { spread: e.spread } : {}, e.visible === false ? { visible: false } : {}));
  return out.length ? out : undefined;
}

/* ---------- SVG path data <-> paths ---------- */
function parsePathD(d) {
  const toks = String(d).match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
  let i = 0, cmd = '', cx = 0, cy = 0, sx = 0, sy = 0, lc = null, lq = null, cur = null;
  const paths = [];
  const num = () => { const v = parseFloat(toks[i++]); if (!isFinite(v)) throw aiErr('invalid_argument', 'malformed path data'); return v; };
  const start = (x, y) => { cur = { closed: false, pts: [pt(x, y)] }; paths.push(cur); };
  const ensure = () => { if (!cur) start(cx, cy); };
  const lineTo = (x, y) => { ensure(); cur.pts.push(pt(x, y)); cx = x; cy = y; };
  const cubicTo = (x1, y1, x2, y2, x, y) => { ensure(); const l = cur.pts[cur.pts.length - 1]; l.ox = x1 - l.x; l.oy = y1 - l.y; cur.pts.push(pt(x, y, x2 - x, y2 - y)); cx = x; cy = y; };
  const arcTo = (rx, ry, phi, fa, fs, x, y) => {
    if (!rx || !ry) return lineTo(x, y);
    const x1 = cx, y1 = cy; rx = Math.abs(rx); ry = Math.abs(ry);
    const ph = rad(phi), cp = Math.cos(ph), sp = Math.sin(ph);
    const dx = (x1 - x) / 2, dy = (y1 - y) / 2, x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
    let lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry); if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const sign = fa === fs ? -1 : 1;
    let co = sign * Math.sqrt(Math.max(0, (rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p) / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)));
    const cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx;
    const ccx = cp * cxp - sp * cyp + (x1 + x) / 2, ccy = sp * cxp + cp * cyp + (y1 + y) / 2;
    const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
    let t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry), dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!fs && dt > 0) dt -= 2 * Math.PI; if (fs && dt < 0) dt += 2 * Math.PI;
    const segs = Math.ceil(Math.abs(dt) / (Math.PI / 2)), st = dt / segs, k = 4 / 3 * Math.tan(st / 4);
    const P = (t) => ({ x: ccx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp, y: ccy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp });
    const Dv = (t) => ({ x: -rx * Math.sin(t) * cp - ry * Math.cos(t) * sp, y: -rx * Math.sin(t) * sp + ry * Math.cos(t) * cp });
    for (let s = 0; s < segs; s++) {
      const a = t1 + s * st, b = a + st, pa = P(a), pb = P(b), da = Dv(a), db = Dv(b);
      cubicTo(pa.x + k * da.x, pa.y + k * da.y, pb.x - k * db.x, pb.y - k * db.y, pb.x, pb.y);
    }
  };
  while (i < toks.length) {
    if (/^[a-zA-Z]$/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase() && cmd !== 'Z', C = cmd.toUpperCase();
    const ox = rel ? cx : 0, oy = rel ? cy : 0;
    let nlc = null, nlq = null;
    switch (C) {
      case 'M': { const x = num() + ox, y = num() + oy; start(x, y); cx = sx = x; cy = sy = y; cmd = rel ? 'l' : 'L'; break; }
      case 'L': lineTo(num() + ox, num() + oy); break;
      case 'H': lineTo(num() + ox, cy); break;
      case 'V': lineTo(cx, num() + oy); break;
      case 'C': { const a = num() + ox, b = num() + oy, c = num() + ox, d2 = num() + oy, x = num() + ox, y = num() + oy; cubicTo(a, b, c, d2, x, y); nlc = [c, d2]; break; }
      case 'S': { const r1 = lc ? [2 * cx - lc[0], 2 * cy - lc[1]] : [cx, cy]; const c = num() + ox, d2 = num() + oy, x = num() + ox, y = num() + oy; cubicTo(r1[0], r1[1], c, d2, x, y); nlc = [c, d2]; break; }
      case 'Q': { const qx = num() + ox, qy = num() + oy, x = num() + ox, y = num() + oy; cubicTo(cx + 2 / 3 * (qx - cx), cy + 2 / 3 * (qy - cy), x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y), x, y); nlq = [qx, qy]; break; }
      case 'T': { const q = lq ? [2 * cx - lq[0], 2 * cy - lq[1]] : [cx, cy]; const x = num() + ox, y = num() + oy; cubicTo(cx + 2 / 3 * (q[0] - cx), cy + 2 / 3 * (q[1] - cy), x + 2 / 3 * (q[0] - x), y + 2 / 3 * (q[1] - y), x, y); nlq = q; break; }
      case 'A': { const rx = num(), ry = num(), ph = num(), fa = num(), fs = num(), x = num() + ox, y = num() + oy; arcTo(rx, ry, ph, !!fa, !!fs, x, y); break; }
      case 'Z': {
        if (cur) { const P = cur.pts, f = P[0], l = P[P.length - 1]; if (P.length > 1 && Math.abs(f.x - l.x) < 1e-6 && Math.abs(f.y - l.y) < 1e-6) { f.ix = l.ix; f.iy = l.iy; P.pop(); } cur.closed = true; }
        cur = null; cx = sx; cy = sy; break;
      }
      default: i++;
    }
    lc = nlc; lq = nlq;
  }
  return paths.filter(p => p.pts.length > 1 || p.closed);
}

/* ---------- spec -> nodes ---------- */
function resolveNode(ref, field = 'id') {
  if (ref && typeof ref === 'object') ref = ref.id;
  const n = N(ref);
  if (!n || n.type === 'DOCUMENT') throw aiErr('not_found', `${field}: no layer with id "${ref}" — use find_nodes or get_tree to look ids up`);
  return n;
}
function resolveParent(ref) {
  if (ref === undefined || ref === null || ref === '' || ref === 'page') return pageNode();
  const p = resolveNode(ref, 'parent_id');
  if (p.type !== 'PAGE' && !CONTAINERS.has(p.type)) throw aiErr('invalid_argument', `parent_id: a ${TYPE_TO_SPEC[p.type]} can't hold children — use a frame, group or component`);
  if (p.type === 'INSTANCE' || p.mainRef) throw aiErr('invalid_argument', "parent_id: layers can't be added inside an instance; edit its main component instead");
  return p;
}
function findComponent(ref) {
  const n = N(ref);
  if (n && n.type === 'COMPONENT') return n;
  const byName = Object.values(D.nodes).filter(x => x.type === 'COMPONENT' && x.name.toLowerCase() === String(ref).toLowerCase());
  if (byName.length) return byName[0];
  throw aiErr('not_found', `component "${ref}" not found — list_components shows what exists`);
}
function aiCreateNode(spec, parentId, index) {
  if (!spec || typeof spec !== 'object') throw aiErr('invalid_argument', 'each layer spec must be an object');
  const t = String(spec.type || '').toLowerCase();
  const type = SPEC_TYPES[t];
  if (!type) throw aiErr('invalid_argument', `type "${spec.type}" is not one of ${Object.keys(SPEC_TYPES).join(', ')}`);
  let n;
  if (type === 'INSTANCE') {
    const comp = findComponent(spec.component || spec.component_id || spec.componentId);
    n = createInstance(comp.id, parentId, spec.x || 0, spec.y || 0);
    if (index !== undefined) { const p = N(parentId); detach(n); p.children.splice(Math.min(index, p.children.length), 0, n.id); }
    applySpec(n, Object.assign({}, spec, { children: undefined, component: undefined }), true);
    if (spec.overrides) applyOverrides(n, spec.overrides);
    return n;
  }
  n = mkNode(type);
  if (type === 'FRAME' || type === 'COMPONENT') { n.name = spec.name || (type === 'FRAME' ? 'Frame' : 'Component'); if (spec.fill === undefined && spec.fills === undefined && type === 'COMPONENT') n.fills = []; }
  if (t === 'image') n.name = 'Image';
  if (t === 'circle') n.name = 'Circle';
  if (t === 'triangle') n.pointCount = 3;
  if (type === 'TEXT') { n.characters = String(spec.text ?? spec.characters ?? ''); n.name = n.characters.slice(0, 40) || 'Text'; }
  if (type === 'VECTOR' && (t === 'line' || t === 'arrow')) { n.name = t === 'arrow' ? 'Arrow' : 'Line'; n.strokeCap = 'ROUND'; if (t === 'arrow') { n.endCap = 'ARROW_LINES'; n.strokeWidth = 2; } }
  if (type === 'GROUP' || type === 'BOOLEAN') { n.w = 1; n.h = 1; }
  addNode(n, parentId, index);
  if (type === 'GROUP' || type === 'BOOLEAN') {
    const kidsSpec = spec.children || [];
    if (!kidsSpec.length) { removeNode(n.id); throw aiErr('invalid_argument', `a ${t} needs children`); }
    n.x = +spec.x || 0; n.y = +spec.y || 0; n.w = 1; n.h = 1;
    kidsSpec.forEach(c => aiCreateNode(c, n.id));
    applySpec(n, Object.assign({}, spec, { children: undefined, x: undefined, y: undefined, w: undefined, h: undefined, width: undefined, height: undefined }), true);
    if (type === 'BOOLEAN' && !(spec.fill || spec.fills)) { const first = kids(n)[0]; if (first && first.fills) n.fills = clone(first.fills); }
    return n;
  }
  applySpec(n, spec, true);
  if (spec.children) {
    if (!CONTAINERS.has(type)) throw aiErr('invalid_argument', `a ${t} can't have children`);
    spec.children.forEach(c => aiCreateNode(c, n.id));
  }
  return n;
}
function applyOverrides(inst, ov) {
  const entries = Array.isArray(ov) ? ov.map(o => [o.name || o.id, o]) : Object.entries(ov);
  for (const [key, props] of entries) {
    const target = descendants(inst).find(d => d.id === key || d.name === key || (d.type === 'TEXT' && d.characters === key));
    if (!target) throw aiErr('not_found', `override target "${key}" isn't a layer inside ${inst.name}`);
    const p = typeof props === 'string' ? { text: props } : props;
    applySpec(target, Object.assign({}, p, { name: p.rename, id: undefined }), false);
  }
}
const GEO_KEYS = new Set(['x', 'y', 'w', 'h', 'width', 'height', 'rotation', 'from', 'to', 'path']);
function applySpec(n, s, isCreate) {
  const set = (k, v) => { n[k] = v; markOverride(n, k); };
  const inst = !!n.mainRef;
  if (inst) for (const k of GEO_KEYS) if (s[k] !== undefined) throw aiErr('invalid_argument', `${k}: layers inside an instance follow the main component — change it there, or detach the instance`);
  if (s.name !== undefined && s.name !== null) set('name', String(s.name));
  if (s.visible !== undefined) set('visible', !!s.visible);
  if (s.locked !== undefined) set('locked', !!s.locked);
  if (s.opacity !== undefined) { let o = typeof s.opacity === 'string' && s.opacity.endsWith('%') ? parseFloat(s.opacity) / 100 : +s.opacity; set('opacity', clamp(o, 0, 1)); }
  if (s.blend !== undefined) set('blendMode', String(s.blend).toUpperCase().replace(/-/g, '_'));
  // text first, so hug sizing measures the right string
  if (n.type === 'TEXT') {
    if (s.text !== undefined || s.characters !== undefined) { set('characters', String(s.text ?? s.characters)); if (isCreate && !s.name) n.name = n.characters.slice(0, 40) || 'Text'; }
    const f = Object.assign({}, s.font || {});
    ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'italic'].forEach(k => { if (s[k] !== undefined) f[k.replace('font', '').replace(/^./, c => c.toLowerCase())] = s[k]; });
    if (f.family !== undefined) { set('fontFamily', String(f.family)); ensureFont(n.fontFamily); }
    if (f.size !== undefined) set('fontSize', clamp(+f.size, 1, 2000));
    if (f.weight !== undefined) set('fontWeight', ({ thin: 100, light: 300, regular: 400, normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 })[String(f.weight).toLowerCase()] || +f.weight);
    if (f.italic !== undefined) set('italic', !!f.italic);
    if (f.lineHeight !== undefined) { const v = f.lineHeight; set('lineHeight', v === 'auto' || v === null ? { u: 'AUTO', v: 0 } : String(v).endsWith('%') ? { u: '%', v: parseFloat(v) } : { u: 'PX', v: +v }); }
    if (f.letterSpacing !== undefined) set('letterSpacing', +f.letterSpacing);
    if (s.textAlign !== undefined) set('textAlign', en('textAlign', s.textAlign, 'textAlign'));
    if (s.verticalAlign !== undefined) set('verticalAlign', en('vAlign', s.verticalAlign, 'verticalAlign'));
    if (s.textCase !== undefined) set('textCase', en('textCase', s.textCase, 'textCase'));
    if (s.decoration !== undefined) set('textDecoration', en('deco', s.decoration, 'decoration'));
    if (s.color !== undefined) { set('fills', specPaints(s.color)); delete n.fillStyle; }
    if (isCreate && s.w === undefined && s.width === undefined && s.sizing === undefined) { n.sizingH = 'HUG'; n.sizingV = 'HUG'; }
  }
  // sizing
  const sz = s.sizing;
  if (sz !== undefined) {
    if (typeof sz === 'string') { const v = en('sizing', sz, 'sizing'); n.sizingH = n.sizingV = v; }
    else { if (sz.w !== undefined || sz.width !== undefined) n.sizingH = en('sizing', sz.w ?? sz.width, 'sizing.w'); if (sz.h !== undefined || sz.height !== undefined) n.sizingV = en('sizing', sz.h ?? sz.height, 'sizing.h'); }
    if (n.type === 'TEXT' && n.sizingH === 'HUG') n.sizingV = 'HUG';
  }
  // geometry
  const W = s.w ?? s.width, H = s.h ?? s.height;
  if (typeof W === 'string' && ENUM.sizing[W.toLowerCase()]) { n.sizingH = en('sizing', W, 'w'); } else if (W !== undefined) {
    const v = Math.max(+W, n.type === 'VECTOR' ? 0 : 0.01); if (!isFinite(v)) throw aiErr('invalid_argument', 'w must be a number');
    if (isCreate) n.w = v; else resizeNode(n, v, n.h);
    if (sz === undefined || (typeof sz === 'object' && sz.w === undefined)) { if (n.sizingH !== 'FIXED' && !(typeof sz === 'string')) n.sizingH = 'FIXED'; }
    if (n.type === 'TEXT' && n.sizingV === 'HUG' && H === undefined) n.sizingV = 'HUG';
  }
  if (typeof H === 'string' && ENUM.sizing[H.toLowerCase()]) { n.sizingV = en('sizing', H, 'h'); } else if (H !== undefined) {
    const v = Math.max(+H, n.type === 'VECTOR' ? 0 : 0.01); if (!isFinite(v)) throw aiErr('invalid_argument', 'h must be a number');
    if (isCreate) n.h = v; else resizeNode(n, n.w, v);
    if (sz === undefined || (typeof sz === 'object' && sz.h === undefined)) { if (n.sizingV !== 'FIXED' && !(typeof sz === 'string')) n.sizingV = 'FIXED'; }
  }
  if (s.x !== undefined) { if (!isFinite(+s.x)) throw aiErr('invalid_argument', 'x must be a number'); n.x = +s.x; }
  if (s.y !== undefined) { if (!isFinite(+s.y)) throw aiErr('invalid_argument', 'y must be a number'); n.y = +s.y; }
  if (s.rotation !== undefined) set('rotation', normAngle(-(+s.rotation || 0)));
  if (s.flipX !== undefined) n.flipX = !!s.flipX; if (s.flipY !== undefined) n.flipY = !!s.flipY;
  // vectors
  if (n.type === 'VECTOR') {
    if (s.path !== undefined) {
      const ps = Array.isArray(s.path) ? s.path : parsePathD(s.path);
      if (!ps.length) throw aiErr('invalid_argument', 'path: no drawable segments in that path data');
      n.paths = ps; if (isCreate && s.x === undefined) { n.x = 0; n.y = 0; } n.w = 0; n.h = 0; const b = pathsBBox(n.paths); n.paths = shiftPaths(n.paths, -b.x, -b.y); n.x += b.x; n.y += b.y; n.w = b.w; n.h = b.h;
      if (isCreate && s.fill === undefined && s.fills === undefined && ps.some(p => p.closed) && s.stroke === undefined) { n.fills = [solid('#1E1E1E')]; n.strokes = []; }
    }
    if (s.from !== undefined || s.to !== undefined) {
      const from = s.from || [n.x, n.y], to = s.to || [n.x + n.w, n.y + n.h];
      n.rotation = 0; n.x = Math.min(from[0], to[0]); n.y = Math.min(from[1], to[1]);
      n.paths = [{ closed: false, pts: [pt(from[0] - n.x, from[1] - n.y), pt(to[0] - n.x, to[1] - n.y)] }];
      n.w = Math.abs(to[0] - from[0]); n.h = Math.abs(to[1] - from[1]);
    }
    if (isCreate && !n.paths.length) throw aiErr('invalid_argument', 'vectors need "path" (SVG path data); lines and arrows need "from" and "to"');
    if (s.startMarker !== undefined) set('startCap', en('marker', s.startMarker, 'startMarker'));
    if (s.endMarker !== undefined) set('endCap', en('marker', s.endMarker, 'endMarker'));
    if (s.fillRule !== undefined) n.fillRule = s.fillRule === 'evenodd' ? 'evenodd' : 'nonzero';
  }
  // paints
  if (s.fill !== undefined || s.fills !== undefined) { set('fills', specPaints(s.fill !== undefined ? s.fill : s.fills)); delete n.fillStyle; }
  if (s.image !== undefined) { set('fills', [specPaint({ type: 'image', src: s.image, fit: s.imageFit || s.fit || 'fill' })]); }
  if (s.stroke !== undefined || s.strokes !== undefined) { set('strokes', specPaints(s.stroke !== undefined ? s.stroke : s.strokes)); delete n.strokeStyle; if (n.strokes.length && !n.strokeWidth) n.strokeWidth = 1; }
  if (s.strokeWidth !== undefined) set('strokeWidth', Math.max(0, +s.strokeWidth));
  if (s.strokeAlign !== undefined) set('strokeAlign', en('strokeAlign', s.strokeAlign, 'strokeAlign'));
  if (s.dash !== undefined) set('strokeDash', !s.dash ? 0 : Array.isArray(s.dash) ? s.dash.map(Number) : [+s.dash, +s.dash]);
  if (s.strokeCap !== undefined) set('strokeCap', en('cap', s.strokeCap, 'strokeCap'));
  if (s.strokeJoin !== undefined) set('strokeJoin', en('join', s.strokeJoin, 'strokeJoin'));
  if (s.fillStyle !== undefined) { const st = findStyle(s.fillStyle, 'COLOR'); set('fillStyle', st.id); n.fills = clone(st.paints); }
  if (s.strokeStyle !== undefined) { const st = findStyle(s.strokeStyle, 'COLOR'); set('strokeStyle', st.id); n.strokes = clone(st.paints); }
  if (s.textStyle !== undefined && n.type === 'TEXT') { const st = findStyle(s.textStyle, 'TEXT'); set('textStyle', st.id); Object.assign(n, clone(st.props)); }
  // shape details
  if (s.radius !== undefined) {
    if (!(n.type === 'RECT' || isFrameLike(n))) throw aiErr('invalid_argument', 'radius applies to rectangles, frames, components and instances');
    if (Array.isArray(s.radius)) { set('cornerRadii', s.radius.slice(0, 4).map(v => Math.max(0, +v || 0))); } else { set('cornerRadius', Math.max(0, +s.radius || 0)); n.cornerRadii = null; }
  }
  if (s.points !== undefined) set('pointCount', clamp(Math.round(+s.points), 3, 60));
  if (s.innerRadius !== undefined) set('innerRadius', clamp(+s.innerRadius, 0.01, 1));
  if (s.effects !== undefined || s.shadow !== undefined || s.blur !== undefined) {
    let fx = s.effects !== undefined ? effectsIn(s.effects, n) : (n.effects || []).filter(e => !(s.shadow !== undefined && e.type !== 'LAYER_BLUR') && !(s.blur !== undefined && e.type === 'LAYER_BLUR'));
    if (s.effects === undefined && s.shadow) fx = fx.concat(effectsIn(s.shadow, n));
    if (s.effects === undefined && s.blur) fx = fx.concat([{ type: 'LAYER_BLUR', blur: +s.blur, visible: true }]);
    set('effects', fx);
  }
  // frames
  if (isFrameLike(n)) {
    if (s.clip !== undefined) set('clipsContent', !!s.clip);
    if (s.layout !== undefined) {
      const L = s.layout;
      if (L === null || L === false || L === 'none' || L.mode === 'none') set('layoutMode', 'NONE');
      else {
        const lo = typeof L === 'string' ? { mode: L } : L;
        if (lo.mode !== undefined || lo.direction !== undefined) { const m = String(lo.mode || lo.direction).toLowerCase(); set('layoutMode', m === 'row' || m === 'horizontal' ? 'HORIZONTAL' : m === 'column' || m === 'vertical' ? 'VERTICAL' : (() => { throw aiErr('invalid_argument', 'layout.mode must be row, column or none'); })()); }
        else if (!isAuto(n)) set('layoutMode', 'VERTICAL');
        if (lo.gap !== undefined) { if (lo.gap === 'auto') n.primaryAlign = 'SPACE_BETWEEN'; else set('itemSpacing', +lo.gap); }
        if (lo.padding !== undefined) { const p = lo.padding; set('padding', typeof p === 'number' ? [p, p, p, p] : p.length === 2 ? [p[0], p[1], p[0], p[1]] : p.length === 4 ? p.map(Number) : (() => { throw aiErr('invalid_argument', 'layout.padding is a number, [vertical, horizontal] or [top, right, bottom, left]'); })()); }
        if (lo.align !== undefined) set('primaryAlign', en('align', lo.align, 'layout.align'));
        if (lo.crossAlign !== undefined) set('counterAlign', en('align', lo.crossAlign, 'layout.crossAlign'));
        if (isCreate && s.sizing === undefined && W === undefined) n.sizingH = 'HUG';
        if (isCreate && s.sizing === undefined && H === undefined) n.sizingV = 'HUG';
      }
    }
  }
  if (s.constraints !== undefined) { const c = s.constraints; set('constraints', { h: c.h !== undefined ? en('conH', c.h, 'constraints.h') : (n.constraints?.h || 'LEFT'), v: c.v !== undefined ? en('conV', c.v, 'constraints.v') : (n.constraints?.v || 'TOP') }); }
  if (s.absolute !== undefined) set('absolute', !!s.absolute);
  if (s.isMask !== undefined) set('isMask', !!s.isMask);
  if (s.op !== undefined && n.type === 'BOOLEAN') { set('booleanOp', en('bool', s.op, 'op')); n.bkey = null; }
  if (s.description !== undefined && n.type === 'COMPONENT') n.description = String(s.description);
  if (s.link !== undefined) {
    if (!s.link) set('reactions', []);
    else { const L = typeof s.link === 'string' ? { to: s.link } : s.link; const dest = L.to === 'back' ? null : resolveNode(L.to, 'link.to'); set('reactions', [{ trigger: 'CLICK', action: L.to === 'back' ? 'BACK' : 'NAVIGATE', dest: dest ? dest.id : null, transition: en('transition', L.transition || 'dissolve', 'link.transition'), duration: +(L.duration ?? 300) }]); }
  }
  if (s.export !== undefined) n.exportSettings = (Array.isArray(s.export) ? s.export : [s.export]).map(e => ({ scale: +(e.scale || 1), format: String(e.format || 'png').toUpperCase() }));
  if (s.raw && typeof s.raw === 'object') for (const k in s.raw) if (!['id', 'parent', 'children', 'type', 'mainRef'].includes(k)) set(k, clone(s.raw[k]));
}
function findStyle(ref, type) {
  const st = root().styles || {};
  const hit = st[ref] || Object.values(st).find(x => x.name.toLowerCase() === String(ref).toLowerCase());
  if (!hit || hit.type !== type) throw aiErr('not_found', `${type === 'COLOR' ? 'color' : 'text'} style "${ref}" not found — list_styles shows what exists`);
  return hit;
}

/* ---------- nodes -> spec ---------- */
function nodeToSpec(n, opts = {}, depth = 0) {
  const o = {};
  o.type = n.type === 'VECTOR' && isLineNode(n) ? (n.endCap && n.endCap !== 'NONE' ? 'arrow' : 'line') : (n.type === 'RECT' && (n.fills || []).length === 1 && n.fills[0].type === 'IMAGE' ? 'image' : TYPE_TO_SPEC[n.type]);
  if (opts.ids !== false) o.id = n.id;
  o.name = n.name;
  if (n.type === 'TEXT') o.text = n.characters;
  if (n.type === 'INSTANCE') { const m = N(n.componentId); o.component = n.componentId; if (m) o.componentName = m.name; }
  if (n.mainRef && opts.ids !== false) o.inInstance = true;
  if (o.type === 'line' || o.type === 'arrow') {
    const m = localMatrix(n); const [a, b] = n.paths[0].pts.map(p => M.apply(m, p));
    o.from = [round(a.x, 2), round(a.y, 2)]; o.to = [round(b.x, 2), round(b.y, 2)];
  } else { o.x = round(n.x, 2); o.y = round(n.y, 2); o.w = round(n.w, 2); o.h = round(n.h, 2); }
  if (opts.abs) { const b = worldBox(n); o.abs = [round(b.x, 1), round(b.y, 1), round(b.w, 1), round(b.h, 1)]; }
  if (n.rotation) o.rotation = round(-n.rotation, 2);
  if (n.flipX) o.flipX = true; if (n.flipY) o.flipY = true;
  if (!n.visible) o.visible = false; if (n.locked) o.locked = true;
  if ((n.opacity ?? 1) < 1) o.opacity = round(n.opacity, 3);
  if (n.blendMode && n.blendMode !== 'NORMAL' && n.blendMode !== 'PASS_THROUGH') o.blend = n.blendMode.toLowerCase().replace(/_/g, '-');
  const sizes = {};
  if (n.sizingH && n.sizingH !== 'FIXED') sizes.w = n.sizingH.toLowerCase();
  if (n.sizingV && n.sizingV !== 'FIXED') sizes.h = n.sizingV.toLowerCase();
  if (Object.keys(sizes).length) o.sizing = sizes;
  if (n.type === 'TEXT') {
    const lh = n.lineHeight || { u: 'AUTO' };
    o.font = { family: n.fontFamily, size: n.fontSize, weight: n.fontWeight || 400 };
    if (n.italic) o.font.italic = true;
    if (lh.u !== 'AUTO') o.font.lineHeight = lh.u === '%' ? lh.v + '%' : lh.v;
    if (n.letterSpacing) o.font.letterSpacing = n.letterSpacing;
    if (n.textAlign && n.textAlign !== 'LEFT') o.textAlign = ENUM_OUT.textAlign[n.textAlign];
    if (n.verticalAlign && n.verticalAlign !== 'TOP') o.verticalAlign = ENUM_OUT.vAlign[n.verticalAlign];
    if (n.textCase && n.textCase !== 'ORIGINAL') o.textCase = ENUM_OUT.textCase[n.textCase];
    if (n.textDecoration && n.textDecoration !== 'NONE') o.decoration = ENUM_OUT.deco[n.textDecoration];
    const f = n.fills || [];
    if (f.length === 1 && f[0].type === 'SOLID' && f[0].visible !== false) o.color = colorOut(f[0].color, f[0].opacity ?? 1); else { const fo = paintsOut(f, opts); if (fo !== undefined) o.fill = fo; }
    if (n.textStyle && root().styles?.[n.textStyle]) o.textStyle = root().styles[n.textStyle].name;
  } else if (n.type !== 'GROUP') {
    const fo = paintsOut(n.fills, opts); if (fo !== undefined) o.fill = fo;
    else if (['FRAME', 'COMPONENT', 'RECT', 'ELLIPSE', 'POLYGON', 'STAR', 'BOOLEAN'].includes(n.type)) o.fill = null;   // these get a default fill when created
    if (o.type === 'image') { delete o.fill; const p = n.fills[0]; o.image = opts.images && D.images[p.imageRef] ? D.images[p.imageRef].data : p.imageRef; if (p.scaleMode && p.scaleMode !== 'FILL') o.imageFit = ENUM_OUT.fit[p.scaleMode]; }
  }
  if (n.fillStyle && root().styles?.[n.fillStyle]) o.fillStyle = root().styles[n.fillStyle].name;
  const so = paintsOut(n.strokes, opts);
  if (so === undefined && n.type === 'VECTOR') o.stroke = null;   // vectors get a default stroke when created
  if (so !== undefined) {
    o.stroke = so; o.strokeWidth = n.strokeWidth;
    if (n.type !== 'VECTOR' && n.strokeAlign && n.strokeAlign !== 'INSIDE') o.strokeAlign = n.strokeAlign.toLowerCase();
    if (n.strokeDash && (Array.isArray(n.strokeDash) ? n.strokeDash[0] : n.strokeDash)) o.dash = n.strokeDash;
    if (n.type === 'VECTOR') { if (n.strokeCap && n.strokeCap !== 'NONE') o.strokeCap = n.strokeCap.toLowerCase(); if (n.strokeJoin && n.strokeJoin !== 'MITER') o.strokeJoin = n.strokeJoin.toLowerCase(); if (n.startCap && n.startCap !== 'NONE') o.startMarker = ENUM_OUT.marker[n.startCap]; if (n.endCap && n.endCap !== 'NONE' && o.type !== 'arrow') o.endMarker = ENUM_OUT.marker[n.endCap]; }
  }
  if (n.type === 'RECT' || isFrameLike(n)) { if (n.cornerRadii) o.radius = n.cornerRadii.slice(); else if (n.cornerRadius) o.radius = n.cornerRadius; }
  if (n.type === 'POLYGON' || n.type === 'STAR') o.points = n.pointCount;
  if (n.type === 'STAR') o.innerRadius = round(n.innerRadius ?? 0.38, 3);
  if (n.type === 'VECTOR' && !(o.type === 'line' || o.type === 'arrow')) { o.path = pathsToD(n.paths || []); if (n.fillRule === 'evenodd') o.fillRule = 'evenodd'; }
  if (n.type === 'BOOLEAN') o.op = n.booleanOp.toLowerCase();
  const fx = effectsOut(n.effects); if (fx) o.effects = fx;
  if (isFrameLike(n)) {
    if (!n.clipsContent) o.clip = false;
    if (isAuto(n)) {
      const p = n.padding || [0, 0, 0, 0];
      o.layout = { mode: n.layoutMode === 'HORIZONTAL' ? 'row' : 'column', gap: n.primaryAlign === 'SPACE_BETWEEN' ? 'auto' : n.itemSpacing };
      o.layout.padding = p.every(v => v === p[0]) ? p[0] : (p[0] === p[2] && p[1] === p[3] ? [p[0], p[1]] : p.slice());
      if (n.primaryAlign && n.primaryAlign !== 'MIN' && n.primaryAlign !== 'SPACE_BETWEEN') o.layout.align = ENUM_OUT.align[n.primaryAlign];
      if (n.counterAlign && n.counterAlign !== 'MIN') o.layout.crossAlign = ENUM_OUT.align[n.counterAlign];
    }
  }
  const par = parentOf(n);
  if (par && isFrameLike(par) && (!isAuto(par) || n.absolute)) { const c = n.constraints || {}; if ((c.h && c.h !== 'LEFT') || (c.v && c.v !== 'TOP')) o.constraints = { h: ENUM_OUT.conH[c.h || 'LEFT'], v: ENUM_OUT.conV[c.v || 'TOP'] }; }
  if (n.absolute) o.absolute = true;
  if (n.isMask) o.isMask = true;
  if (n.type === 'COMPONENT' && n.description) o.description = n.description;
  if (n.reactions && n.reactions.length) { const r = n.reactions[0]; o.link = r.action === 'BACK' ? { to: 'back', transition: ENUM_OUT.transition[r.transition] } : { to: r.dest, transition: ENUM_OUT.transition[r.transition] }; }
  if (n.type === 'INSTANCE' && !opts.expandInstances) {
    const ov = {}; descendants(n).forEach(d => { if ((d.overrides || []).length) { const sp = {}; d.overrides.forEach(k => { if (k === 'characters') sp.text = d.characters; else if (k === 'fills') sp.fill = paintsOut(d.fills, opts) ?? null; else if (k === 'visible') sp.visible = d.visible; else if (k === 'strokes') sp.stroke = paintsOut(d.strokes, opts) ?? null; }); if (Object.keys(sp).length) ov[d.name] = sp; } });
    if (Object.keys(ov).length) o.overrides = ov;
    return o;
  }
  if (n.children && n.type !== 'BOOLEAN' || (n.type === 'BOOLEAN' && opts.booleanChildren !== false)) {
    const maxDepth = opts.depth === undefined ? Infinity : opts.depth;
    if (n.children && n.children.length) {
      if (depth < maxDepth) o.children = kids(n).filter(c => opts.hidden !== false || c.visible).map(c => nodeToSpec(c, opts, depth + 1));
      else o.childCount = n.children.length;
    }
  }
  return o;
}

/* ---------- outline (token-cheap markdown) ---------- */
function outlineLine(n) {
  const b = [];
  const t = n.type === 'VECTOR' && isLineNode(n) ? 'line' : TYPE_TO_SPEC[n.type];
  if (n.type === 'TEXT') return `"${n.characters.replace(/\n/g, ' ⏎ ').slice(0, 120)}" text ${n.fontFamily} ${n.fontSize}/${n.fontWeight}${(n.fills || [])[0]?.type === 'SOLID' ? ' ' + colorOut(n.fills[0].color, n.fills[0].opacity) : ''} [${n.id}]`;
  b.push(`${n.name} — ${t}${n.type === 'INSTANCE' && N(n.componentId) ? ' of ' + N(n.componentId).name : ''} ${fmt(n.w)}×${fmt(n.h)}`);
  if (isAuto(n)) { const p = n.padding; b.push(`${n.layoutMode === 'HORIZONTAL' ? 'row' : 'column'} gap ${n.primaryAlign === 'SPACE_BETWEEN' ? 'auto' : n.itemSpacing} pad ${p.every(v => v === p[0]) ? p[0] : p.join('/')}`); }
  const sz = []; if (n.sizingH && n.sizingH !== 'FIXED') sz.push('w ' + n.sizingH.toLowerCase()); if (n.sizingV && n.sizingV !== 'FIXED') sz.push('h ' + n.sizingV.toLowerCase()); if (sz.length) b.push(sz.join(' '));
  const f = (n.fills || []).filter(p => p.visible !== false); if (f.length && n.type !== 'GROUP') b.push('fill ' + f.map(p => p.type === 'SOLID' ? colorOut(p.color, p.opacity) : p.type.toLowerCase()).join('+'));
  const s = (n.strokes || []).filter(p => p.visible !== false); if (s.length) b.push(`stroke ${n.strokeWidth} ${s[0].type === 'SOLID' ? colorOut(s[0].color, s[0].opacity) : s[0].type.toLowerCase()}`);
  if (n.cornerRadius || n.cornerRadii) b.push('radius ' + (n.cornerRadii ? n.cornerRadii.join('/') : n.cornerRadius));
  if ((n.effects || []).length) b.push(n.effects.map(e => e.type.toLowerCase().replace('_', '-')).join('+'));
  if (!n.visible) b.push('hidden');
  if (n.reactions?.length) b.push('→ ' + (n.reactions[0].action === 'BACK' ? 'back' : N(n.reactions[0].dest)?.name || '?'));
  return b.join(', ') + ` [${n.id}]`;
}
function outlineOf(ids, maxDepth = 12) {
  const lines = [];
  const walk = (n, d) => { lines.push('  '.repeat(d) + '- ' + outlineLine(n)); if (n.children && n.type !== 'BOOLEAN' && d < maxDepth) kids(n).forEach(c => walk(c, d + 1)); };
  ids.map(N).filter(Boolean).forEach(n => walk(n, 0));
  return lines.join('\n');
}

/* ---------- design tokens ---------- */
function designTokens() {
  const st = Object.values(root().styles || {});
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'token';
  const tokens = { color: {}, typography: {} };
  st.filter(s => s.type === 'COLOR').forEach(s => { const p = s.paints[s.paints.length - 1]; tokens.color[slug(s.name)] = { $type: 'color', $value: p.type === 'SOLID' ? colorOut(p.color, p.opacity) : paintOut(p) }; });
  st.filter(s => s.type === 'TEXT').forEach(s => { const p = s.props; const lh = p.lineHeight || { u: 'AUTO' }; tokens.typography[slug(s.name)] = { $type: 'typography', $value: { fontFamily: p.fontFamily, fontSize: p.fontSize + 'px', fontWeight: p.fontWeight, lineHeight: lh.u === 'AUTO' ? 'normal' : lh.u === '%' ? lh.v / 100 : lh.v + 'px', letterSpacing: (p.letterSpacing || 0) + 'px' } }; });
  // colours used in the file that aren't styles yet
  const counts = new Map();
  Object.values(D.nodes).forEach(n => paintsOf(n).forEach(p => { if (p.type === 'SOLID' && p.visible !== false) counts.set(colorOut(p.color, p.opacity ?? 1), (counts.get(colorOut(p.color, p.opacity ?? 1)) || 0) + 1); }));
  const styled = new Set(Object.values(tokens.color).map(t => t.$value));
  const used = [...counts.entries()].filter(([c]) => !styled.has(c)).sort((a, b) => b[1] - a[1]).slice(0, 24);
  if (used.length) tokens.palette = Object.fromEntries(used.map(([c, k], i) => ['c' + (i + 1), { $type: 'color', $value: c, $description: `used ${k}×` }]));
  let css = ':root {\n';
  for (const [k, t] of Object.entries(tokens.color)) if (typeof t.$value === 'string') css += `  --color-${k}: ${t.$value};\n`;
  for (const [k, t] of Object.entries(tokens.typography)) { const v = t.$value; css += `  --font-${k}: ${v.fontWeight} ${v.fontSize}/${v.lineHeight} '${v.fontFamily}';\n`; if (v.letterSpacing !== '0px') css += `  --tracking-${k}: ${v.letterSpacing};\n`; }
  css += '}\n';
  return { tokens, css };
}

/* ---------- HTML/CSS export ---------- */
function htmlExport(id, opts = {}) {
  const rootN = N(id);
  let css = '', html = '', k = 0;
  const fams = new Set();
  const cls = n => { const base = String(n.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || TYPE_TO_SPEC[n.type]; return `${/^[a-z]/.test(base) ? base : 'n-' + base}-${(++k).toString(36)}`; };
  const rgbaOf = (c, a) => rgba(c, a);
  const bgOf = (fills) => {
    const layers = visPaints(fills).slice().reverse().map(p => {
      if (p.type === 'SOLID') return `linear-gradient(${rgbaOf(p.color, p.opacity ?? 1)}, ${rgbaOf(p.color, p.opacity ?? 1)})`;
      if (p.type === 'LINEAR') return `linear-gradient(${round((p.angle ?? 90) + 90, 2)}deg, ${p.stops.map(s => `${rgbaOf(s.color, (s.opacity ?? 1) * (p.opacity ?? 1))} ${round(s.pos * 100, 2)}%`).join(', ')})`;
      if (p.type === 'RADIAL') return `radial-gradient(${p.stops.map(s => `${rgbaOf(s.color, (s.opacity ?? 1) * (p.opacity ?? 1))} ${round(s.pos * 100, 2)}%`).join(', ')})`;
      if (p.type === 'IMAGE' && D.images[p.imageRef]) return `url("${D.images[p.imageRef].data}") center / ${p.scaleMode === 'FIT' ? 'contain' : p.scaleMode === 'STRETCH' ? '100% 100%' : p.scaleMode === 'TILE' ? 'auto' : 'cover'} ${p.scaleMode === 'TILE' ? 'repeat' : 'no-repeat'}`;
      return null;
    }).filter(Boolean);
    if (layers.length === 1 && layers[0].startsWith('linear-gradient(rgba') && /^linear-gradient\((rgba\([^)]*\)), \1\)$/.test(layers[0])) return layers[0].match(/^linear-gradient\((rgba\([^)]*\))/)[1];
    return layers.join(', ');
  };
  const shadowOf = (n, text) => (n.effects || []).filter(e => e.visible !== false && e.type !== 'LAYER_BLUR' && (!text || e.type === 'DROP_SHADOW')).map(e => `${e.type === 'INNER_SHADOW' ? 'inset ' : ''}${fmt(e.x)}px ${fmt(e.y)}px ${fmt(e.blur)}px${text ? '' : ` ${fmt(e.spread || 0)}px`} ${rgbaOf(e.color, e.opacity ?? 0.25)}`).join(', ');
  const box = (n, parent, isRoot) => {
    const r = [];
    const inFlow = parent && isAuto(parent) && !n.absolute;
    if (isRoot) { r.push('position: relative', `width: ${fmt(n.w)}px`, `height: ${fmt(n.h)}px`); }
    else if (inFlow) {
      const H = parent.layoutMode === 'HORIZONTAL';
      r.push('position: relative', 'flex-shrink: 0');
      const main = H ? 'sizingH' : 'sizingV', cross = H ? 'sizingV' : 'sizingH';
      if (n[main] === 'FILL') r.push('flex: 1 1 0', H ? 'min-width: 0' : 'min-height: 0'); else if (n[main] !== 'HUG') r.push(`${H ? 'width' : 'height'}: ${fmt(H ? n.w : n.h)}px`);
      if (n[cross] === 'FILL') r.push('align-self: stretch'); else if (n[cross] !== 'HUG') r.push(`${H ? 'height' : 'width'}: ${fmt(H ? n.h : n.w)}px`);
    } else {
      r.push('position: absolute', `left: ${fmt(n.x)}px`, `top: ${fmt(n.y)}px`);
      if (!(n.type === 'TEXT' && n.sizingH === 'HUG')) r.push(`width: ${fmt(n.w)}px`);
      if (!(n.type === 'TEXT' && n.sizingV === 'HUG')) r.push(`height: ${fmt(n.h)}px`);
    }
    const tf = []; if (n.rotation) tf.push(`rotate(${round(n.rotation, 3)}deg)`); if (n.flipX) tf.push('scaleX(-1)'); if (n.flipY) tf.push('scaleY(-1)');
    if (tf.length) r.push(`transform: ${tf.join(' ')}`);
    if ((n.opacity ?? 1) < 1) r.push(`opacity: ${round(n.opacity, 3)}`);
    if (BLEND[n.blendMode]) r.push(`mix-blend-mode: ${BLEND[n.blendMode]}`);
    const blur = (n.effects || []).find(e => e.type === 'LAYER_BLUR' && e.visible !== false); if (blur) r.push(`filter: blur(${fmt(blur.blur / 2)}px)`);
    return r;
  };
  const emit = (n, parent, depth, isRoot) => {
    if (!n.visible) return '';
    const c = cls(n); const pad = '  '.repeat(depth + 1);
    const rules = box(n, parent, isRoot);
    const attrs = ` class="${c}" data-name="${esc(n.name)}"${n.type === 'INSTANCE' && N(n.componentId) ? ` data-component="${esc(N(n.componentId).name)}"` : ''}${n.type === 'COMPONENT' ? ' data-component-main' : ''}`;
    let inner = '', tag = 'div';
    if (n.type === 'TEXT') {
      fams.add(n.fontFamily);
      const lh = n.lineHeight || { u: 'AUTO' };
      rules.push(`margin: 0`, `font-family: '${n.fontFamily}', ${FONT_FALLBACK(n.fontFamily)}`, `font-size: ${fmt(n.fontSize)}px`, `font-weight: ${n.fontWeight || 400}`, `line-height: ${lh.u === 'AUTO' ? '1.21' : lh.u === '%' ? round(lh.v / 100, 4) : fmt(lh.v) + 'px'}`);
      if (n.italic) rules.push('font-style: italic');
      if (n.letterSpacing) rules.push(`letter-spacing: ${fmt(n.letterSpacing)}px`);
      if (n.textAlign && n.textAlign !== 'LEFT') rules.push(`text-align: ${({ CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' })[n.textAlign]}`);
      if (n.textCase && n.textCase !== 'ORIGINAL') rules.push(`text-transform: ${({ UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize' })[n.textCase]}`);
      if (n.textDecoration && n.textDecoration !== 'NONE') rules.push(`text-decoration: ${n.textDecoration === 'UNDERLINE' ? 'underline' : 'line-through'}`);
      rules.push(`white-space: ${n.sizingH === 'HUG' ? 'pre' : 'pre-wrap'}`);
      const f = visPaints(n.fills);
      if (f.length === 1 && f[0].type === 'SOLID') rules.push(`color: ${rgbaOf(f[0].color, f[0].opacity ?? 1)}`);
      else if (f.length) rules.push(`background: ${bgOf(n.fills)}`, '-webkit-background-clip: text', 'background-clip: text', 'color: transparent');
      if (n.verticalAlign && n.verticalAlign !== 'TOP' && n.sizingV !== 'HUG') rules.push('display: flex', 'flex-direction: column', `justify-content: ${n.verticalAlign === 'CENTER' ? 'center' : 'flex-end'}`);
      const ts = shadowOf(n, true); if (ts) rules.push(`text-shadow: ${ts}`);
      tag = n.fontSize >= 24 && n.fontWeight >= 600 ? 'h2' : 'p';
      inner = esc(n.characters);
    } else if (n.type === 'RECT' || n.type === 'ELLIPSE' || isFrameLike(n) || n.type === 'GROUP') {
      if (n.type !== 'GROUP') { const bg = bgOf(n.fills); if (bg) rules.push(`background: ${bg}`); }
      if (n.type === 'ELLIPSE') rules.push('border-radius: 50%');
      else if (n.cornerRadii) rules.push(`border-radius: ${n.cornerRadii.map(v => fmt(v) + 'px').join(' ')}`);
      else if (n.cornerRadius) rules.push(`border-radius: ${fmt(n.cornerRadius)}px`);
      const s = visPaints(n.strokes)[0];
      if (s && n.strokeWidth) {
        const col = s.type === 'SOLID' ? rgbaOf(s.color, s.opacity ?? 1) : rgbaOf(s.stops?.[0]?.color || '#000', 1);
        const dash = n.strokeDash && (Array.isArray(n.strokeDash) ? n.strokeDash[0] : n.strokeDash) ? 'dashed' : 'solid';
        rules.push(`outline: ${fmt(n.strokeWidth)}px ${dash} ${col}`, `outline-offset: ${n.strokeAlign === 'OUTSIDE' ? 0 : n.strokeAlign === 'CENTER' ? fmt(-n.strokeWidth / 2) : fmt(-n.strokeWidth)}px`);
      }
      const sh = shadowOf(n); if (sh) rules.push(`box-shadow: ${sh}`);
      if (isFrameLike(n)) {
        if (n.clipsContent) rules.push('overflow: hidden');
        if (isAuto(n)) {
          const H = n.layoutMode === 'HORIZONTAL', p = n.padding || [0, 0, 0, 0];
          rules.push('display: flex', `flex-direction: ${H ? 'row' : 'column'}`, `padding: ${p.map(v => fmt(v) + 'px').join(' ')}`, 'box-sizing: border-box');
          if (n.primaryAlign === 'SPACE_BETWEEN') rules.push('justify-content: space-between'); else { rules.push(`gap: ${fmt(n.itemSpacing)}px`); if (n.primaryAlign !== 'MIN') rules.push(`justify-content: ${n.primaryAlign === 'CENTER' ? 'center' : 'flex-end'}`); }
          rules.push(`align-items: ${({ MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end' })[n.counterAlign || 'MIN']}`);
        }
      }
      if (n.type === 'RECT' && (n.fills || []).some(p => p.type === 'IMAGE')) { tag = 'div'; rules.push('role-image: 1'); }
      inner = (n.children ? kids(n).map(ch => emit(ch, n, depth + 1, false)).join('') : '');
      if (inner) inner = '\n' + inner + pad;
    } else {
      // vectors, polygons, stars, booleans: inline SVG drawn in the node's own box
      const ctx = mkCtx({ export: true });
      const copy = Object.assign({}, n, { x: 0, y: 0, rotation: 0, flipX: false, flipY: false, opacity: 1, effects: [], blendMode: 'NORMAL' });
      const g = renderNode(copy, ctx);
      const p = Math.ceil((n.strokeWidth || 0) * 2 + 8);
      inner = `<svg width="${fmt(n.w + p * 2)}" height="${fmt(n.h + p * 2)}" viewBox="${-p} ${-p} ${fmt(n.w + p * 2)} ${fmt(n.h + p * 2)}" style="position:absolute;left:${-p}px;top:${-p}px;overflow:visible" aria-hidden="true"><defs>${ctx.defs.join('')}</defs>${g}</svg>`;
    }
    css += `.${c} { ${rules.filter(r => !r.startsWith('role-')).join('; ')}; }\n`;
    return `${pad}<${tag}${attrs}${n.type === 'RECT' && (n.fills || []).some(p => p.type === 'IMAGE') ? ` role="img" aria-label="${esc(n.name)}"` : ''}>${inner}</${tag}>\n`;
  };
  html = emit(rootN, null, 0, true);
  const fontLink = [...fams].filter(f => GFONTS[f]).map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@${GFONTS[f]}`).join('&');
  const doc = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${esc(rootN.name)}</title>\n${fontLink ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fontLink}&display=swap">\n` : ''}<style>\n*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; padding: 24px; background: ${pageOf(rootN)?.bg || '#fff'}; }\n${css}</style>\n</head>\n<body>\n<!-- Exported from Blueline. Auto layout frames are flexbox; other layers are absolutely positioned inside their parent. -->\n${html}</body>\n</html>\n`;
  return { html: doc, css, body: html };
}

/* ---------- region screenshots ---------- */
async function screenshotOf(target, maxSize = 1024, format = 'jpg') {
  let ids, region, bg = null;
  const page = pageNode();
  if (!target || target === 'viewport') { region = viewportWorldBox(); ids = kids(page).filter(n => n.visible).map(n => n.id); bg = page.bg; }
  else if (target === 'page') { ids = kids(page).filter(n => n.visible).map(n => n.id); if (!ids.length) throw aiErr('invalid_argument', 'the page is empty'); const b = exportBounds(ids); region = { x: b.x - 40, y: b.y - 40, w: b.w + 80, h: b.h + 80 }; bg = page.bg; }
  else if (target === 'selection') { ids = topSelection(D.sel.filter(id => N(id))); if (!ids.length) throw aiErr('invalid_argument', 'nothing is selected'); }
  else { const n = resolveNode(target, 'target'); ids = [n.id]; if (!n.visible) throw aiErr('invalid_argument', 'that layer is hidden'); }
  if (!ids.length) throw aiErr('invalid_argument', 'nothing visible to capture');
  const box = region ? { x: Math.floor(region.x), y: Math.floor(region.y), w: Math.ceil(region.w), h: Math.ceil(region.h) } : exportBounds(ids);
  const scale = clamp(Math.min(maxSize / Math.max(box.w, 1), maxSize / Math.max(box.h, 1), 4), 0.02, 4);
  const r = await rasterize(ids, scale, format === 'png' ? 'png' : 'jpg', format === 'png' ? bg : (bg || '#FFFFFF'), box);
  return { blob: r.blob, width: r.w, height: r.h, bounds: box, scale: round(scale, 4), mime: format === 'png' ? 'image/png' : 'image/jpeg' };
}
function blobToB64(blob) { return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); }); }

/* ============================================================
   Tool registry
   ============================================================ */
const S = {
  id: { type: 'string', description: 'Layer id (from get_tree, find_nodes or get_selection)' },
  ids: { type: 'array', items: { type: 'string' }, description: 'Layer ids' },
  spec: { type: 'object', description: 'Layer spec — see get_capabilities.spec for every field. Minimum: {"type":"rect"}.', additionalProperties: true },
};
const AI_TOOLS = [];
const tool = (name, description, props, run, extra = {}) => AI_TOOLS.push(Object.assign({ name, description, inputSchema: { type: 'object', properties: props || {}, required: extra.required || [], additionalProperties: false }, run, readOnly: !!extra.readOnly }, extra));

tool('get_capabilities', 'Start here. Returns the app version, the conventions (units, coordinates, colors), the full layer spec reference, and every tool with its input schema.', {}, () => ({
  app: 'Blueline', version: AI_VERSION, file: root().name,
  conventions: {
    units: 'CSS pixels. x and y are relative to the parent layer; "abs" values in get_tree are page coordinates.',
    rotation: 'degrees, counter-clockwise positive (Figma convention)',
    colors: 'hex strings: "#1F6B4F", or "#1F6B4F80" with alpha',
    autoLayout: 'Children of an auto layout frame are positioned by the layout; their x/y are ignored. Use sizing "fill"/"hug" and layout gap/padding/align instead.',
    instances: 'Layers inside an instance can only take overrides (text, fill, stroke, visible). Edit the main component to change structure.',
    undo: 'Every mutating call is one undo step labelled "AI · <tool>". batch runs several calls as one step.',
    references: 'Inside batch, "$0", "$1"... refer to the id returned by an earlier step.',
  },
  spec: SPEC_REFERENCE,
  tools: AI_TOOLS.map(t => ({ name: t.name, description: t.description, readOnly: t.readOnly, inputSchema: t.inputSchema })),
}), { readOnly: true });
tool('get_document', 'File overview: pages, the current page, components, styles, selection and viewport.', {}, () => ({
  file: root().name, fileId: D.fileId, currentPage: D.page,
  pages: kids(root()).map(p => ({ id: p.id, name: p.name, layers: p.children.length, background: p.bg })),
  components: Object.values(D.nodes).filter(n => n.type === 'COMPONENT').map(c => ({ id: c.id, name: c.name, page: pageOf(c)?.name, w: round(c.w, 2), h: round(c.h, 2), description: c.description || undefined, instances: Object.values(D.nodes).filter(n => n.type === 'INSTANCE' && n.componentId === c.id).length })),
  styles: Object.values(root().styles || {}).map(s => ({ id: s.id, type: s.type.toLowerCase(), name: s.name, value: s.type === 'COLOR' ? paintsOut(s.paints) : s.props })),
  selection: D.sel.map(id => N(id) && { id, name: N(id).name, type: TYPE_TO_SPEC[N(id).type] }).filter(Boolean),
  viewport: Object.assign(viewportWorldBox(), { zoom: round(D.zoom, 4) }),
}), { readOnly: true });
tool('get_tree', 'Layer tree as specs. Without node_id returns the current page\'s top-level layers. Use depth to limit size; deeper layers report childCount.', {
  node_id: S.id, page_id: { type: 'string', description: 'Page to read (defaults to the current page)' },
  depth: { type: 'integer', minimum: 0, maximum: 50, description: 'Child levels to include (default 3)' },
  format: { type: 'string', enum: ['spec', 'outline'], description: 'spec = JSON (default); outline = indented text, cheapest on tokens' },
  include_images: { type: 'boolean', description: 'Embed image data URLs (large). Default false: images are returned as asset refs.' },
}, a => {
  let rootsN;
  if (a.node_id) rootsN = [resolveNode(a.node_id, 'node_id')];
  else { const p = a.page_id ? resolveNode(a.page_id, 'page_id') : pageNode(); if (p.type !== 'PAGE') throw aiErr('invalid_argument', 'page_id must be a page'); rootsN = kids(p); }
  const depth = a.depth ?? 3;
  if (a.format === 'outline') return { outline: outlineOf(rootsN.map(n => n.id), depth) };
  return { layers: rootsN.map(n => nodeToSpec(n, { depth, abs: true, images: !!a.include_images })) };
}, { readOnly: true });
tool('get_nodes', 'Full spec for specific layers, including all children.', { ids: S.ids, include_images: { type: 'boolean' } }, a => ({ layers: (a.ids || []).map(id => nodeToSpec(resolveNode(id), { abs: true, images: !!a.include_images })) }), { readOnly: true, required: ['ids'] });
tool('find_nodes', 'Search layers by name or text content (case-insensitive substring), optionally filtered by type. Searches the current page unless all_pages is true.', {
  query: { type: 'string', description: 'Substring of the layer name or text' }, type: { type: 'string', description: 'frame, text, rect, ellipse, vector, group, component, instance, …' },
  all_pages: { type: 'boolean' }, limit: { type: 'integer', minimum: 1, maximum: 500 },
}, a => {
  const q = (a.query || '').toLowerCase(); const t = a.type ? SPEC_TYPES[String(a.type).toLowerCase()] : null;
  if (a.type && !t) throw aiErr('invalid_argument', `unknown type "${a.type}"`);
  const pool = a.all_pages ? Object.values(D.nodes).filter(n => n.type !== 'DOCUMENT' && n.type !== 'PAGE') : descendants(pageNode());
  const out = pool.filter(n => (!t || n.type === t) && (!q || n.name.toLowerCase().includes(q) || (n.type === 'TEXT' && n.characters.toLowerCase().includes(q)))).slice(0, a.limit || 50);
  return { matches: out.map(n => { const b = worldBox(n); return { id: n.id, type: TYPE_TO_SPEC[n.type], name: n.name, text: n.type === 'TEXT' ? n.characters.slice(0, 200) : undefined, parent: parentOf(n)?.type === 'PAGE' ? null : n.parent, page: pageOf(n)?.name, abs: [round(b.x, 1), round(b.y, 1), round(b.w, 1), round(b.h, 1)] }; }) };
}, { readOnly: true });
tool('get_selection', 'What the designer has selected right now, as specs.', { depth: { type: 'integer', minimum: 0, maximum: 50 } }, a => ({ layers: D.sel.map(N).filter(Boolean).map(n => nodeToSpec(n, { depth: a.depth ?? 2, abs: true })) }), { readOnly: true });
tool('list_components', 'Main components you can instantiate with create {"type":"instance","component":"<id or name>"}.', {}, () => ({ components: Object.values(D.nodes).filter(n => n.type === 'COMPONENT').map(c => ({ id: c.id, name: c.name, page: pageOf(c)?.name, w: c.w, h: c.h, description: c.description || undefined, textLayers: descendants(c).filter(d => d.type === 'TEXT').map(d => d.name) })) }), { readOnly: true });
tool('list_styles', 'Color and text styles. Apply with fillStyle / strokeStyle / textStyle in a spec.', {}, () => ({ styles: Object.values(root().styles || {}).map(s => ({ id: s.id, type: s.type.toLowerCase(), name: s.name, value: s.type === 'COLOR' ? paintsOut(s.paints) : s.props })) }), { readOnly: true });
tool('screenshot', 'Render pixels so you can see the design. target: a layer id, "selection", "page" or "viewport" (default). Over ninja-p2p the image arrives as a file in your inbox; elsewhere it is returned as base64.', {
  target: { type: 'string' }, max_size: { type: 'integer', minimum: 64, maximum: 4096, description: 'Longest side in pixels (default 1024; use 512 to save tokens)' }, format: { type: 'string', enum: ['jpg', 'png'] },
}, async (a, ctx) => {
  const r = await screenshotOf(a.target, a.max_size || 1024, a.format || 'jpg');
  const meta = { width: r.width, height: r.height, mime: r.mime, bounds: r.bounds, scale: r.scale };
  if (ctx && ctx.sendFile) { const name = `blueline-${String(a.target || 'viewport').replace(/[^a-z0-9_-]/gi, '')}-${Date.now().toString(36)}.${a.format === 'png' ? 'png' : 'jpg'}`; await ctx.sendFile(name, r.mime, r.blob); return Object.assign(meta, { file: name, delivered: 'sent as a file transfer' }); }
  return Object.assign(meta, { base64: await blobToB64(r.blob) });
}, { readOnly: true });
tool('export', 'Export layers in an AI- or developer-friendly format. html = standalone HTML+CSS (auto layout becomes flexbox); spec = round-trippable JSON for create; outline = indented text; tokens = design tokens (DTCG JSON + CSS variables); svg; png/jpg = base64 (or a file over ninja-p2p).', {
  ids: S.ids, format: { type: 'string', enum: ['html', 'spec', 'outline', 'tokens', 'svg', 'png', 'jpg'] }, scale: { type: 'number', minimum: 0.1, maximum: 8 },
}, async (a, ctx) => {
  const f = a.format || 'spec';
  const ids = (a.ids && a.ids.length ? a.ids : (D.sel.length ? topSelection(D.sel) : kids(pageNode()).filter(isFrameLike).map(n => n.id)));
  if (f !== 'tokens' && !ids.length) throw aiErr('invalid_argument', 'nothing to export — pass ids or select layers');
  ids.forEach(id => resolveNode(id));
  if (f === 'tokens') return designTokens();
  if (f === 'spec') return { layers: ids.map(id => nodeToSpec(N(id), { abs: false })) };
  if (f === 'outline') return { outline: outlineOf(ids) };
  if (f === 'html') { if (ids.length > 1) return { files: ids.map(id => ({ name: N(id).name + '.html', html: htmlExport(id).html })) }; return { name: N(ids[0]).name + '.html', html: htmlExport(ids[0]).html }; }
  if (f === 'svg') { const css = await embedFontCSS(buildSVG(ids).fams, false); return { svg: buildSVG(ids, { fontCSS: css }).svg }; }
  const r = await rasterize(ids, a.scale || 1, f === 'jpg' ? 'jpg' : 'png');
  const mime = f === 'jpg' ? 'image/jpeg' : 'image/png';
  if (ctx && ctx.sendFile) { const name = N(ids[0]).name.replace(/[^a-z0-9_-]+/gi, '-') + '.' + f; await ctx.sendFile(name, mime, r.blob); return { file: name, width: r.w, height: r.h, mime, delivered: 'sent as a file transfer' }; }
  return { width: r.w, height: r.h, mime, base64: await blobToB64(r.blob) };
}, { readOnly: true });
tool('create', 'Create one layer (with nested children) from a spec. Returns the new id and the ids of every created layer by name path. Frames get a white fill unless you pass fill.', {
  spec: S.spec, parent_id: Object.assign({}, S.id, { description: 'Parent frame/group/component (defaults to the current page)' }), index: { type: 'integer', minimum: 0, description: 'Stacking position inside the parent (0 = bottom; default = top)' },
  select: { type: 'boolean', description: 'Select the result (default true)' },
}, async a => {
  if (!a.spec) throw aiErr('invalid_argument', 'spec is required');
  const p = resolveParent(a.parent_id);
  pendingImages.length = 0;
  const n = aiCreateNode(a.spec, p.id, a.index);
  await Promise.all(pendingImages.splice(0));
  if (a.select !== false) D.sel = [n.id];
  layoutAll();
  const created = {}; const walk = (x, path) => { created[path] = x.id; if (x.type !== 'INSTANCE') kids(x).forEach(c => walk(c, path + '/' + c.name)); }; walk(n, n.name);
  return { id: n.id, created, layer: nodeToSpec(n, { depth: 1, abs: true }) };
}, { required: ['spec'], label: 'create' });
tool('update', 'Change properties on existing layers using spec fields (only the fields you pass change). Works on several layers at once with ids.', {
  id: S.id, ids: S.ids, props: Object.assign({}, S.spec, { description: 'Spec fields to change, e.g. {"fill":"#E5484D","radius":8} or {"text":"New label"}' }),
}, async a => {
  const ids = a.ids || (a.id ? [a.id] : []); if (!ids.length) throw aiErr('invalid_argument', 'pass id or ids');
  if (!a.props || typeof a.props !== 'object') throw aiErr('invalid_argument', 'props is required');
  if (a.props.children) throw aiErr('invalid_argument', 'update does not take children — create them with create and parent_id');
  pendingImages.length = 0;
  ids.forEach(id => { const n = resolveNode(id); if (n.type === 'PAGE') { if (a.props.name) n.name = a.props.name; if (a.props.fill) n.bg = parseColor(a.props.fill).hex; return; } applySpec(n, a.props, false); });
  await Promise.all(pendingImages.splice(0));
  layoutAll();
  return { updated: ids, layers: ids.map(id => nodeToSpec(N(id), { depth: 0, abs: true })) };
}, { label: 'update' });
tool('delete', 'Delete layers (and everything inside them).', { ids: S.ids }, a => {
  const ids = (a.ids || []).map(id => resolveNode(id).id);
  ids.forEach(id => { const n = N(id); if (n && n.mainRef) throw aiErr('invalid_argument', `${n.name} is inside an instance; hide it with update {"visible":false} instead`); });
  topSelection(ids).forEach(removeNode); D.sel = D.sel.filter(id => N(id));
  return { deleted: ids };
}, { required: ['ids'], label: 'delete' });
tool('move', 'Move layers into another parent and/or to a stacking position. Keeps their position on the page unless the new parent uses auto layout.', { ids: S.ids, parent_id: S.id, index: { type: 'integer', minimum: 0 } }, a => {
  const p = resolveParent(a.parent_id); let idx = a.index;
  sortByZ((a.ids || []).map(id => resolveNode(id).id)).forEach(id => {
    const n = N(id); if (n.mainRef) throw aiErr('invalid_argument', `${n.name} is inside an instance`);
    if (n.id === p.id || isAncestor(n, p)) throw aiErr('invalid_argument', `can't move ${n.name} inside itself`);
    if (idx !== undefined && n.parent === p.id && indexInParent(n) < idx) idx--;
    reparent(n, p.id, idx); if (idx !== undefined) idx++;
  });
  return { moved: a.ids, parent: p.id };
}, { required: ['ids'], label: 'move' });
tool('duplicate', 'Duplicate layers in place (top-level frames are placed to the right).', { ids: S.ids }, a => { D.sel = (a.ids || []).map(id => resolveNode(id).id); const out = duplicateNodes(topSelection(D.sel), true); D.sel = out; return { ids: out }; }, { required: ['ids'], label: 'duplicate' });
const selRun = (fn, label) => a => { D.sel = (a.ids || []).map(id => resolveNode(id).id); if (!D.sel.length) throw aiErr('invalid_argument', 'ids is required'); const before = new Set(Object.keys(D.nodes)); const r = fn(a); const created = Object.keys(D.nodes).filter(id => !before.has(id) && !N(id).mainRef); return Object.assign({ selection: D.sel.slice(), created: created.length ? created : undefined }, r || {}); };
tool('group', 'Group layers (they must share a parent).', { ids: S.ids, name: { type: 'string' } }, selRun(a => { const g = cmdGroup(); if (!g) throw aiErr('invalid_argument', 'nothing groupable'); if (a.name) g.name = a.name; return { id: g.id }; }), { required: ['ids'], label: 'group' });
tool('ungroup', 'Ungroup groups, boolean groups or frames, keeping their children.', { ids: S.ids }, selRun(() => cmdUngroup()), { required: ['ids'], label: 'ungroup' });
tool('wrap_in_frame', 'Wrap layers in a new frame. Pass auto_layout: true to get an auto layout frame whose direction and gap are inferred from the layers.', { ids: S.ids, name: { type: 'string' }, auto_layout: { type: 'boolean' } }, selRun(a => { if (a.auto_layout) cmdAutoLayout(); else cmdFrameSelection(); const f = N(D.sel[0]); if (a.name) f.name = a.name; return { id: f.id }; }), { required: ['ids'], label: 'wrap' });
tool('boolean', 'Combine shapes with a boolean operation (the result stays editable).', { ids: S.ids, op: { type: 'string', enum: ['union', 'subtract', 'intersect', 'exclude'] } }, selRun(a => { cmdBoolean(en('bool', a.op || 'union', 'op')); return { id: D.sel[0] }; }), { required: ['ids'], label: 'boolean' });
tool('flatten', 'Flatten shapes, booleans or groups into one vector path.', { ids: S.ids }, selRun(() => { cmdFlatten(); return { id: D.sel[0] }; }), { required: ['ids'], label: 'flatten' });
tool('mask', 'Use the bottom-most layer as a mask for the others (they are grouped).', { ids: S.ids }, selRun(() => { cmdMask(); return { id: D.sel[0] }; }), { required: ['ids'], label: 'mask' });
tool('create_component', 'Turn a frame or group into a main component, or wrap several layers in a new component.', { ids: S.ids, name: { type: 'string' }, description: { type: 'string' } }, selRun(a => { cmdCreateComponent(); const c = N(D.sel[0]); if (a.name) c.name = a.name; if (a.description) c.description = a.description; return { id: c.id }; }), { required: ['ids'], label: 'create component' });
tool('detach_instance', 'Turn instances back into plain frames.', { ids: S.ids }, selRun(() => cmdDetach()), { required: ['ids'], label: 'detach' });
tool('reset_overrides', 'Clear all overrides on an instance.', { id: S.id }, a => { D.sel = [resolveNode(a.id).id]; cmdResetOverrides(); return { id: a.id }; }, { required: ['id'], label: 'reset overrides' });
tool('align', 'Align layers to each other (or a single layer to its parent).', { ids: S.ids, direction: { type: 'string', enum: ['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom'] } }, selRun(a => cmdAlign(a.direction)), { required: ['ids', 'direction'], label: 'align' });
tool('distribute', 'Space three or more layers evenly.', { ids: S.ids, axis: { type: 'string', enum: ['horizontal', 'vertical'] } }, selRun(a => cmdDistribute(a.axis === 'vertical' ? 'v' : 'h')), { required: ['ids'], label: 'distribute' });
tool('reorder', 'Change stacking order.', { ids: S.ids, to: { type: 'string', enum: ['front', 'forward', 'backward', 'back'] } }, selRun(a => cmdZ(a.to || 'front')), { required: ['ids'], label: 'reorder' });
tool('import_svg', 'Import SVG markup as editable vector layers.', { svg: { type: 'string' }, parent_id: S.id, x: { type: 'number' }, y: { type: 'number' } }, a => {
  if (!/<svg[\s>]/i.test(a.svg || '')) throw aiErr('invalid_argument', 'svg must contain an <svg> element');
  if (!hasPaper()) throw aiErr('unavailable', 'the vector engine is still loading — try again in a moment');
  importSVG(a.svg, a.x !== undefined ? { x: a.x, y: a.y || 0 } : undefined, true);
  const n = N(D.sel[0]);
  if (a.x !== undefined) { n.x = a.x; n.y = a.y || 0; }
  if (a.parent_id) { const p = resolveParent(a.parent_id); reparent(n, p.id); }
  return { id: n.id, layer: nodeToSpec(n, { depth: 1 }) };
}, { required: ['svg'], label: 'import svg' });
tool('create_style', 'Create a color style (value = paint) or text style (value = font object).', { type: { type: 'string', enum: ['color', 'text'] }, name: { type: 'string' }, value: { description: 'Paint for color styles; {family,size,weight,lineHeight,letterSpacing} for text styles' } }, a => {
  const st = root().styles = root().styles || {}; const id = 'st' + uid();
  if (a.type === 'text') { const tmp = mkNode('TEXT'); applySpec(tmp, { font: a.value || {} }, true); const props = {}; ['fontFamily', 'fontWeight', 'italic', 'fontSize', 'lineHeight', 'letterSpacing', 'textCase', 'textDecoration'].forEach(k => props[k] = clone(tmp[k])); st[id] = { id, type: 'TEXT', name: a.name || 'Text style', props }; }
  else st[id] = { id, type: 'COLOR', name: a.name || 'Color', paints: specPaints(a.value) };
  return { id };
}, { required: ['type', 'name', 'value'], label: 'create style' });
tool('pages', 'Create, rename, switch to, or delete pages.', { action: { type: 'string', enum: ['create', 'rename', 'switch', 'delete'] }, page_id: { type: 'string' }, name: { type: 'string' } }, a => {
  if (a.action === 'create') { const p = mkNode('PAGE', { name: a.name || 'Page ' + (kids(root()).length + 1) }); addNode(p, 'root'); D.page = p.id; D.sel = []; return { id: p.id }; }
  const p = resolveNode(a.page_id, 'page_id'); if (p.type !== 'PAGE') throw aiErr('invalid_argument', 'page_id must be a page');
  if (a.action === 'rename') { p.name = a.name || p.name; return { id: p.id }; }
  if (a.action === 'switch') { switchPage(p.id); return { id: p.id }; }
  if (a.action === 'delete') { if (kids(root()).length < 2) throw aiErr('invalid_argument', "can't delete the only page"); removeNode(p.id); if (D.page === p.id) D.page = kids(root())[0].id; return { deleted: p.id }; }
  throw aiErr('invalid_argument', 'action must be create, rename, switch or delete');
}, { required: ['action'], label: 'pages' });
tool('select', 'Set the designer\'s selection (and optionally zoom to it) so they can see what you are talking about.', { ids: S.ids, zoom: { type: 'boolean' } }, a => {
  const ns = (a.ids || []).map(id => resolveNode(id)); if (ns.length) { const pg = pageOf(ns[0]); if (pg && pg.id !== D.page) switchPage(pg.id, true); }
  D.sel = ns.map(n => n.id); renderAll(); if (a.zoom && ns.length) zoomToBox(selBox(), 2);
  return { selection: D.sel };
}, { readOnly: true, uiOnly: true });
tool('view', 'Move the designer\'s viewport: zoom to fit the page, to layers, or set zoom.', { fit: { type: 'string', enum: ['page', 'selection'] }, ids: S.ids, zoom: { type: 'number', minimum: 0.02, maximum: 256 } }, a => {
  if (a.ids && a.ids.length) zoomToBox(selBox(a.ids.map(id => resolveNode(id).id)), a.zoom || 2);
  else if (a.fit === 'selection') zoomToSelection(); else if (a.fit === 'page' || !a.zoom) zoomToFit();
  else { updateStageRect(); zoomAt(stageRect.width / 2, stageRect.height / 2, a.zoom); }
  return { viewport: Object.assign(viewportWorldBox(), { zoom: round(D.zoom, 4) }) };
}, { readOnly: true, uiOnly: true });
tool('undo', 'Undo the last change (yours or the designer\'s).', { steps: { type: 'integer', minimum: 1, maximum: 50 } }, a => { for (let i = 0; i < (a.steps || 1); i++) undo(); return { remaining: HIST.undo.length }; }, { direct: true });
tool('redo', 'Redo.', { steps: { type: 'integer', minimum: 1, maximum: 50 } }, a => { for (let i = 0; i < (a.steps || 1); i++) redo(); return { remaining: HIST.redo.length }; }, { direct: true });
tool('notify', 'Show a short message to the designer (and log it in the AI panel).', { message: { type: 'string' } }, (a, ctx) => { aiChatIn(ctx && ctx.agent || 'AI', String(a.message || '').slice(0, 2000)); return { shown: true }; }, { readOnly: true, required: ['message'] });
tool('batch', 'Run several tool calls in order as ONE undo step. Later steps can use "$0", "$1"… (or "$0.created.<path>") to refer to ids from earlier results. Stops at the first error and rolls everything back.', {
  steps: { type: 'array', items: { type: 'object', properties: { tool: { type: 'string' }, args: { type: 'object' } }, required: ['tool'] } }, label: { type: 'string', description: 'Undo history label' },
}, null, { required: ['steps'] });

const SPEC_REFERENCE = {
  types: 'frame, group, component, instance, rect, image, ellipse, polygon, star, line, arrow, vector, text, boolean',
  common: 'name, x, y, w, h (numbers; or w/h "hug"/"fill"), rotation, visible, locked, opacity (0–1), blend ("multiply"…), children (frames, groups, components, booleans)',
  paint: 'fill / stroke: "#RRGGBB" | "#RRGGBBAA" | {type:"linear", angle:90, stops:[[0,"#fff"],[1,"#000"]]} | {type:"radial", stops} | {type:"image", src:"data:image/png;base64,…", fit:"fill|fit|stretch|tile"} | an array of these (bottom first) | null to clear',
  stroke: 'strokeWidth, strokeAlign ("inside" | "center" | "outside"), dash ([dash, gap] or 0), strokeCap, strokeJoin',
  effects: 'effects: [{type:"drop-shadow", x, y, blur, spread, color}, {type:"inner-shadow", …}, {type:"blur", blur}]  (shorthands: shadow: {...}, blur: 8)',
  shape: 'radius (number or [tl,tr,br,bl]) for rect/frame; points + innerRadius for polygon/star; path (SVG path data) for vector; from/to [x,y] for line/arrow; startMarker/endMarker ("arrow" | "triangle" | "circle")',
  image: 'type "image" with image: "data:image/…" (or an https URL that allows CORS), imageFit',
  text: 'text, font {family, size, weight (100–900 or "bold"), lineHeight ("auto" | px | "150%"), letterSpacing, italic}, color, textAlign (left|center|right), verticalAlign, textCase (upper|lower|title), decoration (underline|strikethrough). Text hugs its content unless you set w.',
  autoLayout: 'layout: {mode:"row"|"column"|"none", gap: number | "auto" (space between), padding: n | [v,h] | [t,r,b,l], align: start|center|end, crossAlign: start|center|end}; on children: sizing {w:"fixed|hug|fill", h:…}, absolute: true to opt out',
  frame: 'clip (default true), constraints {h:"left|right|left-right|center|scale", v:"top|bottom|top-bottom|center|scale"} for children of non-auto-layout frames',
  components: 'type "instance" with component: "<id or name>" and overrides: {"<child layer name>": {text, fill, visible}}; components take description',
  styles: 'fillStyle / strokeStyle / textStyle: style name or id',
  prototype: 'link: {to: "<frame id>" | "back", transition: "instant|dissolve|slide-left|slide-right|slide-up|push-left|push-right", duration}',
  example: { type: 'frame', name: 'Card', w: 320, fill: '#FFFFFF', radius: 16, layout: { mode: 'column', gap: 8, padding: 20 }, effects: [{ type: 'drop-shadow', y: 6, blur: 18, color: '#1B243014' }], children: [{ type: 'text', text: 'Ridge Loop', font: { family: 'Inter', size: 18, weight: 600 }, color: '#1B2430' }, { type: 'text', text: '7.4 km · 2 h 40 min', font: { size: 13 }, color: '#5B6573' }, { type: 'rect', h: 120, sizing: { w: 'fill' }, radius: 10, fill: { type: 'linear', angle: 120, stops: [[0, '#8CC9A6'], [1, '#1F6B4F']] } }] },
};

/* ---------- dispatcher ---------- */
const AI = { readOnly: false, log: [], queue: Promise.resolve(), listeners: [], flash: null };
function aiTool(name) { return AI_TOOLS.find(t => t.name === name); }
function aiManifest() { return AI_TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema, annotations: { readOnlyHint: t.readOnly } })); }
function validateArgs(t, args) {
  if (args === undefined || args === null) args = {};
  if (typeof args !== 'object' || Array.isArray(args)) throw aiErr('invalid_argument', `${t.name}: arguments must be an object`);
  const props = t.inputSchema.properties;
  for (const k of Object.keys(args)) if (!(k in props)) throw aiErr('invalid_argument', `${t.name}: unknown argument "${k}" (expected ${Object.keys(props).join(', ') || 'none'})`);
  for (const k of t.inputSchema.required || []) if (args[k] === undefined) throw aiErr('invalid_argument', `${t.name}: "${k}" is required`);
  for (const [k, sc] of Object.entries(props)) {
    const v = args[k]; if (v === undefined) continue;
    if (sc.type === 'string' && typeof v !== 'string') throw aiErr('invalid_argument', `${t.name}: "${k}" must be a string`);
    if ((sc.type === 'number' || sc.type === 'integer') && (typeof v !== 'number' || !isFinite(v))) throw aiErr('invalid_argument', `${t.name}: "${k}" must be a number`);
    if (sc.type === 'array' && !Array.isArray(v)) throw aiErr('invalid_argument', `${t.name}: "${k}" must be an array`);
    if (sc.type === 'boolean' && typeof v !== 'boolean') throw aiErr('invalid_argument', `${t.name}: "${k}" must be true or false`);
    if (sc.type === 'object' && (typeof v !== 'object' || v === null || Array.isArray(v))) throw aiErr('invalid_argument', `${t.name}: "${k}" must be an object`);
    if (sc.enum && !sc.enum.includes(v)) throw aiErr('invalid_argument', `${t.name}: "${k}" must be one of ${sc.enum.join(', ')}`);
  }
  return args;
}
function resolveRefs(v, results) {
  if (typeof v === 'string') {
    const m = v.match(/^\$(\d+)(?:\.(.+))?$/); if (!m) return v;
    const r = results[+m[1]]; if (!r) throw aiErr('invalid_argument', `reference ${v} points past the steps run so far`);
    if (!m[2]) { const id = r.id || (r.ids && r.ids[0]); if (!id) throw aiErr('invalid_argument', `step ${m[1]} returned no id`); return id; }
    let cur;
    if (m[2].startsWith('created.')) cur = r.created?.[m[2].slice(8)];
    else { cur = r; for (const part of m[2].split('.')) cur = cur?.[part]; }
    if (cur === undefined) throw aiErr('invalid_argument', `reference ${v} not found in step ${m[1]}'s result`); return cur;
  }
  if (Array.isArray(v)) return v.map(x => resolveRefs(x, results));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveRefs(x, results)]));
  return v;
}
async function waitIdle() { for (let i = 0; i < 200 && (DRAG.active || pointers.size); i++) await new Promise(r => setTimeout(r, 25)); if (TE.id) endTextEdit(true); if (VE.id) exitVecEdit(true); if (PEN.id) finishPen(); }
async function runTool(name, args, ctx, inBatch) {
  const t = aiTool(name);
  if (!t) throw aiErr('unknown_tool', `no tool named "${name}" — call get_capabilities for the list`);
  args = validateArgs(t, args);
  if (!t.readOnly && AI.readOnly && name !== 'batch') throw aiErr('read_only', 'The designer has set AI access to read-only. Ask them to allow edits in the AI panel.');
  if (name === 'batch') {
    if (inBatch) throw aiErr('invalid_argument', 'batch cannot be nested');
    const results = [];
    for (let i = 0; i < args.steps.length; i++) {
      const st = args.steps[i];
      try { results.push(await runTool(st.tool, resolveRefs(st.args || {}, results), ctx, true)); }
      catch (e) { e.message = `step ${i} (${st.tool}): ${e.message}`; e.step = i; throw e; }
    }
    return { results };
  }
  return await t.run(args, ctx || {});
}
/* Public entry: every transport ends up here. Mutations become one undo step; failures roll back. */
function aiCall(name, args, ctx = {}) {
  const job = AI.queue.then(async () => {
    const t0 = performance.now();
    const t = aiTool(name);
    const mutating = t && (!t.readOnly || name === 'batch') && !t.direct;
    const entry = { t: Date.now(), agent: ctx.agent || 'local', via: ctx.via || 'api', tool: name, ok: false };
    await waitIdle();
    const snapNodes = mutating ? JSON.stringify(D.nodes) : null, snapSel = D.sel.slice(), snapPage = D.page;
    if (mutating) HIST.hold++;
    try {
      const result = await runTool(name, args, ctx, false);
      if (mutating) {
        HIST.hold--;
        const changes = commit('AI · ' + ((name === 'batch' && args && args.label) || t.label || name), { force: true, ai: true });
        if (changes) { const ids = Object.keys(changes).filter(id => N(id) && changes[id][1] && N(id).type !== 'PAGE' && N(id).type !== 'DOCUMENT'); aiFlash(ids, ctx.color); entry.changed = ids.length; }
      }
      entry.ok = true; entry.ms = Math.round(performance.now() - t0);
      aiLogPush(entry);
      return result;
    } catch (e) {
      if (mutating) {
        HIST.hold = Math.max(0, HIST.hold - 1);
        D.nodes = JSON.parse(snapNodes); D.sel = snapSel.filter(id => N(id)); D.page = N(snapPage) ? snapPage : D.page; layoutAll(); renderAll();
      }
      entry.error = e.message; aiLogPush(entry);
      throw e;
    }
  });
  AI.queue = job.catch(() => { });
  return job;
}
function aiErrorOut(e) { return { code: e.code || 'tool_error', message: e.message || String(e) }; }
function aiFlash(ids, color) { if (!ids.length) return; AI.flash = { ids: ids.slice(0, 200), until: Date.now() + 1400, color: color || 'var(--agent)' }; renderOverlay(); setTimeout(() => { if (AI.flash && Date.now() >= AI.flash.until) { AI.flash = null; renderOverlay(); } }, 1450); }
function aiLogPush(e) { AI.log.unshift(e); if (AI.log.length > 200) AI.log.pop(); AI.listeners.forEach(f => f('log', e)); }
