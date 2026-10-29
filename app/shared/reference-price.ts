import { amountUnits, cash, stock, type Market } from "./robinhood.js";
export class ReferenceGapError extends Error {
  constructor() {
    super(
      "This quote is more than 5% below the reference. Try a smaller amount.",
    );
  }
}
/** REST bid/ask refer to underlying shares. Multiply once by the issuer's
 * current multiplier to compare a raw token quote. This shortfall includes
 * spread/pool fees; it is not an isolated AMM price-impact measurement. */
export function referenceShortfall(
  side: "fill" | "spark",
  amountIn: string,
  amountOut: string,
  reference: Pick<
    Market,
    "bid" | "ask" | "multiplier" | "generatedAt" | "halted" | "status"
  >,
  now = Date.now(),
): number {
  const timestamp = Date.parse(reference.generatedAt);
  if (
    !Number.isFinite(timestamp) ||
    timestamp > now + 30000 ||
    now - timestamp > 120000 ||
    reference.halted ||
    reference.status !== "ASSET_STATUS_ACTIVE"
  )
    throw Error("Reference price is unavailable or stale. Preview again.");
  const bid = amountUnits(reference.bid, 18),
    ask = amountUnits(reference.ask, 18),
    multiplier = amountUnits(reference.multiplier, 18);
  if (bid > ask) throw Error("Reference spread is invalid.");
  const input = amountUnits(
    amountIn,
    side === "fill" ? cash.decimals : stock.decimals,
  );
  const output = amountUnits(
    amountOut,
    side === "fill" ? stock.decimals : cash.decimals,
  );
  const expected =
    side === "fill"
      ? (input * 10n ** 48n) / (ask * multiplier)
      : (input * bid * multiplier) / 10n ** 48n;
  if (expected <= 0n) throw Error("Reference amount is too small.");
  // Compare before division so rounding cannot hide a gap above 5%.
  if (output * 10000n < expected * 9500n) throw new ReferenceGapError();
  return output >= expected
    ? 0
    : Number(((expected - output) * 10000n) / expected);
}
