import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Columns3,
  Download,
  FileSpreadsheet,
  Plus,
  Redo,
  Rows3,
  Save,
  Search,
  ShieldAlert,
  Snowflake,
  Trash2,
  Undo,
  Upload,
  X,
} from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBar } from '../components/StatusBar';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../components/Toolbar';
import type { WorkbookInstance } from '../components/ExcelWorkbook';
import {
  DocumentReadError,
  getCurrentClientId,
  loadDocument,
  retryStorageConnection,
  saveDocument,
  saveDocumentBackupNow,
  subscribeToDocument,
} from '../utils/db';

const ExcelWorkbook = lazy(() => import('../components/ExcelWorkbook'));
const SelectionChart = lazy(() => import('../components/SelectionChart'));

interface ExcelProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

interface BannerAction {
  label: string;
  onClick: () => void;
  isPrimary?: boolean;
}

interface BannerState {
  tone: 'success' | 'warning' | 'error';
  title: string;
  detail?: string;
  actions?: BannerAction[];
}

interface SelectionSummary {
  label: string;
  activeCell: string;
  numericCount: number;
  filledCount: number;
  sum: number;
  average: number;
}

interface SelectionChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius: number;
  }>;
}

interface CellType {
  fa?: string;
  t?: string;
}

interface WorkbookCell {
  v?: string | number | boolean | null;
  m?: string;
  f?: string;
  ct?: CellType;
  // Styling / merge / comment keys (bg, bl, fc, mc, ...) carried through verbatim.
  [key: string]: unknown;
}

interface WorkbookSelection {
  row: number[];
  column: number[];
}

interface WorkbookSheet {
  id?: string;
  name: string;
  status?: number;
  data?: (WorkbookCell | null)[][];
  celldata?: {
    r: number;
    c: number;
    v: WorkbookCell;
  }[];
  [key: string]: unknown;
}

type WorkbookData = WorkbookSheet[];

type XlsxModule = typeof import('xlsx');

interface SelectionBounds {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
  label: string;
  activeCell: string;
}

interface FindMatch {
  row: number;
  column: number;
}

const starterSheets = [
  {
    name: 'Quarterly Plan',
    id: 'sheet-1',
    status: 1,
    celldata: [
      { r: 0, c: 0, v: { v: 'Team', m: 'Team' } },
      { r: 0, c: 1, v: { v: 'Target', m: 'Target' } },
      { r: 0, c: 2, v: { v: 'Actual', m: 'Actual' } },
      { r: 1, c: 0, v: { v: 'Sales', m: 'Sales' } },
      { r: 1, c: 1, v: { v: 42, m: '42' } },
      { r: 1, c: 2, v: { v: 38, m: '38' } },
      { r: 2, c: 0, v: { v: 'Support', m: 'Support' } },
      { r: 2, c: 1, v: { v: 31, m: '31' } },
      { r: 2, c: 2, v: { v: 35, m: '35' } },
      { r: 3, c: 0, v: { v: 'Ops', m: 'Ops' } },
      { r: 3, c: 1, v: { v: 24, m: '24' } },
      { r: 3, c: 2, v: { v: 29, m: '29' } },
    ],
  },
];

/*
 * Status-bar spacing is set here rather than in a class because `index.css` is shared and
 * the bar changes layout mode across breakpoints (inline-flex with a gap on desktop, a
 * plain truncating block on a phone). Explicit margins read the same in both.
 */
const statusSeparatorStyle: CSSProperties = { margin: '0 6px', opacity: 0.4 };
const statusDotStyle: CSSProperties = { margin: '0 5px', opacity: 0.4 };

const emptySelection: SelectionSummary = {
  label: 'A1',
  activeCell: 'A1',
  numericCount: 0,
  filledCount: 0,
  sum: 0,
  average: 0,
};

/**
 * Sheet-level keys that carry real document state (formatting, merges, freeze panes,
 * column widths, filters...). These are preserved verbatim when a sheet is written to
 * storage; the cell contents themselves are rebuilt into `celldata`. See
 * `toPersistableSheets`.
 */
const PRESERVED_SHEET_KEYS = [
  'order',
  'color',
  'row',
  'column',
  'config',
  'frozen',
  'defaultRowHeight',
  'defaultColWidth',
  'showGridLines',
  'filter',
  'filter_select',
  'luckysheet_conditionformat_save',
  'luckysheet_alternateformat_save',
  'dataVerification',
  'hyperlink',
  'images',
  'zoomRatio',
] as const;

function createId(prefix: string) {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${uuid}`;
}

function columnLabel(index: number) {
  let result = '';
  let current = index;

  while (current >= 0) {
    result = String.fromCharCode((current % 26) + 65) + result;
    current = Math.floor(current / 26) - 1;
  }

  return result;
}

function formatSelectionLabel(startRow: number, endRow: number, startColumn: number, endColumn: number) {
  const start = `${columnLabel(startColumn)}${startRow + 1}`;
  const end = `${columnLabel(endColumn)}${endRow + 1}`;
  return start === end ? start : `${start}:${end}`;
}

function normalizeSelectionAxis(axis: number[] | undefined) {
  if (!Array.isArray(axis) || axis.length === 0) {
    return null;
  }

  const start = Number(axis[0]);
  const end = Number(axis[axis.length > 1 ? 1 : 0]);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }

  return [Math.min(start, end), Math.max(start, end)] as const;
}

function getSelectionBounds(selection: WorkbookSelection | undefined): SelectionBounds | null {
  const row = normalizeSelectionAxis(selection?.row);
  const column = normalizeSelectionAxis(selection?.column);

  if (!row || !column) {
    return null;
  }

  const [startRow, endRow] = row;
  const [startColumn, endColumn] = column;

  return {
    startRow,
    endRow,
    startColumn,
    endColumn,
    label: formatSelectionLabel(startRow, endRow, startColumn, endColumn),
    activeCell: `${columnLabel(startColumn)}${startRow + 1}`,
  };
}

/**
 * fortune-sheet stores a formula in `cell.f` WITH its leading `=` (an in-cell entry of
 * `=SUM(A1:A2)` produces `f: "=SUM(A1:A2)"`). Blindly prefixing another `=` for display
 * produced `==SUM(A1:A2)` in the formula bar. This normalises to exactly one `=`, and
 * still repairs cells written by the old code path, whose `f` had the `=` stripped off.
 */
function normalizeFormulaText(formula: unknown): string | null {
  if (typeof formula !== 'string') {
    return null;
  }

  const trimmed = formula.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith('=') ? trimmed : `=${trimmed}`;
}

/** Formula text as stored in an .xlsx file, i.e. without the leading `=`. */
function formulaWithoutEquals(formula: string) {
  const normalized = normalizeFormulaText(formula);
  return normalized ? normalized.slice(1) : '';
}

function normalizeWorkbookCell(value: unknown): WorkbookCell | null {
  if (value === undefined || value === null) {
    return null;
  }

  /*
   * ANY object is already a cell record and must be returned as-is.
   *
   * Clearing a cell (the Delete key) leaves `{}` behind in fortune-sheet's matrix. Testing
   * for specific keys instead sent `{}` down the primitive branch, where it was wrapped as
   * a VALUE and stringified to the literal text "[object Object]" -- visible in the grid
   * and baked straight into XLSX and CSV exports. Only primitives get wrapped; `isBlankCell`
   * is what decides whether a cell record is worth keeping.
   */
  if (typeof value === 'object') {
    return Array.isArray(value) ? null : (value as WorkbookCell);
  }

  return {
    v: value as string | number | boolean,
    m: String(value),
  };
}

/** Cell keys that carry formatting rather than content. */
const CELL_STYLE_KEYS = [
  'bg', 'bl', 'it', 'ff', 'fs', 'fc', 'ht', 'vt', 'tb', 'cl', 'un', 'tr', 'mc', 'lo', 'rt', 'ps', 'hl', 'qp', 'spl',
] as const;

function isBlankCell(cell: WorkbookCell) {
  if (cell.f) {
    return false;
  }

  if (cell.ct && cell.ct.fa && cell.ct.fa !== 'General') {
    return false;
  }

  /*
   * A cell can be empty of content but still carry a fill, a bold flag, a merge or a
   * comment. Dropping those on save silently threw away formatting applied to blank
   * cells -- easy to hit with the formatting toolbar.
   */
  if (CELL_STYLE_KEYS.some((key) => cell[key] !== undefined && cell[key] !== null)) {
    return false;
  }

  const hasValue = cell.v !== undefined && cell.v !== null && cell.v !== '';
  const hasDisplay = cell.m !== undefined && cell.m !== null && cell.m !== '';

  return !hasValue && !hasDisplay;
}

/**
 * Flatten a sheet to the cells that actually hold something.
 *
 * fortune-sheet keeps runtime contents in the dense `data` matrix and DELETES `celldata`
 * as soon as a sheet is hydrated, so `data` is authoritative whenever it exists; an
 * imported / freshly seeded sheet only has `celldata`.
 */
function collectSheetCellEntries(sheet: WorkbookSheet) {
  const entries: { row: number; column: number; cell: WorkbookCell }[] = [];

  if (Array.isArray(sheet.data)) {
    for (let rowIndex = 0; rowIndex < sheet.data.length; rowIndex += 1) {
      const row = sheet.data[rowIndex];
      if (!row) {
        continue;
      }

      for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
        const raw = row[columnIndex];
        if (raw === null || raw === undefined) {
          continue;
        }

        const cell = normalizeWorkbookCell(raw);
        if (!cell || isBlankCell(cell)) {
          continue;
        }

        entries.push({ row: rowIndex, column: columnIndex, cell });
      }
    }

    return entries;
  }

  sheet.celldata?.forEach((entry) => {
    const cell = normalizeWorkbookCell(entry.v);
    if (!cell || isBlankCell(cell)) {
      return;
    }

    entries.push({ row: entry.r, column: entry.c, cell });
  });

  return entries;
}

/**
 * Convert live runtime sheets into the shape that actually survives a reload.
 *
 * fortune-sheet hydrates a workbook ONLY from `celldata`: on mount it rebuilds the dense
 * `data` matrix from `celldata` and then deletes `celldata`. Persisting the runtime
 * sheets verbatim (what `getAllSheets()` hands back) therefore stored a `data` matrix
 * that the next mount ignored and overwrote with blanks -- the workbook reopened empty
 * and autosave then wrote that empty grid back over the file.
 *
 * Rebuilding `celldata` here is what makes the round trip work. It also shrinks the
 * payload enormously, because the dense matrix is overwhelmingly nulls.
 */
function toPersistableSheets(sheets: WorkbookData): WorkbookData {
  return sheets.map((sheet) => {
    const persisted: WorkbookSheet = {
      name: sheet.name,
      id: sheet.id,
      status: sheet.status,
    };

    PRESERVED_SHEET_KEYS.forEach((key) => {
      const value = sheet[key];
      if (value !== undefined) {
        persisted[key] = value;
      }
    });

    persisted.celldata = collectSheetCellEntries(sheet).map(({ row, column, cell }) => ({
      r: row,
      c: column,
      v: { ...cell },
    }));

    return persisted;
  });
}

function countPersistedCells(sheets: WorkbookData) {
  return sheets.reduce((total, sheet) => total + (sheet.celldata?.length ?? 0), 0);
}

function getSheetBounds(entries: { row: number; column: number }[]): SelectionBounds | null {
  if (entries.length === 0) {
    return null;
  }

  /*
   * A single reduce pass. This used to be four `Math.min(...entries.map(...))` spreads,
   * which pass one argument per cell: a 50k-row x 3-col sheet is 150k arguments and blew
   * V8's argument limit outright ("Maximum call stack size exceeded"), taking the page
   * down whenever such a sheet was charted.
   */
  let startRow = entries[0].row;
  let endRow = entries[0].row;
  let startColumn = entries[0].column;
  let endColumn = entries[0].column;

  for (let index = 1; index < entries.length; index += 1) {
    const { row, column } = entries[index];
    if (row < startRow) startRow = row;
    if (row > endRow) endRow = row;
    if (column < startColumn) startColumn = column;
    if (column > endColumn) endColumn = column;
  }

  return {
    startRow,
    endRow,
    startColumn,
    endColumn,
    label: formatSelectionLabel(startRow, endRow, startColumn, endColumn),
    activeCell: `${columnLabel(startColumn)}${startRow + 1}`,
  };
}

function getSheetDataBounds(sheet: WorkbookSheet | undefined): SelectionBounds | null {
  if (!sheet) {
    return null;
  }

  return getSheetBounds(collectSheetCellEntries(sheet));
}

function buildWorksheetFromSheet(XLSX: XlsxModule, sheet: WorkbookSheet) {
  const worksheet: import('xlsx').WorkSheet = {};
  const entries = collectSheetCellEntries(sheet);

  if (!entries.length) {
    worksheet['!ref'] = 'A1';
    return worksheet;
  }

  const bounds = getSheetBounds(entries);

  entries.forEach(({ row, column, cell }) => {
    const address = XLSX.utils.encode_cell({ r: row, c: column });

    /*
     * `cell.v` is the CALCULATED value for a formula cell -- previously the formula text
     * was written into `v` as a string alongside `f`, so every exported formula carried
     * "=SUM(A1:A2)" as its cached value. That is fixed at the source (formula entry no
     * longer stuffs text into `v`), so `v` can simply be trusted here.
     */
    const cellValue = cell.v ?? cell.m ?? '';
    const worksheetCell: Partial<import('xlsx').CellObject> = {};

    /*
     * fortune-sheet stores a number the user TYPED as a string `v` with `ct.t === 'n'`
     * (e.g. `{v: "10", ct: {t: 'n'}}`). Branching on `typeof v === 'number'` alone
     * exported those as text cells, so a SUM over them recalculated to 0 once the file
     * was opened in Excel. Trust `ct.t` and coerce.
     */
    const numericFromCellType =
      cell.ct?.t === 'n' && cellValue !== '' && Number.isFinite(Number(cellValue)) ? Number(cellValue) : null;

    if (typeof cellValue === 'number') {
      worksheetCell.t = 'n';
      worksheetCell.v = cellValue;
    } else if (numericFromCellType !== null) {
      worksheetCell.t = 'n';
      worksheetCell.v = numericFromCellType;
    } else if (typeof cellValue === 'boolean') {
      worksheetCell.t = 'b';
      worksheetCell.v = cellValue;
    } else if (cell.ct?.t === 'b' && (cellValue === 'TRUE' || cellValue === 'FALSE')) {
      worksheetCell.t = 'b';
      worksheetCell.v = cellValue === 'TRUE';
    } else {
      worksheetCell.t = 's';
      worksheetCell.v = String(cellValue);
    }

    if (cell.f) {
      worksheetCell.f = formulaWithoutEquals(cell.f);
    }

    if (cell.ct?.fa && cell.ct.fa !== 'General' && cell.ct.fa !== '@') {
      worksheetCell.z = cell.ct.fa;
    }

    if (cell.m && String(cellValue) !== cell.m) {
      worksheetCell.w = cell.m;
    }

    worksheet[address] = worksheetCell as import('xlsx').CellObject;
  });

  if (bounds) {
    worksheet['!ref'] = XLSX.utils.encode_range({
      s: { r: bounds.startRow, c: bounds.startColumn },
      e: { r: bounds.endRow, c: bounds.endColumn },
    });
  }

  return worksheet;
}

/**
 * Neutralise CSV formula injection.
 *
 * A CSV field that begins with `=`, `+`, `-`, `@` (or a tab / CR that Excel skips before
 * looking) is executed as a formula when the file is opened in Excel or Sheets, which
 * turns an exported spreadsheet into an attack against whoever opens it. Prefixing a
 * single quote makes the receiving application treat the field as literal text.
 */
function neutralizeCsvField(field: string) {
  if (!field) {
    return field;
  }

  /*
   * A plain number is never a formula, and negative numbers start with `-`. Quoting those
   * turned every `-42` into the text `'-42`, which then re-imported as a string -- the
   * neutraliser was corrupting ordinary data.
   */
  const trimmed = field.trim();
  if (trimmed && Number.isFinite(Number(trimmed))) {
    return field;
  }

  return /^[\t\r]*[=+\-@]/.test(field) ? `'${field}` : field;
}

function escapeCsvField(field: string) {
  const safe = neutralizeCsvField(field);
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function sheetToCsv(sheet: WorkbookSheet) {
  const entries = collectSheetCellEntries(sheet);
  const bounds = getSheetBounds(entries);

  if (!bounds) {
    return '';
  }

  const grid = new Map<string, string>();
  entries.forEach(({ row, column, cell }) => {
    // The DISPLAYED text is what belongs in a CSV, never the formula source.
    const text = cell.m ?? (cell.v === undefined || cell.v === null ? '' : String(cell.v));
    grid.set(`${row}:${column}`, String(text));
  });

  const lines: string[] = [];
  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    const cells: string[] = [];
    for (let column = bounds.startColumn; column <= bounds.endColumn; column += 1) {
      cells.push(escapeCsvField(grid.get(`${row}:${column}`) ?? ''));
    }
    lines.push(cells.join(','));
  }

  return lines.join('\r\n');
}

const CURRENCY_SYMBOLS = ['$', '€', '£', '¥', '₩', '₹'];

/**
 * fortune-sheet parses `$1,234.56` into the number 1234.56 with the format `#,##0.00`,
 * silently dropping the currency symbol the user typed. Detect that case so the currency
 * format can be re-applied; the value stays a real number, only the display format gains
 * the symbol back.
 */
function detectCurrencyFormat(rawText: string): { format: string; value: number } | null {
  const text = rawText.trim();
  if (!text) {
    return null;
  }

  const negative = text.startsWith('-');
  const body = negative ? text.slice(1).trim() : text;
  const symbol = CURRENCY_SYMBOLS.find((candidate) => body.startsWith(candidate));

  if (!symbol) {
    return null;
  }

  const numeric = body.slice(symbol.length).replace(/[\s,]/g, '');
  if (!numeric || !/^\d*\.?\d+$/.test(numeric)) {
    return null;
  }

  const parsed = Number(numeric);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const decimals = /\.(\d+)$/.exec(numeric);
  const places = decimals ? decimals[1].length : 2;

  return {
    format: `${symbol}#,##0.${'0'.repeat(places)}`,
    value: negative ? -parsed : parsed,
  };
}

/**
 * True while the status bar is in its single-truncating-line layout.
 *
 * Below 640px `index.css` switches `.status-bar__segment` to a `display: block` with
 * `text-overflow: ellipsis`, and the two segments then compete for one 390px line: a full
 * four-stat read-out on the left starves the save status on the right down to "Sa...".
 * The read-out is what gives way, not the save status.
 */
function useIsNarrowStatusBar() {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const update = () => setIsNarrow(query.matches);

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isNarrow;
}

function cellSearchText(cell: WorkbookCell | null | undefined) {
  if (!cell) {
    return '';
  }

  if (cell.m !== undefined && cell.m !== null && cell.m !== '') {
    return String(cell.m);
  }

  return cell.v === undefined || cell.v === null ? '' : String(cell.v);
}

export default function Excel({ toggleTheme, isDarkMode }: ExcelProps) {
  const maxImportFileBytes = 12 * 1024 * 1024;
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFileName = 'Untitled Spreadsheet';
  // Date.now() collides whenever two documents are created in the same millisecond.
  /*
   * The document id must FOLLOW the URL. Freezing it at first mount meant navigating from
   * #/excel?id=A to #/excel?id=B kept the grid on document A, and the next edit was
   * written into A while the address bar said B.
   */
  const [fallbackDocId] = useState(() => createId('excel'));
  const docId = searchParams.get('id') || fallbackDocId;
  const [fileName, setFileName] = useState(defaultFileName);
  const [documentRevision, setDocumentRevision] = useState(0);
  const [workbookSeed, setWorkbookSeed] = useState<WorkbookData>(() => structuredClone(starterSheets) as WorkbookData);
  const [workbookKey, setWorkbookKey] = useState(0);
  const [sheetCount, setSheetCount] = useState(starterSheets.length);
  // Not 'Saved'. A workbook that has never been written must not claim it has:
  // the header paints exactly 'Saved' as a green success pill, so starting there
  // showed a brand-new workbook as safely stored with zero bytes on disk.
  const [saveStatus, setSaveStatus] = useState('Not saved yet');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formulaValue, setFormulaValue] = useState('');
  const [selectionSummary, setSelectionSummary] = useState<SelectionSummary>(emptySelection);
  const [activeSheetName, setActiveSheetName] = useState('Quarterly Plan');
  const [chartData, setChartData] = useState<SelectionChartData | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [importCandidate, setImportCandidate] = useState<File | null>(null);

  const [isFindOpen, setIsFindOpen] = useState(false);
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [findMatchCase, setFindMatchCase] = useState(false);
  const [findMatches, setFindMatches] = useState<FindMatch[]>([]);
  const [findIndex, setFindIndex] = useState(0);
  const [findStatus, setFindStatus] = useState('');
  const findInputRef = useRef<HTMLInputElement | null>(null);

  const workbookRef = useRef<WorkbookInstance | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const documentRevisionRef = useRef(documentRevision);
  const hasInitializedSaveRef = useRef(false);
  const [workbookChangeToken, setWorkbookChangeToken] = useState(0);
  const workbookChangeTokenRef = useRef(0);
  const savedTokenRef = useRef(0);
  const skipNextWorkbookChangeRef = useRef(true);
  const activeSheetNameRef = useRef(activeSheetName);
  const isFormulaEditingRef = useRef(false);
  const fileNameRef = useRef(fileName);
  const lastSelectionRef = useRef<SelectionBounds | null>(null);
  const formulaTargetRef = useRef<SelectionBounds | null>(null);
  /*
   * The cell a find result is parked on. Because setSelection() is unusable in this
   * fortune-sheet build, a match is only scrolled into view -- the grid's own selection
   * stays where it was, off-screen. Without this override the next formula-bar edit went
   * to that stale off-screen cell instead of the match the user is looking at.
   */
  const findFocusRef = useRef<SelectionBounds | null>(null);
  const isFormulaDirtyRef = useRef(false);
  const pendingCurrencyRef = useRef<{ row: number; column: number; format: string; value: number } | null>(null);
  const workbookSeedRef = useRef<WorkbookData>([]);
  const hasHadCellsRef = useRef(false);
  const isSavingRef = useRef(false);
  // Counts operations the USER performed since the last successful save. Distinguishes a
  // deliberately emptied grid from a grid that merely failed to hydrate.
  const userOperationCountRef = useRef(0);
  const [hasConflict, setHasConflict] = useState(false);
  // Another tab has saved past us: neither save path can win from here without forcing.
  const [isStale, setIsStale] = useState(false);
  /*
   * The stored workbook could not be READ (as opposed to "does not exist"). While true the
   * grid is not mounted at all and every save path refuses, so the starter workbook this
   * page seeds itself with can never reach storage on top of a record nobody has seen.
   */
  const [isWorkbookUnopenable, setIsWorkbookUnopenable] = useState(false);
  const isWorkbookUnopenableRef = useRef(false);
  const [openFailureDetail, setOpenFailureDetail] = useState<string | null>(null);
  // Bumped by "Try again"; re-arms the load effect.
  const [loadAttempt, setLoadAttempt] = useState(0);
  const isNarrowStatusBar = useIsNarrowStatusBar();

  useEffect(() => {
    documentRevisionRef.current = documentRevision;
  }, [documentRevision]);

  useEffect(() => {
    activeSheetNameRef.current = activeSheetName;
  }, [activeSheetName]);

  useEffect(() => {
    fileNameRef.current = fileName;
  }, [fileName]);

  useEffect(() => {
    workbookChangeTokenRef.current = workbookChangeToken;
  }, [workbookChangeToken]);

  useEffect(() => {
    workbookSeedRef.current = workbookSeed;
  }, [workbookSeed]);

  useEffect(() => {
    if (!searchParams.get('id')) {
      setSearchParams({ id: docId }, { replace: true });
    }
  }, [docId, searchParams, setSearchParams]);

  const loadedDocIdRef = useRef<string | null>(null);

  // Switching documents in the URL must tear the editor back down to a loading state.
  useEffect(() => {
    if (loadedDocIdRef.current === null || loadedDocIdRef.current === docId) {
      return;
    }

    loadedDocIdRef.current = null;
    hasInitializedSaveRef.current = false;
    hasHadCellsRef.current = false;
    userOperationCountRef.current = 0;
    savedTokenRef.current = workbookChangeTokenRef.current;
    documentRevisionRef.current = 0;
    lastSelectionRef.current = null;
    findFocusRef.current = null;
    setDocumentRevision(0);
    setHasConflict(false);
    setIsStale(false);
    isWorkbookUnopenableRef.current = false;
    setIsWorkbookUnopenable(false);
    setOpenFailureDetail(null);
    setBanner(null);
    setLastSavedAt(null);
    setFileName(defaultFileName);
    setWorkbookSeed(structuredClone(starterSheets) as WorkbookData);
    skipNextWorkbookChangeRef.current = true;
    setWorkbookKey((current) => current + 1);
    setIsLoaded(false);
  }, [docId]);

  useEffect(() => {
    if (isLoaded) {
      return;
    }

    loadedDocIdRef.current = docId;
    loadDocument<WorkbookData>(docId)
      .then((doc) => {
        if (doc && doc.type === 'excel') {
          setFileName(doc.title || defaultFileName);
          if (Array.isArray(doc.data) && doc.data.length > 0) {
            /*
             * MIGRATE ON LOAD. Records written before the celldata fix hold fortune-sheet's
             * dense `data` matrix and no `celldata`, and fortune-sheet hydrates ONLY from
             * `celldata` -- so such a document opened completely blank and the first
             * keystroke autosaved the blank grid over it.
             *
             * `collectSheetCellEntries` prefers `data` when it is present, so running the
             * loaded record through `toPersistableSheets` rebuilds `celldata` and recovers
             * the workbook. It also makes the empty-grid guard honest: `hasHadCellsRef` is
             * derived from `celldata`, which on a legacy record was always 0, leaving the
             * guard permanently inert for exactly the documents it existed to protect.
             */
            const loadedSheets = toPersistableSheets(structuredClone(doc.data) as WorkbookData);
            setWorkbookSeed(loadedSheets);
            setSheetCount(loadedSheets.length);
            setActiveSheetName(
              loadedSheets.find((sheet) => sheet.status === 1)?.name ?? loadedSheets[0]?.name ?? 'Quarterly Plan',
            );
            if (countPersistedCells(loadedSheets) > 0) {
              hasHadCellsRef.current = true;
            }
            skipNextWorkbookChangeRef.current = true;
            setWorkbookKey((current) => current + 1);
          }
          setLastSavedAt(doc.updatedAt);
          setDocumentRevision(doc.revision);
          if (doc.source === 'backup') {
            setBanner({
              tone: 'warning',
              title: 'Recovered the latest local backup.',
              detail: 'This workbook was restored from the browser backup cache after a storage mismatch.',
            });
          }
        }
        // Only the retry path parks the pill on 'Loading...'; clear it now the load is in.
        setSaveStatus((current) => (current === 'Loading...' ? (doc ? 'Saved' : 'Not saved yet') : current));
        setIsLoaded(true);
      })
      .catch((error) => {
        /*
         * The stored workbook could NOT be read. This used to open "a starter workbook
         * instead" and mark the page loaded, which armed autosave: the first cell edit
         * wrote the starter workbook over a record nobody had managed to look at, with the
         * pill reading "Saved". db.ts's conflict check cannot catch it -- a tab reloading a
         * workbook it saved itself keeps the same client id, which disables half of
         * `isConflict`.
         *
         * Every failure is treated as unreadable, including an unexpected one: from here
         * "the load threw" and "the load could not read" are the same thing, and guessing
         * between them is what wrote the starter workbook in the first place.
         *
         * `isLoaded` deliberately stays FALSE. It gates the autosave debounce, the
         * pagehide/visibilitychange snapshot and the unmount flush, so the block holds even
         * if a future save path forgets to check `isWorkbookUnopenableRef`.
         */
        console.error('Failed to load spreadsheet', error);
        isWorkbookUnopenableRef.current = true;
        setIsWorkbookUnopenable(true);
        setOpenFailureDetail(error instanceof DocumentReadError ? error.detail : null);
        // Contains "read-only" so AppHeader paints the pill as a danger state.
        setSaveStatus('Read-only: could not open');
      });
  }, [docId, isLoaded, loadAttempt]);

  /**
   * Retry rather than a hard lock: the likeliest cause is transient -- the 10s IndexedDB
   * open budget expiring (an upgrade blocked by another tab), or the 5s window in which
   * db.ts remembers a failed open. `retryStorageConnection()` clears that memo so the click
   * actually re-opens the database instead of instantly repeating the same failure.
   * Nothing was written, so retrying is free.
   */
  const retryOpen = useCallback(() => {
    retryStorageConnection();
    isWorkbookUnopenableRef.current = false;
    setIsWorkbookUnopenable(false);
    setOpenFailureDetail(null);
    setBanner(null);
    setSaveStatus('Loading...');
    hasInitializedSaveRef.current = false;
    skipNextWorkbookChangeRef.current = true;
    setWorkbookKey((current) => current + 1);
    setLoadAttempt((value) => value + 1);
  }, []);

  /**
   * Leave the unreadable workbook strictly alone and open a brand new one. A full reload
   * onto a new id re-mounts against an id nothing is stored under, so there is no path by
   * which this session can touch the record it could not read.
   */
  const startNewWorkbook = useCallback(() => {
    window.location.hash = `#/excel?id=${createId('excel')}`;
    window.location.reload();
  }, []);

  const unopenableBanner = useCallback(
    (detail: string | null): BannerState => ({
      tone: 'error',
      title: 'This workbook could not be opened. Your saved copy has NOT been changed.',
      detail:
        'Browser storage did not answer, so the editor does not know what this workbook contains. The grid is not loaded and saving is disabled — nothing here can overwrite it. This is usually temporary.' +
        (detail ? ` (${detail})` : ''),
      actions: [
        { label: 'Try again', onClick: retryOpen, isPrimary: true },
        { label: 'Start a new workbook instead', onClick: startNewWorkbook },
      ],
    }),
    [retryOpen, startNewWorkbook],
  );

  useEffect(() => {
    if (!isWorkbookUnopenable) {
      return;
    }

    setBanner(unopenableBanner(openFailureDetail));
  }, [isWorkbookUnopenable, openFailureDetail, unopenableBanner]);

  function getActiveSelection() {
    return workbookRef.current?.getSelection()?.[0] as WorkbookSelection | undefined;
  }

  function getActiveSheet() {
    return workbookRef.current?.getSheet() as WorkbookSheet | undefined;
  }

  function getCellFromSheet(sheet: WorkbookSheet | undefined, row: number, column: number) {
    if (!sheet) {
      return null;
    }

    const matrixCell = sheet.data?.[row]?.[column];
    if (matrixCell) {
      return matrixCell;
    }

    const cellData = sheet.celldata?.find((cell) => cell.r === row && cell.c === column);
    return cellData?.v ?? null;
  }

  const getRuntimeActiveSheetName = useCallback((fallback = activeSheetNameRef.current) => {
    try {
      return getActiveSheet()?.name ?? fallback;
    } catch (error) {
      if (error instanceof Error && error.message === 'sheet not found') {
        return fallback;
      }

      throw error;
    }
  }, []);

  /**
   * Build the storage payload from the live grid.
   *
   * This is deliberately the ONLY place the workbook is serialised. It used to run on
   * every single cell edit -- `getAllSheets()` plus a `structuredClone` of the entire
   * dense matrix, then another clone for the save and a `JSON.stringify` for the backup,
   * i.e. three full deep copies per keystroke-sized operation.
   */
  const buildPersistablePayload = useCallback((): WorkbookData | null => {
    const workbook = workbookRef.current;
    if (!workbook) {
      return null;
    }

    try {
      const sheets = workbook.getAllSheets() as unknown as WorkbookData;
      if (!Array.isArray(sheets) || sheets.length === 0) {
        return null;
      }

      return toPersistableSheets(sheets);
    } catch (error) {
      console.error('Failed to serialise workbook', error);
      return null;
    }
  }, []);

  /**
   * Commit whatever is being typed right now.
   *
   * Ctrl+S while a cell editor was open saved the workbook WITHOUT the text in that
   * editor, because fortune-sheet only writes the cell on blur. The app's own formula
   * input has the same problem.
   */
  const commitOpenCellEditor = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;

    if (active?.classList?.contains('formula-input')) {
      active.blur();
      return true;
    }

    const editor = document.querySelector<HTMLElement>('#luckysheet-rich-text-editor, .luckysheet-cell-input');
    if (!editor || !(editor.innerText ?? '').trim()) {
      return false;
    }

    /*
     * A raw blur() does NOT commit -- fortune-sheet writes the cell from its own key and
     * mouse handlers, so an unblurred editor simply never reaches the model. Replaying an
     * Enter keydown ON THE EDITOR ELEMENT is the path it actually listens on (verified:
     * blur and a document-level Enter both leave the cell null).
     */
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }),
    );
    return true;
  }, []);

  /** The text sitting in an open cell editor that has not reached the model yet. */
  const readOpenCellEditor = useCallback(() => {
    const editor = document.querySelector<HTMLElement>('#luckysheet-rich-text-editor, .luckysheet-cell-input');
    const text = editor?.innerText ?? '';
    if (!editor || !text.trim()) {
      return null;
    }

    const target = getSelectionBounds(getActiveSelection());
    if (!target) {
      return null;
    }

    return { row: target.startRow, column: target.startColumn, text };
  }, []);

  const markWorkbookDirty = useCallback(() => {
    userOperationCountRef.current += 1;
    setWorkbookChangeToken((current) => {
      const next = current + 1;
      workbookChangeTokenRef.current = next;
      return next;
    });
  }, []);

  /**
   * The single funnel into `saveDocument`.
   *
   * Every caller (debounced autosave, Ctrl+S, and the pagehide/visibilitychange flush)
   * goes through here, and this function never rejects: a total persistence failure now
   * THROWS out of `saveDocument`, so the catch below is what turns it into a visible
   * error. `savedTokenRef` is advanced only on a genuine write, so anything short of
   * success leaves the workbook dirty and the next flush will retry.
   */
  const performSave = useCallback(
    async (options: { silent?: boolean; force?: boolean } = {}) => {
      if (isSavingRef.current) {
        return;
      }

      /*
       * The stored workbook could not be READ. Anything this page could serialise now is
       * its own starter workbook, and writing that would destroy a record nobody has seen.
       * This guard sits in the single save funnel on purpose: the toolbar Save button and
       * Ctrl+S call it directly, bypassing the `isLoaded` gate that protects autosave.
       */
      if (isWorkbookUnopenableRef.current) {
        setSaveStatus('Read-only: could not open');
        setBanner(unopenableBanner(openFailureDetail));
        return;
      }

      if (commitOpenCellEditor()) {
        // Let fortune-sheet's state update land before reading the model back.
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }

      const payload = buildPersistablePayload();
      if (!payload) {
        return;
      }

      const cellCount = countPersistedCells(payload);

      /*
       * Refuse to write an empty grid ONLY when the emptiness cannot be the user's doing.
       *
       * The disaster case is a hydration failure: the grid comes up blank and autosave
       * immediately writes the blank over the file. In that case the user has performed
       * zero operations. Gating on "no content AND the user has not touched the grid"
       * blocks exactly that, while leaving a deliberate select-all-and-delete free to
       * save. An explicit Ctrl+S / Save always overrides.
       */
      if (
        cellCount === 0 &&
        hasHadCellsRef.current &&
        userOperationCountRef.current === 0 &&
        !options.force
      ) {
        setSaveStatus('Not saved');
        setBanner({
          tone: 'error',
          title: 'Autosave stopped: the grid came up empty.',
          detail:
            'This workbook has content on disk but the grid is blank and nothing has been edited, so the blank grid was NOT written over it. Reload to recover it.',
        });
        return;
      }

      if (cellCount > 0) {
        hasHadCellsRef.current = true;
      }

      const tokenAtStart = workbookChangeTokenRef.current;
      // db.ts treats a falsy title as an unloadable record, so never persist an empty one.
      const title = fileNameRef.current.trim() || defaultFileName;

      isSavingRef.current = true;
      if (!options.silent) {
        setSaveStatus('Saving...');
      }

      try {
        const result = await saveDocument(docId, title, 'excel', payload, {
          // knownRevision:null disables db.ts's conflict check -- the supported override
          // for a user-initiated force save.
          knownRevision: options.force ? null : documentRevisionRef.current,
        });

        if (result.status === 'conflict') {
          /*
           * Nothing was written. `result.record.revision` is the winner's TRUE revision;
           * adopting it here would make the next save look like a clean fast-forward and
           * silently clobber the other tab, so the local revision deliberately stays put
           * and the editor stays dirty.
           *
           * That also means an ordinary retry can NEVER succeed, so the message must not
           * suggest one -- the only ways forward are the explicit Force save control or
           * reloading.
           */
          setSaveStatus('Conflict - not saved');
          setHasConflict(true);
          setBanner({
            tone: 'warning',
            title: 'A newer workbook was saved in another tab.',
            detail:
              'Nothing was written, and normal saving cannot succeed from this tab any more. Use "Force save" to replace the newer version with yours, or reload to review it (export first if you want to keep these changes).',
          });
          return;
        }

        // Reserved by the persistence contract and not currently returned; kept as
        // defence in depth so a future reintroduction cannot read as success.
        if (result.status === 'failed') {
          setSaveStatus('Save failed');
          setBanner({
            tone: 'error',
            title: 'Nothing was saved.',
            detail:
              'Browser storage is unavailable, so no copy of this workbook was written. Export it before closing the tab.',
          });
          return;
        }

        setDocumentRevision(result.record.revision);
        documentRevisionRef.current = result.record.revision;
        savedTokenRef.current = tokenAtStart;
        userOperationCountRef.current = 0;
        setHasConflict(false);
        setIsStale(false);
        setLastSavedAt(result.record.updatedAt);
        setSaveStatus(result.record.source === 'backup' ? 'Saved to local backup only' : 'Saved');
      } catch (error) {
        console.error('Failed to save spreadsheet', error);
        setSaveStatus('Save failed');
        setBanner({
          tone: 'error',
          title: 'Nothing was saved.',
          detail:
            'Browser storage rejected the write, so no copy of this workbook was persisted. Export it before closing the tab.',
        });
      } finally {
        isSavingRef.current = false;
      }
    },
    [buildPersistablePayload, commitOpenCellEditor, defaultFileName, docId, openFailureDetail, unopenableBanner],
  );

  const performSaveRef = useRef(performSave);
  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!hasInitializedSaveRef.current) {
      hasInitializedSaveRef.current = true;
      return;
    }

    setSaveStatus('Saving...');
    /*
     * 500ms rather than 700ms. `saveDocumentBackupNow` cannot snapshot documents over
     * ~1.5MB, and a large workbook is well past that, so for big files the only thing
     * standing between an edit and the unload is this debounce. Serialising is now ~22ms
     * even at 150k cells, so the shorter window is cheap.
     */
    const timeoutId = window.setTimeout(() => {
      void performSaveRef.current({ silent: true });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [fileName, isLoaded, workbookChangeToken]);

  /**
   * Survive the page going away.
   *
   * `saveDocument` is async and CANNOT complete during unload -- an await in a `pagehide`
   * handler lands nothing, which is why the previous "flush on pagehide" did not actually
   * work at any reload delay under ~900ms. `saveDocumentBackupNow` is the synchronous
   * localStorage snapshot built for exactly this, and it is promoted on the next load.
   *
   * `visibilitychange` fires early enough that the normal async save does work there, so
   * that path is kept as the real save.
   */
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const snapshotNow = (): 'clean' | 'nothing' | 'saved' | 'failed' => {
      /*
       * There is no time to await anything here, so instead of committing the editor and
       * waiting for React, read its text straight out of the DOM and splice it into the
       * snapshot by hand.
       *
       * This is read BEFORE the dirty check on purpose: text sitting in an open editor has
       * not produced an operation yet, so the change token still looks clean and an
       * early return would throw the edit away.
       */
      const pendingEdit = readOpenCellEditor();

      if (!pendingEdit && savedTokenRef.current === workbookChangeTokenRef.current) {
        return 'clean' as const;
      }

      // getAllSheets() is synchronous, and it MUST go through toPersistableSheets: a
      // snapshot in fortune-sheet's dense `data` shape restores as a completely empty grid.
      const payload = buildPersistablePayload();
      if (!payload) {
        return 'nothing' as const;
      }

      if (pendingEdit) {
        const sheet = payload.find((candidate) => candidate.status === 1) ?? payload[0];
        if (sheet) {
          const cells = sheet.celldata ?? (sheet.celldata = []);
          const existing = cells.find((c) => c.r === pendingEdit.row && c.c === pendingEdit.column);
          const text = pendingEdit.text.trim();
          const currency = detectCurrencyFormat(text);

          /*
           * Splicing the raw text alone restored a typed formula as inert literal text --
           * "=SUM(B2:B4)" displayed verbatim and never computed again, with no signal.
           * Storing it in `f` means hydration from `celldata` recalculates it, which is the
           * same path an imported formula takes. Currency is reconstructed the same way so
           * "$1,234.56" comes back as a number with its format rather than a string.
           */
          const value: WorkbookCell = text.startsWith('=')
            ? { v: text, m: text, f: text }
            : currency
              ? { v: currency.value, m: text, ct: { fa: currency.format, t: 'n' } }
              : { v: pendingEdit.text, m: pendingEdit.text };

          if (existing) {
            existing.v = value;
          } else {
            cells.push({ r: pendingEdit.row, c: pendingEdit.column, v: value });
          }
        }
      }

      if (countPersistedCells(payload) === 0) {
        /*
         * An empty payload is only worth refusing when the emptiness is UNEXPLAINED -- the
         * same rule the autosave guard uses. A grid the user deliberately cleared is real
         * work and must still be snapshotted, and either way this is "nothing to write",
         * not "the write failed": reporting it as a failure made closing a deliberately
         * emptied workbook raise a spurious "Leave site?" prompt.
         */
        if (hasHadCellsRef.current && userOperationCountRef.current === 0) {
          return 'nothing' as const;
        }
      }

      /*
       * ALWAYS pass the real knownRevision here. `saveDocumentBackupNow` performs its own
       * conflict check and returns false rather than overwriting another tab's committed
       * work; `knownRevision: null` would disable that check. (Force save passes null to
       * `saveDocument` deliberately -- that is a different function and the pattern must
       * NOT migrate to this one.)
       *
       * A false return inside an unload handler is the CORRECT outcome: it means another
       * tab was protected. There is no UI available here, so it is not surfaced.
       */
      return saveDocumentBackupNow(docId, fileNameRef.current.trim() || defaultFileName, 'excel', payload, {
        knownRevision: documentRevisionRef.current,
      })
        ? ('saved' as const)
        : ('failed' as const);
    };

    /*
     * `saveDocumentBackupNow` cannot snapshot a document past BACKUP_SIZE_LIMIT_BYTES
     * (1.5MB, which a workbook reaches at roughly 7,000 rows). For those files the ONLY
     * thing protecting the last edit is the 500ms autosave debounce, so closing the tab
     * inside that window loses it silently.
     *
     * beforeunload runs before pagehide, so attempt the snapshot here. This does NOT close
     * the loss window -- it converts a silent loss into a prompted one, and a user who
     * chooses "Leave" still loses that edit. Only a genuine 'failed' prompts; "nothing to
     * write" must not, or clearing a workbook would prompt on every close.
     */
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const dirty = savedTokenRef.current !== workbookChangeTokenRef.current || readOpenCellEditor() !== null;
      if (!dirty) {
        return;
      }

      if (snapshotNow() !== 'failed') {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    /*
     * The page is still alive on visibilitychange, so this uses the REAL async save. That
     * path reports conflicts properly through the banner; the synchronous snapshot cannot,
     * and a refusal from it here would be silently indistinguishable from success.
     */
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && savedTokenRef.current !== workbookChangeTokenRef.current) {
        void performSaveRef.current({ silent: true });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', snapshotNow);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', snapshotNow);
      document.removeEventListener('visibilitychange', handleVisibility);
      snapshotNow();
      if (savedTokenRef.current !== workbookChangeTokenRef.current) {
        void performSaveRef.current({ silent: true });
      }
    };

  }, [buildPersistablePayload, docId, isLoaded, readOpenCellEditor]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    return subscribeToDocument(docId, (event) => {
      if (event.lastSavedBy === getCurrentClientId() || event.revision <= documentRevision) {
        return;
      }

      /*
       * This tab is now behind. Both save paths will refuse from here on -- `saveDocument`
       * reports a conflict, and `saveDocumentBackupNow` declines rather than overwrite the
       * winning tab -- and the unload snapshot has no way to tell anyone, so an edit made
       * now and then closed would simply vanish.
       *
       * Warning at the moment we learn about it is the only point where the user can still
       * act, which is why it names the escape route explicitly.
       */
      const hasUnsavedWork = savedTokenRef.current !== workbookChangeTokenRef.current;
      setIsStale(true);

      setBanner({
        tone: 'warning',
        title: hasUnsavedWork
          ? 'This tab is behind, and your unsaved changes may not save.'
          : 'A newer workbook is available from another tab.',
        detail: hasUnsavedWork
          ? 'Another tab saved a newer version of this workbook. Export a copy or use "Force save" before closing this tab, otherwise these changes will be lost.'
          : 'Reload this spreadsheet if you want the latest saved version from that session.',
      });
    });
  }, [docId, documentRevision, isLoaded]);

  const refreshSelectionState = useCallback(() => {
    try {
      const workbook = workbookRef.current;
      if (!workbook) {
        return;
      }

      const activeSheet = getActiveSheet();
      if (activeSheet?.name) {
        setActiveSheetName(activeSheet.name);
      }

      const liveBounds = getSelectionBounds(getActiveSelection());
      if (liveBounds) {
        lastSelectionRef.current = liveBounds;
      }

      // A parked find result is what the user is actually looking at, so it drives the
      // coordinate box and the formula bar until they select something themselves.
      const selectionBounds = findFocusRef.current ?? liveBounds;
      if (!selectionBounds) {
        setSelectionSummary(emptySelection);
        return;
      }

      const { startRow, endRow, startColumn, endColumn, label, activeCell: activeCellLabel } = selectionBounds;

      const selectedCells = (workbook.getCellsByRange({ row: [startRow, endRow], column: [startColumn, endColumn] }) ??
        []) as (WorkbookCell | null)[][];
      let numericCount = 0;
      let filledCount = 0;
      let sum = 0;

      selectedCells.forEach((row) => {
        row.forEach((cell) => {
          const displayValue = cell?.m ?? cell?.v;
          if (displayValue !== undefined && displayValue !== null && displayValue !== '') {
            filledCount += 1;
          }

          const numericValue = Number(cell?.v);
          if (!Number.isNaN(numericValue) && cell?.v !== '' && cell?.v !== null && cell?.v !== undefined) {
            numericCount += 1;
            sum += numericValue;
          }
        });
      });

      const activeCell = getCellFromSheet(activeSheet, startRow, startColumn);
      const formulaText = normalizeFormulaText(activeCell?.f);
      const cellDisplay = activeCell?.m ?? activeCell?.v ?? '';

      if (!isFormulaEditingRef.current) {
        setFormulaValue(formulaText ?? String(cellDisplay ?? ''));
      }
      setSelectionSummary({
        label,
        activeCell: activeCellLabel,
        numericCount,
        filledCount,
        sum,
        average: numericCount > 0 ? sum / numericCount : 0,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'sheet not found') {
        return;
      }

      console.error('Failed to refresh spreadsheet selection state', error);
    }
  }, []);

  const queueSelectionRefresh = useCallback(() => {
    window.requestAnimationFrame(refreshSelectionState);
  }, [refreshSelectionState]);

  const handleWorkbookReady = useCallback(
    (instance: WorkbookInstance | null) => {
      workbookRef.current = instance;
      if (import.meta.env.DEV) {
        (window as unknown as Record<string, unknown>).__excelWorkbook = instance;
      }
      if (!instance) {
        return;
      }

      window.requestAnimationFrame(() => {
        setActiveSheetName(getRuntimeActiveSheetName());
        try {
          setSheetCount((instance.getAllSheets() as unknown as WorkbookData).length);
        } catch {
          /* the grid is not ready yet; the next operation will refresh the count */
        }
        /*
         * Only "ready" clears the suppression flag. It used to be consumed by whichever
         * operation happened to arrive first, so when a remount produced no operation at
         * all the flag survived and silently swallowed the user's FIRST real edit -- the
         * document stayed marked clean and nothing autosaved until a second edit.
         */
        skipNextWorkbookChangeRef.current = false;
        refreshSelectionState();
      });
    },
    [getRuntimeActiveSheetName, refreshSelectionState],
  );

  const handleWorkbookOperation = useCallback(() => {
    if (skipNextWorkbookChangeRef.current) {
      return;
    }

    userOperationCountRef.current += 1;

    // fortune-sheet emits operations from inside its own render, so every state update
    // here must be deferred or React warns about updating Excel while the grid renders.
    window.requestAnimationFrame(() => {
      markWorkbookDirty();
      setActiveSheetName(getRuntimeActiveSheetName());
      refreshSelectionState();
    });
  }, [getRuntimeActiveSheetName, markWorkbookDirty, refreshSelectionState]);

  const applyPendingCurrencyFormat = useCallback(() => {
    const pending = pendingCurrencyRef.current;
    const workbook = workbookRef.current;
    pendingCurrencyRef.current = null;

    if (!pending || !workbook) {
      return;
    }

    try {
      /*
       * fortune-sheet only strips a currency symbol when the text also has a thousands
       * separator, so "$99.50" would otherwise stay a STRING and be ignored by SUM and
       * by the selection statistics. Coerce the value to the parsed number first, then
       * re-apply the currency display format on top of it.
       */
      const current = workbook.getCellValue(pending.row, pending.column, { type: 'v' });
      if (typeof current !== 'number') {
        workbook.setCellValue(pending.row, pending.column, pending.value);
      }

      workbook.setCellFormat(pending.row, pending.column, 'ct', { fa: pending.format, t: 'n' });
    } catch (error) {
      console.error('Failed to apply currency format', error);
    }
  }, []);

  const workbookHooks = useMemo(
    () => ({
      afterSelectionChange: () => {
        // The user moved the selection themselves; stop overriding with the find result.
        findFocusRef.current = null;
        queueSelectionRefresh();
      },
      beforeUpdateCell: (row: number, column: number, value: unknown) => {
        const currency = typeof value === 'string' ? detectCurrencyFormat(value) : null;
        pendingCurrencyRef.current = currency ? { row, column, ...currency } : null;
        return true;
      },
      afterUpdateCell: () => {
        window.requestAnimationFrame(applyPendingCurrencyFormat);
      },
    }),
    [applyPendingCurrencyFormat, queueSelectionRefresh],
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const refreshLater = window.setTimeout(() => {
      queueSelectionRefresh();
    }, 150);

    return () => window.clearTimeout(refreshLater);
  }, [isLoaded, queueSelectionRefresh, workbookKey]);

  /**
   * Recalculate formulas hydrated from storage, once per mounted workbook.
   *
   * fortune-sheet trusts the cached `v` in `celldata` and never recomputes on load, so a
   * formula displays whatever value was stored beside it: a stale cache stays stale, and a
   * formula rescued by the unload splice (which only carries its text) renders literally
   * and never computes again.
   *
   * This deliberately does NOT live in the workbook-ready callback: mutating grid state
   * from there re-attaches the ref, which re-fires ready, which recalculates again --
   * an infinite loop that crashed the grid outright. Running it from its own effect, well
   * after mount and only for the active sheet, is stable.
   */
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const seedHasFormula = workbookSeedRef.current.some((sheet) =>
      sheet.celldata?.some((entry) => Boolean(entry.v?.f)),
    );
    if (!seedHasFormula) {
      return;
    }

    const timer = window.setTimeout(() => {
      const workbook = workbookRef.current;
      if (!workbook) {
        return;
      }

      try {
        const sheetId = workbook.getSheet()?.id;
        if (!sheetId) {
          return;
        }

        /*
         * Suppress the operations the recalculation itself emits.
         *
         * Back-dating `savedTokenRef` afterwards only corrected the DISPLAYED dirty state:
         * the ops had already bumped the change token and armed the 500ms autosave, so
         * merely opening a workbook that contains a formula wrote a new revision every
         * time. Worse than the churn, that revision bump strands any other open tab in the
         * stale/conflict state -- where normal saving is blocked and its unload snapshot is
         * refused -- from the wholly innocent act of opening the file in a second tab.
         *
         * Gating on the same flag the mount path uses means the ops never reach
         * `markWorkbookDirty` at all, so no timer is ever armed.
         */
        const wasSuppressed = skipNextWorkbookChangeRef.current;
        skipNextWorkbookChangeRef.current = true;
        try {
          workbook.calculateFormula(sheetId);
        } finally {
          // The ops are emitted while calculateFormula runs; release on the next frame so
          // the window in which a real user edit could be swallowed stays ~1 frame.
          window.requestAnimationFrame(() => {
            window.setTimeout(() => {
              skipNextWorkbookChangeRef.current = wasSuppressed;
            }, 0);
          });
        }
      } catch (error) {
        skipNextWorkbookChangeRef.current = false;
        console.error('Formula recalculation on load failed', error);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isLoaded, workbookKey]);

  const replaceWorkbook = useCallback((nextSheets: WorkbookData, options: { markDirty?: boolean } = {}) => {
    const snapshot = structuredClone(nextSheets) as WorkbookData;
    setWorkbookSeed(snapshot);
    setSheetCount(snapshot.length);
    setActiveSheetName(snapshot.find((sheet) => sheet.status === 1)?.name ?? snapshot[0]?.name ?? 'Quarterly Plan');
    setSelectionSummary(emptySelection);
    setFormulaValue('');
    setChartData(null);
    lastSelectionRef.current = null;
    if (countPersistedCells(snapshot) > 0) {
      hasHadCellsRef.current = true;
    }
    skipNextWorkbookChangeRef.current = true;
    setWorkbookKey((current) => current + 1);

    if (options.markDirty) {
      setWorkbookChangeToken((current) => {
        const next = current + 1;
        workbookChangeTokenRef.current = next;
        return next;
      });
    }
  }, []);

  /** The cell the next formula-bar commit will land on, or null when nothing is selected. */
  const resolveWriteTarget = useCallback(() => {
    return findFocusRef.current ?? getSelectionBounds(getActiveSelection()) ?? lastSelectionRef.current;
  }, []);

  const applyFormulaValue = () => {
    const wasEditing = isFormulaEditingRef.current;
    const wasDirty = isFormulaDirtyRef.current;
    const editedTarget = formulaTargetRef.current;

    isFormulaEditingRef.current = false;
    isFormulaDirtyRef.current = false;
    formulaTargetRef.current = null;

    const workbook = workbookRef.current;
    if (!workbook) {
      return;
    }

    /*
     * Commit only what the user actually edited, and commit it to the cell that was
     * selected when the edit STARTED.
     *
     * `onBlur` fires after the grid has already moved the selection, so committing
     * against the live selection wrote into whichever cell was clicked next: merely
     * focusing the formula bar and then clicking another cell copied the first cell's
     * value over the second one, and an uncommitted entry landed in the wrong cell
     * entirely.
     */
    if (!wasEditing || !wasDirty) {
      window.setTimeout(refreshSelectionState, 0);
      return;
    }

    const target = editedTarget ?? resolveWriteTarget();

    /*
     * Never fall back to A1. The old code defaulted startRow/startColumn to 0 whenever
     * the grid reported no selection, so on a viewport where the grid had not been
     * touched every value typed into the formula bar overwrote A1.
     */
    if (!target) {
      setBanner({
        tone: 'warning',
        title: 'Select a cell first.',
        detail: 'Tap or click a cell in the grid, then enter a value in the formula bar.',
      });
      return;
    }

    const { startRow, startColumn } = target;
    const nextRawValue = formulaValue.trim();

    try {
      if (!nextRawValue) {
        workbook.clearCell(startRow, startColumn);
      } else {
        /*
         * Pass the raw text straight through. fortune-sheet parses "=SUM(B2:B4)" exactly
         * as it does for in-cell entry. The previous code wrote the formula TEXT into `v`
         * and `m` and stripped the leading `=` off `f` (which fortune-sheet expects to
         * keep it), so the engine saw a broken cell: =SUM/=AVERAGE became #NAME?,
         * =IF(...) became #ERROR!, and =B2*2 silently evaluated to a wrong number.
         */
        workbook.setCellValue(startRow, startColumn, nextRawValue);

        const currency = detectCurrencyFormat(nextRawValue);
        if (currency) {
          pendingCurrencyRef.current = { row: startRow, column: startColumn, ...currency };
          window.requestAnimationFrame(applyPendingCurrencyFormat);
        }
      }
    } catch (error) {
      console.error('Failed to write cell', error);
      setBanner({ tone: 'error', title: 'That value could not be written to the cell.' });
      return;
    }

    markWorkbookDirty();
    window.setTimeout(refreshSelectionState, 0);
  };

  const withActiveSheet = useCallback(
    (action: (workbook: WorkbookInstance, target: SelectionBounds) => void, requireSelectionMessage: string) => {
      const workbook = workbookRef.current;
      if (!workbook) {
        return;
      }

      const target = resolveWriteTarget();
      if (!target) {
        setBanner({ tone: 'warning', title: requireSelectionMessage });
        return;
      }

      try {
        action(workbook, target);
        markWorkbookDirty();
        window.setTimeout(refreshSelectionState, 0);
      } catch (error) {
        console.error('Spreadsheet action failed', error);
        setBanner({ tone: 'error', title: 'That action could not be completed.' });
      }
    },
    [markWorkbookDirty, refreshSelectionState, resolveWriteTarget],
  );

  const freezePanes = (mode: 'row' | 'column' | 'none') => {
    const workbook = workbookRef.current;
    if (!workbook) {
      return;
    }

    try {
      if (mode === 'none') {
        /*
         * fortune-sheet has no public "unfreeze": `freeze()` always writes a `frozen`
         * descriptor. Writing an unrecognised type leaves the descriptor in place but
         * matches none of the frozen-pane branches, which is how the panes get released.
         */
        (workbook.freeze as unknown as (type: string, range: { row: number; column: number }) => void)('none', {
          row: 0,
          column: 0,
        });
        setBanner({ tone: 'success', title: 'Panes unfrozen.' });
      } else if (mode === 'row') {
        // row_focus is the index of the LAST frozen row, so 0 freezes exactly the top row.
        workbook.freeze('row', { row: 0, column: 0 });
        setBanner({ tone: 'success', title: 'Top row frozen.', detail: 'Row 1 stays visible while you scroll.' });
      } else {
        workbook.freeze('column', { row: 0, column: 0 });
        setBanner({
          tone: 'success',
          title: 'First column frozen.',
          detail: 'Column A stays visible while you scroll.',
        });
      }

      markWorkbookDirty();
    } catch (error) {
      console.error('Freeze failed', error);
      setBanner({ tone: 'error', title: 'Freeze panes could not be applied.' });
    }
  };

  const sortSelection = (ascending: boolean) => {
    withActiveSheet((workbook, target) => {
      const sheet = getActiveSheet();
      const bounds =
        target.startRow === target.endRow && target.startColumn === target.endColumn
          ? getSheetDataBounds(sheet)
          : target;

      if (!bounds) {
        setBanner({ tone: 'warning', title: 'Nothing to sort.' });
        return;
      }

      const rows = (workbook.getCellsByRange({
        row: [bounds.startRow, bounds.endRow],
        column: [bounds.startColumn, bounds.endColumn],
      }) ?? []) as (WorkbookCell | null)[][];

      if (rows.length < 2) {
        setBanner({ tone: 'warning', title: 'Select at least two rows to sort.' });
        return;
      }

      const keyColumn = Math.min(Math.max(0, target.startColumn - bounds.startColumn), (rows[0]?.length ?? 1) - 1);
      const sorted = rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
          const left = a.row[keyColumn];
          const right = b.row[keyColumn];
          const leftNumber = Number(left?.v);
          const rightNumber = Number(right?.v);
          const bothNumeric =
            left?.v !== undefined &&
            left?.v !== null &&
            left?.v !== '' &&
            right?.v !== undefined &&
            right?.v !== null &&
            right?.v !== '' &&
            !Number.isNaN(leftNumber) &&
            !Number.isNaN(rightNumber);

          let comparison: number;
          if (bothNumeric) {
            comparison = leftNumber - rightNumber;
          } else {
            comparison = cellSearchText(left).localeCompare(cellSearchText(right), undefined, { numeric: true });
          }

          if (comparison === 0) {
            comparison = a.index - b.index;
          }

          return ascending ? comparison : -comparison;
        })
        .map((entry) => entry.row.map((cell) => (cell ? { ...cell } : null)));

      workbook.setCellValuesByRange(sorted, {
        row: [bounds.startRow, bounds.endRow],
        column: [bounds.startColumn, bounds.endColumn],
      });

      setBanner({
        tone: 'success',
        title: `Sorted ${bounds.label} ${ascending ? 'A to Z' : 'Z to A'}.`,
        detail: `Ordered by column ${columnLabel(target.startColumn)}.`,
      });
    }, 'Select the range you want to sort.');
  };

  const insertRow = () =>
    withActiveSheet((workbook, target) => {
      workbook.insertRowOrColumn('row', target.startRow, 1, 'lefttop');
    }, 'Select where the new row should go.');

  const deleteRow = () =>
    withActiveSheet((workbook, target) => {
      workbook.deleteRowOrColumn('row', target.startRow, target.endRow);
    }, 'Select the rows to delete.');

  const insertColumn = () =>
    withActiveSheet((workbook, target) => {
      workbook.insertRowOrColumn('column', target.startColumn, 1, 'lefttop');
    }, 'Select where the new column should go.');

  const deleteColumn = () =>
    withActiveSheet((workbook, target) => {
      workbook.deleteRowOrColumn('column', target.startColumn, target.endColumn);
    }, 'Select the columns to delete.');

  const runFind = useCallback((term: string, matchCase: boolean) => {
    const workbook = workbookRef.current;
    if (!workbook || !term) {
      setFindMatches([]);
      setFindIndex(0);
      setFindStatus('');
      return [] as FindMatch[];
    }

    const sheet = getActiveSheet();
    const entries = sheet ? collectSheetCellEntries(sheet) : [];
    const needle = matchCase ? term : term.toLowerCase();

    const matches = entries
      .filter(({ cell }) => {
        const text = cellSearchText(cell);
        return (matchCase ? text : text.toLowerCase()).includes(needle);
      })
      .map(({ row, column }) => ({ row, column }))
      .sort((a, b) => (a.row === b.row ? a.column - b.column : a.row - b.row));

    setFindMatches(matches);
    setFindIndex(0);
    setFindStatus(matches.length === 0 ? `No matches for "${term}".` : `1 of ${matches.length}`);
    return matches;
  }, []);

  const focusMatch = useCallback(
    (matches: FindMatch[], index: number) => {
      const workbook = workbookRef.current;
      const match = matches[index];
      if (!workbook || !match) {
        return;
      }

      try {
        /*
         * Deliberately NOT workbook.setSelection(). In this version of fortune-sheet
         * setSelection stores the caller's own range object into sheet state, where immer
         * freezes it, and a later pass re-runs normalizeSelection over that frozen object
         * and throws "Cannot assign to read only property 'row'" -- which tears down the
         * whole grid. Scrolling the match into view and naming it is safe and still gives
         * real match-to-match navigation.
         */
        workbook.scroll({ targetRow: match.row, targetColumn: match.column });
        findFocusRef.current = {
          startRow: match.row,
          endRow: match.row,
          startColumn: match.column,
          endColumn: match.column,
          label: `${columnLabel(match.column)}${match.row + 1}`,
          activeCell: `${columnLabel(match.column)}${match.row + 1}`,
        };
        setFindStatus(`${index + 1} of ${matches.length} - ${columnLabel(match.column)}${match.row + 1}`);
        window.setTimeout(refreshSelectionState, 0);
      } catch (error) {
        console.error('Could not move to match', error);
      }
    },
    [refreshSelectionState],
  );

  const stepMatch = (delta: number) => {
    if (findMatches.length === 0) {
      const matches = runFind(findTerm, findMatchCase);
      if (matches.length > 0) {
        focusMatch(matches, 0);
      }
      return;
    }

    const next = (findIndex + delta + findMatches.length) % findMatches.length;
    setFindIndex(next);
    focusMatch(findMatches, next);
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const replaceCurrentMatch = () => {
    const workbook = workbookRef.current;
    const match = findMatches[findIndex];
    if (!workbook || !match || !findTerm) {
      return;
    }

    const sheet = getActiveSheet();
    const cell = getCellFromSheet(sheet, match.row, match.column);
    const text = cellSearchText(cell);
    const pattern = new RegExp(escapeRegExp(findTerm), findMatchCase ? '' : 'i');

    workbook.setCellValue(match.row, match.column, text.replace(pattern, replaceTerm));
    markWorkbookDirty();

    window.setTimeout(() => {
      const matches = runFind(findTerm, findMatchCase);
      if (matches.length > 0) {
        focusMatch(matches, 0);
      }
    }, 60);
  };

  const replaceAllMatches = () => {
    const workbook = workbookRef.current;
    if (!workbook || !findTerm) {
      return;
    }

    const sheet = getActiveSheet();
    const entries = sheet ? collectSheetCellEntries(sheet) : [];
    const needle = findMatchCase ? findTerm : findTerm.toLowerCase();
    let replacedCount = 0;

    entries.forEach(({ row, column, cell }) => {
      const text = cellSearchText(cell);
      if (!(findMatchCase ? text : text.toLowerCase()).includes(needle)) {
        return;
      }

      const pattern = new RegExp(escapeRegExp(findTerm), findMatchCase ? 'g' : 'gi');
      workbook.setCellValue(row, column, text.replace(pattern, replaceTerm));
      replacedCount += 1;
    });

    if (replacedCount > 0) {
      markWorkbookDirty();
    }

    setFindStatus(
      replacedCount === 0
        ? `No matches for "${findTerm}".`
        : `Replaced ${replacedCount} cell${replacedCount === 1 ? '' : 's'}.`,
    );
    setFindMatches([]);
    window.setTimeout(refreshSelectionState, 0);
  };

  const openFind = useCallback(() => {
    setIsFindOpen(true);
    window.setTimeout(() => findInputRef.current?.focus(), 0);
  }, []);

  const closeFind = useCallback(() => {
    setIsFindOpen(false);
    findFocusRef.current = null;
    window.setTimeout(refreshSelectionState, 0);
  }, [refreshSelectionState]);

  /** Ctrl/Cmd+S saves, Ctrl/Cmd+F finds. Both used to fall through to the browser. */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 's') {
        event.preventDefault();
        event.stopPropagation();
        void performSaveRef.current();
        return;
      }

      if (key === 'f') {
        event.preventDefault();
        event.stopPropagation();
        openFind();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [openFind]);

  const getExportSheets = useCallback(() => {
    const payload = buildPersistablePayload();
    return payload ?? workbookSeed;
  }, [buildPersistablePayload, workbookSeed]);

  const exportXlsx = async () => {
    if (!workbookRef.current) {
      return;
    }

    const XLSX = await import('xlsx');
    const book = XLSX.utils.book_new();
    const sheets = getExportSheets();

    sheets.forEach((sheet, index) => {
      const worksheet = buildWorksheetFromSheet(XLSX, sheet);
      XLSX.utils.book_append_sheet(book, worksheet, sheet.name || `Sheet${index + 1}`);
    });

    XLSX.writeFile(book, `${fileName || defaultFileName}.xlsx`);
  };

  const exportCsv = () => {
    const sheets = getExportSheets();
    const sheet = sheets.find((candidate) => candidate.status === 1) ?? sheets[0];

    if (!sheet) {
      return;
    }

    const csv = sheetToCsv(sheet);
    // The BOM keeps non-ASCII text readable when the file is opened in Excel.
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName || defaultFileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBanner({
      tone: 'success',
      title: 'CSV exported.',
      detail: `Sheet "${sheet.name}" was written as comma-separated values.`,
    });
  };

  const importWorkbookFile = async (file: File) => {
    if (file.size > maxImportFileBytes) {
      setBanner({
        tone: 'error',
        title: 'Workbook is too large to import safely.',
        detail: 'Choose a smaller spreadsheet before importing it into the browser editor.',
      });
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbookData = XLSX.read(arrayBuffer, {
        type: 'array',
        cellFormula: true,
        cellStyles: true,
      });

      const importedSheets = workbookData.SheetNames.map((sheetName: string, index: number) => {
        const worksheet = workbookData.Sheets[sheetName];
        const cellEntries: NonNullable<WorkbookSheet['celldata']> = [];
        const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;

        if (range) {
          for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
            for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
              const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })];
              if (!cell) {
                continue;
              }

              const hasFormula = typeof cell.f === 'string' && cell.f.length > 0;
              if (!hasFormula && (cell.v === undefined || cell.v === null || cell.v === '')) {
                continue;
              }

              cellEntries.push({
                r: rowIndex,
                c: columnIndex,
                v: {
                  // Keep the cached value; the formula lives in `f` WITH its leading `=`.
                  v: (cell.v ?? '') as string | number | boolean,
                  m: cell.w ?? String(cell.v ?? ''),
                  ...(hasFormula ? { f: `=${cell.f}` } : {}),
                  ...(cell.z ? { ct: { fa: String(cell.z), t: typeof cell.v === 'number' ? 'n' : 'g' } } : {}),
                },
              });
            }
          }
        }

        return {
          name: sheetName,
          id: createId('sheet'),
          status: index === 0 ? 1 : 0,
          celldata: cellEntries,
        };
      });

      setFileName(file.name.replace(/\.[^/.]+$/, '') || defaultFileName);
      replaceWorkbook(importedSheets.length > 0 ? importedSheets : (structuredClone(starterSheets) as WorkbookData), {
        markDirty: true,
      });
      setBanner({
        tone: 'success',
        title: 'Workbook imported.',
        detail: `${importedSheets.length} sheet${importedSheets.length === 1 ? '' : 's'} loaded from the file.`,
      });
    } catch (error) {
      console.error('Workbook import failed', error);
      setBanner({
        tone: 'error',
        title: 'Import failed.',
        detail: 'That workbook could not be parsed in the browser.',
      });
    }
  };

  const buildChartFromSelection = () => {
    const workbook = workbookRef.current;
    const activeSheet = getActiveSheet();
    const activeSelection = getSelectionBounds(getActiveSelection());
    const selectionBounds =
      activeSelection &&
      (activeSelection.startRow !== activeSelection.endRow || activeSelection.startColumn !== activeSelection.endColumn)
        ? activeSelection
        : getSheetDataBounds(activeSheet);

    if (!workbook || !selectionBounds) {
      return null;
    }

    // A chart with tens of thousands of bars is unreadable as well as slow.
    const maxChartRows = 500;
    const endRow = Math.min(selectionBounds.endRow, selectionBounds.startRow + maxChartRows - 1);
    const truncated = endRow < selectionBounds.endRow;

    const rows =
      workbook.getCellsByRange({
        row: [selectionBounds.startRow, endRow],
        column: [selectionBounds.startColumn, selectionBounds.endColumn],
      }) ?? [];
    if (rows.length === 0) {
      return null;
    }

    const labels: string[] = [];
    const values: number[] = [];

    if (rows[0].length >= 2) {
      rows.forEach((row, index) => {
        const labelCell = row[0];
        const numericCell = row.find(
          (cell, cellIndex) =>
            cellIndex > 0 &&
            cell?.v !== undefined &&
            cell?.v !== null &&
            cell?.v !== '' &&
            !Number.isNaN(Number(cell?.v)),
        );
        if (!numericCell) {
          return;
        }

        labels.push(String(labelCell?.m ?? labelCell?.v ?? `Item ${index + 1}`));
        values.push(Number(numericCell.v));
      });
    } else {
      rows.forEach((row, index) => {
        const numericValue = Number(row[0]?.v);
        if (Number.isNaN(numericValue)) {
          return;
        }

        labels.push(`Row ${index + 1}`);
        values.push(numericValue);
      });
    }

    if (values.length === 0) {
      return null;
    }

    return {
      chart: {
        labels,
        datasets: [
          {
            label: getRuntimeActiveSheetName(activeSheetName),
            data: values,
            backgroundColor: 'rgba(37, 99, 235, 0.68)',
            borderRadius: 10,
          },
        ],
      },
      truncated,
    };
  };

  const openChart = () => {
    let result: ReturnType<typeof buildChartFromSelection> = null;
    try {
      result = buildChartFromSelection();
    } catch (error) {
      console.error('Chart build failed', error);
      setBanner({ tone: 'error', title: 'That range could not be charted.' });
      return;
    }

    if (!result) {
      setBanner({
        tone: 'warning',
        title: 'Select data before charting.',
        detail: 'Use one label column and one numeric column, or select a numeric range.',
      });
      return;
    }

    if (result.truncated) {
      setBanner({
        tone: 'warning',
        title: 'Chart shows the first 500 rows.',
        detail: 'Select a smaller range to chart a specific part of this sheet.',
      });
    }

    setChartData(result.chart);
  };

  const saveSummary =
    saveStatus === 'Saved' && lastSavedAt
      ? `Saved ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(lastSavedAt)}`
      : saveStatus;

  /**
   * Compact selection statistics for the status bar, in the order Filled / Numbers / Sum /
   * Average. Empty while nothing is selected, so the bar stays short in the common case.
   * The number formatting is unchanged from the removed sidebar panel.
   *
   * Only Sum survives on a phone. Measured at 390px: the cell reference, the sheet name and
   * all four statistics come to 283px against 342px of usable line, which leaves no room
   * for the 98px "Saved 11:14 AM" on the right. Sum alone fits with room to spare, and
   * fortune-sheet's own strip is directly above reporting Count (the one figure it derives
   * without needing `ct`), so the loss is Average only, and only below 640px.
   */
  const selectionStats: [string, string][] =
    selectionSummary.filledCount > 0
      ? isNarrowStatusBar
        ? [['Sum', selectionSummary.sum.toFixed(selectionSummary.numericCount > 0 ? 2 : 0)]]
        : [
            ['Filled', String(selectionSummary.filledCount)],
            ['Numbers', String(selectionSummary.numericCount)],
            ['Sum', selectionSummary.sum.toFixed(selectionSummary.numericCount > 0 ? 2 : 0)],
            ['Avg', selectionSummary.numericCount > 0 ? selectionSummary.average.toFixed(2) : '0'],
          ]
      : [];

  return (
    <div className="app-container">
      <AppHeader
        appName="NinjaCalc"
        fileName={fileName}
        setFileName={setFileName}
        defaultFileName={defaultFileName}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        saveStatus={saveStatus}
        actions={
          <>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                setImportCandidate(file);
                event.target.value = '';
              }}
            />
            <button className="btn btn-secondary" onClick={() => importInputRef.current?.click()} type="button">
              <Upload size={16} />
              Import workbook
            </button>
            <button className="btn btn-secondary" onClick={exportXlsx} type="button">
              <Download size={16} />
              Export XLSX
            </button>
            <button className="btn btn-secondary" onClick={exportCsv} type="button">
              <FileSpreadsheet size={16} />
              Export CSV
            </button>
          </>
        }
      />

      <Toolbar>
        <ToolbarGroup label="History">
          <ToolbarButton icon={Undo} onClick={() => workbookRef.current?.handleUndo()} title="Undo" />
          <ToolbarButton icon={Redo} onClick={() => workbookRef.current?.handleRedo()} title="Redo" />
          <ToolbarButton icon={Save} onClick={() => void performSaveRef.current()} title="Save now (Ctrl+S)" />
          {(hasConflict || isStale) && (
            <ToolbarButton
              icon={ShieldAlert}
              onClick={() => void performSaveRef.current({ force: true })}
              title="Force save - replace the newer version saved in another tab"
            />
          )}
        </ToolbarGroup>

        <ToolbarGroup label="Sheets">
          <ToolbarButton
            icon={Plus}
            onClick={() => {
              workbookRef.current?.addSheet();
              markWorkbookDirty();
              window.setTimeout(queueSelectionRefresh, 0);
            }}
            title="Add sheet"
          />
          <ToolbarButton icon={Snowflake} onClick={() => freezePanes('row')} title="Freeze top row" />
          <ToolbarButton icon={Columns3} onClick={() => freezePanes('column')} title="Freeze first column" />
          <ToolbarButton icon={X} onClick={() => freezePanes('none')} title="Unfreeze panes" />
        </ToolbarGroup>

        <ToolbarGroup label="Data">
          <ToolbarButton icon={ArrowDownAZ} onClick={() => sortSelection(true)} title="Sort A to Z" />
          <ToolbarButton icon={ArrowUpAZ} onClick={() => sortSelection(false)} title="Sort Z to A" />
          <ToolbarButton icon={Search} onClick={openFind} title="Find and replace (Ctrl+F)" />
        </ToolbarGroup>

        <ToolbarGroup label="Rows and columns">
          <ToolbarButton icon={Rows3} onClick={insertRow} title="Insert row above" />
          <ToolbarButton icon={Trash2} onClick={deleteRow} title="Delete selected rows" />
          <ToolbarButton icon={Columns3} onClick={insertColumn} title="Insert column left" />
          <ToolbarButton icon={Trash2} onClick={deleteColumn} title="Delete selected columns" />
        </ToolbarGroup>

        <ToolbarGroup label="Insights">
          <ToolbarButton icon={BarChart3} onClick={openChart} title="Chart selection" />
        </ToolbarGroup>
      </Toolbar>

      {banner && (
        <div
          className={`editor-banner editor-banner--${banner.tone}`}
          role={banner.tone === 'error' ? 'alert' : 'status'}
          aria-live={banner.tone === 'error' ? 'assertive' : 'polite'}
        >
          <div>
            <div className="editor-banner__text">{banner.title}</div>
            {banner.detail && <div className="editor-banner__hint">{banner.detail}</div>}
            {banner.actions && banner.actions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {banner.actions.map((action) => (
                  <button
                    key={action.label}
                    className={`btn ${action.isPrimary ? 'btn-primary' : 'btn-secondary'}`}
                    type="button"
                    style={{ height: 32, fontSize: 13 }}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(hasConflict || isStale) && banner.tone === 'warning' && (
              <button className="btn btn-secondary" onClick={() => void performSaveRef.current({ force: true })} type="button">
                Force save
              </button>
            )}
            {/*
              While the workbook is locked the banner is the only explanation of why the
              grid is missing and the only way out, so it must not be dismissable.
            */}
            {!isWorkbookUnopenable && (
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setBanner(null)}
                type="button"
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="formula-strip">
        <div className="formula-coordinate">{selectionSummary.activeCell}</div>
        <div className="formula-helper">fx</div>
        <input
          className="formula-input"
          aria-label="Formula input"
          placeholder="Enter a value or formula for the active cell"
          value={formulaValue}
          onFocus={() => {
            isFormulaEditingRef.current = true;
            isFormulaDirtyRef.current = false;
            // Pin the destination now, before a later click can move the selection.
            formulaTargetRef.current = resolveWriteTarget();
          }}
          onChange={(event) => {
            isFormulaEditingRef.current = true;
            isFormulaDirtyRef.current = true;
            if (!formulaTargetRef.current) {
              formulaTargetRef.current = resolveWriteTarget();
            }
            setFormulaValue(event.target.value);
          }}
          onBlur={applyFormulaValue}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyFormulaValue();
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              isFormulaEditingRef.current = false;
              isFormulaDirtyRef.current = false;
              formulaTargetRef.current = null;
              refreshSelectionState();
            }
          }}
        />
      </div>

      {isFindOpen && (
        <div
          role="search"
          aria-label="Find and replace"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border, rgba(148, 163, 184, 0.35))',
            background: 'var(--surface-2, rgba(148, 163, 184, 0.10))',
          }}
        >
          <input
            ref={findInputRef}
            className="formula-input"
            style={{ flex: '1 1 160px', minWidth: '140px' }}
            placeholder="Find in sheet"
            aria-label="Find text"
            value={findTerm}
            onChange={(event) => {
              setFindTerm(event.target.value);
              setFindMatches([]);
              setFindStatus('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (findMatches.length > 0) {
                  const next = (findIndex + 1) % findMatches.length;
                  setFindIndex(next);
                  focusMatch(findMatches, next);
                } else {
                  const matches = runFind(findTerm, findMatchCase);
                  if (matches.length > 0) {
                    focusMatch(matches, 0);
                  }
                }
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                closeFind();
              }
            }}
          />
          <input
            className="formula-input"
            style={{ flex: '1 1 160px', minWidth: '140px' }}
            placeholder="Replace with"
            aria-label="Replace with"
            value={replaceTerm}
            onChange={(event) => setReplaceTerm(event.target.value)}
          />
          <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            <input
              type="checkbox"
              checked={findMatchCase}
              onChange={(event) => {
                setFindMatchCase(event.target.checked);
                setFindMatches([]);
                setFindStatus('');
              }}
            />
            Match case
          </label>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              const matches = runFind(findTerm, findMatchCase);
              if (matches.length > 0) {
                focusMatch(matches, 0);
              }
            }}
          >
            Find
          </button>
          <button
            className="btn btn-secondary btn-icon"
            type="button"
            onClick={() => stepMatch(-1)}
            aria-label="Previous match"
          >
            <ChevronUp size={16} />
          </button>
          <button
            className="btn btn-secondary btn-icon"
            type="button"
            onClick={() => stepMatch(1)}
            aria-label="Next match"
          >
            <ChevronDown size={16} />
          </button>
          <button className="btn btn-secondary" type="button" onClick={replaceCurrentMatch}>
            Replace
          </button>
          <button className="btn btn-secondary" type="button" onClick={replaceAllMatches}>
            Replace all
          </button>
          <span aria-live="polite" style={{ fontSize: '13px', opacity: 0.8, minWidth: '80px' }}>
            {findStatus}
          </span>
          <button
            className="btn btn-secondary btn-icon"
            type="button"
            onClick={closeFind}
            aria-label="Close find and replace"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="workspace">
        <div className="spreadsheet-shell">
          <div className="spreadsheet-container" role="region" aria-label="Spreadsheet grid">
            {/*
              The grid is NOT mounted while the stored workbook is unreadable. Rendering it
              would put the starter workbook on screen looking like the user's file, and it
              is the starter workbook that every save path would have to be trusted not to
              write. Not mounting it removes the payload entirely: `buildPersistablePayload`
              has no workbook instance and returns null.
            */}
            {isWorkbookUnopenable ? (
              <div className="surface-loading" role="status" style={{ padding: 'var(--space-5, 24px)', textAlign: 'center' }}>
                This workbook could not be opened, so the grid was not loaded. Your saved copy has not been changed.
              </div>
            ) : (
              <Suspense fallback={<div className="surface-loading" role="status">Loading spreadsheet engine...</div>}>
                <ExcelWorkbook
                  key={workbookKey}
                  data={workbookSeed}
                  onReady={handleWorkbookReady}
                  onOp={handleWorkbookOperation}
                  hooks={workbookHooks as unknown as Record<string, (...args: unknown[]) => void>}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>

      {/*
        The status bar carries everything the removed "Selection summary" / "Workbook
        status" sidebar used to. The statistics are NOT redundant with fortune-sheet's own
        stat area: that area derives its Sum/Average from `ct.t`, which is only set on
        cells the user typed in this session, so every cell hydrated from stored
        `celldata` (i.e. any reopened or imported workbook) reports a bare "Count: n" with
        no sum and no average.
      */}
      <StatusBar
        leftContent={
          /*
           * One inline span rather than several flex children: below 640px `.status-bar__
           * segment` switches to `display: block` with `text-overflow: ellipsis`, which only
           * truncates inline content. Spacing therefore comes from the separators' own
           * margins so it survives both layouts, and the least important item (the
           * statistics) is last, so that is what the ellipsis eats first on a phone.
           */
          <span className="status-bar__group">
            <span className="status-selection" title="Selected range">
              {selectionSummary.label}
            </span>
            <span aria-hidden="true" style={statusSeparatorStyle}>
              |
            </span>
            <span className="status-sheet" title="Active sheet">
              {activeSheetName}
            </span>
            {sheetCount > 1 && !isNarrowStatusBar && (
              <>
                <span aria-hidden="true" style={statusSeparatorStyle}>
                  |
                </span>
                <span className="status-sheet-count">{sheetCount} sheets</span>
              </>
            )}
            {selectionStats.length > 0 && (
              <>
                <span aria-hidden="true" style={statusSeparatorStyle}>
                  |
                </span>
                {/*
                  The enclosing <footer> is aria-live="polite", and these four numbers change
                  on every arrow-key move. Announcing them each time would bury the save
                  status this region exists to report, so the subtree opts out; the values
                  stay fully readable in browse mode.
                */}
                <span className="status-stats" aria-live="off">
                  {selectionStats.map(([statLabel, statValue], index) => (
                    <span className="status-stat" key={statLabel}>
                      {index > 0 && (
                        <span aria-hidden="true" style={statusDotStyle}>
                          ·
                        </span>
                      )}
                      {statLabel} <strong>{statValue}</strong>
                    </span>
                  ))}
                </span>
              </>
            )}
          </span>
        }
        rightContent={<span className="status-save">{saveSummary}</span>}
      />

      {chartData && (
        <Suspense
          fallback={
            <div className="chart-modal">
              <div className="chart-card surface-loading" role="status">
                Loading chart...
              </div>
            </div>
          }
        >
          <SelectionChart
            activeSheetName={activeSheetName}
            selectionLabel={selectionSummary.label}
            chartData={chartData}
            onClose={() => setChartData(null)}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={Boolean(importCandidate)}
        title="Replace the current workbook?"
        description="Importing a workbook will replace the sheets currently open in this editor."
        confirmLabel="Import workbook"
        // Discarding the open workbook is destructive, so the dialog must not put
        // initial focus on the confirm button -- a stray Enter carried over from
        // the keypress that opened it would otherwise wipe the sheets.
        tone="danger"
        onConfirm={() => {
          if (importCandidate) {
            importWorkbookFile(importCandidate);
          }
          setImportCandidate(null);
        }}
        onClose={() => setImportCandidate(null)}
      />
    </div>
  );
}
