import { expect, test } from '@playwright/test';
import { editorPath, makeId, waitForExcelReady, waitForSlidesReady, waitForWordReady } from './helpers/app';

/**
 * Assertions that are only meaningful against a real `vite build`.
 *
 * The previous version of this file asserted bundle chunk names while the suite pointed at
 * a dev server, where those chunks do not exist — it could only ever fail. The suite now
 * always runs against `vite build` + `vite preview` (see playwright.config.ts), so these
 * are real checks on shipped output.
 *
 * Chunk names come from `manualChunks` in vite.config.ts. They are matched loosely (the
 * name appears somewhere in the request URL, before the content hash) so a rollup version
 * bump that changes the hash format does not break the suite.
 */

const HEAVY_CHUNKS = /word-editor|word-io|excel-workbook|excel-io|excel-chart|slides-canvas|slides-io/i;

function loadedScripts(page: import('@playwright/test').Page) {
  return page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => name.endsWith('.js')),
  );
}

test.describe('Production bundle', () => {
  test('this suite really is running against a built bundle, not a dev server', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();

    const scripts = await loadedScripts(page);
    // A dev server serves /src/main.tsx and /@vite/client; a build serves hashed assets.
    expect(scripts.some((name) => name.includes('/@vite/client')), 'a dev server is being tested').toBe(false);
    expect(
      scripts.some((name) => /\/assets\/.*-[A-Za-z0-9_-]{8,}\.js$/.test(name)),
      `no hashed build assets were loaded: ${scripts.join(', ')}`,
    ).toBe(true);
  });

  test('the Dashboard does not download or preload any heavy editor chunk', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();

    const preloads = await page
      .locator('link[rel="modulepreload"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
    expect(preloads.filter((href) => HEAVY_CHUNKS.test(href)), 'heavy chunks are preloaded on the Dashboard').toEqual([]);

    const scripts = await loadedScripts(page);
    expect(scripts.filter((name) => HEAVY_CHUNKS.test(name)), 'heavy chunks are downloaded on the Dashboard').toEqual([]);
  });

  test('each editor pulls in its own engine chunk, and only when it is opened', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();

    await page.getByRole('link', { name: 'New document' }).click();
    await waitForWordReady(page);
    await expect
      .poll(async () => (await loadedScripts(page)).some((name) => /word-editor/i.test(name)), {
        message: 'opening Word did not load the word-editor chunk',
      })
      .toBe(true);
    // Opening Word must not drag in the spreadsheet or slides engines.
    const afterWord = await loadedScripts(page);
    expect(afterWord.filter((name) => /excel-workbook|slides-canvas/i.test(name))).toEqual([]);
  });

  test('the spreadsheet engine chunk loads when the Excel route is opened', async ({ page }) => {
    await page.goto(editorPath('excel', makeId('build-excel')));
    await waitForExcelReady(page);
    await expect
      .poll(async () => (await loadedScripts(page)).some((name) => /excel-workbook/i.test(name)))
      .toBe(true);
  });

  test('the slides engine chunk loads when the PowerPoint route is opened', async ({ page }) => {
    await page.goto(editorPath('powerpoint', makeId('build-slides')));
    await waitForSlidesReady(page);
    await expect
      .poll(async () => (await loadedScripts(page)).some((name) => /slides-canvas/i.test(name)))
      .toBe(true);
  });

  test('every route boots without an uncaught error or a failed request', async ({ page }) => {
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();

    await page.goto(editorPath('word', makeId('boot-word')));
    await waitForWordReady(page);

    await page.goto(editorPath('excel', makeId('boot-excel')));
    await waitForExcelReady(page);

    await page.goto(editorPath('powerpoint', makeId('boot-slides')));
    await waitForSlidesReady(page);

    expect(pageErrors, `uncaught errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(failedRequests, `failed requests: ${failedRequests.join(' | ')}`).toEqual([]);
  });
});
