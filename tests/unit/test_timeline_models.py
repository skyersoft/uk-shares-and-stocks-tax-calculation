"""Unit tests for TimelineEvent data model."""
from src.main.python.models.timeline_models import TimelineEvent


def _make_event(**kwargs) -> TimelineEvent:
    defaults = dict(
        event_index=0,
        event_date="2024-06-01",
        tax_year="2024-2025",
        label="BUY AAPL (10 shares @ £100.00)",
        event_type="BUY",
        symbol="AAPL",
        quantity=10.0,
        price_gbp=100.0,
        currency="USD",
        unrealised_value_gbp=1100.0,
        unrealised_gain_loss_gbp=100.0,
        total_cost_basis_gbp=1000.0,
        realised_gain_loss_gbp=0.0,
        realised_tax_gbp=0.0,
        income_gbp=0.0,
        predictive_sell_all_cgt_gbp=None,
    )
    defaults.update(kwargs)
    return TimelineEvent(**defaults)


class TestTimelineEventCreation:
    def test_creates_with_all_fields(self):
        event = _make_event()
        assert event.event_index == 0
        assert event.symbol == "AAPL"
        assert event.event_type == "BUY"

    def test_year_end_event_has_none_symbol(self):
        event = _make_event(
            event_type="YEAR_END",
            symbol=None,
            quantity=None,
            price_gbp=None,
            currency=None,
            predictive_sell_all_cgt_gbp=500.0,
        )
        assert event.symbol is None
        assert event.predictive_sell_all_cgt_gbp == 500.0

    def test_current_date_event_has_predictive_cgt(self):
        event = _make_event(
            event_type="CURRENT_DATE",
            symbol=None,
            quantity=None,
            price_gbp=None,
            currency=None,
            predictive_sell_all_cgt_gbp=720.0,
        )
        assert event.predictive_sell_all_cgt_gbp == 720.0


class TestTimelineEventToDict:
    def test_to_dict_returns_all_keys(self):
        event = _make_event()
        d = event.to_dict()
        expected_keys = {
            "event_index", "event_date", "tax_year", "label", "event_type",
            "symbol", "quantity", "price_gbp", "currency",
            "unrealised_value_gbp", "unrealised_gain_loss_gbp",
            "total_cost_basis_gbp", "realised_gain_loss_gbp",
            "realised_tax_gbp", "income_gbp", "predictive_sell_all_cgt_gbp",
        }
        assert set(d.keys()) == expected_keys

    def test_to_dict_rounds_floats_to_2dp(self):
        event = _make_event(unrealised_value_gbp=1234.5678)
        d = event.to_dict()
        assert d["unrealised_value_gbp"] == 1234.57

    def test_to_dict_predictive_none_is_none(self):
        event = _make_event(predictive_sell_all_cgt_gbp=None)
        assert event.to_dict()["predictive_sell_all_cgt_gbp"] is None

    def test_to_dict_predictive_rounds_when_set(self):
        event = _make_event(
            event_type="YEAR_END",
            symbol=None,
            quantity=None,
            price_gbp=None,
            currency=None,
            predictive_sell_all_cgt_gbp=123.456,
        )
        assert event.to_dict()["predictive_sell_all_cgt_gbp"] == 123.46
