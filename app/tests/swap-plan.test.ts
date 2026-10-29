import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeFunctionData, getAddress, type Address, type Hex } from "viem";
import {
  swapPlan,
  approvalAbi,
  routerAbi,
  verifiedSwapPlan,
} from "../shared/swap-plan.js";
import {
  SwapJournal,
  submitSwapStep,
  reconcileSwapAttempt,
  type JournalStorage,
  type ReceiptReader,
  type ExecutionReader,
  type WalletRpc,
  type SwapAttempt,
} from "../shared/swap-journal.js";
import { cash, stock, dex, type SwapQuote } from "../shared/robinhood.js";
const owner = "0x1111111111111111111111111111111111111111" as Address;
const txHash = `0x${"a".repeat(64)}` as Hex,
  blockHash = `0x${"b".repeat(64)}` as Hex;
const quote = (): SwapQuote => ({
  side: "fill",
  amountIn: "25",
  amountOut: "0.035",
  minimumOut: "0.034825",
  fee: 500,
  pool: "0xD60A5d14dB690B7Afad71F76B108071D7175597d",
  blockNumber: "99969079",
  expiresAt: Date.now() + 20000,
  transactionsEnabled: false,
});
function store() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}
function lock() {
  let pending = Promise.resolve();
  return async <T>(fn: () => Promise<T>) => {
    const previous = pending;
    let release!: () => void;
    pending = new Promise<void>((r) => (release = r));
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  };
}
function fixture(storage: JournalStorage = store()) {
  let sent = 0;
  const journal = new SwapJournal(storage, owner);
  const reader: ExecutionReader = {
    getChainId: async () => 31337,
    getTransactionCount: async () => 7,
    call: async () => ({}),
  };
  const wallet: WalletRpc = {
    request: async ({ method }) => {
      if (method === "eth_chainId") return "0x7a69";
      if (method === "eth_accounts") return [owner];
      if (method === "eth_sendTransaction") {
        sent++;
        return txHash;
      }
      throw Error("Unexpected fixture request");
    },
  };
  return { journal, reader, wallet, sent: () => sent, locked: lock(), storage };
}
test("swap calldata fixes token pair, own recipient, exact finite approval, min output and deadline", () => {
  const q = quote(),
    plan = swapPlan(q, owner, 0n);
  assert.equal(plan.calls.length, 2);
  assert.equal(plan.calls[0].to, cash.address);
  assert.equal(plan.calls[1].to, dex.router);
  assert.deepEqual(
    decodeFunctionData({ abi: approvalAbi, data: plan.calls[0].data }).args,
    [getAddress(dex.router), 25000000n],
  );
  const outer = decodeFunctionData({
    abi: routerAbi,
    data: plan.calls[1].data,
  });
  assert.equal(outer.functionName, "multicall");
  assert.equal(
    outer.args![0],
    BigInt(Math.floor((q.expiresAt + 300000) / 1000)),
  );
  const inner = decodeFunctionData({
    abi: routerAbi,
    data: (outer.args![1] as Hex[])[0],
  });
  assert.equal(inner.functionName, "exactInputSingle");
  const params = inner.args![0] as any;
  assert.equal(params.recipient, getAddress(dex.router));
  assert.equal((outer.args![1] as Hex[]).length, 2);
  assert.equal(params.tokenIn.toLowerCase(), cash.address.toLowerCase());
  assert.equal(params.tokenOut.toLowerCase(), stock.address.toLowerCase());
  assert.equal(params.amountOutMinimum, 34825000000000000n);
  assert.equal(swapPlan(q, owner, 25000000n).calls.length, 1);
  const reset = swapPlan(q, owner, 1n);
  assert.deepEqual(
    reset.calls.map((x) => x.kind),
    ["reset", "approve", "swap"],
  );
  assert.equal(
    decodeFunctionData({ abi: approvalAbi, data: reset.calls[0].data })
      .args![1],
    0n,
  );
  for (const change of [
    { expiresAt: Date.now() - 1 },
    { expiresAt: Date.now() + 180000 },
    { minimumOut: "0.0001" },
    { fee: 100 },
    { side: "withdraw" },
    { amountIn: "1e3" },
    { pool: "fake" },
  ])
    assert.throws(() => swapPlan({ ...q, ...change }, owner, 0n));
});
test("fork writer refuses mainnet, mismatched wallet, changed calldata and failed persistence before any send", async () => {
  for (const kind of ["chain", "wallet", "call", "disk"]) {
    const f = fixture(
      kind === "disk"
        ? {
            getItem: () => null,
            setItem: () => {
              throw Error("disk full");
            },
          }
        : store(),
    );
    const plan = swapPlan(quote(), owner, 0n);
    if (kind === "chain") f.reader.getChainId = async () => 4663;
    if (kind === "wallet") {
      const original = f.wallet.request;
      f.wallet.request = (args) =>
        args.method === "eth_accounts"
          ? Promise.resolve([stock.address])
          : original(args);
    }
    if (kind === "call") plan.calls[0].to = stock.address;
    await assert.rejects(
      submitSwapStep(plan, 0, f.wallet, f.reader, f.journal, f.locked),
    );
    assert.equal(f.sent(), 0);
  }
});
test("one concurrent request broadcasts and an unknown wallet response survives reload without replay", async () => {
  const f = fixture(),
    plan = swapPlan(quote(), owner, 0n);
  const results = await Promise.allSettled([
    submitSwapStep(plan, 0, f.wallet, f.reader, f.journal, f.locked),
    submitSwapStep(plan, 0, f.wallet, f.reader, f.journal, f.locked),
  ]);
  assert.equal(f.sent(), 1);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const u = fixture();
  const original = u.wallet.request;
  u.wallet.request = async (args) => {
    const response = await original(args);
    if (args.method === "eth_sendTransaction")
      throw Error("response lost after broadcast");
    return response;
  };
  const unknown = await submitSwapStep(
    plan,
    0,
    u.wallet,
    u.reader,
    u.journal,
    u.locked,
  );
  assert.equal(unknown.state, "unknown");
  assert.equal(unknown.hash, undefined);
  const reloaded = new SwapJournal(u.storage, owner);
  assert.equal(reloaded.read()[0].state, "unknown");
  await assert.rejects(
    submitSwapStep(
      swapPlan({ ...quote(), expiresAt: Date.now() + 21000 }, owner, 0n),
      0,
      u.wallet,
      u.reader,
      reloaded,
      u.locked,
    ),
  );
  assert.equal(u.sent(), 1);
  const disk = store();
  let writes = 0;
  const failingDisk: JournalStorage = {
    getItem: (key) => disk.getItem(key),
    setItem: (key, value) => {
      if (++writes > 1) throw Error("disk failed after broadcast");
      disk.setItem(key, value);
    },
  };
  const d = fixture(failingDisk);
  await assert.rejects(
    submitSwapStep(plan, 0, d.wallet, d.reader, d.journal, d.locked),
  );
  assert.equal(d.sent(), 1);
  const retained = new SwapJournal(disk, owner);
  assert.equal(retained.read()[0].state, "awaiting_wallet");
  await assert.rejects(
    submitSwapStep(plan, 0, d.wallet, d.reader, retained, d.locked),
  );
  assert.equal(d.sent(), 1);
});
test("receipt recovery verifies sender, nonce and calldata; RPC outage does not invent a reorg", async () => {
  const f = fixture(),
    plan = swapPlan(quote(), owner, 0n);
  const attempt = await submitSwapStep(
    plan,
    0,
    f.wallet,
    f.reader,
    f.journal,
    f.locked,
  );
  const reader: ReceiptReader = {
    getChainId: async () => 31337,
    getTransaction: async () => ({
      hash: txHash,
      from: owner,
      to: plan.calls[0].to,
      input: plan.calls[0].data,
      value: 0n,
      nonce: 7,
    }),
    getTransactionReceipt: async () => ({
      status: "success",
      transactionHash: txHash,
      blockHash,
      blockNumber: 10n,
    }),
    getBlock: async () => ({ hash: blockHash }),
    getBlockNumber: async () => 11n,
  };
  const confirmed = await reconcileSwapAttempt(attempt, reader, f.journal);
  assert.equal(confirmed.state, "confirmed");
  reader.getTransaction = async () => {
    throw Error("RPC outage");
  };
  assert.equal(
    (await reconcileSwapAttempt(confirmed, reader, f.journal)).state,
    "confirmed",
  );
  reader.getBlock = async () => ({ hash: txHash });
  assert.equal(
    (await reconcileSwapAttempt(confirmed, reader, f.journal)).state,
    "reorged",
  );
  const m = fixture(),
    pending = await submitSwapStep(
      plan,
      0,
      m.wallet,
      m.reader,
      m.journal,
      m.locked,
    );
  reader.getTransaction = async () => ({
    hash: txHash,
    from: owner,
    to: stock.address,
    input: plan.calls[0].data,
    value: 0n,
    nonce: 7,
  });
  assert.equal(
    (await reconcileSwapAttempt(pending, reader, m.journal)).state,
    "mismatch",
  );
  assert.throws(() => f.journal.save({ ...confirmed, nonce: 8 }));
});

test("review and execution share semantic plan verification, including display-only metadata", () => {
  const p = swapPlan(quote(), owner, 0n);
  assert.equal(verifiedSwapPlan(p).id, p.id);
  for (const change of [
    { amountIn: 1n },
    { minimumOut: 1n },
    { chainId: 1 },
    { tokenIn: stock.address },
    { tokenOut: cash.address },
    { owner: stock.address },
  ])
    assert.throws(() => verifiedSwapPlan({ ...p, ...change } as typeof p));
  const mutated = { ...p, calls: p.calls.map((call) => ({ ...call })) };
  mutated.calls[0].data = "0x00";
  assert.throws(() => verifiedSwapPlan(mutated));
});
