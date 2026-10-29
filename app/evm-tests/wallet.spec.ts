import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import {
  encodeAbiParameters,
  encodeFunctionData,
  parseAbi,
  toFunctionSelector,
} from "viem";
const trackedHash = `0x${"a".repeat(64)}`;
const trackedBlock = `0x${"b".repeat(64)}`;
const trackedInput = encodeFunctionData({
  abi: parseAbi(["function approve(address,uint256) returns(bool)"]),
  functionName: "approve",
  args: ["0xcaf681a66d020601342297493863e78c959e5cb2", 25000000n],
});
const wallet = "0x1111111111111111111111111111111111111111";
test("wallet-first preview connects without signup, reads balances and never sends money", async ({
  page,
  context,
}, info) => {
  await context.addInitScript(
    ({ wallet }) => {
      const listeners: Record<string, Function> = {};
      (window as any).fixtureWalletRequests = [];
      (window as any).ethereum = {
        request: async ({ method }: any) => {
          (window as any).fixtureWalletRequests.push(method);
          if (method === "eth_requestAccounts") return [wallet];
          if (method === "eth_chainId") return "0x1237";
          throw Error("Unexpected wallet request: " + method);
        },
        on: (name: string, fn: Function) => (listeners[name] = fn),
        removeListener: (name: string) => delete listeners[name],
      };
      (window as any).fixtureAccountsChanged = (accounts: string[]) =>
        listeners.accountsChanged?.(accounts);
      (window as any).fixtureChainChanged = (chain: string) =>
        listeners.chainChanged?.(chain);
      (window as any).fixtureDisconnect = () =>
        listeners.disconnect?.({ code: 4900 });
    },
    { wallet },
  );
  let nativeEth = "0xde0b6b3a7640000",
    cashUnits = 100000000n;
  await context.route(
    "https://rpc.mainnet.chain.robinhood.com/",
    async (route) => {
      const body = route.request().postDataJSON();
      const reply = (item: any) => {
        let result: unknown;
        const selector = item.params?.[0]?.data?.slice(0, 10);
        if (item.method === "eth_chainId") result = "0x1237";
        else if (item.method === "eth_estimateGas") result = "0x186a0";
        else if (item.method === "eth_gasPrice") result = "0x989680";
        else if (item.method === "eth_blockNumber") result = "0xb";
        else if (item.method === "eth_getTransactionByHash")
          result = {
            hash: trackedHash,
            from: wallet,
            to: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
            input: trackedInput,
            value: "0x0",
            nonce: "0x7",
            gas: "0x186a0",
            gasPrice: "0x989680",
            blockHash: trackedBlock,
            blockNumber: "0xa",
            transactionIndex: "0x0",
            chainId: "0x1237",
            type: "0x0",
          };
        else if (item.method === "eth_getTransactionReceipt")
          result = {
            transactionHash: trackedHash,
            from: wallet,
            to: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
            status: "0x1",
            blockHash: trackedBlock,
            blockNumber: "0xa",
            transactionIndex: "0x0",
            gasUsed: "0x5208",
            cumulativeGasUsed: "0x5208",
            effectiveGasPrice: "0x989680",
            logs: [],
            logsBloom: `0x${"0".repeat(512)}`,
            contractAddress: null,
            type: "0x0",
          };
        else if (item.method === "eth_getBlockByNumber")
          result = {
            hash: trackedBlock,
            number: "0xa",
            parentHash: trackedHash,
            timestamp: "0x6a000000",
            gasLimit: "0x1000000",
            gasUsed: "0x5208",
            baseFeePerGas: "0x989680",
            transactions: [],
          };
        else if (item.method === "eth_getBalance") result = nativeEth;
        else if (item.method === "eth_getCode") result = "0x6000";
        else if (selector === toFunctionSelector("decimals()"))
          result = encodeAbiParameters([{ type: "uint8" }], [6]);
        else if (selector === toFunctionSelector("allowance(address,address)"))
          result = encodeAbiParameters([{ type: "uint256" }], [0n]);
        else if (
          selector === toFunctionSelector("getPool(address,address,uint24)")
        )
          result = encodeAbiParameters(
            [{ type: "address" }],
            ["0xD60A5d14dB690B7Afad71F76B108071D7175597d"],
          );
        else if (
          selector ===
          toFunctionSelector(
            "quoteExactInputSingle((address,address,uint256,uint24,uint160))",
          )
        )
          result = encodeAbiParameters(
            [
              { type: "uint256" },
              { type: "uint160" },
              { type: "uint32" },
              { type: "uint256" },
            ],
            [35000000000000000n, 1n, 0, 150000n],
          );
        else
          result = encodeAbiParameters(
            [{ type: "uint256" }],
            [
              item.params?.[0]?.to?.toLowerCase() ===
              "0x5fc5360d0400a0fd4f2af552add042d716f1d168"
                ? cashUnits
                : 1000000000000000000n,
            ],
          );
        return { jsonrpc: "2.0", id: item.id, result };
      };
      await route.fulfill({
        json: Array.isArray(body) ? body.map(reply) : reply(body),
      });
    },
  );
  await context.route("**/api/onchain/market", (route) =>
    route.fulfill({
      json: {
        chainId: 4663,
        symbol: "QQQ",
        address: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68",
        cashAddress: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
        bid: "700",
        ask: "701",
        multiplier: "1.1",
        generatedAt: new Date().toISOString(),
        halted: false,
        status: "ASSET_STATUS_ACTIVE",
        transactionsEnabled: false,
      },
    }),
  );
  await context.route("**/api/onchain/quote?*", (route) =>
    route.fulfill({
      json: {
        side: new URL(route.request().url()).searchParams.get("side"),
        amountIn: "25",
        amountOut: "0.035",
        minimumOut: "0.034825",
        fee: 500,
        pool: "0xD60A5d14dB690B7Afad71F76B108071D7175597d",
        blockNumber: "1",
        expiresAt: Date.now() + 90000,
        transactionsEnabled: false,
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".evm-network")).toHaveCount(0);
  await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  await expect(
    page.getByText("100.00 USDG available", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".scene-value")).toHaveText("$770.00");
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByLabel("USDG to spend", { exact: true }).fill("25");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("0.03465 QQQ", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Preview only. Wallet approvals and swaps are disabled.", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("region", { name: "Prepared wallet steps" }),
  ).toBeVisible();

  expect(
    await page.evaluate(() => (window as any).fixtureWalletRequests),
  ).toEqual(["eth_requestAccounts", "eth_chainId"]);

  await expect(
    page.getByText("Technical details", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Price breakdown", { exact: true })).toHaveCount(
    0,
  );

  await page.screenshot({ path: info.outputPath("prepared-wallet-steps.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.screenshot({ path: info.outputPath("evm-wallet-tray.png") });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  await page.locator(".evm-connect button").click();
  await expect(
    page.getByRole("region", { name: "Saved review" }),
  ).toBeVisible();
  await page.getByText("Activity", { exact: true }).click();
  const sibling = await context.newPage();
  await sibling.goto("/");
  await sibling
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await sibling
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  await sibling.locator(".evm-connect button").click();
  await sibling.getByText("Activity", { exact: true }).click();
  const lockName = `blunts:activity:blunts:swap:4663:${wallet.toLowerCase()}`;
  await sibling.evaluate(async (name) => {
    await new Promise<void>((ready) => {
      void navigator.locks.request(name, { mode: "exclusive" }, async () => {
        await new Promise<void>((release) => {
          (window as any).releaseFixtureLock = release;
          ready();
        });
      });
    });
  }, lockName);
  await page.getByText("Recover a wallet request", { exact: true }).click();
  await page.getByLabel("Transaction hash", { exact: true }).fill(trackedHash);
  await page
    .getByRole("button", { name: "Track transaction", exact: true })
    .click();
  await expect
    .poll(async () =>
      page.evaluate(
        async (name) =>
          (await navigator.locks.query()).pending?.some(
            (lock) => lock.name === name,
          ) ?? false,
        lockName,
      ),
    )
    .toBe(true);
  await expect(page.locator(".evm-activity-list li")).toHaveCount(0);
  await sibling.evaluate(() => (window as any).releaseFixtureLock());
  await expect(
    sibling.getByText("Confirmed on Robinhood Chain", { exact: true }),
  ).toBeVisible();
  await expect(sibling.locator(".evm-activity-list li")).toHaveCount(1);
  expect(
    await sibling.evaluate(() => (window as any).fixtureWalletRequests),
  ).toEqual(["eth_requestAccounts", "eth_chainId"]);
  await sibling.close();
  await expect(
    page.getByText("Confirmed on Robinhood Chain", { exact: true }),
  ).toBeVisible();
  await page.getByText("Receipt details", { exact: true }).click();
  await expect(
    page.getByText(
      "Based on this RPC’s block tags. Independent Ethereum batch/finality proof and bank or bridge settlement are not verified.",
      { exact: true },
    ),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download activity", exact: true })
    .click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported.chainId).toBe(4663);
  expect(exported.wallet.toLowerCase()).toBe(wallet.toLowerCase());
  expect(exported.records).toHaveLength(1);
  expect(exported.records[0].hash).toBe(trackedHash);
  expect(exported.records[0].finality.level).toBe("rpc_finalized");
  expect(exported.records[0].finality.transactionHash).toBe(trackedHash);
  await expect(
    page.getByText("RPC reports finalized", { exact: true }),
  ).toBeVisible();
  expect(Object.keys(exported).sort()).toEqual(
    ["version", "chainId", "wallet", "exportedAt", "records"].sort(),
  );
  await expect(
    page.getByRole("button", { name: "Close", exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: info.outputPath("tracked-activity.png") });
  await page.reload();
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  await page.locator(".evm-connect button").click();
  await page.getByText("Activity", { exact: true }).click();
  await expect(
    page.getByText("Confirmed on Robinhood Chain", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".evm-activity-list li")).toHaveCount(1);
  await page.getByText("Receipt details", { exact: true }).click();
  await page
    .getByRole("button", { name: "Check receipt", exact: true })
    .click();
  await expect(page.locator(".evm-activity-list li")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Resume Fill review", exact: true })
    .click();
  await expect(page.getByLabel("USDG to spend", { exact: true })).toHaveValue(
    "25",
  );
  await expect(
    page.getByText("Your saved amount is ready. Continue for a fresh price.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".evm-quote")).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as any).fixtureWalletRequests),
  ).toEqual(["eth_requestAccounts", "eth_chainId"]);
  await page.screenshot({ path: info.outputPath("resumed-review.png") });
  nativeEth = "0x0";
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(
    page.getByText(
      "Add a little ETH on Robinhood Chain to pay the network fee.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(() => (window as any).fixtureWalletRequests),
  ).toEqual(["eth_requestAccounts", "eth_chainId"]);

  await page.getByRole("button", { name: "Close", exact: true }).click();
  cashUnits = 0n;
  nativeEth = "0xde0b6b3a7640000";
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByLabel("USDG to spend", { exact: true }).fill("25");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Not enough USDG in this wallet.",
  );
  await expect(
    page.getByRole("region", { name: "Prepared wallet steps" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as any).fixtureWalletRequests),
  ).toEqual(["eth_requestAccounts", "eth_chainId"]);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(() => {
    (window as any).fixtureAccountsChanged([
      "0x2222222222222222222222222222222222222222",
    ]);
  });
  await page.locator(".evm-connect button").click();
  await expect(page.getByRole("region", { name: "Saved review" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  // A quote requested before a network switch must not return into the sheet.
  let releaseQuote!: () => void;
  let quoteStarted!: () => void;
  const quoteHeld = new Promise<void>((r) => (quoteStarted = r));
  const quoteRelease = new Promise<void>((r) => (releaseQuote = r));
  await page.route("**/api/onchain/quote?*", async (route) => {
    quoteStarted();
    await quoteRelease;
    await route.fulfill({
      json: {
        side: "fill",
        amountIn: "25",
        amountOut: "0.035",
        minimumOut: "0.034825",
        fee: 500,
        pool: wallet,
        blockNumber: "1",
        expiresAt: Date.now() + 90000,
        transactionsEnabled: false,
      },
    });
  });
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByLabel("USDG to spend", { exact: true }).fill("25");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await quoteHeld;
  await page.evaluate(() => (window as any).fixtureChainChanged("0x1"));
  releaseQuote();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".evm-quote")).toHaveCount(0);
  await expect(page.locator(".scene-value")).toHaveText("—");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".evm-connect button").click();
  await expect(
    page.getByText("Your wallet is on chain 1.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Transaction activity" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(() => (window as any).fixtureDisconnect());
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".scene-value")).toHaveText("—");
});

test("wallet walkthrough explains the actual route and keeps preview-only boundaries", async ({
  page,
}) => {
  await page.route("**/api/onchain/market", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Fixture market unavailable" },
    }),
  );
  const boot = await page.goto("/");
  expect(boot?.status()).toBe(200);
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  const walkthrough = page.getByRole("region", {
    name: "How it works walkthrough",
  });
  await expect(
    walkthrough.getByRole("heading", {
      name: "Fill from your wallet.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    walkthrough.getByRole("button", { name: "Back", exact: true }),
  ).toBeDisabled();
  await walkthrough.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    walkthrough.getByRole("heading", {
      name: "10 blunts. One band.",
      exact: true,
    }),
  ).toBeVisible();
  await walkthrough.getByRole("button", { name: "Next", exact: true }).click();
  await expect(walkthrough.getByText(/not direct ownership/)).toBeVisible();
  await walkthrough.getByRole("button", { name: "Next", exact: true }).click();
  await expect(walkthrough.getByText(/exclusion of US persons/)).toBeVisible();
  await walkthrough.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    walkthrough.getByRole("heading", {
      name: "Spark back to USDG.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    walkthrough.getByText(/does not withdraw dollars to a bank/),
  ).toBeVisible();
  await expect(
    walkthrough.getByText("Read-only preview · signing and swaps disabled", {
      exact: true,
    }),
  ).toBeVisible();
  await walkthrough
    .getByRole("button", { name: "Got it", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "How it works", exact: true }),
  ).toBeVisible();
});

test("local no-wallet flow explains mobile handoff without sending localhost to an external wallet", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "ethereum", {
      value: undefined,
      configurable: true,
    });
  });
  await page.route("**/api/onchain/market", (route) =>
    route.fulfill({ status: 503, json: { error: "Fixture offline" } }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await expect(page.getByText(/No browser wallet detected/)).toBeVisible();
  await expect(
    page.getByText(/This localhost preview cannot be opened on another device/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open in MetaMask mobile", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Fill", exact: true }),
  ).toBeVisible();
});

test("public HTTPS mobile handoff contains only the app origin and never starts a wallet transaction", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "ethereum", {
      value: undefined,
      configurable: true,
    }),
  );
  const requested: string[] = [];
  await page.route("https://blunts.example.com/**", async (route) => {
    const url = new URL(route.request().url());
    requested.push(url.pathname);
    if (url.pathname.startsWith("/api/"))
      return route.fulfill({
        status: 503,
        json: { error: "Fixture market offline" },
      });
    const response = await page.request.get(
      `http://localhost:8751${url.pathname}`,
    );
    await route.fulfill({ response });
  });
  await page.goto("https://blunts.example.com/");
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  const handoff = page.getByRole("link", {
    name: "Open in MetaMask mobile",
    exact: true,
  });
  await expect(handoff).toHaveAttribute(
    "href",
    "https://link.metamask.io/dapp/blunts.example.com/",
  );
  await expect(handoff).toHaveAttribute("rel", "noreferrer");
  await expect(page.getByText(/saved reviews stay separate/)).toBeVisible();
  expect(
    requested.every(
      (path) => !path.includes("send") && !path.includes("approve"),
    ),
  ).toBe(true);
  // Do not follow the link: this is route construction proof, not installed-app acceptance.
});

test("a quote for a different amount is rejected before wallet preparation", async ({
  page,
}) => {
  await page.route("**/api/onchain/market", (route) =>
    route.fulfill({
      json: {
        chainId: 4663,
        symbol: "QQQ",
        address: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68",
        cashAddress: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
        bid: "700",
        ask: "701",
        multiplier: "1.1",
        generatedAt: new Date().toISOString(),
        halted: false,
        status: "ASSET_STATUS_ACTIVE",
        transactionsEnabled: true,
      },
    }),
  );
  await page.route("**/api/onchain/quote?*", (route) =>
    route.fulfill({ json: { side: "fill", amountIn: "2" } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByLabel("USDG to spend", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "This price didn't match your amount. Please try again.",
  );
  await expect(
    page.getByRole("region", { name: "Prepared wallet steps" }),
  ).toHaveCount(0);
});
