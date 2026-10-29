import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import {
  mkdtemp,
  readFile,
  rm,
  chmod,
  symlink,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createApp } from "../server/app.js";
import { openDatabase } from "../server/database.js";
import { Steward, readSessionKeyFile } from "../server/steward.js";
import { tick, reconcile } from "../server/domain.js";
import { digest } from "../server/auth.js";

const origin = "http://localhost:8740";
const requestHeaders = { origin, "x-blunts-request": "1" };

test("the persisted session root survives restart and rejects unsafe replacement files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "blunts-session-root-"));
  const path = join(dir, "key");
  try {
    const original = await readSessionKeyFile(path);
    assert.equal(original.length, 32);
    assert.equal((await stat(path)).mode & 0o077, 0);
    assert.deepEqual(await readSessionKeyFile(path), original);
    await chmod(path, 0o644);
    await assert.rejects(readSessionKeyFile(path), /owner-only/);
    assert.deepEqual(
      await readFile(path),
      original,
      "An unsafe root must not be replaced",
    );
    await chmod(path, 0o600);
    const alias = join(dir, "alias");
    await symlink(path, alias);
    await assert.rejects(readSessionKeyFile(alias));
    const malformed = join(dir, "malformed");
    await writeFile(malformed, "short", { mode: 0o600 });
    await assert.rejects(readSessionKeyFile(malformed), /32-byte/);
    assert.equal(await readFile(malformed, "utf8"), "short");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Steward sessions bind encryption to the issuer and session, and reject insecure origins", () => {
  const encryptionKey = randomBytes(32);
  const client = new Steward({
    apiUrl: "https://steward.example.test",
    encryptionKey,
  });
  const tokens = {
    token: "synthetic-access-token-at-least-20",
    refreshToken: "synthetic-refresh-token-at-least-20",
    expiresIn: 900,
  };
  const sealed = client.seal(tokens, "session-a");
  assert.deepEqual(client.unseal(sealed, "session-a"), tokens);
  assert.throws(
    () => client.unseal(sealed, "session-b"),
    /could not be restored/,
  );
  assert.throws(() =>
    new Steward({ apiUrl: "https://other.example.test", encryptionKey }).unseal(
      sealed,
      "session-a",
    ),
  );
  const tampered = Buffer.from(sealed, "base64");
  tampered[15] ^= 1;
  assert.throws(() => client.unseal(tampered.toString("base64"), "session-a"));
  for (const apiUrl of [
    "http://example.test",
    "https://user:password@example.test",
    "https://example.test/?token=x",
  ]) {
    assert.throws(() => new Steward({ apiUrl, encryptionKey }));
  }
});

test("Cloud /steward prefix and app-to-personal session exchange preserve the verified subject", async () => {
  const subject = "11111111-1111-4111-8111-111111111111";
  const original = {
    token: "synthetic-app-access-token-12345",
    refreshToken: "synthetic-app-refresh-token-12345",
    expiresIn: 900,
    user: { id: subject },
  };
  const rotated = {
    token: "synthetic-personal-access-token-12345",
    refreshToken: "synthetic-personal-refresh-token-12345",
    expiresIn: 900,
  };
  const requests: string[] = [];
  const server = createServer(async (req, res) => {
    requests.push(req.url!);
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/steward/user/me") {
      if (req.headers.authorization === `Bearer ${original.token}`) {
        res.writeHead(403);
        res.end('{"ok":false}');
      } else
        res.end(
          JSON.stringify({ ok: true, data: { userId: subject, wallet: null } }),
        );
    } else if (req.url === "/steward/auth/refresh") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString()), {
        refreshToken: original.refreshToken,
        tenantId: `personal-${subject}`,
      });
      res.end(JSON.stringify({ ok: true, ...rotated }));
    } else {
      res.writeHead(404);
      res.end('{"ok":false}');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const client = new Steward({
      apiUrl: `http://127.0.0.1:${(server.address() as { port: number }).port}/steward`,
      encryptionKey: randomBytes(32),
      provider: "eliza-cloud",
    });
    const result = await client.completeSession(original);
    assert.equal(result.identity.userId, subject);
    assert.deepEqual(result.tokens, rotated);
    assert.deepEqual(requests, [
      "/steward/user/me",
      "/steward/auth/refresh",
      "/steward/user/me",
    ]);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("Steward BFF isolates identities, encrypts tokens, rotates once and signs out during an outage", async () => {
  const tokens = new Map<string, string>();
  let refreshes = 0,
    unavailable = false,
    subjectOverride = "";
  const paths: string[] = [];
  const upstream = createServer(async (req, res) => {
    paths.push(req.url!);
    res.setHeader("Content-Type", "application/json");
    if (unavailable) {
      res.writeHead(503);
      res.end('{"ok":false}');
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = chunks.length
      ? JSON.parse(Buffer.concat(chunks).toString())
      : {};
    const issue = (subject: string) => {
      const token = `synthetic-access-${subject}-${Math.random()}`;
      const refreshToken = `synthetic-refresh-${subject}-${Math.random()}`;
      tokens.set(token, subject);
      tokens.set(refreshToken, subject);
      return { ok: true, token, refreshToken, expiresIn: 900 };
    };
    if (req.url === "/auth/email/send") res.end('{"ok":true}');
    else if (req.url === "/auth/email/code/verify") {
      if (body.code !== "123456") {
        res.writeHead(401);
        res.end('{"ok":false}');
      } else res.end(JSON.stringify(issue(body.email)));
    } else if (req.url === "/auth/refresh") {
      const subject = tokens.get(body.refreshToken);
      if (!subject) {
        res.writeHead(401);
        res.end('{"ok":false}');
        return;
      }
      refreshes++;
      tokens.delete(body.refreshToken);
      await new Promise((resolve) => setTimeout(resolve, 40));
      res.end(JSON.stringify(issue(subject)));
    } else if (req.url === "/user/me") {
      const subject = tokens.get(
        req.headers.authorization?.replace("Bearer ", "") ?? "",
      );
      if (!subject) {
        res.writeHead(401);
        res.end('{"ok":false}');
      } else
        res.end(
          JSON.stringify({
            ok: true,
            data: { userId: subjectOverride || subject, wallet: null },
          }),
        );
    } else if (req.url === "/auth/revoke") res.end('{"ok":true}');
    else {
      res.writeHead(404);
      res.end('{"ok":false}');
    }
  });
  await new Promise<void>((resolve) =>
    upstream.listen(0, "127.0.0.1", resolve),
  );
  const address = upstream.address() as { port: number };
  const scratch = await mkdtemp(join(tmpdir(), "blunts-steward-test-"));
  const source = join(scratch, "source");
  const db = await openDatabase(source);
  let closed = false;
  const app = await createApp({
    db,
    origin,
    steward: {
      apiUrl: `http://127.0.0.1:${address.port}`,
      encryptionKey: randomBytes(32),
    },
  });
  try {
    const login = async (email: string) => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/steward/verify",
        headers: requestHeaders,
        payload: { email, code: "123456" },
      });
      assert.equal(response.statusCode, 200);
      assert.deepEqual(Object.keys(response.json()), ["csrf"]);
      assert.equal(response.cookies[0].httpOnly, true);
      assert.equal(response.cookies[0].sameSite, "Strict");
      return {
        cookie: `${response.cookies[0].name}=${response.cookies[0].value}`,
        "x-csrf-token": response.json().csrf,
      };
    };
    const alice = await login("alice@example.test");
    const aliceAgain = await login("alice@example.test");
    const interrupted = await login("alice@example.test");
    const abandoned = await login("alice@example.test");
    const bob = await login("bob@example.test");
    assert.equal(
      (await db.query("SELECT * FROM steward_identities")).length,
      2,
    );
    assert.equal((await db.query("SELECT * FROM users")).length, 2);
    const dump = JSON.stringify(
      await db.query("SELECT * FROM steward_sessions"),
    );
    assert.ok(
      !dump.includes("synthetic-access-") &&
        !dump.includes("synthetic-refresh-"),
    );
    const me = await app.inject({ url: "/api/me", headers: alice });
    const secondMe = await app.inject({ url: "/api/me", headers: aliceAgain });
    const bobMe = await app.inject({ url: "/api/me", headers: bob });
    assert.equal(me.json().handle, secondMe.json().handle);
    assert.notEqual(me.json().handle, bobMe.json().handle);
    assert.equal(me.json().steward.userId, "alice@example.test");
    const bypass = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      headers: requestHeaders,
      payload: { handle: "bypass", password: "synthetic-password" },
    });
    assert.equal(bypass.statusCode, 403);
    const csrf = await app.inject({
      method: "POST",
      url: "/api/onboarding",
      headers: { ...requestHeaders, ...alice, "x-csrf-token": "wrong" },
      payload: { adult: true, simulation: true, agreement: "sandbox-v1" },
    });
    assert.equal(csrf.statusCode, 403);

    await db.query("UPDATE steward_sessions SET expires_at=0");
    const concurrent = await Promise.all([
      app.inject({ url: "/api/me", headers: alice }),
      app.inject({ url: "/api/me", headers: alice }),
    ]);
    assert.ok(concurrent.some((x) => x.statusCode === 200));
    assert.equal(refreshes, 1);
    await db.query("UPDATE steward_sessions SET lease_until=$1 WHERE hash=$2", [
      Date.now() - 1,
      digest(abandoned.cookie.split("=")[1]),
    ]);
    assert.equal(
      (await app.inject({ url: "/api/me", headers: abandoned })).statusCode,
      401,
    );
    assert.equal(
      refreshes,
      1,
      "An expired refresh lease must not replay a possibly consumed token",
    );
    subjectOverride = "bob@example.test";
    assert.equal(
      (await app.inject({ url: "/api/me", headers: alice })).statusCode,
      401,
    );
    subjectOverride = "";
    unavailable = true;
    assert.equal(
      (await app.inject({ url: "/api/me", headers: interrupted })).statusCode,
      401,
    );
    const attempts = paths.length;
    assert.equal(
      (await app.inject({ url: "/api/me", headers: interrupted })).statusCode,
      401,
    );
    assert.equal(
      paths.length,
      attempts,
      "An ambiguous rotation is never retried against the issuer",
    );
    assert.equal(
      (await app.inject({ url: "/api/me", headers: alice })).statusCode,
      503,
    );
    const logout = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { ...requestHeaders, ...alice },
      payload: {},
    });
    assert.equal(logout.statusCode, 200);
    assert.equal(logout.json().upstreamRevoked, false);
    assert.equal(
      (await app.inject({ url: "/api/me", headers: alice })).statusCode,
      401,
    );
    assert.ok(paths.every((path) => !/sign|transfer|order/.test(path)));
    await app.close();
    await db.close();
    closed = true;
    const snapshotPath = join(scratch, "snapshot.json");
    const runBackup = (command: string, database: string, path: string) => {
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", "app/server/backup.ts", command, path],
        {
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: database },
          encoding: "utf8",
          timeout: 30000,
        },
      );
      assert.equal(result.status, 0, result.stderr);
    };
    runBackup("backup", source, snapshotPath);
    const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
    assert.equal(snapshot.schema, 3);
    assert.equal(snapshot.data.steward_identities.length, 2);
    assert.deepEqual(snapshot.data.sessions, []);
    assert.equal(snapshot.data.steward_sessions, undefined);
    runBackup("restore", join(scratch, "restored"), snapshotPath);
    const restored = await openDatabase(join(scratch, "restored"));
    try {
      assert.equal(
        (await restored.query("SELECT * FROM steward_identities")).length,
        2,
      );
      assert.equal((await restored.query("SELECT * FROM sessions")).length, 0);
      assert.equal(
        (await restored.query("SELECT * FROM steward_sessions")).length,
        0,
      );
    } finally {
      await restored.close();
    }
  } finally {
    if (!closed) {
      await app.close();
      await db.close();
    }
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
    await rm(scratch, { recursive: true, force: true });
  }
});

test(
  "real local Steward email auth and wallet round trip",
  { skip: !process.env.TEST_STEWARD_URL },
  async () => {
    const apiUrl = process.env.TEST_STEWARD_URL!;
    const parsed = new URL(apiUrl);
    assert.ok(
      parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(parsed.hostname),
      "Acceptance requires the isolated loopback mock-email service",
    );
    const db = await openDatabase("memory://");
    const app = await createApp({
      db,
      origin,
      steward: { apiUrl, encryptionKey: randomBytes(32) },
    });
    try {
      const email = `blunts-acceptance-${Date.now()}@example.test`;
      const post = (url: string, payload: any, headers = {}) =>
        app.inject({
          method: "POST",
          url,
          payload,
          headers: { ...requestHeaders, ...headers },
        });
      assert.equal(
        (await post("/api/auth/steward/send", { email })).statusCode,
        200,
      );
      const inboxResponse = await fetch(
        `${apiUrl}/auth/test/inbox/${encodeURIComponent(email)}`,
      );
      assert.equal(
        inboxResponse.status,
        200,
        "Only Steward's NODE_ENV=test mock inbox is permitted",
      );
      const inbox = (await inboxResponse.json()) as { text: string };
      const code = inbox.text.match(/\b(\d{6})\b/)?.[1];
      assert.ok(code);
      const login = await post("/api/auth/steward/verify", { email, code });
      assert.equal(login.statusCode, 200);
      assert.deepEqual(Object.keys(login.json()), ["csrf"]);
      const headers = {
        cookie: `${login.cookies[0].name}=${login.cookies[0].value}`,
        "x-csrf-token": login.json().csrf,
      };
      const me = await app.inject({ url: "/api/me", headers });
      assert.equal(me.statusCode, 200);
      assert.ok(me.json().steward.userId);
      const created = await post("/api/steward/wallet", {}, headers);
      assert.equal(created.statusCode, 200);
      assert.match(created.json().walletAddress, /^0x[0-9a-fA-F]{40}$/);
      const repeat = await post("/api/steward/wallet", {}, headers);
      assert.equal(repeat.json().walletAddress, created.json().walletAddress);
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
      const destination = await post(
        "/api/destinations",
        { label: "Local demo", rail: "wallet_demo" },
        headers,
      );
      assert.equal(destination.statusCode, 200);
      async function settle() {
        for (let i = 0; i < 5; i++) {
          await db.query("UPDATE intents SET due_at=0");
          await tick(db);
        }
      }
      const fill = await post(
        "/api/flows",
        { kind: "fill", amount: "100" },
        { ...headers, "idempotency-key": randomUUID() },
      );
      assert.equal(fill.statusCode, 200);
      await settle();
      let current = await app.inject({ url: "/api/me", headers });
      assert.equal(current.json().balances.investmentValue, "9900");
      const spark = await post(
        "/api/flows",
        { kind: "spark", amount: "99", all: true },
        { ...headers, "idempotency-key": randomUUID() },
      );
      assert.equal(spark.statusCode, 200);
      await settle();
      current = await app.inject({ url: "/api/me", headers });
      assert.equal(current.json().balances.availableCash, "9801");
      const quote = await post(
        "/api/quotes",
        {
          kind: "payout",
          amount: "98.01",
          destinationId: destination.json().id,
        },
        headers,
      );
      assert.equal(quote.statusCode, 200);
      const payoutHeaders = { ...headers, "idempotency-key": randomUUID() };
      const payout = await post(
        "/api/intents",
        { quoteId: quote.json().id },
        payoutHeaders,
      );
      assert.equal(payout.statusCode, 200);
      const repeatPayout = await post(
        "/api/intents",
        { quoteId: quote.json().id },
        payoutHeaders,
      );
      assert.equal(repeatPayout.json().id, payout.json().id);
      await settle();
      current = await app.inject({ url: "/api/me", headers });
      assert.equal(current.json().balances.cash, "0");
      assert.equal(current.json().balances.units, "0");
      assert.equal((await reconcile(db)).ok, true);
      assert.equal(
        (await post("/api/auth/logout", {}, headers)).statusCode,
        200,
      );
      assert.equal(
        (await app.inject({ url: "/api/me", headers })).statusCode,
        401,
      );
    } finally {
      await app.close();
      await db.close();
    }
  },
);
