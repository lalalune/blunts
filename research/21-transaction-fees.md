# 21: A 1% fee on every fill and spark: benchmarks, legal routes, cost stack, elasticity

**Date:** 2026-09-28 | **Status:** Research memo, not legal advice. **[UNVERIFIED]** = secondary source or couldn't confirm on a primary page. **[EST]** = modeling assumption. Numbered sources at the end.

**Builds on:** `08-monetization.md` (spark fee, unit economics), `12-gaps-and-profit-fee.md` (§205, 2040, structure table), `17-apple-pay-and-bank-rails.md` (rail costs), `18-tech-stack-and-web.md` (Dinari order flow, gas). Also `04` §A and `06` §3 (fee law, Dinari `fee` field). This file doesn't repeat those; it adds the **fill-side** fee, 2026 benchmarks, new SEC guidance and corrected cost numbers.

---

## TL;DR

1. **1% is the market rate for *crypto*, not for *stocks/ETFs*.**
   - Crypto on consumer apps costs **~1–2.5%** per trade. Examples: Cash App bitcoin **2.0% under $500** plus a 0–0.75% spread [1]; Venmo/PayPal **2.2% under $75, falling to 1.5% over $1k** [9][10]; Coinbase simple trade ~0.5% spread plus a fee [6]. Robinhood gets **$0.95 per $100** from its crypto market makers, built into the spread [3].
   - ETF buys are **$0** at Cash App, Robinhood, Schwab and others. Blunts' 1% on a QQQ buy is priced against $0, not against 2%.
2. **The industry charges on *exits and speed*, not on deposits.**
   - No mainstream investing app charges a fee to deposit by ACH or Cash App. Deposit fees exist only for **card funding** (Coinbase Onramp 2.5% on debit/Apple Pay [8]; MoonPay 4.5%, $3.99 minimum [12]) and **paper cash** ($1 at Cash App [19]; up to $4.95 at Green Dot [20]).
   - Instant withdrawals are the accepted paid item: **1.5–1.75%** at Robinhood, Venmo, PayPal and Coinbase [5][7][11].
   - **Cash App is moving the other way.** It made **Auto Invest / Round Ups / recurring bitcoin buys 0% fee and 0 spread** [1] and took a **31% drop in bitcoin gross profit** in Q2 2026 to do it [2]. Blunts' "fill" is exactly that kind of automated buy.
3. **Legally, "1% of every fill" has to be a 1% commission on the QQQ *buy*, charged by a broker-dealer.** A 1% charge on the *deposit* is hard to defend.
   - FINRA 2121: 1% is well inside the 5% guide, and small trades may justify a higher percentage [21].
   - A "deposit fee" charged by the BD falls under **FINRA 2122**: it must be reasonable against cost (*Fortrend*) [22].
   - An **RIA can't take a per-transaction %.** Transaction-based pay is the hallmark of a broker [28].
   - **Cleanest structures, in order:**
     - **(a) Now:** Dinari Securities charges a disclosed 1% commission on buys *and* sells, and pays Blunts a **fixed** platform fee (FINRA 2040-safe).
     - **(b) Long term:** Blunts registers its own **introducing broker-dealer** and keeps the 1% commission directly. FINRA fee **$7.5k–55k**, **6–9 months**, **$5k+ net capital** (**$50–100k** in practice), plus principals, a FINOP and CCO. **~$250–500k first year [EST]** [27].
     - **(c) Partial alternative:** a 1% **onramp platform fee** on bank and card fills only. zerohash lets the platform set up to 5 fees plus a spread per order (NY cap 7.5%) [29], and MoonPay allows a partner fee up to 10% [12]. It can't reach **Cash App USDC fills** (no intermediary), and the SEC could treat it as disguised pay for the securities trade, since every fill auto-buys QQQ **[counsel]**.
4. **New since the prior files: the SEC's 2026-04-13 staff statement on "Covered User Interface Providers" [25]** explicitly lets a non-broker interface charge **"a flat fee or percentage of the transaction"** on tokenized-securities trades.
   - The conditions: true self-custody (no key access), no order-taking or auto-trading, no recommendations, and on-chain protocols only.
   - Per Sidley, it doesn't cover interfaces that route to a registered BD [25]. **Blunts' current design (Dinari BD + server auto-buy + Privy server signer) doesn't qualify.**
   - Watch it together with the **2026-09-17 innovation exemption** for on-chain tokenized-stock venues [26].
5. **Cost stack, updated:**
   - **Arbitrum ERC-20 transfer ≈ $0.004** (0.02 gwei, ETH $2,687, Arbiscan on 2026-09-28) [33]. Budget $0.01–0.05 for spikes: Robinhood Chain went from $0.001 to $0.024 per transfer in August–September [15].
   - **Dinari $0.20 per order, or gas at cost in arrears** when the partner charges end-user fees [32]. At cost that's likely **~$0.005–0.03 [EST]**.
   - **Coinbase Onramp without the subsidy: 2.5% debit/Apple Pay, 0.5% ACH, plus spread** [8]. This replaces file 17's "[UNVERIFIED] 2.5–4%".
   - Cards: 2.9% + 30¢, $15 per dispute [35]. RTP/FedNow wholesale **$0.045** [37]. Nacha return limits **0.5% / 3% / 15%** [31].
6. **Economics of 1% + 1%:**
   - Base user ($600 fills, $360 sparks a year, $500 balance): **$9.60/yr**, vs $3.60 for spark-only. That's an effective **~1.9%/yr of balance**. It's still cheaper than Acorns' $3–4/mo (7.2–9.6%/yr at $500).
   - Dinari's $2k/mo minimum is covered at **~2,500 base users**, vs ~6,700 spark-only.
   - **Per-rail margin:** Cash App fill **+$0.30 on $50**; zerohash ACH fill **~−$0.60 to $0 [UNVERIFIED]**; unsubsidized Apple Pay fill **−$0.95**; Cash App spark **+$0.79 on $100**; RTP spark **−$0.70 to +$0.30**.
7. **Elasticity:** going from $0 to any fee has an outsized effect (the "zero-price effect") [41]. But field evidence on small *deposit* fees shows near-zero elasticity among users who have already adopted [42]. Users complain loudly about *recurring* fees on small balances (Acorns' $1→$3 in 2021 [16]).
   - **[EST] break-even:** a 1% fill fee adds ~$17 of lifetime revenue per funded user. It stays revenue-positive unless it cuts funded users by more than **~45–60%** with referral-led CAC, or **~20%** with paid CAC (~$70 per funded user).
   - **Recommendation:** charge **1% on the trade (buy and sell) through the BD**, framed as **"1% per move, no monthly fee"**. Cap it (e.g., $10). Pass through third-party card costs separately. Make **instant spark to bank** the only extra fee. **No inactivity fee.**

---

## 1. What comparable apps charge per transaction (2026)

### 1.1 Crypto / tokenized buys and sells

| App | Buy/sell fee | Deposit fee | Withdrawal fee | Source |
|---|---|---|---|---|
| **Cash App (bitcoin)** | Market buy/sell **2.0%** ($1–499), **1.5%** ($500–999), **0.9%** ($1k–1,999), **0%** ≥ $2k; spread **0–0.75%**. **Auto Invest / Round Ups / direct-deposit buys: 0% fee, 0 spread** | $0 (bank/debit); **$1 paper money** [19] | On-chain BTC withdraw free; instant cash-out to debit **0.5–1.75%, $0.25 min** **[UNVERIFIED; cash.app page didn't render]** | [1][18][19] |
| **Cash App (stocks/ETFs)** | **$0 commission**, fractional from $1 (file 04) | $0 | Same instant fee | file 04 |
| **Robinhood (crypto)** | Market-maker routing: spread. RH receives **$0.95 per $100** (since 2026-06-15). Smart exchange routing: explicit tiers **0.85% → 0.03%** by 30-day volume | $0 (instant deposit free, within limits) | **Instant withdrawal 1.75%, min $1, max $150**; ACH free | [3][4][5] |
| **Robinhood (stocks/ETFs)** | $0 commission | $0. Paid a **1% deposit boost** to Gold members in 2024; IRA match continues | Same | [5][45] |
| **Robinhood EU stock tokens** (Robinhood Chain) | $0 commission; **0.10% FX fee**; up to **0.5% execution buffer** | — | — | [14] |
| **Coinbase** | Simple trade: **~0.5% spread** + a payment-method fee (secondary: **1.49% bank / 3.99% debit**) **[UNVERIFIED on help.coinbase.com]** | ACH free into USD balance | **Instant cash-out 1.5%, min $0.55** **[UNVERIFIED secondary]** | [6][7] |
| **Coinbase Onramp** (in-app, what Blunts uses) | **2.5% debit/credit/Apple Pay; 0.5% ACH; plus spread; ~$5 min.** 0% USDC only for subsidy partners | = the fee | Offramp needs a Coinbase account | [8] |
| **PayPal / Venmo crypto** | **2.20%** ($1–74.99), **2.00%** ($75–200), **1.80%** ($200–1k), **1.50%** (> $1k), plus a spread. **PYUSD 0%** **[tiers UNVERIFIED on the primary page; fees shown at checkout]** | $0 | Instant transfer **1.75%, $0.25 min / $25 max** | [9][10][11] |
| **MoonPay** | **4.5% card / 1% bank, $3.99 minimum** (20% on a $20 buy), plus spread. Partner "ecosystem fee" **0–10% (typically 0–2%)** on top | = the fee | 1% + network, $3.99 min (file 17) | [12] |
| **Stripe Crypto Onramp** | Spread only; pricing private | = the fee | — | [13] |
| **Acorns** | $0 per trade; **$3–4 / $6–8 / $12 per month** subscription | $0 | $0 standard; **$50 per ETF** transfer-out | [16], file 08 |
| **Stash** | $0 per trade; $12/mo plan | $0 | **Instant transfer 1%** **[UNVERIFIED secondary]**; $75 ACATS | [17] |

### 1.2 What the pattern says

- **Deposit fees exist only where the rail itself costs money** (cards at ~2.5–4.5%, paper cash at $1–4.95). No app charges a percentage on ACH or P2P deposits.
- **Crypto takes are 1–2.5%**, and trending **down on automated buys**: Cash App made them 0% [1] and Robinhood cut its explicit tiers by "up to 70%" [4].
- **Instant withdrawal at 1.5–1.75% is universal and tolerated.** PayPal and Venmo raised it from 1.5% to 1.75% in 2022 with no visible usage collapse [11].
- **Two apps have *paid* users to deposit:** Robinhood Gold's 1% boost (ended 2024-11-25) and IRA matches [45]. Blunts' 1% fill fee is the mirror image of the incumbent growth tactic.

### 1.3 How users react to deposit and small-balance fees

- **Acorns, $1 → $3/month (effective 2021-09-21):** blog and forum posts were uniformly negative, with "closing my account" comments. Complaints focused on balances under $500, where the fee is 7.2%/yr [16].
- **Cash App bitcoin:** users pay ~2% on small discretionary buys, and bitcoin still drove **$1.89B revenue in Q2 2026**. But gross profit was only **$72M (−31% YoY)**, because Block chose to cut fees to drive recurring use [2]. Block's read: fees suppress *habit* buys.
- **Coinbase and MoonPay card fees** are a top complaint in reviews, and the $3.99 minimum makes small buys (20% on $20) the canonical "rip-off" example [12] **[UNVERIFIED sentiment; secondary reviews]**.

---

## 2. Regulatory framing: who can charge 1% on fills and sparks?

### 2.1 Rule-by-rule

| Question | Answer | Source |
|---|---|---|
| Can a BD charge a **1% commission on ETF buys and sells**? | **Yes.** FINRA 2121 requires a "fair commission"; the **5% Policy "is a guide, not a rule."** One of the seven factors: "a transaction which involves a small amount of money may warrant a higher percentage." 1% on $50 is well within it. Expect examiner questions against $0 norms (file 04 §A.2) | [21] |
| **Share** that commission with Blunts (unregistered)? | **No**, not as a % or per trade. FINRA 2040 bars paying transaction-based pay to a person who'd have to register. Blunts can get a **fixed** platform / licensing fee (file 06 structure B, file 12 #2) | [23] |
| **Reg BI** issue with 1% vs $0? | Reg BI applies only if there's a **recommendation**. A single-ETF auto-invest app risks being one (file 12 §1.1). If so, the **care obligation** requires considering **costs and reasonably available alternatives**, and SEC/FINRA exams focus on lower-cost alternatives. Document why 1% buys a real service (auto-fill, instant Cash App rails, no monthly fee). Disclose in Form CRS | [24] |
| **Best execution** (FINRA 5310)? | It covers execution *price*, not the commission level. Dinari's execution vs NBBO is Dinari's obligation. The 1% commission must appear separately on the 10b-10 confirmation | file 04 §A.2 |
| A 1% charge **on the deposit itself** (not a trade)? | If the **BD** charges it, it's a service charge under **FINRA 2122**: "reasonable and not unfairly discriminatory." *Fortrend* was fined for a fee above its cost. A 1% deposit fee on a ~$0 rail is hard to justify. **Put the 1% on the buy instead** | [22] |
| Can Blunts as an **RIA** charge 1% per fill/spark? | **No** (high risk). "Receipt of transaction-based compensation … a hallmark of broker-dealer activity"; RIAs have been charged for it (e.g., *Blackstreet*). RIAs can charge **asset-based or fixed** fees, including a **wrap fee** (bundled advice + brokerage, ADV Part 2A Appendix 1), but not a % per trade | [28] |
| Can the **onramp** (zerohash / MoonPay) charge 1% and pay Blunts? | Mechanically yes: zerohash lets the platform set a spread plus up to 5 fees (US cap only in **NY: 7.5%**); MoonPay pays partners an "ecosystem fee" up to 10%. Legally it's a **fiat→USDC conversion fee**, not a securities commission. **But** every Blunts fill auto-buys QQQ, so substance-over-form could make it transaction-based pay for the securities trade **[counsel]**. Money-transmission exposure stays with the licensed onramp as long as Blunts never touches the funds | [29][12] |
| **SEC UI statement (2026-04-13):** does it let Blunts take 1% without being a BD? | It lets a "Covered User Interface Provider" charge **"a flat fee or percentage of the transaction"** on crypto-asset-securities trades, including **tokenized equities**. It must be "product, execution route, execution venue, and counterparty agnostic"; no PFOF; 9 disclosure categories. **But:** self-custody with **no key access**; no soliciting or recommending; **no taking or routing orders, executing, or settling**; **user-directed only**; on-chain protocols, **not interfaces routing to registered BDs** (Sidley). Staff-level only; **sunsets after 5 years**. **Blunts today fails at least three conditions:** server auto-buy, Dinari BD routing, Privy server signer | [25] |
| **Innovation exemption (2026-09-17)** | Exempts on-chain **tokenized-stock AMM venues** (up to 75 Tier 1 and 250 Tier 2 stocks) and their liquidity providers. Retail is allowed via credentialed wallets. It doesn't address app fees, but could later give a UI-statement-compliant Blunts a venue other than Dinari | [26] |

### 2.2 Cleanest structures for "1% of every fill and spark flows to Blunts"

| # | Structure | Fill 1% | Spark 1% | Blunts receives | Legal risk | Time / cost |
|---|---|---|---|---|---|---|
| **A** | **Dinari Securities charges 1% commission on buys and sells**; Blunts gets a **fixed** platform fee (per funded account per month) plus a waiver of the $2k minimum | ✅ | ✅ | Fixed $ (not a %), renegotiated periodically | **Low–medium** (needs Dinari's 2040 memo) | Contract only; weeks |
| **B** | **Blunts registers an introducing BD** (Form BD + FINRA NMA), with Dinari as the clearing/tokenizing partner; Blunts-BD charges 1% on each buy and sell | ✅ | ✅ | **The full 1%** | **Low** (standard commission) | **6–9 months** (FINRA must decide within 180 days of a substantially complete application); NMA fee **$7.5k–55k**; net capital **$5k minimum, $50–100k typical** plus 6–12 months of expenses; Series 24/27 principals, FINOP, CCO, Reg BI/CRS, WSPs, AML. **~$250–500k first year, ~$200–400k/yr ongoing [EST]**. Buying a shell BD (continuing membership application) may be faster **[UNVERIFIED]** | [27] |
| **C** | **Onramp platform fee** on bank/card fills (zerohash `fees`, MoonPay ecosystem fee) + **structure A** for sparks | ⚠️ bank/card only; **not Cash App USDC** | ✅ (fixed via A) | % on bank/card fills; fixed on sparks | **Medium** (substance-over-form) | Contract only |
| **D** | **RIA + wrap/asset-based fee** (e.g., 0.75–1.5%/yr) instead of per-move fees | ✗ | ✗ | Asset-based fee | **Low** | RIA registration (file 04) |
| **E** | **UI-statement model** (user signs every order, true self-custody, on-chain venue, no auto-buy) | ✅ | ✅ | **The full 1%** | Medium (staff-level, sunsets) | Product redesign; depends on on-chain liquidity for QQQ-like tokens |

**Recommendation:** launch on **A**: the BD charges "1% per move," and Blunts gets a fixed fee. Start **B** in parallel if the business depends on transaction revenue (it's the only structure where the 1% itself is Blunts' revenue). Treat **C** as optional, and never on Cash App fills.

---

## 3. Other transaction fees Blunts could add

| Fee | Benchmarks | Blunts cost basis | Recommendation |
|---|---|---|---|
| **Instant spark to bank/debit** | Robinhood **1.75%** ($1–$150) [5]; Venmo/PayPal **1.75%** ($0.25–$25) [11]; Coinbase **1.5%** (min $0.55) [7]; Cash App **0.5–1.75%** [18]; Stash **1%** [17] | RTP/FedNow wholesale **$0.045** [37]; zerohash retail price private (~$0.50–1.50 **[UNVERIFIED]**); Bridge FedNow $0.50/$1.00 (file 17) | **Yes, the one extra fee:** 1% (min $0.50) for instant-to-bank; standard ACH free; spark to Cash App free. Combined with the base 1% that's 2% to leave instantly, vs 1.75% at Robinhood (which charges nothing on the sell), so show both on one line. Consider **"instant is free in Blunts+"** |
| **Apple Pay / card surcharge pass-through** | Coinbase Onramp **2.5%** [8]; MoonPay **4.5%** [12]; Coinbase simple trade **3.99% debit** [6] | Coinbase Headless is **debit-only**; Visa/MC **prohibit surcharging debit**; credit surcharges cap at **3%** and are **banned in CA, CT, ME, MA** [36] | Blunts isn't the card merchant (Coinbase is), so **it can't "surcharge."** It can only **show Coinbase's fee as a pass-through line**. With the zero-fee USDC subsidy it's $0; without it, show "Card fee (Coinbase) 2.5%" separately from Blunts' 1% |
| **Paper-money cash-in** | Cash App **$1** flat (limit $1k per 7 days) [19]; Green Dot **up to $4.95**; Venmo ~$3.74 via retailers; Chime free at Walgreens [20] | Blunts has no retail cash network | **Don't build it.** Tell users "load cash to Cash App ($1), then fill." A Blunts fee on top would stack to 3% on a $50 bill |
| **Expedited bank fill** (instant credit before ACH settles) | Robinhood instant deposits **free** within limits; Coinbase Onramp ACH **0.5%** [5][8] | Float plus **return risk**: unauthorized returns up to **60 days**; Nacha limits **0.5% unauthorized / 3% admin / 15% overall** [30][31]. Subprime NSF (R01) rates of **12–18%** are reported in lending **[UNVERIFIED; lending context]** | **Don't charge; limit instead.** Credit instantly up to, say, $50 for users with good history, otherwise wait for settlement. A speed fee on deposits is the most-resented fee type (§1.3) |
| **Inactivity fee** | Schwab, IBKR, Firstrade, Robinhood: **$0**. eToro **$10/mo** after 12 months; the CFPB named inactivity fees as "junk fees" [46] | — | **Never.** It hits exactly the low-balance, irregular filler. It also invites state dormancy/escheat and UDAP scrutiny. File 12 #20 (escheat) is the real dormancy task |
| **Transfer-out (ACATS)** | Acorns **$50/ETF**, Stash **$75** [16][17] | dShares are **non-transferable** (file 12 #18) | N/A. Say so in the disclosure |
| **FX** | Robinhood EU **0.10%** [14] | US-only, USD | None |

---

## 4. Per-transaction cost stack Blunts pays (updated)

### 4.1 Unit costs

| Item | 2026 number | Change vs prior files | Source |
|---|---|---|---|
| **Dinari order fee** | **$0.20/order** standard; **or network fees "at cost in arrears"** when the partner charges end users transaction fees or batch-bills monthly; $2,000/mo minimum | Arrears option confirmed. At current gas, **~$0.005–0.03 per order [EST]** (the order contract uses more gas than a plain transfer) | [32] |
| **Arbitrum ERC-20 / USDC transfer** | **0.02 gwei ≈ $0.004** (2026-09-28; ETH $2,686.62) | Was "$0.01–0.03 [UNVERIFIED]" in file 18. **Budget $0.01–0.05** for spikes: Robinhood Chain (same Orbit stack) rose 23× to $0.024 in 11 days [15]. The l2fees.info figure ($0.27) is stale | [33][15] |
| Ethereum mainnet (wrong-network recovery) | Median **~$0.10** per tx (2026-09-28) | New | [34] |
| **Coinbase Onramp, no subsidy** | **2.5%** debit/credit/Apple/Google Pay; **0.5%** ACH; plus spread and network fee; ~$5 min | Replaces "2.5–4% [UNVERIFIED]" in file 17 | [8] |
| Coinbase Onramp, zero-fee USDC subsidy | ~$0 + network fee | Still "select partners" | [8] |
| **zerohash ACH pull / RTP payout** | Private. The platform sets the spread; public disclosure shows **100–400 bps** spread bands and example commissions ($10 or 0.5%) for EU; NY cap 7.5% | No public US number. **Model $0.25–0.75 per ACH, $0.50–1.50 per RTP [UNVERIFIED]** | [29] |
| RTP / FedNow network | **$0.045** per credit transfer wholesale; receiving ~$0.01 | New | [37] |
| Bridge FedNow payout | $0.50 existing / $1.00 new developer | Unchanged (file 17) | file 17 |
| **Plaid** | Auth: a one-time charge per connected account; Balance **~$0.05–0.15 per call [UNVERIFIED]**; free Trial (10 production Items) for teams created from 2026-04-15; Growth/Custom minimums $1k–10k+/mo **[UNVERIFIED]**. $0 if bundled through the zerohash Reseller | Trial is new | [38] |
| **Card processing** (only if Blunts ever is the merchant) | **2.9% + 30¢**; **$15** per dispute; ACH debit 0.8% capped at $5; Instant Payouts 1.5% (min 50¢) | Benchmark | [35] |
| **Chargebacks** | Average rate **0.17–0.26%** (Q1–Q3 2025); crypto average chargeback value **$99**; friendly fraud ~45–80% of disputes **[UNVERIFIED secondary]**. With Coinbase as merchant of record in Headless, **Coinbase likely eats these [UNVERIFIED; contract]** | New | [39] |
| **ACH returns** | Nacha: **0.5%** unauthorized (R05/R07/R10/R11/R29/R51), **3%** administrative, **15%** overall; unauthorized returns up to **60 days**. Underbanked NSF: **assume 3–8% of pulls [EST]** (lending data shows 12–18% [40]) | New | [30][31][40] |

### 4.2 Margin per transaction with 1% charged (Blunts' view)

**$50 fill** (1% = **$0.50**)

| Rail | Rail cost | Dinari buy | Total cost | **Net to Blunts** |
|---|---|---|---|---|
| Cash App USDC → Arbitrum | $0 | $0.20 (or ~$0.01 arrears) | $0.20 / $0.01 | **+$0.30 / +$0.49** |
| Coinbase Headless Apple Pay, subsidized | ~$0.004 | $0.20 | ~$0.20 | **+$0.30** |
| Coinbase Headless Apple Pay, **unsubsidized**, Blunts absorbs | $1.25 + spread | $0.20 | ≥ $1.45 | **−$0.95** (pass it through instead → user pays ~3.5% all-in) |
| zerohash ACH pull | $0.25–0.75 + Plaid $0.05–0.15 + return reserve ~$0.10 **[EST]** | $0.20 | $0.60–1.20 | **−$0.70 to −$0.10** |
| Own card processor (not planned) | $1.75 + disputes | $0.20 | ~$2.00 | **−$1.50** |

**$100 spark** (1% = **$1.00**)

| Rail | Rail cost | Dinari sell | Total | **Net** |
|---|---|---|---|---|
| USDC → user's Cash App | ~$0.004 gas | $0.20 | ~$0.21 | **+$0.79** |
| zerohash RTP | $0.50–1.50 **[UNVERIFIED]** | $0.20 | $0.70–1.70 | **+$0.30 to −$0.70** |
| Bridge FedNow (non-NY) | $0.50–1.00 | $0.20 | $0.70–1.20 | **+$0.30 to −$0.20** |

**Takeaways:**
- **1% works only on the Cash App rail and the subsidized Apple Pay rail.** On bank rails 1% doesn't cover cost below ~$60–120 per transaction.
- Options: set a **minimum fee ($0.50)** on bank fills and sparks, set a **minimum bank fill ($25)**, or push bank users to zerohash **virtual-account push deposits** (no return risk; file 17).
- A $0.50 minimum on a $25 bank fill is 2%, which is regressive (see file 08 §1).

### 4.3 Annual per user (base case from file 08: $600 fills in 12 × $50, $360 sparks in 4 × $90, $500 balance)

| | Spark-only 1% (file 08) | **1% fill + 1% spark** |
|---|---|---|
| Blunts fee revenue | $3.60 | **$9.60** |
| Dinari order cost (16 orders) | $3.20 flat / ~$0.16 arrears | same |
| Net (Cash App rail) | $0.40 / $3.44 | **$6.40 / $9.44** |
| Effective cost to user, % of balance/yr | 0.72% | **1.92%** |
| vs Acorns $3–4/mo at $500 | 7.2–9.6% | cheaper |
| vs QQQ held at Robinhood/Cash App | ~0.20% (expense ratio only) | ~10× more expensive |
| Users to cover Dinari's $24k/yr | ~6,700 | **~2,500** |

(Under structure **A**, the $9.60 is Dinari's, and Blunts receives whatever fixed fee is negotiated against it.)

---

## 5. Price elasticity evidence

| Evidence | What it shows | Relevance | Source |
|---|---|---|---|
| **Zero-price effect** (Shampanier, Mazar & Ariely 2007) | Moving from a tiny price to **$0** raises demand far more than the price change implies. "Free" adds perceived benefit | "Free to fill" is worth more than 1% suggests. Adding a fill fee loses the "free" label on the most frequent action | [41] |
| **Mobile-banking deposit-fee experiment** (Callen, De Mel, McIntosh & Woodruff, RESTAT) | Deposit fees randomized **from 8% of the deposit down to 0**. **Elasticity not statistically different from zero**; usage was low even at a 0% fee (26% ever deposited) | Among users who already adopted, small deposit fees don't cut deposit counts much. **Adoption and habit matter more than price** **[details via search snippet; PDF certificate error]** | [42] |
| **2019 zero-commission switch** (Schwab, TD, E*Trade, Fidelity) | Commissions went to $0 within days. Schwab gave up **$90–100M/quarter** and TD **15–16% of revenue**. Academic work uses it as a shock that **expanded the retail investor base** | Retail equity investors now anchor on $0. A 1% ETF commission stands out, and competitors can undercut on price | [43][44] |
| **Acorns $1 → $3 (2021)** | Vocal backlash and close-account threats at < $500 balances; Acorns kept raising (now $3–4 / $6–8 / $12) | Users tolerate fees they don't see per action. Recurring flat fees read as "7%/yr" to savvy users | [16], file 08 |
| **Cash App bitcoin** | Users pay ~2% on small discretionary buys at scale ($1.81B Cash App bitcoin revenue in Q2 2026). Block **cut fees on recurring buys to 0** and accepted **−31% gross profit** | Fee tolerance is real for **discretionary, speculative** buys. For **habitual auto-buys** the leader chose $0 | [1][2] |
| **Instant-transfer fee increases** (PayPal/Venmo 1.5% → 1.75%, 2022) | No reported usage collapse; instant fees remain a large line for P2P apps | **Speed** fees are inelastic. **Deposit** fees aren't comparable | [11] |
| **Robinhood 1% deposit boost / IRA match** | Paid users to move money in | Blunts' fill fee is the reverse of the incumbents' acquisition tactic | [45] |

**[EST] Break-even for adding the 1% fill fee:**
- **Incremental revenue:** ~$6/yr × ~2.9-year life ≈ **$17 lifetime per funded user**.
- **Referral-led growth (CAC ≈ $10):**
  - Fee-free lifetime revenue is ~$10 (spark-only) to ~$19 (scale mix, file 08).
  - The fill fee is revenue-positive unless it cuts funded conversion by more than **~45–60%**.
- **Paid acquisition (~$70 per funded user):** break-even falls to a **~20%** conversion hit.
- Validate with an A/B price test in beta: "1% per move" vs "free to fill, 1% to spark." Measure funded rate, fills/month and 90-day retention.

---

## 6. Recommendation

1. **Price as "1% per move" on the trade, not on the deposit.** Dinari Securities charges it as a disclosed commission on the QQQ buy (fill) and sell (spark), shown on the 10b-10, in Form CRS and on every fill and spark screen. Blunts takes a **fixed** fee from Dinari (structure A). Get Dinari's written 2040 position first (file 06 Q11).
2. **Cap it at $10 per move** and **set a $20 minimum fill** (so $0.20 order fees stay ≤ 1%). No per-fee minimum on the Cash App rail.
3. **Pass through third-party rail fees as separate lines** (Coinbase 2.5% if unsubsidized; the Cash App $1 cash load happens outside Blunts). Never hide them in "1%."
4. **One extra fee only: instant spark to bank, 1% (min $0.50).** Spark to Cash App stays free. No inactivity fee, no expedited-fill fee, no paper-money program.
5. **Start the introducing-BD path (structure B)** if investors want Blunts to earn the 1% directly. Budget 6–9 months and ~$250–500k first year **[EST]**.
6. **Track the SEC UI statement and innovation exemption.** A future "user signs every order, true self-custody, on-chain venue" version of Blunts could earn a per-transaction % without registering, but not the current auto-buy design.
7. **Beta test:** A/B "1% per move" vs "free fill + 1% spark." Kill the fill fee if funded conversion falls more than ~20% on paid channels.

### Open questions to add to vendor lists
- **Dinari:** Will Dinari Securities charge a 1% *buy* commission for Blunts-channel accounts? Does "network fees at cost in arrears" apply to US orders, and what's the actual per-order gas? Is the fixed platform fee negotiable against the $2k minimum?
- **zerohash:** Actual US ACH / RTP per-transaction price. Can the platform `fees` array pay Blunts, and how is it remitted? Does it count as Blunts revenue or zerohash's?
- **Coinbase:** Subsidy status. Does Headless support a partner fee? (None is documented [8].)
- **Counsel:** Is an onramp fee on auto-invested fills transaction-based compensation for the securities purchase? Could the Reg BI care analysis support a 1% ETF commission for a single-fund app?

---

## Sources

1. Cash App, bitcoin fees (tiers 2.0% / 1.5% / 0.9% / 0%; 0–0.75% spread; Auto Invest / Round Ups / DD zero fee and spread): https://cash.app/bitcoin/fees ; https://cash.app/help/us/en-us/3103-bitcoin-fees
2. The Block, Block Q2 2026 (bitcoin revenue $1.89B, gross profit $72M, −31%, fee cuts), 2026-08-05: https://www.theblock.co/post/410923/blocks-bitcoin-gross-profit-falls-31-cash-app-fee-cuts-shares-reverse-initial-gains ; Block 10-Q Q2 2026: https://www.sec.gov/Archives/edgar/data/0001512673/000162828026053368/xyz-20260630.htm
3. Robinhood, crypto order routing ($0.95 per $100 from market makers, as of 2026-06-15): https://robinhood.com/us/en/support/articles/crypto-order-routing/
4. Robinhood, crypto fee tiers (0.85%–0.03% smart exchange routing; "up to 70% lower"): https://robinhood.com/us/en/support/articles/crypto-fee-tiers-promo
5. Robinhood, instant bank transfers (withdrawal 1.75%, $1 min / $150 max; instant deposits free): https://robinhood.com/us/en/support/articles/instant-bank-transfers/
6. Coinbase simple-trade fees (secondary: ~0.5% spread, 1.49% bank / 3.99% debit): https://tokenecho.io/guides/coinbase-fees-explained-every-fee-youll-pay-in-2026-and-how-to-reduce-them/ ; primary disclosure (not fetched): https://help.coinbase.com/en/coinbase/trading-and-funding/pricing-and-fees/fees
7. Coinbase instant cash-out 1.5%, $0.55 min (secondary): https://coinbureau.com/guides/how-to-withdraw-money-on-coinbase
8. Coinbase Onramp FAQ (2.5% card/Apple Pay, 0.5% ACH, spread, ~$5 min; zero-fee USDC via subsidy; free for developers): https://docs.cdp.coinbase.com/onramp/additional-resources/faq
9. PayPal crypto fees (primary page links to the schedule; tiers via secondary): https://www.paypal.com/us/cshelp/article/crypto-on-paypal-fees-and-exchange-rates-help572 ; https://paybis.com/blog/paypal-crypto-fees-explained/
10. Venmo crypto FAQ (fees vary by amount; PYUSD free; PayPal Digital from 2026-05-19): https://help.venmo.com/cs/articles/cryptocurrency-faq-vhel141
11. Venmo/PayPal instant transfer 1.75% ($0.25/$25) (secondary): https://transferfees.io/venmo-fee-calculator/ ; PayPal: https://www.paypal.com/us/cshelp/article/can-i-transfer-money-to-my-debit-card-help497 ; 2022 increase: https://techcrunch.com/2022/04/21/paypal-venmo-increase-instant-transfer-fees/
12. MoonPay fees 4.5% / 1%, $3.99 min (secondary): https://cryptoticker.io/en/moonpay-fees-and-licence/ ; partner fees: https://support.moonpay.com/en/articles/694421-configuring-your-widget-assets-fees-and-theming ; https://support.moonpay.com/en/articles/389109-how-do-affiliate-payouts-work
13. Stripe Fiat-to-Crypto Onramp terms (spread-based): https://stripe.com/legal/crypto-onramp
14. Robinhood EU, stock tokens (0.10% FX fee, 0.5% buffer): https://robinhood.com/eu/en/support/articles/buy-and-sell-stock-tokens/
15. Bitquery, Robinhood Chain gas ($0.001 → $0.024 per simple transfer, Aug 22–Sep 3, 2026): https://bitquery.io/investigations/robinhood-chain-gas-price-25x ; free-gas promo through 2026-09-29 (secondary): https://gokhshtein.com/news/2026-09-07-robinhood-chain-goes-live-on-arbitrum-free-gas-through-sept
16. Acorns pricing: https://www.acorns.com/pricing/ ; Frequent Miler on the $1 → $3 increase (2021-07-23): https://frequentmiler.com/yuck-acorns-increasing-fee-to-3-per-month/
17. Stash fees (instant 1%, $75 ACATS; secondary): https://www.brokerage-review.com/account-fee/withdraw-money/stash-withdrawal-fee.aspx ; https://www.nerdwallet.com/reviews/investing/advisors/stash-invest
18. Cash App cash-out speed options (page didn't render; 0.5–1.75% via secondary): https://cash.app/help/us/en-us/3073-cash-out-speed-options ; https://wise.com/us/blog/cash-app-fees
19. Cash App paper money deposits ($1; $1k / 7 days): https://cash.app/help/us/en-us/6488-paper-money-deposits
20. Green Dot retail reload fee (up to $4.95): https://www.greendotnetwork.com/help ; Chime cash deposits: https://help.chime.com/hc/en-us/articles/115002097907-How-do-I-deposit-cash-into-my-Chime-Account
21. FINRA Rule 2121 and Supplementary Material .01 (5% Policy "a guide, not a rule"; small-transaction factor): https://www.finra.org/rules-guidance/rulebooks/finra-rules/2121
22. FINRA Rule 2122: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2122 ; *Fortrend* AWC: https://www.brokeandbroker.com/3276/finra-awc-fortrend/
23. FINRA Rule 2040: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2040
24. FINRA Reg BI key topic and oversight report (costs, reasonably available alternatives): https://www.finra.org/rules-guidance/key-topics/regulation-best-interest ; https://www.finra.org/rules-guidance/guidance/reports/2024-finra-annual-regulatory-oversight-report/reg-bi-form-crs ; https://www.oysterllc.com/what-we-think/reg-bi-compliance-reasonably-available-alternatives/
25. SEC staff statement on Covered User Interface Providers (2026-04-13): https://www.sec.gov/newsroom/speeches-statements/staff-statement-regarding-broker-dealer-registration-certain-user-interfaces-utilized-prepare-staff-statement-regarding-broker-dealer-registration-certain-user-interfaces-utilized ; Sidley analysis: https://www.sidley.com/en/insights/newsupdates/2026/04/us-sec-clears-path-for-decentralized-crypto-asset-security-trading
26. Cooley on the SEC innovation exemption for on-chain tokenized stock trading (2026-09-17 order): https://www.cooley.com/news/insight/2026/2026-09-22-permission-to-innovate-sec-carves-out-path-for-on-chain-stock-trading ; https://www.sidley.com/en/insights/newsupdates/2026/09/sec-issues-innovation-exemption-for-onchain-trading-of-tokenized-us-listed-stocks
27. FINRA new-member time frames: https://www.finra.org/registration-exams-ce/broker-dealers/how-become-member-membership-application-time-frames ; FINRA fee schedule: https://www.finra.org/registration-exams-ce/classic-crd/fee-schedule ; costs (secondary): https://lenderkit.com/blog/costs-to-register-a-broker-dealer/ ; https://www.innreg.com/blog/finra-nma-guide
28. Transaction-based compensation as the broker hallmark; RIA cases: https://www.wsgr.com/en/insights/no-commission-without-permission-sec-reinforces-focus-on-sales-activities-and-transaction-based-compensation-as-hallmarks-of-broker-dealer-status-in-recent-settlements.html ; https://www.akingump.com/en/insights/alerts/sec-targets-broker-dealer-implications-of-transaction-based-deal
29. zerohash transaction fees (platform spread + up to 5 fees; NY 7.5% cap): https://docs.zerohash.com/docs/transaction-fees ; pricing disclosures (100–400 bps bands; commission examples): https://zerohash.com/disclosures/pricing-and-fees
30. zerohash ACH returns (60-day unauthorized window; 0.5% / 3% / 15%): https://docs.zerohash.com/docs/ach-returns
31. Nacha risk and enforcement topics: https://www.nacha.org/rules/ach-network-risk-and-enforcement-topics
32. Dinari fees ($2,000/mo; $0.20/order; at-cost network fees in arrears; `fee` field): https://docs.dinari.com/docs/fees
33. Arbiscan gas tracker (0.02 gwei, ~$0.004 ERC-20 transfer, 2026-09-28): https://arbiscan.io/gastracker
34. growthepie transaction costs (Ethereum median ~$0.10, 2026-09-28): https://www.growthepie.com/fundamentals/transaction-costs
35. Stripe pricing (2.9% + 30¢; $15 dispute; ACH 0.8% capped at $5; Instant Payouts 1.5%): https://stripe.com/pricing
36. Card surcharge rules 2026 (debit prohibited; 3% credit cap; CA/CT/ME/MA bans) (secondary): https://www.lifelongpos.com/resources/blog/visa-surcharge-rules-2026-compliance-guide
37. FedNow 2026 fee schedule: https://www.frbservices.org/resources/fees/fednow-2026 ; RTP vs ACH ($0.045 wholesale; secondary): https://www.routable.com/resources/rtp-vs-ach/
38. Plaid billing docs: https://plaid.com/docs/account/billing/ ; pricing estimates (secondary): https://www.fintegrationfs.com/post/plaid-api-pricing-structure-and-plans
39. Chargeback statistics (secondary): https://sift.com/index-reports-disputes-q4-2025/ ; https://www.chargeback.io/blog/chargeback-statistics
40. ACH NSF rates in consumer lending (secondary): https://liftoffplatform.com/blogs/news/reduce-ach-nsf-rates-2026
41. Shampanier, Mazar & Ariely (2007), "Zero as a Special Price," *Marketing Science* 26(6): https://pubsonline.informs.org/doi/10.1287/mksc.1060.0254
42. Callen, De Mel, McIntosh & Woodruff, "What Are the Headwaters of Formal Savings? / Can Mobile-Linked Bank Accounts Bolster Savings?" (RESTAT, accepted 2020): https://chriswoodruff.qeh.ox.ac.uk/wp-content/uploads/2020/06/MobileBank_RStat_Accepted_200624.pdf
43. CNBC on the 2019 zero-commission switch (Schwab $90–100M/quarter; TD 15–16%): https://www.cnbc.com/2019/10/01/charles-schwab-is-eliminating-online-commissions-for-trading-in-us-stocks-and-etfs.html ; https://www.cnbc.com/2019/10/04/battle-for-zero-trading-fees-pressures-robinhoods-next-leg-of-growth.html
44. Aggarwal, Choi & Lee, "Retail Investors and Corporate Governance: Evidence from Zero-Commission Trading": https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4708496
45. Robinhood Gold 1% deposit boost (ended 2024-11-25): https://robinhood.com/us/en/support/articles/robinhood-gold-deposit-boost ; retirement match: https://robinhood.com/us/en/about/retirement/
46. Brokers without inactivity fees (secondary): https://brokerchooser.com/invest-long-term/costs/inactivity-fee-firstrade ; CFPB junk fees: https://www.consumerfinance.gov/rules-policy/junk-fees/
