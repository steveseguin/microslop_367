import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Word = lazy(() => import('./pages/Word'));
const Excel = lazy(() => import('./pages/Excel'));
const PowerPoint = lazy(() => import('./pages/PowerPoint'));
const Time = lazy(() => import('./pages/Time'));
const Notes = lazy(() => import('./pages/Notes'));
const Pdf = lazy(() => import('./pages/Pdf'));
const ImageEditor = lazy(() => import('./pages/Image'));
const Svg = lazy(() => import('./pages/Svg'));

const THEME_KEY = 'officeninja_theme';

type ThemeChoice = 'light' | 'dark';

/** Storage is unavailable in private-browsing modes and throws when the quota is
 *  exhausted. Theming must survive that: only the persistence may degrade. */
function readStoredTheme(): ThemeChoice | null {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'dark' || saved === 'light' ? saved : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: ThemeChoice) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Quota exceeded or storage blocked. The theme still applies for this session.
  }
}

function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

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
  const location = useLocation();
  useEffect(() => {
    const names: Record<string, string> = { '/word': 'NinjaWord', '/excel': 'NinjaCalc', '/powerpoint': 'NinjaSlides', '/time': 'NinjaTime', '/notes': 'NinjaNotes', '/pdf': 'NinjaPDF' };
    document.title = names[location.pathname] ? `${names[location.pathname]} | OfficeNinja` : 'OfficeNinja | Free Office, Design & Productivity Tools';
  }, [location.pathname]);
  // `null` means "no explicit choice yet", so the OS preference stays in charge.
  const [themeChoice, setThemeChoice] = useState<ThemeChoice | null>(() => readStoredTheme());
  const [systemDark, setSystemDark] = useState<boolean>(() => prefersDark());

  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === THEME_KEY) setThemeChoice(readStoredTheme());
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const isDarkMode = themeChoice ? themeChoice === 'dark' : systemDark;

  // Follow the OS until the user picks a theme; an explicit choice always wins.
  useEffect(() => {
    let query: MediaQueryList;
    try {
      query = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return;
    }

    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const theme: ThemeChoice = isDarkMode ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setThemeChoice((current) => {
      const next: ThemeChoice = (current ? current === 'dark' : prefersDark()) ? 'light' : 'dark';
      writeStoredTheme(next);
      return next;
    });
  }, []);

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
        <ErrorBoundary>
          <Suspense fallback={<AppLoading />}>
            <Routes>
              <Route path="/" element={<Dashboard toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
              <Route path="/word" element={<Word toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
              <Route path="/excel" element={<Excel toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
              <Route path="/powerpoint" element={<PowerPoint toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
              <Route path="/time" element={<Time toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
              <Route path="/notes" element={<Notes toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
              <Route path="/pdf" element={<Pdf toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
              <Route path="/image" element={<ImageEditor toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
              <Route path="/svg" element={<Svg toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
