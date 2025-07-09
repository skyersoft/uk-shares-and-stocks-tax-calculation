"""Performance calculator for portfolio holdings."""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any

from ..models.domain_models import (
    Transaction, TransactionType, Security, Currency,
    Holding, MarketSummary, PortfolioSummary, DividendIncome
)


class PerformanceCalculator:
    """Service for calculating performance metrics for portfolio holdings."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def calculate_holding_performance(
        self, 
        holding: Holding, 
        transactions: List[Transaction],
        dividends: List[DividendIncome]
    ) -> Holding:
        """Calculate comprehensive performance metrics for a holding."""
        
        # Calculate capital gains percentage
        holding.capital_gains_pct = self._calculate_capital_gains_pct(holding)
        
        # Calculate dividend yield
        holding.dividend_yield_pct = self._calculate_dividend_yield(
            holding, dividends
        )
        
        # Calculate currency effect
        holding.currency_effect_pct = self._calculate_currency_effect(
            holding, transactions
        )
        
        # Calculate total return
        holding.total_return_pct = self._calculate_total_return(holding)
        
        return holding
    
    def _calculate_capital_gains_pct(self, holding: Holding) -> float:
        """Calculate capital gains percentage for a holding."""
        if holding.total_cost_gbp > 0:
            return (holding.unrealized_gain_loss / holding.total_cost_gbp) * 100
        return 0.0
    
    def _calculate_dividend_yield(
        self, 
        holding: Holding, 
        dividends: List[DividendIncome]
    ) -> float:
        """Calculate dividend yield percentage for a holding."""
        # Filter dividends for this security
        security_dividends = [
            d for d in dividends 
            if d.security and d.security.isin == holding.security.isin
        ]
        
        if not security_dividends or holding.current_value_gbp <= 0:
            return 0.0
        
        # Calculate total dividends received in the last 12 months
        cutoff_date = datetime.now() - timedelta(days=365)
        recent_dividends = [
            d for d in security_dividends 
            if d.payment_date and d.payment_date >= cutoff_date
        ]
        
        total_dividends_gbp = sum(d.amount_gbp for d in recent_dividends)
        
        # Calculate yield as percentage of current value
        dividend_yield = (total_dividends_gbp / holding.current_value_gbp) * 100
        
        return dividend_yield
    
    def _calculate_currency_effect(
        self, 
        holding: Holding, 
        transactions: List[Transaction]
    ) -> float:
        """Calculate currency effect on holding performance."""
        # Filter transactions for this security
        security_transactions = [
            t for t in transactions 
            if (t.security and t.security.isin == holding.security.isin and
                t.transaction_type in [TransactionType.BUY, TransactionType.SELL])
        ]
        
        if not security_transactions:
            return 0.0
        
        # Check if transactions are in GBP (no currency effect)
        if (security_transactions and
            security_transactions[0].currency.code == "GBP"):
            return 0.0
        
        # Calculate weighted average purchase rate
        total_cost_foreign = 0.0
        total_cost_gbp = 0.0
        
        for transaction in security_transactions:
            if transaction.transaction_type == TransactionType.BUY:
                cost_foreign = (
                    transaction.quantity * transaction.price_per_unit
                )
                cost_gbp = cost_foreign * transaction.currency.rate_to_base
                
                total_cost_foreign += cost_foreign
                total_cost_gbp += cost_gbp
        
        if total_cost_foreign <= 0:
            return 0.0
        
        # Average purchase rate
        avg_purchase_rate = total_cost_gbp / total_cost_foreign
        
        # Current rate (use latest transaction currency)
        latest_transaction = max(security_transactions, key=lambda t: t.date)
        current_rate = latest_transaction.currency.rate_to_base

        # Currency effect calculation
        if avg_purchase_rate > 0:
            currency_effect = (
                (current_rate - avg_purchase_rate) / avg_purchase_rate
            ) * 100
            return currency_effect

        return 0.0
    
    def _calculate_total_return(self, holding: Holding) -> float:
        """Calculate total return including capital gains and dividends."""
        return holding.capital_gains_pct + holding.dividend_yield_pct
    
    def calculate_portfolio_performance(
        self, 
        portfolio_summary: PortfolioSummary
    ) -> Dict[str, float]:
        """Calculate portfolio-level performance metrics."""
        all_holdings = portfolio_summary.get_all_holdings()
        
        if not all_holdings:
            return {
                'total_return_pct': 0.0,
                'capital_gains_pct': 0.0,
                'dividend_yield_pct': 0.0,
                'currency_effect_pct': 0.0
            }
        
        # Calculate value-weighted averages
        total_value = portfolio_summary.total_portfolio_value
        
        weighted_capital_gains = sum(
            (h.current_value_gbp / total_value) * h.capital_gains_pct 
            for h in all_holdings
        ) if total_value > 0 else 0.0
        
        weighted_dividend_yield = sum(
            (h.current_value_gbp / total_value) * h.dividend_yield_pct 
            for h in all_holdings
        ) if total_value > 0 else 0.0
        
        weighted_currency_effect = sum(
            (h.current_value_gbp / total_value) * h.currency_effect_pct 
            for h in all_holdings
        ) if total_value > 0 else 0.0
        
        weighted_total_return = sum(
            (h.current_value_gbp / total_value) * h.total_return_pct 
            for h in all_holdings
        ) if total_value > 0 else 0.0
        
        return {
            'total_return_pct': weighted_total_return,
            'capital_gains_pct': weighted_capital_gains,
            'dividend_yield_pct': weighted_dividend_yield,
            'currency_effect_pct': weighted_currency_effect
        }
    
    def calculate_market_performance(
        self, 
        market_summary: MarketSummary
    ) -> Dict[str, float]:
        """Calculate performance metrics for a specific market."""
        if not market_summary.holdings:
            return {
                'total_return_pct': 0.0,
                'capital_gains_pct': 0.0,
                'dividend_yield_pct': 0.0,
                'currency_effect_pct': 0.0
            }
        
        # Calculate value-weighted averages for this market
        total_value = market_summary.total_value
        
        weighted_capital_gains = sum(
            (h.current_value_gbp / total_value) * h.capital_gains_pct 
            for h in market_summary.holdings
        ) if total_value > 0 else 0.0
        
        weighted_dividend_yield = sum(
            (h.current_value_gbp / total_value) * h.dividend_yield_pct 
            for h in market_summary.holdings
        ) if total_value > 0 else 0.0
        
        weighted_currency_effect = sum(
            (h.current_value_gbp / total_value) * h.currency_effect_pct 
            for h in market_summary.holdings
        ) if total_value > 0 else 0.0
        
        weighted_total_return = sum(
            (h.current_value_gbp / total_value) * h.total_return_pct 
            for h in market_summary.holdings
        ) if total_value > 0 else 0.0
        
        return {
            'total_return_pct': weighted_total_return,
            'capital_gains_pct': weighted_capital_gains,
            'dividend_yield_pct': weighted_dividend_yield,
            'currency_effect_pct': weighted_currency_effect
        }
    
    def enhance_portfolio_with_performance(
        self,
        portfolio_summary: PortfolioSummary,
        transactions: List[Transaction],
        dividends: List[DividendIncome]
    ) -> PortfolioSummary:
        """Enhance portfolio summary with performance metrics."""
        # Calculate performance for each holding
        for market_summary in portfolio_summary.market_summaries.values():
            for holding in market_summary.holdings:
                self.calculate_holding_performance(
                    holding, transactions, dividends
                )
        
        self.logger.info(
            f"Enhanced {portfolio_summary.number_of_holdings} holdings "
            f"with performance metrics"
        )
        
        return portfolio_summary
    
    def generate_performance_report(
        self,
        portfolio_summary: PortfolioSummary
    ) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        portfolio_performance = self.calculate_portfolio_performance(
            portfolio_summary
        )
        
        market_performance = {}
        for market, summary in portfolio_summary.market_summaries.items():
            market_performance[market] = self.calculate_market_performance(
                summary
            )
        
        return {
            'portfolio_performance': portfolio_performance,
            'market_performance': market_performance,
            'top_performers': [
                {
                    'symbol': h.security.symbol,
                    'name': h.security.name,
                    'market': h.market,
                    'total_return_pct': h.total_return_pct,
                    'capital_gains_pct': h.capital_gains_pct,
                    'dividend_yield_pct': h.dividend_yield_pct,
                    'currency_effect_pct': h.currency_effect_pct
                }
                for h in sorted(
                    portfolio_summary.get_all_holdings(),
                    key=lambda x: x.total_return_pct,
                    reverse=True
                )[:10]
            ],
            'worst_performers': [
                {
                    'symbol': h.security.symbol,
                    'name': h.security.name,
                    'market': h.market,
                    'total_return_pct': h.total_return_pct,
                    'capital_gains_pct': h.capital_gains_pct,
                    'dividend_yield_pct': h.dividend_yield_pct,
                    'currency_effect_pct': h.currency_effect_pct
                }
                for h in sorted(
                    portfolio_summary.get_all_holdings(),
                    key=lambda x: x.total_return_pct
                )[:5]
            ]
        }
