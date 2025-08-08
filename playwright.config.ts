import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: !!process.env.CI,
    timeout: 60000, // 60 seconds per test
    expect: {
      timeout: 10000, // 10 seconds for expect assertions
    },
  },
});
