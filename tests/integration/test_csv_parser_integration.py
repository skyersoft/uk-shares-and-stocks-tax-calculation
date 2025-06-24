"""
Integration tests for the CSV parser with real CSV files.
"""
import pytest
import os
from datetime import datetime

from src.main.python.parsers.csv_parser import CsvParser
from src.main.python.models.domain_models import Transaction, TransactionType, Security
from tests.fixtures.csv_samples import get_sample_path, BASIC_TRANSACTIONS


class TestCsvParserWithRealFiles:
    """Integration tests for CSV parser with real CSV files."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.parser = CsvParser(base_currency="GBP")
        self.sample_path = get_sample_path(BASIC_TRANSACTIONS)
    
    def test_parse_real_csv_file(self):
        """Test parsing a real CSV file."""
        transactions = self.parser.parse(self.sample_path)
        
        # Basic validation of the parsing results
        assert isinstance(transactions, list)
        assert len(transactions) > 0
        
        # Verify all items are transactions
        for tx in transactions:
            assert isinstance(tx, Transaction)
        
        # Check for both buy and sell transactions
        buy_transactions = [tx for tx in transactions if tx.transaction_type == TransactionType.BUY]
        sell_transactions = [tx for tx in transactions if tx.transaction_type == TransactionType.SELL]
        
        assert len(buy_transactions) > 0, "Should have at least one buy transaction"
        assert len(sell_transactions) > 0, "Should have at least one sell transaction"
    
    def test_transaction_details(self):
        """Test that transaction details are correctly parsed."""
        transactions = self.parser.parse(self.sample_path)
        
        # Find a specific transaction to check details
        # Look for AMZN (Amazon) BUY transaction
        amzn_buy = next((tx for tx in transactions 
                         if tx.security.symbol == "AMZN" 
                         and tx.transaction_type == TransactionType.BUY), None)
        
        assert amzn_buy is not None, "Should find AMZN buy transaction"
        
        # Verify specific details from the sample file
        assert amzn_buy.quantity == 30.0
        assert amzn_buy.price_per_unit == 140.0
        assert amzn_buy.commission == 6.5
        assert amzn_buy.currency.code == "USD"
        assert round(amzn_buy.currency.rate_to_base, 4) == 0.7900
        
    def test_security_identification(self):
        """Test that securities are correctly identified."""
        transactions = self.parser.parse(self.sample_path)
        
        # Get unique securities
        securities = {tx.security.symbol: tx.security for tx in transactions}
        
        # Check for specific securities we know should be in the sample
        assert "AMZN" in securities
        assert "AAPL" in securities
        assert "MSFT" in securities
        assert "GOOGL" in securities
        
        # Check security details
        amzn = securities["AMZN"]
        assert amzn.isin == "US0231351067"
        assert amzn.security_type == "ISIN"
