import type { Address, Hex } from "viem";
import type { SwapPlan } from "../shared/swap-plan";
import { chainReader } from "./chain";
export type GasReader = {
  getChainId(): Promise<number>;
  estimateGas(args: {
    account: Address;
    to: Address;
    data: Hex;
    value: bigint;
  }): Promise<bigint>;
  getGasPrice(): Promise<bigint>;
  getBalance(args: { address: Address }): Promise<bigint>;
};
export type StepFee =
  | {
      status: "estimated";
      gasLimit: bigint;
      gasPrice: bigint;
      estimatedFeeWei: bigint;
      ethBalance: bigint;
      hasEnoughEth: boolean;
      estimatedAt: number;
    }
  | { status: "needs_eth"; ethBalance: bigint; estimatedAt: number };
/** Only the next step can be estimated before its preceding approvals exist.
 * Standard Arbitrum-family gas estimates include the L1 data component. */
export async function estimateFirstStepFee(
  plan: SwapPlan,
  reader: GasReader = chainReader,
  expectedChain = 4663,
): Promise<StepFee> {
  if (
    ![4663, 31337].includes(expectedChain) ||
    (await reader.getChainId()) !== expectedChain ||
    plan.quote.expiresAt <= Date.now()
  )
    throw Error("Fee context expired or changed.");
  const call = plan.calls[0];
  if (!call) throw Error("No wallet step to estimate.");
  const ethBalance = await reader.getBalance({ address: plan.owner });
  if (ethBalance === 0n)
    return { status: "needs_eth", ethBalance, estimatedAt: Date.now() };
  const [gas, gasPrice] = await Promise.all([
    reader.estimateGas({
      account: plan.owner,
      to: call.to,
      data: call.data,
      value: 0n,
    }),
    reader.getGasPrice(),
  ]);
  if (gas <= 0n || gasPrice <= 0n) throw Error("Fee estimate unavailable.");
  const gasLimit = (gas * 120n + 99n) / 100n,
    estimatedFeeWei = gasLimit * gasPrice;
  return {
    status: "estimated",
    gasLimit,
    gasPrice,
    estimatedFeeWei,
    ethBalance,
    hasEnoughEth: ethBalance >= estimatedFeeWei,
    estimatedAt: Date.now(),
  };
}
