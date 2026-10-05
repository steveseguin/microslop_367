/**
 * Runs while any OfficeNinja tab is open: device sync (if paired) and the
 * folder backup (if a folder was chosen and the browser still has access).
 */
import { startSync, syncGroup } from './p2p';
import { folderPermission, mergeFromFolder, savedFolder, writeToFolder } from './folder';
import { describeReport } from './snapshot';
import { markBackedUp } from './backupFile';
import { subscribeToTools } from '../toolStorage';

const FOLDER_STATE = 'officeninja_folder_state';
export interface FolderState {
  lastWrite: number;
  lastMerge: number;
  lastResult: string;
  name: string;
}
export function folderState(): FolderState | null {
  try {
    return JSON.parse(localStorage.getItem(FOLDER_STATE) || 'null');
  } catch {
    return null;
  }
}
function saveFolderState(patch: Partial<FolderState>) {
  const next = { lastWrite: 0, lastMerge: 0, lastResult: '', name: '', ...folderState(), ...patch };
  try {
    localStorage.setItem(FOLDER_STATE, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('officeninja-folder'));
  return next;
}

let folderBusy = false;
/** Merge anything newer from the folder, then write this device's copy. */
export async function syncFolderNow(ask = false) {
  if (folderBusy) return null;
  const handle = await savedFolder();
  if (!handle) return null;
  if ((await folderPermission(handle, ask)) !== 'granted') return 'needs-permission' as const;
  folderBusy = true;
  try {
    const state = folderState();
    const merged = await mergeFromFolder(handle, state?.lastMerge ?? 0);
    if (merged)
      saveFolderState({
        lastMerge: merged.created,
        lastResult: `From ${merged.device}: ${describeReport(merged.report)}`,
      });
    const written = await writeToFolder(handle);
    saveFolderState({ lastWrite: written, name: handle.name });
    markBackedUp(`folder “${handle.name}”`);
    return 'ok' as const;
  } catch {
    return 'failed' as const;
  } finally {
    folderBusy = false;
  }
}

let started = false;
export function startBackgroundSync() {
  if (started) return;
  started = true;
  if (syncGroup()) void startSync();

  // Folder backup: shortly after any change, and every few minutes.
  let timer: number | undefined;
  const soon = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void syncFolderNow(false), 20_000);
  };
  subscribeToTools(soon);
  try {
    const docs = new BroadcastChannel('officeninja_documents');
    docs.onmessage = soon;
  } catch {
    /* interval below still runs */
  }
  window.setInterval(() => void syncFolderNow(false), 3 * 60_000);
  window.setTimeout(() => void syncFolderNow(false), 4_000);
}
