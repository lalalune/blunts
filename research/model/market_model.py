"""Blunts TAM / SAM / SOM and revenue model.

Every input is a named assumption with a source tag pointing at research/20 (market)
or research/21 (fees and costs). Run: python3 market_model.py
"""

# ---------- Market inputs (research/20) ----------
ADULTS_18_34 = 78.5e6  # Census Jul-2025, summed single-year ages
ADULTS_18_44 = 123.8e6
BLACK_HISP_18_34 = 30.0e6
NON_INVESTOR_SHARE_U35 = 0.74  # FINRA 2024: 26% of under-35s hold taxable investments
CASHAPP_MTA = 59e6  # Block Q2 2026 monthly transacting actives
CASHAPP_18_34_EST = 30e6  # [EST] Block publishes no age split; biggest uncertainty
CASHAPP_18_34_NONINVESTOR = 22e6  # [EST] research/20 sizing chain

# ---------- Behavior per funded user per year (research/08, 20) ----------
BEHAVIOR = {
    #          fills $/yr, spark share of fills, fills/yr, sparks/yr
    "low": dict(fills=360, spark_share=0.70, n_fills=9, n_sparks=4),
    "base": dict(fills=600, spark_share=0.60, n_fills=12, n_sparks=4),
    "high": dict(fills=1200, spark_share=0.50, n_fills=24, n_sparks=5),
}

FEE = 0.01  # 1% per move, on fills and on sparks
FEE_CAP = 10.0  # max $10 per move
FEE_MIN_FILL = 0.0  # no minimum fee; minimum fill $20 instead

# Rail mix of moves (research/17, 19): Cash App outside NY, bank everywhere, Apple Pay via Coinbase
RAIL_MIX = {"cashapp": 0.60, "bank": 0.30, "applepay": 0.10}

# ---------- Other fee lines ----------
INSTANT_BANK_FEE = 0.01  # instant spark to bank, 1%, min $0.50 (research/21)
INSTANT_BANK_MIN = 0.50
INSTANT_UPTAKE = 0.40  # [EST] share of bank sparks that choose instant
PLUS_PRICE_MO = 3.00  # Blunts+ digital-extras subscription
PLUS_CONVERSION = {"low": 0.02, "base": 0.05, "high": 0.10}  # [EST]
STORE_CUT = 0.15  # Apple Small Business / Google 10%+5%
PLUS_IAP_SHARE = 0.80  # [EST] share bought in-app (rest on web via Stripe ~3%)

# ---------- Variable costs (research/18, 21) ----------
DINARI_ORDER = {"flat": 0.20, "arrears": 0.02}  # per order; arrears = actual gas [EST]
RAIL_COST_FILL = {
    "cashapp": 0.0,
    "bank": 0.75,
    "applepay": 0.0,
}  # bank: zerohash ACH + Plaid + return reserve [UNVERIFIED]; Apple Pay: Coinbase fee shown to user, or $0 if subsidy
RAIL_COST_SPARK = {
    "cashapp": 0.01,
    "bank": 1.00,
    "applepay": 1.00,
}  # Apple Pay users spark to bank
PER_USER_YEAR = {
    "privy": 0.60,  # ~$0.05/MAU/mo at scale
    "screening": 0.60,  # 30-day sanctions/PEP rescreen, batch-priced [EST]
    "support": 2.00,  # [EST] chat-first
    "cloud_data": 1.00,  # hosting, market data, statements [EST]
}
KYC_ONE_TIME = 2.50  # per funded user incl. funnel loss
CHURN = 0.35  # annual [EST]; Acorns-like 15% is upside


def fee_on(amount_per_move):
    return min(amount_per_move * FEE, FEE_CAP)


def per_user(scn="base", dinari="arrears"):
    b = BEHAVIOR[scn]
    sparks = b["fills"] * b["spark_share"]
    fill_size = b["fills"] / b["n_fills"]
    spark_size = sparks / b["n_sparks"]

    fee_fills = b["n_fills"] * fee_on(fill_size)
    fee_sparks = b["n_sparks"] * fee_on(spark_size)

    bank_sparks = b["n_sparks"] * (RAIL_MIX["bank"] + RAIL_MIX["applepay"])
    instant = (
        bank_sparks
        * INSTANT_UPTAKE
        * max(spark_size * INSTANT_BANK_FEE, INSTANT_BANK_MIN)
    )

    conv = PLUS_CONVERSION[scn]
    plus_gross = conv * PLUS_PRICE_MO * 12
    plus_net = plus_gross * (
        1 - PLUS_IAP_SHARE * STORE_CUT - (1 - PLUS_IAP_SHARE) * 0.03
    )
    to_stores = plus_gross * PLUS_IAP_SHARE * STORE_CUT

    moves = b["n_fills"] + b["n_sparks"]
    c_orders = moves * DINARI_ORDER[dinari]
    c_rails = sum(
        RAIL_MIX[r]
        * (b["n_fills"] * RAIL_COST_FILL[r] + b["n_sparks"] * RAIL_COST_SPARK[r])
        for r in RAIL_MIX
    )
    c_fixed_pu = sum(PER_USER_YEAR.values())
    c_kyc = KYC_ONE_TIME * CHURN  # amortized over expected life (1/churn years)

    revenue = fee_fills + fee_sparks + instant + plus_net
    cost = c_orders + c_rails + c_fixed_pu + c_kyc
    return dict(
        fills=b["fills"],
        sparks=sparks,
        fill_size=fill_size,
        spark_size=spark_size,
        fee_fills=fee_fills,
        fee_sparks=fee_sparks,
        instant=instant,
        plus_net=plus_net,
        to_stores=to_stores,
        revenue=revenue,
        c_orders=c_orders,
        c_rails=c_rails,
        c_fixed_pu=c_fixed_pu,
        c_kyc=c_kyc,
        cost=cost,
        contribution=revenue - cost,
        fee_pct_of_balance=(fee_fills + fee_sparks) / 500 if scn == "base" else None,
    )


def money(x):
    if abs(x) >= 1e9:
        return f"${x / 1e9:,.2f}B"
    if abs(x) >= 1e6:
        return f"${x / 1e6:,.1f}M"
    if abs(x) >= 1e3:
        return f"${x / 1e3:,.0f}k"
    return f"${x:,.2f}"


def main():
    out = []
    p = {s: per_user(s) for s in BEHAVIOR}
    pf = per_user("base", "flat")

    out.append("## Per funded user per year\n")
    out.append("| Line | Low | Base | High | Base, Dinari $0.20 flat |")
    out.append("|---|---|---|---|---|")
    rows = [
        ("Fills ($ in)", "fills"),
        ("Sparks ($ out)", "sparks"),
        ("1% on fills", "fee_fills"),
        ("1% on sparks", "fee_sparks"),
        ("Instant-to-bank fee", "instant"),
        ("Blunts+ (net of store cut)", "plus_net"),
        ("**Revenue**", "revenue"),
        ("Dinari order fees", "c_orders"),
        ("Rails (zerohash, gas)", "c_rails"),
        ("Privy, screening, support, cloud", "c_fixed_pu"),
        ("KYC (amortized)", "c_kyc"),
        ("**Variable cost**", "cost"),
        ("**Contribution**", "contribution"),
        ("Paid to Apple/Google (Blunts+)", "to_stores"),
    ]
    for label, k in rows:
        out.append(
            f"| {label} | {money(p['low'][k])} | {money(p['base'][k])} | {money(p['high'][k])} | {money(pf[k])} |"
        )

    # TAM / SAM / SOM
    base = p["base"]
    fee_pool_pu = base["fee_fills"] + base["fee_sparks"]
    out.append("\n## TAM / SAM / SOM (base behavior, 1% per move)\n")
    out.append(
        "| Layer | People | Money moved / yr | 1% fee pool / yr | All revenue lines / yr |"
    )
    out.append("|---|---|---|---|---|")
    layers = [
        ("TAM: US adults 18–44", ADULTS_18_44),
        ("TAM (core): US adults 18–34", ADULTS_18_34),
        (
            "SAM (wide): 18–34 with no taxable investments",
            ADULTS_18_34 * NON_INVESTOR_SHARE_U35,
        ),
        (
            "SAM (core): 18–34 Cash App users with no taxable investments",
            CASHAPP_18_34_NONINVESTOR,
        ),
    ]
    flows_pu = base["fills"] + base["sparks"]
    for label, n in layers:
        out.append(
            f"| {label} | {n / 1e6:,.1f}M | {money(n * flows_pu)} | {money(n * fee_pool_pu)} | {money(n * base['revenue'])} |"
        )

    # SOM: 5-year ramps of funded users (end of year), share of core SAM
    ramps = {
        "low": [5e3, 20e3, 45e3, 75e3, 110e3],
        "base": [20e3, 80e3, 180e3, 300e3, 440e3],
        "high": [50e3, 200e3, 500e3, 900e3, 1.5e6],
    }
    CAC = {"low": 40, "base": 25, "high": 15}  # blended per funded user [EST]
    FIXED = {  # $/yr: team + compliance + vendors [EST]
        "low": [1.0e6, 1.5e6, 2.0e6, 2.5e6, 3.0e6],
        "base": [1.2e6, 2.0e6, 3.0e6, 4.0e6, 5.0e6],
        "high": [1.5e6, 3.0e6, 5.0e6, 7.0e6, 9.0e6],
    }
    out.append("\n## SOM: 5-year ramp (funded users, end of year)\n")
    for scn in ["low", "base", "high"]:
        pu = p[scn]
        out.append(
            f"\n### {scn.capitalize()} case: CAC ${CAC[scn]} per funded user, {int(CHURN * 100)}% churn\n"
        )
        out.append(
            "| Year | Funded users (EOY) | Share of core SAM | Money moved | 1% fee revenue | Total revenue | Contribution | Marketing (CAC) | Fixed | **Operating profit** |"
        )
        out.append("|---|---|---|---|---|---|---|---|---|---|")
        prev = 0
        cum = 0
        for y, eoy in enumerate(ramps[scn], 1):
            avg = (prev + eoy) / 2
            new = eoy - prev * (1 - CHURN)
            rev = avg * pu["revenue"]
            fees = avg * (pu["fee_fills"] + pu["fee_sparks"])
            contrib = avg * pu["contribution"]
            mkt = new * CAC[scn]
            profit = contrib - mkt - FIXED[scn][y - 1]
            cum += profit
            out.append(
                f"| {y} | {eoy / 1e3:,.0f}k | {eoy / CASHAPP_18_34_NONINVESTOR:.1%} | {money(avg * (pu['fills'] + pu['sparks']))} | {money(fees)} | {money(rev)} | {money(contrib)} | {money(mkt)} | {money(FIXED[scn][y - 1])} | **{money(profit)}** |"
            )
            prev = eoy
        out.append(f"\nCumulative 5-year operating result: **{money(cum)}**.")

    # Break-even users at fixed cost levels
    out.append(
        "\n## Break-even funded users (contribution covers fixed; excludes CAC)\n"
    )
    out.append("| Fixed cost / yr | Low | Base | High |")
    out.append("|---|---|---|---|")
    for f in [0.3e6, 1e6, 2.5e6, 5e6]:
        cells = []
        for s in ["low", "base", "high"]:
            c = p[s]["contribution"]
            cells.append(f"{f / c / 1e3:,.0f}k" if c > 0 else "never")
        out.append(f"| {money(f)} | " + " | ".join(cells) + " |")

    # Fee sensitivity: fills-fee vs spark-only, and elasticity
    out.append("\n## Fee design sensitivity (base user)\n")
    out.append("| Design | Revenue / user / yr | Contribution / user / yr |")
    out.append("|---|---|---|")
    b = p["base"]
    designs = [
        ("1% on fills + sparks (asked)", b["revenue"]),
        ("1% on sparks only", b["revenue"] - b["fee_fills"]),
        ("0.5% on fills + 1% on sparks", b["revenue"] - b["fee_fills"] / 2),
        ("1% fills + 1% sparks + no Blunts+", b["revenue"] - b["plus_net"]),
    ]
    for label, r in designs:
        out.append(f"| {label} | {money(r)} | {money(r - b['cost'])} |")

    # Lifetime value
    life = 1 / CHURN
    out.append("\n## Lifetime value (base)\n")
    out.append(
        f"Expected life {life:.1f} years at {int(CHURN * 100)}% churn. LTV (contribution) = **{money(b['contribution'] * life)}**; "
        f"at 15% churn = **{money(b['contribution'] / 0.15)}**. Max CAC for LTV/CAC = 3: {money(b['contribution'] * life / 3)}."
    )
    print("\n".join(out))


def sensitivity():
    """Contribution per user vs. money moved and bank cost; plus a 'main money app' scenario."""
    import copy

    g = globals()
    out = ["\n## Sensitivity: contribution per user per year vs. fills per year\n"]
    out.append(
        "Spark share 60%, one fill a month up to $600/yr then fills of $100; rail mix 60/30/10.\n"
    )
    out.append(
        "| Fills / yr | Revenue | Contribution (bank $0.75 fill / $1.00 spark) | Contribution (bank $0.30 / $0.50) | Users to cover $5M fixed (cheap bank) |"
    )
    out.append("|---|---|---|---|---|")
    state_keys = (
        "BEHAVIOR",
        "PLUS_CONVERSION",
        "RAIL_COST_FILL",
        "RAIL_COST_SPARK",
        "PER_USER_YEAR",
        "CHURN",
    )
    saved = {key: copy.deepcopy(g[key]) for key in state_keys}
    try:
        for fills in [300, 600, 1200, 2400, 4800]:
            n = max(6, round(fills / 100)) if fills > 600 else 12 if fills == 600 else 6
            g["BEHAVIOR"]["s"] = dict(
                fills=fills,
                spark_share=0.60,
                n_fills=n,
                n_sparks=max(4, round(fills * 0.6 / 150)),
            )
            g["PLUS_CONVERSION"]["s"] = 0.05
            a = per_user("s")
            g["RAIL_COST_FILL"].update(bank=0.30)
            g["RAIL_COST_SPARK"].update(bank=0.50, applepay=0.50)
            c = per_user("s")
            g["RAIL_COST_FILL"].update(saved["RAIL_COST_FILL"])
            g["RAIL_COST_SPARK"].update(saved["RAIL_COST_SPARK"])
            be = (
                f"{5e6 / c['contribution'] / 1e3:,.0f}k"
                if c["contribution"] > 0
                else "never"
            )
            out.append(
                f"| ${fills:,} | {money(a['revenue'])} | {money(a['contribution'])} | {money(c['contribution'])} | {be} |"
            )

        # "Main money app" scenario: paycheck auto-fill + card-like engagement
        g["BEHAVIOR"]["main"] = dict(
            fills=2400, spark_share=0.55, n_fills=24, n_sparks=8
        )
        g["PLUS_CONVERSION"]["main"] = 0.08
        g["RAIL_COST_FILL"].update(bank=0.30)
        g["RAIL_COST_SPARK"].update(bank=0.50, applepay=0.50)
        g["PER_USER_YEAR"]["support"] = 1.00
        g["CHURN"] = 0.25
        m = per_user("main")
        out.append("\n## 'Main money app' scenario\n")
        out.append(
            "Fills $2,400/yr (paycheck auto-fill, $100 twice a month), sparks 55%, Blunts+ 8%, bank rail negotiated to $0.30/$0.50, support $1/user, churn 25%.\n"
        )
        out.append(
            f"Revenue **{money(m['revenue'])}**, variable cost {money(m['cost'])}, contribution **{money(m['contribution'])}** per user per year; "
            f"LTV at 25% churn **{money(m['contribution'] / 0.25)}**."
        )
        out.append(
            "\n| Funded users | Revenue / yr | Contribution / yr | Less $5M fixed |"
        )
        out.append("|---|---|---|---|")
        for n in [100e3, 300e3, 500e3, 1e6, 2e6]:
            out.append(
                f"| {n / 1e3:,.0f}k | {money(n * m['revenue'])} | {money(n * m['contribution'])} | {money(n * m['contribution'] - 5e6)} |"
            )
        print("\n".join(out))
    finally:
        g.update(saved)


if __name__ == "__main__":
    main()
    sensitivity()
