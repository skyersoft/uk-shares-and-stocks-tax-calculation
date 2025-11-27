
import pytest
from datetime import datetime, timedelta
from src.main.python.models.domain_models import (
    Transaction,
    TransactionType,
    Security,
    Currency,
    SharePool
)
from src.main.python.services.share_pool_manager import SharePoolManager
from src.main.python.services.transaction_matcher import UKTransactionMatcher

class TestMissingScenarios:
    """Test cases for scenarios identified as missing or needing verification."""

    def test_share_restructuring_split(self):
        """
        Test Example 6: Share Restructuring (1 for 10 restructuring).
        The calculator should rebase trades or adjust the pool.
        """
        manager = SharePoolManager()
        security = Security(isin="GB00B16KPT44", symbol="SKC")
        gbp = Currency(code="GBP", rate_to_base=1.0)

        # Buy 1000 shares before split
        buy1 = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2006, 1, 1),
            quantity=1000.0,
            price_per_unit=1.0, # Cost £1000
            commission=0.0,
            taxes=0.0,
            currency=gbp
        )
        manager.process_transaction(buy1)

        # Split 1 for 10 on 2006-05-25
        # This means for every 10 shares held, you get 1 share? Or 1 share becomes 10?
        # "1 for 10 restructuring" usually means consolidation (1 new for 10 old) or split (1 old becomes 10 new)?
        # The example text says "rebases ALL trades... such that the number of shares value is consistent".
        # Let's assume it's a consolidation (1 for 10) based on "restructuring" often implying that, 
        # or a split (10 for 1). 
        # If it's a 1 for 10 consolidation: 1000 shares -> 100 shares. Cost basis stays £1000.
        # If it's a 10 for 1 split: 1000 shares -> 10000 shares. Cost basis stays £1000.
        
        # Let's try to use TransactionType.SPLIT
        # We implemented logic where quantity represents the ratio.
        # "1 for 10 restructuring" usually means 1 new share for 10 old shares (consolidation).
        # Ratio = 1/10 = 0.1
        split_tx = Transaction(
            transaction_id="split1",
            transaction_type=TransactionType.SPLIT,
            security=security,
            date=datetime(2006, 5, 25),
            quantity=0.1, # Ratio for 1-for-10 consolidation
            price_per_unit=0.0,
            commission=0.0,
            taxes=0.0,
            currency=gbp
        )
        
        manager.process_transaction(split_tx)

        pool = manager.get_pool(security)
        
        # 1000 shares * 0.1 = 100 shares
        assert pool.quantity == 100.0, f"Pool quantity should be 100.0 after 1-for-10 split, got {pool.quantity}"
        # Cost basis should remain £1000
        assert pool.cost_basis == 1000.0, f"Cost basis should remain 1000.0, got {pool.cost_basis}"

    def test_transfer_to_spouse(self):
        """
        Test Example 8: Transfer to Spouse.
        No gain/loss, spouse acquires at original cost.
        """
        matcher = UKTransactionMatcher()
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        gbp = Currency(code="GBP", rate_to_base=1.0)

        # Buy 100 shares
        buy1 = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 1),
            quantity=100.0,
            price_per_unit=10.0, # Cost £1000
            commission=0.0,
            taxes=0.0,
            currency=gbp
        )

        # Transfer 50 shares to spouse
        transfer_tx = Transaction(
            transaction_id="transfer1",
            transaction_type=TransactionType.TRANSFER_OUT,
            security=security,
            date=datetime(2024, 6, 1),
            quantity=-50.0, # Negative for outgoing
            price_per_unit=0.0, 
            commission=0.0,
            taxes=0.0,
            currency=gbp
        )

        transactions = [buy1, transfer_tx]
        
        disposals = matcher.match_disposals(transactions)
        
        # Verify pool quantity is reduced (we can't check pool directly from matcher easily, 
        # but if it matched, it means it processed it)
        
        assert len(disposals) > 0, "Transfer to spouse should generate a disposal event"
        
        sell_tx, matches = disposals[0]
        assert sell_tx.transaction_id == "transfer1"
        assert len(matches) == 1
        assert matches[0].transaction_id == "buy1"
        assert matches[0].quantity == 50.0
