import { test, expect, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { readFile, writeFile } from 'node:fs/promises';

async function ready(page: Page) {
  await page.goto('/#/time');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
}

async function invoiceFromEntry(page: Page) {
  await page.getByLabel('Description', { exact: true }).fill('Design work');
  await page.getByLabel('Client', { exact: true }).fill('Acme');
  await page.getByLabel('Hourly rate').fill('125');
  await page.getByLabel('Manual hours').fill('2');
  await page.getByRole('button', { name: 'Add manual entry' }).click();
  await expect(page.getByText('Time entry saved.', { exact: true })).toBeVisible();
  await page.getByLabel('Select Design work').check();
  await page.getByRole('button', { name: 'Create invoice (1)' }).click();
}

async function newBlankInvoice(page: Page) {
  await page.getByRole('tab', { name: /Invoices/ }).click();
  await page.getByRole('button', { name: 'New invoice', exact: true }).click();
  await expect(page.getByText(/New invoice created/)).toBeVisible();
}

test('a blank invoice takes manual line items and totals them correctly', async ({
  page,
}) => {
  await ready(page);
  await newBlankInvoice(page);
  await expect(page.getByRole('tab', { name: 'Invoices (1)' })).toBeVisible();
  await page.getByLabel('Client name').fill('Globex');
  await page.getByLabel('Line 1 description', { exact: true }).fill('Logo design');
  await page.getByLabel('Line 1 quantity', { exact: true }).fill('3');
  await page.getByLabel('Line 1 rate', { exact: true }).fill('33.335');
  // 3 × 33.335 = 100.005 → rounded per line to $100.01.
  await expect(page.getByLabel('Line 1 amount', { exact: true })).toHaveText('$100.01');
  await page.getByRole('button', { name: 'Add line', exact: true }).click();
  await page.getByLabel('Line 2 description', { exact: true }).fill('Hosting');
  await page.getByLabel('Line 2 quantity', { exact: true }).fill('1');
  await page.getByLabel('Line 2 rate', { exact: true }).fill('20');
  await page.getByLabel('Tax %').fill('10');
  await page.getByLabel('Discount (USD)').fill('0.01');
  // (100.01 + 20 − 0.01) × 1.10 = 132.00
  await expect(page.locator('.tool-content .invoice-total')).toContainText('$132.00');
  await page.getByRole('button', { name: 'Remove line 2' }).click();
  // (100.01 − 0.01) × 1.10 = 110.00
  await expect(page.locator('.tool-content .invoice-total')).toContainText('$110.00');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText(/^Saved \d/)).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: /Invoices/ }).click();
  await expect(page.getByLabel('Line 1 description', { exact: true })).toHaveValue('Logo design');
  const row = page.locator('.time-invoices tbody tr').first();
  await expect(row).toContainText('Globex');
  await expect(row).toContainText('$110.00');
  await expect(row).toContainText('Unpaid');
});

test('invoices export to a file and import back as a new invoice', async ({
  page,
}) => {
  await ready(page);
  await invoiceFromEntry(page);
  await page.getByLabel('Line 1 description', { exact: true }).fill('Design work, phase one');
  await page.getByLabel('Tax %').fill('13');
  await page.getByLabel('Discount (USD)').fill('10');
  await expect(page.locator('.tool-content .invoice-total')).toContainText('$271.20');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export invoice', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('INV-0001.invoice.json');
  const path = (await file.path())!;
  const parsed = JSON.parse(await readFile(path, 'utf8'));
  expect(parsed.type).toBe('ninjatime-invoice');
  expect(parsed.version).toBe(1);
  expect(parsed.invoice.number).toBe('INV-0001');

  await page.getByLabel('Import invoice file').setInputFiles(path);
  await expect(page.getByText(/Imported INV-0001 \(imported\)/)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Invoices (2)' })).toBeVisible();
  await expect(page.getByLabel('Invoice number')).toHaveValue('INV-0001 (imported)');
  await expect(page.getByLabel('Line 1 description', { exact: true })).toHaveValue(
    'Design work, phase one',
  );
  await expect(page.locator('.tool-content .invoice-total')).toContainText('$271.20');
  // Imported lines never claim time entries: the quantity is editable.
  await expect(page.getByLabel('Line 1 quantity', { exact: true })).toHaveValue('2');

  // Deleting the original releases the entry even though a copy was imported.
  await page.getByRole('button', { name: 'Open INV-0001', exact: true }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete invoice' }).click();
  await expect(page.getByRole('tab', { name: 'Invoices (1)' })).toBeVisible();
  await page.getByRole('tab', { name: 'Time entries' }).click();
  await expect(page.getByLabel('Select Design work')).toBeEnabled();

  // Invalid files are refused without changing anything.
  await page.getByRole('tab', { name: /Invoices/ }).click();
  const bad = test.info().outputPath('bad.invoice.json');
  await writeFile(bad, JSON.stringify({ type: 'ninjatime-invoice', version: 1, invoice: { number: 'X' } }));
  await page.getByLabel('Import invoice file').setInputFiles(bad);
  await expect(page.getByText(/not a NinjaTime invoice/)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Invoices (1)' })).toBeVisible();
});

test('Download PDF produces a real multi-page invoice PDF', async ({ page }) => {
  await ready(page);
  await newBlankInvoice(page);
  await page.getByLabel('Client name').fill('Initech');
  await page.getByLabel('Line 1 description', { exact: true }).fill('Consulting − “discovery” workshop…');
  await page.getByLabel('Line 1 rate', { exact: true }).fill('500');
  for (let i = 2; i <= 40; i++) {
    await page.getByRole('button', { name: 'Add line', exact: true }).click();
    await page.getByLabel(`Line ${i} description`, { exact: true }).fill(`Support ticket ${i}`);
  }
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('INV-0001.pdf');
  const pdf = await PDFDocument.load(await readFile((await file.path())!));
  expect(pdf.getPageCount()).toBeGreaterThan(1);
  expect(pdf.getTitle()).toBe('Invoice INV-0001');
});

test('duplicate makes an unlinked copy and the list shows status', async ({
  page,
}) => {
  await ready(page);
  await invoiceFromEntry(page);
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Invoices (2)' })).toBeVisible();
  await expect(page.getByLabel('Invoice number')).toHaveValue('INV-0002');
  await page.getByLabel('Due date').fill('2020-01-31');
  await expect(page.locator('.time-invoice-row--current')).toContainText('Overdue');
  await page.getByRole('button', { name: 'Mark paid', exact: true }).click();
  await expect(page.locator('.time-invoice-row--current')).toContainText('Paid');
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page
      .locator('.tool-app')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
});
