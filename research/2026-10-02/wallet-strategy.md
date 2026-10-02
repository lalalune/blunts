# Recommended product: a wallet funded by load and unload fees

**User-approved direction, October 2, 2026: USDC on Arbitrum; uncapped load/unload percentage fees.** User approval selects the product route; provider acceptance and securities permissions remain external gates. Subscriptions are rejected, not deferred. No holding fee, paid tier, AUM fee, performance fee, or subscription revenue belongs in the launch model. This supersedes the earlier optional-subscription discussion. The existing investment concept is retained: a wallet experience whose Fill/Spark actions enter and exit an approved investment. If the product instead holds only USDC, that is a different product with less reason for users to pay Blunts.


**Latest implementation research:** [permissionless options and build decision](permissionless-options-and-build-decision.md). MoonPay Cash App partner support is documented; exact Blunts entitlement remains open. A thin user-controlled interface is an explicit alternative architecture, with the existing US/Arbitrum investment route retained as the launch candidate.

## The best route to validate

Build **one-chain, USDC-funded, user-controlled wallet software with a regulated investment provider behind the investment conversion**. Charge once on each successful Fill or Spark. Let the provider handle regulated execution, custody/settlement and required customer records under its approved program. Use an embedded wallet for usability only after its actual key/recovery authority is verified; do not advertise self-custody merely because the SDK does.

Start by seeking written approval for **Dinari's US program on Arbitrum** with a dedicated customer wallet and its managed funding/settlement flow. This is the leading integration candidate, not confirmed Blunts production access. Cash App is an optional source/destination of USDC on the same approved network. A compatible external EVM wallet should be usable as another funding source without building an exchange or bridge. Use a provider-hosted fiat on-ramp as an optional funding entry point; defer our own ACH/card processing, Solana, multiple assets and a second chain. [MoonPay-first funding research](browser-funding-and-securities.md) now supersedes the earlier blanket deferral of card funding. This narrows engineering and bank-return exposure; it does not establish cheaper acquisition or regulatory exemption.

The [Dinari US guide](https://docs.dinari.com/docs/us) supports dedicated EOA/standard smart-contract wallets but still labels its own white-label noncustodial wallet service “coming soon.” Source the wallet separately or obtain evidence the service is live. Its USDC funding arrangement uses Dinari/Circle; its bring-your-own funding facilitation path is for qualified license holders. **Do not pool customer money in a Blunts wallet or assume that alternative is available.** The selected US instrument, chain, fee collection and app publisher all require written approval.

Fallback: if this route cannot support the approved fees and wallet experience, compare a conventional licensed brokerage integration with the same Fill/Spark UI. If neither produces lawful collectible revenue and positive contribution, stop the funded-investment launch. A generic stablecoin wallet is a separate pivot to test, not an automatic revenue substitute.

## The fee schedule to validate

| Action | Proposed Blunts charge | Treatment |
|---|---:|---|
| Create wallet / hold value | $0 | No subscription, inactivity charge or paywall |
| Receive ordinary USDC / transfer existing USDC | $0 platform fee | Network/provider costs disclosed where incurred; these are not revenue-bearing Fill/Spark conversions |
| Fill: convert funds into the approved investment | **1%, with no dollar cap** | One fee per successfully executed conversion; preview fee and net investment |
| Spark: convert investment back to spendable USDC | **1%, with no dollar cap** | One fee per successfully executed conversion; show sale, fee, settlement and payout status |
| Transfer already-unloaded USDC to the approved destination | No second Blunts percentage fee | Included in the Spark journey where supported; separately disclose unavoidable external cost |
| Rejected/cancelled conversion without execution | $0 platform conversion fee | Show any genuinely incurred nonrefundable network cost before authorization |
| Withdrawal of existing assets without conversion | No artificial exit toll | Only where the instrument/provider permits transfer; do not promise freely transferable US dShares |

This is a proposed launch price to test, not proven willingness to pay or an approved legal fee schedule. Include normal modeled execution/network cost within the platform fee; avoid marketing “1% all-in” until actual quotes support that promise. Exceptional rail costs require a separate preapproved quote and confirmation or the route should be unavailable. No hidden spread, extra routing commission, deposit skim, transfer-tax token or fee on both deposit receipt and the resulting purchase.

Examples, ignoring price movement and external costs: **load $100 → $1 fee → $99 invested**; later **unload $100 of investment → $1 fee → $99 USDC**. An immediate round trip from $100 produces $98.01 after the two conversion fees, not $98 flat. Loading/selling $2,000 incurs $20; $10,000 incurs $100. There is no dollar cap. Losses do not erase a transaction fee: an $80 gross sale has an $0.80 fee, unlike the discarded gains-share model. These examples must match the final provider's inclusive-fee contract and rounding rules.

Partial fills: total platform charge follows actually filled notional, with one cumulative fee calculation across all fills of the original action. A retry, split execution, resumed app or payout retry cannot charge the fee again. A completed sale followed by failed payout remains sold; support retries the payout, not another sale/fee. Record the fee recipient, schedule version, original action ID, filled amount and any refund separately.

Use a **$50 initial conversion minimum as a testable operating assumption**, or the applicable provider's higher minimum. Receiving USDC is not subject to that conversion minimum. At $25, a 1% fee is only $0.25 against the currently published $0.20 standard order/network charge plus quote and service costs; tiny trades leave little room. Do not strand amounts below the minimum: allow a full-balance closing sale where the provider supports it, with an explicit minimum/dust resolution policy and no surprise fee. Revisit the minimum only with actual cost and customer evidence.

## Why fees on both actions are the best starting hypothesis

Wallets already monetize optional transaction services: [MetaMask describes a 0.875% swaps fee](https://metamask.io/faqs), and [Phantom describes 0.85% on selected swap pairs](https://help.phantom.com/articles/5985106844435). These are commercial analogies, not evidence that equity-wallet customers will pay the same amount or that the legal structures match. Cash App's existing investing access remains a powerful low-price substitute.

A basic self-custody wallet cannot reliably collect a percentage of every incoming/outgoing transfer: people can use another interface and direct transfers do not necessarily invoke Blunts' code. Charge for the **Blunts-assisted conversion experience** that the customer chooses and values. Measure fee-bearing converted volume separately from total receipts, wallet balances and raw transfers. The model assumes the listed volume uses that paid service; bypass/nonconversion volume earns zero.

The [fee-only model](model-output.md) tests exit-only, 0.5%, 0.85%, 1% and 1.5% each way. At unchanged behavior/costs, free entry + 1% exit loses money even in the Strong case; 0.85% each way barely misses break-even in the Habitual case. 1.5% improves arithmetic but worsens a customer's round-trip cost and has no demand evidence. **1% each way is the clearest initial compromise to validate**, not an optimized or guaranteed winning price. Do not encourage needless movement to earn fees.

## Revised economics: no subscription anywhere

Baseline assumes all funding/payouts use the selected wallet rail, normal network costs are borne by Blunts, 1% each conversion with no dollar cap and full legal entitlement to that customer fee. The bank-heavy alternative remains a cost sensitivity, not the recommended first release. CAC, churn and usage assumptions are unchanged from the original cases, so the effect of the narrower rail can be seen separately.

| Annual funded-user case | Fee-bearing load + unload volume | Company revenue | Margin after service and replacement CAC/KYC |
|---|---:|---:|---:|
| Casual | $960 | $9.60 | **−$24.54** |
| Habitual | $3,720 | $37.20 | **$5.50** |
| Strong | $7,200 | $72.00 | **$40.07** |

At $1.5m annual fixed costs, the Strong case reaches operating break-even at approximately **37,436 maintained active funded users**; $1m annual operating profit needs **62,393 users, $449m annual fee-bearing volume, and $4.49m annual company revenue**. Habitual behavior needs about 455k users for the same profit. Strong simple acquisition payback is 7.5 months; Habitual is 26.9 months. These are conditional pre-tax scenarios after modeled salaries, not forecasts.

The full-fee assumption is decisive: retaining only half gives Strong a $4.07 annual steady margin, rather than $40.07. A partner collecting the fee is not necessarily taking half; the contract must say. Do not double-count the provider cost and a revenue share for the same charge. Do not treat a provider's ability to collect a fee as legal authorization for Blunts to receive it.

The lower user target versus the previous subscription-free case comes from removing the **assumed 25% ACH/bank mix**, not from relabeling trades or lowering the compliance budget. If manual wallet funding raises CAC, lowers conversion or needs more support, the gain may disappear. The five-year Strong growth scenario still requires roughly **$9.31m including modeled headroom**, excluding regulatory capital/reserves. Smaller controlled growth can require less capital; neither amount is a guaranteed launch budget.

## Legal structure: fee-based wallets have a possible path, but this implementation must fit

The [SEC staff's April 2026 interface statement](https://www.sec.gov/newsroom/speeches-statements/staff-statement-regarding-broker-dealer-registration-certain-user-interfaces-utilized-prepare-staff-statement-regarding-broker-dealer-registration-certain-user-interfaces-utilized) expressly contemplates consistent user-paid flat or percentage transaction charges. Thus “transaction fee” is not automatically fatal. Its conditions include self-custody, user control, neutral fee treatment and disclosures; it excludes activities such as handling assets, executing/settling, taking/routing orders and recommending particular transactions. It is limited staff guidance, not a blanket exemption.

**Recommended implementation is a partner-approved wallet investment interface.** Do not claim that the existing server order-routing architecture qualifies for the narrower covered-interface position. Have counsel/provider classify the actual code paths, key authority and fee collection. If a pure covered-interface route is pursued instead, it needs a separate architecture and conditions review before implementing it. Renaming a QQQ purchase “load wallet” does not change its economic substance. The product can use simple words while the confirmation correctly identifies what is bought/sold and who provides it.

## Changes to the implementation queue

1. **Freeze the revenue design:** delete subscription tiers, entitlements, StoreKit/Play Billing and gains-share from the roadmap/model. These remain excluded unless the user changes direction.
2. **Resolve the one partner gate:** request approval for the exact US asset, Arbitrum route, user wallet, managed funding, uncapped 1% fee, collection recipient and publisher. Obtain an all-in quote and proof of actual production capabilities. No contact is sent by this dossier update.
3. **Prove one money loop:** eligible user → wallet/KYC → USDC receipt → expiring Fill quote → user confirmation → actual execution → holding → Spark quote → execution/settlement → USDC payout. No bridge or direct ACH/card processing; an approved provider-hosted funding widget is in scope.
4. **Make financial state legible:** distinguish spendable USDC from investment value, pending funds and available-to-unload amount. Fill/Spark previews show instrument, gross amount, one Blunts fee, other costs, net result and availability time. Do not convert unsolicited deposits automatically.
5. **Implement collection correctly:** approved provider fee mechanism, successful-fill evidence, partial-fill fee reconciliation, refund/reversal policy, exactly-once fee posting, reconciliation and customer receipt. No client-only skim or withdrawal lock.
6. **Validate paid service usage:** measure receipt→conversion rate, fee-bearing volume/user, successful return-to-Cash-App rate, support cost, losses, fully loaded CAC and retained-user economics. Target sustainable contribution from voluntary use, not deposit churn.
7. **Gate expansion:** add ACH, other networks or assets only when net contribution and customer need exceed their implementation/compliance/support cost. Keep all existing identity, security, settlement, tax, support, closure and platform acceptance gates that apply to the investment product.

The best opportunity is **a simple wallet experience that earns transparent fees when it performs a useful conversion**, with one regulated route behind it. It is not a subscription business and does not need one to be tested honestly.
