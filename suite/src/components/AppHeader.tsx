import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Moon, Sun } from 'lucide-react';

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
        <Link to="/" className="suite-home-link" onClick={handleHomeClick}>
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
            className={`status-pill status-pill--${saveStatus === 'Saved' ? 'success' : saveStatus === 'Saving...' ? 'pending' : 'alert'}`}
            role="status"
            aria-live="polite"
          >
            {saveStatus}
          </span>
        )}
      </div>

      <div className="header-actions">
        {actions && <div className="header-action-cluster">{actions}</div>}
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
