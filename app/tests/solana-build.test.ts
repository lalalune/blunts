import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  validateSolanaBuild,
  solanaAta,
  type SolanaBuild,
} from "../shared/solana-build.js";
import {
  solanaAmount,
  solanaRawFromDisplay,
  solanaAssets,
  solanaAppFee,
  solanaExecutionOrigin,
  type SolanaReview,
} from "../shared/solana.js";
import { solanaMessageHash, verifySolanaSigned } from "../server/solana.js";

function fixture(side: "fill" | "spark"): SolanaBuild {
  return JSON.parse(
    readFileSync(
      new URL(`./fixtures/solana-${side}-build.json`, import.meta.url),
      "utf8",
    ),
  );
}
test("qualified real Jupiter V2 builds preserve both directions and include the fee once", () => {
  for (const side of ["fill", "spark"] as const) {
    const b = fixture(side);
    const v = validateSolanaBuild(
      b,
      solanaAppFee.recipient,
      side,
      BigInt(b.inAmount),
    );
    assert.equal(v.minimum, (BigInt(b.outAmount) * 9950n) / 10000n);
    assert.equal(
      v.swap.keys[10].pubkey.toBase58(),
      solanaAta(solanaAppFee.recipient, v.output).toBase58(),
    );
  }
});
test("bounded V2 routing qualifies the real larger single-pool build without relaxing validation", () => {
  const b: SolanaBuild = JSON.parse(
    readFileSync(
      new URL("./fixtures/solana-large-build.json", import.meta.url),
      "utf8",
    ),
  );
  const checked = validateSolanaBuild(
    b,
    b.swapInstruction.accounts[0].pubkey,
    "fill",
    1030000000n,
  );
  assert.equal(checked.swap.data.readBigUInt64LE(8), 1030000000n);
  assert.equal(checked.minimum, (BigInt(b.outAmount) * 9950n) / 10000n);
});
test("rejects tampered spending, slippage, fee, route, mint, destination and extra instructions", () => {
  const bad = "11111111111111111111111111111111";
  const changes: ((b: SolanaBuild) => void)[] = [
    (b) => {
      b.inputMint = bad;
    },
    (b) => {
      b.outputMint = bad;
    },
    (b) => {
      b.inAmount = "2000000";
    },
    (b) => {
      b.outAmount = "1";
    },
    (b) => {
      b.otherAmountThreshold = "1";
    },
    (b) => {
      b.slippageBps = 500;
    },
    (b) => {
      b.swapMode = "ExactOut";
    },
    (b) => {
      b.priceImpactPct = "NaN";
    },
    (b) => {
      b.priceImpactPct = "0.2";
    },
    (b) => {
      b.transactionVersion = 1;
    },
    (b) => {
      b.tipInstruction = b.swapInstruction;
    },
    (b) => {
      b.cleanupInstruction = b.swapInstruction;
    },
    (b) => {
      b.otherInstructions = [b.swapInstruction];
    },
    (b) => {
      b.setupInstructions.push(b.swapInstruction);
    },
    (b) => {
      b.swapInstruction.programId = bad;
    },
  ];
  for (const index of [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 20, 21, 22, 23, 24,
  ])
    changes.push((b) => {
      b.swapInstruction.accounts[index].pubkey = bad;
    });
  for (const offset of [0, 8, 16, 24, 26, 28, 30, 34, 35, 37, 38])
    changes.push((b) => {
      const bytes = Buffer.from(b.swapInstruction.data, "base64");
      bytes[offset] ^= 1;
      b.swapInstruction.data = bytes.toString("base64");
    });
  changes.push(
    (b) => {
      b.swapInstruction.accounts[13].isSigner = true;
    },
    (b) => {
      b.computeBudgetInstructions[0].data = Buffer.from([
        3, 255, 255, 255, 255, 255, 255, 255, 255,
      ]).toString("base64");
    },
  );
  for (const change of changes) {
    const b = fixture("fill");
    change(b);
    assert.throws(() =>
      validateSolanaBuild(b, solanaAppFee.recipient, "fill", 1000000n),
    );
  }
});
test("signature validation refuses wallet message changes and forged signatures", () => {
  const holder = Keypair.generate();
  const tx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: holder.publicKey,
      recentBlockhash: Keypair.generate().publicKey.toBase58(),
      instructions: [
        SystemProgram.transfer({
          fromPubkey: holder.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 1,
        }),
      ],
    }).compileToV0Message(),
  );
  const r = {
    owner: holder.publicKey.toBase58(),
    messageHash: solanaMessageHash(tx.message.serialize()),
  } as SolanaReview;
  assert.throws(() => verifySolanaSigned(tx.serialize(), r));
  tx.sign([holder]);
  assert.equal(verifySolanaSigned(tx.serialize(), r).length > 80, true);
  assert.throws(() =>
    verifySolanaSigned(tx.serialize(), { ...r, messageHash: "a".repeat(64) }),
  );
  tx.signatures[0][0] ^= 1;
  assert.throws(() => verifySolanaSigned(tx.serialize(), r));
});
test("raw units are exact and signing stays restricted to the separate local preview", () => {
  assert.equal(solanaAmount("1.000001", 6), 1000001n);
  assert.equal(solanaRawFromDisplay("1.5", 1.5), 100000000n);
  assert.throws(() => solanaRawFromDisplay("0.00000001", 1.5));
  assert.equal(solanaAmount("0.00137639", 8), 137639n);
  for (const value of ["0", "-1", "1e6", "1.0000001", "NaN", " 1", "01"])
    assert.throws(() => solanaAmount(value, 6));
  assert.equal(solanaExecutionOrigin("http://localhost:8753"), true);
  assert.equal(solanaExecutionOrigin("https://blunt.nubs.site"), true);
  for (const origin of [
    "https://blunt.nubs.site.evil",
    "http://localhost:8745",
    "http://localhost.evil:8753",
    "https://localhost:8753",
  ])
    assert.equal(solanaExecutionOrigin(origin), false);
  assert.equal(solanaAssets.stock.decimals, 8);
});
