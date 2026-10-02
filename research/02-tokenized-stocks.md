# 02 — Tokenized Stocks: Rails for the BLUNT Basket

*Research date: 2026-09-28. Sources were web search/fetch results from Sept 2026, cited inline as [n] (list at the bottom). Tags: **[V]** = checked against a primary source (issuer docs, SEC, company newsroom). **[S]** = secondary reporting only. **[UNVERIFIED]** = conflicting or thin sourcing, so confirm before relying on it. Nothing here is legal advice. Every structuring conclusion needs securities counsel in the US, Cayman/BVI, and each target market.*

---

## TL;DR

1. **Offshore (non-US users): you can build this today.** Tokenized stocks now trade widely as permissionless ERC-20/SPL tokens: Robinhood Stock Tokens (Jersey), xStocks (Kraken/Backed, Jersey), and Ondo Stocks (BVI). All are **debt-like tracker notes**, meaning you get economic exposure but no share ownership. All exclude **US persons**. Smart contracts can hold them, so an ERC-4626-style basket vault is technically straightforward.
2. **US users: not yet for a token like BLUNT.** On Sept 17, 2026 the SEC's **Innovation Exemption** began letting *venues* (TSVs) trade tokenized NMS stocks on-chain via AMMs, and self-custody is allowed [4][5]. It does **not** exempt the *offering* of a new basket product. BLUNT would almost certainly be a security and likely an **investment company** (a fund) under the '40 Act. The **CLARITY Act failed cloture on Sept 15, 2026** (49–50) [7]. The realistic US path today is an off-chain brokerage model (Alpaca/DriveWealth fractional shares under a registered RIA/broker), or distributing already-compliant tokens (Dinari dShares, Ondo US, Securitize) instead of your own basket token.
3. **The simplest "index" is a tokenized QQQ.** QQQx (xStocks), QQQon (Ondo), and a Robinhood QQQ token all exist offshore. One token means no rebalancing, and it gives ~Nasdaq-100 exposure (MSFT, AAPL, NVDA, GOOGL, META, AMZN, TSLA are all top holdings; PLTR joined the Nasdaq-100 in Dec 2024).
4. **Private names have changed.** **SpaceX IPO'd June 12, 2026 (Nasdaq: SPCX)** [15][16], so it is now a normal public stock you can buy in tokenized form. **Anthropic** filed a confidential S-1 on June 1, 2026 and is targeting a ~November IPO [S][19]. **OpenAI** says no IPO in 2026 and is targeting 2027 [20]. In May 2026 both Anthropic and OpenAI declared SPV transfers **void**, and PreStocks tokens fell 34–39% [17]. **Do not put pre-IPO SPV tokens in BLUNT.** The only clean private-company proxy is listed wrappers such as **Robinhood Ventures Fund I (NYSE: RVI)**, a registered closed-end fund holding OpenAI, Databricks, Stripe, and others [22].
5. **Recommendation (detail in §6).** Launch offshore (Cayman or BVI issuer, Reg S, no US persons) with a **"core + satellites" vault**: ~60–70% in a tokenized QQQ, plus tokenized single names to overweight the specific brand names (NVDA, PLTR, TSLA, SPCX, and ANTH once it lists). Build it on **one issuer family on one chain** to keep ops simple. Run a parallel US track on the Alpaca/DriveWealth off-chain model, and revisit US tokenization after the Innovation Exemption venues and Regulation Crypto Assets mature, likely 2027+.

---

## 1. Robinhood Chain & Robinhood Stock Tokens

| Item | Finding | Tag |
|---|---|---|
| Status | **Mainnet live since July 1, 2026.** A public testnet launched Feb 2026 and processed 200M+ transactions [1][2] | [V] |
| What it is | L2 "built on the Arbitrum Platform" (Arbitrum Orbit-style chain) settling to Ethereum. Chain ID **4663**, gas paid in **ETH**, canonical Arbitrum bridge, ~100 ms blocks, described as **permissionless**: anyone can deploy contracts [1][3] | [V] |
| Launch partners | Uniswap (v2/v3/v4/UniswapX), Pleiades (prop AMM), Chainlink, Alchemy, BitGo [1][6] | [V] |
| Stock Token issuer | **Robinhood Assets (Jersey) Limited ("RHJ")**. Tokens are *tokenised debt securities* that give economic exposure but **no legal or beneficial rights** in the underlying shares [1][3][8] | [V] |
| Who can hold | Sold via Robinhood Wallet in **120+ countries**. **Not available to US persons**, and restricted in Canada, UK, Switzerland, UAE, and sanctioned jurisdictions [1][3] | [V] |
| Legacy EU product | The original June 2025 EU product ran on Arbitrum One through Robinhood Europe UAB (Lithuania, MiFID II) and was being migrated to Robinhood Chain [S][9] | [S] |
| Catalog | ~**190+ tokens live on-chain** by early Sept 2026 [23]. Other sources cite "2,000+" tokens, which likely counts the EU app catalog, not on-chain tokens | [S] / count [UNVERIFIED] |
| Token standard | Standard **ERC-20, 18 decimals**, with an **ERC-8056 scaled-UI multiplier** (`uiMultiplier()`). Dividends are **reinvested** and splits are handled by the multiplier, so the raw balance never changes [8] | [V] |
| Smart contracts / third parties | Docs say tokens "can be held, transferred, and composed into applications onchain," and point to DeFi lending/collateral use. They trade on Uniswap, Rialto, Lighter, Arcus, and 1inch [1][8]. No allowlist is documented, but whether the contract has pause/freeze/blocklist functions was **not confirmed**, so read the contracts on robinhoodchain.blockscout.com | [V] / blocklist [UNVERIFIED] |
| Mint/redeem | **Only KYB'd Authorized Participants** (initially "BBVI") mint and redeem with RHJ, for **cash**. The tokenization window runs Mon 02:00 CET to Sat 02:00 CET, and secondary trading is 24/7 [8][23]. In Sept 2026 Robinhood said **1:1 in-kind share redemption and voting are "coming,"** with no date given, after AMC's CEO criticized the tokens [10] | [V] |
| Price feeds | A Chainlink feed for every Stock Token [8] | [V] |
| Liquidity | $3B+ cumulative Stock Token DEX volume in the first two months, and stock-token TVL of about $170M [23][24]. Uniswap handles ~86% of DEX volume. There has been a **weekend premium dislocation** (a HIMS wrapper traded above the underlying while minting was closed) [23]. Blockworks measured **all-in cost of ~4–5% on sub-$100 trades** and ~35–44 bps on $100–$1k trades, versus ~0.1% / ~2–3 bps on Backpack (Solana) [25] | [S] |
| Private-company tokens | In June/July 2025 Robinhood airdropped **OpenAI and SpaceX tokens** to EU users. These were SPV-wrapped exposure. OpenAI said publicly: **"these 'OpenAI tokens' are not OpenAI equity"** [11]. The Bank of Lithuania asked for clarifications [12]. The 2026 Jersey product docs cover listed equities and ETFs only. The final regulatory outcome of the OpenAI/SpaceX tokens was not found | [V] / outcome [UNVERIFIED] |
| US plans | After the Innovation Exemption, Tenev said "Tokenization is coming to America" [13]. No US Stock Token launch date has been announced | [S] |

**Implication for Blunts:** Robinhood Chain gives you the best distribution and composability, but it has two big drawbacks for a micro-deposit app. First, **L2 gas floors make small trades expensive** in percentage terms. Second, you depend on RHJ's single AP for primary liquidity. If Blunts runs on Robinhood Chain, it should batch deposits and only rebalance in size.

---

## 2. Issuer landscape (Sept 2026)

### Comparison table

| Issuer / product | Legal form | Issuer domicile / reg. | US persons? | Chains | Mint/redeem (primary) | Min. primary | Dividends | Transfer model | Liquidity notes | Oracle |
|---|---|---|---|---|---|---|---|---|---|---|
| **Robinhood Stock Tokens** | Debt security (tracker), no share rights | Robinhood Assets (Jersey) Ltd | **No** | Robinhood Chain (Arbitrum tech) | KYB'd APs only, cash; in-kind "coming" | AP-only | Reinvested via multiplier | Permissionless ERC-20 (verify blocklist) | ~190 tokens, ~$170M TVL, Uniswap-centric | Chainlink |
| **xStocks** (Backed, owned by Kraken since Dec 2025) | **Tracker certificate** (bearer debt), 1:1 collateralized in segregated custody (CH/US) | Backed Assets (JE) Ltd, Jersey (JFSC). EU base prospectus approved by Liechtenstein FMA | **No** (also not UK/CA/AU) | Solana, Ethereum, Arbitrum, Mantle, TON, Ink, other EVM chains (CCIP) | KYC'd direct clients, 24/5 | **$5,000** | Reinvested via rebasing | **Permissionless** SPL-2022/ERC-20 | 100+ tokens (target 500 by YE26). Kraken/Bybit CEX plus DEX. **QQQx, SPYx** exist. Kraken xStocks yield vaults launched Sept 14, 2026 (QQQx ~2% est. APY) | Chainlink (CCIP/feeds) |
| **Ondo Stocks** (formerly Ondo Global Markets) | Notes tracking total return; bankruptcy-remote with security agent and daily verification agent | **Ondo Global Markets (BVI) Ltd** | **No** (offshore product) | Ethereum, BNB Chain, Solana | KYC'd, stablecoin in/out, 24/5 (24/7 instant for NVDAon, SPYon, TSLAon, **QQQon**, GOOGLon, CRCLon) | Not stated | Reinvested, net of 30% US WHT | Holders identified only at mint/redeem; DeFi-composable | **$1B+ TVL**, claims >70% issuer share, 450+ assets | Chainlink tokenized-equity feeds |
| **Ondo US (onshore)** | **Security entitlements** with real ownership and voting (Broadridge) | Oasis Pro TA (SEC transfer agent) | Yes (eligible) | [UNVERIFIED] | Via platform | [UNVERIFIED] | Pass-through | Restricted (no free DeFi) | New (July 2, 2026) | n/a |
| **Dinari dShares** | 1:1 backed, holders on shareholder ledger. Dinari is an SEC TA, Dinari Securities is a BD (FINRA/SIPC). Underlying held at Alpaca | US | **Yes** (eligible US; accredited-only vs retail [UNVERIFIED]) plus 85+ countries | Ethereum, Arbitrum, Base, Avalanche (Solana, Sei soon) | Via Dinari, paid in USDC | n/a | Cash/USDC dividends, voting | **Allowlisted**: wallets must be KYC'd and a TransferRestrictor sits on every transfer. No free DEX/DeFi | 724 tokens incl. the full S&P 500 (Aug 4, 2026) | n/a |
| **Coinbase tokenized stocks** | 1:1 backed, "direct equity ownership," auto dividends | Coinbase (Reg S) | **No** at launch | **Base** (B20 standard, on-chain multiplier) | [UNVERIFIED] | [UNVERIFIED] | Automatic pass-through | [UNVERIFIED] | Announced June 2026, launched Aug 2026 [S] | n/a |
| **Backpack Securities** | Security entitlements (NY UCC Art. 8), redeemable for real shares via ACATS/DTC | US brokerage (with Sunrise) | [UNVERIFIED] | Solana | Via Backpack | n/a | Cash | [UNVERIFIED] | **SPCX** token was the top SpaceX token ($1.08B June volume). Lowest measured small-trade cost | n/a |
| **Securitize** | Issuer-sponsored real shares | Securitize (SEC TA/BD; NYSE: SECZ) | Yes (eligible, KYC) | Solana, Avalanche | Via platform | n/a | Pass-through | Permissioned | Mostly issuer-sponsored names (SECZ). On-chain trading with Jump/Jupiter since May 2026 | n/a |
| **Superstate Opening Bell** | Issuer-sponsored SEC-registered shares, with Superstate as transfer agent | US | Yes (KYC'd allowlist) | Solana (+ others) | Issuer-sponsored | n/a | Pass-through | Allowlisted | Only a few issuers (GLXY, EXOD). None of the Blunts names | n/a |
| **Gemini** | Tokenized stocks for EU users (via Dinari at launch [UNVERIFIED]) | EU | No | [UNVERIFIED] | — | — | — | — | Small catalog | — |
| **PreStocks** (pre-IPO) | SPV exposure | — | — | Solana | — | — | — | — | **Avoid**: companies say the transfers are void, no attestations | — |

Sources: [1][3][8][23] Robinhood · [26][27][28][29][30] xStocks/Kraken · [31][32][33][34] Ondo · [35][36][37] Dinari · [38] Coinbase · [16][25][39] Backpack · [40] Securitize · [41] Superstate · [42] Gemini · [17] PreStocks.

### Market infrastructure (US, institutional)
- **DTC tokenization pilot.** SEC staff no-action letter in **Dec 2025**, for 3 years. It covers Russell 1000 stocks, major index ETFs, and Treasuries. First live production trades were **July 15, 2026**, and the **full service launches in October 2026** [43][44]. This is for DTC participants (broker-dealers and banks), not retail wallets.
- **Nasdaq**: SEC approved its tokenized-securities rule on **Mar 18, 2026**. Tokenized versions trade on the same order book as traditional shares and must be fungible with the same CUSIP and the same rights. It uses the DTC pilot. **NYSE**: similar rule approved Apr 17, 2026 [45][46].
- **Alpaca Instant Tokenization Network (ITN)**: live since Oct 2025, with 24/7 in-kind mint/redeem for APs. Alpaca reportedly **clears or custodies ~94% of tokenized US equities (~$1.5B)** [47]. That is a **hidden concentration risk** across "different" issuers: Dinari, and Ondo via its partnership, sit on Alpaca.
- **Chainlink 24/5 US Equities Data Streams**: launched Jan 20, 2026. Pull-based, sub-second updates, covering regular, pre-market, post-market, and overnight sessions, with bid/ask/volume, across 40+ chains [48]. This is the obvious NAV oracle for a BLUNT vault.
- **Tokenized ETF share classes** (e.g., F/m Investments' Jan 2026 application for TBIL) have **not** been approved as of mid-2026 [49]. You cannot yet buy an "official" on-chain QQQ share class as a US retail user.

---

## 3. Private companies: what exposure actually exists

| Name | Status (Sept 2026) | Tokenized exposure | Caveats |
|---|---|---|---|
| **SpaceX** | **Public.** IPO June 12, 2026 on Nasdaq as **SPCX**. $135 offer price, $161 first close, ~$1.8T valuation [15] | Normal tokenized-stock route: Backpack SPCX, xStocks SPCXx, and likely a Robinhood token [16] | Pre-IPO token buyers on Bybit/Binance "came up dry" on allocations [50]. Stick to post-IPO, share-backed tokens |
| **Anthropic** | Private. Confidential S-1 filed June 1, 2026, IPO targeted ~Nov 2026 [19] | Only SPV-based pre-IPO tokens (PreStocks) and secondaries | **Anthropic: SPV transfers are "void under our transfer restrictions"** [17]. PreStocks has ~$23M in assets against implied valuations above $1T and no attestations. **Wait for the IPO**, then add it through a normal tokenized share |
| **OpenAI** | Private. Altman (Sept 12, 2026): a 2026 IPO would be "ill-advised," target is 2027 [20] | SPV tokens only | OpenAI disavowed Robinhood's 2025 tokens [11] and warned in 2026 that unauthorized SPV transfers may be invalid [17] |
| **Indirect / compliant** | **Robinhood Ventures Fund I (NYSE: RVI)**, a registered closed-end '40 Act fund holding Databricks, OpenAI, Stripe, SpaceX, and others (~$655M assets per June 30, 2026 disclosure). Reportedly traded at a large NAV premium [22] | Could be held via a tokenized RVI if an issuer lists it [UNVERIFIED] | NAV premium risk. Holdings shift (SpaceX went public, and there is ~32% cash) |

**Bottom line:** in the offshore product, "private names" should mean **SPCX now and ANTH at IPO, via share-backed tokens**. OpenAI is only reachable through wrappers the company says may be invalid. Marketing "OpenAI inside BLUNT" would be a legal and reputational own-goal.

---

## 4. Regulatory timeline: when can US persons hold this?

| Milestone | Date | What it does / doesn't do |
|---|---|---|
| SEC "Project Crypto" launched (Atkins) | ~mid-2025 | Umbrella modernization agenda [5] |
| DTC no-action letter | Dec 2025 | 3-year DTC tokenization pilot for participants [43] |
| SEC staff joint statement on tokenized securities | Jan 28, 2026 | Confirms a tokenized security is still a security, and the form doesn't matter [49] |
| SEC/CFTC token taxonomy | Mar 2026 | Five categories: digital commodities, collectibles, tools, payment stablecoins, and digital securities [51] |
| Nasdaq / NYSE tokenized trading rules | Mar 18 / Apr 17, 2026 | Fungible tokenized shares on exchange books, for broker-dealer participants [45][46] |
| **Regulation Crypto Assets proposed** | Aug 18, 2026 (comments due **Oct 20, 2026**) | New '33 Act offering exemptions for *crypto assets* plus a safe harbor. It targets token issuers, **not** tokenized-equity funds [51] |
| **SEC Innovation Exemption** | **Effective Sept 17, 2026**, 5 years (to 2031) | Tokenized **NMS stocks** can trade on **Tokenized Securities Venues** via AMMs with self-custody. Tokens must carry the **same rights as the underlying**. Third-party tokenization triggers a 30-day issuer objection right. Caps: max 75 Tier-1 symbols per TSV and 0.25% of ADV. **No leverage or lending.** TSVs **cannot do primary issuance**. It does **not** exempt a new basket product from '33 Act registration or '40 Act fund rules [4][5][14] |
| **CLARITY Act** | House passed July 2025. **Senate cloture failed 49–50 on Sept 15, 2026** | A motion to reconsider is pending. Comprehensive market-structure law is now "unlikely before 2027" [7][S] |

**What this means for BLUNT in the US:**
- Today's offshore stock tokens (RHJ, xStocks, Ondo notes) **do not qualify** as Innovation Exemption tokens because they lack the "same rights" as the underlying. They stay Reg S / non-US.
- A US BLUNT token would be a **pooled security whose value comes from a portfolio of securities**, which means '40 Act issues (ETF/mutual fund rules, Sections 18/22(d), Rule 22c-1 per Sidley [14]). Workable routes are: (a) register it as a fund, which is slow and expensive; (b) a private fund under 3(c)(1)/3(c)(7), which is accredited or qualified purchasers only and incompatible with a mass-retail app; or (c) **don't issue a pooled token**. Instead, give each user their own fractional shares in a brokerage account (via Alpaca/DriveWealth) or their own compliant tokens (Dinari/Ondo US), and present the "BLUNT" as a UI-level model portfolio. That is an RIA/robo-adviser model, not a fund.
- **Realistic timing** [my estimate, not sourced]. First TSVs are likely live in Q4 2026–H1 2027 (30-day public filing requirement). Robinhood US tokenized trading by end-2027 is plausible (Motley Fool predicts it [52]). A **retail US basket *token*** probably needs either tokenized ETF share-class approval (none approved yet) or durable SEC rulemaking, so realistically **2027–2028**.

---

## 5. Basket construction options

### Option A: Own vault (ERC-4626-style) holding multiple stock tokens
- **How it works:** a Cayman/BVI SPV issues BLUNT, which are vault shares. The vault holds, for example, NVDA/MSFT/AAPL/GOOGL/META/AMZN/TSLA/PLTR/SPCX tokens. NAV comes from Chainlink 24/5 streams × each token's `uiMultiplier()`. Deposits are batched and swapped on DEX, or minted as an AP (via a $5k-minimum direct client relationship with xStocks, or through an Ondo/RHJ AP).
- **Pros:** full brand control (the exact 8–11 names). Fully on-chain and composable. Rebalancing is programmable.
- **Cons:** you become a **fund manager** (Cayman Mutual Funds Act / Private Funds Act, BVI SIBA; see note below). You carry N× issuer counterparty exposure, rebalancing slippage, oracle risk during weekend closures (tokens trade 24/7 but underlyings don't), and extra smart-contract risk. Small DEX trades on L2 cost ~0.3–5% [25], so you **must batch**. Your fund is also layered on top of issuer notes (credit risk of the Jersey/BVI issuer).

### Option B: Hold a single tokenized QQQ (QQQx / QQQon / Robinhood QQQ token)
- **Pros:** simplest possible design, with no rebalancing (Invesco does it). Deepest single-token liquidity after SPY. QQQx can earn ~2% via Kraken vaults [28]. Ondo QQQon has 24/7 instant mint/redeem [31].
- **Cons:** you get 100 names, not the curated brand list (no SPCX, no private names, lower PLTR/TSLA weight than the brand implies). There is a double fee layer (QQQ's 0.20% expense ratio plus the issuer spread). Single-issuer risk remains. BLUNT would still be a pooled vehicle, so the fund-regulation issue doesn't go away. A 1:1 passthrough (users simply hold QQQx in-app) avoids pooling but is less "Blunts-branded."

### Option C: API broker (Alpaca / DriveWealth) with off-chain fractional shares, plus an optional tokenized receipt
- **Pros:** real shares with SIPC coverage. Fractionals down to $0.01 / 8 decimals (DriveWealth). Commission-free at Alpaca, pricing negotiated at DriveWealth [53]. Execution is at NBBO/midpoint and is by far the **cheapest on small tickets**. **This is the only path that works for US users today**, with each user's account in their own name and a model-portfolio UI.
- **Cons:** it's not "on-chain" unless you tokenize a receipt, which recreates a security or fund problem. You need an RIA registration for managed or model portfolios, plus broker-partner onboarding. Trading only in market sessions (DriveWealth up to 24/5).
- Note: Alpaca already sits under most token issuers [47], so option A/B counterparty risk largely *includes* Alpaca anyway.

### Cost / risk comparison

| | A: Own multi-token vault | B: Tokenized QQQ | C: Broker API fractional |
|---|---|---|---|
| Execution cost (small user trade) | High unless batched: 0.3–5% on L2 DEX, ~0.1% on Solana [25]. AP mint at ~NAV (Ondo charges no mint/redeem fee, spread retained [32]) | Low–moderate: one liquid pair, or AP mint | **Lowest**: commission-free, NBBO |
| Ongoing cost | Issuer spreads + rebalancing slippage + gas + oracle | QQQ ER 0.20% + issuer spread | Broker/platform fees (negotiated) |
| Slippage | Per-name DEX depth varies. Weekend dislocations [23] | Low | Minimal |
| Custody risk | Smart contract + issuer custodian (Alpaca/Swiss banks) + your vault keys | Issuer custodian + wallet | Broker-dealer custody (SIPC) |
| Counterparty | Issuer credit (Jersey/BVI note), AP, custodian, oracle | Single issuer + Invesco | Broker (DriveWealth/Alpaca) |
| Regulatory burden | **Highest** (you run a fund) | High if pooled, lower if pass-through | Moderate (RIA/broker partner), US-viable |
| US users? | No | No | **Yes** |
| Time to MVP | 3–6 months + fund setup | Weeks | 2–4 months (broker onboarding) |

---

## 6. Recommended approach

**Two tracks, one brand.**

**Track 1: International (non-US), on-chain BLUNT.**
1. **Issuer:** a Cayman exempted company or BVI business company. Ondo's BVI note model [31] is a useful template. **Structure BLUNT as a debt/tracker note referencing a basket** (the same form xStocks and Ondo use), not an open-ended fund. That may avoid the Cayman Mutual Funds Act and BVI mutual-fund regimes, but **counsel must confirm it**. Also consider Cayman VASP Act / BVI VASP registration and EU MiFID if you distribute in the EU (you would likely need a licensed distributor or passported prospectus, as xStocks has via Liechtenstein [26]). Offer under Reg S with geo-fencing, KYC at onboarding, and **no US persons**.
2. **Pick one underlying issuer family and one chain.** Two sensible choices:
   - **Ondo Stocks on Solana or BNB/Ethereum**: largest TVL, a BVI issuer, 24/7 instant mint for QQQon/NVDAon/TSLAon/GOOGLon, no mint/redeem fee [31][32]. Solana's per-trade cost suits micro-deposits.
   - **xStocks on Solana**: permissionless, widest chain coverage, Kraken balance sheet, CEX and DEX liquidity, yield vaults, and an SPCXx token.
   - Robinhood Chain is attractive for distribution, but L2 gas floors on small trades [25] and a single AP (BBVI) make it a v2 option.
3. **Basket = core + satellites (ERC-4626-like, or an SPL equivalent):**
   - **Core ~60–70%: QQQ token** (QQQon/QQQx). This covers MSFT/AAPL/NVDA/GOOGL/META/AMZN/TSLA/PLTR plus diversification, with near-zero rebalancing.
   - **Satellites ~30–40%: equal-weight single-name tokens** for the "brand" names: NVDA, PLTR, TSLA, **SPCX**, and **ANTH after its IPO** (if and when it lists and issuers tokenize it). Rebalance quarterly or on threshold drift (>5%). Execute via AP mint/redeem, not DEX, once flows justify it.
   - **No pre-IPO SPV tokens, ever.**
4. **Ops:** batch user deposits (for example hourly or daily net flows) into a single mint/swap. NAV from Chainlink 24/5 streams × multipliers. Price deposits/withdrawals only while underlying markets are open, or apply a weekend spread buffer. Redeem BLUNT → USDC. Offer optional in-kind redemption into the underlying tokens to satisfy the "redeemable for the underlying" promise.
5. **Counterparty hygiene:** publish look-through reserves. Cap exposure to any single issuer, or plan a second issuer as a fallback. Recognize the shared Alpaca custody concentration [47].

**Track 2: US users (off-chain now, on-chain later).**
- Use an Alpaca Broker API or DriveWealth partnership. Each user owns fractional shares of the **same model portfolio** under an RIA (or through the broker's managed-portfolio product). No pooled token. "BLUNTs" become gamified units in the UI, not a security.
- Watch for these unlocks: (i) Innovation Exemption TSVs going live and issuer-sponsored or DTC-tokenized shares becoming available to retail wallets; (ii) SEC approval of tokenized ETF share classes, at which point a tokenized QQQ is the cleanest US "index"; (iii) Regulation Crypto Assets finalization after the Oct 20, 2026 comment deadline; (iv) CLARITY Act revival in 2027. When one lands, migrate US users to self-custodied compliant tokens (Dinari/Ondo US/Securitize) or a registered tokenized fund.

---

## 7. Open questions to verify
- The exact Robinhood Stock Token contract controls (pause/freeze/blocklist), and whether the terms prohibit holding by a pooled vehicle that on-sells exposure. The same question applies to the xStocks and Ondo terms. **Redistribution/wrapping clauses matter a lot.** [UNVERIFIED]
- Whether xStocks, Ondo, or RHJ will onboard Blunts as an AP or direct client, and at what minimums and fees (xStocks direct minimum is $5k [27]).
- Dinari US eligibility: retail vs accredited-only. [UNVERIFIED]
- Coinbase tokenized stocks: live-date details, chains beyond Base, and transferability. [S]
- Whether any issuer lists **RVI** or other listed private-market wrappers.
- Anthropic IPO timing (confidential S-1 filed; "November" is reported, not confirmed). [S]
- Cayman/BVI classification of a basket tracker note under the Mutual Funds Act / SIBA and the VASP regimes. **Counsel needed.**

---

## Sources

1. Robinhood Newsroom: Robinhood Chain mainnet, Stock Tokens, DeFi suite. https://robinhood.com/us/en/newsroom/robinhood-accelerates-global-expansion-robinhood-chain-mainnet-stock-tokens-agentic-trading/
2. Robinhood Chain public testnet (Feb 10, 2026). https://robinhood.com/us/en/newsroom/robinhood-chain-launches-public-testnet ; fintech.global. https://fintech.global/2026/07/03/robinhood-launches-robinhood-chain-mainnet-and-defi-suite/
3. Robinhood Support: Robinhood Chain mainnet. https://robinhood.com/us/en/support/articles/robinhood-chain-mainnet/
4. SEC press release 2026-90: Innovation Exemption. https://www.sec.gov/newsroom/press-releases/2026-90-sec-issues-innovation-exemption-facilitate-trading-tokenized-nms-stock-request-comment
5. Atkins statement on the Innovation Exemption. https://www.sec.gov/newsroom/speeches-statements/atkins-innovation-exemption-bridge-toward-durable-rulemaking-091726 ; CoinDesk. https://www.coindesk.com/policy/2026/09/17/sec-rolls-out-long-awaited-innovation-exemption-for-tokenized-securities-venues
6. Uniswap blog: live on Robinhood Chain. https://blog.uniswap.org/robinhood-chain-is-live ; PRNewswire (Chainlink). https://www.prnewswire.com/news-releases/robinhood-chain-launches-and-adopts-chainlink-to-unlock-access-to-the-onchain-economy-for-millions-of-users-302816242.html
7. CLARITY Act: cloture failed Sept 15, 2026. https://homecryptoinvest.com/articles/clarity-act-update-2026.html ; CNBC Sept 1, 2026. https://www.cnbc.com/2026/09/01/crypto-enters-september-with-policy-gamble-hanging-by-a-thread.html ; Latham tracker. https://www.lw.com/en/us-crypto-policy-tracker/legislative-developments
8. Robinhood Chain docs: Stock Tokens. https://docs.robinhood.com/chain/stock-tokens/ ; Corporate actions. https://www.robinhood.com/eu/en/support/articles/corporate-actions-for-stock-tokens/
9. CNBC (June 30, 2025): OpenAI/SpaceX tokens in EU. https://www.cnbc.com/2025/06/30/robinhood-stock-openai-spacex-tokens.html
10. CoinDesk (Sept 14, 2026): Robinhood plans redemptions and voting. https://www.coindesk.com/business/2026/09/14/robinhood-plans-share-redemptions-voting-rights-for-stock-tokens-after-criticism
11. TechCrunch: OpenAI condemns Robinhood's OpenAI tokens. https://techcrunch.com/2025/07/02/openai-condemns-robinhoods-openai-tokens
12. CNBC: EU scrutiny / Bank of Lithuania. https://www.cnbc.com/2025/07/07/robinhood-stock-tokens-face-scrutiny-in-the-eu-after-openai-warning.html
13. Benzinga: Tenev reaction. https://www.benzinga.com/crypto/cryptocurrency/26/09/61860709/sec-gives-tokenized-stocks-a-five-year-onchain-runway-robinhood-ceo-vlad-tenev-says-its-a-good-day-for-us-innovation
14. Sidley Austin: Innovation Exemption analysis. https://www.sidley.com/en/insights/newsupdates/2026/09/sec-issues-innovation-exemption-for-onchain-trading-of-tokenized-us-listed-stocks ; Mayer Brown. https://www.mayerbrown.com/en/insights/publications/2026/09/sec-innovation-exemption
15. Wikipedia: SpaceX IPO. https://en.wikipedia.org/wiki/Initial_public_offering_of_SpaceX
16. CoinDesk: SpaceX IPO powers record tokenized volume. https://www.coindesk.com/markets/2026/07/07/spacex-ipo-powers-record-usd3-86-billion-in-tokenized-equities-trading-in-june
17. CoinDesk (May 13, 2026): Anthropic/OpenAI tokens plunge, SPV transfers invalid. https://www.coindesk.com/markets/2026/05/13/anthropic-openai-tokens-plunge-nearly-40-as-ai-firms-warn-spv-transfers-are-invalid
18. CoinGecko: Tokenized Equities Report, Sep 2026. https://www.coingecko.com/en/api/reports/tokenized-equities-sep-2026
19. Axios/Yahoo: Anthropic still plans 2026 IPO. https://finance.yahoo.com/technology/ai/articles/anthropic-still-plans-2026-ipo-150602685.html ; Forbes comparison. https://www.forbes.com/sites/investor-hub/article/openai-vs-anthropic-ipo-comparison/
20. TechCrunch (Sept 12, 2026): Altman on a 2026 IPO. https://techcrunch.com/2026/09/12/openais-sam-altman-says-it-would-be-ill-advised-to-go-public-in-2026/
21. Fortune: SpaceX tokens a bust on IPO day. https://fortune.com/crypto/2026/06/15/spacex-ipo-tokens-tokenized-stocks-xstocks-kraken/
22. RVI N-CSR (SEC). https://www.sec.gov/Archives/edgar/data/0002085091/000208509126000012/ck0002085091-20260331.htm ; holdings summary. https://valueaddvc.com/blog/rvi-stock-holdings-the-complete-list-of-what-robinhood-ventures-i-owns-in-2026
23. insights4.vc: Robinhood Chain, two months in. https://insights4.vc/blog/robinhood-chain-q3-2026/
24. KuCoin news: Robinhood DEX volume and stock-token TVL. https://www.kucoin.com/news/flash/robinhood-s-on-chain-dex-trading-volume-approaches-50-billion-with-stock-token-tvl-exceeding-170-million
25. Solana Compass / Blockworks Research cost comparison. https://solanacompass.com/news/backpack-securities-charges-012-against-robinhood-chain-542-for-small-dollar
26. xStocks Docs: Product Legal Overview. https://docs.xstocks.fi/docs/product-legal-overview ; Kraken xStocks risk disclosure. https://www.kraken.com/legal/xstocks
27. xStocks Docs: FAQ. https://docs.xstocks.fi/docs/frequently-asked-questions
28. Genfinity: Kraken xStocks vaults (Sept 14, 2026). https://genfinity.io/2026/09/14/kraken-xstocks-vaults-kamino-veda-sentora-tokenized-stock-yield/ ; Kraken QQQx. https://www.kraken.com/xstocks/qqqx
29. Kraken blog: Backed acquisition. https://blog.kraken.com/news/backed-acquisition
30. Kraken blog: 100 xStocks. https://blog.kraken.com/product/xstocks/celebrating-100-xstocks ; Kraken support, availability. https://support.kraken.com/articles/xstocks-availability
31. Ondo Stocks. https://ondo.finance/ondo-stocks
32. Ondo docs: Fees & Taxes. https://docs.ondo.finance/ondo-global-markets/fees-and-taxes
33. Ledger Insights: Ondo onshore US tokenized stocks. https://www.ledgerinsights.com/ondo-launches-onshore-us-tokenized-stocks-with-ownership-rights/
34. Genfinity: Ondo Global Markets becomes Ondo Stocks. https://genfinity.io/2026/07/13/ondo-global-markets-becomes-ondo-stocks-tokenized-equities-leader/ ; Chainlink Ondo feeds. https://docs.chain.link/data-feeds/tokenized-equity-feeds/ondo
35. CoinDesk (Aug 4, 2026): Dinari for US investors. https://www.coindesk.com/business/2026/08/04/dinari-brings-tokenized-u-s-stocks-to-american-investors-as-equity-race-heats-up
36. Dinari docs: Restrictions. https://docs.dinari.com/docs/restrictions
37. Eco (secondary comparison). https://eco.com/support/en/articles/15254023-tokenized-equities-2026-backed-dinari-robinhood
38. CoinDesk (June 16, 2026): Coinbase tokenized stocks. https://www.coindesk.com/business/2026/06/16/coinbase-to-join-tokenized-stock-race-with-onchain-shares-dividend-payments ; The Block. https://www.theblock.co/post/404978/coinbase-launching-tokenized-us-stocks-backed-11-holders-receive-dividends
39. Genfinity: Backpack SPCX. https://genfinity.io/2026/06/11/spacex-spcx-tokenized-stock-solana/
40. CoinDesk: Securitize SECZ tokenized. https://www.coindesk.com/business/2026/07/02/securitize-tokenizes-usd295-million-of-its-own-stock-on-solana-and-avalanche-amid-nyse-debut
41. Superstate/Galaxy GLXY. https://www.prnewswire.com/news-releases/galaxy-and-superstate-launch-glxy-tokenized-public-shares-on-solana-302544834.html ; https://superstate.com/assets/exod
42. TradeInformer / Gemini tokenized stocks. https://tradeinformer.com/broker-news/kraken-xstocks-reaches-100-tokenized-equities
43. DTCC: first tokenized production trades. https://www.dtcc.com/press-releases/2026/dtcc-turns-tokenization-into-reality ; DTCC May 2026. https://www.dtcc.com/news/2026/may/04/dtcc-advances-development-of-new-tokenization-service
44. Carlton Fields: DTC no-action letter. https://www.carltonfields.com/insights/publications/2025/sec-staff-no-action-letter-to-dtc-for-tokenization-services
45. CoinDesk (Mar 18, 2026): SEC approves Nasdaq tokenized trading. https://www.coindesk.com/policy/2026/03/18/sec-approves-nasdaq-s-move-to-allow-tokenized-securities-trading
46. Free Writings: NYSE tokenized rule (Apr 2026). https://www.freewritings.law/2026/04/nyse-rule-change-enabling-trading-of-tokenized-securities/
47. Crypto Briefing: Alpaca ITN at 94%. https://cryptobriefing.com/alpaca-instant-tokenization-network-tokenized-equities/ ; Alpaca AP guide. https://docs.alpaca.markets/us/docs/tokenization-guide-for-authorized-participant
48. Chainlink: 24/5 US Equities Streams. https://chain.link/blog/chainlink-24-5-us-equities-streams ; docs. https://docs.chain.link/data-streams/rwa-streams/24-5-us-equities-user-guide
49. Seward & Kissel 40 Act Blog: tokenization in registered funds. https://40actblog.sewkis.com/insights/incremental-evolution-of-the-secs-approach-to-tokenization-and-the-use-of-digital-assets-in-registered-fund-structures/ ; F/m tokenized ETF application. https://www.businesswire.com/news/home/20260121050190/en/Fm-Investments-Files-First-of-Its-Kind-SEC-Application-for-Tokenized-ETF-Shares
50. CoinDesk: SpaceX IPO scramble lesson. https://www.coindesk.com/tech/2026/06/13/spacex-ipo-scramble-reveals-difference-between-tokenizing-a-stock-and-getting-one
51. White & Case: Regulation Crypto Assets. https://www.whitecase.com/insight-alert/sec-proposes-regulation-crypto-assets-rulemaking ; Atkins remarks. https://www.sec.gov/newsroom/speeches-statements/atkins-remarks-regulation-crypto-assets-031726
52. Motley Fool: Robinhood US tokenized trading prediction. https://www.fool.com/investing/2026/09/21/prediction-robinhood-will-launch-tokenized-stock-trading-in-the-u-s-before-the-end-of-2027/
53. Open Banking Tracker: DriveWealth. https://www.openbankingtracker.com/embedded-finance/drivewealth ; Alpaca Broker API. https://alpaca.markets/broker
