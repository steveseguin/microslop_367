/**
 * Raster -> vector tracing for NinjaSVG, built on imagetracerjs (public
 * domain). The heavy work runs in a Web Worker so the page stays responsive;
 * the same function runs on the main thread if workers are unavailable.
 * Output is one <path> per colour, so each colour stays editable as a unit.
 */
import ImageTracer from 'imagetracerjs';
import type { TraceData, TracePath } from 'imagetracerjs';

export type TraceDetail = 'low' | 'medium' | 'high';

export interface TraceOptions {
  /** Colour count for colour mode. */
  colors: number;
  detail: TraceDetail;
  /** 0 (none) .. 5 (strong) pre-blur, which smooths jagged edges. */
  smoothing: number;
  /** Drop transparent areas and the solid background colour. */
  ignoreBackground: boolean;
  /** Black-and-white: threshold first, then trace two colours. */
  mono: boolean;
  /** 0..255 luminance threshold for mono mode. */
  threshold: number;
}

export const DEFAULT_TRACE: TraceOptions = {
  colors: 8,
  detail: 'medium',
  smoothing: 1,
  ignoreBackground: true,
  mono: false,
  threshold: 128,
};

const DETAIL = {
  low: { maxSide: 420, ltres: 2, qtres: 2, pathomit: 16 },
  medium: { maxSide: 800, ltres: 1, qtres: 1, pathomit: 8 },
  high: { maxSide: 1400, ltres: 0.5, qtres: 0.5, pathomit: 3 },
} as const;

export const traceMaxSide = (detail: TraceDetail) => DETAIL[detail].maxSide;

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const hex = (c: Rgba) =>
  `#${[c.r, c.g, c.b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;

/** The most common colour around the image's border, if it clearly dominates. */
function borderColor(img: ImageData): Rgba | null {
  const { width: w, height: h, data } = img;
  const counts = new Map<number, { n: number; c: Rgba }>();
  let total = 0;
  const add = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 128) return;
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const entry = counts.get(key) ?? { n: 0, c: { r: data[i], g: data[i + 1], b: data[i + 2], a: 255 } };
    entry.n++;
    counts.set(key, entry);
    total++;
  };
  for (let x = 0; x < w; x++) {
    add(x, 0);
    add(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    add(0, y);
    add(w - 1, y);
  }
  let best: { n: number; c: Rgba } | null = null;
  for (const e of counts.values()) if (!best || e.n > best.n) best = e;
  return best && best.n / Math.max(1, total) > 0.5 ? best.c : null;
}

const dist = (a: Rgba, b: Rgba) =>
  Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);

function pathData(path: TracePath, layer: TracePath[], scale: number) {
  const r = (v: number) => Math.round(v * scale * 100) / 100;
  const seg = path.segments;
  let d = `M${r(seg[0].x1)} ${r(seg[0].y1)}`;
  for (const s of seg) {
    d += `${s.type}${r(s.x2)} ${r(s.y2)}`;
    if (s.x3 !== undefined && s.y3 !== undefined) d += ` ${r(s.x3)} ${r(s.y3)}`;
  }
  d += 'Z';
  // Holes are written in reverse so the default nonzero fill cuts them out.
  for (const index of path.holechildren) {
    const hole = layer[index].segments;
    const last = hole[hole.length - 1];
    d += `M${r(last.x3 ?? last.x2)} ${r(last.y3 ?? last.y2)}`;
    for (let i = hole.length - 1; i >= 0; i--) {
      const s = hole[i];
      d += s.x3 !== undefined ? `${s.type}${r(s.x2)} ${r(s.y2)} ${r(s.x1)} ${r(s.y1)}` : `${s.type}${r(s.x1)} ${r(s.y1)}`;
    }
    d += 'Z';
  }
  return d;
}

/**
 * Trace an image. `outWidth`/`outHeight` are the size the SVG should have
 * (the original image size), which may be larger than the traced pixels.
 */
export function traceImageData(
  source: ImageData,
  options: TraceOptions,
  outWidth = source.width,
  outHeight = source.height,
) {
  const detail = DETAIL[options.detail];
  let img = source;
  let pal: Rgba[] | undefined;
  if (options.mono) {
    const data = new Uint8ClampedArray(source.data);
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i + 3] < 128 ? 255 : 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const v = lum < options.threshold ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
    img = new ImageData(data, source.width, source.height);
    pal = [
      { r: 0, g: 0, b: 0, a: 255 },
      { r: 255, g: 255, b: 255, a: 255 },
    ];
  }
  const traced: TraceData = ImageTracer.imagedataToTracedata(img, {
    ltres: detail.ltres,
    qtres: detail.qtres,
    pathomit: detail.pathomit,
    rightangleenhance: true,
    colorsampling: 2,
    numberofcolors: Math.max(2, Math.min(64, Math.round(options.colors))),
    mincolorratio: 0,
    colorquantcycles: pal ? 1 : 3,
    blurradius: Math.max(0, Math.min(5, Math.round(options.smoothing))),
    blurdelta: 64,
    pal,
  });
  const scale = outWidth / traced.width;
  const background = options.ignoreBackground
    ? options.mono
      ? { r: 255, g: 255, b: 255, a: 255 }
      : borderColor(source)
    : null;
  const layers = traced.layers
    .map((layer, i) => ({ layer, color: traced.palette[i] }))
    .filter(({ layer, color }) => {
      if (!layer.some((p) => !p.isholepath)) return false;
      if (options.ignoreBackground && color.a < 128) return false;
      if (background && dist(color, background) < 36) return false;
      return true;
    })
    // Larger colour areas first, so small details sit on top.
    .map((entry) => ({
      ...entry,
      area: entry.layer.reduce((n, p) => {
        const [x1, y1, x2, y2] = p.boundingbox;
        return p.isholepath ? n : n + (x2 - x1) * (y2 - y1);
      }, 0),
    }))
    .sort((a, b) => b.area - a.area);
  const stroke = Math.max(0.5, Math.round(scale * 100) / 100);
  const paths = layers.map(({ layer, color }) => {
    const d = layer
      .filter((p) => !p.isholepath && p.segments.length)
      .map((p) => pathData(p, layer, scale))
      .join('');
    const c = hex(color);
    const alpha = color.a < 250 ? ` fill-opacity="${Math.round((color.a / 255) * 100) / 100}"` : '';
    // A hairline in the same colour hides the seams between colour regions.
    return `  <path fill="${c}"${alpha} stroke="${c}" stroke-width="${stroke}" stroke-linejoin="round" d="${d}"/>`;
  });
  const w = Math.round(outWidth);
  const h = Math.round(outHeight);
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n${paths.join('\n')}\n</svg>`,
    paths: paths.length,
    colors: traced.palette.length,
  };
}

export type TraceResult = ReturnType<typeof traceImageData>;

/** Decode an image file and scale it down to the tracing size for `detail`. */
export async function loadTraceSource(src: Blob | string, detail: TraceDetail) {
  const img = new Image();
  const url = typeof src === 'string' ? src : URL.createObjectURL(src);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('That image could not be read.'));
      img.src = url;
    });
  } finally {
    if (typeof src !== 'string') URL.revokeObjectURL(url);
  }
  const w = img.naturalWidth || 1;
  const h = img.naturalHeight || 1;
  const k = Math.min(1, traceMaxSide(detail) / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * k));
  canvas.height = Math.max(1, Math.round(h * k));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return {
    data: ctx.getImageData(0, 0, canvas.width, canvas.height),
    width: w,
    height: h,
  };
}

let worker: Worker | null = null;
let seq = 0;

/** Trace in a worker; falls back to the main thread if one cannot start. */
export function traceAsync(
  img: ImageData,
  options: TraceOptions,
  outWidth: number,
  outHeight: number,
): Promise<TraceResult> {
  try {
    worker ??= new Worker(new URL('./svgTrace.worker.ts', import.meta.url), {
      type: 'module',
    });
  } catch {
    worker = null;
  }
  const w = worker;
  if (!w) return Promise.resolve(traceImageData(img, options, outWidth, outHeight));
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const done = () => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.data?.id !== id) return;
      done();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.result as TraceResult);
    };
    const onError = () => {
      done();
      worker?.terminate();
      worker = null;
      try {
        resolve(traceImageData(img, options, outWidth, outHeight));
      } catch (error) {
        reject(error);
      }
    };
    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage({ id, img, options, outWidth, outHeight });
  });
}
