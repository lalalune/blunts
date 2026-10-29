import { test } from "node:test";
import assert from "node:assert/strict";
import { createSolanaApp } from "../server/solana-app.js";
import { solanaRoutes } from "../server/solana-app.js";
import Fastify from "fastify";
test("hosted Solana API accepts only the exact approved origin", async () => {
  const app = Fastify();
  await app.register(solanaRoutes, { origin: "https://blunt.nubs.site" });
  try {
    const request = (origin: string) =>
      app.inject({
        method: "POST",
        url: "/api/solana/prepare",
        headers: { origin, "x-blunts-request": "1" },
        payload: { owner: "invalid", side: "fill", amount: "1" },
      });
    assert.equal((await request("https://blunt.nubs.site")).statusCode, 400);
    for (const origin of [
      "https://blunt.nubs.site.evil",
      "https://evil.example",
      "http://localhost:8753",
    ])
      assert.equal((await request(origin)).statusCode, 403);
  } finally {
    await app.close();
  }
});
test("real Solana HTTP routes reject unapproved origins and malformed requests before execution", async () => {
  const app = await createSolanaApp();
  try {
    for (const origin of [undefined, "https://blunt.nubs.site"]) {
      const r = await app.inject({
        method: "POST",
        url: "/api/solana/prepare",
        headers: { ...(origin ? { origin } : {}), "x-blunts-request": "1" },
        payload: { owner: "bad", side: "fill", amount: "1" },
      });
      assert.equal(r.statusCode, 403);
    }
    const headers = {
      origin: "http://localhost:8753",
      "x-blunts-request": "1",
    };
    const invalid = await app.inject({
      method: "POST",
      url: "/api/solana/prepare",
      headers,
      payload: { owner: "bad", side: "fill", amount: "1" },
    });
    assert.equal(invalid.statusCode, 400);
    const unknown = await app.inject({
      method: "POST",
      url: "/api/solana/submit",
      headers,
      payload: {
        id: "11111111-1111-4111-8111-111111111111",
        transaction: "AA==",
      },
    });
    assert.equal(unknown.statusCode, 400);
    assert.equal(unknown.json().sent, undefined);
    assert.equal((await app.inject({ url: "/api/missing" })).statusCode, 404);
  } finally {
    await app.close();
  }
});
test("Solana API throttling leaves static assets and the local screen loadable", async () => {
  const app = await createSolanaApp();
  try {
    for (let n = 0; n < 90; n++)
      assert.equal((await app.inject({ url: "/api/health" })).statusCode, 200);
    assert.equal((await app.inject({ url: "/api/health" })).statusCode, 429);
    assert.equal((await app.inject({ url: "/sol" })).statusCode, 200);
  } finally {
    await app.close();
  }
});
