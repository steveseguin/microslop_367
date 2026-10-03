/* ============================================================
   Viewport, canvas render scheduling, overlay drawing
   ============================================================ */
let stage, canvasSvg, vpG, contentG, overlaySvg;
const need = { canvas: false, layers: false, panel: false, overlay: false };
let rafPending = false;
function renderAll() { need.canvas = need.layers = need.panel = need.overlay = true; schedule(); }
function renderLive() { need.canvas = need.overlay = true; need.panelValues = true; schedule(); }
function renderOverlay() { need.overlay = true; schedule(); }
function schedule() { if (rafPending) return; rafPending = true; requestAnimationFrame(flush); }
function flush() {
  rafPending = false;
  if (need.canvas) { need.canvas = false; renderCanvas(); }
  if (need.layers) { need.layers = false; renderLayers(); }
  if (need.panel) { need.panel = false; need.panelValues = false; renderPanel(); }
  else if (need.panelValues) { need.panelValues = false; refreshPanelValues(); }
  if (need.overlay) { need.overlay = false; drawOverlay(); }
}
function renderCanvas() {
  const page = pageNode(); if (!page) return;
  const hide = new Set(); if (TE.id) hide.add(TE.id);
  const ctx = mkCtx({ hide });
  contentG.innerHTML = renderPageMarkup(page, ctx);
  stage.style.setProperty('--page-bg', page.bg || '#F2F3F5');
  stage.dataset.dark = luminance(page.bg || '#F2F3F5') < 0.45 ? '1' : '0';
  positionTextEditor();
}
/* ---------- viewport math ---------- */
let stageRect = null;
function updateStageRect() { stageRect = stage.getBoundingClientRect(); }
function toLocal(e) { return { x: e.clientX - stageRect.left, y: e.clientY - stageRect.top }; }
function toWorld(e) { const l = toLocal(e); return { x: (l.x - D.panX) / D.zoom, y: (l.y - D.panY) / D.zoom }; }
function w2s(p) { return { x: p.x * D.zoom + D.panX, y: p.y * D.zoom + D.panY }; }
const screenM = () => [D.zoom, 0, 0, D.zoom, D.panX, D.panY];
function applyViewport() {
  vpG.setAttribute('transform', `matrix(${D.zoom} 0 0 ${D.zoom} ${D.panX} ${D.panY})`);
  const zl = $('#zoomLabel'); if (zl) zl.textContent = Math.round(D.zoom * 100) + '%';
  stage.style.setProperty('--grid', Math.max(D.zoom, 0.01) + 'px');
  stage.style.setProperty('--panx', D.panX + 'px'); stage.style.setProperty('--pany', D.panY + 'px');
  stage.classList.toggle('zoomed', D.zoom >= 6);
  drawOverlay(); positionTextEditor();
  saveViewSoon();
}
const saveViewSoon = debounce(() => { if (saveState === 'saved') saveNow(); }, 1500);
function zoomAt(sx, sy, z) {
  z = clamp(z, 0.02, 256);
  const wx = (sx - D.panX) / D.zoom, wy = (sy - D.panY) / D.zoom;
  D.zoom = z; D.panX = sx - wx * z; D.panY = sy - wy * z; applyViewport();
}
function zoomBy(f) { updateStageRect(); zoomAt(stageRect.width / 2, stageRect.height / 2, D.zoom * f); }
function zoomToBox(b, maxZoom = 1, pad = 64) {
  updateStageRect();
  if (!b || !isFinite(b.x)) { D.zoom = 1; D.panX = stageRect.width / 2; D.panY = stageRect.height / 2; return applyViewport(); }
  const W = stageRect.width - pad * 2, Hh = stageRect.height - pad * 2;
  const z = clamp(Math.min(W / Math.max(b.w, 1), Hh / Math.max(b.h, 1), maxZoom), 0.02, 256);
  D.zoom = z; D.panX = stageRect.width / 2 - (b.x + b.w / 2) * z; D.panY = stageRect.height / 2 - (b.y + b.h / 2) * z;
  applyViewport();
}
function zoomToFit() { const ks = kids(pageNode()).filter(n => n.visible); zoomToBox(ks.length ? selBox(ks.map(n => n.id)) : null, 1); }
function zoomToSelection() { if (D.sel.length) zoomToBox(selBox(), 8); else zoomToFit(); }
function viewportWorldBox() { updateStageRect(); const a = { x: -D.panX / D.zoom, y: -D.panY / D.zoom }; return { x: a.x, y: a.y, w: stageRect.width / D.zoom, h: stageRect.height / D.zoom }; }

/* ---------- overlay ---------- */
const OV = { guides: [], marquee: null, insert: null, dropTarget: null, labels: [], measure: null, link: null, cursors: {} };
const ACC = 'var(--sel)', COMP = 'var(--comp)';
const isCompish = n => n && (n.type === 'COMPONENT' || n.type === 'INSTANCE' || !!instanceRootOf(n) || ancestors(n).some(a => a.type === 'COMPONENT'));
function outlineD(n, m) {
  let paths = (n.type === 'VECTOR' || n.type === 'BOOLEAN' || n.type === 'ELLIPSE' || n.type === 'POLYGON' || n.type === 'STAR') ? shapePaths(n) : rectPaths(n.w, n.h, n.type === 'RECT' || isFrameLike(n) ? radiiOf(n) : [0, 0, 0, 0]);
  if (n.type === 'VECTOR' && !paths.length) paths = rectPaths(n.w, n.h);
  return pathsToD(transformPaths(paths, m));
}
function screenCorners(n) { return corners(n, M.mul(screenM(), worldMatrix(n))); }
const poly = pts => pts.map((p, i) => (i ? 'L' : 'M') + r3(p.x) + ' ' + r3(p.y)).join('') + 'Z';
function isLineNode(n) { return n && n.type === 'VECTOR' && n.paths?.length === 1 && n.paths[0].pts.length === 2 && !n.paths[0].closed && !n.paths[0].pts.some(p => p.ix || p.iy || p.ox || p.oy); }
function selectionFrame() {   // {pts: 4 screen corners, n (single) , line}
  const sel = D.sel.map(N).filter(Boolean); if (!sel.length) return null;
  if (sel.length === 1) {
    const n = sel[0];
    if (isLineNode(n)) { const m = M.mul(screenM(), worldMatrix(n)); return { line: true, n, ends: n.paths[0].pts.map(p => M.apply(m, p)) }; }
    return { pts: screenCorners(n), n };
  }
  const b = selBox(); const s = [w2s({ x: b.x, y: b.y }), w2s({ x: b.x2, y: b.y }), w2s({ x: b.x2, y: b.y2 }), w2s({ x: b.x, y: b.y2 })];
  return { pts: s, n: null };
}
function drawOverlay() {
  if (!overlaySvg) return;
  let s = '';
  const page = pageNode(); if (!page) return;
  const SM = screenM();
  const inProto = D.mode === 'prototype';
  // frame labels
  OV.labels = [];
  kids(page).forEach(n => {
    if (!isFrameLike(n) || !n.visible) return;
    const wm = worldMatrix(n), p = M.apply(M.mul(SM, wm), { x: 0, y: 0 });
    const selected = D.sel.includes(n.id);
    const comp = n.type !== 'FRAME';
    const label = (n.type === 'COMPONENT' ? '◇ ' : n.type === 'INSTANCE' ? '◈ ' : '') + n.name;
    const sw = Math.abs(n.w * D.zoom);
    if (sw < 24) return;
    const maxCh = Math.max(3, Math.floor(sw / 6.4));
    const txt = label.length > maxCh ? label.slice(0, maxCh - 1) + '…' : label;
    const rot = n.rotation ? ` transform="rotate(${r3(n.rotation)} ${r3(p.x)} ${r3(p.y)})"` : '';
    s += `<text x="${r3(p.x)}" y="${r3(p.y - 6)}"${rot} class="flabel${selected ? ' on' : ''}${comp ? ' comp' : ''}">${esc(txt)}</text>`;
    OV.labels.push({ id: n.id, x: p.x, y: p.y - 20, w: Math.min(sw, txt.length * 6.6 + 4), h: 18 });
  });
  // prototype connections
  if (inProto) s += drawProtoLinks(SM);
  // hover
  const hv = N(D.hover);
  if (hv && !D.sel.includes(hv.id) && !DRAG.active && pageOf(hv)?.id === D.page) {
    s += `<path d="${outlineD(hv, M.mul(SM, worldMatrix(hv)))}" class="hov" stroke="${isCompish(hv) ? COMP : ACC}"/>`;
  }
  // layers an agent just changed
  if (typeof AI !== 'undefined' && AI.flash && Date.now() < AI.flash.until) AI.flash.ids.forEach(id => { const n = N(id); if (n && n.visible && pageOf(n)?.id === D.page && !ancestors(n).some(a => AI.flash.ids.includes(a.id))) s += `<path d="${outlineD(n, M.mul(SM, worldMatrix(n)))}" class="aiflash" stroke="${AI.flash.color}"/>`; });
  // drop target / insert indicator
  if (OV.dropTarget && N(OV.dropTarget)) { const t = N(OV.dropTarget); s += `<path d="${poly(screenCorners(t))}" class="drop"/>`; }
  if (OV.insert) { const a = w2s(OV.insert.a), b = w2s(OV.insert.b); s += `<line x1="${r3(a.x)}" y1="${r3(a.y)}" x2="${r3(b.x)}" y2="${r3(b.y)}" class="ins"/>`; }
  // selection
  const vec = VE.id && N(VE.id);
  if (vec) s += drawVecEdit(vec, SM);
  else if (D.sel.length && !TE.id) {
    const sel = D.sel.map(N).filter(Boolean);
    const compSel = sel.length === 1 && isCompish(sel[0]);
    const col = compSel ? COMP : ACC;
    if (sel.length > 1) sel.forEach(n => s += `<path d="${outlineD(n, M.mul(SM, worldMatrix(n)))}" class="selo" stroke="${col}"/>`);
    const f = selectionFrame();
    if (f && f.line) {
      const [a, b] = f.ends;
      s += `<line x1="${r3(a.x)}" y1="${r3(a.y)}" x2="${r3(b.x)}" y2="${r3(b.y)}" class="selo" stroke="${col}"/>`;
      [a, b].forEach(p => s += `<rect x="${r3(p.x - 4)}" y="${r3(p.y - 4)}" width="8" height="8" rx="4" class="hdl" stroke="${col}"/>`);
    } else if (f) {
      const P = f.pts;
      s += `<path d="${poly(P)}" class="selb" stroke="${col}"/>`;
      if (f.n && sel.length === 1 && !DRAG.active) s += `<path d="${outlineD(f.n, M.mul(SM, worldMatrix(f.n)))}" class="selo thin" stroke="${col}"/>`;
      const small = dist(P[0], P[2]) < 14;
      const locked = sel.some(n => n.mainRef);
      if (!locked) P.forEach((p, i) => { if (small && i % 2) return; s += `<rect x="${r3(p.x - 4)}" y="${r3(p.y - 4)}" width="8" height="8" class="hdl" stroke="${col}"/>`; });
      // dimension label
      if (!(DRAG.active && DRAG.type === 'rotate')) {
        const n1 = f.n; const b = n1 ? { w: n1.w, h: n1.h } : selBox();
        let lab = `${fmt(b.w)} × ${fmt(b.h)}`;
        if (n1 && (n1.sizingH === 'HUG' || n1.sizingV === 'HUG' || n1.sizingH === 'FILL' || n1.sizingV === 'FILL') && (isAuto(n1) || inAuto(n1) || n1.type === 'TEXT')) {
          const sz = k => n1[k] === 'HUG' ? 'Hug' : n1[k] === 'FILL' ? 'Fill' : null;
          lab = `${sz('sizingH') || fmt(b.w)} × ${sz('sizingV') || fmt(b.h)}`;
        }
        const bot = P.reduce((a, p) => p.y > a.y ? p : a, P[0]);
        const cx = (P[0].x + P[1].x + P[2].x + P[3].x) / 4;
        const tw = lab.length * 6.4 + 12;
        s += `<g class="dim"><rect x="${r3(cx - tw / 2)}" y="${r3(bot.y + 8)}" width="${r3(tw)}" height="18" rx="4" fill="${col}"/><text x="${r3(cx)}" y="${r3(bot.y + 20.5)}">${lab}</text></g>`;
      } else if (DRAG.angleLabel !== undefined) {
        const P0 = f.pts; const cx = (P0[0].x + P0[2].x) / 2, cy = (P0[0].y + P0[2].y) / 2;
        s += `<g class="dim"><rect x="${r3(cx - 22)}" y="${r3(cy - 9)}" width="44" height="18" rx="4" fill="${col}"/><text x="${r3(cx)}" y="${r3(cy + 3.5)}">${fmt(DRAG.angleLabel)}°</text></g>`;
      }
      // padding/gap hints for auto layout frame
      if (f.n && isAuto(f.n) && !DRAG.active) s += autoLayoutHints(f.n, SM);
      if (inProto && f.n) { const r = P.reduce((a, p) => p.x > a.x ? p : a, P[0]); const mid = { x: (P[1].x + P[2].x) / 2, y: (P[1].y + P[2].y) / 2 }; s += `<circle cx="${r3(mid.x + 0)}" cy="${r3(mid.y)}" r="7" class="plink"/><text x="${r3(mid.x)}" y="${r3(mid.y + 3.5)}" class="plinkp">+</text>`; }
    }
  }
  if (TE.id && N(TE.id)) s += `<path d="${poly(screenCorners(N(TE.id)))}" class="selb" stroke="${ACC}"/>`;
  // guides
  OV.guides.forEach(g => {
    const a = w2s(g.a), b = w2s(g.b);
    s += `<line x1="${r3(a.x)}" y1="${r3(a.y)}" x2="${r3(b.x)}" y2="${r3(b.y)}" class="guide"/>`;
    if (g.label) { const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; const tw = g.label.length * 6.4 + 10; s += `<g class="glab"><rect x="${r3(m.x - tw / 2)}" y="${r3(m.y - 9)}" width="${r3(tw)}" height="18" rx="3"/><text x="${r3(m.x)}" y="${r3(m.y + 3.5)}">${g.label}</text></g>`; }
  });
  if (OV.measure) s += OV.measure;
  if (OV.marquee) { const m = OV.marquee; s += `<rect x="${r3(Math.min(m.a.x, m.b.x))}" y="${r3(Math.min(m.a.y, m.b.y))}" width="${r3(Math.abs(m.b.x - m.a.x))}" height="${r3(Math.abs(m.b.y - m.a.y))}" class="marq"/>`; }
  if (OV.link) { const a = OV.link.a, b = OV.link.b; s += `<path d="M${r3(a.x)} ${r3(a.y)}L${r3(b.x)} ${r3(b.y)}" class="plinkline"/>`; }
  if (PEN.id) s += drawPen(SM);
  if (PENCIL.pts) s += `<path d="${PENCIL.pts.map((p, i) => (i ? 'L' : 'M') + r3(w2s(p).x) + ' ' + r3(w2s(p).y)).join('')}" class="pencil"/>`;
  s += drawCursors();
  overlaySvg.innerHTML = s;
}
function autoLayoutHints(n, SM) {
  const m = M.mul(SM, worldMatrix(n)); let s = '';
  const [pt_, pr, pb, pl] = n.padding || [0, 0, 0, 0];
  const H = n.layoutMode === 'HORIZONTAL';
  const ks = kids(n).filter(c => c.visible && !c.absolute);
  if (D.zoom < 0.4) return '';
  // gaps
  for (let i = 0; i < ks.length - 1; i++) {
    const a = localBox(ks[i]), b = localBox(ks[i + 1]);
    const r = H ? { x: a.x2, y: pt_, w: b.x - a.x2, h: n.h - pt_ - pb } : { x: pl, y: a.y2, w: n.w - pl - pr, h: b.y - a.y2 };
    if (r.w <= 0 || r.h <= 0) continue;
    s += `<path d="${poly(corners({ w: r.w, h: r.h }, M.mul(m, M.tr(r.x, r.y))))}" class="gap"/>`;
  }
  return s;
}
function drawCursors() {
  let s = '';
  Object.values(OV.cursors).forEach(c => {
    if (c.page !== D.page || !c.x) return; const p = w2s(c);
    s += `<g transform="translate(${r3(p.x)} ${r3(p.y)})" class="rcur"><path d="M0 0L0 16L4.5 12L7.5 18.5L10 17.3L7 11L13 11Z" fill="${c.color}" stroke="#fff" stroke-width="1.2"/><rect x="12" y="16" width="${c.name.length * 6.6 + 10}" height="18" rx="9" fill="${c.color}"/><text x="17" y="28.5">${esc(c.name)}</text></g>`;
  });
  return s;
}
function drawProtoLinks(SM) {
  let s = '';
  const page = pageNode();
  const all = descendants(page).filter(n => n.reactions && n.reactions.length && n.visible);
  all.forEach(n => n.reactions.forEach(r => {
    const dst = N(r.dest); if (!dst || pageOf(dst)?.id !== D.page) return;
    const a = worldBox(n), b = worldBox(dst);
    const p0 = w2s({ x: a.x2, y: a.cy });
    const toLeft = b.x > a.x2 - 1;
    const p1 = w2s(toLeft ? { x: b.x, y: b.y + Math.min(40, b.h / 2) } : { x: b.x2, y: b.y + Math.min(40, b.h / 2) });
    const dx = Math.max(40, Math.abs(p1.x - p0.x) / 2);
    const c1 = { x: p0.x + dx, y: p0.y }, c2 = { x: toLeft ? p1.x - dx : p1.x + dx, y: p1.y };
    const on = D.sel.includes(n.id);
    s += `<path d="M${r3(p0.x)} ${r3(p0.y)}C${r3(c1.x)} ${r3(c1.y)} ${r3(c2.x)} ${r3(c2.y)} ${r3(p1.x)} ${r3(p1.y)}" class="plinkline${on ? ' on' : ''}"/>`;
    const ang = Math.atan2(p1.y - c2.y, p1.x - c2.x);
    const ah = (t) => ({ x: p1.x - 9 * Math.cos(ang + t), y: p1.y - 9 * Math.sin(ang + t) });
    const l = ah(0.45), rr = ah(-0.45);
    s += `<path d="M${r3(l.x)} ${r3(l.y)}L${r3(p1.x)} ${r3(p1.y)}L${r3(rr.x)} ${r3(rr.y)}Z" class="plinkhead${on ? ' on' : ''}"/><circle cx="${r3(p0.x)}" cy="${r3(p0.y)}" r="3.5" class="plinkdot${on ? ' on' : ''}"/>`;
  }));
  return s;
}
