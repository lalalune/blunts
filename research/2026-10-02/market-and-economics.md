# Market, economics, and the threshold for pursuing Blunts

Research date: **October 2, 2026**. US-first, adult retail investing is the working scope. These are conditional scenarios, not a valuation, sales forecast, legal revenue opinion, or evidence of product-market fit. No customer interviews, paid acquisition experiments, signed commercial quotes, or live retention cohorts were available.

## Recommendation

Fund a bounded discovery/partner-validation phase. Do not yet fund a nationwide real-money launch. Blunts has a distinctive visual language, but the current product makes a more expensive, more complex route to an ETF that users can already buy elsewhere. The company must prove that its experience produces durable investing behavior and customer value sufficient to overcome that disadvantage. A stablecoin rail is useful only if it materially improves acquisition, funding success, or operating cost for the chosen audience.

The investable proposition is **a simple, understandable investing habit for adults with genuinely discretionary money**. A cannabis-themed trading toy, a promise of rapid gains, or an emergency-cash replacement is a weaker product and creates avoidable partner, customer-harm, and distribution risks. Retain the creative identity only if customers understand it and providers accept it.

## TAM: people first, revenue separately

| Measure | Result | Meaning and limitations |
|---|---:|---|
| US residents aged 18–34, July 2025 | 78,500,906 | Broad demographic ceiling, not eligible buyers or demand |
| US residents aged 18–44 | 123,821,921 | Expansion context; do not add to the first group |
| Illustrative 18–34 nonretirement noninvestor pool | 58,090,670 | 78.50m × 74%; cross-source proxy, not a measured joint population |

Population is calculated from the [Census single-year age dataset](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/national/asrh/nc-est2025-alldata-r-file12.csv), retaining July 2025 single ages. [FINRA's 2024 survey, published in 2025](https://www.finrafoundation.org/sites/finrafoundation/files/2025-11/NFCS_Investor_Survey_Report_White_Paper.pdf), reports 26% nonretirement investment participation among adults under 35, down from 32% in 2021. Applying its complement to Census ages is an approximation: surveys, definitions, and dates differ. Someone without taxable investments may have retirement investments, prefer debt repayment, or lack spare money.

At the model's $11.13–$75.06 conditional annual company revenue per funded user, 58.09m people mechanically imply **$647m–$4.36bn annual revenue TAM**. That multiplication assumes every person becomes funded, uses the service at the modeled intensity, and generates legally collectible fees; it is a ceiling illustration, not an addressable revenue forecast. Cash inflows, AUM, stock-market capitalization, deposits, and customers' capital gains are **not Blunts revenue**.

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

At Habitual/Strong modeled ARPU, planning Cash App SAM represents $123m/$232m conditional annual revenue capacity. Even the stronger $1m-profit target below needs about 2.2% of this assumed SAM; that is a meaningful competitive share, not effortless distribution.

## Competition and customer reasons to switch

| Alternative | Existing customer advantage | Blunts must demonstrate |
|---|---|---|
| [Cash App Investing](https://cash.app/stocks) | Already inside the funding app; commission-free stock/ETF access | Better comprehension, sustained habits, or a valued experience that justifies added fees and handoffs |
| [Acorns](https://www.acorns.com/pricing/) | Established habit-oriented investing bundle and subscription positioning | Demand for Blunts' narrower proposition; do not assume its customers validate Blunts' fee schedule |
| Traditional brokerage / established mobile brokers | Familiar custody, statements, broad assets, mature support | Trust and service quality despite a new brand and small team |
| Existing crypto wallets | Existing balances and signing familiarity | Approved US securities access with fewer steps, clear rights, and reliable withdrawals |
| Saving cash / paying debt | Liquidity and no equity-market drawdown | Appropriate customer/time horizon, not pressure to invest needed living expenses |

Do not use unverified competitor subscriber counts, old prices, or app downloads as demand evidence. Acorns' current public page was reviewed, but its pricing presentation did not provide a reliable extracted dollar schedule; no stale dollar comparison is used here. Blunts' largest competitor may be “do nothing,” not another tokenized-stock app. The visual metaphor is copyable; potential defensibility lies in distribution, trusted brand, low-cost service, retention, and partner execution, none proven yet.

## Unit economics: actual company revenue, not fees passing through

The executable [model](business_model.py), [inputs/results](model-results.json), and [tables](model-output.md) are the authoritative arithmetic. All behavioral inputs are hypotheses. It models a proposed 1% buy/sell fee, capped at $10 per order, with **0%, 50%, and 100% legally retained fee shares**. The prototype instead charges 10% of gains; that conflicting performance-fee design is excluded pending legal review.

| Annual per funded active user | Casual | Habitual | Strong |
|---|---:|---:|---:|
| Deposits / withdrawals | $600 / $360 | $2,400 / $1,320 | $4,800 / $2,400 |
| Buy / sell count | 12 / 4 | 24 / 8 | 24 / 8 |
| Optional $3 subscription conversion | 5% | 8% | 10% |
| Annual cohort churn | 35% | 25% | 20% |
| Fully loaded funded CAC | $40 | $30 | $25 |
| Revenue at 100% fee retention | $11.13 | $39.65 | $75.06 |
| Service cost | $18.72 | $28.44 | $31.92 |
| Margin after maintenance acquisition/onboarding | **−$26.21** | **$1.54** | **$36.73** |

Service costs include assumed 25% bank funding mix, bank/payout costs, network orders, quotes, wallet infrastructure, screening, support, variable infrastructure, and a 10-bp gross-flow loss reserve. KYC/onboarding is $4 per newly funded person including failed-applicant allocation. Fixed costs cover staffing, legal/compliance overhead, vendor minimums, insurance, audits, and administration; replace with actual quotes and a hiring plan. [Dinari's published fees](https://docs.dinari.com/docs/fees) start at $2,000/month API access and show a $0.20 standard network order fee with Ethereum gas exceptions. The model's other costs are **not vendor quotes**, and US commercial terms may differ. Avoid double counting its network charge and the same settlement gas.

The fee calculation assumes equally sized orders within each case; real order-size distributions change cap effects. Deposits/withdrawals are simplified traded-notional proxies for this scenario, not an account cash-flow forecast. The final contract must define fees inclusive versus added to payment, and the model must then reconcile exact customer cash movements. No portfolio return or AUM accumulation is assumed.

Subscription net proceeds use an assumed 85% factor; this is a modeling haircut, not a statement that every app qualifies for a 15% store fee. Revenue recognition should follow accountant-reviewed principal/agent treatment. No subscription customer evidence exists; without subscription revenue, the Habitual maintained-user margin turns negative (−$0.90). No interest, securities lending, spread revenue, payment-for-order-flow, referral revenue, or token appreciation is included without a contractual right and approved disclosure.

### How much must it make to be worth it?

All goals are **annual pre-tax operating profit after modeled salaries**, not founder take-home or investment return. “Owner earnings” requires clarifying whether the founder's salary is already included. Maintained users are an average active funded base, not cumulative signups.

| Goal | Fixed annual operating cost | Desired profit | Users needed: Habitual | Users needed: Strong | Strong annual revenue |
|---|---:|---:|---:|---:|---:|
| Lean owner business | $600k | $250k | 550,832 | **23,143** | **$1.74m** |
| Durable company | $1.5m | $1m | 1,620,092 | **68,067** | **$5.11m** |
| Scale company | $5m | $10m | 9,720,548 | **408,401** | **$30.65m** |

The recommended v1 excludes subscriptions: without them, the Strong $1m-profit target is **74,254 maintained users and $5.35m annual revenue**. The main table preserves optional subscription sensitivity; do not use its smaller target as the subscription-free release forecast.

Casual behavior never covers its own variable and replacement costs at these assumptions. More unprofitable customers make losses larger. At 50% fee retention, even the Strong steady margin is only $0.73/year; at 0% it is negative $35.27. The legal/commercial revenue agreement is a **business-model gate**, not paperwork to postpone.

A $3/month compulsory subscription costs $36/year, or 36% of a $100 average balance and 7.2% of $500 before market movement. Optional extras must create real value; a subscription cannot simply conceal unacceptable trading costs. An illustrative 0.35% annual AUM fee produces only $1.75 on a $500 average balance, which does not fund this service structure. No fee level is recommended to an individual investor here.

### Growth consumes cash even when steady economics work

The model uses monthly cohort survival, acquisition spending when incurred, average active balances for revenue, and separately counted incremental setup costs. Maintenance acquisition uses 12 × monthly churn rather than annual cohort churn, because replacement users can also leave. It does not charge replacement CAC again inside the growth simulation. LTV is an undiscounted approximation with constant behavior and indefinite survival; it is not a valuation or observed lifetime.

Under the Strong **hypothetical** five-year acquisition ramp (5k, 20k, 50k, 100k, 150k newly funded annually), year five ends with 248k active users and averages 196k. It earns $14.74m revenue but loses **$881k operating cash in that year** after $4.35m acquisition/onboarding and $5m fixed expenses. Peak modeled funding need plus 25% headroom is **$10.43m**, excluding regulatory capital, collateral/reserves, financing, taxes, and extraordinary losses. This is not a claim that $10.43m guarantees that growth.

The Habitual ramp needs $14.30m headroom funding while still losing $4.00m in year five. Continuing that plan without improving unit economics would be poor capital allocation. The Casual ramp also fails. These are scenario demonstrations, not three equally likely forecasts; there is insufficient evidence to assign probabilities.

### Acquisition and SOM must be earned through a funnel

Example, **assumed** quarterly test funnel: 100,000 qualified landing visits × 8% signup × 60% KYC completion × 50% first funding = 2,400 funded customers. At 60% 90-day funded retention, 1,440 remain. A $72,000 all-in channel/campaign spend implies $30 per first-funded customer and $50 per 90-day retained customer, before the separately modeled onboarding cost. If funding conversion halves, funded CAC doubles. Track attributable creator fees, creative production, rewards, and allocated growth labor; do not call organic labor free.

Strong modeled acquisition payback is 8.1 months before survival adjustment; Habitual is 36.4 months. The approximate CAC ceilings for a 3× lifetime contribution/acquisition ratio are $61.04 and **$9.14**, respectively. Therefore a $30 Habitual CAC is not attractive even though maintained-unit margin is barely positive. Grow only from cohort evidence. Paid reach does not turn 3m hypothetical SAM into achievable SOM.

## Validation gates and stopping rules

1. **2–4 weeks, 30–50 interviews and 15 moderated tasks:** compare the same fund through Blunts and existing Cash App investing. Sample both crypto users and nonusers. Test understanding of losses, fees, account ownership, settlement and the metaphor; do not recruit only friends. Planning targets: at least 80% correctly explain all five, at least 90% complete a simulated withdrawal, zero misunderstanding that returns are guaranteed. These are product gates, not legal safe harbors.
2. **Partner/legal gate:** obtain written customer/asset/chain/fee/publisher scope, binding commercial quote and responsibility matrix. Rebuild economics with the actual retained revenue. Stop the proposed route if its legal model or unit contribution fails; evaluate conventional brokerage instead of disguising compensation.
3. **Private approved beta, initially 50–100 adults:** authorized operators validate the real money cycle, support workload, reconciliation, and customer understanding. No paid broad acquisition before this. Increase to 300–500 only after operational acceptance.
4. **90–180-day cohort gate:** measure funding completion, net deposits, churn, service cost, fraud loss, complaints, and fully loaded funded/retained CAC by channel. Target contribution payback ≤12 months under conservative survival; stress CAC +50%, funding −50%, support ×2, loss 50 bps, and zero subscriptions. Small cohorts do not establish annual retention or rare fraud tails; reserve accordingly.
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
