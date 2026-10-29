import { z } from "zod";
import type { SolanaReview } from "../shared/solana.js";

const key = "blunts:solana:mainnet:activity:v1";
const schema = z
  .object({
    id: z.string(),
    owner: z.string(),
    side: z.enum(["fill", "spark"]),
    inAmount: z.string(),
    outAmount: z.string(),
    minimumOut: z.string(),
    messageHash: z.string().regex(/^[a-f0-9]{64}$/),
    lastValidBlockHeight: z.number().int().positive(),
    createdAt: z.number(),
    state: z.enum(["wallet", "pending", "complete", "failed", "unsigned"]),
    signature: z.string().optional(),
  })
  .strict();
export type SolanaActivity = z.infer<typeof schema>;
export function readSolanaActivity(): SolanaActivity[] {
  const raw = localStorage.getItem(key);
  if (raw === null) return [];
  try {
    return z.array(schema).max(200).parse(JSON.parse(raw));
  } catch {
    throw Error(
      "Saved activity needs attention. Keep this browser’s data; no new trade was started.",
    );
  }
}
export function saveSolanaActivity(record: SolanaActivity) {
  const all = readSolanaActivity(),
    previous = all.find((x) => x.id === record.id);
  if (
    record.signature &&
    all.some((r) => r.id !== record.id && r.signature === record.signature)
  )
    throw Error(
      "This trade already has saved activity. Update price before starting another.",
    );
  if (
    previous &&
    (previous.owner !== record.owner ||
      previous.side !== record.side ||
      previous.inAmount !== record.inAmount ||
      previous.outAmount !== record.outAmount ||
      previous.minimumOut !== record.minimumOut ||
      previous.lastValidBlockHeight !== record.lastValidBlockHeight ||
      previous.createdAt !== record.createdAt ||
      previous.messageHash !== record.messageHash ||
      (previous.signature && previous.signature !== record.signature) ||
      (["complete", "failed", "unsigned"].includes(previous.state) &&
        previous.state !== record.state))
  )
    throw Error("Saved activity changed unexpectedly.");
  if (
    previous?.state === "pending" &&
    !["pending", "complete", "failed"].includes(record.state)
  )
    throw Error("A sent trade must keep its receipt record.");
  const next = previous
    ? all.map((r) => (r.id === record.id ? schema.parse(record) : r))
    : [...all, schema.parse(record)];
  if (next.length > 200)
    throw Error(
      "Activity storage is full. Export your history before continuing.",
    );
  localStorage.setItem(key, JSON.stringify(next));
  if (localStorage.getItem(key) !== JSON.stringify(next))
    throw Error("Could not safely save activity. Nothing new was sent.");
}
export function newSolanaActivity(review: SolanaReview): SolanaActivity {
  return {
    id: review.id,
    owner: review.owner,
    side: review.side,
    inAmount: review.inAmount,
    outAmount: review.outAmount,
    minimumOut: review.minimumOut,
    messageHash: review.messageHash,
    lastValidBlockHeight: review.lastValidBlockHeight,
    createdAt: Date.now(),
    state: "wallet",
  };
}
export function unresolvedSolana(record: SolanaActivity) {
  return record.state === "wallet" || record.state === "pending";
}
