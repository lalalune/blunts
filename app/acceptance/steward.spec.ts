import { randomUUID, createHmac } from "node:crypto";
import { test, expect } from "@playwright/test";
import { localProviderKeys } from "./provider-fixture";
import { setTimeout as backoff } from "node:timers/promises";

test("real local Steward signs in, provisions a wallet and completes the demo cycle without owner input", async ({
  page,
}, testInfo) => {
  const issuer = new URL(
    process.env.TEST_STEWARD_URL ?? "http://127.0.0.1:8743",
  ).origin;
  const email = `blunts-browser-${randomUUID()}@example.test`;
  const inboxUrl = `${issuer}/auth/test/inbox/${encodeURIComponent(email)}`;
  // Prove the test-only mock inbox is enabled BEFORE requesting any email.
  // A disabled route also returns 404, but its body is "Not found".
  const probe = await page.request.get(inboxUrl);
  expect(probe.status()).toBe(404);
  expect(await probe.json()).toEqual({ ok: false, error: "No message" });
  await page.clock.install();
  await page.goto("/");
  expect(
    (await (await page.request.get("/api/auth/config")).json()).provider,
  ).toBe("steward");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Continue with Steward", exact: true })
    .click();
  const codeField = page.getByLabel("Email code", { exact: true });
  await expect(codeField).toBeFocused();
  await page.clock.fastForward(60_001);
  await page
    .getByRole("button", { name: "Resend email code", exact: true })
    .click();
  await expect(codeField).toBeFocused();
  async function enterLocalCode() {
    const response = await page.request.get(inboxUrl);
    expect(response.status()).toBe(200);
    const message = await response.json();
    expect(message.to).toBe(email);
    const code = message.text.match(/\b(\d{6})\b/)?.[1];
    expect(code).toBeTruthy();
    await page.getByLabel("Email code", { exact: true }).fill(code);
    await page
      .getByRole("button", { name: "Open wallet", exact: true })
      .click();
  }
  await enterLocalCode();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Open wallet", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Fill", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "WALLET", exact: true }).click();
  const signedIn = await (await page.request.get("/api/me")).json();
  expect(signedIn.steward.userId).toBeTruthy();
  if (!signedIn.steward.wallet)
    await page
      .getByRole("button", { name: "Create Steward wallet", exact: true })
      .click();
  await expect(page.locator("code.recovery")).toHaveText(/^0x[0-9a-fA-F]{40}$/);
  const wallet = await page.locator("code.recovery").innerText();
  await page.screenshot({
    path: testInfo.outputPath("first-party-wallet.png"),
  });
  // Exercise the actual main-process sandbox route with real first-party auth.
  // URL construction and synthetic signed callbacks make NO provider calls.
  const state = await (await page.request.get("/api/me")).json();
  const commandId = randomUUID();
  const headers = {
    Origin: "http://localhost:8750",
    "X-Blunts-Request": "1",
    "X-CSRF-Token": state.csrf,
    "Idempotency-Key": commandId,
  };
  const checkout = await page.request.post("/api/providers/sandbox/moonpay", {
    headers,
    data: { side: "buy", amount: "100" },
  });
  expect(checkout.status()).toBe(200);
  const draft = await checkout.json();
  expect(draft.creditsAppBalance).toBe(false);
  const checkoutUrl = new URL(draft.artifact.checkoutUrl);
  expect(checkoutUrl.searchParams.get("walletAddress")).toBe(wallet);
  expect(checkoutUrl.searchParams.get("apiKey")).toBe(
    localProviderKeys.publishableKey,
  );
  const timestamp = Math.floor(Date.now() / 1000);
  const raw = JSON.stringify({
    type: "transaction_updated",
    data: {
      id: randomUUID(),
      externalTransactionId: commandId,
      updatedAt: new Date().toISOString(),
      status: "completed",
    },
  });
  const signature = `t=${timestamp},s=${createHmac("sha256", localProviderKeys.webhookKey).update(`${timestamp}.${raw}`).digest("hex")}`;
  const callback = await page.request.post("/provider-hooks/moonpay", {
    headers: {
      "Content-Type": "application/json",
      "Moonpay-Signature-V2": signature,
    },
    data: raw,
  });
  expect(callback.status()).toBe(202);
  const replay = await page.request.post("/provider-hooks/moonpay", {
    headers: {
      "Content-Type": "application/json",
      "Moonpay-Signature-V2": signature,
    },
    data: raw,
  });
  expect((await replay.json()).inserted).toBe(false);
  const retry = await page.request.post("/api/providers/sandbox/moonpay", {
    headers,
    data: { side: "buy", amount: "100" },
  });
  expect((await retry.json()).state).toBe("artifact_ready");
  const stillEmpty = await (await page.request.get("/api/me")).json();
  expect(stillEmpty.balances.cash).toBe("0");
  expect(stillEmpty.intents).toHaveLength(0);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Fill", exact: true }),
  ).toBeEnabled();
  async function action(kind: "Fill" | "Spark", amount: string) {
    await page.getByRole("button", { name: kind, exact: true }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Dollars", exact: true }).click();
    await sheet.getByLabel("Amount in dollars").fill(amount);
    await sheet
      .getByRole("button", { name: kind.toUpperCase(), exact: true })
      .click();
    await expect(sheet).not.toBeVisible();
  }
  await action("Fill", "100");
  try {
    await expect(page.locator(".scene-value")).toHaveText("$99.00");
  } catch (error) {
    // Multiple test users share one loopback IP. Respect a genuine issuer 429;
    // do not disable its limits or generate a new money instruction to retry.
    if (
      !(await page
        .getByRole("alert")
        .filter({ hasText: "Steward is busy." })
        .isVisible())
    )
      throw error;
    testInfo.annotations.push({
      type: "issuer-rate-limit",
      description:
        "One 60-second backoff, then reload/recover the saved Fill idempotency key.",
    });
    await backoff(60_000);
    await page.reload();
    await expect(page.locator(".scene-value")).toHaveText("$99.00");
  }
  await expect(
    page.getByRole("button", { name: "Spark", exact: true }),
  ).toBeEnabled();
  await action("Spark", "99");
  await expect(page.locator(".scene-cash strong")).toHaveText("$98.01");
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  await page
    .getByRole("button", { name: "Add test destination", exact: true })
    .click();
  await page
    .getByLabel("Destination label")
    .fill("Autonomous local acceptance");
  await expect(
    page.getByLabel("Confirm password", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Save test destination", exact: true })
    .click();
  await expect(
    page.getByText("Simulated destination added.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Wallet", exact: true }).click();
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  const payout = page.getByRole("dialog", { name: "Cash out", exact: true });
  await expect(payout.getByLabel("Confirm password")).toHaveCount(0);
  await payout
    .getByRole("button", { name: "Cash out demo funds", exact: true })
    .click();
  await expect(payout).not.toBeVisible();
  await expect(page.locator(".scene-cash strong")).toHaveText("$0.00");
  // The tray shows AVAILABLE cash: a pending payout can display zero while
  // funds are still reserved. Require authoritative settlement, not animation.
  await expect
    .poll(async () => {
      const state = await (await page.request.get("/api/me")).json();
      return {
        cash: state.balances.cash,
        units: state.balances.units,
        completed: state.intents.filter(
          (intent: { state: string }) => intent.state === "completed",
        ).length,
      };
    })
    .toEqual({ cash: "0", units: "0", completed: 4 });
  const me = await (await page.request.get("/api/me")).json();
  expect(me.simulation).toBe(true);
  expect(me.balances.cash).toBe("0");
  expect(me.balances.units).toBe("0");
  expect(me.intents).toHaveLength(4);
  expect(
    me.intents.every(
      (intent: { state: string }) => intent.state === "completed",
    ),
  ).toBe(true);
  expect(me.steward.wallet.address).toBe(wallet);
  await page.screenshot({
    path: testInfo.outputPath("first-party-zero-balance.png"),
  });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "WALLET", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Continue with Steward", exact: true })
    .click();
  await expect(codeField).toBeVisible();
  await enterLocalCode();
  await expect(
    page.getByRole("button", { name: "Fill", exact: true }),
  ).toBeEnabled();
  const restored = await (await page.request.get("/api/me")).json();
  expect(restored.steward.wallet.address).toBe(wallet);
  expect(me.steward.userId).toBeTruthy();
  expect(restored.steward.userId).toBe(me.steward.userId);
  expect(restored.handle).toBe(me.handle);
  expect(restored.intents).toHaveLength(4);
});
