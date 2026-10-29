// Read-only public receipt sample. Never a Blunts/owner trade acceptance receipt.
import { createPublicClient, http, type Hex } from "viem";
import { writeFile, mkdir } from "node:fs/promises";
import { inspectFinality } from "../app/shared/finality.js";
const endpoint = "https://rpc.mainnet.chain.robinhood.com";
const reader = createPublicClient({
  transport: http(endpoint, { retryCount: 0, timeout: 10000 }),
});
try {
  if ((await reader.getChainId()) !== 4663) throw Error("Unexpected chain.");
  const head = await reader.getBlock({ blockTag: "finalized" });
  const sample = head.transactions[1];
  if (typeof sample !== "string")
    throw Error("No bounded non-first receipt sample was available.");
  const receipt = await reader.getTransactionReceipt({ hash: sample as Hex });
  const report = await inspectFinality(
    {
      transactionHash: receipt.transactionHash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
    },
    reader,
  );
  const path = `data/review-20261028/evm/public-finality-${Date.now()}.json`;
  await mkdir("data/review-20261028/evm", { recursive: true, mode: 0o700 });
  await writeFile(
    path,
    JSON.stringify(
      {
        scope: "one public receipt sample; not owner/Blunts trade acceptance",
        at: new Date().toISOString(),
        endpoint,
        chainId: 4663,
        transactionHash: receipt.transactionHash,
        receiptStatus: receipt.status,
        blockNumber: String(receipt.blockNumber),
        blockHash: receipt.blockHash,
        report,
        independentEthereumProof: false,
        transactionsSent: 0,
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      scope: "read-only public sample",
      check: report.check.status,
      level: report.proof?.level,
      transactionsSent: 0,
      receipt: path,
    }),
  );
  if (report.check.status !== "verified") process.exitCode = 2;
} catch {
  console.error(
    "Public finality read sample was unavailable; no transactions were sent.",
  );
  process.exitCode = 2;
}
