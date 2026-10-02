# 19: Can Blunts ship? The end-to-end plan (stores, Apple's cut, NY, money in/out, login, web)

*Written 2026-09-28. This file ties together 13–18 (new this round) and 01–12. It lists every option we found for each decision, then picks one. The pick is always the cheapest option that still gives the best experience and passes review. Not legal advice. Every **[UNVERIFIED]** item has an owner in §9.*

---

## TL;DR

**Yes, it's feasible, as a real app on iOS, Android and web, in all 50 states plus DC (including New York).** It has to be built like this:

1. **Blunts never holds anyone's money.** Every user has their own wallet (Privy, unlocked by a passkey), and every move of money is signed by the user's own tap. The Blunts server can suggest, relay and pay gas, but it can never move funds on its own. That one rule means Blunts needs **no money-transmitter license, no NY BitLicense and no California DFAL license**, and Google treats the wallet as non-custodial. See 16 §1.
2. **Dinari is the broker.** Dinari Securities LLC (FINRA, registered in NY) does KYC and sells tokenized QQQ into the user's wallet. Blunts is its introducing partner.
3. **Apple and Google take 0% of deposits, buys, sparks and withdrawals.** Their rules put these outside in-app purchase (Apple 3.1.3(e); Google's FAQ names "stock trades"). There's no legal way to hand Apple a share of profit. **The clean way to cut Apple and Google in is an optional "Blunts+" subscription for digital extras, sold through IAP / Play Billing (15% to them).** That's real revenue to both stores, in the form their rules expect.
4. **Apple Pay can fund Blunts, but Blunts can't be the merchant.** Route it through **Coinbase's Headless Onramp**: Apple Pay (debit) → USDC → the user's wallet. No Coinbase account needed. It's $0 to Blunts if we get into Coinbase's zero-fee USDC program.
5. **Money in and out:**
   - **Cash App users outside NY:** Cash App USDC in and out ($0).
   - **Everyone else, NY included:** bank in and out through **zerohash**. Link once with Plaid (zerohash resells it), then one tap each way; payouts land in seconds.
   - **Apple Pay:** Coinbase Headless, for anyone who wants a card.
6. **Login: no username and no password. A passkey (Face ID or fingerprint) is the account,** with a required backup (phone number). "Sign in with Cash App" doesn't exist; Block has no login product. The app saves the user's Cash App address after a $1 test payout so the link feels automatic.
7. **Web is the full app, built from the same codebase (Expo).** It's also the launch channel that doesn't depend on App Review. Launch order: **web beta → Android → iOS.**
8. **The biggest risk isn't code, it's Apple guideline 3.2.1(viii).** Apple wants investing apps submitted by the licensed firm. Mitigation: a letter from Dinari, Dinari's CRD, a demo account, a clean brand in store art, and (if Apple still says no) Blunts registering as an investment adviser.
9. **Rough cost to launch:** about $55–150k legal/compliance up front. About $6.5–11k/month fixed, mostly Dinari's $2k minimum plus SOC 2, pen test and insurance spread monthly. About $0.60–2.00 per active user a month. **Timeline:** about 16–18 weeks with 3 engineers to TestFlight/closed testing, plus 3–6 weeks for partner approvals and store review. Partner contracts start now, in parallel.

---

## 1. The one design rule that makes it legal: the user signs, Blunts relays

| Option | What it means | Licensing | Verdict |
|---|---|---|---|
| A. Blunts holds pooled funds (custodial) | Blunts' own wallet or bank account | Money-transmitter licenses in about 49 states, NY BitLicense, CA DFAL. $1–3M and 18–24 months | **No** |
| B. User wallet + Blunts server key that can act alone | Server auto-buys and auto-pays out | Arguably "control" under FinCEN, NYDFS and CA DFAL. After 2026-07-01, CA needs the license first. Google may call it custodial. RIA custody rule if we register as an adviser | **No for v1** |
| C. User wallet, **user signs every money move**, server only relays | Fill = one tap on a live quote; spark = one tap | Software provider: no MSB, MTL, BitLicense or DFAL (16 §1). Matches Dinari's "no trade execution by partners" rule and its per-order pre-trade confirmation (12 P0 #1–3) | **Pick** |
| D. C plus a narrow co-sign-only policy signer | Server can co-sign only Dinari buy orders from the user's own USDC | Probably fine, but needs a written opinion and Privy must confirm the policy | Later, if one-tap-per-fill hurts |

**What this costs the UX:** a fill takes two actions instead of one. First, send from Cash App. Then, when it lands, one tap on "Roll it" (Face ID). That second tap is also where Dinari's required live quote appears, so it solves two problems at once.

---

## 2. App Store and Play Store: every question the founder asked

### 2.1 Does Apple get 30% of deposits? No.

| Money flow | Apple | Google | Why |
|---|---|---|---|
| Deposit (Cash App, bank, Apple Pay) | 0% | 0% | Service consumed outside the app (Apple 3.1.3(e)); Google FAQ says stock trades should not use Play Billing |
| Buy / sell QQQ, spark | 0% | 0% | Same |
| Broker fee on sparks (Dinari's flat fee) | 0% | 0% | Charged in the brokerage account, not an app feature |
| Optional Blunts+ subscription (digital extras only) | **15%** (Small Business Program) | **15%** (10% service + 5% billing, under $1M/yr) | This is the "cut them in" line |
| Link-out to web to buy Blunts+ (US) | 0% today; Apple proposed 15/10/5% | 10% subscriptions from Oct–Dec 2026 | Not worth it. IAP is simpler and the founder *wants* them paid |

### 2.2 "Cut Apple in on profit": options compared

| Option | Legal? | Store-rule OK? | Verdict |
|---|---|---|---|
| Pay Apple a % of users' gains | No: §205 / broker-pay issues, plus Apple would become a paid promoter (16 §6) | n/a | **No** |
| Custom revenue deal with Apple | No mechanism exists. Payments tied to users sent or trades make Apple a promoter or broker-pay recipient | n/a | **No** |
| Put brokerage fees through IAP | IAP can't be used for securities; Google explicitly bans it | Would likely be rejected | **No** |
| **Optional Blunts+ via IAP / Play Billing** | Yes. Standard store commission, not referral pay | Yes (3.1.1). Perks must be digital only: themes, skins for the stash, extra stats, stickers. **No** fee waivers, no trading perks, no features gated on balance | **Pick** |
| Accept Apple Pay (via Coinbase) | Yes | Yes | Apple earns issuer fees (~0.15% credit / ~$0.005 debit). A small real cut on top |

### 2.3 What gets the app approved

| Gate | Apple | Google | What we do |
|---|---|---|---|
| Who may submit an investing app | **3.2.1(viii): "should be submitted by the financial institution."** The real risk | No such US rule. Must be an Organization account and may be asked for licence documents | Dinari letter naming Blunts as introducing partner, CRD 329672 + BrokerCheck, Form CRS, state list, demo account. Expect 1–3 rejection loops. Fallback: register Blunts as an adviser (16 §4), which puts a license in our own group like dub, Composer and Acorns |
| Crypto rules | 3.1.5: wallets from org developers; crypto-securities from established institutions | Crypto wallet policy: custodial needs MSB + MTL; **non-custodial exempt** | Non-custodial design (§1). Declare stock trading + non-custodial wallet + tokenized asset. **Don't hide the crypto from reviewers** (2.3.1(a)); explain it in Review Notes. Plain words in the UI are fine |
| Drug references | 1.4.3 bans *encouraging* drug use. **2.3.8: icon, screenshots and preview must suit 4+** | Only bans *selling* marijuana. Google **Ads** is the stricter one | Store art: money only (stacks, bands, rolled bills), no leaf or smoke. Age rating 18+. In-app flakes stay abstract. Keep a brand-safe ad variant |
| Account & age | Org account, D-U-N-S, 18+ | Org account (exempt from the 12-tester closed test), D-U-N-S (up to 30 days), target API 36 | Apply for D-U-N-S **this week** |
| Reviewer access | Demo account for a KYC-gated app | Reusable login that skips one-time codes | Pre-verified sandbox account on Dinari sandbox with a code bypass for the review account only |
| Privacy | Nutrition label; 5.1.1 | Data safety form; Financial features declaration | No ad or analytics SDK gets balances or addresses (GLBA / Reg S-P) |
| Login rule | 4.8: Sign in with Apple is needed only if we offer Google or another social login | none | Passkey + phone only at launch, so Sign in with Apple isn't required. Add it only if we add Google |

Full checklists: 13 §7 (iOS) and 14 §7 (Android).

---

## 3. Legal in the US and in New York

| Question | Answer | Source |
|---|---|---|
| Does Blunts need a broker-dealer license? | No. Dinari is the BD, and Blunts is its introducing partner | 04, 16 |
| Money transmitter / BitLicense / CA DFAL? | **No, as long as §1 option C holds.** zerohash (licensed in 51 jurisdictions + NY) is the one that turns dollars into USDC and back. Coinbase is the card merchant | 16 §1–2 |
| NY specifically | Dinari is registered in NY and headquartered in NYC, and no dShares carve-out was found (**confirm in writing**). Cash App stablecoins exclude NY, so **NY users get bank (zerohash) + Apple Pay (Coinbase, if its NY support is confirmed)**. The NY risk to manage is the Martin Act (fraud without intent), so no return promises, anywhere | 16 §2–3 |
| How Blunts gets paid legally | **Launch: Dinari charges users a flat, disclosed spark fee, and pays Blunts a truly fixed platform fee** (FINRA 2040; not per trade, not per account, not % of assets). **Plus Blunts+ subscription revenue.** Later option: register as an adviser and charge 0.25–0.35%/yr (16 §4). No %-of-profit fee for US users (12) | 12, 16 §4–5 |
| Age | 18+ (19 in AL/NE, 21 in MS). Gate by DOB + state | 12 #11 |
| Taxes | Dinari issues 1099s (confirm 1099-B). The tax stash is shown in the UI, never called "withheld" | 03, 12 #15 |
| Stablecoin yield | Don't market yield on USDC (GENIUS Act rules take effect by Jan 2027) | 16 §7 |

**Legal checklist (16 §8):** about 16 items, about $55–150k up front and $50–130k a year. Critical path is 8–12 weeks, or 12–16 with adviser registration.

---

## 4. Money in and out: every rail, then the pick

### 4.1 Deposit ("fill")

| Rail | States | Cost to Blunts on $25 | UX | Pick? |
|---|---|---|---|---|
| **Cash App USDC → user wallet** | 49 + DC (**not NY**) | ~$0 | Copy address → open Cash App → paste → send. No prefill link exists (15 §1) | **Primary** |
| **zerohash ACH pull (Plaid-linked bank)** | **All incl. NY** | ~$0.35–0.75 [UNVERIFIED, negotiated] | Link bank once; then one tap. 1–3 days (can show "on the way") | **Primary for NY / no Cash App** |
| **Coinbase Headless: Apple Pay / Google Pay (debit)** | US; NY [UNVERIFIED] | $0 if zero-fee USDC approved; else ~2.5–4% | Apple Pay sheet, instant. $500/wk to start, $2,500/wk after DOB + SSN4 | **Add at launch if approved, else v1.1** |
| Cash App ACH (Cash App account/routing no. via zerohash pull) | All incl. NY | Same as bank | Needs an activated Cash Card. Works for NY Cash App users | Covered by the bank path; make "Cash App (bank numbers)" a named choice |
| Stripe onramp (new, Arbitrum) | Not NY | Private pricing; Stripe eats fraud | Needs a Stripe Link account + KYC | Fallback if Coinbase says no |
| Bridge virtual account (via Privy) | Not NY | Low | Push only (user sends to account numbers) | Later: payroll direct deposit |
| Cash App Lightning link → swap → USDC | Not NY | 0.9% + swap fee, $999/wk cap | The only true one-tap Cash App prefill | Experiment later |
| Cash App Pay (merchant API) | n/a | n/a | Block bans broker/crypto merchants | **No** |
| Credit card | n/a | 3.5–5% + cash-advance risk | Wrong product | **No** |

### 4.2 Withdrawal ("spark")

| Rail | States | Cost on $100 | Speed | Pick? |
|---|---|---|---|---|
| **USDC → user's saved Cash App address** | Not NY | ~$0.02 (user-signed transfer, we relay gas) | ~1 min | **Primary** |
| **zerohash → bank via RTP/FedNow** | All incl. NY | ~$0.50–1.50 [UNVERIFIED] | Seconds | **Primary for NY / bank users** |
| Bridge FedNow | Not NY | $0.50–1.00 | Seconds | Cheaper non-NY option later |
| Debit card instant | — | MoonPay 1% ($3.99 min) | ~1 hr | Skip. Tell Cash App users to use Cash App Instant (user pays 0.5–1.75%) |

### 4.3 Who sees what (the whole routing logic)

```
KYC address state ─┬─ NY ──────────────► Bank (zerohash) · Apple Pay* · Cash App via bank numbers
                   └─ not NY ─┬─ has Cash App ─► Cash App USDC (default) · Apple Pay · Bank
                              └─ no Cash App ──► Apple Pay · Bank
Spark goes back the way the last deposit came, unless the user changes it.
* if Coinbase confirms NY coverage
```

---

## 5. Login and identity

| Option | Possible? | Notes | Pick? |
|---|---|---|---|
| No account at all | **No for funded users.** The broker must verify name, DOB, address and SSN (CIP) | A Privy **guest** session can run the tutorial and the "what's inside" tour before signup (expires in 30 days) | Guest mode for the tour only |
| **Sign in with Cash App** | **Doesn't exist.** Block has no OAuth/identity product; Cash App Pay grants are payment-partner-only and ban broker/crypto merchants | We can save the user's Cash App USDC address + $cashtag as a label, verified by a $1 test payout | **No, but fake the feel** |
| **Passkey (Face ID / fingerprint) via Privy** | Yes on iOS, Android and web | No password or username. Same wallet on every device | **Pick (primary)** |
| Phone OTP | Yes | Recovery plus login on a new device. SIM-swap risk, so put a hold on payout-address changes | **Pick (required backup)** |
| Sign in with Apple / Google | Yes | Adding Google forces Sign in with Apple on iOS (4.8). Optional later | Later |
| Plaid Layer (phone number → prefilled identity + bank) | Yes, sales-priced | Prefills KYC but doesn't replace it. Dinari's hosted KYC is simpler for v1 | v2 to cut signup time |
| Log in with PayPal / Coinbase OAuth | Exists / partner-gated | No real gain | No |

**Signup in practice:** open app → tour (guest) → "Make it yours" → Face ID creates the passkey → phone number (OTP) → Dinari-hosted ID check (~2 min, inside the app) → the "paperwork" screen with Dinari's required checkboxes → pick how you'll fill (Cash App / bank / Apple Pay).

---

## 6. The end-to-end flows

**Fill with Cash App (not NY):** tap FILL → pick $25 / $100 → screen shows the user's address + "Copy & open Cash App" (desktop shows a QR) → in Cash App: $ → amount → Pay → paste → send → back in Blunts, the Alchemy webhook sees the USDC (~1 min) and sends a push notification → "Your $25 landed. Roll it?" → live QQQ quote card (Dinari's required confirmation) → Face ID → Blunts relays the signed order, Dinari pays gas → the blunt fills with the animation.

**Fill with bank (anyone, incl. NY):** tap FILL → amount → Face ID → zerohash pulls ACH → the blunt shows "rolling… 1–3 days" (quarter-grey) → funds land as USDC → "Roll it?" tap (or a pre-signed one-time order for that deposit, if Dinari approves) → filled.

**Fill with Apple Pay:** FILL → amount → Apple Pay sheet (Coinbase Headless) → USDC lands in seconds → "Roll it?" tap → filled.

**Spark:** SPARK → pick blunts → quote card with the flat fee → Face ID → user signs the sell order, and when it settles, a USDC transfer to their saved Cash App address (or zerohash to bank) → receipt with ash drift.

**First payout setup:** "Where should sparks land?" → Cash App: "Money → Deposit stablecoins → Arbitrum → copy" → paste → Blunts sends $1 → "See it in Cash App? Yes" → saved. Address changes need re-auth plus a 24h hold.

---

## 7. Web version

- **Full app, same Expo codebase** (Expo Router). The only split is Privy's React SDK on web vs. its Expo SDK on native (same user, same wallet).
- **Pluses:** no App Review, so it's the **closed-beta channel from day one**; desktop Cash App deposits become "scan this QR"; updates ship instantly.
- **Minuses:** push only after "Add to Home Screen" on iPhone; more phishing risk (use a strict domain, passkeys and a PWA install prompt).
- **Apple Pay on web** works through the Coinbase Headless iframe in Safari.
- **No store cut on web** for Blunts+ (use Stripe for the subscription there). That's fine: the founder's "cut Apple in" applies to in-app sales.
- Gate states by **KYC address**, not IP.

---

## 8. Stack, cost and timeline

| Layer | Pick | Cost |
|---|---|---|
| App | Expo (iOS, Android, web). Three.js tray as an Expo DOM component | — |
| Auth + wallets | Privy (passkey + phone), gas via our relayer | Free to 499 MAU; $299/mo to 2.5k; $499/mo to 10k |
| Broker + KYC | Dinari (hosted KYC, dShares QQQ) | $2k/mo minimum; $0.20/order or gas in arrears (ask) |
| Bank rail | zerohash (+ Plaid resold) | Negotiated [UNVERIFIED] |
| Card rail | Coinbase Headless (apply for zero-fee USDC) | $0 minimum |
| Chain data | Alchemy webhooks (Arbitrum, Ethereum, Polygon) | ~free at launch |
| Screening | Chainalysis free sanctions API + OpenSanctions 30-day rescreen | ~€0.10/check |
| Backend | TypeScript API + Postgres (Supabase/Neon) + workers (Fly/Render) | ~$100–300/mo |
| Compliance tooling | Vanta/Drata for SOC 2, annual pen test, E&O + cyber | ~$2–5k/mo spread |
| Stores | Apple $99/yr, Google $25 | — |

**Fixed: about $6.5–11k/month. Variable: about $0.60–2.00 per active user per month.**

**Timeline (3 engineers):** weeks 0–4 are contracts, D-U-N-S, counsel, sandbox. Weeks 4–16 build. Weeks 12–18 are the web closed beta (non-NY Cash App first). Weeks 16–20 add zerohash bank + NY. Weeks 18–24 are Android, then iOS submission. Details: 18 §5.

---

## 9. Open questions that decide the plan (send this week)

| To | Ask | Why it matters |
|---|---|---|
| **Dinari** | NY residents eligible for dShares? Is a user-signed "Roll it" tap per deposit an acceptable pre-trade confirmation? Gas billed in arrears? Fixed platform fee OK under their 2040 opinion? Will they write an App Review letter? Wallet re-link after a lost passkey? 1099-B? | Launch-blocking |
| **zerohash** | NY + CA coverage for USDC on Arbitrum to a user-owned wallet; ACH pull + RTP payout pricing; minimums; Plaid resale; KYC reuse from Dinari | NY launch |
| **Coinbase** | Zero-fee USDC subsidy approval; NY coverage for Headless; Arbitrum delivery | Apple Pay at $0 |
| **Privy** | Co-sign-only policy signers; recovery guarantees; gas sponsorship from Expo | §1 option D, recovery |
| **Counsel** | Opinion on non-custodial design (FinCEN / NY / CA DFAL); fee structure; Blunts+ perks; Martin Act marketing review | Everything |
| **Real device test** | Cash App: which network a pasted 0x address sends on; QR formats; debit-card-funded USDC sends | Deposit UX |
