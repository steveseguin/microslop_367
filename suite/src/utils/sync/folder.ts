/**
 * Keep a backup in a folder the user picks (Chrome / Edge on desktop). If the
 * folder lives inside Dropbox, OneDrive, iCloud Drive or Google Drive for
 * desktop, that service uploads it, so this is cloud backup with no account
 * here. Two computers pointed at the same synced folder merge each other's
 * changes.
 */
import { openDB } from 'idb';
import { applySnapshot, buildSnapshot, deviceInfo, decodeJson, encodeJson } from './snapshot';
import type { ApplyReport, Snapshot } from './snapshot';

const FILE = 'officeninja-backup.json';

type Permission = 'granted' | 'denied' | 'prompt';
interface DirHandle {
  name: string;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FileHandle>;
  queryPermission?(opts: { mode: 'readwrite' }): Promise<Permission>;
  requestPermission?(opts: { mode: 'readwrite' }): Promise<Permission>;
}
interface FileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: Blob | string): Promise<void>; close(): Promise<void> }>;
}

const store = () =>
  openDB('officeninja-sync', 1, {
    upgrade(db) {
      db.createObjectStore('kv');
    },
  });

export const folderSupported = () => typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export async function savedFolder(): Promise<DirHandle | null> {
  try {
    const db = await store();
    try {
      return ((await db.get('kv', 'folder')) as DirHandle | undefined) ?? null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

async function remember(handle: DirHandle | null) {
  const db = await store();
  try {
    if (handle) await db.put('kv', handle, 'folder');
    else await db.delete('kv', 'folder');
  } finally {
    db.close();
  }
}

export async function chooseFolder(): Promise<DirHandle> {
  const picker = (window as unknown as {
    showDirectoryPicker: (o: { mode: 'readwrite'; id?: string }) => Promise<DirHandle>;
  }).showDirectoryPicker;
  const handle = await picker({ mode: 'readwrite', id: 'officeninja-backup' });
  await remember(handle);
  return handle;
}

export async function forgetFolder() {
  await remember(null);
}

/** 'granted', or 'prompt' when the browser needs a click to allow access again. */
export async function folderPermission(handle: DirHandle, ask = false): Promise<Permission> {
  try {
    const current = (await handle.queryPermission?.({ mode: 'readwrite' })) ?? 'granted';
    if (current === 'granted' || !ask) return current;
    return (await handle.requestPermission?.({ mode: 'readwrite' })) ?? 'denied';
  } catch {
    return 'denied';
  }
}

export async function writeToFolder(handle: DirHandle) {
  const snapshot = await buildSnapshot();
  const file = await handle.getFileHandle(FILE, { create: true });
  const writable = await file.createWritable();
  await writable.write(new Blob([encodeJson({ ...snapshot, deviceId: deviceInfo().id })], { type: 'application/json' }));
  await writable.close();
  return snapshot.created;
}

/** Merge the folder's backup if another device wrote it. Null when there is nothing new. */
export async function mergeFromFolder(
  handle: DirHandle,
  since: number,
): Promise<{ report: ApplyReport; created: number; device: string } | null> {
  let text: string;
  try {
    text = await (await (await handle.getFileHandle(FILE)).getFile()).text();
  } catch {
    return null; // no backup there yet
  }
  const snapshot = decodeJson<Snapshot & { deviceId?: string }>(text);
  if (snapshot.deviceId === deviceInfo().id || snapshot.created <= since) return null;
  return { report: await applySnapshot(snapshot), created: snapshot.created, device: snapshot.device };
}
