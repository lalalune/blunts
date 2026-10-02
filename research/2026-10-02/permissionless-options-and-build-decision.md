# Lowest-friction investment wallet: options and build decision

**Researched October 2, 2026.** Follow-up to the user's request to reconsider permissionless QQQ exposure, recent changes, Cash App funding and the easiest implementation. USDC/Arbitrum remains the approved production direction. Solana/Base are compared alternatives, not silently approved migrations. No subscriptions; proposed conversion fee remains 1% each way without a dollar cap.

## Decision

**Build a thin, user-controlled wallet application. Buy authentication, wallet recovery, fiat checkout and investment execution from existing infrastructure. Do not build an issuer, bridge, exchange, synthetic token or general-purpose trading platform.**

There are two different winners:

- **Fewest technical integration steps for transferable QQQ exposure:** Solana USDC → an eligible QQQx or QQQon spot swap using Jupiter, with embedded wallet authentication and hosted funding. This is an engineering recommendation conditional on asset availability, customer eligibility and executable liquidity. It is not an approved US launch route.
- **Best fit for the currently approved US/Cash App/Arbitrum product:** embedded wallet + directly integrated MoonPay checkout + Dinari US investment adapter. Keep Ramp as a fallback for supported funding methods, not as an assumed Cash App provider. This has more account-onboarding work but preserves the requested audience and rail.

The core conflict is commercial as well as regulatory: the verified MoonPay Cash App feature targets US customers, while the most straightforward freely transferable QQQ wrappers target eligible customers outside the US. Combining two SDKs does not resolve that mismatch. No reviewed product demonstrated all of US retail availability, unrestricted QQQ-token transfers, Cash App funding, easy redemption and turnkey app integration.

## 1. What changed, and what opportunity does it create?

**The strongest change for Blunts is the interface model.** The April 13 SEC staff statement describes user-initiated, self-custodial transaction interfaces and permits consistently applied user-paid flat or percentage charges under its conditions. It excludes custody, discretionary recommendations and taking/routing orders, among other activities. It is staff views without legal force, not a general license. A thin wallet interface deserves a separate implementation track; the existing server/broker order plan cannot simply be relabeled to fit it. [SEC interface statement](https://www.sec.gov/newsroom/speeches-statements/staff-statement-regarding-broker-dealer-registration-certain-user-interfaces-utilized-prepare-staff-statement-regarding-broker-dealer-registration-certain-user-interfaces-utilized).

On September 17, the Commission provided temporary conditional exchange/dealer relief for specified tokenized-stock venues and liquidity providers. The order covers permissioned trading and expressly excludes third-party synthetic linked exposure from its defined tokenized NMS stock. It therefore does not automatically cover a QQQ-linked derivative. Building our own venue would add operations rather than simplify the app. [Operative order, especially pp. 1–2](https://www.sec.gov/files/rules/exorders/2026/34-106402.pdf).

There is also an important positive nuance: Commissioner Peirce distinguished truly decentralized peer-to-peer software from the venue model and stated that investors do not need that exemption to use permissionless smart contracts. That supports examining a genuine wallet interface, rather than assuming every on-chain interaction requires Blunts to become a broker. Her statement is not a determination about Blunts, a particular token offering, or its issuer restrictions. [September 17 statement](https://www.sec.gov/newsroom/speeches-statements/peirce-slumber-number-innovation-exemption-statement-091726).

This review keeps the implementation focus requested by the user. Provider availability, token rights and contractual restrictions remain facts that determine whether the app works; they cannot be removed from the selection matrix by assuming a blanket change.

## 2. QQQ and adjacent exposure: actual candidates

| Candidate | Transfer/exposure model | Integration implication | Decision |
|---|---|---|---|
| QQQx / xStocks | Transferable Solana/EVM tracker; issuer redemption has conditions; US distribution restricted | Solana spot-swap candidate; underlying rights are not direct QQQ shares | Shortlist for an eligible non-US product, not the assumed US route |
| QQQon / Ondo Stocks | Transferable tokenized QQQ exposure on supported chains; outside-US availability and redemption eligibility | Second Solana candidate; compare actual sell quotes and issuer/redemption structure | Same audience limitation; no blanket unrestricted replacement |
| wtQQQM / ST0x | Base vault wrapper giving QQQM-linked exposure, rather than QQQ itself | Requires wrapper valuation, exact contracts, solver/exit liquidity and terms verification | Interesting research alternative, not yet qualified for Blunts |
| Dinari US | Customer-account investment program; US dShares are nontransferable and cannot be used in DeFi | More onboarding; API-based execution and records | Current US launch candidate; does not satisfy unrestricted token transfer |
| Ostium US100 and other index/equity perps | Synthetic margin position, not an ordinary transferable QQQ holding | Collateral, oracle, liquidation, financing and market-hours logic | Reject for the passive investment-wallet MVP |
| Hyperliquid/XYZ equity/index perps | On-chain perpetual markets | Different chain/account/margin model, rather than QQQ spot tokens | Research alternative for a different trading product, not the wallet MVP |
| Native issuer shares / DTC ecosystem | Real securities represented on-chain with access controls | Partner/transfer-agent integration; no verified plug-in QQQ consumer route here | Watch and qualify; do not build the launch around an announcement |

**QQQx:** the [product page](https://assets.backed.fi/products/nasdaq-xstock) identifies its tracker structure and US restriction. The [FAQ](https://docs.xstocks.fi/docs/frequently-asked-questions) describes technical transferability and conditioned issuer redemption. Token transferability, pool availability and primary redemption are three separate capabilities.

**QQQon:** [Ondo's current product page](https://ondo.finance/ondo-stocks) identifies QQQon, supported networks and outside-US distribution. Holding the token does not establish eligibility to redeem. Its [June 25 announcement](https://ondo.finance/blog/real-24-7-trading-for-tokenized-stocks) adds around-the-clock mint/redemption for selected assets including QQQon, subject to eligibility and service exceptions. That improves exit design but is not a guaranteed executable quote at every size.

**wtQQQM is the strongest new adjacent lead:** the [specific ST0x instrument page](https://www.st0x.io/markets/qqqm) identifies Base, a vault wrapper with a variable exchange rate, and unsecured issuer exposure. Its [FAQ](https://www.st0x.io/faqs) says the issuer's hedge is held for its own account, without segregation from its estate for tokenholders. The page points to eligibility terms; this review did not obtain the controlling Base Prospectus/Final Terms or verify US retail distribution. It must not be described as proven unrestricted. An [April investor announcement](https://www.intellistake.com/news/intellistake-announces-st0x-as-tokenized-securities-platform-investment-following-european-prospectus-approval) describes segregated custody, which conflicts with the current issuer-site description. Resolve that discrepancy using operative documents before selection. Do not substitute leveraged TQQQ exposure for QQQ/QQQM.

**Perps are a different product:** [Ostium markets](https://app.ostium.com/markets) include US100; [its terms](https://ostium-labs.gitbook.io/ostium-docs/legal/terms-of-use) restrict US access even though some marketing uses broad permissionless language. [XYZ documentation](https://docs.trade.xyz/) describes Hyperliquid HIP-3 perpetual markets. A 1× position still needs margin/funding/exit analysis; wrapping it into a token would introduce a new managed product and contract risk. Neither is the shortest way to ship a durable investment wallet.

## 3. Who is moving on the new infrastructure?

These are verified initiatives, not all responses launched after September 17:

| Organization | Evidence | Relevance to Blunts |
|---|---|---|
| Dinari | Documented US customer program, broker/clearing/funding responsibilities | Near-term provider candidate; qualify the actual asset/network/fee combination |
| Ondo + Broadridge | US custodial tokenization announcement names IVV and MU, with intermediary-enforced transfer restrictions | A separate US structure exists; do not infer global QQQon is now US-enabled |
| Superstate Opening Bell | Native issuer shares with transfer-agent records, wallet permissioning and supported application access | Shows self-custody and issuer-native shares are possible; no reviewed turnkey QQQ offering |
| DTC/DTCC | Tokenization infrastructure and October 2026 launch plan, with participant/client access and registered wallets | Large infrastructure opportunity; a planned launch is not proof Blunts can integrate today |
| Nasdaq + Payward/Kraken | Equity-token design and proposed connection between regulated and on-chain markets; H1 2027 target in announcement | Watchlist; not an immediate dependency |
| Alpaca ITN | Documented authorized-participant mint/redeem integration | Infrastructure behind issuers; requires issuer/AP and brokerage onboarding, not anonymous retail token creation |

Sources: [Dinari US](https://docs.dinari.com/docs/us), [Ondo US announcement](https://ondo.finance/blog/ondo-launches-tokenized-securities-in-usa), [Opening Bell](https://www.superstate.com/opening-bell), [DTCC plan](https://www.dtcc.com/press-releases/2026/dtcc-advances-development-of-new-tokenization-service), [DTC participation FAQ](https://www.dtcc.com/16-/media/Files/Downloads/digital-assets/dtc-tokenization-service-faq.pdf), [Nasdaq/Payward announcement](https://ir.nasdaq.com/node/110111/pdf), [Alpaca AP integration](https://docs.alpaca.markets/us/docs/tokenization-guide-for-authorized-participant).

## 4. Cash App: choose MoonPay for the integration spike

[MoonPay's August 18 announcement](https://www.moonpay.com/newsroom/cashapppay-moonpay) confirms Cash App Pay in selected partner wallets, including MetaMask, Uniswap and Ledger. That is stronger evidence than consumer-app support alone. Blunts' widget entitlement, exact Arbitrum native-USDC destination and payout combination remain untested.

The [Cash App FAQ](https://support.moonpay.com/en/articles/755167-cash-app-faqs) describes eligible US users, same-name accounts, an initially linked account and balance-funded purchases. It also documents selling to Cash App. It now states a 2.9% + $0.30 Cash App Pay API transaction fee included in the MoonPay fee. Treat that as a published fee component, not the final all-in partner quote or a proven identical fee for every payout. Never add it again if the returned quote already includes it.

Illustrative input-side payment component: $50 → $1.75; $100 → $3.20; $500 → $14.80. Actual net investment also depends on the complete ramp quote, conversion fee and execution. This makes Cash App convenience valuable but potentially expensive for frequent small fills. Keep ordinary USDC transfers available and avoid absorbing ramp fees by default.

[Ramp's supported payment-method page](https://support.rampnetwork.com/en/articles/12630-what-payment-methods-can-i-use-to-buy-crypto) lists card, mobile wallets, bank and certain regional methods; this review found no verified Cash App Pay support. Ramp is a credible alternate on/off-ramp, not an interchangeable Cash App integration. Show methods returned for the actual user/quote rather than promising a universal list.

**Critical implementation detail:** Privy's [funding page](https://www.privy.io/funding) says its standard card routing uses Stripe in the US/EU and other providers in other regions. Therefore use a direct MoonPay integration for the Cash App requirement; do not assume a generic Privy “fund wallet” button selects MoonPay in the US. Pass the authenticated destination to a server-signed checkout. Reuse provider sessions where supported, but do not assume MoonPay identity verification replaces brokerage enrollment.

## 5. Concrete stack and why

These are proposed engineering choices, not packages already implemented in this repository.

| Layer | Recommended first build | Why / acceptance requirement |
|---|---|---|
| Browser | React + TypeScript + Vite, mobile-first web UI; optional isolated existing Three.js scene | Small browser build; finance stays usable without WebGL. Native UI reuse is deferred; share domain/types later |
| Auth/wallet | Privy candidate; user-controlled embedded wallet plus external-wallet option | Remove extension/seed-phrase onboarding. Prove recovery, export, signer authority and supported destination type |
| Fiat | Direct MoonPay hosted web integration, Ramp adapter only after a demonstrated gap | Cash App route and reusable hosted verification; no in-house bank/card collection |
| US investment | Dinari US API adapter | Retain approved Arbitrum plan, pending actual account/instrument access |
| Eligible non-US swap variant | Jupiter Swap API V2, exact allowlisted QQQ mint | Existing quote/transaction flow; no custom swap contract |
| API | Small TypeScript service; provider secrets, authenticated checkout creation, status and documents | Keep API credentials and webhook trust off the client |
| Persistence | Managed Postgres + transactional outbox + one durable worker | Resume payments/orders after process exit; deduplicate events and reconcile authoritative state |
| Hosting | Managed HTTPS app/API + worker + Postgres in one region initially | Avoid Kubernetes, microservices and custom indexers; provider callbacks and restore/rollback remain required |
| Gas | Supported wallet sponsorship or explicit limited fee-payer integration | User should not need a second asset just to use USDC; verify chain, wallet and provider compatibility |

[Privy's wallet documentation](https://www.privy.io/user-wallets) supports the seed-phrase-free embedded-wallet candidate. [Native sponsorship documentation](https://docs.privy.io/wallets/gas-and-asset-management/gas/ethereum) supplies an integration starting point, not proof of every Arbitrum transaction mode. Test it with the selected signer configuration. Avoid adding smart accounts, a bundler and a second wallet SDK unless a failed compatibility test demonstrates the need. A provider-required dedicated funding address is not automatically interchangeable with the app's user wallet.

### Jupiter specifics that affect implementation and revenue

The current [Swap API overview](https://developers.jup.ag/docs/swap) offers a managed order/execute path and a lower-level build path. Prefer managed transaction handling for the initial eligible-market experiment; select lower-level construction only when required for the chosen interface boundary or transaction controls.

The [order/execute documentation](https://developers.jup.ag/docs/swap/order-and-execute) describes 50–255 bps integrator fees and a 20% Jupiter share. Thus 100 bps customer fees imply 80 bps retained before other costs; the existing full-retention business case cannot be reused unchanged. Missing fee-token accounts can produce swaps without our intended fee. Verify returned fee fields and actual receipts in both directions. API versions, fee rules and route selection need pinning and contract tests.

[Gasless documentation](https://github.com/jup-ag/docs/blob/main/swap/advanced/gasless.mdx) shows that fee/referral and payer options can change routing or rent requirements. Prove zero-SOL first-buy and last-sale behavior, including token-account rent. Do not label every swap gasless from a marketing claim.

### Keep the two execution models explicit

**Partner US model:** the backend submits provider-authorized order intents and maintains durable provider state. Brokerage onboarding, documents and settlement belong to the provider workflow.

**Thin self-custodial interface model:** the user chooses asset/amount/limits and signs through their wallet. Servers may provide authenticated funding sessions and read-only status, but cannot silently become the user's discretionary signer or broker. Managed aggregator execution, transaction forwarding, defaults and fees need classification against the actual chosen interface boundary. A wallet vendor describing itself as noncustodial is insufficient evidence about our final key access and controls.

Use separate `BrokerOrderAdapter` and `SpotSwapAdapter` types. Do not hide their different settlement, ownership, transfer and failure semantics behind an object that always says “buy QQQ.” Only one live execution adapter is enabled for a given approved product deployment.

## 6. Shortest user journey worth implementing

1. **Enter:** email/social/passkey-supported login or connect an existing wallet. Restore an existing account rather than silently creating another wallet.
2. **Check availability:** determine the supported product before inviting funding. Show identity steps only when actually required. Provider-hosted verification resumes after navigation/reload.
3. **Fill:** enter dollars; select an eligible funding method. Bind checkout to the verified destination and persist the intent. Existing USDC skips fiat checkout.
4. **Confirm investment:** after actual credit, refresh the quote and show instrument, total fee, net exposure and execution constraints. User confirms; an abandoned payment screen never authorizes a trade.
5. **Hold:** distinguish available USDC, investment value and pending activity. Show issuer/holding details on demand. No fake growth, yield promise or instant-settlement animation.
6. **Spark:** quote sale, confirm, wait for actual spendable proceeds, then select transfer or eligible off-ramp. Preserve status through Cash App handoffs and browser suspension.

Each screen is simple, but the background model must include pending, expired, rejected, returned and unknown states. No blind retry of an unknown submission; reconcile before resubmission. No fee charged on a failed conversion. Partial fills use cumulative fee accounting without a dollar cap. Direct wallet transfers do not automatically earn Blunts a fee.

## 7. Evidence-driven build order

| Step | Deliverable | Pass condition |
|---|---|---|
| F01: provider/asset qualification | Dated capability matrix: geography × exact token/network × buy/sell × payment/payout method × limits/cost | A coherent full-cycle route; no assembled marketing promises |
| F02: app foundation | Browser/API/database/worker, auth, recovery, money domain and deterministic providers | Fresh account completes the full simulated cycle and resumes after restart |
| F03: funding spike | Signed MoonPay sandbox session, destination binding, webhook verification, chain/provider reconciliation | Success/failure/return tested; partner confirms production Cash App combination |
| F04: investment spike | One provider sandbox or eligible swap adapter | Buy/sell, expiry, duplicate submission, wrong chain/token, fee and no-route handling pass |
| F05: full exit | Off-ramp/transfer plus zero-gas/full-balance/dust behavior | User can recover or close; no stranded funds disguised as success |
| F06: browser release | Staging, accessibility, recovery, security, support, documents and monitoring | Desktop and mobile browsers complete all paths; controlled live pilot after external gates |

F01 and F02 can proceed concurrently as work streams without building multiple financial products. These refine BROWSER-01–06 and E03–E10 rather than replacing the existing 120-item audit. Build shared wallet/funding/UI foundations now; delay chain-specific investment plumbing until F01 identifies an actual deployable route. No vendor keys are required for deterministic adapter engineering.

For F01, request/read test quotes at $50, $100, $500, $2,000 and $10,000, in both directions. Record net output, all fees, price impact, minimum, quote expiry, trading window, gas requirements and provider response identifiers. Include market-close/weekend, first-time and returning customer cases. No quote was executed or live liquidity proven in this review.

The fastest demo is not the fastest reliable launch. We can ship the simulated browser loop without waiting for a financial partnership; the current repository does not yet contain that production foundation. Earlier 6–9-month planning figures were for the complete funded-service scope, not a measured minimum for a thin wallet prototype. Re-estimate after these narrow spikes rather than promising a new calendar date from documentation alone.

## 8. Final selection rules and outstanding evidence

- **Keep US + Cash App as the target:** MoonPay + Arbitrum USDC + qualified US investment provider remains the recommendation. Revisit a thin interface when an eligible asset/venue is actually demonstrable.
- **Prioritize transferable spot tokens above US distribution:** Solana + Jupiter + QQQx/QQQon is the leading technical alternative for eligible users. It changes the market and invalidates assumptions behind the US/Cash App SAM; do not silently reuse that forecast.
- **Prioritize EVM composability with Nasdaq-100 exposure:** investigate wtQQQM on Base only after resolving rights, eligibility, liquidity and contract/audit evidence. That is a chain/instrument change requiring an explicit product decision.
- **Prioritize permissionless derivatives trading:** use existing perps infrastructure for a separately specified trading product. It does not meet this passive wallet's behavior requirements.

Unresolved: controlling ST0x documents; Blunts-specific MoonPay Cash App buy/sell entitlement; exact US QQQ/Arbitrum program access; wallet signing compatibility; supported embedded return flows; real fee/quote and exit liquidity; issuer freeze/pause/upgrade and recovery powers; and production security/operational acceptance. Absence of verified evidence is not proof a capability cannot exist. Research used public sources only; no partner was contacted, user account created, transaction signed, restriction bypassed or funds moved.
