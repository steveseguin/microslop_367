import { openDB } from 'idb';

interface DesignFile {
  id: string;
  name: string;
  updated: number;
  nodes: Record<string, { name?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface DesignDocument {
  id: string;
  title: string;
  type: 'blueline';
  data: DesignFile;
  updatedAt: number;
}

// Blueline remains the owner of its files. Read its existing store rather than
// duplicating designs into the office database or changing its file format.
async function openDesigns() {
  return openDB('blueline', 1, {
    upgrade(db) {
      db.createObjectStore('files', { keyPath: 'id' });
    },
  });
}

export function designUrl(id?: string) {
  const url = new URL(`${import.meta.env.BASE_URL}blueline/`, document.baseURI);
  url.searchParams.set(id ? 'id' : 'new', id || '1');
  return url.href;
}

export async function listDesigns() {
  const db = await openDesigns();
  try {
    const files = await db.getAll('files');
    return files.map((file) => ({
      id: String(file.id),
      title: String(file.name || 'Untitled design'),
      type: 'blueline' as const,
      updatedAt: Number(file.updated) || 0,
    }));
  } finally {
    db.close();
  }
}

export async function deleteDesign(id: string) {
  const db = await openDesigns();
  try {
    await db.delete('files', id);
    try {
      if (localStorage.getItem('blueline:last') === JSON.stringify(id)) localStorage.removeItem('blueline:last');
    } catch { /* The IndexedDB deletion succeeded even if preferences are blocked. */ }
  } finally {
    db.close();
  }
}

export async function loadDesign(id: string): Promise<DesignDocument | undefined> {
  const db = await openDesigns();
  try {
    const file: DesignFile | undefined = await db.get('files', id);
    return file ? { id, title: file.name, type: 'blueline', data: file, updatedAt: file.updated } : undefined;
  } finally {
    db.close();
  }
}

export async function restoreDesign(record: DesignDocument) {
  const db = await openDesigns();
  try {
    // Undo must not replace a design recreated in another tab.
    await db.add('files', record.data);
  } finally {
    db.close();
  }
}

export async function renameDesign(id: string, name: string) {
  const db = await openDesigns();
  try {
    const tx = db.transaction('files', 'readwrite');
    const file: DesignFile | undefined = await tx.store.get(id);
    if (file) {
      file.name = name;
      file.nodes.root.name = name;
      file.updated = Date.now();
      await tx.store.put(file);
    }
    await tx.done;
  } finally {
    db.close();
  }
}
