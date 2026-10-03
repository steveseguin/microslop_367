/* ============================================================
   Commands: structure ops, clipboard, import, keyboard
   ============================================================ */
const selNodes = () => D.sel.map(N).filter(Boolean);
const editableIds = () => topSelection(D.sel.filter(id => { const n = N(id); return n && !n.mainRef && !locked(n); }));
function setTool(t) {
  if (PEN.id && t !== 'pen') finishPen();
  if (VE.id && t !== 'move') exitVecEdit(true);
  if (TE.id) endTextEdit(true);
  D.tool = t; stage.dataset.tool = t;
  $$('#toolbar button').forEach(b => b.classList.toggle('on', b.dataset.tool === t || !!(b.dataset.group && b.dataset.group.split(',').includes(t))));
  const shapeBtn = $('#toolbar [data-group]'); if (shapeBtn && shapeBtn.dataset.group.split(',').includes(t)) { shapeBtn.dataset.tool = t; shapeBtn.innerHTML = ICONS[t] + '<i class="caret"></i>'; shapeBtn.title = TOOL_TITLES[t]; }
  stage.style.cursor = '';
  renderOverlay(); if (need.panel !== undefined) { need.panel = true; schedule(); }
}
function sortByZ(ids) {   // paint order (bottom first) for nodes sharing a parent; otherwise document order
  const order = new Map(); let i = 0;
  (function walk(n) { order.set(n.id, i++); kids(n).forEach(walk); })(root());
  return ids.slice().sort((a, b) => order.get(a) - order.get(b));
}
function duplicateNodes(ids, offset) {
  const out = [];
  sortByZ(ids).forEach(id => {
    const n = N(id); const list = cloneTree(id);
    const r = list[0]; r.parent = n.parent;
    list.forEach(c => D.nodes[c.id] = c);
    const p = parentOf(n); p.children.splice(p.children.indexOf(n.id) + 1 + out.filter(o => N(o).parent === p.id).length, 0, r.id);
    if (r.mainRef) { /* duplicating an instance child isn't allowed */ }
    if (offset && p.type === 'PAGE' && isFrameLike(r)) r.x += r.w + 40;
    if (r.type === 'COMPONENT') r.name = r.name + ' copy';
    out.push(r.id);
  });
  return out;
}
function cmdDuplicate() { const ids = editableIds(); if (!ids.length) return; D.sel = duplicateNodes(ids, true); commit('Duplicate'); }
function cmdDelete() {
  if (VE.id) { vecDeletePoints(); return; }
  const ns = selNodes(); if (!ns.length) return;
  if (ns.some(n => n.mainRef)) toast('Layers inside an instance can be hidden but not deleted');
  topSelection(ns.filter(n => !n.mainRef && !locked(n)).map(n => n.id)).forEach(removeNode);
  D.sel = []; commit('Delete');
}
function cmdGroup(type = 'GROUP', extra = {}) {
  const ids = sortByZ(editableIds()); if (!ids.length) return null;
  const parent = parentOf(N(ids[ids.length - 1]));
  const idx = Math.max(...ids.filter(id => N(id).parent === parent.id).map(id => indexInParent(N(id))));
  const g = mkNode(type, Object.assign({ name: (type === 'GROUP' ? 'Group ' : 'Frame ') + (Object.values(D.nodes).filter(x => x.type === type).length + 1), x: 0, y: 0, w: 1, h: 1 }, extra));
  if (g.type !== 'GROUP') { g.fills = []; g.clipsContent = false; }
  addNode(g, parent.id, idx + 1);
  if (type !== 'GROUP') {
    // frame bounds in parent space
    const pts = []; ids.forEach(id => { const n = N(id); pts.push(...corners(n, M.mul(M.inv(parentWorld(g)), worldMatrix(n)))); });
    const b = aabb(pts); g.x = Math.round(b.x); g.y = Math.round(b.y); g.w = Math.max(1, Math.round(b.x2) - g.x); g.h = Math.max(1, Math.round(b.y2) - g.y);
  }
  ids.forEach(id => reparent(N(id), g.id));
  if (isAuto(parent)) { g.sizingH = 'FIXED'; g.sizingV = 'FIXED'; }
  D.sel = [g.id];
  return g;
}
function cmdUngroup() {
  const out = [];
  selNodes().filter(n => ['GROUP', 'BOOLEAN', 'FRAME'].includes(n.type) && !n.mainRef && !locked(n)).forEach(g => {
    const p = parentOf(g); let idx = indexInParent(g);
    kids(g).forEach(c => { reparent(c, p.id, ++idx); out.push(c.id); });
    removeNode(g.id);
  });
  if (out.length) { D.sel = out; commit('Ungroup'); }
}
function cmdFrameSelection() { const g = cmdGroup('FRAME', { fills: [solid('#FFFFFF')] }); if (g) { g.fills = [solid('#FFFFFF')]; g.clipsContent = true; commit('Frame selection'); } }
function inferFlow(ks) {
  if (!ks.length) return { mode: 'VERTICAL', gap: 10, sorted: [] };
  const bs = ks.map(c => ({ c, b: localBox(c) }));
  const sx = Math.max(...bs.map(o => o.b.cx)) - Math.min(...bs.map(o => o.b.cx)), sy = Math.max(...bs.map(o => o.b.cy)) - Math.min(...bs.map(o => o.b.cy));
  const H = sx > sy;
  bs.sort((a, b) => H ? a.b.x - b.b.x : a.b.y - b.b.y);
  let gaps = []; for (let i = 1; i < bs.length; i++) gaps.push(H ? bs[i].b.x - bs[i - 1].b.x2 : bs[i].b.y - bs[i - 1].b.y2);
  const gap = gaps.length ? Math.max(0, Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)) : 10;
  return { mode: H ? 'HORIZONTAL' : 'VERTICAL', gap, sorted: bs.map(o => o.c), boxes: bs.map(o => o.b) };
}
function cmdAutoLayout() {
  const ns = selNodes().filter(n => !n.mainRef && !locked(n));
  if (!ns.length) return;
  if (ns.length === 1 && isFrameLike(ns[0]) && ns[0].type !== 'INSTANCE' && !isAuto(ns[0])) {
    const f = ns[0]; const ks = kids(f).filter(c => c.visible);
    const fl = inferFlow(ks);
    f.layoutMode = fl.mode; f.itemSpacing = fl.gap;
    if (ks.length) {
      const b = aabb(ks.flatMap(c => corners(c, localMatrix(c))));
      f.padding = [Math.max(0, Math.round(b.y)), Math.max(0, Math.round(f.w - b.x2)), Math.max(0, Math.round(f.h - b.y2)), Math.max(0, Math.round(b.x))];
      f.children = [...fl.sorted.map(c => c.id), ...f.children.filter(id => !fl.sorted.some(c => c.id === id))];
      f.sizingH = 'HUG'; f.sizingV = 'HUG';
    }
    commit('Add auto layout'); return;
  }
  if (ns.length === 1 && isAuto(ns[0])) { toast('Already uses auto layout'); return; }
  const ids = editableIds();
  const fl = inferFlow(ids.map(N));
  const g = cmdGroup('FRAME', { name: 'Frame ' + (Object.values(D.nodes).filter(x => x.type === 'FRAME').length + 1) });
  if (!g) return;
  g.fills = []; g.clipsContent = false; g.layoutMode = fl.mode; g.itemSpacing = fl.gap; g.padding = [0, 0, 0, 0]; g.sizingH = 'HUG'; g.sizingV = 'HUG';
  g.children = fl.sorted.map(c => c.id).filter(id => g.children.includes(id));
  commit('Add auto layout');
}
function cmdRemoveAutoLayout() { const ns = selNodes().filter(isAuto); ns.forEach(n => { n.layoutMode = 'NONE'; n.sizingH = 'FIXED'; n.sizingV = 'FIXED'; }); if (ns.length) commit('Remove auto layout'); }
function cmdCreateComponent() {
  const ns = selNodes().filter(n => !n.mainRef && !locked(n));
  if (!ns.length) return;
  if (ns.some(n => instanceRootOf(n) || ancestors(n).some(a => a.type === 'INSTANCE'))) return toast("Components can't be created inside an instance");
  if (ns.length === 1 && (ns[0].type === 'FRAME' || ns[0].type === 'GROUP')) {
    const n = ns[0];
    if (n.type === 'GROUP') Object.assign(n, { fills: [], clipsContent: false, cornerRadius: 0, cornerRadii: null, layoutMode: 'NONE', itemSpacing: 10, padding: [10, 10, 10, 10], primaryAlign: 'MIN', counterAlign: 'MIN', blendMode: 'NORMAL' });
    n.type = 'COMPONENT'; n.description = n.description || '';
    commit('Create component'); toast('Component created — drag it from Assets to reuse'); return;
  }
  if (ns.length === 1 && ns[0].type === 'COMPONENT') return toast('Already a component');
  const g = cmdGroup('COMPONENT', { name: 'Component ' + (Object.values(D.nodes).filter(x => x.type === 'COMPONENT').length + 1) });
  if (g) { g.fills = []; g.clipsContent = false; g.description = ''; commit('Create component'); toast('Component created — drag it from Assets to reuse'); }
}
function promoteNested(rootNode, lookup = N) {
  // after detaching: descendants that belong to nested instances re-point at the inner component
  (function walk(n, inNested) {
    kids(n).forEach(c => {
      if (inNested) {
        const src = lookup(c.mainRef);
        if (src && src.mainRef) { c.overrides = [...new Set([...(c.overrides || []), ...(src.overrides || [])])]; c.mainRef = src.mainRef; }
        else { delete c.mainRef; delete c.overrides; }
        walk(c, true);
      } else if (c.type === 'INSTANCE' && N(c.componentId)) {
        const src = lookup(c.mainRef);
        c.overrides = [...new Set([...(c.overrides || []), ...((src && src.overrides) || [])])].filter(k => !SKIP_ROOT.has(k));
        delete c.mainRef; walk(c, true);
      } else { delete c.mainRef; delete c.overrides; if (c.type === 'INSTANCE') { c.type = 'FRAME'; delete c.componentId; } walk(c, false); }
    });
  })(rootNode, false);
}
function cmdDetach() {
  const ns = selNodes().filter(n => n.type === 'INSTANCE' && !n.mainRef);
  if (!ns.length) return toast('Select an instance to detach');
  ns.forEach(n => { promoteNested(n); n.type = 'FRAME'; delete n.componentId; delete n.overrides; });
  commit('Detach instance');
}
function cmdGoToMain() {
  const n = selNodes()[0]; const inst = n && (n.type === 'INSTANCE' ? n : instanceRootOf(n));
  const m = inst && N(inst.componentId); if (!m) return toast('Main component not found');
  const pg = pageOf(m); if (pg.id !== D.page) switchPage(pg.id, true);
  D.sel = [m.id]; renderAll(); zoomToBox(worldBox(m), 1);
}
function cmdResetOverrides() {
  const n = selNodes()[0]; const inst = n && (n.type === 'INSTANCE' && !n.mainRef ? n : instanceRootOf(n)); if (!inst) return;
  [inst, ...descendants(inst)].forEach(d => d.overrides = []);
  commit('Reset overrides');
}
function cmdInsertInstance(cid, at) {
  const m = N(cid); if (!m) return;
  let parent = pageNode();
  const s = selNodes()[0];
  if (s && (s.type === 'FRAME' || s.type === 'COMPONENT') && !s.mainRef && s.id !== cid && !isAncestor(s, m) && !isAncestor(m, s)) parent = s;
  if (parent.type === 'COMPONENT' && (parent.id === cid || isAncestor(m, parent))) parent = pageNode();
  const vb = viewportWorldBox(); const c = at || { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
  const pl = M.apply(M.inv(parent.type === 'PAGE' ? M.I() : worldMatrix(parent)), c);
  const inst = createInstance(cid, parent.id, Math.round(pl.x - m.w / 2), Math.round(pl.y - m.h / 2));
  D.sel = [inst.id]; commit('Insert instance');
}
function cmdBoolean(op) {
  const ns = selNodes();
  if (ns.length === 1 && ns[0].type === 'BOOLEAN') { ns[0].booleanOp = op; ns[0].name = BOOL_NAMES[op]; ns[0].bkey = null; commit('Boolean'); return; }
  const ids = sortByZ(editableIds()).filter(id => N(id).type !== 'TEXT');
  if (ids.length < 2) return toast('Select two or more shapes');
  const first = N(ids[0]);
  const fillsFrom = first.type === 'GROUP' ? (descendants(first).find(d => d.fills?.length) || first) : first;
  const g = cmdGroup('BOOLEAN', { booleanOp: op, name: BOOL_NAMES[op] });
  g.fills = clone(fillsFrom.fills || [solid('#D9D9D9')]); g.strokes = clone(fillsFrom.strokes || []); g.strokeWidth = fillsFrom.strokeWidth || 1;
  g.bkey = null; g.bpaths = null;
  if (!hasPaper()) toast('Boolean engine is still loading — showing a preview');
  commit(BOOL_NAMES[op]);
}
const BOOL_NAMES = { UNION: 'Union', SUBTRACT: 'Subtract', INTERSECT: 'Intersect', EXCLUDE: 'Exclude' };
function flattenOutline(n) {
  if (!n.visible) return [];
  if (isFrameLike(n)) { let out = visPaints(n.fills).length ? shapePaths(n) : []; kids(n).forEach(c => out = out.concat(transformPaths(flattenOutline(c), localMatrix(c)))); return out; }
  if (n.type === 'TEXT') return [];
  return outlinePaths(n);
}
function cmdFlatten() {
  const ids = sortByZ(editableIds()); if (!ids.length) return;
  const first = N(ids[0]); const parent = parentOf(N(ids[ids.length - 1]));
  const pinv = M.inv(parent.type === 'PAGE' ? M.I() : worldMatrix(parent));
  let paths = [];
  ids.forEach(id => { const n = N(id); paths = paths.concat(transformPaths(flattenOutline(n), M.mul(pinv, worldMatrix(n)))); });
  if (!paths.length) return toast('Nothing to flatten');
  const src = first.type === 'GROUP' ? (descendants(first).find(d => d.fills?.length || d.strokes?.length) || first) : first;
  const v = mkNode('VECTOR', { name: ids.length === 1 ? first.name : 'Vector', paths, x: 0, y: 0, w: 0, h: 0, fills: clone(src.fills || []), strokes: clone(src.strokes || []), strokeWidth: src.strokeWidth || 1, strokeAlign: src.type === 'VECTOR' ? src.strokeAlign : 'INSIDE', effects: clone(src.effects || []), opacity: src.opacity ?? 1, fillRule: paths.length > 1 ? 'nonzero' : 'nonzero' });
  const idx = indexInParent(N(ids[ids.length - 1]));
  addNode(v, parent.id, idx + 1);
  ids.forEach(removeNode);
  normalizeVector(v); D.sel = [v.id]; commit('Flatten');
}
function cmdMask() {
  const ns = selNodes();
  if (ns.length === 1 && ns[0].isMask) { ns[0].isMask = false; commit('Remove mask'); return; }
  const ids = sortByZ(editableIds()); if (ids.length < 2) return toast('Select a mask shape and the layers to mask');
  const bottom = ids[0];
  const g = cmdGroup('GROUP', { name: 'Mask group' }); N(bottom).isMask = true;
  commit('Use as mask');
}
function cmdAlign(dir) {
  const ns = editableIds().map(N).filter(n => !inAuto(n)); if (!ns.length) return;
  let T;
  if (ns.length === 1) { const p = parentOf(ns[0]); if (!p || p.type === 'PAGE') return; T = worldBox(p); } else T = selBox(ns.map(n => n.id));
  ns.forEach(n => {
    const b = worldBox(n); let dx = 0, dy = 0;
    if (dir === 'left') dx = T.x - b.x; if (dir === 'right') dx = T.x2 - b.x2; if (dir === 'hcenter') dx = T.cx - b.cx;
    if (dir === 'top') dy = T.y - b.y; if (dir === 'bottom') dy = T.y2 - b.y2; if (dir === 'vcenter') dy = T.cy - b.cy;
    const d = M.applyV(M.inv(parentWorld(n)), { x: dx, y: dy }); n.x += d.x; n.y += d.y;
  });
  commit('Align');
}
function cmdDistribute(axis) {
  const ns = editableIds().map(N).filter(n => !inAuto(n)); if (ns.length < 3) return toast('Select three or more layers to distribute');
  const H = axis === 'h';
  const bs = ns.map(n => ({ n, b: worldBox(n) })).sort((a, b) => H ? a.b.x - b.b.x : a.b.y - b.b.y);
  const start = H ? bs[0].b.x : bs[0].b.y, end = Math.max(...bs.map(o => H ? o.b.x2 : o.b.y2));
  const sizes = bs.reduce((s, o) => s + (H ? o.b.w : o.b.h), 0);
  const gap = (end - start - sizes) / (bs.length - 1);
  let pos = start;
  bs.forEach(o => { const cur = H ? o.b.x : o.b.y; const delta = pos - cur; const d = M.applyV(M.inv(parentWorld(o.n)), H ? { x: delta, y: 0 } : { x: 0, y: delta }); o.n.x += d.x; o.n.y += d.y; pos += (H ? o.b.w : o.b.h) + gap; });
  commit('Distribute');
}
function cmdZ(kind) {
  const ids = editableIds(); if (!ids.length) return;
  const byParent = {}; ids.forEach(id => { const p = N(id).parent; (byParent[p] = byParent[p] || []).push(id); });
  for (const pid in byParent) {
    const p = N(pid); const set = new Set(byParent[pid]); const ch = p.children;
    if (kind === 'front') p.children = [...ch.filter(id => !set.has(id)), ...ch.filter(id => set.has(id))];
    else if (kind === 'back') p.children = [...ch.filter(id => set.has(id)), ...ch.filter(id => !set.has(id))];
    else if (kind === 'forward') { for (let i = ch.length - 2; i >= 0; i--) if (set.has(ch[i]) && !set.has(ch[i + 1])) [ch[i], ch[i + 1]] = [ch[i + 1], ch[i]]; }
    else if (kind === 'backward') { for (let i = 1; i < ch.length; i++) if (set.has(ch[i]) && !set.has(ch[i - 1])) [ch[i], ch[i - 1]] = [ch[i - 1], ch[i]]; }
  }
  commit('Reorder');
}
function cmdFlip(axis) {
  const ns = editableIds().map(N); if (!ns.length) return;
  const b = selBox(ns.map(n => n.id));
  ns.forEach(n => {
    if (axis === 'h') n.flipX = !n.flipX; else n.flipY = !n.flipY;
    n.rotation = normAngle(-(n.rotation || 0));
    if (ns.length > 1) { const c = M.apply(worldMatrix(n), { x: n.w / 2, y: n.h / 2 }); const nc = axis === 'h' ? { x: 2 * b.cx - c.x, y: c.y } : { x: c.x, y: 2 * b.cy - c.y }; const pc = M.apply(M.inv(parentWorld(n)), nc); n.x = pc.x - n.w / 2; n.y = pc.y - n.h / 2; }
  });
  commit('Flip');
}
function cmdToggle(key) {
  const ns = selNodes(); if (!ns.length) return;
  const v = !ns.every(n => key === 'visible' ? !n.visible : n.locked);
  ns.forEach(n => { n[key] = key === 'visible' ? !v : v; markOverride(n, key); });
  if (key === 'locked' && v) D.sel = [];
  commit(key === 'visible' ? 'Show/hide' : 'Lock/unlock');
}
function cmdSelectAll() {
  const first = selNodes()[0];
  const p = first ? parentOf(first) : pageNode();
  D.sel = kids(p).filter(n => n.visible && !n.locked).map(n => n.id); renderAll();
}
function cmdNudge(dx, dy) {
  const ns = editableIds().map(N); if (!ns.length) return;
  const flow = ns.filter(inAuto);
  if (flow.length && flow.length === ns.length) {
    const p = parentOf(ns[0]); const H = p.layoutMode === 'HORIZONTAL';
    const dir = H ? Math.sign(dx) : Math.sign(dy); if (!dir) return;
    cmdZ(dir > 0 ? 'forward' : 'backward'); return;
  }
  ns.filter(n => !inAuto(n)).forEach(n => { const d = M.applyV(M.inv(parentWorld(n)), { x: dx, y: dy }); n.x += d.x; n.y += d.y; });
  commit('Nudge');
}
function cmdSelectParent() { const ns = selNodes(); if (!ns.length) return; const p = parentOf(ns[0]); if (p && p.type !== 'PAGE') D.sel = [p.id]; else D.sel = []; renderAll(); }
function cmdSelectChildren() { const ns = selNodes(); const out = []; ns.forEach(n => kids(n).forEach(c => out.push(c.id))); if (out.length) { D.sel = out; renderAll(); } }
function cmdSibling(step) {
  const n = selNodes()[0]; if (!n) { const k = kids(pageNode()); if (k.length) { D.sel = [k[k.length - 1].id]; renderAll(); } return; }
  const p = parentOf(n); const i = p.children.indexOf(n.id); const j = (i - step + p.children.length) % p.children.length;
  D.sel = [p.children[j]]; renderAll();
}
function switchPage(id, keepSel) {
  if (TE.id) endTextEdit(true); exitVecEdit(true);
  D.page = id; if (!keepSel) D.sel = []; D.hover = null;
  const views = D.pageViews || (D.pageViews = {});
  renderAll();
  if (views[id]) { Object.assign(D, views[id]); applyViewport(); } else requestAnimationFrame(zoomToFit);
}

/* ---------- clipboard ---------- */
let clipInternal = null;
const isTyping = t => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
function onCopy(e, cut) {
  if (isTyping(e.target) || isTyping(document.activeElement)) return;
  const ids = topSelection(D.sel.filter(id => N(id))); if (!ids.length) return;
  const data = serializeTrees(ids); clipInternal = data;
  try { e.clipboardData.setData('text/plain', JSON.stringify(data)); } catch (_) { }
  e.preventDefault();
  if (cut) cmdDelete(); else toast(ids.length === 1 ? 'Copied 1 layer' : `Copied ${ids.length} layers`, 1200);
}
async function onPaste(e) {
  if (isTyping(e.target) || isTyping(document.activeElement)) return;
  e.preventDefault();
  const cd = e.clipboardData;
  const files = cd ? [...cd.files].filter(f => f.type.startsWith('image/')) : [];
  if (files.length) return importFiles(files);
  const text = cd ? cd.getData('text/plain') : '';
  if (text) {
    let data = null; try { data = JSON.parse(text); } catch (_) { }
    if (data && data.blueline) return pasteData(data);
    if (data && data.format === 'blueline' && data.nodes && data.nodes.root) return openFileText(text);
    if (/<svg[\s>]/i.test(text)) return importSVG(text);
    const vb = viewportWorldBox();
    const t = mkNode('TEXT', { characters: text.slice(0, 5000), name: text.slice(0, 40) });
    const parent = pasteParent(null); addNode(t, parent.id);
    layoutNode(t); const pl = M.apply(M.inv(parentWorld(t)), { x: vb.x + vb.w / 2 - t.w / 2, y: vb.y + vb.h / 2 - t.h / 2 }); t.x = Math.round(pl.x); t.y = Math.round(pl.y);
    D.sel = [t.id]; commit('Paste text'); return;
  }
  if (clipInternal) pasteData(clipInternal);
}
function pasteParent(data) {
  const s = selNodes();
  if (s.length === 1 && (s[0].type === 'FRAME' || s[0].type === 'COMPONENT') && !s[0].mainRef && !(data && data.roots.includes(s[0].id))) return s[0];
  if (s.length && data) { const p = parentOf(s[0]); if (p && (p.type === 'FRAME' || p.type === 'COMPONENT' || p.type === 'PAGE') && !p.mainRef) return p; }
  return pageNode();
}
function pasteData(data) {
  loadImagesInto(data.images || {});
  const map = {}; Object.keys(data.nodes).forEach(id => map[id] = uid());
  const nodes = {};
  Object.values(data.nodes).forEach(n0 => { const n = clone(n0); n.id = map[n0.id]; if (n.children) n.children = n.children.map(c => map[c]).filter(Boolean); nodes[n.id] = n; });
  const target = pasteParent(data);
  const vb = viewportWorldBox();
  const roots = data.roots.map(id => nodes[map[id]]);
  Object.values(nodes).forEach(n => { if (n.parent && map[n.parent]) n.parent = map[n.parent]; D.nodes[n.id] = n; });
  // fix instance links that don't resolve here
  roots.forEach(r => {
    if (r.mainRef) { const tmp = r; promoteNestedPasted(tmp); }
    [r, ...descendants(r)].forEach(n => {
      if (n.type === 'INSTANCE' && !N(n.componentId)) { n.type = 'FRAME'; delete n.componentId; }
      if (n.mainRef && !N(n.mainRef)) { delete n.mainRef; delete n.overrides; }
    });
  });
  // world placement
  const wms = data.roots.map(id => data.world[id]);
  let shift = { x: 0, y: 0 };
  const boxPts = []; roots.forEach((r, i) => boxPts.push(...corners(r, wms[i])));
  const bb = aabb(boxPts);
  const visible = bb.x < vb.x + vb.w && bb.x2 > vb.x && bb.y < vb.y + vb.h && bb.y2 > vb.y;
  if (target.type !== 'PAGE') {
    const tb = worldBox(target);
    if (!(bb.x >= tb.x && bb.x2 <= tb.x2 && bb.y >= tb.y && bb.y2 <= tb.y2)) shift = { x: tb.cx - bb.cx, y: tb.cy - bb.cy };
  } else if (!visible) shift = { x: vb.x + vb.w / 2 - bb.cx, y: vb.y + vb.h / 2 - bb.cy };
  shift.x = Math.round(shift.x); shift.y = Math.round(shift.y);
  roots.forEach((r, i) => {
    r.parent = target.id; target.children.push(r.id);
    setWorldMatrix(r, M.mul(M.tr(shift.x, shift.y), wms[i]));
    if (r.type === 'COMPONENT' && N(data.roots[i])) r.name = r.name.replace(/( copy)?$/, ' copy');
  });
  D.sel = roots.map(r => r.id);
  commit('Paste');
}
function promoteNestedPasted(r) {
  const src = N(r.mainRef);
  if (r.type === 'INSTANCE' && N(r.componentId)) { delete r.mainRef; r.overrides = (src?.overrides || []).filter(k => !SKIP_ROOT.has(k)); promoteNested(r); }
  else { delete r.mainRef; delete r.overrides; promoteNested(r); }
}

/* ---------- import ---------- */
function readFile(f, as = 'dataURL') { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; if (as === 'text') r.readAsText(f); else r.readAsDataURL(f); }); }
function imgSize(src) { return new Promise(res => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth || 100, h: im.naturalHeight || 100 }); im.onerror = () => res({ w: 100, h: 100 }); im.src = src; }); }
async function addImageAsset(dataURL, blob) {
  const ref = 'img' + hashStr(dataURL.slice(0, 4096) + dataURL.length + dataURL.slice(-512));
  if (!D.images[ref]) { const s = await imgSize(dataURL); D.images[ref] = { data: dataURL, w: s.w, h: s.h, url: blob ? URL.createObjectURL(blob) : null }; if (!D.images[ref].url) try { D.images[ref].url = URL.createObjectURL(dataURLtoBlob(dataURL)); } catch (e) { } }
  return ref;
}
async function importFiles(files, at) {
  const placed = [];
  for (const f of files) {
    if (/\.blueline(\.json)?$|\.json$|application\/json/.test(f.name + f.type)) { const txt = await readFile(f, 'text'); openFileText(txt); return; }
    if (f.type === 'image/svg+xml' || /\.svg$/i.test(f.name)) { const txt = await readFile(f, 'text'); importSVG(txt, at, true); continue; }
    if (!f.type.startsWith('image/')) continue;
    const data = await readFile(f); const ref = await addImageAsset(data, f);
    const im = D.images[ref];
    let w = im.w, hh = im.h; const mx = 1600; if (w > mx || hh > mx) { const k = mx / Math.max(w, hh); w *= k; hh *= k; }
    const n = mkNode('RECT', { name: (f.name || 'Image').replace(/\.[^.]+$/, ''), w: Math.round(w), h: Math.round(hh), fills: [{ type: 'IMAGE', imageRef: ref, scaleMode: 'FILL', opacity: 1, visible: true }] });
    placed.push(n);
  }
  if (!placed.length) { renderAll(); return; }
  const vb = viewportWorldBox(); const c = at || { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
  const parent = at ? containerAt(D.lastE || { clientX: 0, clientY: 0 }) : pasteParent(null);
  let ox = 0;
  placed.forEach(n => { addNode(n, parent.id); const pl = M.apply(M.inv(parentWorld(n)), { x: c.x - n.w / 2 + ox, y: c.y - n.h / 2 }); n.x = Math.round(pl.x); n.y = Math.round(pl.y); ox += n.w + 20; });
  D.sel = placed.map(n => n.id); commit('Place image');
}
function importSVG(text, at, keepCommit) {
  const vb = viewportWorldBox(); const c = at || { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
  if (!paperInit()) {
    const data = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(text)));
    addImageAsset(data).then(ref => { const im = D.images[ref]; const n = mkNode('RECT', { name: 'SVG', w: im.w, h: im.h, fills: [{ type: 'IMAGE', imageRef: ref, scaleMode: 'FIT', opacity: 1, visible: true }] }); addNode(n, D.page); n.x = Math.round(c.x - n.w / 2); n.y = Math.round(c.y - n.h / 2); D.sel = [n.id]; commit('Import SVG'); });
    return;
  }
  let item;
  try { item = paper.project.importSVG(text, { expandShapes: true, insert: false, applyMatrix: true }); } catch (e) { toast('That SVG could not be read'); return; }
  if (!item) return;
  const top = mkNode('GROUP', { name: 'SVG', x: 0, y: 0, w: 1, h: 1 });
  addNode(top, D.page);
  const col = c0 => c0 ? { hex: cssToHex(c0.toCSS(true)) || '#000000', a: c0.alpha ?? 1 } : null;
  const paintFrom = (c0) => {
    if (!c0) return null;
    if (c0.gradient) {
      const g = c0.gradient; const o = c0.origin, d = c0.destination;
      return { type: g.radial ? 'RADIAL' : 'LINEAR', angle: o && d ? deg(Math.atan2(d.y - o.y, d.x - o.x)) : 90, opacity: 1, visible: true, stops: g.stops.map(s => ({ pos: s.offset ?? 0, color: cssToHex(s.color.toCSS(true)) || '#000000', opacity: s.color.alpha ?? 1 })) };
    }
    const k = col(c0); return solid(k.hex, k.a);
  };
  let count = 0;
  (function conv(it, parentId) {
    if (count > 3000 || !it.visible) return;
    const cls = it.className;
    if (cls === 'Group' || cls === 'Layer') {
      const kidsList = it.children ? it.children.slice() : [];
      if (!kidsList.length) return;
      const g = mkNode('GROUP', { name: it.name || 'Group', x: 0, y: 0, w: 1, h: 1, opacity: it.opacity ?? 1 });
      addNode(g, parentId);
      kidsList.forEach((ch, i) => { const before = g.children.length; conv(ch, g.id); if (it.clipped && i === 0 && g.children.length > before) N(g.children[before]).isMask = true; });
      if (!g.children.length) removeNode(g.id);
    } else if (cls === 'Path' || cls === 'CompoundPath') {
      if (it.clipMask) { /* handled as mask via parent */ }
      const paths = fromPaper(it); if (!paths.length) return;
      const fill = paintFrom(it.fillColor), stroke = paintFrom(it.strokeColor);
      const v = mkNode('VECTOR', { name: it.name || 'Vector', x: 0, y: 0, w: 0, h: 0, paths, fills: fill ? [fill] : [], strokes: stroke ? [stroke] : [], strokeWidth: it.strokeWidth || 1, strokeAlign: 'CENTER', strokeCap: { round: 'ROUND', square: 'SQUARE' }[it.strokeCap] || 'NONE', strokeJoin: { round: 'ROUND', bevel: 'BEVEL' }[it.strokeJoin] || 'MITER', fillRule: it.fillRule === 'evenodd' ? 'evenodd' : 'nonzero', opacity: it.opacity ?? 1 });
      if (!it.strokeColor) v.strokes = [];
      addNode(v, parentId); count++;
    } else if (cls === 'PointText') {
      const fc = col(it.fillColor) || { hex: '#000000', a: 1 };
      const fam = String(it.fontFamily || 'Inter').split(',')[0].replace(/['"]/g, '').trim();
      const t = mkNode('TEXT', { characters: it.content || '', fontSize: it.fontSize || 16, fontFamily: GFONTS[fam] || SYSFONTS.includes(fam) ? fam : 'Inter', fontWeight: parseInt(it.fontWeight) || 400, fills: [solid(fc.hex, fc.a)] });
      addNode(t, parentId); layoutNode(t);
      t.x = it.point.x; t.y = it.point.y - (it.fontSize || 16) * 0.95; count++;
    } else if (cls === 'Raster') {
      // embedded raster (data URI)
      try { const src = it.source; if (src && src.startsWith('data:')) { addImageAsset(src).then(ref => { const b = it.bounds; const r = mkNode('RECT', { name: 'Image', x: b.x, y: b.y, w: b.width, h: b.height, fills: [{ type: 'IMAGE', imageRef: ref, scaleMode: 'STRETCH', opacity: 1, visible: true }] }); addNode(r, parentId); commit('Import SVG'); }); } } catch (e) { }
    }
  })(item, top.id);
  if (!top.children.length) { removeNode(top.id); toast('No shapes found in that SVG'); renderAll(); return; }
  layoutNode(top);
  if (top.children.length === 1 && N(top.children[0]).type === 'GROUP') { const inner = N(top.children[0]); reparent(inner, D.page); removeNode(top.id); placeAt(inner, c); D.sel = [inner.id]; }
  else { top.name = 'SVG'; placeAt(top, c); D.sel = [top.id]; }
  commit('Import SVG');
}
function placeAt(n, c) { layoutNode(n); n.x = Math.round(c.x - n.w / 2); n.y = Math.round(c.y - n.h / 2); }
function pickFiles(accept, multiple = true) {
  return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = multiple; i.onchange = () => res([...i.files]); i.click(); });
}
function openFileText(txt) {
  let data; try { data = JSON.parse(txt); } catch (e) { return toast("That file isn't a Blueline file"); }
  if (!data || data.format !== 'blueline' || !data.nodes || !data.nodes.root) return toast("That file isn't a Blueline file");
  saveNow();
  loadDocument({ id: uid(), nodes: data.nodes, images: data.images || {} });
  saveNow(); toast('Opened ' + root().name);
}
