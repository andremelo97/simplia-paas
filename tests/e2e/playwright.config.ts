import { defineConfig, devices } from '@playwright/test';

/**
 * PLAYWRIGHT CONFIGURATION
 *
 * E2E testing configuration for Hub and TQ applications.
 * Uses Chromium only for faster execution.
 */
export default defineConfig({
  testDir: '.',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Single worker for consistent test order
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: '../../playwright-report' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    // Collect trace when retrying
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Default timeout for actions
    actionTimeout: 10000,
  },

  // Global timeout
  timeout: 60000,

  // Projects for different apps
  projects: [
    {
      name: 'hub',
      testDir: './hub',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3003',
      },
    },
    {
      name: 'tq',
      testDir: './tq',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3005',
      },
    },
  ],

  // Web servers to start before tests
  // Note: In production, start servers manually before running E2E tests
  // webServer: [
  //   {
  //     command: 'npm run dev:internal',
  //     port: 3001,
  //     reuseExistingServer: !process.env.CI,
  //   },
  //   {
  //     command: 'npm run dev:hub',
  //     port: 3003,
  //     reuseExistingServer: !process.env.CI,
  //   },
  //   {
  //     command: 'npm run dev:tq-front',
  //     port: 3005,
  //     reuseExistingServer: !process.env.CI,
  //   },
  // ],
});
