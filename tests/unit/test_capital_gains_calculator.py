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
    TaxYearSummary,
    ComprehensiveTaxSummary,
    DividendSummary,
    CurrencyGainLossSummary
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
        
        # Mock comprehensive tax summary
        capital_gains = TaxYearSummary(tax_year="2024-2025")
        dividend_income = DividendSummary(tax_year="2024-2025")
        currency_gains = CurrencyGainLossSummary(tax_year="2024-2025")
        
        comprehensive_summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=capital_gains,
            dividend_income=dividend_income,
            currency_gains=currency_gains
        )
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_tax_calc.calculate_comprehensive_tax_summary.return_value = comprehensive_summary
        
        # Create calculator with mocks
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
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
                output_path="test_report",
                report_format="csv"
            )
            
            # Verify components were called correctly
            mock_parser.parse.assert_called_once_with(temp_path)
            mock_tax_calc.calculate_comprehensive_tax_summary.assert_called_once_with(
                transactions=transactions,
                tax_year="2024-2025"
            )
            
            # Verify injected report generator was used
            mock_report_gen.generate_report.assert_called_once_with(
                tax_year_summary=comprehensive_summary,
                output_path="test_report"
            )
            
            # Verify result
            assert result is comprehensive_summary
            assert isinstance(result, ComprehensiveTaxSummary)
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_calculate_with_json_format(self):
        """Test calculation with JSON report format."""
        # Create mock components
        mock_parser = Mock()
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
        
        # Mock comprehensive tax summary
        capital_gains = TaxYearSummary(tax_year="2024-2025")
        dividend_income = DividendSummary(tax_year="2024-2025")
        currency_gains = CurrencyGainLossSummary(tax_year="2024-2025")
        
        comprehensive_summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=capital_gains,
            dividend_income=dividend_income,
            currency_gains=currency_gains
        )
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_tax_calc.calculate_comprehensive_tax_summary.return_value = comprehensive_summary
        
        # Create calculator with mocks including report generator
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
            tax_year_calculator=mock_tax_calc,
            report_generator=mock_report_gen
        )
        
        with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            calculator.calculate(
                file_path=temp_path,
                tax_year="2024-2025",
                output_path="test_report",
                report_format="json"
            )
            
            # Verify injected report generator was used (regardless of format)
            mock_report_gen.generate_report.assert_called_once_with(
                tax_year_summary=comprehensive_summary,
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
        
        # Mock comprehensive tax summary with multiple disposals
        capital_gains = TaxYearSummary(tax_year="2024-2025")
        dividend_income = DividendSummary(tax_year="2024-2025")
        currency_gains = CurrencyGainLossSummary(tax_year="2024-2025")
        
        comprehensive_summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=capital_gains,
            dividend_income=dividend_income,
            currency_gains=currency_gains
        )
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_tax_calc.calculate_comprehensive_tax_summary.return_value = comprehensive_summary
        
        # Create calculator with mocks
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
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
            
            # Verify components were called correctly
            mock_parser.parse.assert_called_once_with(temp_path)
            mock_tax_calc.calculate_comprehensive_tax_summary.assert_called_once_with(
                transactions=transactions,
                tax_year="2024-2025"
            )
            
            # Verify result
            assert result is comprehensive_summary
            assert isinstance(result, ComprehensiveTaxSummary)
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_calculate_no_disposals(self):
        """Test calculation when no disposals are found."""
        # Create mock components
        mock_parser = Mock()
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
        
        # Mock comprehensive tax summary with no disposals
        capital_gains = TaxYearSummary(tax_year="2024-2025")
        dividend_income = DividendSummary(tax_year="2024-2025")
        currency_gains = CurrencyGainLossSummary(tax_year="2024-2025")
        
        comprehensive_summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=capital_gains,
            dividend_income=dividend_income,
            currency_gains=currency_gains
        )
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_tax_calc.calculate_comprehensive_tax_summary.return_value = comprehensive_summary
        
        # Create calculator with mocks
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
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
            
            # Verify components were called correctly
            mock_parser.parse.assert_called_once_with(temp_path)
            mock_tax_calc.calculate_comprehensive_tax_summary.assert_called_once_with(
                transactions=transactions,
                tax_year="2024-2025"
            )
            
            # Verify result
            assert result is comprehensive_summary
            assert isinstance(result, ComprehensiveTaxSummary)
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_calculate_logging(self):
        """Test that calculation logs appropriate messages."""
        # Create mock components
        mock_parser = Mock()
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
        
        # Mock comprehensive tax summary
        capital_gains = TaxYearSummary(tax_year="2024-2025")
        dividend_income = DividendSummary(tax_year="2024-2025")
        currency_gains = CurrencyGainLossSummary(tax_year="2024-2025")
        
        comprehensive_summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=capital_gains,
            dividend_income=dividend_income,
            currency_gains=currency_gains
        )
        
        # Configure mocks
        mock_parser.parse.return_value = transactions
        mock_tax_calc.calculate_comprehensive_tax_summary.return_value = comprehensive_summary
        
        # Create calculator with mocks
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_parser,
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
                
                # Verify logging calls - updated for new architecture
                assert mock_log.call_count >= 2
                mock_log.assert_any_call(f"Calculating comprehensive tax for 2024-2025 from {temp_path} (file type: qfx)")
                mock_log.assert_any_call("Parsed 1 transactions")
                
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_calculate_with_csv_file_type(self):
        """Test calculation with CSV file type parameter."""
        # Create mock parser that supports CSV files
        mock_csv_parser = Mock()
        mock_csv_parser.supports_file_type.return_value = True
        mock_csv_parser.parse.return_value = [
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
        
        # Create mock components
        mock_tax_calc = Mock()
        mock_report_gen = Mock()
        
        # Mock comprehensive tax summary
        capital_gains = TaxYearSummary(tax_year="2024-2025")
        dividend_income = DividendSummary(tax_year="2024-2025")
        currency_gains = CurrencyGainLossSummary(tax_year="2024-2025")
        
        comprehensive_summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=capital_gains,
            dividend_income=dividend_income,
            currency_gains=currency_gains
        )
        
        # Configure mocks
        mock_tax_calc.calculate_comprehensive_tax_summary.return_value = comprehensive_summary
        
        # Create calculator with CSV parser
        calculator = CapitalGainsTaxCalculator(
            file_parser=mock_csv_parser,
            tax_year_calculator=mock_tax_calc,
            report_generator=mock_report_gen
        )
        
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Test with CSV file type - should use the injected parser
            result = calculator.calculate(
                file_path=temp_path,
                tax_year="2024-2025",
                output_path="test_report",
                file_type="csv"
            )
            
            # Verify the injected parser was used
            mock_csv_parser.supports_file_type.assert_called_with("csv")
            mock_csv_parser.parse.assert_called_once_with(temp_path)
            
            # Verify other components were called
            mock_tax_calc.calculate_comprehensive_tax_summary.assert_called_once()
            mock_report_gen.generate_report.assert_called_once()
            
            # Verify result
            assert isinstance(result, ComprehensiveTaxSummary)
            assert result.tax_year == "2024-2025"
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
