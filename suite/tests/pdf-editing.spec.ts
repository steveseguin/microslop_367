import { test, expect, type Page } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { readFile } from 'node:fs/promises';

/** A one-page invoice with a secret on its own line, plus a second page. */
async function invoicePdf() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const first = pdf.addPage([500, 650]);
  first.drawText('Invoice 1042', { x: 40, y: 600, size: 22, font });
  first.drawText('Account: 9876-5432', { x: 40, y: 560, size: 13, font });
  first.drawText('Thank you for your business.', { x: 40, y: 530, size: 13, font });
  pdf.addPage([500, 650]).drawText('Second page', { x: 40, y: 600, size: 22, font });
  return Buffer.from(await pdf.save());
}

async function openPdf(page: Page) {
  await page.goto('/#/pdf');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.getByLabel('Open PDF file', { exact: true }).setInputFiles({
    name: 'invoice.pdf',
    mimeType: 'application/pdf',
    buffer: await invoicePdf(),
  });
  await expect(page.getByText('Ready', { exact: true })).toBeVisible();
}

async function downloadText(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const bytes = await readFile((await (await download).path())!);
  return PDFDocument.load(bytes);
}

test('redaction deletes the text under the box and keeps the rest', async ({
  page,
}) => {
  await openPdf(page);
  await page.getByRole('button', { name: 'Redact', exact: true }).click();
  const surface = page.getByLabel('PDF annotation surface');
  const box = (await surface.boundingBox())!;
  const sx = box.width / 500;
  const sy = box.height / 650;
  // Drag across "Account: 9876-5432" (baseline y=560).
  await page.mouse.move(box.x + 30 * sx, box.y + (650 - 578) * sy);
  await page.mouse.down();
  await page.mouse.move(box.x + 200 * sx, box.y + (650 - 552) * sy, { steps: 4 });
  await page.mouse.up();
  await expect(
    page.getByText('Redacted. The text under the box was deleted from the file.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Edit text', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Edit text: Thank you for your business.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Edit text: Account/ }),
  ).toHaveCount(0);
  expect((await downloadText(page)).getPageCount()).toBe(2);
});

test('pages can be duplicated, added, navigated by thumbnail, and undone', async ({
  page,
}) => {
  await openPdf(page);
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Page 2 of 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Blank page', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Page 3 of 4' })).toBeVisible();
  await page.getByRole('button', { name: 'Go to page 1' }).click();
  await expect(page.getByLabel('Current page')).toHaveValue('0');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('heading', { name: /of 3$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.getByRole('button', { name: /Zoom 125%/ })).toBeVisible();
});

test('workspace Open file routes PDFs and Word files to their editors', async ({
  page,
}) => {
  await page.goto('/#/');
  await page.getByLabel('Open a file from this device').setInputFiles({
    name: 'invoice.pdf',
    mimeType: 'application/pdf',
    buffer: await invoicePdf(),
  });
  await expect(page).toHaveURL(/#\/pdf/);
  await expect(
    page.getByRole('button', { name: 'Edit text: Invoice 1042' }),
  ).toBeVisible();
  await page.goto('/#/');
  await expect(page.getByText('Continue editing invoice.pdf')).toBeVisible();
  await page.getByLabel('Open a file from this device').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('x'),
  });
  await expect(page.getByRole('alert')).toContainText('is not a file OfficeNinja opens');
});
