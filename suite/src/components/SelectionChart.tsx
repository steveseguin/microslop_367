import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
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
import { trapFocus } from '../utils/focusTrap';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SelectionChartProps {
  activeSheetName: string;
  selectionLabel: string;
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderRadius: number;
    }>;
  };
  onClose: () => void;
}

export default function SelectionChart({ activeSheetName, selectionLabel, chartData, onClose }: SelectionChartProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      trapFocus(event, dialogRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.setTimeout(() => {
        previousFocusRef.current?.focus();
      }, 0);
    };
  }, [onClose]);

  return (
    <div className="chart-modal" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="chart-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chart-card__header">
          <div>
            <h3 id={titleId}>Selection chart</h3>
            <p className="panel-note" id={descriptionId}>
              Built from {selectionLabel} in {activeSheetName}.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            className="btn btn-secondary btn-icon"
            onClick={onClose}
            type="button"
            aria-label="Close selection chart"
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 280 }}>
          <Bar options={{ maintainAspectRatio: false, responsive: true }} data={chartData} />
        </div>
      </div>
    </div>
  );
}
