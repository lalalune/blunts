import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { solanaAppFee, solanaAssets } from "../shared/solana.js";

/** Output-token fee account. QQQx uses Token-2022; USDC uses Token Program.
 * Derivation is read-only and does not create an account or transfer funds. */
export function solanaFeeAccount(side: "fill" | "spark") {
  const output = side === "fill" ? solanaAssets.stock : solanaAssets.cash;
  return getAssociatedTokenAddressSync(
    new PublicKey(output.mint),
    new PublicKey(solanaAppFee.recipient),
    false,
    new PublicKey(output.program),
  );
}
