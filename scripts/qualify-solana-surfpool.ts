import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Surfnet } from "@solana/surfpool";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import { solanaAssets } from "../app/shared/solana.js";
import { chromium, expect, type Browser, type Page } from "@playwright/test";
import type { FastifyInstance } from "fastify";

// All signatures belong to a newly generated disposable wallet. Only the
// native Surfnet's loopback RPC can receive transactions; mainnet is read-only.
const gameCheck = process.argv.includes("--game");
const fundedUSDC = gameCheck ? 2500000000 : 25000000;
const outputRoot = resolve(
  "data/review-20261029/surfpool",
  gameCheck ? "game" : ".",
);
const output = resolve(outputRoot, "runs", String(Date.now()));
mkdirSync(output, { recursive: true });
const holder = Keypair.generate();
const surf = Surfnet.startWithConfig({
  remoteRpcUrl: "https://api.mainnet-beta.solana.com",
  payerSecretKey: holder.secretKey,
  blockProductionMode: "clock",
  slotTimeMs: 400,
});
const rpc = new URL(surf.rpcUrl);
assert.equal(rpc.hostname, "127.0.0.1");
assert.equal(rpc.protocol, "http:");
process.env.SOLANA_RPC_URL = surf.rpcUrl;
const record: Record<string, unknown> = {
  scope: "local mainnet fork only; no real money",
  startedAt: new Date().toISOString(),
  holder: holder.publicKey.toBase58(),
  rpc: surf.rpcUrl,
  upstream: "https://api.mainnet-beta.solana.com",
  surfpoolVersion: "1.7.0",
  stages: [],
};
const save = () =>
  writeFileSync(
    resolve(output, "round-trip.json"),
    JSON.stringify(record, null, 2) + "\n",
    { mode: 0o600 },
  );
const stage = (name: string) => {
  (record.stages as unknown[]).push({ name, at: new Date().toISOString() });
  save();
  console.log(name);
};
let browser: Browser | undefined,
  httpApp: FastifyInstance | undefined,
  page: Page | undefined;
try {
  stage("local runtime started");
  surf.fundToken(
    holder.publicKey.toBase58(),
    solanaAssets.cash.mint,
    fundedUSDC,
  );
  stage(
    `disposable wallet funded with local-only SOL and ${fundedUSDC / 1e6} USDC`,
  );
  const app = await import("../app/server/solana.js");
  assert.equal(app.solanaConnection.rpcEndpoint, surf.rpcUrl);
  record.before = await app.solanaBalances(holder.publicKey.toBase58());
  save();
  const execute = async (side: "fill" | "spark", amount: bigint) => {
    stage(`preparing ${side}`);
    const review = await app.prepareSolana(
      holder.publicKey.toBase58(),
      side,
      amount,
    );
    writeFileSync(
      resolve(output, `${side}-review.json`),
      JSON.stringify(review, null, 2) + "\n",
      { mode: 0o600 },
    );
    stage(`${side} passed production preparation and simulation`);
    const tx = VersionedTransaction.deserialize(
      Buffer.from(review.transaction, "base64"),
    );
    tx.sign([holder]);
    assert.equal(app.solanaConnection.rpcEndpoint, surf.rpcUrl);
    const result = await app.submitSolana(
      review.id,
      Buffer.from(tx.serialize()).toString("base64"),
    );
    if (typeof result.signature !== "string")
      throw Error("error" in result ? result.error : "No signature returned");
    const signature = result.signature;
    stage(`${side} signed and submitted only to Surfnet`);
    let receipt: Awaited<ReturnType<typeof app.solanaReceipt>> | undefined;
    for (let n = 0; n < 45; n++) {
      receipt = await app.solanaReceipt(signature, review.messageHash);
      if (receipt.state !== "pending") break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    assert.equal(receipt?.state, "complete");
    record[side] = { signature, receipt };
    save();
    const full = await app.solanaConnection.getTransaction(signature, {
      commitment: "finalized",
      maxSupportedTransactionVersion: 0,
    });
    writeFileSync(
      resolve(output, `${side}-receipt.json`),
      JSON.stringify(full, null, 2) + "\n",
      { mode: 0o600 },
    );
    stage(`${side} finalized with exact balance and fee verification`);
    return receipt;
  };
  await execute("fill", 1000000n);
  record.afterFill = await app.solanaBalances(holder.publicKey.toBase58());
  save();
  const stock = BigInt((record.afterFill as { stock: string }).stock);
  assert.ok(stock > 0n);
  await execute("spark", stock);
  let after = await app.solanaBalances(holder.publicKey.toBase58());
  assert.equal(after.stock, "0");
  assert.ok(BigInt(after.cash) > BigInt(fundedUSDC) - 1000000n);
  assert.ok(BigInt(after.cash) < BigInt(fundedUSDC));
  if (process.argv.includes("--browser")) {
    stage("starting isolated browser against real fork HTTP service");
    const { createSolanaApp } = await import("../app/server/solana-app.js");
    httpApp = await createSolanaApp();
    const httpOrigin = await httpApp.listen({ host: "127.0.0.1", port: 0 });
    assert.equal(new URL(httpOrigin).hostname, "127.0.0.1");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: "reduce",
    });
    const calls: { path: string; status: number }[] = [];
    // Transport bridge only: every page/API response comes from the real
    // Fastify app using Surfnet. No prices, balances or receipts are mocked.
    await context.route("http://localhost:8753/**", async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        headers = { ...request.headers() };
      delete headers.host;
      const response = await context.request.fetch(
        httpOrigin + url.pathname + url.search,
        {
          method: request.method(),
          headers,
          data: request.postDataBuffer() ?? undefined,
        },
      );
      if (url.pathname.startsWith("/api/"))
        calls.push({ path: url.pathname, status: response.status() });
      await route.fulfill({ response });
    });
    await context.exposeBinding(
      "signDisposableSurfnetTransaction",
      async (_, bytes: number[]) => {
        assert.equal(app.solanaConnection.rpcEndpoint, surf.rpcUrl);
        const tx = VersionedTransaction.deserialize(Uint8Array.from(bytes));
        assert.equal(
          tx.message.staticAccountKeys[0].toBase58(),
          holder.publicKey.toBase58(),
        );
        assert.equal(
          (
            await app.solanaConnection.isBlockhashValid(
              tx.message.recentBlockhash,
            )
          ).value,
          true,
        );
        tx.sign([holder]);
        return [...tx.serialize()];
      },
    );
    await context.addInitScript(`(() => {
      const address = ${JSON.stringify(holder.publicKey.toBase58())};
      const publicKey = Uint8Array.from(${JSON.stringify([...holder.publicKey.toBytes()])});
      const account={address,publicKey,chains:["solana:mainnet"],features:["solana:signTransaction"]};
      const wallet={version:"1.0.0",name:"Disposable Surfpool wallet",icon:"data:image/svg+xml,%3Csvg/%3E",chains:["solana:mainnet"],accounts:[account],features:{
        "standard:connect":{version:"1.0.0",connect:async()=>({accounts:[account]})},
        "standard:events":{version:"1.0.0",on:()=>()=>{}},
        "solana:signTransaction":{version:"1.0.0",supportedTransactionVersions:[0],signTransaction:async(input)=>[{signedTransaction:Uint8Array.from(await window.signDisposableSurfnetTransaction([...input.transaction]))}]}
      }};
      window.addEventListener("wallet-standard:app-ready",event=>event.detail.register(wallet));
    })();`);
    page = await context.newPage();
    page.on("pageerror", (e) => {
      console.error("Browser error:", e.message);
    });
    await page.goto("http://localhost:8753/sol");
    await page.getByRole("button", { name: "Connect wallet" }).click();
    await page
      .getByRole("button", { name: "Disposable Surfpool wallet", exact: true })
      .click();
    await expect(page.getByText(/USDC available/)).toBeVisible();
    for (const side of ["fill", "spark"] as const) {
      const title = side === "fill" ? "Fill" : "Spark";
      await page.getByRole("button", { name: title, exact: true }).click();
      if (gameCheck && side === "fill")
        await page.getByLabel("USDC to spend", { exact: true }).fill("1030");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: `Review your ${title}.` }),
      ).toBeVisible({ timeout: 30000 });
      await page.screenshot({
        path: resolve(output, `browser-${side}-review.png`),
      });
      await page.getByRole("checkbox").check();
      await page
        .getByRole("button", { name: title, exact: true })
        .last()
        .click();
      await expect(
        page.getByRole("heading", { name: `${title} complete.` }),
      ).toBeVisible({ timeout: 45000 });
      await page.screenshot({
        path: resolve(output, `browser-${side}-complete.png`),
      });
      stage(`real browser ${side} completed on Surfnet`);
      const activity = await page.evaluate(() =>
        JSON.parse(
          localStorage.getItem("blunts:solana:mainnet:activity:v1") || "[]",
        ),
      );
      // This is the disposable isolated context's journal, never personal Chrome.
      writeFileSync(
        resolve(output, "browser-activity.json"),
        JSON.stringify(activity, null, 2) + "\n",
        { mode: 0o600 },
      );
      const latest = activity.at(-1);
      record[`browser${title}`] = await app.solanaReceipt(
        latest.signature,
        latest.messageHash,
      );
      save();
      await page.getByRole("button", { name: "Done", exact: true }).click();
      if (side === "fill")
        await expect
          .poll(async () => {
            const b = await app.solanaBalances(holder.publicKey.toBase58());
            return BigInt(b.stock) > 0n;
          })
          .toBe(true);
      if (gameCheck && side === "fill") {
        await expect(page.getByText("10 rolled", { exact: true })).toBeVisible({
          timeout: 10000,
        });
        await expect(page.getByText("1 band", { exact: true })).toBeVisible();
        await page.screenshot({
          path: resolve(output, "browser-one-band.png"),
        });
        record.game = {
          rolled: 10,
          bands: 1,
          actualStash: await app.solanaBalances(holder.publicKey.toBase58()),
        };
        save();
        stage("real fork holding rendered ten blunts and one band");
      }
    }
    record.browserHttpCalls = calls;
    record.browserComplete = true;
    after = await app.solanaBalances(holder.publicKey.toBase58());
    assert.equal(after.stock, "0");
    await browser.close();
    browser = undefined;
    await httpApp.close();
    httpApp = undefined;
  }
  record.after = after;
  record.complete = true;
  record.finishedAt = new Date().toISOString();
  save();
  writeFileSync(
    resolve(outputRoot, "latest-success.json"),
    JSON.stringify({ evidenceDirectory: output, ...record }, null, 2) + "\n",
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      complete: true,
      holder: holder.publicKey.toBase58(),
      before: record.before,
      after,
    }),
  );
} catch (error) {
  record.complete = false;
  record.error = (error as Error).message;
  record.events = surf.drainEvents();
  if (page)
    record.browserErrorText = await page
      .locator("body")
      .innerText()
      .catch(() => "Unavailable");
  save();
  console.error((error as Error).stack);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await httpApp?.close();
  surf.stop();
}
