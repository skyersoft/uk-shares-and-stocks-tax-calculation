"""
Unit tests for the CSV parser interface.
"""
import pytest
from unittest.mock import patch, MagicMock
import os
from datetime import datetime

from src.main.python.parsers.csv_parser import CsvParser
from src.main.python.models.domain_models import Transaction, TransactionType, Security, Currency
from tests.fixtures.csv_samples import get_sample_path, BASIC_TRANSACTIONS


class TestCsvParserInterface:
    """Tests for the CSV parser interface."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.parser = CsvParser(base_currency="GBP")
        self.sample_path = get_sample_path(BASIC_TRANSACTIONS)
    
    def test_interface_inheritance(self):
        """Test that CsvParser implements FileParserInterface."""
        from src.main.python.interfaces.calculator_interfaces import FileParserInterface
        assert isinstance(self.parser, FileParserInterface)
        
    def test_parse_method_exists(self):
        """Test that parse method exists and has correct signature."""
        assert hasattr(self.parser, 'parse')
        from inspect import signature
        sig = signature(self.parser.parse)
        assert len(sig.parameters) == 1
        assert 'file_path' in sig.parameters
        
    def test_parse_method_returns_list_of_transactions(self):
        """Test that parse method returns a list of Transactions."""
        # Create a mock file with a single valid row
        mock_rows = [{
            'Buy/Sell': 'BUY',
            'TradeDate': '01/01/2024',
            'Symbol': 'AAPL',
            'Description': 'APPLE INC',
            'SecurityID': 'US0378331005',
            'SecurityIDType': 'ISIN',
            'Quantity': '10',
            'TradePrice': '150.0',
            'CurrencyPrimary': 'USD',
            'FXRateToBase': '0.75',
            'IBCommission': '1.0',
            'Taxes': '0'
        }]
        
        # Mock the csv.DictReader to return our mock data
        with patch('csv.DictReader', return_value=mock_rows):
            with patch('builtins.open', MagicMock()):
                result = self.parser.parse('dummy_path.csv')
                
                assert isinstance(result, list)
                assert len(result) == 1
                assert isinstance(result[0], Transaction)
                
    def test_initialization_with_base_currency(self):
        """Test initialization with custom base currency."""
        parser = CsvParser(base_currency="USD")
        assert parser.base_currency == "USD"
        
        default_parser = CsvParser()
        assert default_parser.base_currency == "GBP"
    
    def test_parse_handles_file_not_found(self):
        """Test that parse method handles file not found errors gracefully."""
        result = self.parser.parse('nonexistent_file.csv')
        assert isinstance(result, list)
        assert len(result) == 0  # Should return empty list, not raise exception
