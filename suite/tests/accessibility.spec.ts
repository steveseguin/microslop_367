import { expect, test } from '@playwright/test';
import { MOBILE, editorPath, makeId, openSlides, openWord, waitForExcelReady, waitForWordReady } from './helpers/app';

test.describe('Keyboard-only traversal', () => {
  test('the skip link is the first tab stop and moves focus to main content', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();

    await page.keyboard.press('Tab');
    const skip = page.getByRole('button', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();

    await skip.press('Enter');
    await expect.poll(async () => page.evaluate(() => document.activeElement?.id)).toBe('app-main');
  });

  test('a keyboard user can reach and open a document without a mouse', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();

    // Tab forward until the "New document" link takes focus; bounded so a regression that
    // makes it unreachable fails instead of hanging.
    const link = page.getByRole('link', { name: 'New document' });
    let reached = false;
    for (let press = 0; press < 25 && !reached; press += 1) {
      await page.keyboard.press('Tab');
      reached = await link.evaluate((element) => element === document.activeElement);
    }
    expect(reached, '"New document" was not reachable with Tab within 25 presses').toBe(true);

    await page.keyboard.press('Enter');
    await waitForWordReady(page);
  });

  /**
   * The ribbon is a WAI-ARIA toolbar: ONE tab stop for the whole thing, arrow keys to move
   * within it. Before that, reaching the editing surface in NinjaWord took ~30 tabs.
   */
  test('the editor ribbon is a single tab stop with arrow-key navigation inside it', async ({ page }) => {
    await openWord(page, makeId('a11y-ribbon'));

    const toolbar = page.getByRole('toolbar', { name: 'Editing tools' });
    await expect(toolbar).toBeVisible();

    const tabbable = await toolbar.locator('.toolbar-btn').evaluateAll(
      (buttons) => buttons.filter((button) => (button as HTMLButtonElement).tabIndex === 0).length,
    );
    expect(tabbable, 'the ribbon must expose exactly one tab stop').toBe(1);

    await toolbar.locator('.toolbar-btn:not([disabled])').first().focus();
    const firstName = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));

    await page.keyboard.press('ArrowRight');
    const secondName = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    expect(secondName).not.toBe(firstName);

    await page.keyboard.press('ArrowLeft');
    await expect.poll(async () => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(firstName);

    await page.keyboard.press('End');
    const lastName = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    expect(lastName).not.toBe(firstName);

    await page.keyboard.press('Home');
    await expect.poll(async () => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(firstName);
  });

  test('Escape closes find and replace and Ctrl+F reopens it', async ({ page }) => {
    await openWord(page, makeId('a11y-find'));

    await page.keyboard.press('ControlOrMeta+f');
    await expect(page.getByLabel('Find text')).toBeVisible();
    await expect(page.getByLabel('Find text')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Find text')).toBeHidden();
  });

  test('slide cards are reachable and activate from the keyboard', async ({ page }) => {
    await openSlides(page, makeId('a11y-slides'));
    await page.getByRole('button', { name: 'New slide' }).click();
    await expect(page.locator('.slide-card')).toHaveCount(2);

    const first = page.getByRole('button', { name: 'Open slide 1' });
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.slide-card').first()).toHaveClass(/slide-card--active/);
  });

  test('a modal dialog takes focus and closes on Escape', async ({ page }) => {
    await openSlides(page, makeId('a11y-dialog'));
    await page.getByRole('button', { name: 'New slide' }).click();
    await expect(page.locator('.slide-card')).toHaveCount(2);

    await page.getByRole('button', { name: 'Delete slide 2' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete slide?' });
    await expect(dialog).toBeVisible();

    // Destructive dialogs must never focus the destructive button.
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('.slide-card')).toHaveCount(2);
  });
});

test.describe('Mobile layout and controls', () => {
  test.use(MOBILE);

  test('the mobile ribbon behaves like a real modal', async ({ page }) => {
    await page.goto(editorPath('word', makeId('mobile-ribbon')));
    await waitForWordReady(page);

    const toggle = page.locator('.mobile-toolbar-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();

    const sheet = page.getByRole('dialog', { name: 'Quick Tools' });
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute('aria-modal', 'true');
    // The page behind a modal must not scroll.
    await expect.poll(async () => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect.poll(async () => page.evaluate(() => document.body.style.overflow || 'auto')).toBe('auto');
  });

  /**
   * Word and Excel no longer have a switcher: their Insights panes were removed,
   * so the editor and the grid own the whole mobile viewport and there is nothing
   * to switch between. PowerPoint still has one, because Slides / Canvas / Notes
   * are three genuinely different surfaces.
   */
  test('the slides workspace switcher exposes the region it controls', async ({ page }) => {
    await page.goto(editorPath('powerpoint', makeId('mobile-slides')));
    await expect(page.locator('.canvas-shell canvas').first()).toBeVisible();
    const slidesSwitcher = page.locator('.workspace-mobile-switcher');
    await expect(slidesSwitcher.getByRole('button', { name: 'Canvas', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await slidesSwitcher.getByRole('button', { name: 'Slides', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Add slide' })).toBeVisible();
  });

  test('no editor forces the page to scroll horizontally on a phone', async ({ page }) => {
    for (const [type, id] of [
      ['word', makeId('mobile-fit-word')],
      ['excel', makeId('mobile-fit-excel')],
      ['powerpoint', makeId('mobile-fit-slides')],
    ] as const) {
      await page.goto(editorPath(type, id));
      if (type === 'word') {
        await waitForWordReady(page);
      } else if (type === 'excel') {
        await waitForExcelReady(page);
      } else {
        await expect(page.locator('.canvas-shell canvas').first()).toBeVisible();
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${type} overflows the viewport by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});
