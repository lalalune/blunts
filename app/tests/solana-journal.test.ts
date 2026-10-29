import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newSolanaActivity,
  readSolanaActivity,
  saveSolanaActivity,
  unresolvedSolana,
} from "../client/solana-journal.js";
import type { SolanaReview } from "../shared/solana.js";
test("Solana recovery preserves immutable activity and blocks ambiguous duplicate sends", () => {
  const map = new Map<string, string>(),
    previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => map.set(k, v),
    },
  });
  try {
    const r = {
      id: "one",
      owner: "wallet-one",
      side: "fill",
      inAmount: "1000000",
      outAmount: "137639",
      minimumOut: "136951",
      messageHash: "a".repeat(64),
      lastValidBlockHeight: 100,
    } as SolanaReview;
    const original = newSolanaActivity(r);
    saveSolanaActivity(original);
    assert.equal(unresolvedSolana(readSolanaActivity()[0]), true);
    const pending = {
      ...original,
      state: "pending" as const,
      signature: "signature-one",
    };
    saveSolanaActivity(pending);
    assert.throws(() => saveSolanaActivity({ ...pending, state: "unsigned" }));
    assert.throws(() =>
      saveSolanaActivity({ ...pending, inAmount: "2000000" }),
    );
    assert.throws(() => saveSolanaActivity({ ...pending, id: "two" }));
    saveSolanaActivity({ ...pending, state: "complete" });
    assert.equal(unresolvedSolana(readSolanaActivity()[0]), false);
    assert.throws(() => saveSolanaActivity({ ...pending, state: "pending" }));
    const data = [...map.values()][0];
    assert.equal(data.includes("signedTransaction"), false);
    map.set([...map.keys()][0], "broken");
    assert.throws(() => readSolanaActivity(), /Saved activity needs attention/);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
