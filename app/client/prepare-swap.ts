import { referenceShortfall } from "../shared/reference-price";
import { parseAbi, formatUnits, type Address } from "viem";
import {
  stock,
  cash,
  dex,
  quoteAbi,
  tokenAbi,
  type SwapQuote,
  type Market,
} from "../shared/robinhood";
import { approvalAbi, swapPlan } from "../shared/swap-plan";
import { chainReader } from "./chain";
export class InsufficientTokenBalanceError extends Error {
  constructor(symbol: "USDG" | "QQQ") {
    super(`Not enough ${symbol} in this wallet.`);
    this.name = "InsufficientTokenBalanceError";
  }
}
/** Fresh independent chain checks before showing wallet steps. No wallet writes.
 * The optional reader supports isolated-fork qualification, never URL input. */
export async function prepareSwap(
  quote: SwapQuote,
  owner: Address,
  reader = chainReader,
  expectedChain = 4663,
  reference?: Market,
) {
  if (![4663, 31337].includes(expectedChain))
    throw Error("Unsupported preparation chain.");
  if (expectedChain === 4663 && !reference)
    throw Error("A fresh reference is required.");
  if ((await reader.getChainId()) !== expectedChain)
    throw Error("Chain verification failed.");
  const input = quote.side === "fill" ? cash : stock,
    output = quote.side === "fill" ? stock : cash;
  const [allowance, balance, decimals, routerCode, pool] = await Promise.all([
    reader.readContract({
      address: input.address,
      abi: approvalAbi,
      functionName: "allowance",
      args: [owner, dex.router],
    }),
    reader.readContract({
      address: input.address,
      abi: tokenAbi,
      functionName: "balanceOf",
      args: [owner],
    }),
    reader.readContract({
      address: input.address,
      abi: tokenAbi,
      functionName: "decimals",
    }),
    reader.getCode({ address: dex.router }),
    reader.readContract({
      address: dex.factory,
      abi: parseAbi([
        "function getPool(address,address,uint24) view returns(address)",
      ]),
      functionName: "getPool",
      args: [input.address, output.address, quote.fee],
    }),
  ]);
  const plan = swapPlan(quote, owner, allowance);
  if (
    decimals !== input.decimals ||
    !routerCode ||
    routerCode === "0x" ||
    pool.toLowerCase() !== quote.pool.toLowerCase()
  )
    throw Error("Token or pool verification failed.");
  if (balance < plan.amountIn)
    throw new InsufficientTokenBalanceError(input.symbol);
  const simulated = await reader.simulateContract({
    address: dex.quoter,
    abi: quoteAbi,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn: input.address,
        tokenOut: output.address,
        amountIn: plan.amountIn,
        fee: quote.fee,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
  if (simulated.result[0] < plan.minimumOut)
    throw Error("Price moved beyond your limit. Preview again.");
  if (reference)
    referenceShortfall(
      quote.side,
      quote.amountIn,
      formatUnits(simulated.result[0], output.decimals),
      reference,
    );
  return plan;
}
