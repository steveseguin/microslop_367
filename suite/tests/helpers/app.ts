import { devices, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Shared helpers for the OfficeNinja Playwright suite.
 *
 * Three rules are encoded here, because every one of them has already caused a wrong
 * conclusion in this repo:
 *
 *  1. The app uses HashRouter. A bare `/word` renders the Dashboard, silently. Always
 *     navigate through `openWord` / `openExcel` / `openSlides`, never `page.goto('/word')`.
 *
 *  2. `page.goto()` to a URL that differs only in the hash does NOT reload the document.
 *     Any "does it survive a reload?" assertion must go through `reloadEditor`, which
 *     performs a real `page.reload()`.
 *
 *  3. Save status in the header is a UI hint, not proof. `Saved` is the INITIAL status of
 *     a brand new spreadsheet and deck, so asserting it proves nothing. Persistence is
 *     asserted against IndexedDB via `expectStored` / `readStoredDocument`.
 */

export const DB_NAME = 'OfficeNinjaDB';
export const STORE_NAME = 'documents';

/** iPhone 14 metrics without `defaultBrowserType`, which would fight the project's browser. */
const iPhone14 = devices['iPhone 14'];
export const MOBILE = {
  viewport: iPhone14.viewport,
  userAgent: iPhone14.userAgent,
  deviceScaleFactor: iPhone14.deviceScaleFactor,
  isMobile: iPhone14.isMobile,
  hasTouch: iPhone14.hasTouch,
} as const;

export type DocType = 'word' | 'excel' | 'powerpoint';

export interface StoredDocument<T = unknown> {
  id: string;
  title: string;
  type: DocType;
  data: T;
  updatedAt: number;
  revision: number;
  lastSavedBy: string;
}

let idCounter = 0;

/** Unique per call, so tests never collide even when run repeatedly in the same second. */
export function makeId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export function editorPath(type: DocType, id: string) {
  return `/#/${type}?id=${encodeURIComponent(id)}`;
}

export async function openDashboard(page: Page) {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();
}

export async function openWord(page: Page, id: string) {
  await page.goto(editorPath('word', id));
  await waitForWordReady(page);
  return id;
}

export async function openExcel(page: Page, id: string) {
  await page.goto(editorPath('excel', id));
  await waitForExcelReady(page);
  return id;
}

export async function openSlides(page: Page, id: string) {
  await page.goto(editorPath('powerpoint', id));
  await waitForSlidesReady(page);
  return id;
}

export async function waitForWordReady(page: Page) {
  await expect(page.locator('.document-page')).toBeVisible();
  await expect(page.locator('.ProseMirror')).toBeVisible();
}

export async function waitForExcelReady(page: Page) {
  await expect(page.getByLabel('Formula input')).toBeVisible();
  // The grid paints to canvas; wait for the canvas element itself, not for a timeout.
  await expect(page.locator('canvas.fortune-sheet-canvas').first()).toBeVisible();
  await expect(page.locator('.panel-list')).toContainText('Total sheets:');
  // The workbook reports its selection only after `onReady` has run one animation frame.
  await expect(page.locator('.formula-coordinate')).toHaveText(/^[A-Z]+\d+$/);
}

export async function waitForSlidesReady(page: Page) {
  await expect(page.locator('.canvas-shell canvas').first()).toBeVisible();
  await expect(page.locator('.slide-card').first()).toBeVisible();
}

/**
 * A REAL document reload. `page.goto` with only a hash difference is a no-op for the
 * document, so it can never prove that anything was persisted.
 */
export async function reloadEditor(page: Page, type: DocType) {
  await page.reload();
  if (type === 'word') {
    await waitForWordReady(page);
  } else if (type === 'excel') {
    await waitForExcelReady(page);
  } else {
    await waitForSlidesReady(page);
  }
}

/* ------------------------------------------------------------------ */
/* IndexedDB access                                                    */
/* ------------------------------------------------------------------ */

/**
 * These helpers open the app database WITHOUT an explicit version, so they adopt whatever
 * schema the app created and can never trigger an upgrade (which would deadlock against
 * the page's own open connection). Every browser-side function below is self-contained,
 * because `page.evaluate` serialises the function and drops its closure.
 */

export async function readStoredDocument<T = unknown>(page: Page, id: string) {
  return page.evaluate(
    async ({ dbName, storeName, docId }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      try {
        if (!db.objectStoreNames.contains(storeName)) {
          return null;
        }

        return await new Promise<StoredDocument<T> | null>((resolve, reject) => {
          const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(docId);
          request.onsuccess = () =>
            resolve(request.result ? (JSON.parse(JSON.stringify(request.result)) as StoredDocument<T>) : null);
          request.onerror = () => reject(request.error);
        });
      } finally {
        db.close();
      }
    },
    { dbName: DB_NAME, storeName: STORE_NAME, docId: id },
  );
}

export async function listStoredDocuments(page: Page) {
  return page.evaluate(
    async ({ dbName, storeName }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      try {
        if (!db.objectStoreNames.contains(storeName)) {
          return [] as StoredDocument[];
        }

        return await new Promise<StoredDocument[]>((resolve, reject) => {
          const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
          request.onsuccess = () => resolve(JSON.parse(JSON.stringify(request.result)) as StoredDocument[]);
          request.onerror = () => reject(request.error);
        });
      } finally {
        db.close();
      }
    },
    { dbName: DB_NAME, storeName: STORE_NAME },
  );
}

/** Writes records straight into IndexedDB so a test can start from a known corpus. */
export async function seedDocuments(page: Page, records: StoredDocument[]) {
  await page.evaluate(
    async ({ dbName, storeName, rows }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      try {
        if (!db.objectStoreNames.contains(storeName)) {
          // The app creates the store on its first storage call. Seeding before the app
          // has loaded once would silently write nothing.
          throw new Error('seedDocuments: object store missing - open a page of the app first');
        }

        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          for (const row of rows) {
            store.put(row);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
    { dbName: DB_NAME, storeName: STORE_NAME, rows: records },
  );
}

export function buildStoredDocument<T>(
  id: string,
  type: DocType,
  title: string,
  data: T,
  overrides: Partial<StoredDocument<T>> = {},
): StoredDocument<T> {
  return {
    id,
    title,
    type,
    data,
    updatedAt: Date.now(),
    revision: 1,
    lastSavedBy: 'seed',
    ...overrides,
  };
}

/**
 * Polls IndexedDB until the stored document satisfies `predicate`.
 *
 * This is the persistence oracle for the whole suite. It is deliberately not "wait for the
 * status pill to say Saved": that pill starts life saying "Saved" on a new spreadsheet and
 * a new deck, so it would pass against an app that never wrote anything at all.
 */
export async function expectStored<T = unknown>(
  page: Page,
  id: string,
  predicate: (record: StoredDocument<T> | null) => boolean,
  message = 'stored document never reached the expected state',
) {
  await expect
    .poll(async () => predicate(await readStoredDocument<T>(page, id)), {
      message,
      timeout: 20_000,
      intervals: [150, 250, 400, 600, 1000],
    })
    .toBe(true);
}

export async function currentRevision(page: Page, id: string) {
  return (await readStoredDocument(page, id))?.revision ?? 0;
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

/** 1x1 transparent PNG, small enough to embed anywhere. */
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function tinyPngBytes() {
  return [...Buffer.from(TINY_PNG_BASE64, 'base64')];
}

/** Dispatches a real DataTransfer drop of a PNG onto `selector`. */
export async function dropImageOn(page: Page, selector: string, fileName = 'dropped.png') {
  await page.evaluate(
    ({ targetSelector, bytes, name }) => {
      const target = document.querySelector(targetSelector);
      if (!target) {
        throw new Error(`Drop target not found: ${targetSelector}`);
      }

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File([new Uint8Array(bytes)], name, { type: 'image/png' }));

      for (const eventName of ['dragenter', 'dragover', 'drop']) {
        target.dispatchEvent(new DragEvent(eventName, { bubbles: true, cancelable: true, dataTransfer }));
      }
    },
    { targetSelector: selector, bytes: tinyPngBytes(), name: fileName },
  );
}

export function banner(page: Page) {
  return page.locator('.editor-banner');
}

export function statusPill(page: Page) {
  return page.locator('.status-pill');
}

/** The editor ribbon. On mobile the same controls live inside `.mobile-toolbar-sheet`. */
export function ribbon(page: Page) {
  return page.locator('.toolbar-shell');
}
