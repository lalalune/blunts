// Read-only release acceptance. No provider credentials or wallet RPC methods.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const origin = process.argv[2] ?? "http://127.0.0.1:8755";
const expectedSigning = process.argv[3] === "signing";
const url = new URL(origin);
assert.ok(
  (url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname)) ||
    origin === "https://blunt.nubs.site",
);
const checks = [];
async function get(path, status = 200) {
  const r = await fetch(origin + path, {
    redirect: "error",
    signal: AbortSignal.timeout(45000),
  });
  assert.equal(r.status, status, path);
  assert.ok(
    r.headers
      .get("content-security-policy")
      ?.includes("frame-ancestors 'none'"),
  );
  if (path.startsWith("/api/"))
    assert.equal(r.headers.get("cache-control"), "no-store");
  return r;
}
const health = await (await get("/api/health")).json();
assert.equal(health.origin, "https://blunt.nubs.site");
assert.equal(health.transactionsEnabled, expectedSigning);
const html = await (await get("/")).text();
assert.ok(html.includes('id="root"'));
const asset = html.match(/src="([^\"]+\.js)"/);
assert.ok(asset);
const client = Buffer.from(await (await get(asset[1])).arrayBuffer());
const localClient = readFileSync(resolve("dist", asset[1].replace(/^\//, "")));
assert.equal(
  createHash("sha256").update(client).digest("hex"),
  createHash("sha256").update(localClient).digest("hex"),
);
for (const path of ["/api/auth/config", "/api/me", "/api/providers/config"])
  await get(path, 404);
for (const query of [
  "side=fill&amount=-1",
  "side=fill&amount=1&amount=2",
  "side=spark&amount=0",
  "side=fill&amount=1&unknown=1",
])
  await get("/api/onchain/quote?" + query, 400);
await get("/activity");
for (const path of [
  "/api/onchain/market",
  "/api/onchain/quote?side=fill&amount=1",
  "/api/onchain/quote?side=spark&amount=0.001",
]) {
  const r = await get(path);
  const data = await r.json();
  assert.equal(data.transactionsEnabled, expectedSigning);
  checks.push({
    path,
    status: r.status,
    ...Object.fromEntries(
      [
        "symbol",
        "chainId",
        "generatedAt",
        "side",
        "amountOut",
        "minimumOut",
        "blockNumber",
      ]
        .filter((k) => k in data)
        .map((k) => [k, data[k]]),
    ),
  });
}
console.log(
  JSON.stringify(
    {
      origin,
      checkedAt: new Date().toISOString(),
      transactionsEnabled: expectedSigning,
      htmlAndAssetsVerified: true,
      clientSha256: createHash("sha256").update(client).digest("hex"),
      invalidAndDuplicateInputsRejected: true,
      legacyRoutesAbsent: true,
      checks,
      walletRequests: 0,
      publicWrites: 0,
    },
    null,
    2,
  ),
);
