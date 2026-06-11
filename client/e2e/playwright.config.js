import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './flows',
  timeout: 30000,
  retries: 2,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/*.setup.js',
    },
    {
      name: 'default',
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npx vite --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
    cwd: '.',
  },
});
