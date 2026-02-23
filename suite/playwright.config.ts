import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  timeout: 60000,
});