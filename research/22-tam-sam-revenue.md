# 22: TAM, SAM, SOM and how much Blunts can make at 1% per move

*Written 2026-09-28. Inputs come from `20-market-sizing-inputs.md` (market) and `21-transaction-fees.md` (fees and costs). The math is in `model/market_model.py`, and full output is in `model/model_output.md`; change any assumption there and re-run. **[EST]** marks a modeling assumption. Not financial or legal advice.*

---

## TL;DR

1. **The market is big.**
   - **TAM:** 78.5M Americans aged 18–34, moving about **$75B a year** at base behavior, so a **1% fee pool of about $750M a year**. Widening to 18–44 gives about $1.2B.
   - **SAM (wide):** the 58M of them with no taxable investments: about $560M of fees a year.
   - **SAM (core):** the ~22M who are also Cash App users. That's about $21B moved and **about $210M of fee pool a year**.
   - The core SAM is the realistic launch market. The 22M figure is an estimate, because Block doesn't publish an age split.
2. **At the base behavior ($600 in, $360 out a year), 1% on every fill and spark earns $9.60 per user a year.** Add an instant-to-bank fee and an optional Blunts+ subscription and it's **$11.75**. Serving that user costs about **$9.72**, so each user nets about **$2 a year**. At that margin, no realistic user count covers a real team.
3. **The fee rate isn't what matters; how much money each user moves is.** The same 1% gives roughly:

   | Moved in per user per year | Net per user per year | Users needed to cover $5M of fixed costs |
   |---|---|---|
   | $600 | $2–4 | 1M+ |
   | $1,200 | $12–14 | ~350k |
   | $2,400 | $27–32 | ~155k |
   | $4,800 | $58–68 | ~75k |

   **So the product plan should push flows up:** paycheck auto-fill, "fill on every payday", round-ups. The fee plan matters less.
4. **SOM (5-year, share of core SAM):** 110k (low), 440k (base, 2%) and 1.5M (high, ~7%) funded users.
   - At $600 a year per user, base-case revenue reaches about **$4.3M a year by year 5**, and the company still loses money after marketing and team costs (about −$30M cumulative).
   - The **"main money app" case** ($2,400 a year in, 25% churn, bank rail negotiated to $0.30) earns **about $42 a user and nets about $33**. There, **300k users gives about $12.5M in revenue and about $5M profit after $5M fixed; 1M users gives about $42M and about $28M.**
5. **Who actually receives the 1%:**
   - **Today:** Dinari, the broker, has to charge it as a commission on each buy and sell, and Blunts gets a fixed platform fee from Dinari. **Negotiate that fixed fee as close to the expected 1% pool as FINRA 2040 allows, and re-set it every year.**
   - **To keep the 1% directly,** Blunts registers its own introducing broker-dealer: about $250–500k in the first year and 6–9 months (file 21 §2). The numbers below assume Blunts ends up with the full 1%, so treat them as the ceiling.
6. **Apple and Google** only get paid on Blunts+: about **$0.22 per user a year** in the base case (15% of in-app subscriptions). They get 0% of the 1%.
7. **Cost levers that matter most:**
   - **Bank-rail pricing.** At $0.75 per zerohash ACH fill, a $50 bank fill loses money. Negotiate or set a $25 minimum bank fill.
   - **Dinari billing at gas instead of $0.20.** This alone swings the base user from −$0.85 to +$2.03.
   - **Support cost per user.**

---

## 1. Market size

Market inputs, all from file 20:
- 78.5M adults aged 18–34 (Census, July 2025).
- 74% of under-35s hold no taxable investments (FINRA 2024).
- Cash App: 59M monthly transacting actives and $1,469 of inflows per active per quarter (Block, Q2 2026).
- Of those, about 30M are aged 18–34 and about 22M of those don't invest. Both are estimates, since Block has no age split.

| Layer | People | Money moved / yr | 1% fee pool / yr | All revenue lines / yr |
|---|---|---|---|---|
| TAM (wide): US adults 18–44 | 123.8M | $118.9B | $1.19B | $1.45B |
| **TAM (core): US adults 18–34** | 78.5M | $75.4B | **$754M** | $922M |
| SAM (wide): 18–34 with no taxable investments | 58.1M | $55.8B | $558M | $683M |
| **SAM (core): 18–34 Cash App users with no taxable investments** | 22.0M | $21.1B | **$211M** | $259M |

"Money moved" = fills + sparks per user ($960 a year at base) × people. This is an upper bound: it assumes everyone in the layer behaves like a base Blunts user.

**Sense check:**
- Robinhood took in $68B of net deposits in 2025.
- Retail investors net-bought about $155B of stocks and ETFs in H1 2025.
- A $21B-a-year SAM of *gross* flows among small-balance young non-investors fits alongside those.

Cash App alone moves about $1,469 × 4 × 22M ≈ **$130B a year through the core SAM's accounts.** Blunts at base behavior ($600) would redirect about **10%** of each user's Cash App inflow into savings. At $2,400 a year it would redirect about 40%.

---

## 2. Revenue and cost per funded user

Behavior:
- **Low:** $360 in, 70% out.
- **Base:** $600 in ($50 a month), 60% out.
- **High:** $1,200 in, 50% out.

Rail mix: 60% Cash App, 30% bank (zerohash), 10% Apple Pay (Coinbase; the user sees Coinbase's fee). Dinari is billed at actual gas unless noted.

| Line | Low | **Base** | High | Base, Dinari $0.20 flat |
|---|---|---|---|---|
| Fills ($ in) | $360 | **$600** | $1,200 | $600 |
| Sparks ($ out) | $252 | **$360** | $600 | $360 |
| 1% on fills | $3.60 | **$6.00** | $12.00 | $6.00 |
| 1% on sparks | $2.52 | **$3.60** | $6.00 | $3.60 |
| Instant-to-bank fee (1%, min $0.50, 40% of bank sparks) | $0.40 | **$0.58** | $0.96 | $0.58 |
| Blunts+ at $3/mo (2/5/10% take it), net of store cut | $0.63 | **$1.57** | $3.15 | $1.57 |
| **Revenue** | $7.15 | **$11.75** | $22.11 | $11.75 |
| Dinari order fees | $0.26 | $0.32 | $0.58 | $3.20 |
| Rails (zerohash $0.75/fill, $1.00/spark; gas) | $3.65 | $4.32 | $7.43 | $4.32 |
| Privy, screening, support, cloud | $4.20 | $4.20 | $4.20 | $4.20 |
| KYC, spread over the user's life | $0.88 | $0.88 | $0.88 | $0.88 |
| **Variable cost** | $8.98 | **$9.72** | $13.09 | $12.60 |
| **Contribution** | **−$1.83** | **$2.03** | **$9.02** | **−$0.85** |
| Of which paid to Apple/Google | $0.09 | $0.22 | $0.43 | $0.22 |

For the user, the base-case fees add up to about 1.9% a year of a $500 balance. That's still cheaper than Acorns' $3 a month at that balance (7.2%).

### Fee design compared (base user)

| Design | Revenue / user / yr | Contribution / user / yr |
|---|---|---|
| **1% on fills + sparks (asked)** | **$11.75** | **$2.03** |
| 1% on sparks only | $5.75 | −$3.97 |
| 0.5% on fills + 1% on sparks | $8.75 | −$0.97 |
| 1% fills + 1% sparks, no Blunts+ | $10.18 | $0.46 |

Charging on fills doubles fee revenue, and it's the only design here that's positive at base behavior. The risk is that users compare a 1% fill fee against $0 ETF buys everywhere else.
- **Break-even:** it stays worth it unless it cuts funded users by more than about 45–60% with referral-led growth, or about 20% with paid growth (file 21 §7).
- **Test it:** A/B test in the beta.

---

## 3. SOM: what Blunts could realistically get

Funded users at the end of each year, 35% annual churn. Fixed costs cover team, compliance and vendors **[EST]**.

| Case | Y1 | Y2 | Y3 | Y4 | Y5 | Y5 share of core SAM | CAC per funded user |
|---|---|---|---|---|---|---|---|
| Low | 5k | 20k | 45k | 75k | 110k | 0.5% | $40 |
| **Base** | 20k | 80k | 180k | 300k | **440k** | **2.0%** | $25 |
| High | 50k | 200k | 500k | 900k | 1.5M | 6.8% | $15 |

For scale: Stash had over 1M paying subscribers after about 8 years, Acorns has 16M customers all-time, and Robinhood has 28.4M funded.

### Base case at base behavior ($600 a year in)

| Year | Funded (EOY) | Money moved | 1% fee revenue | Total revenue | Contribution | Marketing | Fixed | **Operating result** |
|---|---|---|---|---|---|---|---|---|
| 1 | 20k | $9.6M | $96k | $117k | $20k | $500k | $1.2M | **−$1.7M** |
| 2 | 80k | $48M | $480k | $587k | $102k | $1.7M | $2.0M | **−$3.6M** |
| 3 | 180k | $125M | $1.2M | $1.5M | $264k | $3.2M | $3.0M | **−$5.9M** |
| 4 | 300k | $230M | $2.3M | $2.8M | $487k | $4.6M | $4.0M | **−$8.1M** |
| 5 | 440k | $355M | $3.6M | **$4.3M** | $751k | $6.1M | $5.0M | **−$10.4M** |

Cumulative 5-year result: low case −$16.8M, **base −$29.7M**, high case −$35.0M. The high case loses the most in total because it spends the most on growth, but by year 5 its contribution is $10.8M a year. Full tables are in `model/model_output.md`.

**Lifetime value at base behavior:**
- About **$5.80** per user at 35% churn, or $13.50 at 15%.
- That supports a CAC of about $2 at a healthy 3:1 ratio.
- **Paid marketing doesn't work at $600 a year of flows.** Growth has to come from referrals and creators.

---

## 4. What it takes to be a real business: more money moving per user

Contribution per user, at 60% out:

| Fills / yr | Revenue | Contribution (bank $0.75 / $1.00) | Contribution (bank negotiated to $0.30 / $0.50) | Users to cover $5M fixed |
|---|---|---|---|---|
| $300 | $6.69 | −$1.56 | $0.05 | not reachable |
| $600 | $11.75 | $2.03 | $4.45 | ~1.1M |
| $1,200 | $21.93 | $11.78 | $14.40 | ~350k |
| **$2,400** | **$42.28** | **$27.06** | **$32.30** | **~155k** |
| $4,800 | $82.98 | $58.05 | $68.33 | ~73k |

### "Main money app" scenario

Assumptions:
- $100 on every payday ($2,400 a year), 55% sparked back out.
- 8% take Blunts+.
- Bank rail at $0.30 / $0.50.
- Support at $1 per user; churn 25%.

Result: **$41.83 revenue and $33.31 contribution per user a year, LTV about $133.**

| Funded users | Revenue / yr | Contribution / yr | After $5M fixed |
|---|---|---|---|
| 100k | $4.2M | $3.3M | −$1.7M |
| **300k** | **$12.5M** | **$10.0M** | **+$5.0M** |
| 500k | $20.9M | $16.7M | +$11.7M |
| 1M | $41.8M | $33.3M | +$28.3M |
| 2M | $83.7M | $66.6M | +$61.6M |

**$2,400 a year is plausible for this audience.** A Cash App active already moves about $5,900 a year through Cash App, so this is about 40% of that. It's also why Chime and Cash App make money: both get people's paychecks.

**Features that move flows:**
- "Fill every payday" via Cash App direct deposit or a zerohash virtual account for paycheck splits.
- Round-ups on the Cash App card: not possible, since there's no Cash App API. Round-ups on a linked bank are possible through Plaid.
- Streaks that reward depositing, never trading.

---

## 5. Other transaction fees: include or not

| Fee | Benchmark | In model? | Call |
|---|---|---|---|
| **1% per move (fill + spark)** | Crypto 1–2.5%; ETF buys $0 | Yes | Core. Cap at $10 per move, $20 minimum fill |
| **Instant spark to bank** | Robinhood 1.75%, Venmo/PayPal 1.75%, Coinbase 1.5% | Yes, 1% (min $0.50) | Keep; standard bank and Cash App sparks stay free |
| Apple Pay card fee | Coinbase 2.5% unsubsidized | Passed through (user sees Coinbase's fee) | Card networks bar surcharging debit; Coinbase is the merchant |
| **Blunts+ ($3/mo)** | Robinhood Gold $5, Acorns $3–12 | Yes | Digital extras only, sold in-app so Apple and Google get 15% |
| Cash deposit at stores | Cash App Paper Money $1 | No | Cash App charges it, not us |
| Expedited bank fill | — | No | Looks like a junk fee |
| Inactivity / account fee | — | **Never** | CFPB junk-fee target; hits exactly this audience |
| Yield on idle USDC | — | No | Grey area until the GENIUS Act rules land |
| Debit card interchange | ~1–1.5% of card spend | Not in this model | Biggest later lever if Blunts becomes the main account (file 08) |

---

## 6. Assumptions that most need checking

1. **The 22M core SAM.** It rests on an estimated Cash App age split. Ask Block or use survey panels.
2. **Money moved per user.** This is the whole business. Measure it in the beta, and test "fill every payday" early.
3. **zerohash pricing.** $0.75 vs $0.30 per bank fill is the difference between losing and making money on bank users.
4. **Dinari gas-in-arrears billing,** and the size of the fixed platform fee it pays Blunts.
5. **Churn.** 35% is a guess. Acorns-like 15% would more than double LTV.
6. **Whether a 1% fill fee cuts sign-ups.** A/B test "1% per move" against "free fills, 1% on sparks."
