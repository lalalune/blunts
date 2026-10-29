import type { Hex } from "viem";
import { inspectFinality, type FinalityReader } from "../shared/finality";
import { SwapJournal, type SwapAttempt } from "../shared/swap-journal";
import { chainReader } from "./chain";
/** Caller holds the wallet activity Web Lock. Observe only a receipt that the
 * transaction/replacement verifier already matched; stale results cannot win. */
export async function checkActivityFinality(
  record: SwapAttempt,
  journal: SwapJournal,
  reader: FinalityReader = chainReader,
): Promise<SwapAttempt> {
  const current = journal
    .read()
    .find((r) => r.planId === record.planId && r.step === record.step);
  if (
    !current ||
    journal.chainId !== 4663 ||
    current.chainId !== 4663 ||
    current.owner.toLowerCase() !== journal.owner.toLowerCase()
  )
    throw Error("Finality wallet/chain did not match.");
  if (
    !["included", "reverted", "replaced"].includes(current.state) ||
    current.observation !== "verified"
  )
    return current;
  const proof = current.state === "replaced" ? current.replacement : current;
  const transactionHash =
    current.state === "replaced" ? current.replacement?.hash : current.hash;
  if (!proof?.blockHash || !proof.blockNumber || !transactionHash)
    return current;
  const result = await inspectFinality(
    {
      transactionHash: transactionHash as Hex,
      blockHash: proof.blockHash as Hex,
      blockNumber: BigInt(proof.blockNumber),
    },
    reader,
  );
  return journal.saveObservation(
    {
      ...current,
      ...(result.proof ? { finality: result.proof } : {}),
      finalityCheck: result.check,
      ...(result.check.status === "canonical_mismatch"
        ? { state: "reorged" as const }
        : {}),
    },
    current,
  );
}
