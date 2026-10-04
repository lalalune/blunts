# Blunts

One React app for the web, iOS and Android. Wallet setup appears over the 3D tray;
backup, recovery and sign-out live under **Menu → Wallet**. No subscription. The simulated
investment flow charges an uncapped 1% on each completed Fill/Spark conversion.

**Current release: simulated money only.** The browser and Capacitor apps use a
real persistent backend, but no real wallet signer, MoonPay checkout, Dinari
account or investment asset is connected. `MONEY_MODE=live` deliberately refuses
to start. Adding credentials will not enable live money: the integrations below
still require implementation and acceptance. This runbook distinguishes that
engineering work from account setup and publishing work.

## 1. Run the app

Use Node 24 and the committed npm lockfile. Never serve the repository root: it
contains local creative-tool configuration. The app serves only built web assets.

```sh
npm ci
npm run build
npm start
# http://localhost:8740
```

Create a test handle and password in the overlay, accept the demo terms, then
use **Fill → Add funds → Continue to invest**, then **Spark → Sell → Continue to cash out**.
Add a test destination under **Menu → Wallet → Settings** before cashing out.
Use **Menu → Wallet → Back up wallet** to view the initially issued recovery code or replace
it after confirming your password. Replacing a code invalidates the old one.
Signed-out users can choose **Menu → Wallet → Recover wallet**. This code recovers a demo
account; it is NOT a blockchain seed phrase or wallet key backup.

Records survive restart in ignored `data/blunts/`. Only one process may open
that embedded PostgreSQL directory. Use server PostgreSQL for replicas and
operator tools while the app runs. The creative `.env` is never loaded by the app.

| Setting | Current behavior |
|---|---|
| `MONEY_MODE` | Only `simulation` supported |
| `DATABASE_URL` | PostgreSQL URL, or local PGlite directory; default `data/blunts` |
| `APP_ORIGIN` | Exact web/API origin, default `http://localhost:8740`; HTTPS enables secure cookies and HSTS |
| `HOST`, `PORT` | Default `127.0.0.1`, `8740`; use `0.0.0.0` inside a container |
| `MOBILE_API_ORIGIN` | Public backend origin compiled into native assets by `mobile:sync`; never a secret |

## 2. Verify a change

```sh
npm run format:check
npm run build
npm test
npx playwright install chromium webkit
npm run test:e2e
python3 -m unittest discover -s tests
node --test tests/prototype.test.cjs
npm audit
```

`TEST_DATABASE_URL` enables the additional real PostgreSQL full-cycle test. Use a
fresh disposable database: the suite creates fixture users. Never point it at
staging or production customer data. Browser scenarios cover funding, investing,
settlement, withdrawals, unknown/rejected outcomes, reload persistence, recovery
UI, overflow and selected accessibility checks. Reduced-motion is enabled in the
browser suite to avoid taxing software GPU rendering; inspect normal animation
separately. Test outputs contain synthetic data in ignored `test-results/`.

CI checks backend/browser behavior, PostgreSQL 17, Docker startup and both mobile
builds. A green simulator build is not proof of physical-device acceptance,
provider approval, store approval, or live money. See the actual Actions run at
the release SHA before distributing a build.

## 3. Mobile development: Capacitor

Capacitor 8 is selected because it shares this React/Vite UI and provides native
HTTP, app lifecycle and file sharing without a separate Rust application layer.
The committed `android/` and `ios/` projects are source. They bundle local assets;
they do not load the website through `server.url` or permit arbitrary navigation.

Install Android Studio/SDK 36 and JDK 21 for Android. Install Xcode 26+ and an iOS
simulator for iOS. This repository uses Swift Package Manager, not CocoaPods.
Review [Capacitor prerequisites](https://capacitorjs.com/docs/getting-started/environment-setup)
when upgrading. The generated package ID is `com.lalalune.blunts`; confirm that
it belongs to the publishing organization before creating permanent store records.

```sh
# Local development only. Run npm start in another terminal.
MOBILE_API_ORIGIN=http://localhost:8740 npm run mobile:sync -- --development
npm run android:debug
# Android emulator/device: choose an explicit serial from adb devices.
adb -s DEVICE_SERIAL reverse tcp:8740 tcp:8740
adb -s DEVICE_SERIAL install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s DEVICE_SERIAL shell am start -n com.lalalune.blunts/.MainActivity

# iOS simulator reaches the Mac's localhost directly.
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -derivedDataPath data/ios-build CODE_SIGNING_ALLOWED=NO build
# Or open Xcode and select a simulator:
npm run ios:open
```

`mobile:sync` builds into ignored `dist-native/`, records the endpoint and copies
assets/plugins to both projects. Run it after EVERY web change or plugin change.
It does not change `dist/` or the web app's same-origin API configuration. Never
hand-edit generated Capacitor plugin manifests. Android `local.properties` and
all signing files remain untracked.

HTTP is allowed only in explicit loopback development builds; Android's release
manifest denies cleartext. iOS permits local networking but has no arbitrary-load
ATS exception. A physical iPhone should use your owned HTTPS staging origin.
Native API requests use Capacitor HTTP and its platform cookie store; secrets are
not put in localStorage. CSRF/session/ownership checks still run on the server.
The cookie model is for this demo account system; the production wallet provider's
native authentication and secure recovery integration still need acceptance.

Android Back dismisses help/transactions, returns to Wallet, then minimizes the
app. Resume refreshes balances. Statements use the native share sheet and a
private app-cache file, not an external unauthenticated download URL. The
3D scene has a non-WebGL fallback and respects reduced motion. A network timeout
must never be interpreted as a completed payment.

### Device acceptance checklist

Run on a physical iPhone and Android phone against HTTPS staging, as well as
simulators. Record device, OS, app version, backend SHA and result for each:

- Setup overlay, keyboard, small screens, rotation, safe areas, large text,
  VoiceOver/TalkBack, reduced motion, lost WebGL context and slow graphics.
- Sign-in, restart/session expiry, logout, account recovery and recovery-code
  replacement; ensure another account never sees the previous account's data.
- Full fund → buy → sell → withdraw cycle; duplicate taps, network loss,
  background/foreground during each step, rejection, return, partial fill and
  provider timeout. Verify server records, not just the displayed animation.
- Share/export and cancel sharing. Export cache files older than 24 hours are removed at next app startup, resume or export; verify recipient access before cleanup.
- Account closure, help, Android Back and links. Production OAuth/KYC/payment
  callbacks must be tested with verified App Links/Universal Links and state/PKCE;
  those provider callback handlers are NOT implemented yet.

## 4. Deploy an HTTPS staging backend

Staging is still a simulation. Choose an owned domain, hosting account, managed
PostgreSQL 17 with TLS/backups, and a secret manager. Do not use a laptop, PGlite,
or an exposed PostgreSQL port as production infrastructure.

1. Build an immutable image from a reviewed commit: `docker build -t blunts:SHA .`.
2. Provision a private managed PostgreSQL database; separate staging and live
   databases, secrets and provider projects. Configure TLS verification through
   the database connection's supported settings; do not disable verification.
3. Set `HOST=0.0.0.0`, `PORT=8740`, `MONEY_MODE=simulation`, the private
   `DATABASE_URL`, and `APP_ORIGIN=https://YOUR_OWNED_HOST` in the platform secret
   manager. These are process variables, not Vite variables or Git files.
4. Route HTTPS to port 8740. Apply edge request/body limits and abuse protection.
   The API deliberately does not trust arbitrary forwarded IP headers; its local
   IP limiter may group all reverse-proxy users. Review proxy trust and a shared
   limiter before a public launch. Never blindly trust `X-Forwarded-For`.
5. The app applies additive migrations under a PostgreSQL advisory lock on
   startup. Back up before deploying schema changes. Check migration duration and
   schema compatibility in staging; use a dedicated migration role/release job
   before a production rollout, then least-privilege runtime credentials.
6. Verify `/api/health`, the UI, cookie flags, rejected foreign origins and the
   complete simulated cycle. Health currently proves database reachability;
   monitor worker/reconciliation separately. Only `dist/` is public.
7. Connect uptime checks, redacted application/worker logs, error alerts and a
   named on-call operator. Use managed database connection and disk alerts.
8. Restrict staging access at the edge until abuse controls and operating
   procedures are accepted. Set no real-money provider keys in this release.

For a local container exercise only:

```sh
# POSTGRES_PASSWORD must be set securely in the shell and URL-safe.
# Explicitly exclude the unrelated creative-tool .env from Compose interpolation.
docker compose --env-file /dev/null up --build
```

Keep database state across application releases. A rollback switches the app image
to the previous compatible SHA; it must not delete a volume or restore an older
database over transactions accepted since that backup. Test restoration into a
separate database first, reconcile it, and obtain an operator decision before
cutover. Stop new admissions/transactions at the edge for an incident; already
submitted provider transactions still require observation and reconciliation.

## 5. Finish the real-money implementation — required engineering

These are unfinished adapters and controls, not environment flags. Do not remove
the live startup refusal until the evidence in this table exists.

| Workstream | Build / configure | Acceptance evidence |
|---|---|---|
| Real identity and wallet | Privy or selected provider projects; verified email/passkey/MFA; dedicated user wallets on Arbitrum; native auth, signing, key export/recovery; gas sponsorship | Signatures from the correct user's wallet, recovery on a second device, revoked-session rejection, scoped transaction approval |
| Funding and payout | MoonPay signed checkout/off-ramp adapter; enabled native USDC/Arbitrum buy AND sell; exact Cash App partner entitlement; verified raw-body webhooks and provider status lookup | Real provider sandbox funding/withdrawal, wrong-chain/address rejection, duplicate/out-of-order events, reversals and timeouts |
| Investments | Approved Dinari US API v2 program, enabled instrument/network, customer enrollment/KYC/agreements, quotes/NBBO, orders, fills, settlement, corporate actions, documents | Provider-approved UI and an end-to-end eligible account cycle; no fixture price or DEMO_QQQ left on the live path |
| Distributed execution | Durable pre-submit commands, I/O outside database transactions, external idempotency, event inbox deduplication, replay-safe transitions and polling reconciliation | Crash before submission, after external acceptance, before local commit, webhook before response, repeated events and provider outage all reconcile once |
| Accounting | Native USDC six-decimal base units, actual instrument precision, actual price/rounding/fees; separate market value from withdrawable settled cash; chain finality/reorg handling | Independent ledger-to-provider/chain reconciliation and precision/property tests |
| Risk and operations | Required funding-source/sanctions screening, limits, restricted-account operations, step-up authentication, staff RBAC and audited administrative actions | Provider/risk acceptance, incident exercises, alert delivery, disputed/returned transfers handled |
| Data and support | PII encryption and retention/deletion policy, real support routing, privacy/terms/account deletion, statements/tax documents from provider | Security review, actual deletion/support test, provider document delivery |
| Release | HTTPS deployment, production secret management, rollback/restore rehearsal, signed mobile builds | Exact-SHA release evidence plus supervised small live pilot with explicit owner authorization |

The existing simulator observes and journals inside ONE local database
transaction. An external provider cannot share that atomic transaction. Do not
replace `simulator.observe()` with an HTTP call and call it production-ready.
The current cents/$500 fixture math must also be replaced, not renamed.

### Account setup and decisions the owner must supply

No credentials should be pasted into chat or committed. Put them in the selected
host's secret manager and grant the deployment identity scoped access.

- Legal entity and intended customer countries/states; owned domain and support
  address; named business, security and operational owners.
- Wallet-provider project, permitted web origins, iOS/Android identifiers,
  native SDK/OAuth callback setup and recovery/signing authority decision.
- MoonPay partner verification and credentials, webhook secret, approved origins
  and explicit confirmation of Cash App/native-USDC/Arbitrum IN and OUT support,
  limits, total fees and investment-related use. Consumer support is not proof
  that our partner checkout is enabled.
- Dinari US partner agreement/KYB, enabled sandbox/live projects, accepted
  instrument/network and 1% compensation model, UI approval and operational
  contacts. Confirm direct costs, settlement timing and market-hours behavior.
- Apple organization developer membership/App Store Connect and Google Play
  organization account, role access, bundle/package ownership and signing assets.
- Hosting/managed PostgreSQL/backup/monitoring accounts and production budget.

The proposed provider credentials are not consumed by this code yet. Adding
`MOONPAY_*`, `DINARI_*` or `PRIVY_*` variables alone does nothing.

### Product and provider gates

Keep one chain and one investment first. Prove deposits and withdrawals before
introducing trading. The main scene keeps the blunt/band counters, balance, and Fill / Spark.
Funding and withdrawals belong inside those two flows. Show total fees and settlement expectations before the
user confirms; do not hide provider-required disclosures to achieve minimal copy.

[Dinari US requirements](https://docs.dinari.com/docs/us) describe dedicated
wallets, customer verification, partner/UI approval and restricted US dShares.
Use its managed funding route only after acceptance; a public chain does not
make this a permissionless US securities service. Have counsel confirm the
actual entity/roles, offering, jurisdictions, custody, fees, marketing, retention,
complaints and money-transmission allocation against executed contracts.

[MoonPay's Cash App FAQ](https://support.moonpay.com/en/articles/755167-cash-app-faqs)
describes eligible US buy/sell support and a Cash App pricing component. Obtain
an all-in partner quote and confirm the exact network/asset combination. Keep
external provider costs distinct from Blunts' fee. Measure cost per funded user,
conversion volume, returns/fraud, support and acquisition cost before scaling;
the [research model](research/2026-10-02/business_model.py) contains assumptions,
not proven customer economics.

## 6. Backup, restore and incident operation

Use managed PostgreSQL PITR and encrypted backups for hosted environments. The
JSON tool below is a sandbox/operator export, not a full production DR system.
It contains private account hashes and records, writes mode 0600, refuses file
overwrite and excludes sessions. Do not email snapshots or put them in Git.

```sh
# For PGlite, stop the app before opening the same directory from another process.
npm run db:backup -- backup /private/backups/blunts-snapshot.json
# Restore ONLY into a new empty database/directory:
DATABASE_URL=data/restore-check npm run db:backup -- restore /private/backups/blunts-snapshot.json
DATABASE_URL=data/restore-check npm run ops -- reconcile
DATABASE_URL=data/restore-check npm run ops -- status
```

Compare account/intent/journal/posting counts and balances, verify sessions are
absent, sign in again and run a full cycle against the restored store. Record RPO,
RTO and operator. Rehearse this before launch and regularly afterward.

- On an unknown transaction: retain the original intent/idempotency key and look
  it up. Never create a second instruction merely to dismiss a pending state.
- On reconciliation failure: stop new actions, preserve logs/snapshot, inspect
  provider/chain evidence, leave affected accounts restricted. Correct with
  compensating entries; never edit journals/postings to force a match.
- `npm run ops -- release-hold USER_ID` releases only a reconciled, nonnegative
  sandbox account. This CLI is not production staff authorization.
- On compromise: restrict ingress, revoke sessions, rotate impacted secrets,
  preserve evidence, notify designated provider/security contacts through the
  approved incident process, and reconcile before reopening.
- Define and test alert thresholds for oldest pending/unknown intent, worker
  failures, reconciliation mismatches, provider latency/errors, auth abuse and
  payout return rates. Log no passwords, tokens, recovery codes or raw KYC data.

## 7. Produce and publish mobile releases

Use an owned HTTPS staging endpoint first. Never ship the loopback development
bundle. `mobile:release-check`, Android release validation and the iOS Release build phase reject it. These
checks validate the endpoint, not regulatory clearance or live readiness.

```sh
MOBILE_API_ORIGIN=https://YOUR_OWNED_HOST npm run mobile:sync
npm run mobile:release-check
# Android: configure signing in Android Studio or injected Gradle signing config.
npm run android:bundle
# AAB: android/app/build/outputs/bundle/release/app-release.aab
# iOS: select your team, signing and release destination in Xcode.
npm run ios:open
```

Android signing is intentionally not populated with a developer's private key.
Create/retain an upload key under organizational control, use Play App Signing,
store credentials outside the repository, and increment `versionCode` for each
upload. This app targets SDK 36. Verify the current [Play target requirement](https://support.google.com/googleplay/android-developer/answer/11926878)
at submission. Validate a signed AAB with bundletool, distribute on an internal
track, then complete the account's required testing and production access steps.

For iOS, set the organization's Team and bundle ID, increment version/build,
select a supported Xcode/SDK and Archive → Validate → distribute to TestFlight.
Review [Apple's current submission requirements](https://developer.apple.com/news/upcoming-requirements/).
The included privacy manifest declares the filesystem timestamp access reason;
it is not a complete declaration for future analytics, KYC or wallet SDKs.
Re-audit third-party SDK manifests and App Privacy responses after integrating
providers. Recheck export-compliance answers for the final cryptographic stack.

Both stores require accurate listings, screenshots from the actual app, support
and privacy URLs, account access for reviewers and applicable financial-service
information. Complete Google Play Data Safety, Financial Features and account
deletion declarations; complete Apple's privacy, age rating, account deletion
and review information. Review [Apple financial/crypto rules](https://developer.apple.com/app-store/review/guidelines/)
and [Google Play financial services policy](https://support.google.com/googleplay/android-developer/answer/9876821)
with the actual provider/territory model. A thin wrapper, unavailable backend,
misleading simulated balances or unsupported financial claims are not an
acceptable submission. The brand and 3D imagery also need accurate age-rating
and marketing review. Do not add unnecessary contacts, location, storage or
tracking permissions.

Provider OAuth/KYC/payment handoffs may require native SDKs/system browser
sessions. Implement and test these with verified Universal Links/App Links,
allowlisted hosts, state/PKCE, cancellation and process-death recovery. Never
trust a return URL to credit funds. Store screenshots and release notes must
match the final funded functionality, not this demo.

## 8. Release acceptance and rollout

1. All rows in section 5 have named owners and evidence; provider/commercial and
   jurisdiction decisions are signed off. All secrets and callbacks are tested.
2. CI is green at the exact SHA. Independent security review, restore/incident
   drills and physical-device tests are complete. Public policies/support work.
3. With explicit owner authorization, execute a small real-money pilot including
   cash-out. Compare chain/provider evidence, fees and statements to the ledger.
4. Keep onboarding constrained during the pilot, set real risk limits and a
   rollback decision maker. Expand only after reconciled operation and measured
   economics. Do not use the sandbox's $1M test input bound as a live risk limit.
5. Publish web first, then signed mobile beta, then stores after review. Track
   backend SHA, mobile build numbers, migrations, approvals and rollback image.

## Repository map

- `app/client/`: shared UI, 3D tray, native transport/lifecycle/share integration.
- `app/server/`: API, demo auth, ledger, worker, reconciliation, backups and ops.
- `app/tests/`, `app/e2e/`: backend and browser acceptance scenarios.
- `android/`, `ios/`, `capacitor.config.ts`: native source and configuration.
- [Implementation record](docs/browser-implementation.md): behavior and evidence boundaries.
- [Research dossier](research/2026-10-02/README.md): market, fees, provider comparisons,
  financial/legal assumptions and detailed implementation plan.
- `prototype/`, `brief/`, `ad/`: historical creative assets/tools. They use older
  financial assumptions and are not the live app. Serve only a prototype directory
  with `python3 -m http.server 8731 --bind 127.0.0.1 --directory prototype`.

Creative tooling uses `requirements.txt`, FFmpeg and separately configured API
keys; running it may incur provider charges. It is not part of app deployment.
