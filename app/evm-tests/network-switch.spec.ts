import { test, expect } from "@playwright/test";
import { encodeAbiParameters } from "viem";

for (const eventBeforeAck of [true, false])
  test(`network switch loads balances with ${eventBeforeAck ? "an early event" : "no event"}`, async ({
    page,
    context,
  }) => {
    await context.addInitScript(
      ({ eventBeforeAck }) => {
        const listeners: Record<string, (value: any) => void> = {};
        let chain = "0xdef1",
          release!: () => void;
        (window as any).fixtureSwitchDone = () => release();
        (window as any).fixtureDisconnect = () =>
          listeners.disconnect?.(undefined);
        (window as any).fixtureRepeatIdentity = (
          kind: "chain" | "accounts",
        ) => {
          if (kind === "chain") listeners.chainChanged?.(chain);
          else
            listeners.accountsChanged?.([
              "0x1111111111111111111111111111111111111111",
            ]);
        };
        (window as any).ethereum = {
          request: async ({ method }: { method: string }) => {
            if (method === "eth_requestAccounts")
              return ["0x1111111111111111111111111111111111111111"];
            if (method === "eth_chainId") return chain;
            if (method === "wallet_switchEthereumChain") {
              chain = "0x1237";
              if (eventBeforeAck) listeners.chainChanged?.(chain);
              await new Promise<void>((resolve) => {
                release = resolve;
              });
              return null;
            }
            throw Error("Unexpected wallet request: " + method);
          },
          on: (event: string, fn: (value: string) => void) => {
            listeners[event] = fn;
          },
          removeListener: eventBeforeAck
            ? (event: string) => {
                delete listeners[event];
              }
            : undefined,
          off: eventBeforeAck
            ? undefined
            : (event: string) => {
                delete listeners[event];
              },
        };
      },
      { eventBeforeAck },
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
              ? "0xde0b6b3a7640000"
              : encodeAbiParameters(
                  [{ type: "uint256" }],
                  [
                    item.params?.[0]?.to?.toLowerCase() ===
                    "0x5fc5360d0400a0fd4f2af552add042d716f1d168"
                      ? 100000000n
                      : 0n,
                  ],
                ),
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
    await page.getByRole("button", { name: "Close", exact: true }).click();
    if (eventBeforeAck)
      await expect(
        page.getByText("100.00 USDG available", { exact: true }),
      ).toBeVisible();
    await page.evaluate(async () => {
      (window as any).fixtureSwitchDone();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    await expect(
      page.getByText("100.00 USDG available", { exact: true }),
    ).toBeVisible();
    // Real wallets may announce the same chain or account again. Those events
    // invalidate prior reads even though the scalar identity did not change.
    for (const kind of ["chain", "accounts"]) {
      await page.evaluate(async (kind) => {
        (window as any).fixtureRepeatIdentity(kind);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      }, kind);
      await expect(
        page.getByText("100.00 USDG available", { exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByText("Wallet balance unavailable", { exact: true }),
    ).toHaveCount(0);
    await page.evaluate(() => (window as any).fixtureDisconnect());
    await expect(
      page.getByRole("button", { name: "Connect wallet", exact: true }),
    ).toBeVisible();
    await page.evaluate(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      (window as any).fixtureRepeatIdentity("accounts");
    });
    await expect(
      page.getByRole("button", { name: "Connect wallet", exact: true }),
    ).toBeVisible();
  });
