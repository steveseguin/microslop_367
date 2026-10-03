import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  banner,
  buildStoredDocument,
  editorPath,
  expectStored,
  makeId,
  openDashboard,
  openWord,
  readStoredDocument,
  seedDocuments,
  statusPill,
  waitForExcelReady,
  waitForSlidesReady,
  waitForWordReady,
} from './helpers/app';
import { setCell, storedCellValue } from './helpers/excel';

/**
 * OVERWRITE INTENT.
 *
 * `db.ts` used to infer "replace whatever is stored" from the ABSENCE of a value: a save
 * carrying no `knownRevision` was treated as a fast-forward, and a stored record whose
 * `lastSavedBy` matched this client was exempt from the conflict check outright. Both
 * inferences are indistinguishable from a caller that has simply FAILED TO READ the
 * document — and a client id lives in sessionStorage, so it survives a reload and is
 * copied into a duplicated tab.
 *
 * The contract now: overwriting is DECLARED (`overwriteExisting: true`) from an explicit
 * user action, never inferred. Everything in this file either proves that a write which
 * did not declare it is refused, or proves that the two places entitled to declare it
 * still work. Each test names the mutation that turns it red.
 */

/* ------------------------------------------------------------------ */
/* The original attack                                                 */
/* ------------------------------------------------------------------ */

/**
 * Sets up the attack, at document start, before a line of app code runs.
 *
 * Armed by `sessionStorage.__failGetFor = <document id>`. While armed it (a) evicts every
 * witness this browser holds of that document — the revision ledger and the localStorage
 * copy — which is the state left behind by clearing site data or by the 300-entry ledger
 * rolling over, and (b) makes every `IDBObjectStore.get` for that id throw.
 *
 * Doing the eviction here rather than from the test closes the window in which the page
 * being reloaded could write a fresh local copy on its way out.
 *
 * Failing only the READ is the point. Blocking IndexedDB wholesale would be a much weaker
 * test: with no connection at all the save can only write a localStorage copy at revision
 * 1, which can never beat the stored record anyway. Here the store is perfectly writable —
 * only the read that would have revealed the document is missing.
 */
const ATTACK_SETUP = `
  (() => {
    const armed = () => {
      try { return sessionStorage.getItem('__failGetFor'); } catch { return null; }
    };

    const target = armed();
    if (target) {
      try {
        localStorage.removeItem('officeninja_revisions');
        localStorage.removeItem('officeninja_backup:' + target);
      } catch { /* storage blocked */ }
    }

    const realGet = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function (key) {
      const blocked = armed();
      if (blocked && key === blocked) {
        try {
          const seen = Number(sessionStorage.getItem('__failGetCount') || 0);
          sessionStorage.setItem('__failGetCount', String(seen + 1));
        } catch { /* storage blocked */ }
        throw new DOMException('Simulated read failure', 'UnknownError');
      }
      return realGet.call(this, key);
    };
  })();
`;

test.describe('A document that cannot be read is not a document that may be replaced', () => {
  /**
   * THE ATTACK. Ledger evicted (it is capped at 300 entries and dies with site data), no
   * local copy, the load's read fails, so `loadDocument` honestly reports "absent" — it has
   * no witness left to say otherwise. The page seeds a blank document and autosaves.
   *
   * Before the fix this destroyed the document: the save carried `knownRevision: 0` (a
   * fresh page has no revision), the stored record was ahead but its `lastSavedBy` was this
   * same tab's client id from before the reload, and that exempted it from the check. The
   * pill read "Saved".
   *
   * TURNS RED IF: the same-client exemption is widened back to "any record written by this
   * client id", instead of "a revision this page instance actually wrote".
   */
  test('an evicted ledger plus a failed read must not let the first keystroke replace the stored document', async ({ page }) => {
    await page.addInitScript(ATTACK_SETUP);

    const id = makeId('ledger-evicted-attack');
    await openWord(page, id);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Six months of work that must survive a failed read.');
    await page.getByLabel('File name').fill('Irreplaceable');
    await expectStored(
      page,
      id,
      (record) => record?.title === 'Irreplaceable' && JSON.stringify(record.data).includes('Six months of work'),
      'the document under attack was never stored in the first place',
    );
    await expect(statusPill(page)).toHaveText('Saved');

    const before = await readStoredDocument(page, id);
    expect(before, 'nothing to attack').not.toBeNull();

    // Arm the setup script; it evicts the witnesses on the next document start.
    await page.evaluate((docId) => sessionStorage.setItem('__failGetFor', docId), id);

    await page.reload();
    await waitForWordReady(page);

    // The read really did fail, and the page really was told "no such document" — this is
    // the state the whole attack depends on, so it is asserted rather than assumed.
    expect(Number(await page.evaluate(() => sessionStorage.getItem('__failGetCount')))).toBeGreaterThan(0);
    expect(await page.evaluate(() => localStorage.getItem('officeninja_revisions'))).toBeNull();
    await expect(page.locator('.ProseMirror')).not.toContainText('Six months of work');
    await expect(statusPill(page)).toHaveText('Not saved yet');

    // Reads work again from here: the outage was transient, and IndexedDB was never
    // anything but writable. Only the page's knowledge of the document is missing.
    await page.evaluate(() => sessionStorage.removeItem('__failGetFor'));

    // One keystroke. This is the whole attack.
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('ZZKEYSTROKEZZ');

    // Let the 600ms autosave debounce fire and the write attempt run to completion.
    await expect(statusPill(page)).not.toHaveText('Saving...', { timeout: 15_000 });
    await page.waitForTimeout(1_500);

    const after = await readStoredDocument(page, id);
    expect(after?.title, 'the stored title was replaced by the blank document').toBe('Irreplaceable');
    expect(JSON.stringify(after?.data), 'the stored content was replaced by the blank document').toContain(
      'Six months of work',
    );
    expect(JSON.stringify(after?.data)).not.toContain('ZZKEYSTROKEZZ');
    expect(after?.revision, 'something was written over the stored record').toBe(before!.revision);

    // ...and the user is told, rather than shown a green "Saved" over a destroyed file.
    await expect(statusPill(page)).not.toHaveText('Saved');
    await expect(statusPill(page)).toHaveText('Conflict detected');
  });

  /**
   * The same-client exemption exists so a client does not conflict with its OWN in-flight
   * writes. It must not extend to a client id that merely LOOKS like this one. Chrome's
   * "Duplicate tab" copies sessionStorage, so the copy inherits the original's client id
   * and is a genuinely concurrent editor wearing its name.
   *
   * TURNS RED IF: the exemption goes back to comparing `lastSavedBy` alone.
   */
  test('a tab that inherited another tab\'s client id still conflicts instead of silently winning', async ({ context }) => {
    const id = makeId('shared-client-id');
    const original = await context.newPage();
    await original.goto(editorPath('word', id));
    await waitForWordReady(original);

    await original.locator('.ProseMirror').click();
    await original.keyboard.press('ControlOrMeta+a');
    await original.keyboard.press('Backspace');
    await original.keyboard.type('Content from the original tab.');
    await expectStored(original, id, (record) => JSON.stringify(record?.data ?? '').includes('original tab'));

    const clientId = await original.evaluate(() => sessionStorage.getItem('officeninja_client_id'));
    expect(clientId, 'the app did not allocate a client id').toBeTruthy();
    expect((await readStoredDocument(original, id))?.lastSavedBy).toBe(clientId);

    // The duplicate: same origin, same storage, and the same client id copied in before any
    // app code runs — exactly what "Duplicate tab" produces.
    const duplicate = await context.newPage();
    await duplicate.addInitScript((value) => {
      sessionStorage.setItem('officeninja_client_id', value as string);
    }, clientId);
    await duplicate.goto(editorPath('word', id));
    await waitForWordReady(duplicate);
    await expect(duplicate.locator('.ProseMirror')).toContainText('Content from the original tab.');

    // The original moves ahead while the duplicate sits on the revision it loaded.
    await original.locator('.ProseMirror').click();
    await original.keyboard.press('ControlOrMeta+a');
    await original.keyboard.press('Backspace');
    await original.keyboard.type('The original tab is now ahead.');
    await expectStored(original, id, (record) => JSON.stringify(record?.data ?? '').includes('now ahead'));

    await duplicate.locator('.ProseMirror').click();
    await duplicate.keyboard.press('ControlOrMeta+a');
    await duplicate.keyboard.press('Backspace');
    await duplicate.keyboard.type('The duplicate should not win this.');

    await expect(statusPill(duplicate)).toHaveText('Conflict detected');
    const stored = await readStoredDocument(original, id);
    expect(JSON.stringify(stored?.data)).toContain('now ahead');
    expect(JSON.stringify(stored?.data)).not.toContain('should not win');

    // The escape hatch still works for the person sitting in front of the duplicate.
    await duplicate.getByRole('button', { name: 'Overwrite with this version' }).click();
    await expectStored(
      duplicate,
      id,
      (record) => JSON.stringify(record?.data ?? '').includes('should not win'),
      'the explicit overwrite was refused as well, which would leave this tab with no way to save',
    );

    await original.close();
    await duplicate.close();
  });

  /**
   * The narrowed exemption must still do its job: a single page issuing overlapping writes
   * — an autosave in flight, then the synchronous `pagehide` snapshot on top of it — must
   * not be treated as two clients fighting. This is the bug the exemption was added for.
   *
   * TURNS RED IF: the same-client exemption is deleted rather than narrowed.
   */
  test('a page does not conflict with its own in-flight writes across an unload snapshot', async ({ page }) => {
    const id = makeId('self-conflict');
    await openWord(page, id);

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('First pass, saved normally.');
    await expect(statusPill(page)).toHaveText('Saved');

    // Type and reload immediately: the autosave debounce has not fired, so the pagehide
    // snapshot lands while this page's own revision refs are still catching up.
    page.on('dialog', (dialog) => void dialog.accept());
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' Second pass, mid-flight.');
    await page.reload();
    await waitForWordReady(page);

    await expect(editor).toContainText('Second pass, mid-flight.');
    await expect(statusPill(page)).not.toHaveText('Conflict detected');
  });
});

/* ------------------------------------------------------------------ */
/* The two callers entitled to declare overwrite intent                */
/* ------------------------------------------------------------------ */

/** Drives one tab past another so the second tab is genuinely stale. */
async function makeWordConflict(context: import('@playwright/test').BrowserContext, id: string) {
  const winner = await context.newPage();
  await winner.goto(editorPath('word', id));
  await waitForWordReady(winner);

  await winner.locator('.ProseMirror').click();
  await winner.keyboard.press('ControlOrMeta+a');
  await winner.keyboard.press('Backspace');
  await winner.keyboard.type('Version written by the winning tab.');
  await expectStored(winner, id, (record) => JSON.stringify(record?.data ?? '').includes('winning tab'));

  const loser = await context.newPage();
  await loser.goto(editorPath('word', id));
  await waitForWordReady(loser);

  await winner.locator('.ProseMirror').click();
  await winner.keyboard.press('End');
  await winner.keyboard.type(' Extended by the winning tab.');
  await expectStored(winner, id, (record) => JSON.stringify(record?.data ?? '').includes('Extended by the winning tab'));

  await loser.locator('.ProseMirror').click();
  await loser.keyboard.press('ControlOrMeta+a');
  await loser.keyboard.press('Backspace');
  await loser.keyboard.type('Version written by the stale tab.');
  await expect(statusPill(loser)).toHaveText('Conflict detected');

  return { winner, loser };
}

test.describe('Force save is the declared overwrite, and it still works', () => {
  /**
   * TURNS RED IF: `overwriteExisting: true` is removed from Word's `forceSave`. Force save
   * passes no `knownRevision` (it deliberately does not care what the stored revision is),
   * and without the declared intent db.ts now reads that as "no basis for this write" and
   * refuses — leaving a stale tab permanently unable to save anything at all.
   */
  test('Word: "Overwrite with this version" replaces the newer version from the other tab', async ({ context }) => {
    const id = makeId('word-force');
    const { winner, loser } = await makeWordConflict(context, id);

    // Nothing was written by the conflicting autosave.
    let stored = await readStoredDocument(winner, id);
    expect(JSON.stringify(stored?.data)).not.toContain('stale tab');

    await loser.getByRole('button', { name: 'Overwrite with this version' }).click();

    await expectStored(
      loser,
      id,
      (record) => JSON.stringify(record?.data ?? '').includes('Version written by the stale tab'),
      'Force save did not replace the winner — the stale tab now has no way to save at all',
    );
    stored = await readStoredDocument(loser, id);
    expect(JSON.stringify(stored?.data)).not.toContain('winning tab');
    await expect(statusPill(loser)).toHaveText('Saved');
    await expect(banner(loser)).toContainText('This version is now the saved one.');

    await winner.close();
    await loser.close();
  });

  /**
   * TURNS RED IF: `overwriteExisting: options.force` is removed from Excel's `performSave`
   * (for instance by "restoring" the old `knownRevision: null` override, which no longer
   * means anything except "this caller has no revision to offer").
   */
  test('Excel: the Force save control replaces the newer workbook from the other tab', async ({ context }) => {
    const id = makeId('excel-force');
    const winner = await context.newPage();
    await winner.goto(editorPath('excel', id));
    await waitForExcelReady(winner);

    await setCell(winner, 5, 0, 'winner one');
    await expectStored(winner, id, (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 5, 0) === 'winner one');

    const loser = await context.newPage();
    await loser.goto(editorPath('excel', id));
    await waitForExcelReady(loser);

    await setCell(winner, 6, 0, 'winner two');
    await expectStored(winner, id, (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 6, 0) === 'winner two');

    await setCell(loser, 7, 0, 'loser one');
    await expect(statusPill(loser)).toContainText('Conflict');
    expect(storedCellValue((await readStoredDocument(winner, id))?.data as never, 'Quarterly Plan', 7, 0)).toBeNull();

    await loser.getByRole('button', { name: 'Force save', exact: true }).click();

    await expectStored(
      loser,
      id,
      (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 7, 0) === 'loser one',
      'Force save did not replace the newer workbook — the stale tab is now unable to save at all',
    );
    // The forced write is this tab's whole workbook, so the winner's later cell is gone.
    // That is what "overwrite" means, and the user was told so before clicking.
    expect(storedCellValue((await readStoredDocument(loser, id))?.data as never, 'Quarterly Plan', 6, 0)).toBeNull();

    await winner.close();
    await loser.close();
  });

  /**
   * PowerPoint kept `force` (save even when clean, e.g. Ctrl+S) SEPARATE from `overwrite`.
   * Ctrl+S must not be a silent overwrite: the person pressing it has not been shown the
   * other tab's version. Only the banner action, which has, may replace it.
   *
   * TURNS RED IF: Ctrl+S is wired back to `overwrite: true`, or if `overwriteExisting` is
   * removed from the banner action.
   */
  test('PowerPoint: Ctrl+S from a stale tab conflicts; only the banner action overwrites', async ({ context }) => {
    const id = makeId('slides-force');
    const winner = await context.newPage();
    await winner.goto(editorPath('powerpoint', id));
    await waitForSlidesReady(winner);

    await setSlideNotes(winner, 'winner first');
    await expectStored(winner, id, (record) => deckNotes(record?.data)[0] === 'winner first');

    const loser = await context.newPage();
    await loser.goto(editorPath('powerpoint', id));
    await waitForSlidesReady(loser);
    await expect(loser.locator('.notes-textarea')).toHaveValue('winner first');

    await setSlideNotes(winner, 'winner second');
    await expectStored(winner, id, (record) => deckNotes(record?.data)[0] === 'winner second');

    await setSlideNotes(loser, 'loser first');
    await expect(statusPill(loser)).toHaveText('Conflict detected');

    // Ctrl+S is "save now", not "I win". Nothing may be written.
    await loser.keyboard.press('ControlOrMeta+s');
    await loser.waitForTimeout(1_500);
    expect(
      deckNotes((await readStoredDocument(winner, id))?.data)[0],
      'Ctrl+S silently overwrote another tab without ever showing the user its version',
    ).toBe('winner second');

    // The winner keeps typing while the loser reads the banner, so the revision the loser
    // saw in its conflict is ALREADY stale by the time it decides. Adopting that revision
    // is therefore not enough to make the overwrite land — only declared intent is.
    await setSlideNotes(winner, 'winner third');
    await expectStored(winner, id, (record) => deckNotes(record?.data)[0] === 'winner third');

    await loser.getByRole('button', { name: 'Overwrite with my version' }).first().click();
    await expectStored(
      loser,
      id,
      (record) => deckNotes(record?.data)[0] === 'loser first',
      'the explicit overwrite was refused — the stale deck now has no way to save at all',
    );

    await winner.close();
    await loser.close();
  });
});

/* ------------------------------------------------------------------ */
/* Undo-restore                                                        */
/* ------------------------------------------------------------------ */

test.describe('Dashboard undo-restore is the other declared overwrite', () => {
  /**
   * Undo has only a pre-delete SNAPSHOT to offer, so it can never name a current revision.
   * That is precisely the shape db.ts now refuses by default, which is why the Dashboard
   * has to declare its intent instead.
   *
   * The delete is followed here by a record reappearing at the same id — a delete that
   * never reached IndexedDB, or another tab still saving it. Undo must replace it.
   *
   * TURNS RED IF: `overwriteExisting: true` is removed from `handleUndoDelete`.
   */
  test('Undo restores over a record that survived the delete', async ({ page }) => {
    const id = makeId('undo-overwrite');
    await openWord(page, id);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('The content Undo has to bring back.');
    await page.getByLabel('File name').fill('Undo Overwrite Target');
    await expectStored(
      page,
      id,
      (record) => record?.title === 'Undo Overwrite Target' && JSON.stringify(record.data).includes('bring back'),
    );

    await openDashboard(page);
    await expect(page.getByRole('button', { name: 'Delete Undo Overwrite Target' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete Undo Overwrite Target' }).click();
    await expect(page.getByRole('button', { name: 'Undo deleting Undo Overwrite Target' })).toBeVisible();

    // Something is sitting at that id again by the time Undo is pressed.
    await seedDocuments(page, [
      buildStoredDocument(id, 'word', 'Survivor', { type: 'doc', content: [] }, { revision: 99, lastSavedBy: 'other-tab' }),
    ]);
    expect((await readStoredDocument(page, id))?.title).toBe('Survivor');

    await page.getByRole('button', { name: 'Undo deleting Undo Overwrite Target' }).click();

    await expectStored(
      page,
      id,
      (record) => record?.title === 'Undo Overwrite Target' && JSON.stringify(record.data).includes('bring back'),
      'Undo did not restore over the surviving record',
    );
    expect((await readStoredDocument(page, id))?.revision).toBeGreaterThan(99);
  });

  /** Undo must also outlive a reload of the Dashboard, not just re-render the card. */
  test('an undone delete is still restored after a reload', async ({ page }) => {
    const id = makeId('undo-reload');
    await openWord(page, id);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Restored and then reloaded.');
    await page.getByLabel('File name').fill('Undo Reload Target');
    await expectStored(page, id, (record) => record?.title === 'Undo Reload Target');

    await openDashboard(page);
    await page.getByRole('button', { name: 'Delete Undo Reload Target' }).click();
    await page.getByRole('button', { name: 'Undo deleting Undo Reload Target' }).click();
    await expectStored(
      page,
      id,
      (record) => record?.title === 'Undo Reload Target' && JSON.stringify(record.data).includes('Restored and then reloaded'),
      'Undo did not restore the document',
    );

    await page.reload();
    await expect(page.getByRole('heading', { level: 2, name: 'Your files' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete Undo Reload Target' })).toBeVisible();

    // And the restored document still opens with its content.
    await page.goto(editorPath('word', id));
    await waitForWordReady(page);
    await expect(page.locator('.ProseMirror')).toContainText('Restored and then reloaded.');
  });
});

/* ------------------------------------------------------------------ */
/* The ordinary path is untouched                                      */
/* ------------------------------------------------------------------ */

test.describe('Ordinary saves are unaffected', () => {
  test('Ctrl+S writes immediately, without waiting for the autosave debounce', async ({ page }) => {
    const id = makeId('ctrl-s');
    await openWord(page, id);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Saved by keyboard shortcut.');
    await expectStored(page, id, (record) => JSON.stringify(record?.data ?? '').includes('keyboard shortcut'));

    // A second edit followed immediately by Ctrl+S, which must not conflict with the save
    // this same page just made.
    await page.keyboard.type(' And again.');
    await page.keyboard.press('ControlOrMeta+s');
    await expectStored(
      page,
      id,
      (record) => JSON.stringify(record?.data ?? '').includes('And again.'),
      'Ctrl+S did not persist the edit',
    );
    await expect(statusPill(page)).not.toHaveText('Conflict detected');
  });

  /**
   * The conflict predicate decides every race, so it gets a race.
   *
   * Two tabs typing into the same document with no synchronisation at all. The invariant
   * is not "both saves land" — they cannot, this is last-writer-wins with an explicit
   * conflict — it is that STORAGE AND THE UI NEVER DISAGREE: exactly one tab ends up
   * owning the document and saying "Saved", the other says "Conflict detected" and has
   * written nothing, and NEITHER tab has lost the user's text off the screen.
   */
  test('two tabs racing on one document: one owner, one conflict, nothing silently lost', async ({ context }) => {
    const id = makeId('race');
    const a = await context.newPage();
    const b = await context.newPage();
    await a.goto(editorPath('word', id));
    await waitForWordReady(a);
    await b.goto(editorPath('word', id));
    await waitForWordReady(b);

    await a.locator('.ProseMirror').click();
    await b.locator('.ProseMirror').click();

    // Interleaved, and deliberately never waiting for either tab to settle.
    for (let round = 0; round < 6; round += 1) {
      await Promise.all([a.keyboard.type(`A${round} `), b.keyboard.type(`B${round} `)]);
    }

    await expect
      .poll(
        async () => `${await statusPill(a).innerText()}|${await statusPill(b).innerText()}`,
        {
          message: 'the two tabs never settled into exactly one owner and one conflict',
          timeout: 25_000,
        },
      )
      .toMatch(/^(Saved\|Conflict detected|Conflict detected\|Saved)$/);

    const winnerIsA = (await statusPill(a).innerText()) === 'Saved';
    const stored = JSON.stringify((await readStoredDocument(a, id))?.data);
    expect(stored, 'the tab reporting "Saved" is not the one in storage').toContain(winnerIsA ? 'A5' : 'B5');
    expect(stored, 'the conflicted tab wrote anyway').not.toContain(winnerIsA ? 'B5' : 'A5');

    // The loser lost the race, but the person using it has not lost a keystroke.
    await expect(a.locator('.ProseMirror')).toContainText('A5');
    await expect(b.locator('.ProseMirror')).toContainText('B5');

    await a.close();
    await b.close();
  });

  test('a rename from the Dashboard is an ordinary write and still lands', async ({ page }) => {
    const id = makeId('rename-ordinary');
    await openWord(page, id);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('Content that a rename must not disturb.');
    await page.getByLabel('File name').fill('Before Rename');
    await expectStored(page, id, (record) => record?.title === 'Before Rename');

    await openDashboard(page);
    await page.getByRole('button', { name: 'Rename Before Rename' }).click();
    const field = page.getByLabel('New name for Before Rename');
    await field.fill('After Rename');
    await field.press('Enter');

    await expectStored(
      page,
      id,
      (record) => record?.title === 'After Rename' && JSON.stringify(record.data).includes('must not disturb'),
      'the rename never reached storage, or it dropped the content',
    );
  });
});

/* ------------------------------------------------------------------ */
/* Local helpers                                                       */
/* ------------------------------------------------------------------ */

type Deck = { slides?: Array<{ notes?: string }> };

function deckNotes(data: unknown) {
  return ((data as Deck)?.slides ?? []).map((slide) => slide.notes ?? '');
}

async function setSlideNotes(page: Page, text: string) {
  await page.locator('.slide-card').first().click();
  await page.locator('.notes-textarea').fill(text);
  await expect(page.locator('.notes-textarea')).toHaveValue(text);
}
