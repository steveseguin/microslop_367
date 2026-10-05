import { expect, test } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { ribbon, waitForExcelReady, waitForSlidesReady } from './helpers/app';
import { formulaInput, selectCell, setCell } from './helpers/excel';

/*
 * Live sharing uses the public VDO.Ninja signaling server, so the end-to-end
 * tests only run when asked:
 *   RUN_P2P=1 npx playwright test tests/live.spec.ts
 */

async function guest(browser: Browser) {
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  return ctx.newPage();
}

async function copied(page: Page, button: RegExp) {
  await page.getByRole('button', { name: button }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()), { timeout: 30_000 }).toContain('live=');
  const link = await page.evaluate(() => navigator.clipboard.readText());
  await page.evaluate(() => navigator.clipboard.writeText(''));
  return link;
}

test('word: share button opens the share panel', async ({ page }) => {
  await page.goto('/#/word');
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Share live' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Copy edit link/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Copy view-only link/ })).toBeVisible();
});

test('word: a malformed live link opens a normal document', async ({ page }) => {
  await page.goto('/#/word?live=nonsense');
  await expect(page.locator('.ProseMirror')).toBeVisible();
  await expect(page.locator('.live-banner')).toHaveCount(0);
});

test('word: edit and view guests co-edit live', async ({ browser }) => {
  test.skip(!process.env.RUN_P2P, 'set RUN_P2P=1 to test against the public VDO.Ninja server');
  test.setTimeout(120_000);
  const host = await guest(browser);
  await host.goto('/#/word');
  const pm = host.locator('.ProseMirror');
  await pm.click();
  await host.keyboard.type('Hello from host.');
  await host.getByRole('button', { name: 'Share', exact: true }).click();
  const editLink = await copied(host, /Copy edit link/);
  const viewLink = await copied(host, /Copy view-only link/);
  expect(viewLink.split('~')).toHaveLength(2);
  expect(editLink.split('~')).toHaveLength(3);

  const ed = await guest(browser);
  const vw = await guest(browser);
  await ed.goto(editLink);
  await vw.goto(viewLink);
  await expect(ed.locator('.ProseMirror')).toContainText('Hello from host.', { timeout: 60_000 });
  await expect(vw.locator('.ProseMirror')).toContainText('Hello from host.', { timeout: 60_000 });
  await expect(vw.locator('.live-banner')).toContainText('Viewing live');
  await expect(vw.locator('.ProseMirror')).toHaveAttribute('contenteditable', 'false');

  await ed.locator('.ProseMirror').click();
  await ed.keyboard.press('Control+End');
  await ed.keyboard.type(' Guest typed.');
  await expect(pm).toContainText('Guest typed.', { timeout: 20_000 });
  await expect(vw.locator('.ProseMirror')).toContainText('Guest typed.', { timeout: 20_000 });

  // Stopping keeps everything that was written together.
  await host.getByRole('button', { name: 'Stop sharing' }).click();
  await pm.click();
  await host.keyboard.press('Control+End');
  await host.keyboard.type(' After.');
  await expect(pm).toContainText('Hello from host. Guest typed. After.');
});

test('calc: edit and view guests share a workbook live', async ({ browser }) => {
  test.skip(!process.env.RUN_P2P, 'set RUN_P2P=1 to test against the public VDO.Ninja server');
  test.setTimeout(150_000);
  const host = await guest(browser);
  await host.goto('/#/excel');
  await waitForExcelReady(host);
  await setCell(host, 0, 0, 'HostA1');
  await host.getByRole('button', { name: 'Share', exact: true }).click();
  const editLink = await copied(host, /Copy edit link/);
  const viewLink = await copied(host, /Copy view-only link/);

  const ed = await guest(browser);
  const vw = await guest(browser);
  await ed.goto(editLink);
  await vw.goto(viewLink);
  for (const p of [ed, vw]) {
    await expect(p.locator('.live-banner')).toContainText('changes appear for everyone', { timeout: 60_000 });
    await waitForExcelReady(p);
  }
  const cellText = async (p: Page, r: number, c: number) => {
    await selectCell(p, r, c);
    return formulaInput(p).inputValue();
  };
  expect(await cellText(ed, 0, 0)).toBe('HostA1');
  expect(await cellText(vw, 0, 0)).toBe('HostA1');

  await setCell(ed, 1, 1, 'FromGuest');
  await expect.poll(() => cellText(host, 1, 1), { timeout: 20_000 }).toBe('FromGuest');
  await expect.poll(() => cellText(vw, 1, 1), { timeout: 20_000 }).toBe('FromGuest');
});

test('slides: guests see and edit the deck live', async ({ browser }) => {
  test.skip(!process.env.RUN_P2P, 'set RUN_P2P=1 to test against the public VDO.Ninja server');
  test.setTimeout(150_000);
  const host = await guest(browser);
  await host.goto('/#/powerpoint');
  await waitForSlidesReady(host);
  await ribbon(host).getByRole('button', { name: 'New slide' }).click();
  await expect(host.locator('.slide-card')).toHaveCount(2);
  await host.locator('.notes-textarea').fill('Second slide from host');
  await host.getByRole('button', { name: 'Share', exact: true }).click();
  const editLink = await copied(host, /Copy edit link/);
  const viewLink = await copied(host, /Copy view-only link/);

  const ed = await guest(browser);
  const vw = await guest(browser);
  await ed.goto(editLink);
  await vw.goto(viewLink);
  for (const p of [ed, vw]) {
    await expect(p.locator('.live-banner')).toContainText('changes appear for everyone', { timeout: 60_000 });
    await expect(p.locator('.slide-card')).toHaveCount(2);
  }
  await vw.locator('.slide-card').nth(1).click();
  await expect(vw.locator('.notes-textarea')).toHaveValue('Second slide from host');
  await expect(vw.locator('.live-readonly-cover')).toHaveCount(1);
  await expect(ed.locator('.live-readonly-cover')).toHaveCount(0);

  // The editing guest adds a slide and writes notes; everyone gets both.
  await ribbon(ed).getByRole('button', { name: 'New slide' }).click();
  await expect(ed.locator('.slide-card')).toHaveCount(3);
  await ed.locator('.notes-textarea').fill('Third slide from guest');
  await expect(host.locator('.slide-card')).toHaveCount(3, { timeout: 20_000 });
  await expect(vw.locator('.slide-card')).toHaveCount(3, { timeout: 20_000 });
  const added = await ed.locator('.slide-card').evaluateAll((cards) =>
    cards.findIndex((card) => card.classList.contains('slide-card--active')),
  );
  await host.locator('.slide-card').nth(added).click();
  await expect(host.locator('.notes-textarea')).toHaveValue('Third slide from guest', { timeout: 20_000 });
});

test('notes: two people type in one note at once', async ({ browser }) => {
  test.skip(!process.env.RUN_P2P, 'set RUN_P2P=1 to test against the public VDO.Ninja server');
  test.setTimeout(120_000);
  const host = await guest(browser);
  await host.goto('/#/notes');
  await host.getByRole('button', { name: 'New note' }).click();
  await host.getByLabel('Note title').fill('Plan');
  await host.getByLabel('Note text').fill('Line one.');
  await host.getByRole('button', { name: 'Share', exact: true }).click();
  const editLink = await copied(host, /Copy edit link/);
  const viewLink = await copied(host, /Copy view-only link/);

  const ed = await guest(browser);
  const vw = await guest(browser);
  await ed.goto(editLink);
  await vw.goto(viewLink);
  await expect(ed.getByLabel('Note text')).toHaveValue('Line one.', { timeout: 60_000 });
  await expect(vw.getByLabel('Note text')).toHaveValue('Line one.', { timeout: 60_000 });
  await expect(ed.getByLabel('Note title')).toHaveValue('Plan');
  await expect(vw.getByLabel('Note text')).toHaveAttribute('readonly', '');

  // Both type at the same time, at different ends of the note.
  const hostBody = host.getByLabel('Note text');
  const edBody = ed.getByLabel('Note text');
  await hostBody.click();
  await host.keyboard.press('Control+End');
  await edBody.click();
  await ed.keyboard.press('Control+Home');
  await Promise.all([host.keyboard.type(' Host end.', { delay: 30 }), ed.keyboard.type('Guest start. ', { delay: 30 })]);
  const merged = 'Guest start. Line one. Host end.';
  for (const p of [host, ed, vw]) await expect(p.getByLabel('Note text')).toHaveValue(merged, { timeout: 20_000 });
});

test('svg: a guest draws in the same file live', async ({ browser }) => {
  test.skip(!process.env.RUN_P2P, 'set RUN_P2P=1 to test against the public VDO.Ninja server');
  test.setTimeout(120_000);
  const host = await guest(browser);
  await host.goto('/#/svg');
  await host.getByRole('tab', { name: /Code/ }).click();
  const hostCode = host.getByLabel('SVG code');
  await hostCode.fill('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect id="a" width="10" height="10"/></svg>');
  await host.getByRole('button', { name: 'Share', exact: true }).click();
  const editLink = await copied(host, /Copy edit link/);
  const viewLink = await copied(host, /Copy view-only link/);

  const ed = await guest(browser);
  const vw = await guest(browser);
  await ed.goto(editLink);
  await vw.goto(viewLink);
  await expect(ed.locator('.live-banner')).toContainText('changes appear for everyone', { timeout: 60_000 });
  await expect(vw.locator('.live-banner')).toContainText('changes appear for everyone', { timeout: 60_000 });
  await expect(vw.locator('.svg-host rect#a')).toHaveCount(1);

  await ed.getByRole('tab', { name: /Code/ }).click();
  const edCode = ed.getByLabel('SVG code');
  await expect(edCode).toHaveValue(/rect id="a"/);
  await edCode.click();
  await ed.keyboard.press('Control+End');
  for (let i = 0; i < '</svg>'.length; i++) await ed.keyboard.press('ArrowLeft');
  await ed.keyboard.type('<circle id="b" r="5"/>');
  await expect(host.locator('.svg-host circle#b')).toHaveCount(1, { timeout: 20_000 });
  await expect(vw.locator('.svg-host circle#b')).toHaveCount(1, { timeout: 20_000 });
});
