import { defineChain, parseAbi } from "viem";
export const QUOTE_LIFETIME_MS = 90_000;
export const WALLET_CONFIRMATION_MS = 300_000;
// Issuer registry and official Uniswap deployment manifest, verified 2026-10-28.
export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});
export const stock = {
  symbol: "QQQ",
  address: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68",
  decimals: 18,
} as const;
export const cash = {
  symbol: "USDG",
  address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  decimals: 6,
} as const;
export const dex = {
  factory: "0x1f7d7550b1b028f7571e69a784071f0205fd2efa",
  quoter: "0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7",
  router: "0xcaf681a66d020601342297493863e78c959e5cb2",
} as const;
export const tokenAbi = parseAbi([
  "function balanceOf(address) view returns(uint256)",
  "function decimals() view returns(uint8)",
  "function uiMultiplier() view returns(uint256)",
]);
export const quoteAbi = parseAbi([
  "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) returns(uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)",
]);
export type Market = {
  chainId: 4663;
  symbol: "QQQ";
  address: string;
  cashAddress: string;
  bid: string;
  ask: string;
  multiplier: string;
  generatedAt: string;
  halted: boolean;
  status: string;
  transactionsEnabled: boolean;
};
export type SwapQuote = {
  referenceShortfallBps?: number;
  side: "fill" | "spark";
  amountIn: string;
  amountOut: string;
  minimumOut: string;
  fee: number;
  pool: string;
  blockNumber: string;
  expiresAt: number;
  transactionsEnabled: boolean;
};
export function amountUnits(value: string, decimals: number): bigint {
  if (!new RegExp(`^(0|[1-9]\\d{0,8})(\\.\\d{1,${decimals}})?$`).test(value))
    throw Error("Enter a positive amount without rounding.");
  const [a, b = ""] = value.split(".");
  const units =
    BigInt(a) * 10n ** BigInt(decimals) + BigInt(b.padEnd(decimals, "0"));
  if (units <= 0n) throw Error("Enter an amount above zero.");
  return units;
}
