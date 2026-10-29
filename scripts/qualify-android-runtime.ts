// Development QA of a newly created isolated emulator only. No personal device,
// wallet injection, fabricated native transport or public-chain writes.
import { chromium, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const adb = "/Users/nubs/Library/Android/sdk/platform-tools/adb";
const serial = "emulator-5580",
  endpoint = "http://127.0.0.1:9226";
const root = "data/review-20261028/evm/android-runtime";
if (
  execFileSync(adb, ["-s", serial, "emu", "avd", "name"], { encoding: "utf8" })
    .trim()
    .split(/\s+/)[0] !== "blunts_wallet_qa_20261028"
)
  throw Error("Refusing unrelated Android runtime.");
await mkdir(root, { recursive: true, mode: 0o700 });
const browser = await chromium.connectOverCDP(endpoint, {
  timeout: 15000,
  noDefaults: true,
});
try {
  const pages = browser.contexts().flatMap((context) => context.pages());
  if (pages.length !== 1 || pages[0].url() !== "https://localhost/")
    throw Error("Unexpected WebView target.");
  const page = pages[0];
  await expect(page).toHaveTitle("Blunts — Your wallet. Your stash.");
  await expect(
    page.getByText("Preview · signing disabled", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".evm-market-error")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: `${root}/native-tray.png` });
  // WebView CDP captures can omit GPU surfaces. Save the actual emulator
  // framebuffer separately for human verification of the original 3D tray.
  const framebuffer = execFileSync(adb, [
    "-s",
    serial,
    "exec-out",
    "screencap",
    "-p",
  ]);
  await writeFile(`${root}/native-tray-device.png`, framebuffer, {
    mode: 0o600,
  });
  await page.getByRole("button", { name: "Fill", exact: true }).click();
  await page.getByRole("button", { name: "Preview swap", exact: true }).click();
  await expect(page.locator(".evm-quote")).toContainText("Blunts fee 1%");
  await expect(
    page.getByRole("button", { name: "Review wallet steps", exact: true }),
  ).toBeDisabled();
  const quoteText = await page.locator(".evm-quote").innerText();
  await page.screenshot({ path: `${root}/native-fill-quote.png` });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  const walletText = await page.locator("dialog").innerText();
  await expect(page.getByText(/No browser wallet detected/)).toBeVisible();
  await expect(page.getByRole("link", { name: /MetaMask/i })).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Wallet signing" }),
  ).toHaveCount(0);
  await page.screenshot({ path: `${root}/native-no-wallet.png` });
  const bundles = await page
    .locator("script[src]")
    .evaluateAll((elements) => elements.map((el) => el.getAttribute("src")));
  const apk = await readFile(
    "android/app/build/outputs/apk/debug/app-debug.apk",
  );
  await writeFile(
    `${root}/receipt.json`,
    JSON.stringify(
      {
        scope:
          "isolated Android 14 emulator; actual Capacitor WebView and HTTP plugin; no real wallet",
        sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        serial,
        avd: "blunts_wallet_qa_20261028",
        target: "https://localhost/",
        apiOrigin: "http://localhost:8745",
        adbReverse: "task-owned emulator 8745 to Mac loopback 8745",
        bundleScripts: bundles,
        apkSha256: createHash("sha256").update(apk).digest("hex"),
        framebuffer: {
          file: `${root}/native-tray-device.png`,
          sha256: createHash("sha256").update(framebuffer).digest("hex"),
          requiresHumanVisualReview: true,
          cdpScreenshotsMayOmitGpuCanvas: true,
        },
        quoteText,
        walletText,
        nativeSigningEnabled: false,
        accountConnected: false,
        mainnetWrites: 0,
        personalDeviceTouched: false,
        coverage: [
          "native cold launch",
          "actual native market/quote transport",
          "real public quote with net fee",
          "native signing disabled despite loopback API",
          "no-wallet explanation without broken local handoff",
        ],
        limits: [
          "emulator, not physical device",
          "no installed native wallet or signature",
          "initial Capacitor SystemBars safe-area injection warnings recorded separately",
        ],
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      passed: true,
      scope: "isolated emulator only",
      mainnetWrites: 0,
      receipt: `${root}/receipt.json`,
    }),
  );
} finally {
  await browser.close();
}
