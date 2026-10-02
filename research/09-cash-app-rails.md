# 09: Cash App in, Cash App out: rails for Blunts (fill / spark → QQQ)

**Date:** 2026-09-28 | **Status:** Research memo, not legal advice. **[UNVERIFIED]** marks anything I couldn't confirm in a primary source during this pass. Citations like [C1] point to the Sources list at the end.
**Builds on:** `04-us-stack-dinari-alpaca.md` (§1 Dinari, §3 the Cash App → Dinari path), `05-payout-methods.md` (payout destinations, money-transmitter analysis) and `07-alpaca-ria-turnkey.md` (licensing). This memo doesn't repeat that material. It adds what's new or corrected.

---

## TL;DR

1. **Only one path is truly "Cash App in AND Cash App out" in minutes: Cash App USDC on Arbitrum ↔ the user's own embedded wallet ↔ Dinari dQQQ (Path A).**
   - It needs **no agreement or approval from Block**. Cash App will send USDC to *any* address and credit USDC from *any* address.
   - Money reaches the user's Cash App balance in about a minute.
   - It works for someone who has **only Cash App**: no bank, no Cash Card, just Cash App identity verification.
   - The permissioned part is **Dinari**: a partner contract, **$2k/month minimum**, SOC 2 (or equivalent), and Dinari's KYC. **NY users are excluded** because Cash App's stablecoin feature excludes NY [C1].
2. **Cash App Pay (Path D) is dead for this use case.** Block's merchant policy explicitly **prohibits "broker dealer or registered investment activity"**, "cryptocurrency activities" and "money services businesses" [C4]. Cash App Pay does have an early-access **Payouts** API (merchant → customer) [C5][C6]. It would be banned by the same policy, and it would make Blunts the money transmitter anyway.
3. **Cash App ACH via Alpaca or Atomic (Path C) works in both directions, NY included, but it's slow and has more friction:**
   - Cash App account and routing numbers **require ordering and activating a Cash App Card**. Some users must wait for the physical card to arrive [C3].
   - **Cash App is not a Plaid institution.** The user has to type the numbers in manually, then verify with micro-deposits (1–2 business days) or Plaid Database Auth [P1][P2].
   - ACH takes about 1–3 business days each way.
   - Cash App's ToS explicitly allows third-party ACH debits from the balance [C2]. That means pulling from Cash App is allowed, but pulls can bounce if the balance is short (NSF returns).
4. **Alpaca stablecoin funding (Path B) is a poor fit today for $5–$100 tickets.**
   - Production chains aren't published. The sandbox lists only **Ethereum and Solana** for USDC, so there's **no Arbitrum** [A1].
   - USDC becomes buying power through a **USDC/USD crypto trade** [A1]. That needs Alpaca Crypto, and **Alpaca Crypto excludes NY** [A5].
   - Withdrawals need a **24-hour address whitelist** with travel-rule data [A1]. The older retail FAQ adds a **0.5% withdrawal fee and a 20 USDC minimum** [A3]. Whether the 2026 Broker stablecoin product keeps those terms is **[UNVERIFIED]**.
   - It could become the best path if Alpaca confirms **Solana**, bps-level fees and no crypto account. Cash App sends on Solana too.
5. **Dinari's $0.20 isn't a commission. It's a flat *network fee*, and partners can instead choose "Billing in Arrears" at actual gas cost** [D2]. On Arbitrum that is plausibly cents **[UNVERIFIED actual cost]**, which makes $5 fills viable. Dinari "does not collect transaction fees" [D2]. You can't batch across users because omnibus accounts are prohibited [D1]. Limit orders don't change the fee.

**Recommendation:** launch on **Path A** (Cash App USDC ↔ Dinari on Arbitrum) for the 49 non-NY states. The launch plan is:
- Negotiate billing in arrears.
- Use a Privy EOA embedded wallet with native gas sponsorship.
- Make the spark payout a single tap to a Cash App Arbitrum address the user saved once.
- Put NY on a waitlist, or add **Path C** (Alpaca ACH to Cash App routing numbers) later as the NY/"no-crypto" rail.

---

## 1. Ranked options

| Rank | Path | Fill (in) | Spark (out) | Speed in / out | Per-txn cost (Blunts or user) | Works with Cash App only (no bank)? | NY | Partner approvals needed |
|---|---|---|---|---|---|---|---|---|
| **1** | **A. Cash App USDC ↔ Dinari dQQQ (Arbitrum)** | User sends USD as USDC from the Cash App $ tab to their Blunts wallet address | Sell → USDC in the user's wallet → one-tap send to their Cash App Arbitrum address | About 1 min / about 1 min after the sell fills | Cash App $0 [C1]. Dinari $0.20 per order (flat) or actual gas (arrears) [D2]. Payout gas about $0.01–0.05 (sponsored) **[UNVERIFIED]** | **Yes.** Only Cash App ID verification needed [C1] | **No** (Cash App stablecoins exclude NY) | Dinari (contract, $2k/mo, SOC 2 or equivalent, compliance review of screens). Privy (self-serve). **None from Block** |
| 2 | C. Cash App ACH ↔ Alpaca (or Atomic) | Alpaca pulls ACH from the Cash App routing/account number | Alpaca pushes ACH to the same numbers | 1–3 business days / 1–3 business days **[UNVERIFIED exact]** | ACH $0 at Alpaca [04]. Plaid Auth or micro-deposit fees **[UNVERIFIED]** | **Only with an activated Cash App Card** (that's what unlocks the numbers) [C3] | **Yes** | Alpaca (partner approval; licensing issue per 07) or Atomic (Promoter). **None from Block** |
| 3 | B. Cash App USDC ↔ Alpaca stablecoin funding | Cash App sends USDC (Ethereum or Solana) to the per-account Alpaca deposit address | USD → USDC → withdraw to a whitelisted Cash App address | Minutes / 24h whitelist on first use | Crypto trade fee up to 25 bps taker at the lowest tier (Trading API) [A4]. Withdrawal 0.5% + network fee + 20 USDC minimum (older FAQ) [A3] | Yes | **No** (Cash App and Alpaca Crypto both exclude NY) | Alpaca must enable the Crypto Wallets API [A1] |
| ✗ | D. Cash App Pay (checkout + Payouts) | n/a | n/a | n/a | n/a | n/a | n/a | **Prohibited category** [C4] |

---

## 2. Path A in detail: Cash App USDC ↔ Dinari (Arbitrum)

### 2.1 What's confirmed

**Cash App side (primary: help page 31115 [C1])**
- Networks: Solana, Ethereum, Polygon, **Arbitrum**. Base is not supported.
- Fees: "There are no fees for sending or receiving stablecoins on Cash App." The May press release said "fee-free to start" [C6b]. Assume a fee will come.
- Sending: Payments tab ($) → "Enter at least $1" → Pay → paste the wallet address, or scan a wallet QR from the home-screen icon → Send. **The minimum send is $1.**
- Receiving: Money tab → Deposit stablecoins → select network → wallet address or QR. Funds are "instantly converted to U.S. dollars in your Cash Balance."
- Limits:
  - send $2,000/day and $5,000/week;
  - receive $10,000/week;
  - lower receive limits for accounts under 90 days old;
  - identity verification required.
- Availability: not available in NY, and not for sponsored (teen) accounts.
- Transfers are irreversible. There are no chargebacks, so fills carry **no return risk** (unlike ACH).

**Dinari side (primary: docs [D1]–[D5])**
- US accounts settle in **USDC only**, via Circle.
- Wallets must be **dedicated** per user, **EOA or standard smart-contract** wallets are allowed, and the wallet must not already hold dShares.
- Dinari sends an on-chain verification transfer before it delivers dShares.
- **Partners may not pool orders** (no omnibus accounts).
- Partners must OFAC-screen "all inbound wallet funding sources."
- **Withdrawal API** (for managed accounts): converts to USDC **on Arbitrum** and sends to a recipient `Account` that belongs to the **same Entity** and is connected to a **non-managed wallet** [D3]. Ownership is proven by signing a nonce [D4].
- **Order flows** [D5]:
  - *Managed orders* are for Dinari-managed wallets; no user signature.
  - *EIP-155 permit orders* are for the user's own wallet: the user signs a permit, and Dinari can submit it ("Dinari Sponsored").
  - Managed wallets appear limited to "your organization's accounts" [D6]. Whether managed wallets are available to US end users is **[UNVERIFIED]**.
- **Fees** [D2]:
  - "Dinari does not collect transaction fees from our partners or their end users."
  - The **$0.20 is a "Standard Network Fee"** per order (Ethereum mainnet is priced at gas).
  - Alternatively, partners can "aggregate and pay network fees **at cost in arrears**."
  - The optional `fee` field (default $0.20) lets the partner set the fee on each order, including EIP-155 permit orders.
  - API access starts at **$2,000/month**.
  - Market data costs $0.0075 per NBBO quote query [D1].
- QQQ trades in Dinari's **24/7 weekend session** (limit orders only outside regular hours) [04 §1.4]. That matches Cash App's 24/7 sends.

### 2.2 Answers to the specific questions

| Question | Answer |
|---|---|
| Can Dinari send the spark proceeds **directly** to a Cash App address? | **No.** Dinari only withdraws to a same-Entity account with a **non-managed wallet whose owner signed a nonce** [D3][D4]. A Cash App deposit address is custodial (Block holds the keys), so it can't sign. **So there are two hops:** proceeds land in the user's embedded wallet, then the user's wallet sends USDC to Cash App. Once the USDC is in the user's own wallet, Dinari's rules no longer govern it: it's plain USDC, and dShares never leave (they're non-transferable). Note that with the external-wallet (EIP-155) model, sell proceeds should settle straight to the user's wallet, so the Dinari withdrawal API may not be needed at all **[UNVERIFIED; confirm with Dinari]**. |
| Can Cash App send **directly** into Dinari? | Yes, to the user's dedicated wallet address. The user's wallet then signs the buy permit. Dinari's US diagram shows CustomerWallet → Dinari Managed Wallet → Circle → USD brokerage account [D1]. So Cash App → user wallet → Dinari is the documented shape. Sending Cash App USDC **straight to a Dinari managed deposit address** (skipping the user wallet on the way in) isn't documented **[UNVERIFIED; ask]**. |
| Does the user have to sign? | Every buy permit and every USDC payout must be signed by the user's wallet. With **Privy embedded wallets** the signature is silent: no pop-up, just the logged-in session (passkey or OTP). **Auto-buy on deposit while the app is closed** would need Privy *session signers* (server-side delegated signing). That weakens the "user controls funds" money-transmission argument. Keep delegated signing limited to "buy QQQ for this wallet" and have counsel review it (see 05 §1). |
| Gas | Buys and sells: included in Dinari's $0.20 ("Dinari Sponsored" permit submission) or billed at cost in arrears [D2][D5]. Payout USDC transfer: **Privy native gas sponsorship** (the app pays gas credits, and the wallet stays an EOA) [PV1][PV2]. An Arbitrum USDC transfer is about $0.01–0.05 (secondary source [PV3]) **[UNVERIFIED]**. Prefer an **EOA with native sponsorship over an ERC-4337 smart account**. Smart-account deployment costs about $0.30–1.00 [PV3], and whether Cash App credits deposits from contract wallets is **[UNVERIFIED]**. |
| Deep link / QR / Cash App Pay to prefill the send? | **No documented deep link** prefills a USDC send (address plus amount) in Cash App. Cash App's `cash.app/$cashtag/amount` links only target cashtags **[UNVERIFIED that no USDC scheme exists]**. Cash App Pay is prohibited [C4]. QR scanning only helps when Blunts runs on a second screen (web or desktop). **Best UX:** a "Copy address + Open Cash App" button, and a one-time "Your Blunts address" card. After the first send, check whether Cash App keeps the address as a recent recipient **[UNVERIFIED; test on device]**. |
| Network confusion | A 0x address is valid on Ethereum, Polygon *and* Arbitrum. How Cash App chooses the network when you paste one (picker vs. auto) is **not documented** [C1]. Secondary sources say the UI guides network selection **[UNVERIFIED]**. **Mitigation:** Dinari/Privy wallets are EOAs, so the *same address* exists on every EVM chain. USDC sent on the wrong EVM network (Ethereum or Polygon) is **not lost**. Blunts can detect it and bridge it (CCTP) at its own cost. Show "Pick **Arbitrum**" in the instructions anyway. For payouts, Blunts controls the network: always Arbitrum, to the address the user copied from Cash App → Deposit stablecoins → **Arbitrum**. |
| Is this "permissionless"? | **Cash App leg: yes.** No Block contract, API key or approval. It's just a user-initiated on-chain transfer, capped by the user's own Cash App limits. **Wallet leg: yes** (Privy is self-serve). **Brokerage leg: no.** Dinari is a permissioned broker-dealer partner. Any US-legal QQQ exposure needs a BD/KYC partner. Permissionless tokenized QQQ (QQQx, QQQon, Robinhood tokens) **excludes US persons** (02 §1). |
| NY | Excluded (Cash App). Dinari itself covers NY. |

### 2.3 Cost per fill (Path A)

Assumes Cash App stays free, one order per fill, and sponsored Arbitrum payout gas of about $0.02 **[UNVERIFIED]**.

| Fill | Buy: flat $0.20 | Buy: arrears at ~$0.03 gas **[UNVERIFIED]** | Round trip (buy + sell + payout gas), flat | Round trip, arrears |
|---|---|---|---|---|
| $5 | $0.20 = **4.0%** | ~0.6% | $0.42 = **8.4%** | ~$0.08 = ~1.6% |
| $25 | 0.8% | ~0.12% | 1.7% | ~0.3% |
| $100 | 0.2% | ~0.03% | 0.42% | ~0.08% |

**Fixed costs:**
- Dinari **$2,000/month** minimum.
- SOC 2 Type II, roughly $20–60k (04).
- Privy MAU pricing **[UNVERIFIED]**.
- NBBO quote fees at $0.0075 per query [D1]. Don't poll quotes. Only fetch one on the pre-trade quote screen that Dinari requires.

**Ways to cut the per-order cost:**
1. **Billing in arrears** at actual gas [D2]. This is the big one.
2. Enforce a **minimum fill of $10**, or default users to weekly fills.
3. **Per-user accumulation:** hold the user's USDC in *their own* wallet and buy once per day or when it reaches $X. This is allowed because nothing is pooled, but it adds a "pending" state to the UI.
4. You **cannot** batch across users (omnibus prohibited [D1]).
5. Limit vs. market orders make no difference; the fee is per order.
6. Blunts' own revenue can go in the `fee` field on sells only (legal caveats in 04 §A and 07).

### 2.4 User journey (screens): Path A

**Onboarding (one time, about 3–5 minutes):**
1. **Welcome.** Sign in with phone or email OTP. Privy silently creates an EOA embedded wallet.
2. **"Who are you?"** Dinari **Managed KYC**: `Create Managed KYC Check` returns a hosted URL [D7]. Embed it in a webview. It collects name, DOB, SSN, address, ID and selfie (vendor **[UNVERIFIED; possibly Persona]**). Blunts separately collects the Dinari US fields the hosted check doesn't: employment, income and net-worth ranges, affiliations, trusted contact (can be deferred) [D1].
3. **Disclosures and agreements** screen (checkbox list required by Dinari) [D1].
4. Behind the scenes:
   - Blunts creates the Dinari Entity and Account;
   - the wallet signs the connection nonce silently [D4];
   - Dinari sends its verification transfer [D1];
   - Blunts OFAC-screens the wallet.
5. **"Where should sparks go?"** Show 3 illustrated steps: Cash App → Money → Deposit stablecoins → **Arbitrum** → Copy. Then a paste field. Validate that it's a 0x address and not the user's own Blunts address. Save it as the default payout. Optionally send a $0.01 test to confirm it credits **[UNVERIFIED whether Cash App credits sub-$1 receives]**.
6. **State gate:** hide the Cash App rail for NY by KYC address (and IP).

**Fill:**
1. Home: big **"Fill"** button → amount chips ($5 / $25 / $100).
2. **Fill screen:** "Send **$25** from Cash App to your Blunts address." Buttons: **[Copy address]** and **[Open Cash App]**. Mini-steps: "$ tab → type 25 → Pay → paste → choose **Arbitrum** → Send."
3. In Cash App: $ tab → 25 → Pay → paste → (Arbitrum) → Send.
4. Back in Blunts, a "Waiting for your cash…" spinner watches the address (Alchemy or QuickNode webhook, about 1 minute).
5. On arrival:
   - OFAC-screen the source address;
   - show the **Dinari quote screen** (required pre-trade estimate);
   - the user taps **"Light it"** and the wallet silently signs the EIP-155 permit;
   - Dinari submits it and buys dQQQ.
6. **Done:** "You own $24.80 of QQQ" (after the fee).
   - Any amount the user sent that is different from what they chose gets bought as-is.
   - USDC that arrives on Ethereum or Polygon gets auto-bridged.

**Spark:**
1. Home: **"Spark"** → amount or "All" → quote screen → **"Spark it"**.
2. The wallet signs a sell permit, and USDC proceeds settle to the user's wallet (T+0 on-chain once the fill completes).
3. Automatically (or on one confirm tap), the wallet signs a USDC transfer on Arbitrum to the saved Cash App address, with gas sponsored.
4. **Done:** "$24.61 is on its way to your Cash App." It usually lands in about 1 minute and shows as a Cash balance deposit.
5. Edge cases:
   - the Cash App **$10k/week receive cap** and lower caps for new accounts (split the payout or queue it) [C1];
   - the user moved to NY;
   - Cash App starts charging fees.

---

## 3. Path B: Cash App USDC ↔ Alpaca stablecoin funding

| Item | Finding |
|---|---|
| Announcement | Broker API and Trading API stablecoin deposits and withdrawals, USDC first, USDG/USDT later. Deposits can "be converted into USD" (2026-06-22) [A2]. No chains, fees or US eligibility details are given. |
| Chains | The Crypto Wallets API docs list **USDC on Ethereum Sepolia and Solana Devnet** (testnets). Production networks aren't stated. Access requires contacting Alpaca [A1]. The older retail FAQ covers **Ethereum only** and explicitly excludes Polygon etc. [A3]. **Arbitrum isn't mentioned anywhere [UNVERIFIED].** Cash App sends on both Ethereum and Solana, so **Solana would work** if it's live in production. |
| Per-user address | Yes: `GET /v1/accounts/{id}/wallets?asset=USDC&network=…` returns a unique address per account [A1]. |
| Conversion | A **USDC/USD sell order** [A1]. That makes it a crypto trade needing Alpaca Crypto. Trading API fee tiers run 15/25 bps (maker/taker) at the lowest tier [A4]. Broker API pricing is negotiable **[UNVERIFIED]**. |
| US retail / NY | Alpaca Crypto has historically been in 49 states, **excluding NY** [A5]. Whether stablecoin funding needs the crypto account agreement is **[UNVERIFIED]**. |
| Withdrawals to Cash App | Allowed only to **whitelisted** addresses. Whitelisting takes up to 24h and needs travel-rule beneficiary info: self-hosted vs. VASP, where Block would be the VASP [A1]. Old FAQ: **0.5% fee + network fee, 20 USDC minimum** [A3]. The sandbox example shows `fees` and `network_fee` fields [A1]. |
| Verdict | Workable, but a $5 fill costs about 25 bps plus Ethereum gas if the chain is Ethereum, and sparks under $20 may be impossible. **Ask Alpaca:** is Solana live in production, what are the fees on the Broker stablecoin product, is a crypto account required, and does a whitelisted Cash App address count as "self" or as a VASP? |

---

## 4. Path C: Cash App ACH ↔ Alpaca or Atomic

| Question | Finding |
|---|---|
| Is Cash App a Plaid institution? | **No.** Cash App and its bank partners don't appear in Plaid Link. Users must enter numbers manually (secondary [P3]; consistent with Plaid's docs for unsupported institutions [P1]). |
| How do you verify manually entered numbers? | Plaid supports **Same-Day Micro-deposits** (1–2 business days plus user action), **Automated Micro-deposits**, **Instant Micro-deposits** (needs RTP or FedNow at the receiving bank; Cash App support **[UNVERIFIED]**) and **Database Auth** (instant match against known-good accounts; low-to-medium risk only) [P1][P2]. |
| Can Alpaca skip Plaid? | The `ach_relationships` API accepts **raw `bank_account_number` and `bank_routing_number`** as an alternative to a Plaid processor token [A6]. What verification Alpaca requires in production for raw numbers, especially for *deposits*, is **[UNVERIFIED]**. Expect them to require Plaid or micro-deposits for pulls. |
| Atomic | Funds through a **Plaid processor token** (Plaid–Atomic partnership) [P4]. Cash App would need the manual or micro-deposit flow. |
| Can a third party pull from a Cash App balance? | **Yes.** Cash App ToS: "If you authorize a merchant or other third party to make recurring ACH debit payments from your Cash App Balance using your account and routing number, such payments will be subject to available funds and limitations." Users can block a merchant with 3 business days' notice [C2]. The bill-pay help page confirms account and routing numbers can pay bills from the balance [C3]. |
| Push back to Cash App? | Yes. Direct deposit takes up to **$25,000 per deposit and $50,000 per 24h** [C3]. Crediting ACH that isn't payroll works in practice (05) **[UNVERIFIED for brokerage-originated credits specifically, though very common]**. |
| Prerequisite | **The account and routing numbers require ordering and activating a Cash App Card.** "If you don't see your direct deposit account details right after ordering, you may need to wait until your physical Cash Card arrives" [C3]. |
| Speed | ACH pull: funds typically 1–3 business days. Alpaca **Instant Funding** can front up to $1k of buying power, with the partner bearing the risk [04][05]. ACH push: 1–3 business days. |
| Return risk | NSF (R01) if the user spends their Cash App balance before the debit settles. R10 (unauthorized) if they dispute it. Name mismatch. The Cash App "merchant block" feature. Pulls from a spend-heavy P2P balance are riskier than from a payroll bank account **[judgment]**. With Instant Funding, Blunts eats the loss. |
| Verdict | **Bi-directional, NY-inclusive and "no crypto."** But onboarding is worse: it needs a Cash Card, manual numbers and a 1–2 day verification. There are also no weekend fills and there's return risk. Best as the **NY / fallback rail**, not the hero flow. |

**Path C user journey (for reference):**
- Onboarding: Alpaca KYC form (Blunts-hosted; Alpaca runs CIP) → "Link Cash App": Plaid Link → "Enter manually" → the user copies the routing and account numbers from Cash App → Money → tap balance → verify (micro-deposit code in 1–2 days, or Database Auth instantly).
- Fill: amount → "Pull $25 from Cash App" → pending 1–3 days (or instant buying power via Instant Funding) → buy QQQ fractional.
- Spark: sell → "Send to Cash App" → ACH, 1–3 business days.

---

## 5. Path D: Cash App Pay (Block merchant API)

- **Prohibited:** the Cash App Pay Merchant Use Policy bans "Any activity related to providing financial services, including: money services businesses … cryptocurrency activities; **broker dealer or registered investment activity**; wire transfers or money orders; prepaid cards; gift cards" [C4]. The general Acceptable Use Policy separately bans transactions with "securities brokers" (except Cash App Investing) [C7].
- It **does** have a payout direction. The Network API's **Create Payout** "allows a merchant to send money to a customer's Cash App account." It is early access, requires a customer **grant** from the Customer Request API, and is USD-only with `purpose: SERVICES` only [C5][C6]. Funds come from the merchant's settlement, which makes Blunts the payer and puts it in money-transmitter territory (05 §1).
- Access is by approval only. Cash App Pay has no public self-serve API outside Square sellers and approved partners [C8].
- **Verdict:** not viable, even if the BD itself were the merchant. Don't pursue.

---

## 6. Path E: other options

| Option | Status |
|---|---|
| **Venmo / PayPal** (fallback P2P rail) | On-chain stablecoin is **PYUSD only, not USDC**. PayPal supports Arbitrum; Venmo's Arbitrum support is **[UNVERIFIED]** (04, 05). For Dinari (USDC-only), PYUSD needs a swap in the user wallet. Venmo direct-deposit numbers can serve as an ACH rail for Path C **[UNVERIFIED for brokerage credits]**. Phase 2 at most. |
| **Coinbase Onramp using a Cash App Card** | The Cash App Card is a Visa debit card, so a user could buy USDC on Arbitrum through Coinbase's headless Onramp with Apple Pay or card. Guest checkout ended 2026-06-30, so a **Coinbase account is required**, and zero-fee USDC requires partner approval (01). It covers NY. It's more friction than a native Cash App send; use it only as the NY or card fallback. There's no "Cash App" payment method in Onramp [CB1]. |
| **Cash App Paper Money** | $1 per deposit (waived with Green) at retailers, then a USDC send. Covers users with **cash only** (01). |
| **Cash App Pools, Business accounts, Borrow, Square payouts** | None of them offer a third-party API for moving a consumer's balance to or from a brokerage. Pools and Business are P2P/merchant products subject to the same prohibited-business rules [C4][C7] **[not researched deeply; low value]**. |
| **Bridge (Stripe) liquidation address** | Dinari USDC → ACH to Cash App numbers. Useful if Cash App's USDC receive ever gets fees or caps, and as the NY payout for Path A (the Cash App *account* works in NY; only its stablecoin feature doesn't) (05). |
| **Robinhood Connect** | Moves crypto out of Robinhood into wallets. Not a Cash App rail. Skip. |
| **US tokenized QQQ without a BD** | None. QQQx, QQQon and Robinhood tokens exclude US persons. Ondo US (onshore, launched July 2026) is permissioned **[UNVERIFIED details]** (02). |

---

## 7. What's permissionless vs. what needs approval

| Component | Permissionless? | Notes |
|---|---|---|
| Cash App USDC send/receive to Blunts wallets | **Yes** | User-initiated, no Block relationship. Block can change fees, limits or availability at any time [C1] |
| Privy embedded wallet plus gas sponsorship | **Yes** (self-serve dashboard) | Pricing above the free tier **[UNVERIFIED]** |
| On-chain monitoring and OFAC screening (Alchemy, Chainalysis or TRM) | Self-serve / commercial | Dinari *requires* screening of inbound sources [D1] |
| Dinari BD, KYC, dQQQ | **No.** Contract, $2k/mo, SOC 2 or equivalent, UI and compliance review, real-time event push [D1][D2] | |
| Alpaca Broker API (ACH or stablecoin) | **No.** Partner approval; the licensing questions in 07; Crypto Wallets API access by request [A1] | |
| Atomic | **No.** Promoter agreement (07) | |
| Cash App Pay | **Prohibited** [C4] | |
| Plaid (Auth / micro-deposits) | Self-serve up to production review | Cash App isn't an institution [P3] |

---

## 8. Onboarding simplicity, compared

| | Path A (Dinari) | Path C (Alpaca/Atomic ACH) | Path B (Alpaca USDC) |
|---|---|---|---|
| KYC | Dinari **Managed KYC** hosted URL [D7] plus the extra Dinari US fields and disclosures [D1] | Alpaca account-opening API (Blunts-built form; Alpaca CIP) or Atomic's flow | Same as C, plus the crypto agreement **[UNVERIFIED]** |
| Link Cash App | Paste your Cash App Arbitrum address once (for payouts only) | Manual routing/account entry plus 1–2 day micro-deposit verification (Plaid) | Whitelist your Cash App address (up to 24h) |
| Needs Cash Card? | **No** | **Yes** [C3] | No |
| Needs a bank account? | No | No (the Cash App numbers act as the bank) | No |
| First fill time | Minutes after KYC approval | Days | Minutes (if the chain is supported) |

---

## 9. Blockers and unknowns to confirm

**Dinari (highest priority)**
1. Confirm in writing that the flow Cash App → user's Privy EOA → EIP-155 permit buy, with sell proceeds → user wallet → user-signed transfer to the user's Cash App address, is acceptable. Is the second hop out of Dinari's scope?
2. **Billing in arrears** on Arbitrum: what's the real per-order cost, is there a minimum, and can `fee` be $0 on buys and >$0 on sells only?
3. Minimum order size (can we do a $5 or $1 fill?). Weekend QQQ session for US accounts.
4. Are Privy EOAs with **native gas sponsorship** (and possibly EIP-7702) acceptable as "dedicated" wallets? Can session signers auto-buy on deposit?
5. For EIP-155 accounts, do sell proceeds settle directly to the user wallet (no withdrawal API needed)? Timing?
6. Managed KYC: vendor, cost per check, pass rates. Can it be embedded in a mobile webview?
7. SOC 2: is a questionnaire acceptable at launch? Does the $2k/month minimum offset usage fees?

**Cash App (test on device, not via a partnership)**
1. How is the network chosen when pasting a 0x address (picker vs. auto)? Does it remember recent wallet recipients?
2. Are USDC transfers credited from EOAs using 7702 or relayer-sponsored transactions, and from smart-contract wallets?
3. Is there a minimum *receive* amount (a $0.01 test)? What is the receive cap for accounts under 90 days old?
4. When does the fee-free period end? Watch the help page [C1].

**Alpaca**
1. Stablecoin funding: production chains (Solana? Arbitrum?), fees, whether a crypto account is needed (NY), whitelist and travel-rule treatment of a Cash App (Block VASP) address, and minimums.
2. Is ACH with raw numbers (no Plaid) allowed for pulls? What's the history of returns on Cash App (Sutton/Lincoln) accounts?

**Counsel**
1. The money-transmission analysis for auto-payout and auto-buy with delegated signing (05 §1).
2. The Dinari-required pre-trade quote and disclosures inside a 2-button UX.

---

## Sources

**Cash App / Block**
- [C1] Cash App Help, "Stablecoins" (networks, fees, limits, NY, send/receive steps): https://cash.app/help/us/en-us/31115-stablecoins (fetched raw HTML 2026-09-28)
- [C6b] Cash App press, "Stablecoins are now available on Cash App" (2026-05-27): https://cash.app/press/cash-app-stablecoins-all-customers
- [C2] Cash App Terms of Service (updated 2026-09-11; ACH debit clause, direct deposit): https://cash.app/legal/us/en-us/tos
- [C3] Cash App Help: Direct Deposit https://cash.app/help/us/en-us/1113-direct-deposit ; Set Up Direct Deposit (needs Cash Card) https://cash.app/help/us/en-us/31111-setup-direct-deposit ; Paying bills https://cash.app/help/us/en-us/3113-bill-pay ; Account details https://cash.app/help/us/en-us/3111-direct-deposit-account-details
- [C4] Cash App Pay Merchant Use Policy: https://developers.cash.app/cash-app-pay-partner-api/guides/partnerships/merchant-use-policy
- [C5] Cash App Pay Network API, Create Payout: https://developers.cash.app/cash-app-pay-partner-api/api-reference/network-api/create-payout
- [C6] Cash App Pay Network API, Payout object: https://developers.cash.app/cash-app-pay-partner-api/api-reference/network-api/payout
- [C7] Cash App Acceptable Use Policy: https://cash.app/legal/us/en-us/acceptable-use-policy
- [C8] Partner with Cash App Pay: https://developers.cash.app/cash-app-pay-partner-api/guides/partnerships/partner-with-cash-app-pay
- Secondary: Polygon, "How to send and receive stablecoins in Cash App on Polygon": https://polygon.technology/blog/how-to-send-and-receive-stablecoins-in-cash-app-on-polygon ; The Block (2026-05-27): https://www.theblock.co/news/business/2026-05-27-cash-app-lets-users-send-usdc-stablecoins-on-chains-like-solana-and-ethereum-402784

**Dinari**
- [D1] US Customers guide: https://docs.dinari.com/docs/us.md
- [D2] Partner Fees (updated 2026-08-27): https://docs.dinari.com/docs/fees.md
- [D3] Create Withdrawal Request: https://docs.dinari.com/reference/createaccountwithdrawalrequests.md
- [D4] Wallet Connection Nonce: https://docs.dinari.com/reference/getaccountwalletconnectionnonce.md
- [D5] Placing Orders: https://docs.dinari.com/docs/placing-orders.md
- [D6] Managing Wallets: https://docs.dinari.com/docs/managing-wallets.md ; Funding Accounts through Wallets: https://docs.dinari.com/docs/funding-accounts-through-wallets.md
- [D7] Create Managed KYC Check: https://docs.dinari.com/reference/createmanagedentitykycembed.md ; doc index https://docs.dinari.com/llms.txt

**Alpaca**
- [A1] Crypto Wallets API: https://docs.alpaca.markets/us/docs/crypto-wallets-api
- [A2] Blog, "Stablecoins for Securities and Crypto Trading with Alpaca" (2026-06-22): https://alpaca.markets/blog/using-stablecoins-for-securities-and-crypto-trading-with-alpaca/
- [A3] Support, Crypto Wallet FAQ: https://alpaca.markets/support/crypto-wallet-faq
- [A4] Crypto Spot Trading (fee tiers): https://docs.alpaca.markets/us/docs/crypto-trading
- [A5] Alpaca Crypto in 49 states excluding NY (BusinessWire 2022; current list unverified): https://www.businesswire.com/news/home/20220308005090/en/Alpaca-Crypto-API-Now-Offers-Over-20-New-Coins-and-Expands-Access-to-49-US-States
- [A6] Create ACH Relationship (raw numbers or Plaid processor token): https://docs.alpaca.markets/reference/createachrelationshipforaccount ; ACH funding https://docs.alpaca.markets/docs/ach-funding ; Funding Wallets (non-US local rails) https://docs.alpaca.markets/us/docs/funding-wallets

**Plaid / Atomic**
- [P1] Plaid Auth coverage / flows: https://plaid.com/docs/auth/coverage/
- [P2] Plaid Instant / micro-deposits: https://plaid.com/docs/auth/coverage/instant/
- [P3] GOBankingRates, "What Bank Does Cash App Use for Plaid?" (secondary): https://www.gobankingrates.com/money/finance/what-bank-is-cash-app-on-plaid/
- [P4] Plaid–Atomic partnership: https://plaid.com/docs/auth/partnerships/atomic/

**Wallets / gas / onramp**
- [PV1] Privy gas sponsorship overview: https://docs.privy.io/wallets/gas-and-asset-management/gas/overview
- [PV2] Privy blog, native gas sponsorship: https://privy.io/blog/introducing-privy-native-gas-sponsorship
- [PV3] Eco, "Gas Sponsorship 2026" (secondary, gas cost estimates): https://eco.com/support/en/articles/15254045-gas-sponsorship-2026-how-apps-sponsor-user-fees
- [CB1] Coinbase Onramp payment methods: https://docs.cdp.coinbase.com/onramp/docs/payment-methods/ ; zero-fee USDC: https://www.coinbase.com/developer-platform/discover/launches/zero-fee-usdc
