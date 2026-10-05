/**
 * NinjaSVG converters: SVG -> PNG/JPEG/WebP/AVIF, ICO, icon packs, data URLs
 * and code snippets. Rasterizing always goes through an <img> loaded from a
 * Blob URL, which renders SVG as a static image and can never run a script.
 */
import { getViewBox, parseSvg, sanitizeTree, serializeSvg } from './svgCore';

export type RasterFormat = 'png' | 'jpeg' | 'webp' | 'avif';

export const RASTER_MIME: Record<RasterFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
};
export const RASTER_EXT: Record<RasterFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
  avif: 'avif',
};

const MAX_SIDE = 8192;

const encodeCache = new Map<string, boolean>();
/** Whether this browser's canvas can encode the given image type. */
export function canEncode(mime: string) {
  if (!encodeCache.has(mime)) {
    let ok = false;
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 2;
      ok = c.toDataURL(mime).startsWith(`data:${mime}`);
    } catch {
      ok = false;
    }
    encodeCache.set(mime, ok);
  }
  return encodeCache.get(mime)!;
}

/** The drawing's natural size, from its viewBox. */
export function svgSize(code: string) {
  const { svg } = parseSvg(code);
  if (!svg) return { w: 300, h: 150 };
  const vb = getViewBox(svg);
  return { w: vb.w, h: vb.h };
}

/** A safe copy of the SVG with explicit pixel width/height for rendering. */
function sizedSvg(code: string, w: number, h: number) {
  const { svg } = parseSvg(code);
  if (!svg) throw new Error('There is no valid SVG to convert.');
  sanitizeTree(svg);
  const vb = getViewBox(svg);
  if (!svg.getAttribute('viewBox'))
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  return serializeSvg(svg);
}

function loadImage(markup: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The browser could not render this SVG.'));
    };
    img.src = url;
  });
}

const clampSide = (n: number) => Math.max(1, Math.min(MAX_SIDE, Math.round(n)));

/**
 * Draw the SVG onto a canvas of exactly w x h pixels. The drawing keeps its
 * proportions and is centred; `background` null leaves it transparent.
 */
export async function rasterize(
  code: string,
  width: number,
  height: number,
  background: string | null,
) {
  const w = clampSide(width);
  const h = clampSide(height);
  const { w: nw, h: nh } = svgSize(code);
  const scale = Math.min(w / nw, h / nh);
  const dw = Math.max(1, Math.round(nw * scale));
  const dh = Math.max(1, Math.round(nh * scale));
  const img = await loadImage(sizedSvg(code, dw, dh));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh);
  return canvas;
}

export function canvasBlob(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('This format could not be encoded.'))),
      mime,
      quality,
    ),
  );
}

export async function renderBlob(
  code: string,
  format: RasterFormat,
  w: number,
  h: number,
  background: string | null,
  quality = 0.92,
) {
  const canvas = await rasterize(code, w, h, format === 'jpeg' ? background || '#ffffff' : background);
  return canvasBlob(canvas, RASTER_MIME[format], format === 'png' ? undefined : quality);
}

export async function pngBytes(code: string, size: number, background: string | null) {
  const blob = await renderBlob(code, 'png', size, size, background);
  return new Uint8Array(await blob.arrayBuffer());
}

/** A Windows .ico that holds PNG images (supported by every current browser). */
export function buildIco(images: { size: number; png: Uint8Array }[]) {
  const sorted = [...images].sort((a, b) => a.size - b.size);
  const headerSize = 6 + 16 * sorted.length;
  const total = headerSize + sorted.reduce((n, i) => n + i.png.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, sorted.length, true);
  let offset = headerSize;
  sorted.forEach((img, i) => {
    const e = 6 + i * 16;
    out[e] = img.size >= 256 ? 0 : img.size;
    out[e + 1] = img.size >= 256 ? 0 : img.size;
    out[e + 2] = 0;
    out[e + 3] = 0;
    view.setUint16(e + 4, 1, true);
    view.setUint16(e + 6, 32, true);
    view.setUint32(e + 8, img.png.length, true);
    view.setUint32(e + 12, offset, true);
    out.set(img.png, offset);
    offset += img.png.length;
  });
  return out;
}

export async function faviconIco(code: string, background: string | null, sizes = [16, 32, 48]) {
  const images = [];
  for (const size of sizes) images.push({ size, png: await pngBytes(code, size, background) });
  return buildIco(images);
}

export const ICON_PACK_SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

/** favicon.ico, PNG sizes, the SVG itself, a web manifest and the HTML snippet. */
export async function iconPack(code: string, name: string, background: string | null) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const sizes = [16, 32, 48, 180, 192, 512];
  const pngs = new Map<number, Uint8Array>();
  for (const size of sizes)
    // Apple touch icons are shown on an opaque tile; never leave them transparent.
    pngs.set(size, await pngBytes(code, size, size === 180 ? background || '#ffffff' : background));
  zip.file(
    'favicon.ico',
    buildIco([16, 32, 48].map((size) => ({ size, png: pngs.get(size)! }))),
  );
  zip.file('favicon-16x16.png', pngs.get(16)!);
  zip.file('favicon-32x32.png', pngs.get(32)!);
  zip.file('favicon-48x48.png', pngs.get(48)!);
  zip.file('apple-touch-icon.png', pngs.get(180)!);
  zip.file('icon-192.png', pngs.get(192)!);
  zip.file('icon-512.png', pngs.get(512)!);
  zip.file('icon.svg', code);
  zip.file(
    'site.webmanifest',
    JSON.stringify(
      {
        name,
        short_name: name,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        theme_color: background || '#ffffff',
        background_color: background || '#ffffff',
        display: 'standalone',
      },
      null,
      2,
    ),
  );
  zip.file('snippet.html', `${ICON_PACK_SNIPPET}\n`);
  return zip.generateAsync({ type: 'blob' });
}

/* ------------------------------------------------------------------------ */
/* Text outputs                                                              */
/* ------------------------------------------------------------------------ */

export function base64DataUrl(code: string) {
  const bytes = new TextEncoder().encode(code);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:image/svg+xml;base64,${btoa(bin)}`;
}

/** The compact URL-encoded form: readable, and usually smaller than base64. */
export function encodedDataUrl(code: string) {
  const compact = code
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/"/g, "'");
  return `data:image/svg+xml,${compact.replace(/[%#<>{}|\\^`?[\]]/g, encodeURIComponent)}`;
}

const JSX_RENAME: Record<string, string> = {
  class: 'className',
  'xlink:href': 'href',
  'xml:space': 'xmlSpace',
  'xml:lang': 'xmlLang',
  'xmlns:xlink': 'xmlnsXlink',
  for: 'htmlFor',
};

const camel = (s: string) => s.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase());

function jsxStyle(style: string) {
  const parts = style
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const i = p.indexOf(':');
      if (i < 0) return '';
      const key = p.slice(0, i).trim();
      const prop = key.startsWith('--') ? JSON.stringify(key) : camel(key.replace(/^-ms-/, 'ms-'));
      return `${prop}: ${JSON.stringify(p.slice(i + 1).trim())}`;
    })
    .filter(Boolean);
  return `{{ ${parts.join(', ')} }}`;
}

/** A React component that renders the drawing, with props spread on <svg>. */
export function toJsx(code: string, componentName: string) {
  const { svg } = parseSvg(code);
  if (!svg) return '';
  sanitizeTree(svg);
  const name =
    componentName
      .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''))
      .replace(/^[^a-zA-Z]+/, '')
      .replace(/^./, (c) => c.toUpperCase()) || 'Drawing';
  const lines: string[] = [];
  const emit = (node: Element, depth: number, isRoot: boolean) => {
    const pad = '  '.repeat(depth);
    const attrs = [...node.attributes]
      .filter((a) => !(isRoot && a.name === 'xmlns:xlink'))
      .map((a) => {
        if (a.name === 'style') return `style=${jsxStyle(a.value)}`;
        const key =
          JSX_RENAME[a.name] ??
          (/^(data|aria)-/.test(a.name) ? a.name : camel(a.name));
        return `${key}=${JSON.stringify(a.value)}`;
      });
    if (isRoot) attrs.push('{...props}');
    const open = `<${node.tagName}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
    const kids = [...node.childNodes].filter(
      (c) =>
        c.nodeType === Node.ELEMENT_NODE ||
        (c.nodeType === Node.TEXT_NODE && c.textContent?.trim()),
    );
    if (!kids.length) {
      lines.push(`${pad}${open} />`);
      return;
    }
    lines.push(`${pad}${open}>`);
    for (const k of kids) {
      if (k.nodeType === Node.TEXT_NODE)
        lines.push(`${pad}  {${JSON.stringify(k.textContent!.replace(/\s+/g, ' ').trim())}}`);
      else emit(k as Element, depth + 1, false);
    }
    lines.push(`${pad}</${node.tagName}>`);
  };
  emit(svg, 2, true);
  return `import type { SVGProps } from 'react';

export default function ${name}(props: SVGProps<SVGSVGElement>) {
  return (
${lines.join('\n')}
  );
}
`;
}

/** Width/height from a PNG's IHDR chunk. */
export function pngDimensions(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { w: view.getUint32(16), h: view.getUint32(20) };
}
