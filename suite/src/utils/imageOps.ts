/**
 * Pixel and canvas operations for NinjaImage. Everything here works on plain
 * ImageData / canvases so it behaves the same in every browser (Safari has no
 * `ctx.filter`), and nothing here touches React.
 */

export interface AdjustParams {
  exposure: number; // -100..100  (±2 stops)
  brightness: number; // -100..100
  contrast: number; // -100..100
  highlights: number; // -100..100
  shadows: number; // -100..100
  saturation: number; // -100..100
  vibrance: number; // -100..100
  hue: number; // -180..180 degrees
  temperature: number; // -100 cool .. 100 warm
  tint: number; // -100 green .. 100 magenta
  sepia: number; // 0..100
  invert: number; // 0 or 1
  blur: number; // 0..40 px
  sharpen: number; // 0..100
  vignette: number; // -100 (light) .. 100 (dark)
}

export const DEFAULT_ADJUST: AdjustParams = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  vibrance: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
  sepia: 0,
  invert: 0,
  blur: 0,
  sharpen: 0,
  vignette: 0,
};

export const PRESETS: { id: string; label: string; params: Partial<AdjustParams> }[] = [
  { id: 'none', label: 'Original', params: {} },
  { id: 'grayscale', label: 'Grayscale', params: { saturation: -100 } },
  { id: 'sepia', label: 'Sepia', params: { sepia: 100 } },
  { id: 'invert', label: 'Invert', params: { invert: 1 } },
  {
    id: 'vintage',
    label: 'Vintage',
    params: { sepia: 45, contrast: -12, brightness: 6, temperature: 18, vignette: 45, saturation: -15 },
  },
  { id: 'vivid', label: 'Vivid', params: { saturation: 30, vibrance: 35, contrast: 15 } },
  { id: 'cool', label: 'Cool', params: { temperature: -40, tint: -5, contrast: 5 } },
  { id: 'warm', label: 'Warm', params: { temperature: 40, vibrance: 10 } },
  { id: 'bw', label: 'B&W high contrast', params: { saturation: -100, contrast: 55, shadows: -15 } },
  { id: 'fade', label: 'Faded', params: { contrast: -30, brightness: 12, saturation: -25, shadows: 25 } },
  { id: 'drama', label: 'Dramatic', params: { contrast: 35, highlights: -40, shadows: 30, vignette: 40, vibrance: 15 } },
];

export const isNeutral = (p: AdjustParams) =>
  (Object.keys(DEFAULT_ADJUST) as (keyof AdjustParams)[]).every(
    (k) => p[k] === DEFAULT_ADJUST[k],
  );

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/* ------------------------------------------------------------------ */
/* Canvas helpers                                                      */
/* ------------------------------------------------------------------ */

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function ctx2d(c: HTMLCanvasElement) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  return ctx;
}

export function cloneCanvas(src: HTMLCanvasElement) {
  const c = makeCanvas(src.width, src.height);
  ctx2d(c).drawImage(src, 0, 0);
  return c;
}

export function readPixels(c: HTMLCanvasElement) {
  return ctx2d(c).getImageData(0, 0, c.width, c.height);
}

export function canvasFrom(data: ImageData) {
  const c = makeCanvas(data.width, data.height);
  ctx2d(c).putImageData(data, 0, 0);
  return c;
}

/** Good-quality resample: halve repeatedly, then a final smoothed draw. */
export function resample(src: HTMLCanvasElement, w: number, h: number) {
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  let cur = src;
  while (cur.width / 2 >= w && cur.height / 2 >= h) {
    const half = makeCanvas(Math.round(cur.width / 2), Math.round(cur.height / 2));
    const hc = ctx2d(half);
    hc.imageSmoothingQuality = 'high';
    hc.drawImage(cur, 0, 0, half.width, half.height);
    cur = half;
  }
  const out = makeCanvas(w, h);
  const oc = ctx2d(out);
  oc.imageSmoothingEnabled = true;
  oc.imageSmoothingQuality = 'high';
  oc.drawImage(cur, 0, 0, w, h);
  return out;
}

export function rotate90(src: HTMLCanvasElement, clockwise: boolean) {
  const out = makeCanvas(src.height, src.width);
  const c = ctx2d(out);
  c.translate(out.width / 2, out.height / 2);
  c.rotate(((clockwise ? 90 : -90) * Math.PI) / 180);
  c.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

export function flip(src: HTMLCanvasElement, horizontal: boolean) {
  const out = makeCanvas(src.width, src.height);
  const c = ctx2d(out);
  if (horizontal) {
    c.translate(out.width, 0);
    c.scale(-1, 1);
  } else {
    c.translate(0, out.height);
    c.scale(1, -1);
  }
  c.drawImage(src, 0, 0);
  return out;
}

export type StraightenMode = 'crop' | 'expand';

/** Output size of a free rotation: grown to hold every pixel, or the largest
 *  same-shape rectangle with no empty corners. */
export function straightenSize(
  w: number,
  h: number,
  degrees: number,
  mode: StraightenMode,
) {
  const t = (Math.abs(degrees) * Math.PI) / 180;
  const c = Math.abs(Math.cos(t));
  const s = Math.abs(Math.sin(t));
  if (mode === 'expand')
    return { w: Math.round(w * c + h * s), h: Math.round(w * s + h * c) };
  const k = Math.max((w * c + h * s) / w, (w * s + h * c) / h);
  return { w: Math.max(1, Math.round(w / k)), h: Math.max(1, Math.round(h / k)) };
}

export function straighten(
  src: HTMLCanvasElement,
  degrees: number,
  mode: StraightenMode,
  /** Scale the source is drawn at relative to the size reported for it. */
  outSize = straightenSize(src.width, src.height, degrees, mode),
) {
  const out = makeCanvas(outSize.w, outSize.h);
  const c = ctx2d(out);
  c.imageSmoothingQuality = 'high';
  c.translate(out.width / 2, out.height / 2);
  c.rotate((degrees * Math.PI) / 180);
  c.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function crop(src: HTMLCanvasElement, r: Rect) {
  const x = clamp(Math.round(r.x), 0, src.width - 1);
  const y = clamp(Math.round(r.y), 0, src.height - 1);
  const w = clamp(Math.round(r.w), 1, src.width - x);
  const h = clamp(Math.round(r.h), 1, src.height - y);
  const out = makeCanvas(w, h);
  ctx2d(out).drawImage(src, x, y, w, h, 0, 0, w, h);
  return out;
}

/** Anchor: 0..8, row-major over a 3×3 grid (0 = top-left, 4 = centre). */
export function canvasResize(
  src: HTMLCanvasElement,
  w: number,
  h: number,
  anchor: number,
  fill: string | null,
) {
  const out = makeCanvas(w, h);
  const c = ctx2d(out);
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(0, 0, out.width, out.height);
  }
  const ax = anchor % 3;
  const ay = Math.floor(anchor / 3);
  const x = Math.round(((out.width - src.width) * ax) / 2);
  const y = Math.round(((out.height - src.height) * ay) / 2);
  c.drawImage(src, x, y);
  return out;
}

/** Paint a colour under every transparent or semi-transparent pixel. */
export function flatten(src: HTMLCanvasElement, color: string) {
  const out = makeCanvas(src.width, src.height);
  const c = ctx2d(out);
  c.fillStyle = color;
  c.fillRect(0, 0, out.width, out.height);
  c.drawImage(src, 0, 0);
  return out;
}

/* ------------------------------------------------------------------ */
/* Colour                                                              */
/* ------------------------------------------------------------------ */

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/* ------------------------------------------------------------------ */
/* Adjustments                                                         */
/* ------------------------------------------------------------------ */

/** Three passes of a premultiplied box blur ≈ Gaussian. Alpha-aware. */
function blurFloat(src: Float32Array, w: number, h: number, radius: number) {
  const r = Math.max(1, Math.round(radius));
  const tmp = new Float32Array(src.length);
  const a = src;
  const b = tmp;
  const pass = (from: Float32Array, to: Float32Array, horizontal: boolean) => {
    const len = horizontal ? w : h;
    const lines = horizontal ? h : w;
    const step = horizontal ? 4 : w * 4;
    const norm = 1 / (2 * r + 1);
    for (let line = 0; line < lines; line++) {
      const base = horizontal ? line * w * 4 : line * 4;
      for (let ch = 0; ch < 4; ch++) {
        let sum = 0;
        for (let i = -r; i <= r; i++)
          sum += from[base + clamp(i, 0, len - 1) * step + ch];
        for (let i = 0; i < len; i++) {
          to[base + i * step + ch] = sum * norm;
          const add = clamp(i + r + 1, 0, len - 1);
          const drop = clamp(i - r, 0, len - 1);
          sum += from[base + add * step + ch] - from[base + drop * step + ch];
        }
      }
    }
  };
  for (let k = 0; k < 3; k++) {
    pass(a, b, true);
    pass(b, a, false);
  }
  return a;
}

function premultiplied(d: Uint8ClampedArray) {
  const f = new Float32Array(d.length);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    f[i] = d[i] * a;
    f[i + 1] = d[i + 1] * a;
    f[i + 2] = d[i + 2] * a;
    f[i + 3] = d[i + 3];
  }
  return f;
}

function unpremultiply(f: Float32Array, d: Uint8ClampedArray) {
  for (let i = 0; i < d.length; i += 4) {
    const a = f[i + 3];
    const k = a > 0 ? 255 / a : 0;
    d[i] = f[i] * k;
    d[i + 1] = f[i + 1] * k;
    d[i + 2] = f[i + 2] * k;
    d[i + 3] = a;
  }
}

/**
 * Apply every adjustment in one pass (plus blur/sharpen passes when used).
 * `scale` is the size of `src` relative to the full image, so blur radii look
 * the same on a downscaled preview as on the final result.
 */
export function adjustImageData(
  src: ImageData,
  p: AdjustParams,
  scale = 1,
): ImageData {
  const { width: w, height: h } = src;
  const out = new ImageData(new Uint8ClampedArray(src.data), w, h);
  const d = out.data;

  const ev = Math.pow(2, p.exposure / 50);
  const C = clamp(p.contrast, -100, 100) * 2.4;
  const cf = (259 * (C + 255)) / (255 * (259 - C));
  const bright = p.brightness * 1.1;
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) lut[i] = cf * (i * ev + bright - 128) + 128;

  const tone = p.highlights !== 0 || p.shadows !== 0;
  const sh = (p.shadows / 100) * 120;
  const hl = (p.highlights / 100) * 120;
  const temp = p.temperature * 0.35;
  const tint = p.tint * 0.3;
  const sat = 1 + p.saturation / 100;
  const vib = p.vibrance / 100;
  const satOn = sat !== 1 || vib !== 0;
  const hueOn = p.hue !== 0;
  const t = (p.hue * Math.PI) / 180;
  const cs = Math.cos(t);
  const sn = Math.sin(t);
  const m = [
    0.213 + cs * 0.787 - sn * 0.213,
    0.715 - cs * 0.715 - sn * 0.715,
    0.072 - cs * 0.072 + sn * 0.928,
    0.213 - cs * 0.213 + sn * 0.143,
    0.715 + cs * 0.285 + sn * 0.14,
    0.072 - cs * 0.072 - sn * 0.283,
    0.213 - cs * 0.213 - sn * 0.787,
    0.715 - cs * 0.715 + sn * 0.715,
    0.072 + cs * 0.928 + sn * 0.072,
  ];
  const sep = p.sepia / 100;
  const inv = p.invert >= 0.5;

  for (let i = 0; i < d.length; i += 4) {
    let r = lut[d[i]];
    let g = lut[d[i + 1]];
    let b = lut[d[i + 2]];
    if (tone) {
      const L = clamp((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, 0, 1);
      const delta = sh * (1 - L) * (1 - L) * (1 - L) + hl * L * L * L;
      r += delta;
      g += delta;
      b += delta;
    }
    if (temp !== 0 || tint !== 0) {
      r += temp + tint * 0.5;
      g -= tint;
      b += -temp + tint * 0.5;
    }
    if (hueOn) {
      const nr = m[0] * r + m[1] * g + m[2] * b;
      const ng = m[3] * r + m[4] * g + m[5] * b;
      const nb = m[6] * r + m[7] * g + m[8] * b;
      r = nr;
      g = ng;
      b = nb;
    }
    if (satOn) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      let f = sat;
      if (vib !== 0) {
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const s = clamp((mx - mn) / 255, 0, 1);
        f += vib * (1 - s) * (vib > 0 ? 1.2 : 1);
      }
      if (f < 0) f = 0;
      r = gray + (r - gray) * f;
      g = gray + (g - gray) * f;
      b = gray + (b - gray) * f;
    }
    if (sep > 0) {
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;
      r += (sr - r) * sep;
      g += (sg - g) * sep;
      b += (sb - b) * sep;
    }
    if (inv) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  if (p.blur > 0) {
    const f = blurFloat(premultiplied(d), w, h, Math.max(0.5, p.blur * scale));
    unpremultiply(f, d);
  }
  if (p.sharpen > 0) {
    const base = premultiplied(d);
    const soft = blurFloat(new Float32Array(base), w, h, Math.max(1, 1.5 * scale));
    const amt = (p.sharpen / 100) * 1.6;
    for (let i = 0; i < base.length; i += 4) {
      for (let c = 0; c < 3; c++)
        base[i + c] = base[i + c] + amt * (base[i + c] - soft[i + c]);
    }
    for (let i = 0; i < base.length; i += 4)
      for (let c = 0; c < 3; c++) base[i + c] = clamp(base[i + c], 0, base[i + 3]);
    unpremultiply(base, d);
  }
  if (p.vignette !== 0) {
    const amt = p.vignette / 100;
    const cx = w / 2;
    const cy = h / 2;
    for (let y = 0; y < h; y++) {
      const dy = (y + 0.5 - cy) / cy;
      for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - cx) / cx;
        const dist = Math.sqrt(dx * dx + dy * dy) / Math.SQRT2;
        const e = clamp((dist - 0.3) / 0.7, 0, 1);
        const f = e * e * (3 - 2 * e) * 0.9;
        if (f === 0) continue;
        const i = (y * w + x) * 4;
        if (amt > 0) {
          const k = 1 - amt * f;
          d[i] *= k;
          d[i + 1] *= k;
          d[i + 2] *= k;
        } else {
          const k = -amt * f;
          d[i] += (255 - d[i]) * k;
          d[i + 1] += (255 - d[i + 1]) * k;
          d[i + 2] += (255 - d[i + 2]) * k;
        }
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Selections by colour: magic eraser and fill bucket                  */
/* ------------------------------------------------------------------ */

/** Distance in RGBA, normalised so 0..255 spans black→white. */
function distance(d: Uint8ClampedArray, i: number, ref: number[]) {
  const dr = d[i] - ref[0];
  const dg = d[i + 1] - ref[1];
  const db = d[i + 2] - ref[2];
  const da = d[i + 3] - ref[3];
  return Math.sqrt(dr * dr + dg * dg + db * db + da * da) / 2;
}

/**
 * Pixels like the one at (x, y): either connected to it (flood) or anywhere.
 * Returns per-pixel distances (Infinity = not selected) so callers can feather.
 */
export function selectSimilar(
  img: ImageData,
  x: number,
  y: number,
  tolerance: number,
  contiguous: boolean,
) {
  const { width: w, height: h, data: d } = img;
  x = clamp(Math.floor(x), 0, w - 1);
  y = clamp(Math.floor(y), 0, h - 1);
  const i0 = (y * w + x) * 4;
  const ref = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
  const limit = (tolerance / 100) * 255;
  const out = new Float32Array(w * h).fill(Infinity);
  if (!contiguous) {
    for (let p = 0; p < w * h; p++) {
      const dist = distance(d, p * 4, ref);
      if (dist <= limit) out[p] = dist;
    }
    return { dist: out, limit };
  }
  const seen = new Uint8Array(w * h);
  const stack = [y * w + x];
  seen[y * w + x] = 1;
  while (stack.length) {
    const p = stack.pop()!;
    const dist = distance(d, p * 4, ref);
    if (dist > limit) continue;
    out[p] = dist;
    const px = p % w;
    const py = (p - px) / w;
    const visit = (q: number) => {
      if (seen[q]) return;
      seen[q] = 1;
      stack.push(q);
    };
    if (px > 0) visit(p - 1);
    if (px < w - 1) visit(p + 1);
    if (py > 0) visit(p - w);
    if (py < h - 1) visit(p + w);
  }
  return { dist: out, limit };
}

/** Make similar pixels transparent; `softness` (0..100) feathers the edge. */
export function eraseSimilar(
  img: ImageData,
  x: number,
  y: number,
  tolerance: number,
  contiguous: boolean,
  softness: number,
) {
  const { dist, limit } = selectSimilar(img, x, y, tolerance, contiguous);
  const out = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
  const d = out.data;
  const inner = limit * (1 - softness / 100);
  let count = 0;
  for (let p = 0; p < dist.length; p++) {
    const v = dist[p];
    if (v === Infinity) continue;
    count++;
    const i = p * 4 + 3;
    if (v <= inner || limit === inner) d[i] = 0;
    else d[i] = d[i] * ((v - inner) / (limit - inner));
  }
  return { image: out, count };
}

export function fillSimilar(
  img: ImageData,
  x: number,
  y: number,
  tolerance: number,
  contiguous: boolean,
  color: [number, number, number],
  opacity: number,
) {
  const { dist } = selectSimilar(img, x, y, tolerance, contiguous);
  const out = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
  const d = out.data;
  const a = clamp(opacity, 0, 1);
  let count = 0;
  for (let p = 0; p < dist.length; p++) {
    if (dist[p] === Infinity) continue;
    count++;
    const i = p * 4;
    const da = d[i + 3] / 255;
    const oa = a + da * (1 - a);
    for (let c = 0; c < 3; c++)
      d[i + c] = oa ? (color[c] * a + d[i + c] * da * (1 - a)) / oa : 0;
    d[i + 3] = oa * 255;
  }
  return { image: out, count };
}

export function hasTransparency(img: ImageData) {
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

export type ShapeKind = 'rect' | 'ellipse' | 'line' | 'arrow';
export interface Point {
  x: number;
  y: number;
}
export interface ShapeStyle {
  stroke: string;
  width: number;
  fill: string | null;
  opacity: number;
}

/** Shift-constrain: squares/circles, or lines snapped to 45°. */
export function constrainEnd(kind: ShapeKind, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (kind === 'line' || kind === 'arrow') {
    const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    const len = Math.hypot(dx, dy);
    return { x: a.x + Math.cos(ang) * len, y: a.y + Math.sin(ang) * len };
  }
  const s = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: a.x + Math.sign(dx || 1) * s, y: a.y + Math.sign(dy || 1) * s };
}

export function drawShape(
  c: CanvasRenderingContext2D,
  kind: ShapeKind,
  a: Point,
  b: Point,
  s: ShapeStyle,
) {
  c.save();
  c.globalAlpha = s.opacity;
  c.lineWidth = s.width;
  c.strokeStyle = s.stroke;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x);
  const h = Math.abs(b.y - a.y);
  if (kind === 'rect' || kind === 'ellipse') {
    c.beginPath();
    if (kind === 'rect') c.rect(x, y, w, h);
    else c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    if (s.fill) {
      c.fillStyle = s.fill;
      c.fill();
    }
    if (s.width > 0) c.stroke();
  } else {
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const head = kind === 'arrow' ? Math.min(len * 0.6, Math.max(12, s.width * 4)) : 0;
    const end =
      kind === 'arrow'
        ? { x: b.x - Math.cos(ang) * head * 0.7, y: b.y - Math.sin(ang) * head * 0.7 }
        : b;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(end.x, end.y);
    c.lineWidth = Math.max(1, s.width);
    c.stroke();
    if (kind === 'arrow') {
      const spread = Math.PI / 7;
      c.beginPath();
      c.moveTo(b.x, b.y);
      c.lineTo(b.x - Math.cos(ang - spread) * head, b.y - Math.sin(ang - spread) * head);
      c.lineTo(b.x - Math.cos(ang + spread) * head, b.y - Math.sin(ang + spread) * head);
      c.closePath();
      c.fillStyle = s.stroke;
      c.fill();
    }
  }
  c.restore();
}

export interface TextStyle {
  family: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  outline: string | null;
  opacity: number;
}

export const textFont = (s: TextStyle) =>
  `${s.italic ? 'italic ' : ''}${s.bold ? '700 ' : '400 '}${s.size}px ${s.family}`;

export function measureText(c: CanvasRenderingContext2D, text: string, s: TextStyle) {
  c.save();
  c.font = textFont(s);
  const lines = text.split('\n');
  const width = Math.max(1, ...lines.map((l) => c.measureText(l).width));
  c.restore();
  return { w: width, h: lines.length * s.size * 1.2 };
}

export function drawText(c: CanvasRenderingContext2D, text: string, at: Point, s: TextStyle) {
  c.save();
  c.globalAlpha = s.opacity;
  c.font = textFont(s);
  c.textBaseline = 'top';
  c.lineJoin = 'round';
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const y = at.y + i * s.size * 1.2 + s.size * 0.1;
    if (s.outline) {
      c.strokeStyle = s.outline;
      c.lineWidth = Math.max(1, s.size / 8);
      c.strokeText(line, at.x, y);
    }
    c.fillStyle = s.color;
    c.fillText(line, at.x, y);
  });
  c.restore();
}

/** One brush dab or segment on a stroke layer (always full alpha; opacity is
 *  applied once when the stroke is composited, so overlaps never darken). */
export function strokeSegment(
  c: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  size: number,
  hardness: number,
  color: string,
) {
  const r = size / 2;
  if (hardness >= 0.98) {
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = size;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.lineTo(to.x, to.y);
    c.stroke();
    c.beginPath();
    c.arc(to.x, to.y, r, 0, Math.PI * 2);
    c.fill();
    return;
  }
  const [cr, cg, cb] = hexToRgb(color);
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const spacing = Math.max(0.5, size * 0.12);
  const steps = Math.max(1, Math.ceil(dist / spacing));
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    const g = c.createRadialGradient(x, y, r * hardness, x, y, r);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},0.35)`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
}
