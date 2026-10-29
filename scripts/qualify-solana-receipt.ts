import { Connection } from "@solana/web3.js";
import {
  solanaMessageHash,
  verifySolanaReceipt,
} from "../app/server/solana-receipt.js";
const [signature, expectedHash] = process.argv.slice(2);
if (!signature || !expectedHash)
  throw Error("Provide the saved public signature and original message hash");
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  "finalized",
);
const tx = await connection.getTransaction(signature, {
  commitment: "finalized",
  maxSupportedTransactionVersion: 0,
});
if (!tx) throw Error("No finalized receipt is available yet. Do not resend.");
const result = verifySolanaReceipt(tx, expectedHash);
console.log(
  JSON.stringify(
    {
      signature,
      messageHash: solanaMessageHash(tx.transaction.message.serialize()),
      ...result,
    },
    null,
    2,
  ),
);
