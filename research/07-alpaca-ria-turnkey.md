# Blunts: Alpaca Licensing, Turnkey RIA/BD Providers, and the Fastest Legal MVP

**Date:** 2026-09-28 | **Status:** Research memo. It is NOT legal advice. **[UNVERIFIED]** marks anything not confirmed in a primary source during this pass. Citations like [S3] point to the Sources list at the end.

Builds on `04-us-stack-dinari-alpaca.md` (Alpaca features, fee law in §A there). It doesn't repeat that material.

---

## TL;DR

1. **Alpaca's unlicensed "trading/investing app" path is real but no longer advertised in the US docs.**
   - Current Broker API docs list only two use cases: "Broker dealer (fully-disclosed, omnibus)" and "Registered Investment Advisor (RIA)" [S1].
   - But Alpaca's marketing still has a "Fintech Startups" page for unlicensed apps, with Alpaca Securities as the fully-disclosed BD [S2]. Alpaca also said on the record (2023) that in the US it "uniquely" supports **unlicensed** companies, and that it reviews their processes and marketing [S3].
   - **Live US precedent:** **OPTO** (Opto Markets LLC, a CMC Markets subsidiary) launched in the US in **Nov 2024** on Alpaca. It is "not a broker-dealer, investment adviser, nor a member of FINRA" [S4][S5]. It offers **ready-made baskets ("Folios")**, including a **Mag 7** Folio, with **automatic quarterly rebalancing** [S6]. It frames them as self-directed: Opto "does not recommend any specific securities or investment strategies."
   - That is almost exactly the Blunts product, done without an RIA. **But** OPTO had a FTSE-250 parent. Whether Alpaca will onboard a seed-stage unlicensed US startup in 2026 is **[UNVERIFIED; ask sales]**.
2. **The Alpaca Rebalancing API does not require RIA status on paper.** The docs call it a tool for "investment advisors" but list no eligibility rule [S7]. OPTO's auto-rebalanced Folios suggest non-RIAs can use it **[UNVERIFIED that OPTO uses this exact API]**.
   - DriveWealth is different: its AutoPilot rebalancing explicitly needs RIA-managed accounts (`riaUserID`) [S8].
3. **Alpaca's commission field can be sent on sells only, but who may keep it is the legal problem.**
   - The docs say: "You will need to contact Alpaca first to set up the commission structure." A sell commission is capped at the sale proceeds [S9].
   - Paying transaction-based commissions to an **unregistered** app runs into **Exchange Act §15(a)** and **FINRA Rule 2040**. Alpaca would need a "reasonable basis," such as a legal opinion, that Blunts doesn't need to register [S10].
   - **Expect Alpaca to refuse a % of each sell paid to an unlicensed partner, or to require a legal opinion first [UNVERIFIED].**
4. **Only one live turnkey provider brings both its own RIA and its own BD: Atomic** (Atomic Invest LLC is the SEC RIA; Atomic Brokerage LLC is the FINRA BD; Pershing is custodian) [S11][S12].
   - The app acts as an unregistered "**Promoter**." Atomic pays promoters **0%–0.85% a year of referred AUM**, plus a share of cash and margin interest [S13].
   - **Live precedent:** **NerdWallet's Automated Investing Account.** It has a $1 minimum and costs **0.25% a year (0.18% for members)**. NerdWallet discloses that it receives "0% to 0.85% of assets under management annualized" [S14].
   - **The catch:** Atomic's fee is an **AUM wrap fee (up to 1%/yr)**, not a sell fee [S12][S15]. Its models are Atomic's own, and clients "may not … request specific allocations to individual securities" [S13]. A Blunts 9-stock basket must become an **Atomic-adopted model**, which is **[UNVERIFIED; ask Atomic]**.
5. **Everyone else is BD-only, RIA-only, or gone.**
   - **DriveWealth's RIA arm (DriveAdvisory, LLC) is INACTIVE** in the SEC's adviser database (IAPD) [S16]. DriveWealth's managed features need your own RIA [S8].
   - **Apex Direct** gives you a BD, not an RIA [S17].
   - **Bumped** shut down in 2022 [S18].
   - **Treasury Prime, Unit and Synctera** are banking providers, not investing [S19].
6. **Blunts' own RIA takes about 2–4 months and $10–25k to set up, plus $8–125k a year for compliance.**
   - SEC registration via the **internet adviser exemption** (Rule 203A-2(e)) needs an "operational interactive website" whose advice is generated "based on personal information each client supplies" [S20][S21]. **A one-basket-for-everyone product may not qualify.** Add a quiz that picks between Basket, QQQ and VOO.
   - The SEC must act within **45 days** [S22].
   - The fallback is the **multi-state exemption** (required to register in 15+ states lets you register with the SEC) [S23].

### Recommendation

**Fastest compliant MVP: launch on Atomic as a Promoter.** Blunts registers nothing and keeps a share of AUM:
- Atomic is the RIA and BD.
- Onboarding takes "a matter of weeks" [S11].
- There is a $1 minimum, fractional shares, automated contributions and a Traditional IRA [S13][S14][S24].

**What this costs the founders:** the "1% on sparks" model becomes an **annual AUM fee** that Atomic charges and shares with Blunts. That's not what they asked for, but it's the only no-license path where Blunts can **legally get paid per user**.

**In parallel, file Blunts' own RIA** (about 2–4 months). Once it's registered, Blunts can move to (or add) **Alpaca** with its own fee design. For example, a sells-only "spark fee," subject to counsel's view of transaction-based pay (see 04 §A).

**If founders insist on the sell fee on day one**, the only faster route is **Alpaca's unlicensed OPTO-style path**, and only if Alpaca, in writing:
- accepts Blunts as an unlicensed partner;
- approves a self-selected "Blunts Basket / QQQ / VOO" menu; and
- either charges the 1% sell commission **itself** and pays Blunts a Rule-2040-compliant **fixed** fee, or accepts a legal opinion supporting a commission share.

---

## 1. Alpaca in 2026

| Question | Finding | Confidence |
|---|---|---|
| Does Alpaca onboard unlicensed US apps (fully-disclosed, Alpaca as BD)? | **Docs:** only BD and RIA use cases are listed [S1]. **Marketing:** the "Fintech Startups" page targets unlicensed apps and says "Brokerage services are provided by Alpaca Clearing" [S2]. **On record (May 2023):** "In the US … unlicensed companies," with Alpaca overseeing "your marketing materials" [S3]. **Live example:** OPTO (US, Nov 2024 to 2025), unlicensed [S4][S5] | **Yes, historically. For a seed-stage US startup in 2026: [UNVERIFIED]. Alpaca seems to be steering toward licensed partners.** Ask sales directly |
| Does the Portfolio/Rebalancing API need RIA status? | No eligibility rule in the docs. It's described as "offers investment advisors a way to…". Cash inflows "trigger buy trades"; $1 per asset minimum; $10 minimum for `invest_cash` runs [S7] | No written requirement. **Confirm it's enabled for non-RIA partners [UNVERIFIED]** |
| Can an unlicensed app offer one fixed basket or ETF with auto-invest? | OPTO does it (ready-made Mag 7 Folio plus user-copied Folios, quarterly auto-rebalance, "does not recommend") [S6]. Key difference: OPTO offers **many** Folios that users pick and edit. A **single, app-chosen** basket that all money flows into looks more like a recommendation (Reg BI for Alpaca) or advice (Advisers Act for Blunts) | **Mitigate:** make it a **user choice** among 3 options (Blunts Basket / QQQ / VOO). Show holdings and weights, let users see and change them, and add "not a recommendation" language that Alpaca's compliance team approves. **Counsel sign-off needed** |
| Can the commission be charged on sells only? | Yes, technically. `commission` is sent per order (`notional` / `qty` / `bps`), so you send it only on sells. You must "contact Alpaca first to set up the commission structure." On sells it's capped at principal minus SEC/FINRA fees [S9] | Technical: **yes**. Contractual: **[UNVERIFIED]** |
| Who may legally receive it? | **§15(a):** transaction-based pay is the hallmark of broker activity (04 §A.1). **Rule 2040(a):** a member may not pay commissions to anyone who would need to register, unless it "reasonably support[s]" that they don't: SEC letters, a no-action letter, or "a legal opinion from independent, reputable U.S. licensed counsel" [S10] | **A registered BD or an RIA fee can carry it. An unlicensed Blunts should not take a % per sell.** Safer: Alpaca keeps the commission and pays Blunts a flat per-funded-account or license fee, or Blunts becomes an RIA |
| Pricing | Broker API pricing is custom per partner. Nothing published [S25] | [UNVERIFIED] |

**Pattern among US Alpaca apps that do baskets or automation:** most register. **Composer** is an RIA and now also has its own BD (Composer Securities; "Composer by SoFi"). **dub** is an SEC RIA (dub Advisors) [S26]. **OPTO** is the lone unlicensed example found.

---

## 2. Turnkey providers (bring their own RIA and/or BD)

| Provider | Who is RIA / BD | Live in 2026? | Custom fixed basket? | Min / fractional | Funding / IRA / tax docs | App revenue options | Time to launch |
|---|---|---|---|---|---|---|---|
| **Atomic** (atomicvest.com) | **Atomic Invest LLC** = SEC RIA (CRD 313255, active since 2021-05-04). **Atomic Brokerage LLC** = BD. Custodian: Pershing / BNY [S11][S12][S16] | **Yes.** Raised $30M in Aug 2025 ($55M total); 52× account growth; $20B+ annualized volume. Partners: NerdWallet, Yieldstreet, Bluevine, Aspire, Slash [S11][S27] | **Only if Atomic adopts it as a model [UNVERIFIED].** Its brochure (ADV 2A): models are Atomic's; clients can exclude securities but "may not … request specific allocations to individual securities." Atomic also runs a Model Portfolio Service for *registered* advisers and can act as sub-adviser to an RIA [S13]. There's also a **self-directed subaccount** (no advice, custody wrap fee) where users can buy the 9 names themselves [S12] | No minimum (NerdWallet sets $1); fractional and dollar-amount, market orders [S13][S14][S15] | Bank link with "Smart Contributions" auto-invest [S13]. Traditional IRA and 529 via Pershing [S24] (Roth [UNVERIFIED]; the IRA fee wrap is handled differently [S13]). 1099s via custodian [UNVERIFIED] | **Promoter pay 0–0.85%/yr of AUM**, plus a share of cash-sweep and margin interest [S13]. Client wrap fee up to **1.00%/yr**, which "may vary depending on … the business partner" [S15]. **A sells-only fee isn't in its documents [UNVERIFIED; ask]** | "Matter of weeks" [S11] |
| **Alpaca** | Alpaca Securities = BD. **No RIA offered** | Yes | Via Rebalancing API (see §1) | Fractional from about $1 | ACH/Plaid, IRA, 1099 (04 §2.1) | `commission` field; flat fees under Rule 2040 | Negotiated; sandbox is immediate |
| **DriveWealth** | DriveWealth LLC = BD. **DriveAdvisory, LLC (its RIA arm, launched 2021) is INACTIVE in IAPD** [S16]. Managed "AutoPilot" requires your own RIA (`riaUserID`, `RIA_MANAGED`) [S8][S28] | Yes, for large partners: OnePay/Walmart (via OnePay's **own** BD, One Growth Securities), Revolut, MoneyLion, Acorns, Ualá [S29][S30] | Self-directed only, unless you're an RIA | Fractional | Subscriptions collected for the partner; per-order commission or commission schedules [S31][S32] | Commission / subscription | "As little as 90 days" [S29] |
| **Apex Fintech (Apex Direct / AscendOS)** | Apex Clearing = BD ("leaning on Apex's broker-dealer FINRA registration"). **No RIA** [S17] | Yes | Robo tooling for RIAs; you bring the RIA | Fractional, 30+ account types, IRA [S17] | Yes | Negotiated [UNVERIFIED] | "Launch … in weeks" (marketing) [S33] |
| **Bumped** | n/a | **Dead** (wound down Dec 2022; Bakkt bought what was left) [S18] | | | | | |
| **Treasury Prime / Unit / Synctera** | Banking-as-a-service only | Yes, but **no investing product** [S19] | | | | | |
| **Wealthfront / Stash / Acorns / Revolut white-label** | No embeddable RIA-as-a-service found | **No evidence** of a white-label offering [UNVERIFIED negative] | | | | | |
| **Upvest, Lightyear** | EU/UK only (Lightyear itself is an Alpaca customer) [S2] | Not US | | | | | |

**Bottom line:** in 2026, **Atomic is the only live US turnkey provider that supplies the RIA, the BD and pays the app.** And NerdWallet is proof the model runs at consumer scale.

### 2.1 What Atomic means for the Blunts product

- **"Fill"** = contribution into an Atomic discretionary account. Atomic buys toward target weights and rebalances on deposits and withdrawals [S13].
- **"Spark"** = withdrawal. Atomic sells pro rata. Any unpaid fees are collected at withdrawal [S15].
- **Basket.** Two routes:
  - **(a)** Ask Atomic to publish a "Tech 9" and a QQQ/VOO model as **Atomic models** chosen through its questionnaire. Atomic then owns the fiduciary advice.
  - **(b)** Use the self-directed subaccount, where the user buys the basket; Blunts then needs Atomic to support basket orders.
- **Money.** Example: client fee 0.75%/yr, with Blunts' promoter share around 0.5%/yr **[negotiable, UNVERIFIED]**.
  - At a $500 average balance that's about **$2.50 per user per year**.
  - Compare the 1% sell fee: about $5 per $500 withdrawn.
  - **AUM share earns even when users never spark**, and it removes the conflict that Blunts profits only when users sell.
- **Promoter compliance.** Blunts must follow the SEC Marketing Rule promoter disclosures (NerdWallet's disclosure is the template) [S14].
  - Many states treat paid promoters as **investment adviser representatives (IARs)**. The NASAA model rule and May 2026 amendments use the term "promoter" [S34].
  - Confirm with Atomic how it handles state IAR registration for promoter staff **[UNVERIFIED]**.

---

## 3. Registering Blunts as its own RIA

| Item | Detail |
|---|---|
| **Route A: SEC internet adviser exemption** | Rule 203A-2(e) as amended in 2024 (compliance date 2025-03-31) [S20]:<br>• advice must go to **all** clients exclusively through an "operational interactive website";<br>• the advice must be "generated by … software-based models … **based on personal information each client supplies**" [S21];<br>• no offline clients;<br>• staff can't tailor advice.<br>**Fit for Blunts:** add an in-app questionnaire that maps each user to Basket, QQQ or VOO. A single basket for everyone is a weak fit **[counsel]** |
| **Route B: multi-state exemption** | Rule 203A-2(d): if you'd have to register in **15 or more states**, you may register with the SEC instead [S23]. A national app quickly exceeds the 5-client state de minimis in many states **[counsel to confirm]** |
| **Route C: state registration** | Register in the home state, then state by state as you pass each state's de minimis. It's slow to go national, so not recommended |
| **Timeline** | Build Form ADV Parts 1, 2A and 3 (CRS), compliance manual and code of ethics: about 3–6 weeks. The **SEC acts within 45 days** of a complete filing [S22]. **Total about 2–4 months.** States often take 2–3 months [S35] |
| **Filing fees** | IARD: $40 (under $25M AUM) / $150 / $225 [S36]. State notice filings about $50–500 each [S37] |
| **Setup cost** | Registration project about $4–8k from consultants [S38][S39]. Fintech-specific securities counsel (fee design, basket, custody) **about $10–40k [UNVERIFIED estimate]**. E&O insurance about $2.5–4k/yr [S39] |
| **Ongoing** | Consulting $8–15k/yr; outsourced CCO **$30–125k/yr** ($2–8k/month) [S38]. Annual ADV amendment, CRS, books and records, Marketing Rule review, and custody-rule analysis if fees are deducted |
| **Fee design as an RIA** | An asset-based or flat subscription fee is standard. A **% of each sell** charged by an RIA is still transaction-based and gets broker scrutiny. §205 is fine as long as it's never a share of gains (04 §A) |

---

## 4. Recommended path and next actions

**Week 0–2 (in parallel):**
1. **Atomic** (partnerships@atomicvest.com). Ask:
   - Will you publish a custom "Tech 9" model plus QQQ/VOO models?
   - Can the questionnaire route users to them?
   - Client fee floor, and the promoter share split?
   - Any sell-side or withdrawal fee option?
   - Roth IRA?
   - Instant or near-instant ACH funding?
   - Payout rails (ACH only?) and 1099s?
   - Minimum partner size and platform fee?
   - Do you allow crypto/stablecoin funding?
2. **Alpaca sales.** Ask:
   - Do you still onboard **unlicensed US** partners in 2026 (the OPTO model)?
   - Is the Rebalancing API enabled for non-RIA partners?
   - Will you configure a sell-only `bps` commission? Who keeps it, and what Rule 2040 support do you need?
   - Can Blunts instead get a flat per-funded-account fee?
3. **Securities counsel.** Scope a one-week memo on:
   - promoter status and state IAR exposure;
   - whether a single basket is advice;
   - the internet adviser exemption vs. multi-state fit.

**Decision rule:**
- **Atomic says yes to the custom model:** launch on Atomic (about 4–8 weeks). Monetize with an AUM share. Optionally test a "Blunts+" subscription later, billed from the account, with counsel.
- **Atomic says no to the custom model, but Alpaca confirms the unlicensed path:** launch the OPTO-style self-directed 3-choice menu on Alpaca. Alpaca charges the sell commission and pays Blunts a flat fee, or Blunts takes no fee until its RIA is live.
- **Either way:** file Blunts' RIA now (about 2–4 months). It unlocks direct fee design and a switch to Alpaca at better unit economics once the user base exists.

---

## Sources

- [S1] Alpaca, About Broker API (US docs): https://docs.alpaca.markets/us/docs/about-broker-api
- [S2] Alpaca, Fintech Startups: https://alpaca.markets/fintech-startups ; Broker API page: https://alpaca.markets/broker
- [S3] Alpaca, "Chatting with Alpaca: Who Can Build a Fintech App" (2023-05-15): https://alpaca.markets/learn/chatting-with-alpaca-who-can-build-a-fintech-app
- [S4] TradeInformer, "CMC Markets targets US clients with OPTO" (Nov 2024): https://tradeinformer.com/broker-news/cmc-markets-targets-us-clients-with-opto
- [S5] OPTO app disclosure (via search snippet; the page now redirects to CMC): https://optothemes.com/disclosures-and-legal-documentation/app-disclosure
- [S6] CMC Markets, "OPTO Folios: Rethinking Portfolio Construction" (2025-05-13): https://www.cmcmarkets.com/en/optox/opto-folios-rethinking-portfolio-construction
- [S7] Alpaca, Portfolio Rebalancing docs: https://docs.alpaca.markets/docs/portfolio-rebalancing
- [S8] DriveWealth, Automated trading (AutoPilot): https://developer.drivewealth.com/apis/docs/automated-trading
- [S9] Alpaca, Broker API Trading (commission): https://docs.alpaca.markets/us/docs/brokerapi-trading ; Order reference: https://docs.alpaca.markets/reference/createorderforaccount
- [S10] FINRA Rule 2040: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2040
- [S11] Atomic $30M raise (2025-08-27): https://www.prnewswire.com/news-releases/atomic-raises-30-million-to-accelerate-global-expansion-of-its-embedded-investing-platform-302540034.html ; https://www.atomicvest.com/
- [S12] Atomic Invest Form CRS (2026-08-06): https://reports.adviserinfo.sec.gov/crs/crs_313255.pdf
- [S13] Atomic Invest Form ADV Part 2A (2026-02-09): https://legal.atomicvest.com/usa.adv.15138320-a16d-4037-846f-f63ef451fcf5.pdf
- [S14] NerdWallet Automated Investing (Atomic): https://www.nerdwallet.com/lp/automated-investing
- [S15] Atomic Invest Investment Advisory Agreement (2025-02-19), Exhibit 1: https://legal.atomicvest.com/usa.ima.3FhWfWocRJbFt9qCd5vLON-MMdpqYo1z9OLuUV6uTCg=.pdf
- [S16] SEC IAPD API: Atomic Invest (CRD 313255, active) and DriveAdvisory, LLC (CRD 315146, INACTIVE), queried 2026-09-28: https://adviserinfo.sec.gov/firm/summary/313255 , https://adviserinfo.sec.gov/firm/summary/315146
- [S17] Apex Direct: https://apexfintechsolutions.com/products/wealth-management/apex-direct-brokerage-as-a-service-with-cloud-native-tech/
- [S18] Grifin, "What happened to Stockpile and Bumped": https://www.grifin.com/post/stockpile-bumped-alternatives ; MarketScreener, Bakkt/Bumped: https://www.marketscreener.com/quote/stock/BAKKT-HOLDINGS-INC-128408815/news/Bakkt-Holdings-Inc-acquired-Bumped-Financial-LLC-for-0-63-million-43229248/
- [S19] Treasury Prime 2025 review: https://www.treasuryprime.com/blog/treasury-primes-2025-year-in-review-rebuilding-trust-and-scale-in-embedded-banking
- [S20] SEC fact sheet, Internet Adviser reforms: https://www.sec.gov/files/ia-6578-fact-sheet.pdf ; press release: https://www.sec.gov/newsroom/press-releases/2024-42
- [S21] Goodwin, "The SEC Amends the Internet Adviser Exemption": https://www.goodwinlaw.com/en/insights/publications/2024/04/alerts-finance-pif-the-sec-amends-the-internet-adviser-exemption ; Beach Street Legal: https://beachstreetlegal.com/how-to-register-and-remain-registered-with-the-sec-as-an-internet-investment-adviser/
- [S22] SEC, Form ADV and IARD FAQ (45 days): https://www.sec.gov/about/divisions-offices/division-investment-management/electronic-filing-investment-advisers-iard/frequently-asked-questions-form-adv-iard
- [S23] SEC, multi-state adviser exemption release: https://www.sec.gov/rules-regulations/1998/07/exemption-investment-advisers-operating-multiple-states-revisions-rules-implementing-amendments ; COMPLY: https://www.comply.com/resource/ria-registration-with-the-sec-as-a-multi-state-investment-adviser/
- [S24] Atomic Invest legal documents page (Pershing Traditional IRA, 529): https://www.atomicvest.com/atomicinvest
- [S25] BrokerChooser, Alpaca fees (Broker API pricing is custom): https://brokerchooser.com/broker-reviews/alpaca-trading-review/alpaca-trading-fees
- [S26] Alpaca/Composer: https://alpaca.markets/blog/composer-partners-with-alpaca-broker-api/ ; dub App Store: https://apps.apple.com/us/app/dub-copy-trade-real-investors/id1598920501
- [S27] Atomic news (Groene Hart acquisition, Aspire): https://www.atomicvest.com/news/atomic-invest-acquires-groene-hart-financial-diensten-to-expand-across-europe ; Slash treasury disclosures: https://www.slash.com/legal/treasury-disclosures
- [S28] DriveWealth, Opening accounts: https://developer.drivewealth.com/apis/docs/opening-accounts
- [S29] DriveWealth, Embedded Investing: https://www.drivewealth.com/solutions/embedded-investing/
- [S30] OnePay Invest help: https://www.onepay.com/help-center/articles/about-onepay-invest ; DriveWealth/OnePay: https://www.drivewealth.com/2025/10/drivewealth-selected-by-onepay-to-power-embedded-investment-platform/
- [S31] DriveWealth, Fees, commissions and markups: https://developer.drivewealth.com/apis/docs/fees-commissions-and-markups
- [S32] DriveWealth, Trade commissions and subscription fees: https://developer.drivewealth.com/implementation/docs/trade-commissions-subscription-fees-and-regulatory-sectaf-fees
- [S33] Apex, Startups: https://apexfintechsolutions.com/who-we-serve/startups/
- [S34] Kitces, SEC and state promoter rules: https://www.kitces.com/blog/ria-compliance-sec-marketing-rule-solicitor-promoter-disclosure-registration-requirements-paid-referral/ ; NASAA: https://www.nasaa.org/industry-resources/investment-advisers/investment-adviser-guide/
- [S35] COMPLY, cost to start an RIA: https://www.comply.com/resource/how-much-does-it-cost-to-start-an-ria-firm/
- [S36] SEC, IARD filing fees: https://www.sec.gov/investment/electronic-filing-for-investment-advisers-on-iard-iard-filing-fees
- [S37] FinCompliance, 2026 state filing fees: https://fincompliance.io/resources/state-filing-fees
- [S38] RegFin, RIA compliance consultant costs (2026): https://regfin.com/blog/ria-compliance-consultant
- [S39] SmartAsset, RIA startup costs: https://smartasset.com/advisor-resources/ria-startup-costs
