"""Unit tests for Fidelity Converter."""
import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, patch

from src.main.python.converters.fidelity_converter import FidelityConverter
from src.main.python.models.standard_transaction import TransactionType, StandardTransaction

class TestFidelityConverter:
    """Tests for Fidelity Converter."""
    
    @pytest.fixture
    def converter(self):
        """Create a converter instance."""
        return FidelityConverter()
        
    def test_broker_name(self, converter):
        """Test broker name property."""
        assert converter.broker_name == "Fidelity"
        
    def test_detect_confidence_exact_match(self, converter):
        """Test confidence detection with exact header match."""
        header = "Trade Date,Settlement Date,Action,Symbol,Security Description,Quantity,Price,Amount,Commission,Fees,Settlement Currency"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 1.0
            
    def test_detect_confidence_partial_match(self, converter):
        """Test confidence detection with partial header match."""
        header = "Trade Date,Settlement Date,Action,SomeOtherColumn"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 0.5
            
    def test_parse_transaction_type(self, converter):
        """Test transaction type parsing."""
        assert converter._parse_transaction_type("YOU BOUGHT") == TransactionType.BUY
        assert converter._parse_transaction_type("BOUGHT") == TransactionType.BUY
        assert converter._parse_transaction_type("YOU SOLD") == TransactionType.SELL
        assert converter._parse_transaction_type("SOLD") == TransactionType.SELL
        assert converter._parse_transaction_type("DIVIDEND RECEIVED") == TransactionType.DIVIDEND
        assert converter._parse_transaction_type("INTEREST") == TransactionType.INTEREST
        assert converter._parse_transaction_type("UNKNOWN") is None

    def test_process_row_buy(self, converter):
        """Test processing a buy transaction row."""
        row = {
            'Trade Date': '15/01/2023',
            'Settlement Date': '17/01/2023',
            'Action': 'YOU BOUGHT',
            'Symbol': 'AAPL',
            'Security Description': 'Apple Inc',
            'Quantity': '10',
            'Price': '150.00',
            'Amount': '-1500.00',
            'Commission': '10.00',
            'Fees': '0.50',
            'Settlement Currency': 'USD'
        }
        
        tx = converter._process_row(row)
        
        assert isinstance(tx, StandardTransaction)
        assert tx.transaction_type == TransactionType.BUY
        assert tx.date == datetime(2023, 1, 17) # Uses Settlement Date
        assert tx.symbol == 'AAPL'
        assert tx.quantity == Decimal('10')
        assert tx.price == Decimal('150.00')
        assert tx.transaction_currency == 'USD'
        assert tx.gross_amount == Decimal('1500.00')
        assert tx.commission == Decimal('10.00')
        assert tx.other_fees == Decimal('0.50')

    def test_process_row_sell(self, converter):
        """Test processing a sell transaction row."""
        row = {
            'Trade Date': '20/02/2023',
            'Settlement Date': '22/02/2023',
            'Action': 'YOU SOLD',
            'Symbol': 'AAPL',
            'Security Description': 'Apple Inc',
            'Quantity': '5',
            'Price': '160.00',
            'Amount': '800.00',
            'Commission': '10.00',
            'Fees': '0.50',
            'Settlement Currency': 'USD'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.SELL
        assert tx.quantity == Decimal('-5') # Negative for sell
        assert tx.price == Decimal('160.00')
        assert tx.gross_amount == Decimal('800.00')

    def test_process_row_dividend(self, converter):
        """Test processing a dividend transaction row."""
        row = {
            'Trade Date': '05/04/2023',
            'Settlement Date': '05/04/2023',
            'Action': 'DIVIDEND RECEIVED',
            'Symbol': 'AAPL',
            'Security Description': 'Apple Inc',
            'Quantity': '0',
            'Price': '0',
            'Amount': '2.50',
            'Commission': '0.00',
            'Fees': '0.00',
            'Settlement Currency': 'USD'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.DIVIDEND
        assert tx.quantity == Decimal('0')
        assert tx.gross_amount == Decimal('2.50')
