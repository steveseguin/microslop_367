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
  saveStatus?: string;
}

export function AppHeader({ appName, fileName, setFileName, actions, toggleTheme, isDarkMode, saveStatus }: AppHeaderProps) {
  const iconLetter = appName === 'NinjaWord' ? 'W' : appName === 'NinjaCalc' ? 'X' : 'P';
  const iconClass = appName === 'NinjaWord' ? 'word' : appName === 'NinjaCalc' ? 'excel' : 'powerpoint';

  const handleHomeClick = (e: React.MouseEvent) => {
    if (saveStatus === 'Saving...') {
      if (!window.confirm("Your changes are still saving. Are you sure you want to go back to the dashboard?")) {
        e.preventDefault();
      }
    }
  };

  return (
    <header className="app-header">
      <Link to="/" className="app-logo" onClick={handleHomeClick}>
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