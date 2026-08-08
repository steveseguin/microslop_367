import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as fabric from 'fabric';
import {
  AlertTriangle,
  BringToFront,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  Download,
  GripVertical,
  Image as ImageIcon,
  PanelRightClose,
  Palette,
  Play,
  Plus,
  Redo,
  Save,
  SendToBack,
  Square,
  StickyNote,
  Trash2,
  Type,
  Undo,
  Upload,
  X,
} from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBar } from '../components/StatusBar';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../components/Toolbar';
import {
  BACKUP_SIZE_LIMIT_BYTES,
  DocumentPersistenceError,
  getCurrentClientId,
  loadDocument,
  saveDocument,
  saveDocumentBackupNow,
  subscribeToDocument,
} from '../utils/db';

interface PowerPointProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

/**
 * One fabric object as produced by `toObject()`. Only the fields this editor reads or
 * exports are described; fabric emits more, which is why unknown keys are tolerated.
 */
interface FabricObjectJSON {
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  originX?: string;
  originY?: string;
  radius?: number;
  fill?: string;
  stroke?: string;
  text?: string;
  fontSize?: number;
  fontWeight?: string | number;
  src?: string;
}

/** A whole slide as produced by `canvas.toJSON()`. */
interface SlideCanvasJSON {
  version?: string;
  background?: string;
  backgroundColor?: string;
  objects?: FabricObjectJSON[];
}

interface Slide {
  id: string;
  data: SlideCanvasJSON | null;
  notes?: string;
  thumbnail?: string;
}

interface BannerState {
  tone: 'success' | 'warning' | 'error';
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
}

interface SlideCapture {
  id: string;
  data: SlideCanvasJSON;
  thumbnail?: string;
}

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;
/**
 * fabric v7 defaults originX/originY to 'center'. Every coordinate in this file (the
 * templates, the PPTX importer's EMU offsets and the PPTX exporter's x/y math) treats
 * left/top as the TOP-LEFT corner, so objects are pinned back to that origin.
 */
const TOP_LEFT_ORIGIN = { originX: 'left', originY: 'top' } as const;
const THUMBNAIL_SCALE = 0.2;
/** Thumbnails are persisted with the deck; JPEG keeps the saved payload small. */
const THUMBNAIL_FORMAT = 'jpeg' as const;
const THUMBNAIL_QUALITY = 0.6;
const SAVE_DEBOUNCE_MS = 800;
const HISTORY_DEBOUNCE_MS = 220;
const THUMBNAIL_DEBOUNCE_MS = 450;
const HISTORY_LIMIT = 40;
const MIN_CANVAS_SCALE = 0.12;
/**
 * Ceiling on the fit scale. This used to be a hard 1, which meant the slide could never be
 * drawn larger than its 960x540 design size no matter how much room the stage had: on a
 * 1920x1080 display the slide sat at a third of the stage inside a field of grey, and no
 * amount of trimming the rails could change it.
 *
 * Growing past 1 is safe because the fit is applied as a fabric ZOOM, not a CSS transform:
 * the backing store is resized to match, so text and vector shapes are re-rasterised at the
 * new resolution and stay sharp — only inserted bitmap images soften, exactly as they would
 * in any editor zoomed past 100%. 2 is the ceiling because height binds well before it on
 * every desktop size (1.55 at 1920x1080), so it never actually governs there; it only stops
 * a very tall or 4K viewport from allocating a needlessly large backing store.
 */
const MAX_CANVAS_SCALE = 2;
/**
 * pptxgenjs' LAYOUT_WIDE is 13.333in x 7.5in. Mapping the 960x540 slide onto 10 x 5.625
 * instead squeezed every deck into the top-left 75% of the page with a dead margin, which
 * reads as deliberate design rather than a bug.
 */
const EXPORT_WIDTH_IN = 13.333;
const EXPORT_HEIGHT_IN = 7.5;
const EMU_PER_INCH = 914400;
/**
 * Floor for exported geometry: only there to keep a shape from being degenerate. The old
 * 0.3in/0.4in floors were large enough to distort real content — a 14px accent bar came
 * back 22px thick on every round trip.
 */
const MIN_EXPORT_SIZE_IN = 0.01;

/**
 * The notes rail. 288px of permanently reserved horizontal space bought one textarea and a
 * panel of state the status bar already carried; 248px is enough for real note-taking (the
 * textarea now runs the full height of the rail instead of a stubby 160px box) and hands
 * 40px straight back to the slide. Collapsing gives the rest back.
 *
 * Notes are NOT moved under the canvas the way PowerPoint does it: the slide is 16:9, so a
 * pixel of height costs the canvas 1/540 of its scale while a pixel of width costs 1/960 —
 * horizontal space is the cheaper currency here, and at every viewport measured below the
 * fit is width-bound only until the rail is collapsed, after which height binds. A notes
 * strip would spend the expensive axis to free the cheap one.
 */
const NOTES_PANEL_WIDTH = 248;
/** Width of the collapsed rail. Free at every measured size: height binds before this does. */
const NOTES_RAIL_WIDTH = 52;
const NOTES_OPEN_STORAGE_KEY = 'ninjaslides:notes-open';
/** Mirrors the `max-width: 900px` breakpoint in index.css where the panes stack and the
 *  mobile section switcher takes over. Below it the rail is a full-width tab pane and must
 *  not be given a fixed width or a collapse control. */
const COMPACT_LAYOUT_QUERY = '(max-width: 900px)';

function readNotesPreference() {
  try {
    return window.localStorage.getItem(NOTES_OPEN_STORAGE_KEY) !== '0';
  } catch {
    // Storage can be blocked outright (private mode, third-party cookie policies).
    return true;
  }
}

/**
 * Serialized type tags are taken from the fabric classes themselves, so a fabric rename
 * (v5 `i-text` -> v7 `IText`) can never silently stop matching again. The legacy v5 tags
 * stay in the set so decks saved by an older build still export.
 */
const normalizeTypeTag = (value: string) => value.toLowerCase();

const TEXT_TYPE_TAGS = new Set(
  [fabric.IText.type, fabric.Textbox.type, fabric.FabricText.type, 'i-text'].map(normalizeTypeTag),
);
const RECT_TYPE_TAGS = new Set([fabric.Rect.type].map(normalizeTypeTag));
const CIRCLE_TYPE_TAGS = new Set([fabric.Circle.type].map(normalizeTypeTag));
const IMAGE_TYPE_TAGS = new Set([fabric.FabricImage.type].map(normalizeTypeTag));

function createId(prefix: string) {
  const cryptoRef = typeof globalThis === 'undefined' ? undefined : globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    return `${prefix}-${cryptoRef.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The single place where fabric's loose serialization is narrowed to this file's model. */
function serializeCanvas(canvas: fabric.StaticCanvas): SlideCanvasJSON {
  return canvas.toJSON() as unknown as SlideCanvasJSON;
}

function createTextObject(text: string, options: Partial<fabric.ITextProps>) {
  return new fabric.IText(text, {
    ...TOP_LEFT_ORIGIN,
    ...options,
    fontFamily: options.fontFamily ?? 'Aptos, Segoe UI, sans-serif',
    fill: options.fill ?? '#0f172a',
  });
}

function makeThumbnail(canvas: fabric.StaticCanvas, zoom = 1) {
  return canvas.toDataURL({
    format: THUMBNAIL_FORMAT,
    quality: THUMBNAIL_QUALITY,
    multiplier: THUMBNAIL_SCALE / zoom,
  });
}

function applySlideTemplate(canvas: fabric.StaticCanvas, variant: 'cover' | 'content') {
  canvas.clear();
  canvas.backgroundColor = '#ffffff';

  const accentBar = new fabric.Rect({
    ...TOP_LEFT_ORIGIN,
    left: 0,
    top: 0,
    width: SLIDE_WIDTH,
    height: 14,
    fill: '#2563eb',
    selectable: false,
    evented: false,
  });

  canvas.add(accentBar);

  if (variant === 'cover') {
    canvas.add(
      createTextObject('Presentation Title', {
        left: 86,
        top: 110,
        fontSize: 38,
        fontWeight: '700',
      }),
    );
    canvas.add(
      createTextObject('Subtitle or presenter name', {
        left: 90,
        top: 190,
        fontSize: 22,
        fill: '#475569',
      }),
    );
  } else {
    canvas.add(
      createTextObject('Slide Title', {
        left: 78,
        top: 68,
        fontSize: 34,
        fontWeight: '700',
      }),
    );
    canvas.add(
      createTextObject('Add key points here\n- Explain the point\n- Support it with numbers', {
        left: 86,
        top: 164,
        fontSize: 22,
        fill: '#334155',
        width: 720,
      }),
    );
  }

  canvas.renderAll();
}

function createSlideSnapshot(variant: 'cover' | 'content') {
  const tempElement = document.createElement('canvas');
  tempElement.width = SLIDE_WIDTH;
  tempElement.height = SLIDE_HEIGHT;
  const tempCanvas = new fabric.StaticCanvas(tempElement, {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    backgroundColor: '#ffffff',
  });

  applySlideTemplate(tempCanvas, variant);
  const snapshot = {
    data: serializeCanvas(tempCanvas),
    thumbnail: makeThumbnail(tempCanvas),
  };
  void tempCanvas.dispose();
  return snapshot;
}

/**
 * fabric@7 changed the default originX/originY to CENTER and serializes them, and no build
 * of this editor ever set them explicitly — so every deck saved by the shipped build has
 * objects anchored at their centre while every coordinate in this file (templates, PPTX
 * import offsets, PPTX export x/y) means the TOP-LEFT corner. On screen that pushes content
 * off the canvas: the accent bar hangs half off the left edge and the title is clipped to
 * "se...tle" with no way to reach it. Migrating on load repositions the objects so the
 * stored geometry means what the rest of the app assumes.
 *
 * The offset is rotated by the object's own angle so a rotated object lands exactly where
 * it was drawn rather than being nudged sideways.
 */
function migrateObjectOrigin(object: FabricObjectJSON): boolean {
  const originX = object.originX;
  const originY = object.originY;
  if ((originX === undefined || originX === 'left') && (originY === undefined || originY === 'top')) {
    return false;
  }

  const width = (object.width || 0) * (object.scaleX ?? 1);
  const height = (object.height || 0) * (object.scaleY ?? 1);
  const localX = originX === 'center' ? -width / 2 : originX === 'right' ? -width : 0;
  const localY = originY === 'center' ? -height / 2 : originY === 'bottom' ? -height : 0;
  const radians = ((object.angle || 0) * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  object.left = (object.left || 0) + localX * cos - localY * sin;
  object.top = (object.top || 0) + localX * sin + localY * cos;
  object.originX = 'left';
  object.originY = 'top';
  return true;
}

function migrateSlides(slides: Slide[]): { slides: Slide[]; changed: boolean } {
  let changed = false;

  const migrated = slides.map((slide) => {
    const objects = slide.data?.objects;
    if (!objects?.length) {
      return slide;
    }

    let slideChanged = false;
    const nextObjects = objects.map((object) => {
      const copy = { ...object };
      if (migrateObjectOrigin(copy)) {
        slideChanged = true;
        return copy;
      }

      return object;
    });

    if (!slideChanged) {
      return slide;
    }

    changed = true;
    // The thumbnail was rendered from the broken geometry, so drop it; the next flush
    // regenerates it from the repaired slide.
    return { ...slide, data: { ...slide.data, objects: nextObjects }, thumbnail: undefined };
  });

  return { slides: migrated, changed };
}

function normalizeColor(value: string | undefined) {
  if (!value || typeof value !== 'string') {
    return '000000';
  }

  return value.replace('#', '');
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Blob could not be read'));
    reader.readAsDataURL(blob);
  });
}

function resolveZipTarget(basePath: string, target: string) {
  if (target.startsWith('/')) {
    return target.replace(/^\/+/, '');
  }

  const segments = basePath.split('/');
  segments.pop();

  for (const part of target.split('/')) {
    if (!part || part === '.') {
      continue;
    }

    if (part === '..') {
      segments.pop();
      continue;
    }

    segments.push(part);
  }

  return segments.join('/');
}

function extractTextContent(container: ParentNode) {
  const paragraphs = [...container.querySelectorAll('a\\:p, p')].map((paragraph) =>
    [...paragraph.querySelectorAll('a\\:t, t')]
      .map((textNode) => textNode.textContent || '')
      .join(''),
  );

  return paragraphs.filter(Boolean).join('\n');
}

/**
 * EMU -> canvas pixels. The ratio is taken from the deck's OWN `p:sldSz` so a 16:9, a 4:3
 * and this app's own export all map onto the 960x540 canvas correctly. A fixed 96px/inch
 * was wrong for every one of them: the exporter writes a 13.333in page, so 960px spans
 * 13.333in (72px/inch) and a hard-coded 96 inflated every imported object by 4/3.
 */
interface EmuScale {
  x: number;
  y: number;
}

const DEFAULT_EMU_SCALE: EmuScale = {
  x: SLIDE_WIDTH / (EXPORT_WIDTH_IN * EMU_PER_INCH),
  y: SLIDE_HEIGHT / (EXPORT_HEIGHT_IN * EMU_PER_INCH),
};

function readSlideEmuScale(presentationXml: string | undefined): EmuScale {
  if (!presentationXml) {
    return DEFAULT_EMU_SCALE;
  }

  const doc = new DOMParser().parseFromString(presentationXml, 'text/xml');
  const size = doc.querySelector('p\\:sldSz, sldSz');
  const cx = parseInt(size?.getAttribute('cx') || '0', 10);
  const cy = parseInt(size?.getAttribute('cy') || '0', 10);

  if (!cx || !cy) {
    return DEFAULT_EMU_SCALE;
  }

  return { x: SLIDE_WIDTH / cx, y: SLIDE_HEIGHT / cy };
}

function extractTransformMetrics(node: ParentNode | null, scale: EmuScale) {
  const transform = node?.querySelector('a\\:xfrm, xfrm');
  const offset = transform?.querySelector('a\\:off, off');
  const extent = transform?.querySelector('a\\:ext, ext');

  const left = (parseInt(offset?.getAttribute('x') || '0', 10) || 0) * scale.x;
  const top = (parseInt(offset?.getAttribute('y') || '0', 10) || 0) * scale.y;
  const width = (parseInt(extent?.getAttribute('cx') || '0', 10) || 0) * scale.x;
  const height = (parseInt(extent?.getAttribute('cy') || '0', 10) || 0) * scale.y;

  return { left, top, width, height };
}

function isEditingText(object: fabric.FabricObject | undefined | null) {
  return Boolean(object && 'isEditing' in object && (object as fabric.IText).isEditing);
}

const slideActionButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  padding: 0,
  borderRadius: '0.55rem',
  border: '1px solid rgba(100, 116, 139, 0.32)',
  background: 'rgba(148, 163, 184, 0.16)',
  color: 'inherit',
  cursor: 'pointer',
};

interface SlideCardProps {
  slide: Slide;
  index: number;
  total: number;
  isActive: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onSelect: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onDelete: (id: string) => void;
  onReorderPointerDown: (event: React.PointerEvent<HTMLButtonElement>, index: number) => void;
  onReorderPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onReorderPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onReorderPointerCancel: () => void;
  registerCard: (index: number, element: HTMLElement | null) => void;
}

/**
 * Memoized so a thumbnail refresh on the slide being edited re-renders ONE card, not the
 * whole deck. With 60 slides that is the difference between a cheap edit and a janky one.
 */
const SlideCard = memo(function SlideCard({
  slide,
  index,
  total,
  isActive,
  isDragging,
  isDropTarget,
  onSelect,
  onMove,
  onDelete,
  onReorderPointerDown,
  onReorderPointerMove,
  onReorderPointerUp,
  onReorderPointerCancel,
  registerCard,
}: SlideCardProps) {
  /**
   * At rest a card shows ONE control — the drag grip. Move-up, move-down and delete fade in
   * for a pointer that is on the card, for keyboard focus anywhere inside it, or on the slide
   * being edited (the only reveal a touch device can produce, and the card a touch user has
   * just tapped). Alt+ArrowUp/Down on the card reorders without any button at all.
   *
   * The hidden state is `opacity: 0` and NOTHING else. It deliberately does NOT set
   * `pointer-events: none`, which is what broke `slides.spec.ts`: with it, `elementFromPoint`
   * at the button's own centre resolves to the wrapping row instead, so every hit test —
   * Playwright's actionability check, and any assistive tech that drives a synthetic click —
   * reported "<div> intercepts pointer events" and the only route to deleting a slide became
   * unreachable. A real pointer cannot reach these buttons without first entering the card,
   * which reveals them, so `pointer-events: none` was defending against nothing and costing
   * the feature its testability. Deletion is still gated by the confirm dialog.
   */
  const [isPointerOver, setIsPointerOver] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const showControls = isPointerOver || isFocusWithin || isActive;
  const revealStyle = (disabled = false): React.CSSProperties => ({
    opacity: showControls ? (disabled ? 0.4 : 1) : 0,
    transition: 'opacity 140ms ease',
  });

  return (
    <article
      ref={(element) => registerCard(index, element)}
      className={`slide-card ${isActive ? 'slide-card--active' : ''}`}
      style={{
        opacity: isDragging ? 0.55 : 1,
        outline: isDropTarget ? '2px dashed #2563eb' : undefined,
        outlineOffset: '2px',
      }}
      onMouseEnter={() => setIsPointerOver(true)}
      onMouseLeave={() => setIsPointerOver(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={() => setIsFocusWithin(false)}
      onClick={() => onSelect(slide.id)}
      onKeyDown={(event) => {
        if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
          event.preventDefault();
          onMove(index, event.key === 'ArrowUp' ? index - 1 : index + 1);
          return;
        }

        // Only the card itself activates on Enter/Space. Without this the card would
        // preventDefault the keydown of a nested button (move/delete) and the browser
        // would never synthesize its click.
        if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
          event.preventDefault();
          onSelect(slide.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open slide ${index + 1}`}
    >
      <div className="slide-card__thumb">
        {slide.thumbnail ? <img src={slide.thumbnail} alt={`Slide ${index + 1}`} /> : <span>Slide preview</span>}
      </div>
      <div className="slide-card__caption">
        <span>Slide {index + 1}</span>
        <span>{isActive ? 'Editing' : 'Open'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          style={{ ...slideActionButtonStyle, ...revealStyle(index === 0) }}
          disabled={index === 0}
          aria-label={`Move slide ${index + 1} up`}
          title="Move slide up"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onMove(index, index - 1);
          }}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          style={{ ...slideActionButtonStyle, ...revealStyle(index === total - 1) }}
          disabled={index === total - 1}
          aria-label={`Move slide ${index + 1} down`}
          title="Move slide down"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onMove(index, index + 1);
          }}
        >
          <ChevronDown size={14} />
        </button>
        <span style={{ flex: 1 }} />
        {/* The grip is the one control that stays at rest: it is the affordance that tells
            you the rail reorders at all, and it replaces the prose that used to say so. */}
        <button
          type="button"
          style={{ ...slideActionButtonStyle, cursor: 'grab', touchAction: 'none' }}
          aria-label={`Drag to reorder slide ${index + 1}`}
          title="Drag to reorder"
          data-testid={`slide-drag-handle-${index}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onPointerDown={(event) => onReorderPointerDown(event, index)}
          onPointerMove={onReorderPointerMove}
          onPointerUp={onReorderPointerUp}
          onPointerCancel={onReorderPointerCancel}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          style={{
            ...slideActionButtonStyle,
            borderColor: 'rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.14)',
            color: '#ef4444',
            ...revealStyle(),
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete(slide.id);
          }}
          aria-label={`Delete slide ${index + 1}`}
          title="Delete slide"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
});

export default function PowerPoint({ toggleTheme, isDarkMode }: PowerPointProps) {
  const maxImportFileBytes = 30 * 1024 * 1024;
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFileName = 'Untitled Presentation';
  // Derived from the URL on every render, NOT pinned at mount: hash-navigating from one
  // deck to another used to keep editing the first document while the URL showed the
  // second, so edits landed in the wrong deck and the second was never created.
  const [generatedDocId] = useState(() => createId('powerpoint'));
  const docId = searchParams.get('id') || generatedDocId;
  const [fileName, setFileName] = useState(defaultFileName);
  const [documentRevision, setDocumentRevision] = useState(0);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([{ id: 'slide-1', data: null, notes: '' }]);
  const [currentSlideId, setCurrentSlideId] = useState('slide-1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presentIndex, setPresentIndex] = useState<number | null>(null);
  // Not 'Saved'. A deck that has never been written must not claim it has: the
  // header paints exactly 'Saved' as a green success pill, so starting there
  // showed a brand-new deck as safely stored with zero bytes on disk.
  const [saveStatus, setSaveStatus] = useState('Not saved yet');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentColor, setCurrentColor] = useState('#2563eb');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [pendingDeleteSlideId, setPendingDeleteSlideId] = useState<string | null>(null);
  const [importCandidate, setImportCandidate] = useState<File | null>(null);
  const [mobileWorkspaceView, setMobileWorkspaceView] = useState<'slides' | 'canvas' | 'notes'>('canvas');
  const [isNotesOpen, setIsNotesOpen] = useState(readNotesPreference);
  const [isCompactLayout, setIsCompactLayout] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(COMPACT_LAYOUT_QUERY).matches,
  );
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);
  const [dragSlideIndex, setDragSlideIndex] = useState<number | null>(null);
  const [dropSlideIndex, setDropSlideIndex] = useState<number | null>(null);
  const [slideLoadError, setSlideLoadError] = useState<{ slideId: string; index: number } | null>(null);
  const [presentSlideFailed, setPresentSlideFailed] = useState(false);
  // Persistent, not a toast: while true, an edit made inside the autosave window cannot be
  // recovered after a crash, and the user has to be able to see that at any moment.
  const [oversizeForBackup, setOversizeForBackup] = useState<number | null>(null);
  const mobileSectionId = useId();
  const slidesSectionId = `${mobileSectionId}-slides`;
  const canvasSectionId = `${mobileSectionId}-canvas`;
  const notesSectionId = `${mobileSectionId}-notes`;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pptImportRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const thumbnailTimeoutRef = useRef<number | null>(null);
  const historyTimeoutRef = useRef<number | null>(null);
  const dragDepthRef = useRef(0);
  const docIdRef = useRef(docId);
  const documentRevisionRef = useRef(documentRevision);
  const fileNameRef = useRef(fileName);
  const isLoadedRef = useRef(false);

  // ---- canvas <-> deck boundary ---------------------------------------------------
  // The fabric canvas owns the slide that is on screen; React owns the deck. Data only
  // crosses on an explicit slide switch, a flush, or a save.
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const slidesRef = useRef<Slide[]>(slides);
  const renderedSlideIdRef = useRef<string | null>(null);
  // The last slide handed to the load queue. Distinct from renderedSlideIdRef, which is
  // the last load that actually COMPLETED.
  const pendingSlideIdRef = useRef<string | null>(null);
  const currentSlideIdRef = useRef(currentSlideId);
  const canvasDirtyRef = useRef(false);
  const deckDirtyRef = useRef(false);
  // A depth counter, not a boolean: slide loads are serialized but the counter keeps a
  // nested load (history restore during a load) from clearing suppression too early.
  const suppressDepthRef = useRef(0);
  // Monotonic token + promise chain that serialize slide loads. See renderCurrentSlide.
  const loadTokenRef = useRef(0);
  const loadChainRef = useRef<Promise<void>>(Promise.resolve());
  const canvasScaleRef = useRef(1);
  const historyRef = useRef<{ stack: SlideCanvasJSON[]; index: number }>({ stack: [], index: -1 });
  // The winner's revision from the last conflict. An EXPLICIT save adopts it so the user
  // can actually overwrite; autosave never does, so a conflict is never resolved silently.
  const conflictRevisionRef = useRef<number | null>(null);
  const crashSafetyWarnedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const saveAgainRef = useRef(false);
  const performSaveRef = useRef<((options?: { force?: boolean; allowResurrect?: boolean }) => Promise<void>) | null>(null);
  const dragStateRef = useRef<{ index: number; pointerId: number } | null>(null);
  const dropSlideIndexRef = useRef<number | null>(null);
  const slideCardRefs = useRef<(HTMLElement | null)[]>([]);
  const presentElementRef = useRef<HTMLCanvasElement | null>(null);
  const presentCanvasRef = useRef<fabric.StaticCanvas | null>(null);
  const presentRootRef = useRef<HTMLDivElement | null>(null);
  const enteredFullscreenRef = useRef(false);

  useEffect(() => {
    documentRevisionRef.current = documentRevision;
  }, [documentRevision]);

  useEffect(() => {
    fileNameRef.current = fileName;
  }, [fileName]);

  useEffect(() => {
    isLoadedRef.current = isLoaded;
  }, [isLoaded]);

  // Below the stacking breakpoint the notes rail is a full-width tab pane owned by the
  // mobile switcher, so the fixed width and the collapse control are suppressed there.
  useEffect(() => {
    const query = window.matchMedia(COMPACT_LAYOUT_QUERY);
    const update = () => setIsCompactLayout(query.matches);

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTES_OPEN_STORAGE_KEY, isNotesOpen ? '1' : '0');
    } catch {
      // Storage unavailable: the choice simply does not survive the session.
    }
  }, [isNotesOpen]);

  useEffect(() => {
    if (!searchParams.get('id')) {
      setSearchParams({ id: docId }, { replace: true });
    }
  }, [docId, searchParams, setSearchParams]);

  // Switching documents in place (hash navigation) tears the editor back down to a clean
  // state. The outgoing deck is flushed FIRST, while docIdRef still names it.
  useEffect(() => {
    if (docIdRef.current === docId) {
      return;
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (deckDirtyRef.current || canvasDirtyRef.current) {
      // saveDocument's arguments are read synchronously, before any await, so this call
      // captures the OUTGOING id even though docIdRef moves on the next line.
      void performSaveRef.current?.().catch((error) => console.error('Save flush failed', error));
    }

    docIdRef.current = docId;
    loadTokenRef.current += 1; // invalidate any queued slide load for the old deck
    renderedSlideIdRef.current = null;
    pendingSlideIdRef.current = null;
    setSlideLoadError(null);
    canvasDirtyRef.current = false;
    deckDirtyRef.current = false;
    historyRef.current = { stack: [], index: -1 };
    setCanUndo(false);
    setCanRedo(false);

    const freshSlide: Slide = { id: createId('slide'), data: null, notes: '' };
    slidesRef.current = [freshSlide];
    setSlides([freshSlide]);
    setCurrentSlideId(freshSlide.id);
    currentSlideIdRef.current = freshSlide.id;
    setFileName(defaultFileName);
    fileNameRef.current = defaultFileName;
    setDocumentRevision(0);
    documentRevisionRef.current = 0;
    conflictRevisionRef.current = null;
    setLastSavedAt(null);
    setSaveStatus('Saved');
    setBanner(null);
    setPresentIndex(null);
    setIsLoaded(false);
    isLoadedRef.current = false;
  }, [docId]);

  // Declared BEFORE the canvas-creation effect so its cleanup runs BEFORE the canvas is
  // disposed: a pending autosave is flushed while the canvas can still be serialized.
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      if (deckDirtyRef.current || canvasDirtyRef.current) {
        void performSaveRef.current?.().catch((error) => console.error('Save flush failed', error));
      }
    };
  }, []);

  const commitSlides = useCallback((updater: (previous: Slide[]) => Slide[]) => {
    const next = updater(slidesRef.current);
    slidesRef.current = next;
    setSlides(next);
    return next;
  }, []);

  const captureActiveSlide = useCallback((withThumbnail: boolean): SlideCapture | null => {
    const canvas = fabricCanvasRef.current;
    const renderedId = renderedSlideIdRef.current;
    if (!canvas || !renderedId) {
      return null;
    }

    try {
      const zoom = canvas.getZoom() || 1;
      return {
        id: renderedId,
        data: serializeCanvas(canvas),
        // The backing store is scaled to fit the viewport, so the multiplier is divided by
        // the zoom to keep every thumbnail identical regardless of window size.
        thumbnail: withThumbnail
          ? makeThumbnail(canvas, zoom)
          : undefined,
      };
    } catch (error) {
      console.warn('Slide could not be captured', error);
      return null;
    }
  }, []);

  /** Copies the live canvas into the deck. No-op when the canvas has no pending edits. */
  const flushActiveSlide = useCallback(
    (withThumbnail = true) => {
      if (!canvasDirtyRef.current) {
        return;
      }

      const captured = captureActiveSlide(withThumbnail);
      if (!captured) {
        return;
      }

      canvasDirtyRef.current = false;
      commitSlides((previous) =>
        previous.map((slide) =>
          slide.id === captured.id
            ? { ...slide, data: captured.data, thumbnail: captured.thumbnail ?? slide.thumbnail }
            : slide,
        ),
      );
    },
    [captureActiveSlide, commitSlides],
  );

  const performSave = useCallback(async ({ force = false, allowResurrect = false }: { force?: boolean; allowResurrect?: boolean } = {}) => {
    if (!isLoadedRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (saveInFlightRef.current) {
      saveAgainRef.current = true;
      return;
    }

    if (!deckDirtyRef.current && !canvasDirtyRef.current && !force) {
      return;
    }

    if (force && conflictRevisionRef.current !== null) {
      // Explicit user intent to replace the other tab's version: adopt the winner's
      // revision so this write is no longer stale. Without this the local revision stays
      // behind for ever and EVERY later save conflicts, leaving no way to save at all.
      documentRevisionRef.current = conflictRevisionRef.current;
      conflictRevisionRef.current = null;
    }

    flushActiveSlide(false);
    saveInFlightRef.current = true;
    setSaveStatus('Saving...');

    try {
      // db.ts treats a falsy title as an unloadable record, so an empty name box must
      // never reach storage.
      const title = fileNameRef.current.trim() || defaultFileName;
      const savingDocId = docIdRef.current;
      const result = await saveDocument(
        savingDocId,
        title,
        'powerpoint',
        { slides: slidesRef.current },
        { knownRevision: documentRevisionRef.current, allowResurrect },
      );

      if (docIdRef.current !== savingDocId) {
        // The editor moved to another document while this write was in flight; its result
        // says nothing about the deck now on screen.
        return;
      }

      if (result.status === 'conflict') {
        // Nothing was written: the local revision must NOT advance here, or the next
        // autosave would silently overwrite the winner while claiming to be in sync.
        conflictRevisionRef.current = result.record.revision;
        setSaveStatus('Conflict detected');
        setBanner({
          tone: 'warning',
          title: 'A newer presentation was saved in another tab.',
          detail: `Your edits are still here and still unsaved. That tab is at revision ${result.record.revision}. Reload to review their version, or overwrite it with yours — autosave will keep reporting this conflict until you choose.`,
          action: {
            label: 'Overwrite with my version',
            onClick: () => {
              void performSaveRef.current?.({ force: true }).catch((error) => console.error('Force save failed', error));
            },
          },
        });
        return;
      }

      // Defence in depth: db.ts now THROWS on a total persistence failure (the catch below
      // handles that), but 'failed' remains in the union and must never read as success.
      if (result.status !== 'saved') {
        setSaveStatus('Save failed');
        setBanner({
          tone: 'error',
          title: 'Nothing was saved.',
          detail: 'Browser storage rejected the write. Export the deck to PPTX before closing this tab.',
        });
        return;
      }

      // A deck over the backup cap cannot be snapshotted synchronously at unload, so a
      // crash or a close inside the autosave window WILL lose the last edit. Measured once
      // per save (not per edit). The result drives a PERSISTENT status-bar indicator: a
      // one-shot banner was worse than useless here, because the next routine toast — often
      // the very image insert that pushed the deck over the cap — wiped it.
      const payloadBytes = JSON.stringify({ slides: slidesRef.current }).length;
      const isOversize = payloadBytes > BACKUP_SIZE_LIMIT_BYTES;
      oversizeForBackupRef.current = isOversize ? payloadBytes : null;
      setOversizeForBackup(isOversize ? payloadBytes : null);

      if (isOversize && !crashSafetyWarnedRef.current) {
        crashSafetyWarnedRef.current = true;
        setBanner({
          tone: 'warning',
          title: 'This deck is too large for crash recovery.',
          detail: `At ${Math.round(payloadBytes / 1024)}KB it exceeds the ${Math.round(
            BACKUP_SIZE_LIMIT_BYTES / 1024,
          )}KB emergency-snapshot limit, so an edit made in the last second before a crash or a tab close can be lost. Autosave still runs every ${SAVE_DEBOUNCE_MS}ms — press Ctrl+S before closing, or export to PPTX.`,
        });
      } else if (!isOversize) {
        // Back under the cap: re-arm so crossing it again is announced again.
        crashSafetyWarnedRef.current = false;
      }

      documentRevisionRef.current = result.record.revision;
      conflictRevisionRef.current = null;
      setDocumentRevision(result.record.revision);
      setLastSavedAt(result.record.updatedAt);
      deckDirtyRef.current = false;
      setSaveStatus('Saved');
    } catch (error) {
      // saveDocument throws for three very different reasons and they must not be reported
      // as one. The deck stays dirty in every branch (deckDirtyRef is only cleared on a
      // confirmed write), so whichever route the user takes, nothing is lost meanwhile.
      console.error('Failed to save presentation', error);
      const code = error instanceof DocumentPersistenceError ? error.code : 'storage-unavailable';

      if (code === 'document-deleted') {
        setSaveStatus('Deck was deleted');
        setBanner({
          tone: 'error',
          title: 'This presentation was deleted in another tab.',
          detail: 'Nothing was saved, and your edits are still open here. Restore it to save them back into this deck, or export to PPTX to keep them elsewhere.',
          action: {
            label: 'Restore this presentation',
            onClick: () => {
              void performSaveRef.current?.({ force: true, allowResurrect: true }).catch((restoreError) =>
                console.error('Restore failed', restoreError),
              );
            },
          },
        });
      } else if (code === 'conflict-unverifiable') {
        // A conflict, NOT a write failure: another client moved the document on and the
        // winning record could not be read back to show it.
        setSaveStatus('Conflict detected');
        setBanner({
          tone: 'warning',
          title: 'A newer presentation was saved elsewhere.',
          detail: 'It could not be read back to show you, so nothing was written. Reload to review their version, or overwrite it with yours.',
          action: {
            label: 'Overwrite with my version',
            onClick: () => {
              void performSaveRef.current?.({ force: true }).catch((forceError) => console.error('Force save failed', forceError));
            },
          },
        });
      } else {
        setSaveStatus('Save failed');
        setBanner({
          tone: 'error',
          title: 'Nothing was saved.',
          detail: 'Browser storage is unavailable. Your edits are still open here — export the deck to PPTX before closing this tab.',
        });
      }
    } finally {
      saveInFlightRef.current = false;
      if (saveAgainRef.current) {
        saveAgainRef.current = false;
        window.setTimeout(() => {
          void performSaveRef.current?.().catch((error) => console.error('Save flush failed', error));
        }, 0);
      }
    }
  }, [flushActiveSlide]);

  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  const scheduleSave = useCallback(() => {
    deckDirtyRef.current = true;
    if (!isLoadedRef.current) {
      return;
    }

    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveTimeoutRef.current = null;
      void performSaveRef.current?.().catch((error) => console.error('Save flush failed', error));
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const scheduleThumbnail = useCallback(() => {
    if (thumbnailTimeoutRef.current) {
      window.clearTimeout(thumbnailTimeoutRef.current);
    }

    thumbnailTimeoutRef.current = window.setTimeout(() => {
      thumbnailTimeoutRef.current = null;
      flushActiveSlide(true);
    }, THUMBNAIL_DEBOUNCE_MS);
  }, [flushActiveSlide]);

  const syncHistoryFlags = useCallback(() => {
    const { stack, index } = historyRef.current;
    setCanUndo(index > 0);
    setCanRedo(index >= 0 && index < stack.length - 1);
  }, []);

  const seedHistory = useCallback(
    (snapshot: SlideCanvasJSON) => {
      if (historyTimeoutRef.current) {
        window.clearTimeout(historyTimeoutRef.current);
        historyTimeoutRef.current = null;
      }

      historyRef.current = { stack: [snapshot], index: 0 };
      syncHistoryFlags();
    },
    [syncHistoryFlags],
  );

  const commitHistorySnapshot = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    const snapshot = serializeCanvas(canvas);
    const { stack, index } = historyRef.current;
    const truncated = stack.slice(0, index + 1);
    const nextStack = [...truncated, snapshot].slice(-HISTORY_LIMIT);
    historyRef.current = { stack: nextStack, index: nextStack.length - 1 };
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  /**
   * Commits an edit that is still inside the debounce window. Undo MUST call this first:
   * discarding the pending snapshot instead would make one undo jump back two edits, and
   * the skipped edit would have no redo path at all.
   */
  const flushPendingHistory = useCallback(() => {
    if (!historyTimeoutRef.current) {
      return;
    }

    window.clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = null;
    commitHistorySnapshot();
  }, [commitHistorySnapshot]);

  const scheduleHistory = useCallback(() => {
    if (historyTimeoutRef.current) {
      window.clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = window.setTimeout(() => {
      historyTimeoutRef.current = null;
      commitHistorySnapshot();
    }, HISTORY_DEBOUNCE_MS);
  }, [commitHistorySnapshot]);

  /** Fits the 960x540 slide inside the shell so no part of it is ever off-screen. */
  const fitCanvasToShell = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const shell = stageRef.current;
    const wrap = stageWrapRef.current;
    if (!canvas || !shell || !wrap) {
      return;
    }

    const shellStyles = window.getComputedStyle(shell);
    const wrapStyles = window.getComputedStyle(wrap);
    const shellPadX = parseFloat(shellStyles.paddingLeft) + parseFloat(shellStyles.paddingRight);
    const shellPadY = parseFloat(shellStyles.paddingTop) + parseFloat(shellStyles.paddingBottom);
    const wrapPadY = parseFloat(wrapStyles.paddingTop) + parseFloat(wrapStyles.paddingBottom);

    const availableWidth = shell.clientWidth - shellPadX;
    if (availableWidth <= 0) {
      return;
    }

    // The stage is a bounded flex child (`flex:1; min-height:0; overflow:auto`), so its
    // height is driven by the viewport and not by the canvas: no resize feedback loop.
    const measuredHeight = wrap.clientHeight - wrapPadY - shellPadY;
    const viewportHeight = window.innerHeight - wrap.getBoundingClientRect().top - 56 - wrapPadY - shellPadY;
    const availableHeight = Math.max(measuredHeight, viewportHeight, 120);

    const rawScale = Math.min(MAX_CANVAS_SCALE, availableWidth / SLIDE_WIDTH, availableHeight / SLIDE_HEIGHT);
    const width = Math.max(SLIDE_WIDTH * MIN_CANVAS_SCALE, Math.floor(SLIDE_WIDTH * rawScale));
    const scale = width / SLIDE_WIDTH;

    if (Math.abs(scale - canvasScaleRef.current) < 0.002) {
      return;
    }

    canvasScaleRef.current = scale;
    // Fabric zoom (not a CSS transform) keeps the backing store, the CSS box and pointer
    // hit-testing in one coordinate system, so clicks still land on the right object.
    canvas.setDimensions({ width, height: Math.round(SLIDE_HEIGHT * scale) });
    canvas.setZoom(scale);
    canvas.requestRenderAll();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;
    canvasScaleRef.current = 1;
    renderedSlideIdRef.current = null;
    pendingSlideIdRef.current = null;
    canvasDirtyRef.current = false;
    setFabricCanvas(canvas);

    const handleSelection = () => setHasSelection(canvas.getActiveObjects().length > 0);
    const focusStage = () => {
      // Keeps Delete/Backspace scoped to the canvas without stealing focus from an IText
      // that is being edited (fabric owns a hidden textarea in that case).
      if (isEditingText(canvas.getActiveObject())) {
        return;
      }

      stageRef.current?.focus({ preventScroll: true });
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => setHasSelection(false));
    canvas.on('mouse:down', focusStage);

    fitCanvasToShell();

    return () => {
      fabricCanvasRef.current = null;
      renderedSlideIdRef.current = null;
      pendingSlideIdRef.current = null;
      void canvas.dispose();
      setFabricCanvas(null);
    };
  }, [fitCanvasToShell]);

  useEffect(() => {
    const wrap = stageWrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', fitCanvasToShell);
      return () => window.removeEventListener('resize', fitCanvasToShell);
    }

    const observer = new ResizeObserver(() => fitCanvasToShell());
    observer.observe(wrap);
    window.addEventListener('resize', fitCanvasToShell);
    window.addEventListener('orientationchange', fitCanvasToShell);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fitCanvasToShell);
      window.removeEventListener('orientationchange', fitCanvasToShell);
    };
  }, [fitCanvasToShell, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas || isLoaded) {
      return;
    }

    loadDocument<{ slides?: Slide[] }>(docId)
      .then((doc) => {
        let loadedSlides: Slide[] | null = null;

        if (doc && doc.type === 'powerpoint') {
          setFileName(doc.title);
          fileNameRef.current = doc.title;
          if (doc.data?.slides?.length) {
            loadedSlides = doc.data.slides as Slide[];
          }
          setLastSavedAt(doc.updatedAt);
          setDocumentRevision(doc.revision);
          documentRevisionRef.current = doc.revision;
          if (doc.source === 'backup') {
            setBanner({
              tone: 'warning',
              title: 'Recovered edits that had not reached storage.',
              detail: 'This deck came back from the local backup cache — the last edits from the previous session are here. Saving now.',
            });
            // The backup is not in IndexedDB yet; write it through.
            deckDirtyRef.current = true;
          }
        }

        if (loadedSlides?.length) {
          const { slides: migratedSlides, changed } = migrateSlides(loadedSlides);
          if (changed) {
            deckDirtyRef.current = true;
          }
          commitSlides(() => migratedSlides);
          setCurrentSlideId(migratedSlides[0].id);
        }

        setIsLoaded(true);
        isLoadedRef.current = true;
        if (deckDirtyRef.current) {
          scheduleSave();
        }
      })
      .catch((error) => {
        console.error('Failed to load presentation', error);
        setBanner({
          tone: 'error',
          title: 'Presentation failed to load cleanly.',
          detail: 'A new slide deck was opened instead.',
        });
        setIsLoaded(true);
        isLoadedRef.current = true;
      });
  }, [commitSlides, docId, fabricCanvas, isLoaded, scheduleSave]);

  /**
   * Rebuilds previews for slides that arrived without one — the unload snapshot drops
   * thumbnails to fit under the backup size cap, and they are pure derived data. Runs off
   * the main canvas, one slide at a time, yielding between slides.
   */
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let cancelled = false;

    const rebuild = async () => {
      const missing = slidesRef.current.filter((slide) => slide.data && !slide.thumbnail);

      for (const slide of missing) {
        if (cancelled || !slide.data) {
          return;
        }

        const element = document.createElement('canvas');
        element.width = SLIDE_WIDTH;
        element.height = SLIDE_HEIGHT;
        const temp = new fabric.StaticCanvas(element, {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          backgroundColor: '#ffffff',
        });

        try {
          await temp.loadFromJSON(slide.data);
          temp.backgroundColor = '#ffffff';
          temp.renderAll();
          const thumbnail = makeThumbnail(temp);
          if (!cancelled) {
            commitSlides((previous) =>
              previous.map((entry) => (entry.id === slide.id ? { ...entry, thumbnail } : entry)),
            );
          }
        } catch (error) {
          console.warn('Thumbnail could not be rebuilt', error);
        } finally {
          void temp.dispose();
        }

        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    };

    void rebuild();

    return () => {
      cancelled = true;
    };
  }, [commitSlides, isLoaded]);

  /**
   * Renders whatever slide is current into the canvas.
   *
   * Slide loads are SERIALIZED through a promise chain and stamped with a monotonic token.
   * This matters because fabric's `loadFromJSON` clears the canvas and adds the new objects
   * BEFORE the await resumes: a "was I cancelled?" check after the await can skip the
   * bookkeeping but cannot undo the mutation. Two overlapping loads would therefore leave
   * slide A's objects on screen while the bookkeeping claimed slide B, and the next flush
   * would write A's content onto B — silent, permanent, un-undoable corruption. The window
   * is as wide as the slowest enliven (images, throttled CPU), not a few milliseconds.
   *
   * With the queue, a superseded load is skipped BEFORE it touches the canvas. A load that
   * is superseded WHILE in flight disowns the canvas (`renderedSlideIdRef = null`) and
   * drops any dirty flag, so the already-queued newer load is what defines the canvas.
   *
   * The early return compares against `pendingSlideIdRef` — the last QUEUED target — and
   * never against `renderedSlideIdRef`, which names the last COMPLETED load. Navigating
   * A -> B -> A while A is still loading would otherwise find `renderedSlideIdRef` still
   * equal to A, return without queueing anything and without bumping the token, and leave
   * the in-flight load of A unsupersededered: the canvas would end up showing A while the
   * sidebar, the notes pane and `currentSlideId` all said B.
   */
  const renderCurrentSlide = useCallback((force = false) => {
    if (!fabricCanvasRef.current || !isLoadedRef.current) {
      return;
    }

    const targetId = currentSlideIdRef.current;
    if (!force && pendingSlideIdRef.current === targetId) {
      return;
    }

    // Bumping the token invalidates every queued-but-not-yet-started load.
    pendingSlideIdRef.current = targetId;
    const token = (loadTokenRef.current += 1);

    loadChainRef.current = loadChainRef.current.then(async () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || loadTokenRef.current !== token) {
        return;
      }

      if (renderedSlideIdRef.current === targetId) {
        return; // already on screen and nothing newer is queued: nothing to do
      }

      const slide = slidesRef.current.find((entry) => entry.id === targetId);
      if (!slide) {
        return;
      }

      suppressDepthRef.current += 1;
      try {
        const isNewSlide = !slide.data;
        if (slide.data) {
          await canvas.loadFromJSON(slide.data);
        } else {
          applySlideTemplate(canvas, slidesRef.current.length === 1 ? 'cover' : 'content');
        }

        canvas.backgroundColor = '#ffffff';
        canvasScaleRef.current = 0;
        fitCanvasToShell();
        canvas.renderAll();

        if (loadTokenRef.current !== token) {
          // Superseded mid-load. The canvas holds objects the user is not looking at, so it
          // must not be claimed for ANY slide and must never be flushed. A newer load is
          // already queued (the token only moves in this function, which always queues).
          renderedSlideIdRef.current = null;
          canvasDirtyRef.current = false;
          return;
        }

        renderedSlideIdRef.current = targetId;
        setSlideLoadError(null);
        setHasSelection(false);
        seedHistory(serializeCanvas(canvas));

        if (isNewSlide) {
          canvasDirtyRef.current = true;
          flushActiveSlide(true);
          scheduleSave();
        }
      } catch (error) {
        // The slide's stored content could not be rebuilt. Disowning the canvas keeps the
        // damage contained (no edit can flush onto another slide), but the user must not be
        // left looking at some other slide's content believing it is this one.
        console.error('Slide failed to render', error);
        renderedSlideIdRef.current = null;
        pendingSlideIdRef.current = null;
        canvasDirtyRef.current = false;
        try {
          canvas.clear();
          canvas.backgroundColor = '#ffffff';
          canvas.renderAll();
        } catch (clearError) {
          console.error('Canvas could not be cleared', clearError);
        }
        const failedIndex = slidesRef.current.findIndex((entry) => entry.id === targetId);
        setSlideLoadError({ slideId: targetId, index: failedIndex });
        setBanner({
          tone: 'error',
          title: `Slide ${failedIndex + 1} could not be opened.`,
          detail:
            'Its stored content could not be rebuilt, so the canvas is blank and edits here will not be saved. The rest of the deck is untouched — open another slide, or delete this one.',
        });
      } finally {
        suppressDepthRef.current = Math.max(0, suppressDepthRef.current - 1);
      }
    });

    void loadChainRef.current.catch((error) => console.error('Slide load chain failed', error));
  }, [fitCanvasToShell, flushActiveSlide, scheduleSave, seedHistory]);

  useEffect(() => {
    currentSlideIdRef.current = currentSlideId;
    renderCurrentSlide();
  }, [currentSlideId, fabricCanvas, isLoaded, renderCurrentSlide]);

  useEffect(() => {
    if (!fabricCanvas || !isLoaded) {
      return;
    }

    // Per edit this only marks a flag and resets three timers: no deck serialization and
    // no thumbnail work on the keystroke path.
    const handleCanvasMutation = () => {
      if (suppressDepthRef.current > 0) {
        return;
      }

      canvasDirtyRef.current = true;
      scheduleHistory();
      scheduleThumbnail();
      scheduleSave();
    };

    fabricCanvas.on('object:modified', handleCanvasMutation);
    fabricCanvas.on('object:added', handleCanvasMutation);
    fabricCanvas.on('object:removed', handleCanvasMutation);
    fabricCanvas.on('text:changed', handleCanvasMutation);

    return () => {
      fabricCanvas.off('object:modified', handleCanvasMutation);
      fabricCanvas.off('object:added', handleCanvasMutation);
      fabricCanvas.off('object:removed', handleCanvasMutation);
      fabricCanvas.off('text:changed', handleCanvasMutation);
    };
  }, [fabricCanvas, isLoaded, scheduleHistory, scheduleSave, scheduleThumbnail]);

  const oversizeForBackupRef = useRef<number | null>(null);

  /**
   * Synchronous emergency snapshot. `saveDocument` awaits `getDB()` before it touches
   * anything, so it cannot run in an unload handler — the page dies during that first
   * await and nothing lands. This is the only path that completes there.
   *
   * `saveDocumentBackupNow` performs a real conflict check and REFUSES when another tab is
   * ahead, so `false` no longer means only "too big". Inside `pagehide` a refusal is
   * correct and unactionable (no UI is possible), so it is ignored. Anywhere the page is
   * still alive, a refusal is reported — silently discarding this tab's edits is exactly
   * the outcome the check exists to prevent.
   */
  const takeUnloadSnapshot = useCallback(
    ({ reportRefusal }: { reportRefusal: boolean }) => {
      if (!deckDirtyRef.current && !canvasDirtyRef.current) {
        return true;
      }

      flushActiveSlide(false);

      // Thumbnails are the only derived part of the payload, so an over-cap deck sheds them
      // BEFORE the call rather than retrying on a refusal: retrying a conflict refusal with
      // a smaller payload would be meaningless, and the two cases are indistinguishable
      // from the boolean.
      const slides =
        oversizeForBackupRef.current !== null
          ? slidesRef.current.map((slide) => ({ ...slide, thumbnail: undefined }))
          : slidesRef.current;

      // knownRevision MUST be a real revision here. Passing null would disable the conflict
      // check and let this tab overwrite one that legitimately saved. (Force-saving through
      // `saveDocument` has different rules; that pattern must not migrate to this call.)
      const accepted = saveDocumentBackupNow(
        docIdRef.current,
        fileNameRef.current.trim() || defaultFileName,
        'powerpoint',
        { slides },
        { knownRevision: documentRevisionRef.current },
      );

      if (accepted || !reportRefusal) {
        return accepted;
      }

      if (oversizeForBackupRef.current !== null) {
        // Already disclosed by the persistent status-bar indicator; do not misreport a size
        // refusal as a conflict.
        return accepted;
      }

      setSaveStatus('Conflict detected');
      setBanner({
        tone: 'warning',
        title: 'Another tab is ahead of this one.',
        detail:
          'This deck was saved elsewhere after this tab last loaded it, so nothing from this tab was written — including the emergency copy. Closing this tab now would discard these edits. Overwrite with your version, or export to PPTX first.',
        action: {
          label: 'Overwrite with my version',
          onClick: () => {
            void performSaveRef.current?.({ force: true }).catch((error) => console.error('Force save failed', error));
          },
        },
      });

      return accepted;
    },
    [flushActiveSlide],
  );

  // Pending autosave must survive a tab close, a bfcache freeze and a background switch.
  useEffect(() => {
    const onPageHide = () => {
      takeUnloadSnapshot({ reportRefusal: false });
    };

    // Backgrounding: the page stays alive, so the real save is the durable path. The
    // snapshot is only taken if that save did NOT land, which also keeps a stale backup
    // from shadowing a save that succeeded.
    const handleVisibility = () => {
      if (document.visibilityState !== 'hidden') {
        return;
      }

      if (!deckDirtyRef.current && !canvasDirtyRef.current) {
        return;
      }

      void performSaveRef.current?.()
        .then(() => {
          if (deckDirtyRef.current || canvasDirtyRef.current) {
            takeUnloadSnapshot({ reportRefusal: true });
          }
        })
        .catch((error) => console.error('Save flush failed', error));
    };

    // `pagehide` is the reliable one; `beforeunload` is registered as well because it is
    // harmless (the snapshot is idempotent) and it covers teardown paths that fire only it.
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onPageHide);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onPageHide);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [takeUnloadSnapshot]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    return subscribeToDocument(docId, (event) => {
      if (event.lastSavedBy === getCurrentClientId() || event.revision <= documentRevision) {
        return;
      }

      // While this tab is dirty, being behind is not just informational: its emergency
      // snapshot will now be refused, so closing it would discard these edits silently.
      const hasUnsavedWork = deckDirtyRef.current || canvasDirtyRef.current;
      setBanner({
        tone: 'warning',
        title: 'A newer presentation was saved in another tab.',
        detail: hasUnsavedWork
          ? 'This tab is now behind, so its edits can no longer be saved or emergency-snapshotted without overwriting that version. Overwrite with yours, export to PPTX, or reload to take theirs.'
          : 'Reload this deck if you want the latest saved version from that session.',
        action: hasUnsavedWork
          ? {
              label: 'Overwrite with my version',
              onClick: () => {
                void performSaveRef.current?.({ force: true }).catch((error) => console.error('Force save failed', error));
              },
            }
          : undefined,
      });
    });
  }, [docId, documentRevision, isLoaded]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      if (enteredFullscreenRef.current && !document.fullscreenElement) {
        enteredFullscreenRef.current = false;
        setPresentIndex(null);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentSlideIndex = slides.findIndex((slide) => slide.id === currentSlideId);
  const currentSlide = slides[currentSlideIndex];

  const saveSummary =
    saveStatus === 'Saved' && lastSavedAt
      ? `Saved ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(lastSavedAt)}`
      : saveStatus;

  const slideCountLabel = `${currentSlideIndex + 1} / ${slides.length}`;

  const handleFileNameChange = useCallback(
    (nextName: string) => {
      setFileName(nextName);
      fileNameRef.current = nextName;
      scheduleSave();
    },
    [scheduleSave],
  );

  const switchSlide = useCallback(
    (nextSlideId: string) => {
      if (nextSlideId === currentSlideId) {
        // Clicking the already-selected slide is also the user's way out if the canvas is
        // showing something else (a load that failed, or one that lost its claim): force a
        // re-render instead of doing nothing.
        if (renderedSlideIdRef.current !== nextSlideId) {
          renderCurrentSlide(true);
        }

        return;
      }

      flushActiveSlide(true);
      setCurrentSlideId(nextSlideId);
      setMobileWorkspaceView('canvas');
    },
    [currentSlideId, flushActiveSlide, renderCurrentSlide],
  );

  const addSlide = (variant: 'cover' | 'content' = 'content') => {
    flushActiveSlide(true);
    const newId = createId('slide');
    const template = createSlideSnapshot(variant);

    commitSlides((previous) => {
      const insertIndex = Math.max(previous.findIndex((slide) => slide.id === currentSlideId), 0) + 1;
      const nextSlides = [...previous];
      nextSlides.splice(insertIndex, 0, { id: newId, data: template.data, notes: '', thumbnail: template.thumbnail });
      return nextSlides;
    });

    setCurrentSlideId(newId);
    setMobileWorkspaceView('canvas');
    scheduleSave();
  };

  const duplicateSlide = () => {
    flushActiveSlide(true);
    const sourceSlide = slidesRef.current.find((slide) => slide.id === currentSlideId);
    if (!sourceSlide?.data) {
      return;
    }

    const newId = createId('slide');
    commitSlides((previous) => {
      const sourceIndex = previous.findIndex((slide) => slide.id === currentSlideId);
      const nextSlides = [...previous];
      nextSlides.splice(sourceIndex + 1, 0, {
        id: newId,
        data: JSON.parse(JSON.stringify(sourceSlide.data)) as SlideCanvasJSON,
        notes: sourceSlide.notes ?? '',
        thumbnail: sourceSlide.thumbnail,
      });
      return nextSlides;
    });

    setCurrentSlideId(newId);
    setMobileWorkspaceView('canvas');
    scheduleSave();
  };

  const deleteSlide = () => {
    if (!pendingDeleteSlideId) {
      return;
    }

    if (slidesRef.current.length <= 1) {
      setBanner({
        tone: 'warning',
        title: 'A presentation needs at least one slide.',
      });
      setPendingDeleteSlideId(null);
      return;
    }

    const removedIndex = slidesRef.current.findIndex((slide) => slide.id === pendingDeleteSlideId);
    if (pendingDeleteSlideId === renderedSlideIdRef.current) {
      canvasDirtyRef.current = false;
    } else {
      flushActiveSlide(true);
    }

    const nextSlides = commitSlides((previous) => previous.filter((slide) => slide.id !== pendingDeleteSlideId));

    if (currentSlideId === pendingDeleteSlideId) {
      setCurrentSlideId(nextSlides[Math.max(0, removedIndex - 1)]?.id ?? nextSlides[0].id);
    }

    setPendingDeleteSlideId(null);
    scheduleSave();
  };

  const moveSlide = useCallback(
    (fromIndex: number, toIndex: number) => {
      const total = slidesRef.current.length;
      if (fromIndex < 0 || fromIndex >= total || toIndex < 0 || toIndex >= total || fromIndex === toIndex) {
        return;
      }

      flushActiveSlide(true);
      commitSlides((previous) => {
        const nextSlides = [...previous];
        const [moved] = nextSlides.splice(fromIndex, 1);
        nextSlides.splice(toIndex, 0, moved);
        return nextSlides;
      });
      scheduleSave();
    },
    [commitSlides, flushActiveSlide, scheduleSave],
  );

  const findSlideIndexAtPoint = useCallback((clientX: number, clientY: number) => {
    let bestIndex: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    slideCardRefs.current.forEach((element, index) => {
      if (!element || !element.isConnected) {
        return;
      }

      const rect = element.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        bestIndex = index;
        bestDistance = -1;
        return;
      }

      if (bestDistance === -1) {
        return;
      }

      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  }, []);

  const registerSlideCard = useCallback((index: number, element: HTMLElement | null) => {
    slideCardRefs.current[index] = element;
  }, []);

  const handleReorderPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>, index: number) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers (tests, some touch stacks) cannot be captured; the drag still
      // works because the events keep bubbling from the handle.
    }

    dragStateRef.current = { index, pointerId: event.pointerId };
    dropSlideIndexRef.current = index;
    setDragSlideIndex(index);
    setDropSlideIndex(index);
  }, []);

  const handleReorderPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const target = findSlideIndexAtPoint(event.clientX, event.clientY);
    if (target !== null && target !== dropSlideIndexRef.current) {
      dropSlideIndexRef.current = target;
      setDropSlideIndex(target);
    }
  }, [findSlideIndexAtPoint]);

  const handleReorderPointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    if (!state) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // See handleReorderPointerDown.
    }

    const target = dropSlideIndexRef.current;
    dropSlideIndexRef.current = null;
    setDragSlideIndex(null);
    setDropSlideIndex(null);

    if (target !== null) {
      moveSlide(state.index, target);
    }
  }, [moveSlide]);

  const handleReorderPointerCancel = useCallback(() => {
    dragStateRef.current = null;
    dropSlideIndexRef.current = null;
    setDragSlideIndex(null);
    setDropSlideIndex(null);
  }, []);

  const addText = () => {
    if (!fabricCanvas) {
      return;
    }

    const text = createTextObject('New text', {
      left: 110,
      top: 110,
      fontSize: 26,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    setHasSelection(true);
  };

  const addRect = () => {
    if (!fabricCanvas) {
      return;
    }

    const shape = new fabric.Rect({
      ...TOP_LEFT_ORIGIN,
      left: 120,
      top: 140,
      width: 180,
      height: 110,
      rx: 16,
      ry: 16,
      fill: '#2563eb',
    });

    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
    setHasSelection(true);
  };

  const addCircle = () => {
    if (!fabricCanvas) {
      return;
    }

    const shape = new fabric.Circle({
      ...TOP_LEFT_ORIGIN,
      left: 160,
      top: 150,
      radius: 62,
      fill: '#f97316',
    });

    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
    setHasSelection(true);
  };

  const deleteSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) {
      return;
    }

    activeObjects.forEach((object) => canvas.remove(object));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setHasSelection(false);
  }, []);

  // Scoped to the canvas shell: a focused slide thumbnail must never lose an object to
  // Backspace, and Backspace must never navigate the browser back.
  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Delete' && event.key !== 'Backspace') {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, [contenteditable="true"]')) {
      return;
    }

    if (isEditingText(fabricCanvasRef.current?.getActiveObject())) {
      return;
    }

    event.preventDefault();
    deleteSelected();
  };

  const applyColor = (color: string) => {
    setCurrentColor(color);
    if (!fabricCanvas) {
      return;
    }

    const activeObjects = fabricCanvas.getActiveObjects();
    if (!activeObjects.length) {
      return;
    }

    activeObjects.forEach((object) => {
      object.set('fill', color);
    });
    fabricCanvas.requestRenderAll();
    fabricCanvas.fire('object:modified', { target: activeObjects[0] });
  };

  const bringForward = () => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (fabricCanvas && activeObject) {
      fabricCanvas.bringObjectForward(activeObject);
      fabricCanvas.requestRenderAll();
      fabricCanvas.fire('object:modified', { target: activeObject });
    }
  };

  const sendBackward = () => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (fabricCanvas && activeObject) {
      fabricCanvas.sendObjectBackwards(activeObject);
      fabricCanvas.requestRenderAll();
      fabricCanvas.fire('object:modified', { target: activeObject });
    }
  };

  const applyHistorySnapshot = useCallback(
    async (nextIndex: number) => {
      const canvas = fabricCanvasRef.current;
      const snapshot = historyRef.current.stack[nextIndex];
      if (!canvas || !snapshot) {
        return;
      }

      if (historyTimeoutRef.current) {
        window.clearTimeout(historyTimeoutRef.current);
        historyTimeoutRef.current = null;
      }

      suppressDepthRef.current += 1;
      try {
        await canvas.loadFromJSON(snapshot);
        canvas.backgroundColor = '#ffffff';
        canvas.setZoom(canvasScaleRef.current);
        canvas.renderAll();
        historyRef.current = { ...historyRef.current, index: nextIndex };
        setHasSelection(false);
        syncHistoryFlags();
      } finally {
        suppressDepthRef.current = Math.max(0, suppressDepthRef.current - 1);
      }

      canvasDirtyRef.current = true;
      flushActiveSlide(true);
      scheduleSave();
    },
    [flushActiveSlide, scheduleSave, syncHistoryFlags],
  );

  const undo = useCallback(async () => {
    // An edit still inside the 220ms debounce is committed first, so undo always steps
    // back exactly one edit and the edit it stepped over stays reachable through redo.
    flushPendingHistory();
    if (historyRef.current.index <= 0) {
      return;
    }

    await applyHistorySnapshot(historyRef.current.index - 1);
  }, [applyHistorySnapshot, flushPendingHistory]);

  const redo = useCallback(async () => {
    flushPendingHistory();
    if (historyRef.current.index >= historyRef.current.stack.length - 1) {
      return;
    }

    await applyHistorySnapshot(historyRef.current.index + 1);
  }, [applyHistorySnapshot, flushPendingHistory]);

  const insertImageFile = async (file: File) => {
    if (!file || !fabricCanvas) {
      return;
    }

    try {
      const dataUrl = await readBlobAsDataUrl(file);
      const image = await fabric.Image.fromURL(dataUrl);
      const baseWidth = image.width || 320;
      const baseHeight = image.height || 240;
      const scale = Math.min(1, 320 / baseWidth, 220 / baseHeight);

      image.set({
        ...TOP_LEFT_ORIGIN,
        left: 120,
        top: 120,
        scaleX: scale,
        scaleY: scale,
      });
      fabricCanvas.add(image);
      fabricCanvas.setActiveObject(image);
      fabricCanvas.requestRenderAll();
      setHasSelection(true);
      setMobileWorkspaceView('canvas');
      setBanner({
        tone: 'success',
        title: 'Image inserted.',
        detail: `Added ${file.name} to the current slide.`,
      });
    } catch (error) {
      console.error('Image load failed', error);
      setBanner({
        tone: 'error',
        title: 'Image could not be inserted.',
        detail: 'The selected file could not be read in this browser session.',
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await insertImageFile(file as File);
    event.target.value = '';
  };

  const resetDropTarget = () => {
    dragDepthRef.current = 0;
    setIsDropTargetActive(false);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    const hasImageFile = [...event.dataTransfer.items].some((item) => item.kind === 'file' && item.type.startsWith('image/'));
    if (!hasImageFile) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDropTargetActive(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const hasImageFile = [...event.dataTransfer.items].some((item) => item.kind === 'file' && item.type.startsWith('image/'));
    if (!hasImageFile) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDropTargetActive(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const imageFile = [...event.dataTransfer.files].find((file) => file.type.startsWith('image/'));
    resetDropTarget();

    if (!imageFile) {
      return;
    }

    await insertImageFile(imageFile);
  };

  const startPresenting = () => {
    flushActiveSlide(true);
    setPresentSlideFailed(false);
    setPresentIndex(Math.max(0, currentSlideIndex));
  };

  const stopPresenting = useCallback(() => {
    const index = presentIndex;
    setPresentIndex(null);
    setPresentSlideFailed(false);
    enteredFullscreenRef.current = false;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }

    const slideAtIndex = index === null ? undefined : slidesRef.current[index];
    if (slideAtIndex) {
      switchSlide(slideAtIndex.id);
    }
  }, [presentIndex, switchSlide]);

  const updateNotes = (notes: string) => {
    commitSlides((previous) => previous.map((slide) => (slide.id === currentSlideId ? { ...slide, notes } : slide)));
    scheduleSave();
  };

  useEffect(() => {
    if (!fabricCanvas) {
      return;
    }

    const handlePaste = async (event: ClipboardEvent) => {
      if (presentIndex !== null) {
        return;
      }

      const imageFile = [...(event.clipboardData?.files ?? [])].find((file) => file.type.startsWith('image/'));
      if (!imageFile) {
        return;
      }

      event.preventDefault();
      await insertImageFile(imageFile);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas, presentIndex]);

  // Ctrl/Cmd+S saves the deck instead of opening the browser's "Save Page As" dialog.
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's' || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      deckDirtyRef.current = deckDirtyRef.current || canvasDirtyRef.current;
      // An explicit Ctrl/Cmd+S is the user asserting "this version wins".
      void performSaveRef.current?.({ force: true }).catch((error) => console.error('Save flush failed', error));
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const importPptxFile = async (file: File) => {
    if (file.size > maxImportFileBytes) {
      setBanner({
        tone: 'error',
        title: 'Presentation is too large to import safely.',
        detail: 'Choose a smaller deck before converting it in the browser.',
      });
      return;
    }

    setSaveStatus('Importing...');
    setFileName(file.name.replace(/\.[^/.]+$/, ''));
    fileNameRef.current = file.name.replace(/\.[^/.]+$/, '');

    try {
      const { default: JSZip } = await import('jszip');
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const relationshipsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string');
      const emuScale = readSlideEmuScale(await zip.file('ppt/presentation.xml')?.async('string'));
      const slideRefs: string[] = [];

      if (relationshipsXml) {
        const relsDoc = new DOMParser().parseFromString(relationshipsXml, 'text/xml');
        relsDoc.querySelectorAll('Relationship').forEach((relationship) => {
          const type = relationship.getAttribute('Type');
          const target = relationship.getAttribute('Target');
          // `includes('slide')` also matches slideMaster/slideLayout relationships, which
          // imported as an extra phantom slide on every single import.
          if (!type?.endsWith('/slide') || !target) {
            return;
          }

          const normalizedTarget = target
            .replace(/^\/+/, '')
            .replace(/^ppt\//, '')
            .replace(/^\.\.\//, '');
          slideRefs.push(normalizedTarget);
        });
      }

      slideRefs.sort((left, right) => {
        const leftNumber = parseInt(left.match(/\d+/)?.[0] || '0', 10);
        const rightNumber = parseInt(right.match(/\d+/)?.[0] || '0', 10);
        return leftNumber - rightNumber;
      });

      const importedSlides: Slide[] = [];

      for (const slideRef of slideRefs) {
        const slidePath = `ppt/${slideRef}`;
        const slideFileName = slideRef.split('/').pop();
        const slideXml = await zip.file(slidePath)?.async('string');
        if (!slideXml) {
          continue;
        }

        const tempElement = document.createElement('canvas');
        tempElement.width = SLIDE_WIDTH;
        tempElement.height = SLIDE_HEIGHT;
        const tempCanvas = new fabric.StaticCanvas(tempElement, {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          backgroundColor: '#ffffff',
        });
        const slideDoc = new DOMParser().parseFromString(slideXml, 'text/xml');
        const slideRelationships = new Map<string, { type: string; target: string }>();
        const slideRelationshipsXml = slideFileName
          ? await zip.file(`ppt/slides/_rels/${slideFileName}.rels`)?.async('string')
          : undefined;

        if (slideRelationshipsXml) {
          const relsDoc = new DOMParser().parseFromString(slideRelationshipsXml, 'text/xml');
          relsDoc.querySelectorAll('Relationship').forEach((relationship) => {
            const id = relationship.getAttribute('Id');
            const type = relationship.getAttribute('Type');
            const target = relationship.getAttribute('Target');
            if (!id || !type || !target) {
              return;
            }

            slideRelationships.set(id, { type, target });
          });
        }

        slideDoc.querySelectorAll('p\\:sp, sp').forEach((shape) => {
          const textBody = shape.querySelector('p\\:txBody, txBody');
          const textContent = textBody ? extractTextContent(textBody) : '';
          const metrics = extractTransformMetrics(shape, emuScale);

          if (textContent) {
            tempCanvas.add(
              createTextObject(textContent, {
                left: Math.max(40, metrics.left || 90),
                top: Math.max(40, metrics.top || 110),
                fontSize: 24,
                width: Math.max(220, metrics.width || 720),
              }),
            );
            return;
          }

          // Textless autoshapes were skipped entirely, so the app could not reopen its own
          // export: every rectangle and ellipse it wrote came back as nothing.
          const geometry = shape.querySelector('a\\:prstGeom, prstGeom')?.getAttribute('prst');
          if (!geometry || !metrics.width || !metrics.height) {
            return;
          }

          const fillColor = shape.querySelector('a\\:solidFill a\\:srgbClr, solidFill srgbClr')?.getAttribute('val');
          const fill = `#${fillColor || '2563eb'}`;

          if (geometry === 'ellipse') {
            const radius = metrics.width / 2;
            tempCanvas.add(
              new fabric.Circle({
                ...TOP_LEFT_ORIGIN,
                left: metrics.left,
                top: metrics.top,
                radius,
                scaleY: radius > 0 ? metrics.height / metrics.width : 1,
                fill,
              }),
            );
            return;
          }

          tempCanvas.add(
            new fabric.Rect({
              ...TOP_LEFT_ORIGIN,
              left: metrics.left,
              top: metrics.top,
              width: metrics.width,
              height: metrics.height,
              rx: geometry === 'roundRect' ? 16 : 0,
              ry: geometry === 'roundRect' ? 16 : 0,
              fill,
            }),
          );
        });

        for (const picture of slideDoc.querySelectorAll('p\\:pic, pic')) {
          const blip = picture.querySelector('a\\:blip, blip');
          const embedId = blip?.getAttribute('r:embed') ?? blip?.getAttribute('embed');
          if (!embedId) {
            continue;
          }

          const imageRelationship = slideRelationships.get(embedId);
          if (!imageRelationship || !imageRelationship.type.includes('/image')) {
            continue;
          }

          const imagePath = resolveZipTarget(slidePath, imageRelationship.target);
          const imageBlob = await zip.file(imagePath)?.async('blob');
          if (!imageBlob) {
            continue;
          }

          const imageDataUrl = await readBlobAsDataUrl(imageBlob);
          const image = await fabric.Image.fromURL(imageDataUrl);
          const metrics = extractTransformMetrics(picture, emuScale);
          const width = Math.max(120, metrics.width || image.width || 260);
          const height = Math.max(90, metrics.height || image.height || 180);

          image.set({
            ...TOP_LEFT_ORIGIN,
            left: Math.max(40, metrics.left || 90),
            top: Math.max(40, metrics.top || 120),
            scaleX: width / (image.width || width),
            scaleY: height / (image.height || height),
          });
          tempCanvas.add(image);
        }

        const notesRelationship = [...slideRelationships.values()].find((relationship) => relationship.type.includes('/notesSlide'));
        const notesPath = notesRelationship ? resolveZipTarget(slidePath, notesRelationship.target) : null;
        const notesXml = notesPath ? await zip.file(notesPath)?.async('string') : undefined;
        let notesText = '';

        if (notesXml) {
          const notesDoc = new DOMParser().parseFromString(notesXml, 'text/xml');
          const notesBody = [...notesDoc.querySelectorAll('p\\:sp, sp')].find(
            (shape) => (shape.querySelector('p\\:ph, ph')?.getAttribute('type') ?? '') === 'body',
          );
          notesText = notesBody ? extractTextContent(notesBody).trim() : '';
        }

        if (tempCanvas.getObjects().length === 0) {
          applySlideTemplate(tempCanvas, importedSlides.length === 0 ? 'cover' : 'content');
        }

        importedSlides.push({
          id: createId('slide'),
          data: serializeCanvas(tempCanvas),
          notes: notesText,
          thumbnail: makeThumbnail(tempCanvas),
        });

        void tempCanvas.dispose();
      }

      if (!importedSlides.length) {
        throw new Error('No slides were imported');
      }

      // The whole deck is replaced, so any unflushed canvas edit is intentionally dropped.
      canvasDirtyRef.current = false;
      commitSlides(() => importedSlides);
      setCurrentSlideId(importedSlides[0].id);
      setMobileWorkspaceView('canvas');
      setBanner({
        tone: 'success',
        title: 'Presentation imported.',
        detail: `${importedSlides.length} slide${importedSlides.length === 1 ? '' : 's'} loaded from PPTX.`,
      });
      scheduleSave();
    } catch (error) {
      console.error('PPTX import error', error);
      setSaveStatus('Import error');
      setBanner({
        tone: 'error',
        title: 'Import failed.',
        detail: 'The PPTX file could not be converted in the browser.',
      });
    }
  };

  const exportPptx = async () => {
    flushActiveSlide(false);
    const exportSlides = slidesRef.current;

    const { default: PptxGenJS } = await import('pptxgenjs');
    const presentation = new PptxGenJS();
    presentation.layout = 'LAYOUT_WIDE';
    presentation.author = 'OfficeNinja';
    presentation.subject = fileName;
    presentation.title = fileName;

    exportSlides.forEach((slideData) => {
      const slide = presentation.addSlide();
      if (slideData.notes?.trim()) {
        slide.addNotes(slideData.notes);
      }

      const objects = slideData.data?.objects ?? [];
      let emitted = 0;

      objects.forEach((object) => {
        const kind = normalizeTypeTag(String(object.type ?? ''));
        const x = ((object.left || 0) / SLIDE_WIDTH) * EXPORT_WIDTH_IN;
        const y = ((object.top || 0) / SLIDE_HEIGHT) * EXPORT_HEIGHT_IN;
        const w = (((object.width || 0) * (object.scaleX || 1)) / SLIDE_WIDTH) * EXPORT_WIDTH_IN;
        const h = (((object.height || 0) * (object.scaleY || 1)) / SLIDE_HEIGHT) * EXPORT_HEIGHT_IN;

        if (TEXT_TYPE_TAGS.has(kind)) {
          slide.addText(object.text || '', {
            x,
            y,
            w: Math.max(MIN_EXPORT_SIZE_IN, w),
            h: Math.max(MIN_EXPORT_SIZE_IN, h),
            fontFace: 'Aptos',
            fontSize: Math.max(14, (object.fontSize || 24) * 0.75),
            color: normalizeColor(object.fill),
            bold: object.fontWeight === '700' || object.fontWeight === 700,
          });
          emitted += 1;
          return;
        }

        if (RECT_TYPE_TAGS.has(kind)) {
          slide.addShape(presentation.ShapeType.roundRect, {
            x,
            y,
            w: Math.max(MIN_EXPORT_SIZE_IN, w),
            h: Math.max(MIN_EXPORT_SIZE_IN, h),
            fill: { color: normalizeColor(object.fill) },
            line: { color: normalizeColor(object.stroke || object.fill) },
          });
          emitted += 1;
          return;
        }

        if (CIRCLE_TYPE_TAGS.has(kind)) {
          slide.addShape(presentation.ShapeType.ellipse, {
            x,
            y,
            w: Math.max(MIN_EXPORT_SIZE_IN, w),
            h: Math.max(MIN_EXPORT_SIZE_IN, h),
            fill: { color: normalizeColor(object.fill) },
            line: { color: normalizeColor(object.stroke || object.fill) },
          });
          emitted += 1;
          return;
        }

        if (IMAGE_TYPE_TAGS.has(kind) && object.src) {
          slide.addImage({
            data: object.src,
            x,
            y,
            w: Math.max(MIN_EXPORT_SIZE_IN, w),
            h: Math.max(MIN_EXPORT_SIZE_IN, h),
          });
          emitted += 1;
        }
      });

      // The fallback keys off what was actually EMITTED, so an unrecognised object type
      // can never produce a silently blank slide again.
      if (emitted === 0) {
        slide.addText('Untitled slide', { x: 1, y: 1, w: EXPORT_WIDTH_IN - 2, h: 1, fontSize: 24, color: '334155' });
      }
    });

    await presentation.writeFile({ fileName: `${fileName}.pptx` });
  };

  // ---- present mode ---------------------------------------------------------------
  const isPresenting = presentIndex !== null;

  useEffect(() => {
    if (!isPresenting || !presentElementRef.current) {
      return;
    }

    const canvas = new fabric.StaticCanvas(presentElementRef.current, {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      backgroundColor: '#ffffff',
    });
    presentCanvasRef.current = canvas;

    const fit = () => {
      const scale = Math.max(
        0.05,
        Math.min(window.innerWidth / SLIDE_WIDTH, (window.innerHeight - 72) / SLIDE_HEIGHT),
      );
      canvas.setDimensions({ width: Math.round(SLIDE_WIDTH * scale), height: Math.round(SLIDE_HEIGHT * scale) });
      canvas.setZoom(scale);
      canvas.renderAll();
    };

    fit();
    window.addEventListener('resize', fit);

    presentRootRef.current?.focus({ preventScroll: true });
    const requestFullscreen = presentRootRef.current?.requestFullscreen?.bind(presentRootRef.current);
    if (requestFullscreen) {
      void requestFullscreen()
        .then(() => {
          enteredFullscreenRef.current = true;
        })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener('resize', fit);
      presentCanvasRef.current = null;
      void canvas.dispose();
    };
  }, [isPresenting]);

  useEffect(() => {
    const canvas = presentCanvasRef.current;
    if (!isPresenting || !canvas || presentIndex === null) {
      return;
    }

    const slide = slidesRef.current[presentIndex];
    let cancelled = false;

    const render = async () => {
      const zoom = canvas.getZoom();

      const paintBlank = () => {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.setZoom(zoom);
        canvas.renderAll();
      };

      try {
        if (slide?.data) {
          await canvas.loadFromJSON(slide.data);
        } else {
          canvas.clear();
        }

        if (cancelled) {
          return;
        }

        canvas.backgroundColor = '#ffffff';
        canvas.setZoom(zoom);
        canvas.renderAll();
        setPresentSlideFailed(false);
      } catch (error) {
        // fabric's loadFromJSON only calls clear() AFTER enliven resolves, so a slide that
        // cannot be rebuilt leaves the PREVIOUS slide on screen: the counter says 2 while
        // the audience is still looking at slide 1. Blank it and say so instead.
        console.error('Slide could not be presented', error);
        if (cancelled) {
          return;
        }

        paintBlank();
        setPresentSlideFailed(true);
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [isPresenting, presentIndex]);

  useEffect(() => {
    if (!isPresenting) {
      return;
    }

    const handlePresentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        stopPresenting();
        return;
      }

      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter'].includes(event.key)) {
        event.preventDefault();
        setPresentIndex((previous) =>
          previous === null ? previous : Math.min(slidesRef.current.length - 1, previous + 1),
        );
        return;
      }

      if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(event.key)) {
        event.preventDefault();
        setPresentIndex((previous) => (previous === null ? previous : Math.max(0, previous - 1)));
      }
    };

    window.addEventListener('keydown', handlePresentKeyDown);
    return () => window.removeEventListener('keydown', handlePresentKeyDown);
  }, [isPresenting, stopPresenting]);

  const hasNotesOnCurrentSlide = Boolean(currentSlide?.notes?.trim());

  /**
   * The rail's width is published as `--notes-rail-w` rather than written straight onto the
   * element, so index.css owns the value the moment it wants to: a `.notes-sidebar { width:
   * var(--notes-rail-w, 288px) }` rule there makes the inline `width` below redundant and it
   * can be deleted in one line. Until that rule exists the property is also consumed here so
   * the rail is actually the width it declares. Nothing is set below the stacking breakpoint
   * — the mobile `width: 100%` stays entirely in CSS, which is where it can respond.
   */
  const notesRailStyle = (desktop: React.CSSProperties): React.CSSProperties => {
    const declared = typeof desktop.width === 'number' ? `${desktop.width}px` : String(desktop.width ?? 'auto');
    const railWidth = { '--notes-rail-w': declared } as React.CSSProperties;

    return isCompactLayout ? railWidth : { ...railWidth, ...desktop, width: 'var(--notes-rail-w)' };
  };

  // The "Deck status" card that used to sit under this one is gone: current slide, selection
  // and autosave were all duplicates of the status bar, restated in a panel that cost the
  // slide 288px of width to display them a second time.
  const notesPanel = (
    <div className="panel-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="panel-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <h3 style={{ margin: 0 }}>Speaker notes</h3>
          {!isCompactLayout && (
            <button
              className="btn btn-secondary btn-icon"
              type="button"
              onClick={() => setIsNotesOpen(false)}
              aria-expanded
              aria-controls={notesSectionId}
              aria-label="Hide speaker notes"
              title="Hide speaker notes"
            >
              <PanelRightClose size={16} />
            </button>
          )}
        </div>
        <textarea
          className="notes-textarea"
          style={{ flex: 1, marginTop: '0.5rem' }}
          value={currentSlide?.notes || ''}
          onChange={(event) => updateNotes(event.target.value)}
          placeholder="Outline talking points, reminders, or handoff notes."
          aria-label="Speaker notes"
        />
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <AppHeader
        appName="NinjaSlides"
        fileName={fileName}
        setFileName={handleFileNameChange}
        defaultFileName={defaultFileName}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        saveStatus={saveStatus}
        actions={
          <>
            <input
              ref={pptImportRef}
              type="file"
              accept=".pptx"
              hidden
              onChange={(event) => {
                setImportCandidate(event.target.files?.[0] ?? null);
                event.target.value = '';
              }}
            />
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
            <button className="btn btn-secondary" onClick={() => pptImportRef.current?.click()} type="button">
              <Upload size={16} />
              Import PPTX
            </button>
            <button className="btn btn-secondary" onClick={exportPptx} type="button">
              <Download size={16} />
              Export PPTX
            </button>
          </>
        }
      />

      <Toolbar>
        <ToolbarGroup label="Slides">
          <ToolbarButton icon={Plus} onClick={() => addSlide('content')} title="New slide" />
          <ToolbarButton icon={Copy} onClick={duplicateSlide} title="Duplicate slide" />
        </ToolbarGroup>

        <ToolbarGroup label="History">
          <ToolbarButton icon={Undo} onClick={() => void undo()} isDisabled={!canUndo} title="Undo" />
          <ToolbarButton icon={Redo} onClick={() => void redo()} isDisabled={!canRedo} title="Redo" />
          {/* Ctrl+S was the only way to force a save, which is unreachable on a
              phone or tablet -- the two surfaces where a user is most likely to
              be interrupted mid-edit. Word and Excel both expose this control. */}
          <ToolbarButton
            icon={Save}
            onClick={() => void performSaveRef.current?.()}
            title="Save now (Ctrl/Cmd+S)"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Insert">
          <ToolbarButton icon={Type} onClick={addText} title="Add text" />
          <ToolbarButton icon={Square} onClick={addRect} title="Add rectangle" />
          <ToolbarButton icon={Circle} onClick={addCircle} title="Add circle" />
          <ToolbarButton icon={ImageIcon} onClick={() => imageInputRef.current?.click()} title="Add image" />
        </ToolbarGroup>

        <ToolbarGroup label="Arrange">
          <ToolbarButton icon={BringToFront} onClick={bringForward} isDisabled={!hasSelection} title="Bring forward" />
          <ToolbarButton icon={SendToBack} onClick={sendBackward} isDisabled={!hasSelection} title="Send backward" />
          <ToolbarButton icon={Trash2} onClick={deleteSelected} isDisabled={!hasSelection} title="Delete selected object" />
        </ToolbarGroup>

        <ToolbarGroup label="Present">
          <div className="toolbar-group-controls">
            <Palette size={16} color={currentColor} />
            <input
              className="slide-color-input"
              type="color"
              value={currentColor}
              onChange={(event) => applyColor(event.target.value)}
              title="Fill color"
              aria-label="Slide object fill color"
            />
          </div>
          <ToolbarButton icon={Play} onClick={startPresenting} title="Start presentation" />
          {/*
            "Presenter view" used to live here. It was not a presenter view: it repainted the
            same single-window editor dark, put a stopwatch in a toolbar and moved the notes
            box next to Previous/Next buttons. No second screen, no next-slide preview, no
            audience/presenter split — nothing a real presenter console gives you, and the
            fullscreen present mode next to it already does the actual presenting. A control
            that promises a second-screen console and delivers a dark theme with a timer is
            worse than no control, so it is gone rather than half-kept.
          */}
        </ToolbarGroup>
      </Toolbar>

      {banner && (
        <div
          className={`editor-banner editor-banner--${banner.tone}`}
          role={banner.tone === 'error' ? 'alert' : 'status'}
          aria-live={banner.tone === 'error' ? 'assertive' : 'polite'}
        >
          <div>
            <div className="editor-banner__text">{banner.title}</div>
            {banner.detail && <div className="editor-banner__hint">{banner.detail}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {banner.action && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const run = banner.action?.onClick;
                  setBanner(null);
                  run?.();
                }}
                type="button"
              >
                {banner.action.label}
              </button>
            )}
            <button className="btn btn-secondary btn-icon" onClick={() => setBanner(null)} type="button" aria-label="Dismiss message">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="workspace-mobile-switcher" role="group" aria-label="Slides mobile sections">
        <button
          className={`workspace-switcher-tab ${mobileWorkspaceView === 'slides' ? 'active' : ''}`}
          onClick={() => setMobileWorkspaceView('slides')}
          type="button"
          aria-controls={slidesSectionId}
          aria-expanded={mobileWorkspaceView === 'slides'}
        >
          Slides
        </button>
        <button
          className={`workspace-switcher-tab ${mobileWorkspaceView === 'canvas' ? 'active' : ''}`}
          onClick={() => setMobileWorkspaceView('canvas')}
          type="button"
          aria-controls={canvasSectionId}
          aria-expanded={mobileWorkspaceView === 'canvas'}
        >
          Canvas
        </button>
        <button
          className={`workspace-switcher-tab ${mobileWorkspaceView === 'notes' ? 'active' : ''}`}
          onClick={() => setMobileWorkspaceView('notes')}
          type="button"
          aria-controls={notesSectionId}
          aria-expanded={mobileWorkspaceView === 'notes'}
        >
          Notes
        </button>
      </div>

      <div className="workspace">
        <aside
          id={slidesSectionId}
          className={`slide-sidebar ${mobileWorkspaceView !== 'slides' ? 'workspace-pane--hidden-mobile' : ''}`}
          aria-label="Slide thumbnails"
          role="region"
        >
          {/*
            No instructional prose. Three lines telling you that clicking a thumbnail opens a
            slide is furniture that never stops being read while it stops being useful after
            the first second; the grip icon carries `title="Drag to reorder"` and the move
            buttons carry theirs, which is where that guidance belongs.
          */}
          <div className="slide-sidebar__header">
            <h3 style={{ margin: 0 }}>Slides</h3>
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => addSlide('content')}
              type="button"
              aria-label="Add slide"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="slide-list" role="list" aria-label="Slides">
            {slides.map((slide, index) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                index={index}
                total={slides.length}
                isActive={slide.id === currentSlideId}
                isDragging={dragSlideIndex === index}
                isDropTarget={dragSlideIndex !== null && dropSlideIndex === index && dropSlideIndex !== dragSlideIndex}
                onSelect={switchSlide}
                onMove={moveSlide}
                onDelete={setPendingDeleteSlideId}
                onReorderPointerDown={handleReorderPointerDown}
                onReorderPointerMove={handleReorderPointerMove}
                onReorderPointerUp={handleReorderPointerUp}
                onReorderPointerCancel={handleReorderPointerCancel}
                registerCard={registerSlideCard}
              />
            ))}
          </div>
        </aside>

        <div
          id={canvasSectionId}
          ref={stageWrapRef}
          className={`presentation-stage ${mobileWorkspaceView !== 'canvas' ? 'workspace-pane--hidden-mobile' : ''}`}
          onClick={() => setMobileWorkspaceView('canvas')}
          role="region"
          aria-label="Slide canvas workspace"
        >
          <div
            className={`canvas-shell ${isDropTargetActive ? 'canvas-shell--drop-target' : ''}`}
            ref={stageRef}
            role="region"
            tabIndex={0}
            aria-label="Slide canvas"
            onKeyDown={handleStageKeyDown}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(event) => void handleDrop(event)}
          >
            {/*
              fabric REPARENTS this canvas into a wrapper div of its own as soon as it
              initialises. If the canvas were a direct child of the shell, React's fiber for
              it would point at a node that is no longer a child here, and rendering any
              sibling before it would make React call insertBefore against a foreign node —
              NotFoundError, and the whole editor unmounts into the error boundary.

              Giving it its own React-owned host div makes that impossible instead of merely
              avoided: fabric only ever moves things INSIDE this div, so every sibling below
              is positioned against nodes React still owns, in any order, forever.
            */}
            <div style={{ display: 'flex', justifyContent: 'center', lineHeight: 0 }}>
              <canvas ref={canvasRef} />
            </div>
            {isDropTargetActive && <div className="canvas-drop-target-hint">Drop an image to add it to this slide.</div>}
            {slideLoadError && (
              <div
                role="alert"
                style={{
                  position: 'absolute',
                  inset: '1rem',
                  zIndex: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textAlign: 'center',
                  padding: '1rem',
                  borderRadius: '1rem',
                  background: 'rgba(15, 23, 42, 0.82)',
                  color: '#f8fafc',
                }}
              >
                <strong>Slide {slideLoadError.index + 1} could not be opened.</strong>
                <span style={{ maxWidth: '32rem', fontSize: '0.9rem' }}>
                  Its stored content could not be rebuilt. This canvas is blank and nothing typed here will be
                  saved, so the rest of the deck stays safe.
                </span>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSlideLoadError(null);
                    renderCurrentSlide(true);
                  }}
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>

        {/*
          Notes stay in the workspace — they are the one thing in this rail that was real
          work rather than a readout — but they no longer hold 288px hostage. Open, the rail
          is 248px and the textarea fills its full height; collapsed, it is a 52px strip that
          still says "Notes" and still flags a slide that has some, so nobody loses track of
          notes they are in the middle of writing. The choice is remembered per browser.
        */}
        {isCompactLayout || isNotesOpen ? (
          <aside
            id={notesSectionId}
            className={`notes-sidebar ${mobileWorkspaceView !== 'notes' ? 'workspace-pane--hidden-mobile' : ''}`}
            style={notesRailStyle({ width: NOTES_PANEL_WIDTH, display: 'flex', flexDirection: 'column' })}
            aria-label="Slide notes"
            onClick={() => setMobileWorkspaceView('notes')}
            role="region"
          >
            {notesPanel}
          </aside>
        ) : (
          <aside
            id={notesSectionId}
            className="notes-sidebar workspace-pane--hidden-mobile"
            style={notesRailStyle({
              width: NOTES_RAIL_WIDTH,
              padding: '0.75rem 0.35rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            })}
            aria-label="Slide notes"
          >
            <button
              className="btn btn-secondary btn-icon"
              type="button"
              onClick={() => setIsNotesOpen(true)}
              aria-expanded={false}
              aria-controls={notesSectionId}
              aria-label={
                hasNotesOnCurrentSlide
                  ? 'Show speaker notes (this slide has notes)'
                  : 'Show speaker notes'
              }
              title="Show speaker notes"
            >
              <StickyNote size={16} />
            </button>
            {hasNotesOnCurrentSlide && (
              <span
                aria-hidden="true"
                style={{
                  width: '0.4rem',
                  height: '0.4rem',
                  borderRadius: '999px',
                  background: 'var(--accent, #2563eb)',
                }}
              />
            )}
            <span
              aria-hidden="true"
              className="panel-note"
              style={{ writingMode: 'vertical-rl', letterSpacing: '0.08em', fontWeight: 600 }}
            >
              Notes
            </span>
          </aside>
        )}
      </div>

      <StatusBar
        leftContent={<span>Slide {slideCountLabel} | {saveSummary}</span>}
        rightContent={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            {oversizeForBackup !== null && (
              <span
                role="status"
                title={`This deck is ${Math.round(oversizeForBackup / 1024)}KB, over the ${Math.round(
                  BACKUP_SIZE_LIMIT_BYTES / 1024,
                )}KB emergency-snapshot limit. Autosave still runs every ${SAVE_DEBOUNCE_MS}ms, but an edit made in the last moment before a crash or tab close cannot be recovered. Press Ctrl+S before closing, or export to PPTX.`}
                // This chip is the only durable signal that data loss is possible, so its
                // contrast is picked per theme rather than inherited: the single amber that
                // passed on the light status bar measured 3.3:1 on the dark one.
                // Measured here: 6.1:1 light (#92400e) and 9.8:1 dark (#fcd34d), both AA at
                // any size, against the chip's own translucent background.
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '999px',
                  border: `1px solid ${isDarkMode ? 'rgba(252, 211, 77, 0.55)' : 'rgba(146, 64, 14, 0.45)'}`,
                  background: isDarkMode ? 'rgba(217, 119, 6, 0.22)' : 'rgba(217, 119, 6, 0.14)',
                  color: isDarkMode ? '#fcd34d' : '#92400e',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={13} aria-hidden="true" />
                No crash recovery ({Math.round(oversizeForBackup / 1024)}KB)
              </span>
            )}
            {/*
              The third line of the deleted "Deck status" card. Rendered only when something
              IS selected: "Nothing selected" is the resting state of every editor and said
              nothing, while an appearing chip inside the status bar's live region announces
              the selection to a screen reader at the moment it happens. Slide position and
              autosave are already on the left of this bar, which is why the card went.
            */}
            {hasSelection && <span>Object selected</span>}
            <span>{isPresenting ? 'Presenting' : isFullscreen ? 'Fullscreen presentation' : 'Editing canvas'}</span>
          </span>
        }
      />

      {isPresenting && presentIndex !== null && (
        <div
          ref={presentRootRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Presenting slide ${presentIndex + 1} of ${slides.length}`}
          tabIndex={-1}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            outline: 'none',
          }}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('button')) {
              return;
            }

            setPresentIndex((previous) =>
              previous === null ? previous : Math.min(slidesRef.current.length - 1, previous + 1),
            );
          }}
        >
          <div style={{ position: 'relative', display: 'flex' }}>
            <canvas ref={presentElementRef} style={{ display: 'block', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }} />
            {presentSlideFailed && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#64748b',
                  font: '600 1.1rem/1.5 Aptos, Segoe UI, sans-serif',
                }}
              >
                Slide {presentIndex + 1} is unavailable.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', fontSize: '0.85rem' }}>
            <button
              type="button"
              style={{ ...slideActionButtonStyle, width: 'auto', padding: '0 0.7rem', color: '#e2e8f0' }}
              onClick={() => setPresentIndex((previous) => (previous === null ? previous : Math.max(0, previous - 1)))}
              disabled={presentIndex === 0}
              aria-label="Previous slide"
            >
              Prev
            </button>
            <span data-testid="present-counter">
              {presentIndex + 1} / {slides.length}
            </span>
            <button
              type="button"
              style={{ ...slideActionButtonStyle, width: 'auto', padding: '0 0.7rem', color: '#e2e8f0' }}
              onClick={() =>
                setPresentIndex((previous) =>
                  previous === null ? previous : Math.min(slidesRef.current.length - 1, previous + 1),
                )
              }
              disabled={presentIndex === slides.length - 1}
              aria-label="Next slide"
            >
              Next
            </button>
            <button
              type="button"
              style={{ ...slideActionButtonStyle, width: 'auto', padding: '0 0.7rem', color: '#e2e8f0' }}
              onClick={stopPresenting}
              aria-label="Exit presentation"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteSlideId)}
        title="Delete slide?"
        description="This slide will be removed from the presentation. The remaining deck stays intact."
        confirmLabel="Delete slide"
        tone="danger"
        onConfirm={deleteSlide}
        onClose={() => setPendingDeleteSlideId(null)}
      />

      <ConfirmDialog
        open={Boolean(importCandidate)}
        title="Replace this presentation?"
        description="Importing a PPTX will replace the slides currently open in this deck."
        confirmLabel="Import presentation"
        // Discarding the open deck is destructive, so the dialog must not put
        // initial focus on the confirm button -- a stray Enter carried over from
        // the keypress that opened it would otherwise wipe every slide.
        tone="danger"
        onConfirm={() => {
          if (importCandidate) {
            void importPptxFile(importCandidate);
          }
          setImportCandidate(null);
        }}
        onClose={() => setImportCandidate(null)}
      />
    </div>
  );
}
