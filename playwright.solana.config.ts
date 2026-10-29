import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./app/solana-tests",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:8753",
    reducedMotion: "reduce",
    trace: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npx tsx app/server/solana-main.ts",
    url: "http://localhost:8753/api/health",
    reuseExistingServer: true,
  },
});
