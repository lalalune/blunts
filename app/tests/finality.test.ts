import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FinalityStatus } from "../client/FinalityStatus.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Address, Hex } from "viem";
import { inspectFinality, type FinalityReader } from "../shared/finality.js";
import { SwapJournal } from "../shared/swap-journal.js";
import { swapPlan } from "../shared/swap-plan.js";
import { checkActivityFinality } from "../client/activity-finality.js";
const tx = `0x${"a".repeat(64)}` as Hex,
  blockHash = (height: bigint) =>
    ("0x" + height.toString(16).padStart(64, "0")) as Hex;
const expected = (number = 10n) => ({
  transactionHash: tx,
  blockHash: blockHash(number),
  blockNumber: number,
});
function fixture() {
  let calls = 0;
  const reader: FinalityReader = {
    getChainId: async () => 4663,
    getBlock: async (args) => {
      calls++;
      const number =
        "blockNumber" in args
          ? args.blockNumber
          : args.blockTag === "latest"
            ? 30n
            : args.blockTag === "safe"
              ? 20n
              : 10n;
      return { number, hash: blockHash(number) };
    },
  };
  return { reader, calls: () => calls };
}
test("node reports distinguish sequenced, safe and finalized using canonical block/head hashes with bounded reads", async () => {
  for (const [number, level] of [
    [10n, "rpc_finalized"],
    [15n, "rpc_safe"],
    [25n, "sequenced"],
  ] as const) {
    const f = fixture();
    const r = await inspectFinality(expected(number), f.reader);
    assert.equal(r.check.status, "verified");
    assert.equal(r.proof?.level, level);
    assert.equal(r.proof?.transactionHash, tx);
    assert.equal(r.proof?.blockHash, blockHash(number));
    assert.equal(f.calls(), 6);
  }
});
test("unsupported tags, inconsistent heights and noncanonical tagged hashes never produce a stronger report", async () => {
  for (const reason of ["missing", "order", "headhash", "chain"]) {
    const f = fixture(),
      base = f.reader.getBlock;
    if (reason === "chain") f.reader.getChainId = async () => 1;
    else
      f.reader.getBlock = async (args) => {
        const b = await base(args);
        if ("blockTag" in args && args.blockTag === "safe") {
          if (reason === "missing") throw Error("unsupported tag");
          if (reason === "order") return { number: 5n, hash: blockHash(5n) };
          if (reason === "headhash") return { number: 20n, hash: tx };
        }
        return b;
      };
    const r = await inspectFinality(expected(), f.reader);
    assert.equal(r.proof, undefined);
    assert.equal(
      r.check.status,
      reason === "missing" ? "unavailable" : "inconsistent",
    );
  }
});
test("a changed receipt block is reported as a canonical mismatch rather than finalized", async () => {
  const f = fixture(),
    base = f.reader.getBlock;
  f.reader.getBlock = async (args) =>
    "blockNumber" in args && args.blockNumber === 10n
      ? { number: 10n, hash: tx }
      : base(args);
  const r = await inspectFinality(expected(), f.reader);
  assert.equal(r.check.status, "canonical_mismatch");
  assert.equal(r.proof, undefined);
});
function activityFixture() {
  const owner = "0x1111111111111111111111111111111111111111" as Address;
  const p = swapPlan(
    {
      side: "fill",
      amountIn: "25",
      amountOut: "0.035",
      minimumOut: "0.034825",
      fee: 500,
      pool: owner,
      blockNumber: "10",
      expiresAt: Date.now() + 20000,
      transactionsEnabled: true,
    },
    owner,
    0n,
  );
  const values = new Map<string, string>();
  const journal = new SwapJournal(
    {
      getItem: (k) => values.get(k) ?? null,
      setItem: (k, v) => void values.set(k, v),
    },
    owner,
    4663,
  );
  const record = {
    planId: p.id,
    step: 0,
    owner,
    chainId: 4663 as const,
    call: p.calls[0],
    nonce: 0,
    state: "included" as const,
    hash: tx,
    blockHash: blockHash(10n),
    blockNumber: "10",
    observedAt: Date.now(),
    observation: "verified" as const,
  };
  journal.save(record);
  return { journal, record };
}
test("activity retains earlier proof during an RPC outage and re-blocks a proven reorg", async () => {
  const { journal, record } = activityFixture();
  const f = fixture();
  const first = await checkActivityFinality(record, journal, f.reader);
  assert.equal(first.finality?.level, "rpc_finalized");
  f.reader.getBlock = async () => {
    throw Error("offline");
  };
  const unavailable = await checkActivityFinality(first, journal, f.reader);
  assert.equal(unavailable.finalityCheck?.status, "unavailable");
  assert.deepEqual(unavailable.finality, first.finality);
  f.reader.getBlock = async (args) => ({
    number: "blockNumber" in args ? args.blockNumber : 30n,
    hash: tx,
  });
  const changed = await checkActivityFinality(unavailable, journal, f.reader);
  assert.equal(changed.state, "reorged");
  assert.equal(changed.finalityCheck?.status, "canonical_mismatch");
  assert.deepEqual(changed.finality, first.finality);
});
test("finality observations do not overwrite a newer journal revision while waiting on RPC", async () => {
  const { journal, record } = activityFixture();
  const other = fixture();
  let release!: () => void;
  let started!: () => void;
  const gate = new Promise<void>((r) => (release = r)),
    entered = new Promise<void>((r) => (started = r));
  const base = other.reader.getBlock;
  other.reader.getBlock = async (args) => {
    if ("blockTag" in args && args.blockTag === "safe") {
      started();
      await gate;
    }
    return base(args);
  };
  const pending = checkActivityFinality(record, journal, other.reader);
  await entered;
  const newer = { ...record, state: "reorged" as const, checkedAt: Date.now() };
  journal.save(newer);
  release();
  assert.equal((await pending).state, "reorged");
  assert.equal(journal.read()[0].finality, undefined);
  assert.deepEqual(journal.read()[0], newer);
});

test("old finality for the same transaction hash is not displayed against a newly included block", async () => {
  const { record } = activityFixture();
  const result = await inspectFinality(expected(), fixture().reader);
  assert.ok(result.proof);
  const matching = renderToStaticMarkup(
    createElement(FinalityStatus, {
      record: {
        ...record,
        finality: result.proof,
        finalityCheck: result.check,
      },
    }),
  );
  assert.ok(matching.includes("RPC reports finalized"));
  const moved = renderToStaticMarkup(
    createElement(FinalityStatus, {
      record: {
        ...record,
        blockNumber: "11",
        blockHash: blockHash(11n),
        finality: result.proof,
        finalityCheck: { status: "unavailable", at: Date.now() },
      },
    }),
  );
  assert.ok(moved.includes("Finality not verified"));
  assert.ok(!moved.includes("RPC reports finalized"));
});
