# Local review — October 27, 2026

Local branch: `codex/local-review-20261027`, based on upstream `98355ee`.
Cloud-backed preview: `http://localhost:8745`. Offline scene review remains at
`http://localhost:8740`. Nothing has been pushed or deployed.

## Source context

- [October 26 request to finish the app](https://x.com/shawmakesmagic/status/2114736384120700972).
- [Original app announcement and video](https://x.com/shawmakesmagic/status/2112391602136392121).
- [Owning repository](https://github.com/lalalune/blunts).
- Retrieved 46 unique posts across both root posts, replies and nested discussion;
  conversation searches were paged until empty. Two reply providers were checked.
  X's reported counts exceed the available results, so this is not a complete
  archive of every reply, quote, deleted post or unindexed item.
- The local source record is ignored under `data/review-20261027/`. It is research
  evidence, not app content. Third-party financial/token allegations in the
  discussion were not verified and are not used as product facts.

## Project map

Blunts is a 3D savings/investing ritual implemented as a persistent simulation.
React owns the account and transaction UI; Three.js owns the tray animation.
Fastify serves the API and built assets. PGlite supplies local PostgreSQL; a
server PostgreSQL adapter is available. Capacitor supplies iOS/Android shells.

Reviewed the runtime modules for account/session/recovery, request transport,
database/migrations, quote/intent/flow execution, ledger/reconciliation,
backup/operator tooling, scene integration, amount sheets, and browser scenarios.
The historical prototypes, research dossier, creative scripts and native source
were inventoried. This is not a line-by-line audit of every shader, historical
artifact, dependency, or physical-device behavior.

Run with Node 24: `npm ci`, `npm run build`, `npm start`.
Main checks: `npm run check`, `npm run test:e2e`, `npm run format:check`.
Historical checks: Python unittest discovery and `tests/prototype.test.cjs`.
Upstream has no open issues or pull requests as observed on October 27.

## Local changes

- Add a separate local-only Dinari/MoonPay workbench: signed test checkout URLs,
  buy quotes, transaction/request/order lookup, exact-decimal validation, raw-body
  callback authentication, durable prepare/unknown records and event deduplication.
  Sandbox API requests are bound to the current first-party user/wallet and use
  server-side Dinari account mappings. The tray's money remains simulated.
- Complete the previously inaccessible cash-out UI using the existing quote and
  payout intent API. A cash-only account can now reach a zero balance and closure.
- Keep the payout quote and idempotency key across close/reload/network failures;
  require the demo password again without saving it, or a verified first-party session. Retry the same instruction,
  including after provider acceptance with a lost response.
- Preserve the two-action tray: Spark opens cash-out when only cash remains.
- Restore the prototype's five-step walkthrough, with back/next, swipe and
  keyboard navigation, ETF explanation, current demo fee arithmetic, value-to-band
  units, loss-risk explanation and a precise Spark/payout distinction. Historical
  performance claims and the superseded profit fee are not presented as current.
- Replace the ambiguous dotted Fill mark with the same Lucide BanknoteArrowDown icon on both controls.
- Validate malformed and excessive Fill/Spark amounts while the sheet is open.
- Connect Cloud/direct Steward email sign-in, TOTP/SMS continuation, wallet provisioning, encrypted server-side tokens, issuer/subject binding, refresh leases and sign-out.
- Add direct email-code resend, a one-minute cooldown, accurate six-digit email
  validation and dictation focus after errors, resend and MFA continuation.
  Browser requests now time out after 20 seconds without automatic retries;
  timed-out money instructions remain subject to their durable recovery path.
- Never replay a possibly consumed refresh token after a crash or timeout; require fresh sign-in without revoking the owner's unrelated sessions.
- Reduce idle polling from 1.5 to 15 seconds, pause hidden tabs and preserve last verified balances on failure.
- Identify simulated money before signup and in the action sheet; correct Help's
  claim that Spark itself sends funds externally.
- Update 11 dependency packages within the existing constraints. npm audit
  reports zero known advisories after the update.
- Preserve the original tray, fonts, palette, rolling/banding/burning animations,
  account records and simulation-only startup refusal.

The new browser scenario exercises the whole $100 fill → $99 investment →
$98.01 settled sale → payout loop, excessive amount rejection, destination setup,
lost payout response, reload, a password-free saved instruction, matching retry
keys and exactly one payout intent.

Creative work is held separately in [creative-proposals.md](creative-proposals.md).

## What approval can release

A reviewed hosted **simulation** can be the next release scope after the owner
selects the exact destination, access policy and release commit. Confirm the
owner's redistribution permission: this checkout has no license file, and GitHub
reports no detected license. The public offer in the post is useful context but
does not specify a repository license.

## Verified checks

- Provider workbench follow-up: the full backend run passed 40 tests with one
  optional PostgreSQL case skipped, including the actual local Steward service.
  The 14 provider-focused cases passed again after the final reconciliation race
  and US-account eligibility checks. Coverage includes the official MoonPay HMAC
  vector, quote totals/expiry, precision, wrong owner/wallet/currency/amount,
  duplicate identifiers, raw-byte signatures, stale callbacks, process restart,
  abandoned/concurrent preparation, observation ordering, and no ledger credit.
- The expanded unattended browser test passed all three engines in 1.9 minutes:
  actual main-process sandbox routes, genuine local Steward login, locally
  generated test URL, synthetic authenticated callback/replay, unchanged app
  balances, then the original demo cycle and same-wallet re-login. No placeholder
  key was sent to an external provider. WebKit took one bounded issuer-rate-limit
  backoff and recovered the saved Fill. A test-runner hard stop initially left
  the deliberate crash lock; its recorded process was confirmed dead, only that
  stale lock was removed, and graceful test-server shutdown was configured. No
  journal was removed and no security/rate limit was relaxed.
- Fresh provider-access check: both developer portals are signed out and the
  credential qualifier reports both sets of sandbox keys missing. No external
  provider project, permit, order, checkout session or settlement was accepted.
  Inspected local Steward source rejects permit-style signing; this is a real
  integration boundary, not a missing feature flag to turn on unsafely.
- Unattended real-service acceptance: `npm run test:local-services` passed on
  desktop Chromium, mobile Chromium and WebKit (three full-cycle scenarios,
  50.7 seconds). Each uses actual local Steward/API/database, the test-only mock
  inbox and a unique synthetic address: email request/resend, sign-in, sandbox
  onboarding, provider-provisioned wallet, reload continuity, $100 Fill → $99
  investment → $98.01 sale → settled payout to zero, sign-out and sign-in to
  the same subject/handle/wallet with the same four completed intents. Server
  cash, units and completed states are checked independently of the available
  cash displayed in the tray. No owner email, microphone, manual verification,
  external financial provider or real funds were used. Initial harness runs
  exposed two incorrect test assumptions (manual wallet creation and zero
  available cash equaling settled cash); both were corrected before the final
  three-engine pass. The build and formatting checks passed. Screenshots and
  a receipt are preserved under ignored `data/review-20261027/`.
- October 27 sign-in recovery follow-up: nine targeted browser checks passed
  across desktop Chromium, mobile Chromium and WebKit for an unanswered request
  reaching the browser's own timeout, expired-code recovery, failed/successful
  resend, cooldown and MFA code/focus handling. These are UI transport fixtures,
  not external email delivery or owner-account verification. Serious/critical
  accessibility checks passed on the email-code state; desktop and mobile
  screenshots were visually inspected. TypeScript/Vite and formatting passed.
- The new accepted-Fill timeout case and the existing lost-response cash-out
  case passed on all three engines against the actual local simulator/API. No
  automatic money replay occurred on timeout; reload used the same instruction
  key and produced exactly one flow. The grouped money-recovery run passed eight
  of nine cases; the remaining older WebKit case was rate-limited during signup,
  before its money scenario. Its isolated WebKit rerun passed. Product rate
  limits were not relaxed for the test batch.
- 23 backend tests passed with actual isolated PostgreSQL 17.10 and the real local Steward service; no skips. The session-root controls verify restart stability, restrictive permissions, symlink refusal and preservation of rejected files.
- The full browser suite passed 16 cases, with two intentional engine skips for the desktop-only full-motion scenario. After restoring cash-out behind Spark, its recovery case passed on all three engines.
- The restored walkthrough separately passed on desktop Chromium, mobile Chromium
  and WebKit: button/keyboard/swipe navigation, first/last bounds, fee examples,
  ETF details, risk and payout explanation, completion/reset and serious/critical
  accessibility checks. The web build and both native development builds passed
  again with the walkthrough included. Screenshots and build logs are under the
  ignored `data/review-20261027/tutorial-*` evidence paths.
- TypeScript/Vite build, formatting, dependency audit, 13 Python tests, six historical prototype tests and deterministic model comparison passed.
- Android debug and iOS simulator builds passed. A fresh iOS 27 simulator completed native email-code sign-in, onboarding and Fill; its session and $24.75 balance survived process termination/relaunch. The same native session completed Spark, test-destination creation and cash-out to zero; screenshots are retained in the ignored evidence directory. These are not physical-device/store tests.
- The container completed an actual HTTP Fill/Spark/payout simulation with four completed intents and zero ending balances. Its live-money startup refusal was verified. The PGlite-only container fixture required a 1536 MiB limit; the first 512 MiB attempt was killed by the container memory limit. Hosted deployments should use server Postgres as documented.
- Public Cloud health and login-provider discovery returned HTTP 200. No owner credentials were used, no Cloud credits changed, and no organization key was minted. Owner-account sign-in remains pending.

A real-money release remains unfinished. `app/server/providers.ts` only selects
the deterministic simulator. Wallet signing/recovery, payment partner funding and
payout, investment enrollment/KYC/orders/settlement/documents, remote-event
reconciliation and operational acceptance still require implementation and
enabled provider access. Credentials alone do not implement those integrations.
See README sections 5 and 6 for the owning integration and operation backlog.

The owner subsequently authorized free developer signup setup and MoonPay's
displayed signup terms. Both submissions reached email verification; the current
access state is in [provider-sandbox-acceptance.md](provider-sandbox-acceptance.md).
No token action, public post, push, PR, deployment or store submission is
authorized by this local review.
