/* ============================================================
   Pointer tools: select/move/resize/rotate, create, pen, pencil,
   text editing, vector editing, snapping, measurement
   ============================================================ */
const DRAG = { active: false, type: null };
const TE = { id: null, created: false };
const VE = { id: null, sel: [] };
const PEN = { id: null, si: 0, hover: null };
const PENCIL = { pts: null };
let spaceDown = false;
const pointers = new Map();
let pinch = null;

function setDrag(o) { for (const k in DRAG) delete DRAG[k]; Object.assign(DRAG, { active: !!o }, o || {}); }
function locked(n) { return n.locked || ancestors(n).some(a => a.locked); }

/* ---------- picking ---------- */
function elementsAt(e) { return document.elementsFromPoint(e.clientX, e.clientY).filter(el => contentG.contains(el)); }
function deepestAt(e, skip) {
  for (const el of elementsAt(e)) { const g = el.closest('[data-id]'); if (!g) continue; const n = N(g.dataset.id); if (n && !(skip && skip(n))) return n; }
  return null;
}
function resolveSelectable(deepest, deep) {
  if (deep) return { node: deepest };
  const path = [deepest, ...ancestors(deepest)].reverse();
  let best = null;
  for (const sid of D.sel) {
    const s = N(sid); if (!s || !s.parent) continue; const p = N(s.parent); if (!p || p.type === 'PAGE') continue;
    const i = path.findIndex(x => x.id === p.id);
    if (i >= 0 && i + 1 < path.length && (best === null || i + 1 > best)) best = i + 1;
  }
  if (best !== null) return { node: path[best] };
  const top = path[1]; if (!top) return null;
  if (isFrameLike(top) && top.type !== 'INSTANCE') {
    if (deepest.id === top.id) return kids(top).length ? { bg: top } : { node: top };
    return { node: path[2] };
  }
  return { node: top };
}
function pickAt(e, deep) {
  for (const el of elementsAt(e)) {
    const g = el.closest('[data-id]'); if (!g) continue;
    const n = N(g.dataset.id); if (!n) continue;
    const r = resolveSelectable(n, deep); if (!r) continue;
    const t = r.bg || r.node; if (!t || locked(t)) continue;
    return r;
  }
  return null;
}
function containerAt(e, exclude = new Set()) {
  for (const el of elementsAt(e)) {
    const g = el.closest('[data-id]'); if (!g) continue;
    let n = N(g.dataset.id);
    while (n && n.type !== 'PAGE') {
      if ((n.type === 'FRAME' || n.type === 'COMPONENT') && !n.mainRef && !exclude.has(n.id) && !ancestors(n).some(a => exclude.has(a.id)) && !locked(n)) return n;
      n = parentOf(n);
    }
  }
  return pageNode();
}
function labelAt(l) { return OV.labels.slice().reverse().find(r => l.x >= r.x && l.x <= r.x + r.w && l.y >= r.y && l.y <= r.y + r.h); }

/* ---------- handles ---------- */
function insidePoly(p, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if (((P[i].y > p.y) !== (P[j].y > p.y)) && (p.x < (P[j].x - P[i].x) * (p.y - P[i].y) / (P[j].y - P[i].y) + P[i].x)) c = !c; } return c; }
function hitHandle(l) {
  if (!D.sel.length || VE.id || TE.id || D.tool !== 'move') return null;
  const sel = D.sel.map(N).filter(Boolean);
  if (sel.some(n => n.mainRef || locked(n))) return null;
  const f = selectionFrame(); if (!f) return null;
  if (f.line) { for (let i = 0; i < 2; i++) if (dist(l, f.ends[i]) < 8) return { kind: 'linept', i }; return null; }
  const P = f.pts, HH = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (let i = 0; i < 4; i++) if (dist(l, P[i]) <= 7) return { kind: 'corner', hx: HH[i][0], hy: HH[i][1], p: P[i] };
  const E = [[P[0], P[1], 0.5, 0], [P[1], P[2], 1, 0.5], [P[2], P[3], 0.5, 1], [P[3], P[0], 0, 0.5]];
  for (const [a, b, hx, hy] of E) { const r = distToSeg(l, a, b); if (r.d <= 4 && r.t > 0.04 && r.t < 0.96) return { kind: 'edge', hx, hy, p: { x: lerp(a.x, b.x, 0.5), y: lerp(a.y, b.y, 0.5) } }; }
  if (!insidePoly(l, P)) for (let i = 0; i < 4; i++) { const d = dist(l, P[i]); if (d > 7 && d < 22) return { kind: 'rotate', p: P[i] }; }
  return null;
}
function cursorFor(h) {
  if (!h) return '';
  if (h.kind === 'rotate') return 'var(--cur-rotate)';
  if (h.kind === 'linept') return 'crosshair';
  const f = selectionFrame(); const P = f.pts; const c = { x: (P[0].x + P[2].x) / 2, y: (P[0].y + P[2].y) / 2 };
  let a = (deg(Math.atan2(h.p.y - c.y, h.p.x - c.x)) + 360) % 180;
  return a < 22.5 || a >= 157.5 ? 'ew-resize' : a < 67.5 ? 'nwse-resize' : a < 112.5 ? 'ns-resize' : 'nesw-resize';
}

/* ---------- snapshot helpers ---------- */
function snapshotIds(ids) { const m = new Map(); ids.forEach(id => { const n = N(id); if (!n) return; m.set(id, JSON.stringify(n)); descendants(n).forEach(d => m.set(d.id, JSON.stringify(d))); }); return m; }
function restoreSnap(snap) { snap.forEach((s, id) => { D.nodes[id] = JSON.parse(s); }); }

/* ---------- snapping ---------- */
function snapCands(ids) {
  const moving = new Set(ids); const out = [];
  const parents = new Set(ids.map(id => N(id)?.parent));
  parents.forEach(pid => {
    const p = N(pid); if (!p) return;
    kids(p).forEach(c => { if (!moving.has(c.id) && c.visible && !(D.dragging && D.dragging.has(c.id))) out.push(worldBox(c)); });
    if (p.type !== 'PAGE') { out.push(worldBox(p)); const pp = parentOf(p); if (pp && pp.type === 'PAGE') { } }
  });
  return out;
}
function computeSnap(box, cands, axes = { x: [0, 0.5, 1], y: [0, 0.5, 1] }) {
  const th = 6 / D.zoom; let bx = null, by = null;
  for (const c of cands) {
    for (const cx of [c.x, c.cx, c.x2]) for (const f of axes.x) { const mx = box.x + box.w * f, d = cx - mx; if (Math.abs(d) < th && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, v: cx }; }
    for (const cy of [c.y, c.cy, c.y2]) for (const f of axes.y) { const my = box.y + box.h * f, d = cy - my; if (Math.abs(d) < th && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, v: cy }; }
  }
  return { dx: bx ? bx.d : 0, dy: by ? by.d : 0, sx: bx, sy: by };
}
function snapGuides(box, cands, sx, sy) {
  const g = [];
  if (sx) { let y1 = box.y, y2 = box.y + box.h; cands.forEach(c => { if ([c.x, c.cx, c.x2].some(v => Math.abs(v - sx.v) < 0.01)) { y1 = Math.min(y1, c.y); y2 = Math.max(y2, c.y2); } }); g.push({ a: { x: sx.v, y: y1 }, b: { x: sx.v, y: y2 } }); }
  if (sy) { let x1 = box.x, x2 = box.x + box.w; cands.forEach(c => { if ([c.y, c.cy, c.y2].some(v => Math.abs(v - sy.v) < 0.01)) { x1 = Math.min(x1, c.x); x2 = Math.max(x2, c.x2); } }); g.push({ a: { x: x1, y: sy.v }, b: { x: x2, y: sy.v } }); }
  return g;
}

/* ---------- pointer entry ---------- */
function onPointerDown(e) {
  if (e.target.closest('.floating') || e.target === TA()) return;
  updateStageRect();
  pointers.set(e.pointerId, toLocal(e));
  try { stage.setPointerCapture(e.pointerId); } catch (_) { }
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: dist(a, b), z: D.zoom, c: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, px: D.panX, py: D.panY }; if (DRAG.node && DRAG.type === 'create') { } setDrag(null); return; }
  closePopovers(); hideMenu();
  if (document.activeElement && document.activeElement !== document.body && document.activeElement !== TA()) document.activeElement.blur();
  if (TE.id) endTextEdit(true);
  const l = toLocal(e), w = toWorld(e);
  if (e.button === 1 || spaceDown || D.tool === 'hand') { setDrag({ type: 'pan', l, px: D.panX, py: D.panY }); stage.classList.add('panning'); return; }
  if (e.button === 2) { if (D.tool === 'move' && !VE.id) { const r = pickAt(e, e.ctrlKey || e.metaKey); const t = r && (r.node || null); if (t && !D.sel.includes(t.id)) { D.sel = [t.id]; renderAll(); } } return; }
  if (D.tool === 'pen') return penDown(e, l, w);
  if (D.tool === 'pencil') { PENCIL.pts = [w]; PENCIL.parent = containerAt(e).id; setDrag({ type: 'pencil' }); return; }
  if (D.tool !== 'move') return createDown(e, w);
  if (VE.id) return vecDown(e, l, w);
  if (D.mode === 'prototype' && D.sel.length === 1) {
    const f = selectionFrame();
    if (f && f.pts) { const mid = { x: (f.pts[1].x + f.pts[2].x) / 2, y: (f.pts[1].y + f.pts[2].y) / 2 }; if (dist(l, mid) < 10) { setDrag({ type: 'link', from: D.sel[0], a: mid }); return; } }
  }
  const h = hitHandle(l);
  if (h) return startTransform(e, h, w);
  const lab = labelAt(l);
  const r = lab ? { node: N(lab.id) } : pickAt(e, e.ctrlKey || e.metaKey);
  if (!r || r.bg) {
    if (!e.shiftKey) D.sel = [];
    setDrag({ type: 'marquee', a: l, scope: r && r.bg ? r.bg.id : null, base: D.sel.slice() });
    renderAll(); return;
  }
  const id = r.node.id;
  if (e.shiftKey) { if (D.sel.includes(id)) { D.sel = D.sel.filter(x => x !== id); renderAll(); return; } D.sel = [...D.sel, id]; }
  else if (!D.sel.includes(id)) D.sel = [id];
  setDrag({ type: 'movePending', l, w, id });
  renderAll();
}
function onPointerMove(e) {
  if (!stageRect) updateStageRect();
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, toLocal(e));
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()]; const d = dist(a, b), c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const z = clamp(pinch.z * d / pinch.d, 0.02, 256);
    const wx = (pinch.c.x - pinch.px) / pinch.z, wy = (pinch.c.y - pinch.py) / pinch.z;
    D.zoom = z; D.panX = c.x - wx * z; D.panY = c.y - wy * z; applyViewport(); return;
  }
  const l = toLocal(e), w = toWorld(e);
  D.lastW = w; D.lastE = e;
  sendCursor(w);
  if (!DRAG.active) return hoverMove(e, l, w);
  switch (DRAG.type) {
    case 'pan': D.panX = DRAG.px + (l.x - DRAG.l.x); D.panY = DRAG.py + (l.y - DRAG.l.y); applyViewport(); break;
    case 'movePending': if (dist(l, DRAG.l) > 3) { beginMove(e); if (DRAG.type === 'move') moveUpdate(e, w); } break;
    case 'move': moveUpdate(e, w); break;
    case 'resize': resizeUpdate(e, w); break;
    case 'rotate': rotateUpdate(e, w); break;
    case 'linept': lineptUpdate(e, w); break;
    case 'marquee': marqueeUpdate(e, l); break;
    case 'create': createUpdate(e, w); break;
    case 'pen': penDrag(e, w); break;
    case 'pencil': { const last = PENCIL.pts[PENCIL.pts.length - 1]; if (dist(last, w) * D.zoom > 1.5) PENCIL.pts.push(w); renderOverlay(); break; }
    case 'vpts': case 'vhandle': vecDrag(e, w); break;
    case 'link': { OV.link = { a: DRAG.a, b: l }; const t = containerAt(e); OV.dropTarget = t && t.type !== 'PAGE' ? topLevelFrameOf(t)?.id : null; renderOverlay(); break; }
  }
}
function onPointerUp(e) {
  pointers.delete(e.pointerId);
  if (pinch) { if (pointers.size < 2) pinch = null; return; }
  if (!DRAG.active) return;
  const t = DRAG.type;
  stage.classList.remove('panning');
  switch (t) {
    case 'movePending': {
      // plain click: if clicked a node inside current multi-selection w/o drag, select just it
      if (!e.shiftKey && D.sel.length > 1 && D.sel.includes(DRAG.id)) { D.sel = [DRAG.id]; renderAll(); }
      break;
    }
    case 'move': moveEnd(e); break;
    case 'resize': case 'rotate': case 'linept': D.dragging = null; OV.guides = []; commit(t === 'rotate' ? 'Rotate' : 'Resize'); break;
    case 'marquee': OV.marquee = null; renderAll(); break;
    case 'create': createEnd(e); break;
    case 'pen': penUp(e); break;
    case 'pencil': pencilEnd(); break;
    case 'vpts': case 'vhandle': commit('Edit vector', { keepVE: true }); break;
    case 'link': {
      OV.link = null; const tf = OV.dropTarget; OV.dropTarget = null;
      const n = N(DRAG.from);
      if (n && N(tf) && tf !== topLevelFrameOf(n)?.id && tf !== n.id) {
        n.reactions = [{ trigger: 'CLICK', action: 'NAVIGATE', dest: tf, transition: 'DISSOLVE', duration: 300 }];
        commit('Add interaction');
      } else renderOverlay();
      break;
    }
  }
  setDrag(null); D.dragging = null; OV.guides = []; OV.insert = null; OV.dropTarget = null;
  renderOverlay();
}
function hoverMove(e, l, w) {
  if (D.tool === 'pen' && PEN.id) { PEN.hover = w; PEN.shift = e.shiftKey; renderOverlay(); return; }
  if (D.tool !== 'move' || spaceDown) return;
  let cur = '';
  if (VE.id) { stage.style.cursor = ''; return; }
  const h = hitHandle(l);
  if (h) cur = cursorFor(h);
  else if (D.mode === 'prototype' && D.sel.length === 1) { const f = selectionFrame(); if (f && f.pts) { const mid = { x: (f.pts[1].x + f.pts[2].x) / 2, y: (f.pts[1].y + f.pts[2].y) / 2 }; if (dist(l, mid) < 10) cur = 'crosshair'; } }
  stage.style.cursor = cur;
  const lab = labelAt(l);
  const r = h ? null : lab ? { node: N(lab.id) } : pickAt(e, e.ctrlKey || e.metaKey);
  const hid = r ? (r.node ? r.node.id : null) : null;
  let changed = false;
  if (hid !== D.hover) { D.hover = hid; changed = true; layersHover(hid); }
  // alt measurement
  const prevM = OV.measure; OV.measure = e.altKey && D.sel.length ? measureTo(hid) : null;
  if (changed || prevM !== OV.measure) renderOverlay();
}
function measureTo(hid) {
  const a = selBox(); if (!a) return null;
  let t = N(hid);
  if (!t || D.sel.includes(hid)) { const p = parentOf(N(D.sel[0])); if (!p || p.type === 'PAGE') return null; t = p; }
  const b = worldBox(t);
  const lines = [];
  const contains = b.x <= a.x + 0.01 && b.y <= a.y + 0.01 && b.x2 >= a.x2 - 0.01 && b.y2 >= a.y2 - 0.01;
  if (contains) {
    lines.push([{ x: b.x, y: a.cy }, { x: a.x, y: a.cy }], [{ x: a.x2, y: a.cy }, { x: b.x2, y: a.cy }], [{ x: a.cx, y: b.y }, { x: a.cx, y: a.y }], [{ x: a.cx, y: a.y2 }, { x: a.cx, y: b.y2 }]);
  } else {
    if (b.x >= a.x2) lines.push([{ x: a.x2, y: a.cy }, { x: b.x, y: a.cy }]); else if (b.x2 <= a.x) lines.push([{ x: b.x2, y: a.cy }, { x: a.x, y: a.cy }]);
    if (b.y >= a.y2) lines.push([{ x: a.cx, y: a.y2 }, { x: a.cx, y: b.y }]); else if (b.y2 <= a.y) lines.push([{ x: a.cx, y: b.y2 }, { x: a.cx, y: a.y }]);
  }
  let s = `<path d="${poly([w2s({ x: b.x, y: b.y }), w2s({ x: b.x2, y: b.y }), w2s({ x: b.x2, y: b.y2 }), w2s({ x: b.x, y: b.y2 })])}" class="meas-box"/>`;
  lines.forEach(([p, q]) => {
    const len = Math.abs(p.x - q.x) + Math.abs(p.y - q.y); if (len < 0.01) return;
    const P = w2s(p), Q = w2s(q), m = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
    const lab = fmt(len); const tw = lab.length * 6.4 + 10;
    s += `<line x1="${r3(P.x)}" y1="${r3(P.y)}" x2="${r3(Q.x)}" y2="${r3(Q.y)}" class="meas"/><g class="glab"><rect x="${r3(m.x - tw / 2)}" y="${r3(m.y - 9)}" width="${r3(tw)}" height="18" rx="3"/><text x="${r3(m.x)}" y="${r3(m.y + 3.5)}">${lab}</text></g>`;
  });
  return s;
}

/* ---------- move ---------- */
function topSelection(ids) { return ids.filter(id => !ids.some(o => o !== id && N(o) && isAncestor(N(o), N(id)))); }
function beginMove(e) {
  let ids = topSelection(D.sel.filter(id => { const n = N(id); return n && !locked(n) && !n.mainRef; }));
  if (!ids.length) { setDrag(null); return; }
  if (e.altKey) { ids = duplicateNodes(ids, false); D.sel = ids.slice(); layoutAll(); }
  const startW = DRAG.w;
  D.dragging = new Set(ids);
  setDrag({ type: 'move', ids, startW, orig: ids.map(id => { const n = N(id); return { id, x: n.x, y: n.y, pinv: M.inv(parentWorld(n)) }; }), box0: selBox(ids), cands: snapCands(ids), unrot: ids.every(id => !N(id).rotation), parent0: N(ids[0]).parent });
}
function moveUpdate(e, w) {
  let dx = w.x - DRAG.startW.x, dy = w.y - DRAG.startW.y;
  if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
  const b0 = DRAG.box0;
  OV.guides = [];
  if (!e.ctrlKey && !e.metaKey) {
    const box = { x: b0.x + dx, y: b0.y + dy, w: b0.w, h: b0.h };
    const s = computeSnap(box, DRAG.cands);
    if (!(e.shiftKey && dx === 0)) dx += s.dx;
    if (!(e.shiftKey && dy === 0)) dy += s.dy;
    if (DRAG.unrot) { if (!s.sx) dx = Math.round(b0.x + dx) - b0.x; if (!s.sy) dy = Math.round(b0.y + dy) - b0.y; }
    OV.guides = snapGuides({ x: b0.x + dx, y: b0.y + dy, w: b0.w, h: b0.h }, DRAG.cands, s.sx, s.sy);
  }
  DRAG.orig.forEach(o => { const n = N(o.id); if (!n) return; const d = M.applyV(o.pinv, { x: dx, y: dy }); n.x = o.x + d.x; n.y = o.y + d.y; });
  // drop target
  const moving = new Set(DRAG.ids);
  let target = containerAt(e, moving);
  const first = N(DRAG.ids[0]); const cur = parentOf(first);
  if (cur && (cur.type === 'GROUP' || cur.type === 'BOOLEAN')) {
    const frameAnc = ancestors(cur).find(a => a.type === 'FRAME' || a.type === 'COMPONENT' || a.type === 'PAGE');
    if (frameAnc && frameAnc.id === target.id) target = cur;
  }
  DRAG.target = target.id;
  OV.dropTarget = target.type !== 'PAGE' && target.id !== cur?.id ? target.id : null;
  OV.insert = null; DRAG.insertIndex = undefined;
  if (isAuto(target)) {
    const H = target.layoutMode === 'HORIZONTAL';
    const flow = kids(target).filter(c => c.visible && !c.absolute && !moving.has(c.id));
    const lp = M.apply(M.inv(worldMatrix(target)), w);
    let idx = flow.length;
    for (let i = 0; i < flow.length; i++) { const b = localBox(flow[i]); if ((H ? lp.x < b.cx : lp.y < b.cy)) { idx = i; break; } }
    DRAG.insertIndex = idx; DRAG.insertBefore = flow[idx]?.id || null;
    const wm = worldMatrix(target);
    let pos;
    if (!flow.length) pos = H ? (target.padding[3]) : target.padding[0];
    else if (idx < flow.length) { const b = localBox(flow[idx]); pos = (H ? b.x : b.y) - (target.itemSpacing || 0) / 2; }
    else { const b = localBox(flow[flow.length - 1]); pos = (H ? b.x2 : b.y2) + (target.itemSpacing || 0) / 2; }
    const [pt_, pr, pb, pl] = target.padding;
    const a = H ? { x: pos, y: pt_ } : { x: pl, y: pos }, bb = H ? { x: pos, y: target.h - pb } : { x: target.w - pr, y: pos };
    OV.insert = { a: M.apply(wm, a), b: M.apply(wm, bb) };
    OV.guides = [];
  }
  layoutAll(); renderLive();
}
function moveEnd(e) {
  const ids = DRAG.ids.filter(id => N(id));
  const target = N(DRAG.target) || pageNode();
  D.dragging = null;
  const before = DRAG.insertBefore ? N(DRAG.insertBefore) : null;
  let label = 'Move';
  if (isAuto(target)) {
    // insert all moving nodes at index (by order of their z-order)
    const ordered = ids.slice().sort((a, b) => indexInParent(N(a)) - indexInParent(N(b)));
    ordered.forEach(id => { const n = N(id); if (n.parent !== target.id) { reparent(n, target.id); label = 'Move into frame'; } detach(n); });
    let idx = before ? target.children.indexOf(before.id) : target.children.length;
    if (idx < 0) idx = target.children.length;
    target.children.splice(idx, 0, ...ordered); ordered.forEach(id => N(id).parent = target.id);
    if (label === 'Move') label = 'Reorder';
  } else {
    ids.forEach(id => { const n = N(id); if (n.parent !== target.id) { reparent(n, target.id); label = target.type === 'PAGE' ? 'Move out of frame' : 'Move into frame'; } });
  }
  commit(label);
}

/* ---------- resize / rotate ---------- */
function startTransform(e, h, w) {
  const ids = topSelection(D.sel.slice());
  const snap = snapshotIds(ids);
  if (h.kind === 'linept') { const n = N(ids[0]); setDrag({ type: 'linept', id: n.id, i: h.i, snap, inv: M.inv(worldMatrix(n)), other: clone(n.paths[0].pts[1 - h.i]) }); return; }
  if (h.kind === 'rotate') {
    const b = ids.length === 1 ? null : selBox(ids);
    const pivot = ids.length === 1 ? M.apply(worldMatrix(N(ids[0])), { x: N(ids[0]).w / 2, y: N(ids[0]).h / 2 }) : { x: b.cx, y: b.cy };
    setDrag({ type: 'rotate', ids, snap, pivot, a0: Math.atan2(w.y - pivot.y, w.x - pivot.x), rots: ids.map(id => N(id).rotation || 0), centers: ids.map(id => { const n = N(id); return M.apply(worldMatrix(n), { x: n.w / 2, y: n.h / 2 }); }) });
    return;
  }
  const n = ids.length === 1 ? N(ids[0]) : null;
  D.dragging = new Set(ids);
  setDrag({ type: 'resize', ids, snap, hx: h.hx, hy: h.hy, single: n ? n.id : null, lm0: n ? localMatrix(n) : null, w0: n ? n.w : 0, h0: n ? n.h : 0, pw: n ? parentWorld(n) : null, box0: selBox(ids), cands: snapCands(ids) });
}
function resizeUpdate(e, w) {
  restoreSnap(DRAG.snap);
  OV.guides = [];
  const { hx, hy } = DRAG;
  if (DRAG.single) {
    const n = N(DRAG.single), w0 = DRAG.w0, h0 = DRAG.h0;
    const q = M.apply(M.inv(M.mul(DRAG.pw, DRAG.lm0)), w);
    let x0 = 0, y0 = 0, x1 = w0, y1 = h0;
    const simple = !n.rotation && !n.flipX && !n.flipY && Math.abs(DRAG.pw[1]) < 1e-9 && Math.abs(DRAG.pw[2]) < 1e-9 && DRAG.pw[0] > 0 && DRAG.pw[3] > 0;
    const org = simple ? M.apply(M.mul(DRAG.pw, DRAG.lm0), { x: 0, y: 0 }) : null;
    let qx = q.x, qy = q.y;
    if (simple && !e.ctrlKey && !e.metaKey) {   // snap moving edges in world
      const wx = org.x + qx, wy = org.y + qy;
      const s = computeSnap({ x: wx, y: wy, w: 0, h: 0 }, DRAG.cands, { x: hx === 0.5 ? [] : [0], y: hy === 0.5 ? [] : [0] });
      if (s.sx) qx += s.dx; else qx = Math.round(org.x + qx) - org.x;
      if (s.sy) qy += s.dy; else qy = Math.round(org.y + qy) - org.y;
      DRAG.snapHit = s;
    }
    if (hx === 0) x0 = qx; if (hx === 1) x1 = qx; if (hy === 0) y0 = qy; if (hy === 1) y1 = qy;
    if (e.altKey) { if (hx === 1) x0 = w0 - x1; if (hx === 0) x1 = w0 - x0; if (hy === 1) y0 = h0 - y1; if (hy === 0) y1 = h0 - y0; }
    const minS = n.type === 'VECTOR' ? 0 : 1;
    if (x1 - x0 < minS) { if (hx === 1) x1 = x0 + minS; else if (hx === 0) x0 = x1 - minS; }
    if (y1 - y0 < minS) { if (hy === 1) y1 = y0 + minS; else if (hy === 0) y0 = y1 - minS; }
    if (e.shiftKey && w0 > 0 && h0 > 0) {
      const ratio = w0 / h0;
      let nw = x1 - x0, nh = y1 - y0;
      if (hx === 0.5) nw = nh * ratio; else if (hy === 0.5) nh = nw / ratio; else if (nw / w0 > nh / h0) nh = nw / ratio; else nw = nh * ratio;
      if (hx === 1) x1 = x0 + nw; else if (hx === 0) x0 = x1 - nw; else { const c = w0 / 2; x0 = c - nw / 2; x1 = c + nw / 2; }
      if (hy === 1) y1 = y0 + nh; else if (hy === 0) y0 = y1 - nh; else { const c = h0 / 2; y0 = c - nh / 2; y1 = c + nh / 2; }
      if (e.altKey) { x0 = (w0 - nw) / 2; x1 = x0 + nw; y0 = (h0 - nh) / 2; y1 = y0 + nh; }
    }
    const nw = x1 - x0, nh = y1 - y0;
    const c = M.apply(DRAG.lm0, { x: (x0 + x1) / 2, y: (y0 + y1) / 2 });
    resizeNode(n, nw, nh);
    n.x = c.x - n.w / 2; n.y = c.y - n.h / 2;
    if (hx !== 0.5) { if (n.sizingH === 'HUG' || n.sizingH === 'FILL') n.sizingH = 'FIXED'; }
    if (hy !== 0.5) { if (n.sizingV === 'HUG' || n.sizingV === 'FILL') n.sizingV = 'FIXED'; }
    if (n.type === 'TEXT' && hy === 0.5 && hx !== 0.5) n.sizingV = 'HUG';
    if (simple && DRAG.snapHit) { const b = worldBox(n); OV.guides = snapGuides(b, DRAG.cands, DRAG.snapHit.sx, DRAG.snapHit.sy); }
  } else {
    const b0 = DRAG.box0;
    const A = { x: hx === 1 ? b0.x : hx === 0 ? b0.x2 : b0.cx, y: hy === 1 ? b0.y : hy === 0 ? b0.y2 : b0.cy };
    if (e.altKey) { A.x = b0.cx; A.y = b0.cy; }
    let nw = hx === 0.5 ? b0.w : Math.max(1, (hx === 1 ? w.x - A.x : A.x - w.x) * (e.altKey ? 2 : 1));
    let nh = hy === 0.5 ? b0.h : Math.max(1, (hy === 1 ? w.y - A.y : A.y - w.y) * (e.altKey ? 2 : 1));
    let sx = nw / b0.w, sy = nh / b0.h;
    if (e.shiftKey) { const s = hx === 0.5 ? sy : hy === 0.5 ? sx : Math.max(sx, sy); sx = sy = s; }
    DRAG.ids.forEach(id => {
      const n = N(id); const c0 = M.apply(worldMatrix(n), { x: n.w / 2, y: n.h / 2 });
      const fx = (hx === 0.5 && !e.shiftKey) ? 1 : sx, fy = (hy === 0.5 && !e.shiftKey) ? 1 : sy;
      const nc = { x: A.x + (c0.x - A.x) * fx, y: A.y + (c0.y - A.y) * fy };
      const rot = Math.abs(Math.sin(rad(n.rotation || 0) * 2)) > 0.01;
      if (rot) { const k = Math.sqrt(fx * fy); resizeNode(n, n.w * k, n.h * k); }
      else { const sw = Math.abs(Math.cos(rad(n.rotation || 0))) > 0.5; resizeNode(n, n.w * (sw ? fx : fy), n.h * (sw ? fy : fx)); }
      if (n.type === 'TEXT') { if (fx !== 1) n.sizingH = 'FIXED'; if (fy !== 1) n.sizingV = 'FIXED'; }
      const pc = M.apply(M.inv(parentWorld(n)), nc); n.x = pc.x - n.w / 2; n.y = pc.y - n.h / 2;
    });
  }
  layoutAll(); renderLive();
}
function rotateUpdate(e, w) {
  restoreSnap(DRAG.snap);
  const a = Math.atan2(w.y - DRAG.pivot.y, w.x - DRAG.pivot.x);
  let delta = deg(a - DRAG.a0);
  if (DRAG.ids.length === 1) {
    let nr = DRAG.rots[0] + delta;   // stored rotation is clockwise-positive; the panel shows Figma's counter-clockwise convention
    if (e.shiftKey) nr = Math.round(nr / 15) * 15;
    delta = nr - DRAG.rots[0];
  } else if (e.shiftKey) delta = Math.round(delta / 15) * 15;
  const r = rad(delta), cs = Math.cos(r), sn = Math.sin(r);
  DRAG.ids.forEach((id, i) => {
    const n = N(id), c0 = DRAG.centers[i], p = DRAG.pivot;
    const c = { x: p.x + (c0.x - p.x) * cs - (c0.y - p.y) * sn, y: p.y + (c0.x - p.x) * sn + (c0.y - p.y) * cs };
    n.rotation = normAngle(DRAG.rots[i] + delta);
    const pc = M.apply(M.inv(parentWorld(n)), c); n.x = pc.x - n.w / 2; n.y = pc.y - n.h / 2;
  });
  DRAG.angleLabel = DRAG.ids.length === 1 ? -N(DRAG.ids[0]).rotation : -normAngle(delta);
  layoutAll(); renderLive();
}
function lineptUpdate(e, w) {
  restoreSnap(DRAG.snap);
  const n = N(DRAG.id);
  let q = M.apply(DRAG.inv, w);
  if (e.shiftKey) { const o = DRAG.other, ang = Math.atan2(q.y - o.y, q.x - o.x), L = Math.hypot(q.x - o.x, q.y - o.y), sa = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4); q = { x: o.x + Math.cos(sa) * L, y: o.y + Math.sin(sa) * L }; }
  const p = n.paths[0].pts[DRAG.i]; p.x = q.x; p.y = q.y;
  layoutAll(); renderLive();
}

/* ---------- marquee ---------- */
function marqueeUpdate(e, l) {
  OV.marquee = { a: DRAG.a, b: l };
  const a = { x: (Math.min(DRAG.a.x, l.x) - D.panX) / D.zoom, y: (Math.min(DRAG.a.y, l.y) - D.panY) / D.zoom };
  const b = { x: (Math.max(DRAG.a.x, l.x) - D.panX) / D.zoom, y: (Math.max(DRAG.a.y, l.y) - D.panY) / D.zoom };
  const scope = DRAG.scope ? N(DRAG.scope) : pageNode();
  const hits = [];
  kids(scope).forEach(n => {
    if (!n.visible || locked(n)) return;
    const wb = worldBox(n);
    const inter = wb.x < b.x && wb.x2 > a.x && wb.y < b.y && wb.y2 > a.y;
    const inside = wb.x >= a.x && wb.x2 <= b.x && wb.y >= a.y && wb.y2 <= b.y;
    if (scope.type === 'PAGE' && isFrameLike(n) && n.type !== 'INSTANCE' && n.children.length ? inside : inter) hits.push(n.id);
  });
  D.sel = e.shiftKey ? [...new Set([...DRAG.base, ...hits])] : hits;
  need.layers = need.panel = true; renderOverlay();
}

/* ---------- create tools ---------- */
const TOOL_TYPE = { frame: 'FRAME', rect: 'RECT', ellipse: 'ELLIPSE', polygon: 'POLYGON', star: 'STAR', line: 'VECTOR', arrow: 'VECTOR', text: 'TEXT' };
function createDown(e, w) {
  const parent = containerAt(e);
  setDrag({ type: 'create', tool: D.tool, a: { x: Math.round(w.x), y: Math.round(w.y) }, parent: parent.id, node: null, cands: kids(parent).filter(c => c.visible).map(worldBox).concat(parent.type !== 'PAGE' ? [worldBox(parent)] : []) });
}
function createUpdate(e, w) {
  let b = { x: w.x, y: w.y };
  if (!e.ctrlKey && !e.metaKey) { const s = computeSnap({ x: b.x, y: b.y, w: 0, h: 0 }, DRAG.cands, { x: [0], y: [0] }); b.x = s.sx ? b.x + s.dx : Math.round(b.x); b.y = s.sy ? b.y + s.dy : Math.round(b.y); OV.guides = snapGuides({ x: b.x, y: b.y, w: 0, h: 0 }, DRAG.cands, s.sx, s.sy); }
  if (!DRAG.node) { if (dist(b, DRAG.a) * D.zoom < 3) return; DRAG.node = makeShape(DRAG.tool, DRAG.parent); D.sel = [DRAG.node.id]; }
  placeShape(N(DRAG.node.id), DRAG.a, b, e);
  layoutAll(); renderLive(); need.layers = true; need.panel = true;
}
function makeShape(tool, parentId) {
  const type = TOOL_TYPE[tool];
  const parent = N(parentId);
  const n = mkNode(type);
  const count = Object.values(D.nodes).filter(x => x.type === type).length + 1;
  if (tool === 'frame') { n.name = 'Frame ' + count; }
  else if (tool === 'line' || tool === 'arrow') { n.name = tool === 'arrow' ? 'Arrow' : 'Line'; n.paths = [{ closed: false, pts: [pt(0, 0), pt(1, 0)] }]; n.strokeCap = 'NONE'; if (tool === 'arrow') n.endCap = 'ARROW_LINES'; n.strokeWidth = tool === 'arrow' ? 2 : 1; }
  else if (tool === 'text') { n.name = 'Text'; }
  else n.name = TYPE_LABEL[type] + ' ' + count;
  if (isAuto(parent)) { /* goes into flow */ }
  addNode(n, parentId);
  return n;
}
function placeShape(n, a, b, e) {
  const pinv = M.inv(parentWorld(n));
  if (n.type === 'VECTOR') {
    let q = b;
    if (e.shiftKey) { const ang = Math.atan2(b.y - a.y, b.x - a.x), L = dist(a, b), sa = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4); q = { x: a.x + Math.cos(sa) * L, y: a.y + Math.sin(sa) * L }; }
    const la = M.apply(pinv, a), lb = M.apply(pinv, q);
    n.x = 0; n.y = 0; n.rotation = 0; n.w = 0; n.h = 0;
    n.paths = [{ closed: false, pts: [pt(la.x, la.y), pt(lb.x, lb.y)] }];
    normalizeVector(n); return;
  }
  let x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
  if (e.shiftKey) { const s = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); x2 = x1 + Math.sign(x2 - x1 || 1) * s; y2 = y1 + Math.sign(y2 - y1 || 1) * s; }
  if (e.altKey) { x1 = a.x - (x2 - a.x); y1 = a.y - (y2 - a.y); }
  const la = M.apply(pinv, { x: Math.min(x1, x2), y: Math.min(y1, y2) });
  n.x = la.x; n.y = la.y; n.w = Math.max(1, Math.abs(x2 - x1)); n.h = Math.max(1, Math.abs(y2 - y1));
  if (n.type === 'TEXT') { n.sizingH = 'FIXED'; n.sizingV = 'HUG'; }
}
function createEnd(e) {
  OV.guides = [];
  let n = DRAG.node ? N(DRAG.node.id) : null;
  const tool = DRAG.tool;
  if (!n) {
    n = makeShape(tool, DRAG.parent);
    const pinv = M.inv(parentWorld(n)); const la = M.apply(pinv, DRAG.a);
    if (n.type === 'VECTOR') { n.paths = [{ closed: false, pts: [pt(la.x, la.y), pt(la.x + 100, la.y)] }]; normalizeVector(n); }
    else if (n.type === 'TEXT') { n.x = la.x; n.y = la.y; }
    else { n.x = la.x; n.y = la.y; n.w = 100; n.h = 100; }
  }
  if (n.type === 'FRAME') adoptInto(n);
  D.sel = [n.id];
  if (!D.toolLock) setTool('move');
  if (n.type === 'TEXT') { layoutAll(); TE.created = true; startTextEdit(n.id); renderAll(); return; }
  commit('Create ' + (TYPE_LABEL[n.type] || n.type).toLowerCase());
}
function adoptInto(f) {
  const p = parentOf(f); if (!p || isAuto(p)) return;
  const fb = worldBox(f);
  kids(p).filter(c => c.id !== f.id && c.visible && !locked(c)).forEach(c => {
    const b = worldBox(c);
    if (b.x >= fb.x - 0.01 && b.y >= fb.y - 0.01 && b.x2 <= fb.x2 + 0.01 && b.y2 <= fb.y2 + 0.01) reparent(c, f.id);
  });
  // keep frame below the adopted things? frame goes to index of its first adopted
}

/* ---------- pen ---------- */
function penDown(e, l, w) {
  const SM = screenM();
  if (!PEN.id) {
    const parent = containerAt(e);
    const n = mkNode('VECTOR', { name: 'Vector ' + (Object.values(D.nodes).filter(x => x.type === 'VECTOR').length + 1), strokeWidth: 1, strokeCap: 'NONE' });
    addNode(n, parent.id);
    const lp = M.apply(M.inv(parentWorld(n)), w);
    n.x = 0; n.y = 0; n.w = 0; n.h = 0; n.paths = [{ closed: false, pts: [pt(lp.x, lp.y)] }];
    normalizeVector(n);
    PEN.id = n.id; PEN.si = 0; D.sel = [n.id];
    setDrag({ type: 'pen', idx: 0 }); renderAll(); return;
  }
  const n = N(PEN.id); const sp = n.paths[PEN.si];
  const m = M.mul(SM, worldMatrix(n));
  const first = M.apply(m, sp.pts[0]);
  if (sp.pts.length >= 2 && dist(l, first) < 9) { sp.closed = true; setDrag({ type: 'pen', idx: 0, closing: true }); layoutAll(); renderLive(); return; }
  let q = M.apply(M.inv(worldMatrix(n)), w);
  if (e.shiftKey) { const o = sp.pts[sp.pts.length - 1]; const ang = Math.atan2(q.y - o.y, q.x - o.x), L = dist(q, o), sa = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4); q = { x: o.x + Math.cos(sa) * L, y: o.y + Math.sin(sa) * L }; }
  sp.pts.push(pt(q.x, q.y));
  setDrag({ type: 'pen', idx: sp.pts.length - 1 });
  layoutAll(); renderLive();
}
function penDrag(e, w) {
  const n = N(PEN.id); if (!n) return; const sp = n.paths[PEN.si]; const p = sp.pts[DRAG.idx];
  const q = M.apply(M.inv(worldMatrix(n)), w);
  const ox = q.x - p.x, oy = q.y - p.y;
  if (Math.hypot(ox, oy) * D.zoom < 2) return;
  p.ox = ox; p.oy = oy; p.ix = -ox; p.iy = -oy;
  layoutAll(); renderLive();
}
function penUp() { if (DRAG.closing) finishPen(); else renderOverlay(); }
function finishPen() {
  const n = N(PEN.id); PEN.id = null; PEN.hover = null;
  if (n) { const sp = n.paths[0]; if (!sp || (sp.pts.length < 2)) { removeNode(n.id); D.sel = []; } else D.sel = [n.id]; }
  setTool('move');
  commit('Draw path');
}
function drawPen(SM) {
  const n = N(PEN.id); if (!n) return '';
  const m = M.mul(SM, worldMatrix(n)); let s = '';
  const sp = n.paths[PEN.si];
  s += `<path d="${pathsToD(transformPaths(n.paths, m))}" class="vedge"/>`;
  if (PEN.hover && !DRAG.active && !sp.closed) {
    const last = sp.pts[sp.pts.length - 1];
    let hv = M.apply(M.inv(worldMatrix(n)), PEN.hover);
    if (PEN.shift) { const ang = Math.atan2(hv.y - last.y, hv.x - last.x), L = dist(hv, last), sa = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4); hv = { x: last.x + Math.cos(sa) * L, y: last.y + Math.sin(sa) * L }; }
    const a = M.apply(m, last), c1 = M.apply(m, { x: last.x + last.ox, y: last.y + last.oy }), b = M.apply(m, hv);
    s += `<path d="M${r3(a.x)} ${r3(a.y)}C${r3(c1.x)} ${r3(c1.y)} ${r3(b.x)} ${r3(b.y)} ${r3(b.x)} ${r3(b.y)}" class="vrubber"/>`;
  }
  sp.pts.forEach((p, i) => {
    const q = M.apply(m, p);
    if (i === sp.pts.length - 1 && (p.ox || p.oy)) {
      const ho = M.apply(m, { x: p.x + p.ox, y: p.y + p.oy }), hi = M.apply(m, { x: p.x + p.ix, y: p.y + p.iy });
      s += `<line x1="${r3(hi.x)}" y1="${r3(hi.y)}" x2="${r3(ho.x)}" y2="${r3(ho.y)}" class="vhl"/><circle cx="${r3(ho.x)}" cy="${r3(ho.y)}" r="3" class="vh"/><circle cx="${r3(hi.x)}" cy="${r3(hi.y)}" r="3" class="vh"/>`;
    }
    s += `<rect x="${r3(q.x - 3.5)}" y="${r3(q.y - 3.5)}" width="7" height="7" class="vpt${i === 0 ? ' first' : ''}"/>`;
  });
  return s;
}

/* ---------- pencil ---------- */
function pencilEnd() {
  const pts = PENCIL.pts; PENCIL.pts = null;
  if (!pts || pts.length < 2) { renderOverlay(); return; }
  const parentId = PENCIL.parent || D.page;
  const n = mkNode('VECTOR', { name: 'Pencil', strokeWidth: 2, strokeCap: 'ROUND', strokeJoin: 'ROUND' });
  addNode(n, parentId);
  const pinv = M.inv(parentWorld(n));
  const lp = pts.map(p => M.apply(pinv, p));
  let path;
  if (paperInit()) {
    try {
      const pp = new paper.Path({ segments: lp.map(p => [p.x, p.y]), insert: false });
      pp.simplify(Math.max(0.6, 2.5 / D.zoom));
      path = fromPaper(pp)[0];
      path.closed = false;
    } catch (e) { path = null; }
  }
  if (!path) path = { closed: false, pts: rdp(lp, 1.2 / D.zoom).map(p => pt(p.x, p.y)) };
  n.x = n.y = 0; n.w = n.h = 0; n.paths = [path];
  normalizeVector(n);
  D.sel = [n.id];
  commit('Draw');
}
function rdp(points, eps) {
  if (points.length < 3) return points;
  let dmax = 0, idx = 0; const a = points[0], b = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) { const d = distToSeg(points[i], a, b).d; if (d > dmax) { dmax = d; idx = i; } }
  if (dmax > eps) { const l = rdp(points.slice(0, idx + 1), eps), r = rdp(points.slice(idx), eps); return l.slice(0, -1).concat(r); }
  return [a, b];
}

/* ---------- text editing ---------- */
const TA = () => $('#texted');
function startTextEdit(id, selectAll) {
  const n = N(id); if (!n || n.type !== 'TEXT') return;
  exitVecEdit(true);
  TE.id = id; TE.orig = n.characters;
  const ta = TA(); ta.value = n.characters; ta.hidden = false;
  D.sel = [id];
  renderAll();
  positionTextEditor();
  ta.focus();
  if (selectAll) ta.select(); else ta.setSelectionRange(ta.value.length, ta.value.length);
}
function positionTextEditor() {
  const ta = TA(); if (!ta) return;
  if (!TE.id) { ta.hidden = true; return; }
  const n = N(TE.id); if (!n) { TE.id = null; ta.hidden = true; return; }
  const L = textRenderLayout(n);
  const hug = n.sizingH === 'HUG';
  const extra = hug ? n.fontSize : 0;
  const ox = hug ? (n.textAlign === 'CENTER' ? -extra / 2 : n.textAlign === 'RIGHT' ? -extra : 0) : 0;
  const total = L.lines.length * L.lh;
  let oy = 0; if (n.verticalAlign === 'CENTER') oy = (n.h - total) / 2; else if (n.verticalAlign === 'BOTTOM') oy = n.h - total;
  const m = M.mul(M.mul(screenM(), worldMatrix(n)), M.tr(ox, oy));
  const fill = visPaints(n.fills).find(p => p.type === 'SOLID');
  Object.assign(ta.style, {
    transform: `matrix(${m.map(v => round(v, 5)).join(',')})`, width: (n.w + extra + 1) + 'px', height: Math.max(total, L.lh) + 'px',
    font: fontCSS(n), lineHeight: L.lh + 'px', letterSpacing: (n.letterSpacing || 0) + 'px',
    textAlign: ({ CENTER: 'center', RIGHT: 'right' }[n.textAlign] || 'left'), whiteSpace: hug ? 'pre' : 'pre-wrap',
    color: fill ? rgba(fill.color, fill.opacity ?? 1) : 'transparent', textTransform: { UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize' }[n.textCase] || 'none',
    textDecoration: { UNDERLINE: 'underline', STRIKETHROUGH: 'line-through' }[n.textDecoration] || 'none',
  });
}
function onTextInput() {
  const n = N(TE.id); if (!n) return;
  n.characters = TA().value; markOverride(n, 'characters');
  if (!n.mainRef) n.name = n.characters.slice(0, 40).replace(/\n/g, ' ') || 'Text';
  layoutAll(); renderLive(); positionTextEditor(); need.layers = true; schedule();
}
function endTextEdit(commitIt = true) {
  if (!TE.id) return;
  const n = N(TE.id); const id = TE.id; TE.id = null;
  const ta = TA(); ta.hidden = true; ta.blur();
  if (n && !n.characters.trim() && !n.mainRef) { removeNode(id); D.sel = D.sel.filter(x => x !== id); }
  TE.created = false;
  if (commitIt) commit('Edit text'); else renderAll();
}

/* ---------- vector editing ---------- */
function enterVecEdit(id) {
  const n = N(id); if (!n || n.type !== 'VECTOR' || n.mainRef) return;
  VE.id = id; VE.sel = []; D.sel = [id];
  toast(`Editing path — drag points, click a segment to add one, ${isMac ? 'Delete' : 'Del'} removes, Esc to finish`, 3200);
  renderAll();
}
function exitVecEdit(commitIt = true) { if (!VE.id) return; VE.id = null; VE.sel = []; if (commitIt) commit('Edit vector'); else renderAll(); }
const vkey = (si, pi) => si + ':' + pi;
function vecDown(e, l, w) {
  const n = N(VE.id); const wm = worldMatrix(n), m = M.mul(screenM(), wm);
  const snap = snapshotIds([n.id]);
  // handles
  for (const k of VE.sel) {
    const [si, pi] = k.split(':').map(Number); const p = n.paths[si]?.pts[pi]; if (!p) continue;
    for (const which of ['in', 'out']) {
      const hx = which === 'in' ? p.ix : p.ox, hy = which === 'in' ? p.iy : p.oy; if (!hx && !hy) continue;
      if (dist(l, M.apply(m, { x: p.x + hx, y: p.y + hy })) < 7) { setDrag({ type: 'vhandle', si, pi, which, snap, inv: M.inv(wm), mirror: !e.altKey && isSmooth(p) }); return; }
    }
  }
  // points
  for (let si = 0; si < n.paths.length; si++) for (let pi = 0; pi < n.paths[si].pts.length; pi++) {
    const q = M.apply(m, n.paths[si].pts[pi]);
    if (dist(l, q) < 7) {
      const k = vkey(si, pi);
      if (e.shiftKey) VE.sel = VE.sel.includes(k) ? VE.sel.filter(x => x !== k) : [...VE.sel, k]; else if (!VE.sel.includes(k)) VE.sel = [k];
      setDrag({ type: 'vpts', snap, inv: M.inv(wm), startL: M.apply(M.inv(wm), w) }); renderOverlay(); return;
    }
  }
  // segments
  const lp = M.apply(M.inv(wm), w);
  let best = null;
  samplePaths(n.paths, 24).forEach(sg => { const r = distToSeg(lp, sg.a, sg.b); if (!best || r.d < best.d) best = { d: r.d, si: sg.si, seg: sg.seg, t: lerp(sg.a.t, sg.b.t, r.t) }; });
  if (best && best.d * D.zoom < 6) {
    const ni = splitSegment(n.paths[best.si], best.seg, best.t);
    VE.sel = [vkey(best.si, ni)];
    setDrag({ type: 'vpts', snap: snapshotIds([n.id]), inv: M.inv(wm), startL: lp }); layoutAll(); renderLive(); return;
  }
  // outside: exit if outside node
  const b = worldBox(n); const pad = 10 / D.zoom;
  if (w.x < b.x - pad || w.x > b.x2 + pad || w.y < b.y - pad || w.y > b.y2 + pad) { exitVecEdit(true); return onPointerDown(e); }
  VE.sel = []; renderOverlay();
}
function isSmooth(p) { if (!(p.ix || p.iy) || !(p.ox || p.oy)) return false; const c = p.ix * p.oy - p.iy * p.ox; return Math.abs(c) < 1e-3 * Math.hypot(p.ix, p.iy) * Math.hypot(p.ox, p.oy) + 1e-6; }
function vecDrag(e, w) {
  restoreSnap(DRAG.snap);
  const n = N(VE.id); if (!n) return;
  const q = M.apply(DRAG.inv, w);
  if (DRAG.type === 'vpts') {
    let dx = q.x - DRAG.startL.x, dy = q.y - DRAG.startL.y;
    if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    VE.sel.forEach(k => { const [si, pi] = k.split(':').map(Number); const p = n.paths[si]?.pts[pi]; if (p) { p.x += dx; p.y += dy; } });
  } else {
    const p = n.paths[DRAG.si].pts[DRAG.pi];
    const hx = q.x - p.x, hy = q.y - p.y;
    if (DRAG.which === 'out') { const L = Math.hypot(p.ix, p.iy); p.ox = hx; p.oy = hy; if (DRAG.mirror) { const k = L / (Math.hypot(hx, hy) || 1); p.ix = -hx * k; p.iy = -hy * k; } }
    else { const L = Math.hypot(p.ox, p.oy); p.ix = hx; p.iy = hy; if (DRAG.mirror) { const k = L / (Math.hypot(hx, hy) || 1); p.ox = -hx * k; p.oy = -hy * k; } }
  }
  layoutAll(); renderLive();
}
function vecDblClick(e) {
  const n = N(VE.id); const m = M.mul(screenM(), worldMatrix(n)); const l = toLocal(e);
  for (let si = 0; si < n.paths.length; si++) for (let pi = 0; pi < n.paths[si].pts.length; pi++) {
    const P = n.paths[si].pts, p = P[pi];
    if (dist(l, M.apply(m, p)) < 7) {
      if (p.ix || p.iy || p.ox || p.oy) { p.ix = p.iy = p.ox = p.oy = 0; }
      else {
        const prev = P[(pi - 1 + P.length) % P.length], next = P[(pi + 1) % P.length];
        const tx = next.x - prev.x, ty = next.y - prev.y, L = Math.hypot(tx, ty) || 1, k = Math.min(dist(p, prev), dist(p, next)) * 0.4;
        p.ox = tx / L * k; p.oy = ty / L * k; p.ix = -p.ox; p.iy = -p.oy;
      }
      commit('Toggle point'); return true;
    }
  }
  return false;
}
function vecDeletePoints() {
  const n = N(VE.id); if (!n || !VE.sel.length) return false;
  const del = new Set(VE.sel);
  n.paths = n.paths.map((sp, si) => ({ closed: sp.closed, pts: sp.pts.filter((p, pi) => !del.has(vkey(si, pi))) })).filter(sp => sp.pts.length >= 2);
  n.paths.forEach(sp => { if (sp.pts.length < 3) sp.closed = false; });
  VE.sel = [];
  if (!n.paths.length) { removeNode(n.id); VE.id = null; D.sel = []; }
  commit('Delete points');
  return true;
}
function drawVecEdit(n, SM) {
  const m = M.mul(SM, worldMatrix(n)); let s = `<path d="${pathsToD(transformPaths(n.paths, m))}" class="vedge"/>`;
  n.paths.forEach((sp, si) => sp.pts.forEach((p, pi) => {
    const on = VE.sel.includes(vkey(si, pi)); const q = M.apply(m, p);
    if (on) ['in', 'out'].forEach(wh => {
      const hx = wh === 'in' ? p.ix : p.ox, hy = wh === 'in' ? p.iy : p.oy; if (!hx && !hy) return;
      const hq = M.apply(m, { x: p.x + hx, y: p.y + hy });
      s += `<line x1="${r3(q.x)}" y1="${r3(q.y)}" x2="${r3(hq.x)}" y2="${r3(hq.y)}" class="vhl"/><circle cx="${r3(hq.x)}" cy="${r3(hq.y)}" r="3.5" class="vh"/>`;
    });
    s += `<circle cx="${r3(q.x)}" cy="${r3(q.y)}" r="${on ? 4.5 : 3.5}" class="vpt2${on ? ' on' : ''}"/>`;
  }));
  return s;
}

/* ---------- double click ---------- */
function onDblClick(e) {
  if (D.tool !== 'move') { if (D.tool === 'pen' && PEN.id) finishPen(); return; }
  if (VE.id) { vecDblClick(e); return; }
  const l = toLocal(e); const lab = labelAt(l);
  if (lab) { startRename(lab.id); return; }
  const deepest = deepestAt(e, n => locked(n)); if (!deepest) return;
  const sel = D.sel.length === 1 ? N(D.sel[0]) : null;
  if (sel && sel.type === 'TEXT' && deepest.id === sel.id) return startTextEdit(sel.id, true);
  if (sel && sel.type === 'VECTOR' && deepest.id === sel.id) return enterVecEdit(sel.id);
  if (sel && isContainer(sel) && isAncestor(sel, deepest)) {
    const path = [deepest, ...ancestors(deepest)];
    const child = path.find(x => x.parent === sel.id);
    if (child) { D.sel = [child.id]; if (child.type === 'TEXT') return startTextEdit(child.id, true); renderAll(); }
    return;
  }
  const r = resolveSelectable(deepest); const t = r && (r.node || r.bg);
  if (!t) return;
  if (t.type === 'TEXT') { D.sel = [t.id]; startTextEdit(t.id, true); }
  else if (t.type === 'VECTOR' && !t.mainRef) enterVecEdit(t.id);
  else { D.sel = [t.id]; renderAll(); }
}

/* ---------- wheel ---------- */
function onWheel(e) {
  if (e.target.closest('.floating')) return;
  e.preventDefault(); updateStageRect();
  const l = toLocal(e);
  if (e.ctrlKey || e.metaKey) {
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(l.x, l.y, D.zoom * Math.exp(-clamp(dy, -80, 80) * 0.009));
  } else {
    let dx = e.deltaX, dy = e.deltaY; if (e.deltaMode === 1) { dx *= 16; dy *= 16; }
    if (e.shiftKey && !dx) { dx = dy; dy = 0; }
    D.panX -= dx; D.panY -= dy; applyViewport();
  }
}
