"""Unit tests for market_price_service.py"""
import pytest
from src.main.python.services.market_price_service import (
    MockMarketPriceService,
    MarketPriceServiceInterface,
)


@pytest.fixture
def mock_svc():
    return MockMarketPriceService(
        prices={"AAPL": 175.0, "MSFT": 380.0, "TSCO.L": 300.0},
        fx_rates={"USD": 0.79, "EUR": 0.86},
    )


class TestMockMarketPriceService:
    """Tests for MockMarketPriceService — no network calls."""

    def test_implements_interface(self, mock_svc):
        assert isinstance(mock_svc, MarketPriceServiceInterface)

    def test_get_known_price(self, mock_svc):
        assert mock_svc.get_current_price("AAPL", "USD") == 175.0

    def test_get_another_known_price(self, mock_svc):
        assert mock_svc.get_current_price("MSFT", "USD") == 380.0

    def test_unknown_symbol_returns_none(self, mock_svc):
        assert mock_svc.get_current_price("UNKNOWN", "USD") is None

    def test_gbp_fx_rate_is_one(self, mock_svc):
        assert mock_svc.get_fx_rate_to_gbp("GBP") == 1.0

    def test_usd_fx_rate(self, mock_svc):
        assert mock_svc.get_fx_rate_to_gbp("USD") == 0.79

    def test_unknown_currency_defaults_to_one(self, mock_svc):
        assert mock_svc.get_fx_rate_to_gbp("XYZ") == 1.0

    def test_case_insensitive_currency(self, mock_svc):
        assert mock_svc.get_fx_rate_to_gbp("usd") == 0.79

    def test_set_price_at_runtime(self, mock_svc):
        mock_svc.set_price("NVDA", 500.0)
        assert mock_svc.get_current_price("NVDA", "USD") == 500.0

    def test_set_fx_rate_at_runtime(self, mock_svc):
        mock_svc.set_fx_rate("JPY", 0.0052)
        assert mock_svc.get_fx_rate_to_gbp("JPY") == 0.0052
