# 10: Bank-transfer fallback via Plaid (fill and spark to/from a bank), plus a gap check on the Cash App flow

**Date:** 2026-09-28 | **Status:** Research memo, not legal advice. **[UNVERIFIED]** marks anything I couldn't confirm in a primary source during this pass. Citations like [Z1] point to the Sources list at the end.
**Builds on:** `09-cash-app-rails.md` (Path A: Cash App USDC ↔ Privy ↔ Dinari; Path C: Cash App ACH via Alpaca) and `05-payout-methods.md` (money-transmitter analysis, Bridge liquidation addresses). This memo doesn't repeat that material.

---

## TL;DR

1. **Blunts can't just "use Plaid" to move money.** Plaid only *links and verifies* the bank account (Auth, Identity, Balance/Signal). The money has to be moved by a **licensed party that ends up delivering USDC to the user's wallet**, because Dinari US accounts are USDC-only [D1].
   - **Plaid Transfer is the wrong tool.** Funds settle into *Blunts'* own treasury account [P1]. Blunts would then be taking user dollars and sending USDC on, which makes Blunts the money transmitter. Plaid's docs also say Transfer doesn't support "a marketplace or money transfer app" [P1].
2. **Dinari has no usable ACH rail.** The US guide says in one line that accounts "must be pre-funded (via ACH) or just-in-time funded" [D1]. But no ACH, bank-link or fiat-deposit endpoint exists anywhere in the doc index [D2]. The only fiat path is the **Funding Facilitation Account (FFA)**, which is limited to partners that hold money-transmitter licenses [D1]. There's no Dinari-recommended fiat partner; **Circle** is only the USDC↔USD settlement leg [D1][D3].
3. **Recommended fallback: zerohash, both directions.**
   - **Fill:** Plaid-linked ACH *debit*, then buy USDC, then withdraw it to the user's own Privy wallet on Arbitrum.
   - **Spark:** the user's wallet sends USDC to their zerohash deposit address, zerohash sells it, then pays out by **RTP/FedNow (seconds, 24/7)** or ACH.
   - zerohash has **MTLs in 51 jurisdictions plus an NY BitLicense** [Z6], so it **covers New York**.
   - It has a **Plaid "reseller" mode**, so Blunts needs no Plaid contract of its own [Z2].
   - It takes Plaid **processor tokens** if Blunts has its own Plaid account [Z2][P4].
   - Costs: enterprise contract, a **loss reserve** (always required with ACH) and a **float** if fills are instant [Z3].
4. **Bridge (Stripe) is simpler but fails the NY requirement.**
   - Bridge excludes customers whose principal residence is in NY [B3].
   - Fills are **push-only**: a virtual account number the user sends ACH to from their bank. "We do not integrate with Plaid to initiate money movement, including pulling or debiting from bank accounts" [B1].
   - It's still a good non-NY spark rail (liquidation address, then Same-Day ACH to a Plaid-linked account), and a nice "direct-deposit part of your paycheck" fill feature.
5. **Stripe onramp and Coinbase Onramp don't fit.**
   - **Stripe:** onramp only, **no USDC on Arbitrum** (only Ethereum, Base, Solana, Polygon, Avalanche, Stellar), about 1.5% + $0.30, excludes Hawaii [S1][S2].
   - **Coinbase:** ACH and offramp need a **Coinbase account with a linked bank** [CB1].
   - **Circle Mint** is institution-only [CI1].
6. **Cash App and Chime on Plaid:**
   - **Chime** is supported, with OAuth and App-to-App [P5].
   - **Cash App is not a Plaid institution** (secondary sources, consistent with 09). It needs manual entry plus **Same-Day Micro-deposits** (1–2 business days) or **Database Auth** (instant, low/medium risk only) [P2][P3].
7. **The Cash App primary flow has a few gaps to close before launch** (§5):
   - wrong-network and wrong-token handling;
   - verifying the payout address;
   - a refund/"return to Cash App" path;
   - receive-limit queueing;
   - a Dinari order-failure state.

   Cash App now says plainly: "If you send funds to the wrong address or using the wrong network, they cannot be recovered" [C1].

---

## 1. Plaid: what's needed, what it costs, and coverage

### 1.1 Products

| Product | Needed? | Why | Billing model [P6] |
|---|---|---|---|
| **Link** | Yes | The UI that connects the bank account | Free (you pay for the products it enables) |
| **Auth** | Yes | Returns account and routing numbers (or a processor token) for ACH | One-time per Item |
| **Identity / Identity Match** | Yes for pulls | Name-on-account check against the KYC name. zerohash *requires* Auth, Balance, Identity and Identity Match [Z2] | Identity: one-time. Identity Match: per call |
| **Balance** (inside the Signal product family) | Yes for pulls | Check for NSF before debiting. zerohash requires it and runs its own checks [Z2] | Per call |
| **Signal Transaction Scores** | Optional | ML return-risk score. Only worth it if Blunts fronts buying power before ACH settles [P7] | Per `/signal/evaluate` call. Not pay-as-you-go [P6][P8] |
| **Transfer** | **No** | Settles into the business's treasury, which makes Blunts the transmitter; not for "money transfer apps" [P1] | Per transfer |
| **Processor token** (`/processor/token/create`) | If Blunts has its own Plaid contract | Hands the account to the licensed mover (zerohash, Alpaca, Stripe, etc.) without Blunts storing numbers [P4] | No fee **[UNVERIFIED]** |

**The simplest option is to hold no Plaid contract at all.**
- **zerohash "Plaid Reseller":** "There is no separate Plaid contract to sign… your customers link accounts through a zerohash SDK" [Z2].
- **Bridge:** issues its own Plaid `link_token` from `POST /customers/{id}/plaid_link_requests` [B1].

### 1.2 Pricing ballpark (2026)

Plaid publishes no price list: "A price list is not available in the documentation" [P6]. Secondary estimates [P8], all **[UNVERIFIED]**:

| Item | Estimate |
|---|---|
| Auth | about $0.10–$0.25 per call; one-time per Item in practice |
| Identity | about $0.15–$0.30 |
| Balance | about $0.05–$0.15 per call |
| Monthly minimums on Growth/Custom plans | $1k–$10k+ |

Signal is contact-sales. Pay-as-you-go needs no minimum but excludes Signal [P8].
**Rule of thumb:** about $0.50–$1.50 one-time per linked bank, plus about $0.10 per debit (Balance). Through zerohash-as-reseller, expect a pass-through **[UNVERIFIED]**.

### 1.3 Coverage and fallbacks for unsupported banks

| Institution | Status |
|---|---|
| **Chime** | Supported. One of only two US institutions (with Chase) that support **App-to-App OAuth** [P5]. Checking only (see 05) |
| **Cash App** (Sutton/Lincoln numbers) | **Not listed.** Users must "Enter account numbers manually" (secondary [P9]; consistent with 09 §4). You can confirm with `/institutions/search` once you have keys **[UNVERIFIED in the 2026 institution list]** |
| Venmo / PayPal balance numbers | Probably manual as well **[UNVERIFIED]** |

**Fallback flows for manual entry** [P2][P3]:

| Flow | Timing | Notes |
|---|---|---|
| **Instant Match** | Instant | Credentials plus typed numbers, matched against masked values (all risk levels) |
| **Automated Micro-deposits** | 1–2 business days | Plaid verifies automatically; needs credentials |
| **Instant Micro-deposits** | About 5 seconds | Needs an RTP/FedNow-capable account (low/medium risk). Whether Cash App or Chime numbers qualify is **[UNVERIFIED]** |
| **Same-Day Micro-deposits** | 1–2 business days | The user enters a code from a $0.01 deposit, with 3 attempts before a permanent lock. For the "~700 institutions" without instant options. Items can **only** be used with Auth or Transfer [P3] |
| **Database Auth** | Instant | Matches against "known-good" numbers on Plaid's network. Low/medium risk only, and no live data connection, so **no Balance checks** [P2] |

**Implication for Cash App numbers:** no Balance check is possible, so the NSF risk is higher. Treat these as **pre-funded only** (no instant credit), or cap them at a low amount.

---

## 2. Turning a bank ACH into USDC in the user's wallet (and back)

Constraint: **Dinari US = USDC only** [D1], and Blunts must never hold or route user funds (05 §1). So a **licensed third party** has to (a) take USD from the user's bank and (b) deliver USDC to the user's self-custody Privy wallet, and the reverse for sparks.

| Provider | Fill (bank → USDC in the user's wallet) | Spark (USDC → bank) | Takes Plaid processor token? | Licensed party | NY | Speed | Fees | KYC |
|---|---|---|---|---|---|---|---|---|
| **zerohash** ⭐ | **ACH debit (pull)**, then buy USDC, then withdraw to an external wallet. Three models: Pre-funded (after settlement plus a hold), On-demand or Instant USD (the platform float fronts it) [Z3][Z4] | User sends USDC to a per-customer deposit address, then sell, then **RTP/FedNow** (seconds, 24/7) or ACH credit [Z4][Z5] | **Yes** (self-service), **or** Plaid Reseller via the zerohash SDK [Z2][P4] | **zerohash LLC**: FinCEN MSB, MT in 51 jurisdictions, NYDFS virtual-currency license [Z6] | **Yes** | Fill: 3–5 days to settle (pre-funded) or instant with float [Z3]. Spark: seconds (RTP) | Enterprise and negotiated **[UNVERIFIED]**. The docs example shows a platform-set `spread_bps` [Z4]. Platform pays network fees [Z4]. Loss reserve required; float for instant [Z3] | Platform submits the customer via API (including `sanction_screening`, `signed_agreements`), or zerohash's hosted KYC [Z4][Z7] |
| **Bridge (Stripe)** | **Push only:** a USD **virtual account** (account and routing number in the user's name) auto-converts to USDC and delivers to a wallet address (Arbitrum supported, min $1) [B2][B4] | **Liquidation address:** USDC on Arbitrum → ACH (next day), **Same-Day ACH**, wire, FedNow (beta, invite) to a Plaid-linked external account [B4][B5] | **No.** Bridge runs its own Plaid Link for *linking only*: "We do not integrate with Plaid to initiate money movement" [B1] | **Bridge Building Inc** (NMLS 2450917), state MTs. OCC trust charter conditionally approved in Feb 2026; an NY LPTC has been applied for [B6] | **No** ("excluding… New York") [B3] | Fill: depends on the user's bank push (1–2 days; same-day if sent that way). Spark: same day (before 2:30pm ET) or next day [B5] | "Reach out to sales" [B7]. Secondary: 0.25% orchestration / 0.50% virtual account **[UNVERIFIED]**. Optional developer fee [B8] | Customers API accepts developer-collected KYC (SSN, ID docs); uses Persona IDV links [B9] |
| **Stripe crypto onramp** | Card, Apple/Google Pay, ACH and instant bank via **Link** (Stripe Financial Connections, not Plaid) [S3]. Stripe is merchant of record and does KYC [S1] | **None** (no offramp) | No (Stripe's own bank linking) | Stripe (MoR) | Partly. USDC on Ethereum/Base OK; Avalanche/Polygon/Stellar not in NY. **Hawaii excluded** [S1][S2] | Instant crypto delivery after KYC [S3] | About 1.5% + $0.30 (secondary [S3]) **[UNVERIFIED]**. Old doc quotes show higher | Prefill all fields except SSN [S2] |
| **Coinbase Onramp / Offramp** | ACH needs the user's **Coinbase account**. Guest checkout ended 2026-06-30 [CB1] | Offramp needs "A Coinbase account with linked bank details" [CB1] | No | Coinbase | Yes | ACH 1–3 days | Zero-fee USDC for approved partners [CB1] | Coinbase's |
| **Circle** | Circle Mint is **not available to individuals** [CI1]. Using it for users makes Blunts the transmitter | n/a | No | n/a | n/a | n/a | n/a | n/a |
| **MoonPay** (alt for NY) | ACH onramp to USDC on Arbitrum, about 1.99% (secondary) | USD offramp to bank | No **[UNVERIFIED]** | MoonPay (claims 50 states plus BitLicense) | Yes (secondary) | 1–3 days | About 2% **[UNVERIFIED]** | MoonPay's |

**Which ones take a Plaid processor token?**
- From Plaid's partner list: **zerohash, Stripe, Alpaca, Dwolla, Moov, Sila, Checkbook, Astra, Modern Treasury, Unit** and others.
- Not on the list: **Bridge, Circle, Coinbase, Dinari** [P4].

**KYC reuse**
- Dinari allows "an existing onboarding KYC process" to be "supplemented with the missing fields" [D1]. zerohash and Bridge both accept platform-submitted identity data [Z4][B9].
- So the cleanest setup is **Blunts runs one IDV (e.g., Persona) and pushes the result to Dinari *and* the ramp.** The alternative is two hosted KYCs.
- Formal reliance agreements (skipping the partner's own CIP) are contract terms, not documented **[UNVERIFIED; ask both]**.
- Dinari Managed KYC's vendor is still unknown (09).

---

## 3. Dinari and ACH

- **Direct ACH: no, not in any documented API.**
  - The only mention is the one-liner "Accounts must be pre-funded (via ACH) or just-in-time funded" [D1].
  - The funding section documents only **Stablecoin Funding (USDC via Circle)** and **Bring-Your-Own-Funding (FFA)**. The FFA flow shows wires between the partner's bank and the FFA [D1].
  - The doc index has no bank, ACH, Plaid or fiat-deposit endpoint. It only has USDC withdrawals, token transfers and a sandbox faucet [D2].
- **FFA:** open only to "a Money Services Business with the requisite money transmitter licenses" [D1]. Blunts can't run it.
  - **Question for Dinari:** could a licensed MSB (e.g., zerohash) operate an FFA *for* Blunts' users? That would allow true USD ACH with no USDC hops.
- **Recommended fiat partner:** none documented. The Aug 2026 US launch partners are Circle, Privy, Para and Monaco [D3]. Circle is the settlement leg only.
- **Ask Dinari:**
  1. What does "pre-funded via ACH" mean in practice (is there a private API)?
  2. Is USDC arriving in a user's wallet from a zerohash or Bridge hot wallet acceptable? (Blunts OFAC-screens it [D1].)
  3. Can the sell and withdrawal settle to Base or Ethereum as well as Arbitrum?

---

## 4. Recommendation: the simplest bank fallback

### 4.1 Architecture (zerohash, both directions)

```
FILL  Bank ──ACH debit (zerohash, Plaid-linked)──▶ zerohash USD bal ──buy──▶ USDC
      ──withdraw (Arbitrum)──▶ user's Privy EOA ──EIP-155 permit──▶ Dinari dQQQ
SPARK Dinari sell ──▶ USDC in Privy EOA ──user-signed send (Arbitrum)──▶ user's zerohash
      deposit addr ──sell──▶ USD ──RTP/FedNow (or ACH)──▶ user's bank
```

**Why this design:**
- It uses one vendor for both directions and covers **NY**.
- It's a true **in-app "Add $25 from bank"**, with no push instructions for the user to follow.
- Sparks get **instant RTP** payouts.
- Plaid is bundled.
- Blunts never touches funds: zerohash debits the user and delivers to the user's own wallet.

**Funding model**
- **Launch on "Pre-funded":** no float needed, fills land in 3–5 business days [Z3]. Show "Arrives ~Thu".
- Later, add "Instant USD" for Plaid-credential-linked accounts with a good Signal/Balance result.
  - **Blunts bears return losses either way.** A loss reserve is required whenever ACH is on. Unauthorized returns can arrive up to 60 days later [Z3][Z8].
  - Once the USDC has become dQQQ in a *self-custody* wallet, zerohash can't claw it back, so the loss hits Blunts' reserve.

**Optional second vendor: Bridge for non-NY sparks** (Same-Day ACH via liquidation address), and a "Split your paycheck" fill (a virtual account number the user gives their employer). Push deposits have **no return risk**.

### 4.2 Screens

**Link bank (one time)**
1. "Add a bank" → zerohash SDK / Plaid Link. The user picks a bank (Chime via App-to-App) or enters numbers manually (Cash App, etc.).
2. For manual entry: "We sent 1¢, enter the 3-letter code in 1–2 days." Or instant with Database Auth.
3. Name match (Identity Match) ✔. Show "Chase ••1234 linked."
4. The user accepts zerohash's user agreement, which is required [Z4]. It can go on the same screen as Dinari's disclosures.

**Fill from bank**
1. Fill → $25 → source "Chase ••1234 · arrives in ~3 business days".
2. Confirm → "Pulling $25 from Chase". Behind the scenes: Balance check, ACH debit.
3. Pending card on Home: "$25 on the way · QQQ buy on Thu".
4. When zerohash reports `settled`: buy USDC, withdraw to the wallet, run the Dinari quote screen. The user taps **Light it**, or it auto-buys under the Dinari rules in 09.
5. Failure (R01 NSF, etc.): "Your bank sent this back." Nothing is bought, and there's a retry option.

**Spark to bank**
1. Spark → $100 → destination "Chase ••1234 · instant" (RTP) or "1–2 days" (ACH fallback).
2. Dinari sell, then the user's wallet signs the USDC send to their zerohash deposit address (gas sponsored).
3. zerohash sells and pays by RTP. Show "$99.xx sent to Chase".

### 4.3 Cost per transaction

All vendor numbers are **[UNVERIFIED]** estimates. Dinari's figure is $0.20 flat, or about $0.03 at gas in arrears [09].

| | $25 fill (zerohash) | $100 spark (zerohash, RTP) | $25 fill (Bridge VA push) | $100 spark (Bridge Same-Day ACH) |
|---|---|---|---|---|
| Plaid (Balance / Identity Match per txn) | ~$0.10–0.20 | $0 | $0 | $0 |
| Rail fee (ACH / RTP) | ~$0.20–0.50 | ~$0.25–0.75 | ~$0 inbound | ~$0.25–0.50 |
| USD↔USDC conversion / orchestration | 0–1% ($0–0.25) | 0–1% ($0–1.00) | ~0.5% ($0.13) | ~0.25% ($0.25) |
| Network fee (Arbitrum withdraw / user send) | ~$0.01–0.05 | ~$0.02 (Privy-sponsored) | pass-through ~$0.01–0.05 | ~$0.02 |
| Dinari order | $0.20 (or ~$0.03) | $0.20 (or ~$0.03) | $0.20 (or ~$0.03) | $0.20 (or ~$0.03) |
| **Total** | **~$0.50–1.20 (2–5%)** | **~$0.50–2.00 (0.5–2%)** | **~$0.35–0.45 (~1.5%)** | **~$0.50–1.00** |

**Fixed costs:**
- One-time link cost about $0.50–1.50 per bank.
- zerohash platform minimums, loss reserve and float **[UNVERIFIED; negotiate]**.

**Takeaways:**
- A **$25 bank fill costs noticeably more than a Cash App USDC fill** (about $0.03–0.20).
- Keep bank as the fallback only, and nudge users toward **$50+ bank fills** or a weekly schedule.

### 4.4 Blockers

1. **A zerohash commercial agreement.** Includes use-case approval (onramp to a self-custody wallet that feeds a broker-dealer; they already do stablecoin funding for IBKR-type clients), minimums, reserve sizing, and whether **Arbitrum USDC withdrawals** are live for retail. A secondary source lists USDC.ARBITRUM [Z9].
2. **Dinari sign-off** on USDC coming from a ramp's hot wallet, and on the extra "pending bank fill" UI state (their compliance reviews funding logic [D1]).
3. **ACH return exposure.** Blunts funds the loss reserve. Returns can come 60 days later on self-custodied assets. Cap bank fills (e.g., $250/week for new users), and allow **pre-funded only** for accounts verified via micro-deposit or Database Auth.
4. **Two agreements for the user** (Dinari plus zerohash) and possibly two KYC passes, unless platform-submitted KYC is accepted.
5. **Counsel review** of the zerohash flow, where USDC is delivered to a Privy wallet Blunts can co-sign via session signers (05 §1).
6. **If Bridge is used:** no NY, no ACH pull, and custom pricing.

---

## 5. Cash App primary flow: gap check

Cash App's own help page [C1] currently says:
- "There are no fees" (the old "limited time" wording is gone).
- Send flow: "$ tab, enter at least $1, Pay, Paste the recipient's wallet address, Send." **It doesn't mention a network picker.**
- "Sending stablecoins on an unsupported network will result in permanent loss of funds."
- "If you send funds to the wrong address or using the wrong network, they cannot be recovered."
- Limits: send $2k/day and $5k/week; receive $10k/week; lower for accounts under 90 days old. Not available in NY or on sponsored accounts.

| Gap | Risk | Handling to build |
|---|---|---|
| **Fill sent on the wrong EVM network** (Ethereum or Polygon instead of Arbitrum) | Cash App says unrecoverable on *its* side, but the Blunts address is an EOA the user controls on every EVM chain | Watch the user's address on **Arbitrum, Ethereum and Polygon**. If USDC lands on Ethereum or Polygon, CCTP-bridge it to Arbitrum (Blunts pays; Ethereum gas can be about $0.50–3) **[UNVERIFIED cost]**, or let the user send it back. Solana is impossible (a 0x address won't validate). **Never use a smart-contract wallet**, which could make it unrecoverable on other chains |
| **Wrong token** (USDT, bridged USDC.e) arrives | Dinari takes USDC only | Detect it, show "Unsupported coin", and offer a user-signed "Return" |
| **Payout to the wrong network or address** | **Unrecoverable** [C1] | (a) Payout network hard-coded to **Arbitrum** and **native USDC** (`0xaf88…5831`), never USDC.e. (b) Onboarding tells the user to copy the address from Money → Deposit stablecoins → **Arbitrum** specifically. (c) EIP-55 checksum, reject the user's own Blunts address, OFAC-screen. (d) **$1 test payout** on first setup, with a "Did $1 show up in Cash App?" confirmation before larger sparks. Cash App's receive minimum is unknown **[UNVERIFIED]** (the $1 minimum is documented for sends only). (e) Re-confirm the address if it hasn't been used for 90 days |
| **Is the Cash App Arbitrum address the same as its ETH/Polygon address?** | Unknown **[UNVERIFIED]** | Test on a device. Either way, only send on Arbitrum |
| **Receive caps** ($10k/week, lower under 90 days) | A payout over the cap can't bounce on-chain. Cash App may hold it for review **[UNVERIFIED]** | Default spark cap of $2k/week for new users. Split or queue larger sparks. Link to Cash App support |
| **Fill never arrives** (user hit the $2k/day send cap, abandoned, or not verified) | Confusing | Time out after 15 min: "Didn't see it. Check Cash App → Activity." The address stays valid forever, so late arrivals are still processed |
| **Amount differs** from what the user chose, or is below Dinari's minimum order | Stranded dust | Buy whatever arrives. Below the minimum, hold it as "cash in your Blunts" and roll it into the next fill, or offer **"Send back to Cash App"** (user-signed) |
| **Dinari order rejected or failed** after USDC arrives | Funds sitting in the wallet | USDC stays in the user's wallet. Show "Retry" or "Send back to Cash App". Never auto-sweep elsewhere |
| **Weekend / after-hours** | Dinari's weekend session takes limit orders only (09) | Auto-convert to a marketable limit order, or queue until the open, and say so on the quote screen |
| **User moves to NY, or Cash App disables stablecoins** | Primary rail breaks | Gate by KYC state and IP. Switch the user to the zerohash bank rail (§4). Keep payout-address validation on every spark |
| **Sanctions** | Dinari requires screening of inbound sources [D1] | Screen the sending address (a Cash App hot wallet) and the payout address |
| **Cash App starts charging fees or changes limits** | Unit economics | Re-check [C1] monthly; the fee line already changed wording once |

**Verdict:** the primary flow is sound. The **payout-side address and network verification** is the only place a user can permanently lose money. Ship the $1 test payout, the Arbitrum-only native-USDC sends and the multi-chain inbound watcher before launch.

---

## Sources

**Plaid**
- [P1] Transfer overview ("not supported by Transfer (e.g. a marketplace or money transfer app)"; sweep to treasury): https://plaid.com/docs/transfer/ ; Transfer application (prohibited/restricted industries): https://plaid.com/docs/transfer/application/
- [P2] Auth coverage / additional flows (Instant Match, micro-deposits, Database Auth): https://plaid.com/docs/auth/coverage/
- [P3] Same-Day Micro-deposits: https://plaid.com/docs/auth/coverage/same-day/
- [P4] Auth processor partners (zerohash, Stripe, Alpaca, etc.): https://plaid.com/docs/auth/partnerships/ ; Processor tokens: https://plaid.com/docs/api/processors/
- [P5] OAuth guide ("Chase and Chime are currently the only US financial institutions that support App-to-App"): https://plaid.com/docs/link/oauth/
- [P6] Pricing and billing models: https://plaid.com/docs/account/billing/
- [P7] Signal: https://plaid.com/docs/signal/
- [P8] Secondary pricing estimates: https://www.vendr.com/marketplace/plaid ; https://support.plaid.com/hc/en-us/articles/16194632655895
- [P9] Secondary, Cash App not on Plaid: https://www.gobankingrates.com/money/finance/what-bank-is-cash-app-on-plaid/

**zerohash**
- [Z1] Bank Rails (funding models, ACH/RTP/FedNow, Plaid models): https://docs.zerohash.com/docs/fiat.md
- [Z2] Bank Account Linking (Plaid Reseller vs processor token; Auth/Balance/Identity/Identity Match): https://docs.zerohash.com/docs/bank-account-linking.md ; https://docs.zerohash.com/docs/self-service-plaid-link
- [Z3] Funding Models (pre-funded/on-demand/instant, 3–5 day settlement, loss reserve, float, loss recovery): https://docs.zerohash.com/docs/funding-models.md
- [Z4] On-ramp integration guide (withdrawal_address, spread, network fees, user agreement): https://docs.zerohash.com/docs/on-ramp-integration-guide.md
- [Z5] Off-ramp integration guide (deposit address, sell, fiat payout): https://docs.zerohash.com/docs/off-ramp-integration-guide.md
- [Z6] US Licenses and Disclosures (51 jurisdictions, NYDFS): https://docs.zerohash.com/page/us-licenses-and-disclosures
- [Z7] Onboarding / KYC service: https://docs.zerohash.com/docs/onboarding-experience-sample.md
- [Z8] ACH Returns (60-day unauthorized window, NACHA thresholds) and ACH limits: https://docs.zerohash.com/docs/ach-returns.md ; https://docs.zerohash.com/docs/ach-limits-and-velocity-controls.md
- [Z9] Stablecoin networks (USDC on Arbitrum, secondary search summary): https://docs.zerohash.com/page/production-environment-stablecoins ; changelog https://docs.zerohash.com/changelog/usdc-on-base-added-to-fund
- Plaid–zerohash partnership PR (2023): https://www.globenewswire.com/news-release/2023/10/24/2765684/0/en/zero-hash-partners-with-plaid-to-enable-a-seamless-crypto-on-and-off-ramp-via-ach-bank-transfers.html

**Bridge**
- [B1] Plaid linking ("We do not integrate with Plaid to initiate money movement"): https://apidocs.bridge.xyz/platform/orchestration/external-accounts/plaid
- [B2] Virtual accounts: https://apidocs.bridge.xyz/platform/orchestration/virtual_accounts/virtual-account
- [B3] Supported countries (US excluding NY; TX first-party only): https://apidocs.bridge.xyz/platform/customers/compliance/supported-countries-list
- [B4] USD integration guide (ach_push onramp; ach / ach_same_day / fednow offramp) and payment routes (USD@ACH → USDC Arbitrum min 1): https://apidocs.bridge.xyz/get-started/guides/move-money/usd-integration-guide.md ; https://apidocs.bridge.xyz/get-started/introduction/what-we-support/payment-routes.md
- [B5] Cutoffs (Same-Day ACH 9:30/1:45/2:30 ET; next-day 4:45 PM): https://apidocs.bridge.xyz/platform/orchestration/more/cutoffs
- [B6] OCC conditional trust charter (Feb 2026): https://www.paymentsdive.com/news/stripe-bridge-occ-conditional-approval-national-trust-bank-charter/812425/ ; OCC CD #1365 https://www.occ.gov/topics/charters-and-licensing/interpretations-and-decisions/2026/cd1365.pdf
- [B7] Pricing (contact sales): https://apidocs.bridge.xyz/platform/additional-information/pricing ; secondary % figures: https://eco.com/support/en/articles/15083178-bridge-xyz-stablecoin-api-for-payouts-and-orchestration
- [B8] Developer fees and minimums: https://apidocs.bridge.xyz/platform/orchestration/fees-and-mins/devfees ; https://apidocs.bridge.xyz/platform/orchestration/fees-and-mins/mins
- [B9] Customers API (developer-submitted KYC; persona_idv_link): https://apidocs.bridge.xyz/platform/customers/customers/api

**Stripe / Coinbase / Circle / MoonPay**
- [S1] Stripe onramp overview (MoR, KYC): https://docs.stripe.com/crypto/onramp ; Stripe-hosted (currencies; NY exclusions): https://docs.stripe.com/crypto/onramp/stripe-hosted
- [S2] Embedded onramp (US excluding Hawaii; prefill except SSN): https://docs.stripe.com/crypto/onramp/embedded
- [S3] Payment methods / fees (secondary): https://stripe.com/crypto-onramp ; https://eco.com/support/en/articles/15210390-best-stablecoin-onramps-2026-moonpay-transak-coinbase-onramp-compared
- [CB1] Coinbase Onramp FAQ (guest checkout deprecated 2026-06-30; Coinbase account for ACH/offramp): https://docs.cdp.coinbase.com/onramp/additional-resources/faq ; payment methods: https://docs.cdp.coinbase.com/onramp/docs/payment-methods/
- [CI1] Circle Mint (institutional only): https://developers.circle.com/circle-mint ; https://www.circle.com/circle-mint
- MoonPay (secondary): https://eco.com/support/en/articles/15210390-best-stablecoin-onramps-2026-moonpay-transak-coinbase-onramp-compared

**Dinari**
- [D1] US Customers guide (ACH one-liner, stablecoin funding via Circle, FFA for MTL holders, OFAC on inbound, KYC supplementation): https://docs.dinari.com/docs/us.md
- [D2] Docs index (no ACH/bank endpoints): https://docs.dinari.com/llms.txt ; Funding Accounts through Wallets: https://docs.dinari.com/docs/funding-accounts-through-wallets.md
- [D3] US launch coverage (Circle, Privy, Para, Monaco): https://www.coindesk.com/business/2026/08/04/dinari-brings-tokenized-u-s-stocks-to-american-investors-as-equity-race-heats-up ; https://fortune.com/2026/08/04/dinari-stripe-apple-alums-partnership-circle-tokenized-stocks-us-investors/

**Cash App**
- [C1] Cash App Help, "Stablecoins" (fetched 2026-09-28: no fees; networks; unrecoverable wrong network/address; limits; NY excluded): https://cash.app/help/us/en-us/31115-stablecoins
