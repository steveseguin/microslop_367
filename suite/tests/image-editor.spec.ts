import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/** Width/height from a PNG's IHDR chunk. */
function pngSize(bytes: Buffer) {
  expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
}

/** A 200×100 PNG with a red left half and a blue right half, made in-page. */
async function samplePng(page: Page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 100;
    const x = c.getContext('2d')!;
    x.fillStyle = '#ff0000';
    x.fillRect(0, 0, 100, 100);
    x.fillStyle = '#0000ff';
    x.fillRect(100, 0, 100, 100);
    return c.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(b64, 'base64');
}

async function open(page: Page) {
  await page.goto('/#/image');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.getByLabel('Open image file').setInputFiles({
    name: 'halves.png',
    mimeType: 'image/png',
    buffer: await samplePng(page),
  });
  await expect(page.getByText('Opened halves.png (200 × 100).')).toBeVisible();
}

async function download(page: Page, button: RegExp) {
  const done = page.waitForEvent('download');
  await page.getByRole('button', { name: button }).click();
  const file = await done;
  return { name: file.suggestedFilename(), bytes: await readFile((await file.path())!) };
}

/** Read one document pixel through the export path (PNG at full size). */
async function pixel(page: Page, x: number, y: number) {
  return page.evaluate(
    ([px, py]) => {
      const view = document.querySelector('.img-view') as HTMLCanvasElement;
      return [...view.getContext('2d')!.getImageData(px, py, 1, 1).data];
    },
    [x, y],
  );
}

test('rotate, crop, adjust, draw, erase to transparency and undo', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Transform' }).click();
  await page.getByRole('button', { name: 'Rotate right' }).click();
  await expect(page.getByText('100 × 200 px')).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('200 × 100 px')).toBeVisible();

  // Crop to a square from the centre via the 1:1 preset.
  await page.getByRole('button', { name: 'Crop', exact: true }).first().click();
  await page.getByRole('button', { name: '1:1' }).click();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Cropped to 100 × 100.')).toBeVisible();

  // Brighten via Adjust.
  await page.getByRole('button', { name: 'Adjust', exact: true }).click();
  await page.getByRole('button', { name: 'Grayscale' }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByText('Adjustments applied.')).toBeVisible();
  const [r, g, b] = await pixel(page, 10, 50);
  expect(Math.abs(r - g)).toBeLessThan(3);
  expect(Math.abs(g - b)).toBeLessThan(3);

  // Erase a stroke across the middle to transparency.
  await page.getByRole('button', { name: 'Eraser', exact: true }).click();
  const surface = page.getByLabel(/Image editing surface/);
  const box = (await surface.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await pixel(page, 50, 50))[3]).toBeLessThan(40);

  // Export PNG at half size keeps transparency and the requested dimensions.
  await page.getByRole('button', { name: 'Export', exact: true }).first().click();
  await page.getByRole('button', { name: '50%' }).click();
  const png = await download(page, /Download PNG/);
  expect(png.name).toBe('halves.png');
  expect(pngSize(png.bytes)).toEqual({ w: 50, h: 50 });
  expect(png.bytes[25]).toBe(6); // colour type 6 = RGBA

  // JPEG export at a custom width.
  await page.getByRole('button', { name: 'JPEG', exact: true }).click();
  await page.getByLabel('Export width').fill('40');
  const jpg = await download(page, /Download JPEG/);
  expect(jpg.name).toBe('halves.jpg');
  expect(jpg.bytes[0]).toBe(0xff);
  expect(jpg.bytes[1]).toBe(0xd8);

  // ICO favicon.
  await page.getByRole('button', { name: 'ICO (favicon)', exact: true }).click();
  const ico = await download(page, /Download ICO/);
  expect(ico.bytes.readUInt16LE(2)).toBe(1);
  expect(ico.bytes.readUInt16LE(4)).toBe(3);
});

test('remove-color makes a background transparent and the image survives reload', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: 'Remove color', exact: true }).click();
  const surface = page.getByLabel(/Image editing surface/);
  const box = (await surface.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2);
  await expect(page.getByText(/Made 10,000 pixels transparent/)).toBeVisible();
  await expect.poll(async () => (await pixel(page, 150, 50))[3]).toBe(0);
  expect((await pixel(page, 50, 50))[3]).toBe(255);
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByText('200 × 100 px', { exact: false })).toBeVisible();
  await expect.poll(async () => (await pixel(page, 150, 50))[3]).toBe(0);
});

test('a blank transparent canvas can be drawn on and shapes added', async ({ page }) => {
  await page.goto('/#/image');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'New canvas' }).click();
  await page.getByRole('button', { name: 'Icon 512' }).click();
  await page.getByRole('button', { name: 'Transparent', exact: true }).click();
  await page.getByRole('button', { name: 'Create canvas' }).click();
  await expect(page.getByText('New 512 × 512 canvas.')).toBeVisible();
  await expect.poll(async () => (await pixel(page, 10, 10))[3]).toBe(0);
  await page.getByRole('button', { name: 'Shapes', exact: true }).click();
  await page.getByLabel('Fill shape').check();
  const surface = page.getByLabel(/Image editing surface/);
  const box = (await surface.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await pixel(page, 256, 256))[3]).toBe(255);
});
