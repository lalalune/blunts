import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeFunctionData,
  encodeFunctionData,
  getAddress,
  type Hex,
} from "viem";
import { appFee, feeOnOutput, quoteAfterFee } from "../shared/app-fee.js";
import { swapPlan, routerAbi } from "../shared/swap-plan.js";
import { supportedWalletCall } from "../client/transaction-activity.js";
import { cash, stock, dex, type SwapQuote } from "../shared/robinhood.js";
const owner = getAddress("0x1111111111111111111111111111111111111111");
const quote = (side: "fill" | "spark"): SwapQuote => ({
  side,
  amountIn: "25",
  amountOut: "0.035",
  minimumOut: "0.034825",
  fee: 500,
  pool: "0xD60A5d14dB690B7Afad71F76B108071D7175597d",
  blockNumber: "1",
  expiresAt: Date.now() + 20000,
  transactionsEnabled: true,
});
test("one percent output fee uses token-unit flooring and previews net minimum separately", () => {
  assert.equal(
    appFee.recipient.toLowerCase(),
    "0x4a27c325de7629c6bbd187e1e456b56c82e73073",
  );
  assert.deepEqual(feeOnOutput(99n), { fee: 0n, net: 99n });
  assert.deepEqual(feeOnOutput(101n), { fee: 1n, net: 100n });
  assert.deepEqual(feeOnOutput(10001n), { fee: 100n, net: 9901n });
  assert.throws(() => feeOnOutput(-1n));
  assert.deepEqual(quoteAfterFee(quote("fill")), {
    amountOut: "0.03465",
    minimumOut: "0.03447675",
    feeAmount: "0.00035",
    symbol: "QQQ",
  });
  assert.deepEqual(quoteAfterFee(quote("spark")), {
    amountOut: "0.03465",
    minimumOut: "0.034477",
    feeAmount: "0.00035",
    symbol: "USDG",
  });
});
test("both directions swap into router and atomically sweep net to owner with fixed fee recipient", () => {
  for (const side of ["fill", "spark"] as const) {
    const plan = swapPlan(quote(side), owner, 0n),
      call = plan.calls.at(-1)!;
    const batch = decodeFunctionData({ abi: routerAbi, data: call.data });
    if (batch.functionName !== "multicall")
      throw Error("Expected deadline batch");
    const [swap, sweep] = batch.args[1].map((data) =>
      decodeFunctionData({ abi: routerAbi, data }),
    );
    if (
      swap.functionName !== "exactInputSingle" ||
      sweep.functionName !== "sweepTokenWithFee"
    )
      throw Error("Wrong atomic route");
    assert.equal(swap.args[0].recipient, getAddress(dex.router));
    const output = side === "fill" ? stock : cash;
    assert.deepEqual(sweep.args, [
      getAddress(output.address),
      swap.args[0].amountOutMinimum,
      owner,
      100n,
      appFee.recipient,
    ]);
    assert.equal(
      supportedWalletCall(owner, dex.router, call.data, 0n).data,
      call.data,
    );
    for (const args of [
      [stock.address, sweep.args[1], owner, 101n, appFee.recipient],
      [cash.address, sweep.args[1], owner, 100n, owner],
      [sweep.args[0], sweep.args[1] - 1n, owner, 100n, appFee.recipient],
      [sweep.args[0], sweep.args[1], appFee.recipient, 100n, appFee.recipient],
    ] as const) {
      const altered = encodeFunctionData({
        abi: routerAbi,
        functionName: "sweepTokenWithFee",
        args,
      });
      const data = encodeFunctionData({
        abi: routerAbi,
        functionName: "multicall",
        args: [batch.args[0], [batch.args[1][0], altered]],
      });
      assert.throws(() => supportedWalletCall(owner, dex.router, data, 0n));
    }
    // Historical fee-free activity stays readable; adding an arbitrary call does not.
    const oldSwap = encodeFunctionData({
      abi: routerAbi,
      functionName: "exactInputSingle",
      args: [{ ...swap.args[0], recipient: owner }],
    });
    const oldBatch = encodeFunctionData({
      abi: routerAbi,
      functionName: "multicall",
      args: [batch.args[0], [oldSwap]],
    });
    assert.equal(
      supportedWalletCall(owner, dex.router, oldBatch, 0n).kind,
      "swap",
    );
    const extra = encodeFunctionData({
      abi: routerAbi,
      functionName: "multicall",
      args: [batch.args[0], [...batch.args[1], oldSwap] as Hex[]],
    });
    assert.throws(() => supportedWalletCall(owner, dex.router, extra, 0n));
  }
});
