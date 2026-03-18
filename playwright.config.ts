import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0,
  maxFailures: process.env.CI ? undefined : 5,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  timeout: 15_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixels: 2500,
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    trace: 'on-first-retry',
    actionTimeout: 8_000,
    navigationTimeout: 8_000,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'web',
      testDir: 'apps/web/tests/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'smoke',
      testDir: 'apps/web/tests/e2e',
      testMatch: /smoke\/smoke\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'auth',
      testDir: 'apps/web/tests/e2e',
      testMatch: /auth\/auth-contract\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'guest',
      testDir: 'apps/web/tests/e2e',
      testMatch: /guest\/guest\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'dashboard',
      testDir: 'apps/web/tests/e2e',
      testMatch: /dashboard\/dashboard\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'events',
      testDir: 'apps/web/tests/e2e',
      testMatch: /events\/events\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'games',
      testDir: 'apps/web/tests/e2e',
      testMatch: /games\/games\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'groups',
      testDir: 'apps/web/tests/e2e',
      testMatch: /groups\/groups\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'napkins',
      testDir: 'apps/web/tests/e2e',
      testMatch: /napkins\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'settings',
      testDir: 'apps/web/tests/e2e',
      testMatch: /settings\/settings\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'shell',
      testDir: 'apps/web/tests/e2e',
      testMatch: /shell\/shell\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'admin',
      testDir: 'apps/web/tests/e2e',
      testMatch: /admin\/admin\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'routing',
      testDir: 'apps/web/tests/e2e',
      testMatch: /routing\/redirects\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
  ],
  snapshotPathTemplate:
    '{testDir}/playwright-snapshots/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
})
