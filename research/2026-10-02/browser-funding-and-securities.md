# Browser completion: on-ramp, investment infrastructure, and Solana QQQ

**October 2, 2026. User-approved product direction: USDC on Arbitrum. Proposed existing 1% Fill/Spark fee is now uncapped; subscriptions remain excluded.** User approval resolves the chain/product choice. It does not stand in for a provider contract, production enablement, or legal clearance.

## Recommendation

Build a browser-first wallet with **MoonPay as the first hosted on/off-ramp candidate, Ramp Network as the fallback, and Dinari's US securities program as the investment-provider candidate**. Keep manual native-USDC funding from compatible wallets/Cash App available. Use one approved Arbitrum asset/network combination end to end, without a bridge. The provider must confirm native USDC rather than silently delivering USDC.e or another representation.

The app can have a coherent browser journey while hosted providers perform their verification and payment steps. “Works in browser” does not require all KYC/payment screens to be custom Blunts UI, nor does it mean the process finishes instantly. Prefer a supported hosted flow over collecting bank/card/identity credentials ourselves.

The current repository is still a visual simulation. This update changes the executable business model and delivery specification; it does **not** claim that real wallet, funding, securities or withdrawal adapters have been implemented.

## 1. MoonPay can fund the wallet; it does not replace the securities provider

[MoonPay's Arbitrum integration announcement](https://www.moonpay.com/newsroom/arbitrumbridge) describes embedded purchases with payment methods such as cards, bank transfers and mobile payment wallets. Its [Top-up SDK documentation](https://moonpay.readme.io/docs/quickstart) describes web integration, sandbox keys and signed parameters. This makes it a credible funding candidate, not proof that our specific customer, token, state and partner account are enabled.

**New finding that improves the Cash App plan:** [MoonPay's Cash App FAQ](https://support.moonpay.com/en/articles/755167-cash-app-faqs) documents buy/sell support for eligible US customers. Confirm that this consumer capability is also available in the Blunts partner checkout for Arbitrum USDC; the page alone does not prove that combination. This is different from Blunts being accepted directly as a Cash App merchant.

| Candidate | Verified public capability | Still needs proving for Blunts | Selection |
|---|---|---|---|
| MoonPay | Hosted web funding, Arbitrum integration, documented Cash App option | Native USDC buy **and sell**, exact state/account/payment-method availability, partner widget entitlement, investment-related use approval, limits, fees and returns | First integration/commercial spike |
| Ramp Network | [Supported-assets list](https://support.rampnetwork.com/en/articles/432-what-cryptoassets-does-ramp-network-support) lists USDC on Arbitrum for buying and selling | Region/method restrictions, partner approval, destination support, live quote and settlement time | First fallback; stronger explicit public asset/network listing |
| Transak | [Hosted on-ramp](https://docs.transak.com/products/on-ramp) and [API integration](https://docs.transak.com/integration/api), lookup/quote infrastructure | Exact USDC-Arbitrum direction/geography/method matrix; do not infer off-ramp from on-ramp support | Secondary comparison if first two fail price/coverage |
| Direct wallet/Cash App USDC transfer | Existing selected-chain funding concept | Actual account eligibility, exact token/network, screening, finality and payout support | Retain as lower-complexity funding alternative |

Do not implement three providers at once. Select the one that passes a representative quote matrix: $50/$100/$500/$2,000 loads and unloads, approved states, Cash App/card/bank method where available, native USDC destination, and both successful and declined/returned cases. Public network marketing is weaker evidence than an actual enabled partner quote and completed authorized test.

### Funding versus investing: separate operations, connected UX

```text
Browser session + verified customer + dedicated wallet
   -> approved securities account/eligibility before soliciting investment funding
   -> MoonPay/Ramp hosted purchase of native USDC on Arbitrum
   -> verified provider status AND actual permitted wallet credit/finality
   -> fresh investment quote: asset, gross, 1% Blunts fee, other costs, net
   -> customer confirms investment instruction
   -> Dinari-approved US execution and settlement -> authoritative holding

Spark:
   -> customer confirms sale with uncapped 1% fee
   -> provider executes -> proceeds become available USDC
   -> customer chooses wallet transfer or eligible hosted off-ramp
   -> transfer/off-ramp confirmed -> money delivered -> reconciled receipt
```

Do not auto-buy on a widget-close event, a URL parameter saying success, or an arbitrary wallet transfer. The on-ramp checkout authorizes a crypto purchase; it is not automatically a securities order authorization. Persist the customer's intent, return to a fresh expiring quote after funding and get the required confirmation. An approved combined authorization could be considered later, with explicit failure/cancellation semantics and provider acceptance.

On-ramp KYC and broker KYC are separate responsibilities. Reuse identity only through an approved reliance/data-sharing arrangement; do not promise that verifying with MoonPay removes brokerage enrollment. Authenticate and verify the destination before creating checkout. Do not allow arbitrary client-supplied addresses in a signed partner URL.

### Pricing and cost stacking

**Blunts:** 1% on each completed investment Fill/Spark, no dollar maximum. $100 → $1, $2,000 → $20, $10,000 → $100. No second Blunts percentage for transferring the resulting USDC. Network/provider fees, spreads, FX and third-party ramp fees must be shown separately where applicable.

[MoonPay's partner pricing page](https://support.moonpay.com/en/articles/694907-partner-pricing-fees-and-the-removed-paywall) documents optional partner transaction fees on top of MoonPay fees. That is an alternative commercial collection mechanism to evaluate, **not permission to collect both an extra ramp markup and the already-promised Fill fee**, and not a securities-law exemption. Keep the investment fee at the approved investment stage unless contracts support a different clearly disclosed model. Do not book uncontracted affiliate revenue.

Use live quotes rather than claiming a universal MoonPay percentage. As arithmetic only, if a $100 fiat budget loses an assumed $3 in ramp fees, $97 reaches the wallet; a 1% Fill on that amount leaves $96.03 invested. The $3 is **not a MoonPay quote**. Customers judge the complete cost, not just our 1% label.

The model now has explicit optional `onramp_volume_share` and `absorbed_onramp_fee_rate` inputs. Default zero absorbed fees means the customer pays the third-party quote, not that funding is free. If Blunts absorbs an assumed 3% on 25% of Strong-case load volume, annual cost rises $36/user and steady margin falls from $40.07 to $4.07. The extra friction may also change CAC/retention, which remains unmeasured. No cap removal benefit appears in the current base cases because their modeled actions were already below the old cap; large-volume scenarios now charge the full percentage.

## 2. What securities infrastructure is needed on a popular chain?

Arbitrum is the transfer/execution network for the selected token infrastructure. It does not by itself hold the underlying ETF shares, open regulated accounts, supply legally valid ownership rights, execute an exchange order, handle corporate actions or deliver tax records. Someone still performs those functions. A token can represent different legal instruments even if the trading screen says QQQ.

For the chosen US route, the [Dinari US guide](https://docs.dinari.com/docs/us) identifies Dinari Securities as the broker-dealer with Alpaca clearing, and a managed stablecoin funding arrangement involving Circle. It requires partner onboarding, fully disclosed customer accounts and approved interfaces. US tokens have transfer/DeFi restrictions. Confirm the actual QQQ instrument and Arbitrum enablement for our account; generic chain support is insufficient.

| Layer | Who should supply it | What Blunts must implement/verify |
|---|---|---|
| Identity and eligibility | Wallet/auth vendor plus broker and ramp requirements | Secure sessions, verified contact, recovery, account linking, state/tax eligibility and consent |
| Fiat ↔ USDC | Approved MoonPay/Ramp arrangement | Hosted checkout session, quote, verified webhook/status, address binding, customer support handoff |
| Network and wallet | Arbitrum, native USDC, selected wallet/RPC provider | Chain/token allowlist, transaction signing and recovery, finality, gas strategy, screening |
| Security/instrument rights | Issuer/broker/custody structure | Correct instrument/rights/disclosures; no invented direct-share or insurance claims |
| Quotes/orders/execution | Approved regulated provider | Preview, explicit user authorization, idempotent permitted adapter, partial-fill/status recovery |
| Clearing/custody/settlement | Provider's contracted stack | Correct available/settled balances; no fake instant payout or customer-asset pooling |
| Corporate actions/statements/tax | Provider of record | Ingest/display actual entitlements/documents, corrections and user retrieval |
| App operations | Blunts with provider responsibilities | Durable records/reconciliation, security, fee accounting, support, complaints, incident and closure flows |

The goal is to **buy this infrastructure through approved providers**, not become a broker, clearing firm, exchange, bank and issuer ourselves. Blunts' exact role and fee entitlement still need approval. A wallet SDK is not the missing securities layer.

## 3. Is QQQ on Solana permissionless?

**QQQ-linked tokens exist, including QQQx.** [Backed's Nasdaq xStock product page](https://assets.backed.fi/products/nasdaq-xstock) identifies QQQx as a tracker certificate issued on Solana and EVM networks. That page also restricts offering/sale/delivery to US persons. It is not a direct token issued by Invesco simply because its price tracks QQQ.

The [xStocks FAQ](https://docs.xstocks.fi/docs/frequently-asked-questions) describes freely transferable on-chain tokens and secondary-market liquidity. It also describes KYC and minimums for direct issuer redemption. The [legal overview](https://docs.xstocks.fi/docs/product-legal-overview) identifies the instrument as a tracker certificate/bearer debt exposure rather than direct equity ownership and states US distribution restrictions.

| Meaning of “permissionless” | Answer for this review |
|---|---|
| Can a Solana token transfer or a supported pool swap work without a brokerage-style account for every transfer? | Yes, that is the technical model described for xStocks; individual venues still have rules and availability |
| Does holding QQQx mean directly owning QQQ ETF shares in a US brokerage account? | No; evaluate the tracker certificate and its legal rights |
| Does on-chain accessibility authorize a US-facing Blunts app to market/sell it to US persons? | No; the issuer's stated restrictions remain a launch blocker for this proposed route |
| Can every holder redeem with the issuer anonymously at any size? | No; direct redemption has conditions |
| Would switching from Arbitrum to Solana eliminate the securities/issuer infrastructure? | No; that infrastructure is still behind the token, with different rights and risks |

A non-US product could evaluate QQQx under a separate jurisdiction, distribution, liquidity and redemption analysis. That is a different target market, not a workaround for the approved US-first product. Do not use a DEX route or a wallet-only label to bypass eligibility. No live liquidity/executable QQQx price or unrestricted redemption was tested here.

## 4. What can be finished for browser now?

A new inventory still finds no production app package/build, authenticated backend, database or provider integrations in this repository. The HTML timers, sample balances and fake bank linkage cannot be made real by adding a MoonPay button. Preserve the visual scene, but build a durable application around it.

### Build work that does not require live-money access

1. Scaffold the typed browser app, API, Postgres migrations and durable worker with local/staging environments. Extract the scene and make all account information available without WebGL.
2. Implement the fee/money domain: integer/fixed-decimal money, uncapped 1% fee, cumulative partial-fill rounding, single-charge original action IDs and reversals. The current Python change is a **business model**, not this production ledger.
3. Implement authentication, account/consent/status screens, provider-independent interfaces, a deterministic fake-provider environment and resumable financial state machines.
4. Build funding session → observed credit → confirmed Fill → holding → confirmed Spark → payout as one tested vertical slice. Include reload/process interruption, pending/unknown, duplicate webhook, payout rejection and reconciled receipts.
5. Create narrow adapters for wallet identity, ramp checkout/status and investment quote/order/status. Keep signing secrets server-side; separate webhook/event namespaces and sandbox/prod credentials.
6. Add documents/support/closure, eligibility enforcement, secure staff operations, monitoring, backups, accessibility and error UX. Deploy the browser sandbox with explicit simulation/test status.

### Provider-enabled integration work

| Gate | Specific missing input | Acceptance proof |
|---|---|---|
| Wallet | Selected vendor project, allowed domains, signing/recovery model and sandbox config | User creates wallet, signs intended action, recovers on a second browser and cannot access another account |
| Ramp | Business approval; test/live keys; webhook secret; domain allowlist; asset/network/region/method quote access | Native USDC reaches the assigned Arbitrum wallet; failure/return reconciles; output cannot be redirected by client tampering |
| Securities | Dinari US supplemental agreement, QQQ-Arbitrum enablement, credentials, fee and UI approval | Account opens; quoted order fills; holdings and fees match records; sale/settlement/payout succeeds |
| Browser deployment | Owned app domain, hosting/DB/secret storage and callback/webhook URLs | HTTPS staging/release, correct callbacks, CSP, monitoring, backup restore and rollback |
| Funded release | Legal/provider acceptance and authorized operator's live test | Actual complete cycle reconciles; no unresolved high-severity security/money defects |

[MoonPay's integration controls](https://support.moonpay.com/en/articles/694414-managing-your-api-keys-domains-and-webhooks) include separate environments, allowed domains and webhook keys. Backend verification, durable deduplication, provider status lookup and exact destination/token/amount checks are required. Client callbacks only update navigation; they do not finalize funds. Sandbox outputs may use test tokens and cannot prove production coverage or real settlement.

For Arbitrum gas, either verify a supported sponsor/paymaster/relayer with limits or show the native ETH requirement. Funding USDC alone does not necessarily pay gas for subsequent wallet actions. [Circle distinguishes native Arbitrum USDC](https://www.circle.com/blog/usdc-on-arbitrum-now-available) from bridged assets; pin the official contract and decimals in reviewed environment configuration. Do not infer identity from the ticker or an EVM address alone.

### Concrete browser completion order

- **BROWSER-01:** domain/API/DB/worker and simulated full-cycle contract tests; no dependency on provider sales acceptance.
- **BROWSER-02:** real browser authentication/wallet recovery, approved account onboarding and disclosures.
- **BROWSER-03:** hosted ramp sandbox with signed sessions, verified events and finality; manual USDC fallback.
- **BROWSER-04:** approved securities sandbox quote/buy/sell/settlement and uncapped fee reconciliation.
- **BROWSER-05:** off-ramp/payout, documents/support/closure and all failed/unknown/retry paths.
- **BROWSER-06:** deployed staging security/accessibility/recovery acceptance, then authorized funded pilot.

These extend E03–E10 in the [implementation plan](implementation-plan.md); they are not extra parallel architectures. Keep mobile packaging later. The immediate high-value build is the complete durable browser vertical slice, while provider access is obtained. No missing API key should prevent fake-provider engineering, but it does prevent claiming the live financial product works.

## 5. Updated decision and status

| Decision | Status |
|---|---|
| USDC/Arbitrum | Approved by the user |
| $10 platform-fee cap | Removed from active plan/model/tests |
| Subscriptions | Excluded |
| MoonPay-first hosted funding; Ramp fallback | Research recommendation; no partner account or production entitlement verified |
| Dinari US securities route | Selected candidate; actual instrument/network/fee/UI approval still required |
| Browser app | Current prototype reviewed; production vertical slice not yet built |
| Permissionless Solana QQQx for US launch | Not selected: technical transferability does not establish permitted US distribution |

No partner was contacted, contract accepted, financial account opened, app publicly deployed or money moved in this review. Required provider inputs belong in secure configuration, not a chat message or committed file.
