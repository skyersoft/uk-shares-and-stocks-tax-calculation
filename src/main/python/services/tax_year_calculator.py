"""Tax year calculator implementation."""
import logging
from datetime import datetime
from typing import List, Any, Dict

from ..models.domain_models import (
    Disposal,
    TaxYearSummary,
    Transaction,
    ComprehensiveTaxSummary,
    DividendSummary,
    CurrencyGainLoss,
    CurrencyGainLossSummary,
    TransactionType
)
from ..config.tax_config import TAX_YEARS # Re-adding this as it was used in the original is_in_tax_year, which I removed. I need to check if it's actually used in the new _is_in_tax_year.
from .disposal_calculator import UKDisposalCalculator as DisposalCalculator
from .dividend_processor import DividendProcessor
from .currency_processor import CurrencyExchangeProcessor
from .transaction_matcher import UKTransactionMatcher # Import TransactionMatcher

def _is_in_tax_year(date: datetime, tax_year: str) -> bool:
    """Check if a date falls within the specified UK tax year."""
    # UK tax year runs April 6 to April 5
    year_parts = tax_year.split('-')
    start_year = int(year_parts[0])
    
    tax_year_start = datetime(start_year, 4, 6)
    tax_year_end = datetime(start_year + 1, 4, 5)
    
    return tax_year_start <= date <= tax_year_end


class EnhancedTaxYearCalculator:
    """Enhanced tax year calculator including all income types."""
    
    def __init__(
        self,
        disposal_calculator: DisposalCalculator,
        dividend_processor: DividendProcessor,
        currency_processor: CurrencyExchangeProcessor,
        transaction_matcher: UKTransactionMatcher # Add transaction_matcher
    ):
        self.disposal_calculator = disposal_calculator
        self.dividend_processor = dividend_processor
        self.currency_processor = currency_processor
        self.transaction_matcher = transaction_matcher # Store transaction_matcher
        self.logger = logging.getLogger(__name__)
    
    def calculate_comprehensive_tax_summary(
        self, 
        transactions: List[Transaction], 
        tax_year: str
    ) -> ComprehensiveTaxSummary:
        """Calculate comprehensive tax summary including all income types."""
        
        self.logger.info(f"Calculating comprehensive tax summary for {tax_year}")
        
        # Calculate capital gains (existing functionality)
        capital_gains_summary = self._calculate_capital_gains(
            transactions, tax_year
        )
        
        # Calculate dividend income
        dividend_summary = self.dividend_processor.calculate_dividend_summary(
            self.dividend_processor.process_dividend_transactions(transactions),
            tax_year
        )
        
        # Calculate currency gains/losses
        currency_summary = self._calculate_currency_summary(
            self.currency_processor.process_currency_transactions(transactions),
            tax_year
        )
        
        # Calculate total allowable costs
        total_costs = self._calculate_total_allowable_costs(transactions, tax_year)
        
        # Calculate total taxable income
        total_taxable_income = self._calculate_total_taxable_income(
            capital_gains_summary, dividend_summary, currency_summary
        )
        
        comprehensive_summary = ComprehensiveTaxSummary(
            tax_year=tax_year,
            capital_gains=capital_gains_summary,
            dividend_income=dividend_summary,
            currency_gains=currency_summary,
            total_allowable_costs=total_costs,
            total_taxable_income=total_taxable_income
        )
        
        # Calculate tax allowances used
        self._calculate_allowances_used(comprehensive_summary)
        
        self.logger.info(
            f"Comprehensive tax summary completed: "
            f"£{total_taxable_income:.2f} total taxable income"
        )
        
        return comprehensive_summary
    
    def _calculate_capital_gains(
        self, 
        transactions: List[Transaction], 
        tax_year: str
    ) -> TaxYearSummary:
        """Calculate capital gains using existing disposal calculator."""
        # Filter stock transactions only
        stock_transactions = [
            t for t in transactions 
            if t.transaction_type in [TransactionType.BUY, TransactionType.SELL]
        ]
        
        # Match disposals using the injected transaction_matcher
        matched_disposals = self.transaction_matcher.match_disposals(stock_transactions)
        
        disposals = []
        for sell_tx, matched_buys in matched_disposals:
            disposal = self.disposal_calculator.calculate_disposal(sell_tx, matched_buys)
            disposals.append(disposal)
        
        # Filter disposals by tax year and calculate summary
        tax_year_disposals = [
            d for d in disposals 
            if _is_in_tax_year(d.sell_date, tax_year)
        ]
        
        return self._create_capital_gains_summary(tax_year_disposals, tax_year)
    
    def _calculate_currency_summary(
        self, 
        currency_gains_losses: List[CurrencyGainLoss], 
        tax_year: str
    ) -> CurrencyGainLossSummary:
        """Calculate currency summary for the tax year."""
        return self.currency_processor.calculate_currency_summary(
            currency_gains_losses, tax_year
        )
    
    def _calculate_total_allowable_costs(
        self, 
        transactions: List[Transaction], 
        tax_year: str
    ) -> float:
        """Calculate total allowable costs including all fees and commissions."""
        total_costs = 0.0
        
        for transaction in transactions:
            if _is_in_tax_year(transaction.date, tax_year):
                # Include commissions
                if hasattr(transaction, 'commission_in_base_currency'):
                    total_costs += transaction.commission_in_base_currency
                
                # Include taxes (where allowable)
                if hasattr(transaction, 'taxes_in_base_currency'):
                    total_costs += transaction.taxes_in_base_currency
                
                # Include other allowable costs
                # (stamp duty, transfer fees, etc.)
                if hasattr(transaction, 'other_fees_in_base_currency'):
                    total_costs += transaction.other_fees_in_base_currency
        
        self.logger.info(f"Total allowable costs for {tax_year}: £{total_costs:.2f}")
        return total_costs
    
    def _calculate_total_taxable_income(
        self,
        capital_gains: TaxYearSummary,
        dividends: DividendSummary,
        currency_gains: CurrencyGainLossSummary
    ) -> float:
        """Calculate total taxable income from all sources."""
        
        # Capital gains (after allowance)
        capital_gains_taxable = max(0, capital_gains.taxable_gain) if capital_gains else 0.0
        
        # Dividend income (after allowance)
        dividend_taxable = dividends.taxable_dividend_income if dividends else 0.0
        
        # Currency gains (only gains, losses can offset)
        currency_taxable = max(0, currency_gains.net_gain_loss) if currency_gains else 0.0
        
        total = capital_gains_taxable + dividend_taxable + currency_taxable
        
        self.logger.info(
            f"Taxable income breakdown: "
            f"Capital gains: £{capital_gains_taxable:.2f}, "
            f"Dividends: £{dividend_taxable:.2f}, "
            f"Currency: £{currency_taxable:.2f}, "
            f"Total: £{total:.2f}"
        )
        
        return total
    
    def _calculate_allowances_used(
        self, 
        comprehensive_summary: ComprehensiveTaxSummary
    ) -> None:
        """Calculate tax allowances used."""
        
        # UK tax allowances for 2024-25 (make configurable in future)
        CGT_ALLOWANCE = 3000.0  # Reduced from £6,000 in 2023-24
        DIVIDEND_ALLOWANCE = 500.0  # Reduced from £1,000 in 2023-24
        
        # Capital gains allowance
        if comprehensive_summary.capital_gains:
            cgt_gain = comprehensive_summary.capital_gains.total_gains # Corrected to total_gains
            comprehensive_summary.capital_gains_allowance_used = min(cgt_gain, CGT_ALLOWANCE)
        
        # Dividend allowance
        if comprehensive_summary.dividend_income:
            dividend_income = comprehensive_summary.dividend_income.total_net_gbp
            comprehensive_summary.dividend_allowance_used = min(dividend_income, DIVIDEND_ALLOWANCE)
        
        # Currency gains (no specific allowance, but losses can offset gains)
        if comprehensive_summary.currency_gains:
            comprehensive_summary.currency_gains_allowance_used = 0.0
    
    def _create_capital_gains_summary(
        self, 
        disposals: List[Disposal], 
        tax_year: str
    ) -> TaxYearSummary:
        """Create capital gains summary from disposals."""
        total_proceeds = sum(d.proceeds for d in disposals)
        total_cost = sum(d.cost_basis for d in disposals)
        total_expenses = sum(d.expenses for d in disposals)
        
        # Calculate total gains and losses
        total_gains = 0.0
        total_losses = 0.0
        for disposal in disposals:
            gain = disposal.proceeds - disposal.cost_basis - disposal.expenses
            if gain > 0:
                total_gains += gain
            else:
                total_losses += abs(gain)
        
        # Calculate net gain and apply CGT allowance
        net_gain = total_gains - total_losses
        CGT_ALLOWANCE = 3000.0  # 2024-25 rate
        annual_exemption_used = min(CGT_ALLOWANCE, max(0, net_gain))
        taxable_gain = max(0, net_gain - annual_exemption_used)
        
        summary = TaxYearSummary(
            tax_year=tax_year,
            disposals=disposals
        )
        
        # Set all required fields
        summary.total_proceeds = total_proceeds
        summary.total_gains = total_gains
        summary.total_losses = total_losses
        summary.net_gain = net_gain
        summary.annual_exemption_used = annual_exemption_used
        summary.taxable_gain = taxable_gain
        
        return summary
    
    def generate_tax_calculation_report(
        self, 
        comprehensive_summary: ComprehensiveTaxSummary
    ) -> Dict[str, Any]:
        """Generate detailed tax calculation report."""
        
        return {
            'tax_year': comprehensive_summary.tax_year,
            'capital_gains': {
                'total_gain': comprehensive_summary.capital_gains.total_gains if comprehensive_summary.capital_gains else 0.0,
                'allowance_used': comprehensive_summary.capital_gains_allowance_used,
                'taxable_gain': comprehensive_summary.capital_gains.taxable_gain if comprehensive_summary.capital_gains else 0.0,
                'number_of_disposals': len(comprehensive_summary.capital_gains.disposals) if comprehensive_summary.capital_gains else 0
            },
            'dividend_income': {
                'total_gross': comprehensive_summary.dividend_income.total_gross_gbp if comprehensive_summary.dividend_income else 0.0,
                'total_net': comprehensive_summary.dividend_income.total_net_gbp if comprehensive_summary.dividend_income else 0.0,
                'allowance_used': comprehensive_summary.dividend_allowance_used,
                'taxable_income': comprehensive_summary.dividend_income.taxable_dividend_income if comprehensive_summary.dividend_income else 0.0,
                'withholding_tax': comprehensive_summary.dividend_income.total_withholding_tax_gbp if comprehensive_summary.dividend_income else 0.0
            },
            'currency_gains': {
                'total_gains': comprehensive_summary.currency_gains.total_gains if comprehensive_summary.currency_gains else 0.0,
                'total_losses': comprehensive_summary.currency_gains.total_losses if comprehensive_summary.currency_gains else 0.0,
                'net_gain_loss': comprehensive_summary.currency_gains.net_gain_loss if comprehensive_summary.currency_gains else 0.0,
                'taxable_amount': max(0, comprehensive_summary.currency_gains.net_gain_loss) if comprehensive_summary.currency_gains else 0.0
            },
            'summary': {
                'total_allowable_costs': comprehensive_summary.total_allowable_costs,
                'total_taxable_income': comprehensive_summary.total_taxable_income,
                'estimated_tax_liability': self._estimate_tax_liability(comprehensive_summary)
            }
        }
    
    def _estimate_tax_liability(
        self, 
        comprehensive_summary: ComprehensiveTaxSummary
    ) -> Dict[str, float]:
        """Estimate tax liability (simplified calculation)."""
        
        # This is a simplified calculation - real implementation would need
        # to consider individual tax bands, rates, and circumstances
        
        # Basic rate CGT: 10% (18% for residential property)
        # Higher rate CGT: 20% (28% for residential property)
        # Dividend tax rates: 8.75% basic, 33.75% higher, 39.35% additional
        
        cgt_taxable = comprehensive_summary.capital_gains.taxable_gain if comprehensive_summary.capital_gains else 0.0
        dividend_taxable = comprehensive_summary.dividend_income.taxable_dividend_income if comprehensive_summary.dividend_income else 0.0
        currency_taxable = max(0, comprehensive_summary.currency_gains.net_gain_loss) if comprehensive_summary.currency_gains else 0.0
        
        # Assume basic rate for simplicity
        estimated_cgt_tax = cgt_taxable * 0.10  # 10% basic rate
        estimated_dividend_tax = dividend_taxable * 0.0875  # 8.75% basic rate
        estimated_currency_tax = currency_taxable * 0.10  # Treated as capital gains
        
        return {
            'capital_gains_tax': estimated_cgt_tax,
            'dividend_tax': estimated_dividend_tax,
            'currency_gains_tax': estimated_currency_tax,
            'total_estimated_tax': estimated_cgt_tax + estimated_dividend_tax + estimated_currency_tax
        }
    
    def calculate_tax_year_summary(self, transactions_or_disposals, tax_year: str) -> TaxYearSummary:
        """Calculate tax year summary for capital gains.
        
        Args:
            transactions_or_disposals: List of transactions or disposals to be included in the summary
            tax_year: The tax year to calculate the summary for (e.g., "2024-2025")
            
        Returns:
            TaxYearSummary: Summary of capital gains calculations
        """
        # Check if we received transactions or disposals
        if not transactions_or_disposals:
            return self._create_capital_gains_summary([], tax_year)
        
        # Check the type of the first item to determine what we received
        first_item = transactions_or_disposals[0]
        
        if hasattr(first_item, 'transaction_type'):
            # We received transactions, process them normally
            transactions = transactions_or_disposals
            
            # Filter stock transactions only
            stock_transactions = [
                t for t in transactions 
                if t.transaction_type in [TransactionType.BUY, TransactionType.SELL]
            ]
            
            # Match disposals using the transaction matcher
            matched_disposals = self.transaction_matcher.match_disposals(stock_transactions)
            
            # Calculate disposals
            disposals = []
            for sell_tx, matched_buys in matched_disposals:
                disposal = self.disposal_calculator.calculate_disposal(sell_tx, matched_buys)
                disposals.append(disposal)
            
            # Filter disposals by tax year
            tax_year_disposals = [
                d for d in disposals 
                if _is_in_tax_year(d.sell_date, tax_year)
            ]
        else:
            # We received disposals directly, filter by tax year
            disposals = transactions_or_disposals
            tax_year_disposals = [
                d for d in disposals 
                if _is_in_tax_year(d.sell_date, tax_year)
            ]
        
        return self._create_capital_gains_summary(tax_year_disposals, tax_year)
