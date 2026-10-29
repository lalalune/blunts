import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("original five-step walkthrough explains fees, demo ownership and cash-out", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "HOW IT WORKS", exact: true }).click();
  const walkthrough = page.getByRole("region", {
    name: "How it works walkthrough",
  });
  await expect(
    walkthrough.getByRole("heading", { name: "Fill it up.", exact: true }),
  ).toBeVisible();
  await expect(
    walkthrough.getByRole("button", { name: "Back", exact: true }),
  ).toBeDisabled();
  await expect(walkthrough).toContainText("$24.75 invested");
  await walkthrough.focus();
  await page.keyboard.press("ArrowRight");
  await expect(walkthrough).toContainText("10 blunts. One band.");
  await page.keyboard.press("ArrowLeft");
  await expect(walkthrough).toContainText("Fill it up.");
  const art = await walkthrough.locator(".how-art").boundingBox();
  expect(art).not.toBeNull();
  await page.mouse.move(art!.x + art!.width - 24, art!.y + art!.height / 2);
  await page.mouse.down();
  await page.mouse.move(art!.x + 24, art!.y + art!.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(walkthrough).toContainText("10 blunts. One band.");
  await walkthrough.getByRole("button", { name: "Back", exact: true }).click();
  await walkthrough.getByRole("button", { name: "Next", exact: true }).click();
  await walkthrough.getByRole("button", { name: "Next", exact: true }).click();
  await expect(walkthrough).toContainText("not real ETF shares");
  await walkthrough.getByText("What is an ETF?", { exact: true }).click();
  await expect(
    walkthrough.getByText("Blunts does not currently buy that security.", {
      exact: false,
    }),
  ).toBeVisible();
  await walkthrough.getByRole("button", { name: "Next", exact: true }).click();
  await expect(walkthrough).toContainText("Real investments can lose value");
  await walkthrough.getByRole("button", { name: "Next", exact: true }).click();
  await expect(walkthrough).toContainText("press Spark again to cash out");
  await expect(walkthrough).toContainText("5 of 5");
  const scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("how-it-works.png") });
  await walkthrough
    .getByRole("button", { name: "Got it", exact: true })
    .click();
  await expect(walkthrough).not.toBeVisible();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "HOW IT WORKS", exact: true }).click();
  await expect(walkthrough).toContainText("1 of 5");
});

async function signup(page: Page) {
  await page.goto("/");
  await page
    .getByLabel("Handle", { exact: true })
    .fill(`u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password");
  await page
    .getByRole("button", { name: "Create wallet", exact: true })
    .click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("button", { name: "Open wallet" }).click();
  await expect(
    page.getByRole("button", { name: "Fill", exact: true }),
  ).toBeVisible();
}
async function act(
  page: Page,
  kind: "Fill" | "Spark",
  amount: string,
  all = false,
) {
  await page.getByRole("button", { name: kind, exact: true }).click();
  const sheet = page.getByRole("dialog");
  if (all)
    await sheet
      .getByRole("button", { name: "Sell all available units" })
      .click();
  else {
    await sheet.getByRole("button", { name: "Dollars", exact: true }).click();
    await sheet.getByLabel("Amount in dollars").fill(amount);
  }
  await sheet
    .getByRole("button", { name: kind.toUpperCase(), exact: true })
    .click();
  await expect(sheet).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm", exact: true }),
  ).toHaveCount(0);
}
test("one press fills and sparks without confirmations and survives reload", async ({
  page,
}, testInfo) => {
  await signup(page);
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await page.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.locator(".picker-value")).toHaveText("$50");
  await page.getByRole("button", { name: "Less", exact: true }).click();
  await expect(page.locator(".blunt-selection strong")).toHaveText("¼");
  await expect(
    page.getByRole("button", { name: "Close transaction" }),
  ).toHaveCount(0);
  await expect(page.getByText("Options", { exact: true })).toHaveCount(0);
  await page.locator(".picker-value").click();
  await expect(sheet).toBeVisible();
  const scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("fill-sheet.png") });
  await page.mouse.click(8, 8);
  await expect(sheet).not.toBeVisible();
  await act(page, "Fill", "2000");
  await page.reload();
  await expect(page.locator(".scene-value")).toHaveText("$1,980.00");
  await expect(
    page.getByRole("button", { name: "Spark", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByLabel("Blunts rolled: 19", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Bands: 1", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("funded-wallet.png") });
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  await page.mouse.click(8, 8);
  await expect(sheet).not.toBeVisible();
  await act(page, "Spark", "1980", true);
  await expect(page.locator(".scene-value")).toHaveText("$0.00");
  await expect(page.locator(".scene-cash strong")).toHaveText("$1,960.20");
  await page.reload();
  await expect(page.locator(".scene-cash strong")).toHaveText("$1,960.20");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "HISTORY", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download statement" }).click();
  expect((await download).suggestedFilename()).toBe(
    "blunts-sandbox-statement.json",
  );
});
test("lost Fill response retries the same authorized instruction after reload", async ({
  page,
}) => {
  await signup(page);
  const keys: string[] = [];
  await page.route("**/api/flows", async (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    if (keys.length === 1) {
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await act(page, "Fill", "100");
  await expect(
    page.getByRole("button", { name: "Retry pending action" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".scene-value")).toHaveText("$99.00");
  await expect(
    page.getByRole("button", { name: "Spark", exact: true }),
  ).toBeEnabled();
  expect(keys.length).toBeGreaterThanOrEqual(2);
  expect(new Set(keys).size).toBe(1);
  const me = await (await page.request.get("/api/me")).json();
  expect(me.flows).toHaveLength(1);
  expect(me.intents).toHaveLength(2);
});
test("a timed-out Fill preserves the accepted instruction instead of creating another", async ({
  page,
}) => {
  await page.clock.install();
  await signup(page);
  const keys: string[] = [];
  let accepted!: () => void;
  const firstAccepted = new Promise<void>((resolve) => {
    accepted = resolve;
  });
  await page.route("**/api/flows", async (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    if (keys.length === 1) {
      await route.fetch();
      accepted();
      // The server accepted the instruction, but its response never arrives.
      // The actual browser fetch must reach its timeout without any auto-retry.
      return;
    }
    await route.continue();
  });
  await act(page, "Fill", "100");
  await firstAccepted;
  await page.clock.fastForward(20_001);
  await expect(page.getByRole("alert")).toContainText("The request timed out");
  expect(keys).toHaveLength(1);
  await page.reload();
  await expect(page.locator(".scene-value")).toHaveText("$99.00");
  expect(keys.length).toBeGreaterThanOrEqual(2);
  expect(new Set(keys).size).toBe(1);
  const me = await (await page.request.get("/api/me")).json();
  expect(me.flows).toHaveLength(1);
  expect(me.intents).toHaveLength(2);
});

test("setup overlays the tray and backup lives in help", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("dialog", { name: "Wallet setup" }),
  ).toBeVisible();
  await expect(page.locator(".tray-scene canvas").first()).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "WALLET", exact: true }).click();
  await page
    .getByRole("button", { name: "Recover wallet", exact: true })
    .click();
  await expect(page.getByLabel("Recovery code", { exact: true })).toBeVisible();
  await page.reload();
  await signup(page);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "WALLET", exact: true }).click();
  const help = page.getByRole("dialog", { name: "Your wallet", exact: true });
  await expect(
    help.getByRole("heading", { name: "Back up wallet" }),
  ).toBeVisible();
  await expect(help.locator("code.recovery")).toBeVisible();
  await help.getByRole("button", { name: "I saved my recovery code" }).click();
  await help.getByLabel("Confirm password").fill("browser-test-password");
  await help.getByRole("button", { name: "Generate recovery code" }).click();
  await expect(help.locator("code.recovery")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(help).not.toBeVisible();
});

test("idle refresh stays within budget and a failed read preserves the balance", async ({
  page,
}, testInfo) => {
  await signup(page);
  let reads = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/me")) reads++;
  });
  // Fixed measurement window: the old 1.5s timer makes four reads here.
  await page.waitForTimeout(6000);
  expect(reads).toBe(0);
  await act(page, "Fill", "100");
  await expect(page.locator(".scene-value")).toHaveText("$99.00");
  expect(reads).toBeLessThanOrEqual(10);
  const activeReads = reads;
  let unavailable = true;
  await page.route("**/api/me", (route) =>
    unavailable ? route.abort("failed") : route.continue(),
  );
  // Focusing a different tab and returning exercises the real resume event.
  const other = await page.context().newPage();
  await other.goto("about:blank");
  await other.bringToFront();
  await page.bringToFront();
  await expect(
    page.getByRole("button", { name: "Reconnect", exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".scene-value")).toHaveText("$99.00");
  await expect(
    page.getByRole("button", { name: "Fill", exact: true }),
  ).toBeDisabled();
  unavailable = false;
  await page.getByRole("button", { name: "Reconnect", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Fill", exact: true }),
  ).toBeEnabled();
  await other.close();
  await testInfo.attach("refresh-budget", {
    body: JSON.stringify({ idleReadsIn6Seconds: 0, activeReads }),
    contentType: "application/json",
  });
});

test("cash out is reachable, survives a lost response and settles only once", async ({
  page,
}, testInfo) => {
  await signup(page);
  await act(page, "Fill", "100");
  await expect(page.locator(".scene-value")).toHaveText("$99.00");
  await expect(
    page.getByRole("button", { name: "Spark", exact: true }),
  ).toBeEnabled();
  await act(page, "Spark", "99", true);
  await expect(page.locator(".scene-cash strong")).toHaveText("$98.01");
  await expect(page.locator(".scene-dock button")).toHaveCount(2);
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  await page.getByRole("button", { name: "Add test destination" }).click();
  await page.getByLabel("Destination label").fill("My demo destination");
  await page
    .getByLabel("Confirm password", { exact: true })
    .first()
    .fill("browser-test-password");
  await page.getByRole("button", { name: "Save test destination" }).click();
  await expect(
    page.getByText("Simulated destination added.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Wallet", exact: true }).click();
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Cash out", exact: true });
  await expect(sheet.getByLabel("Amount in dollars")).toHaveValue("98.01");
  await sheet.getByLabel("Amount in dollars").fill("100");
  await sheet.getByLabel("Confirm password").fill("browser-test-password");
  await sheet.getByRole("button", { name: "Cash out demo funds" }).click();
  await expect(sheet.getByRole("alert")).toHaveText(
    "Choose an amount within your available cash.",
  );
  await sheet.getByLabel("Amount in dollars").fill("98.01");
  const keys: string[] = [];
  await page.route("**/api/intents", async (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    if (keys.length === 1) {
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await sheet.getByRole("button", { name: "Cash out demo funds" }).click();
  await expect(
    sheet.getByRole("button", { name: "Retry cash out" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "WALLET", exact: true }).click();
  await page.getByRole("button", { name: "Cash out", exact: true }).click();
  await expect(sheet.getByLabel("Amount in dollars")).toBeDisabled();
  await expect(sheet.getByLabel("Confirm password")).toHaveValue("");
  await page.screenshot({ path: testInfo.outputPath("cash-out-retry.png") });
  await sheet.getByLabel("Confirm password").fill("browser-test-password");
  await sheet.getByRole("button", { name: "Retry cash out" }).click();
  await expect(sheet).not.toBeVisible();
  await expect(page.locator(".scene-cash strong")).toHaveText("$0.00");
  expect(keys).toHaveLength(2);
  expect(new Set(keys).size).toBe(1);
  const me = await (await page.request.get("/api/me")).json();
  expect(
    me.intents.filter((i: { kind: string }) => i.kind === "payout"),
  ).toHaveLength(1);
  await page.reload();
  await expect(page.locator(".scene-cash strong")).toHaveText("$0.00");
});

test("original scene fills, bundles and burns with one press", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Full animation on Chromium; actions tested on all engines.",
  );
  test.setTimeout(240000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /THREE|shader|WebGLProgram/.test(message.text())
    )
      errors.push(message.text());
  });
  await signup(page);
  await act(page, "Fill", "1100");
  const scene = page.locator(".tray-scene");
  await expect(scene).toHaveAttribute("data-animation", "fill");
  await expect(scene).toHaveAttribute("data-animating", "true");
  await expect(scene).toHaveAttribute("data-animating", "false", {
    timeout: 150000,
  });
  await expect(scene).toHaveAttribute("data-animation", "fill");
  await page.screenshot({ path: testInfo.outputPath("restored-scene.png") });
  await act(page, "Spark", "1089", true);
  await expect(scene).toHaveAttribute("data-animation", "spark");
  await expect(scene).toHaveAttribute("data-animating", "true");
  await expect(scene).toHaveAttribute("data-phase", "burning");
  await page.screenshot({ path: testInfo.outputPath("restored-spark.png") });
  await expect(scene).toHaveAttribute("data-animating", "false", {
    timeout: 30000,
  });
  await expect(scene).toHaveAttribute("data-animation", "spark");
  expect(errors).toEqual([]);
});
