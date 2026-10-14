import { defineConfig } from '@playwright/test';

// Pure policy tests must also run when Expo and the browser are unavailable.
export default defineConfig({
  testDir: './tests', testMatch: '**/inspector-engine.spec.ts',
  fullyParallel: true, workers: 2, reporter: 'list',
});
