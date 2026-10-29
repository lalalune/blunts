import {
  encodeFunctionData,
  getAddress,
  keccak256,
  parseAbi,
  toBytes,
  type Address,
  type Hex,
} from "viem";
import { z } from "zod";
import {
  amountUnits,
  cash,
  dex,
  stock,
  WALLET_CONFIRMATION_MS,
  type SwapQuote,
} from "./robinhood.js";
import { appFee } from "./app-fee.js";
export const approvalAbi = parseAbi([
  "function approve(address spender,uint256 amount) returns(bool)",
  "function allowance(address owner,address spender) view returns(uint256)",
]);
export const routerAbi = parseAbi([
  "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns(uint256 amountOut)",
  "function multicall(uint256 deadline,bytes[] data) payable returns(bytes[] results)",
  "function sweepTokenWithFee(address token,uint256 amountMinimum,address recipient,uint256 feeBips,address feeRecipient) payable",
]);
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const quoteSchema = z
  .object({
    side: z.enum(["fill", "spark"]),
    amountIn: z.string().max(32),
    amountOut: z.string().max(32),
    minimumOut: z.string().max(32),
    fee: z.union([z.literal(500), z.literal(3000)]),
    pool: address,
    blockNumber: z.string().regex(/^\d{1,20}$/),
    expiresAt: z.number().int().safe(),
    referenceShortfallBps: z.number().int().min(0).max(500).optional(),
    transactionsEnabled: z.boolean(),
  })
  .strict();
export type SwapCall = {
  kind: "reset" | "approve" | "swap";
  to: Address;
  data: Hex;
  value: "0x0";
};
export type SwapPlan = {
  id: Hex;
  owner: Address;
  chainId: 4663;
  quote: SwapQuote;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minimumOut: bigint;
  calls: SwapCall[];
};
/** Only fixed canonical tokens/router, finite approvals, own-wallet net recipient, fixed 1% output fee and
 * an on-chain deadline. A plan is calldata, never a signature or broadcast. */
export function swapPlan(
  raw: unknown,
  owner: string,
  allowance: bigint,
  now = Date.now(),
): SwapPlan {
  const quote = quoteSchema.parse(raw);
  const account = getAddress(address.parse(owner));
  if (
    allowance < 0n ||
    quote.expiresAt <= now ||
    quote.expiresAt > now + 120000
  )
    throw Error("Quote expired or invalid. Preview again.");
  const input = quote.side === "fill" ? cash : stock,
    output = quote.side === "fill" ? stock : cash;
  const amountIn = amountUnits(quote.amountIn, input.decimals),
    amountOut = amountUnits(quote.amountOut, output.decimals),
    minimumOut = amountUnits(quote.minimumOut, output.decimals);
  if (
    amountIn > 100000n * 10n ** BigInt(input.decimals) ||
    minimumOut !== (amountOut * 995n) / 1000n
  )
    throw Error("Swap limits did not match the quote.");
  const calls: SwapCall[] = [];
  if (allowance < amountIn) {
    if (allowance > 0n)
      calls.push({
        kind: "reset",
        to: input.address,
        value: "0x0",
        data: encodeFunctionData({
          abi: approvalAbi,
          functionName: "approve",
          args: [dex.router, 0n],
        }),
      });
    calls.push({
      kind: "approve",
      to: input.address,
      value: "0x0",
      data: encodeFunctionData({
        abi: approvalAbi,
        functionName: "approve",
        args: [dex.router, amountIn],
      }),
    });
  }
  const data = encodeFunctionData({
    abi: routerAbi,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: input.address,
        tokenOut: output.address,
        fee: quote.fee,
        recipient: getAddress(dex.router),
        amountIn,
        amountOutMinimum: minimumOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
  const sweep = encodeFunctionData({
    abi: routerAbi,
    functionName: "sweepTokenWithFee",
    args: [output.address, minimumOut, account, appFee.bps, appFee.recipient],
  });
  calls.push({
    kind: "swap",
    to: dex.router,
    value: "0x0",
    data: encodeFunctionData({
      abi: routerAbi,
      functionName: "multicall",
      args: [
        BigInt(Math.floor((quote.expiresAt + WALLET_CONFIRMATION_MS) / 1000)),
        [data, sweep],
      ],
    }),
  });
  const id = keccak256(
    toBytes(
      JSON.stringify({
        owner: account.toLowerCase(),
        chainId: 4663,
        quote,
        calls,
      }),
    ),
  );
  return {
    id,
    owner: account,
    chainId: 4663,
    quote,
    tokenIn: input.address,
    tokenOut: output.address,
    amountIn,
    minimumOut,
    calls,
  };
}

/** Reconstruct every byte and semantic field before display or execution. */
export function verifiedSwapPlan(plan: SwapPlan): SwapPlan {
  const canonical = swapPlan(
    plan.quote,
    plan.owner,
    plan.calls[0]?.kind === "reset"
      ? 1n
      : plan.calls[0]?.kind === "approve"
        ? 0n
        : plan.amountIn,
  );
  if (
    canonical.id !== plan.id ||
    plan.chainId !== canonical.chainId ||
    plan.amountIn !== canonical.amountIn ||
    plan.minimumOut !== canonical.minimumOut ||
    plan.tokenIn.toLowerCase() !== canonical.tokenIn.toLowerCase() ||
    plan.tokenOut.toLowerCase() !== canonical.tokenOut.toLowerCase() ||
    JSON.stringify(canonical.calls) !== JSON.stringify(plan.calls)
  )
    throw Error("Wallet plan was changed. Prepare again.");
  return canonical;
}
