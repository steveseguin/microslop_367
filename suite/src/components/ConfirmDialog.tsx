import { useEffect, useId, useRef } from 'react';
import { trapFocus } from '../utils/focusTrap';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Callers pass onClose as an inline arrow, so its identity changes every
  // render. Keeping it in a ref stops the open-effect below from re-running,
  // which would otherwise re-steal focus and overwrite previousFocusRef with
  // the dialog's own button, breaking focus restoration.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const isDestructive = tone === 'danger';

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    // Never put initial focus on a destructive action: a stray Enter carried
    // over from the triggering keypress would confirm it.
    const initialFocus = isDestructive ? cancelButtonRef.current : confirmButtonRef.current;
    initialFocus?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      trapFocus(event, dialogRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.setTimeout(() => {
        previousFocusRef.current?.focus();
      }, 0);
    };
  }, [isDestructive, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className="dialog-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
      >
        <h2 id={dialogTitleId}>{title}</h2>
        <p id={dialogDescriptionId}>{description}</p>
        <div className="dialog-card__actions">
          <button ref={cancelButtonRef} className="btn btn-secondary" onClick={onClose} type="button">
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
