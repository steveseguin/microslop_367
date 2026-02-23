import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('OfficeNinja Suite E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Generate unique ID
    const id = Date.now().toString();
    await page.goto(`https://localhost:3443/#/?id=${id}`);
    await page.waitForLoadState('networkidle');
  });

  test('NinjaWord features', async ({ page }) => {
    await page.click('text=NinjaWord');
    await page.waitForSelector('.document-page');

    // Handle dialogs for prompt (Image Upload)
    page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
      } else {
        await dialog.accept();
      }
    });

    // Type text
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Testing Word ');

    // Bold text
    await page.click('button[title="Bold"]');
    await page.keyboard.type('Bold ');
    await page.click('button[title="Bold"]');

    // Insert Table
    await page.click('button[title="Insert Table"]');
    await expect(page.locator('.ProseMirror table')).toBeVisible();

    // Insert Image
    await page.click('button[title="Insert Image"]');
    await expect(page.locator('.ProseMirror img')).toBeVisible();

    // Import DOCX
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Import DOCX")')
    ]);
    await fileChooser.setFiles(path.join(__dirname, '../test.docx'));
    
    // Check imported text
    await expect(page.locator('.ProseMirror')).toContainText('Hello Word from Node');

    // Export DOCX
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export DOCX")')
    ]);
    expect(download.suggestedFilename()).toContain('.docx');
  });

  test('NinjaCalc features', async ({ page }) => {
    await page.click('text=NinjaCalc');
    await page.waitForSelector('.spreadsheet-container');

    page.on('dialog', async dialog => {
      console.log(`[NinjaCalc] Dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    // Wait a brief moment for fortune sheet rendering to stabilize
    await page.waitForTimeout(2000);

    // Click Chart
    await page.click('button:has-text("Chart")');
    
    // Give it a moment to render
    await page.waitForTimeout(1000);
    
    await expect(page.locator('canvas').last()).toBeVisible();
    await expect(page.locator('text=Generated Chart')).toBeVisible();

    // Import XLSX
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Import")')
    ]);
    await fileChooser.setFiles(path.join(__dirname, '../test.xlsx'));

    // Wait for import to process
    await page.waitForTimeout(2000);

    // Export XLSX
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export")')
    ]);
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('NinjaSlides features', async ({ page }) => {
    await page.click('text=NinjaSlides');
    await page.waitForSelector('.canvas-wrapper canvas');

    // Wait for Fabric.js to initialize
    await page.waitForTimeout(2000);

    // Add Slide
    await page.click('button[title="New Slide"]');
    await page.waitForTimeout(1000);

    // Add shapes
    await page.click('button[title="Add Text"]');
    await page.click('button[title="Add Rectangle"]');
    await page.click('button[title="Add Circle"]');

    // Verify canvas interaction by ensuring export triggers correctly with data
    // Export PPTX
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export PPTX")')
    ]);
    expect(download.suggestedFilename()).toContain('.pptx');

    // Presenter View
    await page.click('button[title="Presenter View"]');
    await expect(page.locator('text=Exit Presenter View')).toBeVisible();
    
    // Type a note
    await page.locator('textarea').fill('My speaker notes');
    await expect(page.locator('textarea')).toHaveValue('My speaker notes');
    
    // Exit presenter view
    await page.click('button:has-text("Exit Presenter View")');
  });
});