import assert from "node:assert/strict";
import { HOSTED_RELEASE_APPROVED } from "../app/shared/release-target.ts";

const origin = process.argv[2] ?? "http://localhost:8746";
const url = new URL(origin);
const expectedHostedSigning = HOSTED_RELEASE_APPROVED;
assert.ok(
  url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname),
  "Container acceptance is loopback-only",
);
const healthResponse = await fetch(`${origin}/api/health`, {
  signal: AbortSignal.timeout(15000),
});
assert.equal(healthResponse.status, 200);
assert.equal(healthResponse.headers.get("cache-control"), "no-store");
const health = await healthResponse.json();
assert.equal(health.ok, true);
assert.equal(health.mode, "evm-preview");
assert.equal(health.origin, "https://blunt.nubs.site");
assert.equal(
  health.transactionsEnabled,
  expectedHostedSigning,
  "Hosted signing must match the reviewed release state",
);
const page = await fetch(origin);
const html = await page.text();
assert.ok(html.includes('id="root"'));
assert.ok(
  page.headers
    .get("content-security-policy")
    ?.includes("frame-ancestors 'none'"),
);
const script = html.match(/src="([^"]+\.js)"/);
assert.ok(script, "Built client script is present");
assert.equal((await fetch(new URL(script[1], origin))).status, 200);
for (const path of ["/api/me", "/api/auth/config", "/api/providers/config"])
  assert.equal((await fetch(`${origin}${path}`)).status, 404);
assert.equal(
  (await fetch(`${origin}/api/onchain/quote?side=fill&amount=invalid`)).status,
  400,
);
assert.equal((await fetch(`${origin}/activity`)).status, 200);
console.log(
  JSON.stringify({
    mode: health.mode,
    origin: health.origin,
    transactionsEnabled: health.transactionsEnabled,
    htmlAndAssets: true,
    legacyRoutesAbsent: true,
    invalidQuoteRejected: true,
  }),
);
