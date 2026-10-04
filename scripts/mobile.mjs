import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const origin = process.env.MOBILE_API_ORIGIN;
if (!origin)
  throw new Error(
    "Set MOBILE_API_ORIGIN to the backend origin. See README.md.",
  );
const url = new URL(origin);
const local = ["localhost", "127.0.0.1"].includes(url.hostname);
const development = process.argv.includes("--development");
if (
  url.origin !== origin ||
  url.username ||
  url.password ||
  (url.protocol !== "https:" &&
    !(development && local && url.protocol === "http:"))
)
  throw new Error(
    "Use an HTTPS origin without credentials or a path. --development permits loopback HTTP only.",
  );
const env = {
  ...process.env,
  VITE_API_ORIGIN: origin,
  VITE_NATIVE_BUILD: "true",
};
for (const args of [
  ["tsc", "--noEmit"],
  ["vite", "build", "--outDir", "../../dist-native"],
]) {
  const result = spawnSync("npx", args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
writeFileSync(
  "dist-native/build-info.json",
  JSON.stringify({ origin, development, createdAt: new Date().toISOString() }),
);

const sync = spawnSync("npx", ["cap", "sync"], { stdio: "inherit", env });
if (sync.status !== 0) process.exit(sync.status ?? 1);
