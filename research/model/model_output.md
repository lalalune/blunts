## Per funded user per year

| Line | Low | Base | High | Base, Dinari $0.20 flat |
|---|---|---|---|---|
| Fills ($ in) | $360.00 | $600.00 | $1k | $600.00 |
| Sparks ($ out) | $252.00 | $360.00 | $600.00 | $360.00 |
| 1% on fills | $3.60 | $6.00 | $12.00 | $6.00 |
| 1% on sparks | $2.52 | $3.60 | $6.00 | $3.60 |
| Instant-to-bank fee | $0.40 | $0.58 | $0.96 | $0.58 |
| Blunts+ (net of store cut) | $0.63 | $1.57 | $3.15 | $1.57 |
| **Revenue** | $7.15 | $11.75 | $22.11 | $11.75 |
| Dinari order fees | $0.26 | $0.32 | $0.58 | $3.20 |
| Rails (zerohash, gas) | $3.65 | $4.32 | $7.43 | $4.32 |
| Privy, screening, support, cloud | $4.20 | $4.20 | $4.20 | $4.20 |
| KYC (amortized) | $0.88 | $0.88 | $0.88 | $0.88 |
| **Variable cost** | $8.98 | $9.72 | $13.09 | $12.60 |
| **Contribution** | $-1.83 | $2.03 | $9.02 | $-0.85 |
| Paid to Apple/Google (Blunts+) | $0.09 | $0.22 | $0.43 | $0.22 |

## TAM / SAM / SOM (base behavior, 1% per move)

| Layer | People | Money moved / yr | 1% fee pool / yr | All revenue lines / yr |
|---|---|---|---|---|
| TAM: US adults 18–44 | 123.8M | $118.85B | $1.19B | $1.45B |
| TAM (core): US adults 18–34 | 78.5M | $75.36B | $753.6M | $922.3M |
| SAM (wide): 18–34 with no taxable investments | 58.1M | $55.77B | $557.7M | $682.5M |
| SAM (core): 18–34 Cash App users with no taxable investments | 22.0M | $21.12B | $211.2M | $258.5M |

## SOM: 5-year ramp (funded users, end of year)


### Low case: CAC $40 per funded user, 35% churn

| Year | Funded users (EOY) | Share of core SAM | Money moved | 1% fee revenue | Total revenue | Contribution | Marketing (CAC) | Fixed | **Operating profit** |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 5k | 0.0% | $1.5M | $15k | $18k | $-5k | $200k | $1.0M | **$-1.2M** |
| 2 | 20k | 0.1% | $7.7M | $76k | $89k | $-23k | $670k | $1.5M | **$-2.2M** |
| 3 | 45k | 0.2% | $19.9M | $199k | $232k | $-60k | $1.3M | $2.0M | **$-3.3M** |
| 4 | 75k | 0.3% | $36.7M | $367k | $429k | $-110k | $1.8M | $2.5M | **$-4.4M** |
| 5 | 110k | 0.5% | $56.6M | $566k | $662k | $-169k | $2.5M | $3.0M | **$-5.6M** |

Cumulative 5-year operating result: **$-16.8M**.

### Base case: CAC $25 per funded user, 35% churn

| Year | Funded users (EOY) | Share of core SAM | Money moved | 1% fee revenue | Total revenue | Contribution | Marketing (CAC) | Fixed | **Operating profit** |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 20k | 0.1% | $9.6M | $96k | $117k | $20k | $500k | $1.2M | **$-1.7M** |
| 2 | 80k | 0.4% | $48.0M | $480k | $587k | $102k | $1.7M | $2.0M | **$-3.6M** |
| 3 | 180k | 0.8% | $124.8M | $1.2M | $1.5M | $264k | $3.2M | $3.0M | **$-5.9M** |
| 4 | 300k | 1.4% | $230.4M | $2.3M | $2.8M | $487k | $4.6M | $4.0M | **$-8.1M** |
| 5 | 440k | 2.0% | $355.2M | $3.6M | $4.3M | $751k | $6.1M | $5.0M | **$-10.4M** |

Cumulative 5-year operating result: **$-29.7M**.

### High case: CAC $15 per funded user, 35% churn

| Year | Funded users (EOY) | Share of core SAM | Money moved | 1% fee revenue | Total revenue | Contribution | Marketing (CAC) | Fixed | **Operating profit** |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 50k | 0.2% | $45.0M | $450k | $553k | $226k | $750k | $1.5M | **$-2.0M** |
| 2 | 200k | 0.9% | $225.0M | $2.2M | $2.8M | $1.1M | $2.5M | $3.0M | **$-4.4M** |
| 3 | 500k | 2.3% | $630.0M | $6.3M | $7.7M | $3.2M | $5.5M | $5.0M | **$-7.4M** |
| 4 | 900k | 4.1% | $1.26B | $12.6M | $15.5M | $6.3M | $8.6M | $7.0M | **$-9.3M** |
| 5 | 1,500k | 6.8% | $2.16B | $21.6M | $26.5M | $10.8M | $13.7M | $9.0M | **$-11.9M** |

Cumulative 5-year operating result: **$-35.0M**.

## Break-even funded users (contribution covers fixed; excludes CAC)

| Fixed cost / yr | Low | Base | High |
|---|---|---|---|
| $300k | never | 148k | 33k |
| $1.0M | never | 493k | 111k |
| $2.5M | never | 1,231k | 277k |
| $5.0M | never | 2,463k | 554k |

## Fee design sensitivity (base user)

| Design | Revenue / user / yr | Contribution / user / yr |
|---|---|---|
| 1% on fills + sparks (asked) | $11.75 | $2.03 |
| 1% on sparks only | $5.75 | $-3.97 |
| 0.5% on fills + 1% on sparks | $8.75 | $-0.97 |
| 1% fills + 1% sparks + no Blunts+ | $10.18 | $0.46 |

## Lifetime value (base)

Expected life 2.9 years at 35% churn. LTV (contribution) = **$5.80**; at 15% churn = **$13.53**. Max CAC for LTV/CAC = 3: $1.93.

## Sensitivity: contribution per user per year vs. fills per year

Spark share 60%, one fill a month up to $600/yr then fills of $100; rail mix 60/30/10.

| Fills / yr | Revenue | Contribution (bank $0.75 fill / $1.00 spark) | Contribution (bank $0.30 / $0.50) | Users to cover $5M fixed (cheap bank) |
|---|---|---|---|---|
| $300 | $6.69 | $-1.56 | $0.05 | 92,251k |
| $600 | $11.75 | $2.03 | $4.45 | 1,124k |
| $1,200 | $21.93 | $11.78 | $14.40 | 347k |
| $2,400 | $42.28 | $27.06 | $32.30 | 155k |
| $4,800 | $82.98 | $58.05 | $68.33 | 73k |

## 'Main money app' scenario

Fills $2,400/yr (paycheck auto-fill, $100 twice a month), sparks 55%, Blunts+ 8%, bank rail negotiated to $0.30/$0.50, support $1/user, churn 25%.

Revenue **$41.83**, variable cost $8.27, contribution **$33.56** per user per year; LTV at 25% churn **$134.22**.

| Funded users | Revenue / yr | Contribution / yr | Less $5M fixed |
|---|---|---|---|
| 100k | $4.2M | $3.4M | $-1.6M |
| 300k | $12.5M | $10.1M | $5.1M |
| 500k | $20.9M | $16.8M | $11.8M |
| 1,000k | $41.8M | $33.6M | $28.6M |
| 2,000k | $83.7M | $67.1M | $62.1M |
