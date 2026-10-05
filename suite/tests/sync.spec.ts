import { test, expect, type Browser, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function addNote(page: Page, title: string) {
  await page.goto('/#/notes');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Note title').fill(title);
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.waitForTimeout(400);
}

async function noteTitles(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const open = indexedDB.open('officeninja-tools');
        open.onsuccess = () => {
          const req = open.result.transaction('workspaces').objectStore('workspaces').get('notes');
          req.onsuccess = () =>
            resolve(((req.result?.data?.notes ?? []) as { title: string }[]).map((n) => n.title).sort());
        };
      }),
  );
}

async function downloadBackup(page: Page, password = '') {
  await page.goto('/#/sync');
  if (password) await page.getByLabel(/Password \(optional/).fill(password);
  const done = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  const file = await done;
  expect(file.suggestedFilename()).toMatch(/^officeninja-backup-\d{4}-\d{2}-\d{2}\.json$/);
  return readFile((await file.path())!);
}

test('a backup restores into another browser and merges with what is there', async ({ page, browser }) => {
  await addNote(page, 'Written on the laptop');
  const backup = await downloadBackup(page);
  expect(backup.toString()).toContain('Written on the laptop');

  const other = await (browser as Browser).newPage();
  await addNote(other, 'Written on the phone');
  await other.goto('/#/sync');
  await other.getByLabel('Backup file to restore').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: backup,
  });
  await expect(other.getByText(/Restored backup\.json: .*merged/)).toBeVisible();
  expect(await noteTitles(other)).toEqual(['Written on the laptop', 'Written on the phone']);
  await other.close();
});

test('an encrypted backup needs its password and hides its contents', async ({ page, browser }) => {
  await addNote(page, 'Secret plans');
  const backup = await downloadBackup(page, 'correct horse');
  expect(backup.toString()).not.toContain('Secret plans');
  expect(JSON.parse(backup.toString()).encrypted).toBe(true);

  const other = await (browser as Browser).newPage();
  await other.goto('/#/sync');
  await other.getByLabel('Backup file to restore').setInputFiles({
    name: 'secret.json',
    mimeType: 'application/json',
    buffer: backup,
  });
  await expect(other.getByText(/encrypted\. Enter its password/)).toBeVisible();
  await other.getByLabel('Password for secret.json').fill('wrong');
  await other.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(other.getByText(/Wrong password/)).toBeVisible();
  await other.getByLabel('Password for secret.json').fill('correct horse');
  await other.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(other.getByText(/Restored secret\.json/)).toBeVisible();
  expect(await noteTitles(other)).toEqual(['Secret plans']);
  await other.close();
});

test('NinjaMeet creates a private room with a working invite link', async ({ page }) => {
  await page.goto('/#/meet');
  await page.getByLabel('Your name', { exact: true }).fill('Ada');
  await page.getByRole('button', { name: 'Start meeting' }).click();
  const frame = page.getByTitle('Video meeting');
  await expect(frame).toBeVisible();
  const src = (await frame.getAttribute('src'))!;
  const url = new URL(src);
  expect(url.origin).toBe('https://vdo.ninja');
  expect(url.searchParams.get('room')).toMatch(/^meet_[a-z0-9]{14}$/);
  expect(url.searchParams.get('password')).toMatch(/^[a-z0-9]{16}$/);
  expect(url.searchParams.get('label')).toBe('Ada');
  expect(src).toContain('&screensharebutton');
  expect(await frame.getAttribute('allow')).toContain('display-capture');
  // The page URL is the invite: a second person lands on the join screen for the same room.
  const invite = page.url();
  const guest = await page.context().newPage();
  await guest.goto(invite);
  await expect(guest.getByRole('heading', { name: 'You are invited to a meeting' })).toBeVisible();
  await guest.getByLabel('Your name', { exact: true }).fill('Grace');
  await guest.getByRole('button', { name: 'Join meeting' }).click();
  const guestSrc = new URL((await guest.getByTitle('Video meeting').getAttribute('src'))!);
  expect(guestSrc.searchParams.get('room')).toBe(url.searchParams.get('room'));
  expect(guestSrc.searchParams.get('password')).toBe(url.searchParams.get('password'));
});

// Uses the public VDO.Ninja signaling server, so it only runs when asked:
//   RUN_P2P=1 npx playwright test tests/sync.spec.ts -g "devices"
test('two devices sync notes peer to peer over VDO.Ninja', async ({ browser }) => {
  test.skip(!process.env.RUN_P2P, 'set RUN_P2P=1 to test against the public VDO.Ninja server');
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  await addNote(a, 'From device A');
  await addNote(b, 'From device B');
  await a.goto('/#/sync');
  await a.getByRole('button', { name: 'Set up device sync' }).click();
  await expect(a.getByText(/Online|Syncing/)).toBeVisible({ timeout: 30_000 });
  const link = await a.evaluate(() => {
    const g = JSON.parse(localStorage.getItem('officeninja_sync_group')!);
    return `${location.pathname}#/sync?pair=${encodeURIComponent(`${g.room}~${g.password}`)}`;
  });
  await b.goto(link);
  await b.getByRole('button', { name: 'Join and sync' }).click();
  await expect(b.getByText(/Syncing with 1 device/)).toBeVisible({ timeout: 60_000 });
  await expect.poll(() => noteTitles(b), { timeout: 30_000 }).toEqual(['From device A', 'From device B']);
  await expect.poll(() => noteTitles(a), { timeout: 30_000 }).toEqual(['From device A', 'From device B']);
});
