# Market, economics, and the threshold for pursuing Blunts

Research date: **October 2, 2026**. US-first, adult retail investing is the working scope. These are conditional scenarios, not a valuation, sales forecast, legal revenue opinion, or evidence of product-market fit. No customer interviews, paid acquisition experiments, signed commercial quotes, or live retention cohorts were available.

## Recommendation

The recommended product is a wallet with a fee on each successful load/unload conversion, no subscription or holding charge, and one approved USDC/EVM investment route. See the [wallet strategy](wallet-strategy.md) for the current product/pricing decision. Fund a bounded discovery/partner-validation phase. Do not yet fund a nationwide real-money launch. Blunts has a distinctive visual language, but the current product makes a more expensive, more complex route to an ETF that users can already buy elsewhere. The company must prove that its experience produces durable investing behavior and customer value sufficient to overcome that disadvantage. A stablecoin rail is useful only if it materially improves acquisition, funding success, or operating cost for the chosen audience.

The investable proposition is **a simple, understandable investing habit for adults with genuinely discretionary money**. A cannabis-themed trading toy, a promise of rapid gains, or an emergency-cash replacement is a weaker product and creates avoidable partner, customer-harm, and distribution risks. Retain the creative identity only if customers understand it and providers accept it.

## TAM: people first, revenue separately

| Measure | Result | Meaning and limitations |
|---|---:|---|
| US residents aged 18–34, July 2025 | 78,500,906 | Broad demographic ceiling, not eligible buyers or demand |
| US residents aged 18–44 | 123,821,921 | Expansion context; do not add to the first group |
| Illustrative 18–34 nonretirement noninvestor pool | 58,090,670 | 78.50m × 74%; cross-source proxy, not a measured joint population |

Population is calculated from the [Census single-year age dataset](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/national/asrh/nc-est2025-alldata-r-file12.csv), retaining July 2025 single ages. [FINRA's 2024 survey, published in 2025](https://www.finrafoundation.org/sites/finrafoundation/files/2025-11/NFCS_Investor_Survey_Report_White_Paper.pdf), reports 26% nonretirement investment participation among adults under 35, down from 32% in 2021. Applying its complement to Census ages is an approximation: surveys, definitions, and dates differ. Someone without taxable investments may have retirement investments, prefer debt repayment, or lack spare money.

At the model's $9.60–$72.00 conditional annual company revenue per funded user, 58.09m people mechanically imply **$558m–$4.18bn annual revenue TAM**. That multiplication assumes every person becomes funded, uses the service at the modeled intensity, and generates legally collectible fees; it is a ceiling illustration, not an addressable revenue forecast. Cash inflows, AUM, stock-market capitalization, deposits, and customers' capital gains are **not Blunts revenue**.

The [Federal Reserve's 2025 household survey](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-savings-investments.htm) reports three-month emergency savings for only 37% of 18–29-year-olds. Its separate asset table reports outside-retirement securities ownership of 18% for ages **18–24** and 33% for **25–54**; those age bands must not be mislabeled 18–29 and 30–44. This supports a need for accessible financial tools, but also limits discretionary investing capacity. Do not market volatile equities as protected savings.

## SAM: conditional eligibility and reach, not a measured audience

[Block's Q2 2026 shareholder disclosure](https://www.sec.gov/Archives/edgar/data/1512673/000119312526335117/d91486dex991.htm) reports 59m Cash App monthly transacting **accounts** and 9.4m primary banking actives in June. Neither is the count of unique, eligible, interested Blunts customers. Bank inflows are largely money people need to spend, not an investing budget.

The model explicitly discounts the 59m account figure through **conditional assumptions**:

| Factor | Low | Planning | High |
|---|---:|---:|---:|
| Young-adult share | 35% | 45% | 55% |
| Eligible/deduplicated share of those accounts | 85% | 92% | 97% |
| Relevant need among remaining people | 55% | 65% | 75% |
| Ability and willingness to fund | 20% | 30% | 45% |
| Supported-rail readiness | 45% | 65% | 80% |
| Resulting conditional Cash App SAM | **0.87m** | **3.10m** | **8.50m** |

Every factor needs measurement; they are not independently observed probabilities. In particular, Cash App has not publicly established the number of stablecoin-active people in this target cohort. The service excludes some accounts/jurisdictions, and Blunts' own partner coverage may be narrower. Do not describe 3.10m as a researched count.

For an external-wallet-first product, assumed eligible US **person** populations of 0.5m/2m/5m, multiplied by 20%/30%/40% relevant appetite, produce 0.10m/0.60m/2m conditional SAM. These inputs are deliberately labeled assumptions: address counts, chain transaction counts, and exchange accounts cannot establish unique retail users. [Pew's June 2026 survey](https://www.pewresearch.org/short-reads/2026/06/08/about-1-in-5-americans-have-used-crypto-republicans-use-has-ticked-up/) reports 19% of US adults have ever used crypto, including 26% ages 18–29; “ever used” is not active self-custody or demand for tokenized equities. Cash App and wallet populations overlap. **Do not add their SAMs.**

At Habitual/Strong modeled ARPU, planning Cash App SAM represents $115m/$223m conditional annual revenue capacity. Even the stronger $1m-profit target below needs about 2.0% of this assumed SAM; that is a meaningful competitive share, not effortless distribution.

## Competition and customer reasons to switch

| Alternative | Existing customer advantage | Blunts must demonstrate |
|---|---|---|
| [Cash App Investing](https://cash.app/stocks) | Already inside the funding app; commission-free stock/ETF access | Better comprehension, sustained habits, or a valued experience that justifies added fees and handoffs |
| [Acorns](https://www.acorns.com/pricing/) | Established habit-oriented investing bundle and subscription positioning | Demand for Blunts' narrower proposition; do not assume its customers validate Blunts' fee schedule |
| Traditional brokerage / established mobile brokers | Familiar custody, statements, broad assets, mature support | Trust and service quality despite a new brand and small team |
| Existing crypto wallets | Existing balances and signing familiarity | Approved US securities access with fewer steps, clear rights, and reliable withdrawals |
| Saving cash / paying debt | Liquidity and no equity-market drawdown | Appropriate customer/time horizon, not pressure to invest needed living expenses |

Do not use unverified competitor subscriber counts, old prices, or app downloads as demand evidence. Acorns' current public page was reviewed, but its pricing presentation did not provide a reliable extracted dollar schedule; no stale dollar comparison is used here. Blunts' largest competitor may be “do nothing,” not another tokenized-stock app. The visual metaphor is copyable; potential defensibility lies in distribution, trusted brand, low-cost service, retention, and partner execution, none proven yet.

## Fee-only economics and the threshold for pursuing the wallet

**Subscriptions are excluded by product decision, not held as an optional revenue rescue.** The [executable model](business_model.py), [inputs/results](model-results.json) and [generated tables](model-output.md) now contain only load/unload conversion revenue. The recommended price to validate is **1% each way, with no dollar cap per successful action**. Holding and ordinary USDC transfers earn no platform fee. The [wallet strategy](wallet-strategy.md) defines inclusive pricing, partial fills, retries, minimums, direct transfers and the approved collection boundary.

The baseline assumes a single wallet rail with **0% bank/ACH mix**. This changes the previous 25% bank mix; no reduction in acquisition, support or fixed compliance assumptions is silently assumed. The model still deducts normal provider/network, quote, screening, wallet, support, variable infrastructure, loss-reserve and actual acquisition/onboarding costs. Its 0/50/100% retained-fee cases distinguish the customer's charge from Blunts' lawful revenue entitlement. Public API fee collection is not legal permission to keep it.

| Annual per active funded user | Casual | Habitual | Strong |
|---|---:|---:|---:|
| Fee-bearing load / unload volume | $600 / $360 | $2,400 / $1,320 | $4,800 / $2,400 |
| Load / unload count | 12 / 4 | 24 / 8 | 24 / 8 |
| Annual cohort churn | 35% | 25% | 20% |
| Funded CAC | $40 | $30 | $25 |
| Fee-only revenue at full entitlement | $9.60 | $37.20 | $72.00 |
| Service costs | $15.52 | $22.04 | $25.52 |
| Margin after replacement CAC/KYC | **−$24.54** | **$5.50** | **$40.07** |

Volumes mean successful fee-bearing conversions through Blunts, not all wallet receipts, all outgoing transfers, user balances or external trading. The fee is an uncapped percentage of completed volume; execution counts still affect provider costs. Per-action currency rounding must be implemented separately. The load fee is deducted from the submitted total and the unload fee from gross proceeds; the model does not forecast AUM or investment returns. Unexecuted deposits earn no fee. Production accounting must reconcile exact provider fills, rounding and refunds.

[Dinari's public fees](https://docs.dinari.com/docs/fees) list API access starting at $2,000/month and a standard $0.20 network charge per order, with Ethereum exceptions. Those anchors do not replace a US commercial quote. The model absorbs the ordinary assumed $0.20 charge; it does not add that same gas expense a second time. API minimums belong in fixed costs. Wallet/support/screening/infra costs and a 10-bp gross-flow loss reserve remain assumptions. Four dollars of onboarding per funded user includes failed-applicant allocation.

### How much must the wallet make to be worth it?

Pre-tax operating profit after modeled salaries; maintained users are average active funded users. Company revenue is not customer money or gross transferred volume.

| Goal | Annual fixed costs | Desired profit | Habitual users | Strong users | Strong annual revenue |
|---|---:|---:|---:|---:|---:|
| Lean owner business | $600k | $250k | 154,683 | **21,214** | **$1.53m** |
| Durable company | $1.5m | $1m | 454,949 | **62,393** | **$4.49m** |
| Scale company | $5m | $10m | 2,729,694 | **374,358** | **$26.95m** |

Casual behavior does not cover variable costs. At half fee entitlement, Strong maintained margin falls to $4.07/year; at zero it is −$31.93. Getting the fee agreement right is the primary commercial gate. Holding fees and spread/rebate/AUM/performance revenue are not assumed. Basic stablecoin transfers alone do not establish a valuable paid service.

### Compare fee schedules before choosing one

The model isolates price while keeping activity/costs unchanged. Free loading plus 1% unloading loses money even in the Strong case (−$7.93 maintained margin). At 0.85% each way, Strong margin is $29.27 but Habitual is approximately zero (−$0.08). At 1% each way they are $40.07 and $5.50. At 1.5% the arithmetic improves, but willingness to pay and retention may worsen; it is not automatically the most viable choice. Start with the understandable uncapped 1% hypothesis and measure behavior rather than raising fees to make a spreadsheet work.

Adding 25% bank usage makes Habitual negative again (−$0.90), without subscriptions to mask it. CAC of $60 or support cost of $12/year also breaks that case. The wallet rail is a cost advantage only if handoff friction does not erase the savings. A recommended initial $50 conversion minimum leaves more margin than $25; retain a safe full-balance exit/dust policy and do not charge a second percentage on the payout transfer.

### Growth and capital

Monthly cohort survival, actual acquisition spending, average active users for revenue and separately identified setup expense are modeled. Maintenance replacement uses monthly churn; the growth model does not double charge replacement CAC. LTV assumes constant behavior, is undiscounted and is not a valuation.

The Strong hypothetical acquisition ramp of 5k/20k/50k/100k/150k newly funded users annually reaches 248k users at year five end and averages 196k in that year. Year-five revenue is **$14.14m**, with **$225k operating loss** after growth spending and fixed costs. Peak cash deficit plus 25% headroom is **$9.31m**, excluding regulatory capital/reserves, financing, taxes and extraordinary losses. These are conditional scenarios with no assigned probability. They do not establish that this money can purchase the modeled users.

The Habitual ramp needs **$13.61m** with headroom and still loses **$3.69m** in year five. It is not attractive growth merely because a maintained user has positive contribution. The Casual case fails. Model slower growth and organic distribution separately before committing capital.

### Acquisition and SOM must be earned through a funnel

Illustrative quarterly assumptions: 100,000 qualified visits × 8% signup × 60% KYC completion × 50% first funding = 2,400 funded customers. At 60% 90-day retention, 1,440 remain. At $72,000 all-in acquisition spend, CAC is $30 per first-funded user and $50 per 90-day retained user, before separately modeled onboarding. Halving funding conversion doubles CAC. Count creative/creator/reward costs and growth labor; organic traffic is not automatically free.

Strong simple acquisition payback is **7.5 months**, Habitual **26.9 months**, before survival adjustment. Approximate maximum CAC for a 3× lifetime contribution/acquisition ratio is **$66.08** and **$13.78**, respectively. Actual affordable CAC is determined by cohort retention, contribution and cash runway. Track receipt-to-paid-conversion rate: a funded wallet that never uses Fill/Spark generates no modeled revenue.

## Validation gates and stopping rules

1. **2–4 weeks, 30–50 interviews and 15 moderated tasks:** compare the same fund through Blunts and existing Cash App investing. Sample both crypto users and nonusers. Test understanding of losses, fees, account ownership, settlement and the metaphor; do not recruit only friends. Planning targets: at least 80% correctly explain all five, at least 90% complete a simulated withdrawal, zero misunderstanding that returns are guaranteed. These are product gates, not legal safe harbors.
2. **Partner/legal gate:** obtain written customer/asset/chain/fee/publisher scope, binding commercial quote and responsibility matrix. Rebuild economics with the actual retained revenue. Stop the proposed route if its legal model or unit contribution fails; evaluate conventional brokerage instead of disguising compensation.
3. **Private approved beta, initially 50–100 adults:** authorized operators validate the real money cycle, support workload, reconciliation, and customer understanding. No paid broad acquisition before this. Increase to 300–500 only after operational acceptance.
4. **90–180-day cohort gate:** measure funding completion, net deposits, churn, service cost, fraud loss, complaints, and fully loaded funded/retained CAC by channel. Target contribution payback ≤12 months under conservative survival; stress CAC +50%, funding −50%, support ×2, loss 50 bps, and a 50% fee-bearing conversion-volume decline. Small cohorts do not establish annual retention or rare fraud tails; reserve accordingly.
5. **Scale gate:** finance owner signs a twelve-month cash forecast with downside runway ≥12 months, legally collectible revenue, provider minimums/reserves, and no unresolved high-severity security or money breaks. Do not buy growth to rescue negative contribution.

## Capital allocation before committing to scale

Planning allowances, not professional quotes: phase-zero research/design/prototype spikes $40k–$100k; external legal/commercial diligence $25k–$75k, partly overlapping only if explicitly budgeted. Set an initial **$65k–$175k decision budget** and stop if partner/fee/customer gates fail. A 6–9-month shared funded-web build with 3–4 engineers, design/QA and part-time compliance/operations could require roughly **$0.9m–$1.8m before scalable acquisition**, depending on loaded compensation, audit and reserve requirements. This range includes ordinary build staffing and prelaunch overhead; do not add it blindly to the five-year model, whose fixed costs already include staffing. Obtain actual work estimates after the spike.

A sensible “worth it” threshold is the durable-company case **only if** Strong-like economics are evidenced and a credible channel can reach tens of thousands of retained funded users. A $1m profit target after $10m+ invested can still be a poor risk-adjusted return; ownership dilution, time to positive cash, and founder opportunity cost matter. Venture-scale outcomes need a larger proven distribution engine, not a larger TAM slide. The evidence today supports experimentation, not a forecast of realistic profits.

### Illustrative fixed-cost budget behind the $1.5m durable-company case

| Annual category | Planning allowance |
|---|---:|
| Three engineering/security staff, loaded | $660k |
| Product/design/QA capacity | $180k |
| Operations/compliance management | $180k |
| External legal, compliance review and independent security | $150k |
| Vendor minimums, fixed cloud/data/tooling | $90k |
| Insurance, accounting, administration | $90k |
| Fixed-cost contingency | $150k |
| Total | **$1.50m** |

This is a proposed resource envelope, not a hiring quote or proof that seven-day financial operations can run at this cost. Per-user support/screening/wallet costs are already in variable cost; allocate the actual contract and workforce once to avoid duplication. The lean $600k case assumes a much smaller founder-led operation and may be infeasible under actual partner obligations. Provider reserve/collateral and customer money cannot be spent as operating runway.
