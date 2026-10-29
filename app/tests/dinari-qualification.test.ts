import { test } from "node:test";
import assert from "node:assert/strict";
import { qualifyDinariSandbox } from "../server/dinari-qualification.js";

const credentials = {
  keyId: "synthetic-key-id",
  secretKey: "synthetic-secret-key",
};
function stock(changes = {}) {
  return {
    id: "synthetic-qqq",
    symbol: "QQQ",
    is_tradable: true,
    is_fractionable: true,
    tokens: [`eip155:421614:0x${"1".repeat(40)}`],
    ...changes,
  };
}
function fixture(stocks: unknown = { data: [stock()] }, type = "ORGANIZATION") {
  const requests: string[] = [];
  const transport = (async (input: any, init: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://api-enterprise.sandbox.dinari.com");
    assert.equal(init.method, "GET");
    assert.equal(init.redirect, "error");
    const headers = new Headers(init.headers);
    assert.equal(headers.get("x-api-key-id"), credentials.keyId);
    assert.equal(headers.get("x-api-secret-key"), credentials.secretKey);
    requests.push(url.pathname);
    if (url.pathname === "/api/v2/entities/me")
      return Response.json({
        id: "partner-id-never-printed",
        entity_type: type,
        is_kyc_complete: true,
      });
    assert.equal(url.pathname, "/api/v2/market_data/stocks/");
    assert.ok(url.search.includes("QQQ"));
    assert.equal(url.searchParams.get("limit"), "20");
    return Response.json(stocks);
  }) as typeof fetch;
  return { transport, requests };
}

test("missing sandbox credentials do not make network requests", async () => {
  let calls = 0;
  const result = await qualifyDinariSandbox({}, (async () => {
    calls++;
    throw Error("must not call");
  }) as typeof fetch);
  assert.equal(calls, 0);
  assert.equal(result.status, "missing_credentials");
  assert.deepEqual(result.missing, [
    "DINARI_API_KEY_ID",
    "DINARI_API_SECRET_KEY",
  ]);
});

test("official SDK uses only sandbox identity/instrument reads and never reports live acceptance", async () => {
  const { transport, requests } = fixture();
  const result = await qualifyDinariSandbox(credentials, transport);
  assert.equal(result.status, "sandbox_reads_verified");
  assert.deepEqual(requests, [
    "/api/v2/entities/me",
    "/api/v2/market_data/stocks/",
  ]);
  assert.equal(result.realMoneyEnabled, false);
  assert.equal(result.providerAcceptance, false);
  assert.ok(!JSON.stringify(result).includes("partner-id-never-printed"));
  const sepolia = await qualifyDinariSandbox(
    credentials,
    fixture({
      data: [stock({ tokens: [`eip155:11155111:0x${"1".repeat(40)}`] })],
    }).transport,
  );
  assert.equal(sepolia.status, "sandbox_reads_verified");
  assert.deepEqual(sepolia.instrument?.supportedTestChains, [
    "eip155:11155111",
  ]);
  assert.equal(sepolia.instrument?.arbitrumSepoliaTokenPresent, false);
});

test("missing, duplicate, restricted and malformed instruments never qualify", async () => {
  for (const [data, expected] of [
    [{ data: [] }, "instrument_unavailable"],
    [{ data: [stock(), stock({ id: "duplicate" })] }, "invalid_response"],
    [{ data: [stock({ is_tradable: false })] }, "instrument_restricted"],
    [{ data: [stock({ is_fractionable: false })] }, "instrument_restricted"],
    [
      { data: [stock({ tokens: [`eip155:42161:0x${"1".repeat(40)}`] })] },
      "instrument_restricted",
    ],
    [{ data: [stock({ is_tradable: "yes" })] }, "invalid_response"],
  ] as const) {
    assert.equal(
      (await qualifyDinariSandbox(credentials, fixture(data).transport)).status,
      expected,
    );
  }
  const individual = fixture(undefined, "INDIVIDUAL");
  assert.equal(
    (await qualifyDinariSandbox(credentials, individual.transport)).status,
    "not_partner",
  );
  assert.equal(individual.requests.length, 1);
});

test("provider errors are redacted and never automatically retried", async () => {
  for (const status of [401, 403, 500]) {
    let calls = 0;
    const transport = (async () => {
      calls++;
      return Response.json({ error: credentials.secretKey }, { status });
    }) as typeof fetch;
    const result = await qualifyDinariSandbox(credentials, transport);
    assert.equal(calls, 1);
    assert.equal(
      result.status,
      status === 500 ? "unavailable" : "access_rejected",
    );
    assert.ok(!JSON.stringify(result).includes(credentials.secretKey));
  }
});
