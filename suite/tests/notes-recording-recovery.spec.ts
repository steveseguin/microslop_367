import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const failure of ['quota', 'conflict'] as const)
  test(`dictation can be stopped after a ${failure} storage failure`, async ({ page }) => {
    await page.addInitScript(() => {
      class FakeRecognition {
        processLocally = false;
        onresult?: (event: unknown) => void;
        onend?: () => void;
        stopped = false;
        static async available() { return 'available'; }
        start() {
          (window as unknown as { testSpeech: FakeRecognition }).testSpeech = this;
        }
        stop() {
          this.stopped = true;
          this.onend?.();
        }
        abort() { this.stop(); }
      }
      Object.defineProperty(window, 'SpeechRecognition', { value: FakeRecognition });
    });
    await page.goto('/#/notes');
    await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'New note', exact: true }).click();
    await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Start dictation', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Stop dictation', exact: true })).toBeVisible();
    await page.evaluate(async (failure) => {
      if (failure === 'quota') {
        const put = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (...args) {
          if (this.name === 'workspaces') {
            throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
          }
          return put.apply(this, args);
        };
      } else {
        // Emulate a competing tab saving the same workspace after dictation began.
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open('officeninja-tools', 1);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('workspaces', 'readwrite');
            const records = tx.objectStore('workspaces');
            const get = records.get('notes');
            get.onsuccess = () => records.put({ ...get.result, revision: get.result.revision + 1 }, 'notes');
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
          };
        });
      }
      (window as unknown as { testSpeech: { onresult: (value: unknown) => void } })
        .testSpeech.onresult({
          resultIndex: 0,
          results: [{ isFinal: true, 0: { transcript: 'Keep this local transcript.' } }],
        });
    }, failure);
    await expect(page.getByRole('alert')).toContainText(
      failure === 'quota' ? 'Saving failed' : 'changed in another tab',
    );
    const stop = page.getByRole('button', { name: 'Stop dictation', exact: true });
    await expect(stop).toBeEnabled();
    await stop.click();
    await expect(page.getByRole('button', { name: 'Start dictation', exact: true })).toBeDisabled();
    expect(await page.evaluate(() =>
      (window as unknown as { testSpeech: { stopped: boolean } }).testSpeech.stopped,
    )).toBe(true);
    await expect(page.getByLabel('Note text')).toHaveValue(/Keep this local transcript\./);
    const backup = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Backup all notes' }).click();
    expect(await readFile((await (await backup).path())!, 'utf8')).toContain(
      'Keep this local transcript.',
    );
  });
