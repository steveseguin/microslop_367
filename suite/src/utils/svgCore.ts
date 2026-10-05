/**
 * NinjaSVG document helpers: parsing, sanitizing, serializing and the geometry
 * maths behind on-canvas editing. Ported from SVG Tweak (vdo.ninja/svg).
 *
 * Everything here works on real DOM nodes. The live drawing sits in a shadow
 * root, so its own <style> rules never leak into the page.
 */

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

export const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect x="40" y="150" width="200" height="200" rx="14" fill="#2563eb"/>
  <circle cx="285" cy="125" r="100" fill="#e11d48"/>
  <text x="40" y="382" fill="#15803d" font-size="60" font-family="system-ui, sans-serif">Drag me!</text>
</svg>`;

export const PALETTE = [
  '#2563eb',
  '#e11d48',
  '#16a34a',
  '#ea580c',
  '#7c3aed',
  '#0891b2',
  '#ca8a04',
];

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const num = (value: unknown, fallback = 0) => {
  const n = parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

/** Round for attribute output so drags don't leave 14-digit noise. */
export const round = (n: number, places = 2) => {
  const f = 10 ** places;
  const v = Math.round(n * f) / f;
  return Object.is(v, -0) ? 0 : v;
};

export function getViewBox(svg: Element): ViewBox {
  const vb = svg.getAttribute('viewBox');
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(parseFloat);
    if (p.length === 4 && p.every(Number.isFinite) && p[2] > 0 && p[3] > 0)
      return { x: p[0], y: p[1], w: p[2], h: p[3] };
  }
  const w = num(svg.getAttribute('width'), 0);
  const h = num(svg.getAttribute('height'), 0);
  return { x: 0, y: 0, w: w > 0 ? w : 300, h: h > 0 ? h : 150 };
}

export function setCanvasSize(svg: Element, w: number, h: number) {
  const vb = getViewBox(svg);
  svg.setAttribute('viewBox', `${round(vb.x)} ${round(vb.y)} ${round(w)} ${round(h)}`);
  svg.setAttribute('width', String(round(w)));
  svg.setAttribute('height', String(round(h)));
}

/* ------------------------------------------------------------------------ */
/* Parsing                                                                   */
/* ------------------------------------------------------------------------ */

export interface ParseResult {
  svg: SVGSVGElement | null;
  /** First line of the XML error, when the strict parse failed. */
  error: string;
}

/**
 * Parse SVG markup. Missing namespace declarations are added (people paste
 * HTML-style inline SVG all the time); if strict XML still fails, the lenient
 * HTML parser is used so half-typed code still previews.
 * DOMParser documents never run scripts.
 */
export function parseSvg(code: string): ParseResult {
  const text = code.trim();
  if (!text) return { svg: null, error: '' };
  let prepared = text.replace(/^\uFEFF/, '');
  const open = prepared.match(/<svg\b[^>]*>/i);
  if (open) {
    let tag = open[0];
    if (!/\sxmlns\s*=/.test(tag)) tag = tag.replace(/^<svg/i, `<svg xmlns="${SVG_NS}"`);
    if (/\bxlink:/.test(prepared) && !/\sxmlns:xlink\s*=/.test(tag))
      tag = tag.replace(/^<svg/i, `<svg xmlns:xlink="${XLINK_NS}"`);
    prepared = prepared.replace(open[0], tag);
  }
  const doc = new DOMParser().parseFromString(prepared, 'image/svg+xml');
  const problem = doc.getElementsByTagName('parsererror')[0];
  const root = doc.documentElement;
  if (!problem && root?.localName === 'svg' && root.namespaceURI === SVG_NS)
    return { svg: root as unknown as SVGSVGElement, error: '' };
  const message = problem
    ? (problem.textContent || 'The SVG code has an error.')
        .replace(/^This page contains the following errors:/, '')
        .split('\n')
        .map((l) => l.trim())
        .find(Boolean) || 'The SVG code has an error.'
    : 'The code does not start with an <svg> element.';
  const html = new DOMParser().parseFromString(text, 'text/html');
  const svg = html.querySelector('svg');
  return { svg: svg as SVGSVGElement | null, error: message };
}

/* ------------------------------------------------------------------------ */
/* Sanitizing                                                                */
/* ------------------------------------------------------------------------ */

const BLOCKED = new Set([
  'script',
  'foreignobject',
  'iframe',
  'embed',
  'object',
  'audio',
  'video',
  'canvas',
  'handler',
  'listener',
  'link',
  'meta',
  'base',
  'form',
]);
const ANIMATIONS = new Set(['animate', 'set', 'animatemotion', 'animatetransform']);
const SAFE_DATA = /^data:image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml)[;,]/i;
const DANGEROUS_VALUE = /(java|vb)script\s*:|data\s*:\s*text\/html/i;

/** Remove @import and any url() that is not a local fragment or inline image. */
export function cleanCss(css: string) {
  return css
    .replace(/@import[^;]*;?/gi, '')
    .replace(/expression\s*\(/gi, '(')
    .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (whole, _q, url: string) =>
      url.startsWith('#') || SAFE_DATA.test(url) ? whole : 'none',
    );
}

/**
 * Strip everything that could run code or reach the network: scripts,
 * foreignObject, event handlers, javascript: links and external references
 * (only #fragments and inline data:image URLs survive). Returns how many
 * things were removed.
 */
export function sanitizeTree(root: Element): number {
  let removed = 0;
  const walk = (el: Element) => {
    for (const child of [...el.children]) {
      const tag = child.localName.toLowerCase();
      const attrName = (child.getAttribute('attributeName') || '').toLowerCase();
      if (
        BLOCKED.has(tag) ||
        child.namespaceURI === XHTML_NS ||
        (ANIMATIONS.has(tag) && /^(on|href|xlink:href)/.test(attrName))
      ) {
        child.remove();
        removed++;
        continue;
      }
      cleanAttributes(child);
      if (tag === 'style' && child.textContent) {
        const clean = cleanCss(child.textContent);
        if (clean !== child.textContent) {
          child.textContent = clean;
          removed++;
        }
      }
      walk(child);
    }
  };
  const cleanAttributes = (el: Element) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      let drop = name.startsWith('on') || DANGEROUS_VALUE.test(value);
      if (!drop && attr.localName === 'href')
        drop = !(value.startsWith('#') || SAFE_DATA.test(value));
      if (drop) {
        el.removeAttributeNode(attr);
        removed++;
      } else if (name === 'style') {
        const clean = cleanCss(attr.value);
        if (clean !== attr.value) {
          el.setAttribute('style', clean);
          removed++;
        }
      }
    }
  };
  cleanAttributes(root);
  walk(root);
  return removed;
}

export function serializeSvg(svg: Element) {
  let s = new XMLSerializer().serializeToString(svg);
  if (!/^<svg[^>]*\sxmlns=/.test(s)) s = s.replace(/^<svg/, `<svg xmlns="${SVG_NS}"`);
  return s;
}

/** Parse, sanitize and re-serialize untrusted SVG markup. */
export function sanitizeSvgCode(code: string): {
  code: string;
  removed: number;
  ok: boolean;
} {
  const { svg } = parseSvg(code);
  if (!svg) return { code: '', removed: 0, ok: false };
  const removed = sanitizeTree(svg);
  return { code: serializeSvg(svg), removed, ok: true };
}

/* ------------------------------------------------------------------------ */
/* Element addressing                                                        */
/* ------------------------------------------------------------------------ */

/** Child-index path from the root, stable across a re-render of the same code. */
export function pathOf(root: Element, el: Element): number[] | null {
  const path: number[] = [];
  let node: Element | null = el;
  while (node && node !== root) {
    const parent: Element | null = node.parentElement;
    if (!parent) return null;
    path.unshift([...parent.children].indexOf(node));
    node = parent;
  }
  return node === root ? path : null;
}

export function resolvePath(root: Element, path: number[]): Element | null {
  let node: Element | undefined = root;
  for (const i of path) {
    node = node?.children[i];
    if (!node) return null;
  }
  return node === root ? null : node;
}

const NON_GRAPHIC = new Set([
  'defs',
  'style',
  'title',
  'desc',
  'metadata',
  'lineargradient',
  'radialgradient',
  'pattern',
  'clippath',
  'mask',
  'filter',
  'marker',
  'symbol',
]);

/** The element a click should select: the shape itself, not a tspan or defs. */
export function selectableFor(target: Element | null, root: Element): Element | null {
  let el = target;
  while (el && el !== root) {
    let inDefs = false;
    for (let p = el.parentElement; p && p !== root; p = p.parentElement)
      if (NON_GRAPHIC.has(p.localName.toLowerCase())) inDefs = true;
    if (inDefs) return null;
    const tag = el.localName.toLowerCase();
    if (tag === 'tspan' || tag === 'textpath') {
      el = el.parentElement;
      continue;
    }
    return NON_GRAPHIC.has(tag) ? null : el;
  }
  return null;
}

/* ------------------------------------------------------------------------ */
/* Code <-> element mapping                                                  */
/* ------------------------------------------------------------------------ */

/**
 * Find where an element is written in the code. Tries the exact serialized
 * markup first, then falls back to "the Nth <tag" in document order, which
 * survives hand-formatted code.
 */
export function findCodeRange(
  code: string,
  root: Element,
  el: Element,
): [number, number] | null {
  const own = new XMLSerializer()
    .serializeToString(el)
    .replace(` xmlns="${SVG_NS}"`, '');
  const exact = code.indexOf(own);
  if (exact !== -1 && code.indexOf(own, exact + 1) === -1)
    return [exact, exact + own.length];
  const tag = el.tagName;
  const same = [...root.getElementsByTagName(tag)];
  const nth = same.indexOf(el);
  if (nth < 0) return null;
  // Blank out comments and CDATA so tags inside them are not counted.
  const masked = code.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, (m) =>
    ' '.repeat(m.length),
  );
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opener = new RegExp(`<${escaped}(?=[\\s/>])`, 'g');
  let match: RegExpExecArray | null = null;
  for (let i = 0; i <= nth; i++) {
    match = opener.exec(masked);
    if (!match) return null;
  }
  if (!match) return null;
  const start = match.index;
  const endOfTag = (from: number) => {
    let quote = '';
    for (let i = from; i < masked.length; i++) {
      const c = masked[i];
      if (quote) {
        if (c === quote) quote = '';
      } else if (c === '"' || c === "'") quote = c;
      else if (c === '>') return i;
    }
    return -1;
  };
  const close = endOfTag(start);
  if (close < 0) return null;
  if (masked[close - 1] === '/') return [start, close + 1];
  const any = new RegExp(`<(/?)${escaped}(?=[\\s/>])`, 'g');
  any.lastIndex = close + 1;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = any.exec(masked))) {
    const end = endOfTag(m.index);
    if (end < 0) return null;
    if (m[1]) {
      depth--;
      if (!depth) return [start, end + 1];
    } else if (masked[end - 1] !== '/') depth++;
    any.lastIndex = end + 1;
  }
  return [start, close + 1];
}

/* ------------------------------------------------------------------------ */
/* Geometry                                                                  */
/* ------------------------------------------------------------------------ */

type Snapshot = [string, string | null, string][];

/** Attributes only — enough to undo a drag preview without touching children. */
export function snapshot(el: Element): Snapshot {
  return [...el.attributes].map((a) => [a.name, a.namespaceURI, a.value]);
}

export function restore(el: Element, snap: Snapshot) {
  for (const a of [...el.attributes]) el.removeAttributeNode(a);
  for (const [name, ns, value] of snap) el.setAttributeNS(ns, name, value);
}

const tagOf = (el: Element) => el.localName.toLowerCase();

function shiftList(value: string | null, d: number) {
  if (!value) return String(round(d));
  return value
    .trim()
    .split(/[\s,]+/)
    .map((v) => String(round(num(v) + d)))
    .join(' ');
}

function mapPoints(value: string | null, fn: (x: number, y: number) => [number, number]) {
  const p = (value || '').trim().split(/[\s,]+/).filter(Boolean).map(parseFloat);
  const out: number[] = [];
  for (let i = 0; i + 1 < p.length; i += 2) {
    const [x, y] = fn(p[i], p[i + 1]);
    out.push(round(x), round(y));
  }
  const pairs: string[] = [];
  for (let i = 0; i + 1 < out.length; i += 2) pairs.push(`${out[i]},${out[i + 1]}`);
  return pairs.join(' ');
}

const fmtMatrix = (m: DOMMatrix) =>
  `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map((v) => round(v, 4)).join(' ')})`;

function currentMatrix(el: Element) {
  const list = (el as SVGGraphicsElement).transform?.baseVal;
  const t = list && list.numberOfItems ? list.consolidate() : null;
  return t ? DOMMatrix.fromMatrix(t.matrix) : new DOMMatrix();
}

/** Move an element by (dx, dy) in its parent's user units. */
export function moveElement(el: Element, dx: number, dy: number) {
  const transform = (el.getAttribute('transform') || '').trim();
  if (transform) {
    const lead = transform.match(
      /^translate\(\s*(-?[\d.eE+-]+)(?:[\s,]+(-?[\d.eE+-]+))?\s*\)/,
    );
    if (lead) {
      el.setAttribute(
        'transform',
        transform.replace(
          lead[0],
          `translate(${round(num(lead[1]) + dx)} ${round(num(lead[2]) + dy)})`,
        ),
      );
    } else {
      el.setAttribute('transform', `translate(${round(dx)} ${round(dy)}) ${transform}`);
    }
    return;
  }
  switch (tagOf(el)) {
    case 'rect':
    case 'image':
    case 'use':
    case 'svg':
      el.setAttribute('x', String(round(num(el.getAttribute('x')) + dx)));
      el.setAttribute('y', String(round(num(el.getAttribute('y')) + dy)));
      break;
    case 'text':
      el.setAttribute('x', shiftList(el.getAttribute('x'), dx));
      el.setAttribute('y', shiftList(el.getAttribute('y'), dy));
      // Absolutely positioned tspans move with their text.
      el.querySelectorAll('tspan').forEach((t) => {
        if (t.hasAttribute('x')) t.setAttribute('x', shiftList(t.getAttribute('x'), dx));
        if (t.hasAttribute('y')) t.setAttribute('y', shiftList(t.getAttribute('y'), dy));
      });
      break;
    case 'circle':
    case 'ellipse':
      el.setAttribute('cx', String(round(num(el.getAttribute('cx')) + dx)));
      el.setAttribute('cy', String(round(num(el.getAttribute('cy')) + dy)));
      break;
    case 'line':
      for (const [a, d] of [
        ['x1', dx],
        ['y1', dy],
        ['x2', dx],
        ['y2', dy],
      ] as const)
        el.setAttribute(a, String(round(num(el.getAttribute(a)) + d)));
      break;
    case 'polygon':
    case 'polyline':
      el.setAttribute(
        'points',
        mapPoints(el.getAttribute('points'), (x, y) => [x + dx, y + dy]),
      );
      break;
    default:
      el.setAttribute('transform', `translate(${round(dx)} ${round(dy)})`);
  }
}

export function fontSizeOf(el: Element) {
  const own = el.getAttribute('font-size');
  if (own && /^[\d.]+(px)?$/.test(own.trim())) return num(own, 16);
  return num(getComputedStyle(el).fontSize, 16);
}

/** Uniform-only shapes: a corner drag keeps their proportions. */
export const isUniform = (el: Element) => ['circle', 'text'].includes(tagOf(el));

/**
 * Scale an element by (sx, sy) about an anchor point given in the element's
 * own coordinates. Simple shapes keep editable attributes; anything else gets
 * a consolidated transform matrix.
 */
export function scaleElement(el: Element, sx: number, sy: number, ax: number, ay: number) {
  const set = (name: string, v: number) => el.setAttribute(name, String(round(v)));
  const g = (name: string) => num(el.getAttribute(name));
  switch (tagOf(el)) {
    case 'rect':
    case 'image':
    case 'use':
    case 'svg':
      set('x', ax + (g('x') - ax) * sx);
      set('y', ay + (g('y') - ay) * sy);
      if (el.hasAttribute('width') || tagOf(el) !== 'use') set('width', g('width') * sx);
      if (el.hasAttribute('height') || tagOf(el) !== 'use') set('height', g('height') * sy);
      if (el.hasAttribute('rx')) set('rx', g('rx') * sx);
      if (el.hasAttribute('ry')) set('ry', g('ry') * sy);
      return;
    case 'circle': {
      const s = Math.sqrt(sx * sy);
      set('cx', ax + (g('cx') - ax) * s);
      set('cy', ay + (g('cy') - ay) * s);
      set('r', g('r') * s);
      return;
    }
    case 'ellipse':
      set('cx', ax + (g('cx') - ax) * sx);
      set('cy', ay + (g('cy') - ay) * sy);
      set('rx', g('rx') * sx);
      set('ry', g('ry') * sy);
      return;
    case 'line':
      set('x1', ax + (g('x1') - ax) * sx);
      set('y1', ay + (g('y1') - ay) * sy);
      set('x2', ax + (g('x2') - ax) * sx);
      set('y2', ay + (g('y2') - ay) * sy);
      return;
    case 'polygon':
    case 'polyline':
      el.setAttribute(
        'points',
        mapPoints(el.getAttribute('points'), (x, y) => [
          ax + (x - ax) * sx,
          ay + (y - ay) * sy,
        ]),
      );
      return;
    case 'text': {
      if (!el.querySelector('tspan[x], tspan[y]') && !/[\s,]/.test((el.getAttribute('x') || '').trim())) {
        const s = Math.sqrt(sx * sy);
        set('font-size', fontSizeOf(el) * s);
        set('x', ax + (g('x') - ax) * s);
        set('y', ay + (g('y') - ay) * s);
        return;
      }
      break;
    }
  }
  const m = currentMatrix(el)
    .translate(ax, ay)
    .scale(sx, sy)
    .translate(-ax, -ay);
  el.setAttribute('transform', fmtMatrix(m));
}

/** Screen point -> an element's own user space. */
export function toLocal(el: Element, clientX: number, clientY: number) {
  const ctm = (el as SVGGraphicsElement).getScreenCTM?.();
  if (!ctm) return new DOMPoint(clientX, clientY);
  return new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
}

export function localBBox(el: Element) {
  try {
    return (el as SVGGraphicsElement).getBBox();
  } catch {
    return null;
  }
}

/** Move an element so its centre sits at the centre of the canvas. */
export function centerElement(svg: SVGSVGElement, el: Element) {
  const box = el.getBoundingClientRect();
  const vb = getViewBox(svg);
  const rootCtm = svg.getScreenCTM();
  const parent = el.parentElement as unknown as SVGGraphicsElement | null;
  if (!rootCtm || !parent?.getScreenCTM) return;
  const target = new DOMPoint(vb.x + vb.w / 2, vb.y + vb.h / 2).matrixTransform(rootCtm);
  const from = toLocal(parent, box.left + box.width / 2, box.top + box.height / 2);
  const to = toLocal(parent, target.x, target.y);
  moveElement(el, to.x - from.x, to.y - from.y);
}

/** Tighten the viewBox around everything that is drawn. */
export function cropToContent(svg: SVGSVGElement): boolean {
  let box: DOMRect;
  try {
    box = svg.getBBox();
  } catch {
    return false;
  }
  if (!box.width && !box.height) return false;
  let stroke = 0;
  svg.querySelectorAll('[stroke-width]').forEach((el) => {
    if (el.getAttribute('stroke') !== 'none') stroke = Math.max(stroke, num(el.getAttribute('stroke-width')));
  });
  const pad = stroke / 2;
  const x = box.x - pad;
  const y = box.y - pad;
  const w = Math.max(1, box.width + pad * 2);
  const h = Math.max(1, box.height + pad * 2);
  svg.setAttribute('viewBox', `${round(x)} ${round(y)} ${round(w)} ${round(h)}`);
  svg.setAttribute('width', String(round(w)));
  svg.setAttribute('height', String(round(h)));
  return true;
}

/* ------------------------------------------------------------------------ */
/* Building                                                                  */
/* ------------------------------------------------------------------------ */

export type ShapeKind = 'rect' | 'circle' | 'ellipse' | 'line' | 'text' | 'star';

function make(doc: Document, tag: string, attrs: Record<string, string | number>) {
  const el = doc.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs))
    el.setAttribute(k, typeof v === 'number' ? String(round(v)) : v);
  return el;
}

function starPoints(cx: number, cy: number, outer: number, inner: number, n = 5) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push(`${round(cx + r * Math.cos(a))},${round(cy + r * Math.sin(a))}`);
  }
  return pts.join(' ');
}

/** Append before the closing tag with a line break so the code stays readable. */
export function appendPretty(parent: Element, el: Element) {
  const doc = parent.ownerDocument;
  const last = parent.lastChild;
  if (last?.nodeType === Node.TEXT_NODE && /^\s*$/.test(last.textContent || '')) {
    parent.insertBefore(doc.createTextNode('\n  '), last);
    parent.insertBefore(el, last);
  } else {
    parent.appendChild(doc.createTextNode('\n  '));
    parent.appendChild(el);
    parent.appendChild(doc.createTextNode('\n'));
  }
}

export function createShape(svg: Element, kind: ShapeKind, color: string) {
  const doc = svg.ownerDocument;
  const d = getViewBox(svg);
  const cx = d.x + d.w / 2;
  const cy = d.y + d.h / 2;
  const s = Math.max(8, Math.min(d.w, d.h) * 0.3);
  switch (kind) {
    case 'rect':
      return make(doc, 'rect', {
        x: cx - s / 2,
        y: cy - s / 2,
        width: s,
        height: s,
        rx: Math.round(s * 0.06),
        fill: color,
      });
    case 'circle':
      return make(doc, 'circle', { cx, cy, r: s / 2, fill: color });
    case 'ellipse':
      return make(doc, 'ellipse', { cx, cy, rx: s / 2, ry: s / 3, fill: color });
    case 'line':
      return make(doc, 'line', {
        x1: cx - s / 2,
        y1: cy,
        x2: cx + s / 2,
        y2: cy,
        stroke: color,
        'stroke-width': Math.max(1, s * 0.06),
        'stroke-linecap': 'round',
      });
    case 'star':
      return make(doc, 'polygon', {
        points: starPoints(cx, cy, s / 2, s / 4.6),
        fill: color,
      });
    case 'text': {
      const el = make(doc, 'text', {
        x: cx,
        y: cy,
        fill: color,
        'font-size': Math.max(10, Math.round(s * 0.5)),
        'font-family': 'system-ui, sans-serif',
        'text-anchor': 'middle',
      });
      el.textContent = 'Text';
      return el;
    }
  }
}

/** Raise to the top of its parent, or drop behind every other drawn sibling. */
export function reorder(el: Element, toFront: boolean) {
  const parent = el.parentElement;
  if (!parent) return;
  if (toFront) {
    parent.appendChild(el);
    return;
  }
  const first = [...parent.children].find(
    (c) => c !== el && !NON_GRAPHIC.has(c.localName.toLowerCase()),
  );
  if (first) parent.insertBefore(el, first);
}

export function svgBytes(code: string) {
  return new TextEncoder().encode(code).length;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Wrap a raster image (as a data URL) in a new SVG document. */
export function embedImageSvg(dataUrl: string, w: number, h: number) {
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n  <image href="${dataUrl}" width="${w}" height="${h}"/>\n</svg>`;
}

export function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function imageSize(src: string) {
  return new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 300, h: img.naturalHeight || 300 });
    img.onerror = () => reject(new Error('That image could not be read.'));
    img.src = src;
  });
}

export const isSvgFile = (f: File) =>
  f.type === 'image/svg+xml' || /\.svgz?$/i.test(f.name);
export const isRasterFile = (f: File) =>
  !isSvgFile(f) &&
  (f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif|ico)$/i.test(f.name));

export const baseName = (name: string) =>
  name.replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*]+/g, '-').trim() || 'drawing';
