import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  Copy,
  Download,
  Flag,
  LayoutList,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Radio,
  Search,
  SquareKanban,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { AppMark } from '../components/AppMark';
import { DictateField } from '../components/Dictate';
import { LiveAvatars, SharePanel } from '../components/LiveShare';
import { appendSpoken } from '../utils/speech';
import { downloadFile, exportJSON, useToolStorage } from '../utils/toolStorage';
import { LiveSession, newLiveInfo, parseLive } from '../utils/live/session';
import type { LiveInfo } from '../utils/live/session';
import { LiveYProvider, Y_SIGNED } from '../utils/live/yjs';
import {
  BoardEditor,
  EMPTY_BOARDS,
  LABEL_COLORS,
  PRIORITIES,
  TEMPLATES,
  boardCsv,
  fromYDoc,
  newBoard,
  toYDoc,
  uid,
} from '../utils/board/model';
import type { BoardData, BoardsWorkspace, Card, Priority, TemplateId } from '../utils/board/model';
import '../styles/tools.css';
import '../styles/board.css';

const NAME_KEY = 'officeninja_meet_name';
function myName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}
const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
};
const todayISO = () => new Date().toISOString().slice(0, 10);
function dueState(due: string) {
  if (!due) return '';
  const today = todayISO();
  if (due < today) return 'overdue';
  const soon = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  return due <= soon ? 'soon' : '';
}
const shortDate = (d: string) => (d ? new Date(`${d}T12:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');
const hue = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 42%)`;
};

/* ======================= boards list ======================= */

function BoardsHome({ store, onOpen }: { store: ReturnType<typeof useToolStorage<BoardsWorkspace>>; onOpen: (id: string) => void }) {
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<TemplateId>('kanban');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [importError, setImportError] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const boards = store.data.boards;

  const create = async () => {
    const board = newBoard(title, template);
    if (await store.update((s) => ({ ...s, boards: [board, ...s.boards] }))) onOpen(board.id);
  };
  const remove = (id: string) =>
    void store.update((s) => ({ ...s, boards: s.boards.filter((b) => b.id !== id), deleted: { ...(s.deleted ?? {}), [id]: Date.now() } }));

  return (
    <>
      <section className="tool-panel board-new">
        <h2>New board</h2>
        <div className="board-new__row">
          <label>
            Name
            <DictateField label="board name" onText={(t) => setTitle((v) => appendSpoken(v, t))}>
              <input value={title} maxLength={120} placeholder="e.g. Website relaunch" onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void create()} />
            </DictateField>
          </label>
          <label>
            Template
            <select value={template} onChange={(e) => setTemplate(e.target.value as TemplateId)}>
              {Object.entries(TEMPLATES).map(([id, t]) => (
                <option key={id} value={id}>
                  {t.name} — {t.columns.join(' · ')}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-primary" disabled={!store.ready} onClick={() => void create()}>
            <Plus size={16} /> Create board
          </button>
        </div>
      </section>
      <div className="board-home-head">
        <h2>Your boards</h2>
        <button type="button" className="btn btn-secondary" disabled={!store.ready} onClick={() => importRef.current?.click()}>
          <Upload size={15} /> Import board
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          hidden
          aria-label="Import a board file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              const parsed = JSON.parse(await file.text());
              const board: BoardData = parsed?.format === 'ninjaoffice-file' ? parsed.data : parsed;
              if (!board || typeof board !== 'object' || !board.columns || !board.cards) throw new Error('bad');
              const copy = { ...board, id: `board-${uid(12)}`, updated: Date.now(), comments: board.comments ?? {}, labels: board.labels ?? {} };
              if (await store.update((s) => ({ ...s, boards: [copy, ...s.boards] }))) onOpen(copy.id);
            } catch {
              setImportError('That file is not a NinjaBoard board.');
            }
          }}
        />
      </div>
      {importError && (
        <div className="tool-alert" role="alert">
          {importError}
        </div>
      )}
      {!boards.length ? (
        <div className="tool-empty">
          <AppMark app="board" size="lg" />
          <h2>No boards yet.</h2>
          <p>Create one above: plan a project, run a sprint, or track bugs. Boards stay in this browser until you share them.</p>
        </div>
      ) : (
        <ul className="board-list">
          {boards.map((b) => {
            const cards = Object.values(b.cards).filter((c) => !c.archived);
            const cols = Object.values(b.columns).sort((x, y) => x.order - y.order);
            const lastCol = cols[cols.length - 1]?.id;
            const done = cards.filter((c) => c.col === lastCol).length;
            return (
              <li key={b.id}>
                <button type="button" className="board-list__open" onClick={() => onOpen(b.id)}>
                  <strong>{b.title}</strong>
                  <span>
                    {cards.length} {cards.length === 1 ? 'card' : 'cards'} · {cols.length} columns · updated {ago(b.updated)}
                  </span>
                  {cards.length > 0 && (
                    <span className="board-list__bar" aria-label={`${done} of ${cards.length} done`}>
                      <span style={{ width: `${(done / cards.length) * 100}%` }} />
                    </span>
                  )}
                </button>
                {confirm === b.id ? (
                  <span className="tool-row">
                    <button type="button" className="btn btn-danger" onClick={() => (remove(b.id), setConfirm(null))}>
                      Delete
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setConfirm(null)}>
                      Keep
                    </button>
                  </span>
                ) : (
                  <button type="button" className="btn btn-secondary btn-icon" aria-label={`Delete ${b.title}`} title="Delete board" onClick={() => setConfirm(b.id)}>
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* ======================= card face ======================= */

function CardFace({ card, board, keyPrefix }: { card: Card; board: BoardData; keyPrefix: string }) {
  const comments = useMemo(() => Object.values(board.comments).filter((c) => c.card === card.id).length, [board.comments, card.id]);
  const done = card.checklist.filter((i) => i.done).length;
  const due = dueState(card.due);
  return (
    <>
      {card.labels.length > 0 && (
        <span className="board-card__labels">
          {card.labels.map((l) =>
            board.labels[l] ? (
              <span key={l} className="board-label" style={{ background: board.labels[l].color }} title={board.labels[l].name}>
                {board.labels[l].name}
              </span>
            ) : null,
          )}
        </span>
      )}
      <span className="board-card__title">{card.title || 'Untitled'}</span>
      <span className="board-card__meta">
        <span className="board-card__key">
          {keyPrefix}-{card.num}
        </span>
        {card.priority !== 'none' && (
          <span className={`board-prio board-prio--${card.priority}`} title={`${card.priority} priority`}>
            <Flag size={12} aria-hidden="true" /> {card.priority}
          </span>
        )}
        {card.due && (
          <span className={`board-due${due ? ` board-due--${due}` : ''}`} title={due === 'overdue' ? 'Overdue' : 'Due'}>
            <CalendarDays size={12} aria-hidden="true" /> {shortDate(card.due)}
          </span>
        )}
        {card.checklist.length > 0 && (
          <span className={done === card.checklist.length ? 'board-check board-check--done' : 'board-check'}>
            <CheckSquare size={12} aria-hidden="true" /> {done}/{card.checklist.length}
          </span>
        )}
        {comments > 0 && (
          <span>
            <MessageSquare size={12} aria-hidden="true" /> {comments}
          </span>
        )}
        {card.points > 0 && <span className="board-points">{card.points}</span>}
        {card.assignee && (
          <span className="board-avatar" style={{ background: hue(card.assignee) }} title={card.assignee}>
            {card.assignee.slice(0, 1).toUpperCase()}
          </span>
        )}
      </span>
    </>
  );
}

/* ======================= card details ======================= */

function CardDetails({
  card,
  board,
  editor,
  readOnly,
  people,
  onClose,
}: {
  card: Card;
  board: BoardData;
  editor: BoardEditor;
  readOnly: boolean;
  people: string[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [desc, setDesc] = useState(card.desc);
  const [newItem, setNewItem] = useState('');
  const [comment, setComment] = useState('');
  const [labelEdit, setLabelEdit] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cols = Object.values(board.columns).sort((a, b) => a.order - b.order);
  const comments = Object.values(board.comments)
    .filter((c) => c.card === card.id)
    .sort((a, b) => a.ts - b.ts);
  const set = (patch: Partial<Card>) => !readOnly && editor.updateCard(card.id, patch);
  const [nameDraft, setNameDraft] = useState('');
  const [named, setNamed] = useState(myName());
  const me = named || 'Someone';

  // Pick up other people's edits to the text fields while they are not being typed in.
  const titleFocus = useRef(false);
  const descFocus = useRef(false);
  useEffect(() => {
    if (!titleFocus.current) setTitle(card.title); // eslint-disable-line react-hooks/set-state-in-effect -- mirrors remote edits
  }, [card.title]);
  useEffect(() => {
    if (!descFocus.current) setDesc(card.desc); // eslint-disable-line react-hooks/set-state-in-effect -- mirrors remote edits
  }, [card.desc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="board-modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="board-modal" role="dialog" aria-modal="true" aria-label={`${board.key}-${card.num} ${card.title}`}>
        <header className="board-modal__head">
          <span className="board-card__key">
            {board.key}-{card.num}
          </span>
          {card.archived && <span className="board-archived">Archived</span>}
          <button type="button" className="btn btn-secondary btn-icon" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <div className="board-modal__body">
          <div className="board-modal__main">
            <label className="sr-only" htmlFor="card-title">
              Title
            </label>
            <textarea
              id="card-title"
              className="board-modal__title"
              rows={1}
              value={title}
              readOnly={readOnly}
              maxLength={300}
              onFocus={() => (titleFocus.current = true)}
              onBlur={() => {
                titleFocus.current = false;
                if (title.trim() && title !== card.title) set({ title: title.trim() });
                else setTitle(card.title);
              }}
              onChange={(e) => setTitle(e.target.value.replace(/\n/g, ' '))}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), (e.target as HTMLTextAreaElement).blur())}
            />
            <h3>Description</h3>
            <DictateField label="description" disabled={readOnly} onText={(t) => set({ desc: appendSpoken(card.desc, t) })}>
              <textarea
                className="board-modal__desc"
                aria-label="Description"
                placeholder={readOnly ? 'No description.' : 'Add details, steps to reproduce, acceptance criteria…'}
                value={desc}
                readOnly={readOnly}
                onFocus={() => (descFocus.current = true)}
                onBlur={() => {
                  descFocus.current = false;
                  if (desc !== card.desc) set({ desc });
                }}
                onChange={(e) => setDesc(e.target.value)}
              />
            </DictateField>

            <h3>
              Checklist
              {card.checklist.length > 0 && (
                <span className="board-muted">
                  {' '}
                  {card.checklist.filter((i) => i.done).length}/{card.checklist.length}
                </span>
              )}
            </h3>
            {card.checklist.length > 0 && (
              <progress
                className="board-modal__progress"
                max={card.checklist.length}
                value={card.checklist.filter((i) => i.done).length}
                aria-label="Checklist progress"
              />
            )}
            <ul className="board-checklist">
              {card.checklist.map((item) => (
                <li key={item.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.done}
                      disabled={readOnly}
                      onChange={() => set({ checklist: card.checklist.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)) })}
                    />
                    <span className={item.done ? 'board-done' : ''}>{item.text}</span>
                  </label>
                  {!readOnly && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      aria-label={`Remove ${item.text}`}
                      onClick={() => set({ checklist: card.checklist.filter((i) => i.id !== item.id) })}
                    >
                      <X size={13} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!readOnly && (
              <form
                className="board-inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newItem.trim()) return;
                  set({ checklist: [...card.checklist, { id: uid(6), text: newItem.trim().slice(0, 200), done: false }] });
                  setNewItem('');
                }}
              >
                <input aria-label="New checklist item" placeholder="Add an item" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                <button type="submit" className="btn btn-secondary" disabled={!newItem.trim()}>
                  Add
                </button>
              </form>
            )}

            <h3>Comments</h3>
            <ul className="board-comments">
              {comments.map((c) => (
                <li key={c.id}>
                  <span className="board-avatar" style={{ background: hue(c.by) }}>
                    {c.by.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="board-comments__by">
                      <strong>{c.by}</strong> <span className="board-muted">{ago(c.ts)}</span>
                      {!readOnly && c.by === me && (
                        <button type="button" className="board-link-btn" onClick={() => editor.deleteComment(c.id)}>
                          Delete
                        </button>
                      )}
                    </p>
                    <p className="board-comments__text">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            {!readOnly && !named && (
              <form
                className="board-inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = nameDraft.trim().slice(0, 32);
                  if (!n) return;
                  try {
                    localStorage.setItem(NAME_KEY, n);
                  } catch {
                    /* just for this visit */
                  }
                  setNamed(n);
                }}
              >
                <input aria-label="Your name" placeholder="Your name, shown on your comments" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
                <button type="submit" className="btn btn-secondary" disabled={!nameDraft.trim()}>
                  Save
                </button>
              </form>
            )}
            {!readOnly && named && (
              <form
                className="board-inline-form board-inline-form--comment"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!comment.trim()) return;
                  editor.addComment(card.id, comment, me);
                  setComment('');
                }}
              >
                <DictateField label="comment" onText={(t) => setComment((v) => appendSpoken(v, t))}>
                  <textarea aria-label="Write a comment" rows={2} placeholder={`Comment as ${me}`} value={comment} onChange={(e) => setComment(e.target.value)} />
                </DictateField>
                <button type="submit" className="btn btn-primary" disabled={!comment.trim()}>
                  Comment
                </button>
              </form>
            )}
          </div>

          <aside className="board-modal__side">
            <label>
              Status
              <select
                value={card.col}
                disabled={readOnly}
                onChange={(e) => !readOnly && editor.moveCard(card.id, e.target.value, editor.cardsIn(e.target.value).length)}
              >
                {cols.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Assignee
              <input
                list="board-people"
                value={card.assignee}
                readOnly={readOnly}
                placeholder="Unassigned"
                maxLength={40}
                onChange={(e) => set({ assignee: e.target.value })}
              />
              <datalist id="board-people">
                {people.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </label>
            <label>
              Priority
              <select value={card.priority} disabled={readOnly} onChange={(e) => set({ priority: e.target.value as Priority })}>
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input type="date" value={card.due} readOnly={readOnly} onChange={(e) => set({ due: e.target.value })} />
            </label>
            <label>
              Story points
              <input
                type="number"
                min={0}
                max={100}
                value={card.points || ''}
                readOnly={readOnly}
                placeholder="—"
                onChange={(e) => set({ points: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              />
            </label>
            <div className="board-modal__labels">
              <span className="board-side-title">
                <Tag size={13} aria-hidden="true" /> Labels
                {!readOnly && (
                  <button type="button" className="board-link-btn" onClick={() => setLabelEdit((v) => !v)}>
                    {labelEdit ? 'Done' : 'Edit'}
                  </button>
                )}
              </span>
              <div className="board-label-picker">
                {Object.values(board.labels).map((l) => {
                  const on = card.labels.includes(l.id);
                  return (
                    <span key={l.id} className="board-label-option">
                      <button
                        type="button"
                        aria-pressed={on}
                        disabled={readOnly}
                        className={on ? 'board-label board-label--on' : 'board-label board-label--off'}
                        style={on ? { background: l.color } : { borderColor: l.color, color: l.color }}
                        onClick={() => set({ labels: on ? card.labels.filter((x) => x !== l.id) : [...card.labels, l.id] })}
                      >
                        {l.name}
                      </button>
                      {labelEdit && (
                        <button type="button" className="board-link-btn" aria-label={`Delete label ${l.name}`} onClick={() => editor.deleteLabel(l.id)}>
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              {labelEdit && (
                <form
                  className="board-inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newLabel.trim()) return;
                    const used = Object.values(board.labels).map((l) => l.color);
                    const color = LABEL_COLORS.find((c) => !used.includes(c)) ?? LABEL_COLORS[Object.keys(board.labels).length % LABEL_COLORS.length];
                    editor.upsertLabel({ id: uid(6), name: newLabel.trim(), color });
                    setNewLabel('');
                  }}
                >
                  <input aria-label="New label" placeholder="New label" maxLength={30} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                  <button type="submit" className="btn btn-secondary" disabled={!newLabel.trim()}>
                    Add
                  </button>
                </form>
              )}
            </div>
            {!readOnly && (
              <div className="board-modal__actions">
                <button type="button" className="btn btn-secondary" onClick={() => (editor.duplicateCard(card.id), onClose())}>
                  <Copy size={15} /> Duplicate
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => set({ archived: !card.archived })}>
                  {card.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />} {card.archived ? 'Restore' : 'Archive'}
                </button>
                {confirmDelete ? (
                  <button type="button" className="btn btn-danger" onClick={() => (editor.deleteCard(card.id), onClose())}>
                    Delete for good
                  </button>
                ) : (
                  <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={15} /> Delete
                  </button>
                )}
              </div>
            )}
            <p className="board-muted board-modal__dates">
              Created {ago(card.created)}
              <br />
              Updated {ago(card.updated)}
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}

/* ======================= drag and drop ======================= */

interface Drag {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
  col: string;
  index: number;
}

function useCardDrag(enabled: boolean, onDrop: (id: string, col: string, index: number) => void, scroller: React.RefObject<HTMLDivElement | null>) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClick = useRef(false);

  const locate = useCallback((x: number, y: number, id: string) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-col]');
    if (!el) return null;
    const cards = [...el.querySelectorAll<HTMLElement>('[data-card]')].filter((c) => c.dataset.card !== id);
    let index = 0;
    for (const c of cards) {
      const r = c.getBoundingClientRect();
      if (y > r.top + r.height / 2) index++;
    }
    return { col: el.dataset.col!, index };
  }, []);

  const start = (e: ReactPointerEvent<HTMLElement>, id: string, col: string, index: number) => {
    if (!enabled || e.button !== 0) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const touch = e.pointerType === 'touch';
    let begun = false;
    let timer = 0;
    const begin = (x: number, y: number) => {
      begun = true;
      suppressClick.current = true;
      const d: Drag = { id, x, y, dx: sx - rect.left, dy: sy - rect.top, w: rect.width, h: rect.height, col, index };
      dragRef.current = d;
      setDrag(d);
      if (touch && navigator.vibrate) navigator.vibrate(15);
    };
    const move = (ev: PointerEvent) => {
      if (!begun) {
        const far = Math.hypot(ev.clientX - sx, ev.clientY - sy) > (touch ? 10 : 5);
        if (touch) {
          if (far) cleanup(); // a scroll, not a drag
          return;
        }
        if (!far) return;
        begin(ev.clientX, ev.clientY);
      }
      const at = locate(ev.clientX, ev.clientY, id);
      const prev = dragRef.current!;
      const next = { ...prev, x: ev.clientX, y: ev.clientY, ...(at ?? {}) };
      dragRef.current = next;
      setDrag(next);
      // Scroll the board sideways near its edges.
      const box = scroller.current?.getBoundingClientRect();
      if (box && scroller.current) {
        if (ev.clientX < box.left + 48) scroller.current.scrollLeft -= 14;
        else if (ev.clientX > box.right - 48) scroller.current.scrollLeft += 14;
      }
    };
    const blockScroll = (ev: TouchEvent) => begun && ev.preventDefault();
    const up = () => {
      const d = dragRef.current;
      cleanup();
      if (begun && d) onDrop(d.id, d.col, d.index);
      window.setTimeout(() => (suppressClick.current = false), 0);
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', blockScroll);
      dragRef.current = null;
      setDrag(null);
    };
    const cancel = () => {
      cleanup();
      suppressClick.current = false;
    };
    if (touch) timer = window.setTimeout(() => begin(sx, sy), 280);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', blockScroll, { passive: false });
  };

  return { drag, start, suppressClick };
}

/* ======================= the board ======================= */

type View = 'board' | 'list';

function BoardView({
  doc,
  readOnly,
  header,
  onMessage,
}: {
  doc: Y.Doc;
  readOnly: boolean;
  header: ReactNode;
  onMessage: (m: string) => void;
}) {
  const editor = useMemo(() => new BoardEditor(doc), [doc]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    doc.on('update', bump);
    return () => doc.off('update', bump);
  }, [doc]);
  const board = useMemo(() => fromYDoc(doc), [doc, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const [view, setView] = useState<View>('board');
  const [query, setQuery] = useState('');
  const [label, setLabel] = useState('');
  const [assignee, setAssignee] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [colMenu, setColMenu] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newCol, setNewCol] = useState('');
  const [sort, setSort] = useState<{ key: 'num' | 'title' | 'status' | 'assignee' | 'priority' | 'due'; dir: 1 | -1 }>({ key: 'num', dir: 1 });
  const scroller = useRef<HTMLDivElement>(null);
  const { drag, start, suppressClick } = useCardDrag(!readOnly, (id, col, index) => editor.moveCard(id, col, index), scroller);

  if (!board) return null;
  const columns = Object.values(board.columns).sort((a, b) => a.order - b.order);
  const allCards = Object.values(board.cards);
  const people = [...new Set([myName(), ...allCards.map((c) => c.assignee)].filter(Boolean))].sort();
  const q = query.trim().toLowerCase();
  const visible = (c: Card) =>
    (!q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || `${board.key}-${c.num}`.toLowerCase() === q) &&
    (!label || c.labels.includes(label)) &&
    (!assignee || (assignee === '-' ? !c.assignee : c.assignee === assignee));
  const filtering = !!(q || label || assignee);
  const card = openCard ? board.cards[openCard] : null;
  const prioRank: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

  const listCards = allCards
    .filter((c) => (showArchived || !c.archived) && visible(c))
    .sort((a, b) => {
      const k = sort.key;
      const va =
        k === 'num' ? a.num : k === 'title' ? a.title.toLowerCase() : k === 'status' ? board.columns[a.col]?.order ?? 0 : k === 'assignee' ? a.assignee.toLowerCase() : k === 'priority' ? prioRank[a.priority] : a.due || '9999';
      const vb =
        k === 'num' ? b.num : k === 'title' ? b.title.toLowerCase() : k === 'status' ? board.columns[b.col]?.order ?? 0 : k === 'assignee' ? b.assignee.toLowerCase() : k === 'priority' ? prioRank[b.priority] : b.due || '9999';
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  const th = (key: typeof sort.key, text: string) => (
    <th aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
      <button type="button" onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))}>
        {text}
        {sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );

  const addCard = (col: string) => {
    if (!draft.trim()) return;
    editor.addCard(col, draft);
    setDraft('');
  };

  return (
    <div className="board-view">
      <div className="board-bar">
        {header}
        <div className="board-bar__tools">
          <div className="board-view-toggle" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')}>
              <SquareKanban size={15} /> Board
            </button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
              <LayoutList size={15} /> List
            </button>
          </div>
          <span className="board-search">
            <Search size={14} aria-hidden="true" />
            <input type="search" aria-label="Search cards" placeholder="Search cards" value={query} onChange={(e) => setQuery(e.target.value)} />
          </span>
          <select aria-label="Filter by label" value={label} onChange={(e) => setLabel(e.target.value)}>
            <option value="">All labels</option>
            {Object.values(board.labels).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select aria-label="Filter by assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Everyone</option>
            <option value="-">Unassigned</option>
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {filtering && (
            <button type="button" className="btn btn-secondary" onClick={() => (setQuery(''), setLabel(''), setAssignee(''))}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {view === 'board' ? (
        <div className={`board-columns${drag ? ' board-columns--dragging' : ''}`} ref={scroller}>
          {columns.map((col, ci) => {
            const cards = editor.cardsIn(col.id);
            const shown = cards.filter(visible);
            const over = col.wip > 0 && cards.length > col.wip;
            let slot = -1;
            if (drag && drag.col === col.id) slot = drag.index;
            const rendered = shown.filter((c) => c.id !== drag?.id);
            return (
              <section key={col.id} className={`board-col${over ? ' board-col--over' : ''}`} data-col={col.id} aria-label={col.title}>
                <header className="board-col__head">
                  {renaming === col.id ? (
                    <input
                      autoFocus
                      aria-label="Column name"
                      defaultValue={col.title}
                      maxLength={60}
                      onBlur={(e) => {
                        if (e.target.value.trim()) editor.updateColumn(col.id, { title: e.target.value.trim() });
                        setRenaming(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                    />
                  ) : (
                    <h3 onDoubleClick={() => !readOnly && setRenaming(col.id)}>{col.title}</h3>
                  )}
                  <span className="board-col__count" title={col.wip ? `Limit ${col.wip}` : undefined}>
                    {cards.length}
                    {col.wip ? `/${col.wip}` : ''}
                  </span>
                  {!readOnly && (
                    <span className="board-col__menu">
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        aria-label={`${col.title} options`}
                        aria-expanded={colMenu === col.id}
                        onClick={() => setColMenu((m) => (m === col.id ? null : col.id))}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {colMenu === col.id && (
                        <div className="board-menu" role="menu" onMouseLeave={() => setColMenu(null)}>
                          <button type="button" role="menuitem" onClick={() => (setRenaming(col.id), setColMenu(null))}>
                            Rename
                          </button>
                          <label className="board-menu__field">
                            Card limit
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={col.wip || ''}
                              placeholder="none"
                              onChange={(e) => editor.updateColumn(col.id, { wip: Math.max(0, Math.min(99, Number(e.target.value) || 0)) })}
                            />
                          </label>
                          <button type="button" role="menuitem" disabled={ci === 0} onClick={() => (editor.moveColumn(col.id, ci - 1), setColMenu(null))}>
                            <ArrowLeft size={14} /> Move left
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={ci === columns.length - 1}
                            onClick={() => (editor.moveColumn(col.id, ci + 1), setColMenu(null))}
                          >
                            <ArrowRight size={14} /> Move right
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="board-menu__danger"
                            disabled={columns.length < 2}
                            onClick={() => {
                              const into = columns.find((c) => c.id !== col.id)!;
                              editor.deleteColumn(col.id, into.id);
                              onMessage(cards.length ? `Deleted "${col.title}". Its ${cards.length} cards moved to "${into.title}".` : `Deleted "${col.title}".`);
                              setColMenu(null);
                            }}
                          >
                            <Trash2 size={14} /> Delete column
                          </button>
                        </div>
                      )}
                    </span>
                  )}
                </header>
                <ol className="board-col__cards">
                  {rendered.map((c, i) => (
                    <FragmentWithSlot key={c.id} slot={slot === i && drag ? drag.h : 0}>
                      <li
                        className="board-card"
                        data-card={c.id}
                        onPointerDown={(e) => start(e, c.id, col.id, cards.indexOf(c))}
                      >
                        <button
                          type="button"
                          className="board-card__open"
                          aria-label={`${board.key}-${c.num}: ${c.title}`}
                          onClick={() => !suppressClick.current && setOpenCard(c.id)}
                        >
                          <CardFace card={c} board={board} keyPrefix={board.key} />
                        </button>
                      </li>
                    </FragmentWithSlot>
                  ))}
                  {drag && drag.col === col.id && slot >= rendered.length && <li className="board-slot" style={{ height: drag.h }} aria-hidden="true" />}
                </ol>
                {!readOnly &&
                  (adding === col.id ? (
                    <form
                      className="board-add"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addCard(col.id);
                      }}
                    >
                      <DictateField label="card title" onText={(t) => setDraft((v) => appendSpoken(v, t))}>
                        <textarea
                          autoFocus
                          aria-label={`New card in ${col.title}`}
                          placeholder="What needs doing?"
                          rows={2}
                          value={draft}
                          maxLength={300}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              addCard(col.id);
                            }
                            if (e.key === 'Escape') setAdding(null);
                          }}
                        />
                      </DictateField>
                      <div className="tool-row">
                        <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
                          Add card
                        </button>
                        <button type="button" className="btn btn-secondary btn-icon" aria-label="Stop adding" onClick={() => (setAdding(null), setDraft(''))}>
                          <X size={15} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" className="board-add-btn" onClick={() => (setAdding(col.id), setDraft(''))}>
                      <Plus size={15} /> Add a card
                    </button>
                  ))}
                {filtering && shown.length < cards.length && (
                  <p className="board-muted board-col__hidden">{cards.length - shown.length} hidden by filters</p>
                )}
              </section>
            );
          })}
          {!readOnly && (
            <form
              className="board-col board-col--new"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCol.trim()) return;
                editor.addColumn(newCol);
                setNewCol('');
              }}
            >
              <input aria-label="New column name" placeholder="+ Add a column" value={newCol} maxLength={60} onChange={(e) => setNewCol(e.target.value)} />
              {newCol.trim() && (
                <button type="submit" className="btn btn-primary">
                  Add column
                </button>
              )}
            </form>
          )}
        </div>
      ) : (
        <div className="board-table-wrap">
          <table className="board-table">
            <thead>
              <tr>
                {th('num', 'Key')}
                {th('title', 'Title')}
                {th('status', 'Status')}
                {th('assignee', 'Assignee')}
                {th('priority', 'Priority')}
                {th('due', 'Due')}
                <th>Labels</th>
              </tr>
            </thead>
            <tbody>
              {listCards.map((c) => (
                <tr key={c.id} className={c.archived ? 'board-table__archived' : undefined}>
                  <td className="board-card__key">
                    {board.key}-{c.num}
                  </td>
                  <td>
                    <button type="button" className="board-link-btn board-table__title" onClick={() => setOpenCard(c.id)}>
                      {c.title || 'Untitled'}
                    </button>
                  </td>
                  <td>
                    <span className="board-status">{board.columns[c.col]?.title ?? '—'}</span>
                  </td>
                  <td>{c.assignee || <span className="board-muted">—</span>}</td>
                  <td>{c.priority === 'none' ? <span className="board-muted">—</span> : <span className={`board-prio board-prio--${c.priority}`}>{c.priority}</span>}</td>
                  <td className={dueState(c.due) ? `board-due--${dueState(c.due)}` : undefined}>{shortDate(c.due) || <span className="board-muted">—</span>}</td>
                  <td>
                    {c.labels.map((l) =>
                      board.labels[l] ? (
                        <span key={l} className="board-label" style={{ background: board.labels[l].color }}>
                          {board.labels[l].name}
                        </span>
                      ) : null,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!listCards.length && <p className="tool-muted board-table__empty">No cards match.</p>}
          <label className="board-archived-toggle">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived cards
          </label>
        </div>
      )}

      {drag && board.cards[drag.id] && (
        <div className="board-card board-card--ghost" style={{ width: drag.w, transform: `translate(${drag.x - drag.dx}px, ${drag.y - drag.dy}px) rotate(2deg)` }}>
          <span className="board-card__open">
            <CardFace card={board.cards[drag.id]} board={board} keyPrefix={board.key} />
          </span>
        </div>
      )}

      {card && <CardDetails key={card.id} card={card} board={board} editor={editor} readOnly={readOnly} people={people} onClose={() => setOpenCard(null)} />}
    </div>
  );
}

function FragmentWithSlot({ slot, children }: { slot: number; children: ReactNode }) {
  return (
    <>
      {slot > 0 && <li className="board-slot" style={{ height: slot }} aria-hidden="true" />}
      {children}
    </>
  );
}

/* ======================= an open board (own or shared) ======================= */

function OpenBoard({
  store,
  boardId,
  liveParam,
  onBack,
  onMessage,
}: {
  store: ReturnType<typeof useToolStorage<BoardsWorkspace>>;
  boardId: string | null;
  liveParam: LiveInfo | null;
  onBack: () => void;
  onMessage: (m: string) => void;
}) {
  const stored = boardId ? store.data.boards.find((b) => b.id === boardId) : undefined;
  const [doc] = useState(() => (stored ? toYDoc(stored) : new Y.Doc()));
  const [live, setLive] = useState<{ session: LiveSession; provider: LiveYProvider; guest: boolean; info: LiveInfo } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [synced, setSynced] = useState(!liveParam);
  const [saveAsCopy, setSaveAsCopy] = useState(false);
  const [, bump] = useState(0);
  const guest = !!liveParam;

  // Save every change into this browser's boards (guests only once they ask).
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  });
  useEffect(() => {
    let timer = 0;
    const save = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (guest && !saveAsCopy) return;
        const board = fromYDoc(doc);
        if (!board) return;
        void storeRef.current.update((s) => {
          const others = s.boards.filter((b) => b.id !== board.id);
          return { ...s, boards: [board, ...others] };
        });
      }, 500);
    };
    doc.on('update', save);
    if (saveAsCopy) save();
    return () => {
      window.clearTimeout(timer);
      doc.off('update', save);
    };
  }, [doc, guest, saveAsCopy]);

  // Guests join straight away.
  useEffect(() => {
    if (!liveParam) return;
    const session = new LiveSession(liveParam, myName(), Y_SIGNED);
    const provider = new LiveYProvider(session, doc, false);
    const onSync = () => setSynced(true);
    const onStatus = () => bump((n) => n + 1);
    session.addEventListener('synced', onSync);
    session.addEventListener('status', onStatus);
    setLive({ session, provider, guest: true, info: liveParam }); // eslint-disable-line react-hooks/set-state-in-effect -- the session is an outside system created here
    void session.connect();
    return () => {
      session.removeEventListener('synced', onSync);
      session.removeEventListener('status', onStatus);
      provider.destroy();
      session.close();
    };
  }, [liveParam, doc]);

  const liveRef = useRef(live);
  useEffect(() => {
    liveRef.current = live;
  }, [live]);
  useEffect(
    () => () => {
      const l = liveRef.current;
      if (l && !l.guest) {
        l.provider.destroy();
        l.session.close();
      }
    },
    [],
  );

  const startSharing = async () => {
    if (live) return live.session.status === 'live' ? live.info : null;
    const id = fromYDoc(doc)?.id ?? 'board';
    const key = `officeninja_live:${id}`;
    let info: LiveInfo | null = null;
    try {
      info = JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      info = null;
    }
    if (!info?.room) {
      info = newLiveInfo('bd');
      try {
        localStorage.setItem(key, JSON.stringify(info));
      } catch {
        /* links just change next time */
      }
    }
    const session = new LiveSession(info, myName(), Y_SIGNED, { relay: true });
    const provider = new LiveYProvider(session, doc, true);
    const onStatus = () => bump((n) => n + 1);
    session.addEventListener('status', onStatus);
    setLive({ session, provider, guest: false, info });
    await session.connect();
    return session.status === 'live' ? info : null;
  };
  const stopSharing = () => {
    live?.provider.destroy();
    live?.session.close();
    setLive(null);
    setShareOpen(false);
  };

  if (!boardId && !liveParam) return null;
  if (boardId && !stored && !guest) {
    return (
      <div className="tool-empty">
        <h2>This board is not in this browser.</h2>
        <button type="button" className="btn btn-primary" onClick={onBack}>
          See your boards
        </button>
      </div>
    );
  }
  const meta = doc.getMap('meta');
  const readOnly = guest && (live?.session.mode === 'view' || !synced);
  const board = synced ? fromYDoc(doc) : null;

  const header = (
    <div className="board-title-row">
      <button type="button" className="btn btn-secondary btn-icon" aria-label="All boards" title="All boards" onClick={onBack}>
        <ChevronLeft size={16} />
      </button>
      <label className="sr-only" htmlFor="board-title">
        Board name
      </label>
      <input
        id="board-title"
        key={String(meta.get('title'))}
        className="board-title"
        defaultValue={String(meta.get('title') ?? '')}
        readOnly={readOnly}
        maxLength={120}
        onBlur={(e) => e.target.value.trim() && e.target.value !== meta.get('title') && new BoardEditor(doc).setTitle(e.target.value.trim())}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      <span className="board-title-row__actions">
        <LiveAvatars session={live?.session ?? null} onClick={() => setShareOpen(true)} />
        {!guest && (
          <button type="button" className="btn btn-secondary" onClick={() => setShareOpen((v) => !v)} title="Work on this board together live, or let people watch">
            <Radio size={15} /> Share
          </button>
        )}
        {board && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              title="Export as JSON (re-importable)"
              aria-label="Export board as JSON"
              onClick={() => exportJSON(`${board.title || 'board'}.board.json`, board)}
            >
              <Download size={15} />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              title="Export cards as a spreadsheet"
              onClick={() => downloadFile(`${board.title || 'board'}.csv`, boardCsv(board), 'text/csv')}
            >
              CSV
            </button>
          </>
        )}
      </span>
    </div>
  );

  return (
    <>
      {shareOpen && (
        <SharePanel session={live?.session ?? null} route="/board" start={startSharing} stop={stopSharing} onClose={() => setShareOpen(false)} guest={guest} />
      )}
      {guest && (
        <div className="live-banner" role="status">
          <strong>{live?.session.mode === 'view' ? 'Viewing live' : 'Editing live'}</strong>
          <span>
            {live?.session.status === 'error'
              ? live.session.error
              : synced
                ? 'Changes appear for everyone instantly.'
                : 'Connecting to the shared board… the person who shared it needs to have it open.'}
          </span>
          {!saveAsCopy ? (
            <button type="button" className="btn btn-secondary" disabled={!synced} onClick={() => setSaveAsCopy(true)}>
              Save a copy to my boards
            </button>
          ) : (
            <span>Saved to your boards; it keeps updating while you are here.</span>
          )}
        </div>
      )}
      {board ? (
        <BoardView doc={doc} readOnly={readOnly} header={header} onMessage={onMessage} />
      ) : (
        <p className="tool-muted">Waiting for the board…</p>
      )}
    </>
  );
}

/* ======================= page ======================= */

export default function BoardPage(props: ToolProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const isNew = params.get('new');
  const [liveParam] = useState(() => parseLive(params.get('live')));
  const store = useToolStorage<BoardsWorkspace>('boards', EMPTY_BOARDS);
  const [message, setMessage] = useState('');

  // #/board?new=1 (the workspace's "New board"): make a Kanban board and open it.
  const creating = useRef(false);
  useEffect(() => {
    if (!isNew || !store.ready || creating.current) return;
    creating.current = true;
    const template = (params.get('template') as TemplateId) || 'kanban';
    const board = newBoard('', TEMPLATES[template] ? template : 'kanban');
    void store.update((s) => ({ ...s, boards: [board, ...s.boards] })).then((ok) => ok && navigate(`/board?id=${board.id}`, { replace: true }));
  }, [isNew, store, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = !!id || !!liveParam;
  return (
    <ToolShell
      {...props}
      name="NinjaBoard"
      subtitle="Plan projects, run sprints and track bugs on Kanban boards. Share a board and work on it together live."
      status={store.status}
      error={store.error}
      compact={open}
    >
      {message && (
        <div className="tool-alert" role="status">
          {message}
          <button type="button" className="btn btn-secondary btn-icon" aria-label="Dismiss" onClick={() => setMessage('')}>
            <X size={14} />
          </button>
        </div>
      )}
      {!store.ready ? (
        <p className="tool-muted">Loading…</p>
      ) : open ? (
        <OpenBoard key={id ?? 'live'} store={store} boardId={id} liveParam={liveParam} onBack={() => navigate('/board')} onMessage={setMessage} />
      ) : isNew ? (
        <p className="tool-muted">Creating a board…</p>
      ) : (
        <BoardsHome store={store} onOpen={(boardId) => navigate(`/board?id=${boardId}`)} />
      )}
    </ToolShell>
  );
}
