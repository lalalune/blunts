// All writes in this script are hard pinned to loopback Anvil, chain 31337.
// The public RPC is used only by Anvil's upstream read-only fork transport.
import {
  createPublicClient,
  http,
  parseAbi,
  formatUnits,
  encodeFunctionData,
  type Hex,
  type Address,
} from "viem";
import { writeFile, mkdir } from "node:fs/promises";
import {
  cash,
  stock,
  dex,
  quoteAbi,
  amountUnits,
  type SwapQuote,
} from "../app/shared/robinhood.js";
import { prepareSwap } from "../app/client/prepare-swap.js";
import {
  SwapJournal,
  submitSwapStep,
  reconcileSwapAttempt,
  type WalletRpc,
  type SwapAttempt,
} from "../app/shared/swap-journal.js";
const endpoint = "http://127.0.0.1:8752";
const client = createPublicClient({
  cacheTime: 0,
  transport: http(endpoint, { retryCount: 0, timeout: 15000 }),
});
let rpcId = 0;
async function rpc(method: string, params: unknown[] = []) {
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    signal: AbortSignal.timeout(20000),
  });
  const d = await r.json();
  if (d.error)
    throw Error(`Local fork RPC failed: ${method} (${d.error.code})`);
  return d.result;
}
if ((await client.getChainId()) !== 31337)
  throw Error("Refusing writes outside isolated fork chain 31337.");
const info = await rpc("anvil_nodeInfo");
if (
  !info.forkConfig ||
  info.forkConfig.forkUrl !== "https://rpc.mainnet.chain.robinhood.com" ||
  Number(info.forkConfig.forkBlockNumber) < 99969079
)
  throw Error("Unexpected Anvil fork source.");
const owner = "0x000000000000000000000000000000000000b10b" as Address;
const donor = "0xEbD78dcfc8a6b3A696f1E191aD1ff321f9579f79" as Address;
for (const address of [owner, donor]) {
  await rpc("anvil_impersonateAccount", [address]);
  await rpc("anvil_setBalance", [address, "0x8ac7230489e80000"]);
}
const transfer = await rpc("eth_sendTransaction", [
  {
    from: donor,
    to: cash.address,
    data: encodeFunctionData({
      abi: parseAbi(["function transfer(address,uint256) returns(bool)"]),
      functionName: "transfer",
      args: [owner, 50000000n],
    }),
    value: "0x0",
    chainId: "0x7a69",
  },
]);
await client.waitForTransactionReceipt({ hash: transfer });
const data = new Map<string, string>();
const storage = {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => {
    data.set(key, value);
  },
};
let journal = new SwapJournal(storage, owner),
  sent = 0;
const wallet: WalletRpc = {
  request: async ({ method, params }) => {
    if (method === "eth_accounts") return [owner];
    if (method === "eth_sendTransaction") sent++;
    return rpc(method, params);
  },
};
// A single-process fixture lock, replacing the browser's exclusive Web Lock.
const locked = async <T>(fn: () => Promise<T>) => fn();
async function getQuote(
  side: "fill" | "spark",
  amount: string,
): Promise<SwapQuote> {
  const input = side === "fill" ? cash : stock,
    output = side === "fill" ? stock : cash;
  const r = await client.simulateContract({
    address: dex.quoter,
    abi: quoteAbi,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn: input.address,
        tokenOut: output.address,
        amountIn: amountUnits(amount, input.decimals),
        fee: 500,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
  const out = r.result[0];
  return {
    side,
    amountIn: amount,
    amountOut: formatUnits(out, output.decimals),
    minimumOut: formatUnits((out * 995n) / 1000n, output.decimals),
    fee: 500,
    pool: "0xD60A5d14dB690B7Afad71F76B108071D7175597d",
    blockNumber: String(await client.getBlockNumber()),
    expiresAt: Date.now() + 20000,
    transactionsEnabled: false,
  };
}
async function execute(side: "fill" | "spark", amount: string) {
  const q = await getQuote(side, amount);
  const plan = await prepareSwap(q, owner, client, 31337);
  const attempts: SwapAttempt[] = [];
  for (let i = 0; i < plan.calls.length; i++) {
    let attempt = await submitSwapStep(
      plan,
      i,
      wallet,
      client,
      journal,
      locked,
    );
    if (!attempt.hash)
      throw Error("Local fork did not return a transaction hash.");
    await client.waitForTransactionReceipt({ hash: attempt.hash as Hex });
    await rpc("evm_mine");
    journal = new SwapJournal(storage, owner);
    attempt = await reconcileSwapAttempt(
      journal.read().find((r) => r.planId === plan.id && r.step === i)!,
      client,
      journal,
    );
    if (attempt.state !== "confirmed")
      throw Error("Local fork transaction did not confirm.");
    attempts.push(attempt);
  }
  return { quote: q, attempts };
}
const balanceAbi = parseAbi([
  "function balanceOf(address) view returns(uint256)",
  "function allowance(address,address) view returns(uint256)",
]);
const before = await client.readContract({
  address: cash.address,
  abi: balanceAbi,
  functionName: "balanceOf",
  args: [owner],
});
const buy = await execute("fill", "25");
const shares = await client.readContract({
  address: stock.address,
  abi: balanceAbi,
  functionName: "balanceOf",
  args: [owner],
});
if (shares <= 0n) throw Error("No local fork QQQ arrived.");
const remainingBuyAllowance = await client.readContract({
  address: cash.address,
  abi: balanceAbi,
  functionName: "allowance",
  args: [owner, dex.router],
});
if (remainingBuyAllowance !== 0n)
  throw Error("Local fork approval was not fully consumed.");
const sell = await execute("spark", formatUnits(shares, 18));
const after = await client.readContract({
  address: cash.address,
  abi: balanceAbi,
  functionName: "balanceOf",
  args: [owner],
});
const afterShares = await client.readContract({
  address: stock.address,
  abi: balanceAbi,
  functionName: "balanceOf",
  args: [owner],
});
if (afterShares !== 0n || after <= before - 25000000n)
  throw Error("Local fork sale did not return USDG.");
const lostPlan = await prepareSwap(
  await getQuote("fill", "1"),
  owner,
  client,
  31337,
);
const beforeLost = sent;
let lostHash: Hex | undefined;
const losingWallet: WalletRpc = {
  request: async (args) => {
    const value = await wallet.request(args);
    if (args.method === "eth_sendTransaction") {
      lostHash = value;
      throw Error("Simulated response lost after local fork broadcast");
    }
    return value;
  },
};
const unknown = await submitSwapStep(
  lostPlan,
  0,
  losingWallet,
  client,
  journal,
  locked,
);
if (unknown.state !== "unknown" || unknown.hash || !lostHash)
  throw Error("Lost-response journal did not preserve uncertainty.");
await client.waitForTransactionReceipt({ hash: lostHash });
journal = new SwapJournal(storage, owner);
let duplicateBlocked = false;
try {
  await submitSwapStep(lostPlan, 0, losingWallet, client, journal, locked);
} catch {
  duplicateBlocked = true;
}
if (!duplicateBlocked || sent !== beforeLost + 1)
  throw Error("Uncertain local fork transaction was replayed.");
const receipt = {
  scope: "Isolated Anvil fork only; chain 31337; no mainnet writes",
  forkBlock: Number(info.forkConfig.forkBlockNumber),
  owner,
  source: "public Robinhood Chain read-only fork",
  before: formatUnits(before, 6),
  after: formatUnits(after, 6),
  stockAfter: String(afterShares),
  remainingBuyAllowance: String(remainingBuyAllowance),
  walletRequests: sent,
  buy,
  sell,
  unknownResponse: {
    state: unknown.state,
    hashSaved: false,
    actualLocalHash: lostHash,
    replayBlocked: duplicateBlocked,
  },
  reloadedJournalRecords: journal.read().length,
  journal: journal.read(),
};
await mkdir("data/review-20261028/evm", { recursive: true, mode: 0o700 });
await writeFile(
  `data/review-20261028/evm/fork-cycle-${Date.now()}.json`,
  JSON.stringify(receipt, null, 2) + "\n",
  { mode: 0o600 },
);
console.log(
  JSON.stringify({
    scope: "local fork only",
    passed: true,
    walletRequests: sent,
    qqqAfter: String(afterShares),
    journalRecords: journal.read().length,
  }),
);
