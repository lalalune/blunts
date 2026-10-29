# Active direction supersedes the provider-first plan

The owner changed the active app to normal EVM wallet + Robinhood Chain. The
provider work below remains preserved history, with real sandbox reads verified
but no customer/order/funding/payout acceptance. Do not resume account creation
or invent a combined provider financial cycle unless the owner returns to that
architecture. Read [current local acceptance](local-wallet-acceptance.md).

---

# Provider sandbox acceptance — updated October 28, 2026

## Current receipt

Both developer dashboards are authenticated. The owner approved saving sandbox
credentials locally in `data/provider-sandbox/credentials.json` (0600, ignored
by Git). A Dinari key accidentally exposed by its one-time dialog was replaced;
the portal confirmed successful revocation of the exposed key. Only its
replacement remains usable. MoonPay's existing fishtech test keys were copied
and verified through its normal visible key controls, then hidden again.

Genuine read-only qualification now passes for both providers. Dinari's partner
identity read succeeds and QQQ is tradable/fractional on Ethereum Sepolia;
partner KYC is incomplete. MoonPay's USD 100 indicative quote succeeds, with
no assertion that its secret/public pair, webhook or transaction flow has been
accepted. No customer financial account, order, payment, signing, public tunnel,
provider callback registration or live key was created. See
[the workbench](provider-sandbox-workbench.md) for configuration and limits.

The October 27 access/setup notes below are historical. They do not override
this current receipt. The earlier Arbitrum Sepolia assumption was corrected
against actual sandbox metadata and the provider's
[order examples](https://docs.dinari.com/docs/placing-orders). Two test assets
sharing Sepolia still does not establish compatible funding or settlement.

Dinari and MoonPay remain the engineering candidates already named in Shaw's
repository. They are not enabled Blunts integrations. Keep Cloud/Steward for
identity and wallets. Do not reinterpret Cloud service credits as investment
funding or introduce another network to manufacture a passing financial cycle.

## A newly verified sandbox mismatch

[MoonPay's public sandbox guide](https://dev.moonpay.com/widget/sandbox-testing)
describes ERC-20 sandbox delivery as MoonPayToken on Sepolia, with a reduced
test delivery amount. It does not establish native-USDC delivery on Arbitrum.
Its currently documented widget host selects test mode through a test API key.
An old `buy-sandbox` host assumption alone is not sufficient environment proof.

The pinned Dinari SDK 0.15.0 exposes `accounts.mintSandboxTokens` and describes
its payment asset as mockUSD. `qualifyDinariSandbox` checks for a QQQ mapping on
Arbitrum Sepolia, but this does not make MoonPay's sandbox token compatible.

Therefore a successful MoonPay checkout and a successful Dinari sandbox order
would be two separate pieces of evidence. They must not be reported as one
end-to-end native-USDC/Arbitrum funding route. No provider has confirmed an
alternative private sandbox arrangement for this project.

## Evidence required before connecting the two legs

| Boundary | Required authoritative result | Current evidence |
|---|---|---|
| Partner access | Enabled Dinari sandbox organization, permitted instrument and customer program | SDK transport tests only; no project credentials supplied |
| Customer | Provider-enrolled customer/account and accepted disclosures, bound to the correct Cloud identity and wallet | Cloud/Steward identity works; no brokerage customer mapping |
| Funding | Partner-enabled asset, token address, chain, limits and settlement behavior | Public widget docs; exact target route unverified |
| Orders | Provider quote/confirmation, stable order identifier and authoritative fills | Not implemented against an enabled account |
| Payout | Provider-confirmed withdrawal destination, delivered amount and final state | Demo payout only |
| Reconciliation | Ledger agrees with the provider and chain after duplicates, returns and interrupted submissions | Local simulator checks only |

The existing `providers:check` command makes read-only Dinari sandbox calls
when configured. Its `sandbox_reads_verified` result intentionally does not
approve a customer, enable trading, establish the funding route or permit live
money. Without keys it makes no requests and exits 2.

The later local [provider workbench](provider-sandbox-workbench.md) adds a
read-only MoonPay quote qualifier, signed test URLs, transaction lookup,
raw-body V2 callback authentication, durable command/event records and
first-party authenticated sandbox API routes. Dinari can now prepare unsigned
external-wallet permits and track request/order states. These paths passed local
contract/recovery checks; no enabled external project or actual provider cycle
was exercised. They never credit the simulated app ledger. The original
read-only qualifier is no longer the only code that can consume provider keys.

## Implementation constraints from current provider docs

[MoonPay's URL signing contract](https://dev.moonpay.com/widget/on-ramp/customization/url-signing)
uses a server-side HMAC over the serialized query. Construct the query on the
server from the authenticated owner's confirmed wallet; do not sign arbitrary
client-supplied URLs or destinations. A signature protects parameters, not
settlement. Never credit funds from a widget-close event or callback URL alone.

[MoonPay's parameter reference](https://dev.moonpay.com/widget/on-ramp/customization/parameters)
distinguishes a fixed `currencyCode` from a changeable default selection. Use
the partner-enabled fixed currency/network and verify its asset identity. The
documented fiat amount parameter is an integer; establish supported precision
instead of silently rounding a customer's selected amount.

[Dinari's US requirements](https://docs.dinari.com/docs/us) require its partner
program, API v2, account onboarding, approved UI and customer confirmations.
Using a wallet signer is not evidence that those requirements are satisfied.

## Next external setup step

The owner must establish the relevant partner accounts at
[Dinari Partners](https://partners.dinari.com/) and
[MoonPay Dashboard](https://dashboard.moonpay.com/), or provide an already enabled
equivalent service. The owner has now authorized developer signup setup in the
requested browser profile. Both forms were submitted with the owner's supplied
signup name after approval of MoonPay's displayed Terms of Use. Both now await
email verification; no dashboard, API keys or completed partner enrollment have
been observed yet. The Gmail connector masks the authentication codes, so the
owner must enter them directly into the retained signup tabs. Complete
non-binding developer setup within that authorization;
financial account opening and binding agreements retain their separate action
boundaries. Provider eligibility and commercial terms
must be reviewed by their owner. Store issued credentials in the selected secret
manager, never in chat or Git. No keys, trades, checkout sessions, paid plans or
live financial accounts were created. Later local URL/callback rehearsals did
not create an external provider checkout session. Email verification and the remaining
provider onboarding steps are not established by submission of the signup form.

The developer login screens were rechecked for an accessible alternative:
Dinari offers email continuation and MoonPay's Business dashboard offers email
verification. Neither inspected screen exposed a social sign-in choice.
MoonPay's consumer Google/Apple sign-in does not establish Business dashboard
access. A later MoonPay sign-in request returned "We could not verify that
request"; Dinari accepted a fresh code request. Neither outcome verifies an
account. Browser navigation to Gmail was completed for the owner; withheld
authentication codes were not recovered through another surface. macOS Voice
Control settings were prepared as a hands-free entry option. The owner then
requested unattended testing instead; Voice Control and its microphone remain
off. It has not been claimed as completed provider verification.

An owner-free first-party browser acceptance path is available through
`npm run test:local-services`, using actual local Steward with its test-only
mock inbox and synthetic accounts. It does not read the owner's mailbox, invoke
Dinari/MoonPay, establish provider enrollment, or execute real transactions.
Current official sandbox guides still require a partner test key; placeholder
example keys are not treated as working account credentials.

After that access exists, qualify the sandbox and implement each actual account,
quote, funding, order, settlement and withdrawal transition using the provider's
enabled contract. The standalone simulator cannot safely be converted into a
remote provider by replacing its database observation with an HTTP call.

## Cost verification and prepared signup state

On October 27, the actual Dinari developer signup asks for first name, last name
and email. MoonPay's business developer signup also asks for a business name and
states that creating the account accepts its linked terms. The owner approved
that submission. No payment details or paid plan were selected; both forms
reached the email-code step. No provider secret or one-time code was saved in
the repository.

[Dinari's current partner fees](https://docs.dinari.com/docs/fees) explicitly
include free sandbox access. Its production API access starts at $2,000/month,
with other provider costs separate. Do not activate a production plan under a
free-sandbox instruction.

[MoonPay's current dashboard pricing](https://support.moonpay.com/en/articles/694907-partner-pricing-fees-and-the-removed-paywall)
states that dashboard access and onboarding have no subscription paywall.
[Its partner onboarding guide](https://support.moonpay.com/en/articles/694185-partner-onboarding-overview-from-signup-to-going-live)
states that accounts include test API keys before live approval. This is not
free live transaction processing or permission to accept its business terms
without the owner's required action-time approval.
