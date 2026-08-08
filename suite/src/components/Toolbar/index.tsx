import type { LucideProps } from 'lucide-react';
import React, { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { Settings2, X } from 'lucide-react';
import { trapFocus } from '../../utils/focusTrap';

/** Must stay in step with the `max-width: 900px` breakpoint in index.css. */
const COMPACT_QUERY = '(max-width: 900px)';

const ARROW_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];

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
    <section className="toolbar-group" role="group" aria-label={label}>
      {label && <span className="toolbar-group-label">{label}</span>}
      <div className="toolbar-group-controls">{children}</div>
    </section>
  );
}

function subscribeToCompact(onChange: () => void) {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function readCompact() {
  return window.matchMedia(COMPACT_QUERY).matches;
}

function useIsCompact() {
  return useSyncExternalStore(subscribeToCompact, readCompact, () => false);
}

/**
 * WAI-ARIA toolbar behaviour: the whole ribbon is ONE tab stop and the arrow
 * keys move between its buttons. Without it, every button was a tab stop, so
 * reaching the editing surface in NinjaWord took 30 presses of Tab.
 *
 * The button list is read from the DOM on every render and on every key press,
 * so controls added by other parts of the app are picked up automatically.
 */
function useRovingToolbar(ref: React.RefObject<HTMLDivElement | null>) {
  const buttonsOf = (root: HTMLElement) =>
    [...root.querySelectorAll<HTMLButtonElement>('.toolbar-btn')];

  const sync = () => {
    const root = ref.current;
    if (!root) {
      return;
    }

    const buttons = buttonsOf(root);
    const focusable = buttons.filter((button) => !button.disabled);
    if (focusable.length === 0) {
      return;
    }

    const active = document.activeElement;
    const current =
      focusable.find((button) => button === active) ??
      focusable.find((button) => button.tabIndex === 0) ??
      focusable[0];

    for (const button of buttons) {
      button.tabIndex = button === current ? 0 : -1;
    }
  };

  // No dependency list: buttons appear, disappear and toggle `disabled` freely.
  useEffect(sync);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const root = ref.current;
    const target = event.target as HTMLElement;
    if (!root || !ARROW_KEYS.includes(event.key) || !target.classList.contains('toolbar-btn')) {
      return;
    }

    const buttons = buttonsOf(root).filter((button) => !button.disabled);
    const index = buttons.indexOf(target as HTMLButtonElement);
    if (index < 0) {
      return;
    }

    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (index + 1) % buttons.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else {
      next = buttons.length - 1;
    }

    event.preventDefault();
    buttons[next].focus();
  }, [ref]);

  return { onKeyDown: handleKeyDown, onFocus: sync };
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  const isCompact = useIsCompact();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sheetId = useId();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const roving = useRovingToolbar(toolbarRef);
  // Restoring focus to the Ribbon toggle is right when the sheet is dismissed,
  // but wrong when a tool was activated: that tool usually opens a panel and
  // focuses its own field, and a late restore would steal focus back.
  const closedByToolRef = useRef(false);

  // A viewport that grows past the breakpoint must not strand an open sheet, and
  // must not re-open it if the viewport shrinks again. Adjusting during render is
  // the supported pattern for state that derives from a changing input.
  const [compactAtRender, setCompactAtRender] = useState(isCompact);
  if (compactAtRender !== isCompact) {
    setCompactAtRender(isCompact);
    setIsMobileOpen(false);
  }

  const isSheetOpen = isCompact && isMobileOpen;

  useEffect(() => {
    if (!isSheetOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closedByToolRef.current = false;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Capture phase + stopImmediatePropagation so Escape closes ONLY the
        // sheet. Pages bind their own window-level Escape (Word closes find and
        // replace, PowerPoint exits present mode); without this, one press
        // dismissed the sheet and the panel underneath it at the same time.
        event.stopImmediatePropagation();
        event.preventDefault();
        setIsMobileOpen(false);
        return;
      }

      trapFocus(event, sheetRef.current);
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown, true);
      if (closedByToolRef.current) {
        return;
      }

      window.setTimeout(() => {
        previousFocusRef.current?.focus();
      }, 0);
    };
  }, [isSheetOpen]);

  // `children` is rendered in exactly one place at any viewport. Rendering it in
  // both the desktop ribbon and the mobile sheet duplicated every aria-label and
  // put a hidden copy of every control into the tab order.
  if (!isCompact) {
    return (
      <div className="toolbar-shell">
        <div
          ref={toolbarRef}
          className="toolbar"
          role="toolbar"
          aria-label="Editing tools"
          aria-orientation="horizontal"
          onKeyDown={roving.onKeyDown}
          onFocus={roving.onFocus}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mobile-toolbar-launcher">
        <button
          className="mobile-toolbar-toggle"
          onClick={() => setIsMobileOpen(true)}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isMobileOpen}
          aria-controls={isSheetOpen ? sheetId : undefined}
        >
          <Settings2 size={18} />
          <span>Ribbon</span>
        </button>
      </div>

      {isSheetOpen && (
        <div className="mobile-toolbar-modal open" onClick={() => setIsMobileOpen(false)} role="presentation">
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
            {/* Activating a tool dismisses the sheet. Several tools open a panel
                (find and replace, embed image URL) that the sheet would otherwise
                cover while swallowing its pointer events, leaving the user unable
                to reach the very panel they just opened. */}
            <div
              className="mobile-toolbar-body"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('button')) {
                  closedByToolRef.current = true;
                  setIsMobileOpen(false);
                }
              }}
            >
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
