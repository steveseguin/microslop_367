import { test, expect, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173';

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function waitForSaved(page: import('@playwright/test').Page) {
  await expect(page.locator('.status-pill')).toContainText(/Saved|Saving\.\.\./);
  await page.waitForFunction(() => document.body.textContent?.includes('Saved') ?? false, undefined, { timeout: 15000 });
}

async function waitForSpreadsheetReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await expect(page.getByLabel('Formula input')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.panel-list')).toContainText('Total sheets:', { timeout: 15000 });
}

test.use({ serviceWorkers: 'block' });

test.describe('Current UI exploratory coverage', () => {
  test('desktop Word workflow survives heavy editing, scrolling, import/export, and persistence', async ({ page }) => {
    const docId = makeId('word');
    await page.goto(`${baseUrl}/#/word?id=${docId}`);
    await expect(page.locator('.document-page')).toBeVisible();

    await page.getByLabel('File name').fill('PW Stress Document');
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.type(`Paragraph ${index + 1} about product planning and review coverage.`);
      await page.keyboard.press('Enter');
    }

    const desktopRibbon = page.locator('.toolbar-shell');
    await desktopRibbon.getByTitle('Heading 1').click();
    await page.keyboard.type('Execution Notes');
    await page.keyboard.press('Enter');
    await desktopRibbon.getByTitle('Heading 1').click();
    await desktopRibbon.getByTitle('Bold').click();
    await page.keyboard.type('Important line');
    await desktopRibbon.getByTitle('Bold').click();
    await page.keyboard.press('Enter');
    await desktopRibbon.getByTitle('Bulleted list').click();
    await page.keyboard.type('Checklist item');
    await desktopRibbon.getByTitle('Bulleted list').click();

    await desktopRibbon.getByTitle('Insert table').click();
    await expect(page.locator('.ProseMirror table')).toBeVisible();

    await desktopRibbon.getByTitle('Embed image URL').click();
    await page.getByPlaceholder('Paste an image URL to embed locally').fill(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    );
    await page.getByRole('button', { name: 'Embed URL' }).click();
    await expect(page.locator('.ProseMirror img')).toBeVisible();

    await page.mouse.wheel(0, 1800);
    await page.mouse.wheel(0, -1600);

    await desktopRibbon.getByTitle('Find and replace').click();
    await page.getByPlaceholder('Find text').fill('Paragraph');
    await page.getByPlaceholder('Replace with').fill('Section');
    await page.getByRole('button', { name: 'Replace all' }).click();
    await expect(editor).toContainText('Section 1');

    const [importChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import DOCX' }).click(),
    ]);
    await importChooser.setFiles(path.join(__dirname, '../test.docx'));
    await expect(editor).toContainText('Hello Word from Node');
    await page.getByLabel('File name').fill('PW Stress Document');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export DOCX' }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('.docx');

    await waitForSaved(page);
    await page.reload();
    await expect(page.locator('.ProseMirror')).toContainText('Hello Word from Node');

    await page.getByRole('link', { name: /Workspace/i }).click();
    await expect(page.getByRole('heading', { name: 'Recent files' })).toBeVisible();
    await expect(page.getByText('PW Stress Document')).toBeVisible();
  });

  test('desktop Excel workflow supports workbook edits, selection charting, imports, and exports', async ({ page }) => {
    const docId = makeId('excel');
    await page.goto(`${baseUrl}/#/excel?id=${docId}`);
    await waitForSpreadsheetReady(page);
    await page.waitForTimeout(800);
    const excelRibbon = page.locator('.toolbar-shell');

    await page.getByLabel('File name').fill('PW Revenue Model');
    await expect(page.locator('.formula-coordinate')).toContainText('A1');

    await page.getByPlaceholder('Enter a value or formula for the active cell').fill('Quarterly Overview');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.locator('.panel-card h3').filter({ hasText: 'Selection summary' })).toBeVisible();
    await expect(page.locator('.workspace')).toContainText('A1');

    await excelRibbon.getByTitle('Chart selection').click();
    await expect(page.getByText('Selection chart')).toBeVisible();
    await expect(page.locator('.chart-card canvas')).toBeVisible();
    await page.locator('.chart-modal').click({ position: { x: 10, y: 10 } });

    await excelRibbon.getByTitle('Add sheet').click();
    await expect(page.locator('.panel-list')).toContainText('Total sheets: 2');

    await excelRibbon.getByTitle('Freeze top row').click();
    await expect(page.locator('.editor-banner')).toContainText('Top row frozen.');

    const [importChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import workbook' }).click(),
    ]);
    await importChooser.setFiles(path.join(__dirname, '../test.xlsx'));
    await page.locator('.dialog-card').getByRole('button', { name: 'Import workbook' }).click();
    await expect(page.locator('.editor-banner')).toContainText('Workbook imported.');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export XLSX' }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('desktop Slides workflow handles deck editing, notes, presenter mode, import, and export', async ({ page }) => {
    const docId = makeId('slides');
    await page.goto(`${baseUrl}/#/powerpoint?id=${docId}`);
    await expect(page.locator('.canvas-shell .upper-canvas')).toBeVisible();

    await page.getByLabel('File name').fill('PW Demo Deck');
    const slidesRibbon = page.locator('.toolbar-shell');
    await slidesRibbon.getByTitle('Add text').click();
    await slidesRibbon.getByTitle('Add rectangle').click();
    await slidesRibbon.getByTitle('Add circle').click();
    await slidesRibbon.locator('input[type="color"]').fill('#0ea5e9');

    await slidesRibbon.getByTitle('Duplicate slide').click();
    await expect(page.locator('.slide-card')).toHaveCount(2);

    await page.locator('.notes-textarea').fill('Speaker notes for testing presenter mode.');
    await expect(page.locator('.notes-textarea')).toHaveValue('Speaker notes for testing presenter mode.');

    await page.locator('.slide-card').nth(1).click();
    await page.locator('.slide-card__delete').nth(1).click();
    await page.locator('.dialog-card').getByRole('button', { name: 'Delete slide', exact: true }).click();
    await expect(page.locator('.slide-card')).toHaveCount(1);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export PPTX' }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('.pptx');

    const [importChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import PPTX' }).click(),
    ]);
    await importChooser.setFiles(path.join(__dirname, '../test.pptx'));
    await page.locator('.dialog-card').getByRole('button', { name: 'Import presentation' }).click();
    await expect(page.locator('.editor-banner')).toContainText('Presentation imported.');
    await page.getByLabel('File name').fill('PW Demo Deck');
    await waitForSaved(page);

    await slidesRibbon.getByTitle('Presenter view').click();
    await expect(page.getByRole('button', { name: 'Exit presenter view' })).toBeVisible();
    await expect(page.locator('.presenter-clock')).toBeVisible();
    await page.getByRole('button', { name: 'Exit presenter view' }).click();

    await page.getByRole('link', { name: /Workspace/i }).click();
    await expect(page.getByText('PW Demo Deck')).toBeVisible();
  });
});

test.describe('Mobile friendliness smoke', () => {
  test('dashboard and editors remain usable on mobile with ribbon access and controlled layout', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 14'] });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/#/`);
    await expect(page.getByText('OfficeNinja Suite')).toBeVisible();

    const dashboardFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(dashboardFits).toBeTruthy();

    await page.mouse.wheel(0, 1200);
    await page.mouse.wheel(0, -700);

    const wordId = makeId('mobile-word');
    await page.goto(`${baseUrl}/#/word?id=${wordId}`);
    await expect(page.locator('.mobile-toolbar-toggle')).toBeVisible();
    const mobileSheet = page.locator('.mobile-toolbar-sheet');
    await page.locator('.mobile-toolbar-toggle').click();
    await expect(page.locator('.mobile-toolbar-sheet')).toBeVisible();
    await mobileSheet.getByTitle('Bold').click();
    await page.locator('.mobile-toolbar-close').click();
    await page.locator('.document-page').scrollIntoViewIfNeeded();
    await page.locator('.ProseMirror').click({ force: true });
    await page.keyboard.type('Mobile editing works.');
    const documentFits = await page.locator('.document-page').evaluate((element) => element.getBoundingClientRect().width <= window.innerWidth + 1);
    expect(documentFits).toBeTruthy();

    await page.goto(`${baseUrl}/#/excel?id=${makeId('mobile-excel')}`);
    await expect(page.locator('.formula-strip')).toBeVisible();
    await expect(page.locator('.spreadsheet-container')).toBeVisible();
    await page.mouse.wheel(0, 900);

    await page.goto(`${baseUrl}/#/powerpoint?id=${makeId('mobile-slides')}`);
    await expect(page.locator('.mobile-toolbar-toggle')).toBeVisible();
    await page.getByRole('button', { name: 'Slides' }).click();
    await expect(page.locator('.slide-list')).toBeVisible();
    await page.locator('.mobile-toolbar-toggle').click();
    await expect(page.locator('.mobile-toolbar-sheet')).toBeVisible();
    await page.locator('.mobile-toolbar-close').click();
    await page.getByRole('button', { name: 'Canvas' }).click();

    const canvasFits = await page.locator('.canvas-shell').evaluate((element) => element.getBoundingClientRect().width <= window.innerWidth + 1);
    expect(canvasFits).toBeTruthy();
    await context.close();
  });
});
