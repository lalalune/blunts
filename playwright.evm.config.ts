import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./app/evm-tests",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:8751",
    reducedMotion: "reduce",
    trace: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "PORT=8751 npm start",
    url: "http://localhost:8751/api/health",
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 10000 },
  },
});
