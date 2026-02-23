import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Verifying Fixed Bugs', () => {

  test('Bug 1 Fixed: URL properly updates with docId on new file creation', async ({ page }) => {
    await page.goto('https://localhost:3443/');
    await page.click('text=NinjaWord');
    await page.waitForSelector('.document-page');
    
    // The URL should now have an ID
    const url = page.url();
    expect(url).toContain('?id=');
  });

  test('Bug 2 Fixed: NinjaWord preserves existing documents on load', async ({ page }) => {
    const docId = `word-test-${Date.now()}`;
    await page.goto(`https://localhost:3443/#/word?id=${docId}`);
    await page.waitForSelector('.document-page');
    
    // Type something unique
    await page.locator('.ProseMirror').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('CRITICAL IMPORTANT DATA');
    
    // Wait for save
    await page.waitForFunction(() => {
      const status = document.querySelector('.status-bar');
      return status && status.textContent.includes('Saved');
    });

    // Reload the page
    await page.reload();
    await page.waitForSelector('.document-page');
    
    // Check content
    const content = await page.locator('.ProseMirror').textContent();
    expect(content).toContain('CRITICAL IMPORTANT DATA');
  });

  test('Bug 4 Fixed: NinjaSlides Thumbnails now contain actual canvas previews', async ({ page }) => {
    await page.goto(`https://localhost:3443/#/powerpoint`);
    await page.waitForSelector('.canvas-wrapper canvas');
    
    // Add a rectangle to trigger auto-save and thumbnail generation
    await page.click('button[title="Add Rectangle"]');
    await page.waitForTimeout(2500); // Wait for auto-save debounce (1000ms + margin)
    
    // Look at the thumbnail
    const thumbnailHtml = await page.locator('.slide-thumbnail').first().innerHTML();
    
    // Should contain an img tag representing the thumbnail now
    expect(thumbnailHtml).toContain('<img');
  });

  test('Bug 5 Fixed: NinjaCalc Chart is draggable', async ({ page }) => {
    await page.goto(`https://localhost:3443/#/excel`);
    await page.waitForSelector('.spreadsheet-container');
    
    // Wait for fortune sheet
    await page.waitForTimeout(2000);

    // Click Chart
    await page.click('button:has-text("Chart")');
    await page.waitForTimeout(1000);
    
    const chartHeader = page.locator('.chart-header');
    await expect(chartHeader).toBeVisible();
    
    const chartContainer = chartHeader.locator('..');
    const initialStyle = await chartContainer.getAttribute('style') || '';
    
    // Drag the chart natively
    const box = await chartHeader.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
      await page.mouse.up();
    }
    
    const newStyle = await chartContainer.getAttribute('style') || '';
    expect(initialStyle).not.toEqual(newStyle);
  });
});