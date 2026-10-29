import {
  decodeFunctionData,
  keccak256,
  toBytes,
  type Address,
  type Hex,
} from "viem";
import { appFee } from "../shared/app-fee";
import { cash, stock, dex } from "../shared/robinhood";
import { approvalAbi, routerAbi, type SwapCall } from "../shared/swap-plan";
import {
  SwapJournal,
  reconcileSwapAttempt,
  type SwapAttempt,
  type ReceiptReader,
} from "../shared/swap-journal";
import { chainReader } from "./chain";
export function supportedWalletCall(
  owner: Address,
  to: string | null,
  input: Hex,
  value: bigint,
): SwapCall {
  if (value !== 0n || !to || input.length > 8192)
    throw Error("Unsupported wallet transaction.");
  if (
    [cash.address.toLowerCase(), stock.address.toLowerCase()].includes(
      to.toLowerCase(),
    )
  ) {
    const decoded = decodeFunctionData({ abi: approvalAbi, data: input });
    if (
      decoded.functionName !== "approve" ||
      decoded.args[0].toLowerCase() !== dex.router.toLowerCase()
    )
      throw Error("Unsupported token approval.");
    return {
      kind: decoded.args[1] === 0n ? "reset" : "approve",
      to: to as Address,
      data: input,
      value: "0x0",
    };
  }
  if (to.toLowerCase() !== dex.router.toLowerCase())
    throw Error("Unsupported router.");
  const outer = decodeFunctionData({ abi: routerAbi, data: input });
  if (
    outer.functionName !== "multicall" ||
    ![1, 2].includes(outer.args[1].length)
  )
    throw Error("Unsupported swap batch.");
  const inner = decodeFunctionData({ abi: routerAbi, data: outer.args[1][0] });
  if (inner.functionName !== "exactInputSingle")
    throw Error("Unsupported swap call.");
  const p = inner.args[0];
  // Retain read-only tracking of the earlier fee-free single-call route.
  const withFee = outer.args[1].length === 2;
  if (withFee) {
    const sweep = decodeFunctionData({
      abi: routerAbi,
      data: outer.args[1][1],
    });
    if (
      sweep.functionName !== "sweepTokenWithFee" ||
      sweep.args[0].toLowerCase() !== p.tokenOut.toLowerCase() ||
      sweep.args[1] !== p.amountOutMinimum ||
      sweep.args[2].toLowerCase() !== owner.toLowerCase() ||
      sweep.args[3] !== appFee.bps ||
      sweep.args[4].toLowerCase() !== appFee.recipient.toLowerCase()
    )
      throw Error("App fee or output recipient did not match.");
  }
  if (
    p.recipient.toLowerCase() !==
      (withFee ? dex.router : owner).toLowerCase() ||
    p.sqrtPriceLimitX96 !== 0n ||
    p.amountIn <= 0n ||
    p.amountOutMinimum <= 0n ||
    ![500, 3000].includes(p.fee)
  )
    throw Error("Swap limits or recipient did not match.");
  const pair = [p.tokenIn.toLowerCase(), p.tokenOut.toLowerCase()]
    .sort()
    .join(":");
  if (
    pair !==
    [cash.address.toLowerCase(), stock.address.toLowerCase()].sort().join(":")
  )
    throw Error("Unsupported token pair.");
  return { kind: "swap", to: dex.router, data: input, value: "0x0" };
}
type ActivityReader = ReceiptReader;
/** Observes an already-existing own-wallet transaction. Never signs, resubmits,
 * creates a quote or infers app origin. A saved hash is not settlement proof. */
export async function trackWalletTransaction(
  hash: string,
  owner: Address,
  journal: SwapJournal,
  reader: ActivityReader = chainReader,
): Promise<SwapAttempt> {
  if (
    !/^0x[0-9a-fA-F]{64}$/.test(hash) ||
    journal.chainId !== 4663 ||
    journal.owner.toLowerCase() !== owner.toLowerCase() ||
    (await reader.getChainId()) !== 4663
  )
    throw Error("Wallet or chain did not match.");
  const records = journal.read();
  const linked = records.find(
    (r) => r.replacement?.hash.toLowerCase() === hash.toLowerCase(),
  );
  let tx: Awaited<ReturnType<ReceiptReader["getTransaction"]>>;
  try {
    tx = await reader.getTransaction({ hash: hash as Hex });
  } catch {
    if (linked) return replacementUnavailable(linked, reader, journal);
    throw Error("Transaction read is unavailable.");
  }
  if (
    tx.hash.toLowerCase() !== hash.toLowerCase() ||
    tx.from.toLowerCase() !== owner.toLowerCase()
  )
    throw Error("Transaction belongs to another wallet.");
  const original = records.find(
    (r) => r.hash?.toLowerCase() === hash.toLowerCase(),
  );
  const candidates = records.filter(
    (r) =>
      r.nonce === tx.nonce &&
      r.hash?.toLowerCase() !== hash.toLowerCase() &&
      !r.replacement,
  );
  const isCancel =
    tx.to?.toLowerCase() === owner.toLowerCase() &&
    tx.input === "0x" &&
    tx.value === 0n;
  if (linked) return observeReplacement(linked, tx, reader, journal);
  if (!original && (isCancel || candidates.some((r) => r.hash))) {
    if (candidates.length !== 1)
      throw Error("Replacement must match exactly one prior nonce.");
    return observeReplacement(candidates[0], tx, reader, journal);
  }
  const call = supportedWalletCall(owner, tx.to, tx.input, tx.value);
  const id = keccak256(
    toBytes(`tracked:4663:${owner.toLowerCase()}:${hash.toLowerCase()}`),
  );
  let record = records.find(
    (r) => r.hash?.toLowerCase() === hash.toLowerCase(),
  );
  if (!record) {
    const uncertain = records.filter(
      (r) =>
        !r.hash &&
        ["awaiting_wallet", "unknown"].includes(r.state) &&
        r.nonce === tx.nonce,
    );
    const matching = uncertain.filter(
      (r) =>
        r.call.to.toLowerCase() === call.to.toLowerCase() &&
        r.call.data === call.data &&
        r.call.value === call.value,
    );
    if (uncertain.length && matching.length !== 1)
      throw Error("Hash does not uniquely match the earlier wallet attempt.");
    record =
      matching.length === 1
        ? { ...matching[0], hash, state: "pending" }
        : {
            planId: id,
            step: 0,
            chainId: 4663,
            owner,
            call,
            nonce: tx.nonce,
            state: "pending",
            hash,
            tracked: true,
          };
    journal.save(record);
  }
  return reconcileSwapAttempt(record, reader, journal);
}

async function observeReplacement(
  record: SwapAttempt,
  tx: Awaited<ReturnType<ReceiptReader["getTransaction"]>>,
  reader: ReceiptReader,
  journal: SwapJournal,
): Promise<SwapAttempt> {
  const kind =
    tx.to?.toLowerCase() === record.owner.toLowerCase() &&
    tx.value === 0n &&
    tx.input === "0x"
      ? "cancel"
      : tx.to?.toLowerCase() === record.call.to.toLowerCase() &&
          tx.value === 0n &&
          tx.input === record.call.data
        ? "same_call"
        : undefined;
  if (
    !kind ||
    tx.from.toLowerCase() !== record.owner.toLowerCase() ||
    tx.nonce !== record.nonce ||
    (record.replacement &&
      record.replacement.hash.toLowerCase() !== tx.hash.toLowerCase())
  )
    throw Error("Replacement changed the saved instruction or wallet.");
  let receipt: Awaited<ReturnType<ReceiptReader["getTransactionReceipt"]>>;
  try {
    receipt = await reader.getTransactionReceipt({ hash: tx.hash });
  } catch {
    if (!record.replacement)
      throw Error(
        "Replacement is not included yet. Original request remains preserved.",
      );
    return replacementUnavailable(record, reader, journal);
  }
  if (
    receipt.transactionHash.toLowerCase() !== tx.hash.toLowerCase() ||
    !["success", "reverted"].includes(receipt.status)
  )
    throw Error("Replacement receipt did not match.");
  const [block, head] = await Promise.all([
    reader.getBlock({ blockNumber: receipt.blockNumber }),
    reader.getBlockNumber(),
  ]);
  if (block.hash !== receipt.blockHash || head < receipt.blockNumber) {
    if (record.replacement)
      return journal.saveObservation(
        {
          ...record,
          state: "reorged",
          checkedAt: Date.now(),
          observation: "verified",
        },
        record,
      );
    throw Error("Replacement inclusion is not canonical.");
  }
  const now = Date.now();
  return journal.saveObservation(
    {
      ...record,
      state: "replaced",
      replacement: {
        hash: tx.hash,
        kind,
        outcome: receipt.status,
        blockHash: receipt.blockHash,
        blockNumber: String(receipt.blockNumber),
        observedAt: now,
      },
      observedAt: now,
      checkedAt: now,
      observation: "verified",
    },
    record,
  );
}

async function replacementUnavailable(
  record: SwapAttempt,
  reader: ReceiptReader,
  journal: SwapJournal,
) {
  if (!record.replacement) throw Error("Replacement proof is missing.");
  try {
    const block = await reader.getBlock({
      blockNumber: BigInt(record.replacement.blockNumber),
    });
    if (block.hash !== record.replacement.blockHash)
      return journal.saveObservation(
        {
          ...record,
          state: "reorged",
          checkedAt: Date.now(),
          observation: "verified",
        },
        record,
      );
  } catch {
    /* An outage alone does not prove a reorg. */
  }
  return journal.saveObservation(
    { ...record, checkedAt: Date.now(), observation: "unavailable" },
    record,
  );
}
