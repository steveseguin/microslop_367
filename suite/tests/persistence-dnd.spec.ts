import { Buffer } from 'node:buffer';
import { expect, test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const pngBytes = [...Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function waitForSaved(page: import('@playwright/test').Page) {
  await expect(page.locator('.status-pill')).toBeVisible({ timeout: 15000 });
  await expect
    .poll(async () => ((await page.locator('.status-pill').textContent()) ?? '').trim(), { timeout: 15000 })
    .toBe('Saved');
}

async function waitForSpreadsheetReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await expect(page.getByLabel('Formula input')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.panel-list')).toContainText('Total sheets:', { timeout: 15000 });
}

async function dispatchImageDrop(page: import('@playwright/test').Page, selector: string, fileName = 'drop-image.png') {
  await page.evaluate(
    ({ targetSelector, bytes, nextFileName }) => {
      const target = document.querySelector(targetSelector);
      if (!target) {
        throw new Error(`Drop target not found for ${targetSelector}`);
      }

      const dataTransfer = new DataTransfer();
      const file = new File([new Uint8Array(bytes)], nextFileName, { type: 'image/png' });
      dataTransfer.items.add(file);

      for (const eventName of ['dragenter', 'dragover', 'drop']) {
        target.dispatchEvent(
          new DragEvent(eventName, {
            bubbles: true,
            cancelable: true,
            dataTransfer,
          }),
        );
      }
    },
    { targetSelector: selector, bytes: pngBytes, nextFileName: fileName },
  );
}

test.use({ serviceWorkers: 'block' });

test.describe('Persistence and drag-drop robustness', () => {
  test('Word supports the local image chooser, drag-drop import, and persists both after reload', async ({ page }) => {
    await page.goto(`${baseUrl}/#/word?id=${makeId('word-dnd')}`);
    await expect(page.locator('.document-page')).toBeVisible();

    const [imageChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('.toolbar-shell').getByTitle('Insert image').click(),
    ]);
    await imageChooser.setFiles(path.join(__dirname, '../test.png'));
    await expect(page.locator('.editor-banner')).toContainText('embedded in this document');
    await expect(page.locator('.ProseMirror img')).toHaveCount(1);

    await dispatchImageDrop(page, '.document-page');
    await expect(page.locator('.editor-banner')).toContainText('Image inserted.');
    await expect(page.locator('.ProseMirror img')).toHaveCount(2);

    await waitForSaved(page);
    await page.reload();
    await expect(page.locator('.ProseMirror img')).toHaveCount(2);
  });

  test('Word embeds fetchable image URLs into the saved document instead of keeping hot links', async ({ page }) => {
    await page.route('https://assets.officeninja.test/**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': '*',
          'content-type': 'image/png',
        },
        body: Buffer.from(pngBytes),
      });
    });

    await page.goto(`${baseUrl}/#/word?id=${makeId('word-url-embed')}`);
    await expect(page.locator('.document-page')).toBeVisible();

    await page.locator('.toolbar-shell').getByTitle('Embed image URL').click();
    await page.getByPlaceholder('Paste an image URL to embed locally').fill('https://assets.officeninja.test/embed.png');
    await page.getByRole('button', { name: 'Embed URL' }).click();
    await expect(page.locator('.editor-banner')).toContainText('Image embedded locally.');
    await expect(page.locator('.ProseMirror img')).toHaveCount(1);
    await expect(page.locator('.ProseMirror img').first()).toHaveAttribute('src', /^data:image\/png;base64,/);

    await waitForSaved(page);
    await page.reload();
    await expect(page.locator('.ProseMirror img').first()).toHaveAttribute('src', /^data:image\/png;base64,/);
  });

  test('Slides supports drag-drop image import onto the canvas and still exports', async ({ page }) => {
    await page.goto(`${baseUrl}/#/powerpoint?id=${makeId('slides-dnd')}`);
    await expect(page.locator('.canvas-shell .upper-canvas')).toBeVisible();

    await dispatchImageDrop(page, '.canvas-shell');
    await expect(page.locator('.editor-banner')).toContainText('Image inserted.');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export PPTX' }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('.pptx');
  });

  test('Word warns when another tab saves a newer version first', async ({ browser }) => {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const firstPage = await context.newPage();
    const secondPage = await context.newPage();
    const docId = makeId('word-conflict');
    const docUrl = `${baseUrl}/#/word?id=${docId}`;

    await Promise.all([firstPage.goto(docUrl), secondPage.goto(docUrl)]);
    await Promise.all([
      expect(firstPage.locator('.document-page')).toBeVisible(),
      expect(secondPage.locator('.document-page')).toBeVisible(),
    ]);

    const firstEditor = firstPage.locator('.ProseMirror');
    await firstEditor.click();
    await firstPage.keyboard.press('Control+A');
    await firstPage.keyboard.press('Backspace');
    await firstPage.keyboard.type('Primary tab content should win the first save.');
    await waitForSaved(firstPage);

    const secondEditor = secondPage.locator('.ProseMirror');
    await secondEditor.click();
    await secondPage.keyboard.press('Control+A');
    await secondPage.keyboard.press('Backspace');
    await secondPage.keyboard.type('Secondary tab content should stay local after a conflict.');

    await expect(secondPage.locator('.status-pill')).toContainText('Conflict detected', { timeout: 15000 });
    await expect(secondPage.locator('.editor-banner')).toContainText('newer version');
    await expect(secondEditor).toContainText('Secondary tab content should stay local after a conflict.');

    await context.close();
  });

  test('Excel warns when another tab saves a newer workbook first', async ({ browser }) => {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const firstPage = await context.newPage();
    const secondPage = await context.newPage();
    const docId = makeId('excel-conflict');
    const docUrl = `${baseUrl}/#/excel?id=${docId}`;

    await firstPage.goto(docUrl);
    await waitForSpreadsheetReady(firstPage);

    const firstFormula = firstPage.getByPlaceholder('Enter a value or formula for the active cell');
    await firstFormula.fill('Baseline workbook value');
    await firstPage.getByRole('button', { name: 'Apply' }).click();
    await waitForSaved(firstPage);
    await firstPage.waitForTimeout(1000);

    await secondPage.goto(docUrl);
    await waitForSpreadsheetReady(secondPage);
    const latestFormula = firstPage.getByPlaceholder('Enter a value or formula for the active cell');
    await latestFormula.fill('Latest workbook value');
    await firstPage.getByRole('button', { name: 'Apply' }).click();
    await waitForSaved(firstPage);
    await firstPage.waitForTimeout(1000);

    const secondFormula = secondPage.getByPlaceholder('Enter a value or formula for the active cell');
    await secondFormula.fill('Stale tab workbook value');
    await secondPage.getByRole('button', { name: 'Apply' }).click();

    await expect(secondPage.locator('.status-pill')).toContainText('Conflict detected', { timeout: 15000 });
    await expect(secondPage.locator('.editor-banner')).toContainText('newer workbook');

    await context.close();
  });

  test('Excel imports a workbook into the live grid and keeps it after reload', async ({ page }) => {
    await page.goto(`${baseUrl}/#/excel?id=${makeId('excel-import-persist')}`);
    await waitForSpreadsheetReady(page);

    const [importChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import workbook' }).click(),
    ]);
    await importChooser.setFiles(path.join(__dirname, '../test.xlsx'));
    await page.locator('.dialog-card').getByRole('button', { name: 'Import workbook' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.panel-list')).toContainText('Open sheet: Sheet1', { timeout: 15000 });
    await expect(page.locator('.panel-list')).toContainText('Total sheets: 1');

    await waitForSaved(page);
    await page.reload();

    await waitForSpreadsheetReady(page);
    await expect(page.locator('.panel-list')).toContainText('Open sheet: Sheet1');
  });
});
