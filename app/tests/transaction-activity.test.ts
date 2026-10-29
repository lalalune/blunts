import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeFunctionData, type Address, type Hex } from "viem";
import { swapPlan, approvalAbi, routerAbi } from "../shared/swap-plan.js";
import { cash, dex, type SwapQuote } from "../shared/robinhood.js";
import {
  SwapJournal,
  reconcileSwapAttempt,
  type ReceiptReader,
  type JournalStorage,
} from "../shared/swap-journal.js";
import {
  trackWalletTransaction,
  supportedWalletCall,
} from "../client/transaction-activity.js";
import {
  estimateFirstStepFee,
  type GasReader,
} from "../client/gas-readiness.js";
const owner = "0x1111111111111111111111111111111111111111" as Address,
  other = "0x2222222222222222222222222222222222222222" as Address;
const hash = `0x${"a".repeat(64)}` as Hex,
  blockHash = `0x${"b".repeat(64)}` as Hex;
const q = (): SwapQuote => ({
  side: "fill",
  amountIn: "25",
  amountOut: "0.035",
  minimumOut: "0.034825",
  fee: 500,
  pool: "0xD60A5d14dB690B7Afad71F76B108071D7175597d",
  blockNumber: "1",
  expiresAt: Date.now() + 20000,
  transactionsEnabled: false,
});
function store(): JournalStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  };
}
function fixture() {
  const plan = swapPlan(q(), owner, 0n),
    disk = store(),
    journal = new SwapJournal(disk, owner, 4663);
  const reader: ReceiptReader = {
    getChainId: async () => 4663,
    getTransaction: async () => ({
      hash,
      from: owner,
      to: plan.calls[0].to,
      input: plan.calls[0].data,
      value: 0n,
      nonce: 7,
    }),
    getTransactionReceipt: async () => ({
      status: "success",
      transactionHash: hash,
      blockHash,
      blockNumber: 10n,
    }),
    getBlock: async () => ({ hash: blockHash }),
    getBlockNumber: async () => 20n,
  };
  return { plan, disk, journal, reader };
}
test("own transaction tracking persists one record, verifies receipt and reports inclusion without claiming finality", async () => {
  const f = fixture();
  const included = await trackWalletTransaction(
    hash,
    owner,
    f.journal,
    f.reader,
  );
  assert.equal(included.state, "included");
  assert.equal(included.tracked, true);
  assert.equal(included.observation, "verified");
  await trackWalletTransaction(hash, owner, f.journal, f.reader);
  assert.equal(f.journal.read().length, 1);
  assert.equal(new SwapJournal(f.disk, owner, 4663).read()[0].hash, hash);
  assert.equal(new SwapJournal(f.disk, other, 4663).read().length, 0);
  assert.equal(new SwapJournal(f.disk, owner, 31337).read().length, 0);
});
test("an uncertain request can attach only an exact same-sender/nonce/call hash, without replay", async () => {
  const f = fixture();
  f.journal.save({
    planId: f.plan.id,
    step: 0,
    owner,
    chainId: 4663,
    nonce: 7,
    call: f.plan.calls[0],
    state: "unknown",
  });
  const result = await trackWalletTransaction(hash, owner, f.journal, f.reader);
  assert.equal(result.planId, f.plan.id);
  assert.equal(result.state, "included");
  assert.equal(f.journal.read().length, 1);
  const bad = fixture();
  bad.journal.save({
    planId: bad.plan.id,
    step: 0,
    owner,
    chainId: 4663,
    nonce: 7,
    call: bad.plan.calls[1],
    state: "unknown",
  });
  await assert.rejects(
    trackWalletTransaction(hash, owner, bad.journal, bad.reader),
  );
  assert.equal(bad.journal.read()[0].state, "unknown");
  assert.equal(bad.journal.read()[0].hash, undefined);
});
test("foreign senders, wrong chain/receipt hash and arbitrary calldata never become accepted activity", async () => {
  const f = fixture();
  const original = f.reader.getTransaction;
  f.reader.getTransaction = async () => ({
    ...(await original({ hash })),
    from: other,
  });
  await assert.rejects(
    trackWalletTransaction(hash, owner, f.journal, f.reader),
  );
  assert.equal(f.journal.read().length, 0);
  f.reader.getTransaction = original;
  f.reader.getChainId = async () => 31337;
  await assert.rejects(
    trackWalletTransaction(hash, owner, f.journal, f.reader),
  );
  f.reader.getChainId = async () => 4663;
  f.reader.getTransactionReceipt = async () => ({
    status: "success",
    transactionHash: blockHash,
    blockHash,
    blockNumber: 10n,
  });
  assert.equal(
    (await trackWalletTransaction(hash, owner, f.journal, f.reader)).state,
    "mismatch",
  );
  assert.throws(() =>
    supportedWalletCall(owner, cash.address, f.plan.calls[0].data, 1n),
  );
  assert.throws(() =>
    supportedWalletCall(owner, other, f.plan.calls[0].data, 0n),
  );
  const foreign = swapPlan(q(), other, 0n);
  assert.throws(() =>
    supportedWalletCall(owner, dex.router, foreign.calls[1].data, 0n),
  );
  const batch = encodeFunctionData({
    abi: routerAbi,
    functionName: "multicall",
    args: [9999999999n, [f.plan.calls[1].data, f.plan.calls[1].data]],
  });
  assert.throws(() => supportedWalletCall(owner, dex.router, batch, 0n));
});
test("RPC failure retains last inclusion proof and records unavailable rather than fabricating a fresh confirmation", async () => {
  const f = fixture();
  const included = await trackWalletTransaction(
    hash,
    owner,
    f.journal,
    f.reader,
  );
  f.reader.getTransactionReceipt = async () => {
    throw Error("offline");
  };
  const unavailable = await reconcileSwapAttempt(included, f.reader, f.journal);
  assert.equal(unavailable.state, "included");
  assert.equal(unavailable.observedAt, included.observedAt);
  assert.equal(unavailable.observation, "unavailable");
});
test("fee readiness uses exact gas/wei with a 20% buffer and never estimates unsupported chains or expired reviews", async () => {
  const plan = swapPlan(q(), owner, 0n);
  let estimates = 0;
  const reader: GasReader = {
    getChainId: async () => 4663,
    estimateGas: async (args) => {
      estimates++;
      assert.equal(args.account, owner);
      assert.equal(args.to, cash.address);
      return 100000n;
    },
    getGasPrice: async () => 10000000n,
    getBalance: async () => 1200000000000n,
  };
  const fee = await estimateFirstStepFee(plan, reader);
  assert.ok(fee.status === "estimated");
  assert.equal(fee.gasLimit, 120000n);
  assert.equal(fee.estimatedFeeWei, 1200000000000n);
  assert.equal(fee.hasEnoughEth, true);
  reader.getBalance = async () => 1n;
  const insufficient = await estimateFirstStepFee(plan, reader);
  assert.ok(insufficient.status === "estimated");
  assert.equal(insufficient.hasEnoughEth, false);
  reader.getBalance = async () => 0n;
  const noEth = await estimateFirstStepFee(plan, reader);
  assert.equal(noEth.status, "needs_eth");
  assert.equal(estimates, 2);
  reader.getChainId = async () => 1;
  await assert.rejects(estimateFirstStepFee(plan, reader));
  assert.equal(estimates, 2);
  reader.getChainId = async () => 4663;
  plan.quote.expiresAt = Date.now() - 1;
  await assert.rejects(estimateFirstStepFee(plan, reader));
  assert.equal(estimates, 2);
});

test("late receipt and outage observations cannot overwrite a newer journal revision", async () => {
  const f = fixture();
  const initial = await trackWalletTransaction(
    hash,
    owner,
    f.journal,
    f.reader,
  );
  let release!: () => void;
  let entered!: () => void;
  const started = new Promise<void>((r) => (entered = r));
  const waiting = new Promise<void>((r) => (release = r));
  const original = f.reader.getTransactionReceipt;
  f.reader.getTransactionReceipt = async (args) => {
    entered();
    await waiting;
    return original(args);
  };
  const slow = reconcileSwapAttempt(initial, f.reader, f.journal);
  await started;
  const newer = {
    ...initial,
    state: "reorged" as const,
    checkedAt: Date.now() + 1,
  };
  f.journal.save(newer);
  release();
  assert.equal((await slow).state, "reorged");
  assert.deepEqual(f.journal.read()[0], newer);
  const stale = { ...initial, observation: "unavailable" as const };
  assert.equal(f.journal.saveObservation(stale, initial).state, "reorged");
});

test("verified cancellation preserves original instruction/hash, consumes one saved nonce and never creates a new request", async () => {
  const f = fixture();
  const original = {
    planId: f.plan.id,
    step: 0,
    chainId: 4663 as const,
    owner,
    call: f.plan.calls[0],
    nonce: 7,
    state: "pending" as const,
    hash,
  };
  f.journal.save(original);
  const cancelHash = `0x${"c".repeat(64)}` as Hex;
  f.reader.getTransaction = async () => ({
    hash: cancelHash,
    from: owner,
    to: owner,
    input: "0x",
    value: 0n,
    nonce: 7,
  });
  f.reader.getTransactionReceipt = async () => ({
    status: "success",
    transactionHash: cancelHash,
    blockHash,
    blockNumber: 10n,
  });
  const replaced = await trackWalletTransaction(
    cancelHash,
    owner,
    f.journal,
    f.reader,
  );
  assert.equal(replaced.state, "replaced");
  assert.equal(replaced.hash, hash);
  assert.deepEqual(replaced.call, original.call);
  assert.equal(replaced.replacement?.kind, "cancel");
  assert.equal(replaced.replacement?.hash, cancelHash);
  assert.equal(f.journal.read().length, 1);
  f.reader.getTransaction = async () => {
    throw Error("RPC outage");
  };
  assert.equal(
    (await trackWalletTransaction(cancelHash, owner, f.journal, f.reader))
      .observation,
    "unavailable",
  );
  f.reader.getBlock = async () => ({ hash });
  assert.equal(
    (await trackWalletTransaction(cancelHash, owner, f.journal, f.reader))
      .state,
    "reorged",
  );
  assert.equal(f.journal.read()[0].hash, hash);
});
test("unmined, wrong-nonce and changed-call replacements leave the pending request blocked", async () => {
  for (const reason of ["pending", "nonce", "call", "canonical"]) {
    const f = fixture();
    f.journal.save({
      planId: f.plan.id,
      step: 0,
      chainId: 4663,
      owner,
      call: f.plan.calls[0],
      nonce: 7,
      state: "pending",
      hash,
    });
    const nextHash = `0x${"d".repeat(64)}` as Hex;
    f.reader.getTransaction = async () => ({
      hash: nextHash,
      from: owner,
      to: reason === "call" ? cash.address : owner,
      input:
        reason === "call"
          ? encodeFunctionData({
              abi: approvalAbi,
              functionName: "approve",
              args: [dex.router, 1n],
            })
          : "0x",
      value: 0n,
      nonce: reason === "nonce" ? 8 : 7,
    });
    f.reader.getTransactionReceipt = async () => {
      if (reason === "pending") throw Error("no receipt");
      return {
        status: "success",
        transactionHash: nextHash,
        blockHash,
        blockNumber: 10n,
      };
    };
    if (reason === "canonical") f.reader.getBlock = async () => ({ hash });
    await assert.rejects(
      trackWalletTransaction(nextHash, owner, f.journal, f.reader),
    );
    assert.equal(f.journal.read()[0].state, "pending");
    assert.equal(f.journal.read()[0].replacement, undefined);
    assert.equal(f.journal.read()[0].hash, hash);
  }
});
test("same-call replacement and reverted replacement require canonical receipt proof and retain the original hash", async () => {
  for (const outcome of ["success", "reverted"] as const) {
    const f = fixture();
    f.journal.save({
      planId: f.plan.id,
      step: 0,
      chainId: 4663,
      owner,
      call: f.plan.calls[0],
      nonce: 7,
      state: "pending",
      hash,
    });
    const nextHash = `0x${"e".repeat(64)}` as Hex;
    f.reader.getTransaction = async () => ({
      hash: nextHash,
      from: owner,
      to: f.plan.calls[0].to,
      input: f.plan.calls[0].data,
      value: 0n,
      nonce: 7,
    });
    f.reader.getTransactionReceipt = async () => ({
      status: outcome,
      transactionHash: nextHash,
      blockHash,
      blockNumber: 10n,
    });
    const r = await trackWalletTransaction(
      nextHash,
      owner,
      f.journal,
      f.reader,
    );
    assert.equal(r.state, "replaced");
    assert.equal(r.replacement?.kind, "same_call");
    assert.equal(r.replacement?.outcome, outcome);
    assert.equal(r.hash, hash);
    assert.equal(f.journal.read().length, 1);
  }
});

test("oversized activity is rejected before replacing readable stored history", () => {
  const f = fixture();
  const original = {
    planId: f.plan.id,
    step: 0,
    chainId: 4663 as const,
    owner,
    call: f.plan.calls[0],
    nonce: 7,
    state: "pending" as const,
    hash,
  };
  f.journal.save(original);
  const before = JSON.stringify(f.journal.read());
  assert.throws(() =>
    f.journal.save({
      ...original,
      planId: `0x${"9".repeat(64)}` as Hex,
      nonce: 8,
      call: { ...original.call, data: ("0x" + "aa".repeat(110000)) as Hex },
    }),
  );
  assert.equal(JSON.stringify(f.journal.read()), before);
});
