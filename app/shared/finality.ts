import { z } from "zod";
import type { Hex } from "viem";
const hash = z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  height = z.string().regex(/^\d{1,24}$/),
  time = z.number().int().safe().nonnegative();
const head = z.object({ number: height, hash }).strict();
export const finalityProof = z
  .object({
    transactionHash: hash,
    blockHash: hash,
    blockNumber: height,
    level: z.enum(["sequenced", "rpc_safe", "rpc_finalized"]),
    safeHead: head,
    finalizedHead: head,
    verifiedAt: time,
  })
  .strict();
export const finalityCheck = z
  .object({
    status: z.enum([
      "verified",
      "unavailable",
      "inconsistent",
      "canonical_mismatch",
    ]),
    at: time,
  })
  .strict();
export type FinalityProof = z.infer<typeof finalityProof>;
export type FinalityCheck = z.infer<typeof finalityCheck>;
export type FinalityReader = {
  getChainId(): Promise<number>;
  getBlock(
    args:
      { blockTag: "latest" | "safe" | "finalized" } | { blockNumber: bigint },
  ): Promise<{ hash: Hex | null; number: bigint | null }>;
};
/** Bounded read-only node report. Never releases funds, changes balances, treats
 * confirmation counts as finality, or claims an independently verified L1 batch. */
export async function inspectFinality(
  expected: { transactionHash: Hex; blockHash: Hex; blockNumber: bigint },
  reader: FinalityReader,
): Promise<{ check: FinalityCheck; proof?: FinalityProof }> {
  const at = Date.now();
  const checked = (status: FinalityCheck["status"]) => ({
    check: { status, at },
  });
  try {
    if ((await reader.getChainId()) !== 4663) return checked("inconsistent");
    const [latest, safe, finalized, canonical] = await Promise.all([
      reader.getBlock({ blockTag: "latest" }),
      reader.getBlock({ blockTag: "safe" }),
      reader.getBlock({ blockTag: "finalized" }),
      reader.getBlock({ blockNumber: expected.blockNumber }),
    ]);
    const valid = (block: { hash: Hex | null; number: bigint | null }) =>
      typeof block.number === "bigint" &&
      block.number >= 0n &&
      hash.safeParse(block.hash).success;
    if (![latest, safe, finalized, canonical].every(valid))
      return checked("unavailable");
    if (canonical.number !== expected.blockNumber)
      return checked("inconsistent");
    if (canonical.hash!.toLowerCase() !== expected.blockHash.toLowerCase())
      return checked("canonical_mismatch");
    if (
      finalized.number! > safe.number! ||
      safe.number! > latest.number! ||
      expected.blockNumber > latest.number!
    )
      return checked("inconsistent");
    const [safeCanonical, finalizedCanonical] = await Promise.all([
      reader.getBlock({ blockNumber: safe.number! }),
      reader.getBlock({ blockNumber: finalized.number! }),
    ]);
    if (!valid(safeCanonical) || !valid(finalizedCanonical))
      return checked("unavailable");
    if (
      safeCanonical.number !== safe.number ||
      finalizedCanonical.number !== finalized.number ||
      safeCanonical.hash!.toLowerCase() !== safe.hash!.toLowerCase() ||
      finalizedCanonical.hash!.toLowerCase() !== finalized.hash!.toLowerCase()
    )
      return checked("inconsistent");
    const proof = finalityProof.parse({
      transactionHash: expected.transactionHash,
      blockHash: expected.blockHash,
      blockNumber: String(expected.blockNumber),
      level:
        expected.blockNumber <= finalized.number!
          ? "rpc_finalized"
          : expected.blockNumber <= safe.number!
            ? "rpc_safe"
            : "sequenced",
      safeHead: { number: String(safe.number), hash: safe.hash },
      finalizedHead: { number: String(finalized.number), hash: finalized.hash },
      verifiedAt: Date.now(),
    });
    return { check: { status: "verified", at: proof.verifiedAt }, proof };
  } catch {
    return checked("unavailable");
  }
}
