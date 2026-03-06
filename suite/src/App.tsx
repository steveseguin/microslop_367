import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Word from './pages/Word';
import Excel from './pages/Excel';
import PowerPoint from './pages/PowerPoint';

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

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
        <Route path="/word" element={<Word toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
        <Route path="/excel" element={<Excel toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
        <Route path="/powerpoint" element={<PowerPoint toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} />} />
      </Routes>
    </div>
  );
}

export default App;
