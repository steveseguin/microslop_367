import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  banner,
  currentRevision,
  dropImageOn,
  expectStored,
  makeId,
  openDashboard,
  openExcel,
  openSlides,
  openWord,
  readStoredDocument,
  reloadEditor,
  ribbon,
  waitForWordReady,
} from './helpers/app';
import {
  activeCellLabel,
  formulaInput,
  selectCell,
  setCell,
  storedCellFormula,
  storedCellValue,
  storedSheets,
  typeIntoCell,
} from './helpers/excel';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, '..', name);

/**
 * Persistence and data integrity. If any single file in this suite should be trusted, it
 * is this one: every test here writes something, proves it reached IndexedDB, then does a
 * REAL `page.reload()` and proves it came back.
 */
test.describe('Persistence survives a real reload', () => {
  test('Word keeps typed content, and the stored record actually contains it', async ({ page }) => {
    const id = makeId('word-persist');
    await openWord(page, id);

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Quarterly risk register: supply chain, hiring, and runway.');
    await page.getByLabel('File name').fill('Risk Register');

    await expectStored(
      page,
      id,
      (record) => JSON.stringify(record?.data ?? '').includes('Quarterly risk register') && record?.title === 'Risk Register',
      'Word never persisted the typed paragraph under the chosen title',
    );

    await reloadEditor(page, 'word');
    await expect(page.locator('.ProseMirror')).toContainText('Quarterly risk register: supply chain, hiring, and runway.');
    await expect(page.getByLabel('File name')).toHaveValue('Risk Register');
  });

  test('Word flushes pending edits when the user navigates away before the debounce fires', async ({ page }) => {
    const id = makeId('word-flush');
    await openWord(page, id);

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Typed and immediately left the page.');

    // Leaving while the pill still reads "Saving..." raises a confirm(); accept it, since
    // the point of this test is that the edit survives leaving anyway.
    page.on('dialog', (dialog) => void dialog.accept());

    // Leave at once. The autosave debounce is 600ms, so this is the exact window in which
    // an edit used to be dropped on unmount.
    await page.getByRole('link', { name: /Workspace/i }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();

    await expectStored(
      page,
      id,
      (record) => JSON.stringify(record?.data ?? '').includes('Typed and immediately left the page.'),
      'leaving the editor during the autosave debounce lost the edit',
    );
  });

  test('Excel keeps cell values AND recalculated formula results across a reload', async ({ page }) => {
    const id = makeId('excel-formula');
    await openExcel(page, id);

    // The starter sheet holds Target values 42 / 31 / 24 in B2:B4.
    await setCell(page, 5, 0, 'Total target');
    await setCell(page, 5, 1, '=SUM(B2:B4)');

    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 5, 1) === 97,
      'the =SUM(B2:B4) formula never persisted with its computed value of 97',
    );

    const sheets = await storedSheets(page, id);
    // The computed value is stored, and the formula text is stored with exactly one '='.
    expect(storedCellValue(sheets, 'Quarterly Plan', 5, 1)).toBe(97);
    expect(storedCellFormula(sheets, 'Quarterly Plan', 5, 1)).toBe('=SUM(B2:B4)');
    expect(storedCellValue(sheets, 'Quarterly Plan', 5, 0)).toBe('Total target');

    await reloadEditor(page, 'excel');
    await selectCell(page, 5, 1);
    // After a reload the formula bar shows the SOURCE, and the grid holds the result.
    await expect(formulaInput(page)).toHaveValue('=SUM(B2:B4)');
    await expect(activeCellLabel(page)).toHaveText('B6');
  });

  test('Excel recalculates a formula when a precedent is edited in the grid', async ({ page }) => {
    const id = makeId('excel-recalc-grid');
    await openExcel(page, id);

    await setCell(page, 5, 1, '=SUM(B2:B4)');
    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 5, 1) === 97,
      'baseline SUM never reached 97',
    );

    // Type straight into B2, the way a user edits a cell: 42 -> 142, so 97 -> 197.
    await typeIntoCell(page, 1, 1, '142');
    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 5, 1) === 197,
      'an in-grid edit did not recalculate the dependent SUM',
    );
  });

  /**
   * KNOWN PRODUCT BUG - see tests/README.md "Known product bugs", BUG-1.
   *
   * Editing a precedent through the FORMULA BAR does not recalculate dependent formulas,
   * and the stale result is then autosaved and survives a reload. The identical edit made
   * directly in the grid (the test above) recalculates correctly.
   *
   * `test.fail()` keeps the suite honest in both directions: the bug is asserted and
   * reported, and the day it is fixed this test starts failing as an UNEXPECTED PASS,
   * which is the signal to delete the annotation.
   */
  test('Excel recalculates a formula when a precedent is edited via the formula bar', async ({ page }) => {
    test.fail(true, 'BUG-1: formula-bar writes do not trigger dependent recalculation');

    const id = makeId('excel-recalc-formula-bar');
    await openExcel(page, id);

    await setCell(page, 5, 1, '=SUM(B2:B4)');
    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 5, 1) === 97,
      'baseline SUM never reached 97',
    );

    await setCell(page, 1, 1, '142');
    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 5, 1) === 197,
      'the SUM did not recalculate after a formula-bar edit to its input',
    );
  });

  test('Slides keeps added objects and speaker notes across a reload', async ({ page }) => {
    const id = makeId('slides-persist');
    await openSlides(page, id);

    const baselineObjects = await countStoredSlideObjects(page, id, 0);

    await ribbon(page).getByRole('button', { name: 'Add rectangle' }).click();
    await page.locator('.notes-textarea').fill('Remember to mention the migration timeline.');

    await expectStored(
      page,
      id,
      (record) => {
        const deck = record?.data as { slides?: Array<{ notes?: string; data?: { objects?: unknown[] } }> } | undefined;
        return (
          deck?.slides?.[0]?.notes === 'Remember to mention the migration timeline.' &&
          (deck?.slides?.[0]?.data?.objects?.length ?? 0) > baselineObjects
        );
      },
      'the rectangle and speaker notes never reached storage',
    );

    await reloadEditor(page, 'powerpoint');
    await expect(page.locator('.notes-textarea')).toHaveValue('Remember to mention the migration timeline.');
    expect(await countStoredSlideObjects(page, id, 0)).toBeGreaterThan(baselineObjects);
  });

  test('Word keeps embedded images from both the file picker and drag-and-drop', async ({ page }) => {
    const id = makeId('word-images');
    await openWord(page, id);

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      ribbon(page).getByRole('button', { name: 'Insert image' }).click(),
    ]);
    await chooser.setFiles(fixture('test.png'));
    await expect(banner(page)).toContainText('embedded in this document');
    await expect(page.locator('.ProseMirror img')).toHaveCount(1);

    await dropImageOn(page, '.document-page');
    await expect(page.locator('.ProseMirror img')).toHaveCount(2);

    await expectStored(
      page,
      id,
      (record) => (JSON.stringify(record?.data ?? '').match(/data:image\/png;base64,/g) ?? []).length >= 2,
      'the two embedded images were not stored as inline data URLs',
    );

    await reloadEditor(page, 'word');
    await expect(page.locator('.ProseMirror img')).toHaveCount(2);
    await expect(page.locator('.ProseMirror img').first()).toHaveAttribute('src', /^data:image\/png;base64,/);
  });

  test('Excel keeps an imported workbook after a reload', async ({ page }) => {
    const id = makeId('excel-import');
    await openExcel(page, id);

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import workbook' }).click(),
    ]);
    await chooser.setFiles(fixture('test.xlsx'));
    await page.locator('.dialog-card').getByRole('button', { name: 'Import workbook' }).click();
    await expect(banner(page)).toContainText('Workbook imported.');

    await expectStored(
      page,
      id,
      (record) => {
        const sheets = record?.data as Array<{ name: string; celldata?: unknown[] }> | undefined;
        return Array.isArray(sheets) && sheets.length === 1 && sheets[0].name === 'Sheet1' && (sheets[0].celldata?.length ?? 0) > 0;
      },
      'the imported workbook was never persisted',
    );

    await reloadEditor(page, 'excel');
    await expect(page.locator('.panel-list')).toContainText('Open sheet: Sheet1');
    await expect(page.locator('.panel-list')).toContainText('Total sheets: 1');
  });

  test('a rename from the Dashboard reaches storage without touching the document body', async ({ page }) => {
    const id = makeId('word-rename');
    await openWord(page, id);
    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Body text that renaming must not disturb.');
    await expectStored(page, id, (record) => JSON.stringify(record?.data ?? '').includes('must not disturb'));

    const before = await readStoredDocument(page, id);
    await openDashboard(page);

    const card = page.locator('.recent-card', { hasText: before!.title }).first();
    await card.getByRole('button', { name: /^Rename / }).click();
    const input = page.locator('.recent-card input.form-control').first();
    await input.fill('Renamed From Dashboard');
    await input.press('Enter');

    await expectStored(
      page,
      id,
      (record) => record?.title === 'Renamed From Dashboard',
      'renaming from the Dashboard never persisted the new title',
    );
    const after = await readStoredDocument(page, id);
    expect(JSON.stringify(after!.data)).toBe(JSON.stringify(before!.data));
  });

  test('two saves in a row advance the revision rather than silently no-opping', async ({ page }) => {
    const id = makeId('word-revision');
    await openWord(page, id);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('First revision.');
    await expectStored(page, id, (record) => JSON.stringify(record?.data ?? '').includes('First revision.'));
    const first = await currentRevision(page, id);

    await page.keyboard.type(' Second revision.');
    await expectStored(page, id, (record) => JSON.stringify(record?.data ?? '').includes('Second revision.'));
    const second = await currentRevision(page, id);

    expect(second).toBeGreaterThan(first);
  });
});

test.describe('Routing', () => {
  /**
   * The app is a HashRouter app. A path WITHOUT the hash renders the Dashboard, which has
   * already caused two audits to reach opposite conclusions about whether a feature exists.
   * This test pins that behaviour so nobody has to rediscover it.
   */
  test('a bare /word path renders the Dashboard, not the Word editor', async ({ page }) => {
    await page.goto('/word');
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();
    await expect(page.locator('.document-page')).toHaveCount(0);

    await page.goto('/#/word');
    await waitForWordReady(page);
    await expect(page.locator('.document-page')).toBeVisible();
  });

  test('opening an editor without an id assigns one in the URL so the document is addressable', async ({ page }) => {
    await page.goto('/#/word');
    await waitForWordReady(page);
    await expect(page).toHaveURL(/#\/word\?id=word-\d+/);
  });
});

async function countStoredSlideObjects(page: import('@playwright/test').Page, id: string, slideIndex: number) {
  const record = await readStoredDocument<{ slides?: Array<{ data?: { objects?: unknown[] } }> }>(page, id);
  return record?.data?.slides?.[slideIndex]?.data?.objects?.length ?? 0;
}
