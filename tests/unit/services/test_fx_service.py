"""
Unit tests for FX Service.
"""

import pytest
from decimal import Decimal
from datetime import datetime
from src.main.python.services.fx_service import HMRCExchangeRateService


class TestHMRCExchangeRateService:
    """Test HMRC FX Service."""
    
    @pytest.fixture
    def service(self):
        return HMRCExchangeRateService()
    
    def test_same_currency(self, service):
        """Should return 1.0 for same currency."""
        rate = service.get_rate("GBP", "GBP", datetime(2024, 1, 1))
        assert rate == Decimal('1.0')
    
    def test_usd_to_gbp_uses_hmrc_monthly_rate_of_the_trade_month(self, service):
        """HMRC Sep 2025 publishes 1.3473 USD per GBP, so 1 USD = 1/1.3473 GBP."""
        rate = service.get_rate("USD", "GBP", datetime(2025, 9, 17))
        assert rate == (Decimal(1) / Decimal("1.3473")).quantize(Decimal("0.0000000001"))

    def test_gbp_to_usd_is_the_published_rate(self, service):
        assert service.get_rate("GBP", "USD", datetime(2025, 9, 1)) == Decimal("1.3473")

    def test_month_boundaries_use_their_own_month(self, service):
        sep = service.get_rate("EUR", "GBP", datetime(2025, 9, 30, 23, 59))
        octo = service.get_rate("EUR", "GBP", datetime(2025, 10, 1))
        assert sep != octo

    def test_rate_for_reports_the_month_used(self, service):
        rate, month = service.rate_for("USD", datetime(2025, 9, 17))
        assert month == "2025-09" and rate > 0

    def test_month_without_published_rate_is_none_not_a_guess(self, service):
        assert service.get_rate("USD", "GBP", datetime(2019, 6, 1)) is None
        assert service.rate_for("USD", datetime(2019, 6, 1)) is None

    def test_unknown_currency_is_none(self, service):
        assert service.get_rate("XXX", "GBP", datetime(2025, 9, 1)) is None

    def test_cross_rates_are_not_invented(self, service):
        assert service.get_rate("USD", "EUR", datetime(2025, 9, 1)) is None
