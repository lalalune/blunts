import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
async function transaction(page: Page, button: string, amount: string) {
  await page
    .getByRole("button", {
      name: button === "Add money" ? "Fill" : button,
      exact: true,
    })
    .click();
  if (button === "Add money")
    await page.getByRole("button", { name: "Add funds", exact: true }).click();
  await page.getByLabel("Amount in dollars").fill(amount);
  await page.getByRole("button", { name: "Review quote" }).click();
  await expect(page.getByRole("dialog")).toContainText("Blunts fee");
  await page.getByRole("button", { name: "Confirm" }).click();
  if (button === "Add money")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add demo funds" })
      .click();
  await expect(
    page.getByRole("dialog").getByText("completed", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to wallet" }).click();
}
test("complete browser cycle survives reload and has no serious accessibility violations", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await signup(page);
  let scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  await transaction(page, "Add money", "2000");
  await page.reload();
  await expect(page.getByText("$2,000.00").first()).toBeVisible();
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByLabel("Amount in dollars").fill("2000");
  await page.getByRole("button", { name: "Review quote" }).click();
  await expect(page.getByRole("dialog")).toContainText("$20.00");
  scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(
    page.getByRole("dialog").getByText("completed", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to wallet" }).click();
  await expect(page.getByText("$1,980.00").first()).toBeVisible();
  await expect(
    page.getByLabel("Blunts rolled: 19", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Bands: 1", { exact: true })).toBeVisible();
  await expect(page.locator(".scene-dock button")).toHaveCount(2);
  await expect(page.locator(".scene-header .brand")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("funded-wallet.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  await page.getByLabel("Sell all available units").check();
  await page.getByRole("button", { name: "Review quote" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(
    page.getByRole("dialog").getByText("completed", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to wallet" }).click();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "WALLET", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Destination label").fill("Test Cash App");
  await page
    .getByLabel("Confirm password", { exact: true })
    .first()
    .fill("browser-test-password");
  await page.getByRole("button", { name: "Save test destination" }).click();
  await expect(
    page.getByText(
      "Simulated destination added. No external account was linked.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Wallet", exact: true }).click();
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  await page.getByLabel("Amount in dollars").fill("1960.20");
  await page
    .getByRole("dialog")
    .getByLabel("Confirm password")
    .fill("browser-test-password");
  await page.getByRole("button", { name: "Review quote" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(
    page.getByRole("dialog").getByText("completed", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to wallet" }).click();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "HISTORY", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download statement" }).click();
  expect((await download).suggestedFilename()).toBe(
    "blunts-sandbox-statement.json",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("reject and ambiguous submission are visible and recover without duplicate funding", async ({
  page,
}) => {
  await signup(page);
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByLabel("Amount in dollars").fill("100");
  await page.getByText("Test a failure or recovery path").click();
  await page.getByLabel("Simulation scenario").selectOption("timeout");
  await page.getByRole("button", { name: "Review quote" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add demo funds" })
    .click();
  await page.reload();
  await expect(page.locator(".scene-cash strong")).toHaveText("$100.00");
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByText("Test a failure or recovery path").click();
  await page.getByLabel("Simulation scenario").selectOption("reject");
  await page.getByRole("button", { name: "Review quote" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(
    page.getByRole("dialog").getByText("failed", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".scene-cash strong")).toHaveText("$100.00");
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

test("original scene fills, rolls and burns after confirmed transactions", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Animation smoke on Chromium; account flow runs on all engines.",
  );
  test.setTimeout(240000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /THREE|shader|WebGLProgram/.test(message.text())
    )
      errors.push(message.text());
  });
  await signup(page);
  await expect(
    page.getByText("Demo · no real money", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".balance-grid")).toHaveCount(0);
  await transaction(page, "Add money", "1110");
  await transaction(page, "Fill", "1100");
  const scene = page.locator(".tray-scene");
  await expect(scene).toHaveAttribute("data-animation", "fill");
  await expect(scene).toHaveAttribute("data-animating", "true");
  await page.screenshot({ path: testInfo.outputPath("restored-fill.png") });
  await expect(scene).toHaveAttribute("data-animating", "false", {
    timeout: 120000,
  });
  await expect(scene).toHaveAttribute("data-animation", "fill");
  await page.screenshot({ path: testInfo.outputPath("restored-scene.png") });
  await page.getByRole("button", { name: "Spark", exact: true }).click();
  await page.getByLabel("Sell all available units").check();
  await page.getByRole("button", { name: "Review quote" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("completed", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to wallet" }).click();
  await expect(scene).toHaveAttribute("data-animation", "spark");
  await expect(scene).toHaveAttribute("data-animating", "true");
  await page.screenshot({ path: testInfo.outputPath("restored-spark.png") });
  await expect(scene).toHaveAttribute("data-animating", "false", {
    timeout: 20000,
  });
  expect(errors).toEqual([]);
});
