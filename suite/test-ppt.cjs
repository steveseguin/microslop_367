const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting PowerPoint E2E Test...');
  
  const browser = await puppeteer.launch({ 
    args: ['--ignore-certificate-errors', '--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Catch page errors
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });

  try {
    console.log('--> Navigating to NinjaSlides...');
    await page.goto('https://localhost:3443/#/powerpoint', { waitUntil: 'networkidle0' });
    
    console.log('--> Waiting for canvas...');
    await page.waitForSelector('canvas', { timeout: 5000 });
    
    // wait a bit for any react effects
    await new Promise(r => setTimeout(r, 2000));
    
    // click 'new slide'
    console.log('--> Clicking New Slide...');
    const newSlideBtn = await page.$('button[title="New Slide"]');
    if (newSlideBtn) {
      await newSlideBtn.click();
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log('New Slide button not found');
    }

    console.log('--> Test Finished without crashing script.');
  } catch (err) {
    console.error('--> Test Failed: ', err.message);
  } finally {
    await browser.close();
  }
})();