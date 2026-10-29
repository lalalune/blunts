# Wallet-first Blunts — local web implementation

**Latest owner clarification:** the active product is a normal Web3 web app
using the existing browser wallet. Native testing was beyond the needed scope.
Its optional SDK prototype is preserved on
`codex/native-wallet-prototype-20261028` (`11fa854`). Active web source removes
that SDK integration; no phone setup is needed for the desktop flow. Native
acceptance items below are historical/optional, not web release gates.

For the consolidated current receipts and unfinished work, read
[local wallet acceptance](local-wallet-acceptance.md).

**Current owner-approved scope:** local HTTP loopback web signing is enabled as
recorded in the latest section. Hosted/native origins remain disabled and shipping
still requires later approval. Both Fill and Spark now collect the owner-approved
1% output fee; see the final fee qualification section for the receipt.
Earlier disabled-signing/bundle claims below are
historical checkpoints, superseded only for the approved local web origin.


The owner's October 28 direction replaces the provider-first app with a normal
EVM wallet and Robinhood Chain stock tokens. The previous implementation is
preserved at `e89c958` on `codex/local-review-20261027`. Existing data and secrets
are untouched. New work stays local on `codex/evm-robinhood-local`.

## Initial wallet-first checkpoint — before local signing approval

The same original tray, brown/gold palette, fonts and Fill/Spark controls now
open a wallet-first preview. There is no email signup, Cloud session or brokerage
API key on this path. EIP-6963 wallet discovery and the injected EIP-1193 fallback
request only the public address on explicit Connect. Account/chain changes clear
old balances. Wrong-chain wallets can request switching to chain 4663. No wallet
signature, approval or transaction submission is requested.

Fill previews USDG → the canonical Robinhood QQQ token; Spark previews the reverse.
This returns stablecoin to a wallet, not dollars to a bank. USDG is selected because
its actual direct QQQ pools were verified; an arbitrary USDC pair is not assumed.
Amounts preserve USDG's six decimals and the stock token's 18 decimals.

The server provides bounded, cached public issuer metadata and QQQ bid/ask reads.
It pins chain and canonical token addresses, verifies the registry/deployment,
rejects stale price data and uses the published corporate-action multiplier when
valuing holdings. A missing balance remains unavailable, not a made-up demo value.
The same multiplier must not be applied again if switching to adjusted on-chain
Chainlink prices in future.

Quote reads compare Uniswap v3 fee tiers 500 and 3000 at one block, using official
factory/quoter addresses. Quotes show output, 0.5% slippage floor, pool fee, expiry
and block. This is a limited direct-pool route, not a general multihop aggregator.
No Blunts fee is charged by this read-only preview; the old proposed 1% conversion
business model has not been implemented on-chain or represented as accepted.

## Actual public-chain proof

On October 28, public RPC returned chain 4663 and the issuer API returned active
QQQ at `0xD5f3879160bc7c32ebb4dC785F8a4F505888de68`. USDG at
`0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` returned six decimals.

Factory reads found QQQ/USDG pools at fees 100, 500 and 3000. The 100 pool had
zero liquidity; 500 and 3000 had nonzero liquidity. At block 99969079, a read-only
quoter simulation returned 0.034482909486826954 QQQ for 25 USDG, and
24.974799 USDG for selling that quoted QQQ amount. Those are timestamped
simulation results, not executed trades, balances, profit or future guaranteed
quotes. No account was funded and no approval/signature/transaction was sent.
The actual UI also displayed a fresh live Fill quote.

Wallet lifecycle/browser checks use a disposable injected fixture and mocked RPC;
these prove UI behavior only. They passed desktop Chromium, mobile Chromium and
WebKit. They never touch the owner's wallet. Real RPC/issuer checks above are
separate evidence. Ignored receipts live under `data/review-20261028/evm/`.

## Run and test

```sh
npm run build
npm start
# http://localhost:8745
npm run test:e2e
npm test
npm run format:check
```

`npm run start:legacy` and `npm run test:e2e:legacy` retain the old simulation
backend/UI. Do not run the old provider API/CLI concurrently on its PGlite journal.
`npm run test:local-services` still uses isolated local Steward and synthetic keys.

## Remaining work

Transaction calldata construction, finite-approval planning, independent chain
preflight and an isolated-fork recovery engine are now implemented and qualified
as described below. Production wallet signing/broadcast, multi-tab submission coordination,
replacement-transaction recovery, mainnet/L1 settlement validation, fee collection
and an owner-approved real-wallet execution cycle remain unfinished. Browser
review/activity recovery and the reference guard were added in the later sections. WalletConnect/mobile external
wallet continuation is also unfinished; this preview supports injected wallets.
No actual native builds were rebuilt for this pivot. No bank/card funding,
withdrawal, bridge, custom token, fee contract or pooled wallet was introduced.

Transactions are disabled in code and UI. Publishing and real-money actions need
owner approval. Do not label the preview a complete trading app.

Robinhood's token eligibility restrictions still apply, including exclusion of US
persons. Tokens are issuer debt securities providing economic exposure rather
than direct legal/beneficial ownership in underlying QQQ shares. A permissionless
chain and an injected wallet do not erase the issuer's restrictions.

## Primary sources

- https://docs.robinhood.com/chain/stock-tokens/
- https://docs.robinhood.com/chain/building-with-stock-tokens/
- https://docs.robinhood.com/chain/stock-token-apis/
- https://docs.robinhood.com/chain/contracts/
- https://raw.githubusercontent.com/Uniswap/contracts/main/deployments/4663.md

Rialto RFQ currently documents partner API keys. The verified direct Uniswap path
avoids depending on that keyed API; no claim is made that every on-chain venue is
keyless. This preview's small read-only server is a cache/proxy, not a custodian.

Final checkpoint validation: build passed; full backend suite 43 passed and one
optional PostgreSQL test skipped, including actual isolated Steward transport.
The new three-engine wallet preview checks passed again after the final frontend
change. One actual local Steward browser cycle also passed on the retained legacy
route. Formatter, TypeScript and Git whitespace checks passed. The new read-only
HTTP endpoints returned 200 for both directions. The preview remains on port 8745.


## October 28 follow-up: calldata and isolated-fork execution

`swap-plan.ts` constructs only the fixed USDG/QQQ pair and published SwapRouter02
address. The output recipient is the connected wallet. New approvals grant the
exact input amount, with a zero reset when replacing an insufficient nonzero
allowance. An already sufficient allowance is reused; Blunts does not create a
new unlimited approval. Swaps use `exactInputSingle` inside deadline-protected
`multicall`, zero ETH value, and the displayed 0.5% output floor. Expired or
inconsistent plans are rejected. No fee transfer is included in this preview.

The new **Review wallet steps** action independently rechecks chain, pool,
input balance/decimals, router existence, allowance and current on-chain output.
A changed wallet/amount invalidates the review. The UI displays only the planned
steps; it never imports the fork writer or requests a wallet transaction.

`swap-journal.ts` stores an immutable sender/nonce/call before a wallet can
broadcast. Lost responses and post-broadcast storage failure preserve a blocking
attempt instead of authorizing retries. Receipt recovery compares sender,
recipient contract, calldata, nonce, zero ETH value and canonical block hash.
Transient RPC failure preserves prior proof instead of inventing a reorg. The
engine is currently **fork-only**, with hard chain-31337 checks on both read and
wallet transports and explicit chain 31337 in every outgoing wallet request.
It cannot be enabled for mainnet by an environment variable. Browser activity UI
and a reviewed mainnet execution policy are separate unfinished work.

### Actual fork receipt

Anvil 1.7.1 forked Robinhood block **99980889** into isolated chain **31337** on
loopback port 8752, with no generated wallet accounts. The qualification script
impersonated disposable accounts only inside that fork and seeded virtual USDG
and ETH there. It never forwarded transaction writes to the public chain and
never accessed the owner's wallet or keys.

The deployed USDG, QQQ and Uniswap contracts completed a 25-USDG buy and a sale
of all received QQQ. Four local wallet requests confirmed; QQQ returned to zero
and the newly granted buy allowance was consumed to zero. The journal was
serialized/reloaded between steps. A fifth local request deliberately lost its
response **after** its approval transaction mined. The reloaded journal retained
`unknown` without a hash and blocked another submit. This is local-fork contract
execution evidence, not mainnet trading, eligibility, finality or bank cash-out.

Private ignored receipts: `data/review-20261028/evm/fork-cycle.json` (first cycle)
and `fork-cycle-1793181003531.json` (cycle plus actual lost-response test). The
latter cycle began with 99.975004 virtual USDG and ended with 99.950007; these are
disposable fork balances, not user funds or performance claims. Five serialized journal
records were retained during the run. Browser review screenshots use a clearly separate fixture
wallet, not these balances or the owner's wallet. The Anvil process was stopped
after the receipts were saved.

The public RPC rejected the first historical-block fork because its historical
state was pruned. A fresh fork succeeded. To reproduce, start a fresh fork and
run the bounded script promptly; reusing an old block may require an archival
RPC that is not configured or purchased here:

```sh
npm exec --yes --package=@foundry-rs/anvil@1.7.1 -- anvil \
  --fork-url https://rpc.mainnet.chain.robinhood.com --chain-id 31337 \
  --accounts 0 --host 127.0.0.1 --port 8752 --no-storage-caching
# In another terminal:
npx tsx scripts/qualify-evm-fork.ts
```

Focused tests cover malformed/expired/altered plans, exact approvals, mainnet
refusal, changed wallet/call, storage failure before/after broadcast, concurrent
submits, unknown-response reload, receipt mismatch, canonical-block changes and
RPC outages. Browser tests verify that preparing/reviewing invokes no wallet
sign/send method. Desktop Chromium, mobile Chromium and WebKit passed.


Follow-up validation: full backend suite **47 passed, one optional PostgreSQL
skip**; focused wallet/calldata/recovery cases **5 passed**; wallet browser review
**3/3 passed**. Build, TypeScript (now including the fork script), formatting and
whitespace checks passed. The fork-writer guard string is absent from built
browser assets. Browser activity persistence and mainnet signing remain unfinished;
the serializable journal was qualified with disposable test storage, not an owner
browser restart or real wallet. The local preview remains on port 8745.


## October 28 follow-up: saved reviews and reference guard

The browser now persists a **review draft**, scoped to the exact wallet and
chain 4663. Only version, owner, chain, direction, amount and review time are
stored. There is no saved quote, signature, transaction hash, session or calldata
to replay. After a reload, reconnect and open Wallet → Resume Fill/Spark review.
This restores the amount and requires a fresh quote and fresh chain preflight.
Changing wallets never displays another wallet's draft. Malformed, oversized or
cross-wallet records are preserved and rejected rather than silently overwritten.
Storage denial/failure is reported. This completes saved-review recovery, **not**
production transaction activity/recovery or real-wallet signing.

Both the public quote path and mainnet-read preflight now compare output to the
issuer's directional bid/ask, applying its stock multiplier exactly once. Quotes
more than **5% below** the computed reference are rejected before truncating the
basis-point display, so rounding cannot admit a worse quote. This reference uses
USDG's nominal $1 value; an independent USDG peg oracle was not added. The displayed
shortfall includes pool costs and venue/reference differences. It is not a pure
AMM price-impact metric, a best-execution guarantee or a broker-approved policy.
Stale, future-dated, inactive, halted, inverted or malformed reference data is
rejected. The 0.5% swap output floor remains a separate constraint.

Provider timestamps are normalized to ISO milliseconds at the server boundary.
The saved-review UI never treats an expired reference or quote as executable.
The fork-only writer is still absent from the public bundle and cannot be enabled
for mainnet through configuration. No signing or transfer was requested.

Validation: build/typecheck and full backend suite **51 passed, one optional
PostgreSQL skip**. Four new tests cover serialized restoration, storage denial and
corruption, wallet isolation, multiplier math, exact 5% boundaries and invalid
reference prices. The expanded browser check passed **3/3** engines after an actual
page reload, restoration and account switch, while recording only connection/read
wallet methods. Screenshots use disposable fixture balances. The real public
read-only endpoint returned a valid 25-USDG quote with **7 bps** reference shortfall
at the captured time, and malformed exponent input returned HTTP 400. Those are
read results, not trade receipts. Private timestamped evidence is under
`data/review-20261028/evm/reference-guard-*.json`.

Remaining: mainnet execution/receipt policy, browser activity and uncertain-send
recovery, ETH fee readiness, mobile external-wallet continuation, fee collection,
the wallet-first adaptation of the five-step walkthrough, and an owner-approved
real-wallet execution/settlement test. Existing provider/native/creative history
remains preserved; native builds were not rerun for these browser changes.


## October 28 follow-up: activity and ETH readiness

Wallet → **Activity on this browser** now accepts an existing transaction hash,
checks its sender and chain, and decodes only the canonical token approvals or
single-step, own-recipient QQQ/USDG SwapRouter02 route. It never signs, sends or
replays a transaction. Arbitrary routers, tokens, recipients, ETH value and batches
are rejected. A tracked record is labeled as observed activity; it is not evidence
that Blunts originally submitted it. Direct approvals and this app's exact-input
route are supported; this is not a general wallet-history indexer.

The same serialized journal now supports isolated fork chain 31337 and read-only
mainnet chain 4663, with distinct wallet/chain storage keys. A successful mainnet
receipt becomes **Included on Robinhood Chain**, never the fork's `confirmed`
state. Recovery matches transaction and receipt hashes, sender, nonce, target,
calldata, zero ETH value and canonical block hash. A missing response can attach
a hash to exactly one existing unknown attempt only if nonce/call/sender all
match. No retry is authorized by that lookup. Replacement/cancellation workflows
with changed calls or already-known replacement hashes remain unfinished.

RPC failure preserves the last verified state and proof timestamp, while recording
that the latest observation was unavailable. It cannot invent a fresh inclusion
or a reorg. The browser list survives a real page reload, stays isolated across
wallet changes and has a private JSON download. Export contains only this browser's
wallet/chain records and metadata, no authentication/session data or private keys.
History is currently capped at 100 records; archival/capacity policy is unfinished,
and history is never automatically discarded to make room.

The Activity disclosure starts closed to keep the wallet view focused. Close
remains visible while long sheets scroll. The public build still omits the
fork-only submission helper. No mainnet writer or enablement flag was introduced.

### Fee readiness

After independent quote preflight, review estimates the **first** wallet step
using `eth_estimateGas` and current gas price, with a 20% gas-unit buffer. This
is not a sum of all later steps: a later swap may require an approval first.
The [chain fee documentation](https://docs.robinhood.com/chain/gas-and-fees/)
says standard estimates include both L2 execution and L1 data fees. The wallet's
final fee preview remains authoritative. ETH balance is read first; zero ETH
produces a clear funding-needed state without attempting a doomed gas estimate.
Unavailable estimates are reported as unavailable, not as zero cost or readiness.
No fee was actually charged by this read-only review.

### Qualification boundaries

The [finality guide](https://docs.robinhood.com/chain/transaction-finality/)
distinguishes sequencer receipt, Ethereum posting and Ethereum finality. The
tracker verifies L2 inclusion only. It does not establish L1 finality, a bridge
withdrawal, bank payout or stock ownership rights.

A fresh isolated Anvil fork at Robinhood block **100007535**, exposed only as
chain **31337**, passed the complete buy/sell and post-broadcast lost-response
case with the updated receipt-hash checks. Five fixture wallet requests and five
journal records were retained; QQQ returned to zero. The fork node was then
stopped. Timestamped private receipts remain under `data/review-20261028/evm/`.
This did not access the owner's wallet, broadcast to mainnet or spend real funds.

One bounded public query checked 2,000 blocks of the known QQQ/USDG pool, filtered
to the published router. It found one event but no compatible direct transaction
for this tracker's exact route. No further scanning was performed. That attempt
is not reported as mainnet receipt acceptance. Current receipt qualification is
therefore actual local-fork execution plus browser/RPC fixtures, with mainnet
owner-wallet acceptance still missing.

Expanded browser checks cover activity import, inclusion labeling, reload,
per-wallet isolation, receipt refresh, JSON export, positive gas readiness and
zero-ETH handling. They continue to record only connection/read wallet methods,
never sign/send. An initial zero-ETH check exposed a fixed-value test fixture;
the fixture was corrected and all three engines passed the corrected case.
These browser checks use disposable fixture balances and hashes.

## Post-crash resume and walkthrough

The desktop crash preserved all uncommitted activity/fee changes. Those changes
were recovered and committed as `7aa84c7`, without resetting history or data.
The preview was restarted on loopback 8745; signing remains disabled.
Fresh backend checks passed **55 tests, two integration skips** (PostgreSQL and
actual Steward, which was not running after the crash). These skips do not
invalidate or replace the earlier service-backed evidence.

Menu → How it works now uses the same five-step component and visual system as
Shaw's walkthrough, with wallet-specific copy: existing USDG funding, ETH gas,
$100-value blunts/bands, token exposure rather than direct share ownership,
risks/eligibility, and Spark returning USDG rather than a bank withdrawal. The
legacy demo retains its own original lessons and fee explanation. Wallet lessons
do not invent returns, a new fee, completed signing, or a bank cash-out feature.
All five steps and return navigation passed across Chromium, mobile Chromium
and WebKit alongside the wallet/activity/reload checks: **6 browser cases passed**.

## Cross-tab activity coordination

Activity writes now acquire an exclusive same-origin Web Lock named for the
exact wallet/chain journal. A second tab waits; duplicate actions within one
component are also synchronously suppressed. Browsers lacking Web Locks can
still read/export existing records, but activity mutations fail closed instead
of silently using an unsafe fallback. This does not introduce mainnet signing.

Other tabs listen for storage changes and reload only their current wallet's
records. Each receipt observation compares the journal record it began with to
the latest stored record before saving. A late success or outage response returns
the newer record instead of overwriting it. Missing activity records fail closed.
This protects normal Blunts tabs sharing one origin/storage partition; it is not
cross-device synchronization or protection from manual storage modification.
The fork-only executor still requires a caller-provided exclusive lock, and no
public browser writer was added.

The browser scenario now opens a second same-origin tab with a disposable fixture
wallet, holds the journal's real Web Lock, verifies the first tab is queued and
has written no record, releases it, and observes the resulting inclusion record
in the sibling through the storage event. Unit coverage separately races a delayed
receipt response against a newer journal record and verifies no stale overwrite.

Cross-tab validation initially passed five of six browser cases; the last WebKit
walkthrough failed to bootstrap. The six-case pass was prematurely recorded in
`4863913` and is corrected here. Reproduction against stable build output captured
**HTTP 429 for the app JavaScript and CSS**, proving the overlapping rebuild was
not the complete cause. The shared global rate bucket counted repeated static
asset loads from the browser scenarios against the API's 90/minute budget.

The local server now keeps the same **90/minute API budget**, while static assets
are exempt from that API bucket. A regression test loads 95 static requests,
then proves the first 90 API requests succeed, subsequent API requests receive
429/Retry-After, and static assets remain available even after API exhaustion.
This is a runtime startup fix, not a test retry or timeout increase. The server
remains loopback-only and serves only built assets. Static-host/CDN protections
for a future deployment are still a separate release decision.

Final verified run: build/typecheck and formatter passed; **58 backend cases
passed, two optional integrations skipped** (PostgreSQL and non-running local
Steward). The final stable-output browser process completed **6/6 cases** in
Chromium, mobile Chromium and WebKit, including actual queued Web Locks, sibling
storage-event readback, restoration, private export, ETH readiness and walkthrough.
The fork writer remains absent from public build output. Signing, publishing,
real-money execution and mainnet finality acceptance remain unfinished.

## Wallet lifecycle invalidation

Account/network changes now invalidate every in-flight quote and balance read,
clear the prepared plan and ETH estimate immediately, and prevent an older
response from repopulating the tray. A provider `disconnect` event also clears
identity and network state. Chain events accept only safe hexadecimal IDs;
unsupported or malformed networks cannot retain a usable review. Repeated balance
refreshes use a separate read generation so an older same-wallet response cannot
overwrite a newer refresh.

Public market reads now have a 15-second browser deadline, run one at a time,
pause periodic work in hidden tabs and refresh when the page becomes visible.
The server retains its fixed origins and bounded upstream requests. No automatic
wallet reconnect, signature request, transaction retry or gas spending was added.

Browser qualification holds an actual quote HTTP response, emits a network switch,
then releases the response and waits for the preview request to finish. The quote
remains absent, the tray shows an unavailable value, the wallet shows the changed
network, and activity is hidden. A provider disconnect then returns the connection
control and leaves no stale balance. These are disposable browser fixture events,
not owner-wallet or physical-device proof. Prior six-case wallet/activity/reload
and walkthrough coverage remains in the suite.

Lifecycle validation completed: build/typecheck, formatting and whitespace checks
passed. All six final browser cases passed across Chromium, mobile Chromium and
WebKit with delayed quote/network/disconnect coverage. The backend was not changed
in this checkpoint; the prior full 58-pass/two-skip receipt remains separately
identified. Mainnet signing and physical mobile-wallet acceptance remain open.

## Disabled real-wallet execution adapter

The single-step executor now accepts either isolated chain 31337 or an explicit
chain-4663 policy. The mainnet-shaped path **requires** `enabled=true` and a fresh
preflight callback; absent either, it rejects before calling the wallet, storage
or lock operation. Both reader/wallet chain IDs must match the journal policy.
After preflight and RPC reads, the wallet identity is checked again and the entire
plan is rebuilt/compared before persistence. Mutated calldata or quote limits
cannot cross that boundary. Every outgoing request pins chain, nonce, own-wallet
sender, exact canonical target/calldata and zero ETH value. Only one step is
requested; no subsequent approval or swap is auto-submitted. Mainnet approval
progress relies on verified L2 inclusion, not a claim of Ethereum finality.

`app/client/wallet-execution.ts` composes fresh public market/chain preflight,
current allowance/balance/pool checks, reference/slippage limits, exact-call
matching, next-step ETH readiness, the exclusive browser lock and durable attempt
journal. Its local policy is **frozen disabled** in source. No environment, URL,
localStorage or server setting enables it. The UI does not import the adapter,
and the execution helper is removed from the browser bundle. This is prepared
code for review, not an enabled trading feature or a completed real-wallet test.
Enabling it still requires the owner's scoped approval and a reviewed source
change; it must not be advertised as available in the current preview.

Five new offline tests cover the disabled gate before any wallet/storage access,
missing policy/preflight, persist-before-wallet behavior, explicit owner/chain/
calldata, failed preflight, wallet changes during reads and plan mutation while
preflight runs. The chain-4663 requests in those tests are in-memory fixtures:
no HTTP provider, real signature, private key or mainnet funds are involved.
They qualify the generic executor, not actual mainnet execution or the complete
composed adapter after future activation.

The renamed executor was also exercised against a fresh isolated fork sourced
from Robinhood block **100034744**. The latest receipt,
`data/review-20261028/evm/fork-cycle-1793186491328.json`, includes an existing
insufficient allowance, so the buy used **reset → finite approval → swap**, followed
by sell approval/swap and one deliberately lost approval response. Six local
requests and six serialized records were retained. QQQ returned to zero and the
unknown-response replay was blocked. All writes were to loopback chain 31337.
The Anvil process was stopped after the receipt; no mainnet write occurred.

The remaining gates are owner approval/eligibility and explicit local activation,
visible wallet-confirmation/cancellation/replacement UX, real-wallet signature and
receipt proof, L1 finality policy, mobile external-wallet continuation, native
qualification, fee/business-policy review and release approval. This checkpoint
must not be marked fully complete or release-ready on the basis of offline tests.

Final execution checkpoint checks: build/typecheck and full backend suite passed
**63 cases with two optional integration skips**. Five new execution-policy tests
are included in that count. Six browser cases passed; the final rebuilt browser
entry retained the same `index-CEZqcSO2.js` output because the dormant execution
adapter/writer is not imported by the UI. A build-content check found no executor
chain-approval error string. Formatting and whitespace checks passed. These
checks do not replace the explicit missing real-wallet/mobile/finality receipts.

## Exact transaction review

Prepared wallet steps now include an optional **Review exact transaction details**
disclosure. It shows chain 4663, connected wallet, zero ETH call value (network
fees separate), token/spender addresses, exact approval amounts, swap input,
minimum output, own-wallet recipient, deadline and pool fee. Contract links point
to the fixed Robinhood explorer. An expired or mismatched plan cannot be presented
as a current prepared request. No wallet request is opened by this disclosure.

Display and executor now share `verifiedSwapPlan`, which reconstructs canonical
calldata and compares the plan ID, chain, token pair, atomic input/minimum and all
calls. Tests reject altered semantic/display metadata as well as changed calldata;
this prevents a readable review from describing different limits than the request.
This is a review surface, not enabled wallet confirmation or mainnet acceptance.
The source-disabled execution policy and absent UI submission controls remain.

Exact-review validation completed: **64 backend tests passed, two optional
integrations skipped**, and **six browser cases passed** across Chromium, mobile
Chromium and WebKit. Browser assertions open the disclosure and check network,
zero ETH call value, exact 25-USDG approval and the fixed spender explorer link,
then verify only connection/read wallet methods occurred. Build/typecheck,
formatting, whitespace and the UI detector passed. No real-wallet request, native
build, new fork execution, activation or deployment is claimed for this UI change.

## Keyless mobile dapp-browser handoff

The wallet chooser now supports MetaMask's documented mobile **dapp-browser**
handoff at `https://link.metamask.io/dapp/{host}/` when there is no injected wallet
and an eligible HTTPS app origin is available. It does not use MetaMask's send,
buy, sell or approval deeplinks and requires no relay project ID or API key. The
handoff contains only the app origin; user addresses, amounts, sessions, routes,
queries and fragments are never included. It is a user-clicked link with no
referrer, not automatic navigation or connection approval.

Loopback/private numeric addresses, local/reserved host suffixes, HTTP, credentials,
nonstandard ports and origins with paths/query/fragments are rejected. This is
syntactic origin validation, not a DNS/reachability or ownership proof. The web
UI uses its current origin; a native build may explicitly supply a public,
non-secret `VITE_PUBLIC_APP_ORIGIN` after the owner chooses/approves that hosted
app. No such deployment or public URL was created here. Localhost instead explains
why a phone cannot open this Mac's local preview. MetaMask browsing has its own
storage; browser-local reviews/activity are not silently transferred or synced.

The primary source is MetaMask's
[mobile deeplink guide](https://github.com/MetaMask/metamask-docs/blob/main/metamask-connect/evm/guides/metamask-exclusive/use-deeplinks.md).
No consumer buy/sell flow, token send, app installation or account setup was
started. The link path is prepared code, not an installed-mobile-wallet receipt.

The wallet preview's market/quote reads and dormant preflight now use the existing
platform request transport. Previously those reads used relative browser fetch,
which would target Capacitor's local asset origin instead of its configured API.
Browser mode remains same-origin; native mode uses the existing configured
`VITE_API_ORIGIN` and Capacitor HTTP timeouts. The common browser timeout is now
20 seconds (rather than the previous standalone 15-second fetch). No credentials
or callback/transaction writes were added. Optional Vite-env access allows the
disabled adapter to be imported in Node qualification without accessing a wallet.
Native transport routing here is source-level evidence, not a fresh native build
or physical-device acceptance. A full native pairing bridge is not implemented;
this mobile option opens the hosted dapp inside the wallet instead.


Mobile-entry validation completed: **65 backend tests passed with two optional
integration skips**. Twelve browser cases passed across Chromium, mobile Chromium
and WebKit. New cases verify that localhost has no external-wallet handoff and a
virtual HTTPS origin constructs only the official dapp-entry link. The HTTPS page
was intercepted and served from local test assets; no public deployment, real
wallet, MetaMask launch or third-party navigation occurred. Unit checks cover
private, malformed and secret-bearing origins. Build/typecheck, formatting,
whitespace and UI detector passed. The writer remains absent from the UI bundle.
The physical-mobile and native-build gates are still unproven.

## Native wallet-first development builds

The current wallet-first source at `7c564f8b8b0aef2e1e4deae5f64aa69273daeeca`
was synced and compiled locally after the transport/mobile-entry changes. Prior
bundled assets were archived before sync. No native tracked file changed and no
owner device was installed, reset, signed into or updated.

- `MOBILE_API_ORIGIN=http://localhost:8745 VITE_PUBLIC_APP_ORIGIN= npm run mobile:sync -- --development`
  completed. The compiled endpoint is explicitly development-only and has no
  configured public wallet-handoff origin.
- Android debug `assembleDebug` succeeded with JDK 21 and Android SDK 36 installed
  locally. The first attempt failed because inherited `ANDROID_SDK_ROOT` and
  `ANDROID_HOME` pointed to different installations; the retry set both to the
  same existing SDK per command. No global environment or SDK setting was changed.
- Xcode 27.1 built the generic iOS Simulator target with
  `CODE_SIGNING_ALLOWED=NO`. The resulting app includes arm64 and x86_64 simulator
  executables. No signing identity or provisioning profile was used.
- Packaged Android JavaScript bytes and index match `dist-native`; the iOS index
  matches the same development build. Generated asset scans found none of the
  five saved provider credentials, and no transaction executor in the public code.
- The mobile release check exited 1 and refused the development/localhost origin
  as intended. That is a successful release-boundary check, not store readiness.

Private artifacts, full logs and SHA-256 checksums are preserved in
`data/review-20261028/evm/native-checkpoint/receipt.json`, with
`blunts-wallet-debug.apk` and `ios-wallet-simulator-unsigned.tgz` (mode 0600).
The server remains loopback-only; the application health still reports transactions
disabled. These build receipts supersede the earlier statement that no fresh native
build existed for this branch, but do not establish native runtime transport,
installed mobile wallet connection/signing, owner-account continuity, real-money
acceptance, store approval or release signing. Those remain separate gates.

Reproduce without changing system defaults:

```sh
MOBILE_API_ORIGIN=http://localhost:8745 VITE_PUBLIC_APP_ORIGIN= npm run mobile:sync -- --development
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
ANDROID_HOME=/Users/nubs/Library/Android/sdk ANDROID_SDK_ROOT=/Users/nubs/Library/Android/sdk \
npm run android:debug
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild \
  -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath data/ios-build CODE_SIGNING_ALLOWED=NO build
```

Use paths appropriate to the reviewed machine. Do not install this development
artifact onto a personal device or publish it as an investment product without
its respective owner/release approvals and runtime qualification.

## Actual iOS Simulator market-read runtime

A new isolated **Blunts Local QA 2026-10-28** iPhone 17 Pro simulator (iOS 27.0,
UDID `54F01CF2-FFA6-48B0-8975-7CADBE54C076`) was provisioned and booted. The
unsigned app from the recorded `7c564f8` native build was installed there and
launched, without opening a personal device, signing into accounts, importing
keys or connecting a wallet. This is a disposable test device, not the owner's
phone or an existing simulator profile.

The app console observed **WebView loaded**, then **CapacitorHttp request**, then
a successful QQQ market-data response containing the current bid/ask, chain 4663,
active status and `transactionsEnabled=false`. The local backend recorded the
corresponding market reads. This upgrades the native **market transport** from
source-only evidence to an actual installed simulator runtime receipt.

Simulator was not exposed in the current desktop computer-control app inventory;
its name and Xcode app path both returned unavailable controls. No alternate UI
injection was used. Therefore the screen/animations, tap flows, quote interactions,
external wallet launch, actual signing and physical-device acceptance are still
**unverified**. Console/network success is not a visible UI pass. Android was
compiled but not installed or runtime-tested in this checkpoint.

The own-app console and checksum receipt are private under
`data/review-20261028/evm/native-checkpoint/ios-runtime-receipt.json` and
`ios-runtime-console.log` (0600). The QA app was terminated and only this newly
created simulator was shut down after verification. Its data remains available
for resuming; no unrelated simulator or personal-device state was changed.
Loopback preview remains available and real signing remains disabled.


## Owner-approved local signing controls

The owner explicitly approved signing on October 28 while retaining the instruction
to keep everything local and obtain a later approval before public shipping. That
is authorization to implement/activate the local wallet request flow, not evidence
that any holder is eligible, that a real transaction was signed, or that the agent
may approve a personal financial transaction. No personal wallet or private key
was used during this change.

`executionPolicyForOrigin` enables signing only for HTTP `localhost`/`127.0.0.1`
web origins. Hosted HTTPS, Capacitor/native, missing and malformed origins stay
disabled. No URL parameter, localStorage preference or environment flag expands
that policy. The loopback server remains bound to 127.0.0.1. The API now reports
local execution availability in health/market/quote responses; the UI additionally
checks its own origin and the quote's availability flag. The signing adapter is
now lazily bundled, as required for the owner-approved local flow, rather than
absent from the bundle. Its execution policy still rejects hosted/native usage.

Prepared steps show a separate **Wallet signing** region with explicit real-funds
language and an unchecked issuer-eligibility/non-US-person acknowledgement. This
self-attestation is a UI prerequisite, not a substitute for the issuer's actual
restrictions, provider acceptance or legal/commercial review. The agent must not
check it or operate a real wallet on the user's behalf. Token terms remain linked.

Every reset, finite approval and swap is a separately chosen wallet request.
Declining (EIP-1193 code 4001) records cancellation without requesting a next step.
After sending, the holder must check the receipt; no next approval or swap is
started automatically. Receipt inclusion unlocks a later explicitly chosen step,
not an Ethereum-finality claim. If the quote expires during wallet interaction,
a fresh quote/review is required. Already-granted finite allowances can then be
rechecked and reused without repeating the earlier approval. Unknown/pending/
reorged/mismatched records block new requests, including after a fresh quote.

The composed adapter re-reads market reference, pool, allowance, balances and
minimum output, checks current ETH readiness, takes the wallet's exclusive Web
Lock, verifies account/network again after asynchronous work, reconstructs every
calldata byte, and persists before asking the wallet. No unlimited approval,
automatic funds transfer, key export, bank withdrawal or new Blunts fee was added.
The original proposed 1% Blunts fee is still unimplemented on this swap route and
must not be represented as collected or commercially approved.

Three new browser scenarios per engine use an in-memory wallet and fully
intercepted RPC/transaction fixtures: (1) approval and swap are separate explicit
requests with pinned chain/from/finite amount, (2) declining retains cancellation
without a next request, and (3) a simulated lost response retains unknown state
and blocks a repeat after a new quote. The fixture's virtual send endpoint is
intercepted before the actual local server; it is not an enabled application API
and sends no public-chain transactions. Existing local-fork contract execution
receipts remain separate evidence. No personal or mainnet trade is claimed.

Remaining: actual eligible-holder wallet confirmation/receipt and finality proof,
physical mobile connection, native signing integration, replacement/cancellation
transaction recovery, fee/business-policy acceptance and explicit public-release
approval. The app is not yet proven complete or production-ready.

Local-signing final verification: **66 backend tests passed, two optional
integrations skipped**, and **21 browser cases passed** across Chromium, mobile
Chromium and WebKit. Signing, cancellation and lost-response UI cases use only
disposable intercepted wallet/RPC fixtures. Final build/typecheck, formatting,
whitespace and UI detector passed. The signing-screen screenshot is explicitly
fixture evidence, not a personal wallet or real trade receipt.

The actual localhost server was restarted and `/api/health` returned HTTP 200
with `transactionsEnabled=true`, reflecting the owner's new local approval. No
wallet was connected by the agent. Browser-control refresh then failed because
the control bridge reported `browser.user` unavailable; no claim is made that
the owner's already-open tab was refreshed. Opening/reloading localhost loads
the new controls. Publishing, hosted/native activation and agent-performed trades
remain unapproved. Earlier read-only native artifacts are preserved unchanged.

## Integrated UI → signed fork transactions → deployed contracts

The actual local web app/execution adapter at source
`85682deb3ec438d2d8e86d0f3de4f7b3058525e7` passed a complete UI-driven buy/sell
against a fresh isolated Anvil fork sourced from Robinhood block **100058896**.
This test intentionally retains **chain ID 4663** so the unchanged app's chain
binding, preflight and signed requests are exercised. It is still a private
loopback fork, not Robinhood mainnet; chain ID alone is never treated as proof.

The harness in `scripts/qualify-wallet-ui-fork.ts` validates the fixed
`http://127.0.0.1:8752` endpoint using both its chain ID and `anvil_nodeInfo` fork
identity. All transaction writes go only to that loopback node. Browser RPC reads
are method-allowlisted and forwarded to the fork without rewriting chain IDs.
The separate loopback app server on 8753 uses the actual market/quote endpoints;
its public-chain calls are read-only. No API quote/receipt JSON was fabricated
for this integration run.

A freshly generated test key stays only in the Node process; it is not sent into
the page, stored on disk, logged or reused as a personal wallet. The virtual
wallet is funded only in the fork. Its normal viem wallet client cryptographically
signs requests and submits them to the fixed Anvil transport. Anvil logs recorded
**four `eth_sendRawTransaction` calls**, with four successful contract receipts.
No personal keys, owner wallet, hardware wallet, mainnet transaction or real funds
were used. The public browser wallet interface is a harness adapter, so this is
not an installed MetaMask/Rabby/mobile-wallet acceptance claim.

The UI chose each step separately and checked its real fork receipt before the
next request: USDG finite approval → QQQ buy → QQQ finite approval → full sell.
Virtual USDG began at **50** and ended at **49.975006**, and QQQ returned to **0**.
Those are disposable fork balances showing pool costs, not customer holdings or
returns. A real page reload/reconnect recovered four included browser-journal
records whose hashes match the four actual fork receipts. The success screenshot
uses normal app copy but is **fork evidence only**, not public-chain inclusion or
an Ethereum-finality assertion.

Private evidence:
`data/review-20261028/evm/ui-fork-1793189003222/receipt.json`, the Fill/Spark
screenshots in that directory, and `ui-fork-anvil-third.log` (0600). Two earlier
bootstrap attempts stopped before wallet requests because the standalone tsx
runner emitted a `__name` helper into the serialized initializer. Page errors
identified that harness issue; a plain JavaScript initializer fixed it without
changing the app or weakening any wallet/chain/approval check. Failed-run
screenshots/logs remain separate from the passing receipt.

After qualification, the temporary fork (8752) and QA app server (8753) were
stopped. The owner's actual local preview (8745) stayed running with the approved
local-signing policy. Typecheck (including scripts), formatting and whitespace
checks passed. App/backend code was unchanged in this checkpoint; prior 66-pass/
two-skip backend and 21-case browser-fixture receipts are not relabeled as this
contract-integration proof.

To reproduce in three local terminals, use an unused fresh fork and do not point
this harness at an owner wallet or alternate RPC:

```sh
npm exec --yes --package=@foundry-rs/anvil@1.7.1 -- anvil \
  --fork-url https://rpc.mainnet.chain.robinhood.com --chain-id 4663 \
  --accounts 0 --host 127.0.0.1 --port 8752 --no-storage-caching
PORT=8753 npm start
npx tsx scripts/qualify-wallet-ui-fork.ts
```

Keep the fork fresh because the public source RPC may prune historical state.
The script changes only virtual fork state and an isolated browser context. Stop
only the task-owned QA processes afterward. Physical/native wallet confirmation,
actual eligible-holder/mainnet receipt and finality, fee-policy acceptance and
public-release approval remain unproven gates.

## Read-only replacement and wallet-cancellation recovery

Activity can now verify a replacement hash against one saved sender/nonce. Only
an identical zero-ETH call or a zero-value empty-data self-send (wallet cancellation)
is accepted. A distinct request/recipient/nonce, ambiguous prior records, unmined
replacement, wrong receipt hash or noncanonical block leaves the original attempt
blocked. The observer never creates or sends a cancellation/replacement itself.

A canonical replacement receipt adds nested replacement proof to the original
record and marks it `replaced`. The original call, hash and nonce are immutable;
no extra economic attempt is created. A reverted replacement also consumes that
nonce but is labeled reverted, not successful execution of the original call.
Recovery requires a fresh quote/review; it does not authorize the next step of
an old plan or automatically retry a previously uncertain transaction. Same-call
replacement does not silently change the earlier amount, recipient or limits.

Receipt refresh uses the replacement hash, not the displaced original hash. RPC
outage preserves last proof and reports unavailable. A contradictory canonical
block marks the record reorged again, which blocks new requests. Only one proven
replacement hash is retained per original instruction; a later distinct replacement
after a reorg remains a manual reconciliation case rather than an inferred retry.
This is L2 receipt verification, not an independent Ethereum-finality proof.

The UI shows original and replacement links, explicit cancellation/equivalent/
reverted labels, and prompts for a fresh quote after replacement. The browser
scenario verifies a pending approval → tracked cancellation → preserved original
hash and one journal row → new review still requiring fresh acknowledgement.
No new wallet request is made by that recovery. Its cancellation receipt is an
intercepted RPC fixture; actual cancellation-on-fork qualification has not yet
been performed. Prior signed full-cycle fork receipts are a separate boundary.

Unit coverage includes canonical cancellation, same-call and reverted replacement,
unmined/wrong-nonce/changed-call/noncanonical rejection, outage/reorg readback and
original-record immutability. A journal write now also checks the serialized size
before storage so it cannot replace readable history with an over-limit document.
Existing oversized/corrupt history is preserved rather than auto-deleted.

Replacement checkpoint final checks: **70 backend tests passed with two optional
integration skips**, and **24 browser cases passed** across Chromium, mobile
Chromium and WebKit. Build/typecheck, formatting, whitespace and UI detector passed.
Full logs are private under `data/review-20261028/evm/replacement-recovery/`.
The local preview remains enabled only under the owner's loopback-signing approval;
no real-wallet cancellation, personal key use, mainnet submission or deployment
was performed during this change.

## Actual signed cancellation/replacement on the local fork

The extended full-UI harness passed the new recovery code at source
`1139ad82d61a9a31523995992fc13996aa14e5a8` against a fresh Anvil fork of
Robinhood block **100069737**. All the fixed-loopback, fork-identity, generated
in-memory key and read-only public-API constraints above remained in place.
The fork retains chain ID 4663 without rewriting any chain-id response.

After four successful UI-driven approval/buy/approval/sell receipts, the harness
paused **local fork** automining and used the UI to request another finite
approval. The test wallet signed it at nonce **4**, but it remained pending.
The same disposable test key then signed a zero-value empty-data self-send at
nonce 4, with higher fees. A local block mined the replacement; the cancellation
had a successful receipt and the displaced original had no receipt. No personal
wallet or public-chain mining/mempool was touched.

The actual app Activity UI tracked that cancellation hash, verified the canonical
fork receipt and recovered one `replaced` record preserving the original hash,
call and nonce with nested cancellation proof. A real browser reload/reconnect
retained five journal records: the four completed cycle steps and the displaced
approval. No new UI request followed recovery. QQQ remained zero and USDG was
unchanged by the cancelled approval. Anvil logs recorded **six raw signed
submissions**: four mined cycle transactions, the displaced pending approval,
and the one mined cancellation. There were five successful receipts in total,
not six successful transfers or orders.

Private receipt and screenshot:
`data/review-20261028/evm/ui-fork-1793190131905/receipt.json` and
`cancellation-included-local-fork.png`. The receipt distinguishes the five UI
requests from the one cancellation initiated by the test harness. It records
`originalReceiptMissing=true`, `originalPreserved=true`, `reloadVerified=true`
and `newUiRequestAfterRecovery=false`. The fork/QA-server logs are preserved under
`data/review-20261028/evm/replacement-recovery/`. All are local test evidence,
not a mainnet cancellation or a personal-wallet signature receipt.

The QA app server (8753) and Anvil node (8752) were stopped afterward; the owner's
approved local preview on 8745 stayed running. Ephemeral test keys were not saved.
The harness restores local automining in its cleanup path if interrupted. Final
TypeScript and formatting checks passed. A callback-mutated array count needed an
explicit getter to avoid TypeScript's stale literal-length narrowing; no app
transaction, security, timeout or rate-limit policy changed for this qualification.

This supersedes the earlier fixture-only limit specifically for **local-fork
cancellation recovery**. Installed-wallet/hardware/mobile acceptance, real eligible
holder/mainnet receipts, Ethereum finality, fee/business approval and public
release approval remain separate unproven gates.


## RPC finality observations — October 28

Activity now checks the receipt's canonical block against ordered latest, safe
and finalized RPC heads. It labels sequencer inclusion, RPC safe or RPC finalized
separately. This trusts the RPC's tags; independent Ethereum batch proof and
bank/bridge settlement are not established. An unavailable check preserves the
prior proof and its timestamp; a canonical mismatch marks the record reorged.
A changed receipt cannot reuse a proof for an earlier block.

`npm run check`: 76 passed, two optional service skips. Browser suite: 24 passed.
The six new tests cover tag boundaries, invalid heads, canonical contradiction,
outage preservation, stale concurrent observations and stale proof rendering.
One bounded public read-only qualification observed RPC-finalized status for an
unrelated public transaction: `data/review-20261028/evm/public-finality-1793190684498.json`.
It sent zero transactions and is not an owner trade acceptance receipt.

Owner subsequently approved 1% Fill and Spark fees to public wallet
`0x4a27c325De7629c6bBD187E1e456B56c82E73073`. Implementation and signed-fork
fee verification remain the next work; this checkpoint still charges no app fee.


## Approved 1% fee, atomic router qualification — October 28

Owner approved the fee and public receiving wallet
`0x4a27c325De7629c6bBD187E1e456B56c82E73073`. Commit `ae8d602` fixes both
100 bps and this recipient in source with no runtime overrides. The route uses
the existing SwapRouter02's deadline-protected `multicall`: `exactInputSingle`
sends gross output to the router, and `sweepTokenWithFee` sends the fee to that
address and the remainder to the connected holder. The minimum in the router is
gross; the displayed minimum is its net after the same floor-rounded fee.
Both operations revert together. Approvals still authorize only the exact input.

Fill collects QQQ and Spark collects USDG. This differs in denomination from the
preserved provider architecture's input conversion fee; both retain the approved
1% rate. The UI and walkthrough disclose it, including full receiving address in
exact transaction details, estimated fee, net output/minimum, separate pool cost
and gas. API `amountOut` and `minimumOut` remain gross quoter values; shared
`quoteAfterFee` derives net amounts. Reference shortfall remains a pool-output
comparison before the app fee, labelled accordingly. The stateless router sweep
uses its full output-token balance, including any incidental dust; the fee applies
to that swept balance. No output remains intentionally stored in the router.

Official source used: [SwapRouter02](https://github.com/Uniswap/swap-router-contracts/blob/main/contracts/SwapRouter02.sol),
[V3SwapRouter](https://github.com/Uniswap/swap-router-contracts/blob/main/contracts/V3SwapRouter.sol)
and [PeripheryPaymentsWithFee](https://github.com/Uniswap/v3-periphery/blob/main/contracts/base/PeripheryPaymentsWithFee.sol).
Actual contract behavior was qualified on the isolated fork, not inferred from
these source links alone. Old fee-free own-wallet batches remain trackable
read-only; new fee batches reject changed token, recipient, fee bps, minimum,
fee recipient or arbitrary additional calls. Existing unknown requests still
require exact calldata matching and cannot silently acquire the new fee.

Validation: `npm run check` 78 passed/two optional service skips; browser 24 passed
across desktop Chromium, mobile Chromium and WebKit; formatting passed. Added
coverage includes rounding at small units, minimum rounding in both token decimal
scales, exact atomic destinations, tampered fees and old activity compatibility.

Fresh committed-source receipt:
`data/review-20261028/evm/ui-fork-1793191879094/receipt.json`, source `ae8d602`,
fork block 100086216 (the receipt's forkSource is authoritative). The app completed
four signed cycle requests. The receipt verifies exact 1% transfers to the public
recipient and actual QQQ/USDG recipient balance deltas. A separate harness signed
a finite 1-USDG approval followed by an impossible-minimum swap. The swap mined
reverted, preserving holder and recipient token balances. ETH gas still applies.
The UI subsequently requested a clear-allowance step; a same-nonce signed
cancellation displaced it, and reload preserved the original plus replacement
proof without automatic replay. There were five UI signing requests and three
additional harness requests (failure approval, failing swap, cancellation): eight
signed submissions total, six successful receipts, one reverted receipt and one
displaced pending request. This was isolated fork state only, with a disposable
in-memory key, zero personal keys and zero public-chain writes.

An earlier attempt timed out because the harness expected approval after its own
nonzero allowance test; the app correctly required clearing that allowance first.
The harness was corrected to use the displayed clear-allowance action. Prior
attempts are preserved separately and are not the final acceptance receipt.

Shipping/publication remain unapproved. Physical installed-wallet and eligible
holder mainnet acceptance remain unproven, independent of these local results.


### Refreshed local native artifacts for the fee change

Android debug and unsigned iOS Simulator builds both passed from `ae8d602`.
Native sync uses development API origin `http://localhost:8745`, with no public
wallet handoff origin. All nine native JavaScript bundles were SHA-256 matched
against both the APK and Simulator app contents. New private copies and checksums:
`data/review-20261028/evm/fee-native-checkpoint/receipt.json`,
`blunts-wallet-fee-debug.apk`, `ios-wallet-fee-simulator-unsigned.tgz`.
The previous native checkpoint remains preserved. The release check correctly
refused this development/loopback build. No release identity or provisioning
profile was used, and no device install or native signing acceptance is claimed.

Temporary QA server 8753 and Anvil 8752 were stopped. The loopback-only preview
on 8745 was restarted and its health returned `transactionsEnabled: true`.
That enables individual holder-controlled web requests locally, with no automatic
trade and no hosted/native enablement. Documentation changes follow the tested
source commit; they do not change the app or artifact hashes.


## Installed MetaMask connection and real balance timing fix — October 28

The owner-authorized nubsontopgang Chrome profile has installed MetaMask. Its
normal localhost connection returned the owner's public 0x4a27…3073 account.
The wallet initially selected Ink (57073); the app's switch request selected
Robinhood Chain. This exposed a real bug: balance invalidation after switching
could leave the UI unavailable until manual refresh.

A controlled browser regression first reproduced an early network event followed
by a later switch acknowledgement. Moving invalidation before the request fixed
that ordering, but the actual MetaMask retest still failed. The remaining gap was
identity announcements with unchanged scalar state: they invalidated outstanding
reads while the React account/chain dependencies did not schedule a new read.
Commit `91b507b` adds a wallet revision dependency and prevents a late switch
acknowledgement from overriding the newer event-owned view. Tests cover early and
absent network events, followed by repeated identical chain/account events.

The final actual MetaMask retest started on Ink again, used the app switch to
4663 and displayed $0.00 / 0 USDG automatically, without Refresh balances.
Reload/reconnect worked. A live 25-USDG Fill quote disclosed the 1% output fee.
Read-only preparation then displayed "Not enough USDG in this wallet." instead
of the generic verification error. Only a known typed local balance error may
supply that message; arbitrary RPC error text is still not rendered. No wallet
signing prompt opened, no token allowance was granted and no funds moved.

Private receipt and screenshots are in
`data/review-20261028/evm/metamask-installed-readonly-receipt.json`,
`metamask-network-switch-fixed.png`, `metamask-insufficient-usdg.png`.
The receipt ties the observations to commit `91b507b` and the served bundle hash.
These establish installed-browser connection, network switching, live reads and
insufficient-funds rejection only. They do not establish holder eligibility,
installed-wallet signing, mainnet swap acceptance or mobile/hardware behavior.

Final checks: 78 passed/two optional skips, browser 30 passed, formatting passed.
Fresh Android debug and unsigned iOS Simulator builds passed; all nine JavaScript
bundles matched both packages. Private artifacts/checksums are preserved under
`data/review-20261028/evm/wallet-live-native-checkpoint/`. Native signing remains
disabled, the preview remains loopback-only, and shipping remains unapproved.
The prior fee and native checkpoints remain intact.


## First-use network setup and native runtime qualification

`96ce00d` adds a separate, explicit Add Robinhood Chain action after wallet error
4902. Metadata is fixed from the canonical chain definition, with no URL/storage
overrides. Cancellation remains retryable. Adding does not imply switching; when
the wallet stays on its previous chain the next Switch action is explicit. A
local in-flight guard prevents concurrent network prompts. Browser fixtures
verify the exact payload, cancellation, no automatic request chaining and correct
network readback. No owner wallet network was removed merely to test addition.

The dedicated Android emulator qualified the real native WebView, actual
CapacitorHttp market/quote reads, net fee display and disabled signing. The original
tray was verified in the native framebuffer; CDP's screenshot omitted GPU content.
The harness `scripts/qualify-android-runtime.ts` targets only emulator-5580 with
AVD name blunts_wallet_qa_20261028 and the separately established loopback WebView
forward. Playwright's documented noDefaults option avoids browser-context
management unsupported by WebView; it does not relax any app signing policy.
Initial failed connection attempts and all native console warnings remain local.

The current iOS simulator build loaded its WebView and returned a real 200 QQQ
market response through CapacitorHttp. The first framebuffer exposed the network
label overlapping the notched-screen counters. `38fef72` includes the safe-area
inset in that label's top offset. The second actual simulator framebuffer shows
clear separation and the original tray. Both native environments are stopped
afterward. Only the task-created AVD/simulator were used, with no personal wallet.

Final checks after the layout fix: 78 passed/two optional service skips, browser
36 passed, formatting passed. Fresh Android debug and unsigned iOS Simulator
builds passed, with nine JS bundles verified against both packages. Current
artifacts, exact receipt paths and unresolved native-wallet/holder/release gates
are listed in [local wallet acceptance](local-wallet-acceptance.md).
