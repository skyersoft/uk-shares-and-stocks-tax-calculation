"""Unit tests for Hargreaves Lansdown Converter."""
import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, patch

from src.main.python.converters.hargreaves_converter import HargreavesConverter
from src.main.python.models.standard_transaction import TransactionType, StandardTransaction

class TestHargreavesConverter:
    """Tests for Hargreaves Lansdown Converter."""
    
    @pytest.fixture
    def converter(self):
        """Create a converter instance."""
        return HargreavesConverter()
        
    def test_broker_name(self, converter):
        """Test broker name property."""
        assert converter.broker_name == "Hargreaves Lansdown"
        
    def test_detect_confidence_exact_match(self, converter):
        """Test confidence detection with exact header match."""
        header = "Date,Transaction Type,Security,ISIN,Quantity,Price,Value,Account Type"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 1.0
            
    def test_detect_confidence_no_match(self, converter):
        """Test confidence detection with no match."""
        header = "Date,Symbol,Quantity,Price"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 0.0
            
    def test_parse_transaction_type(self, converter):
        """Test transaction type parsing."""
        assert converter._parse_transaction_type("Purchase") == TransactionType.BUY
        assert converter._parse_transaction_type("Bought") == TransactionType.BUY
        assert converter._parse_transaction_type("Sale") == TransactionType.SELL
        assert converter._parse_transaction_type("Sold") == TransactionType.SELL
        assert converter._parse_transaction_type("Dividend") == TransactionType.DIVIDEND
        assert converter._parse_transaction_type("Equalisation") == TransactionType.DIVIDEND
        assert converter._parse_transaction_type("Rights Issue") == TransactionType.RIGHTS_ISSUE
        assert converter._parse_transaction_type("Unknown") is None

    def test_process_row_buy_pounds(self, converter):
        """Test processing a buy transaction row (Price in Pounds)."""
        row = {
            'Date': '01/04/2023',
            'Transaction Type': 'Purchase',
            'Security': 'Vanguard LifeStrategy 80% Equity',
            'ISIN': 'GB00B4PQW151',
            'Quantity': '10.5',
            'Price': '250.00', # Pounds
            'Value': '2625.00', # 10.5 * 250 = 2625
            'Account Type': 'Stocks & Shares ISA'
        }
        
        tx = converter._process_row(row)
        
        assert isinstance(tx, StandardTransaction)
        assert tx.transaction_type == TransactionType.BUY
        assert tx.date == datetime(2023, 4, 1)
        assert tx.symbol == 'GB00B4PQW151'
        assert tx.quantity == Decimal('10.5')
        assert tx.price == Decimal('250.00')
        assert tx.is_isa is True
        assert tx.net_amount == Decimal('2625.00')

    def test_process_row_buy_pence(self, converter):
        """Test processing a buy transaction row (Price in Pence)."""
        row = {
            'Date': '15/05/2023',
            'Transaction Type': 'Purchase',
            'Security': 'Tesco PLC',
            'ISIN': 'GB00BLGZ9862',
            'Quantity': '100',
            'Price': '280.00', # Pence (2.80 GBP)
            'Value': '280.00', # Pounds (100 * 2.80)
            'Account Type': 'Fund & Share Account'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.BUY
        assert tx.quantity == Decimal('100')
        assert tx.price == Decimal('2.80') # Should be converted to pounds
        assert tx.is_isa is False
        assert tx.net_amount == Decimal('280.00')

    def test_process_row_sell(self, converter):
        """Test processing a sell transaction row."""
        row = {
            'Date': '15/05/2023',
            'Transaction Type': 'Sale',
            'Security': 'Tesco PLC',
            'ISIN': 'GB00BLGZ9862',
            'Quantity': '100',
            'Price': '2.80', # Pounds
            'Value': '280.00',
            'Account Type': 'Fund & Share Account'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.SELL
        assert tx.quantity == Decimal('-100') # Negative for sell
        assert tx.price == Decimal('2.80')
        assert tx.net_amount == Decimal('280.00')

    def test_process_row_dividend(self, converter):
        """Test processing a dividend transaction row."""
        row = {
            'Date': '20/06/2023',
            'Transaction Type': 'Dividend',
            'Security': 'Apple Inc',
            'ISIN': 'US0378331005',
            'Quantity': '0',
            'Price': '0',
            'Value': '15.50',
            'Account Type': 'Fund & Share Account'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.DIVIDEND
        assert tx.quantity == Decimal('0')
        assert tx.net_amount == Decimal('15.50')
