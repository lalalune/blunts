# Blunts launch-readiness audit

**Date:** October 2, 2026. **Audited commit:** `9e91c76d1d4f8905d83459e0afed551dce6e83c3`.

**Verdict:** This repository is a concept prototype plus research and creative tooling. It is not a production web investing application, and it contains no native application implementation. A demo can be hosted after a small hardening pass; accepting real money requires building the product infrastructure and obtaining partner/compliance approvals.

Scope: tracked source, launch research, tests, CI, and selected current official documentation. External contracts, business accounts, credentials, domains and developer-console approvals were not inspected. “No evidence” below means not established by this audit, not proof that the founder has not arranged it elsewhere. The earlier browser smoke test timed out. A subsequent [bounded browser review](../research/2026-10-02/ux-and-technical-review.md) rendered the demo and exercised simulated Fill/Spark, bank selection, history and tutorial; production and full cross-device acceptance remain unverified. No paid financial transactions or provider API calls were attempted.

## 1. What exists and what the green checks prove

| Area | Evidence | Actual status |
|---|---|---|
| Current interface | `prototype/index.html` | Three.js scene, Fill/Spark sheets, mock banking, history, tutorial, demo controls. In-memory simulation. |
| Earlier interface | `prototype/v1-flat.html` | Separate static prototype; not a production fallback integrated with the current app. |
| Product material | `brief/index.html`, `research/01–22` | Substantial planning, including unresolved assumptions and mutually inconsistent proposals. |
| Financial model | `research/model/market_model.py` | Scenario calculator; not account accounting, pricing, or a trading engine. |
| Creative tooling | `ad/` scripts and prompts | Offline production helpers, not application services. Generated media stays local. |
| Repository/CI | GitHub `main`, `.github/workflows/checks.yml` | Nine regression tests, Python compilation, inline JS parsing and regenerated model comparison passed. No app build, provider integration, browser, native or deployment test. |
| Production systems | No API, migrations, package manifest/lockfile, Expo configuration, native project or hosting configuration | Missing from this repository. An absent `ios/` directory alone would not disqualify an Expo project, but there is no Expo app/config here either. |

Source anchors: sample state at `prototype/index.html:281`; immediate balance mutation at `:861` and `:914`; placeholder wallet and simulated payment at `:1140`; fabricated bank details at `:1169`; demo overrides at `:1363`; CDN dependency at `:257`.

## 2. Decisions that must be resolved first

These block a real-money launch on every platform. Suggested accountable owners are roles, not assigned people.

| ID | Unresolved decision | Evidence / required closure | Owner |
|---|---|---|---|
| D01 | What does the customer legally own? | Select direct brokerage shares or the approved US tokenized-securities arrangement; document custody, account ownership, cash location and insolvency treatment. The repo mixes Alpaca and Dinari narratives. | Product + counsel + broker |
| D02 | Who earns which fee? | UI computes 10% of gains (and demo permits 20%); model uses 1% on moves; research/19 proposes fixed partner compensation. Approve one schedule, charging entity, refund policy and revenue agreement, then update every surface. | Founder + counsel + broker |
| D03 | Who is permitted to offer the service? | Obtain analysis of brokerage/advisory activity, funding facilitation, custody/control, compensation and jurisdictions. User signatures alone do not establish a universal licensing exemption. | Counsel |
| D04 | Which US states/customers launch? | Written eligibility matrix from each actual contracted provider, including state moves, tax residency, age, account restrictions and supported assets. Do not infer 50-state coverage from one provider's license. | Compliance |
| D05 | Which funding route is approved? | Draw every account/wallet and transfer in Fill/Spark. Resolve Dinari-managed settlement versus any partner funding account. No undocumented receipt/pooling of customer funds by Blunts. | Broker + payments + counsel |
| D06 | Which contracts and credentials exist? | Signed KYB/partner agreements, US enablement, sandbox and production access, volume limits, reserves, fees, SLAs, incident and support duties. No evidence in repo. | Founder |
| D07 | Who publishes the iOS app? | Agree financial-institution publisher/authorized distribution arrangement and review evidence. A partner letter or becoming an RIA is not a guaranteed review workaround. | Founder + broker |
| D08 | Is the branding accepted? | Review name, rolling/burning animation, imagery, claims and gamification with financial partners and platform policy owners. Do not conceal real functionality from reviewers. | Brand + compliance |
| D09 | What is v1? | Choose one asset, approved geography, one funding/payout route and explicit user-confirmed orders. Decide whether crypto is genuinely necessary. Defer uncontracted rails and subscriptions. | Product |
| D10 | What is a “blunt” after price changes? | Specify deposited principal vs current value, partial units, gains/losses, sales, dividend cash and fractional residuals. Align visuals with authoritative positions and tax basis. | Product + finance |

The performance-fee experiment requires counsel review under the [SEC performance-fee framework](https://www.sec.gov/rules-regulations/2021/11/performance-based-investment-advisory-fees). Switching to a transaction fee does not itself resolve registration/compensation questions; see [FINRA Rule 2040](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2040). This audit does not determine Blunts' legal status.

**Current Dinari checkpoint:** its [US guide](https://docs.dinari.com/docs/us) requires partner KYB/agreement, approved customer flows, verified email, dedicated customer wallets, disclosures and trade confirmations. It identifies regulated stablecoin funding and distinguishes managed settlement from licensed partners' funding accounts. Therefore the repo's passkey-plus-phone plan and blanket “no licenses needed” conclusion are insufficient. Obtain written approval of the exact chosen arrangement. Public generic [restrictions](https://docs.dinari.com/docs/restrictions) also need to be reconciled with the approved US program, rather than treating international APIs as interchangeable.

## 3. Missing production capabilities shared by web, iOS and Android

All items below are absent as production capabilities. Some have visual mockups or research. Unless explicitly marked conditional, each is a launch requirement for the proposed funded product.

### Account and onboarding

| ID | Work needed | Completion evidence | Owner |
|---|---|---|---|
| A01 | Signup/login/logout and server-verified sessions | Real accounts; expired/revoked sessions rejected; users cannot access each other's data. | App/API |
| A02 | Passkeys and recovery, if retained | RP/domain configuration; new-device, lost-phone, second authenticator and recovery tests; wallet recovery evaluated separately from login. | App/security |
| A03 | Verified contact details | Verified email and any chosen phone flow; change/reverification, delivery failure and abuse controls. | App/API |
| A04 | Eligibility | DOB/residency/tax-person/status flow backed by server policy; unavailable states/assets blocked server-side; relocation handled. | App/compliance |
| A05 | KYC and account opening | Provider integration; pending, approved, needs-info, denied, duplicate and retry states; sensitive capture minimized. | API/app |
| A06 | Agreements and disclosures | Approved text, affirmative consent, version/time evidence, retrieval and re-consent on material change. | Compliance/app |
| A07 | Onboarding resumption | Interrupt/reinstall/refresh resumes server state; camera permission failure and document resubmission work. | App |
| A08 | Profile and account settings | Contact, legal details, bank methods, security devices and notification preferences; restricted changes reverified. | App/API |
| A09 | Closure, deletion and export | Resolve holdings/pending transfers; revoke access; retain legally required records separately and explain retention; export/documents remain available as required. | API/compliance |
| A10 | Support and exceptional account states | Frozen/restricted/deceased/incapacitated/dormant account handling and broker escalation ownership. | Operations |

### Money, investing and financial truth

| ID | Work needed | Completion evidence | Owner |
|---|---|---|---|
| M01 | Authoritative account/position mapping | Customer, broker account, wallet and funding source mapped uniquely; environment separation. | API |
| M02 | Durable accounting | Append-only balanced money records with external IDs; integer minor units/decimal asset quantities; no floating-point client state as financial truth. | API/finance |
| M03 | Balance definitions | Separate pending deposits, tradeable funds, settled/withdrawable cash, reserved funds and marked position value. | Product/API |
| M04 | Funding integration | Actual chosen bank/onramp flow; authorization records; deposit detection and status; ownership checks. Plaid-style linking alone is not funding. | Payments |
| M05 | ACH lifecycle, if offered | Pending/settled/returned/reversed transactions, holds, insufficient funds, name mismatch and loss allocation. Never treat initiation as final settlement. | Payments/risk |
| M06 | Chain lifecycle, if offered | Contract/chain allowlist, finality/reorg handling, sender screening, wrong asset/network cases, gas budget and safe recovery procedure. Same address does not guarantee recoverability. | Wallet/API |
| M07 | Funding instructions | User-specific verified address, network, QR, limits and copy feedback; handoff/return handling; actual supported third-party app capability verified. | App |
| M08 | Market data | Licensed quotes/valuation, timestamps, stale-data rules, trading sessions, market holidays and professional-user entitlements. | API/broker |
| M09 | Order preview | Side, instrument, amount/quantity, current quote, full fees and expected proceeds; quote expiry and explicit confirmation. | App/API |
| M10 | Order submission | Server validation, per-user authorization, provider idempotency, signing boundaries and durable request record before external submission. | API/security |
| M11 | Order state machine | Submitted/unknown/accepted/partial/filled/rejected/cancelled states; polling/webhook convergence and recovery without duplicate orders. | API |
| M12 | Market exceptions | Closed markets, halts, stale/changed prices, slippage, minimum trade, fractional dust, unsupported symbols and corporate-action restrictions. | Product/API |
| M13 | Sale-to-payout orchestration | Distinguish sale execution, settlement, available cash and payout; never show “sent” merely because a sale began. | Payments/API |
| M14 | Destination verification | Verified bank/wallet ownership where supported, reauthentication, address-change policy, holds and destination-change notifications. A user clicking “received $1” alone is insufficient proof. | Risk/API |
| M15 | Payout lifecycle | Quote/fees/limits, submit/status, retry, rejected/returned/stuck payout, alternate approved route and incident escalation. | Payments |
| M16 | Fraud and sanctions controls | Defined provider/Blunts responsibilities, screening, velocity rules, account takeover protection, investigation queue and false-positive handling. | Risk/compliance |
| M17 | Reconciliation | Scheduled provider-vs-ledger-vs-chain/bank comparison; missing events and mismatches block affected operations and create cases. | Finance/API |
| M18 | Statements and taxes | Broker-sourced confirmations, statements, tax documents, basis/lots, realized vs unrealized P&L; document corrections and delivery. | Broker/app |
| M19 | Dividends and corporate actions | Authoritative event ingestion/display for cash distributions, splits, mergers and other entitlements; no invented entitlements. | Broker/API |
| M20 | Confirmations and notifications | Durable receipt IDs, accurate timestamps/status, email/push preferences, retries and redaction of sensitive lock-screen content. | API/app |
| M21 | Fee implementation | Approved fee rules, rounding, pre-trade disclosure, collection, refunds, accounting and reconciliation. Update the model from contracted costs. | API/finance |
| M22 | Customer portability/continuity | Document broker access and asset exit if Blunts or a dependency shuts down; estate and dormant account referral procedures. | Operations/broker |

### Backend, security and operations

| ID | Work needed | Completion evidence | Owner |
|---|---|---|---|
| B01 | Application/API project | Typed domain contracts, validation, stable error model, dependency lockfile and reproducible builds. | Engineering |
| B02 | Database | Schema/migrations/indexes for identities, consents, accounts, transfers, orders, ledger, webhooks and audit records. | API |
| B03 | Background workers | Durable queue/outbox, locking, bounded retries, dead-letter handling, restart recovery and safe replay tools. | API |
| B04 | Webhook gateway | Signatures/timestamps, deduplication, out-of-order handling, transactional ingestion and provider re-sync. | API/security |
| B05 | Secret management | Server-only keys in a secret manager; scoped credentials, rotation, revocation, inventory and environment separation. | Infrastructure |
| B06 | Authorization and abuse controls | Object-level access control, staff roles, rate limits, CSRF/CORS strategy, input/output safety and session policies. | Security/API |
| B07 | Sensitive data architecture | Data inventory/classification, encryption/key access, least collection, retention and deletion; no identity documents in ordinary logs. | Security/compliance |
| B08 | Wallet/signing security, if retained | Document who can sign, policy-change authority, transaction preview, replay/domain/chain protection and key export/recovery. Admin tools must not bypass the chosen customer-control model. | Security |
| B09 | Audit and change control | Tamper-resistant records, actor/reason/request IDs, consent versions and controlled provider-facing changes. | Security/compliance |
| B10 | Admin/support console | MFA, least privilege, customer timeline, reconciliation/complaint queues and audited actions; approvals for sensitive configuration. | Operations/API |
| B11 | Observability | Redacted structured logs, metrics/traces, client/native error capture, queue age and transfer/reconciliation alerts. | Infrastructure |
| B12 | Operational readiness | On-call owner, incident/security/broker escalation, fraud losses, provider outages and customer communication procedures. | Operations |
| B13 | Recovery | Backups, point-in-time restore where selected, restore drill, recovery objectives and dependency failure tests. | Infrastructure |
| B14 | Security assurance | Threat model, dependency/secret scans, independent security review/pen test, remediation and partner-accepted attestation evidence. | Security |
| B15 | Deployment operations | Staging/production isolation, protected releases, migration rollout/rollback, feature flags, kill switches and uptime checks. | Infrastructure |
| B16 | Financial/vendor operations | Named owners, invoicing, reserves/liquidity obligations, insurance review, contracts/data agreements and vendor exit plans. | Founder/operations |

## 4. Unfinished interface and code work

| ID | Finding | Required change / test |
|---|---|---|
| U01 | State starts from sample balances and resets on reload | Real authenticated account loading; explicit isolated demo route/environment. |
| U02 | Fill/Spark directly change `S.P` and `S.U` | Render backend-confirmed state; animation failure must not alter money or stall workflows. |
| U03 | “OPEN CASH APP” only starts a timer | Implement supported handoff or accurate manual instructions; actual return/resume and deposit-status checks. |
| U04 | Clipboard copies a hard-coded full address and reports success even on failure | Replace with verified account-specific instructions; await clipboard and handle denial; do not expose the placeholder as a funding destination. |
| U05 | Add-bank fabricates last four digits and says “Secured by Plaid” | Real linking and provider-approved copy; distinguish demo branding from connected providers. |
| U06 | Payout labels say “Instant”/“Minutes” without execution | Use provider-backed estimates, eligibility and settlement status. |
| U07 | Demo controls change prices, fees and rail availability | Compile out or isolate demo controls from production; eligibility and fees enforced by API. |
| U08 | Fee/tutorial copy conflicts with financial plan | Resolve D02; dynamic approved fee display, consistent brief/marketing/model/tests. |
| U09 | Historical return/holdings/fee figures are static | Verify methodology/date/source and usage rights; maintain them or remove unsupported claims. |
| U10 | Icon-heavy interface and dialog helper lack complete accessibility | Accessible names, dialog label/focus trap/restore, background inertness, keyboard navigation, screen-reader alternatives, contrast and text scaling. |
| U11 | Reduced motion only shortens/skips some effects | Provide a usable nonanimated path; verify continuous effects, screen-reader announcements and action completion. |
| U12 | WebGL renderer creation is unguarded | Handle unavailable GPU/context loss and initialization failure; show usable account/actions without 3D; retry rather than indefinite boot overlay. |
| U13 | External fonts/Three.js and large inline image data | Pin/bundle or integrity-control dependencies, isolate assets/cache them, set a performance budget and test cold/offline/CDN-failure startup. |
| U14 | Rendering and financial logic live in one large HTML closure | Extract tested domain logic, API/state layer, accessible components and independent visual scene. Avoid blind rewrite of proven visuals. |
| U15 | Long asynchronous animations own busy state | Robust cleanup/cancellation and exception handling; app background/resume, navigation and refresh cannot leave a stuck UI. |
| U16 | No completed cross-device browser acceptance | Test desktop and phone layouts, keyboard/safe areas, rotation, low-memory devices, input amounts, partial/full withdrawal and slow networks. |
| U17 | No real transaction history/receipt detail | Durable event timestamps, pending/error states, pagination, fee breakdown and support references. |
| U18 | No full onboarding/account/support/document surfaces | Build the account capabilities in section 3; current tutorial is not enrollment. |
| U19 | Draft promotional assets are not reviewed release assets | Verify rights to imagery/fonts/audio/likenesses, retain licenses, obtain financial marketing approval and create accurate store/media versions. |

## 5. Web deployment requirements

| ID | Work needed | Release evidence |
|---|---|---|
| W01 | Pick deployment target and owned domain | Hosting account, DNS ownership, HTTPS certificates, canonical app URL and support/privacy URLs. No ownership inferred for `blunts.com`. |
| W02 | Separate public and private surfaces | Only release assets reachable; `.env`, research, ad jobs and internal brief not served. Never deploy the repository root through an unrestricted file server. |
| W03 | Build/export and routing | Reproducible output, deep-link refresh/404 behavior, source-map access policy, asset hashes/cache headers and rollback. Static HTML can be hosted without a framework; production app architecture still needs implementing. |
| W04 | App/API security boundary | HTTPS, CSP, HSTS, frame policy compatible with chosen KYC/provider flows, restrictive CORS, session protection and no PII in URLs. |
| W05 | Environment wiring | Public config contains only public values; correct auth callbacks, provider/webhook endpoints, email domain and secret rotation. |
| W06 | Browser acceptance | Safari/iOS Safari, Chrome/Android, Firefox, Edge; touch/keyboard/accessibility; camera, passkeys, popup and clipboard denial. |
| W07 | Performance and failure UX | Fast cold startup, chunk/asset failure recovery, offline/read-only state, stale-data indicator and disabled unsafe submissions. |
| W08 | Release pipeline | Preview/staging verification, approved production promotion, live smoke test, monitoring and rollback drill. |
| W09 | PWA installability, if desired | Manifest, icons, display/start URL and scoped service worker; never cache private account responses indiscriminately or imply transactions work offline. Not mandatory for a normal website. |
| W10 | Web notifications, if desired | Permission UX, subscription lifecycle and email/in-app fallback; notifications are not the source of transaction truth. |

**Demo-only exit:** W01–W04, correct static assets and clear simulation treatment, no usable mock payment destination, isolated demo controls, startup/accessibility fixes and successful rendered browser tests. No real deposits, trades or claims of connected banking.

**Funded web exit:** all applicable D/A/M/B/U/W launch items closed; approved provider flow, production smoke test and controlled real-money reconciliation/withdrawal accepted by the responsible operators. Hosting the HTML alone does not meet this gate.

## 6. iOS work after the shared funded product

| ID | Work needed | Release evidence |
|---|---|---|
| I01 | Native app foundation | Expo/React Native or another chosen native project, stable bundle ID, config/plugins and reproducible archive. |
| I02 | Developer/distribution ownership | Verified organization/team, agreed financial-services publishing arrangement, App Store Connect roles and contracts. |
| I03 | Signing/builds | Certificates/profiles/entitlements, CI credential management, version/build numbers and signed device/TestFlight builds. |
| I04 | Native authentication and storage | Keychain-backed session storage, passkeys/associated domains/AASA, biometric prompts and recovery on a second device. Biometrics alone are not a server identity. |
| I05 | Provider and app return flows | Native-supported KYC/bank/wallet integration, camera permissions, universal links, browser session returns and terminated-app resumption. |
| I06 | Rendering/lifecycle | Native UI for core actions; benchmark any embedded 3D WebView, foreground/background, memory pressure, low-power mode and lost network. |
| I07 | Apple configuration | Icons/splash, permission reasons, privacy manifest/required-reason API and SDK audit, encryption/export declarations as applicable. |
| I08 | Privacy/account controls | Accurate privacy label/policy/support; account-deletion initiation; consent/ATT only if tracking is actually introduced; compliant login choices if social sign-in is added. |
| I09 | Push, if offered | APNs entitlements/credentials, permissions, delivery/token replacement and notification navigation. |
| I10 | Digital subscription, only if retained | StoreKit products, approved billing flow, server entitlements, purchase/restore/refund/expiry handling. Not a prerequisite for investing and not the route for brokerage funding. |
| I11 | Store submission | Truthful rating, screenshots/text, financial/brand review packet, working reviewer access with isolated test funds, and functioning support/legal URLs. No production-wide KYC bypass. |
| I12 | Acceptance and rollout | Physical iPhone testing, VoiceOver/text size, TestFlight feedback, crash/performance review, phased rollout and operational rollback plan. |

Current SDK submission baseline: Xcode 26+ with iOS 26 SDK or later, per [Apple's requirement notice](https://developer.apple.com/news/upcoming-requirements/). This is a build requirement, not a requirement to set the app's minimum supported OS to iOS 26.

Apple's [Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) make the financial-services publisher/licensing arrangement material (§3.2.1(viii)). Substance-related encouragement is also a review risk (§1.4.3); an adult rating or clean icon is not a guarantee. A wrapper still needs to satisfy functionality, privacy, account and financial requirements. Obtain reviewable evidence early.

## 7. Android work after the shared funded product

| ID | Work needed | Release evidence |
|---|---|---|
| G01 | Android app foundation | Project/config, stable application ID, app links, resources, compatible dependencies and reproducible release AAB. |
| G02 | Play Console | Verified appropriate organization account, declared financial features, geography/licensing evidence and applicable developer/app verification tasks. |
| G03 | Signing/security | Play App Signing, protected upload key/recovery, secure CI publishing permissions and keystore-backed session storage. |
| G04 | Platform targets | Current submission target API, compatible native libraries/16 KB pages, supported OS/device matrix and permission behavior verified. |
| G05 | Native login and links | Credential Manager/passkeys, Digital Asset Links, correct signing-certificate fingerprints including Play signing, biometric/recovery and cold-start returns. |
| G06 | KYC/bank/payment integration | Camera/browser/WebView/app-link behavior tested with actual chosen SDKs; user cancellation and app not installed handled. |
| G07 | Android UI/lifecycle | System back/predictive back, edge-to-edge insets, keyboard, font scaling, rotation, process death and low-memory GPUs. |
| G08 | Privacy and deletion | Data safety form reflecting actual SDK behavior; privacy URL; in-app deletion and functioning external deletion request page with justified retention. |
| G09 | Notifications, if offered | FCM credentials, Android notification permission/channels, token updates, background restrictions and navigation. |
| G10 | Billing, if retained | Supported Play Billing integration, server validation/entitlements and purchase restore/refund/expiry behavior for digital extras. |
| G11 | Store review | IARC/content/target-audience answers, screenshots/listing, financial and any tokenized-asset disclosures, reviewer access, applicable testing track requirements. |
| G12 | Acceptance and rollout | Physical Pixel and Samsung plus lower-end device, TalkBack, internal/closed testing as applicable, pre-launch reports, Android vitals and staged rollout. |

Current phone-app submission baseline is [Android 16 / API 36](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en). Validate [16 KB native-library compatibility](https://developer.android.com/guide/practices/page-sizes) for the chosen build and any applicable console deadline. Google requires an external account-deletion request route as well as the applicable in-app flow; see [deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).

Google's [wallet policy](https://support.google.com/googleplay/android-developer/answer/16329703?hl=en) excludes non-custodial wallets from that specific policy's scope. That does not exempt the investing product from financial declarations, other platform policies, or law. Determine scope from the actual signing/control model.

## 8. Tests missing from the current green CI

| ID | Required test layer | Critical cases |
|---|---|---|
| T01 | Domain accounting | Decimal precision, fee rounding, partial withdrawals, loss cases, dust, dividends and consistent cash/positions. |
| T02 | Authorization/security | Cross-user object access, revoked sessions, staff privilege escalation, replay, CSRF and unsafe input. |
| T03 | Provider contracts | Sandbox onboarding, quote/submit/status, funding/payout, signature verification and provider schema changes. |
| T04 | Recovery and idempotency | Duplicate/out-of-order/missing webhooks, timeout after provider acceptance, queue crash, concurrent actions and safe re-sync. |
| T05 | Browser end to end | Fresh account through approved funding/buy/sell/payout; denial/recovery flows and reload during every transition. |
| T06 | Native end to end | Same flow on signed physical iOS/Android builds, deep links, biometrics, camera, process death and push returns. |
| T07 | Accessibility/performance | VoiceOver/TalkBack/keyboard, text scaling, reduced motion, WebGL failure, startup/frame/memory/battery budgets. |
| T08 | Operational drills | Backup restore, dependency outage, broken deploy/rollback, ledger mismatch, incident notification and account takeover. |
| T09 | Release evidence | Exact commit/artifact/config, CI, staging acceptance, approvals and production smoke; no substitution of unit-test success for launch approval. |

## 9. Recommended architecture and sequence

Recommendation, not an implemented decision: retain the existing visual scene as a component while building a shared typed product around it. Expo Router is a reasonable candidate for web/iOS/Android; use platform-specific auth/provider adapters and a separate API/worker service with Postgres. First prove passkey recovery, hosted KYC, banking return links and 3D performance on both native platforms. [Expo DOM components](https://docs.expo.dev/guides/dom-components/) can reuse web visuals, but use asynchronous bridges and have runtime/performance differences. Keep account controls and financial state outside the animation/WebView.

Suggested target layout:

```text
apps/app/              shared routes and platform UI/adapters
apps/api/              authenticated API and provider adapters
apps/worker/           durable orchestration, notifications, reconciliation
packages/domain/       decimal money types, state machines, validation
packages/ui/           accessible components and isolated visual scene
infra/                 environments, deployment, migrations, monitoring
```

| Phase | Deliverable | Exit gate |
|---|---|---|
| 0: Product/partner decision | D01–D10, signed scope and architecture spike | One coherent funds flow, fee model, publishing arrangement and verified provider access. |
| 1: Web demo | Harden and host simulation in its own environment | Rendered browser acceptance, HTTPS, correct scope/copy, no real-money affordance. Can happen while phase 0 is pending. |
| 2: Shared sandbox product | Account, backend, ledger, one rail, quotes, orders, payout, support | A new user completes the full cycle; interrupted/duplicate events recover and reconcile. |
| 3: Funded web beta | Approved contracts/UI, production services, limits and operations | Controlled authorized real-money cycle matches provider records; security/support/recovery gates pass. |
| 4: iOS release | Native adapters, signed builds, TestFlight and submission | Physical-device acceptance and App Review approval. Begin publisher coordination in phase 0. |
| 5: Android release | Native adapters, AAB, Play declarations/testing | Physical-device acceptance and Play approval. Shared implementation can be developed alongside iOS. |

No dependable calendar or cost estimate exists until phase 0 and the native/provider spikes close. The earlier 16–18 week figure is a research estimate, not a delivery commitment. Re-estimate from accepted provider scope, engineering staffing and acceptance gates.

Defer unless essential to the chosen v1: Blunts+, Apple Pay/Google Pay, additional funding providers, recurring/automatic investments, multi-asset portfolios, referrals, social features and extensive PWA offline features. They are not required merely to publish the first funded app.

## 10. Explicit corrections to the earlier plan

- `research/19` says all 50 states and no transmission licenses are needed. Treat these as unapproved conclusions pending the actual arrangement and written legal/provider review.
- Its passkey-plus-phone-only flow omits the verified email required by the currently documented Dinari US path.
- Wallet key control, login recovery, transaction authorization and regulatory classification are distinct questions. A Face ID tap does not answer all four.
- “Cash App supports stablecoins” does not prove this customer's eligibility, a particular network, an integration API, fees or an automatic return/deposit flow. Verify each; the [official disclosures](https://cash.app/us/en/legal/bitcoin-disclosures) warn that incompatible-network/unsupported-asset sends can cause permanent loss.
- No-provider-funds custody is not the same as no Blunts security/compliance/support responsibility.
- Demo market valuation and pro-rata cost basis are not broker records. A rounded UI value cannot determine withdrawable money.
- Do not promise instant withdrawals before verifying sale execution, settlement, bank eligibility and payout availability together.
- App-store percentages, partner charges and minimums in the research model are assumptions until verified for the signed commercial arrangement. Correct calculations do not establish lawful revenue or business viability.
- A subscription is optional; it is not necessary to compensate Apple/Google in order to obtain financial-app approval.
- A successful animation is not evidence of funding/trading, and passing the current checks is not deployment acceptance.

## 11. Immediate work queue

1. Assign a founder/partner owner and counsel owner to D01–D08; assemble existing contracts and approvals without putting secrets in the repo.
2. Approve a short v1 product specification: asset, ownership, geography, fee, funding/payout route, customer limits and explicit non-goals.
3. Run the native/provider spike while building an isolated, clearly simulated hosted demo.
4. Scaffold the typed app/API/database/worker projects and implement a fake-provider adapter before sandbox integration.
5. Build and test one complete durable sandbox loop: enroll → fund → quote/confirm → buy → sell → settle → withdraw → reconcile → receipt.
6. Add account recovery, support, deletion/closure, operational controls and required disclosures before any funded beta.
7. Close funded-web acceptance, then the iOS and Android release gates above; retain evidence per release.

This document is a launch backlog, not an authorization to deploy, move money, contact partners or enroll in paid services.
