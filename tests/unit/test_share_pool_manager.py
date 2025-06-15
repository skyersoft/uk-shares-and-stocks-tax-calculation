"""Unit tests for the share pool manager."""
import pytest

from src.main.python.services.share_pool_manager import SharePoolManager
from src.main.python.models.domain_models import (
    Transaction,
    TransactionType,
    Security,
    Currency,
    SharePool
)


class TestSharePoolManager:
    """Unit tests for the Share Pool Manager."""
    
    def test_add_shares_to_pool(self):
        """Test adding shares to a pool."""
        # Create a manager
        manager = SharePoolManager()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create a buy transaction
        buy_transaction = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=None,  # Not needed for this test
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Process the transaction
        manager.process_transaction(buy_transaction)
        
        # Check the pool
        pool = manager.get_pool(security)
        assert pool is not None
        assert pool.quantity == 100.0
        assert pool.cost_basis == 510.0  # 100 * 5.0 + 10.0 = 510.0
        assert pool.average_cost == 5.1  # 510.0 / 100.0 = 5.1
    
    def test_add_multiple_buys_to_pool(self):
        """Test adding multiple buy transactions to a pool."""
        # Create a manager
        manager = SharePoolManager()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create buy transactions
        buy1 = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=None,  # Not needed for this test
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        buy2 = Transaction(
            transaction_id="buy2",
            transaction_type=TransactionType.BUY,
            security=security,
            date=None,  # Not needed for this test
            quantity=50.0,
            price_per_unit=6.0,
            commission=5.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Process the transactions
        manager.process_transaction(buy1)
        manager.process_transaction(buy2)
        
        # Check the pool
        pool = manager.get_pool(security)
        assert pool is not None
        assert pool.quantity == 150.0
        assert pool.cost_basis == 815.0  # (100 * 5.0 + 10.0) + (50 * 6.0 + 5.0) = 510.0 + 305.0 = 815.0
        assert abs(pool.average_cost - 5.43333) < 0.0001  # 815.0 / 150.0 ≈ 5.43333
    
    def test_remove_shares_from_pool(self):
        """Test removing shares from a pool."""
        # Create a manager
        manager = SharePoolManager()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create transactions
        buy = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=None,  # Not needed for this test
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        sell = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=None,  # Not needed for this test
            quantity=-40.0,
            price_per_unit=7.0,
            commission=5.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Process the transactions
        manager.process_transaction(buy)
        manager.process_transaction(sell)
        
        # Check the pool
        pool = manager.get_pool(security)
        assert pool is not None
        assert pool.quantity == 60.0
        assert abs(pool.cost_basis - 306.0) < 0.0001  # (510 * 0.6) = 306.0
        assert abs(pool.average_cost - 5.1) < 0.0001  # 306.0 / 60.0 = 5.1 (average cost unchanged)
    
    def test_remove_all_shares_from_pool(self):
        """Test removing all shares from a pool."""
        # Create a manager
        manager = SharePoolManager()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create transactions
        buy = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=None,  # Not needed for this test
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        sell = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=None,  # Not needed for this test
            quantity=-100.0,
            price_per_unit=7.0,
            commission=5.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Process the transactions
        manager.process_transaction(buy)
        manager.process_transaction(sell)
        
        # Check the pool is removed
        pool = manager.get_pool(security)
        assert pool is None  # Pool should be removed when empty
        assert security.isin not in manager.pools
    
    def test_multiple_securities(self):
        """Test handling multiple securities in separate pools."""
        # Create a manager
        manager = SharePoolManager()
        
        # Create securities
        security1 = Security(isin="GB00B16KPT44", symbol="HSBA")
        security2 = Security(isin="GB0007980591", symbol="BP")
        
        # Create buy transactions for each security
        buy1 = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security1,
            date=None,
            quantity=100.0,
            price_per_unit=5.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        buy2 = Transaction(
            transaction_id="buy2",
            transaction_type=TransactionType.BUY,
            security=security2,
            date=None,
            quantity=200.0,
            price_per_unit=4.0,
            commission=8.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Process the transactions
        manager.process_transaction(buy1)
        manager.process_transaction(buy2)
        
        # Check both pools exist
        pool1 = manager.get_pool(security1)
        pool2 = manager.get_pool(security2)
        
        assert pool1 is not None
        assert pool2 is not None
        assert len(manager.get_all_pools()) == 2
        
        # Check each pool's values
        assert pool1.quantity == 100.0
        assert pool1.cost_basis == 510.0
        
        assert pool2.quantity == 200.0
        assert pool2.cost_basis == 808.0  # 200 * 4.0 + 8.0 = 808.0
