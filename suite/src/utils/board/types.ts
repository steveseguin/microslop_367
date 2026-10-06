/**
 * NinjaBoard data shapes and the device-sync merge. Kept free of Yjs so that
 * device sync can merge boards without loading the editor libraries.
 */
export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface Column {
  id: string;
  title: string;
  order: number;
  /** Work-in-progress limit; 0 = none. */
  wip: number;
}
export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}
export interface Card {
  id: string;
  /** Short ticket number shown as KEY-12. */
  num: number;
  col: string;
  order: number;
  title: string;
  desc: string;
  labels: string[];
  assignee: string;
  due: string;
  priority: Priority;
  points: number;
  checklist: ChecklistItem[];
  archived: boolean;
  created: number;
  updated: number;
}
export interface Comment {
  id: string;
  card: string;
  text: string;
  by: string;
  ts: number;
}
export interface Label {
  id: string;
  name: string;
  color: string;
}
export interface BoardData {
  id: string;
  title: string;
  /** Ticket prefix, e.g. "NB". */
  key: string;
  created: number;
  updated: number;
  columns: Record<string, Column>;
  cards: Record<string, Card>;
  comments: Record<string, Comment>;
  labels: Record<string, Label>;
}
export interface BoardsWorkspace {
  version: 1;
  boards: BoardData[];
  /** id -> when it was deleted, so device sync does not bring it back. */
  deleted?: Record<string, number>;
}
export const EMPTY_BOARDS: BoardsWorkspace = { version: 1, boards: [] };

/* ---------------- device sync merge ---------------- */

export function mergeBoards(local: BoardsWorkspace | null, remote: BoardsWorkspace): BoardsWorkspace {
  const deleted: Record<string, number> = { ...(local?.deleted ?? {}) };
  for (const [id, t] of Object.entries(remote.deleted ?? {})) deleted[id] = Math.max(deleted[id] ?? 0, t);
  const byId = new Map<string, BoardData>();
  for (const b of [...(local?.boards ?? []), ...(remote.boards ?? [])]) {
    const have = byId.get(b.id);
    if (!have || b.updated > have.updated) byId.set(b.id, b);
  }
  const boards = [...byId.values()].filter((b) => !(deleted[b.id] && deleted[b.id] >= b.updated)).sort((a, b) => b.updated - a.updated);
  return { version: 1, boards, deleted };
}

