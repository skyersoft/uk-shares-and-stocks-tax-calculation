import unittest
from datetime import datetime
from decimal import Decimal
from src.main.python.models.domain_models import (
    Transaction, TransactionType, Security, Currency, 
    ComprehensiveTaxSummary, TaxYearSummary, Disposal
)
from src.main.python.services.tax_year_calculator import EnhancedTaxYearCalculator
from src.main.python.services.disposal_calculator import UKDisposalCalculator
from src.main.python.services.dividend_processor import DividendProcessor
from src.main.python.services.currency_processor import CurrencyExchangeProcessor
from src.main.python.services.transaction_matcher import UKTransactionMatcher

class TestCGTRateChange(unittest.TestCase):
    def setUp(self):
        self.matcher = UKTransactionMatcher()
        self.disposal_calculator = UKDisposalCalculator()
        self.dividend_processor = DividendProcessor()
        self.currency_processor = CurrencyExchangeProcessor()
        self.calculator = EnhancedTaxYearCalculator(
            self.disposal_calculator,
            self.dividend_processor,
            self.currency_processor,
            self.matcher
        )
        self.security = Security("TEST", "Test Corp", "US0000000001")
        self.gbp = Currency("GBP", 1.0)

    def test_post_october_2024_tax_rate(self):
        # Create a disposal after Oct 30, 2024
        # Gain of £10,000. AEA is £3,000. Taxable is £7,000.
        # Old Basic Rate (10%): £700 tax
        # New Basic Rate (18%): £1,260 tax
        
        # We need to mock the summary because _estimate_tax_liability uses it
        # But let's try to use the public method calculate_comprehensive_tax_summary if possible, 
        # or just call _estimate_tax_liability directly with a constructed summary.
        
        disposal = Disposal(
            security=self.security,
            sell_date=datetime(2024, 11, 1),
            quantity=100,
            proceeds=20000.0,
            cost_basis=10000.0,
            expenses=0.0,
            matching_rule="same-day"
        )
        
        cgt_summary = TaxYearSummary(
            tax_year="2024-2025",
            disposals=[disposal]
        )
        cgt_summary.total_gains = 10000.0
        cgt_summary.net_gain = 10000.0
        cgt_summary.annual_exemption_used = 3000.0
        cgt_summary.taxable_gain = 7000.0
        
        comp_summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=cgt_summary,
            dividend_income=None,
            currency_gains=None,
            total_allowable_costs=0.0,
            total_taxable_income=7000.0
        )
        
        estimates = self.calculator._estimate_tax_liability(comp_summary)
        
        print(f"Estimated CGT: {estimates['capital_gains_tax']}")
        
        # Current implementation assumes 10%, so it will return 700.
        # We want it to return 1260 (18% of 7000).
        
        # Assert that it currently fails (returns old rate)
        # Or assert what we WANT (and expect it to fail)
        self.assertEqual(estimates['capital_gains_tax'], 1260.0, "Should use 18% rate for post-Oct 2024 disposals")

if __name__ == '__main__':
    unittest.main()
