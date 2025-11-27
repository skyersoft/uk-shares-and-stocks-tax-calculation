"""Unit tests for Freetrade Converter."""
import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, patch

from src.main.python.converters.freetrade_converter import FreetradeConverter
from src.main.python.models.standard_transaction import TransactionType, StandardTransaction

class TestFreetradeConverter:
    """Tests for Freetrade Converter."""
    
    @pytest.fixture
    def converter(self):
        """Create a converter instance."""
        return FreetradeConverter()
        
    def test_broker_name(self, converter):
        """Test broker name property."""
        assert converter.broker_name == "Freetrade"
        
    def test_detect_confidence_exact_match(self, converter):
        """Test confidence detection with exact header match."""
        header = "Date,Type,Ticker,Name,Quantity,Price,Total,Currency,Fee"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 1.0
            
    def test_detect_confidence_partial_match(self, converter):
        """Test confidence detection with partial header match."""
        header = "Date,Type,Ticker,SomeOtherColumn"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 0.5
            
    def test_parse_transaction_type(self, converter):
        """Test transaction type parsing."""
        assert converter._parse_transaction_type("BUY") == TransactionType.BUY
        assert converter._parse_transaction_type("SELL") == TransactionType.SELL
        assert converter._parse_transaction_type("DIVIDEND") == TransactionType.DIVIDEND
        assert converter._parse_transaction_type("INTEREST") == TransactionType.INTEREST
        assert converter._parse_transaction_type("UNKNOWN") is None

    def test_process_row_buy(self, converter):
        """Test processing a buy transaction row."""
        row = {
            'Date': '2023-01-15',
            'Type': 'BUY',
            'Ticker': 'AAPL',
            'Name': 'Apple Inc',
            'Quantity': '10',
            'Price': '150.00',
            'Total': '1500.00',
            'Currency': 'USD',
            'Fee': '0.00'
        }
        
        tx = converter._process_row(row)
        
        assert isinstance(tx, StandardTransaction)
        assert tx.transaction_type == TransactionType.BUY
        assert tx.date == datetime(2023, 1, 15)
        assert tx.symbol == 'AAPL'
        assert tx.quantity == Decimal('10')
        assert tx.price == Decimal('150.00')
        assert tx.transaction_currency == 'USD'
        assert tx.gross_amount == Decimal('1500.00')

    def test_process_row_sell(self, converter):
        """Test processing a sell transaction row."""
        row = {
            'Date': '2023-02-20',
            'Type': 'SELL',
            'Ticker': 'AAPL',
            'Name': 'Apple Inc',
            'Quantity': '5',
            'Price': '160.00',
            'Total': '800.00',
            'Currency': 'USD',
            'Fee': '0.00'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.SELL
        assert tx.quantity == Decimal('-5') # Negative for sell
        assert tx.price == Decimal('160.00')
        assert tx.gross_amount == Decimal('800.00')

    def test_process_row_dividend(self, converter):
        """Test processing a dividend transaction row."""
        row = {
            'Date': '2023-04-05',
            'Type': 'DIVIDEND',
            'Ticker': 'AAPL',
            'Name': 'Apple Inc',
            'Quantity': '0',
            'Price': '0',
            'Total': '2.50',
            'Currency': 'USD',
            'Fee': '0.00'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.DIVIDEND
        assert tx.quantity == Decimal('0')
        assert tx.gross_amount == Decimal('2.50')
