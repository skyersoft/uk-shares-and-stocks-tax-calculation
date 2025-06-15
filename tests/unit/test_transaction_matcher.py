"""Unit tests for the transaction matcher service."""
import pytest
from datetime import datetime, timedelta

from src.main.python.services.transaction_matcher import UKTransactionMatcher
from src.main.python.models.domain_models import (
    Transaction,
    TransactionType,
    Security,
    Currency
)


class TestUKTransactionMatcher:
    """Unit tests for the UK Transaction Matcher."""
    
    def test_same_day_matching(self):
        """Test that same-day transactions are matched first."""
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create transactions on the same day
        same_day = datetime(2024, 6, 1, 12, 0)
        
        buy_transaction = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=same_day,
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        sell_transaction = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=same_day,
            quantity=-40.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Add another buy transaction from a previous day
        earlier_buy = Transaction(
            transaction_id="buy2",
            transaction_type=TransactionType.BUY,
            security=security,
            date=same_day - timedelta(days=10),
            quantity=200.0,
            price_per_unit=4.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        transactions = [buy_transaction, sell_transaction, earlier_buy]
        
        # Test the matcher
        matcher = UKTransactionMatcher()
        matched_disposals = matcher.match_disposals(transactions)
        
        # Check results
        assert len(matched_disposals) == 1
        sell, matched_buys = matched_disposals[0]
        
        assert sell.transaction_id == "sell1"
        assert len(matched_buys) == 1
        assert matched_buys[0].transaction_id == "buy1"  # Should match same-day transaction
        assert matched_buys[0].quantity == 40.0  # Should match only what was sold
    
    def test_bed_and_breakfast_rule(self):
        """Test the 30-day (bed & breakfast) rule."""
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create a sell transaction
        sell_date = datetime(2024, 6, 1, 12, 0)
        sell_transaction = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=sell_date,
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Create a buy transaction within 30 days after the sell
        future_buy = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=sell_date + timedelta(days=15),
            quantity=50.0,
            price_per_unit=6.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Create another buy transaction more than 30 days after the sell
        later_buy = Transaction(
            transaction_id="buy2",
            transaction_type=TransactionType.BUY,
            security=security,
            date=sell_date + timedelta(days=35),
            quantity=50.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Create an earlier buy transaction for section 104 holding
        earlier_buy = Transaction(
            transaction_id="buy3",
            transaction_type=TransactionType.BUY,
            security=security,
            date=sell_date - timedelta(days=100),
            quantity=100.0,
            price_per_unit=4.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        transactions = [sell_transaction, future_buy, later_buy, earlier_buy]
        
        # Test the matcher
        matcher = UKTransactionMatcher()
        matched_disposals = matcher.match_disposals(transactions)
        
        # Check results
        assert len(matched_disposals) == 1
        sell, matched_buys = matched_disposals[0]
        
        assert sell.transaction_id == "sell1"
        
        # Should match the future buy for first 50 shares (bed & breakfast rule)
        # And section 104 holding for the other 50 shares
        assert len(matched_buys) == 2
        
        # First match should be the future buy (bed & breakfast)
        assert matched_buys[0].transaction_id == "buy1"
        assert matched_buys[0].quantity == 50.0
        
        # Second match should be from the section 104 holding
        assert matched_buys[1].transaction_id == "buy3"
        assert matched_buys[1].quantity == 50.0
    
    def test_section_104_rule(self):
        """Test the section 104 pooling rule."""
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create earlier buy transactions for section 104 holding
        buy1 = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2023, 1, 15),
            quantity=100.0,
            price_per_unit=4.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        buy2 = Transaction(
            transaction_id="buy2",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2023, 5, 20),
            quantity=150.0,
            price_per_unit=5.0,
            commission=15.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Create a sell transaction
        sell_date = datetime(2024, 6, 1)
        sell_transaction = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=sell_date,
            quantity=-200.0,
            price_per_unit=7.0,
            commission=20.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        transactions = [buy1, buy2, sell_transaction]
        
        # Test the matcher
        matcher = UKTransactionMatcher()
        matched_disposals = matcher.match_disposals(transactions)
        
        # Check results
        assert len(matched_disposals) == 1
        sell, matched_buys = matched_disposals[0]
        
        assert sell.transaction_id == "sell1"
        
        # Should match from section 104 holding
        # The matcher should take shares in order, so first from buy1 then buy2
        assert len(matched_buys) == 2
        assert matched_buys[0].transaction_id == "buy1"
        assert matched_buys[0].quantity == 100.0
        assert matched_buys[1].transaction_id == "buy2"
        assert matched_buys[1].quantity == 100.0  # Only need 100 from second buy
