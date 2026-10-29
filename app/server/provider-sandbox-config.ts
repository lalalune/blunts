import { readFile } from "node:fs/promises";
import { openSandboxDatabase } from "./provider-sandbox-database.js";
import { DinariSandbox } from "./dinari-sandbox.js";
import { MoonPaySandbox } from "./moonpay-sandbox.js";
import { SandboxStore } from "./provider-sandbox-store.js";
import {
  dinariBindings,
  type ProviderSandboxOptions,
} from "./provider-sandbox-api.js";
import { ProviderFault } from "./provider-transport.js";
import { providerCredentials } from "./provider-credentials.js";

export async function openProviderSandbox(
  origin: string,
): Promise<
  { options: ProviderSandboxOptions; close: () => Promise<void> } | undefined
> {
  if (process.env.PROVIDER_SANDBOX !== "1") return;
  const url = new URL(origin);
  if (
    process.env.NODE_ENV === "production" ||
    url.protocol !== "http:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    !["localhost", "127.0.0.1"].includes(process.env.HOST ?? "127.0.0.1")
  )
    throw new ProviderFault("configuration");
  const journal = await openSandboxDatabase();
  const { db } = journal;
  try {
    const options: ProviderSandboxOptions = { store: new SandboxStore(db) };
    const env = await providerCredentials();
    if (env.MOONPAY_PUBLISHABLE_KEY && env.MOONPAY_SECRET_KEY)
      options.moonpay = new MoonPaySandbox({
        publishableKey: env.MOONPAY_PUBLISHABLE_KEY,
        secretKey: env.MOONPAY_SECRET_KEY,
        webhookKey: env.MOONPAY_WEBHOOK_KEY,
      });
    if (env.DINARI_API_KEY_ID && env.DINARI_API_SECRET_KEY)
      options.dinari = new DinariSandbox({
        keyId: env.DINARI_API_KEY_ID,
        secretKey: env.DINARI_API_SECRET_KEY,
      });
    if (env.DINARI_SANDBOX_BINDINGS_FILE)
      options.bindings = dinariBindings.parse(
        JSON.parse(await readFile(env.DINARI_SANDBOX_BINDINGS_FILE, "utf8")),
      );
    return { options, close: () => journal.close() };
  } catch {
    await journal.close();
    throw new ProviderFault("configuration");
  }
}
