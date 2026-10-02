# 05 — Payout methods when a user "sparks" (sells)

Research date: 2026-09-28. Sources are cited inline; anything I could not confirm from a primary source is marked **[UNVERIFIED]**.
This is product and regulatory research, not legal advice. Before launch, have counsel confirm the money-transmission analysis (section 1).

---

## TL;DR: what to show at launch

### Backend A: Dinari (USDC-settled)

The key fact is that a Dinari withdrawal delivers **USDC on Arbitrum** to a **non-managed wallet that belongs to the same Entity** as the account. The user proves ownership of that wallet with a signature (`WalletConnectionNonce`). ([createAccountWithdrawalRequests](https://docs.dinari.com/reference/createaccountwithdrawalrequests.md), [wallet connection nonce](https://docs.dinari.com/reference/getaccountwalletconnectionnonce.md))
So every payout makes two hops: Dinari → the user's own embedded wallet (Privy) → the destination. **The user signs the second hop.** Blunts builds the UI and can pay gas, but it never holds the funds.

| Rank | Show as | Rail / provider | Speed | Cost to user | Limits / exclusions | Extra account needed? |
|---|---|---|---|---|---|---|
| 1 | **Cash App** | USDC on **Arbitrum** from the user's wallet to their Cash App "Deposit USDC" address. Cash App auto-converts it to USD balance. | Minutes (Arbitrum finality plus Cash App credit) | $0 (Cash App fee-free "for a limited time"). Blunts can sponsor gas, which costs cents. | Identity-verified Cash App users only. **Not available in NY**, not on sponsored (teen) accounts. Reported caps: $10k/week receive, and lower for accounts under 90 days old. | Cash App (most of the target audience already has it) |
| 2 | **Your wallet (USDC)** | Leave the funds in, or send out of, the user's own wallet. Supported networks: Arbitrum natively, and other chains via a bridge. | Seconds | Gas only | None beyond Dinari's own | No |
| 3 | **Coinbase** | USDC on Arbitrum to the user's Coinbase deposit address, or Coinbase Offramp (hosted) to ACH / Coinbase balance | Minutes; ACH 1–3 days | USDC offramp advertised as $0 fee | Offramp requires a Coinbase account with a linked bank. Cash-out ranges: card $10–$7.5k, ACH $10–$25k | Coinbase |
| 4 | **Bank account (ACH), phase 2** | USDC → **Bridge (Stripe)** liquidation address in the user's name → ACH / Same-Day ACH to any US account (including Chime, and Cash App / Venmo routing numbers) | ACH is batched daily at 1pm ET, so next business day. Same-Day ACH is same day. FedNow is instant but beta and invite-only. | Bridge pricing is custom (sales@bridge.xyz). Min $1. Blunts can add a developer fee. | Bridge KYC per user, which may be shared KYC. State coverage including NY **[UNVERIFIED]** | No (just a bank or neobank account) |

**Omit for A at launch:** Venmo and PayPal (they accept **PYUSD, not USDC**), debit-card push (there is no USDC-to-card path that doesn't put money through Blunts or add a new MSB integration), Zelle, and Apple Cash.

### Backend B: Alpaca Broker API (USD brokerage)

Alpaca withdrawals go by **ACH** (free) or **wire** (fee). Withdrawals go to an ACH relationship in the customer's name, which Blunts creates with **Plaid** *or* with **raw routing and account numbers**. ([ACH funding docs](https://docs.alpaca.markets/docs/ach-funding), [Transfers API](https://github.com/alpacahq/alpaca-docs/blob/master/content/api-references/broker-api/funding/transfers.md))
Accepting raw routing and account numbers matters a lot here: it means Cash App, Venmo and Chime can all be payout targets because each of them issues routing and account numbers.

| Rank | Show as | Rail / provider | Speed | Cost | Limits / exclusions | Extra account needed? |
|---|---|---|---|---|---|---|
| 1 | **Cash App** | Alpaca ACH to the user's Cash App routing and account number (Money tab, Direct Deposit) | 1–3 business days. Cash App credits when received. | $0 | Up to $25k per deposit and $50k per 24h. Requires direct deposit to be enabled on Cash App (Cash Card). Name should match. ACH works in NY (only the USDC feature excludes NY). | Cash App |
| 2 | **Chime** | Alpaca ACH to the Chime Checking routing and account number | 1–3 business days | $0 | **Checking only** (not Savings). Chime rejects wires, so never offer wire here. | Chime |
| 3 | **Bank account** | Alpaca ACH to any bank (via Plaid or manual entry) | Under 3 business days per Alpaca | $0 (Alpaca charges no ACH fee) | Alpaca has a configurable large-withdrawal safeguard | A bank account |
| 4 | **Venmo** | Alpaca ACH to the Venmo Direct Deposit routing and account number (The Bancorp Bank) | 1–3 business days | $0 | Venmo documents direct deposit only for payroll and government payments. **Acceptance of brokerage ACH credits is [UNVERIFIED]**, so label it "beta" or test before promising it. | Venmo, with direct deposit enabled |

**Omit for B at launch:** instant (RTP / FedNow / debit-card push), because Alpaca documents no instant withdrawal rail. Also omit wire (a $25 fee, and it's a poor fit for this audience), Zelle, Apple Cash, PayPal, and stablecoin withdrawals. Alpaca announced Broker API stablecoin withdrawals on 2026-06-22, but chains, fees and US end-user eligibility are **[UNVERIFIED]**. It becomes a phase-2 "instant to Cash App" option once confirmed.

---

## 1. The money-transmitter constraint: how to stay out of it

The principle is that **Blunts never takes possession or control of user funds.** Money should only ever move from a regulated custodian (Dinari or Alpaca, both broker-dealers) to an account or wallet that **the user owns and controls**. Any conversion is done by a licensed entity (Cash App/Block, Coinbase, Bridge).

- **Dinari path:** Dinari itself sends the withdrawal, and only to a wallet the user proved they own (signature-verified, same Entity). If the Privy wallet is genuinely non-custodial (user-controlled keys, and Blunts cannot move funds unilaterally), then under FinCEN's 2019 CVC guidance (FIN-2019-G001) an unhosted-wallet software provider is not a money transmitter. The second hop (wallet → Cash App) is a transfer **the user signs**. Paying gas does not change who controls the funds.
  - **Risk:** If Blunts holds keys, holds a key share that allows unilateral signing, or holds a session-signer / policy that lets it move funds without the user, the analysis gets worse. Keep any delegated signing limited to the user-initiated "spark then cash out" flow, and have counsel review it. **[Legal judgment, not verified]**
  - Dinari's own docs say that only partners **with money-transmitter licenses** may run "Funding Facilitation Accounts" for fiat withdrawal by wire ([Dinari US guide](https://docs.dinari.com/docs/us.md)). This confirms that a fiat off-ramp run by Blunts itself is an MSB activity. Use Bridge or Coinbase instead.
- **Alpaca path:** Alpaca (the broker-dealer) originates the ACH to an account in the customer's name, and Blunts only passes instructions via API. That is the standard BaaS-broker model. Cash App, Chime and Venmo routing numbers are real deposit accounts at their partner banks (The Bancorp for Venmo per Venmo's FAQ; Cash App's and Chime's partner banks are **[UNVERIFIED]**) in the user's name, so they count as first-party destinations.
- **Why card push and Zelle are omitted:** Both need money to leave the broker into an FBO or settlement account of a payout provider (Astra, TabaPay, Checkbook, Stripe) or of Blunts' bank. Then someone would have to push the funds on. If Blunts' own account is in that chain, Blunts is transmitting. If the provider's FBO is in that chain, the broker is sending funds to a third party, which brokers generally prohibit (withdrawals must be first-party). **[UNVERIFIED for Alpaca specifically]** Zelle Disbursements are only offered through banks (JPMorgan, U.S. Bank, Fiserv FIs) and fund from the *business's* bank account. ([JPM](https://developer.payments.jpmorgan.com/docs/treasury/global-payments/capabilities/global-payments-2/zelle-disbursements), [U.S. Bank](https://developer.usbank.com/products/disbursements-via-zelle/v1))

---

## 2. Destination-by-destination findings

### 2.1 Cash App

**USDC on-chain (launched 2026-05-27, now for all customers)**
- Networks: **Solana, Ethereum, Polygon, Arbitrum**. **Base is NOT supported.** ([Cash App press](https://cash.app/press/cash-app-stablecoins-all-customers))
- UX: Money tab → "Deposit USDC" → pick a network → get an address. Cash App **auto-converts to USD** in the Cash balance; the user never holds a stablecoin.
- Fees: "fee-free to start… for a limited time." The future fee is unknown.
- **Not available to NY residents**, and not on sponsored accounts. Identity verification is required. Receive limits are lower for accounts under 90 days old. ([Cash App help: stablecoins](https://cash.app/help/us/en-us/31115-stablecoins))
- Reported limits: send $2k/day and $5k/week, **receive $10k/week**. ([CoinMarketCap](https://coinmarketcap.com/academy/article/ccash-app-usdc-payments-rollout), [coinalertnews](https://coinalertnews.com/news/2026/05/27/cash-app-usdc-rollout)) These are secondary sources, so the exact figures are **[UNVERIFIED]**.
- Transfers are irreversible. Sending on the wrong network means the funds are lost. The app must hard-code Arbitrum and validate the address.
- **Fit with Dinari:** very good. Dinari withdraws on Arbitrum, and Cash App accepts Arbitrum, so no bridging is needed.
- **[UNVERIFIED]** Whether Cash App credits an ERC-20 transfer sent *from a smart-contract wallet* (e.g., a Privy smart wallet with a paymaster). Most custodians credit any `Transfer` event, but test this before launch. Using an EOA embedded wallet with sponsored gas is the safest choice.

**ACH to Cash App routing/account number**
- Cash App issues account and routing numbers for direct deposit. It takes up to $25,000 per deposit and $50,000 per 24h, and requires a Cash Card. ([Cash App direct deposit](https://cash.app/help/us/en-us/1113-direct-deposit), [ACH direct deposits](https://cash.app/help/us/en-us/6570-cash-app-and-ach-direct-deposits))
- Works for the Alpaca path in all states, including NY.

### 2.2 Venmo and PayPal
- **They cannot receive USDC.** On-chain receive for stablecoins is **PYUSD only**, on Ethereum, Solana and (for PayPal) Arbitrum. PayPal's weekly crypto transfer cap is $25k. PYUSD minimums are 10 on Ethereum and 1 on Solana/Arbitrum. ([PayPal crypto transfers](https://www.paypal.com/us/cshelp/article/how-do-i-transfer-my-crypto-help822), [Venmo crypto transfers](https://help.venmo.com/cs/articles/crypto-transfers-vhel232))
  - Sending USDC to a Venmo/PayPal address would **lose funds**. Never offer it.
  - A USDC → PYUSD swap in the user's wallet is technically possible, but it adds DEX/slippage risk and possible securities/commodities questions. Not for launch.
- **Venmo ACH:** Venmo Direct Deposit gives a routing and account number at **The Bancorp Bank**. ([Venmo DD FAQ](https://help.venmo.com/cs/articles/direct-deposit-faq-vhel332)) The docs only mention payroll and government payments, so **brokerage ACH credits are [UNVERIFIED]**.
- **PayPal ACH:** PayPal Balance accounts also offer direct-deposit numbers. **[UNVERIFIED, not researched in depth]**
- **Instant push to Venmo/PayPal:** I found no public API for third parties to push into Venmo or PayPal balances (outside of PayPal Payouts, which is funded from the *business's* PayPal balance and so is a money-transmission problem for Blunts). Omit.

### 2.3 Bank account via ACH / RTP / FedNow
- **Alpaca:** supports ACH (free) and wire ($25 domestic, reported). Documented statuses are QUEUED → SENT_TO_CLEARING → COMPLETE. There is **no documented RTP/FedNow instant withdrawal.** Alpaca's "Instant Funding" covers **deposits only** (buying-power credit, default $1k). ([Instant Funding](https://docs.alpaca.markets/docs/instant-funding), [withdrawal cost](https://alpaca.markets/support/cost-for-withdrawing), [BrokerChooser](https://brokerchooser.com/broker-reviews/alpaca-trading-review/how-to-withdraw-on-alpaca-trading))
- **USDC off-ramps (Dinari path):**
  - **Bridge (Stripe):** Liquidation address per customer, taking USDC on Arbitrum, Base, Ethereum, Solana, Polygon and more. Payouts go by **ACH, Same-Day ACH, Wire, and FedNow (beta, by invitation; 24/7, settles in seconds)**. Min 1 USDC. ACH is batched daily at 1:00pm ET. Pricing is by sales contact only. Bridge's default wire fee config appears in its docs; for ACH, assume a small bps fee. ([USD integration guide](https://apidocs.bridge.xyz/get-started/guides/move-money/usd-integration-guide.md), [payment routes](https://apidocs.bridge.xyz/get-started/introduction/what-we-support/payment-routes.md), [pricing](https://apidocs.bridge.xyz/platform/additional-information/pricing.md), [dev fees](https://apidocs.bridge.xyz/platform/orchestration/fees-and-mins/devfees))
    - Bridge is the licensed party, and each user becomes a Bridge customer (KYC). This is the cleanest "USDC → any US bank, including Chime or Cash App numbers" path for Dinari. NY coverage is **[UNVERIFIED]**.
  - **Coinbase Offramp (CDP):** The user sends crypto to a Coinbase-managed address within 30 minutes. Payout goes to ACH or the Coinbase balance. **The user must have a Coinbase account with a linked bank**, and guest checkout is not available for offramp. Coinbase advertises zero-fee USDC offramp. Card cash-out ranges $10–$7.5k and ACH $10–$25k. ([Offramp overview](https://docs.cdp.coinbase.com/onramp-&-offramp/offramp-apis/offramp-overview), [zero-fee USDC](https://www.coinbase.com/developer-platform/discover/launches/zero-fee-usdc))
  - **Zero Hash:** Offers stablecoin-to-fiat payouts including ACH for platforms (e.g., Interactive Brokers, Kalshi funding). It is enterprise and contract-based, so specific US consumer payout pricing is **[UNVERIFIED]**. ([zerohash transact](https://zerohash.com/solutions/transact))
  - **Circle Mint:** Business-only redemption to Blunts' own bank account. Using it to pay users would make Blunts the transmitter. Omit.

### 2.4 Debit card instant push (Visa Direct / Mastercard Move)
- Providers: **Stripe Instant Payouts** (1.5%, $0.50 minimum; Connect only, so it pays out a *connected account's* Stripe balance) ([Stripe](https://docs.stripe.com/connect/instant-payouts)). Others are **TabaPay** ([docs](https://developers.tabapay.com/docs/overview-of-push-to-card)), **Checkbook** ([Instant Pay](https://checkbook.io/product/payments/instant-pay/)), and **Astra** (Mastercard Move, RTP, FedNow, ACH; FBO+ "good funds" model) ([docs](https://docs.astra.finance/docs/instant-disbursements-net-debit-mode)).
- **From a brokerage withdrawal it is not directly possible.** Neither Alpaca nor Dinari pushes to cards. Every provider above needs pre-funded "good funds" in an FBO/settlement account, so user money would have to go broker → provider/Blunts FBO → card. That brings in the MSB and first-party withdrawal problems described in section 1.
- A future option is Cash App itself. Once funds land in Cash App (via USDC, in minutes), the user can use Cash App's own instant transfer to their card. So Cash App USDC effectively *is* the instant path.

### 2.5 Chime, Apple Cash, Zelle
- **Chime:** Has real routing and account numbers (Checking only). ACH in 1–3 days. Chime **rejects wires**. Works for Alpaca ACH, and for Dinari via Bridge ACH. ([Chime help](https://help.chime.com/how-do-i-transfer-money-from-my-chime-checking-account-t-8797e34e), [Chime routing](https://www.chime.com/security-and-support/chime-routing-number/))
- **Apple Cash:** A Green Dot prepaid account with **no routing/account number and no direct deposit**. The only inbound path is card push to its Visa virtual card, which is **[UNVERIFIED]** and would need a card-push provider anyway. Omit. ([Apple Cash setup](https://support.apple.com/en-us/109304))
- **Zelle:** Disbursement APIs exist only through banks, funded from the business's bank account. Not first-party, and Blunts would be the payer. Omit.

### 2.6 Coinbase account / self-custody wallet
- Dinari path: straightforward. The user's Privy wallet already holds the USDC after withdrawal. "Send to Coinbase" is an Arbitrum USDC transfer to the user's Coinbase deposit address. Coinbase supports USDC on Arbitrum **[UNVERIFIED for 2026, but long-standing]**.
- Alpaca path: depends on the stablecoin-withdrawal rollout, so it is **[UNVERIFIED]**.

---

## 3. Backend-specific answers

**Does Dinari offer a fiat off-ramp partner for US end users?**
Not a documented one. US accounts settle only in USDC, with Circle as the settlement partner. Withdrawals are USDC on **Arbitrum** (per the API reference) to a same-Entity, signature-verified, non-managed wallet. Fiat wire withdrawal exists only for partners that hold MTLs, via Funding Facilitation Accounts. Dinari's "Get USDC" is an *on*-ramp. Its partnerships with Rain and Offramp for USD+ cards are **non-US**. ([Dinari US](https://docs.dinari.com/docs/us.md), [Rain PR](https://www.prnewswire.com/news-releases/rain-adds-support-for-dinaris-usd-enabling-yield-bearing-stablecoin-spending-across-latam-302539770.html))
- Note: Dinari lists dShares on Ethereum, Arbitrum, Avalanche, Base, HyperEVM and Plume ([blockchain](https://docs.dinari.com/docs/blockchain.md)). The **withdrawal endpoint documents Arbitrum only**, so **confirm with Dinari** whether US withdrawals can target other chains.

**Does Alpaca support instant (RTP/FedNow) withdrawals?**
It is not documented anywhere I could find. Withdrawals are ACH (free, under 3 days) or wire. Stablecoin withdrawals for Broker API partners were announced 2026-06-22, focused on USDC with USDT/USDG planned. Chain list, fees and US-retail eligibility are not public ([Alpaca blog](https://alpaca.markets/blog/using-stablecoins-for-securities-and-crypto-trading-with-alpaca/)). Ask Alpaca.

---

## 4. Recommended UI copy (for both backends)
- Hide Cash App USDC for NY users by geo/KYC state. For B, Cash App via ACH is fine in NY.
- Show speed and fee plainly: "Cash App: ~2 min, free" (A) and "Cash App: 1–3 days, free" (B).
- Always pin the network to **Arbitrum** in the Cash App USDC flow. Never show a network picker.
- Never show Venmo or PayPal as a USDC destination.

## 5. Open questions to confirm with vendors
1. Dinari: which chains are allowed for US withdrawals (Arbitrum only?), withdrawal fees and timing, and whether the wallet can be a Privy smart wallet.
2. Cash App: whether receives from smart-contract wallets are credited, the exact weekly receive limit, and when the fee-free period ends.
3. Alpaca: stablecoin withdrawal chains and US eligibility, whether any RTP/FedNow roadmap exists, and whether Venmo/Cash App ACH credits have a history of returns.
4. Bridge: ACH, Same-Day ACH and FedNow pricing, NY coverage, and a KYC-sharing (reliance) option.
5. Counsel: whether the Privy delegated-signing setup keeps Blunts outside "total independent control" under FIN-2019-G001.
