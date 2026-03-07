import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Download, Plus, Redo, Snowflake, Undo, Upload, X } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBar } from '../components/StatusBar';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../components/Toolbar';
import type { WorkbookInstance } from '../components/ExcelWorkbook';
import { getCurrentClientId, loadDocument, saveDocument, subscribeToDocument } from '../utils/db';

const ExcelWorkbook = lazy(() => import('../components/ExcelWorkbook'));
const SelectionChart = lazy(() => import('../components/SelectionChart'));

interface ExcelProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

interface BannerState {
  tone: 'success' | 'warning' | 'error';
  title: string;
  detail?: string;
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

interface WorkbookCell {
  v?: string | number | boolean | null;
  m?: string;
  f?: string;
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

const emptySelection: SelectionSummary = {
  label: 'A1',
  activeCell: 'A1',
  numericCount: 0,
  filledCount: 0,
  sum: 0,
  average: 0,
};

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

function getWorkbookCellKey(row: number, column: number) {
  return `${row}:${column}`;
}

function normalizeWorkbookCell(value: unknown): WorkbookCell | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'object' && value !== null && ('v' in value || 'm' in value || 'f' in value)) {
    return value as WorkbookCell;
  }

  return {
    v: value as string | number | boolean,
    m: String(value),
  };
}

function collectSheetCellEntries(sheet: WorkbookSheet) {
  const cells = new Map<string, { row: number; column: number; cell: WorkbookCell }>();

  sheet.celldata?.forEach((entry) => {
    cells.set(getWorkbookCellKey(entry.r, entry.c), {
      row: entry.r,
      column: entry.c,
      cell: entry.v,
    });
  });

  sheet.data?.forEach((row, rowIndex) => {
    row?.forEach((value, columnIndex) => {
      const cell = normalizeWorkbookCell(value);
      const key = getWorkbookCellKey(rowIndex, columnIndex);

      if (!cell || (cell.v === '' && !cell.f && cell.m !== '')) {
        cells.delete(key);
        return;
      }

      if (!cell || (cell.v === '' && !cell.f && cell.m === '')) {
        cells.delete(key);
        return;
      }

      cells.set(key, {
        row: rowIndex,
        column: columnIndex,
        cell,
      });
    });
  });

  return [...cells.values()];
}

function buildWorksheetFromSheet(XLSX: XlsxModule, sheet: WorkbookSheet) {
  const worksheet: import('xlsx').WorkSheet = {};
  const entries = collectSheetCellEntries(sheet);

  if (!entries.length) {
    worksheet['!ref'] = 'A1';
    return worksheet;
  }

  let minRow = Number.POSITIVE_INFINITY;
  let minColumn = Number.POSITIVE_INFINITY;
  let maxRow = 0;
  let maxColumn = 0;

  entries.forEach(({ row, column, cell }) => {
    minRow = Math.min(minRow, row);
    minColumn = Math.min(minColumn, column);
    maxRow = Math.max(maxRow, row);
    maxColumn = Math.max(maxColumn, column);

    const address = XLSX.utils.encode_cell({ r: row, c: column });
    const cellValue = cell.f ? cell.v ?? cell.m ?? '' : cell.v ?? cell.m ?? '';
    const worksheetCell: Partial<import('xlsx').CellObject> = {};

    if (typeof cellValue === 'number') {
      worksheetCell.t = 'n';
      worksheetCell.v = cellValue;
    } else if (typeof cellValue === 'boolean') {
      worksheetCell.t = 'b';
      worksheetCell.v = cellValue;
    } else {
      worksheetCell.t = 's';
      worksheetCell.v = String(cellValue);
    }

    if (cell.f) {
      worksheetCell.f = cell.f.startsWith('=') ? cell.f.slice(1) : cell.f;
    }

    if (cell.m && String(cellValue) !== cell.m) {
      worksheetCell.w = cell.m;
    }

    worksheet[address] = worksheetCell as import('xlsx').CellObject;
  });

  worksheet['!ref'] = XLSX.utils.encode_range({
    s: { r: minRow, c: minColumn },
    e: { r: maxRow, c: maxColumn },
  });

  return worksheet;
}

function cloneWorkbookData<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function getSheetNameFromSheets(sheets: WorkbookData, fallback: string) {
  return sheets.find((sheet) => sheet.status === 1)?.name ?? sheets[0]?.name ?? fallback;
}

function getSheetDataBounds(sheet: WorkbookSheet | undefined): SelectionBounds | null {
  if (!sheet) {
    return null;
  }

  const entries = collectSheetCellEntries(sheet);
  if (entries.length === 0) {
    return null;
  }

  const startRow = Math.min(...entries.map((entry) => entry.row));
  const endRow = Math.max(...entries.map((entry) => entry.row));
  const startColumn = Math.min(...entries.map((entry) => entry.column));
  const endColumn = Math.max(...entries.map((entry) => entry.column));

  return {
    startRow,
    endRow,
    startColumn,
    endColumn,
    label: formatSelectionLabel(startRow, endRow, startColumn, endColumn),
    activeCell: `${columnLabel(startColumn)}${startRow + 1}`,
  };
}

export default function Excel({ toggleTheme, isDarkMode }: ExcelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFileName = 'Untitled Spreadsheet';
  const [docId] = useState(() => searchParams.get('id') || `excel-${Date.now()}`);
  const [fileName, setFileName] = useState(defaultFileName);
  const [documentRevision, setDocumentRevision] = useState(0);
  const [workbookSeed, setWorkbookSeed] = useState<WorkbookData>(() => cloneWorkbookData(starterSheets as WorkbookData));
  const [workbookKey, setWorkbookKey] = useState(0);
  const [sheetCount, setSheetCount] = useState(starterSheets.length);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formulaValue, setFormulaValue] = useState('');
  const [selectionSummary, setSelectionSummary] = useState<SelectionSummary>(emptySelection);
  const [activeSheetName, setActiveSheetName] = useState('Quarterly Plan');
  const [chartData, setChartData] = useState<SelectionChartData | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [importCandidate, setImportCandidate] = useState<File | null>(null);
  const [mobileWorkspaceView, setMobileWorkspaceView] = useState<'sheet' | 'insights'>('sheet');

  const workbookRef = useRef<WorkbookInstance | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const documentRevisionRef = useRef(documentRevision);
  const hasInitializedSaveRef = useRef(false);
  const workbookSnapshotRef = useRef<WorkbookData>(cloneWorkbookData(starterSheets as WorkbookData));
  const [workbookChangeToken, setWorkbookChangeToken] = useState(0);
  const skipNextWorkbookChangeRef = useRef(true);
  const activeSheetNameRef = useRef(activeSheetName);
  const isFormulaEditingRef = useRef(false);

  useEffect(() => {
    documentRevisionRef.current = documentRevision;
  }, [documentRevision]);

  useEffect(() => {
    activeSheetNameRef.current = activeSheetName;
  }, [activeSheetName]);

  useEffect(() => {
    if (!searchParams.get('id')) {
      setSearchParams({ id: docId }, { replace: true });
    }
  }, [docId, searchParams, setSearchParams]);

  useEffect(() => {
    if (isLoaded) {
      return;
    }

    loadDocument<any[]>(docId)
      .then((doc) => {
        if (doc && doc.type === 'excel') {
          setFileName(doc.title);
          if (Array.isArray(doc.data) && doc.data.length > 0) {
            const loadedSheets = cloneWorkbookData(doc.data as WorkbookData);
            workbookSnapshotRef.current = loadedSheets;
            setWorkbookSeed(loadedSheets);
            setSheetCount(loadedSheets.length);
            setActiveSheetName(getSheetNameFromSheets(loadedSheets, 'Quarterly Plan'));
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
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load spreadsheet', error);
        setBanner({
          tone: 'error',
          title: 'Spreadsheet failed to load cleanly.',
          detail: 'A starter workbook was opened instead.',
        });
        setIsLoaded(true);
      });
  }, [docId, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!hasInitializedSaveRef.current) {
      hasInitializedSaveRef.current = true;
      return;
    }

    setSaveStatus('Saving...');
    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await saveDocument(docId, fileName, 'excel', cloneWorkbookData(workbookSnapshotRef.current), {
          knownRevision: documentRevisionRef.current,
        });
        setDocumentRevision(result.record.revision);

        if (result.status === 'conflict') {
          setSaveStatus('Conflict detected');
          setBanner({
            tone: 'warning',
            title: 'A newer workbook was saved in another tab.',
            detail: 'Your latest grid changes are still cached locally. Save again from this tab to replace the newer version, or reload to review it first.',
          });
          return;
        }

        setSaveStatus('Saved');
        setLastSavedAt(result.record.updatedAt);
      } catch (error) {
        console.error('Failed to save spreadsheet', error);
        setSaveStatus('Save error');
        setBanner({
          tone: 'error',
          title: 'Autosave failed.',
          detail: 'The workbook stayed open, but local persistence did not complete.',
        });
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [docId, fileName, isLoaded, workbookChangeToken]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    return subscribeToDocument(docId, (event) => {
      if (event.lastSavedBy === getCurrentClientId() || event.revision <= documentRevision) {
        return;
      }

      setBanner({
        tone: 'warning',
        title: 'A newer workbook is available from another tab.',
        detail: 'Reload this spreadsheet if you want the latest saved version from that session.',
      });
    });
  }, [docId, documentRevision, isLoaded]);

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

  const commitWorkbookSnapshot = useCallback((snapshot: WorkbookData, options: { activeSheetName?: string; markDirty?: boolean } = {}) => {
    workbookSnapshotRef.current = snapshot;
    setSheetCount(snapshot.length);
    setActiveSheetName(options.activeSheetName ?? getSheetNameFromSheets(snapshot, activeSheetNameRef.current));

    if (options.markDirty ?? true) {
      setWorkbookChangeToken((current) => current + 1);
    }
  }, []);

  const captureWorkbookSnapshot = useCallback((
    source: unknown,
    options: { activeSheetName?: string; markDirty?: boolean } = {},
  ) => {
    if (!Array.isArray(source)) {
      return false;
    }

    try {
      const snapshot = cloneWorkbookData(source as WorkbookData);
      commitWorkbookSnapshot(snapshot, options);
      return true;
    } catch (error) {
      console.error('Failed to snapshot workbook state', error);
      return false;
    }
  }, [commitWorkbookSnapshot]);

  const captureWorkbookFromInstance = useCallback((options: { activeSheetName?: string; markDirty?: boolean } = {}) => {
    return captureWorkbookSnapshot(workbookRef.current?.getAllSheets() as WorkbookData | undefined, options);
  }, [captureWorkbookSnapshot]);

  const replaceWorkbook = useCallback((nextSheets: WorkbookData, options: { markDirty?: boolean } = {}) => {
    const snapshot = cloneWorkbookData(nextSheets);
    workbookSnapshotRef.current = snapshot;
    setWorkbookSeed(snapshot);
    setSheetCount(snapshot.length);
    setActiveSheetName(getSheetNameFromSheets(snapshot, 'Quarterly Plan'));
    setSelectionSummary(emptySelection);
    setFormulaValue('');
    setChartData(null);
    setMobileWorkspaceView('sheet');
    skipNextWorkbookChangeRef.current = true;
    setWorkbookKey((current) => current + 1);

    if (options.markDirty) {
      setWorkbookChangeToken((current) => current + 1);
    }
  }, []);

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

      const selectionBounds = getSelectionBounds(getActiveSelection());
      if (!selectionBounds) {
        const defaultCell = getCellFromSheet(activeSheet, 0, 0);
        const defaultFormula = defaultCell?.f;
        const defaultDisplay = defaultCell?.m ?? defaultCell?.v ?? '';
        setSelectionSummary(emptySelection);
        if (!isFormulaEditingRef.current) {
          setFormulaValue(defaultFormula ? `=${defaultFormula}` : String(defaultDisplay));
        }
        return;
      }

      const { startRow, endRow, startColumn, endColumn, label, activeCell: activeCellLabel } = selectionBounds;

      const selectedCells = (workbook.getCellsByRange({ row: [startRow, endRow], column: [startColumn, endColumn] }) ?? []) as (WorkbookCell | null)[][];
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
      const formulaText = activeCell?.f;
      const cellDisplay = activeCell?.m ?? activeCell?.v ?? '';

      if (!isFormulaEditingRef.current) {
        setFormulaValue(formulaText ? `=${formulaText}` : String(cellDisplay ?? ''));
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

  const handleWorkbookReady = useCallback((instance: WorkbookInstance | null) => {
    workbookRef.current = instance;
    if (!instance) {
      return;
    }

    window.requestAnimationFrame(() => {
      captureWorkbookFromInstance({
        activeSheetName: getRuntimeActiveSheetName(getSheetNameFromSheets(workbookSeed, 'Quarterly Plan')),
        markDirty: false,
      });
      skipNextWorkbookChangeRef.current = false;
      refreshSelectionState();
    });
  }, [captureWorkbookFromInstance, getRuntimeActiveSheetName, refreshSelectionState, workbookSeed]);

  const handleWorkbookOperation = useCallback(() => {
    const shouldSkipDirtyMark = skipNextWorkbookChangeRef.current;
    if (shouldSkipDirtyMark) {
      skipNextWorkbookChangeRef.current = false;
    }

    window.requestAnimationFrame(() => {
      captureWorkbookFromInstance({
        activeSheetName: getRuntimeActiveSheetName(),
        markDirty: !shouldSkipDirtyMark,
      });
      refreshSelectionState();
    });
  }, [captureWorkbookFromInstance, getRuntimeActiveSheetName, refreshSelectionState]);

  const workbookHooks = useMemo(
    () => ({
      afterSelectionChange: queueSelectionRefresh,
    }),
    [queueSelectionRefresh],
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

  const applyFormulaValue = () => {
    isFormulaEditingRef.current = false;
    const workbook = workbookRef.current;
    const activeSheet = getActiveSheet();
    const selectionBounds = getSelectionBounds(getActiveSelection());
    if (!workbook || !activeSheet?.id) {
      return;
    }

    const startRow = selectionBounds?.startRow ?? 0;
    const startColumn = selectionBounds?.startColumn ?? 0;
    const nextRawValue = formulaValue.trim();

    if (!nextRawValue) {
      workbook.clearCell(startRow, startColumn);
    } else if (nextRawValue.startsWith('=')) {
      workbook.setCellValue(startRow, startColumn, {
        v: nextRawValue,
        m: nextRawValue,
        f: nextRawValue.slice(1),
      });
      workbook.calculateFormula?.(activeSheet.id, {
        row: [startRow, startRow],
        column: [startColumn, startColumn],
      });
    } else {
      workbook.setCellValue(startRow, startColumn, nextRawValue);
    }

    window.setTimeout(refreshSelectionState, 0);
  };

  const exportXlsx = async () => {
    const workbook = workbookRef.current;
    if (!workbook) {
      return;
    }

    const XLSX = await import('xlsx');
    const book = XLSX.utils.book_new();
    captureWorkbookFromInstance({ activeSheetName: getRuntimeActiveSheetName(), markDirty: false });
    const sheets = workbookSnapshotRef.current;

    sheets.forEach((sheet, index) => {
      const worksheet = buildWorksheetFromSheet(XLSX, sheet);
      XLSX.utils.book_append_sheet(book, worksheet, sheet.name || `Sheet${index + 1}`);
    });

    XLSX.writeFile(book, `${fileName}.xlsx`);
  };

  const importWorkbookFile = async (file: File) => {
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

              const rawValue = cell.f ? `=${cell.f}` : cell.v;
              if (rawValue === undefined || rawValue === null || rawValue === '') {
                continue;
              }

              cellEntries.push({
                r: rowIndex,
                c: columnIndex,
                v: {
                  v: rawValue as string | number | boolean,
                  m: cell.w ?? String(rawValue),
                  ...(cell.f ? { f: cell.f } : {}),
                },
              });
            }
          }
        }

        return {
          name: sheetName,
          id: `sheet-${Date.now()}-${index}`,
          status: index === 0 ? 1 : 0,
          celldata: cellEntries,
        };
      });

      setFileName(file.name.replace(/\.[^/.]+$/, ''));
      replaceWorkbook(importedSheets.length > 0 ? importedSheets : cloneWorkbookData(starterSheets as WorkbookData), { markDirty: true });
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

    const rows = workbook.getCellsByRange({
      row: [selectionBounds.startRow, selectionBounds.endRow],
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
        const numericCell = row.find((cell, cellIndex) => cellIndex > 0 && !Number.isNaN(Number(cell?.v)));
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
      labels,
      datasets: [
        {
          label: getRuntimeActiveSheetName(activeSheetName),
          data: values,
          backgroundColor: 'rgba(37, 99, 235, 0.68)',
          borderRadius: 10,
        },
      ],
    };
  };

  const openChart = () => {
    const nextChart = buildChartFromSelection();
    if (!nextChart) {
      setBanner({
        tone: 'warning',
        title: 'Select data before charting.',
        detail: 'Use one label column and one numeric column, or select a numeric range.',
      });
      return;
    }

    setChartData(nextChart);
  };

  const saveSummary =
    saveStatus === 'Saved' && lastSavedAt
      ? `Saved ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(lastSavedAt)}`
      : saveStatus;

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
          </>
        }
      />

      <Toolbar>
        <ToolbarGroup label="History">
          <ToolbarButton icon={Undo} onClick={() => workbookRef.current?.handleUndo()} title="Undo" />
          <ToolbarButton icon={Redo} onClick={() => workbookRef.current?.handleRedo()} title="Redo" />
        </ToolbarGroup>

        <ToolbarGroup label="Sheets">
          <ToolbarButton
            icon={Plus}
            onClick={() => {
              workbookRef.current?.addSheet();
              window.setTimeout(queueSelectionRefresh, 0);
            }}
            title="Add sheet"
          />
          <ToolbarButton
            icon={Snowflake}
            onClick={() => {
              workbookRef.current?.freeze('row', { row: 0, column: 0 });
              setBanner({
                tone: 'success',
                title: 'Top row frozen.',
                detail: 'This sheet will keep the first row visible while scrolling.',
              });
            }}
            title="Freeze top row"
          />
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
          </div>
          <button className="btn btn-secondary btn-icon" onClick={() => setBanner(null)} type="button" aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="workspace-mobile-switcher" role="group" aria-label="Spreadsheet mobile sections">
        <button
          className={`workspace-switcher-tab ${mobileWorkspaceView === 'sheet' ? 'active' : ''}`}
          onClick={() => setMobileWorkspaceView('sheet')}
          type="button"
          aria-pressed={mobileWorkspaceView === 'sheet'}
        >
          Sheet
        </button>
        <button
          className={`workspace-switcher-tab ${mobileWorkspaceView === 'insights' ? 'active' : ''}`}
          onClick={() => setMobileWorkspaceView('insights')}
          type="button"
          aria-pressed={mobileWorkspaceView === 'insights'}
        >
          Insights
        </button>
      </div>

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
          }}
          onChange={(event) => {
            isFormulaEditingRef.current = true;
            setFormulaValue(event.target.value);
          }}
          onBlur={applyFormulaValue}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyFormulaValue();
            }
          }}
        />
        <button className="btn btn-primary" onClick={applyFormulaValue} type="button">
          Apply
        </button>
      </div>

      <div className="workspace">
        <div
          className={`spreadsheet-shell ${mobileWorkspaceView === 'insights' ? 'workspace-pane--hidden-mobile' : ''}`}
          onClick={() => setMobileWorkspaceView('sheet')}
        >
          <div className="spreadsheet-container" role="region" aria-label="Spreadsheet grid">
            <Suspense fallback={<div className="surface-loading" role="status">Loading spreadsheet engine...</div>}>
              <ExcelWorkbook
                key={workbookKey}
                data={workbookSeed}
                onReady={handleWorkbookReady}
                onOp={handleWorkbookOperation}
                hooks={workbookHooks}
              />
            </Suspense>
          </div>
        </div>

        <aside
          className={`workspace-sidebar ${mobileWorkspaceView === 'sheet' ? 'workspace-pane--hidden-mobile' : ''}`}
          onClick={() => setMobileWorkspaceView('insights')}
        >
          <div className="panel-stack">
            <div className="panel-card">
              <div className="panel-section selection-summary">
                <h3>Selection summary</h3>
                <strong>{selectionSummary.label}</strong>
                <p className="panel-note">Sheet: {activeSheetName}</p>
                <div className="selection-summary__stats">
                  <div>
                    <span>Filled cells</span>
                    <strong>{selectionSummary.filledCount}</strong>
                  </div>
                  <div>
                    <span>Numbers</span>
                    <strong>{selectionSummary.numericCount}</strong>
                  </div>
                  <div>
                    <span>Sum</span>
                    <strong>{selectionSummary.sum.toFixed(selectionSummary.numericCount > 0 ? 2 : 0)}</strong>
                  </div>
                  <div>
                    <span>Average</span>
                    <strong>{selectionSummary.numericCount > 0 ? selectionSummary.average.toFixed(2) : '0'}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-section">
                <h3>Workbook status</h3>
                <ul className="panel-list">
                  <li>Open sheet: {activeSheetName}</li>
                  <li>Total sheets: {sheetCount}</li>
                  <li>Autosave: {saveSummary}</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <StatusBar leftContent={<span>{selectionSummary.label} | {activeSheetName} | {saveSummary}</span>} rightContent={<span>Workbook ready</span>} />

      {chartData && (
        <Suspense fallback={<div className="chart-modal"><div className="chart-card surface-loading" role="status">Loading chart...</div></div>}>
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
