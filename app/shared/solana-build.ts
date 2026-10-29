import { Buffer } from "buffer";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { solanaAssets, solanaAppFee, type SolanaSide } from "./solana.js";

export const jupiterProgram = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
export type ApiInstruction = {
  programId: string;
  accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: string;
};
export type SolanaBuild = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  transactionVersion: number;
  setupInstructions: ApiInstruction[];
  swapInstruction: ApiInstruction;
  computeBudgetInstructions: ApiInstruction[];
  cleanupInstruction: ApiInstruction | null;
  otherInstructions: ApiInstruction[];
  tipInstruction: ApiInstruction | null;
  addressesByLookupTableAddress: Record<string, string[]> | null;
};
export function solanaAta(
  owner: string,
  asset: typeof solanaAssets.cash | typeof solanaAssets.stock,
) {
  return getAssociatedTokenAddressSync(
    new PublicKey(asset.mint),
    new PublicKey(owner),
    false,
    new PublicKey(asset.program),
  );
}
export function apiInstruction(value: ApiInstruction) {
  return new TransactionInstruction({
    programId: new PublicKey(value.programId),
    keys: value.accounts.map((a) => ({
      pubkey: new PublicKey(a.pubkey),
      isSigner: a.isSigner,
      isWritable: a.isWritable,
    })),
    data: Buffer.from(value.data, "base64"),
  });
}
function sameInstruction(a: TransactionInstruction, b: TransactionInstruction) {
  return (
    a.programId.equals(b.programId) &&
    a.data.equals(b.data) &&
    a.keys.length === b.keys.length &&
    a.keys.every(
      (k, i) =>
        k.pubkey.equals(b.keys[i].pubkey) &&
        k.isSigner === b.keys[i].isSigner &&
        k.isWritable === b.keys[i].isWritable,
    )
  );
}
/** Fail closed to the qualified direct Raydium CLMM route_v2 subset.
 * Header layout and discriminator verified against Jupiter's onchain Anchor
 * IDL C88XWfp26heEmDkmfSzeXP7Fd7GQJ2j9dDTUsyiZbUTa (2026-10-29).
 * Shared/exact-out routes, tips, arbitrary transfers and CPI additions rejected. */
export function validateSolanaBuild(
  build: SolanaBuild,
  owner: string,
  side: SolanaSide,
  amount: bigint,
) {
  const input = side === "fill" ? solanaAssets.cash : solanaAssets.stock;
  const output = side === "fill" ? solanaAssets.stock : solanaAssets.cash;
  const fail = () => {
    throw Error(
      "This price could not be safely verified. Update price to try again.",
    );
  };
  if (!PublicKey.isOnCurve(new PublicKey(owner).toBytes())) fail();
  if (
    build.inputMint !== input.mint ||
    build.outputMint !== output.mint ||
    build.inAmount !== String(amount) ||
    build.swapMode !== "ExactIn" ||
    build.slippageBps !== 50 ||
    build.transactionVersion !== 0
  )
    fail();
  if (
    !/^[1-9]\d{0,19}$/.test(build.outAmount) ||
    !/^\d+$/.test(build.otherAmountThreshold)
  )
    fail();
  const out = BigInt(build.outAmount),
    minimum = (out * 9950n) / 10000n;
  if (
    out > 18446744073709551615n ||
    BigInt(build.otherAmountThreshold) !== (out * 9950n + 9999n) / 10000n ||
    minimum <= 0n ||
    !Number.isFinite(Number(build.priceImpactPct)) ||
    Math.abs(Number(build.priceImpactPct)) > 0.01
  )
    fail();
  if (
    build.cleanupInstruction ||
    build.tipInstruction ||
    build.otherInstructions.length
  )
    fail();
  const swap = apiInstruction(build.swapInstruction),
    data = swap.data;
  if (
    swap.programId.toBase58() !== jupiterProgram ||
    data.length !== 39 ||
    data.subarray(0, 8).toString("hex") !== "bb64facc31c4af14" ||
    data.readBigUInt64LE(8) !== amount ||
    data.readBigUInt64LE(16) !== out ||
    data.readUInt16LE(24) !== 50 ||
    data.readUInt16LE(26) !== solanaAppFee.bps ||
    data.readUInt16LE(28) !== 0 ||
    data.readUInt32LE(30) !== 1 ||
    data[34] !== 40 ||
    data.readUInt16LE(35) !== 10000 ||
    data[37] !== 0 ||
    data[38] !== 1
  )
    fail();
  const source = solanaAta(owner, input),
    destination = solanaAta(owner, output),
    fee = solanaAta(solanaAppFee.recipient, output);
  const expected: Record<number, string> = {
    0: owner,
    1: source.toBase58(),
    2: destination.toBase58(),
    3: input.mint,
    4: output.mint,
    5: input.program,
    6: output.program,
    7: jupiterProgram,
    8: "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
    9: jupiterProgram,
    10: fee.toBase58(),
    11: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
    12: owner,
    15: source.toBase58(),
    16: destination.toBase58(),
    20: solanaAssets.cash.program,
    21: solanaAssets.stock.program,
    22: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
    23: input.mint,
    24: output.mint,
  };
  // Raydium may append additional tick arrays, all non-signers. Its canonical
  // program checks pool/vault/config/tick ownership and token directions.
  if (
    swap.keys.length < 29 ||
    swap.keys.length > 40 ||
    swap.keys.some((a, i) => a.isSigner !== (i === 0)) ||
    Object.entries(expected).some(
      ([i, key]) => swap.keys[Number(i)]?.pubkey.toBase58() !== key,
    )
  )
    fail();
  const setup = build.setupInstructions.map(apiInstruction);
  const allowed = [input, output].map((asset) =>
    createAssociatedTokenAccountIdempotentInstruction(
      new PublicKey(owner),
      solanaAta(owner, asset),
      new PublicKey(owner),
      new PublicKey(asset.mint),
      new PublicKey(asset.program),
    ),
  );
  if (
    setup.length > 2 ||
    setup.some((ix) => !allowed.some((a) => sameInstruction(a, ix)))
  )
    fail();
  for (const ix of build.computeBudgetInstructions.map(apiInstruction)) {
    if (
      ix.programId.toBase58() !==
        "ComputeBudget111111111111111111111111111111" ||
      ix.keys.length ||
      ix.data.length !== 9 ||
      ix.data[0] !== 3 ||
      ix.data.readBigUInt64LE(1) > 50000n
    )
      fail();
  }
  return { input, output, swap, minimum, source, destination, fee, setup };
}
