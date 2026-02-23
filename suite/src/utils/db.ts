import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface OfficeNinjaDB extends DBSchema {
  documents: {
    key: string;
    value: {
      id: string;
      title: string;
      type: 'word' | 'excel' | 'powerpoint';
      data: any;
      updatedAt: number;
    };
    indexes: { 'by-date': number };
  };
}

const DB_NAME = 'OfficeNinjaDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

async function getDB(): Promise<IDBPDatabase<OfficeNinjaDB>> {
  return openDB<OfficeNinjaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'updatedAt');
      }
    },
  });
}

export async function saveDocument(id: string, title: string, type: 'word' | 'excel' | 'powerpoint', data: any) {
  const db = await getDB();
  await db.put(STORE_NAME, {
    id,
    title,
    type,
    data,
    updatedAt: Date.now(),
  });
}

export async function loadDocument(id: string) {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function listDocuments() {
  const db = await getDB();
  // Get all documents sorted by date descending
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.store.index('by-date');
  
  let cursor = await index.openCursor(null, 'prev');
  const docs = [];
  
  while (cursor) {
    // Only return metadata, not the full payload to keep listing fast
    const { id, title, type, updatedAt } = cursor.value;
    docs.push({ id, title, type, updatedAt });
    cursor = await cursor.continue();
  }
  
  return docs;
}

export async function deleteDocument(id: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}
