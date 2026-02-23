import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';

interface AppHeaderProps {
  appName: 'NinjaWord' | 'NinjaCalc' | 'NinjaSlides';
  fileName: string;
  setFileName: (name: string) => void;
  actions?: React.ReactNode;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

export function AppHeader({ appName, fileName, setFileName, actions, toggleTheme, isDarkMode }: AppHeaderProps) {
  const iconLetter = appName === 'NinjaWord' ? 'W' : appName === 'NinjaCalc' ? 'X' : 'P';
  const iconClass = appName === 'NinjaWord' ? 'word' : appName === 'NinjaCalc' ? 'excel' : 'powerpoint';

  return (
    <header className="app-header">
      <Link to="/" className="app-logo">
        <div className={`app-logo-icon ${iconClass}`}>{iconLetter}</div>
        <span className="app-title">{appName}</span>
      </Link>
      <input 
        type="text" 
        className="file-name" 
        value={fileName} 
        onChange={e => setFileName(e.target.value)} 
      />
      <div className="header-actions">
        {toggleTheme && (
          <button className="btn btn-secondary" onClick={toggleTheme} title="Toggle Theme" style={{ padding: '0.4rem' }}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
        {actions}
      </div>
    </header>
  );
}