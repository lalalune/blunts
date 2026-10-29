import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { ProviderFault } from "./provider-transport.js";

const fields = new Set([
  "DINARI_API_KEY_ID",
  "DINARI_API_SECRET_KEY",
  "MOONPAY_PUBLISHABLE_KEY",
  "MOONPAY_SECRET_KEY",
  "MOONPAY_WEBHOOK_KEY",
]);

/** Explicit opt-in only. Never changes process.env or includes secret/path data
 * in errors. An explicitly supplied environment value (even empty) wins. */
export async function providerCredentials(
  env: NodeJS.ProcessEnv = process.env,
): Promise<NodeJS.ProcessEnv> {
  const path = env.PROVIDER_SANDBOX_CREDENTIALS_FILE;
  if (!path) return { ...env };
  if (env.NODE_ENV === "production") throw new ProviderFault("configuration");
  let handle;
  try {
    handle = await open(
      path,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    const stat = await handle.stat();
    if (
      !stat.isFile() ||
      stat.uid !== process.getuid?.() ||
      (stat.mode & 0o777) !== 0o600 ||
      stat.size > 16384
    )
      throw new Error();
    // Bounded read even if another process grows the file after fstat.
    const buffer = Buffer.alloc(16385);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > 16384) throw new Error();
    const value: unknown = JSON.parse(
      buffer.subarray(0, bytesRead).toString("utf8"),
    );
    buffer.fill(0);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    for (const [name, item] of Object.entries(value)) {
      if (
        !fields.has(name) ||
        typeof item !== "string" ||
        item.length > 4096 ||
        /\s|redacted|withheld/i.test(item)
      )
        throw new Error();
      if (
        item &&
        name === "MOONPAY_PUBLISHABLE_KEY" &&
        !/^pk_test_[A-Za-z0-9]+$/.test(item)
      )
        throw new Error();
      if (
        item &&
        name === "MOONPAY_SECRET_KEY" &&
        !/^sk_test_[A-Za-z0-9]+$/.test(item)
      )
        throw new Error();
    }
    return { ...(value as Record<string, string>), ...env };
  } catch {
    throw new ProviderFault("configuration");
  } finally {
    await handle?.close();
  }
}
