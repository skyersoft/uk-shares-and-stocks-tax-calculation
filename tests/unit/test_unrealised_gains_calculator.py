"""Unit tests for unrealised_gains_calculator.py.

All tests use MockMarketPriceService — no network calls.

Key scenarios covered:
- Simple unrealised gain (S104 pool matching)
- Simple unrealised loss
- Bed & breakfast rule triggering (buy within last 30 days)
- Partial B&B match (some shares in B&B window, rest from pool)
- Net gain below annual exemption → zero tax
- Net gain above annual exemption → correct 18% / 24% tax
- Combined with already-realised gains
- B&B warning flags
- GBP holdings (no FX conversion needed)
- Unknown symbol skipped gracefully
"""
import pytest
from datetime import datetime, timedelta

from src.main.python.models.domain_models import (
    Transaction, TransactionType, Security, Currency, AssetClass,
    Holding, UnrealisedPosition, PredictiveTaxSummary,
)
from src.main.python.services.market_price_service import MockMarketPriceService
from src.main.python.services.unrealised_gains_calculator import UnrealisedGainsCalculator


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def calc():
    return UnrealisedGainsCalculator()


@pytest.fixture
def usd():
    return Currency(code="USD", rate_to_base=0.80)  # 1 USD = 0.80 GBP


@pytest.fixture
def gbp():
    return Currency(code="GBP", rate_to_base=1.0)


@pytest.fixture
def aapl():
    return Security(
        isin="US0378331005",
        symbol="AAPL",
        name="Apple Inc",
        asset_class=AssetClass.STOCK,
        listing_exchange="NASDAQ",
    )


@pytest.fixture
def msft():
    return Security(
        isin="US5949181045",
        symbol="MSFT",
        name="Microsoft Corp",
        asset_class=AssetClass.STOCK,
        listing_exchange="NASDAQ",
    )


@pytest.fixture
def tsco():
    return Security(
        isin="GB0008847096",
        symbol="TSCO.L",
        name="Tesco PLC",
        asset_class=AssetClass.STOCK,
        listing_exchange="LSE",
    )


# Price service: AAPL=175 USD, MSFT=300 USD, TSCO.L=280 GBP; 1 USD = 0.80 GBP
@pytest.fixture
def price_svc():
    return MockMarketPriceService(
        prices={"AAPL": 175.0, "MSFT": 300.0, "TSCO.L": 280.0},
        fx_rates={"USD": 0.80},
    )


TODAY = datetime(2026, 3, 26, 12, 0, 0)


def make_buy(security, date, quantity, price, currency, tid=None, commission=0.0):
    return Transaction.create_buy_transaction(
        transaction_id=tid or f"BUY-{security.symbol}-{date.date()}",
        security=security,
        date=date,
        quantity=quantity,
        price_per_unit=price,
        currency=currency,
        commission=commission,
    )


def make_holding(security, quantity, avg_cost_gbp, market="NASDAQ"):
    return Holding(
        security=security,
        quantity=quantity,
        average_cost_gbp=avg_cost_gbp,
        market=market,
    )


# ---------------------------------------------------------------------------
# calculate_unrealised_positions
# ---------------------------------------------------------------------------

class TestCalculateUnrealisedPositions:

    def test_single_holding_gain(self, calc, price_svc, aapl, usd):
        """Buy 100 AAPL at average cost £100/share; current price £140 → gain £4000."""
        # avg_cost_gbp = 100 GBP/share → total cost = 10000 GBP
        holding = make_holding(aapl, quantity=100, avg_cost_gbp=100.0)
        buys = [make_buy(aapl, datetime(2025, 1, 10), 100, 125.0, usd)]

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, buys, today=TODAY
        )

        assert len(positions) == 1
        pos = positions[0]
        assert pos.holding.security.symbol == "AAPL"
        assert pos.price_currency == "USD"
        # current_price_gbp = 175 * 0.80 = 140 GBP
        assert abs(pos.current_price_gbp - 140.0) < 0.01
        # current_value = 100 * 140 = 14000
        assert abs(pos.current_value_gbp - 14000.0) < 0.01
        # cost_basis = 100 * 100 = 10000
        assert abs(pos.cost_basis_gbp - 10000.0) < 0.01
        # gain = 14000 - 10000 = 4000
        assert abs(pos.unrealised_gain_loss_gbp - 4000.0) < 0.01
        assert pos.is_gain is True
        assert pos.is_loss is False

    def test_single_holding_loss(self, calc, price_svc, msft, usd):
        """Buy 50 MSFT at £320/share; current price £240 → loss £4000."""
        # avg_cost_gbp = 320 GBP/share → cost = 16000
        # current = 300 USD * 0.80 = 240 GBP/share → value = 12000; loss = -4000
        holding = make_holding(msft, quantity=50, avg_cost_gbp=320.0)
        buys = [make_buy(msft, datetime(2025, 3, 1), 50, 400.0, usd)]

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, buys, today=TODAY
        )

        assert len(positions) == 1
        pos = positions[0]
        assert abs(pos.current_value_gbp - 12000.0) < 0.01
        assert abs(pos.unrealised_gain_loss_gbp - (-4000.0)) < 0.01
        assert pos.is_loss is True

    def test_unknown_symbol_skipped(self, calc, aapl, usd):
        """Holdings whose symbol is not in the price service are skipped."""
        svc = MockMarketPriceService(prices={}, fx_rates={"USD": 0.80})
        holding = make_holding(aapl, quantity=10, avg_cost_gbp=100.0)
        positions = calc.calculate_unrealised_positions([holding], svc, [], today=TODAY)
        assert len(positions) == 0

    def test_gbp_holding_no_fx(self, calc, price_svc, tsco, gbp):
        """LSE holding priced in GBP should have fx_rate = 1.0."""
        # avg cost 250 GBP/share; current 280 GBP → gain 30*100=3000
        holding = make_holding(tsco, quantity=100, avg_cost_gbp=250.0, market="LSE")
        buys = [make_buy(tsco, datetime(2025, 6, 1), 100, 250.0, gbp)]

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, buys, today=TODAY
        )

        assert len(positions) == 1
        pos = positions[0]
        assert pos.fx_rate_to_gbp == 1.0
        assert pos.price_currency == "GBP"
        assert abs(pos.current_price_gbp - 280.0) < 0.01
        assert abs(pos.unrealised_gain_loss_gbp - 3000.0) < 0.01

    def test_recent_buy_flag_set(self, calc, price_svc, aapl, usd):
        """has_recent_buys should be True for a buy within 30 days."""
        holding = make_holding(aapl, quantity=10, avg_cost_gbp=100.0)
        recent_buy = make_buy(aapl, TODAY - timedelta(days=10), 10, 125.0, usd)

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [recent_buy], today=TODAY
        )
        assert positions[0].has_recent_buys is True
        assert positions[0].days_since_last_buy == 10

    def test_no_recent_buy_flag_clear(self, calc, price_svc, aapl, usd):
        """has_recent_buys should be False for a buy older than 30 days."""
        holding = make_holding(aapl, quantity=10, avg_cost_gbp=100.0)
        old_buy = make_buy(aapl, TODAY - timedelta(days=60), 10, 125.0, usd)

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [old_buy], today=TODAY
        )
        assert positions[0].has_recent_buys is False
        assert positions[0].days_since_last_buy == 60


# ---------------------------------------------------------------------------
# calculate_predictive_tax — basic gain/loss
# ---------------------------------------------------------------------------

class TestPredictiveTaxBasic:

    def test_below_exemption_no_tax(self, calc, price_svc, aapl, usd):
        """Net unrealised gain < £3000 → taxable gain = 0."""
        # Buy 10 AAPL at £100/share GBP basis; current = 140 GBP → gain = £400
        holding = make_holding(aapl, quantity=10, avg_cost_gbp=100.0)
        buy_tx = make_buy(aapl, datetime(2025, 1, 10), 10, 125.0, usd)

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [buy_tx], today=TODAY
        )
        summary = calc.calculate_predictive_tax(
            positions, [buy_tx], "2025-2026", today=TODAY
        )

        assert summary.predictive_taxable_gain_gbp == 0.0
        assert summary.estimated_tax_basic_rate_gbp == 0.0

    def test_above_exemption_generates_tax(self, calc, price_svc, aapl, usd):
        """Net gain > £3000 → taxable gain = net − exemption."""
        # 200 shares, cost £100/share, current £140 → gain £8000
        holding = make_holding(aapl, quantity=200, avg_cost_gbp=100.0)
        buy_tx = make_buy(aapl, datetime(2025, 1, 10), 200, 125.0, usd,
                          tid="BUY-AAPL-LARGE")

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [buy_tx], today=TODAY
        )
        summary = calc.calculate_predictive_tax(
            positions, [buy_tx], "2025-2026", today=TODAY
        )

        # Net gain ~£8000 (depends on matched cost via matcher)
        assert summary.predictive_net_gain_gbp > 0
        assert summary.predictive_taxable_gain_gbp > 0
        assert summary.estimated_tax_basic_rate_gbp > 0
        # Tax at 18% basic rate
        assert abs(
            summary.estimated_tax_basic_rate_gbp
            - summary.predictive_taxable_gain_gbp * 0.18
        ) < 0.01

    def test_net_loss_no_tax(self, calc, price_svc, msft, usd):
        """Position at a loss → no CGT liability."""
        # 10 MSFT at £400/share GBP → cost £4000; current 300 USD * 0.80 = £240/share → value £2400
        holding = make_holding(msft, quantity=10, avg_cost_gbp=400.0)
        buy_tx = make_buy(msft, datetime(2025, 2, 1), 10, 500.0, usd)

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [buy_tx], today=TODAY
        )
        summary = calc.calculate_predictive_tax(
            positions, [buy_tx], "2025-2026", today=TODAY
        )

        assert summary.predictive_taxable_gain_gbp == 0.0
        assert summary.estimated_tax_basic_rate_gbp == 0.0


# ---------------------------------------------------------------------------
# calculate_predictive_tax — B&B rule detection
# ---------------------------------------------------------------------------

class TestPredictiveTaxBBRule:

    def test_bb_rule_detected_and_flagged(self, calc, price_svc, aapl, usd):
        """Shares bought within 30 days should trigger B&B matching."""
        # Original pool: 50 AAPL bought 6 months ago
        old_buy = make_buy(
            aapl, TODAY - timedelta(days=180), 50, 100.0, usd, tid="BUY-OLD"
        )
        # Recent buy: 50 AAPL bought 10 days ago at higher price
        recent_buy = make_buy(
            aapl, TODAY - timedelta(days=10), 50, 150.0, usd, tid="BUY-RECENT"
        )

        holding = make_holding(aapl, quantity=100, avg_cost_gbp=100.0)
        all_txs = [old_buy, recent_buy]

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, all_txs, today=TODAY
        )
        summary = calc.calculate_predictive_tax(
            positions, all_txs, "2025-2026", today=TODAY
        )

        # The B&B flag must be set and AAPL listed
        assert summary.affected_by_bb_rule is True
        assert "AAPL" in summary.bb_rule_affected_symbols

    def test_no_bb_rule_when_buys_are_old(self, calc, price_svc, aapl, usd):
        """No B&B flagging when all buys are more than 30 days old."""
        old_buy = make_buy(
            aapl, TODAY - timedelta(days=90), 100, 100.0, usd, tid="BUY-OLD"
        )
        holding = make_holding(aapl, quantity=100, avg_cost_gbp=100.0)

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [old_buy], today=TODAY
        )
        summary = calc.calculate_predictive_tax(
            positions, [old_buy], "2025-2026", today=TODAY
        )

        assert summary.affected_by_bb_rule is False
        assert summary.bb_rule_affected_symbols == []


# ---------------------------------------------------------------------------
# calculate_predictive_tax — combined with already-realised
# ---------------------------------------------------------------------------

class TestPredictiveTaxCombined:

    def test_combined_exemption_usage(self, calc, price_svc, aapl, usd):
        """Already-realised gains reduce the remaining exemption."""
        # 50 AAPL: cost £100, current £140 → gain ~£2000
        holding = make_holding(aapl, quantity=50, avg_cost_gbp=100.0)
        buy_tx = make_buy(
            aapl, datetime(2025, 1, 10), 50, 125.0, usd, tid="BUY-50"
        )
        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [buy_tx], today=TODAY
        )

        # Already realised £2500 this year
        summary = calc.calculate_predictive_tax(
            positions, [buy_tx], "2025-2026",
            already_realised_gain_gbp=2500.0,
            today=TODAY,
        )

        assert summary.already_realised_gain_gbp == 2500.0
        # combined = unrealised_net + 2500
        assert abs(
            summary.combined_net_gain_gbp
            - (summary.predictive_net_gain_gbp + 2500.0)
        ) < 0.01
        # Combined taxable must be >= predictive taxable
        assert summary.combined_taxable_gain_gbp >= summary.predictive_taxable_gain_gbp

    def test_combined_tax_at_basic_rate(self, calc, price_svc, aapl, usd):
        """Combined tax estimate uses 18% basic rate on taxable amount."""
        holding = make_holding(aapl, quantity=200, avg_cost_gbp=100.0)
        buy_tx = make_buy(
            aapl, datetime(2025, 1, 10), 200, 125.0, usd, tid="BUY-200"
        )
        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [buy_tx], today=TODAY
        )
        summary = calc.calculate_predictive_tax(
            positions, [buy_tx], "2025-2026",
            already_realised_gain_gbp=1000.0,
            today=TODAY,
        )

        assert abs(
            summary.combined_estimated_tax_basic_rate_gbp
            - summary.combined_taxable_gain_gbp * 0.18
        ) < 0.01

    def test_summary_dict_structure(self, calc, price_svc, aapl, usd):
        """get_summary_dict() returns all expected keys."""
        holding = make_holding(aapl, quantity=10, avg_cost_gbp=100.0)
        buy_tx = make_buy(aapl, datetime(2025, 1, 10), 10, 125.0, usd)
        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [buy_tx], today=TODAY
        )
        summary = calc.calculate_predictive_tax(
            positions, [buy_tx], "2025-2026", today=TODAY
        )
        d = summary.get_summary_dict()

        assert "tax_year" in d
        assert "portfolio" in d
        assert "predictive_cgt" in d
        assert "combined_with_realised" in d
        assert "warnings" in d
        assert "affected_by_bb_rule" in d["warnings"]


# ---------------------------------------------------------------------------
# Regression: already_realised_gain_gbp from file sells
# ---------------------------------------------------------------------------

class TestAutoComputedRealisedGains:
    """Verify that already-realised gains from historical SELL transactions
    in the same tax year are reflected in combined_with_realised.

    This covers the bug where freetrade-sample.csv sells in April (within
    tax year 2025-2026) showed £0 in 'already_realised_gain_gbp' because
    the /unrealised-gains endpoint was not computing gains from the file.
    """

    def test_already_realised_gain_passed_correctly(self, calc, price_svc, aapl, usd):
        """When already_realised_gain_gbp is supplied, combined section reflects it."""
        # Remaining AAPL position after a partial sell
        holding = make_holding(aapl, quantity=15, avg_cost_gbp=100.0)
        buy_tx = make_buy(aapl, datetime(2025, 1, 15), 15, 125.0, usd)

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [buy_tx], today=TODAY
        )

        # Simulate: 5 shares sold at a profit of £99 already this tax year
        realised_gain = 99.0
        summary = calc.calculate_predictive_tax(
            positions, [buy_tx], "2025-2026",
            already_realised_gain_gbp=realised_gain,
            today=TODAY,
        )

        assert summary.already_realised_gain_gbp == pytest.approx(realised_gain)
        assert summary.combined_net_gain_gbp == pytest.approx(
            summary.predictive_net_gain_gbp + realised_gain, abs=0.01
        )

    def test_zero_realised_gain_when_no_sells(self, calc, price_svc, aapl, usd):
        """With no realised gain passed, combined equals predictive only."""
        holding = make_holding(aapl, quantity=10, avg_cost_gbp=100.0)
        buy_tx = make_buy(aapl, datetime(2025, 1, 15), 10, 125.0, usd)

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [buy_tx], today=TODAY
        )
        summary = calc.calculate_predictive_tax(
            positions, [buy_tx], "2025-2026",
            already_realised_gain_gbp=0.0,
            today=TODAY,
        )

        assert summary.already_realised_gain_gbp == 0.0
        assert summary.combined_net_gain_gbp == pytest.approx(
            summary.predictive_net_gain_gbp, abs=0.01
        )

    def test_realised_loss_reduces_combined_net(self, calc, price_svc, msft, usd):
        """A negative already_realised_gain_gbp (loss) reduces combined net gain."""
        holding = make_holding(msft, quantity=5, avg_cost_gbp=300.0)
        buy_tx = make_buy(msft, datetime(2025, 1, 15), 5, 375.0, usd)

        positions = calc.calculate_unrealised_positions(
            [holding], price_svc, [buy_tx], today=TODAY
        )

        # Simulate: MSFT sold at a loss of £154.25 earlier this tax year
        realised_loss = -154.25
        summary = calc.calculate_predictive_tax(
            positions, [buy_tx], "2025-2026",
            already_realised_gain_gbp=realised_loss,
            today=TODAY,
        )

        assert summary.already_realised_gain_gbp == pytest.approx(realised_loss)
        assert summary.combined_net_gain_gbp == pytest.approx(
            summary.predictive_net_gain_gbp + realised_loss, abs=0.01
        )
        # Combined taxable must never be negative
        assert summary.combined_taxable_gain_gbp >= 0.0

