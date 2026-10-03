/* ============================================================
   SVG renderer — shared by the canvas view and export
   ============================================================ */
const BLEND = { MULTIPLY: 'multiply', SCREEN: 'screen', OVERLAY: 'overlay', DARKEN: 'darken', LIGHTEN: 'lighten', COLOR_DODGE: 'color-dodge', COLOR_BURN: 'color-burn', HARD_LIGHT: 'hard-light', SOFT_LIGHT: 'soft-light', DIFFERENCE: 'difference', EXCLUSION: 'exclusion', HUE: 'hue', SATURATION: 'saturation', COLOR: 'color', LUMINOSITY: 'luminosity' };
const JOIN = { MITER: 'miter', ROUND: 'round', BEVEL: 'bevel' }, CAP = { NONE: 'butt', ROUND: 'round', SQUARE: 'square' };
function mkCtx(opts = {}) {
  return Object.assign({ export: false, defs: [], n: 0, pfx: opts.export ? 'x' : 'v', hide: null,
    id(p) { return this.pfx + p + (++this.n); },
    img(ref) { const im = D.images[ref]; return im ? (this.export ? im.data : (im.url || im.data)) : ''; } }, opts);
}
function renderNodes(list, ctx) {
  let out = '', open = 0;
  for (const n of list) {
    if (n.isMask && n.visible && !(ctx.hide && ctx.hide.has(n.id))) {
      const cid = ctx.id('mk');
      const d = pathsToD(transformPaths(outlinePaths(n), localMatrix(n)));
      ctx.defs.push(`<clipPath id="${cid}"><path d="${d}"/></clipPath>`);
      if (!ctx.export) out += `<path data-id="${n.id}" d="${d}" fill="transparent" class="hit"/>`;
      out += `<g clip-path="url(#${cid})">`; open++;
      continue;
    }
    out += renderNode(n, ctx);
  }
  return out + '</g>'.repeat(open);
}
function paintAttr(p, ctx, kind, n) {
  const op = p.opacity ?? 1;
  if (p.type === 'SOLID') return `${kind}="${p.color}"${op < 1 ? ` ${kind}-opacity="${round(op, 3)}"` : ''}`;
  if (p.type === 'LINEAR' || p.type === 'RADIAL') {
    const id = ctx.id('gr');
    const stops = (p.stops || []).map(s => `<stop offset="${round(s.pos, 4)}" stop-color="${s.color}" stop-opacity="${round((s.opacity ?? 1) * op, 3)}"/>`).join('');
    if (p.type === 'LINEAR') {
      const a = rad(p.angle ?? 90), c = Math.cos(a) / 2, s = Math.sin(a) / 2;
      ctx.defs.push(`<linearGradient id="${id}" x1="${r3(0.5 - c)}" y1="${r3(0.5 - s)}" x2="${r3(0.5 + c)}" y2="${r3(0.5 + s)}">${stops}</linearGradient>`);
    } else ctx.defs.push(`<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5">${stops}</radialGradient>`);
    return `${kind}="url(#${id})"`;
  }
  if (p.type === 'IMAGE') {
    const id = ctx.id('im'), im = D.images[p.imageRef];
    const href = ctx.img(p.imageRef);
    if (!href) return `${kind}="#D9D9D9"`;
    if (p.scaleMode === 'TILE' && im) {
      const s = p.scale || 1, w = im.w * s, hh = im.h * s;
      ctx.defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="${r3(w)}" height="${r3(hh)}"><image href="${href}" width="${r3(w)}" height="${r3(hh)}"/></pattern>`);
    } else {
      const par = { FIT: 'xMidYMid meet', STRETCH: 'none' }[p.scaleMode] || 'xMidYMid slice';
      ctx.defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="${r3(Math.max(n.w, 0.01))}" height="${r3(Math.max(n.h, 0.01))}"><image href="${href}" width="${r3(Math.max(n.w, 0.01))}" height="${r3(Math.max(n.h, 0.01))}" preserveAspectRatio="${par}"/></pattern>`);
    }
    return `${kind}="url(#${id})"${op < 1 ? ` ${kind}-opacity="${round(op, 3)}"` : ''}`;
  }
  return `${kind}="none"`;
}
const visPaints = arr => (arr || []).filter(p => p.visible !== false);
function fillsMarkup(n, d, ctx, hit) {
  const fills = visPaints(n.fills); let out = '';
  const rule = n.fillRule === 'evenodd' ? ' fill-rule="evenodd"' : '';
  fills.forEach(p => { out += `<path d="${d}"${rule} ${paintAttr(p, ctx, 'fill', n)}/>`; });
  if (!fills.length && hit && !ctx.export) out += `<path d="${d}" fill="transparent" class="hit"/>`;
  return out;
}
function strokeCommon(n, sw) {
  let a = ` stroke-width="${r3(sw)}" stroke-linejoin="${JOIN[n.strokeJoin] || 'miter'}" stroke-linecap="${CAP[n.strokeCap] || 'butt'}"`;
  const dash = n.strokeDash;
  if (dash && (Array.isArray(dash) ? dash[0] : dash) > 0) { const [a1, b1] = Array.isArray(dash) ? dash : [dash, dash]; a += ` stroke-dasharray="${a1} ${b1 || a1}"`; }
  return a;
}
function strokesMarkup(n, paths, ctx) {
  const strokes = visPaints(n.strokes); const sw0 = n.strokeWidth || 0;
  if (!strokes.length || sw0 <= 0 || !paths.length) return '';
  const d = pathsToD(paths);
  const closed = paths.every(sp => sp.closed);
  const align = closed ? (n.strokeAlign || 'INSIDE') : 'CENTER';
  const sw = align === 'CENTER' ? sw0 : sw0 * 2;
  let pre = '', post = '';
  if (align === 'INSIDE') { const id = ctx.id('ci'); ctx.defs.push(`<clipPath id="${id}"><path d="${d}"${n.fillRule === 'evenodd' ? ' clip-rule="evenodd"' : ''}/></clipPath>`); pre = `<g clip-path="url(#${id})">`; post = '</g>'; }
  if (align === 'OUTSIDE') {
    const id = ctx.id('mo'), b = pathsBBox(paths), p = sw + 4;
    ctx.defs.push(`<mask id="${id}" maskUnits="userSpaceOnUse" x="${r3(b.x - p)}" y="${r3(b.y - p)}" width="${r3(b.w + 2 * p)}" height="${r3(b.h + 2 * p)}"><rect x="${r3(b.x - p)}" y="${r3(b.y - p)}" width="${r3(b.w + 2 * p)}" height="${r3(b.h + 2 * p)}" fill="#fff"/><path d="${d}" fill="#000"/></mask>`);
    pre = `<g mask="url(#${id})">`; post = '</g>';
  }
  let out = pre;
  strokes.forEach(p => { out += `<path d="${d}" fill="none" ${paintAttr(p, ctx, 'stroke', n)}${strokeCommon(n, sw)}/>`; });
  out += post;
  if (n.type === 'VECTOR' && !closed) out += capsMarkup(n, paths, strokes[0], ctx);
  return out;
}
function capsMarkup(n, paths, paint, ctx) {
  let out = '';
  const sw = n.strokeWidth || 1;
  const col = paint.type === 'SOLID' ? paint.color : (paint.stops?.[0]?.color || '#000');
  const op = (paint.opacity ?? 1);
  const cap = (p, dir, type) => {
    if (!type || type === 'NONE') return '';
    const L = Math.max(sw * 3.2, 6), len = Math.hypot(dir.x, dir.y) || 1, ux = dir.x / len, uy = dir.y / len, px = -uy, py = ux;
    if (type === 'ARROW_LINES') {
      const a = { x: p.x - ux * L + px * L * 0.7, y: p.y - uy * L + py * L * 0.7 }, b = { x: p.x - ux * L - px * L * 0.7, y: p.y - uy * L - py * L * 0.7 };
      return `<path d="M${r3(a.x)} ${r3(a.y)}L${r3(p.x)} ${r3(p.y)}L${r3(b.x)} ${r3(b.y)}" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (type === 'TRIANGLE') {
      const T = L * 1.1, tip = { x: p.x + ux * sw * 0.5, y: p.y + uy * sw * 0.5 };
      const a = { x: tip.x - ux * T + px * T * 0.58, y: tip.y - uy * T + py * T * 0.58 }, b = { x: tip.x - ux * T - px * T * 0.58, y: tip.y - uy * T - py * T * 0.58 };
      return `<path d="M${r3(a.x)} ${r3(a.y)}L${r3(tip.x)} ${r3(tip.y)}L${r3(b.x)} ${r3(b.y)}Z" fill="${col}" fill-opacity="${op}"/>`;
    }
    if (type === 'CIRCLE') return `<circle cx="${r3(p.x)}" cy="${r3(p.y)}" r="${r3(sw * 1.6 + 1.5)}" fill="${col}" fill-opacity="${op}"/>`;
    return '';
  };
  const first = paths[0], last = paths[paths.length - 1];
  if (first && first.pts.length > 1 && n.startCap && n.startCap !== 'NONE') {
    const a = first.pts[0], nx = first.pts[1];
    const dir = (a.ox || a.oy) ? { x: -a.ox, y: -a.oy } : { x: a.x - (nx.x + nx.ix), y: a.y - (nx.y + nx.iy) };
    out += cap(a, dir, n.startCap);
  }
  if (last && last.pts.length > 1 && n.endCap && n.endCap !== 'NONE') {
    const P = last.pts, b = P[P.length - 1], pv = P[P.length - 2];
    const dir = (b.ix || b.iy) ? { x: -b.ix, y: -b.iy } : { x: b.x - (pv.x + pv.ox), y: b.y - (pv.y + pv.oy) };
    out += cap(b, dir, n.endCap);
  }
  return out;
}
function effectPad(n) {
  let p = 0;
  (n.effects || []).filter(e => e.visible !== false).forEach(e => {
    if (e.type === 'DROP_SHADOW') p = Math.max(p, Math.abs(e.x || 0) + Math.abs(e.y || 0) + (e.blur || 0) * 1.5 + Math.max(0, e.spread || 0));
    if (e.type === 'LAYER_BLUR') p = Math.max(p, (e.blur || 0) * 1.6);
  });
  return p;
}
function effectsFilter(n, ctx) {
  const fx = (n.effects || []).filter(e => e.visible !== false);
  if (!fx.length) return null;
  const id = ctx.id('fx');
  const pad = effectPad(n) + (n.strokeWidth || 0) * 2 + 8;
  let f = `<filter id="${id}" filterUnits="userSpaceOnUse" x="${r3(-pad)}" y="${r3(-pad)}" width="${r3(n.w + pad * 2)}" height="${r3(n.h + pad * 2)}" color-interpolation-filters="sRGB">`;
  const drops = [], inners = []; let blur = 0, k = 0;
  fx.forEach(e => {
    if (e.type === 'DROP_SHADOW') {
      const r = `d${k++}`;
      const src = e.spread > 0 ? `<feMorphology in="SourceAlpha" operator="dilate" radius="${e.spread}" result="${r}m"/>` : '';
      f += `${src}<feOffset in="${e.spread > 0 ? r + 'm' : 'SourceAlpha'}" dx="${e.x || 0}" dy="${e.y || 0}" result="${r}o"/><feGaussianBlur in="${r}o" stdDeviation="${(e.blur || 0) / 2}" result="${r}b"/><feFlood flood-color="${e.color}" flood-opacity="${e.opacity ?? 0.25}"/><feComposite in2="${r}b" operator="in" result="${r}"/>`;
      drops.push(r);
    } else if (e.type === 'INNER_SHADOW') {
      const r = `i${k++}`;
      f += `<feFlood flood-color="${e.color}" flood-opacity="${e.opacity ?? 0.25}"/><feComposite in2="SourceAlpha" operator="out" result="${r}a"/><feOffset in="${r}a" dx="${e.x || 0}" dy="${e.y || 0}" result="${r}o"/><feGaussianBlur in="${r}o" stdDeviation="${(e.blur || 0) / 2}" result="${r}b"/><feComposite in="${r}b" in2="SourceAlpha" operator="in" result="${r}"/>`;
      inners.push(r);
    } else if (e.type === 'LAYER_BLUR') blur = Math.max(blur, e.blur || 0);
  });
  f += `<feMerge result="mg">${drops.map(r => `<feMergeNode in="${r}"/>`).join('')}<feMergeNode in="SourceGraphic"/>${inners.map(r => `<feMergeNode in="${r}"/>`).join('')}</feMerge>`;
  if (blur) f += `<feGaussianBlur in="mg" stdDeviation="${blur / 2}"/>`;
  f += '</filter>';
  ctx.defs.push(f);
  return id;
}
function textMarkup(n, ctx) {
  const L = textRenderLayout(n);
  const total = L.lines.length * L.lh;
  let oy = 0; if (n.verticalAlign === 'CENTER') oy = (n.h - total) / 2; else if (n.verticalAlign === 'BOTTOM') oy = n.h - total;
  const base = (L.lh - (L.asc + L.desc)) / 2 + L.asc;
  const anchor = { CENTER: 'middle', RIGHT: 'end' }[n.textAlign] || 'start';
  const x = n.textAlign === 'CENTER' ? n.w / 2 : n.textAlign === 'RIGHT' ? n.w : 0;
  const deco = { UNDERLINE: 'underline', STRIKETHROUGH: 'line-through' }[n.textDecoration];
  const fam = `'${String(n.fontFamily).replace(/'/g, '')}', ${FONT_FALLBACK(n.fontFamily)}`;
  const attrs = `font-family="${esc(fam)}" font-size="${n.fontSize}" font-weight="${n.fontWeight || 400}"${n.italic ? ' font-style="italic"' : ''}${n.letterSpacing ? ` letter-spacing="${n.letterSpacing}"` : ''}${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${deco ? ` text-decoration="${deco}"` : ''} xml:space="preserve"`;
  const spans = L.lines.map((l, i) => `<tspan x="${r3(x)}" y="${r3(oy + i * L.lh + base)}">${esc(l.t) || ' '}</tspan>`).join('');
  let out = '';
  if (!ctx.export) out += `<rect width="${r3(n.w)}" height="${r3(n.h)}" fill="transparent" class="hit"/>`;
  visPaints(n.fills).forEach(p => { out += `<text ${attrs} ${paintAttr(p, ctx, 'fill', n)}>${spans}</text>`; });
  const strokes = visPaints(n.strokes);
  if (strokes.length && n.strokeWidth > 0) strokes.forEach(p => { out += `<text ${attrs} fill="none" ${paintAttr(p, ctx, 'stroke', n)} stroke-width="${n.strokeWidth}" stroke-linejoin="round">${spans}</text>`; });
  return out;
}
function renderNode(n, ctx) {
  if (!n || !n.visible || (ctx.hide && ctx.hide.has(n.id))) return '';
  const m = localMatrix(n);
  let a = ctx.export ? '' : ` data-id="${n.id}"`;
  if (!M.isI(m)) a += ` transform="${M.str(m)}"`;
  if ((n.opacity ?? 1) < 1) a += ` opacity="${round(n.opacity, 3)}"`;
  if (BLEND[n.blendMode]) a += ` style="mix-blend-mode:${BLEND[n.blendMode]}"`;
  const fx = effectsFilter(n, ctx); if (fx) a += ` filter="url(#${fx})"`;
  let inner = '';
  switch (n.type) {
    case 'FRAME': case 'COMPONENT': case 'INSTANCE': {
      const paths = shapePaths(n), d = pathsToD(paths);
      inner += fillsMarkup(n, d, ctx, true);
      const body = renderNodes(kids(n), ctx);
      if (n.clipsContent && body) { const id = ctx.id('fc'); ctx.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); inner += `<g clip-path="url(#${id})">${body}</g>`; }
      else inner += body;
      inner += strokesMarkup(n, paths, ctx);
      break;
    }
    case 'GROUP': inner += renderNodes(kids(n), ctx); break;
    case 'TEXT': inner += textMarkup(n, ctx); break;
    default: {
      const paths = shapePaths(n); if (!paths.length) break;
      const d = pathsToD(paths);
      const closedAny = paths.some(sp => sp.closed);
      inner += closedAny || n.type !== 'VECTOR' ? fillsMarkup(n, d, ctx, n.type !== 'VECTOR') : '';
      if (n.type === 'VECTOR' && !closedAny && visPaints(n.fills).length) inner += fillsMarkup(n, d, ctx, false);
      inner += strokesMarkup(n, paths, ctx);
      if (!ctx.export && (n.type === 'VECTOR' || n.type === 'BOOLEAN')) inner += `<path d="${d}" fill="${closedAny && visPaints(n.fills).length ? 'none' : 'none'}" stroke="transparent" stroke-width="8" vector-effect="non-scaling-stroke" class="hit"/>`;
    }
  }
  return `<g${a}>${inner}</g>`;
}
function renderPageMarkup(page, ctx) {
  const body = renderNodes(kids(page), ctx);
  return `<defs>${ctx.defs.join('')}</defs>${body}`;
}

/* ---------- export ---------- */
function exportBounds(ids) {
  const pts = [];
  ids.forEach(id => {
    const n = N(id); if (!n) return;
    const wb = worldBox(n);
    let p = effectPad(n);
    if (visPaints(n.strokes).length) p = Math.max(p, n.strokeAlign === 'OUTSIDE' ? n.strokeWidth : n.strokeAlign === 'CENTER' || n.type === 'VECTOR' ? n.strokeWidth / 2 + (n.endCap !== 'NONE' || n.startCap !== 'NONE' ? n.strokeWidth * 4 : 0) : 0);
    pts.push({ x: wb.x - p, y: wb.y - p }, { x: wb.x2 + p, y: wb.y2 + p });
  });
  const b = aabb(pts);
  return { x: Math.floor(b.x), y: Math.floor(b.y), w: Math.ceil(b.x2) - Math.floor(b.x), h: Math.ceil(b.y2) - Math.floor(b.y) };
}
function buildSVG(ids, opts = {}) {
  const ctx = mkCtx({ export: true });
  const b = opts.box || exportBounds(ids);
  const scale = opts.scale || 1;
  const body = ids.map(id => { const n = N(id); return `<g transform="${M.str(M.mul(M.tr(-b.x, -b.y), parentWorld(n)))}">${renderNode(n, ctx)}</g>`; }).join('');
  const fams = new Set(); ids.forEach(id => [N(id), ...descendants(N(id))].forEach(n => n.type === 'TEXT' && fams.add(n.fontFamily)));
  const style = opts.fontCSS || '';
  const bg = opts.bg ? `<rect width="${b.w}" height="${b.h}" fill="${opts.bg}"/>` : '';
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${b.w * scale}" height="${b.h * scale}" viewBox="0 0 ${b.w} ${b.h}" fill="none">${style ? `<style>${style}</style>` : ''}<defs>${ctx.defs.join('')}</defs>${bg}${body}</svg>`, box: b, fams };
}
const fontCSSCache = new Map();
async function embedFontCSS(fams, inline) {
  let css = '';
  for (const f of fams) {
    if (!GFONTS[f]) continue;
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@${GFONTS[f]}&display=swap`;
    if (!inline) { css += `@import url('${url}');`; continue; }
    const key = f;
    if (fontCSSCache.has(key)) { css += fontCSSCache.get(key); continue; }
    try {
      const txt = await (await fetch(url)).text();
      const blocks = txt.split(/(?=\/\*)/).filter(b => /\/\*\s*latin\s*\*\//.test(b));
      let out = '';
      for (const b of blocks) {
        const m = b.match(/url\((https:[^)]+)\)/); if (!m) continue;
        const buf = await (await fetch(m[1])).arrayBuffer();
        let bin = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
        out += b.replace(m[1], 'data:font/woff2;base64,' + btoa(bin)).replace(/\/\*[^*]*\*\//, '');
      }
      fontCSSCache.set(key, out); css += out;
    } catch (e) { fontCSSCache.set(key, ''); }
  }
  return css;
}
async function rasterize(ids, scale = 1, format = 'png', bg, region) {
  const first = buildSVG(ids, { box: region });
  const css = await embedFontCSS(first.fams, true);
  const { svg, box } = buildSVG(ids, { scale, fontCSS: css, bg: format === 'jpg' ? (bg || '#FFFFFF') : bg, box: region });
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(box.w * scale)); c.height = Math.max(1, Math.round(box.h * scale));
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  const type = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise(r => c.toBlob(r, type, 0.92));
  return { blob, w: c.width, h: c.height };
}
