import { Link } from 'react-router-dom';
import {
  FileText,
  FolderOpen,
  Moon,
  Pencil,
  PenTool,
  Presentation,
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
import { deleteDesign, designUrl, listDesigns, loadDesign, renameDesign, restoreDesign } from '../utils/blueline';
import type { DesignDocument } from '../utils/blueline';

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
 * ONE set of create actions for the whole page. There used to be two: three
 * buttons in a 300px marketing hero, and three large launcher cards below it
 * carrying feature-list prose. Same three destinations, twice, plus copy nobody
 * reads — which is what made a workspace read as a landing page.
 */
const CREATE_ACTIONS = [
  { type: 'word', label: 'Document', icon: FileText },
  { type: 'excel', label: 'Spreadsheet', icon: Table },
  { type: 'powerpoint', label: 'Presentation', icon: Presentation },
  { type: 'blueline', label: 'Design', icon: PenTool },
] as const;

const TYPE_ICON = { word: FileText, excel: Table, powerpoint: Presentation, blueline: PenTool } as const;
const TYPE_LABEL = { word: 'Document', excel: 'Spreadsheet', powerpoint: 'Presentation', blueline: 'Design' } as const;

async function listWorkspaceFiles(): Promise<DocMeta[]> {
  const results = await Promise.allSettled([listDocuments(), listDesigns()]);
  for (const result of results) {
    if (result.status === 'rejected') console.error('Could not load local files', result.reason);
  }
  return results.flatMap<DocMeta>((result) => result.status === 'fulfilled' ? result.value : [])
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

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
    <div className="dashboard">
      <h1 className="sr-only">OfficeNinja office and design workspace</h1>
      <header className="dashboard-topbar">
        <div className="dashboard-shell dashboard-topbar__inner">
          <span className="dashboard-brand">
            <span className="dashboard-brand__mark" aria-hidden="true">
              N
            </span>
            <span className="dashboard-brand__title">OfficeNinja</span>
          </span>

          <nav className="dashboard-create" aria-label="Create a new file">
            {CREATE_ACTIONS.map(({ type, label, icon: Icon }, index) => (
              <a
                key={type}
                // The per-type modifier is what carries the brand colour. The CSS
                // previously hooked this off `[href$="/word"]`, which worked but lost
                // the colour silently if a route were ever renamed.
                className={`btn ${index === 0 ? 'btn-primary' : 'btn-secondary'} dashboard-create__btn dashboard-create__btn--${type}`}
                href={type === 'blueline' ? designUrl() : `#/${type}`} title={type === 'blueline' ? 'Blueline: vector design and prototyping' : undefined}
                aria-label={`New ${label.toLowerCase()}`}
              >
                <Icon size={16} aria-hidden="true" />
                {/* Two labels, one visible at a time. On a phone the three
                    buttons share one row, and "New presentation" could only
                    ever render as "New pres…"; the accessible name is the same
                    either way (aria-label above). */}
                <span className="dashboard-create__label">New {label.toLowerCase()}</span>
                <span className="dashboard-create__label dashboard-create__label--short" aria-hidden="true">
                  {type === 'blueline' ? 'Blueline' : label}
                </span>
              </a>
            ))}
          </nav>

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
            <div className="dashboard-empty">
              <FolderOpen size={22} aria-hidden="true" />
              <p>
                <strong>No files yet.</strong> Start a document, spreadsheet, presentation or Blueline design — everything you
                make is saved in this browser as you type.
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
                  const Icon = TYPE_ICON[doc.type];
                  const isRenaming = renamingId === doc.id;
                  return (
                    <article key={doc.id} className="recent-card">
                      <div className={`file-icon ${doc.type}`} aria-hidden="true">
                        <Icon size={18} />
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
