import { expect, test } from '@playwright/test';
import type { Browser, Locator, Page } from '@playwright/test';

/*
 * NinjaBoard. The live-sharing test uses the public VDO.Ninja signaling server,
 * so it only runs when asked:
 *   RUN_P2P=1 npx playwright test tests/board.spec.ts
 */

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('officeninja_meet_name', 'Steve'));
});

const column = (page: Page, i: number) => page.locator('.board-col').nth(i);
const titles = (col: Locator) => col.locator('.board-card__title').allInnerTexts();

async function addCards(page: Page, col: number, cards: string[]) {
  await column(page, col).getByRole('button', { name: 'Add a card' }).click();
  for (const t of cards) {
    await page.keyboard.type(t);
    await page.keyboard.press('Enter');
  }
  await page.keyboard.press('Escape');
}

async function drag(page: Page, from: Locator, to: Locator, offsetY = 10) {
  const a = (await from.boundingBox())!;
  const b = (await to.boundingBox())!;
  await page.mouse.move(a.x + 30, a.y + 15);
  await page.mouse.down();
  await page.mouse.move(a.x + 45, a.y + 25, { steps: 3 });
  await page.mouse.move(b.x + 40, b.y + offsetY, { steps: 10 });
  await page.mouse.up();
}

test('board: create, add, drag between and within columns, and it is all saved', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'New board' }).click();
  await expect(page).toHaveURL(/#\/board\?id=board-/);
  await expect(page.locator('.board-col__head h3')).toHaveText(['To do', 'In progress', 'Done']);
  await page.locator('#board-title').fill('Website relaunch');
  await page.locator('#board-title').press('Enter');
  await addCards(page, 0, ['Design the homepage', 'Write launch post', 'Fix login bug']);
  expect(await titles(column(page, 0))).toEqual(['Design the homepage', 'Write launch post', 'Fix login bug']);

  await drag(page, column(page, 0).locator('[data-card]', { hasText: 'Write launch post' }), column(page, 1).locator('.board-col__cards'));
  await expect(column(page, 1).locator('.board-card__title')).toHaveText(['Write launch post']);
  await drag(page, column(page, 0).locator('[data-card]', { hasText: 'Fix login bug' }), column(page, 0).locator('[data-card]', { hasText: 'Design the homepage' }), 4);
  await expect(column(page, 0).locator('.board-card__title')).toHaveText(['Fix login bug', 'Design the homepage']);

  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.locator('#board-title')).toHaveValue('Website relaunch');
  await expect(column(page, 0).locator('.board-card__title')).toHaveText(['Fix login bug', 'Design the homepage']);
  await expect(column(page, 1).locator('.board-card__title')).toHaveText(['Write launch post']);
  await page.getByRole('button', { name: 'All boards' }).click();
  await expect(page.locator('.board-list')).toContainText('Website relaunch');
  await expect(page.locator('.board-list')).toContainText('3 cards');
});

test('board: card details, list view sorting and filters', async ({ page }) => {
  await page.goto('/#/board?new=1');
  await expect(page.locator('.board-col').first()).toBeVisible();
  await addCards(page, 0, ['Write docs', 'Fix login bug']);
  await column(page, 0).getByRole('button', { name: /Fix login bug/ }).click();
  const card = page.getByRole('dialog');
  await card.getByLabel('Assignee', { exact: true }).fill('Ada');
  await card.getByLabel('Priority').selectOption('urgent');
  await card.getByLabel('Due date').fill('2020-01-01');
  await card.getByRole('button', { name: 'Bug', exact: true }).click();
  await card.getByLabel('New checklist item').fill('Reproduce');
  await card.getByLabel('New checklist item').press('Enter');
  await card.getByLabel('New checklist item').fill('Write a test');
  await card.getByLabel('New checklist item').press('Enter');
  await card.locator('.board-checklist input[type=checkbox]').first().check();
  await card.getByLabel('Write a comment').fill('Only on Safari.');
  await card.getByRole('button', { name: 'Comment', exact: true }).click();
  await expect(card.locator('.board-comments')).toContainText('Steve');
  await card.getByLabel('Status').selectOption({ label: 'Done' });
  await page.keyboard.press('Escape');

  const face = column(page, 2).locator('.board-card');
  await expect(face).toContainText('Fix login bug');
  await expect(face).toContainText('Bug');
  await expect(face).toContainText('1/2');
  await expect(face.locator('.board-due--overdue')).toBeVisible();

  await page.getByRole('button', { name: 'List' }).click();
  await expect(page.locator('.board-table tbody tr')).toHaveCount(2);
  await page.locator('.board-table th').getByRole('button', { name: /Priority/ }).click();
  await expect(page.locator('.board-table tbody tr').first()).toContainText('Fix login bug');
  await expect(page.locator('.board-table tbody tr').first()).toContainText(/urgent/i);

  await page.getByRole('button', { name: 'Board', exact: true }).click();
  await page.getByLabel('Filter by assignee').selectOption('Ada');
  await expect(page.locator('.board-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByLabel('Search cards').fill('docs');
  await expect(page.locator('.board-card')).toHaveCount(1);
  await expect(page.locator('.board-card')).toContainText('Write docs');
});

async function guest(browser: Browser, name: string) {
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript((n) => localStorage.setItem('officeninja_meet_name', n), name);
  return ctx.newPage();
}

test('board: shared live, an editor moves cards and a viewer only watches', async ({ browser }) => {
  test.skip(!process.env.RUN_P2P, 'set RUN_P2P=1 to test against the public VDO.Ninja server');
  test.setTimeout(150_000);
  const host = await guest(browser, 'Host');
  await host.goto('/#/board?new=1');
  await expect(host.locator('.board-col').first()).toBeVisible();
  await addCards(host, 0, ['Host card']);
  await host.getByRole('button', { name: 'Share' }).click();
  await host.getByRole('button', { name: /Copy edit link/ }).click();
  await expect(host.locator('.live-panel__status')).toContainText(/Live|people/, { timeout: 30_000 });
  const copy = async (name: RegExp) => {
    await host.getByRole('button', { name }).click();
    await expect.poll(() => host.evaluate(() => navigator.clipboard.readText())).toContain('live=');
    const link = await host.evaluate(() => navigator.clipboard.readText());
    await host.evaluate(() => navigator.clipboard.writeText(''));
    return link;
  };
  const editLink = await copy(/Copy edit link/);
  const viewLink = await copy(/Copy view-only link/);

  const ed = await guest(browser, 'Ed');
  const vw = await guest(browser, 'Vi');
  await ed.goto(editLink);
  await vw.goto(viewLink);
  await expect(ed.locator('.board-card', { hasText: 'Host card' })).toBeVisible({ timeout: 60_000 });
  await expect(vw.locator('.board-card', { hasText: 'Host card' })).toBeVisible({ timeout: 60_000 });
  await expect(vw.getByRole('button', { name: 'Add a card' })).toHaveCount(0);

  await addCards(ed, 1, ['Guest card']);
  await drag(ed, column(ed, 0).locator('[data-card]', { hasText: 'Host card' }), column(ed, 2).locator('.board-col__cards'));
  for (const p of [host, vw]) {
    await expect(column(p, 2).locator('.board-card', { hasText: 'Host card' })).toBeVisible({ timeout: 15_000 });
    await expect(column(p, 1).locator('.board-card', { hasText: 'Guest card' })).toBeVisible({ timeout: 15_000 });
  }

  // Two people change different fields of one card at the same time: both stick.
  await host.getByRole('button', { name: /Guest card/ }).click();
  await ed.getByRole('button', { name: /Guest card/ }).click();
  await Promise.all([host.getByLabel('Priority').selectOption('high'), ed.getByLabel('Due date').fill('2030-05-01')]);
  for (const p of [host, ed]) {
    await expect(p.getByLabel('Priority')).toHaveValue('high', { timeout: 15_000 });
    await expect(p.getByLabel('Due date')).toHaveValue('2030-05-01', { timeout: 15_000 });
  }
});
