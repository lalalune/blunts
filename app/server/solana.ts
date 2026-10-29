import { createPublicKey, verify, randomUUID } from "node:crypto";
import { solanaMessageHash, verifySolanaReceipt } from "./solana-receipt.js";
export { solanaMessageHash } from "./solana-receipt.js";
import {
  Connection,
  PublicKey,
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  type AddressLookupTableAccount,
  SYSVAR_CLOCK_PUBKEY,
} from "@solana/web3.js";
import { verifiedSolanaTime } from "./solana-clock.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getMint,
  getPausableConfig,
  getScaledUiAmountConfig,
  unpackAccount,
  getAccountLen,
  getExtensionTypes,
  getAccountTypeOfMintType,
  ExtensionType,
} from "@solana/spl-token";
import bs58 from "bs58";
import {
  solanaAssets,
  solanaAppFee,
  type SolanaReview,
  type SolanaSide,
} from "../shared/solana.js";
import {
  solanaAta,
  validateSolanaBuild,
  type SolanaBuild,
} from "../shared/solana-build.js";

export const solanaConnection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  {
    commitment: "confirmed",
    disableRetryOnRateLimit: true,
    confirmTransactionInitialTimeout: 20000,
  },
);
const key = (s: string) => new PublicKey(s);
async function json(url: string) {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    redirect: "error",
    headers:
      url.startsWith("https://api.jup.ag/") && process.env.JUPITER_API_KEY
        ? { "x-api-key": process.env.JUPITER_API_KEY }
        : {},
  });
  if (!r.ok) throw Error("Price service is busy. Try again shortly.");
  return r.json();
}
let cachedMarket: {
  at: number;
  value: { price: number; multiplier: number };
} | null = null;
let marketFlight: Promise<{ price: number; multiplier: number }> | null = null;
export async function solanaMarket() {
  if (cachedMarket && Date.now() - cachedMarket.at < 20000)
    return cachedMarket.value;
  if (!marketFlight)
    marketFlight = loadSolanaMarket().finally(() => {
      marketFlight = null;
    });
  return marketFlight;
}
async function loadSolanaMarket() {
  const [mint, cashMint, asset, price, slot] = await Promise.all([
    getMint(
      solanaConnection,
      key(solanaAssets.stock.mint),
      "confirmed",
      key(solanaAssets.stock.program),
    ),
    getMint(
      solanaConnection,
      key(solanaAssets.cash.mint),
      "confirmed",
      key(solanaAssets.cash.program),
    ),
    json("https://api.xstocks.fi/api/v2/public/assets/QQQx"),
    json("https://api.xstocks.fi/api/v2/public/assets/QQQx/price-data"),
    solanaConnection.getSlot("confirmed"),
  ]);
  const blockTime = await solanaConnection.getBlockTime(slot);
  const time = verifiedSolanaTime(
    slot,
    blockTime,
    blockTime === null
      ? await solanaConnection.getAccountInfo(SYSVAR_CLOCK_PUBKEY, "confirmed")
      : null,
  );
  if (
    mint.decimals !== 8 ||
    cashMint.decimals !== 6 ||
    !mint.isInitialized ||
    !cashMint.isInitialized ||
    getPausableConfig(mint)?.paused ||
    asset.isTradingHalted !== false
  )
    throw Error("Trading is temporarily unavailable.");
  const scale = getScaledUiAmountConfig(mint);
  if (
    !scale ||
    Math.abs(Number(scale.newMultiplierEffectiveTimestamp) - time) < 900
  )
    throw Error("This investment is updating. Try again later.");
  const multiplier =
    time >= Number(scale.newMultiplierEffectiveTimestamp)
      ? scale.newMultiplier
      : scale.multiplier;
  if (
    !Number.isFinite(multiplier) ||
    multiplier <= 0 ||
    !Number.isFinite(price.quote) ||
    price.quote <= 0
  )
    throw Error("Market value is unavailable.");
  // Price has no issuer timestamp: indicative display only. Execution always
  // uses the validated fresh pool build and its onchain minimum output.
  const value = { price: price.quote, multiplier };
  cachedMarket = { at: Date.now(), value };
  return value;
}
export async function solanaBalances(owner: string) {
  const address = key(owner);
  if (!PublicKey.isOnCurve(address.toBytes()))
    throw Error("Choose a standard wallet account.");
  const assets = [solanaAssets.cash, solanaAssets.stock];
  const [accounts, native] = await Promise.all([
    solanaConnection.getMultipleAccountsInfo(
      assets.map((a) => solanaAta(owner, a)),
      "confirmed",
    ),
    solanaConnection.getBalance(address, "confirmed"),
  ]);
  const amounts = accounts.map((info, i) => {
    if (!info) return "0";
    const account = unpackAccount(
      solanaAta(owner, assets[i]),
      info,
      key(assets[i].program),
    );
    if (
      !account.owner.equals(address) ||
      !account.mint.equals(key(assets[i].mint)) ||
      account.isFrozen
    )
      throw Error("This wallet’s investment account is unavailable.");
    return account.amount.toString();
  });
  return { cash: amounts[0], stock: amounts[1], native };
}
type Prepared = {
  review: SolanaReview;
  submitted: boolean;
  signature?: string;
};
const prepared = new Map<string, Prepared>();
let lastBuild = 0;
export async function prepareSolana(
  owner: string,
  side: SolanaSide,
  amount: bigint,
): Promise<SolanaReview> {
  const market = await solanaMarket(),
    balances = await solanaBalances(owner);
  if (
    amount <= 0n ||
    amount > BigInt(side === "fill" ? balances.cash : balances.stock)
  )
    throw Error(
      side === "fill"
        ? "Add USDC to your wallet first."
        : "Choose an amount within your stash.",
    );
  // Keyless Jupiter is bounded to 0.5 RPS. Fail fast rather than pile up work.
  if (Date.now() - lastBuild < 2100)
    throw Error("Please wait a moment, then continue.");
  lastBuild = Date.now();
  const input = side === "fill" ? solanaAssets.cash : solanaAssets.stock,
    output = side === "fill" ? solanaAssets.stock : solanaAssets.cash;
  const params = new URLSearchParams({
    inputMint: input.mint,
    outputMint: output.mint,
    amount: String(amount),
    taker: owner,
    slippageBps: "50",
    platformFeeBps: String(solanaAppFee.bps),
    feeAccount: solanaAta(solanaAppFee.recipient, output).toBase58(),
    instructionVersion: "V2",
    transactionVersion: "0",
    dexes: "Raydium CLMM",
    // V2 /build supports this account budget. Legacy V1 routing flags can
    // be ignored; the instruction validator still enforces one direct swap.
    maxAccounts: "30",
  });
  const build = (await json(
    "https://api.jup.ag/swap/v2/build?" + params,
  )) as SolanaBuild;
  const checked = validateSolanaBuild(build, owner, side, amount);
  const setup = [...checked.setup];
  const feeInfo = await solanaConnection.getAccountInfo(
    checked.fee,
    "confirmed",
  );
  if (feeInfo) {
    const fee = unpackAccount(checked.fee, feeInfo, key(output.program));
    if (
      !fee.owner.equals(key(solanaAppFee.recipient)) ||
      !fee.mint.equals(key(output.mint)) ||
      fee.isFrozen
    )
      throw Error("Fee account unavailable.");
  } else if (!checked.fee.equals(checked.destination)) {
    setup.push(
      createAssociatedTokenAccountIdempotentInstruction(
        key(owner),
        checked.fee,
        key(solanaAppFee.recipient),
        key(output.mint),
        key(output.program),
      ),
    );
  }
  const tables: AddressLookupTableAccount[] = [];
  for (const address of Object.keys(
    build.addressesByLookupTableAddress ?? {},
  )) {
    const table = await solanaConnection.getAddressLookupTable(key(address));
    if (!table.value || !table.value.isActive())
      throw Error("Price route expired. Update price.");
    tables.push(table.value);
  }
  const blockhash = await solanaConnection.getLatestBlockhash("confirmed");
  const make = (units: number) =>
    new VersionedTransaction(
      new TransactionMessage({
        payerKey: key(owner),
        recentBlockhash: blockhash.blockhash,
        instructions: [
          ComputeBudgetProgram.setComputeUnitLimit({ units }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 3000 }),
          ...setup,
          checked.swap,
        ],
      }).compileToV0Message(tables),
    );
  const simulation = await solanaConnection.simulateTransaction(make(1400000), {
    sigVerify: false,
    commitment: "confirmed",
  });
  if (simulation.value.err || !simulation.value.unitsConsumed)
    throw Error(
      "This trade could not be completed. Your funds have not moved.",
    );
  const tx = make(
    Math.min(1400000, Math.ceil(simulation.value.unitsConsumed * 1.2)),
  );
  const nativeFee = await solanaConnection.getFeeForMessage(
    tx.message,
    "confirmed",
  );
  if (nativeFee.value === null)
    throw Error("Network fee unavailable. Update price.");
  let rent = 0;
  const unique = new Set<string>();
  for (const ix of setup) {
    const ata = ix.keys[1].pubkey.toBase58();
    if (unique.has(ata)) continue;
    unique.add(ata);
    if (!(await solanaConnection.getAccountInfo(key(ata), "confirmed"))) {
      const asset =
        ix.keys[3].pubkey.toBase58() === output.mint ? output : input;
      const mint = await getMint(
        solanaConnection,
        key(asset.mint),
        "confirmed",
        key(asset.program),
      );
      const extensions = getExtensionTypes(mint.tlvData).map(
        getAccountTypeOfMintType,
      );
      if (asset.program === solanaAssets.stock.program)
        extensions.push(ExtensionType.ImmutableOwner);
      rent += await solanaConnection.getMinimumBalanceForRentExemption(
        getAccountLen(extensions),
      );
    }
  }
  // Account rent plus the signed message's exact network fee, with a SOL cap.
  const nativeCost = nativeFee.value + rent;
  if (nativeCost > 10000000 || balances.native < nativeCost)
    throw Error("Add a little SOL to cover the network cost, then try again.");
  const review: SolanaReview = {
    id: randomUUID(),
    owner,
    side,
    inAmount: String(amount),
    outAmount: build.outAmount,
    minimumOut: String(checked.minimum),
    multiplier: market.multiplier,
    nativeCost,
    transaction: Buffer.from(tx.serialize()).toString("base64"),
    messageHash: solanaMessageHash(tx.message.serialize()),
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
    expiresAt: Date.now() + 45000,
  };
  for (const [id, p] of prepared)
    if (p.review.expiresAt < Date.now()) prepared.delete(id);
  if (prepared.size >= 100) throw Error("Preview is busy. Try again shortly.");
  prepared.set(review.id, { review, submitted: false });
  return review;
}
export function verifySolanaSigned(bytes: Uint8Array, review: SolanaReview) {
  const tx = VersionedTransaction.deserialize(bytes);
  if (
    tx.signatures.length !== 1 ||
    tx.message.header.numRequiredSignatures !== 1 ||
    tx.message.staticAccountKeys[0].toBase58() !== review.owner ||
    solanaMessageHash(tx.message.serialize()) !== review.messageHash
  )
    throw Error("Wallet changed this trade. Nothing was sent.");
  const pub = createPublicKey({
    format: "der",
    type: "spki",
    key: Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      key(review.owner).toBuffer(),
    ]),
  });
  if (!verify(null, tx.message.serialize(), pub, tx.signatures[0]))
    throw Error("Wallet signature could not be verified.");
  return bs58.encode(tx.signatures[0]);
}
export async function submitSolana(id: string, serialized: string) {
  const saved = prepared.get(id);
  if (!saved)
    throw Error(
      "This review is unavailable. Keep its activity record while confirmation is checked.",
    );
  if (!saved.submitted && saved.review.expiresAt < Date.now())
    return {
      sent: false as const,
      error: "Price expired. Nothing was sent. Update price.",
    };
  const bytes = Buffer.from(serialized, "base64");
  let signature: string;
  try {
    signature = verifySolanaSigned(bytes, saved.review);
  } catch {
    return {
      sent: false as const,
      error: "This signed trade could not be verified. Nothing was sent.",
    };
  }
  if (saved.submitted) {
    if (saved.signature !== signature)
      throw Error("A different attempt is already pending.");
    return { signature };
  }
  saved.submitted = true;
  saved.signature = signature;
  // No replay after an ambiguous RPC error. The browser saved this signature
  // before sending; its independent receipt watcher handles every outcome.
  await solanaConnection.sendRawTransaction(bytes, {
    skipPreflight: false,
    maxRetries: 0,
    preflightCommitment: "confirmed",
  });
  return { signature };
}
export async function solanaReceipt(signature: string, messageHash: string) {
  if (
    bs58.decode(signature).length !== 64 ||
    !/^[a-f0-9]{64}$/.test(messageHash)
  )
    throw Error("Invalid activity record.");
  const status = (
    await solanaConnection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    })
  ).value[0];
  if (!status) return { state: "pending" };
  if (status.confirmationStatus !== "finalized") return { state: "pending" };
  const tx = await solanaConnection.getTransaction(signature, {
    commitment: "finalized",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx)
    throw Error("Receipt did not match this trade. Keep this activity record.");
  return verifySolanaReceipt(tx, messageHash);
}
