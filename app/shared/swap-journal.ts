import { finalityProof, finalityCheck } from "./finality.js";
import { z } from "zod";
import { type Address, type Hex } from "viem";
import { verifiedSwapPlan, type SwapPlan } from "./swap-plan.js";
const hex = z.string().regex(/^0x(?:[0-9a-fA-F]{2})*$/);
const hash = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const attemptSchema = z
  .object({
    planId: hash,
    step: z.number().int().min(0).max(2),
    owner: address,
    chainId: z.union([z.literal(31337), z.literal(4663)]),
    call: z
      .object({
        kind: z.enum(["reset", "approve", "swap"]),
        to: address,
        data: hex,
        value: z.literal("0x0"),
      })
      .strict(),
    nonce: z.number().int().safe().nonnegative(),
    state: z.enum([
      "awaiting_wallet",
      "unknown",
      "cancelled",
      "pending",
      "confirmed",
      "included",
      "reverted",
      "reorged",
      "mismatch",
      "replaced",
    ]),
    replacement: z
      .object({
        hash,
        kind: z.enum(["same_call", "cancel"]),
        outcome: z.enum(["success", "reverted"]),
        blockHash: hash,
        blockNumber: z.string().regex(/^\d+$/),
        observedAt: z.number().int().safe().nonnegative(),
      })
      .strict()
      .optional(),
    finality: finalityProof.optional(),
    finalityCheck: finalityCheck.optional(),
    tracked: z.literal(true).optional(),
    observedAt: z.number().int().safe().nonnegative().optional(),
    checkedAt: z.number().int().safe().nonnegative().optional(),
    observation: z.enum(["verified", "unavailable"]).optional(),
    hash: hash.optional(),
    blockHash: hash.optional(),
    blockNumber: z.string().regex(/^\d+$/).optional(),
  })
  .strict()
  .superRefine((record, context) => {
    if (record.state === "replaced" && !record.replacement)
      context.addIssue({
        code: "custom",
        message: "Replacement inclusion proof is required.",
      });
  });
export type SwapAttempt = z.infer<typeof attemptSchema>;
export interface JournalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export class SwapJournal {
  readonly key: string;
  constructor(
    private storage: JournalStorage,
    readonly owner: Address,
    readonly chainId: 4663 | 31337 = 31337,
  ) {
    this.key = `blunts:swap:${chainId}:${owner.toLowerCase()}`;
  }
  read(): SwapAttempt[] {
    const raw = this.storage.getItem(this.key);
    if (raw === null) return [];
    if (raw.length > 200000)
      throw Error("Swap history is too large. Existing records preserved.");
    const records = z.array(attemptSchema).max(100).parse(JSON.parse(raw));
    if (
      records.some(
        (r) =>
          r.owner.toLowerCase() !== this.owner.toLowerCase() ||
          r.chainId !== this.chainId,
      )
    )
      throw Error("Wallet history did not match.");
    if (
      records.some(
        (r) =>
          (r.chainId === 4663 && r.state === "confirmed") ||
          (r.chainId === 31337 && r.state === "included"),
      )
    )
      throw Error("Activity state did not match its chain.");
    return records;
  }
  save(record: SwapAttempt) {
    const records = this.read();
    const validated = attemptSchema.parse(record);
    if (
      validated.owner.toLowerCase() !== this.owner.toLowerCase() ||
      validated.chainId !== this.chainId ||
      (validated.chainId === 4663 && validated.state === "confirmed") ||
      (validated.chainId === 31337 && validated.state === "included")
    )
      throw Error("Wallet history did not match.");
    const index = records.findIndex(
      (r) => r.planId === record.planId && r.step === record.step,
    );
    if (index < 0) {
      if (records.length >= 100)
        throw Error("Export history before starting another swap.");
      records.push(validated);
    } else {
      const previous = records[index];
      if (
        previous.nonce !== validated.nonce ||
        JSON.stringify(previous.call) !== JSON.stringify(validated.call) ||
        (previous.hash && previous.hash !== validated.hash) ||
        (previous.replacement &&
          previous.replacement.hash !== validated.replacement?.hash)
      )
        throw Error("Existing wallet instruction cannot be replaced.");
      records[index] = validated;
    }
    const serialized = JSON.stringify(records);
    if (serialized.length > 200000)
      throw Error(
        "Activity storage limit reached. Export existing records before another request.",
      );
    this.storage.setItem(this.key, serialized);
  }
  /** Caller must hold the wallet's cross-tab lock. A slow observation may
   * never overwrite a record changed since its read began. */
  saveObservation(record: SwapAttempt, expected: SwapAttempt): SwapAttempt {
    const current = this.read().find(
      (r) => r.planId === expected.planId && r.step === expected.step,
    );
    if (!current) throw Error("Existing activity record is missing.");
    if (
      JSON.stringify(current) !== JSON.stringify(attemptSchema.parse(expected))
    )
      return current;
    this.save(record);
    return record;
  }
}
export type WalletRpc = {
  request(args: { method: string; params?: unknown[] }): Promise<any>;
};
export type ExecutionReader = {
  getChainId(): Promise<number>;
  getTransactionCount(args: {
    address: Address;
    blockTag: "pending";
  }): Promise<number>;
  call(args: {
    account: Address;
    to: Address;
    data: Hex;
    value: bigint;
  }): Promise<unknown>;
};
export type ExecutionPolicy = {
  chainId: 4663 | 31337;
  enabled: boolean;
  preflight?: (plan: SwapPlan, step: number) => Promise<void>;
};
/** Every request is explicit and single-step. Defaults to the isolated fork.
 * Mainnet additionally requires an enabled policy and a fresh preflight.
 * The shipped local UI policy remains disabled. */
export async function submitSwapStep(
  plan: SwapPlan,
  step: number,
  wallet: WalletRpc,
  reader: ExecutionReader,
  journal: SwapJournal,
  locked: <T>(fn: () => Promise<T>) => Promise<T>,
  policy: ExecutionPolicy = { chainId: 31337, enabled: true },
): Promise<SwapAttempt> {
  if (
    !policy.enabled ||
    ![31337, 4663].includes(policy.chainId) ||
    (policy.chainId === 4663 && !policy.preflight)
  )
    throw Error("Wallet execution is disabled or missing required preflight.");
  return locked(async () => {
    const canonical = verifiedSwapPlan(plan);
    if (
      journal.chainId !== policy.chainId ||
      (await reader.getChainId()) !== policy.chainId ||
      Number(await wallet.request({ method: "eth_chainId" })) !== policy.chainId
    )
      throw Error("Execution wallet and reader must match the approved chain.");
    const accounts = await wallet.request({ method: "eth_accounts" });
    if (
      !Array.isArray(accounts) ||
      accounts[0]?.toLowerCase() !== plan.owner.toLowerCase() ||
      journal.owner.toLowerCase() !== plan.owner.toLowerCase()
    )
      throw Error("Wallet changed. Prepare again.");
    if (plan.quote.expiresAt <= Date.now())
      throw Error("Quote expired. Prepare again.");
    const call = plan.calls[step];
    if (!call) throw Error("Invalid wallet step.");
    const records = journal.read();
    if (
      records.some((r) =>
        [
          "awaiting_wallet",
          "unknown",
          "pending",
          "reorged",
          "mismatch",
        ].includes(r.state),
      )
    )
      throw Error("Reconcile the existing wallet attempt first.");
    if (records.some((r) => r.planId === plan.id && r.step === step))
      throw Error(
        "This wallet step already has an attempt. It will not be replayed.",
      );
    if (
      step > 0 &&
      !records.some(
        (r) =>
          r.planId === plan.id &&
          r.step === step - 1 &&
          r.state === (policy.chainId === 31337 ? "confirmed" : "included"),
      )
    )
      throw Error("Confirm the previous wallet step first.");
    await policy.preflight?.(plan, step);
    await reader.call({
      account: plan.owner,
      to: call.to,
      data: call.data,
      value: 0n,
    });
    const nonce = await reader.getTransactionCount({
      address: plan.owner,
      blockTag: "pending",
    });
    // The wallet may have changed while preflight was running.
    const currentAccounts = await wallet.request({ method: "eth_accounts" });
    if (
      !Array.isArray(currentAccounts) ||
      currentAccounts[0]?.toLowerCase() !== plan.owner.toLowerCase() ||
      Number(await wallet.request({ method: "eth_chainId" })) !== policy.chainId
    )
      throw Error("Wallet changed during preflight. Prepare again.");
    const record: SwapAttempt = {
      planId: plan.id,
      step,
      owner: plan.owner,
      chainId: policy.chainId,
      call,
      nonce,
      state: "awaiting_wallet",
    };
    if (plan.quote.expiresAt <= Date.now())
      throw Error("Quote expired. Prepare again.");
    if (
      verifiedSwapPlan(plan).id !== canonical.id ||
      JSON.stringify(call) !== JSON.stringify(canonical.calls[step])
    )
      throw Error("Wallet plan changed during preflight. Prepare again.");
    // Persistence must succeed before a wallet can possibly broadcast.
    journal.save(record);
    let returnedHash: unknown;
    try {
      returnedHash = await wallet.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: plan.owner,
            to: call.to,
            data: call.data,
            value: "0x0",
            chainId: `0x${policy.chainId.toString(16)}`,
            nonce: `0x${nonce.toString(16)}`,
          },
        ],
      });
    } catch (error) {
      record.state =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 4001
          ? "cancelled"
          : "unknown";
      journal.save(record);
      return record;
    }
    const valid = hash.safeParse(returnedHash);
    if (!valid.success) {
      record.state = "unknown";
      journal.save(record);
      return record;
    }
    record.hash = valid.data;
    record.state = "pending";
    journal.save(record);
    return record;
  });
}
export type ReceiptReader = {
  getChainId(): Promise<number>;
  getTransaction(args: { hash: Hex }): Promise<{
    hash: Hex;
    from: string;
    to: string | null;
    input: Hex;
    value: bigint;
    nonce: number;
  }>;
  getTransactionReceipt(args: { hash: Hex }): Promise<{
    status: "success" | "reverted";
    transactionHash: Hex;
    blockHash: Hex;
    blockNumber: bigint;
  }>;
  getBlock(args: { blockNumber: bigint }): Promise<{ hash: Hex | null }>;
  getBlockNumber(): Promise<bigint>;
};
export async function reconcileSwapAttempt(
  attempt: SwapAttempt,
  reader: ReceiptReader,
  journal: SwapJournal,
): Promise<SwapAttempt> {
  if (
    (await reader.getChainId()) !== journal.chainId ||
    attempt.chainId !== journal.chainId ||
    attempt.owner.toLowerCase() !== journal.owner.toLowerCase()
  )
    throw Error("Wrong recovery chain or wallet.");
  const current = journal
    .read()
    .find((r) => r.planId === attempt.planId && r.step === attempt.step);
  if (!current) throw Error("Activity record is missing.");
  attempt = current;
  if (!attempt.hash) return attempt; // No hash: uncertainty cannot authorize resubmission.
  let tx, receipt;
  try {
    [tx, receipt] = await Promise.all([
      reader.getTransaction({ hash: attempt.hash as Hex }),
      reader.getTransactionReceipt({ hash: attempt.hash as Hex }),
    ]);
  } catch {
    // An RPC outage alone is not evidence of a reorg. Preserve the last
    // verified record unless the canonical block now contradicts it.
    if (attempt.blockHash && attempt.blockNumber) {
      try {
        const block = await reader.getBlock({
          blockNumber: BigInt(attempt.blockNumber),
        });
        if (block.hash !== attempt.blockHash) {
          const next = { ...attempt, state: "reorged" as const };
          return journal.saveObservation(next, attempt);
        }
      } catch {
        /* Missing history is not proof of a reorg. */
      }
    }
    const unavailable = {
      ...attempt,
      checkedAt: Date.now(),
      observation: "unavailable" as const,
    };
    return journal.saveObservation(unavailable, attempt);
  }
  if (!["success", "reverted"].includes(receipt.status))
    throw Error("Receipt status is not recognized.");
  const next = { ...attempt };
  if (
    tx.hash.toLowerCase() !== attempt.hash.toLowerCase() ||
    receipt.transactionHash.toLowerCase() !== attempt.hash.toLowerCase() ||
    tx.from.toLowerCase() !== attempt.owner.toLowerCase() ||
    tx.to?.toLowerCase() !== attempt.call.to.toLowerCase() ||
    tx.input !== attempt.call.data ||
    tx.value !== 0n ||
    tx.nonce !== attempt.nonce
  )
    next.state = "mismatch";
  else {
    const [block, head] = await Promise.all([
      reader.getBlock({ blockNumber: receipt.blockNumber }),
      reader.getBlockNumber(),
    ]);
    if (block.hash !== receipt.blockHash) next.state = "reorged";
    else {
      next.blockHash = receipt.blockHash;
      next.blockNumber = String(receipt.blockNumber);
      next.state =
        receipt.status === "reverted"
          ? "reverted"
          : journal.chainId === 4663
            ? "included"
            : head >= receipt.blockNumber + 1n
              ? "confirmed"
              : "pending";
    }
  }
  next.observedAt = Date.now();
  next.checkedAt = next.observedAt;
  next.observation = "verified";
  return journal.saveObservation(next, attempt);
}
