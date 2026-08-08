import { expect, test } from '@playwright/test';
import {
  buildStoredDocument,
  expectStored,
  listStoredDocuments,
  makeId,
  openDashboard,
  openWord,
  readStoredDocument,
  seedDocuments,
} from './helpers/app';
import type { StoredDocument } from './helpers/app';

function recentCards(page: import('@playwright/test').Page) {
  return page.locator('.recent-card');
}

function cardFor(page: import('@playwright/test').Page, title: string) {
  return page.locator('.recent-card', { hasText: title }).first();
}

/** Word document body with a recognisable marker, in TipTap JSON. */
function wordBody(marker: string) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: marker }] }] };
}

async function seedCorpus(page: import('@playwright/test').Page, count: number, prefix: string) {
  await openDashboard(page);
  const now = Date.now();
  const records: StoredDocument[] = [];
  for (let index = 0; index < count; index += 1) {
    records.push(
      buildStoredDocument(`${prefix}-${index}`, 'word', `${prefix} file ${String(index).padStart(3, '0')}`, wordBody(`body ${index}`), {
        // Descending timestamps so "Last updated" order is deterministic.
        updatedAt: now - index * 1000,
      }),
    );
  }
  await seedDocuments(page, records);
  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();
  return records;
}

test.describe('Dashboard delete and undo', () => {
  test('deleting a file removes it, and Undo restores it with its content intact', async ({ page }) => {
    const id = makeId('dash-undo');
    await openWord(page, id);
    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Content that must come back after undo.');
    await page.getByLabel('File name').fill('Undo Target');
    await expectStored(page, id, (record) => record?.title === 'Undo Target' && JSON.stringify(record.data).includes('must come back'));

    const before = await readStoredDocument(page, id);

    await openDashboard(page);
    await expect(cardFor(page, 'Undo Target')).toBeVisible();
    await page.getByRole('button', { name: 'Delete Undo Target' }).click();

    await expect(cardFor(page, 'Undo Target')).toHaveCount(0);
    await expectStored(page, id, (record) => record === null, 'the deleted document was still readable from storage');

    await page.getByRole('button', { name: 'Undo deleting Undo Target' }).click();

    await expectStored(
      page,
      id,
      (record) => record?.title === 'Undo Target' && JSON.stringify(record.data).includes('must come back'),
      'Undo did not restore the deleted document',
    );
    await expect(cardFor(page, 'Undo Target')).toBeVisible();

    const after = await readStoredDocument(page, id);
    expect(JSON.stringify(after!.data)).toBe(JSON.stringify(before!.data));
  });

  test('a delete that is not undone stays deleted across a reload', async ({ page }) => {
    const id = makeId('dash-delete');
    await openWord(page, id);
    await page.getByLabel('File name').fill('Gone For Good');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type(' extra');
    await expectStored(page, id, (record) => record?.title === 'Gone For Good');

    await openDashboard(page);
    await page.getByRole('button', { name: 'Delete Gone For Good' }).click();
    await expect(cardFor(page, 'Gone For Good')).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();
    await expect(cardFor(page, 'Gone For Good')).toHaveCount(0);

    const stored = await listStoredDocuments(page);
    expect(stored.some((record) => record.id === id)).toBe(false);
  });

  test('deleting two files offers an independent Undo for each', async ({ page }) => {
    const prefix = makeId('multi');
    await seedCorpus(page, 3, prefix);

    await page.getByRole('button', { name: `Delete ${prefix} file 000` }).click();
    await page.getByRole('button', { name: `Delete ${prefix} file 001` }).click();
    await expect(recentCards(page)).toHaveCount(1);

    const undoStack = page.locator('.dashboard-undo');
    await expect(undoStack).toHaveCount(2);

    // Restoring only the first must leave the second deleted.
    await page.getByRole('button', { name: `Undo deleting ${prefix} file 000` }).click();
    await expectStored(page, `${prefix}-0`, (record) => record !== null, 'file 000 was not restored');
    await expectStored(page, `${prefix}-1`, (record) => record === null, 'file 001 was restored by mistake');
    await expect(recentCards(page)).toHaveCount(2);
  });
});

test.describe('Dashboard with a large corpus', () => {
  test('120 files paginate, expand, and every one is reachable', async ({ page }) => {
    const prefix = makeId('bulk');
    await seedCorpus(page, 120, prefix);

    await expect(page.getByText('120 files stored locally in this browser.')).toBeVisible();
    await expect(recentCards(page)).toHaveCount(12);

    const showAll = page.getByRole('button', { name: 'Show all 120 files' });
    await expect(showAll).toBeVisible();
    await showAll.click();
    await expect(recentCards(page)).toHaveCount(120);

    await page.getByRole('button', { name: 'Show fewer files' }).click();
    await expect(recentCards(page)).toHaveCount(12);
  });

  test('search narrows a large corpus and reports when nothing matches', async ({ page }) => {
    const prefix = makeId('search');
    await seedCorpus(page, 120, prefix);

    const search = page.getByLabel('Search files');
    await search.fill('file 07');
    // file 070..079 -> 10 matches.
    await expect(recentCards(page)).toHaveCount(10);

    await search.fill('file 042');
    await expect(recentCards(page)).toHaveCount(1);
    await expect(cardFor(page, `${prefix} file 042`)).toBeVisible();

    await search.fill('nothing matches this');
    await expect(recentCards(page)).toHaveCount(0);
    await expect(page.locator('.dashboard-empty')).toContainText('No files match');
  });

  test('sorting by name reorders the list deterministically', async ({ page }) => {
    const prefix = makeId('sort');
    await seedCorpus(page, 120, prefix);

    // Seeded newest-first, so "Last updated" puts file 000 at the top already.
    await expect(recentCards(page).first()).toContainText(`${prefix} file 000`);

    await page.getByLabel('Sort files').selectOption('name');
    await expect(recentCards(page).first()).toContainText(`${prefix} file 000`);
    await expect(recentCards(page).nth(11)).toContainText(`${prefix} file 011`);

    await page.getByLabel('Sort files').selectOption('recent');
    await expect(recentCards(page).first()).toContainText(`${prefix} file 000`);
  });

  test('opening a file from a large list lands on that exact document', async ({ page }) => {
    const prefix = makeId('open');
    await seedCorpus(page, 120, prefix);

    await page.getByLabel('Search files').fill('file 099');
    const card = cardFor(page, `${prefix} file 099`);
    await expect(card).toBeVisible();
    await card.getByRole('link').click();

    await expect(page).toHaveURL(new RegExp(`#/word\\?id=${prefix}-99`));
    await expect(page.locator('.ProseMirror')).toContainText('body 99');
    await expect(page.getByLabel('File name')).toHaveValue(`${prefix} file 099`);
  });
});

test.describe('Dashboard empty state', () => {
  test('a browser with no files explains what to do next', async ({ page }) => {
    await openDashboard(page);
    await expect(page.locator('.dashboard-empty')).toContainText('No files yet.');
    await expect(recentCards(page)).toHaveCount(0);
    // The three launchers are always available.
    await expect(page.getByRole('link', { name: 'New document' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New spreadsheet' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New presentation' })).toBeVisible();
  });
});
