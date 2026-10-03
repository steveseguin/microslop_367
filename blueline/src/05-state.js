/* ============================================================
   History (diff-based), persistence (IndexedDB), files
   ============================================================ */
const HIST = { undo: [], redo: [], committed: new Map(), selCommitted: [], pageCommitted: null, hold: 0 };
const listeners = { change: [], sel: [] };
function snapshotCommitted() { HIST.committed = new Map(Object.keys(D.nodes).map(id => [id, JSON.stringify(D.nodes[id])])); HIST.selCommitted = D.sel.slice(); HIST.pageCommitted = D.page; }
function diffNodes() {
  const changes = {}; let any = false;
  for (const id in D.nodes) {
    const s = JSON.stringify(D.nodes[id]), prev = HIST.committed.get(id);
    if (prev !== s) { changes[id] = [prev ?? null, s]; HIST.committed.set(id, s); any = true; }
  }
  for (const [id, s] of HIST.committed) if (!(id in D.nodes)) { changes[id] = [s, null]; HIST.committed.delete(id); any = true; }
  return any ? changes : null;
}
function commit(label = 'Edit', opts = {}) {
  if (HIST.hold > 0 && !opts.force) { layoutAll(); renderAll(); return null; }   // inside an AI batch: one undo step at the end
  layoutAll();
  D.sel = D.sel.filter(id => N(id));
  const changes = diffNodes();
  if (changes && !opts.silent) {
    HIST.undo.push({ label, changes, selBefore: HIST.selCommitted, selAfter: D.sel.slice(), pageBefore: HIST.pageCommitted, pageAfter: D.page });
    if (HIST.undo.length > 300) HIST.undo.shift();
    HIST.redo = [];
  }
  HIST.selCommitted = D.sel.slice(); HIST.pageCommitted = D.page;
  if (changes) { scheduleSave(); listeners.change.forEach(f => f(changes, opts)); }
  renderAll();
  return changes;
}
function silentRelayout() { layoutAll(); const ch = diffNodes(); if (ch) { listeners.change.forEach(f => f(ch, { silent: true })); scheduleSave(); } renderAll(); }
function applyHistory(changes, idx) {
  for (const id in changes) {
    const s = changes[id][idx];
    if (s === null) { delete D.nodes[id]; HIST.committed.delete(id); }
    else { D.nodes[id] = JSON.parse(s); HIST.committed.set(id, s); }
  }
  listeners.change.forEach(f => f(Object.fromEntries(Object.entries(changes).map(([id, v]) => [id, [v[1 - idx], v[idx]]])), { remote: false }));
}
function undo() {
  endTextEdit(true); exitVecEdit(true);
  const e = HIST.undo.pop(); if (!e) return toast('Nothing to undo');
  applyHistory(e.changes, 0); HIST.redo.push(e);
  if (e.pageBefore && N(e.pageBefore)) D.page = e.pageBefore;
  D.sel = (e.selBefore || []).filter(id => N(id) && pageOf(N(id))?.id === D.page);
  HIST.selCommitted = D.sel.slice(); HIST.pageCommitted = D.page;
  scheduleSave(); renderAll(); toast('Undo ' + e.label.toLowerCase(), 1200);
}
function redo() {
  endTextEdit(true); exitVecEdit(true);
  const e = HIST.redo.pop(); if (!e) return toast('Nothing to redo');
  applyHistory(e.changes, 1); HIST.undo.push(e);
  if (e.pageAfter && N(e.pageAfter)) D.page = e.pageAfter;
  D.sel = (e.selAfter || []).filter(id => N(id) && pageOf(N(id))?.id === D.page);
  HIST.selCommitted = D.sel.slice(); HIST.pageCommitted = D.page;
  scheduleSave(); renderAll(); toast('Redo ' + e.label.toLowerCase(), 1200);
}

/* ---------- IndexedDB ---------- */
const IDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res) => {
      try {
        const rq = indexedDB.open('blueline', 1);
        rq.onupgradeneeded = () => { const db = rq.result; if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' }); };
        rq.onsuccess = () => { this.db = rq.result; res(this.db); };
        rq.onerror = () => res(null); rq.onblocked = () => res(null);
      } catch (e) { res(null); }
    });
  },
  async tx(mode, fn) {
    const db = await this.open(); if (!db) return null;
    return new Promise((res) => { try { const t = db.transaction('files', mode); const st = t.objectStore('files'); const r = fn(st); t.oncomplete = () => res(r && r.result !== undefined ? r.result : true); t.onerror = () => res(null); } catch (e) { res(null); } });
  },
  put(rec) { return this.tx('readwrite', st => st.put(rec)); },
  get(id) { return this.tx('readonly', st => st.get(id)); },
  del(id) { return this.tx('readwrite', st => st.delete(id)); },
  all() { return this.tx('readonly', st => st.getAll()); },
};
let saveT = 0, saveState = 'saved';
function scheduleSave() { saveState = 'dirty'; updateSaveBadge(); clearTimeout(saveT); saveT = setTimeout(saveNow, 700); }
function fileRecord() {
  const imgs = {}; for (const k in D.images) imgs[k] = { data: D.images[k].data, w: D.images[k].w, h: D.images[k].h };
  return { id: D.fileId, name: root().name, updated: Date.now(), nodes: D.nodes, images: imgs, view: { page: D.page, zoom: D.zoom, panX: D.panX, panY: D.panY }, thumb: makeThumb() };
}
async function saveNow() {
  clearTimeout(saveT);
  if (!D.fileId) return;
  saveState = 'saving'; updateSaveBadge();
  const ok = await IDB.put(fileRecord());
  saveState = ok ? 'saved' : 'unsaved'; updateSaveBadge();
  if (ok) { safeLS.set('blueline:last', D.fileId); syncSuiteFileUrl(); }
}
function updateSaveBadge() {
  const el = $('#saveBadge'); if (!el) return;
  el.dataset.state = saveState;
  el.textContent = { saved: 'Saved in this browser', dirty: 'Editing…', saving: 'Saving…', unsaved: 'Not saved — browser storage unavailable' }[saveState];
}
function makeThumb() {
  try {
    const p = kids(root())[0]; if (!p) return '';
    const top = kids(p).filter(n => n.visible).slice(0, 40); if (!top.length) return '';
    const ctx = mkCtx({ export: true }); ctx.img = () => '';
    const b = exportBounds(top.map(n => n.id));
    const body = top.map(n => renderNode(n, ctx)).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x - 20} ${b.y - 20} ${b.w + 40} ${b.h + 40}"><rect x="${b.x - 20}" y="${b.y - 20}" width="${b.w + 40}" height="${b.h + 40}" fill="${p.bg || '#F2F3F5'}"/><defs>${ctx.defs.join('')}</defs>${body}</svg>`;
    return svg.length < 400000 ? svg : '';
  } catch (e) { return ''; }
}
function loadImagesInto(imgs) {
  for (const k in imgs) {
    if (D.images[k]) continue;
    const v = imgs[k]; const data = typeof v === 'string' ? v : v.data;
    D.images[k] = { data, w: v.w || 100, h: v.h || 100, url: null };
    try { const blob = dataURLtoBlob(data); D.images[k].url = URL.createObjectURL(blob); } catch (e) { }
    if (!v.w) { const im = new Image(); im.onload = () => { D.images[k].w = im.naturalWidth; D.images[k].h = im.naturalHeight; }; im.src = data; }
  }
}
function dataURLtoBlob(d) {
  const [head, b64] = d.split(','); const mime = head.match(/data:([^;]+)/)[1];
  const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}
function loadDocument(rec) {
  endTextEdit(true); exitVecEdit(true);
  D.nodes = clone(rec.nodes); D.fileId = rec.id || uid();
  D.images = {}; loadImagesInto(rec.images || {});
  migrateDoc();
  const pages = kids(root());
  D.page = rec.view && N(rec.view.page) ? rec.view.page : pages[0].id;
  D.sel = []; HIST.undo = []; HIST.redo = [];
  layoutAll(); snapshotCommitted();
  Object.values(D.nodes).forEach(n => n.type === 'TEXT' && ensureFont(n.fontFamily));
  if (rec.view && rec.view.zoom) { D.zoom = rec.view.zoom; D.panX = rec.view.panX; D.panY = rec.view.panY; applyViewport(); renderAll(); }
  else { renderAll(); requestAnimationFrame(() => zoomToFit()); }
  updateTitle();
}
function migrateDoc() {
  Object.values(D.nodes).forEach(n => {
    if (n.type === 'DOCUMENT' || n.type === 'PAGE') return;
    const b = baseProps(); for (const k in b) if (n[k] === undefined) n[k] = clone(b[k]);
  });
}
function newDocument(name = 'Untitled') {
  D.nodes = {};
  D.nodes.root = { id: 'root', type: 'DOCUMENT', name, children: [], styles: {} };
  const p = mkNode('PAGE', { name: 'Page 1' }); addNode(p, 'root');
  return p;
}
function serializeFile() {
  const imgs = {}; for (const k in D.images) imgs[k] = { data: D.images[k].data, w: D.images[k].w, h: D.images[k].h };
  return JSON.stringify({ format: 'blueline', version: 1, name: root().name, nodes: D.nodes, images: imgs });
}
function updateTitle() { const el = $('#fileName'); if (el && document.activeElement !== el) el.value = root().name; document.title = root().name + ' — Blueline | OfficeNinja'; syncSuiteFileUrl(); }
