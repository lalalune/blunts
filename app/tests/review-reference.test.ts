import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ReviewStore,
  ReviewStorageError,
  type ReviewStorage,
} from "../client/review-store.js";
import {
  referenceShortfall,
  ReferenceGapError,
} from "../shared/reference-price.js";
const owner = "0x1111111111111111111111111111111111111111",
  other = "0x2222222222222222222222222222222222222222";
function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}
const reference = () => ({
  bid: "100",
  ask: "100",
  multiplier: "2",
  generatedAt: new Date().toISOString(),
  halted: false,
  status: "ASSET_STATUS_ACTIVE",
});
test("saved wallet review survives serialized reload and restores only amount/side, never an executable quote", () => {
  const disk = storage(),
    s = new ReviewStore(disk);
  s.save(owner, "fill", "25.123456");
  const reloaded = new ReviewStore(disk).load(owner)!;
  assert.equal(reloaded.amount, "25.123456");
  assert.equal(reloaded.side, "fill");
  assert.deepEqual(
    Object.keys(reloaded).sort(),
    ["version", "chainId", "owner", "side", "amount", "reviewedAt"].sort(),
  );
  assert.equal(new ReviewStore(disk).load(other), null);
  s.save(other, "spark", "0.000000000000000001");
  assert.equal(s.load(owner)?.amount, "25.123456");
  assert.equal(s.load(other)?.side, "spark");
});
test("corrupt, cross-wallet and denied review storage never gets silently replaced", () => {
  for (const bad of [
    "not JSON",
    JSON.stringify({
      version: 1,
      chainId: 4663,
      owner: other,
      side: "fill",
      amount: "25",
      reviewedAt: Date.now(),
    }),
    " ".repeat(4097),
  ]) {
    const disk = storage();
    const key = `blunts:review:4663:${owner}`;
    disk.setItem(key, bad);
    const s = new ReviewStore(disk);
    assert.throws(() => s.load(owner), ReviewStorageError);
    assert.throws(() => s.save(owner, "fill", "25"), ReviewStorageError);
    assert.equal(disk.getItem(key), bad);
  }
  const denied: ReviewStorage = {
    getItem: () => {
      throw Error("browser denied");
    },
    setItem: () => {
      throw Error("browser denied");
    },
  };
  assert.throws(
    () => new ReviewStore(denied).save(owner, "fill", "25"),
    ReviewStorageError,
  );
});
test("reference comparison applies corporate-action multiplier exactly once in both directions", () => {
  const r = reference();
  assert.equal(referenceShortfall("fill", "100", "0.5", r), 0);
  assert.equal(referenceShortfall("spark", "0.5", "100", r), 0);
  assert.equal(referenceShortfall("fill", "100", "0.475", r), 500);
  assert.equal(referenceShortfall("spark", "0.5", "95", r), 500);
  assert.equal(referenceShortfall("fill", "100", "0.6", r), 0);
  assert.throws(
    () => referenceShortfall("fill", "100", "0.474999999999999999", r),
    ReferenceGapError,
  );
  assert.throws(
    () => referenceShortfall("spark", "0.5", "94.999999", r),
    ReferenceGapError,
  );
});
test("reference guard rejects stale/halted/inverted or malformed prices before a review can be accepted", () => {
  for (const change of [
    { generatedAt: new Date(0).toISOString() },
    { generatedAt: new Date(Date.now() + 60000).toISOString() },
    { halted: true },
    { status: "ASSET_STATUS_INACTIVE" },
    { bid: "101", ask: "100" },
    { multiplier: "0" },
    { ask: "1e2" },
  ])
    assert.throws(() =>
      referenceShortfall("fill", "100", "0.5", { ...reference(), ...change }),
    );
});
