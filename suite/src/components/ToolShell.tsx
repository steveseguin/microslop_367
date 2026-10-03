import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, ChevronLeft } from 'lucide-react';
import { designUrl } from '../utils/blueline';
import '../styles/tools.css';
import { SUITE_APPS } from '../utils/suiteApps';

export interface ToolProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export function ToolShell({
  name,
  subtitle,
  status,
  error,
  children,
  print,
  hasUnsavedChanges,
  toggleTheme,
  isDarkMode,
}: ToolProps & {
  name: string;
  subtitle: string;
  status: string;
  error?: string;
  children: ReactNode;
  print?: ReactNode;
  hasUnsavedChanges?: boolean;
}) {
  const navigate = useNavigate();
  const canLeave = () =>
    (!error &&
      !hasUnsavedChanges &&
      status !== 'Saving…' &&
      status !== 'Processing…') ||
    window.confirm(
      'Some changes have not saved. Apply or export your work before leaving. Leave anyway?',
    );
  return (
    <div className="tool-app">
      <header className="tool-header">
        <Link
          className="suite-home-link"
          to="/"
          aria-label="Workspace"
          onClick={(e) => {
            if (!canLeave()) e.preventDefault();
          }}
        >
          <ChevronLeft size={18} />
          <span>Workspace</span>
        </Link>
        <div className="tool-brand">
          <span className={`tool-mark tool-mark--${name.toLowerCase()}`}>
            {name === 'NinjaTime' ? 'T' : name === 'NinjaNotes' ? 'N' : 'P'}
          </span>
          <strong>{name}</strong>
        </div>
        <span className="tool-save" role="status">
          {status}
        </span>
        <select
          aria-label="Switch app"
          value={name}
          onChange={(e) => {
            if (!canLeave()) return;
            const route = SUITE_APPS.find(
              ([label]) => label === e.target.value,
            )?.[1];
            if (route === 'blueline') window.location.assign(designUrl());
            else if (route) navigate(route);
          }}
        >
          {SUITE_APPS.map(([label]) => (
            <option key={label}>{label}</option>
          ))}
        </select>
        <button
          className="btn btn-secondary btn-icon"
          aria-label={
            isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'
          }
          onClick={toggleTheme}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
      <div className="tool-content">
        <div className="tool-heading">
          <div>
            <h1>
              {name === 'NinjaTime'
                ? 'Make your time count.'
                : name === 'NinjaNotes'
                  ? 'A place for every thought.'
                  : 'Give your PDFs a finishing touch.'}
            </h1>
            <p>{subtitle}</p>
          </div>
          <span className="tool-local">Stored in this browser</span>
        </div>
        {error && (
          <div className="tool-alert" role="alert">
            {error}
          </div>
        )}
        {children}
      </div>
      {print && <div className="tool-print">{print}</div>}
    </div>
  );
}
