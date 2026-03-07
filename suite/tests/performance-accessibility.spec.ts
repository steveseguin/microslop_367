import { devices, expect, test } from '@playwright/test';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const heavyChunkPattern = /word-editor|excel-workbook|word-io|excel-io|slides-canvas|slides-io/i;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test.use({ serviceWorkers: 'block' });

test.describe('Performance and accessibility regressions', () => {
  test('dashboard defers heavy editor bundles until the user opens an editor', async ({ page }) => {
    await page.goto(baseUrl);
    await expect(page.getByRole('heading', { name: /Work like a real office app/i })).toBeVisible();

    const preloadHrefs = await page.locator('link[rel="modulepreload"]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('href') ?? ''),
    );
    expect(preloadHrefs.some((href) => heavyChunkPattern.test(href))).toBeFalsy();

    const initialResources = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((name) => !name.startsWith('data:')),
    );
    expect(initialResources.some((name) => heavyChunkPattern.test(name))).toBeFalsy();

    await page.getByRole('link', { name: 'New document' }).click();
    await expect(page.locator('.document-page')).toBeVisible();

    await page.waitForFunction(
      () =>
        performance
          .getEntriesByType('resource')
          .some((entry) => /word-editor/i.test(entry.name)),
      undefined,
      { timeout: 15000 },
    );
  });

  test('shell skip control moves keyboard focus to main content', async ({ page }) => {
    await page.goto(baseUrl);
    await page.keyboard.press('Tab');

    const skipButton = page.getByRole('button', { name: 'Skip to main content' });
    await expect(skipButton).toBeFocused();
    await skipButton.press('Enter');

    await page.waitForFunction(() => document.activeElement?.id === 'app-main');
  });
});

test.describe('Mobile accessibility controls', () => {
  const iPhone14 = devices['iPhone 14'];
  test.use({
    viewport: iPhone14.viewport,
    userAgent: iPhone14.userAgent,
    deviceScaleFactor: iPhone14.deviceScaleFactor,
    isMobile: iPhone14.isMobile,
    hasTouch: iPhone14.hasTouch,
    serviceWorkers: 'block',
  });

  test('mobile workspace switchers expose controlled regions across editors', async ({ page }) => {
    const wordId = makeId('word-mobile');
    await page.goto(`${baseUrl}/#/word?id=${wordId}`);
    const wordSwitcher = page.locator('.workspace-mobile-switcher');
    await expect(wordSwitcher.getByRole('button', { name: 'Editor', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await wordSwitcher.getByRole('button', { name: 'Insights', exact: true }).click();
    await expect(wordSwitcher.getByRole('button', { name: 'Insights', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(wordSwitcher.getByRole('button', { name: 'Editor', exact: true })).toHaveAttribute('aria-expanded', 'false');

    const insightsRegionId = await wordSwitcher.getByRole('button', { name: 'Insights', exact: true }).getAttribute('aria-controls');
    expect(insightsRegionId).toBeTruthy();
    await expect(page.locator(`#${insightsRegionId}`)).toHaveAttribute('aria-label', 'Word insights');

    const sheetId = makeId('excel-mobile');
    await page.goto(`${baseUrl}/#/excel?id=${sheetId}`);
    const excelSwitcher = page.locator('.workspace-mobile-switcher');
    await expect(excelSwitcher.getByRole('button', { name: 'Sheet', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await excelSwitcher.getByRole('button', { name: 'Insights', exact: true }).click();
    await expect(excelSwitcher.getByRole('button', { name: 'Insights', exact: true })).toHaveAttribute('aria-expanded', 'true');

    const workbookRegionId = await excelSwitcher.getByRole('button', { name: 'Sheet', exact: true }).getAttribute('aria-controls');
    expect(workbookRegionId).toBeTruthy();
    await expect(page.locator(`#${workbookRegionId}`)).toHaveAttribute('aria-label', 'Spreadsheet workspace');

    const deckId = makeId('slides-mobile');
    await page.goto(`${baseUrl}/#/powerpoint?id=${deckId}`);
    const slidesSwitcher = page.locator('.workspace-mobile-switcher');
    await expect(slidesSwitcher.getByRole('button', { name: 'Canvas', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await slidesSwitcher.getByRole('button', { name: 'Slides', exact: true }).click();
    await expect(slidesSwitcher.getByRole('button', { name: 'Slides', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(slidesSwitcher.getByRole('button', { name: 'Canvas', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('button', { name: 'Add slide' })).toBeVisible();
  });
});
