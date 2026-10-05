import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/*
 * A real group call over the public VDO.Ninja server with fake cameras, so it
 * only runs when asked:
 *   RUN_P2P=1 npx playwright test tests/meet.spec.ts
 */
test.use({
  permissions: ['camera', 'microphone', 'clipboard-read', 'clipboard-write'],
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  },
});

const onVideo = (page: Page) =>
  page.locator('.meet-stage .meet-tile:not(.meet-tile--me) video').evaluateAll((videos) =>
    (videos as HTMLVideoElement[]).filter((v) => v.videoWidth > 0).length,
  );

test('six people: four on video, the rest audio-only, and slots refill', async ({ browser }) => {
  test.skip(!process.env.RUN_P2P, 'set RUN_P2P=1 to test against the public VDO.Ninja server');
  test.setTimeout(180_000);
  const pages: Page[] = [];
  const join = async (name: string, url: string, button: string) => {
    const ctx = await browser.newContext({ permissions: ['camera', 'microphone', 'clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.getByLabel('Your name', { exact: true }).fill(name);
    await page.getByRole('button', { name: button }).click();
    await expect(page.getByText(`${name} (you)`)).toBeVisible();
    pages.push(page);
    return page;
  };
  const host = await join('Host', '/#/meet', 'Start meeting');
  const invite = host.url();
  for (let i = 1; i < 6; i++) await join(`Guest${i}`, invite, 'Join meeting');

  for (const page of pages) {
    await expect(page.locator('.meet-bar strong')).toContainText('6 people', { timeout: 60_000 });
    await expect.poll(() => onVideo(page), { timeout: 60_000 }).toBe(4);
    await expect(page.locator('.meet-chip')).toHaveCount(1);
  }

  // Bring the audio-only person on screen: someone else moves off.
  const chipName = (await host.locator('.meet-chip__name').innerText()).trim();
  await host.locator('.meet-chip').getByRole('button', { name: 'Show video' }).click();
  await expect(host.locator('.meet-stage figcaption', { hasText: chipName })).toBeVisible({ timeout: 20_000 });
  await expect(host.locator('.meet-chip')).toHaveCount(1);
  await expect.poll(() => onVideo(host), { timeout: 30_000 }).toBe(4);

  // Someone leaves: the audio-only person takes the free slot.
  await pages[1].getByRole('button', { name: 'Leave' }).click();
  for (const page of [host, ...pages.slice(2)]) {
    await expect(page.locator('.meet-bar strong')).toContainText('5 people', { timeout: 30_000 });
    await expect(page.locator('.meet-chip')).toHaveCount(0, { timeout: 30_000 });
    await expect.poll(() => onVideo(page), { timeout: 30_000 }).toBe(4);
  }
});
