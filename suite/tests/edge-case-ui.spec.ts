import { test, expect, devices } from '@playwright/test';

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
}

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(fitsViewport).toBeTruthy();
}

test.use({ serviceWorkers: 'block' });

test.describe('Suite edge cases', () => {
  test('Word handles keyboard shortcuts, invalid image URLs, and blank title fallback', async ({ page }) => {
    await page.goto(`${baseUrl}/#/word?id=${makeId('word-edge')}`);
    await expect(page.locator('.document-page')).toBeVisible();

    await page.keyboard.press('Control+H');
    await expect(page.getByPlaceholder('Find text')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder('Find text')).toBeHidden();

    const ribbon = page.locator('.toolbar-shell');
    await ribbon.getByTitle('Insert image').click();
    await page.getByPlaceholder('Paste an image URL to embed locally').fill('https://example.com/');
    await page.getByRole('button', { name: 'Embed URL' }).click();
    await expect(page.locator('.editor-banner')).toContainText('Image could not be loaded.');

    const fileName = page.getByLabel('File name');
    await fileName.fill('   ');
    await fileName.press('Tab');
    await expect(fileName).toHaveValue('Untitled Document');
  });

  test('dashboard recent files can be reopened with keyboard interaction', async ({ page }) => {
    const docId = makeId('recent-keyboard');
    await page.goto(`${baseUrl}/#/word?id=${docId}`);
    await expect(page.locator('.document-page')).toBeVisible();

    await page.getByLabel('File name').fill('Keyboard Recent Document');
    await page.locator('.ProseMirror').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Recent file keyboard navigation should reopen this document.');
    await waitForSaved(page);

    await page.getByRole('link', { name: /Workspace/i }).click();
    const recentCard = page.locator('.recent-card', { hasText: 'Keyboard Recent Document' }).first();
    await recentCard.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(new RegExp(`/#/word\\?id=${docId}`));
    await expect(page.locator('.ProseMirror')).toContainText('Recent file keyboard navigation should reopen this document.');
  });

  test('Slides protects the last slide and supports presenter keyboard navigation', async ({ page }) => {
    await page.goto(`${baseUrl}/#/powerpoint?id=${makeId('slides-edge')}`);
    await expect(page.locator('.canvas-shell .upper-canvas')).toBeVisible();

    await page.getByLabel('Delete slide 1').click();
    await page.locator('.dialog-card').getByRole('button', { name: 'Delete slide', exact: true }).click();
    await expect(page.locator('.editor-banner')).toContainText('needs at least one slide');

    const ribbon = page.locator('.toolbar-shell');
    await ribbon.getByTitle('Duplicate slide').click();
    await expect(page.locator('.slide-card')).toHaveCount(2);

    await page.locator('.slide-card').first().click();
    await ribbon.getByTitle('Presenter view').click();
    await expect(page.getByRole('button', { name: 'Exit presenter view' })).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('Current slide: 2 / 2')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('Current slide: 1 / 2')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Exit presenter view' })).toBeHidden();
  });

  test('mobile editors keep the viewport contained and the ribbon behaves like a real modal', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 14'], serviceWorkers: 'block' });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/#/word?id=${makeId('mobile-edge-word')}`);
    await expect(page.locator('.mobile-toolbar-toggle')).toBeVisible();
    await expect(page.locator('.workspace-mobile-switcher')).toBeVisible();
    await page.locator('.mobile-toolbar-toggle').click();
    await expect(page.locator('.mobile-toolbar-sheet')).toBeVisible();
    await expect.poll(async () => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.locator('.mobile-toolbar-close').click();
    await expect.poll(async () => page.evaluate(() => document.body.style.overflow || 'auto')).toBe('auto');
    await page.getByRole('button', { name: 'Insights' }).click();
    await expect(page.getByText('Document insights')).toBeVisible();
    await page.getByRole('button', { name: 'Editor' }).click();
    await expect(page.locator('.document-page')).toBeVisible();

    const mobileFileName = page.getByLabel('File name');
    await mobileFileName.fill('   ');
    await mobileFileName.press('Tab');
    await expect(mobileFileName).toHaveValue('Untitled Document');
    await expectNoHorizontalOverflow(page);

    await page.goto(`${baseUrl}/#/excel?id=${makeId('mobile-edge-excel')}`);
    await waitForSpreadsheetReady(page);
    await expect(page.locator('.workspace-mobile-switcher')).toBeVisible();
    await expect(page.locator('.spreadsheet-container')).toBeVisible();
    await page.getByRole('button', { name: 'Insights' }).click();
    await expect(page.getByText('Selection summary')).toBeVisible();
    await page.getByRole('button', { name: 'Sheet' }).click();
    await expect(page.locator('.spreadsheet-container')).toBeVisible();
    const spreadsheetHeight = await page.locator('.spreadsheet-shell').evaluate((element) => element.getBoundingClientRect().height);
    expect(spreadsheetHeight).toBeGreaterThan(400);
    await expectNoHorizontalOverflow(page);

    await page.goto(`${baseUrl}/#/powerpoint?id=${makeId('mobile-edge-slides')}`);
    await expect(page.locator('.mobile-toolbar-toggle')).toBeVisible();
    await expect(page.locator('.workspace-mobile-switcher')).toBeVisible();
    await page.locator('.mobile-toolbar-toggle').click();
    const mobileSheet = page.locator('.mobile-toolbar-sheet');
    await mobileSheet.getByTitle('Duplicate slide').click();
    await page.locator('.mobile-toolbar-close').click();
    await expect(page.locator('.slide-card')).toHaveCount(2);
    await page.getByRole('button', { name: 'Notes' }).click();
    await expect(page.locator('.notes-textarea')).toBeVisible();
    await page.getByRole('button', { name: 'Slides' }).click();
    await expect(page.locator('.slide-list')).toBeVisible();
    await page.getByRole('button', { name: 'Canvas' }).click();
    await expect(page.locator('.canvas-shell')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await context.close();
  });
});
