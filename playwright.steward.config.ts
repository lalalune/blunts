import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
import base from "./playwright.config";
import { localProviderKeys } from "./app/acceptance/provider-fixture";

const stewardUrl = process.env.TEST_STEWARD_URL ?? "http://127.0.0.1:8743";
const parsed = new URL(stewardUrl);
if (
  parsed.protocol !== "http:" ||
  !["localhost", "127.0.0.1"].includes(parsed.hostname) ||
  parsed.username ||
  parsed.password ||
  parsed.search ||
  parsed.hash ||
  parsed.pathname !== "/"
)
  throw new Error("Local acceptance requires a loopback test Steward service.");

export default defineConfig({
  ...base,
  testDir: "./app/acceptance",
  timeout: 150_000,
  use: {
    ...base.use,
    baseURL: "http://localhost:8750",
    actionTimeout: 12_000,
    // The test uses real local sessions; don't collect their HTTP credentials.
    trace: "off",
  },
  webServer: {
    command: "npm run start:legacy",
    env: {
      AUTH_PROVIDER: "steward",
      STEWARD_API_URL: parsed.origin,
      STEWARD_WEB_URL: parsed.origin,
      STEWARD_SESSION_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      MONEY_MODE: "simulation",
      PROVIDER_SANDBOX: "1",
      PROVIDER_SANDBOX_CREDENTIALS_FILE: "",
      MOONPAY_PUBLISHABLE_KEY: localProviderKeys.publishableKey,
      MOONPAY_SECRET_KEY: localProviderKeys.secretKey,
      MOONPAY_WEBHOOK_KEY: localProviderKeys.webhookKey,
      DINARI_API_KEY_ID: "",
      DINARI_API_SECRET_KEY: "",
      DINARI_SANDBOX_BINDINGS_FILE: "",
      PORT: "8750",
      APP_ORIGIN: "http://localhost:8750",
      DATABASE_URL: "data/steward-browser-acceptance",
    },
    url: "http://localhost:8750/api/health",
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    timeout: 90_000,
  },
});
