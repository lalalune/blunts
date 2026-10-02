# Blunts: Legal, Tax & Compliance Research

**Date:** 2026-09-28 | **Status:** Research memo, NOT legal or tax advice. Every conclusion below needs review by US securities counsel (and a tax adviser) before anyone builds, raises money, or launches on it. Items tagged **[UNVERIFIED]** could not be confirmed against a primary or reputable 2026 source during this research pass.

---

## TL;DR: the five things that matter

1. **The BLUNT basket token as designed is almost certainly a security AND an unregistered investment company.** A treasury that pools user money, buys a basket of stocks, and issues a redeemable token is a fund. For US retail that means a registered '40 Act fund/ETF (years and millions of dollars) or nothing. Tokenization changes none of this (SEC staff statement, Jan 28 2026).
2. **"5–10% of profits" is illegal for retail US advisory clients.** Advisers Act §205 bans performance fees unless the client is a "qualified client." Since **June 29, 2026** that means **$1.4M AUM with the adviser or $2.7M net worth**. Your users will be nowhere close. You need a different fee that keeps the "we only win when you win" spirit (options in §2).
3. **Offshore (Cayman/BVI) + targeting Americans = the Binance/BitMEX/KuCoin playbook.** Regulators judge who you actually serve, not where you're incorporated. It also creates a **PFIC tax disaster** for US holders of an offshore fund token, which is the opposite of "we handle your taxes."
4. **Nobody can "withhold capital gains tax" for you in the US.** No mechanism exists. What you *can* do: a user-owned "tax stash" set aside on gains, accurate 1099s from your broker partner, embedded filing (Column Tax / April), and above all a **Roth IRA "blunt"** so growth is tax-free.
5. **Recommended path:** launch in the US as an **SEC/state-registered robo-adviser** on a **registered broker-dealer/custodian** (Alpaca, DriveWealth, Apex, or a tokenized-stock BD like Dinari). Each user owns their fractional shares directly. Charge a **flat subscription**. Offer a **Roth IRA** product. Keep tokenization/on-chain as a back-end or phase-2 feature using the new SEC innovation exemption and registered partners. Tone down the cannabis imagery in store listings and ads.

---

## 0. What changed in 2026 (verified)

| Development | Date | Why it matters to Blunts |
|---|---|---|
| SEC staff **Statement on Tokenized Securities** (CorpFin + IM + Trading & Markets) | Jan 28, 2026 | "Same rules, new plumbing." Custodial third-party tokens = indirect holdings of the underlying. Synthetic tokens may be **security-based swaps**. Funds issuing tokenized units remain subject to the '40 Act. |
| SEC interpretive release on Howey / token taxonomy | Mar 17, 2026 | Clarifies which *crypto* assets aren't securities. A stock basket is a security under any taxonomy. |
| Cayman VASP / Mutual Funds / Private Funds amendments (tokenised funds regime) | Mar 24, 2026 | Cayman now has a clean path for **tokenised funds**. That helps a non-US product and does nothing for US retail. |
| DEA/DOJ moves state-licensed *medical* marijuana to Schedule III; broader rescheduling hearing held Jun–Jul | Apr 22, 2026 | Recreational cannabis is **still Schedule I**, so bank and app-store caution persists. |
| Rule 205-3 qualified client thresholds raised to **$1.4M AUM / $2.7M net worth** | Effective Jun 29, 2026 | The performance-fee ban bites harder. |
| Robinhood Chain mainnet + Stock Tokens (debt securities of Robinhood Assets (Jersey) Ltd) | Jul 1, 2026 | **Explicitly unavailable to US persons.** You cannot build a US product on them today. |
| Dinari (SEC-registered BD + transfer agent) launches 724 tokenized US stocks to eligible US investors | Aug 4, 2026 | A viable **registered US partner** for on-chain stock exposure. |
| SEC proposes **Regulation Crypto Assets** (startup/fundraising exemptions, investment-contract safe harbor) | Aug 2026 | Aimed at crypto networks, not stock-basket funds. |
| SEC **Innovation Exemption** for Tokenized Securities Venues trading tokenized NMS stock | Sep 17, 2026 (5 yrs, to 2031) | Venue relief (exchange definition). Requires US-person venue, permissioned screening/OFAC, and tokens with identical rights to the stock. It is **not** an exemption for your fund, your advisory fees, or your token. |
| CLARITY Act (market structure) | Passed House 2025. Senate Banking reported it Jun 1, 2026. Cloture vote scheduled around Sep 15, 2026. | Widely viewed as unlikely to become law before the midterms. **Don't plan around it.** It mainly governs crypto commodities, not tokenized stocks. |
| GENIUS Act (stablecoins) | Enacted Jul 2025. Effective the earlier of **Jan 18, 2027** or 120 days after final rules. OCC final rules targeted ~Nov 2026. Treasury NPRM comments due Oct 19, 2026. | USDC/regulated stablecoin rails for deposits become cleaner. You still need a licensed on/off-ramp partner. |
| FinCEN Investment Adviser AML rule delayed | To Jan 1, 2028 | An RIA has no direct BSA program obligation until 2028. Your BD partner still runs CIP/AML. |
| SEC withdrew the "predictive data analytics / digital engagement" proposal | Jun 12, 2025 | Federal gamification rulemaking is dead. **State** enforcement (Massachusetts v. Robinhood) and Reg BI / fiduciary duty still apply. |

---

## 1. Securities law: what exactly is Blunts?

### 1.1 Is the BLUNT basket token a security?
**Yes, with near certainty.** Several independent routes lead there:
- It's an interest in a **pool of securities** managed by a sponsor → an "investment contract" under Howey, and likely also a "certificate of interest or participation" / "evidence of indebtedness" in its own right.
- The Jan 2026 SEC staff statement: a third-party token representing an interest in underlying securities held in custody is treated as an **indirect holding of securities**. If it's synthetic (no underlying held), it's potentially a **security-based swap**. Exchange Act §6(l) says security-based swaps can only be sold to non-"eligible contract participants" (i.e., retail) **on a registered national securities exchange**, which is effectively impossible for a startup.
- Robinhood's own stock tokens are structured as **Jersey debt securities** (Chain) or **MiFID II derivatives** (EU app). Both are securities, and both are walled off from US persons.

### 1.2 Is the treasury an "investment company" under the '40 Act?
**Yes.** An issuer that is "primarily engaged in investing, reinvesting or trading in securities" and issues redeemable interests is a textbook open-end fund. For US persons the only exemptions are:
- **3(c)(1):** ≤100 beneficial owners, **no public offering**, and performance fees only for qualified clients.
- **3(c)(7):** only **qualified purchasers** ($5M+ investments), no public offering.

A mass-market app offering the token to young retail Americans fits neither. The alternatives are registering as a mutual fund/ETF (Form N-1A; realistic cost **$1–3M+** and 12–24 months, plus a board, CCO, auditor, and custodian) or **not pooling at all**.

### 1.3 Which registrations would Blunts need?

| Role | Triggered by | Can a partner absorb it? |
|---|---|---|
| **Investment adviser (RIA)** | Choosing and rebalancing the basket for users' money for compensation, with discretion | **No.** Blunts itself must register. Below $100M AUM, register with **states**. The **internet adviser exemption (Rule 203A-2(e))** allows SEC registration for pure digital advice via an "operational interactive website" (narrowed Mar 2025), which avoids 50-state registration. |
| **Broker-dealer** | Handling customer orders, holding funds/securities, transaction-based compensation | **Yes.** Introduce accounts to a clearing/custody BD (Alpaca, DriveWealth, Apex, Dinari). Never take per-trade or spread compensation yourself unless you are a BD. |
| **Transfer agent** | Maintaining the security-holder record for an *issuer's* securities (e.g., your BLUNT token) | Only relevant if you issue your own token. Avoid by not issuing one, or use a registered TA (Securitize, Dinari). |
| **Investment company** | The pooled BLUNT treasury | Avoid by using separately managed accounts (Rule 3a-4 safe harbor). |
| **Money transmitter (state MTL) / FinCEN MSB** | Holding or moving customer fiat/stablecoin outside a BD/bank | Use licensed partners (BD custody; Zero Hash / Bridge / Coinbase for stablecoin ramps). |

### 1.4 Structure comparison

| | (a) Pooled BLUNT token / fund | (b) Robo-adviser managed accounts (Acorns/Stash/Betterment model) | (c) Partner with a registered tokenization issuer/BD (Dinari, Securitize) or a tokenized ETF |
|---|---|---|---|
| What users own | Token claim on the treasury | Fractional shares **in their own name** at a BD/custodian | Tokenized shares (e.g., Dinari dShares) in user wallet or custodial account, backed 1:1 by underlying |
| '40 Act | **Unregistered investment company** unless registered fund | Avoided via **Rule 3a-4** (individualized management, annual contact, quarterly statements, reasonable restrictions, indicia of ownership) | Avoided if each user's account holds individual dShares under (b)-style management. A **tokenized registered ETF** is a clean single-ticker "basket." |
| Blunts registrations | RIA + fund registration + TA + possibly BD | **RIA only** (state, or SEC via internet adviser exemption) | RIA only. The partner is the BD/TA. |
| Performance fee | Only if QC / 3(c)(1) | Banned for retail | Banned for retail |
| Tax reporting | Fund-level. An offshore fund → **PFIC** for US users. | Broker issues **1099-B**. Clean. | Partner issues **1099-DA** (tokenized securities report on 1099-DA with extra fields). |
| Time/cost to US launch | 18–36 mo, $2–5M+ | **6–12 mo, ~$250k–$750k** all-in legal/compliance/partner setup | 6–12 mo. Depends on partner readiness for retail and IRA support. |
| Verdict | **Don't do it for US retail.** | **Recommended core** | **Good phase 2 / "on-chain inside"** feature |

**Simplest "basket" option:** keep the UX of "one blunt = $100 of the Blunts Tech Index," but implement it as fractional purchases of a **listed tech ETF (e.g., a Nasdaq-100 or tech-sector ETF)** or a small fixed model portfolio in each user's own account. You get the basket without being the fund.

---

## 2. Performance fees: does §205 kill "5–10% of profit"?

**For US retail: yes.** Advisers Act **§205(a)(1)** prohibits a registered (or required-to-register) adviser from receiving compensation "on the basis of a share of capital gains upon or capital appreciation of the funds" of a client. **Rule 205-3** exempts only qualified clients: **≥$1.4M AUM with the adviser or >$2.7M net worth**, or qualified purchasers (thresholds effective Jun 29, 2026). Most state regimes mirror this.

Workarounds that **don't** work for retail:
- "We take X% of gains **when you withdraw**." This is still a share of capital appreciation, so the timing is irrelevant.
- Offshore fund charging carry to US retail. That hits the '40 Act (§1.2) and §205 (US adviser), and fails the substance test (§3).
- "Spread" on buys/sells. That is transaction-based compensation, so you'd need BD registration, and with Reg BI/fiduciary conflict rules it's hard to call it "no fees."
- Calling it a "tip" or "donation" linked to profit. Substance over form.

Legal exceptions that are **impractical**:
- **Fulcrum fee (§205(b)(2)):** a symmetric fee that goes up and down around an index. Allowed for **registered investment companies** or accounts >$1M, so it requires a registered fund.
- **§205(b)(3)–(b)(5):** BDCs, 3(c)(7) funds, and non-US-resident clients. The non-US-client exemption is useful only for the **non-US** product.

### Compliant alternatives that keep "we win when you win"

| Model | How it works | Messaging | Risk |
|---|---|---|---|
| **Flat subscription** (Acorns: ~$3–12/mo in 2026) | $X/month. Free under $Y balance or for the first N months. | "No % of your money, ever." | Low. The fee is regressive on tiny balances (Acorns/Stash criticism), so **waive it under a threshold** (e.g., < 1 band). |
| **Low AUM fee** (e.g., 0.25–0.50%/yr) | Asset-based fees are expressly permitted (§205(b)(1) says fees on average assets aren't performance fees). | "We grow only when your stash grows." This is the compliant version of alignment. | Low. The best "only win when you win" substitute. |
| **AUM fee waived while you're underwater** | Charge the AUM fee only when the account value exceeds net deposits. | "If you're down, we don't get paid." | **Medium–High. Needs counsel.** It's conditioned on appreciation and could be read as a performance fee. Don't assume it's safe. |
| **Freemium + premium features** | Core investing free. Premium = Roth IRA match, tax filing, cards. | "Stacking blunts is free." | Low. Monetize via partner revenue share (disclosed). |
| **Cash/stablecoin yield share** | Interest on uninvested cash (sweep) via partner. | — | Medium. Needs conflict disclosure. SEC exams focus on cash sweeps. |
| **Qualified-client tier** | Offer a genuine performance fee only to users ≥$1.4M. | "Big-blunt tier." | Irrelevant to target market. |
| **Non-US product** | Performance fees are permissible for non-US-resident clients of a US adviser under §205(b)(5), and under the local regime. | — | Keep it a separate entity/brand (see §3). |

**Recommendation:** subscription ($3–5/mo, free below $100–$1,000) **or** 0.25–0.35% AUM, plus an explicit "we never charge deposit/withdraw fees" promise. Drop profit-share language entirely from the US product.

---

## 3. Offshore (Cayman/BVI) serving Americans

### Why "launch offshore, fix later" is dangerous when your target is Americans
- **US securities law follows the investor.** An offer/sale to persons in the US of a non-registered security, or unregistered advisory/brokerage directed at US persons, is a violation regardless of entity domicile. **Reg S** (offshore offers) requires *no directed selling efforts in the US*. An app marketed with US urban culture, in English, to Americans, on US app stores, with USD deposits, is directed selling by definition.
- **Reverse solicitation** is a narrow defense: the client must genuinely initiate unprompted. It is destroyed by any marketing (influencers, TikTok, US app-store presence). It's a Europe/MiFID concept that US regulators largely don't recognize for mass retail.
- **Geofencing must actually work.** Enforcement history:
  - **BitMEX:** FinCEN **$100M** (2021). Claimed no US customers but failed to screen **VPN** users. Founders were criminally charged.
  - **Binance:** guilty plea and **>$4B** (2023), 3-year monitor. Evidence showed internal coaching of US users around geo-blocks.
  - **KuCoin:** ~$297M DOJ criminal resolution. CFTC final order in **Mar 2026** permanently barring it from US users unless registered.
- **'40 Act §7(d):** a foreign fund may not publicly offer in the US at all without an SEC order, which is essentially never granted.
- **Tax trap:** a Cayman/BVI fund (or basket token) is almost certainly a **Passive Foreign Investment Company (PFIC)** for US holders. That means punitive excess-distribution tax + interest, or QEF/mark-to-market elections, plus **Form 8621 per holder, per year**. This defeats "we handle your taxes" and hurts users.
- **Banking/payment partners and app stores** will off-board you when they see US users on an unlicensed offshore product.
- **Fundraising:** US VCs' diligence will flag it, and "cleanup" (rescission offers, disgorgement) can kill the company.

### A legitimate phased path
- **Path A (recommended if the target is Americans):** launch **in the US first, via registered partners** (RIA + BD). Slower to start, but it's the only path that compounds.
- **Path B (if you want to ship faster outside the US):** a separate non-US entity and **separate brand**. Launch where tokenized stock products are permitted and where you get local licenses or rely on a licensed partner (e.g., build on Robinhood Chain stock tokens, available in 120+ countries but not US/UK/Canada). Candidates: parts of **LatAm** (e.g., Brazil, Argentina, Mexico: check local securities regulators), **Africa** (Nigeria SEC, Kenya CMA sandbox), **Caribbean**, or the **EU via a MiCA/MiFID partner**. Requirements: hard geoblocking (IP + KYC nationality/residence + device + VPN detection + phone-number country), no US marketing, US-person attestation, and ideally no US-ties for founders operating it (a US-based team running it heightens US jurisdiction). Use Path B as a **product lab**, not a backdoor.
- **Don't** run a US brand and an offshore product for Americans in parallel.

---

## 4. 2026 regulatory landscape (details)

- **Project Crypto (SEC Chair Atkins):** a Commission-wide modernization push. Delivered so far: the tokenized securities staff statement (Jan), the Howey/taxonomy interpretive release (Mar), the Reg Crypto Assets proposal (Aug), and the **Innovation Exemption** (Sep 17). Three crypto rulemakings (crypto assets, broker-dealers, market structure) are on the 2026 reg agenda. The direction is friendly to tokenization, **but every item keeps tokenized stocks inside the securities regime**. None of it allows an unregistered retail fund or retail performance fees.
- **Innovation Exemption:** relief for *Tokenized Securities Venues* (US persons, no disqualified affiliates) to trade tokenized NMS stock via permissioned AMMs/liquidity pools. Conditions: symbol/volume limits, identical-rights tokens, issuer notification for third-party tokenizations, public auditable smart contracts, halts that mirror the primary market, and permissioned participant screening incl. OFAC. It runs 5 years (to Sep 2031). Retail may trade on a TSV per law-firm summaries. **ETF coverage [UNVERIFIED]:** exchange-listed ETFs are generally NMS stocks, but summaries only discuss stocks. Implication: in 2027+ Blunts could route user purchases to a TSV via a partner. Blunts should not itself be a TSV.
- **CLARITY Act:** stalled in the Senate, with an expected procedural vote mid-Sep 2026. **Current outcome [UNVERIFIED]:** most commentary expected it not to pass in 2026. Mostly irrelevant to a stock-basket product.
- **GENIUS Act:** stablecoin framework. It's fine to use **USDC** on-ramps through a licensed issuer/partner. Blunts should not issue a stablecoin, and must not describe BLUNT as a stablecoin.
- **State money transmitter licensing:** holding or transmitting customer fiat/stablecoins yourself requires MTLs in ~49 states (NY: BitLicense and/or MTL). Budget **$1–3M and 18–24 months** to do it yourself. **Using licensed partners avoids it**, provided **funds never touch Blunts' own accounts/wallets** (flow of funds: user bank → BD/custodian, or user → Zero Hash/Bridge → custodian). Zero Hash holds MTLs in 51 jurisdictions plus a NYDFS BitLicense and is seeking an OCC trust charter (Mar 2026). Bridge (Stripe) and Coinbase offer similar. **Agent-of-payee** exemptions vary by state, so have counsel map the flow of funds.
- **NY:** BitLicense applies only to virtual-currency activity by you. Under the managed-account model using a BD, NY is handled via the BD's registration plus your RIA/state notice.

---

## 5. Taxes: "withhold capital gains on the front end"

### 5.1 Can an app legally withhold capital gains tax for US users?
**Not as "withholding."** US brokers do **not** withhold income tax on capital gains of US persons. The only broker withholding is **backup withholding at 24%** when a customer fails to provide a correct TIN/W-9 (or the IRS notifies you). NRA withholding (Ch. 3/4) applies only to non-US persons. There's no legal pathway for Blunts to remit a user's capital gains tax to the IRS as a "withholding agent," and you can't estimate the right amount anyway. Users' actual tax depends on total income, filing status, losses, and state.

**Critical fact for your demographic:** in 2026, a **single filer with taxable income ≤ $49,450 pays 0% federal tax on long-term capital gains** (held > 1 year). Many target users would owe **nothing** federally on long-term gains. Blanket "withholding" would take money they don't owe. Short-term gains (≤1 year) are taxed as ordinary income.

### 5.2 What Blunts CAN do (compliant "we handle taxes")

| Feature | How | Notes |
|---|---|---|
| **"Tax stash" (opt-in/opt-out default)** | On a withdrawal that realizes gains, move an estimated % (e.g., 0% for LT gains when the user self-reports low income, 10–24% for ST gains) into a **separate user-owned sub-account** (still their money, invested in a T-bill/MMF sweep or cash). | Must be clearly the user's funds, withdrawable anytime, and not a fee. Don't call it "withholding" or "tax paid." |
| **Pay the IRS for them** | At tax time, the user authorizes payment of the stash via **IRS Direct Pay/EFTPS**, or it's applied inside an embedded filing flow. | Possible via embedded tax partners. Requires user authorization. |
| **Tax documents** | **Broker partner** issues **1099-B** (traditional fractional shares) or **1099-DA** (digital-asset brokers. Tokenized securities are generally reported on **1099-DA**, with extra fields). Also 1099-DIV for dividends. | For 2026 transactions, 1099-DA includes **cost basis** for covered assets. Blunts (as RIA) is not the broker, so let the BD do it. |
| **Cost basis & lot selection** | Default to **HIFO or specific ID** on withdrawal. Prefer lots held >1 yr. | Minimizes tax automatically. A real "handles taxes" win. |
| **Wash sale** | Applies to securities (and tokenized securities). Avoid auto-buys within 30 days of a loss sale in "substantially identical" holdings. Recurring deposits can trigger it. | The BD tracks wash sales for 1099-B. Your rebalancing logic must respect them. |
| **"Wait 12 months" nudges** | Show "Hold 43 more days → this gain may be taxed at 0–15% instead of your income rate." | Non-gamified education. Good for users. |
| **Embedded filing** | **Column Tax** (API, IRS-authorized e-file, 30+ fintech partners like MoneyLion), **April** (embedded tax/filing), **TaxBit** (crypto/1099-DA info reporting engine for brokers), **Cash App Taxes** (consumer free filing; partnership/API availability **[UNVERIFIED]**). | Pre-fill from 1099 data. This is how you honestly "handle taxes." |
| **Tax-loss harvesting** | Standard robo feature. | Requires wash-sale discipline. |

### 5.3 The tax-wrapped alternatives

**Roth IRA ("Forever Blunts"/"Long Stash"): strongly recommended as a flagship product.**
- Growth and qualified withdrawals are **tax-free**, so there is nothing to withhold. 2026 contribution limit: **$7,500** ($8,600 age 50+). Full contribution for single MAGI < **$153,000**. Requires **earned income**.
- **Contributions** (not earnings) can be withdrawn **anytime, tax- and penalty-free**. That fits "Deposit/Withdraw" UX surprisingly well if the app shows "withdrawable now" vs "locked until 59½ (earnings)."
- Needs a custodian that supports IRAs (Apex, Alpaca **[UNVERIFIED: confirm IRA support]**, DriveWealth). Acorns ("Later") and Robinhood (with IRA match) prove the model.
- Tokenized assets in IRAs are custodially harder, so keep the IRA on traditional rails.
- Saver's Credit (for low-income contributors) is a meaningful benefit for the target demographic (post-2027 it becomes a federal "Saver's Match" for workplace plans/IRAs under SECURE 2.0; verify details closer to launch **[UNVERIFIED re: IRA eligibility specifics]**).

**Pooled structure where "the fund pays the taxes":**
- A US **C-corp** fund pays 21% corporate tax, and users are still taxed on sale/dividends: **double taxation**. It's worse for users, especially 0%-bracket users.
- A **RIC** (mutual fund/ETF) passes through gains, so users still get 1099s. ETFs are tax-efficient (few distributions), which is the best "passive" answer, but it requires the '40 Act fund route or simply buying an existing ETF.
- **Offshore fund** → PFIC (see §3). **Don't.**

**Bottom line:** "We handle taxes" = (1) Roth IRA by default for eligible users, (2) taxable account with smart lot selection + 12-month nudges + an opt-in tax stash, (3) embedded filing via Column Tax/April with pre-filled 1099s. Never say "we withheld your taxes."

---

## 6. KYC / AML

- **CIP (31 CFR 1023.220, for BDs):** name, DOB, address, **ID number** (SSN/ITIN for US persons) + verification. The **BD partner** runs it, and Blunts' onboarding UI collects the data for them. Plus OFAC/SDN screening, PEP screening, and ongoing monitoring/SAR (BD obligation). The FinCEN RIA AML rule is delayed to **Jan 1, 2028**, but partners will contractually require an AML program from you anyway.
- **Users without SSN:** an **ITIN** is generally acceptable for tax and CIP. Some BDs accept passport + foreign ID for non-resident aliens with W-8BEN, which triggers NRA withholding on dividends. Undocumented users with an ITIN are often supportable, but it is **partner-dependent**. Check Alpaca/DriveWealth policy.
- **Minors:** brokerage accounts require **18+** (19 in AL/NE, 21 in MS for contracts **[UNVERIFIED: confirm per BD]**). Custodial UTMA accounts are a possible later add-on. Age-gating is also required for cannabis-themed branding (§7), so make it **21+ in marketing and 18+ in eligibility**, or simply **21+** for brand-safety reasons.
- **W-9 / TIN certification** at onboarding avoids 24% backup withholding.
- **Friction:** typical app-based KYC takes **2–5 minutes** with instant decisions for ~85–95% of US applicants (vendor claims **[UNVERIFIED]**). Manual review is needed for thin-file young users, so expect higher failure rates in the target demographic. Plan for document-upload fallback.
- **Bank funding:** Plaid (or similar) for ACH and instant-deposit risk limits. Returns and fraud (ACH R10) are a real cost at the $100 ticket size.

---

## 7. Cannabis branding & gamification risk

### 7.1 App stores
- **Apple 1.4.3:** rejects apps that "encourage consumption of" tobacco/vape, **illegal drugs**, or excessive alcohol. Selling is allowed only for licensed pharmacies/dispensaries, geo-restricted. Recreational cannabis is federally **Schedule I**, so smoking imagery can be read as encouraging drug use. Finance apps also get extra scrutiny (5.1.1(ix): financial services apps must be submitted by the legal entity providing the service, i.e., your RIA/BD relationships must be demonstrable).
- **Google Play:** bans facilitating marijuana sales. Financial apps must file the **Financial features declaration**. The "deceptive or harmful financial products" policy is enforced harder when branding looks unserious.
- **Assessment:** the name "Blunts" alone is probably OK (it's also a common English word; there are "Blunt" umbrella and knife brands). **Visible joints, smoke, leaf icons, "get lit/high" copy, or 4/20 promos in screenshots/store listing materially raise rejection risk** and set an age rating of 17+ ("Frequent/Intense Alcohol, Tobacco, or Drug Use References").

### 7.2 Banks, payments, and infrastructure
- **Stripe** prohibits cannabis/CBD and drug paraphernalia, and lists brokerage as "limited availability." **Plaid, BD partners, sponsor banks, Visa/Mastercard** all have acceptable-use and reputational-risk reviews. The risk isn't that you sell cannabis. It's that **compliance teams at Alpaca/DriveWealth/Apex/Zero Hash must approve your marketing** (FINRA Rule 2210 applies to the BD's communications, and RIA advertising falls under the **Marketing Rule 206(4)-1**). Expect them to veto overt drug imagery. **Get partner sign-off on brand guidelines before committing.**

### 7.3 Advertising
- **Meta:** financial services are restricted (18+ targeting, disclosures). Psychoactive cannabis ads are banned, and "coded imagery" circumvention risks permanent account bans. **Google Ads** and **TikTok** have similar drug + financial-services restrictions (TikTok financial ads require licensing verification in the US **[UNVERIFIED specifics]**).
- **SEC Marketing Rule:** no performance claims without standardized 1/5/10-yr returns, no cherry-picking, and testimonials/endorsements (influencers!) need disclosures + oversight. Paid influencers who promote a securities product without disclosure are an **SEC enforcement priority** (e.g., celebrity crypto-promotion cases; §17(b) of the '33 Act for paid promotion of securities).

### 7.4 Gamification / digital engagement practices
- **Massachusetts v. Robinhood (Jan 2024):** **$7.5M** fine. Robinhood agreed to permanently stop **confetti**, celebratory imagery tied to trading frequency, lottery-like scratch-off rewards, and push notifications highlighting lists. Massachusetts' fiduciary rule and other states' similar rules remain live.
- The SEC withdrew its DEP/predictive analytics proposal (Jun 2025), but **Reg BI, fiduciary duty, FINRA 2210 and state UDAP** still apply.
- **Blunts design implication:** gamify **saving and holding**, not **trading**. Examples: "rolled your 10th blunt = a band" milestones, streaks for recurring deposits, and "held 1 year" badges. These encourage long-term deposits, which regulators like. **Avoid** celebrating withdrawals/sales, random rewards (lottery mechanics), leaderboards of returns, countdown pressure, or push notifications about price moves. Only the user deposits/withdraws and there's no trading, which is a big advantage. Keep it that way.

### 7.5 Targeting "young urban Americans"
- There's **no credit product**, so ECOA/fair lending mostly doesn't apply. **UDAAP** (CFPB/state AGs) and SEC/state anti-fraud do apply. Risk areas: implying guaranteed returns, "get rich" framing, minimizing risk, "no fees" claims while charging subscriptions, and culturally targeted marketing that pairs a risky product with vulnerable consumers (a state AG and media narrative risk: "weed-themed stock app targets Black youth").
- **Mitigations:** a clear plain-language risk disclosure ("you can lose money"), no return promises, educational content, community-advisory input, and an age floor of 21 for marketing.

### 7.6 Keep the brand, lower the risk
- Position **"blunt" as money slang/metaphor** ("roll up your savings," "a band = 10 blunts"). **No smoke, joints, leaves, lighters, or consumption verbs** in the store listing, screenshots, app icon, or paid ads. Keep playful flake/leaf visuals *inside* the app behind the age gate, and make them **abstract** (e.g., stylized "rolled bill" instead of a joint).
- **Store listing:** lead with "save & invest in top tech companies." Rating 17+ if any in-app references remain.
- **Brand-safe alias** for ads and partner decks (e.g., "Blunts: Stack Bands" or a neutral parent brand).
- **Trademark:** run a USPTO/knockout search on "BLUNTS" in Class 36 (financial services) **[UNVERIFIED availability]**.
- Get **written sign-off** from BD, bank, and app-store (via pre-submission) before brand lock.

---

## 8. Recommended structure & phased plan

### 8.1 Target structure (US)
```
Blunts, Inc. (Delaware C-corp; the VC-friendly parent)
 ├─ Blunts Advisers LLC: RIA (SEC via internet adviser exemption, or state-registered)
 │     · discretionary model portfolio ("Blunts Tech Basket"), Rule 3a-4 compliant
 │     · fee: flat subscription or ≤0.35% AUM (no profit share)
 ├─ Clearing/custody BD partner (Alpaca / DriveWealth / Apex); phase 2: Dinari for tokenized dShares
 │     · CIP/KYC, custody (SIPC), fractional execution, 1099-B/DA, IRA custody
 ├─ Payments: Plaid + BD's ACH; optional USDC ramp via Zero Hash / Bridge (they hold MTLs/BitLicense)
 └─ Tax: Column Tax or April (embedded filing), in-house tax-stash + lot optimizer
Optional later: Blunts International (Cayman/BVI/Jersey, separate brand, non-US only)
```

### 8.2 Phases, timelines, costs (rough; **[estimates, not quotes]**)

| Phase | Timeline | Key work | Est. cost |
|---|---|---|---|
| **0. Foundations** | Months 0–3 | Securities counsel engagement, entity formation, brand/trademark search, BD partner selection (LOIs), flow-of-funds memo (MTL analysis), fee model decision, partner brand review | Legal $75k–$200k. Trademark $5k–$15k. |
| **1. RIA registration** | Months 2–6 | Form ADV Parts 1/2A/2B, CRS (Form CRS), compliance manual, code of ethics, CCO (outsourced $3k–$10k/mo), Marketing Rule policies, cybersecurity (Reg S-P amendments), books & records | Counsel $40k–$120k. Filing fees are nominal. Compliance consultant $50k–$150k/yr. |
| **2. Build on BD (taxable + Roth IRA)** | Months 3–9 | Broker API integration, KYC flow, model portfolio, rebalancing, tax-lot engine, tax stash, Column Tax/April integration, disclosures | BD minimums/platform fees $0–$150k/yr (varies widely **[UNVERIFIED]**). Engineering. |
| **3. US beta** | Months 8–12 | Closed beta (a few states or waitlist), marketing-rule review of all creatives, app-store submission | Ads/legal review $25k–$75k. |
| **4. National launch** | Months 12–18 | 50 states (SEC-registered RIA notice filings ~$50–$300/state/yr) | — |
| **5. On-chain features** | 18–30 mo | Dinari dShares or TSV-traded tokenized stocks via partner. Self-custody "export your blunts" for power users. Revisit if Congress/SEC create broader relief. | Partner-dependent |
| **(Optional) Non-US lab** | Parallel, months 6–18 | Separate entity/brand. Local licensing or licensed partner. Hard geoblock. Performance fees possibly allowed under local law. | $150k–$500k legal per jurisdiction cluster |
| **Avoid** | — | Own '40 Act fund ($2–5M+), own BD ($500k–$1.5M + 12–18 mo FINRA NMA), own MTLs ($1–3M) | — |

### 8.3 Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Pooled BLUNT token = unregistered security + investment company | **High** (if built as designed) | **Critical** (SEC enforcement, rescission, personal liability) | Drop the pooled token for US. Use managed accounts (Rule 3a-4). |
| 2 | Profit-share fee violates §205 | **High** | High | Flat subscription or AUM fee. Get a counsel opinion on any "no fee while underwater" variant. |
| 3 | Offshore entity found to be serving US persons | High (given US-targeted brand) | **Critical** (BitMEX/Binance/KuCoin precedent; founders' personal exposure) | US-first via registered partners. Any offshore arm gets a separate brand + hard geoblocking + no US marketing. |
| 4 | PFIC/tax harm to US users of an offshore token | High (if offshore) | High | No offshore product for US persons. |
| 5 | Misleading "we withhold your taxes" claim (UDAAP / anti-fraud) | Medium | Medium–High | Use "tax stash" framing, embedded filing, and accurate 1099s. |
| 6 | App-store rejection or removal for drug references | Medium | High | Clean store listing, no consumption imagery, 17+ rating, pre-submission consultation. |
| 7 | BD/bank/payment partner refuses or off-boards the brand | Medium | **Critical** | Partner sign-off on brand book before launch. Backup partner. |
| 8 | Ad-platform bans (Meta/Google/TikTok) | Medium–High | Medium | Brand-safe ad creative. Organic/community + creator marketing with Marketing Rule controls. |
| 9 | State gamification enforcement (MA-style) | Low–Medium | Medium | Reward holding/recurring deposits only. No confetti on transactions, no lottery mechanics. |
| 10 | Marketing Rule / influencer violations | Medium | Medium | Pre-review, endorsement disclosures, a written agreement with each creator. |
| 11 | MTL violation from touching funds | Low–Medium | High | Flow of funds only through the BD/licensed ramp. Counsel memo. |
| 12 | KYC failure rate / fraud (ACH returns) on thin-file young users | Medium | Medium | Document fallback, deposit holds, velocity limits. |
| 13 | Regulatory whiplash (a post-2026 administration change reverses Project Crypto relief) | Medium | Medium | Core product on traditional rails. Treat on-chain as optional. |
| 14 | Trademark conflict on "BLUNTS" in Class 36 | Unknown | Medium | Clearance search now. |
| 15 | Reputational/UDAAP narrative ("weed stock app targets urban youth") | Medium | Medium–High | Plain-language risk disclosure, education, 21+ marketing, community advisors. |

---

## Sources

**SEC / tokenization / Project Crypto**
- SEC press release, Innovation Exemption (Sep 17, 2026): https://www.sec.gov/newsroom/press-releases/2026-90-sec-issues-innovation-exemption-facilitate-trading-tokenized-nms-stock-request-comment
- Atkins statement on Innovation Exemption: https://www.sec.gov/newsroom/speeches-statements/atkins-innovation-exemption-bridge-toward-durable-rulemaking-091726
- Sidley summary of Innovation Exemption: https://www.sidley.com/en/insights/newsupdates/2026/09/sec-issues-innovation-exemption-for-onchain-trading-of-tokenized-us-listed-stocks
- Mayer Brown, SEC Innovation Exemption: https://www.mayerbrown.com/en/insights/publications/2026/09/sec-innovation-exemption
- CoinDesk, innovation exemption: https://www.coindesk.com/policy/2026/09/17/sec-rolls-out-long-awaited-innovation-exemption-for-tokenized-securities-venues
- SEC Staff Statement on Tokenized Securities (Jan 28, 2026): https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities
- Morgan Lewis on the statement: https://www.morganlewis.com/pubs/2026/02/sec-clarifies-federal-securities-law-treatment-of-tokenized-securities
- Dechert, tokenization models: https://www.dechert.com/knowledge/onpoint/2026/2/sec-staff-maps-tokenization-models--tokenized-securities-are-sti.html
- Seward & Kissel 40 Act blog on tokenization: https://40actblog.sewkis.com/blog/sec-guidance-on-tokenization
- Greenberg Traurig, Regulation Crypto Assets proposal: https://www.gtlaw.com/en/insights/2026/8/sec-proposes-regulation-crypto-assets-creating-tailored-crypto-offering-exemptions-and-investment-contract-safe-harbor
- SEC proposed Regulation Crypto Assets: https://www.sec.gov/files/rules/proposed/2026/33-11434.pdf
- Atkins, Inside Project Crypto: https://www.sec.gov/newsroom/speeches-statements/atkins-111225-secs-approach-digital-assets-inside-project-crypto

**Tokenized stock providers**
- Robinhood Chain Stock Tokens docs: https://docs.robinhood.com/chain/stock-tokens/
- Robinhood newsroom, Chain mainnet: https://robinhood.com/us/en/newsroom/robinhood-accelerates-global-expansion-robinhood-chain-mainnet-stock-tokens-agentic-trading/
- Robinhood EU Stock Tokens KID: https://cdn.robinhood.com/assets/robinhood/legal/stock_tokens_kid_eu.pdf
- Tech Times, Chain launch caveat: https://www.techtimes.com/articles/319564/20260702/robinhood-chain-goes-live-tokenized-stocks-key-ownership-caveat.htm
- CoinDesk, Dinari to US investors: https://www.coindesk.com/business/2026/08/04/dinari-brings-tokenized-u-s-stocks-to-american-investors-as-equity-race-heats-up
- Dinari launch PR: https://www.prnewswire.com/news-releases/in-an-industry-first-dinari-launches-724-tokenized-stocks-available-to-both-us-investors-and-businesses-302842099.html
- Alpaca Broker API: https://alpaca.markets/broker

**Advisers Act / performance fees / robo**
- Holland & Knight, qualified client thresholds: https://www.hklaw.com/en/insights/publications/2026/06/sec-raises-qualified-client-thresholds-under-rule-205-3
- Foley Hoag, effective June 29, 2026: https://foleyhoag.com/news-and-insights/publications/alerts-and-updates/2026/may/sec-increases-qualified-client-thresholds-under-rule-205-3-of-the-investment-advisers-act-of-1940/
- Kitces, Rule 3a-4 and robo-advisers: https://www.kitces.com/blog/rule-3a-4-of-the-investment-company-act-are-robo-advisors-a-registered-investment-adviser-ria-or-an-unregistered-investment-company/
- SEC internet adviser exemption final rule: https://www.sec.gov/files/rules/final/2024/ia-6578.pdf
- K&L Gates on internet adviser exemption: https://www.klgates.com/The-SEC-Limits-the-Internet-Adviser-Exemption-4-15-2024
- Acorns pricing: https://www.acorns.com/pricing/
- NerdWallet Acorns review 2026: https://www.nerdwallet.com/investing/reviews/acorns

**Legislation / stablecoins / MTL**
- Latham US Crypto Policy Tracker: https://www.lw.com/en/us-crypto-policy-tracker/legislative-developments
- CNBC, CLARITY in September: https://www.cnbc.com/2026/09/01/crypto-enters-september-with-policy-gamble-hanging-by-a-thread.html
- CoinDesk, CLARITY outcomes: https://www.coindesk.com/policy/2026/08/05/here-are-the-possible-outcomes-for-clarity-right-now
- H.R.3633 text: https://www.congress.gov/bill/119th-congress/house-bill/3633/text
- OCC GENIUS Act NPRM: https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-3.html
- Treasury GENIUS Act NPRM (Fed. Reg.): https://www.federalregister.gov/documents/2026/08/18/2026-16796/genius-act-regulations-on-payment-stablecoin-issuance-offer-and-sale
- PYMNTS, OCC timing: https://www.pymnts.com/legal/2026/occ-races-the-clock-to-finish-genius-act-stablecoin-rules/
- Zero Hash US licenses: https://docs.zerohash.com/page/us-licenses-and-disclosures
- FinCEN IA AML delay to 2028: https://www.fincen.gov/news/news-releases/fincen-issues-final-rule-postpone-effective-date-investment-adviser-rule-2028

**Offshore / enforcement**
- FinCEN BitMEX $100M: https://www.fincen.gov/news/news-releases/fincen-announces-100-million-enforcement-action-against-unregistered-futures
- CFTC charges KuCoin: https://www.cftc.gov/PressRoom/PressReleases/8884-24
- CoinDesk, KuCoin barred (Mar 2026): https://www.coindesk.com/policy/2026/03/31/kucoin-permanently-barred-from-u-s-after-cftc-order-following-usd297-million-doj-case
- GIR, DOJ/SEC crypto exchange enforcement: https://globalinvestigationsreview.com/review/the-investigations-review-of-the-americas/2025/article/doj-and-sec-crypto-exchange-enforcement-in-the-united-states
- AIMA, Cayman tokenised funds framework: https://www.aima.org/article/cayman-islands-introduces-new-regulatory-framework-for-tokenised-funds.html
- Conyers, Cayman amendments: https://www.conyers.com/publications/view/amendments-to-the-cayman-islands-mutual-funds-act-and-private-funds-act/

**Tax**
- The Tax Adviser, 1099-DA maze (2026): https://www.thetaxadviser.com/issues/2026/mar/navigating-the-form-1099-da-reporting-maze/
- Final broker regs (Fed. Reg. 2024): https://www.federalregister.gov/documents/2024/07/09/2024-14004/gross-proceeds-and-basis-reporting-by-brokers-and-determination-of-amount-realized-and-basis-for
- Wolters Kluwer on dual-classification/tokenized securities: https://www.wolterskluwer.com/en/expert-insights/key-aspects-of-the-final-digital-asset-broker-tax-reporting-regulations-and-related-guidance
- Gordon Law, 1099-DA 2026: https://gordonlaw.com/learn/form-1099-da-2026-reporting-guide/
- CNBC, 0% capital gains 2026: https://www.cnbc.com/2025/10/14/capital-gains-taxes-2026.html
- IRS Topic 409 capital gains: https://www.irs.gov/taxtopics/tc409
- IRS IRA contribution limits: https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-ira-contribution-limits
- Vanguard Roth IRA 2026 limits: https://investor.vanguard.com/investor-resources-education/iras/roth-ira-income-limits
- Column Tax: https://www.columntax.com/

**Branding / gamification / platforms**
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Developer Program Policy: https://support.google.com/googleplay/android-developer/answer/17190352?hl=en
- Stripe prohibited & restricted businesses: https://stripe.com/legal/restricted-businesses
- Meta Advertising Standards: https://transparency.meta.com/policies/ad-standards/
- Vinson & Elkins, Robinhood $7.5M gamification: https://www.velaw.com/insights/game-over-robinhood-pays-7-5-million-to-resolve-gamification-securities-violations/
- SEC withdrawal of predictive data analytics proposal: https://www.sec.gov/rules-regulations/2025/06/s7-12-23
- FINRA 2026 Regulatory Oversight Report: https://www.finra.org/rules-guidance/guidance/reports/2026-finra-annual-regulatory-oversight-report
- DEA marijuana rescheduling actions: https://www.dea.gov/marijuana-rescheduling-regulatory-actions
- Morgan Lewis, post-hearing rescheduling (Sep 2026): https://www.morganlewis.com/pubs/2026/09/high-time-for-a-change-post-dea-hearing-broader-marijuana-rescheduling-questions-remain

**From general legal knowledge (not re-verified via 2026 web source this pass):** Advisers Act §205(a)(1)/(b) text (fulcrum fee (b)(2), 3(c)(7) (b)(4), non-US-resident carve-out (b)(5)), '40 Act §§3(c)(1), 3(c)(7), 7(d), Exchange Act §6(l) (SBS to non-ECPs), '33 Act §17(b), Reg S "directed selling efforts," CIP rule 31 CFR 1023.220, 24% backup withholding, PFIC rules (IRC §§1291–1298, Form 8621), Binance $4.3B plea (Nov 2023). Confirm with counsel.

*This document is research, not legal, tax, or investment advice.*
