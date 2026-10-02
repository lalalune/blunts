# 18: Tech stack, the web version, backend services, running costs and build plan

**Date:** 2026-09-28 | **Status:** Research memo, not legal advice. **[UNVERIFIED]** marks anything I couldn't confirm in a primary source during this pass. Citations like [PV1] point to the Sources list at the end.
**Builds on:** `04-us-stack-dinari-alpaca.md` (Dinari terms, $2k/month, required screens), `09-cash-app-rails.md` (Path A: Cash App USDC on Arbitrum), `10-plaid-bank-fallback.md` (zerohash both directions) and `12-gaps-and-profit-fee.md` (Apple 3.2.1(viii), "trade execution" risk). It doesn't repeat them.
**Prototype checked:** `prototype/index.html` is one ~420 KB file. The blunt tray is a **three.js (r128) WebGL scene** (`<canvas id="gl">`) with smoke, embers and flakes, plus a 2D `<canvas id="money">` counter and `navigator.vibrate` haptics.

---

## TL;DR

1. **Build one Expo (React Native) codebase with Expo Router, and ship iOS, Android and web from it.** Don't build a separate Next.js app, and don't wrap the prototype in Capacitor.
   - **Privy's Expo SDK is native-only.** Its install guide says "Web is not supported" [PV2]. On web you use Privy's React SDK instead. Both SDKs point at the same Privy app, so it's the **same user and the same wallet** on phone and browser. In practice that's one thin `auth.native.ts` / `auth.web.ts` split. Everything else is shared.
   - **Privy on Expo covers what we need:**
     - passkeys (via `react-native-passkeys`, needs a dev build and a domain file) [PV3];
     - native Sign in with Apple [PV4];
     - session signers (`useSigners().addSigners`) [PV6].
   - **Catch: Privy's one-line gas sponsorship (`sponsor: true`) runs only in the React (web) SDK and server SDKs.** On Expo you build the transaction in the app and relay it through your server [PV5]. That's fine, and we barely need it (point 4).
   - **Port the three.js tray as an Expo "DOM component".** Mark the file `'use dom'`. It runs in a WebView on phones and as plain DOM on web, so we reuse the prototype's WebGL code almost as-is [EX1]. Rewrite it natively with react-three-fiber or Skia only if it stutters on low-end Android.
2. **The web version should be the full app, not just marketing.** Same features, same login, same wallet.
   - **It's a hedge against Apple.** File 12 flagged Apple 3.2.1(viii) ("investing apps must come from the licensed institution"). The web app doesn't go through App Review. It lets us run a closed beta while App Review goes back and forth.
   - **It suits the Cash App flow on desktop.** Show the wallet address as a QR code and the user scans it in Cash App on their phone.
   - **Where web is weaker:**
     - push only works if the user installs the PWA to their home screen (iOS 16.4+) [WB1];
     - no vibration on iOS Safari;
     - more phishing and clone-site exposure.
   - **Apple Pay on web doesn't help.** No money flow in the plan uses a card.
   - **Gate by KYC address, not by IP.** Dinari's KYC address decides the state; IP is only a first check. NY users see the bank path only, because Cash App stablecoins exclude NY.
3. **The backend is small: one TypeScript API, one Postgres, and a few background workers.**
   - **Deposit watcher:** Alchemy Address Activity webhooks for USDC on Arbitrum, Ethereum and Polygon. Each webhook tracks up to 100k addresses and costs about 40 compute units per event, which is nearly free [AL2].
   - **Order orchestrator.** Dinari's self-custody flow is: the API creates a permit, **the user's wallet signs an EIP-712 permit (no gas)**, then Dinari submits the transaction and **pays the gas itself** (that's the $0.20 network fee) [DN1][DN2].
   - **Payout worker:** sells, then sends USDC to the user's saved Cash App address. Cheapest is a user-signed USDC `transferWithAuthorization` (EIP-3009) that our relayer submits for about $0.01 on Arbitrum [CR1]. Privy server-side gas sponsorship is the other option.
   - **Screening:**
     - Chainalysis' **free** sanctions API for wallet addresses [CH1];
     - a paid list for the **sanctions + PEP rescreen of every customer every 30 days** that Dinari requires [DN3]. OpenSanctions charges €0.10 a query [OS1].
   - **Also needed:** notifications, an admin/support console, and an append-only audit log.
   - **Hosting:** Fly or Render for the API and workers, Supabase or Neon for Postgres, EAS Hosting or Cloudflare for web.
4. **Fixed cost at launch is about $6.5k–$11k/month, all-in.** About $3k–4k of that is cash out the door each month. The rest is SOC 2, pen-test and insurance costs spread over the year. Dinari's **$2,000/month minimum** is the biggest single line.
   - **Variable cost is about $0.60–$2.00 per active user per month.** It's driven by Dinari's per-order fee ($0.20 flat, or actual gas if billed in arrears), Privy per-user pricing, the 30-day rescreen and market-data quotes.
   - **One-time costs:** KYC (Dinari "additional fees may apply" [UNVERIFIED]) and Plaid linking for bank users.
5. **Build plan: about 48 engineer-weeks to TestFlight / Play closed testing.** That's about **16–18 calendar weeks with 3 engineers**, or about 24 with 2.
   - **Add 3–6 weeks for store submission:** Dinari's UI approval, Apple review loops, and Google's financial-features declaration.
   - **Build the bank/zerohash fallback after the closed beta.** Launch non-NY Cash App first.

---

## 1. Framework: Expo vs. Next.js + React Native vs. Capacitor

### 1.1 What each vendor supports

| Need | Expo (React Native) | Web (React / Next.js / Expo web) | Capacitor (prototype in a WebView) |
|---|---|---|---|
| **Privy login + embedded wallet** | `@privy-io/expo`. Needs RN 0.81+ / Expo SDK 54+ and a **dev build (not Expo Go)**. "Web is not supported" [PV2] | `@privy-io/react-auth`, the main SDK | No Capacitor SDK. You'd run the React SDK inside WKWebView. Google OAuth blocks embedded webviews, and passkeys in WKWebView need extra entitlements **[UNVERIFIED that Privy supports this]** |
| **Passkeys** | Yes, via `react-native-passkeys`. Needs AASA + `assetlinks.json` on our domain, iOS 15+ [PV3] | Yes (WebAuthn) | Fragile |
| **Sign in with Apple** | Native sheet via `expo-apple-authentication`. Falls back to the web flow on Android [PV4] | OAuth web flow | Web flow only |
| **Gas sponsorship** | **No `sponsor: true` in the client.** "Build the transaction in your client, then relay it through your server" [PV5]. Needs TEE wallets | `sponsor: true` in React SDK [PV5] | Same as web |
| **Session signers (server acts on the wallet within a policy)** | `useSigners().addSigners({signerId, policyIds})` [PV6] | Same hook in React SDK | Same as web |
| **Dinari** | **No client SDK or UI kit.** The TypeScript SDK `@dinari/api-sdk` is **server-side** (API key + secret) [DN4]. KYC is a hosted `embed_url` we load in a WebView [DN5]. "Hosted Trading" is a white-label web app on `[PARTNER_ID].dinari-hosted.com` [DN6], which we won't use (it would replace our UI) | KYC `embed_url` in an iframe or redirect | Same as web |
| **Plaid Link** | `react-native-plaid-link-sdk`, Expo 52+ dev build [PL1]. **Probably not needed directly:** zerohash's SDK wraps Plaid in "reseller" mode (file 10) | `react-plaid-link` / Link web [PL2] | Needs Hosted Link + redirect handling |
| **zerohash** | Its SDK loads in a **WebView**, with messages via `onMessage`. No proxy server needed [ZH1] | `zh-web-sdk` [ZH2] | Works |
| **Animations** | Reanimated + Skia natively. three.js via **DOM component** (WebView) or `@react-three/fiber/native` + `expo-gl` [EX1][R3F1] | Canvas/WebGL; three.js as-is | three.js as-is (best fidelity, same WebView perf) |
| **OTA updates** | EAS Update (JS changes skip review) [EX3] | Deploy anytime | Capgo/Ionic Appflow |

### 1.2 The three options

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Expo universal app (iOS + Android + web)** | One codebase. First-class Privy, Plaid and Apple sign-in. EAS builds, submits and updates. Expo Router gives deep links and web URLs out of the box | Privy needs a web/native file split. Skia on web ships a ~2.9 MB gzipped WASM [SK1]. DOM components start slower than native views [EX1] | **Recommended** |
| **B. Next.js web + separate RN app** | Best SEO and marketing pages. Server rendering | Two UIs to build and keep in sync. Dinari approves "your product and UI" [DN3], so two UIs means two approval surfaces | Only if web becomes a big acquisition channel. Use a static marketing site instead |
| **C. Capacitor around the prototype** | Fastest demo | Privy has no Capacitor SDK. OAuth/passkeys in WebViews break. Apple 4.2 ("minimum functionality") risk on top of 3.2.1(viii). Poor native feel | **No** |

### 1.3 Recommendation

- **Monorepo:** `apps/app` (Expo Router, iOS + Android + web), `apps/api` (Node/TypeScript), `packages/core` (blunt math, types, Zod schemas, shared with the server).
- **Privy:** `lib/privy.native.tsx` wraps `@privy-io/expo`, and `lib/privy.web.tsx` wraps `@privy-io/react-auth`. Both expose the same `useBluntsAuth()` hook: `login`, `signTypedData`, `address`, `addSigner`.
  - Login methods: email OTP, SMS, Apple, Google and passkeys.
  - Offer Sign in with Apple anywhere Google is offered. Guideline 4.8 requires an equivalent privacy-preserving login [AP1].
- **Animations:**
  - **Tray (three.js):** move the prototype's scene into `components/Tray.dom.tsx` with `'use dom'`. Props (fill %, blunts count) and async native actions (haptic, sound) cross the bridge [EX1].
  - **Money counter, flakes and particles:** Reanimated + Skia on native. On web, either lazy-load Skia (`WithSkiaWeb`) or keep these inside the DOM component too.
  - **Haptics:** `expo-haptics` on native. None on iOS Safari (it doesn't support `navigator.vibrate`) **[UNVERIFIED current status; widely documented]**.
- **Verify early:** the DOM-component docs list OTA updates among limitations [EX1]. Confirm DOM component code ships with EAS Update in SDK 54+ **[UNVERIFIED]**. If not, tray changes need a store build.

---

## 2. The web version

### 2.1 What's the same, what differs

| Feature | Native | Web | Notes |
|---|---|---|---|
| Privy login, wallet | Expo SDK | React SDK | Same Privy app ID means same user and wallet on both |
| Passkeys | Platform passkey (iCloud Keychain / Google Password Manager) | WebAuthn | Passkeys are bound to our domain (RP ID), so a passkey made on the phone works on the web app if RP ID = `blunts.com` **[UNVERIFIED Privy RP config; test]** |
| Dinari KYC | `embed_url` in WebView; needs camera permission for ID photos **[UNVERIFIED: Persona-in-WebView camera config]** | iframe or new tab | Desktop users may get handed off to phone for selfie capture |
| Pre-trade NBBO screen | Same component | Same | Must refresh every 15s [DN3] |
| **Cash App fill** | "Copy address" + "Open Cash App" | **Desktop: QR of the wallet address**, scanned in Cash App. Mobile web: same as native | No Cash App deep link prefills a USDC send (file 09) |
| Cash App spark | Same (server side) | Same | |
| Bank fallback | zerohash SDK in WebView | `zh-web-sdk` | Plaid runs inside zerohash's flow |
| Push | APNs/FCM via Expo push, free | **Web push only if installed to home screen on iOS 16.4+** [WB1]. Email is the real fallback | |
| Haptics | Yes | No on iOS | |
| Tray animation | DOM component (WebView) | Native WebGL, often *smoother* | |
| Updates | Store review for native changes; EAS Update for JS | Instant | |
| App Store rules | 3.2.1(viii), 5.1.1(ix), 4.8 apply | **None** | Dinari's UI approval and FINRA 2210 marketing review apply to both |

### 2.2 Full app or marketing + account site?

**Full-featured, at parity with native, from day one.** It's the same codebase, so the extra cost is small: web QA plus the QR fill screen. Reasons:

1. **The Apple hedge.** If App Review holds the app under 3.2.1(viii) (file 12 §4), the web app is how beta users get in. Ship web plus Android closed testing first if needed.
2. **The desktop Cash App flow is actually nicer.** Scan a QR on the laptop screen instead of copy-pasting between apps.
3. **Account tasks people expect on a computer:** tax documents (Dinari 1099s), statements, closing the account, support.

**Keep the marketing site separate:** a static page on `blunts.com`, with the app at `app.blunts.com`. It gets its own FINRA 2210 pre-approval via Dinari (file 04). Keeping it apart keeps SEO pages away from the wallet origin.

**Web-specific safeguards:**
- a strict CSP;
- no third-party scripts on `app.` (analytics server-side only);
- Privy's iframe isolates keys **[UNVERIFIED current architecture detail]**;
- a phishing-reporting plan;
- passkeys first, which resist phishing better than OTP.

### 2.3 Geo and state gating

- **Source of truth is the Dinari KYC residential address.** Store `state` on the user row and derive `rails_allowed` from it.
- **NY:** hide the Cash App fill and spark. Show bank via zerohash, which holds an NY BitLicense (file 10). Or waitlist NY until the bank rail ships.
- **Signup check:** an IP-country check via free Cloudflare `CF-IPCountry` / Vercel geo headers. Block sanctioned regions, and show "US only" to other non-US visitors. Don't rely on IP alone (VPNs).
- **Native:** no location permission. It adds App Review questions for little benefit.
- **Dinari** has broker-dealer registrations covering all states including NY (file 04 §1.10), so state gating is driven by the **rails**, not Dinari.

---

## 3. Backend

### 3.1 Service map

```
Expo app (iOS/Android/web) ──Privy JWT──▶ API (Node/TS: Hono or Fastify)
                                          │  Dinari SDK (server key)  ──▶ Dinari API v2
                                          │  Privy Node SDK (authorization key in KMS) ──▶ Privy
                                          ▼
                                     Postgres (users, wallets, deposits, orders,
                                               payouts, ledger, audit_log, jobs)
                                          ▲
   Alchemy webhooks (Arb/Eth/Polygon) ──▶ Deposit watcher ─┐
   Dinari order status (poll/push)   ──▶ Order orchestrator ├─ workers on a Postgres
   zerohash webhooks                 ──▶ Bank worker        │  job queue (pg-boss /
   Cron                              ──▶ Rescreen, recon ───┘  Graphile Worker)
                                          │
                                          ├─▶ Chainalysis free API / OpenSanctions
                                          ├─▶ Expo Push, Postmark/Resend email, web push
                                          └─▶ Admin console (Retool or internal) + Sentry/logs
```

### 3.2 Each component

| Component | What it does | Key details from docs |
|---|---|---|
| **API server** | Verifies Privy JWTs and holds all partner keys (Dinari, zerohash, Alchemy). Exposes Blunts-shaped endpoints: `/fill/quote`, `/order/permit`, `/order/submit`, `/spark`, `/payout-address` | The Dinari SDK needs an API key ID + secret, so it's server-only [DN4] |
| **Postgres** | Users, Dinari entity/account IDs, wallet addresses, deposits, orders, payouts, a double-entry "display ledger" (blunt math), append-only `audit_log` | Encrypt PII with AES-256 at rest and TLS 1.2+ in transit [DN3] |
| **Deposit watcher** | Alchemy **Address Activity** webhooks, one per chain (Arbitrum, Ethereum, Polygon), filtered to USDC contract transfers. Steps: verify the HMAC signature → dedupe by tx hash + log index → wait for confirmations → **screen the sender** → mark the deposit → trigger the "ready to buy" state | Max **100,000 addresses per webhook**; add in batches of 500; ~**40 CU per event** [AL2]. Free plan: 30M CU/month, 5 webhooks [AL1]. Run a nightly RPC balance reconcile as a backstop |
| **Wrong-network handling** | A Privy EOA has **the same address on every EVM chain**, so USDC sent on Ethereum or Polygon isn't lost. It sits in the user's own wallet on that chain. Offer "Move to Arbitrum" (CCTP, user-signed, gas sponsored) or "Send back to Cash App" | Ethereum gas makes small recoveries costly; show the fee |
| **Order orchestrator** | State machine: `quoted → permit_created → user_signed → submitted → filled / failed / cancelled` | **Dinari EIP-155 flow** [DN1][DN2]: (1) `eip155.createPermit({chain_id, order_side, order_type, payment_token, payment_token_quantity, stock_id, fee?, client_order_id})` returns `order_request_id` + `permit` typed data; (2) the **user's wallet signs the EIP-712 permit** (off-chain, free); (3) `createEip155OrderRequest` → **Dinari submits and pays gas** ("Dinari-sponsored / proxied"). So **buys and sells need no Privy gas sponsorship** |
| (auto-buy) | Buying automatically when a deposit lands needs a **Privy session signer** with a policy limited to Dinari's order contract / USDC permit | Technically easy [PV6]. **Legally open:** Dinari bars partners from "trade execution" [DN3]. Get written sign-off from Dinari before any server-signed order (file 12). Launch with a one-tap "Light it" signature |
| **Order fees** | Dinari network fee **$0.20/order flat, or actual gas billed monthly in arrears**. Optional partner `fee` field added to `payment_amount` [DN7] | Who legally charges the `fee` for US users is still open (files 04, 12) |
| **Market data** | NBBO on the pre-trade screen, refreshed ≤15s [DN3] | $0.0075 per SIP quote, no caching (file 04) |
| **Payout worker** | Spark: SELL permit (user-signed) → USDC lands in the wallet → send USDC to the saved Cash App Arbitrum address. Also: $1 test payout when the address is saved; queue above Cash App's $10k/week receive limit | **Option 1:** user signs a USDC **EIP-3009 `transferWithAuthorization`**; our relayer hot wallet submits it (~$0.01 on Arbitrum). Works identically on Expo and web, no Privy sponsorship needed [CR1]. **Option 2:** Privy REST `sponsor: true` from server (gas + a "convenience fee" [PV7], % **[UNVERIFIED]**; needs TEE wallets [PV5]). Check with Dinari that an EIP-7702-upgraded wallet is still acceptable (file 04 §1.9) |
| **Screening** | (a) **Wallet addresses:** every deposit source and every payout destination → Chainalysis free sanctions API [CH1]. (b) **Customers:** sanctions + **PEP every 30 days**, with evidence kept [DN3] → OpenSanctions pay-as-you-go €0.10/query [OS1], or ComplyAdvantage/Persona **[UNVERIFIED pricing]** | The Chainalysis free API returns only yes/no. It gives no risk score and doesn't cover the UK list [CH2]. Fine for OFAC at launch; move to TRM/Chainalysis KYT when volume justifies it |
| **Dinari event push** | Dinari requires "real-time data push of all customer onboarding and transactional events" [DN3] | Format not documented. Ask Dinari |
| **Notifications** | Expo Push (free), email (Postmark/Resend), web push (installed PWA only) | "Your $25 landed", "QQQ bought", "Sent to Cash App" |
| **Admin / support** | Look up a user by email/wallet, timeline of deposits/orders/payouts, trigger rescreen, freeze, **two-person approval** for anything that moves money, Dinari data requests (answer ≤2 business days) [DN3] | Retool (fast) or an internal route in the API. Support inbox via Plain or Intercom |
| **Audit log** | Append-only table (no UPDATE/DELETE grants) + shipped to a log store with retention. Every consent checkbox, disclosure version, permit signature and admin action | Dinari runs quarterly audits of consent capture (file 04) |
| **Secrets** | Privy authorization key, Dinari keys, relayer hot-wallet key in AWS KMS / GCP KMS or 1Password Secrets | Keep the relayer wallet low-balance and ETH-only (for gas) |

### 3.3 Hosting

| Layer | Launch pick | Why | Cost/month |
|---|---|---|---|
| API + workers | **Fly.io or Render** (2 small instances + 1 worker) | Long-running workers and webhooks; Vercel functions are a poor fit for queues | ~$50–150 **[approx; list prices not fetched]** |
| Postgres | **Supabase Pro ($25)** or Neon; Supabase **Team ($599)** if you need its SOC 2 report for our audit [SB1] | Managed backups, point-in-time recovery | $25–599 |
| Web app | EAS Hosting (Cloudflare Workers) [EX4] or Cloudflare Pages | `npx expo export -p web` → `eas deploy` | $0–20 |
| Builds / OTA | EAS Starter $19 or Production $199 [EX3] | 15 free builds/platform on Free | $19–199 |
| Errors/logs | Sentry + Better Stack/Axiom | | ~$50–100 **[approx]** |

---

## 4. Monthly cost at launch

### 4.1 Fixed (first ~1,000 users)

| Item | Monthly | Basis |
|---|---|---|
| **Dinari API access** | **$2,000** | "starts at $2,000 per month" [DN7] |
| Dinari managed KYC | per check, not fixed | "Additional fees may apply" [DN5] **[UNVERIFIED amount]** |
| **Privy** | $0 (<500 MAU) → **$299** (500–2,499) → **$499** (2,500–9,999) | Pricing page [PV8]. Includes 50k signatures. Gas sponsorship billed separately (prepaid credits) |
| Plaid | $0 direct if zerohash resells it (file 10) | Pass-through **[UNVERIFIED]** |
| **zerohash** | **[UNVERIFIED]**, enterprise contract, likely a monthly minimum. Plus an **ACH loss reserve** (capital, not expense; e.g. $10–25k) | file 10. Defer until the bank rail ships |
| Alchemy | $0 on Free (30M CU, 5 webhooks) → PAYG $0.525 per 1M CU [AL1] | ~40 CU/event, so 30M CU is ~750k webhook events |
| API/workers hosting | $50–150 | §3.3 |
| Postgres | $25 (Supabase Pro) – $599 (Team) | [SB1] |
| EAS | $19–199 | [EX3] |
| Errors, logs, uptime | $50–100 | **[approx]** |
| Email (Postmark/Resend) | $15–20 | **[approx]** |
| Support inbox | $30–100 | **[approx]** |
| Admin tool (Retool) | $0–50 | **[approx]** |
| Sanctions/PEP rescreen | ~€0.10 × users/month (≈$110 at 1,000 users) | [OS1] |
| Apple Developer Program | $8.25 ($99/yr) | Enroll as an **organization** (needs D-U-N-S) |
| Google Play | $25 once | Use an **organization** account. Google's 12-tester/14-day rule applies to new personal accounts **[UNVERIFIED current scope]** |
| **SOC 2 tooling** | **$625–850** | Vanta ~$10k/yr, Drata/Secureframe ~$7.5k/yr entry [SC1] |
| SOC 2 audit | $850–4,200 | $10–50k/yr, separate from tooling [SC1]. Ask Dinari whether their annual **security questionnaire** is enough for year 1 [DN3] |
| **Pen test (annual, required)** | $700–2,100 | $8–25k for web + API + mobile [PT1] |
| Insurance (cyber, tech E&O, D&O) | $600–2,000 | Seed tech programs $5–15k/yr; fintech/crypto pays more [IN1] **[UNVERIFIED for this risk profile]** |
| **Total cash out, excluding compliance** | **≈ $2,300–3,500** | |
| **Total including SOC 2, pen test and insurance, averaged monthly** | **≈ $5,000–11,000** | Most likely ~$7–8k with Drata + questionnaire in year 1 |

Not included: securities counsel, the FINRA 2210 marketing review cost (if Dinari charges for it), salaries, and the zerohash minimum.

### 4.2 Variable per user

Assumption: an active user does 4 fills + 1 spark a month on the Cash App path.

| Item | Per unit | Per active user/month |
|---|---|---|
| Dinari network fee | $0.20/order flat, or actual gas in arrears (~$0.01–0.05 on Arbitrum **[UNVERIFIED]**) [DN7] | $1.00 flat / ~$0.05–0.25 arrears |
| NBBO market data | $0.0075/quote, ~1–4 quotes per pre-trade screen | ~$0.04–0.15 |
| Privy | step pricing; about $0.12–0.60/MAU inside tiers; $0.05/MAU + $0.01/signature above 10k MAU on PAYG [PV8] | $0.12–0.60 |
| Payout gas (EIP-3009 relay) | ~$0.01–0.03 on Arbitrum **[UNVERIFIED current gas]** | ~$0.02 |
| Sanctions/PEP rescreen | €0.10/user/30 days [OS1] | ~$0.11 |
| Wallet screening | Chainalysis free API [CH1] | $0 |
| Alchemy | ~40 CU/event at $0.525/1M CU | <$0.001 |
| Push, email | | ~$0.01 |
| **Total** | | **≈ $0.35–0.75 (arrears billing) to ≈ $1.30–1.90 (flat $0.20)** |

**One-time per user:** Dinari KYC **[UNVERIFIED; likely $1–3 by analogy with Persona]**. Bank users also pay the Plaid link cost (~$0.50–1.50) and zerohash per-transaction costs from file 10 (a $25 bank fill costs ~$0.50–1.20).

**The takeaway:** fixed cost dominates for a long time. At ~$7.5k/month fixed, 1,000 active users cost ~$8.5k/month all-in (about $8.50 each). Negotiating **billing in arrears** with Dinari cuts the biggest variable line by 75–95%.

---

## 5. Build plan

**Team:** 3 engineers = 2 app/full-stack (Expo + web) + 1 backend/infra/security. Plus a part-time designer and the founder on partner calls. Engineer-weeks (ew) include tests.

| # | Milestone | ew | Depends on | Done when |
|---|---|---|---|---|
| 0 | **Partner gates (non-eng, start day 1):** Dinari partner agreement + US supplement, sandbox keys, SOC 2 plan (Drata/Vanta) or confirmation that the questionnaire is OK; written answers on auto-buy, `fee`, EIP-7702 wallets, event push | — | — | Sandbox keys in hand |
| 1 | **Foundations:** monorepo, Expo Router app (iOS/Android/web), API skeleton, Postgres schema + migrations, job queue, CI, EAS profiles, Sentry, secrets in KMS | 3 | — | Hello-world on TestFlight, Play internal track and `app.` domain |
| 2 | **Auth + wallet:** Privy native/web split; email OTP, Apple, Google, passkeys (AASA + assetlinks); embedded wallet created at signup; JWT verification on API | 4 | 1 | Same user/wallet on phone and browser |
| 3 | **Onboarding + KYC:** Dinari entity/account, `embed_url` KYC in WebView/iframe, 6 checkboxes + verbatim disclosures + non-professional attestation + trusted contact, wallet link (nonce signature), state gating, consent versions in audit log | 4 | 2 | Sandbox account "KYC approved" end to end |
| 4 | **Deposit watcher:** Alchemy webhooks ×3 chains, address registry sync, confirmations, Chainalysis screen, deposit states, wrong-network recovery, nightly reconcile | 4 | 1 | Faucet/testnet USDC shows as "landed" in <1 min |
| 5 | **Order orchestrator:** NBBO quote screen, permit create → user sign → proxied submit, status polling, idempotent `client_order_id`, failure/cancel states, positions sync, blunt math on real fills | 5 | 3, 4 | Sandbox buy and sell of dQQQ from the app |
| 6 | **Payouts (spark):** save Cash App address + $1 test send, SELL → EIP-3009 relay (or Privy server sponsorship), weekly limit queue, destination screening | 3 | 5 | Sandbox spark lands at a test address |
| 7 | **UI port of the prototype:** all screens in RN; three.js tray as a DOM component; Skia/Reanimated money counter and flakes; haptics; perf pass on a low-end Android | 7 | 2 (parallel) | 60fps on iPhone 12, ≥30fps on a ~$150 Android **[target]** |
| 8 | **Web specifics:** desktop QR fill, PWA manifest + web push, CSP, responsive layout | 2 | 7 | Web closed beta ready |
| 9 | **Admin, support, audit:** Retool/internal console, two-person approvals, 30-day rescreen cron, Dinari event push, data-request export | 4 | 3–6 | Support can answer "where's my money" in <2 min |
| 10 | **Notifications:** Expo push, email templates, web push | 1.5 | 4–6 | |
| 11 | **Security + compliance:** threat model, rate limits, device/session management, logging, SOC 2 controls in Drata/Vanta, **external pen test** + fixes | 4 (+ vendor) | 1–9 | Pen-test report with no open highs |
| 12 | **QA + closed beta:** device matrix, sandbox → production keys, Dinari UI approval, real-money tests with small amounts | 3.5 | all | **TestFlight external + Play closed testing live** |
| — | **Subtotal to TestFlight / closed testing** | **≈ 48 ew** | | **≈ 16–18 weeks with 3 engineers** (the critical path is 2 → 3 → 5 → 6 → 12, with Dinari production approval in parallel); **≈ 24–26 weeks with 2** |
| 13 | **Store submission:** App Review notes, Dinari authorization letter + BD license references (3.2.1(viii)), privacy nutrition labels, Play financial-features declaration, demo account, expect 1–3 review loops | 2 | 12 | Approved |
| 14 | **Bank fallback (post-beta):** zerohash agreement, SDK in WebView/web, ACH states, loss-reserve limits, RTP payouts, NY enablement | 5 | 12 + contract | NY users can fill/spark via bank |

**Order of release:**
1. Web + Android closed beta (non-NY, Cash App only).
2. iOS TestFlight.
3. Store submissions.
4. Bank/NY.

The calendar risk sits with the **partners, not the code**: Dinari production approval and UI sign-off, SOC 2 or the questionnaire, and Apple 3.2.1(viii). Start all three in week 1.

---

## 6. Open questions to send partners

1. **Dinari:**
   - May a Privy session signer, under a policy, sign order permits after a deposit (auto-buy)?
   - Is an EIP-7702-upgraded Privy EOA acceptable?
   - What's the event-push format?
   - What's the managed KYC fee?
   - Can we use billing in arrears from day 1?
   - Is the questionnaire acceptable instead of SOC 2 in year 1?
2. **Privy:**
   - What's the convenience fee for gas sponsorship?
   - Can one passkey RP ID span the native app and `app.blunts.com`?
   - Is there an enterprise price for ~$0.001/signature?
3. **zerohash:** What are the minimums, the reserve size, and is Arbitrum USDC withdrawal live for retail (file 10)?
4. **Expo:** Do DOM components update via EAS Update on SDK 54+?

---

## Sources

**Privy**
- [PV1] Docs index: https://docs.privy.io/llms.txt
- [PV2] Expo SDK installation (RN 0.81+/Expo 54+, dev build, "Web is not supported"): https://docs.privy.io/basics/react-native/installation
- [PV3] Expo passkeys setup (react-native-passkeys, AASA, assetlinks, iOS 15+): https://docs.privy.io/basics/react-native/advanced/setup-passkeys
- [PV4] Expo Sign in with Apple (native `expo-apple-authentication`, Android web fallback): https://docs.privy.io/basics/react-native/advanced/setup-apple-login
- [PV5] Native gas sponsorship setup (`sponsor: true` in React + server SDKs only; relay via server for React Native; TEE required): https://docs.privy.io/wallets/gas-and-asset-management/gas/setup
- [PV6] Signers quickstart (`useSigners`/`addSigners` in React and Expo, policies, authorization keys): https://docs.privy.io/wallets/using-wallets/signers/quickstart ; server-side access: https://docs.privy.io/wallets/wallets/server-side-access
- [PV7] Gas sponsorship overview (EIP-7702 upgrade, Arbitrum supported, "gas cost plus a convenience fee"): https://docs.privy.io/wallets/gas-and-asset-management/gas/overview
- [PV8] Pricing (Core free 0–499 MAU; $299 500–2,499; $499 2,500–9,999; PAYG $2,000 base + $0.05/MAU >10k + $0.01/signature >50k): https://www.privy.io/pricing

**Dinari**
- [DN1] Placing orders (managed vs EIP-155; `createPermit` → sign → `createEip155OrderRequest`, "Dinari covers gas costs"): https://docs.dinari.com/docs/placing-orders
- [DN2] Create EIP-155 order request permit (fields, `permit`, `fee`, US = USDC): https://docs.dinari.com/reference/createeip155orderrequestpermit ; smart-wallet guide (ERC-1271 caveat): https://docs.dinari.com/docs/placing-dshare-orders-with-alchemy
- [DN3] US customers guide (dedicated wallets, no trade execution by partners, NBBO fields every 15s, SOC 2/ISO or questionnaire, annual pen test, OFAC on inbound funding, sanctions+PEP every 30 days, real-time event push, UI approval): https://docs.dinari.com/docs/us
- [DN4] TypeScript SDK `@dinari/api-sdk` (server-side, API key + secret): https://context7.com/dinaricrypto/dinari-api-sdk-typescript ; https://github.com/dinaricrypto ; quickstart: https://docs.dinari.com/docs/quickstart
- [DN5] Managed KYC (`embed_url`, mobile + desktop, "additional fees may apply"): https://docs.dinari.com/docs/managing-kyc
- [DN6] Hosted Trading (white-label hosted/self-hosted web UI): https://docs.dinari.com/docs/hosted-trading
- [DN7] Fees ($2,000/month API, $0.20/order or billing in arrears, `fee` field): https://docs.dinari.com/docs/fees
- Wallet linking (nonce → sign → connect): https://docs.dinari.com/docs/managing-wallets

**Expo / React Native**
- [EX1] DOM components (`'use dom'`, WebView on native, DOM on web, WebGL support, limitations): https://docs.expo.dev/guides/dom-components/
- [EX3] EAS pricing (Free/Starter $19/Production $199; builds; update MAUs): https://expo.dev/pricing
- [EX4] EAS Hosting / publishing web: https://docs.expo.dev/eas/hosting/introduction/ ; https://docs.expo.dev/deploy/web/
- [SK1] React Native Skia web support and bundle size (CanvasKit ~2.9 MB gzipped): https://shopify.github.io/react-native-skia/docs/getting-started/web/ ; https://shopify.github.io/react-native-skia/docs/getting-started/bundle-size/
- [R3F1] react-three-fiber installation (native via expo-gl): https://r3f.docs.pmnd.rs/getting-started/installation ; expo-three: https://github.com/expo/expo-three

**Plaid / zerohash**
- [PL1] Plaid React Native SDK (Expo 52+ dev build, not Expo Go): https://plaid.com/docs/link/react-native/
- [PL2] Plaid Link web: https://plaid.com/docs/link/web/
- [ZH1] zerohash SDK in React Native (WebView + `onMessage`): https://docs.zerohash.com/reference/sdk-integration-with-mobile-apps-react-native ; SDK overview: https://docs.zerohash.com/docs/sdk
- [ZH2] zh-web-sdk: https://www.npmjs.com/package/zh-web-sdk

**Chain infrastructure and screening**
- [AL1] Alchemy pricing (Free 30M CU / 5 webhooks; PAYG $0.525/1M CU, 100 webhooks): https://www.alchemy.com/pricing
- [AL2] Address Activity webhook (100k addresses/webhook, 500 per update; ~40 CU per event): https://www.alchemy.com/docs/reference/address-activity-webhook ; https://www.alchemy.com/support/how-do-i-manage-and-add-more-addresses-to-a-webhook
- [CR1] USDC authorization options incl. EIP-3009 `transferWithAuthorization`: https://www.circle.com/blog/four-ways-to-authorize-usdc-smart-contract-interactions-with-circle-sdk
- [CH1] Chainalysis free sanctions API (`GET public.chainalysis.com/api/v1/address/:address`): https://auth-developers.chainalysis.com/sanctions-screening/api-reference/reference/check-if-an-address-is-sanctioned ; https://www.chainalysis.com/blog/sanctions-screening-tools/
- [CH2] Limits of the free oracle/API (boolean only, no UK list): https://chainscreen.io/tools/chainalysis-oracle-limitations
- [OS1] OpenSanctions screening API (€0.10/query, 30-day trial): https://www.opensanctions.org/api/

**Hosting, compliance, insurance, Apple, web**
- [SB1] Supabase pricing (Pro $25; Team $599 incl. SOC 2 report access), secondary: https://costbench.com/software/database-as-service/supabase/ ; https://supabase.com/security
- [SC1] SOC 2 tooling prices (Vanta ~$10k/yr, Drata/Secureframe from ~$7.5k/yr; audits $10–50k), secondary: https://www.secureleap.tech/blog/vanta-vs-drata ; https://sprinto.com/blog/secureframe-vs-vanta-vs-drata/
- [PT1] Pen-test pricing 2026 (SOC 2 scope $8–25k; mobile $5–30k), secondary: https://www.blazeinfosec.com/post/how-much-does-penetration-testing-cost/ ; https://www.secureleap.tech/blog/penetration-testing-cost-startup-pricing
- [IN1] Startup insurance costs 2026 (D&O $3.5–6k; cyber median ~$3k; E&O median $3.7k; programs $5–15k), secondary: https://www.vouch.us/blog/startup-insurance-costs ; https://anvo-insurance.com/blog/tech-saas-insurance-cost-2026/
- [AP1] App Review Guidelines (4.8 login services; 3.2.1(viii); 5.1.1(ix)): https://developer.apple.com/app-store/review/guidelines/
- [WB1] iOS web push requires home-screen install (iOS 16.4+): https://documentation.onesignal.com/docs/en/web-push-for-ios ; https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
