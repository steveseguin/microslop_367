import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { designUrl } from '../utils/blueline';
import { SUITE_APPS } from '../utils/suiteApps';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal, Moon, Sun } from 'lucide-react';

/**
 * Must stay in step with index.css: these are exactly the breakpoints at which
 * `.header-action-cluster` becomes a horizontal scroll container (narrow
 * phones, and phone landscape where height is the scarce axis). Below them the
 * actions are reachable only by swiping a row that gives no hint it scrolls, so
 * they move behind an explicit overflow menu instead.
 */
const HEADER_COMPACT_QUERY = '(max-width: 640px), (max-height: 560px)';

function subscribeToCompact(onChange: () => void) {
  const query = window.matchMedia(HEADER_COMPACT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function readCompact() {
  return window.matchMedia(HEADER_COMPACT_QUERY).matches;
}

function useIsCompact() {
  return useSyncExternalStore(subscribeToCompact, readCompact, () => false);
}

/**
 * The phone-sized presentation of whatever the editor passed as `actions`.
 *
 * Behaviour is deliberately identical to the ribbon's overflow popover in
 * `Toolbar/index.tsx`, so the product has one overflow idiom rather than two:
 * the trigger is the only tab stop while the menu is shut, Escape closes just
 * this menu and returns focus to the trigger, a pointer press outside dismisses
 * it, and activating anything inside dismisses it too.
 *
 * It is entirely `actions`-driven — it never looks at what the individual
 * controls are — because Excel and PowerPoint render this same header with
 * their own action sets.
 */
function HeaderActionOverflow({ actions }: { actions: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      // Capture phase + `stopImmediatePropagation`, the same contract the ribbon
      // and the mobile sheet use: every editor binds its own window-level
      // Escape (Word closes find and replace, PowerPoint leaves present mode),
      // and one press must not dismiss this menu AND the thing underneath it.
      event.stopImmediatePropagation();
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isOpen]);

  return (
    <div className="header-overflow">
      <button
        ref={triggerRef}
        className="btn btn-secondary btn-icon"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label="More actions"
        title="More actions"
      >
        <MoreHorizontal size={18} />
      </button>

      {/*
        Hidden, never unmounted. All three editors pass hidden `<input
        type="file">` elements inside `actions`, and PowerPoint clicks one of
        them by ref from a RIBBON button — unmounting this panel would null that
        ref and silently break image insertion in an editor this file does not
        own. `hidden` keeps the panel out of the tab order and the accessibility
        tree while the refs stay alive.

        The class is dropped while closed so the UA stylesheet's
        `[hidden] { display: none }` can never lose to a `display` declaration
        added to `.header-overflow-panel` later.
      */}
      <div
        ref={panelRef}
        id={panelId}
        hidden={!isOpen}
        className={isOpen ? 'toolbar-overflow-panel header-overflow-panel' : undefined}
        role="group"
        aria-label="More actions"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('button')) {
            setIsOpen(false);
          }
        }}
      >
        {actions}
      </div>
    </div>
  );
}

interface AppHeaderProps {
  appName: 'NinjaWord' | 'NinjaCalc' | 'NinjaSlides';
  fileName: string;
  setFileName: (name: string) => void;
  defaultFileName: string;
  actions?: React.ReactNode;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
  saveStatus?: string;
}

/**
 * Only a state the user needs to act on gets the alert tone. Previously anything
 * that was not exactly "Saved" or "Saving..." was painted amber, so a brand-new
 * untouched document announced itself as a problem ("Not saved yet") before the
 * user had typed a character. Failure and conflict still shout, because those are
 * the states where work is genuinely at risk.
 */
function statusTone(saveStatus: string) {
  if (saveStatus === 'Saved') {
    return 'success';
  }

  if (/fail|error|conflict|read-only|deleted/i.test(saveStatus)) {
    return 'alert';
  }

  return 'pending';
}

function getAppMeta(appName: AppHeaderProps['appName']) {
  if (appName === 'NinjaWord') {
    return { iconLetter: 'W', iconClass: 'word', suiteLabel: 'Documents' };
  }

  if (appName === 'NinjaCalc') {
    return { iconLetter: 'X', iconClass: 'excel', suiteLabel: 'Spreadsheets' };
  }

  return { iconLetter: 'P', iconClass: 'powerpoint', suiteLabel: 'Presentations' };
}

export function AppHeader({
  appName,
  fileName,
  setFileName,
  defaultFileName,
  actions,
  toggleTheme,
  isDarkMode,
  saveStatus,
}: AppHeaderProps) {
  const { iconLetter, iconClass, suiteLabel } = getAppMeta(appName);
  const saveStatusId = useId();
  const isCompact = useIsCompact();
  const navigate = useNavigate();

  const handleHomeClick = (event: React.MouseEvent) => {
    if (saveStatus !== 'Saving...') {
      return;
    }

    if (!window.confirm('Changes are still saving. Leave this editor anyway?')) {
      event.preventDefault();
    }
  };

  const handleFileNameBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const trimmedName = event.target.value.trim();
    setFileName(trimmedName || defaultFileName);
  };

  return (
    <header className="suite-header">
      <div className="suite-header__leading">
        <Link to="/" className="suite-home-link" onClick={handleHomeClick} aria-label="Workspace">
          <span className="suite-home-link__icon">
            <ChevronLeft size={18} />
          </span>
          <span className="suite-home-link__text">Workspace</span>
        </Link>

        <div className="app-brand">
          <div className={`app-logo-icon ${iconClass}`}>{iconLetter}</div>
          <div className="app-brand__copy">
            <span className="app-brand__eyebrow">{suiteLabel}</span>
            <span className="app-title">{appName}</span>
          </div>
        </div>
      </div>

      <div className="suite-header__document">
        <label className="file-name-field">
          <span className="sr-only">File name</span>
          <input
            type="text"
            className="file-name"
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            onBlur={handleFileNameBlur}
            aria-label="File name"
            aria-describedby={saveStatus ? saveStatusId : undefined}
            placeholder={defaultFileName}
          />
        </label>
        {saveStatus && (
          <span
            id={saveStatusId}
            className={`status-pill status-pill--${statusTone(saveStatus)}`}
            role="status"
            aria-live="polite"
          >
            {saveStatus}
          </span>
        )}
      </div>

      <div className="header-actions">
        <select
          className="suite-app-switcher"
          aria-label="Switch app"
          value={appName}
          onChange={(event) => {
            if (saveStatus === 'Saving...' && !window.confirm('Changes are still saving. Leave this editor anyway?')) return;
            const next = event.target.value;
            if (next === 'Blueline') window.location.assign(designUrl());
            else navigate(SUITE_APPS.find(([name]) => name === next)?.[1] ?? '/');
          }}
        >
          {SUITE_APPS.map(([name]) => <option key={name}>{name}</option>)}
        </select>
        {/* Rendered in exactly ONE place at any viewport, so no action is ever
            duplicated in the tab order or the accessibility tree. */}
        {actions &&
          (isCompact ? (
            <HeaderActionOverflow actions={actions} />
          ) : (
            <div className="header-action-cluster">{actions}</div>
          ))}
        {toggleTheme && (
          <button
            className="btn btn-secondary btn-icon"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            type="button"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>
    </header>
  );
}
