import { RELEASE_ORIGIN } from "./release-target.js";
// Owner approved hosted Solana publication on 2026-10-29. Exact origin only.
export const SOLANA_HOSTED_RELEASE_APPROVED = true;
// Canonical mainnet assets from the issuer's QQQx registry. Amounts used in
// transactions are raw mint units; QQQx's display multiplier is separate.
export const solanaAssets = Object.freeze({
  cash: Object.freeze({
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    program: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  }),
  stock: Object.freeze({
    symbol: "QQQx",
    mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ",
    decimals: 8,
    program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  }),
});

// Owner approved nubs.sns on 2026-10-29. Resolved through the validated SNS
// resolver, then pinned: DNS changes must never silently redirect app fees.
// No URL, environment, wallet-storage or quote-provider override.
export const solanaAppFee = Object.freeze({
  bps: 100,
  recipientName: "nubs.sns",
  recipient: "3S4iLZaixgHMFY7S3jmkG4YQvDupKRzCRiYdicomCRkG",
});

export type SolanaSide = "fill" | "spark";
export type SolanaReview = {
  id: string;
  owner: string;
  side: SolanaSide;
  inAmount: string;
  outAmount: string;
  minimumOut: string;
  multiplier: number;
  nativeCost: number;
  transaction: string;
  messageHash: string;
  lastValidBlockHeight: number;
  expiresAt: number;
};
export function solanaExecutionOrigin(origin: string) {
  return (
    ["http://localhost:8753", "http://127.0.0.1:8753"].includes(origin) ||
    (SOLANA_HOSTED_RELEASE_APPROVED && origin === RELEASE_ORIGIN)
  );
}
export function solanaAmount(value: string, decimals: number): bigint {
  if (!/^(0|[1-9]\d{0,12})(\.\d+)?$/.test(value))
    throw Error("Enter a valid amount.");
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals) throw Error("Use fewer decimal places.");
  const units =
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0"));
  if (units <= 0n || units > 18446744073709551615n)
    throw Error("Enter a positive supported amount.");
  return units;
}
/** Scaled display quantities become raw transaction units, rounded down. */
export function solanaRawFromDisplay(value: string, multiplier: number) {
  if (!Number.isFinite(multiplier) || multiplier <= 0)
    throw Error("Price unavailable. Update price.");
  const { numerator, denominator } = multiplierRatio(multiplier);
  const raw = (solanaAmount(value, 8) * denominator) / numerator;
  if (raw <= 0n) throw Error("Choose a slightly larger amount.");
  return raw;
}
/** Exact rational for the mint's IEEE-754 f64, without decimal approximation. */
function multiplierRatio(multiplier: number) {
  if (!Number.isFinite(multiplier) || multiplier <= 0)
    throw Error("Invalid multiplier.");
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, multiplier);
  const bits = view.getBigUint64(0),
    exponent = Number((bits >> 52n) & 2047n),
    fraction = bits & ((1n << 52n) - 1n);
  let numerator = exponent ? fraction + (1n << 52n) : fraction,
    denominator = 1n;
  const power = (exponent || 1) - 1023 - 52;
  if (power < 0) denominator <<= BigInt(-power);
  else numerator <<= BigInt(power);
  return { numerator, denominator };
}
export function solanaScaledUnits(raw: bigint, multiplier: number) {
  const { numerator, denominator } = multiplierRatio(multiplier);
  return (raw * numerator) / denominator;
}
