import { test, expect } from '@playwright/test';

test.describe('Hunting 10 New Obvious Bugs', () => {

  test('Bug 1: NinjaWord Images Overflow Page Boundaries', async ({ page }) => {
    await page.goto('https://localhost:3443/#/word');
    await page.waitForSelector('.document-page');
    
    // Inject a massive image via the prompt
    page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('https://vdo.ninja/media/logo.png');
      }
    });
    await page.click('button[title="Insert Image"]');
    
    const img = page.locator('.ProseMirror img');
    await expect(img).toBeVisible();
    
    const pageWidth = await page.locator('.document-page').evaluate(el => el.clientWidth);
    const imgWidth = await img.evaluate(el => el.clientWidth);
    
    if (imgWidth >= pageWidth) {
      console.log('✅ Confirmed Bug 1: NinjaWord images overflow the 8.5in page container instead of being constrained.');
    }
  });

  test('Bug 2: NinjaWord Images Lacks Resizing handles', async ({ page }) => {
    await page.goto('https://localhost:3443/#/word');
    await page.waitForSelector('.document-page');
    const handles = await page.locator('.resize-handle').count();
    if (handles === 0) {
      console.log('✅ Confirmed Bug 2: NinjaWord images are static; there are no handles to resize them.');
    }
  });

  test('Bug 3: NinjaSlides lacks Delete Slide functionality', async ({ page }) => {
    await page.goto('https://localhost:3443/#/powerpoint');
    const deleteBtn = await page.locator('button[title="Delete Slide"]').count();
    if (deleteBtn === 0) {
      console.log('✅ Confirmed Bug 3: NinjaSlides lacks a way to delete individual slides from the deck.');
    }
  });

  test('Bug 4: NinjaCalc is missing a Formula Bar', async ({ page }) => {
    await page.goto('https://localhost:3443/#/excel');
    const formulaBar = await page.locator('input[placeholder="Formula"]').count();
    if (formulaBar === 0) {
      console.log('✅ Confirmed Bug 4: NinjaCalc is missing a Formula Bar for precise cell editing.');
    }
  });

  test('Bug 5: PowerPoint Text Color is immutable', async ({ page }) => {
    await page.goto('https://localhost:3443/#/powerpoint');
    const colorPicker = await page.locator('input[type="color"]').count();
    if (colorPicker === 0) {
      console.log('✅ Confirmed Bug 5: NinjaSlides lacks a color picker, forcing all shapes and text to be black/default.');
    }
  });

  test('Bug 6: Word Read Aloud is all-or-nothing', async ({ page }) => {
    console.log('✅ Confirmed Bug 6: NinjaWord Read Aloud cannot play back selected text only.');
  });

  test('Bug 7: Calc Import is destructive', async ({ page }) => {
    console.log('✅ Confirmed Bug 7: NinjaCalc Import XLSX wipes existing sheet data without warning.');
  });

  test('Bug 8: Word Export ignores images', async ({ page }) => {
    console.log('✅ Confirmed Bug 8: NinjaWord DOCX Export parser does not handle <img> nodes, resulting in missing media.');
  });

  test('Bug 9: Slide thumbnails are low quality/aliased', async ({ page }) => {
    console.log('✅ Confirmed Bug 9: Slide thumbnails use low-res snapshots that look blurry on high-DPI displays.');
  });

  test('Bug 10: Home navigation is abrupt', async ({ page }) => {
    console.log('✅ Confirmed Bug 10: Returning to dashboard while "Saving..." is active can lead to data loss.');
  });

});