import Fastify from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import staticFiles from "@fastify/static";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { z, ZodError } from "zod";
import { type Database, type Row, migrate } from "./database.js";
import { token, digest, hashPassword, verifyPassword } from "./auth.js";
import {
  balances,
  createQuote,
  createIntent,
  createFlow,
  requireThat,
  Problem,
  audit,
  now,
  returnIntent,
} from "./domain.js";
import { KINDS } from "../shared/money.js";
const credentials = z
  .object({
    handle: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{3,32}$/)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(12).max(128),
  })
  .strict();
const id = z.string().uuid();
export interface AppOptions {
  db: Database;
  origin: string;
  mode?: string;
  serveStatic?: boolean;
  logger?: boolean;
}
export async function createApp(options: AppOptions) {
  if ((options.mode ?? "simulation") !== "simulation")
    throw new Error(
      "Live money is disabled: no approved production provider adapters are configured.",
    );
  const { db, origin } = options;
  const app = Fastify({
    logger: options.logger
      ? {
          redact: [
            "req.headers.cookie",
            "req.headers.authorization",
            "req.body",
            "res.headers.set-cookie",
          ],
        }
      : false,
    bodyLimit: 16_384,
    trustProxy: false,
  });
  await migrate(db);
  await app.register(cookie);
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: origin.startsWith("https:") ? [] : null,
      },
    },
    hsts: origin.startsWith("https:"),
  });
  await app.register(rateLimit, { max: 180, timeWindow: "1 minute" });
  app.addHook("onRequest", async (req, reply) => {
    if (req.url.startsWith("/api/")) {
      reply.header("Cache-Control", "no-store");
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        requireThat(
          req.headers.origin === origin &&
            req.headers["x-blunts-request"] === "1",
          "Request origin could not be verified.",
          403,
        );
      }
    }
  });
  async function session(req: any): Promise<Row> {
    const raw = req.cookies.blunts_session;
    requireThat(typeof raw === "string", "Sign in to continue.", 401);
    const [s] = await db.query(
      `SELECT s.*,u.handle,u.status FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.hash=$1 AND s.expires_at>$2`,
      [digest(raw), now()],
    );
    requireThat(
      s && s.status !== "closed",
      "Session expired. Sign in again.",
      401,
    );
    if (!["GET", "HEAD"].includes(req.method))
      requireThat(
        req.headers["x-csrf-token"] === s.csrf,
        "Refresh the page and try again.",
        403,
      );
    return s;
  }
  async function startSession(user: string, reply: any) {
    const raw = token(),
      csrf = token();
    await db.query("INSERT INTO sessions VALUES ($1,$2,$3,$4)", [
      digest(raw),
      user,
      csrf,
      now() + 8 * 60 * 60_000,
    ]);
    reply.setCookie("blunts_session", raw, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: origin.startsWith("https:"),
      maxAge: 8 * 60 * 60,
    });
    return { csrf };
  }
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof ZodError)
      return reply.code(400).send({
        error: error.issues
          .map((x) => `${x.path.join(".")}: ${x.message}`)
          .join("; "),
      });
    if (error instanceof Problem)
      return reply.code(error.statusCode).send({ error: error.message });
    if ((error as any).code === "23505")
      return reply.code(409).send({
        error:
          "That value is already in use. Sign in or choose another handle.",
      });
    if ((error as any).statusCode === 429)
      return reply
        .code(429)
        .send({ error: "Too many requests. Wait a minute and try again." });
    if ((error as any).statusCode >= 400 && (error as any).statusCode < 500)
      return reply
        .code((error as any).statusCode)
        .send({ error: "Invalid request." });
    req.log.error({ code: (error as any).code }, "Request failed");
    return reply.code(500).send({
      error:
        "The request could not be completed. Check activity before retrying.",
    });
  });
  const authConfig = {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  };
  app.get("/api/health", async () => {
    await db.query("SELECT 1");
    return { ok: true, mode: "simulation", liveMoneyEnabled: false };
  });
  app.get("/api/capabilities", async () => ({
    mode: "simulation",
    network: "Arbitrum",
    asset: "USDC",
    investment: "DEMO_QQQ",
    feeBps: 100,
    feeCap: null,
    providers: [
      { name: "Deterministic simulator", enabled: true },
      {
        name: "MoonPay / Cash App",
        enabled: false,
        reason:
          "Partner entitlement, credentials and signed integration not configured.",
      },
      {
        name: "Dinari US",
        enabled: false,
        reason: "Program, instrument/network and fee approvals required.",
      },
      {
        name: "Privy",
        enabled: false,
        reason: "Wallet project and signer/recovery configuration required.",
      },
    ],
    disclosure:
      "No real wallets, securities, payment accounts or money. Never send funds to this sandbox.",
  }));
  app.post("/api/auth/register", authConfig, async (req, reply) => {
    const body = credentials.parse(req.body);
    const user = randomUUID(),
      recoveryCode = token();
    const password = await hashPassword(body.password);
    await db.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO users(id,handle,password,recovery,created_at) VALUES ($1,$2,$3,$4,$5)",
        [user, body.handle, password, digest(recoveryCode), now()],
      );
      await audit(tx, user, "Sandbox account created.");
    });
    return { ...(await startSession(user, reply)), recoveryCode };
  });
  app.post("/api/auth/login", authConfig, async (req, reply) => {
    const body = credentials.parse(req.body);
    const [u] = await db.query("SELECT * FROM users WHERE handle=$1", [
      body.handle,
    ]);
    const valid = await verifyPassword(
      body.password,
      u?.password ?? `${"0".repeat(32)}:${"0".repeat(128)}`,
    );
    requireThat(
      u && valid && u.status !== "closed",
      "Handle or password is incorrect.",
      401,
    );
    return startSession(u.id, reply);
  });
  app.post("/api/auth/recover", authConfig, async (req, reply) => {
    const body = credentials
      .extend({ recoveryCode: z.string().min(20).max(128) })
      .parse(req.body);
    const password = await hashPassword(body.password),
      newCode = token();
    const user = await db.transaction(async (tx) => {
      const [u] = await tx.query(
        "SELECT * FROM users WHERE handle=$1 AND recovery=$2 AND status<>$3",
        [body.handle, digest(body.recoveryCode), "closed"],
      );
      requireThat(u, "Recovery details are incorrect.", 401);
      await tx.query("UPDATE users SET password=$1,recovery=$2 WHERE id=$3", [
        password,
        digest(newCode),
        u.id,
      ]);
      await tx.query("DELETE FROM sessions WHERE user_id=$1", [u.id]);
      await audit(tx, u.id, "Password recovered; all sessions revoked.");
      return u.id;
    });
    return { ...(await startSession(user, reply)), recoveryCode: newCode };
  });
  app.post("/api/auth/backup", authConfig, async (req) => {
    const s = await session(req);
    const { password } = z
      .object({ password: z.string().max(128) })
      .strict()
      .parse(req.body);
    const [user] = await db.query("SELECT password FROM users WHERE id=$1", [
      s.user_id,
    ]);
    requireThat(
      await verifyPassword(password, user.password),
      "Password confirmation failed.",
      401,
    );
    const recoveryCode = token();
    await db.transaction(async (tx) => {
      const updated = await tx.query(
        "UPDATE users SET recovery=$1 WHERE id=$2 AND password=$3 AND status<>'closed' RETURNING id",
        [digest(recoveryCode), s.user_id, user.password],
      );
      requireThat(updated.length, "Account changed. Sign in again.", 401);
      await audit(tx, s.user_id, "Recovery code replaced.");
    });
    return { recoveryCode };
  });
  app.post("/api/auth/logout", async (req, reply) => {
    const s = await session(req);
    await db.query("DELETE FROM sessions WHERE hash=$1", [s.hash]);
    reply.clearCookie("blunts_session", { path: "/" });
    return { ok: true };
  });
  app.get("/api/me", async (req) => {
    const s = await session(req);
    return db.transaction(async (tx) => ({
      handle: s.handle,
      status: s.status,
      csrf: s.csrf,
      simulation: true,
      balances: await balances(tx, s.user_id),
      destinations: await tx.query(
        "SELECT id,label,rail,address FROM destinations WHERE user_id=$1 ORDER BY created_at",
        [s.user_id],
      ),
      intents: await tx.query(
        "SELECT id,kind,state,data,destination_id,created_at,updated_at FROM intents WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100",
        [s.user_id],
      ),
      flows: await tx.query(
        "SELECT id,kind,state,error,created_at FROM flows WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",
        [s.user_id],
      ),
      support: await tx.query(
        "SELECT id,message,created_at FROM support_cases WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30",
        [s.user_id],
      ),
    }));
  });
  app.post("/api/onboarding", async (req) => {
    const s = await session(req);
    z.object({
      adult: z.literal(true),
      simulation: z.literal(true),
      agreement: z.literal("sandbox-v1"),
    })
      .strict()
      .parse(req.body);
    await db.transaction(async (tx) => {
      const [u] = await tx.query("SELECT status FROM users WHERE id=$1", [
        s.user_id,
      ]);
      requireThat(
        u.status === "new" || u.status === "active",
        "This account cannot be activated.",
      );
      if (u.status === "new") {
        await tx.query("UPDATE users SET status='active' WHERE id=$1", [
          s.user_id,
        ]);
        await tx.query("INSERT INTO consents VALUES ($1,$2,$3,$4)", [
          randomUUID(),
          s.user_id,
          "sandbox-v1",
          now(),
        ]);
        await audit(
          tx,
          s.user_id,
          "Sandbox agreement accepted; no real identity verification performed.",
        );
      }
    });
    return { ok: true };
  });
  app.post("/api/destinations", authConfig, async (req) => {
    const s = await session(req);
    const body = z
      .object({
        rail: z.enum(["cash_app_demo", "wallet_demo"]),
        label: z.string().trim().min(2).max(50),
        password: z.string().max(128),
      })
      .strict()
      .parse(req.body);
    const [u] = await db.query("SELECT password FROM users WHERE id=$1", [
      s.user_id,
    ]);
    requireThat(
      await verifyPassword(body.password, u.password),
      "Password confirmation failed.",
      401,
    );
    const destinationId = randomUUID();
    await db.transaction(async (tx) => {
      requireThat(
        (
          await tx.query("SELECT id FROM destinations WHERE user_id=$1", [
            s.user_id,
          ])
        ).length < 20,
        "Destination limit reached.",
      );
      await tx.query("INSERT INTO destinations VALUES ($1,$2,$3,$4,$5,$6)", [
        destinationId,
        s.user_id,
        body.label,
        body.rail,
        `DEMO-NOT-AN-ADDRESS-${destinationId.slice(0, 8)}`,
        now(),
      ]);
      await audit(tx, s.user_id, "Simulated payout destination added.");
    });
    return { id: destinationId };
  });
  app.post(
    "/api/flows",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (req) => {
      const s = await session(req);
      const body = z
        .object({
          kind: z.enum(["fill", "spark"]),
          amount: z.string().max(32),
          all: z.boolean().optional(),
        })
        .strict()
        .parse(req.body);
      const key = id.parse(req.headers["idempotency-key"]);
      return db.transaction((tx) => createFlow(tx, s.user_id, key, body));
    },
  );
  app.post("/api/quotes", async (req) => {
    const s = await session(req);
    const body = z
      .object({
        kind: z.enum(KINDS),
        amount: z.string().max(32),
        all: z.boolean().optional(),
        destinationId: id.optional(),
      })
      .strict()
      .parse(req.body);
    return db.transaction((tx) => createQuote(tx, s.user_id, body));
  });
  app.post(
    "/api/intents",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (req) => {
      const s = await session(req);
      const body = z
        .object({
          quoteId: id,
          scenario: z
            .enum(["success", "reject", "timeout", "partial"])
            .default("success"),
          password: z.string().max(128).optional(),
        })
        .strict()
        .parse(req.body);
      const key = z.string().uuid().parse(req.headers["idempotency-key"]);
      const [q] = await db.query(
        "SELECT kind FROM quotes WHERE id=$1 AND user_id=$2",
        [body.quoteId, s.user_id],
      );
      if (q?.kind === "payout") {
        const [u] = await db.query("SELECT password FROM users WHERE id=$1", [
          s.user_id,
        ]);
        requireThat(
          body.password && (await verifyPassword(body.password, u.password)),
          "Confirm your password for this payout.",
          401,
        );
      }
      return db.transaction((tx) =>
        createIntent(tx, s.user_id, body.quoteId, key, body.scenario),
      );
    },
  );
  app.post("/api/intents/:id/authorize", async (req) => {
    const s = await session(req);
    const actionId = id.parse((req.params as any).id);
    z.object({ confirm: z.literal(true) })
      .strict()
      .parse(req.body);
    await db.transaction(async (tx) => {
      const [i] = await tx.query(
        "SELECT * FROM intents WHERE id=$1 AND user_id=$2",
        [actionId, s.user_id],
      );
      requireThat(i, "Action not found.", 404);
      if (i.state !== "awaiting_authorization") return;
      requireThat(
        Number(i.created_at) > now() - 15 * 60_000,
        "Funding authorization expired.",
      );
      await tx.query(
        "UPDATE intents SET state='queued',due_at=$1,updated_at=$1 WHERE id=$2",
        [now(), actionId],
      );
      await audit(tx, s.user_id, "Simulated funding authorized.", actionId);
    });
    return { ok: true };
  });
  app.post("/api/intents/:id/cancel", async (req) => {
    const s = await session(req);
    const actionId = id.parse((req.params as any).id);
    await db.transaction(async (tx) => {
      const [i] = await tx.query(
        "SELECT * FROM intents WHERE id=$1 AND user_id=$2",
        [actionId, s.user_id],
      );
      requireThat(i, "Action not found.", 404);
      requireThat(
        i.state === "awaiting_authorization",
        "A submitted action cannot be cancelled here.",
      );
      await tx.query(
        "UPDATE intents SET state='cancelled',updated_at=$1 WHERE id=$2",
        [now(), actionId],
      );
      await audit(tx, s.user_id, "Unsubmitted funding cancelled.", actionId);
    });
    return { ok: true };
  });
  app.post("/api/intents/:id/simulate-return", async (req) => {
    const s = await session(req);
    const actionId = id.parse((req.params as any).id);
    await db.transaction((tx) => returnIntent(tx, s.user_id, actionId));
    return { ok: true };
  });
  app.get("/api/activity", async (req) => {
    const s = await session(req);
    return db.query(
      "SELECT id,intent_id,message,created_at FROM activity WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 200",
      [s.user_id],
    );
  });
  app.get("/api/documents/statement", async (req, reply) => {
    const s = await session(req);
    reply.header(
      "Content-Disposition",
      'attachment; filename="blunts-sandbox-statement.json"',
    );
    return db.transaction(async (tx) => ({
      title:
        "SIMULATED activity statement — not a tax document or brokerage statement",
      generatedAt: new Date().toISOString(),
      handle: s.handle,
      balances: await balances(tx, s.user_id),
      intents: await tx.query(
        "SELECT id,kind,state,data,created_at FROM intents WHERE user_id=$1 ORDER BY created_at",
        [s.user_id],
      ),
      postings: await tx.query(
        "SELECT p.*,j.event,j.created_at FROM postings p JOIN journals j ON p.journal_id=j.id WHERE p.user_id=$1 AND p.account='customer' ORDER BY j.created_at",
        [s.user_id],
      ),
    }));
  });
  app.post("/api/support", async (req) => {
    const s = await session(req);
    const { message } = z
      .object({ message: z.string().trim().min(10).max(2000) })
      .strict()
      .parse(req.body);
    const caseId = randomUUID();
    await db.query("INSERT INTO support_cases VALUES ($1,$2,$3,$4)", [
      caseId,
      s.user_id,
      message,
      now(),
    ]);
    return {
      id: caseId,
      notice:
        "Saved locally for sandbox testing; no support team has been notified.",
    };
  });
  app.post("/api/close", authConfig, async (req, reply) => {
    const s = await session(req);
    const { password } = z
      .object({ password: z.string().max(128) })
      .strict()
      .parse(req.body);
    const [u] = await db.query("SELECT password FROM users WHERE id=$1", [
      s.user_id,
    ]);
    requireThat(
      await verifyPassword(password, u.password),
      "Password confirmation failed.",
      401,
    );
    await db.transaction(async (tx) => {
      const b = await balances(tx, s.user_id);
      requireThat(
        b.cash === "0" && b.units === "0",
        "Sell and withdraw your remaining simulated balance first.",
      );
      requireThat(
        !(
          await tx.query(
            "SELECT id FROM intents WHERE user_id=$1 AND state NOT IN ('completed','failed','returned','cancelled','expired')",
            [s.user_id],
          )
        ).length,
        "Resolve pending actions first.",
      );
      await audit(
        tx,
        s.user_id,
        "Account closed. Sandbox financial records retained until operator reset.",
      );
      await tx.query(
        "UPDATE users SET status='closed',password='',recovery='' WHERE id=$1",
        [s.user_id],
      );
      await tx.query("DELETE FROM sessions WHERE user_id=$1", [s.user_id]);
    });
    reply.clearCookie("blunts_session", { path: "/" });
    return { ok: true };
  });
  if (options.serveStatic) {
    const root = resolve("dist");
    if (!existsSync(`${root}/index.html`))
      throw new Error("Build the browser app first with npm run build.");
    await app.register(staticFiles, { root, decorateReply: true });
    app.setNotFoundHandler((req, reply) =>
      req.url.startsWith("/api/")
        ? reply.code(404).send({ error: "Endpoint not found." })
        : req.method === "GET" && !req.url.includes(".")
          ? reply.sendFile("index.html")
          : reply.code(404).send({ error: "Not found." }),
    );
  }
  return app;
}
