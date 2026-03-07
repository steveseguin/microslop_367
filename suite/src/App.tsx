import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Word = lazy(() => import('./pages/Word'));
const Excel = lazy(() => import('./pages/Excel'));
const PowerPoint = lazy(() => import('./pages/PowerPoint'));

function AppLoading() {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <div className="app-loading__card">
        <div className="app-loading__spinner" aria-hidden="true" />
        <div>
          <strong>Loading workspace</strong>
          <p>Opening the editor and preparing local files.</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('officeninja_theme');
    if (savedTheme === 'dark') {
      return true;
    }
    if (savedTheme === 'light') {
      return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('officeninja_theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('officeninja_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const focusMainContent = () => {
    const mainContent = document.getElementById('app-main');
    mainContent?.focus();
    mainContent?.scrollIntoView({ block: 'start' });
  };

  return (
    <div className="app">
      <button className="skip-link" onClick={focusMainContent} type="button">
        Skip to main content
      </button>
      <main id="app-main" className="app-main" tabIndex={-1}>
        <Suspense fallback={<AppLoading />}>
          <Routes>
            <Route path="/" element={<Dashboard toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
            <Route path="/word" element={<Word toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
            <Route path="/excel" element={<Excel toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
            <Route path="/powerpoint" element={<PowerPoint toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
