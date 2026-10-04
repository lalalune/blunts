import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./app/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:8741",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "PORT=8741 APP_ORIGIN=http://localhost:8741 DATABASE_URL=data/e2e npm start",
    url: "http://localhost:8741/api/health",
    reuseExistingServer: false,
    timeout: 90_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
