/** Opening and saving images for NinjaImage. */
import { ctx2d, makeCanvas, resample } from './imageOps';

/** iOS Safari refuses canvases over ~16.7 MP; everyone else copes with 40. */
export function maxPixels() {
  const ios =
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios ? 16_000_000 : 40_000_000;
}
const MAX_SIDE = 16_384;

export const IMAGE_ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif,image/x-icon,image/vnd.microsoft.icon,.png,.jpg,.jpeg,.webp,.gif,.bmp,.avif,.ico';

export function isImageFile(file: File) {
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) return false;
  return (
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|bmp|avif|ico)$/i.test(file.name)
  );
}

async function decodeSource(blob: Blob): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(blob);
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall back to <img>, which knows a few more formats (e.g. ICO) */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

export interface Decoded {
  canvas: HTMLCanvasElement;
  originalWidth: number;
  originalHeight: number;
  scaled: boolean;
}

/** Decode any browser-supported raster image (first frame of animations). */
export async function decodeImage(blob: Blob): Promise<Decoded> {
  const { source, width, height, close } = await decodeSource(blob);
  try {
    if (!width || !height) throw new Error('Empty image');
    const limit = maxPixels();
    let k = Math.min(1, Math.sqrt(limit / (width * height)));
    k = Math.min(k, MAX_SIDE / width, MAX_SIDE / height);
    const w = Math.max(1, Math.round(width * k));
    const h = Math.max(1, Math.round(height * k));
    const canvas = makeCanvas(w, h);
    const c = ctx2d(canvas);
    c.imageSmoothingQuality = 'high';
    c.drawImage(source, 0, 0, w, h);
    return { canvas, originalWidth: width, originalHeight: height, scaled: k < 1 };
  } finally {
    close();
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(`Could not encode ${type}`))),
      type,
      quality,
    ),
  );
}

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'avif' | 'ico';

export const FORMAT_INFO: Record<
  ExportFormat,
  { label: string; mime: string; ext: string; alpha: boolean; lossy: boolean }
> = {
  png: { label: 'PNG', mime: 'image/png', ext: 'png', alpha: true, lossy: false },
  jpeg: { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg', alpha: false, lossy: true },
  webp: { label: 'WebP', mime: 'image/webp', ext: 'webp', alpha: true, lossy: true },
  avif: { label: 'AVIF', mime: 'image/avif', ext: 'avif', alpha: true, lossy: true },
  ico: { label: 'ICO (favicon)', mime: 'image/x-icon', ext: 'ico', alpha: true, lossy: false },
};

/** Which formats this browser's canvas can actually encode. */
export async function supportedFormats(): Promise<ExportFormat[]> {
  const probe = makeCanvas(2, 2);
  const out: ExportFormat[] = ['png', 'jpeg'];
  for (const f of ['webp', 'avif'] as const) {
    try {
      const blob = await canvasToBlob(probe, FORMAT_INFO[f].mime, 0.8);
      if (blob.type === FORMAT_INFO[f].mime) out.push(f);
    } catch {
      /* unsupported */
    }
  }
  out.push('ico');
  return out;
}

/** PNG-compressed ICO (Vista+ and every browser read these). */
export function buildIco(images: { size: number; bytes: Uint8Array }[]) {
  const header = 6 + images.length * 16;
  const total = header + images.reduce((n, i) => n + i.bytes.length, 0);
  const out = new Uint8Array(total);
  const v = new DataView(out.buffer);
  v.setUint16(0, 0, true);
  v.setUint16(2, 1, true);
  v.setUint16(4, images.length, true);
  let offset = header;
  images.forEach((img, i) => {
    const e = 6 + i * 16;
    out[e] = img.size >= 256 ? 0 : img.size;
    out[e + 1] = img.size >= 256 ? 0 : img.size;
    out[e + 2] = 0;
    out[e + 3] = 0;
    v.setUint16(e + 4, 1, true);
    v.setUint16(e + 6, 32, true);
    v.setUint32(e + 8, img.bytes.length, true);
    v.setUint32(e + 12, offset, true);
    out.set(img.bytes, offset);
    offset += img.bytes.length;
  });
  return out;
}

export interface ExportOptions {
  format: ExportFormat;
  width: number;
  height: number;
  quality: number; // 0..1
  background: string; // used where the format has no alpha
  icoSizes: number[];
}

export async function exportImage(doc: HTMLCanvasElement, o: ExportOptions): Promise<Blob> {
  const info = FORMAT_INFO[o.format];
  if (o.format === 'ico') {
    const sizes = [...new Set(o.icoSizes)].sort((a, b) => a - b);
    if (!sizes.length) throw new Error('Choose at least one icon size.');
    const parts: { size: number; bytes: Uint8Array }[] = [];
    for (const size of sizes) {
      const k = Math.min(size / doc.width, size / doc.height);
      const fitted = resample(doc, doc.width * k, doc.height * k);
      const square = makeCanvas(size, size);
      ctx2d(square).drawImage(
        fitted,
        Math.round((size - fitted.width) / 2),
        Math.round((size - fitted.height) / 2),
      );
      const blob = await canvasToBlob(square, 'image/png');
      parts.push({ size, bytes: new Uint8Array(await blob.arrayBuffer()) });
    }
    return new Blob([buildIco(parts) as BlobPart], { type: info.mime });
  }
  let out =
    o.width === doc.width && o.height === doc.height ? doc : resample(doc, o.width, o.height);
  if (!info.alpha) {
    const flat = makeCanvas(out.width, out.height);
    const c = ctx2d(flat);
    c.fillStyle = o.background;
    c.fillRect(0, 0, flat.width, flat.height);
    c.drawImage(out, 0, 0);
    out = flat;
  }
  return canvasToBlob(out, info.mime, info.lossy ? o.quality : undefined);
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
