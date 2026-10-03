import { openDB } from 'idb';

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
    if (localStorage.getItem('blueline:last') === JSON.stringify(id)) {
      localStorage.removeItem('blueline:last');
    }
  } finally {
    db.close();
  }
}
