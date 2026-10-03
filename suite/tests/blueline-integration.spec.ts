import { expect, test, type Page } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173';

async function call(page: Page, tool: string, args: Record<string, unknown> = {}) {
  return page.evaluate(async ({ tool, args }) => {
    const api = (window as unknown as { blueline: { call: (tool: string, args: Record<string, unknown>) => Promise<unknown> } }).blueline;
    return api.call(tool, args);
  }, { tool, args });
}

test('design creation, rename, export, reopening and deletion use the suite workspace', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await expect(page.locator('.launcher-card')).toHaveCount(4);
  await page.getByRole('link', { name: 'New design', exact: true }).click();
  await expect(page).toHaveURL(/blueline\/\?id=/);
  await expect(page.locator('#fileName')).toHaveValue('Untitled');
  await call(page, 'get_capabilities');
  const created = await call(page, 'create', { spec: { type: 'frame', name: 'Integration card', w: 320, h: 180, fill: '#087BB5', children: [{ type: 'text', text: 'Hello OfficeNinja', x: 24, y: 24, color: '#FFFFFF' }] } });
  expect(JSON.stringify(created)).toContain('Integration card');
  await page.locator('#fileName').fill('Design integration test');
  await page.locator('#fileName').press('Enter');
  const savedUrl = page.url();
  // Navigation must flush the pending autosave, even before its debounce fires.
  await page.getByRole('link', { name: 'Workspace' }).click();
  const recent = page.getByRole('link', { name: 'Open Design integration test', exact: true });
  await expect(recent).toBeVisible();
  await recent.click();
  await expect(page.locator('#fileName')).toHaveValue('Design integration test');
  expect(page.url()).toBe(savedUrl);
  expect(JSON.stringify(await call(page, 'get_tree'))).toContain('Hello OfficeNinja');
  await page.locator('#mainMenu').click();
  const download = page.waitForEvent('download');
  await page.getByText('Save a copy to your computer', { exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.blueline(?:\.json)?$/);
  await page.reload();
  await expect(page.locator('#fileName')).toHaveValue('Design integration test');
  await page.getByRole('link', { name: 'Workspace' }).click();
  await page.getByRole('button', { name: 'Delete Design integration test', exact: true }).click();
  await page.getByRole('button', { name: 'Delete file', exact: true }).click();
  await expect(recent).toHaveCount(0);
  await page.goto(savedUrl);
  await expect(page.locator('#fileName')).toHaveValue('Untitled');
  await expect(page.locator('#toast')).toContainText('no longer in this browser');
  expect(page.url()).not.toBe(savedUrl);
  expect(errors).toEqual([]);
});

test('theme and app switching work across all four editors', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(base);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.getByRole('link', { name: 'New design', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.getByLabel('Switch app').selectOption('word');
  await expect(page.locator('.document-page')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  for (const name of ['NinjaCalc', 'NinjaSlides', 'NinjaWord']) {
    await page.getByLabel('Switch app').selectOption(name);
    await expect(page.locator('.app-title')).toHaveText(name);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  }
  await page.getByLabel('Switch app').selectOption('Blueline');
  await expect(page).toHaveURL(/blueline\/\?id=/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('open tabs receive theme changes without a reload', async ({ context, page }) => {
  await page.goto(base);
  const design = await context.newPage();
  await design.goto(`${base}/blueline/?new=1`);
  await expect(design).toHaveURL(/\?id=/);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(design.locator('html')).toHaveAttribute('data-theme', 'dark');
  await design.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('SEO, manifest and agent resources are included in the production build', async ({ request }) => {
  for (const path of ['/', '/blueline/']) {
    const response = await request.get(base + path);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain(`href="https://microslop.xyz${path}"`);
    expect(html).toContain('application/ld+json');
    expect(html).toContain('og:description');
    expect(html).toContain('Blueline');
  }
  expect((await (await request.get(`${base}/manifest.webmanifest`)).json()).shortcuts).toHaveLength(4);
  expect(await (await request.get(`${base}/sitemap.xml`)).text()).toContain('https://microslop.xyz/blueline/');
  for (const path of ['robots.txt', 'blueline/tools.json', 'blueline/llms.txt', 'blueline/docs/ai-control.md', 'blueline/examples/embed.html']) {
    expect((await request.get(`${base}/${path}`)).ok()).toBeTruthy();
  }
});

for (const width of [1440, 390]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`visual review ${width}px ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 960 });
      await page.emulateMedia({ colorScheme: theme });
      for (const [name, path, ready] of [
        ['dashboard', '/', '.launcher-card'],
        ['blueline', '/blueline/', '#canvas'],
        ['word', '/#/word', '.document-page'],
        ['calc', '/#/excel', '.fortune-sheet-container'],
        ['slides', '/#/powerpoint', '.canvas-shell'],
      ]) {
        await page.goto(base + path);
        await expect(page.locator(ready).first()).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        expect(dimensions.scroll, `${name} horizontal overflow`).toBeLessThanOrEqual(dimensions.viewport + 1);
        await page.screenshot({ path: testInfo.outputPath(`${name}-${width}-${theme}.png`), fullPage: true });
      }
    });
  }
}
