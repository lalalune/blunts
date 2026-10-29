import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTokenAmount } from "../client/format-token.js";
test("display amounts remain readable without rounding a minimum up", () => {
  assert.equal(formatTokenAmount("1", "USDG"), "1.00");
  assert.equal(formatTokenAmount("23.033126", "USDG"), "23.03");
  assert.equal(formatTokenAmount("0.001374737924637559", "QQQ"), "0.001374");
  assert.equal(formatTokenAmount("0.00000000123456", "QQQ"), "0.00000000123");
  assert.equal(formatTokenAmount("0.0001", "USDG"), "0.0001");
  assert.equal(formatTokenAmount("bad", "QQQ"), "—");
});
