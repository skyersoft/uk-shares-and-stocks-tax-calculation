"""A USD Activity Statement through the real calculator: gains are in pounds at HMRC monthly rates."""
import pytest

from src.main.python.capital_gains_calculator import create_enhanced_calculator

FIXTURE = "tests/data/ibkr/activity_statement_usd.csv"


def test_usd_trades_give_the_hand_calculated_gain_in_pounds():
    """Buy 100 @ 10.50 USD (fee 1.00) in Jun 2025 (HMRC 1.3412 USD/£1); sell 40 @ 12.00 USD
    (fee 1.10) in Aug 2025 (1.3541).
      cost     = 0.4 * 1050 / 1.3412           = 313.17
      expenses = 0.4 * 1.00 / 1.3412 + 1.10 / 1.3541 = 0.30 + 0.81
      proceeds = 480 / 1.3541                  = 354.48
    The cost must use the June rate, not the August rate of the sale."""
    results = create_enhanced_calculator("csv").calculate_comprehensive_analysis(FIXTURE, "2025-2026", "both")
    [d] = results["tax_analysis"].capital_gains.disposals
    assert d.cost_basis == pytest.approx(0.4 * 1050 / 1.3412, abs=0.01)
    assert d.proceeds - d.cost_basis - d.expenses == pytest.approx(40.22, abs=0.01)
    assert d.cost_original_currency == "USD"
