import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

process.env.ASSISTANT_TEST_ADMIN_PASSWORD ??= randomUUID();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      downloadsPath: resolve('.cache/downloads', String(process.pid)),
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    },
  },
  projects: [
    { name: 'engine', testMatch: '**/inspector-engine.spec.ts' },
    { name: 'desktop', testIgnore: ['**/responsive.spec.ts', '**/inspector-engine.spec.ts'], use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } } },
    { name: 'mobile', testIgnore: ['**/responsive.spec.ts', '**/inspector-engine.spec.ts'], use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
    { name: 'compact', testMatch: '**/responsive.spec.ts', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [{
    command: 'node scripts/expo.cjs start --web --port 8081 --offline --max-workers 2',
    env: { CI: '1', EXPO_NO_TELEMETRY: '1' },
    // Wait for the first bundle, not just HTML, before starting browser timeouts.
    url: 'http://localhost:8081/index.ts.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=src%2Fapp&unstable_transformProfile=hermes-stable',
    reuseExistingServer: !process.env.CI,
    timeout: 360_000,
  }, {
    command: 'node --experimental-strip-types server/index.ts',
    env: { ASSISTANT_PORT: '8090', ASSISTANT_ADMIN_PASSWORD: process.env.ASSISTANT_TEST_ADMIN_PASSWORD, ASSISTANT_DB_PATH: resolve('.cache', `assistant-e2e-${process.pid}.sqlite`) },
    url: 'http://127.0.0.1:8090/health',
    reuseExistingServer: false,
    timeout: 30_000,
  }],
});
