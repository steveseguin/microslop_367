import { forwardRef, useCallback } from 'react';
import { Workbook } from '@fortune-sheet/react';
import type { WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';

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

  return (
    <Workbook
      ref={handleRef}
      data={data as never}
      showToolbar={false}
      showFormulaBar={false}
      showSheetTabs
      onChange={onChange ? (nextData) => onChange(nextData as unknown[]) : undefined}
      onOp={onOp}
      hooks={hooks}
    />
  );
});

export type { WorkbookInstance };
export default ExcelWorkbook;
