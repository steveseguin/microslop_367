import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173';

test.describe('NinjaWord Robustness & Stress Test', () => {

  test('Complex user workflow: typing, formatting, image loading, and navigation persistence', async ({ page }) => {
    const docId = `robust-test-${Date.now()}`;
    await page.goto(`${baseUrl}/#/word?id=${docId}`);
    await page.waitForSelector('.document-page');

    // 1. Stress Test: Type and Format
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);
    
    await page.keyboard.type('This is a robustness test.');
    await page.keyboard.press('Enter');
    
    // Toggle Bold and type
    await page.click('button[title="Bold"]');
    await page.waitForTimeout(200);
    await page.keyboard.type('This line is bold.');
    await page.waitForTimeout(200);
    await page.click('button[title="Bold"]');
    await page.keyboard.press('Enter');

    // 2. Image loading through the current local-file integration.
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('.toolbar-shell').getByTitle('Insert image').click(),
    ]);
    await chooser.setFiles(fileURLToPath(new URL('../test.png', import.meta.url)));
    const img = editor.locator('img');
    await expect(img).toBeVisible();
    
    // Verify image doesn't overflow (Bug fix verification)
    const pageWidth = await page.locator('.document-page').evaluate(el => el.clientWidth);
    const imgWidth = await img.evaluate(el => el.clientWidth);
    expect(imgWidth).toBeLessThanOrEqual(pageWidth);

    // 3. Copy-Paste Robustness
    console.log('--> Testing copy-paste cycle...');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+C');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+V');
    await page.waitForTimeout(500);
    
    // Verify content duplicated
    const content = await editor.innerText();
    console.log('Editor text content:', content);
    expect(content).toContain('This line is bold.');

    // 4. Persistence Test: Refreshing the page
    console.log('--> Testing refresh persistence...');
    // Wait for "Saved" status
    await page.waitForFunction(() => document.querySelector('.status-bar')?.textContent?.includes('Saved'), undefined, { timeout: 10000 });
    
    await page.reload();
    await page.waitForSelector('.document-page');
    
    // Verify all data returned
    await expect(editor).toContainText('This is a robustness test.');
    await expect(editor).toContainText('This line is bold.');
    await expect(editor.locator('img').first()).toBeVisible();

    // 5. Navigation Stress Test: Go Back to Dashboard and Return
    console.log('--> Testing history/navigation robustness...');
    await page.getByRole('link', { name: 'Workspace' }).click(); // Go home
    await page.waitForSelector('text=Recent files');
    
    // Find our doc in recent files and click it
    await page.click('text=Untitled Document');
    await page.waitForSelector('.document-page');
    
    // Verify we are back where we started
    await expect(editor).toContainText('This is a robustness test.');
    expect(page.url()).toContain(`id=${docId}`);

    // 6. Forward/Backward Browser Navigation
    console.log('--> Testing browser back/forward buttons...');
    await page.goBack();
    await page.waitForSelector('text=Recent files');
    await page.goForward();
    await page.waitForSelector('.document-page');
    await expect(editor).toContainText('This is a robustness test.');

    console.log('🎉 NinjaWord passed the robustness stress test!');
  });
});
