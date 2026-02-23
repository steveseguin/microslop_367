import { test, expect } from '@playwright/test';

test.describe('Testing Fixed 5 MORE Bugs', () => {

  test('Bug 11 Fixed: NinjaSlides now has Image Upload functionality', async ({ page }) => {
    await page.goto('https://localhost:3443/#/powerpoint');
    await page.waitForSelector('.canvas-wrapper canvas');
    
    const imageUploadBtn = await page.locator('button[title="Add Image"]').count();
    expect(imageUploadBtn).toBeGreaterThan(0);
  });

  test('Bug 12 Fixed: NinjaSlides now has Z-Index (Bring Forward/Send Backward) controls', async ({ page }) => {
    await page.goto('https://localhost:3443/#/powerpoint');
    await page.waitForSelector('.canvas-wrapper canvas');
    
    const bringForward = await page.locator('button[title="Bring Forward"]').count();
    const sendBackward = await page.locator('button[title="Send Backward"]').count();
    expect(bringForward).toBeGreaterThan(0);
    expect(sendBackward).toBeGreaterThan(0);
  });

  test('Bug 14 Fixed: NinjaWord now has Find and Replace', async ({ page }) => {
    await page.goto('https://localhost:3443/#/word');
    await page.waitForSelector('.document-page');
    
    const findBtn = await page.locator('button[title="Find and Replace"]').count();
    expect(findBtn).toBeGreaterThan(0);
  });

  test('Bug 15 Fixed: NinjaSlides now has Undo and Redo', async ({ page }) => {
    await page.goto('https://localhost:3443/#/powerpoint');
    await page.waitForSelector('.canvas-wrapper canvas');
    
    const undoBtn = await page.locator('button[title="Undo"]').count();
    const redoBtn = await page.locator('button[title="Redo"]').count();
    expect(undoBtn).toBeGreaterThan(0);
    expect(redoBtn).toBeGreaterThan(0);
  });

});
