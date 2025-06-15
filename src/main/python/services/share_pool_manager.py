"""Share pool manager implementation."""
import logging
from typing import Dict, Optional

from ..interfaces.calculator_interfaces import SharePoolManagerInterface
from ..models.domain_models import Transaction, TransactionType, Security, SharePool


class SharePoolManager(SharePoolManagerInterface):
    """
    Manager for share pools that follows UK tax rules.
    
    This implements the Section 104 share pooling required by UK tax laws.
    """
    
    def __init__(self):
        """Initialize the share pool manager."""
        self.logger = logging.getLogger(__name__)
        self.pools: Dict[str, SharePool] = {}
    
    def process_transaction(self, transaction: Transaction) -> None:
        """
        Process a transaction and update the relevant share pools.
        
        Args:
            transaction: The transaction to process
        """
        security_id = transaction.security.isin
        
        if transaction.transaction_type == TransactionType.BUY:
            self._process_buy(transaction)
        elif transaction.transaction_type == TransactionType.SELL:
            self._process_sell(transaction)
    
    def get_pool(self, security: Security) -> Optional[SharePool]:
        """
        Get the share pool for a specific security.
        
        Args:
            security: The security to get the pool for
            
        Returns:
            The share pool or None if it doesn't exist
        """
        return self.pools.get(security.isin)
    
    def get_all_pools(self) -> Dict[str, SharePool]:
        """
        Get all share pools.
        
        Returns:
            Dictionary of security IDs to share pools
        """
        return self.pools
    
    def _process_buy(self, transaction: Transaction) -> None:
        """
        Process a buy transaction and update the share pool.
        
        Args:
            transaction: The buy transaction
        """
        security_id = transaction.security.isin
        
        # Get or create the pool for this security
        if security_id not in self.pools:
            self.pools[security_id] = SharePool(security=transaction.security)
        
        # Add the shares to the pool
        self.pools[security_id].add_shares(transaction)
        
        self.logger.debug(
            f"Added {transaction.quantity} shares of {security_id} to pool. "
            f"New total: {self.pools[security_id].quantity}, "
            f"Avg cost: {self.pools[security_id].average_cost:.4f}"
        )
    
    def _process_sell(self, transaction: Transaction) -> None:
        """
        Process a sell transaction and update the share pool.
        
        Args:
            transaction: The sell transaction
        """
        security_id = transaction.security.isin
        
        # Check if we have a pool for this security
        if security_id not in self.pools:
            self.logger.warning(
                f"Attempting to sell {abs(transaction.quantity)} shares of {security_id} "
                f"but no shares in pool"
            )
            return
        
        pool = self.pools[security_id]
        quantity_to_remove = abs(transaction.quantity)
        
        # Check if we have enough shares
        if pool.quantity < quantity_to_remove:
            self.logger.warning(
                f"Attempting to sell {quantity_to_remove} shares of {security_id} "
                f"but only {pool.quantity} shares in pool"
            )
            quantity_to_remove = pool.quantity
        
        # Remove the shares from the pool
        if quantity_to_remove > 0:
            removed, cost_basis = pool.remove_shares(quantity_to_remove)
            
            self.logger.debug(
                f"Removed {removed} shares of {security_id} from pool. "
                f"New total: {pool.quantity}, "
                f"Cost basis removed: {cost_basis:.2f}"
            )
            
        # Remove empty pools
        if pool.quantity <= 0:
            del self.pools[security_id]
