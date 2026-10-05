import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowUpRight,
  Brush,
  Circle,
  ClipboardCopy,
  Crop,
  Download,
  Eraser,
  FilePlus2,
  FlipHorizontal2,
  FlipVertical2,
  Hand,
  History,
  ImagePlus,
  Minus,
  PaintBucket,
  Pipette,
  Redo2,
  RotateCcw,
  RotateCw,
  Scaling,
  SlidersHorizontal,
  Square,
  Type,
  Undo2,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { AppMark } from '../components/AppMark';
import { DictateField } from '../components/Dictate';
import { appendSpoken } from '../utils/speech';
import { useToolStorage, downloadFile } from '../utils/toolStorage';
import { takeHandoff } from '../utils/handoff';
import {
  DEFAULT_ADJUST,
  PRESETS,
  adjustImageData,
  canvasFrom,
  canvasResize,
  cloneCanvas,
  constrainEnd,
  crop as cropCanvas,
  ctx2d,
  drawShape,
  drawText,
  eraseSimilar,
  fillSimilar,
  flip,
  hexToRgb,
  isNeutral,
  makeCanvas,
  readPixels,
  resample,
  rgbToHex,
  rotate90,
  straighten,
  strokeSegment,
} from '../utils/imageOps';
import type {
  AdjustParams,
  Point,
  Rect,
  ShapeKind,
  StraightenMode,
  TextStyle,
} from '../utils/imageOps';
import {
  FORMAT_INFO,
  IMAGE_ACCEPT,
  canvasToBlob,
  decodeImage,
  exportImage,
  formatBytes,
  isImageFile,
  supportedFormats,
} from '../utils/imageIO';
import type { ExportFormat } from '../utils/imageIO';
import '../styles/tools.css';
import '../styles/image.css';

type Tool =
  | 'hand'
  | 'crop'
  | 'adjust'
  | 'brush'
  | 'eraser'
  | 'shape'
  | 'text'
  | 'magic'
  | 'fill'
  | 'picker';
type Panel = 'tool' | 'transform' | 'export';

interface ImageWorkspace {
  name: string;
  png: Uint8Array | null;
}
const EMPTY: ImageWorkspace = { name: 'image', png: null };

const TOOLS: { id: Tool; label: string; icon: typeof Brush; key: string }[] = [
  { id: 'hand', label: 'Move', icon: Hand, key: 'H' },
  { id: 'crop', label: 'Crop', icon: Crop, key: 'C' },
  { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal, key: 'A' },
  { id: 'brush', label: 'Brush', icon: Brush, key: 'B' },
  { id: 'eraser', label: 'Eraser', icon: Eraser, key: 'E' },
  { id: 'shape', label: 'Shapes', icon: Square, key: 'U' },
  { id: 'text', label: 'Text', icon: Type, key: 'T' },
  { id: 'magic', label: 'Remove color', icon: Wand2, key: 'W' },
  { id: 'fill', label: 'Fill', icon: PaintBucket, key: 'G' },
  { id: 'picker', label: 'Eyedropper', icon: Pipette, key: 'I' },
];

const HINT: Record<Tool, string> = {
  hand: 'Scroll or drag to look around. Ctrl + wheel zooms.',
  crop: 'Drag the corners or edges, or drag a new box. Press Enter to crop, Esc to cancel.',
  adjust: 'Move the sliders or pick a look, then Apply. Double-click a slider to reset it.',
  brush: 'Paint on the image. Hold Shift to draw a straight line from your last stroke.',
  eraser: 'Erase to transparency. Export as PNG or WebP to keep the transparent areas.',
  shape: 'Drag to draw. Hold Shift for squares, circles and 45° lines.',
  text: 'Click where the text should start, type (or speak), then press Enter.',
  magic: 'Click a color to make it, and similar colors, transparent. Great for removing plain backgrounds.',
  fill: 'Click an area to fill it with the current color.',
  picker: 'Click the image to pick a color.',
};

const ASPECTS: { id: string; label: string; ratio: number | null | 'orig' }[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: 'orig', label: 'Original', ratio: 'orig' },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
];

const FONTS = [
  ['Inter Variable, Inter, system-ui, sans-serif', 'Sans'],
  ['Georgia, "Times New Roman", serif', 'Serif'],
  ['"Courier New", ui-monospace, monospace', 'Mono'],
  ['Impact, "Arial Black", sans-serif', 'Impact'],
  ['"Comic Sans MS", "Comic Neue", cursive', 'Casual'],
] as const;

const ADJUST_SLIDERS: {
  key: keyof AdjustParams;
  label: string;
  min: number;
  max: number;
  group: string;
}[] = [
  { key: 'exposure', label: 'Exposure', min: -100, max: 100, group: 'Light' },
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, group: 'Light' },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, group: 'Light' },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, group: 'Light' },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, group: 'Light' },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, group: 'Color' },
  { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, group: 'Color' },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100, group: 'Color' },
  { key: 'tint', label: 'Tint', min: -100, max: 100, group: 'Color' },
  { key: 'hue', label: 'Hue', min: -180, max: 180, group: 'Color' },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, group: 'Color' },
  { key: 'blur', label: 'Blur', min: 0, max: 40, group: 'Detail' },
  { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, group: 'Detail' },
  { key: 'vignette', label: 'Vignette', min: -100, max: 100, group: 'Detail' },
];

const PREVIEW_MAX = 1400;
const HISTORY_PIXELS = 160_000_000;
const ANCHORS = [
  'top left',
  'top',
  'top right',
  'left',
  'center',
  'right',
  'bottom left',
  'bottom',
  'bottom right',
];

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, '') || 'image';
}

function Slider({
  label,
  value,
  set,
  min,
  max,
  unit = '',
}: {
  label: string;
  value: number;
  set: (v: number) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  return (
    <label className="img-slider">
      <span>
        {label}
        <output>
          {value}
          {unit}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        onDoubleClick={() => set(min < 0 ? 0 : min)}
      />
    </label>
  );
}

export default function ImageEditor(props: ToolProps) {
  const store = useToolStorage<ImageWorkspace>('image', EMPTY);
  const { data, update } = store;

  // The document: one committed bitmap plus undo/redo snapshots.
  const docRef = useRef<HTMLCanvasElement | null>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const undoRef = useRef<HTMLCanvasElement[]>([]);
  const redoRef = useRef<HTMLCanvasElement[]>([]);
  const [hist, setHist] = useState({ undo: 0, redo: 0 });
  const [version, setVersion] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [name, setName] = useState('image');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const restored = useRef(false);

  const [tool, setTool] = useState<Tool>('hand');
  const [panel, setPanel] = useState<Panel>('tool');
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [viewport, setViewport] = useState({ w: 800, h: 600 });
  const [checker, setChecker] = useState(true);
  const [dropping, setDropping] = useState(false);

  // Tool settings
  const [color, setColor] = useState('#e11d48');
  const [brushSize, setBrushSize] = useState(24);
  const [hardness, setHardness] = useState(80);
  const [opacity, setOpacity] = useState(100);
  const [shapeKind, setShapeKind] = useState<ShapeKind>('rect');
  const [shapeFill, setShapeFill] = useState(false);
  const [fillColor, setFillColor] = useState('#fde047');
  const [tolerance, setTolerance] = useState(24);
  const [contiguous, setContiguous] = useState(true);
  const [softness, setSoftness] = useState(20);
  const [textValue, setTextValue] = useState('');
  const [textAt, setTextAt] = useState<Point | null>(null);
  const [textStyle, setTextStyle] = useState<TextStyle>({
    family: FONTS[0][0],
    size: 64,
    color: '#ffffff',
    bold: true,
    italic: false,
    outline: '#000000',
    opacity: 1,
  });
  const [adjust, setAdjust] = useState<AdjustParams>(DEFAULT_ADJUST);
  const [aspect, setAspect] = useState('free');
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [angle, setAngle] = useState(0);
  const [straightenMode, setStraightenMode] = useState<StraightenMode>('crop');
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(0);
  const [anchor, setAnchor] = useState(4);
  const [canvasFill, setCanvasFill] = useState<string | null>(null);

  // Export
  const [formats, setFormats] = useState<ExportFormat[]>(['png', 'jpeg', 'ico']);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(90);
  const [outW, setOutW] = useState(0);
  const [outH, setOutH] = useState(0);
  const [outLock, setOutLock] = useState(true);
  const [background, setBackground] = useState('#ffffff');
  const [icoSizes, setIcoSizes] = useState([16, 32, 48]);
  const [lastExport, setLastExport] = useState('');

  // New canvas dialog
  const [newOpen, setNewOpen] = useState(false);
  const [newW, setNewW] = useState(1200);
  const [newH, setNewH] = useState(800);
  const [newBg, setNewBg] = useState<'transparent' | 'white' | 'color'>('white');
  const [newColor, setNewColor] = useState('#1e293b');

  const viewRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const previewSource = useRef<HTMLCanvasElement | null>(null);
  const lastStrokeEnd = useRef<Point | null>(null);
  const drag = useRef<{
    kind: 'stroke' | 'shape' | 'crop';
    start: Point;
    last: Point;
    base?: HTMLCanvasElement;
    layer?: HTMLCanvasElement;
    mode?: string;
    rect?: Rect;
  } | null>(null);

  useEffect(() => {
    void supportedFormats().then(setFormats);
  }, []);

  const hasDoc = !!size;
  const scale = useMemo(() => {
    if (!size) return 1;
    if (zoom !== 'fit') return zoom;
    return Math.max(
      0.02,
      Math.min(1, (viewport.w - 24) / size.w, (viewport.h - 24) / size.h),
    );
  }, [size, zoom, viewport]);

  /* ---------------- document lifecycle ---------------- */

  const persistTimer = useRef<number | undefined>(undefined);
  const schedulePersist = useCallback(
    (fileName: string) => {
      window.clearTimeout(persistTimer.current);
      setDirty(true);
      persistTimer.current = window.setTimeout(async () => {
        const doc = docRef.current;
        if (!doc) return;
        try {
          const blob = await canvasToBlob(doc, 'image/png');
          const png = new Uint8Array(await blob.arrayBuffer());
          if (await update(() => ({ name: fileName, png }))) setDirty(false);
        } catch {
          setMessage(
            'This image is too large to keep in browser storage. Export it to keep a copy.',
          );
        }
      }, 900);
    },
    [update],
  );

  const setDocument = useCallback(
    (
      canvas: HTMLCanvasElement,
      opts: { record?: boolean; fresh?: boolean; fileName?: string } = {},
    ) => {
      const prev = docRef.current;
      if (opts.fresh) {
        undoRef.current = [];
        redoRef.current = [];
        originalRef.current = cloneCanvas(canvas);
      } else if (opts.record !== false && prev) {
        undoRef.current.push(prev);
        redoRef.current = [];
        // Keep history within a pixel budget so big photos don't exhaust memory.
        let pixels = undoRef.current.reduce((n, c) => n + c.width * c.height, 0);
        while (
          undoRef.current.length > 1 &&
          (pixels > HISTORY_PIXELS || undoRef.current.length > 30)
        ) {
          const dropped = undoRef.current.shift()!;
          pixels -= dropped.width * dropped.height;
        }
      }
      setHist({ undo: undoRef.current.length, redo: redoRef.current.length });
      docRef.current = canvas;
      setSize({ w: canvas.width, h: canvas.height });
      setVersion((v) => v + 1);
      const fileName = opts.fileName ?? name;
      if (opts.fileName) setName(opts.fileName);
      schedulePersist(fileName);
    },
    [name, schedulePersist],
  );

  const openBlob = useCallback(
    async (blob: Blob, fileName: string) => {
      if (
        docRef.current &&
        undoRef.current.length &&
        !window.confirm(
          'Open this image? Your edits to the current image will be replaced (export first if you need them).',
        )
      )
        return;
      setBusy(true);
      try {
        const decoded = await decodeImage(blob);
        setDocument(decoded.canvas, { fresh: true, fileName: baseName(fileName) });
        setZoom('fit');
        setTool('hand');
        setCropRect(null);
        setAdjust(DEFAULT_ADJUST);
        setMessage(
          decoded.scaled
            ? `Opened ${fileName}. It was ${decoded.originalWidth} × ${decoded.originalHeight}, so it was scaled to ${decoded.canvas.width} × ${decoded.canvas.height} to fit in browser memory.`
            : `Opened ${fileName} (${decoded.canvas.width} × ${decoded.canvas.height}).`,
        );
      } catch {
        setMessage(
          'That file could not be opened as an image. Try PNG, JPEG, WebP, GIF, BMP or AVIF.',
        );
      } finally {
        setBusy(false);
      }
    },
    [setDocument],
  );

  // Restore the autosaved image once storage is ready, or take a hand-off.
  useEffect(() => {
    if (!store.ready || restored.current) return;
    restored.current = true;
    const handed = takeHandoff('image');
    if (handed) {
      void openBlob(handed, handed.name);
      return;
    }
    if (data.png) {
      const blob = new Blob([data.png as BlobPart], { type: 'image/png' });
      void decodeImage(blob)
        .then((d) => {
          docRef.current = d.canvas;
          originalRef.current = cloneCanvas(d.canvas);
          setName(data.name || 'image');
          setSize({ w: d.canvas.width, h: d.canvas.height });
          setVersion((v) => v + 1);
        })
        .catch(() => setMessage('The saved image could not be restored.'));
    }
  }, [store.ready, data, openBlob]);

  const undo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (!prev || !docRef.current) return;
    redoRef.current.push(docRef.current);
    docRef.current = prev;
    setHist({ undo: undoRef.current.length, redo: redoRef.current.length });
    setSize({ w: prev.width, h: prev.height });
    setVersion((v) => v + 1);
    setCropRect(null);
    schedulePersist(name);
  }, [name, schedulePersist]);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next || !docRef.current) return;
    undoRef.current.push(docRef.current);
    docRef.current = next;
    setHist({ undo: undoRef.current.length, redo: redoRef.current.length });
    setSize({ w: next.width, h: next.height });
    setVersion((v) => v + 1);
    schedulePersist(name);
  }, [name, schedulePersist]);

  /* ---------------- rendering ---------------- */

  // Downscaled copy for live previews (adjustments, straighten).
  useEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    const k = Math.min(1, PREVIEW_MAX / Math.max(doc.width, doc.height));
    previewSource.current = k < 1 ? resample(doc, doc.width * k, doc.height * k) : doc;
  }, [version]);

  const frame = useRef(0);
  useEffect(() => {
    const view = viewRef.current;
    const doc = docRef.current;
    if (!view || !doc) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const src = previewSource.current ?? doc;
      if (tool === 'adjust' && !isNeutral(adjust)) {
        const out = adjustImageData(readPixels(src), adjust, src.width / doc.width);
        view.width = src.width;
        view.height = src.height;
        ctx2d(view).putImageData(out, 0, 0);
      } else if (panel === 'transform' && angle !== 0) {
        const s = straighten(src, angle, straightenMode);
        view.width = s.width;
        view.height = s.height;
        ctx2d(view).drawImage(s, 0, 0);
      } else {
        view.width = doc.width;
        view.height = doc.height;
        ctx2d(view).drawImage(doc, 0, 0);
      }
    });
    return () => cancelAnimationFrame(frame.current);
  }, [version, tool, adjust, angle, panel, straightenMode]);

  useEffect(() => {
    const o = overlayRef.current;
    if (!o || !size) return;
    o.width = size.w;
    o.height = size.h;
  }, [size]);

  // Track the stage size for "fit", and zoom with Ctrl + wheel (non-passive).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setViewport({ w: el.clientWidth, h: el.clientHeight }),
    );
    ro.observe(el);
    const wheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setZoom((z) => {
        const cur =
          z === 'fit'
            ? Number((el.querySelector('.img-canvas') as HTMLElement)?.dataset.scale || 1)
            : z;
        return Math.min(8, Math.max(0.02, cur * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      });
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener('wheel', wheel);
    };
  }, [hasDoc]);

  // Keep the resize / canvas / export sizes in step with the document.
  useEffect(() => {
    if (!size) return;
    setResizeW(size.w);
    setResizeH(size.h);
    setCanvasW(size.w);
    setCanvasH(size.h);
    setOutW(size.w);
    setOutH(size.h);
  }, [size]);

  /* ---------------- pointer tools ---------------- */

  const toDoc = (e: { clientX: number; clientY: number }): Point => {
    const r = overlayRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * (size?.w ?? 1),
      y: ((e.clientY - r.top) / r.height) * (size?.h ?? 1),
    };
  };

  const clearOverlay = () => {
    const o = overlayRef.current;
    if (o) ctx2d(o).clearRect(0, 0, o.width, o.height);
  };

  const renderStroke = (eraser: boolean) => {
    const d = drag.current;
    const view = viewRef.current;
    if (!d?.base || !d.layer || !view) return;
    if (view.width !== d.base.width) {
      view.width = d.base.width;
      view.height = d.base.height;
    }
    const c = ctx2d(view);
    c.save();
    c.clearRect(0, 0, view.width, view.height);
    c.drawImage(d.base, 0, 0);
    c.globalAlpha = opacity / 100;
    c.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    c.drawImage(d.layer, 0, 0);
    c.restore();
  };

  const aspectRatio = (): number | null => {
    const a = ASPECTS.find((x) => x.id === aspect)?.ratio ?? null;
    if (a === 'orig') return size ? size.w / size.h : null;
    return a;
  };

  const handleTol = () => 14 / scale;
  const hitHandle = (r: Rect, p: Point) => {
    const t = handleTol();
    const xs = { w: r.x, e: r.x + r.w, c: r.x + r.w / 2 };
    const ys = { n: r.y, s: r.y + r.h, c: r.y + r.h / 2 };
    const handles: [string, number, number][] = [
      ['nw', xs.w, ys.n],
      ['ne', xs.e, ys.n],
      ['sw', xs.w, ys.s],
      ['se', xs.e, ys.s],
      ['n', xs.c, ys.n],
      ['s', xs.c, ys.s],
      ['w', xs.w, ys.c],
      ['e', xs.e, ys.c],
    ];
    for (const [id, hx, hy] of handles)
      if (Math.abs(p.x - hx) <= t && Math.abs(p.y - hy) <= t) return id;
    return null;
  };
  const inside = (r: Rect, p: Point) =>
    p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const doc = docRef.current;
    if (!doc || busy || e.button > 0) return;
    const p = toDoc(e);
    if (tool === 'hand' || tool === 'adjust') return;
    if (tool === 'picker') {
      const px = ctx2d(doc).getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
      const hex = rgbToHex(px[0], px[1], px[2]);
      setColor(hex);
      setMessage(
        `Picked ${hex}${px[3] < 255 ? ` (opacity ${Math.round((px[3] / 255) * 100)}%)` : ''}.`,
      );
      return;
    }
    if (tool === 'magic' || tool === 'fill') {
      setBusy(true);
      window.setTimeout(() => {
        try {
          const img = readPixels(doc);
          const result =
            tool === 'magic'
              ? eraseSimilar(img, p.x, p.y, tolerance, contiguous, softness)
              : fillSimilar(img, p.x, p.y, tolerance, contiguous, hexToRgb(color), opacity / 100);
          setDocument(canvasFrom(result.image));
          setMessage(
            tool === 'magic'
              ? `Made ${result.count.toLocaleString()} pixels transparent. Export as PNG or WebP to keep the transparency.`
              : `Filled ${result.count.toLocaleString()} pixels.`,
          );
        } finally {
          setBusy(false);
        }
      }, 10);
      return;
    }
    if (tool === 'text') {
      if (textAt && textValue.trim()) commitText();
      setTextAt(p);
      setTextValue('');
      window.setTimeout(() => textInput.current?.focus(), 0);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === 'brush' || tool === 'eraser') {
      const layer = makeCanvas(doc.width, doc.height);
      const from = e.shiftKey && lastStrokeEnd.current ? lastStrokeEnd.current : p;
      strokeSegment(
        ctx2d(layer),
        from,
        p,
        brushSize,
        hardness / 100,
        tool === 'eraser' ? '#000000' : color,
      );
      drag.current = { kind: 'stroke', start: p, last: p, base: cloneCanvas(doc), layer };
      renderStroke(tool === 'eraser');
    } else if (tool === 'shape') {
      drag.current = { kind: 'shape', start: p, last: p };
    } else if (tool === 'crop') {
      const r = cropRect && cropRect.w > 1 ? cropRect : null;
      const handle = r ? hitHandle(r, p) : null;
      const mode = handle ?? (r && inside(r, p) ? 'move' : 'new');
      drag.current = { kind: 'crop', start: p, last: p, mode, rect: r ?? undefined };
      if (mode === 'new') setCropRect({ x: p.x, y: p.y, w: 0, h: 0 });
    }
  };

  const nextCrop = (d: NonNullable<typeof drag.current>, p: Point): Rect => {
    const W = size!.w;
    const H = size!.h;
    const ratio = aspectRatio();
    if (d.mode === 'move' && d.rect) {
      return {
        ...d.rect,
        x: Math.max(0, Math.min(W - d.rect.w, d.rect.x + p.x - d.start.x)),
        y: Math.max(0, Math.min(H - d.rect.h, d.rect.y + p.y - d.start.y)),
      };
    }
    let x0: number, y0: number, x1: number, y1: number;
    if (d.mode === 'new' || !d.rect) {
      x0 = d.start.x;
      y0 = d.start.y;
      x1 = p.x;
      y1 = p.y;
    } else {
      const r = d.rect;
      x0 = r.x;
      y0 = r.y;
      x1 = r.x + r.w;
      y1 = r.y + r.h;
      if (d.mode!.includes('w')) x0 = p.x;
      if (d.mode!.includes('e')) x1 = p.x;
      if (d.mode!.includes('n')) y0 = p.y;
      if (d.mode!.includes('s')) y1 = p.y;
    }
    x0 = Math.max(0, Math.min(W, x0));
    x1 = Math.max(0, Math.min(W, x1));
    y0 = Math.max(0, Math.min(H, y0));
    y1 = Math.max(0, Math.min(H, y1));
    let w = Math.abs(x1 - x0);
    let h = Math.abs(y1 - y0);
    if (ratio) {
      if (d.mode === 'n' || d.mode === 's') w = h * ratio;
      else if (d.mode === 'e' || d.mode === 'w') h = w / ratio;
      else if (w / Math.max(h, 1e-6) > ratio) w = h * ratio;
      else h = w / ratio;
    }
    const x = Math.max(0, x1 >= x0 ? x0 : x0 - w);
    const y = Math.max(0, y1 >= y0 ? y0 : y0 - h);
    return { x, y, w: Math.min(w, W - x), h: Math.min(h, H - y) };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || !size) return;
    let p = toDoc(e);
    if (d.kind === 'stroke' && d.layer) {
      strokeSegment(
        ctx2d(d.layer),
        d.last,
        p,
        brushSize,
        hardness / 100,
        tool === 'eraser' ? '#000000' : color,
      );
      d.last = p;
      renderStroke(tool === 'eraser');
    } else if (d.kind === 'shape') {
      if (e.shiftKey) p = constrainEnd(shapeKind, d.start, p);
      d.last = p;
      const o = overlayRef.current!;
      const c = ctx2d(o);
      c.clearRect(0, 0, o.width, o.height);
      drawShape(c, shapeKind, d.start, p, {
        stroke: color,
        width: Math.max(1, brushSize / 3),
        fill: shapeFill ? fillColor : null,
        opacity: opacity / 100,
      });
    } else if (d.kind === 'crop') {
      setCropRect(nextCrop(d, p));
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    drag.current = null;
    const doc = docRef.current;
    if (!d || !doc) return;
    if (d.kind === 'stroke' && d.base && d.layer) {
      const out = cloneCanvas(d.base);
      const c = ctx2d(out);
      c.globalAlpha = opacity / 100;
      c.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      c.drawImage(d.layer, 0, 0);
      lastStrokeEnd.current = d.last;
      setDocument(out);
    } else if (d.kind === 'shape') {
      let end = toDoc(e);
      if (e.shiftKey) end = constrainEnd(shapeKind, d.start, end);
      clearOverlay();
      if (Math.hypot(end.x - d.start.x, end.y - d.start.y) < 2) return;
      const out = cloneCanvas(doc);
      drawShape(ctx2d(out), shapeKind, d.start, end, {
        stroke: color,
        width: Math.max(1, brushSize / 3),
        fill: shapeFill ? fillColor : null,
        opacity: opacity / 100,
      });
      setDocument(out);
    }
  };

  /* ---------------- commands ---------------- */

  const applyCrop = useCallback(() => {
    const doc = docRef.current;
    if (!doc || !cropRect || cropRect.w < 2 || cropRect.h < 2) return;
    setDocument(cropCanvas(doc, cropRect));
    setMessage(`Cropped to ${Math.round(cropRect.w)} × ${Math.round(cropRect.h)}.`);
    setCropRect(null);
  }, [cropRect, setDocument]);

  const applyAdjust = () => {
    const doc = docRef.current;
    if (!doc || isNeutral(adjust)) return;
    setBusy(true);
    window.setTimeout(() => {
      try {
        setDocument(canvasFrom(adjustImageData(readPixels(doc), adjust, 1)));
        setAdjust(DEFAULT_ADJUST);
        setMessage('Adjustments applied.');
      } finally {
        setBusy(false);
      }
    }, 20);
  };

  function commitText() {
    const doc = docRef.current;
    if (doc && textAt && textValue.trim()) {
      const out = cloneCanvas(doc);
      drawText(ctx2d(out), textValue, textAt, textStyle);
      setDocument(out);
    }
    setTextAt(null);
    setTextValue('');
  }

  const transform = (fn: (c: HTMLCanvasElement) => HTMLCanvasElement, label: string) => {
    const doc = docRef.current;
    if (!doc) return;
    setDocument(fn(doc));
    setCropRect(null);
    setMessage(label);
  };

  const exportNow = async (copy = false) => {
    const doc = docRef.current;
    if (!doc) return;
    setBusy(true);
    try {
      const blob = await exportImage(doc, {
        format: copy ? 'png' : format,
        width: copy ? doc.width : outW,
        height: copy ? doc.height : outH,
        quality: quality / 100,
        background,
        icoSizes,
      });
      if (copy) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setMessage('Copied the image to the clipboard as PNG.');
      } else {
        downloadFile(
          `${name || 'image'}.${FORMAT_INFO[format].ext}`,
          blob,
          blob.type || FORMAT_INFO[format].mime,
        );
        setLastExport(
          `${FORMAT_INFO[format].label}${format === 'ico' ? ` · ${[...icoSizes].sort((a, b) => a - b).join('/')} px` : ` · ${outW} × ${outH}`} · ${formatBytes(blob.size)}`,
        );
      }
    } catch (error) {
      setMessage(
        copy
          ? 'This browser did not allow copying images. Use Download instead.'
          : `Export failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const createBlank = () => {
    const w = Math.max(1, Math.min(8000, Math.round(newW)));
    const h = Math.max(1, Math.min(8000, Math.round(newH)));
    const c = makeCanvas(w, h);
    if (newBg !== 'transparent') {
      const ctx = ctx2d(c);
      ctx.fillStyle = newBg === 'white' ? '#ffffff' : newColor;
      ctx.fillRect(0, 0, w, h);
    }
    setDocument(c, { fresh: true, fileName: 'untitled' });
    setNewOpen(false);
    setZoom('fit');
    setTool('brush');
    setMessage(`New ${w} × ${h} canvas.`);
  };

  /* ---------------- paste & keyboard ---------------- */

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      const item = [...(e.clipboardData?.items ?? [])].find((i) =>
        i.type.startsWith('image/'),
      );
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        void openBlob(file, file.name || 'pasted.png');
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [openBlob]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && (k === '=' || k === '+')) {
        e.preventDefault();
        setZoom(Math.min(8, scale * 1.25));
      } else if (mod && k === '-') {
        e.preventDefault();
        setZoom(Math.max(0.02, scale / 1.25));
      } else if (mod && k === '0') {
        e.preventDefault();
        setZoom('fit');
      } else if (!mod && !e.altKey && hasDoc) {
        if (e.key === 'Enter' && tool === 'crop') applyCrop();
        else if (e.key === 'Escape') {
          setCropRect(null);
          setTextAt(null);
          clearOverlay();
        } else {
          const t = TOOLS.find((x) => x.key.toLowerCase() === k);
          if (t) {
            setTool(t.id);
            setPanel('tool');
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, tool, applyCrop, hasDoc, scale]);

  /* ---------------- panels ---------------- */

  const ratioH = (w: number) => (size ? Math.max(1, Math.round((w * size.h) / size.w)) : w);
  const ratioW = (h: number) => (size ? Math.max(1, Math.round((h * size.w) / size.h)) : h);

  const toolPanel = () => {
    switch (tool) {
      case 'hand':
        return (
          <p className="tool-hint">
            Choose a tool above. Keyboard:{' '}
            {TOOLS.map((t) => `${t.key} ${t.label.toLowerCase()}`).join(' · ')}. Ctrl+Z undo.
          </p>
        );
      case 'crop':
        return (
          <>
            <div className="img-chips" role="group" aria-label="Crop aspect ratio">
              {ASPECTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="img-chip"
                  aria-pressed={aspect === a.id}
                  onClick={() => {
                    setAspect(a.id);
                    if (!size) return;
                    const r = a.ratio === 'orig' ? size.w / size.h : a.ratio;
                    let w = size.w;
                    let h = size.h;
                    if (r) {
                      h = w / r;
                      if (h > size.h) {
                        h = size.h;
                        w = h * r;
                      }
                    }
                    setCropRect({ x: (size.w - w) / 2, y: (size.h - h) / 2, w, h });
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="tool-hint">
              {cropRect && cropRect.w > 1
                ? `${Math.round(cropRect.w)} × ${Math.round(cropRect.h)} px`
                : 'Drag on the image to choose the area to keep.'}
            </p>
            <div className="tool-pdf-pair">
              <button
                className="btn btn-primary"
                disabled={!cropRect || cropRect.w < 2}
                onClick={applyCrop}
              >
                <Crop size={15} /> Crop
              </button>
              <button
                className="btn btn-secondary"
                disabled={!cropRect}
                onClick={() => setCropRect(null)}
              >
                Cancel
              </button>
            </div>
          </>
        );
      case 'adjust': {
        let group = '';
        return (
          <>
            <h3 className="img-group">Looks</h3>
            <div className="img-chips" role="group" aria-label="Looks">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="img-chip"
                  onClick={() => setAdjust({ ...DEFAULT_ADJUST, ...p.params })}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {ADJUST_SLIDERS.map((s) => {
              const heading = s.group !== group ? (group = s.group) : null;
              return (
                <div key={s.key} className="img-slider-row">
                  {heading && <h3 className="img-group">{heading}</h3>}
                  <Slider
                    label={s.label}
                    value={adjust[s.key]}
                    set={(v) => setAdjust((a) => ({ ...a, [s.key]: v }))}
                    min={s.min}
                    max={s.max}
                  />
                </div>
              );
            })}
            <label className="tool-check">
              <input
                type="checkbox"
                checked={adjust.invert >= 0.5}
                onChange={(e) => setAdjust((a) => ({ ...a, invert: e.target.checked ? 1 : 0 }))}
              />
              Invert colors
            </label>
            <div className="tool-pdf-pair img-sticky">
              <button
                className="btn btn-primary"
                disabled={isNeutral(adjust) || busy}
                onClick={applyAdjust}
              >
                Apply
              </button>
              <button
                className="btn btn-secondary"
                disabled={isNeutral(adjust)}
                onClick={() => setAdjust(DEFAULT_ADJUST)}
              >
                Reset
              </button>
            </div>
          </>
        );
      }
      case 'brush':
      case 'eraser':
      case 'shape':
        return (
          <>
            {tool === 'shape' && (
              <div className="img-chips" role="group" aria-label="Shape">
                {(
                  [
                    ['rect', 'Rectangle', Square],
                    ['ellipse', 'Ellipse', Circle],
                    ['line', 'Line', Minus],
                    ['arrow', 'Arrow', ArrowUpRight],
                  ] as const
                ).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    className="img-chip"
                    aria-pressed={shapeKind === id}
                    onClick={() => setShapeKind(id)}
                  >
                    <Icon size={14} aria-hidden="true" /> {label}
                  </button>
                ))}
              </div>
            )}
            {tool !== 'eraser' && (
              <label className="img-color">
                {tool === 'shape' ? 'Line color' : 'Color'}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </label>
            )}
            {tool === 'shape' && (
              <div className="img-row">
                <label className="tool-check">
                  <input
                    type="checkbox"
                    checked={shapeFill}
                    onChange={(e) => setShapeFill(e.target.checked)}
                  />
                  Fill shape
                </label>
                <input
                  type="color"
                  aria-label="Fill color"
                  value={fillColor}
                  disabled={!shapeFill}
                  onChange={(e) => setFillColor(e.target.value)}
                />
              </div>
            )}
            <Slider
              label={tool === 'shape' ? 'Line width' : 'Size'}
              value={brushSize}
              set={setBrushSize}
              min={1}
              max={300}
              unit="px"
            />
            {tool !== 'shape' && (
              <Slider label="Hardness" value={hardness} set={setHardness} min={0} max={100} unit="%" />
            )}
            <Slider label="Opacity" value={opacity} set={setOpacity} min={1} max={100} unit="%" />
          </>
        );
      case 'text':
        return (
          <>
            <label>
              Font
              <select
                value={textStyle.family}
                onChange={(e) => setTextStyle((s) => ({ ...s, family: e.target.value }))}
              >
                {FONTS.map(([v, l]) => (
                  <option key={l} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <Slider
              label="Size"
              value={textStyle.size}
              set={(v) => setTextStyle((s) => ({ ...s, size: v }))}
              min={8}
              max={400}
              unit="px"
            />
            <div className="img-row">
              <label className="img-color">
                Color
                <input
                  type="color"
                  value={textStyle.color}
                  onChange={(e) => setTextStyle((s) => ({ ...s, color: e.target.value }))}
                />
              </label>
              <label className="tool-check">
                <input
                  type="checkbox"
                  checked={!!textStyle.outline}
                  onChange={(e) =>
                    setTextStyle((s) => ({ ...s, outline: e.target.checked ? '#000000' : null }))
                  }
                />
                Outline
              </label>
            </div>
            <div className="img-row">
              <label className="tool-check">
                <input
                  type="checkbox"
                  checked={textStyle.bold}
                  onChange={(e) => setTextStyle((s) => ({ ...s, bold: e.target.checked }))}
                />
                Bold
              </label>
              <label className="tool-check">
                <input
                  type="checkbox"
                  checked={textStyle.italic}
                  onChange={(e) => setTextStyle((s) => ({ ...s, italic: e.target.checked }))}
                />
                Italic
              </label>
            </div>
          </>
        );
      case 'magic':
      case 'fill':
        return (
          <>
            {tool === 'fill' && (
              <label className="img-color">
                Fill color
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </label>
            )}
            <Slider label="Tolerance" value={tolerance} set={setTolerance} min={0} max={100} unit="%" />
            {tool === 'magic' && (
              <Slider label="Edge softness" value={softness} set={setSoftness} min={0} max={100} unit="%" />
            )}
            <label className="tool-check">
              <input
                type="checkbox"
                checked={contiguous}
                onChange={(e) => setContiguous(e.target.checked)}
              />
              Only connected pixels
            </label>
          </>
        );
      case 'picker':
        return (
          <label className="img-color">
            Current color
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            <code>{color}</code>
          </label>
        );
    }
  };

  const transformPanel = () => (
    <>
      <div className="tool-pdf-pair">
        <button className="btn btn-secondary" onClick={() => transform((c) => rotate90(c, false), 'Rotated left.')}>
          <RotateCcw size={15} /> Rotate left
        </button>
        <button className="btn btn-secondary" onClick={() => transform((c) => rotate90(c, true), 'Rotated right.')}>
          <RotateCw size={15} /> Rotate right
        </button>
        <button className="btn btn-secondary" onClick={() => transform((c) => flip(c, true), 'Flipped horizontally.')}>
          <FlipHorizontal2 size={15} /> Flip H
        </button>
        <button className="btn btn-secondary" onClick={() => transform((c) => flip(c, false), 'Flipped vertically.')}>
          <FlipVertical2 size={15} /> Flip V
        </button>
      </div>
      <h3 className="img-group">Straighten</h3>
      <Slider label="Angle" value={angle} set={setAngle} min={-45} max={45} unit="°" />
      <div className="img-chips" role="group" aria-label="Straighten mode">
        <button type="button" className="img-chip" aria-pressed={straightenMode === 'crop'} onClick={() => setStraightenMode('crop')}>
          Crop corners
        </button>
        <button type="button" className="img-chip" aria-pressed={straightenMode === 'expand'} onClick={() => setStraightenMode('expand')}>
          Expand canvas
        </button>
      </div>
      <button
        className="btn btn-secondary"
        disabled={angle === 0}
        onClick={() => {
          transform((c) => straighten(c, angle, straightenMode), `Rotated ${angle}°.`);
          setAngle(0);
        }}
      >
        Apply rotation
      </button>
      <h3 className="img-group">Resize image</h3>
      <div className="img-dims">
        <label>
          Width
          <input
            type="number"
            min={1}
            max={16000}
            value={resizeW}
            aria-label="Resize width"
            onChange={(e) => {
              const w = Number(e.target.value);
              setResizeW(w);
              if (lockRatio) setResizeH(ratioH(w));
            }}
          />
        </label>
        <label>
          Height
          <input
            type="number"
            min={1}
            max={16000}
            value={resizeH}
            aria-label="Resize height"
            onChange={(e) => {
              const h = Number(e.target.value);
              setResizeH(h);
              if (lockRatio) setResizeW(ratioW(h));
            }}
          />
        </label>
      </div>
      <label className="tool-check">
        <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} />
        Keep proportions
      </label>
      <div className="img-chips">
        {[25, 50, 75, 200].map((p) => (
          <button
            key={p}
            type="button"
            className="img-chip"
            onClick={() => {
              if (!size) return;
              setResizeW(Math.round((size.w * p) / 100));
              setResizeH(Math.round((size.h * p) / 100));
            }}
          >
            {p}%
          </button>
        ))}
      </div>
      <button
        className="btn btn-secondary"
        disabled={!size || (resizeW === size.w && resizeH === size.h) || resizeW < 1 || resizeH < 1}
        onClick={() =>
          transform(
            (c) => resample(c, Math.min(16000, resizeW), Math.min(16000, resizeH)),
            `Resized to ${resizeW} × ${resizeH}.`,
          )
        }
      >
        <Scaling size={15} /> Resize
      </button>
      <h3 className="img-group">Canvas size</h3>
      <div className="img-dims">
        <label>
          Width
          <input type="number" min={1} max={16000} value={canvasW} aria-label="Canvas width" onChange={(e) => setCanvasW(Number(e.target.value))} />
        </label>
        <label>
          Height
          <input type="number" min={1} max={16000} value={canvasH} aria-label="Canvas height" onChange={(e) => setCanvasH(Number(e.target.value))} />
        </label>
      </div>
      <div className="img-anchor" role="group" aria-label="Anchor">
        {ANCHORS.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-label={`Anchor ${label}`}
            aria-pressed={anchor === i}
            onClick={() => setAnchor(i)}
          />
        ))}
      </div>
      <div className="img-row">
        <label className="tool-check">
          <input
            type="checkbox"
            checked={canvasFill !== null}
            onChange={(e) => setCanvasFill(e.target.checked ? '#ffffff' : null)}
          />
          Fill new area
        </label>
        <input
          type="color"
          aria-label="New area color"
          value={canvasFill ?? '#ffffff'}
          disabled={canvasFill === null}
          onChange={(e) => setCanvasFill(e.target.value)}
        />
      </div>
      <button
        className="btn btn-secondary"
        disabled={!size || (canvasW === size.w && canvasH === size.h) || canvasW < 1 || canvasH < 1}
        onClick={() =>
          transform(
            (c) => canvasResize(c, Math.min(16000, canvasW), Math.min(16000, canvasH), anchor, canvasFill),
            `Canvas is now ${canvasW} × ${canvasH}.`,
          )
        }
      >
        Apply canvas size
      </button>
    </>
  );

  const exportPanel = () => {
    const info = FORMAT_INFO[format];
    return (
      <>
        <DictateField label="file name" onText={(spoken) => setName((v) => appendSpoken(v, spoken))}>
          <input aria-label="File name" value={name} onChange={(e) => setName(e.target.value)} />
        </DictateField>
        <div className="img-chips" role="group" aria-label="Format">
          {formats.map((f) => (
            <button key={f} type="button" className="img-chip" aria-pressed={format === f} onClick={() => setFormat(f)}>
              {FORMAT_INFO[f].label}
            </button>
          ))}
        </div>
        <p className="tool-hint">
          {format === 'png'
            ? 'Lossless and keeps transparency. Best for graphics, screenshots and edits.'
            : format === 'jpeg'
              ? 'Smallest photos. No transparency: transparent areas get the background color.'
              : format === 'ico'
                ? 'A favicon with several sizes in one file.'
                : 'Modern format with small files and transparency.'}
        </p>
        {info.lossy && (
          <Slider label="Quality" value={quality} set={setQuality} min={10} max={100} unit="%" />
        )}
        {!info.alpha && (
          <label className="img-color">
            Background
            <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} />
          </label>
        )}
        {format === 'ico' ? (
          <div className="img-chips" role="group" aria-label="Icon sizes">
            {[16, 24, 32, 48, 64, 128, 256].map((s) => (
              <button
                key={s}
                type="button"
                className="img-chip"
                aria-pressed={icoSizes.includes(s)}
                onClick={() =>
                  setIcoSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
                }
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="img-dims">
              <label>
                Width
                <input
                  type="number"
                  min={1}
                  max={16000}
                  value={outW}
                  aria-label="Export width"
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    setOutW(w);
                    if (outLock) setOutH(ratioH(w));
                  }}
                />
              </label>
              <label>
                Height
                <input
                  type="number"
                  min={1}
                  max={16000}
                  value={outH}
                  aria-label="Export height"
                  onChange={(e) => {
                    const h = Number(e.target.value);
                    setOutH(h);
                    if (outLock) setOutW(ratioW(h));
                  }}
                />
              </label>
            </div>
            <label className="tool-check">
              <input type="checkbox" checked={outLock} onChange={(e) => setOutLock(e.target.checked)} />
              Keep proportions
            </label>
            <div className="img-chips" role="group" aria-label="Export scale">
              {[25, 50, 100, 200].map((p) => (
                <button
                  key={p}
                  type="button"
                  className="img-chip"
                  aria-pressed={!!size && outW === Math.round((size.w * p) / 100)}
                  onClick={() => {
                    if (!size) return;
                    setOutW(Math.max(1, Math.round((size.w * p) / 100)));
                    setOutH(Math.max(1, Math.round((size.h * p) / 100)));
                  }}
                >
                  {p}%
                </button>
              ))}
            </div>
          </>
        )}
        <button
          className="btn btn-primary"
          disabled={busy || outW < 1 || outH < 1 || (format === 'ico' && !icoSizes.length)}
          onClick={() => void exportNow()}
        >
          <Download size={15} /> Download {info.label}
        </button>
        {'ClipboardItem' in window && (
          <button className="btn btn-secondary" disabled={busy} onClick={() => void exportNow(true)}>
            <ClipboardCopy size={15} /> Copy as PNG
          </button>
        )}
        {lastExport && <p className="tool-hint">Last export: {lastExport}</p>}
      </>
    );
  };

  /* ---------------- markup ---------------- */

  const dispW = size ? Math.max(1, size.w * scale) : 0;
  const dispH = size ? Math.max(1, size.h * scale) : 0;

  return (
    <ToolShell
      {...props}
      name="NinjaImage"
      subtitle="Open a photo to crop, adjust, draw, erase backgrounds and export it in any size or format."
      status={busy ? 'Processing…' : dirty ? 'Saving…' : store.status}
      error={store.error}
      compact={hasDoc}
      hasUnsavedChanges={dirty}
    >
      <input
        ref={fileInput}
        hidden
        type="file"
        accept={IMAGE_ACCEPT}
        aria-label="Open image file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void openBlob(file, file.name);
        }}
      />
      <div
        className="img-drop"
        data-dropping={dropping || undefined}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return;
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropping(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDropping(false);
          const file = [...e.dataTransfer.files].find(isImageFile);
          if (file) void openBlob(file, file.name);
          else if (e.dataTransfer.files.length)
            setMessage('That is not an image NinjaImage can open.');
        }}
      >
        {dropping && (
          <div className="tool-pdf-dropcue" aria-hidden="true">
            <Upload size={28} /> Drop to open this image
          </div>
        )}
        {message && (
          <div className="tool-alert" role="status">
            {message}
          </div>
        )}
        {newOpen && (
          <section className="tool-panel img-new" aria-label="New canvas">
            <h2>New canvas</h2>
            <div className="img-dims">
              <label>
                Width
                <input type="number" min={1} max={8000} value={newW} aria-label="New width" onChange={(e) => setNewW(Number(e.target.value))} />
              </label>
              <label>
                Height
                <input type="number" min={1} max={8000} value={newH} aria-label="New height" onChange={(e) => setNewH(Number(e.target.value))} />
              </label>
            </div>
            <div className="img-chips" aria-label="Common sizes" role="group">
              {(
                [
                  ['Square 1080', 1080, 1080],
                  ['HD 1920 × 1080', 1920, 1080],
                  ['Story 1080 × 1920', 1080, 1920],
                  ['Link preview 1200 × 630', 1200, 630],
                  ['Icon 512', 512, 512],
                ] as const
              ).map(([l, w, h]) => (
                <button
                  key={l}
                  type="button"
                  className="img-chip"
                  aria-pressed={newW === w && newH === h}
                  onClick={() => {
                    setNewW(w);
                    setNewH(h);
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="img-chips" role="group" aria-label="Background">
              {(['transparent', 'white', 'color'] as const).map((b) => (
                <button key={b} type="button" className="img-chip" aria-pressed={newBg === b} onClick={() => setNewBg(b)}>
                  {b === 'transparent' ? 'Transparent' : b === 'white' ? 'White' : 'Color'}
                </button>
              ))}
              {newBg === 'color' && (
                <input type="color" aria-label="Background color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
              )}
            </div>
            <div className="tool-row">
              <button className="btn btn-primary" onClick={createBlank}>
                Create canvas
              </button>
              <button className="btn btn-secondary" onClick={() => setNewOpen(false)}>
                Cancel
              </button>
            </div>
          </section>
        )}
        {!hasDoc ? (
          !newOpen && (
            <section className="tool-panel tool-empty img-empty">
              <AppMark app="image" size="lg" />
              <h2>Drop a photo here to start editing</h2>
              <p>
                Crop, rotate, adjust light and color, draw, add text, erase backgrounds to
                transparency, and export PNG, JPEG, WebP or favicons at any size. Images stay on
                this device.
              </p>
              <div className="tool-row img-empty__actions">
                <button className="btn btn-primary" disabled={!store.ready || busy} onClick={() => fileInput.current?.click()}>
                  <Upload size={16} /> Open image
                </button>
                <button className="btn btn-secondary" disabled={!store.ready} onClick={() => setNewOpen(true)}>
                  <FilePlus2 size={16} /> New canvas
                </button>
              </div>
              <p className="tool-hint">You can also paste an image with Ctrl+V.</p>
            </section>
          )
        ) : (
          <>
            <div className="tool-toolbar">
              <div className="tool-row">
                <button className="btn btn-secondary" disabled={busy} onClick={() => fileInput.current?.click()}>
                  <ImagePlus size={16} /> Open
                </button>
                <button className="btn btn-secondary" onClick={() => setNewOpen(true)}>
                  <FilePlus2 size={16} /> New
                </button>
              </div>
              <div className="tool-row">
                <button className="btn btn-secondary btn-icon" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!hist.undo || busy} onClick={undo}>
                  <Undo2 size={16} />
                </button>
                <button className="btn btn-secondary btn-icon" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!hist.redo || busy} onClick={redo}>
                  <Redo2 size={16} />
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  aria-label="Revert to original"
                  title="Revert to original"
                  disabled={busy || !hist.undo}
                  onClick={() => {
                    if (
                      originalRef.current &&
                      window.confirm('Revert to the original image? You can undo this.')
                    )
                      setDocument(cloneCanvas(originalRef.current));
                  }}
                >
                  <History size={16} />
                </button>
                <button className="btn btn-primary" onClick={() => setPanel('export')}>
                  <Download size={16} /> Export
                </button>
              </div>
            </div>
            <div className="img-layout">
              <section className="img-main">
                <div className="tool-pdf-tools" role="toolbar" aria-label="Image tools">
                  {TOOLS.map(({ id, label, icon: Icon, key }) => (
                    <button
                      key={id}
                      type="button"
                      className="tool-pdf-tool"
                      aria-pressed={tool === id}
                      title={`${label} (${key})`}
                      onClick={() => {
                        setTool(id);
                        setPanel('tool');
                        if (id !== 'text') setTextAt(null);
                      }}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="img-viewbar">
                  <p className="tool-pdf-hint" role="status">
                    {HINT[tool]}
                  </p>
                  <div className="tool-pdf-zoom" role="group" aria-label="Zoom">
                    <button className="btn btn-secondary btn-icon" aria-label="Zoom out" title="Zoom out (Ctrl+-)" onClick={() => setZoom(Math.max(0.02, scale / 1.25))}>
                      <ZoomOut size={16} />
                    </button>
                    <button
                      className="btn btn-secondary tool-pdf-zoom__level"
                      title="Fit to window (Ctrl+0) / actual size"
                      aria-label={`Zoom ${Math.round(scale * 100)}%`}
                      onClick={() => setZoom((z) => (z === 'fit' ? 1 : 'fit'))}
                    >
                      {Math.round(scale * 100)}%
                    </button>
                    <button className="btn btn-secondary btn-icon" aria-label="Zoom in" title="Zoom in (Ctrl++)" onClick={() => setZoom(Math.min(8, scale * 1.25))}>
                      <ZoomIn size={16} />
                    </button>
                    <label className="tool-check img-grid-toggle" title="Show a checkerboard behind transparent areas">
                      <input type="checkbox" checked={checker} onChange={(e) => setChecker(e.target.checked)} />
                      Grid
                    </label>
                  </div>
                </div>
                <div className="img-stage" ref={stageRef} data-tool={tool}>
                  <div
                    className="img-canvas"
                    data-checker={checker || undefined}
                    data-scale={scale}
                    data-version={version}
                    style={{ width: dispW, height: dispH }}
                  >
                    <canvas ref={viewRef} className="img-view" aria-hidden="true" />
                    <canvas
                      ref={overlayRef}
                      className="img-overlay"
                      aria-label={`Image editing surface, ${size.w} by ${size.h} pixels`}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={() => {
                        drag.current = null;
                        clearOverlay();
                        setVersion((v) => v + 1);
                      }}
                    />
                    {tool === 'crop' && cropRect && cropRect.w > 0 && (
                      <>
                        <svg
                          className="img-crop"
                          viewBox={`0 0 ${size.w} ${size.h}`}
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d={`M0 0H${size.w}V${size.h}H0Z M${cropRect.x} ${cropRect.y}h${cropRect.w}v${cropRect.h}h${-cropRect.w}Z`}
                          />
                          <rect x={cropRect.x} y={cropRect.y} width={cropRect.w} height={cropRect.h} />
                          {[1, 2].map((i) => (
                            <g key={i} className="img-crop__grid">
                              <line
                                x1={cropRect.x + (cropRect.w * i) / 3}
                                y1={cropRect.y}
                                x2={cropRect.x + (cropRect.w * i) / 3}
                                y2={cropRect.y + cropRect.h}
                              />
                              <line
                                x1={cropRect.x}
                                y1={cropRect.y + (cropRect.h * i) / 3}
                                x2={cropRect.x + cropRect.w}
                                y2={cropRect.y + (cropRect.h * i) / 3}
                              />
                            </g>
                          ))}
                        </svg>
                        {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const).map((h) => {
                          const x =
                            cropRect.x +
                            (h.includes('e') ? cropRect.w : h.includes('w') ? 0 : cropRect.w / 2);
                          const y =
                            cropRect.y +
                            (h.includes('s') ? cropRect.h : h.includes('n') ? 0 : cropRect.h / 2);
                          return (
                            <span
                              key={h}
                              className={`img-handle img-handle--${h}`}
                              style={{ left: `${(x / size.w) * 100}%`, top: `${(y / size.h) * 100}%` }}
                            />
                          );
                        })}
                      </>
                    )}
                    {tool === 'text' && textAt && (
                      <div
                        className="img-textwrap"
                        style={{
                          left: `${(textAt.x / size.w) * 100}%`,
                          top: `${(textAt.y / size.h) * 100}%`,
                        }}
                      >
                        <DictateField
                          label="image text"
                          onText={(spoken) => setTextValue((v) => appendSpoken(v, spoken))}
                        >
                          <input
                            ref={textInput}
                            className="img-textinput"
                            aria-label="Text to add"
                            placeholder="Type or speak, then Enter"
                            value={textValue}
                            style={{
                              fontFamily: textStyle.family,
                              fontWeight: textStyle.bold ? 700 : 400,
                              fontStyle: textStyle.italic ? 'italic' : 'normal',
                              color: textStyle.color,
                              fontSize: `${Math.max(14, Math.min(96, textStyle.size * scale))}px`,
                              WebkitTextStroke: textStyle.outline ? `1px ${textStyle.outline}` : undefined,
                            }}
                            onChange={(e) => setTextValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitText();
                              if (e.key === 'Escape') {
                                e.stopPropagation();
                                setTextAt(null);
                              }
                            }}
                          />
                        </DictateField>
                        <button type="button" className="btn btn-primary img-textadd" onClick={commitText}>
                          Add text
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="img-meta">
                  {name} · {size.w} × {size.h} px
                </p>
              </section>
              <aside className="tool-panel img-side">
                <div className="img-tabs" role="tablist" aria-label="Panels">
                  {(
                    [
                      ['tool', TOOLS.find((t) => t.id === tool)?.label ?? 'Tool'],
                      ['transform', 'Transform'],
                      ['export', 'Export'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={panel === id}
                      onClick={() => setPanel(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="img-panel" role="tabpanel">
                  {panel === 'tool' ? toolPanel() : panel === 'transform' ? transformPanel() : exportPanel()}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </ToolShell>
  );
}
