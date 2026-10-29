import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import type {
  StandardConnectFeature,
  StandardEventsFeature,
  StandardDisconnectFeature,
} from "@wallet-standard/features";
import type { SolanaSignTransactionFeature } from "@solana/wallet-standard-features";

export type SolanaWallet = Wallet & {
  features: StandardConnectFeature &
    StandardEventsFeature &
    SolanaSignTransactionFeature &
    Partial<StandardDisconnectFeature>;
};
export function compatibleSolanaWallet(wallet: Wallet): wallet is SolanaWallet {
  const f = wallet.features;
  return (
    wallet.chains.includes("solana:mainnet") &&
    !!f["standard:connect"] &&
    !!f["standard:events"] &&
    !!f["solana:signTransaction"] &&
    (
      f[
        "solana:signTransaction"
      ] as SolanaSignTransactionFeature["solana:signTransaction"]
    ).supportedTransactionVersions.includes(0)
  );
}
export function solanaWalletAccount(account: WalletAccount) {
  return (
    account.chains.includes("solana:mainnet") &&
    account.features.includes("solana:signTransaction")
  );
}
export const solanaWalletRegistry = getWallets;
