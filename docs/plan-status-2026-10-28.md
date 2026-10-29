# Blunts: original intent, approved changes and actual gaps

This is a product-scope reconciliation, not another declaration that all work is
finished. The owner reported a failed funded-wallet attempt and an overly
technical Fill screen after the first deployment. The earlier read-only checks
and local fork did not establish a usable, fully accepted funded customer flow.

## What the original sources actually say

[Shaw's original post](https://x.com/shawmakesmagic/status/2112391602136392121)
describes an app for weed smokers to save and invest in ETFs using a rolling-tray
ritual, with ten blunts becoming a band. The later
[finish request](https://x.com/shawmakesmagic/status/2114736384120700972) asks
someone to finish the app, praises the frontend animation, and points to the
marketing opportunity. Neither tweet specifies the current Robinhood wallet
route. The repository's research contains fuller proposed financing, account,
mobile and distribution plans, sometimes with conflicting assumptions.

The October 27 source capture contains 46 available unique posts across the two
threads. It is not a complete archive of every reply or deleted/unindexed post.

## Status against that intent

| Area | What exists | What changed or remains |
|---|---|---|
| Original tray and ritual | Original scene, brown/gold styling, rolling and ten-to-a-band visualization retained | Preserved; not replaced with a new brand |
| Save/invest in an ETF | Wallet balances, real quotes and USDG/QQQ-token swap implementation | Approved pivot uses a Robinhood token with economic exposure, not direct ETF share ownership; successful personal funded buy/sell remains unverified |
| Simple cash-in | Wallet connection and already-funded USDG balance | Bank/card/Cash App/Apple Pay funding was not completed in this route; Fill is a swap, not a bank deposit |
| Cash-out | Spark swaps the QQQ token to USDG in the same wallet | Bank withdrawal/off-ramp is not connected |
| 1% fee | Owner-approved fixed 1% output fee on Fill and Spark, atomically paired with the swap | Unit and local-fork fee evidence exists; this is not a claim that the original tweets specified that fee |
| Mainnet web app | blunt.nubs.site, TLS, existing VPS, wallet discovery, network setup, live public reads | Shipped; a complete funded personal flow has not been accepted |
| Accounts and wallet infrastructure | Cloud/Steward auth/provider work and simulated ledgers retained in earlier history | Owner chose an existing EVM wallet instead; active app has no email account or bank integration |
| Native apps | Original Capacitor shells and prior local Android/iOS builds preserved | Native wallet experiment and store releases are deferred; no App Store/Play release occurred |
| Marketing | Draft posts and creative concepts exist | No launch posts were sent, and no claim of virality/traction is supported |
| Broad novice/US audience | No evidence this audience can complete the whole original cash-funded journey | Robinhood Stock Tokens exclude U.S. persons; this is a material difference from a US consumer brokerage plan |

Robinhood describes the token rights and restrictions in its
[Stock Token documentation](https://docs.robinhood.com/chain/stock-tokens/).
A checked box is self-attestation, not verified eligibility, and does not remove
those restrictions. An approved brokerage route is needed if U.S. customers are
the intended audience. Do not present the wallet pivot as the completed original
US investing product.

## Reproduced usability failure

In the owner's newer Chrome tab, the Fill sheet displayed a failed wallet request,
expired quote, long token decimals, gas-buffer language and several duplicate
instructions. Activity showed no transaction record and the saved amount was
never submitted. The app had discarded the preflight exception and displayed an
ambiguous message suggesting a wallet request might have been sent.

A read-only run of the actual chain preparation, fee check, repeated preflight,
approval simulation and nonce read took about 14.9 seconds against a 20-second
quote. No wallet request or public write was made by that diagnostic. This
reproduces the timing bottleneck; it does not prove the exact discarded exception
from the owner's earlier click.

The correction deployed as `b05709d` is: one amount step, one Continue action that prepares the
review, readable token amounts, one wallet action at a time, clear preflight versus
submitted states, and details collapsed by default. Eligibility, fixed fees,
finite approval, immutable journal, unknown-outcome blocking and minimum received
remain enforced. The review price lasts 90 seconds; the minimum received stays
fixed, while the on-chain confirmation deadline extends five minutes beyond that
review expiry so time spent in a wallet does not immediately burn the transaction.
No auto-buy or automatic retry of a possibly submitted request was introduced.

## What is still left

- Accept the repaired flow with an eligible funded holder; the agent must not
  approve personal allowance/swap transactions on the holder's behalf.
- Select a supported US brokerage/funding route if the original US novice
  audience is required. Ordinary bank/card funding and bank payout remain gaps.
- Qualify production RPC capacity and address existing VPS disk pressure before
  substantial traffic. A working individual quote is not a scale/SLA test.
- Finish native/store releases only if restored to scope.
- Finalize and separately authorize any public marketing posts/demo. Label local
  fork footage honestly; do not claim a completed mainnet trade without a receipt.

## Repair verification

83 tests passed with two optional legacy-service skips. All 42 browser cases
passed, including reading for more than twenty seconds, preserving unknown
outcomes, cancellation recovery and a preflight failure that creates no wallet
request or journal attempt. The updated router calls passed five local-fork
wallet requests with virtual funds. This remains separate from holder/mainnet
trade acceptance.

The repaired public bundle, market data and both direction quote APIs passed
`scripts/smoke-web-release.mjs`. In the owner's nubsontopgang Chrome session,
MetaMask reconnected, the actual USDG balance loaded, and entering 1 USDG followed
by Continue produced the short review with the eligibility checkbox unchecked.
No approval or swap was clicked by the agent. The old never-submitted draft and
activity were preserved. Private evidence is in
`data/review-20261028/usability/`; the deployed image is `blunts:web-b05709d`,
and the prior `blunts:web-a2631e9` image is retained.
