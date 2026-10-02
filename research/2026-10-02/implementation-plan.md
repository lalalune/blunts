# Detailed implementation plan

October 2, 2026 · baseline `9e91c76d1d4f8905d83459e0afed551dce6e83c3`

**Objective:** turn the concept into a lawful, understandable, supportable US retail investing product, release funded web first, then signed iOS/Android apps. This document addresses the known concerns with decisions, implementation work and closure evidence. It does not mark unbuilt functionality or external approvals complete. The [requirements traceability register](requirements-traceability.md) maps every original audit item to a work package; the legal register L01–L26 adds current-law diligence.

## 1. Product boundary and decisions

Candidate v1: US adults in explicitly approved states, one approved instrument, individual accounts, one funding/payout rail, explicit user-confirmed orders, statements/taxes, support, recovery and closure. The brand/scene is optional presentation; core finance works without it. No performance fee, automatic investing, crypto trading, leverage, options, DeFi, own token, bridge, social ranking, referral rewards, multiple funding networks or subscription in the release baseline. Optional items are deferred explicitly, not forgotten.

Choose between direct broker-held fractional ETF access and an approved Dinari US arrangement based on evidence, not sunk research. Only select a chain after written US asset/network/funding approval. Working token-path spike: embedded EVM wallet on an approved low-cost chain, manual Cash App-origin USDC as a potential source. No standard Cash App Pay checkout. Legal scope and monetization must be decided together; a legally permissible zero-revenue route is not a viable business by default.

### Decision records required before production implementation

| ADR | Decision | Inputs and approval evidence |
|---|---|---|
| 001 | Direct brokerage versus tokenized instrument; asset and holder rights | Legal/program documents, approved customer explanation, withdrawal/wind-down behavior |
| 002 | States, age, tax residency and prohibited accounts | Counsel/provider eligibility matrix, server policy version and change procedure |
| 003 | Fee model and recipient | Signed commercial terms, legal analysis, customer schedule and revised model; no automatic right from API capability |
| 004 | Funding, custody and signing | Diagram of every wallet/account/signer and money movement; provider/AML/loss responsibilities |
| 005 | Publisher, brand and distribution | Financial institution arrangement, trademark/asset diligence, approved content strategy |
| 006 | App stack and wallet/KYC SDKs | Web + physical iOS/Android spike, auth/recovery/return-flow/performance evidence |
| 007 | Visual units and balance vocabulary | Principal/current value/withdrawable cash rules; moderated comprehension acceptance |
| 008 | Build/buy/vendor exit | Contracts, costs, data portability, service levels, termination and continuity plan |

## 2. Work packages, effort, dependencies and exit gates

Effort is **person-weeks**, not elapsed weeks. Ranges are engineering/design estimates before partner discovery, excluding licensing and review waiting. Staff assignments are roles to fill. Do not add overlapping specialist effort as if it were a guaranteed budget. One technical lead owns cross-package integration; one release owner maintains the evidence register.

| Package | Scope and tasks | Owner | Depends on | Effort | Exit evidence |
|---|---|---|---|---:|---|
| E00 | Product/market/legal/provider diligence; ADR001–005/008; fee quote; brand/publisher; revenue model | Founder + counsel + product | None | 3–6 product; external legal separately | Signed scope/contracts or documented no-go; measurable customer hypothesis; L register closure plan |
| E01 | Isolated honest demo; replace real-looking address; simulation labels; accessible controls and licensed assets | App/design | None | 1–2 | No live-money affordance/false connection; rendered responsive smoke; isolated deployable output |
| E02 | Stack/native/provider spikes: auth recovery, KYC, wallet sign, app returns, optional scene; ADR006 | Tech lead/mobile | E00 preliminary partner shortlist | 3–5 | Same sandbox identity recovers on web/iOS/Android; signed physical builds and documented SDK matrix |
| E03 | Typed monorepo/builds, API/worker skeleton, DB migrations, secrets/IaC, CI, environment isolation | Platform/API | E02 | 4–6 | Reproducible staging deploy; migration/rollback/restore; no secrets in clients |
| E04 | Signup, verified contact, sessions, eligibility, KYC agreements/status, recovery, profile | App/API/security | E00,E03 | 5–8 | Account lifecycle and cross-user denial tests; interrupted KYC resumes; consent evidence |
| E05 | Durable money domain, account mappings, reservations, ledger, provider adapters, event/outbox framework | API/finance | E00,E03 | 6–10 | Balanced entries, precision/concurrency properties, provider ID mapping and replay recovery |
| E06 | One approved funding/payout rail, destinations, limits/finality/returns, fraud screening | Payments/security | E04,E05 | 6–10 | Sandbox funding and payout + failed/returned/unknown cases reconcile; no blind retries |
| E07 | Licensed quotes, instrument details, explicit preview/confirm, orders/partial fills, settlement/corporate actions | API/app/broker | E04,E05; E06 for full loop | 6–10 | Fresh account completes simulated/sandbox buy/sell with authoritative cash/positions/documents |
| E08 | Reconciliation, staff case tools, support/complaints, statements/taxes, closure/deletion, continuity | API/operations/compliance | E04–E07 | 5–8 | Daily closes match; breaks create cases/holds; support and closure drills succeed |
| E09 | Core UX, scene isolation, fee/balance clarity, accessibility/performance, approved copy | Design/app | E00,E02; integrates E04–E08 | 5–8 | Moderated comprehension; keyboard/AT/device acceptance; no critical financial ambiguity |
| E10 | Funded web release: production infrastructure, security review, end-to-end/chaos tests, operator pilot | Release/security/operations | E00,E03–E09 | 4–6 | Signed approvals; zero unresolved P0/P1 money/security issues; controlled real-money evidence |
| E11 | iOS: signing, adapters, privacy, links, lifecycle, TestFlight, review packet and rollout | Mobile/release | E02 early shell; E10 for funded release | 4–8 | Physical-device acceptance, approved publisher and App Review, exact signed artifact |
| E12 | Android: AAB, signing, adapters, API/native compatibility, privacy, Play testing/review | Mobile/release | E02 early shell; E10 for funded release | 4–8 | Physical-device acceptance, declarations and Play approval, exact AAB |
| E13 | Cohort analytics/economics, controlled acquisition, cost/reliability monitoring, scale decision | Growth/finance/product | Instrument at E03; scale after E10 | 2–4 initial, ongoing | 90–180-day cohorts with measured contribution/CAC/support/losses; no negative-contribution growth |

E01 may be hosted while contracts are unresolved; it does not shorten E00's funded-launch gate. E04/E05/E09 can overlap once interfaces stabilize. E06/E07 integrate before E08 acceptance. Native shells start early; final stores follow funded-core acceptance. At 3–4 engineers plus design/QA and specialist support, a **6–9 month funded-web planning window and later/overlapping mobile completion** is plausible only after E00 clears. Licensing, vendor acceptance or redesign can extend it materially. Re-estimate after E02 from actual provider behavior.

## 3. Architecture and boundaries

```text
apps/app/                  Expo Router candidate: web + native routes/adapters
apps/api/                  authenticated API, policy checks, intent creation
apps/worker/               durable orchestration, polling, events, reconciliation
packages/domain/           typed money, schemas, state transitions and policies
packages/provider/         broker, funding, wallet, identity adapters
packages/ui/               accessible UI and isolated optional visual scene
packages/testing/          fake providers, contract fixtures, fault simulation
infra/                     IaC, environments, migrations, monitors and runbooks
```

Use managed Postgres as durable application storage, an outbox-backed job queue, encrypted object storage for permitted documents, a secrets manager, and structured redacted telemetry. The broker/custodian is authoritative for executed positions/lots and statements; the application ledger records customer obligations, cash/reservations and reconciliation state without pretending to replace regulated books. Confirm record-retention and ledger design with finance/provider.

Client asks for a permitted operation. API authenticates and authorizes the subject, checks eligibility/status/limits, creates a durable intent and reserves appropriate funds in a transaction. Worker executes through the approved adapter, records provider references, and waits for verified evidence. Webhooks are persisted before acknowledgement; polling repairs gaps. UI renders server state and uses optimistic animation only where it cannot misstate completion. Client clocks and animation completion never finalize money.

### Data model and invariants

| Entity | Essential fields/constraints |
|---|---|
| `users`, `sessions`, `auth_devices` | Opaque IDs, verified contacts, status, revocation/version, server ownership; no financial authority inferred from display name |
| `eligibility_decisions`, `consents` | Policy/agreement version, evidence reference, decision, timestamp, recheck date; append-only audit |
| `provider_accounts`, `wallet_bindings` | User, provider/environment ID, status, chain/address, signer/control profile; unique mapping and no sandbox/prod collisions |
| `funding_sources`, `destinations` | Verified provider token/address, chain/mint allowlist, verification time/status, change controls; raw bank credentials never stored |
| `money_intents` | User, type, amount/currency, state/version, idempotency key, request fingerprint, quote/consent reference, expiry |
| `orders`, `fills`, `transfers` | Provider IDs, quantities/prices/fees as fixed decimals, lifecycle, settlement evidence, timestamps; unique provider-event references |
| `ledger_accounts`, `journal_entries`, `journal_lines` | Immutable balanced postings per currency/asset; external reference; corrective reversal rather than destructive edit |
| `reservations` | Amount, purpose, expiry and release evidence; no concurrent double spending |
| `provider_events`, `outbox_jobs` | Provider/event ID unique, signature metadata, schema version, payload reference, process attempts and next retry |
| `position_snapshots`, `reconciliation_runs`, `breaks` | Source/time, comparison, mismatch severity, affected-operation hold, case resolution evidence |
| `documents`, `support_cases`, `admin_audit` | Access-controlled provider documents, retention category, immutable staff/action trail and export references |

Money values never use binary floats in production calculations. USD display rounds according to approved policy; shares/token units retain provider precision. Store asset identity and decimals, not an ambiguous symbol alone. Fees cannot make net proceeds negative. Total debits equal credits for every posting, with appropriate asset-specific accounting rather than balancing unlike units. Cash reserved + available reconciles to total permitted cash. A closed UI does not release a reservation until the financial operation is actually cancelled/rejected or safely expired.

### API surface (proposed contracts)

- `POST /sessions/challenge`, `/sessions/verify`, `/sessions/revoke`; server nonce, origin and expiry checks, rate limits, device/session audit.
- `GET /me`, `GET /eligibility`, `POST /onboarding`, `GET /onboarding/status`, `POST /consents`; sensitive capture via approved hosted provider where possible.
- `GET /accounts/summary`, `/positions`, `/activity`, `/documents`; scoped to session owner, timestamped and paginated.
- `POST /funding-intents`, `GET /funding-intents/{id}`; exact destination/rail/limits and approved authorization.
- `POST /order-previews`, `POST /orders`, `GET /orders/{id}`; server-generated expiring preview, price/fee/slippage boundaries, explicit confirmation reference.
- `POST /destinations`, `POST /payout-previews`, `POST /payouts`, `GET /payouts/{id}`; step-up authentication and verified destination.
- `POST /account-closure`, `/privacy-requests`, `/support-cases`; clear outstanding-balance/retention outcomes.
- `POST /webhooks/{provider}` on dedicated verified ingress; not authenticated by user sessions; signature/replay/schema controls and durable deduplication.

All mutating money endpoints require an idempotency key plus request fingerprint. Reusing a key with different parameters fails. A timeout returns pending/unknown with a durable reference, not an instruction to submit a new purchase. Staff endpoints are separate, least-privilege and audited; no unrestricted “edit balance” operation.

## 4. State machines and recovery

| Domain | States and critical behavior |
|---|---|
| Account | draft → contact_verified → KYC_pending → needs_info/approved/denied; approved → restricted/closing/closed. Only explicitly allowed actions in each state |
| Funding | created → awaiting_authorization → initiated → observed_pending → available; can fail/expire/return/reverse. Chain finality and bank availability are different policies; ledger corrections capture later returns |
| Order | previewed → confirmed → submitting → unknown/accepted → partially_filled/filled/rejected/cancel_pending/cancelled. Unknown is resolved with provider lookup before any retry |
| Sale/withdrawal | sale_requested → executing → settlement_pending → cash_available → payout_authorized → submitted → confirmed/failed/returned. Sale and payout have separate IDs and receipts |
| Chain event | observed → confirming → finalized; orphan/reorg is compensating evidence, not silent deletion. Apply provider/network-specific finality policy |
| Reconciliation | scheduled → comparing → balanced/broken → assigned → corrected → independently_closed. Material break pauses affected actions |
| Closure | requested → restricted_for_closure → obligations_resolved → closed_access → retained_archive/deleted_eligible_data. Explain holds and legal retention |

Each transition needs legal predecessor checks, provider evidence, optimistic concurrency version, idempotency and audit timestamp. Handle duplicate, delayed, out-of-order and missing events. Use bounded retries with exponential backoff only for safe operations; dead-letter ambiguous failures to an operator case. Never retry a financial command merely because a webhook is late. Circuit breakers stop new exposure while allowing safe reads/support and permitted exits.

## 5. Security, operations and observability

Threat model: account takeover and recovery abuse; cross-user data access; destination substitution; signer compromise; replay/double submission; forged webhooks; malicious dependencies/XSS; leaked PII; chargeback/ACH reversal; chain reorg/asset mismatch; provider outage; staff abuse; misleading financial state. Control ownership must include vendor powers, not just application code.

Implement secure cookies/web CSRF defenses, mobile secure storage, short-lived/scoped sessions, step-up checks for withdrawals and destination changes, risk-based holds, secrets rotation, least-privilege service identities, encrypted backups and sensitive log redaction. No KYC documents in analytics, URLs, screenshots or support exports by default. Use contractually permitted retention and deletion; production support access is time-limited and audited. Independent penetration test before funded beta, including auth/recovery and financial authorization.

Operational dashboards: queue age, unknown order count, provider failures, webhook lag, funding/payout latency, reconciliation breaks, cash/reserve exposure, fraud/support rates, crashes and cost/user. Alerts route to a named on-call owner. Define severity/response coverage aligned with promised trading/funding hours; do not promise 24/7 immediate help without staffing. Runbooks cover provider outage, compromise, ledger break, chain incident, failed deployment, lost keys, privacy incident, account restrictions and wind-down. Incident notification deadlines come from applicable law/contracts, not a generic hardcoded template.

Proposed service targets to negotiate: application API 99.9% monthly availability excluding clearly defined dependencies; durable acknowledged financial intent RPO 0 in the application transaction path; database disaster-recovery RPO ≤5 minutes and RTO ≤4 hours subject to provider design. RPO 0 acknowledgment is not a guarantee of zero disaster loss across every system. Test restore/reconciliation and set customer promises only after evidence.

## 6. Test and release matrix

| Layer | Minimum meaningful tests | Blocking criterion |
|---|---|---|
| Domain | Decimal/rounding properties, gains/losses, partial sales, residuals, fee cap, no negative cash, balanced postings | Any broken financial invariant |
| Auth | Cross-user IDs, expired/revoked sessions, changed wallets, challenge replay, step-up bypass, staff scopes | Any unauthorized access/action |
| Provider contract | Approved account flow, quotes/orders/status, signature verification, schema drift, actual sandbox restrictions | Unsupported/unknown semantics concealed as success |
| Fault injection | Timeout after provider acceptance, duplicate/out-of-order webhook, process crash between DB and provider, concurrent clicks, rollback | Duplicate economic action or unrecoverable ambiguity |
| End to end | Enrollment→fund→buy→sell→settle→withdraw→reconcile→document; rejection/cancellation and support recovery | Missing state/evidence or incorrect customer display |
| Native | Same flow on signed physical devices; reinstall/device loss, cold-start link, camera denial, background/process death | Lost account access or unsafe repeated transaction |
| Accessibility/UX | Keyboard, AT, text scaling, reduced motion, fallback, comprehension of fees/losses/settlement | Critical action inaccessible or materially misunderstood |
| Operations | Backup restore, reconcile discrepancy, dependency outage, incident escalation, wind-down/closure | No safe recovery or responsible operator |
| Release | Exact SHA/artifact/config, current CI, approvals, staging and bounded production smoke | Missing approval or evidence; green unit tests alone insufficient |

Use fake-provider fixtures for exhaustive faults, provider sandbox for contracts, and an authorized operator for limited real-money acceptance. Never store live identity documents in fixtures. Record amounts/provider IDs in a restricted evidence store, with sanitized references in the release record. A screenshot proves UI state, not settlement.

## 7. Phased execution and owner handoffs

### Phase 0 — decision and evidence

E00/E01/E02. Founder appoints securities/payments counsel, broker relationship owner, product owner and technical lead. Assemble the diligence packet in [rails/legal](rails-and-legal.md), get quotes, run customer tasks and native spikes. Deliver ADRs, risk register, unit model with signed rates and go/no-go. **Stop or change route** if revenue rights, US access, publishing identity or customer comprehension fail. No timeline pressure overrides these gates.

### Phase 1 — sandbox vertical slice

E03–E07 plus E09. Build fake adapter first, then one provider account and rail. Complete identity → funds → order → settlement → payout before adding animation polish or a second rail. Deliver durable migrations, API contracts, operational IDs, fault suite, accessible UI and sandbox provider evidence. Native shell validates the same backend early.

### Phase 2 — operationally complete web beta

E08/E10. Close legal/provider UI approvals, fee disclosures, data retention, tax/support responsibilities, monitoring and independent security findings. Authorized operators execute and reconcile a tightly capped real-money pilot. Launch to 50–100 approved users with per-user/aggregate exposure limits, clear support coverage and a rollback/exit procedure. No platform-wide irreversible migration without tested restoration.

### Phase 3 — native acceptance and publishing

E11/E12 using [publishing checklist](publishing.md). Finish signing, native integrations, privacy declarations and review packet. Test actual iPhone/Pixel/Samsung devices; TestFlight/Play tracks; address reviews transparently. Release only the reviewed artifact/config to approved geographies with staged rollout and kill switches for new exposure.

### Phase 4 — measured growth

E13. Increase users only while reconciliation, support, loss and cohort economics remain within approved bounds. Rerun economics monthly with observed distributions, not just averages; distinguish active, funded, retained, dormant and closed accounts. Reopen counsel/provider review for each new state, instrument, automated strategy, fee or rail. Deferred features need their own business case and approval.

## 8. Scope completeness and unresolved evidence

The [traceability file](requirements-traceability.md) contains each D/A/M/B/U/W/I/G/T item with its original closure criterion, owner, work package, dependency and release gate. All remain **open**, except expressly deferred optional features and inapplicable alternative rails after an ADR decision. Browser smoke evidence is partial progress on U16/T05, not closure. L01–L26 remain external/combined gates owned by E00 and the relevant engineering packages.

Additional requirements introduced by this research:

| ID | Requirement | Owner/package | Closure |
|---|---|---|---|
| R01 | Retained-revenue entitlement sensitivity | Finance/E00 | Signed revenue agreement and updated 0/50/100% cases |
| R02 | Measured acquisition/cohort economics | Growth/E13 | Funded and retained CAC, behavior, support/loss and survival by cohort |
| R03 | Cash App network/eligibility truth | Payments/E06 | Actual approved account/network tests; no inferred public pull API |
| R04 | Current 2026 legal changes | Counsel/E00 | L24–L26 analysis with effective dates and change-monitor owner |
| R05 | Cross-source TAM caveats | Product/E00 | No account/address/person conflation; replace conditional SAM with research |
| R06 | Brand/provider/store acceptance | Founder/E00/E09 | Approved assets and truthful review outcome, or accepted revised identity |
| R07 | Provider exit and customer continuity | Operations/E08 | Contractual export/closure rights and executed drill |
| R08 | Model provenance and reproducibility | Finance/E13 | Checked inputs, source checksum, arithmetic tests and deterministic outputs |
| R09 | Fee/claims consistency across all surfaces | Compliance/E09 | App, brief, ads, stores, support and agreements match approved schedule |
| R10 | Research freshness at launch | Release/E10–E12 | Recheck source dates/policies, consoles and provider terms; archive decisions |

No finite code review can prove there are no unknown issues. This plan covers the inspected repository, current primary-source constraints and identified end-to-end launch needs; signed contracts, actual environments and testing will generate further requirements. Maintain one issue per acceptance criterion and attach evidence before changing its status to done.
