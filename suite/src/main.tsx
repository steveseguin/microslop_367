import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { UpdateToast } from './components/UpdateToast.tsx';
import './index.css';
import './styles/dark-mode.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
    {/* Outside the router: the offer to load a new build is not a route, and it must
        survive whatever the editor routes are doing. Renders null unless one is waiting. */}
    <UpdateToast />
  </StrictMode>
);
