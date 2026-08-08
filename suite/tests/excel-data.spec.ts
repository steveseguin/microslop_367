import { expect, test } from '@playwright/test';
import {
  banner,
  buildStoredDocument,
  expectStored,
  makeId,
  openDashboard,
  openExcel,
  reloadEditor,
  ribbon,
  seedDocuments,
} from './helpers/app';
import {
  activeCellLabel,
  commitFormulaBar,
  dragSelectFromA1,
  formulaInput,
  makeSheet,
  selectCell,
  selectionStats,
  setCell,
  storedCellNumber,
  storedCellValue,
  storedSheets,
} from './helpers/excel';
import type { WorkbookSheet } from './helpers/excel';

/**
 * Spreadsheet behaviour that changes DATA. The starter workbook is:
 *
 *        A          B         C
 *   1    Team       Target    Actual
 *   2    Sales      42        38
 *   3    Support    31        35
 *   4    Ops        24        29
 */

async function seedWorkbook(page: import('@playwright/test').Page, id: string, sheets: WorkbookSheet[], title = 'Seeded') {
  // The app must have opened the database at least once before it can be written to.
  await openDashboard(page);
  await seedDocuments(page, [buildStoredDocument(id, 'excel', title, sheets)]);
  await openExcel(page, id);
}

test.describe('Excel data operations', () => {
  test('undo reverts a cell edit and redo restores it', async ({ page }) => {
    const id = makeId('excel-undo');
    await openExcel(page, id);

    await setCell(page, 1, 1, '999');
    await expectStored(
      page,
      id,
      (record) => storedCellNumber(record?.data as never, 'Quarterly Plan', 1, 1) === 999,
      'the edit that undo is supposed to revert never landed',
    );

    await ribbon(page).getByRole('button', { name: 'Undo' }).click();
    await expectStored(
      page,
      id,
      (record) => storedCellNumber(record?.data as never, 'Quarterly Plan', 1, 1) === 42,
      'undo did not restore B2 to its original value of 42',
    );

    await ribbon(page).getByRole('button', { name: 'Redo' }).click();
    await expectStored(
      page,
      id,
      (record) => storedCellNumber(record?.data as never, 'Quarterly Plan', 1, 1) === 999,
      'redo did not re-apply the edit',
    );
  });

  test('sorting A to Z reorders whole rows, not just the sorted column', async ({ page }) => {
    const id = makeId('excel-sort');
    await openExcel(page, id);

    await selectCell(page, 0, 0);
    await ribbon(page).getByRole('button', { name: 'Sort A to Z' }).click();
    await expect(banner(page)).toContainText('Sorted');

    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 0, 0) === 'Ops',
      'sorting A to Z did not move "Ops" to the first row',
    );

    const sheets = await storedSheets(page, id);
    // Whole rows must travel together: Ops keeps 24/29, Team keeps its header cells.
    expect(storedCellValue(sheets, 'Quarterly Plan', 0, 0)).toBe('Ops');
    expect(storedCellValue(sheets, 'Quarterly Plan', 0, 1)).toBe(24);
    expect(storedCellValue(sheets, 'Quarterly Plan', 0, 2)).toBe(29);
    expect(storedCellValue(sheets, 'Quarterly Plan', 1, 0)).toBe('Sales');
    expect(storedCellValue(sheets, 'Quarterly Plan', 1, 1)).toBe(42);
    expect(storedCellValue(sheets, 'Quarterly Plan', 3, 0)).toBe('Team');
  });

  test('sorting Z to A produces the reverse order', async ({ page }) => {
    const id = makeId('excel-sort-desc');
    await openExcel(page, id);

    await selectCell(page, 0, 0);
    await ribbon(page).getByRole('button', { name: 'Sort Z to A' }).click();
    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 0, 0) === 'Team',
      'sorting Z to A did not move "Team" to the first row',
    );
    const sheets = await storedSheets(page, id);
    expect(
      [0, 1, 2, 3].map((row) => storedCellValue(sheets, 'Quarterly Plan', row, 0)),
    ).toEqual(['Team', 'Support', 'Sales', 'Ops']);
  });

  test('freezing the top row is persisted with the sheet and survives a reload', async ({ page }) => {
    const id = makeId('excel-freeze');
    await openExcel(page, id);

    // Freeze alone marks the workbook dirty; add an edit so there is content to compare.
    await setCell(page, 5, 0, 'freeze marker');
    await ribbon(page).getByRole('button', { name: 'Freeze top row' }).click();
    await expect(banner(page)).toContainText('Top row frozen.');

    await expectStored(
      page,
      id,
      (record) => frozenType(record?.data as WorkbookSheet[] | undefined) === 'rangeRow',
      'the frozen-row descriptor was never written to the stored sheet',
    );

    await reloadEditor(page, 'excel');
    const sheets = await storedSheets(page, id);
    expect(frozenType(sheets ?? undefined)).toBe('rangeRow');
    expect(storedCellValue(sheets, 'Quarterly Plan', 5, 0)).toBe('freeze marker');
  });

  test('unfreezing releases the panes again', async ({ page }) => {
    const id = makeId('excel-unfreeze');
    await openExcel(page, id);

    await setCell(page, 5, 0, 'marker');
    await ribbon(page).getByRole('button', { name: 'Freeze top row' }).click();
    await expect(banner(page)).toContainText('Top row frozen.');
    await ribbon(page).getByRole('button', { name: 'Unfreeze panes' }).click();
    await expect(banner(page)).toContainText('Panes unfrozen.');

    // fortune-sheet has no public "unfreeze": the app releases the panes by writing an
    // unrecognised freeze type, which leaves the descriptor in place with no `type` key.
    await expectStored(
      page,
      id,
      (record) => frozenType(record?.data as WorkbookSheet[] | undefined) === undefined,
      'unfreeze did not clear the frozen row descriptor',
    );
  });

  test('a cross-sheet formula resolves against the other sheet and recalculates', async ({ page }) => {
    const id = makeId('excel-cross-sheet');
    await seedWorkbook(page, id, [
      makeSheet('Summary', [['Label', 'Value']], { status: 1 }),
      makeSheet('Inputs', [[10], [20], [30]], { status: 0 }),
    ]);

    await expect(page.locator('.status-sheet-count')).toContainText('2 sheets');
    await expect(page.locator('.status-sheet')).toContainText('Summary');

    await setCell(page, 1, 1, '=SUM(Inputs!A1:A3)');
    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Summary', 1, 1) === 60,
      'the cross-sheet SUM never evaluated to 60',
    );

    await reloadEditor(page, 'excel');
    await selectCell(page, 1, 1);
    await expect(formulaInput(page)).toHaveValue('=SUM(Inputs!A1:A3)');
  });

  test('the selection summary computes filled/numeric counts, sum and average for the dragged range', async ({ page }) => {
    const id = makeId('excel-selection-math');
    await openExcel(page, id);

    const label = await dragSelectFromA1(page, 3, 2);
    const stats = await selectionStats(page);

    // The oracle is the starter data, not this file's idea of the grid geometry: whatever
    // range the drag produced, the reported statistics must match it exactly.
    const expected = expectedStatsFor(label);
    expect(stats.filled, `filled count for ${label}`).toBe(expected.filled);
    expect(stats.numbers, `numeric count for ${label}`).toBe(expected.numbers);
    expect(stats.sum, `sum for ${label}`).toBeCloseTo(expected.sum, 2);
    expect(stats.average, `average for ${label}`).toBeCloseTo(expected.average, 2);
  });

  test('charting a sheet larger than the chart limit truncates instead of hanging', async ({ page }) => {
    const id = makeId('excel-big-chart');
    const rows: Array<Array<string | number>> = [];
    for (let index = 0; index < 620; index += 1) {
      rows.push([`Row ${index + 1}`, index + 1]);
    }
    await seedWorkbook(page, id, [makeSheet('Big', rows, { status: 1 })], 'Big Sheet');

    await selectCell(page, 0, 0);
    await ribbon(page).getByRole('button', { name: 'Chart selection' }).click();

    await expect(banner(page)).toContainText('Chart shows the first 500 rows.');
    await expect(page.getByRole('dialog', { name: 'Selection chart' })).toBeVisible();
    await expect(page.locator('.chart-card canvas')).toBeVisible();

    await page.getByRole('button', { name: 'Close selection chart' }).click();
    await expect(page.locator('.chart-card')).toHaveCount(0);
  });

  test('charting with nothing chartable explains itself instead of opening an empty chart', async ({ page }) => {
    const id = makeId('excel-empty-chart');
    await seedWorkbook(page, id, [makeSheet('Text only', [['alpha', 'beta'], ['gamma', 'delta']], { status: 1 })]);

    await selectCell(page, 0, 0);
    await ribbon(page).getByRole('button', { name: 'Chart selection' }).click();
    await expect(banner(page)).toContainText('Select data before charting.');
    await expect(page.locator('.chart-card')).toHaveCount(0);
  });

  test('find and replace all rewrites every matching cell', async ({ page }) => {
    const id = makeId('excel-replace');
    await seedWorkbook(page, id, [
      makeSheet(
        'Teams',
        [
          ['Sales', 'Sales EMEA'],
          ['Support', 'Sales APAC'],
          ['Ops', 'Ops EMEA'],
        ],
        { status: 1 },
      ),
    ]);

    await ribbon(page).getByRole('button', { name: 'Find and replace (Ctrl+F)' }).click();
    await page.getByRole('search', { name: 'Find and replace' }).getByLabel('Find text').fill('Sales');
    await page.getByRole('search', { name: 'Find and replace' }).getByLabel('Replace with').fill('Revenue');
    await page.getByRole('button', { name: 'Replace all' }).click();

    await expect(page.getByRole('search', { name: 'Find and replace' })).toContainText('Replaced 3 cells.');
    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Teams', 0, 0) === 'Revenue',
      'replace all did not rewrite A1',
    );

    const sheets = await storedSheets(page, id);
    expect(storedCellValue(sheets, 'Teams', 0, 1)).toBe('Revenue EMEA');
    expect(storedCellValue(sheets, 'Teams', 1, 1)).toBe('Revenue APAC');
    // Untouched cells must stay untouched.
    expect(storedCellValue(sheets, 'Teams', 1, 0)).toBe('Support');
    expect(storedCellValue(sheets, 'Teams', 2, 1)).toBe('Ops EMEA');
  });

  test('a new sheet is added, becomes addressable, and is persisted', async ({ page }) => {
    const id = makeId('excel-add-sheet');
    await openExcel(page, id);

    await ribbon(page).getByRole('button', { name: 'Add sheet' }).click();
    await expect(page.locator('.status-sheet-count')).toContainText('2 sheets');

    await commitFormulaBar(page, 'on the new sheet');
    await expect(activeCellLabel(page)).toHaveText(/^[A-Z]+\d+$/);

    await expectStored(
      page,
      id,
      (record) => (record?.data as WorkbookSheet[] | undefined)?.length === 2,
      'the second sheet was never persisted',
    );
  });

  test('a value typed into the formula bar lands in the selected cell, not in A1', async ({ page }) => {
    const id = makeId('excel-formula-target');
    await openExcel(page, id);

    await setCell(page, 2, 2, 'target check');
    await expectStored(
      page,
      id,
      (record) => storedCellValue(record?.data as never, 'Quarterly Plan', 2, 2) === 'target check',
      'the formula-bar value did not land in C3',
    );

    const sheets = await storedSheets(page, id);
    // A1 must be untouched: writing to A1 regardless of selection was a real data-loss bug.
    expect(storedCellValue(sheets, 'Quarterly Plan', 0, 0)).toBe('Team');
  });
});

function frozenType(sheets: WorkbookSheet[] | undefined) {
  return (sheets?.[0]?.frozen as { type?: string } | undefined)?.type;
}

/** Independent computation of the selection statistics for the starter workbook. */
function expectedStatsFor(rangeLabel: string) {
  const grid: Array<Array<string | number | null>> = [
    ['Team', 'Target', 'Actual'],
    ['Sales', 42, 38],
    ['Support', 31, 35],
    ['Ops', 24, 29],
  ];

  const [start, end = start] = rangeLabel.split(':');
  const parse = (ref: string) => {
    const match = /^([A-Z]+)(\d+)$/.exec(ref)!;
    let column = 0;
    for (const character of match[1]) {
      column = column * 26 + (character.charCodeAt(0) - 64);
    }
    return { row: Number(match[2]) - 1, column: column - 1 };
  };

  const from = parse(start);
  const to = parse(end);
  let filled = 0;
  let numbers = 0;
  let sum = 0;

  for (let row = from.row; row <= to.row; row += 1) {
    for (let column = from.column; column <= to.column; column += 1) {
      const value = grid[row]?.[column];
      if (value === undefined || value === null || value === '') {
        continue;
      }
      filled += 1;
      if (typeof value === 'number') {
        numbers += 1;
        sum += value;
      }
    }
  }

  return { filled, numbers, sum, average: numbers > 0 ? sum / numbers : 0 };
}
