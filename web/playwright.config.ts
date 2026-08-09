import { defineConfig, devices } from '@playwright/test';

/* Browser-level tests. These cover what the unit and API suites cannot:
   that the rendered page actually works — a button with no handler, a form
   that never submits, a hydration mismatch, a guard that only exists on the
   server. They drive the production build, not the dev server, so what is
   tested is what ships. */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // the suites share one seeded database
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 1 : 0,
  // 'github' turns failures into check annotations, which are readable from
  // the run without downloading the log archive
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'th-TH',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // the ported design has three breakpoints and the phone one was where the
    // dead CSS rules hid; keep a mobile pass on the public site
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /public\.spec\.ts/ },
  ],
  // start the app unless one is already running (CI starts it itself)
  webServer: process.env.BASE_URL
    ? undefined
    : {
      command: 'npm start',
      url: 'http://localhost:3000/api/branding',
      reuseExistingServer: true,
      timeout: 120_000,
    },
});
