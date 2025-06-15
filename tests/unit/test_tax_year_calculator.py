"""Unit tests for the tax year calculator."""
import pytest
from datetime import datetime

from src.main.python.services.tax_year_calculator import UKTaxYearCalculator, is_in_tax_year
from src.main.python.models.domain_models import (
    Disposal,
    Security,
    TaxYearSummary
)


class TestUKTaxYearCalculator:
    """Unit tests for the UK Tax Year Calculator."""
    
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
    
    def test_tax_year_summary_calculation(self):
        """Test calculating a tax year summary."""
        calculator = UKTaxYearCalculator()
        
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
        calculator = UKTaxYearCalculator()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create a large disposal in the 2024-2025 tax year
        large_disposal = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=1000.0,
            proceeds=10000.0,
            cost_basis=5000.0,
            expenses=100.0,  # Gain: 10000 - 5000 - 100 = 4900
            matching_rule="section-104"
        )
        
        # Calculate tax year summary
        summary = calculator.calculate_tax_year_summary([large_disposal], "2024-2025")
        
        # Check summary details
        assert summary.tax_year == "2024-2025"
        assert summary.total_proceeds == 10000.0
        assert summary.total_gains == 4900.0
        assert summary.total_losses == 0.0
        assert summary.net_gain == 4900.0
        
        # Annual exemption for 2024-2025 is £3,000
        assert summary.annual_exemption_used == 3000.0
        
        # Taxable gain: 4900 - 3000 = 1900
        assert summary.taxable_gain == 1900.0
    
    def test_tax_year_summary_with_net_loss(self):
        """Test tax year summary with a net loss."""
        calculator = UKTaxYearCalculator()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create disposals with net loss
        disposal1 = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=300.0,
            cost_basis=500.0,
            expenses=10.0,  # Loss: 300 - 500 - 10 = -210
            matching_rule="section-104"
        )
        
        disposal2 = Disposal(
            security=security,
            sell_date=datetime(2024, 12, 15),
            quantity=50.0,
            proceeds=400.0,
            cost_basis=300.0,
            expenses=5.0,  # Gain: 400 - 300 - 5 = 95
            matching_rule="section-104"
        )
        
        # Calculate tax year summary
        summary = calculator.calculate_tax_year_summary([disposal1, disposal2], "2024-2025")
        
        # Check summary details
        assert summary.tax_year == "2024-2025"
        assert summary.total_proceeds == 700.0
        assert summary.total_gains == 95.0
        assert summary.total_losses == 210.0
        assert summary.net_gain == -115.0  # Net loss
        
        # With a net loss, no annual exemption is used
        assert summary.annual_exemption_used == 0.0
        assert summary.taxable_gain == 0.0
