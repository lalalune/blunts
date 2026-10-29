import { test } from "node:test";
import assert from "node:assert/strict";
import type { Address, Hex } from "viem";
import { swapPlan } from "../shared/swap-plan.js";
import {
  SwapJournal,
  submitSwapStep,
  type ExecutionReader,
  type WalletRpc,
} from "../shared/swap-journal.js";
import {
  requestWalletStep,
  localExecutionPolicy,
} from "../client/wallet-execution.js";
const owner = "0x1111111111111111111111111111111111111111" as Address,
  other = "0x2222222222222222222222222222222222222222";
const hash = `0x${"a".repeat(64)}` as Hex;
const plan = () =>
  swapPlan(
    {
      side: "fill",
      amountIn: "25",
      amountOut: "0.035",
      minimumOut: "0.034825",
      fee: 500,
      pool: other,
      blockNumber: "1",
      expiresAt: Date.now() + 20000,
      transactionsEnabled: false,
    },
    owner,
    0n,
  );
function fixture() {
  const data = new Map<string, string>();
  const journal = new SwapJournal(
    {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
    },
    owner,
    4663,
  );
  let sends = 0,
    reads = 0,
    last: any;
  let account = owner as string;
  const wallet: WalletRpc = {
    request: async (args) => {
      reads++;
      if (args.method === "eth_chainId") return "0x1237";
      if (args.method === "eth_accounts") return [account];
      if (args.method === "eth_sendTransaction") {
        sends++;
        last = args.params?.[0];
        assert.equal(journal.read()[0].state, "awaiting_wallet");
        return hash;
      }
      throw Error("unexpected fixture method");
    },
  };
  const reader: ExecutionReader = {
    getChainId: async () => 4663,
    getTransactionCount: async () => 4,
    call: async () => ({}),
  };
  return {
    journal,
    wallet,
    reader,
    sends: () => sends,
    reads: () => reads,
    last: () => last,
    locked: async <T>(fn: () => Promise<T>) => fn(),
    changeAccount: () => (account = other),
  };
}
test("unknown-origin policy is frozen and refuses real-wallet requests before wallet/storage/network access", async () => {
  assert.equal(localExecutionPolicy.enabled, false);
  assert.ok(Object.isFrozen(localExecutionPolicy));
  let called = 0;
  await assert.rejects(
    requestWalletStep(plan(), 0, {
      request: async () => {
        called++;
        throw Error();
      },
    }),
    /disabled/,
  );
  assert.equal(called, 0);
});
test("mainnet-shaped offline fixture requires enabled policy and preflight before any wallet send", async () => {
  for (const policy of [
    { chainId: 4663 as const, enabled: false },
    { chainId: 4663 as const, enabled: true },
  ]) {
    const f = fixture();
    await assert.rejects(
      submitSwapStep(
        plan(),
        0,
        f.wallet,
        f.reader,
        f.journal,
        f.locked,
        policy,
      ),
    );
    assert.equal(f.reads(), 0);
    assert.equal(f.sends(), 0);
    assert.equal(f.journal.read().length, 0);
  }
});
test("one explicitly enabled offline request persists first, awaits preflight and pins owner/chain/finite call", async () => {
  const f = fixture(),
    p = plan();
  let preflight = 0;
  const result = await submitSwapStep(
    p,
    0,
    f.wallet,
    f.reader,
    f.journal,
    f.locked,
    {
      chainId: 4663,
      enabled: true,
      preflight: async (actual, step) => {
        preflight++;
        assert.equal(actual.id, p.id);
        assert.equal(step, 0);
        assert.equal(f.sends(), 0);
      },
    },
  );
  assert.equal(preflight, 1);
  assert.equal(f.sends(), 1);
  assert.equal(result.chainId, 4663);
  assert.equal(result.state, "pending");
  assert.deepEqual(f.last(), {
    from: owner,
    to: p.calls[0].to,
    data: p.calls[0].data,
    value: "0x0",
    chainId: "0x1237",
    nonce: "0x4",
  });
  assert.equal(f.journal.read().length, 1);
});
test("preflight failure or wallet change during RPC checks never opens a transaction request", async () => {
  for (const reason of ["preflight", "account"]) {
    const f = fixture();
    if (reason === "account")
      f.reader.getTransactionCount = async () => {
        f.changeAccount();
        return 4;
      };
    await assert.rejects(
      submitSwapStep(plan(), 0, f.wallet, f.reader, f.journal, f.locked, {
        chainId: 4663,
        enabled: true,
        preflight: async () => {
          if (reason === "preflight") throw Error("price moved");
        },
      }),
    );
    assert.equal(f.sends(), 0);
    assert.equal(f.journal.read().length, 0);
  }
});

test("plan mutation during preflight cannot change the wallet calldata or limits", async () => {
  const f = fixture(),
    p = plan();
  await assert.rejects(
    submitSwapStep(p, 0, f.wallet, f.reader, f.journal, f.locked, {
      chainId: 4663,
      enabled: true,
      preflight: async () => {
        p.calls[0].to = other as Address;
      },
    }),
  );
  assert.equal(f.sends(), 0);
  assert.equal(f.journal.read().length, 0);
});
