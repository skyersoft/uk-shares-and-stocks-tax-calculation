"""Unit tests for TimelineCalculator service."""
from datetime import date, datetime
from typing import Dict, Optional

import pytest

from src.main.python.models.domain_models import (
    AssetClass,
    Currency,
    Security,
    Transaction,
    TransactionType,
)
from src.main.python.services.timeline_calculator import (
    TimelineCalculator,
    _compute_cgt,
    _get_tax_year,
    _year_end_date,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

GBP = Currency(code="GBP", rate_to_base=1.0)


def _security(symbol: str = "AAPL") -> Security:
    return Security(
        isin=f"US{symbol.ljust(9, '0')[:9]}1",
        symbol=symbol,
        name=symbol,
        asset_class=AssetClass.STOCK,
    )


def _buy(
    symbol: str,
    qty: float,
    price_gbp: float,
    dt: str,
    tx_id: str = None,
) -> Transaction:
    return Transaction(
        transaction_type=TransactionType.BUY,
        security=_security(symbol),
        date=datetime.fromisoformat(dt),
        quantity=qty,
        price_per_unit=price_gbp,
        commission=0.0,
        taxes=0.0,
        currency=GBP,
        transaction_id=tx_id or f"buy-{symbol}-{dt}",
    )


def _sell(
    symbol: str,
    qty: float,
    price_gbp: float,
    dt: str,
    tx_id: str = None,
) -> Transaction:
    return Transaction(
        transaction_type=TransactionType.SELL,
        security=_security(symbol),
        date=datetime.fromisoformat(dt),
        quantity=qty,
        price_per_unit=price_gbp,
        commission=0.0,
        taxes=0.0,
        currency=GBP,
        transaction_id=tx_id or f"sell-{symbol}-{dt}",
    )


def _dividend(symbol: str, amount_gbp: float, dt: str) -> Transaction:
    return Transaction(
        transaction_type=TransactionType.DIVIDEND,
        security=_security(symbol),
        date=datetime.fromisoformat(dt),
        quantity=1.0,
        price_per_unit=amount_gbp,
        commission=0.0,
        taxes=0.0,
        currency=GBP,
        transaction_id=f"div-{symbol}-{dt}",
    )


def _interest(amount_gbp: float, dt: str) -> Transaction:
    return Transaction(
        transaction_type=TransactionType.INTEREST,
        security=_security("CASH"),
        date=datetime.fromisoformat(dt),
        quantity=1.0,
        price_per_unit=amount_gbp,
        commission=0.0,
        taxes=0.0,
        currency=GBP,
        transaction_id=f"int-{dt}",
    )


class MockPriceFetcher:
    """Returns a constant GBP price per symbol — no network calls."""

    def __init__(self, prices: Dict[str, float]) -> None:
        self._prices = prices

    def prefetch(self, symbols, start, end) -> None:  # noqa: D102
        pass  # no-op

    def get_price(self, symbol: str, target: date) -> Optional[float]:  # noqa: D102
        return self._prices.get(symbol)


def _calculator(prices: Dict[str, float]) -> TimelineCalculator:
    return TimelineCalculator(price_fetcher=MockPriceFetcher(prices))


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

class TestHelpers:
    def test_get_tax_year_april_6_or_later(self):
        assert _get_tax_year(date(2024, 4, 6)) == "2024-2025"

    def test_get_tax_year_before_april_6(self):
        assert _get_tax_year(date(2024, 4, 5)) == "2023-2024"

    def test_year_end_date(self):
        assert _year_end_date("2024-2025") == date(2025, 4, 5)

    def test_compute_cgt_below_aea(self):
        # £3,000 AEA for 2024-2025; gain £2,000 → no tax
        assert _compute_cgt(2000.0, "2024-2025") == 0.0

    def test_compute_cgt_above_aea(self):
        # £5,000 gain − £3,000 AEA = £2,000 × 18% = £360
        assert abs(_compute_cgt(5000.0, "2024-2025") - 360.0) < 0.01


# ---------------------------------------------------------------------------
# Single BUY
# ---------------------------------------------------------------------------

class TestSingleBuy:
    def test_single_buy_sets_unrealised_value(self):
        """10 shares, Yahoo price £150 → unrealised value £1,500."""
        calc = _calculator({"AAPL": 150.0})
        txns = [_buy("AAPL", 10, 100.0, "2024-06-01")]
        events, _ = calc.calculate(txns, today=date(2024, 6, 1))
        buy_event = next(e for e in events if e.event_type == "BUY")
        assert buy_event.unrealised_value_gbp == 1500.0

    def test_single_buy_sets_cost_basis(self):
        """Cost basis tracks the transaction price, not Yahoo price."""
        calc = _calculator({"AAPL": 150.0})
        txns = [_buy("AAPL", 10, 100.0, "2024-06-01")]
        events, _ = calc.calculate(txns, today=date(2024, 6, 1))
        buy_event = next(e for e in events if e.event_type == "BUY")
        # cost = 10 × £100 (transaction price)
        assert buy_event.total_cost_basis_gbp == 1000.0


# ---------------------------------------------------------------------------
# Subsequent BUY uses Yahoo price for unrealised value
# ---------------------------------------------------------------------------

class TestSubsequentBuyUsesYahooPrice:
    def test_subsequent_buy_uses_yahoo_price_not_transaction_price(self):
        """After 2nd BUY, Yahoo price £6 → total 15 shares × £6 = £90."""
        calc = _calculator({"AAPL": 6.0})
        txns = [
            _buy("AAPL", 10, 5.0, "2024-06-01"),
            _buy("AAPL", 5, 6.0, "2024-06-15"),
        ]
        events, _ = calc.calculate(txns, today=date(2024, 6, 15))
        second_buy = [e for e in events if e.event_type == "BUY"][1]
        assert second_buy.unrealised_value_gbp == 90.0


# ---------------------------------------------------------------------------
# Unrealised gain/loss
# ---------------------------------------------------------------------------

class TestUnrealisedGainLoss:
    def test_unrealised_gain_loss_is_yahoo_value_minus_cost_basis(self):
        """£90 unrealised value − £80 cost basis = £10 gain."""
        calc = _calculator({"AAPL": 6.0})
        txns = [
            _buy("AAPL", 10, 5.0, "2024-06-01"),   # cost = 50
            _buy("AAPL", 5, 6.0, "2024-06-15"),    # cost += 30 → total 80
        ]
        events, _ = calc.calculate(txns, today=date(2024, 6, 15))
        second_buy = [e for e in events if e.event_type == "BUY"][1]
        assert second_buy.unrealised_gain_loss_gbp == 10.0  # 90 − 80


# ---------------------------------------------------------------------------
# SELL reduces cost basis and unrealised value
# ---------------------------------------------------------------------------

class TestSellReducesCostAndValue:
    def test_sell_reduces_cost_basis_and_unrealised_value(self):
        calc = _calculator({"AAPL": 100.0})
        txns = [
            _buy("AAPL", 10, 80.0, "2024-06-01"),
            _sell("AAPL", 5, 100.0, "2024-07-01"),
        ]
        events, _ = calc.calculate(txns, today=date(2024, 7, 1))
        sell_event = next(e for e in events if e.event_type == "SELL")
        # 5 shares left × £100 = £500
        assert sell_event.unrealised_value_gbp == 500.0
        # cost basis: 10×80 = 800, sold half (proportional) → ~400 remaining
        assert sell_event.total_cost_basis_gbp == pytest.approx(400.0, abs=1.0)


# ---------------------------------------------------------------------------
# SELL produces HMRC gain
# ---------------------------------------------------------------------------

class TestSellGain:
    def test_sell_after_buy_produces_hmrc_gain(self):
        calc = _calculator({"AAPL": 120.0})
        txns = [
            _buy("AAPL", 10, 100.0, "2024-06-01"),
            _sell("AAPL", 10, 120.0, "2024-08-01"),
        ]
        events, _ = calc.calculate(txns, today=date(2024, 8, 1))
        sell_event = next(e for e in events if e.event_type == "SELL")
        # gain = 10×120 − 10×100 = 200
        assert sell_event.realised_gain_loss_gbp == pytest.approx(200.0, abs=5.0)

    def test_sell_with_commission_reduces_gain(self):
        calc = _calculator({"AAPL": 120.0})
        sec = _security("AAPL")
        buy_tx = Transaction(
            transaction_type=TransactionType.BUY,
            security=sec,
            date=datetime(2024, 6, 1),
            quantity=10,
            price_per_unit=100.0,
            commission=10.0,
            taxes=0.0,
            currency=GBP,
            transaction_id="buy-commission",
        )
        sell_tx = Transaction(
            transaction_type=TransactionType.SELL,
            security=sec,
            date=datetime(2024, 8, 1),
            quantity=10,
            price_per_unit=120.0,
            commission=10.0,
            taxes=0.0,
            currency=GBP,
            transaction_id="sell-commission",
        )
        events, _ = calc.calculate([buy_tx, sell_tx], today=date(2024, 8, 1))
        sell_event = next(e for e in events if e.event_type == "SELL")
        # proceeds = (10×120 − 10) = 1190; cost = (10×100 + 10) = 1010 → gain = 180
        assert sell_event.realised_gain_loss_gbp == pytest.approx(180.0, abs=5.0)


# ---------------------------------------------------------------------------
# DIVIDEND and INTEREST go to income, not realised gain
# ---------------------------------------------------------------------------

class TestDividend:
    def test_dividend_increments_income_not_realised_gain(self):
        calc = _calculator({"AAPL": 100.0})
        txns = [
            _buy("AAPL", 10, 100.0, "2024-06-01"),
            _dividend("AAPL", 50.0, "2024-09-01"),
        ]
        events, _ = calc.calculate(txns, today=date(2024, 9, 1))
        div_event = next(e for e in events if e.event_type == "DIVIDEND")
        assert div_event.income_gbp == pytest.approx(50.0, abs=1.0)
        assert div_event.realised_gain_loss_gbp == 0.0

    def test_interest_increments_income_not_realised_gain(self):
        calc = _calculator({"AAPL": 100.0})
        txns = [
            _buy("AAPL", 10, 100.0, "2024-06-01"),
            _interest(25.0, "2024-10-01"),
        ]
        events, _ = calc.calculate(txns, today=date(2024, 10, 1))
        int_event = next(e for e in events if e.event_type == "INTEREST")
        assert int_event.income_gbp == pytest.approx(25.0, abs=1.0)
        assert int_event.realised_gain_loss_gbp == 0.0


# ---------------------------------------------------------------------------
# YEAR_END markers
# ---------------------------------------------------------------------------

class TestYearEnd:
    def test_year_end_marker_resets_year_totals(self):
        """Income accumulated in 2024-2025 should reset to 0 after YEAR_END."""
        calc = _calculator({"AAPL": 100.0})
        txns = [
            _buy("AAPL", 5, 100.0, "2024-09-01"),        # 2024-2025
            _dividend("AAPL", 200.0, "2024-11-01"),       # income in 2024-2025
            _buy("AAPL", 5, 110.0, "2025-05-01"),         # 2025-2026 → triggers YEAR_END
        ]
        events, _ = calc.calculate(txns, today=date(2025, 5, 1))
        year_end = next(e for e in events if e.event_type == "YEAR_END")
        assert year_end.tax_year == "2024-2025"
        # First BUY after the YEAR_END should have income reset to 0
        post_ye = [
            e for e in events
            if e.event_index > year_end.event_index and e.event_type == "BUY"
        ][0]
        assert post_ye.income_gbp == 0.0

    def test_year_end_populates_predictive_cgt(self):
        calc = _calculator({"AAPL": 110.0})
        txns = [
            _buy("AAPL", 10, 100.0, "2024-09-01"),
            _buy("AAPL", 1, 100.0, "2025-05-01"),   # forces year boundary
        ]
        events, _ = calc.calculate(txns, today=date(2025, 5, 1))
        year_end = next(e for e in events if e.event_type == "YEAR_END")
        # predictive CGT should be set (even if 0 due to AEA)
        assert year_end.predictive_sell_all_cgt_gbp is not None

    def test_multi_year_file_emits_multiple_year_ends(self):
        calc = _calculator({"AAPL": 100.0})
        txns = [
            _buy("AAPL", 1, 100.0, "2022-09-01"),
            _buy("AAPL", 1, 100.0, "2023-09-01"),
            _buy("AAPL", 1, 100.0, "2024-09-01"),
        ]
        events, _ = calc.calculate(txns, today=date(2024, 9, 1))
        year_ends = [e for e in events if e.event_type == "YEAR_END"]
        # 2022-2023 and 2023-2024 should generate YEAR_END markers
        assert len(year_ends) == 2

    def test_cgt_applies_annual_exemption_3000(self):
        """£200 gain in 2024-2025 (AEA £3,000) → zero CGT."""
        calc = _calculator({"AAPL": 120.0})
        txns = [
            _buy("AAPL", 10, 100.0, "2024-06-01"),
            _sell("AAPL", 10, 120.0, "2024-08-01"),   # gain = £200
        ]
        events, _ = calc.calculate(txns, today=date(2024, 8, 1))
        sell_event = next(e for e in events if e.event_type == "SELL")
        assert sell_event.realised_tax_gbp == 0.0


# ---------------------------------------------------------------------------
# Event ordering
# ---------------------------------------------------------------------------

class TestSorting:
    def test_events_sorted_chronologically_with_type_tiebreak(self):
        """On the same date: BUY < SELL < DIVIDEND."""
        calc = _calculator({"AAPL": 100.0})
        txns = [
            _dividend("AAPL", 10.0, "2024-08-01"),
            _sell("AAPL", 2, 120.0, "2024-08-01"),
            _buy("AAPL", 10, 100.0, "2024-06-01"),
        ]
        events, _ = calc.calculate(txns, today=date(2024, 8, 1))
        tx_events = [e for e in events if e.event_type in ("BUY", "SELL", "DIVIDEND")]
        types = [e.event_type for e in tx_events]
        buy_idx = types.index("BUY")
        sell_idx = types.index("SELL")
        div_idx = types.index("DIVIDEND")
        assert buy_idx < sell_idx < div_idx


# ---------------------------------------------------------------------------
# CURRENT_DATE marker
# ---------------------------------------------------------------------------

class TestCurrentDate:
    def test_current_date_marker_appended_for_last_year(self):
        calc = _calculator({"AAPL": 100.0})
        txns = [_buy("AAPL", 10, 80.0, "2024-06-01")]
        events, _ = calc.calculate(txns, today=date(2024, 9, 1))
        assert any(e.event_type == "CURRENT_DATE" for e in events)

    def test_no_current_date_for_today_before_last_transaction(self):
        """When today precedes the last transaction, no CURRENT_DATE is emitted."""
        calc = _calculator({"AAPL": 100.0})
        txns = [_buy("AAPL", 10, 80.0, "2024-09-01")]
        events, _ = calc.calculate(txns, today=date(2024, 6, 1))
        assert not any(e.event_type == "CURRENT_DATE" for e in events)
