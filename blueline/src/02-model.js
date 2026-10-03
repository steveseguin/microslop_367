/* ============================================================
   Document model: nodes, tree operations, transforms
   ============================================================ */
const CONTAINERS = new Set(['PAGE', 'FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'BOOLEAN']);
const FRAMELIKE = new Set(['FRAME', 'COMPONENT', 'INSTANCE']);
const SHAPES = new Set(['RECT', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR']);
const TYPE_LABEL = { FRAME: 'Frame', GROUP: 'Group', COMPONENT: 'Component', INSTANCE: 'Instance', BOOLEAN: 'Boolean', RECT: 'Rectangle', ELLIPSE: 'Ellipse', POLYGON: 'Polygon', STAR: 'Star', VECTOR: 'Vector', TEXT: 'Text', PAGE: 'Page' };

const D = {
  nodes: {},          // id -> node
  images: {},         // ref -> {data, url, w, h}
  fileId: null,
  page: null,
  sel: [],
  hover: null,
  tool: 'move',
  zoom: 1, panX: 0, panY: 0,
  mode: 'design',     // design | prototype
};
const N = id => D.nodes[id];
const root = () => D.nodes.root;
const pageNode = () => N(D.page);
const kids = n => (n && n.children ? n.children.map(N).filter(Boolean) : []);
const parentOf = n => n && n.parent ? N(n.parent) : null;
const isContainer = n => n && CONTAINERS.has(n.type);
const isFrameLike = n => n && FRAMELIKE.has(n.type);
const isAuto = n => n && isFrameLike(n) && n.layoutMode && n.layoutMode !== 'NONE';
const inAuto = n => { const p = parentOf(n); return isAuto(p) && !n.absolute; };

function baseProps() {
  return {
    visible: true, locked: false, opacity: 1, blendMode: 'NORMAL',
    x: 0, y: 0, w: 100, h: 100, rotation: 0, flipX: false, flipY: false,
    fills: [], strokes: [], strokeWidth: 1, strokeAlign: 'INSIDE', strokeDash: 0, strokeCap: 'NONE', strokeJoin: 'MITER',
    effects: [], constraints: { h: 'LEFT', v: 'TOP' }, sizingH: 'FIXED', sizingV: 'FIXED', absolute: false,
    reactions: [], exportSettings: [],
  };
}
const solid = (color, opacity = 1) => ({ type: 'SOLID', color, opacity, visible: true });

function mkNode(type, props = {}) {
  const n = Object.assign(baseProps(), { id: uid(), type, name: TYPE_LABEL[type] || type });
  switch (type) {
    case 'FRAME': case 'COMPONENT': case 'INSTANCE':
      Object.assign(n, { fills: [solid('#FFFFFF')], children: [], clipsContent: true, cornerRadius: 0, cornerRadii: null,
        layoutMode: 'NONE', itemSpacing: 10, padding: [10, 10, 10, 10], primaryAlign: 'MIN', counterAlign: 'MIN', layoutWrap: false });
      if (type === 'COMPONENT') { n.description = ''; }
      break;
    case 'GROUP': Object.assign(n, { children: [], blendMode: 'PASS_THROUGH' }); break;
    case 'BOOLEAN': Object.assign(n, { children: [], booleanOp: 'UNION', bpaths: [], fills: [solid('#D9D9D9')] }); break;
    case 'RECT': Object.assign(n, { fills: [solid('#D9D9D9')], cornerRadius: 0, cornerRadii: null }); break;
    case 'ELLIPSE': Object.assign(n, { fills: [solid('#D9D9D9')] }); break;
    case 'POLYGON': Object.assign(n, { fills: [solid('#D9D9D9')], pointCount: 3 }); break;
    case 'STAR': Object.assign(n, { fills: [solid('#D9D9D9')], pointCount: 5, innerRadius: 0.38 }); break;
    case 'VECTOR': Object.assign(n, { paths: [], strokes: [solid('#000000')], strokeAlign: 'CENTER', strokeCap: 'ROUND', strokeJoin: 'ROUND', startCap: 'NONE', endCap: 'NONE', fillRule: 'nonzero' }); break;
    case 'TEXT': Object.assign(n, { fills: [solid('#000000')], characters: '', fontFamily: 'Inter', fontWeight: 400, italic: false, fontSize: 16,
      lineHeight: { u: 'AUTO', v: 0 }, letterSpacing: 0, textAlign: 'LEFT', verticalAlign: 'TOP', textDecoration: 'NONE', textCase: 'ORIGINAL', sizingH: 'HUG', sizingV: 'HUG', name: 'Text' }); break;
    case 'PAGE': Object.assign(n, { children: [], bg: '#F2F3F5', name: 'Page 1' }); break;
  }
  Object.assign(n, props);
  return n;
}

/* ---------- tree ops ---------- */
function addNode(n, parentId, index) {
  D.nodes[n.id] = n;
  const p = N(parentId); n.parent = parentId;
  if (!p.children) p.children = [];
  if (index === undefined || index < 0 || index > p.children.length) p.children.push(n.id); else p.children.splice(index, 0, n.id);
  return n;
}
function detach(n) {
  const p = parentOf(n); if (p) { const i = p.children.indexOf(n.id); if (i >= 0) p.children.splice(i, 1); }
}
function removeNode(id) {
  const n = N(id); if (!n) return;
  detach(n);
  (function rm(x) { if (x.children) x.children.forEach(c => { const cn = N(c); if (cn) rm(cn); }); delete D.nodes[x.id]; })(n);
}
function descendants(n, out = []) { kids(n).forEach(c => { out.push(c); descendants(c, out); }); return out; }
function ancestors(n) { const out = []; let p = parentOf(n); while (p && p.type !== 'DOCUMENT') { out.push(p); p = parentOf(p); } return out; }
function isAncestor(a, n) { let p = parentOf(n); while (p) { if (p.id === a.id) return true; p = parentOf(p); } return false; }
function pageOf(n) { while (n && n.type !== 'PAGE') n = parentOf(n); return n; }
function indexInParent(n) { const p = parentOf(n); return p ? p.children.indexOf(n.id) : -1; }
function topLevelFrameOf(n) { let cur = n, top = null; while (cur && cur.type !== 'PAGE') { if (isFrameLike(cur) && parentOf(cur)?.type === 'PAGE') top = cur; cur = parentOf(cur); } return top; }
function insideInstance(n) { return !!n.mainRef; }
function instanceRootOf(n) { let p = n; while (p && p.mainRef) p = parentOf(p); return p && p.type === 'INSTANCE' ? p : null; }

/* ---------- transforms ---------- */
function localMatrix(n) {
  const cx = n.w / 2, cy = n.h / 2;
  let m = M.tr(n.x + cx, n.y + cy);
  if (n.rotation) m = M.mul(m, M.rot(n.rotation));
  if (n.flipX || n.flipY) m = M.mul(m, M.sc(n.flipX ? -1 : 1, n.flipY ? -1 : 1));
  return M.mul(m, M.tr(-cx, -cy));
}
function worldMatrix(n) {
  let m = M.I(); const chain = [];
  let cur = n; while (cur && cur.type !== 'PAGE' && cur.type !== 'DOCUMENT') { chain.push(cur); cur = parentOf(cur); }
  for (let i = chain.length - 1; i >= 0; i--) m = M.mul(m, localMatrix(chain[i]));
  return m;
}
const parentWorld = n => { const p = parentOf(n); return p && p.type !== 'PAGE' ? worldMatrix(p) : M.I(); };
function corners(n, m) { return [{ x: 0, y: 0 }, { x: n.w, y: 0 }, { x: n.w, y: n.h }, { x: 0, y: n.h }].map(p => M.apply(m, p)); }
function aabb(pts) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const p of pts) { x1 = Math.min(x1, p.x); y1 = Math.min(y1, p.y); x2 = Math.max(x2, p.x); y2 = Math.max(y2, p.y); }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}
const worldBox = n => aabb(corners(n, worldMatrix(n)));
const localBox = n => aabb(corners(n, localMatrix(n)));   // in parent coords
function selBox(ids = D.sel) { const pts = []; ids.forEach(id => { const n = N(id); if (n) pts.push(...corners(n, worldMatrix(n))); }); return pts.length ? aabb(pts) : null; }

/* Re-fit a container so that its bounds equal box b (given in its own local coords), keeping children visually fixed */
function refit(n, b) {
  if (Math.abs(b.x) < 1e-7 && Math.abs(b.y) < 1e-7 && Math.abs(b.w - n.w) < 1e-7 && Math.abs(b.h - n.h) < 1e-7) return false;
  const c = M.apply(localMatrix(n), { x: b.x + b.w / 2, y: b.y + b.h / 2 });
  n.w = b.w; n.h = b.h; n.x = c.x - b.w / 2; n.y = c.y - b.h / 2;
  return true;
}
/* Move node to a new parent keeping its world transform */
function reparent(n, newParentId, index) {
  const wm = worldMatrix(n);
  detach(n);
  const np = N(newParentId);
  n.parent = newParentId;
  if (index === undefined || index < 0 || index > np.children.length) np.children.push(n.id); else np.children.splice(index, 0, n.id);
  setWorldMatrix(n, wm);
}
/* Decompose a desired world matrix into x,y,rotation,flip in the node's parent space */
function setWorldMatrix(n, wm) {
  const pm = parentWorld(n);
  const lm = M.mul(M.inv(pm), wm);
  // lm = T(x+cx,y+cy) R S T(-cx,-cy). Extract rotation & flip from linear part
  const a = lm[0], b = lm[1], c = lm[2], d = lm[3];
  const det = a * d - b * c;
  let rot = deg(Math.atan2(b, a)), flipY = false;
  if (det < 0) { flipY = true; }
  // keep existing flipX convention: express as rotation + flipY only
  n.flipX = false; n.flipY = flipY; n.rotation = normAngle(rot);
  const cx = n.w / 2, cy = n.h / 2;
  const center = M.apply(lm, { x: cx, y: cy });
  n.x = center.x - cx; n.y = center.y - cy;
  if (Math.abs(n.rotation) < 1e-6) n.rotation = 0;
}
function normAngle(a) { a = a % 360; if (a > 180) a -= 360; if (a <= -180) a += 360; return Math.abs(a) < 1e-9 ? 0 : a; }

/* ---------- cloning ---------- */
function cloneTree(id, idMap = {}, keepRefs = true) {
  const src = N(id); const out = [];
  (function cp(s, parentId) {
    const c = clone(s); c.id = uid(); idMap[s.id] = c.id; c.parent = parentId;
    if (!keepRefs) { delete c.mainRef; delete c.overrides; }
    out.push(c);
    if (s.children) c.children = s.children.map(cid => { const cn = N(cid); return cn ? cp(cn, c.id) : null; }).filter(Boolean);
    return c.id;
  })(src, src.parent);
  return out; // [root, ...descendants]; root.parent = original parent (caller decides)
}
/* nodes JSON for clipboard */
function serializeTrees(ids) {
  const nodes = {}; ids.forEach(id => { const n = N(id); if (!n) return; nodes[id] = clone(n); descendants(n).forEach(d => nodes[d.id] = clone(d)); });
  const imgs = {}; Object.values(nodes).forEach(n => paintsOf(n).forEach(p => { if (p.type === 'IMAGE' && D.images[p.imageRef]) imgs[p.imageRef] = D.images[p.imageRef].data; }));
  const wm = {}; ids.forEach(id => wm[id] = worldMatrix(N(id)));
  return { blueline: 1, roots: ids, nodes, images: imgs, world: wm };
}
const paintsOf = n => [...(n.fills || []), ...(n.strokes || [])];

/* ============================================================
   Geometry: shape outlines as cubic bezier paths
   path = {closed, pts:[{x,y,ix,iy,ox,oy}]}  (handles relative)
   ============================================================ */
const KAPPA = 0.5522847498;
const pt = (x, y, ix = 0, iy = 0, ox = 0, oy = 0) => ({ x, y, ix, iy, ox, oy });
function radiiOf(n) {
  const r = n.cornerRadii || [n.cornerRadius || 0, n.cornerRadius || 0, n.cornerRadius || 0, n.cornerRadius || 0];
  const max = Math.min(Math.abs(n.w), Math.abs(n.h)) / 2;
  return r.map(v => clamp(v || 0, 0, max));
}
function rectPaths(w, h, r = [0, 0, 0, 0]) {
  const [tl, tr, br, bl] = r, k = KAPPA, P = [];
  if (tl) { P.push(pt(0, tl, 0, 0, 0, -tl * k)); P.push(pt(tl, 0, -tl * k, 0, 0, 0)); } else P.push(pt(0, 0));
  if (tr) { P.push(pt(w - tr, 0, 0, 0, tr * k, 0)); P.push(pt(w, tr, 0, -tr * k, 0, 0)); } else P.push(pt(w, 0));
  if (br) { P.push(pt(w, h - br, 0, 0, 0, br * k)); P.push(pt(w - br, h, br * k, 0, 0, 0)); } else P.push(pt(w, h));
  if (bl) { P.push(pt(bl, h, 0, 0, -bl * k, 0)); P.push(pt(0, h - bl, 0, bl * k, 0, 0)); } else P.push(pt(0, h));
  return [{ closed: true, pts: P }];
}
function ellipsePaths(w, h) {
  const rx = w / 2, ry = h / 2, kx = rx * KAPPA, ky = ry * KAPPA;
  return [{ closed: true, pts: [pt(rx, 0, -kx, 0, kx, 0), pt(w, ry, 0, -ky, 0, ky), pt(rx, h, kx, 0, -kx, 0), pt(0, ry, 0, ky, 0, -ky)] }];
}
function normToBox(raw, w, h) {
  const b = aabb(raw); return raw.map(p => pt(b.w ? (p.x - b.x) / b.w * w : w / 2, b.h ? (p.y - b.y) / b.h * h : h / 2));
}
function polygonPaths(w, h, count) {
  count = clamp(Math.round(count || 3), 3, 60);
  const raw = []; for (let i = 0; i < count; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / count; raw.push({ x: Math.cos(a), y: Math.sin(a) }); }
  return [{ closed: true, pts: normToBox(raw, w, h) }];
}
function starPaths(w, h, count, inner) {
  count = clamp(Math.round(count || 5), 3, 60); inner = clamp(inner ?? 0.38, 0.01, 1);
  const raw = []; for (let i = 0; i < count * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / count, r = i % 2 ? inner : 1; raw.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
  return [{ closed: true, pts: normToBox(raw, w, h) }];
}
function shapePaths(n) {
  switch (n.type) {
    case 'RECT': case 'FRAME': case 'COMPONENT': case 'INSTANCE': return rectPaths(n.w, n.h, radiiOf(n));
    case 'ELLIPSE': return ellipsePaths(n.w, n.h);
    case 'POLYGON': return polygonPaths(n.w, n.h, n.pointCount);
    case 'STAR': return starPaths(n.w, n.h, n.pointCount, n.innerRadius);
    case 'VECTOR': return n.paths || [];
    case 'BOOLEAN': return n.bpaths || [];
    case 'TEXT': return rectPaths(n.w, n.h);
  }
  return [];
}
/* outline of any node (in node's local coords), used for booleans and masks */
function outlinePaths(n) {
  if (n.type === 'GROUP') { let out = []; kids(n).filter(c => c.visible).forEach(c => out = out.concat(transformPaths(outlinePaths(c), localMatrix(c)))); return out; }
  return shapePaths(n);
}
function transformPaths(paths, m) {
  return paths.map(sp => ({ closed: sp.closed, pts: sp.pts.map(p => { const q = M.apply(m, p), i = M.applyV(m, { x: p.ix, y: p.iy }), o = M.applyV(m, { x: p.ox, y: p.oy }); return pt(q.x, q.y, i.x, i.y, o.x, o.y); }) }));
}
const r3 = v => round(v, 3);
function pathsToD(paths) {
  let d = '';
  for (const sp of paths) {
    const P = sp.pts; if (!P.length) continue;
    d += `M${r3(P[0].x)} ${r3(P[0].y)}`;
    const segs = sp.closed ? P.length : P.length - 1;
    for (let i = 0; i < segs; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      if (!a.ox && !a.oy && !b.ix && !b.iy) d += `L${r3(b.x)} ${r3(b.y)}`;
      else d += `C${r3(a.x + a.ox)} ${r3(a.y + a.oy)} ${r3(b.x + b.ix)} ${r3(b.y + b.iy)} ${r3(b.x)} ${r3(b.y)}`;
    }
    if (sp.closed) d += 'Z';
  }
  return d;
}
function cubicExtrema(p0, p1, p2, p3) {
  const out = [];
  const a = -p0 + 3 * p1 - 3 * p2 + p3, b = 2 * (p0 - 2 * p1 + p2), c = p1 - p0;
  if (Math.abs(a) < 1e-12) { if (Math.abs(b) > 1e-12) out.push(-c / b); }
  else { const disc = b * b - 4 * a * c; if (disc >= 0) { const s = Math.sqrt(disc); out.push((-b + s) / (2 * a), (-b - s) / (2 * a)); } }
  return out.filter(t => t > 0 && t < 1);
}
const cubicAt = (p0, p1, p2, p3, t) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
function pathsBBox(paths) {
  const pts = [];
  for (const sp of paths) {
    const P = sp.pts; const segs = sp.closed ? P.length : P.length - 1;
    P.forEach(p => pts.push(p));
    for (let i = 0; i < segs; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      if (!a.ox && !a.oy && !b.ix && !b.iy) continue;
      const xs = [a.x, a.x + a.ox, b.x + b.ix, b.x], ys = [a.y, a.y + a.oy, b.y + b.iy, b.y];
      cubicExtrema(...xs).concat(cubicExtrema(...ys)).forEach(t => pts.push({ x: cubicAt(...xs, t), y: cubicAt(...ys, t) }));
    }
  }
  return pts.length ? aabb(pts) : { x: 0, y: 0, w: 0, h: 0 };
}
function samplePaths(paths, steps = 16) {  // polyline segments for hit-testing: [{a,b,sp,seg,t0,t1}]
  const out = [];
  paths.forEach((sp, si) => {
    const P = sp.pts; const segs = sp.closed ? P.length : P.length - 1;
    for (let i = 0; i < segs; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const xs = [a.x, a.x + a.ox, b.x + b.ix, b.x], ys = [a.y, a.y + a.oy, b.y + b.iy, b.y];
      let prev = { x: a.x, y: a.y, t: 0 };
      for (let k = 1; k <= steps; k++) { const t = k / steps; const q = { x: cubicAt(...xs, t), y: cubicAt(...ys, t), t }; out.push({ a: prev, b: q, si, seg: i }); prev = q; }
    }
  });
  return out;
}
function distToSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
  let t = L ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / L : 0; t = clamp(t, 0, 1);
  return { d: Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)), t };
}
/* split cubic at t (de Casteljau) returning new point inserted with handles */
function splitSegment(sp, segIndex, t) {
  const P = sp.pts, a = P[segIndex], b = P[(segIndex + 1) % P.length];
  const p0 = { x: a.x, y: a.y }, p1 = { x: a.x + a.ox, y: a.y + a.oy }, p2 = { x: b.x + b.ix, y: b.y + b.iy }, p3 = { x: b.x, y: b.y };
  const L = (u, v) => ({ x: lerp(u.x, v.x, t), y: lerp(u.y, v.y, t) });
  const q0 = L(p0, p1), q1 = L(p1, p2), q2 = L(p2, p3), r0 = L(q0, q1), r1 = L(q1, q2), s = L(r0, r1);
  const straight = !a.ox && !a.oy && !b.ix && !b.iy;
  if (straight) { P.splice(segIndex + 1, 0, pt(s.x, s.y)); return segIndex + 1; }
  a.ox = q0.x - a.x; a.oy = q0.y - a.y; b.ix = q2.x - b.x; b.iy = q2.y - b.y;
  P.splice(segIndex + 1, 0, pt(s.x, s.y, r0.x - s.x, r0.y - s.y, r1.x - s.x, r1.y - s.y));
  return segIndex + 1;
}

/* ---------- geometry edits ---------- */
function scalePaths(paths, sx, sy) { return paths.map(sp => ({ closed: sp.closed, pts: sp.pts.map(p => pt(p.x * sx, p.y * sy, p.ix * sx, p.iy * sy, p.ox * sx, p.oy * sy)) })); }
function shiftPaths(paths, dx, dy) { return paths.map(sp => ({ closed: sp.closed, pts: sp.pts.map(p => pt(p.x + dx, p.y + dy, p.ix, p.iy, p.ox, p.oy)) })); }
function normalizeVector(n) {
  const b = pathsBBox(n.paths || []);
  if (!isFinite(b.x)) return;
  if (Math.abs(b.x) < 1e-7 && Math.abs(b.y) < 1e-7 && Math.abs(b.w - n.w) < 1e-7 && Math.abs(b.h - n.h) < 1e-7) return;
  refit(n, b);
  n.paths = shiftPaths(n.paths, -b.x, -b.y);
}

/* resize a node to (w,h), propagating to content: constraints for frames, scale for groups/vectors */
function resizeNode(n, w, h) {
  const ow = n.w, oh = n.h;
  if (n.type !== 'VECTOR') { w = Math.max(w, 0.01); h = Math.max(h, 0.01); }
  n.w = w; n.h = h;
  resizeContent(n, ow, oh);
}
function resizeContent(n, ow, oh) {
  const sx = ow > 1e-6 ? n.w / ow : 1, sy = oh > 1e-6 ? n.h / oh : 1;
  if (n.type === 'VECTOR') n.paths = scalePaths(n.paths || [], sx, sy);
  else if (n.type === 'GROUP' || n.type === 'BOOLEAN') {
    if (n.type === 'BOOLEAN') n.bpaths = scalePaths(n.bpaths || [], sx, sy);
    kids(n).forEach(c => {
      const b = localBox(c), ncx = b.cx * sx, ncy = b.cy * sy;
      const rot = Math.abs(Math.sin(rad(c.rotation || 0) * 2)) > 0.01;
      if (rot) { const k = Math.sqrt(Math.abs(sx * sy)); resizeNode(c, c.w * k, c.h * k); }
      else { const sw = Math.abs(Math.cos(rad(c.rotation))) > 0.5; resizeNode(c, c.w * (sw ? sx : sy), c.h * (sw ? sy : sx)); }
      c.x = ncx - c.w / 2; c.y = ncy - c.h / 2;
    });
  } else if (isFrameLike(n) && !isAuto(n)) {
    kids(n).forEach(c => applyConstraints(c, ow, oh, n.w, n.h));
  } else if (isAuto(n)) {
    kids(n).filter(c => c.absolute).forEach(c => applyConstraints(c, ow, oh, n.w, n.h));
  }
}
function applyConstraints(c, ow, oh, nw, nh) {
  const dw = nw - ow, dh = nh - oh; if (!dw && !dh) return;
  const ch = c.constraints || { h: 'LEFT', v: 'TOP' };
  let x = c.x, y = c.y, w = c.w, hh = c.h;
  const sx = ow ? nw / ow : 1, sy = oh ? nh / oh : 1;
  switch (ch.h) { case 'RIGHT': x += dw; break; case 'LEFT_RIGHT': w += dw; break; case 'CENTER': x += dw / 2; break; case 'SCALE': x *= sx; w *= sx; break; }
  switch (ch.v) { case 'BOTTOM': y += dh; break; case 'TOP_BOTTOM': hh += dh; break; case 'CENTER': y += dh / 2; break; case 'SCALE': y *= sy; hh *= sy; break; }
  c.x = x; c.y = y;
  if (w !== c.w || hh !== c.h) resizeNode(c, Math.max(w, 0.01), Math.max(hh, 0.01));
}
