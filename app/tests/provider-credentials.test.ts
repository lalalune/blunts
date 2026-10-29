import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, chmod, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { providerCredentials } from "../server/provider-credentials.js";
import { ProviderFault } from "../server/provider-transport.js";

test("private provider keys require explicit opt-in and never mutate environment", async () => {
  const root = await mkdtemp(join(tmpdir(), "blunts-private-provider-"));
  const path = join(root, "keys.json");
  const env = {
    PROVIDER_SANDBOX_CREDENTIALS_FILE: path,
    MOONPAY_SECRET_KEY: "",
  };
  try {
    await writeFile(
      path,
      JSON.stringify({
        MOONPAY_PUBLISHABLE_KEY: "pk_test_Synthetic",
        MOONPAY_SECRET_KEY: "sk_test_Synthetic",
      }),
      { mode: 0o600 },
    );
    const loaded = await providerCredentials(env);
    assert.equal(loaded.MOONPAY_PUBLISHABLE_KEY, "pk_test_Synthetic");
    assert.equal(loaded.MOONPAY_SECRET_KEY, "");
    assert.equal("MOONPAY_PUBLISHABLE_KEY" in env, false);
    assert.deepEqual(await providerCredentials({}), {});
    assert.notEqual(loaded, env);
  } finally {
    await rm(root, { recursive: true });
  }
});

test("private provider loader rejects unsafe files, live keys and malformed data with safe errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "blunts-private-provider-"));
  const path = join(root, "keys.json");
  const env = { PROVIDER_SANDBOX_CREDENTIALS_FILE: path };
  const rejected = (error: unknown) =>
    error instanceof ProviderFault &&
    error.kind === "configuration" &&
    error.message === "Provider operation failed (configuration).";
  try {
    await assert.rejects(providerCredentials(env), rejected);
    await writeFile(path, "{}", { mode: 0o600 });
    await chmod(path, 0o644);
    await assert.rejects(providerCredentials(env), rejected);
    await chmod(path, 0o600);
    await assert.rejects(
      providerCredentials({ ...env, NODE_ENV: "production" }),
      rejected,
    );
    await symlink(path, join(root, "link.json"));
    await assert.rejects(
      providerCredentials({
        PROVIDER_SANDBOX_CREDENTIALS_FILE: join(root, "link.json"),
      }),
      rejected,
    );
    await assert.rejects(
      providerCredentials({ PROVIDER_SANDBOX_CREDENTIALS_FILE: root }),
      rejected,
    );
    for (const content of [
      "private-invalid-json",
      "[]",
      "null",
      '{"unexpected":"private-secret"}',
      '{"MOONPAY_SECRET_KEY":"sk_live_Private"}',
      '{"MOONPAY_PUBLISHABLE_KEY":"pk_live_Private"}',
      '{"DINARI_API_SECRET_KEY":42}',
      '{"DINARI_API_SECRET_KEY":"has whitespace"}',
      " ".repeat(16385),
    ]) {
      await writeFile(path, content);
      await assert.rejects(providerCredentials(env), rejected);
    }
  } finally {
    await rm(root, { recursive: true });
  }
});
