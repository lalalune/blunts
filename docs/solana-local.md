# Solana wallet parity — local qualification

Update: the owner deferred personal mainnet signing and authorized a disposable
test wallet. [Actual Surfpool API and browser round trips](solana-fork-acceptance.md)
now pass with real cloned programs and fake funds. This supersedes the old
pending personal-wallet action below. No funded mainnet acceptance is claimed.

Run `npm run build`, then `npm run start:solana`. Open
http://localhost:8753/sol. The separate server binds only 127.0.0.1:8753;
signing is restricted in source to localhost/127.0.0.1 on that port. The live
EVM server does not register Solana endpoints. Nothing in this branch has been
pushed or deployed.

## Implemented

- Wallet Standard discovery, connection and account-change invalidation. Actual
  owner Chrome discovered Phantom, MetaMask and Solflare; Phantom connected.
- Same Tray component, original animation, value-based $100 blunt / ten-blunt
  band accounting. QQQx uses the current onchain Scaled UI Amount multiplier
  for display, while swap and sell-all quantities remain exact raw units.
- Fill USDC into QQQx; Spark sells the full stash or a chosen amount into USDC. Simple amount,
  review, eligibility, waiting and Done states. No manual status check.
- Owner-approved 100bps output fee to nubs.sns, resolved and pinned to
  3S4iLZaixgHMFY7S3jmkG4YQvDupKRzCRiYdicomCRkG.
- Jupiter API v2 build, pinned QQQx/USDC mints/programs, direct Raydium CLMM
  route_v2 subset only. Unknown/shared/exact-out routes fail closed. Header,
  raw amount, minimum, slippage, fee, owner, source/destination/fee ATAs,
  signer set, compute-budget instructions and setup instructions are checked.
  Tips, arbitrary transfers and additional instructions are rejected.
- Onchain mint program/decimals/pause checks; multiplier-change window guard;
  independently fetched lookup tables and blockhash; unsigned simulation;
  bounded compute and native cost including ATA rent; finite input spending.
- Wallet signs the exact message; browser and server verify the returned
  signature/message. Journal saves the signature before broadcasting, never
  signed bytes. Submit has no replay on an uncertain result. Same-wallet Web
  Locks cover signing and submission. Unknown receipts block another trade.
- Automatic finalized receipt observation checks the original message hash
  for both success and failure, exact input spent, actual net token delivery
  and the 1% output fee. Holder-as-fee-recipient uses the direct fee CPI to
  separate combined balance changes. A mismatching receipt remains pending.
  Recovery survives reload, with activity export and an unsigned-review close
  action that cannot erase a sent transaction.

## Evidence and limits

Private/local evidence: `data/review-20261028/mainnet-acceptance/solana-*`.
94 unit checks passed (two optional legacy checks skipped), including exact
raw units, fee-account derivation, mutated instructions, altered signatures,
durable activity and duplicate blocking. Existing EVM browser regression:
48 passed. Solana desktop/mobile fixtures exercise the complete buy/sell UI,
decline, insufficient balance, expired price, wallet mutation and uncertain
send/reload. These use disposable generated keys and mocked API outcomes;
they are not funded mainnet receipts.

Live Jupiter builds were independently fetched for both directions. A real
unsigned mainnet Fill simulation succeeded for the fee wallet's available dust,
and a 0.50 USDC Fill simulation succeeded for the connected Phantom wallet.
No agent signed, broadcast or approved a personal financial transaction.
The holder's funded buy AND sale still require personal wallet confirmation
and subsequent canonical receipt/balance/fee verification before acceptance.

The real connected wallet had about 0.810204 USDC. A 0.50 USDC review was
prepared; its initial maximum native cost was 0.006202986 SOL, including creation
of the holder's and fee recipient's QQQx token accounts. This amount is shown
before signing. Quotes expire after 45 seconds; Update price reconstructs and
simulates a new review. Do not reuse an expired or unknown sent attempt.

The issuer price API lacks a source timestamp, so its price is indicative
display data, not a promised executable quote. Executable prices and floors
come from the fresh validated Jupiter build. Only the qualified direct route
is enabled; broader routing remains outside this first qualification.
Production RPC/API capacity needs qualification.
Keyless Jupiter is limited locally; no paid plan or new API key was created.

## Dependency qualification

The old native bigint-buffer dependency is replaced through a documented local
package override with `vendor/bigint-buffer`, a bounded pure JavaScript codec.
Its four integer functions have endian/bounds/overflow tests; it loads no
native binding. Docker copies vendor in both stages so the dependency link is
valid. Jayson uuid is pinned to the patched 11.1.1 version. Final production
dependency audit has zero high/critical findings; two moderate findings remain
in the legacy Jayson/stream-json dependency chain. No claim of zero findings.

Community-token integration remains deferred. No official mint was verified.
Shipping this Solana route still requires owner approval after funded acceptance.

Receipt follow-up: `npx tsx scripts/qualify-solana-receipt.ts SIGNATURE MESSAGE_HASH`
performs read-only finalized receipt verification, with no signing or submission.
The original hash must come from the saved review/activity, not from recomputing
and trusting an unrelated transaction. Four additional settlement checks cover
both directions, an unrelated failed receipt, mismatching token deltas/fees and
the holder-as-fee-recipient case. These are deterministic fixtures, not mainnet
acceptance. The personal Chrome review remains unsigned at this checkpoint.
