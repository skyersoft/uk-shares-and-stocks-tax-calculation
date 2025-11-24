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
    
    def test_mock_rates(self, service):
        """Should return mock rates for known pairs."""
        rate = service.get_rate("USD", "GBP", datetime(2024, 1, 1))
        assert rate == Decimal('0.79')
        
        rate = service.get_rate("EUR", "GBP", datetime(2024, 1, 1))
        assert rate == Decimal('0.86')
    
    def test_unknown_pair(self, service):
        """Should return None for unknown pair."""
        rate = service.get_rate("JPY", "GBP", datetime(2024, 1, 1))
        assert rate is None
