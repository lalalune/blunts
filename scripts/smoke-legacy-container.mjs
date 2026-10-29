import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const origin = process.argv[2] ?? "http://localhost:8746";
const url = new URL(origin);
assert.ok(
  url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname),
  "Container acceptance is loopback-only",
);
let cookie = "",
  csrf = "";
async function request(path, body, key) {
  const response = await fetch(`${origin}/api${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      origin,
      "x-blunts-request": "1",
      "content-type": "application/json",
      cookie,
      "x-csrf-token": csrf,
      ...(key ? { "idempotency-key": key } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  assert.ok(response.ok, `${path}: ${response.status}`);
  if (response.headers.get("set-cookie"))
    cookie = response.headers.get("set-cookie").split(";")[0];
  if (data.csrf) csrf = data.csrf;
  return data;
}
async function settled(check) {
  for (let i = 0; i < 30; i++) {
    const me = await request("/me");
    if (check(me)) return me;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Simulated settlement timed out");
}
const health = await request("/health");
assert.equal(health.mode, "simulation");
assert.equal(health.liveMoneyEnabled, false);
assert.equal(
  (await request("/auth/config")).provider,
  "demo",
  "Use the explicit demo auth fixture",
);
const html = await fetch(origin, { redirect: "error" });
assert.ok((await html.text()).includes('id="root"'));
await request("/auth/register", {
  handle: `container_${Date.now()}`,
  password: "local-container-test-only",
});
await request("/onboarding", {
  adult: true,
  simulation: true,
  agreement: "sandbox-v1",
});
await request("/flows", { kind: "fill", amount: "100" }, randomUUID());
await settled(
  (me) =>
    me.balances.investmentValue === "9900" && me.flows[0].state === "completed",
);
await request(
  "/flows",
  { kind: "spark", amount: "99", all: true },
  randomUUID(),
);
await settled(
  (me) =>
    me.balances.availableCash === "9801" && me.flows[0].state === "completed",
);
const destination = await request("/destinations", {
  label: "Container fixture",
  rail: "wallet_demo",
  password: "local-container-test-only",
});
const quote = await request("/quotes", {
  kind: "payout",
  amount: "98.01",
  destinationId: destination.id,
});
await request(
  "/intents",
  { quoteId: quote.id, password: "local-container-test-only" },
  randomUUID(),
);
const me = await settled(
  (me) =>
    me.balances.cash === "0" &&
    me.balances.units === "0" &&
    me.intents.every((intent) => intent.state === "completed"),
);
console.log(
  JSON.stringify({
    container: true,
    mode: health.mode,
    liveMoneyEnabled: false,
    fillToSparkToPayout: true,
    cash: me.balances.cash,
    units: me.balances.units,
    completedIntents: me.intents.length,
  }),
);
