import {
  PDFArray,
  PDFContentStream,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  StandardFonts,
  decodePDFRawStream,
} from 'pdf-lib';
import type { PDFDocument, PDFObject, PDFPage } from 'pdf-lib';
import type { PDFPageProxy, PageViewport } from 'pdfjs-dist';
import { Util } from 'pdfjs-dist';

/**
 * Editing existing PDF text.
 *
 * A PDF has no paragraphs, only positioned glyph runs. We read those runs with
 * PDF.js, group them into visual lines, and let the user retype a line. On
 * commit the original line is REMOVED from the page's content stream (so the
 * old words are really gone, not hidden under a white box) and the new text is
 * drawn at the same baseline in the closest standard font.
 */

export type FontKind = 'sans' | 'serif' | 'mono';

export interface TextLine {
  id: string;
  text: string;
  /** User-space geometry (PDF points), unrotated page coordinates. */
  x: number;
  baseline: number;
  width: number;
  size: number;
  /** Viewport geometry (canvas pixels) for the overlay. */
  left: number;
  top: number;
  boxWidth: number;
  boxHeight: number;
  kind: FontKind;
  bold: boolean;
  italic: boolean;
  /** Painting order; a later line covers an earlier one. */
  order: number;
}

interface RawItem {
  str: string;
  transform: number[];
  width: number;
  fontName: string;
  hasEOL?: boolean;
}

function fontInfo(page: PDFPageProxy, fontName: string, family?: string) {
  let bold = false;
  let italic = false;
  let name = '';
  try {
    const font = page.commonObjs.get(fontName) as {
      bold?: boolean;
      black?: boolean;
      italic?: boolean;
      fallbackName?: string;
      loadedName?: string;
    };
    bold = !!(font?.bold || font?.black);
    italic = !!font?.italic;
    name = `${font?.fallbackName ?? ''}`;
  } catch {
    /* Font not resolved; fall back to the style family only. */
  }
  const generic = `${family ?? ''} ${name}`.toLowerCase();
  const kind: FontKind = /mono|courier/.test(generic)
    ? 'mono'
    : /serif/.test(generic) && !/sans/.test(generic)
      ? 'serif'
      : 'sans';
  return { kind, bold, italic };
}

/** Group PDF.js text items into editable visual lines. */
export async function extractLines(
  page: PDFPageProxy,
  view: PageViewport,
): Promise<TextLine[]> {
  const content = await page.getTextContent();
  const items: (RawItem & { order: number })[] = [];
  content.items.forEach((item, order) => {
    // Whitespace-only runs are PDF.js's own spacing guesses; real gaps are
    // measured below, so these must not bridge two separate columns.
    if (!('str' in item) || !item.str.trim()) return;
    const t = item.transform;
    // Only horizontal, upright text is editable in place.
    if (Math.abs(t[1]) > 1e-3 || Math.abs(t[2]) > 1e-3 || t[0] <= 0 || t[3] <= 0)
      return;
    items.push({ ...(item as RawItem), order });
  });

  type Group = { items: typeof items; size: number; baseline: number; end: number };
  const groups: Group[] = [];
  for (const item of items) {
    const size = item.transform[3];
    const x = item.transform[4];
    const baseline = item.transform[5];
    const last = groups[groups.length - 1];
    const sameLine =
      last &&
      Math.abs(last.baseline - baseline) < size * 0.3 &&
      Math.abs(last.size - size) < size * 0.35 &&
      x >= last.end - size * 0.5 &&
      x - last.end < size * 1.2;
    if (sameLine && last) {
      last.items.push(item);
      last.end = Math.max(last.end, x + item.width);
    } else {
      groups.push({ items: [item], size, baseline, end: x + item.width });
    }
  }

  const lines: TextLine[] = [];
  groups.forEach((group, index) => {
    let text = '';
    let prevEnd: number | null = null;
    for (const item of group.items) {
      const x = item.transform[4];
      if (
        prevEnd !== null &&
        x - prevEnd > group.size * 0.15 &&
        !text.endsWith(' ') &&
        !item.str.startsWith(' ')
      )
        text += ' ';
      text += item.str;
      prevEnd = x + item.width;
    }
    text = text.replace(/\s+$/, '');
    if (!text.trim()) return;
    const first = group.items[0];
    const x = first.transform[4];
    const width = group.end - x;
    const size = group.size;
    const style = content.styles[first.fontName] as { fontFamily?: string } | undefined;
    const { kind, bold, italic } = fontInfo(page, first.fontName, style?.fontFamily);
    // Box from ascender (~0.9em above baseline) to descender (~0.25em below).
    const topLeft = Util.transform(view.transform, [1, 0, 0, 1, x, group.baseline + size * 0.92]);
    const bottomRight = Util.transform(view.transform, [1, 0, 0, 1, x + width, group.baseline - size * 0.26]);
    const left = Math.min(topLeft[4], bottomRight[4]);
    const top = Math.min(topLeft[5], bottomRight[5]);
    lines.push({
      id: `${index}`,
      text,
      x,
      baseline: group.baseline,
      width,
      size,
      left,
      top,
      boxWidth: Math.abs(bottomRight[4] - topLeft[4]),
      boxHeight: Math.abs(bottomRight[5] - topLeft[5]),
      kind,
      bold,
      italic,
      order: Math.max(...group.items.map((i) => i.order)),
    });
  });

  // Where two lines sit on top of each other, only the one painted last is
  // visible, so only that one is offered for editing.
  return lines.filter(
    (line) =>
      !lines.some(
        (other) =>
          other !== line &&
          other.order > line.order &&
          Math.abs(other.baseline - line.baseline) < line.size * 0.4 &&
          overlap(line, other) > 0.5,
      ),
  );
}

function overlap(a: TextLine, b: TextLine) {
  const start = Math.max(a.x, b.x);
  const end = Math.min(a.x + a.width, b.x + b.width);
  return Math.max(0, end - start) / Math.max(1, Math.min(a.width, b.width));
}

export function standardFont(kind: FontKind, bold: boolean, italic: boolean) {
  if (kind === 'mono')
    return bold
      ? italic
        ? StandardFonts.CourierBoldOblique
        : StandardFonts.CourierBold
      : italic
        ? StandardFonts.CourierOblique
        : StandardFonts.Courier;
  if (kind === 'serif')
    return bold
      ? italic
        ? StandardFonts.TimesRomanBoldItalic
        : StandardFonts.TimesRomanBold
      : italic
        ? StandardFonts.TimesRomanItalic
        : StandardFonts.TimesRoman;
  return bold
    ? italic
      ? StandardFonts.HelveticaBoldOblique
      : StandardFonts.HelveticaBold
    : italic
      ? StandardFonts.HelveticaOblique
      : StandardFonts.Helvetica;
}

/* -------------------------------------------------------------------------
   Content-stream text removal
   ------------------------------------------------------------------------- */

type Token =
  | { type: 'num'; value: number; start: number; end: number }
  | { type: 'str'; bytes: number[]; start: number; end: number }
  | { type: 'name'; value: string; start: number; end: number }
  | { type: 'arr'; items: Token[]; start: number; end: number }
  | { type: 'other'; start: number; end: number }
  | { type: 'op'; value: string; start: number; end: number };

const WS = new Set([0, 9, 10, 12, 13, 32]);
const DELIM = new Set([40, 41, 60, 62, 91, 93, 123, 125, 47, 37]);

class Lexer {
  pos = 0;
  private b: Uint8Array;
  constructor(b: Uint8Array) {
    this.b = b;
  }

  skipSpace() {
    const b = this.b;
    while (this.pos < b.length) {
      if (WS.has(b[this.pos])) this.pos++;
      else if (b[this.pos] === 37) {
        while (this.pos < b.length && b[this.pos] !== 10 && b[this.pos] !== 13) this.pos++;
      } else break;
    }
  }

  next(): Token | null {
    this.skipSpace();
    const b = this.b;
    if (this.pos >= b.length) return null;
    const start = this.pos;
    const c = b[this.pos];
    if (c === 40) return { type: 'str', bytes: this.literal(), start, end: this.pos };
    if (c === 60 && b[this.pos + 1] === 60) {
      this.dict();
      return { type: 'other', start, end: this.pos };
    }
    if (c === 60) return { type: 'str', bytes: this.hex(), start, end: this.pos };
    if (c === 91) {
      this.pos++;
      const items: Token[] = [];
      for (;;) {
        this.skipSpace();
        if (this.pos >= b.length) break;
        if (b[this.pos] === 93) {
          this.pos++;
          break;
        }
        const t = this.next();
        if (!t) break;
        items.push(t);
      }
      return { type: 'arr', items, start, end: this.pos };
    }
    if (c === 47) {
      this.pos++;
      while (this.pos < b.length && !WS.has(b[this.pos]) && !DELIM.has(b[this.pos])) this.pos++;
      return { type: 'name', value: String.fromCharCode(...b.subarray(start + 1, this.pos)), start, end: this.pos };
    }
    if (c === 93 || c === 41 || c === 62 || c === 123 || c === 125) {
      this.pos++;
      return { type: 'other', start, end: this.pos };
    }
    while (this.pos < b.length && !WS.has(b[this.pos]) && !DELIM.has(b[this.pos])) this.pos++;
    const word = String.fromCharCode(...b.subarray(start, this.pos));
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(word))
      return { type: 'num', value: Number(word), start, end: this.pos };
    if (word === 'true' || word === 'false' || word === 'null')
      return { type: 'other', start, end: this.pos };
    if (word === 'ID') this.inlineImage();
    return { type: 'op', value: word, start, end: this.pos };
  }

  private literal() {
    const b = this.b;
    const out: number[] = [];
    let depth = 1;
    this.pos++;
    while (this.pos < b.length) {
      const c = b[this.pos++];
      if (c === 92) {
        const n = b[this.pos++];
        if (n >= 48 && n <= 55) {
          let v = n - 48;
          for (let k = 0; k < 2 && b[this.pos] >= 48 && b[this.pos] <= 55; k++)
            v = v * 8 + (b[this.pos++] - 48);
          out.push(v & 255);
        } else if (n === 110) out.push(10);
        else if (n === 114) out.push(13);
        else if (n === 116) out.push(9);
        else if (n === 98) out.push(8);
        else if (n === 102) out.push(12);
        else if (n === 13) {
          if (b[this.pos] === 10) this.pos++;
        } else if (n !== 10) out.push(n);
      } else if (c === 40) {
        depth++;
        out.push(c);
      } else if (c === 41) {
        if (--depth === 0) break;
        out.push(c);
      } else out.push(c);
    }
    return out;
  }

  private hex() {
    const b = this.b;
    this.pos++;
    let digits = '';
    while (this.pos < b.length && b[this.pos] !== 62) {
      if (!WS.has(b[this.pos])) digits += String.fromCharCode(b[this.pos]);
      this.pos++;
    }
    this.pos++;
    if (digits.length % 2) digits += '0';
    const out: number[] = [];
    for (let i = 0; i < digits.length; i += 2) out.push(parseInt(digits.slice(i, i + 2), 16) || 0);
    return out;
  }

  private dict() {
    const b = this.b;
    let depth = 0;
    while (this.pos < b.length) {
      if (b[this.pos] === 60 && b[this.pos + 1] === 60) {
        depth++;
        this.pos += 2;
      } else if (b[this.pos] === 62 && b[this.pos + 1] === 62) {
        depth--;
        this.pos += 2;
        if (!depth) return;
      } else if (b[this.pos] === 40) this.literal();
      else this.pos++;
    }
  }

  private inlineImage() {
    const b = this.b;
    this.pos++;
    while (this.pos < b.length - 2) {
      if (
        b[this.pos] === 69 &&
        b[this.pos + 1] === 73 &&
        WS.has(b[this.pos - 1]) &&
        (this.pos + 2 >= b.length || WS.has(b[this.pos + 2]))
      ) {
        this.pos += 2;
        return;
      }
      this.pos++;
    }
    this.pos = b.length;
  }
}

const fmt = (n: number) => (Math.round(n * 1000) / 1000).toString();

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const mul = (m1: number[], m2: number[]): Matrix => [
  m1[0] * m2[0] + m1[1] * m2[2],
  m1[0] * m2[1] + m1[1] * m2[3],
  m1[2] * m2[0] + m1[3] * m2[2],
  m1[2] * m2[1] + m1[3] * m2[3],
  m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
  m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
];

interface FontMetrics {
  twoByte: boolean;
  width: (code: number) => number;
}

function lookup(pdf: PDFDocument, obj: PDFObject | undefined): PDFObject | undefined {
  return obj instanceof PDFRef ? pdf.context.lookup(obj) : obj;
}

function metricsFor(pdf: PDFDocument, fonts: PDFDict | undefined, name: string): FontMetrics {
  const fallback: FontMetrics = { twoByte: false, width: () => 500 };
  const font = lookup(pdf, fonts?.get(PDFName.of(name)));
  if (!(font instanceof PDFDict)) return fallback;
  const subtype = font.get(PDFName.of('Subtype'))?.toString();
  if (subtype === '/Type0') {
    const descendants = lookup(pdf, font.get(PDFName.of('DescendantFonts')));
    const cid = descendants instanceof PDFArray ? lookup(pdf, descendants.get(0)) : undefined;
    const widths = new Map<number, number>();
    let dw = 1000;
    if (cid instanceof PDFDict) {
      const d = lookup(pdf, cid.get(PDFName.of('DW')));
      if (d instanceof PDFNumber) dw = d.asNumber();
      const w = lookup(pdf, cid.get(PDFName.of('W')));
      if (w instanceof PDFArray) {
        const arr = w.asArray().map((o) => lookup(pdf, o));
        for (let i = 0; i < arr.length; ) {
          const first = arr[i];
          const second = arr[i + 1];
          if (!(first instanceof PDFNumber)) break;
          if (second instanceof PDFArray) {
            second.asArray().forEach((v, k) => {
              const n = lookup(pdf, v);
              if (n instanceof PDFNumber) widths.set(first.asNumber() + k, n.asNumber());
            });
            i += 2;
          } else {
            const last = arr[i + 1];
            const value = arr[i + 2];
            if (last instanceof PDFNumber && value instanceof PDFNumber)
              for (let c = first.asNumber(); c <= last.asNumber(); c++) widths.set(c, value.asNumber());
            i += 3;
          }
        }
      }
    }
    return { twoByte: true, width: (code) => widths.get(code) ?? dw };
  }
  const firstChar = lookup(pdf, font.get(PDFName.of('FirstChar')));
  const widths = lookup(pdf, font.get(PDFName.of('Widths')));
  if (firstChar instanceof PDFNumber && widths instanceof PDFArray) {
    const start = firstChar.asNumber();
    const values = widths.asArray().map((o) => {
      const n = lookup(pdf, o);
      return n instanceof PDFNumber ? n.asNumber() : 500;
    });
    return { twoByte: false, width: (code) => values[code - start] ?? 500 };
  }
  return fallback;
}

function readContent(pdf: PDFDocument, page: PDFPage) {
  const contents = lookup(pdf, page.node.get(PDFName.of('Contents')));
  const streams = contents instanceof PDFArray ? contents.asArray().map((o) => lookup(pdf, o)) : [contents];
  const parts: Uint8Array[] = [];
  for (const stream of streams) {
    if (stream instanceof PDFRawStream) parts.push(decodePDFRawStream(stream).decode());
    else if (stream instanceof PDFContentStream) parts.push(stream.getUnencodedContents());
    else if (stream) return null;
  }
  const total = parts.reduce((n, p) => n + p.length + 1, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
    out[offset++] = 10;
  }
  return out;
}

export interface RemovalBox {
  x: number;
  baseline: number;
  width: number;
  size: number;
}

/**
 * Remove every text-showing operator whose glyphs START inside `box` on this
 * page's own content streams. Returns how many operators were removed (0 when
 * the text lives somewhere we do not rewrite, such as a form XObject).
 */
export function removeTextInBox(pdf: PDFDocument, pageIndex: number, box: RemovalBox) {
  const tolX = box.size * 0.6;
  const tolY = box.size * 0.45;
  return removeText(
    pdf,
    pageIndex,
    (x, y) =>
      x >= box.x - tolX &&
      x <= box.x + box.width + tolX * 0.25 &&
      Math.abs(y - box.baseline) <= tolY,
  );
}

/** Remove text whose glyph run starts inside a user-space rectangle. */
export function removeTextInRect(
  pdf: PDFDocument,
  pageIndex: number,
  rect: { x0: number; y0: number; x1: number; y1: number },
) {
  return removeText(
    pdf,
    pageIndex,
    (x, y) => x >= rect.x0 && x <= rect.x1 && y >= rect.y0 && y <= rect.y1,
  );
}

function removeText(
  pdf: PDFDocument,
  pageIndex: number,
  hits: (x: number, y: number) => boolean,
) {
  const page = pdf.getPage(pageIndex);
  const bytes = readContent(pdf, page);
  if (!bytes) return 0;
  const resources = lookup(pdf, page.node.Resources());
  const fonts = resources instanceof PDFDict ? lookup(pdf, resources.get(PDFName.of('Font'))) : undefined;
  const fontDict = fonts instanceof PDFDict ? fonts : undefined;
  const metricsCache = new Map<string, FontMetrics>();

  const lexer = new Lexer(bytes);
  const cuts: [number, number, string][] = [];
  let operands: Token[] = [];
  let ctm: Matrix = IDENTITY;
  const stack: Matrix[] = [];
  let tm: Matrix = IDENTITY;
  let tlm: Matrix = IDENTITY;
  let fontSize = 0;
  let metrics: FontMetrics = { twoByte: false, width: () => 500 };
  let tc = 0;
  let tw = 0;
  let th = 1;
  let tl = 0;
  let rise = 0;

  const inside = () => {
    const m = mul(tm, ctm);
    return hits(m[4] + m[2] * rise, m[5] + m[3] * rise);
  };
  const advance = (str: number[]) => {
    const step = metrics.twoByte ? 2 : 1;
    let tx = 0;
    for (let i = 0; i + step - 1 < str.length; i += step) {
      const code = metrics.twoByte ? (str[i] << 8) | str[i + 1] : str[i];
      tx += ((metrics.width(code) / 1000) * fontSize + tc + (!metrics.twoByte && code === 32 ? tw : 0)) * th;
    }
    tm = mul([1, 0, 0, 1, tx, 0], tm);
    return tx;
  };
  const nextLine = () => {
    tlm = mul([1, 0, 0, 1, 0, -tl], tlm);
    tm = tlm;
  };
  /* A removed show operator is replaced by an empty `[n] TJ` that moves the
     text cursor by the same distance, so text that follows on the same line
     without its own positioning stays exactly where it was. */
  const show = (start: number, end: number, run: () => number, prefix = '') => {
    const hit = inside();
    const tx = run();
    if (!hit) return;
    const scale = fontSize * th;
    const move = scale ? ` [${fmt((-tx * 1000) / scale)}] TJ ` : ' ';
    cuts.push([start, end, `${prefix}${move}`]);
  };

  for (let token = lexer.next(); token; token = lexer.next()) {
    if (token.type !== 'op') {
      operands.push(token);
      continue;
    }
    const nums = operands.map((t) => (t.type === 'num' ? t.value : 0));
    const opStart = operands.length ? operands[0].start : token.start;
    switch (token.value) {
      case 'q':
        stack.push(ctm);
        break;
      case 'Q':
        ctm = stack.pop() ?? IDENTITY;
        break;
      case 'cm':
        if (nums.length === 6) ctm = mul(nums, ctm);
        break;
      case 'BT':
        tm = IDENTITY;
        tlm = IDENTITY;
        break;
      case 'Tf': {
        const name = operands[0]?.type === 'name' ? operands[0].value : '';
        fontSize = nums[1] ?? 0;
        if (!metricsCache.has(name)) metricsCache.set(name, metricsFor(pdf, fontDict, name));
        metrics = metricsCache.get(name)!;
        break;
      }
      case 'Tc':
        tc = nums[0] ?? 0;
        break;
      case 'Tw':
        tw = nums[0] ?? 0;
        break;
      case 'Tz':
        th = (nums[0] ?? 100) / 100;
        break;
      case 'TL':
        tl = nums[0] ?? 0;
        break;
      case 'Ts':
        rise = nums[0] ?? 0;
        break;
      case 'Td':
        tlm = mul([1, 0, 0, 1, nums[0] ?? 0, nums[1] ?? 0], tlm);
        tm = tlm;
        break;
      case 'TD':
        tl = -(nums[1] ?? 0);
        tlm = mul([1, 0, 0, 1, nums[0] ?? 0, nums[1] ?? 0], tlm);
        tm = tlm;
        break;
      case 'Tm':
        if (nums.length === 6) {
          tlm = nums as Matrix;
          tm = tlm;
        }
        break;
      case 'T*':
        nextLine();
        break;
      case 'Tj': {
        const s = operands[0];
        show(opStart, token.end, () => (s?.type === 'str' ? advance(s.bytes) : 0));
        break;
      }
      case "'": {
        nextLine();
        const s = operands[0];
        show(opStart, token.end, () => (s?.type === 'str' ? advance(s.bytes) : 0), ' T*');
        break;
      }
      case '"': {
        tw = nums[0] ?? tw;
        tc = nums[1] ?? tc;
        nextLine();
        const s = operands[2];
        show(
          opStart,
          token.end,
          () => (s?.type === 'str' ? advance(s.bytes) : 0),
          ` ${fmt(tw)} Tw ${fmt(tc)} Tc T*`,
        );
        break;
      }
      case 'TJ': {
        const arr = operands[0];
        show(opStart, token.end, () => {
          if (arr?.type !== 'arr') return 0;
          let tx = 0;
          for (const part of arr.items) {
            if (part.type === 'str') tx += advance(part.bytes);
            else if (part.type === 'num') {
              const move = (-part.value / 1000) * fontSize * th;
              tm = mul([1, 0, 0, 1, move, 0], tm);
              tx += move;
            }
          }
          return tx;
        });
        break;
      }
    }
    operands = [];
  }

  if (!cuts.length) return 0;
  const parts: Uint8Array[] = [];
  let last = 0;
  const encoder = new TextEncoder();
  for (const [start, end, replacement] of cuts) {
    parts.push(bytes.subarray(last, start));
    parts.push(encoder.encode(replacement));
    last = end;
  }
  parts.push(bytes.subarray(last));
  const size = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  const stream = pdf.context.flateStream(out);
  page.node.set(PDFName.of('Contents'), pdf.context.register(stream));
  return cuts.length;
}
