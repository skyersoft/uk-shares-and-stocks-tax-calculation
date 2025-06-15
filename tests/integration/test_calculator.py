"""Integration tests for the capital gains calculator."""
import os
import pytest
import tempfile
from datetime import datetime
from unittest.mock import patch

from src.main.python.calculator import CapitalGainsTaxCalculator
from src.main.python.models.domain_models import (
    Transaction,
    TransactionType,
    Security,
    Currency,
    Disposal,
    TaxYearSummary
)
from src.main.python.parsers.qfx_parser import QfxParser


class TestCapitalGainsCalculator:
    """Integration tests for the Capital Gains Tax Calculator."""
    
    @pytest.fixture
    def sample_qfx_path(self):
        """Fixture to provide the path to a sample QFX file."""
        # Using the provided sample file
        return os.path.join(
            "/Users/myuser/development/ibkr-tax-calculator",
            "data",
            "U11075163_20240408_20250404.qfx"
        )
    
    @pytest.fixture
    def mock_transactions(self):
        """Fixture to provide mock transactions for testing."""
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create a simple buy and sell scenario
        buy_transaction = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 6, 1),  # In the 2024-2025 tax year
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        sell_transaction = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=datetime(2024, 12, 1),  # In the 2024-2025 tax year
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        return [buy_transaction, sell_transaction]
    
    def test_qfx_parser_loads_file(self, sample_qfx_path):
        """Test that the QFX parser can load a file."""
        parser = QfxParser()
        transactions = parser.parse(sample_qfx_path)
        
        # Verify we got some transactions
        assert len(transactions) > 0
        
        # Verify we have both buys and sells
        buy_count = sum(1 for tx in transactions if tx.transaction_type == TransactionType.BUY)
        sell_count = sum(1 for tx in transactions if tx.transaction_type == TransactionType.SELL)
        
        assert buy_count > 0, "Should have some buy transactions"
        assert sell_count > 0, "Should have some sell transactions"
    
    def test_end_to_end_calculation_with_mocks(self, mock_transactions):
        """Test the end-to-end calculation process with mock data."""
        # Create a temporary QFX file for the test
        with tempfile.NamedTemporaryFile(suffix=".qfx", delete=False) as temp_qfx:
            temp_qfx.write(b"dummy content")
            temp_qfx_path = temp_qfx.name
        
        try:
            # Set up mocks
            mock_parser = patch("src.main.python.calculator.QfxParser").start()
            mock_parser.return_value.parse.return_value = mock_transactions
            
            # Create a temporary output file
            with tempfile.NamedTemporaryFile(suffix=".csv") as temp_file:
                # Create calculator
                calculator = CapitalGainsTaxCalculator()
                
                # Calculate for 2024-2025 tax year
                summary = calculator.calculate(
                    file_path=temp_qfx_path,
                    tax_year="2024-2025",
                    output_path=temp_file.name,
                    report_format="csv"
                )
        finally:
            # Clean up the temporary file
            os.unlink(temp_qfx_path)
            
            # Check the summary
            assert summary is not None
            assert summary.tax_year == "2024-2025"
            assert len(summary.disposals) == 1
            
            # Check the disposal
            disposal = summary.disposals[0]
            assert disposal.security.isin == "GB00B16KPT44"
            assert disposal.quantity == 100.0
            assert disposal.proceeds == 690.0  # 7.0 * 100 - 10.0 = 690.0
            assert disposal.cost_basis == 500.0  # 5.0 * 100 = 500.0
            assert disposal.expenses == 10.0
            assert disposal.gain_or_loss == 180.0  # 690 - 500 - 10 = 180
            
            # Check the summary calculations
            assert summary.total_proceeds == 690.0
            assert summary.total_gains == 180.0
            assert summary.total_losses == 0.0
            assert summary.net_gain == 180.0
            
            # Annual exemption (2024-2025: £3,000)
            assert summary.annual_exemption_used == 180.0  # Full gain is within exemption
            assert summary.taxable_gain == 0.0  # No taxable gain as it's under the exemption
        
        # Clean up the mock
        patch.stopall()
