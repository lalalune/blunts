# Blunts: full-project research and implementation dossier

**October 2, 2026 · US-first assumption · prototype baseline `9e91c76`**

The project is a working visual simulation with substantial research, not a funded investing service. It is worth a bounded validation phase; there is not yet evidence to justify a broad financial-app build or profitable-growth forecast. The highest-risk decisions are lawful company revenue, approved securities/funding structure, repeat customer demand, financial clarity, and native publisher/brand acceptance.

## Read in this order

1. [Market, TAM/SAM/SOM, economics and capital decision](market-and-economics.md)
2. [Cash App versus EVM/Solana and legal closure register](rails-and-legal.md)
3. [Observed UI/UX and technical review, with screenshots](ux-and-technical-review.md)
4. [Web, iOS and Android publishing requirements](publishing.md)
5. [Detailed implementation plan, architecture, effort and gates](implementation-plan.md)
6. [All 120 audit requirements mapped to work packages](requirements-traceability.md)
7. [Primary-source index and research limitations](sources.md)

## Decisions supported by the research

- **Market:** approximately 78.5m US residents aged 18–34; about 58.1m is an illustrative nonretirement-noninvestor proxy. Actual eligible, interested and reachable customers are much fewer. The 0.87m–8.50m Cash App SAM range is an explicit assumption exercise, not a measured customer count.
- **Economics:** at hypothetical Strong behavior, approved full fee retention and optional subscription conversion, about **68,067 maintained funded users / $5.11m annual company revenue** support $1m operating profit after $1.5m fixed costs. Habitual behavior requires about **1.62m users**. Casual behavior loses money per user. Without subscriptions the Strong $1m-profit target rises to **74,254 users / $5.35m revenue**. No right to those transaction revenues is yet established.
- **Cash App:** standard merchant checkout is not the proposed financial-service route. Manual consumer USDC transfers are a conditional option. This is different from having a partner API integration, guaranteed deep link or automatic debit.
- **Networks:** the published Cash App/Dinari intersection suggests investigating Arbitrum/Ethereum, subject to US-program approval. Solana wallet connectivity exists, but no approved end-to-end US Blunts securities route was demonstrated. xStocks' US restrictions make it unsuitable as the assumed substitute.
- **Legal:** 26 topics have defined closure evidence. Current rules and provider requirements were researched; **Blunts itself is not legally cleared**. Signed agreements and a facts-specific legal review remain necessary.
- **Product:** the visual concept renders; actual banking, settlement, trading, account recovery, tax records, support and backend money truth do not exist. Current fee/speed/connection presentation cannot ship as live finance.
- **Execution:** one instrument, one approved rail, explicit orders and a complete durable money cycle first. Validate native SDKs and publisher early; release controlled funded web before app stores. The plan has 14 work packages, all original 120 requirements, 26 legal gates and 10 additional research requirements.

## Model and evidence

Run from the repository root:

```sh
python3 research/2026-10-02/business_model.py
python3 -m unittest discover -s tests
node --test tests/prototype.test.cjs
```

[Generated tables](model-output.md) and [machine-readable assumptions/results](model-results.json) include fee-retention sensitivities, contribution, replacement acquisition, break-even/profit targets and five-year cohort/cash scenarios. The source CSV has a [provenance/checksum manifest](sources/manifest.json). The model uses ordinary floating-point arithmetic for business scenarios; production financial accounting must use fixed-decimal money types. The model is not a ledger or investment-return forecast.

Browser evidence covers one simulated fill/withdrawal, bank selection, history and tutorial at selected browser sizes. It does not establish actual phone, provider, legal, security or production acceptance. No money moved, partner was contacted, account enrolled, or app submitted in this research.

## Immediate next actions

1. Appoint founder/product, securities/payments counsel and partner owners; resolve fee entitlement, ownership, US coverage, funding and publisher in writing.
2. Spend a bounded $65k–$175k discovery/diligence allowance only after allocating actual quotes and responsibilities; test customers and signed native SDK shells. These are planning allowances, not spend authorization or vendor quotes.
3. Approve or reject the business using measured economics, then implement the sandbox vertical slice and evidence gates in the plan.

Earlier `research/01–22` files are historical working material. Where their fees, legal conclusions, network assumptions, launch dates or financial forecasts conflict with this dossier, treat the older claim as unverified and use the explicit decision gates here. The original prototype is preserved for creative reference; research completion does not mean its production deficiencies have been repaired.
