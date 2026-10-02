# 11 — QQQ returns + "How it works" tutorial

Researched 2026-09-28. Unverified items are marked **[UNVERIFIED]**.

---

## Part 1 — QQQ total returns (dividends reinvested)

### Calendar-year total returns, 2006–2025

Source: Yahoo Finance QQQ "Annual Total Return History", pulled 2026-09-28, trailing data as of 2026-09-25. Yahoo's fund data comes from Morningstar. https://finance.yahoo.com/quote/QQQ/performance/
Search results for Invesco's HK quarterly outlook page also gave 2025 = 20.77%. https://www.invesco.com/hk/en/etf/market-outlook/qqq-quarterly-outlook.html

These are Yahoo/Morningstar total-return figures, probably at market price. Invesco's own NAV calendar-year numbers can differ by a few hundredths of a percent. The Invesco US performance page (https://www.invesco.com/qqq-etf/en/performance.html) renders its tables with JavaScript, so I couldn't read them. **[UNVERIFIED against Invesco NAV per year]**. Before launch, get the exact per-year NAV figures from Invesco's performance page or the prospectus bar chart.

| Year | QQQ total return | | Year | QQQ total return |
|---|---|---|---|---|
| 2006 | +7.14% | | 2016 | +7.10% |
| 2007 | +19.02% | | 2017 | +32.66% |
| **2008** | **−41.73%** (worst) | | 2018 | **−0.12%** |
| 2009 | +54.70% | | 2019 | +38.96% |
| 2010 | +19.91% | | 2020 | +48.62% |
| 2011 | +3.38% | | 2021 | +27.42% |
| 2012 | +18.12% | | **2022** | **−32.58%** |
| 2013 | +36.63% | | 2023 | +54.85% (best) |
| 2014 | +19.18% | | 2024 | +25.58% |
| 2015 | +9.45% | | 2025 | +20.77% |

- Down years from 2006 to 2025: **2008 (−41.73%)**, **2022 (−32.58%)** and **2018 (−0.12%)**. There were 3 red bars in 20 years.
- Context before this window: 2000 −36.12%, 2001 −33.34%, 2002 −37.37%. That is three losing years in a row, per the same Yahoo table. Don't imply that one down year is followed by recovery.
- The worst drop inside a year is larger than any calendar-year loss. Schwab's report lists a worst 3-month period of −22.69%.

### 2026 year to date

| As of | YTD | Source |
|---|---|---|
| 2026-06-30 (quarter-end, NAV) | **+20.19%** (market price +20.09%) | Invesco QQQ fact sheet P-QQQ-IG-1 07/26, https://www.invesco.com/us-rest/contentdetail?contentId=841e411c-a1eb-4541-8cb8-0fa603abea81&dnsName=us |
| 2026-08-31 (month-end) | **+17.0%** (NAV and market) | Schwab ETF report, generated 2026-09-28, https://www.schwab.wallst.com/schwab/Prospect/research/etfs/reports/reportRetrieve.asp?reportType=etfrc&symbol=QQQ |
| 2026-09-25 (latest) | +21.60% | Yahoo Finance (above). **[Secondary source, not confirmed by Invesco]** |

### Annualized total returns

| Period | Figure | Source / as-of |
|---|---|---|
| **10-yr, official** | **22.07% NAV / 22.08% market** | Invesco fact sheet, as of 2026-06-30 (standardized, quarter-end) |
| 10-yr, month-end | 20.8% | Schwab, as of 2026-08-31 |
| 10-yr, latest | 20.78% | Yahoo, as of 2026-09-25 |
| 10-yr, calendar 2016–2025 | **19.45%** | Computed by us from the table above |
| **20-yr, calendar 2006–2025** | **15.46%** (≈ $1 → $17.74) | Computed by us from the table above. **[Not published by Invesco; derived]** |
| 1-yr / 3-yr / 5-yr / since inception (3/10/99) | 34.03 / 26.55 / 16.45 / 10.96% NAV | Invesco fact sheet, as of 2026-06-30 |

Other facts from the same fact sheet: expense ratio 0.18%. Top holdings on 6/30/26: NVIDIA 7.58%, Apple 6.66%, Micron 5.63%, Microsoft 4.34%, AMD 4.10%, Amazon 4.02%, Tesla 3.29%, Alphabet A 3.26%, Intel 3.03%, Alphabet C 3.02%.
Invesco's own warning on the fact sheet: "high, double-digit and/or triple-digit returns are highly unusual and cannot be sustained."

### Rules for showing past performance (not legal advice; send to counsel with doc 03)

Which regime applies depends on how Blunts is structured (see 03/07):

1. **Blunts as an RIA / robo-adviser.** The SEC Marketing Rule 206(4)-1 applies.
   - Any performance shown must include **1-, 5- and 10-year periods**, all ending on the same recent date. For a fund older than 10 years, like QQQ, all three are required.
   - Returns must be shown **net of fees**, with gross and net given equal prominence. Our 10%-of-profit spark fee would therefore have to be modeled into any "your Blunts" performance.
   - No cherry-picked periods. "Hypothetical performance" has extra requirements, so avoid "if you'd put $100 in 2016…" charts.
   - Sources: https://www.sec.gov/rules-regulations/staff-guidance/division-investment-management-frequently-asked-questions/marketing-compliance-frequently-asked-questions ; https://www.assetmark.com/blog/guide-sec-marketing-rule ; https://www.klgates.com/SEC-Marketing-Rule-FAQs-Yield-New-Guidance-3-20-2025

2. **Blunts as a broker-dealer or introducing through one (FINRA member).** FINRA Rule 2210 applies.
   - Retail communications with fund performance must include Rule 482 standardized performance: average annual total return for **1, 5 and 10 years as of the most recent calendar quarter-end**.
   - They must also show the fund's **gross expense ratio** and **max sales charge** (none for QQQ).
   - Most recent month-end performance must be available by phone or website.
   - **Projections and predictions are prohibited** (2210(d)(1)(F)), so no "you'll have $X by 30."
   - Communications must be fair and balanced, which means risk goes next to reward.
   - Sources: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210 ; https://www.finra.org/rules-guidance/guidance/faqs/advertising-regulation ; https://www.dfinsolutions.com/knowledge-hub/blog/sec-rules-482-and-34b-1
   - Caveat: QQQ is technically a unit investment trust, not an open-end fund, so the exact 2210(d)(5) and Rule 482 fit needs counsel. Invesco itself follows the standardized 1/5/10/since-inception quarter-end format, so copying that format is the safe default.

**Minimum compliant returns chart (safe default that satisfies both regimes):**
- Yearly bars 2006–2025 plus YTD, **with red down years**. The 20-year window includes 2008 and 2022, so it is balanced.
- Directly under or beside the chart, a small standardized block: `QQQ avg yearly return, as of 6/30/26: 1 yr 34.03% · 5 yr 16.45% · 10 yr 22.07% (NAV)`. Update it every quarter. Add `Expense ratio 0.18%`.
- Legend, always visible near the chart, not behind a tap: **"Past performance doesn't guarantee future results. You can lose money."** The fuller version: "Investment returns and principal value will fluctuate, and shares, when sold, may be worth more or less than their original cost. Current performance may be lower or higher."
- If performance is shown after Blunts' fee (Marketing Rule), state "before Blunts' fee" or show net figures as well.
- Don't show: projections, "average return" hero numbers without the 1/5/10 block, a chart that starts at a low point such as 2009, or dollar-growth hypotheticals.
- Tap-through to QQQ prospectus link and month-end performance (invesco.com/qqq).

---

## Part 2 — Tutorial UX research

### What the evidence says

- **Carousels ("deck of cards") are weak teachers.** NN/g tested deck-of-cards tutorials with 70 users across 4 apps. The tutorials **didn't improve task performance**. NN/g recommends skipping onboarding where possible, keeping it short, making it skippable, and preferring contextual, interactive help. https://www.nngroup.com/articles/mobile-tutorials/ ; https://www.nngroup.com/articles/onboarding-tutorials/ ; https://www.nngroup.com/articles/mobile-app-onboarding/
- **Keep it to 3–5 cards.** That is the common guidance for intro carousels, because people swipe through fast. https://userguiding.com/blog/onboarding-screens ; https://designerup.co/blog/i-studied-the-ux-ui-of-over-200-onboarding-flows-heres-everything-i-learned/
- **Duolingo: learn by doing, sign up later.** Duolingo gets users into a first lesson before account creation ("gradual engagement"), with a mascot, instant feedback, and a streak on day 1. Reported: delayed signup gave +20% DAU. https://goodux.appcues.com/blog/duolingo-user-onboarding ; https://www.appcues.com/blog/gradual-engagement-mobile-app-first-screen **[Lift figures are from secondary teardowns]**
- **Robinhood asks for one thing per screen,** with big type and lots of whitespace. Its confetti-style celebration of a first action is well known. https://userpilot.com/blog/fintech-onboarding/ ; https://uiland.design/screens/robinhood/screens/50ec2595-0e2a-4fff-a455-8e1302c9ee13/flows/onboarding
- **Acorns makes one metaphor the whole product.** The acorn becomes an oak, and spare change is "round-ups." It shows the first investment right after linking a bank, for instant gratification. https://usabilitygeek.com/ux-case-study-acorns-mobile-app/ ; https://userpilot.com/blog/fintech-onboarding/
- **Cash App, Chime, Revolut and Stash** (from general product knowledge, not freshly verified today **[UNVERIFIED]**):
  - Cash App: huge numerals and one primary action per screen ("$" keypad).
  - Chime: 3–4 illustrated value-prop cards before signup.
  - Revolut: short animated feature stories, like Instagram stories with a progress bar at the top.
  - Stash: "Stock-Back" metaphor, and a learning feed of small cards.
- **Progress and control matter.** A screen with no progress indicator creates anxiety, and a skip option improves the sense of control. https://www.theskinsfactory.com/uiux-design-blog/fintech-onboarding-ux-design ; https://userguiding.com/blog/onboarding-screens

### Patterns to use in Blunts

1. **4–5 cards, one idea each.** If a card needs two sentences, it's two cards (or it's cut).
2. **Visual first.** The animation or illustration fills about 70% of the card. Put a big number or symbol in the middle. The caption goes under it.
3. **Captions of 8 words or fewer.** Use 5th-grade words. Use the house metaphor words (fill, spark, blunt, band) and teach them by showing them.
4. **Tap to advance on the right half, tap to go back on the left**, story-style, with swipe also supported. Low-literacy users know Instagram/TikTok stories better than carousels.
5. **Story-style progress segments at the top.** They beat bottom dots because they're visible and show length. Auto-advance only if the animation finishes. Pause on hold.
6. **"Skip" is always visible, top-right.** The last card has one big CTA ("Fill your first blunt").
7. **Loop the animation once, then idle.** Let it replay on tap. Respect Reduce Motion by using a static end-frame.
8. **Re-openable.** Put a "How it works" (?) in the header and repeat each card contextually. Show the Fill card on the first Fill screen and the Spark/fee card on the first Spark screen. This follows NN/g: contextual beats upfront.
9. **Honest numbers.** The risk card uses the real chart with red bars. The compliance line sits on the card in small text, not hidden.
10. **Do something by the last card.** Duolingo-style: the final card is the first action, a Fill of $25.

### Proposed script (5 cards)

| # | Visual | Caption (≤8 words) |
|---|---|---|
| 1. **Your stash** | Row of coins → morph into units. One quarter-coin labeled **$25**. Four quarters roll together into one rolled **blunt = $100**. Ten blunts snap into a rubber-banded bundle: **band = $1,000**. | "$25 a quarter. $100 a blunt." |
| 2. **Fill** | Big thumb taps **Fill**. Green flakes rain into an open wrap. A number counts up: $0 → $25 → $100. The wrap rolls itself closed and pops a small ✓. | "Fill it up. That's your money in." |
| 3. **What's inside** | Zoom into the blunt: the flakes are tiny tiles with wordmarks as text: **Apple · Nvidia · Microsoft · Amazon · Google · Tesla**, then "+94 more". A badge reads **QQQ**. | "You own the 100 biggest Nasdaq companies." |
| 4. **Up and down** | Real yearly bar chart, 2006→2025 + '26 YTD. Bars grow in one by one. Green up, **red down**: 2008 −42%, 2022 −33% (2018 a sliver). Red bars shake slightly. Fine print under the chart: 1/5/10-yr block + "Past results don't guarantee future results. You can lose money." | "It goes up. It goes down too." |
| 5. **Spark** | Tap **Spark**: lighter flicks and the blunt glows. Cash floats out to a wallet. A split animation shows the original money going back whole, and the growth (smoke) splitting 9 puffs to you and 1 puff to Blunts. A no-gain case shows 0 puffs and a "no fee" tag. Big CTA: **Fill your first quarter**. | "Spark cashes out. We get 10% of gains." |

Notes on card 5: the 10%-of-profit fee is **under legal review** (see 03/07/08). The card's structure (the "we only get paid if you earned" visual) stays either way, and only the number changes. The fee card must match the Form CRS / fee disclosure wording exactly.
Notes on card 4: the chart data must be the same series used elsewhere in the app. Update the 1/5/10 block every quarter, with the next update due for 9/30/26 figures.
Note on card 3: strictly, the Nasdaq-100 is the 100 largest *non-financial* Nasdaq-listed companies (fact sheet). The caption simplification is fine, but the tap-through or fine print should say "Nasdaq-100 index".
