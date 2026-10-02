# Blunts: Dinari, Fixed Baskets and a Sells-Only Fee

*Researched 2026-09-28. This builds on file 04 (Dinari vs Alpaca), so it doesn't repeat that setup. Items marked **[UNVERIFIED]** are inference or undisclosed; ask Dinari or counsel. This is not legal advice.*

---

## 0. TL;DR

1. **Dinari's US model has no room for a Blunts-chosen basket, and Blunts can't be the chooser.** Here's what the documents say:
   - Partners may not perform "recommendations" [S1].
   - Dinari Securities' Form CRS says it makes no recommendations, takes no discretion, and that "All securities trades are on a self-directed basis" [S3].
   - Its customer agreement says the account "is self-directed" [S4 §2.3].

   So a basket Blunts picks and rebalances has no home. Dinari won't make the recommendation, and Blunts isn't allowed to.

2. **One broad ETF is much easier than a 9-stock basket, but still not risk-free.** No FINRA or SEC guidance says whether "the app only offers one security" counts as a recommendation. Existing guidance points both ways (§1.4):
   - **Against it being one:** the test is a "call to action" plus individual tailoring, and generic marketing ordinarily isn't a recommendation [S7][S8].
   - **For it being one:** every user is pushed into one named security.
   - **Why the ETF wins anyway:** a fixed, never-rebalanced single ETF that the user affirmatively selects at signup is the most defensible version. It avoids investment-adviser status and the Rule 3a-4 "unregistered fund" problem that a managed basket creates. It also avoids 9 × NBBO pre-trade screens and 9 × $0.20 network fees.

3. **Alloys** are Dinari's basket / index-token product. The public API has `GET /api/v2/market_data/alloys/`, and orders accept `alloy_id` [S5][S6]. The only public description is Dinari's: "tokenized index products and model portfolios," built on the Alloy platform, with rebalancing, NAV and redemptions [S9][S10].
   - The flagship is the S&P Digital Markets 50 token, "issued independently by Dinari Inc." [S11]. Its 2025 launch release said dShares were "not currently available in the United States" [S12].
   - **Whether any Alloy is orderable by US retail through Dinari Securities is [UNVERIFIED]**, and so is whether a partner can create its own Alloy. alloy.dinari.com returned HTTP 503 on 2026-09-28. Treat Alloys as non-US until Dinari confirms in writing.

4. **Technically, a sells-only partner fee works.** The `fee` field exists on all four managed order endpoints, including Market Sell and Limit Sell. On sells, "the fee will be deducted from the proceeds." Dinari's docs say the field is used "when Dinari is collecting fees on your behalf, or you as a partner have chosen to be billed in arrears" [S2][S6]. That's close to an admission that Dinari remits collected fees to the partner.
   - The field is a **flat USD amount per order**, not a percentage. Blunts computes 1% × proceeds and passes the number.

5. **Legally, it's the weak point.** Dinari's customer agreement treats order fees as **Dinari Securities' commissions** [S4 §18].
   - If Dinari passes a per-sell 1% through to a non-registered Blunts, Blunts is taking transaction-based compensation. That is the classic hallmark of unregistered broker activity (Exchange Act §15(a)).
   - Under FINRA Rule 2040, Dinari must "reasonably support" that Blunts needn't register. It can do that by relying on SEC releases or no-action letters, or on an opinion of counsel [S13].
   - No public Dinari document explains how partners are compensated. Dinari's Form CRS doesn't mention partner payments; it only says "our affiliated, Dinari Inc., may receive a fee" [S3].

6. **The clean version of the founders' model (Q3):**
   - Dinari Securities charges the 1% sell commission as **its own** disclosed commission. It keeps it.
   - Dinari pays Blunts a **fixed, non-transaction-based fee**: a monthly platform or licensing fee, or a flat marketing or technology services fee.
   - Or Blunts gets its revenue from a different, registered source (an RIA fee).

   Anything that tracks sell volume one-to-one is revenue sharing in substance, whatever the contract calls it.

7. **No other US Dinari partner publishes its fee model.** Bitcoin.com (live 2026-09-15), Circle, Privy, Para, Monaco, Eldora, Kredete, Yield.xyz, Liminal and Axal have all disclosed nothing about fees [S14][S15][S16].

---

## 1. Would Dinari approve a pre-set basket?

### 1.1 What Dinari's documents say

| Source | Text (verbatim unless noted) | Implication for Blunts |
|---|---|---|
| US integration guide [S1] | Partners "act solely as introducing or referral platforms for purposes of onboarding and customer access. Partners are not authorized to perform or represent any broker-dealer activities, including but not limited to trade execution, recommendations, or supervisory reviews under FINRA Rule 3110." | Blunts can't recommend. |
| US guide [S1] | "Your product and UI must strictly adhere to the guidance in this document and is subject to approval by Dinari." All US-facing communications need Dinari Compliance pre-approval (FINRA 2210). | Dinari approves the product as a whole, not only the marketing. |
| US guide, required screens [S1] | Two required pages:<br>• **Asset Listing Page:** symbol, name, last price, change.<br>• **Asset Page:** eight required data fields.<br>Both pages carry a "Text and Links Policy": "Text and links outside of the Dinari API News endpoint is generally prohibited."<br>**Pre-trade confirmation:** NBBO (bid/ask/size/exchange/timestamp) **per symbol**, refreshed every 15 seconds; metered SIP quotes cost $0.0075 per query. | The UI is built around users choosing individual securities. Two consequences:<br>• A 9-stock "fill" would need 9 NBBO blocks on one confirmation screen.<br>• One ETF needs one. |
| Form CRS, Dinari Securities (July 2025) [S3] | "Dinari does not provide any recommendations or investment advice." "We do not accept discretionary authority." "All securities trades are on a self-directed basis." "We do not offer for sale or purchase proprietary products." | Dinari itself won't take Reg BI responsibility for a basket. It would have to change its business model and Form CRS. |
| Customer agreement (ToS, 2026-07-29) [S4] | §2.3: "Your Account is self-directed… all orders entered by you (or placed on your behalf) are based on your own investment decisions."<br>§24.3: "To the extent the Licensee Products or API Licensees express opinions or make recommendations… such opinions and recommendations are expressed solely by API Licensees." | §24.3 contemplates API licensees making recommendations. That would be a licensee that is itself an RIA or broker-dealer. It conflicts with the US guide's flat "no recommendations" rule for introducing partners. **Ask which governs if Blunts becomes an RIA.** |
| API [S5][S6] | No basket, model-portfolio, recurring or auto-invest endpoint appears in `llms.txt`. Orders take a `stock_id` **or** `alloy_id`. | A basket fill = N separate orders (one per stock), unless an Alloy is used. |

**Conclusion:** there's no public statement that Dinari approves partner baskets, and everything published points the other way. The realistic paths:
- **(a)** a single ETF that the user selects, or
- **(b)** Blunts becomes an RIA, and Dinari confirms in writing that an RIA partner may run a model on its rails. Dinari's business page does list "RIAs" and "Wealth platforms" as partner types [S9].

### 1.2 Alloys: what we can and can't confirm

- **Confirmed:**
  - The `Alloy` object: `id`, `name`, `symbol`, `is_tradable`. Endpoints: list, current price, price chart [S5].
  - Order requests (buy and sell) accept `alloy_id` [S6].
  - Marketing says Alloy is for creating and managing tokenized asset baskets. It lets issuers "launch tokenized index products and model portfolios," combining equities, ETFs, RWAs and crypto, with "automated rebalancing, NAV tracking, and redemptions" [S9][S10].
  - The SPDM token (S&P Digital Markets 50: 35 equities + 15 crypto; quarterly rebalance) "is issued independently by Dinari Inc." [S11].
- **Not confirmed [UNVERIFIED]:**
  - The legal form of an Alloy: a basket of dShares held in the user's account, or a separate pooled token? A pooled token would raise Investment Company Act questions.
  - Whether any Alloy is offered to US retail through Dinari Securities. The 2025 SPDM launch said dShares were "not currently available in the United States" [S12]. That predates the Aug 2026 US launch, and nothing since says Alloys came to the US.
  - Whether partners can define their own Alloy.
  - Alloy fees.
- **Why it matters:** an equity-only Alloy of NVDA/MSFT/AAPL… would give Blunts:
  - one order;
  - one network fee;
  - no per-leg rounding.

  But whoever defines and rebalances it is running a model portfolio. A pooled Alloy looks like an unregistered fund, and one held as per-user dShares looks like discretionary management (§1.3). Expect Dinari to say US Alloys are unavailable, or institutional-only.

### 1.3 Why a curated 9-stock basket is worse than one ETF

| Issue | 9-stock Blunts basket | Single broad ETF (QQQ/VOO/SPY) |
|---|---|---|
| Reg BI "recommendation" (by the broker-dealer) | Picking specific names and weights is closer to a "call to action" to buy "a particular security or group of securities" [S7][S8] | Still a named security, but broadly diversified and not tailored. It's the closest thing to a product feature. |
| Advisers Act §202(a)(11) (Blunts as adviser) | Choosing and changing a stock portfolio for users is advising "as to the advisability of investing in… securities." Very likely makes Blunts an **investment adviser** (file 04 §1.11) | If fixed forever and chosen by the user at signup, Blunts isn't advising or managing. Still, counsel should confirm. |
| Investment Company Act | Many users holding an identical, sponsor-managed basket fits the pattern Rule 3a-4 exists for. Without the safe harbor, the program can be deemed an unregistered investment company. Rule 3a-4 requires [S17]:<br>• individualized management;<br>• annual contact;<br>• client-imposed restrictions;<br>• quarterly statements;<br>• full shareholder rights. | Not an issue: each user simply owns one ETF. |
| Rebalancing | Needed (weights drift; NVDA/TSLA volatility). Rebalancing = discretion, which Dinari "do[es] not accept" [S3] | None. |
| Dinari UI rules | 9 NBBO blocks and 9 orders per fill | 1 of each |
| Cost on a $5 fill | 9 × $0.20 = $1.80 (36%), unless billed in arrears at cost [S2] | $0.20 (4%), or cost-in-arrears |
| Fractional precision | 9 legs × 6-decimal quantities; dust on sells | 1 leg |

**Availability:**
- Dinari lists 724 US stocks and ETFs "including the entire S&P 500" [S14].
- Third-party sources show **dSPY** and a **VOO** dShare [S18].
- **QQQ availability is [UNVERIFIED]:** check `GET /api/v2/market_data/stocks/` in the sandbox.

### 1.4 Is "one product, no choice" a recommendation?

**No FINRA or SEC rule, notice or FAQ found addresses an app that offers only one security. Treat this as an open question for counsel.** The relevant pieces:

- **Test:** "facts and circumstances." It asks whether the communication "reasonably could be viewed as a 'call to action'". Also, "the more individually tailored the communication to a specific customer or a targeted group of customers about a security or group of securities, the greater likelihood" it's a recommendation. Source: FINRA Notice 01-23 [S7], adopted by the SEC in Reg BI and its FAQ [S8].
- **Generally *not* recommendations:** FINRA's 2111 FAQ 1.1 says "a broker-dealer's use or distribution of marketing or offering materials ordinarily would not, by itself, constitute a 'recommendation'" [S19]. Notice 01-23 lists general, untailored tools and research as non-recommendations [S7].
- **Asset-allocation safe harbor (2111.03 / FAQ 4.7):** general asset-allocation guidance is not a recommendation "if the firm does not recommend a particular security" [S19].
  - Telling users "put your money in stocks for the long term" is fine. Telling them "put it in QQQ" names a security, so the safe harbor doesn't cover it.
- **Account-type recommendations are covered by Reg BI**, even for self-directed accounts [S8]. If Blunts or Dinari *recommends that users open a Blunts account* in the course of pitching it, that recommendation is subject to Reg BI. A single-product account makes the account recommendation and the security recommendation the same thing.
- **Material limitations:** a broker-dealer that offers a limited menu must disclose that limitation. This is the Reg BI Disclosure Obligation **[from memory of the Reg BI adopting release; verify cite]**.
- **Digital engagement:** the SEC's predictive-data-analytics / digital-engagement proposal was **withdrawn on 2025-06-12** [S20]. There's no live rule on nudges, but FINRA exam reports keep flagging gamified "calls to action" (confetti, etc.) [S21].

**Practical reading:**
- Marketing that says "Blunts invests every dollar in the Nasdaq-100 (QQQ)" is a *product description*. If it's untailored, disclosed and self-selected, it's probably not a recommendation, **[UNVERIFIED; counsel]**.
- It becomes riskier if Blunts:
  - tailors the pitch ("you're young, so QQQ is right for you");
  - uses push nudges to buy;
  - picks and changes the constituents over time.
- The lowest-risk design:
  - At signup, show a one-time choice between **at least two** broad ETFs (e.g., VOO or QQQ), with neutral descriptions and no default pre-selected.
  - Save it as the user's standing instruction ("every fill buys my chosen fund").
  - Allow switching later.

  That is clearly a self-directed choice. It costs one screen. **[Design recommendation; confirm Dinari will accept a user-set standing instruction, since the API has no recurring-order feature and Blunts would place each order at deposit time.]**

---

## 2. The partner `fee` parameter

### 2.1 What the documentation says [S2][S6]

- **Endpoints:** Market Buy, **Market Sell**, Limit Buy, **Limit Sell** managed order requests, plus the two EIP-155 (self-custody) permit endpoints.
- **Format:**
  - "String-encoded decimal, USD, up to 6 decimal places, non-negative."
  - **Default $0.20**. That equals the standard network fee, which suggests `fee` *is* the network-fee line and partners overwrite it.
- **Buys vs sells:**
  - Buys: `payment_amount` includes the fee. For sells, "the fee will be deducted from the proceeds of the sale" [S6].
- **Purpose, verbatim:** "The scenarios where this would be incorporated is when Dinari is collecting fees on your behalf, or you as a partner have chosen to be billed in arrears" [S2].
- **Billing in arrears:** Dinari bills network fees monthly "at cost." "This approach is best when partners charge their end users a transaction fee… When this option is chosen, partners are required to provide the fee they are charging as part of their market buy" [S2].
- **Scope ambiguity:** the API reference says the field applies "for DFN orders" [S6]. DFN is the Dinari Financial Network. It's unclear whether US Dinari Securities orders are "DFN orders." **[UNVERIFIED]**
- **Headline:** "Dinari does not collect transaction fees from our partners or their end users" [S2]. But Form CRS says Dinari Securities "charge[s] commissions for trades on a transaction basis that varies based on the notional valuation" [S3], and the customer agreement §18 says it "will charge listed fees or commissions for executing buy and sell orders" [S4].
  - Reconciliation: for US users, whatever lands in `fee` is legally a **Dinari Securities commission** on the confirmation. **[Inference; confirm]**

### 2.2 Can it be sells-only?

- **Technically, yes, it looks like it.** The field is set per order and exists on the sell endpoints, so Blunts can send:
  - `fee: "0"` on buys (with billing in arrears, so Dinari invoices network fees monthly); and
  - `fee: "<1% of expected proceeds>"` on sells.
- **Open issues:**
  1. The "must provide the fee… as part of their market buy" wording under billing in arrears. Does a $0 fee on buys satisfy it?
  2. Market sells are sized by `asset_quantity`, not dollars [S6], so 1% has to be estimated from the NBBO bid. The fee is fixed at submission while proceeds float, so the actual rate won't be exactly 1%.
  3. Minimum/maximum caps, and whether Dinari's compliance team caps percentage-equivalent fees. **[UNVERIFIED]**
  4. The sell fee must appear on the pre-trade confirmation and on the Rule 10b-10 confirmation, which Dinari issues.

### 2.3 Who receives it, and is it legal for Blunts to get it?

- **Who receives it:** "Dinari is collecting fees on your behalf" implies Dinari collects the fee and remits it to the partner, net of network costs. The mechanics (monthly settlement, netting against the $2k/mo minimum) are **[UNVERIFIED]**. None are public.
- **Law:**
  - **Exchange Act §15(a):** anyone "engaged in the business of effecting transactions in securities for the account of others" must register. The SEC staff treats **transaction-based compensation** as the principal hallmark of broker activity. A per-sell fee scaled to trade size is the textbook case.
    - The 2020 proposed "finders" exemption was never adopted. **[Status from memory; it wasn't in the June 2025 withdrawal list [S20], and it was an exemptive-order proposal, not a rule.]**
  - **FINRA Rule 2040(a):** a member may not pay "any compensation, fees, concessions, discounts, commissions or other allowances" to a person required to register who isn't registered. Supplementary .01 says Dinari must "reasonably support" that Blunts needn't register, relying on SEC releases or no-action letters, or on "independent, reputable U.S. licensed counsel." Dinari must document that analysis and review it periodically [S13].
- **Reading:** a Dinari-to-Blunts payment equal to 1% of each sell is hard to support. Blunts would be:
  - soliciting;
  - holding the customer relationship;
  - building the order screens;
  - paid per transaction.

  That is broker activity, and "introducing platform" is a broker-dealer term of art. **Unless Dinari shows Blunts its 2040 memo or opinion of counsel covering this exact structure, assume the per-order `fee` pass-through is not available to a non-registered US partner.** How Bitcoin.com and others are paid isn't public (§4).

### 2.4 Other documented Dinari-side charges Blunts would bear

| Charge | Amount | Source |
|---|---|---|
| API access | from $2,000/month | [S2] |
| Network fee | $0.20 per order flat, or actual cost billed monthly in arrears | [S2] |
| Real-time NBBO (SIP) | $0.0075 per query during regular hours; required on pre-trade confirmation; 15-second refresh | [S1] |
| USDT conversion | oracle rate + 3 bps (USDC avoids this) | [S2] |
| Managed KYC | "additional fees may apply" | file 04 |

With NBBO refreshing every 15 seconds, a user who sits on the confirm screen for 60 seconds costs 4 × $0.0075 = $0.03 per symbol. That's another reason to use one ETF.

---

## 3. Can Blunts get "its" sell commission through Dinari legally?

| Structure | How it works | Legal risk | Notes |
|---|---|---|---|
| **A. Pass-through `fee`** (1% per sell remitted to Blunts) | Dinari collects "on your behalf" and remits | **High** for a non-registered Blunts (§15(a) / 2040) | Only viable if Dinari's counsel signs off in writing, or Blunts registers as a broker-dealer |
| **B. Dinari's own commission + flat fee to Blunts** | Dinari Securities sets a 1%-on-sells commission for Blunts-channel accounts; its ToS allows varying "rates and fees among customers in connection with special… arrangements" [S4 §18]. Dinari keeps it and pays Blunts a **fixed** monthly platform, licensing or marketing fee that doesn't vary with trades or accounts | **Low–medium.** This is the standard 2040-compliant pattern. Risk rises if the "fixed" fee is renegotiated monthly to track volume | Blunts's upside is capped by the contract, not volume. The fee could be tiered annually by total users (not trades), but counsel should vet any metric |
| **C. Per-funded-account bounty** | Flat $X per new funded account | **Medium.** Per-account referral fees have mixed SEC staff treatment; less risky than per-trade | Common in fintech referral deals **[UNVERIFIED as applied here]** |
| **D. Blunts as RIA; advisory fee** | Blunts registers (internet-adviser exemption, Rule 203A-2(e)) and charges a disclosed advisory fee | **Medium.** A fee charged *per sell* still looks transaction-based even for an RIA. An asset-based fee (e.g., 0.5–1%/yr) or a flat fee is cleaner | Also solves the "who picks the basket" problem. Dinari must confirm RIA partners can bill advisory fees on its rails (no fee-billing API found) |
| **E. Blunts becomes (or buys) a broker-dealer** | Blunts's own broker-dealer charges the commission; Dinari clears/tokenizes | Legally clean for commissions | $$$, 6–12+ months (FINRA Form BD / NMA), net capital, principals. Dinari's partner page lists "Broker-dealers" [S9] |
| **F. Don't take a sells fee at all** | Subscription billed from the account (file 04 §B), or float/interest on uninvested USDC (check USD+/yield rules) | Low | Changes the pitch ("free to fill, free to spark, $3/mo") |

**Recommendation:** propose **B** to Dinari. Dinari Securities charges its own disclosed 1% commission on sells and $0 on buys. Blunts gets a fixed platform fee, plus Dinari waives or discounts the $2k/month minimum. Keep **D** (RIA) as the fallback if Blunts insists on its own curated basket. **Don't build around A** unless Dinari puts in writing that it has a Rule 2040 basis for it.

**Disclosure hygiene for any version** (from file 04 §A, still applicable):
- Charge the fee on the sell, not on the cash-out (FINRA 2122 "exit fee" risk).
- Never compute it on gains (Advisers Act §205).
- Show it on the pre-trade screen.
- Make the "you'll get $X" number match the Rule 10b-10 confirmation.

---

## 4. Other US Dinari partners and their fee models

| Partner | Status | Fee model |
|---|---|---|
| **Bitcoin.com Wallet** | Live for US users 2026-09-15; first deployment of Dinari's Embedded Trading App; 724 assets [S15][S16] | **Not disclosed** in the Dinari blog, the Bitcoin.com News release or the May 2026 partnership release |
| Circle | USDC funding/settlement partner (Aug 4, 2026) [S14][S22] | n/a (stablecoin rail) |
| Privy (Stripe), Para | Embedded-wallet infrastructure [S14] | n/a |
| Monaco, Kredete, Yield.xyz, Liminal, Axal, Eldora | Named launch partners [S14] | **Not disclosed.** No per-partner US fee info found. Eldora is live in Southeast Asia |
| Sei | Chain integration announced 2026-09-25/26, "planned" [S23] | n/a |
| Dinari's own app (app.dinari.com) | Retail app | Form CRS: commissions "on a transaction basis that varies based on the notional valuation" [S3]. The fee schedule isn't public (its URL returned 404) |

**Takeaway:** no public precedent shows a US Dinari partner earning a per-trade fee. The one data point is Dinari's pricing page, which markets "None" for commissions and transaction fees versus traditional brokers [S24]. That suggests Dinari's default posture is zero-commission, with partner revenue arranged privately.

---

## 5. Recommendations

1. **Product:** replace the 9-stock basket with **one broad ETF that the user picks from two or three at signup** (VOO/SPY and QQQ if available). No rebalancing, no constituent changes, no tailored nudges.
   - Marketing can still say "the biggest tech companies" *descriptively* if it's QQQ. Dinari Compliance must pre-approve all copy [S1].
2. **Revenue:** pitch Dinari on **Structure B**:
   - Dinari Securities charges a disclosed 1% commission on sells only.
   - Blunts gets a fixed platform fee.
   - Network fees are billed in arrears at cost.
   - Get the Rule 2040 position **in writing** before building fee UX.
3. **If the founders insist on the 9-name basket:** that decision means **Blunts is an RIA**, and Alpaca (built for RIA models) is the better rail. Dinari becomes a later, crypto-native SKU (consistent with file 04 §5).
4. **Don't depend on Alloys** until Dinari confirms, in writing, that a named Alloy is available to US retail, what it legally is, and who manages it.
5. **Budget** for NBBO metering and cost-based network fees in unit economics. Assume $0.20 per order until Dinari quotes an at-cost figure.

---

## 6. Exact questions for Dinari (partner-support@dinari.com / hello@dinari.com)

**Baskets and recommendations**
1. Will Dinari Securities approve a partner UI where every deposit automatically buys **one ETF chosen by the user at signup** (standing instruction; the partner places each order)? Is a pre-selected default allowed, or must the user actively choose?
2. Would Dinari approve a **partner-defined multi-stock basket** (fixed weights, partner places N orders per deposit)? If so, does Dinari Securities treat it as its own Reg BI recommendation, or does the partner need to be an RIA?
3. Customer agreement §24.3 contemplates API licensees making recommendations. Can an **SEC-registered RIA** partner run a model portfolio on Dinari US rails? Can it deduct an advisory fee from the account, and via which endpoint?
4. **Alloys:**
   - What exactly is an Alloy legally: a basket of dShares in the user's account, or a separate pooled token?
   - Who issues and rebalances it?
   - Is any Alloy available to **US retail** through Dinari Securities? Can a partner define its own?
   - Fees and minimums? Is alloy.dinari.com live?
5. Is **QQQ** available as a US dShare? VOO? SPY? Please send the `stock_id`s.
6. Do the required Asset Listing Page and Asset Page rules apply if the app offers only one or two ETFs? Can a single-ETF app skip the listing page?

**Fees**
7. Does the `fee` field ("for DFN orders") apply to **US Dinari Securities orders**? On the customer's Rule 10b-10 confirmation, is it a **Dinari Securities commission**?
8. Can we send `fee = 0` on buys and `fee > 0` on **sells only**, under billing in arrears? Does "partners are required to provide the fee… as part of their market buy" forbid that?
9. On sells, the fee is deducted from proceeds. Is there a cap (in dollars or as a percentage of proceeds)? What happens if the fee exceeds proceeds on a tiny sell?
10. "Dinari is collecting fees on your behalf": **is any part of the `fee` remitted to the partner?** How and when, and net of what?
11. For a **non-registered** US partner, what is Dinari Securities' **FINRA Rule 2040** basis for paying it transaction-based compensation? Will you share the counsel analysis, or represent it in the partner agreement?
12. If a pass-through isn't allowed: will Dinari Securities set a **1%-sells-only commission schedule** for our users and pay us a **fixed** platform or marketing fee? Can you discount the $2k/month API minimum in exchange?
13. Billing in arrears: what is the **actual at-cost network fee** per order on Base or Arbitrum today? Can orders be batched?
14. NBBO metering: is $0.0075 per SIP query the full cost? Can a single-ETF confirm screen use streaming instead of polling?
15. How do Bitcoin.com and other US partners monetize (in general terms)? Is there a standard US partner revenue-share schedule?

---

## Sources

- [S1] Dinari US integration guide: https://docs.dinari.com/docs/us (raw: https://docs.dinari.com/docs/us.md)
- [S2] Dinari Partner Fees (updated 2026-08-27): https://docs.dinari.com/docs/fees
- [S3] Dinari Securities Form CRS (July 2025): https://files.brokercheck.finra.org/crs_329672.pdf
- [S4] Dinari Securities customer agreement / ToS (2026-07-29): https://assets.dinari.com/bd/docs/dinari-securities-tos-ca-20260729.pdf (redirect from https://dinari.com/bd/terms). §2.3–2.4, §18, §24.3
- [S5] Get Alloys API: https://docs.dinari.com/reference/getalloys ; price: https://docs.dinari.com/reference/getalloycurrentprice ; index: https://docs.dinari.com/llms.txt
- [S6] Market Sell managed order request: https://docs.dinari.com/reference/createmarketsellmanagedorderrequest ; Market Buy: https://docs.dinari.com/reference/createmarketbuymanagedorderrequest
- [S7] FINRA Notice to Members 01-23 (online recommendations): https://www.finra.org/rules-guidance/notices/01-23
- [S8] SEC staff FAQ on Reg BI: https://www.sec.gov/rules-regulations/staff-guidance/trading-markets-frequently-asked-questions/faq-regulation-best
- [S9] Dinari business / work-with-Dinari: https://dinari.com/business , https://dinari.com/work-with-dinari
- [S10] Alloy app (HTTP 503 on 2026-09-28; description from search snippet): https://alloy.dinari.com/
- [S11] SPDM page: https://dinari.com/spdm
- [S12] S&P DJI and Dinari SPDM launch (Oct 2025): https://dinari.com/blog/s-p-dow-jones-indices-and-dinari-launch-s-p-digital-markets-50-as-official-index-for-top-crypto-tokens-and-u-s-equities
- [S13] FINRA Rule 2040: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2040
- [S14] Dinari US launch (Aug 4, 2026): https://www.prnewswire.com/news-releases/in-an-industry-first-dinari-launches-724-tokenized-stocks-available-to-both-us-investors-and-businesses-302842099.html ; CoinDesk: https://www.coindesk.com/business/2026/08/04/dinari-brings-tokenized-u-s-stocks-to-american-investors-as-equity-race-heats-up
- [S15] Dinari blog, Bitcoin.com US launch: https://dinari.com/blog/dinari-powers-bitcoin-coms-u-s-launch-of-tokenized-equities
- [S16] Bitcoin.com News: https://news.bitcoin.com/branded-spotlight/dinari-powers-bitcoin-coms-u-s-launch-of-tokenized-equities/ ; May 2026 partnership: https://www.globenewswire.com/news-release/2026/05/14/3294754/0/en/Bitcoin-com-Partners-with-Dinari-to-Bring-Tokenized-U-S-Equities-to-a-Global-Audience.html
- [S17] Investment Company Act Rule 3a-4: https://www.law.cornell.edu/cfr/text/17/270.3a-4
- [S18] VOO Dinari tokenized ETF (third-party): https://www.fool.com/quote/crypto/voo/ ; dSPY (third-party): https://eco.com/support/en/articles/15254023-tokenized-equities-2026-backed-dinari-robinhood
- [S19] FINRA Rule 2111 suitability FAQ: https://www.finra.org/rules-guidance/key-topics/suitability/faq
- [S20] SEC withdrawal of 14 proposals (June 12, 2025), including predictive data analytics: https://www.sec.gov/files/rules/final/2025/33-11377.pdf
- [S21] FINRA 2026 Annual Regulatory Oversight Report: https://www.finra.org/sites/default/files/2025-12/2026-annual-regulatory-oversight-report.pdf ; SEC DEP RFI (2021): https://www.federalregister.gov/documents/2021/09/01/2021-18901/request-for-information-and-comments-on-broker-dealer-and-investment-adviser-digital-engagement
- [S22] Fortune, Dinari + Circle: https://fortune.com/2026/08/04/dinari-stripe-apple-alums-partnership-circle-tokenized-stocks-us-investors/
- [S23] Crypto Times, Dinari to Sei (2026-09-26): https://www.cryptotimes.io/2026/09/26/dinari-plans-to-bring-tokenized-sp-500-shares-to-sei/
- [S24] Dinari business pricing page: https://dinari.com/business/pricing
- Background (not fee-relevant): Dinari letter to the SEC Crypto Task Force (Apr 2, 2026) on blockchain secondary records: https://www.sec.gov/files/ctf-written-input-dinari-inc-040226.pdf
