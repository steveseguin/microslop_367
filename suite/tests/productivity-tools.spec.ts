import { test, expect, type Page } from '@playwright/test';
import {
  PDFArray,
  PDFDocument,
  PDFRawStream,
  StandardFonts,
  decodePDFRawStream,
} from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import { serveStaticBuild } from './helpers/static-build';

test.describe('Productivity offline support', () => {
  test.use({ serviceWorkers: 'allow' });
  let host: Awaited<ReturnType<typeof serveStaticBuild>>;
  test.beforeAll(async () => {
    host = await serveStaticBuild();
  });
  test.afterAll(async () => {
    await host?.close();
  });
  test('all three tools reopen and edit saved work offline', async ({
    page,
    context,
  }) => {
    const offlineErrors: string[] = [];
    page.on('pageerror', (error) => offlineErrors.push(error.message));
    page.on('requestfailed', (request) =>
      offlineErrors.push(`${request.url()}: ${request.failure()?.errorText}`),
    );
    await ready(page, 'notes', host.url);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) =>
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => resolve(),
            { once: true },
          ),
        );
      }
    });
    await page.getByRole('button', { name: 'New note', exact: true }).click();
    await page.getByLabel('Note title').fill('Offline notes');
    await expect(
      page.getByText('Saved locally', { exact: true }),
    ).toBeVisible();
    await ready(page, 'time', host.url);
    await addEntry(page);
    await ready(page, 'pdf', host.url);
    await openSample(page);
    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByText('Ready', { exact: true }),
      offlineErrors.join('\n'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Rotate', exact: true }).click();
    await expect(
      page.getByText('Page rotated.', { exact: true }),
    ).toBeVisible();
    await ready(page, 'time', host.url);
    await expect(page.getByLabel('Select Design work')).toBeVisible();
    await ready(page, 'notes', host.url);
    await expect(page.getByLabel('Note title')).toHaveValue('Offline notes');
    await page
      .getByLabel('Note text')
      .fill('Edited without a network connection.');
    await expect(
      page.getByText('Saved locally', { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Note text')).toHaveValue(
      'Edited without a network connection.',
    );
  });
});

test('failed local writes keep the draft exportable without claiming it saved', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'workspaces')
        throw new DOMException('Test storage quota', 'QuotaExceededError');
      return put.apply(this, args);
    };
  });
  await ready(page, 'notes');
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Saving failed');
  await expect(page.getByText('Not saved', { exact: true })).toBeVisible();
  const backup = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup all notes' }).click();
  const value = JSON.parse(
    await readFile((await (await backup).path())!, 'utf8'),
  );
  expect(value.notes).toHaveLength(1);
});

test('invalid imports leave existing notes and PDF intact', async ({
  page,
}) => {
  await ready(page, 'notes');
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Note title').fill('Keep this note');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"notes":[null]}'),
  });
  await expect(page.getByText(/not a valid NinjaNotes backup/)).toBeVisible();
  await expect(page.getByLabel('Note title')).toHaveValue('Keep this note');
  await ready(page, 'pdf');
  await openSample(page);
  page.once('dialog', (d) => d.accept());
  await page.getByLabel('Open PDF file', { exact: true }).setInputFiles({
    name: 'bad.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not a PDF'),
  });
  await expect(page.getByText(/Could not open this PDF/)).toBeVisible();
  expect((await downloadedPdf(page, 'Download PDF')).getPageCount()).toBe(3);
});

async function ready(page: Page, route: string, base = '') {
  await page.goto(`${base}/#/${route}`);
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
}
async function addEntry(
  page: Page,
  description = 'Design work',
  client = 'Acme',
) {
  await page.getByLabel('Description', { exact: true }).fill(description);
  await page.getByLabel('Client', { exact: true }).fill(client);
  await page.getByLabel('Hourly rate').fill('125');
  await page.getByLabel('Manual hours').fill('2');
  await page.getByRole('button', { name: 'Add manual entry' }).click();
  await expect(
    page.getByText('Time entry saved.', { exact: true }),
  ).toBeVisible();
}
async function samplePdf(form = false) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 3; i++) {
    const page = pdf.addPage([500, 650]);
    page.drawText(`OfficeNinja test page ${i + 1}`, {
      x: 40,
      y: 600,
      size: 22,
      font,
    });
    page.drawText('Original text must remain readable.', {
      x: 40,
      y: 560,
      size: 13,
      font,
    });
    if (form && i === 0) {
      const field = pdf.getForm().createTextField('Customer name');
      field.addToPage(page, { x: 40, y: 450, width: 240, height: 28 });
      const checkbox = pdf.getForm().createCheckBox('Approved');
      checkbox.addToPage(page, { x: 40, y: 400, width: 18, height: 18 });
    }
  }
  return Buffer.from(await pdf.save());
}
async function openSample(page: Page, form = false) {
  await page.getByLabel('Open PDF file', { exact: true }).setInputFiles({
    name: form ? 'form.pdf' : 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf(form),
  });
  await expect(page.locator('.tool-pdf-page')).toHaveAttribute(
    'data-render-version',
    /^[1-9]\d*$/,
  );
  await expect(page.getByText('Ready', { exact: true })).toBeVisible();
}
async function downloadedPdf(page: Page, button: string) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  const path = await (await download).path();
  return PDFDocument.load(await readFile(path!));
}

test('time entries become accurate invoices, remain linked, and survive reload', async ({
  page,
}, info) => {
  await ready(page, 'time');
  await addEntry(page);
  await page.getByLabel('Select Design work').check();
  await page.getByRole('button', { name: 'Create invoice (1)' }).click();
  await page
    .getByLabel('From', { exact: true })
    .fill('Studio Ninja\nToronto, Ontario');
  await page.getByLabel('Client address').fill('100 Main Street');
  await page.getByLabel('Tax %').fill('13');
  await page.getByLabel('Discount (USD)').fill('10');
  await expect(page.locator('.tool-content .invoice-total')).toContainText(
    '$271.20',
  );
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.tool-print .invoice-paper')).toBeVisible();
  await expect(page.locator('.tool-header')).toBeHidden();
  await page.screenshot({
    path: info.outputPath('invoice-print.png'),
    fullPage: true,
  });
  await page.pdf({
    path: info.outputPath('invoice.pdf'),
    format: 'A4',
    printBackground: true,
  });
  await page.emulateMedia({ media: 'screen' });
  await expect(page.locator('.tool-content .invoice-paper')).toContainText(
    '02:00:00',
  );
  await page.setViewportSize({ width: 390, height: 960 });
  await page.locator('.tool-content .invoice-paper').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('invoice-mobile.png') });
  expect(
    await page
      .locator('.tool-app')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.getByRole('button', { name: 'Mark paid', exact: true }).click();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: /Invoices/ }).click();
  await expect(page.getByRole('button', { name: 'Mark unpaid' })).toBeVisible();
  await page.getByRole('tab', { name: 'Time entries' }).click();
  await expect(page.getByLabel('Select Design work')).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Edit Design work' }),
  ).toBeDisabled();
});

test('timer survives reload and manual deletes can be undone', async ({
  page,
}) => {
  await ready(page, 'time');
  await page.clock.install();
  await page.getByLabel('Description', { exact: true }).fill('Timed work');
  await page.getByLabel('Client', { exact: true }).fill('Acme');
  await page.getByRole('button', { name: 'Start timer' }).click();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.clock.fastForward(61000);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible();
  await expect(page.getByLabel('Elapsed time')).toHaveText(/00:01:/);
  await page.getByRole('button', { name: 'Stop timer' }).click();
  await expect(
    page.getByRole('cell', { name: 'Unbilled', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete Timed work' }).click();
  await page.getByRole('button', { name: 'Undo delete' }).click();
  await expect(page.getByLabel('Select Timed work')).toBeVisible();
});

test('time rejects mixed-client invoicing and exports safe CSV plus restorable backups', async ({
  page,
}) => {
  await ready(page, 'time');
  await addEntry(page, '=danger', 'Client A');
  await addEntry(page, 'Other work', 'Client B');
  await page.getByLabel('Select =danger').check();
  await page.getByLabel('Select Other work').check();
  await page.getByRole('button', { name: 'Create invoice (2)' }).click();
  await expect(
    page.getByText('Select entries for one client per invoice.'),
  ).toBeVisible();
  const csv = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect(await readFile((await (await csv).path())!, 'utf8')).toContain(
    "'=danger",
  );
  const backup = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup', exact: true }).click();
  const path = await (await backup).path();
  await page.getByRole('button', { name: 'Delete Other work' }).click();
  page.once('dialog', (d) => d.accept());
  await page.locator('input[type=file]').setInputFiles(path!);
  await expect(
    page.getByText('Backup restored.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Select Other work')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo delete' })).toHaveCount(
    0,
  );
});

test('notes capture, group, search, pin, export, import and undo deletion', async ({
  page,
}) => {
  await ready(page, 'notes');
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Note title').fill('Project kickoff');
  await page
    .getByLabel('Note text')
    .fill('Discuss the design brief and next steps.');
  await page.getByLabel('Tags', { exact: true }).fill('meeting, follow-up');
  await expect(
    page.getByRole('heading', { name: 'Today', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Pin note', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Pinned', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Note text')).toHaveValue(
    'Discuss the design brief and next steps.',
  );
  await page.getByLabel('Search notes').fill('follow-up');
  await expect(page.locator('.tool-note-item')).toHaveCount(1);
  const md = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Markdown' }).click();
  expect(await readFile((await (await md).path())!, 'utf8')).toContain(
    '# Project kickoff',
  );
  const backup = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup all notes' }).click();
  const path = await (await backup).path();
  await page.getByRole('button', { name: 'Delete note', exact: true }).click();
  await page.getByRole('button', { name: 'Undo delete' }).click();
  await expect(page.getByLabel('Note title')).toHaveValue('Project kickoff');
  await page.locator('input[type=file]').setInputFiles(path!);
  await expect(page.locator('.tool-note-item')).toHaveCount(2);
});

test('notes never overwrite a newer workspace in another tab', async ({
  page,
  context,
}) => {
  await ready(page, 'notes');
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Note title').fill('Initial title');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  const second = await context.newPage();
  await ready(second, 'notes');
  await second.getByLabel('Note title').fill('Saved in other tab');
  await expect(
    second.getByText('Saved locally', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Note title').fill('Conflicting draft');
  await expect(page.getByRole('alert')).toContainText('changed in another tab');
  await second.reload();
  await expect(second.getByLabel('Note title')).toHaveValue(
    'Saved in other tab',
  );
  const backup = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup all notes' }).click();
  expect(await readFile((await (await backup).path())!, 'utf8')).toContain(
    'Conflicting draft',
  );
});

test('dictation appends final timestamped transcripts and requires explicit online consent', async ({
  page,
}) => {
  await page.addInitScript(() => {
    class FakeRecognition {
      processLocally = false;
      onresult?: (event: unknown) => void;
      onend?: () => void;
      static async available() {
        return 'available';
      }
      start() {
        (window as unknown as { testSpeech: FakeRecognition }).testSpeech =
          this;
      }
      stop() {
        this.onend?.();
      }
      abort() {
        this.onend?.();
      }
    }
    Object.defineProperty(window, 'SpeechRecognition', {
      value: FakeRecognition,
    });
  });
  await ready(page, 'notes');
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Note text').fill('Meeting notes');
  await page.getByRole('button', { name: 'Start dictation' }).click();
  await expect(
    page.getByRole('button', { name: 'Stop dictation' }),
  ).toBeVisible();
  await page.evaluate(() => {
    (
      window as unknown as { testSpeech: { onresult: (v: unknown) => void } }
    ).testSpeech.onresult({
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: 'The launch is next Tuesday.' } },
      ],
    });
  });
  await expect(page.getByLabel('Note text')).toHaveValue(
    /Meeting notes\n\n\[.+\] The launch is next Tuesday\./,
  );
  await page.getByRole('button', { name: 'Stop dictation' }).click();
  await page.getByLabel('Speech processing').selectOption('online');
  page.once('dialog', (dialog) => {
    expect(dialog.message()).toContain('may send microphone audio');
    void dialog.dismiss();
  });
  await page.getByRole('button', { name: 'Start dictation' }).click();
  await expect(
    page.getByRole('button', { name: 'Start dictation' }),
  ).toBeVisible();
});

test('existing PDF text is replaced in place, not covered', async ({
  page,
}) => {
  await ready(page, 'pdf');
  await openSample(page);
  // Edit text is the default tool, and every line is a click target.
  await page
    .getByRole('button', {
      name: 'Edit text: Original text must remain readable.',
    })
    .click();
  const field = page.getByLabel('Edit text', { exact: true });
  await expect(field).toHaveValue('Original text must remain readable.');
  await field.fill('Edited text replaced the original.');
  await field.press('Enter');
  await expect(
    page.getByText('Text updated. Download the PDF to keep a file copy.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Edit text: Edited text replaced the original.',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Edit text: OfficeNinja test page 1',
    }),
  ).toBeVisible();
  const edited = await downloadedPdf(page, 'Download PDF');
  const contents = edited.getPage(0).node.Contents();
  const streams =
    contents instanceof PDFArray
      ? contents.asArray().map((ref) => edited.context.lookup(ref))
      : [contents];
  const ops = streams
    .map((stream) =>
      stream instanceof PDFRawStream
        ? new TextDecoder('latin1').decode(decodePDFRawStream(stream).decode())
        : '',
    )
    .join(' ')
    .toUpperCase();
  const hex = (text: string) =>
    Buffer.from(text, 'latin1').toString('hex').toUpperCase();
  // The old words are gone from the page's content, not hidden under a box.
  expect(ops).toContain(hex('Edited text replaced'));
  expect(ops).not.toContain(hex('Original text must'));
  // Esc cancels without changing anything.
  await page
    .getByRole('button', { name: 'Edit text: OfficeNinja test page 1' })
    .click();
  await page.getByLabel('Edit text', { exact: true }).fill('Discard me');
  await page.getByLabel('Edit text', { exact: true }).press('Escape');
  await expect(
    page.getByRole('button', { name: 'Edit text: OfficeNinja test page 1' }),
  ).toBeVisible();
});

test('PDF edits render, rotate, reorder, extract, merge and reload', async ({
  page,
}) => {
  await ready(page, 'pdf');
  await openSample(page);
  await page.getByRole('button', { name: 'Rotate', exact: true }).click();
  await expect(page.getByText('Page rotated.', { exact: true })).toBeVisible();
  const rotated = await downloadedPdf(page, 'Download PDF');
  expect(rotated.getPage(0).getRotation().angle).toBe(90);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('Ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await page
    .getByLabel('PDF annotation surface')
    .click({ position: { x: 80, y: 170 } });
  await page.getByLabel('New text', { exact: true }).fill('Approved for launch');
  await page.getByLabel('New text', { exact: true }).press('Enter');
  await expect(
    page.getByText('Text added. Download the PDF to keep a file copy.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Edit text: Approved for launch' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit text', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Edit text: Approved for launch' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Pages only', exact: true }).click();
  await page.getByLabel('Extract pages', { exact: true }).fill('1, 3');
  expect(
    (await downloadedPdf(page, 'Download selected pages')).getPageCount(),
  ).toBe(2);
  await page.getByRole('button', { name: 'Move later' }).click();
  await expect(page.getByLabel('Current page')).toHaveValue('1');
  await page.getByRole('button', { name: 'Delete page', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Page 2 of 2' }),
  ).toBeVisible();
  await page.getByLabel('Merge PDF file', { exact: true }).setInputFiles({
    name: 'more.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf(),
  });
  await expect(
    page.getByRole('heading', { name: 'Page 2 of 5' }),
  ).toBeVisible();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Page 1 of 5' }),
  ).toBeVisible();
});

test('PDF form exports retain values and editable canonical fields', async ({
  page,
}) => {
  await ready(page, 'pdf');
  await openSample(page, true);
  await page.getByLabel('Customer name', { exact: true }).fill('Alex Example');
  await page.getByLabel('Approved', { exact: true }).check();
  await expect(
    page.getByRole('button', { name: 'Download PDF', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Apply form values' }).click();
  await expect(
    page.getByText('Form values saved. Fields remain editable.'),
  ).toBeVisible();
  const doc = await downloadedPdf(page, 'Download PDF');
  expect(doc.getForm().getTextField('Customer name').getText()).toBe(
    'Alex Example',
  );
  expect(doc.getForm().getCheckBox('Approved').isChecked()).toBe(true);
  expect(
    doc.getForm().getTextField('Customer name').acroField.getWidgets(),
  ).toHaveLength(1);
  await page.getByRole('button', { name: 'Delete page', exact: true }).click();
  await expect(page.getByText(/operation requires static pages/)).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page
    .getByRole('button', { name: 'Flatten forms', exact: true })
    .click();
  await expect(
    page.getByText('Forms flattened. Fields are now static content.'),
  ).toBeVisible();
  const flat = await downloadedPdf(page, 'Download PDF');
  expect(flat.getForm().getFields()).toHaveLength(0);
});

for (const width of [1440, 390])
  for (const theme of ['light', 'dark']) {
    test(`productivity visual review ${width}px ${theme}`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 960 });
      await page.addInitScript(
        (t) => localStorage.setItem('officeninja_theme', t),
        theme,
      );
      await ready(page, 'time');
      await addEntry(page);
      await page.screenshot({
        path: info.outputPath(`time-${width}-${theme}.png`),
        fullPage: true,
      });
      if (width < 600) {
        await page.locator('.tool-table').scrollIntoViewIfNeeded();
        await page.screenshot({
          path: info.outputPath(`time-entries-${width}-${theme}.png`),
        });
      }
      await page.getByLabel('Switch app').selectOption('NinjaNotes');
      await expect(
        page.getByText('Saved locally', { exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'New note', exact: true }).click();
      await page.getByLabel('Note title').fill('A new direction');
      await page
        .getByLabel('Note text')
        .fill(
          'A quieter workspace, with everything we need close at hand.\n\nNext steps\n• Review the first designs\n• Capture feedback from the team\n• Prepare the client presentation',
        );
      await expect(
        page.getByText('Saved locally', { exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`notes-${width}-${theme}.png`),
        fullPage: true,
      });
      await page.locator('.tool-dictation').scrollIntoViewIfNeeded();
      await page.screenshot({
        path: info.outputPath(`notes-voice-${width}-${theme}.png`),
      });
      await page.getByLabel('Switch app').selectOption('NinjaPDF');
      await expect(
        page.getByText('Saved locally', { exact: true }),
      ).toBeVisible();
      await openSample(page, true);
      await page.screenshot({
        path: info.outputPath(`pdf-${width}-${theme}.png`),
        fullPage: true,
      });
      await page
        .getByRole('button', {
          name: 'Edit text: Original text must remain readable.',
        })
        .click();
      await page
        .getByLabel('Edit text', { exact: true })
        .fill('Original text, now edited in place.');
      await page.screenshot({
        path: info.outputPath(`pdf-editing-${width}-${theme}.png`),
      });
      await page.getByLabel('Edit text', { exact: true }).press('Escape');
      if (width < 600) {
        await page
          .getByLabel('PDF page 1', { exact: true })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: info.outputPath(`pdf-page-${width}-${theme}.png`),
        });
      }
      await page.getByRole('link', { name: 'Workspace', exact: true }).click();
      await expect(
        page.getByRole('navigation', { name: 'Apps' }),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`dashboard-${width}-${theme}.png`),
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    });
  }
