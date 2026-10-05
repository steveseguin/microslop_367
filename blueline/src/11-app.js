/* ============================================================
   App shell: menus, keyboard, present mode, export, files,
   multiplayer (BroadcastChannel + serverless WebRTC), boot
   ============================================================ */
/* ---------- menus ---------- */
function showMenu(items, x, y, sub) {
  const m = sub ? $('#submenu') : $('#menu');
  if (!sub) $('#submenu').hidden = true;
  m.innerHTML = items.map((it, i) => it.sep ? '<div class="msep"></div>' : it.head ? `<div class="mhead">${esc(it.head)}</div>` :
    `<button class="mi${it.disabled ? ' dis' : ''}${it.sub ? ' hassub' : ''}" data-mi="${i}"${it.disabled ? ' disabled' : ''}>${it.swatch ? `<span class="swatch sm" style="--c:${it.swatch}"></span>` : it.check !== undefined ? `<span class="mchk">${it.check ? '✓' : ''}</span>` : ''}<span class="ml">${esc(it.label)}</span>${it.shortcut ? `<kbd>${esc(it.shortcut)}</kbd>` : ''}${it.sub ? '<span class="msub">›</span>' : ''}</button>`).join('');
  m.hidden = false;
  const W = m.offsetWidth, H = m.offsetHeight;
  m.style.left = clamp(x, 6, window.innerWidth - W - 6) + 'px'; m.style.top = clamp(y, 6, window.innerHeight - H - 6) + 'px';
  m.onclick = e => { const b = e.target.closest('[data-mi]'); if (!b) return; const it = items[+b.dataset.mi]; if (it.sub) return; hideMenu(); if (it.action && !it.disabled) setTimeout(it.action, 0); };
  m.onpointerover = e => {
    const b = e.target.closest('[data-mi]'); if (!b || sub) return;
    const it = items[+b.dataset.mi];
    if (it.sub) { const r = b.getBoundingClientRect(); showMenu(it.sub, r.right - 2, r.top - 4, true); } else $('#submenu').hidden = true;
  };
}
function hideMenu() { $('#menu').hidden = true; $('#submenu').hidden = true; }
const K = (s) => s.replace(/Mod\+/g, MOD).replace(/Alt\+/g, ALT).replace(/Shift\+/g, SHIFT);
function objectMenuItems() {
  const ns = selNodes(); const one = ns.length === 1 ? ns[0] : null; const any = ns.length > 0;
  const inst = one && one.type === 'INSTANCE' && !one.mainRef;
  return [
    { label: 'Group selection', shortcut: K('Mod+G'), action: () => { if (cmdGroup()) commit('Group'); }, disabled: !any },
    { label: 'Ungroup', shortcut: K('Mod+Shift+G'), action: cmdUngroup, disabled: !ns.some(n => ['GROUP', 'BOOLEAN', 'FRAME'].includes(n.type)) },
    { label: 'Frame selection', shortcut: K('Mod+Alt+G'), action: cmdFrameSelection, disabled: !any },
    { label: 'Add auto layout', shortcut: K('Shift+A'), action: cmdAutoLayout, disabled: !any },
    { sep: true },
    { label: 'Create component', shortcut: K('Mod+Alt+K'), action: cmdCreateComponent, disabled: !any },
    { label: 'Detach instance', shortcut: K('Mod+Alt+B'), action: cmdDetach, disabled: !inst },
    { label: 'Go to main component', action: cmdGoToMain, disabled: !(one && (one.type === 'INSTANCE' || instanceRootOf(one))) },
    { sep: true },
    { label: 'Boolean', disabled: ns.length < 1, sub: [['UNION', 'Union selection'], ['SUBTRACT', 'Subtract selection'], ['INTERSECT', 'Intersect selection'], ['EXCLUDE', 'Exclude selection']].map(([o, l]) => ({ label: l, action: () => cmdBoolean(o) })) },
    { label: 'Flatten', shortcut: K('Mod+E'), action: cmdFlatten, disabled: !any },
    { label: one && one.isMask ? 'Remove mask' : 'Use as mask', shortcut: K('Mod+Alt+M'), action: cmdMask, disabled: !any },
    { sep: true },
    { label: 'Bring to front', shortcut: K('Mod+Alt+]'), action: () => cmdZ('front'), disabled: !any },
    { label: 'Bring forward', shortcut: K('Mod+]'), action: () => cmdZ('forward'), disabled: !any },
    { label: 'Send backward', shortcut: K('Mod+['), action: () => cmdZ('backward'), disabled: !any },
    { label: 'Send to back', shortcut: K('Mod+Alt+['), action: () => cmdZ('back'), disabled: !any },
    { sep: true },
    { label: 'Flip horizontal', shortcut: K('Shift+H'), action: () => cmdFlip('h'), disabled: !any },
    { label: 'Flip vertical', shortcut: K('Shift+V'), action: () => cmdFlip('v'), disabled: !any },
    { label: 'Show/Hide', shortcut: K('Mod+Shift+H'), action: () => cmdToggle('visible'), disabled: !any },
    { label: 'Lock/Unlock', shortcut: K('Mod+Shift+L'), action: () => cmdToggle('locked'), disabled: !any },
  ];
}
function editMenuItems() {
  const any = D.sel.length > 0;
  return [
    { label: 'Undo', shortcut: K('Mod+Z'), action: undo, disabled: !HIST.undo.length },
    { label: 'Redo', shortcut: K('Mod+Shift+Z'), action: redo, disabled: !HIST.redo.length },
    { sep: true },
    { label: 'Copy', shortcut: K('Mod+C'), action: () => menuCopy(false), disabled: !any },
    { label: 'Cut', shortcut: K('Mod+X'), action: () => menuCopy(true), disabled: !any },
    { label: 'Paste', shortcut: K('Mod+V'), action: () => clipInternal ? pasteData(clipInternal) : toast(`Use ${MOD}V to paste from your clipboard`), disabled: false },
    { label: 'Duplicate', shortcut: K('Mod+D'), action: cmdDuplicate, disabled: !any },
    { label: 'Delete', shortcut: '⌫', action: cmdDelete, disabled: !any },
    { sep: true },
    { label: 'Copy as SVG code', action: async () => { const ids = topSelection(D.sel); const css = await embedFontCSS(buildSVG(ids).fams, false); const ok = await copyText(buildSVG(ids, { fontCSS: css }).svg); toast(ok ? 'SVG copied' : 'Copy failed — use Export instead'); }, disabled: !any },
    { label: 'Select all', shortcut: K('Mod+A'), action: cmdSelectAll },
  ];
}
function menuCopy(cut) { const ids = topSelection(D.sel); clipInternal = serializeTrees(ids); copyText(JSON.stringify(clipInternal)); if (cut) cmdDelete(); else toast('Copied'); }
function viewMenuItems() {
  const th = getSuiteTheme();
  return [
    { label: 'Zoom in', shortcut: K('Mod+='), action: () => zoomBy(1.5) },
    { label: 'Zoom out', shortcut: K('Mod+-'), action: () => zoomBy(1 / 1.5) },
    { label: 'Zoom to fit', shortcut: K('Shift+1'), action: zoomToFit },
    { label: 'Zoom to selection', shortcut: K('Shift+2'), action: zoomToSelection },
    { label: 'Zoom to 100%', shortcut: K('Shift+0'), action: () => { updateStageRect(); zoomAt(stageRect.width / 2, stageRect.height / 2, 1); } },
    { sep: true },
    { label: 'Pixel grid', check: !!UI.pixelGrid, action: () => { UI.pixelGrid = !UI.pixelGrid; stage.classList.toggle('pxgrid', UI.pixelGrid); } },
    { label: 'Show/hide UI', shortcut: K('Mod+\\'), action: toggleUI },
    { sep: true },
    { head: 'Interface theme' },
    { label: 'Match system', check: th === 'system', action: () => setTheme('system') },
    { label: 'Light', check: th === 'light', action: () => setTheme('light') },
    { label: 'Dark', check: th === 'dark', action: () => setTheme('dark') },
  ];
}
function mainMenu(btn) {
  const r = btn.getBoundingClientRect();
  showMenu([
    { label: 'Files…', shortcut: K('Mod+O'), action: openFiles },
    { label: 'New file', action: newFile },
    { label: 'Open a Blueline file…', action: async () => { const f = await pickFiles('.blueline,.json,application/json', false); if (f.length) openFileText(await readFile(f[0], 'text')); } },
    { label: 'Save a copy to your computer', shortcut: K('Mod+Shift+S'), action: saveToDisk },
    { sep: true },
    { label: 'Place image…', shortcut: K('Mod+Shift+K'), action: placeImage },
    { label: 'Import SVG…', action: async () => { const f = await pickFiles('.svg,image/svg+xml'); for (const x of f) importSVG(await readFile(x, 'text')); } },
    { label: 'Export…', shortcut: K('Mod+Shift+E'), action: exportSelection },
    { sep: true },
    { label: 'Edit', sub: editMenuItems() },
    { label: 'View', sub: viewMenuItems() },
    { label: 'Object', sub: objectMenuItems() },
    { sep: true },
    { label: 'AI control & exports…', action: () => aiToggle('connect') },
    { label: 'Copy design for AI', action: () => aiExport('bundle', 'copy') },
    { label: 'Live collaboration…', action: openCollab },
    { label: 'Keyboard shortcuts', shortcut: K('Mod+/'), action: openShortcuts },
    { label: 'About Blueline', action: openAbout },
  ], r.left, r.bottom + 6);
}
function contextMenu(e) {
  e.preventDefault();
  if (D.tool !== 'move') return;
  const ns = selNodes();
  const items = ns.length ? [
    { label: 'Copy', shortcut: K('Mod+C'), action: () => menuCopy(false) },
    { label: 'Paste here', shortcut: K('Mod+V'), action: () => { if (clipInternal) pasteData(clipInternal); else toast(`Use ${MOD}V to paste from your clipboard`); }, disabled: !clipInternal },
    { label: 'Duplicate', shortcut: K('Mod+D'), action: cmdDuplicate },
    { label: 'Delete', shortcut: '⌫', action: cmdDelete },
    { sep: true }, ...objectMenuItems(),
    { sep: true },
    { label: 'Copy as SVG code', action: editMenuItems().find(i => i.label === 'Copy as SVG code').action },
    { label: 'Export…', shortcut: K('Mod+Shift+E'), action: exportSelection },
  ] : [
    { label: 'Paste here', shortcut: K('Mod+V'), action: () => clipInternal && pasteData(clipInternal), disabled: !clipInternal },
    { label: 'Select all', shortcut: K('Mod+A'), action: cmdSelectAll },
    { sep: true }, ...viewMenuItems().slice(0, 5),
    { sep: true },
    { label: 'Place image…', action: placeImage },
  ];
  showMenu(items, e.clientX, e.clientY);
}
async function placeImage() { const f = await pickFiles('image/*'); if (f.length) importFiles(f); }
function toggleUI() { document.body.classList.toggle('noui'); setTimeout(() => { updateStageRect(); renderOverlay(); }, 50); }
function setTheme(t) {
  safeLS.set('blueline:theme', t);
  try { localStorage.setItem('officeninja_theme', t); } catch (e) { /* Theme still works for this tab. */ }
  applySuiteTheme(t);
}

/* ---------- keyboard ---------- */
function onKeyDown(e) {
  if (!$('#present').hidden) return presentKey(e);
  if (!$('#modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
  const t = e.target;
  if (t === TA()) {
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); endTextEdit(true); return; }
    const mod = e.metaKey || e.ctrlKey;
    if (mod && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
      e.preventDefault(); const n = N(TE.id); if (!n) return;
      if (e.key.toLowerCase() === 'b') { n.fontWeight = n.fontWeight >= 600 ? 400 : 700; markOverride(n, 'fontWeight'); }
      if (e.key.toLowerCase() === 'i') { n.italic = !n.italic; markOverride(n, 'italic'); }
      if (e.key.toLowerCase() === 'u') { n.textDecoration = n.textDecoration === 'UNDERLINE' ? 'NONE' : 'UNDERLINE'; markOverride(n, 'textDecoration'); }
      layoutAll(); renderLive(); positionTextEditor(); need.panel = true; schedule();
    }
    return;
  }
  if (isTyping(t)) return;
  const mod = e.metaKey || e.ctrlKey, sh = e.shiftKey, alt = e.altKey, code = e.code, key = e.key;
  const run = (fn) => { e.preventDefault(); fn(); };
  if (key === ' ' || code === 'Space') { if (!spaceDown) { spaceDown = true; stage.classList.add('space'); } e.preventDefault(); return; }
  if (mod) {
    if (code === 'KeyZ') return run(sh ? redo : undo);
    if (code === 'KeyY') return run(redo);
    if (code === 'KeyD') return run(cmdDuplicate);
    if (code === 'KeyG') return run(() => alt ? cmdFrameSelection() : sh ? cmdUngroup() : (cmdGroup() && commit('Group')));
    if (code === 'KeyK' && alt) return run(cmdCreateComponent);
    if (code === 'KeyK' && sh) return run(placeImage);
    if (code === 'KeyB' && alt) return run(cmdDetach);
    if (code === 'KeyM' && alt) return run(cmdMask);
    if (code === 'KeyE' && sh) return run(exportSelection);
    if (code === 'KeyE') return run(cmdFlatten);
    if (code === 'KeyA') return run(cmdSelectAll);
    if (code === 'KeyH' && sh) return run(() => cmdToggle('visible'));
    if (code === 'KeyL' && sh) return run(() => cmdToggle('locked'));
    if (code === 'KeyR') return run(() => D.sel[0] && startRename(D.sel[0]));
    if (code === 'KeyO') return run(openFiles);
    if (code === 'KeyS') return run(sh ? saveToDisk : () => { saveNow(); toast('Saved in this browser'); });
    if (code === 'BracketRight') return run(() => cmdZ(alt ? 'front' : 'forward'));
    if (code === 'BracketLeft') return run(() => cmdZ(alt ? 'back' : 'backward'));
    if (code === 'Equal' || key === '+') return run(() => zoomBy(1.5));
    if (code === 'Minus') return run(() => zoomBy(1 / 1.5));
    if (code === 'Digit0') return run(() => { updateStageRect(); zoomAt(stageRect.width / 2, stageRect.height / 2, 1); });
    if (code === 'Backslash') return run(toggleUI);
    if (code === 'Slash') return run(openShortcuts);
    if (code === 'Enter' && alt) return run(startPresent);
    return;
  }
  if (alt && !sh) {
    const al = { KeyA: 'left', KeyD: 'right', KeyW: 'top', KeyS: 'bottom', KeyH: 'hcenter', KeyV: 'vcenter' }[code];
    if (al) return run(() => cmdAlign(al));
  }
  if (alt && sh) { if (code === 'KeyH') return run(() => cmdDistribute('h')); if (code === 'KeyV') return run(() => cmdDistribute('v')); if (code === 'KeyA') return run(cmdRemoveAutoLayout); }
  if (key === 'Escape') {
    e.preventDefault();
    if (!$('#menu').hidden) return hideMenu();
    if (PK.spec || !$('#fontpop').hidden) return closePopovers();
    if (PEN.id) return finishPen();
    if (VE.id) return exitVecEdit(true);
    if (D.tool !== 'move') return setTool('move');
    return cmdSelectParent();
  }
  if (key === 'Enter') {
    e.preventDefault();
    if (PEN.id) return finishPen();
    if (VE.id) return exitVecEdit(true);
    if (sh) return cmdSelectParent();
    const n = selNodes()[0]; if (!n || D.sel.length !== 1) return;
    if (n.type === 'TEXT') return startTextEdit(n.id, true);
    if (n.type === 'VECTOR') return enterVecEdit(n.id);
    return cmdSelectChildren();
  }
  if (key === 'Tab') return run(() => cmdSibling(sh ? -1 : 1));
  if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); if (PEN.id) { const n = N(PEN.id); const sp = n.paths[0]; sp.pts.pop(); if (!sp.pts.length) { removeNode(n.id); PEN.id = null; } layoutAll(); renderLive(); return; } return cmdDelete(); }
  if (key.startsWith('Arrow')) {
    const s = sh ? 10 : 1;
    const d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[key];
    if (VE.id && VE.sel.length) { e.preventDefault(); const n = N(VE.id); const inv = M.inv(worldMatrix(n)); const dl = M.applyV(inv, { x: d[0], y: d[1] }); VE.sel.forEach(k => { const [si, pi] = k.split(':').map(Number); const p = n.paths[si].pts[pi]; p.x += dl.x; p.y += dl.y; }); commit('Nudge points'); return; }
    if (D.sel.length) return run(() => cmdNudge(d[0], d[1]));
    return;
  }
  if (sh) {
    if (code === 'KeyA') return run(cmdAutoLayout);
    if (code === 'KeyH') return run(() => cmdFlip('h'));
    if (code === 'KeyV') return run(() => cmdFlip('v'));
    if (code === 'KeyL') return run(() => setTool('arrow'));
    if (code === 'KeyP') return run(() => setTool('pencil'));
    if (code === 'Digit1') return run(zoomToFit);
    if (code === 'Digit2') return run(zoomToSelection);
    if (code === 'Digit0') return run(() => { updateStageRect(); zoomAt(stageRect.width / 2, stageRect.height / 2, 1); });
    if (code === 'KeyR') return;
    return;
  }
  if (alt) return;
  const tool = { KeyV: 'move', KeyH: 'hand', KeyF: 'frame', KeyA: 'frame', KeyR: 'rect', KeyO: 'ellipse', KeyL: 'line', KeyP: 'pen', KeyT: 'text' }[code];
  if (tool) return run(() => setTool(tool));
  if (code === 'Equal' || key === '+') return run(() => zoomBy(1.5));
  if (code === 'Minus') return run(() => zoomBy(1 / 1.5));
  if (/^Digit[0-9]$/.test(code) && D.sel.length) { const v = +code.slice(5); return run(() => { selNodes().forEach(n => { n.opacity = v === 0 ? 1 : v / 10; markOverride(n, 'opacity'); }); commit('Opacity'); }); }
}
function onKeyUp(e) { if (e.key === ' ' || e.code === 'Space') { spaceDown = false; stage.classList.remove('space', 'panning'); } if (e.key === 'Alt' && OV.measure) { OV.measure = null; renderOverlay(); } }

/* ---------- modal ---------- */
function openModal(html, cls = '') { const m = $('#modal'); m.className = 'modal ' + cls; $('#modalBody').onclick = null; $('#modalBody').innerHTML = html; m.hidden = false; const f = $('#modalBody [autofocus]'); if (f) f.focus(); }
function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }
function openShortcuts() {
  const groups = {
    Tools: [['Move', 'V'], ['Hand (or hold Space)', 'H'], ['Frame', 'F'], ['Rectangle', 'R'], ['Ellipse', 'O'], ['Line', 'L'], ['Arrow', 'Shift+L'], ['Pen', 'P'], ['Pencil', 'Shift+P'], ['Text', 'T'], ['Place image', 'Mod+Shift+K']],
    Selection: [['Select all', 'Mod+A'], ['Select inside / deep select', 'Mod+Click'], ['Select children', 'Enter'], ['Select parent', 'Shift+Enter'], ['Next / previous layer', 'Tab'], ['Measure distance', 'Hold Alt'], ['Duplicate while dragging', 'Alt+Drag']],
    Edit: [['Undo / redo', 'Mod+Z / Mod+Shift+Z'], ['Copy / paste', 'Mod+C / Mod+V'], ['Duplicate', 'Mod+D'], ['Rename', 'Mod+R'], ['Nudge', 'Arrows (Shift ×10)'], ['Opacity 10–100%', '1 … 0'], ['Flip', 'Shift+H / Shift+V']],
    Arrange: [['Group / ungroup', 'Mod+G / Mod+Shift+G'], ['Frame selection', 'Mod+Alt+G'], ['Auto layout', 'Shift+A'], ['Create component', 'Mod+Alt+K'], ['Detach instance', 'Mod+Alt+B'], ['Use as mask', 'Mod+Alt+M'], ['Flatten', 'Mod+E'], ['Bring forward / backward', 'Mod+] / Mod+['], ['Align left / right / top / bottom', 'Alt+A / D / W / S'], ['Align centers', 'Alt+H / Alt+V']],
    View: [['Zoom in / out', 'Mod+= / Mod+-'], ['Zoom to fit', 'Shift+1'], ['Zoom to selection', 'Shift+2'], ['Zoom to 100%', 'Shift+0'], ['Hide UI', 'Mod+\\'], ['Present', 'Mod+Alt+Enter']],
  };
  openModal(`<h2>Keyboard shortcuts</h2><div class="kgrid">${Object.entries(groups).map(([g, list]) => `<div><h3>${g}</h3>${list.map(([a, b]) => `<div class="krow"><span>${a}</span><kbd>${esc(K(b))}</kbd></div>`).join('')}</div>`).join('')}</div>`, 'wide');
}
function openAbout() {
  openModal(`<h2>Blueline</h2><p class="lead">A serverless design tool. Your files live in this browser (IndexedDB) and never leave it unless you export them or start a live session.</p>
  <ul class="facts"><li>Vector shapes, pen and pencil, boolean operations, masks</li><li>Frames, groups, constraints and auto layout</li><li>Components with instances and overrides</li><li>Color and text styles, Google Fonts</li><li>Prototype links and Present mode</li><li>PNG, JPG and SVG export; SVG import</li><li>Peer-to-peer live collaboration with no server</li></ul>
  <p class="hint">Named after the blueline proof — the last check before a design goes to press.</p><div class="mbtns"><button class="tb primary" data-close="1">Close</button></div>`);
}

/* ---------- export ---------- */
async function exportSelection() {
  let ids = topSelection(D.sel.filter(id => N(id)));
  if (!ids.length) { ids = kids(pageNode()).filter(n => isFrameLike(n) && n.visible).map(n => n.id); if (!ids.length) return toast('Select something to export'); }
  openModal(`<h2>Export</h2><div class="exlist"><div class="hint">Rendering…</div></div>`, 'wide');
  const out = [];
  for (const id of ids) {
    const n = N(id); const settings = (n.exportSettings && n.exportSettings.length) ? n.exportSettings : [{ scale: 2, format: 'PNG' }];
    for (const s of settings) {
      const base = n.name.replace(/[\\/:*?"<>|]+/g, '-') + (s.scale !== 1 && s.format !== 'SVG' ? `@${s.scale}x` : '');
      try {
        if (s.format === 'HTML' || s.format === 'JSON') {
          const text = s.format === 'HTML' ? htmlExport(id).html : JSON.stringify({ format: 'blueline-spec', version: 1, layers: [nodeToSpec(n)] }, null, 1);
          const blob = new Blob([text], { type: s.format === 'HTML' ? 'text/html' : 'application/json' });
          out.push({ name: n.name.replace(/[\\/:*?"<>|]+/g, '-') + (s.format === 'HTML' ? '.html' : '.spec.json'), blob, text, kind: s.format, dims: `${(text.length / 1024).toFixed(1)} KB of ${s.format === 'HTML' ? 'HTML' : 'JSON'}` });
          continue;
        }
        if (s.format === 'SVG') {
          const css = await embedFontCSS(buildSVG([id]).fams, false);
          const svg = buildSVG([id], { fontCSS: css }).svg;
          const blob = new Blob([svg], { type: 'image/svg+xml' });
          out.push({ name: base + '.svg', blob, url: URL.createObjectURL(blob), svg, dims: `${fmt(exportBounds([id]).w)}×${fmt(exportBounds([id]).h)}` });
        } else {
          const r = await rasterize([id], s.scale, s.format === 'JPG' ? 'jpg' : 'png');
          out.push({ name: base + (s.format === 'JPG' ? '.jpg' : '.png'), blob: r.blob, url: URL.createObjectURL(r.blob), dims: `${r.w}×${r.h}` });
        }
      } catch (e) { console.error(e); out.push({ name: base, err: true }); }
    }
  }
  EXPORTS = out;
  const list = $('#modalBody .exlist'); if (!list) return;
  list.innerHTML = out.map((o, i) => o.err ? `<div class="exrow"><span>${esc(o.name)}</span><span class="hint">Could not render this layer</span></div>` : `<div class="exrow"><div class="exthumb">${o.text ? `<span class="excode">${o.kind === 'HTML' ? '&lt;/&gt;' : '{ }'}</span>` : `<img src="${o.url}" alt="${esc(o.name)}">`}</div><div class="exmeta"><b>${esc(o.name)}</b><span class="hint mono">${o.text ? o.dims : `${o.dims} · ${(o.blob.size / 1024).toFixed(1)} KB`}</span></div><div class="exbtns">${o.svg || o.text ? `<button class="tb" data-excopy="${i}">Copy ${o.svg ? 'SVG' : o.kind === 'HTML' ? 'HTML' : 'JSON'}</button>` : ''}<button class="tb primary" data-exdl="${i}">Download</button></div></div>`).join('')
    + `<p class="hint">If a download doesn't start, right-click a preview and save it.</p><div class="mbtns"><button class="tb primary" data-close="1">Done</button></div>`;
  list.onclick = async e => {
    const dl = e.target.closest('[data-exdl]'), cp = e.target.closest('[data-excopy]');
    if (dl) { const o = EXPORTS[+dl.dataset.exdl]; downloadBlob(o.blob, o.name); }
    if (cp) { const o = EXPORTS[+cp.dataset.excopy]; const ok = await copyText(o.svg || o.text); toast(ok ? 'Copied' : 'Copy failed'); }
  };
}
let EXPORTS = [];
async function saveToDisk() {
  const txt = serializeFile(); const name = root().name.replace(/[\\/:*?"<>|]+/g, '-') + '.blueline.json';
  const blob = new Blob([txt], { type: 'application/json' });
  const ok = await downloadBlob(blob, name);
  if (ok) return;
  openModal(`<h2>Save a copy</h2><p class="lead">The download didn't go through. You can copy the file data instead, save it as <b>${esc(name)}</b>, and open it later with <i>Open a Blueline file</i> in the main menu — or paste it straight into Blueline in another browser.</p><div class="mbtns"><button class="tb" id="saveCopyData">Copy file data</button><button class="tb primary" data-close="1">Done</button></div>`);
  $('#saveCopyData').onclick = async () => { const c = await copyText(txt); toast(c ? 'File data copied' : 'Copy failed'); };
}
/* ---------- files ---------- */
async function openFiles() {
  await saveNow();
  const all = (await IDB.all()) || [];
  all.sort((a, b) => b.updated - a.updated);
  const card = f => `<div class="fcard${f.id === D.fileId ? ' cur' : ''}" data-fid="${f.id}"><div class="fthumb">${f.thumb ? `<img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(f.thumb)}">` : ''}</div><div class="fmeta"><b>${esc(f.name)}</b><span class="hint">${new Date(f.updated).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div><div class="fbtns"><button class="tb sm" data-fdup="${f.id}">Duplicate</button><button class="tb sm danger" data-fdel="${f.id}"${f.id === D.fileId ? ' disabled title="This file is open"' : ''}>Delete</button></div></div>`;
  openModal(`<div class="mhead2"><h2>Files</h2><div class="mbtns"><button class="tb" data-fopen="1">Open from computer…</button><button class="tb" data-fsample="1">New sample file</button><button class="tb primary" data-fnew="1">New file</button></div></div><p class="hint">Stored in this browser only. Use “Save a copy” in the main menu to back up a file.</p><div class="fgrid">${all.map(card).join('') || '<div class="hint">No files yet.</div>'}</div>`, 'wide files');
  $('#modalBody').onclick = async e => {
    const c = e.target.closest('[data-fid]'), d = e.target.dataset;
    if (d.fnew) { closeModal(); return newFile(); }
    if (d.fsample) { closeModal(); return newSample(); }
    if (d.fopen) { const f = await pickFiles('.blueline,.json,application/json', false); if (f.length) { closeModal(); openFileText(await readFile(f[0], 'text')); } return; }
    if (d.fdel) { const b = e.target; if (b.dataset.armed) { await IDB.del(d.fdel); openFiles(); } else { b.dataset.armed = '1'; b.textContent = 'Confirm delete'; } return; }
    if (d.fdup) { const rec = await IDB.get(d.fdup); if (rec) { rec.id = uid(); rec.nodes.root.name += ' copy'; rec.name = rec.nodes.root.name; rec.updated = Date.now(); await IDB.put(rec); openFiles(); } return; }
    if (c && !e.target.closest('button')) { const rec = await IDB.get(c.dataset.fid); if (rec) { closeModal(); collabLeave(); loadDocument(rec); safeLS.set('blueline:last', rec.id); } }
  };
}
async function newFile() { await saveNow(); collabLeave(); const id = uid(); newDocument('Untitled'); D.fileId = id; D.images = {}; D.page = kids(root())[0].id; D.sel = []; HIST.undo = []; HIST.redo = []; layoutAll(); snapshotCommitted(); D.zoom = 1; updateStageRect(); D.panX = stageRect.width / 2 - 400; D.panY = stageRect.height / 2 - 300; applyViewport(); renderAll(); updateTitle(); await saveNow(); }
async function newSample() { await saveNow(); collabLeave(); buildSample(); D.fileId = uid(); layoutAll(); snapshotCommitted(); HIST.undo = []; HIST.redo = []; D.sel = []; renderAll(); updateTitle(); requestAnimationFrame(zoomToFit); await saveNow(); }

/* ---------- present mode ---------- */
const PR = { stack: [], cur: null };
function startPresent() {
  if (TE.id) endTextEdit(true);
  const page = pageNode(); const frames = kids(page).filter(n => isFrameLike(n) && n.visible);
  if (!frames.length) return toast('Add a frame to present');
  const selTop = D.sel.length ? topLevelFrameOf(N(D.sel[0])) : null;
  const start = selTop || (page.flowStart && N(page.flowStart)) || frames[0];
  PR.stack = []; PR.cur = null;
  const p = $('#present'); p.hidden = false;
  try { p.requestFullscreen && document.fullscreenEnabled && p.requestFullscreen().catch(() => { }); } catch (e) { }
  presentShow(start.id, 'INSTANT');
}
function presentMarkup(f) {
  const ctx = mkCtx({});
  const body = renderNode(Object.assign({}, f, { x: 0, y: 0, rotation: 0, flipX: false, flipY: false }), ctx);
  return `<svg class="pframe" viewBox="0 0 ${f.w} ${f.h}" preserveAspectRatio="xMidYMid meet"><defs>${ctx.defs.join('')}</defs>${body}</svg>`;
}
function presentShow(id, transition = 'INSTANT', back = false, duration = 300) {
  const f = N(id); if (!f) return;
  const st = $('#pstage');
  const layer = h(`<div class="player">${presentMarkup(f)}</div>`);
  const old = st.querySelector('.player:last-child');
  if (PR.cur && !back) PR.stack.push(PR.cur);
  PR.cur = id;
  $('#ptitle').textContent = f.name;
  st.appendChild(layer);
  const dur = Math.max(0, duration) + 'ms';
  const anim = { DISSOLVE: 'pfade', SLIDE_LEFT: 'pslideL', SLIDE_RIGHT: 'pslideR', SLIDE_UP: 'pslideU', PUSH_LEFT: 'pslideL', PUSH_RIGHT: 'pslideR' }[transition];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (anim && old && !reduce) {
    layer.style.animation = `${back ? (anim === 'pslideL' ? 'pslideR' : anim === 'pslideR' ? 'pslideL' : anim) : anim} ${dur} cubic-bezier(.3,.7,.2,1) both`;
    if (transition.startsWith('PUSH')) old.style.animation = `${(transition === 'PUSH_LEFT') !== back ? 'poutL' : 'poutR'} ${dur} cubic-bezier(.3,.7,.2,1) both`;
    setTimeout(() => { st.querySelectorAll('.player').forEach(p => p !== layer && p.remove()); }, Math.max(0, duration) + 30);
  } else st.querySelectorAll('.player').forEach(p => p !== layer && p.remove());
  // hotspots cursor
  layer.querySelectorAll('[data-id]').forEach(el => { let n = N(el.dataset.id); while (n && n.id !== id) { if (n.reactions && n.reactions.length) { el.classList.add('hot'); break; } n = parentOf(n); } });
  $('#pback').disabled = !PR.stack.length;
}
function presentClick(e) {
  const el = e.target.closest('[data-id]'); if (!el) return flashHotspots();
  let n = N(el.dataset.id);
  while (n && n.id !== PR.cur) {
    const r = (n.reactions || []).find(x => x.trigger === 'CLICK');
    if (r) { if (r.action === 'BACK') return presentBack(r.transition, r.duration); if (r.dest && N(r.dest)) return presentShow(r.dest, r.transition, false, r.duration); }
    n = parentOf(n);
  }
  flashHotspots();
}
function flashHotspots() { const st = $('#pstage'); st.classList.remove('flash'); void st.offsetWidth; st.classList.add('flash'); }
function presentBack(tr = 'INSTANT', dur = 300) { const prev = PR.stack.pop(); if (prev) presentShow(prev, tr, true, dur); }
function presentKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); stopPresent(); }
  const frames = kids(pageNode()).filter(n => isFrameLike(n) && n.visible);
  const i = frames.findIndex(f => f.id === PR.cur);
  if (e.key === 'ArrowRight' && i < frames.length - 1) presentShow(frames[i + 1].id, 'SLIDE_LEFT');
  if (e.key === 'ArrowLeft') { if (PR.stack.length) presentBack('SLIDE_LEFT'); else if (i > 0) presentShow(frames[i - 1].id, 'SLIDE_RIGHT'); }
}
function stopPresent() { $('#present').hidden = true; $('#pstage').innerHTML = ''; try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { } }

/* ============================================================
   Live collaboration — no server.
   Same-browser tabs sync over BroadcastChannel automatically.
   Across devices, peers connect with WebRTC by swapping two codes.
   ============================================================ */
const CO = { bc: null, peers: new Map(), me: { id: uid(), name: safeLS.get('blueline:name', 'Guest ' + Math.random().toString(36).slice(2, 5).toUpperCase()), color: ['#E5484D', '#F76B15', '#30A46C', '#0090FF', '#8E4EC6', '#D6409F', '#12A594'][Math.floor(Math.random() * 7)] }, applying: false, sentImgs: new Set(), chunks: new Map() };
function collabJoinChannel() {
  if (CO.bc) CO.bc.close();
  CO.bc = null;
  try { CO.bc = new BroadcastChannel('blueline-' + D.fileId); CO.bc.onmessage = e => collabRecv(e.data, 'bc'); collabSend({ t: 'hello' }); } catch (e) { }
}
function collabLeave() { OV.cursors = {}; CO.peers.forEach(p => { try { p.pc.close(); } catch (e) { } }); CO.peers.clear(); updatePeersBadge(); }
function collabSend(msg, only) {
  msg.from = CO.me.id; msg.file = D.fileId;
  if (!only && CO.bc) try { CO.bc.postMessage(msg); } catch (e) { }
  const s = JSON.stringify(msg);
  CO.peers.forEach((p, id) => { if (only && only !== id) return; if (p.dc && p.dc.readyState === 'open') dcSend(p.dc, s); });
  if (!only && typeof liveSend === 'function') liveSend(msg);
}
const liveOn = () => typeof LIVE !== 'undefined' && !!LIVE.sdk;
function dcSend(dc, s) {
  const CH = 15000;
  if (s.length <= CH) return dc.send(s);
  const id = uid(), n = Math.ceil(s.length / CH);
  for (let i = 0; i < n; i++) dc.send(JSON.stringify({ t: 'chunk', id, i, n, d: s.slice(i * CH, (i + 1) * CH) }));
}
function collabRecv(msg, via, peerId) {
  if (!msg || msg.from === CO.me.id) return;
  if (msg.t === 'chunk') { const c = CO.chunks.get(msg.id) || []; c[msg.i] = msg.d; CO.chunks.set(msg.id, c); if (c.filter(x => x !== undefined).length === msg.n) { CO.chunks.delete(msg.id); try { collabRecv(JSON.parse(c.join('')), via, peerId); } catch (e) { } } return; }
  if (via === 'bc' && msg.file !== D.fileId) return;
  switch (msg.t) {
    case 'hello': sendPresence(); break;
    case 'full': {
      CO.applying = true;
      loadDocument({ id: msg.fileId, nodes: msg.nodes, images: msg.images, view: null });
      CO.applying = false; saveNow(); toast(`Joined ${root().name}`);
      break;
    }
    case 'ops': {
      if (msg.images) loadImagesInto(msg.images);
      CO.applying = true;
      for (const id in msg.changes) { const s = msg.changes[id]; if (s === null) { delete D.nodes[id]; HIST.committed.delete(id); } else { D.nodes[id] = JSON.parse(s); HIST.committed.set(id, s); } }
      CO.applying = false;
      if (!N(D.page)) D.page = kids(root())[0].id;
      D.sel = D.sel.filter(id => N(id)); if (TE.id && !N(TE.id)) TE.id = null; if (VE.id && !N(VE.id)) VE.id = null;
      textCache.clear(); scheduleSave(); renderAll();
      break;
    }
    case 'cursor': {
      OV.cursors[msg.from] = { x: msg.x, y: msg.y, page: msg.page, name: msg.name, color: msg.color, sel: msg.sel || [], t: Date.now() };
      updatePeersBadge(); renderOverlay(); break;
    }
    case 'bye': delete OV.cursors[msg.from]; updatePeersBadge(); renderOverlay(); break;
  }
}
listeners.change.push((changes, opts) => {
  if (CO.applying || opts.remote) return;
  if (!CO.bc && !CO.peers.size && !liveOn()) return;
  const out = {}; const imgs = {};
  for (const id in changes) {
    const s = changes[id][1]; out[id] = s;
    if (s && s.includes('imageRef')) { const n = JSON.parse(s); paintsOf(n).forEach(p => { if (p.type === 'IMAGE' && p.imageRef && !CO.sentImgs.has(p.imageRef) && D.images[p.imageRef]) { imgs[p.imageRef] = { data: D.images[p.imageRef].data, w: D.images[p.imageRef].w, h: D.images[p.imageRef].h }; CO.sentImgs.add(p.imageRef); } }); }
  }
  collabSend({ t: 'ops', changes: out, images: Object.keys(imgs).length ? imgs : undefined });
});
let lastCursorSend = 0;
function sendCursor(w) { if (!CO.bc && !CO.peers.size && !liveOn()) return; const now = Date.now(); if (now - lastCursorSend < 45) return; lastCursorSend = now; collabSend({ t: 'cursor', x: w.x, y: w.y, page: D.page, name: CO.me.name, color: CO.me.color, sel: D.sel.slice(0, 50) }); }
function sendPresence() { const w = D.lastW || { x: 0, y: 0 }; lastCursorSend = 0; sendCursor(w); }
function updatePeersBadge() {
  const now = Date.now(); Object.keys(OV.cursors).forEach(k => { if (now - OV.cursors[k].t > 60000) delete OV.cursors[k]; });
  const el = $('#peers'); if (!el) return;
  const list = Object.values(OV.cursors);
  el.innerHTML = list.slice(0, 5).map(c => `<span class="av" style="--c:${c.color}" title="${esc(c.name)}">${esc(c.name.slice(0, 1))}</span>`).join('') + `<span class="av me" style="--c:${CO.me.color}" title="You (${esc(CO.me.name)})">${esc(CO.me.name.slice(0, 1))}</span>`;
}
async function packCode(obj) {
  const txt = JSON.stringify(obj);
  try {
    const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(new TextEncoder().encode(txt)); w.close();
    const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer()); let bin = ''; buf.forEach(b => bin += String.fromCharCode(b));
    return 'BL1.' + btoa(bin);
  } catch (e) { return 'BL0.' + btoa(unescape(encodeURIComponent(txt))); }
}
async function unpackCode(code) {
  code = code.trim();
  if (code.startsWith('BL0.')) return JSON.parse(decodeURIComponent(escape(atob(code.slice(4)))));
  const bin = atob(code.slice(4)); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(u8); w.close();
  return JSON.parse(await new Response(ds.readable).text());
}
function newPC() {
  if (typeof RTCPeerConnection === 'undefined') throw new Error('nortc');
  return new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
}
function iceDone(pc) { return new Promise(res => { if (pc.iceGatheringState === 'complete') return res(); const t = setTimeout(res, 2500); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } }); }); }
function wireDC(peerId, pc, dc, host) {
  const p = { pc, dc }; CO.peers.set(peerId, p);
  dc.onopen = () => {
    toast('Connected — editing together'); updatePeersBadge();
    if (host) { const imgs = {}; for (const k in D.images) { imgs[k] = { data: D.images[k].data, w: D.images[k].w, h: D.images[k].h }; CO.sentImgs.add(k); } dcSend(dc, JSON.stringify({ t: 'full', from: CO.me.id, fileId: D.fileId, nodes: D.nodes, images: imgs })); }
    sendPresence(); closeModal();
  };
  dc.onmessage = e => { try { collabRecv(JSON.parse(e.data), 'dc', peerId); } catch (err) { } };
  dc.onclose = () => { CO.peers.delete(peerId); toast('A collaborator disconnected'); Object.keys(OV.cursors).forEach(k => { if (OV.cursors[k].peer === peerId) delete OV.cursors[k]; }); updatePeersBadge(); renderOverlay(); };
}
function openCollab() {
  openModal(`<h2>Live collaboration</h2>
  <p class="lead">Edits sync peer-to-peer. Nothing is stored on a server.</p>
  <div class="field"><label for="coName">Your name</label><input id="coName" value="${esc(CO.me.name)}" spellcheck="false"></div>
  <div class="cocol coshare"><h3>Share with a link</h3>
    <p class="hint">Anyone with the link opens this design in their browser, no account needed, and sees every change live. Keep this file open while they work.</p>
    <div class="mbtns left"><button class="tb primary" data-co="share-edit">Copy edit link</button><button class="tb" data-co="share-view">Copy view-only link</button>${LIVE.sdk && LIVE.host ? '<button class="tb" data-co="share-stop">Stop sharing</button>' : ''}</div>
    <p class="hint" id="liveStatus"></p>
  </div>
  <details class="coadvanced"><summary>Other ways to connect</summary>
  <div class="cogrid">
    <div class="cocol"><h3>Same browser</h3><p class="hint">Open this file in another tab or window. Tabs showing the same file sync automatically, with live cursors.</p></div>
    <div class="cocol"><h3>Without a server at all</h3><p class="hint">Swap two codes with your collaborator over any chat app.</p>
      <div class="mbtns left"><button class="tb" data-co="host">Invite with a code</button><button class="tb" data-co="join">I have a code</button></div>
    </div>
  </div></details>
  <div id="coFlow"></div>`, 'wide');
  liveRender();
  $('#coName').addEventListener('change', e => { CO.me.name = e.target.value.trim().slice(0, 24) || CO.me.name; safeLS.set('blueline:name', CO.me.name); updatePeersBadge(); sendPresence(); });
  $('#modalBody').onclick = async e => {
    const b = e.target.closest('[data-co]'); if (!b) return;
    const flow = $('#coFlow');
    if (b.dataset.co === 'share-edit' || b.dataset.co === 'share-view') {
      if (!(await liveShare())) { toast(LIVE.error || 'Could not start sharing'); return; }
      const link = liveLink(b.dataset.co === 'share-edit');
      const ok = await copyText(link);
      toast(ok ? (b.dataset.co === 'share-edit' ? 'Edit link copied: people with it can change this design' : 'View-only link copied') : 'Copy the link below');
      flow.innerHTML = `<p class="hint">${b.dataset.co === 'share-edit' ? 'Edit' : 'View-only'} link:</p><textarea readonly class="code" id="coLink">${esc(link)}</textarea>`;
      liveRender(); return;
    }
    if (b.dataset.co === 'share-stop') { liveStop(); closeModal(); toast('Stopped sharing. Links stop working until you share again.'); return; }
    const fail = () => { flow.innerHTML = `<div class="warn">This page can't open peer-to-peer connections. Save Blueline as a standalone HTML file (or host it on any static site) to collaborate across devices. Same-browser tabs still sync.</div>`; };
    try {
      if (b.dataset.co === 'host') {
        const pc = newPC(); const dc = pc.createDataChannel('blueline', { ordered: true });
        const pid = uid(); wireDC(pid, pc, dc, true);
        await pc.setLocalDescription(await pc.createOffer()); await iceDone(pc);
        const code = await packCode({ sdp: pc.localDescription.sdp, type: 'offer' });
        flow.innerHTML = `<h3>1. Send this invite code</h3><textarea readonly class="code" id="coOffer">${code}</textarea><div class="mbtns left"><button class="tb" data-copy="coOffer">Copy invite code</button></div><h3>2. Paste their reply code</h3><textarea class="code" id="coAnswer" placeholder="BL1.…"></textarea><div class="mbtns left"><button class="tb primary" id="coConnect">Connect</button></div>`;
        flow.onclick = async ev => {
          if (ev.target.dataset.copy) { const ok = await copyText($('#' + ev.target.dataset.copy).value); toast(ok ? 'Copied' : 'Select the code and copy it'); if (!ok) $('#' + ev.target.dataset.copy).select(); }
          if (ev.target.id === 'coConnect') { try { const ans = await unpackCode($('#coAnswer').value); await pc.setRemoteDescription(ans); flow.insertAdjacentHTML('beforeend', '<p class="hint">Connecting…</p>'); } catch (err) { toast('That reply code is not valid'); } }
        };
      } else if (b.dataset.co === 'join') {
        flow.innerHTML = `<h3>1. Paste the invite code</h3><textarea class="code" id="coOffer2" placeholder="BL1.…"></textarea><div class="mbtns left"><button class="tb primary" id="coMakeAnswer">Create reply code</button></div><div id="coAns"></div>`;
        flow.onclick = async ev => {
          if (ev.target.id === 'coMakeAnswer') {
            try {
              const offer = await unpackCode($('#coOffer2').value);
              const pc = newPC(); const pid = uid();
              pc.ondatachannel = de => wireDC(pid, pc, de.channel, false);
              await pc.setRemoteDescription(offer); await pc.setLocalDescription(await pc.createAnswer()); await iceDone(pc);
              const code = await packCode({ sdp: pc.localDescription.sdp, type: 'answer' });
              $('#coAns').innerHTML = `<h3>2. Send this reply code back</h3><textarea readonly class="code" id="coAnsCode">${code}</textarea><div class="mbtns left"><button class="tb" data-copy="coAnsCode">Copy reply code</button></div><p class="hint">You'll join their file once they paste it.</p>`;
            } catch (err) { if (err.message === 'nortc') fail(); else toast('That invite code is not valid'); }
          }
          if (ev.target.dataset.copy) { const ok = await copyText($('#' + ev.target.dataset.copy).value); toast(ok ? 'Copied' : 'Select the code and copy it'); }
        };
      }
    } catch (err) { fail(); }
  };
}
window.addEventListener('beforeunload', () => { try { collabSend({ t: 'bye' }); } catch (e) { } saveNow(); });

/* ---------- sample document ---------- */
function T(text, props) { return mkNode('TEXT', Object.assign({ characters: text, name: text.slice(0, 40), fontFamily: 'Inter' }, props)); }
function buildSample() {
  newDocument('Trailhead — sample file');
  const page = kids(root())[0]; page.name = 'App screens'; page.bg = '#EEF0F3';
  const comps = mkNode('PAGE', { name: 'Components', bg: '#EEF0F3' }); addNode(comps, 'root');
  root().styles = {
    stInk: { id: 'stInk', type: 'COLOR', name: 'Ink', paints: [solid('#1B2430')] },
    stPine: { id: 'stPine', type: 'COLOR', name: 'Pine', paints: [solid('#1F6B4F')] },
    stMoss: { id: 'stMoss', type: 'COLOR', name: 'Moss tint', paints: [solid('#E3EFE8')] },
    stH1: { id: 'stH1', type: 'TEXT', name: 'Heading', props: { fontFamily: 'Inter', fontWeight: 700, italic: false, fontSize: 28, lineHeight: { u: '%', v: 115 }, letterSpacing: -0.4, textCase: 'ORIGINAL', textDecoration: 'NONE' } },
  };
  D.page = page.id;
  // ----- components (on Components page)
  const btn = mkNode('COMPONENT', { name: 'Button/Primary', x: 0, y: 0, w: 160, h: 48, fills: [solid('#1F6B4F')], fillStyle: 'stPine', cornerRadius: 12, layoutMode: 'HORIZONTAL', itemSpacing: 8, padding: [14, 22, 14, 22], primaryAlign: 'CENTER', counterAlign: 'CENTER', sizingH: 'HUG', sizingV: 'HUG', description: 'Main call to action. One per screen.' });
  addNode(btn, comps.id);
  addNode(T('Start hike', { fontWeight: 600, fontSize: 16, fills: [solid('#FFFFFF')], name: 'Label' }), btn.id);
  const card = mkNode('COMPONENT', { name: 'Trail card', x: 0, y: 120, w: 345, h: 120, fills: [solid('#FFFFFF')], cornerRadius: 16, layoutMode: 'HORIZONTAL', itemSpacing: 14, padding: [12, 12, 12, 12], counterAlign: 'CENTER', sizingH: 'FIXED', sizingV: 'HUG', effects: [{ type: 'DROP_SHADOW', x: 0, y: 6, blur: 18, spread: 0, color: '#1B2430', opacity: 0.08, visible: true }] });
  addNode(card, comps.id);
  const thumb = mkNode('RECT', { name: 'Photo', w: 96, h: 96, cornerRadius: 12, fills: [{ type: 'LINEAR', angle: 120, opacity: 1, visible: true, stops: [{ pos: 0, color: '#8CC9A6', opacity: 1 }, { pos: 1, color: '#1F6B4F', opacity: 1 }] }] });
  addNode(thumb, card.id);
  const info = mkNode('FRAME', { name: 'Info', fills: [], clipsContent: false, layoutMode: 'VERTICAL', itemSpacing: 6, padding: [0, 0, 0, 0], sizingH: 'FILL', sizingV: 'HUG', w: 200, h: 80 });
  addNode(info, card.id);
  addNode(T('Ridge Loop', { fontWeight: 600, fontSize: 17, fills: [solid('#1B2430')], name: 'Title', sizingH: 'FILL', sizingV: 'HUG' }), info.id);
  addNode(T('7.4 km · 420 m gain · 2 h 40 min', { fontSize: 13, fills: [solid('#5B6573')], name: 'Stats', sizingH: 'FILL', sizingV: 'HUG' }), info.id);
  const tag = mkNode('FRAME', { name: 'Difficulty', fills: [solid('#E3EFE8')], fillStyle: 'stMoss', cornerRadius: 999, layoutMode: 'HORIZONTAL', padding: [3, 10, 3, 10], sizingH: 'HUG', sizingV: 'HUG', clipsContent: false });
  addNode(tag, info.id);
  addNode(T('Moderate', { fontSize: 12, fontWeight: 600, fills: [solid('#1F6B4F')], name: 'Level' }), tag.id);
  const icon = mkNode('COMPONENT', { name: 'Icon/Pin', x: 220, y: 0, w: 24, h: 24, fills: [], clipsContent: false });
  addNode(icon, comps.id);
  const pinA = mkNode('ELLIPSE', { name: 'Head', x: 4, y: 2, w: 16, h: 16, fills: [solid('#1F6B4F')] });
  const pinB = mkNode('POLYGON', { name: 'Tip', x: 7, y: 12, w: 10, h: 10, rotation: 180, pointCount: 3, fills: [solid('#1F6B4F')] });
  const pinC = mkNode('ELLIPSE', { name: 'Hole', x: 9, y: 7, w: 6, h: 6, fills: [solid('#FFFFFF')] });
  const pinBool = mkNode('BOOLEAN', { name: 'Pin', booleanOp: 'UNION', fills: [solid('#1F6B4F')], x: 0, y: 0, w: 24, h: 24 });
  addNode(pinBool, icon.id); addNode(pinA, pinBool.id); addNode(pinB, pinBool.id);
  const sub = mkNode('BOOLEAN', { name: 'Pin cutout', booleanOp: 'SUBTRACT', fills: [solid('#1F6B4F')], x: 0, y: 0, w: 24, h: 24 });
  detach(pinBool); addNode(sub, icon.id); addNode(pinBool, sub.id); addNode(pinC, sub.id);
  layoutAll();
  // ----- screen 1: Home
  const home = mkNode('FRAME', { name: 'Home', x: 0, y: 0, w: 393, h: 852, fills: [solid('#F7F8F6')], layoutMode: 'VERTICAL', itemSpacing: 16, padding: [64, 24, 32, 24], sizingH: 'FIXED', sizingV: 'FIXED' });
  addNode(home, page.id);
  const hdr = mkNode('FRAME', { name: 'Header', fills: [], clipsContent: false, layoutMode: 'VERTICAL', itemSpacing: 4, padding: [0, 0, 0, 0], sizingH: 'FILL', sizingV: 'HUG' });
  addNode(hdr, home.id);
  addNode(T('Good morning, Sam', { fontSize: 15, fills: [solid('#5B6573')], name: 'Greeting' }), hdr.id);
  addNode(T('Where to today?', { textStyle: 'stH1', fontWeight: 700, fontSize: 28, lineHeight: { u: '%', v: 115 }, letterSpacing: -0.4, fills: [solid('#1B2430')], fillStyle: 'stInk', name: 'Title' }), hdr.id);
  const search = mkNode('FRAME', { name: 'Search', fills: [solid('#FFFFFF')], strokes: [solid('#D9DED8')], strokeWidth: 1, cornerRadius: 14, layoutMode: 'HORIZONTAL', itemSpacing: 10, padding: [14, 16, 14, 16], counterAlign: 'CENTER', sizingH: 'FILL', sizingV: 'HUG' });
  addNode(search, home.id);
  const mg = mkNode('ELLIPSE', { name: 'Magnifier', w: 14, h: 14, fills: [], strokes: [solid('#5B6573')], strokeWidth: 2 });
  addNode(mg, search.id);
  addNode(T('Search trails near Squamish', { fontSize: 15, fills: [solid('#8A93A0')], name: 'Placeholder' }), search.id);
  addNode(T('Popular this week', { fontSize: 13, fontWeight: 600, textCase: 'UPPER', letterSpacing: 0.8, fills: [solid('#5B6573')], name: 'Section label' }), home.id);
  const c1 = createInstance(card.id, home.id, 0, 0);
  const c2 = createInstance(card.id, home.id, 0, 0);
  const c3 = createInstance(card.id, home.id, 0, 0);
  [c1, c2, c3].forEach(c => { c.sizingH = 'FILL'; });
  layoutAll();
  const setText = (inst, name, txt) => { const t = descendants(inst).find(d => d.name === name && d.type === 'TEXT'); if (t) { t.characters = txt; markOverride(t, 'characters'); } };
  const setFill = (inst, name, p) => { const t = descendants(inst).find(d => d.name === name); if (t) { t.fills = [p]; markOverride(t, 'fills'); } };
  setText(c2, 'Title', 'Lighthouse Bluffs'); setText(c2, 'Stats', '3.1 km · 90 m gain · 1 h 05 min'); setText(c2, 'Level', 'Easy');
  setFill(c2, 'Photo', { type: 'LINEAR', angle: 120, opacity: 1, visible: true, stops: [{ pos: 0, color: '#9CC8E8', opacity: 1 }, { pos: 1, color: '#2F5E8C', opacity: 1 }] });
  setText(c3, 'Title', 'Garibaldi Lake'); setText(c3, 'Stats', '18 km · 820 m gain · 6 h'); setText(c3, 'Level', 'Hard');
  setFill(c3, 'Photo', { type: 'LINEAR', angle: 120, opacity: 1, visible: true, stops: [{ pos: 0, color: '#F2C27B', opacity: 1 }, { pos: 1, color: '#B4532A', opacity: 1 }] });
  const lvl3 = descendants(c3).find(d => d.name === 'Difficulty'); if (lvl3) { lvl3.fills = [solid('#FBE3D6')]; markOverride(lvl3, 'fills'); }
  const lvlT3 = descendants(c3).find(d => d.name === 'Level'); if (lvlT3) { lvlT3.fills = [solid('#B4532A')]; markOverride(lvlT3, 'fills'); }
  c1.reactions = [{ trigger: 'CLICK', action: 'NAVIGATE', dest: null, transition: 'SLIDE_LEFT', duration: 320 }];
  // ----- screen 2: Trail detail
  const det = mkNode('FRAME', { name: 'Trail detail', x: 473, y: 0, w: 393, h: 852, fills: [solid('#F7F8F6')] });
  addNode(det, page.id);
  c1.reactions[0].dest = det.id;
  const hero = mkNode('RECT', { name: 'Hero photo', x: 0, y: 0, w: 393, h: 360, fills: [{ type: 'LINEAR', angle: 100, opacity: 1, visible: true, stops: [{ pos: 0, color: '#A8D5BA', opacity: 1 }, { pos: 0.55, color: '#3D8B66', opacity: 1 }, { pos: 1, color: '#173F30', opacity: 1 }] }], constraints: { h: 'LEFT_RIGHT', v: 'TOP' } });
  addNode(hero, det.id);
  const ridge = mkNode('VECTOR', { name: 'Ridge line', fills: [solid('#173F30', 0.55)], strokes: [], paths: [{ closed: true, pts: [pt(0, 300), pt(70, 230, -20, 10, 20, -10), pt(150, 270), pt(240, 190, -30, 0, 30, 0), pt(393, 260), pt(393, 360), pt(0, 360)] }] });
  addNode(ridge, det.id);
  const back = mkNode('FRAME', { name: 'Back button', x: 20, y: 56, w: 40, h: 40, cornerRadius: 20, fills: [solid('#FFFFFF', 0.9)], layoutMode: 'HORIZONTAL', primaryAlign: 'CENTER', counterAlign: 'CENTER', padding: [0, 0, 0, 0], sizingH: 'FIXED', sizingV: 'FIXED', reactions: [{ trigger: 'CLICK', action: 'BACK', dest: null, transition: 'SLIDE_RIGHT', duration: 320 }] });
  addNode(back, det.id);
  const chev = mkNode('VECTOR', { name: 'Chevron', strokes: [solid('#1B2430')], strokeWidth: 2.2, strokeCap: 'ROUND', strokeJoin: 'ROUND', paths: [{ closed: false, pts: [pt(8, 0), pt(0, 8), pt(8, 16)] }] });
  addNode(chev, back.id);
  const body = mkNode('FRAME', { name: 'Content', x: 0, y: 336, w: 393, h: 516, fills: [solid('#F7F8F6')], cornerRadii: [24, 24, 0, 0], layoutMode: 'VERTICAL', itemSpacing: 14, padding: [28, 24, 32, 24], sizingH: 'FIXED', sizingV: 'FIXED', constraints: { h: 'LEFT_RIGHT', v: 'TOP_BOTTOM' } });
  addNode(body, det.id);
  const pinI = createInstance(icon.id, body.id, 0, 0);
  addNode(T('Ridge Loop', { textStyle: 'stH1', fontWeight: 700, fontSize: 28, lineHeight: { u: '%', v: 115 }, letterSpacing: -0.4, fills: [solid('#1B2430')], fillStyle: 'stInk', name: 'Trail name' }), body.id);
  addNode(T('A steady climb through second-growth cedar to a granite ridge with views over Howe Sound. Bring layers — the top is exposed and the wind picks up after noon.', { fontSize: 15, lineHeight: { u: '%', v: 150 }, fills: [solid('#3C4552')], name: 'Description', sizingH: 'FILL', sizingV: 'HUG' }), body.id);
  const stats = mkNode('FRAME', { name: 'Stats row', fills: [], clipsContent: false, layoutMode: 'HORIZONTAL', itemSpacing: 10, padding: [6, 0, 6, 0], sizingH: 'FILL', sizingV: 'HUG' });
  addNode(stats, body.id);
  [['7.4 km', 'Distance'], ['420 m', 'Elevation'], ['2 h 40', 'Time']].forEach(([v, l]) => {
    const s = mkNode('FRAME', { name: l, fills: [solid('#FFFFFF')], cornerRadius: 12, layoutMode: 'VERTICAL', itemSpacing: 2, padding: [12, 12, 12, 12], sizingH: 'FILL', sizingV: 'HUG', strokes: [solid('#E3E7E2')], strokeWidth: 1 });
    addNode(s, stats.id);
    addNode(T(v, { fontSize: 18, fontWeight: 700, fills: [solid('#1B2430')], name: 'Value' }), s.id);
    addNode(T(l, { fontSize: 12, fills: [solid('#5B6573')], name: 'Label' }), s.id);
  });
  const cta = createInstance(btn.id, body.id, 0, 0); cta.sizingH = 'FILL';
  // ----- annotation
  const note = T('Click the first trail card in Present mode (▶ top right) to try the prototype. Edit “Button/Primary” or “Trail card” on the Components page and every instance updates.', { x: 0, y: 900, sizingH: 'FIXED', sizingV: 'HUG', w: 866, fontSize: 14, lineHeight: { u: '%', v: 150 }, fills: [solid('#5B6573')], name: 'Note' });
  addNode(note, page.id);
  const arrow = mkNode('VECTOR', { name: 'Arrow', strokes: [solid('#2F6FDE')], strokeWidth: 2, strokeCap: 'ROUND', endCap: 'ARROW_LINES', paths: [{ closed: false, pts: [pt(0, 0), pt(54, -40, -30, 10, 0, 0)] }], x: 400, y: 640 });
  addNode(arrow, page.id);
  page.flowStart = home.id;
  // components page labels
  addNode(T('Components', { x: 0, y: -60, fontSize: 22, fontWeight: 700, fills: [solid('#1B2430')], name: 'Heading' }), comps.id);
  D.page = page.id;
}

/* ---------- boot ---------- */
function bindToolbar() {
  const tb = $('#toolbar');
  $$('#toolbar [data-tool]').forEach(b => { b.innerHTML = ICONS[b.dataset.tool]; b.setAttribute('aria-label', b.title); });
  const sb = $('#toolbar [data-shapes]'); sb.dataset.tool = 'rect'; sb.innerHTML = ICONS.rect + '<i class="caret"></i>'; sb.title = TOOL_TITLES.rect;
  tb.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.shapes) {
      const r0 = b.getBoundingClientRect();
      if (D.tool !== b.dataset.tool && e.clientX < r0.right - 12) { setTool(b.dataset.tool); return; }
      const r = b.getBoundingClientRect();
      showMenu(['rect', 'line', 'arrow', 'ellipse', 'polygon', 'star'].map(t => ({ label: TOOL_TITLES[t].replace(/ \(.+\)/, ''), shortcut: (TOOL_TITLES[t].match(/\((.+)\)/) || [])[1] || '', action: () => setTool(t) })).concat([{ sep: true }, { label: 'Place image…', shortcut: K('Mod+Shift+K'), action: placeImage }]), r.left, r.top - 260);
      return;
    }
    if (b.dataset.tool) setTool(b.dataset.tool);
  });
}
function init() {
  stage = $('#stage'); canvasSvg = $('#canvas'); vpG = $('#vp'); contentG = $('#content'); overlaySvg = $('#overlay');
  initSuiteNavigation();
  stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  stage.addEventListener('dblclick', onDblClick);
  stage.addEventListener('wheel', onWheel, { passive: false });
  stage.addEventListener('contextmenu', contextMenu);
  stage.addEventListener('dragover', e => { e.preventDefault(); });
  stage.addEventListener('drop', e => { e.preventDefault(); updateStageRect(); D.lastE = e; const f = [...(e.dataTransfer?.files || [])]; if (f.length) importFiles(f, toWorld(e)); });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => { spaceDown = false; stage.classList.remove('space', 'panning'); });
  document.addEventListener('copy', e => onCopy(e, false));
  document.addEventListener('cut', e => onCopy(e, true));
  document.addEventListener('paste', onPaste);
  window.addEventListener('resize', () => { updateStageRect(); renderOverlay(); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#menu,#submenu')) hideMenu(); if (!e.target.closest('#picker,#fontpop,[data-pick],[data-selcol],[data-act="fontPicker"]')) { const pk = $('#picker'); if (!pk.hidden) closePopovers(); const fp = $('#fontpop'); if (!fp.hidden) fp.hidden = true; } }, true);
  TA().addEventListener('input', onTextInput);
  TA().addEventListener('blur', () => setTimeout(() => { if (TE.id && document.activeElement !== TA()) endTextEdit(true); }, 120));
  $('#mainMenu').addEventListener('click', e => mainMenu(e.currentTarget));
  $('#presentBtn').addEventListener('click', startPresent);
  $('#zoomLabel').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); showMenu(viewMenuItems().slice(0, 5), r.left - 120, r.bottom + 6); });
  $('#peers').addEventListener('click', openCollab);
  $('#fileName').addEventListener('change', e => { const v = e.target.value.trim(); if (v) { root().name = v; commit('Rename file'); updateTitle(); } });
  $('#fileName').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') e.target.blur(); e.stopPropagation(); });
  $('#modal').addEventListener('pointerdown', e => { if (e.target.id === 'modal') closeModal(); });
  $('#modal').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  $('#pclose').addEventListener('click', stopPresent);
  $('#pback').addEventListener('click', () => presentBack('SLIDE_RIGHT'));
  $('#prestart').addEventListener('click', () => { PR.stack = []; PR.cur = null; const page = pageNode(); const f = (page.flowStart && N(page.flowStart)) || kids(page).find(isFrameLike); if (f) presentShow(f.id, 'DISSOLVE'); });
  $('#pstage').addEventListener('click', presentClick);
  $$('[data-panel-toggle]').forEach(b => b.addEventListener('click', () => { document.body.classList.toggle('show-' + b.dataset.panelToggle); setTimeout(updateStageRect, 30); }));
  bindToolbar(); initLayers(); initPanel(); initPicker(); initAIPanel();
  updateStageRect();
  setInterval(updatePeersBadge, 15000);
  boot();
}
async function boot() {
  const params = new URLSearchParams(location.search);
  const requested = params.get('id');
  const fresh = params.get('new') === '1' || !!params.get('live');
  const last = requested || safeLS.get('blueline:last', null);
  let rec = !fresh && last ? await IDB.get(last) : null;
  if (!rec && !fresh && !requested) { const all = (await IDB.all()) || []; all.sort((a, b) => b.updated - a.updated); rec = all[0] || null; }
  if (fresh || (requested && !rec)) {
    await newFile();
    if (requested) toast('That design is no longer in this browser. A new file is ready.');
  }
  else if (rec && rec.nodes && rec.nodes.root) loadDocument(rec);
  else { buildSample(); D.fileId = uid(); layoutAll(); snapshotCommitted(); renderAll(); updateTitle(); requestAnimationFrame(() => { zoomToFit(); saveNow(); }); }
  syncSuiteFileUrl();
  setTool('move');
  collabJoinChannel();
  updatePeersBadge();
  liveBoot();
  const fileIdWatch = { id: D.fileId };
  listeners.change.push(() => { if (fileIdWatch.id !== D.fileId) { fileIdWatch.id = D.fileId; collabJoinChannel(); } });
  setInterval(() => { if (fileIdWatch.id !== D.fileId) { fileIdWatch.id = D.fileId; collabJoinChannel(); } }, 1000);
  // paper.js loads async from the CDN; recompute booleans once it's there
  let tries = 0; const wait = setInterval(() => { if (hasPaper() || ++tries > 40) { clearInterval(wait); if (hasPaper()) { Object.values(D.nodes).forEach(n => { if (n.type === 'BOOLEAN') n.bkey = null; }); silentRelayout(); } } }, 250);
}
document.addEventListener('DOMContentLoaded', init);
