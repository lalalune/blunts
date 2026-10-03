import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp } from "../server/app.js";
import { openDatabase } from "../server/database.js";
const origin = "http://localhost:8740";
const password = "long-test-password-123";
test("API isolates accounts, rejects CSRF, supports recovery, and prevents live mode", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp({ db, origin });
  try {
    const post = async (url: string, payload: any, cookie = "", csrf = "") =>
      app.inject({
        method: "POST",
        url: `/api${url}`,
        payload,
        headers: {
          origin,
          "x-blunts-request": "1",
          cookie,
          "x-csrf-token": csrf,
        },
      });
    const first = await post("/auth/register", { handle: "alice", password });
    assert.equal(first.statusCode, 200);
    const aliceCookie = first.cookies[0].name + "=" + first.cookies[0].value;
    const aliceCsrf = first.json().csrf;
    assert.equal(first.cookies[0].httpOnly, true);
    assert.equal(first.cookies[0].sameSite, "Strict");
    const second = await post("/auth/register", { handle: "bob", password });
    const bobCookie = second.cookies[0].name + "=" + second.cookies[0].value;
    const bobCsrf = second.json().csrf;
    assert.equal(
      (
        await post(
          "/onboarding",
          { adult: true, simulation: true, agreement: "sandbox-v1" },
          aliceCookie,
          aliceCsrf,
        )
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await post(
          "/onboarding",
          { adult: true, simulation: true, agreement: "sandbox-v1" },
          bobCookie,
          bobCsrf,
        )
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await post(
          "/quotes",
          { kind: "fund", amount: "100" },
          aliceCookie,
          "wrong",
        )
      ).statusCode,
      403,
    );
    const evil = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { handle: "alice", password },
      headers: { origin: "https://evil.test", "x-blunts-request": "1" },
    });
    assert.equal(evil.statusCode, 403);
    const q = await post(
      "/quotes",
      { kind: "fund", amount: "100" },
      aliceCookie,
      aliceCsrf,
    );
    assert.equal(q.statusCode, 200);
    const steal = await app.inject({
      method: "POST",
      url: "/api/intents",
      payload: { quoteId: q.json().id },
      headers: {
        origin,
        "x-blunts-request": "1",
        cookie: bobCookie,
        "x-csrf-token": bobCsrf,
        "idempotency-key": randomUUID(),
      },
    });
    assert.equal(steal.statusCode, 404);
    const forged = await post(
      "/destinations",
      { label: "Hacked", rail: "wallet_demo", password: "wrong-password" },
      aliceCookie,
      aliceCsrf,
    );
    assert.equal(forged.statusCode, 401);
    const malicious = await post(
      "/quotes",
      { kind: "fund", amount: "10", fee: "0" },
      aliceCookie,
      aliceCsrf,
    );
    assert.equal(malicious.statusCode, 400);
    const statement = await app.inject({
      url: "/api/documents/statement",
      headers: { cookie: bobCookie },
    });
    assert.equal(statement.statusCode, 200);
    assert.equal(statement.json().handle, "bob");
    assert.equal(statement.headers["cache-control"], "no-store");
    const recovery = await post("/auth/recover", {
      handle: "alice",
      password: "new-test-password-123",
      recoveryCode: first.json().recoveryCode,
    });
    assert.equal(recovery.statusCode, 200);
    assert.equal(
      (await app.inject({ url: "/api/me", headers: { cookie: aliceCookie } }))
        .statusCode,
      401,
    );
    assert.equal(
      (
        await post("/auth/recover", {
          handle: "alice",
          password,
          recoveryCode: first.json().recoveryCode,
        })
      ).statusCode,
      401,
    );
    await assert.rejects(
      createApp({ db, origin, mode: "live" }),
      /Live money is disabled/,
    );
  } finally {
    await app.close();
    await db.close();
  }
});
test("closure denies pending actions, revokes sessions, and preserves audit records", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp({ db, origin });
  try {
    const reg = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      headers: { origin, "x-blunts-request": "1" },
      payload: { handle: "closer", password },
    });
    const headers = {
      origin,
      "x-blunts-request": "1",
      cookie: `blunts_session=${reg.cookies[0].value}`,
      "x-csrf-token": reg.json().csrf,
    };
    const post = (url: string, payload: any) =>
      app.inject({ method: "POST", url: `/api${url}`, headers, payload });
    await post("/onboarding", {
      adult: true,
      simulation: true,
      agreement: "sandbox-v1",
    });
    const q = await post("/quotes", { kind: "fund", amount: "50" });
    const intent = await app.inject({
      method: "POST",
      url: "/api/intents",
      headers: { ...headers, "idempotency-key": randomUUID() },
      payload: { quoteId: q.json().id },
    });
    assert.equal((await post("/close", { password })).statusCode, 409);
    assert.equal(
      (await post(`/intents/${intent.json().id}/cancel`, {})).statusCode,
      200,
    );
    assert.equal((await post("/close", { password })).statusCode, 200);
    assert.equal(
      (await app.inject({ url: "/api/me", headers })).statusCode,
      401,
    );
    assert.ok((await db.query("SELECT * FROM activity")).length > 0);
  } finally {
    await app.close();
    await db.close();
  }
});
