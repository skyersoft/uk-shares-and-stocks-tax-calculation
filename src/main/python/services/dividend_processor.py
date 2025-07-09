import logging
from datetime import datetime
from typing import List, Dict, Any

from ..models.domain_models import Transaction, TransactionType, DividendIncome, DividendSummary, Security, Currency


class DividendProcessor:
    """Service for processing dividend income transactions."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def process_dividend_transactions(
        self, 
        transactions: List[Transaction]
    ) -> List[DividendIncome]:
        """Process dividend transactions into dividend income records."""
        dividend_transactions = [
            t for t in transactions 
            if t.transaction_type == TransactionType.DIVIDEND
        ]
        
        dividends = []
        for transaction in dividend_transactions:
            dividend = self._create_dividend_from_transaction(transaction)
            dividends.append(dividend)
        
        return dividends
    
    def _create_dividend_from_transaction(
        self, 
        transaction: Transaction
    ) -> DividendIncome:
        """Convert a dividend transaction to dividend income."""
        # Extract dividend-specific data
        # For dividend transactions, price_per_unit contains the total amount
        amount_foreign = abs(transaction.price_per_unit)
        amount_gbp = amount_foreign * transaction.currency.rate_to_base
        withholding_tax_foreign = transaction.taxes
        withholding_tax_gbp = transaction.taxes_in_base_currency

        self.logger.info(
            f"Processing dividend: {amount_foreign} {transaction.currency.code} "
            f"(£{amount_gbp:.2f}), withholding tax: {withholding_tax_foreign} "
            f"{transaction.currency.code} (£{withholding_tax_gbp:.2f})"
        )
        
        # Determine dividend type from transaction data
        dividend_type = self._determine_dividend_type(transaction)
        
        return DividendIncome(
            security=transaction.security,
            payment_date=transaction.date,
            amount_foreign_currency=amount_foreign,
            foreign_currency=transaction.currency,
            amount_gbp=amount_gbp,
            withholding_tax_foreign=withholding_tax_foreign,
            withholding_tax_gbp=withholding_tax_gbp,
            dividend_type=dividend_type
        )
    
    def _determine_dividend_type(self, transaction: Transaction) -> str:
        """Determine dividend type from transaction data."""
        # This could be enhanced to parse transaction notes/codes
        # For now, default to ORDINARY
        return "ORDINARY"
    
    def calculate_dividend_summary(
        self, 
        dividends: List[DividendIncome], 
        tax_year: str
    ) -> DividendSummary:
        """Calculate dividend summary for a tax year."""
        summary = DividendSummary(tax_year=tax_year)
        
        for dividend in dividends:
            if self._is_in_tax_year(dividend.payment_date, tax_year):
                summary.add_dividend(dividend)
        
        return summary
    
    def _is_in_tax_year(self, date: datetime, tax_year: str) -> bool:
        """Check if a date falls within the specified UK tax year."""
        # UK tax year runs April 6 to April 5
        year_parts = tax_year.split('-')
        start_year = int(year_parts[0])
        
        tax_year_start = datetime(start_year, 4, 6)
        tax_year_end = datetime(start_year + 1, 4, 5)
        
        return tax_year_start <= date <= tax_year_end
    
    def calculate_foreign_tax_credit(
        self, 
        dividend_summary: DividendSummary
    ) -> float:
        """Calculate potential foreign tax credit for withholding taxes."""
        # This is a simplified calculation
        # Real implementation would need to consider double taxation treaties
        foreign_dividends = dividend_summary.get_foreign_dividends()
        
        total_foreign_withholding = sum(
            d.withholding_tax_gbp for d in foreign_dividends
        )
        
        # Foreign tax credit is typically limited to UK tax that would be due
        # This is a placeholder calculation
        return total_foreign_withholding
    
    def generate_dividend_report(
        self, 
        dividend_summary: DividendSummary
    ) -> Dict[str, Any]:
        """Generate a comprehensive dividend report."""
        foreign_dividends = dividend_summary.get_foreign_dividends()
        uk_dividends = [
            d for d in dividend_summary.dividends 
            if d not in foreign_dividends
        ]
        
        return {
            'tax_year': dividend_summary.tax_year,
            'total_dividends': len(dividend_summary.dividends),
            'total_gross_income': dividend_summary.total_gross_gbp,
            'total_withholding_tax': dividend_summary.total_withholding_tax_gbp,
            'total_net_income': dividend_summary.total_net_gbp,
            'dividend_allowance_used': dividend_summary.dividend_allowance_used,
            'taxable_income': dividend_summary.taxable_dividend_income,
            'foreign_dividends': {
                'count': len(foreign_dividends),
                'gross_income': sum(d.gross_dividend_gbp for d in foreign_dividends),
                'withholding_tax': sum(d.withholding_tax_gbp for d in foreign_dividends)
            },
            'uk_dividends': {
                'count': len(uk_dividends),
                'gross_income': sum(d.gross_dividend_gbp for d in uk_dividends)
            },
            'securities': dividend_summary.get_dividends_by_security()
        }
