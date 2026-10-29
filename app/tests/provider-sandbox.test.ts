import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { createApp } from "../server/app.js";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { atomic, decimal, providerNumber } from "../shared/decimal.js";
import {
  MoonPaySandbox,
  signMoonPayQuery,
  moonpaySandboxConfig,
  qualifyMoonPaySandbox,
  type MoonPayInstruction,
} from "../server/moonpay-sandbox.js";
import {
  DinariSandbox,
  type DinariInstruction,
} from "../server/dinari-sandbox.js";
import {
  ProviderFault,
  providerTransport,
} from "../server/provider-transport.js";
import { SandboxStore } from "../server/provider-sandbox-store.js";
import { openDatabase } from "../server/database.js";
import { openSandboxDatabase } from "../server/provider-sandbox-database.js";
import { openProviderSandbox } from "../server/provider-sandbox-config.js";

const keys = {
  publishableKey: "pk_test_SyntheticOnly",
  secretKey: "sk_test_SyntheticOnly",
  webhookKey: "synthetic-webhook-secret-only",
};
const wallet = `0x${"1".repeat(40)}`;
function moonpay(): MoonPayInstruction {
  return {
    id: randomUUID(),
    customerId: randomUUID(),
    side: "buy",
    wallet,
    amount: "100",
  };
}
function dinari(): DinariInstruction {
  return {
    id: randomUUID(),
    customerId: randomUUID(),
    entityId: randomUUID(),
    accountId: randomUUID(),
    stockId: randomUUID(),
    wallet,
    paymentToken: `0x${"2".repeat(40)}`,
    chainId: "eip155:421614",
    side: "BUY",
    amount: "100.123456",
  };
}
const fault = (kind: ProviderFault["kind"]) => (error: unknown) =>
  error instanceof ProviderFault &&
  error.kind === kind &&
  !error.message.includes(keys.secretKey);

test("MoonPay quote qualification makes zero requests without keys and validates exact fees, expiry and currency", async () => {
  let calls = 0;
  let changes: Record<string, unknown> = {};
  const transport = (async (url: any, init: RequestInit) => {
    calls++;
    const parsed = new URL(String(url));
    assert.equal(parsed.pathname, "/v3/currencies/usdc/buy_quote");
    assert.equal(parsed.searchParams.get("baseCurrencyAmount"), "100");
    assert.equal(init.method, "GET");
    return Response.json({
      baseCurrencyCode: "usd",
      baseCurrency: { code: "usd" },
      baseCurrencyAmount: 100,
      quoteCurrency: { code: "usdc" },
      quoteCurrencyAmount: 99.123456,
      feeAmount: 1,
      extraFeeAmount: 0,
      networkFeeAmount: 2,
      totalAmount: 103,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      ...changes,
    });
  }) as typeof fetch;
  assert.equal(
    (await qualifyMoonPaySandbox({}, transport)).status,
    "missing_credentials",
  );
  assert.equal(calls, 0);
  const env = {
    MOONPAY_PUBLISHABLE_KEY: keys.publishableKey,
    MOONPAY_SECRET_KEY: keys.secretKey,
    MOONPAY_WEBHOOK_KEY: keys.webhookKey,
  };
  const result = await qualifyMoonPaySandbox(env, transport);
  assert.equal(result.status, "sandbox_quote_verified");
  assert.equal(result.providerAcceptance, false);
  assert.equal(calls, 1);
  const adapter = new MoonPaySandbox(keys, transport);
  assert.equal((await adapter.quote("100")).quotedCrypto, "99.123456");
  changes = { expiresAt: undefined };
  const indicative = await adapter.quote("100");
  assert.equal(indicative.expiresAt, null);
  assert.equal(indicative.indicative, true);
  assert.ok(Number.isFinite(Date.parse(indicative.receivedAt)));
  for (const value of [
    { totalAmount: 102 },
    { expiresAt: new Date(0).toISOString() },
    { baseCurrencyAmount: 101 },
  ]) {
    changes = value;
    await assert.rejects(adapter.quote("100"), fault("mismatch"));
  }
  changes = { quoteCurrency: { code: "usdc_arbitrum" } };
  await assert.rejects(adapter.quote("100"), fault("invalid_response"));
});

test("operator sandbox database excludes a second process and releases its lock after a clean close", async () => {
  const root = await mkdtemp(join(tmpdir(), "blunts-provider-lock-"));
  try {
    const first = await openSandboxDatabase(root);
    try {
      await assert.rejects(openSandboxDatabase(root), fault("configuration"));
    } finally {
      await first.close();
    }
    const second = await openSandboxDatabase(root);
    await second.close();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("sandbox HTTP activation refuses non-loopback origins, public bind addresses and production mode", async () => {
  const names = ["PROVIDER_SANDBOX", "HOST", "NODE_ENV"] as const;
  const before = Object.fromEntries(
    names.map((name) => [name, process.env[name]]),
  );
  try {
    process.env.PROVIDER_SANDBOX = "1";
    process.env.HOST = "127.0.0.1";
    process.env.NODE_ENV = "test";
    await assert.rejects(
      openProviderSandbox("https://example.test"),
      fault("configuration"),
    );
    process.env.HOST = "0.0.0.0";
    await assert.rejects(
      openProviderSandbox("http://localhost:8750"),
      fault("configuration"),
    );
    process.env.HOST = "127.0.0.1";
    process.env.NODE_ENV = "production";
    await assert.rejects(
      openProviderSandbox("http://localhost:8750"),
      fault("configuration"),
    );
  } finally {
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name];
      else process.env[name] = before[name];
    }
  }
});

test("provider decimals preserve six-digit base units and reject rounding, exponents and unsafe SDK numbers", () => {
  assert.equal(atomic("0.000001"), 1n);
  assert.equal(decimal(100123456n), "100.123456");
  assert.equal(providerNumber("100.123456"), 100.123456);
  for (const value of [
    "1.0000001",
    "1e-6",
    "-1",
    "NaN",
    "Infinity",
    " 1",
    "01",
    "9007199254.740992",
  ])
    assert.throws(() => providerNumber(value));
  for (let i = 0n; i < 1000n; i++)
    assert.equal(atomic(decimal(i * 100003n)), i * 100003n);
});

test("MoonPay signing matches the official fixed vector and keeps only test keys and fixed currencies", () => {
  assert.equal(
    signMoonPayQuery(
      "?apiKey=pk_test_DocsVector00&currencyCode=eth&walletAddress=0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe",
      "sk_test_DocsVector00",
    ),
    "oIJxSghyzll/BLhUFdQZhkxf7DAS8REFaWr/ibO+K8Q=",
  );
  const adapter = new MoonPaySandbox(keys);
  const input = moonpay();
  for (const side of ["buy", "sell"] as const) {
    const url = new URL(adapter.checkout({ ...input, side }));
    assert.equal(
      url.origin,
      side === "buy"
        ? "https://buy.moonpay.com"
        : "https://sell-sandbox.moonpay.com",
    );
    assert.equal(
      url.searchParams.get(
        side === "buy" ? "currencyCode" : "baseCurrencyCode",
      ),
      "usdc",
    );
    assert.equal(url.searchParams.get("externalTransactionId"), input.id);
    const signature = url.searchParams.get("signature");
    const query = url.search.slice(0, url.search.lastIndexOf("&signature="));
    assert.equal(
      signature,
      createHmac("sha256", keys.secretKey).update(query).digest("base64"),
    );
    assert.ok(!url.href.includes(keys.secretKey));
  }
  assert.throws(
    () => adapter.checkout({ ...input, amount: "25.50" }),
    fault("invalid_input"),
  );
  assert.throws(
    () => adapter.checkout({ ...input, side: "sell", amount: "0.0000001" }),
    fault("invalid_input"),
  );
  assert.throws(
    () => new MoonPaySandbox({ ...keys, publishableKey: "pk_live_Forbidden" }),
    fault("configuration"),
  );
  assert.throws(
    () => new MoonPaySandbox({ ...keys, secretKey: "sk_live_Forbidden" }),
    fault("configuration"),
  );
  assert.equal(moonpaySandboxConfig({}).status, "missing_credentials");
});

test("MoonPay polling checks identity, wallet, amount and currency, rejects duplicate external IDs and never credits completion", async () => {
  const input = moonpay();
  const tx = {
    id: randomUUID(),
    externalTransactionId: input.id,
    externalCustomerId: input.customerId,
    status: "completed",
    updatedAt: new Date().toISOString(),
    walletAddress: wallet,
    baseCurrencyAmount: 100,
    currency: { code: "usdc" },
    baseCurrency: { code: "usd" },
  };
  let calls = 0;
  let body: unknown = [tx];
  const transport = (async (url: any, init: RequestInit) => {
    calls++;
    assert.equal(
      new URL(String(url)).pathname,
      `/v1/transactions/ext/${input.id}`,
    );
    assert.equal(init.method, "GET");
    assert.equal(init.redirect, "error");
    return Response.json(body);
  }) as typeof fetch;
  const adapter = new MoonPaySandbox(keys, transport);
  const result = await adapter.observe(input);
  assert.equal(result.state, "completed");
  assert.equal(result.settled, false);
  for (const changes of [
    { externalCustomerId: randomUUID() },
    { walletAddress: `0x${"3".repeat(40)}` },
    { baseCurrencyAmount: 101 },
    { baseCurrency: { code: "eur" } },
    { currency: { code: "usdc_arbitrum" } },
  ]) {
    body = [{ ...tx, ...changes }];
    await assert.rejects(adapter.observe(input), fault("mismatch"));
  }
  body = [tx, tx];
  await assert.rejects(adapter.observe(input), fault("ambiguous"));
  body = [];
  assert.equal((await adapter.observe(input)).state, "not_found");
  assert.equal(calls, 8);
  const sell = { ...input, side: "sell" as const, amount: "1.000001" };
  const seller = new MoonPaySandbox(keys, (async (url: any) => {
    assert.equal(
      new URL(String(url)).pathname,
      `/v3/sell_transactions/ext/${input.id}`,
    );
    return Response.json([
      {
        ...tx,
        walletAddress: undefined,
        refundWalletAddress: wallet,
        baseCurrencyAmount: 1.000001,
        baseCurrency: { code: "usdc" },
        quoteCurrency: { code: "usd" },
      },
    ]);
  }) as typeof fetch);
  assert.equal((await seller.observe(sell)).settled, false);
});

test("MoonPay webhook authentication uses exact raw bytes, rejects stale and altered payloads and returns no customer PII", () => {
  const adapter = new MoonPaySandbox(keys);
  const input = moonpay();
  const body = Buffer.from(
    JSON.stringify({
      type: "transaction_updated",
      data: {
        id: randomUUID(),
        externalTransactionId: input.id,
        updatedAt: new Date().toISOString(),
        customerEmail: "private@example.test",
      },
    }),
  );
  const now = Math.floor(Date.now() / 1000);
  const header = `t=${now},s=${createHmac("sha256", keys.webhookKey).update(`${now}.`).update(body).digest("hex")}`;
  const result = adapter.event(body, header, now);
  assert.equal(result.instructionId, input.id);
  assert.ok(!JSON.stringify(result).includes("private@example.test"));
  assert.throws(
    () => adapter.event(Buffer.concat([body, Buffer.from(" ")]), header, now),
    fault("rejected"),
  );
  assert.throws(
    () => adapter.event(body, header, now + 301),
    fault("rejected"),
  );
  assert.throws(
    () => adapter.event(body, `${header},s=${"0".repeat(64)}`, now),
    fault("rejected"),
  );
});

function dinariFixture(
  input: DinariInstruction,
  changes: {
    entity?: object;
    wallet?: object;
    account?: object;
    stock?: object;
  } = {},
) {
  const calls: { path: string; method: string; body: any }[] = [];
  const requestId = randomUUID();
  const transport = (async (url: any, init: RequestInit) => {
    const path = new URL(String(url)).pathname;
    calls.push({
      path,
      method: init.method ?? "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    });
    assert.equal(
      new URL(String(url)).origin,
      "https://api-enterprise.sandbox.dinari.com",
    );
    assert.equal(init.redirect, "error");
    if (path === `/api/v2/accounts/${input.accountId}`)
      return Response.json({
        id: input.accountId,
        entity_id: input.entityId,
        is_active: true,
        jurisdiction: "US",
        ...changes.account,
      });
    if (path === `/api/v2/entities/${input.entityId}`)
      return Response.json({
        id: input.entityId,
        entity_type: "INDIVIDUAL",
        is_kyc_complete: true,
        reference_id: input.customerId,
        ...changes.entity,
      });
    if (path.endsWith("/wallet"))
      return Response.json({
        address: wallet,
        is_managed_wallet: false,
        is_aml_flagged: false,
        chain_id: "eip155:0",
        ...changes.wallet,
      });
    if (path.includes("/market_data/"))
      return Response.json({
        data: [
          {
            id: input.stockId,
            symbol: "QQQ",
            is_tradable: true,
            is_fractionable: true,
            tokens: [`${input.chainId}:${wallet}`],
            ...changes.stock,
          },
        ],
      });
    assert.equal(
      path,
      `/api/v2/accounts/${input.accountId}/order_requests/eip155/permit`,
    );
    return Response.json({
      order_request_id: requestId,
      permit: { domain: { chainId: Number(input.chainId.split(":")[1]) } },
    });
  }) as typeof fetch;
  return { calls, transport, requestId };
}

test("Dinari uses the external-wallet unsigned permit path after checking customer/account/wallet and QQQ", async () => {
  for (const chainId of ["eip155:11155111", "eip155:421614"] as const) {
    for (const side of ["BUY", "SELL"] as const) {
      const input = { ...dinari(), side, chainId };
      const fixture = dinariFixture(input);
      const adapter = new DinariSandbox(
        { keyId: "synthetic", secretKey: "synthetic" },
        fixture.transport,
      );
      const result = await adapter.prepare(input);
      assert.equal(result.signingApproved, false);
      assert.equal(result.settled, false);
      assert.equal(result.requestId, fixture.requestId);
      const posts = fixture.calls.filter((x) => x.method === "POST");
      assert.equal(posts.length, 1);
      assert.equal(posts[0].body.client_order_id, input.id);
      assert.equal(
        posts[0].body[
          side === "BUY" ? "payment_token_quantity" : "asset_token_quantity"
        ],
        100.123456,
      );
      assert.ok(
        !fixture.calls.some((x) =>
          /market_buy|market_sell|permit_transaction$/.test(x.path),
        ),
      );
    }
  }
});

test("Dinari refuses unverified/mismapped customers, inactive accounts and managed/flagged/wrong wallets before a POST", async () => {
  const input = dinari();
  for (const changes of [
    { entity: { reference_id: randomUUID() } },
    { entity: { is_kyc_complete: false } },
    { account: { is_active: false } },
    { account: { jurisdiction: "BASELINE" } },
    { wallet: { is_managed_wallet: true } },
    { wallet: { is_aml_flagged: true } },
    { wallet: { address: `0x${"4".repeat(40)}` } },
    { stock: { tokens: [`eip155:1:${wallet}`] } },
    { stock: { tokens: [`eip155:11155111:${wallet}`] } },
  ]) {
    const fixture = dinariFixture(input, changes);
    await assert.rejects(
      new DinariSandbox(
        { keyId: "synthetic", secretKey: "synthetic" },
        fixture.transport,
      ).prepare(input),
      fault("mismatch"),
    );
    assert.equal(fixture.calls.filter((x) => x.method === "POST").length, 0);
  }
});

test("Dinari recovery filters the saved client ID and never equates brokerage FILLED with settled cash", async () => {
  const input = dinari();
  const requestId = randomUUID(),
    orderId = randomUUID();
  let calls = 0,
    duplicates = false;
  const adapter = new DinariSandbox(
    { keyId: "synthetic", secretKey: "synthetic" },
    (async (url: any, init: RequestInit) => {
      calls++;
      assert.equal(init.method, "GET");
      const parsed = new URL(String(url));
      const request = {
        id: requestId,
        account_id: input.accountId,
        client_order_id: input.id,
        order_side: input.side,
        status: "SUBMITTED",
        order_id: orderId,
      };
      if (parsed.pathname.endsWith("/order_requests")) {
        assert.equal(parsed.searchParams.get("client_order_id"), input.id);
        return Response.json({
          data: duplicates ? [request, request] : [request],
        });
      }
      assert.equal(
        parsed.pathname,
        `/api/v2/accounts/${input.accountId}/orders/${orderId}`,
      );
      return Response.json({
        id: orderId,
        client_order_id: input.id,
        order_request_id: requestId,
        chain_id: input.chainId,
        stock_id: input.stockId,
        order_side: input.side,
        payment_token: input.paymentToken,
        status: "FILLED",
      });
    }) as typeof fetch,
  );
  const result = await adapter.observe(input);
  assert.equal(result.state, "FILLED");
  assert.equal(result.settled, false);
  duplicates = true;
  await assert.rejects(adapter.observe(input), fault("ambiguous"));
  assert.equal(calls, 3);
});

test("provider transport forbids redirects, wrong origins/methods and oversized bodies", async () => {
  let calls = 0;
  const transport = providerTransport("https://api.moonpay.com", (async () => {
    calls++;
    return new Response("x".repeat(131073));
  }) as typeof fetch);
  await assert.rejects(transport("https://evil.test"), fault("invalid_input"));
  await assert.rejects(
    transport("https://api.moonpay.com", { method: "POST" }),
    fault("invalid_input"),
  );
  assert.equal(calls, 0);
  await assert.rejects(
    transport("https://api.moonpay.com"),
    fault("invalid_response"),
  );
  const redirect = providerTransport(
    "https://api.moonpay.com",
    (async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://evil.test" },
      })) as typeof fetch,
  );
  await assert.rejects(
    redirect("https://api.moonpay.com"),
    fault("unavailable"),
  );
});

test("sandbox command survives timeout/restart, forbids conflicting/repeated submits and treats events as hints", async () => {
  const directory = await mkdtemp(join(tmpdir(), "blunts-provider-test-"));
  const path = join(directory, "database");
  let db = await openDatabase(path);
  try {
    let store = new SandboxStore(db);
    await store.init();
    const input = moonpay();
    const command = { provider: "moonpay" as const, instruction: input };
    await store.remember(command);
    await assert.rejects(
      store.remember({ ...command, instruction: { ...input, amount: "101" } }),
      fault("mismatch"),
    );
    let calls = 0;
    const result = await store.prepare(input.id, async () => {
      calls++;
      assert.equal((await store.load(input.id)).state, "submitting");
      throw new Error(keys.secretKey);
    });
    assert.equal(result.state, "unknown");
    assert.ok(!JSON.stringify(result).includes(keys.secretKey));
    await db.close();
    db = await openDatabase(path);
    store = new SandboxStore(db);
    await store.init();
    await store.prepare(input.id, async () => {
      calls++;
      return {};
    });
    assert.equal(calls, 1);
    await store.reconcile(input.id, { state: "not_found", settled: false });
    assert.equal((await store.load(input.id)).state, "unknown");
    const event = {
      digest: "digest-one",
      type: "transaction_updated",
      transactionId: randomUUID(),
      instructionId: input.id,
      updatedAt: new Date().toISOString(),
    };
    assert.equal((await store.event(event)).inserted, true);
    assert.equal(
      (
        await store.event({
          ...event,
          digest: "same-event-new-json-whitespace",
        })
      ).inserted,
      false,
    );
    assert.equal((await store.load(input.id)).state, "unknown");
    await assert.rejects(
      store.event({ ...event, type: "sell_transaction_updated" }),
      fault("mismatch"),
    );
    assert.equal(
      (await store.reconcile(input.id, { state: "pending", settled: false }))
        .state,
      "observed",
    );
    assert.equal((await db.query("SELECT * FROM sandbox_events")).length, 1);
    const newer = new Date().toISOString(),
      older = new Date(Date.now() - 1000).toISOString();
    await store.reconcile(input.id, {
      state: "completed",
      settled: false,
      updatedAt: newer,
    });
    await store.reconcile(input.id, {
      state: "pending",
      settled: false,
      updatedAt: older,
    });
    assert.equal(
      ((await store.load(input.id)).observation as { state: string }).state,
      "completed",
    );
    await assert.rejects(
      store.reconcile(input.id, {
        state: "failed",
        settled: false,
        updatedAt: newer,
      }),
      fault("ambiguous"),
    );
    await assert.rejects(
      store.reconcile(input.id, { state: "not_found", settled: false }),
      fault("ambiguous"),
    );
  } finally {
    await db.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("only one concurrent sandbox preparer performs I/O and an abandoned submit is never replayed", async () => {
  const db = await openDatabase("memory://");
  try {
    const store = new SandboxStore(db);
    await store.init();
    const input = moonpay();
    await store.remember({ provider: "moonpay", instruction: input });
    let calls = 0;
    await Promise.all(
      Array.from({ length: 8 }, () =>
        store.prepare(input.id, async () => {
          calls++;
          await store.load(input.id);
          return { settled: false };
        }),
      ),
    );
    assert.equal(calls, 1);
    const abandoned = moonpay();
    const raced = moonpay();
    await store.remember({ provider: "moonpay", instruction: raced });
    const racedResult = await store.prepare(raced.id, async () => {
      await store.reconcile(raced.id, { state: "pending", settled: false });
      return { unsignedResult: "retained", settled: false };
    });
    assert.equal(racedResult.state, "observed");
    assert.deepEqual(racedResult.artifact, {
      unsignedResult: "retained",
      settled: false,
    });
    await store.remember({ provider: "moonpay", instruction: abandoned });
    await db.query(
      "UPDATE sandbox_commands SET state='submitting' WHERE id=$1",
      [abandoned.id],
    );
    assert.equal(
      (
        await store.prepare(abandoned.id, async () => {
          calls++;
          return {};
        })
      ).state,
      "submitting",
    );
    assert.equal(calls, 1);
  } finally {
    await db.close();
  }
});

test("sandbox API binds checkout to the verified wallet, enforces ownership/CSRF and authenticates raw callbacks without credit", async () => {
  const tokens = new Map<string, string>();
  const upstream = createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/auth/email/code/verify") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const token = `synthetic-access-${randomUUID()}`;
      tokens.set(token, body.email);
      return res.end(
        JSON.stringify({
          ok: true,
          token,
          refreshToken: `synthetic-refresh-${randomUUID()}`,
          expiresIn: 900,
        }),
      );
    }
    if (req.url === "/user/me") {
      const subject = tokens.get(
        req.headers.authorization?.replace("Bearer ", "") ?? "",
      );
      if (subject)
        return res.end(
          JSON.stringify({
            ok: true,
            data: {
              userId: subject,
              wallet: { address: wallet, agentId: subject },
            },
          }),
        );
    }
    res.statusCode = 401;
    res.end('{"ok":false}');
  });
  await new Promise<void>((resolve) =>
    upstream.listen(0, "127.0.0.1", resolve),
  );
  const db = await openDatabase("memory://"),
    providerDb = await openDatabase("memory://");
  const store = new SandboxStore(providerDb);
  let polls = 0;
  const adapter = new MoonPaySandbox(keys, (async (url: any) => {
    polls++;
    const key = new URL(String(url)).pathname.split("/").at(-1)!;
    const record = await store.load(key);
    return Response.json([
      {
        id: randomUUID(),
        externalTransactionId: key,
        externalCustomerId: record.payload.instruction.customerId,
        status: "completed",
        updatedAt: new Date().toISOString(),
        walletAddress: wallet,
        baseCurrencyAmount: 100,
        currency: { code: "usdc" },
        baseCurrency: { code: "usd" },
      },
    ]);
  }) as typeof fetch);
  const origin = "http://localhost:8740";
  const app = await createApp({
    db,
    origin,
    steward: {
      apiUrl: `http://127.0.0.1:${(upstream.address() as { port: number }).port}`,
      encryptionKey: randomBytes(32),
    },
    providerSandbox: { store, moonpay: adapter },
  });
  const post = (
    url: string,
    payload: unknown,
    headers: Record<string, string> = {},
  ) =>
    app.inject({
      method: "POST",
      url,
      payload: payload as any,
      headers: { origin, "x-blunts-request": "1", ...headers },
    });
  async function login(email: string) {
    const result = await post("/api/auth/steward/verify", {
      email,
      code: "123456",
    });
    assert.equal(result.statusCode, 200);
    const headers = {
      cookie: `${result.cookies[0].name}=${result.cookies[0].value}`,
      "x-csrf-token": result.json().csrf,
    };
    assert.equal(
      (
        await post(
          "/api/onboarding",
          { adult: true, simulation: true, agreement: "sandbox-v1" },
          headers,
        )
      ).statusCode,
      200,
    );
    return headers;
  }
  try {
    assert.equal(
      (
        await post("/api/providers/sandbox/moonpay", {
          side: "buy",
          amount: "100",
        })
      ).statusCode,
      401,
    );
    const alice = await login("sandbox-alice@example.test"),
      bob = await login("sandbox-bob@example.test");
    const key = randomUUID(),
      body = { side: "buy", amount: "100" };
    assert.equal(
      (
        await post("/api/providers/sandbox/moonpay", body, {
          ...alice,
          "idempotency-key": key,
          "x-csrf-token": "wrong",
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (
        await post(
          "/api/providers/sandbox/moonpay",
          { ...body, wallet: `0x${"5".repeat(40)}` },
          { ...alice, "idempotency-key": key },
        )
      ).statusCode,
      400,
    );
    const first = await post("/api/providers/sandbox/moonpay", body, {
      ...alice,
      "idempotency-key": key,
    });
    assert.equal(first.statusCode, 200);
    assert.equal(first.json().creditsAppBalance, false);
    const url = new URL(first.json().artifact.checkoutUrl);
    assert.equal(url.searchParams.get("walletAddress"), wallet);
    const retry = await post("/api/providers/sandbox/moonpay", body, {
      ...alice,
      "idempotency-key": key,
    });
    assert.equal(
      retry.json().artifact.checkoutUrl,
      first.json().artifact.checkoutUrl,
    );
    assert.equal(
      (
        await post(
          "/api/providers/sandbox/moonpay",
          { ...body, amount: "101" },
          { ...alice, "idempotency-key": key },
        )
      ).statusCode,
      409,
    );
    assert.equal(
      (await post(`/api/providers/sandbox/${key}/observe`, {}, bob)).statusCode,
      403,
    );
    assert.equal(polls, 0);
    const raw = JSON.stringify({
      type: "transaction_updated",
      data: {
        id: randomUUID(),
        externalTransactionId: key,
        updatedAt: new Date().toISOString(),
      },
    });
    const now = Math.floor(Date.now() / 1000);
    const signature = `t=${now},s=${createHmac("sha256", keys.webhookKey).update(`${now}.${raw}`).digest("hex")}`;
    const callback = () =>
      app.inject({
        method: "POST",
        url: "/provider-hooks/moonpay",
        payload: raw,
        headers: {
          "content-type": "application/json",
          "moonpay-signature-v2": signature,
        },
      });
    assert.equal((await callback()).statusCode, 202);
    assert.equal((await callback()).json().inserted, false);
    assert.equal((await store.load(key)).state, "artifact_ready");
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/provider-hooks/moonpay",
          payload: `${raw} `,
          headers: {
            "content-type": "application/json",
            "moonpay-signature-v2": signature,
          },
        })
      ).statusCode,
      403,
    );
    const observed = await post(
      `/api/providers/sandbox/${key}/observe`,
      {},
      alice,
    );
    assert.equal(observed.statusCode, 200);
    assert.equal(observed.json().settled, false);
    assert.equal(polls, 1);
    const me = await app.inject({ url: "/api/me", headers: alice });
    assert.equal(me.json().balances.cash, "0");
    assert.equal(me.json().intents.length, 0);
    assert.equal((await db.query("SELECT * FROM journals")).length, 0);
  } finally {
    await app.close();
    await db.close();
    await providerDb.close();
    await new Promise<void>((resolve, reject) =>
      upstream.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
