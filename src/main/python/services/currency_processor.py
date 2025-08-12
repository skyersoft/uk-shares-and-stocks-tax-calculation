import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4

from ..models.domain_models import (
    Transaction, TransactionType, Currency, CurrencyPool,
    CurrencyGainLoss, CurrencyGainLossSummary
)


class CurrencyExchangeProcessor:
    """Service for processing currency exchange transactions."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.currency_pools: Dict[str, CurrencyPool] = {}
    
    def process_currency_transactions(
        self, 
        transactions: List[Transaction]
    ) -> List[CurrencyGainLoss]:
        """Process currency exchange transactions for tax purposes."""
        fx_transactions = [
            t for t in transactions 
            if t.transaction_type == TransactionType.CURRENCY_EXCHANGE
        ]
        
        self.logger.info(f"Processing {len(fx_transactions)} currency exchange transactions")
        
        currency_gains_losses = []
        
        # Group transactions by currency pair
        currency_pairs = self._group_by_currency_pair(fx_transactions)
        
        for pair, pair_transactions in currency_pairs.items():
            self.logger.info(f"Processing {len(pair_transactions)} transactions for {pair}")
            
            gains_losses = self._calculate_currency_gains_losses(
                pair, pair_transactions
            )
            currency_gains_losses.extend(gains_losses)
        
        self.logger.info(f"Calculated {len(currency_gains_losses)} currency gain/loss entries")
        return currency_gains_losses
    
    def _group_by_currency_pair(
        self, 
        transactions: List[Transaction]
    ) -> Dict[str, List[Transaction]]:
        """Group currency transactions by currency pair."""
        pairs = {}
        
        for transaction in transactions:
            # Extract currency pair from security symbol (e.g., "EUR.GBP")
            pair = transaction.security.symbol
            if pair not in pairs:
                pairs[pair] = []
            pairs[pair].append(transaction)
        
        return pairs
    
    def _calculate_currency_gains_losses(
        self, 
        currency_pair: str, 
        transactions: List[Transaction]
    ) -> List[CurrencyGainLoss]:
        """Calculate gains/losses for a specific currency pair."""
        gains_losses = []
        
        # Sort transactions by date
        sorted_transactions = sorted(transactions, key=lambda t: t.date)
        
        # Extract currencies from pair (e.g., "EUR.GBP" -> "EUR", "GBP")
        currencies = currency_pair.split('.')
        if len(currencies) != 2:
            self.logger.warning(f"Invalid currency pair format: {currency_pair}")
            return gains_losses
        
        from_currency_code = currencies[0]
        to_currency_code = currencies[1]
        
        # Initialize currency pool for the foreign currency
        if from_currency_code not in self.currency_pools:
            self.currency_pools[from_currency_code] = CurrencyPool(from_currency_code)
        
        currency_pool = self.currency_pools[from_currency_code]
        
        for transaction in sorted_transactions:
            try:
                if transaction.quantity > 0:  # Buying foreign currency
                    self._process_currency_purchase(
                        currency_pool, transaction, from_currency_code
                    )
                else:  # Selling foreign currency
                    gain_loss = self._process_currency_disposal(
                        currency_pool, transaction, currency_pair
                    )
                    if gain_loss:
                        gains_losses.append(gain_loss)
            except Exception as e:
                self.logger.error(f"Error processing currency transaction {transaction.id}: {e}")
                # Continue processing other transactions
        
        return gains_losses
    
    def _process_currency_purchase(
        self, 
        currency_pool: CurrencyPool, 
        transaction: Transaction,
        currency_code: str
    ) -> None:
        """Process a currency purchase (add to pool)."""
        amount = transaction.quantity
        rate_to_gbp = transaction.currency.rate_to_base
        
        currency_pool.add_purchase(amount, rate_to_gbp, transaction.date)
        
        self.logger.debug(
            f"Added {amount} {currency_code} to pool at rate {rate_to_gbp} on {transaction.date}"
        )
    
    def _process_currency_disposal(
        self, 
        currency_pool: CurrencyPool, 
        transaction: Transaction,
        currency_pair: str
    ) -> Optional[CurrencyGainLoss]:
        """Process a currency disposal (remove from pool and calculate gain/loss)."""
        disposal_amount = abs(transaction.quantity)
        current_rate = transaction.currency.rate_to_base
        
        try:
            # Get disposal details from pool using FIFO
            disposals = currency_pool.remove_disposal(disposal_amount)
            
            # Calculate total cost basis and proceeds
            total_cost_gbp = sum(d['cost_gbp'] for d in disposals)
            proceeds_gbp = disposal_amount * current_rate
            
            # Calculate gain/loss
            gain_loss_gbp = proceeds_gbp - total_cost_gbp
            
            # Calculate weighted average original rate
            total_amount = sum(d['amount'] for d in disposals)
            weighted_avg_rate = total_cost_gbp / total_amount if total_amount > 0 else 0
            
            return CurrencyGainLoss(
                currency_pair=currency_pair,
                transaction_date=transaction.date,
                amount_gbp=proceeds_gbp,
                gain_loss_gbp=gain_loss_gbp,
                exchange_rate_used=current_rate,
                exchange_rate_original=weighted_avg_rate,
                disposal_method="FIFO"
            )
            
        except ValueError as e:
            self.logger.error(f"Error processing currency disposal: {e}")
            return None
    
    def calculate_currency_summary(
        self, 
        currency_gains_losses: List[CurrencyGainLoss], 
        tax_year: str
    ) -> CurrencyGainLossSummary:
        """Calculate currency gain/loss summary for a tax year."""
        summary = CurrencyGainLossSummary(tax_year=tax_year)
        
        for gain_loss in currency_gains_losses:
            if self._is_in_tax_year(gain_loss.transaction_date, tax_year):
                summary.add_currency_transaction(gain_loss)
        
        self.logger.info(
            f"Currency summary for {tax_year}: "
            f"{summary.number_of_transactions} transactions, "
            f"£{summary.net_gain_loss:.2f} net gain/loss"
        )
        
        return summary
    
    def _is_in_tax_year(self, date: datetime, tax_year: str) -> bool:
        """Check if a date falls within the specified UK tax year."""
        # UK tax year runs April 6 to April 5
        year_parts = tax_year.split('-')
        start_year = int(year_parts[0])
        
        tax_year_start = datetime(start_year, 4, 6)
        tax_year_end = datetime(start_year + 1, 4, 5)
        
        return tax_year_start <= date <= tax_year_end
    
    def generate_currency_report(
        self, 
        currency_summary: CurrencyGainLossSummary
    ) -> Dict[str, Any]:
        """Generate a comprehensive currency gain/loss report."""
        currency_pairs = currency_summary.get_transactions_by_currency_pair()
        
        pair_summaries = {}
        for pair, transactions in currency_pairs.items():
            pair_gains = sum(t.gain_loss_gbp for t in transactions if t.is_gain)
            pair_losses = sum(abs(t.gain_loss_gbp) for t in transactions if t.is_loss)
            
            pair_summaries[pair] = {
                'transactions': len(transactions),
                'gains': pair_gains,
                'losses': pair_losses,
                'net': pair_gains - pair_losses
            }
        
        return {
            'tax_year': currency_summary.tax_year,
            'total_transactions': currency_summary.number_of_transactions,
            'currency_pairs': currency_summary.number_of_currency_pairs,
            'total_gains': currency_summary.total_gains,
            'total_losses': currency_summary.total_losses,
            'net_gain_loss': currency_summary.net_gain_loss,
            'is_net_gain': currency_summary.is_net_gain,
            'pair_summaries': pair_summaries,
            'gain_transactions': len(currency_summary.get_gains_only()),
            'loss_transactions': len(currency_summary.get_losses_only())
        }
    
    def get_currency_pool_status(self) -> Dict[str, Dict[str, Any]]:
        """Get current status of all currency pools."""
        status = {}
        
        for currency_code, pool in self.currency_pools.items():
            status[currency_code] = {
                'total_amount': pool.total_amount,
                'total_cost_gbp': pool.total_cost_gbp,
                'average_rate': pool.average_rate_to_gbp,
                'entries': len(pool.entries)
            }
        
        return status
    
    def reset_currency_pools(self) -> None:
        """Reset all currency pools (useful for testing)."""
        self.currency_pools.clear()
        self.logger.info("Currency pools reset")
