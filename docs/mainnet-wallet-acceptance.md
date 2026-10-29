# Current result: the 1 USDG mainnet round trip passed

The holder completed both swaps. The spending permission for QQQ and the sale
were confirmed in the holder's wallet. Canonical successful receipts and exact
transfers show the test QQQ position was fully sold for **0.998504 USDG**, composed
of 0.988519 USDG user output and 0.009985 USDG app fee. The holder is also the fee
recipient, so both transfers return to that wallet. ETH gas is separate.

The sale input exactly matched all QQQ delivered by the original 1 USDG buy.
Additional independent holder tests (including a later 3 USDG review) are outside
this acceptance run and were not initiated, repeated or cancelled by the agent.
Do not resubmit the original buy or sell. Private buy/approval/sale receipts are
under `data/review-20261028/mainnet-acceptance/`, including `buy.json`,
`sell-approval.json` and `sell.json`. The source checks canonical chain, holder,
router, exact amount, asset direction and 100 bps fee routing.

The stale handoff checkpoint below is preserved as historical context, not the
current action to perform. The current focus is Solana parity; community-token
integration is deferred. The owner selected **nubs.sol** as the Solana fee
recipient; resolve it with SNS and pin its verified receiving public key.

# Wallet-only mainnet acceptance

Scope accepted by the owner: existing wallet, eligible non-U.S. holders, Robinhood
Chain mainnet, small 1 USDG buy/sell test. Eligibility is holder self-attestation,
not independently verified identity/jurisdiction. This is not a bank/card product.

## Current state

- The holder personally confirmed a finite USDG approval and the 1 USDG buy.
- Both canonical receipts succeeded. The input was exactly 1,000,000 USDG units.
- The router delivered 1,392,426,465,071,569 QQQ units. Transfer logs split this
  into the fee and user output. The 1% fee was 13,924,264,650,715 QQQ units;
  net output was 1,378,502,200,420,854 units, above the protected minimum.
- The test holder is also the configured fee recipient. Both output transfers
  therefore return to the same wallet. This verifies fee routing, not a separate
  customer's net cost. The earlier local-fork test used separate addresses.
- Before selling, the observed balance was 22.033126 USDG and
  0.001392426465071569 QQQ, matching all QQQ delivered by this test buy.
- The agent prepared sell-all for that existing position, refreshed the review
  and opened the finite QQQ spending-permission request in MetaMask. Expected
  spender is the canonical router, not an unlimited permission.
- **The holder has not personally confirmed that MetaMask request. The sell is
  not complete.** The agent must not click MetaMask Confirm or use a signing-key
  workaround. Repeated blanket permission is not the final holder action.

The open request is a spending permission, not the sale itself. Once the holder
confirms it, observe the canonical receipt and current allowance. Then prepare
the actual Spark request for the same position and let the holder personally
confirm the wallet transaction. Do not buy again, reset journal records, or
replay an unknown outcome. Verify the sale receipt, token transfers, gas, fee,
zero residual test QQQ and resulting USDG balance before closing acceptance.

Private receipt evidence: `data/review-20261028/mainnet-acceptance/buy.json`,
`pre-sell.json`, `read-buy.log`. Wallet request parameters were inspected in the
holder's MetaMask side panel. No seed, password or private key was accessed.

## UI repair deployed

Current production image: **blunts:web-fa52eb3**. Automatic receipt observation
replaces the main flow's Check status button. It pauses hidden tabs and backs
off long waits, reads the latest locked journal snapshot, never submits another
financial transaction, and shows permission-confirmation, sale/purchase waiting,
and completion with Done. Technical details and Price breakdown are removed
from Fill/Spark. Recovery and receipt/finality diagnostics remain in collapsed
wallet activity tools. Spark can sell the full exact holding without typing
long token quantities; an empty stash has a clear empty state.

83 unit checks passed (two optional legacy-service skips), 48 cross-browser
cases passed, and the confirmation/completion visuals were checked on desktop
and mobile. Tests exercise delayed receipt availability, exact finite permission,
no automatic next transaction, unknown-outcome blocking, sale-all exact quantity,
completion and empty-state return. Live public HTML/client hash, health, fresh
market data and both quote directions passed. These checks do not substitute
for the still-pending holder confirmation and sale receipt.
