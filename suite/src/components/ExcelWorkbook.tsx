import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import type { WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';

/**
 * Curated subset of fortune-sheet's built-in toolbar.
 *
 * The grid already ships correct, round-trippable implementations of every number
 * format (currency / percent / date / decimals / thousands separator) plus fill,
 * borders, alignment, merge and wrap. Re-implementing those in the app toolbar would
 * mean re-implementing fortune-sheet's `ct` (cell-type/format) model and its number
 * parser, which is a large new bug surface for a purely cosmetic gain. So the built-in
 * toolbar is switched on and cut down to the formatting-only items; everything
 * document-level (undo/redo, sheets, freeze, sort, insert/delete, find, chart,
 * import/export) stays in the app's own toolbar so the two do not overlap.
 */
const SPREADSHEET_TOOLBAR_ITEMS = [
  'format-painter',
  'clear-format',
  '|',
  'currency-format',
  'percentage-format',
  'number-decrease',
  'number-increase',
  'format',
  '|',
  'font-size',
  'bold',
  'italic',
  'underline',
  '|',
  'font-color',
  'background',
  'border',
  '|',
  'horizontal-align',
  'vertical-align',
  'text-wrap',
  'merge-cell',
  '|',
  'filter',
];

interface ExcelWorkbookProps {
  data: unknown[];
  onChange?: (nextData: unknown[]) => void;
  onOp?: (operation: unknown) => void;
  hooks?: Record<string, (...args: unknown[]) => void>;
  onReady?: (instance: WorkbookInstance | null) => void;
}

const ExcelWorkbook = forwardRef<WorkbookInstance, ExcelWorkbookProps>(function ExcelWorkbook(
  { data, onChange, onOp, hooks, onReady },
  ref,
) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  const handleRef = useCallback(
    (instance: WorkbookInstance | null) => {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }

      onReady?.(instance);
    },
    [onReady, ref],
  );

  /**
   * fortune-sheet measures its canvas once on mount and afterwards only re-measures on
   * a window `resize` event. On narrow viewports the sheet pane frequently has not
   * settled to its final height at that moment, so the grid latches a height of 0 and
   * stays invisible forever. With no visible grid there is nothing to tap, the
   * selection never leaves its default, and edits land on A1.
   *
   * Observing our own shell and replaying a `resize` makes the grid re-measure whenever
   * the pane actually gets its height, which is the real fix for the "cannot select a
   * cell on mobile" report.
   */
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof ResizeObserver === 'undefined') {
      return;
    }

    let lastWidth = -1;
    let lastHeight = -1;
    let frame = 0;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;
      if (Math.round(width) === lastWidth && Math.round(height) === lastHeight) {
        return;
      }

      lastWidth = Math.round(width);
      lastHeight = Math.round(height);

      if (width <= 0 || height <= 0) {
        return;
      }

      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    });

    observer.observe(shell);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={shellRef} style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Workbook
        ref={handleRef}
        data={data as never}
        showToolbar
        toolbarItems={SPREADSHEET_TOOLBAR_ITEMS}
        currency="$"
        showFormulaBar={false}
        showSheetTabs
        onChange={onChange ? (nextData) => onChange(nextData as unknown[]) : undefined}
        onOp={onOp}
        hooks={hooks}
      />
    </div>
  );
});

export type { WorkbookInstance };
export default ExcelWorkbook;
