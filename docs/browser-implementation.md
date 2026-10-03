# Browser implementation and acceptance record

October 3, 2026. This is an implemented, durable **simulation**, not a funded financial service. The live-money switch deliberately refuses startup. The local application has no connection to real Cash App, MoonPay, Dinari, a wallet signer, chain RPC, or actual ETF holdings. These are not implied by the browser test results.

## What is implemented

- React/TypeScript/Vite browser UI, mobile layout, accessible native dialogs, keyboard paths, reduced-motion behavior, explicit fixture-price/simulation disclosures and provider status.
- Fastify API, strict request schemas, owner-scoped queries, same-origin/CSRF protections, no-store account responses, CSP, HTTP-only sessions, request rate limits, scrypt passwords and one-time recovery codes. Account recovery rotates the code and revokes all previous sessions. This is **sandbox handle authentication**, not verified email, KYC, passkeys or a user-controlled cryptographic wallet.
- PostgreSQL migrations and a server-Postgres adapter. A file-backed PGlite database runs locally without a database installation. Only one process may open a particular PGlite directory. Use server Postgres for concurrent replicas. Financial mutations take a transaction-level advisory lock in server Postgres; this deliberately trades throughput for simple sandbox correctness.
- Integer cents and micro-units, server-stored expiring quotes, uncapped 1% conversion fees, no fee on deposits/payouts, reservations against concurrent spending, idempotency fingerprints, single-use quotes, cumulative partial fills and full-unit exits. USDC in this simulation is cent-denominated; production chain accounting must support native six-decimal USDC and real instrument precision.
- Durable intents serving as the work queue; deterministic provider submission/lookup; visible unknown, rejected, partially-filled and settlement-pending states. Restarting the worker resumes jobs. Funding requires its own user authorization and never auto-invests.
- Balanced multi-asset postings with separately balanced cash and instrument entries. Database triggers prevent update/deletion of journals, postings, activity and consents; corrections append compensating entries. Reconciliation compares completed intent amounts with posted customer changes and restricts accounts on material mismatches or negative available balances.
- Simulated destination registration and payout password confirmation; rejected payouts release reservations, returned payouts restore funds, spent funding returns restrict the account. Unsubmitted commands stop when the account is restricted. Already accepted commands still require reconciliation.
- Activity, test scenario controls, account-scoped downloadable JSON statements, local support cases, zero-balance/pending-action closure checks, revoked sessions on closure, private snapshot/restore tooling and operator status/reconciliation commands.
- Locked npm dependencies, TypeScript build, unit/integration tests, browser automation, axe accessibility checks, PostgreSQL CI service, browser artifacts, Dockerfile and local Compose configuration.

The simulator is selected through `app/server/providers.ts`. Its deterministic provider record and application journal share the database transaction. This makes crash recovery testable but is **not evidence of distributed atomicity with an external provider**. A remote adapter needs a persisted pre-submit state, separate I/O, external idempotency, verified event inbox, polling reconciliation and acceptance tests for crashes between provider acceptance and local commit.

## Run and exercise

```sh
npm ci
npm run build
npm start
```

Open `http://localhost:8740`. Create a made-up handle and password, save the recovery code, accept the simulation terms, then:

1. Add money → review quote → confirm → authorize simulated deposit.
2. Fill → review the investment and uncapped fee → confirm.
3. Spark → sell all units → wait for simulated settlement.
4. Settings → add a test destination, confirming the password.
5. Withdraw USDC → select that destination → confirm the password and quote.
6. Download the simulated statement; verify the account can close at zero balance.

The UI's optional scenario selector exercises rejection, timeout-after-acceptance and partial fills. Activity allows a completed deposit/payout to be returned. These controls exist only because the entire deployment is simulation-only. No valid blockchain address is generated or accepted as a payment destination.

## Tests and evidence boundaries

```sh
npm run format:check
npm run build
npm test
npx playwright install chromium webkit
npm run test:e2e
python3 -m unittest discover -s tests
node --test tests/prototype.test.cjs
```

`TEST_DATABASE_URL` enables the additional server-Postgres integration test; use a fresh disposable database. The normal local test suite uses isolated embedded databases. CI starts a dedicated PostgreSQL 17 service. Browser tests cover desktop Chromium, emulated Pixel-size Chromium and desktop WebKit; these are not signed physical Android/iOS acceptance.

The browser suite checks a full cycle, fees above $10, refresh persistence, statement download, unknown submission recovery, rejection, modal dismissal, page exceptions and horizontal overflow. Axe checks selected wallet and quote states; these checks are not a full screen-reader or WCAG certification. Test screenshots and traces are generated under ignored `test-results/` and uploaded by CI, with synthetic data only.

Local validation on October 3: 13 API/domain tests passed with the optional Postgres test skipped in that invocation; the additional real PostgreSQL 16 full-cycle test passed separately. All six Playwright scenarios passed across desktop Chromium, mobile Chromium and WebKit. The 13 Python tests, six historical prototype tests, deterministic market-model comparison, TypeScript/Vite build, formatting check and dependency audit passed. Snapshot restoration matched one account, four intents, four journals and 14 postings; sessions were excluded and restored reconciliation passed. Desktop and mobile screenshots were visually inspected. Hosted CI repeats the app tests against PostgreSQL 17 and builds/smoke-tests the container; a local Docker daemon was unavailable.

## Operational runbook

Configuration is process environment; the repository's existing creative-tool `.env` is not loaded. See `infra/sandbox.env.example`. Keep `APP_ORIGIN` equal to the exact browser origin. HTTPS enables secure cookies and HSTS. A trusted HTTPS reverse proxy is required for hosted staging. The API does not trust arbitrary forwarded IPs; behind a proxy its local per-IP limiter may be shared across users. Configure a reviewed edge limiter before public use.

The app binds to loopback by default. `dist/` is the only served filesystem root. Do not serve the repository root: it contains local private configuration and creative artifacts. Health checks test database connectivity; inspect worker logs and reconciliation separately to assess money processing.

For server Postgres staging, set `DATABASE_URL` and use the managed database's required TLS configuration. The included Compose file is local sandbox infrastructure; its database port is not published. Set a URL-safe `POSTGRES_PASSWORD` in the shell before `docker compose up --build`. The container runs as the unprivileged Node user. Local Docker execution requires a running daemon.

Snapshots contain private account hashes and records. Store them encrypted with restricted access. The backup command creates new files with mode 0600 and refuses overwrite; it excludes sessions. Use managed PostgreSQL backups/PITR for real hosted retention, not this JSON snapshot as a production disaster-recovery strategy.

```sh
# Stop the app before opening its same local PGlite directory in another process.
npm run db:backup -- backup /private/backup/blunts.json
# Restore requires an EMPTY target database; never overwrites an existing store.
DATABASE_URL=data/restored npm run db:backup -- restore /private/backup/blunts.json
DATABASE_URL=data/restored npm run ops -- reconcile
npm run ops -- status
npm run ops -- reconcile
# Releases only reconciled, nonnegative sandbox accounts; never edits balances:
npm run ops -- release-hold USER_ID
```

On a failed/unknown action, inspect its durable intent and provider reference; do not insert a new action to make the UI look successful. On a reconciliation break, retain evidence and leave the account restricted. On compromise, stop the app, preserve a private snapshot, rotate credentials and revoke sessions before resuming. Restore test procedure: export, restore to empty target, reconcile, compare account/intent/posting counts and balances, and require users to sign in again.

## Remaining work: explicit scope, not a completed-launch claim

| Area | Still required | Evidence to close |
|---|---|---|
| MoonPay/Cash App | Partner sandbox access, exact USDC/Arbitrum currency/method combination, signed checkout adapter, verified raw-body webhooks, provider status and chain finality, off-ramp deposit flow | Actual provider sandbox cycle, then approved live evidence |
| Dinari US | Approved program/instrument/network/fees, API v2 adapter, required unmodified disclosures, enrollment/KYC, quotes/orders/fills/settlement, corporate actions and provider documents | Contract tests against enabled account and provider UI acceptance |
| Wallet | Selected project, real signer authority, recovery/export, native USDC/token identity, sponsored gas, destination verification and funding-source screening | Wallet-owned signatures and recovery on another device |
| Remote financial reliability | Provider event inbox, out-of-order/deduplication tests, distributed crash windows, real quote/market-hours precision, chain reorgs | Provider-backed failure suite and reconciliation |
| Production security/operations | Verified contact/MFA or passkeys, risk controls, managed key/secret storage, encryption/retention/deletion, staff RBAC, alert delivery, independent review and named operators | Security review and restore/incident acceptance |
| Hosting | Owned domain, managed hosting/Postgres/backups/secrets, edge controls and deployment access | Exact release running on approved HTTPS staging |
| iOS/Android | Native auth/wallet/KYC adapters, deep links, lifecycle/secure storage, signing identities, physical devices, publisher/declarations/review | Signed device acceptance and store approvals |
| Market/legal/provider | Existing dossier gates, provider eligibility and permitted fee/role, actual commercial quotes, measured customer economics | Written evidence and measured cohorts |

The current simulator's $1,000,000 per-action limit is a test exposure bound, **not a $10 fee cap**. A live program must set its own documented limits. The old creative prototypes remain historical artifacts and still have their old financial model; the new app is the implementation target.

This change implements the browser foundation and simulated vertical slice (F02 and substantial shared portions of F04–F06). It does not mark F01, real F03/F04 integrations, E10 funded release or native publishing complete. Provider credentials alone will not eliminate the remaining adapter and acceptance work.

## Minimal interface pass — October 3

Removed the landing pitch, fee chips, chain label, decorative wallet hero, repeated simulation paragraphs and status pills. The login opens directly on the account form. One persistent “Demo · no real money” line identifies the entire environment; transaction details and exact fees remain at confirmation. Sandbox consent is one explicit checkbox. Investment details are expandable, zero pending balances are hidden, and activity uses plain text. Live account verification and provider-mandated disclosures remain a distinct integration requirement; this copy change does not bypass them.
