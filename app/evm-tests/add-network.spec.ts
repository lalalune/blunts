import { test, expect } from "@playwright/test";
import { encodeAbiParameters } from "viem";

for (const mode of ["missing", "declined"] as const)
  test(`network setup handles ${mode} without automatic wallet requests`, async ({
    page,
    context,
  }, info) => {
    await context.addInitScript(
      ({ mode }) => {
        let chain = "0x1",
          installed = false,
          adds = 0;
        (window as any).networkRequests = [];
        (window as any).ethereum = {
          request: async (request: { method: string; params?: unknown[] }) => {
            (window as any).networkRequests.push(request);
            if (request.method === "eth_requestAccounts")
              return ["0x1111111111111111111111111111111111111111"];
            if (request.method === "eth_chainId") return chain;
            if (request.method === "wallet_switchEthereumChain") {
              if (mode === "declined")
                throw Object.assign(Error("cancelled"), { code: 4001 });
              if (!installed)
                throw Object.assign(Error("unknown chain"), { code: 4902 });
              chain = "0x1237";
              return null;
            }
            if (request.method === "wallet_addEthereumChain") {
              if (++adds === 1)
                throw Object.assign(Error("cancelled"), { code: 4001 });
              installed = true; // Adding does not imply switching (EIP-3085).
              return null;
            }
            throw Error("Unexpected wallet request: " + request.method);
          },
          on: () => {},
          removeListener: () => {},
        };
      },
      { mode },
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
          multiplier: "1",
          generatedAt: new Date().toISOString(),
          halted: false,
          status: "ASSET_STATUS_ACTIVE",
          transactionsEnabled: false,
        },
      }),
    );
    await context.route(
      "https://rpc.mainnet.chain.robinhood.com/",
      async (route) => {
        const body = route.request().postDataJSON();
        const reply = (item: any) => ({
          jsonrpc: "2.0",
          id: item.id,
          result:
            item.method === "eth_getBalance"
              ? "0x0"
              : encodeAbiParameters([{ type: "uint256" }], [0n]),
        });
        await route.fulfill({
          json: Array.isArray(body) ? body.map(reply) : reply(body),
        });
      },
    );
    await page.goto("/");
    await page
      .getByRole("button", { name: "Connect wallet", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Browser wallet", exact: true })
      .click();
    await page.locator(".evm-connect button").click();
    await page
      .getByRole("button", { name: "Switch to Robinhood Chain", exact: true })
      .click();
    if (mode === "declined") {
      await expect(page.getByRole("alert")).toHaveText(
        "Network switch was cancelled. You can try again.",
      );
      await expect(
        page.getByRole("button", { name: "Add Robinhood Chain", exact: true }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(() =>
          (window as any).networkRequests.map((r: any) => r.method),
        ),
      ).toEqual([
        "eth_requestAccounts",
        "eth_chainId",
        "wallet_switchEthereumChain",
      ]);
      return;
    }
    const add = page.getByRole("button", {
      name: "Add Robinhood Chain",
      exact: true,
    });
    await expect(add).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Robinhood Chain network details" }),
    ).toContainText("https://rpc.mainnet.chain.robinhood.com");
    expect(
      await page.evaluate(() =>
        (window as any).networkRequests.map((r: any) => r.method),
      ),
    ).toEqual([
      "eth_requestAccounts",
      "eth_chainId",
      "wallet_switchEthereumChain",
    ]);
    await page.screenshot({ path: info.outputPath("missing-network.png") });
    expect(
      await page
        .locator("dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await add.click();
    await expect(page.getByRole("alert")).toHaveText(
      "Network addition was cancelled. You can try again.",
    );
    await expect(add).toBeEnabled();
    expect(
      await page.evaluate(() =>
        (window as any).networkRequests.filter(
          (r: any) => r.method === "wallet_addEthereumChain",
        ),
      ),
    ).toEqual([
      {
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x1237",
            chainName: "Robinhood Chain",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
            blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
          },
        ],
      },
    ]);
    await add.click();
    await expect(page.getByRole("status")).toHaveText(
      "Network added. Switch to Robinhood Chain to continue.",
    );
    await expect(
      page.getByText("Your wallet is on chain 1.", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (window as any).networkRequests.filter(
            (r: any) => r.method === "wallet_switchEthereumChain",
          ).length,
      ),
    ).toBe(1);
    await page
      .getByRole("button", { name: "Switch to Robinhood Chain", exact: true })
      .click();
    await expect(
      page.getByText("Connected to Robinhood Chain.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(
      page.getByText("0.00 USDG available", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        (window as any).networkRequests.map((r: any) => r.method),
      ),
    ).toEqual([
      "eth_requestAccounts",
      "eth_chainId",
      "wallet_switchEthereumChain",
      "wallet_addEthereumChain",
      "wallet_addEthereumChain",
      "eth_chainId",
      "wallet_switchEthereumChain",
      "eth_chainId",
    ]);
  });
