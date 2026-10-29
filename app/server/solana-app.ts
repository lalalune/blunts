import Fastify, { type FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { evmRateLimit } from "./evm-rate-limit.js";
import serveStatic from "@fastify/static";
import { resolve } from "node:path";
import { z } from "zod";
import { solanaAmount, solanaExecutionOrigin } from "../shared/solana.js";
import {
  solanaMarket,
  solanaBalances,
  prepareSolana,
  submitSolana,
  solanaReceipt,
} from "./solana.js";

// Deliberately separate, loopback-only process. Existing live EVM server does
// not register these endpoints or enable the unfinished Solana signing route.
export async function createSolanaApp() {
  const app = Fastify({
    bodyLimit: 20000,
    logger: {
      redact: ["req.body", "req.headers.authorization"],
      serializers: {
        req: (r) => ({ method: r.method, url: r.url?.split("?")[0] }),
      },
    },
  });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
  });
  await app.register(rateLimit, evmRateLimit);
  await app.register(solanaRoutes, { origin: "http://localhost:8753" });
  app.get("/api/health", async () => ({
    ok: true,
    mode: "solana-local",
    transactionsEnabled: true,
  }));
  await app.register(serveStatic, { root: resolve("dist") });
  app.setNotFoundHandler((req, reply) =>
    req.url.startsWith("/api/")
      ? reply.code(404).send({ error: "Not found" })
      : reply.sendFile("index.html"),
  );
  return app;
}

export async function solanaRoutes(
  app: FastifyInstance,
  options: { origin: string },
) {
  app.addHook("onRequest", async (req, reply) => {
    if (
      req.method === "POST" &&
      (!solanaExecutionOrigin(req.headers.origin || "") ||
        req.headers.origin !== options.origin ||
        req.headers["x-blunts-request"] !== "1")
    )
      return reply
        .code(403)
        .send({ error: "Open Blunts at its approved address to continue." });
  });
  app.addHook("onSend", async (req, reply) => {
    if (req.url.startsWith("/api/")) reply.header("cache-control", "no-store");
  });
  app.setErrorHandler((error, _, reply) => {
    const status =
      error instanceof Error &&
      "statusCode" in error &&
      typeof error.statusCode === "number" &&
      Number.isInteger(error.statusCode) &&
      error.statusCode >= 400 &&
      error.statusCode <= 599
        ? error.statusCode
        : 400;
    return reply.code(status).send({
      error: error instanceof Error ? error.message : "Request unavailable.",
    });
  });
  const owner = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  app.get("/api/solana/market", async () => solanaMarket());
  app.get("/api/solana/balances", async (req) =>
    solanaBalances(z.object({ owner }).strict().parse(req.query).owner),
  );
  app.post("/api/solana/prepare", async (req) => {
    const input = z
      .object({
        owner,
        side: z.enum(["fill", "spark"]),
        amount: z.string().max(32),
      })
      .strict()
      .parse(req.body);
    return prepareSolana(
      input.owner,
      input.side,
      solanaAmount(input.amount, input.side === "fill" ? 6 : 8),
    );
  });
  app.post("/api/solana/submit", async (req) => {
    const d = z
      .object({ id: z.uuid(), transaction: z.string().max(18000) })
      .strict()
      .parse(req.body);
    return submitSolana(d.id, d.transaction);
  });
  app.get("/api/solana/receipt", async (req) => {
    const d = z
      .object({
        signature: z.string().max(88),
        messageHash: z.string().length(64),
      })
      .strict()
      .parse(req.query);
    return solanaReceipt(d.signature, d.messageHash);
  });
}
