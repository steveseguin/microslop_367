import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import type { JSONContent, Node as TiptapNode } from '@tiptap/core';
import { Extension } from '@tiptap/core';
// Type-only import: registers the `setImage` command augmentation that
// `tiptap-extension-resize-image` inherits but does not re-declare.
import type { ImageOptions } from '@tiptap/extension-image';
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { Table as TableExtension } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns3,
  Download,
  Heading1,
  Heading2,
  Image as ImageIcon,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Mic,
  Redo,
  RotateCcw,
  Rows3,
  Save,
  Search,
  Square,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import ImageResizeExtension from 'tiptap-extension-resize-image';
import { AppHeader } from '../components/AppHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBar } from '../components/StatusBar';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../components/Toolbar';
import {
  DocumentReadError,
  getCurrentClientId,
  loadDocument,
  retryStorageConnection,
  saveDocument,
  saveDocumentBackupNow,
  subscribeToDocument,
} from '../utils/db';

interface WordProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

type BannerTone = 'success' | 'warning' | 'error';

interface BannerAction {
  label: string;
  onClick: () => void;
  isPrimary?: boolean;
}

interface BannerState {
  tone: BannerTone;
  title: string;
  detail?: string;
  actions?: BannerAction[];
}

/**
 * `tiptap-extension-resize-image` ships types that drop everything it inherits
 * from `@tiptap/extension-image` (including `allowBase64`), so restore them.
 */
const ImageResize = ImageResizeExtension as unknown as TiptapNode<ImageOptions & { inline: boolean }>;

/** Minimal Web Speech typings — not part of the TypeScript DOM lib. */
interface SpeechRecognitionLikeEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionLikeEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

/** `db.ts` is gaining a `'failed'` status; widen locally so we can react to it today. */
type SaveResultStatus = 'saved' | 'conflict' | 'failed';

interface FindMatch {
  from: number;
  to: number;
}

interface FindHighlightState {
  matches: FindMatch[];
  active: number;
}

interface DocumentStats {
  words: number;
  characters: number;
  paragraphs: number;
}

interface RichTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface RichTextNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: RichTextMark[];
  content?: RichTextNode[];
}

type DocxModule = typeof import('docx');
type DocxParagraph = InstanceType<DocxModule['Paragraph']>;
type DocxTable = InstanceType<DocxModule['Table']>;
type DocxTextRun = InstanceType<DocxModule['TextRun']>;
type DocxHyperlink = InstanceType<DocxModule['ExternalHyperlink']>;
type DocxInline = DocxTextRun | DocxHyperlink;
type DocxBlock = DocxParagraph | DocxTable;

const DEFAULT_FILE_NAME = 'Untitled Document';
const MAX_IMPORT_FILE_BYTES = 20 * 1024 * 1024;
const MAX_EMBEDDED_IMAGE_BYTES = 6 * 1024 * 1024;
const AUTOSAVE_DEBOUNCE_MS = 600;
const STATS_REFRESH_MS = 150;
const FIND_REFRESH_MS = 150;
/**
 * Upper bound on decorations built per redraw. The counter still reports every match;
 * only the yellow highlighting is windowed, because a DecorationSet of several thousand
 * inline decorations costs hundreds of milliseconds to rebuild on every keystroke.
 */
const MAX_HIGHLIGHTED_MATCHES = 250;

/** AppHeader has no read-only mode, so a no-op setter freezes its controlled input. */
const noopSetFileName = () => {};

/** Placeholder used so leaf nodes (images, breaks) occupy exactly one search offset. */
const LEAF_PLACEHOLDER = '￼';
/** Node names that carry an image `src`; `tiptap-extension-resize-image` renames the node. */
const IMAGE_NODE_TYPES = new Set(['image', 'imageResize']);

const FONT_FAMILY_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Calibri', value: 'Calibri, Candara, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
];

const FONT_SIZE_OPTIONS = ['', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'];

/* ------------------------------------------------------------------ */
/* Find & replace highlighting                                         */
/* ------------------------------------------------------------------ */

const findHighlightKey = new PluginKey<FindHighlightState>('wordFindHighlight');

const FindHighlight = Extension.create({
  name: 'wordFindHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin<FindHighlightState>({
        key: findHighlightKey,
        state: {
          init: () => ({ matches: [], active: -1 }),
          apply(transaction, value) {
            const meta = transaction.getMeta(findHighlightKey) as FindHighlightState | undefined;
            if (meta) {
              return meta;
            }

            if (transaction.docChanged) {
              return { matches: [], active: -1 };
            }

            return value;
          },
        },
        props: {
          decorations(state) {
            const value = findHighlightKey.getState(state);
            if (!value || value.matches.length === 0) {
              return DecorationSet.empty;
            }

            const limit = state.doc.content.size;
            const total = value.matches.length;
            // Window the highlights around the active match so a document with thousands
            // of hits does not rebuild thousands of decorations on every keystroke.
            let first = 0;
            if (total > MAX_HIGHLIGHTED_MATCHES) {
              const anchor = value.active < 0 ? 0 : value.active;
              first = Math.max(0, Math.min(anchor - Math.floor(MAX_HIGHLIGHTED_MATCHES / 2), total - MAX_HIGHLIGHTED_MATCHES));
            }
            const last = Math.min(total, first + MAX_HIGHLIGHTED_MATCHES);

            const decorations: Decoration[] = [];
            const decorate = (index: number) => {
              const match = value.matches[index];
              if (!match || match.from < 0 || match.to > limit || match.to <= match.from) {
                return;
              }

              decorations.push(
                Decoration.inline(match.from, match.to, {
                  style:
                    index === value.active
                      ? 'background-color:#f97316;color:#0b1220;border-radius:2px;'
                      : 'background-color:rgba(250,204,21,0.5);border-radius:2px;',
                }),
              );
            };

            for (let index = first; index < last; index += 1) {
              decorate(index);
            }

            // The active match must always be visible even if it fell outside the window.
            if (value.active >= 0 && (value.active < first || value.active >= last)) {
              decorate(value.active);
            }

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

/**
 * Lowercase `raw` while recording, for every character of the result, the index of the
 * source character it came from. Needed because a few characters lowercase to more than
 * one code unit (`İ` -> `i` + U+0307), which would otherwise desynchronise offsets.
 *
 * This is simple lowercase mapping, not full Unicode case folding: `ß` and `ss` are still
 * treated as different, as are `ﬁ` and `fi`.
 */
function foldWithOffsets(raw: string) {
  let text = '';
  const offsets: number[] = [];

  for (let index = 0; index < raw.length; index += 1) {
    const lowered = raw[index].toLowerCase();
    for (let inner = 0; inner < lowered.length; inner += 1) {
      text += lowered[inner];
      offsets.push(index);
    }
  }

  return { text, offsets };
}

/**
 * Collect every match against the *current* document.
 *
 * Offsets are taken per text block using `textBetween` with a single-character
 * placeholder for leaf nodes, so the string index maps 1:1 onto ProseMirror
 * positions even when the block contains images, hard breaks or several
 * differently-marked text nodes.
 *
 * Matching is per text block (a phrase spanning two paragraphs will not match) and
 * case-insensitive matching uses simple lowercase mapping, not full Unicode case
 * folding — searching `ss` does not find `ß`/`ẞ`.
 */
function findMatches(doc: ProseMirrorNode, query: string, matchCase: boolean): FindMatch[] {
  const results: FindMatch[] = [];
  if (!query) {
    return results;
  }

  const needle = matchCase ? query : query.toLowerCase();
  doc.descendants((node, position) => {
    if (!node.isTextblock) {
      return true;
    }

    const raw = node.textBetween(0, node.content.size, undefined, LEAF_PLACEHOLDER);
    const start = position + 1;
    const folded = matchCase ? raw : raw.toLowerCase();

    if (folded.length === raw.length) {
      let index = folded.indexOf(needle);
      while (index !== -1) {
        results.push({ from: start + index, to: start + index + query.length });
        index = folded.indexOf(needle, index + needle.length);
      }

      return false;
    }

    // Lowercasing changed the string length (e.g. `İ` -> `i` + U+0307). Rebuild the
    // folded string alongside an index map so matches still resolve to real positions.
    const { text: mapped, offsets } = foldWithOffsets(raw);
    let index = mapped.indexOf(needle);
    while (index !== -1) {
      const from = start + offsets[index];
      // End from the LAST code unit the match covers, not the one after it. Using the
      // following code unit collapses to `from` when a match ends inside a multi-unit
      // expansion (`İ` -> `i` + U+0307), which produced zero-width phantom matches that
      // the counter reported but nothing could select or replace. Ending here also spans
      // the whole source character, which is what browser find does.
      const to = start + offsets[index + needle.length - 1] + 1;
      // Two consecutive folded matches can map onto OVERLAPPING source ranges when one
      // ends mid-expansion and the next begins inside that same expansion (e.g. `AİİİB`
      // searched for U+0307 + `i`). `applyReplacements` walks its ranges in descending
      // order assuming they are disjoint, so an overlap silently destroys the characters
      // between them. Matches are non-overlapping in the source, by definition.
      if (to > from && (results.length === 0 || from >= results[results.length - 1].to)) {
        results.push({ from, to });
      }
      index = mapped.indexOf(needle, index + needle.length);
    }

    return false;
  });

  return results;
}

function computeStats(doc: ProseMirrorNode | null): DocumentStats {
  if (!doc) {
    return { words: 0, characters: 0, paragraphs: 0 };
  }

  let words = 0;
  let characters = 0;
  let paragraphs = 0;

  doc.descendants((node) => {
    if (!node.isTextblock) {
      return true;
    }

    const text = node.textBetween(0, node.content.size, ' ', ' ').trim();
    if (text) {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        paragraphs += 1;
      }

      words += text.split(/\s+/).filter(Boolean).length;
      characters += text.replace(/\s/g, '').length;
    }

    return false;
  });

  return { words, characters, paragraphs };
}

const COUNT_FORMATTER = new Intl.NumberFormat();

/** `1,204 words` / `1 word` — the status bar's only presentation of `computeStats`. */
function formatCount(value: number, noun: string) {
  return `${COUNT_FORMATTER.format(value)} ${value === 1 ? noun : `${noun}s`}`;
}

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

function triggerDownload(blob: Blob, nextFileName: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = nextFileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('File could not be read'));
    reader.readAsDataURL(blob);
  });
}

function getImageMimeType(source: string, currentMimeType: string) {
  if (currentMimeType.startsWith('image/')) {
    return currentMimeType;
  }

  const normalizedSource = source.toLowerCase().split(/[?#]/, 1)[0];
  if (normalizedSource.endsWith('.png')) {
    return 'image/png';
  }
  if (normalizedSource.endsWith('.jpg') || normalizedSource.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (normalizedSource.endsWith('.gif')) {
    return 'image/gif';
  }
  if (normalizedSource.endsWith('.webp')) {
    return 'image/webp';
  }
  if (normalizedSource.endsWith('.bmp')) {
    return 'image/bmp';
  }
  if (normalizedSource.endsWith('.svg')) {
    return 'image/svg+xml';
  }

  return currentMimeType;
}

function prepareEmbeddableImageBlob(blob: Blob, source: string) {
  const mimeType = getImageMimeType(source, blob.type);
  const normalizedBlob = mimeType && mimeType !== blob.type ? blob.slice(0, blob.size, mimeType) : blob;

  if (normalizedBlob.type && !normalizedBlob.type.startsWith('image/')) {
    throw new Error('The selected asset is not a supported image file');
  }

  if (normalizedBlob.size > MAX_EMBEDDED_IMAGE_BYTES) {
    throw new Error(`Images larger than ${formatFileSize(MAX_EMBEDDED_IMAGE_BYTES)} cannot be embedded locally yet`);
  }

  return normalizedBlob;
}

async function loadImageBinary(source: string) {
  const response = await fetch(source);
  if (!source.startsWith('data:') && !response.ok) {
    throw new Error(`Image request failed with ${response.status}`);
  }

  return response.arrayBuffer();
}

function inferDocxImageType(source: string, data: ArrayBuffer): 'png' | 'jpg' | 'gif' | 'bmp' {
  const mimeMatch = source.match(/^data:image\/([a-zA-Z0-9.+-]+);/);
  const extensionMatch = source.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  const hint = (mimeMatch?.[1] ?? extensionMatch?.[1] ?? '').toLowerCase();

  if (hint === 'jpeg' || hint === 'jpg') {
    return 'jpg';
  }
  if (hint === 'gif') {
    return 'gif';
  }
  if (hint === 'bmp') {
    return 'bmp';
  }
  if (hint === 'png') {
    return 'png';
  }

  const bytes = new Uint8Array(data);
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'bmp';
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'gif';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg';
  }

  return 'png';
}

function validateRemoteImage(source: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = source;
  });
}

function dataTransferHasImageFile(dataTransfer: DataTransfer) {
  return [...dataTransfer.items].some((item) => item.kind === 'file' && item.type.startsWith('image/'));
}

function readPixelAttribute(node: RichTextNode, key: 'width' | 'height') {
  const direct = Number(node.attrs?.[key]);
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }

  const containerStyle = typeof node.attrs?.containerStyle === 'string' ? node.attrs.containerStyle : '';
  const match = containerStyle.match(new RegExp(`${key}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`));
  return match ? Number(match[1]) : 0;
}

function getMarkAttribute(child: RichTextNode, markType: string, attribute: string) {
  const mark = child.marks?.find((entry) => entry.type === markType);
  const value = mark?.attrs?.[attribute];
  return typeof value === 'string' ? value : undefined;
}

/** `18px` / `13.5pt` -> docx half-points. */
function toHalfPoints(fontSize: string | undefined) {
  if (!fontSize) {
    return undefined;
  }

  const match = fontSize.match(/^(\d+(?:\.\d+)?)(px|pt|em|rem)?$/);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  const unit = match[2] ?? 'px';
  const points = unit === 'pt' ? value : unit === 'px' ? value * 0.75 : value * 12;
  return Math.max(2, Math.round(points * 2));
}

function toDocxColor(color: string | undefined) {
  if (!color) {
    return undefined;
  }

  const hex = color.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hex) {
    const digits = hex[1];
    return digits.length === 3
      ? digits
          .split('')
          .map((character) => character + character)
          .join('')
          .toUpperCase()
      : digits.toUpperCase();
  }

  const rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    return [rgb[1], rgb[2], rgb[3]]
      .map((part) => Number(part).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  return undefined;
}

/** Only schemes Word treats as a navigable link; anything else is exported as plain text. */
function toSafeHref(href: string | undefined) {
  if (!href) {
    return undefined;
  }

  const trimmed = href.trim();
  return /^(https?:|mailto:|tel:)/i.test(trimmed) ? trimmed : undefined;
}

function toDocxFontName(fontFamily: string | undefined) {
  if (!fontFamily) {
    return undefined;
  }

  return fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '') || undefined;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * A document whose stored content this editor cannot parse is locked read-only. The
 * banner is the only way out, so both escape routes ride on every version of it —
 * using one must not remove the other.
 */
function buildUnreadableBanner(
  detail: string,
  tone: BannerTone,
  onDownload: () => void,
  onDiscard: () => void,
): BannerState {
  return {
    tone,
    title:
      tone === 'success'
        ? 'Raw stored copy downloaded.'
        : 'This document could not be opened and has been left untouched.',
    detail,
    actions: [
      { label: 'Download the raw stored copy', onClick: onDownload, isPrimary: tone !== 'success' },
      { label: 'Discard it and start fresh', onClick: onDiscard },
    ],
  };
}

/**
 * A document whose stored copy could not be READ at all — distinct from one that was read
 * and could not be parsed. There is no payload to hand back here, so the escape routes are
 * different: retry (the likeliest cause is a transient IndexedDB open timeout) or open a
 * DIFFERENT document, which is the only way to start typing without putting the stored
 * record at risk. "Discard and start fresh" is deliberately NOT offered: it would mean
 * overwriting a document nobody has managed to look at.
 */
function buildUnopenableBanner(detail: string | null, onRetry: () => void, onNewDocument: () => void): BannerState {
  return {
    tone: 'error',
    title: 'This document could not be opened. Your saved copy has NOT been changed.',
    detail:
      'Browser storage did not answer, so the editor does not know what this document contains. Saving is disabled — nothing you type here can overwrite it. This is usually temporary.' +
      (detail ? ` (${detail})` : ''),
    actions: [
      { label: 'Try again', onClick: onRetry, isPrimary: true },
      { label: 'Start a new document instead', onClick: onNewDocument },
    ],
  };
}

export default function Word({ toggleTheme, isDarkMode }: WordProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFileName = DEFAULT_FILE_NAME;
  const [docId] = useState(() => searchParams.get('id') || `word-${Date.now()}`);
  const [fileName, setFileName] = useState(defaultFileName);
  const [documentRevision, setDocumentRevision] = useState(0);
  const [isDictating, setIsDictating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Loading...');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isContentUnreadable, setIsContentUnreadable] = useState(false);
  // Set only when the STORED COPY COULD NOT BE READ (as opposed to read-but-unparseable).
  // While true there is no payload to download and nothing may be written.
  const [isDocumentUnopenable, setIsDocumentUnopenable] = useState(false);
  // Bumped by "Try again"; re-arms the load effect.
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matches, setMatches] = useState<FindMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1);
  const [imageUrl, setImageUrl] = useState('');
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);
  const [isImagePanelDropTargetActive, setIsImagePanelDropTargetActive] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statsDoc, setStatsDoc] = useState<ProseMirrorNode | null>(null);
  const [contentToken, setContentToken] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const previousFileNameRef = useRef(fileName);

  const editorRef = useRef<Editor | null>(null);
  const fileNameRef = useRef(fileName);
  const revisionRef = useRef(documentRevision);
  const saveTimerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const autosaveBlockedRef = useRef(false);
  const contentErrorRef = useRef<string | null>(null);
  const flushSaveRef = useRef<(() => void) | null>(null);
  const flushBeforeUnloadRef = useRef<(() => void) | null>(null);
  const saveNowRef = useRef<(() => void) | null>(null);
  const forceSaveRef = useRef<(() => void) | null>(null);
  const storedPayloadRef = useRef<{ title: string; revision: number; data: unknown } | null>(null);
  const downloadStoredCopyRef = useRef<(() => void) | null>(null);
  const discardStoredCopyRef = useRef<(() => void) | null>(null);
  const unreadableBannerRef = useRef((detail: string, tone: BannerTone = 'error') =>
    buildUnreadableBanner(
      detail,
      tone,
      () => downloadStoredCopyRef.current?.(),
      () => discardStoredCopyRef.current?.(),
    ),
  );
  const retryOpenRef = useRef<(() => void) | null>(null);
  const startNewDocumentRef = useRef<(() => void) | null>(null);
  const unopenableBannerRef = useRef((detail: string | null) =>
    buildUnopenableBanner(
      detail,
      () => retryOpenRef.current?.(),
      () => startNewDocumentRef.current?.(),
    ),
  );

  useEffect(() => {
    if (!searchParams.get('id')) {
      setSearchParams({ id: docId }, { replace: true });
    }
  }, [docId, searchParams, setSearchParams]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      // `allowBase64` is required or every data-URI image (including everything
      // mammoth produces on DOCX import) is silently dropped by the HTML parser.
      ImageResize.configure({ allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      FindHighlight,
    ],
    // NOTE: `enableContentCheck` is deliberately NOT set globally. It would apply to
    // every `setContent`, and mammoth's DOCX output routinely contains constructs this
    // schema cannot represent (tables it renders slightly differently, `<div>` wrappers,
    // `<font>`, `<dl>`, checkbox lists), which would turn a lossy-but-useful import into
    // a hard refusal. Only the load-from-storage path passes `errorOnInvalidContent`.
    onContentError: ({ error }) => {
      contentErrorRef.current = error.message;
    },
    // A new document starts empty. The previous seed ("Project Brief", plus a tip about
    // opening the ribbon on mobile) was instructional copy dressed as the user's own
    // content: it counted towards the word count, exported into their .docx, and had to
    // be selected and deleted before they could start writing.
    content: '',
  });

  editorRef.current = editor;

  /* ---------------- persistence ---------------- */

  const commitSave = useCallback(async () => {
    const activeEditor = editorRef.current;
    if (!activeEditor || autosaveBlockedRef.current) {
      return;
    }

    dirtyRef.current = false;
    const payload = activeEditor.getJSON();
    // db.ts cannot load a record with a falsy title, so never persist an empty name.
    const title = fileNameRef.current.trim() || DEFAULT_FILE_NAME;
    setSaveStatus('Saving...');

    try {
      const result = await saveDocument(docId, title, 'word', payload, { knownRevision: revisionRef.current });
      const status = result.status as SaveResultStatus;

      if (status === 'conflict') {
        // Deliberately do NOT adopt the remote revision: doing so would make the
        // next autosave overwrite the other tab without another conflict check.
        dirtyRef.current = true;
        setSaveStatus('Conflict detected');
        setBanner({
          tone: 'warning',
          title: 'A newer version was saved in another tab.',
          detail: `Nothing was overwritten. Reload to review the newer version (revision ${result.record.revision}), or overwrite it with what is on screen here.`,
          actions: [
            { label: 'Overwrite with this version', onClick: () => forceSaveRef.current?.(), isPrimary: true },
            { label: 'Reload and discard mine', onClick: () => window.location.reload() },
          ],
        });
        return;
      }

      // Reserved: `saveDocument` now throws on total failure (handled below), but
      // keep this branch as defence in depth in case the status is ever returned.
      if (status === 'failed') {
        dirtyRef.current = true;
        setSaveStatus('Save failed');
        setBanner({
          tone: 'error',
          title: 'Your changes could not be saved.',
          detail: 'Local storage rejected the write. The document is still in the editor — try again or export a copy now.',
        });
        return;
      }

      revisionRef.current = result.record.revision;
      setDocumentRevision(result.record.revision);
      setLastSavedAt(result.record.updatedAt);
      setSaveStatus(dirtyRef.current ? 'Unsaved changes' : 'Saved');
    } catch (error) {
      // `saveDocument` throws when nothing could be persisted at all. Stay dirty and
      // never report success. This function never rejects, so the unload-time flush
      // cannot produce an unhandled rejection either.
      console.error('Failed to save document', error);
      dirtyRef.current = true;
      setSaveStatus('Save failed');
      setBanner({
        tone: 'error',
        title: 'Your changes could not be saved.',
        detail: 'Your latest changes are still in the editor, but they could not be written locally.',
      });
    }
  }, [docId]);

  const runSave = useCallback(() => {
    saveChainRef.current = saveChainRef.current.then(commitSave, commitSave);
    return saveChainRef.current;
  }, [commitSave]);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const queueSave = useCallback(() => {
    if (autosaveBlockedRef.current) {
      return;
    }

    dirtyRef.current = true;
    setSaveStatus('Saving...');
    clearSaveTimer();
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void runSave();
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [clearSaveTimer, runSave]);

  /** Flush (never cancel) a pending autosave while the page is still alive. */
  const flushSave = useCallback(() => {
    clearSaveTimer();
    if (!dirtyRef.current || autosaveBlockedRef.current) {
      return;
    }

    void runSave();
  }, [clearSaveTimer, runSave]);

  /**
   * Unload path. `saveDocument` is useless here: it awaits `getDB()` before it touches
   * anything, so the page dies during the first await and nothing lands. `db.ts` exposes
   * `saveDocumentBackupNow` for exactly this — one `JSON.stringify` + `localStorage.setItem`,
   * no awaits, so it completes inside the handler's synchronous execution. The next
   * `loadDocument` promotes that snapshot. We still kick off the real save afterwards, since
   * `visibilitychange` usually does not end the page.
   */
  const flushSaveBeforeUnload = useCallback(() => {
    clearSaveTimer();
    const activeEditor = editorRef.current;
    if (!dirtyRef.current || autosaveBlockedRef.current || !activeEditor) {
      return;
    }

    // Synchronous. Never awaited, and never `saveDocument` — that awaits `getDB()` and
    // the page dies before anything lands. Title/content come from refs so the value is
    // current rather than whatever the closure captured. `knownRevision` feeds the
    // revision floor; without it the snapshot is discarded on the next load. It returns
    // false when storage is blocked or the payload is too large (~1.5MB), and there is
    // nothing an unload handler can do about that, so the result is not inspected.
    saveDocumentBackupNow(
      docId,
      fileNameRef.current.trim() || DEFAULT_FILE_NAME,
      'word',
      activeEditor.getJSON(),
      { knownRevision: revisionRef.current },
    );

    // In addition to, never instead of, the real save: `visibilitychange` usually does
    // not end the page, and the snapshot is not a save (no IndexedDB, no conflict check).
    void runSave();
  }, [clearSaveTimer, docId, runSave]);

  const saveNow = useCallback(() => {
    if (autosaveBlockedRef.current) {
      // Re-assert the lock banner rather than replacing it: it carries the only escape
      // routes (retry / open a different document), and Ctrl+S must not strip them.
      setBanner((current) =>
        current?.actions?.length
          ? current
          : {
              tone: 'error',
              title: 'Saving is disabled for this document.',
              detail: 'The stored copy could not be opened, so writing would destroy it.',
            },
      );
      return;
    }

    clearSaveTimer();
    dirtyRef.current = true;
    void runSave();
  }, [clearSaveTimer, runSave]);

  /**
   * Resolve a conflict in this tab's favour. Omitting `knownRevision` skips db.ts's
   * conflict check entirely, which is the only way out of an otherwise permanent
   * conflict loop (a normal retry re-sends the same stale revision and conflicts again).
   */
  const forceSave = useCallback(async () => {
    const activeEditor = editorRef.current;
    if (!activeEditor || autosaveBlockedRef.current) {
      return;
    }

    clearSaveTimer();
    setSaveStatus('Saving...');

    try {
      const result = await saveDocument(
        docId,
        fileNameRef.current.trim() || DEFAULT_FILE_NAME,
        'word',
        activeEditor.getJSON(),
        {},
      );
      dirtyRef.current = false;
      revisionRef.current = result.record.revision;
      setDocumentRevision(result.record.revision);
      setLastSavedAt(result.record.updatedAt);
      setSaveStatus('Saved');
      setBanner({
        tone: 'success',
        title: 'This version is now the saved one.',
        detail: `Revision ${result.record.revision} replaced the version written by the other tab.`,
      });
    } catch (error) {
      console.error('Force save failed', error);
      dirtyRef.current = true;
      setSaveStatus('Save failed');
      setBanner({
        tone: 'error',
        title: 'Your changes could not be saved.',
        detail: 'Local storage refused the write. Export a copy now so the work is not lost.',
      });
    }
  }, [clearSaveTimer, docId]);

  flushSaveRef.current = flushSave;
  flushBeforeUnloadRef.current = flushSaveBeforeUnload;
  saveNowRef.current = saveNow;
  forceSaveRef.current = () => void forceSave();

  useEffect(() => {
    fileNameRef.current = fileName;
  }, [fileName]);

  useEffect(() => {
    if (!editor || isLoaded || isContentUnreadable) {
      return;
    }

    let cancelled = false;

    loadDocument<string | JSONContent>(docId)
      .then((doc) => {
        if (cancelled) {
          return;
        }

        if (doc && doc.type === 'word') {
          contentErrorRef.current = null;
          let applied = false;
          try {
            applied = editor.commands.setContent(doc.data, { errorOnInvalidContent: true, emitUpdate: false });
          } catch (error) {
            contentErrorRef.current = error instanceof Error ? error.message : String(error);
            applied = false;
          }

          if (!applied) {
            // W2: TipTap fails soft here and leaves the editor blank. Entering the
            // autosave loop would write that blank document over the stored one.
            autosaveBlockedRef.current = true;
            storedPayloadRef.current = doc;
            setIsContentUnreadable(true);
            setSaveStatus('Read-only');
            editor.setEditable(false);
            // Show the real title so the user can tell which document is locked. The
            // field is frozen while `isContentUnreadable`, and autosave is blocked.
            setFileName(doc.title);
            fileNameRef.current = doc.title;
            previousFileNameRef.current = doc.title;
            revisionRef.current = doc.revision;
            setDocumentRevision(doc.revision);
            setBanner(
              unreadableBannerRef.current(
                `Saving and export are disabled so the stored copy is not overwritten. ${contentErrorRef.current ?? 'The stored content is not valid for this editor.'}`,
              ),
            );
            return;
          }

          setFileName(doc.title);
          fileNameRef.current = doc.title;
          previousFileNameRef.current = doc.title;
          setLastSavedAt(doc.updatedAt);
          setDocumentRevision(doc.revision);
          revisionRef.current = doc.revision;
          setSaveStatus('Saved');
          setContentToken((value) => value + 1);

          if (doc.source === 'backup') {
            setBanner({
              tone: 'warning',
              title: 'Recovered the latest local backup.',
              detail: 'This document was restored from the browser backup cache after a storage mismatch.',
            });
          }
        } else {
          previousFileNameRef.current = defaultFileName;
          setSaveStatus('Not saved yet');
        }

        setIsLoaded(true);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        /*
         * The stored copy could NOT be read. Previously this opened "a fresh document
         * instead" and entered the autosave loop, so the first keystroke wrote an empty
         * document over a record nobody had managed to look at — silently, with the pill
         * reading "Saved". db.ts's conflict check cannot catch it: a tab reloading a
         * document it saved itself keeps the same client id, which disables half of
         * `isConflict`.
         *
         * Every failure is treated as unreadable, including an unexpected one: "the load
         * threw" and "the load could not read" are the same thing from here, and guessing
         * the difference is how the empty document got written in the first place.
         */
        console.error('Failed to load document', error);
        autosaveBlockedRef.current = true;
        storedPayloadRef.current = null;
        setIsDocumentUnopenable(true);
        setIsContentUnreadable(true);
        // Contains "read-only" so AppHeader paints the pill as a danger state.
        setSaveStatus('Read-only: could not open');
        editor.setEditable(false);
        setBanner(
          unopenableBannerRef.current(error instanceof DocumentReadError ? error.detail : null),
        );
        // `isLoaded` deliberately stays false: it gates autosave registration, so the
        // block is enforced twice over.
      });

    return () => {
      cancelled = true;
    };
  }, [defaultFileName, docId, editor, isContentUnreadable, isLoaded, loadAttempt]);

  // Autosave registration no longer depends on `fileName`/`documentRevision`, so a
  // rename or a revision bump can never clear a pending timer and drop the edit.
  useEffect(() => {
    if (!editor || !isLoaded || isContentUnreadable) {
      return;
    }

    editor.on('update', queueSave);
    return () => {
      editor.off('update', queueSave);
    };
  }, [editor, isContentUnreadable, isLoaded, queueSave]);

  useEffect(() => {
    if (!isLoaded || isContentUnreadable) {
      return;
    }

    if (previousFileNameRef.current === fileName) {
      return;
    }

    previousFileNameRef.current = fileName;
    queueSave();
  }, [fileName, isContentUnreadable, isLoaded, queueSave]);

  // Flush on unmount and on every path the browser gives us before teardown.
  useEffect(() => {
    const flushForUnload = () => flushBeforeUnloadRef.current?.();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushForUnload();
      }
    };

    window.addEventListener('pagehide', flushForUnload);
    window.addEventListener('beforeunload', flushForUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pagehide', flushForUnload);
      window.removeEventListener('beforeunload', flushForUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      // In-app unmount (route change): the page survives, so a normal save is enough.
      flushSaveRef.current?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    return subscribeToDocument(docId, (event) => {
      if (event.lastSavedBy === getCurrentClientId() || event.revision <= revisionRef.current) {
        return;
      }

      setBanner({
        tone: 'warning',
        title: 'A newer version is available from another tab.',
        detail: 'Reload this document if you want the latest saved version from that session.',
      });
    });
  }, [docId, isLoaded]);

  /* ---------------- statistics ---------------- */

  useEffect(() => {
    if (!editor) {
      return;
    }

    let timer = 0;
    const sync = () => setStatsDoc(editor.state.doc);
    sync();

    const onUpdate = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(sync, STATS_REFRESH_MS);
    };

    editor.on('update', onUpdate);
    return () => {
      window.clearTimeout(timer);
      editor.off('update', onUpdate);
    };
  }, [contentToken, editor]);

  const stats = useMemo(() => computeStats(statsDoc), [statsDoc]);

  /* ---------------- find & replace ---------------- */

  useEffect(() => {
    if (!editor) {
      return;
    }

    const recalculate = () => {
      const next = showFindReplace && findText ? findMatches(editor.state.doc, findText, matchCase) : [];
      // Keep the array identity stable while there is nothing to highlight, so the
      // decoration effect below does not dispatch a transaction on every keystroke.
      setMatches((current) => (current.length === 0 && next.length === 0 ? current : next));
      setActiveMatchIndex((current) => (next.length === 0 ? -1 : Math.min(current, next.length - 1)));
    };

    // Immediate when the query changes; debounced while the user is typing into the
    // document, because a full-document rescan per keystroke costs ~250ms at 500k chars.
    recalculate();

    let timer = 0;
    const onUpdate = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(recalculate, FIND_REFRESH_MS);
    };

    editor.on('update', onUpdate);
    return () => {
      window.clearTimeout(timer);
      editor.off('update', onUpdate);
    };
  }, [editor, findText, matchCase, showFindReplace]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const transaction = editor.state.tr
      .setMeta(findHighlightKey, { matches, active: matches.length ? activeMatchIndex : -1 })
      .setMeta('addToHistory', false);
    editor.view.dispatch(transaction);
  }, [activeMatchIndex, editor, matches]);

  useEffect(() => {
    if (!showFindReplace) {
      return;
    }

    findInputRef.current?.focus();
    findInputRef.current?.select();
  }, [showFindReplace]);

  const gotoMatch = useCallback(
    (index: number) => {
      const activeEditor = editorRef.current;
      if (!activeEditor || matches.length === 0) {
        return;
      }

      const normalized = ((index % matches.length) + matches.length) % matches.length;
      const match = matches[normalized];
      setActiveMatchIndex(normalized);
      activeEditor.chain().setTextSelection({ from: match.from, to: match.to }).scrollIntoView().run();
    },
    [matches],
  );

  const applyReplacements = useCallback(
    (targets: FindMatch[], replacement: string) => {
      const activeEditor = editorRef.current;
      if (!activeEditor || targets.length === 0) {
        return 0;
      }

      const { state } = activeEditor.view;
      const limit = state.doc.content.size;
      // Descending order: every position still refers to an untouched region.
      const ordered = [...targets].sort((left, right) => right.from - left.from);
      const transaction = state.tr;
      let applied = 0;

      for (const match of ordered) {
        if (match.from < 0 || match.to > limit || match.to <= match.from) {
          continue;
        }

        if (replacement) {
          const marks = state.doc.resolve(Math.min(match.from + 1, limit)).marks();
          transaction.replaceWith(match.from, match.to, state.schema.text(replacement, marks));
        } else {
          transaction.delete(match.from, match.to);
        }

        applied += 1;
      }

      if (applied === 0) {
        return 0;
      }

      activeEditor.view.dispatch(transaction);
      return applied;
    },
    [],
  );

  const handleReplaceAll = useCallback(() => {
    if (!findText) {
      setBanner({ tone: 'warning', title: 'Enter text to find first.', detail: 'Type a word or phrase before running Replace all.' });
      return;
    }

    const activeEditor = editorRef.current;
    if (!activeEditor) {
      return;
    }

    const targets = findMatches(activeEditor.state.doc, findText, matchCase);
    if (targets.length === 0) {
      setBanner({ tone: 'warning', title: `No matches found for "${findText}".` });
      return;
    }

    const applied = applyReplacements(targets, replaceText);
    setBanner({
      tone: applied === targets.length ? 'success' : 'warning',
      title: `${applied} replacement${applied === 1 ? '' : 's'} applied.`,
      detail: replaceText ? `Updated "${findText}" to "${replaceText}".` : `Removed "${findText}" from the document.`,
    });
  }, [applyReplacements, findText, matchCase, replaceText]);

  const handleReplaceOne = useCallback(() => {
    if (!findText || matches.length === 0) {
      setBanner({ tone: 'warning', title: `No matches found for "${findText}".` });
      return;
    }

    // The match list is refreshed on a 150ms debounce, so it can be one keystroke stale.
    // Re-derive against the live document before mutating anything.
    const activeEditor = editorRef.current;
    if (!activeEditor) {
      return;
    }

    const live = findMatches(activeEditor.state.doc, findText, matchCase);
    if (live.length === 0) {
      setBanner({ tone: 'warning', title: `No matches found for "${findText}".` });
      return;
    }

    const target = live[activeMatchIndex < 0 ? 0 : Math.min(activeMatchIndex, live.length - 1)];
    const applied = applyReplacements([target], replaceText);
    if (applied === 0) {
      return;
    }

    setBanner({
      tone: 'success',
      title: '1 replacement applied.',
      detail: replaceText ? `Updated "${findText}" to "${replaceText}".` : `Removed "${findText}" from the document.`,
    });
  }, [activeMatchIndex, applyReplacements, findText, matchCase, matches.length, replaceText]);

  /* ---------------- images ---------------- */

  const insertEmbeddedImage = useCallback(
    async (blob: Blob, options: { source: string; title: string; detail: string }) => {
      const activeEditor = editorRef.current;
      if (!activeEditor) {
        return;
      }

      const embeddableBlob = prepareEmbeddableImageBlob(blob, options.source);
      const dataUrl = await readBlobAsDataUrl(embeddableBlob);

      /*
       * SILENT CONTENT LOSS if the selection is left alone.
       *
       * Inserting an image leaves a `NodeSelection` on the image just inserted, and
       * `setImage` is `insertContent`, which REPLACES the selection. So a second insert
       * overwrote the first, a third overwrote the second, and the banner still said
       * "Image inserted" — one image survived no matter how many were added. It affected
       * every entry point (file picker, drag-and-drop, paste), which is why the fix lives
       * here rather than in one handler; clicking into the text between inserts happened
       * to avoid it, because that leaves an ordinary text selection.
       *
       * Only a NodeSelection is moved aside. Replacing a TEXT selection with an image is a
       * legitimate thing to ask for and is left exactly as it was.
       */
      const chain = activeEditor.chain().focus();
      const { selection } = activeEditor.state;
      if (selection instanceof NodeSelection) {
        chain.setTextSelection(selection.to);
      }
      chain.setImage({ src: dataUrl }).run();

      setBanner({ tone: 'success', title: options.title, detail: options.detail });
    },
    [],
  );

  const insertImageFile = useCallback(
    async (file: File) => {
      try {
        await insertEmbeddedImage(file, {
          source: file.name,
          title: 'Image inserted.',
          detail: `${file.name} is now embedded in this document and saved locally.`,
        });
      } catch (error) {
        console.error('Image file insert failed', error);
        setBanner({
          tone: 'error',
          title: 'Image could not be inserted.',
          detail: error instanceof Error ? error.message : 'The selected file could not be read in this browser session.',
        });
      }
    },
    [insertEmbeddedImage],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handlePaste = async (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.ProseMirror')) {
        return;
      }

      const imageFile = [...(event.clipboardData?.files ?? [])].find((file) => file.type.startsWith('image/'));
      if (!imageFile) {
        return;
      }

      event.preventDefault();
      await insertImageFile(imageFile);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [editor, insertImageFile]);

  /* ---------------- keyboard ---------------- */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifier = event.ctrlKey || event.metaKey;

      if (isModifier && !event.altKey) {
        const key = event.key.toLowerCase();

        if (key === 'f' || key === 'h') {
          event.preventDefault();
          setShowImagePanel(false);
          setShowFindReplace(true);
          // Focus directly rather than relying on the `[showFindReplace]` effect: that
          // dependency does not change when the panel is already open.
          window.requestAnimationFrame(() => {
            findInputRef.current?.focus();
            findInputRef.current?.select();
          });
          return;
        }

        if (key === 's') {
          event.preventDefault();
          saveNowRef.current?.();
          return;
        }
      }

      if (event.key === 'Escape') {
        setShowFindReplace(false);
        setShowImagePanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ---------------- render guard (all hooks are above) ---------------- */

  if (!editor) {
    return null;
  }

  /* ---------------- unreadable-document escape routes ---------------- */

  const downloadStoredCopy = () => {
    const stored = storedPayloadRef.current;
    if (!stored) {
      return;
    }

    const blob = new Blob([JSON.stringify(stored, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `${stored.title || DEFAULT_FILE_NAME}.raw.json`);
    // Keep the escape routes on screen: using one must not remove the others.
    setBanner(
      unreadableBannerRef.current(
        `Downloaded "${stored.title || DEFAULT_FILE_NAME}.raw.json" — the exact stored record, including the content this editor could not parse.`,
        'success',
      ),
    );
  };

  const confirmDiscardStoredCopy = () => {
    setIsDiscardConfirmOpen(true);
  };

  const discardStoredCopy = () => {
    setIsDiscardConfirmOpen(false);
    const stored = storedPayloadRef.current;
    autosaveBlockedRef.current = false;
    storedPayloadRef.current = null;
    setIsContentUnreadable(false);
    editor.setEditable(true);
    editor.commands.clearContent();
    if (stored) {
      revisionRef.current = stored.revision;
      setDocumentRevision(stored.revision);
    }
    setIsLoaded(true);
    setSaveStatus('Not saved yet');
    setBanner({
      tone: 'warning',
      title: 'Started a fresh document.',
      detail: 'The unreadable copy is still in storage until you type something, which will replace it. Download it first if you have not already.',
    });
  };

  downloadStoredCopyRef.current = downloadStoredCopy;
  discardStoredCopyRef.current = confirmDiscardStoredCopy;

  /**
   * Retry, rather than a hard lock, because the likeliest cause is transient: the 10s
   * IndexedDB open budget expiring (an upgrade blocked by another tab), or the 5s window
   * in which db.ts remembers a failed open. `retryStorageConnection()` clears that memo so
   * the click actually re-opens the database instead of instantly reporting the same
   * failure. Nothing has been written, so a retry is free.
   */
  const retryOpen = () => {
    retryStorageConnection();
    autosaveBlockedRef.current = false;
    storedPayloadRef.current = null;
    setIsDocumentUnopenable(false);
    setIsContentUnreadable(false);
    setBanner(null);
    setSaveStatus('Loading...');
    editor.setEditable(true);
    setLoadAttempt((value) => value + 1);
  };

  /**
   * Leave the unreadable document strictly alone and open a brand new one. A full reload
   * onto a new id is deliberate: it re-mounts against an id nothing is stored under, so
   * there is no path by which this session can touch the record it could not read.
   */
  const startNewDocument = () => {
    window.location.hash = `#/word?id=word-${Date.now()}`;
    window.location.reload();
  };

  retryOpenRef.current = retryOpen;
  startNewDocumentRef.current = startNewDocument;

  /* ---------------- DOCX export ---------------- */

  const exportDocx = async () => {
    if (isDocumentUnopenable) {
      // Nothing was read, so there is not even a raw copy to offer.
      setBanner(unopenableBannerRef.current(null));
      return;
    }

    if (isContentUnreadable) {
      // The editor holds the placeholder document, not the user's content. Exporting it
      // would hand back a plausible-looking wrong file.
      setBanner(
        unreadableBannerRef.current(
          'This document could not be opened, so the editor is only showing a placeholder — exporting it would hand you a plausible-looking wrong file. Download the raw stored copy instead.',
        ),
      );
      return;
    }

    setIsExporting(true);
    const skippedImages: string[] = [];

    try {
      const docx = await import('docx');
      const json = editor.getJSON() as RichTextNode;
      const alignmentMap = {
        left: docx.AlignmentType.LEFT,
        center: docx.AlignmentType.CENTER,
        right: docx.AlignmentType.RIGHT,
        justify: docx.AlignmentType.JUSTIFIED,
      } as const;

      const buildTextRuns = (content: RichTextNode[] = []): DocxInline[] =>
        content.flatMap((child): DocxInline[] => {
          if (child.type === 'hardBreak') {
            return [new docx.TextRun({ text: '', break: 1 })];
          }

          if (child.type !== 'text' || typeof child.text !== 'string') {
            return [];
          }

          const has = (markType: string) => child.marks?.some((mark) => mark.type === markType) ?? false;
          const href = toSafeHref(getMarkAttribute(child, 'link', 'href'));

          const run = new docx.TextRun({
            text: child.text,
            bold: has('bold'),
            italics: has('italic'),
            strike: has('strike'),
            // A <w:hyperlink> carries no character formatting of its own, so a link that
            // is not explicitly styled renders as plain text. Word's own convention is
            // the built-in Hyperlink character style.
            style: href ? 'Hyperlink' : undefined,
            underline: has('underline') ? { type: docx.UnderlineType.SINGLE } : undefined,
            font: toDocxFontName(getMarkAttribute(child, 'textStyle', 'fontFamily')),
            size: toHalfPoints(getMarkAttribute(child, 'textStyle', 'fontSize')),
            color: toDocxColor(getMarkAttribute(child, 'textStyle', 'color')),
          });

          // Links survive import (mammoth emits <a href>) but used to be dropped here,
          // so a round trip silently turned every link into plain text.
          return href ? [new docx.ExternalHyperlink({ children: [run], link: href })] : [run];
        });

      const buildParagraph = (node: RichTextNode, listContext?: { type: 'bullet' | 'ordered'; level: number }) => {
        const runs = buildTextRuns(node.content);
        const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 3);
        const textAlign = typeof node.attrs?.textAlign === 'string' ? node.attrs.textAlign : undefined;

        return new docx.Paragraph({
          children: runs.length > 0 ? runs : [new docx.TextRun('')],
          heading:
            node.type === 'heading'
              ? docx.HeadingLevel[`HEADING_${level}` as keyof typeof docx.HeadingLevel]
              : undefined,
          alignment: textAlign && textAlign in alignmentMap ? alignmentMap[textAlign as keyof typeof alignmentMap] : undefined,
          bullet: listContext?.type === 'bullet' ? { level: listContext.level } : undefined,
          numbering:
            listContext?.type === 'ordered' ? { reference: 'officeninja-numbering', level: listContext.level } : undefined,
        });
      };

      const buildImageBlock = async (node: RichTextNode): Promise<DocxBlock> => {
        const src = String(node.attrs?.src ?? '');
        try {
          const data = await loadImageBinary(src);
          const parsedWidth = readPixelAttribute(node, 'width');
          const parsedHeight = readPixelAttribute(node, 'height');
          const width = Math.max(160, Math.min(520, parsedWidth || 420));
          const height = Math.max(120, Math.min(420, parsedHeight || Math.round(width * 0.6)));

          return new docx.Paragraph({
            children: [
              new docx.ImageRun({
                type: inferDocxImageType(src, data),
                data,
                transformation: { width, height },
              }),
            ],
          });
        } catch (error) {
          // W6: never abort the whole export because one remote image is unreachable.
          console.warn('Skipping unreachable image during export', src, error);
          skippedImages.push(src);
          return new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `[Image could not be embedded: ${src.startsWith('data:') ? 'inline image data' : src}]`,
                italics: true,
                color: '999999',
              }),
            ],
          });
        }
      };

      const buildChildren = async (nodes: RichTextNode[] = [], listLevel = 0): Promise<DocxBlock[]> => {
        const children: DocxBlock[] = [];

        for (const node of nodes) {
          if (node.type === 'paragraph' || node.type === 'heading') {
            children.push(buildParagraph(node));
            continue;
          }

          if (node.type === 'blockquote') {
            for (const child of node.content ?? []) {
              children.push(...(await buildChildren([child], listLevel)));
            }
            continue;
          }

          if (node.type === 'codeBlock') {
            const text = (node.content ?? []).map((child) => child.text ?? '').join('');
            for (const line of text.split('\n')) {
              children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: line, font: 'Courier New' })] }));
            }
            continue;
          }

          if (node.type === 'horizontalRule') {
            children.push(new docx.Paragraph({ children: [new docx.TextRun('———')] }));
            continue;
          }

          if (node.type === 'bulletList' || node.type === 'orderedList') {
            for (const listItem of node.content ?? []) {
              for (const child of listItem.content ?? []) {
                if (child.type === 'paragraph' || child.type === 'heading') {
                  children.push(
                    buildParagraph(child, { type: node.type === 'bulletList' ? 'bullet' : 'ordered', level: listLevel }),
                  );
                  continue;
                }

                children.push(...(await buildChildren([child], listLevel + 1)));
              }
            }
            continue;
          }

          if (node.type && IMAGE_NODE_TYPES.has(node.type) && node.attrs?.src) {
            children.push(await buildImageBlock(node));
            continue;
          }

          if (node.type === 'table') {
            const rows = [];
            for (const row of node.content ?? []) {
              const cells = [];
              for (const cell of row.content ?? []) {
                const cellChildren = await buildChildren(cell.content ?? [], listLevel);
                cells.push(
                  new docx.TableCell({ children: cellChildren.length ? cellChildren : [new docx.Paragraph('')] }),
                );
              }

              rows.push(
                new docx.TableRow({
                  children: cells,
                  tableHeader: row.content?.some((cell) => cell.type === 'tableHeader') ?? false,
                }),
              );
            }

            children.push(new docx.Table({ rows, width: { size: 100, type: docx.WidthType.PERCENTAGE } }));
          }
        }

        return children;
      };

      const children = await buildChildren(json.content ?? []);
      const documentFile = new docx.Document({
        numbering: {
          config: [
            {
              reference: 'officeninja-numbering',
              levels: [
                { level: 0, format: docx.LevelFormat.DECIMAL, text: '%1.', alignment: docx.AlignmentType.START },
                { level: 1, format: docx.LevelFormat.LOWER_LETTER, text: '%2.', alignment: docx.AlignmentType.START },
                { level: 2, format: docx.LevelFormat.LOWER_ROMAN, text: '%3.', alignment: docx.AlignmentType.START },
              ],
            },
          ],
        },
        sections: [{ properties: {}, children: children.length > 0 ? children : [new docx.Paragraph('')] }],
      });

      const blob = await docx.Packer.toBlob(documentFile);
      triggerDownload(blob, `${fileName}.docx`);

      if (skippedImages.length > 0) {
        setBanner({
          tone: 'warning',
          title: `Exported without ${skippedImages.length} image${skippedImages.length === 1 ? '' : 's'}.`,
          detail: `The .docx downloaded, but ${skippedImages.length === 1 ? 'this image could not be fetched and was' : 'these images could not be fetched and were'} replaced with a placeholder: ${skippedImages
            .slice(0, 3)
            .map((source) => (source.startsWith('data:') ? 'inline image data' : source))
            .join(', ')}`,
        });
      } else {
        setBanner({ tone: 'success', title: 'DOCX exported.', detail: `${fileName}.docx has been downloaded.` });
      }
    } catch (error) {
      console.error('DOCX export failed', error);
      setBanner({
        tone: 'error',
        title: 'Export failed.',
        detail: error instanceof Error ? error.message : 'The document could not be converted to .docx in this browser.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  /* ---------------- DOCX import ---------------- */

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      setBanner({
        tone: 'error',
        title: 'DOCX file is too large to import safely.',
        detail: `Choose a file smaller than ${formatFileSize(MAX_IMPORT_FILE_BYTES)} for in-browser conversion.`,
      });
      return;
    }

    // W8: confirm before a destructive import, like Excel and PowerPoint do.
    setPendingImportFile(file);
  };

  const runImport = async (file: File) => {
    setPendingImportFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const mammoth = await import('mammoth');
      // mammoth maps document STYLES, not direct run formatting, and deliberately drops
      // underline because it is ambiguous with hyperlinks in real Word files. This style
      // map wins underline back. Font family, size and colour have no equivalent hook and
      // are still lost on import - see the export/import fidelity note in the banner.
      const result = await mammoth.convertToHtml({ arrayBuffer }, { styleMap: ['u => u'] });

      // No `errorOnInvalidContent` here on purpose: real .docx files produce HTML this
      // schema only partially supports, and refusing the whole import is worse than
      // importing what we can and telling the user what was dropped.
      editor.commands.setContent(result.value);

      // Only rename after the parse succeeded, so a failed import never leaves the
      // document renamed (and autosaved) to a file that was never loaded.
      const nextName = file.name.replace(/\.[^/.]+$/, '').trim() || DEFAULT_FILE_NAME;
      previousFileNameRef.current = nextName;
      setFileName(nextName);
      fileNameRef.current = nextName;
      setContentToken((value) => value + 1);
      queueSave();

      const imageCount = (result.value.match(/<img /g) ?? []).length;
      const notes = (result.messages ?? [])
        .map((message) => (typeof message === 'string' ? message : message.message))
        .filter(Boolean);
      setBanner({
        tone: notes.length > 0 ? 'warning' : 'success',
        title: notes.length > 0 ? 'DOCX imported with some formatting dropped.' : 'DOCX imported.',
        detail: `The document content has been loaded into the editor${imageCount ? `, including ${imageCount} image${imageCount === 1 ? '' : 's'}` : ''}.${
          notes.length > 0 ? ` ${notes.length} conversion note${notes.length === 1 ? '' : 's'}: ${notes.slice(0, 3).join('; ')}` : ''
        }`,
      });
    } catch (error) {
      console.error('DOCX import failed', error);
      setBanner({
        tone: 'error',
        title: 'Import failed.',
        detail:
          error instanceof Error
            ? `${error.message} Your document and its name were left unchanged.`
            : 'This DOCX file could not be converted in the browser. Your document was left unchanged.',
      });
    }
  };

  /* ---------------- speech ---------------- */

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }

    const speechWindow = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setBanner({
        tone: 'warning',
        title: 'Speech recognition is unavailable.',
        detail: 'Try Chrome or Edge on desktop if you want live dictation.',
      });
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsDictating(true);
    recognition.onresult = (event: SpeechRecognitionLikeEvent) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          transcript += `${event.results[index][0].transcript} `;
        }
      }

      if (transcript) {
        editor.commands.insertContent(transcript);
      }
    };
    recognition.onerror = () => setIsDictating(false);
    recognition.onend = () => setIsDictating(false);
    recognition.start();
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const { from, to } = editor.state.selection;
    let textToSpeak = editor.state.doc.textBetween(from, to, ' ');

    if (!textToSpeak.trim()) {
      textToSpeak = editor.getText();
    }

    if (!textToSpeak.trim()) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  /* ---------------- image panel ---------------- */

  const openImageFilePicker = () => {
    setShowFindReplace(false);
    setShowImagePanel(false);
    imageInputRef.current?.click();
  };

  const toggleImageEmbedPanel = () => {
    setShowFindReplace(false);
    setShowImagePanel((value) => !value);
  };

  const insertImageFromUrl = async () => {
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) {
      setBanner({ tone: 'warning', title: 'Paste an image URL first.' });
      return;
    }

    try {
      const response = await fetch(trimmedUrl);
      if (!response.ok) {
        throw new Error(`Image request failed with ${response.status}`);
      }

      await insertEmbeddedImage(await response.blob(), {
        source: trimmedUrl,
        title: 'Image embedded locally.',
        detail: 'A local copy was saved with this document so it survives reloads and offline use.',
      });
      setImageUrl('');
      setShowImagePanel(false);
    } catch (error) {
      console.error('Image URL insert failed', error);

      try {
        await validateRemoteImage(trimmedUrl);
        editor.chain().focus().setImage({ src: trimmedUrl }).run();
        setImageUrl('');
        setShowImagePanel(false);
        setBanner({
          tone: 'warning',
          title: 'Image inserted as a live link.',
          detail:
            'The remote site blocked local embedding, so this image may not be available offline and may be skipped when you export to .docx.',
        });
      } catch (fallbackError) {
        console.error('Remote image fallback insert failed', fallbackError);
        setBanner({
          tone: 'error',
          title: 'Image could not be loaded.',
          detail: 'Check the URL and try a direct image file instead.',
        });
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    await insertImageFile(file);
    setShowImagePanel(false);
  };

  const resetDropTarget = () => {
    dragDepthRef.current = 0;
    setIsDropTargetActive(false);
  };

  const resetImagePanelDropTarget = () => {
    dragDepthRef.current = 0;
    setIsImagePanelDropTargetActive(false);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!dataTransferHasImageFile(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDropTargetActive(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!dataTransferHasImageFile(event.dataTransfer)) {
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

  const handleImagePanelDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!dataTransferHasImageFile(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsImagePanelDropTargetActive(true);
  };

  const handleImagePanelDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!dataTransferHasImageFile(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleImagePanelDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsImagePanelDropTargetActive(false);
    }
  };

  const handleImagePanelDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const imageFile = [...event.dataTransfer.files].find((file) => file.type.startsWith('image/'));
    resetImagePanelDropTarget();

    if (!imageFile) {
      return;
    }

    await insertImageFile(imageFile);
    setShowImagePanel(false);
  };

  /* ---------------- derived view state ---------------- */

  const isInTable = editor.isActive('table');
  const currentFontFamily = (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? '';
  const currentFontSize = (editor.getAttributes('textStyle').fontSize as string | undefined) ?? '';
  const currentColor = (editor.getAttributes('textStyle').color as string | undefined) ?? '#000000';

  const saveSummary =
    saveStatus === 'Saved' && lastSavedAt
      ? `Saved ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(lastSavedAt)}`
      : saveStatus;

  const matchSummary = !findText
    ? ''
    : matches.length === 0
      ? 'No results'
      : activeMatchIndex < 0
        ? `${matches.length} result${matches.length === 1 ? '' : 's'}`
        : `${activeMatchIndex + 1} of ${matches.length}`;

  return (
    <div className="app-container">
      {/*
        Every hidden picker lives here rather than in the header's `actions`,
        because `actions` is now relocated into an overflow menu on phones and a
        picker should not depend on where its button happens to be rendered.
        The colour input is deliberately OUTSIDE `.toolbar` too: the stylesheet
        force-sizes `.toolbar input[type="color"]`, which would fight `.sr-only`.
      */}
      <input ref={importInputRef} type="file" accept=".docx" hidden onChange={handleFileSelected} />
      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(event) => void handleImageUpload(event)} />
      <input
        ref={colorInputRef}
        type="color"
        className="sr-only"
        value={currentColor}
        onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
        // The swatch button in the ribbon is the control; this input is only the
        // native picker it opens, so it must not appear twice to a screen reader
        // or take a second tab stop.
        aria-hidden="true"
        tabIndex={-1}
      />

      <AppHeader
        appName="NinjaWord"
        fileName={fileName}
        setFileName={isContentUnreadable ? noopSetFileName : setFileName}
        defaultFileName={defaultFileName}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        saveStatus={saveStatus}
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={saveNow}
              type="button"
              disabled={isContentUnreadable}
              title={isContentUnreadable ? 'Saving is disabled: the stored copy could not be opened' : 'Save now (Ctrl/Cmd+S)'}
            >
              <Save size={16} />
              Save
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => importInputRef.current?.click()}
              type="button"
              disabled={isContentUnreadable}
              title={isContentUnreadable ? 'Import is disabled: the stored copy could not be opened' : 'Import a .docx file'}
            >
              <Upload size={16} />
              Import DOCX
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void exportDocx()}
              type="button"
              disabled={isExporting || isContentUnreadable}
              title={isContentUnreadable ? 'Export is disabled: this document could not be opened' : 'Export to .docx'}
            >
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export DOCX'}
            </button>
          </>
        }
      />

      <Toolbar>
        <ToolbarGroup label="History">
          <ToolbarButton icon={Undo} onClick={() => editor.chain().focus().undo().run()} isDisabled={!editor.can().undo()} title="Undo" />
          <ToolbarButton icon={Redo} onClick={() => editor.chain().focus().redo().run()} isDisabled={!editor.can().redo()} title="Redo" />
        </ToolbarGroup>

        <ToolbarGroup label="Styles">
          <ToolbarButton
            icon={Heading1}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          />
          <ToolbarButton
            icon={Heading2}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          />
          <ToolbarButton icon={Bold} onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold" />
          <ToolbarButton
            icon={Italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          />
          <ToolbarButton
            icon={UnderlineIcon}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          />
          <ToolbarButton
            icon={Strikethrough}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Font">
          <select
            className="toolbar-select"
            aria-label="Font family"
            title="Font family"
            value={currentFontFamily}
            onChange={(event) => {
              const value = event.target.value;
              if (value) {
                editor.chain().focus().setFontFamily(value).run();
              } else {
                editor.chain().focus().unsetFontFamily().run();
              }
            }}
          >
            {FONT_FAMILY_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="toolbar-select toolbar-select--narrow"
            aria-label="Font size"
            title="Font size"
            value={currentFontSize}
            onChange={(event) => {
              const value = event.target.value;
              if (value) {
                editor.chain().focus().setFontSize(value).run();
              } else {
                editor.chain().focus().unsetFontSize().run();
              }
            }}
          >
            {FONT_SIZE_OPTIONS.map((option) => (
              <option key={option || 'default'} value={option}>
                {option ? option.replace('px', '') : 'Size'}
              </option>
            ))}
          </select>
          {/*
            Office's text-colour control: the "A" glyph over a bar carrying the
            current colour. A bare `<input type="color">` renders as a solid
            filled tile, which read as the loudest object in a row of 1.5px line
            icons no matter how the stylesheet dressed it. The button is a plain
            `.toolbar-btn`, so it inherits the row's size, hover, focus ring and
            roving tab index; only the bar is coloured, and the "A" follows the
            row's ink via `currentColor`.
          */}
          <button
            className="toolbar-btn"
            type="button"
            onClick={() => colorInputRef.current?.click()}
            title="Text colour"
            aria-label={`Text colour (${currentColor})`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M5.5 16.5 12 4l6.5 12.5M8.2 13h7.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/*
                The hairline is not decoration. The bar carries an arbitrary
                user colour, and the default (#000000) is invisible against the
                dark ribbon — as is white against the light one. A boundary
                drawn in `currentColor` adapts to whichever theme is showing,
                the same job the stylesheet's `::-webkit-color-swatch` border
                does for a native swatch.
              */}
              <rect
                x="4.5"
                y="19"
                width="15"
                height="3"
                rx="1.2"
                fill={currentColor}
                stroke="currentColor"
                strokeOpacity="0.45"
                strokeWidth="1"
              />
            </svg>
          </button>
          <ToolbarButton
            icon={RotateCcw}
            onClick={() => editor.chain().focus().unsetColor().run()}
            title="Reset text colour"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Alignment">
          <ToolbarButton
            icon={AlignLeft}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align left"
          />
          <ToolbarButton
            icon={AlignCenter}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align center"
          />
          <ToolbarButton
            icon={AlignRight}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align right"
          />
          <ToolbarButton
            icon={AlignJustify}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Lists">
          <ToolbarButton
            icon={List}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bulleted list"
          />
          <ToolbarButton
            icon={ListOrdered}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered list"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Insert">
          <ToolbarButton
            icon={Search}
            onClick={() => {
              setShowImagePanel(false);
              setShowFindReplace((value) => {
                const next = !value;
                if (next) {
                  window.requestAnimationFrame(() => {
                    findInputRef.current?.focus();
                    findInputRef.current?.select();
                  });
                }
                return next;
              });
            }}
            isActive={showFindReplace}
            title="Find and replace (Ctrl+F)"
          />
          <ToolbarButton
            icon={TableIcon}
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert table"
          />
          <ToolbarButton icon={ImageIcon} onClick={openImageFilePicker} title="Insert image" />
          <ToolbarButton icon={ImagePlus} onClick={toggleImageEmbedPanel} isActive={showImagePanel} title="Embed image URL" />
        </ToolbarGroup>

        <ToolbarGroup label="Table">
          <ToolbarButton
            icon={ChevronUp}
            onClick={() => editor.chain().focus().addRowBefore().run()}
            isDisabled={!isInTable}
            title="Insert row above"
          />
          <ToolbarButton
            icon={ChevronDown}
            onClick={() => editor.chain().focus().addRowAfter().run()}
            isDisabled={!isInTable}
            title="Insert row below"
          />
          <ToolbarButton
            icon={Rows3}
            onClick={() => editor.chain().focus().deleteRow().run()}
            isDisabled={!isInTable}
            title="Delete row"
          />
          <ToolbarButton
            icon={ChevronLeft}
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            isDisabled={!isInTable}
            title="Insert column left"
          />
          <ToolbarButton
            icon={ChevronRight}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            isDisabled={!isInTable}
            title="Insert column right"
          />
          <ToolbarButton
            icon={Columns3}
            onClick={() => editor.chain().focus().deleteColumn().run()}
            isDisabled={!isInTable}
            title="Delete column"
          />
          <ToolbarButton
            icon={Trash2}
            onClick={() => editor.chain().focus().deleteTable().run()}
            isDisabled={!isInTable}
            title="Delete table"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Review">
          <ToolbarButton icon={Mic} onClick={toggleDictation} isActive={isDictating} title={isDictating ? 'Stop dictation' : 'Start dictation'} />
          <ToolbarButton
            icon={isSpeaking ? Square : Volume2}
            onClick={toggleSpeech}
            isActive={isSpeaking}
            title={isSpeaking ? 'Stop read aloud' : 'Read aloud'}
          />
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
            {banner.actions && banner.actions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {banner.actions.map((action) => (
                  <button
                    key={action.label}
                    className={`btn ${action.isPrimary ? 'btn-primary' : 'btn-secondary'}`}
                    type="button"
                    style={{ height: 32, fontSize: 13 }}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/*
            While the document is locked the banner is the only explanation of why nothing
            can be typed or saved, and the only way out. Dismissing it would leave a dead
            editor with no stated reason.
          */}
          {!isContentUnreadable && (
            <button className="btn btn-secondary btn-icon" onClick={() => setBanner(null)} type="button" aria-label="Dismiss message">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {showFindReplace && (
        <div className="find-replace-bar">
          <input
            ref={findInputRef}
            className="form-control form-inline-field"
            aria-label="Find text"
            placeholder="Find text"
            value={findText}
            onChange={(event) => setFindText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (event.shiftKey) {
                  gotoMatch(activeMatchIndex < 0 ? matches.length - 1 : activeMatchIndex - 1);
                } else {
                  gotoMatch(activeMatchIndex < 0 ? 0 : activeMatchIndex + 1);
                }
              }
            }}
          />
          <span aria-live="polite" style={{ fontSize: 13, opacity: 0.8, minWidth: 78, textAlign: 'center' }}>
            {matchSummary}
          </span>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => gotoMatch(activeMatchIndex < 0 ? matches.length - 1 : activeMatchIndex - 1)}
            type="button"
            disabled={matches.length === 0}
            aria-label="Previous match"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp size={16} />
          </button>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => gotoMatch(activeMatchIndex < 0 ? 0 : activeMatchIndex + 1)}
            type="button"
            disabled={matches.length === 0}
            aria-label="Find next"
            title="Find next (Enter)"
          >
            <ChevronDown size={16} />
          </button>
          <input
            className="form-control form-inline-field"
            aria-label="Replace with"
            placeholder="Replace with"
            value={replaceText}
            onChange={(event) => setReplaceText(event.target.value)}
          />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={matchCase} onChange={(event) => setMatchCase(event.target.checked)} />
            Match case
          </label>
          <button className="btn btn-secondary" onClick={handleReplaceOne} type="button" disabled={matches.length === 0}>
            Replace
          </button>
          <button className="btn btn-primary" onClick={handleReplaceAll} type="button">
            Replace all
          </button>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setShowFindReplace(false)}
            type="button"
            aria-label="Close find and replace"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showImagePanel && (
        <div className="insert-image-panel">
          <div
            className={`image-import-dropzone ${isImagePanelDropTargetActive ? 'image-import-dropzone--active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => imageInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                imageInputRef.current?.click();
              }
            }}
            onDragEnter={handleImagePanelDragEnter}
            onDragOver={handleImagePanelDragOver}
            onDragLeave={handleImagePanelDragLeave}
            onDrop={(event) => void handleImagePanelDrop(event)}
            aria-label="Drop an image here or choose one from your device"
          >
            <strong>Drop image here or choose from device</strong>
            <span>Embedded images are saved locally with this document for reloads and offline use.</span>
          </div>
          <input
            className="form-control form-inline-field form-inline-field--wide"
            aria-label="Image URL"
            placeholder="Paste an image URL to embed locally"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
          />
          <button className="btn btn-primary" onClick={() => void insertImageFromUrl()} type="button">
            Embed URL
          </button>
          <button className="btn btn-secondary" onClick={() => imageInputRef.current?.click()} type="button">
            Choose from device
          </button>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setShowImagePanel(false)}
            type="button"
            aria-label="Close image import"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="workspace">
        <div className="workspace-center" role="region" aria-label="Word editor workspace">
          <div className="word-stage">
            <div className="document-stage">
              <div className="document-shell">
                <div
                  className={`document-page ${isDropTargetActive ? 'document-page--drop-target' : ''}`}
                  role="region"
                  aria-label="Document editor"
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(event) => void handleDrop(event)}
                >
                  {isDropTargetActive && <div className="drop-target-hint">Drop an image to embed it here and save it locally.</div>}
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isDiscardConfirmOpen}
        title="Discard the stored copy?"
        description={`"${fileName}" could not be opened, and this is the only copy. Starting fresh replaces it as soon as you type. Download the raw stored copy first if you have not already.`}
        confirmLabel="Discard and start fresh"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={discardStoredCopy}
        onClose={() => setIsDiscardConfirmOpen(false)}
      />

      <ConfirmDialog
        open={pendingImportFile !== null}
        title="Replace this document?"
        description={`Importing "${pendingImportFile?.name ?? ''}" discards everything currently in this document. This cannot be undone from the toolbar.`}
        confirmLabel="Import and replace"
        cancelLabel="Keep my document"
        tone="danger"
        onConfirm={() => {
          const file = pendingImportFile;
          if (file) {
            void runImport(file);
          }
        }}
        onClose={() => setPendingImportFile(null)}
      />

      {/*
        The only surface for `computeStats` now that the insights sidebar is gone. The
        separators are real text rather than `aria-hidden` spacers so the whitespace
        around them survives into the accessibility tree and the counts are not run
        together when the status bar's live region is announced.
      */}
      <StatusBar
        leftContent={
          /*
            The status bar's <footer> is aria-live="polite". These counts refresh on a
            150ms debounce while typing, so leaving them inside the live region made a
            screen reader re-announce the whole triple continuously and bury the save
            status the region exists to report. They stay fully readable in browse mode.
          */
          <span aria-live="off">
            {formatCount(stats.words, 'word')} · {formatCount(stats.characters, 'character')} ·{' '}
            {formatCount(stats.paragraphs, 'paragraph')}
          </span>
        }
        rightContent={<span>{saveSummary}</span>}
      />
    </div>
  );
}
