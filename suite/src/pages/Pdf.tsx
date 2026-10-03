import { useEffect, useRef, useState } from 'react';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PageViewport } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  Download,
  Upload,
  Undo2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { downloadFile, useToolStorage } from '../utils/toolStorage';
import { fillFields, openPdf, parsePageRange, readFields } from '../utils/pdf';
import type { PdfField } from '../utils/pdf';

GlobalWorkerOptions.workerSrc = workerUrl;
interface PdfWorkspace {
  name: string;
  bytes: Uint8Array | null;
}
const EMPTY: PdfWorkspace = { name: 'document.pdf', bytes: null };
type Point = { x: number; y: number };
type Mode = 'view' | 'text' | 'highlight' | 'draw' | 'image';

export default function Pdf(props: ToolProps) {
  const store = useToolStorage('pdf', EMPTY);
  const { data, update } = store;
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [rendering, setRendering] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('view');
  const [text, setText] = useState('');
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
    const task = getDocument({
      data: data.bytes.slice(),
      cMapUrl: new URL('pdf-assets/cmaps/', document.baseURI).href,
      cMapPacked: true,
      standardFontDataUrl: new URL(
        'pdf-assets/standard_fonts/',
        document.baseURI,
      ).href,
      wasmUrl: new URL('pdf-assets/wasm/', document.baseURI).href,
      iccUrl: new URL('pdf-assets/iccs/', document.baseURI).href,
    });
    task.promise
      .then(async (pdf) => {
        if (disposed) return;
        setRendering(true);
        const p = await pdf.getPage(Math.min(page + 1, pdf.numPages));
        if (disposed || !canvas.current) return;
        const natural = p.getViewport({ scale: 1 });
        const view = p.getViewport({
          scale: Math.min(1.5, 1000 / Math.max(natural.width, natural.height)),
        });
        viewport.current = view;
        canvas.current.width = view.width;
        canvas.current.height = view.height;
        render = p.render({ canvas: canvas.current, viewport: view });
        await render.promise;
        if (!disposed) {
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
  }, [data.bytes, page]);

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
      const pdf = await openPdf(original);
      await edit(pdf);
      const bytes = await pdf.save();
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
        setMode('view');
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
      if (mode === 'text') {
        if (!text.trim())
          throw new Error(
            'Enter the text to add, then click its position on the page.',
          );
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        try {
          font.encodeText(text);
        } catch {
          throw new Error(
            'Added text currently supports Latin characters. Use a PNG image for other scripts; your text has been kept.',
          );
        }
        p.drawText(text, {
          x: start.x,
          y: start.y,
          size,
          font,
          color: ink,
          rotate: p.getRotation(),
        });
      } else if (mode === 'highlight') {
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
  const pointFor = (e: React.PointerEvent<SVGSVGElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };
  const previewReady = preview?.bytes === data.bytes && preview?.page === page;
  const canEdit = store.ready && !busy && !rendering && previewReady;
  return (
    <ToolShell
      {...props}
      name="NinjaPDF"
      subtitle="Organize pages, fill forms, and add the details that matter."
      hasUnsavedChanges={fieldsDirty}
      status={
        busy
          ? 'Processing…'
          : fieldsDirty
            ? 'Form changes not applied'
            : store.status
      }
      error={store.error}
    >
      <div className="tool-row tool-row--between" style={{ marginBottom: 20 }}>
        <div className="tool-row">
          <button
            className="btn btn-primary"
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
              onClick={async () => {
                const previous = history[history.length - 1];
                if (
                  previous &&
                  (await update((s) => ({ ...s, bytes: previous })))
                ) {
                  setHistory((h) => h.slice(0, -1));
                  setPage(0);
                  setMessage('Last PDF edit undone.');
                }
              }}
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
      {!data.bytes ? (
        <section className="tool-panel tool-empty">
          <h2>Your PDF, your browser.</h2>
          <p>
            Open a PDF to start. Merge, split, rotate, annotate, or fill
            standard forms.
          </p>
          <p>
            Files stay on this device. One working draft is saved automatically.
          </p>
          <p className="tool-muted">
            Up to 30 MB. Existing paragraph text and scanned text are not
            directly editable.
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
            <label>
              Editing tool
              <select
                value={mode}
                disabled={!canEdit || fieldsDirty}
                onChange={(e) => {
                  setMode(e.target.value as Mode);
                  setPoints([]);
                }}
              >
                <option value="view">View / organize pages</option>
                <option value="text">Add text</option>
                <option value="highlight">Highlight area</option>
                <option value="draw">Draw / sign</option>
                <option value="image">Add image</option>
              </select>
            </label>
            {mode === 'text' && (
              <>
                <label>
                  Text to add
                  <textarea
                    value={text}
                    rows={3}
                    onChange={(e) => setText(e.target.value)}
                  />
                </label>
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
              </>
            )}
            {(mode === 'text' || mode === 'draw') && (
              <label>
                Ink color
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </label>
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
            <p className="tool-muted">
              {mode === 'text'
                ? 'Click the page to place text at its baseline. Latin characters supported.'
                : mode === 'draw'
                  ? 'Draw on the page with your mouse, pen, or finger. Drawn signatures are visual marks, not digital certificates.'
                  : mode === 'highlight'
                    ? 'Drag over an area to highlight it. Highlighting does not remove or redact content.'
                    : mode === 'image'
                      ? 'Choose an image, then drag a rectangle on the page to place it.'
                      : 'Choose a tool to add content. The original text remains intact.'}
            </p>
            <hr />
            <h2>
              Page {page + 1} of {count}
            </h2>
            <div className="tool-row">
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
                Delete page
              </button>
            </div>
            <div className="tool-row">
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
                Move later
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
            <div className="tool-pdf-toolbar">
              <button
                className="btn btn-secondary btn-icon"
                aria-label="Previous page"
                disabled={page === 0 || busy || rendering}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <label>
                Page
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
              <span className="tool-muted" role="status">
                {rendering || busy || !previewReady
                  ? 'Preparing page…'
                  : 'Ready'}
              </span>
            </div>
            <div className="tool-pdf-preview">
              <div
                className="tool-pdf-page"
                data-render-version={renderVersion}
              >
                <canvas ref={canvas} aria-label={`PDF page ${page + 1}`} />
                {mode !== 'view' && canEdit && !fieldsDirty && (
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
                          fill="#facc15"
                          opacity=".35"
                        />
                      ))}
                  </svg>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </ToolShell>
  );
}
