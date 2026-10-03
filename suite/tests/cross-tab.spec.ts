import { expect, test } from '@playwright/test';
import {
  banner,
  editorPath,
  expectStored,
  makeId,
  readStoredDocument,
  statusPill,
  waitForExcelReady,
  waitForWordReady,
} from './helpers/app';
import { setCell, storedCellValue } from './helpers/excel';

/**
 * Two tabs of the same browser, in ONE browser context so they share an origin, its
 * IndexedDB, its localStorage and — the point of this file — its BroadcastChannel.
 *
 * Playwright's `browser.newContext()` gives isolated storage per context, so a second
 * context would be a different browser profile entirely and could never observe the other
 * tab's writes. Everything here therefore uses `context.newPage()`.
 */

test.describe('Cross-tab awareness', () => {
  test('a save in one tab notifies the other tab over BroadcastChannel', async ({ context }) => {
    const id = makeId('broadcast');
    const first = await context.newPage();
    const second = await context.newPage();

    await first.goto(editorPath('word', id));
    await waitForWordReady(first);
    await second.goto(editorPath('word', id));
    await waitForWordReady(second);

    // Prove the channel exists in this build before relying on it.
    expect(await second.evaluate(() => typeof window.BroadcastChannel)).toBe('function');

    await first.locator('.ProseMirror').click();
    await first.keyboard.press('ControlOrMeta+a');
    await first.keyboard.press('Backspace');
    await first.keyboard.type('Saved from the first tab.');

    await expectStored(first, id, (record) => JSON.stringify(record?.data ?? '').includes('Saved from the first tab.'));

    // The second tab is told, without polling and without a reload.
    await expect(banner(second)).toContainText('A newer version is available from another tab.');

    // ...and it must NOT have silently swapped the user's content underneath them.
    await expect(second.locator('.ProseMirror')).not.toContainText('Saved from the first tab.');

    await first.close();
    await second.close();
  });

  test('the stale tab reports a conflict and does not overwrite the winner', async ({ context }) => {
    const id = makeId('word-conflict');
    const first = await context.newPage();
    const second = await context.newPage();

    await first.goto(editorPath('word', id));
    await waitForWordReady(first);
    await second.goto(editorPath('word', id));
    await waitForWordReady(second);

    await first.locator('.ProseMirror').click();
    await first.keyboard.press('ControlOrMeta+a');
    await first.keyboard.press('Backspace');
    await first.keyboard.type('Winner content from tab one.');
    await expectStored(first, id, (record) => JSON.stringify(record?.data ?? '').includes('Winner content from tab one.'));

    await second.locator('.ProseMirror').click();
    await second.keyboard.press('ControlOrMeta+a');
    await second.keyboard.press('Backspace');
    await second.keyboard.type('Loser content from tab two.');

    await expect(statusPill(second)).toContainText('Conflict detected');
    await expect(banner(second)).toContainText('newer version');

    // The losing tab keeps the user's text on screen...
    await expect(second.locator('.ProseMirror')).toContainText('Loser content from tab two.');
    // ...and storage still holds the winner. Nothing was overwritten.
    const stored = await readStoredDocument(first, id);
    expect(JSON.stringify(stored!.data)).toContain('Winner content from tab one.');
    expect(JSON.stringify(stored!.data)).not.toContain('Loser content from tab two.');

    await first.close();
    await second.close();
  });

  test('Excel reports a workbook conflict rather than clobbering the newer workbook', async ({ context }) => {
    const id = makeId('excel-conflict');
    const first = await context.newPage();
    await first.goto(editorPath('excel', id));
    await waitForExcelReady(first);

    await setCell(first, 5, 0, 'from tab one');
    await expectStored(first, id, (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 5, 0) === 'from tab one');

    // The second tab opens at the current revision, then the first tab moves ahead.
    const second = await context.newPage();
    await second.goto(editorPath('excel', id));
    await waitForExcelReady(second);

    await setCell(first, 6, 0, 'from tab one again');
    await expectStored(first, id, (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 6, 0) === 'from tab one again');

    await setCell(second, 7, 0, 'from the stale tab');
    await expect(statusPill(second)).toContainText('Conflict');
    await expect(banner(second)).toContainText('newer workbook');

    const stored = await readStoredDocument(first, id);
    expect(storedCellValue(stored?.data as never, 'Quarterly Plan', 6, 0)).toBe('from tab one again');
    expect(storedCellValue(stored?.data as never, 'Quarterly Plan', 7, 0)).toBeNull();

    await first.close();
    await second.close();
  });

  test('a second tab opened after a save loads the saved content, not a blank document', async ({ context }) => {
    const id = makeId('second-tab-load');
    const first = await context.newPage();
    await first.goto(editorPath('word', id));
    await waitForWordReady(first);

    await first.locator('.ProseMirror').click();
    await first.keyboard.press('ControlOrMeta+a');
    await first.keyboard.press('Backspace');
    await first.keyboard.type('Written before the second tab existed.');
    await expectStored(first, id, (record) => JSON.stringify(record?.data ?? '').includes('before the second tab'));

    const second = await context.newPage();
    await second.goto(editorPath('word', id));
    await waitForWordReady(second);
    await expect(second.locator('.ProseMirror')).toContainText('Written before the second tab existed.');

    await first.close();
    await second.close();
  });
});
