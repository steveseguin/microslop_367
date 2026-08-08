import { Link } from 'react-router-dom';
import {
  FileText,
  Moon,
  Pencil,
  Presentation,
  Sparkles,
  Sun,
  Table,
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

interface DashboardProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

interface DocMeta {
  id: string;
  title: string;
  type: OfficeDocumentType;
  updatedAt: number;
}

type SortKey = 'recent' | 'name' | 'type';

const PAGE_SIZE = 12;
const UNDO_WINDOW_MS = 10000;
const UNDO_STORAGE_KEY = 'officeninja_pending_undo';

/** A deleted file plus the wall-clock instant its recovery window closes. */
interface PendingUndo {
  record: DocumentRecord;
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
    (entry.record.type === 'word' || entry.record.type === 'excel' || entry.record.type === 'powerpoint')
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

const launchCards = [
  {
    type: 'word',
    name: 'NinjaWord',
    title: 'Write polished documents',
    description: 'Rich text editing, tables, images, import and export, dictation, and live document insights.',
    icon: FileText,
    accentClass: 'word',
  },
  {
    type: 'excel',
    name: 'NinjaCalc',
    title: 'Analyze sheets that matter',
    description: 'Editable worksheets with imports, multiple sheets, chart previews, and selection summaries.',
    icon: Table,
    accentClass: 'excel',
  },
  {
    type: 'powerpoint',
    name: 'NinjaSlides',
    title: 'Build decks quickly',
    description: 'Slide thumbnails, speaker notes, layered canvas editing, presenter mode, and PPTX round-tripping.',
    icon: Presentation,
    accentClass: 'powerpoint',
  },
] as const;

const TYPE_ICON = { word: FileText, excel: Table, powerpoint: Presentation } as const;
const TYPE_LABEL = { word: 'Document', excel: 'Spreadsheet', powerpoint: 'Presentation' } as const;

export default function Dashboard({ toggleTheme, isDarkMode }: DashboardProps) {
  const [recentDocs, setRecentDocs] = useState<DocMeta[]>([]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [showAll, setShowAll] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [undoEntries, setUndoEntries] = useState<PendingUndo[]>(() => readPendingUndos());
  const undoTimersRef = useRef(new Map<string, number>());

  const loadRecentDocs = useCallback(async () => {
    try {
      setRecentDocs(await listDocuments());
    } catch (error) {
      console.error('Failed to load recent documents', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listDocuments()
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
    let snapshot: DocumentRecord | undefined;
    try {
      snapshot = await loadDocument(doc.id);
    } catch (error) {
      console.warn('Could not snapshot document before delete', error);
    }

    await deleteDocument(doc.id);
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
      clearDocumentTombstone(id);
      await saveDocument(entry.record.id, entry.record.title, entry.record.type, entry.record.data);
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
      const record = await loadDocument(doc.id);
      if (!record) {
        return;
      }
      await saveDocument(doc.id, nextTitle, doc.type, record.data);
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
    <div className="dashboard">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-brand">
            <div className="dashboard-brand__mark" aria-hidden="true">
              <Sparkles size={24} />
            </div>
            <div>
              <span className="dashboard-brand__eyebrow">Office Workspace</span>
              <span className="dashboard-brand__title">OfficeNinja Suite</span>
            </div>
          </div>
          <div className="dashboard-topbar__actions">
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
      </div>

      <section className="dashboard-hero" aria-labelledby="dashboard-hero-title">
        <div className="dashboard-shell">
          <div className="dashboard-hero-copy">
            <div className="dashboard-hero-copy__text">
              <span className="dashboard-kicker">
                <Sparkles size={14} aria-hidden="true" />
                Documents, sheets and slides
              </span>
              <h1 id="dashboard-hero-title">Everything you are working on, in one place.</h1>
              <p>Files save locally as you type and reopen exactly where you left them.</p>
            </div>

            <nav className="dashboard-hero-actions" aria-label="Create a new file">
              <Link className="btn btn-primary" to="/word">
                <FileText size={16} aria-hidden="true" />
                New document
              </Link>
              <Link className="btn btn-secondary" to="/excel">
                <Table size={16} aria-hidden="true" />
                New spreadsheet
              </Link>
              <Link className="btn btn-secondary" to="/powerpoint">
                <Presentation size={16} aria-hidden="true" />
                New presentation
              </Link>
            </nav>
          </div>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="dashboard-recent-title">
        <div className="dashboard-shell">
          <div className="dashboard-section-header">
            <div>
              <h2 id="dashboard-recent-title">Your files</h2>
              <p>
                {recentDocs.length === 0
                  ? 'Stored locally in this browser.'
                  : `${recentDocs.length} file${recentDocs.length === 1 ? '' : 's'} stored locally in this browser.`}
              </p>
            </div>

            {recentDocs.length > 0 && (
              <div className="dashboard-file-tools">
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
              </div>
            )}
          </div>

          {recentDocs.length === 0 ? (
            <p className="dashboard-empty">No files yet. Create a document, spreadsheet, or presentation to get started.</p>
          ) : visibleDocs.length === 0 ? (
            <p className="dashboard-empty">No files match “{query}”.</p>
          ) : (
            <>
              <div className="recent-grid">
                {shownDocs.map((doc) => {
                  const Icon = TYPE_ICON[doc.type];
                  const isRenaming = renamingId === doc.id;
                  return (
                    <article key={doc.id} className="recent-card">
                      <div className="recent-card__header">
                        <span className="recent-card__type">
                          <Icon size={14} aria-hidden="true" />
                          <span>{TYPE_LABEL[doc.type]}</span>
                        </span>
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
                      </div>

                      <div className="recent-card__file">
                        <div className={`launcher-card__icon ${doc.type}`} aria-hidden="true">
                          <Icon size={20} />
                        </div>
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
                              <Link className="card-stretch-link" to={`/${doc.type}?id=${doc.id}`}>
                                {doc.title}
                              </Link>
                            </h3>
                          )}
                          <p>Updated {formatDate(doc.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="recent-card__footer">
                        <span>Open file</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {(hiddenCount > 0 || showAll) && visibleDocs.length > PAGE_SIZE && (
                <div className="dashboard-section-header" style={{ marginTop: '1rem', marginBottom: 0 }}>
                  <button className="btn btn-secondary" type="button" onClick={() => setShowAll((value) => !value)}>
                    {showAll ? 'Show fewer files' : `Show all ${visibleDocs.length} files`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="dashboard-apps-title">
        <div className="dashboard-shell">
          <div className="dashboard-section-header">
            <div>
              <h2 id="dashboard-apps-title">Start something new</h2>
              <p>Each app opens with its tools, autosave, and mobile layout already in place.</p>
            </div>
          </div>

          <nav className="launcher-grid" aria-label="Open an app">
            {launchCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.type} className="launcher-card">
                  <div className={`launcher-card__icon ${card.accentClass}`} aria-hidden="true">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3>
                      <Link className="card-stretch-link" to={`/${card.type}`}>
                        {card.name}
                      </Link>
                    </h3>
                    <p>{card.title}</p>
                  </div>
                  <p>{card.description}</p>
                  <div className="launcher-card__footer">
                    <span>Open editor</span>
                    <span>{TYPE_LABEL[card.type]}</span>
                  </div>
                </article>
              );
            })}
          </nav>
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
