import { test } from "node:test";
import assert from "node:assert/strict";
import { amountUnits, robinhood, stock, cash } from "../shared/robinhood.js";
test("wallet amounts preserve stock and stablecoin precision and refuse lossy input", () => {
  assert.equal(robinhood.id, 4663);
  assert.equal(stock.decimals, 18);
  assert.equal(cash.decimals, 6);
  assert.equal(amountUnits("0.000000000000000001", 18), 1n);
  assert.equal(amountUnits("25.123456", 6), 25123456n);
  for (const v of ["0", "-1", "1e3", " 1", "1.0000001", "NaN", "01", "1."])
    assert.throws(() => amountUnits(v, 6));
});
