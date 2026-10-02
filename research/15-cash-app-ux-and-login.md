# 15: Cash App UX ("tap to pay"), "log in with your money account", and whether Blunts needs a login at all

**Date:** 2026-09-28 | **Status:** Research memo, not legal advice. **[UNVERIFIED]** marks anything I couldn't confirm in a primary source during this pass. Citations like [C1] point to the Sources list at the end.
**Builds on:** `09-cash-app-rails.md` (Path A: Cash App USDC ↔ Privy ↔ Dinari; Cash App Pay is prohibited), `05-payout-methods.md` (payout destinations, money-transmitter analysis) and `10-plaid-bank-fallback.md` §5 (Cash App gap check). This memo doesn't repeat that material. It adds what's new, corrected or checked more deeply.

---

## TL;DR

1. **No deep link can prefill a Cash App USDC send.** I found no URL, universal link or scheme that opens Cash App with a USDC (or on-chain bitcoin) address and amount already filled in. That covers `cash.app/...`, `cashme://` and `squarecash://`.
   - Cash App's help page, its press release and its ToS all describe the USDC send as manual: $ tab → amount → Pay → paste the address → Send [C1][C2][C3].
   - **There is one real prefilled deep link, and it's for Lightning only:** `https://cash.app/launch/lightning/<bolt11 invoice>`. Many open-source wallets use it (Breez SDK, Damus, Lexe and others) [G1][G2].
   - Breez already sells a "**Cash App → USDC on any chain**" flow built on it. The user pays a Lightning invoice from their Cash balance, and a swap provider delivers USDC to an address [G3].
   - That route costs **0.9% (Cash App) plus a swap-provider fee** and is capped at **$999 per 7 days** [C4][C5]. It's also bitcoin/Lightning, which excludes NY. **It's a possible "one-tap small fill" add-on, not the main rail** (§1.3).
2. **Cash App's scanner reads "a wallet QR code."** Cash App doesn't say whether it reads EIP-681 (`ethereum:0x…@42161/transfer?…`) URIs; **[UNVERIFIED; test on a device]**. Use a **plain 0x address QR**. A QR code is only useful when Blunts runs on a second screen (desktop or web).
3. **The send flow has no documented network picker.**
   - The press release says: "paste the recipient's wallet address in the search bar, then pay in U.S. Dollars" [C3].
   - How Cash App picks Arbitrum vs. Ethereum vs. Polygon for a 0x address is **still undocumented**. Keep the multi-chain inbound watcher from 10 §5.
   - The ToS now says a USDC send can be **funded from a linked debit card** if the Cash balance is short [C2]. That means a user with $0 in Cash App can still fill **[UNVERIFIED in practice]**.
4. **Payout address:** the user finds it at Money tab → **Deposit stablecoins** → pick **Arbitrum** → copy or show QR [C1]. **There's no API or registry to prove an address belongs to Cash App.** A **$1 test payout** that the user confirms in Cash App is the only reliable check.
5. **"Sign in with Cash App" doesn't exist.**
   - Block offers no OAuth/OIDC login, identity or profile-sharing API to third parties.
   - The closest thing is a Cash App Pay **customer request**. When the customer approves one, it returns only `customer_profile.id` and `$cashtag` [K1]. It's partner-gated, and Block's merchant policy bans "broker dealer or registered investment activity" and "cryptocurrency activities" [K2].
   - **Conclusion: Cash App-based login isn't possible for Blunts.** Collecting the user's Cash App Arbitrum address (and optionally their $cashtag as a display label) is the only "link".
6. **Other "log in with your money account" options:**
   - **PayPal:** "Log in with PayPal" still exists (openid, profile, email, address, phone, account-verification status, payer ID) [L1].
   - **Coinbase:** OAuth is now **limited to approved partners** and has no identity scopes; it's aimed at payments and trading [L2].
   - **Venmo:** the consumer and developer APIs are retired (secondary source [L3]).
   - **Plaid Layer** is the one that matters. From a phone number (plus DOB as a fallback), it returns **name, address, phone, email, DOB, full SSN and linked bank Items** for users in the "Plaid Network" [P1][P2].
   - Layer data is "user-submitted, unverified" [P2]. It **can prefill KYC but doesn't replace it.**
   - Dinari's Partner KYC accepts **Plaid Identity Verification** as an approved provider [D1].
   - Pricing: sales-only, **billed per converted session** [P1].
7. **Blunts can skip a *traditional* login, but it can't skip *identity*.**
   - The broker (Dinari) must run CIP: name, DOB, address, SSN [R1]. So every funded account is tied to a verified person anyway.
   - **Recommended setup:** Privy **passkey or phone OTP** as the only "login" (no passwords, no usernames). Require **a second linked method** (phone plus passkey, or Apple/Google) so the user can recover the account.
   - Use Privy **guest accounts** only for the pre-KYC tour. They expire after 30 days [V3].
   - Privy supports passkeys, SMS, email, Apple and Google on **React Native/Expo and web** [V1]. Passkeys on Expo need a custom dev build plus associated domains [V2].
   - **Privy pricing:** free up to 499 MAU, **$299/month** (500–2,499), **$499/month** (2,500–9,999), then enterprise or pay-as-you-go ($0.05/MAU over 10k; $0.01/signature over 50k) [V4].

---

## 1. "Tap to pay from Cash App": what's actually possible

### 1.1 Deep links and URL schemes: findings

| Link / scheme | What it does | Prefills address + amount for USDC? | Source |
|---|---|---|---|
| `https://cash.app/$cashtag/25` | Opens a P2P payment to a **$cashtag** with the amount filled in. The note can't be prefilled (developer forum) | **No.** Cashtags only | [G4] |
| Cash App **Payment Links** (Feb 2026) | The requester generates a link; Cash App "will open a pre-filled payment with the amount and note" | **No.** It's a P2P request *to a Cash App account*. Using it would mean Blunts receives money into its own Cash App, which is pooling (money transmission) plus a Business-account AUP issue | [C6] |
| `https://cash.app/launch/lightning/<bolt11>` | A universal link that opens Cash App's Lightning pay screen with the invoice (amount included). It falls back to the website if the app isn't installed | **Yes, but for Lightning (BTC), not USDC** | [G1][G2] |
| `https://cash.app/launch/bitcoin/$cashtag/<code>` | Seen in the wild. It appears to be a bitcoin *request* to a cashtag | No **[UNVERIFIED semantics]** | [G1] |
| `cashme://cash.app/launch/activity`, `cashme://cash.app/launch/offers/...` | The native scheme opens specific screens (Bitkey uses `activity`) | No known USDC path | [G1] |
| `cash.app/launch/usdc`, `…/stablecoin`, `…/ethereum` | **No evidence any of these exist**, either in GitHub code search or in Block docs | No | [G1] (negative search) |
| `squarecash://` | A legacy scheme; nothing documented for USDC | No **[UNVERIFIED]** | none |

**Bottom line:** the best the main USDC rail can do is **[Copy address] + [Open Cash App]**. `cashme://` or `https://cash.app/` just opens the app. The user still types the amount, taps Pay and pastes the address. That's about 5 taps plus a paste. Put the amount in the clipboard message ("Send $25") and the address in the clipboard itself.

### 1.2 Scanner and QR

- Help page: "tap the icon on the top left of your home screen to **scan a wallet QR code**" [C1]. The scanner definitely handles bitcoin and Lightning QR codes, and Lightning QRs go through Lightning automatically [C4].
- **EIP-681 support isn't documented anywhere.** Many wallets mis-parse `ethereum:` URIs with `@chainId/transfer` (MetaMask and Rabby both have open bugs) [G5].
- **Recommendation:** for desktop/web, show a QR of the **bare 0x address**, plus the amount in big text and "Pick Arbitrum if asked."
- **Device test list** (with one real account and $1):
  1. bare address QR;
  2. `ethereum:0x…` QR;
  3. full EIP-681 `ethereum:0xaf88d065e77c8cC2239327C5EDb3A432268e5831@42161/transfer?address=0xUSER&uint256=25e6`.

  Record whether each one prefills the network and the amount.

### 1.3 The Lightning "one-tap" alternative (optional add-on)

How it would work (the Breez SDK `prepare_payment_link` pattern [G3]):
1. Blunts gets a quote from a Lightning→USDC swap provider. The destination is **the user's own Privy address on Arbitrum**.
2. The provider returns a bolt11 invoice. Blunts opens `https://cash.app/launch/lightning/<invoice>`.
3. Cash App opens already filled in. The user picks "Cash balance" as the source and taps Pay. Cash App converts USD → BTC and sends it over Lightning (a "USD Lightning Transfer" in the ToS [C2]).
4. The provider delivers USDC to the user's wallet, and Blunts' watcher sees it arrive as usual.

| Factor | Lightning one-tap | Native Cash App USDC (main rail) |
|---|---|---|
| Taps | About 2 (open link, confirm) | About 5 plus a paste |
| Cash App fee | **0.9%** when funded from the Cash balance [C5] | $0 [C1] |
| Swap-provider fee | Yes (quote-based, partner-set) [G3] **[UNVERIFIED amount]** | None |
| Limit | **$999 per 7 days** on Lightning [C4] | $2k/day, $5k/week send [C1] |
| Amountless invoice | Cash App only lets the payer use their BTC balance; **the amount must be set** to allow fiat or debit funding [G2] | n/a |
| NY | Excluded (bitcoin/Lightning) | Excluded (stablecoins) |
| Regulatory | A third-party swap provider is in the flow. Is Blunts "arranging" a crypto exchange? Counsel question | Cleanest: user to user's own wallet |

**Verdict:** worth a later experiment for **$5–$25 "quick fills"** where two taps beat five. Don't launch with it: it adds a vendor, fees of roughly 1–2% all in, and a legal review.

### 1.4 Exact USDC send flow in Cash App (as documented)

| Step | Screen | Source |
|---|---|---|
| 0 | Identity verification is required (name, DOB, last 4 of SSN; sometimes full SSN, ID or address) | [C1][K3] |
| 1 | **Payments tab ($)** → enter **at least $1** | [C1] |
| 2 | Tap **Pay** | [C1] |
| 3 | **Paste the wallet address** ("in the search bar") *or* scan a QR from the top-left icon | [C1][C3] |
| 4 | Network choice: **not documented.** Earlier secondary coverage says the app "handles network selection behind the scenes" **[UNVERIFIED]** | [C3], secondary |
| 5 | Confirm with **Send**. The transfer is irreversible | [C1][C2] |
| Funding | Cash balance, or a **linked payment instrument if the balance is short** | [C2] §IX.18 |
| Fees | "There are no fees for sending or receiving stablecoins" (help page). The press release still says "fee-free to start… limited time" | [C1][C3] |
| Limits | Send $2,000/day and $5,000/week; receive $10,000/week; lower receive limits for accounts under 90 days old. Separate from bitcoin limits. Shown under Profile → Limits → Stablecoin | [C1] |
| Not eligible | NY residents, sponsored (teen) accounts | [C1] |

**Receive (payout) address:** Money tab → **Deposit stablecoins** → **select a network** → copy the address or share the QR [C1]. Deposits need "the required number of network confirmations" and "may be delayed" [C2] §IX.19. **Unlike bitcoin addresses, which rotate after each deposit [C7], nothing says stablecoin addresses rotate.** Assume they're static but re-confirm them every 90 days (10 §5) **[UNVERIFIED]**.

### 1.5 Can Blunts verify an address belongs to Cash App?

| Method | Works? |
|---|---|
| Block API or registry | **None exists** (no public address lookup; no customer-request action for crypto) [K1] |
| Cash App Pay grant returning an address | No. Grants return a `customer_id` and `$cashtag` only [K1] |
| On-chain heuristics (the address later sweeps to a known Block hot wallet; Arkham or Chainalysis labels) | Possible only *after* the first deposit. Labels aren't public **[UNVERIFIED]** |
| **$1 test payout plus "Did $1 arrive?" confirmation** | **Yes.** This is the only practical proof. Also checks that the network is right |
| Checks on paste | EIP-55 checksum; not the user's own Blunts address; not a known contract; OFAC screen |

---

## 2. "Sign in with Cash App": not possible

| Question | Answer | Source |
|---|---|---|
| OAuth/OIDC "Sign in with Cash App"? | **No such product.** Cash App's own login is a one-time code to phone or email, with web access at cash.app/account. No third-party SSO | [C8] |
| Customer grants that reveal identity? | The Customer Request API returns, on approval, `customer_profile { id, cashtag }` and grants. **No name, email, phone or verification status** | [K1] |
| Grant actions available | `ONE_TIME_PAYMENT`, `ON_FILE_PAYMENT`, `ON_FILE_PAYOUT`, `ON_FILE_DEPOSIT`, `LINK_ACCOUNT` (manages a customer's *merchant* profiles), `CHECKING_BALANCE` (read balances) | [K1][K4] |
| Who can use it | Cash App Pay **PSP partners** and the merchants they onboard. Payouts are "only supported for Cash App Pay PSP partners" | [K5] |
| Is Blunts eligible? | **No.** The merchant policy prohibits "money services businesses … cryptocurrency activities; broker dealer or registered investment activity" | [K2] |
| "Checkout powered by Cash App" | Stored checkout info on **cash.app ordering profiles** (Square sellers). It explicitly excludes P2P, virtual currency and direct deposit. Not an SSO | [C2] §4 |
| Afterpay | A BNPL checkout with grants for merchants. Same policy family; no identity product for investing apps **[UNVERIFIED for Afterpay's own AUP wording]** | [K6] |

**Conclusion:** Cash App login can't be done, and even the grant route would only yield a $cashtag, which proves nothing about identity. **Treat the $cashtag as optional, user-typed display text** ("Sparks go to $shaw's Cash App").

---

## 3. Cash App's standard ACH rails (update to 09 §4)

| Item | Finding | Source |
|---|---|---|
| Getting account and routing numbers | Money tab → tap the balance → copy. **You must order and activate a Cash App Card first.** Some users only see the numbers after the physical card arrives | [C9] |
| Bank of record | "Block Inc, c/o Sutton Bank, Attica, OH", checking account | [C9] |
| Direct deposit in | $25,000 per deposit, $50,000 per 24h. Typically 1–5 business days after the sender sends it; available as soon as it's received | [C10] |
| Third-party ACH **debits** (pulls) | Allowed. They're "subject to available funds and limitations." Users can **block a merchant** with 3 business days' notice (only after the merchant has debited once) | [C2] |
| Plaid | Cash App isn't a Plaid institution. Use manual entry plus micro-deposits or Database Auth (09, 10) | 09 |
| Reliability of pulls | No public return-rate data. The risk is NSF when the P2P balance gets spent, plus the merchant-block feature. **[UNVERIFIED; ask zerohash/Alpaca for Sutton return rates]** | judgment |
| Unverified accounts | $1,000 per rolling 30 days send/receive and a $1,500 total balance cap until ID verification | [C11] |
| **Paper Money** cash-in | Verified users only. **$1 per deposit** (Green customers too). **$5 minimum, $500 maximum per deposit, $5,000 per 7 days, $10,000 per 30 days.** Some retailers require $20 minimum for card-swipe deposits. At Walmart, Walgreens, CVS and others via the barcode or Cash Card. Then send USDC as usual | [C12] |

Paper Money means a **cash-only user can fund Blunts**: store → Cash App → USDC → Blunts. On a $20 fill the $1 fee is 5%, so nudge these users toward $50 or more.

---

## 4. "Log in with your money account": alternatives

| Option | Exists in 2026? | What you get | Fit for Blunts |
|---|---|---|---|
| **Plaid Layer** | Yes (US only, sales-gated) | A phone number (plus DOB fallback) finds a "remembered" Plaid profile. The user confirms, and `/user_account/session/get` returns **name, address, phone, email, DOB, SSN, SSN last 4 and linked Items (access tokens)**. Plaid authenticates the user via SNA or SMS OTP | **Best "one tap to prefill."** Prefills the KYC form and links a bank for the zerohash fallback in the same step |
| Plaid Identity Verification (IDV) | Yes | Doc plus selfie KYC; approved for Dinari Partner KYC | Pair with Layer if Blunts does Partner KYC |
| **Log in with PayPal** | Yes | Scopes include openid, profile, email, address, phone, **account verification status** and payer ID | A decent prefill. Not KYC-grade. Whether it's allowed for investing apps and needs app review is **[UNVERIFIED]**. It's also a *third-party login*, which triggers Apple 4.8 |
| **Coinbase OAuth** | Yes, but "client creation is currently limited to **approved partners**" | Payouts, payments, trading scopes. **No documented identity scopes** | Poor. Only useful later for "send from Coinbase" |
| **Venmo** | Consumer and developer APIs retired to new developers (secondary) | Nothing | None |
| **Sign in with Apple / Google** | Yes (Privy supports both) | Name and email (Apple can hide the email) | Good as the *second recovery factor*. If Google is offered, Apple 4.8 needs an equivalent private option; Sign in with Apple satisfies it |
| **Passkeys** | Yes | A device-bound, synced credential (iCloud Keychain / Google Password Manager) | **Best primary login** |

**Plaid Layer details** [P1][P2]:
- **Eligibility:** the user must previously have chosen "remember me" in any Plaid Link flow. Only +1 phone numbers qualify.
- **Extended Autofill** covers more users by adding the DOB.
- The template sets which fields are required. Layer doesn't work in Hosted Link or webview modes.
- Minimum React Native SDK is 11.11.0 (12.4.0 for Extended Autofill).
- **The data is user-editable and "unverified."** Plaid returns edit-history stats. Run IDV or Identity Match on top.
- **Billing:** per converted session (`onSuccess`). No charge for eligibility checks. **The price isn't public; it's sales-only** (secondary sources put Layer in the Growth/Custom tiers [P3]).
- **KYC prefill:**
  - With **Dinari Managed KYC** (hosted URL), there's no documented way to pass in prefill data **[UNVERIFIED; ask Dinari]**. Layer only saves typing on Blunts' own extra fields.
  - With **Dinari Partner KYC** (needs provisioning, a supported IDV vendor such as Plaid IDV, and **Blunts' own AML program** [D1]), Layer + IDV → `Submit KYC Data` gives the smoothest onboarding. But Blunts then owns KYC operations. Treat that as a phase-2 decision.

---

## 5. Can Blunts avoid a traditional login?

### 5.1 What's required no matter what

- **A broker CIP is mandatory:** name, DOB, address and ID number (SSN), verified with risk-based procedures [R1]. Dinari runs it via Managed KYC or relies on Blunts' Partner KYC [D1]. **So every funded account is bound to a real, verified person.** "No login" can only mean "no password or username," never "anonymous."
- Cash App also verifies identity before any USDC send [C1]. Blunts can't *rely* on that, though. There's no data sharing (§2).

### 5.2 Privy auth options (React Native/Expo and web)

| Method | Web (React) | React Native / Expo | Notes |
|---|---|---|---|
| Email OTP | Yes | Yes | |
| SMS (and WhatsApp) OTP | Yes | Yes | SMS delivery costs and fraud controls **[UNVERIFIED pricing]** |
| Passkey (sign up and log in) | Yes | Yes | Expo needs `react-native-passkeys`, a **custom dev build (not Expo Go)**, iOS `webcredentials:` associated domain (AASA file) and Android `assetlinks.json` plus the key hash in the dashboard [V2] |
| OAuth: Apple, Google (plus Twitter, Discord, etc.) | Yes | Yes | |
| Guest accounts | Yes (react-auth ≥1.77) | Not shown in RN docs **[UNVERIFIED]** | Full embedded wallet with no login. **Expires after 30 days.** Can only *upgrade* to a new account, not merge into an existing one [V3] |
| Custom JWT (bring your own auth) | Yes | Yes | |
| Wallet MFA (SMS, TOTP, passkey) | Yes | Yes | Can require re-authentication before signing |

Sources: [V1][V2][V3][V5].

### 5.3 Wallet custody and recovery (why a second method matters)

- Privy's current embedded wallets are **TEE-based, with a 2-of-2 Shamir split.** One share lives in the AWS Nitro enclave; the "auth share" is released only when the user authenticates. Privy can't reconstruct keys unilaterally [V5].
- **Recovery = logging in again with any linked method.** No seed phrase is needed.
- The flip side: if the user's *only* linked method is a passkey that wasn't synced, or a phone number they lost, **they lose the wallet** **[inference from the architecture; confirm with Privy]**.
- **Wallet export:** users can export the private key, and developers can export keys and identity mappings to migrate away [V5].
- **Session signers:** these give the backend policy-scoped signing power (needed for auto-buy or auto-payout). This affects the money-transmitter analysis (05 §1).
- **The broker side is separate.** If a user loses their wallet, their dShares sit with Dinari under a KYC'd Entity. Whether Dinari can re-link a new wallet to the same Entity is **[UNVERIFIED; ask Dinari]**. This is a key fallback to confirm.

### 5.4 Recommended account model

1. **Open the app** → the "See how it works" tour. A Privy guest account is optional (it expires in 30 days).
2. **Create account:** a single tap. **Passkey** (Face ID) on iOS/Android. On web, passkey or phone OTP. No password.
3. **Add a backup, required before the first fill:** phone number (SMS OTP) *or* Sign in with Apple/Google. Explain it as "so you never lose your money." If Plaid Layer is adopted, **the same phone number also drives the Layer lookup.**
4. **KYC:** Dinari Managed KYC (hosted). Later, Plaid Layer + IDV → Partner KYC.
5. **Link Cash App (payout):** paste the Arbitrum address → $1 test → confirm. Optional $cashtag label.
6. **Returning users:** passkey only. Offer MFA-before-signing for sparks over $X.

### 5.5 Privy pricing (fetched 2026-09-28) [V4]

| Plan | MAU | Price | Includes |
|---|---|---|---|
| Core | 0–499 | Free | 50k signatures/month, $1M transaction volume/month |
| Scale | 500–2,499 | $299/month | Signature and MAU fees beyond the included amounts |
| Professional | 2,500–9,999 | $499/month | Same |
| Enterprise | 10k+ | Custom (from about $0.001/signature) | Webhooks, policy engine, key quorums, custodial wallets |
| Pay-as-you-go overage | | $2,000 base; $0.05/MAU over 10k; $0.01/signature over 50k | |

All plans include embedded wallets, native gas sponsorship and email, SMS, social and passkey login [V4]. Note that the **policy engine is listed under Enterprise.** Scoped session signers for auto-buy may therefore need the Enterprise plan **[UNVERIFIED; confirm]**.

---

## 6. Open questions / device tests

1. **Cash App device test (one real account):**
   - paste a 0x address: is there a network picker, and what's the default?
   - scan three QR formats (§1.2);
   - is the Arbitrum deposit address the same as the Ethereum/Polygon one, and does it rotate?
   - minimum receive;
   - is a sub-$1 test credited?
   - does a debit-card-funded USDC send actually work when the balance is $0?
2. **Lightning add-on:** swap-provider quotes (Breez/Orchestra or others) for $10/$25/$100 → USDC on Arbitrum, and counsel's view.
3. **Plaid:** Layer pricing, fill rate for a Gen-Z/Cash App audience, and whether Layer can run alongside the zerohash Plaid-reseller model (10).
4. **Dinari:** Managed KYC prefill parameters; re-linking a new wallet to an existing Entity; Partner KYC requirements (AML program).
5. **Privy:** guest accounts on React Native; whether session-signer policies need Enterprise; SMS costs.
6. **PayPal:** whether an investing app may use Log in with PayPal, and what the `account_verified` attribute actually means.

---

## Sources

**Cash App / Block (consumer)**
- [C1] Cash App Help, "Stablecoins" (fetched raw 2026-09-28): https://cash.app/help/us/en-us/31115-stablecoins
- [C2] Cash App Terms of Service (last updated 2026-09-11; §IX.16 USD Lightning Transfer, §IX.18 Stablecoin Withdrawals incl. "linked payment instrument", §IX.19 Stablecoin Deposits; ACH debit and merchant-blocking clauses; §4 Checkout powered by Cash App): https://cash.app/legal/us/en-us/tos
- [C3] Cash App press, "Stablecoins are now available on Cash App" ("paste the recipient's wallet address in the search bar"): https://cash.app/press/cash-app-stablecoins-all-customers
- [C4] Cash App Help, "Sending and Receiving Bitcoin with Lightning" (scan flow, $999/7-day limit, QR auto-Lightning, receive as dollars 0.9%): https://cash.app/help/us/en-us/6506-bitcoin-lightning
- [C5] Cash App Help, "Bitcoin fees" (Lightning from Cash balance 0.9%): https://cash.app/help/us/en-us/3103-bitcoin-fees
- [C6] Cash App press, "Cash App Launches Payment Links" (2026-02-10): https://cash.app/press/cash-app-launches-payment-links ; TechCrunch: https://techcrunch.com/2026/02/11/cash-app-adds-payment-links-so-you-can-get-paid-in-a-dm/
- [C7] Cash App Help, "Deposit bitcoin" (address changes after each deposit): https://cash.app/help/us/en-us/3107-deposit-bitcoin
- [C8] Cash App Help, "Log in and manage your account on the web": https://cash.app/help/us/en-US/6801-log-in-and-manage-your-account-on-the-web
- [C9] Cash App Help, "Set up direct deposit" (Cash Card required; Sutton Bank): https://cash.app/help/us/en-us/31111-setup-direct-deposit ; account details: https://cash.app/help/us/en-us/3111-direct-deposit-account-details ; bill pay: https://cash.app/help/us/en-us/3113-bill-pay
- [C10] Cash App Help, "Direct deposit" and "ACH direct deposits": https://cash.app/help/us/en-us/1113-direct-deposit ; https://cash.app/help/us/en-us/6570-cash-app-and-ach-direct-deposits
- [C11] Cash App Help, "Account limits": https://cash.app/help/us/en-us/6543-account-limits
- [C12] Cash App Help, "Paper Money deposits" ($1 fee; $5–$500 per deposit; $5k/7d; $10k/30d): https://cash.app/help/us/en-us/6488-paper-money-deposits

**Cash App Pay (developer)**
- [K1] Customer Request API, Retrieve request (customer_profile id/cashtag; grants): https://developers.cash.app/cash-app-pay-partner-api/api-reference/customer-request-api/retrieve-request ; On-file payments: https://developers.cash.app/cash-app-pay-partner-api/guides/technical-guides/payment-processing/on-file-payments
- [K2] Cash App Pay Merchant Use Policy (Financial Services prohibited): https://developers.cash.app/cash-app-pay-partner-api/guides/partnerships/merchant-use-policy.md
- [K3] FAQ: Customer Identity Verification: https://developers.cash.app/cash-app-pay-partner-api/guides/resources/frequently-asked-questions/customer-identity-verification.md
- [K4] Action schemas (LINK_ACCOUNT, CHECKING_BALANCE, ON_FILE_PAYOUT, ON_FILE_DEPOSIT): https://developers.cash.app/cash-app-pay-partner-api/api-reference/customer-request-api/schemas/action.md ; https://developers.cash.app/cash-app-pay-partner-api/api-reference/customer-request-api/schemas/link-account-action.md ; https://developers.cash.app/cash-app-pay-partner-api/api-reference/customer-request-api/schemas/checking-balance-action.md
- [K5] Payouts, "only supported for Cash App Pay PSP partners": https://developers.cash.app/cash-app-pay-partner-api/guides/technical-guides/payouts/about.md
- [K6] Afterpay developer index (grants): https://developers.cash.app/afterpay/llms.txt

**Deep-link evidence (GitHub / SDKs)**
- [G1] GitHub code search for `cash.app/launch` (Damus, Lexe, Nostur, stemstr, Bitkey `cashme://cash.app/launch/activity`, etc.), run 2026-09-28 via `gh search code`. Examples: https://github.com/damus-io/damus ; https://github.com/proto-at-block/bitkey
- [G2] Breez SDK, "Buying Bitcoin" (Cash App universal link `https://cash.app/launch/lightning/<bolt11>`; amount required for fiat funding): https://github.com/breez/spark-sdk/blob/main/docs/breez-sdk/src/guide/buy_bitcoin.md
- [G3] Breez SDK, "Cash App to USDC/USDT payments": https://github.com/breez/spark-sdk/blob/main/docs/breez-sdk/src/guide/cash_app_to_usdc_usdt.md ; Breez Cash App deposits: https://breez.technology/igaming/
- [G4] Square developer forum (cashtag amount links; no note prefill): https://developer.squareup.com/forums/t/pre-populate-cashapp-transaction-note-using-url-query-example-cash-app-cashtag-123-note-prepopulate-note-here/3321
- [G5] EIP-681 parsing bugs: https://github.com/MetaMask/metamask-mobile/issues/27896 ; https://github.com/RabbyHub/rabby-mobile/issues/1565 ; EIP-681: https://eips.ethereum.org/EIPS/eip-681

**Login alternatives**
- [L1] PayPal, "Log in with PayPal" (scopes): https://developer.paypal.com/log-in/how-it-works
- [L2] Coinbase OAuth2 overview ("limited to approved partners"): https://docs.cdp.coinbase.com/coinbase-app/oauth2-integration/overview
- [L3] Vorp Labs, "Venmo CLI and API: what is official, retired" (secondary): https://vorplabs.com/agent-tools/venmo-cli
- [L4] Apple App Review Guideline 4.8 Login Services: https://developer.apple.com/app-store/review/guidelines/

**Plaid**
- [P1] Plaid Layer overview (eligibility, Extended Autofill, SDK versions, billing per converted session): https://plaid.com/docs/layer/
- [P2] Plaid Layer API (`/user_account/session/get` identity fields incl. SSN; "user-submitted, unverified"): https://plaid.com/docs/api/products/layer/
- [P3] Secondary pricing (Layer in Growth/Custom tiers): https://www.vendr.com/marketplace/plaid ; Plaid pricing page: https://plaid.com/pricing/

**Dinari / regulation**
- [D1] Dinari, Identity Verification (Partner KYC vs Managed KYC; approved IDV providers incl. Plaid IDV; AML program required): https://docs.dinari.com/docs/managing-kyc.md ; Submit KYC Data: https://docs.dinari.com/reference/createentitykyc.md
- [R1] 31 CFR 1023.220, broker-dealer CIP: https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1023/subpart-B/section-1023.220

**Privy**
- [V1] React Native features matrix: https://docs.privy.io/basics/react-native/features ; auth overview: https://docs.privy.io/authentication/user-authentication/privy-auth
- [V2] Passkey login and Expo setup: https://docs.privy.io/authentication/user-authentication/login-methods/passkey ; https://docs.privy.io/basics/react-native/advanced/setup-passkeys
- [V3] Guest accounts (30-day expiry): https://docs.privy.io/authentication/user-authentication/login-methods/guest
- [V4] Privy pricing (fetched 2026-09-28): https://www.privy.io/pricing
- [V5] Security architecture and FAQ (TEE, 2-of-2 SSS, session signers, key export): https://docs.privy.io/security/wallet-infrastructure/architecture ; https://docs.privy.io/security/security-faqs ; user authentication tokens: https://docs.privy.io/security/authentication/user-authentication
