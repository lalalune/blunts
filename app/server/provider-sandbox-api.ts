import type { FastifyInstance } from "fastify";
import type { Row } from "./database.js";
import { z } from "zod";
import {
  DinariSandbox,
  dinariInstruction,
  type DinariInstruction,
} from "./dinari-sandbox.js";
import { MoonPaySandbox } from "./moonpay-sandbox.js";
import { SandboxStore, type SandboxCommand } from "./provider-sandbox-store.js";
import { ProviderFault } from "./provider-transport.js";

export type DinariBinding = Omit<DinariInstruction, "id" | "side" | "amount">;
export const dinariBindings = z
  .array(dinariInstruction.omit({ id: true, side: true, amount: true }))
  .max(10_000);
export interface ProviderSandboxOptions {
  store: SandboxStore;
  moonpay?: MoonPaySandbox;
  dinari?: DinariSandbox;
  bindings?: DinariBinding[];
}
export async function registerProviderSandbox(
  app: FastifyInstance,
  options: ProviderSandboxOptions,
  session: (req: unknown) => Promise<Row>,
) {
  const { store, moonpay, dinari } = options;
  await store.init();
  const bindings = new Map<string, DinariBinding>();
  for (const binding of dinariBindings.parse(options.bindings ?? [])) {
    if (bindings.has(binding.customerId))
      throw new ProviderFault("configuration");
    bindings.set(binding.customerId, binding);
  }
  const id = z.string().uuid();
  async function account(req: unknown) {
    const s = await session(req);
    if (s.status !== "active" || !s.steward?.wallet?.address)
      throw new ProviderFault("rejected");
    return s;
  }
  app.get("/api/providers/sandbox", async (req) => {
    await account(req);
    return {
      enabled: true,
      environment: "sandbox",
      moonpay: !!moonpay,
      dinari: !!dinari,
      appMoneyMode: "simulation",
      providerAcceptance: false,
    };
  });
  app.post("/api/providers/sandbox/moonpay/quote", async (req) => {
    await account(req);
    if (!moonpay) throw new ProviderFault("configuration");
    const { amount } = z
      .object({ amount: z.string().max(24) })
      .strict()
      .parse(req.body);
    return moonpay.quote(amount);
  });
  app.post("/api/providers/sandbox/moonpay", async (req) => {
    const s = await account(req);
    if (!moonpay) throw new ProviderFault("configuration");
    const body = z
      .object({ side: z.enum(["buy", "sell"]), amount: z.string().max(24) })
      .strict()
      .parse(req.body);
    const command: SandboxCommand = {
      provider: "moonpay",
      instruction: {
        id: id.parse(req.headers["idempotency-key"]),
        customerId: s.user_id,
        wallet: s.steward.wallet.address,
        ...body,
      },
    };
    // Validate before storing so invalid amounts cannot consume an instruction ID.
    moonpay.checkout(command.instruction);
    const key = await store.remember(command);
    const record = await store.prepare(key, async (value) => {
      if (value.provider !== "moonpay") throw new ProviderFault("mismatch");
      return {
        checkoutUrl: moonpay.checkout(value.instruction),
        settled: false,
      };
    });
    return {
      id: key,
      state: record.state,
      artifact: record.artifact,
      settled: false,
      creditsAppBalance: false,
    };
  });
  app.post("/api/providers/sandbox/dinari/permit", async (req) => {
    const s = await account(req);
    const binding = bindings.get(s.user_id);
    if (!dinari || !binding) throw new ProviderFault("configuration");
    if (binding.wallet.toLowerCase() !== s.steward.wallet.address.toLowerCase())
      throw new ProviderFault("mismatch");
    const body = z
      .object({ side: z.enum(["BUY", "SELL"]), amount: z.string().max(24) })
      .strict()
      .parse(req.body);
    const command: SandboxCommand = {
      provider: "dinari",
      instruction: {
        ...binding,
        ...body,
        id: id.parse(req.headers["idempotency-key"]),
      },
    };
    const key = await store.remember(command);
    const record = await store.prepare(key, async (value) => {
      if (value.provider !== "dinari") throw new ProviderFault("mismatch");
      return dinari.prepare(value.instruction);
    });
    return {
      id: key,
      state: record.state,
      artifact: record.artifact,
      signingApproved: false,
      creditsAppBalance: false,
    };
  });
  app.post("/api/providers/sandbox/:id/observe", async (req) => {
    const s = await account(req);
    const key = id.parse((req.params as { id: string }).id);
    const record = await store.load(key);
    if (record.payload.instruction.customerId !== s.user_id)
      throw new ProviderFault("rejected");
    const value = record.payload;
    if (
      value.instruction.wallet.toLowerCase() !==
      s.steward.wallet.address.toLowerCase()
    )
      throw new ProviderFault("mismatch");
    const observation =
      value.provider === "moonpay"
        ? await (moonpay ?? missing()).observe(value.instruction)
        : await (dinari ?? missing()).observe(value.instruction);
    await store.reconcile(key, observation);
    return { ...observation, creditsAppBalance: false };
  });
  // Encapsulated raw parser: normal app JSON/CSRF routes are unchanged. The
  // callback has its own authentication, so it lives outside the /api origin gate.
  await app.register(async (hooks) => {
    hooks.removeContentTypeParser("application/json");
    hooks.addContentTypeParser(
      "application/json",
      { parseAs: "buffer" },
      (_req, body, done) => done(null, body),
    );
    hooks.post(
      "/provider-hooks/moonpay",
      { bodyLimit: 131_072 },
      async (req, reply) => {
        if (!moonpay) throw new ProviderFault("configuration");
        const header = req.headers["moonpay-signature-v2"];
        if (typeof header !== "string" || !Buffer.isBuffer(req.body))
          throw new ProviderFault("rejected");
        const event = moonpay.event(req.body, header);
        let record;
        try {
          record = await store.load(event.instructionId);
        } catch (error) {
          if (error instanceof ProviderFault && error.kind === "invalid_input")
            return reply.code(202).send({ ignored: true });
          throw error;
        }
        if (record.payload.provider !== "moonpay")
          throw new ProviderFault("mismatch");
        return reply.code(202).send(await store.event(event));
      },
    );
  });
}
function missing(): never {
  throw new ProviderFault("configuration");
}
