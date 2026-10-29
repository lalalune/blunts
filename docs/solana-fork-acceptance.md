# Local Solana fork acceptance — October 29, 2026

The owner deferred personal wallet prompts and requested an agent-owned test
wallet on devnet or Surfpool. Surfpool 1.7.0 was used to fork mainnet state so
the test could execute the actual QQQx, Jupiter and Raydium programs locally.
No real SOL, USDC or QQQx was spent, and the personal wallet was untouched.

## Reproduce

`npm run test:solana:fork`

The harness creates a random wallet in memory, starts a loopback-only Surfnet,
funds it with fake SOL and USDC, and uses the production prepare/submit/receipt
functions. It asserts the transaction endpoint is exactly the SDK-created
loopback RPC before signing. Mainnet is used only to read program/account state
and live Jupiter builds. No private key is persisted or printed.

It then starts the actual Fastify app on another loopback port and launches an
isolated Chromium context. The browser's localhost:8753 requests are bridged to
that real HTTP service: prices, balances, simulations, submissions and receipts
are not mocked. Wallet Standard signing is provided only for the disposable
wallet, with a valid local blockhash check. Personal Chrome is not automated or
modified by this test. Browser, HTTP service and Surfnet are stopped afterward.

## Verified $1 round trips

| Path | USDC spent | QQQx raw units received/sold | USDC returned | Buy fee, QQQx raw units | Sell fee, USDC |
| --- | ---: | ---: | ---: | ---: | ---: |
| Production API | 1 | 137148 | 0.979902 | 1385 | 0.009898 |
| Actual browser UI | 1 | 137148 | 0.979904 | 1385 | 0.009898 |

Both paths finalized on the local fork, passed exact input/output and 100bps
fee validation, and sold the complete position. After both round trips the
wallet held 24.959806 fake USDC and zero QQQx. QQQx has 8 raw decimals; its
onchain multiplier is applied separately for display. These are fork receipts,
not mainnet explorer transactions or a promise of future execution prices.

The browser reached both “Fill complete” and “Spark complete” through the same
simple screens and automatic finalized receipt watcher. Screenshots, the four
transaction records, activity journal, initial/final balances and HTTP traces
are retained under `data/review-20261029/surfpool/` (ignored by Git). A read-only
check confirmed the disposable wallet had zero real-mainnet SOL and no real
mainnet transaction history.

## Issues exercised and corrected

- Surfpool does not always retain block-time records for its newest slots. The
  app can now use the canonical Clock sysvar when that record is absent. Owner,
  size, executable status, slot proximity and the existing 90-second freshness
  bound are checked. Stale or mismatched clocks remain rejected.
- Fastify's generic error handler previously changed a rate-limit response to
  HTTP 400. It now retains valid HTTP status codes, including 429. Real HTTP
  tests also verify origin restrictions, invalid submissions and that API
  throttling does not block static assets.

98 unit checks pass, with two optional legacy checks skipped. Existing evidence
also includes 14 Solana desktop/mobile fixture cases and 48 EVM browser cases.
Fork execution is additional evidence rather than a replacement for those tests.

## Band milestone and larger trade

`npm run test:solana:fork:game` uses a separate disposable wallet and 2,500 fake
USDC. The actual browser bought with 1,030 fake USDC, rendered **10 rolled / one
band**, then sold the complete position and ended with zero QQQx. Evidence is
under `data/review-20261029/surfpool/game/`, including the milestone screenshot.
Every trade again passed exact receipt and fee validation.

This exposed a larger-route request issue: V2 build did not enforce the old
V1-only direct-routing flags and selected an unsupported multi-hop route. The
request now uses V2's documented `maxAccounts=30` budget. The same strict
single-pool instruction validation remains; no extra route or signer permission
was accepted merely to make the test pass. A real larger-build fixture and the
full fork execution cover the correction.

## Still deferred

Personal holder-confirmed funded mainnet acceptance has not been performed.
Production RPC/API capacity and the previously documented moderate dependency
findings remain release considerations. Solana has not been pushed, published
or enabled on blunt.nubs.site. Shipping still requires the owner's approval.
