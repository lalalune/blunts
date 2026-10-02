# Web, iOS, and Android publishing plan

October 2, 2026. Platform requirements can change before submission: release owner must recheck official documentation and the actual developer consoles. A signed binary or accepted upload is not App Review/Play approval, and store approval is not legal clearance.

**Revenue decision:** no subscription, paid tier, StoreKit or Play Billing integration. Fill/Spark are financial conversion charges collected through the approved financial route. Wallet architecture and legal responsibilities follow the [current strategy](wallet-strategy.md).

## Platform strategy

Build the shared funded product and mobile adapters together; release a controlled web beta first, then iOS and Android after device and store acceptance. Use Expo/React Native as a **candidate**, subject to a two-week SDK spike. Shared domain logic and API contracts are valuable; forcing every bank/KYC/wallet flow into the same renderer is not. [Expo web](https://docs.expo.dev/workflow/web/) supports a shared project; [DOM components](https://docs.expo.dev/guides/dom-components/) can retain the scene but involve an asynchronous bridge and separate execution context. Keep secrets, signing authority and ledger logic outside it. Native UI owns account controls. A static accessible scene is an acceptable fallback.

Start the legal publishing arrangement in phase zero. Do not wait until the web app is finished to discover that the regulated provider must be the publisher or that the branding is unacceptable.

## Web release checklist

1. Verify owned domain and hosting organization; select managed frontend, API/worker, database, object store and secrets service. No evidence of domain ownership is implied by the brand.
2. Deploy only compiled public assets. Research, `.env`, ad jobs, logs, private documents and source credentials stay outside the web root. Separate demo, sandbox and funded environments/accounts.
3. Configure DNS/TLS, HTTPS-only cookies, restrictive CORS, CSP compatible with selected provider frames, clickjacking protection and HSTS after validation. Use exact callback allowlists and state/nonce validation.
4. Implement deep-link refresh, 404/error states, cache/version strategy, source-map access, session expiry, safe offline behavior and no shared caching of private data. PWA installation/push are optional; queued offline trading is out of scope.
5. Establish staging → approved artifact promotion, migrations, backup restore, monitoring, on-call/support, rollback and live smoke evidence. Test Safari/iOS Safari, Chrome/Android, Firefox and Edge.
6. Demo hosting can precede financial approval only as a clearly simulated experience with no usable mock deposit destination or false connected-bank claims. Funded hosting requires the complete legal/provider/operations gates.

## iOS

| Work package | Concrete deliverable / acceptance |
|---|---|
| Publisher | Verified organization, authorized financial-service distribution arrangement, D-U-N-S and account roles; provider identity and documentation consistent with listing |
| Enrollment | [Apple Developer Program](https://developer.apple.com/help/account/membership/program-enrollment) currently $99/year; confirm entity/local billing and authorized enrollment |
| Build | Stable bundle ID, current supported Expo/RN/native SDKs; [Xcode 26+/iOS 26 SDK submission baseline](https://developer.apple.com/news/upcoming-requirements/); minimum deployment OS chosen separately |
| Signing | Managed certificates/profiles, least-privilege CI credentials, reproducible signed archive, version/build tracking and protected credential recovery |
| Authentication | Keychain/session handling, passkey associated domains/AASA, browser auth callbacks, fresh install/reinstall/new-device recovery and transaction reauthentication |
| Provider adapters | Camera/hosted KYC, allowed bank/wallet handoff, app absent/cancel/return/cold-start recovery on physical devices |
| Privacy | Inventory every SDK; privacy manifest/required-reason API entries, accurate privacy labels, support/privacy URLs, account-deletion initiation and lawful financial-record retention |
| Permissions | Purpose-specific camera/photo/notification descriptions; request only when needed; export/encryption declarations reviewed |
| Optional push; billing excluded | APNs/token rotation if included. No StoreKit, digital products or subscription entitlements; approved investment fees are collected by the financial flow |
| Review packet | Approved financial disclosures/brand, accurate screenshots and age rating, licensing/publisher evidence, functioning review account with isolated data, detailed explanation of restricted flows |
| Acceptance | Physical older supported and current iPhone; VoiceOver/Dynamic Type, backgrounding, degraded network, low power, recovery; TestFlight; App Review approval; phased release and monitoring |

[Apple's Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) make financial-institution publishing/licensing (§3.2.1(viii)), substance-related encouragement (§1.4.3), adequate functionality (§4.2) and privacy/account controls relevant. Social login may trigger §4.8 requirements; decide from actual authentication choices. An age rating, sanitized icon, RIA label or thin wrapper does not guarantee approval. Review the real app honestly; do not hide investing or cannabis imagery from reviewers.

## Android / Google Play

| Work package | Concrete deliverable / acceptance |
|---|---|
| Publisher | Verified [organization account for financial services](https://support.google.com/googleplay/android-developer/answer/13634885?hl=en-EN), beneficial/contact details, signing/app ownership and Play roles |
| Financial policy | [Financial features declaration](https://support.google.com/googleplay/android-developer/answer/9876821?hl=en), selected distribution countries, licenses/provider documents, tokenized-asset disclosures where applicable |
| Build/signing | Stable application ID, release AAB, Play App Signing/upload key, recovery controls, exact versioned artifact and internal track |
| SDK/native compatibility | Current [API 36 phone-app target baseline](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en); verify [16 KB native-library support](https://developer.android.com/guide/practices/page-sizes) and applicable console deadline for every packaged SDK |
| Authentication | Keystore-backed storage, Credential Manager/passkeys, Digital Asset Links with Play-signing fingerprint, app/browser return verification and recovery |
| UX/lifecycle | Edge-to-edge insets, keyboard, text scaling, system/predictive back, process death, low-memory GPU, denied permissions and app-not-installed cases |
| Privacy | Accurate Data safety answers from actual SDK/network behavior; privacy URL, in-app account deletion plus [external deletion-request page](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en) |
| Optional push; billing excluded | FCM/token lifecycle and permission if included. No Play Billing products or subscriptions; apply [payments policy](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en-EN) to the actual financial service |
| Review/testing | IARC/target audience, truthful screenshots, functioning reviewer access, pre-launch reports, internal/closed tests and any account-specific production-access conditions |
| Acceptance | Signed physical Pixel, Samsung and low-end device tests, TalkBack, Play approval, staged rollout, Android vitals, incident/rollback plan |

The [specific crypto-wallet policy](https://support.google.com/googleplay/android-developer/answer/16329703?hl=en-EN) excludes noncustodial wallets from its scope; that does not exempt the whole investing app from other financial rules. [Android developer verification](https://developer.android.com/developer-verification?authuser=0) is rolling out with regional enforcement; complete actual console identity/package tasks rather than assuming sideloading bypasses review obligations. Testing requirements for new personal accounts are not a universal rule for every organization account.

## Submission dossier and ownership

Release manager assembles: entity/publisher evidence; signed provider permission; counsel-approved jurisdiction/fee/instrument scope; legal/support/deletion URLs; data flow/SDK inventory; approved copy and assets; accessibility/device test results; reviewer instructions and restricted test credentials; exact source SHA, signed artifact hash, environment/config version and CI run; support/on-call roster; incident/wind-down procedures. Credentials belong in console/secret storage, not this repository.

Provide reviewers a working approved test environment and explain any KYC/payment restrictions. Never add a production-wide reviewer bypass, fake live holdings or undisclosed review-only functionality. Resolve rejection with the actual issue, not a deceptive alternate build.

## Timing and budget implications

Publishing itself is not the long pole: legal publisher agreement, native provider SDKs, recovery and real-device acceptance are. Plan 4–8 engineering weeks of native adaptation/QA per platform with substantial overlap after shared flows stabilize, plus variable enrollment/provider/review waiting. This is a planning range, not a store SLA. Reserve time for at least one substantive rejection/remediation cycle. Build early internal signed shells in the spike so signing, SDK and link failures surface before the funded beta.

No app was enrolled, submitted, deployed publicly, or approved as part of this research.
