import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a stalled email request times out and leaves sign-in available for recovery", async ({
  page,
}) => {
  await page.clock.install();
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({ json: { provider: "eliza-cloud", accountUrl: null } }),
  );
  let attempts = 0;
  await page.route("**/api/auth/steward/send", (route) => {
    attempts++;
    // Deliberately leave the first request unanswered, rather than returning a
    // simulated timeout response. The browser must abort its own fetch.
    if (attempts === 1) return;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/");
  const email = page.getByLabel("Email", { exact: true });
  await email.fill("timeout@example.test");
  await page
    .getByRole("button", { name: "Continue with Eliza Cloud", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Please wait…", exact: true }),
  ).toBeDisabled();
  await page.clock.fastForward(20_001);
  await expect(page.getByRole("alert")).toContainText("The request timed out");
  await expect(email).toBeEnabled();
  await expect(email).toHaveValue("timeout@example.test");
  expect(attempts).toBe(1);
  await page
    .getByRole("button", { name: "Continue with Eliza Cloud", exact: true })
    .click();
  await expect(page.getByLabel("Email code", { exact: true })).toBeFocused();
  expect(attempts).toBe(2);
});

test("email sign-in recovers from expired codes and failed resends without losing the address", async ({
  page,
}, testInfo) => {
  await page.clock.install();
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({ json: { provider: "eliza-cloud", accountUrl: null } }),
  );
  let sends = 0;
  await page.route("**/api/auth/steward/send", (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "dictation@example.test",
    });
    sends++;
    return sends === 2
      ? route.fulfill({
          status: 503,
          json: { error: "Email service unavailable. Try again." },
        })
      : route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/auth/steward/verify", (route) =>
    route.fulfill({
      status: 401,
      json: { error: "This code has expired. Request another code." },
    }),
  );
  await page.goto("/");
  const email = page.getByLabel("Email", { exact: true });
  await email.fill("dictation@example.test");
  await page
    .getByRole("button", { name: "Continue with Eliza Cloud", exact: true })
    .click();
  const code = page.getByLabel("Email code", { exact: true });
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute("maxlength", "6");
  await expect(page.getByRole("status")).toContainText(
    "Check your inbox and spam folder",
  );
  await expect(
    page.getByRole("button", { name: "Resend available after one minute" }),
  ).toBeDisabled();
  await code.fill("123456");
  await page.getByRole("button", { name: "Open wallet", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("This code has expired");
  await expect(code).toHaveValue("123456");
  await page.clock.fastForward(60_001);
  const resend = page.getByRole("button", {
    name: "Resend email code",
    exact: true,
  });
  await resend.click();
  await expect(page.getByRole("alert")).toContainText(
    "Email service unavailable",
  );
  await expect(code).toHaveValue("123456");
  await expect(email).toHaveValue("dictation@example.test");
  await resend.click();
  await expect(code).toHaveValue("");
  await expect(code).toBeFocused();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(sends).toBe(3);
  const scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("email-code-recovery.png"),
  });
  await page
    .getByRole("button", { name: "Use another email", exact: true })
    .click();
  await expect(code).toHaveCount(0);
  await expect(email).toBeEnabled();
  await expect(email).toHaveValue("dictation@example.test");
});

test("authenticator continuation does not resend email or retain the previous code", async ({
  page,
}) => {
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({ json: { provider: "steward", accountUrl: null } }),
  );
  let sends = 0;
  await page.route("**/api/auth/steward/send", (route) => {
    sends++;
    return route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/auth/steward/verify", (route) =>
    route.fulfill({
      json: {
        mfaRequired: true,
        mfa: { type: "totp", challengeId: "test-challenge" },
      },
    }),
  );
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("mfa@example.test");
  await page
    .getByRole("button", { name: "Continue with Steward", exact: true })
    .click();
  await page.getByLabel("Email code", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Open wallet", exact: true }).click();
  await expect(
    page.getByLabel("Verification code", { exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByLabel("Verification code", { exact: true }),
  ).toBeFocused();
  await expect(
    page.getByText("Enter the code from your authenticator.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Resend/ })).toHaveCount(0);
  expect(sends).toBe(1);
});
