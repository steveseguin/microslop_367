import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const resolution of ['Save entry', 'Cancel edit'])
  test(`an open entry edit must use ${resolution} before invoicing`, async ({ page }) => {
    await page.goto('/#/time');
    await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
    await page.getByLabel('Description', { exact: true }).fill('Synthetic design work');
    await page.getByLabel('Client', { exact: true }).fill('Example client');
    await page.getByRole('button', { name: 'Add manual entry' }).click();
    await expect(page.getByText('Time entry saved.', { exact: true })).toBeVisible();
    await page.getByLabel('Select Synthetic design work').check();
    await page.getByRole('button', { name: 'Edit Synthetic design work' }).click();
    await page.getByLabel('Manual hours').fill('2');
    await expect(page.getByRole('button', { name: 'Create invoice (1)' })).toBeDisabled();
    await page.getByRole('button', { name: resolution, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create invoice (1)' })).toBeEnabled();
    await page.getByRole('button', { name: 'Create invoice (1)' }).click();
    await expect(page.locator('.tool-content .invoice-paper')).toContainText(resolution === 'Save entry' ? '02:00:00' : '01:00:00');
    await page.getByRole('tab', { name: 'Time entries', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit Synthetic design work' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Save entry', exact: true })).toHaveCount(0);
    await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Edit Synthetic design work' })).toBeDisabled();
    const backup = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Backup', exact: true }).click();
    const workspace = JSON.parse(await readFile((await (await backup).path())!, 'utf8'));
    expect(workspace.entries[0].seconds).toBe(resolution === 'Save entry' ? 7200 : 3600);
    expect(workspace.invoices[0].lines[0]).toEqual(workspace.entries[0]);
  });
