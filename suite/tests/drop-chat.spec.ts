import { expect, test } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { createHash, randomBytes } from 'crypto';
import fs from 'fs';

/*
 * NinjaDrop and NinjaChat. The peer-to-peer parts use the public VDO.Ninja
 * signaling server, so they only run when asked:
 *   RUN_P2P=1 npx playwright test tests/drop-chat.spec.ts
 */

const p2p = () => test.skip(!process.env.RUN_P2P, 'set RUN_P2P=1 to test against the public VDO.Ninja server');

async function fresh(browser: Browser) {
  const ctx = await browser.newContext({ acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  return ctx.newPage();
}

test('the workspace lists every app, grouped', async ({ page }) => {
  await page.goto('/');
  const apps = page.getByRole('navigation', { name: 'Apps' });
  for (const group of ['Create', 'Tools', 'Connect']) await expect(apps.getByRole('heading', { name: group })).toBeVisible();
  await expect(apps.getByRole('link')).toHaveCount(13);
  await apps.getByRole('link', { name: /NinjaDrop/ }).click();
  await expect(page).toHaveURL(/#\/drop\?share=[a-z]+-[a-z]+-[a-z]+-[a-z]+$/);
});

test('drop: a bare link gets a four-word name and a matching share link', async ({ page }) => {
  await page.goto('/#/drop');
  await expect(page).toHaveURL(/share=/);
  const name = new URL(page.url().replace('#/', '')).searchParams.get('share')!;
  await expect(page.getByLabel('Share name')).toHaveValue(name);
  await page.getByRole('button', { name: 'New random name' }).click();
  await expect(page).not.toHaveURL(new RegExp(`share=${name}$`));
});

test('drop: a large file arrives byte for byte over parallel channels', async ({ browser }, info) => {
  p2p();
  test.setTimeout(120_000);
  const path = info.outputPath('payload.bin');
  fs.writeFileSync(path, randomBytes(12 * 1024 * 1024 + 12345));
  const sender = await fresh(browser);
  await sender.goto('/#/drop');
  await expect(sender.getByText('Ready to share')).toBeVisible({ timeout: 30_000 });
  await sender.locator('input[type=file]').setInputFiles(path);
  const receiver = await fresh(browser);
  await receiver.goto(sender.url().replace('share=', 'view='));
  await expect(receiver.getByText('Connected to the sender')).toBeVisible({ timeout: 30_000 });
  await expect(receiver.getByText('payload.bin')).toBeVisible();
  const download = receiver.waitForEvent('download', { timeout: 90_000 });
  await receiver.getByRole('button', { name: 'Download', exact: true }).click();
  const got = fs.readFileSync((await (await download).path())!);
  const hash = (b: Buffer) => createHash('sha256').update(b).digest('hex');
  expect(hash(got)).toBe(hash(fs.readFileSync(path)));
  await expect(sender.locator('.drop-file__detail')).toContainText('sent 1 time');
});

test('drop: a stored document is shared and opens in NinjaWord on the other side', async ({ browser }) => {
  p2p();
  test.setTimeout(120_000);
  const sender = await fresh(browser);
  await sender.goto('/#/word');
  await sender.locator('.ProseMirror').click();
  await sender.keyboard.type('Shared through NinjaDrop.');
  await expect(sender.getByText('Saved', { exact: true })).toBeVisible({ timeout: 15_000 });
  await sender.goto('/#/drop');
  await expect(sender.getByText('Ready to share')).toBeVisible({ timeout: 30_000 });
  await sender.getByRole('button', { name: /From my NinjaOffice files/ }).click();
  await sender.locator('.drop-library__list input[type=checkbox]').first().check();
  await sender.getByRole('button', { name: /^Share 1 file/ }).click();
  await expect(sender.locator('.drop-file__name')).toContainText('.word.ninja.json');
  const receiver = await fresh(browser);
  await receiver.goto(sender.url().replace('share=', 'view='));
  await expect(receiver.getByText('Connected to the sender')).toBeVisible({ timeout: 30_000 });
  await receiver.getByRole('button', { name: 'Download', exact: true }).click();
  await receiver.getByRole('button', { name: /Open in NinjaWord/ }).click();
  await expect(receiver).toHaveURL(/#\/word\?id=/);
  await expect(receiver.locator('.ProseMirror')).toContainText('Shared through NinjaDrop.');
});

async function joinChat(page: Page, nick: string, space?: string) {
  await page.goto(space ? `/#/chat?space=${space}` : '/#/chat');
  await page.getByPlaceholder('How others see you').fill(nick);
  await page.getByRole('button', { name: space ? 'Join space' : 'Create space' }).click();
  await expect(page.locator('.chat-side__status')).toContainText('online', { timeout: 30_000 });
  return new URL(page.url().replace('#/', '')).searchParams.get('space')!;
}
const say = async (page: Page, ch: string, text: string) => {
  const box = page.getByRole('textbox', { name: `Message #${ch}` });
  await box.fill(text);
  await box.press('Enter');
};

test('chat: channels, mentions and history for late joiners', async ({ browser }) => {
  p2p();
  test.setTimeout(150_000);
  const ada = await fresh(browser);
  const space = await joinChat(ada, 'Ada');
  await say(ada, 'general', 'Hello from Ada');

  const bob = await fresh(browser);
  await joinChat(bob, 'Bob', space);
  await expect(bob.getByText('Hello from Ada')).toBeVisible({ timeout: 30_000 });
  await say(bob, 'general', 'hi @Ada');
  await expect(ada.locator('.chat-msg--mention')).toContainText('hi @Ada', { timeout: 15_000 });

  await ada.getByRole('button', { name: 'Browse or create channels' }).click();
  await ada.locator('#chat-new-channel').fill('Design Review');
  await ada.getByRole('button', { name: 'Create', exact: true }).click();
  await say(ada, 'design-review', 'first design note');
  await bob.getByRole('button', { name: 'Browse all channels' }).click();
  await bob.locator('.chat-browser li', { hasText: 'design-review' }).getByRole('button', { name: 'Join' }).click({ timeout: 15_000 });
  await expect(bob.getByText('first design note')).toBeVisible({ timeout: 15_000 });
  await bob.getByRole('textbox', { name: 'Message #design-review' }).pressSequentially('typing');
  await expect(ada.locator('.chat-typing')).toContainText('Bob is typing', { timeout: 10_000 });

  // Ada leaves; a newcomer still gets everything from Bob.
  await ada.close();
  const cy = await fresh(browser);
  await joinChat(cy, 'Cy', space);
  await expect(cy.getByText('hi @Ada')).toBeVisible({ timeout: 30_000 });
  await cy.getByRole('button', { name: 'Browse all channels' }).click();
  await cy.locator('.chat-browser li', { hasText: 'design-review' }).getByRole('button', { name: 'Join' }).click({ timeout: 15_000 });
  await expect(cy.getByText('first design note')).toBeVisible({ timeout: 15_000 });
});
