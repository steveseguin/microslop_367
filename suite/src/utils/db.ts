import { deleteDB, openDB } from 'idb';
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
  knownRevision?: number | null;
}

export interface SaveDocumentResult<T = unknown> {
  status: 'saved' | 'conflict';
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
const BACKUP_PREFIX = 'officeninja_backup:';
const CLIENT_ID_STORAGE_KEY = 'officeninja_client_id';
const BROADCAST_CHANNEL_NAME = 'officeninja_documents';

let dbPromise: Promise<IDBPDatabase<OfficeNinjaDB> | null> | null = null;
let broadcastChannel: BroadcastChannel | null | undefined;

function getWindow() {
  return typeof window === 'undefined' ? undefined : window;
}

function getClientId() {
  const currentWindow = getWindow();
  if (!currentWindow) {
    return 'server';
  }

  let clientId = currentWindow.sessionStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (!clientId) {
    clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    currentWindow.sessionStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
  }

  return clientId;
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
    broadcastChannel = new currentWindow.BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }

  return broadcastChannel;
}

function notifyDocumentChange(record: StoredDocument) {
  const channel = getChannel();
  if (!channel) {
    return;
  }

  channel.postMessage(createDocumentChangeEvent(record));
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

function normalizeDocument<T = unknown>(
  record: Partial<StoredDocument> | undefined,
  source: DocumentRecord<T>['source'],
): DocumentRecord<T> | undefined {
  if (!record?.id || !record.title || !record.type || record.updatedAt == null) {
    return undefined;
  }

  return {
    id: record.id,
    title: record.title,
    type: record.type,
    data: record.data as T,
    updatedAt: record.updatedAt,
    revision: record.revision ?? 1,
    lastSavedBy: record.lastSavedBy ?? 'legacy',
    source,
  };
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

  if (backupRecord.updatedAt !== databaseRecord.updatedAt) {
    return backupRecord.updatedAt > databaseRecord.updatedAt ? backupRecord : databaseRecord;
  }

  return backupRecord.revision > databaseRecord.revision ? backupRecord : databaseRecord;
}

function writeBackup(record: StoredDocument) {
  const currentWindow = getWindow();
  if (!currentWindow) {
    return;
  }

  try {
    currentWindow.localStorage.setItem(getBackupKey(record.id), JSON.stringify(record));
  } catch (error) {
    console.warn('Backup write skipped', error);
  }
}

function readBackup<T = unknown>(id: string) {
  const currentWindow = getWindow();
  if (!currentWindow) {
    return undefined;
  }

  try {
    const stored = currentWindow.localStorage.getItem(getBackupKey(id));
    if (!stored) {
      return undefined;
    }

    return normalizeDocument<T>(JSON.parse(stored) as StoredDocument, 'backup');
  } catch (error) {
    console.warn('Backup read skipped', error);
    return undefined;
  }
}

function listBackupDocuments() {
  const currentWindow = getWindow();
  if (!currentWindow) {
    return [] as DocumentRecord[];
  }

  const documents: DocumentRecord[] = [];
  try {
    for (let index = 0; index < currentWindow.localStorage.length; index += 1) {
      const key = currentWindow.localStorage.key(index);
      if (!key?.startsWith(BACKUP_PREFIX)) {
        continue;
      }

      const stored = currentWindow.localStorage.getItem(key);
      if (!stored) {
        continue;
      }

      const document = normalizeDocument(JSON.parse(stored) as StoredDocument, 'backup');
      if (document) {
        documents.push(document);
      }
    }
  } catch (error) {
    console.warn('Backup listing skipped', error);
  }

  return documents;
}

function removeBackup(id: string) {
  const currentWindow = getWindow();
  if (!currentWindow) {
    return;
  }

  currentWindow.localStorage.removeItem(getBackupKey(id));
}

async function restoreBackupsToDatabase(db: IDBPDatabase<OfficeNinjaDB>) {
  const backups = listBackupDocuments();
  if (!backups.length) {
    return;
  }

  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const backup of backups) {
    await tx.store.put(toStoredDocument(backup));
  }
  await tx.done;
}

async function openDatabaseWithRecovery(): Promise<IDBPDatabase<OfficeNinjaDB> | null> {
  try {
    const db = await openDB<OfficeNinjaDB>(DB_NAME, DB_VERSION, {
      upgrade(upgradingDb, _oldVersion, _newVersion, transaction) {
        if (!upgradingDb.objectStoreNames.contains(STORE_NAME)) {
          const store = upgradingDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-date', 'updatedAt');
          return;
        }

        const store = transaction.objectStore(STORE_NAME);
        if (!store.indexNames.contains('by-date')) {
          store.createIndex('by-date', 'updatedAt');
        }
      },
    });

    await restoreBackupsToDatabase(db);
    return db;
  } catch (initialError) {
    console.warn('Database open failed, attempting recovery', initialError);

    try {
      await deleteDB(DB_NAME);
      const recoveredDb = await openDB<OfficeNinjaDB>(DB_NAME, DB_VERSION, {
        upgrade(upgradingDb) {
          const store = upgradingDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-date', 'updatedAt');
        },
      });

      await restoreBackupsToDatabase(recoveredDb);
      return recoveredDb;
    } catch (recoveryError) {
      console.error('Database recovery failed', recoveryError);
      return null;
    }
  }
}

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDatabaseWithRecovery();
  }

  return dbPromise;
}

export async function saveDocument<T = unknown>(
  id: string,
  title: string,
  type: OfficeDocumentType,
  data: T,
  options: SaveDocumentOptions = {},
): Promise<SaveDocumentResult<T>> {
  const clientId = getClientId();
  const now = Date.now();
  const backupSnapshot: StoredDocument = {
    id,
    title,
    type,
    data,
    updatedAt: now,
    revision: options.knownRevision ?? 1,
    lastSavedBy: clientId,
  };

  writeBackup(backupSnapshot);

  const db = await getDB();
  const currentRecord = db ? normalizeDocument<T>(await db.get(STORE_NAME, id), 'database') : readBackup<T>(id);

  if (
    currentRecord &&
    options.knownRevision != null &&
    currentRecord.revision > options.knownRevision &&
    currentRecord.lastSavedBy !== clientId
  ) {
    return {
      status: 'conflict',
      record: currentRecord,
    };
  }

  const nextRecord: StoredDocument = {
    id,
    title,
    type,
    data,
    updatedAt: now,
    revision: currentRecord ? currentRecord.revision + 1 : Math.max(1, (options.knownRevision ?? 0) + 1),
    lastSavedBy: clientId,
  };

  if (db) {
    await db.put(STORE_NAME, nextRecord);
  }

  writeBackup(nextRecord);
  notifyDocumentChange(nextRecord);

  return {
    status: 'saved',
    record: {
      ...nextRecord,
      data,
      source: db ? 'database' : 'backup',
    } as DocumentRecord<T>,
  };
}

export async function loadDocument<T = unknown>(id: string) {
  const db = await getDB();
  const databaseRecord = db ? normalizeDocument<T>(await db.get(STORE_NAME, id), 'database') : undefined;
  const backupRecord = readBackup<T>(id);
  const record = pickLatestRecord(databaseRecord, backupRecord);

  if (record?.source === 'backup' && db) {
    try {
      await db.put(STORE_NAME, toStoredDocument(record));
    } catch (error) {
      console.warn('Backup restore to database skipped', error);
    }
  }

  return record;
}

export async function listDocuments() {
  const db = await getDB();
  const merged = new Map<string, DocumentRecord>();

  if (db) {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.store.index('by-date');
    let cursor = await index.openCursor(null, 'prev');

    while (cursor) {
      const record = normalizeDocument(cursor.value, 'database');
      if (record) {
        merged.set(record.id, record);
      }
      cursor = await cursor.continue();
    }
  }

  for (const backupRecord of listBackupDocuments()) {
    const current = merged.get(backupRecord.id);
    merged.set(backupRecord.id, pickLatestRecord(current, backupRecord) ?? backupRecord);
  }

  return [...merged.values()]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .map(({ id, title, type, updatedAt }) => ({ id, title, type, updatedAt }));
}

export async function deleteDocument(id: string) {
  const db = await getDB();
  if (db) {
    await db.delete(STORE_NAME, id);
  }

  removeBackup(id);
}

export function subscribeToDocument(id: string, callback: (event: DocumentChangeEvent) => void) {
  const channel = getChannel();
  if (!channel) {
    return () => {};
  }

  const listener = (event: MessageEvent<DocumentChangeEvent>) => {
    if (event.data?.id === id) {
      callback(event.data);
    }
  };

  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
}

export function getCurrentClientId() {
  return getClientId();
}
