"""
Integration tests for the CapitalGainsCalculator with CSV input.
"""
import os
import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch

from src.main.python.calculator import CapitalGainsTaxCalculator
from tests.fixtures.csv_samples import (
    get_sample_path,
    BUY_TRANSACTIONS,
    SELL_TRANSACTIONS,
    MIXED_TRANSACTIONS,
    BASIC_TRANSACTIONS
)


class TestCalculatorWithCsv:
    """Tests for the CapitalGainsCalculator with CSV input."""
    
    def setup_method(self):
        """Set up the test."""
        # Create a calculator with CsvParser for CSV file type support
        from src.main.python.parsers.csv_parser import CsvParser
        self.calculator = CapitalGainsTaxCalculator(
            file_parser=CsvParser(base_currency="GBP")
        )
        self.temp_dir = tempfile.mkdtemp()
        self.output_path = os.path.join(self.temp_dir, "test_output")
        
    def teardown_method(self):
        """Clean up after the test."""
        # Clean up any generated files
        for ext in ['csv', 'json']:
            if os.path.exists(f"{self.output_path}.{ext}"):
                os.remove(f"{self.output_path}.{ext}")
        os.rmdir(self.temp_dir)
    
    def test_calculate_with_buy_transactions_csv(self):
        """Test calculation with buy transactions from CSV."""
        # Use the buy_transactions.csv sample
        input_file = get_sample_path(BUY_TRANSACTIONS)
        
        # Run calculation
        result = self.calculator.calculate(
            file_path=input_file,
            tax_year="2024-2025",
            output_path=self.output_path,
            report_format="csv",
            file_type="csv"
        )
        
        # Check that the result contains expected data
        assert result is not None, "Result should not be None"
        assert hasattr(result, 'disposals'), "Result should have disposals attribute"
        assert hasattr(result, 'tax_year'), "Result should have tax_year attribute"
        
        # No disposals should be found since this file only has buy transactions
        assert len(result.disposals) == 0, "No disposals should be found in buy-only transactions"
        
        # Output file should be created
        assert os.path.exists(f"{self.output_path}.csv"), "Output file should be created"
    
    def test_calculate_with_mixed_transactions_csv(self):
        """Test calculation with mixed transactions from CSV."""
        # Use the mixed_transactions.csv sample which has both buys and sells
        input_file = get_sample_path(MIXED_TRANSACTIONS)
        
        # Run calculation
        result = self.calculator.calculate(
            file_path=input_file,
            tax_year="2024-2025",
            output_path=self.output_path,
            report_format="csv",
            file_type="csv"
        )
        
        # Check that the result contains expected data
        assert result is not None, "Result should not be None"
        assert hasattr(result, 'disposals'), "Result should have disposals attribute"
        assert hasattr(result, 'tax_year'), "Result should have tax_year attribute"
        
        # There should be disposals since this file has both buys and sells
        assert len(result.disposals) > 0, "Disposals should be found in mixed transactions"
        
        # Output file should be created
        assert os.path.exists(f"{self.output_path}.csv"), "Output file should be created"
    
    def test_calculate_with_json_format_csv_input(self):
        """Test calculation with CSV input and JSON output format."""
        # Use the mixed_transactions.csv sample
        input_file = get_sample_path(MIXED_TRANSACTIONS)
        
        # Use a calculator with JSONReportGenerator
        from src.main.python.services.report_generator import JSONReportGenerator
        json_calculator = CapitalGainsTaxCalculator(
            file_parser=self.calculator.file_parser,
            report_generator=JSONReportGenerator()
        )
        
        # Run calculation with JSON output format
        result = json_calculator.calculate(
            file_path=input_file,
            tax_year="2024-2025",
            output_path=self.output_path,
            report_format="json",
            file_type="csv"
        )
        
        # Check that the result contains expected data
        assert result is not None, "Result should not be None"
        
        # Output file should be created with json extension
        assert os.path.exists(f"{self.output_path}.json"), "JSON output file should be created"
    
    def test_calculate_with_explicit_file_type(self):
        """Test calculation with explicit file_type parameter for CSV."""
        # Use the basic_transactions.csv sample
        input_file = get_sample_path(BASIC_TRANSACTIONS)
        
        # Run calculation with explicit CSV file type
        result = self.calculator.calculate(
            file_path=input_file,
            tax_year="2024-2025",
            output_path=self.output_path,
            report_format="csv",
            file_type="csv"  # Explicitly specify CSV
        )
        
        # Check that the result contains expected data
        assert result is not None, "Result should not be None"
        
        # There should be disposals in the basic transactions file
        assert len(result.disposals) > 0, "Disposals should be found in basic transactions"
