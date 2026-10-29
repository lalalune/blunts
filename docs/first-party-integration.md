# First-party identity and wallet integration

Blunts uses Eliza Cloud's existing `/steward` login gateway by default. It can
also address an owned Steward deployment directly. The same tray and React app
run in the browser and Capacitor shells; no Alpha UI or other product identity
was imported.

## Run against the owned Cloud gateway

```sh
npm ci
npm run build
npm start
```

The default gateway is `https://api.eliza.app/steward`. For an explicit deployment:

```sh
AUTH_PROVIDER=eliza-cloud ELIZA_CLOUD_API_URL=https://api.eliza.app npm start
```

Use `ELIZA_CLOUD_WEB_URL` for a non-default account-management frontend. Direct
Steward mode uses `AUTH_PROVIDER=steward`, `STEWARD_API_URL` and optionally
`STEWARD_WEB_URL`. Service URLs must be HTTPS or loopback development endpoints.
The optional `/steward` prefix is preserved deliberately; invalid configuration
fails closed rather than silently selecting a different identity service.

In production, set `STEWARD_SESSION_ENCRYPTION_KEY` to a base64-encoded 32-byte
random key in the host's secret manager. Every replica needs the same persistent
key. Development creates a mode-0600 key file under ignored `data/` instead.
The app does not load the repository's creative-tools `.env`.
On restart, the development key reader refuses symlinks, non-regular files,
wrong-size keys, other file owners and group/world-readable permissions. A
rejected existing root is preserved; startup never replaces it with a fresh key.

## Wire and trust boundaries

1. The browser sends an email/code or MFA continuation to same-origin Blunts
   routes. These mutations require the existing exact-Origin and request-marker
   checks and are rate-limited.
2. The Blunts server calls the configured login service. Cloud's existing proxy
   owns request signing and upstream tenant configuration. No platform key or
   Cloud organization API key is requested by Blunts.
3. The server verifies the resulting identity through the authenticated
   `/user/me` route. When a Cloud login starts in its app tenant, the supported
   `/auth/refresh` tenant switch requests the user's personal scope; upstream
   membership checks remain authoritative. The verified subject must stay fixed.
4. A local identity is keyed by exact issuer URL and verified subject, never by
   a client-provided user ID or an assumed email match. Existing demo accounts
   are not automatically linked or merged.
5. Blunts returns an opaque HttpOnly/SameSite session cookie and CSRF value.
   Access and refresh tokens stay on the server, AES-256-GCM encrypted with
   issuer/session-bound associated data. HTTPS enables secure cookies.
6. Each authenticated request verifies the upstream personal identity. One
   durable lease allows one refresh rotation at a time. An interrupted/expired
   lease discards only the local session and requires fresh sign-in: replaying
   a possibly consumed token could revoke the owner's other Cloud sessions.
7. Logout clears the local session even during an issuer outage and reports
   whether issuer revocation succeeded. It does not claim an upstream logout
   when that request failed.
8. Wallet provisioning uses the current user's personal wallet endpoint and
   returns only its confirmed address/agent ID. No raw key, transaction signing,
   wallet transfer, brokerage order or unrestricted upstream proxy is exposed.

The provider owns keys and recovery according to its deployed custody model.
Steward's local encrypted storage is operator-held custody; this integration
does not establish non-custodial operation. Blunts exposes email login and
TOTP/SMS continuation; it does not claim acceptance of every provider login
method or physical biometric device.

Email sign-in includes a resend action with a one-minute client cooldown, in
addition to the server and issuer rate limits. An unsuccessful resend preserves
the current code; a successful request clears it. Focus returns to the enabled
code field after each attempt and MFA continuation, including for dictation.
The browser transport aborts unanswered requests after 20 seconds and reports an
uncertain result without automatically retrying. Existing durable money-flow
instructions retain their original idempotency keys when a response is lost.

Snapshot format 3 retains identity mappings but excludes all local sessions and
encrypted upstream sessions. Restore requires a new empty database and fresh
sign-in. Wallet-service backups remain separate from the Blunts ledger backup.

## Offline and genuine local-service acceptance

Use `AUTH_PROVIDER=demo npm start` for the fully offline password-based wallet.
Compose and automated browser fixtures select this mode explicitly.

To exercise the real local Steward auth/wallet API without external messages:

```sh
# In an isolated Steward source checkout, using its committed lockfile:
bun install --frozen-lockfile --ignore-scripts
bunx turbo run build --filter=@stwd/api...

# Back in Blunts; this launcher owns only its ignored local test data.
node scripts/steward-local.mjs /absolute/path/to/isolated/steward
TEST_STEWARD_URL=http://127.0.0.1:8743 npm test
```

The launcher intentionally starts `NODE_ENV=test`, mock email/SMS and a separate
PGlite directory, with distinct protected secrets. It does not inherit deployed
database, Redis, mail-provider or wallet-root credentials. The optional test
refuses a non-loopback service and reads only that service's test-only mock inbox.
This proves the actual service transport, wallet provisioning, identity/session
handling and a simulated financial cycle; it does not prove external email
delivery or a live financial integration.

For unattended browser acceptance, keep that isolated service running, build
Blunts, then run:

```sh
npm run build
TEST_STEWARD_URL=http://127.0.0.1:8743 npm run test:local-services
```

This separate Playwright configuration starts Blunts on loopback port 8750 with
its own database, ephemeral session-encryption key and actual Steward BFF. It
binds only to loopback and refuses remote issuers. Before any
email request, the test checks the synthetic address's inbox for the specific
test-only empty-inbox response. A disabled inbox route fails the test instead
of attempting delivery. It uses random `example.test` addresses and reads only
their isolated mock inboxes; it never reads the owner's mailbox or changes
Voice Control/microphone settings. No provider API calls or real money are
involved. HTTP traces are disabled for these real local test sessions.

The current test also opts into the local provider API with explicitly invalid
synthetic MoonPay keys. It constructs a test URL and replays a locally signed
callback through the actual HTTP server, verifying that neither callback nor
replay credits the app. It never opens that URL or sends those keys to MoonPay.
Inherited Dinari credentials/bindings are cleared in the test child process.
When the shared loopback issuer throttles the Fill request, the test performs
one 60-second backoff and reloads to recover the existing instruction. It keeps
the issuer's rate limits intact and still requires four settled intents.

The scenario covers email-code request/resend, sign-in, sandbox onboarding,
Steward wallet creation, reload continuity, Fill/Spark/payout to zero, sign-out,
and a second sign-in to the same identity and wallet. This is a first-party
service acceptance path, not Dinari/MoonPay acceptance. It runs on desktop
Chromium, mobile Chromium and WebKit independently of the demo-auth browser
suite.

Transport budget: one fixed upstream request, 15-second timeout and a hard
128-KiB body bound. A Cloud app-to-personal exchange can require one failed
scope check, one refresh and one verified identity check. Normal account reads
perform one identity check, with one additional rotation near expiry. Browser
cadence and measurements are in [refresh-budget.md](refresh-budget.md).

## Source qualification

- Steward-Fi/steward `develop`: `297437b23f05fba4bafee1da63908bfcbec72830`.
- Inspected Eliza Cloud source: `7b4d953b9b8`, including
  `packages/cloud/api/src/steward/embedded.ts` and the owned `packages/login`.
- Inspected Alpha source: `fda82ec3cdc08507fc5b6d3ee6ea3013ce13f86c`, particularly
  `apps/app/src/runtime/cloud-protocol.ts`.

Cloud's owned login README records its Steward derivation at
`7a977336687217e2601b77c20c3d343e540b9c14`. These source observations are distinct
from the deployed version. Credential-free health/provider reads returned 200;
an actual owner-account sign-in still needs acceptance through the app.

## Financial-service boundary

The inspected Steward ramp registry installs mock on/off-ramp adapters. The
inspected Cloud payment routes purchase service credits and handle platform
billing. No executable QQQ/ETF brokerage integration was found in those paths.
Neither Cloud credits nor a wallet address are treated as an investment balance.

`MONEY_MODE=live` continues to refuse startup. Real funding, approved investment
orders, settlement, payouts, documents and reconciliation require an actual
investment/payment provider and its accepted account/program. Selecting Cloud
for identity and hosting does not fill that missing service boundary.

Provider-document recheck on October 27 confirmed the remaining access boundary:
[Dinari's US program](https://docs.dinari.com/docs/us) requires partner
verification/agreement, approved UI, customer onboarding and API v2 access.
[MoonPay's on-ramp setup](https://dev.moonpay.com/widget/on-ramp/overview)
requires its account/API keys and has a separate sandbox flow. No such enabled
Blunts projects have been supplied; the owner confirmed they do not currently
have these projects. Steward/Cloud ownership does not establish either service.

Once an actual provider/program is selected and enabled, the next implementation
must replace the simulator with provider-backed account enrollment, authoritative
quotes, user-approved orders, funding/payout status, documents and reconciliation.
The owning code is still unfinished, not merely waiting for environment values.
Testing must cover a complete eligible sandbox cycle and distributed failure
windows before any authorized live pilot. Until then, this application's login
and wallet integration is independently usable, but its investing objective
remains incomplete. The owner subsequently authorized free developer signup
setup, including MoonPay's displayed terms; both forms reached email
verification. See the current signup state in
[provider-sandbox-acceptance.md](provider-sandbox-acceptance.md). No completed
partner enrollment or enabled trading access has been observed.

The selected engineering path is the existing Dinari/MoonPay candidate from
Shaw's repository. Dinari's official `@dinari/api-sdk` is pinned to 0.15.0.
`npm run providers:check` performs a read-only sandbox qualification using
`DINARI_API_KEY_ID` and `DINARI_API_SECRET_KEY` from the process environment.
It makes at most two GET requests: partner identity and a QQQ-filtered instrument
query. It rejects non-partner identities and malformed/duplicate instrument
responses, and checks tradability, fractional support and an Arbitrum Sepolia
token mapping. These checks do not establish customer eligibility, production
support, fee approval, funding acceptance, or successful orders/settlement.

Its output now contains separate Dinari and MoonPay results; MoonPay additionally
performs a test buy-quote GET only when all required keys are present. The new
[provider workbench](provider-sandbox-workbench.md) describes the separate local
HTTP/CLI adapters and their remaining signing, onboarding and settlement gates.

The endpoint is pinned to Dinari's sandbox even if `DINARI_BASE_URL` is set;
redirects, automatic retries and SDK logging are disabled. The output contains
classifications rather than raw errors, secrets, partner identities or account
records. Without credentials it exits 2 and makes no requests. The transport
tests exercise the real official SDK against synthetic responses; an enabled
partner sandbox remains necessary for actual provider acceptance. This operator
command is not exposed as a browser endpoint and does not switch `MONEY_MODE`.
