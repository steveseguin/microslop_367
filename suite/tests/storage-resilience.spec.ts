import { expect, test } from '@playwright/test';
import { banner, editorPath, makeId, statusPill, waitForExcelReady, waitForWordReady } from './helpers/app';
import { setCell } from './helpers/excel';

/**
 * What happens when browser storage is not available — private-browsing modes, blocked
 * third-party storage, exhausted quota.
 *
 * The contract these tests defend is narrow and important: the app may degrade, but it
 * must NEVER tell the user their work is "Saved" when nothing was written. A false
 * "Saved" is worse than a visible failure, because the user then closes the tab.
 */

/** Makes `window.localStorage` throw on every access, the way a locked-down browser does. */
const BLOCK_LOCAL_STORAGE = `
  const boom = () => { throw new DOMException('Access is denied for this document.', 'SecurityError'); };
  Object.defineProperty(window, 'localStorage', { configurable: true, get: boom });
  Object.defineProperty(window, 'sessionStorage', { configurable: true, get: boom });
`;

/** Makes every IndexedDB open fail, the way some privacy modes do. */
const BLOCK_INDEXED_DB = `
  const request = () => {
    const target = {
      result: undefined,
      error: new DOMException('IndexedDB is disabled.', 'InvalidStateError'),
      onerror: null, onsuccess: null, onupgradeneeded: null, onblocked: null,
      addEventListener(type, handler) { if (type === 'error') { this.onerror = handler; } },
      removeEventListener() {},
      dispatchEvent() { return true; },
    };
    setTimeout(() => { target.onerror && target.onerror({ target, type: 'error' }); }, 0);
    return target;
  };
  Object.defineProperty(window, 'indexedDB', {
    configurable: true,
    get: () => ({ open: request, deleteDatabase: request, databases: async () => [] }),
  });
`;

test.describe('Storage unavailable', () => {
  test('with localStorage blocked, Word still loads and still saves to IndexedDB', async ({ context }) => {
    const page = await context.newPage();
    await page.addInitScript(BLOCK_LOCAL_STORAGE);

    const id = makeId('no-local-storage');
    await page.goto(editorPath('word', id));
    await waitForWordReady(page);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Written with localStorage denied.');

    await expect(statusPill(page)).toHaveText('Saved');

    // Prove it: reload and the content is still there, from IndexedDB alone.
    await page.reload();
    await waitForWordReady(page);
    await expect(page.locator('.ProseMirror')).toContainText('Written with localStorage denied.');

    await page.close();
  });

  test('with IndexedDB blocked, Word degrades to the local copy and says so honestly', async ({ context }) => {
    const page = await context.newPage();
    await page.addInitScript(BLOCK_INDEXED_DB);

    const id = makeId('no-idb');
    await page.goto(editorPath('word', id));
    await waitForWordReady(page);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Written with IndexedDB denied.');

    // The localStorage copy is a real save, so "Saved" here is truthful...
    await expect(statusPill(page)).toHaveText('Saved');
    // ...and it must actually come back.
    await page.reload();
    await waitForWordReady(page);
    await expect(page.locator('.ProseMirror')).toContainText('Written with IndexedDB denied.');

    await page.close();
  });

  test('with IndexedDB blocked, Excel labels the degraded save instead of claiming a normal one', async ({ context }) => {
    const page = await context.newPage();
    await page.addInitScript(BLOCK_INDEXED_DB);

    const id = makeId('excel-no-idb');
    await page.goto(editorPath('excel', id));
    await waitForExcelReady(page);

    await setCell(page, 5, 0, 'degraded save');
    await expect(statusPill(page)).toHaveText('Saved to local backup only');

    await page.close();
  });

  test('with BOTH stores blocked, nothing is ever reported as saved', async ({ context }) => {
    const page = await context.newPage();
    await page.addInitScript(BLOCK_INDEXED_DB);
    await page.addInitScript(BLOCK_LOCAL_STORAGE);

    const id = makeId('no-storage-at-all');
    await page.goto(editorPath('word', id));
    await waitForWordReady(page);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('There is nowhere to put this.');

    await expect(statusPill(page)).toHaveText('Save failed');
    await expect(banner(page)).toContainText('could not be saved');
    // The user's text must still be in front of them so they can copy it out.
    await expect(page.locator('.ProseMirror')).toContainText('There is nowhere to put this.');

    await page.close();
  });

  test('the Dashboard still renders when no storage is available', async ({ context }) => {
    const page = await context.newPage();
    await page.addInitScript(BLOCK_INDEXED_DB);
    await page.addInitScript(BLOCK_LOCAL_STORAGE);

    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();
    await expect(page.locator('.dashboard-empty')).toContainText('No files yet.');
    await expect(page.getByRole('link', { name: 'New document' })).toBeVisible();

    await page.close();
  });

  test('the theme toggle survives blocked storage rather than throwing', async ({ context }) => {
    const page = await context.newPage();
    await page.addInitScript(BLOCK_LOCAL_STORAGE);

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();

    const toggle = page.getByRole('button', { name: /Switch to (light|dark) theme/ });
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await toggle.click();
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.getAttribute('data-theme')))
      .not.toBe(before);

    expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);

    await page.close();
  });
});
