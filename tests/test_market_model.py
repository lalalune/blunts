import contextlib
import copy
import io
import unittest
from research.model import market_model as model


class MarketModelTests(unittest.TestCase):
    def test_fee_cap(self):
        self.assertEqual(model.fee_on(25), 0.25)
        self.assertEqual(model.fee_on(2000), 10)

    def test_sensitivity_restores_assumptions_and_is_repeatable(self):
        keys = (
            "BEHAVIOR",
            "PLUS_CONVERSION",
            "RAIL_COST_FILL",
            "RAIL_COST_SPARK",
            "PER_USER_YEAR",
            "CHURN",
        )
        before = {key: copy.deepcopy(getattr(model, key)) for key in keys}
        outputs = []
        for _ in range(2):
            stream = io.StringIO()
            with contextlib.redirect_stdout(stream):
                model.sensitivity()
            outputs.append(stream.getvalue())
            self.assertEqual(before, {key: getattr(model, key) for key in keys})
        self.assertEqual(*outputs)
        # The scenario states 25% churn: amortized KYC must use that rate too.
        self.assertIn("variable cost $8.27", outputs[0])

    def test_revenue_less_cost_equals_contribution(self):
        for scenario in model.BEHAVIOR:
            result = model.per_user(scenario)
            self.assertAlmostEqual(
                result["contribution"], result["revenue"] - result["cost"]
            )
