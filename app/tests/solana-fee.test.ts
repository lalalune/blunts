import { test } from "node:test";
import assert from "node:assert/strict";
import { solanaAppFee } from "../shared/solana.js";
import { solanaFeeAccount } from "../server/solana-fee.js";

test("Solana output fees use the approved SNS wallet and correct token programs", () => {
  assert.equal(solanaAppFee.bps, 100);
  assert.equal(solanaAppFee.recipientName, "nubs.sns");
  assert.equal(
    solanaAppFee.recipient,
    "3S4iLZaixgHMFY7S3jmkG4YQvDupKRzCRiYdicomCRkG",
  );
  assert.equal(
    solanaFeeAccount("fill").toBase58(),
    "CM4LRLtHJ2bvNkuNWB5oiwzaEdjUQYUECQtW8UKGHKre",
  );
  assert.equal(
    solanaFeeAccount("spark").toBase58(),
    "ffj1Mh4hkNhH6iqxGqffZo7cGHKP3s5YZuakcPXAwbP",
  );
});
