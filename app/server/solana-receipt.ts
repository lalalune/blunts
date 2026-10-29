import { createHash } from "node:crypto";
import type { VersionedTransactionResponse } from "@solana/web3.js";
import bs58 from "bs58";
import { solanaAssets, solanaAppFee } from "../shared/solana.js";
import { jupiterProgram, solanaAta } from "../shared/solana-build.js";

export const solanaMessageHash = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

/** A finalized RPC success is insufficient on its own: pin the signed message,
 * then reconcile exact input, received tokens and the approved output fee. */
export function verifySolanaReceipt(
  tx: VersionedTransactionResponse,
  expectedHash: string,
) {
  const { meta } = tx,
    message = tx.transaction.message;
  const fail = () => {
    throw Error("Receipt did not match this trade. Keep this activity record.");
  };
  if (!meta || solanaMessageHash(message.serialize()) !== expectedHash)
    return fail();
  // A failure may unlock another attempt only after the same message check.
  if (meta.err)
    return { state: "failed" as const, slot: tx.slot, networkFee: meta.fee };
  const keys = message.getAccountKeys({
    accountKeysFromLookups: meta.loadedAddresses,
  });
  const swaps = message.compiledInstructions
    .map((ix, index) => ({ ix, index }))
    .filter(
      ({ ix }) => keys.get(ix.programIdIndex)?.toBase58() === jupiterProgram,
    );
  if (swaps.length !== 1) return fail();
  const { ix, index } = swaps[0],
    data = Buffer.from(ix.data),
    owner = keys.get(0)?.toBase58();
  if (
    !owner ||
    data.length !== 39 ||
    data.subarray(0, 8).toString("hex") !== "bb64facc31c4af14" ||
    data.readUInt16LE(24) !== 50 ||
    data.readUInt16LE(26) !== solanaAppFee.bps ||
    data.readUInt16LE(28) !== 0
  )
    return fail();
  const address = (i: number) => keys.get(ix.accountKeyIndexes[i])?.toBase58();
  const side = address(3) === solanaAssets.cash.mint ? "fill" : "spark";
  const input = side === "fill" ? solanaAssets.cash : solanaAssets.stock,
    output = side === "fill" ? solanaAssets.stock : solanaAssets.cash;
  if (
    address(0) !== owner ||
    address(3) !== input.mint ||
    address(4) !== output.mint ||
    address(1) !== solanaAta(owner, input).toBase58() ||
    address(2) !== solanaAta(owner, output).toBase58() ||
    address(10) !== solanaAta(solanaAppFee.recipient, output).toBase58()
  )
    return fail();
  const delta = (accountIndex: number, mint: string) => {
    const before = meta.preTokenBalances?.find(
        (b) => b.accountIndex === accountIndex,
      ),
      after = meta.postTokenBalances?.find(
        (b) => b.accountIndex === accountIndex,
      );
    if (
      (before && before.mint !== mint) ||
      (after && after.mint !== mint) ||
      !after
    )
      return fail();
    return (
      BigInt(after.uiTokenAmount.amount) -
      BigInt(before?.uiTokenAmount.amount ?? "0")
    );
  };
  const inputSpent = -delta(ix.accountKeyIndexes[1], input.mint),
    received = delta(ix.accountKeyIndexes[2], output.mint),
    inAmount = data.readBigUInt64LE(8);
  const minimum = (data.readBigUInt64LE(16) * 9950n) / 10000n;
  let fee = delta(ix.accountKeyIndexes[10], output.mint),
    net = received;
  if (address(2) === address(10)) {
    // When holder and fee recipient coincide, balance deltas combine both
    // amounts. Identify the direct Jupiter fee CPI, not the AMM's output CPI.
    const transfers =
      meta.innerInstructions
        ?.find((group) => group.index === index)
        ?.instructions.filter((inner) => {
          const bytes = Buffer.from(bs58.decode(inner.data));
          return (
            "stackHeight" in inner &&
            inner.stackHeight === 2 &&
            keys.get(inner.programIdIndex)?.toBase58() === output.program &&
            ((bytes[0] === 12 &&
              bytes.length === 10 &&
              keys.get(inner.accounts[2])?.toBase58() === address(10)) ||
              (bytes[0] === 3 &&
                bytes.length === 9 &&
                keys.get(inner.accounts[1])?.toBase58() === address(10)))
          );
        }) ?? [];
    if (
      (received * BigInt(solanaAppFee.bps)) / 10000n === 0n &&
      transfers.length === 0
    )
      fee = 0n;
    else {
      if (transfers.length !== 1) return fail();
      fee = Buffer.from(bs58.decode(transfers[0].data)).readBigUInt64LE(1);
    }
    net = received - fee;
  }
  const gross = net + fee;
  if (
    inputSpent !== inAmount ||
    net < minimum ||
    fee < 0n ||
    fee !== (gross * BigInt(solanaAppFee.bps)) / 10000n
  )
    return fail();
  return {
    state: "complete" as const,
    slot: tx.slot,
    owner,
    side,
    inputSpent: String(inputSpent),
    receivedNet: String(net),
    feeReceived: String(fee),
    minimumOut: String(minimum),
    networkFee: meta.fee,
  };
}
