import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { StoredDocument } from './app';
import { readStoredDocument } from './app';

/**
 * fortune-sheet paints cells to a <canvas>. `innerText` cannot see a single cell value, so
 * everything here reads state back through one of the two honest channels:
 *
 *  - the UI: `.formula-coordinate` (active cell), the formula input, and the
 *    "Selection summary" panel (filled / numeric counts, sum, average);
 *  - IndexedDB: the persisted `celldata`, which is what actually survives a reload and is
 *    therefore the right oracle for data-integrity assertions.
 *
 * Driving the grid is done with the keyboard wherever possible: after one click to anchor
 * the selection on A1, arrow keys move it, and every move is verified against
 * `.formula-coordinate`. That makes navigation independent of column widths and fonts.
 */

/** Column-header height and row-header width mean A1's centre is not at the canvas origin. */
const A1_OFFSET = { x: 80, y: 30 };
/** Measured from the default fortune-sheet grid; only used by `dragSelect`, which verifies. */
const CELL = { width: 73, height: 19 };

export interface WorkbookSheet {
  name: string;
  id?: string;
  status?: number;
  celldata?: Array<{ r: number; c: number; v: { v?: unknown; m?: string; f?: string; ct?: { fa?: string } } }>;
  [key: string]: unknown;
}

export function gridCanvas(page: Page) {
  return page.locator('canvas.fortune-sheet-canvas').first();
}

export function formulaInput(page: Page) {
  return page.getByLabel('Formula input');
}

export function activeCellLabel(page: Page) {
  return page.locator('.formula-coordinate');
}

export function selectionLabel(page: Page) {
  return page.locator('.selection-summary strong').first();
}

/** { filled, numbers, sum, average } as the app currently reports them. */
export async function selectionStats(page: Page) {
  const values = await page.locator('.selection-summary__stats div strong').allTextContents();
  return {
    filled: Number(values[0]),
    numbers: Number(values[1]),
    sum: Number(values[2]),
    average: Number(values[3]),
  };
}

function cellRef(row: number, column: number) {
  let label = '';
  let current = column;
  while (current >= 0) {
    label = String.fromCharCode((current % 26) + 65) + label;
    current = Math.floor(current / 26) - 1;
  }
  return `${label}${row + 1}`;
}

/** Clicks the middle of A1 and asserts the grid agrees, so later arrow moves are anchored. */
export async function anchorOnA1(page: Page) {
  const box = await gridCanvas(page).boundingBox();
  expect(box, 'the spreadsheet canvas has no layout box').not.toBeNull();
  await page.mouse.click(box!.x + A1_OFFSET.x, box!.y + A1_OFFSET.y);
  await expect(activeCellLabel(page)).toHaveText('A1');
  await expect(selectionLabel(page)).toHaveText('A1');
  return box!;
}

/**
 * Moves the active cell to (row, column) using arrow keys, verifying each axis.
 * Geometry-independent: only the initial A1 anchor touches pixel coordinates.
 */
export async function selectCell(page: Page, row: number, column: number) {
  await anchorOnA1(page);

  for (let step = 0; step < column; step += 1) {
    await page.keyboard.press('ArrowRight');
  }
  for (let step = 0; step < row; step += 1) {
    await page.keyboard.press('ArrowDown');
  }

  await expect(activeCellLabel(page)).toHaveText(cellRef(row, column));
}

/**
 * Drags a rectangular selection starting at A1. The resulting range is READ BACK from the
 * UI rather than assumed, so a caller can assert against the range the app actually
 * selected instead of against this file's idea of the grid metrics.
 */
export async function dragSelectFromA1(page: Page, rows: number, columns: number) {
  const box = await anchorOnA1(page);
  const startX = box.x + A1_OFFSET.x;
  const startY = box.y + A1_OFFSET.y;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + CELL.width * columns, startY + CELL.height * rows, { steps: 10 });
  await page.mouse.up();

  await expect(selectionLabel(page)).toHaveText(/^A1:[A-Z]+\d+$/);
  return (await selectionLabel(page).textContent())!.trim();
}

/** Types `value` into the formula bar and commits it to the currently selected cell. */
export async function commitFormulaBar(page: Page, value: string) {
  const input = formulaInput(page);
  await input.click();
  await input.fill(value);
  await input.press('Enter');
}

/** Selects (row, column) and writes `value` into it via the formula bar. */
export async function setCell(page: Page, row: number, column: number, value: string) {
  await selectCell(page, row, column);
  await commitFormulaBar(page, value);
  await expect(activeCellLabel(page)).toHaveText(cellRef(row, column));
}

/**
 * Types `value` straight into the grid, the way a user edits a cell (select, type, Enter).
 *
 * This is NOT interchangeable with `setCell`: the in-grid path goes through
 * fortune-sheet's own cell editor, while `setCell` goes through the app's formula bar and
 * `workbook.setCellValue`. The two behave differently (see BUG-1 in tests/README.md), so
 * each path has its own coverage.
 */
export async function typeIntoCell(page: Page, row: number, column: number, value: string) {
  await selectCell(page, row, column);
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}

/* ------------------------------------------------------------------ */
/* Reading cells back                                                  */
/* ------------------------------------------------------------------ */

export async function storedSheets(page: Page, id: string) {
  const record = (await readStoredDocument<WorkbookSheet[]>(page, id)) as StoredDocument<WorkbookSheet[]> | null;
  return record?.data ?? null;
}

export function findStoredCell(sheets: WorkbookSheet[] | null, sheetName: string, row: number, column: number) {
  const sheet = sheets?.find((candidate) => candidate.name === sheetName);
  return sheet?.celldata?.find((entry) => entry.r === row && entry.c === column)?.v ?? null;
}

/** The CALCULATED value of a stored cell (not the formula text). */
export function storedCellValue(sheets: WorkbookSheet[] | null, sheetName: string, row: number, column: number) {
  return findStoredCell(sheets, sheetName, row, column)?.v ?? null;
}

export function storedCellFormula(sheets: WorkbookSheet[] | null, sheetName: string, row: number, column: number) {
  return findStoredCell(sheets, sheetName, row, column)?.f ?? null;
}

/**
 * The stored value coerced to a number.
 *
 * fortune-sheet keeps a user-entered number as the STRING "999" in `celldata` while cells
 * that came from the seed data are real numbers, so `=== 999` would be an assertion about
 * which code path wrote the cell rather than about its value. Everything downstream
 * (SUM, the selection summary, XLSX export) coerces, so the tests coerce too.
 */
export function storedCellNumber(sheets: WorkbookSheet[] | null, sheetName: string, row: number, column: number) {
  const value = storedCellValue(sheets, sheetName, row, column);
  return value === null || value === undefined || value === '' ? null : Number(value);
}

/**
 * Builds a workbook payload in the shape `db.ts` stores and `fortune-sheet` hydrates from.
 * `rows` is a dense array of primitives; empty strings are skipped.
 */
export function makeSheet(
  name: string,
  rows: Array<Array<string | number | null>>,
  extras: Partial<WorkbookSheet> = {},
): WorkbookSheet {
  const celldata: NonNullable<WorkbookSheet['celldata']> = [];
  rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === null || value === '') {
        return;
      }
      celldata.push({ r: rowIndex, c: columnIndex, v: { v: value, m: String(value) } });
    });
  });

  return { name, id: `sheet-${name.toLowerCase().replace(/\W+/g, '-')}`, status: 0, celldata, ...extras };
}
