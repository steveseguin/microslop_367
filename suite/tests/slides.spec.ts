import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  banner,
  dropImageOn,
  expectStored,
  makeId,
  openSlides,
  readStoredDocument,
  reloadEditor,
  ribbon,
} from './helpers/app';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, '..', name);

type Deck = { slides?: Array<{ id: string; notes?: string; data?: { objects?: unknown[] } }> };

function slideCards(page: import('@playwright/test').Page) {
  return page.locator('.slide-card');
}

async function storedSlideIds(page: import('@playwright/test').Page, id: string) {
  const record = await readStoredDocument<Deck>(page, id);
  return record?.data?.slides?.map((slide) => slide.id) ?? [];
}

/** Gives each slide a unique, readable marker via its speaker notes. */
async function labelSlide(page: import('@playwright/test').Page, index: number, text: string) {
  await slideCards(page).nth(index).click();
  await expect(slideCards(page).nth(index)).toHaveClass(/slide-card--active/);
  await page.locator('.notes-textarea').fill(text);
  await expect(page.locator('.notes-textarea')).toHaveValue(text);
}

async function storedNotes(page: import('@playwright/test').Page, id: string) {
  const record = await readStoredDocument<Deck>(page, id);
  return record?.data?.slides?.map((slide) => slide.notes ?? '') ?? [];
}

test.describe('Slide deck structure', () => {
  test('slides are added, and the deck order is what gets persisted', async ({ page }) => {
    const id = makeId('slides-order');
    await openSlides(page, id);

    await ribbon(page).getByRole('button', { name: 'New slide' }).click();
    await ribbon(page).getByRole('button', { name: 'New slide' }).click();
    await expect(slideCards(page)).toHaveCount(3);

    await labelSlide(page, 0, 'first');
    await labelSlide(page, 1, 'second');
    await labelSlide(page, 2, 'third');

    await expectStored(
      page,
      id,
      (record) => JSON.stringify((record?.data as Deck)?.slides?.map((slide) => slide.notes)) === JSON.stringify(['first', 'second', 'third']),
      'the three labelled slides were never persisted in order',
    );
  });

  test('the arrow controls reorder slides and the new order survives a reload', async ({ page }) => {
    const id = makeId('slides-reorder-arrows');
    await openSlides(page, id);

    await ribbon(page).getByRole('button', { name: 'New slide' }).click();
    await ribbon(page).getByRole('button', { name: 'New slide' }).click();
    await expect(slideCards(page)).toHaveCount(3);

    await labelSlide(page, 0, 'alpha');
    await labelSlide(page, 1, 'beta');
    await labelSlide(page, 2, 'gamma');
    await expectStored(page, id, (record) => (record?.data as Deck)?.slides?.length === 3);

    const before = await storedSlideIds(page, id);

    // Move the last slide up one position: alpha, beta, gamma -> alpha, gamma, beta.
    await page.getByRole('button', { name: 'Move slide 3 up' }).click();

    await expectStored(
      page,
      id,
      (record) => JSON.stringify((record?.data as Deck)?.slides?.map((slide) => slide.notes)) === JSON.stringify(['alpha', 'gamma', 'beta']),
      'moving a slide up did not reorder the stored deck',
    );
    expect(await storedSlideIds(page, id)).toEqual([before[0], before[2], before[1]]);

    await reloadEditor(page, 'powerpoint');
    expect(await storedNotes(page, id)).toEqual(['alpha', 'gamma', 'beta']);
    await expect(slideCards(page)).toHaveCount(3);
  });

  test('Alt+ArrowDown on a focused slide card reorders it without a mouse', async ({ page }) => {
    const id = makeId('slides-reorder-keyboard');
    await openSlides(page, id);

    await ribbon(page).getByRole('button', { name: 'New slide' }).click();
    await expect(slideCards(page)).toHaveCount(2);
    await labelSlide(page, 0, 'top');
    await labelSlide(page, 1, 'bottom');
    await expectStored(page, id, (record) => (record?.data as Deck)?.slides?.length === 2);

    await slideCards(page).first().focus();
    await page.keyboard.press('Alt+ArrowDown');

    await expectStored(
      page,
      id,
      (record) => JSON.stringify((record?.data as Deck)?.slides?.map((slide) => slide.notes)) === JSON.stringify(['bottom', 'top']),
      'Alt+ArrowDown did not move the focused slide down',
    );
  });

  test('dragging the grip handle reorders slides', async ({ page }) => {
    const id = makeId('slides-reorder-drag');
    await openSlides(page, id);

    await ribbon(page).getByRole('button', { name: 'New slide' }).click();
    await expect(slideCards(page)).toHaveCount(2);
    await labelSlide(page, 0, 'one');
    await labelSlide(page, 1, 'two');
    await expectStored(page, id, (record) => (record?.data as Deck)?.slides?.length === 2);

    const handle = page.getByTestId('slide-drag-handle-0');
    const source = (await handle.boundingBox())!;
    const target = (await slideCards(page).nth(1).boundingBox())!;

    // A pointer-events drag, which is what the reorder handler listens for.
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + target.height * 0.75, { steps: 12 });
    await page.mouse.up();

    await expectStored(
      page,
      id,
      (record) => JSON.stringify((record?.data as Deck)?.slides?.map((slide) => slide.notes)) === JSON.stringify(['two', 'one']),
      'dragging the grip handle did not reorder the deck',
    );
  });

  test('deleting a slide is confirmed first and removes exactly one slide', async ({ page }) => {
    const id = makeId('slides-delete');
    await openSlides(page, id);

    await ribbon(page).getByRole('button', { name: 'New slide' }).click();
    await ribbon(page).getByRole('button', { name: 'New slide' }).click();
    await labelSlide(page, 0, 'keep-a');
    await labelSlide(page, 1, 'delete-me');
    await labelSlide(page, 2, 'keep-b');
    await expectStored(page, id, (record) => (record?.data as Deck)?.slides?.length === 3);

    await page.getByRole('button', { name: 'Delete slide 2' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete slide?' });
    await expect(dialog).toBeVisible();

    // Cancelling must not delete anything.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(slideCards(page)).toHaveCount(3);

    await page.getByRole('button', { name: 'Delete slide 2' }).click();
    await page.getByRole('dialog', { name: 'Delete slide?' }).getByRole('button', { name: 'Delete slide', exact: true }).click();
    await expect(slideCards(page)).toHaveCount(2);

    await expectStored(
      page,
      id,
      (record) => JSON.stringify((record?.data as Deck)?.slides?.map((slide) => slide.notes)) === JSON.stringify(['keep-a', 'keep-b']),
      'deleting the middle slide did not persist the remaining two',
    );
  });

  test('the last slide cannot be deleted', async ({ page }) => {
    await openSlides(page, makeId('slides-last'));
    await expect(slideCards(page)).toHaveCount(1);

    await page.getByRole('button', { name: 'Delete slide 1' }).click();
    await page.getByRole('dialog', { name: 'Delete slide?' }).getByRole('button', { name: 'Delete slide', exact: true }).click();

    await expect(banner(page)).toContainText('needs at least one slide');
    await expect(slideCards(page)).toHaveCount(1);
  });

  test('duplicating a slide copies its content into a new, independent slide', async ({ page }) => {
    const id = makeId('slides-duplicate');
    await openSlides(page, id);

    await ribbon(page).getByRole('button', { name: 'Add rectangle' }).click();
    await page.locator('.notes-textarea').fill('original notes');
    await expectStored(page, id, (record) => (record?.data as Deck)?.slides?.[0]?.notes === 'original notes');

    await ribbon(page).getByRole('button', { name: 'Duplicate slide' }).click();
    await expect(slideCards(page)).toHaveCount(2);

    await expectStored(
      page,
      id,
      (record) => {
        const slides = (record?.data as Deck)?.slides ?? [];
        return slides.length === 2 && slides[0].notes === 'original notes' && slides[1].notes === 'original notes';
      },
      'the duplicate did not carry the notes over',
    );

    const ids = await storedSlideIds(page, id);
    expect(ids[0], 'the duplicate must not share the source slide id').not.toBe(ids[1]);

    // Editing the copy must not change the original.
    await labelSlide(page, 1, 'copy notes');
    await expectStored(
      page,
      id,
      (record) => {
        const slides = (record?.data as Deck)?.slides ?? [];
        return slides[0].notes === 'original notes' && slides[1].notes === 'copy notes';
      },
      'editing the duplicate changed the original slide',
    );
  });
});

test.describe('Slide canvas and presentation', () => {
  test('an image dropped onto the canvas is added to the slide and persisted', async ({ page }) => {
    const id = makeId('slides-drop');
    await openSlides(page, id);

    const before = (await readStoredDocument<Deck>(page, id))?.data?.slides?.[0]?.data?.objects?.length ?? 0;
    await dropImageOn(page, '.canvas-shell');
    await expect(banner(page)).toContainText('Image inserted.');

    await expectStored(
      page,
      id,
      (record) => ((record?.data as Deck)?.slides?.[0]?.data?.objects?.length ?? 0) > before,
      'the dropped image was never added to the stored slide',
    );
  });

  test('presenter view opens, steps through slides with the keyboard, and closes', async ({ page }) => {
    await openSlides(page, makeId('slides-presenter'));

    await ribbon(page).getByRole('button', { name: 'Duplicate slide' }).click();
    await expect(slideCards(page)).toHaveCount(2);
    await slideCards(page).first().click();

    await ribbon(page).getByRole('button', { name: 'Presenter view' }).click();
    const exit = page.getByRole('button', { name: 'Exit presenter view' });
    await expect(exit).toBeVisible();
    await expect(page.locator('.presenter-clock')).toBeVisible();
    await expect(page.locator('.panel-list')).toContainText('Current slide: 1 / 2');

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.panel-list')).toContainText('Current slide: 2 / 2');
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.locator('.panel-list')).toContainText('Current slide: 1 / 2');

    await exit.click();
    await expect(exit).toBeHidden();
  });

  test('full-screen presentation advances and exits with the keyboard', async ({ page }) => {
    await openSlides(page, makeId('slides-present'));

    await ribbon(page).getByRole('button', { name: 'Duplicate slide' }).click();
    await expect(slideCards(page)).toHaveCount(2);
    await slideCards(page).first().click();

    await ribbon(page).getByRole('button', { name: 'Start presentation' }).click();
    const counter = page.getByTestId('present-counter');
    await expect(counter).toHaveText('1 / 2');

    await page.keyboard.press('ArrowRight');
    await expect(counter).toHaveText('2 / 2');
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toHaveText('1 / 2');

    await page.keyboard.press('Escape');
    await expect(counter).toHaveCount(0);
  });

  test('exporting a deck produces a PPTX, and importing one asks before replacing it', async ({ page }) => {
    const id = makeId('slides-io');
    await openSlides(page, id);
    await ribbon(page).getByRole('button', { name: 'Add rectangle' }).click();
    await page.locator('.notes-textarea').fill('deck that should be replaced');
    await expectStored(page, id, (record) => (record?.data as Deck)?.slides?.[0]?.notes === 'deck that should be replaced');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export PPTX' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import PPTX' }).click(),
    ]);
    await chooser.setFiles(fixture('test.pptx'));

    const dialog = page.getByRole('dialog', { name: 'Replace this presentation?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.notes-textarea')).toHaveValue('deck that should be replaced');

    const [secondChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Import PPTX' }).click(),
    ]);
    await secondChooser.setFiles(fixture('test.pptx'));
    await page
      .getByRole('dialog', { name: 'Replace this presentation?' })
      .getByRole('button', { name: 'Import presentation' })
      .click();

    await expect(banner(page)).toContainText('Presentation imported.');
    await expectStored(
      page,
      id,
      (record) => (record?.data as Deck)?.slides?.[0]?.notes !== 'deck that should be replaced',
      'the import did not replace the existing deck',
    );
  });
});
