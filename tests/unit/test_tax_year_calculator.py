"""Unit tests for the tax year calculator."""
import pytest
from datetime import datetime

from src.main.python.services.tax_year_calculator import (
    EnhancedTaxYearCalculator,
    _is_in_tax_year as is_in_tax_year
)
from src.main.python.services.disposal_calculator import UKDisposalCalculator
from src.main.python.services.dividend_processor import DividendProcessor
from src.main.python.services.currency_processor import CurrencyExchangeProcessor
from src.main.python.services.transaction_matcher import UKTransactionMatcher
from src.main.python.models.domain_models import (
    Disposal,
    Security,
    TaxYearSummary
)


class TestEnhancedTaxYearCalculator:
    """Unit tests for the Enhanced Tax Year Calculator."""
    
    @pytest.fixture
    def calculator(self):
        """Create a calculator instance with required dependencies."""
        return EnhancedTaxYearCalculator(
            disposal_calculator=UKDisposalCalculator(),
            dividend_processor=DividendProcessor(),
            currency_processor=CurrencyExchangeProcessor(),
            transaction_matcher=UKTransactionMatcher()
        )
    
    def test_is_in_tax_year(self):
        """Test the is_in_tax_year utility function."""
        # Test dates in 2024-2025 tax year (April 6, 2024 to April 5, 2025)
        assert is_in_tax_year(datetime(2024, 4, 6), "2024-2025")  # First day
        assert is_in_tax_year(datetime(2024, 12, 25), "2024-2025")  # Middle
        assert is_in_tax_year(datetime(2025, 4, 5), "2024-2025")  # Last day
        
        # Test dates outside 2024-2025 tax year
        assert not is_in_tax_year(datetime(2024, 4, 5), "2024-2025")  # One day before
        assert not is_in_tax_year(datetime(2025, 4, 6), "2024-2025")  # One day after
        
        # Test dates in 2023-2024 tax year
        assert is_in_tax_year(datetime(2023, 4, 6), "2023-2024")  # First day
        assert is_in_tax_year(datetime(2024, 4, 5), "2023-2024")  # Last day
    
    def test_tax_year_summary_calculation(self, calculator):
        """Test calculating a tax year summary."""
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create disposals in the 2024-2025 tax year
        disposal1 = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),  # In 2024-2025 tax year
            quantity=100.0,
            proceeds=700.0,
            cost_basis=500.0,
            expenses=10.0,  # Gain: 700 - 500 - 10 = 190
            matching_rule="section-104"
        )
        
        disposal2 = Disposal(
            security=security,
            sell_date=datetime(2024, 12, 15),  # In 2024-2025 tax year
            quantity=50.0,
            proceeds=400.0,
            cost_basis=300.0,
            expenses=5.0,  # Gain: 400 - 300 - 5 = 95
            matching_rule="section-104"
        )
        
        # Create a disposal in a different tax year
        disposal3 = Disposal(
            security=security,
            sell_date=datetime(2023, 12, 15),  # In 2023-2024 tax year
            quantity=200.0,
            proceeds=1500.0,
            cost_basis=1200.0,
            expenses=20.0,  # Gain: 1500 - 1200 - 20 = 280
            matching_rule="section-104"
        )
        
        # Create a disposal with a loss in the 2024-2025 tax year
        disposal4 = Disposal(
            security=security,
            sell_date=datetime(2025, 3, 15),  # In 2024-2025 tax year
            quantity=75.0,
            proceeds=300.0,
            cost_basis=350.0,
            expenses=5.0,  # Loss: 300 - 350 - 5 = -55
            matching_rule="section-104"
        )
        
        # Calculate tax year summary for 2024-2025
        disposals = [disposal1, disposal2, disposal3, disposal4]
        summary = calculator.calculate_tax_year_summary(disposals, "2024-2025")
        
        # Check summary details
        assert summary.tax_year == "2024-2025"
        assert len(summary.disposals) == 3  # Only disposals in 2024-2025
        
        # Check disposals included
        disposal_ids = [d.id for d in summary.disposals]
        assert disposal1.id in disposal_ids
        assert disposal2.id in disposal_ids
        assert disposal3.id not in disposal_ids  # Not in 2024-2025
        assert disposal4.id in disposal_ids
        
        # Check summary calculations
        # Total proceeds: 700 + 400 + 300 = 1400
        assert summary.total_proceeds == 1400.0
        
        # Total gains: 190 + 95 = 285
        assert summary.total_gains == 285.0
        
        # Total losses: 55
        assert summary.total_losses == 55.0
        
        # Net gain: 285 - 55 = 230
        assert summary.net_gain == 230.0
        
        # Annual exemption used: Min(3000, 230) = 230
        assert summary.annual_exemption_used == 230.0
        
        # Taxable gain: 230 - 230 = 0
        assert summary.taxable_gain == 0.0
    
    def test_tax_year_summary_with_large_gain(self):
        """Test tax year summary with a gain exceeding the annual exemption."""
        from unittest.mock import Mock

        calculator = EnhancedTaxYearCalculator(
            disposal_calculator=Mock(),
            dividend_processor=Mock(),
            currency_processor=Mock(),
            transaction_matcher=Mock()
        )

        security = Security(isin="GB00B16KPT44", symbol="HSBA")

        # Create a disposal with a large gain
        disposal = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=15000.0,
            cost_basis=5000.0,
            expenses=500.0,  # Gain: 15000 - 5000 - 500 = 9500
            matching_rule="section-104"
        )

        # Calculate tax year summary for 2024-2025
        summary = calculator.calculate_tax_year_summary([disposal], "2024-2025")

        # The annual exemption for 2024-2025 is £3,000
        expected_annual_exemption = 3000.0
        expected_taxable_gain = 9500.0 - expected_annual_exemption

        assert summary.total_proceeds == 15000.0
        assert summary.total_gains == 9500.0
        assert summary.annual_exemption_used == expected_annual_exemption
        assert summary.taxable_gain == expected_taxable_gain

    def test_tax_year_summary_with_net_loss(self):
        """Test tax year summary with a net loss."""
        from unittest.mock import Mock
        
        calculator = EnhancedTaxYearCalculator(
            disposal_calculator=Mock(),
            dividend_processor=Mock(),
            currency_processor=Mock(),
            transaction_matcher=Mock()
        )

        security = Security(isin="GB00B16KPT44", symbol="HSBA")

        # Create disposals with losses
        disposal1 = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=4500.0,
            cost_basis=5000.0,
            expenses=100.0,  # Loss: 4500 - 5000 - 100 = -600
            matching_rule="section-104"
        )

        disposal2 = Disposal(
            security=security,
            sell_date=datetime(2024, 12, 15),
            quantity=50.0,
            proceeds=2000.0,
            cost_basis=2500.0,
            expenses=50.0,  # Loss: 2000 - 2500 - 50 = -550
            matching_rule="section-104"
        )

        # Calculate tax year summary for 2024-2025
        disposals = [disposal1, disposal2]
        summary = calculator.calculate_tax_year_summary(disposals, "2024-2025")

        assert summary.total_proceeds == 6500.0
        assert summary.total_losses == 1150.0  # Combined losses
        assert summary.annual_exemption_used == 0.0
        assert summary.taxable_gain == 0.0  # Losses are not taxable
