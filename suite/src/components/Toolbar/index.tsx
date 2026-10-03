import type { LucideProps } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { MoreHorizontal, Settings2, X } from 'lucide-react';
import { trapFocus } from '../../utils/focusTrap';

/** Must stay in step with the `max-width: 900px` breakpoint in index.css. */
const COMPACT_QUERY = '(max-width: 900px)';

const ARROW_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];

/** Width the "More" trigger needs, including its divider and padding. Measured
 *  from the rendered control; a few px of slack is deliberate. */
const OVERFLOW_TRIGGER_WIDTH = 78;

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

/**
 * The `label` stays part of the public API — the three page files pass it and
 * are owned by other agents — but it is no longer painted as a caption above a
 * bordered card on the desktop ribbon. `aria-label` on the group is what
 * actually carried it to assistive tech all along; the visible `<span>` is
 * hidden by CSS inside `.toolbar` and still shown in the mobile sheet and the
 * overflow menu, where a stacked list genuinely needs headings.
 */
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

/**
 * The desktop ribbon is ONE row and is never allowed to wrap: groups that do
 * not fit are moved into an overflow menu instead. (Wrapping is what turned
 * this bar into 192px of chrome at 1440px, on a job Office does in ~44.)
 *
 * A group is rendered in exactly one place at a time — inline OR in the menu,
 * never both — so no control is ever duplicated in the tab order or in the
 * accessibility tree.
 *
 * That makes natural widths unmeasurable from the live row, so they come from a
 * hidden mirror: `inert` + `aria-hidden` + `visibility: hidden`, laid out at
 * `width: max-content`. Two ResizeObservers drive everything from there — one
 * on the real row (how much space there IS) and one on the mirror (how much
 * space the controls WANT). The mirror observer is what makes this survive a
 * late-arriving webfont, a disabled button changing width, or a page adding a
 * control, with no polling and no re-measure pass that could flash.
 */
function DesktopRibbon({ children }: { children: React.ReactNode }) {
  const groups = React.Children.toArray(children);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const roving = useRovingToolbar(toolbarRef);
  const panelId = useId();

  const total = groups.length;
  const [visibleCount, setVisibleCount] = useState(total);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);

  useLayoutEffect(() => {
    const root = toolbarRef.current;
    const mirror = mirrorRef.current;
    if (!root || !mirror || typeof ResizeObserver === 'undefined') {
      return;
    }

    const fit = () => {
      const widths = [...mirror.children].map((child) => child.getBoundingClientRect().width);
      const available = root.clientWidth;
      const wanted = widths.reduce((sum, width) => sum + width, 0);

      let count = widths.length;
      if (wanted > available + 0.5) {
        let used = 0;
        count = 0;
        for (const width of widths) {
          if (used + width + OVERFLOW_TRIGGER_WIDTH > available) {
            break;
          }
          used += width;
          count += 1;
        }
      }

      // Only ever a no-op or a real change: hiding a group does not resize
      // either observed box, so this cannot feed itself a second callback.
      setVisibleCount((current) => (current === count ? current : count));
    };

    const observer = new ResizeObserver(fit);
    observer.observe(root);
    observer.observe(mirror);
    return () => observer.disconnect();
  }, []);

  // An overflow menu that is open while its contents move back inline would be
  // an empty popover pinned to a button that no longer exists.
  const overflowCount = total - Math.min(visibleCount, total);
  const [lastOverflowCount, setLastOverflowCount] = useState(overflowCount);
  if (lastOverflowCount !== overflowCount) {
    setLastOverflowCount(overflowCount);
    if (overflowCount === 0) {
      setIsOverflowOpen(false);
    }
  }

  useEffect(() => {
    if (!isOverflowOpen) {
      return;
    }

    const closeAndRestore = () => {
      setIsOverflowOpen(false);
      triggerRef.current?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Same contract as the mobile sheet: capture phase and
        // `stopImmediatePropagation`, so one Escape closes the menu and NOT the
        // find-and-replace bar or present mode underneath it.
        event.stopImmediatePropagation();
        event.preventDefault();
        closeAndRestore();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setIsOverflowOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isOverflowOpen]);

  const overflowed = groups.slice(visibleCount);

  return (
    <div className="toolbar-shell">
      {/* Measurement only. `inert` keeps every copy out of the tab order and the
          accessibility tree, so the duplication is invisible to users and to
          assistive tech alike. */}
      <div className="toolbar toolbar--mirror" ref={mirrorRef} aria-hidden="true" inert>
        {groups}
      </div>

      <div
        ref={toolbarRef}
        className="toolbar"
        role="toolbar"
        aria-label="Editing tools"
        aria-orientation="horizontal"
        onKeyDown={roving.onKeyDown}
        onFocus={roving.onFocus}
      >
        {groups.slice(0, visibleCount)}

        {overflowed.length > 0 && (
          <div className="toolbar-overflow-trigger">
            <button
              ref={triggerRef}
              className="toolbar-btn toolbar-more"
              type="button"
              onClick={() => setIsOverflowOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={isOverflowOpen}
              aria-controls={isOverflowOpen ? panelId : undefined}
              aria-label={`More tools (${overflowed.length} groups hidden)`}
              title="More tools"
            >
              <MoreHorizontal size={18} />
              <span className="toolbar-more__label" aria-hidden="true">
                More
              </span>
            </button>
          </div>
        )}
      </div>

      {isOverflowOpen && overflowed.length > 0 && (
        <div
          ref={panelRef}
          id={panelId}
          className="toolbar-overflow-panel"
          role="group"
          aria-label="More editing tools"
          // Same reason as the mobile sheet: several of these tools open a panel
          // that this menu would otherwise cover.
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('button')) {
              setIsOverflowOpen(false);
            }
          }}
        >
          {overflowed}
        </div>
      )}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  const isCompact = useIsCompact();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sheetId = useId();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
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
    return <DesktopRibbon>{children}</DesktopRibbon>;
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
