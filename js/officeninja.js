// OfficeNinja - Shared Functionality
// Dark Mode, PWA, Chrome AI APIs, Accessibility

(function() {
  'use strict';

  // ==================== THEME MANAGEMENT ====================
  const THEME_KEY = 'officeninja_theme';

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(theme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeToggle(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }

  function updateThemeToggle(theme) {
    const toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(toggle => {
      toggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
  }

  // ==================== PWA INSTALLATION ====================
  let deferredPrompt = null;

  function initPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('OfficeNinja: Service Worker registered'))
        .catch((err) => console.log('OfficeNinja: Service Worker registration failed', err));
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButton();
    });

    // Handle successful install
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      hideInstallButton();
      showToast('OfficeNinja installed successfully!', 'success');
    });
  }

  function showInstallButton() {
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'flex';
  }

  function hideInstallButton() {
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none';
  }

  async function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  }

  // ==================== CHROME AI APIS ====================
  const AI = {
    available: {
      writer: false,
      rewriter: false,
      summarizer: false,
      translator: false,
      languageDetector: false
    },

    async init() {
      // Check for Chrome AI availability
      if ('ai' in self) {
        try {
          // Writer API
          if ('writer' in self.ai) {
            const status = await self.ai.writer.capabilities();
            this.available.writer = status.available !== 'no';
          }

          // Rewriter API
          if ('rewriter' in self.ai) {
            const status = await self.ai.rewriter.capabilities();
            this.available.rewriter = status.available !== 'no';
          }

          // Summarizer API
          if ('summarizer' in self.ai) {
            const status = await self.ai.summarizer.capabilities();
            this.available.summarizer = status.available !== 'no';
          }

          // Translator API
          if ('translator' in self.ai) {
            this.available.translator = true;
          }

          // Language Detector API
          if ('languageDetector' in self.ai) {
            const status = await self.ai.languageDetector.capabilities();
            this.available.languageDetector = status.available !== 'no';
          }

          console.log('OfficeNinja: Chrome AI capabilities:', this.available);
        } catch (e) {
          console.log('OfficeNinja: Chrome AI check failed:', e);
        }
      }
      return this.available;
    },

    async write(prompt, options = {}) {
      if (!this.available.writer) {
        throw new Error('Writer API not available. Enable chrome://flags/#writer-api-for-gemini-nano');
      }
      const writer = await self.ai.writer.create({
        tone: options.tone || 'neutral',
        format: options.format || 'plain-text',
        length: options.length || 'medium'
      });
      return await writer.write(prompt);
    },

    async rewrite(text, options = {}) {
      if (!this.available.rewriter) {
        throw new Error('Rewriter API not available. Enable chrome://flags/#rewriter-api-for-gemini-nano');
      }
      const rewriter = await self.ai.rewriter.create({
        tone: options.tone || 'as-is',
        format: options.format || 'as-is',
        length: options.length || 'as-is'
      });
      return await rewriter.rewrite(text);
    },

    async summarize(text, options = {}) {
      if (!this.available.summarizer) {
        throw new Error('Summarizer API not available. Enable chrome://flags/#summarization-api-for-gemini-nano');
      }
      const summarizer = await self.ai.summarizer.create({
        type: options.type || 'key-points',
        format: options.format || 'plain-text',
        length: options.length || 'medium'
      });
      return await summarizer.summarize(text);
    },

    async translate(text, targetLanguage, sourceLanguage = null) {
      if (!this.available.translator) {
        throw new Error('Translator API not available');
      }
      const translator = await self.ai.translator.create({
        sourceLanguage: sourceLanguage || 'en',
        targetLanguage: targetLanguage
      });
      return await translator.translate(text);
    },

    async detectLanguage(text) {
      if (!this.available.languageDetector) {
        throw new Error('Language Detector API not available');
      }
      const detector = await self.ai.languageDetector.create();
      return await detector.detect(text);
    }
  };

  // ==================== CUSTOM PROMPT MODAL ====================
  function createPromptModal() {
    if (document.getElementById('customPromptModal')) return;

    const modal = document.createElement('div');
    modal.id = 'customPromptModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 id="promptTitle">Input</h3>
          <button class="modal-close" onclick="OfficeNinja.closePrompt()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label id="promptLabel" for="promptInput"></label>
            <input type="text" class="form-control" id="promptInput" autocomplete="off">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="OfficeNinja.closePrompt()">Cancel</button>
          <button class="btn btn-primary" onclick="OfficeNinja.submitPrompt()">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Handle enter key
    document.getElementById('promptInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitPrompt();
      } else if (e.key === 'Escape') {
        closePrompt();
      }
    });
  }

  let promptResolve = null;

  function showPrompt(message, defaultValue = '') {
    createPromptModal();
    return new Promise((resolve) => {
      promptResolve = resolve;
      document.getElementById('promptLabel').textContent = message;
      document.getElementById('promptInput').value = defaultValue;
      document.getElementById('customPromptModal').classList.add('active');
      setTimeout(() => document.getElementById('promptInput').focus(), 100);
    });
  }

  function submitPrompt() {
    const value = document.getElementById('promptInput').value;
    closePrompt();
    if (promptResolve) {
      promptResolve(value);
      promptResolve = null;
    }
  }

  function closePrompt() {
    document.getElementById('customPromptModal')?.classList.remove('active');
    if (promptResolve) {
      promptResolve(null);
      promptResolve = null;
    }
  }

  // ==================== CUSTOM CONFIRM MODAL ====================
  function createConfirmModal() {
    if (document.getElementById('customConfirmModal')) return;

    const modal = document.createElement('div');
    modal.id = 'customConfirmModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 id="confirmTitle">Confirm</h3>
          <button class="modal-close" onclick="OfficeNinja.closeConfirm(false)">&times;</button>
        </div>
        <div class="modal-body">
          <p id="confirmMessage"></p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="OfficeNinja.closeConfirm(false)">Cancel</button>
          <button class="btn btn-danger" id="confirmOkBtn" onclick="OfficeNinja.closeConfirm(true)">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  let confirmResolve = null;

  function showConfirm(message, options = {}) {
    createConfirmModal();
    return new Promise((resolve) => {
      confirmResolve = resolve;
      document.getElementById('confirmMessage').textContent = message;
      document.getElementById('confirmTitle').textContent = options.title || 'Confirm';
      const okBtn = document.getElementById('confirmOkBtn');
      okBtn.textContent = options.okText || 'OK';
      okBtn.className = `btn ${options.danger ? 'btn-danger' : 'btn-primary'}`;
      document.getElementById('customConfirmModal').classList.add('active');
    });
  }

  function closeConfirm(result) {
    document.getElementById('customConfirmModal')?.classList.remove('active');
    if (confirmResolve) {
      confirmResolve(result);
      confirmResolve = null;
    }
  }

  // ==================== ACCESSIBILITY ====================
  function initAccessibility() {
    // Add skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--primary);
      color: white;
      padding: 8px 16px;
      z-index: 10000;
      transition: top 0.3s;
    `;
    skipLink.addEventListener('focus', () => skipLink.style.top = '0');
    skipLink.addEventListener('blur', () => skipLink.style.top = '-40px');
    document.body.prepend(skipLink);

    // Add main content landmark
    const main = document.querySelector('.word-container, .excel-container, .ppt-container, .dashboard');
    if (main) {
      main.id = 'main-content';
      main.setAttribute('role', 'main');
      main.setAttribute('tabindex', '-1');
    }

    // Add ARIA labels to toolbar buttons
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
      if (!btn.getAttribute('aria-label') && btn.title) {
        btn.setAttribute('aria-label', btn.title);
      }
    });

    // Announce live regions for toasts
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
      toastContainer.setAttribute('role', 'status');
      toastContainer.setAttribute('aria-live', 'polite');
    }
  }

  // ==================== MOBILE MENU ====================
  function initMobileMenu() {
    // Create mobile overlay
    if (!document.querySelector('.mobile-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'mobile-overlay';
      overlay.addEventListener('click', closeMobileMenus);
      document.body.appendChild(overlay);
    }
  }

  function toggleMobileMenu(selector) {
    const panel = document.querySelector(selector);
    const overlay = document.querySelector('.mobile-overlay');
    if (panel) {
      panel.classList.toggle('mobile-open');
      overlay?.classList.toggle('active', panel.classList.contains('mobile-open'));
    }
  }

  function closeMobileMenus() {
    document.querySelectorAll('.sidebar, .slide-panel, .ppt-sidebar').forEach(el => {
      el.classList.remove('mobile-open');
    });
    document.querySelector('.mobile-overlay')?.classList.remove('active');
  }

  // ==================== EASTER EGGS ====================
  let konamiCode = [];
  const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  function initEasterEggs() {
    document.addEventListener('keydown', (e) => {
      konamiCode.push(e.key);
      konamiCode = konamiCode.slice(-10);

      if (konamiCode.join(',') === konamiSequence.join(',')) {
        activateNinjaMode();
      }
    });
  }

  function activateNinjaMode() {
    document.body.style.transition = 'transform 0.5s';
    document.body.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      document.body.style.transform = '';
      showToast('🥷 Ninja Mode Activated! You are now a coding ninja!', 'success');
    }, 500);

    // Add ninja stars cursor
    document.body.style.cursor = 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'><text y=\'24\' font-size=\'24\'>🌟</text></svg>"), auto';
    setTimeout(() => document.body.style.cursor = '', 5000);
  }

  // ==================== INITIALIZATION ====================
  function init() {
    initTheme();
    initPWA();
    initAccessibility();
    initMobileMenu();
    initEasterEggs();
    AI.init();

    // Add theme toggle to all pages if not exists
    setTimeout(() => {
      if (!document.querySelector('.theme-toggle')) {
        const header = document.querySelector('.app-header .header-actions, .dashboard-header');
        if (header) {
          const toggle = document.createElement('button');
          toggle.className = 'theme-toggle';
          toggle.onclick = toggleTheme;
          toggle.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
          toggle.setAttribute('aria-label', 'Toggle dark mode');
          if (header.classList.contains('dashboard-header')) {
            header.appendChild(toggle);
          } else {
            header.prepend(toggle);
          }
        }
      }
    }, 100);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== EXPORT API ====================
  window.OfficeNinja = {
    // Theme
    toggleTheme,
    setTheme,

    // PWA
    installPWA,

    // Chrome AI
    AI,

    // Custom Dialogs
    prompt: showPrompt,
    confirm: showConfirm,
    closePrompt,
    submitPrompt,
    closeConfirm,

    // Mobile
    toggleMobileMenu,
    closeMobileMenus,

    // Easter Eggs
    activateNinjaMode
  };

})();
