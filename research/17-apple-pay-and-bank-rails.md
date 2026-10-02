# 17: Apple Pay, debit card and bank rails for users without Cash App crypto (incl. New York)

**Date:** 2026-09-28 | **Status:** Research memo, not legal advice. **[UNVERIFIED]** marks anything I couldn't confirm on a primary page during this pass. Citations like [CB1] point to the Sources list at the end.
**Builds on:** `01-onramps-offramps.md` (provider survey), `09-cash-app-rails.md` (Path A: Cash App USDC ↔ Privy ↔ Dinari) and `10-plaid-bank-fallback.md` (zerohash as the bank rail, Plaid details, Bridge's NY exclusion). This memo doesn't repeat that material. It checks it against 2026 primary docs and adds what's new or corrected.

---

## TL;DR

1. **Correction to 01 and 10: Coinbase's Headless Onramp is still guest checkout. It needs no Coinbase account.** Only the Coinbase-*hosted widget's* guest checkout shut down on 2026-06-30 [CB1][CB2].
   - Headless flow: US users with a real (non-VoIP) US mobile number. Blunts verifies the phone and email and passes them in. The user pays with **Apple Pay or Google Pay (debit only)**. Coinbase sends USDC to **any wallet address Blunts sets** [CB2][CB3].
   - It runs in an iOS webview, an Android WebView or a web iframe [CB2].
   - Limits: **$500 a week and 15 purchases in total**. After that, a one-screen upgrade (date of birth + last 4 of SSN) raises the limit to **up to $2,500 a week with no cap on the number of purchases**. The upgrade is permanent [CB4][CB5]. Minimum purchase is about $5 [CB1].
   - **Coinbase Offramp still needs a Coinbase account with a linked bank** [CB1].
2. **Zero-fee USDC is no longer automatic.** At launch Coinbase said all Onramp/Offramp integrators got 0% on USDC [CB6]. The current FAQ says it's "available to select partners through a subsidy program for eligible partners" [CB1]. **Apply now.** Without it, US debit/Apple Pay pricing isn't published; get it from the Buy Quote API **[UNVERIFIED; likely about 2.5–4% + spread]**.
3. **Stripe now delivers USDC on Arbitrum, but not in New York.** This corrects 10, which said "no USDC on Arbitrum."
   - Stripe's newer **Embedded Components** onramp (native iOS, Android, React Native and web SDKs) lists **USDC (Arbitrum)**. It takes Apple Pay, Google Pay, debit, credit and ACH. Stripe is merchant of record and takes "full liability for all fraud and disputes." It is "**not available in the state of New York**" [S1][S2].
   - The older hosted and embedded widgets **do** serve NY, but only for USDC on Ethereum, Base or Solana, with no Arbitrum. They also exclude Hawaii [S3][S4].
   - The user needs a **Stripe Link account** and Stripe's own KYC tiers. Level 1 needs date of birth and SSN, and Blunts can submit these for the user [S5]. Pricing is still private.
4. **Privy's "built-in" funding is just other providers.**
   - **Card:** routes to **Stripe, Meld, MoonPay or Coinbase** on web (React). React Native gets only MoonPay and Coinbase. Privy says there are "no fees or monthly minimums" [PV1]. Stripe via Privy excludes NY [PV1].
   - **Bank:** "bank deposits" and payouts (launched 2026-09-01) are **Bridge** virtual accounts [PV2][PV3]. **Bridge still excludes NY** [B1].
5. **For bank transfers in both directions, one-tap, in all 50 states *including NY*: zerohash is still the only fit.**
   - It has money-transmitter licenses in 51 jurisdictions and an NYDFS license. It can resell Plaid, so Blunts needs no Plaid contract.
   - Deposits: an **ACH pull** after the user links the bank once. zerohash also offers **per-user virtual accounts** that take ACH, wire, RTP or FedNow and auto-convert to stablecoin into a whitelisted wallet [Z1][Z2].
   - Withdrawals: **RTP/FedNow in seconds, 24/7** [Z1]. Pricing is private (spread plus platform fees set per deal) [Z3][Z4].
   - **Bridge is cheaper and simpler outside NY.** Bridge FedNow payouts cost **$0.50 per transfer** for existing developers and **$1.00** for new ones (launched 2026-08-17). Fixed fees by rail on virtual-account deposits have been in beta since 2026-04 [B2]. But deposits are push-only (the user sends money to Bridge), and NY is excluded.
6. **Instant cash to a debit card (Visa Direct):** there's no cheap, licensed "USDC → user's debit card" API Blunts can call without a Coinbase or MoonPay account for each user.
   - **Cheapest route:** withdraw USDC to the user's Cash App for free, then the user taps Cash App's Instant transfer (**0.5–1.75%, $0.25 minimum**, the user pays) [CA1].
   - For NY and non-Cash-App users: **MoonPay sell-to-card** (1% with a $3.99 minimum; card pushes land in about 1 hour) [M2][M3], or ask zerohash about card payouts. The 2026-08-05 zerohash × Visa Direct deal is about *funding* Visa Direct with stablecoins, not a consumer cash-out API [Z5] **[UNVERIFIED whether a push-to-card payout is offered to platforms]**.
7. **Dinari: still no ACH or USD funding for US accounts.** The US guide still has the one line "pre-funded (via ACH) or just-in-time funded". The only fiat path is a **Funding Facilitation Account (FFA)** for licensed money transmitters, funded by wire. The doc index has no ACH, bank or Plaid endpoint [D1][D2].
   - **New:** Dinari lists **Base** (plus Ethereum, Avalanche and Arbitrum) as supported chains [D3]. That opens a NY card path through Stripe's older widget (USDC on Base) **[UNVERIFIED that a Blunts user's Dinari account can be on Base while others are on Arbitrum]**.

**The stack in one line:** Cash App USDC (non-NY) → **Coinbase Headless Apple/Google Pay** (everyone, incl. NY if the Buy Options API says so) → **zerohash** bank in/out (everyone, incl. NY) → Bridge via Privy as a cheaper non-NY bank option → MoonPay only as the last-resort NY card and cash-out fallback.

---

## 1. Apple Pay / Google Pay / debit card → USDC on Arbitrum in the user's own wallet

### 1.1 Comparison

| | **Coinbase Headless Onramp** ⭐ | **Stripe Embedded Components** | Stripe hosted / old embedded widget | **MoonPay** | **Transak** | **zerohash (card via PSP)** | **Privy funding** | **Bridge** |
|---|---|---|---|---|---|---|---|---|
| Apple Pay / Google Pay | **Both** (`GUEST_CHECKOUT_APPLE_PAY`, `…_GOOGLE_PAY`) [CB3] | Both, plus debit, credit, ACH [S1] | Both (through Link) [S3] | Both | Both (secondary) [T2] | Through *Blunts'* own card processor (payment service provider) [Z6] | Routes to Stripe / Coinbase / MoonPay / Meld [PV1] | **No card rail** |
| Coinbase/Stripe/etc. account needed? | **No.** Guest checkout; Blunts passes a verified phone and email [CB2][CB3] | **Yes: a Stripe Link account** (email/phone OTP, can be done in-app) [S2] | Link account | MoonPay account | Transak account | No (Blunts is the merchant) | Depends on provider | — |
| USDC on **Arbitrum** | Supported network per Coinbase generally; confirm with the Buy Options API **[UNVERIFIED for the headless enum]** | **Yes**, "USDC (Arbitrum)" [S2] | **No** (Ethereum, Base, Solana, Polygon, Avalanche, Stellar) [S3] | Yes | Yes (secondary) [T2] | Yes (zerohash lists Arbitrum USDC; 10) | Via Stripe/Coinbase/MoonPay [PV1] | — |
| **New York** | Coinbase has a BitLicense. The Buy Options API takes a `subdivision` (state) param [CB7]. **Call it with `NY` to confirm [UNVERIFIED]** | **No** ("not available in the state of New York") [S2] | **Yes** for USDC on Ethereum/Base/Solana. **No Hawaii** [S3][S4] | **Yes** (BitLicense, all 50 states) [M1] | **No** (NY, HI, LA and others excluded; secondary) [T1] | **Yes** (NYDFS) [Z7] | Stripe route: no NY [PV1] | No NY [B1] |
| Platforms | iOS webview, Android WebView, web iframe. App2App deeplinks since June 2026 [CB2][CB5] | **Native iOS, Android, React Native and web SDKs** [S2] | Web / webview redirect | Web / webview widget | Web / webview widget | Whatever the PSP supports | React (web) gets Stripe routing; **React Native gets only MoonPay and Coinbase** [PV1] | — |
| KYC on top of Dinari's | **Light.** Phone + email (Blunts verifies them). Upgrade = DOB + SSN last 4 [CB4] | Link sign-in + **L0** (name, address, phone, email) → **L1** (+DOB, SSN) → **L2** (+ID, selfie). **Blunts can submit L0/L1 data through `attachKYCInfo`** [S5] | Prefill everything except SSN [S4] | **Full MoonPay KYC** (a second full KYC) | Full Transak KYC | **Reuses Blunts' KYC** (platform-submitted) [10] | Provider's | — |
| Limits | $500/wk and 15 lifetime → **up to $2,500/wk, unlimited count** after upgrade. Min about $5 [CB1][CB4] | Set by KYC tier; amounts not published [S5] | Not published | Tiered | Tiered | Set by Blunts and the PSP | Provider's | — |
| Who eats chargebacks | Coinbase is the seller in guest checkout **[UNVERIFIED; confirm in contract]** | **Stripe:** "assumes full liability for all fraud and disputes" [S1] | Stripe [S4] | MoonPay (merchant of record) | Transak | **Blunts.** The PSP withholds chargebacks from daily settlement, and Blunts must keep a float [Z6] | Provider's | — |
| Fee to user/Blunts | **0% if in the zero-fee USDC subsidy**; else not published (quote API) [CB1] **[UNVERIFIED about 2.5–4%]**. No developer or monthly fee [CB1][CB5] | Private. Secondary estimate: about 1.5% + $0.30 **[UNVERIFIED]**. The docs' sample quote shows about 3% plus network fee [S4] | Same | **4.5% card, $3.99 minimum** (secondary) [M4] | About 3.5% card, minimum fee applies (secondary) [T2] | PSP card fees (about 2.9% + $0.30) + zerohash spread + chargeback risk **[UNVERIFIED]** | "No fees or monthly minimums" from Privy [PV1] | — |

### 1.2 What this means

- **Coinbase Headless is the best Apple Pay rail.** The KYC is the lightest, it takes Apple Pay and Google Pay, it can deliver to any address, it works in a webview, and it may be free.
  - **Build the webview/iframe flow yourself.** Don't go through Privy's Coinbase option. Privy React Native likely uses the Coinbase *hosted* widget, which lost guest checkout **[UNVERIFIED]**.
  - **Upgrade step:** at the 15th purchase or $500/wk, ask for DOB + SSN4. Coinbase says to collect it, submit it and discard it; don't store it [CB4]. Dinari's Managed KYC is hosted, so Blunts probably doesn't hold the SSN and must ask once more.
- **Stripe Embedded Components is the best native-iOS/Android fallback outside NY.**
  - Pros: true native Apple Pay sheet, Arbitrum USDC, and Stripe carries fraud.
  - Cons: the user must create a Link account, and Blunts must apply (reviewed in about 48h) [S6]. Its KYC tiers can be prefilled from Blunts' data, which beats Coinbase once users go over $500/wk, but only if Blunts is allowed to hold the SSN.
- **NY card users:** Coinbase Headless (if `subdivision=NY` returns USDC) → else **MoonPay** (licensed in all 50 states, but a $3.99 minimum makes a $25 deposit cost 16%) → or Stripe's old widget into **USDC on Base** (NY allowed [S3]) if Dinari accounts can live on Base [D3].
- **Transak:** skip. It excludes NY and several other states (secondary [T1]), and the fees are card-level.
- **zerohash cards:** only worth it at scale. Blunts would become the card merchant (chargebacks, float, PSP contract) [Z6]. That's the opposite of what we want.
- **Credit cards:** still no (see 01 §5). Coinbase guest checkout is debit only [CB7-hosted].

---

## 2. Bank ACH in both directions ↔ USDC in the user's wallet (all 50 states + NY)

### 2.1 Comparison

| | **zerohash** ⭐ (all states) | **Bridge** (direct or via Privy) | Coinbase Onramp/Offramp | MoonPay | Plaid Transfer | Circle Mint |
|---|---|---|---|---|---|---|
| NY | **Yes** (51 jurisdictions + NYDFS) [Z7] | **No** ("excluding… New York"). Texas: "first-party flows only," no custody [B1] | Yes (Coinbase). But see "account" below | Yes (BitLicense) [M1] | n/a | n/a |
| Deposit (bank → USDC) | **ACH pull** from a Plaid-linked account [Z1][10]; **or** a per-user **virtual account** taking ACH/wire/**RTP/FedNow** push, auto-converted and sent to a whitelisted wallet [Z2] | **Push only**: a virtual account (routing and account number in the user's name) → auto USDC to the wallet. FedNow receive since 2026-05-04 [B2]. No Plaid pulls (10) | **Needs a Coinbase account** for ACH [CB1] | ACH buy inside the MoonPay widget (about 1%, secondary) | **Wrong tool:** settles to Blunts' treasury, making Blunts the money transmitter (10) | Institutions only (10) |
| Withdrawal (USDC → bank) | User's wallet sends USDC to their zerohash deposit address → sell → **RTP/FedNow (seconds, 24/7)** or ACH [Z1] | **Liquidation address** → ACH, Same-Day ACH, wire, **FedNow** ($0.50 existing / $1.00 new developer per transfer, launched 2026-08-17) [B2] | **Needs a Coinbase account with a linked bank** [CB1] | Sell → ACH / Visa card / PayPal / Venmo (**no PayPal/Venmo in NY; no withdrawals at all in TX**) [M2]. 1% + network, $3.99 min [M3] | — | — |
| Deliver to a third-party (user-owned) wallet? | **Yes** (`withdrawal_address` / whitelisted wallet) [Z2][10] | **Yes** (any address; Arbitrum min $1) [10] | Yes (onramp) | Yes | — | — |
| Link bank once with Plaid? | **Yes. Plaid Reseller mode (no Plaid contract)** or processor token [10] | Bridge's own Plaid Link, for *payout accounts only* [10] | Coinbase's own | MoonPay's own | — | — |
| KYC reuse | Platform submits the customer (reuses Blunts/Dinari data) [10] | Platform submits the customer, or a Persona link. Privy: "verifies once" per user [PV3] | Coinbase's | Full MoonPay KYC | — | — |
| Return risk | ACH pull: Blunts funds a **loss reserve**; unauthorized returns can come up to 60 days later [10]. Virtual-account push: none | None on push deposits | Coinbase's | MoonPay's | — | — |
| Pricing | **Private.** The platform sets the spread (bps) and up to 5 fees per order. The only state cap is NY's 7.5% combined limit [Z3]. Retail disclosures show spreads of 100–400 bps [Z4] | **Private** ("reach out to sales") [B3]. Fixed per-rail fees on virtual-account deposits (beta) and FedNow payouts at $0.50–1.00 [B2]. Secondary: 0.1–0.5% conversion **[UNVERIFIED]** | USDC 0% if subsidized | ~1% / $3.99 min | — | — |

### 2.2 Which one gives "link your bank once, then one tap in and out" in all states?

**zerohash, and only zerohash.**
- **Link once:** zerohash SDK / Plaid (Reseller). Chime works with App-to-App; Cash App numbers need a manual micro-deposit (see 10 §1.3).
- **Deposit:** one tap → ACH pull → the USDC lands in the Privy wallet in about 1–3 business days (pre-funded model). Instant is possible if Blunts fronts a float and takes the return risk.
- **Withdraw:** one tap → the user's wallet signs a USDC send (gas sponsored) → RTP to the same bank in seconds.
- **Optional:** show each user a zerohash **virtual account number** for "direct deposit part of your paycheck." Push deposits have no return risk, and it works in NY [Z2].

**Bridge through Privy** is the lowest-effort option for the **49 non-NY states**. Privy's `useFundWalletWithBankDeposit` plus payouts is built in [PV2][PV3]. But deposits aren't one-tap: the user must push money from their bank app to the virtual account. Use it only if zerohash's minimums are too high at launch.

---

## 3. Instant cash-out to a debit card (Visa Direct / Mastercard Move)

Blunts can't push its *own* money to a user's card: that is money transmission (05 §1). A licensed party has to take the user's USDC and push to the card.

| Route | Who does the push | Cost on $100 | Speed | NY | Notes |
|---|---|---|---|---|---|
| **USDC → user's Cash App (free) → Cash App Instant transfer** | Cash App | **$0.50–1.75, paid by the user** (0.5–1.75%, $0.25 min) [CA1] | Seconds + seconds | **No** (Cash App stablecoins exclude NY) | Cheapest. No extra vendor |
| **Coinbase instant cash-out** | Coinbase | **$1.50** (1.5%) (secondary) [E1] | Minutes | Yes | Needs a Coinbase account (offramp → Coinbase balance → instant to debit) |
| **MoonPay sell → Visa card** | MoonPay | **$3.99** (1% with $3.99 min) [M3]; card pushes about 1 hr [M3] | About 1 hour | Yes | Full MoonPay KYC; **no withdrawals in TX** [M2] |
| **zerohash + Visa Direct** | zerohash (if offered) | Negotiated. Market push-to-card fees are about 1–2% [E1] **[UNVERIFIED]** | Minutes | Yes | The 2026-08-05 announcement is about Visa Direct *clients* prefunding and paying out in stablecoins [Z5], not a stated consumer card cash-out. **Ask zerohash** |
| Bridge | — | — | — | — | No push-to-card payout rail found. Bridge's card product is a *spend* card [B4] |
| **Bank RTP/FedNow** (not a card, but just as fast for most banks) | zerohash / Bridge | About $0.50–1.50 **[UNVERIFIED zerohash]**; Bridge $0.50–1.00 [B2] | Seconds | zerohash yes | **The better "instant" default.** A card push only matters for banks without RTP/FedNow |

**Recommendation:** make "Instant to bank (RTP/FedNow)" the paid instant option, and "Instant to Cash App" free for non-NY users. Offer a MoonPay card cash-out only as a fallback link, not a built-in rail.

---

## 4. Can Dinari itself take ACH or pay out USD for US accounts?

**No, not in any published doc as of 2026-09-28.**
- The US guide still says only "Accounts must be pre-funded (via ACH) or just-in-time funded." The documented funding is USDC through Circle, or a **Funding Facilitation Account** open only to a "Money Services Business with the requisite money transmitter licenses." The FFA moves USD by **wire** between the partner's bank and the FFA [D1].
- The doc index (`llms.txt`, re-pulled today) has no ACH, bank, Plaid or fiat-deposit endpoint. Wallets can be funded with **USD+, USDC or USDT**. Withdrawals convert USD+ → USDC to a same-entity account [D2].
- **What's new:** Dinari's launch materials list chains **Ethereum, Avalanche, Arbitrum and Base** (Sei and Solana "soon") [D3].
- **Ask Dinari:**
  1. Is "pre-funded via ACH" a private API?
  2. Could **zerohash run an FFA** on behalf of Blunts' users? That would give true USD ACH with no USDC hop.
  3. Can individual Blunts users' Dinari accounts sit on **Base**? That would unlock Stripe's NY-eligible USDC-on-Base widget and Coinbase's free Base transfers.

---

## 5. Recommendations

### 5.1 Stack per user type

| User | Deposit | Withdraw | Why |
|---|---|---|---|
| **(a) Cash App users, not NY** | **Cash App → send USDC on Arbitrum** (09) | **USDC → their Cash App** (free); instant-to-card inside Cash App at the user's cost | $0 rails, no chargebacks, no extra KYC |
| **(b) NY users** | **Coinbase Headless Apple/Google Pay** (if `subdivision=NY` is supported) **+ zerohash ACH pull** (Plaid link once) | **zerohash RTP/FedNow** to their bank | Only zerohash covers NY for bank in *and* out without a separate consumer account. MoonPay is the fallback |
| **(c) No Cash App, any state** | **zerohash ACH pull** (link once) or a zerohash/Bridge virtual account for paycheck push; Coinbase Headless for cards | **zerohash RTP** (or **Bridge FedNow** at $0.50–1.00 outside NY) | One vendor for all 50 states keeps the UX identical everywhere |
| **(d) Apple Pay lovers** | **Coinbase Headless** (webview Apple Pay; App2App) → fallback **Stripe Embedded Components** (native Apple Pay sheet, not NY) | Same as their bank/Cash App choice | Lowest KYC friction; apply for the zero-fee USDC subsidy |

### 5.2 Per-transaction cost: **$25 deposit** (reaching USDC in the user's Arbitrum wallet; Dinari's own order fee is excluded)

| Rail | Cost | % of $25 | Who pays / notes |
|---|---|---|---|
| Cash App USDC send (non-NY) | **$0** | 0% | Cash App: "no fees" (09) |
| Coinbase Headless Apple Pay, **zero-fee subsidy** | **about $0–0.05** (network fee estimate) | about 0–0.2% | Coinbase subsidy **[needs approval]** |
| Coinbase Headless Apple Pay, standard | about $0.65–1.00 **[UNVERIFIED]** | about 2.5–4% | Quote API is the source of truth |
| Stripe Embedded Components (non-NY) | about $0.68 (1.5% + $0.30) to about $0.75+ **[UNVERIFIED]** | about 2.7–3% | Stripe carries fraud |
| MoonPay card / Apple Pay | **$3.99** (minimum) | **16%** | Unusable at $25 |
| zerohash ACH pull | about $0.35–0.75 (ACH + spread + Plaid Balance about $0.10) **[UNVERIFIED]** | about 1.4–3% | Plus loss reserve |
| Bridge virtual account push (non-NY) | about $0.03–0.13 (fixed fee or about 0.1–0.5%) **[UNVERIFIED]** + gas | about 0.1–0.5% | User pushes from their bank |
| zerohash virtual account push (incl. NY) | negotiated, likely similar to Bridge **[UNVERIFIED]** | — | No return risk |

### 5.3 Per-transaction cost: **$100 withdrawal** (from USDC in the wallet to fiat)

| Rail | Cost | Speed | Notes |
|---|---|---|---|
| USDC → Cash App (non-NY) | **about $0.02** (sponsored gas) | about 1 min | + $0.50–1.75 if the user taps instant-to-card in Cash App [CA1] |
| **Bridge FedNow** (non-NY) | **$0.50 (existing dev) / $1.00 (new)** + conversion **[UNVERIFIED %]** | Seconds | [B2] |
| Bridge Same-Day ACH (non-NY) | about $0.25–0.50 **[UNVERIFIED]** | Same day | |
| **zerohash RTP** (all states) | about $0.50–1.50 **[UNVERIFIED]** | Seconds | Spread set by Blunts; can be 0 bps if the contract allows |
| zerohash ACH | about $0.25–1.00 **[UNVERIFIED]** | 1–3 days | |
| Coinbase Offramp | about $0 on USDC | 1–3 days | **Needs a Coinbase account** |
| Coinbase instant to debit | $1.50 | Minutes | Needs a Coinbase account |
| MoonPay → bank / card | **$3.99** | 1–3 days / about 1 hr | NY OK; no TX |

### 5.4 Fixed monthly costs

| Vendor | Fixed monthly | Source |
|---|---|---|
| Dinari API (context) | **$2,000/mo** | 09 |
| Coinbase Onramp (Headless) | **$0.** "Free for developers"; self-serve with no monthly fee since June 2026 | [CB1][CB5] |
| Stripe Crypto Onramp | $0 integration fee; per-transaction pricing private | [S6] |
| Privy funding (card routing) | **$0** ("no fees or monthly minimums") | [PV1] |
| MoonPay | **$0** (dashboard subscription removed 2026-04-16) | [M5] |
| Bridge | Not published; ask sales | [B3] |
| zerohash | Not published. Expect a platform minimum, an **ACH loss reserve**, and a **float** if deposits are instant **[UNVERIFIED; negotiate]** | [Z3][10] |
| Plaid | $0 if bundled via the zerohash Reseller. Own contract: $1k–$10k+/mo on Growth/Custom **[UNVERIFIED]** | 10 |

### 5.5 Launch order

1. **Now:** Cash App rail (non-NY) + **Coinbase Headless** (apply for the zero-fee USDC subsidy the same day; call Buy Options with `subdivision=NY` and `network=arbitrum`).
2. **Before a NY launch:** sign **zerohash** (Plaid Reseller, ACH pull, RTP payout, virtual accounts). This one contract covers bank in/out in all 50 states + NY and replaces Bridge.
3. **Optional, cheaper non-NY bank:** Bridge via Privy (FedNow payouts $0.50–1.00) if zerohash minimums hurt at small scale.
4. **Native Apple Pay polish (non-NY):** Stripe Embedded Components as a second card provider (Stripe carries fraud).
5. **Skip:** Transak (state gaps), zerohash-as-card-merchant (Blunts eats chargebacks), Plaid Transfer, Circle Mint for users.

---

## 6. Open questions to send to vendors

- **Coinbase:** Is Blunts eligible for the zero-fee USDC subsidy? Is Headless live in NY (`subdivision=NY`)? Arbitrum in the headless network enum? Who bears chargebacks on guest checkout? US debit fee without the subsidy? Can Apple Pay run in a WKWebView on iOS, or does it need App2App?
- **Stripe:** Onramp pricing. NY timeline for Embedded Components. Can Blunts submit the SSN from its own KYC (`attachKYCInfo`)? Per-tier limits.
- **zerohash:** Platform minimum, reserve size, RTP payout fee, 0-bps spread allowed? Push-to-card payouts for platforms? Arbitrum USDC for virtual-account auto-convert? Can zerohash operate a Dinari FFA?
- **Bridge:** Actual fixed fees for USD virtual-account deposits and ACH payouts. Any NY plan (their NY trust application)?
- **Dinari:** "Pre-funded via ACH" meaning. Per-user Base accounts. FFA run by a licensed partner.

---

## Sources

**Coinbase**
- [CB1] Onramp FAQ (hosted guest checkout ends 2026-06-30; "Zero-fee USDC onramping is available to select partners through a subsidy program"; Offramp needs a Coinbase account with linked bank; free for developers; ~$5 min; 2.5% credit / 0.5% ACH): https://docs.cdp.coinbase.com/onramp/additional-resources/faq
- [CB2] Headless Onramp overview (US users with valid US non-VoIP mobile numbers; Blunts verifies email/phone, re-verify phone every 60 days; iOS webview / Android WebView / web iframe): https://docs.cdp.coinbase.com/onramp/headless-onramp/overview
- [CB3] Create an Onramp Order API (`GUEST_CHECKOUT_APPLE_PAY`, `GUEST_CHECKOUT_GOOGLE_PAY`, destinationAddress, fee array): https://docs.cdp.coinbase.com/api-reference/v2/rest-api/onramp/create-an-onramp-order
- [CB4] Limits Upgrade ($500/wk + 15 lifetime → up to $2,500/wk, unlimited; SSN last 4 + DOB; don't store SSN4): https://docs.cdp.coinbase.com/onramp/headless-onramp/limits-upgrade
- [CB5] Headless Onramp June 2026 update (self-serve, unlimited lifetime limits, Google Pay, App2App; no monthly fee): https://www.coinbase.com/developer-platform/discover/launches/headless-onramp-h2
- [CB6] Zero-fee USDC launch (original "0% fees on all USDC on/offramps" wording): https://www.coinbase.com/developer-platform/discover/launches/zero-fee-usdc
- [CB7] Get Buy Options API (`subdivision` ISO 3166-2 state code, required for US): https://docs.cdp.coinbase.com/api-reference/rest-api/onramp-offramp/get-buy-options ; [CB7-hosted] Coinbase-hosted Onramp (guest = debit card or debit in Apple/Google Pay, $500/wk, $5 min): https://docs.cdp.coinbase.com/onramp/coinbase-hosted-onramp/overview
- Coinbase Offramp integration guide: https://docs.cdp.coinbase.com/onramp/offramp/offramp-integration-guide.md

**Stripe**
- [S1] Crypto onramp overview (merchant of record; "assumes full liability for all fraud and disputes"; three integration types): https://docs.stripe.com/crypto/onramp
- [S2] Embedded Components overview (USDC (Arbitrum) listed; Apple Pay, Google Pay, ACH; "Not available in the state of New York"; Link account required; iOS/Android/RN/web SDKs): https://docs.stripe.com/crypto/onramp/embedded-components-overview
- [S3] Stripe-hosted onramp (currency list; XLM/USDC Stellar/Avalanche/Polygon not in NY): https://docs.stripe.com/crypto/onramp/stripe-hosted
- [S4] Embedded onramp (US excluding Hawaii; prefill all but SSN; sample quotes; Stripe takes dispute and fraud liability): https://docs.stripe.com/crypto/onramp/embedded
- [S5] KYC tier system (L0/L1/L2; `attachKYCInfo` accepts DOB and ID number): https://docs.stripe.com/crypto/onramp/kyc-integration-guide
- [S6] Onramp application (reviewed within ~48h): https://docs.stripe.com/crypto/onramp#submit-your-application

**Privy**
- [PV1] Card onramps (routes to Stripe, Meld, MoonPay, Coinbase; Stripe USDC on Arbitrum, "US (excluding New York)"; React Native = MoonPay and Coinbase only; "no fees or monthly minimums"): https://docs.privy.io/wallets/funding/fiat-onramp ; https://www.privy.io/funding
- [PV2] Bank deposits (Bridge virtual accounts): https://docs.privy.io/wallets/funding/bank-deposits
- [PV3] Privy blog, fiat deposits, payouts and KYC orchestration (2026-09-01; Bridge; US ACH/wire; "verifies once"): https://privy.io/blog/fiat-deposits-payouts-kyc-orchestration

**Bridge**
- [B1] Supported countries (US "excluding… New York"; Texas first-party flows only, no custody): https://apidocs.bridge.xyz/platform/customers/compliance/supported-countries-list
- [B2] Changelog (2026-04-01 fixed fees on virtual-account onramps; 2026-05-04 FedNow receive; 2026-08-17 FedNow offramps at $0.50 existing / $1.00 new developers): https://apidocs.bridge.xyz/changelog/changelog
- [B3] Pricing ("reach out to sales@bridge.xyz"): https://apidocs.bridge.xyz/platform/additional-information/pricing
- [B4] Bridge cards (spend card, not a payout rail): https://www.bridge.xyz/product/cards

**zerohash**
- [Z1] Bank Rails (ACH debit and credit; RTP/FedNow credit-only, instant, 24/7): https://docs.zerohash.com/docs/fiat.md
- [Z2] Virtual Accounts (per-customer named accounts; ACH, wire, RTP, FedNow in; auto-convert to stablecoin into a whitelisted wallet): https://docs.zerohash.com/docs/virtual-accounts
- [Z3] Transaction Fees (platform sets spread and up to 5 fees; NY 7.5% cap): https://docs.zerohash.com/docs/transaction-fees
- [Z4] Pricing and fees disclosure (spread bands, e.g., 100–400 bps; commissions examples): https://zerohash.com/disclosures/pricing-and-fees
- [Z5] zerohash × Visa Direct stablecoin prefunding and payouts (2026-08-05): https://zerohash.com/press/zerohash-powers-stablecoin-payout-and-prefunding-capabilities-for-visa-direct
- [Z6] On-ramp integration guide / account setup (PSP handles USD leg for card or Apple Pay; PSPs settle daily and withhold chargebacks; float account): https://docs.zerohash.com/docs/on-ramp-integration-guide ; https://docs.zerohash.com/docs/account-setup-1
- [Z7] US licenses (51 jurisdictions, NYDFS): https://docs.zerohash.com/page/us-licenses-and-disclosures

**MoonPay / Transak**
- [M1] MoonPay NY BitLicense (all 50 states): https://www.moonpay.com/newsroom/ny-bitlicense ; https://www.theblock.co/post/356949/moonpay-bitlicense
- [M2] MoonPay supported withdrawal methods (US: ACH, Visa cards, PayPal/Venmo except NY; no withdrawals in Texas): https://support.moonpay.com/en/articles/384613-supported-withdrawal-methods-for-selling-cryptocurrency
- [M3] Offramp fees 1% + network, $3.99 min; card payout about 1 hr (secondary): https://eco.com/support/en/articles/15210579-best-stablecoin-offramps-2026-cash-out-routes-compared ; https://www.moonpay.com/sell
- [M4] MoonPay card 4.5%, $3.99 minimum (secondary): https://www.bitget.com/academy/moonpay-fees-and-payment-methods-2026-complete-america-guide-for-crypto-beginners
- [M5] MoonPay partner pricing (subscription paywall removed 2026-04-16): https://support.moonpay.com/en/articles/694907-partner-pricing-fees-and-the-removed-paywall
- [T1] Transak US state gaps (NY, HI, LA, NC excluded; secondary, via Binance.US help) and licensed-state list: https://support.binance.us/en/articles/9842892-buying-and-selling-crypto-for-cash-with-a-third-party-faqs ; https://transak.com/blog/transak-deepens-u.s.-regulatory-footprint-now-licensed-in-11-states-for-stablecoin-payments
- [T2] Transak fees (card about 3.5%, minimum fee; secondary): https://support.transak.com/en/articles/7845942-how-does-transak-calculate-prices-and-fees ; https://www.bitget.com/wiki/transak-usdc-fee-percentage

**Dinari**
- [D1] US Customers guide ("pre-funded (via ACH) or just-in-time funded"; Circle; FFA for money-transmitter-licensed MSBs, wire-funded): https://docs.dinari.com/docs/us.md
- [D2] Docs index (no ACH/bank endpoints; wallet funding via USD+, USDC, USDT): https://docs.dinari.com/llms.txt ; https://docs.dinari.com/docs/funding-accounts-through-wallets.md
- [D3] US launch (chains: Ethereum, Avalanche, Arbitrum, Base; partners incl. Circle, Privy): https://www.prnewswire.com/news-releases/in-an-industry-first-dinari-launches-724-tokenized-stocks-available-to-both-us-investors-and-businesses-302842099.html ; https://www.coindesk.com/business/2026/08/04/dinari-brings-tokenized-u-s-stocks-to-american-investors-as-equity-race-heats-up

**Other**
- [CA1] Cash App instant transfer fee (0.5–1.75%, $0.25 min): https://cash.app/help/us/en-us/3073-cash-out-speed-options
- [E1] USDC-to-bank/debit routes (Coinbase instant cash-out 1.5%; MoonPay card push; industry push-to-card 1–2%; secondary): https://eco.com/support/en/articles/15039728-convert-usdc-to-bank-account-fastest-routes-in-2026 ; https://www.routable.com/resources/instant-to-card-disbursements-guide/
