"""Transaction matcher implementation."""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional

from ..interfaces.calculator_interfaces import TransactionMatcherInterface
from ..models.domain_models import Transaction, TransactionType, Security
from ..config.tax_config import SAME_DAY_RULE, BED_AND_BREAKFAST_RULE_DAYS


class UKTransactionMatcher(TransactionMatcherInterface):
    """UK-specific implementation of transaction matching rules."""
    
    def __init__(self):
        """Initialize the transaction matcher."""
        self.logger = logging.getLogger(__name__)
    
    def match_disposals(self, transactions: List[Transaction]) -> List[Tuple[Transaction, List[Transaction]]]:
        """
        Match sell transactions with corresponding buy transactions according to UK tax rules.
        
        UK capital gains tax rules require disposals to be matched in this order:
        1. Same-day acquisitions
        2. Shares acquired in the 30 days after the disposal (FIFO)
        3. Section 104 holding (average cost of remaining shares)
        
        Args:
            transactions: List of all transactions sorted by date
            
        Returns:
            List of tuples containing (sell transaction, matched buy transactions)
        """
        # Ensure transactions are sorted by date
        sorted_transactions = sorted(transactions, key=lambda x: x.date)
        
        # Separate buys and sells
        buys = [tx for tx in sorted_transactions if tx.transaction_type == TransactionType.BUY]
        sells = [tx for tx in sorted_transactions if tx.transaction_type == TransactionType.SELL]
        
        # Match each sell with appropriate buys
        matched_disposals = []
        
        for sell_tx in sells:
            self.logger.info(f"Matching disposal: {sell_tx.transaction_id} - {abs(sell_tx.quantity)} shares of {sell_tx.security.get_display_name()}")
            
            # Track remaining quantity to match
            remaining_to_match = abs(sell_tx.quantity)
            matched_buys = []
            
            if remaining_to_match <= 0:
                continue
                
            # 1. Match same-day acquisitions
            same_day_buys = self._get_same_day_buys(sell_tx, buys)
            remaining_to_match, matched_same_day = self._match_transactions(
                sell_tx, same_day_buys, remaining_to_match
            )
            matched_buys.extend(matched_same_day)
            
            # 2. Match next 30-day acquisitions (bed & breakfast rule)
            if remaining_to_match > 0:
                next_30_day_buys = self._get_next_30_day_buys(sell_tx, buys)
                remaining_to_match, matched_30_day = self._match_transactions(
                    sell_tx, next_30_day_buys, remaining_to_match
                )
                matched_buys.extend(matched_30_day)
            
            # 3. Match section 104 holdings (existing shares)
            if remaining_to_match > 0:
                section_104_buys = self._get_section_104_buys(sell_tx, buys)
                _, matched_section_104 = self._match_transactions(
                    sell_tx, section_104_buys, remaining_to_match
                )
                matched_buys.extend(matched_section_104)
            
            # Add the matched disposal
            if matched_buys:
                matched_disposals.append((sell_tx, matched_buys))
        
        return matched_disposals
    
    def _get_same_day_buys(self, sell_tx: Transaction, all_buys: List[Transaction]) -> List[Transaction]:
        """Get all buy transactions for the same security on the same day."""
        same_day = sell_tx.date.date()
        
        return [
            buy for buy in all_buys
            if (buy.security.isin == sell_tx.security.isin and
                buy.date.date() == same_day)
        ]
    
    def _get_next_30_day_buys(self, sell_tx: Transaction, all_buys: List[Transaction]) -> List[Transaction]:
        """Get all buy transactions within 30 days after the sell transaction."""
        sell_date = sell_tx.date
        end_date = sell_date + timedelta(days=BED_AND_BREAKFAST_RULE_DAYS)
        
        # Find buys within the next 30 days, ordered by date (FIFO)
        next_30_day_buys = [
            buy for buy in all_buys
            if (buy.security.isin == sell_tx.security.isin and
                sell_date < buy.date <= end_date)
        ]
        
        # Sort by date (FIFO)
        return sorted(next_30_day_buys, key=lambda x: x.date)
    
    def _get_section_104_buys(self, sell_tx: Transaction, all_buys: List[Transaction]) -> List[Transaction]:
        """Get all buy transactions before the sell date, excluding same-day."""
        sell_date = sell_tx.date.date()
        
        section_104_buys = [
            buy for buy in all_buys
            if (buy.security.isin == sell_tx.security.isin and
                buy.date.date() < sell_date)
        ]
        
        # Sort by date (FIFO)
        return sorted(section_104_buys, key=lambda x: x.date)
    
    def _match_transactions(
        self, 
        sell_tx: Transaction, 
        buy_txs: List[Transaction], 
        quantity_to_match: float
    ) -> Tuple[float, List[Transaction]]:
        """
        Match a sell transaction with buy transactions up to the quantity_to_match.
        
        Args:
            sell_tx: The sell transaction
            buy_txs: List of buy transactions to match against
            quantity_to_match: Quantity of shares to match
            
        Returns:
            Tuple containing (remaining quantity to match, list of matched buys)
        """
        matched_buys = []
        remaining = quantity_to_match
        
        for buy_tx in buy_txs:
            if remaining <= 0:
                break
                
            # How many shares can we match from this buy?
            match_quantity = min(remaining, buy_tx.quantity)
            
            if match_quantity > 0:
                # Create a copy of the buy transaction with adjusted quantity
                matched_buy = Transaction(
                    transaction_id=buy_tx.transaction_id,
                    transaction_type=buy_tx.transaction_type,
                    security=buy_tx.security,
                    date=buy_tx.date,
                    quantity=match_quantity,
                    price_per_unit=buy_tx.price_per_unit,
                    commission=(buy_tx.commission * match_quantity / buy_tx.quantity),
                    taxes=(buy_tx.taxes * match_quantity / buy_tx.quantity),
                    currency=buy_tx.currency
                )
                
                matched_buys.append(matched_buy)
                remaining -= match_quantity
        
        return remaining, matched_buys
