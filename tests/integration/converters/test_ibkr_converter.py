"""
Integration tests for IBKR Converter.

These tests verify the end-to-end conversion process using real sample CSV files.
"""

import pytest
from pathlib import Path
from decimal import Decimal
from datetime import datetime

from src.main.python.converters.ibkr_converter import IBKRConverter
from src.main.python.models.standard_transaction import (
    TransactionType,
    AssetClass
)


class TestIBKRConverterIntegration:
    """Integration tests for IBKRConverter."""
    
    @pytest.fixture
    def converter(self):
        return IBKRConverter()
    
    @pytest.fixture
    def data_dir(self):
        return Path("tests/data/ibkr")
    
    def test_convert_flex_query(self, converter, data_dir):
        """Should correctly convert standard Flex Query CSV."""
        file_path = data_dir / "flex_query.csv"
        transactions = converter.convert(str(file_path), base_currency="GBP")
        
        assert len(transactions) == 4
        
        # Transaction 1: Buy AAPL
        tx1 = transactions[0]
        assert tx1.symbol == "AAPL"
        assert tx1.transaction_type == TransactionType.BUY
        assert tx1.quantity == Decimal('10')
        assert tx1.price == Decimal('150.00')
        assert tx1.commission == Decimal('1.00')
        assert tx1.cost_basis == Decimal('1501.00')
        assert tx1.asset_class == AssetClass.STOCK
        
        # Transaction 2: Sell AAPL
        tx2 = transactions[1]
        assert tx2.symbol == "AAPL"
        assert tx2.transaction_type == TransactionType.SELL
        assert tx2.quantity == Decimal('-5')
        assert tx2.price == Decimal('160.00')
        assert tx2.realized_pl == Decimal('49.50')
        
        # Transaction 4: Option
        tx4 = transactions[3]
        assert tx4.symbol == "TSLA  240621C00200000"
        assert tx4.asset_class == AssetClass.OPTION
        assert tx4.quantity == Decimal('1')
    
    def test_convert_sharesight_format(self, converter, data_dir):
        """Should correctly convert Sharesight-compatible CSV."""
        file_path = data_dir / "sharesight.csv"
        transactions = converter.convert(str(file_path), base_currency="GBP")
        
        assert len(transactions) == 4
        
        # Transaction 1: Buy AAPL
        tx1 = transactions[0]
        assert tx1.symbol == "AAPL"
        assert tx1.transaction_type == TransactionType.BUY
        assert tx1.quantity == Decimal('10')
        assert tx1.price == Decimal('150.00')
        
        # Transaction 2: Sell AAPL (Quantity should be negative)
        tx2 = transactions[1]
        assert tx2.symbol == "AAPL"
        assert tx2.transaction_type == TransactionType.SELL
        assert tx2.quantity == Decimal('-5')  # Converter should flip sign
        
        # Transaction 4: Dividend
        tx4 = transactions[3]
        assert tx4.symbol == "GOOGL"
        assert tx4.transaction_type == TransactionType.DIVIDEND
    
    def test_detect_confidence(self, converter, data_dir):
        """Should correctly detect IBKR files."""
        flex_path = data_dir / "flex_query.csv"
        sharesight_path = data_dir / "sharesight.csv"
        
        assert converter.detect_confidence(str(flex_path)) >= 0.7
        assert converter.detect_confidence(str(sharesight_path)) >= 0.7
