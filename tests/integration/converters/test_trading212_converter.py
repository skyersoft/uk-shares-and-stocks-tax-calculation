"""Integration tests for Trading 212 Converter."""
import pytest
from pathlib import Path
from decimal import Decimal
from datetime import datetime

from src.main.python.converters.trading212_converter import Trading212Converter
from src.main.python.models.standard_transaction import TransactionType, StandardTransaction

class TestTrading212ConverterIntegration:
    """Integration tests for Trading 212 Converter."""
    
    @pytest.fixture
    def sample_file(self):
        """Path to sample Trading 212 CSV file."""
        return Path("tests/data/trading212/export.csv").absolute()
        
    def test_convert_sample_file(self, sample_file):
        """Test converting the sample file."""
        converter = Trading212Converter()
        
        # Verify confidence
        confidence = converter.detect_confidence(str(sample_file))
        assert confidence >= 0.8
        
        # Convert
        transactions = converter.convert(str(sample_file))
        
        # Verify transactions
        # We expect 4 transactions: Buy, Sell, Dividend, Buy, Interest (5 total)
        # Deposit is ignored.
        assert len(transactions) == 5
        
        # 1. Market Buy AAPL
        tx1 = transactions[0]
        assert tx1.symbol == "AAPL"
        assert tx1.transaction_type == TransactionType.BUY
        assert tx1.quantity == Decimal("10")
        assert tx1.price == Decimal("150.00")
        assert tx1.transaction_currency == "USD"
        assert tx1.fx_rate_to_base == Decimal("0.82")
        assert tx1.currency_conversion_fee == Decimal("6.15")
        
        # 2. Market Sell AAPL
        tx2 = transactions[1]
        assert tx2.symbol == "AAPL"
        assert tx2.transaction_type == TransactionType.SELL
        assert tx2.quantity == Decimal("-5")
        assert tx2.price == Decimal("160.00")
        
        # 3. Dividend AAPL
        tx3 = transactions[2]
        assert tx3.symbol == "AAPL"
        assert tx3.transaction_type == TransactionType.DIVIDEND
        assert tx3.gross_amount == Decimal("2.25") # 1.91 + 0.34
        assert tx3.withholding_tax == Decimal("0.34")
        
        # 4. Limit Buy DGE
        tx4 = transactions[3]
        assert tx4.symbol == "DGE"
        assert tx4.transaction_type == TransactionType.BUY
        assert tx4.quantity == Decimal("20")
        assert tx4.price == Decimal("35.00")
        assert tx4.transaction_currency == "GBP"
        assert tx4.fx_rate_to_base == Decimal("1.00")
        
        # 5. Interest
        tx5 = transactions[4]
        assert tx5.symbol == "CASH"
        assert tx5.transaction_type == TransactionType.INTEREST
        assert tx5.transaction_currency == "GBP"
