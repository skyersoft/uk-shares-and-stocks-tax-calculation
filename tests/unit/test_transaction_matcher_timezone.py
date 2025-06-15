"""Tests for transaction matcher timezone handling."""
import pytest
from datetime import datetime, timedelta

from src.main.python.services.transaction_matcher import UKTransactionMatcher
from src.main.python.models.domain_models import (
    Transaction,
    TransactionType,
    Security,
    Currency
)


class TestTransactionMatcherTimezone:
    """Test timezone handling in transaction matching."""
    
    def test_30_day_rule_with_time_precision(self):
        """Test that 30-day rule works correctly with time precision."""
        matcher = UKTransactionMatcher()
        
        # Create security and currency
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        gbp = Currency(code="GBP", rate_to_base=1.0)
        
        # Sell transaction on day 0 at 15:30
        sell_date = datetime(2024, 6, 15, 15, 30, 0)
        sell_tx = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=sell_date,
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=gbp
        )
        
        # Buy transaction exactly 30 days later at 10:00 (should be within 30-day rule)
        buy_date_within = sell_date + timedelta(days=30, hours=-5, minutes=-30)  # 30 days - 5.5 hours
        buy_tx_within = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=buy_date_within,
            quantity=50.0,
            price_per_unit=5.0,
            commission=5.0,
            taxes=0.0,
            currency=gbp
        )
        
        # Buy transaction exactly 30 days later at 20:00 (should be outside 30-day rule)
        buy_date_outside = sell_date + timedelta(days=30, hours=4, minutes=30)  # 30 days + 4.5 hours
        buy_tx_outside = Transaction(
            transaction_id="buy2",
            transaction_type=TransactionType.BUY,
            security=security,
            date=buy_date_outside,
            quantity=50.0,
            price_per_unit=5.0,
            commission=5.0,
            taxes=0.0,
            currency=gbp
        )
        
        # Test with buy within 30-day window
        transactions_within = [sell_tx, buy_tx_within]
        matched_within = matcher.match_disposals(transactions_within)
        
        assert len(matched_within) == 1
        sell, matched_buys = matched_within[0]
        assert len(matched_buys) == 1
        assert matched_buys[0].transaction_id == "buy1"
        
        print(f"✓ Buy within 30 days matched correctly")
        print(f"  Sell: {sell_date}")
        print(f"  Buy: {buy_date_within}")
        print(f"  Time difference: {buy_date_within - sell_date}")
        
        # Test with buy outside 30-day window
        transactions_outside = [sell_tx, buy_tx_outside]
        matched_outside = matcher.match_disposals(transactions_outside)
        
        # Should not match because buy is after sell and outside 30-day rule
        # The matcher returns empty list when no buys can be matched
        assert len(matched_outside) == 0, "Buy outside 30-day window should not create any disposals"
        
        print(f"✓ Buy outside 30 days not matched")
        print(f"  Sell: {sell_date}")
        print(f"  Buy: {buy_date_outside}")
        print(f"  Time difference: {buy_date_outside - sell_date}")
    
    def test_same_day_rule_with_different_times(self):
        """Test that same-day rule works correctly regardless of time."""
        matcher = UKTransactionMatcher()
        
        # Create security and currency
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        gbp = Currency(code="GBP", rate_to_base=1.0)
        
        # Sell transaction at 15:30
        sell_tx = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=datetime(2024, 6, 15, 15, 30, 0),
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=gbp
        )
        
        # Buy transaction same day at 09:00 (earlier)
        buy_tx_early = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 6, 15, 9, 0, 0),
            quantity=50.0,
            price_per_unit=5.0,
            commission=5.0,
            taxes=0.0,
            currency=gbp
        )
        
        # Buy transaction same day at 23:59 (later)
        buy_tx_late = Transaction(
            transaction_id="buy2",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 6, 15, 23, 59, 0),
            quantity=50.0,
            price_per_unit=5.0,
            commission=5.0,
            taxes=0.0,
            currency=gbp
        )
        
        transactions = [sell_tx, buy_tx_early, buy_tx_late]
        matched = matcher.match_disposals(transactions)
        
        assert len(matched) == 1
        sell, matched_buys = matched[0]
        assert len(matched_buys) == 2  # Both same-day buys should match
        
        # Verify both buys are matched as same-day
        buy_ids = [buy.transaction_id for buy in matched_buys]
        assert "buy1" in buy_ids
        assert "buy2" in buy_ids
        
        print(f"✓ Same-day rule works correctly with different times")
        print(f"  Sell: {sell_tx.date}")
        print(f"  Buy 1: {buy_tx_early.date}")
        print(f"  Buy 2: {buy_tx_late.date}")
    
    def test_30_day_boundary_precision(self):
        """Test the exact 30-day boundary with time precision."""
        matcher = UKTransactionMatcher()
        
        # Create security and currency
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        gbp = Currency(code="GBP", rate_to_base=1.0)
        
        # Sell transaction
        sell_date = datetime(2024, 6, 15, 12, 0, 0)
        sell_tx = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=sell_date,
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=gbp
        )
        
        # Buy exactly 30 days later at the same time
        buy_date_exact = sell_date + timedelta(days=30)
        buy_tx_exact = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=buy_date_exact,
            quantity=100.0,
            price_per_unit=5.0,
            commission=5.0,
            taxes=0.0,
            currency=gbp
        )
        
        # Buy 30 days + 1 second later
        buy_date_over = sell_date + timedelta(days=30, seconds=1)
        buy_tx_over = Transaction(
            transaction_id="buy2",
            transaction_type=TransactionType.BUY,
            security=security,
            date=buy_date_over,
            quantity=100.0,
            price_per_unit=5.0,
            commission=5.0,
            taxes=0.0,
            currency=gbp
        )
        
        # Test exact 30-day boundary
        transactions_exact = [sell_tx, buy_tx_exact]
        matched_exact = matcher.match_disposals(transactions_exact)
        
        assert len(matched_exact) == 1
        sell, matched_buys = matched_exact[0]
        assert len(matched_buys) == 1
        assert matched_buys[0].transaction_id == "buy1"
        
        print(f"✓ Exact 30-day boundary matched correctly")
        print(f"  Time difference: {buy_date_exact - sell_date}")
        
        # Test 30 days + 1 second (should not match under 30-day rule)
        transactions_over = [sell_tx, buy_tx_over]
        matched_over = matcher.match_disposals(transactions_over)
        
        # Should not match because buy is after sell and outside 30-day rule
        assert len(matched_over) == 0, "Buy outside 30-day window should not create any disposals"
        
        print(f"✓ 30 days + 1 second correctly excluded from 30-day rule")
        print(f"  Time difference: {buy_date_over - sell_date}")
