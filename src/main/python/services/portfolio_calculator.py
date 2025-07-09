"""Portfolio calculator for current holdings and performance metrics."""
import logging
from datetime import datetime
from typing import List, Dict, Optional, Any

from ..models.domain_models import (
    Transaction, TransactionType, Security, Currency,
    Holding, MarketSummary, PortfolioSummary
)


class PortfolioCalculator:
    """Service for calculating current portfolio holdings and performance."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def calculate_current_holdings(
        self, 
        transactions: List[Transaction]
    ) -> List[Holding]:
        """Calculate current holdings from transaction history."""
        self.logger.info(
            f"Calculating current holdings from {len(transactions)} transactions"
        )
        
        holdings_map = {}
        
        # Group transactions by security
        security_transactions = self._group_by_security(transactions)
        
        for security_id, security_txns in security_transactions.items():
            holding = self._calculate_security_holding(security_txns)
            if holding and holding.quantity > 0:
                holdings_map[security_id] = holding
        
        holdings = list(holdings_map.values())
        self.logger.info(f"Calculated {len(holdings)} current holdings")
        
        return holdings
    
    def _group_by_security(
        self, 
        transactions: List[Transaction]
    ) -> Dict[str, List[Transaction]]:
        """Group transactions by security ISIN."""
        grouped = {}
        
        for transaction in transactions:
            # Only process stock transactions for holdings
            if transaction.transaction_type in [
                TransactionType.BUY, TransactionType.SELL
            ]:
                isin = transaction.security.isin
                if isin not in grouped:
                    grouped[isin] = []
                grouped[isin].append(transaction)
        
        return grouped
    
    def _calculate_security_holding(
        self, 
        transactions: List[Transaction]
    ) -> Optional[Holding]:
        """Calculate holding for a specific security using Section 104 pool."""
        if not transactions:
            return None
        
        security = transactions[0].security
        
        # Sort transactions by date
        sorted_transactions = sorted(transactions, key=lambda t: t.date)
        
        # Calculate Section 104 pool
        pool_quantity = 0.0
        pool_cost_gbp = 0.0
        
        for transaction in sorted_transactions:
            if transaction.transaction_type == TransactionType.BUY:
                # Add to pool
                quantity = transaction.quantity
                cost_gbp = (
                    quantity * transaction.price_per_unit * 
                    transaction.currency.rate_to_base
                )
                cost_gbp += transaction.commission_in_base_currency
                
                pool_quantity += quantity
                pool_cost_gbp += cost_gbp
                
            elif transaction.transaction_type == TransactionType.SELL:
                # Remove from pool
                quantity_sold = abs(transaction.quantity)
                
                if pool_quantity > 0:
                    # Calculate average cost per share
                    avg_cost_per_share = pool_cost_gbp / pool_quantity
                    
                    # Remove proportional cost
                    cost_removed = quantity_sold * avg_cost_per_share
                    
                    pool_quantity -= quantity_sold
                    pool_cost_gbp -= cost_removed
                    
                    # Ensure no negative values due to rounding
                    pool_quantity = max(0, pool_quantity)
                    pool_cost_gbp = max(0, pool_cost_gbp)
        
        # If no remaining quantity, return None
        if pool_quantity <= 0:
            return None
        
        # Get current price (use latest transaction price as proxy)
        current_price = self._get_current_price(security, sorted_transactions)
        
        # Calculate current value in GBP
        # Use the currency from the latest transaction for conversion
        latest_transaction = max(sorted_transactions, key=lambda t: t.date)
        current_value_gbp = pool_quantity * current_price
        if (latest_transaction.currency and
            latest_transaction.currency.rate_to_base != 1.0):
            current_value_gbp *= latest_transaction.currency.rate_to_base
        
        # Calculate average cost per share
        average_cost_gbp = pool_cost_gbp / pool_quantity if pool_quantity > 0 else 0
        
        return Holding(
            security=security,
            quantity=pool_quantity,
            average_cost_gbp=average_cost_gbp,
            current_price=current_price,
            current_value_gbp=current_value_gbp,
            market=security.listing_exchange or "UNKNOWN",
            unrealized_gain_loss=current_value_gbp - pool_cost_gbp
        )
    
    def _get_current_price(
        self,
        security: Security,
        transactions: List[Transaction]
    ) -> float:
        """Get current price for a security (using latest transaction price)."""
        # Use the most recent BUY/SELL transaction price as a proxy for current price
        # In a real system, this would fetch from a market data provider
        if transactions:
            # Filter to only BUY/SELL transactions for price determination
            price_transactions = [
                t for t in transactions
                if t.transaction_type in [TransactionType.BUY, TransactionType.SELL]
            ]
            if price_transactions:
                latest_transaction = max(price_transactions, key=lambda t: t.date)
                return latest_transaction.price_per_unit
        return 0.0
    
    def group_holdings_by_market(
        self, 
        holdings: List[Holding]
    ) -> Dict[str, MarketSummary]:
        """Group holdings by market/exchange."""
        market_summaries = {}
        
        for holding in holdings:
            market = holding.market
            
            if market not in market_summaries:
                market_summaries[market] = MarketSummary(market=market)
            
            market_summaries[market].add_holding(holding)
        
        return market_summaries
    
    def calculate_portfolio_totals(
        self, 
        market_summaries: Dict[str, MarketSummary]
    ) -> PortfolioSummary:
        """Calculate portfolio-level totals."""
        portfolio_summary = PortfolioSummary()
        
        for market_summary in market_summaries.values():
            portfolio_summary.add_market_summary(market_summary)
        
        # Calculate market weights
        total_value = portfolio_summary.total_portfolio_value
        for summary in market_summaries.values():
            if total_value > 0:
                summary.weight_in_portfolio = (
                    summary.total_value / total_value
                ) * 100
        
        return portfolio_summary
    
    def calculate_portfolio_summary(
        self, 
        transactions: List[Transaction]
    ) -> PortfolioSummary:
        """Calculate complete portfolio summary from transactions."""
        # Calculate current holdings
        holdings = self.calculate_current_holdings(transactions)
        
        # Group by market
        market_summaries = self.group_holdings_by_market(holdings)
        
        # Calculate portfolio totals
        portfolio_summary = self.calculate_portfolio_totals(market_summaries)
        
        self.logger.info(
            f"Portfolio summary: {portfolio_summary.number_of_holdings} holdings "
            f"across {portfolio_summary.number_of_markets} markets, "
            f"total value: £{portfolio_summary.total_portfolio_value:.2f}"
        )
        
        return portfolio_summary
    
    def get_portfolio_analytics(
        self, 
        portfolio_summary: PortfolioSummary
    ) -> Dict[str, Any]:
        """Generate portfolio analytics report."""
        return {
            'summary': {
                'total_value': portfolio_summary.total_portfolio_value,
                'total_cost': portfolio_summary.total_portfolio_cost,
                'total_return_pct': portfolio_summary.total_return_pct,
                'number_of_holdings': portfolio_summary.number_of_holdings,
                'number_of_markets': portfolio_summary.number_of_markets
            },
            'markets': {
                market: {
                    'holdings_count': summary.number_of_holdings,
                    'total_value': summary.total_value,
                    'weight_pct': summary.weight_in_portfolio,
                    'average_return_pct': summary.average_return_pct
                }
                for market, summary in portfolio_summary.market_summaries.items()
            },
            'top_holdings': [
                {
                    'symbol': h.security.symbol,
                    'name': h.security.name,
                    'market': h.market,
                    'value': h.current_value_gbp,
                    'return_pct': h.gain_loss_pct
                }
                for h in portfolio_summary.get_top_holdings(10)
            ]
        }
