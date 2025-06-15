"""Unit tests for the main capital gains calculator."""
import pytest
import tempfile
import os
from unittest.mock import Mock, patch
from datetime import datetime

from src.main.python.calculator import CapitalGainsTaxCalculator
from src.main.python.models.domain_models import (
    Transaction,
    TransactionType,
    Security,
    Currency,
    Disposal,
    TaxYearSummary
)


class TestCapitalGainsTaxCalculator:
    """Unit tests for the Capital Gains Tax Calculator."""
    
    def test_calculator_initialization_with_defaults(self):
        """Test calculator initialization with default components."""
        calculator = CapitalGainsTaxCalculator()
        
        # Check that all components are initialized
        assert calculator.file_parser is not None
        assert calculator.transaction_matcher is not None
        assert calculator.disposal_calculator is not None
        assert calculator.tax_year_calculator is not None
        assert calculator.report_generator is not None
        assert calculator.base_currency == "GBP"
    
    def test_calculator_initialization_with_custom_components(self):
        """Test calculator initialization with custom components."""
        # Create mock components
        mock_parser = Mock()
        mock_matcher = Mock()
        mock_disposal_calc = Mock()
        mock_tax_calc = Mock()
        mock_report_gen = Mock()
        
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
            transaction_matcher=mock_matcher,
            disposal_calculator=mock_disposal_calc,
            tax_year_calculator=mock_tax_calc,
            report_generator=mock_report_gen,
            base_currency="USD"
        )
        
        # Check that custom components are used
        assert calculator.file_parser is mock_parser
        assert calculator.transaction_matcher is mock_matcher
        assert calculator.disposal_calculator is mock_disposal_calc
        assert calculator.tax_year_calculator is mock_tax_calc
        assert calculator.report_generator is mock_report_gen
        assert calculator.base_currency == "USD"
    
    def test_calculate_orchestration(self):
        """Test the main calculate method orchestration."""
        # Create mock components
        mock_parser = Mock()
        mock_matcher = Mock()
        mock_disposal_calc = Mock()
        mock_tax_calc = Mock()
        mock_report_gen = Mock()
        
        # Set up mock data
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        gbp = Currency(code="GBP", rate_to_base=1.0)
        
        # Mock transactions
        buy_tx = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 15),
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=gbp
        )
        
        sell_tx = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=datetime(2024, 6, 15),
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=gbp
        )
        
        transactions = [buy_tx, sell_tx]
        
        # Mock disposal
        disposal = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=690.0,
            cost_basis=510.0,
            expenses=0.0,
            matching_rule="section-104"
        )
        
        # Mock tax year summary
        summary = TaxYearSummary(tax_year="2024-2025")
        summary.add_disposal(disposal)
        summary.annual_exemption_used = 180.0
        summary.taxable_gain = 0.0
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_matcher.match_disposals.return_value = [(sell_tx, [buy_tx])]
        mock_disposal_calc.calculate_disposal.return_value = disposal
        mock_tax_calc.calculate_tax_year_summary.return_value = summary
        
        # Create calculator with mocks
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
            transaction_matcher=mock_matcher,
            disposal_calculator=mock_disposal_calc,
            tax_year_calculator=mock_tax_calc,
            report_generator=mock_report_gen
        )
        
        # Test the calculation
        with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Mock the CSVReportGenerator since the calculator creates a new one based on format
            with patch('src.main.python.calculator.CSVReportGenerator') as mock_csv_gen_class:
                mock_csv_gen = Mock()
                mock_csv_gen_class.return_value = mock_csv_gen
                
                result = calculator.calculate(
                    file_path=temp_path,
                    tax_year="2024-2025",
                    output_path="test_report",
                    report_format="csv"
                )
                
                # Verify all components were called correctly
                mock_parser.parse.assert_called_once_with(temp_path)
                mock_matcher.match_disposals.assert_called_once_with(transactions)
                mock_disposal_calc.calculate_disposal.assert_called_once_with(sell_tx, [buy_tx])
                mock_tax_calc.calculate_tax_year_summary.assert_called_once_with(
                    disposals=[disposal],
                    tax_year="2024-2025"
                )
                
                # Verify CSV generator was created and used
                mock_csv_gen_class.assert_called_once()
                mock_csv_gen.generate_report.assert_called_once_with(
                    tax_year_summary=summary,
                    output_path="test_report"
                )
                
                # Verify result
                assert result is summary
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_calculate_with_json_format(self):
        """Test calculation with JSON report format."""
        # Create mock components
        mock_parser = Mock()
        mock_matcher = Mock()
        mock_disposal_calc = Mock()
        mock_tax_calc = Mock()
        
        # Set up minimal mock data with at least one transaction
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        gbp = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 15),
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=gbp
        )
        
        transactions = [transaction]
        matched_disposals = []
        summary = TaxYearSummary(tax_year="2024-2025")
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_matcher.match_disposals.return_value = matched_disposals
        mock_tax_calc.calculate_tax_year_summary.return_value = summary
        
        # Create calculator with mocks (no report generator mock to test format selection)
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
            transaction_matcher=mock_matcher,
            disposal_calculator=mock_disposal_calc,
            tax_year_calculator=mock_tax_calc
        )
        
        # Mock the JSONReportGenerator
        with patch('src.main.python.calculator.JSONReportGenerator') as mock_json_gen_class:
            mock_json_gen = Mock()
            mock_json_gen_class.return_value = mock_json_gen
            
            with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
                temp_path = temp_file.name
            
            try:
                calculator.calculate(
                    file_path=temp_path,
                    tax_year="2024-2025",
                    output_path="test_report",
                    report_format="json"
                )
                
                # Verify JSON generator was created and used
                mock_json_gen_class.assert_called_once()
                mock_json_gen.generate_report.assert_called_once_with(
                    tax_year_summary=summary,
                    output_path="test_report"
                )
                
            finally:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
    
    def test_calculate_with_invalid_tax_year(self):
        """Test calculation with invalid tax year raises error."""
        calculator = CapitalGainsTaxCalculator()
        
        with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            with pytest.raises(ValueError, match="Invalid tax year"):
                calculator.calculate(
                    file_path=temp_path,
                    tax_year="invalid-year",
                    output_path="test_report"
                )
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_calculate_multiple_disposals(self):
        """Test calculation with multiple disposals."""
        # Create mock components
        mock_parser = Mock()
        mock_matcher = Mock()
        mock_disposal_calc = Mock()
        mock_tax_calc = Mock()
        mock_report_gen = Mock()
        
        # Set up mock data with multiple disposals
        security1 = Security(isin="GB00B16KPT44", symbol="HSBA")
        security2 = Security(isin="US0378331005", symbol="AAPL")
        gbp = Currency(code="GBP", rate_to_base=1.0)
        
        # Mock transactions
        transactions = [
            Transaction(
                transaction_id="buy1",
                transaction_type=TransactionType.BUY,
                security=security1,
                date=datetime(2024, 1, 15),
                quantity=100.0,
                price_per_unit=5.0,
                commission=10.0,
                taxes=0.0,
                currency=gbp
            ),
            Transaction(
                transaction_id="sell1",
                transaction_type=TransactionType.SELL,
                security=security1,
                date=datetime(2024, 6, 15),
                quantity=-50.0,
                price_per_unit=7.0,
                commission=5.0,
                taxes=0.0,
                currency=gbp
            ),
            Transaction(
                transaction_id="buy2",
                transaction_type=TransactionType.BUY,
                security=security2,
                date=datetime(2024, 2, 15),
                quantity=200.0,
                price_per_unit=10.0,
                commission=20.0,
                taxes=0.0,
                currency=gbp
            ),
            Transaction(
                transaction_id="sell2",
                transaction_type=TransactionType.SELL,
                security=security2,
                date=datetime(2024, 7, 15),
                quantity=-100.0,
                price_per_unit=12.0,
                commission=10.0,
                taxes=0.0,
                currency=gbp
            )
        ]
        
        # Mock matched disposals
        matched_disposals = [
            (transactions[1], [transactions[0]]),  # sell1 matched with buy1
            (transactions[3], [transactions[2]])   # sell2 matched with buy2
        ]
        
        # Mock disposals
        disposal1 = Disposal(
            security=security1,
            sell_date=datetime(2024, 6, 15),
            quantity=50.0,
            proceeds=345.0,
            cost_basis=255.0,
            expenses=0.0,
            matching_rule="section-104"
        )
        
        disposal2 = Disposal(
            security=security2,
            sell_date=datetime(2024, 7, 15),
            quantity=100.0,
            proceeds=1190.0,
            cost_basis=1010.0,
            expenses=0.0,
            matching_rule="section-104"
        )
        
        # Mock tax year summary
        summary = TaxYearSummary(tax_year="2024-2025")
        summary.add_disposal(disposal1)
        summary.add_disposal(disposal2)
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_matcher.match_disposals.return_value = matched_disposals
        mock_disposal_calc.calculate_disposal.side_effect = [disposal1, disposal2]
        mock_tax_calc.calculate_tax_year_summary.return_value = summary
        
        # Create calculator with mocks
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
            transaction_matcher=mock_matcher,
            disposal_calculator=mock_disposal_calc,
            tax_year_calculator=mock_tax_calc,
            report_generator=mock_report_gen
        )
        
        # Test the calculation
        with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            result = calculator.calculate(
                file_path=temp_path,
                tax_year="2024-2025",
                output_path="test_report"
            )
            
            # Verify disposal calculator was called twice
            assert mock_disposal_calc.calculate_disposal.call_count == 2
            
            # Verify tax year calculator was called with both disposals
            mock_tax_calc.calculate_tax_year_summary.assert_called_once_with(
                disposals=[disposal1, disposal2],
                tax_year="2024-2025"
            )
            
            # Verify result
            assert result is summary
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_calculate_no_disposals(self):
        """Test calculation when no disposals are found."""
        # Create mock components
        mock_parser = Mock()
        mock_matcher = Mock()
        mock_disposal_calc = Mock()
        mock_tax_calc = Mock()
        mock_report_gen = Mock()
        
        # Set up mock data with no matched disposals
        transactions = [
            Transaction(
                transaction_id="buy1",
                transaction_type=TransactionType.BUY,
                security=Security(isin="GB00B16KPT44", symbol="HSBA"),
                date=datetime(2024, 1, 15),
                quantity=100.0,
                price_per_unit=5.0,
                commission=10.0,
                taxes=0.0,
                currency=Currency(code="GBP", rate_to_base=1.0)
            )
        ]
        
        # No matched disposals (only buys, no sells)
        matched_disposals = []
        
        # Empty tax year summary
        summary = TaxYearSummary(tax_year="2024-2025")
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_matcher.match_disposals.return_value = matched_disposals
        mock_tax_calc.calculate_tax_year_summary.return_value = summary
        
        # Create calculator with mocks
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
            transaction_matcher=mock_matcher,
            disposal_calculator=mock_disposal_calc,
            tax_year_calculator=mock_tax_calc,
            report_generator=mock_report_gen
        )
        
        # Test the calculation
        with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            result = calculator.calculate(
                file_path=temp_path,
                tax_year="2024-2025",
                output_path="test_report"
            )
            
            # Verify disposal calculator was not called
            mock_disposal_calc.calculate_disposal.assert_not_called()
            
            # Verify tax year calculator was called with empty disposals list
            mock_tax_calc.calculate_tax_year_summary.assert_called_once_with(
                disposals=[],
                tax_year="2024-2025"
            )
            
            # Verify result
            assert result is summary
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_calculate_logging(self):
        """Test that calculation logs appropriate messages."""
        # Create mock components
        mock_parser = Mock()
        mock_matcher = Mock()
        mock_disposal_calc = Mock()
        mock_tax_calc = Mock()
        mock_report_gen = Mock()
        
        # Set up minimal mock data with at least one transaction
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        gbp = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 15),
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=gbp
        )
        
        transactions = [transaction]
        matched_disposals = []
        summary = TaxYearSummary(tax_year="2024-2025")
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_matcher.match_disposals.return_value = matched_disposals
        mock_tax_calc.calculate_tax_year_summary.return_value = summary
        
        # Create calculator with mocks
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
            transaction_matcher=mock_matcher,
            disposal_calculator=mock_disposal_calc,
            tax_year_calculator=mock_tax_calc,
            report_generator=mock_report_gen
        )
        
        # Test the calculation with logging
        with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            with patch.object(calculator.logger, 'info') as mock_log:
                calculator.calculate(
                    file_path=temp_path,
                    tax_year="2024-2025",
                    output_path="test_report"
                )
                
                # Verify logging calls
                assert mock_log.call_count >= 2
                mock_log.assert_any_call(f"Calculating capital gains for 2024-2025 from {temp_path}")
                mock_log.assert_any_call("Parsed 1 transactions")
                mock_log.assert_any_call("Matched 0 disposals")
                
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
