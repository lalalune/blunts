# 20: Market-sizing inputs (who the Blunts user is, how many there are, how much money moves)

**Date:** 2026-09-28 | **Status:** Research memo. These are inputs for a sizing model; the model itself is not built here. **[UNVERIFIED]** marks a figure that could not be confirmed against a primary source in this pass. **[EST]** marks our own arithmetic or assumption. Numbered citations like [S3] point to the Sources list at the end.

Builds on `08-monetization.md` (ARPU, CAC, Acorns/Robinhood/Chime/Stash pricing and the $500 balance / $50-per-month base case) and `09-cash-app-rails.md`. It doesn't repeat those benchmarks except where there is a newer number.

---

## TL;DR

1. **Core population:** **78.5M US adults aged 18–34** (July 2025 Census estimate); **30.0M of them are Hispanic or non-Hispanic Black** (38%). Widening to 18–44 gives **123.8M** (45.5M Hispanic or NH Black) [S1].
2. **Most young adults don't invest outside retirement.** Only **26% of adults under 35** held non-retirement investments in 2024, down from 32% in 2021 (FINRA) [S2]. The Fed puts it at **18% for ages 18–29** and **33% for 30–44** in late 2025 [S4]. So **roughly 58M of the 78.5M 18–34s** hold no taxable investments [EST].
3. **Why they don't:** "not enough money" (45%) and "don't understand the stock market" (39%) are the top two reasons among non-owners. **Black and Hispanic non-owners cite not understanding more (44%/43%) than lack of money (36%/41%)** [S6]. **56% of Black and 48% of Hispanic respondents** agree that "people like me aren't usually investors" [S2]. This is the gap Blunts is designed for: small amounts, a simple product, and a culturally native brand.
4. **Cash App is the right rail:** **59M monthly transacting actives** (June 2026), **$87B of inflows per quarter**, **$1,469 per active per quarter** (~$490/month), and **9.4M primary banking actives** [S7]. **59% of Black adults and 37% of Hispanic adults** have used Cash App, vs 17% of White adults (Pew 2022) [S10]. **24M Cash App actives have bought bitcoin since 2018** [S11]. Block does **not** publish a share of users under 35 or any count of USDC users since the May 27, 2026 launch.
5. **Comparable apps (calibration):** Robinhood **28.4M funded** (Q2 2026; 59% millennial + Gen Z per YouGov) [S13][S14]; Acorns **16M all-time customers**, ~$33B invested [S15]; Stash **>1M paying subscribers, $5B AUM** (sold to Grab at ~$425M) [S16]; Chime **10.4M active members** [S17]. After 10+ years, the best micro-investing brand (Acorns) has reached **single-digit millions of paying users**.
6. **Deposit size and withdrawals:** Acorns round-ups average **~$30–43 per customer per month** [S18][S19]. In Acorns' surviving 2015 cohort, customers put in **$813M** and held **$426M** in early 2024. After nine years of market gains, the balance was only about half of what went in, which implies heavy withdrawals [S19][EST]. Acorns claimed **~99% monthly subscriber retention** in 2021 (≈12–15%/yr churn) [S20]. General fintech 12-month app retention is closer to **~48%** [S21][UNVERIFIED].
7. **Dollar flows:** Robinhood took in **$68.1B of net deposits in 2025** and **$21.7B in Q2 2026 alone** [S13][S22]. Retail investors bought a net **$155.3B** of US stocks and ETFs in H1 2025 (Vanda), and JPMorgan estimated about **$270B** for 2025 through the fall [S23][S24]. Nobody publishes an "18–34 dollars into brokerage" figure; §7 builds a bracket.
8. **Implied Blunts SAM [EST]:** about **22M** 18–34 Cash App users who don't hold taxable investments (range 15–28M). Reaching **0.5–1%** of that group gives **110k–220k funded users**. At $600/yr of fills that is **$65–130M/yr of gross fills**. At the 08-memo base ARPU (~$4–12/user) it is **~$0.5–2.6M/yr of revenue**.

---

## 1. Population: US adults 18–34 and 18–44 by race/ethnicity

Source: Census Vintage 2025 national monthly estimates (`nc-est2025-alldata-r-file12.csv` = July 1 2025; `file14` = July 1 2026 short-term projection), resident population. Summed by single year of age [S1].

| Age band | Total | Black alone | Black alone-or-in-combination | NH Black alone | Hispanic (any race) | **NH Black + Hispanic** | Year |
|---|---|---|---|---|---|---|---|
| **18–34** | **78.50M** | 11.58M (14.8%) | 13.44M (17.1%) | 10.34M | **19.66M (25.1%)** | **30.00M (38.2%)** | Jul 2025 est. |
| 18–24 | 31.94M | 4.75M | 5.68M | 4.21M | 8.49M (26.6%) | 12.70M (39.8%) | Jul 2025 |
| 25–34 | 46.56M | 6.83M | 7.77M | 6.12M | 11.18M (24.0%) | 17.30M (37.1%) | Jul 2025 |
| **18–44** | **123.82M** | 17.90M (14.5%) | 20.38M (16.5%) | 16.06M | 29.42M (23.8%) | **45.48M (36.7%)** | Jul 2025 |
| All 18+ | 269.76M | 35.00M (13.0%) | 38.53M (14.3%) | 32.14M | 50.47M (18.7%) | 82.61M (30.6%) | Jul 2025 |
| 18–34 | 78.39M | 11.58M | 13.52M | 10.32M | 19.87M (25.3%) | 30.18M (38.5%) | **Jul 2026 (projection)** |
| 18–44 | 124.06M | 18.00M | 20.58M | 16.12M | 29.72M (24.0%) | 45.84M (37.0%) | Jul 2026 (projection) |

- Use "NH Black + Hispanic" to avoid double counting (Black Hispanics are counted once, as Hispanic).
- The 18–34 band is flat (78.5M → 78.4M) while its Hispanic share grows. Growth in the target market comes from share, not population.
- "Urban" isn't broken out here. Census county files would allow it but weren't pulled in this pass.

## 2. Investing participation among young adults (and Black/Hispanic adults)

| Metric | Value | Year | Source |
|---|---|---|---|
| Adults with non-retirement investments (stocks, bonds, funds, other securities), all | 34% | 2024 | FINRA NFCS [S2] |
| Same, **ages 18–34** | **26%** (32% in 2021, 27% in 2018, 23% in 2015) | 2024 | FINRA [S2] |
| Same, non-White adults | 29% (33% in 2021) | 2024 | FINRA [S2] |
| Stocks/bonds/ETFs/funds held **outside** retirement, all adults | 37% | Oct 2025 | Fed SHED [S4] |
| Same, **18–29 / 30–44** | **18% / 33%** | Oct 2025 | SHED [S4] |
| Have a tax-preferred retirement account, 18–29 / 30–44 | 38% / 65% (non-retirees) | 2025 | SHED [S4] |
| Retirement account: Black / Hispanic non-retirees | 49% / 46% (White 69%) | 2025 | SHED [S4] |
| Have 3 months of emergency savings, 18–29 / Black / Hispanic | 37% / 38% / 43% (all 55%) | 2025 | SHED [S4] |
| Own any stock (incl. 401k), all / Black / Hispanic | 62% / 53% / 38% | 2025 | Gallup [S5] |
| **Personally** own stock (any account), all / Black / Hispanic | 43% / 34% / 32% | Jan 2025 | Philly Fed LIFE [S6] |
| Non-owners' reasons: not enough money / don't understand / too risky / not a priority | 44.9% / 38.6% / 20.3% / 19.5% | Jan 2025 | Philly Fed [S6] |
| Black non-owners: don't understand / not enough money | **44.0% / 36.4%** | Jan 2025 | Philly Fed [S6] |
| Hispanic non-owners: don't understand / not enough money | **43.4% / 40.8%** | Jan 2025 | Philly Fed [S6] |
| "People like me aren't usually investors": 18–34 / Black / Hispanic | 47% / 56% / 48% (White 25%) | 2024 | FINRA [S2] |
| New investors (started in the prior 2 years) as a share of investors | 8% (21% in 2021) | 2024 | FINRA [S2] |
| Median age of the "COVID cohort" of investors | 31 → 38 (2021→2024), suggesting young entrants left | 2024 | FINRA [S2] |
| Investors aged 18–34 with **< $500** in non-retirement investments | 11% (new investors 18%) | 2024 | FINRA [S2] |
| Investors aged 18–34 who trade on a mobile app | 80% | 2024 | FINRA [S2] |
| Investors aged 18–34 who bought meme/viral stocks; Black / Hispanic investors | 29%; 30% / 27% | 2024 | FINRA [S2] |
| Want to invest but don't | **No clean primary stat found.** Proxy: 57% of adults don't personally own stock, and 45% of those cite lack of money, not lack of interest [S6]. A CNBC/Generation Lab poll (Feb 2024) reportedly found most Gen Z/millennials want to invest but many don't **[UNVERIFIED; page 403]** [S25] | | |

### Crypto ownership

| Metric | Value | Year | Source |
|---|---|---|---|
| Ever invested in, traded or used crypto: all adults | 19% | Jan 2026 | Pew [S8] |
| Same, 18–29 / 30–49 | 26% / 28% | Jan 2026 | Pew [S8] |
| Same, men 18–29 / women 18–29 | 38% / 15% | Jan 2026 | Pew [S8] |
| Same, Black / Hispanic / White / Asian | 19% / 19% / 18% / 25% | Jan 2026 | Pew [S8] |
| Used crypto in the past year (any use), all adults | 10% (9% bought/held as investment) | 2025 | SHED [S4] |
| Investors 18–34 (aware of crypto) who hold crypto | 50% (53% in 2021) | 2024 | FINRA [S2] |
| Investors 18–34 considering crypto | 49% (62% in 2021) | 2024 | FINRA [S2] |
| Households using crypto: all / underbanked / unbanked | 4.8% / 6.2% / 1.2% | 2023 | FDIC [S9] |
| Black investors under 40 owning crypto | ~25–38% | 2022 | Ariel-Schwab (secondary) **[UNVERIFIED]** [S26] |

**Read-through:** crypto use among Black and Hispanic adults has converged with White adults (all about 19%). The race gap is in stocks, not crypto. Young men are the crypto-heavy group. A QQQ-only product is "less crypto" than what a third of young male investors already hold.

## 3. Cash App (and Venmo/PayPal for comparison)

| Metric | Value | Period | Source |
|---|---|---|---|
| Cash App monthly transacting actives | **59M** (+3% YoY) | June 2026 (Q2) | Block Q2'26 letter [S7] |
| Total Cash App inflows | **$87B** per quarter (+13%) | Q2 2026 | [S7] |
| Inflows per transacting active | **$1,469 per quarter** (+9%); Q1'26 was $1,494 | Q2 2026 | [S7] |
| Primary Banking Actives (PBAs) | **9.4M** (+17% YoY; 9.7M in March) | June 2026 | [S7][S12] |
| Paycheck deposit actives (narrow definition; receive ACH paychecks) | **2.7M** | June 2025 | Block Q2'25 letter [S27] |
| Broader "banking actives" (paycheck, or ≥$500/mo spend) | 8M; 11M under the widest definition | June 2025 | [S27] |
| Monthly active sponsored teen accounts | 5M (~80% Cash App Card actives; ~half graduate to adult accounts at 18) | June 2025 | [S27] |
| Actives under 25 | Higher paycheck-deposit attach, **40% higher Cash App Card attach** than the rest of the base | 2025 | [S27] |
| Average age of a Cash App Green active | **34** (vs median >50 at traditional banks) | Q1 2026 | Block Q1'26 letter [S12] |
| Share of US 18–21-year-olds using the Cash App Card | ~21% (2024); Dorsey: "1 in 5 teens have a Cash App Card" (Q2'26 call) | 2024 / 2026 | Block (via search) **[UNVERIFIED exact doc]** [S28] |
| Actives who have bought bitcoin since 2018 (cumulative) | **24M** | Nov 2025 | Cash App press [S11] |
| Bitcoin ecosystem gross profit | $72M (−31% YoY after a fee cut) | Q2 2026 | [S7] |
| Cash App Investing (stocks) users | **Not disclosed** | | |
| Share of Cash App users under 35 | **Not disclosed by Block.** Secondary sites claim 68% aged 18–34, or Gen Z 34% + millennials 25% **[UNVERIFIED; no methodology]** [S29] | | |
| Ever used Cash App: all / Black / Hispanic / White adults | 26% / **59%** / **37%** / 17% | Jul 2022 | Pew [S10] |
| Ever used Cash App: lower / middle / upper income | 36% / 24% / 18% | Jul 2022 | Pew [S10] |
| **USDC on Cash App** | Launched May 27, 2026 on Solana, Ethereum, Polygon and Arbitrum; fee-free "to start"; NY excluded; USDC and USD balances are interchangeable. **No adoption or volume numbers disclosed** in the Q2'26 letter or call ("stablecoins on Cash App are GA") | May–Aug 2026 | [S30][S7] |
| Venmo monthly active accounts | ~67M (+7% YoY) | Q4 2025 | PayPal Q4'25 (via search) [S31] |
| PayPal (all) monthly active accounts | ~227–228M; 439M active accounts | Q4'25–Q2'26 | PayPal [S31] |
| Ever used Venmo, 18–29 | 57% | Jul 2022 | Pew [S10] |

**[EST] Cash App users aged 18–34:** Block gives no age split. Three signals point to a young base: Green actives average 34, under-25s over-attach, and 21% of 18–21s use the card. We use **25–35M of the 59M MTAs are 18–34 (base 30M)**. Treat this as the widest uncertainty in the model.

## 4. Unbanked and underbanked

| Metric | Value | Year | Source |
|---|---|---|---|
| Unbanked households | **4.2% = 5.6M households** | 2023 | FDIC [S9] |
| Underbanked households (have a bank account but used a nonbank service) | **14.2% = 19.0M households** | 2023 | FDIC [S9] |
| Black households: unbanked / underbanked | 10.6% / 23.8% (White 1.9% / 10.1%) | 2023 | FDIC [S9] |
| Hispanic households: unbanked / underbanked | 9.5% / 21.7% | 2023 | FDIC [S9] |
| Black / Hispanic share of all unbanked households | 32.3% / 33.4% | 2023 | FDIC [S9] |
| Households using nonbank online payment services (PayPal, Venmo, Cash App) | 49.7% (banked 51.0%, unbanked 20.1%) | 2023 | FDIC [S9] |
| Black / Hispanic households using these services | 48.3% / 43.2% | 2023 | FDIC [S9] |
| Unbanked users of these services who use them to **save or keep money safe** | 40.9% (banked 14.2%) | 2023 | FDIC [S9] |
| Unbanked users of these services who use them to receive income | 34.3% | 2023 | FDIC [S9] |
| Underbanked users of these services using them for bills, income or saving | 44.2% | 2023 | FDIC [S9] |
| Mobile banking as primary access: Black / Hispanic banked households | 48.5% / 54.7% | 2023 | FDIC [S9] |
| Unbanked **adults** (person-level): all / 18–29 / Black / Hispanic | 6% / **12%** / 13% / 12% | 2025 | SHED [S4] |
| Used nonbank check cashing or money orders: 18–29 / Black | 17% / 28% | 2025 | SHED [S4] |

Unbanked users are a small slice of 18–34s (about 1 in 8). Underbanked users are the bigger pool. Both groups already use Cash App-type apps to store and save money, which supports the idea of "save/invest inside the P2P app."

## 5. Comparable apps: calibrating achievable share

| App | Scale | Assets | Age signal | Period | Source |
|---|---|---|---|---|---|
| Robinhood | **28.4M funded customers** | $369B total platform assets; net deposits $21.7B in the quarter (28% annualized) | Median customer age ~35 (31 in 2021) **[UNVERIFIED secondary]**; 42% millennial + 17% Gen Z (YouGov panel, not company data) | Q2 2026 | [S13][S14] |
| Acorns | **16M all-time customers** (company); ~8.2M paying subscribers **[UNVERIFIED trade press]** | ~$33B invested since inception; AUM ~$13B+ **[UNVERIFIED]** | Average user age 34 (2021 SPAC deck) | Aug 2026 | [S15][S20] |
| Stash | **>1M paying subscribers** | **$5B AUM** | n/a | Feb 2026 (Grab deal, ~$425M valuation) | [S16] |
| Chime | **10.4M active members** (+20%) | ARPAM $260 | n/a | Q2 2026 | [S17] |
| Cash App | 59M MTAs; 9.4M PBAs | $87B inflows/quarter | Green actives avg age 34 | Q2 2026 | [S7] |
| Public.com | **No 2026 customer or AUM figure found** | | | | **[UNVERIFIED]** |

**Calibration [EST]:**
- **Cash App → "invest" conversion ceiling.** 24M cumulative bitcoin buyers out of ~59M MTAs means ~40% have tried a one-tap buy at least once over seven years. That is the upper bound for "Cash App user tries an in-app asset purchase." Blunts sits outside Cash App, so expect a small fraction of it.
- **Micro-investing brand ceiling.** Acorns, with ~12 years and heavy marketing, has ~8M paying users (~10% of all US 18–34s if every one were young, which they aren't). Stash has 1M. A new, niche-branded app reaching **100k–250k funded users in 3 years** is ambitious but not absurd. **1M+ would put it at Stash scale.**
- **Share of target population.** 100k funded users = 0.33% of the 30M Hispanic + NH Black 18–34s, or 0.13% of all 18–34s.

## 6. Contribution size, withdrawals, churn

| Metric | Value | Year | Source |
|---|---|---|---|
| Acorns average round-ups per user | ">$30 a month" | 2021 | Acorns (via search) [S18] |
| Acorns avg round-ups, verified active accounts | $166 over Jan 1–Apr 30, 2021 (~$41/mo) | 2021 | Acorns disclosure (via search) [S18] |
| Acorns 2015 cohort (still open Mar 2024; ~57k customers) | Average **$43/mo round-ups**; contributed $270M round-ups + $543M scheduled deposits = **$813M**; balance **$426M** in Feb 2024 | 2015–2024 | Axios/Acorns (via search; page 403) [S19] |
| → implied withdrawal intensity | $813M in, plus ~9 years of market returns, yet $426M left. That is consistent with **well over half of contributed dollars having been withdrawn**, even among survivors | | **[EST]** |
| Chime auto-savings (2017) | Non-enrolled members $113/mo moved to savings; round-ups $217/mo; round-ups + 10% of paycheck $382/mo (gross transfers in, not net of withdrawals) | Apr 2017 | Chime PR [S32] |
| Cash App inflows per active | ~$490/month (all inflows, not savings) | Q2 2026 | [S7] |
| Blunts base case (08) as a share of Cash App inflows | $50/mo ≈ **10% of an average active's monthly inflows** | | **[EST]** |
| Acorns subscriber retention | "Nearly 99% monthly total subscriber retention"; "average lifetime of 6+ years" | 2021 | Acorns SPAC materials [S20] |
| → implied annual churn | ~12–15%/yr (paying subscribers, not funded users) | | **[EST]** |
| General fintech app 12-month retention | ~48% (≈52% annual churn); common fintech benchmark 5–10% monthly churn | 2022–2025 | Alchemer via Sendbird; secondary **[UNVERIFIED]** [S21] |
| Young-investor attrition evidence | Under-35 investing fell 32% → 26% (2021→2024); COVID cohort median age rose 31 → 38 | 2024 | FINRA [S2] |
| Emergency buffer (drives withdrawals) | 63% could cover a $400 expense with cash or equivalent; only 37% of 18–29s have 3 months saved | 2025 | SHED [S4][S33] |

**Model inputs we suggest [EST]:**
- **Fill size:** $25–$100 per fill; typical **$40–60/month** (matches Acorns $30–43 and 08's $50).
- **Spark (withdrawal) ratio:** **50–70% of fills** in year 1 for this audience. This supports 08's 60% base. Acorns' survivor cohort shows heavy withdrawals even among its most loyal users.
- **Funded-user churn:** **35%/yr base** (range 15–50%). The low end is Acorns-quality retention of paying subscribers. The high end is generic fintech app retention.

## 7. Total annual dollar flows

| Metric | Value | Period | Source |
|---|---|---|---|
| Robinhood net deposits | **$68.1B** (35% of starting assets) | FY2025 | Robinhood [S22] |
| Robinhood net deposits | $21.7B | Q2 2026 | [S13] |
| Retail net purchases of US single stocks + ETFs | **$155.3B** (record for any half-year since 2014) | H1 2025 | Vanda Research (via search) [S23] |
| Retail net purchases, 2025 YTD | ~$270B (JPMorgan estimate; exact cut-off date not confirmed) | 2025 | JPMorgan via Yahoo **[UNVERIFIED date]** [S24] |
| Cash App total inflows | ~$350B/yr run-rate ($87–88B per quarter) | 2026 | [S7][S12] |
| Adults 18–34 dollars into brokerage/savings per year | **No primary source publishes this.** | | |

**Bracket [EST] for 18–34 taxable-investing inflows.** About 20M 18–34s hold non-retirement investments (26% × 78.5M). If they net-contribute $1,000–3,000/yr, that is **$20–60B/yr**. Robinhood's $68B/yr across 27M funded customers (≈$2,500 per customer, 59% of them millennial/Gen Z) sits at the top of this range.

**The Blunts-relevant pool is much smaller.** Suppose 30M young Cash App users each saved $50/month. That is **$18B/yr** of "potential fill" money. At 100k–220k funded users, Blunts' own gross fills would be about **$60–130M/yr**, or **0.3–0.7% of that pool** [EST].

---

## Sizing chain (for the model) [EST]

| Step | Base | Low | High | Basis |
|---|---|---|---|---|
| US adults 18–34 | 78.5M | 78.5M | 78.5M | [S1] |
| … who use Cash App monthly | 30M | 25M | 35M | §3 estimate |
| … without taxable investments (×74%) | **22M** | 15M | 28M | FINRA 26% investing [S2]; SHED 18–29 at 18% implies higher |
| Blunts funded users, year 3 (0.5% / 0.25% / 1%) | **110k** | 40k | 280k | §5 calibration |
| Gross fills/user/yr | $600 | $300 | $900 | 08 base |
| Gross fills/yr | **$66M** | $12M | $250M | |
| Avg balance (08) | $500 | $300 | $800 | 08 |
| AUM at year 3 | **$55M** | $12M | $225M | |
| Revenue at 08 ARPU ($4.6 MVP / $12 scale / $26 high) | **$0.5–1.3M** | $0.2M | $7.3M | 08 |

---

## Gaps / next pulls
- Cash App share of MTAs under 35: not disclosed. The best route is a Block IR question, or eMarketer's "Cash App users by age" (paywalled).
- Cash App USDC send/receive volume: watch the Q3'26 letter (early Nov 2026).
- FDIC 2023 unbanked/underbanked rates by householder age 15–24 / 25–34: in the appendix tables, not pulled here. SHED person-level age data is used instead.
- A primary "want to invest but don't" percentage for 18–34s: FINRA's NFCS State-by-State microdata could produce one.
- Acorns and Public: current funded-account counts and AUM, from Form ADV Item 5.F on adviserinfo.sec.gov.

---

## Sources

- [S1] U.S. Census Bureau, Vintage 2025 national population estimates by age, sex, race and Hispanic origin (monthly files `nc-est2025-alldata-r-file12.csv`, `file14.csv`; computed by us): https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/national/asrh/ ; release: https://www.census.gov/newsroom/press-kits/2026/vintage-2025-pop-estimates.html
- [S2] FINRA Investor Education Foundation, "Investors in the United States" (2024 NFCS Investor Survey, published Nov/Dec 2025): https://www.finrafoundation.org/sites/finrafoundation/files/2025-11/NFCS_Investor_Survey_Report_White_Paper.pdf ; press: https://www.finra.org/media-center/newsreleases/2025/new-finra-foundation-research-examines-shifting-investor-behaviors
- [S4] Federal Reserve, Economic Well-Being of U.S. Households in 2025 (SHED, fielded Oct 2025, published May 13, 2026). Savings & Investments: https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-savings-investments.htm ; Banking: https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-banking.htm
- [S5] Gallup, "What Percentage of Americans Own Stock?" (2025): https://news.gallup.com/poll/266807/percentage-americans-owns-stock.aspx
- [S6] Federal Reserve Bank of Philadelphia, "Why Some Americans Don't Invest in the Stock Market" (LIFE Survey, Jan 2025, published Sept 2025): https://www.philadelphiafed.org/-/media/FRBP/Assets/Consumer-Finance/Briefs/Why-Some-Americans-Dont-Invest-in-the-Stock-Market.pdf
- [S7] Block Q2 2026 shareholder letter (Form 8-K Ex. 99.1): https://www.sec.gov/Archives/edgar/data/0001512673/000119312526335117/d91486dex991.htm ; call transcript: https://www.fool.com/earnings/call-transcripts/2026/08/12/block-xyz-q2-2026-earnings-call-transcript/
- [S8] Pew Research Center, "About 1 in 5 Americans have used crypto" (survey Jan 20–26, 2026; June 8, 2026): https://www.pewresearch.org/short-reads/2026/06/08/about-1-in-5-americans-have-used-crypto-republicans-use-has-ticked-up/
- [S9] FDIC, 2023 National Survey of Unbanked and Underbanked Households, Executive Summary (Nov 2024): https://www.fdic.gov/household-survey/2023-fdic-national-survey-unbanked-and-underbanked-households-executive-summary
- [S10] Pew Research Center, payment apps (survey July 5–17, 2022): https://www.pewresearch.org/short-reads/2022/09/08/payment-apps-like-venmo-and-cash-app-bring-convenience-and-security-concerns-to-some-users/
- [S11] Cash App press, "Cash App Unlocks Bitcoin for Everyday Payments, Adds Stablecoin Support" (Nov 13, 2025; "24 million actives"): https://cash.app/press/cash-unlocks-bitcoin-everyday-stablecoins
- [S12] Block Q1 2026 shareholder letter (Green average age 34; 9.7M PBAs; $1,494 inflows per active): https://s29.q4cdn.com/628966176/files/doc_financials/2026/q1/Block_Q1-2026-Shareholder-Letter.pdf ; 8-K: https://www.sec.gov/Archives/edgar/data/0001512673/000119312526212032/d132441dex991.htm
- [S13] Robinhood Q2 2026 results (28.4M funded, $369B TPA, $21.7B net deposits): https://investors.robinhood.com/news-releases/news-release-details/robinhood-reports-second-quarter-2026-results
- [S14] YouGov, Robinhood customer base 2026 (panel, not company data): https://yougov.com/en-us/articles/55529-robinhoods-brand-health-has-strengthened-what-does-its-customer-base-look-like-in-2026 ; median age ~35 (secondary): https://benzinga.com/markets/cryptocurrency/24/09/40820571/robinhood-woos-millennials-as-crypto-based-transaction-revenue-spikes-161
- [S15] Acorns pricing page (16M all-time customers, as of 8/26/2026; see 08 [M1]): https://www.acorns.com/pricing/ ; secondary AUM/subscriber estimates **[UNVERIFIED]**: https://investingintheweb.com/brokers/acorn-statistics/
- [S16] Grab press release on the Stash acquisition (>1M paying subscribers, $5B AUM): https://investors.grab.com/news-and-events/news-details/2026/Grab-Accelerates-Financial-Services-Roadmap-with-Acquisition-of-Digital-Investing-Platform-Stash-Financial-Inc--2026-5wydDSQuVA/default.aspx ; valuation: https://www.forbes.com/sites/iansayson/2026/02/12/grab-buys-investment-app-stash-at-425-million-valuation-after-posting-first-full-year-profit/
- [S17] Chime Q2 2026 results (10.4M active members, ARPAM $260): https://investors.chime.com/news-releases/news-release-details/chime-reports-second-quarter-2026-financial-results
- [S18] Acorns Round-Ups page / disclosures (">$30 a month"; $166 Jan–Apr 2021): https://www.acorns.com/round-ups/
- [S19] Axios, "How much Acorns savers amassed by investing spare change" (Apr 8, 2024; page 403'd to the fetcher, figures via search snippet): https://www.axios.com/2024/04/08/acorns-worth-it-data-report-investing
- [S20] Acorns 2021 SPAC analyst day materials (≈99% monthly subscriber retention, 6+ yr lifetime, average age 34): https://www.prnewswire.com/news-releases/acorns-highlights-business-growth-and-product-plans-and-financials-at-virtual-analyst-day-301378150.html ; https://www.sec.gov/Archives/edgar/data/1829797/000110465921072713/tm2116619d1_ex99-2.htm
- [S21] Fintech retention benchmarks (secondary): https://sendbird.com/blog/finance-and-payment-app-retention ; https://dojobusiness.com/blogs/news/fintech-ideal-retention-rate
- [S22] Robinhood Q4 and FY2025 results ($68.1B net deposits): https://investors.robinhood.com/news-releases/news-release-details/robinhood-reports-fourth-quarter-and-full-year-2025-results
- [S23] Vanda Research H1 2025 retail net purchases (via): https://www.tradingview.com/news/invezz:9ac8c0172094b:0-retail-investors-defy-headwinds-to-trade-record-6-6-trillion-in-stocks-in-first-half-of-2025/ ; https://www.cnbc.com/2025/12/31/retail-investors-dip-buying-taco-trade-strong-2025.html
- [S24] JPMorgan retail flow estimate (~$270B YTD 2025) (via): https://finance.yahoo.com/news/retail-investors-lead-500-billion-225231151.html
- [S25] CNBC/Generation Lab survey (Feb 6, 2024; 403 to the fetcher): https://www.cnbc.com/2024/02/06/gen-z-millennials-are-grappling-with-high-cost-of-living.html
- [S26] Ariel-Schwab Black Investor Survey 2022: https://www.aboutschwab.com/2022-ariel-schwab-black-investor-survey
- [S27] Block Q2 2025 shareholder letter (2.7M paycheck deposit actives; 5M teen accounts; under-25 attach): https://s29.q4cdn.com/628966176/files/doc_financials/2025/q2/Shareholder-Letter_-Block_2Q25.pdf
- [S28] Block 2024 disclosure "21% of 18-to-21-year-olds used the Cash App Card" (via search; exact document not confirmed): https://www.digitaltransactions.net/block-looks-to-cash-app-and-loans-as-growth-drivers-in-2025/
- [S29] Cash App age splits (secondary, no methodology) **[UNVERIFIED]**: https://grabon.com/blog/cash-app-usage-statistics/
- [S30] Cash App press, "Stablecoins are now available on Cash App" (May 27, 2026): https://cash.app/press/cash-app-stablecoins-all-customers ; CoinDesk: https://www.coindesk.com/business/2026/05/27/block-kicks-off-cash-app-s-phased-stablecoin-roll-out-to-its-nearly-60-million-users
- [S31] PayPal: Venmo 67M MAAs Q4 2025 (via): https://finance.yahoo.com/news/paypal-holdings-inc-pypl-q4-190304207.html ; PayPal FY2025 10-K: https://www.sec.gov/Archives/edgar/data/1633917/000163391726000024/pypl-20251231.htm ; Q2 2026 MAAs 228M (via): https://finance.yahoo.com/markets/stocks/articles/paypal-q2-2026-earnings-beat-124337219.html
- [S32] Chime PR, "Save When I Get Paid" (Apr 13, 2017): https://www.prnewswire.com/news-releases/chimes-new-save-when-i-get-paid-feature-more-than-triples-members-average-monthly-savings-300439249.html
- [S33] Fed SHED 2025 press release ($400 expense 63%): https://www.federalreserve.gov/newsevents/pressreleases/other20260513a.htm
