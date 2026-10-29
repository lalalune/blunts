import { test, expect, type BrowserContext } from "@playwright/test";
import {
  Keypair,
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
} from "@solana/web3.js";
import { createHash } from "node:crypto";
import bs58 from "bs58";
import { solanaAmount, solanaRawFromDisplay } from "../shared/solana.js";
import { formatUnits } from "viem";

async function fixture(context: BrowserContext, mode = "normal") {
  const holder = Keypair.generate(),
    owner = holder.publicKey.toBase58();
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
  const messageHash = createHash("sha256")
      .update(tx.message.serialize())
      .digest("hex"),
    wire = Buffer.from(tx.serialize()).toString("base64");
  tx.sign([holder]);
  const signed = [...tx.serialize()];
  const tx2 = new VersionedTransaction(
    new TransactionMessage({
      payerKey: holder.publicKey,
      recentBlockhash: Keypair.generate().publicKey.toBase58(),
      instructions: [
        SystemProgram.transfer({
          fromPubkey: holder.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 2,
        }),
      ],
    }).compileToV0Message(),
  );
  const wire2 = Buffer.from(tx2.serialize()).toString("base64"),
    hash2 = createHash("sha256").update(tx2.message.serialize()).digest("hex");
  tx2.sign([holder]);
  const signedByWire: Record<string, number[]> = {
    [wire]: signed,
    [wire2]: [...tx2.serialize()],
  };
  let cash = "25000000",
    stock = mode === "partial" ? "137639" : "0",
    submits = 0,
    side = "fill",
    receipts = 0,
    lastAmount = "";
  await context.addInitScript(
    ({ owner, publicKey, signedByWire, mode }) => {
      const account = {
        address: owner,
        publicKey: Uint8Array.from(publicKey),
        chains: ["solana:mainnet"],
        features: ["solana:signTransaction"],
      };
      const wallet = {
        version: "1.0.0",
        name: "Fixture wallet",
        icon: "data:image/svg+xml,%3Csvg/%3E",
        chains: ["solana:mainnet"],
        accounts: [account],
        features: {
          "standard:connect": {
            version: "1.0.0",
            connect: async () => ({ accounts: [account] }),
          },
          "standard:events": { version: "1.0.0", on: () => () => {} },
          "standard:disconnect": {
            version: "1.0.0",
            disconnect: async () => {},
          },
          "solana:signTransaction": {
            version: "1.0.0",
            supportedTransactionVersions: [0],
            signTransaction: async (input: any) => {
              if (mode === "decline") throw Error("You declined this trade.");
              const encoded = btoa(String.fromCharCode(...input.transaction));
              const bytes = Uint8Array.from(signedByWire[encoded]);
              if (mode === "mutation") bytes[bytes.length - 1] ^= 1;
              return [{ signedTransaction: bytes }];
            },
          },
        },
      };
      window.addEventListener("wallet-standard:app-ready", (event: any) =>
        event.detail.register(wallet),
      );
    },
    { owner, publicKey: [...holder.publicKey.toBytes()], signedByWire, mode },
  );
  await context.route("**/api/solana/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname.split("/").at(-1);
    let result: unknown = {};
    if (path === "market") result = { price: 716, multiplier: 1.003456 };
    if (path === "balances") result = { cash, stock, native: 100000000 };
    if (path === "prepare") {
      if (mode === "insufficient") {
        await route.fulfill({
          status: 400,
          json: { error: "Add USDC to your wallet first." },
        });
        return;
      }
      const body = route.request().postDataJSON();
      lastAmount = body.amount;
      side = body.side;
      result = {
        id: crypto.randomUUID(),
        owner,
        side,
        inAmount:
          side === "fill" ? "1000000" : String(solanaAmount(body.amount, 8)),
        outAmount: side === "fill" ? "137639" : "979697",
        minimumOut: side === "fill" ? "136951" : "974799",
        multiplier: 1.003456,
        nativeCost: 2500000,
        transaction: side === "fill" ? wire : wire2,
        messageHash: side === "fill" ? messageHash : hash2,
        lastValidBlockHeight: 440000000,
        expiresAt: Date.now() + (mode === "expired" ? 1000 : 45000),
      };
    }
    if (path === "submit") {
      submits++;
      receipts = 0;
      if (mode === "unknown") {
        await route.abort();
        return;
      }
      const submitted = VersionedTransaction.deserialize(
        Buffer.from(route.request().postDataJSON().transaction, "base64"),
      );
      result = { signature: bs58.encode(submitted.signatures[0]) };
    }
    if (path === "receipt") {
      receipts++;
      const complete = mode !== "unknown" && receipts >= 2;
      if (complete) {
        cash = side === "fill" ? "24000000" : "24979697";
        stock = side === "fill" ? "137639" : "0";
      }
      result = { state: complete ? "complete" : "pending" };
    }
    await route.fulfill({ json: result });
  });
  return {
    owner,
    get lastAmount() {
      return lastAmount;
    },
    get submits() {
      return submits;
    },
  };
}
async function connect(page: any) {
  await page.goto("/sol");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await page
    .getByRole("button", { name: "Fixture wallet", exact: true })
    .click();
}
test("partial Spark converts scaled display units without overspending and can restore Sell all", async ({
  page,
  context,
}) => {
  const f = await fixture(context, "partial");
  await connect(page);
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  await page.getByRole("button", { name: "Choose amount" }).click();
  await page.getByLabel("QQQx to sell").fill("0.0005");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Review your Spark." }),
  ).toBeVisible();
  expect(f.lastAmount).toBe(
    formatUnits(solanaRawFromDisplay("0.0005", 1.003456), 8),
  );
  expect(f.submits).toBe(0);
  await page.getByRole("button", { name: "Change amount" }).click();
  await page.getByRole("button", { name: "Sell all", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Review your Spark." }),
  ).toBeVisible();
  expect(f.lastAmount).toBe("0.00137639");
});
test("Fill and Spark complete automatically with the same game and concise review", async ({
  page,
  context,
}, info) => {
  const f = await fixture(context);
  await connect(page);
  await expect(page.getByText("25 USDC available")).toBeVisible();
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Review your Fill." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Fill", exact: true }).last(),
  ).toBeDisabled();
  await expect(page.getByText(/1% fee included/)).toBeVisible();
  await expect(
    page.getByText(/Price breakdown|Robinhood Chain|Check status/),
  ).toHaveCount(0);
  await page.screenshot({
    path: `data/review-20261028/mainnet-acceptance/solana-${info.project.name}-review.png`,
  });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Fill", exact: true }).last().click();
  await expect(
    page.getByRole("heading", { name: "Fill complete." }),
  ).toBeVisible({ timeout: 18000 });
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("24 USDC available")).toBeVisible();
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Spark", exact: true }).last().click();
  await expect(
    page.getByRole("heading", { name: "Spark complete." }),
  ).toBeVisible({ timeout: 18000 });
  expect(f.submits).toBe(2);
});
for (const mode of [
  "decline",
  "mutation",
  "insufficient",
  "expired",
  "unknown",
]) {
  test(`${mode} preserves funds and prevents unsafe retries`, async ({
    page,
    context,
  }) => {
    const f = await fixture(context, mode);
    await connect(page);
    await page.getByRole("button", { name: "Fill", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    if (mode === "insufficient") {
      await expect(page.getByRole("alert")).toContainText("Add USDC");
      expect(f.submits).toBe(0);
      return;
    }
    if (mode === "expired") {
      await expect(
        page.getByRole("button", { name: "Update price" }),
      ).toBeVisible({ timeout: 4000 });
      expect(f.submits).toBe(0);
      return;
    }
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Fill", exact: true })
      .last()
      .click();
    if (mode === "unknown") {
      await expect(page.getByRole("alert")).toContainText("Still checking");
      await page.reload();
      await page.getByRole("button", { name: "Connect wallet" }).click();
      await page
        .getByRole("button", { name: "Fixture wallet", exact: true })
        .click();
      await page.getByRole("button", { name: "Fill", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Continue", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByText(/previous trade needs confirmation/),
      ).toBeVisible();
      expect(f.submits).toBe(1);
    } else {
      await expect(
        page.getByText("Nothing was sent.", { exact: true }),
      ).toBeVisible();
      expect(f.submits).toBe(0);
    }
  });
}
