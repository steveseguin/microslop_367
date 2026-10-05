/**
 * A conservative SVG optimizer. It only does things that cannot change how the
 * drawing looks: drop comments, editor metadata and empty groups, and round
 * numbers. Path data is tokenized properly (arc flags included) before it is
 * rewritten, so rounding can never merge two numbers into one.
 */
import { parseSvg, serializeSvg, svgBytes } from './svgCore';

export interface OptimizeOptions {
  /** Decimal places to keep in coordinates. */
  decimals: number;
  /** Remove indentation and line breaks between tags. */
  minify: boolean;
}

const EDITOR_NS = [
  'http://www.inkscape.org/namespaces/inkscape',
  'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
  'http://www.bohemiancoding.com/sketch/ns',
  'http://www.serif.com/',
  'http://ns.adobe.com/',
  'http://purl.org/dc/elements/1.1/',
  'http://creativecommons.org/ns#',
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
];
const isEditorNs = (ns: string | null) => !!ns && EDITOR_NS.some((n) => ns.startsWith(n));
const XMLNS = 'http://www.w3.org/2000/xmlns/';
const XLINK = 'http://www.w3.org/1999/xlink';

const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/y;
const ARGS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

function fmt(n: number, decimals: number) {
  const f = 10 ** decimals;
  let v = Math.round(n * f) / f;
  if (Object.is(v, -0)) v = 0;
  return String(v);
}

/** Tokenize and re-emit path data, rounding every coordinate. Null = leave as-is. */
export function roundPathData(d: string, decimals: number): string | null {
  const out: string[] = [];
  let i = 0;
  let cmd = '';
  let argIndex = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i++;
  };
  skip();
  while (i < d.length) {
    const c = d[i];
    if (/[a-zA-Z]/.test(c)) {
      if (!(c.toLowerCase() in ARGS)) return null;
      cmd = c;
      argIndex = 0;
      out.push(c);
      i++;
      skip();
      continue;
    }
    if (!cmd) return null;
    const lower = cmd.toLowerCase();
    if (lower === 'z') return null;
    const slot = argIndex % ARGS[lower];
    if (lower === 'a' && (slot === 3 || slot === 4)) {
      if (c !== '0' && c !== '1') return null;
      out.push(c);
      i++;
    } else {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(d);
      if (!m) return null;
      out.push(fmt(parseFloat(m[0]), decimals));
      i += m[0].length;
    }
    argIndex++;
    skip();
  }
  // Separate every token with a space: always valid and still compact.
  return out.join(' ').replace(/([a-zA-Z]) /g, '$1');
}

/** Round plain numbers inside attribute values that have no flags. */
function roundList(value: string, decimals: number) {
  return value.replace(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g, (token, offset: number) => {
    if (!/[.eE]/.test(token)) return token;
    const before = value[offset - 1];
    const glued = before !== undefined && /[\d.]/.test(before);
    return (glued ? ' ' : '') + fmt(parseFloat(token), decimals);
  });
}

const NUMERIC_ATTRS = new Set([
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'fx',
  'fy',
  'width',
  'height',
  'points',
  'viewBox',
  'transform',
  'gradientTransform',
  'patternTransform',
  'stroke-width',
  'font-size',
  'stroke-dasharray',
  'stroke-dashoffset',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'stop-opacity',
  'offset',
]);

const KEEP_WHITESPACE = new Set(['text', 'tspan', 'textPath', 'title', 'desc', 'style']);

export function optimizeSvg(code: string, options: OptimizeOptions) {
  const before = svgBytes(code);
  const { svg, error } = parseSvg(code);
  if (!svg) throw new Error(error || 'There is no SVG to optimize.');
  if (error) throw new Error(`Fix the code first: ${error}`);
  const doc = svg.ownerDocument;

  // Comments and processing instructions.
  const walker = doc.createTreeWalker(svg, NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_PROCESSING_INSTRUCTION);
  const junk: Node[] = [];
  while (walker.nextNode()) junk.push(walker.currentNode);
  junk.forEach((n) => n.parentNode?.removeChild(n));

  // Editor metadata elements and attributes.
  svg.querySelectorAll('*').forEach((el) => {
    if (el.localName === 'metadata' || isEditorNs(el.namespaceURI)) el.remove();
  });
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    for (const attr of [...el.attributes]) {
      if (
        isEditorNs(attr.namespaceURI) ||
        (attr.namespaceURI === XMLNS && isEditorNs(attr.value)) ||
        attr.name === 'data-name' ||
        (el === svg && (attr.name === 'version' || attr.name === 'enable-background'))
      )
        el.removeAttributeNode(attr);
    }
  }
  const usesXlink = [...svg.querySelectorAll('*')].some((el) =>
    [...el.attributes].some((a) => a.namespaceURI === XLINK),
  );
  if (!usesXlink) svg.removeAttribute('xmlns:xlink');

  // Empty groups and defs (repeat: removing one can empty its parent).
  for (let changed = true; changed; ) {
    changed = false;
    svg.querySelectorAll('g, defs').forEach((el) => {
      if (!el.children.length && !el.textContent?.trim() && !el.id) {
        el.remove();
        changed = true;
      }
    });
  }

  // Numbers.
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    for (const attr of [...el.attributes]) {
      if (attr.name === 'd') {
        const next = roundPathData(attr.value, options.decimals);
        if (next !== null) el.setAttribute('d', next);
      } else if (NUMERIC_ATTRS.has(attr.name)) {
        el.setAttribute(attr.name, roundList(attr.value, options.decimals).trim());
      }
    }
  }

  if (options.minify) {
    const texts = doc.createTreeWalker(svg, NodeFilter.SHOW_TEXT);
    const blanks: Node[] = [];
    while (texts.nextNode()) {
      const node = texts.currentNode;
      const parent = node.parentElement;
      if (!node.textContent?.trim() && parent && !KEEP_WHITESPACE.has(parent.localName))
        blanks.push(node);
    }
    blanks.forEach((n) => n.parentNode?.removeChild(n));
  }

  const result = serializeSvg(svg);
  return { code: result, before, after: svgBytes(result) };
}
