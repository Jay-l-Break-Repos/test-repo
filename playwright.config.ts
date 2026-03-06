import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  baseURL: 'http://localhost:3000',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});