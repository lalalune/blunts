# Blunts — Fiat On-Ramp / Off-Ramp Research

*Researched 2026-09-28. Sources are listed at the bottom. Anything marked **(unverified)** comes from a single third-party source, is a negotiated or private price, or could not be confirmed from a primary page.*

---

## TL;DR

1. **The cheapest rails in 2026 are the P2P apps' own stablecoin rails, not the classic crypto on-ramps.** Cash App added USDC send/receive on **Arbitrum** (and Solana, Ethereum, Polygon) for all eligible US users on 2026-05-27. It is **fee-free "to start"**, and a user's Cash App dollars convert 1:1 automatically. PayPal and Venmo can send and receive **PYUSD on Arbitrum**. Blunts can take a deposit from a user's Cash App/Venmo/PayPal balance, and pay a withdrawal back to it, for roughly the cost of Arbitrum gas (about a penny). Payments are **irreversible**, so there are no chargebacks.
2. **For bank users:** use **Bridge (Stripe)** or **Zero Hash** virtual accounts/ACH. Bridge reportedly charges **0.25–0.50%** and lets Blunts set its own per-rail fee (including $0). ACH or FedNow payouts cost cents.
3. **For card/Apple Pay/Google Pay:** apply for **Coinbase's zero-fee USDC program** through the **Headless Onramp API** (US-only; Apple Pay + Google Pay; Coinbase does the KYC). If Blunts is approved, card-funded USDC costs **0% to Blunts and to the user**. Coinbase's hosted "guest checkout" was **shut down on 2026-06-30**, so the headless API is the path now. Fallbacks are Stripe Crypto Onramp (price negotiated privately; Stripe carries fraud and chargebacks as merchant of record) and MoonPay/Transak (about 3.5–4.5% on cards, too expensive to absorb).
4. **Cash:** don't build retail cash-in yourself. Point users to **Cash App Paper Money** ($1 per deposit, $5–$500, at Walmart/CVS/Walgreens/7-Eleven/Dollar General), then have them send USDC on Arbitrum to Blunts.
5. **Credit cards:** don't support them at launch. Crypto purchases are coded **MCC 6051**, many issuers treat them as **cash advances** (3–5% or $10 minimum, interest from day one), and they carry the worst chargeback/fraud profile. That is a bad fit for an "invest your savings" product aimed at an underbanked audience.
6. **A chain gotcha:** USDC bridged into **Robinhood Chain arrives as USDG** (Paxos's Global Dollar), not USDC. Plan the treasury around USDG. Paxos mints and redeems USDG and PYUSD **for free**, and the Global Dollar Network **shares reserve yield with partners**, which is a possible revenue line.
7. **A regulatory flag outside this report's scope:** Robinhood Stock Tokens are currently offered in 120+ countries **but not the US**. The SEC's 2026-09-17 "Innovation Exemption" for tokenized NMS stocks is the possible path for US users. The investing leg must be checked separately.

---

## 1. Funding methods: who supports what (US)

| Funding method | Best provider(s) | Realistic cost | Notes |
|---|---|---|---|
| **Cash App balance** | **Cash App native USDC send** (Arbitrum) → Blunts deposit address | **$0 to user (promo)**, about $0.01 gas | Live 2026-05-27. Limits: $2k/day and $5k/wk send, $10k/wk receive. **Not available in NY** or to sponsored (teen) accounts. Cash App says it will add a fee later. |
| **Venmo / PayPal balance** | Native **PYUSD send on Arbitrum** (or Ethereum/Solana) → Blunts | User pays network fee (small on Arbitrum; exact amount **unverified**); free between PayPal and Venmo | Minimum external send is 1 PYUSD on Arbitrum/Solana; $25k/wk limit. Blunts converts PYUSD to USDG free at Paxos (business account) or on a DEX. Alternative: MoonPay Balance can be funded by PayPal/Venmo/ACH with "no MoonPay fee" on balance buys. |
| **Debit card** | Coinbase Headless Onramp (Apple/Google Pay, debit), Stripe Crypto Onramp, MoonPay/Transak | **0% if accepted into Coinbase's zero-fee USDC program**; otherwise about 2.5–4.5%+ (MoonPay 4.5% with $3.99 minimum; Transak about 3.5%+) | Coinbase handles KYC. Headless is US-only and needs a verified phone and email. |
| **Apple Pay / Google Pay** | Coinbase Headless Onramp (Apple Pay and Google Pay), Stripe Onramp (plus Samsung Pay), Privy (routes to Stripe in the US) | Same as debit | Apple Pay and instant ACH settle instantly on Stripe Onramp; debit takes 1–5 minutes. |
| **ACH / bank link (Plaid)** | **Bridge virtual account** (user pushes ACH/wire to a unique account and routing number at Lead Bank; auto-converts to USDC), **Zero Hash** (ACH/RTP), Stripe Onramp (instant ACH via Link), Sardine (instant ACH), Coinbase (0.5% ACH retail rate) | Bridge 0.50% for virtual-account orchestration **(reported by a third party, not on bridge.xyz)**; Stripe ACH debit 0.8% capped at $5 (fiat processing only); Plaid Auth about $0.30–$1.00 per link **(unverified; negotiated)** | Pull-ACH carries return risk (R10/R01) of 2–5 days. Sardine offers instant ACH up to $3k/day with it underwriting the return risk. |
| **FedNow / RTP push** | Bridge (FedNow onramp GA in Q2 2026), Zero Hash (RTP) | Wholesale about $0.045 per transfer | Instant, irrevocable, no return risk. The user has to push the money from a bank that supports FedNow/RTP. |
| **Cash (retail)** | **Cash App Paper Money** → USDC send; Green Dot network (95k locations, a Crypto.com partner); PayNearMe (62k locations; B2B biller integration) | $1 per Cash App deposit (waived with Cash App Green status) | Building PayNearMe or Green Dot in-house means a biller contract plus MSB/money-transmitter compliance. Not worth it at launch. |
| **Credit card** | MoonPay, Transak (Coinbase credit cards are **not supported in the US**) | 3.5–5% provider fee **plus** possible issuer cash-advance fee (5% or $10 minimum) and APR | See §5. Not recommended. |

---

## 2. Provider comparison

| Provider | US coverage | KYC | Pay-in methods | Payout methods | Fees (user/business) | Arbitrum / Robinhood Chain | Can Blunts sponsor fees? |
|---|---|---|---|---|---|---|---|
| **Coinbase Onramp / Offramp (CDP)** | Nationwide, except where Coinbase isn't licensed (state list **unverified**) | Coinbase-hosted KYC inside headless flow; offramp **requires a Coinbase account** | Debit, Apple Pay, Google Pay, ACH, Coinbase balance | Offramp to ACH or the user's Coinbase account; Coinbase retail instant cashout to debit/PayPal at 1.5% | Retail: ACH 0.5%, card 2.5% (non-US), plus spread. **Zero-fee USDC on/offramp for approved partners** (subsidy program; apply) | Arbitrum supported for USDC delivery (widely reported); Robinhood Chain not native, so bridge from Arbitrum/Base | Yes: zero-fee USDC is effectively Coinbase-sponsored. Guest checkout ended 2026-06-30; "unlimited lifetime limits" upgrade APIs launched in June 2026 |
| **Stripe Crypto Onramp** | US (state list **unverified**) | Stripe handles KYC; lighter KYC under $500 (new at Sessions 2026) | Credit, debit, Apple/Google/Samsung Pay, instant ACH, ACH, Link | n/a (onramp only) | **Not published; negotiated.** Integration is free | Page lists BTC, ETH, SOL, Polygon; Arbitrum **unverified** | Unclear/negotiable. Stripe is merchant of record and **carries fraud and chargebacks** |
| **Bridge (Stripe)** | US (Lead Bank accounts). Serves US and global | Blunts onboards users via Bridge KYC/KYB API (or its own KYC for a KYB'd platform) | ACH push, wire, **FedNow**, ACH pull from virtual accounts (Q2 2026) | ACH, wire, RTP/FedNow; stablecoin-backed card issuing | 0.25% basic orchestration, 0.50% virtual accounts, plus gas (third-party figures, **unverified on bridge.xyz**). Blunts sets its own developer fee per rail (flat or %, min/max) | **Arbitrum supported**. Bridge also issues its own stablecoins (USDB, CASH) | **Yes.** Developer fee can be $0, and Blunts can pass through or absorb |
| **Zero Hash** | **51 US jurisdictions including NY** (BitLicense) | Zero Hash KYC or KYC-to-account matching | ACH, RTP, PSP (cards via PSP) | ACH, RTP | Enterprise, volume-based (**unverified numbers**) | 20+ networks; Arbitrum likely (**unverified**) | Yes: "pricing and UX customizable" |
| **MoonPay** | 50 states; no withdrawals in TX; PayPal/Venmo not in NY | MoonPay account KYC | Card, Apple/Google Pay, ACH, **PayPal, Venmo** | Bank, card, **PayPal, Venmo** | Card 4.5% ($3.99 min); bank about 1%; MoonPay Balance buys fee-free | Arbitrum yes | Some partner fee-sharing; can't cheaply zero out a 4.5% card fee |
| **Transak** | 49 states (no HI, as of May 2026) | Transak KYC | Card, ACH, Apple Pay | Bank | Card about 3.5%+, bank cheaper | Arbitrum yes | Partner markup configurable; base fee stays |
| **Ramp Network** | 50 states claimed (a comparison lists 47, **unverified**) | Ramp KYC | Card up to 3.9%, bank 1.4–2.4% | Offramp 0.99% ($3.99 min), fast payouts | as listed | Arbitrum yes | Limited |
| **Banxa** | US (states **unverified**) | Banxa KYC | Card about 3–5%, bank about 1% | ACH 1–3 days | as listed | Arbitrum likely | Limited |
| **Sardine** | US | Sardine KYC plus fraud scoring | **Instant ACH** (up to $3k/day, $5k/wk, $25k/mo), cards | — | Not published | 20+ chains | Negotiable |
| **Alchemy Pay** | Only about 17–18 states licensed | AP KYC | Card, Apple/Google Pay | Bank | **Zero-fee USDC** in some wallets through the Coinbase subsidy program | Multi-chain | Via the Coinbase subsidy. Too few states for Blunts |
| **Robinhood Connect** | US Robinhood customers | Uses the user's Robinhood account | Robinhood buying power ($0), bank/debit 0–1.5% | — | $0 from buying power | Robinhood supports USDC on Arbitrum, Base, Ethereum, OP, Polygon, Solana; Connect's network list **unverified** | Not publicly. Only useful for users who already have Robinhood (low overlap with the underbanked target) |
| **Circle Mint** | Business account only | KYB (Blunts) | Wire/ACH → USDC 1:1 | USDC → USD | **Mint free**; redemption free under $40M/day (new tiers from 2026-03-15) | Native USDC on Arbitrum | Blunts' treasury tool, not a consumer ramp |
| **Paxos (USDG / PYUSD)** | Business account | KYB | Wire/ACH → USDG/PYUSD | Redeem to USD | **Free mint and redeem**; Global Dollar Network **shares reserve rewards** with partners | USDG is the stablecoin used on **Robinhood Chain** | Treasury tool; possible float revenue |
| **Cash App** | All US except NY | Cash App's own | User's Cash App balance (from paper cash, direct deposit, debit) | User's Cash App balance, then instant to their debit card via Cash App's own fees | **Free for now** | **Arbitrum yes**; Robinhood Chain no | Nothing to sponsor. Blunts pays only gas |
| **PayPal / Venmo** | US; some networks region-limited | PayPal/Venmo's own | PYUSD balance | PYUSD to the user's PayPal/Venmo | Network fee on external sends | **PYUSD on Arbitrum yes** | n/a |
| **Meld.io** (aggregator) | Depends on routed provider | Provider's | 50+ providers including Coinbase, Stripe, PayPal, Robinhood Connect, Transak, Banxa | Provider's | Doesn't cut fees; routes by "RampScore" | Provider's | Useful as a **fallback router**, not a primary rail |
| **Crossmint** | 160+ countries | Crossmint | Cards, Apple/Google Pay, bank | Offramps | Not published | 50+ chains | Negotiable |
| **Privy (Stripe)** | Embedded wallet, not a ramp | — | Card onramp routes to **Stripe in the US** (Coinbase/MoonPay elsewhere); "universal deposit addresses" auto-bridge and swap | — | No onramp fee from Privy; free under 500 MAU | Any EVM | Wallet layer: users never see keys |

---

## 3. Off-ramp: getting money back to users

| Destination | Route | Speed | Cost for a $100 withdrawal |
|---|---|---|---|
| **Cash App balance** | Sell basket for USDG, swap/bridge to **USDC on Arbitrum**, send to the user's Cash App USDC deposit address | Minutes | about $0.05–$0.30 (gas + Across/Relay bridge fee **unverified** + swap slippage) → **about 0.1–0.3%**. Cash App's 10k/wk receive cap applies. The user can then move it instantly to their Cash App Card or debit card inside Cash App. |
| **Venmo / PayPal** | Convert to PYUSD (Paxos mint/redeem free), send on Arbitrum to the user's Venmo/PayPal PYUSD address | Minutes | about $0.05–$0.30 |
| **Bank (ACH)** | Bridge / Zero Hash liquidation to ACH | 1–2 days (same-day ACH possible) | Bridge 0.25–0.50% → **$0.25–$0.50** (+ACH cents) |
| **Bank (RTP/FedNow)** | Bridge / Zero Hash | Seconds | about $0.25–$0.50 + about $0.05 |
| **Debit card instant** (Visa Direct / Mastercard Move) | Via Bridge/Zero Hash payout or a push-to-card processor (Finix, Stripe Instant Payouts, etc.) | Minutes | Market 0.5–1.5% or $0.25–$2.00 flat → **about $0.50–$1.50** |
| **Coinbase Offramp** | USDC → ACH or Coinbase account | 1–3 days ACH | 0% on USDC for approved partners, but **the user needs a Coinbase account**. Friction for this audience |
| **MoonPay sell** | → Bank / card / PayPal / Venmo | Varies | about 1% bank, about 4.5% card, $3.99 minimum. Too expensive |
| **Ramp Network offramp** | → Bank | Fast | 0.99%, $3.99 minimum → $3.99 on $100 |

**Takeaway:** for a Cash App-native audience, **"withdraw to Cash App" is the killer off-ramp.** It is instant, costs about 0%, and users already have a card attached to that balance.

---

## 4. Recommended architecture

```
                ┌──────────── Deposit rails (priority order) ────────────┐
User ──► (1) Cash App: send USDC on Arbitrum ─────────┐                  │
     ──► (2) Venmo/PayPal: send PYUSD on Arbitrum ────┤                  │
     ──► (3) Bank: Bridge virtual acct (ACH/FedNow) ──┤──► Blunts deposit│
     ──► (4) Apple/Google Pay/debit: Coinbase Headless│     address per   │
             zero-fee USDC (fallback: Stripe Onramp) ─┘     user (Privy   │
                                                            embedded /     │
                                                            smart wallet)  │
                └──────────────────────────────────────────────────────────┘
        Deposit watcher → Across/Relay/LayerZero → Robinhood Chain (USDG)
        → buy basket tokens (batched/rebalanced)  → user's position
Withdraw: sell → USDG → USDC/PYUSD on Arbitrum → user's Cash App / Venmo
          or Bridge → ACH/RTP (free tier) or Visa Direct (instant tier)
```

- **Wallet layer:** Privy (Stripe-owned, free under 500 MAU, universal deposit addresses that auto-swap and bridge) or Turnkey. Users see "$" only. Sponsor gas with a paymaster. Arbitrum and Robinhood Chain gas is cents or less.
- **Treasury:** Blunts holds Paxos and Circle business accounts for free mint and redeem between USD, USDG, PYUSD and USDC. Keep a small float of USDG on Robinhood Chain to **front instant credit** while slower rails settle, and to earn Global Dollar Network rewards (rates **unverified**).
- **Compliance posture:** each provider KYCs its own leg (Cash App, PayPal, Coinbase, Bridge). Blunts still needs its own KYC/AML for the investment account. Custodial vs. self-custodial wallet choice drives money-transmitter and broker-dealer questions. Get counsel.
- **Fraud:** rails 1, 2 and 4 are irreversible to Blunts (Coinbase/Stripe carry card chargebacks). ACH **pull** is the only rail with return risk. Prefer **push** (virtual account/FedNow) or hold funds 3–5 days, or use Sardine instant ACH so Sardine carries the risk.

### Cost per $25 deposit (Blunts absorbs everything; user pays $0)

| Approach | Blunts' cost | % of $25 |
|---|---|---|
| Cash App USDC on Arbitrum (promo period) | about $0.02 gas + about $0.03–0.10 bridge to Robinhood Chain (**unverified**) | **about 0.2–0.5%** |
| Venmo/PayPal PYUSD on Arbitrum | same as above; user pays PayPal's small network fee | about 0.2–0.5% |
| Bridge virtual account (ACH push/FedNow) at 0.50% | $0.125 + about $0.05 gas/bridge | **about 0.7%** |
| ACH pull via Stripe (0.8%) + Bridge (0.5%) + Plaid amortized | about $0.33 + Plaid about $0.30–1.00 once | about 1.3% (+ first-time link) |
| Coinbase Headless, zero-fee USDC (if approved) | $0 + bridge about $0.05 | **about 0.2%** |
| Coinbase Headless, standard pricing | about 2.5–3.9% debit (**unverified for US debit**) | about 3–4% |
| Card via MoonPay/Transak | $3.99 min / 3.5–4.5% | **16% (MoonPay minimum) / about 4–5%** |
| Cash via Cash App Paper Money | $1 paid by user to Cash App, then free | Not Blunts' cost; 4% to user unless Cash App Green |

### Cost per $100 withdrawal

| Approach | Cost |
|---|---|
| To Cash App (USDC Arbitrum) | about $0.05–0.30 |
| To Venmo/PayPal (PYUSD Arbitrum) | about $0.05–0.30 |
| ACH / FedNow via Bridge | about $0.25–0.55 |
| Instant to debit card (Visa Direct) | about $0.50–1.50 → offer as "Instant" and **charge about $1** or 1%, like Cash App/Venmo do |
| Coinbase offramp (partner zero-fee) | about $0.05, but the user needs a Coinbase account |

### Unit economics: when does profit-share cover ramp costs?

Let *s* = profit share, *r* = annual basket return, and *B* = average balance. Annual revenue ≈ *s × r × B*, and only in positive years, above a high-water mark.

Example user: deposits **$25 per week** (52 deposits, $1,300 a year) and makes **4 withdrawals of $100** a year. Average balance in year 1 is about $600–650.

| Rail mix | Annual ramp cost | Revenue at s=10%, r=10% (≈1% of B) | Revenue at s=20%, r=10% (≈2% of B) | Break-even average balance (s=10% / 20%) |
|---|---|---|---|---|
| Cash App / Venmo stablecoin rails | 52×$0.07 + 4×$0.15 ≈ **$4.20** | $6.50 | $13 | **about $420 / $210** |
| Bridge ACH/FedNow | 52×$0.17 + 4×$0.45 ≈ **$10.60** | $6.50 | $13 | **about $1,060 / $530** |
| Coinbase zero-fee card | about **$3.50** | $6.50 | $13 | about $350 / $175 |
| Card at 3.5% absorbed | 52×$0.88 + 4×$0.45 ≈ **$47.30** | $6.50 | $13 | **about $4,700 / $2,400.** Doesn't work |

Implications:
- **Fixed per-transaction costs dominate at $25.** Encourage **weekly or biweekly auto-deposits** and don't allow deposits under $10. Default users to Cash App/Venmo or FedNow.
- **Card deposits can't be free at 3–4%.** Absorb cards only if Coinbase's zero-fee USDC program approves Blunts. Otherwise cap absorption (for example, "first $100 per month by card free") or show a small fee.
- **Profit-share revenue is zero in down years.** Ramp costs must be covered by float yield (USDG/GDN rewards or T-bill yield on idle cash, **unverified rates**) or by a paid instant-withdrawal fee. Model a flat year: cheap rails cost about $4–11 per active user per year with no revenue to offset it.
- Two promos Blunts doesn't control could end: Cash App's "fee-free to start" and Coinbase's zero-fee USDC subsidy. **Build multi-rail routing** (Meld can serve as a fallback router) so pricing changes are a config switch.

---

## 5. Credit card deposits

- **Cash advance:** Visa's April 2026 merchant data standards require crypto purchases to use **MCC 6051/6012**. Many issuers treat these as **cash advances**: a fee of 5% or $10, no grace period, a high APR, and often a separate lower limit ($1–2k a month).
- **Availability:** Coinbase **does not support credit cards in the US**. MoonPay and Transak do, at 3.5–5% on top of the issuer fee.
- **Fraud and chargebacks:** card-funded crypto is the highest-fraud category. Stolen cards are the classic way to cash out through crypto because the crypto is irreversible and the card payment isn't. If Blunts is merchant of record it eats the losses. With Stripe or Coinbase as merchant of record the provider does, and prices it in.
- **Suitability and regulation:** encouraging underbanked, possibly credit-constrained users to invest borrowed money at about 25–30% APR in volatile tech stocks is a UDAAP and reputational risk and hard to defend to app stores, partners, and regulators.
- **Verdict: not advisable.** Support **debit, Apple Pay and Google Pay only**. The Coinbase headless flow and Stripe can restrict to debit or prepaid.

---

## 6. 2026 developments that matter

- **GENIUS Act:** signed 2025-07-18. It takes effect on the earlier of **2027-01-18** or 120 days after final regulations. The OCC proposed its rule on 2026-02-25 (published in the Federal Register 2026-03-02) and is **targeting a final rule by November 2026**. The FDIC proposed in April 2026, and Treasury proposed state "substantially similar" principles in April 2026. What this means for Blunts: hold only **permitted payment stablecoins** (USDC, USDG and PYUSD are all set to qualify). GENIUS bars *issuers* from paying interest. Whether distributors or affiliates may pay rewards (GDN or PYUSD-style) remains contested. Treat any "yield" to users as legal-review-required.
- **Cash App:** USDC on Solana, Ethereum, Polygon and **Arbitrum** since 2026-05-27. Fee-free to start. Not in NY. $2k/day send.
- **Venmo:** rolled out PYUSD buy, sell and send to about 67M users (Aug 2026). PYUSD sends support Arbitrum. PayPal/Venmo advertise about **4% variable rewards** on PYUSD balances, which competes with Blunts' "savings" pitch.
- **Visa:** USDC settlement live for US issuers and acquirers, about a $7B annualized run rate by April 2026. **Mastercard:** settlement in USDC, PYUSD and RLUSD announced 2026-06-03. Consumer-invisible, but it makes stablecoin-backed debit cards (Bridge issuing, Crossmint, etc.) viable for a future "spend your Blunts" card.
- **Stripe Sessions 2026:** Bridge fee passthrough and fixed fees for USD virtual account onramps (GA Q2 2026); FedNow onramps and ACH pulls from virtual accounts (Q2 2026); headless Stripe Crypto Onramp with light KYC under $500; Privy custodial and self-custodial accounts; stablecoin-backed cards in 60 countries (Q3 2026).
- **Coinbase:** guest checkout ended 2026-06-30. Headless Onramp added Google Pay, App2App, and "unlimited lifetime limits" upgrade APIs (June 2026). The zero-fee USDC partner subsidy continues.
- **Robinhood Chain mainnet** (2026-07-01, Arbitrum Orbit L2). USDC bridged in arrives as **USDG** through Across, Relay, LayerZero/Stargate or CCIP (Across fills in about 2 seconds). The canonical bridge takes about 10 minutes in and **about 7 days out**, so always use fast bridges for withdrawals. Stock Tokens are non-US for now. The **SEC Innovation Exemption** (2026-09-17) allows permissioned trading of tokenized NMS stocks on "Tokenized Securities Venues" for 5 years, with symbol and volume caps.
- **Debit interchange (Reg II):** a district court vacated Reg II in Aug 2025 but stayed the ruling pending appeal. The Fed's 14.4¢ proposal is still pending. This matters only if Blunts ever acquires debit cards directly.

---

## 7. Recommendation (ranked build order)

1. **MVP rails:** (a) **Cash App USDC on Arbitrum** in and out, plus (b) **Venmo/PayPal PYUSD on Arbitrum** in and out. Near-zero cost, no chargebacks, and they match where the target users already keep money. Provide a per-user deposit address (Privy universal deposit address) and a "Send from Cash App" deep link with a copy-address flow. Handle the wrong-network risk with clear UI, since mis-sent funds are lost forever.
2. **Bank rail:** **Bridge** virtual accounts (ACH/FedNow in; ACH/RTP out), developer fee set to $0. Blunts absorbs about 0.5%. Zero Hash is the alternative if NY coverage or Bridge pricing is a problem (Cash App excludes NY anyway).
3. **Card rail:** apply now to **Coinbase CDP's zero-fee USDC program** and integrate **Headless Onramp** (Apple Pay and Google Pay, debit only). If Blunts is not approved, use **Stripe Crypto Onramp** (it carries fraud) and absorb fees only up to a monthly cap. Skip MoonPay, Transak and Ramp as primary rails because of the $3.99 minimums.
4. **Cash:** a "Load cash at Walmart/CVS with Cash App, then send to Blunts" guide. No direct retail integration yet.
5. **Withdrawals:** default to **Cash App / Venmo** (free, instant), then ACH (free, 1–2 days), then **Instant to debit (Visa Direct), about $1 or 1% to the user.** That fee is the one user-facing fee, and it matches what Cash App and Venmo already charge.
6. **No credit cards.**

**Rough blended cost at scale:** about **0.3–0.7% per deposit** and about **0.1–0.5% per withdrawal**. A user becomes profitable on ramp costs alone at an average balance of roughly **$200–$1,000**, depending on profit share and rail mix, **provided returns are positive**. Plan for float yield or instant-withdraw fees to carry down years.

---

## Open questions / unverified

- Bridge's 0.25%/0.50% pricing comes from a third-party write-up (eco.com). Confirm with Bridge sales.
- Stripe Crypto Onramp pricing and whether its US network list includes Arbitrum.
- Coinbase standard US debit/Apple Pay fee under Headless Onramp, and Blunts' eligibility for zero-fee USDC.
- When Cash App will start charging for USDC sends and receives, and how much.
- The PayPal/Venmo network fee for PYUSD on Arbitrum.
- Across/Relay fees into Robinhood Chain for $25 tickets.
- USDG Global Dollar Network reward rate, and whether GENIUS rules allow passing it to users.
- Plaid Auth pricing (negotiated).

---

## Sources

- Coinbase — Zero-fee USDC launch: https://www.coinbase.com/developer-platform/discover/launches/zero-fee-usdc
- Coinbase — Onramp overview (guest checkout deprecation 2026-06-30, $500/wk guest limit): https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/onramp-overview
- Coinbase — Onramp FAQ (ACH 0.5%, card 2.5%, US credit not supported, offramp needs account): https://docs.cdp.coinbase.com/onramp/additional-resources/faq
- Coinbase — Headless Onramp June update: https://www.coinbase.com/developer-platform/discover/launches/headless-onramp-h2
- Coinbase — Headless Onramp docs: https://docs.cdp.coinbase.com/onramp/headless-onramp/overview
- Coinbase — Offramp integration guide: https://docs.cdp.coinbase.com/onramp/offramp/offramp-integration-guide.md
- Alchemy Pay / Bitget zero-fee USDC (Coinbase-backed): https://www.globenewswire.com/news-release/2025/12/22/3209028/0/en/Bitget-Wallet-and-Alchemy-Pay-Launch-Zero-Fee-USDC-On-Ramp-Backed-by-Coinbase.html
- Stripe — Sessions 2026 announcements: https://stripe.com/blog/everything-we-announced-at-sessions-2026
- Stripe — Crypto Onramp: https://stripe.com/crypto-onramp
- Stripe — ACH Direct Debit pricing: https://support.stripe.com/questions/ach-direct-debit-pricing
- Bridge — Developer fees docs: https://apidocs.bridge.xyz/platform/orchestration/fees-and-mins/devfees
- Bridge pricing (third party): https://eco.com/support/en/articles/15083178-bridge-xyz-stablecoin-api-for-payouts-and-orchestration
- Bridge virtual accounts (third party): https://stablecoininsider.org/how-to-open-a-bridge-virtual-account-for-usdc/
- Onramp comparison 2026 (MoonPay/Transak/Ramp/Banxa fees, state coverage): https://eco.com/support/en/articles/15210390-best-stablecoin-onramps-2026-moonpay-transak-coinbase-onramp-compared
- MoonPay — payment methods and limits: https://support.moonpay.com/en/articles/389117-payment-methods-settlement-times-and-limits
- MoonPay — Balance (PayPal/Venmo/ACH funding): https://support.moonpay.com/en/articles/381106-moonpay-balance-how-to-top-up-use-and-withdraw
- MoonPay — withdrawal methods: https://support.moonpay.com/en/articles/384613-supported-withdrawal-methods-for-selling-cryptocurrency
- Ramp Network — offramp: https://blog.ramp.network/off-ramp-is-live
- Zero Hash — on/off ramp: https://zerohash.com/products/fiat-to-crypto-on-off-ramp
- Sardine — instant ACH: https://www.sardine.ai/blog/sardine-makes-instant-ach-funding-available-for-metamask-users-in-the-usa
- Alchemy Pay — Illinois MTL (18 states): https://www.prnewswire.com/news-releases/alchemy-pay-secures-illinois-money-transmitter-license-expanding-us-regulatory-coverage-to-18-states-302809262.html
- Robinhood Crypto fee schedule (Connect): https://cdn.robinhood.com/assets/robinhood/legal/rhc-fee-schedule.pdf
- Meld: https://www.meld.io/ and https://www.meld.io/blog/fiat-crypto-onramps-with-meld
- Crossmint onramp: https://docs.crossmint.com/stablecoin-orchestration/onramp/overview
- Privy funding / card onramps: https://www.privy.io/funding and https://docs.privy.io/wallets/funding/fiat-onramp
- Circle Mint redemption structure: https://help.circle.com/s/article/USDC-redemption-structure
- Paxos mint and redeem: https://www.paxos.com/mint-and-redeem
- Global Dollar Network: https://globaldollar.com/ and https://www.paxos.com/newsroom/introducing-global-dollar-network-an-open-network-to-accelerate-and-reward-global-stablecoin-adoption-driven-by-anchorage-digital-bullish-galaxy-digital-kraken-nuvei-paxos-and-robinhood
- Cash App — stablecoins press release: https://cash.app/press/cash-app-stablecoins-all-customers
- Cash App — CoinDesk rollout scoop (limits, NY exclusion): https://www.coindesk.com/business/2026/05/27/block-kicks-off-cash-app-s-phased-stablecoin-roll-out-to-its-nearly-60-million-users
- Cash App — PYMNTS: https://www.pymnts.com/cryptocurrency/2026/cash-app-rolls-out-stablecoin-payments/
- Cash App — Paper Money deposits: https://cash.app/help/us/en-us/6488-paper-money-deposits and https://moneypantry.com/where-to-load-my-cash-app-card/
- PayPal — crypto transfers (PYUSD on Arbitrum): https://www.paypal.com/us/cshelp/article/how-do-i-transfer-my-crypto-help822
- Venmo — crypto transfers: https://help.venmo.com/cs/articles/crypto-transfers-vhel232
- Venmo PYUSD rollout (Aug 2026): https://en.cryptonomist.ch/2026/08/25/venmo-pyusd-support/
- PayPal PYUSD rewards: https://www.paypal.com/us/digital-wallet/manage-money/crypto/pyusd
- Green Dot × Crypto.com: https://www.paymentsdive.com/news/green-dot-cryptocom-partner-for-banking-services/746987/
- PayNearMe cash payments: https://home.paynearme.com/platform/payment-types/cash-payments/
- Coinbase instant cashout 1.5% (third party): https://eco.com/support/en/articles/15039728-convert-usdc-to-bank-account-fastest-routes-in-2026
- Visa Direct / instant payout pricing: https://finix.com/resources/blogs/instant-payouts-explained and https://www.routable.com/resources/what-are-instant-payouts/
- FedNow vs RTP pricing: https://eco.com/support/en/articles/15650251-fednow-vs-rtp-2026-real-time-payment-rails-compared
- Credit card MCC 6051 / cash advance: https://didit.me/blog/memecoin-credit-card-merchant-code-kyc-2026/ and https://tokentax.co/blog/buy-crypto-with-a-credit-card
- Reg II status: https://www.cooley.com/news/insight/2025/2025-08-15-district-court-vacates-regulation-iis-debit-card-interchange-fee-standard
- Robinhood Chain mainnet: https://www.theblock.co/news/business/2026-07-01-robinhood-chain-goes-live-mainnet-alongside-24-7-tokenized-stocks-lighter-perps-planned-crypto-agentic-trading-406918 and https://robinhood.com/us/en/newsroom/robinhood-accelerates-global-expansion-robinhood-chain-mainnet-stock-tokens-agentic-trading/
- Robinhood Chain bridging docs: https://docs.robinhood.com/chain/bridging/
- Across → Robinhood Chain (USDC arrives as USDG): https://across.to/blog/bridge-to-robinhood-chain-with-across
- SEC Innovation Exemption: https://www.sec.gov/newsroom/press-releases/2026-90-sec-issues-innovation-exemption-facilitate-trading-tokenized-nms-stock-request-comment and https://www.cnbc.com/2026/09/17/sec-clears-path-for-tokenized-stocks-bringing-24/7-trading-closer.html
- GENIUS Act — OCC proposed rule: https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-3.html
- GENIUS Act — OCC final-rule timing: https://www.pymnts.com/legal/2026/occ-races-the-clock-to-finish-genius-act-stablecoin-rules/
- GENIUS Act — rulemaking tracker: https://www.chapman.com/publication-genius-act-rulemaking-tracker
- GENIUS Act — FDIC proposal: https://www.federalregister.gov/documents/2026/04/10/2026-06974/genius-act-requirements-and-standards-for-fdic-supervised-permitted-payment-stablecoin-issuers-and
- Visa US USDC settlement: https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21951.html
- Mastercard stablecoin settlement (June 2026): https://www.mastercard.com/global/en/news-and-trends/press/2026/june/mastercard-expands-settlement-capabilities-to-include-stablecoin.html
