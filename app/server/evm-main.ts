import { evmConfig } from "./evm-config.js";
import { evmRateLimit } from "./evm-rate-limit.js";
import { ReferenceGapError } from "../shared/reference-price.js";
import { amountUnits } from "../shared/robinhood.js";
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import serveStatic from "@fastify/static";
import { resolve } from "node:path";
import { z } from "zod";
import { market, quote } from "./robinhood.js";
import { solanaRoutes } from "./solana-app.js";
import { solanaExecutionOrigin } from "../shared/solana.js";
const { port, host, origin, execution, trustProxy } = evmConfig(process.env);
const app = Fastify({
  trustProxy,
  logger: {
    redact: ["req.headers.cookie", "req.headers.authorization", "req.body"],
    serializers: {
      req: (req) => ({ method: req.method, url: req.url?.split("?")[0] }),
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
      connectSrc: ["'self'", "https://rpc.mainnet.chain.robinhood.com"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
});
await app.register(rateLimit, evmRateLimit);
app.addHook("onSend", async (req, reply) => {
  if (req.url.startsWith("/api/")) reply.header("cache-control", "no-store");
});
app.get("/api/health", async () => ({
  ok: true,
  mode: "evm-preview",
  transactionsEnabled: execution.enabled,
  origin,
  solana: {
    network: "mainnet",
    transactionsEnabled: solanaExecutionOrigin(origin),
  },
}));
await app.register(solanaRoutes, { origin });
app.get("/api/onchain/market", async (_, reply) => {
  try {
    return { ...(await market()), transactionsEnabled: execution.enabled };
  } catch {
    return reply
      .code(503)
      .send({ error: "QQQ market data is unavailable or stale. Try again." });
  }
});
app.get("/api/onchain/quote", async (req, reply) => {
  const input = z
    .object({ side: z.enum(["fill", "spark"]), amount: z.string().max(32) })
    .strict()
    .safeParse(req.query);
  if (!input.success)
    return reply
      .code(400)
      .send({ error: "Choose Fill or Spark and a valid amount." });
  try {
    amountUnits(input.data.amount, input.data.side === "fill" ? 6 : 18);
  } catch {
    return reply
      .code(400)
      .send({ error: "Enter a positive amount with supported precision." });
  }
  try {
    return {
      ...(await quote(input.data.side, input.data.amount)),
      transactionsEnabled: execution.enabled,
    };
  } catch (error) {
    if (error instanceof ReferenceGapError)
      return reply.code(409).send({ error: error.message });
    return reply.code(503).send({
      error:
        "No verified quote is available for that amount. Try again or reduce the amount.",
    });
  }
});
await app.register(serveStatic, { root: resolve("dist") });
app.setNotFoundHandler((req, reply) =>
  req.url.startsWith("/api/")
    ? reply.code(404).send({ error: "Not found" })
    : reply.sendFile("index.html"),
);
await app.listen({ host, port });
process.once("SIGTERM", () => void app.close());
process.once("SIGINT", () => void app.close());
