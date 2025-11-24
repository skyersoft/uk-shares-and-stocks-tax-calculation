"""
Unit tests for IBKR Converter.

Test Coverage Goals:
- 100% coverage of IBKRConverter
- Test all date formats
- Test all transaction types
- Test asset class mapping
- Test error handling
"""

import pytest
from decimal import Decimal
from datetime import datetime
from src.main.python.converters.ibkr_converter import IBKRConverter
from src.main.python.models.standard_transaction import (
    TransactionType,
    AssetClass
)


class TestIBKRConverterUnit:
    """Unit tests for IBKRConverter methods."""
    
    @pytest.fixture
    def converter(self):
        return IBKRConverter()
    
    def test_broker_name(self, converter):
        """Should return correct broker name."""
        assert converter.broker_name == "Interactive Brokers"
    
    def test_parse_date_formats(self, converter):
        """Should parse various date formats."""
        # YYYY-MM-DD
        assert converter._parse_date("2024-01-15") == datetime(2024, 1, 15)
        # YYYYMMDD
        assert converter._parse_date("20240115") == datetime(2024, 1, 15)
        # DD/MM/YYYY
        assert converter._parse_date("15/01/2024") == datetime(2024, 1, 15)
        # MM/DD/YYYY
        assert converter._parse_date("01/15/2024") == datetime(2024, 1, 15)
        # Invalid
        assert converter._parse_date("invalid") is None
    
    def test_parse_transaction_type_code(self, converter):
        """Should parse transaction types from Code column."""
        assert converter._parse_transaction_type({'Code': 'O'}) == TransactionType.BUY
        assert converter._parse_transaction_type({'Code': 'C'}) == TransactionType.SELL
        assert converter._parse_transaction_type({'Code': 'A'}) == TransactionType.BUY
        assert converter._parse_transaction_type({'Code': 'Ex'}) == TransactionType.SELL
    
    def test_parse_transaction_type_buy_sell(self, converter):
        """Should parse transaction types from Buy/Sell column."""
        assert converter._parse_transaction_type({'Buy/Sell': 'BUY'}) == TransactionType.BUY
        assert converter._parse_transaction_type({'Buy/Sell': 'SELL'}) == TransactionType.SELL
        assert converter._parse_transaction_type({'Buy/Sell': 'DIV'}) == TransactionType.DIVIDEND
        assert converter._parse_transaction_type({'Buy/Sell': 'INT'}) == TransactionType.INTEREST
    
    def test_parse_transaction_type_fallback(self, converter):
        """Should fallback to quantity if no code/type."""
        assert converter._parse_transaction_type({'Quantity': '10'}) == TransactionType.BUY
        assert converter._parse_transaction_type({'Quantity': '-10'}) == TransactionType.SELL
    
    def test_parse_asset_class(self, converter):
        """Should map asset classes correctly."""
        assert converter._parse_asset_class('STK') == AssetClass.STOCK
        assert converter._parse_asset_class('OPT') == AssetClass.OPTION
        assert converter._parse_asset_class('FUT') == AssetClass.FUTURE
        assert converter._parse_asset_class('CASH') == AssetClass.FOREX
        assert converter._parse_asset_class('UNKNOWN') == AssetClass.STOCK  # Default
    
    def test_process_row_valid(self, converter):
        """Should process a valid row."""
        row = {
            'Symbol': 'AAPL',
            'TradeDate': '20240115',
            'Quantity': '10',
            'TradePrice': '150.00',
            'IBCommission': '-1.00',
            'Code': 'O',
            'Currency': 'USD'
        }
        tx = converter._process_row(row, "GBP")
        
        assert tx is not None
        assert tx.symbol == 'AAPL'
        assert tx.quantity == Decimal('10')
        assert tx.price == Decimal('150.00')
        assert tx.commission == Decimal('1.00')
        assert tx.transaction_type == TransactionType.BUY
    
    def test_process_row_missing_date(self, converter):
        """Should return None if date is missing."""
        row = {'Symbol': 'AAPL', 'Quantity': '10'}
        assert converter._process_row(row, "GBP") is None
    
    def test_process_row_invalid_date(self, converter):
        """Should return None if date is invalid."""
        row = {'Symbol': 'AAPL', 'TradeDate': 'invalid', 'Quantity': '10'}
        assert converter._process_row(row, "GBP") is None

    def test_detect_confidence_valid_header(self, converter, tmp_path):
        """Should return 1.0 confidence for valid IBKR header."""
        file_path = tmp_path / "ibkr.csv"
        with open(file_path, 'w') as f:
            f.write("ClientAccountID,AssetClass,Symbol,TradeDate,Quantity,TradePrice,IBCommission,Code\n")
        
        assert converter.detect_confidence(str(file_path)) == 1.0

    def test_detect_confidence_partial_header(self, converter, tmp_path):
        """Should return 0.7 confidence for partial match."""
        file_path = tmp_path / "partial.csv"
        with open(file_path, 'w') as f:
            # TradeDate is an IBKR-specific column in our list
            f.write("Symbol,Quantity,TradeDate\n")
        
        assert converter.detect_confidence(str(file_path)) == 0.7

    def test_detect_confidence_no_match(self, converter, tmp_path):
        """Should return 0.0 confidence for no match."""
        file_path = tmp_path / "other.csv"
        with open(file_path, 'w') as f:
            f.write("Date,Description,Amount\n")
        
        assert converter.detect_confidence(str(file_path)) == 0.0

    def test_convert_valid_file(self, converter, tmp_path):
        """Should convert valid file."""
        file_path = tmp_path / "trades.csv"
        with open(file_path, 'w') as f:
            f.write("Symbol,TradeDate,Quantity,TradePrice,IBCommission,Code,Currency\n")
            f.write("AAPL,20240115,10,150.00,-1.00,O,USD\n")
        
        txs = converter.convert(str(file_path), "GBP")
        assert len(txs) == 1
        assert txs[0].symbol == "AAPL"

    def test_convert_skips_metadata(self, converter, tmp_path):
        """Should skip metadata lines before header."""
        file_path = tmp_path / "metadata.csv"
        with open(file_path, 'w') as f:
            f.write("Statement,Header,Field,Value\n")
            f.write("Some,Metadata,Here,...\n")
            f.write("Symbol,TradeDate,Quantity,TradePrice,IBCommission,Code,Currency\n")
            f.write("AAPL,20240115,10,150.00,-1.00,O,USD\n")
        
        txs = converter.convert(str(file_path), "GBP")
        assert len(txs) == 1
        assert txs[0].symbol == "AAPL"

    def test_convert_handles_errors(self, converter, tmp_path):
        """Should skip rows that cause errors."""
        file_path = tmp_path / "errors.csv"
        with open(file_path, 'w') as f:
            f.write("Symbol,TradeDate,Quantity,TradePrice,IBCommission,Code,Currency\n")
            f.write("AAPL,INVALID_DATE,10,150.00,-1.00,O,USD\n") # Invalid date
            f.write("MSFT,20240115,10,150.00,-1.00,O,USD\n") # Valid
        
        txs = converter.convert(str(file_path), "GBP")
        assert len(txs) == 1
        assert txs[0].symbol == "MSFT"
