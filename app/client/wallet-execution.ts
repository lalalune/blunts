import { executionPolicyForOrigin } from "../shared/execution-policy";
import type { Address } from "viem";
import {
  submitSwapStep,
  SwapJournal,
  type WalletRpc,
} from "../shared/swap-journal";
import type { SwapPlan } from "../shared/swap-plan";
import type { Market } from "../shared/robinhood";
import { request } from "./platform";
import { prepareSwap } from "./prepare-swap";
import { estimateFirstStepFee } from "./gas-readiness";
import { chainReader } from "./chain";
import { withActivityLock } from "./activity-lock";
// Only the owner-approved loopback web preview may request wallet signatures.
export const localExecutionPolicy = executionPolicyForOrigin(
  typeof window === "undefined" ? undefined : window.location.origin,
);
export async function requestWalletStep(
  plan: SwapPlan,
  step: number,
  wallet: WalletRpc,
) {
  if (!localExecutionPolicy.enabled || !plan.quote.transactionsEnabled)
    throw Error(
      "Wallet signing is disabled outside the approved local preview.",
    );
  const owner = plan.owner as Address;
  const journal = new SwapJournal(window.localStorage, owner, 4663);
  return submitSwapStep(
    plan,
    step,
    wallet,
    chainReader,
    journal,
    (operation) => withActivityLock(journal.key, operation),
    {
      ...localExecutionPolicy,
      preflight: async (plan, index) => {
        const response = await request("/onchain/market", undefined, {});
        if (!response.ok) throw Error("Fresh market reference unavailable.");
        const reference = response.data as Market;
        const fresh = await prepareSwap(
          plan.quote,
          owner,
          chainReader,
          4663,
          reference,
        );
        const call = plan.calls[index];
        if (
          !call ||
          !fresh.calls.some(
            (candidate) =>
              candidate.to.toLowerCase() === call.to.toLowerCase() &&
              candidate.data === call.data &&
              candidate.value === call.value,
          )
        )
          throw Error("Approval state changed. Review fresh wallet steps.");
        const fee = await estimateFirstStepFee({ ...fresh, calls: [call] });
        if (fee.status !== "estimated" || !fee.hasEnoughEth)
          throw Error("ETH fee readiness is unavailable or insufficient.");
      },
    },
  );
}
