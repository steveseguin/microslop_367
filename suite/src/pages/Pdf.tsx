import '../utils/sumPrecise';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PageViewport } from 'pdfjs-dist';
import workerUrl from '../utils/pdf.worker.ts?worker&url';
import {
  Download,
  Upload,
  Undo2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ArrowUp,
  ArrowDown,
  FilePlus2,
  Trash2,
  TextCursorInput,
  Type,
  Highlighter,
  PenLine,
  ImagePlus,
  MousePointer2,
  EyeOff,
  Copy,
  FilePlus,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AppMark } from '../components/AppMark';
import { takeHandoff } from '../utils/handoff';
import { DictateButton, DictateField } from '../components/Dictate';
import { appendSpoken, spliceSpoken } from '../utils/speech';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { downloadFile, useToolStorage } from '../utils/toolStorage';
import { fillFields, openPdf, parsePageRange, readFields } from '../utils/pdf';
import type { PdfField } from '../utils/pdf';
import {
  extractLines,
  removeTextInBox,
  removeTextInRect,
  standardFont,
} from '../utils/pdfText';
import type { TextLine } from '../utils/pdfText';

GlobalWorkerOptions.workerSrc = workerUrl;
interface PdfWorkspace {
  name: string;
  bytes: Uint8Array | null;
}
const EMPTY: PdfWorkspace = { name: 'document.pdf', bytes: null };
type Point = { x: number; y: number };
type Mode =
  | 'view'
  | 'edit'
  | 'text'
  | 'highlight'
  | 'redact'
  | 'draw'
  | 'image';
type Rgb = [number, number, number];

const TOOLS = [
  { id: 'edit', label: 'Edit text', icon: TextCursorInput },
  { id: 'text', label: 'Add text', icon: Type },
  { id: 'highlight', label: 'Highlight', icon: Highlighter },
  { id: 'redact', label: 'Redact', icon: EyeOff },
  { id: 'draw', label: 'Draw / sign', icon: PenLine },
  { id: 'image', label: 'Image', icon: ImagePlus },
  { id: 'view', label: 'Pages only', icon: MousePointer2 },
] as const;

const TOOL_HINT: Record<Mode, string> = {
  edit: 'Click any line of text on the page to change it. Press Enter to apply, Esc to cancel.',
  text: 'Click anywhere on the page and start typing.',
  highlight: 'Drag over an area to highlight it. Highlighting does not remove content.',
  redact:
    'Drag over text to delete it from the file and black it out. Images underneath are covered, not removed.',
  draw: 'Draw with your mouse, pen, or finger. Drawn signatures are visual marks, not digital certificates.',
  image: 'Choose an image in the side panel, then drag a rectangle on the page to place it.',
  view: 'Rotate, reorder, delete, or extract pages from the side panel.',
};

const pdfjsOptions = (bytes: Uint8Array) => ({
  // Copy: PDF.js transfers its input buffer into the worker.
  data: bytes.slice(),
  cMapUrl: new URL('pdf-assets/cmaps/', document.baseURI).href,
  cMapPacked: true,
  standardFontDataUrl: new URL('pdf-assets/standard_fonts/', document.baseURI)
    .href,
  wasmUrl: new URL('pdf-assets/wasm/', document.baseURI).href,
  iccUrl: new URL('pdf-assets/iccs/', document.baseURI).href,
});

const hex = (c: Rgb) =>
  `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const compact = (text: string) => text.replace(/\s+/g, '');

/** Sample the rendered page: background is the median of a ring just outside
 *  the box, ink is the pixel inside it that differs most from that. */
function sampleColors(
  canvas: HTMLCanvasElement,
  box: { left: number; top: number; boxWidth: number; boxHeight: number },
): { bg: Rgb; ink: Rgb } {
  const fallback = { bg: [255, 255, 255] as Rgb, ink: [0, 0, 0] as Rgb };
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return fallback;
  const x0 = Math.max(0, Math.floor(box.left) - 3);
  const y0 = Math.max(0, Math.floor(box.top) - 3);
  const x1 = Math.min(canvas.width, Math.ceil(box.left + box.boxWidth) + 3);
  const y1 = Math.min(canvas.height, Math.ceil(box.top + box.boxHeight) + 3);
  if (x1 - x0 < 8 || y1 - y0 < 8) return fallback;
  const { data } = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
  const w = x1 - x0;
  const h = y1 - y0;
  const px = (x: number, y: number): Rgb => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const ring: Rgb[] = [];
  for (let x = 0; x < w; x++) ring.push(px(x, 0), px(x, h - 1));
  for (let y = 0; y < h; y++) ring.push(px(0, y), px(w - 1, y));
  const median = (k: number) => {
    const v = ring.map((c) => c[k]).sort((a, b) => a - b);
    return v[v.length >> 1];
  };
  const bg: Rgb = [median(0), median(1), median(2)];
  let ink = fallback.ink;
  let best = -1;
  for (let y = 3; y < h - 3; y++)
    for (let x = 3; x < w - 3; x++) {
      const c = px(x, y);
      const d =
        (c[0] - bg[0]) ** 2 + (c[1] - bg[1]) ** 2 + (c[2] - bg[2]) ** 2;
      if (d > best) {
        best = d;
        ink = c;
      }
    }
  return { bg, ink: best < 900 ? fallback.ink : ink };
}

export default function Pdf(props: ToolProps) {
  const store = useToolStorage('pdf', EMPTY);
  const { data, update } = store;
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [rendering, setRendering] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('edit');
  const [lines, setLines] = useState<{
    bytes: Uint8Array;
    page: number;
    items: TextLine[];
    view: { width: number; height: number; scale: number };
  } | null>(null);
  const [editing, setEditing] = useState<{
    line: TextLine;
    value: string;
    bg: Rgb;
    ink: Rgb;
  } | null>(null);
  const [draft, setDraft] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);
  const [cssScale, setCssScale] = useState(1);
  const editInput = useRef<HTMLInputElement>(null);
  const draftInput = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [baseWidth, setBaseWidth] = useState(0);
  const [thumbs, setThumbs] = useState<{
    bytes: Uint8Array;
    urls: string[];
  } | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropping, setDropping] = useState(false);
  const [size, setSize] = useState(16);
  const [color, setColor] = useState('#2563eb');
  const [range, setRange] = useState('1');
  const [fields, setFields] = useState<PdfField[]>([]);
  const [fieldsDirty, setFieldsDirty] = useState(false);
  const [history, setHistory] = useState<Uint8Array[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const drawing = useRef<Point[]>([]);
  const [image, setImage] = useState<{
    bytes: Uint8Array;
    type: string;
  } | null>(null);
  const [renderVersion, setRenderVersion] = useState(0);
  const [preview, setPreview] = useState<{
    bytes: Uint8Array;
    page: number;
  } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const mergeInput = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<PageViewport | null>(null);

  useEffect(() => {
    if (!data.bytes) return;
    let disposed = false;
    const bytes = data.bytes;
    openPdf(bytes)
      .then((pdf) => {
        if (!disposed) {
          setCount(pdf.getPageCount());
          setPage((p) => Math.min(p, pdf.getPageCount() - 1));
          setFields(readFields(pdf));
          setFieldsDirty(false);
        }
      })
      .catch((error) => {
        if (!disposed)
          setMessage(
            error instanceof Error ? error.message : 'PDF could not be opened.',
          );
      });
    return () => {
      disposed = true;
    };
  }, [data.bytes]);

  useEffect(() => {
    if (!data.bytes || !canvas.current) return;
    let disposed = false;
    let render: { cancel: () => void; promise: Promise<void> } | undefined;
    // Copy: PDF.js transfers its input buffer into the worker.
    const task = getDocument(pdfjsOptions(data.bytes));
    task.promise
      .then(async (pdf) => {
        if (disposed) return;
        setRendering(true);
        const p = await pdf.getPage(Math.min(page + 1, pdf.numPages));
        if (disposed || !canvas.current) return;
        const natural = p.getViewport({ scale: 1 });
        const base = Math.min(
          1.5,
          1000 / Math.max(natural.width, natural.height),
        );
        // Render at device resolution and at the zoom level, so zoomed and
        // high-DPI pages stay sharp; capped to keep the canvas a sane size.
        const density = Math.min(
          4,
          Math.max(1, zoom) * Math.max(1, window.devicePixelRatio || 1),
          Math.sqrt(16_000_000 / (natural.width * natural.height * base * base)),
        );
        const view = p.getViewport({ scale: base * density });
        setBaseWidth(natural.width * base);
        viewport.current = view;
        canvas.current.width = view.width;
        canvas.current.height = view.height;
        render = p.render({ canvas: canvas.current, viewport: view });
        await render.promise;
        // A page we cannot read text from still renders and edits as before.
        const items = await extractLines(p, view).catch(() => []);
        if (!disposed) {
          setLines({
            bytes: data.bytes!,
            page,
            items,
            view: { width: view.width, height: view.height, scale: view.scale },
          });
          if (canvas.current?.width)
            setCssScale(canvas.current.clientWidth / canvas.current.width);
          setRendering(false);
          setPreview({ bytes: data.bytes!, page });
          setRenderVersion((v) => v + 1);
        }
      })
      .catch((error) => {
        if (!disposed) {
          setRendering(false);
          setMessage(
            `Preview failed: ${error instanceof Error ? error.message : 'Unsupported PDF'}`,
          );
        }
      });
    return () => {
      disposed = true;
      viewport.current = null;
      render?.cancel();
      void task.destroy();
    };
  }, [data.bytes, page, zoom]);

  // Page thumbnails, rendered after the main page so it is never delayed.
  useEffect(() => {
    if (!data.bytes) return;
    let disposed = false;
    const bytes = data.bytes;
    const task = getDocument(pdfjsOptions(bytes));
    const timer = window.setTimeout(() => {
      task.promise
        .then(async (pdf) => {
          const urls: string[] = [];
          const total = Math.min(pdf.numPages, 300);
          for (let i = 1; i <= total && !disposed; i++) {
            const p = await pdf.getPage(i);
            const natural = p.getViewport({ scale: 1 });
            const view = p.getViewport({
              scale: (220 / natural.width) * 1,
            });
            const thumb = document.createElement('canvas');
            thumb.width = view.width;
            thumb.height = view.height;
            await p.render({ canvas: thumb, viewport: view }).promise;
            urls.push(thumb.toDataURL('image/jpeg', 0.8));
            if (!disposed && (i % 6 === 0 || i === total))
              setThumbs({ bytes, urls: [...urls] });
          }
        })
        .catch(() => {
          /* Thumbnails are a convenience; the page view still works. */
        });
    }, 150);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      void task.destroy();
    };
  }, [data.bytes]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const observe = new ResizeObserver(() => {
      if (el.width) setCssScale(el.clientWidth / el.width);
    });
    observe.observe(el);
    return () => observe.disconnect();
  }, [data.bytes]);

  useEffect(() => {
    setEditing(null);
    setDraft(null);
  }, [data.bytes, page, mode]);

  const undo = useCallback(async () => {
    const previous = history[history.length - 1];
    if (!previous || busy || fieldsDirty) return;
    if (await update((s) => ({ ...s, bytes: previous }))) {
      setHistory((h) => h.slice(0, -1));
      setPage((p) => p);
      setMessage('Last PDF edit undone.');
    }
  }, [history, busy, fieldsDirty, update]);

  useEffect(() => {
    if (!data.bytes) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('input, textarea, select, [contenteditable="true"]')
      )
        return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        void undo();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setPage((p) => Math.min(count - 1, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setPage((p) => Math.max(0, p - 1));
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data.bytes, count, undo]);

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (fieldsDirty || busy) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [fieldsDirty, busy]);

  const operation = async (
    edit: (pdf: PDFDocument) => Promise<void> | void,
    success: string,
    safety?: {
      verify: (bytes: Uint8Array) => Promise<boolean>;
      fallback: (pdf: PDFDocument) => Promise<void> | void;
    },
  ) => {
    if (!data.bytes || working.current || !store.ready) return;
    if (fieldsDirty) {
      setMessage(
        'Apply form values before editing pages, or discard the form changes.',
      );
      return;
    }
    working.current = true;
    setBusy(true);
    setMessage('');
    try {
      const original = data.bytes;
      let pdf = await openPdf(original);
      await edit(pdf);
      let bytes = await pdf.save();
      if (safety && !(await safety.verify(bytes).catch(() => false))) {
        pdf = await openPdf(original);
        await safety.fallback(pdf);
        bytes = await pdf.save();
      }
      if (await update((s) => ({ ...s, bytes }))) {
        setHistory((h) => [...h.slice(-4), original]);
        setPage((p) => Math.min(p, pdf.getPageCount() - 1));
        setMessage(success);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'This PDF could not be edited. The previous version is unchanged.',
      );
    } finally {
      setBusy(false);
      working.current = false;
    }
  };
  const loadFile = async (file: File) => {
    if (working.current) return;
    if (file.size > 30_000_000) {
      setMessage('Choose a PDF smaller than 30 MB.');
      return;
    }
    if (
      data.bytes &&
      !window.confirm(
        'Open another PDF? Your current draft will be replaced. Download it first if you need a copy.',
      )
    )
      return;
    working.current = true;
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await openPdf(bytes);
      if (await update(() => ({ name: file.name, bytes }))) {
        setPage(0);
        setHistory([]);
        setMode('edit');
        setMessage(
          'PDF opened. Edits save locally; your original file is unchanged.',
        );
      }
    } catch {
      setMessage(
        'Could not open this PDF. Encrypted files, signature fields, and XFA forms need an unsigned, standard PDF copy.',
      );
    } finally {
      setBusy(false);
      working.current = false;
    }
  };
  // A PDF dropped on the workspace opens here once local storage is ready.
  useEffect(() => {
    if (!store.ready) return;
    const file = takeHandoff('pdf');
    if (file) void loadFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.ready]);
  const requireStatic = (pdf: PDFDocument) => {
    if (pdf.getForm().getFields().length)
      throw new Error(
        'This operation requires static pages. Apply your form values, then use “Flatten forms” first. Keep an editable download if you need it.',
      );
  };
  const download = (bytes: Uint8Array, name = data.name) =>
    downloadFile(
      name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`,
      bytes.slice().buffer,
      'application/pdf',
    );
  const extract = async () => {
    if (!data.bytes || fieldsDirty || working.current) return;
    working.current = true;
    setBusy(true);
    try {
      const source = await openPdf(data.bytes);
      requireStatic(source);
      const indices = parsePageRange(range, source.getPageCount());
      const out = await PDFDocument.create();
      (await out.copyPages(source, indices)).forEach((p) => out.addPage(p));
      download(
        await out.save(),
        `${data.name.replace(/\.pdf$/i, '')}-pages.pdf`,
      );
      setMessage(
        `Exported ${indices.length} pages. Your full document is unchanged.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not extract these pages.',
      );
    } finally {
      setBusy(false);
      working.current = false;
    }
  };
  const coordinate = (p: Point) => {
    const view = viewport.current;
    if (!view) throw new Error('Wait for the preview to finish.');
    const [x, y] = view.convertToPdfPoint(p.x * view.width, p.y * view.height);
    return { x, y };
  };
  const annotate = async (stroke: Point[]) => {
    if (!stroke.length || !viewport.current) return;
    if (mode === 'redact') {
      await redact(stroke[0], stroke[stroke.length - 1]);
      return;
    }
    const start = coordinate(stroke[0]),
      end = coordinate(stroke[stroke.length - 1]);
    const pdfPoints = stroke.map(coordinate);
    const components = color
      .match(/[a-f\d]{2}/gi)!
      .map((c) => parseInt(c, 16) / 255);
    const ink = rgb(components[0], components[1], components[2]);
    const view = viewport.current;
    const a = stroke[0],
      b = stroke[stroke.length - 1];
    const bottomLeft = coordinate({
      x: Math.min(a.x, b.x),
      y: Math.max(a.y, b.y),
    });
    await operation(async (pdf) => {
      const p = pdf.getPage(page);
      if (mode === 'highlight') {
        if (Math.abs(end.x - start.x) < 2 || Math.abs(end.y - start.y) < 2)
          throw new Error('Drag across the area to highlight.');
        p.drawRectangle({
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
          color: rgb(1, 0.82, 0.12),
          opacity: 0.3,
        });
      } else if (mode === 'draw') {
        for (let i = 1; i < pdfPoints.length; i++)
          p.drawLine({
            start: pdfPoints[i - 1],
            end: pdfPoints[i],
            thickness: 2,
            color: ink,
          });
      } else if (mode === 'image') {
        if (!image) throw new Error('Choose a PNG or JPEG image first.');
        const width = (Math.abs(b.x - a.x) * view.width) / view.scale,
          height = (Math.abs(b.y - a.y) * view.height) / view.scale;
        if (width < 2 || height < 2)
          throw new Error('Drag a rectangle to place the image.');
        const embedded =
          image.type === 'image/png'
            ? await pdf.embedPng(image.bytes)
            : await pdf.embedJpg(image.bytes);
        p.drawImage(embedded, {
          ...bottomLeft,
          width,
          height,
          rotate: p.getRotation(),
        });
      }
    }, 'Edit saved. Download the PDF to keep a file copy.');
  };
  const redact = async (a: Point, b: Point) => {
    const view = viewport.current;
    if (!view || !data.bytes) return;
    const p0 = coordinate({ x: Math.min(a.x, b.x), y: Math.max(a.y, b.y) });
    const p1 = coordinate({ x: Math.max(a.x, b.x), y: Math.min(a.y, b.y) });
    const rect = {
      x0: Math.min(p0.x, p1.x),
      y0: Math.min(p0.y, p1.y),
      x1: Math.max(p0.x, p1.x),
      y1: Math.max(p0.y, p1.y),
    };
    if (rect.x1 - rect.x0 < 2 || rect.y1 - rect.y0 < 2) {
      setMessage('Drag across the text you want to redact.');
      return;
    }
    const original = data.bytes;
    let coveredOnly = false;
    const box = (pdf: PDFDocument) =>
      pdf.getPage(page).drawRectangle({
        x: rect.x0,
        y: rect.y0,
        width: rect.x1 - rect.x0,
        height: rect.y1 - rect.y0,
        color: rgb(0, 0, 0),
      });
    const pageText = async (bytes: Uint8Array) => {
      const task = getDocument(pdfjsOptions(bytes));
      try {
        const doc = await task.promise;
        const content = await (await doc.getPage(page + 1)).getTextContent();
        return content.items.flatMap((i) =>
          'str' in i && i.str.trim() ? [i] : [],
        );
      } finally {
        void task.destroy();
      }
    };
    await operation(
      (pdf) => {
        removeTextInRect(pdf, page, rect);
        box(pdf);
      },
      'Redacted. The text under the box was deleted from the file.',
      {
        // Text outside the box must survive; otherwise fall back to covering.
        verify: async (bytes) => {
          const outside = (await pageText(original)).filter((i) => {
            const [x, y] = [i.transform[4], i.transform[5]];
            return !(x >= rect.x0 && x <= rect.x1 && y >= rect.y0 && y <= rect.y1);
          });
          const after = compact((await pageText(bytes)).map((i) => i.str).join(''));
          return outside.every((i) => after.includes(compact(i.str)));
        },
        fallback: (pdf) => {
          coveredOnly = true;
          box(pdf);
        },
      },
    );
    if (coveredOnly)
      setMessage(
        'This text could not be separated from nearby text, so it was covered but NOT deleted from the file. Do not rely on this for sensitive data.',
      );
  };

  const movePage = (from: number, to: number) => {
    if (from === to || to < 0 || to >= count) return;
    void operation((pdf) => {
      const p = pdf.getPage(from);
      pdf.removePage(from);
      pdf.insertPage(to, p);
      setPage(to);
    }, `Page ${from + 1} moved to position ${to + 1}.`);
  };


  const embedText = async (
    pdf: PDFDocument,
    value: string,
    font: Parameters<PDFDocument['embedFont']>[0],
  ) => {
    const embedded = await pdf.embedFont(font);
    try {
      embedded.encodeText(value);
    } catch {
      throw new Error(
        'Typed text currently supports Latin characters only. Nothing was changed.',
      );
    }
    return embedded;
  };
  const toRgb = (c: Rgb) => rgb(c[0] / 255, c[1] / 255, c[2] / 255);

  // Enter commits and then unmounts the field, which can also fire blur.
  const committing = useRef(false);
  const commitLine = async () => {
    if (!editing || committing.current) return;
    committing.current = true;
    const { line, value, bg, ink } = editing;
    setEditing(null);
    try {
      await applyLine(line, value, bg, ink);
    } finally {
      committing.current = false;
    }
  };
  const applyLine = async (line: TextLine, value: string, bg: Rgb, ink: Rgb) => {
    if (value === line.text) return;
    const others = (lines?.items ?? []).filter((l) => l !== line);
    const draw = async (pdf: PDFDocument) => {
      if (!value.trim()) return;
      const font = await embedText(
        pdf,
        value,
        standardFont(line.kind, line.bold, line.italic),
      );
      pdf.getPage(page).drawText(value, {
        x: line.x,
        y: line.baseline,
        size: line.size,
        font,
        color: toRgb(ink),
      });
    };
    let coveredOnly = false;
    await operation(
      async (pdf) => {
        removeTextInBox(pdf, page, line);
        await draw(pdf);
      },
      value.trim()
        ? 'Text updated. Download the PDF to keep a file copy.'
        : 'Text removed. Download the PDF to keep a file copy.',
      {
        // Removal is only trusted when every other line is still on the page
        // and nothing but the new text is left where the old line was.
        verify: async (bytes) => {
          const task = getDocument(pdfjsOptions(bytes));
          try {
            const doc = await task.promise;
            const content = await (
              await doc.getPage(page + 1)
            ).getTextContent();
            const items = content.items.flatMap((i) =>
              'str' in i ? [i] : [],
            );
            const all = compact(items.map((i) => i.str).join(''));
            if (others.some((o) => !all.includes(compact(o.text))))
              return false;
            const left = compact(
              items
                .filter(
                  (i) =>
                    Math.abs(i.transform[5] - line.baseline) <
                      line.size * 0.4 &&
                    i.transform[4] >= line.x - line.size * 0.5 &&
                    i.transform[4] <= line.x + line.width,
                )
                .map((i) => i.str)
                .join(''),
            );
            return left === compact(value);
          } finally {
            void task.destroy();
          }
        },
        // Text we cannot rewrite in place (e.g. inside a form XObject) is
        // covered with its own background colour instead.
        fallback: async (pdf) => {
          coveredOnly = true;
          pdf.getPage(page).drawRectangle({
            x: line.x - 1,
            y: line.baseline - line.size * 0.26,
            width: line.width + 2,
            height: line.size * 1.2,
            color: toRgb(bg),
          });
          await draw(pdf);
        },
      },
    );
    if (coveredOnly)
      setMessage(
        'Text updated on the page. This PDF stores that line in a way that cannot be rewritten, so the original is covered rather than deleted; it may still be found by copy or search.',
      );
  };

  const startEdit = (line: TextLine) => {
    if (!canvas.current) return;
    const { bg, ink } = sampleColors(canvas.current, line);
    setEditing({ line, value: line.text, bg, ink });
  };

  const commitDraft = async () => {
    if (!draft || committing.current) return;
    const { x, y, value } = draft;
    setDraft(null);
    if (!value.trim()) return;
    committing.current = true;
    try {
      await placeText(x, y, value);
    } finally {
      committing.current = false;
    }
  };
  const placeText = async (x: number, y: number, value: string) => {
    const view = viewport.current;
    if (!view) return;
    // The box's top-left is where the user clicked; the baseline sits ~0.8em lower.
    const at = coordinate({
      x,
      y: y + (size * 0.8 * view.scale) / view.height,
    });
    const components = color
      .match(/[a-f\d]{2}/gi)!
      .map((c) => parseInt(c, 16) / 255);
    await operation(async (pdf) => {
      const p = pdf.getPage(page);
      const font = await embedText(pdf, value, StandardFonts.Helvetica);
      p.drawText(value, {
        x: at.x,
        y: at.y,
        size,
        font,
        color: rgb(components[0], components[1], components[2]),
        rotate: p.getRotation(),
      });
    }, 'Text added. Download the PDF to keep a file copy.');
  };

  const pointFor = (e: React.PointerEvent<SVGSVGElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };
  const previewReady = preview?.bytes === data.bytes && preview?.page === page;
  const view =
    lines?.bytes === data.bytes && lines?.page === page ? lines.view : null;
  const canEdit = store.ready && !busy && !rendering && previewReady;
  return (
    <ToolShell
      {...props}
      name="NinjaPDF"
      subtitle="Organize pages, fill forms, and add the details that matter."
      hasUnsavedChanges={fieldsDirty}
      compact={!!data.bytes}
      status={
        busy
          ? 'Processing…'
          : fieldsDirty
            ? 'Form changes not applied'
            : store.status
      }
      error={store.error}
    >
      <div className="tool-toolbar" hidden={!data.bytes}>
        <div className="tool-row">
          <button
            className="btn btn-secondary"
            disabled={!store.ready || busy}
            onClick={() => input.current?.click()}
          >
            <Upload size={16} />
            Open PDF
          </button>
          <input
            hidden
            aria-label="Open PDF file"
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void loadFile(file);
            }}
          />
          {data.bytes && (
            <button
              className="btn btn-secondary"
              disabled={!canEdit || fieldsDirty}
              onClick={() => mergeInput.current?.click()}
            >
              <FilePlus2 size={16} />
              Merge PDF
            </button>
          )}
          <input
            hidden
            aria-label="Merge PDF file"
            ref={mergeInput}
            type="file"
            accept="application/pdf,.pdf"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              if (file.size + (data.bytes?.length ?? 0) > 30_000_000) {
                setMessage('Merged PDFs must total less than 30 MB.');
                return;
              }
              await operation(async (pdf) => {
                const source = await openPdf(
                  new Uint8Array(await file.arrayBuffer()),
                );
                requireStatic(source);
                (await pdf.copyPages(source, source.getPageIndices())).forEach(
                  (p) => pdf.addPage(p),
                );
              }, 'PDF pages appended.');
            }}
          />
        </div>
        {data.bytes && (
          <div className="tool-row">
            <button
              className="btn btn-secondary"
              disabled={!canEdit || !history.length || fieldsDirty}
              title="Undo (Ctrl+Z)"
              onClick={() => void undo()}
            >
              <Undo2 size={16} />
              Undo
            </button>
            <button
              className="btn btn-primary"
              disabled={busy || fieldsDirty}
              onClick={() => download(data.bytes!)}
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        )}
      </div>
      {message && (
        <div className="tool-alert" role="status">
          {message}
        </div>
      )}
      <div
        className="tool-pdf-drop"
        data-dropping={dropping || undefined}
        onDragOver={(e) => {
          if (dragFrom !== null || !e.dataTransfer.types.includes('Files')) return;
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropping(false);
        }}
        onDrop={(e) => {
          if (dragFrom !== null) return;
          e.preventDefault();
          setDropping(false);
          const file = [...e.dataTransfer.files].find(
            (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name),
          );
          if (file) void loadFile(file);
          else if (e.dataTransfer.files.length)
            setMessage('That is not a PDF. Drop a .pdf file to open it.');
        }}
      >
      {dropping && (
        <div className="tool-pdf-dropcue" aria-hidden="true">
          <Upload size={28} />
          Drop to open this PDF
        </div>
      )}
      {!data.bytes ? (
        <section className="tool-panel tool-empty tool-pdf-empty">
          <AppMark app="pdf" size="lg" />
          <h2>Drop a PDF here to start editing</h2>
          <p>
            Change existing text, add text and signatures, redact, fill forms,
            and reorder, rotate, merge or split pages. Files stay on this
            device, and your working draft is saved automatically.
          </p>
          <button
            className="btn btn-primary"
            disabled={!store.ready || busy}
            onClick={() => input.current?.click()}
          >
            <Upload size={16} />
            Open PDF
          </button>
          <p className="tool-hint">
            Up to 30 MB. Scanned pages are images, so they have no editable
            text.
          </p>
        </section>
      ) : (
        <div className="tool-pdf-layout">
          <aside className="tool-panel tool-pdf-controls">
            <label>
              File name
              <input
                value={data.name}
                disabled={!store.ready || busy}
                onChange={(e) =>
                  void update((s) => ({ ...s, name: e.target.value }))
                }
              />
            </label>
            {(mode === 'text' || mode === 'draw') && (
              <div className="tool-pdf-options">
                <h2>{mode === 'text' ? 'New text' : 'Pen'}</h2>
                <div className="tool-pdf-pair">
                  {mode === 'text' && (
                    <label>
                      Font size
                      <input
                        type="number"
                        value={size}
                        min="6"
                        max="144"
                        onChange={(e) =>
                          setSize(
                            Math.min(144, Math.max(6, Number(e.target.value))),
                          )
                        }
                      />
                    </label>
                  )}
                  <label>
                    Ink color
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}
            {mode === 'image' && (
              <label>
                PNG or JPEG
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (
                      file.size > 10_000_000 ||
                      !['image/png', 'image/jpeg'].includes(file.type)
                    ) {
                      setMessage('Choose a PNG or JPEG smaller than 10 MB.');
                      return;
                    }
                    setImage({
                      bytes: new Uint8Array(await file.arrayBuffer()),
                      type: file.type,
                    });
                  }}
                />
              </label>
            )}
            <hr />
            <h2>
              Page {page + 1} of {count}
            </h2>
            <ol className="tool-pdf-thumbs" aria-label="Pages">
              {Array.from({ length: count }, (_, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="tool-pdf-thumb"
                    aria-label={`Go to page ${i + 1}`}
                    aria-current={i === page ? 'page' : undefined}
                    draggable={canEdit && !fieldsDirty}
                    data-drop={
                      dragFrom !== null && dragFrom !== i ? 'target' : undefined
                    }
                    title="Click to view. Drag to reorder."
                    onClick={() => setPage(i)}
                    onDragStart={(e) => {
                      setDragFrom(i);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', String(i));
                    }}
                    onDragEnd={() => setDragFrom(null)}
                    onDragOver={(e) => {
                      if (dragFrom === null) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      if (dragFrom === null) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const from = dragFrom;
                      setDragFrom(null);
                      movePage(from, i);
                    }}
                  >
                    {thumbs?.bytes === data.bytes && thumbs.urls[i] ? (
                      <img src={thumbs.urls[i]} alt="" draggable={false} />
                    ) : (
                      <span className="tool-pdf-thumb__blank" />
                    )}
                    <span className="tool-pdf-thumb__num">{i + 1}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="tool-pdf-pair">
              <button
                className="btn btn-secondary"
                disabled={!canEdit || fieldsDirty}
                onClick={() =>
                  void operation((pdf) => {
                    const p = pdf.getPage(page);
                    p.setRotation(degrees((p.getRotation().angle + 90) % 360));
                  }, 'Page rotated.')
                }
              >
                <RotateCw size={15} />
                Rotate
              </button>
              <button
                className="btn btn-secondary"
                disabled={!canEdit || count <= 1 || fieldsDirty}
                onClick={() =>
                  void operation((pdf) => {
                    requireStatic(pdf);
                    pdf.removePage(page);
                  }, 'Page removed. Undo is available.')
                }
              >
                <Trash2 size={15} />
                Delete page
              </button>
              <button
                className="btn btn-secondary"
                disabled={!canEdit || page === 0 || fieldsDirty}
                onClick={() =>
                  void operation((pdf) => {
                    const p = pdf.getPage(page);
                    pdf.removePage(page);
                    pdf.insertPage(page - 1, p);
                    setPage(page - 1);
                  }, 'Page moved earlier.')
                }
              >
                <ArrowUp size={15} />
                Move earlier
              </button>
              <button
                className="btn btn-secondary"
                disabled={!canEdit || page >= count - 1 || fieldsDirty}
                onClick={() =>
                  void operation((pdf) => {
                    const p = pdf.getPage(page);
                    pdf.removePage(page);
                    pdf.insertPage(page + 1, p);
                    setPage(page + 1);
                  }, 'Page moved later.')
                }
              >
                <ArrowDown size={15} />
                Move later
              </button>
              <button
                className="btn btn-secondary"
                disabled={!canEdit || fieldsDirty}
                onClick={() =>
                  void operation(async (pdf) => {
                    requireStatic(pdf);
                    const [copy] = await pdf.copyPages(pdf, [page]);
                    pdf.insertPage(page + 1, copy);
                    setPage(page + 1);
                  }, 'Page duplicated.')
                }
              >
                <Copy size={15} />
                Duplicate
              </button>
              <button
                className="btn btn-secondary"
                disabled={!canEdit || fieldsDirty}
                onClick={() =>
                  void operation((pdf) => {
                    const { width, height } = pdf.getPage(page).getSize();
                    pdf.insertPage(page + 1, [width, height]);
                    setPage(page + 1);
                  }, 'Blank page added after this one.')
                }
              >
                <FilePlus size={15} />
                Blank page
              </button>
            </div>
            <hr />
            <label>
              Extract pages
              <input
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="1, 3-5"
              />
            </label>
            <button
              className="btn btn-secondary"
              disabled={!canEdit || fieldsDirty}
              onClick={() => void extract()}
            >
              Download selected pages
            </button>
            {!!fields.length && (
              <>
                <hr />
                <h2>Form fields</h2>
                {fields.map((field, index) => (
                  <label key={field.name}>
                    {field.name}
                    {field.kind === 'check' ? (
                      <input
                        type="checkbox"
                        disabled={field.readOnly || !canEdit}
                        checked={!!field.value}
                        onChange={(e) => {
                          setFields((s) =>
                            s.map((f, i) =>
                              i === index
                                ? { ...f, value: e.target.checked }
                                : f,
                            ),
                          );
                          setFieldsDirty(true);
                        }}
                      />
                    ) : field.kind === 'choice' || field.kind === 'radio' ? (
                      <select
                        disabled={field.readOnly || !canEdit}
                        multiple={field.multiple}
                        value={field.value as string | string[]}
                        onChange={(e) => {
                          const value = field.multiple
                            ? [...e.target.selectedOptions].map((o) => o.value)
                            : e.target.value;
                          setFields((s) =>
                            s.map((f, i) =>
                              i === index ? { ...f, value } : f,
                            ),
                          );
                          setFieldsDirty(true);
                        }}
                      >
                        {!field.multiple && (
                          <option value="">Not selected</option>
                        )}
                        {field.options?.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <DictateField
                        label={field.name}
                        disabled={
                          field.readOnly ||
                          field.kind === 'unsupported' ||
                          !canEdit
                        }
                        onText={(spoken) => {
                          setFields((s) =>
                            s.map((f, i) =>
                              i === index
                                ? { ...f, value: appendSpoken(String(f.value), spoken) }
                                : f,
                            ),
                          );
                          setFieldsDirty(true);
                        }}
                      >
                        <input
                          disabled={
                            field.readOnly ||
                            field.kind === 'unsupported' ||
                            !canEdit
                          }
                          value={String(field.value)}
                          onChange={(e) => {
                            setFields((s) =>
                              s.map((f, i) =>
                                i === index ? { ...f, value: e.target.value } : f,
                              ),
                            );
                            setFieldsDirty(true);
                          }}
                        />
                      </DictateField>
                    )}
                  </label>
                ))}
                <button
                  className="btn btn-primary"
                  disabled={!canEdit || !fieldsDirty}
                  onClick={async () => {
                    if (!data.bytes || working.current) return;
                    working.current = true;
                    setBusy(true);
                    try {
                      const original = data.bytes;
                      const pdf = await openPdf(original);
                      fillFields(pdf, fields);
                      const bytes = await pdf.save();
                      if (await update((s) => ({ ...s, bytes }))) {
                        setHistory((h) => [...h.slice(-4), original]);
                        setFieldsDirty(false);
                        setMessage(
                          'Form values saved. Fields remain editable.',
                        );
                      }
                    } catch (error) {
                      setMessage(
                        `Form could not be saved: ${error instanceof Error ? error.message : 'Unsupported value'}. Your entered values remain available.`,
                      );
                    } finally {
                      setBusy(false);
                      working.current = false;
                    }
                  }}
                >
                  Apply form values
                </button>
                {fieldsDirty && (
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      if (data.bytes)
                        setFields(readFields(await openPdf(data.bytes)));
                      setFieldsDirty(false);
                    }}
                  >
                    Discard form changes
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  disabled={!canEdit || fieldsDirty}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Flatten all form fields into static page content? Download an editable copy first. This enables splitting and deleting form pages.',
                      )
                    )
                      void operation(
                        (pdf) => pdf.getForm().flatten(),
                        'Forms flattened. Fields are now static content.',
                      );
                  }}
                >
                  Flatten forms
                </button>
              </>
            )}
          </aside>
          <section>
            <div
              className="tool-pdf-tools"
              role="toolbar"
              aria-label="Editing tools"
            >
              {TOOLS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="tool-pdf-tool"
                  aria-pressed={mode === id}
                  disabled={!store.ready || busy || fieldsDirty}
                  onClick={() => {
                    setMode(id);
                    setPoints([]);
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <p className="tool-pdf-hint" role="status">
              {fieldsDirty
                ? 'Apply or discard your form values to keep editing.'
                : mode === 'edit' && view && lines?.items.length === 0
                  ? 'This page has no editable text — it is probably a scanned image. Use Add text to type on it, or Redact to cover areas.'
                  : TOOL_HINT[mode]}
            </p>
            <div className="tool-pdf-toolbar">
              <button
                className="btn btn-secondary btn-icon"
                aria-label="Previous page"
                disabled={page === 0 || busy || rendering}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <label className="tool-inline-label">
                <span className="sr-only">Page</span>
                <select
                  aria-label="Current page"
                  disabled={busy || rendering}
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                >
                  {Array.from({ length: count }, (_, i) => (
                    <option key={i} value={i}>
                      {i + 1} / {count}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="btn btn-secondary btn-icon"
                aria-label="Next page"
                disabled={page >= count - 1 || busy || rendering}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={17} />
              </button>
              <div className="tool-pdf-zoom" role="group" aria-label="Zoom">
                <button
                  className="btn btn-secondary btn-icon"
                  aria-label="Zoom out"
                  title="Zoom out (Ctrl+-)"
                  disabled={zoom <= 0.5}
                  onClick={() =>
                    setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))
                  }
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  className="btn btn-secondary tool-pdf-zoom__level"
                  title="Fit to width"
                  aria-label={`Zoom ${Math.round(zoom * 100)}%, reset to fit`}
                  onClick={() => setZoom(1)}
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  aria-label="Zoom in"
                  title="Zoom in (Ctrl++)"
                  disabled={zoom >= 3}
                  onClick={() =>
                    setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))
                  }
                >
                  <ZoomIn size={16} />
                </button>
              </div>
              <span className="tool-muted tool-pdf-state" role="status">
                {rendering || busy || !previewReady
                  ? 'Preparing page…'
                  : 'Ready'}
              </span>
            </div>
            <div className="tool-pdf-preview">
              <div
                className="tool-pdf-page"
                data-render-version={renderVersion}
                data-zoomed={zoom > 1 || undefined}
                style={baseWidth ? { width: `${baseWidth * zoom}px` } : undefined}
              >
                <canvas ref={canvas} aria-label={`PDF page ${page + 1}`} />
                {mode === 'edit' && canEdit && !fieldsDirty && view && (
                  <div className="tool-pdf-textlayer">
                    {(lines?.bytes === data.bytes && lines?.page === page
                      ? lines.items
                      : []
                    ).map((line) =>
                      editing?.line === line ? (
                        <span
                          key={line.id}
                          className="tool-pdf-editwrap"
                          style={{
                            left: `${(line.left / view.width) * 100}%`,
                            top: `${(line.top / view.height) * 100}%`,
                            height: `${(line.boxHeight / view.height) * 100}%`,
                          }}
                        >
                        <input
                          ref={editInput}
                          className={`tool-pdf-textedit tool-pdf-font--${line.kind}`}
                          aria-label="Edit text"
                          autoFocus
                          spellCheck
                          onFocus={(e) => e.currentTarget.select()}
                          value={editing.value}
                          style={{
                            minWidth: `${line.boxWidth * cssScale}px`,
                            fontSize: `${line.size * view.scale * cssScale}px`,
                            fontWeight: line.bold ? 700 : 400,
                            fontStyle: line.italic ? 'italic' : 'normal',
                            color: hex(editing.ink),
                            background: hex(editing.bg),
                          }}
                          onChange={(e) =>
                            setEditing({ ...editing, value: e.target.value })
                          }
                          onBlur={() => void commitLine()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void commitLine();
                            if (e.key === 'Escape') {
                              e.stopPropagation();
                              setEditing(null);
                            }
                          }}
                        />
                        <DictateButton
                          label="this text"
                          className="tool-pdf-mic"
                          onText={(spoken) => {
                            const el = editInput.current;
                            setEditing((current) =>
                              current
                                ? {
                                    ...current,
                                    value: spliceSpoken(
                                      current.value,
                                      el?.selectionStart ?? null,
                                      el?.selectionEnd ?? null,
                                      spoken,
                                    ),
                                  }
                                : current,
                            );
                          }}
                        />
                        </span>
                      ) : (
                        <button
                          key={line.id}
                          type="button"
                          className="tool-pdf-textline"
                          aria-label={`Edit text: ${line.text}`}
                          title="Click to edit"
                          style={{
                            left: `${(line.left / view.width) * 100}%`,
                            top: `${(line.top / view.height) * 100}%`,
                            width: `${(line.boxWidth / view.width) * 100}%`,
                            height: `${(line.boxHeight / view.height) * 100}%`,
                          }}
                          onClick={() => startEdit(line)}
                        />
                      ),
                    )}
                  </div>
                )}
                {mode === 'text' && canEdit && !fieldsDirty && view && (
                  <div
                    className="tool-pdf-textlayer tool-pdf-textlayer--add"
                    aria-label="PDF annotation surface"
                    onPointerDown={(e) => {
                      if (e.target !== e.currentTarget || e.button !== 0) return;
                      e.preventDefault();
                      if (draft?.value.trim()) {
                        void commitDraft();
                        return;
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDraft({
                        x: (e.clientX - rect.left) / rect.width,
                        y: (e.clientY - rect.top) / rect.height,
                        value: '',
                      });
                    }}
                  >
                    {draft && (
                      <span
                        className="tool-pdf-editwrap"
                        style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }}
                      >
                      <input
                        ref={draftInput}
                        className="tool-pdf-textedit tool-pdf-font--sans"
                        aria-label="New text"
                        placeholder="Type or speak"
                        autoFocus
                        value={draft.value}
                        style={{
                          fontSize: `${size * view.scale * cssScale}px`,
                          color,
                        }}
                        onChange={(e) =>
                          setDraft({ ...draft, value: e.target.value })
                        }
                        onBlur={() => void commitDraft()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void commitDraft();
                          if (e.key === 'Escape') {
                            e.stopPropagation();
                            setDraft(null);
                          }
                        }}
                      />
                      <DictateButton
                        label="new text"
                        className="tool-pdf-mic"
                        onText={(spoken) => {
                          const el = draftInput.current;
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  value: spliceSpoken(
                                    current.value,
                                    el?.selectionStart ?? null,
                                    el?.selectionEnd ?? null,
                                    spoken,
                                  ),
                                }
                              : current,
                          );
                        }}
                      />
                      </span>
                    )}
                  </div>
                )}
                {(mode === 'highlight' ||
                  mode === 'redact' ||
                  mode === 'draw' ||
                  mode === 'image') &&
                  canEdit &&
                  !fieldsDirty && (
                  <svg
                    className="tool-pdf-overlay"
                    aria-label="PDF annotation surface"
                    viewBox="0 0 1 1"
                    preserveAspectRatio="none"
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      drawing.current = [pointFor(e)];
                      setPoints(drawing.current);
                    }}
                    onPointerMove={(e) => {
                      if (!drawing.current.length) return;
                      drawing.current =
                        mode === 'draw'
                          ? [...drawing.current.slice(-4999), pointFor(e)]
                          : [drawing.current[0], pointFor(e)];
                      setPoints(drawing.current);
                    }}
                    onPointerUp={() => {
                      const stroke = drawing.current;
                      drawing.current = [];
                      setPoints([]);
                      if (stroke.length) void annotate(stroke);
                    }}
                    onPointerCancel={() => {
                      drawing.current = [];
                      setPoints([]);
                    }}
                  >
                    {points.length > 1 &&
                      (mode === 'draw' ? (
                        <polyline
                          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                          stroke={color}
                          strokeWidth=".003"
                          fill="none"
                        />
                      ) : (
                        <rect
                          x={Math.min(points[0].x, points[points.length - 1].x)}
                          y={Math.min(points[0].y, points[points.length - 1].y)}
                          width={Math.abs(
                            points[points.length - 1].x - points[0].x,
                          )}
                          height={Math.abs(
                            points[points.length - 1].y - points[0].y,
                          )}
                          fill={mode === 'redact' ? '#000' : mode === 'image' ? '#2563eb' : '#facc15'}
                          opacity={mode === 'redact' ? '.7' : '.35'}
                        />
                      ))}
                  </svg>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
      </div>
    </ToolShell>
  );
}
