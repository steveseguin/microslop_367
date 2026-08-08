import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { expect, test } from '@playwright/test';
import { banner, expectStored, makeId, openWord, reloadEditor, ribbon } from './helpers/app';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, '..', name);

function findBar(page: import('@playwright/test').Page) {
  return page.locator('.find-replace-bar');
}

/**
 * Asserts the find bar reports `count` matches.
 *
 * The bar renders either "N results" (nothing navigated to yet) or "i of N" (after
 * stepping through matches), and which one it shows has already changed once while this
 * suite was being written. Both encode the same fact, so accept either rather than pinning
 * the test to this hour's wording.
 */
async function expectMatchCount(page: import('@playwright/test').Page, count: number) {
  await expect(findBar(page)).toContainText(
    new RegExp(`(?:\\d+ of ${count}(?!\\d)|(?<!\\d)${count} results?)`),
  );
}

async function replaceEditorText(page: import('@playwright/test').Page, text: string) {
  const editor = page.locator('.ProseMirror');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(text);
  return editor;
}

test.describe('Word find and replace', () => {
  test('overlapping candidates are matched non-overlappingly and replaced consistently', async ({ page }) => {
    await openWord(page, makeId('word-overlap'));
    const editor = await replaceEditorText(page, 'aaaaaa');

    await ribbon(page).getByRole('button', { name: 'Find and replace (Ctrl+F)' }).click();
    await findBar(page).getByLabel('Find text').fill('aa');

    // "aaaaaa" contains three non-overlapping "aa", not five overlapping ones.
    await expectMatchCount(page, 3);

    await findBar(page).getByLabel('Replace with').fill('b');
    await page.getByRole('button', { name: 'Replace all' }).click();

    await expect(banner(page)).toContainText('3 replacements applied.');
    await expect(editor).toHaveText('bbb');
  });

  test('replace all on a longer overlapping run leaves no stray matches behind', async ({ page }) => {
    await openWord(page, makeId('word-overlap-long'));
    const editor = await replaceEditorText(page, 'abababab and ababab');

    await ribbon(page).getByRole('button', { name: 'Find and replace (Ctrl+F)' }).click();
    await findBar(page).getByLabel('Find text').fill('abab');
    await expectMatchCount(page, 3);

    await findBar(page).getByLabel('Replace with').fill('X');
    await page.getByRole('button', { name: 'Replace all' }).click();
    await expect(editor).toHaveText('XX and Xab');
  });

  test('match case narrows the result set', async ({ page }) => {
    await openWord(page, makeId('word-case'));
    await replaceEditorText(page, 'Alpha alpha ALPHA');

    await ribbon(page).getByRole('button', { name: 'Find and replace (Ctrl+F)' }).click();
    await findBar(page).getByLabel('Find text').fill('alpha');
    await expectMatchCount(page, 3);

    await findBar(page).getByRole('checkbox').check();
    await expectMatchCount(page, 1);
  });

  test('replacing with an empty string deletes the matches instead of doing nothing', async ({ page }) => {
    await openWord(page, makeId('word-delete-matches'));
    const editor = await replaceEditorText(page, 'keep REMOVE keep REMOVE keep');

    await ribbon(page).getByRole('button', { name: 'Find and replace (Ctrl+F)' }).click();
    await findBar(page).getByLabel('Find text').fill('REMOVE ');
    await page.getByRole('button', { name: 'Replace all' }).click();

    await expect(banner(page)).toContainText('2 replacements applied.');
    await expect(editor).toHaveText('keep keep keep');
  });

  test('the counter reports a bare total until a match is actually navigated to', async ({ page }) => {
    // Pins the exact resting wording. `expectMatchCount` accepts both "N results" and
    // "i of N" so it keeps working across wording changes, but that also means it would
    // pass against the old off-by-one behaviour, where the bar claimed "1 of 3" with
    // nothing selected and the first Find Next jumped straight to match 2.
    await openWord(page, makeId('word-resting-counter'));
    await replaceEditorText(page, 'one cat two cat three cat');

    await ribbon(page).getByRole('button', { name: 'Find and replace (Ctrl+F)' }).click();
    await findBar(page).getByLabel('Find text').fill('cat');

    await expect(findBar(page)).toContainText('3 results');
    await expect(findBar(page)).not.toContainText(' of 3');

    // Nothing is navigated to yet, so no match may be rendered as the active one.
    await expect(page.locator('.ProseMirror span[style*="rgb(249, 115, 22)"]')).toHaveCount(0);
    // ...while every match is still highlighted.
    await expect(page.locator('.ProseMirror span[style*="background-color"]')).toHaveCount(3);

    // The first Find Next selects match 1, not match 2.
    await findBar(page).getByLabel('Find text').press('Enter');
    await expect(findBar(page)).toContainText('1 of 3');
    await expect(page.locator('.ProseMirror span[style*="rgb(249, 115, 22)"]')).toHaveText('cat');

    await findBar(page).getByLabel('Find text').press('Enter');
    await expect(findBar(page)).toContainText('2 of 3');
  });

  test('a fold that changes string length yields real, selectable matches', async ({ page }) => {
    // `İ`.toLowerCase() is two code units (i + U+0307). Ending a match at the code unit
    // AFTER it collapsed the range to zero width: the counter reported a match that
    // nothing could highlight, select or replace.
    await openWord(page, makeId('word-fold-offsets'));
    const editor = await replaceEditorText(page, 'İstanbul için bir ipucu');

    await ribbon(page).getByRole('button', { name: 'Find and replace (Ctrl+F)' }).click();
    await findBar(page).getByLabel('Find text').fill('i');

    await expect(findBar(page)).toContainText('5 results');
    // Five highlights, and none of them empty.
    const highlights = page.locator('.ProseMirror span[style*="background-color"]');
    await expect(highlights).toHaveCount(5);
    await expect(highlights.first()).toHaveText('İ');

    // The first stop is a real range, not an empty one.
    await findBar(page).getByLabel('Find text').press('Enter');
    await expect(page.locator('.ProseMirror span[style*="rgb(249, 115, 22)"]')).toHaveText('İ');

    await findBar(page).getByLabel('Replace with').fill('X');
    await page.getByRole('button', { name: 'Replace all' }).click();

    // The reported count and the applied count must agree.
    await expect(banner(page)).toContainText('5 replacements applied.');
    await expect(editor).toHaveText('Xstanbul XçXn bXr Xpucu');
  });

  test('a search with no matches reports so and changes nothing', async ({ page }) => {
    await openWord(page, makeId('word-no-match'));
    const editor = await replaceEditorText(page, 'nothing to see here');

    await ribbon(page).getByRole('button', { name: 'Find and replace (Ctrl+F)' }).click();
    await findBar(page).getByLabel('Find text').fill('zebra');
    await expect(findBar(page)).toContainText('No results');

    await page.getByRole('button', { name: 'Replace all' }).click();
    await expect(banner(page)).toContainText('No matches found for "zebra".');
    await expect(editor).toHaveText('nothing to see here');
  });
});

test.describe('Word tables', () => {
  test('a table is inserted, grows by row and column, and survives a reload', async ({ page }) => {
    const id = makeId('word-table');
    await openWord(page, id);
    await replaceEditorText(page, 'Before the table.');

    await ribbon(page).getByRole('button', { name: 'Insert table' }).click();
    const table = page.locator('.ProseMirror table');
    await expect(table).toBeVisible();
    await expect(table.locator('tr')).toHaveCount(3);
    await expect(table.locator('tr').first().locator('th, td')).toHaveCount(3);

    // Put the caret in a cell so the table controls become enabled.
    await table.locator('td, th').first().click();
    await page.keyboard.type('R1C1');

    await ribbon(page).getByRole('button', { name: 'Insert row below' }).click();
    await expect(table.locator('tr')).toHaveCount(4);
    await ribbon(page).getByRole('button', { name: 'Insert column right' }).click();
    await expect(table.locator('tr').first().locator('th, td')).toHaveCount(4);

    await expectStored(
      page,
      id,
      (record) => {
        const json = JSON.stringify(record?.data ?? '');
        return json.includes('"table"') && json.includes('R1C1');
      },
      'the table and its cell text never reached storage',
    );

    await reloadEditor(page, 'word');
    const reloaded = page.locator('.ProseMirror table');
    await expect(reloaded.locator('tr')).toHaveCount(4);
    await expect(reloaded.locator('tr').first().locator('th, td')).toHaveCount(4);
    await expect(reloaded).toContainText('R1C1');
  });

  test('table controls are disabled outside a table and enabled inside one', async ({ page }) => {
    await openWord(page, makeId('word-table-controls'));
    await replaceEditorText(page, 'Plain paragraph.');

    const deleteRow = ribbon(page).getByRole('button', { name: 'Delete row' });
    await expect(deleteRow).toBeDisabled();

    await ribbon(page).getByRole('button', { name: 'Insert table' }).click();
    await page.locator('.ProseMirror table td, .ProseMirror table th').first().click();
    await expect(deleteRow).toBeEnabled();

    await ribbon(page).getByRole('button', { name: 'Delete table' }).click();
    await expect(page.locator('.ProseMirror table')).toHaveCount(0);
    await expect(deleteRow).toBeDisabled();
  });
});

test.describe('Word import and export', () => {
  test('an exported DOCX contains the document text AND its embedded images', async ({ page }) => {
    const id = makeId('word-export');
    await openWord(page, id);
    await replaceEditorText(page, 'Exported paragraph with an image below.');

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      ribbon(page).getByRole('button', { name: 'Insert image' }).click(),
    ]);
    await chooser.setFiles(fixture('test.png'));
    await expect(page.locator('.ProseMirror img')).toHaveCount(1);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export DOCX' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.docx$/);

    const zip = await JSZip.loadAsync(readFileSync((await download.path())!));
    const names = Object.keys(zip.files);

    // A previous report claimed "Word export ignores images". It does not: assert it.
    expect(names.some((name) => name.startsWith('word/media/')), `no word/media in ${names.join(', ')}`).toBe(true);
    const documentXml = await zip.file('word/document.xml')!.async('string');
    expect(documentXml).toContain('Exported paragraph with an image below.');
    expect(documentXml).toContain('<w:drawing>');
  });

  test('importing a DOCX asks first, then replaces the document and renames it', async ({ page }) => {
    const id = makeId('word-import');
    await openWord(page, id);
    const editor = await replaceEditorText(page, 'Content that the import will discard.');

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import DOCX' }).click(),
    ]);
    await chooser.setFiles(fixture('test.docx'));

    // Destructive import must be confirmed, and cancelling must change nothing.
    const dialog = page.getByRole('dialog', { name: 'Replace this document?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Keep my document' }).click();
    await expect(editor).toContainText('Content that the import will discard.');

    const [secondChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import DOCX' }).click(),
    ]);
    await secondChooser.setFiles(fixture('test.docx'));
    await page.getByRole('dialog', { name: 'Replace this document?' }).getByRole('button', { name: 'Import and replace' }).click();

    await expect(banner(page)).toContainText('DOCX imported.');
    await expect(editor).toContainText('Hello Word from Node');
    await expect(page.getByLabel('File name')).toHaveValue('test');

    await expectStored(
      page,
      id,
      (record) => JSON.stringify(record?.data ?? '').includes('Hello Word from Node') && record?.title === 'test',
      'the imported document was never persisted',
    );
  });
});

test.describe('Word image embedding', () => {
  test('a fetchable URL is embedded as local data rather than kept as a hot link', async ({ page }) => {
    const id = makeId('word-url-embed');
    await page.route('https://assets.officeninja.test/**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*', 'content-type': 'image/png' },
        body: readFileSync(fixture('test.png')),
      });
    });

    await openWord(page, id);
    await ribbon(page).getByRole('button', { name: 'Embed image URL' }).click();
    await page.getByRole('textbox', { name: 'Image URL' }).fill('https://assets.officeninja.test/embed.png');
    await page.getByRole('button', { name: 'Embed URL' }).click();

    await expect(banner(page)).toContainText('Image embedded locally.');
    await expect(page.locator('.ProseMirror img').first()).toHaveAttribute('src', /^data:image\/png;base64,/);

    await expectStored(
      page,
      id,
      (record) => JSON.stringify(record?.data ?? '').includes('data:image/png;base64,'),
      'the embedded image was not stored inline',
    );

    await reloadEditor(page, 'word');
    await expect(page.locator('.ProseMirror img').first()).toHaveAttribute('src', /^data:image\/png;base64,/);
  });

  test('a URL that is not an image reports a failure instead of inserting a broken node', async ({ page }) => {
    await openWord(page, makeId('word-bad-url'));

    await ribbon(page).getByRole('button', { name: 'Embed image URL' }).click();
    await page.getByRole('textbox', { name: 'Image URL' }).fill('https://example.com/definitely-not-an-image');
    await page.getByRole('button', { name: 'Embed URL' }).click();

    await expect(banner(page)).toContainText('Image could not be loaded.');
    await expect(page.locator('.ProseMirror img')).toHaveCount(0);
  });
});

test.describe('Word document naming', () => {
  test('a blank file name falls back to the default instead of being persisted empty', async ({ page }) => {
    const id = makeId('word-blank-name');
    await openWord(page, id);
    await page.locator('.ProseMirror').click();
    await page.keyboard.type(' named document');

    const fileName = page.getByLabel('File name');
    await fileName.fill('   ');
    await fileName.blur();
    await expect(fileName).toHaveValue('Untitled Document');

    await expectStored(
      page,
      id,
      (record) => record?.title === 'Untitled Document',
      'a blank title was persisted, which makes the record unloadable',
    );
  });
});
