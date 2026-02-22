"""Transaction matcher implementation."""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional, Set
from copy import deepcopy

from ..interfaces.calculator_interfaces import TransactionMatcherInterface
from ..models.domain_models import Transaction, TransactionType, Security, SharePool
from ..config.tax_config import SAME_DAY_RULE, BED_AND_BREAKFAST_RULE_DAYS
from .share_pool_manager import SharePoolManager


class UKTransactionMatcher(TransactionMatcherInterface):
    """UK-specific implementation of transaction matching rules."""
    
    def __init__(self):
        """Initialize the transaction matcher."""
        self.logger = logging.getLogger(__name__)
    
    @staticmethod
    def _securities_match(sec_a: Security, sec_b: Security) -> bool:
        """Check if two securities represent the same instrument.
        
        Uses ISIN when both are non-empty, otherwise falls back to symbol.
        This ensures correct matching for brokers that don't provide ISINs.
        """
        if sec_a.isin and sec_b.isin:
            return sec_a.isin == sec_b.isin
        return sec_a.symbol == sec_b.symbol
    
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
        
        # Separate buys and sells, but we need to track consumption
        # We'll use a dictionary to track remaining quantity for each buy transaction ID
        buy_quantities = {}
        all_buys = []
        sells = []
        
        for tx in sorted_transactions:
            if tx.transaction_type == TransactionType.BUY:
                all_buys.append(tx)
                buy_quantities[tx.transaction_id] = tx.quantity
            elif tx.transaction_type in [TransactionType.SELL, TransactionType.TRANSFER_OUT]:
                sells.append(tx)
            elif tx.transaction_type == TransactionType.SPLIT:
                # Handle splits if necessary, but for now assuming splits are handled by adjusting quantities beforehand?
                # Or we need to adjust the pool. 
                # The current matcher architecture assumes buys/sells. 
                # Splits affect the pool, which we'll handle in the S104 section.
                pass

        matched_disposals = []
        
        # We need to process sells chronologically
        for sell_tx in sells:
            self.logger.info(f"Matching disposal: {sell_tx.transaction_id} - {abs(sell_tx.quantity)} shares of {sell_tx.security.get_display_name()}")
            
            remaining_to_match = abs(sell_tx.quantity)
            matched_buys = []
            
            if remaining_to_match <= 0:
                continue
                
            # 1. Match same-day acquisitions
            # Buys on the same day.
            same_day_buys = [
                b for b in all_buys 
                if self._securities_match(b.security, sell_tx.security)
                and b.date.date() == sell_tx.date.date()
                and buy_quantities[b.transaction_id] > 0
            ]
            
            remaining_to_match, matched_same_day = self._match_transactions(
                sell_tx, same_day_buys, remaining_to_match, buy_quantities
            )
            matched_buys.extend(matched_same_day)
            
            # 2. Match next 30-day acquisitions (bed & breakfast rule)
            if remaining_to_match > 0:
                # Buys in [sell_date + 1, sell_date + 30]
                end_date = sell_tx.date + timedelta(days=BED_AND_BREAKFAST_RULE_DAYS)
                next_30_day_buys = [
                    b for b in all_buys
                    if self._securities_match(b.security, sell_tx.security)
                    and sell_tx.date < b.date <= end_date
                    and buy_quantities[b.transaction_id] > 0
                ]
                # Sort by date (FIFO)
                next_30_day_buys.sort(key=lambda x: x.date)
                
                remaining_to_match, matched_30_day = self._match_transactions(
                    sell_tx, next_30_day_buys, remaining_to_match, buy_quantities
                )
                matched_buys.extend(matched_30_day)
            
            # 3. Match section 104 holdings (existing shares)
            if remaining_to_match > 0:
                # For Section 104, we need to pool all available shares acquired BEFORE the sell date
                # that haven't been consumed by same-day or 30-day rules of THIS or PREVIOUS sells.
                
                # Identify candidates: Buys before sell date, with remaining quantity > 0
                pool_candidates = [
                    b for b in all_buys
                    if self._securities_match(b.security, sell_tx.security)
                    and b.date.date() < sell_tx.date.date()
                    and buy_quantities[b.transaction_id] > 0
                ]
                
                if pool_candidates:
                    # Calculate pool state
                    total_pool_qty = sum(buy_quantities[b.transaction_id] for b in pool_candidates)
                    
                    # Calculate total allowable cost for the pool
                    # Cost is proportional to the remaining quantity
                    total_pool_cost = 0.0
                    total_pool_expenses = 0.0
                    
                    for b in pool_candidates:
                        qty_remaining = buy_quantities[b.transaction_id]
                        fraction = qty_remaining / b.quantity if b.quantity > 0 else 0
                        
                        # Add cost and expenses proportional to what's left
                        total_pool_cost += (b.price_per_unit * b.quantity) * fraction
                        total_pool_expenses += (b.commission + b.taxes) * fraction
                    
                    # Create a "Pooled" transaction match
                    match_qty = min(remaining_to_match, total_pool_qty)
                    
                    if match_qty > 0:
                        # Calculate cost for the matched portion
                        pool_fraction = match_qty / total_pool_qty
                        matched_cost = total_pool_cost * pool_fraction
                        matched_expenses = total_pool_expenses * pool_fraction
                        
                        # Create a synthetic transaction representing the pool match
                        # We use the sell date as the date, or maybe the latest buy date? 
                        # Usually S104 doesn't have a specific date, but for the object we need one.
                        pooled_tx = Transaction(
                            transaction_id=f"POOL_MATCH_{sell_tx.transaction_id}",
                            transaction_type=TransactionType.BUY,
                            security=sell_tx.security,
                            date=sell_tx.date, # Date doesn't matter much for S104 match
                            quantity=match_qty,
                            price_per_unit=matched_cost / match_qty if match_qty > 0 else 0,
                            commission=matched_expenses, # We lump expenses here? Or split?
                            taxes=0.0, # Lumping all expenses into commission for simplicity or split if needed
                            currency=sell_tx.currency # Assuming same currency for now
                        )
                        # Actually, we should try to preserve the currency of the pool if possible, 
                        # but if mixed currencies, we might need base currency. 
                        # For now assuming single currency or converted.
                        
                        matched_buys.append(pooled_tx)
                        
                        # DECREMENT the underlying buys proportionally
                        # This is the tricky part. S104 is a single pool. 
                        # When we sell from S104, we reduce the pool.
                        # We need to reduce the 'buy_quantities' of the candidates so they are not available for future matches?
                        # YES. If we consume 50% of the pool, we consume 50% of EVERY transaction in the pool.
                        
                        for b in pool_candidates:
                            qty_remaining = buy_quantities[b.transaction_id]
                            reduction = qty_remaining * pool_fraction
                            buy_quantities[b.transaction_id] -= reduction
                            
                        remaining_to_match -= match_qty

            # Add the matched disposal
            if matched_buys:
                matched_disposals.append((sell_tx, matched_buys))
        
        return matched_disposals

    def _match_transactions(
        self, 
        sell_tx: Transaction, 
        buy_txs: List[Transaction], 
        quantity_to_match: float,
        buy_quantities: Dict[str, float]
    ) -> Tuple[float, List[Transaction]]:
        """
        Match a sell transaction with buy transactions up to the quantity_to_match.
        Updates buy_quantities in place.
        """
        matched_buys = []
        remaining = quantity_to_match
        
        for buy_tx in buy_txs:
            if remaining <= 0:
                break
            
            available_qty = buy_quantities[buy_tx.transaction_id]
            if available_qty <= 0:
                continue
                
            # How many shares can we match from this buy?
            match_quantity = min(remaining, available_qty)
            
            if match_quantity > 0:
                # Create a copy of the buy transaction with adjusted quantity
                # Calculate proportional costs
                original_qty = buy_tx.quantity
                fraction = match_quantity / original_qty if original_qty > 0 else 0
                
                matched_buy = Transaction(
                    transaction_id=buy_tx.transaction_id,
                    transaction_type=buy_tx.transaction_type,
                    security=buy_tx.security,
                    date=buy_tx.date,
                    quantity=match_quantity,
                    price_per_unit=buy_tx.price_per_unit,
                    commission=buy_tx.commission * fraction,
                    taxes=buy_tx.taxes * fraction,
                    currency=buy_tx.currency
                )
                
                matched_buys.append(matched_buy)
                remaining -= match_quantity
                
                # Update available quantity
                buy_quantities[buy_tx.transaction_id] -= match_quantity
        
        return remaining, matched_buys
