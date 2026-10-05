import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100">
  <rect id="box" x="10" y="10" width="80" height="80" fill="#ff0000"/>
  <circle cx="150" cy="50" r="40" fill="#0000ff"/>
</svg>`;

const HOSTILE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)">
  <script>window.pwned = true</script>
  <a href="javascript:alert(2)"><rect width="10" height="10" fill="green" onclick="alert(3)"/></a>
</svg>`;

async function ready(page: Page) {
  await page.goto('/#/svg');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
}

async function openSvg(page: Page, markup: string, name = 'sample.svg') {
  await page.getByLabel('Open SVG or image file').setInputFiles({
    name,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(markup),
  });
}

async function code(page: Page) {
  await page.getByRole('tab', { name: 'Code' }).click();
  return page.getByLabel('SVG code').inputValue();
}

async function download(page: Page, button: RegExp) {
  const done = page.waitForEvent('download');
  await page.getByRole('button', { name: button }).click();
  const file = await done;
  return { name: file.suggestedFilename(), bytes: await readFile((await file.path())!) };
}

/** Click a shape inside the shadow-rooted preview by its centre. */
async function clickShape(page: Page, selector: string) {
  const rect = await page.evaluate((sel) => {
    const host = document.querySelector('.svg-host')!;
    const el = host.shadowRoot!.querySelector(sel)!;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, selector);
  await page.mouse.click(rect.x, rect.y);
}

test('import, select, recolor, add a shape, and keep it across reload', async ({ page }) => {
  await ready(page);
  await openSvg(page, SAMPLE);
  await expect(page.getByText('Opened sample.svg.')).toBeVisible();
  await clickShape(page, 'rect');
  await expect(page.getByText('Selected <rect>.', { exact: false })).toBeVisible();
  await page.getByLabel('Fill color').fill('#00ff00');
  expect(await code(page)).toContain('fill="#00ff00"');
  await page.getByRole('button', { name: 'Star', exact: true }).click();
  expect(await code(page)).toContain('<polygon');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.waitForTimeout(700);
  await page.reload();
  expect(await code(page)).toContain('<polygon');
  expect(await code(page)).toContain('fill="#00ff00"');
});

test('dragging a shape moves it and undo restores it', async ({ page }) => {
  await ready(page);
  await openSvg(page, SAMPLE);
  const start = await page.evaluate(() => {
    const el = document.querySelector('.svg-host')!.shadowRoot!.querySelector('rect')!;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 40, start.y, { steps: 5 });
  await page.mouse.up();
  const moved = await code(page);
  expect(moved).not.toContain('x="10" y="10"');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await code(page)).toContain('x="10"');
});

test('exports PNG at 2x, ICO and an optimized SVG', async ({ page }) => {
  await ready(page);
  await openSvg(page, SAMPLE);
  await page.getByRole('tab', { name: 'Export' }).click();
  await page.getByRole('button', { name: '2×' }).click();
  const png = await download(page, /Download PNG/);
  expect(png.name).toBe('sample.png');
  expect(png.bytes.readUInt32BE(16)).toBe(400);
  expect(png.bytes.readUInt32BE(20)).toBe(200);
  const ico = await download(page, /^Favicon \(\.ico\)$/);
  expect(ico.bytes.readUInt16LE(2)).toBe(1);
  expect(ico.bytes.readUInt16LE(4)).toBe(3);
  await page.getByRole('button', { name: 'Optimize', exact: true }).click();
  await expect(page.getByText(/smaller\)/)).toBeVisible();
  await page.getByRole('button', { name: 'JPEG', exact: true }).click();
  const jpg = await download(page, /Download JPEG/);
  expect(jpg.bytes[0]).toBe(0xff);
  await page.getByRole('button', { name: 'React component' }).click();
  await expect(page.getByLabel('Snippet', { exact: true })).toHaveValue(/export default function Sample/);
});

test('scripts and event handlers are stripped from imported SVG', async ({ page }) => {
  await ready(page);
  await openSvg(page, HOSTILE, 'hostile.svg');
  await expect(page.getByText(/Removed \d+ unsafe item/)).toBeVisible();
  const markup = await code(page);
  expect(markup).not.toMatch(/<script|onload|onclick|javascript:/i);
  expect(await page.evaluate(() => (window as unknown as { pwned?: boolean }).pwned)).toBeUndefined();
});

test('a raster image traces into vector paths', async ({ page }) => {
  await ready(page);
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 120;
    c.height = 120;
    const x = c.getContext('2d')!;
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, 120, 120);
    x.fillStyle = '#e11d48';
    x.beginPath();
    x.arc(60, 60, 40, 0, Math.PI * 2);
    x.fill();
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Open SVG or image file').setInputFiles({
    name: 'dot.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await expect(page.getByRole('tab', { name: 'Trace' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Trace to vector' }).click();
  await page.getByRole('button', { name: 'Open in editor' }).click({ timeout: 20_000 });
  const markup = await code(page);
  expect(markup).toContain('<path');
  expect(markup).toContain('viewBox="0 0 120 120"');
});
