import { Link, useNavigate } from 'react-router-dom';
import '../styles/tools.css';
import {
  ArrowRight,
  FolderOpen,
  Plus,
  RefreshCw,
  Upload,
  Moon,
  Pencil,
  Sun,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearDocumentTombstone,
  deleteDocument,
  listDocuments,
  loadDocument,
  saveDocument,
} from '../utils/db';
import type { DocumentRecord, OfficeDocumentType } from '../utils/db';
import { deleteDesign, designUrl, listDesigns, loadDesign, renameDesign, restoreDesign } from '../utils/blueline';
import type { DesignDocument } from '../utils/blueline';
import { AppMark } from '../components/AppMark';
import { handOff, kindForFile } from '../utils/handoff';
import { readToolWorkspace } from '../utils/toolStorage';

interface DashboardProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

interface DocMeta {
  id: string;
  title: string;
  type: OfficeDocumentType | 'blueline';
  updatedAt: number;
}

type SortKey = 'recent' | 'name' | 'type';

const PAGE_SIZE = 12;
const UNDO_WINDOW_MS = 10000;
const UNDO_STORAGE_KEY = 'officeninja_pending_undo';

/** A deleted file plus the wall-clock instant its recovery window closes. */
interface PendingUndo {
  record: DocumentRecord | DesignDocument;
  expiresAt: number;
}

function isPendingUndo(value: unknown): value is PendingUndo {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const entry = value as Partial<PendingUndo>;
  return (
    typeof entry.expiresAt === 'number' &&
    Number.isFinite(entry.expiresAt) &&
    !!entry.record &&
    typeof entry.record === 'object' &&
    typeof entry.record.id === 'string' &&
    typeof entry.record.title === 'string' &&
    (entry.record.type === 'word' || entry.record.type === 'excel' || entry.record.type === 'powerpoint' || entry.record.type === 'blueline')
  );
}

/**
 * The undo window outlives a reload or a trip into an editor and back, so the
 * snapshot cannot live in component state alone. `expiresAt` is absolute, so a
 * window that elapsed while the page was gone is dropped rather than resumed.
 */
function readPendingUndos(): PendingUndo[] {
  try {
    const raw = sessionStorage.getItem(UNDO_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const now = Date.now();
    return parsed.filter((entry): entry is PendingUndo => isPendingUndo(entry) && entry.expiresAt > now);
  } catch {
    return [];
  }
}

/**
 * Best effort: a snapshot too large for sessionStorage must not evict smaller,
 * still-recoverable ones, and must never throw into the delete path.
 *
 * CAVEAT — `record.data` goes through JSON here, but IndexedDB stores it by
 * structured clone. The two disagree: a `Uint8Array` comes back a plain object,
 * a `Date` a string, and a `Map`/`Blob`/`undefined` does not survive at all.
 * That is harmless TODAY because all three editors persist plain JSON (HTML
 * string, sheet arrays, slide objects), so the round trip is lossless. If any
 * editor ever puts a binary or class instance in `data`, an undo that survives
 * a reload would silently restore a degraded document — the in-memory path
 * would still be fine, which makes it the nastiest possible bug to find. Swap
 * this for an IndexedDB-backed pending queue at that point.
 */
function writePendingUndos(entries: PendingUndo[]) {
  let candidates = entries;
  while (candidates.length > 0) {
    try {
      sessionStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(candidates));
      return;
    } catch {
      // Quota or a non-serialisable payload: drop the oldest and retry.
      candidates = candidates.slice(0, -1);
    }
  }
  try {
    sessionStorage.removeItem(UNDO_STORAGE_KEY);
  } catch {
    // Storage is unavailable entirely; the in-memory undo still works.
  }
}

/**
 * Every app is one tile of the same shape: brand mark, name, one line. The
 * four editors create a new file; the three tools open their workspace. They
 * used to be a filled button, three outlined buttons and three large cards —
 * three visual languages for seven equivalent entry points.
 */
type AppTile = {
  app:
    | 'word'
    | 'excel'
    | 'powerpoint'
    | 'blueline'
    | 'image'
    | 'svg'
    | 'time'
    | 'notes'
    | 'pdf'
    | 'meet'
    | 'chat'
    | 'drop'
    | 'board';
  group: 'create' | 'tools' | 'connect';
  name: string;
  line: string;
  /** Accessible name for the create tiles ("New document", ...). */
  create?: string;
};
const APP_TILES: AppTile[] = [
  { app: 'word', group: 'create', name: 'NinjaWord', line: 'Documents and letters', create: 'New document' },
  { app: 'excel', group: 'create', name: 'NinjaCalc', line: 'Spreadsheets and budgets', create: 'New spreadsheet' },
  { app: 'powerpoint', group: 'create', name: 'NinjaSlides', line: 'Presentations', create: 'New presentation' },
  { app: 'blueline', group: 'create', name: 'Blueline', line: 'Interface and graphic design', create: 'New design' },
  { app: 'board', group: 'create', name: 'NinjaBoard', line: 'Kanban, sprints and bug tracking', create: 'New board' },
  { app: 'pdf', group: 'tools', name: 'NinjaPDF', line: 'Edit, sign & fill PDFs' },
  { app: 'image', group: 'tools', name: 'NinjaImage', line: 'Photo editor' },
  { app: 'svg', group: 'tools', name: 'NinjaSVG', line: 'Edit & convert SVG' },
  { app: 'notes', group: 'tools', name: 'NinjaNotes', line: 'Notes & dictation' },
  { app: 'time', group: 'tools', name: 'NinjaTime', line: 'Time & invoices' },
  { app: 'meet', group: 'connect', name: 'NinjaMeet', line: 'Video calls' },
  { app: 'chat', group: 'connect', name: 'NinjaChat', line: 'Open team channels' },
  { app: 'drop', group: 'connect', name: 'NinjaDrop', line: 'Send files directly' },
];
const APP_GROUPS = [
  { id: 'create', title: 'Create' },
  { id: 'tools', title: 'Tools' },
  { id: 'connect', title: 'Connect' },
] as const;

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
const TYPE_LABEL = { word: 'Document', excel: 'Spreadsheet', powerpoint: 'Presentation', blueline: 'Design' } as const;

async function listWorkspaceFiles(): Promise<DocMeta[]> {
  const results = await Promise.allSettled([listDocuments(), listDesigns()]);
  for (const result of results) {
    if (result.status === 'rejected') console.error('Could not load local files', result.reason);
  }
  return results.flatMap<DocMeta>((result) => result.status === 'fulfilled' ? result.value : [])
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

const OPEN_ACCEPT =
  '.docx,.xlsx,.xls,.csv,.pptx,.pdf,application/pdf,.svg,image/*';
const MAX_OPEN_BYTES = 30_000_000;

function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** One line of live state per tool, read once from its local workspace. */
async function readToolSummaries() {
  const [time, notes, pdf] = await Promise.all([
    readToolWorkspace<{
      entries?: { date?: string; seconds?: number; billable?: boolean }[];
      timer?: { description?: string } | null;
    }>('time'),
    readToolWorkspace<{ notes?: { title?: string }[] }>('notes'),
    readToolWorkspace<{ name?: string; bytes?: Uint8Array | null }>('pdf'),
  ]);
  const summary: Partial<Record<'time' | 'notes' | 'pdf', string>> = {};
  if (time?.timer) summary.time = `Timer running${time.timer.description ? ` · ${time.timer.description}` : ''}`;
  else if (time?.entries?.length) {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const seconds = time.entries
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + (e.seconds ?? 0), 0);
    summary.time = seconds
      ? `${formatHours(seconds)} tracked today`
      : `${time.entries.length} time ${time.entries.length === 1 ? 'entry' : 'entries'}`;
  }
  if (notes?.notes?.length)
    summary.notes = `${notes.notes.length} ${notes.notes.length === 1 ? 'note' : 'notes'}`;
  if (pdf?.bytes) summary.pdf = `Continue editing ${pdf.name || 'your PDF'}`;
  return summary;
}

export default function Dashboard({ toggleTheme, isDarkMode }: DashboardProps) {
  const navigate = useNavigate();
  const openInput = useRef<HTMLInputElement>(null);
  const [syncDot, setSyncDot] = useState<'on' | 'idle' | 'off'>('off');
  useEffect(() => {
    // Green when devices are connected or a folder backup exists, amber when set
    // up but idle, grey when nothing protects the data yet.
    let stop = () => {};
    void import('../utils/sync/p2p').then((m) => {
      stop = m.onSyncStatus((s) => {
        const configured = !!m.syncGroup();
        let backedUp = false;
        try {
          const last = JSON.parse(localStorage.getItem('officeninja_last_backup') || 'null');
          backedUp = !!last && Date.now() - last.t < 14 * 86_400_000;
        } catch {
          backedUp = false;
        }
        setSyncDot(s.peers.length || backedUp ? 'on' : configured ? 'idle' : 'off');
      });
    });
    return () => stop();
  }, []);
  const [dropping, setDropping] = useState(false);
  const [openError, setOpenError] = useState('');
  const [summaries, setSummaries] = useState<
    Partial<Record<'time' | 'notes' | 'pdf', string>>
  >({});
  useEffect(() => {
    let live = true;
    void readToolSummaries().then((s) => {
      if (live) setSummaries(s);
    });
    return () => {
      live = false;
    };
  }, []);
  const openFile = (file: File | undefined) => {
    if (!file) return;
    const kind = kindForFile(file);
    if (!kind) {
      setOpenError(
        `“${file.name}” is not a file OfficeNinja opens. Use .docx, .xlsx, .csv, .pptx, .pdf, .svg or an image.`,
      );
      return;
    }
    if (file.size > MAX_OPEN_BYTES) {
      setOpenError(`“${file.name}” is larger than 30 MB.`);
      return;
    }
    setOpenError('');
    handOff(kind, file);
    navigate(`/${kind}`);
  };
  const [recentDocs, setRecentDocs] = useState<DocMeta[]>([]);
  const [hello] = useState(greeting);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [showAll, setShowAll] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [undoEntries, setUndoEntries] = useState<PendingUndo[]>(() => readPendingUndos());
  const undoTimersRef = useRef(new Map<string, number>());

  const loadRecentDocs = useCallback(async () => {
    try {
      setRecentDocs(await listWorkspaceFiles());
    } catch (error) {
      console.error('Failed to load recent documents', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listWorkspaceFiles()
      .then((docs) => {
        if (!cancelled) {
          setRecentDocs(docs);
        }
      })
      .catch((error) => console.error('Failed to load recent documents', error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const refresh = () => void loadRecentDocs();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [loadRecentDocs]);

  /** One timer per pending entry. A single shared timer meant the second delete
   *  cancelled the first file's expiry as well as overwriting its snapshot. */
  const scheduleUndoExpiry = useCallback((id: string, expiresAt: number) => {
    const timers = undoTimersRef.current;
    const existing = timers.get(id);
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }
    timers.set(
      id,
      window.setTimeout(() => {
        timers.delete(id);
        setUndoEntries((entries) => entries.filter((entry) => entry.record.id !== id));
      }, Math.max(0, expiresAt - Date.now())),
    );
  }, []);

  const forgetUndo = useCallback((id: string) => {
    const timer = undoTimersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      undoTimersRef.current.delete(id);
    }
    setUndoEntries((entries) => entries.filter((entry) => entry.record.id !== id));
  }, []);

  // Re-arm the windows that survived a reload or a trip into an editor.
  useEffect(() => {
    const timers = undoTimersRef.current;
    for (const entry of readPendingUndos()) {
      scheduleUndoExpiry(entry.record.id, entry.expiresAt);
    }
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, [scheduleUndoExpiry]);

  useEffect(() => {
    writePendingUndos(undoEntries);
  }, [undoEntries]);

  /** Deleting is immediate and reversible rather than guarded by a modal whose
   *  destructive button took focus — a stray Enter used to be enough to lose a file. */
  const handleDelete = useCallback(async (doc: DocMeta) => {
    let snapshot: DocumentRecord | DesignDocument | undefined;
    try {
      snapshot = doc.type === 'blueline' ? await loadDesign(doc.id) : await loadDocument(doc.id);
    } catch (error) {
      console.warn('Could not snapshot document before delete', error);
    }

    if (doc.type === 'blueline') await deleteDesign(doc.id);
    else await deleteDocument(doc.id);
    setRecentDocs((docs) => docs.filter((entry) => entry.id !== doc.id));

    if (!snapshot) {
      return;
    }

    const record = snapshot;
    const expiresAt = Date.now() + UNDO_WINDOW_MS;
    // Every delete keeps its OWN slot: with one shared slot, a second delete
    // inside the window destroyed the first file with no way back.
    setUndoEntries((entries) => [
      { record, expiresAt },
      ...entries.filter((entry) => entry.record.id !== record.id),
    ]);
    scheduleUndoExpiry(record.id, expiresAt);
  }, [scheduleUndoExpiry]);

  const handleUndoDelete = useCallback(async (id: string) => {
    const entry = undoEntries.find((candidate) => candidate.record.id === id);
    if (!entry) {
      return;
    }

    forgetUndo(id);

    try {
      // db.ts tombstones deletions, and saveDocument never clears one implicitly:
      // the tombstone has to go first or the restore is refused.
      if (entry.record.type === 'blueline') {
        await restoreDesign(entry.record);
        void loadRecentDocs();
        return;
      }
      clearDocumentTombstone(id);
      /*
       * `overwriteExisting: true` is REQUIRED, and this is one of only two places in the
       * app entitled to set it.
       *
       * This snapshot was taken before the delete, so it has no current revision to offer,
       * and db.ts no longer treats "no knownRevision" as permission to overwrite -- that
       * inference is what allowed a document to be destroyed by a caller that had merely
       * failed to read it. Restoring is the opposite case: the user pressed Undo on a
       * delete they just performed, so replacing whatever survived the delete (a row whose
       * deletion never reached IndexedDB, for instance) is exactly what they asked for.
       */
      await saveDocument(entry.record.id, entry.record.title, entry.record.type, entry.record.data, {
        overwriteExisting: true,
      });
    } catch (error) {
      console.error('Could not restore the deleted document', error);
    }

    void loadRecentDocs();
  }, [forgetUndo, loadRecentDocs, undoEntries]);

  const commitRename = useCallback(async (doc: DocMeta) => {
    const nextTitle = renameDraft.trim();
    setRenamingId(null);

    if (!nextTitle || nextTitle === doc.title) {
      return;
    }

    try {
      if (doc.type === 'blueline') {
        await renameDesign(doc.id, nextTitle);
        void loadRecentDocs();
        return;
      }
      const record = await loadDocument(doc.id);
      if (!record) {
        return;
      }
      // A rename is an ORDINARY write, not an overwrite: it carries the revision it just
      // read, so an editor tab that moved the document on in the meantime wins and the
      // rename is reported as a conflict rather than reverting that tab's content.
      const result = await saveDocument(doc.id, nextTitle, doc.type, record.data, {
        knownRevision: record.revision,
      });
      if (result.status === 'conflict') {
        console.warn(`Rename of "${doc.id}" skipped: it was saved elsewhere at revision ${result.record.revision}.`);
      }
      void loadRecentDocs();
    } catch (error) {
      console.error('Rename failed', error);
    }
  }, [loadRecentDocs, renameDraft]);

  const formatDate = (timestamp: number) =>
    new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(timestamp);

  const visibleDocs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? recentDocs.filter((doc) => doc.title.toLowerCase().includes(needle) || TYPE_LABEL[doc.type].toLowerCase().includes(needle))
      : recentDocs;

    const sorted = [...filtered];
    if (sortKey === 'name') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortKey === 'type') {
      sorted.sort((a, b) => TYPE_LABEL[a.type].localeCompare(TYPE_LABEL[b.type]) || b.updatedAt - a.updatedAt);
    } else {
      sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return sorted;
  }, [query, recentDocs, sortKey]);

  const shownDocs = showAll ? visibleDocs : visibleDocs.slice(0, PAGE_SIZE);
  const hiddenCount = visibleDocs.length - shownDocs.length;

  return (
    <div
      className="dashboard"
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
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDropping(false);
        openFile(e.dataTransfer.files[0]);
      }}
    >
      {dropping && (
        <div className="dashboard-dropcue" aria-hidden="true">
          <Upload size={30} />
          <strong>Drop to open</strong>
          <span>Word, Excel, CSV, PowerPoint, PDF, SVG or an image</span>
        </div>
      )}
      <h1 className="sr-only">OfficeNinja office and design workspace</h1>
      <header className="dashboard-topbar">
        <div className="dashboard-shell dashboard-topbar__inner">
          <span className="dashboard-brand">
            <span className="dashboard-brand__mark" aria-hidden="true">
              N
            </span>
            <span className="dashboard-brand__title">OfficeNinja</span>
          </span>

          <Link
            to="/sync"
            className="btn btn-secondary dashboard-sync"
            title="Back up your work and sync it between your devices"
          >
            <RefreshCw size={15} aria-hidden="true" />
            <span className={`sync-dot sync-dot--${syncDot}`} aria-hidden="true" />
            <span className="dashboard-btn-label">Backup &amp; sync</span>
          </Link>
          <button
            type="button"
            className="btn btn-secondary dashboard-open"
            onClick={() => openInput.current?.click()}
            title="Open a .docx, .xlsx, .csv, .pptx or .pdf file. You can also drop files anywhere on this page."
          >
            <Upload size={15} aria-hidden="true" />
            <span className="dashboard-btn-label">Open file</span>
          </button>
          <input
            ref={openInput}
            type="file"
            hidden
            accept={OPEN_ACCEPT}
            aria-label="Open a file from this device"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              openFile(file);
            }}
          />

          <button
            className="btn btn-secondary btn-icon dashboard-theme-toggle"
            onClick={toggleTheme}
            type="button"
            aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <section className="dashboard-section" aria-labelledby="dashboard-recent-title">
        <div className="dashboard-shell">
          <div className="dashboard-hero">
            <div>
              <p className="dashboard-hero__hello">{hello}</p>
              <p className="dashboard-hero__line">
                Your private office in the browser. Files stay on this device until you choose to
                share them.
              </p>
            </div>
            <ul className="dashboard-hero__facts" aria-label="How it works">
              <li>No account</li>
              <li>Works offline</li>
              <li>Peer-to-peer sharing</li>
            </ul>
          </div>
          <nav className="app-groups" aria-label="Apps">
            {APP_GROUPS.map((group) => (
              <section key={group.id} className={`app-group app-group--${group.id}`} aria-label={group.title}>
                <h2 className="app-group__title">{group.title}</h2>
                <div className="app-grid">
                  {APP_TILES.filter((t) => t.group === group.id).map(({ app, name, line, create }) => {
                    const href = app === 'blueline' ? designUrl() : app === 'board' ? '#/board?new=1' : `#/${app}`;
                    const status =
                      app === 'time' || app === 'notes' || app === 'pdf'
                        ? summaries[app]
                        : undefined;
                    return (
                      <a
                        key={app}
                        className={`app-tile${create ? ' app-tile--create dashboard-create__btn' : ''}`}
                        href={href}
                        aria-label={create}
                      >
                        <AppMark app={app} size={create ? 'lg' : 'md'} />
                        <span className="app-tile__text">
                          <strong>{name}</strong>
                          <small data-live={status ? '' : undefined}>{status ?? line}</small>
                        </span>
                        {create ? (
                          <span className="app-tile__new" aria-hidden="true">
                            <Plus size={14} /> New
                          </span>
                        ) : (
                          <ArrowRight size={16} className="app-tile__go" aria-hidden="true" />
                        )}
                      </a>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
          <div className="dashboard-section-header">
            {/* One caption, and it earns its line: it is the only place the
                product says the files live in this browser and nowhere else.
                The heading itself stays exactly "Your files" — a count inside
                it would become part of its accessible name. */}
            <div className="dashboard-section-title">
              <h2 id="dashboard-recent-title">Your files</h2>
              <p>
                {recentDocs.length === 0
                  ? 'Stored locally in this browser.'
                  : `${recentDocs.length} file${recentDocs.length === 1 ? '' : 's'} stored locally in this browser.`}
              </p>
            </div>

            <div className="dashboard-file-tools">
            {recentDocs.length > 0 && (
              <>
                <input
                  type="search"
                  className="dashboard-search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setShowAll(false);
                  }}
                  placeholder="Search files"
                  aria-label="Search files"
                />
                <label className="sr-only" htmlFor="dashboard-sort">
                  Sort files
                </label>
                <select
                  id="dashboard-sort"
                  className="dashboard-sort"
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                >
                  <option value="recent">Last updated</option>
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                </select>
              </>
            )}
            </div>
          </div>
          {openError && (
            <div className="dashboard-open-error" role="alert">
              {openError}
            </div>
          )}

          {recentDocs.length === 0 ? (
            <div className="dashboard-empty">
              <FolderOpen size={22} aria-hidden="true" />
              <p>
                <strong>No files yet.</strong> Start a document, spreadsheet, presentation or Blueline design, or drop a
                document, spreadsheet, presentation, PDF, SVG or photo anywhere on this page to open it. Everything is saved in this browser as you type.
                {' '}Time entries, notes, and your PDF draft are saved inside their tools above.
              </p>
            </div>
          ) : visibleDocs.length === 0 ? (
            <div className="dashboard-empty">
              <p>No files match “{query}”.</p>
            </div>
          ) : (
            <>
              <div className="recent-grid">
                {shownDocs.map((doc) => {
                  const isRenaming = renamingId === doc.id;
                  return (
                    <article key={doc.id} className="recent-card">
                      <AppMark app={doc.type} className="file-icon" />

                      <div className="recent-card__meta">
                        {isRenaming ? (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              void commitRename(doc);
                            }}
                          >
                            <label className="sr-only" htmlFor={`rename-${doc.id}`}>
                              New name for {doc.title}
                            </label>
                            <input
                              id={`rename-${doc.id}`}
                              className="form-control"
                              value={renameDraft}
                              autoFocus
                              onChange={(event) => setRenameDraft(event.target.value)}
                              onBlur={() => void commitRename(doc)}
                              onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                  setRenamingId(null);
                                }
                              }}
                            />
                          </form>
                        ) : (
                          <h3>
                            {doc.type === 'blueline' ? (
                              <a className="card-stretch-link" href={designUrl(doc.id)}>{doc.title}</a>
                            ) : (
                              <Link className="card-stretch-link" to={`/${doc.type}?id=${encodeURIComponent(doc.id)}`}>{doc.title}</Link>
                            )}
                          </h3>
                        )}
                        <p className="file-meta">
                          {TYPE_LABEL[doc.type]} · {formatDate(doc.updatedAt)}
                        </p>
                      </div>

                      <div className="recent-card__actions">
                        <button
                          className="recent-card-btn"
                          onClick={() => {
                            setRenamingId(doc.id);
                            setRenameDraft(doc.title);
                          }}
                          title={`Rename ${doc.title}`}
                          aria-label={`Rename ${doc.title}`}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="recent-card-btn recent-card-btn--danger"
                          onClick={() => void handleDelete(doc)}
                          title={`Delete ${doc.title}`}
                          aria-label={`Delete ${doc.title}`}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {(hiddenCount > 0 || showAll) && visibleDocs.length > PAGE_SIZE && (
                <div className="dashboard-more">
                  <button className="btn btn-secondary" type="button" onClick={() => setShowAll((value) => !value)}>
                    {showAll ? 'Show fewer files' : `Show all ${visibleDocs.length} files`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {undoEntries.length > 0 && (
        <div className="dashboard-undo-stack" role="status" aria-live="polite">
          {undoEntries.map((entry) => (
            <div className="dashboard-undo" key={entry.record.id}>
              <span className="dashboard-undo__text">Deleted “{entry.record.title}”.</span>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => void handleUndoDelete(entry.record.id)}
                aria-label={`Undo deleting ${entry.record.title}`}
              >
                <Undo2 size={16} aria-hidden="true" />
                Undo
              </button>
              <button
                className="recent-card-btn"
                type="button"
                onClick={() => forgetUndo(entry.record.id)}
                aria-label={`Dismiss delete notification for ${entry.record.title}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
