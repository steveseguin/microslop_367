import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Box,
  Circle,
  ClipboardCopy,
  Code2,
  Copy,
  Crop,
  Crosshair,
  Download,
  FilePlus2,
  Minus,
  Redo2,
  Sparkles,
  Square,
  Star,
  Trash2,
  Type,
  Undo2,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { DictateField } from '../components/Dictate';
import { appendSpoken } from '../utils/speech';
import { useToolStorage, downloadFile } from '../utils/toolStorage';
import { takeHandoff } from '../utils/handoff';
import {
  DEFAULT_SVG,
  PALETTE,
  appendPretty,
  baseName,
  centerElement,
  createShape,
  cropToContent,
  embedImageSvg,
  findCodeRange,
  formatBytes,
  getViewBox,
  imageSize,
  isRasterFile,
  isSvgFile,
  isUniform,
  localBBox,
  moveElement,
  parseSvg,
  pathOf,
  readAsDataUrl,
  reorder,
  resolvePath,
  restore,
  round,
  sanitizeSvgCode,
  sanitizeTree,
  scaleElement,
  selectableFor,
  serializeSvg,
  setCanvasSize,
  snapshot,
  svgBytes,
  toLocal,
} from '../utils/svgCore';
import type { ShapeKind } from '../utils/svgCore';
import {
  RASTER_EXT,
  RASTER_MIME,
  base64DataUrl,
  canEncode,
  canvasBlob,
  encodedDataUrl,
  faviconIco,
  iconPack,
  rasterize,
  renderBlob,
  svgSize,
  toJsx,
} from '../utils/svgConvert';
import type { RasterFormat } from '../utils/svgConvert';
import { optimizeSvg } from '../utils/svgOptimize';
import { DEFAULT_TRACE, loadTraceSource, traceAsync } from '../utils/svgTrace';
import type { TraceDetail, TraceOptions } from '../utils/svgTrace';
import type { StlModel, StlOptions } from '../utils/svgStl';
import '../styles/tools.css';
import '../styles/image.css';
import '../styles/svg.css';

interface SvgWorkspace {
  name: string;
  code: string;
}
const EMPTY: SvgWorkspace = { name: 'drawing', code: '' };

type Tab = 'inspect' | 'code' | 'export' | 'trace' | '3d';
type Snippet = 'base64' | 'encoded' | 'img' | 'css' | 'jsx' | 'favicon';

const SHAPES: { kind: ShapeKind; label: string; icon: typeof Square }[] = [
  { kind: 'rect', label: 'Rectangle', icon: Square },
  { kind: 'circle', label: 'Circle', icon: Circle },
  { kind: 'ellipse', label: 'Ellipse', icon: Circle },
  { kind: 'line', label: 'Line', icon: Minus },
  { kind: 'star', label: 'Star', icon: Star },
  { kind: 'text', label: 'Text', icon: Type },
];

const GEOMETRY: Record<string, string[]> = {
  rect: ['x', 'y', 'width', 'height', 'rx'],
  image: ['x', 'y', 'width', 'height'],
  use: ['x', 'y', 'width', 'height'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  text: ['x', 'y', 'font-size'],
};

const DEFAULT_STL_OPTS: StlOptions = {
  depth: 3,
  base: 1,
  width: 60,
  curve: 12,
  outlinesOnly: false,
};

const BLANK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">\n</svg>';

/** Normalise any CSS colour to #rrggbb for <input type="color">. */
function toHex(value: string | null | undefined): string {
  if (!value || value === 'none') return '#000000';
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return '#000000';
  ctx.fillStyle = '#000';
  ctx.fillStyle = value;
  const v = ctx.fillStyle;
  return v.startsWith('#') ? v : '#000000';
}

/** The attribute value, falling back to the inline style property. */
function styleOf(el: Element, name: string) {
  const own = el.getAttribute(name);
  if (own) return own;
  return (el as SVGElement).style?.getPropertyValue(name) || null;
}

function setStyleAttr(el: Element, name: string, value: string | null) {
  (el as SVGElement).style?.removeProperty(name);
  if (value === null || value === '') el.removeAttribute(name);
  else el.setAttribute(name, value);
}

export default function SvgEditor(props: ToolProps) {
  const store = useToolStorage<SvgWorkspace>('svg', EMPTY);
  const { data, update } = store;

  const [code, setCodeState] = useState('');
  const [name, setName] = useState('drawing');
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('inspect');
  const [selPath, setSelPath] = useState<number[] | null>(null);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [stage, setStage] = useState({ w: 800, h: 560 });
  const [checker, setChecker] = useState(true);
  const [dropping, setDropping] = useState(false);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [live, setLive] = useState<{ root: SVGSVGElement | null; tick: number }>({
    root: null,
    tick: 0,
  });
  const [hist, setHist] = useState({ undo: 0, redo: 0 });

  // Export settings
  const [format, setFormat] = useState<RasterFormat>('png');
  const [outW, setOutW] = useState(512);
  const [outH, setOutH] = useState(512);
  const [lock, setLock] = useState(true);
  const [transparent, setTransparent] = useState(true);
  const [background, setBackground] = useState('#ffffff');
  const [quality, setQuality] = useState(92);
  const [decimals, setDecimals] = useState(2);
  const [minify, setMinify] = useState(false);
  const [optimized, setOptimized] = useState<{ code: string; before: number; after: number } | null>(null);
  const [snippet, setSnippet] = useState<Snippet>('img');

  // Trace settings
  const [trace, setTrace] = useState<TraceOptions>(DEFAULT_TRACE);
  const [traceFile, setTraceFile] = useState<{ blob: Blob; name: string; url: string } | null>(null);
  const [traceResult, setTraceResult] = useState<{
    svg: string;
    paths: number;
    colors: number;
    url: string;
  } | null>(null);

  // 3D settings
  const [stl, setStl] = useState<StlOptions>(DEFAULT_STL_OPTS);
  const [stlInfo, setStlInfo] = useState('');
  const stlModel = useRef<StlModel | null>(null);
  const stlCleanup = useRef<(() => void) | null>(null);
  const stlHost = useRef<HTMLDivElement>(null);

  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const traceInput = useRef<HTMLInputElement>(null);
  const liveRoot = useRef<SVGSVGElement | null>(null);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastPush = useRef(0);
  const restored = useRef(false);
  const drag = useRef<{
    el: Element;
    mode: 'move' | 'scale';
    snap: ReturnType<typeof snapshot>;
    start: DOMPoint;
    anchor?: { x: number; y: number };
    corner?: { x: number; y: number };
    moved: boolean;
  } | null>(null);

  /* ---------------- document state ---------------- */

  const persistTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!loaded) return;
    window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      void update(() => ({ name, code }));
    }, 500);
  }, [code, name, loaded, update]);

  /** Change the code. `coalesce` merges rapid edits (typing, nudges) into one undo step. */
  const setCode = useCallback((next: string, opts: { coalesce?: boolean } = {}) => {
    setCodeState((prev) => {
      if (prev === next) return prev;
      const now = Date.now();
      if (!opts.coalesce || now - lastPush.current > 900) {
        undoStack.current.push(prev);
        if (undoStack.current.length > 200) undoStack.current.shift();
      }
      lastPush.current = now;
      redoStack.current = [];
      return next;
    });
    window.setTimeout(
      () => setHist({ undo: undoStack.current.length, redo: redoStack.current.length }),
      0,
    );
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev === undefined) return;
    setCodeState((cur) => {
      redoStack.current.push(cur);
      return prev;
    });
    lastPush.current = 0;
    window.setTimeout(
      () => setHist({ undo: undoStack.current.length, redo: redoStack.current.length }),
      0,
    );
  }, []);
  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (next === undefined) return;
    setCodeState((cur) => {
      undoStack.current.push(cur);
      return next;
    });
    lastPush.current = 0;
    window.setTimeout(
      () => setHist({ undo: undoStack.current.length, redo: redoStack.current.length }),
      0,
    );
  }, []);

  const loadSvgText = useCallback(
    (text: string, fileName: string) => {
      const clean = sanitizeSvgCode(text);
      if (!clean.ok) {
        setMessage('That does not contain an <svg> drawing.');
        return false;
      }
      setCode(clean.code);
      setName(baseName(fileName));
      setSelPath(null);
      setZoom('fit');
      setMessage(
        clean.removed
          ? `Opened ${fileName}. Removed ${clean.removed} unsafe item${clean.removed === 1 ? '' : 's'} (scripts, event handlers or external links).`
          : `Opened ${fileName}.`,
      );
      return true;
    },
    [setCode],
  );

  const importFile = useCallback(
    async (file: File) => {
      try {
        if (isSvgFile(file)) {
          loadSvgText(await file.text(), file.name);
        } else if (isRasterFile(file)) {
          // Bitmaps go to the tracer, where they can be vectorized or embedded.
          const url = URL.createObjectURL(file);
          setTraceFile((old) => {
            if (old) URL.revokeObjectURL(old.url);
            return { blob: file, name: file.name, url };
          });
          setTraceResult(null);
          setTab('trace');
          setMessage(`Loaded ${file.name}. Trace it into vector shapes, or embed it as-is.`);
        } else {
          setMessage('Choose an .svg file or an image (PNG, JPEG, WebP…).');
        }
      } catch {
        setMessage('That file could not be read.');
      }
    },
    [loadSvgText],
  );

  // Restore saved work, or take a file handed over from the workspace.
  useEffect(() => {
    if (!store.ready || restored.current) return;
    restored.current = true;
    setCodeState(data.code || DEFAULT_SVG);
    setName(data.name || 'drawing');
    setLoaded(true);
    const handed = takeHandoff('svg');
    if (handed) void importFile(handed);
  }, [store.ready, data, importFile]);

  /* ---------------- live preview ---------------- */

  const parsed = useMemo(() => parseSvg(code), [code]);
  const viewBox = useMemo(
    () => (parsed.svg ? getViewBox(parsed.svg) : { x: 0, y: 0, w: 400, h: 400 }),
    [parsed],
  );

  // The drawing renders inside a shadow root, so its own <style> can't leak.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.replaceChildren();
    const style = document.createElement('style');
    style.textContent =
      ':host{display:block;width:100%;height:100%}svg{display:block;width:100%;height:100%;overflow:visible}svg *{cursor:move}';
    shadow.appendChild(style);
    let root: SVGSVGElement | null = null;
    if (parsed.svg) {
      root = document.importNode(parsed.svg, true) as unknown as SVGSVGElement;
      sanitizeTree(root);
      root.removeAttribute('width');
      root.removeAttribute('height');
      shadow.appendChild(root);
    }
    liveRoot.current = root;
    setLive((l) => ({ root, tick: l.tick + 1 }));
  }, [parsed, loaded]);

  const selected = useMemo(
    () => (live.root && selPath ? resolvePath(live.root, selPath) : null),
    [live, selPath],
  );

  const scale = useMemo(() => {
    if (zoom !== 'fit') return zoom;
    return Math.max(0.05, Math.min((stage.w - 32) / viewBox.w, (stage.h - 32) / viewBox.h, 8));
  }, [zoom, stage, viewBox]);

  const measure = useCallback(() => {
    const host = hostRef.current;
    if (!host || !selected || !selected.isConnected) {
      setBox(null);
      return;
    }
    const h = host.getBoundingClientRect();
    const r = selected.getBoundingClientRect();
    setBox({ x: r.left - h.left, y: r.top - h.top, w: r.width, h: r.height });
  }, [selected]);
  useEffect(() => {
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [measure, scale, live]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStage({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    const wheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setZoom((z) => {
        const cur = z === 'fit' ? Number(el.dataset.scale || 1) : z;
        return Math.min(16, Math.max(0.05, cur * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      });
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener('wheel', wheel);
    };
  }, [loaded]);

  /* ---------------- editing the live drawing ---------------- */

  /** Write the live (already sanitized) drawing back into the code. */
  const commitLive = useCallback(
    (coalesce = false) => {
      const root = liveRoot.current;
      if (!root || !parsed.svg) return;
      const out = root.cloneNode(true) as SVGSVGElement;
      // The preview strips width/height; put the document's own back.
      for (const a of ['width', 'height'])
        if (parsed.svg.hasAttribute(a)) out.setAttribute(a, parsed.svg.getAttribute(a)!);
      setCode(serializeSvg(out), { coalesce });
    },
    [parsed, setCode],
  );

  /** Run a change on a fresh parse of the code (for structural edits). */
  const editDoc = (fn: (svg: SVGSVGElement) => number[] | null | void) => {
    const { svg, error } = parseSvg(code);
    if (!svg || error) {
      setMessage(`Fix the code first: ${error || 'there is no <svg> element.'}`);
      return;
    }
    const path = fn(svg);
    setCode(serializeSvg(svg));
    if (path !== undefined) setSelPath(path);
  };

  const addShape = (kind: ShapeKind) => {
    editDoc((svg) => {
      const el = createShape(svg, kind, PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      appendPretty(svg, el);
      return pathOf(svg, el);
    });
    setTab('inspect');
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const root = liveRoot.current;
    if (!root || e.button > 0) return;
    const target = e.nativeEvent.composedPath()[0] as Element;
    const el = selectableFor(target, root);
    if (!el) {
      setSelPath(null);
      return;
    }
    setSelPath(pathOf(root, el));
    const parent = el.parentElement ?? root;
    drag.current = {
      el,
      mode: 'move',
      snap: snapshot(el),
      start: toLocal(parent, e.clientX, e.clientY),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandleDown = (
    e: ReactPointerEvent<HTMLSpanElement>,
    corner: 'nw' | 'ne' | 'sw' | 'se',
  ) => {
    e.stopPropagation();
    const el = selected;
    const b = el ? localBBox(el) : null;
    if (!el || !b) return;
    drag.current = {
      el,
      mode: 'scale',
      snap: snapshot(el),
      start: toLocal(el, e.clientX, e.clientY),
      anchor: {
        x: corner.includes('w') ? b.x + b.width : b.x,
        y: corner.includes('n') ? b.y + b.height : b.y,
      },
      corner: {
        x: corner.includes('w') ? b.x : b.x + b.width,
        y: corner.includes('n') ? b.y : b.y + b.height,
      },
      moved: false,
    };
    hostRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    restore(d.el, d.snap);
    if (d.mode === 'move') {
      const parent = d.el.parentElement ?? liveRoot.current!;
      const p = toLocal(parent, e.clientX, e.clientY);
      const dx = p.x - d.start.x;
      const dy = p.y - d.start.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.01) d.moved = true;
      moveElement(d.el, dx, dy);
    } else if (d.anchor && d.corner) {
      const p = toLocal(d.el, e.clientX, e.clientY);
      const bx = d.corner.x - d.anchor.x || 1;
      const by = d.corner.y - d.anchor.y || 1;
      let sx = Math.max(0.02, (p.x - d.anchor.x) / bx);
      let sy = Math.max(0.02, (p.y - d.anchor.y) / by);
      if (isUniform(d.el) || e.shiftKey) sx = sy = Math.max(sx, sy);
      d.moved = true;
      scaleElement(d.el, sx, sy, d.anchor.x, d.anchor.y);
    }
    measure();
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) commitLive();
  };

  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    moveElement(selected, dx, dy);
    commitLive(true);
  };

  const setAttr = (attr: string, value: string | null) => {
    if (!selected) return;
    setStyleAttr(selected, attr, value);
    commitLive(true);
  };

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    selected.remove();
    setSelPath(null);
    commitLive();
  }, [selected, commitLive]);

  const duplicateSelected = useCallback(() => {
    const root = liveRoot.current;
    if (!selected || !root) return;
    const copy = selected.cloneNode(true) as Element;
    copy.removeAttribute('id');
    selected.after(copy);
    moveElement(copy, viewBox.w * 0.04, viewBox.h * 0.04);
    setSelPath(pathOf(root, copy));
    commitLive();
  }, [selected, commitLive, viewBox]);

  const showInCode = () => {
    if (!selected || !parsed.svg || !selPath) return;
    setTab('code');
    window.setTimeout(() => {
      const ta = codeRef.current;
      const el = parsed.svg ? resolvePath(parsed.svg, selPath) : null;
      const range = el && parsed.svg ? findCodeRange(code, parsed.svg, el) : null;
      if (!ta || !range) return;
      ta.focus();
      ta.setSelectionRange(range[0], range[1]);
      const line = code.slice(0, range[0]).split('\n').length;
      ta.scrollTop = Math.max(0, (line - 3) * 19);
    }, 30);
  };

  /* ---------------- keyboard, paste ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && k === 'd' && selected) {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'Escape') setSelPath(null);
      else if (selected && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = ((e.shiftKey ? 10 : 1) * Math.max(viewBox.w, viewBox.h)) / 400;
        nudge(
          e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,
          e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0,
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, [contenteditable="true"]')) return;
      const file = [...(e.clipboardData?.files ?? [])][0];
      if (file) {
        e.preventDefault();
        void importFile(file);
        return;
      }
      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (/<svg[\s>]/i.test(text)) {
        e.preventDefault();
        loadSvgText(text, 'pasted.svg');
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [importFile, loadSvgText]);

  /* ---------------- export ---------------- */

  const natural = useMemo(() => svgSize(code), [code]);
  const ratioH = (w: number) => Math.max(1, Math.round((w * natural.h) / natural.w));
  const ratioW = (h: number) => Math.max(1, Math.round((h * natural.w) / natural.h));
  const formats = useMemo(
    () =>
      (['png', 'jpeg', 'webp', 'avif'] as RasterFormat[]).filter(
        (f) => f === 'png' || f === 'jpeg' || canEncode(RASTER_MIME[f]),
      ),
    [],
  );

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That did not work.');
    } finally {
      setBusy(false);
    }
  };

  const downloadRaster = () =>
    run(async () => {
      const blob = await renderBlob(
        code,
        format,
        outW,
        outH,
        transparent && format !== 'jpeg' ? null : background,
        quality / 100,
      );
      downloadFile(`${name}.${RASTER_EXT[format]}`, blob, RASTER_MIME[format]);
      setMessage(
        `Saved ${name}.${RASTER_EXT[format]} · ${outW} × ${outH} px · ${formatBytes(blob.size)}.`,
      );
    });

  const copyPng = () =>
    run(async () => {
      const canvas = await rasterize(code, outW, outH, transparent ? null : background);
      const blob = await canvasBlob(canvas, 'image/png');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setMessage('Copied a PNG to the clipboard.');
    });

  const snippetText = useMemo(() => {
    if (!parsed.svg) return '';
    switch (snippet) {
      case 'base64':
        return base64DataUrl(code);
      case 'encoded':
        return encodedDataUrl(code);
      case 'img':
        return `<img src="${encodedDataUrl(code)}" width="${round(natural.w)}" height="${round(natural.h)}" alt="">`;
      case 'css':
        return `background-image: url("${encodedDataUrl(code)}");`;
      case 'jsx':
        return toJsx(code, name);
      case 'favicon':
        return `<link rel="icon" type="image/svg+xml" href="${encodedDataUrl(code)}">`;
    }
  }, [snippet, code, parsed, name, natural]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`Copied ${label}.`);
    } catch {
      setMessage('The browser blocked clipboard access. Select the text and copy it instead.');
    }
  };

  /* ---------------- trace ---------------- */

  const runTrace = () =>
    run(async () => {
      if (!traceFile) return;
      const src = await loadTraceSource(traceFile.blob, trace.detail);
      const result = await traceAsync(src.data, trace, src.width, src.height);
      setTraceResult((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return {
          ...result,
          url: URL.createObjectURL(new Blob([result.svg], { type: 'image/svg+xml' })),
        };
      });
    });

  const embedTraceSource = () =>
    run(async () => {
      if (!traceFile) return;
      const dataUrl = await readAsDataUrl(traceFile.blob);
      const { w, h } = await imageSize(dataUrl);
      setCode(embedImageSvg(dataUrl, w, h));
      setName(baseName(traceFile.name));
      setSelPath(null);
      setZoom('fit');
      setTab('export');
      setMessage(`Embedded ${traceFile.name} in a new SVG.`);
    });

  /* ---------------- 3D ---------------- */

  const build3d = () =>
    run(async () => {
      const mod = await import('../utils/svgStl');
      const model = mod.buildModel(code, stl);
      if (!model.triangles.length)
        throw new Error('No filled shapes or outlines to build a model from.');
      stlModel.current = model;
      stlCleanup.current?.();
      if (stlHost.current) stlCleanup.current = mod.mountViewer(stlHost.current, model, '#65a30d');
      setStlInfo(
        `${(model.triangles.length / 9).toLocaleString()} triangles · ${round(model.size.x, 1)} × ${round(model.size.y, 1)} × ${round(model.size.z, 1)} mm`,
      );
    });
  useEffect(() => () => stlCleanup.current?.(), []);
  const switchTab = (next: Tab) => {
    if (next !== '3d') {
      stlCleanup.current?.();
      stlCleanup.current = null;
      stlModel.current = null;
      setStlInfo('');
    }
    setTab(next);
  };

  const downloadStl = () =>
    run(async () => {
      const mod = await import('../utils/svgStl');
      if (!stlModel.current) return;
      downloadFile(`${name}.stl`, mod.stlBlob(stlModel.current), 'model/stl');
    });

  /* ---------------- panels ---------------- */

  const tag = selected?.localName.toLowerCase() ?? '';

  const inspectPanel = () => {
    if (!selected)
      return (
        <>
          <p className="tool-hint">
            Click a shape in the drawing to select it. Drag to move, drag a corner to resize,
            arrow keys nudge (Shift for bigger steps), Delete removes it, Ctrl+D duplicates.
          </p>
          <h3 className="img-group">Canvas</h3>
          <div className="img-dims">
            <label>
              Width
              <input
                type="number"
                min={1}
                value={round(viewBox.w)}
                aria-label="Canvas width"
                onChange={(e) =>
                  editDoc((svg) => {
                    setCanvasSize(svg, Math.max(1, Number(e.target.value)), viewBox.h);
                  })
                }
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min={1}
                value={round(viewBox.h)}
                aria-label="Canvas height"
                onChange={(e) =>
                  editDoc((svg) => {
                    setCanvasSize(svg, viewBox.w, Math.max(1, Number(e.target.value)));
                  })
                }
              />
            </label>
          </div>
          <button
            className="btn btn-secondary"
            disabled={!live.root}
            onClick={() => {
              const root = liveRoot.current;
              if (!root || !cropToContent(root)) return;
              const vb = getViewBox(root);
              editDoc((svg) => {
                svg.setAttribute('viewBox', `${round(vb.x)} ${round(vb.y)} ${round(vb.w)} ${round(vb.h)}`);
                svg.setAttribute('width', String(round(vb.w)));
                svg.setAttribute('height', String(round(vb.h)));
              });
              setZoom('fit');
              setMessage('Canvas cropped tightly around the drawing.');
            }}
          >
            <Crop size={15} /> Crop to content
          </button>
        </>
      );
    const fill = styleOf(selected, 'fill');
    const stroke = styleOf(selected, 'stroke');
    const opacity = Math.round(Number(styleOf(selected, 'opacity') ?? 1) * 100);
    return (
      <>
        <p className="svg-selected">
          <code>&lt;{selected.localName}&gt;</code>
          <button type="button" className="tool-linkbtn" onClick={showInCode}>
            Show in code
          </button>
        </p>
        {tag === 'text' && (
          <DictateField
            label="text"
            onText={(spoken) => {
              selected.textContent = appendSpoken(selected.textContent ?? '', spoken);
              commitLive();
            }}
          >
            <input
              aria-label="Text content"
              value={selected.textContent ?? ''}
              onChange={(e) => {
                selected.textContent = e.target.value;
                commitLive(true);
              }}
            />
          </DictateField>
        )}
        <div className="img-row">
          <label className="img-color">
            Fill
            <input
              type="color"
              aria-label="Fill color"
              value={toHex(fill ?? '#000000')}
              disabled={fill === 'none'}
              onChange={(e) => setAttr('fill', e.target.value)}
            />
          </label>
          <label className="tool-check">
            <input
              type="checkbox"
              checked={fill === 'none'}
              onChange={(e) => setAttr('fill', e.target.checked ? 'none' : '#2563eb')}
            />
            No fill
          </label>
        </div>
        <div className="img-row">
          <label className="img-color">
            Stroke
            <input
              type="color"
              aria-label="Stroke color"
              value={toHex(stroke)}
              onChange={(e) => {
                setAttr('stroke', e.target.value);
                if (!styleOf(selected, 'stroke-width')) setAttr('stroke-width', '2');
              }}
            />
          </label>
          <label className="svg-num">
            Width
            <input
              type="number"
              min={0}
              step={0.5}
              aria-label="Stroke width"
              value={Number(styleOf(selected, 'stroke-width') ?? 0)}
              onChange={(e) => setAttr('stroke-width', e.target.value)}
            />
          </label>
          {stroke && stroke !== 'none' && (
            <button type="button" className="tool-linkbtn" onClick={() => setAttr('stroke', null)}>
              No stroke
            </button>
          )}
        </div>
        <label className="img-slider">
          <span>
            Opacity
            <output>{opacity}%</output>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setAttr('opacity', String(Number(e.target.value) / 100))}
          />
        </label>
        {GEOMETRY[tag] && (
          <div className="svg-geom">
            {GEOMETRY[tag].map((a) => (
              <label key={a}>
                {a}
                <input
                  type="number"
                  step="any"
                  value={round(Number(selected.getAttribute(a) ?? 0))}
                  onChange={(e) => setAttr(a, e.target.value)}
                />
              </label>
            ))}
          </div>
        )}
        <div className="tool-pdf-pair">
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (liveRoot.current) centerElement(liveRoot.current, selected);
              commitLive();
            }}
          >
            <Crosshair size={15} /> Center
          </button>
          <button className="btn btn-secondary" onClick={duplicateSelected}>
            <Copy size={15} /> Duplicate
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              reorder(selected, true);
              if (liveRoot.current) setSelPath(pathOf(liveRoot.current, selected));
              commitLive();
            }}
          >
            <ArrowUpToLine size={15} /> To front
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              reorder(selected, false);
              if (liveRoot.current) setSelPath(pathOf(liveRoot.current, selected));
              commitLive();
            }}
          >
            <ArrowDownToLine size={15} /> To back
          </button>
        </div>
        <button className="btn btn-danger" onClick={deleteSelected}>
          <Trash2 size={15} /> Delete shape
        </button>
      </>
    );
  };

  const codePanel = () => (
    <>
      <textarea
        ref={codeRef}
        className="svg-code"
        aria-label="SVG code"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        value={code}
        onChange={(e) => setCode(e.target.value, { coalesce: true })}
      />
      <p className={parsed.error ? 'svg-codeinfo svg-codeinfo--error' : 'svg-codeinfo'} role="status">
        {parsed.error ? `Error: ${parsed.error}` : `${formatBytes(svgBytes(code))} · valid SVG`}
      </p>
      <div className="tool-row">
        <button className="btn btn-secondary" onClick={() => void copyText(code, 'the SVG code')}>
          <ClipboardCopy size={15} /> Copy code
        </button>
        <button
          className="btn btn-secondary"
          disabled={!parsed.svg || !!parsed.error}
          onClick={() => {
            const out = serializeSvg(parsed.svg!);
            let depth = 0;
            const pretty = out
              .replace(/>\s*</g, '>\n<')
              .split('\n')
              .map((line) => {
                const t = line.trim();
                if (/^<\//.test(t)) depth = Math.max(0, depth - 1);
                const s = '  '.repeat(depth) + t;
                if (/^<[^/!?][^>]*[^/]>$/.test(t) && !/<\/[^>]+>$/.test(t)) depth++;
                return s;
              })
              .join('\n');
            setCode(pretty);
          }}
        >
          <Code2 size={15} /> Tidy
        </button>
      </div>
    </>
  );

  const exportPanel = () => (
    <>
      <DictateField label="file name" onText={(s) => setName((v) => appendSpoken(v, s))}>
        <input aria-label="File name" value={name} onChange={(e) => setName(e.target.value)} />
      </DictateField>
      <h3 className="img-group">Vector</h3>
      <button
        className="btn btn-primary"
        disabled={!parsed.svg}
        onClick={() => downloadFile(`${name}.svg`, code, 'image/svg+xml')}
      >
        <Download size={15} /> Download SVG
      </button>
      <label className="img-slider">
        <span>
          Optimize: keep decimals
          <output>{decimals}</output>
        </span>
        <input type="range" min={0} max={4} value={decimals} onChange={(e) => setDecimals(Number(e.target.value))} />
      </label>
      <label className="tool-check">
        <input type="checkbox" checked={minify} onChange={(e) => setMinify(e.target.checked)} />
        Minify to one line
      </label>
      <div className="tool-row">
        <button
          className="btn btn-secondary"
          disabled={!parsed.svg}
          onClick={() => {
            try {
              setOptimized(optimizeSvg(code, { decimals, minify }));
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Could not optimize.');
            }
          }}
        >
          <Sparkles size={15} /> Optimize
        </button>
        {optimized && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setCode(optimized.code);
              setMessage(`Optimized: ${formatBytes(optimized.before)} → ${formatBytes(optimized.after)}.`);
              setOptimized(null);
            }}
          >
            Use optimized
          </button>
        )}
      </div>
      {optimized && (
        <p className="tool-hint">
          {formatBytes(optimized.before)} → {formatBytes(optimized.after)} (
          {Math.max(0, Math.round((1 - optimized.after / Math.max(1, optimized.before)) * 100))}% smaller)
        </p>
      )}
      <h3 className="img-group">Image</h3>
      <div className="img-chips" role="group" aria-label="Image format">
        {formats.map((f) => (
          <button key={f} type="button" className="img-chip" aria-pressed={format === f} onClick={() => setFormat(f)}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="img-dims">
        <label>
          Width
          <input
            type="number"
            min={1}
            max={8192}
            value={outW}
            aria-label="Export width"
            onChange={(e) => {
              const w = Number(e.target.value);
              setOutW(w);
              if (lock) setOutH(ratioH(w));
            }}
          />
        </label>
        <label>
          Height
          <input
            type="number"
            min={1}
            max={8192}
            value={outH}
            aria-label="Export height"
            onChange={(e) => {
              const h = Number(e.target.value);
              setOutH(h);
              if (lock) setOutW(ratioW(h));
            }}
          />
        </label>
      </div>
      <label className="tool-check">
        <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} />
        Keep proportions
      </label>
      <div className="img-chips" role="group" aria-label="Export size">
        {[1, 2, 4].map((k) => (
          <button
            key={k}
            type="button"
            className="img-chip"
            onClick={() => {
              setOutW(Math.max(1, Math.round(natural.w * k)));
              setOutH(Math.max(1, Math.round(natural.h * k)));
            }}
          >
            {k}×
          </button>
        ))}
        {[16, 32, 64, 128, 256, 512, 1024].map((s) => (
          <button
            key={s}
            type="button"
            className="img-chip"
            onClick={() => {
              setOutW(s);
              setOutH(lock ? ratioH(s) : s);
            }}
          >
            {s}
          </button>
        ))}
      </div>
      {format !== 'jpeg' && (
        <label className="tool-check">
          <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
          Transparent background
        </label>
      )}
      {(format === 'jpeg' || !transparent) && (
        <label className="img-color">
          Background
          <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} />
        </label>
      )}
      {format !== 'png' && (
        <label className="img-slider">
          <span>
            Quality
            <output>{quality}%</output>
          </span>
          <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
        </label>
      )}
      <div className="tool-row">
        <button className="btn btn-primary" disabled={!parsed.svg || busy} onClick={() => void downloadRaster()}>
          <Download size={15} /> Download {format.toUpperCase()}
        </button>
        {'ClipboardItem' in window && (
          <button className="btn btn-secondary" disabled={!parsed.svg || busy} onClick={() => void copyPng()}>
            <ClipboardCopy size={15} /> Copy PNG
          </button>
        )}
      </div>
      <h3 className="img-group">Icons</h3>
      <div className="tool-row">
        <button
          className="btn btn-secondary"
          disabled={!parsed.svg || busy}
          onClick={() =>
            void run(async () => {
              const ico = await faviconIco(code, transparent ? null : background);
              downloadFile(`${name}.ico`, ico as BlobPart, 'image/x-icon');
              setMessage('Saved favicon.ico with 16, 32 and 48 px icons.');
            })
          }
        >
          Favicon (.ico)
        </button>
        <button
          className="btn btn-secondary"
          disabled={!parsed.svg || busy}
          onClick={() =>
            void run(async () => {
              const zip = await iconPack(code, name, transparent ? null : background);
              downloadFile(`${name}-icons.zip`, zip, 'application/zip');
              setMessage('Saved an icon pack: favicon.ico, PNG sizes, Apple touch icon, web manifest and HTML snippet.');
            })
          }
        >
          App icon pack (.zip)
        </button>
      </div>
      <h3 className="img-group">Code snippets</h3>
      <div className="img-chips" role="group" aria-label="Snippet type">
        {(
          [
            ['img', '<img> tag'],
            ['css', 'CSS background'],
            ['encoded', 'Data URL'],
            ['base64', 'Base64'],
            ['favicon', 'Favicon link'],
            ['jsx', 'React component'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className="img-chip" aria-pressed={snippet === id} onClick={() => setSnippet(id)}>
            {label}
          </button>
        ))}
      </div>
      <textarea
        className="svg-snippet"
        aria-label="Snippet"
        readOnly
        value={snippetText}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button className="btn btn-secondary" disabled={!snippetText} onClick={() => void copyText(snippetText, 'the snippet')}>
        <ClipboardCopy size={15} /> Copy snippet
      </button>
    </>
  );

  const tracePanel = () => (
    <>
      <p className="tool-hint">
        Turn a photo, logo or scan into real vector shapes you can recolor and scale to any size.
      </p>
      <input
        ref={traceInput}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif"
        aria-label="Image to trace"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void importFile(file);
        }}
      />
      <button className="btn btn-secondary" onClick={() => traceInput.current?.click()}>
        <Upload size={15} /> {traceFile ? 'Choose another image' : 'Choose an image'}
      </button>
      {traceFile && (
        <>
          <div className="svg-compare">
            <figure>
              <img src={traceFile.url} alt="Original" />
              <figcaption>Original</figcaption>
            </figure>
            <figure>
              {traceResult ? (
                <img src={traceResult.url} alt="Traced vector result" />
              ) : (
                <div className="svg-compare__empty">Not traced yet</div>
              )}
              <figcaption>
                {traceResult
                  ? `${traceResult.paths} shapes · ${traceResult.colors} colors · ${formatBytes(svgBytes(traceResult.svg))}`
                  : 'Vector'}
              </figcaption>
            </figure>
          </div>
          <label className="tool-check">
            <input type="checkbox" checked={trace.mono} onChange={(e) => setTrace((t) => ({ ...t, mono: e.target.checked }))} />
            Black and white
          </label>
          {trace.mono ? (
            <label className="img-slider">
              <span>
                Threshold
                <output>{trace.threshold}</output>
              </span>
              <input type="range" min={1} max={254} value={trace.threshold} onChange={(e) => setTrace((t) => ({ ...t, threshold: Number(e.target.value) }))} />
            </label>
          ) : (
            <label className="img-slider">
              <span>
                Colors
                <output>{trace.colors}</output>
              </span>
              <input type="range" min={2} max={32} value={trace.colors} onChange={(e) => setTrace((t) => ({ ...t, colors: Number(e.target.value) }))} />
            </label>
          )}
          <div className="img-chips" role="group" aria-label="Detail">
            {(['low', 'medium', 'high'] as TraceDetail[]).map((d) => (
              <button key={d} type="button" className="img-chip" aria-pressed={trace.detail === d} onClick={() => setTrace((t) => ({ ...t, detail: d }))}>
                {d[0].toUpperCase() + d.slice(1)} detail
              </button>
            ))}
          </div>
          <label className="img-slider">
            <span>
              Smoothing
              <output>{trace.smoothing}</output>
            </span>
            <input type="range" min={0} max={5} value={trace.smoothing} onChange={(e) => setTrace((t) => ({ ...t, smoothing: Number(e.target.value) }))} />
          </label>
          <label className="tool-check">
            <input type="checkbox" checked={trace.ignoreBackground} onChange={(e) => setTrace((t) => ({ ...t, ignoreBackground: e.target.checked }))} />
            Drop the background
          </label>
          <div className="tool-row">
            <button className="btn btn-primary" disabled={busy} onClick={() => void runTrace()}>
              <Wand2 size={15} /> {busy ? 'Tracing…' : 'Trace to vector'}
            </button>
            {traceResult && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setCode(traceResult.svg);
                  setName(baseName(traceFile.name));
                  setSelPath(null);
                  setZoom('fit');
                  setTab('inspect');
                  setMessage('Traced drawing opened. Each color is one shape you can recolor.');
                }}
              >
                Open in editor
              </button>
            )}
          </div>
          <button className="btn btn-secondary" disabled={busy} onClick={() => void embedTraceSource()}>
            Embed the image as-is instead
          </button>
        </>
      )}
    </>
  );

  const threePanel = () => (
    <>
      <p className="tool-hint">
        Extrude the drawing into a 3D model for printing. Filled shapes are raised; a base plate
        holds them together.
      </p>
      <div className="svg-geom">
        {(
          [
            ['width', 'Width (mm)', 5, 500],
            ['depth', 'Height (mm)', 0.2, 50],
            ['base', 'Base plate (mm)', 0, 20],
            ['curve', 'Curve detail', 2, 48],
          ] as const
        ).map(([key, label, min, max]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={min}
              max={max}
              step="any"
              value={stl[key]}
              onChange={(e) =>
                setStl((s) => ({ ...s, [key]: Math.min(max, Math.max(min, Number(e.target.value))) }))
              }
            />
          </label>
        ))}
      </div>
      <label className="tool-check">
        <input type="checkbox" checked={stl.outlinesOnly} onChange={(e) => setStl((s) => ({ ...s, outlinesOnly: e.target.checked }))} />
        Outlines only (use strokes, ignore fills)
      </label>
      <div className="tool-row">
        <button className="btn btn-primary" disabled={!parsed.svg || busy} onClick={() => void build3d()}>
          <Box size={15} /> Build 3D model
        </button>
        <button className="btn btn-secondary" disabled={!stlInfo || busy} onClick={() => void downloadStl()}>
          <Download size={15} /> Download STL
        </button>
      </div>
      <div ref={stlHost} className="svg-3d" data-empty={!stlInfo || undefined}>
        {!stlInfo && <span>The 3D preview appears here. Drag to rotate.</span>}
      </div>
      {stlInfo && <p className="tool-hint">{stlInfo}</p>}
    </>
  );

  /* ---------------- markup ---------------- */

  return (
    <ToolShell
      {...props}
      name="NinjaSVG"
      subtitle="Edit SVG visually or as code, trace images into vectors, and convert to PNG, JPEG, WebP, icons or 3D."
      status={busy ? 'Processing…' : store.status}
      error={store.error}
      compact
    >
      <input
        ref={fileInput}
        type="file"
        hidden
        accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif"
        aria-label="Open SVG or image file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void importFile(file);
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
          const file = e.dataTransfer.files[0];
          if (file) void importFile(file);
        }}
      >
        {dropping && (
          <div className="tool-pdf-dropcue" aria-hidden="true">
            <Upload size={28} /> Drop an SVG or an image
          </div>
        )}
        {message && (
          <div className="tool-alert" role="status">
            {message}
          </div>
        )}
        <div className="tool-toolbar">
          <div className="tool-row">
            <button className="btn btn-secondary" onClick={() => fileInput.current?.click()}>
              <Upload size={16} /> Open
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCode(BLANK_SVG);
                setName('drawing');
                setSelPath(null);
                setZoom('fit');
                setMessage('New blank 400 × 400 drawing. Add shapes from the bar above the canvas.');
              }}
            >
              <FilePlus2 size={16} /> New
            </button>
          </div>
          <div className="tool-row">
            <button className="btn btn-secondary btn-icon" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!hist.undo} onClick={undo}>
              <Undo2 size={16} />
            </button>
            <button className="btn btn-secondary btn-icon" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!hist.redo} onClick={redo}>
              <Redo2 size={16} />
            </button>
            <button className="btn btn-primary" onClick={() => switchTab('export')}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>
        <div className="img-layout svg-layout">
          <section className="img-main">
            <div className="tool-pdf-tools" role="toolbar" aria-label="Add shapes">
              {SHAPES.map(({ kind, label, icon: Icon }) => (
                <button
                  key={kind}
                  type="button"
                  className="tool-pdf-tool"
                  title={`Add a ${label.toLowerCase()}`}
                  onClick={() => addShape(kind)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <div className="img-viewbar">
              <p className="tool-pdf-hint" role="status">
                {parsed.error
                  ? `The code has an error: ${parsed.error}`
                  : selected
                    ? `Selected <${selected.localName}>. Drag to move, drag a corner to resize, arrows nudge.`
                    : 'Click a shape to select it. Paste or drop an SVG or an image to open it.'}
              </p>
              <div className="tool-pdf-zoom" role="group" aria-label="Zoom">
                <button className="btn btn-secondary btn-icon" aria-label="Zoom out" onClick={() => setZoom(Math.max(0.05, scale / 1.25))}>
                  <ZoomOut size={16} />
                </button>
                <button
                  className="btn btn-secondary tool-pdf-zoom__level"
                  aria-label={`Zoom ${Math.round(scale * 100)}%`}
                  title="Fit / actual size"
                  onClick={() => setZoom((z) => (z === 'fit' ? 1 : 'fit'))}
                >
                  {Math.round(scale * 100)}%
                </button>
                <button className="btn btn-secondary btn-icon" aria-label="Zoom in" onClick={() => setZoom(Math.min(16, scale * 1.25))}>
                  <ZoomIn size={16} />
                </button>
                <label className="tool-check img-grid-toggle">
                  <input type="checkbox" checked={checker} onChange={(e) => setChecker(e.target.checked)} />
                  Grid
                </label>
              </div>
            </div>
            <div className="img-stage svg-stage" ref={stageRef} data-scale={scale}>
              <div
                className="img-canvas svg-canvas"
                data-checker={checker || undefined}
                style={{ width: viewBox.w * scale, height: viewBox.h * scale }}
              >
                <div
                  ref={hostRef}
                  className="svg-host"
                  role="img"
                  aria-label="SVG drawing"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
                {box && selected && (
                  <div className="svg-selection" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
                    {(['nw', 'ne', 'sw', 'se'] as const).map((c) => (
                      <span
                        key={c}
                        className={`svg-handle svg-handle--${c}`}
                        aria-hidden="true"
                        onPointerDown={(e) => onHandleDown(e, c)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="img-meta">
              {name}.svg · {round(viewBox.w)} × {round(viewBox.h)} · {formatBytes(svgBytes(code))}
            </p>
          </section>
          <aside className="tool-panel img-side">
            <div className="img-tabs svg-tabs" role="tablist" aria-label="Panels">
              {(
                [
                  ['inspect', 'Inspect'],
                  ['code', 'Code'],
                  ['export', 'Export'],
                  ['trace', 'Trace'],
                  ['3d', '3D'],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => switchTab(id)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="img-panel" role="tabpanel">
              {tab === 'inspect'
                ? inspectPanel()
                : tab === 'code'
                  ? codePanel()
                  : tab === 'export'
                    ? exportPanel()
                    : tab === 'trace'
                      ? tracePanel()
                      : threePanel()}
            </div>
          </aside>
        </div>
      </div>
    </ToolShell>
  );
}
