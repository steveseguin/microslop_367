import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Workbook } from '@fortune-sheet/react';
import type { WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { BarChart3, Download, Plus, Redo, Snowflake, Undo, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AppHeader } from '../components/AppHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBar } from '../components/StatusBar';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../components/Toolbar';
import { loadDocument, saveDocument } from '../utils/db';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

export default function Excel({ toggleTheme, isDarkMode }: ExcelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docId] = useState(() => searchParams.get('id') || `excel-${Date.now()}`);
  const [fileName, setFileName] = useState('Untitled Spreadsheet');
  const [data, setData] = useState<any[]>(starterSheets);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formulaValue, setFormulaValue] = useState('');
  const [selectionSummary, setSelectionSummary] = useState<SelectionSummary>(emptySelection);
  const [activeSheetName, setActiveSheetName] = useState('Quarterly Plan');
  const [chartData, setChartData] = useState<any | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [importCandidate, setImportCandidate] = useState<File | null>(null);

  const workbookRef = useRef<WorkbookInstance | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

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
            setData(doc.data);
          }
          setLastSavedAt(doc.updatedAt);
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

    setSaveStatus('Saving...');
    const timeoutId = window.setTimeout(async () => {
      try {
        await saveDocument(docId, fileName, 'excel', data);
        setSaveStatus('Saved');
        setLastSavedAt(Date.now());
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
  }, [data, docId, fileName, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const refreshLater = window.setTimeout(() => {
      refreshSelectionState();
    }, 150);

    return () => window.clearTimeout(refreshLater);
  }, [isLoaded]);

  function syncWorkbookData() {
    if (!workbookRef.current) {
      return;
    }

    setData(workbookRef.current.getAllSheets());
  }

  function refreshSelectionState() {
    const workbook = workbookRef.current;
    if (!workbook) {
      return;
    }

    const activeSheet = workbook.getSheet();
    if (activeSheet?.name) {
      setActiveSheetName(activeSheet.name);
    }

    const selection = workbook.getSelection()?.[0];
    if (!selection) {
      setSelectionSummary(emptySelection);
      setFormulaValue('');
      return;
    }

    const startRow = Math.min(...selection.row);
    const endRow = Math.max(...selection.row);
    const startColumn = Math.min(...selection.column);
    const endColumn = Math.max(...selection.column);
    const label = formatSelectionLabel(startRow, endRow, startColumn, endColumn);
    const activeCell = `${columnLabel(startColumn)}${startRow + 1}`;

    const selectedCells = workbook.getCellsByRange(selection) ?? [];
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

    const formulaText = workbook.getCellValue(startRow, startColumn, { type: 'f' });
    const cellDisplay = workbook.getCellValue(startRow, startColumn, { type: 'm' }) ?? workbook.getCellValue(startRow, startColumn) ?? '';

    setFormulaValue(formulaText ? `=${formulaText}` : String(cellDisplay ?? ''));
    setSelectionSummary({
      label,
      activeCell,
      numericCount,
      filledCount,
      sum,
      average: numericCount > 0 ? sum / numericCount : 0,
    });
  }

  const applyFormulaValue = () => {
    const workbook = workbookRef.current;
    const selection = workbook?.getSelection()?.[0];
    if (!workbook || !selection) {
      return;
    }

    const startRow = Math.min(...selection.row);
    const startColumn = Math.min(...selection.column);
    workbook.setCellValue(startRow, startColumn, formulaValue);
    workbook.calculateFormula();
    syncWorkbookData();
    refreshSelectionState();
  };

  const exportXlsx = () => {
    const workbook = workbookRef.current;
    if (!workbook) {
      return;
    }

    const book = XLSX.utils.book_new();
    const sheets = workbook.getAllSheets();

    sheets.forEach((sheet: any, index: number) => {
      const sheetData = sheet.data;
      const rows: any[][] = [];
      if (sheetData) {
        for (let rowIndex = 0; rowIndex < sheetData.length; rowIndex += 1) {
          const row: any[] = [];
          for (let columnIndex = 0; columnIndex < sheetData[rowIndex].length; columnIndex += 1) {
            const cell = sheetData[rowIndex][columnIndex];
            row.push(cell ? cell.v : '');
          }
          rows.push(row);
        }
      }

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(book, worksheet, sheet.name || `Sheet${index + 1}`);
    });

    XLSX.writeFile(book, `${fileName}.xlsx`);
  };

  const importWorkbookFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbookData = XLSX.read(event.target?.result, { type: 'binary' });
        const importedSheets = workbookData.SheetNames.map((sheetName, index) => {
          const worksheet = workbookData.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          const celldata: any[] = [];

          rows.forEach((row, rowIndex) => {
            row.forEach((value, columnIndex) => {
              if (value !== undefined && value !== null && value !== '') {
                celldata.push({
                  r: rowIndex,
                  c: columnIndex,
                  v: { v: value, m: String(value) },
                });
              }
            });
          });

          return {
            name: sheetName,
            id: `sheet-${Date.now()}-${index}`,
            status: index === 0 ? 1 : 0,
            celldata,
          };
        });

        setFileName(file.name.replace(/\.[^/.]+$/, ''));
        setData(importedSheets.length > 0 ? importedSheets : starterSheets);
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

    reader.readAsBinaryString(file);
  };

  const buildChartFromSelection = () => {
    const workbook = workbookRef.current;
    const selection = workbook?.getSelection()?.[0];
    if (!workbook || !selection) {
      return null;
    }

    const rows = workbook.getCellsByRange(selection) ?? [];
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
          label: activeSheetName,
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
              syncWorkbookData();
              window.setTimeout(refreshSelectionState, 50);
            }}
            title="Add sheet"
          />
          <ToolbarButton
            icon={Snowflake}
            onClick={() => {
              workbookRef.current?.freeze('row', { row: 0, column: 0 });
              syncWorkbookData();
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
        <div className={`editor-banner editor-banner--${banner.tone}`}>
          <div>
            <div className="editor-banner__text">{banner.title}</div>
            {banner.detail && <div className="editor-banner__hint">{banner.detail}</div>}
          </div>
          <button className="btn btn-secondary btn-icon" onClick={() => setBanner(null)} type="button">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="formula-strip">
        <div className="formula-coordinate">{selectionSummary.activeCell}</div>
        <div className="formula-helper">fx</div>
        <input
          className="formula-input"
          placeholder="Enter a value or formula for the active cell"
          value={formulaValue}
          onChange={(event) => setFormulaValue(event.target.value)}
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
        <div className="spreadsheet-shell">
          <div className="spreadsheet-container">
            <Workbook
              ref={workbookRef}
              data={data}
              showToolbar={false}
              showFormulaBar={false}
              showSheetTabs
              onChange={(nextData) => {
                setData(nextData);
                window.requestAnimationFrame(refreshSelectionState);
              }}
              hooks={{
                afterSelectionChange: () => window.requestAnimationFrame(refreshSelectionState),
                afterActivateSheet: () => window.requestAnimationFrame(refreshSelectionState),
                afterAddSheet: () => window.requestAnimationFrame(refreshSelectionState),
              }}
            />
          </div>
        </div>

        <aside className="workspace-sidebar">
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
                  <li>Total sheets: {data.length}</li>
                  <li>Autosave: {saveSummary}</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <StatusBar leftContent={<span>{selectionSummary.label} | {activeSheetName} | {saveSummary}</span>} rightContent={<span>Workbook ready</span>} />

      {chartData && (
        <div className="chart-modal" role="presentation" onClick={() => setChartData(null)}>
          <div className="chart-card" onClick={(event) => event.stopPropagation()}>
            <div className="chart-card__header">
              <div>
                <h3>Selection chart</h3>
                <p className="panel-note">Built from {selectionSummary.label} in {activeSheetName}.</p>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setChartData(null)} type="button">
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 280 }}>
              <Bar options={{ maintainAspectRatio: false, responsive: true }} data={chartData} />
            </div>
          </div>
        </div>
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
