/* ============================================================
   Right panel: design properties, prototype, export; color picker
   ============================================================ */
const MIXED = Symbol('mixed');
function common(ns, get) { if (!ns.length) return MIXED; const v0 = get(ns[0]); const s0 = JSON.stringify(v0); for (let i = 1; i < ns.length; i++) if (JSON.stringify(get(ns[i])) !== s0) return MIXED; return v0; }
const shown = v => v === MIXED ? '' : (typeof v === 'number' ? fmt(v) : (v ?? ''));
const ph = v => v === MIXED ? ' placeholder="Mixed"' : '';
const FRAME_PRESETS = [['Custom', 0, 0], ['iPhone 16', 393, 852], ['iPhone SE', 375, 667], ['Android', 412, 917], ['iPad mini', 744, 1133], ['iPad Pro 11"', 834, 1194], ['MacBook Air', 1280, 832], ['Desktop', 1440, 1024], ['Web 1920', 1920, 1080], ['Slide 16:9', 1920, 1080], ['Instagram post', 1080, 1080], ['Story', 1080, 1920], ['A4', 595, 842], ['Letter', 612, 792], ['Business card', 1050, 600]];
const PROP = {
  x: { get: n => n.x, set: (n, v) => n.x = v, geo: 1 },
  y: { get: n => n.y, set: (n, v) => n.y = v, geo: 1 },
  w: { get: n => n.w, set: (n, v) => { resizeNode(n, Math.max(v, n.type === 'VECTOR' ? 0 : 0.01), n.h); if (n.sizingH !== 'FIXED') n.sizingH = 'FIXED'; }, geo: 1 },
  h: { get: n => n.h, set: (n, v) => { resizeNode(n, n.w, Math.max(v, n.type === 'VECTOR' ? 0 : 0.01)); if (n.sizingV !== 'FIXED') n.sizingV = 'FIXED'; }, geo: 1 },
  rotation: { get: n => -(n.rotation || 0), set: (n, v) => n.rotation = normAngle(-v), geo: 1 },
  cornerRadius: { get: n => n.cornerRadii ? MIXED : (n.cornerRadius || 0), set: (n, v) => { n.cornerRadius = Math.max(0, v); n.cornerRadii = null; } },
  r0: { get: n => (n.cornerRadii || [n.cornerRadius, 0, 0, 0])[0], set: (n, v) => setRadius(n, 0, v), key: 'cornerRadii' },
  r1: { get: n => (n.cornerRadii || [0, n.cornerRadius, 0, 0])[1], set: (n, v) => setRadius(n, 1, v), key: 'cornerRadii' },
  r2: { get: n => (n.cornerRadii || [0, 0, n.cornerRadius, 0])[2], set: (n, v) => setRadius(n, 2, v), key: 'cornerRadii' },
  r3: { get: n => (n.cornerRadii || [0, 0, 0, n.cornerRadius])[3], set: (n, v) => setRadius(n, 3, v), key: 'cornerRadii' },
  opacity: { get: n => round((n.opacity ?? 1) * 100, 1), set: (n, v) => n.opacity = clamp(v / 100, 0, 1), suffix: '%' },
  strokeWidth: { get: n => n.strokeWidth, set: (n, v) => n.strokeWidth = Math.max(0, v) },
  dash: { get: n => Array.isArray(n.strokeDash) ? n.strokeDash[0] : (n.strokeDash || 0), set: (n, v) => n.strokeDash = v > 0 ? [v, Array.isArray(n.strokeDash) ? n.strokeDash[1] || v : v] : 0, key: 'strokeDash' },
  gapDash: { get: n => Array.isArray(n.strokeDash) ? n.strokeDash[1] : 0, set: (n, v) => { const d = Array.isArray(n.strokeDash) ? n.strokeDash[0] : 4; n.strokeDash = [d || 4, Math.max(0, v)]; }, key: 'strokeDash' },
  itemSpacing: { get: n => n.itemSpacing, set: (n, v) => n.itemSpacing = v },
  padH: { get: n => n.padding[1] === n.padding[3] ? n.padding[3] : MIXED, set: (n, v) => { n.padding = [n.padding[0], v, n.padding[2], v]; }, key: 'padding' },
  padV: { get: n => n.padding[0] === n.padding[2] ? n.padding[0] : MIXED, set: (n, v) => { n.padding = [v, n.padding[1], v, n.padding[3]]; }, key: 'padding' },
  padT: { get: n => n.padding[0], set: (n, v) => { n.padding = [v, n.padding[1], n.padding[2], n.padding[3]]; }, key: 'padding' },
  padR: { get: n => n.padding[1], set: (n, v) => { n.padding = [n.padding[0], v, n.padding[2], n.padding[3]]; }, key: 'padding' },
  padB: { get: n => n.padding[2], set: (n, v) => { n.padding = [n.padding[0], n.padding[1], v, n.padding[3]]; }, key: 'padding' },
  padL: { get: n => n.padding[3], set: (n, v) => { n.padding = [n.padding[0], n.padding[1], n.padding[2], v]; }, key: 'padding' },
  fontSize: { get: n => n.fontSize, set: (n, v) => n.fontSize = clamp(v, 1, 2000) },
  letterSpacing: { get: n => n.letterSpacing || 0, set: (n, v) => n.letterSpacing = v },
  pointCount: { get: n => n.pointCount, set: (n, v) => n.pointCount = clamp(Math.round(v), 3, 60) },
  innerRadius: { get: n => round((n.innerRadius ?? 0.38) * 100, 1), set: (n, v) => n.innerRadius = clamp(v / 100, 0.01, 1), suffix: '%' },
};
function setRadius(n, i, v) { const r = n.cornerRadii ? n.cornerRadii.slice() : [n.cornerRadius || 0, n.cornerRadius || 0, n.cornerRadius || 0, n.cornerRadius || 0]; r[i] = Math.max(0, v); n.cornerRadii = r; }
const propKey = p => PROP[p]?.key || p;
function applyNumProp(p, raw, live) {
  const def = PROP[p]; if (!def) return;
  const ns = panelNodes(); if (!ns.length) return;
  ns.forEach(n => {
    if (def.geo && (inAuto(n) && (p === 'x' || p === 'y'))) return;
    if (def.geo && n.mainRef && p !== 'rotation') return;
    const cur = def.get(n); const v = evalNum(raw, cur === MIXED ? 0 : cur);
    if (v === null) return;
    def.set(n, v); markOverride(n, propKey(p));
  });
  if (live) { layoutAll(); renderLive(); } else commit('Change ' + p);
}
function panelNodes() { return D.sel.map(N).filter(Boolean); }
const commitSoon = debounce((label) => commit(label), 380);

/* ---------- builders ---------- */
const sec = (title, body, acts = '', cls = '') => `<section class="sec ${cls}"><header><span class="st">${title}</span><span class="sa">${acts}</span></header>${body}</section>`;
const ib = (act, arg, icon, title, on) => `<button class="ib${on ? ' on' : ''}" data-act="${act}"${arg !== undefined ? ` data-arg="${esc(arg)}"` : ''} title="${esc(title)}">${icon}</button>`;
function num(p, label, ns, opts = {}) {
  const v = common(ns, PROP[p].get);
  const dis = opts.disabled ? ' disabled' : '';
  return `<label class="nf${opts.wide ? ' wide' : ''}${dis ? ' dis' : ''}" title="${esc(opts.title || '')}"><span class="nl" data-scrub="${p}">${label}</span><input class="num" id="p-${p}" data-p="${p}" value="${shown(v)}${v !== MIXED && PROP[p].suffix ? PROP[p].suffix : ''}"${ph(v)}${dis} inputmode="decimal" autocomplete="off" spellcheck="false"></label>`;
}
function sel_(id, key, options, value, cls = '') {
  return `<select id="s-${id}" data-sel="${key}" class="${cls}">${value === MIXED ? '<option value="" selected disabled>Mixed</option>' : ''}${options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
}
const AL_ICONS = {
  left: '<svg viewBox="0 0 24 24"><path d="M4 3v18" stroke="currentColor" stroke-width="1.6"/><rect x="7" y="6" width="12" height="4" rx="1" fill="currentColor"/><rect x="7" y="14" width="7" height="4" rx="1" fill="currentColor"/></svg>',
  hcenter: '<svg viewBox="0 0 24 24"><path d="M12 3v18" stroke="currentColor" stroke-width="1.6"/><rect x="5" y="6" width="14" height="4" rx="1" fill="currentColor"/><rect x="8" y="14" width="8" height="4" rx="1" fill="currentColor"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M20 3v18" stroke="currentColor" stroke-width="1.6"/><rect x="5" y="6" width="12" height="4" rx="1" fill="currentColor"/><rect x="10" y="14" width="7" height="4" rx="1" fill="currentColor"/></svg>',
  top: '<svg viewBox="0 0 24 24"><path d="M3 4h18" stroke="currentColor" stroke-width="1.6"/><rect x="6" y="7" width="4" height="12" rx="1" fill="currentColor"/><rect x="14" y="7" width="4" height="7" rx="1" fill="currentColor"/></svg>',
  vcenter: '<svg viewBox="0 0 24 24"><path d="M3 12h18" stroke="currentColor" stroke-width="1.6"/><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="8" width="4" height="8" rx="1" fill="currentColor"/></svg>',
  bottom: '<svg viewBox="0 0 24 24"><path d="M3 20h18" stroke="currentColor" stroke-width="1.6"/><rect x="6" y="5" width="4" height="12" rx="1" fill="currentColor"/><rect x="14" y="10" width="4" height="7" rx="1" fill="currentColor"/></svg>',
  disth: '<svg viewBox="0 0 24 24"><path d="M3 4v16M21 4v16" stroke="currentColor" stroke-width="1.6"/><rect x="9" y="7" width="6" height="10" rx="1" fill="currentColor"/></svg>',
  distv: '<svg viewBox="0 0 24 24"><path d="M4 3h16M4 21h16" stroke="currentColor" stroke-width="1.6"/><rect x="7" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg>',
  tl: '<svg viewBox="0 0 24 24"><path d="M4 12h3M12 4v3M4 7a3 3 0 013-3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  corners: '<svg viewBox="0 0 24 24"><path d="M4 9V6a2 2 0 012-2h3M15 4h3a2 2 0 012 2v3M20 15v3a2 2 0 01-2 2h-3M9 20H6a2 2 0 01-2-2v-3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  styles: '<svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="2.2" fill="currentColor"/><circle cx="17" cy="7" r="2.2" fill="currentColor"/><circle cx="7" cy="17" r="2.2" fill="currentColor"/><circle cx="17" cy="17" r="2.2" fill="currentColor"/></svg>',
  detach: '<svg viewBox="0 0 24 24"><path d="M9 7l-2.5-2.5M15 17l2.5 2.5M7 12H3M21 12h-4M12 7V3M12 21v-4" stroke="currentColor" stroke-width="1.6"/></svg>',
  flipH: '<svg viewBox="0 0 24 24"><path d="M12 3v18" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 2"/><path d="M9 6L3 18h6zM15 6l6 12h-6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  clip: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 14h16" stroke="currentColor" stroke-width="1.6"/></svg>',
};
function paintCSS(p) {
  if (!p) return 'transparent';
  if (p.type === 'SOLID') return rgba(p.color, p.opacity ?? 1);
  if (p.type === 'LINEAR') return `linear-gradient(${(p.angle ?? 90) + 90}deg, ${(p.stops || []).map(s => `${rgba(s.color, (s.opacity ?? 1) * (p.opacity ?? 1))} ${s.pos * 100}%`).join(',')})`;
  if (p.type === 'RADIAL') return `radial-gradient(${(p.stops || []).map(s => `${rgba(s.color, (s.opacity ?? 1) * (p.opacity ?? 1))} ${s.pos * 100}%`).join(',')})`;
  if (p.type === 'IMAGE') { const im = D.images[p.imageRef]; return im ? `center/cover url('${im.url || im.data}')` : '#ccc'; }
  return 'transparent';
}
function paintRows(ns, key) {
  const arrs = ns.map(n => n[key] || []);
  const same = common(ns, n => n[key] || []);
  const styleKey = key === 'fills' ? 'fillStyle' : 'strokeStyle';
  const sid = common(ns, n => n[styleKey] || null);
  const styles = root().styles || {};
  if (sid !== MIXED && sid && styles[sid]) {
    const st = styles[sid];
    return `<div class="prow2 stylechip"><span class="swatch sm" style="--c:${paintCSS(st.paints[st.paints.length - 1])}"></span><span class="stname">${esc(st.name)}</span>${ib('detachStyle', key, AL_ICONS.detach, 'Detach style')}</div>`;
  }
  if (same === MIXED) return `<div class="hint">Mixed ${key === 'fills' ? 'fills' : 'strokes'} — click + to replace them all</div>`;
  const list = arrs[0];
  if (!list.length) return '';
  return list.map((p, i) => ({ p, i })).reverse().map(({ p, i }) => {
    const label = p.type === 'SOLID' ? `<input class="hex" id="hx-${key}-${i}" data-hex="${key}:${i}" value="${p.color.replace('#', '')}" maxlength="7" spellcheck="false" autocomplete="off">` : `<span class="ptype" data-pick="${key}:${i}">${{ LINEAR: 'Linear', RADIAL: 'Radial', IMAGE: 'Image' }[p.type]}</span>`;
    return `<div class="prow2${p.visible === false ? ' off' : ''}"><button class="swatch" data-pick="${key}:${i}" style="--c:${paintCSS(p)}" title="Edit paint"></button>${label}<input class="pct" id="po-${key}-${i}" data-pop="${key}:${i}" value="${fmt(round((p.opacity ?? 1) * 100, 1))}%" spellcheck="false" autocomplete="off">${ib('togglePaint', key + ':' + i, p.visible === false ? ICONS.eyeOff : ICONS.eye, 'Show/hide')}${ib('removePaint', key + ':' + i, ICONS.minus, 'Remove')}</div>`;
  }).join('');
}
function selectionColors(ns) {
  const map = new Map();
  const visit = n => { [...(n.fills || []), ...(n.strokes || [])].forEach(p => { if (p.type === 'SOLID' && p.visible !== false) map.set(p.color, (map.get(p.color) || 0) + 1); }); kids(n).forEach(visit); };
  ns.forEach(n => kids(n).forEach(visit));
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(e => e[0]);
}
function renderPanel() {
  const right = $('#right');
  if (right.contains(document.activeElement) && document.activeElement.matches('input,textarea,select')) { refreshPanelValues(); UI.panelStale = true; return; }
  UI.panelStale = false;
  $$('#right [data-rtab]').forEach(b => b.classList.toggle('on', b.dataset.rtab === UI.rtab));
  const pane = $('#designPane');
  const st = pane.scrollTop;
  pane.innerHTML = UI.rtab === 'prototype' ? protoHTML() : designHTML();
  pane.scrollTop = st;
}
function refreshPanelValues() {
  const ns = panelNodes();
  $$('#designPane input.num[data-p]').forEach(inp => {
    if (inp === document.activeElement) return;
    const p = inp.dataset.p; const v = common(ns, PROP[p].get);
    inp.value = v === MIXED ? '' : fmt(v) + (PROP[p].suffix || '');
  });
}
function designHTML() {
  const ns = panelNodes();
  if (!ns.length) return pageHTML();
  const one = ns.length === 1 ? ns[0] : null;
  const allType = t => ns.every(n => n.type === t);
  let html = '';
  // header: component / instance
  if (one && one.type === 'INSTANCE' && !one.mainRef) {
    const m = N(one.componentId);
    html += sec(`${ICONS.instance}<span>${esc(m ? m.name : 'Missing component')}</span>`, `<div class="row btns">${ib('goMain', '', ICONS.component, 'Go to main component')}<button class="tb" data-act="detach">Detach</button><button class="tb" data-act="resetOv"${(one.overrides || []).length || descendants(one).some(d => (d.overrides || []).length) ? '' : ' disabled'}>Reset overrides</button></div>`, '', 'compsec');
  } else if (one && one.type === 'COMPONENT') {
    const count = Object.values(D.nodes).filter(n => n.type === 'INSTANCE' && n.componentId === one.id).length;
    html += sec(`${ICONS.component}<span>Main component</span>`, `<textarea id="compDesc" data-desc="${one.id}" rows="2" placeholder="Describe when to use this component">${esc(one.description || '')}</textarea><div class="hint">${count} instance${count === 1 ? '' : 's'} in this file</div>`, '', 'compsec');
  } else if (one && one.mainRef) {
    html += `<div class="note">Part of an instance — size and position follow the main component. Fills, text and visibility can be overridden.</div>`;
  }
  // alignment
  html += `<div class="alignrow">${['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom'].map(d => ib('align', d, AL_ICONS[d], 'Align ' + d)).join('')}${ib('dist', 'h', AL_ICONS.disth, 'Distribute horizontal spacing')}${ib('dist', 'v', AL_ICONS.distv, 'Distribute vertical spacing')}</div>`;
  // frame presets
  let body = '';
  const topFrame = one && isFrameLike(one) && parentOf(one)?.type === 'PAGE';
  if (topFrame) body += `<div class="row">${sel_('preset', 'preset', FRAME_PRESETS.map(([l, w, hh]) => [l, l + (w ? `  ${w}×${hh}` : '')]), (FRAME_PRESETS.find(([l, w, hh]) => w === round(one.w) && hh === round(one.h)) || ['Custom'])[0], 'wide')}</div>`;
  const auto = ns.some(inAuto);
  body += `<div class="grid2">${num('x', 'X', ns, { disabled: auto || ns.some(n => n.mainRef) })}${num('y', 'Y', ns, { disabled: auto || ns.some(n => n.mainRef) })}${num('w', 'W', ns, { disabled: ns.some(n => n.mainRef) })}${num('h', 'H', ns, { disabled: ns.some(n => n.mainRef) })}</div>`;
  // sizing
  const sizable = ns.every(n => isAuto(n) || inAuto(n) || n.type === 'TEXT');
  if (sizable) {
    const optsFor = axis => { const o = [['FIXED', 'Fixed']]; if (ns.every(n => isAuto(n) || n.type === 'TEXT')) o.push(['HUG', 'Hug']); if (ns.every(inAuto)) o.push(['FILL', 'Fill']); return o; };
    body += `<div class="grid2 sizing"><label class="sl"><span>W</span>${sel_('sizingH', 'sizingH', optsFor('h'), common(ns, n => n.sizingH))}</label><label class="sl"><span>H</span>${sel_('sizingV', 'sizingV', optsFor('v'), common(ns, n => n.sizingV))}</label></div>`;
  }
  body += `<div class="grid2">${num('rotation', '<svg viewBox="0 0 24 24"><path d="M5 19h14M5 19L15 6" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M10 19a6 6 0 00-1.6-4" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>', ns, { title: 'Rotation' })}`;
  const radiusable = ns.every(n => n.type === 'RECT' || isFrameLike(n));
  if (radiusable) body += num('cornerRadius', AL_ICONS.tl, ns, { title: 'Corner radius' });
  body += `</div>`;
  if (radiusable) {
    const indep = ns.some(n => n.cornerRadii);
    body += `<div class="row tight">${ib('indepCorners', '', AL_ICONS.corners, 'Independent corners', indep)}${ns.some(isFrameLike) ? `<label class="chk"><input type="checkbox" id="c-clip" data-chk="clipsContent"${common(ns, n => !!n.clipsContent) === true ? ' checked' : ''}> Clip content</label>` : ''}${ib('flip', 'h', AL_ICONS.flipH, `Flip horizontal (${SHIFT}H)`)}</div>`;
    if (indep) body += `<div class="grid4">${num('r0', '↖', ns)}${num('r1', '↗', ns)}${num('r2', '↘', ns)}${num('r3', '↙', ns)}</div>`;
  } else body += `<div class="row tight">${ib('flip', 'h', AL_ICONS.flipH, `Flip horizontal (${SHIFT}H)`)}${ib('flip', 'v', '<svg viewBox="0 0 24 24" style="transform:rotate(90deg)"><path d="M12 3v18" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 2"/><path d="M9 6L3 18h6zM15 6l6 12h-6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>', `Flip vertical (${SHIFT}V)`)}</div>`;
  if (ns.every(inAuto)) body += `<div class="row tight"><label class="chk"><input type="checkbox" id="c-abs" data-chk="absolute"${common(ns, n => !!n.absolute) === true ? ' checked' : ''}> Ignore auto layout (absolute)</label></div>`;
  const title = one ? (TYPE_LABEL[one.type] || one.type) : `${ns.length} layers`;
  html += sec(title, body, '', 'layout');
  // constraints
  const pcon = ns.every(n => { const p = parentOf(n); return p && isFrameLike(p) && (!isAuto(p) || n.absolute); });
  if (pcon) {
    html += sec('Constraints', `<div class="grid2"><label class="sl"><span>↔</span>${sel_('conH', 'conH', [['LEFT', 'Left'], ['RIGHT', 'Right'], ['LEFT_RIGHT', 'Left & right'], ['CENTER', 'Center'], ['SCALE', 'Scale']], common(ns, n => n.constraints?.h || 'LEFT'))}</label><label class="sl"><span>↕</span>${sel_('conV', 'conV', [['TOP', 'Top'], ['BOTTOM', 'Bottom'], ['TOP_BOTTOM', 'Top & bottom'], ['CENTER', 'Center'], ['SCALE', 'Scale']], common(ns, n => n.constraints?.v || 'TOP'))}</label></div>`);
  }
  // auto layout
  const frames = ns.filter(isFrameLike);
  if (frames.length === ns.length && !ns.some(n => n.mainRef)) {
    const al = common(ns, n => n.layoutMode || 'NONE');
    if (al === 'NONE') html += sec('Auto layout', '', ib('addAL', '', ICONS.plus, `Add auto layout (${SHIFT}A)`), 'collapsed');
    else {
      const H = al === 'HORIZONTAL';
      const pa = common(ns, n => n.primaryAlign), ca = common(ns, n => n.counterAlign);
      const between = pa === 'SPACE_BETWEEN';
      const cells = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const prim = ['MIN', 'CENTER', 'MAX'][H ? c : r], cnt = ['MIN', 'CENTER', 'MAX'][H ? r : c];
        const on = (pa === prim || (between && false)) && ca === cnt;
        const crossOn = between && ca === cnt;
        cells.push(`<button class="alcell${on ? ' on' : ''}${crossOn ? ' between' : ''}" data-act="alAlign" data-arg="${prim}:${cnt}" title="${prim.toLowerCase()} / ${cnt.toLowerCase()}"><i></i></button>`);
      }
      const sides = UI.padSides;
      html += sec('Auto layout', `<div class="algrid"><div class="aldir">${ib('alDir', 'HORIZONTAL', ICONS.autoH, 'Horizontal', H)}${ib('alDir', 'VERTICAL', ICONS.autoV, 'Vertical', !H)}</div><div class="alcells${H ? ' h' : ' v'}">${cells.join('')}</div><div class="alnums">${between ? `<label class="nf"><span class="nl">${H ? '↔' : '↕'}</span><input class="num" value="Auto" disabled></label>` : num('itemSpacing', H ? '↔' : '↕', ns, { title: 'Gap between items' })}<label class="chk"><input type="checkbox" id="c-between" data-chk="between"${between ? ' checked' : ''}> Space between</label></div></div>`
        + (sides ? `<div class="grid4">${num('padT', 'T', ns)}${num('padR', 'R', ns)}${num('padB', 'B', ns)}${num('padL', 'L', ns)}</div>` : `<div class="grid2 withbtn">${num('padH', '|↔|', ns, { title: 'Horizontal padding' })}${num('padV', '⊤⊥', ns, { title: 'Vertical padding' })}</div>`)
        + `<div class="row tight">${ib('padSides', '', AL_ICONS.settings, 'Padding per side', sides)}</div>`,
        ib('removeAL', '', ICONS.minus, `Remove auto layout (${SHIFT}${ALT}A)`));
    }
  }
  // polygon / star
  if (ns.every(n => n.type === 'POLYGON' || n.type === 'STAR')) html += sec(ns.every(n => n.type === 'STAR') ? 'Star' : 'Polygon', `<div class="grid2">${num('pointCount', '#', ns, { title: 'Points' })}${ns.every(n => n.type === 'STAR') ? num('innerRadius', '◌', ns, { title: 'Inner radius ratio' }) : ''}</div>`);
  // boolean
  if (ns.every(n => n.type === 'BOOLEAN')) html += sec('Boolean', `<div class="seg">${['UNION', 'SUBTRACT', 'INTERSECT', 'EXCLUDE'].map(o => `<button class="tb${common(ns, n => n.booleanOp) === o ? ' on' : ''}" data-act="boolOp" data-arg="${o}">${BOOL_NAMES[o]}</button>`).join('')}</div>`);
  if (one && one.type === 'VECTOR' && !one.mainRef) html += `<div class="row pad"><button class="tb wide" data-act="editPath">Edit path <kbd>Enter</kbd></button></div>`;
  // layer
  const blendOpts = [['PASS_THROUGH', 'Pass through'], ['NORMAL', 'Normal'], ['MULTIPLY', 'Multiply'], ['SCREEN', 'Screen'], ['OVERLAY', 'Overlay'], ['DARKEN', 'Darken'], ['LIGHTEN', 'Lighten'], ['COLOR_DODGE', 'Color dodge'], ['COLOR_BURN', 'Color burn'], ['HARD_LIGHT', 'Hard light'], ['SOFT_LIGHT', 'Soft light'], ['DIFFERENCE', 'Difference'], ['EXCLUSION', 'Exclusion'], ['HUE', 'Hue'], ['SATURATION', 'Saturation'], ['COLOR', 'Color'], ['LUMINOSITY', 'Luminosity']];
  html += sec('Layer', `<div class="grid2">${sel_('blend', 'blendMode', blendOpts, common(ns, n => n.blendMode || 'NORMAL'))}${num('opacity', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 4.5a7.5 7.5 0 010 15z" fill="currentColor"/></svg>', ns, { title: 'Opacity' })}</div>${ns.some(n => n.isMask) || ns.length > 1 || (one && one.type !== 'GROUP') ? '' : ''}${one && one.isMask ? '<div class="hint">This layer masks the layers above it in its group.</div>' : ''}`);
  // text
  if (ns.every(n => n.type === 'TEXT')) html += textHTML(ns);
  // fills (not groups)
  if (!ns.some(n => n.type === 'GROUP')) {
    html += sec('Fill', paintRows(ns, 'fills'), ib('styleMenu', 'fills', AL_ICONS.styles, 'Color styles') + ib('addPaint', 'fills', ICONS.plus, 'Add fill'), (ns[0].fills || []).length ? '' : 'collapsed');
    const strokeBody = paintRows(ns, 'strokes');
    let sx = '';
    if (common(ns, n => (n.strokes || []).length) !== 0) {
      const open = ns.some(n => n.type === 'VECTOR' && n.paths?.some(sp => !sp.closed));
      sx = `<div class="grid2">${num('strokeWidth', '<svg viewBox="0 0 24 24"><path d="M4 6h16" stroke="currentColor" stroke-width="1"/><path d="M4 11h16" stroke="currentColor" stroke-width="2"/><path d="M4 17h16" stroke="currentColor" stroke-width="3.2"/></svg>', ns, { title: 'Stroke weight' })}${open ? '<span></span>' : sel_('salign', 'strokeAlign', [['INSIDE', 'Inside'], ['CENTER', 'Center'], ['OUTSIDE', 'Outside']], common(ns, n => n.strokeAlign))}</div>`
        + `<div class="grid2">${num('dash', 'Dash', ns, { title: 'Dash length (0 = solid)' })}${num('gapDash', 'Gap', ns, { title: 'Gap length' })}</div>`
        + `<div class="grid2">${sel_('scap', 'strokeCap', [['NONE', 'Butt cap'], ['ROUND', 'Round cap'], ['SQUARE', 'Square cap']], common(ns, n => n.strokeCap || 'NONE'))}${sel_('sjoin', 'strokeJoin', [['MITER', 'Miter join'], ['ROUND', 'Round join'], ['BEVEL', 'Bevel join']], common(ns, n => n.strokeJoin || 'MITER'))}</div>`;
      if (open) { const ends = [['NONE', 'None'], ['ARROW_LINES', 'Line arrow'], ['TRIANGLE', 'Triangle arrow'], ['CIRCLE', 'Circle']]; sx += `<div class="grid2"><label class="sl"><span>Start</span>${sel_('startCap', 'startCap', ends, common(ns, n => n.startCap || 'NONE'))}</label><label class="sl"><span>End</span>${sel_('endCap', 'endCap', ends, common(ns, n => n.endCap || 'NONE'))}</label></div>`; }
    }
    html += sec('Stroke', strokeBody + sx, ib('styleMenu', 'strokes', AL_ICONS.styles, 'Color styles') + ib('addPaint', 'strokes', ICONS.plus, 'Add stroke'), (ns[0].strokes || []).length ? '' : 'collapsed');
  }
  // selection colors
  if (ns.some(n => n.children && n.children.length)) {
    const cols = selectionColors(ns);
    if (cols.length) html += sec('Selection colors', `<div class="selcols">${cols.map(c => `<button class="swatch" data-selcol="${c}" style="--c:${c}" title="${c}"></button>`).join('')}</div>`);
  }
  // effects
  html += sec('Effects', effectsHTML(ns), ib('addEffect', '', ICONS.plus, 'Add effect'), common(ns, n => (n.effects || []).length) === 0 ? 'collapsed' : '');
  // mask
  if (one && !one.mainRef && parentOf(one)?.type !== 'PAGE' || one?.isMask) html += `<div class="row pad"><label class="chk"><input type="checkbox" id="c-mask" data-chk="isMask"${one.isMask ? ' checked' : ''}> Use as mask for layers above</label></div>`;
  // export
  html += exportHTML(ns);
  return html;
}
function textHTML(ns) {
  const fam = common(ns, n => n.fontFamily), w = common(ns, n => n.fontWeight), it = common(ns, n => !!n.italic);
  const weights = fam === MIXED ? [400, 700] : fontWeights(fam);
  const lh = common(ns, n => n.lineHeight || { u: 'AUTO' });
  const lhStr = lh === MIXED ? '' : lh.u === 'AUTO' ? 'Auto' : lh.u === '%' ? fmt(lh.v) + '%' : fmt(lh.v);
  const ta = common(ns, n => n.textAlign), va = common(ns, n => n.verticalAlign), deco = common(ns, n => n.textDecoration), cs = common(ns, n => n.textCase);
  const mode = common(ns, n => n.sizingH === 'HUG' ? 'AUTO_W' : n.sizingV === 'HUG' ? 'AUTO_H' : 'FIXED');
  const tbtn = (act, arg, label, on, title) => `<button class="tb sm${on ? ' on' : ''}" data-act="${act}" data-arg="${arg}" title="${title}">${label}</button>`;
  const tsid = common(ns, n => n.textStyle || null); const tst = tsid && tsid !== MIXED ? (root().styles || {})[tsid] : null;
  return sec('Text', (tst ? `<div class="prow2 stylechip"><span class="ic">Aa</span><span class="stname">${esc(tst.name)}</span>${ib('detachTextStyle', '', AL_ICONS.detach, 'Detach text style')}</div>` : '')
    + `<div class="row"><button class="fontbtn" data-act="fontPicker" style="font-family:'${fam === MIXED ? 'inherit' : esc(fam)}', var(--ui)">${fam === MIXED ? 'Mixed' : esc(fam)}</button></div>`
    + `<div class="grid2">${sel_('weight', 'fontWeight', weights.map(x => [String(x), WEIGHT_NAMES[x] || x]), w === MIXED ? MIXED : String(w))}${num('fontSize', 'Size', ns)}</div>`
    + `<div class="grid2"><label class="nf"><span class="nl" title="Line height">↕A</span><input class="num" id="p-lh" data-lh="1" value="${lhStr}"${lh === MIXED ? ' placeholder="Mixed"' : ''} spellcheck="false" autocomplete="off"></label>${num('letterSpacing', '|A|', ns, { title: 'Letter spacing' })}</div>`
    + `<div class="row seg">${tbtn('tAlign', 'LEFT', '⟸', ta === 'LEFT', 'Align left')}${tbtn('tAlign', 'CENTER', '⇔', ta === 'CENTER', 'Align center')}${tbtn('tAlign', 'RIGHT', '⟹', ta === 'RIGHT', 'Align right')}<span class="sp"></span>${tbtn('vAlign', 'TOP', '⤒', va === 'TOP', 'Top')}${tbtn('vAlign', 'CENTER', '↕', va === 'CENTER', 'Middle')}${tbtn('vAlign', 'BOTTOM', '⤓', va === 'BOTTOM', 'Bottom')}</div>`
    + `<div class="row seg">${tbtn('tItalic', '', '<i>I</i>', it === true, 'Italic')}${tbtn('tDeco', 'UNDERLINE', '<u>U</u>', deco === 'UNDERLINE', 'Underline')}${tbtn('tDeco', 'STRIKETHROUGH', '<s>S</s>', deco === 'STRIKETHROUGH', 'Strikethrough')}<span class="sp"></span>${tbtn('tCase', 'UPPER', 'AG', cs === 'UPPER', 'Uppercase')}${tbtn('tCase', 'LOWER', 'ag', cs === 'LOWER', 'Lowercase')}${tbtn('tCase', 'TITLE', 'Ag', cs === 'TITLE', 'Title case')}</div>`
    + `<div class="row seg">${tbtn('tMode', 'AUTO_W', 'Auto width', mode === 'AUTO_W', 'Grow to fit text')}${tbtn('tMode', 'AUTO_H', 'Auto height', mode === 'AUTO_H', 'Fixed width, grow down')}${tbtn('tMode', 'FIXED', 'Fixed', mode === 'FIXED', 'Fixed size')}</div>`,
    ib('textStyleMenu', '', AL_ICONS.styles, 'Text styles'));
}
function effectsHTML(ns) {
  const same = common(ns, n => n.effects || []);
  if (same === MIXED) return `<div class="hint">Mixed effects — click + to replace them all</div>`;
  return same.map((e, i) => {
    const open = UI.openEffect === i;
    const types = [['DROP_SHADOW', 'Drop shadow'], ['INNER_SHADOW', 'Inner shadow'], ['LAYER_BLUR', 'Layer blur']];
    let s = `<div class="prow2${e.visible === false ? ' off' : ''}">${ib('effOpen', i, AL_ICONS.settings, 'Effect settings', open)}${sel_('eff' + i, 'effType:' + i, types, e.type)}${ib('effToggle', i, e.visible === false ? ICONS.eyeOff : ICONS.eye, 'Show/hide')}${ib('effRemove', i, ICONS.minus, 'Remove')}</div>`;
    if (open) {
      const f = (k, l) => `<label class="nf"><span class="nl">${l}</span><input class="num" id="ef-${i}-${k}" data-eff="${i}:${k}" value="${fmt(e[k] || 0)}" autocomplete="off"></label>`;
      s += e.type === 'LAYER_BLUR' ? `<div class="grid2 effp">${f('blur', 'Blur')}</div>` : `<div class="grid2 effp">${f('x', 'X')}${f('y', 'Y')}${f('blur', 'Blur')}${f('spread', 'Spread')}</div><div class="prow2 effp"><button class="swatch" data-pick="effect:${i}" style="--c:${rgba(e.color, e.opacity ?? 0.25)}"></button><input class="hex" id="eh-${i}" data-effhex="${i}" value="${(e.color || '#000000').replace('#', '')}" spellcheck="false"><input class="pct" id="eo-${i}" data-effop="${i}" value="${fmt(round((e.opacity ?? 0.25) * 100, 1))}%"></div>`;
    }
    return s;
  }).join('');
}
function exportHTML(ns) {
  const one = ns.length === 1 ? ns[0] : null;
  const ex = one ? (one.exportSettings || []) : [];
  const rows = ex.map((s, i) => `<div class="prow2">${sel_('exs' + i, 'exScale:' + i, [['0.5', '0.5x'], ['1', '1x'], ['2', '2x'], ['3', '3x'], ['4', '4x']], String(s.scale))}${sel_('exf' + i, 'exFormat:' + i, [['PNG', 'PNG'], ['JPG', 'JPG'], ['SVG', 'SVG'], ['HTML', 'HTML + CSS'], ['JSON', 'Spec JSON']], s.format)}${ib('exRemove', i, ICONS.minus, 'Remove')}</div>`).join('');
  const label = one ? esc(one.name) : `${ns.length} layers`;
  return sec('Export', rows + `<div class="row pad"><button class="tb wide" data-act="exportSel">Export ${label}</button></div>`, ib('exAdd', '', ICONS.plus, 'Add export setting'));
}
function pageHTML() {
  const p = pageNode(); const styles = Object.values(root().styles || {});
  const cs = styles.filter(s => s.type === 'COLOR'), ts = styles.filter(s => s.type === 'TEXT');
  let html = sec('Page', `<div class="prow2"><button class="swatch" data-pick="pageBg" style="--c:${p.bg}"></button><input class="hex" id="pgbg" data-pagebg="1" value="${(p.bg || '#F2F3F5').replace('#', '')}" spellcheck="false"><span class="hint">Canvas background</span></div>`);
  html += sec('Color styles', cs.length ? cs.map(s => `<div class="prow2 stylerow"><button class="swatch" data-pick="style:${s.id}" style="--c:${paintCSS(s.paints[s.paints.length - 1])}"></button><input class="sname" id="sn-${s.id}" data-sname="${s.id}" value="${esc(s.name)}" spellcheck="false">${ib('delStyle', s.id, ICONS.minus, 'Delete style')}</div>`).join('') : `<div class="hint">Save a color as a style to reuse it and change it everywhere at once.</div>`, ib('addColorStyle', '', ICONS.plus, 'New color style'));
  html += sec('Text styles', ts.length ? ts.map(s => `<div class="prow2 stylerow"><span class="ic" style="font-family:'${esc(s.props.fontFamily)}';font-weight:${s.props.fontWeight}">Ag</span><input class="sname" id="sn-${s.id}" data-sname="${s.id}" value="${esc(s.name)}" spellcheck="false"><span class="hint mono">${fmt(s.props.fontSize)}</span>${ib('delStyle', s.id, ICONS.minus, 'Delete style')}</div>`).join('') : `<div class="hint">Select a text layer and choose “Create style” from the text styles menu.</div>`);
  html += `<div class="note">Select a layer to see its properties. Hold ${ALT.replace('+', '')} while hovering to measure distances.</div>`;
  return html;
}
function protoHTML() {
  const ns = panelNodes(); const page = pageNode();
  const frames = kids(page).filter(isFrameLike);
  if (!ns.length) {
    const start = page.flowStart && N(page.flowStart) ? page.flowStart : frames[0]?.id;
    return sec('Flow starting point', frames.length ? `<div class="row">${sel_('flowStart', 'flowStart', frames.map(f => [f.id, f.name]), start)}</div><div class="row pad"><button class="tb wide primary" data-act="present">${ICONS.play} Present</button></div>` : `<div class="hint">Add a frame to this page to build a prototype.</div>`)
      + `<div class="note">Select a layer, then drag the ◯ handle on its right edge onto a frame to link them. Interactions run on click in Present mode.</div>`;
  }
  if (ns.length > 1) return `<div class="note">Select a single layer to edit its interactions.</div>`;
  const n = ns[0];
  const rs = n.reactions || [];
  const destOpts = [['', 'None'], ...frames.filter(f => f.id !== topLevelFrameOf(n)?.id).map(f => [f.id, f.name]), ['__back', 'Back']];
  const trans = [['INSTANT', 'Instant'], ['DISSOLVE', 'Dissolve'], ['SLIDE_LEFT', 'Slide in ←'], ['SLIDE_RIGHT', 'Slide in →'], ['SLIDE_UP', 'Slide in ↑'], ['PUSH_LEFT', 'Push ←'], ['PUSH_RIGHT', 'Push →']];
  return sec('Interactions', rs.map((r, i) => `<div class="iact"><div class="row"><span class="hint">On click</span>${ib('rmReaction', i, ICONS.minus, 'Remove interaction')}</div><label class="sl wide"><span>Navigate to</span>${sel_('rd' + i, 'rDest:' + i, destOpts, r.action === 'BACK' ? '__back' : r.dest || '')}</label><div class="grid2"><label class="sl"><span>Anim</span>${sel_('rt' + i, 'rTrans:' + i, trans, r.transition || 'INSTANT')}</label><label class="nf"><span class="nl">ms</span><input class="num" id="rms-${i}" data-rms="${i}" value="${r.duration ?? 300}"></label></div></div>`).join('') || `<div class="hint">No interactions. Click + or drag the handle on the canvas.</div>`, ib('addReaction', '', ICONS.plus, 'Add interaction'))
    + `<div class="row pad"><button class="tb wide primary" data-act="present">${ICONS.play} Present</button></div>`;
}

/* ---------- panel events ---------- */
function eachSel(fn, key) { panelNodes().forEach(n => { fn(n); if (key) markOverride(n, key); }); }
function paintTarget(spec) { const [key, i] = spec.split(':'); return { key, i: +i }; }
function initPanel() {
  const right = $('#right');
  $$('#right [data-rtab]').forEach(b => b.addEventListener('click', () => { UI.rtab = b.dataset.rtab; D.mode = UI.rtab === 'prototype' ? 'prototype' : 'design'; renderAll(); }));
  right.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('input')) { e.target.dispatchEvent(new Event('change', { bubbles: true })); if (!e.target.matches('.sname')) e.target.select(); }
    if (e.key === 'Escape' && e.target.matches('input,textarea')) e.target.blur();
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.target.matches('input.num[data-p]')) {
      e.preventDefault(); const p = e.target.dataset.p; const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
      const ns = panelNodes(); ns.forEach(n => { const v = PROP[p].get(n); if (v !== MIXED) { PROP[p].set(n, v + step); markOverride(n, propKey(p)); } });
      commit('Change ' + p); refreshPanelValues();
    }
    e.stopPropagation();
  });
  right.addEventListener('focusout', () => setTimeout(() => { if (UI.panelStale && !right.contains(document.activeElement)) renderPanel(); }, 0));
  right.addEventListener('change', e => {
    const t = e.target, d = t.dataset;
    if (d.p) return applyNumProp(d.p, t.value.replace('%', ''));
    if (d.lh) { const v = t.value.trim().toLowerCase(); let lh; if (!v || v === 'auto') lh = { u: 'AUTO', v: 0 }; else if (v.endsWith('%')) lh = { u: '%', v: parseFloat(v) }; else { const x = evalNum(v); if (x === null) return renderPanel(); lh = { u: 'PX', v: x }; } eachSel(n => n.lineHeight = lh, 'lineHeight'); return commit('Line height'); }
    if (d.sel) return applySelect(d.sel, t.value);
    if (d.chk) return applyCheck(d.chk, t.checked);
    if (d.hex) { const { key, i } = paintTarget(d.hex); const hx = normHex(t.value); if (!hx) return renderPanel(); eachSel(n => { const p = n[key]?.[i]; if (p && p.type === 'SOLID') { p.color = hx; delete n[key === 'fills' ? 'fillStyle' : 'strokeStyle']; } }, key); return commit('Change color'); }
    if (d.pop) { const { key, i } = paintTarget(d.pop); const v = evalNum(t.value.replace('%', '')); if (v === null) return renderPanel(); eachSel(n => { const p = n[key]?.[i]; if (p) p.opacity = clamp(v / 100, 0, 1); }, key); return commit('Change opacity'); }
    if (d.eff) { const [i, k] = d.eff.split(':'); const v = evalNum(t.value); if (v === null) return renderPanel(); eachSel(n => { const ef = n.effects?.[+i]; if (ef) ef[k] = k === 'blur' ? Math.max(0, v) : v; }, 'effects'); return commit('Change effect'); }
    if (d.effhex) { const hx = normHex(t.value); if (!hx) return renderPanel(); eachSel(n => { const ef = n.effects?.[+d.effhex]; if (ef) ef.color = hx; }, 'effects'); return commit('Change effect'); }
    if (d.effop) { const v = evalNum(t.value.replace('%', '')); if (v === null) return renderPanel(); eachSel(n => { const ef = n.effects?.[+d.effop]; if (ef) ef.opacity = clamp(v / 100, 0, 1); }, 'effects'); return commit('Change effect'); }
    if (d.pagebg) { const hx = normHex(t.value); if (!hx) return renderPanel(); pageNode().bg = hx; return commit('Page background'); }
    if (d.sname) { const s = root().styles[d.sname]; if (s && t.value.trim()) { s.name = t.value.trim(); commit('Rename style'); } return; }
    if (d.rms) { const v = evalNum(t.value); const n = panelNodes()[0]; if (v !== null && n?.reactions?.[+d.rms]) { n.reactions[+d.rms].duration = clamp(v, 0, 5000); commit('Interaction'); } return; }
  });
  right.addEventListener('input', e => { if (e.target.id === 'compDesc') { const n = N(e.target.dataset.desc); if (n) { n.description = e.target.value; commitSoon('Edit description'); } } });
  right.addEventListener('click', e => {
    const pick = e.target.closest('[data-pick]'); if (pick) return openPicker(pick.dataset.pick, pick);
    const sc = e.target.closest('[data-selcol]'); if (sc) return openPicker('selcol:' + sc.dataset.selcol, sc);
    const b = e.target.closest('[data-act]'); if (!b) return;
    runPanelAct(b.dataset.act, b.dataset.arg, b);
  });
  // scrubbing labels
  right.addEventListener('pointerdown', e => {
    const l = e.target.closest('[data-scrub]'); if (!l) return;
    const p = l.dataset.scrub; const inp = $('#p-' + p); if (!inp || inp.disabled) return;
    e.preventDefault();
    const ns = panelNodes(); const start = ns.map(n => PROP[p].get(n)); const snap = snapshotIds(ns.map(n => n.id));
    let acc = 0, moved = false; l.setPointerCapture(e.pointerId);
    const mv = ev => {
      acc += ev.movementX * (ev.shiftKey ? 10 : 1) * (p === 'opacity' || p === 'innerRadius' ? 0.5 : 1); moved = true;
      restoreSnap(snap);
      panelNodes().forEach((n, i) => { if (start[i] === MIXED) return; let v = start[i] + Math.round(acc); if (['w', 'h', 'strokeWidth', 'fontSize', 'cornerRadius', 'itemSpacing', 'padH', 'padV'].includes(p)) v = Math.max(0, v); PROP[p].set(n, v); markOverride(n, propKey(p)); });
      layoutAll(); renderLive();
      const v0 = PROP[p].get(panelNodes()[0]); inp.value = v0 === MIXED ? '' : fmt(v0) + (PROP[p].suffix || '');
    };
    const up = () => { l.removeEventListener('pointermove', mv); l.removeEventListener('pointerup', up); if (moved) commit('Change ' + p); };
    l.addEventListener('pointermove', mv); l.addEventListener('pointerup', up);
  });
}
function applySelect(key, v) {
  const [k, idx] = key.split(':');
  const ns = panelNodes();
  switch (k) {
    case 'preset': { const pr = FRAME_PRESETS.find(p => p[0] === v); if (pr && pr[1]) eachSel(n => { resizeNode(n, pr[1], pr[2]); n.sizingH = n.sizingV = 'FIXED'; }); return commit('Frame preset'); }
    case 'sizingH': case 'sizingV': eachSel(n => { n[k] = v; if (n.type === 'TEXT' && k === 'sizingH' && v === 'HUG') n.sizingV = 'HUG'; }, k); return commit('Resizing');
    case 'conH': eachSel(n => n.constraints = Object.assign({}, n.constraints, { h: v }), 'constraints'); return commit('Constraints');
    case 'conV': eachSel(n => n.constraints = Object.assign({}, n.constraints, { v: v }), 'constraints'); return commit('Constraints');
    case 'blendMode': case 'strokeAlign': case 'strokeCap': case 'strokeJoin': case 'startCap': case 'endCap': eachSel(n => n[k] = v, k); return commit('Change ' + k);
    case 'fontWeight': eachSel(n => { n.fontWeight = +v; delete n.textStyle; }, 'fontWeight'); return commit('Font weight');
    case 'effType': eachSel(n => { const ef = n.effects?.[+idx]; if (ef) { ef.type = v; if (v !== 'LAYER_BLUR') { ef.color = ef.color || '#000000'; ef.opacity = ef.opacity ?? 0.25; } } }, 'effects'); return commit('Effect type');
    case 'exScale': eachSel(n => n.exportSettings[+idx].scale = +v); return commit('Export setting');
    case 'exFormat': eachSel(n => n.exportSettings[+idx].format = v); return commit('Export setting');
    case 'flowStart': pageNode().flowStart = v; return commit('Flow start');
    case 'rDest': eachSel(n => { const r = n.reactions[+idx]; if (v === '__back') { r.action = 'BACK'; r.dest = null; } else { r.action = 'NAVIGATE'; r.dest = v || null; } }, 'reactions'); return commit('Interaction');
    case 'rTrans': eachSel(n => n.reactions[+idx].transition = v, 'reactions'); return commit('Interaction');
  }
}
function applyCheck(k, on) {
  if (k === 'between') { eachSel(n => n.primaryAlign = on ? 'SPACE_BETWEEN' : 'MIN', 'primaryAlign'); return commit('Auto layout'); }
  if (k === 'absolute') { eachSel(n => { n.absolute = on; if (on) { n.sizingH = n.sizingH === 'FILL' ? 'FIXED' : n.sizingH; n.sizingV = n.sizingV === 'FILL' ? 'FIXED' : n.sizingV; } }); return commit('Absolute position'); }
  eachSel(n => n[k] = on, k); commit('Change ' + k);
}
function runPanelAct(act, arg, btn) {
  const ns = panelNodes();
  switch (act) {
    case 'align': return cmdAlign(arg);
    case 'dist': return cmdDistribute(arg);
    case 'flip': return cmdFlip(arg);
    case 'goMain': return cmdGoToMain();
    case 'detach': return cmdDetach();
    case 'resetOv': return cmdResetOverrides();
    case 'indepCorners': eachSel(n => { if (n.cornerRadii) { n.cornerRadius = n.cornerRadii[0]; n.cornerRadii = null; } else n.cornerRadii = [n.cornerRadius || 0, n.cornerRadius || 0, n.cornerRadius || 0, n.cornerRadius || 0]; }, 'cornerRadii'); return commit('Corners');
    case 'addAL': return cmdAutoLayout();
    case 'removeAL': return cmdRemoveAutoLayout();
    case 'alDir': eachSel(n => n.layoutMode = arg, 'layoutMode'); return commit('Auto layout direction');
    case 'alAlign': { const [p, c] = arg.split(':'); eachSel(n => { if (n.primaryAlign !== 'SPACE_BETWEEN') n.primaryAlign = p; n.counterAlign = c; }, 'counterAlign'); return commit('Auto layout alignment'); }
    case 'padSides': UI.padSides = !UI.padSides; return renderPanel();
    case 'boolOp': return cmdBoolean(arg);
    case 'editPath': return enterVecEdit(ns[0].id);
    case 'addPaint': {
      const key = arg;
      eachSel(n => { const same = common(ns, x => x[key] || []); if (same === MIXED) n[key] = []; n[key] = n[key] || []; n[key].push(key === 'fills' ? solid(n.type === 'TEXT' ? '#000000' : n[key].length ? '#000000' : '#D9D9D9', n[key].length ? 0.2 : 1) : solid('#000000')); if (key === 'strokes' && !n.strokeWidth) n.strokeWidth = 1; delete n[key === 'fills' ? 'fillStyle' : 'strokeStyle']; }, key);
      return commit('Add ' + (key === 'fills' ? 'fill' : 'stroke'));
    }
    case 'removePaint': { const { key, i } = paintTarget(arg); eachSel(n => { n[key].splice(i, 1); }, key); return commit('Remove paint'); }
    case 'togglePaint': { const { key, i } = paintTarget(arg); eachSel(n => { const p = n[key][i]; if (p) p.visible = p.visible === false; }, key); return commit('Toggle paint'); }
    case 'detachStyle': eachSel(n => delete n[arg === 'fills' ? 'fillStyle' : 'strokeStyle'], arg === 'fills' ? 'fillStyle' : 'strokeStyle'); return commit('Detach style');
    case 'styleMenu': return styleMenu(arg, btn);
    case 'textStyleMenu': return textStyleMenu(btn);
    case 'detachTextStyle': eachSel(n => delete n.textStyle, 'textStyle'); return commit('Detach text style');
    case 'addEffect': eachSel(n => { if (common(ns, x => x.effects || []) === MIXED) n.effects = []; n.effects = n.effects || []; n.effects.push({ type: 'DROP_SHADOW', x: 0, y: 4, blur: 12, spread: 0, color: '#000000', opacity: 0.18, visible: true }); }, 'effects'); UI.openEffect = (ns[0].effects || []).length - 1; return commit('Add effect');
    case 'effOpen': UI.openEffect = UI.openEffect === +arg ? null : +arg; return renderPanel();
    case 'effToggle': eachSel(n => { const ef = n.effects[+arg]; ef.visible = ef.visible === false; }, 'effects'); return commit('Toggle effect');
    case 'effRemove': eachSel(n => n.effects.splice(+arg, 1), 'effects'); return commit('Remove effect');
    case 'fontPicker': return openFontPicker(btn);
    case 'tAlign': eachSel(n => n.textAlign = arg, 'textAlign'); return commit('Text align');
    case 'vAlign': eachSel(n => n.verticalAlign = arg, 'verticalAlign'); return commit('Text align');
    case 'tItalic': { const on = !ns.every(n => n.italic); eachSel(n => n.italic = on, 'italic'); return commit('Italic'); }
    case 'tDeco': { const on = !ns.every(n => n.textDecoration === arg); eachSel(n => n.textDecoration = on ? arg : 'NONE', 'textDecoration'); return commit('Decoration'); }
    case 'tCase': { const on = !ns.every(n => n.textCase === arg); eachSel(n => n.textCase = on ? arg : 'ORIGINAL', 'textCase'); return commit('Text case'); }
    case 'tMode': eachSel(n => { if (arg === 'AUTO_W') { n.sizingH = 'HUG'; n.sizingV = 'HUG'; } else if (arg === 'AUTO_H') { if (n.sizingH === 'HUG') n.sizingH = 'FIXED'; n.sizingV = 'HUG'; } else { if (n.sizingH === 'HUG') n.sizingH = 'FIXED'; n.sizingV = 'FIXED'; } }); return commit('Text resizing');
    case 'exAdd': eachSel(n => { n.exportSettings = n.exportSettings || []; const last = n.exportSettings[n.exportSettings.length - 1]; n.exportSettings.push({ scale: last ? Math.min(4, last.scale + 1) : 1, format: last ? last.format : 'PNG' }); }); return commit('Add export');
    case 'exRemove': eachSel(n => n.exportSettings.splice(+arg, 1)); return commit('Remove export');
    case 'exportSel': return exportSelection();
    case 'addColorStyle': { const st = root().styles = root().styles || {}; const id = 'st' + uid(); st[id] = { id, type: 'COLOR', name: 'Color ' + (Object.values(st).filter(s => s.type === 'COLOR').length + 1), paints: [solid('#2F6FDE')] }; return commit('New color style'); }
    case 'delStyle': delete root().styles[arg]; Object.values(D.nodes).forEach(n => { if (n.fillStyle === arg) delete n.fillStyle; if (n.strokeStyle === arg) delete n.strokeStyle; if (n.textStyle === arg) delete n.textStyle; }); return commit('Delete style');
    case 'addReaction': { const n = ns[0]; const fr = kids(pageNode()).filter(f => isFrameLike(f) && f.id !== topLevelFrameOf(n)?.id); n.reactions = n.reactions || []; n.reactions.push({ trigger: 'CLICK', action: 'NAVIGATE', dest: fr[0]?.id || null, transition: 'DISSOLVE', duration: 300 }); return commit('Add interaction'); }
    case 'rmReaction': ns[0].reactions.splice(+arg, 1); return commit('Remove interaction');
    case 'present': return startPresent();
  }
}
/* ---------- styles ---------- */
function syncStyles() {
  const st = root()?.styles || {};
  Object.values(D.nodes).forEach(n => {
    if (n.fillStyle) { const s = st[n.fillStyle]; if (s) { const v = JSON.stringify(s.paints); if (JSON.stringify(n.fills) !== v) n.fills = JSON.parse(v); } else delete n.fillStyle; }
    if (n.strokeStyle) { const s = st[n.strokeStyle]; if (s) { const v = JSON.stringify(s.paints); if (JSON.stringify(n.strokes) !== v) n.strokes = JSON.parse(v); } else delete n.strokeStyle; }
    if (n.textStyle) { const s = st[n.textStyle]; if (s) Object.keys(s.props).forEach(k => { if (JSON.stringify(n[k]) !== JSON.stringify(s.props[k])) n[k] = clone(s.props[k]); }); else delete n.textStyle; }
  });
}
function styleMenu(key, btn) {
  const st = Object.values(root().styles || {}).filter(s => s.type === 'COLOR');
  const ns = panelNodes();
  const items = st.map(s => ({ label: s.name, swatch: paintCSS(s.paints[s.paints.length - 1]), action: () => { eachSel(n => { n[key === 'fills' ? 'fillStyle' : 'strokeStyle'] = s.id; n[key] = clone(s.paints); }, key === 'fills' ? 'fillStyle' : 'strokeStyle'); commit('Apply style'); } }));
  if (items.length) items.push({ sep: true });
  items.push({ label: 'Create style from this ' + (key === 'fills' ? 'fill' : 'stroke'), disabled: !ns.length || common(ns, n => n[key] || []) === MIXED || !(ns[0][key] || []).length, action: () => {
    const sts = root().styles = root().styles || {}; const id = 'st' + uid();
    const p = ns[0][key][ns[0][key].length - 1];
    sts[id] = { id, type: 'COLOR', name: p.type === 'SOLID' ? p.color : 'Gradient ' + (Object.keys(sts).length + 1), paints: clone(ns[0][key]) };
    eachSel(n => n[key === 'fills' ? 'fillStyle' : 'strokeStyle'] = id); commit('Create style'); toast('Style created — rename it on the page panel (click empty canvas)');
  } });
  const r = btn.getBoundingClientRect(); showMenu(items, r.left - 160, r.bottom + 4);
}
function textStyleMenu(btn) {
  const st = Object.values(root().styles || {}).filter(s => s.type === 'TEXT'); const ns = panelNodes();
  const items = st.map(s => ({ label: `${s.name}  ·  ${s.props.fontSize}`, action: () => { eachSel(n => { n.textStyle = s.id; Object.assign(n, clone(s.props)); }, 'textStyle'); commit('Apply text style'); } }));
  if (items.length) items.push({ sep: true });
  items.push({ label: 'Create style from this text', disabled: ns.length !== 1, action: () => {
    const n = ns[0]; const sts = root().styles = root().styles || {}; const id = 'st' + uid();
    const props = {}; ['fontFamily', 'fontWeight', 'italic', 'fontSize', 'lineHeight', 'letterSpacing', 'textCase', 'textDecoration'].forEach(k => props[k] = clone(n[k]));
    sts[id] = { id, type: 'TEXT', name: `${n.fontFamily} ${fmt(n.fontSize)}`, props }; n.textStyle = id; commit('Create text style');
  } });
  const r = btn.getBoundingClientRect(); showMenu(items, r.left - 160, r.bottom + 4);
}

/* ============================================================
   Color picker popover
   ============================================================ */
const PK = { spec: null, h: 0, s: 0, v: 0, a: 1, stop: 0, el: null };
function pkTargets() {
  const [kind, a, b] = PK.spec.split(':');
  if (kind === 'pageBg') return [{ get: () => solid(pageNode().bg), set: p => pageNode().bg = p.color }];
  if (kind === 'style') { const s = root().styles[a]; return [{ get: () => s.paints[s.paints.length - 1], set: p => s.paints[s.paints.length - 1] = p, style: true }]; }
  if (kind === 'effect') return panelNodes().map(n => ({ get: () => { const e = n.effects[+a]; return solid(e.color, e.opacity ?? 0.25); }, set: p => { const e = n.effects[+a]; e.color = p.color; e.opacity = p.opacity; markOverride(n, 'effects'); } }));
  if (kind === 'selcol') {
    const col = PK.selcol || a; const out = [];
    const visit = n => { ['fills', 'strokes'].forEach(k => (n[k] || []).forEach((p, i) => { if (p.type === 'SOLID' && p.color === col) out.push({ get: () => n[k][i], set: q => { n[k][i] = q; delete n[k === 'fills' ? 'fillStyle' : 'strokeStyle']; markOverride(n, k); } }); })); kids(n).forEach(visit); };
    panelNodes().forEach(n => kids(n).forEach(visit));
    return out;
  }
  const key = kind, i = +a;
  return panelNodes().map(n => ({ get: () => n[key][i], set: p => { n[key][i] = p; delete n[key === 'fills' ? 'fillStyle' : 'strokeStyle']; markOverride(n, key); } }));
}
function pkPaint() { const t = pkTargets()[0]; return t ? clone(t.get()) : null; }
function pkApply(fn, live = true) {
  pkTargets().forEach(t => { const p = clone(t.get()); fn(p); t.set(p); });
  if (PK.spec.startsWith('selcol')) { const p = pkPaint(); }
  layoutAll(); renderLive(); need.layers = false; commitSoon('Change paint');
  pkSync(false);
}
function openPicker(spec, anchor) {
  closePopovers();
  PK.spec = spec; PK.stop = 0; if (spec.startsWith('selcol:')) PK.selcol = spec.split(':')[1];
  const p = pkPaint(); if (!p) return;
  const el = PK.el = $('#picker');
  el.hidden = false;
  const r = anchor.getBoundingClientRect();
  const W = 248; let left = r.left - W - 12; if (left < 8) left = Math.min(window.innerWidth - W - 8, r.right + 8);
  el.style.left = left + 'px'; el.style.top = Math.max(8, Math.min(window.innerHeight - 460, r.top - 60)) + 'px';
  pkLoad(p); pkRender();
}
function pkLoad(p) {
  let c = '#000000', a = 1;
  if (p.type === 'SOLID') { c = p.color; a = p.opacity ?? 1; }
  else if (p.stops) { const s = p.stops[clamp(PK.stop, 0, p.stops.length - 1)]; c = s.color; a = s.opacity ?? 1; }
  const hsv = rgbToHsv(hexToRgb(c)); if (hsv.s > 0.001 && hsv.v > 0.001) PK.h = hsv.h; PK.s = hsv.s; PK.v = hsv.v; PK.a = a;
}
function pkRender() {
  const p = pkPaint(); const el = PK.el; const kind = PK.spec.split(':')[0];
  const isPaint = kind === 'fills' || kind === 'strokes' || kind === 'style';
  const docCols = [...new Set(Object.values(D.nodes).flatMap(n => [...(n.fills || []), ...(n.strokes || [])]).filter(q => q.type === 'SOLID').map(q => q.color))].slice(0, 16);
  el.innerHTML = `<div class="pkhead">${isPaint ? ['SOLID', 'LINEAR', 'RADIAL', 'IMAGE'].map(t => `<button class="tb sm${p.type === t ? ' on' : ''}" data-pktype="${t}">${{ SOLID: 'Solid', LINEAR: 'Linear', RADIAL: 'Radial', IMAGE: 'Image' }[t]}</button>`).join('') : '<span class="st">Color</span>'}<button class="ib pkx" data-pkclose="1" title="Close">✕</button></div>`
    + (p.type === 'IMAGE' ? `<div class="pkimg" style="background:${paintCSS(p)}"></div><div class="row"><button class="tb wide" data-pkimg="1">Choose image…</button></div><div class="row">${sel_('pkmode', 'pkmode', [['FILL', 'Fill'], ['FIT', 'Fit'], ['STRETCH', 'Stretch'], ['TILE', 'Tile']], p.scaleMode || 'FILL', 'wide')}</div>`
      : ((p.stops ? `<div class="gbar" style="--g:linear-gradient(90deg, ${p.stops.slice().sort((a, b) => a.pos - b.pos).map(s => `${rgba(s.color, s.opacity ?? 1)} ${s.pos * 100}%`).join(',')})">${p.stops.map((s, i) => `<span class="gstop${i === PK.stop ? ' on' : ''}" data-gstop="${i}" style="left:${s.pos * 100}%;--c:${s.color}"></span>`).join('')}</div><div class="row tight">${p.type === 'LINEAR' ? `<label class="nf"><span class="nl">∠</span><input class="num" id="pk-ang" data-pkang="1" value="${fmt(p.angle ?? 90)}°"></label>` : '<span></span>'}<button class="tb sm" data-pkdelstop="1"${p.stops.length < 3 ? ' disabled' : ''}>Remove stop</button></div>` : '')
        + `<div class="sv" data-sv="1"><i class="svh"></i></div><div class="hue" data-hue="1"><i></i></div><div class="alpha" data-alpha="1"><i></i></div>`
        + `<div class="row tight"><label class="nf wide"><span class="nl">#</span><input class="num" id="pk-hex" data-pkhex="1" spellcheck="false"></label><label class="nf"><span class="nl">A</span><input class="num" id="pk-a" data-pka="1"></label>${window.EyeDropper ? `<button class="ib" data-pkeye="1" title="Pick a color from the screen"><svg viewBox="0 0 24 24"><path d="M14.5 5.5l4 4M4 20l2-2.5 8.5-8.5 2 2L8 19.5zM16 4l4 4-2 2-4-4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>` : ''}</div>`
        + `<div class="pkdoc">${docCols.map(c => `<button class="swatch sm" data-pkcol="${c}" style="--c:${c}" title="${c}"></button>`).join('')}</div>`));
  pkSync(true);
}
function pkSync(full) {
  const el = PK.el; if (!el || el.hidden) return;
  const hex = rgbToHex(hsvToRgb({ h: PK.h, s: PK.s, v: PK.v }));
  const sv = $('[data-sv]', el); if (sv) { sv.style.setProperty('--hue', `hsl(${PK.h},100%,50%)`); const k = $('.svh', sv); k.style.left = PK.s * 100 + '%'; k.style.top = (1 - PK.v) * 100 + '%'; }
  const hu = $('[data-hue] i', el); if (hu) hu.style.left = PK.h / 360 * 100 + '%';
  const al = $('[data-alpha]', el); if (al) { al.style.setProperty('--c', hex); $('i', al).style.left = PK.a * 100 + '%'; }
  const hx = $('#pk-hex'); if (hx && document.activeElement !== hx) hx.value = hex.replace('#', '');
  const aa = $('#pk-a'); if (aa && document.activeElement !== aa) aa.value = fmt(round(PK.a * 100, 1)) + '%';
  const p = pkPaint();
  if (!full && p && p.stops) { const bar = $('.gbar', el); if (bar) { bar.style.setProperty('--g', `linear-gradient(90deg, ${p.stops.slice().sort((a, b) => a.pos - b.pos).map(s => `${rgba(s.color, s.opacity ?? 1)} ${s.pos * 100}%`).join(',')})`); $$('.gstop', bar).forEach((g, i) => { g.style.left = p.stops[i].pos * 100 + '%'; g.style.setProperty('--c', p.stops[i].color); }); } }
  // live swatch in panel
  const sw = document.querySelector(`#designPane [data-pick="${PK.spec}"]`); if (sw && p) sw.style.setProperty('--c', paintCSS(p));
}
function pkSetColor() {
  const hex = rgbToHex(hsvToRgb({ h: PK.h, s: PK.s, v: PK.v }));
  pkApply(p => { if (p.type === 'SOLID') { p.color = hex; p.opacity = PK.a; } else if (p.stops) { const s = p.stops[PK.stop]; if (s) { s.color = hex; s.opacity = PK.a; } } });
  if (PK.spec.startsWith('selcol')) PK.selcol = hex;
}
function initPicker() {
  const el = $('#picker');
  const drag = (e, area) => {
    const r = area.getBoundingClientRect();
    const upd = ev => {
      const x = clamp((ev.clientX - r.left) / r.width, 0, 1), y = clamp((ev.clientY - r.top) / r.height, 0, 1);
      if (area.dataset.sv) { PK.s = x; PK.v = 1 - y; } else if (area.dataset.hue) PK.h = x * 359.9; else if (area.dataset.alpha) PK.a = round(x, 3);
      pkSetColor();
    };
    upd(e); area.setPointerCapture(e.pointerId);
    area.onpointermove = upd; area.onpointerup = () => { area.onpointermove = null; commitSoon.flush ? 0 : 0; };
  };
  el.addEventListener('pointerdown', e => {
    const area = e.target.closest('[data-sv],[data-hue],[data-alpha]'); if (area) { e.preventDefault(); return drag(e, area); }
    const gs = e.target.closest('[data-gstop]');
    if (gs) {
      e.preventDefault(); PK.stop = +gs.dataset.gstop; pkLoad(pkPaint()); pkRender();
      const bar = $('.gbar', el); const r = bar.getBoundingClientRect(); const i = PK.stop;
      bar.setPointerCapture(e.pointerId);
      bar.onpointermove = ev => { const x = clamp((ev.clientX - r.left) / r.width, 0, 1); pkApply(p => p.stops[i].pos = round(x, 4)); };
      bar.onpointerup = () => bar.onpointermove = null;
      return;
    }
    const bar = e.target.closest('.gbar');
    if (bar) { const r = bar.getBoundingClientRect(); const x = clamp((e.clientX - r.left) / r.width, 0, 1); const hex = rgbToHex(hsvToRgb({ h: PK.h, s: PK.s, v: PK.v })); pkApply(p => p.stops.push({ pos: round(x, 4), color: hex, opacity: PK.a })); PK.stop = pkPaint().stops.length - 1; pkRender(); }
  });
  el.addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    const d = t.dataset;
    if (d.pkclose) return closePopovers();
    if (d.pktype) {
      const cur = pkPaint(); const base = cur.type === 'SOLID' ? cur.color : (cur.stops ? cur.stops[0].color : '#D9D9D9');
      pkApply(p => {
        const op = p.opacity ?? 1;
        for (const k in p) delete p[k];
        if (d.pktype === 'SOLID') Object.assign(p, solid(base, op));
        else if (d.pktype === 'IMAGE') Object.assign(p, { type: 'IMAGE', imageRef: null, scaleMode: 'FILL', opacity: op, visible: true });
        else Object.assign(p, { type: d.pktype, angle: 90, opacity: op, visible: true, stops: [{ pos: 0, color: base, opacity: 1 }, { pos: 1, color: base, opacity: 0 }] });
      });
      PK.stop = 0; pkLoad(pkPaint()); pkRender();
      if (d.pktype === 'IMAGE') chooseImageForPaint();
      return;
    }
    if (d.pkimg) return chooseImageForPaint();
    if (d.pkdelstop) { pkApply(p => { if (p.stops.length > 2) p.stops.splice(PK.stop, 1); }); PK.stop = 0; pkLoad(pkPaint()); return pkRender(); }
    if (d.pkcol) { const hsv = rgbToHsv(hexToRgb(d.pkcol)); PK.h = hsv.h; PK.s = hsv.s; PK.v = hsv.v; pkSetColor(); return; }
    if (d.pkeye) { try { const r = await new EyeDropper().open(); const hsv = rgbToHsv(hexToRgb(r.sRGBHex)); PK.h = hsv.h; PK.s = hsv.s; PK.v = hsv.v; pkSetColor(); } catch (err) { } }
  });
  el.addEventListener('change', e => {
    const d = e.target.dataset;
    if (d.pkhex) { const hx = normHex(e.target.value); if (hx) { const hsv = rgbToHsv(hexToRgb(hx)); PK.h = hsv.s ? hsv.h : PK.h; PK.s = hsv.s; PK.v = hsv.v; pkSetColor(); } }
    if (d.pka) { const v = evalNum(e.target.value.replace('%', '')); if (v !== null) { PK.a = clamp(v / 100, 0, 1); pkSetColor(); } }
    if (d.pkang) { const v = evalNum(e.target.value.replace('°', '')); if (v !== null) pkApply(p => p.angle = v); }
    if (d.sel === 'pkmode') pkApply(p => p.scaleMode = e.target.value);
  });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) e.target.dispatchEvent(new Event('change', { bubbles: true })); if (e.key === 'Escape') closePopovers(); e.stopPropagation(); });
}
async function chooseImageForPaint() {
  const files = await pickFiles('image/*', false); if (!files.length) return;
  const data = await readFile(files[0]); const ref = await addImageAsset(data, files[0]);
  pkApply(p => { p.type = 'IMAGE'; p.imageRef = ref; p.scaleMode = p.scaleMode || 'FILL'; });
  pkRender(); commit('Image fill');
}
function closePopovers() {
  const pk = $('#picker'); if (pk && !pk.hidden) { pk.hidden = true; PK.spec = null; renderAll(); }
  const fp = $('#fontpop'); if (fp && !fp.hidden) fp.hidden = true;
}
/* ---------- font picker ---------- */
function openFontPicker(btn) {
  closePopovers();
  const el = $('#fontpop'); el.hidden = false;
  const r = btn.getBoundingClientRect();
  el.style.left = Math.max(8, r.left - 250) + 'px'; el.style.top = Math.max(8, Math.min(window.innerHeight - 380, r.top - 40)) + 'px';
  const cur = common(panelNodes(), n => n.fontFamily);
  const list = q => [...Object.keys(GFONTS).map(f => [f, 'Google Fonts']), ...SYSFONTS.map(f => [f, 'On this device'])].filter(([f]) => f.toLowerCase().includes(q.toLowerCase()));
  const draw = q => { $('.fplist', el).innerHTML = list(q).map(([f, src]) => `<button class="fpi${f === cur ? ' on' : ''}" data-font="${esc(f)}"><span>${esc(f)}</span><small>${src}</small></button>`).join('') || '<div class="hint">No matching fonts</div>'; };
  el.innerHTML = `<input class="fpsearch" id="fpsearch" placeholder="Search fonts" spellcheck="false" autocomplete="off"><div class="fplist"></div>`;
  draw('');
  const s = $('#fpsearch'); s.focus(); s.oninput = () => draw(s.value);
  s.onkeydown = e => { if (e.key === 'Enter') { const f = $('.fpi', el); if (f) f.click(); } if (e.key === 'Escape') closePopovers(); e.stopPropagation(); };
  el.onclick = e => { const b = e.target.closest('[data-font]'); if (!b) return; const f = b.dataset.font; ensureFont(f); eachSel(n => { n.fontFamily = f; const ws = fontWeights(f); if (!ws.includes(n.fontWeight)) n.fontWeight = ws.reduce((a, w) => Math.abs(w - n.fontWeight) < Math.abs(a - n.fontWeight) ? w : a, ws[0]); delete n.textStyle; }, 'fontFamily'); el.hidden = true; commit('Font'); };
}
