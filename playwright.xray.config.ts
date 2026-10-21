import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/**
 * File X-ray tests. They run against a LOCAL dev build (production does not
 * have the feature until deployed) and stub /inspect-file with backend-generated
 * fixtures. Override the target with E2E_BASE_URL (then no dev server is started).
 *
 *   npx playwright test -c playwright.xray.config.ts
 */
const external = process.env.E2E_BASE_URL;
const baseURL = external || 'http://localhost:5173';

export default defineConfig({
  ...base,
  testDir: './tests/ui',
  testMatch: 'xray.spec.ts',
  globalSetup: require.resolve('./tests/ui/xray-global-setup.ts'),
  globalTeardown: undefined,
  // The Vite dev server serves unbundled modules; parallel cold browsers make the first render
  // slower than the default 5s expect timeout, so run serially (the suite takes ~25s).
  workers: 1,
  reporter: [['list']],
  use: { ...base.use, baseURL },
  webServer: external
    ? undefined
    : {
        command: 'npm run dev:spa',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
