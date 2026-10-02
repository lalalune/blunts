# 13: Apple App Store — review rules, precedent, Apple Pay and "cutting Apple in"

**Date:** 2026-09-28 | **Status:** Research memo. It is NOT legal advice. Items tagged **[UNVERIFIED]** could not be confirmed against a primary source in this pass. Numbered citations like [3] point to the Sources list at the end.

Builds on `04-us-stack-dinari-alpaca.md` §B (store fees) and `12-gaps-and-profit-fee.md` P0 items 4–5. It doesn't redo them. It quotes the current Guidelines text, adds precedent, and covers Apple Pay, login, age rating and the submission checklist.

Guideline quotes below are from the live page, **"Last Updated: June 8, 2026"** [1]. Quotes are short snippets. Read the full text before submitting.

---

## TL;DR

1. **The real gate is 3.2.1(viii), not fees.** It says investing apps "should be submitted by the financial institution performing such services" and "must have necessary licensing and permissions" [1]. Blunts is not the institution. Dinari Securities is. 3.1.5(iv) and 5.1.1(ix) say the same thing in crypto and "highly regulated" terms [1].
2. **Apple does approve apps where the brand company submits and a licensed partner does the work.** But almost every investing app on the store has *some* license in its own group (an affiliated RIA or broker-dealer). Pure "introducing partner, no license at all" precedent is thin. The closest live example is **Bitcoin.com Wallet** (seller: Saint Bitts LLC, not a BD), which runs Dinari's embedded trading app for US users [12][16]. Banking fintechs (Chime, Step, Current) are the older precedent for "partner does the regulated part" [12].
3. **What to hand App Review:** a letter from Dinari Securities naming Blunts as its introducing partner, Dinari's CRD number (329672) and BrokerCheck link, the partner agreement excerpt, Form CRS, a list of US states served, and a working demo account. Expect 1–3 rejection loops. No public record shows exactly what Alpaca/DriveWealth partners send **[UNVERIFIED]**.
4. **Apple takes 0% of deposits, trades, sparks and withdrawals.** These are services "consumed outside of the app" (3.1.3(e)) [1]. The US storefront also allows external purchase links without an entitlement [1]. Court-set link-out commission is still being decided (Apple proposed 15% / 10% / 5%) [31]. Even when set, it only touches **digital** goods sold by link, not brokerage.
5. **Apple Pay can fund Blunts, but not through Blunts' own merchant account without approvals.** Apple Pay rules bar transactions involving "the purchase or transfer of currency (including cryptocurrencies) unless approved by Apple" [18]. Stripe lists brokerage, "bank account funding" and crypto wallets as restricted ("contact sales") [20]. **Cleanest path:** Coinbase's Headless Onramp with Apple Pay buys **USDC** straight into the user's Privy wallet. Coinbase is the merchant, has Apple's approval, and USDC is zero-fee [22][23]. Limits apply (US phone, weekly cap, transaction counts).
6. **Apple Pay costs merchants nothing extra from Apple.** Apple charges issuers about 0.15% on credit and half a cent per debit transaction [25]. The merchant still pays normal card processing to its processor.
7. **Sign in with Apple is not strictly required.** 4.8 requires an "equivalent" privacy-friendly login *only if* you use a third-party or social login like Google [1]. Email/phone OTP or passkeys through Privy likely count as your own account system **[interpretation]**. If you add Google, add Sign in with Apple too.
8. **Brand risk is real but manageable.** 1.4.3 bans apps that "encourage consumption of … illegal drugs" [1]. **2.3.8 says icons, screenshots and previews must fit a 4+ rating even if the app is rated higher** [1]. So: no leaves, joints or smoke in the icon or store screenshots. Set the age rating to **18+** (Apple lets you raise it to match your minimum age) [4].
9. **"Cutting Apple in":** there is no way to pay Apple a voluntary revenue share. The cleanest real mechanism is an **optional IAP subscription for purely digital perks**, at 15% under the Small Business Program [33]. Never route deposits, trading fees or advice through IAP.
10. **Don't hide the crypto.** No rule requires crypto words to be hidden. 2.3.1(a) bans "hidden, dormant, or undocumented features" [1]. Use plain words in the UI, but explain tokens, wallet and broker-dealer fully in Review Notes.

---

## 1. Current Guideline text (June 8, 2026) [1]

### 1.1 The rules that matter

| Guideline | Current text (short quote) | What it means for Blunts |
|---|---|---|
| **3.1.1** IAP | "If you want to unlock features or functionality within your app… you must use in-app purchase." Apps may not use their own unlock mechanisms "such as … cryptocurrencies and cryptocurrency wallets." | Deposits and trades are not app features. **Don't gate app features on token holdings** (e.g., "hold a band to unlock gold theme"). That reads as a crypto-wallet unlock. |
| **3.1.1(a)** links | Entitlements "are not required for developers to include buttons, external links, or other calls to action in their United States storefront apps." | US-only app can link to web checkout freely today. |
| **3.1.3** | Other purchase methods allowed; the anti-steering limit applies "except for apps on the United States storefront." | Same point. |
| **3.1.3(e)** | "physical goods or services that will be consumed outside of the app" must use non-IAP methods, "such as Apple Pay or traditional credit card entry." | Brokerage execution and custody are outside services. Apple Pay is explicitly an allowed method. |
| **3.1.5(i)** wallets | "Apps may facilitate virtual currency storage, provided they are offered by developers enrolled as an organization." | Privy embedded wallet = virtual currency storage. Organization account required. |
| **3.1.5(iii)** exchanges | Only "on an approved exchange… where the app has appropriate licensing." | Blunts isn't an exchange. US dShares are non-transferable. Low relevance. |
| **3.1.5(iv)** crypto-securities | "crypto-securities or quasi-securities trading must come from established banks, securities firms, futures commission merchants… or other approved financial institutions." | **Tokenized stocks are crypto-securities.** Same gate as 3.2.1(viii). See §6. |
| **3.1.5(v)** | "Cryptocurrency apps may not offer currency for completing tasks, such as downloading other apps, encouraging other users to download…" | **"Invite a friend, get a free blunt" paid in USDC or dShares is a risk.** See §6. |
| **3.2.1(viii)** | "Apps used for financial trading, investing, or money management should be submitted by the financial institution performing such services and must have necessary licensing and permissions in the locations where you make them available." | The core gate. "Should" (submitter) is softer than "must" (licensing). Blunts must show the licensing sits with Dinari. |
| **4.8** login | See §1.3. | Sign in with Apple only needed if you use Google or another social login. |
| **4.9** Apple Pay | Must "provide all material purchase information to the user prior to sale" and use Apple Pay branding correctly. | Applies to any Apple Pay funding screen. |
| **5.1.1(v)** | "If your app supports account creation, you must also offer account deletion within the app." | Required. Regulated apps may add a support step (see §7). |
| **5.1.1(ix)** | Apps in "highly regulated fields (such as banking and financial services… legal cannabis use… and crypto exchanges)… should be submitted by a legal entity that provides the services, and not by an individual developer." | Organization account. Note the list names **cannabis** too. The brand may make a reviewer think "cannabis app." Say plainly in notes that it is not. |
| **1.4.3** | "Apps that encourage consumption of tobacco and vape products, illegal drugs, or excessive amounts of alcohol are not permitted. Apps that encourage minors to consume any of these substances will be rejected." | Wordplay is fine. Depicting or encouraging smoking is not. |
| **2.3.6** | Answer age questions "honestly." | Answer the drug-reference question truthfully. |
| **2.3.8** | "icons, screenshots, and previews adhere to a 4+ age rating even if your app is rated higher." | **Big one for the brand.** Store art must be clean even at 18+. |
| **2.1(a)** | Include a demo account; a built-in demo mode needs "prior approval by Apple." | KYC-gated app needs a ready, verified demo account. See §7. |
| **2.3.1(a)** | "Don't include any hidden, dormant, or undocumented features." New features must be described "with specificity in the Notes for Review." | Can't hide the crypto rails from Apple. |

### 1.2 How 3.2.1(viii) got stricter

- **Before Feb 2021:** apps could "come from the financial institution… **or** must use a public API offered by the institution" [2].
- **Feb 2021:** the "public API" route was removed [2].
- **June 2021:** "should come from" became "should be submitted by" [3].
- **Now (2026):** adds "must have necessary licensing and permissions in the locations where you make them available" [1].

So "we use their API" is no longer an argument on its own. The argument has to be "the licensed institution performs the service, and here is proof it has authorized us."

### 1.3 Login (4.8): is Sign in with Apple required?

Current rule [1]: if you use "a third-party or social login service (such as Facebook Login, Google Sign-In…)" for the primary account, you must *also* offer "another login service" that:
- limits data to name and email;
- lets users keep their email private;
- doesn't collect interactions for ads without consent.

Sign in with Apple meets all three, but the rule doesn't name it as the only option.

**Exemptions** (no second login needed) [1]:
- "Your app exclusively uses your company's own account setup and sign-in systems."
- Alternative marketplace apps.
- Education, enterprise or business apps with an existing org account.
- Apps using "a government or industry-backed citizen identification system or electronic ID."

| Blunts login setup | Needs an extra login? |
|---|---|
| Email OTP + phone OTP + passkey (via Privy) | Likely **no**. These are Blunts' own account system, just hosted by a vendor **[interpretation; Privy is a vendor, not a social login]** |
| Add "Continue with Google" | **Yes.** Add Sign in with Apple (Privy supports it) |
| Cash App login | Not offered by Cash App as an identity provider **[UNVERIFIED]**. Not relevant |

**Recommendation:** ship email/phone OTP + passkey. If Google is added later, add Sign in with Apple in the same release. Note: Hide My Email relay addresses must still work for KYC notices and statements.

### 1.4 Age rating tiers (current)

Apple's tiers are now **4+, 9+, 13+, 16+, 18+** (13+, 16+, 18+ added July 2025; answers were due Jan 31, 2026) [4].

| Descriptor | Tier it triggers [5] |
|---|---|
| Infrequent alcohol, tobacco or drug use **or references** | **13+** |
| Frequent alcohol, tobacco or drug use or references | **18+** |
| Gambling (real money) | 18+ (not us; don't market "gains" like betting) |
| Social media features | 13+ (questions required since Sept 2026) [6] |

- Apple: "If your app has a policy requiring a higher minimum user age than the rating assigned by Apple, you can set a higher age rating" [4]. **Set 18+.** It matches the brokerage minimum.
- Texas SB 2420 (effective June 4, 2026): apps must use the Declared Age Range API for new Texas accounts and handle parental consent for minors [7]. An 18+ app with KYC age checks is simpler, but still adopt the API **[confirm with counsel what an 18+ app must do]**.
- Precedent: Weedmaps, Leafly and Eaze are live with drug-reference descriptors and a 17+/18+ rating [12]. So drug *references* don't block approval. Encouraging use does.

---

## 2. Precedent: partner-broker apps submitted by the fintech

### 2.1 Who is the App Store "seller" for real investing apps

Seller names are from Apple's own iTunes Search/Lookup API, pulled 2026-09-28 [12].

| App | App Store seller | Licensed entity in the group | Broker / clearing | Pattern |
|---|---|---|---|---|
| Robinhood | Robinhood Markets Inc | Robinhood Financial LLC (BD) | Self-clearing | Parent submits; affiliate BD |
| Acorns | Acorns Grow Incorporated | Acorns Advisers (RIA), Acorns Securities (BD) | Partner clearing | Parent submits |
| Stash | Stash Financial, Inc. | Stash Investments (RIA) **[UNVERIFIED current structure]** | Partner clearing | Parent submits |
| Public | Open to the Public Investing, Inc. | Same entity is the BD | Partner clearing | BD submits |
| Titan | Titan Global Capital Management, Inc. | Titan is an RIA | Partner BD | RIA submits |
| **dub** | DASTA Incorporated | dub Advisors (RIA), dub Financial / DASTA Financial (BD) | Apex Clearing [13] | Parent submits; now has own BD |
| **Composer** | Composer Technologies Inc. | Composer Tech (RIA), Composer Securities (BD) | Alpaca + Apex [14] | Started as RIA on Alpaca; now has own BD |
| **Autopilot** | Iris Social Stock App Inc. | Autopilot Advisers (RIA) [15] | Connects to users' own brokers | RIA affiliate |
| **Bitcoin.com Wallet** | Saint Bitts LLC | **None found** — Dinari Securities is the BD | Dinari | **Closest to Blunts.** Non-BD brand runs Dinari's embedded trading app for US users on iOS [16] |
| Axal | Lockbox Technologies Inc. | None found (stablecoin yield) | — | Funds with Apple Pay into USDC [17] |
| Chime, Step, Current | Chime Financial Inc., Step Mobile Inc, Finco Services Inc. | Partner banks hold the license | Bank partners | Classic "fintech submits, partner bank licensed" |

**What this shows:**
- Apple accepts a **parent or brand company** as seller. It doesn't insist the BD's own legal name appears.
- For **investing**, nearly every example owns at least an RIA. dub and Composer later built their own BDs.
- **Bitcoin.com is the only live example found of a non-licensed brand offering Dinari dShares to US users inside an iOS app** [16]. It launched around Aug 2026. Its App Store description (version of 2026-09-21) does not mention stocks at all [12]. That may mean the feature went in quietly, or runs in a Dinari-hosted web view. **Don't copy the silence** (2.3.1(a)); copy the embedded-app structure.
- Dinari's other named US launch partners (Monaco, Eldora, Kredete, Yield.xyz, Liminal, Para, Privy, Axal) [16] are mostly infra or crypto apps. None found clearly offering dShares to US users in a consumer iOS app **[UNVERIFIED]**.

### 2.2 Documented rejections under 3.2.1(viii)

Apple's rejection letters are rarely published. What is public:

| Case | Rejection | What Apple asked for | Outcome |
|---|---|---|---|
| Loan app, 2018 [8] | "the seller and company names associated with your app do not reflect the financial institution in the app or its metadata" | Business license, finance permit, **license numbers in Review Notes**, T&Cs, dispute-resolution process | Told the institution must submit under its own account. No resolution posted |
| Plaid + multi-lender loan app [9] | "any app offering financial services must be submitted by the financial institution performing such services" | — | Unresolved. Aggregating many lenders was the problem |
| Money-movement app (pre-submission question) [10] | — | Community reply: expect rejection unless a financial institution submits | No follow-up |
| Zable (Lendable, FCA-regulated), 2025 [11] | Domains on the product page "not clearly under your control" | Prove brand ↔ legal entity ↔ domain link | Approved after **7 rejections**, with no changes, after escalation |

**Lessons:**
1. **Name match matters.** Brand "Blunts," seller "[Blunts legal entity]," website domain, and privacy policy domain should all line up. DBAs aren't accepted as seller names [34].
2. **Put license numbers in Review Notes up front.** Apple asks for them anyway.
3. **One partner, clearly named.** Multi-provider aggregation got rejected. Blunts has one BD (Dinari). Keep it that way at launch.
4. **Budget for loops and escalation.** Zable needed seven rounds. Use the App Review Board appeal and request a call.

### 2.3 What to put in the App Review packet

No public source shows the exact packet Alpaca/DriveWealth/Dinari partners send **[UNVERIFIED]**. Based on what Apple asked for in the cases above:

| Item | Source | Why |
|---|---|---|
| **Authorization letter from Dinari Securities LLC**, on letterhead, signed by an officer: names Blunts' legal entity and app, states Dinari is the BD executing, custodying and doing KYC, and that Blunts is its introducing/referral partner | Ask Dinari | Directly answers "submitted by the financial institution" |
| Dinari Securities **CRD 329672**, BrokerCheck link, SEC file number | BrokerCheck (see 04 [D8]) | Apple asks for license numbers |
| Dinari **Form CRS** and customer agreement links, shown in-app | 04 [D9] | Shows who the customer's broker is |
| Partner agreement excerpt (the "no BD registration needed for partner" clause) | Dinari US guide (04 [D1]) | Shows the licensing sits with Dinari |
| State availability list and US-only statement | Dinari | "licensing… in the locations where you make them available" |
| Short memo: Blunts never holds customer funds (non-custodial Privy wallet; Dinari settles) | Counsel | Pre-empts money-transmitter questions |
| FINRA 2210 approval of screenshots and description by Dinari | Dinari (12, item 14) | Dinari requires pre-review anyway |
| If Blunts registers as an RIA (per 04 §5 / 12): Form ADV, CRD/IARD number | SEC IAPD | Strongest possible answer. Every investing precedent above has at least this |

**Structural tip:** render trade tickets, confirmations and account documents with **Dinari's hosted/embedded trading UI** where possible (as Bitcoin.com does) [16]. Then the regulated screens are visibly Dinari's service inside Blunts' app. Ask Dinari whether its other partners passed App Review this way and whether it will give a reference contact.

---

## 3. Apple Pay for funding

### 3.1 Is it allowed?

| Question | Answer | Source |
|---|---|---|
| Does the App Review Guidelines allow Apple Pay for services outside the app? | Yes. 3.1.3(e) names Apple Pay as an allowed method | [1] |
| Any Apple Pay content bans? | Apple Pay on the Web bars transactions involving "tobacco, marijuana, or vaping products," illegal drugs, "drug paraphernalia," and "the purchase or transfer of currency (including cryptocurrencies) unless approved by Apple." Also bans "staged digital wallet" setups | [18] |
| Same list for in-app Apple Pay? | The in-app terms sit in the Developer Program License Agreement. Likely similar **[UNVERIFIED; DPLA text not checked]** | — |
| Can the Blunts merchant account take Apple Pay to fund dShares or buy USDC? | Only with **Apple approval** (currency/crypto clause) **and** processor approval | [18][20] |
| Brand issue? | Blunts sells no marijuana. But the "marijuana / paraphernalia" line means **the Apple Pay sheet and merchant name must not look like a weed shop.** Use a neutral merchant display name | [18] |

### 3.2 Who uses Apple Pay for funding today

| App | Apple Pay funding? | Notes |
|---|---|---|
| **Coinbase** | Yes. Buy crypto with Apple Pay (debit) in app and in partner apps via Onramp | [23] |
| **Cash App** | Yes. Help page "Add money with Apple Pay or Google Pay"; you can't use a Cash Card inside Apple Pay to add to itself | [27] (help-page summary only; page didn't render) |
| **Robinhood** | Reported July 2024: instant deposits via Apple Pay, debit only | [26] (secondary). Robinhood's deposit help page lists debit card, not Apple Pay by name **[partly verified]** |
| **Axal** (Dinari launch partner) | Yes. "Fund in seconds with Apple Pay" into USDC | [17] |
| **Acorns** | No Apple Pay funding found. Its debit card can be added to Apple Pay | **[UNVERIFIED]** |
| **Venmo** | No Apple Pay add-money. Venmo card can go in Apple Wallet | **[UNVERIFIED — community sources]** |

### 3.3 Costs

- **Apple charges merchants nothing.** Card issuers pay Apple about **0.15% of credit** purchases and **half a cent per debit** transaction. This fee is the subject of an issuer class action certified Sept 23, 2026 [25].
- **The merchant still pays card processing.** Apple Pay is just a card-on-file token. The processor (Stripe, Adyen, Checkout.com) charges normal card rates. Stripe's US list rate is about 2.9% + 30¢ **[UNVERIFIED current rate]**. Debit is cheaper at the network level, but processors often charge the same blended rate.
- **Chargeback risk:** card-funded investment deposits are a fraud magnet (buy, sell, charge back). Processors treat them as high risk.
- **Processor policy:** Stripe (list updated 2026-09-22) puts "Investment and brokerage services," "Bank account funding" and "Cryptocurrency… exchanges and wallets" under restricted, "contact our sales team" [20]. Not banned, but needs approval.

### 3.4 Recommended Apple Pay path

**Don't be the merchant. Let an approved on-ramp be the merchant.**

```
Apple Pay (debit) → Coinbase Headless Onramp (merchant of record, Apple-approved)
   → USDC on Base/Arbitrum → user's Privy wallet → Dinari buy
```

- Coinbase **Headless Onramp** supports Apple Pay in iOS apps through a WKWebView, with a native-feeling flow [22].
- **USDC on/off-ramp is zero-fee** on Coinbase Onramp [23].
- Limits and requirements [21][22]:
  - US users with a real US mobile number (no VoIP).
  - Email and phone must be verified before creating the order.
  - A weekly dollar cap (the older hosted flow said $500/week for non-Coinbase users).
  - Count limits: 10 per day and **15 lifetime** transactions. Coinbase's June 2026 update headline says "Unlimited Lifetime Limits" **[conflicting; confirm with Coinbase]**.
  - $5 minimum.
  - The user must physically tap the Pay button.
- The old hosted "guest checkout" (debit/Apple Pay) widget was **discontinued June 30, 2026**. Use Headless [21].
- Privy's funding hooks also route card/Apple Pay onramps (Stripe, MoonPay, Coinbase, Meld). **On React Native only MoonPay and Coinbase are supported today** [24].
- Keep Cash App USDC and bank (Plaid/ACH) as the main rails. Apple Pay is the "first blunt in 30 seconds" path, capped.

Note the "staged digital wallet" clause [18]. That's aimed at merchants who re-sell a second transaction. Here the user buys USDC from Coinbase and owns it. Then they separately buy dShares from Dinari. That should be fine. But confirm with Coinbase that its Apple approval covers delivery to a third-party app wallet **[UNVERIFIED]**.

---

## 4. Epic v. Apple and Apple's cut (status Sept 28, 2026)

| Date | Event |
|---|---|
| 2025-04-30 | District court bars any commission on link-out purchases (0%) (see 04 §B.2) |
| 2025-12-11 | Ninth Circuit mostly affirms; Apple may seek *some* commission; remanded |
| 2026-06-30 | Supreme Court grants review, limited to the civil-contempt standard [30][32] |
| 2026-08-11 | Judge Gonzalez Rogers refuses to pause the fee proceedings [28] |
| 2026-08-12 | Justice Kagan grants a 2-day administrative stay [29] |
| 2026-08-13/14 | Apple files its proposal: **15%** standard, **10%** Video/News Partner programs, **5%** Small Business; Kagan then **denies** a longer stay [30][31] |
| 2026-09-14 | Apple files its Supreme Court merits brief [32] |

**Where it stands today:**
- The Guidelines still say US storefront apps may link out with no entitlement [1]. Commission on link-outs is effectively **0% until the district court sets a rate** **[confirm no interim rate has taken effect]**.
- Whatever rate is set applies to **digital goods and services** sold via link. It doesn't touch brokerage.

**Apple's take on Blunts' money flows:**

| Flow | Apple cut | Why |
|---|---|---|
| Deposits (Cash App USDC, bank, Apple Pay via Coinbase) | **0%** | Not an app feature; 3.1.3(e) |
| Buying/selling dShares, "spark" fee charged by the BD | **0%** | Service outside the app, performed by a BD |
| Withdrawals | **0%** | Same |
| Subscription for digital app features sold via IAP | 15% (Small Business) / 30% | 3.1.1 |
| Same subscription sold via US web link | 0% now; likely 5–15% later | Epic remand [31] |

---

## 5. "Cutting Apple in" voluntarily

**There is no mechanism to send Apple a voluntary revenue share.** Apple only collects through IAP commissions, ad spend, and (indirectly) Apple Pay issuer fees.

| Option | Apple gets | Pros | Cons |
|---|---|---|---|
| **A. Optional "Blunts Club" IAP subscription** for digital perks only (themes, app icons, stash stats, education, early features) | **15%** under the Small Business Program (≤ $1M prior-year proceeds, all associated accounts combined) [33] | Real, clean, Apple-sanctioned. Shows good faith to App Review | Must give "ongoing value" (3.1.2(a)). Must **not** include advice, fee discounts or anything brokerage-related. That would mix an advisory/commission fee with IAP and trigger FINRA/SEC questions |
| **B. IAP "tip jar"** (consumable) | 15% | 3.1.1 explicitly allows tips "to the developer" via IAP [1] | Small revenue. Tips can't unlock anything |
| **C. Apple Pay as a funding option** (via Coinbase) | ~0.15% credit / $0.005 debit, **paid by issuers** [25] | Zero cost to Blunts | It's not really "from" Blunts |
| **D. Apple Search Ads** | 100% of spend | Money goes to Apple and buys installs | It's marketing, not a revenue share |
| E. Route spark fees through IAP | — | — | **Don't.** Brokerage commissions must be charged by the BD (see 04 §A, 12). IAP can't carry securities transactions |

**Recommendation:** **Option A.** Launch a small optional IAP subscription (say $2.99/mo) with cosmetic and educational perks only. Enroll in the Small Business Program before the first sale. Add Apple Pay (Option C) as a funding convenience. Keep all trading and spark fees with Dinari.

---

## 6. Crypto and wallet specifics

| Rule | Does Blunts pass? | Action |
|---|---|---|
| **3.1.5(i)** wallet only from an organization account | Yes, if enrolled as an organization | Enroll as an org (needs D-U-N-S) |
| **3.1.5(iv)** crypto-securities "must come from established… securities firms… or other approved financial institutions" | **Not on its own.** The securities firm is Dinari. Same gate as 3.2.1(viii) | Same packet as §2.3. Frame it as "a Dinari Securities brokerage account, delivered in the Blunts app." RIA registration makes it much stronger |
| **3.1.5(iii)** exchange licensing | N/A. Not an exchange; US tokens are non-transferable | Say so in notes |
| **3.1.5(v)** no currency for tasks | **Risk** if referral rewards or "streak" rewards are paid in USDC or dShares | Launch without crypto-paid referral rewards. If you want referrals, use a fee credit, or have Dinari run a securities promotion it approves **[interpretation]** |
| **3.1.1** no unlocking features with crypto wallets | Risk if perks are tied to holdings | Don't gate app features on balance. Tiers can be *labels* ("you've got a band") but shouldn't unlock features |

**Do we have to hide crypto words?** No.
- No guideline asks you to avoid crypto vocabulary.
- 2.3.1(a) forbids "hidden, dormant, or undocumented features." Hiding the token rails from Apple risks removal and account termination [1].
- The **UI** can still be plain English ("your stash," "buy a blunt of QQQ"). That's good UX and helps FINRA 2210 review. But:
  - the App Store description should say it's tokenized stock via Dinari Securities, held in the user's own wallet;
  - Review Notes should explain the wallet, USDC funding and the BD in plain terms.

---

## 7. iOS submission checklist

### 7.1 Before you build the listing

| # | Item | Detail |
|---|---|---|
| 1 | **Legal entity** | A corporation or LLC. The legal name shows as the App Store seller. **No DBAs** [34] |
| 2 | **D-U-N-S number** | Free from Dun & Bradstreet; can take days to weeks. Legal name and address must match exactly [34] |
| 3 | **Apple Developer Program — Organization** | $99/yr. Enroller must have legal binding authority. Needs a real website on the company domain and a domain email [34] |
| 4 | **Domain alignment** | Company domain = website = privacy policy = support URL. Avoid the Zable problem [11] |
| 5 | **Small Business Program** | Enroll before any IAP (15%) [33] |
| 6 | **Dinari packet** | Letter, CRD, Form CRS, agreement excerpt, state list (§2.3) |
| 7 | **FINRA 2210 sign-off** | Dinari pre-approves description, screenshots, preview video, push copy |

### 7.2 App Store Connect fields

| Field | What to enter |
|---|---|
| Category | Finance |
| Availability | **United States only.** Remove NY if Cash App USDC can't serve it, or keep NY with bank-only funding. Say which in notes |
| Age rating | Answer truthfully (drug references: "infrequent" if limited to wordplay → 13+). Then **raise to 18+** to match the account minimum [4][5]. Answer the social media questions (required since Sept 2026) [6] |
| Privacy label | Contact info (name, email, phone, address); Financial info (payment info, other financial info); Identifiers (user ID, device ID); Other data (SSN/government ID, if the KYC SDK runs in-app); **biometric** under Sensitive Info if selfie/liveness runs in-app. Third-party SDKs count [35]. KYC is core functionality, so the "optional disclosure" carve-out doesn't apply |
| Tracking | Don't send balances, fills or wallet addresses to ad SDKs. Prefer no ATT prompt at all (see 12, item 28) |
| Account deletion | In-app deletion entry point. Regulated apps "may use additional customer service flows to confirm and facilitate" deletion. Retain books and records as law requires [36] |
| Description | Plain English. Include: "Brokerage services by Dinari Securities LLC, member FINRA/SIPC." Tokenized, non-transferable, US only. No return promises |
| Screenshots / icon | **4+ safe** (2.3.8). No leaves, joints, smoke, rolling papers or "high" jokes. Money slang in text is fine ("Stack your first blunt: $100 of QQQ") **[judgment call]** |
| App name / subtitle | 30-character limit. No price claims or unverifiable claims in the subtitle (2.3.7) [1] |

### 7.3 Review Notes (template outline)

1. **What the app is:** "Blunts lets US adults buy and sell QQQ exposure in $100 units. Brokerage, KYC, execution and custody are provided by **Dinari Securities LLC** (FINRA/SIPC, CRD 329672). Blunts is Dinari's introducing partner and does not hold customer funds or securities."
2. **Brand note:** "'Blunt' is money slang for $100. The app has no cannabis content, sales or encouragement of drug use. It is rated 18+ to match the account minimum."
3. **Crypto note:** "Holdings are dShares™, tokenized US equities issued via Dinari, held in a non-custodial embedded wallet (Privy). US dShares are non-transferable. Funding is USDC (Cash App or Coinbase Onramp with Apple Pay) or bank."
4. **Guideline map:** list 3.2.1(viii), 3.1.5(i)/(iv), 5.1.1(ix), 3.1.3(e), each with one line on how it's met.
5. **Attachments:** Dinari letter, BrokerCheck link, Form CRS link, state list.
6. **Demo account:** see below.
7. **Contact:** a named person with a phone number, available in US hours.

### 7.4 Demo account for a KYC-gated app

- 2.1(a): provide an **active demo account**. A built-in demo mode needs "prior approval by Apple" [1].
- Make a **pre-verified** account in production with a small real balance (e.g., one blunt). Or point that one account to Dinari sandbox by a server flag **[confirm Dinari allows this]**.
- Skip KYC for the demo login, but let the reviewer *see* the KYC screens (a "preview onboarding" path).
- Make sure a reviewer outside the US can use it (no geo-block on the demo account; turn off VPN/IP checks for it).
- Make sure funding screens work in review: show the Apple Pay sheet, but cap the demo account so nothing real is spent. Or explain in notes why a live payment can't be tested.
- Keep backend services live during review [1].

### 7.5 Expected friction and fixes

| Likely rejection | Fix |
|---|---|
| 3.2.1(viii) / 5.1.1(ix) "must be submitted by the financial institution" | Reply with the Dinari packet. Ask for a call. Appeal to the App Review Board. Longer term: register as an RIA (see 04 §5, 12) |
| 3.1.5(iv) crypto-securities | Same packet. Stress "securities firm = Dinari Securities" |
| 1.4.3 / 2.3.8 drug references | Remove imagery from store art. Keep in-app references to wordplay |
| 2.1 can't log in / can't complete KYC | Pre-verified demo account; clear steps in notes |
| 4.8 login | Add Sign in with Apple if any social login exists |
| 3.1.1 "features unlocked without IAP" | Make sure no app feature is gated by balance or by a web purchase |

---

## Sources

1. Apple App Review Guidelines (Last Updated June 8, 2026): https://developer.apple.com/app-store/review/guidelines/
2. App Store Review Guidelines History, Feb 2, 2021 (public-API clause removed): https://www.appstorereviewguidelineshistory.com/articles/2021-02-02-app-tracking-transparency-and-more/
3. App Store Review Guidelines History, June 7, 2021 ("should be submitted by"): https://www.appstorereviewguidelineshistory.com/articles/2021-06-07-wwdc-2021/
4. Apple Developer News, "Updated age ratings in App Store Connect" (July 24, 2025): https://developer.apple.com/news/?id=ks775ehf
5. App Store Connect Help, Age ratings values and definitions: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/
6. Apple Developer News, social media age-rating questions: https://developer.apple.com/news/?id=tlur8uvi
7. Apple Developer News, Texas requirements: https://developer.apple.com/news/?id=btkirlj8 ; MacRumors (June 3, 2026): https://www.macrumors.com/2026/06/03/apple-app-store-texas-sb-2420/
8. Apple Developer Forums, 3.2.1 loan-app rejection: https://developer.apple.com/forums/thread/100042
9. Apple Developer Forums, 3.2.1(viii) Plaid/lender rejection: https://developer.apple.com/forums/thread/118805
10. Apple Developer Forums, 3.2.1(viii) money-movement question: https://developer.apple.com/forums/thread/704470
11. Apple Developer Forums, Zable/Lendable 3.2.1(viii): https://developer.apple.com/forums/thread/775803
12. Apple iTunes Search/Lookup API (seller names, ratings, descriptions; pulled 2026-09-28), e.g. https://itunes.apple.com/lookup?id=1252903728&country=us (Bitcoin.com), id=1598920501 (dub), id=6471564746 (Composer), id=6752484843 (Axal), id=1613625799 (Autopilot); search https://itunes.apple.com/search?term=weedmaps&entity=software&country=us
13. dub disclosures: https://support.dubapp.com/hc/en-us/articles/18043799243931-In-App-Disclaimers ; App Store: https://apps.apple.com/us/app/id1598920501
14. Composer App Store listing: https://apps.apple.com/us/app/composer-by-sofi/id6471564746 ; Alpaca blog: https://alpaca.markets/blog/composer-partners-with-alpaca-broker-api/
15. Autopilot Advisers, SEC IAPD: https://adviserinfo.sec.gov/firm/summary/331749
16. Dinari powers Bitcoin.com US launch: https://news.bitcoin.com/branded-spotlight/dinari-powers-bitcoin-coms-u-s-launch-of-tokenized-equities/ and https://dinari.com/blog/dinari-powers-bitcoin-coms-u-s-launch-of-tokenized-equities ; KuCoin summary: https://www.kucoin.com/news/flash/bitcoin-com-launches-tokenized-u-s-stocks-and-etfs-via-dinari-supports-724-assets ; Dinari US launch partners: https://thedefiant.io/news/tradfi-and-fintech/dinari-opens-724-tokenized-us-stocks-to-eligible-us-investors
17. Axal App Store listing: https://apps.apple.com/us/app/id6752484843
18. Apple Pay on the Web Acceptable Use Guidelines: https://developer.apple.com/support/terms/apple-pay-acceptable-use-guidelines-for-websites
19. Apple Pay planning (tokens, PSPs): https://developer.apple.com/apple-pay/planning/
20. Stripe Prohibited and Restricted Businesses (updated 2026-09-22): https://stripe.com/legal/restricted-businesses
21. Coinbase-hosted Onramp overview (guest checkout ends June 30, 2026): https://docs.cdp.coinbase.com/onramp/coinbase-hosted-onramp/overview
22. Coinbase Headless Onramp overview: https://docs.cdp.coinbase.com/onramp/headless-onramp/overview ; June update: https://www.coinbase.com/developer-platform/discover/launches/headless-onramp-h2 ; mobile demo: https://github.com/coinbase/onramp-v2-mobile-demo
23. Coinbase zero-fee USDC: https://www.coinbase.com/developer-platform/discover/launches/zero-fee-usdc ; TechCrunch (Dec 2, 2024): https://techcrunch.com/2024/12/02/coinbase-now-lets-you-buy-crypto-with-apple-pay-in-third-party-apps
24. Privy card onramps: https://docs.privy.io/wallets/funding/fiat-onramp
25. AppleInsider, Apple Pay issuer-fee class certified (Sept 25, 2026): https://appleinsider.com/articles/26/09/25/thousands-of-banks-can-now-sue-over-apple-pay-fees-in-one-antitrust-case ; MacRumors: https://www.macrumors.com/2026/09/25/apple-pay-antitrust-lawsuit-advances/
26. Appleosophy, Robinhood Apple Pay instant transfers (July 10, 2024): https://appleosophy.com/2024/07/10/robinhood-app-now-gives-option-to-do-instant-transfers-via-apple-pay/ ; Robinhood deposits: https://robinhood.com/us/en/support/articles/deposit-money-into-your-robinhood-account/
27. Cash App, Add money with Apple Pay or Google Pay: https://cash.app/help/90140-add-money-with-apple-pay-or-google-pay
28. Courthouse News (Aug 11, 2026): https://www.courthousenews.com/apples-fight-over-commissions-for-linked-out-app-store-purchases-continues-in-federal-court/
29. 9to5Mac, temporary stay (Aug 12, 2026): https://9to5mac.com/2026/08/12/apple-wins-temporary-supreme-court-pause-in-epic-games-proceedings/
30. MacDailyNews, stay denied (Aug 14, 2026): https://macdailynews.com/2026/08/14/u-s-supreme-court-clears-path-for-app-store-commission-showdown-as-apple-must-defend-its-rates-in-lower-court/
31. 9to5Mac, Apple proposes up to 15% (Aug 13, 2026): https://9to5mac.com/2026/08/13/apple-proposes-commissions-of-up-to-15-for-off-app-store-purchases-in-the-us/ ; Michael Tsai: https://mjtsai.com/blog/2026/08/17/apple-proposes-15-external-purchase-fee/
32. MacDailyNews, merits brief (Sept 15, 2026): https://macdailynews.com/2026/09/15/apple-asks-u-s-supreme-court-to-vacate-app-store-contempt-finding-arguing-it-never-violated-the-orders-text/ ; AppleInsider (Sept 14, 2026): https://appleinsider.com/articles/26/09/14/apple-standing-its-ground-in-epics-app-store-fee-suit ; Mac Observer on the narrow question: https://www.macobserver.com/news/supreme-court-apple-epic-appeal-question-1-narrow/
33. App Store Small Business Program: https://developer.apple.com/app-store/small-business-program/
34. Apple Developer Program enrollment (organization, D-U-N-S, no DBAs): https://developer.apple.com/programs/enroll/
35. App privacy details: https://developer.apple.com/app-store/app-privacy-details/
36. Offering account deletion in your app: https://developer.apple.com/support/offering-account-deletion-in-your-app/
