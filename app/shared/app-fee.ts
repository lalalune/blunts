import { formatUnits, getAddress } from "viem";
import { amountUnits, cash, stock, type SwapQuote } from "./robinhood.js";

// Owner-approved public recipient. No runtime, URL or storage override.
export const appFee = Object.freeze({
  bps: 100n,
  recipient: getAddress("0x4a27c325de7629c6bbd187e1e456b56c82e73073"),
});
export function feeOnOutput(gross: bigint) {
  if (gross < 0n) throw Error("Invalid output amount.");
  const fee = (gross * appFee.bps) / 10000n;
  return { fee, net: gross - fee };
}
/** Quoter amounts are gross pool output. User amounts are after the app fee.
 * The router rounds the fee down to token units, including at the minimum. */
export function quoteAfterFee(quote: SwapQuote) {
  const output = quote.side === "fill" ? stock : cash;
  const expected = feeOnOutput(amountUnits(quote.amountOut, output.decimals));
  const minimum = feeOnOutput(amountUnits(quote.minimumOut, output.decimals));
  return {
    amountOut: formatUnits(expected.net, output.decimals),
    minimumOut: formatUnits(minimum.net, output.decimals),
    feeAmount: formatUnits(expected.fee, output.decimals),
    symbol: output.symbol,
  };
}
