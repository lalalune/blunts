# Public deployment added — October 28, 2026

Owner approved shipping and https://blunt.nubs.site is deployed. Live installed
MetaMask connection, network switch, balances, quotes, fee disclosure and the
insufficient-USDG guard were checked without a signature. Full funded mainnet
acceptance remains unperformed. See [production receipts and rollback](shipping-2026-10-28.md).
The local-only acceptance map below is historical; it does not revoke the later
explicit publication approval.

# Blunts local wallet acceptance — October 28, 2026

The owner subsequently clarified the active product is the normal Web3 **web
app**, using an existing browser wallet. Native pairing is optional future work
and is not a web-completion gate. The experiment is preserved separately at
`codex/native-wallet-prototype-20261028` (`11fa854`); the active web branch
reverts its SDK dependencies in `e4d4b63`. Nothing is deployed or published.
This is the current acceptance map; the longer provider/launch documents retain
historical proposals and receipts. The owner replaced the active provider-first
route with an EVM wallet + Robinhood Chain, then approved local signing and the
1% Fill/Spark output fee. This does not establish public-release readiness.

## Verified local scope

| Requirement | Authoritative evidence | What is established |
|---|---|---|
| Preserve prior implementation/data | Provider branch `codex/local-review-20261027` at `e89c958`; current branch retains it as ancestor; ignored data retained | Recoverable provider version; active server loads no provider credentials or old ledger |
| Preserve Shaw's visual product | Current and provider-branch `app/client/tray-scene.js` blob both `1349c390d72fe6ce8cf9e3203fbef65e0ffe1cd7`; actual browser/Android/iOS captures | Original tray scene retained; Fill uses the incumbent Lucide money icon |
| Dinari/MoonPay as far as verified | `data/review-20261028/provider-qualification.json` | Actual Dinari sandbox identity/QQQ reads and MoonPay indicative sandbox quote; KYC incomplete; not customer/order/funding/payout acceptance |
| Protect credentials | Owner-owned regular credential file mode 0600; `git check-ignore` passes; current provider/auth routes 404 | Credentials preserved outside Git and unused by active wallet server |
| Fixed canonical chain and tokens | `app/shared/robinhood.ts`; live quote reads; signed fork contracts | Robinhood 4663, canonical USDG/QQQ, published Uniswap router/pools; no invented bridge |
| Normal EVM connection | `data/review-20261028/evm/metamask-installed-readonly-receipt.json` | Actual installed MetaMask connection, network switch, reload/reconnect, public reads and insufficient-funds rejection |
| First-use network setup | `app/evm-tests/add-network.spec.ts`; screenshots in test results | Fixed EIP-3085 metadata, explicit Add, cancellation/retry, and separate Switch when adding does not select it; fixture qualification only |
| Scoped local signing | `app/shared/execution-policy.ts`; signing browser cases; full UI fork receipt | HTTP loopback web only; holder chooses finite approval and swap separately; hosted/native signing disabled |
| Actual signed execution and fee | `data/review-20261028/evm/ui-fork-1793191879094/receipt.json` at `ae8d602` | Deployed-contract buy/sell, exact 1% output fee recipient balance deltas, mined revert with zero token movement/app fee, cancellation recovery; isolated fork only |
| Recovery and observation | Journal, multi-tab locking, replacement and finality tests | No automatic replay; immutable original attempts; RPC inclusion/safe/finalized tags remain separate from independent Ethereum settlement |
| Current app checks | `web-focus-check.log`, `web-focus-browser.log`, `web-focus-format.log` under private review/evm | 78 passed/two optional service skips; 36 browser cases passed; formatting passed |
| Historical Android runtime | `data/review-20261028/evm/android-runtime/receipt.json`, native framebuffer | Dedicated Android 14 emulator: real WebView/Capacitor HTTP market and quote, fee UI, signing disabled, no-wallet state, original 3D tray |
| Historical iOS runtime | `data/review-20261028/evm/ios-runtime-current/receipt.json` | Current unsigned iPhone 17 Pro simulator app: real market read, original tray and corrected safe-area header; no wallet/signature |
| Optional native packages | `data/review-20261028/evm/current-native-checkpoint/receipt.json` | Android debug APK + unsigned iOS Simulator archive; all nine JS bundles matched to both packages; development API only |

API quote `amountOut`/`minimumOut` remain gross pool amounts. UI output/minimum
are net of the floor-rounded 1% fee. Fill fees are QQQ; Spark fees are USDG.
Recipient: `0x4a27c325De7629c6bBD187E1e456B56c82E73073`. Pool fees and gas
are separate. The fee and swap revert atomically. Earlier fork receipts remain
valid for their recorded source; later network/CSS changes did not alter swap code.

## Open work and acceptance limits

1. **Web focus:** connect the existing EVM browser wallet. No native SDK, phone
   setup or new wallet account is required by the desktop flow. The separate
   prototype's SDK relay/link preparation and missing-app/return checks do not
   establish peer-wallet acceptance; retain them as optional research.
2. **Real holder execution:** the observed wallet has zero USDG. Holder eligibility
   was not verified. No personal-wallet allowance/signature or mainnet swap was
   requested. An eligible holder must personally perform financial acceptance;
   fixtures, fork signatures and public transaction samples cannot replace it.
3. **Optional device support:** simulator/emulator captures do not prove physical
   phone, hardware wallet, native pairing, background return or device signing.
   These are future support claims, not prerequisites for the active desktop web app.
4. **Publication:** public host, owned app links, production deployment, release
   signing/provisioning, store review and live smoke tests remain unapproved and
   unverified. No public tunnel or paid provider plan was created.
5. **Creative work:** concepts and marketing drafts remain deferred in
   [creative proposals](creative-proposals.md); nothing was posted.

Android's WebView CDP screenshots omitted the GPU canvas while the actual
emulator framebuffer displayed the tray. Use `native-tray-device.png` for visual
evidence. Initial Capacitor SystemBars injections logged null-root warnings;
these are retained, not hidden, and no crash was observed. The iOS safe-area
overlap was fixed in `38fef72` and rechecked in the actual simulator.

The task-owned Android emulator, forwards and iOS simulator were stopped. Their
data/evidence remains preserved; unrelated devices/simulators were not changed.
The owner's preview remains at `http://localhost:8745`.

Network setup follows [EIP-3085](https://eips.ethereum.org/EIPS/eip-3085) and
[EIP-3326](https://eips.ethereum.org/EIPS/eip-3326), using the already verified
[Robinhood contracts/network references](evm-robinhood.md).


## Completion audit of the authorized local web work

Audited active source `fa27997`: clean checkout, loopback health OK, preserved
provider and optional native branches, owner-owned 0600 ignored credentials,
actual sandbox-read receipts, actual installed-browser read receipt, and actual
signed-fork buy/sell/fee/revert/replacement receipt were inspected. Fee, calldata,
executor, journal and transaction-observation modules match the signed-fork
checkpoint. `prepare-swap.ts` differs only by the known insufficient-balance
error class, with unchanged checks and transaction behavior. The later browser
identity/cleanup changes passed the current 36-case suite.

At that checkpoint, the then-authorized local implementation/qualification was complete as
far as it can proceed without holder actions. Dinari/MoonPay customer/trade work
was superseded by the owner's wallet-only decision and remains preserved rather
than presented as accepted. Native app work was explicitly removed from the
active scope. Optional marketing copy has been refreshed for the actual web
route and remains unposted.

This closes the local development goal, not mainnet or launch acceptance. Real
holder execution/eligibility and public deployment remain intentionally on hold
under the owner's instructions. They must not be represented as passed, and no
automatic wallet transaction or publication should occur when this goal closes.

## Subsequent release preparation

The owner subsequently requested production preparation and selected
https://blunt.nubs.site. That audit found stale account-based container/CI smoke
configuration and a server that ignored HOST. Those were real packaging gaps
after the local UI goal closed. See [web release preparation](web-release.md).
The active package now uses the wallet server, the chosen origin, real published
container ports and a wallet-specific smoke check. Hosted signing and public
deployment remain withheld; earlier local completion must not be read as
production acceptance.

## Final local release checks

The later release pass qualified 82 passing tests (two optional legacy-service
skips), 36 passing browser checks, zero known production dependency audit issues,
actual Docker startup/smoke, certificate-verified local HTTPS, separate API budgets
for real proxy clients and rejection of spoofed forwarding headers. Fresh actual
market reads and both direction quotes worked. The exact-domain activation patch
is prepared and offline-qualified but unapplied. Source approval remains false;
no personal signature, public deployment or DNS change occurred. See
[the current shipping gates](web-release.md).
