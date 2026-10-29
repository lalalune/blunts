import { test } from "node:test";
import assert from "node:assert/strict";
import { mobileWalletHandoff } from "../shared/mobile-wallet.js";
test("mobile handoff is keyless dapp entry for the explicit public HTTPS origin only", () => {
  assert.equal(
    mobileWalletHandoff("https://blunts.example.com"),
    "https://link.metamask.io/dapp/blunts.example.com/",
  );
  assert.equal(
    mobileWalletHandoff("https://BLUNTS.example.com/"),
    "https://link.metamask.io/dapp/blunts.example.com/",
  );
  for (const origin of [
    undefined,
    "",
    "http://localhost:8745",
    "https://localhost",
    "https://127.0.0.1",
    "https://192.168.1.5",
    "https://[::1]",
    "https://wallet.local",
    "https://wallet.internal",
    "https://wallet.test",
    "https://wallet.invalid",
    "https://blunts.example.com:8745",
    "https://user:password@blunts.example.com",
    "https://blunts.example.com/?token=secret",
    "https://blunts.example.com/#account",
    "https://blunts.example.com/private",
    "javascript:alert(1)",
    "file:///tmp/app",
  ])
    assert.equal(mobileWalletHandoff(origin), null);
});
