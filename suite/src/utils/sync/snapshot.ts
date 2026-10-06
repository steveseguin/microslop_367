/**
 * Everything OfficeNinja stores, as a list of sync items, plus a merge that
 * applies items from a backup or another device safely:
 *
 *  - office documents and Blueline designs: newer wins per document; identical
 *    content is skipped (so two devices never ping-pong a save);
 *  - notes and time tracking: merged per note / entry / invoice, deletions kept;
 *  - single-file tools (PDF, image, SVG): newer workspace wins.
 *
 * Nothing here talks to a network. Transports (backup file, folder, peer to
 * peer) only move these items around.
 */
import { mergeBoards } from '../board/types';
import type { BoardsWorkspace } from '../board/types';
import {
  deleteDocument,
  listDocumentTombstones,
  listDocuments,
  loadDocument,
  saveDocument,
} from '../db';
import type { OfficeDocumentType } from '../db';
import { allDesignFiles, putDesignIfNewer } from '../blueline';
import type { DesignFile } from '../blueline';
import { readToolRecord, writeToolWorkspace } from '../toolStorage';

export const TOOL_KEYS = ['notes', 'time', 'pdf', 'image', 'svg', 'boards'] as const;
type ToolKey = (typeof TOOL_KEYS)[number];
const MERGEABLE = new Set<string>(['tool:notes', 'tool:time', 'tool:boards']);

export interface SyncItem {
  /** `doc:<id>`, `tool:<key>` or `design:<id>`. */
  key: string;
  /** When this version was saved (ms). */
  t: number;
  value: unknown;
}
export interface ManifestEntry {
  key: string;
  t: number;
  h: string;
  /** Short label for the UI ("Budget.xlsx", "Notes"). */
  label: string;
}
export interface Manifest {
  entries: ManifestEntry[];
  deletedDocs: Record<string, number>;
}
export interface Snapshot {
  app: 'officeninja';
  v: 1;
  created: number;
  device: string;
  items: SyncItem[];
  deletedDocs: Record<string, number>;
}
export interface ApplyReport {
  added: number;
  updated: number;
  merged: number;
  deleted: number;
  skipped: number;
  conflicts: number;
  failed: number;
}
export const emptyReport = (): ApplyReport => ({
  added: 0,
  updated: 0,
  merged: 0,
  deleted: 0,
  skipped: 0,
  conflicts: 0,
  failed: 0,
});

/* ---------------- binary-safe JSON ---------------- */

function toBase64(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromBase64(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** JSON that survives Uint8Array (PDFs, PNGs). */
export function encodeJson(value: unknown) {
  return JSON.stringify(value, (_k, v) =>
    v instanceof Uint8Array ? { $u8: toBase64(v) } : v,
  );
}
export function decodeJson<T = unknown>(text: string): T {
  return JSON.parse(text, (_k, v) =>
    v && typeof v === 'object' && typeof v.$u8 === 'string' && Object.keys(v).length === 1
      ? fromBase64(v.$u8)
      : v,
  ) as T;
}

export async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ---------------- device identity ---------------- */

export function deviceInfo(): { id: string; name: string } {
  const key = 'officeninja_device';
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved?.id) return saved;
  } catch {
    /* fall through */
  }
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad/.test(ua)
      ? 'iOS'
      : /Mac OS/.test(ua)
        ? 'Mac'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'device';
  const info = {
    id: Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join(''),
    name: `${browser} on ${os}`,
  };
  try {
    localStorage.setItem(key, JSON.stringify(info));
  } catch {
    /* storage blocked: a fresh id per session is fine */
  }
  return info;
}

export function renameDevice(name: string) {
  const info = { ...deviceInfo(), name: name.trim().slice(0, 40) || deviceInfo().name };
  try {
    localStorage.setItem('officeninja_device', JSON.stringify(info));
  } catch {
    /* ignore */
  }
  return info;
}

/* ---------------- collecting ---------------- */

const TOOL_LABEL: Record<ToolKey, string> = {
  notes: 'NinjaNotes',
  time: 'NinjaTime',
  pdf: 'NinjaPDF draft',
  image: 'NinjaImage photo',
  svg: 'NinjaSVG drawing',
  boards: 'NinjaBoard boards',
};

interface Source {
  key: string;
  t: number;
  label: string;
  load: () => Promise<unknown>;
}

/** Every item, without loading contents yet. */
async function sources(): Promise<Source[]> {
  const out: Source[] = [];
  for (const meta of await listDocuments().catch(() => [])) {
    out.push({
      key: `doc:${meta.id}`,
      t: meta.updatedAt,
      label: meta.title,
      load: async () => {
        const record = await loadDocument(meta.id);
        return record ? { id: meta.id, title: record.title, type: record.type, data: record.data } : null;
      },
    });
  }
  for (const key of TOOL_KEYS) {
    const record = await readToolRecord<unknown>(key);
    if (!record) continue;
    const empty =
      (key === 'pdf' && !(record.data as { bytes?: unknown })?.bytes) ||
      (key === 'image' && !(record.data as { png?: unknown })?.png);
    if (empty) continue;
    out.push({ key: `tool:${key}`, t: record.savedAt ?? 0, label: TOOL_LABEL[key], load: async () => record.data });
  }
  for (const file of await allDesignFiles().catch(() => [] as DesignFile[])) {
    out.push({
      key: `design:${file.id}`,
      t: Number(file.updated) || 0,
      label: String(file.name || 'Design'),
      load: async () => file,
    });
  }
  return out;
}

const hashCache = new Map<string, string>();

/** What this device has, with content hashes (cached per version). */
export async function buildManifest(): Promise<Manifest> {
  const entries: ManifestEntry[] = [];
  for (const s of await sources()) {
    const cacheKey = `${s.key}@${s.t}`;
    let h = hashCache.get(cacheKey);
    if (!h) {
      const value = await s.load().catch(() => null);
      if (value === null) continue;
      h = await sha256(encodeJson(value));
      hashCache.set(cacheKey, h);
    }
    entries.push({ key: s.key, t: s.t, h, label: s.label });
  }
  return { entries, deletedDocs: listDocumentTombstones() };
}

export async function loadItem(key: string): Promise<SyncItem | null> {
  const s = (await sources()).find((x) => x.key === key);
  if (!s) return null;
  const value = await s.load().catch(() => null);
  return value === null ? null : { key, t: s.t, value };
}

export async function buildSnapshot(): Promise<Snapshot> {
  const items: SyncItem[] = [];
  for (const s of await sources()) {
    const value = await s.load().catch(() => null);
    if (value !== null) items.push({ key: s.key, t: s.t, value });
  }
  return {
    app: 'officeninja',
    v: 1,
    created: Date.now(),
    device: deviceInfo().name,
    items,
    deletedDocs: listDocumentTombstones(),
  };
}

/** Which remote entries this device should fetch. */
export function wanted(local: Manifest, remote: Manifest) {
  const mine = new Map(local.entries.map((e) => [e.key, e]));
  return remote.entries
    .filter((r) => {
      const m = mine.get(r.key);
      if (r.key.startsWith('doc:') && local.deletedDocs[r.key.slice(4)] >= r.t) return false;
      if (!m) return true;
      if (m.h === r.h) return false;
      return MERGEABLE.has(r.key) || r.t > m.t;
    })
    .map((r) => r.key);
}

/* ---------------- merging ---------------- */

interface Note {
  id: string;
  created: number;
  updated: number;
  [k: string]: unknown;
}
interface NotesData {
  version: 1;
  notes: Note[];
  deleted?: Record<string, number>;
}
function mergeDeleted(a?: Record<string, number>, b?: Record<string, number>) {
  const out: Record<string, number> = { ...(a ?? {}) };
  for (const [id, t] of Object.entries(b ?? {})) out[id] = Math.max(out[id] ?? 0, t);
  return out;
}
const stable = (v: unknown) => encodeJson(v);

function mergeNotes(local: NotesData | null, remote: NotesData): NotesData {
  const deleted = mergeDeleted(local?.deleted, remote.deleted);
  const byId = new Map<string, Note>();
  for (const n of [...(local?.notes ?? []), ...(remote.notes ?? [])]) {
    const have = byId.get(n.id);
    if (
      !have ||
      n.updated > have.updated ||
      (n.updated === have.updated && stable(n) > stable(have))
    )
      byId.set(n.id, n);
  }
  const notes = [...byId.values()]
    .filter((n) => !(deleted[n.id] && deleted[n.id] >= n.updated))
    .sort((a, b) => b.created - a.created || (a.id < b.id ? -1 : 1));
  return { version: 1, notes, deleted };
}

interface TimeData {
  version: 1;
  entries: { id: string; date?: string }[];
  invoices: { id: string; number?: string }[];
  timer: unknown;
  business: string;
  currency: string;
  nextInvoice: number;
  deleted?: Record<string, number>;
  [k: string]: unknown;
}
function mergeTime(local: TimeData | null, localT: number, remote: TimeData, remoteT: number): TimeData {
  if (!local) return remote;
  const newer = remoteT > localT ? remote : local;
  const deleted = mergeDeleted(local.deleted, remote.deleted);
  const union = <T extends { id: string }>(a: T[], b: T[]) => {
    const byId = new Map<string, T>();
    for (const item of a) byId.set(item.id, item);
    for (const item of b) {
      const have = byId.get(item.id);
      if (!have) byId.set(item.id, item);
      else if (stable(have) !== stable(item)) {
        // Same item edited on both: the more recently saved workspace wins.
        const pick = (newer === remote ? b : a).find((x) => x.id === item.id);
        byId.set(item.id, pick ?? item);
      }
    }
    return [...byId.values()].filter((x) => !deleted[x.id]);
  };
  const entries = union(local.entries, remote.entries).sort(
    (a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')) || (a.id < b.id ? -1 : 1),
  );
  const invoices = union(local.invoices, remote.invoices).sort((a, b) =>
    String(a.number ?? '').localeCompare(String(b.number ?? '')) || (a.id < b.id ? -1 : 1),
  );
  return {
    ...newer,
    entries,
    invoices,
    deleted,
    nextInvoice: Math.max(local.nextInvoice || 1, remote.nextInvoice || 1),
  };
}

/** Apply one item from a backup or a peer. Never throws; reports what happened. */
export async function applyItem(item: SyncItem, report: ApplyReport) {
  try {
    const [kind, ...rest] = item.key.split(':');
    const id = rest.join(':');
    if (kind === 'doc') await applyDoc(id, item, report);
    else if (kind === 'tool' && (TOOL_KEYS as readonly string[]).includes(id))
      await applyTool(id as ToolKey, item, report);
    else if (kind === 'design') {
      const file = item.value as DesignFile;
      if (!file || typeof file !== 'object' || file.id !== id) throw new Error('bad design');
      if (await putDesignIfNewer(file)) report.updated++;
      else report.skipped++;
    } else report.skipped++;
  } catch {
    report.failed++;
  }
}

async function applyDoc(id: string, item: SyncItem, report: ApplyReport) {
  const v = item.value as { id: string; title: string; type: OfficeDocumentType; data: unknown };
  if (!v || v.id !== id || !['word', 'excel', 'powerpoint'].includes(v.type)) throw new Error('bad doc');
  const deletedAt = listDocumentTombstones()[id];
  if (deletedAt && deletedAt >= item.t) {
    report.skipped++;
    return;
  }
  const local = await loadDocument(id);
  if (!local) {
    await saveDocument(id, v.title, v.type, v.data, deletedAt ? { allowResurrect: true } : {});
    report.added++;
    return;
  }
  if (stable(local.data) === stable(v.data) && local.title === v.title) {
    report.skipped++;
    return;
  }
  if (item.t <= local.updatedAt) {
    report.skipped++;
    return;
  }
  const result = await saveDocument(id, v.title, v.type, v.data, { knownRevision: local.revision });
  if (result.status === 'saved') report.updated++;
  else report.conflicts++;
}

async function applyTool(key: ToolKey, item: SyncItem, report: ApplyReport) {
  const local = await readToolRecord<unknown>(key);
  const localT = local?.savedAt ?? 0;
  let next: unknown;
  if (key === 'notes') next = mergeNotes(local?.data as NotesData | null, item.value as NotesData);
  else if (key === 'time')
    next = mergeTime(local?.data as TimeData | null, localT, item.value as TimeData, item.t);
  else if (key === 'boards') next = mergeBoards(local?.data as BoardsWorkspace | null, item.value as BoardsWorkspace);
  else if (!local || item.t > localT) next = item.value;
  else {
    report.skipped++;
    return;
  }
  if (local && stable(local.data) === stable(next)) {
    report.skipped++;
    return;
  }
  // A merge is a new version; a plain copy keeps the version time it came with.
  const merged = key === 'notes' || key === 'time' || key === 'boards';
  await writeToolWorkspace(key, next, merged ? Math.max(Date.now(), item.t) : item.t);
  if (!local) report.added++;
  else if (merged) report.merged++;
  else report.updated++;
}

/** Deletions made on another device, for documents not edited here since. */
export async function applyDeletions(deletedDocs: Record<string, number>, report: ApplyReport) {
  for (const [id, t] of Object.entries(deletedDocs ?? {})) {
    try {
      const local = await loadDocument(id);
      if (local && local.updatedAt < t) {
        await deleteDocument(id);
        report.deleted++;
      }
    } catch {
      report.failed++;
    }
  }
}

export async function applySnapshot(snapshot: Snapshot): Promise<ApplyReport> {
  if (snapshot?.app !== 'officeninja' || snapshot.v !== 1 || !Array.isArray(snapshot.items))
    throw new Error('This is not an OfficeNinja backup.');
  const report = emptyReport();
  for (const item of snapshot.items) await applyItem(item, report);
  await applyDeletions(snapshot.deletedDocs, report);
  return report;
}

export function describeReport(r: ApplyReport) {
  const parts = [
    r.added && `${r.added} added`,
    r.updated && `${r.updated} updated`,
    r.merged && `${r.merged} merged`,
    r.deleted && `${r.deleted} deleted`,
    r.conflicts && `${r.conflicts} kept as-is (edited here too)`,
    r.failed && `${r.failed} could not be read`,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Everything was already up to date';
}
