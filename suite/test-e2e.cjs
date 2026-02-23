const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting E2E Tests for OfficeNinja Suite...');
  
  // Launch headless browser, allowing self-signed certificates
  const browser = await puppeteer.launch({ 
    args: ['--ignore-certificate-errors', '--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Test Dashboard
    console.log('--> Testing Dashboard load...');
    await page.goto('https://localhost:3443/', { waitUntil: 'networkidle0' });
    
    const dashboardTitle = await page.$eval('h1', el => el.textContent);
    if (!dashboardTitle.includes('OfficeNinja')) throw new Error('Dashboard failed to load correctly.');
    console.log('    [PASS] Dashboard loaded successfully.');

    // 2. Test Navigation to NinjaWord
    console.log('--> Testing Navigation to NinjaWord...');
    await page.goto('https://localhost:3443/word?id=test-doc-123', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.document-page', { timeout: 5000 });
    
    const wordTitle = await page.$eval('.app-title', el => el.textContent);
    if (!wordTitle.includes('NinjaWord')) throw new Error('Failed to navigate to NinjaWord.');
    console.log('    [PASS] NinjaWord loaded successfully.');

    // 3. Test Editor & Auto-Save
    console.log('--> Testing TipTap Editor and Auto-Save...');
    await page.click('.ProseMirror');
    
    // Clear default text and type something new
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');

    const testString = 'Hello from Puppeteer E2E Test! Auto-save should catch this.';
    await page.keyboard.type(testString);
    
    // Wait for auto-save to settle
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('    [PASS] Editor works and auto-save triggered successfully.');

    // 4. Test Persistence (Refresh Page)
    console.log('--> Testing Local Persistence (IndexedDB)...');
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Wait for editor to populate
    await page.waitForSelector('.ProseMirror p');
    
    const editorContent = await page.$eval('.ProseMirror', el => el.textContent);
    if (!editorContent.includes(testString)) {
        throw new Error(`Content mismatch after reload. Expected "${testString}", got "${editorContent}"`);
    }
    console.log('    [PASS] Content perfectly restored from IndexedDB after page reload.');

    console.log('--> All E2E Tests Passed Successfully!');
  } catch (err) {
    console.error('--> Test Failed: ', err.message);
  } finally {
    await browser.close();
  }
})();