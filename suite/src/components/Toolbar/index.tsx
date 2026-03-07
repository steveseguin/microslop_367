import type { LucideProps } from 'lucide-react';
import React, { useEffect, useId, useRef, useState } from 'react';
import { Settings2, X } from 'lucide-react';
import { trapFocus } from '../../utils/focusTrap';

interface ToolbarButtonProps {
  icon: React.ComponentType<LucideProps>;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  title?: string;
}

interface ToolbarGroupProps {
  children: React.ReactNode;
  label?: string;
}

export function ToolbarButton({ icon: Icon, onClick, isActive, isDisabled, title }: ToolbarButtonProps) {
  return (
    <button
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      type="button"
      aria-label={title}
      aria-pressed={isActive}
    >
      <Icon size={18} />
    </button>
  );
}

export function ToolbarGroup({ children, label }: ToolbarGroupProps) {
  return (
    <section className="toolbar-group" aria-label={label}>
      {label && <span className="toolbar-group-label">{label}</span>}
      <div className="toolbar-group-controls">{children}</div>
    </section>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sheetId = useId();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileOpen(false);
        return;
      }

      trapFocus(event, sheetRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.setTimeout(() => {
        previousFocusRef.current?.focus();
      }, 0);
    };
  }, [isMobileOpen]);

  return (
    <>
      <div className="toolbar-shell">
        <div className="toolbar">{children}</div>
      </div>

      <div className="mobile-toolbar-launcher">
        <button
          ref={triggerButtonRef}
          className="mobile-toolbar-toggle"
          onClick={() => setIsMobileOpen(true)}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isMobileOpen}
          aria-controls={sheetId}
        >
          <Settings2 size={18} />
          <span>Ribbon</span>
        </button>
      </div>

      <div
        className={`mobile-toolbar-modal ${isMobileOpen ? 'open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden={!isMobileOpen}
      >
        <div
          ref={sheetRef}
          className="mobile-toolbar-sheet"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id={sheetId}
        >
          <div className="mobile-toolbar-header">
            <div>
              <span className="mobile-toolbar-title" id={titleId}>
                Quick Tools
              </span>
              <span className="mobile-toolbar-subtitle">Editing tools optimized for smaller screens.</span>
            </div>
            <button
              ref={closeButtonRef}
              className="mobile-toolbar-close"
              onClick={() => setIsMobileOpen(false)}
              type="button"
              aria-label="Close ribbon"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mobile-toolbar-body">{children}</div>
        </div>
      </div>
    </>
  );
}
