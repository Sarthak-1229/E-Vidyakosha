import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 120_000,
  reporter: 'list',
  use: { browserName: 'chromium', actionTimeout: 10_000, navigationTimeout: 15_000 },
});
