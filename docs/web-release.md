# Current status: shipped with owner approval

**https://blunt.nubs.site is live.** The owner explicitly approved publication,
DNS/TLS work and exact-domain signing on October 28, 2026 (Pacific).
See [the production release record](shipping-2026-10-28.md). The active release
is the qualified Node container behind existing Traefik, not the Cloudflare edge
experiment. Source `HOSTED_RELEASE_APPROVED=true`; other domains stay denied.
The original local-only preparation below is a historical checkpoint.

# Web release preparation — October 28, 2026

The owner selected **https://blunt.nubs.site** (singular) as the temporary
canonical origin. This is configuration preparation only. No DNS, public
hosting, deployment, purchase or public wallet-signing activation is approved.
The existing local wallet preview remains http://localhost:8745.

## Prepared package

`app/shared/release-target.ts` pins the chosen HTTPS origin. The EVM server now
honors HOST and validates PORT/APP_ORIGIN. Normal development still binds
127.0.0.1. An all-interface container defaults to the chosen release origin and
reports transactionsEnabled=false. Hosted execution remains denied by the shared
origin policy; no environment switch enables hosted wallet signatures.
`HOSTED_RELEASE_APPROVED` is pinned to false in source. The one-line activation
patch at `infra/approval/enable-hosted-signing.patch` remains **unapplied**.
`npm run release:qualify-origin` applies it only to a temporary offline copy,
checks the exact origin plus 14 rejected inputs, then removes the copy. It makes
no network/wallet requests and leaves active source unchanged.

The active Docker/Compose package serves the wallet app without PostgreSQL,
provider credentials, account registration or a simulated ledger. Compose maps
127.0.0.1:8746 to container port 8745 so it remains a local review package. The
older account-based Compose file and smoke script are preserved as
`compose.legacy.yaml` and `scripts/smoke-legacy-container.mjs`.

```sh
docker compose up --build -d
node scripts/smoke-local-container.mjs http://localhost:8746
docker compose down
```

The smoke script checks the chosen origin, disabled hosted signing, built client
asset, HTML, CSP, SPA fallback, removed account/provider endpoints and malformed
quote rejection. It performs no wallet calls or economic actions. CI uses an
actual loopback published port instead of host networking, so a loopback-only
container listener cannot falsely pass.

## Final local verification

- Build and 82 tests passed, with two optional legacy-service skips (PostgreSQL
  and a running Steward service); neither is used by the active wallet server.
- All 36 Chromium/mobile-Chromium/WebKit cases passed; formatting passed.
- Production dependency audit reported zero known vulnerabilities.
- API responses explicitly use `Cache-Control: no-store`; the container smoke
  checks that release health is not cached.
- Actual Docker build, wallet smoke and exact production Caddyfile validation
  passed. Image `blunts-local:release-final` remains local.
- `npm run release:qualify-https` verified certificate chain and hostname for
  `blunt.nubs.site`, using an explicit connection to 127.0.0.1:8748 and a disposable
  CA. A client without that CA failed certificate validation as expected. The
  test checked app HTML, JS assets, CSP and HSTS through the real proxy.
- The HTTPS qualification exhausted one real client's 90/minute API budget and
  confirmed that another client retained access. Rotating forged X-Forwarded-For
  headers did not reset the first client's budget. This catches the previous
  shared-proxy-IP bug; development still ignores forwarded headers.
- Fresh issuer/chain reads and both Fill and Spark quotes succeeded against the
  actual public Robinhood endpoints. Hosted signing remained false. These were
  read-only calls, not approvals or trades.
- Financial plan, journal, tracking and canonical-contract modules still match
  the previously signed local-fork checkpoint `ae8d602`. The buy/sell, exact fee,
  revert and cancellation evidence remains local-fork evidence.

Logs: `data/review-20261028/evm/final-*`. In particular,
`final-local-https.log`, `final-public-readcheck.json`,
`final-origin-qualification.log`, `final-container-smoke.json`,
`final-release-check.log`, and `final-release-browser.log`.
Qualification containers/networks/disposable CA material were removed. Images
and receipts remain. No OS trust change, public certificate request, public
listener, DNS edit, deployment or wallet signature occurred in this pass.

The HTTPS script requires Docker plus the prebuilt app/Caddy images:

```sh
docker build -t blunts-local:release-final .
docker pull caddy:2-alpine
npm run release:qualify-https
```

## What still blocks shipping

| Gate | Current state | What resolves it |
|---|---|---|
| Owner shipping approval | Withheld as instructed | Explicit approval for publication and exact-domain activation |
| Actual production destination, DNS and public TLS | Not deployed; no production server has been selected in this release package | Choose the existing server, install the qualified image/proxy, point the subdomain, obtain public TLS, and check the served revision after approval |
| Full live financial acceptance | No eligible holder's funded mainnet buy/sell has been performed | An eligible holder personally verifies wallet prompts, USDG/ETH readiness, Fill/Spark, fee transfers and activity on mainnet |
| Hosted final checks and rollback | Cannot be proved against an unpublished host | Recheck health, origin policy, headers, fresh quote reads, wallet continuity and recovery on the actual HTTPS host; record image/revision and rollback receipt |

There are no Dinari/MoonPay signup/API-key, paid-domain purchase or native-phone
requirements for this web release. Local tests do not prove issuer eligibility,
public hosting or personal mainnet execution. There is no known outstanding local
functional failure in the checks above; this is not a claim of perfect software.

## Prepared deployment and rollback

`infra/Caddyfile` is the reviewed production template, using automatic public
HTTPS and the loopback application port 8746. Its syntax was validated offline;
the public configuration was **not started**. See the official
[Caddy reverse-proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
and [TLS](https://caddyserver.com/docs/caddyfile/directives/tls) references.

The tested layout is **one Caddy edge proxy → private/loopback app port**.
The initial Cloudflare DNS record must be DNS-only for this layout. Turning on
Cloudflare proxying or adding another load balancer needs a new trusted-proxy/IP
review; do not blindly trust all forwarding headers. Never publish the app's
8745/8746 backend port on a public interface. The server trusts only the immediate
proxy hop for the pinned release origin; localhost development ignores XFF.

After approval: review/apply the source activation patch, rebuild and rerun the
checks, retain the previous image ID/configuration, and deploy to the chosen host.
The smoke script derives the expected signing state from the source-pinned gate;
a configuration environment variable cannot activate it. Verify the actual
served artifact before holder acceptance. If identity, fee, quote, recovery or
origin behavior differs from the qualified version, stop signing and restore the
previous read-only image/configuration. Keep client journal records; never clear
unknown transaction outcomes to make a release appear healthy.

## Domain shortlist checked in Cloudflare

Actual signed-in Registrar search on October 28 showed:

| Domain | Available | Displayed first year | Displayed renewal | Recommendation |
|---|---|---:|---:|---|
| getblunts.com | Yes | $10.46 | $10.46/year | Best match for the existing brand |
| rollmybag.com | Yes | $10.46 | $10.46/year | Stronger joke; short and memorable |
| puffpuffprofit.com | Yes | $10.46 | $10.46/year | Playful, but less suitable than the first two |
| puffolio.com | No | — | — | Nice pun, unavailable |

Cloudflare's Registrations notice separately announces that standard .com
registration, renewal and transfer pricing increases to **$11.17 on November 1,
2026**. Budget at least that amount for subsequent renewal; the search UI still
showed the old renewal figure. Final checkout/tax/availability can change. No
checkout, purchase, contact edit or auto-renew setting was submitted. The owner
plans to buy later; use the existing subdomain in the meantime.
