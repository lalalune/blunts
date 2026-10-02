# 12: The "10–20% of profit" spark fee, and what we're still missing before launch

*Written 2026-09-28. This is a skeptical review. It builds on files 03, 04, 06, 07, 08 and 09 and doesn't repeat them. Anything marked **[UNVERIFIED]** is inference, secondary sourcing or memory. None of this is legal advice, and every conclusion here needs a securities-counsel opinion.*

---

## TL;DR

**Profit fee verdict: not in this structure, not for US retail, at any percentage.** Under the Dinari introducing-partner model, a fee on users' realized gains has no legal path to Blunts:

- **If Blunts gives advice, the fee is a banned performance fee.** Picking QQQ for everyone and taking a share of its gains is the textbook pattern that makes someone an investment adviser. That puts it inside §205.
- **If Blunts gives no advice, the fee is broker pay.** Money paid to Blunts for a sale is transaction-based compensation, which means unregistered broker activity under §15(a). Dinari couldn't pay it to Blunts under FINRA 2040.
- **Dinari could in theory charge a gains-linked commission itself**, since a no-advice broker-dealer isn't covered by §205. But Blunts couldn't get a share of it, and no broker-dealer is known to have done this.

Performance fees are legal only for "qualified clients", meaning at least **$1.4M** invested with the adviser or **>$2.7M** net worth since 2026-06-29 [1][2]. Non-US clients are a separate case (§205(b)(5)), but they need a separate licensed product.

**Least-bad way to keep "we only earn when you earn":**

1. **Blunts registers as an RIA and charges a small asset-based fee.** §205(b)(1) expressly allows this. Blunts earns more when balances grow and less when they fall.
2. **Or, staying a Dinari partner, Blunts takes a fixed platform fee from Dinari.** Dinari charges users a flat, disclosed sell commission that isn't tied to gains.
3. **Every "only when you're in profit" trigger is high-risk.** That includes a flat % charged only when the account is up, and an AUM fee waived while underwater.

**The economics also fail.** Free fills cost Dinari's $0.20 each. A weekly $20 filler needs roughly $100/yr of realized gains at a 10% share just to cover order fees. In a year like 2022 (QQQ was down about 33%), revenue is close to zero.

**The biggest launch blockers the plan doesn't yet cover:**

- Dinari's **required words and screens** conflict with the wordless, auto-buy design. Examples: a verbatim "I agree" button, and a real-time NBBO **pre-trade confirmation** before every order.
- **Apple 3.2.1(viii) and 3.1.5(iv).** Apple wants investing and "crypto-securities" apps submitted by the licensed institution, and Blunts isn't one.
- Whether a **Blunts server auto-placing orders** counts as "trade execution", which Dinari prohibits for partners.
- **Plaid moves no money.** The bank fallback needs an actual on-ramp.
- **Tax lots and 1099-B** are unconfirmed. They are also the basis for computing any "profit".

---

## Part 1: Is a % of realized gains, collected at spark, legal for Blunts?

### 1.0 Three facts that decide it

1. **The adviser definition, §202(a)(11)** [3]. An adviser is anyone who "for compensation, engages in the business of advising others … as to the advisability of investing in, purchasing, or selling securities."
   - The broker-dealer exclusion (C) applies only if the advice is "solely incidental" to brokerage **and** the broker-dealer "receives no special compensation therefor" [3].
   - The SEC says a broker-dealer receives special compensation "where there is a clearly definable charge for investment advice" [4, fn. at p.~30].
   - The publisher exclusion (D) covers bona fide publications "of general and regular circulation." An app that executes trades isn't one.
2. **The performance-fee ban, §205(a)(1)** [5]. It covers "any investment adviser registered or required to be registered with the Commission." It bans compensation "on the basis of a share of capital gains upon or capital appreciation of the funds."
   - Asset-based fees are carved out: §205(b)(1) allows a fee "based upon the total value of a fund averaged over a definite period, or as of definite dates."
   - Non-US residents are exempt: §205(b)(5).
   - State-registered advisers fall under state rules instead, and **those mirror the federal qualified-client test** (NASAA model rule; states cross-reference Rule 205-3) [6].
3. **Rule 205-3 qualified client, as of 2026-06-29** [1][2]:
   - ≥ **$1.4M** under management with the adviser; **or**
   - > **$2.7M** net worth, excluding the primary residence; **or**
   - qualified purchaser status.

   None of Blunts' target users qualify.

### 1.1 (a) Does choosing QQQ for users make Blunts an adviser, and so trigger §205?

**Probably yes once the fee is added. Without the fee, it's arguable.**

- **Without a fee:** file 06 §1.4 concluded that "one product, described neutrally, self-selected" might not be a recommendation. That argument works best when Blunts receives **no compensation tied to the security's performance**.
- **With the fee, all three prongs of §202(a)(11) are met:**
  - **Advice about securities.** Blunts decided, for every user, that their money goes into QQQ. It also decides the "keep stacking" nudges and gamified "hold" prompts. The SEC reads "advice" broadly, including "the advisability of investing in … securities" in general (IA Rel. 1092, cited in [4]).
  - **In the business.** Blunts holds itself out and is paid for it.
  - **For compensation.** A share of the gains is literally payment for the investment result Blunts chose.
- **The "no recommendations" clause doesn't help.** Dinari forbids partners from making recommendations [7]. A Blunts that picks the fund *and* is paid on its gains is either breaking that clause (a Reg BI recommendation by Dinari's channel) or acting as an adviser. Neither helps.
- **If Blunts is an adviser:**
  - Below $100M AUM with an online-only business, Blunts would register with the SEC under the internet-adviser exemption (file 04 §1.11). **§205 then applies directly.**
  - If it instead registers with the states, the state rules mirror §205 [6].
  - An unregistered adviser that is "required to be registered" is still caught by §205(a) on its own terms [5].
- **Conclusion:** Blunts can't avoid §205 by staying unregistered. Charging a profit share is the fact most likely to make a regulator call Blunts an adviser in the first place.

### 1.2 (b) If Blunts is not an adviser, the fee is transaction-based compensation, which requires broker-dealer registration

- **What it is:** a fee paid to Blunts that is triggered by a sell (spark) and scales with the proceeds. It's the textbook sign of being "engaged in the business of effecting transactions in securities for the account of others" under Exchange Act §15(a). File 04 §A.1 has the SEC guidance and case law [F1–F5].
- **Tying it to gains makes it worse, not better.** The fee depends on both the size and the result of the transaction.
- **FINRA 2040:**
  - Dinari (a FINRA member) may not pay "any compensation, fees … or other allowances" to a person who would have to register because of those payments, unless it has a documented reasonable basis, such as an opinion of counsel, for concluding otherwise [8].
  - Dinari is unlikely to write that opinion for a gains-based per-sale payment. File 06 §2.3 reached the same conclusion for a plain 1% fee.
- **Collecting it from the user's wallet directly doesn't help.**
  - One idea is for Blunts' app to have the user sign a USDC transfer of "10% of your profit" to Blunts after each sell.
  - That is still pay for a securities transaction, with the added problems that:
    - it's outside the broker-dealer's books, so it won't appear on the Rule 10b-10 confirmation; and
    - it's arguably an undisclosed markup.
  - Dinari's "all fees shown on pre-trade confirmation" regime and the no-caching rules [7] make this detectable in audits.

### 1.3 (c) Could Dinari charge a gains-based commission and share it with Blunts?

| Piece | Analysis |
|---|---|
| Can Dinari Securities charge a commission computed on the user's realized gain? | **Not categorically illegal, but untested [UNVERIFIED].** §205 binds only advisers. A broker-dealer that gives **no** advice isn't an adviser, so §205 doesn't apply to it. If Dinari's channel *does* make a recommendation (a single-fund app under Reg BI), a charge that only makes sense as payment for the investment result looks like "special compensation." That loses the broker-dealer exclusion [3][4] and brings §205 back in. |
| FINRA 2121 (fair commissions) | A 10–20% "commission" on gains can be a very large share of proceeds for a big winner. Take a $1,000 sale with $600 of gain at 20%: that's $120, or 12% of the trade. **That's well above the 5% markup guideline**, which examiners use as a reference point [file 04 F8–F9]. |
| Operations | Dinari would need per-lot cost basis for every Blunts user and would have to compute the fee on each sell. Its public docs don't mention 1099-B or a cost-basis method [9]. No such commission type is known to exist. |
| Sharing it with Blunts | **No.** A share of a transaction-based commission is exactly what FINRA 2040 prohibits paying to an unregistered person [8]. Blunts can take a **fixed** platform or licensing fee that doesn't vary with trades (file 06 §3, structure B). But then Blunts doesn't "earn when you earn." |
| Would Dinari do it? | Very unlikely. It is novel, carries enforcement risk, and gives Dinari little upside. **Ask them anyway (question in §1.7).** |

### 1.4 Is there any compliant way to charge US retail a share of profits?

| Route | Status | Why it doesn't fit |
|---|---|---|
| Qualified clients (Rule 205-3) | Legal | $1.4M AUM or $2.7M net worth [1] |
| Fulcrum fee (§205(b)(2)): symmetric around an index | Legal only for registered investment companies, or accounts of more than $1M | You'd need to launch a '40 Act fund. A fulcrum fee also *pays users back* when they underperform the index, and QQQ *is* the index, so the math is empty. |
| BDCs / 3(c)(7) funds (§205(b)(3)–(4)) | Legal | These are for accredited investors or qualified purchasers, not retail |
| State-only adviser | No | States mirror the qualified-client test [6] |
| Broker-dealer gains-based commission (Blunts registers as a broker-dealer) | Theoretically possible *if no advice* (§1.3) | 6–12+ months and $$$ to register a broker-dealer. Novel under 2121. The single-product design invites the "recommendation / special compensation" argument. **[UNVERIFIED; no precedent found]** |
| "Tip" or "donation" requested at spark when the user is in profit | No | Substance over form. It's still transaction-linked pay (§15(a)). If defaulted on, FTC/state dark-pattern (UDAP) risk too. |

**Bottom line: no retail-scale US route exists** in which an unregistered app earns a percentage of its users' gains.

### 1.5 Users outside the US

- **§205(b)(5):** the ban doesn't apply to advisory contracts with non-US residents [5]. So a US-registered adviser *can* charge non-US clients a performance fee under US law.
- **But local law governs the client:**
  - EU MiFID II and the UK FCA regime allow performance fees for licensed portfolio managers, with disclosure and suitability requirements. **[UNVERIFIED as applied; needs local counsel per country]**
  - Blunts would need a local license, or would need to rely on Dinari's non-US (DFN) partner model, where the `fee` field is "Dinari collecting fees on your behalf" (file 06 §2.1).
- **§15(a) exposure doesn't disappear.** A US-based Blunts effecting transactions for foreign customers still uses US jurisdictional means. **[UNVERIFIED; counsel]**
- File 03 §3 already warns against using an offshore entity to serve Americans.
- **Practical reading:** a profit fee *might* work later for a separate non-US brand, jurisdiction by jurisdiction. It can't be the US model.

### 1.6 Least-bad structures that keep "we only earn when you earn"

**How to read the table.** Risk is legal risk under the Dinari model, before counsel. "Blunts receives" means what flows to Blunts.

| # | Structure | Who charges / receives | Legal risk | Notes |
|---|---|---|---|---|
| **1** | **RIA + small asset-based fee** (e.g., 0.25–0.50%/yr, billed quarterly). Free under a balance floor (e.g., < $250). | Blunts as an SEC internet adviser; fee deducted per the advisory agreement | **Low** | §205(b)(1) expressly allows it [5]. **This is the only legal form of "we grow when your stash grows."** A 20% QQQ drop cuts Blunts' fee by 20%. Also fixes the "who picked QQQ" problem. Requires registration (Form ADV, CCO, compliance program, custody analysis for fee deduction). File 07 covers the costs. Dinari must confirm it supports advisory-fee debits (no API found; file 06). |
| **2** | **Dinari charges a flat sell commission** (e.g., 0.75–1% of the sell, not of gains). **Blunts gets a fixed platform fee** from Dinari. | Dinari Securities charges; Blunts gets a fixed amount | **Low–medium** | The standard FINRA 2040 pattern (file 06 §3-B). **Blunts no longer "earns when you earn"; it earns a fixed amount.** Marketing can truthfully say "no fee to fill, no fee on your deposits." |
| **3** | **Flat subscription**, waived below a balance threshold | Blunts (if RIA), or a non-securities "membership" **[risky if unregistered]** | Low (RIA) / Medium (unregistered) | Not aligned with gains. Regressive on small balances (file 08 §3). |
| **4** | **Flat % of the withdrawal, charged only when the account is in profit** (the founders' variant) | Blunts or Dinari | **High** | Conditioning the fee on appreciation is compensation "on the basis of" capital appreciation, so it's covered if Blunts is an adviser. If Blunts isn't, it's transaction-based (§1.2). It's also a withdrawal fee, which FINRA 2122 treats as an "exit fee" (the *Fortrend* case, file 04 §A.2). **Cliff problem:** an account up $1 on $1,000 that withdraws $1,000 at a flat 1% pays $10, which is **10× the profit**. At a 10% flat rate the fee is $100. Capping the fee at the gain turns it back into a share of gains. **Don't ship.** |
| **5** | **AUM fee waived while underwater** (value < net deposits) | Blunts as an RIA | **Medium–high** | Better than #4 because the *amount* is asset-based. But the *trigger* is performance. The SEC staff position on performance-contingent waivers is **[UNVERIFIED; no guidance found]**. Needs a written counsel opinion, and possibly a staff consultation. |
| **6** | **Fee waived in the first N months or under $X deposited** (not linked to performance) | Blunts as an RIA | Low | A fine promo. It isn't "only when you earn," but it gives much the same UX. |
| **7** | **Qualified-client "big blunt" tier** with a real 10% carry for users with ≥ $1.4M invested | Blunts as an RIA | Low | Legal, and irrelevant to this user base. |

**Recommended framing if the founders insist on the message.** Use #1 and say something like: "Our fee is a small slice of your balance. When your stash grows, we grow. When it shrinks, we shrink." That is true, legal (§205(b)(1)), and pre-approvable. It still needs FINRA 2210 approval from Dinari, or review under the SEC Marketing Rule 206(4)-1 if Blunts is an RIA. **Never say "we only make money when you make money"**: under #1 Blunts earns on flat and slightly-down balances too.

### 1.7 Economics check: even if it were legal, would a 10% profit fee pay?

**Inputs:**
- Dinari charges $0.20 per order, or actual gas billed in arrears (file 06 §2.4). Omnibus batching is prohibited [7].
- API access costs $2,000/month.

**Revenue:** assume QQQ averages about 12%/yr **[assumption]**. A user filling $20/week holds an average of about $520 in year 1, which gains about $60. Only the part they actually spark is realized. If they spark half, that's about $30 of realized gain, so the fee is **$3 at 10%** or **$6 at 20%**.

**Costs:** 52 buys plus a few sells is about **$11/yr in order fees** at $0.20. Real-time NBBO queries at $0.0075 each and gas sponsorship come on top.

**Break-even on the $2k/month minimum alone:**
- At 10%, Blunts needs **$240k/yr of realized user gains**.
- At a 12% return that roughly means **$2M+ of positions sold at a profit each year**, before any per-order costs.

**Down years:** in 2022 QQQ fell about 33% **[from memory; verify]**, and revenue would be close to zero. A profit share on a one-ETF app earns the most in bull markets, which is exactly when users hold and don't spark.

**Accounting complexity the founders haven't specced:**
- **What counts as "profit" on a partial spark** (FIFO, pro-rata or average cost)? It has to match the 1099-B basis, or users will see two different "profits."
- **High-water mark:** Blunts must not charge twice on the same gain after a drawdown.
- **Fills and sparks close together:** they create wash sales, which the fee logic has to handle.

**Questions to add for Dinari** (on top of file 06 §6):
- (a) Would Dinari Securities ever charge a commission computed on realized gain? If so, does it have a 2121 analysis?
- (b) Does Dinari issue a 1099-B with cost basis for US users, and by which method?
- (c) Can an RIA partner deduct an asset-based advisory fee from a dShares account?

---

## Part 2: What we're missing, ranked by launch severity

**Legend:**
- **P0:** we can't launch without it. It's a legal, partner or app-store gate.
- **P1:** we can launch, but we'll get hurt quickly (money loss, regulator, churn).
- **P2:** needed soon after launch.

"Covered in" points to earlier files. Blank means new.

### P0: launch-blocking

| # | Item | Why it blocks | Action | Covered in |
|---|---|---|---|---|
| 1 | **Dinari's mandatory screens vs. the wordless design** | Dinari's US guide requires **verbatim text**, and "UI adherence… subject to approval by Dinari" [7]. It requires:<br>• "Access brokerage services in the US with Dinari Securities LLC", plus the "member FINRA/SIPC" legend<br>• **six specific T&C checkboxes**, including the Alpaca arbitration clause, with a button that reads **"I agree"**<br>• a non-professional attestation<br>• a trusted-contact prompt<br>• a disclosures screen audited quarterly | Design a "paperwork mode": one scrollable, plain-language onboarding step that is allowed to have words. Keep the wordless UI for fill and spark only. Send the screens to Dinari Compliance early. | 04 (partly) |
| 2 | **Pre-trade confirmation with real-time NBBO vs. "fill = auto-buy"** | The confirmation is required "SEC Regulation" with symbol, bid/ask, sizes, exchanges and timestamp, refreshed every 15 seconds [7]. Compare Reg NMS Rule 603(c), the vendor display rule [10]. **An auto-buy on deposit has no confirmation screen.** | Either (a) the user confirms every buy (one tap after the USDC lands, with a quote card), or (b) get Dinari to confirm in writing that a **standing instruction** (recurring-investment style) is compliant without per-order NBBO display. Ask directly. | 06 §2.2 (partly) |
| 3 | **Who places the order?** A Blunts server signer auto-buying from the user's Privy wallet | Dinari forbids partners from doing "trade execution" [7]. If Blunts' backend decides when and how much to buy, that looks like execution or discretion. With delegated signing it may also be "total independent control" over user funds, which is the FinCEN money-transmitter test [11]. Google Play also exempts only **non-custodial** wallets [12]. | Keep every order user-initiated and user-signed. Scope any session signer by policy (only Dinari order contracts, only the user's own funds, revocable). Get written sign-off from Dinari and a money-transmission opinion from counsel. | 05, 09 (raised) |
| 4 | **Apple 3.2.1(viii) and 3.1.5(iv)** | Apple: investing apps "should be submitted by the financial institution performing such services." "Crypto-securities or quasi-securities trading must come from established banks, securities firms…" [13]. Blunts is neither. 5.1.1(ix) says the same for "highly regulated fields" [13]. | Get a letter from Dinari authorizing Blunts as its introducing platform, and license references for App Review. Enroll as an organization. Expect rejection loops. **Whether Apple accepts partner apps with a letter is [UNVERIFIED]; it's common practice for broker-dealer API apps, but confirm.** | 03 §7.1, 04 §B (fees only) |
| 5 | **Apple 1.4.3 and drug references in the brand** | "Apps that encourage consumption of … illegal drugs … are not permitted" [13]. Weed-flake animations aimed at a young audience are a judgment-call risk. The age rating will be **18+** ("drug use or references") under Apple's revised age-rating tiers **[from memory; verify in App Store Connect]**. | Keep references to wordplay. No depictions of smoking or rolling. Answer the age questionnaire truthfully (18+ matches the account minimum). Prepare an App Review note. | 03 §7 |
| 6 | **Plaid fallback moves no money** | Plaid only links and verifies bank accounts. Dinari's US funding is USDC-only; its "pre-funded via ACH" option is undocumented, and the other route is a licensed money-services business [7]. Blunts itself can't receive user USD (money transmission). | Pick a real ACH→USDC on-ramp partner that settles into the user's own wallet (file 01 options), or drop the fallback for v1. Account for ACH returns (R01/R10) and the on-ramp's hold periods. | 01, 09 (partly) |
| 7 | **Profit-fee model** | See Part 1. Launching with it risks unregistered adviser or broker charges. | Choose structure #1 or #2 (§1.6) before building fee screens. | new |
| 8 | **Dinari partner agreement, KYB and $2k/month** | Required: signed supplemental partner agreement, KYB, a named compliance contact and a technical contact [7]. | Start now; this is the critical path. | 04, 06 |
| 9 | **Security attestation** | "SOC 2 Type II, ISO 27001, or equivalent" **or** an annual attestation to Dinari's questionnaire. Also: AES-256 at rest, TLS 1.2+, an annual pen test, 24-hour incident reporting, and producing data extracts within 2 business days [7]. | Launch on the questionnaire. Start the SOC 2 Type II observation window now (6–12 months). Book a pen test before launch. **Downgraded from "blocker" because the questionnaire is accepted.** | 09 (raised) |
| 10 | **KYC data collection and OFAC** | The partner collects every field: SSN, employment, investible assets, ID image, immigration status and funding source. It also runs **OFAC screening every 30 days** and screens **all inbound wallet funding sources** [7]. | Integrate a sanctions screen plus a blockchain analytics screen (e.g., Chainalysis/TRM-type) on the funding address. Only one Cash App deposit address per user is expected, so flag anything else. | 03 §6 (general) |
| 11 | **Minimum age by state** | Most states: 18. **Alabama and Nebraska: 19. Mississippi: 21** (age of majority / contract capacity) **[secondary source; verify with Dinari's CIP]** [14]. Dinari's guide doesn't state a minimum [7]. | Gate by date of birth and state at signup. Don't market to under-18s (brand plus Apple 5.1.4). | new |
| 12 | **NY exclusion handling** | Cash App stablecoins exclude NY (file 09). Dinari is registered in NY. | Screen the KYC address. Show a NY waitlist state. Handle users who **move** to NY: withdrawals must still work. | 09 |
| 13 | **Privacy policy, terms and GLBA / Reg S-P** | Blunts handles nonpublic personal information for a broker-dealer. Amended Reg S-P (smaller entities' compliance date: **2026-06-03**) requires service-provider oversight, with breach notice to the covered firm within **72 hours** [15]. Dinari's contract already asks for 24 hours [7]. Blunts is itself a "financial institution" under the FTC Safeguards Rule **[likely; counsel]** [16]. | Blunts privacy notice and terms (separate from Dinari's), a written information security program (WISP), an incident-response plan and a data map. | new |
| 14 | **Marketing pre-approval (FINRA 2210)** | "Any communications to U.S. persons referencing dShares™ or Dinari Securities must be pre-reviewed and approved" [7]. That covers App Store screenshots, TikToks and push notifications. | Build 2–3 weeks of review time into every campaign. The brand bible has to pass Dinari first. | 04 |

### P1: will hurt fast

| # | Item | Detail | Covered in |
|---|---|---|---|
| 15 | **Tax: 1099-B, cost basis, W-9** | Dinari documents **1099-DIV only**; 1099-B isn't mentioned [9]. Backup withholding (24%) depends on a certified TIN (W-9). Frequent small fills plus sparks at a loss will generate **wash sales**. Any gains display (and any fee on gains) must match the broker-dealer's basis method. | 04 §1.7 (flagged) |
| 16 | **Market closed / weekend fills** | Market orders only in regular hours. Outside them, orders become "marketable limit orders" that "may fill partially or not at all" [17]. Weekend sessions (Fri 8pm–Sun 8pm) are "limited tickers with lower liquidity"; whether US accounts can use them is **[UNVERIFIED]** [17]. Holidays close sessions. | UX: "Your fill buys at the next open," and USDC sits in the wallet until then. Decide whether to buy overnight or on weekends at worse spreads, or wait for 9:30 ET. | 04 §1.4 |
| 17 | **Dividends** | Paid to the connected wallet. **Distributions under $0.10 are not paid** [18]. At QQQ's roughly 0.5–0.6% yield **[verify]**, holdings under about $70–80 get nothing each quarter. The docs say **USD+**; file 04 says USDC for US **[conflict; confirm]**. No DRIP: reinvesting is a new $0.20 order. | Disclose. Decide how to show the dividend. | 04 §1.7 |
| 18 | **Wrong-network and wrong-asset sends** | USDC sent on Ethereum or Polygon to the same EOA is recoverable, and Blunts pays to bridge it (file 09). Non-USDC tokens and sends to mistyped addresses are lost. dShares are **non-transferable** [7], so users can't send them out by mistake. The wallet also **must not hold pre-existing dShares** [7]. | Deposit-detection service on all EVM chains, a refund/bridge runbook and an "unsupported token" help flow. | 09 |
| 19 | **Account recovery for embedded wallets** | Privy: "If you have forgotten or lost your login credentials, Privy is unable to help" [19]. Underbanked users churn phone numbers, and SMS login invites SIM-swap takeovers. | Require at least 2 login methods (passkey plus email). Offer cloud-backup recovery [19]. Add a cooling-off period and re-authentication before changing the payout address. Plan key export. | new |
| 20 | **Death, estate, dormancy and escheat** | Who can reach a deceased user's wallet and dShares? Is there a transfer-on-death (TOD) option? Which entity escheats dormant accounts? **[UNVERIFIED; ask Dinari]** | new |
| 21 | **Fraud** | Synthetic or stolen identities using Blunts as a USDC laundering route. Account takeover leading to a spark to an attacker's Cash App address. First-party ACH fraud if the Plaid path ships. | Velocity limits, a new-device hold on sparks, allowlisting the payout address to the verified Cash App address, and device fingerprinting. | 03 §6 (general) |
| 22 | **Customer support and disputes** | Blunts must **redirect** disputes, trade errors and regulatory complaints to Dinari under FINRA 4513 [7]. Blunts still needs first-line support for wallet, Cash App and app issues, a ticket system, SLAs and complaint logging to forward. | new |
| 23 | **Unit economics of small fills** | $0.20 per order (or gas in arrears), plus NBBO at $0.0075 per query, is 1% of a $20 fill and 4% of a $5 fill, all absorbed by Blunts. | Set a minimum fill (e.g., $10). Aggregate *per user* before buying (not across users; omnibus is banned [7]). Negotiate billing in arrears. | 06, 08, 09 |
| 24 | **SIPC and counterparty disclosure** | The legend says "member FINRA/SIPC" [7]. Whether SIPC coverage reaches **tokenized** dShares, and what happens if Dinari fails, is **[UNVERIFIED]**. Users will ask, and the marketing must not overstate it. | new |
| 25 | **Market-data display** | Quotes can't be cached for US users [7]. Wrongly categorizing a user as non-professional brings "back-fees" [7]. The portfolio value display needs a licensed price source. | new |
| 26 | **Gamification and UDAP** | Confetti on fills, streaks and weed-flake rewards: exam findings and the MA Robinhood precedent (file 03 §7.4). FINRA 2210 applies to push notifications. | 03 |

### P2: soon after launch

| # | Item | Detail |
|---|---|---|
| 27 | **Accessibility** | A wordless, animation-heavy UI can fail screen readers and motion-sensitive users. Target WCAG 2.2 AA, support `prefers-reduced-motion` for the flakes, and give icons text labels for VoiceOver/TalkBack. ADA Title III suits against apps are routine. **[general; no Blunts-specific source]** |
| 28 | **Analytics and SDK privacy** | Don't send balances, fills or wallet addresses to ad and analytics SDKs (Meta/TikTok pixels). That's GLBA / Reg S-P "customer information" [15][16]. Use first-party analytics. Keep the App Store privacy "nutrition label" accurate. |
| 29 | **Brand and trademark** | Run a USPTO clearance search for "BLUNTS" in Class 36 (financial services) and Class 9 (software). The "scandalous" refusal bar was struck down (*Iancu v. Brunetti*, 2019), but check for conflicts. **[not searched]** Stripe, Privy and Plaid acceptable-use policies restrict cannabis *businesses*; a financial app with a slang name should pass, but confirm with each. **[UNVERIFIED]** |
| 30 | **Google Play** | Complete the Financial features declaration. Declare tokenized digital assets. Don't "glamorize potential earnings" [12][20]. The crypto wallet licensing rule exempts non-custodial wallets only [12], which ties back to item 3. |
| 31 | **Change management with Dinari** | Every "integration, data schema, or workflow change affecting regulated processes" needs prior Dinari review [7]. That slows weekly shipping, so plan release trains. |
| 32 | **Business continuity** | What if Dinari, Privy or Cash App is down, or changes terms? (Cash App's fee-free stablecoin period is temporary; see file 09.) Users need to reach their dShares via Dinari directly. Also get E&O and cyber insurance. |

---

## Sources

1. SEC qualified-client threshold order, effective 2026-06-29 (summary): https://www.gtlaw.com/en/insights/2026/5/sec-raises-qualified-client-thresholds-under-rule-205-3-of-the-investment-advisers-act-of-1940 ; https://foleyhoag.com/news-and-insights/publications/alerts-and-updates/2026/may/sec-increases-qualified-client-thresholds-under-rule-205-3-of-the-investment-advisers-act-of-1940/
2. Holland & Knight on the same order: https://www.hklaw.com/en/insights/publications/2026/06/sec-raises-qualified-client-thresholds-under-rule-205-3
3. Advisers Act §202(a)(11), 15 U.S.C. 80b-2: https://www.law.cornell.edu/uscode/text/15/80b-2
4. SEC, *Solely Incidental* Interpretation, IA-5249 (2019). Includes the "clearly definable charge for investment advice" language: https://www.sec.gov/files/rules/interp/2019/ia-5249.pdf
5. Advisers Act §205, 15 U.S.C. 80b-5: https://www.law.cornell.edu/uscode/text/15/80b-5
6. NASAA performance-fee model rule: https://www.nasaa.org/wp-content/uploads/2011/07/1956-Model-Performance-Fee-Rule-Adopted-04152013.pdf ; proposed changes: https://www.nasaa.org/16180/notice-of-request-for-public-comment-proposed-changes-to-performance-fee-model-rules-under-the-uniform-securities-acts-of-1956-and-2002/
7. Dinari US integration guide (partner obligations, screens, 2210, 4513, SOC 2, wallets, OFAC): https://docs.dinari.com/docs/us (raw: https://docs.dinari.com/docs/us.md)
8. FINRA Rule 2040: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2040
9. Dinari taxes and reporting (1099-DIV only): https://docs.dinari.com/docs/taxes-reporting
10. Reg NMS Rule 603(c) (vendor display rule), 17 CFR 242.603: https://www.ecfr.gov/current/title-17/chapter-II/part-242/subject-group-ECFR0f6a7f0ba5d0ab6/section-242.603 **[URL path not fetched; cite by CFR section]**
11. FinCEN FIN-2019-G001 (unhosted and multi-sig wallets, "total independent control"): https://www.fincen.gov/system/files/2019-05/FinCEN%20Guidance%20CVC%20FINAL%20508.pdf
12. Google Play: non-custodial wallets exempt from the crypto licensing policy (secondary coverage): https://coinedition.com/google-exempts-non-custodial-wallets-from-play-store-licensing-rules-after-pushback/ ; https://kelman.law/google-plays-new-rules-for-crypto-apps-what-you-need-to-know/
13. Apple App Review Guidelines (1.4.3, 3.1.5, 3.2.1(viii), 5.1.1(ix)): https://developer.apple.com/app-store/review/guidelines/
14. State minimum ages for brokerage accounts (secondary): https://www.benzinga.com/money/how-old-do-you-have-to-be-to-invest-in-stocks
15. Amended Reg S-P, smaller-entity compliance date 2026-06-03 and 72-hour service-provider notice: https://www.dwt.com/blogs/privacy--security-law-blog/2026/05/reg-sp-smaller-entities-june-2026-deadline ; https://www.hklaw.com/en/insights/publications/2026/05/regulation-s-p-amendments-compliance-deadline-approaching
16. FTC Safeguards Rule and fintechs (secondary): https://cdp.cooley.com/fintech-faces-expanded-applicability-of-glbas-privacy-and-security-requirements/
17. Dinari trading hours: https://docs.dinari.com/docs/trading-hours
18. Dinari dividend payments ($0.10 minimum, USD+): https://docs.dinari.com/docs/dividend-payments
19. Privy account recovery: https://docs.privy.io/guide/troubleshooting/recovery
20. Google Play blockchain-based content policy: https://support.google.com/googleplay/android-developer/answer/13607354 ; financial services: https://support.google.com/googleplay/android-developer/answer/9876821

Earlier files cited above: 03 (§2 performance fees, §7 brand), 04 (§A fee law, §1.4–1.11 Dinari facts), 06 (§1.4 recommendation, §2–3 `fee` field and structures), 08 (economics), 09 (Cash App rails, network confusion).
