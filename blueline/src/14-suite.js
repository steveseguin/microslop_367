/* OfficeNinja navigation uses normal same-origin pages. No remote-control
   permissions or editor document formats are changed by this integration. */
function getSuiteTheme() {
  try {
    const theme = localStorage.getItem('officeninja_theme');
    if (theme === 'dark' || theme === 'light' || theme === 'system') return theme;
  } catch (e) { /* Fall back to Blueline's existing preference. */ }
  return safeLS.get('blueline:theme', 'system');
}

function applySuiteTheme(theme) {
  const dark = theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const button = $('#suiteTheme');
  if (button) {
    button.textContent = dark ? 'Light mode' : 'Dark mode';
    button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

function syncSuiteFileUrl() {
  if (!D.fileId) return;
  const url = new URL(location.href);
  url.searchParams.delete('new');
  url.searchParams.set('id', D.fileId);
  history.replaceState(null, '', url);
}

async function leaveForSuite(url) {
  endTextEdit(true);
  exitVecEdit(true);
  await saveNow();
  if (saveState !== 'saved' && !confirm('This design could not be saved. Leave anyway? Export a copy first to keep your work.')) return;
  location.assign(url);
}

function initSuiteNavigation() {
  const preference = getSuiteTheme;
  applySuiteTheme(preference());
  $('#suiteTheme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  window.addEventListener('storage', e => { if (e.key === 'officeninja_theme') applySuiteTheme(preference()); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applySuiteTheme(preference()));
  $('#suiteApp').addEventListener('change', async e => {
    const app = e.target.value;
    e.target.value = 'blueline';
    if (app !== 'blueline') await leaveForSuite('../#/' + app);
  });
  $('[data-suite-link]').addEventListener('click', e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    leaveForSuite(e.currentTarget.href);
  });
}
