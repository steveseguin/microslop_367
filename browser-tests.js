// OfficeNinja Browser Console Tests
// Copy and paste this into browser DevTools console to test

(function() {
  const results = [];
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      const result = fn();
      if (result) {
        console.log('%c PASS ', 'background: green; color: white', name);
        passed++;
      } else {
        console.log('%c FAIL ', 'background: red; color: white', name);
        failed++;
      }
    } catch (e) {
      console.log('%c ERROR ', 'background: orange; color: white', name, e.message);
      failed++;
    }
  }

  // Detect which app we're in
  const isWord = window.location.pathname.includes('word');
  const isExcel = window.location.pathname.includes('excel');
  const isPowerPoint = window.location.pathname.includes('powerpoint');

  console.log('=== OfficeNinja Browser Tests ===');
  console.log('App:', isWord ? 'NinjaWord' : isExcel ? 'NinjaCalc' : isPowerPoint ? 'NinjaSlides' : 'Unknown');
  console.log('');

  // Common tests
  test('localStorage available', () => typeof localStorage !== 'undefined');
  test('Document ready', () => document.readyState === 'complete');

  if (isWord) {
    // NinjaWord tests
    test('Editor element exists', () => !!document.getElementById('editor'));
    test('Editor is contenteditable', () => {
      const ed = document.getElementById('editor');
      return ed && ed.contentEditable === 'true';
    });
    test('saveDocument function exists', () => typeof saveDocument === 'function');
    test('loadDocument function exists', () => typeof loadDocument === 'function');
    test('formatDoc function exists', () => typeof formatDoc === 'function');
    test('exportDocx function exists', () => typeof exportDocx === 'function');
    test('Can type in editor', () => {
      const ed = document.getElementById('editor');
      const before = ed.innerHTML;
      ed.focus();
      document.execCommand('insertText', false, 'TEST');
      const after = ed.innerHTML;
      document.execCommand('undo');
      return after.includes('TEST');
    });
  }

  if (isExcel) {
    // NinjaCalc tests
    test('Spreadsheet area exists', () => !!document.getElementById('spreadsheetArea'));
    test('sheets array exists', () => Array.isArray(window.sheets));
    test('saveSpreadsheet function exists', () => typeof saveSpreadsheet === 'function');
    test('loadSpreadsheet function exists', () => typeof loadSpreadsheet === 'function');
    test('getCellValue function exists', () => typeof getCellValue === 'function');
    test('setCellValue function exists', () => typeof setCellValue === 'function');
    test('evaluateFormula function exists', () => typeof evaluateFormula === 'function');
    test('Formula SUM works', () => {
      if (typeof evaluateFormula === 'function') {
        // Set test values
        setCellValue('A1', '10');
        setCellValue('A2', '20');
        const result = evaluateFormula('=SUM(A1:A2)');
        return result === 30;
      }
      return false;
    });
  }

  if (isPowerPoint) {
    // NinjaSlides tests
    test('Slide canvas exists', () => !!document.getElementById('slideCanvas'));
    test('slides array exists', () => Array.isArray(window.slides));
    test('savePresentation function exists', () => typeof savePresentation === 'function');
    test('loadPresentation function exists', () => typeof loadPresentation === 'function');
    test('addSlide function exists', () => typeof addSlide === 'function');
    test('goToSlide function exists', () => typeof goToSlide === 'function');
    test('Has at least one slide', () => window.slides && window.slides.length >= 1);
    test('Can add slide', () => {
      if (typeof addSlide === 'function') {
        const before = slides.length;
        addSlide();
        const after = slides.length;
        return after === before + 1;
      }
      return false;
    });
  }

  console.log('');
  console.log('=== Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  return { passed, failed };
})();
