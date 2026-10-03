/* ============================================================
   Left panel: pages, layers tree, assets
   ============================================================ */
const ICONS = {
  move: '<svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L10 19z" fill="currentColor"/></svg>',
  hand: '<svg viewBox="0 0 24 24"><path d="M8 11V5.5a1.5 1.5 0 013 0V11m0-1V4.5a1.5 1.5 0 013 0V11m0-.5V6a1.5 1.5 0 013 0v7c0 4-2.5 7-6.5 7S5 17 4 15l-1.6-3a1.4 1.4 0 012.3-1.5L8 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  frame: '<svg viewBox="0 0 24 24"><path d="M8 3v18M16 3v18M3 8h18M3 16h18" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  rect: '<svg viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  ellipse: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  line: '<svg viewBox="0 0 24 24"><path d="M5 19L19 5" stroke="currentColor" stroke-width="1.6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 19L19 5M11 5h8v8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  polygon: '<svg viewBox="0 0 24 24"><path d="M12 4.5l8 14H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3.8l2.5 5.3 5.7.7-4.2 3.9 1.1 5.7L12 16.6l-5.1 2.8L8 13.7 3.8 9.8l5.7-.7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M12 3l6 9-6 9-6-9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M4 20l1.2-4.6L16.5 4.1a2 2 0 012.8 0l.6.6a2 2 0 010 2.8L8.6 18.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  text: '<svg viewBox="0 0 24 24"><path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  image: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="M4 17l5-5 4 4 2.5-2.5L20 18" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  component: '<svg viewBox="0 0 24 24"><path d="M12 2.8l3.3 3.3L12 9.4 8.7 6.1zM12 14.6l3.3 3.3-3.3 3.3-3.3-3.3zM6.1 8.7l3.3 3.3-3.3 3.3L2.8 12zM17.9 8.7l3.3 3.3-3.3 3.3-3.3-3.3z" fill="currentColor"/></svg>',
  instance: '<svg viewBox="0 0 24 24"><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  group: '<svg viewBox="0 0 24 24"><path d="M5 4.5h3M16 4.5h3v3M19.5 16v3.5h-3M8 19.5H4.5V16M4.5 8V4.5M10.5 4.5h3M19.5 10.5v3M10.5 19.5h3M4.5 10.5v3" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  boolean: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="11" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="9.5" y="9.5" width="11" height="11" rx="1" fill="currentColor" opacity=".55"/></svg>',
  vector: '<svg viewBox="0 0 24 24"><path d="M4 18C8 4 16 20 20 6" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="2.5" y="16.5" width="3" height="3" fill="currentColor"/><rect x="18.5" y="4.5" width="3" height="3" fill="currentColor"/></svg>',
  autoH: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="5" height="10" rx="1" fill="currentColor"/><rect x="9.5" y="7" width="5" height="10" rx="1" fill="currentColor"/><rect x="16" y="7" width="5" height="10" rx="1" fill="currentColor"/></svg>',
  autoV: '<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="5" rx="1" fill="currentColor"/><rect x="7" y="9.5" width="10" height="5" rx="1" fill="currentColor"/><rect x="7" y="16" width="10" height="5" rx="1" fill="currentColor"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.6A9 9 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-2.9 3.6M6.5 7.2C4 9 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.9-.4 4-1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 10.5V7.5a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  unlock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 10.5V7.5a4 4 0 017.6-1.7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  caret: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8"/></svg>',
  minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" stroke-width="1.8"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',
  page: '<svg viewBox="0 0 24 24"><path d="M6 3.5h8l4 4v13H6z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  mask: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>',
};
const TOOL_TITLES = { move: 'Move (V)', hand: 'Hand (H)', frame: 'Frame (F)', rect: 'Rectangle (R)', ellipse: 'Ellipse (O)', line: 'Line (L)', arrow: `Arrow (${SHIFT}L)`, polygon: 'Polygon', star: 'Star', pen: 'Pen (P)', pencil: `Pencil (${SHIFT}P)`, text: 'Text (T)', image: `Place image (${MOD}${SHIFT}K)` };
function nodeIcon(n) {
  if (n.type === 'FRAME' && isAuto(n)) return n.layoutMode === 'HORIZONTAL' ? ICONS.autoH : ICONS.autoV;
  if (n.type === 'RECT' && (n.fills || []).some(p => p.type === 'IMAGE')) return ICONS.image;
  if (n.isMask) return ICONS.mask;
  if (n.type === 'VECTOR' && isLineNode(n)) return n.endCap && n.endCap !== 'NONE' ? ICONS.arrow : ICONS.line;
  return ICONS[{ FRAME: 'frame', GROUP: 'group', COMPONENT: 'component', INSTANCE: 'instance', BOOLEAN: 'boolean', RECT: 'rect', ELLIPSE: 'ellipse', POLYGON: 'polygon', STAR: 'star', VECTOR: 'vector', TEXT: 'text' }[n.type]] || ICONS.rect;
}

const UI = { expanded: new Set(), ltab: 'layers', rtab: 'design', renaming: null };
function renderPages() {
  const el = $('#pageList'); if (!el) return;
  el.innerHTML = kids(root()).map(p => `<div class="prow${p.id === D.page ? ' on' : ''}" data-page="${p.id}"><span class="pname" data-pname="${p.id}">${esc(p.name)}</span></div>`).join('');
}
function renderLayers() {
  renderPages();
  if (UI.ltab === 'assets') renderAssets();
  const el = $('#layerTree'); if (!el) return;
  const page = pageNode(); if (!page) return;
  // auto-expand ancestors of selection
  D.sel.forEach(id => { const n = N(id); if (n) ancestors(n).forEach(a => UI.expanded.add(a.id)); });
  const selSet = new Set(D.sel);
  const parentSel = new Set(); D.sel.forEach(id => { const n = N(id); n && ancestors(n).forEach(a => parentSel.add(a.id)); });
  let html = '';
  const row = (n, depth) => {
    const has = n.children && n.children.length && n.type !== 'BOOLEAN' ? true : n.type === 'BOOLEAN';
    const open = UI.expanded.has(n.id);
    const comp = n.type === 'COMPONENT' || n.type === 'INSTANCE' || !!n.mainRef;
    const cls = ['lrow', selSet.has(n.id) ? 'on' : '', parentSel.has(n.id) && !selSet.has(n.id) ? 'psel' : '', !n.visible ? 'hid' : '', n.locked ? 'lk' : '', comp ? 'comp' : '', D.hover === n.id ? 'hov' : ''].filter(Boolean).join(' ');
    html += `<div class="${cls}" data-id="${n.id}" style="--d:${depth}">`
      + `<span class="tw${has ? '' : ' none'}${open ? ' open' : ''}" data-tw="${n.id}">${has ? ICONS.caret : ''}</span>`
      + `<span class="ic">${nodeIcon(n)}</span>`
      + (UI.renaming === n.id ? `<input class="lname-in" id="rename-${n.id}" value="${esc(n.name)}" spellcheck="false">` : `<span class="lname">${esc(n.name)}</span>`)
      + `<span class="lact"><button class="ib${n.locked ? ' keep' : ''}" data-lock="${n.id}" title="Lock">${n.locked ? ICONS.lock : ICONS.unlock}</button><button class="ib${!n.visible ? ' keep' : ''}" data-vis="${n.id}" title="Show/hide">${n.visible ? ICONS.eye : ICONS.eyeOff}</button></span></div>`;
    if (has && open) kids(n).slice().reverse().forEach(c => row(c, depth + 1));
  };
  kids(page).slice().reverse().forEach(n => row(n, 0));
  if (!kids(page).length) html = `<div class="empty">This page is empty. Pick a tool from the toolbar, or drop an image or SVG onto the canvas.</div>`;
  const sc = el.scrollTop; el.innerHTML = html; el.scrollTop = sc;
  if (UI.renaming) { const inp = $('#rename-' + UI.renaming); if (inp) { inp.focus(); inp.select(); } }
  const first = el.querySelector('.lrow.on');
  if (first && UI.scrollToSel) { UI.scrollToSel = false; const r = first.getBoundingClientRect(), pr = el.getBoundingClientRect(); if (r.top < pr.top || r.bottom > pr.bottom) first.scrollIntoView({ block: 'nearest' }); }
}
function layersHover(id) { $$('#layerTree .lrow.hov').forEach(r => r.classList.remove('hov')); if (id) { const r = $(`#layerTree .lrow[data-id="${id}"]`); if (r) r.classList.add('hov'); } }
function startRename(id) {
  const n = N(id); if (!n) return;
  if (n.parent && N(n.parent).type === 'PAGE' && isFrameLike(n) && !$('#left').offsetParent) { }
  UI.renaming = id; UI.ltab = 'layers'; setLeftTab('layers'); ancestors(n).forEach(a => UI.expanded.add(a.id)); renderLayers();
}
function finishRename(commitIt) {
  const id = UI.renaming; if (!id) return; const inp = $('#rename-' + id); UI.renaming = null;
  const n = N(id);
  if (commitIt && n && inp && inp.value.trim() && inp.value !== n.name) { n.name = inp.value.trim(); markOverride(n, 'name'); commit('Rename'); } else renderLayers();
}
function setLeftTab(t) { UI.ltab = t; $$('#left [data-ltab]').forEach(b => b.classList.toggle('on', b.dataset.ltab === t)); $('#layersPane').hidden = t !== 'layers'; $('#assetsPane').hidden = t !== 'assets'; if (t === 'assets') renderAssets(); }
let layerDrag = null;
function initLayers() {
  const tree = $('#layerTree');
  tree.addEventListener('pointerdown', e => {
    const row = e.target.closest('.lrow'); if (!row || e.target.closest('button,input')) return;
    const id = row.dataset.id;
    if (e.target.closest('[data-tw]')) { const t = e.target.closest('[data-tw]').dataset.tw; UI.expanded.has(t) ? UI.expanded.delete(t) : UI.expanded.add(t); renderLayers(); return; }
    if (TE.id) endTextEdit(true); exitVecEdit(true);
    if (e.shiftKey && D.sel.length) {
      const rows = $$('#layerTree .lrow').map(r => r.dataset.id);
      const a = rows.indexOf(D.sel[D.sel.length - 1]), b = rows.indexOf(id);
      if (a >= 0 && b >= 0) { const [s, t] = a < b ? [a, b] : [b, a]; D.sel = [...new Set([...D.sel, ...rows.slice(s, t + 1)])]; }
    } else if (e.metaKey || e.ctrlKey) D.sel = D.sel.includes(id) ? D.sel.filter(x => x !== id) : [...D.sel, id];
    else if (!D.sel.includes(id)) D.sel = [id];
    layerDrag = { id, y: e.clientY, active: false, pid: e.pointerId };
    renderAll();
  });
  tree.addEventListener('pointermove', e => {
    const row = e.target.closest('.lrow');
    if (!layerDrag) { const id = row ? row.dataset.id : null; if (D.hover !== id) { D.hover = id; renderOverlay(); } return; }
    if (!layerDrag.active && Math.abs(e.clientY - layerDrag.y) > 4) { layerDrag.active = true; try { tree.setPointerCapture(layerDrag.pid); } catch (_) { } tree.classList.add('dragging'); }
    if (!layerDrag.active) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.lrow');
    $$('#layerTree .dropb,#layerTree .dropa,#layerTree .dropi').forEach(r => r.classList.remove('dropb', 'dropa', 'dropi'));
    layerDrag.drop = null;
    if (!el) return;
    const tid = el.dataset.id, t = N(tid); const r = el.getBoundingClientRect(); const f = (e.clientY - r.top) / r.height;
    const moving = topSelection(D.sel);
    if (moving.some(id => id === tid || isAncestor(N(id), t))) return;
    const canInside = (t.type === 'FRAME' || t.type === 'COMPONENT' || t.type === 'GROUP' || t.type === 'BOOLEAN') && !t.mainRef;
    let pos = f < 0.3 ? 'before' : f > 0.7 ? 'after' : (canInside ? 'inside' : f < 0.5 ? 'before' : 'after');
    const into = pos === 'inside' ? t : parentOf(t);
    if (into.type === 'INSTANCE' || into.mainRef) return;
    layerDrag.drop = { id: tid, pos };
    el.classList.add(pos === 'before' ? 'dropb' : pos === 'after' ? 'dropa' : 'dropi');
  });
  const endDrag = () => {
    tree.classList.remove('dragging');
    $$('#layerTree .dropb,#layerTree .dropa,#layerTree .dropi').forEach(r => r.classList.remove('dropb', 'dropa', 'dropi'));
    const ld = layerDrag; layerDrag = null;
    if (!ld || !ld.active || !ld.drop) return;
    const t = N(ld.drop.id); const moving = sortByZ(topSelection(D.sel)).filter(id => !N(id).mainRef);
    if (!moving.length) return;
    let parent, index;
    if (ld.drop.pos === 'inside') { parent = t; index = t.children.length; }
    else { parent = parentOf(t); index = parent.children.indexOf(t.id) + (ld.drop.pos === 'before' ? 1 : 0); }
    if (parent.type === 'INSTANCE' || parent.mainRef) return toast("Layers can't be moved into an instance");
    moving.forEach(id => { const n = N(id); const wasIdx = indexInParent(n); const same = n.parent === parent.id; if (same && wasIdx < index) index--; reparent(n, parent.id, index); index++; });
    if (ld.drop.pos === 'inside') UI.expanded.add(parent.id);
    commit('Move layer');
  };
  tree.addEventListener('pointerup', endDrag); tree.addEventListener('pointercancel', endDrag);
  tree.addEventListener('pointerleave', () => { if (!layerDrag && D.hover) { D.hover = null; renderOverlay(); layersHover(null); } });
  tree.addEventListener('click', e => {
    const lk = e.target.closest('[data-lock]'), vs = e.target.closest('[data-vis]');
    if (lk) { const n = N(lk.dataset.lock); n.locked = !n.locked; if (n.locked) D.sel = D.sel.filter(x => x !== n.id); commit(n.locked ? 'Lock' : 'Unlock'); }
    if (vs) { const n = N(vs.dataset.vis); n.visible = !n.visible; markOverride(n, 'visible'); commit(n.visible ? 'Show' : 'Hide'); }
  });
  tree.addEventListener('dblclick', e => { const row = e.target.closest('.lrow'); if (row && e.target.closest('.lname')) startRename(row.dataset.id); else if (row) { D.sel = [row.dataset.id]; zoomToSelection(); } });
  tree.addEventListener('keydown', e => { if (e.target.classList.contains('lname-in')) { if (e.key === 'Enter') finishRename(true); if (e.key === 'Escape') finishRename(false); e.stopPropagation(); } });
  tree.addEventListener('focusout', e => { if (e.target.classList.contains('lname-in')) finishRename(true); });
  // pages
  const pl = $('#pageList');
  pl.addEventListener('click', e => { const r = e.target.closest('[data-page]'); if (r && r.dataset.page !== D.page && !e.target.closest('input')) { saveView(); switchPage(r.dataset.page); } });
  pl.addEventListener('dblclick', e => {
    const s = e.target.closest('[data-pname]'); if (!s) return;
    const id = s.dataset.pname; const p = N(id);
    s.outerHTML = `<input class="pname-in" value="${esc(p.name)}" data-pid="${id}" spellcheck="false">`;
    const inp = $('.pname-in', pl); inp.focus(); inp.select();
    const done = ok => { if (ok && inp.value.trim()) { p.name = inp.value.trim(); commit('Rename page'); } else renderPages(); };
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') done(true); if (ev.key === 'Escape') done(false); ev.stopPropagation(); });
    inp.addEventListener('blur', () => done(true), { once: true });
  });
  pl.addEventListener('contextmenu', e => {
    const r = e.target.closest('[data-page]'); if (!r) return; e.preventDefault();
    const id = r.dataset.page;
    showMenu([
      { label: 'Rename', action: () => r.querySelector('.pname')?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })) },
      { label: 'Duplicate page', action: () => duplicatePage(id) },
      { label: 'Delete page', disabled: kids(root()).length < 2, action: () => deletePage(id) },
    ], e.clientX, e.clientY);
  });
  $('#addPage').addEventListener('click', () => { const p = mkNode('PAGE', { name: 'Page ' + (kids(root()).length + 1) }); addNode(p, 'root'); saveView(); D.page = p.id; D.sel = []; commit('Add page'); requestAnimationFrame(zoomToFit); });
  $$('#left [data-ltab]').forEach(b => b.addEventListener('click', () => setLeftTab(b.dataset.ltab)));
  $('#assetSearch').addEventListener('input', renderAssets);
  initAssetDrag();
}
function saveView() { (D.pageViews = D.pageViews || {})[D.page] = { zoom: D.zoom, panX: D.panX, panY: D.panY }; }
function duplicatePage(id) {
  const list = cloneTree(id); const r = list[0]; r.parent = 'root'; r.name += ' copy';
  list.forEach(n => D.nodes[n.id] = n); const rt = root(); rt.children.splice(rt.children.indexOf(id) + 1, 0, r.id);
  // components duplicated with the page are new components; leave instances pointing at the originals
  saveView(); D.page = r.id; D.sel = []; commit('Duplicate page');
}
function deletePage(id) {
  if (kids(root()).length < 2) return;
  const comps = descendants(N(id)).filter(n => n.type === 'COMPONENT');
  const used = comps.some(c => Object.values(D.nodes).some(n => n.type === 'INSTANCE' && n.componentId === c.id && pageOf(n)?.id !== id));
  removeNode(id);
  if (D.page === id) { D.page = kids(root())[0].id; D.sel = []; }
  commit('Delete page');
  if (used) toast('Instances of components on that page keep their last look');
  requestAnimationFrame(zoomToFit);
}
/* ---------- assets ---------- */
function componentThumb(c, size = 56) {
  const ctx = mkCtx({ export: true }); ctx.img = ref => D.images[ref]?.url || D.images[ref]?.data || '';
  const pad = 2; const s = Math.min((size - pad * 2) / Math.max(c.w, 1), (size - pad * 2) / Math.max(c.h, 1), 4);
  const body = renderNode(Object.assign({}, c, { x: 0, y: 0, rotation: 0, flipX: false, flipY: false, effects: [] }), ctx);
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><defs>${ctx.defs.join('')}</defs><g transform="translate(${(size - c.w * s) / 2} ${(size - c.h * s) / 2}) scale(${s})">${body}</g></svg>`;
}
function renderAssets() {
  const el = $('#assetList'); if (!el || UI.ltab !== 'assets') return;
  const q = ($('#assetSearch').value || '').toLowerCase();
  let html = '';
  kids(root()).forEach(p => {
    const comps = descendants(p).filter(n => n.type === 'COMPONENT' && n.name.toLowerCase().includes(q));
    if (!comps.length) return;
    html += `<div class="agroup">${esc(p.name)}</div><div class="agrid">` + comps.map(c => `<div class="acard" data-comp="${c.id}" title="Drag onto the canvas, or click to insert">${componentThumb(c)}<span>${esc(c.name)}</span></div>`).join('') + '</div>';
  });
  el.innerHTML = html || `<div class="empty">No components yet. Select a frame or some layers and choose <b>Create component</b> (${MOD}${ALT}K).</div>`;
}
function initAssetDrag() {
  const list = $('#assetList'); let ad = null;
  list.addEventListener('pointerdown', e => { const c = e.target.closest('[data-comp]'); if (!c) return; e.preventDefault(); ad = { id: c.dataset.comp, x: e.clientX, y: e.clientY, ghost: null }; list.setPointerCapture(e.pointerId); });
  list.addEventListener('pointermove', e => {
    if (!ad) return;
    if (!ad.ghost && dist({ x: e.clientX, y: e.clientY }, ad) > 5) { ad.ghost = h(`<div class="aghost">${componentThumb(N(ad.id), 64)}</div>`); document.body.appendChild(ad.ghost); }
    if (ad.ghost) { ad.ghost.style.left = e.clientX + 'px'; ad.ghost.style.top = e.clientY + 'px'; }
  });
  list.addEventListener('pointerup', e => {
    if (!ad) return; const a = ad; ad = null;
    if (a.ghost) { a.ghost.remove(); const r = stage.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { updateStageRect(); const w = toWorld(e); const tgt = containerAt(e); D.sel = tgt.type !== 'PAGE' && tgt.id !== a.id && !isAncestor(N(a.id), tgt) ? [tgt.id] : []; cmdInsertInstance(a.id, w); } }
    else cmdInsertInstance(a.id);
  });
}
