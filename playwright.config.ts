import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        env: {
          NEXT_PUBLIC_API_BASE: 'http://127.0.0.1:8080/v1',
          NEXT_PUBLIC_CDN_BASE: 'https://cdn.decorviz.com',
          NEXT_PUBLIC_USE_PLACEHOLDERS: 'true',
        },
        url: 'http://127.0.0.1:3000/e2e/room',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
