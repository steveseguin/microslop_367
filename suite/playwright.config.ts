import { defineConfig, devices } from '@playwright/test';

/**
 * The suite always runs against a REAL production build served by `vite preview`.
 *
 * This is deliberate, and it is the single most important decision in this file. The
 * previous config had neither a `baseURL` nor a `webServer`, so whichever server happened
 * to be listening decided what "passing" meant: specs hardcoded `https://localhost:3443`,
 * others defaulted to a preview server nobody had started, and 33 of 38 tests died on
 * ERR_CONNECTION_REFUSED while still reporting a green-ish summary.
 *
 * Running against the build (not the dev server) also means:
 *  - bundle/chunk assertions in `production-build.spec.ts` are meaningful;
 *  - the minified, tree-shaken code is what is exercised;
 *  - `import.meta.env.DEV` escape hatches (e.g. `window.__excelWorkbook`) are absent, so
 *    tests are forced to read state back the way a user would, or straight out of
 *    IndexedDB. Both are real assertions; a dev-only global is not.
 *
 * Override the target with PLAYWRIGHT_BASE_URL only when you are deliberately pointing at
 * something else; the webServer is skipped in that case.
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const PORT = Number(new URL(BASE_URL).port || 80);
const USE_EXTERNAL_SERVER = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: './tests',
  // Helpers live in tests/helpers and must never be collected as specs.
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  /**
   * One worker. Every editor mounts a heavy engine (fortune-sheet canvas, ProseMirror,
   * fabric) and several specs assert on autosave debounce windows; parallel workers make
   * those timings machine-dependent, which is how a suite starts flaking.
   */
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    // No spec may hardcode a host or port. Always navigate with a relative '/#/...' path.
    trace: 'on-first-retry',
    video: 'off',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],

  webServer: USE_EXTERNAL_SERVER
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
        url: BASE_URL,
        /**
         * Never reuse by default. A preview server left running from an earlier build
         * serves STALE code, and the suite would then be reporting on a build that no
         * longer exists — the same class of mistake as having no baseURL at all. If the
         * port is busy the run fails loudly instead of quietly testing the wrong thing.
         *
         * `PLAYWRIGHT_REUSE_SERVER=1` opts into reuse for fast local iteration, and it is
         * then your responsibility to keep that server in step with `npm run build`.
         */
        reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === '1',
        timeout: 240_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
