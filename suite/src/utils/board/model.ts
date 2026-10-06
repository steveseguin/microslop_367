/**
 * NinjaBoard: Kanban / issue boards.
 *
 * While a board is open it lives in a Y.Doc, so edits from several people at
 * once merge instead of overwriting each other: columns, cards, comments and
 * labels are separate maps keyed by id, and order is a number between its
 * neighbours (moving a card rewrites only that card). On disk a board is plain
 * JSON inside the "boards" workspace.
 */
import * as Y from 'yjs';

import type { BoardData, Card, Column, Comment, Label, Priority } from './types';
export type { BoardData, BoardsWorkspace, Card, ChecklistItem, Column, Comment, Label, Priority } from './types';
export { EMPTY_BOARDS, mergeBoards } from './types';

export const LABEL_COLORS = ['#e5484d', '#f76b15', '#ffb224', '#30a46c', '#12a594', '#0090ff', '#8e4ec6', '#d6409f', '#64748b'];
export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'urgent', label: 'Urgent' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
  { id: 'none', label: 'No priority' },
];

export const uid = (n = 10) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');

export const TEMPLATES = {
  kanban: { name: 'Kanban', columns: ['To do', 'In progress', 'Done'], labels: [['Feature', 5], ['Bug', 0], ['Chore', 8]] },
  scrum: { name: 'Scrum sprint', columns: ['Backlog', 'To do', 'In progress', 'In review', 'Done'], labels: [['Story', 5], ['Bug', 0], ['Task', 4], ['Spike', 6]] },
  bugs: { name: 'Bug tracker', columns: ['Reported', 'Confirmed', 'Fixing', 'Testing', 'Closed'], labels: [['Crash', 0], ['UI', 6], ['Performance', 1], ['Regression', 2]] },
  personal: { name: 'Personal to-do', columns: ['Someday', 'This week', 'Today', 'Done'], labels: [['Home', 3], ['Work', 5], ['Errand', 1]] },
} as const;
export type TemplateId = keyof typeof TEMPLATES;

export function boardKey(title: string) {
  const letters = title
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, '')[0] || '')
    .join('')
    .toUpperCase();
  return (letters.length >= 2 ? letters : title.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'NB').slice(0, 4);
}

export function newBoard(title: string, template: TemplateId): BoardData {
  const now = Date.now();
  const t = TEMPLATES[template];
  const columns: Record<string, Column> = {};
  t.columns.forEach((name, i) => {
    const id = uid();
    columns[id] = { id, title: name, order: i + 1, wip: 0 };
  });
  const labels: Record<string, Label> = {};
  for (const [name, color] of t.labels) {
    const id = uid(6);
    labels[id] = { id, name, color: LABEL_COLORS[color] };
  }
  return { id: `board-${uid(12)}`, title: title.trim() || t.name, key: boardKey(title || t.name), created: now, updated: now, columns, cards: {}, comments: {}, labels };
}

/* ---------------- Y.Doc <-> JSON ---------------- */

const MAPS = ['columns', 'comments', 'labels'] as const;

/** Cards are a map of fields each, so two people editing different fields of one card both win. */
function cardToY(card: Card) {
  const m = new Y.Map<unknown>();
  for (const [k, v] of Object.entries(card)) m.set(k, v);
  return m;
}
function readCard(value: unknown): Card | null {
  if (value instanceof Y.Map) return value.toJSON() as Card;
  return value && typeof value === 'object' ? (value as Card) : null;
}

export function toYDoc(board: BoardData, doc = new Y.Doc()) {
  doc.transact(() => {
    const meta = doc.getMap('meta');
    meta.set('id', board.id);
    meta.set('title', board.title);
    meta.set('key', board.key);
    meta.set('created', board.created);
    for (const name of MAPS) {
      const map = doc.getMap(name);
      for (const [id, value] of Object.entries(board[name] ?? {})) map.set(id, value);
    }
    const cards = doc.getMap('cards');
    for (const [id, card] of Object.entries(board.cards ?? {})) cards.set(id, cardToY(card));
  });
  return doc;
}

export function fromYDoc(doc: Y.Doc, updated = Date.now()): BoardData | null {
  const meta = doc.getMap('meta');
  const id = meta.get('id');
  if (typeof id !== 'string') return null;
  const read = <T,>(name: string) => Object.fromEntries(doc.getMap(name).entries()) as Record<string, T>;
  return {
    id,
    title: String(meta.get('title') ?? 'Untitled board'),
    key: String(meta.get('key') ?? 'NB'),
    created: Number(meta.get('created')) || updated,
    updated,
    columns: read<Column>('columns'),
    cards: Object.fromEntries(
      [...doc.getMap('cards').entries()].flatMap(([id, v]) => {
        const card = readCard(v);
        return card ? [[id, card]] : [];
      }),
    ),
    comments: read<Comment>('comments'),
    labels: read<Label>('labels'),
  };
}

/* ---------------- edits (all go through the doc) ---------------- */

export class BoardEditor {
  readonly doc: Y.Doc;
  constructor(doc: Y.Doc) {
    this.doc = doc;
  }
  private map<T>(name: string) {
    return this.doc.getMap<T>(name);
  }
  get columns() {
    return [...this.map<Column>('columns').values()].sort((a, b) => a.order - b.order);
  }
  private get cardMap() {
    return this.doc.getMap<unknown>('cards');
  }
  get allCards() {
    return [...this.cardMap.values()].map(readCard).filter((c): c is Card => !!c);
  }
  card(id: string) {
    return readCard(this.cardMap.get(id));
  }
  cardsIn(col: string) {
    return this.allCards.filter((c) => c.col === col && !c.archived).sort((a, b) => a.order - b.order);
  }

  setTitle(title: string) {
    this.map('meta').set('title', title.slice(0, 120));
  }
  setKey(key: string) {
    const clean = key.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 5);
    if (clean) this.map('meta').set('key', clean);
  }

  addColumn(title: string) {
    const cols = this.columns;
    const id = uid();
    this.map<Column>('columns').set(id, { id, title: title.trim().slice(0, 60) || 'New column', order: (cols[cols.length - 1]?.order ?? 0) + 1, wip: 0 });
    return id;
  }
  updateColumn(id: string, patch: Partial<Column>) {
    const col = this.map<Column>('columns').get(id);
    if (col) this.map<Column>('columns').set(id, { ...col, ...patch, id });
  }
  /** Delete a column; its cards move to `into` (or are deleted when null). */
  deleteColumn(id: string, into: string | null) {
    this.doc.transact(() => {
      for (const card of this.allCards)
        if (card.col === id) {
          if (into) this.updateCard(card.id, { col: into, order: this.endOrder(into) + card.order / 1e6 });
          else this.deleteCard(card.id);
        }
      this.map('columns').delete(id);
    });
  }
  moveColumn(id: string, toIndex: number) {
    const others = this.columns.filter((c) => c.id !== id);
    this.updateColumn(id, { order: between(others[toIndex - 1]?.order, others[toIndex]?.order) });
  }

  private endOrder(col: string) {
    const list = this.cardsIn(col);
    return list[list.length - 1]?.order ?? 0;
  }
  private nextNum() {
    let max = 0;
    for (const c of this.allCards) max = Math.max(max, c.num || 0);
    return max + 1;
  }

  addCard(col: string, title: string, extra: Partial<Card> = {}) {
    const id = uid();
    const now = Date.now();
    const card: Card = {
      id,
      num: this.nextNum(),
      col,
      order: this.endOrder(col) + 1,
      title: title.trim().slice(0, 300),
      desc: '',
      labels: [],
      assignee: '',
      due: '',
      priority: 'none',
      points: 0,
      checklist: [],
      archived: false,
      created: now,
      updated: now,
      ...extra,
    };
    this.cardMap.set(id, cardToY(card));
    return id;
  }
  updateCard(id: string, patch: Partial<Card>) {
    const value = this.cardMap.get(id);
    if (!value) return;
    this.doc.transact(() => {
      let m = value as Y.Map<unknown>;
      if (!(value instanceof Y.Map)) {
        m = cardToY(value as Card);
        this.cardMap.set(id, m);
      }
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'id') continue;
        if (JSON.stringify(m.get(k)) !== JSON.stringify(v)) m.set(k, v);
      }
      m.set('updated', Date.now());
    });
  }
  /** Put a card at `index` in column `col` (index among the visible cards there). */
  moveCard(id: string, col: string, index: number) {
    const others = this.cardsIn(col).filter((c) => c.id !== id);
    this.updateCard(id, { col, order: between(others[index - 1]?.order, others[index]?.order) });
  }
  deleteCard(id: string) {
    this.doc.transact(() => {
      this.cardMap.delete(id);
      const comments = this.map<Comment>('comments');
      for (const c of [...comments.values()]) if (c.card === id) comments.delete(c.id);
    });
  }
  duplicateCard(id: string) {
    const card = this.card(id);
    if (!card) return '';
    return this.addCard(card.col, `${card.title} (copy)`, {
      desc: card.desc,
      labels: [...card.labels],
      priority: card.priority,
      points: card.points,
      checklist: card.checklist.map((i) => ({ ...i, id: uid(6), done: false })),
    });
  }

  addComment(card: string, text: string, by: string) {
    const id = uid();
    this.map<Comment>('comments').set(id, { id, card, text: text.trim().slice(0, 4000), by: by.slice(0, 40) || 'Someone', ts: Date.now() });
  }
  deleteComment(id: string) {
    this.map('comments').delete(id);
  }

  upsertLabel(label: Label) {
    this.map<Label>('labels').set(label.id, { ...label, name: label.name.slice(0, 30) });
  }
  deleteLabel(id: string) {
    this.doc.transact(() => {
      this.map('labels').delete(id);
      for (const card of this.allCards) if (card.labels.includes(id)) this.updateCard(card.id, { labels: card.labels.filter((l) => l !== id) });
    });
  }
}

/** A number strictly between two neighbours' orders (either may be missing). */
export function between(before?: number, after?: number) {
  if (before === undefined && after === undefined) return 1;
  if (before === undefined) return after! - 1;
  if (after === undefined) return before + 1;
  return (before + after) / 2;
}

/* ---------------- export ---------------- */

export function boardCsv(board: BoardData) {
  const cols = board.columns;
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [['Key', 'Title', 'Status', 'Assignee', 'Priority', 'Points', 'Due', 'Labels', 'Checklist', 'Archived', 'Description']];
  const cards = Object.values(board.cards).sort((a, b) => a.num - b.num);
  for (const c of cards) {
    rows.push([
      `${board.key}-${c.num}`,
      c.title,
      cols[c.col]?.title ?? '',
      c.assignee,
      c.priority === 'none' ? '' : c.priority,
      c.points ? String(c.points) : '',
      c.due,
      c.labels.map((l) => board.labels[l]?.name).filter(Boolean).join('; '),
      c.checklist.length ? `${c.checklist.filter((i) => i.done).length}/${c.checklist.length}` : '',
      c.archived ? 'yes' : '',
      c.desc,
    ]);
  }
  return rows.map((r) => r.map(esc).join(',')).join('\r\n');
}
