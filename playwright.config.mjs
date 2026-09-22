import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const { base } = JSON.parse(readFileSync(new URL('./_site/sites.json', import.meta.url), 'utf8'));
export default defineConfig({
  testDir: './tests/hosting',
  fullyParallel: true,
  workers: 2,
  timeout: 45000,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:4178${base}`,
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (!process.env.CI && existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined) },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run preview', url: `http://127.0.0.1:4178${base}`, reuseExistingServer: false },
});
