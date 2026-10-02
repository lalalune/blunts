# Blunts: US-Ready Stack (Dinari vs Alpaca), Fee Model and App Store Fees

**Date:** 2026-09-28 | **Status:** Research memo. It is NOT legal or tax advice. Items tagged **[UNVERIFIED]** could not be confirmed against a primary source in this pass. Numbered citations like [D3] point to the Sources list at the end.

Builds on `01-onramps-offramps.md`, `02-tokenized-stocks.md` and `03-legal-tax-compliance.md`. It doesn't redo them.

---

## TL;DR

1. **The founder's Dinari claims check out.** Every claim he pasted is confirmed word for word in Dinari's own US integration guide and quickstart [D1][D2]:
   - no broker-dealer registration needed for the partner;
   - partner acts as an introducing/referral platform;
   - Dinari Securities LLC is the broker-dealer;
   - REST API, SDKs and a white-label UI;
   - KYC handled by Dinari;
   - US tokens are non-transferable with no DeFi;
   - one wallet per verified account, no omnibus.

   Three catches:
   - **US accounts settle in USDC only.** The "yield-bearing dollar" (USD+) is effectively not available to US users.
   - **Partners may not make "recommendations."** A pre-set basket is a compliance question before it's an API question.
   - **There is a $0.20 network fee per order.** A $5 fill split across 9 stocks costs $1.80 (36%) unless Blunts absorbs it or buys a single ETF.
2. **Every ticker we want is on Dinari's list** [D6][D7]: NVDA, MSFT, AAPL, GOOGL, AMZN, META, AVGO, TSLA, PLTR, **SPCX (SpaceX)**, **QQQ**, VOO and SPY. QQQ, the megacaps and SPCX even trade on weekends (limit orders).
3. **Alpaca Broker API is the "boring" path, and the better fit for a fixed basket.** It has:
   - fractional orders from $1 (really no hard minimum);
   - a Rebalancing/Portfolios API built for exactly this;
   - ACH through Plaid, plus stablecoin funding (June 2026);
   - 1099s and Roth/Traditional IRAs;
   - a per-order partner `commission` field.

   **But Alpaca's current docs list only broker-dealers and SEC-registered RIAs as partner types** [A1]. Blunts would likely need to be an RIA anyway if it picks the basket.
4. **Alpaca's Instant Tokenization Network is institutional only** (issuers and authorized participants). It is **not** a US retail path [A8]. Coinbase, Ondo and xStocks tokens that sit on Alpaca are all still non-US.
5. **The Cash App path works end to end, with caveats.** The route is Cash App → USDC on Arbitrum → the user's own embedded wallet → Dinari. Caveats:
   - it is not available in NY;
   - limits are $2k/day send and $10k/week receive;
   - each user needs a dedicated, KYC-linked wallet;
   - Blunts must run OFAC screening on the funding wallet;
   - withdrawals come back as USDC. Dinari has no documented USD bank payout.
6. **Fee model.** A % fee on sells ("spark") is legal only if the **broker-dealer charges it as a disclosed commission** (Dinari's `fee` parameter or Alpaca's `commission` field) **or** if Blunts is an **RIA charging a disclosed advisory fee**. Blunts can't take transaction-based pay as an unregistered finder. It's not a §205 performance fee. See §A.
7. **Apple and Google take 0% of deposits, withdrawals, trades or trading fees.** Only a subscription that unlocks app features is exposed to IAP. Bill it from the brokerage account like Robinhood Gold and Acorns do, and it's 0% too. See §B.

**Recommendation in one line:** ship v1 as an **RIA-lite on Alpaca Broker API** (fractional basket, ACH + Cash App USDC funding, Roth IRA). Run a **Dinari pilot** in parallel as the "on-chain / crypto-native" SKU once the basket-recommendation and per-order-fee questions are answered in writing. Rationale is in §5.

---

## 1. Dinari: claim-by-claim verification

### 1.1 The founder's claims

| Claim | Verdict | Evidence |
|---|---|---|
| API lets apps offer "U.S. equities and a yield-bearing dollar, on-chain, without becoming a broker-dealer yourself" | **Confirmed, verbatim** | Quickstart [D2]. The yield-bearing dollar (USD+) isn't usable as the US settlement token (§1.8) |
| Partners are introducing/referral platforms; Dinari Securities LLC is the BD | **Confirmed** | US guide: partners "act solely as introducing or referral platforms." They may not do trade execution, **recommendations**, or FINRA 3110 supervisory reviews. They must describe themselves as a "technology integration partner" or "introducing platform" [D1] |
| REST API + SDK + white-label widget | **Confirmed** | API v2 (required for US). SDKs in TypeScript (`@dinari/api-sdk`), Python, Java, Go [D2]. The white-label "Hosted Trading" UI (marketed as the "Embedded Trading App") can be Dinari-hosted at `[partner].dinari-hosted.com` or self-hosted with source code under a perpetual license [D3] |
| KYC/AML by Dinari | **Confirmed, two modes** | **Managed KYC:** API returns a URL for an embedded Persona flow; US support added 2026-07-09; "additional fees may apply." **Partner KYC:** submit data via API; needs an approved vendor (Persona, Onfido, Sumsub, Plaid, Stripe Identity) plus your AML program docs and audits [D4][D5] |
| US tokens non-transferable, restricted from DeFi | **Confirmed** | Quote: "Issued tokens are currently non-transferrable and are restricted from use in DeFi protocols." Your UI must say so. Wrapped dShares aren't available to US users [D1] |
| Each US wallet maps to one verified brokerage account (no omnibus) | **Confirmed** | Quote: "All US customer wallets must be uniquely associated with verified brokerage accounts; partners may not re-use or pool wallet addresses." The wallet must not already hold dShares. Dinari sends an on-chain verification transfer first [D1] |
| Bitcoin.com US launch Sept 15, 2026 | **Confirmed** | First deployment of the Embedded Trading App, inside Bitcoin.com Wallet, 724 assets. Fees and minimums not disclosed [D10][D11] |
| Alpaca ITN mints into Ondo/xStocks/Coinbase tokens across Solana/Base/Arbitrum/Robinhood Chain | **Confirmed, but institutional only** | See §2.2 [A8] |

**Regulatory facts:** Dinari Securities LLC is CRD #329672 and SEC# 71215. FINRA approved it 2025-06-20. It holds **53 state registrations**, which covers all 50 states plus DC, PR and VI, **including New York**. It clears through **Alpaca Securities LLC**, which Dinari's Form CRS calls an affiliate [D8][D9]. Dinari Inc. is an SEC-registered transfer agent.

### 1.2 Partner onboarding

1. Sign up at **partners.dinari.com**. You get sandbox access with a USDC faucet [D2][D12].
2. Go to production: KYB, production keys, mainnet contracts [D12].
3. **US add-ons** [D1]. The last three bullets came only through a summarizer and couldn't be confirmed in the raw text **[UNVERIFIED]**.
   - extra KYB and a **signed supplemental US partner agreement**;
   - Dinari's approval of your UI;
   - a live US test account for audits;
   - named compliance and technical contacts;
   - **SOC 2 Type II or ISO 27001** (or an annual security questionnaire) and an annual pen test;
   - real-time pushes of onboarding and transaction events;
   - answering data requests within 2 business days and reporting incidents within 24 hours;
   - **pre-approval of all marketing under FINRA Rule 2210**;
   - quarterly compliance audits of disclosures and consent capture.
4. **Mandatory UI elements** [D1]:
   - the exact offering copy "Access brokerage services in the US with Dinari Securities LLC";
   - six T&C checkboxes, including Alpaca arbitration;
   - a non-professional attestation;
   - verbatim Dinari and Alpaca disclosure links;
   - trusted-contact capture;
   - **NBBO (the best current market price) shown on the pre-trade screen.**

> Implication for Blunts: the "dead-simple 2-button" UX still has to include a pre-trade quote screen and a multi-checkbox onboarding. SOC 2 Type II is a real cost for a startup: roughly 3–6 months and $20–60k via Vanta or Drata **[UNVERIFIED estimate]**. Ask whether the questionnaire alternative is acceptable at launch.

### 1.3 Fees and pricing

**What Dinari charges partners** [D13]:

| Item | Price |
|---|---|
| API access | **"starting at $2,000 per month"** |
| Network fee | **$0.20 flat per order**, variable on Ethereum mainnet. Can be billed monthly in arrears |
| Market data (US) | **$0.0075 per SIP quote** during regular hours. No caching allowed. A cap for non-professionals is "coming soon" [D1] |
| USDT conversion | Oracle rate plus 3 bps (n/a for US, which is USDC only) |
| OTC | $25k minimum, spread up to about 10 bps |
| Managed KYC | "Additional fees may apply" **[UNVERIFIED amount]** |

**What end users pay:**
- Dinari's Form CRS says commissions are charged "on a transaction basis that varies based on the notional valuation of your trade." Regulatory, exchange and clearing fees are absorbed [D9].
- **No public retail commission schedule was found [UNVERIFIED].**

**How partners earn:**
- Orders have an optional **`fee` field** (USD, up to 6 decimals) that is added into `payment_amount`. Example: $150 buy + $0.25 fee = $150.25 [D13].
- The API reference labels it "for DFN orders." **Whether this is the partner-revenue mechanism for US orders, who legally charges it (it should be the BD), and whether it can be applied to sells only are all [UNVERIFIED]. Ask Dinari.**
- No revenue-share terms are published.

### 1.4 Order size, fractional shares, hours

- **Minimum order: none documented.** `payment_amount` is USD with 2 decimals [D14]. **Whether a $0.55 order is accepted is [UNVERIFIED].**
- **Fractional shares:** allowed where the stock's `is_fractionable` flag is true [D15]. Non-fractionable names are limit-only.
- **Order types:** market and limit only. Time in force: DAY, GTC (up to 90 days), IOC, FOK [D16].
- **Hours** [D17][D6][D7]:
  - regular 9:30–16:00 ET;
  - extended 4:00–9:30 and 16:00–20:00;
  - overnight 20:00–4:00;
  - weekend "24/7" session for **SPY, QQQ, AAPL, AMZN, META, MSTR, NVDA, SPCX, TSLA** only.
  - Outside regular hours, orders must be limit orders.
  - Whether all sessions apply to US accounts is **[UNVERIFIED]**.
- **Basket orders: no basket endpoint** (only batch cancel) [D18]. A $5 fill across 9 names means **9 orders × $0.20 = $1.80**. Options:
  - **(a)** use **QQQ alone** for small fills (one order, $0.20, 4% on $5, 0.2% on $100);
  - **(b)** batch users' fills and only buy basket legs once a user's pending cash is ≥ $X;
  - **(c)** negotiate the network fee down;
  - **(d)** Dinari "**Alloys**" (`alloy_id` on orders) look like Dinari-built baskets or index tokens. Details and US availability are **[UNVERIFIED]**. alloy.dinari.com returned a 503.

### 1.5 Chains, funding, withdrawals

- **US chains** at launch: Ethereum, **Arbitrum**, Base, Avalanche. **Arc** (Circle's L1) was added 2026-09-16 [D19][D20]. **Solana and Sei are still "coming soon"** (no launch found). Third-party sources call Arbitrum Dinari's primary chain [D21].
- **Funding:** "**USDC is the only supported settlement stablecoin for US jurisdiction accounts**," via Circle [D1].
  - The US guide mentions accounts being "pre-funded (via ACH)," but **no ACH flow is documented [UNVERIFIED]**.
  - Licensed money transmitters can run a "Funding Facilitation Account" (USD by wire).
- **Withdrawals:** sell to USDC, then the withdrawal API sends USDC to the user's wallet [D22]. **No USD-to-bank payout for US users is documented.** Getting back to dollars means USDC → Cash App, Coinbase, or another off-ramp.

### 1.6 Assets

- On the list [D6][D7]:
  - **all 9 core names** (NVDA, MSFT, AAPL, GOOGL, AMZN, META, AVGO, TSLA, PLTR);
  - **SPCX** (listed as "Space Exploration Technologies Corp. Class A");
  - **QQQ, VOO, SPY**, and about 100 ETFs overall.
- 724 names at launch, including the full S&P 500.
- Per-ticker US eligibility should be checked via `is_tradable` in Get Stocks **[UNVERIFIED per ticker]**.

### 1.7 Dividends, corporate actions, taxes

- **Dividends:** paid in **USDC** per launch materials [D23]. General docs say USD+ (probably the non-US default). Minimum payout is $0.10 [D24].
- **Corporate actions and proxy voting** flow through Dinari's BD systems. A verified email is required [D1].
- **Taxes:** **1099-DIV** is issued by Dinari Securities [D25]. **1099-B (sales) isn't mentioned in the docs [UNVERIFIED]**. It should be required, because a BD that clears through Alpaca is a securities broker under §6045. dShares are securities, not "digital assets," so **1099-DA shouldn't apply**. Confirm in writing.

### 1.8 The yield-bearing dollar (USD+)

- USD+ is a daily-rebasing token "100% backed by short-term US treasuries and USD." It pays **3.72%** (as of 2026-09-21) [D26][D27].
- It is minted with USDC or USDT and redeems to USDC in 0–3 days.
- It is **not** a registered money market fund.
- **For US users: effectively unavailable [UNVERIFIED].** US accounts must settle in USDC, and no US eligibility statement for USD+ exists.
- Don't pitch "earn yield on idle cash" on the Dinari path until Dinari confirms. Note: Venmo and PayPal already advertise about 4% on PYUSD (see file 01).

### 1.9 Wallets

- Dinari supports **Dinari-managed wallets** and **external wallets linked by signing a nonce** [D28].
- For US users: "EOA and standard smart contract wallets" on any supported chain, **dedicated per user** [D1].
  - So **a Privy or Turnkey embedded wallet per user should be allowed**. Privy (owned by Stripe) and Para were named launch partners [D19][D29].
  - Explicit written approval of the specific wallet setup (especially smart-contract/AA wallets with a paymaster) is **[UNVERIFIED]**.
- "White-labeled non-custodial wallet services are coming soon" [D1].
- Account model: Entity → Account → Wallet (1:1) [D30].

### 1.10 IRA, states, accreditation

- **IRA:** nothing found. **Assume not supported.**
- **States:** 53 BD registrations including NY [D8]. NY users are still blocked on the **Cash App** leg (Cash App excludes NY) but not by Dinari.
- **Retail allowed:** an accreditation attestation is optional and only unlocks private or unregistered products [D1]. Eco.com's "Reg D 506(c) / Reg A+" description is outdated.

### 1.11 Baskets and model portfolios, and whether Blunts becomes an RIA

- There is **no model-portfolio or basket order API** on Dinari [D18].
- The partner **may not make recommendations** [D1].
- A Blunts-chosen fixed basket that every user's money automatically goes into is very likely either:
  - **(i)** a *recommendation* under Reg BI. That's the BD's problem, and Dinari must approve the basket and its disclosure. Or
  - **(ii)** *investment advice* by Blunts. Blunts is then an **investment adviser**: register as an RIA with the SEC (usually ≥ $100M AUM, or via the **internet-adviser exemption**, Rule 203A-2(e)) or with the states.
- The cleaner framing that keeps Blunts out of advice is **"the user picks QQQ" (one ETF)**. Choosing one broad index fund themselves is plainly a self-directed choice. **Counsel must confirm.** File 03 already recommended the RIA route.
- **Bottom line:** *if we pick the basket, plan on being an RIA.* The **internet adviser exemption** lets a purely online adviser register with the SEC below $100M AUM. Cost is roughly $15–40k in legal fees and 45 days of SEC review **[UNVERIFIED estimate]**. It also opens the door to charging a flat advisory fee legally (§A).

---

## 2. Alpaca

### 2.1 Broker API for US retail (the non-token path)

| Topic | Finding |
|---|---|
| Who can be a partner | Current docs list **registered broker-dealers** (fully-disclosed or omnibus) and **SEC-registered RIAs** [A1][A2]. The older "trading/investing app, no license" model appears only in third-party guides and a stray account-opening reference [A3]. **Ask sales whether a non-RIA fintech can still onboard [UNVERIFIED].** |
| Onboarding | Commercial terms → sandbox → production access → KYC compliance review → live. No published timeline [A4] |
| KYC | Alpaca-run automatic KYC, or partner KYC via the CIP endpoint (Onfido tokens supported) [A3] |
| Fractional shares | Dollar-amount ("notional") market and limit orders, day only. "As little as $1" in marketing, **no hard minimum** in the spec, 9-decimal precision. Check each ticker's `fractionable` flag [A5] |
| 24/5 | Overnight 8 PM–4 AM ET via the Blue Ocean ATS. **Limit orders only**, so overnight dollar-amount market orders don't work. Queue them until the open. Enabled by your CSM [A6] |
| **Rebalancing / Portfolios API** | Define a portfolio (weights across tickers plus cash) and subscribe accounts to it. It rebalances on drift or a calendar, and **new cash automatically buys toward the target weights** [A7]. This *is* the Blunts basket engine. Marketed to "investment advisors." Whether it strictly requires RIA status is **[UNVERIFIED]** |
| Funding | ACH through Plaid; wires; Journals (firm → user); **Instant Funding** (partner fronts buying power and settles T+1; default limit $1k per account); **stablecoin funding** (USDC and USDT, USDG planned; converted to USD; withdrawals supported; June 2026). Stablecoin chains and fees are **[UNVERIFIED]** [A9][A10][A11] |
| Tax forms | 1099 composite (DIV, INT, B, OID, MISC). Statements and confirms via the Documents API, brandable for fully-disclosed BDs [A12][A13] |
| IRA | **Traditional and Roth** via Broker API, enabled by Alpaca. Contributions need a `tax_year`. There's a contribution-limit endpoint. No rollovers or transfers in [A14] |
| Pricing | "Commission-free"; API pricing is negotiated. Pass-through SEC/FINRA fees on sells. The Sept 17, 2026 fee schedule shows free ACH and $0 inactivity **[UNVERIFIED read]** [A15][A16] |
| **Partner commission** | Order fields: `commission` plus `commission_type` = `notional` (flat per order), `qty` (per share) or `bps` (percentage). You must "contact Alpaca first to set up the commission structure." There's no buy/sell-side switch, **but because it's set per order you can send it only on sells** (confirm that's allowed contractually) [A17] |
| States | All 50 states plus DC accepted by the API [A18] |

### 2.2 Instant Tokenization Network (ITN)

- **What it is:** 24/7 in-kind mint and redeem of tokenized stocks against shares held at Alpaca. Launched 2025-10-02 [A8][A19].
- **Issuers and chains:** xStocks, Ondo, Backed, Binance, Coinbase and others. Chains include Arbitrum, Base, Ethereum, Solana, **Robinhood Chain**, HyperEVM, TON, Tron and Mantle.
- **Who can use it: token issuers and licensed Authorized Participants only.** It is **not usable by US retail end users or a consumer app**.
  - Every token minted through it for consumers (Coinbase's Base tokens, xStocks, Ondo Global Markets) is **not available to US persons** [A20][O1][C1].
  - Alpaca clears or custodies about 94% of tokenized US equities, including Dinari's underlying shares.
- **Watch items:**
  - SEC **Innovation Exemption** (2026-09-17) for Tokenized Securities Venues [A21];
  - the Bullish/Alpaca/Apex/DriveWealth **Issuer Sponsored Token Coalition** (2026-09-24) [A22].

  Neither creates a retail path for Blunts today.

### 2.3 Other Alpaca facts

- Raised $150M Series D at a $1.15B valuation (Jan 2026) and $435M equity plus debt (Jul 2026) [A23][A24].
- Kraken's US stock trading runs on Alpaca [A25].
- No Blunts-style US micro-investing app on the Alpaca Broker API was found.

---

## 3. Funding path: Cash App USDC → Arbitrum → Dinari

```
User's Cash App $ ──(Cash App "send USDC", Arbitrum, fee-free to start)──►
  User's OWN Privy embedded wallet on Arbitrum (1 wallet ↔ 1 Dinari account)
     │  Blunts: OFAC-screen the source address; gas via paymaster
     ▼
  Dinari API: market buy dQQQ (or basket legs) with USDC, EIP-712 permit
     ▼
  dShares minted to the same wallet (non-transferable)
Spark: sell → USDC to the wallet → Blunts sends USDC (Arbitrum) to the user's Cash App USDC address
```

**Does it work? Mostly yes.**

| Check | Status |
|---|---|
| Cash App can send USDC on Arbitrum to any external address | **Yes.** It converts dollars 1:1 to USDC on send and USDC back to dollars on receive. Fee-free "to start." Identity verification required [CA1][CA2] |
| Cash App limits | $2,000/day and $5,000/week send; $10,000/week receive [CA3] |
| NY / teens | **Not available in NY** or on sponsored (teen) accounts [CA3]. NY users need Coinbase or another path |
| Dinari accepts USDC on Arbitrum for US accounts | **Yes** [D1][D19] |
| Wallet must be KYC-linked and dedicated | Yes. One Privy wallet per user, created *after* Dinari KYC approval and linked to the account. Don't reuse a deposit address across users [D1] |
| Privy universal deposit addresses | Persistent per-user address; bridges and swaps inbound funds [P1]. **Careful:** the address that *receives* funds must be the user's dedicated wallet (or route to it). A shared deposit or relayer contract could look like pooling. Get Dinari to approve the flow **[UNVERIFIED]** |
| Signing | Orders are placed with a USDC permit (EIP-712) from the user's wallet [D31]. With a Privy embedded wallet the signature is invisible to the user |
| Wrong-network risk | Cash App warns sends are irreversible [CA2]. The UI must lock the "Arbitrum" choice and show a QR/deep-link |
| Money transmission | Blunts moves USDC from the user's own wallet (which the user controls via Privy) to the user's own Cash App. Keeping it truly user-controlled (non-custodial) avoids a money-transmitter license. If Blunts ever pools or holds keys, it needs an MSB/MTL analysis **[counsel]** |

**Other on-ramps:**
- **Venmo / PayPal PYUSD:**
  - PayPal and Venmo can send PYUSD to external wallets. PayPal supports Arbitrum [PP1][PP2]. Venmo's help page lists Ethereum and Solana, not Arbitrum **[UNVERIFIED for Venmo-Arbitrum]**. Network fees apply.
  - **Dinari US accepts USDC only**, so PYUSD must be swapped to USDC first: a DEX swap in the user's wallet, or Privy auto-swap. That's an extra step and a small spread.
- **Coinbase Onramp:** card, ACH or Apple Pay → native USDC delivered on Arbitrum. **Zero-fee USDC for approved partners** (apply via your account rep) [CB1][CB2]. Coinbase is BitLicensed, so it **covers NY**. Guest checkout ended 2026-06-30, so users need a Coinbase account (file 01).
- **Alpaca path:** plain ACH via Plaid (no crypto), plus Alpaca stablecoin funding if we want Cash App USDC in. Stablecoin chains are **[UNVERIFIED]**.

---

## 4. Comparable live US apps

| App | Rails | UX / fees |
|---|---|---|
| **Bitcoin.com Wallet** (Sept 15, 2026) | Dinari Embedded Trading App inside a self-custody wallet | Browse, trade and see portfolio without leaving the wallet. Dinari does KYC. 724 assets. **Fees undisclosed** [D10][D11] |
| Dinari launch partners (Monaco, Axal, Kredete, Yield.xyz, Liminal, Eldora; Privy and Para as wallet infra) | Dinari API | No per-partner US detail published. Eldora is live in Southeast Asia, not the US [D19][D32] |
| **Kraken** (US stocks) | Alpaca | Commission-free fractional stocks and ETFs, state-by-state rollout since April 2025 [A25] |
| **Robinhood / Coinbase / Ondo tokenized stocks** | Own/Alpaca | **Not available to US persons** [C1][O1] |
| Acorns / Stash / Public / Robinhood Gold | Own BDs or clearing | Subscription models (see §A.3) |

---

## 5. Recommendation: the "ship in about 90 days" stack

### 5.1 Why Alpaca for v1 and Dinari as a pilot

| | **Alpaca Broker API (+ Blunts as RIA)** | **Dinari API (Blunts as introducing platform)** |
|---|---|---|
| Fixed basket | **Native** (Portfolios/Rebalancing API) | No basket endpoint. "No recommendations" rule |
| $5 fill across 9 names | No per-order fee; fractional to 9 decimals | $0.20 × 9 = $1.80 (36%) unless absorbed or single-ETF |
| Cash App / Venmo funding | Stablecoin funding (chains **[UNVERIFIED]**) or ACH | **Native USDC on Arbitrum** |
| Withdraw to USD | ACH (free) | USDC only, so via Cash App or an off-ramp |
| Roth IRA | **Yes** | No |
| 1099-B | Yes | 1099-DIV confirmed; 1099-B **[UNVERIFIED]** |
| Weekend trading | No (24/5 limit orders) | Yes for QQQ, NVDA, TSLA, SPCX and others (limit) |
| Fixed cost | Negotiated | **$2k/month minimum** plus market data plus SOC 2 |
| "On-chain" story | None (off-chain shares) | Real tokenized shares in the user's wallet |
| License Blunts needs | RIA (SEC internet-adviser or state) | None for Dinari itself, but likely an RIA anyway if Blunts picks the basket |

The basket is the product, and a basket means advice. So Blunts should become an RIA either way, and Alpaca is built for RIAs running model portfolios. Dinari is the right "phase 1.5" for the crypto-native pitch and weekend buying, once Dinari confirms basket approval, the sells-only `fee`, per-order fee relief and a Privy wallet setup.

### 5.2 Stack diagram (v1, Alpaca)

```
            ┌─────────────── Blunts app (iOS/Android/web) ───────────────┐
            │  [FILL]  [SPARK]   balance, Roth toggle, tax stash          │
            └──────┬───────────────────────────────┬──────────────────────┘
                   │                               │
     Onboarding/KYC│ (Alpaca KYC or Persona)       │ Blunts backend (RIA ops, Form ADV,
                   ▼                               │ fee engine, OFAC, audit logs)
     ┌──────────── Alpaca Broker API ─────────────┐│
     │ Accounts (taxable + Roth IRA)               ││
     │ Portfolios/Rebalancing: "Blunt" model       │◄┘
     │   NVDA MSFT AAPL GOOGL AMZN META AVGO       │
     │   TSLA PLTR (SPCX)  or  QQQ-only model      │
     │ Commission field (on sells) → Blunts        │
     │ Documents: statements, 1099s                │
     └──▲──────────────▲──────────────────▲───────┘
        │ACH (Plaid)   │Stablecoin funding│Instant Funding ($1k)
        │              │(USDC)            │
   Bank acct     Cash App USDC /      Blunts float
                 Coinbase Onramp      (credit risk)

Phase 1.5 (Dinari pilot): Privy wallet per user on Arbitrum ← Cash App USDC
   → Dinari API market buy dQQQ / basket legs → dShares in user wallet
```

### 5.3 90-day plan

| Weeks | Work |
|---|---|
| 0–2 | Calls with Alpaca, Dinari and counsel (§5.4). Decide the RIA route (SEC internet-adviser vs state). Engage SOC 2 tooling if we go with Dinari |
| 2–6 | Alpaca sandbox: account opening, a Portfolios model, ACH, Instant Funding, sell-commission tests. Draft Form ADV Part 2A, Form CRS, advisory agreement. File Form ADV |
| 6–10 | Build the Cash App USDC → Alpaca stablecoin funding flow (or the Dinari pilot). Roth IRA flow. Fee disclosure screens. Marketing pre-review |
| 10–13 | Closed beta (friends and family, non-NY first if we use Cash App). RIA registration becomes effective (SEC has 45 days). Production approval from Alpaca |

### 5.4 Partner calls and questions

**Alpaca (broker sales, alpaca.markets/broker):**
1. Can a **non-RIA fintech** onboard today, or must we be an RIA or a BD? What's the timeline?
2. Does the **Portfolios/Rebalancing API** require RIA status? Min per-account and per-order sizes? Can new deposits auto-invest into a model at $5?
3. **Commission:** can we charge a **bps commission on sell orders only**? Who is the legal charging party (Alpaca Securities)? How is it remitted to us? Any cap? Does it show on 10b-10 confirms?
4. If we're an RIA, can the **advisory fee be deducted from accounts** (fee-billing API), and can it be computed as a % of withdrawal amount?
5. **Stablecoin funding:** which chains (Arbitrum?), fees, per-user deposit addresses, and does it require a crypto account? Can Cash App USDC land directly?
6. **Roth IRA:** pricing, contribution-limit handling, minimums.
7. Platform fees and minimums, SPCX `fractionable` status, NY availability.

**Dinari (partner-support@dinari.com, partners.dinari.com):**
1. Can a partner present a **pre-set basket or model** (or offer only QQQ)? Is that a "recommendation"? Would Dinari Securities approve it under Reg BI? Are **Alloys** available to US users?
2. The **`fee` parameter:** does it apply to US orders? Who charges it legally (Dinari Securities as commission, with rev share to us)? **Can it be sells-only?** Caps? How is it disclosed on confirms?
3. **Network fee** relief for small orders ($0.20 × 9 legs), batching options, minimum `payment_amount`.
4. What is the **retail commission** Dinari Securities charges US end users?
5. **Wallets:** is a Privy embedded (EOA or smart-account) wallet per user OK? Paymaster/gas sponsorship? Is a Privy universal deposit address acceptable as the funding source?
6. **ACH** funding for US accounts (the US guide mentions it). USD withdrawal to bank?
7. **1099-B** issuance and cost-basis reporting. Confirm no 1099-DA.
8. **USD+** eligibility for US users. IRA roadmap.
9. SOC 2 timeline flexibility; market-data cost cap for non-professionals; pricing above $2k/month.
10. The Restrictions page still says dShares "may not be offered or sold in the United States." Please confirm it's stale.

**Privy:** pricing above free MAU; universal deposit address support for Arbitrum USDC from Cash App; policy controls so the wallet can only interact with Dinari contracts and Blunts' withdrawal flow.

**Coinbase CDP:** apply for zero-fee USDC Onramp/Offramp; Arbitrum delivery; NY coverage.

**Counsel (securities + fintech):**
1. RIA registration route. Does picking the basket make us an adviser under both the Alpaca and Dinari models?
2. Fee structure (§A).
3. Money-transmission analysis of the USDC flows.
4. Marketing and cannabis branding under FINRA 2210 and SEC marketing rule 206(4)-1.

### 5.5 Remaining legal gaps

1. **RIA registration** if Blunts picks the basket. That includes Form ADV, a compliance manual, a CCO and a books-and-records setup.
2. **Fee model:** the fee must flow through the BD as a disclosed commission or through the RIA as a disclosed advisory fee (§A).
3. **Money transmission:** keep USDC movements user-to-self and non-custodial. Keys must stay with the user (Privy).
4. **Marketing:** FINRA 2210 pre-approval (Dinari) and the SEC marketing rule (if RIA). The cannabis-adjacent brand ("Blunts", "spark") will get scrutiny from app review, FINRA and state regulators. See file 03.
5. **NY:** Dinari and Alpaca cover NY, but Cash App doesn't. Offer Coinbase or ACH there.
6. **Gamification / state rules:** Massachusetts fiduciary rule for BDs. The "spark" metaphor and celebrations need restraint.

---

## A. Fee model: a fee only on "spark" (sells/withdrawals)

**Bottom line:**
- A sell-side fee is legal and marketable **if it's charged by a registered entity**. That means the BD charges it as a disclosed commission on the sell, or Blunts charges it as an RIA with a disclosed fee.
- **Blunts can't take a % of every trade as an unregistered "referral partner."** Per-trade pay tied to transaction size is the #1 hallmark of acting as an unregistered broker.
- Put the fee on the **sell order**, not on the cash withdrawal. Never compute it on profit.
- Before launch, get a written opinion from securities counsel and a written position from the BD.

### A.1 Is a % fee on each spark legal, and who may receive it?

- **Exchange Act §15(a)** requires anyone "effecting transactions" for others to register as a broker-dealer. In the SEC's broker-dealer guide [F1], pay that depends on the size or outcome of a transaction, and "splitting commissions with registered broker-dealers," are listed as broker activity.
- **The finder cases don't help.** The *Paul Anka* letter (1991) worked only because Anka just passed along names of people he already knew [F2]. The 2020 proposed finder exemption was **never adopted**, and it covered only capital raising from accredited investors anyway [F3]. The Nov 2025 FSI no-action letter covers only firms owned by registered reps [F4]. SEC settlements keep citing transaction-based pay [F5].
- **FINRA Rule 2040** bars Alpaca or Dinari from paying commissions to anyone who would need to register because of those payments. The BD must have a *reasonable basis* for concluding the recipient needn't register [F6]. So a transaction-based rev share to a non-BD app only works if the BD is comfortable with it. BDs usually prefer **fixed** payments: per funded account, a flat license or a marketing fee.
- **The APIs make it technically easy, not legally settled:**
  - **Alpaca:** the per-order `commission` field (`notional` / `qty` / `bps`) goes to the partner. Alpaca must configure it first. It's capped at net proceeds on sells [A17][F7].
  - **Dinari:** the optional per-order `fee` field [D13].
  - Neither provider publishes a legal basis for a **non-registered** partner receiving it **[UNVERIFIED; ask both]**.
- **Compliant structures, safest first:**
  1. **Blunts registers as an RIA** (needed anyway if Blunts picks the basket; §1.11) and charges a disclosed advisory fee. An asset-based or flat fee is standard. A fee charged per transaction still looks like broker pay, so counsel must bless "% of each sell" even for an RIA.
  2. **The BD charges the sell commission; Blunts receives a fixed fee** (per funded account or platform license) that passes Rule 2040.
  3. **Flat subscription** (the Acorns model). It has the least broker risk.
  4. **Register or buy a BD.** The only clean way to keep a per-trade % directly. Slow and expensive.

### A.2 Reg BI, best execution, FINRA 2121/2122, disclosure, §205

- **FINRA 2121 (fair commissions):** a sells-only commission isn't prohibited. The "5% policy" is a guideline, not a cap [F8][F9]. 1% is defensible, but examiners will ask what services justify it when stock commissions are $0.
- **FINRA 2122 (charges for other services):** a fee framed as a **withdrawal / cash-transfer fee** must be "reasonable and not unfairly discriminatory" [F10]. In the *Fortrend* case FINRA fined a firm over a $250 exit fee that exceeded its cost [F11]. **A % fee on cash withdrawals invites that "exit penalty" analysis, so attach the fee to the sell (commission), not to the cash-out.**
- **Best execution (FINRA 5310):** the BD still owes it. Show the fee **separately**; never bury it in a worse fill price.
- **Reg BI:** a curated basket may be a recommendation, which requires full fee disclosure. **Form CRS** (BD's and Blunts' if RIA) must describe the fee *and the conflict*: Blunts earns only when users take money out.
- **Rule 10b-10 confirmations** must show the commission. The "you get $X minus fee" screen must match the confirmation.
- **§205 performance fee:** a flat % of the *withdrawal amount* is **not** a share of gains, so it's allowed. **Never calculate it on profit** (e.g., "1% of gains"). That would be a performance fee, banned for non-qualified clients (Rule 205-3: $1.4M AUM / $2.7M net worth).
- **State:** the Massachusetts fiduciary rule for BDs (950 CMR 12.207; Robinhood settled in 2024). How it applies to a partner app is **[UNVERIFIED]**.

### A.3 What comparable apps charge (2026)

| App | Fee model | Source |
|---|---|---|
| Robinhood crypto | Spread-based. Robinhood earns about $0.95 per $100 from the market maker; advanced tiers 0–0.95% | [F12] |
| Coinbase (simple) | About 0.5% spread plus a fee (about 1.49% bank, 3.99% card) **[UNVERIFIED, secondary]** | [F13] |
| Cash App | $0 stock commissions; regulatory fees on sells only; $75 outbound transfer. Bitcoin about 1.5–3% on small buys | [F14][F15] |
| Acorns | $3 / $6 / $12 per month subscription | [F16] |
| Stash | $12/month (or $108/year), plus 0.25%/year on Smart Portfolios ≥ $1k | [F17] |
| Public | $0 stocks; about 1.25% crypto spread; Premium $10/month **[secondary]** | [F18] |
| Stockpile | $0.99 per trade | [F19] |
| Webull | $0 stocks; 1% crypto spread each side | [F20] |

**No app was found charging its own sells-only fee.** The only sells-only charges in the industry are the SEC §31 fee and the FINRA TAF. So a sells-only fee is novel. It's easy to market, but there's no regulatory precedent.

### A.4 Recommended structure, fee level and unit economics

**Structure:**
- Blunts is an **RIA**. The **"spark fee" is a disclosed fee on the sell that funds a withdrawal**, collected by the BD (Alpaca `commission` / Dinari `fee`) under a contract and legal opinion the BD accepts. It appears in Form ADV 2A, Form CRS, the fee schedule and 10b-10 confirmations.
- Fallback if counsel or the BD balks: a **flat monthly subscription billed from the account**, or a fixed per-funded-account fee from the BD.

**Level:** **0.75–1% of the sell amount, with a $0.25 minimum** and possibly a cap (e.g., $10).
- That's in line with Robinhood crypto (about 0.95%), Webull (1%), Public (about 1.25%) and Cash App BTC (1.5–3%).
- 1.5% is defensible under 2121 but draws more scrutiny against $0 stock commissions.

**Unit economics, $100 spark at 1%:**

| Line | Alpaca path | Dinari path |
|---|---|---|
| Gross spark fee | $1.00 | $1.00 |
| Regulatory fees (SEC/TAF, passed through) | about $0.01 | absorbed by Dinari |
| Sell order cost | $0 commission | $0.20 × legs: **QQQ = $0.20; 9-stock basket = $1.80** |
| Buy-side cost Blunts absorbs (fill was free) | $0 | $0.20 (QQQ) to $1.80 (basket) per fill |
| Off-ramp | ACH free / Cash App USDC about $0.05 | Cash App USDC about $0.05 gas |
| **Net per $100 round trip** | **about +$0.95** | **QQQ: about +$0.55. 9-stock basket: about −$2.65** |
| Fixed | Negotiated platform fee **[UNVERIFIED]** | **$2k/month** → about **$200k/month of sparks at 1%** just to cover it |

**Sell-only vs subscription:**
- A $3/month subscription ($36/year) equals a 1% fee on $3,600/year of withdrawals. For small-balance users, a subscription earns more.
- Sell-only is friendlier (free to join, never see the balance drop on fill) but lumpy, and it earns only when users leave.
- **Hybrid worth testing:** free tier with a 1% spark fee; optional "Blunts+" at $3/month (billed from the account, not IAP) that waives spark fees.

---

## B. Apple / Google app store fees

**Bottom line: Apple and Google take 0% of deposits, withdrawals, trades or trading/withdrawal fees.** The 30% fear doesn't apply to money movement. Only a subscription that unlocks app features is exposed to in-app purchase (IAP), and brokerages routinely avoid even that by billing from the account.

### B.1 Apple App Store Review Guidelines [AP1]

| Guideline | What it says | Effect on Blunts |
|---|---|---|
| **3.1.1** | IAP is required to "unlock features or functionality within your app" (subscriptions, premium content) | Deposits, trades and commissions don't unlock app features, so no IAP. A "Blunts+" subscription sold *as an app feature* would fall under it on paper |
| **3.1.3(e)** | Goods or services "consumed outside of the app" must use non-IAP methods | Brokerage execution and custody by a registered BD are services consumed outside the app |
| **3.1.5(iii)** | Crypto exchanges only with "appropriate licensing and permissions" | Relevant if the Dinari/on-chain SKU looks like crypto trading. Expect extra review |
| **3.2.1(viii)** | Trading and investing apps "should be submitted by the financial institution performing such services" | **The real App Review risk.** Submit under Blunts' legal entity, show the BD agreement and the RIA registration |
| **5.1.1(ix)** | Financial-services apps must be submitted by a legal entity, not an individual | Organization developer account required |
| 3.2.2 | Binary options banned; CFDs and forex must be licensed | Not relevant |

**What peers do with premium subscriptions (they bill from the account, not IAP):**
- **Robinhood Gold** ($5/mo): charged to the investing account [AP2].
- **Acorns** ($3/$6/$12 per acorns.com/pricing; some sources show $4/$8/$12): bank debit from the funding source [AP3].
- **Stash:** account agreement [AP4].
- **Public Premium:** charged to the Public account [AP5].
- **Coinbase One:** reportedly offers IAP on mobile alongside direct billing **[UNVERIFIED]**.
- **Cash App:** no subscription. All fees are outside IAP.

### B.2 Epic v. Apple anti-steering (US)

- **2025-04-30:** the district court banned any commission on link-out purchases and banned scare screens.
- **2025-12-11:** the Ninth Circuit largely affirmed, but said Apple may eventually charge *some* commission on linked purchases. It remanded to the district court to set the amount [AP6].
- **April 2026:** a stay was reversed. Linking out is currently **0% commission** [AP7].
- **2026-06-30:** the Supreme Court granted review on the contempt standard (No. 25-1311). Apple filed its merits brief 2026-09-14 [AP8][AP9].
- **August 2026:** Apple proposed **15%** (10% for some programs and renewals, 5% for small businesses) on linked purchases [AP10].
- **Expect a 5–15% commission on *linked digital purchases* in late 2026 or 2027.** It still wouldn't touch brokerage fees.

### B.3 Google Play [GP1][GP2]

- Play Billing is required for digital features and subscriptions. It is **not** required for physical services, bill payments or peer-to-peer payments.
- There's no explicit securities carve-out, but no brokerage app runs money movement through Play Billing.
- **US after Epic v. Google:** Google "will not require the use of Google Play Billing" in US apps.
  - Epic and Google settled on 2026-03-04.
  - Service fees on alternative billing start **2026-10-01**; on external links, **2026-12-01**.
  - Reported rates are about 20–25% for one-time purchases and 10% for subscriptions **[UNVERIFIED rates]**.

### B.4 What Blunts would owe

| Model | Apple | Google |
|---|---|---|
| **% fee on sells, charged by the BD/RIA from the brokerage account** | **$0** | **$0** |
| Subscription billed from the brokerage account or bank debit (Robinhood Gold / Acorns model) | $0 in practice; small 3.1.1 rejection risk if it looks like a pure feature unlock | $0 in practice |
| Subscription via IAP / Play Billing | 30% year one, 15% after (15% under the Small Business Program) | 15% |
| Subscription via US web link-out | 0% today; about 5–15% likely later | about 10% from Oct/Dec 2026 **[UNVERIFIED]** |

**Recommendation:** put any fee in the **brokerage or advisory agreement** and collect it from the account. Never sell it as IAP.

---

## Sources

**Dinari**
- [D1] Dinari US integration guide: https://docs.dinari.com/docs/us
- [D2] Quickstart: https://docs.dinari.com/docs/quickstart
- [D3] Hosted Trading: https://docs.dinari.com/docs/hosted-trading
- [D4] Managing KYC: https://docs.dinari.com/docs/managing-kyc
- [D5] Changelog 2026-07-09 (US managed KYC): https://docs.dinari.com/changelog/v20260709-097f56a
- [D6] 24/5 tradable assets: https://docs.dinari.com/docs/245-tradable-assets
- [D7] 24/7 trading: https://docs.dinari.com/docs/24-7-trading
- [D8] FINRA BrokerCheck, Dinari Securities LLC: https://brokercheck.finra.org/firm/summary/329672
- [D9] Dinari Securities Form CRS: https://files.brokercheck.finra.org/crs_329672.pdf
- [D10] Dinari blog, Bitcoin.com US launch: https://dinari.com/blog/dinari-powers-bitcoin-coms-u-s-launch-of-tokenized-equities
- [D11] Bitcoin.com News: https://news.bitcoin.com/branded-spotlight/dinari-powers-bitcoin-coms-u-s-launch-of-tokenized-equities/
- [D12] Deploy to production: https://docs.dinari.com/docs/deploy-to-production
- [D13] Fees: https://docs.dinari.com/docs/fees
- [D14] Market buy request: https://docs.dinari.com/reference/createmarketbuymanagedorderrequest
- [D15] Get stocks: https://docs.dinari.com/reference/getstocks
- [D16] Order types: https://docs.dinari.com/docs/order-type
- [D17] Trading hours: https://docs.dinari.com/docs/trading-hours
- [D18] API index: https://docs.dinari.com/llms.txt
- [D19] Launch press release (Aug 4, 2026): https://www.prnewswire.com/news-releases/in-an-industry-first-dinari-launches-724-tokenized-stocks-available-to-both-us-investors-and-businesses-302842099.html and https://dinari.com/blog/dinari-launches-724-tokenized-stocks-available-to-u-s-investors-and-businesses
- [D20] Arc mainnet: https://dinari.com/blog/dinari-brings-dshares-tm-to-arc-mainnet
- [D21] Eco explainer (third-party; partly outdated): https://eco.com/support/en/articles/15083159-dinari-dshares-tokenized-equities
- [D22] Withdrawals: https://docs.dinari.com/reference/createaccountwithdrawalrequests
- [D23] USDC funding blog: https://dinari.com/blog/dinari-enables-usdc-funding-for-tokenized-u-s-equities
- [D24] Dividends: https://docs.dinari.com/docs/dividend-payments
- [D25] Taxes: https://docs.dinari.com/docs/taxes-reporting
- [D26] What is USD+: https://docs.dinari.com/docs/what-is-usd
- [D27] USD+ page: https://dinari.com/usdplus
- [D28] Managing wallets: https://docs.dinari.com/docs/managing-wallets
- [D29] CoinDesk, Aug 4, 2026: https://www.coindesk.com/business/2026/08/04/dinari-brings-tokenized-u-s-stocks-to-american-investors-as-equity-race-heats-up
- [D30] Managing accounts: https://docs.dinari.com/docs/managing-accounts
- [D31] Order permit request: https://docs.dinari.com/reference/createeip155orderrequestpermit
- [D32] Partners: https://dinari.com/partners
- Also: The Block, https://www.theblock.co/post/410588/dinari-tokenized-sp-500-stocks-self-custody-wallets-using-usdc ; Fortune, https://fortune.com/2026/08/04/dinari-stripe-apple-alums-partnership-circle-tokenized-stocks-us-investors/ ; Restrictions page (stale), https://docs.dinari.com/docs/restrictions

**Alpaca**
- [A1] About Broker API: https://docs.alpaca.markets/us/docs/about-broker-api.md
- [A2] Use cases: https://docs.alpaca.markets/docs/use-cases
- [A3] Account opening: https://docs.alpaca.markets/us/docs/account-opening.md
- [A4] Onboarding guide: https://alpaca.markets/broker-resources/guide/getting-started-with-broker-api-guide-to-onboarding-process
- [A5] Fractional trading: https://docs.alpaca.markets/us/docs/fractional-trading.md
- [A6] 24/5 trading: https://docs.alpaca.markets/us/docs/245-trading.md
- [A7] Portfolio rebalancing: https://docs.alpaca.markets/us/docs/portfolio-rebalancing.md and https://alpaca.markets/blog/create-custom-portfolios-that-automatically-invests-funds-with-rebalancing-api/
- [A8] ITN issuer guide: https://docs.alpaca.markets/us/docs/tokenization-guide-for-issuer.md and AP guide: https://docs.alpaca.markets/us/docs/tokenization-guide-for-authorized-participant.md
- [A9] ACH funding: https://docs.alpaca.markets/us/docs/ach-funding.md
- [A10] Instant Funding: https://docs.alpaca.markets/us/docs/instant-funding.md
- [A11] Stablecoin funding (June 22, 2026): https://alpaca.markets/blog/using-stablecoins-for-securities-and-crypto-trading-with-alpaca/
- [A12] Statements and confirms: https://docs.alpaca.markets/us/docs/statements-and-confirms.md
- [A13] Tax documents: https://alpaca.markets/support/tax-documents-info
- [A14] IRA accounts: https://docs.alpaca.markets/us/docs/ira-accounts-overview.md
- [A15] Broker API product page: https://alpaca.markets/broker
- [A16] Fee schedule: https://files.alpaca.markets/disclosures/library/BrokFeeSched.pdf
- [A17] Broker API trading (commission): https://docs.alpaca.markets/us/docs/brokerapi-trading and https://docs.alpaca.markets/us/reference/createorderforaccount.md
- [A18] Domestic accounts: https://docs.alpaca.markets/us/docs/domestic-usa-accounts.md
- [A19] ITN launch: https://alpaca.markets/blog/us-stock-market-ready-for-instant-tokenization-with-alpacas-newly-launched-network/
- [A20] Forbes on the SEC exemption and US availability: https://www.forbes.com/sites/boazsobrado/2026/09/17/the-sec-just-gave-tokenized-stocks-five-years-to-prove-themselves/
- [A21] SEC Innovation Exemption: https://www.sec.gov/newsroom/press-releases/2026-90-sec-issues-innovation-exemption-facilitate-trading-tokenized-nms-stock-request-comment
- [A22] Issuer Sponsored Token Coalition: https://www.coindesk.com/business/2026/09/24/bullish-alpaca-and-apex-fintech-form-coalition-to-push-issuer-backed-tokenized-stocks
- [A23] Series D: https://fortune.com/2026/01/14/alpaca-fundraise-series-d-brokerage-infrastructure/
- [A24] July 2026 raise: https://alpaca.markets/blog/alpaca-raises-135-million-to-scale-agent-first-brokerage-infrastructure-for-tokenized-markets-and-ai-native-financial-services/
- [A25] Kraken + Alpaca: https://www.businesswire.com/news/home/20250428924377/en/Kraken-Offers-US-Securities-Through-Strategic-Partnership-with-Alpaca
- Alpaca licensing primer: https://alpaca.markets/learn/broker-dealer-investment-advisor-or-no-license-how-to-start-your-research-journey-on-regulatory-licenses/

**Funding rails and other issuers**
- [CA1] Cash App stablecoins help: https://cash.app/help/us/en-us/31115-stablecoins
- [CA2] Cash App press: https://cash.app/press/cash-app-stablecoins-all-customers
- [CA3] CoinDesk on the Cash App rollout (limits, NY): https://www.coindesk.com/business/2026/05/27/block-kicks-off-cash-app-s-phased-stablecoin-roll-out-to-its-nearly-60-million-users
- [PP1] PayPal crypto transfers: https://www.paypal.com/us/cshelp/article/how-do-i-transfer-my-crypto-help822
- [PP2] Venmo crypto transfers: https://help.venmo.com/cs/articles/crypto-transfers-vhel232
- [CB1] Coinbase zero-fee USDC: https://www.coinbase.com/developer-platform/discover/launches/zero-fee-usdc
- [CB2] Coinbase Onramp FAQ: https://docs.cdp.coinbase.com/onramp/additional-resources/faq
- [P1] Privy universal deposit addresses: https://privy.io/blog/introducing-universal-deposit-addresses
- [C1] Coinbase tokenized stocks on Base (non-US): https://www.coindesk.com/business/2026/08/24/coinbase-debuts-tokenized-stocks-on-base-network-joining-race-to-bring-equities-on-blockchain
- [O1] Ondo Global Markets (non-US): https://ondo.finance/ondo-stocks

**App stores**
- [AP1] Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- [AP2] Robinhood Gold billing: https://robinhood.com/us/en/support/articles/paying-for-robinhood-gold
- [AP3] Acorns program agreement: https://www.acorns.com/program-agreement/
- [AP4] Stash payment methods: https://www.stash.com/learn/subscription-and-payment-methods/
- [AP5] Public Premium: https://help.public.com/en/articles/6097323-public-premium
- [AP6] Ninth Circuit, Epic v. Apple (Dec 11, 2025): https://law.justia.com/cases/federal/appellate-courts/ca9/25-2935/25-2935-2025-12-11.html
- [AP7] AppleInsider, stay reversed: https://appleinsider.com/articles/26/04/29/app-store-policy-must-change-as-epic-convinces-us-circuit-court-to-reverse-stay
- [AP8] Oyez, No. 25-1311: https://www.oyez.org/cases/2026/25-1311
- [AP9] TechTimes, merits brief: https://www.techtimes.com/articles/327527/20260915/app-store-commission-limbo-enters-new-phase-apples-epic-merits-brief-opens-scotus-fight.htm
- [AP10] 9to5Mac, Apple's proposed commissions: https://9to5mac.com/2026/08/13/apple-proposes-commissions-of-up-to-15-for-off-app-store-purchases-in-the-us/
- [GP1] Google Play Payments policy: https://support.google.com/googleplay/android-developer/answer/9858738
- [GP2] Google Play US billing changes: https://support.google.com/googleplay/android-developer/answer/15582165
- [GP3] Google fee reporting (third-party): https://www.strataigize.com/insights/google-play-external-payments-fee-changes-2026/

**Fee model**
- [F1] SEC Guide to Broker-Dealer Registration: https://www.sec.gov/about/reports-publications/investor-publications/guide-broker-dealer-registration
- [F2] Paul Anka / finder analysis: https://vicentellp.com/insights/broker-dealers-finders-m-and-a-financings-frequently-asked-questions/ and https://www.dwt.com/blogs/startup-law-blog/2021/03/transaction-based-fee-unlicensed-broker-dealer
- [F3] Finder exemption status 2026: https://seclaw.com/finder-registration-2026-update/ and SEC petition 4-890: https://www.sec.gov/files/rules/petitions/2026/petn4-890.pdf
- [F4] FSI no-action letter (Nov 2025): https://www.goodwinlaw.com/en/insights/publications/2025/12/alerts-finance-fs-sec-no-action-letter-permits-payment
- [F5] Wilson Sonsini on transaction-based compensation: https://www.wsgr.com/en/insights/no-commission-without-permission-sec-reinforces-focus-on-sales-activities-and-transaction-based-compensation-as-hallmarks-of-broker-dealer-status-in-recent-settlements.html
- [F6] FINRA Rule 2040: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2040
- [F7] Alpaca configurable commission blog: https://alpaca.markets/blog/alpaca-launches-configurable-crypto-commission-model-for-broker-api-partners/
- [F8] FINRA Rule 2121: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2121
- [F9] FINRA Notice 11-08: https://www.finra.org/rules-guidance/notices/11-08
- [F10] FINRA Rule 2122: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2122
- [F11] Fortrend AWC: https://www.brokeandbroker.com/3276/finra-awc-fortrend/
- [F12] Robinhood crypto fee tiers: https://robinhood.com/us/en/support/articles/crypto-fee-tiers/
- [F13] Coinbase fees: https://help.coinbase.com/en/coinbase/trading-and-funding/pricing-and-fees/fees
- [F14] Cash App Investing house rules: https://cash.app/legal/us/en-us/cash-investing-house-rules
- [F15] Cash App bitcoin fees: https://cash.app/bitcoin/fees
- [F16] Acorns pricing: https://www.acorns.com/pricing/
- [F17] Stash pricing: https://www.stash.com/pricing
- [F18] Public fees (secondary): https://brokerchooser.com/broker-reviews/publiccom-review/publiccom-fees
- [F19] Stockpile fees: https://www.stockpile.com/fees-base-members
- [F20] Webull fees: https://www.webull.com/help/faq/11091-Fees-and-Limits
