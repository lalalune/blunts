import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
// Full local UI qualification. All transaction writes go ONLY to the fixed
// loopback Anvil endpoint. A fresh in-memory test key signs only fork requests;
// no personal wallet/key or public submission is used. Chain id remains 4663.
import { chromium, expect, type Page } from "@playwright/test";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  encodeFunctionData,
  decodeEventLog,
  decodeFunctionData,
  formatUnits,
  type Address,
  type Hex,
} from "viem";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { cash, stock, dex, robinhood } from "../app/shared/robinhood.js";
import { appFee, feeOnOutput } from "../app/shared/app-fee.js";
import { approvalAbi, routerAbi } from "../app/shared/swap-plan.js";
import { supportedWalletCall } from "../app/client/transaction-activity.js";
const endpoint = "http://127.0.0.1:8752",
  app = "http://localhost:8753";
const client = createPublicClient({
  cacheTime: 0,
  transport: http(endpoint, { retryCount: 0, timeout: 15000 }),
});
let id = 0;
async function rpc(method: string, params: unknown[] = []) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.json();
  if (body.error)
    throw Error(`Loopback fork RPC failed: ${method} (${body.error.code})`);
  return body.result;
}
async function assertFork() {
  if ((await client.getChainId()) !== 4663)
    throw Error("Unexpected fork chain id.");
  const info = await rpc("anvil_nodeInfo");
  if (
    info.forkConfig?.forkUrl !== "https://rpc.mainnet.chain.robinhood.com" ||
    Number(info.forkConfig.forkBlockNumber) < 99969079
  )
    throw Error("Refusing non-Anvil or unexpected fork source.");
  return info;
}
const fork = await assertFork();
const health = await (await fetch(app + "/api/health")).json();
if (!health.ok || !health.transactionsEnabled)
  throw Error("Expected approved loopback signing server.");
const testAccount = privateKeyToAccount(generatePrivateKey());
const owner = testAccount.address;
const donor = "0xEbD78dcfc8a6b3A696f1E191aD1ff321f9579f79" as Address;
const testWallet = createWalletClient({
  account: testAccount,
  chain: robinhood,
  transport: http(endpoint, { retryCount: 0, timeout: 15000 }),
});
await rpc("anvil_impersonateAccount", [donor]);
for (const account of [owner, donor])
  await rpc("anvil_setBalance", [account, "0x8ac7230489e80000"]);
const seeded = await rpc("eth_sendTransaction", [
  {
    from: donor,
    to: cash.address,
    value: "0x0",
    chainId: "0x1237",
    data: encodeFunctionData({
      abi: parseAbi(["function transfer(address,uint256) returns(bool)"]),
      functionName: "transfer",
      args: [owner, 50000000n],
    }),
  },
]);
await client.waitForTransactionReceipt({ hash: seeded });
const balance = async (token: Address) =>
  client.readContract({
    address: token,
    abi: parseAbi(["function balanceOf(address) view returns(uint256)"]),
    functionName: "balanceOf",
    args: [owner],
  });
const feeBalance = (token: Address) =>
  client.readContract({
    address: token,
    abi: parseAbi(["function balanceOf(address) view returns(uint256)"]),
    functionName: "balanceOf",
    args: [appFee.recipient],
  });
const feeBefore = {
  qqq: await feeBalance(stock.address),
  usdg: await feeBalance(cash.address),
};
const before = await balance(cash.address),
  sends: { hash: Hex; transaction: unknown }[] = [];
const uiRequestCount = () => sends.length;
const root = `data/review-20261028/evm/ui-fork-${Date.now()}`;
await mkdir(root, { recursive: true, mode: 0o700 });
const browser = await chromium.launch({ headless: true });
let readCalls = 0;
let miningPaused = false;
let observedPage: Page | undefined;
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  await context.exposeBinding(
    "bluntsForkWallet",
    async (_source, args: { method: string; params?: any[] }) => {
      if (["eth_accounts", "eth_requestAccounts"].includes(args.method))
        return [owner];
      if (args.method === "eth_chainId") return rpc("eth_chainId");
      if (args.method !== "eth_sendTransaction")
        throw Error("Unsupported fixture wallet method.");
      await assertFork();
      const tx = args.params?.[0];
      if (
        tx?.from?.toLowerCase() !== owner.toLowerCase() ||
        tx.chainId !== "0x1237" ||
        BigInt(tx.value ?? 0) !== 0n
      )
        throw Error("Unsafe fixture transaction.");
      supportedWalletCall(owner, tx.to, tx.data, 0n);
      const hash = await testWallet.sendTransaction({
        to: tx.to,
        data: tx.data,
        value: 0n,
        nonce: Number(BigInt(tx.nonce)),
      });
      sends.push({ hash, transaction: tx });
      return hash;
    },
  );
  await context.addInitScript({
    content:
      "window.ethereum = {request: args => window.bluntsForkWallet(args), on: () => {}, removeListener: () => {}};",
  });
  const reads = new Set([
    "eth_chainId",
    "eth_getBalance",
    "eth_getTransactionCount",
    "eth_call",
    "eth_estimateGas",
    "eth_gasPrice",
    "eth_blockNumber",
    "eth_getCode",
    "eth_getTransactionByHash",
    "eth_getTransactionReceipt",
    "eth_getBlockByNumber",
    "eth_feeHistory",
    "eth_maxPriorityFeePerGas",
  ]);
  await context.route(
    "https://rpc.mainnet.chain.robinhood.com/",
    async (route) => {
      const body = route.request().postDataJSON();
      for (const item of Array.isArray(body) ? body : [body]) {
        if (!reads.has(item.method))
          throw Error("Unexpected write on browser read transport.");
        readCalls++;
      }
      // Both the URL and every method are constrained before forwarding. No proxy
      // to the public endpoint exists here, and chain-id responses are not rewritten.
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      await route.fulfill({
        status: response.status,
        contentType: "application/json",
        body: await response.text(),
      });
    },
  );
  const page = await context.newPage();
  observedPage = page;
  const startupErrors: string[] = [];
  page.on("pageerror", (error) => {
    startupErrors.push(error.message);
  });
  await page.goto(app);
  async function connect() {
    await page
      .getByRole("button", { name: "Connect wallet", exact: true })
      .click();
    await page.screenshot({ path: `${root}/wallet-chooser.png` });
    if (startupErrors.length) {
      await writeFile(
        `${root}/startup-errors.json`,
        JSON.stringify({ scope: "disposable QA browser only", startupErrors }),
        { mode: 0o600 },
      );
      throw Error(
        "Disposable wallet initializer failed; inspect scoped evidence.",
      );
    }
    await page
      .getByRole("button", { name: "Browser wallet", exact: true })
      .click();
  }
  await connect();
  await expect(
    page.getByText("50 USDG available", { exact: true }),
  ).toBeVisible();
  async function convert(side: "fill" | "spark", amount: string) {
    await page
      .getByRole("button", {
        name: side === "fill" ? "Fill" : "Spark",
        exact: true,
      })
      .click();
    await page
      .getByLabel(side === "fill" ? "USDG to spend" : "QQQ tokens to sell", {
        exact: true,
      })
      .fill(amount);
    await page
      .getByRole("button", { name: "Preview swap", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Review wallet steps", exact: true })
      .click();
    const region = page.getByRole("region", { name: "Wallet signing" }),
      count = uiRequestCount();
    await region.getByRole("checkbox").check();
    await region
      .getByRole("button", {
        name: "Approve exact amount in wallet",
        exact: true,
      })
      .click();
    await expect(
      region.getByRole("button", { name: "Check wallet receipt", exact: true }),
    ).toBeVisible();
    if (uiRequestCount() !== count + 1)
      throw Error("Unexpected automatic fixture transaction.");
    await region
      .getByRole("button", { name: "Check wallet receipt", exact: true })
      .click();
    await expect(
      region.getByRole("button", {
        name: "Confirm swap in wallet",
        exact: true,
      }),
    ).toBeDisabled();
    await region.getByRole("checkbox").check();
    await region
      .getByRole("button", { name: "Confirm swap in wallet", exact: true })
      .click();
    await expect(
      region.getByRole("button", { name: "Check wallet receipt", exact: true }),
    ).toBeVisible();
    if (uiRequestCount() !== count + 2)
      throw Error("Unexpected fixture request count.");
    await region
      .getByRole("button", { name: "Check wallet receipt", exact: true })
      .click();
    await expect(
      region.getByText(
        "All steps included on Robinhood Chain. Ethereum finality is not checked.",
        { exact: true },
      ),
    ).toBeVisible();
    await region.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${root}/${side}-included-local-fork.png` });
    await page.getByRole("button", { name: "Close", exact: true }).click();
  }
  await convert("fill", "25");
  const shares = await balance(stock.address);
  if (shares <= 0n) throw Error("Fork QQQ did not arrive.");
  await convert("spark", formatUnits(shares, 18));
  const after = await balance(cash.address),
    stockAfter = await balance(stock.address);
  if (stockAfter !== 0n || after <= before - 25000000n)
    throw Error("Fork sale did not return USDG.");
  await page.reload();
  await connect();
  await page.locator(".evm-connect button").click();
  await page.getByText("Activity on this browser", { exact: true }).click();
  await expect(page.locator(".evm-activity-list li")).toHaveCount(4);
  let journal = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "[]"),
    `blunts:swap:4663:${owner.toLowerCase()}`,
  );
  if (
    journal.length !== 4 ||
    journal.some((r: any) => r.state !== "included") ||
    uiRequestCount() !== 4
  )
    throw Error("Reloaded browser journal did not match executed fork steps.");
  const receipts = await Promise.all(
    sends.map((s) => client.getTransactionReceipt({ hash: s.hash })),
  );
  if (receipts.some((r) => r.status !== "success"))
    throw Error("Fork transaction reverted.");
  const feeProof = [];
  for (const [index, token] of [
    [1, stock.address],
    [3, cash.address],
  ] as const) {
    const transfers = receipts[index].logs.flatMap((log) => {
      if (log.address.toLowerCase() !== token.toLowerCase()) return [];
      try {
        const event = decodeEventLog({
          abi: parseAbi([
            "event Transfer(address indexed from,address indexed to,uint256 value)",
          ]),
          data: log.data,
          topics: log.topics,
        });
        return [event.args];
      } catch {
        return [];
      }
    });
    const toFee = transfers.filter(
      (t) =>
        t.from.toLowerCase() === dex.router.toLowerCase() &&
        t.to.toLowerCase() === appFee.recipient.toLowerCase(),
    );
    const toOwner = transfers.filter(
      (t) =>
        t.from.toLowerCase() === dex.router.toLowerCase() &&
        t.to.toLowerCase() === owner.toLowerCase(),
    );
    if (
      toFee.length !== 1 ||
      toOwner.length !== 1 ||
      toFee[0].value <= 0n ||
      feeOnOutput(toFee[0].value + toOwner[0].value).fee !== toFee[0].value
    )
      throw Error("Incorrect atomic fee transfers.");
    feeProof.push({
      token,
      gross: String(toFee[0].value + toOwner[0].value),
      fee: String(toFee[0].value),
      net: String(toOwner[0].value),
      hash: receipts[index].transactionHash,
    });
  }
  if (
    (await feeBalance(stock.address)) - feeBefore.qqq !==
      BigInt(feeProof[0].fee) ||
    (await feeBalance(cash.address)) - feeBefore.usdg !==
      BigInt(feeProof[1].fee)
  )
    throw Error("Fee recipient balance delta disagreed with receipts.");

  // Separate signed harness test: approve 1 virtual USDG, then force an impossible
  // output minimum. The mined revert must preserve both holders' token balances.
  const approvalHash = await testWallet.sendTransaction({
    to: cash.address,
    data: encodeFunctionData({
      abi: approvalAbi,
      functionName: "approve",
      args: [dex.router, 1000000n],
    }),
    value: 0n,
  });
  if (
    (await client.waitForTransactionReceipt({ hash: approvalHash })).status !==
    "success"
  )
    throw Error("Failure-case approval failed.");
  const originalBuy = decodeFunctionData({
    abi: routerAbi,
    data: (sends[1].transaction as any).data,
  });
  if (originalBuy.functionName !== "multicall")
    throw Error("Missing buy batch.");
  const originalSwap = decodeFunctionData({
    abi: routerAbi,
    data: originalBuy.args[1][0],
  });
  if (originalSwap.functionName !== "exactInputSingle")
    throw Error("Missing buy swap.");
  const tooHigh = 10n ** 36n;
  const failureData = encodeFunctionData({
    abi: routerAbi,
    functionName: "multicall",
    args: [
      BigInt(Math.floor(Date.now() / 1000) + 60),
      [
        encodeFunctionData({
          abi: routerAbi,
          functionName: "exactInputSingle",
          args: [
            {
              ...originalSwap.args[0],
              amountIn: 1000000n,
              amountOutMinimum: tooHigh,
            },
          ],
        }),
        encodeFunctionData({
          abi: routerAbi,
          functionName: "sweepTokenWithFee",
          args: [stock.address, tooHigh, owner, appFee.bps, appFee.recipient],
        }),
      ],
    ],
  });
  const failedHash = await testWallet.sendTransaction({
    to: dex.router,
    data: failureData,
    value: 0n,
    gas: 500000n,
  });
  const failureReceipt = await client.waitForTransactionReceipt({
    hash: failedHash,
  });
  if (
    failureReceipt.status !== "reverted" ||
    (await balance(cash.address)) !== after ||
    (await balance(stock.address)) !== stockAfter ||
    (await feeBalance(stock.address)) - feeBefore.qqq !==
      BigInt(feeProof[0].fee) ||
    (await feeBalance(cash.address)) - feeBefore.usdg !==
      BigInt(feeProof[1].fee)
  )
    throw Error("Failed swap charged a fee or moved tokens.");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await assertFork();
  await rpc("evm_setAutomine", [false]);
  miningPaused = true;
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByLabel("USDG to spend", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Preview swap", exact: true }).click();
  await page
    .getByRole("button", { name: "Review wallet steps", exact: true })
    .click();
  const signing = page.getByRole("region", { name: "Wallet signing" });
  await signing.getByRole("checkbox").check();
  await signing
    .getByRole("button", {
      name: "Clear allowance in wallet",
      exact: true,
    })
    .click();
  await expect(
    signing.getByText("Request sent. Check its receipt before continuing.", {
      exact: true,
    }),
  ).toBeVisible();
  if (uiRequestCount() !== 5)
    throw Error("Unexpected extra UI request before cancellation.");
  const pending = sends[4];
  const pendingTx = await client.getTransaction({ hash: pending.hash });
  await assertFork();
  const cancellationHash = await testWallet.sendTransaction({
    to: owner,
    value: 0n,
    data: "0x",
    nonce: pendingTx.nonce,
    gas: 21000n,
    maxFeePerGas:
      (pendingTx.maxFeePerGas ?? pendingTx.gasPrice ?? 20000000n) * 2n + 1n,
    maxPriorityFeePerGas: (pendingTx.maxPriorityFeePerGas ?? 1n) * 2n + 1n,
  });
  await rpc("evm_mine");
  await rpc("evm_setAutomine", [true]);
  miningPaused = false;
  const cancellationReceipt = await client.waitForTransactionReceipt({
    hash: cancellationHash,
  });
  if (
    cancellationReceipt.status !== "success" ||
    (await rpc("eth_getTransactionReceipt", [pending.hash])) !== null
  )
    throw Error("Original request was not displaced by the fork cancellation.");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".evm-connect button").click();
  await page.getByText("Activity on this browser", { exact: true }).click();
  await page
    .getByLabel("Transaction hash", { exact: true })
    .fill(cancellationHash);
  await page
    .getByRole("button", { name: "Track transaction", exact: true })
    .click();
  await expect(
    page.getByText("Wallet cancellation included", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Wallet cancellation included", { exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${root}/cancellation-included-local-fork.png`,
  });
  await page.reload();
  await connect();
  await page.locator(".evm-connect button").click();
  await page.getByText("Activity on this browser", { exact: true }).click();
  await expect(
    page.getByText("Wallet cancellation included", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".evm-activity-list li")).toHaveCount(5);
  journal = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "[]"),
    `blunts:swap:4663:${owner.toLowerCase()}`,
  );
  const recovered = journal.find((r: any) => r.hash === pending.hash);
  if (
    uiRequestCount() !== 5 ||
    recovered?.state !== "replaced" ||
    recovered?.replacement?.hash !== cancellationHash ||
    recovered?.replacement?.kind !== "cancel" ||
    (await balance(cash.address)) !== after ||
    (await balance(stock.address)) !== 0n
  )
    throw Error(
      "Cancellation recovery did not preserve the original or changed token balances.",
    );

  await writeFile(
    `${root}/receipt.json`,
    JSON.stringify(
      {
        scope:
          "Full real app UI/executor to isolated Anvil fork contracts only",
        sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        loopbackEndpoint: endpoint,
        appOrigin: app,
        forkSource: fork.forkConfig,
        chainId: 4663,
        chainIdNotRewritten: true,
        realWallet: false,
        personalKeysUsed: false,
        ephemeralGeneratedTestKeyOnly: true,
        keyPersisted: false,
        forkWalletTransactionsCryptographicallySigned: true,
        mainnetWrites: 0,
        publicApiReadsOnly: true,
        readCalls,
        owner,
        before: formatUnits(before, 6),
        after: formatUnits(after, 6),
        stockAfter: String(stockAfter),
        walletRequests: sends,
        appFee: {
          bps: "100",
          recipient: appFee.recipient,
          outputTransfers: feeProof,
          recipientBalancesVerified: true,
        },
        revertedSwap: {
          hash: failedHash,
          approvalHash,
          status: failureReceipt.status,
          blockHash: failureReceipt.blockHash,
          blockNumber: String(failureReceipt.blockNumber),
          noTokenMovement: true,
          noBluntsFee: true,
          ethGasCharged: true,
        },
        signedHarnessFeeFailureRequests: 2,
        receipts: receipts.map((r) => ({
          hash: r.transactionHash,
          status: r.status,
          blockHash: r.blockHash,
          blockNumber: String(r.blockNumber),
        })),
        replacementCancellation: {
          originalHash: pending.hash,
          cancellationHash,
          nonce: pendingTx.nonce,
          status: cancellationReceipt.status,
          blockHash: cancellationReceipt.blockHash,
          blockNumber: String(cancellationReceipt.blockNumber),
          originalReceiptMissing: true,
          originalPreserved: true,
          newUiRequestAfterRecovery: false,
          reloadVerified: true,
        },
        signedUiRequests: uiRequestCount(),
        signedHarnessCancellationRequests: 1,
        reloadedJournal: journal,
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      passed: true,
      scope: "isolated fork only",
      walletRequests: uiRequestCount(),
      journalRecords: journal.length,
      stockAfter: String(stockAfter),
      receipt: `${root}/receipt.json`,
    }),
  );
} catch (error) {
  if (observedPage)
    await observedPage.screenshot({ path: `${root}/failure-local-fork.png` });
  await writeFile(
    `${root}/failure.json`,
    JSON.stringify({
      passed: false,
      scope: "isolated fork UI qualification only",
      errorName: error instanceof Error ? error.name : "Unknown",
      walletRequests: uiRequestCount(),
      mainnetWrites: 0,
    }),
    { mode: 0o600 },
  );
  console.error(
    "UI fork qualification failed; inspect the private scoped receipt/screenshots. No public submission was enabled.",
  );
  process.exitCode = 2;
} finally {
  if (miningPaused) {
    try {
      await rpc("evm_setAutomine", [true]);
    } catch {
      process.exitCode = 2;
      console.error(
        "Fork mining cleanup failed; stop only the task-owned local node.",
      );
    }
  }
  await browser.close();
}
