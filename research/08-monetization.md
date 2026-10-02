# Blunts: How Blunts Makes Money (Revenue Lines, Benchmarks, Unit Economics)

**Date:** 2026-09-28 | **Status:** Research memo. It is NOT legal, tax or investment advice. Items tagged **[UNVERIFIED]** could not be confirmed against a primary source in this pass. **[EST]** marks a modeling assumption made for this memo. Numbered citations like [M3] point to the Sources list at the end.

Builds on `03-legal-tax-compliance.md`, `04-us-stack-dinari-alpaca.md` (§A fee model, §B app-store fees) and `05-payout-methods.md`. It doesn't redo them.

---

## TL;DR

1. **At realistic balances ($300–$800) no single revenue line pays for a user.** A typical Blunts user who fills $50/month and sparks ~60% of it back out generates about **$3.60/year from a 1% spark fee**. Every other "invisible" line (cash float, AUM fee at 0.25–0.5%) adds $1–3. Serving that user costs about **$4–5/year** plus ~$3 to onboard. The **spark fee alone is roughly break-even on variable cost and never repays paid acquisition.**
2. **The honest shape of the business:** Blunts earns **~$4–5/user/year at MVP** (spark fee + cash float) and **~$12/user/year at scale** (adding an opt-in "Blunts+" membership, a debit card and affiliate offers), with a **high case of ~$26**. For comparison, Robinhood's ARPU was **$187** in Q2 2026 [M10] and Chime's was **~$245** in 2025 [M14]. Those numbers come from much bigger balances (Robinhood) or from being the user's main checking account (Chime).
3. **So growth has to be nearly free.** At ~$6.60/year contribution (scale mix) and ~35% annual churn [EST], lifetime value is roughly **$19** (≈$40 if churn matches Acorns' ~15%/yr). Blended CAC must stay **under ~$10–20 per funded user**, which means referral/creator/organic distribution. That's Cash App's 2021 level ($10) [M16], not Chime's ($109 per new active in 2024) [M15] or the typical paid fintech install ($15–20+ CPI) [M17].
4. **Legal fit (given Blunts = RIA on Alpaca Broker API, per file 04):**
   - Clean: advisory fee (AUM or flat), subscription billed from the account, cash-sweep take rate via Alpaca, card interchange via Bridge/Stripe/Lithic, affiliate referral fees (with disclosure).
   - Needs counsel + BD sign-off: the **1% spark fee** (as a BD commission via Alpaca's `commission` field, or as a disclosed RIA fee; file 04 §A).
   - Not available: **PFOF** (only the BD receives it; Blunts can't share it without being a BD), **performance fees**.
   - Risky/shrinking: **stablecoin reserve rewards** (GENIUS Act effective by 2027-01-18; OCC proposed a presumption against issuer→affiliate/third-party yield pass-through [M22]); **Blunts-run instant push-to-card** (money transmission; file 05).
5. **Recommended MVP mix:** **1% spark fee** (cap it, never on fills, never on profit) **+ keep the Alpaca cash-sweep spread on in-transit/idle cash**. Instant withdrawal goes out **free via Cash App USDC** as a growth feature, not a fee line.
6. **Recommended scale mix:** keep the spark fee, then add, in order: **(a) Blunts+ at $3/month, opt-in, billed from the account** (waives spark fees, adds perks); **(b) a Blunts debit card on Bridge (100% of interchange) [M20]**; **(c) a "cash stash" bucket** where Blunts keeps ~0.5–1% of the sweep yield; **(d) affiliate offers**; **(e) B2B/white-label**. Never make the subscription mandatory at these balances: $36/year on $500 is **7.2%/year**, which the SEC's own investor bulletin warns about [M8].

---

## 0. Baseline assumptions used everywhere

| Input | Low | **Base** | High | Notes |
|---|---|---|---|---|
| Average invested balance | $300 | **$500** | $800 | Brief's range. Acorns' ADV-based figures imply ~$2k per funded account, but that's a much older, broader base **[UNVERIFIED]** [M5] |
| Fills (deposits) per year | $300 | **$600** ($50/mo) | $900 | |
| Sparks (withdrawals) as % of fills | 40% | **60%** | 80% | **[EST]** Underbanked users use savings as an emergency buffer. Worth validating in beta |
| Sparks per year (dollar volume) | $120 | **$360** | $720 | |
| Idle / in-transit cash as % of balance | 3% | **5%** | 8% | Auto-invest keeps this small |
| Short rates | | **EFFR 3.88%, 3-mo T-bill 4.08%** (2026-09-24) | | After the Sept 16, 2026 hike to 3.75–4.00% [M23][M24] |

---

## 1. Sell-side "spark" fee (~1%)

### Legality
Covered in file 04 §A. Summary:
- It must be charged by a registered entity: **the BD as a disclosed commission** (Alpaca `commission` field set per order, so sells-only is possible; Dinari `fee` field) **or Blunts as an RIA** with a disclosed fee.
- Attach it to the **sell order**, not the cash withdrawal (FINRA 2122 "exit fee" analysis; the *Fortrend* case).
- It is **not a §205 performance fee** as long as it's a % of the amount sold, never of gains.
- FINRA 2121 "fair commissions": 1% is defensible but will be questioned against $0 commissions elsewhere.
- Form CRS must disclose the conflict: **Blunts earns only when users take money out.**

### Revenue per user

| | Low | **Base** | High |
|---|---|---|---|
| Spark volume/yr | $120 | **$360** | $720 |
| 1% fee | $1.20 | **$3.60** | $7.20 |
| 1.5% fee | $1.80 | $5.40 | $10.80 |
| 1% with a $0.50 floor per spark **[EST: 12 sparks/yr]** | ~$6.00 | **~$6.00–6.50** | ~$8.00 |

- Effective "AUM-equivalent" rate: $3.60 / $500 ≈ **0.72%/yr** in the base case. The spark fee isn't cheap for the user; it's just invisible until exit.
- **It earns in down markets too.** It's a % of sale value, not profit. In a bad year users may panic-sell, which raises spark-fee revenue at the worst moment for them. That's a reputational risk.
- A floor ($0.50) roughly doubles revenue on small sparks but makes the fee regressive (2.5% on a $20 spark). Don't add a floor at launch.

### Behavioral risk
- **"Paying to leave" is the most complained-about fee type in consumer finance.** No mainstream app charges its own sells-only fee (file 04 §A.3). The only sells-only charges in the industry are the SEC §31 fee (**$20.60 per million** since 2026-04-04 [M25]) and FINRA TAF.
- **It punishes the exact behavior this audience needs.** For underbanked users, Blunts is often the emergency fund. A 1% haircut on a $40 rent-shortfall spark feels like an overdraft fee, even at $0.40.
- **It can delay churn, but resentfully.** Users who feel trapped leave loudly (reviews, TikTok). Acorns' BBB complaints cluster on fees charged at closure [M13].
- **Mitigations that preserve most revenue:**
  - Show the fee **before** the first fill ("It's free to fill. When you spark, we keep 1%.").
  - **Cap** it (e.g., $10 per spark) so big exits don't feel punitive.
  - Consider a **"first $25 of sparks each month free"** hardship allowance. It costs ~$1–2/user/yr in the base case **[EST]**.
  - Consider a **loyalty taper**: 1% on money held <12 months, 0.5% after. It rewards holding, costs little in year 1, and makes the conflict disclosure easier.

### UX fit with "never see your money go down when you fill": **excellent.** Fills are 100% invested.

---

## 2. Advisory / AUM fee (0.25–1%/yr)

### How incumbents do it

| Firm | Structure (2026) | Source |
|---|---|---|
| **Wealthfront** | 0.25%/yr, no minimum fee. Advisory is only ~24% of revenue; **60%+ comes from cash products** | [M6][M7] |
| **Betterment** | **$5/month** if balance < $24k *and* < $200/mo recurring deposits; otherwise 0.25%/yr | [M4] |
| **Stash** | $12/mo "Stash Plan" (or $108/yr) **plus** 0.25%/yr on Smart Portfolios ≥ $1,000 | [M3] |
| **Acorns** | Pure subscription: **$4 / $8 / $12 per month** on its pricing page today (third-party sites still list $3/$6/$12) | [M1][M2] |

Note what the robos did: **every one switched small balances to a flat fee**, because 0.25% of $500 is $1.25/yr.

### Revenue per user

| AUM rate | Low ($300) | **Base ($500)** | High ($800) |
|---|---|---|---|
| 0.25% | $0.75 | **$1.25** | $2.00 |
| 0.50% | $1.50 | **$2.50** | $4.00 |
| 1.00% | $3.00 | **$5.00** | $8.00 |

### Legality
Cleanest line for an RIA. It's billed from the account under the advisory agreement and needs a Form ADV 2A and Form CRS disclosure. Ask Alpaca whether its fee-billing works on fractional-only accounts (file 04 §5.4 Q4).

### UX fit: **good but visible.** A monthly deduction shows up as the balance ticking down on a flat market day. Bill it quarterly, and show it as a separate line ("Blunts fee: −$0.31"), so it never looks like a fill went down.

**Verdict:** at $300–$800 balances an AUM fee is dominated by the spark fee. Keep it as the **fallback** if counsel won't bless a % of sells (file 04 §A.4). A 0.5–0.75% AUM fee earns about the same as a 1% spark fee in the base case, with a much cleaner legal story.

---

## 3. Flat subscription ($1–$12/month)

### Benchmarks

| | Price | Conversion / scale | Source |
|---|---|---|---|
| Acorns | $4 / $8 / $12 per month | "Over 16 million all-time customers," $33B invested (Aug 2026). ~4.8M funded accounts per ADV **[UNVERIFIED secondary]** | [M1][M5] |
| Stash | $12/mo or $108/yr (single plan; old $3 Growth / $9 Stash+ tiers retired) | n/a | [M3] |
| Robinhood Gold | $5/mo | **4.8M subscribers of 28.4M funded (~17% adoption); ~40% of new funded customers took Gold in Q2 2026** | [M10] |
| Coinbase One | paid tier | Coinbase put USDC rewards behind it on 2025-12-15 | [M19] |

### The regressive-fee problem
- The SEC's **Investor Bulletin on subscription-based advisory fees** warns that for small balances "small monthly fees can add up to a large percentage" [M8].
- Math: **$3/mo on $500 = 7.2%/yr; on $100 = 36%/yr.** Stash reviewers make the same point (7.2% at $500) [M9].
- Acorns' BBB file shows the other failure mode: billing continuing after users thought they'd closed, and liquidating holdings to pay the fee [M13].
- The CFPB's negative-option guidance also applies to hard-to-cancel subscriptions [M13].

### Revenue per user

| | Low | **Base** | High |
|---|---|---|---|
| Mandatory $3/mo | $36 | **$36** | $36 |
| Opt-in $3/mo at 5% / **10%** / 15% conversion | $1.80 | **$3.60** | $5.40 |

Robinhood's 17% adoption comes from a product with margin and a 4% cash yield. Assume Blunts gets **5–15%** at first **[EST]**.

### Legality / app store
- As an RIA advisory fee, this is clean.
- Apple/Google: if billed **from the brokerage account** (like Acorns and Robinhood Gold), it's outside IAP. If sold as an in-app feature unlock, it falls under IAP (file 04 §B).

### UX fit
- **Mandatory: poor.** The balance visibly goes down with no fill, and it's regressive.
- **Opt-in "Blunts+": good**, as long as the value is obvious. For example: spark fees waived, instant sparks free, bigger card cashback, a Roth IRA match.

---

## 4. Interest on uninvested cash / stablecoin float

### 4a. Alpaca cash sweep (Alpaca path)
- Alpaca's High-Yield Cash / **FDIC Bank Sweep** lets partners set `correspondent_fee_bps` (the partner's take) alongside `account_rate_bps` (the customer's rate). Their sum can't exceed the program rate.
- The documented example: **customer 4.25% APR, partner take 0.25%**. The promotional example has a 0 bps partner take [M11][M12].
- Commercial terms are negotiated [M11].
- Separately, Alpaca's Profit Sharing Sweep terms say Alpaca itself receives fees from the deposit banks [M12].
- With EFFR at 3.88% [M23], assume the gross program rate is ~3.5–3.9% **[EST]**.

| Design | Base-case $/user/yr |
|---|---|
| Blunts auto-invests everything; ~$25 idle/in-transit; Blunts takes 0.25% | **$0.06** (rounding error) |
| Same $25 idle, Blunts keeps the whole ~3.5% (user gets 0%) | **$0.88** |
| **"Cash stash" bucket:** user parks $200 as cash, earns ~3%, Blunts keeps ~0.75% | **$1.50** **[EST]** |

- **Lesson from Wealthfront:** cash products are **60%+ of revenue** [M7]. Robinhood made **$389M net interest in Q2 2026** [M10].
- But Blunts' product *is* auto-investing. The float is small unless Blunts deliberately offers a cash bucket. That's a scale feature (it's "savings," which this audience needs).

### 4b. Stablecoin float (Dinari / Cash App USDC path)
- **USDC:** Blunts is not the issuer and gets no reserve share by default.
  - Circle's distribution is dominated by Coinbase (100% of reserve income on-platform, 50% off-platform; renewed into 2029) [M26].
  - Circle paid **$410M** in distribution costs in Q2 2026 [M26]. Other partners negotiate bespoke deals. A seed-stage app won't get meaningful terms **[UNVERIFIED]**.
  - Coinbase's own retail USDC rewards: **3.5%, Coinbase One members only, since 2025-12-15** [M19].
- **USDG / Global Dollar Network (Paxos):** partners can receive **"up to 100% of the returns generated by assets backing USDG held on your platform"** [M21]. That's the only realistic stablecoin float line.
  - Rates and eligibility aren't public; ask Paxos.
  - USDG supply is ~$3.2B (Sept 2026) **[UNVERIFIED secondary]**.
- **Dinari USD+:** 3.51% APY (2026-06-25) **[UNVERIFIED secondary]** [M27], but not usable as US settlement (file 04).
- **Legal risk is rising:**
  - The **GENIUS Act** takes effect by **2027-01-18**, and it bars issuers from paying yield [M22].
  - The OCC's **March 2026 proposal** creates a **rebuttable presumption** of a violation when an issuer pays an affiliate or *related third party* that then pays yield to holders [M22].
  - The **CLARITY Act** (which would have allowed activity-based rewards) **failed in the Senate on 2026-09-15**, so third-party rewards are in limbo [M28].
  - Blunts keeping reserve rewards **for itself** (not passing them to users) is the lower-risk variant, but it's still commercially fragile.
- **$/user:** at ~$25–50 average float × ~4% gross × a partner share of 50–100% → **$0.50–$2.00/yr** **[EST]**.

### UX fit: **invisible, excellent.** But don't market "earn yield" on the stablecoin path.

---

## 5. Payment for order flow / broker rev share

- **Alpaca** makes money mainly from **interest on uninvested balances and PFOF** (its own explainer) [M29]. Its disclosures say partner arrangements "may preclude commission free trades" [M29].
- **Blunts cannot receive PFOF.** It's paid to the routing BD. Passing transaction-based pay to a non-BD runs into FINRA Rule 2040 (file 04 §A.1).
- Alpaca's support page: **"No, Alpaca does not have a referral program"** for API partners [M30]. DriveWealth's partner economics aren't public; commoditization is pushing PFOF rates down [M31].
- Order sizes: a $50 fill is tiny. Even Robinhood's equities PFOF is only **$129M/quarter across 28.4M customers** (~$18/yr/customer, from active traders) [M10].
- **$/user: $0.** The legal route is **the spark fee via the `commission` field** or a **fixed per-funded-account fee from the BD** (Rule 2040-friendly). Ask Alpaca whether it will give up part of its PFOF/float as a platform-fee discount. That's a cost line, not revenue.

---

## 6. Debit card interchange ("Blunts card")

### Rates
- **Durbin-regulated issuers** (> $10B assets): capped at **21¢ + 0.05% (+1¢ fraud)**. The Fed's 14.4¢ proposal is still pending [M32][M33].
- **Exempt issuers:** Fed data shows the average exempt debit interchange was **$0.52 per transaction in 2023** ($0.62 dual-message / signature; $0.27 single-message / PIN) [M34]. On a ~$40 average ticket that's **~1.3%**.
- **Program-manager share:**
  - **Bridge** (Stripe) cards: "you keep **100% of interchange**," plus optional custom per-transaction fees [M20].
  - **Lithic** starter: **0.2% on the first $100k of volume, 0.4% after** [M35].
  - **Stripe Issuing** consumer prepaid: interchange rev share "for eligible platforms" [M36].
- **Chime proves the model at scale:** ~76% of revenue from interchange; ARPAM ~$245 [M14]. But that's because Chime is the user's **primary account** (direct deposit).

### Revenue per user (blended across all users)

| | Low | **Base** | High |
|---|---|---|---|
| Card attach rate | 5% | **10%** | 20% |
| Monthly spend per cardholder | $150 | **$250** | $400 |
| Net take to Blunts **[EST ~1.0% after processing/card costs]** | $0.90 | **$3.00** | $9.60 |

### Legality and structure
- Blunts would be a **program manager** under a sponsor bank / Bridge. Bridge operates under its own NMLS licensing [M20].
- The hard part is **where the spend comes from.** Spending straight from invested balances means a sell (and a spark fee) on every swipe. That's an awful UX and piles up tax lots.
- **Practical design:** the card spends from a **cash bucket** (the same "cash stash" from §4a) or from **USDC** (Bridge's stablecoin-backed card).

### UX fit
Good as "spend your sparks," but it's **scope creep into neobanking.** Phase 3, not MVP.

---

## 7. Instant withdrawal fee

### Benchmarks
- **Robinhood:** 1.75% (min $1 / max $150) [M37].
- **Cash App:** instant transfer to debit is variable, commonly cited as **0.5–1.75% (min $0.25)**; some 2026 secondary sources say up to 2.5% **[UNVERIFIED on cash.app, which failed to load]** [M38].
- **Stripe Instant Payouts:** 1.5% / $0.50 min (cost side; file 05).

### Legality
- File 05 found that **Blunts-run push-to-card** requires money to pass through an FBO / payout provider. If Blunts is in the flow of funds, that's **money transmission**. Alpaca also documents no instant rail.
- The compliant instant path is **sell → USDC → the user's own Cash App** (user-signed, ~free).
- Charging a fee *on* that path is possible (Bridge allows developer fees) but raises the MSB question again.
- If Blunts is an RIA, an extra "speed fee" also has to be in the ADV.

### Revenue per user
Base: $360 of sparks × 30% instant × (1.75% fee − ~0.8% cost) ≈ **$1.03/yr** (low $0.23, high $2.74) **[EST]**.

### Verdict
**Don't charge for instant at MVP.** "Spark to Cash App in 2 minutes, free" is a better acquisition hook than $1/user/yr is worth. It also stacks a second exit fee on top of the 1% spark (1% + 1.75% = 2.75% to leave fast, which looks predatory). Later, bundle free instant sparks into Blunts+.

---

## 8. Premium features, referral/affiliate, B2B

| Line | What | $/user/yr (base) | Legality / fit |
|---|---|---|---|
| **Blunts+ perks** | Spark-fee waiver, free instant sparks, card cashback boost, Roth IRA match (Acorns and Stash use 1–3% matches [M1][M3]) | Counted in §3 | RIA fee; bill from the account |
| **Affiliate / lead-gen** | Credit builders, secured cards, high-yield savings, insurance. Typical fintech CPAs are $20–$100+ per approved account **[UNVERIFIED]** | **$0.50–$2.00** **[EST: 2–4% annual conversion × ~$40]** | An RIA must disclose referral comp as a conflict. **Never** recommend credit to users in distress. Fit: moderate; keep it out of the fill flow |
| **Referral programs from partners** | Alpaca has none [M30]. Coinbase Onramp zero-fee USDC is a cost saving, not revenue (file 01) | $0 | — |
| **B2B / white-label** | "Blunts for employers / creators / credit unions": a payroll-split fill, a creator-branded basket. A CU could license the UX | Platform fee **$1–3/user/month** from the partner **[EST]** | Separate sales motion. Good at scale; distraction at MVP |
| **Data / insights** | Selling user data | $0 (**don't**) | Reg S-P / GLBA and trust. Off the table |

---

## 9. Summary table: every line

| # | Line | Legal under our structure? | Base $/user/yr (low–high) | UX fit | Phase |
|---|---|---|---|---|---|
| 1 | Spark fee 1% | Yes via BD commission or RIA fee; **counsel + BD sign-off** | **$3.60** (1.20–7.20) | Great on fill; painful on exit | **MVP** |
| 2 | AUM 0.25–1% | Yes (RIA) | $1.25–5.00 | Visible drift | Fallback |
| 3a | Mandatory subscription $3/mo | Yes (RIA) | $36 | **Poor** (7.2%/yr at $500) | No |
| 3b | Opt-in Blunts+ $3/mo | Yes | **$3.60** (1.80–5.40) | Good | Scale |
| 4a | Cash sweep spread (auto-invest) | Yes (Alpaca HYC take rate) | $0.06–0.88 | Invisible | **MVP** |
| 4a' | "Cash stash" bucket | Yes | ~$1.50 | Good (savings) | Scale |
| 4b | Stablecoin reserve rewards (USDG) | Grey after 2027-01-18 | $0.50–2.00 | Invisible | Opportunistic |
| 5 | PFOF / BD rev share | **No** (not a BD) | $0 | — | — |
| 6 | Debit card interchange | Yes (program manager via Bridge / Lithic) | **$3.00** (0.90–9.60) | Good if it spends from cash | Scale |
| 7 | Instant withdrawal fee | Risky (MSB) and double exit fee | $1.03 (0.23–2.74) | Poor alongside the spark fee | Bundle in Blunts+ |
| 8 | Affiliate | Yes, with disclosure | $0.50–2.00 | Moderate | Scale |
| 8 | B2B | Yes | per-contract | n/a | Later |

---

## 10. Unit economics

### 10.1 Cost per funded user

| Cost | Amount | Basis |
|---|---|---|
| **KYC** | Persona ~$1.50/check; market $1–3 [M39]. With 30–50% funnel loss → **~$2.50 per funded user**, one-time | [M39][M18] |
| **Bank link** (Plaid Auth) | ~$0.30–1.00 per link, one-time **[UNVERIFIED; Plaid prices by quote]** | [M40] |
| **ACH** | Alpaca ACH free (file 04). **ACH returns / instant-funding losses** for an underbanked base: **~$1/user/yr [EST]** | |
| **Broker platform** (Alpaca) | Bespoke. Plans like "StandardPlus3000/5000/10000" imply $3k–10k/month minimums **[UNVERIFIED]** [M41]. Model ~$1/user/yr variable (statements, 1099s, data) **[EST]** | |
| **Dinari** (if used) | **$2,000/month** API + **$0.20/order**. At 12 fills + 4 sparks of one ETF, that's **$3.20/user/yr**. A 9-stock basket would be 9× that | file 04 |
| **Support** | **$2/user/yr [EST]** (chat-first, low-touch) | |
| **Cloud / misc** | $0.50 [EST] | |
| **Fixed compliance** | RIA registration and outsourced CCO, SOC 2 (if Dinari), E&O, legal, Persona base ($250/mo), marketing review: **~$150–300k/yr [EST]** | files 03 and 04 |

**Variable cost: ~$4.50/user/yr on Alpaca (~$7.70 with Dinari single-ETF), plus ~$3 one-time onboarding.**

### 10.2 CAC benchmarks

| Benchmark | CAC | Source |
|---|---|---|
| Cash App (2021) | **$10** per new transacting active | [M16] |
| Chime (2024) | **$109** per new active member ($91 excluding brand); all-in S&M **~$371** per new active | [M15] |
| Consumer neobanks (2026 benchmark roundup) | $20–80 fully loaded | [M18] **[secondary]** |
| iOS finance CPI (US) | **$15–20+ per install** | [M17] **[secondary]** |
| Install → funded conversion | 20–40% **[EST]**; a $40 signup CAC becomes $80–120 per funded user | [M18] |

**For Blunts: paid social at $15–20 CPI and ~25% install→funded ≈ $60–80 per funded user. Referral/creator-led ≈ $5–15 [EST].**

### 10.3 Per-user P&L (annual, steady state)

| | MVP (spark 1% + cash float) | Scale (+ Blunts+ opt-in, card, affiliate) |
|---|---|---|
| Revenue, low / **base** / high | $1.52 / **$4.48** / $9.44 | $4.72 / **$12.08** / $26.44 |
| Variable cost (Alpaca) | $4.50 | $5.50 (adds card program cost) **[EST]** |
| **Contribution, base** | **≈ $0** | **≈ $6.60** |
| Lifetime at ~35% annual churn **[EST]** (≈ 2.9 yrs) | ≈ $0 | **≈ $19** |
| **Max CAC for LTV/CAC = 1** | $0 | **≈ $19** |
| Max CAC for LTV/CAC = 3 (healthy) | — | **≈ $6** |

Acorns cited 1.3% monthly subscriber churn in its 2021 deck (~15%/yr) [M42]. If Blunts can match that, lifetime roughly doubles and max CAC ≈ $40.

### 10.4 Break-even on fixed costs

| Fixed cost per year | Base contribution $6.60/user | High contribution ~$20/user |
|---|---|---|
| $300k (compliance + vendors only, founders unpaid) | **~45k funded users** | ~15k |
| $1.0M (+ small team) | **~150k funded users** | ~50k |
| $2.5M (Series A burn) | ~380k | ~125k |

**MVP (spark fee + float only) does not break even at any scale at base assumptions.** It covers variable cost and nothing more. It's a product-validation model, not a business model.

### 10.5 What actually moves the needle (sensitivities)

1. **Balance growth.** Net +$240/yr in the base case ($600 in, $360 out), so a surviving cohort's balance roughly doubles by year 2 and triples by year 3. That lifts every balance-based line (AUM, float, and Blunts+ conversion as users feel richer).
2. **Spark volume.** Revenue scales 1:1 with withdrawals. If users treat Blunts as a checking account (high sparks), spark revenue rises but so does churn and resentment.
3. **Card as primary account.** Chime-level ARPU needs **direct deposit**. A "get paid into Blunts, auto-fill 10%" feature is the one path to $50+/user/yr **[EST]**, and it's a much bigger regulatory and product build.
4. **CAC.** At these ARPUs the whole company depends on referral/creator distribution (fill-a-friend bonuses of a few dollars **in the basket**, not cash).

---

## 11. Recommendation

### MVP (first ~12 months, Alpaca + RIA)
1. **1% spark fee on sells.**
   - Charged via Alpaca's `commission` field (or as a disclosed RIA fee), per counsel.
   - Rules: capped (e.g., $10 per spark); **0% on fills**; never on gains; shown before first fill and on every spark screen and 10b-10 confirm.
   - Pilot a **"first $25/month of sparks free"** hardship allowance and measure the revenue cost.
2. **Keep the sweep spread** on idle and in-transit cash (Alpaca HYC `correspondent_fee_bps`). It's small but free.
3. **Instant spark to Cash App (USDC), free.** Use it as the growth hook.
4. **No subscription, no AUM fee, no card.**
5. **Target metrics for the MVP to "pass":** CAC per funded user ≤ $15 (referral-led), 12-month retention ≥ 60%, spark/fill ratio ≤ 60%, average balance ≥ $500 by month 12.
6. **Fallback if counsel or Alpaca won't do sells-only commission:** a 0.75% AUM advisory fee, billed quarterly. Roughly the same revenue in the base case and a cleaner legal story.

### At scale (after product-market fit, 100k+ funded)
1. **Blunts+ at $3/month, opt-in, billed from the account.** It waives spark fees and instant fees and adds card cashback plus a Roth match. Target 10–15% adoption.
2. **Blunts card on Bridge** (100% interchange), spending from a **cash stash** bucket. Pursue **direct deposit** as the endgame.
3. **Cash stash**: pay users most of the sweep yield and keep ~0.5–1%.
4. **Affiliate** (credit builder, insurance), outside the fill flow, fully disclosed.
5. **B2B white-label** for employers, creators and credit unions.
6. **USDG rewards** only if GENIUS rulemaking leaves room. Treat it as upside, never plan on it.

**Expected blended ARPU: ~$4–5 at MVP → ~$12 at scale (high case ~$26), vs. ~$4.50–5.50 variable cost per user. The business works only with near-free acquisition, rising balances, or becoming the user's primary account.**

---

## 12. Open questions to close

1. **Alpaca:** sells-only bps commission allowed contractually? Platform-fee minimums? HYC program rate and max `correspondent_fee_bps`? Does fee-billing work on fractional-only accounts?
2. **Counsel:** RIA charging a % of each sell vs. BD commission. Is the loyalty taper or hardship waiver "unfairly discriminatory" (FINRA 2122)? Does the Blunts+ spark waiver create a Reg BI / fiduciary conflict?
3. **Paxos GDN:** USDG reward rate, minimums, and whether a US RIA/fintech qualifies. Post-GENIUS posture.
4. **Bridge:** US consumer card availability by state; program costs; spend-from-USDC vs. spend-from-cash.
5. **Beta data:** real spark/fill ratio, average balance at 90 days, install→funded rate by channel.

---

## Sources

- [M1] Acorns pricing page ($4 / $8 / $12; 16M all-time customers as of 8/26/2026): https://www.acorns.com/pricing/
- [M2] Third-party listings still showing $3/$6/$12: https://www.nerdwallet.com/investing/reviews/acorns , https://costbench.com/software/personal-finance/acorns/
- [M3] Stash pricing ($12/mo or $108/yr; 0.25% AUM ≥ $1,000): https://www.stash.com/pricing
- [M4] Betterment pricing ($5/mo < $24k without $200/mo recurring; else 0.25%): https://www.betterment.com/pricing
- [M5] Acorns statistics, ADV-based funded accounts (secondary, **[UNVERIFIED]**): https://investingintheweb.com/brokers/acorn-statistics/
- [M6] Wealthfront fees: https://support.wealthfront.com/hc/en-us/articles/13992378758676-Understanding-Wealthfront-fees
- [M7] Wealthfront S-1 (advisory ~24% of revenue; cash products majority): https://www.sec.gov/Archives/edgar/data/1524566/000162828025043113/wealthfront-sx1.htm , https://www.mostlymetrics.com/p/wealthfront-ipo-s1-breakdown
- [M8] SEC Investor Bulletin, subscription-based advisory fees (page 403'd to the fetcher; content via search snippet): https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/subscription-based-advisory-fees
- [M9] Stash fee drag on small balances (secondary): https://www.moneyatlas.com/review/stash , https://www.nerdwallet.com/reviews/investing/advisors/stash-invest
- [M10] Robinhood Q2 2026 results (ARPU $187, 28.4M funded, 4.8M Gold, NII $389M, equities $129M): https://www.globenewswire.com/news-release/2026/07/29/3335576/0/en/robinhood-reports-second-quarter-2026-results.html
- [M11] Alpaca Global High-Yield Cash API (partner take rate): https://alpaca.markets/blog/alpacas-global-high-yield-cash-api/
- [M12] Alpaca HYC getting started (`correspondent_fee_bps`, 4.25% / 0.25% example); FDIC sweep terms: https://alpaca.markets/learn/getting-started-with-high-yield-cash-for-broker-api , https://files.alpaca.markets/disclosures/library/Alpaca+Securities+LLC+Profit+Sharing+FDIC+Bank+Sweep+Program+Terms+and+Conditions.pdf
- [M13] Acorns BBB complaints; CFPB negative-option guidance: https://www.bbb.org/us/ca/irvine/profile/investment-management/acorns-securities-llc-1126-1000065606/complaints , https://www.consumerfinance.gov/archive/newsroom/cfpb-issues-guidance-to-root-out-tactics-which-charge-people-fees-for-subscriptions-they-dont-want/
- [M14] Chime Q3 / FY2025 results (ARPAM): https://investors.chime.com/news-releases/news-release-details/chime-reports-third-quarter-2025-financial-results , https://investors.chime.com/news-releases/news-release-details/chime-reports-fourth-quarter-and-full-year-2025-financial
- [M15] Chime S-1 CAC ($109 / $91; all-in ~$371) (via analysis): https://www.sec.gov/Archives/edgar/data/1795586/000162828025025059/chimefinancialinc-sx1wq1da.htm , https://fintechtakes.com/articles/2025-05-23/the-chime-test/
- [M16] Block Investor Day 2022, Cash App CAC ~$10: https://s29.q4cdn.com/628966176/files/doc_presentations/2022/05/Cash-App-Block-Investor-Day-2022.pdf
- [M17] App CPI benchmarks 2026 (secondary): https://apsteq.com/blog/app-user-acquisition-cost/
- [M18] Fintech CAC benchmarks and funded-account funnel (secondary): https://ltvcacbook.com/blog/cac-benchmarks-2026 , https://www.digitalapplied.com/blog/customer-acquisition-cost-benchmarks-2026-industry
- [M19] Coinbase USDC rewards paywalled to Coinbase One, 3.5% (2025-12-15): https://www.dlnews.com/articles/web3/coinbase-ends-usdc-rewards-for-non-paying-customers/
- [M20] Bridge cards (keep 100% of interchange; NMLS 2450917): https://www.bridge.xyz/product/cards
- [M21] Global Dollar Network (partners receive up to 100% of reserve returns): https://globaldollar.com/network
- [M22] OCC GENIUS Act proposal (rebuttable presumption; GENIUS effective by 2027-01-18): https://www.lw.com/en/insights/occ-issues-proposal-to-implement-the-genius-act
- [M23] Federal Reserve H.15 (EFFR 3.88%, 3-mo bill 4.08%, 2026-09-24): https://www.federalreserve.gov/releases/h15/
- [M24] Fed September 2026 decision (3.75–4.00%): https://www.cnbc.com/2026/09/16/fed-rate-decision-september-2026.html
- [M25] SEC Section 31 FY2026 rate ($20.60/million from 2026-04-04): https://www.federalregister.gov/documents/2026/03/04/2026-04233/order-making-fiscal-year-2026-annual-adjustments-to-transaction-fee-rates , https://www.finra.org/rules-guidance/notices/information-notice-20260317
- [M26] Circle–Coinbase distribution economics; Circle Q2 2026 distribution costs (secondary): https://crypto.news/circle-renews-coinbase-usdc-deal-rules-out-dividends/ , https://cryptoslate.com/usdc-keeps-winning-but-circles-distributors-are-taking-more-of-the-prize/
- [M27] Dinari USD+ (3.51% APY, secondary): https://dinari.com/usdplus
- [M28] CLARITY Act failure (2026-09-15) and stablecoin rewards: https://247wallst.com/investing/cryptocurrency/2026/09/18/what-is-a-stablecoin-reward-and-why-did-the-clarity-acts-failure-keep-it-alive/
- [M29] Alpaca on PFOF; disclosures: https://alpaca.markets/learn/love-it-or-hate-it-inside-payment-for-order-flow-and-commission-free-trading-apps , https://alpaca.markets/disclosures
- [M30] Alpaca: no referral program for API partners: https://alpaca.markets/support/does-alpaca-have-a-referral-program-for-its-api-partners-including-revenue-share
- [M31] DriveWealth business model (secondary): https://sacra.com/c/drivewealth/
- [M32] Regulation II overview: https://www.federalreserve.gov/paymentsystems/regii-about.htm
- [M33] Fed 14.4¢ proposal (pending): https://www.paymentsdive.com/news/federal-reserve-debit-fee-cap-reduction-proposal/697838/
- [M34] Fed Reg II average interchange data (exempt $0.52 in 2023): https://www.federalreserve.gov/paymentsystems/regii-average-interchange-fee.htm
- [M35] Lithic interchange (starter program 0.2% / 0.4%; exempt ~44¢ per txn): https://www.lithic.com/blog/interchange , https://research.contrary.com/company/lithic
- [M36] Stripe Issuing consumer prepaid debit: https://docs.stripe.com/issuing/consumer-prepaid-debit-cards
- [M37] Robinhood instant transfers (1.75%, $1 min / $150 max): https://robinhood.com/us/en/support/articles/instant-bank-transfers/
- [M38] Cash App instant transfer fees (official page didn't render; secondary): https://cash.app/help/us/en-us/3073-cash-out-speed-options , https://financebuzz.com/cash-app-fees
- [M39] KYC pricing (Persona ~$1.50/check; market $1–3): https://primebiometry.com/blog/kyc-pricing-guide-2026 , https://didit.me/blog/didit-vs-persona-the-best-kyc-alternative/
- [M40] Plaid pricing: https://plaid.com/pricing/
- [M41] Alpaca Broker API plan names (secondary): https://brokerchooser.com/broker-reviews/alpaca-trading-review/alpaca-trading-fees
- [M42] Acorns 2021 SPAC analyst materials (1.3% churn cited via secondary): https://www.sec.gov/Archives/edgar/data/1829797/000110465921072713/tm2116619d1_ex99-2.htm , https://techcrunch.com/2021/05/27/acorns-spac-listing-depicts-a-consumer-fintech-business-with-a-saasy-revenue-mix/
