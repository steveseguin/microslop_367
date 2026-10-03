import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export type OfficeDocumentType = 'word' | 'excel' | 'powerpoint';

interface StoredDocument {
  id: string;
  title: string;
  type: OfficeDocumentType;
  data: unknown;
  updatedAt: number;
  revision: number;
  lastSavedBy: string;
}

export interface DocumentRecord<T = unknown> extends StoredDocument {
  data: T;
  source: 'database' | 'backup';
}

export interface SaveDocumentOptions {
  /**
   * The revision this save is based on — the `revision` of the record the caller last
   * loaded or wrote. It is the ONLY thing that entitles a caller to advance a document
   * that already exists.
   *
   * Omitting it (or passing `null`) means "I have no basis for this write". Over a
   * document that already exists that is a COLLISION, reported as `status: 'conflict'`
   * with nothing written — it is NOT a licence to fast-forward. Omit it only for a
   * document the caller believes is new; if the caller means "replace whatever is
   * there", it must say so with `overwriteExisting`.
   */
  knownRevision?: number | null;
  /**
   * Save even though the id is tombstoned (deleted here or in another tab), clearing the
   * tombstone. Use this to implement an explicit "restore this document" action after a
   * `DocumentPersistenceError` with `code: 'document-deleted'`. Without it, saving a
   * deleted document throws rather than silently resurrecting it.
   */
  allowResurrect?: boolean;
  /**
   * REPLACE WHATEVER IS STORED, at any revision, by anyone. This is destructive by
   * design and must only ever be set from an explicit user action that was shown what it
   * is about to replace — "Overwrite with this version" after a conflict, or restoring a
   * document the user just deleted.
   *
   * It exists so that overwrite intent is DECLARED rather than inferred from a missing
   * `knownRevision`. Inferring it is how a document could be destroyed by a caller that
   * simply had no revision to offer (it had failed to read one), while the pill read
   * "Saved". Never set it from an autosave path, and never set it "just in case a
   * conflict happens": a caller that cannot name the revision it is replacing is exactly
   * the caller this flag must not serve.
   */
  overwriteExisting?: boolean;
}

/**
 * Result of `saveDocument`.
 *
 *  - 'saved'    -> persisted. `record.source` is 'database' when IndexedDB accepted the
 *                  write, 'backup' when only the localStorage copy could be written.
 *  - 'conflict' -> NOTHING was written and `record` is the real stored winner. Either
 *                  another client advanced the document past `options.knownRevision`, or
 *                  the document exists and the caller offered no `knownRevision` at all
 *                  (see `SaveDocumentOptions.knownRevision`). Both mean the same thing to
 *                  a page: this write is not entitled to land. The way forward is to
 *                  reload, or to re-save with `overwriteExisting: true` from an explicit
 *                  user action.
 *  - 'failed'   -> RESERVED, NEVER RETURNED. Total failure throws a
 *                  `DocumentPersistenceError`, because widening a union is invisible to
 *                  TypeScript and would have rendered as "Saved". Kept so code already
 *                  compiled against it still type-checks. Handle failure in `catch`.
 */
export interface SaveDocumentResult<T = unknown> {
  status: 'saved' | 'conflict' | 'failed';
  record: DocumentRecord<T>;
}

export interface DocumentChangeEvent {
  id: string;
  title: string;
  type: OfficeDocumentType;
  updatedAt: number;
  revision: number;
  lastSavedBy: string;
}

/** Broadcast payload for deletions. Never delivered to `subscribeToDocument` callbacks. */
interface DocumentDeletedEvent extends DocumentChangeEvent {
  deleted: true;
}

type BroadcastPayload = DocumentChangeEvent | DocumentDeletedEvent;

function isDeletedEvent(payload: BroadcastPayload | undefined): payload is DocumentDeletedEvent {
  return (payload as DocumentDeletedEvent | undefined)?.deleted === true;
}

/**
 * Thrown by `saveDocument` when a save cannot be honoured. Deliberately an exception
 * rather than a result status: pages already wrap saves in try/catch, so failure is
 * fail-safe instead of opt-in.
 *
 *  - 'storage-unavailable' -> nothing was persisted, OR the module could not establish
 *    what IndexedDB currently holds and refuses to write a copy it knows would lose.
 *  - 'document-deleted' -> the id is tombstoned. `attemptedRecord` carries the record the
 *    caller tried to save so a page can offer "restore" (re-save with
 *    `{ allowResurrect: true }`) or "save as a copy" without rebuilding state.
 *  - 'conflict-unverifiable' -> this is a CONFLICT, not a storage failure. Another client
 *    advanced the document past `knownRevision`, but IndexedDB could not be read to
 *    produce the winning record, so it cannot be returned as `status: 'conflict'`. Treat
 *    it like a conflict in the UI ("saved elsewhere; reload to review, or force save"),
 *    NOT as "your changes could not be written". `attemptedRecord` holds the user's
 *    content so nothing is lost while they choose.
 */
export class DocumentPersistenceError extends Error {
  readonly code: 'storage-unavailable' | 'document-deleted' | 'conflict-unverifiable';
  readonly attemptedRecord?: DocumentRecord;

  constructor(
    message: string,
    code: 'storage-unavailable' | 'document-deleted' | 'conflict-unverifiable',
    attemptedRecord?: DocumentRecord,
  ) {
    super(message);
    this.name = 'DocumentPersistenceError';
    this.code = code;
    this.attemptedRecord = attemptedRecord;
  }
}

/**
 * Thrown by `loadDocument` when the document could not be READ.
 *
 * `loadDocument` resolving to `undefined` means exactly one thing — THIS DOCUMENT DOES NOT
 * EXIST — and every caller acts on it by seeding a default document and entering its
 * autosave loop. So "I could not find out whether it exists" must never be expressed as
 * `undefined`: when IndexedDB cannot be read and there is no localStorage copy, the stored
 * record may be sitting in the database intact, and a caller told "absent" will go on to
 * edit a document it has never seen.
 *
 * This lock is now the OUTER of two defences, not the only one. `saveDocument` refuses a
 * write that offers no `knownRevision` over an existing record, and only exempts a
 * same-client record when this page instance actually wrote it — so the first keystroke
 * after a mistaken "absent" is reported as a conflict rather than overwriting the stored
 * document. The lock still matters: a conflict banner on a document the user believes is
 * blank and new is a confusing place to end up, and this error says plainly what happened.
 *
 * An exception rather than a widened return type, for the same reason `saveDocument`
 * throws: pages already have a `.catch`, so the fail-safe behaviour is the default and a
 * caller that forgets about this case gets an error path rather than silent data loss.
 * `loadDocument`'s signature is unchanged.
 *
 *  - `code: 'storage-unreadable'` -> NOTHING was read and NOTHING was written. The stored
 *    copy, whatever it is, is untouched. Callers must not autosave; the correct UI is a
 *    read-only lock that offers a retry.
 *  - `detail` carries the underlying storage error, when there was one, for display.
 */
export class DocumentReadError extends Error {
  readonly code: 'storage-unreadable';
  readonly detail: string | null;

  constructor(message: string, detail: string | null) {
    super(message);
    this.name = 'DocumentReadError';
    this.code = 'storage-unreadable';
    this.detail = detail;
  }
}

interface OfficeNinjaDB extends DBSchema {
  documents: {
    key: string;
    value: StoredDocument;
    indexes: { 'by-date': number };
  };
}

const DB_NAME = 'OfficeNinjaDB';
const DB_VERSION = 2;
const STORE_NAME = 'documents';
const STORE_KEY_PATH = 'id';
const DATE_INDEX = 'by-date';
const BACKUP_PREFIX = 'officeninja_backup:';
const TOMBSTONE_STORAGE_KEY = 'officeninja_deleted_documents';
const PENDING_DELETE_STORAGE_KEY = 'officeninja_pending_deletes';
const REVISION_LEDGER_STORAGE_KEY = 'officeninja_revisions';
const CLIENT_ID_STORAGE_KEY = 'officeninja_client_id';
const BROADCAST_CHANNEL_NAME = 'officeninja_documents';

/**
 * Maximum serialized size of a single localStorage copy. Larger documents are skipped
 * entirely (never truncated); IndexedDB is their only store.
 */
export const BACKUP_SIZE_LIMIT_BYTES = 1_500_000;

const MAX_TOMBSTONES = 500;
const TOMBSTONE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_LEDGER_ENTRIES = 300;

/** Total wall-clock budget for opening the database, INCLUDING any recovery attempt. */
const DB_OPEN_BUDGET_MS = 10_000;
/** How long a failed open is remembered, so autosave does not re-pay the budget. */
const OPEN_FAILURE_TTL_MS = 5_000;

let dbPromise: Promise<IDBPDatabase<OfficeNinjaDB> | null> | null = null;
let openFailureUntil = 0;
let broadcastChannel: BroadcastChannel | null | undefined;
let ephemeralClientId: string | null = null;
let databaseAvailable = true;
let lastDatabaseError: string | null = null;
let lastBackupError: string | null = null;

function getWindow() {
  return typeof window === 'undefined' ? undefined : window;
}

function describeError(error: unknown) {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function markDatabaseHealthy() {
  databaseAvailable = true;
  lastDatabaseError = null;
}

function markDatabaseUnhealthy(error: unknown) {
  databaseAvailable = false;
  lastDatabaseError = describeError(error);
}

function getLocalStorage() {
  const currentWindow = getWindow();
  if (!currentWindow) {
    return undefined;
  }

  try {
    return currentWindow.localStorage;
  } catch (error) {
    lastBackupError = describeError(error);
    return undefined;
  }
}

function getClientId() {
  const currentWindow = getWindow();
  if (!currentWindow) {
    return 'server';
  }

  try {
    let clientId = currentWindow.sessionStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (!clientId) {
      clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      currentWindow.sessionStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
    }

    return clientId;
  } catch {
    // sessionStorage is blocked. Memoise one id for the page's lifetime: a fresh random
    // id per call would stop this client recognising its own writes.
    if (!ephemeralClientId) {
      ephemeralClientId = `client-ephemeral-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    return ephemeralClientId;
  }
}

function createDocumentChangeEvent(record: StoredDocument): DocumentChangeEvent {
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    updatedAt: record.updatedAt,
    revision: record.revision,
    lastSavedBy: record.lastSavedBy,
  };
}

function getChannel() {
  const currentWindow = getWindow();
  if (!currentWindow || typeof currentWindow.BroadcastChannel === 'undefined') {
    return null;
  }

  if (broadcastChannel === undefined) {
    try {
      broadcastChannel = new currentWindow.BroadcastChannel(BROADCAST_CHANNEL_NAME);
      // NOTE: deletion messages are deliberately NOT mirrored into this tab's tombstones.
      // Tombstones live in localStorage, which is already shared synchronously across
      // same-origin tabs, so mirroring adds nothing — and it actively breaks ordering: a
      // delete message that arrives after the document was deliberately restored
      // (allowResurrect) would re-tombstone a live document. Reproduced; do not re-add.
      // The broadcast exists to NOTIFY pages, via subscribeToDocumentDeletion.
    } catch {
      broadcastChannel = null;
    }
  }

  return broadcastChannel;
}

function postToChannel(payload: BroadcastPayload) {
  const channel = getChannel();
  if (!channel) {
    return;
  }

  try {
    channel.postMessage(payload);
  } catch (error) {
    console.warn('Document broadcast skipped', error);
  }
}

function getBackupKey(id: string) {
  return `${BACKUP_PREFIX}${id}`;
}

function toStoredDocument(record: DocumentRecord | StoredDocument): StoredDocument {
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    data: record.data,
    updatedAt: record.updatedAt,
    revision: record.revision,
    lastSavedBy: record.lastSavedBy,
  };
}

const DOCUMENT_TYPES = new Set<string>(['word', 'excel', 'powerpoint']);

/**
 * Only `id` and a FINITE `updatedAt` are load-bearing. `updatedAt: NaN` is rejected:
 * `typeof NaN === 'number'` but NaN is not a valid IndexedDB key, so such a record can
 * never be indexed and would otherwise sit in the store permanently invisible. A missing
 * or empty title must never make a document unloadable.
 */
function normalizeDocument<T = unknown>(
  record: Partial<StoredDocument> | undefined,
  source: DocumentRecord<T>['source'],
): DocumentRecord<T> | undefined {
  if (!record?.id || typeof record.id !== 'string' || !Number.isFinite(record.updatedAt)) {
    return undefined;
  }

  return {
    id: record.id,
    title: typeof record.title === 'string' ? record.title : '',
    type: (DOCUMENT_TYPES.has(record.type as string) ? record.type : 'word') as OfficeDocumentType,
    data: record.data as T,
    updatedAt: record.updatedAt as number,
    revision: Number.isFinite(record.revision) ? (record.revision as number) : 1,
    lastSavedBy: typeof record.lastSavedBy === 'string' ? record.lastSavedBy : 'legacy',
    source,
  };
}

/**
 * localStorage is subordinate to IndexedDB: it wins ONLY on a strictly higher revision.
 * `updatedAt` is never consulted — wall clocks are per-tab and skewed, and a clock-based
 * tie-break is how a stale copy used to overwrite good data.
 */
function backupBeatsDatabase(backup: StoredDocument, stored: StoredDocument) {
  return backup.revision > stored.revision;
}

function pickLatestRecord<T = unknown>(
  databaseRecord: DocumentRecord<T> | undefined,
  backupRecord: DocumentRecord<T> | undefined,
) {
  if (!databaseRecord) {
    return backupRecord;
  }

  if (!backupRecord) {
    return databaseRecord;
  }

  return backupBeatsDatabase(backupRecord, databaseRecord) ? backupRecord : databaseRecord;
}

// ---------------------------------------------------------------------------
// Small JSON maps in localStorage
// ---------------------------------------------------------------------------

/**
 * All of these maps are keyed by document id, which is user-controlled. They use
 * null-prototype objects and `Object.hasOwn` so an id like "constructor" or "__proto__"
 * cannot be reported as present, or poison the prototype.
 */
function readJsonMap<V>(key: string, parseValue: (raw: unknown) => V | undefined): Record<string, V> {
  const map = Object.create(null) as Record<string, V>;
  const storage = getLocalStorage();
  if (!storage) {
    return map;
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return map;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return map;
    }

    for (const id of Object.keys(parsed as Record<string, unknown>)) {
      if (id === '__proto__') {
        continue;
      }
      const value = parseValue((parsed as Record<string, unknown>)[id]);
      if (value !== undefined) {
        map[id] = value;
      }
    }
  } catch (error) {
    console.warn(`Map read skipped (${key})`, error);
  }

  return map;
}

function writeJsonMap<V>(key: string, map: Record<string, V>) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    const entries = Object.keys(map).map((id) => [id, map[id]] as const);
    if (!entries.length) {
      storage.removeItem(key);
      return;
    }

    storage.setItem(key, JSON.stringify(Object.fromEntries(entries)));
  } catch (error) {
    console.warn(`Map write skipped (${key})`, error);
  }
}

const has = (map: object, id: string) => Object.hasOwn(map, id);

// ---------------------------------------------------------------------------
// Tombstones and pending deletes
// ---------------------------------------------------------------------------

interface TombstoneEntry {
  /** When the delete was requested. */
  t: number;
  /** True only once the IndexedDB row is confirmed gone AND the local copy is removed. */
  confirmed: boolean;
}

function readTombstones() {
  return readJsonMap<TombstoneEntry>(TOMBSTONE_STORAGE_KEY, (raw) => {
    // Legacy format: a bare timestamp, which always meant a completed delete.
    if (typeof raw === 'number') {
      return { t: raw, confirmed: true };
    }
    if (raw && typeof raw === 'object' && Number.isFinite((raw as TombstoneEntry).t)) {
      return { t: (raw as TombstoneEntry).t, confirmed: (raw as TombstoneEntry).confirmed === true };
    }
    return undefined;
  });
}

/**
 * Persists tombstones under a size cap.
 *
 * UNCONFIRMED tombstones are never evicted and never expire: they are the only thing
 * hiding a row whose delete failed, so dropping one resurrects a document the user
 * deleted. Only confirmed tombstones — where the row and the local copy are already
 * gone, so nothing can come back — are aged out or capped.
 */
function writeTombstones(tombstones: Record<string, TombstoneEntry>) {
  const cutoff = Date.now() - TOMBSTONE_TTL_MS;
  const unconfirmed: Array<[string, TombstoneEntry]> = [];
  const confirmed: Array<[string, TombstoneEntry]> = [];

  for (const id of Object.keys(tombstones)) {
    const entry = tombstones[id];
    if (!entry.confirmed) {
      unconfirmed.push([id, entry]);
    } else if (entry.t > cutoff) {
      confirmed.push([id, entry]);
    }
  }

  confirmed.sort((left, right) => right[1].t - left[1].t);
  const budget = Math.max(0, MAX_TOMBSTONES - unconfirmed.length);
  const kept = [...unconfirmed, ...confirmed.slice(0, budget)];

  writeJsonMap(TOMBSTONE_STORAGE_KEY, Object.fromEntries(kept));
}

function addTombstone(id: string, confirmed: boolean) {
  const tombstones = readTombstones();
  const existing = has(tombstones, id) ? tombstones[id] : undefined;
  if (existing && existing.confirmed === confirmed) {
    return;
  }

  // An existing unconfirmed tombstone must never be downgraded by a later confirmed=false.
  tombstones[id] = { t: existing?.t ?? Date.now(), confirmed: existing ? existing.confirmed || confirmed : confirmed };
  writeTombstones(tombstones);
}

function getTombstone(id: string) {
  const tombstones = readTombstones();
  return has(tombstones, id) ? tombstones[id] : undefined;
}

/**
 * Clears the delete marker for `id`. This is the ONLY way a tombstone is removed —
 * `saveDocument` never clears one implicitly for a document the caller is editing.
 */
export function clearDocumentTombstone(id: string) {
  const tombstones = readTombstones();
  if (!has(tombstones, id)) {
    return;
  }

  delete tombstones[id];
  writeTombstones(tombstones);
  removePendingDelete(id);
  // The document is being recreated; any remembered revision belongs to the deleted one,
  // and so does any memory of having written it (which would otherwise exempt this page
  // from conflicting with a same-id record it never actually wrote).
  forgetRevision(id);
  forgetOwnWrites(id);
}

export function isDocumentTombstoned(id: string) {
  return has(readTombstones(), id);
}

function readPendingDeletes() {
  return readJsonMap<number>(PENDING_DELETE_STORAGE_KEY, (raw) => (Number.isFinite(raw) ? (raw as number) : undefined));
}

function addPendingDelete(id: string) {
  const pending = readPendingDeletes();
  if (has(pending, id)) {
    return;
  }
  pending[id] = Date.now();
  writeJsonMap(PENDING_DELETE_STORAGE_KEY, pending);
}

function removePendingDelete(id: string) {
  const pending = readPendingDeletes();
  if (!has(pending, id)) {
    return;
  }
  delete pending[id];
  writeJsonMap(PENDING_DELETE_STORAGE_KEY, pending);
}

/**
 * Retries deletes whose IndexedDB write never landed. Until a delete is confirmed the
 * row is only HIDDEN by a tombstone, which is not durable deletion.
 */
async function flushPendingDeletes(db: IDBPDatabase<OfficeNinjaDB>) {
  const pending = readPendingDeletes();
  const ids = Object.keys(pending);
  if (!ids.length) {
    return;
  }

  for (const id of ids) {
    try {
      await db.delete(STORE_NAME, id);
      removeBackup(id);
      removePendingDelete(id);
      addTombstone(id, true);
    } catch (error) {
      console.warn(`Pending delete for "${id}" still failing`, error);
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Revision ledger
// ---------------------------------------------------------------------------

interface LedgerEntry {
  /** Highest revision this browser has ever observed for the id. */
  r: number;
  /** When it was observed. */
  t: number;
  /** Who wrote that revision. */
  by: string;
}

/**
 * A tiny record of the highest revision this browser has seen per document. It exists so
 * that when IndexedDB cannot be read, `saveDocument` still knows what revision the store
 * is likely to hold — otherwise it would write a local copy at revision 1 that can never
 * beat the stored record, and report "saved" for a write that is dead on arrival.
 */
function readLedger() {
  return readJsonMap<LedgerEntry>(REVISION_LEDGER_STORAGE_KEY, (raw) => {
    if (raw && typeof raw === 'object' && Number.isFinite((raw as LedgerEntry).r)) {
      const entry = raw as LedgerEntry;
      return { r: entry.r, t: Number.isFinite(entry.t) ? entry.t : 0, by: typeof entry.by === 'string' ? entry.by : '' };
    }
    return undefined;
  });
}

function getLedgerEntry(id: string) {
  const ledger = readLedger();
  return has(ledger, id) ? ledger[id] : undefined;
}

function recordRevision(id: string, revision: number, by: string) {
  if (!Number.isFinite(revision)) {
    return;
  }

  const ledger = readLedger();
  const existing = has(ledger, id) ? ledger[id] : undefined;
  if (existing && existing.r >= revision) {
    return;
  }

  ledger[id] = { r: revision, t: Date.now(), by };

  const ids = Object.keys(ledger);
  if (ids.length > MAX_LEDGER_ENTRIES) {
    ids
      .sort((left, right) => ledger[left].t - ledger[right].t)
      .slice(0, ids.length - MAX_LEDGER_ENTRIES)
      .forEach((stale) => delete ledger[stale]);
  }

  writeJsonMap(REVISION_LEDGER_STORAGE_KEY, ledger);
}

/**
 * Drops the ledger entry for `id`. Required on delete and on tombstone clearing: a
 * delete-then-restore otherwise leaves an entry far above the document's real revision,
 * and that GHOST permanently disables the degraded-mode save path for that id — every
 * future outage throws "advanced to revision N elsewhere" when nothing advanced at all.
 */
function forgetRevision(id: string) {
  const ledger = readLedger();
  if (!has(ledger, id)) {
    return;
  }

  delete ledger[id];
  writeJsonMap(REVISION_LEDGER_STORAGE_KEY, ledger);
}

/**
 * Lowers the ledger to `revision` when the real stores are demonstrably behind it. The
 * ledger is a hint, not a record: when we can actually see what exists, the stores win.
 */
function repairLedgerDownward(id: string, revision: number) {
  if (!Number.isFinite(revision)) {
    return;
  }

  const ledger = readLedger();
  const existing = has(ledger, id) ? ledger[id] : undefined;
  if (!existing || existing.r <= revision) {
    return;
  }

  console.warn(`Revision ledger for "${id}" claimed r=${existing.r} but storage holds ${revision}; repairing downward.`);
  ledger[id] = { r: revision, t: Date.now(), by: existing.by };
  writeJsonMap(REVISION_LEDGER_STORAGE_KEY, ledger);
}

// ---------------------------------------------------------------------------
// localStorage copies
// ---------------------------------------------------------------------------

/**
 * Writes the localStorage copy of `record`.
 *
 * `databasePersisted` is critical: when IndexedDB did NOT accept the write, the existing
 * entry may be the user's ONLY copy, so a failed write must leave it alone. A stale copy
 * beats no copy, and it cannot win a later merge because `backupBeatsDatabase` requires a
 * strictly higher revision. Only when IndexedDB holds the truth is it safe to drop one.
 */
function writeBackup(record: StoredDocument, databasePersisted: boolean): boolean {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  const key = getBackupKey(record.id);

  let serialized: string;
  try {
    serialized = JSON.stringify(record);
  } catch (error) {
    lastBackupError = describeError(error);
    if (databasePersisted) {
      safeRemoveItem(storage, key);
    }
    return false;
  }

  if (serialized.length > BACKUP_SIZE_LIMIT_BYTES) {
    lastBackupError = `Backup skipped: ${serialized.length} bytes exceeds ${BACKUP_SIZE_LIMIT_BYTES}`;
    if (databasePersisted) {
      safeRemoveItem(storage, key);
    } else {
      console.warn('Document too large for a local copy and IndexedDB is unavailable; previous local copy kept.');
    }
    return false;
  }

  try {
    storage.setItem(key, serialized);
    lastBackupError = null;
    return true;
  } catch (error) {
    lastBackupError = describeError(error);

    if (!databasePersisted) {
      // setItem leaves the previous value intact, and that value may be the only copy.
      console.warn('Local copy write failed and IndexedDB is unavailable; previous local copy preserved.', error);
      return false;
    }

    safeRemoveItem(storage, key);
    try {
      storage.setItem(key, serialized);
      lastBackupError = null;
      return true;
    } catch (retryError) {
      lastBackupError = describeError(retryError);
      safeRemoveItem(storage, key);
      console.warn('Local copy write failed; stale entry removed (IndexedDB holds this revision).', retryError);
      return false;
    }
  }
}

function safeRemoveItem(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.warn('Local copy removal skipped', error);
  }
}

function readBackup<T = unknown>(id: string) {
  const storage = getLocalStorage();
  if (!storage) {
    return undefined;
  }

  try {
    const stored = storage.getItem(getBackupKey(id));
    if (!stored) {
      return undefined;
    }

    return normalizeDocument<T>(JSON.parse(stored) as StoredDocument, 'backup');
  } catch (error) {
    console.warn('Local copy read skipped', error);
    return undefined;
  }
}

function listBackupDocuments() {
  const storage = getLocalStorage();
  if (!storage) {
    return [] as DocumentRecord[];
  }

  const documents: DocumentRecord[] = [];
  const tombstones = readTombstones();

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(BACKUP_PREFIX)) {
        continue;
      }

      const stored = storage.getItem(key);
      if (!stored) {
        continue;
      }

      try {
        const document = normalizeDocument(JSON.parse(stored) as StoredDocument, 'backup');
        if (document && !has(tombstones, document.id)) {
          documents.push(document);
        }
      } catch (parseError) {
        console.warn('Local copy entry skipped', parseError);
      }
    }
  } catch (error) {
    console.warn('Local copy listing skipped', error);
  }

  return documents;
}

function removeBackup(id: string) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  safeRemoveItem(storage, getBackupKey(id));
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

/**
 * Promotes localStorage copies into IndexedDB ONLY for ids the database does not have.
 * This runs on open with no user action, so it must never be able to overwrite a stored
 * record. A stored record that is behind its local copy is handled by `loadDocument`,
 * which surfaces it as `source: 'backup'`.
 */
async function restoreMissingBackupsToDatabase(db: IDBPDatabase<OfficeNinjaDB>) {
  const backups = listBackupDocuments();
  if (!backups.length) {
    return;
  }

  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const backup of backups) {
      const existing = await tx.store.get(backup.id);
      if (existing) {
        continue;
      }

      await tx.store.put(toStoredDocument(backup));
    }
    await tx.done;
  } catch (error) {
    console.warn('Local copy promotion skipped', error);
  }
}

class DatabaseOpenTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseOpenTimeoutError';
  }
}

/**
 * Opens the database with a hard time budget.
 *
 * An IDBOpenDBRequest cannot be aborted, so when the budget expires the request is left
 * running and WILL eventually succeed once the blocker clears. That late connection is
 * closed on arrival; otherwise it would be an unreferenced open connection that blocks
 * every future upgrade forever.
 */
function openDatabase(version: number | undefined, budgetMs: number) {
  const holder: { db: IDBPDatabase<OfficeNinjaDB> | null; abandoned: boolean } = { db: null, abandoned: false };

  const closeHolder = () => {
    try {
      holder.db?.close();
    } catch (error) {
      console.warn('Database close skipped', error);
    }
    holder.db = null;
  };

  const open = openDB<OfficeNinjaDB>(DB_NAME, version, {
    upgrade(upgradingDb, _oldVersion, _newVersion, transaction) {
      if (!upgradingDb.objectStoreNames.contains(STORE_NAME)) {
        const store = upgradingDb.createObjectStore(STORE_NAME, { keyPath: STORE_KEY_PATH });
        store.createIndex(DATE_INDEX, 'updatedAt');
        return;
      }

      const store = transaction.objectStore(STORE_NAME);
      if (!store.indexNames.contains(DATE_INDEX)) {
        store.createIndex(DATE_INDEX, 'updatedAt');
      }
    },
    blocked(currentVersion, blockedVersion) {
      console.warn(
        `OfficeNinja database upgrade blocked by another connection (open: v${currentVersion}, wanted: v${blockedVersion}).`,
      );
    },
    blocking() {
      console.warn('OfficeNinja database is blocking an upgrade elsewhere; closing this handle.');
      closeHolder();
      dbPromise = null;
    },
    terminated() {
      console.warn('OfficeNinja database connection terminated unexpectedly.');
      holder.db = null;
      dbPromise = null;
    },
  });

  // Track the connection from the RAW open promise, not the timeout wrapper: once the
  // wrapper rejects, nothing else would hold a reference to close.
  void open.then(
    (db) => {
      holder.db = db;
      if (holder.abandoned) {
        closeHolder();
      }
    },
    () => {
      holder.db = null;
    },
  );

  return new Promise<IDBPDatabase<OfficeNinjaDB>>((resolve, reject) => {
    const timer = setTimeout(() => {
      holder.abandoned = true;
      closeHolder();
      reject(new DatabaseOpenTimeoutError(`IndexedDB open timed out after ${budgetMs}ms`));
    }, budgetMs);

    open.then(
      (db) => {
        clearTimeout(timer);
        if (holder.abandoned) {
          closeHolder();
          reject(new DatabaseOpenTimeoutError('IndexedDB open completed after the timeout and was closed'));
          return;
        }
        resolve(db);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

type SchemaVerdict = { ok: true } | { ok: false; repairable: boolean; reason: string };

/**
 * A missing store or index is repairable by an additive version bump. A WRONG keyPath is
 * not: correcting it would mean deleting and recreating the store, destroying the user's
 * documents. Such a database is reported unusable so the app degrades to local copies
 * rather than silently reporting "saved" for puts that all fail with DataError.
 */
function inspectSchema(db: IDBPDatabase<OfficeNinjaDB>): SchemaVerdict {
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    return { ok: false, repairable: true, reason: 'object store missing' };
  }

  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const { keyPath } = tx.store;
    const hasIndex = tx.store.indexNames.contains(DATE_INDEX);
    void tx.done.catch(() => {});

    if (keyPath !== STORE_KEY_PATH) {
      return { ok: false, repairable: false, reason: `object store keyPath is ${JSON.stringify(keyPath)}, expected "${STORE_KEY_PATH}"` };
    }

    if (!hasIndex) {
      return { ok: false, repairable: true, reason: `"${DATE_INDEX}" index missing` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, repairable: false, reason: describeError(error) };
  }
}

/**
 * Opens the database. NEVER deletes it.
 *  - VersionError -> reopen with no explicit version, adopting whatever exists.
 *  - Missing store/index -> additive version bump.
 *  - Wrong keyPath -> unusable; degrade to local copies rather than destroy data.
 *  - Timeout -> give up for this attempt; do not pay the budget twice.
 */
async function openDatabaseWithRecovery(): Promise<IDBPDatabase<OfficeNinjaDB> | null> {
  const deadline = Date.now() + DB_OPEN_BUDGET_MS;
  const remaining = () => Math.max(250, deadline - Date.now());

  let db: IDBPDatabase<OfficeNinjaDB> | null = null;

  try {
    db = await openDatabase(DB_VERSION, remaining());
  } catch (initialError) {
    markDatabaseUnhealthy(initialError);

    if (initialError instanceof DatabaseOpenTimeoutError) {
      console.error('Database open timed out; not retrying within this attempt.', initialError);
      return null;
    }

    const isVersionError = initialError instanceof Error && initialError.name === 'VersionError';
    console.warn(
      isVersionError
        ? 'Stored database is newer than this build; adopting the existing version.'
        : 'Database open failed; retrying without an explicit version.',
      initialError,
    );

    try {
      db = await openDatabase(undefined, remaining());
    } catch (recoveryError) {
      markDatabaseUnhealthy(recoveryError);
      console.error('Database unavailable; refusing to delete stored data.', recoveryError);
      return null;
    }
  }

  let verdict = inspectSchema(db);
  if (!verdict.ok && verdict.repairable) {
    const nextVersion = db.version + 1;
    console.warn(`Database schema incomplete (${verdict.reason}); upgrading to v${nextVersion}.`);
    db.close();
    try {
      db = await openDatabase(nextVersion, remaining());
      verdict = inspectSchema(db);
    } catch (upgradeError) {
      markDatabaseUnhealthy(upgradeError);
      console.error('Schema repair failed; leaving stored data untouched.', upgradeError);
      return null;
    }
  }

  if (!verdict.ok) {
    const error = new Error(`Unusable database schema: ${verdict.reason}`);
    markDatabaseUnhealthy(error);
    console.error('Database schema cannot be used and will NOT be recreated (that would destroy data).', error);
    db.close();
    return null;
  }

  markDatabaseHealthy();
  await flushPendingDeletes(db);
  await restoreMissingBackupsToDatabase(db);
  return db;
}

async function getDB() {
  if (dbPromise) {
    return dbPromise;
  }

  // A failed open is remembered briefly so a 600ms autosave loop does not re-pay the
  // full open budget on every keystroke.
  if (Date.now() < openFailureUntil) {
    return null;
  }

  dbPromise = openDatabaseWithRecovery().then(
    (db) => {
      if (!db) {
        dbPromise = null;
        openFailureUntil = Date.now() + OPEN_FAILURE_TTL_MS;
      }
      return db;
    },
    (error) => {
      markDatabaseUnhealthy(error);
      dbPromise = null;
      openFailureUntil = Date.now() + OPEN_FAILURE_TTL_MS;
      return null;
    },
  );

  return dbPromise;
}

/**
 * Forgets a remembered open failure so an explicit, user-initiated retry actually retries.
 *
 * `openFailureUntil` exists so a 600ms autosave loop does not re-pay the 10s open budget on
 * every keystroke. A person pressing "Try again" after being told their document could not
 * be opened is not that loop, and making them wait out an invisible 5s window would look
 * exactly like the failure repeating. Call this ONLY from an explicit user action.
 */
export function retryStorageConnection() {
  openFailureUntil = 0;
}

/** Diagnostics for UI/telemetry. Reflects the most recent storage operation. */
export function getStorageDiagnostics() {
  return {
    databaseAvailable,
    lastDatabaseError,
    lastBackupError,
    backupSizeLimitBytes: BACKUP_SIZE_LIMIT_BYTES,
    pendingDeletes: Object.keys(readPendingDeletes()).length,
  };
}

// ---------------------------------------------------------------------------
// Per-document serialisation
// ---------------------------------------------------------------------------

/**
 * Concurrent writes to the SAME document id are serialised here, inside the module.
 *
 * The IndexedDB transaction already prevents interleaving, but it does not order
 * overlapping calls: two autosaves fired from one page could commit in either order, so
 * an older snapshot could land last. Pages must not have to solve this individually —
 * one of them would inevitably forget. Order of commit is now order of call.
 */
const writeChains = new Map<string, Promise<unknown>>();

function enqueue<R>(id: string, task: () => Promise<R>): Promise<R> {
  const previous = writeChains.get(id) ?? Promise.resolve();
  const result = previous.then(task, task);
  const guard = result.then(
    () => undefined,
    () => undefined,
  );
  writeChains.set(id, guard);

  void guard.then(() => {
    if (writeChains.get(id) === guard) {
      writeChains.delete(id);
    }
  });

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Revisions THIS PAGE INSTANCE has written, per document id. In memory only, and
 * deliberately so — see `isConflict`.
 */
const ownWrites = new Map<string, number>();

function recordOwnWrite(id: string, revision: number) {
  if (!Number.isFinite(revision)) {
    return;
  }

  if ((ownWrites.get(id) ?? 0) < revision) {
    ownWrites.set(id, revision);
  }
}

/** True when this page instance is the one that wrote `revision` (or something later). */
function wroteRevision(id: string, revision: number) {
  return (ownWrites.get(id) ?? 0) >= revision;
}

function forgetOwnWrites(id: string) {
  ownWrites.delete(id);
}

/**
 * The single definition of "this write is not entitled to land". Takes only the two
 * fields it needs from the stored side, so it can be applied to a full record or to a
 * bare revision-ledger witness.
 *
 * In order:
 *
 *  1. Nothing stored -> never a conflict. There is nothing to lose.
 *  2. `overwriteExisting` -> never a conflict. The caller declared intent to replace
 *     whatever is there, from an explicit user action.
 *  3. NO `knownRevision` over an existing record -> ALWAYS a conflict. A missing revision
 *     is the absence of a basis for the write, not permission to fast-forward. This is
 *     the half of the check that used to be missing: a page that had failed to read the
 *     document (so it had no revision) looked identical to a page creating a new one, and
 *     its first autosave replaced the stored record.
 *  4. Stored revision at or below `knownRevision` -> not a conflict. Ordinary path.
 *  5. Stored revision ahead, written by a DIFFERENT client -> conflict.
 *  6. Stored revision ahead, written by the SAME client id -> conflict UNLESS this page
 *     instance is the one that wrote it.
 *
 * Rule 6 is deliberately narrow. The exemption exists so a client does not conflict with
 * its own in-flight writes: a save queued before an earlier save landed carries a
 * `knownRevision` one behind the record it is about to see, and refusing it would drop the
 * user's newest edit (this happened, via an ephemeral client id, and was fixed once
 * already). But `clientId` lives in sessionStorage, which SURVIVES A RELOAD and is COPIED
 * INTO A DUPLICATED TAB, so "same client id" on its own does not mean "my own write" — it
 * also covers a previous page load of this tab and a genuinely concurrent duplicate. The
 * in-memory `ownWrites` map is scoped to exactly what the exemption is for: writes this
 * page instance actually performed. A reloaded tab has an empty map, and it does not need
 * the exemption anyway — it read its `knownRevision` from the record it is now looking at.
 */
function isConflict(
  id: string,
  current: Pick<StoredDocument, 'revision' | 'lastSavedBy'> | undefined,
  options: Pick<SaveDocumentOptions, 'knownRevision' | 'overwriteExisting'>,
  clientId: string,
) {
  if (!current || options.overwriteExisting) {
    return false;
  }

  const { knownRevision } = options;
  if (knownRevision == null) {
    return true;
  }

  if (current.revision <= knownRevision) {
    return false;
  }

  if (current.lastSavedBy !== clientId) {
    return true;
  }

  return !wroteRevision(id, current.revision);
}

async function saveDocumentInternal<T>(
  id: string,
  title: string,
  type: OfficeDocumentType,
  data: T,
  options: SaveDocumentOptions,
): Promise<SaveDocumentResult<T>> {
  const clientId = getClientId();
  const now = Date.now();
  const knownRevision = options.knownRevision;

  const buildRecord = (revision: number): StoredDocument => ({
    id,
    title,
    type,
    data,
    updatedAt: now,
    revision,
    lastSavedBy: clientId,
  });

  const attempted = () => ({ ...buildRecord(Math.max(1, (knownRevision ?? 0) + 1)), data, source: 'backup' }) as DocumentRecord;

  const db = await getDB();
  if (db) {
    await flushPendingDeletes(db);
  }

  const tombstone = getTombstone(id);
  if (tombstone) {
    if (options.allowResurrect) {
      clearDocumentTombstone(id);
    } else if (knownRevision != null && knownRevision > 0) {
      // The caller is editing a document that was deleted. Never resurrect silently.
      throw new DocumentPersistenceError(
        `Document "${id}" was deleted. Re-save with { allowResurrect: true } to restore it, or save the content under a new id.`,
        'document-deleted',
        attempted(),
      );
    } else {
      // No known revision: the caller believes this is a NEW document. That is only safe
      // if nothing of the deleted document survives — otherwise this is a resurrection.
      let survives = readBackup(id) !== undefined;
      if (!survives && db) {
        try {
          survives = (await db.get(STORE_NAME, id)) !== undefined;
        } catch {
          survives = true; // cannot prove it is gone; refuse
        }
      }

      if (survives) {
        throw new DocumentPersistenceError(
          `Document "${id}" was deleted and its content still exists. Re-save with { allowResurrect: true } to restore it.`,
          'document-deleted',
          attempted(),
        );
      }

      // Nothing survives: this is a genuine reuse of a recycled id, not a resurrection.
      clearDocumentTombstone(id);
    }
  }

  let nextRecord: StoredDocument | undefined;
  let conflictRecord: DocumentRecord<T> | undefined;
  let databaseWritten = false;
  let databaseReadable = db === null; // nothing to read from when there is no connection

  if (db) {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      // No non-IDB await between the get and the put: read-check-write is atomic with
      // respect to every other tab.
      const current = normalizeDocument<T>(await tx.store.get(id), 'database');
      databaseReadable = true;

      if (isConflict(id, current, options, clientId)) {
        conflictRecord = current;
      } else {
        const candidate = buildRecord(current ? current.revision + 1 : Math.max(1, (knownRevision ?? 0) + 1));
        await tx.store.put(candidate);
        nextRecord = candidate;
      }

      await tx.done;
      if (nextRecord) {
        databaseWritten = true;
      }
      markDatabaseHealthy();
    } catch (error) {
      markDatabaseUnhealthy(error);
      console.warn('Database save failed', error);
      nextRecord = undefined;
      conflictRecord = undefined;
      databaseReadable = false;
    }
  }

  if (conflictRecord) {
    recordRevision(id, conflictRecord.revision, conflictRecord.lastSavedBy);
    return { status: 'conflict', record: conflictRecord };
  }

  let storedRecord: DocumentRecord<T> | undefined;
  if (!nextRecord && db && !databaseReadable) {
    // The readwrite transaction failed. A readonly read often still works, and knowing
    // the stored revision is what stops the fallback copy being dead on arrival.
    try {
      storedRecord = normalizeDocument<T>(await db.get(STORE_NAME, id), 'database');
      databaseReadable = true;
    } catch (error) {
      console.warn('Fallback read of the stored revision failed', error);
    }
  }

  if (!nextRecord) {
    const backupRecord = readBackup<T>(id);
    const ledger = getLedgerEntry(id);

    // The best real record we can show the caller, if there is a conflict to report.
    const bestRecord = [storedRecord, backupRecord]
      .filter((record): record is DocumentRecord<T> => record !== undefined)
      .sort((left, right) => right.revision - left.revision)[0];

    if (bestRecord && isConflict(id, bestRecord, options, clientId)) {
      recordRevision(id, bestRecord.revision, bestRecord.lastSavedBy);
      return { status: 'conflict', record: bestRecord };
    }

    // Did we actually READ the row this call? `databaseReadable` is true both when a read
    // succeeded and when there is no connection to read from, so it cannot answer this on
    // its own — and repairing the ledger on the strength of "there was nothing to read"
    // would lower it to whatever the local copy happens to say, discarding the only signal
    // that protects the offline save path.
    const storeWasRead = db !== null && databaseReadable;
    const visibleRevision = Math.max(storedRecord?.revision ?? 0, backupRecord?.revision ?? 0);

    if (storeWasRead) {
      // We can SEE what exists. A ledger entry above that is a ghost (typically from a
      // delete-then-restore); trust the stores and repair it, or it would veto every
      // degraded-mode save for this id from now on.
      repairLedgerDownward(id, visibleRevision);
    }

    // Only an UNVERIFIED ledger may veto a save; once the store has been read it is the
    // authority and the (now repaired) ledger has nothing left to say.
    const trustedLedger = !storeWasRead && ledger && ledger.r > visibleRevision ? ledger : undefined;

    if (
      trustedLedger &&
      isConflict(id, { revision: trustedLedger.r, lastSavedBy: trustedLedger.by }, options, clientId)
    ) {
      // We know the document exists and has moved on, but cannot produce the winning
      // record to hand back. Reporting "saved" here would discard the user's edit on
      // recovery. This is a CONFLICT that could not be verified, not a storage failure —
      // pages should offer a rebase/force-save route, not "could not be written locally".
      throw new DocumentPersistenceError(
        `Document "${id}" advanced to revision ${trustedLedger.r} elsewhere and IndexedDB cannot be read to confirm it. Nothing was written.`,
        'conflict-unverifiable',
        attempted(),
      );
    }

    if (db && !databaseReadable) {
      // A connection exists but neither the write nor the read worked, so the stored
      // revision is unknown. Writing a local copy at a guessed revision risks it losing
      // silently on recovery; refuse instead.
      throw new DocumentPersistenceError(
        `Unable to save: IndexedDB rejected both the write and the read for "${id}", so the stored revision is unknown. Nothing was written.`,
        'storage-unavailable',
        attempted(),
      );
    }

    // Floor the revision above everything known to exist, so the copy can actually win.
    // The ledger contributes only when the store was NOT read: once it has been read and
    // repaired, `ledger` still holds the stale pre-repair value, and using it here would
    // immediately undo the repair (a ghost at r=40 would still yield revision 41).
    const floor = Math.max(
      storedRecord?.revision ?? 0,
      backupRecord?.revision ?? 0,
      storeWasRead ? 0 : (ledger?.r ?? 0),
      knownRevision ?? 0,
    );
    nextRecord = buildRecord(floor + 1);
  }

  const backupWritten = writeBackup(nextRecord, databaseWritten);

  if (!databaseWritten && !backupWritten) {
    throw new DocumentPersistenceError(
      'Unable to save: IndexedDB is unavailable and the local copy could not be written. Nothing was stored.',
      'storage-unavailable',
      attempted(),
    );
  }

  recordRevision(id, nextRecord.revision, clientId);
  // Evidence for the same-client exemption in `isConflict`, and the ONLY thing that grants
  // it. Recorded after the write is known to have landed somewhere.
  recordOwnWrite(id, nextRecord.revision);
  postToChannel(createDocumentChangeEvent(nextRecord));

  return {
    status: 'saved',
    record: { ...nextRecord, data, source: databaseWritten ? 'database' : 'backup' } as DocumentRecord<T>,
  };
}

/**
 * Persists a document.
 *
 * Read, conflict check and write happen inside ONE IndexedDB readwrite transaction, and
 * concurrent calls for the same id are serialised in-process, so neither another tab nor
 * another call in this page can interleave with a save.
 *
 * A write over a document that already exists must be ENTITLED to land: either it carries
 * a `knownRevision` the stored record has not moved past, or it sets `overwriteExisting`.
 * Anything else is `status: 'conflict'` with nothing written. Overwrite intent is never
 * inferred from an absent `knownRevision` — see `SaveDocumentOptions` and `isConflict`.
 *
 * Throws `DocumentPersistenceError` rather than reporting a false success. See that class
 * for the codes.
 */
export function saveDocument<T = unknown>(
  id: string,
  title: string,
  type: OfficeDocumentType,
  data: T,
  options: SaveDocumentOptions = {},
): Promise<SaveDocumentResult<T>> {
  return enqueue(id, () => saveDocumentInternal(id, title, type, data, options));
}

/**
 * EMERGENCY SNAPSHOT — the only fully synchronous write in this module.
 *
 * `saveDocument` cannot run in a `pagehide`/`beforeunload` handler: it awaits `getDB()`
 * before it touches anything, so the page dies during the first await and nothing lands.
 * This function does a single `JSON.stringify` + `localStorage.setItem` with no awaits, no
 * promises and no IndexedDB, so it completes inside the handler's synchronous execution.
 *
 * It is NOT a save:
 *  - it never touches IndexedDB, so nothing is durable in the primary store;
 *  - promotion happens later, on the next `loadDocument`, which sees a strictly higher
 *    revision and restores it (reporting `source: 'backup'` so the page can say so).
 *
 * It DOES perform a conflict check, and must. Because the snapshot's revision is floored
 * above everything it can see, it always wins the merge — so without a check, a STALE tab
 * closing dirty would overwrite the tab that legitimately owns the document, through the
 * unload backdoor, and the user would be told their work was "recovered". IndexedDB
 * cannot be read synchronously, so the check runs against the two things that can be: the
 * existing local copy and the revision ledger. Both are updated by every successful save
 * in every tab, so a winning tab leaves evidence here even though its own write went to
 * IndexedDB.
 *
 * The test is the same `isConflict` used by `saveDocument`, with the same rules: a witness
 * ahead of the caller's `knownRevision` refuses the snapshot unless this page instance
 * wrote that revision itself, and a witness with NO `knownRevision` offered refuses it
 * outright. That last case is why an unload handler cannot accidentally resurrect an old
 * view of a document it never managed to read.
 *
 * Returns true only if the snapshot is now on disk. Never throws. Returns false when:
 * storage is unavailable, the id is tombstoned, a witness shows the document is ahead of
 * this caller (conflict), the payload exceeds `BACKUP_SIZE_LIMIT_BYTES`, or the write was
 * refused. In every one of those cases any PREVIOUS local copy is left intact.
 *
 * Pass the SAME `knownRevision` you pass to `saveDocument`. Omitting it is safe but not
 * useful: it is now read as "no basis for this write", so the snapshot is refused whenever
 * any witness exists at all.
 *
 * Call it from a `pagehide` handler, after (not instead of) your normal autosave.
 */
export function saveDocumentBackupNow<T = unknown>(
  id: string,
  title: string,
  type: OfficeDocumentType,
  data: T,
  options: SaveDocumentOptions = {},
): boolean {
  try {
    if (!getLocalStorage()) {
      return false;
    }

    if (isDocumentTombstoned(id)) {
      // The document was deleted. An unload handler must not resurrect it.
      return false;
    }

    const ledger = getLedgerEntry(id);
    const existingCopy = readBackup(id);
    const clientId = getClientId();

    // Conflict check BEFORE anything is written. Every witness we can read synchronously
    // gets a vote; any one of them showing another client ahead of the caller is enough
    // to refuse. See the doc comment for why this cannot be delegated to the pages.
    const witnesses = [
      existingCopy && { revision: existingCopy.revision, lastSavedBy: existingCopy.lastSavedBy },
      ledger && { revision: ledger.r, lastSavedBy: ledger.by },
    ];

    for (const witness of witnesses) {
      if (witness && isConflict(id, witness, options, clientId)) {
        lastBackupError =
          `Emergency snapshot for "${id}" refused: revision ${witness.revision} by ${witness.lastSavedBy} ` +
          `is ahead of this tab's revision ${options.knownRevision ?? '(none supplied)'}. ` +
          `Refusing to overwrite the newer document.`;
        console.warn(lastBackupError);
        return false;
      }
    }

    const floor = Math.max(existingCopy?.revision ?? 0, ledger?.r ?? 0, options.knownRevision ?? 0);

    const record: StoredDocument = {
      id,
      title,
      type,
      data,
      updatedAt: Date.now(),
      revision: floor + 1,
      lastSavedBy: clientId,
    };

    // databasePersisted: false — IndexedDB definitively does not have this revision, so a
    // failed write must preserve the previous copy rather than delete it.
    if (!writeBackup(record, false)) {
      return false;
    }

    recordRevision(id, record.revision, clientId);
    recordOwnWrite(id, record.revision);
    return true;
  } catch (error) {
    // Nothing may escape into an unload handler.
    lastBackupError = describeError(error);
    return false;
  }
}

/**
 * Reads a document.
 *
 * Resolves to `undefined` ONLY when the document genuinely does not exist (or was
 * deleted). When the stores could not be read at all it THROWS `DocumentReadError` —
 * see that class for why the two cases must not share a return value.
 */
export async function loadDocument<T = unknown>(id: string) {
  if (isDocumentTombstoned(id)) {
    return undefined;
  }

  const db = await getDB();

  let databaseRecord: DocumentRecord<T> | undefined;
  // Did we actually complete a read of the primary store? `db !== null` is not the same
  // question: an open that failed and a `get` that threw both leave us knowing nothing.
  let databaseRead = false;
  let readError: unknown;
  if (db) {
    try {
      databaseRecord = normalizeDocument<T>(await db.get(STORE_NAME, id), 'database');
      databaseRead = true;
      markDatabaseHealthy();
    } catch (error) {
      markDatabaseUnhealthy(error);
      readError = error;
      console.warn('Database read failed; falling back to the local copy', error);
    }
  }

  const backupRecord = readBackup<T>(id);

  if (!databaseRead && backupRecord === undefined) {
    /*
     * ABSENT vs UNREADABLE. The primary store was never read and there is no local copy,
     * so nothing in this call has seen where this document lives.
     *
     * The revision ledger decides which of the two it is, and it is the right witness
     * because every successful save in this browser writes one: an entry means THIS
     * BROWSER HAS STORED THIS DOCUMENT, and since the only stores are local, a record for
     * it almost certainly exists right now in the IndexedDB we could not open. Returning
     * `undefined` in that state tells the caller "no such document"; it seeds a default and
     * autosaves, and the intact stored record is gone on the first keystroke.
     *
     * With NO ledger entry this browser has no evidence the document ever existed, and
     * refusing would be indistinguishable from refusing to create a new document — it would
     * make the whole app unusable wherever IndexedDB is permanently blocked (private
     * browsing, blocked site data), which is precisely the degraded mode the localStorage
     * path exists to serve. So that case still resolves to `undefined`.
     *
     * The ledger lives in localStorage, holds at most MAX_LEDGER_ENTRIES ids and is dropped
     * when the user clears site data, so a document whose entry has been evicted or cleared
     * and is then opened while IndexedDB is unreadable IS still reported absent here. That
     * used to be a data-loss gap: the caller seeded a default document and its first
     * autosave replaced the stored record, because a save carrying no (or a zeroed)
     * `knownRevision` was treated as a fast-forward, and the `lastSavedBy` half of the
     * conflict check was disabled for the very common case of a tab reopening a document it
     * had saved itself.
     *
     * It is no longer a data-loss gap, because `saveDocument` no longer infers overwrite
     * intent. A write over an existing record must either carry a `knownRevision` the
     * record has not moved past, or set `overwriteExisting` explicitly; and the same-client
     * exemption now requires that THIS PAGE INSTANCE wrote the stored revision, which a
     * freshly reloaded tab has not. So the mistaken-absent path ends in `status: 'conflict'`
     * with the stored record intact and offered back to the caller.
     *
     * RESIDUAL: if IndexedDB is unreadable at SAVE time too, and there is no local copy and
     * no ledger entry, nothing in this browser can witness the document — the save writes a
     * fresh localStorage copy at revision 1. That copy can never beat the stored record
     * (`backupBeatsDatabase` requires a strictly higher revision), so the document is not
     * destroyed; it is simply shadowed until IndexedDB recovers. Closing even that would
     * mean refusing to create any new document in a browser without IndexedDB.
     */
    const witness = getLedgerEntry(id);
    if (witness) {
      throw new DocumentReadError(
        `Document "${id}" could not be read: ${db ? 'IndexedDB rejected the read' : 'IndexedDB could not be opened'} and there is no local copy, ` +
          `but this browser has stored revision ${witness.r} of it. Nothing was read and nothing was written.`,
        readError ? describeError(readError) : lastDatabaseError,
      );
    }
  }

  const record = pickLatestRecord(databaseRecord, backupRecord);

  if (databaseRead && databaseRecord !== undefined) {
    // Heal a ghost ledger entry: nothing anywhere is as high as the ledger claims.
    repairLedgerDownward(id, Math.max(databaseRecord.revision, backupRecord?.revision ?? 0));
  } else if (databaseRead && databaseRecord === undefined && backupRecord === undefined) {
    // Confirmed absent from both stores — the ONLY safe place to forget the revision.
    // This used to be gated on `db` alone, so a `get` that threw also dropped the ledger
    // entry, discarding the one witness that protects the degraded-mode save path.
    forgetRevision(id);
  }

  if (record) {
    recordRevision(record.id, record.revision, record.lastSavedBy);
  }

  // Heal the database only when the local copy genuinely won. This promotion is a WRITE,
  // so it must obey the same rules as every other write: it goes through the per-id chain
  // and re-checks the stored revision inside one readwrite transaction. An unconditional
  // put here could overwrite a concurrent save's content at the same revision number —
  // invisible to any revision-based check, because only the content changes.
  if (record && record.source === 'backup' && db) {
    const settled = await enqueue(id, async () => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const existing = normalizeDocument<T>(await tx.store.get(id), 'database');

        if (existing && !backupBeatsDatabase(record, existing)) {
          // Something committed while we were reading. It wins; do not clobber it.
          await tx.done;
          return existing;
        }

        await tx.store.put(toStoredDocument(record));
        await tx.done;
        return record;
      } catch (error) {
        console.warn('Local copy promotion to database skipped', error);
        return record;
      }
    });

    return settled;
  }

  return record;
}

/** Reads every stored document, tolerating a missing 'by-date' index. */
async function readAllFromDatabase(db: IDBPDatabase<OfficeNinjaDB>) {
  const records: DocumentRecord[] = [];

  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    if (tx.store.indexNames.contains(DATE_INDEX)) {
      let cursor = await tx.store.index(DATE_INDEX).openCursor(null, 'prev');
      while (cursor) {
        const record = normalizeDocument(cursor.value, 'database');
        if (record) {
          records.push(record);
        }
        cursor = await cursor.continue();
      }
      await tx.done;
      return records;
    }
    void tx.done.catch(() => {});
  } catch (error) {
    console.warn('Indexed listing failed; falling back to a full store scan', error);
  }

  // No index, or the index scan failed. A full scan also catches rows the index cannot
  // hold (for example a non-finite updatedAt), which would otherwise be invisible.
  for (const value of await db.getAll(STORE_NAME)) {
    const record = normalizeDocument(value, 'database');
    if (record) {
      records.push(record);
    }
  }

  return records;
}

/**
 * Lists documents from IndexedDB MERGED with localStorage copies.
 *
 * The merge is not optional: a document saved while IndexedDB was briefly failing exists
 * only as a local copy, and an either/or listing hides it until a full page reload —
 * during which the user sees an empty Dashboard and recreates work they already have.
 * Deleted ids are excluded by tombstone, which is what stops the merge resurrecting them.
 */
export async function listDocuments() {
  const db = await getDB();
  let databaseRecords: DocumentRecord[] = [];

  if (db) {
    try {
      databaseRecords = await readAllFromDatabase(db);
      markDatabaseHealthy();
    } catch (error) {
      markDatabaseUnhealthy(error);
      console.warn('Database listing failed; using local copies only', error);
      databaseRecords = [];
    }
  }

  const merged = new Map<string, DocumentRecord>();
  for (const record of databaseRecords) {
    merged.set(record.id, record);
  }

  for (const backupRecord of listBackupDocuments()) {
    const existing = merged.get(backupRecord.id);
    // Higher revision wins, so the Dashboard shows the newest title and timestamp — the
    // metadata a user reads when deciding what to delete. Ties favour the database.
    if (!existing || backupBeatsDatabase(backupRecord, existing)) {
      merged.set(backupRecord.id, backupRecord);
    }
  }

  const tombstones = readTombstones();

  return [...merged.values()]
    .filter((record) => !has(tombstones, record.id))
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .map(({ id, title, type, updatedAt }) => ({ id, title, type, updatedAt }));
}

async function deleteDocumentInternal(id: string) {
  const db = await getDB();

  let deletedRecord: DocumentRecord | undefined;
  if (db) {
    try {
      deletedRecord = normalizeDocument(await db.get(STORE_NAME, id), 'database');
    } catch (error) {
      console.warn('Delete lookup failed', error);
    }
  }
  deletedRecord = deletedRecord ?? readBackup(id);

  // Tombstone and queue FIRST, so a delete that fails halfway is still hidden and still
  // retried. The tombstone stays unconfirmed until the row is actually gone.
  addTombstone(id, false);
  addPendingDelete(id);

  let confirmed = false;
  if (db) {
    try {
      await db.delete(STORE_NAME, id);
      confirmed = true;
      markDatabaseHealthy();
    } catch (error) {
      markDatabaseUnhealthy(error);
      console.warn('Database delete failed; queued for retry', error);
    }
  }

  if (confirmed) {
    // Only now is it safe to drop the local copy: the row is gone, so nothing can
    // resurrect the document and the copy is no longer the user's last resort.
    removeBackup(id);
    removePendingDelete(id);
    addTombstone(id, true);
    // The remembered revision described a document that no longer exists.
    forgetRevision(id);
    forgetOwnWrites(id);
  } else {
    console.warn(`Delete of "${id}" is not durable yet; the local copy is kept until IndexedDB confirms it.`);
  }

  postToChannel({
    ...createDocumentChangeEvent(
      deletedRecord
        ? toStoredDocument(deletedRecord)
        : { id, title: '', type: 'word', data: undefined, updatedAt: Date.now(), revision: 0, lastSavedBy: getClientId() },
    ),
    deleted: true,
  });
}

export function deleteDocument(id: string) {
  return enqueue(id, () => deleteDocumentInternal(id));
}

/**
 * Change notifications for `id`. Deletion notifications are NOT delivered here — use
 * `subscribeToDocumentDeletion` — so a delete cannot trigger a "newer version" banner.
 */
export function subscribeToDocument(id: string, callback: (event: DocumentChangeEvent) => void) {
  const channel = getChannel();
  if (!channel) {
    return () => {};
  }

  const listener = (event: MessageEvent<BroadcastPayload>) => {
    if (event.data?.id === id && !isDeletedEvent(event.data)) {
      callback(event.data);
    }
  };

  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
}

/**
 * Fires when `id` is deleted, in this tab or another one. The document is gone: stop
 * autosaving it and offer the user a choice, because the next `saveDocument` will throw
 * `code: 'document-deleted'`.
 */
export function subscribeToDocumentDeletion(id: string, callback: (event: DocumentChangeEvent) => void) {
  const channel = getChannel();
  if (!channel) {
    return () => {};
  }

  const listener = (event: MessageEvent<BroadcastPayload>) => {
    if (event.data?.id === id && isDeletedEvent(event.data)) {
      callback(event.data);
    }
  };

  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
}

export function getCurrentClientId() {
  return getClientId();
}
