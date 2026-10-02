"""Guard against material business-model mistakes, not production financial tests."""

import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import unittest
from dataclasses import replace

ROOT = Path(__file__).resolve().parents[1]
RESEARCH = ROOT / "research/2026-10-02"
spec = importlib.util.spec_from_file_location(
    "business_model", RESEARCH / "business_model.py"
)
model = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = model
spec.loader.exec_module(model)


class BusinessModelTests(unittest.TestCase):
    def test_revenue_is_not_customer_money_and_respects_fee_right(self):
        case = model.CASES[1]
        zero = model.unit(replace(case, retained_fee_fraction=0))
        self.assertEqual(zero["revenue"], 0)
        full = model.unit(case)
        half = model.unit(replace(case, retained_fee_fraction=0.5))
        self.assertAlmostEqual(
            full["revenue"] - half["revenue"], full["customer_fee_pool"] / 2
        )
        self.assertEqual(full["service_cost"], half["service_cost"])

    def test_fee_only_pricing_and_one_sided_fee(self):
        case = model.CASES[1]
        self.assertNotIn("subscription", model.unit(case))
        self.assertEqual(model.unit(case)["revenue"], 37.2)
        exit_only = model.unit(replace(case, load_fee_rate=0))
        self.assertAlmostEqual(exit_only["revenue"], 13.2)
        self.assertEqual(exit_only["service_cost"], model.unit(case)["service_cost"])

    def test_percentage_fees_are_uncapped_and_not_dependent_on_split_count(self):
        case = replace(
            model.CASES[0], annual_load_volume=100000, annual_unload_volume=100000
        )
        self.assertEqual(model.unit(case)["customer_fee_pool"], 2000)
        split = replace(case, loads=100, unloads=100)
        self.assertEqual(
            model.unit(case)["customer_fee_pool"],
            model.unit(split)["customer_fee_pool"],
        )

    def test_onramp_cost_is_only_absorbed_when_explicitly_modeled(self):
        case = model.CASES[2]
        base = model.unit(case)
        subsidized = model.unit(
            replace(case, onramp_volume_share=0.25, absorbed_onramp_fee_rate=0.03)
        )
        self.assertEqual(base["costs"]["absorbed_onramp"], 0)
        self.assertEqual(subsidized["costs"]["absorbed_onramp"], 36)
        self.assertAlmostEqual(base["steady_margin"] - subsidized["steady_margin"], 36)

    def test_churn_uses_monthly_replacement_not_only_first_cohort(self):
        case = model.CASES[1]
        monthly = 1 - (1 - case.annual_churn) ** (1 / 12)
        unit = model.unit(case)
        self.assertAlmostEqual((1 - monthly) ** 12, 1 - case.annual_churn)
        self.assertAlmostEqual(
            unit["replacement"],
            12 * monthly * (case.funded_cac + case.onboarding_per_funded),
        )
        self.assertGreater(
            unit["replacement"],
            case.annual_churn * (case.funded_cac + case.onboarding_per_funded),
        )

    def test_target_is_minimum_maintained_base_and_negative_margin_cannot_scale(self):
        self.assertIsNone(model.target(model.CASES[0], 600000, 250000))
        case = model.CASES[2]
        result = model.target(case, 1500000, 1000000)
        margin = model.unit(case)["steady_margin"]
        self.assertGreaterEqual(result["profit"], 1000000)
        self.assertLess((result["users"] - 1) * margin - 1500000, 1000000)

    def test_growth_cash_counts_actual_acquisition_once(self):
        case = model.CASES[1]
        result = model.ramp(case, [1200, 0], [100000, 100000], upfront=25000)
        first, second = result["rows"]
        self.assertEqual(
            first["acquisition_and_kyc"],
            1200 * (case.funded_cac + case.onboarding_per_funded),
        )
        self.assertEqual(second["acquisition_and_kyc"], 0)
        self.assertAlmostEqual(
            second["active_eoy"], first["active_eoy"] * (1 - case.annual_churn)
        )
        self.assertAlmostEqual(
            second["cumulative_cash"],
            -25000 + sum(r["operating_profit"] for r in result["rows"]),
        )
        self.assertGreaterEqual(result["peak_cash_deficit"], -second["cumulative_cash"])

    def test_invalid_inputs_are_rejected(self):
        for changes in (
            {"annual_churn": 0},
            {"annual_churn": 1},
            {"bank_share": 2},
            {"funded_cac": -1},
            {"loads": 0},
        ):
            with self.assertRaises(ValueError):
                model.unit(replace(model.CASES[0], **changes))
        with self.assertRaises(ValueError):
            model.ramp(model.CASES[0], [100], [100, 200])

    def test_source_integrity_and_demographic_filters(self):
        manifest = json.loads((RESEARCH / "sources/manifest.json").read_text())
        raw = (RESEARCH / "sources" / manifest["file"]).read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), manifest["sha256"])
        population = model.population()
        self.assertEqual(population["ages18_34"], 78500906)
        self.assertGreater(population["ages18_44"], population["ages18_34"])

    def test_published_outputs_regenerate_without_drift(self):
        paths = [RESEARCH / "model-output.md", RESEARCH / "model-results.json"]
        before = [p.read_bytes() for p in paths]
        model.main()
        self.assertEqual(before, [p.read_bytes() for p in paths])


if __name__ == "__main__":
    unittest.main()
