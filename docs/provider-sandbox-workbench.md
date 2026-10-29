# Local Dinari and MoonPay integration workbench

This is a sandbox integration surface, separate from the tray's simulated money
and its ledger. It is off by default. On October 28, genuine sandbox credentials
passed Dinari identity/QQQ reads and a MoonPay indicative buy-quote read. No
external order, checkout or payout has been executed. The local contracts and
recovery paths can be tested unattended.

## Implemented boundaries

| Provider | Implemented | Remaining acceptance |
| --- | --- | --- |
| MoonPay | USD/USDC indicative buy quote with exact fee checks and expiry validation when supplied; test-key-only signed buy/sell URLs; transaction lookup by saved external ID; customer/wallet/amount/currency matching; raw-body V2 webhook verification and event deduplication | Actual widget/transaction/callback acceptance, approved funding/payout route and chain reconciliation |
| Dinari | Official SDK with sandbox origin pinned; account/customer reference/KYC/wallet/instrument checks; external-wallet unsigned permit preparation; request recovery by client ID; order status lookup | Enabled customer/account/program, accepted payment token/network, approved signing and submission, actual fills and chain settlement |
| Recovery | Immutable instructions committed before I/O; one prepare claim; unknown results retained across restarts; no repeated POST after uncertainty; read-only reconciliation; separate event inbox | Provider and chain acceptance, distributed deployment and operational controls |

The public MoonPay ERC-20 sandbox delivers MoonPayToken on Sepolia. The Dinari
permit path allows Ethereum Sepolia and Arbitrum Sepolia only when QQQ's returned
token mapping includes the requested chain. The October 28 real sandbox response
listed Ethereum Sepolia and Dinari's test chain 179205, with no Arbitrum Sepolia
mapping; chain 179205 is not enabled by this adapter. These are separate test legs. They
are not presented as one native-USDC funding/investment route. `FILLED`, widget
completion and webhook delivery do not credit the Blunts ledger.

The Dinari adapter returns unsigned provider data with `signingApproved=false`.
It does not approve a spender, sign a permit, broadcast a transaction or submit
an order. A configured customer reference and generic KYC boolean do not prove
US program/UI/disclosure acceptance. Original Fill/Spark remains simulated.

The inspected local Steward source at
`297437b23f05fba4bafee1da63908bfcbec72830` deliberately refuses permit-style
messages in `packages/api/src/routes/user.ts` and permit-style typed data in
`packages/api/src/routes/global-wallet.ts`. Even its typed-data compatibility
feature gate does not establish an approved Dinari signing path. Blunts does not
enable unsafe flags or export wallet keys. Completing this boundary needs real
sandbox permit samples and confirmed chain/token/spender/domain values, followed
by a narrowly scoped signing policy and independent signature verification. This
is local source evidence, not a claim about the deployed Cloud configuration.

## Local configuration

Credentials come from process environment or an explicitly selected private
JSON file. The app does not load the creative-tools `.env`. Never paste secrets
into chat, command arguments or Git.

The approved local file is `data/provider-sandbox/credentials.json`, Git-ignored
and mode 0600. Set `PROVIDER_SANDBOX_CREDENTIALS_FILE` to its absolute path to
opt in. Loading refuses production, symlinks, non-files, wrong ownership, modes
other than 0600, files over 16 KiB, unknown fields and live MoonPay keys. Explicit
environment values, including empty strings, override the file. Browser tests
disable this path and supply synthetic keys so genuine credentials cannot leak
into fixture tests. The temporary UI transfer file was cleared after capture.

| Variable | Purpose |
| --- | --- |
| `DINARI_API_KEY_ID` | Sandbox partner key identifier |
| `DINARI_API_SECRET_KEY` | Server-side Dinari secret |
| `MOONPAY_PUBLISHABLE_KEY` | `pk_test_` key for sandbox widgets and reads |
| `MOONPAY_SECRET_KEY` | `sk_test_` key for URL signing |
| `MOONPAY_WEBHOOK_KEY` | Distinct webhook authentication key |
| `DINARI_SANDBOX_BINDINGS_FILE` | Optional private JSON array of approved test customer/account/wallet bindings |
| `PROVIDER_SANDBOX=1` | Opt in to HTTP workbench routes |
| `PROVIDER_SANDBOX_CREDENTIALS_FILE` | Optional private JSON containing only the five credential variables above |

HTTP activation requires a loopback HTTP origin and bind host, and refuses
`NODE_ENV=production`. `MONEY_MODE=live` still refuses startup. Invalid live
MoonPay keys are rejected. Dinari requests ignore `DINARI_BASE_URL` and remain
pinned to the sandbox. No network request is made by adapter construction.

Each Dinari binding contains `customerId` (the Blunts database user UUID),
`entityId`, `accountId`, `stockId`, `wallet`, `paymentToken` and
`chainId` (`eip155:11155111` or `eip155:421614`). The provider entity's `reference_id` must match the
Blunts user UUID. The current verified Steward wallet must match the binding,
and Dinari must report it as external and not AML flagged. Account/entity IDs
cannot be supplied by a browser request. An operator must establish accepted
test accounts and the exact token/network; these values are not guessed.

## Read-only qualification

```sh
npm run providers:check
```

Output now has `dinari` and `moonpay` objects. Without their required keys, each
returns `missing_credentials` and makes zero network requests. With keys, Dinari
makes at most two GETs; MoonPay makes one USD 100 sandbox buy-quote GET. Exit 2
means qualification is incomplete. MoonPay quote access does not verify the
secret/publishable key pair, webhook key or widget acceptance; the result says
so. Neither qualification reports provider approval or real-money readiness.

The October 28 read receipt is `data/review-20261028/provider-qualification.json`.
Dinari reported `sandbox_reads_verified`, QQQ tradable/fractional on Ethereum
Sepolia, and `partnerKycComplete=false`. MoonPay reported
`sandbox_quote_verified` and `secretKeyPairVerified=false`. Quotes without an
upstream expiry return `expiresAt=null`, `indicative=true` and a local receive
timestamp; no expiry or locked price is invented. Dinari stock queries now use
the [provider's documented minimum](https://docs.dinari.com/reference/getstocks)
`limit=20`; request recovery also uses 20
while continuing to reject more than one match for the saved client order ID.

## Authenticated HTTP workbench

Enable the flag on a separate loopback preview using existing first-party auth.
Every API below requires an active first-party account with a verified wallet.
POSTs also require the app's existing Origin, request-marker and CSRF checks.

| Route | Input / result |
| --- | --- |
| `GET /api/providers/sandbox` | Configured adapter flags; always identifies the app's simulation mode |
| `POST /api/providers/sandbox/moonpay/quote` | `{ "amount": "100" }`; validates the provider's USD/USDC quote, fees and expiry |
| `POST /api/providers/sandbox/moonpay` | `{ "side": "buy", "amount": "100" }` or sell with an exact crypto amount; requires a UUID `Idempotency-Key`; returns the signed test URL |
| `POST /api/providers/sandbox/dinari/permit` | `{ "side": "BUY", "amount": "100.123456" }` or `SELL`; requires a UUID `Idempotency-Key` and a server-side binding; returns unsigned provider data |
| `POST /api/providers/sandbox/:id/observe` | Owner-only read/reconciliation of the saved instruction; never a financial resubmit |
| `POST /provider-hooks/moonpay` | Raw JSON with `Moonpay-Signature-V2`; separate HMAC authentication, freshness bound and deduplication |

Buy widgets currently accept whole-dollar fiat input, as required by the
documented widget parameter. Fractional fiat is rejected instead of rounded.
Crypto amounts use exact six-decimal units. The quote validator refuses
unsupported precision, inconsistent currencies/totals and expired quotes.
Provider fees are separate from the demo's Blunts fee; this workbench does not
enable or assume approval of a compensation model.

The callback stores a digest and normalized transaction metadata, not the raw
customer payload. It authenticates exact raw bytes before parsing. Events are
hints for a later authoritative lookup; they do not alter instruction state or
balances. Unknown instruction IDs are ignored. Stale transaction observations
cannot overwrite newer timestamped evidence; conflicting evidence is flagged.

No public tunnel or webhook registration is created by these routes. External
delivery acceptance still needs a deliberately configured provider endpoint.

## Operator CLI and durable storage

```sh
npm run providers:workbench -- status
npm run providers:workbench -- prepare /private/path/instruction.json
npm run providers:workbench -- observe SAVED_INSTRUCTION_UUID
npm run providers:workbench -- event /private/path/raw-event.json /private/path/signature.txt
```

The input format is `{ "provider": "moonpay", "instruction": { ... } }` or
`dinari`. MoonPay instructions contain UUID `id` and `customerId`, `wallet`,
`side` (`buy`/`sell`) and decimal-string `amount`. Dinari instructions contain
the binding fields above plus UUID `id`, `side` (`BUY`/`SELL`) and `amount`.
These are trusted operator inputs, not a public arbitrary-account proxy.

The CLI prints classifications, command IDs and private artifact paths. It
does not print signed URLs, unsigned permits, raw upstream errors or credentials.
Generated artifacts use mode 0600 in ignored `data/provider-sandbox/`. The
command journal is separate from `data/blunts`; application ledger backups do
not include this laboratory journal. Preserve it separately for sandbox review.
It contains private customer/account/wallet associations and is local test data,
not production PII storage.

Run the CLI and HTTP workbench one at a time: PGlite is single-process. An
exclusive `process.lock` prevents concurrent opening. After a crash, verify
the recorded process has ended before removing only that stale lock. Preserve
the database and all `submitting`/`unknown` records. A missing provider lookup
never authorizes another POST with a fresh ID.

## Request budget and remaining work

All calls have a ten-second deadline, a 128-KiB response budget, fixed origins,
no redirects and no automatic retries. Explicit MoonPay quote/lookup uses one
GET; checkout URL construction and webhook validation use zero network calls.
Dinari permit preparation uses four eligibility/instrument GETs and one POST.
Dinari reconciliation uses one request lookup and, when present, one order GET.
There is no new idle polling loop and no provider I/O inside a DB transaction.

Before connecting the actual Fill/Spark money flow: complete accepted customer
onboarding/disclosures, wallet proof and scoped signing, signed order submission,
supported same-asset funding/payout, chain receipts/finality, authoritative
fulfillment accounting, provider documents, limits and operational acceptance.
These remain real engineering and provider-program work; keys alone do not
complete them. Keep shipping and real-money actions on hold for owner approval.

Authoritative references: [MoonPay URL signing](https://dev.moonpay.com/widget/on-ramp/customization/url-signing),
[MoonPay webhook signatures](https://dev.moonpay.com/api-reference/widget/webhooks/signature),
[MoonPay API authentication](https://dev.moonpay.com/api-reference/widget/using-the-api),
[Dinari external wallets](https://docs.dinari.com/docs/managing-wallets),
[Dinari orders](https://docs.dinari.com/docs/placing-orders),
[Dinari US program](https://docs.dinari.com/docs/us).
