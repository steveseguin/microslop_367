import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, ChevronLeft } from 'lucide-react';
import { designUrl } from '../utils/blueline';
import '../styles/tools.css';
import { SUITE_APPS } from '../utils/suiteApps';
import { AppMark } from './AppMark';

type ToolName =
  | 'NinjaTime'
  | 'NinjaNotes'
  | 'NinjaPDF'
  | 'NinjaImage'
  | 'NinjaSVG'
  | 'NinjaMeet'
  | 'NinjaSync'
  | 'NinjaDrop'
  | 'NinjaChat';

const APP_KIND = {
  NinjaTime: 'time',
  NinjaNotes: 'notes',
  NinjaPDF: 'pdf',
  NinjaImage: 'image',
  NinjaSVG: 'svg',
  NinjaMeet: 'meet',
  NinjaSync: 'sync',
  NinjaDrop: 'drop',
  NinjaChat: 'chat',
} as const;

const HEADLINE = {
  NinjaTime: 'Make your time count.',
  NinjaNotes: 'A place for every thought.',
  NinjaPDF: 'Give your PDFs a finishing touch.',
  NinjaImage: 'Make every photo look its best.',
  NinjaSVG: 'Vector graphics, tweaked and converted.',
  NinjaMeet: 'Meet face to face, from any browser.',
  NinjaSync: 'Your work, on every device.',
  NinjaDrop: 'Send files straight to anyone.',
  NinjaChat: 'Talk in open channels, peer to peer.',
} as const;

function statusTone(status: string, error?: string) {
  if (error || /fail|error|conflict|not applied|read-only/i.test(status))
    return 'alert';
  if (/^saved/i.test(status)) return 'success';
  return 'pending';
}

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
  compact,
  toggleTheme,
  isDarkMode,
}: ToolProps & {
  name: ToolName;
  subtitle: string;
  status: string;
  error?: string;
  children: ReactNode;
  print?: ReactNode;
  hasUnsavedChanges?: boolean;
  /** Drop the page heading once a document is open and space matters. */
  compact?: boolean;
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
      <header className="suite-header tool-header">
        <div className="suite-header__leading">
          <Link
            className="suite-home-link"
            to="/"
            aria-label="Workspace"
            onClick={(e) => {
              if (!canLeave()) e.preventDefault();
            }}
          >
            <span className="suite-home-link__icon">
              <ChevronLeft size={18} />
            </span>
            <span className="suite-home-link__text">Workspace</span>
          </Link>
          <div className="app-brand">
            <AppMark app={APP_KIND[name]} size="sm" className="app-logo-icon" />
            <span className="tool-title">{name}</span>
          </div>
          <span
            className={`status-pill status-pill--${statusTone(status, error)} tool-save`}
            role="status"
          >
            {status}
          </span>
        </div>
        <div className="header-actions">
          <select
            className="suite-app-switcher"
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
            type="button"
            aria-label={
              isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'
            }
            title="Toggle theme"
            onClick={toggleTheme}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      <div className="tool-content">
        <div className={compact ? 'sr-only' : 'tool-heading'}>
          <h1>{HEADLINE[name]}</h1>
          <p>{subtitle}</p>
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
