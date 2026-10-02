"""Blunts conditional business model. All commercial inputs are assumptions, not quotes.
Run from any directory: python3 research/2026-10-02/business_model.py
Subscription revenue is deliberately unsupported. Volume is fee-bearing conversion activity,
not all wallet receipts or transfers. No customer-money balances are treated as company revenue. No market return forecast.
"""

from dataclasses import dataclass, asdict, replace
from pathlib import Path
import csv
import json
import math

ROOT = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Case:
    name: str
    annual_load_volume: float
    annual_unload_volume: float
    loads: int
    unloads: int
    annual_churn: float
    funded_cac: float
    # A legally approved right to receive these revenues is REQUIRED, not assumed proven.
    retained_fee_fraction: float = 1.0
    load_fee_rate: float = 0.01
    unload_fee_rate: float = 0.01
    onramp_volume_share: float = 0.0
    absorbed_onramp_fee_rate: float = 0.0
    bank_share: float = 0.0
    bank_in_cost: float = 0.75
    bank_out_cost: float = 1.0
    chain_payout_cost: float = 0.05
    broker_network_per_order: float = 0.20
    quote_cost: float = 0.0075
    quotes_per_order: int = 3
    support_year: float = 6.0
    wallet_year: float = 2.40
    screening_year: float = 1.20
    infra_year: float = 1.20
    loss_rate_on_gross_flow: float = 0.001
    onboarding_per_funded: float = 4.0  # includes unsuccessful KYC allocation


CASES = (
    Case("Casual", 600, 360, 12, 4, 0.35, 40),
    Case("Habitual", 2400, 1320, 24, 8, 0.25, 30),
    Case("Strong", 4800, 2400, 24, 8, 0.20, 25),
)


def unit(c):
    if not 0 < c.annual_churn < 1:
        raise ValueError("annual_churn must be strictly between zero and one")
    if c.loads <= 0 or c.unloads <= 0:
        raise ValueError("scenario requires positive buy and sell counts")
    for name in (
        "retained_fee_fraction",
        "bank_share",
        "onramp_volume_share",
        "absorbed_onramp_fee_rate",
    ):
        if not 0 <= getattr(c, name) <= 1:
            raise ValueError(f"{name} must be a fraction between zero and one")
    for name, value in asdict(c).items():
        if name != "name" and (not math.isfinite(value) or value < 0):
            raise ValueError(f"{name} must be finite and non-negative")
    fee_pool = (
        c.annual_load_volume * c.load_fee_rate
        + c.annual_unload_volume * c.unload_fee_rate
    )
    orders = c.loads + c.unloads
    costs = {
        "absorbed_onramp": c.annual_load_volume
        * c.onramp_volume_share
        * c.absorbed_onramp_fee_rate,
        "bank_and_payouts": c.bank_share
        * (c.loads * c.bank_in_cost + c.unloads * c.bank_out_cost)
        + (1 - c.bank_share) * c.unloads * c.chain_payout_cost,
        "broker_network": orders * c.broker_network_per_order,
        "quotes": orders * c.quotes_per_order * c.quote_cost,
        "support": c.support_year,
        "wallet": c.wallet_year,
        "screening": c.screening_year,
        "infra": c.infra_year,
        "loss_reserve": (c.annual_load_volume + c.annual_unload_volume)
        * c.loss_rate_on_gross_flow,
    }
    revenue = fee_pool * c.retained_fee_fraction
    service = sum(costs.values())
    contribution = revenue - service
    turnover = 12 * (1 - (1 - c.annual_churn) ** (1 / 12))
    replacement = turnover * (c.funded_cac + c.onboarding_per_funded)
    return dict(
        customer_fee_pool=fee_pool,
        revenue=revenue,
        service_cost=service,
        costs=costs,
        contribution=contribution,
        replacement=replacement,
        steady_margin=contribution - replacement,
        simple_ltv_before_cac=contribution / turnover - c.onboarding_per_funded,
        simple_payback_months=(c.funded_cac + c.onboarding_per_funded)
        / contribution
        * 12
        if contribution > 0
        else None,
        cac_ceiling_3x=max(0, contribution / turnover / 3 - c.onboarding_per_funded),
    )


def target(c, fixed, profit):
    u = unit(c)
    if u["steady_margin"] <= 0:
        return None
    n = math.ceil((fixed + profit) / u["steady_margin"])
    return dict(
        users=n,
        revenue=n * u["revenue"],
        fee_bearing_volume=n * (c.annual_load_volume + c.annual_unload_volume),
        profit=n * u["steady_margin"] - fixed,
    )


def ramp(c, annual_new, fixed_by_year, upfront=150000):
    """Monthly model: churn existing users, add acquisitions uniformly each month.
    Half-month average for revenue/service. Acquisition & onboarding paid immediately.
    No amortized KYC or replacement spend added: actual new cohorts capture both.
    Upfront is incremental legal/security/setup, NOT salaries already in annual fixed.
    """
    if len(annual_new) != len(fixed_by_year):
        raise ValueError("each acquisition year needs a fixed-cost assumption")
    if (
        not math.isfinite(upfront)
        or upfront < 0
        or any(v < 0 or not math.isfinite(v) for v in [*annual_new, *fixed_by_year])
    ):
        raise ValueError("cash assumptions must be non-negative and finite")
    u = unit(c)
    monthly_churn = 1 - (1 - c.annual_churn) ** (1 / 12)
    active = 0.0
    cumulative = -upfront
    peak = upfront
    rows = []
    for year, (new, fixed) in enumerate(zip(annual_new, fixed_by_year), 1):
        rev = cost = marketing = avg_sum = 0.0
        for _ in range(12):
            added = new / 12
            end = active * (1 - monthly_churn) + added
            avg = (active + end) / 2
            mr = avg * u["revenue"] / 12
            mc = avg * u["service_cost"] / 12
            ma = added * (c.funded_cac + c.onboarding_per_funded)
            cumulative += mr - mc - ma - fixed / 12
            peak = max(peak, -cumulative)
            rev += mr
            cost += mc
            marketing += ma
            avg_sum += avg
            active = end
        rows.append(
            dict(
                year=year,
                active_eoy=active,
                avg_active=avg_sum / 12,
                new_funded=new,
                revenue=rev,
                service_cost=cost,
                acquisition_and_kyc=marketing,
                fixed=fixed,
                operating_profit=rev - cost - marketing - fixed,
                cumulative_cash=cumulative,
            )
        )
    return dict(
        rows=rows, peak_cash_deficit=peak, funding_with_25pct_headroom=peak * 1.25
    )


def population():
    with (ROOT / "sources/census-nc-est2025-alldata-r-file12.csv").open() as f:
        rows = list(csv.DictReader(f))

    def total(hi):
        return sum(
            int(r["TOT_POP"])
            for r in rows
            if r["UNIVERSE"] == "R"
            and r["YEAR"] == "2025"
            and r["MONTH"] == "7"
            and 18 <= int(r["AGE"]) <= hi
        )

    return dict(
        ages18_34=total(34), ages18_44=total(44), noninvestor_proxy=total(34) * 0.74
    )


def sam():
    """Conditional factors are assumptions, NOT measured independent probabilities.
    Fractions after the first are conditional on the remaining population.
    Cash App users and external-wallet users overlap: do not sum these SAMs.
    """
    cash = {
        "low": (0.35, 0.85, 0.55, 0.20, 0.45),
        "planning": (0.45, 0.92, 0.65, 0.30, 0.65),
        "high": (0.55, 0.97, 0.75, 0.45, 0.80),
    }
    # 59m accounts, young-adult share, eligibility/dedup proxy, need, ability/willingness, rail readiness.
    # External-wallet population deliberately uses an assumed eligible PERSON count, not chain addresses.
    wallet = {
        "low": (500000, 0.20),
        "planning": (2000000, 0.30),
        "high": (5000000, 0.40),
    }
    return dict(
        cashapp={k: 59e6 * math.prod(v) for k, v in cash.items()},
        external_wallet={k: math.prod(v) for k, v in wallet.items()},
        cashapp_factors=cash,
        wallet_factors=wallet,
    )


def money(n):
    return f"${n:,.2f}" if abs(n) < 1000 else f"${n:,.0f}"


def main():
    units = {c.name: unit(c) for c in CASES}
    goals = {
        "Lean owner business": (600000, 250000),
        "Durable company": (1500000, 1000000),
        "Scale company": (5000000, 10000000),
    }
    targets = {
        c.name: {name: target(c, *amounts) for name, amounts in goals.items()}
        for c in CASES
    }
    plans = {
        "Casual": (
            [1000, 3000, 6000, 10000, 15000],
            [600000, 750000, 900000, 1100000, 1300000],
        ),
        "Habitual": (
            [2000, 8000, 20000, 40000, 70000],
            [900000, 1200000, 1500000, 2000000, 2500000],
        ),
        "Strong": (
            [5000, 20000, 50000, 100000, 150000],
            [1200000, 1800000, 2500000, 3500000, 5000000],
        ),
    }
    ramps = {c.name: ramp(c, *plans[c.name]) for c in CASES}
    data = dict(
        assumption_notice="Conditional scenarios, not forecasts. No Blunts fee contract verified.",
        inputs=[asdict(c) for c in CASES],
        population=population(),
        sam=sam(),
        units=units,
        targets=targets,
        ramps=ramps,
    )
    (ROOT / "model-results.json").write_text(json.dumps(data, indent=2) + "\n")
    out = [
        "# Reproducible business model outputs",
        "",
        "Uncapped percentage fees; no subscriptions or holding fees. Wallet settlement; bank mix is a sensitivity. All commercial inputs are planning assumptions. 100% load/unload fee capture is a conditional upper case, not approved Blunts revenue. Profit is pre-tax, includes modeled salaries, excludes financing costs, equity dilution and extraordinary losses.",
        "",
        "## Population and conditional SAM",
        "",
        f"US ages 18–34: {population()['ages18_34']:,}; ages 18–44: {population()['ages18_44']:,}; illustrative noninvestor proxy: {population()['noninvestor_proxy']:,.0f}.",
        "Cash App conditional SAM low / planning / high: "
        + " / ".join(f"{v:,.0f}" for v in sam()["cashapp"].values())
        + ".",
        "External-wallet conditional SAM low / planning / high: "
        + " / ".join(f"{v:,.0f}" for v in sam()["external_wallet"].values())
        + ". Do not add overlapping audiences. See market-and-economics.md for factor definitions.",
        "",
        "## Annual unit economics at conditional 100% fee capture",
        "",
        "| Case | Fills | Cash-outs | Revenue | Service costs | Contribution | Replacement CAC + KYC | Steady margin |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for c in CASES:
        u = units[c.name]
        out.append(
            "| "
            + c.name
            + " | "
            + " | ".join(
                money(x)
                for x in [
                    c.annual_load_volume,
                    c.annual_unload_volume,
                    u["revenue"],
                    u["service_cost"],
                    u["contribution"],
                    u["replacement"],
                    u["steady_margin"],
                ]
            )
            + " |"
        )
    out += [
        "",
        "## Profit targets: average maintained active funded users",
        "",
        "| Case | Goal | Users | Annual company revenue | Annual fee-bearing volume |",
        "|---|---|---:|---:|---:|",
    ]
    for c in CASES:
        for name, r in targets[c.name].items():
            out.append(
                f"| {c.name} | {name} | "
                + (
                    f"{r['users']:,} | {money(r['revenue'])} | {money(r['fee_bearing_volume'])}"
                    if r
                    else "No break-even | — | —"
                )
                + " |"
            )
    out += [
        "",
        "## Revenue-right sensitivity: steady margin/user",
        "",
        "| Case | 0% of fee | 50% of fee | 100% of fee |",
        "|---|---:|---:|---:|",
    ]
    for c in CASES:
        out.append(
            "| "
            + c.name
            + " | "
            + " | ".join(
                money(unit(replace(c, retained_fee_fraction=r))["steady_margin"])
                for r in [0, 0.5, 1]
            )
            + " |"
        )
    out += [
        "",
        "## Simple LTV / acquisition thresholds",
        "",
        "| Case | LTV before CAC | Maximum CAC for 3x total acquisition + onboarding | Simple payback months |",
        "|---|---:|---:|---:|",
    ]
    for c in CASES:
        u = units[c.name]
        p = u["simple_payback_months"]
        out.append(
            f"| {c.name} | {money(u['simple_ltv_before_cac'])} | {money(u['cac_ceiling_3x'])} | {p:.1f} |"
            if p
            else f"| {c.name} | {money(u['simple_ltv_before_cac'])} | $0 | Never |"
        )
    for c in CASES:
        out += [
            "",
            f"## Five-year {c.name} acquisition scenario",
            "",
            "| Year | New funded | Active EOY | Average active | Revenue | Acquisition + KYC | Fixed | Operating profit | Cumulative cash |",
            "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
        ]
        r = ramps[c.name]
        for row in r["rows"]:
            out.append(
                f"| {row['year']} | {row['new_funded']:,} | {row['active_eoy']:,.0f} | {row['avg_active']:,.0f} | "
                + " | ".join(
                    money(row[k])
                    for k in [
                        "revenue",
                        "acquisition_and_kyc",
                        "fixed",
                        "operating_profit",
                        "cumulative_cash",
                    ]
                )
                + " |"
            )
        out += [
            "",
            f"Peak cash deficit {money(r['peak_cash_deficit'])}; with 25% headroom {money(r['funding_with_25pct_headroom'])}. Additional regulatory capital/provider reserves are excluded and require quotes.",
        ]
    out += [
        "",
        "## Cost sensitivity: Habitual case steady margin",
        "",
        "| Change | Margin / user / year |",
        "|---|---:|",
    ]
    base = CASES[1]
    variants = {
        "Base": base,
        "CAC $10": replace(base, funded_cac=10),
        "CAC $60": replace(base, funded_cac=60),
        "Churn 40%": replace(base, annual_churn=0.4),
        "Support $12/year": replace(base, support_year=12),
        "Absorb assumed 3% ramp fee on 25% of loads": replace(
            base, onramp_volume_share=0.25, absorbed_onramp_fee_rate=0.03
        ),
        "25% bank funding": replace(base, bank_share=0.25),
        "All bank funding": replace(base, bank_share=1),
        "Network $0.05/order": replace(base, broker_network_per_order=0.05),
        "Loss reserve 50 bps": replace(base, loss_rate_on_gross_flow=0.005),
    }
    for name, c in variants.items():
        out.append(f"| {name} | {money(unit(c)['steady_margin'])} |")
    out += [
        "",
        "## Pricing alternatives: steady margin per active user",
        "",
        "Costs unchanged to isolate pricing; behavior and fee willingness remain unproven.",
        "",
        "| Load fee / unload fee | Casual | Habitual | Strong |",
        "|---|---:|---:|---:|",
    ]
    pricing = [
        (0, 0.01),
        (0.005, 0.005),
        (0.0085, 0.0085),
        (0.01, 0.01),
        (0.015, 0.015),
    ]
    for load_rate, unload_rate in pricing:
        out.append(
            f"| {load_rate:.2%} / {unload_rate:.2%} | "
            + " | ".join(
                money(
                    unit(
                        replace(c, load_fee_rate=load_rate, unload_fee_rate=unload_rate)
                    )["steady_margin"]
                )
                for c in CASES
            )
            + " |"
        )
    (ROOT / "model-output.md").write_text("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
