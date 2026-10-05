import { openDB } from 'idb';
import { useCallback, useEffect, useRef, useState } from 'react';

// Separate from the document database: these workspaces include binary PDFs and
// running timers. Existing office document formats and recovery stay unchanged.
const database = () =>
  openDB('officeninja-tools', 1, {
    upgrade(db) {
      db.createObjectStore('workspaces');
    },
  });
interface Stored<T> {
  revision: number;
  data: T;
  /** When this version was written (ms). Absent on records saved before sync existed. */
  savedAt?: number;
}

/** Tells every tab (and open tool page) that a workspace was rewritten elsewhere. */
const CHANNEL = 'officeninja-tools';
const TAB_ID = Math.random().toString(36).slice(2);
function announce(key: string, revision: number) {
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage({ key, revision, from: TAB_ID });
    bc.close();
  } catch {
    /* BroadcastChannel unavailable: other tabs will see it on reload. */
  }
}

/** Read the raw stored record (revision, data, savedAt) without subscribing. */
export async function readToolRecord<T>(key: string): Promise<Stored<T> | null> {
  try {
    const db = await database();
    try {
      return ((await db.get('workspaces', key)) as Stored<T> | undefined) ?? null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

/**
 * Write a workspace from outside its page (backup restore, device sync). The
 * revision moves forward and open pages are told to reload rather than being
 * locked out by the revision check.
 */
export async function writeToolWorkspace<T>(key: string, data: T, savedAt = Date.now()) {
  const db = await database();
  try {
    const tx = db.transaction('workspaces', 'readwrite');
    const previous = (await tx.store.get(key)) as Stored<T> | undefined;
    const revision = (previous?.revision ?? 0) + 1;
    await tx.store.put({ revision, data, savedAt } satisfies Stored<T>, key);
    await tx.done;
    announce(key, revision);
    return revision;
  } finally {
    db.close();
  }
}

export function subscribeToTools(listener: (key: string) => void) {
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (e: MessageEvent<{ key?: string }>) => {
      if (typeof e.data?.key === 'string') listener(e.data.key);
    };
    return () => bc.close();
  } catch {
    return () => {};
  }
}

export function useToolStorage<T>(key: string, initial: T) {
  const [data, setData] = useState(initial);
  const current = useRef(initial);
  const revision = useRef(0);
  const ready = useRef(false);
  const blocked = useRef(false);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  const [status, setStatus] = useState('Loading…');
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    (async () => {
      const db = await database();
      try {
        const record: Stored<T> | undefined = await db.get('workspaces', key);
        if (disposed) return;
        if (record) {
          current.current = record.data;
          revision.current = record.revision;
          setData(record.data);
        }
        ready.current = true;
        setStatus('Saved locally');
      } finally {
        db.close();
      }
    })().catch(() => {
      if (!disposed) {
        setError('Local storage could not be opened. Reload to try again.');
        setStatus('Storage unavailable');
      }
    });
    return () => {
      disposed = true;
    };
  }, [key]);

  // Another tab, a restore or device sync rewrote this workspace: take the new
  // version, unless this page is mid-save (its own write will report the clash).
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL);
    } catch {
      return;
    }
    channel.onmessage = async (e: MessageEvent<{ key?: string; from?: string }>) => {
      if (e.data?.key !== key || e.data.from === TAB_ID) return;
      if (!ready.current || pending.current || blocked.current) return;
      const record = await readToolRecord<T>(key);
      if (!record || record.revision <= revision.current || pending.current) return;
      current.current = record.data;
      revision.current = record.revision;
      setData(record.data);
    };
    return () => channel?.close();
  }, [key]);

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (pending.current || blocked.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, []);

  const update = useCallback(
    (change: (previous: T) => T): Promise<boolean> => {
      if (!ready.current || blocked.current) return Promise.resolve(false);
      const next = change(current.current);
      current.current = next;
      setData(next);
      pending.current++;
      setStatus('Saving…');
      let succeeded = false;
      const task = queue.current
        .then(async () => {
          if (blocked.current) return;
          const db = await database();
          try {
            const tx = db.transaction('workspaces', 'readwrite');
            // A failed request also rejects tx.done. Observe that rejection even
            // when awaiting get/put exits early; the write path still reports it.
            const completed = tx.done;
            void completed.catch(() => {});
            const previous: Stored<T> | undefined = await tx.store.get(key);
            if ((previous?.revision ?? 0) !== revision.current) {
              await completed;
              throw new Error(
                'This workspace changed in another tab. Export your local work, then reload to use the latest saved version.',
              );
            }
            const nextRevision = revision.current + 1;
            await tx.store.put({ revision: nextRevision, data: next, savedAt: Date.now() }, key);
            await completed;
            revision.current = nextRevision;
            succeeded = true;
            announce(key, nextRevision);
          } finally {
            db.close();
          }
        })
        .catch((reason: unknown) => {
          blocked.current = true;
          setError(
            reason instanceof Error && reason.message.includes('another tab')
              ? reason.message
              : 'Saving failed. Export your work before leaving, then reload. Your previous saved copy is intact.',
          );
        })
        .finally(() => {
          pending.current--;
          setStatus(
            blocked.current
              ? 'Not saved'
              : pending.current
                ? 'Saving…'
                : 'Saved locally',
          );
        });
      queue.current = task;
      return task.then(() => succeeded);
    },
    [key],
  );

  return {
    data,
    update,
    status,
    error,
    ready: ready.current && !blocked.current,
  };
}

export function downloadFile(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  // Strip control bytes from download names as well as Windows path characters.
  // eslint-disable-next-line no-control-regex
  anchor.download = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-');
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function exportJSON(name: string, data: unknown) {
  downloadFile(name, JSON.stringify(data, null, 2), 'application/json');
}

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function csvCell(value: unknown) {
  const text = String(value ?? '');
  // Prevent imported spreadsheet formulas in user-controlled strings.
  return `"${(/^[=+\-@\t\r]/.test(text) ? "'" : '') + text.replace(/"/g, '""')}"`;
}

/** Read a tool workspace once, without subscribing (for workspace summaries). */
export async function readToolWorkspace<T>(key: string): Promise<T | null> {
  try {
    const db = await database();
    try {
      const record: Stored<T> | undefined = await db.get('workspaces', key);
      return record?.data ?? null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}
