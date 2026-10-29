import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  Keypair,
  TransactionMessage,
  PublicKey,
  type VersionedTransactionResponse,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  apiInstruction,
  solanaAta,
  type SolanaBuild,
} from "../shared/solana-build.js";
import { solanaAssets, solanaAppFee } from "../shared/solana.js";
import {
  solanaMessageHash,
  verifySolanaReceipt,
} from "../server/solana-receipt.js";

function fixture(side: "fill" | "spark" = "fill", sameRecipient = false) {
  const b: SolanaBuild = JSON.parse(
    readFileSync(
      new URL(`./fixtures/solana-${side}-build.json`, import.meta.url),
      "utf8",
    ),
  );
  const owner = sameRecipient
      ? solanaAppFee.recipient
      : Keypair.generate().publicKey.toBase58(),
    old = solanaAppFee.recipient;
  const input = side === "fill" ? solanaAssets.cash : solanaAssets.stock,
    output = side === "fill" ? solanaAssets.stock : solanaAssets.cash;
  const replacements: Record<string, string> = {
    [old]: owner,
    [solanaAta(old, input).toBase58()]: solanaAta(owner, input).toBase58(),
    [solanaAta(old, output).toBase58()]: solanaAta(owner, output).toBase58(),
  };
  b.swapInstruction.accounts = b.swapInstruction.accounts.map((a, i) => ({
    ...a,
    pubkey: i === 10 ? a.pubkey : (replacements[a.pubkey] ?? a.pubkey),
  }));
  const message = new TransactionMessage({
    payerKey: new PublicKey(owner),
    recentBlockhash: Keypair.generate().publicKey.toBase58(),
    instructions: [apiInstruction(b.swapInstruction)],
  }).compileToV0Message();
  const keys = message.getAccountKeys(),
    indexes = message.compiledInstructions[0].accountKeyIndexes;
  const balance = (index: number, mint: string, amount: bigint) => ({
    accountIndex: index,
    mint,
    owner,
    uiTokenAmount: {
      amount: String(amount),
      decimals: mint === solanaAssets.cash.mint ? 6 : 8,
      uiAmount: null,
    },
  });
  const gross = 100000n,
    fee = 1000n,
    net = 99000n,
    quote = Buffer.from(b.swapInstruction.data, "base64");
  // Use a low verified quote to exercise the output floor independently of the
  // amount actually received. No real signatures or network sends are used.
  quote.writeBigUInt64LE(net, 16);
  b.swapInstruction.data = quote.toString("base64");
  const modified = new TransactionMessage({
    payerKey: new PublicKey(owner),
    recentBlockhash: message.recentBlockhash,
    instructions: [apiInstruction(b.swapInstruction)],
  }).compileToV0Message();
  const before = [
    balance(indexes[1], input.mint, BigInt(b.inAmount)),
    balance(indexes[2], output.mint, 0n),
  ];
  const after = [
    balance(indexes[1], input.mint, 0n),
    balance(indexes[2], output.mint, sameRecipient ? gross : net),
  ];
  if (!sameRecipient) {
    before.push(balance(indexes[10], output.mint, 0n));
    after.push(balance(indexes[10], output.mint, fee));
  }
  const transfer = Buffer.alloc(10);
  transfer[0] = 12;
  transfer.writeBigUInt64LE(fee, 1);
  transfer[9] = output.decimals;
  const tokenProgramIndex = keys
    .keySegments()
    .flat()
    .findIndex((k) => k.toBase58() === output.program);
  const tx: VersionedTransactionResponse = {
    slot: 100,
    transaction: { signatures: [], message: modified },
    meta: {
      err: null,
      fee: 5000,
      preBalances: [],
      postBalances: [],
      preTokenBalances: before,
      postTokenBalances: after,
      innerInstructions: [
        {
          index: 0,
          instructions: [
            {
              programIdIndex: tokenProgramIndex,
              accounts: [indexes[2], indexes[4], indexes[10], indexes[0]],
              data: bs58.encode(transfer),
              stackHeight: 2,
            } as any,
          ],
        },
      ],
    },
  };
  return { tx, hash: solanaMessageHash(modified.serialize()), indexes };
}
test("finalized Fill and Spark verify exact spent, net received and one-percent fee", () => {
  for (const side of ["fill", "spark"] as const) {
    const { tx, hash } = fixture(side);
    const r = verifySolanaReceipt(tx, hash);
    assert.equal(r.state, "complete");
    if (r.state === "complete") {
      assert.equal(r.side, side);
      assert.equal(r.receivedNet, "99000");
      assert.equal(r.feeReceived, "1000");
    }
  }
});
test("wrong failed receipt cannot release a pending transaction", () => {
  const { tx, hash } = fixture();
  tx.meta!.err = { InstructionError: [0, "InvalidArgument"] };
  assert.throws(() => verifySolanaReceipt(tx, "a".repeat(64)));
  assert.equal(verifySolanaReceipt(tx, hash).state, "failed");
});
test("rejects incorrect input, missing fee, excessive fee, wrong mint and output below floor", () => {
  for (const mutate of [
    (t: VersionedTransactionResponse) => {
      t.meta!.postTokenBalances![0].uiTokenAmount.amount = "1";
    },
    (t: VersionedTransactionResponse) => {
      t.meta!.postTokenBalances![2].uiTokenAmount.amount = "0";
    },
    (t: VersionedTransactionResponse) => {
      t.meta!.postTokenBalances![2].uiTokenAmount.amount = "2000";
    },
    (t: VersionedTransactionResponse) => {
      t.meta!.postTokenBalances![1].mint = solanaAssets.cash.mint;
    },
    (t: VersionedTransactionResponse) => {
      t.meta!.postTokenBalances![1].uiTokenAmount.amount = "1";
    },
  ]) {
    const { tx, hash } = fixture();
    mutate(tx);
    assert.throws(() => verifySolanaReceipt(tx, hash));
  }
});
test("holder-as-fee-recipient separates the direct fee CPI from combined balance changes", () => {
  const { tx, hash } = fixture("fill", true);
  const r = verifySolanaReceipt(tx, hash);
  assert.equal(r.state, "complete");
  if (r.state === "complete") assert.equal(r.receivedNet, "99000");
  delete (tx.meta!.innerInstructions![0].instructions[0] as any).stackHeight;
  assert.throws(() => verifySolanaReceipt(tx, hash));
});
