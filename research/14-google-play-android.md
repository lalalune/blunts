# 14: Google Play and Android: getting Blunts approved and built right

**Date:** 2026-09-28 | **Status:** Research memo, not legal advice. **[UNVERIFIED]** marks anything I couldn't confirm in a primary source during this pass. Citations like [G1] point to the Sources list at the end. Most Google policy text was pulled as raw HTML from support.google.com on 2026-09-28.
**Builds on:** `04-us-stack-dinari-alpaca.md` §B.3 (Google Play fees) and `12-gaps-and-profit-fee.md` item 30 (Play checklist) and item 3 (who places the order). This memo verifies those, corrects two points and goes deeper.

---

## TL;DR

1. **Google does not require Blunts to be the licensed broker-dealer.** This is the biggest difference from Apple 3.2.1(viii).
   - Play's Financial Services policy has **no US rule for stock-trading apps**. The only country with a stock-trading developer-licence rule is India (SEBI) [G1][G5].
   - It does require that Google "be able to establish a connection between your developer account and any provided licenses" and may ask for documents [G1]. So have the Dinari partner agreement and Dinari Securities' FINRA/CRD details ready to upload **[UNVERIFIED whether Play will actually ask for them]**.
   - You **must use an Organization developer account** (D-U-N-S number required, and getting one can take up to 30 days). Google names "stock trading" and "cryptocurrency software wallets" as services that need an organization account [G8][G9].
2. **The crypto wallet licensing rule (FinCEN MSB + state money transmitter, or a bank charter) applies only to custodial wallets and exchanges.** Google says "Non-custodial wallets are out of scope" [G4]. The policy has been in force since 2025-10-29 [G21].
   - Google doesn't define "custodial". A **Privy embedded wallet where the user holds authority, and a Blunts server signer is narrowly scoped and revocable, should count as non-custodial.**
   - A **server signer that can move funds on its own** makes that claim weaker. This is the same "total independent control" issue as file 12 item 3.
   - Declare it honestly in the Financial features declaration: **Stock trading and portfolio management**, **Cryptocurrency wallet** (non-custodial) and **Tokenized digital asset** [G3][G2].
3. **Google Play Billing is not used for deposits, trades or brokerage fees.** Google's own FAQ says "stock trades, investment consulting" purchases "should not use Google Play's billing system" [G7]. This corrects file 04 §B.3, which said there was no securities carve-out.
   - Google Payments also bans "stock brokerage" and "stocks, bonds, or related financial products" as payment categories [G15]. So a fee that **waives spark fees** can't be put through Play Billing either.
4. **Fees if the founder wants to "cut Google in."** The only clean option is an optional **digital-only subscription** (cosmetics, stats, content, with no trading or fee perks) sold through Play Billing.
   - For a new app under $1M/yr, that's **10% service fee + 5% billing fee = 15%** [G11].
   - Google's US alternative billing and external-link programs charge **10% on subscriptions** and **20%** (new installs, over $1M) **on one-time purchases**. Fees are due from **2026-10-01** for alternative billing, and the external-links deadline was pushed to **2026-12-01** [G10][G12][G13]. This replaces the "[UNVERIFIED 20–25%/10%]" figures in file 04.
5. **Epic v. Google status:** Epic and Google settled on 2026-03-04, but Judge Donato didn't approve their revised injunction, and the **parties withdrew that motion on 2026-07-14** [G14][G22].
   - The original October 2024 injunction still applies in the US. Google can't *require* Play Billing, and links out are allowed.
   - Google launched its lower-fee structure worldwide anyway on 2026-06-30 (US/UK/EEA) [G11].
6. **Google Pay is a merchant's tool, not Blunts'.** The Google Pay API is barred for financial services unless the merchant is licensed, and it bans a "substitute merchant of record" [G16].
   - So Blunts can't take Google Pay itself. A **regulated on-ramp** (e.g., MoonPay, which offers Google Pay) or Dinari could, **as merchant of record** [G16][G27].
7. **Weed imagery is fine; weed sales are not.** Play bans apps that "facilitate the sale of marijuana … regardless of legality" [G17]. Slang and a subtle leaf motif aren't a sale.
   - Answer the IARC rating questionnaire honestly (drug *references* can lift the rating). Set the target audience to **18+**.
   - The bigger drug-imagery risk is **Google Ads** ("recreational drugs" policy) [G19], not Play.
8. **Android build basics:**
   - Target **API 36** (the 2026-08-31 rule; extension to 2026-11-01) [G23].
   - Open Cash App with **`https://cash.app/...` App Links**. Cash App's `assetlinks.json` verifies `com.squareup.cash` [G25].
   - Declare `<queries>` for the package check [G26].
   - Use passkeys through Credential Manager (Android 9+) with `get_login_creds` in *your* `assetlinks.json` [G28][G29].
   - Use Play Integrity (10k calls/day by default) [G30].
   - The **12-testers / 14-days closed test applies only to personal accounts**, so Blunts' organization account is exempt [G24].

---

## 1. Financial Services policy and the Financial features declaration

### 1.1 What the policy actually says (US-relevant parts) [G1]

| Rule | Text (quoted or close) | Effect on Blunts |
|---|---|---|
| Scope | Financial products are "those related to the management or investment of money and cryptocurrencies, including personalized advice" | In scope |
| Local law | "Comply with state and local regulations … include specific disclosures required by local law" | FINRA 2210 and Reg BI style disclosures ("Securities offered by Dinari Securities LLC, member FINRA/SIPC") in the listing and in the app **[counsel to confirm wording]** |
| Declaration | "Any app that contains any financial features must complete the Financial features declaration" | Mandatory. Even apps with no financial features must fill it in [G3] |
| Licences link | "We must be able to establish a connection between your developer account and any provided licenses or documentation" | This sits under the Loans section, but it's how Google reviews financial apps generally. Keep the Dinari agreement ready |
| Binary options | Banned | N/A |
| Personal loans (US) | APR under 36% | N/A. Don't add a "float/advance" feature without re-reading this |
| Stock trading | **No US-specific rule.** Only India has one (SEBI registration, "SEBI-verified" badge) [G5] | **Partner (introducing) apps aren't barred in the US** |

**Developer vs partner licensing.** Where Google does require licences (loans in India, Kenya and elsewhere), it explicitly lets a platform "only providing a platform to facilitate" a licensed partner declare that and upload the **partner's** licence [G1]. There's no equivalent US stock rule, so in practice Google accepts introducing-partner apps. Examples include the wallets that embed Dinari, such as Bitcoin.com **[UNVERIFIED that Bitcoin.com's Android build lists dShares]**.

**Contrast with Apple.** Apple 3.2.1(viii) says trading apps "should be submitted by the financial institution". Google has no such line. **Android may be the easier first launch.**

### 1.2 The Financial features declaration form [G3]

- **Where:** Play Console → Policy and programs → App content → Financial features → Start.
- **Who:** every app on any track, including closed testing.
- **Boxes Blunts should tick** (the list is from [G3]):

| Section | Tick | Why |
|---|---|---|
| Trading and funds | **Stock trading and portfolio management** | Buys and sells tokenized QQQ through a FINRA BD |
| Trading and funds | **Cryptocurrency wallet** | Privy wallet holds USDC and dShares. Say it's **non-custodial** where the form allows **[UNVERIFIED whether the form has a custodial/non-custodial toggle; press reports say you declare "exchange" and/or "wallet"]** [G21] |
| Trading and funds | **Tokenized digital asset (NFT) sales, trading, and awards** | dShares are "tokenized digital assets secured on a blockchain", so the Blockchain policy requires this declaration [G2] |
| Payments and transfers | Probably **not** "Money transfer". Consider "Mobile payments and digital wallets" | Blunts doesn't move money person-to-person. Over-declaring might trigger country forms. **[judgment call]** |
| Support services | Only tick **Financial advice** if Blunts actually recommends (see file 06/12) | Ticking it signals adviser status |
| Trading and funds | Don't tick **Cryptocurrency exchange** | Blunts doesn't run an order book or swap. Dinari mints and burns, and an on-ramp (if any) is the exchange |

- **Documents:** the form asks for uploads only for loan features and for countries on the crypto list [G3][G4]. **For the US, a crypto-wallet tick shows a US form asking for FinCEN MSB and state licence details** [G4]. If Blunts claims non-custodial, be ready to explain the Privy architecture in writing **[UNVERIFIED exact form flow]**.
- **Country targeting:** release in the **United States only**. Picking other countries is "an affirmative choice" that triggers their licence rules [G4]. Play can't block individual US states, so **exclude NY in-app**. Cash App stablecoins aren't available in NY (file 09) [G6].

### 1.3 Blockchain-based Content policy [G2]

- "The purchase, holding, or exchange of cryptocurrencies should be conducted through **certified services in regulated jurisdictions**." USDC comes from Cash App (licensed) and dShares from Dinari (a BD), so this is met.
- **Transparency rule:** "If your app sells or enables users to earn Tokenized Digital Assets, you must declare this." If an in-app product represents one, flag it. That's not relevant, since Blunts sells nothing through Play.
- **"You may not promote or glamorize any potential earning from playing or trading activities."** This is the line most likely to catch a money-slang brand. Examples of risky copy:
  - "stack bread", "get rich", or charts of QQQ's best years in screenshots
  - "Watch it grow" with no risk text, or "You could've made $X"
  Keep listing copy about the **habit** ("$100 at a time, into the Nasdaq-100"). Put "Investing involves risk, including loss of principal" in the listing and on the first screen.

---

## 2. Crypto exchange / software wallet policy (2025+) and how Privy fits

### 2.1 The rule [G4][G21]

- **In force since 2025-10-29** (announced August 2025 in 15+ jurisdictions) [G21].
- **US requirement** (one cell spanning both "Exchanges" and "Software Wallets" columns in Google's table): "The developer must be either (a) registered with FinCEN as a Money Services Business **and** with a state as a money transmitter or (b) a federal or state chartered bank entity" [G4].
- Note the **"and"**: FinCEN MSB registration alone isn't enough. State money-transmitter licensing is also needed, which is the expensive part. Some other countries exempt wallets entirely (Hong Kong, Thailand), but the US doesn't.
- **Exemption:** "Non-custodial wallets are out of scope of the Cryptocurrency Exchanges and Software Wallets policy" [G4].
- Google gives **no definition** of custodial. Press coverage describes non-custodial as users "maintain full control over their private keys" [G21].

### 2.2 How a Privy embedded wallet with a server session signer is likely classified

| Setup | Likely Play classification | Why |
|---|---|---|
| Privy embedded wallet; user signs every order (passkey / biometric); no server signer | **Non-custodial**, so out of scope | Keys are sharded, reconstructed in Privy's TEE only on user auth, and neither Privy nor Blunts can move funds alone [G31] |
| Plus a **scoped** server signer: policy-limited to Dinari order contracts and the user's own address, amount caps, user-granted, revocable in-app | **Probably non-custodial** **[UNVERIFIED; Google hasn't ruled on delegated signers]** | The user keeps full control and can revoke. The server can only do what the user pre-authorized, to the user's own benefit, and can't withdraw to third parties |
| Server signer that can **send funds anywhere** or sign without a user-set rule | **At risk of "custodial"**. Google could then require FinCEN MSB + state MTLs | Matches FinCEN's "total independent control" test (file 12 item 3). Google reviewers tend to follow the regulator's framing **[inference]** |
| Blunts holds users' USDC in its own omnibus wallet | **Custodial**. Blocked without MSB+MTL or a bank | Also breaks Dinari's no-omnibus rule |

**Practical steps to stay "non-custodial" on Play:**

1. In Privy, enforce signer **policies**: allowlist the Dinari order/permit contracts and USDC `transfer` only to the user's Dinari-linked address or their verified Cash App deposit address.
2. Get **explicit, logged user consent** for adding the signer ("Let Blunts place your recurring $100 buys"), plus an in-app "Revoke" switch.
3. Keep a one-page "custody architecture" memo (Privy TEE key sharding, signer policy JSON, revocation) ready for Play review.
4. Get a money-transmission opinion from counsel (already a file 12 recommendation). It also answers any Play question.

---

## 3. Payments policy, Play Billing and Google's fees

### 3.1 What's in and out of scope [G6][G7]

| Money flow | Play Billing? | Source |
|---|---|---|
| Deposit (Cash App USDC → Privy wallet), buying dQQQ, selling, withdrawing | **No.** These aren't in-app digital purchases, and Google says "stock trades, investment consulting" should **not** use Play Billing | [G7] FAQ |
| Dinari commission / network fee, any spark or AUM fee charged from the brokerage account | **No.** It's a financial service. Google's payment policies also list "stock brokerage" and "stocks, bonds, or related financial products" as prohibited categories | [G7][G15] |
| Optional "Blunts+" that **waives trading fees** | **Can't use Play Billing** (financial service). Bill it from the account per file 04 §B.4 | [G7][G15] |
| Optional "Blunts+" that unlocks **app features only** (themes, stats, education, streak perks) | **In scope.** "Financial management software" and "new features not available in the free version" are listed digital goods | [G6] |

**Grey zone:** a subscription that mixes fee waivers with app features. Google's rule is that a SKU marketed mostly as digital goods needs Play Billing [G7]. **Keep the two SKUs separate.**

### 3.2 Epic v. Google status (US)

- **2025-10-29:** the injunction took effect after the Ninth Circuit upheld it. Google "will not require the use of Google Play Billing" for US users and allows links out [G10].
- **2026-03-04:** Epic and Google signed a new settlement and asked the court for a revised injunction [G10][G22].
- **2026-07-14:** after Judge Donato ordered a further evidentiary hearing, the parties **withdrew** the motion. The **original injunction remains in force** [G14]. Its 3-year term runs to about late 2027 **[UNVERIFIED end date]**. A separate $700M consumer/states settlement got final approval in 2026 [G14][G32].
- **2026-07-22:** third-party stores can be distributed through Play, and Play Catalog Access is live [G10].
- **Fee reporting:** alternative billing and external-link developers must report and pay starting **2026-10-01**. The external-links deadline for reporting was extended to **2026-12-01** (announced 2026-09-17) [G10][G13].

### 3.3 US rates (confirmed from Google's help pages, 2026-09-28)

"New install" means the user first installed on or after **2026-06-30**. Every Blunts user will be new.

| Purchase type | Play Billing | US alternative billing [G12] | US external content link [G13] |
|---|---|---|---|
| Auto-renewing subscription | 10% + **5% billing fee = 15%** | **10%** | **10%** |
| One-time digital item, first $1M/yr earnings | 10% + 5% = 15% | 10% | 10% |
| One-time digital item, standard (new installs) | 20% + 5% = 25% | 20% | 20% |
| One-time, existing installs (pre-2026-06-30) | 25% + 5% | 25% | 20% |
| In "Apps Experience" program (new installs) | 15% + 5% | 15% | 15% |
| Link-out to install a different app | n/a | n/a | **$2.85 per app install** ($3.65 games) |
| Deposits, trades, brokerage fees | **0%, out of scope** | 0% | 0% |

Sources: [G11] (base structure, 5% billing fee in US/UK/EEA), [G12], [G13]. The fees apply to transactions completed **within 24 hours** of a link-out [G13].

### 3.4 How the founder could voluntarily "cut Google in"

Only digital, non-financial value can go through Google. Options, cleanest first:

1. **"Blunts+" digital subscription through Play Billing** (about $2.99/mo). It could include custom card skins and app icons, a streak or "stash" visualizer, QQQ education content, and priority support **[support is borderline: Google excludes "customer support" from 1:1-service exemptions]** [G7].
   - Google takes **15%** (10% service + 5% billing) [G11].
   - It must **not** change trading fees, execution, or give access to anything in the brokerage account. Otherwise it's a financial service ([G15]; and FINRA would treat it as compensation, see file 12).
   - This is the only way Google gets a real cut, and it's fully compliant.
2. **Tip jar / supporter pack as one-time IAP** (no features). It counts as a digital purchase, so 15% under $1M [G11]. It's low revenue and could look odd for a finance app.
3. **Join the "Apps Experience Program"** when details are published. It lowers Google's rate, it doesn't raise it, but it builds goodwill and featuring potential [G11].
4. **Google Ads App campaigns.** This is how most fintechs "pay Google". But see §5.3: drug-slang creative can be rejected.

Don't route the spark/AUM fee through Google. It's legally the BD's or RIA's fee (file 12), and Google's own rules forbid it.

---

## 4. Google Pay for funding

| Question | Answer | Source |
|---|---|---|
| Can **Blunts** accept Google Pay to fund an investing account? | **No, not as merchant.** The Google Pay API can't be used "for the provision of any financial products or services, unless the partner holds a relevant license". Blunts holds none. It also bans "a substitute merchant of record" | [G16] |
| Can **Dinari** accept it? | Only if Dinari (licensed BD) is merchant of record and its processor allows it. Dinari's docs show no card or Google Pay funding **[UNVERIFIED]** | [G16] |
| Can users buy **USDC** with Google Pay in the app? | Yes, through a **regulated on-ramp as merchant of record**. The AUP allows "purchase or selling of cryptocurrencies with fiat monies through regulated entities". MoonPay launched headless Apple Pay/Google Pay onramps in May 2026. Coinbase Onramp lists Google Pay with about a $5 minimum **[UNVERIFIED for Coinbase]** | [G16][G27][G33] |
| Other prohibited AUP categories that matter | Cryptocurrency "storage wallets or trading information" (unless regulated), binary options/CFDs, trading "signals", "get-rich-quick" schemes, **illegal drugs and drug paraphernalia** | [G16] |
| Cost reality | Card and Google Pay on-ramps cost about 1–4%. That's far worse than Cash App USDC (free) for $100 fills (file 01). Offer it as a fallback only | file 01 |

**Recommendation:** skip Google Pay at launch. If added later, embed an on-ramp widget (MoonPay/Coinbase) that sends USDC straight to the user's Privy address. Never show a Blunts-branded Google Pay sheet.

---

## 5. Marijuana, drug references, ratings and the slang brand

### 5.1 Play's marijuana rule [G17]

- "We don't allow apps that facilitate the sale of marijuana or marijuana products, **regardless of legality**." The examples are in-app ordering, arranging delivery or pickup, and selling THC products.
- The Illegal Activities policy bans "facilitating the sale or purchase of illegal drugs", "depicting or encouraging the use or sale of drugs … by minors" and grow instructions [G18].
- **Blunts sells no cannabis.** Brand words ("blunt", "fill", "spark", "stash") and a subtle leaf aren't a sale. **Low risk, as long as:**
  - there's no link or partnership with dispensaries, no "420 deals", no smoking accessories
  - there's no depiction of smoking, and no joke of the "spend your gains on weed" kind
  - no imagery appeals to minors (cartoon mascots smoking)

### 5.2 Content rating (IARC questionnaire) [G20][G34]

- **Every app needs an IARC rating.** Misrepresenting content "may result in removal or suspension". Retake the questionnaire when content changes [G20].
- The questionnaire asks about **references to drugs, alcohol and tobacco**. A cannabis leaf plus "blunt" branding is arguably a **drug reference**. Answer honestly.
  - Expected result: **ESRB Teen / PEGI 12–16 with a "Drug Reference" descriptor** **[UNVERIFIED exact output; depends on answers]**.
  - IARC authorities rate "glamorisation of illegal drugs use" much higher (PEGI 18 / USK 18) [G34]. That's another reason to keep imagery subtle.
- **A higher rating costs almost nothing.** Blunts is 18+ anyway (KYC). Set **Target audience = 18+** in App content. That keeps you out of the Families policy entirely.
- **US state age laws:** Texas SB 2420 is now in effect, and Play offers the **Play Age Signals API (beta)** [G35]. As an 18+ KYC'd app, use it as an extra signal. KYC is the real age gate.

### 5.3 Keeping the slang brand compliant: rules of thumb

| Do | Don't |
|---|---|
| Money-slang verbs ("fill", "spark", "stack") tied to **saving** | Words or images that suggest getting high, or that cannabis is purchasable |
| Abstract leaf / green palette, smoke-as-motion | Joints being smoked, bongs, dispensary shots, "420" promos |
| Put risk and "Securities offered by Dinari Securities LLC, member FINRA/SIPC" in the listing | "Get rich", "guaranteed", past-return screenshots ("glamorize earning") [G2] |
| Name the category neutrally in the listing: "Finance" | Keyword-stuff with "weed", "cannabis", "420" (also Play's Metadata policy) **[UNVERIFIED specific Metadata text]** |
| Test Google Ads creatives separately; keep a "clean" set with no leaf | Run leaf/smoke creative on Google Ads. The "Recreational drugs" rule bans ads "marketed as facilitating recreational drug use" [G19], and reviewers may misread it |
| Use "Cash App" only descriptively ("send USDC from Cash App") | Cash App logos or colors in the icon or screenshots (Impersonation/IP policy) **[UNVERIFIED specific enforcement]** |

---

## 6. Android-specific build items

### 6.1 Deep links into Cash App

- **Package:** `com.squareup.cash` (also `.lite`, `.beta`). Cash App's `https://cash.app/.well-known/assetlinks.json` verifies these packages for `handle_all_urls` [G25]. So **`https://cash.app/...` URLs open straight into Cash App** when it's installed, and fall back to the browser otherwise.
- **How to open it:**
  - Launch an `Intent.ACTION_VIEW` on `https://cash.app/` (or `https://cash.app/$cashtag/amount` for cashtag sends).
  - To just open the app: `packageManager.getLaunchIntentForPackage("com.squareup.cash")`.
- **Package visibility:** on targetSdk ≥ 30, you must declare `<queries><package android:name="com.squareup.cash"/></queries>` to check if it's installed [G26]. **Don't request `QUERY_ALL_PACKAGES`**. Play restricts it, and fintech isn't a permitted core use **[UNVERIFIED current list]**.
- **No documented intent or scheme prefills a USDC send** (address + network + amount). Same finding as file 09. `cashme://` / `cashapp://` schemes exist historically **[UNVERIFIED; don't rely on them]**.
- **UX:** show the Arbitrum deposit address with **copy** and **QR** buttons plus an "Open Cash App" button. Warn about choosing **Arbitrum**. The wrong network is the main loss risk.

### 6.2 Passkeys (Credential Manager)

- Credential Manager passkeys work on **Android 9 (API 28)+** [G28].
- Host `https://<your-domain>/.well-known/assetlinks.json` with **both** relations:
  - `delegate_permission/common.get_login_creds` (credential sharing / passkeys) [G29]
  - `handle_all_urls` (App Links) (Privy's doc shows this one [G31b])
- Use the **Play App Signing** SHA-256 from Play Console, not your upload key, or production passkeys fail.
- In Privy (Expo/React Native): `react-native-passkeys`, `compileSdkVersion` ≥ 34, and add the SHA-256 to **Privy dashboard → Settings → allowed Android key hashes** [G31b].

### 6.3 Play Integrity API

- Call it before sensitive actions (adding the session signer, first buy, changing the withdrawal address, sell). Verify **server-side**.
- The **Standard** request type is recommended. The default quota is **10,000 requests/day**, and you can request more [G30].
- Google says to use it as "part of an overall anti-abuse strategy", not as the only defense. So don't hard-block rooted devices; step up to extra verification instead [G30].

### 6.4 Target API level [G23]

- **From 2026-08-31, new apps and updates must target Android 16 (API 36).** An extension to **2026-11-01** can be requested.
- Existing apps below API 35 lose visibility to new users on newer devices.
- Expo SDK / React Native versions must support API 36. Check before starting.

### 6.5 Account type, verification and testing

| Item | Requirement | Applies to Blunts? |
|---|---|---|
| **Account type** | Google says to choose Organization for "financial products and services, including … stock trading … cryptocurrency software wallets" [G8] | **Yes. Organization account in the Blunts legal entity's name** |
| **D-U-N-S** | Mandatory for organization accounts. Free from Dun & Bradstreet, "can take up to 30 days" [G9] | **Start now.** Name and address must match the Google Payments profile |
| Other org info | Org website, org phone, contact name, verified contact email and phone, and a public developer phone; legal name and address are shown on Play [G9] | Yes. Use a business phone and a registered-agent or office address, not a home address |
| **Closed test: 12 testers × 14 days** | Only for "**personal** developer accounts created after November 13, 2023" [G24] | **No.** Org accounts can go straight to production. Run a closed test anyway for Dinari sandbox QA |
| Android developer verification (sideloading) | Enforced from **2026-09-30** in Brazil, Indonesia, Singapore and Thailand; global from 2027. Play-registered apps are covered automatically [G36] | Only matters if you ever distribute an APK outside Play |
| **Reviewer login** | Credentials must be "accessible at all times, reusable, and valid regardless of user location", and must bypass 2FA/OTP [G37] | **A hard one for a KYC app.** Provide a pre-KYC'd **reviewer account on a sandbox/demo build path** (Dinari sandbox, test USDC) and written steps. Passkey-only login needs a password or email-OTP fallback for the reviewer |

### 6.6 Data safety form and account deletion [G38][G39]

**Data to declare** (collected; mostly shared with **service providers**, which isn't "sharing" [G38]):

| Data safety category | Blunts data | Notes |
|---|---|---|
| Personal info: Name, Email, Phone, Address, User IDs, **Other info** (DOB, SSN/tax ID, citizenship) | KYC fields to Dinari | Is Dinari a "service provider" or a **third party**? Dinari is an independent BD with its own customer relationship, so declare **shared** (user-initiated, disclosed) **[judgment; counsel]** |
| Photos (ID document images), possibly a selfie | KYC capture | If a KYC SDK processes them, include SDK data flows [G38] |
| Financial info: **Purchase history**, **Other financial info** (income, net worth, holdings, wallet balances, Cash App deposit address) | Orders, suitability questions | "User payment info" only if you ever store card or bank numbers |
| Device or other IDs | Privy, Play Integrity, analytics | |
| App activity / diagnostics | Analytics, crash reporting | |

**Security section:** say "encrypted in transit". Offer a data deletion **web link** as well as in-app deletion.

**Account deletion rules:**
- An in-app path plus a **web URL** are required [G39].
- Google explicitly allows keeping data "for legitimate reasons such as … regulatory compliance" if disclosed [G39]. Brokerage recordkeeping (SEC 17a-4, held by Dinari) and BSA records justify retention. Say so in the privacy policy.
- Deletion can't touch the user's wallet assets. Tell users to sell and withdraw first. The wallet stays recoverable through Privy even after the Blunts account is deleted **[UNVERIFIED Privy behavior on app-account deletion]**.

---

## 7. Practical Play submission checklist

**Entity and account (weeks −8 to −4)**
- [ ] Blunts legal entity formed. **D-U-N-S** requested with an exact legal name and address match [G9].
- [ ] **Organization** Play developer account ($25 one-time fee **[UNVERIFIED current fee]**), with the Google Payments profile verified [G8][G9].
- [ ] Org website live, with a privacy policy (public, non-PDF URL), terms, disclosures page, and an account-deletion page [G39].
- [ ] Dinari partner agreement signed. Collect Dinari Securities' CRD/BrokerCheck link, Form CRS and the Dinari-approved disclosure text.
- [ ] Custody memo (Privy TEE, signer policy, revocation) plus a counsel money-transmission opinion (file 12 item 3).

**Build (Android specifics)**
- [ ] targetSdk **36** [G23]. Remove unneeded permissions: no contacts, SMS, location or `QUERY_ALL_PACKAGES`.
- [ ] `<queries>` for `com.squareup.cash`. Open Cash App through `https://cash.app` App Links [G25][G26].
- [ ] `assetlinks.json` on your domain with `get_login_creds` + `handle_all_urls`, using the **Play App Signing** SHA-256. The same hash goes in the Privy dashboard [G29][G31b].
- [ ] Play Integrity (Standard) checked server-side on the signer grant, buys, sells and address changes [G30].
- [ ] Privy session signer: policy allowlist, explicit consent screen, in-app revoke.
- [ ] Geo/state gating in-app: US only, NY excluded while on the Cash App USDC rail.
- [ ] Optional Play Age Signals API (beta) as an extra age signal [G35].

**Play Console → App content**
- [ ] **Financial features:** Stock trading and portfolio management; Cryptocurrency wallet (non-custodial); Tokenized digital asset [G3][G2]. Not "exchange".
- [ ] **Countries:** United States only [G4].
- [ ] **Content rating (IARC):** answer the drug-reference questions honestly [G20].
- [ ] **Target audience:** 18+ only.
- [ ] **Data safety:** see §6.6. Include deletion URL and retention disclosure [G38][G39].
- [ ] **Ads:** declare whether the app contains ads (it should say no).
- [ ] **App access:** reusable reviewer credentials with no OTP, a pre-verified sandbox account, and step-by-step notes [G37].
- [ ] **Government apps / news / health:** declare none.

**Store listing**
- [ ] Category **Finance**. Developer name = legal entity.
- [ ] Description names Dinari Securities LLC (member FINRA/SIPC) as broker-dealer, gives the risk statement, and has no earnings glamorization [G2].
- [ ] Screenshots: no return promises and no Cash App logos. Leaf imagery stays subtle.
- [ ] No Play Billing SKUs at launch. If "Blunts+" (digital-only) ships later, add it through Play Billing (15%), or alt billing / external link (10%) after enrolling [G11][G12][G13].

**Release**
- [ ] Internal testing, then a closed test with real Dinari sandbox flows (optional for org accounts [G24]), then a staged production rollout (10% → 100%).
- [ ] Watch the **Policy status** page. Keep the Dinari licence documents ready for any "provide documentation" request [G1].

---

## Corrections to earlier files

| File | Earlier claim | Correction |
|---|---|---|
| 04 §B.3 | "There's no explicit securities carve-out" from Play Billing | **There is one.** Google's Payments FAQ says purchases for "stock trades, investment consulting" "should not use Google Play's billing system" [G7] |
| 04 §B.3 / §B.4 | Rates "about 20–25% one-time, 10% subs [UNVERIFIED]"; Play Billing subs 15% | **Verified:** alternative billing is 10% subs, 20% one-time (new installs), 10% under $1M. Play Billing is the same **+5% billing fee** (so 15% for subs). External links are the same as alternative billing, plus $2.85 per app install [G11][G12][G13] |
| 04 §B.3 | "Epic and Google settled on 2026-03-04" | True, but the revised-injunction motion was **withdrawn 2026-07-14**. The original injunction governs [G14] |
| 12 item 30 | "Crypto wallet licensing rule exempts non-custodial wallets only" | Confirmed [G4]. The US custodial requirement is FinCEN MSB **and** state money transmitter (or a bank) |

---

## Sources

**Google Play policy and help (support.google.com/googleplay/android-developer, fetched 2026-09-28)**
- [G1] Financial Services policy: https://support.google.com/googleplay/android-developer/answer/9876821
- [G2] Blockchain-based Content policy: https://support.google.com/googleplay/android-developer/answer/13607354
- [G3] Provide information for the Financial features declaration: https://support.google.com/googleplay/android-developer/answer/13849271
- [G4] Understanding Google Play's Cryptocurrency Exchanges and Software Wallets Policy (country table): https://support.google.com/googleplay/android-developer/answer/16329703
- [G5] Requirements for distributing apps in specific countries/regions (India SEBI stock-trading rules): https://support.google.com/googleplay/android-developer/answer/6223646
- [G6] Payments policy: https://support.google.com/googleplay/android-developer/answer/9858738
- [G7] Understanding Google Play's Payments policy (FAQ: stock trades/investment consulting shouldn't use Play Billing): https://support.google.com/googleplay/android-developer/answer/10281818
- [G8] Choose a developer account type: https://support.google.com/googleplay/android-developer/answer/13634885
- [G9] Required information to create a Play Console developer account (D-U-N-S): https://support.google.com/googleplay/android-developer/answer/13628312
- [G10] An update regarding Google Play's policies for developers serving users in the US: https://support.google.com/googleplay/android-developer/answer/15582165
- [G11] Understanding Google Play's lower service fees (2026-03-04 structure, 5% billing fee, rollout 2026-06-30): https://support.google.com/googleplay/android-developer/answer/16954621 ; Android Developers Blog, "Expanded billing choice and lower fees on Google Play" (June 2026): https://android-developers.googleblog.com/2026/06/play-expanded-billing.html ; "A new era for choice and openness" (March 2026): https://android-developers.googleblog.com/2026/03/a-new-era-for-choice-and-openness.html
- [G12] Offering an alternative billing system for users in the United States: https://support.google.com/googleplay/android-developer/answer/16497028
- [G13] Enrolling in the external content links program for users in the US: https://support.google.com/googleplay/android-developer/answer/16470497
- [G17] Inappropriate Content policy (Marijuana section): https://support.google.com/googleplay/android-developer/answer/9878810
- [G18] Illegal Activities policy: https://support.google.com/googleplay/android-developer/answer/9878877
- [G20] Content Ratings policy: https://support.google.com/googleplay/android-developer/answer/9898843
- [G23] Target API level requirements: https://support.google.com/googleplay/android-developer/answer/11926878 ; https://developer.android.com/google/play/requirements/target-sdk
- [G24] App testing requirements for new personal developer accounts: https://support.google.com/googleplay/android-developer/answer/14151465
- [G34] Content ratings: rating authorities and questionnaire: https://support.google.com/googleplay/android-developer/answer/188189
- [G35] Changes to Google Play for app store bills in applicable US states (Texas SB 2420, Age Signals API): https://support.google.com/googleplay/android-developer/answer/16569691
- [G37] Requirements for providing sign-in details for review: https://support.google.com/googleplay/android-developer/answer/15748846
- [G38] Data safety section guidance: https://support.google.com/googleplay/android-developer/answer/10787469
- [G39] Understanding Google Play's app account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
- Also: Age-Restricted Content and Functionality (doesn't list finance): https://support.google.com/googleplay/android-developer/answer/16302250

**Google Pay / Google payments / Ads**
- [G15] Google Payments user policies (prohibited: "stock brokerage", "stocks, bonds, or related financial products"; written for peer-to-peer transactions, and referenced by Play's Payments policy): https://pay.google.com/about/policy/
- [G16] Google Pay and Wallet APIs Acceptable Use Policy (financial services licence rule, crypto exception, substitute-merchant ban, drugs): https://payments.developers.google.com/terms/aup ; Google Pay policies for businesses: https://pay.google.com/about/business/policy/
- [G19] Google Ads Dangerous products or services (Recreational drugs): https://support.google.com/adspolicy/answer/6014299

**Epic v. Google (press)**
- [G14] Courthouse News, "Google app store overhaul expected by end of July" (2026-07-16; motion withdrawn 2026-07-14): https://www.courthousenews.com/google-app-store-overhaul-expected-by-end-of-july/
- [G22] MLex, "Epic Games, Google propose revised modified injunction": https://www.mlex.com/mlex/articles/2448944/epic-games-google-propose-revised-modified-injunction-in-us-antitrust-litigation ; GIGAZINE on the March settlement: https://gigazine.net/gsc_news/en/20260305-google-epic-settlement/
- [G32] Courthouse News, final approval of the $700M Android settlement: https://www.courthousenews.com/judge-grants-final-approval-of-700-million-android-app-antitrust-settlement/

**Crypto policy press**
- [G21] FinanceFeeds (2025-08-14; effective 2025-10-29; non-custodial exemption): https://financefeeds.com/google-play-clarifies-crypto-wallet-policy-exempts-non-custodial-apps-from-licensing-rules/ ; Forbes: https://www.forbes.com/sites/boazsobrado/2025/08/13/google-play-store-requires-government-licenses-for-crypto-wallet-apps/

**Android developer docs**
- [G25] Cash App Digital Asset Links (packages `com.squareup.cash`, `.lite`, `.beta`): https://cash.app/.well-known/assetlinks.json
- [G26] Package visibility filtering (Android 11+ `<queries>`): https://developer.android.com/training/package-visibility
- [G28] Passkeys on Android (Android 9+): https://developer.android.com/identity/passkeys
- [G29] Credential Manager prerequisites (`get_login_creds` Digital Asset Links): https://developer.android.com/identity/credential-manager/prerequisites
- [G30] Play Integrity API overview (10,000/day default): https://developer.android.com/google/play/integrity/overview
- [G36] Android developer verification: https://developer.android.com/developer-verification

**Privy / on-ramps**
- [G31] Privy, "How Privy embedded wallets work": https://privy.io/blog/how-privy-embedded-wallets-work ; server-side access / signers: https://docs.privy.io/recipes/wallets/session-signer-use-cases/server-side-access
- [G31b] Privy React Native passkey setup (assetlinks, dashboard key hashes): https://docs.privy.io/basics/react-native/advanced/setup-passkeys
- [G27] MoonPay headless onramps with Apple Pay / Google Pay (May 2026): https://genfinity.io/2026/05/14/moonpay-headless-onramps-apple-pay-google-pay/
- [G33] Coinbase Onramp FAQ: https://docs.cdp.coinbase.com/onramp/additional-resources/faq

Earlier files cited: 01 (on-ramp costs), 04 §B.3–B.4 (store fees), 06/12 (advice and fee legality; server signer), 09 (Cash App rails, NY exclusion, no USDC deep link).
