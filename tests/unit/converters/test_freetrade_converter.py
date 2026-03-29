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
        # Matches actual Freetrade sample: Date,Type,Symbol,Quantity,Price,Fees,Currency,Name
        header = "Date,Type,Symbol,Quantity,Price,Fees,Currency,Name"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            # No "Total" and no "Freetrade" in header, so returns 0.8
            assert confidence == 0.8
            
    def test_detect_confidence_partial_match(self, converter):
        """Test confidence detection with partial header match."""
        # Missing required columns (Quantity, Price, Currency) so returns 0.0
        header = "Date,Type,Symbol,SomeOtherColumn"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 0.0

    def test_detect_confidence_with_total(self, converter):
        """Test confidence detection when Total column is present."""
        header = "Date,Type,Symbol,Quantity,Price,Total,Currency,Fees"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 0.9

    def test_detect_confidence_with_freetrade_in_header(self, converter):
        """Test confidence detection when Freetrade appears in header."""
        header = "Date,Type,Symbol,Quantity,Price,Currency,Freetrade"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 1.0
            
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
            'Symbol': 'AAPL',
            'Name': 'Apple Inc',
            'Quantity': '10',
            'Price': '150.00',
            'Currency': 'USD',
            'Fees': '0.00'
        }
        
        tx = converter._process_row(row)
        
        assert isinstance(tx, StandardTransaction)
        assert tx.transaction_type == TransactionType.BUY
        assert tx.date == datetime(2023, 1, 15)
        assert tx.symbol == 'AAPL'
        assert tx.quantity == Decimal('10')
        assert tx.price == Decimal('150.00')
        assert tx.transaction_currency == 'USD'

    def test_process_row_sell(self, converter):
        """Test processing a sell transaction row."""
        row = {
            'Date': '2023-02-20',
            'Type': 'SELL',
            'Symbol': 'AAPL',
            'Name': 'Apple Inc',
            'Quantity': '5',
            'Price': '160.00',
            'Currency': 'USD',
            'Fees': '0.00'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.SELL
        assert tx.quantity == Decimal('-5') # Negative for sell
        assert tx.price == Decimal('160.00')

    def test_process_row_dividend(self, converter):
        """Test processing a dividend transaction row."""
        row = {
            'Date': '2023-04-05',
            'Type': 'DIVIDEND',
            'Symbol': 'AAPL',
            'Name': 'Apple Inc',
            'Quantity': '0',
            'Price': '0',
            'Currency': 'USD',
            'Fees': '0.00'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.DIVIDEND
        assert tx.quantity == Decimal('0')

    def test_process_row_buy_with_nonzero_fees(self, converter):
        """Regression test: Fees column must be read even when 'Fee' column is absent.
        
        Bug: row.get('Fee', '0') returns '0' which is truthy, so 'or' short-circuits
        and row.get('Fees', ...) is never evaluated, resulting in commission=0.
        Fix: row.get('Fee') returns None (falsy) when column absent, allowing fallback.
        """
        row = {
            'Date': '2024-01-15',
            'Type': 'BUY',
            'Symbol': 'AAPL',
            'Name': 'Apple Inc',
            'Quantity': '10',
            'Price': '150.00',
            'Currency': 'USD',
            'Fees': '1.50'   # Only 'Fees' column present, no 'Fee' column
        }

        tx = converter._process_row(row)

        assert tx is not None
        assert tx.commission == Decimal('1.50'), (
            "Commission must be read from 'Fees' column when 'Fee' column is absent"
        )

    def test_process_row_sell_commission_deducted(self, converter):
        """Sell transaction with fee: commission must be captured for allowable cost deduction."""
        row = {
            'Date': '2024-11-15',
            'Type': 'SELL',
            'Symbol': 'AAPL',
            'Name': 'Apple Inc',
            'Quantity': '5',
            'Price': '175.25',
            'Currency': 'USD',
            'Fees': '1.50'
        }

        tx = converter._process_row(row)

        assert tx is not None
        assert tx.commission == Decimal('1.50')
        assert tx.quantity == Decimal('-5')  # Sell: negative

    def test_process_row_dividend_gross_amount_is_quantity_times_price(self, converter):
        """Regression test: dividend gross_amount must be quantity * price_per_share.

        Bug: DividendProcessor uses price_per_unit as total amount (QFX convention).
        Freetrade CSV stores per-share price, so gross_amount must be pre-calculated
        as quantity * price so the mapper can use it correctly.
        """
        row = {
            'Date': '2025-04-09',
            'Type': 'DIVIDEND',
            'Symbol': 'AAPL',
            'Name': 'Apple Inc',
            'Quantity': '10',     # shares held
            'Price': '0.24',      # dividend per share
            'Currency': 'USD',
            'Fees': '0.00'
        }

        tx = converter._process_row(row)

        assert tx is not None
        assert tx.transaction_type == TransactionType.DIVIDEND
        assert tx.quantity == Decimal('10')
        assert tx.price == Decimal('0.24')
        # gross_amount must be 10 * 0.24 = 2.40
        assert tx.gross_amount == Decimal('2.40'), (
            "Dividend gross_amount must be quantity * price_per_share = 10 * 0.24 = 2.40"
        )
