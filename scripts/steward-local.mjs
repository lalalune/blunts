// Isolated local acceptance service. Never connects to the owner's deployed
// database, Redis, email service, or wallet root. Mock email exists only here.
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";

const source = process.argv[2];
if (!source || process.env.NODE_ENV === "production")
  throw new Error(
    "Usage: node scripts/steward-local.mjs /absolute/path/to/steward (local testing only)",
  );
const entry = resolve(source, "packages/api/src/embedded.ts");
if (!existsSync(entry)) throw new Error("Steward source checkout not found.");
const data = resolve("data/steward-local");
mkdirSync(data, { recursive: true, mode: 0o700 });
const secretsPath = join(data, ".blunts-local-secrets.json");
try {
  const secrets = Object.fromEntries(
    [
      "STEWARD_JWT_SECRET",
      "STEWARD_AUDIT_HMAC_KEY",
      "STEWARD_EMAIL_CODE_SECRET",
      "STEWARD_EXECUTION_AUTH_SECRET",
    ].map((name) => [name, randomBytes(32).toString("hex")]),
  );
  writeFileSync(secretsPath, JSON.stringify(secrets), {
    mode: 0o600,
    flag: "wx",
  });
} catch (e) {
  if (e.code !== "EEXIST") throw e;
}
const secrets = JSON.parse(readFileSync(secretsPath, "utf8"));
const child = spawn("bun", ["run", entry], {
  cwd: resolve(source),
  stdio: "inherit",
  env: {
    // Deliberately do not inherit service credentials or provider configuration.
    PATH: process.env.PATH,
    NODE_ENV: "test",
    EMAIL_PROVIDER: "mock",
    SMS_PROVIDER: "mock",
    PORT: "8743",
    APP_URL: "http://localhost:8743",
    STEWARD_PGLITE_PATH: data,
    STEWARD_BIND_HOST: "127.0.0.1",
    ...secrets,
  },
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("error", () => {
  console.error("Install Bun and build Steward's API dependencies first.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
