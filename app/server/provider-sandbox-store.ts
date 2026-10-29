import { createHash } from "node:crypto";
import { z } from "zod";
import type { Database } from "./database.js";
import { dinariInstruction } from "./dinari-sandbox.js";
import { moonpayInstruction } from "./moonpay-sandbox.js";
import { ProviderFault } from "./provider-transport.js";

export const sandboxCommand = z.discriminatedUnion("provider", [
  z
    .object({ provider: z.literal("moonpay"), instruction: moonpayInstruction })
    .strict(),
  z
    .object({ provider: z.literal("dinari"), instruction: dinariInstruction })
    .strict(),
]);
export type SandboxCommand = z.infer<typeof sandboxCommand>;
type SandboxRecord = {
  id: string;
  provider: "moonpay" | "dinari";
  state: "prepared" | "submitting" | "artifact_ready" | "unknown" | "observed";
  artifact: unknown | null;
  observation: unknown | null;
  failure: string | null;
  payload: SandboxCommand;
};

/** Isolated operator workbench, deliberately outside the app's simulated ledger.
 * Prepared commands are committed before any provider I/O. A crash/timeout never
 * authorizes a second POST. Only read-only reconciliation may follow uncertainty.
 */
export class SandboxStore {
  constructor(private readonly db: Database) {}
  async init() {
    await this.db.transaction(async (tx) => {
      await tx.query(`CREATE TABLE IF NOT EXISTS sandbox_commands (
        id TEXT PRIMARY KEY, provider TEXT NOT NULL, fingerprint TEXT NOT NULL,
        payload JSONB NOT NULL, state TEXT NOT NULL CHECK (state IN ('prepared','submitting','artifact_ready','unknown','observed')),
        artifact JSONB, observation JSONB, failure TEXT, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)`);
      await tx.query(`CREATE TABLE IF NOT EXISTS sandbox_events (
        digest TEXT PRIMARY KEY, instruction_id TEXT NOT NULL REFERENCES sandbox_commands(id),
        event_type TEXT NOT NULL, transaction_id TEXT NOT NULL, provider_updated_at TEXT NOT NULL,
        received_at BIGINT NOT NULL, UNIQUE(instruction_id,event_type,transaction_id,provider_updated_at))`);
    });
  }
  async remember(input: SandboxCommand) {
    const parsed = sandboxCommand.safeParse(input);
    if (!parsed.success) throw new ProviderFault("invalid_input");
    const command = parsed.data;
    const payload = JSON.stringify(command);
    const fingerprint = createHash("sha256").update(payload).digest("hex");
    return this.db.transaction(async (tx) => {
      const [existing] = await tx.query(
        "SELECT fingerprint FROM sandbox_commands WHERE id=$1",
        [command.instruction.id],
      );
      if (existing) {
        if (existing.fingerprint !== fingerprint)
          throw new ProviderFault("mismatch");
        return command.instruction.id;
      }
      await tx.query(
        "INSERT INTO sandbox_commands(id,provider,fingerprint,payload,state,created_at,updated_at) VALUES ($1,$2,$3,$4,'prepared',$5,$5)",
        [
          command.instruction.id,
          command.provider,
          fingerprint,
          payload,
          Date.now(),
        ],
      );
      return command.instruction.id;
    });
  }
  async load(id: string): Promise<SandboxRecord> {
    const [command] = await this.db.query<
      Omit<SandboxRecord, "payload"> & { payload: unknown }
    >("SELECT * FROM sandbox_commands WHERE id=$1", [id]);
    if (!command) throw new ProviderFault("invalid_input");
    return { ...command, payload: sandboxCommand.parse(command.payload) };
  }
  async prepare(
    id: string,
    operation: (command: SandboxCommand) => Promise<unknown>,
  ) {
    const claimed = await this.db.transaction(async (tx) => {
      const [row] = await tx.query(
        "UPDATE sandbox_commands SET state='submitting',updated_at=$2 WHERE id=$1 AND state='prepared' RETURNING payload",
        [id, Date.now()],
      );
      return row;
    });
    if (!claimed) return this.load(id);
    try {
      // This callback is OUTSIDE a database transaction. Even if local storage
      // fails after external acceptance, the committed submitting state remains.
      const result = await operation(sandboxCommand.parse(claimed.payload));
      const artifact = JSON.stringify(result);
      if (!artifact || Buffer.byteLength(artifact) > 131_072)
        throw new ProviderFault("invalid_response");
      await this.db.query(
        "UPDATE sandbox_commands SET state=CASE WHEN state='observed' THEN state ELSE 'artifact_ready' END,artifact=$2,updated_at=$3 WHERE id=$1 AND state IN ('submitting','observed')",
        [id, artifact, Date.now()],
      );
    } catch (error) {
      const failure =
        error instanceof ProviderFault ? error.kind : "unavailable";
      await this.db.query(
        "UPDATE sandbox_commands SET state=CASE WHEN state='observed' THEN state ELSE 'unknown' END,failure=$2,updated_at=$3 WHERE id=$1 AND state IN ('submitting','observed')",
        [id, failure, Date.now()],
      );
    }
    return this.load(id);
  }
  async reconcile(
    id: string,
    observation: { state: string; settled: false; updatedAt?: string },
  ) {
    if (observation.settled !== false) throw new ProviderFault("invalid_input");
    await this.db.transaction(async (tx) => {
      const [record] = await tx.query(
        "SELECT observation FROM sandbox_commands WHERE id=$1",
        [id],
      );
      if (!record) throw new ProviderFault("invalid_input");
      const previous = record.observation;
      if (
        previous &&
        previous.state !== "not_found" &&
        observation.state === "not_found"
      )
        throw new ProviderFault("ambiguous");
      if (observation.updatedAt) {
        const next = Date.parse(observation.updatedAt),
          prior = Date.parse(previous?.updatedAt ?? "");
        if (!Number.isFinite(next)) throw new ProviderFault("invalid_input");
        if (Number.isFinite(prior) && next < prior) return;
        if (next === prior && previous.state !== observation.state)
          throw new ProviderFault("ambiguous");
      }
      await tx.query(
        "UPDATE sandbox_commands SET observation=$2,state=CASE WHEN $3='not_found' THEN state ELSE 'observed' END,updated_at=$4 WHERE id=$1",
        [id, JSON.stringify(observation), observation.state, Date.now()],
      );
    });
    return this.load(id);
  }
  async event(event: {
    digest: string;
    type: string;
    transactionId: string;
    instructionId: string;
    updatedAt: string;
  }) {
    const command = await this.load(event.instructionId);
    if (
      command.payload.provider !== "moonpay" ||
      event.type.startsWith("sell_") !==
        (command.payload.instruction.side === "sell")
    )
      throw new ProviderFault("mismatch");
    const inserted = await this.db.query(
      "INSERT INTO sandbox_events VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING digest",
      [
        event.digest,
        event.instructionId,
        event.type,
        event.transactionId,
        event.updatedAt,
        Date.now(),
      ],
    );
    // Webhooks are authenticated hints only: no balances or command states move.
    return { inserted: inserted.length === 1, reconciliationRequired: true };
  }
}
