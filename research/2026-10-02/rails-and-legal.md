# Funding rails, securities structure, and legal closure register

As of October 2, 2026. **Confirmed here means a public primary source supports the stated rule or capability. It does not mean Blunts has approval, a contract, a license, or an individualized legal opinion.** No executed contracts, entity filings, provider-console eligibility, or legal opinions were supplied. The current code cannot accept or invest money. This review assumes US adults; international expansion needs a separate country-by-country analysis.

## Recommended route and alternatives

Cash App, Solana and EVM describe different layers. Cash App can be a user's source/destination of money; Solana/EVM are networks; a wallet provides keys/signatures; a regulated securities arrangement supplies the investment and accounts. Connecting a wallet solves none of the securities-access questions on its own.

**Current preference to validate:** the [fee-based wallet strategy](wallet-strategy.md): a dedicated customer wallet, one approved EVM network (Arbitrum is the candidate), USDC funding, an approved Dinari US investment conversion and user-paid Fill/Spark fees. Conventional brokerage is the fallback if it better satisfies that experience and lawful economics. Subscriptions are excluded. This recommendation selects a route for diligence, not a claim of contracted production availability. Do not build a bridge, issuer or AMM as v1.

| Route | Public feasibility | Friction / dependency | Decision |
|---|---|---|---|
| Cash App Pay merchant checkout | Merchant policy lists crypto and regulated financial-service businesses among prohibited categories | Merchant acceptance is not an investing funding API | **No-go under standard published policy**; no assumption of a private exception |
| Manual Cash App USDC send/receive | Published consumer feature supports USDC on Solana, Ethereum, Polygon, Arbitrum | User switches apps, selects supported network, pastes verified address/QR; account eligibility and limits | **Conditional funding option**, not “Cash App integration completed” |
| Cash App account/routing through a broker's ACH partner | Requires actual broker/bank support for that account type and debit/credit authorization | Account ownership, returns, holds, institution restrictions and permitted use | **Unproven**; do not infer from having routing numbers |
| Embedded EVM wallet + approved Dinari US program | Published US partner path and EVM chain documentation exist | KYB, agreements, KYC, US instrument/network enablement, wallet recovery, order/funding permissions | **Best token-route spike**, conditional on written program acceptance |
| External EVM wallet | Standard authentication/signing ecosystem | Browser/mobile handoff, gas, smart-account support, network mistakes; still needs approved securities account | Optional later for crypto-native audience |
| Solana wallet + US broker rails | Wallet tooling exists; Alpaca documents a crypto-wallet API with sandbox Solana examples | US production securities settlement and partner access must be established end to end | **Research alternative**, not a currently verified replacement |
| Solana + xStocks for US retail | xStocks documents US-person distribution restrictions | Tracker instrument rights differ from ordinary brokerage shares | **Not the US launch solution** |
| Cross-chain Solana-to-EVM bridge | Adds route, finality, bridge/operator, recovery and cost dependencies | A second chain does not create legal entitlement or customer value automatically | Defer until proven need and approved controls |

Primary sources: [Cash App merchant policy](https://developers.cash.app/cash-app-pay-partner-api/guides/partnerships/merchant-use-policy), [Cash App stablecoins](https://cash.app/help/us/en-us/31115-stablecoins), [Dinari networks](https://docs.dinari.com/docs/blockchain), [Dinari US program](https://docs.dinari.com/docs/us), [Alpaca crypto wallets](https://docs.alpaca.markets/us/docs/crypto-wallets-api), [xStocks FAQ](https://docs.xstocks.fi/docs/frequently-asked-questions), [xStocks legal structure](https://docs.xstocks.fi/docs/product-legal-overview).

### Cash App: what can actually be claimed

The consumer help page currently lists $1 minimum, $2,000/day and $5,000/week sending limits, $10,000/week receiving limit, and lower limits for newer accounts. It says stablecoins are unavailable for customers located in New York and sponsored accounts, with no send/receive fee currently charged. These are Cash App's published terms, not Blunts' supported coverage or an assurance for a particular account. Users must check their own available limits. No public authenticated API for Blunts to pull consumer stablecoin funds or prefill a guaranteed native payment was verified. A private partnership may exist, but the plan cannot depend on one.

Cash App's listed networks overlap Dinari's published list at **Ethereum and Arbitrum**. Solana and Polygon support at Cash App does not imply Dinari support; Base support at Dinari does not imply Cash App supports Base. Confirm the **US program's** actual network and instrument availability, not merely a generic chain list. Quote and display all Blunts/provider/network fees even where Cash App currently charges zero. [Cash App disclosures](https://cash.app/us/en/legal/bitcoin-disclosures) describe incompatible-network/asset loss risks; never promise recovery merely because an EVM address looks the same.

Minimum honest experience: “Send USDC on [approved network] from an eligible account” → server-issued verified user destination → copy/QR with clear network → optional supported app handoff → return to pending status → wait for actual finality/provider acceptance → explicit investment preview/confirmation. Cash App account identity is not a Blunts login, KYC, wallet ownership proof, or a bank-link consent. Cash App branding/marks and claims of partnership require permission and accurate representation.

### EVM versus Solana engineering scope

EVM login should follow [ERC-4361](https://eips.ethereum.org/EIPS/eip-4361): server nonce, expected domain/URI/chain, expiry, signature validation, one-time nonce use and session binding. Handle contract-wallet signatures where supported. Login signatures must be distinguishable from financial authorization. Never request unlimited approvals for convenience; show amount, recipient, chain, purpose, expiry, and revoke policy. Reject changed accounts/networks and unauthorized providers server-side.

Solana's [Mobile Wallet Adapter](https://docs.solanamobile.com/get-started/mobile-wallet-adapter) supplies message/transaction connections, not broker access. Validate the exact supported wallets and OS transports in the spike; do not promise every Android approach works on iOS. Scope signatures to origin/challenge/expiry, validate the expected public key, verify token mint/program/decimals, handle blockhash expiry, commitment/finality, associated token accounts, fee payer and rejected/retried signing. A successful RPC signature submission is not settled customer money. Wallet address authentication must not bypass KYC.

For either network, embedded recovery, device loss, provider outage and compromised session controls are separate from key custody. [Privy authentication](https://docs.privy.io/authentication) and [wallet policy controls](https://docs.privy.io/security/wallet-infrastructure/policy-and-controls) are candidate capabilities, not proof of a self-custody legal classification. Obtain a signer/authority diagram that includes admin recovery, export, server policies, delegated signers and vendor powers. Restrict any sponsored gas wallet's budget and contract allowlist.

### Securities and money flow to approve

```text
Customer login and verified legal identity
  -> approved broker/program account + agreements
  -> customer-specific allowed funding destination
  -> validated/settled funding (provider/chain/bank records)
  -> explicit expiring order preview and customer instruction
  -> regulated execution/custody arrangement
  -> confirmations, holdings, cash, corporate actions and tax records
  -> explicit sale -> actual settlement -> available withdrawal balance
  -> verified permitted payout destination -> receipt and reconciliation
```

The [Dinari US guide](https://docs.dinari.com/docs/us) identifies its securities/clearing arrangement, requires partner onboarding and approved customer flows, and describes dedicated wallets and restricted US dShares. Its US settlement design must be followed rather than copying an international token flow. The exact instrument's rights, transfer restrictions, distributions, tax handling, cash and insolvency treatment need approved customer language. Do not advertise US dShares as freely transferable DeFi assets or equivalent to every offshore tracker. A software API accepting a fee parameter does not establish a legal right to that fee.

## Legal closure register

**All legal gates below remain open for Blunts unless evidence is later attached.** “Owner” is the accountable role to appoint. These issues are addressed with concrete closure requirements, not declared resolved by this research. Federal analysis is insufficient for a nationwide launch; counsel must produce a state matrix and a facts-specific opinion for the final architecture.

| ID | Issue and current conclusion | Required closure evidence | Owner |
|---|---|---|---|
| L01 | Entity, beneficial owners, contracts and operating authority unverified | Entity/cap table/IP assignments; KYB acceptance; authorized signatories; vendor agreements | Founder/counsel |
| L02 | Brokerage activity depends on actual solicitation, execution role, control and compensation | Written role/registration/exemption analysis plus broker agreement; staff activity restrictions | Securities counsel |
| L03 | Transaction-linked compensation is material; a fee labeled “technology” is not automatically exempt | Approved retained-revenue schedule, paying entity, collection/refund mechanics and Rule 2040 analysis | Counsel/finance/broker |
| L04 | QQQ default selection, advice, personalization, automation and discretion can change adviser analysis | Advice versus execution-only scope; state/federal adviser analysis; approved customer flow | Adviser counsel |
| L05 | Prototype 10% gains fee is unsuitable as an assumed retail revenue model | Delete from production specification unless counsel approves applicable performance-fee eligibility and disclosures | Counsel/product |
| L06 | Tokenization does not remove securities laws or define ownership by itself | Instrument prospectus/agreements; holder rights and insolvency analysis; permitted transfer/redemption design | Broker/counsel |
| L07 | Federal money transmission/AML scope depends on conduct, including moving value for others | Funds/control diagram; FinCEN analysis; responsible AML/CIP/SAR entities and written delegation/oversight | Payments counsel/compliance |
| L08 | State transmission/virtual-currency rules are not automatically displaced | State-by-state launch/relocation matrix; licenses/exemptions/agency basis, especially NY and CA | Payments counsel |
| L09 | Sanctions exposure persists even with a licensed partner | Screening ownership, geolocation controls, escalations, blocked/rejected property procedures and records | Compliance |
| L10 | Custody/control claims depend on recovery and signing powers, not a marketing label | All signers/admin controls documented; contractual and technical limits; lost-key/insolvency outcome | Security/counsel |
| L11 | Bank/ACH permissions and error/return duties unverified | Originator/bank approval, authorization text, holds/returns/disputes/refund procedures, Reg E scope | Payments/legal |
| L12 | Market data, execution, conflicts and instrument appropriateness | Data licenses, trade-preview requirements, execution responsibilities, conflict/recommendation review | Broker/product |
| L13 | Customer property protections must be precisely described | Approved FDIC/SIPC/custody wording for each asset/location; no implication of market-loss insurance | Counsel/broker |
| L14 | Tax and reporting responsibilities unresolved | W-9/W-8 workflow; 1099-B/DIV/DA applicability by actor/instrument; basis and correction ownership | Tax counsel/broker |
| L15 | Privacy, security and breach obligations span roles and states | Data inventory, GLBA/Reg S-P/FTC/CCPA scope, notices/consents, DPA, retention, vendor and breach plan | Privacy counsel/security |
| L16 | Deletion is not destruction of required financial records | Approved retention schedule and restricted archive; closure/deletion/export procedure and customer explanation | Compliance/operations |
| L17 | Marketing, influencer/reward programs and gamification require review | Approved claims, substantiated dated performance, balanced risks, endorsement disclosures, retained approvals | Broker marketing/legal |
| L18 | Cannabis identity is a distribution/brand risk, not proof this financial product sells cannabis | Trademark clearance, artwork/music/font rights, partner brand acceptance and store-facing review | Brand/IP counsel |
| L19 | App-store publisher and financial permissions not established | Institution publishing/distribution agreement, licenses/letters, verified console organization and review packet | Founder/broker |
| L20 | Customer age, residency, tax status and restrictions not established | Provider-approved eligibility rules enforced server-side; no minors or international rollout by assumption | Compliance |
| L21 | Terms and consumer treatment incomplete | Approved terms, risk/fee/conflict disclosures, complaints/error resolution, accessibility and support obligations | Counsel/operations |
| L22 | Recurring/automatic investments and advisory features expand obligations; subscriptions are excluded | Separate consent, scope review and signed feature approval before adding automation/advice; no subscription implementation | Product/counsel |
| L23 | Business continuity, vendor failure and wind-down need funding | Export/transfer/closure rights, communication plan, escrow/access if appropriate, insurance and runway | Founder/operations |
| L24 | 2026 SEC interface statement is conditional staff guidance, not blanket law | Counsel evaluates every condition against final UI, remuneration, routing and control; tracks expiration/change | Securities counsel |
| L25 | September 2026 innovation exemption is venue-specific conditional relief | Do not rely on it for this broker-app route; separate counsel project if proposing an eligible TSV | Securities counsel |
| L26 | Stablecoin use is different from issuing a stablecoin | Identify licensed issuers and allowed assets; assess current federal/state framework and counterparty risks | Payments counsel |

### Primary legal sources and what they establish

- [SEC broker-dealer registration guide](https://www.sec.gov/about/divisions-offices/division-trading-markets/division-trading-markets-compliance-guides/guide-broker-dealer-registration) and [FINRA Rule 2040](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2040): facts and compensation matter. A per-funded-account payment is still activity-linked; replacing “commission” with “fixed fee” does not settle status. A genuine software retainer also needs counsel review of actual activities. **L02–L03**.
- [SEC performance-fee framework](https://www.sec.gov/rules-regulations/2021/11/performance-based-investment-advisory-fees): restrictions/qualified-client requirements make gains fees a material issue. Do not assume the target retail audience qualifies, or treat a current proposal as enacted law. **L04–L05**.
- [FinCEN 2019 CVC guidance](https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-certain-business-models): software and value transmission are evaluated by business conduct. [NYDFS guidance](https://www.dfs.ny.gov/virtual_currency_businesses) distinguishes software itself from regulated uses. [California DFAL guidance](https://dfpi.ca.gov/regulated-industries/digital-financial-assets/) identifies a July 1, 2026 licensing/application regime; analyze actual exclusions and application status. **L07–L08**.
- [OFAC virtual-currency guidance](https://ofac.treasury.gov/recent-actions/20211015), [CFPB Regulation E](https://www.consumerfinance.gov/rules-policy/regulations/1005/), [IRS digital assets](https://www.irs.gov/filing/digital-assets) and [1099-DA instructions](https://www.irs.gov/instructions/i1099da): sanctions, transfer-error and tax responsibilities must be allocated by role, not assumed away because settlement is on-chain. **L09, L11, L14**.
- [SEC Reg S-P amendments](https://www.sec.gov/rules-regulations/2024/06/s7-05-23), [FTC Safeguards Rule guidance](https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know), [California privacy guidance](https://oag.ca.gov/privacy/ccpa): determine covered entities/data and contractual flow-downs. Do not assume a financial-data exemption covers every website analytics record. **L15–L16**.
- [FINRA Rule 2210](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210) governs member communications and approval/content duties; partner obligations affect distributed app copy. [Invesco's QQQ disclosures](https://www.invesco.com/qqq-etf/en/home.html) distinguish dated historical performance from future results. Preserve methodology and source dates, explain concentration/losses and fees, and do not project historical double-digit returns into the business case. **L12, L17**.
- The [April 2026 SEC staff interface statement](https://www.sec.gov/newsroom/speeches-statements/staff-statement-regarding-broker-dealer-registration-certain-user-interfaces-utilized-prepare-staff-statement-regarding-broker-dealer-registration-certain-user-interfaces-utilized) sets conditions for specified self-custody interfaces. Staff statements lack the force of Commission rules. Its applicability to this product, default asset, routed orders and compensation has not been established. **L24**.
- The [September 17, 2026 operative SEC order, Release 34-106402](https://www.sec.gov/files/rules/exorders/2026/34-106402.pdf), provides temporary conditional TSV/dealer relief, with eligibility, rights, venue and trading constraints. It excludes synthetic linked exposures from its definition and does not generally waive every intermediary obligation. ETF/asset eligibility must be established under the order and selected structure, not assumed from the word “stock.” No TSV implementation is recommended here. **L25**.

## Exact partner diligence packet

Prepare one version-controlled packet before requesting a commercial quote: legal entities and audience; screenshots/claims/brand; custody and all signers; named asset/rights; states and customer eligibility; every funds hop and beneficiary; buy/sell/withdrawal sequence; fee collection and retained revenue; data flows/retention; support/AML/fraud/complaint ownership; publisher identity; wind-down plan. Request written answers to:

1. Is this exact US retail instrument and network production-enabled for us? What is excluded?
2. Who legally holds shares/cash/tokens at every step, and what can a customer transfer/redeem?
3. Who receives which customer charge, and under what registration/exemption/contract?
4. Can Cash App-origin USDC be accepted and returned on the selected network? What verification and limits apply?
5. Are bank/ACH funding and payout permitted, and who bears reversals and negative balances?
6. What are minimums, per-account/trade/quote/withdrawal charges, inactive-account fees, reserves, termination fees and SLAs?
7. Which screens, claims, documents, release changes and marketing need approval?
8. Who can publish the native app, and what evidence will be supplied to each store?
9. What sandbox differences, webhooks, reconciliation files, corporate actions and tax documents exist?
10. How do accounts and customer assets remain accessible during outage, vendor termination or Blunts shutdown?

**Decision rule:** no real-money launch until the answers, contracts, counsel analysis and operational tests agree. Public documentation establishes that several routes are technically plausible; it cannot confirm that Blunts is legally cleared.
