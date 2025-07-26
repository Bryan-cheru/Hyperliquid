import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Set to false for demo video
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 0, // No retries for demo
  /* Opt out of parallel tests on CI. */
  workers: 1, // Single worker for clean video
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    
    /* Record video for all tests */
    video: 'on',
    
    /* Run tests in headed mode to see the browser */
    headless: false,
    
    /* Slow down actions for better video */
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    /* Slow down for demo purposes */
    launchOptions: {
      slowMo: 1000, // 1 second delay between actions
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
