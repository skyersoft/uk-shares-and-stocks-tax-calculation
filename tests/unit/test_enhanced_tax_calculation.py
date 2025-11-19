import pytest
from datetime import datetime
from unittest.mock import Mock

from src.main.python.models.domain_models import (
    Transaction, TransactionType, Security, Currency,
    TaxYearSummary, DividendSummary, CurrencyGainLossSummary,
    ComprehensiveTaxSummary, Disposal, DividendIncome, CurrencyGainLoss
)
from src.main.python.services.tax_year_calculator import EnhancedTaxYearCalculator, _is_in_tax_year
from src.main.python.services.disposal_calculator import UKDisposalCalculator
from src.main.python.services.dividend_processor import DividendProcessor
from src.main.python.services.currency_processor import CurrencyExchangeProcessor
from src.main.python.services.transaction_matcher import UKTransactionMatcher


@pytest.fixture
def mock_disposal_calculator():
    mock = Mock(spec=UKDisposalCalculator)
    # Configure mock to return a predefined single disposal
    # The _calculate_capital_gains method will call this for each sell transaction
    mock.calculate_disposal.side_effect = [
        Disposal(
            security=Security(symbol="AAPL"),
            sell_date=datetime(2024, 7, 1),
            quantity=10, proceeds=1200, cost_basis=1000, expenses=10, # Gain 190
            matching_rule="section104"
        ),
        Disposal(
            security=Security(symbol="GOOG"),
            sell_date=datetime(2024, 8, 1),
            quantity=5, proceeds=1100, cost_basis=900, expenses=5, # Gain 195
            matching_rule="section104"
        )
    ]
    return mock

@pytest.fixture
def mock_dividend_processor():
    mock = Mock(spec=DividendProcessor)
    # Configure mock to return a predefined dividend summary
    mock_dividends = [
        DividendIncome(
            security=Security(symbol="MSFT"),
            payment_date=datetime(2024, 6, 1),
            amount_gbp=50.0, withholding_tax_gbp=5.0
        ),
        DividendIncome(
            security=Security(symbol="AMZN"),
            payment_date=datetime(2024, 9, 1),
            amount_gbp=30.0, withholding_tax_gbp=3.0
        )
    ]
    dividend_summary = DividendSummary(tax_year="2024-2025")
    for div in mock_dividends:
        dividend_summary.add_dividend(div)
    
    mock.process_dividend_transactions.return_value = mock_dividends
    mock.calculate_dividend_summary.return_value = dividend_summary
    return mock

@pytest.fixture
def mock_currency_processor():
    mock = Mock(spec=CurrencyExchangeProcessor)
    # Configure mock to return a predefined currency gain/loss summary
    mock_currency_gains = [
        CurrencyGainLoss(
            currency_pair="USD.GBP", transaction_date=datetime(2024, 5, 1),
            amount_gbp=100, gain_loss_gbp=10,
            exchange_rate_used=0.8, exchange_rate_original=0.79 # Added rates
        ),
        CurrencyGainLoss(
            currency_pair="EUR.GBP", transaction_date=datetime(2024, 10, 1),
            amount_gbp=50, gain_loss_gbp=-5,
            exchange_rate_used=0.85, exchange_rate_original=0.86 # Added rates
        )
    ]
    currency_summary = CurrencyGainLossSummary(tax_year="2024-2025")
    for cg in mock_currency_gains:
        currency_summary.add_currency_transaction(cg)
    
    mock.process_currency_transactions.return_value = mock_currency_gains
    mock.calculate_currency_summary.return_value = currency_summary
    return mock

@pytest.fixture
def mock_transaction_matcher():
    mock = Mock(spec=UKTransactionMatcher)
    # Configure mock to return matched disposals for sell transactions
    mock.match_disposals.return_value = [
        (
            Transaction.create_sell_transaction("T2", Security(symbol="AAPL"), datetime(2024, 7, 1), -10, 120, Currency.create_base_currency(), commission=3, taxes=1.5),
            [Transaction.create_buy_transaction("T1", Security(symbol="AAPL"), datetime(2024, 1, 1), 10, 100, Currency.create_base_currency(), commission=2, taxes=1)]
        ),
        (
            Transaction.create_sell_transaction("T4", Security(symbol="GOOG"), datetime(2024, 8, 1), -5, 220, Currency.create_base_currency(), commission=2, taxes=1),
            [Transaction.create_buy_transaction("T3", Security(symbol="GOOG"), datetime(2024, 2, 1), 5, 200, Currency.create_base_currency(), commission=1, taxes=0.5)]
        )
    ]
    return mock

@pytest.fixture
def enhanced_calculator(mock_disposal_calculator, mock_dividend_processor, mock_currency_processor, mock_transaction_matcher):
    return EnhancedTaxYearCalculator(
        disposal_calculator=mock_disposal_calculator,
        dividend_processor=mock_dividend_processor,
        currency_processor=mock_currency_processor,
        transaction_matcher=mock_transaction_matcher # Pass the mock matcher
    )

@pytest.fixture
def sample_transactions():
    gbp = Currency.create_base_currency()
    usd = Currency.create_with_rate("USD", 0.8) # 1 USD = 0.8 GBP

    return [
        Transaction.create_buy_transaction("T1", Security(symbol="AAPL"), datetime(2024, 1, 1), 10, 100, gbp, commission=2, taxes=1),
        Transaction.create_sell_transaction("T2", Security(symbol="AAPL"), datetime(2024, 7, 1), -10, 120, gbp, commission=3, taxes=1.5),
        # For dividends, quantity is usually 0, price_per_unit is the dividend amount, taxes is withholding
        Transaction(transaction_id="DIV1", transaction_type=TransactionType.DIVIDEND, security=Security(symbol="MSFT"), date=datetime(2024, 6, 1), quantity=0, price_per_unit=50, commission=0, taxes=5, currency=usd),
        # For currency exchange, quantity is amount of foreign currency, price_per_unit is the exchange rate
        Transaction(transaction_id="FX1", transaction_type=TransactionType.CURRENCY_EXCHANGE, security=Security(symbol="USD.GBP"), date=datetime(2024, 5, 1), quantity=-100, price_per_unit=0.8, commission=0, taxes=0, currency=usd), # Selling 100 USD at 0.8 GBP/USD
        Transaction.create_buy_transaction("T3", Security(symbol="GOOG"), datetime(2024, 2, 1), 5, 200, gbp, commission=1, taxes=0.5),
        Transaction.create_sell_transaction("T4", Security(symbol="GOOG"), datetime(2024, 8, 1), -5, 220, gbp, commission=2, taxes=1),
        Transaction(transaction_id="DIV2", transaction_type=TransactionType.DIVIDEND, security=Security(symbol="AMZN"), date=datetime(2024, 9, 1), quantity=0, price_per_unit=30, commission=0, taxes=3, currency=usd),
        Transaction(transaction_id="FX2", transaction_type=TransactionType.CURRENCY_EXCHANGE, security=Security(symbol="EUR.GBP"), date=datetime(2024, 10, 1), quantity=50, price_per_unit=0.85, commission=0, taxes=0, currency=gbp) # Buying 50 EUR at 0.85 GBP/EUR
    ]


class TestEnhancedTaxYearCalculator:
    """Tests for the EnhancedTaxYearCalculator."""

    def test_calculate_comprehensive_tax_summary(self, enhanced_calculator, sample_transactions):
        tax_year = "2024-2025"
        summary = enhanced_calculator.calculate_comprehensive_tax_summary(sample_transactions, tax_year)

        assert isinstance(summary, ComprehensiveTaxSummary)
        assert summary.tax_year == tax_year

        # Verify capital gains summary (from mock)
        assert summary.capital_gains is not None
        # Mock disposals: AAPL gain = 1200 - 1000 - 10 = 190, GOOG gain = 1100 - 900 - 5 = 195
        assert summary.capital_gains.total_gains == 190 + 195  # 385 total gains
        assert summary.capital_gains.taxable_gain == max(0, (190 + 195) - 3000) # 385 - 3000 = 0

        # Verify dividend income summary (from mock)
        assert summary.dividend_income is not None
        assert summary.dividend_income.total_gross_gbp == 50 + 30 # From mock dividends
        assert summary.dividend_income.total_net_gbp == (50-5) + (30-3) # From mock dividends
        assert summary.dividend_income.taxable_dividend_income == max(0, (50-5) + (30-3) - 500) # 72 - 500 = 0

        # Verify currency gains summary (from mock)
        assert summary.currency_gains is not None
        assert summary.currency_gains.net_gain_loss == 10 - 5 # From mock currency gains

        # Verify total allowable costs
        # Only transactions within 2024-2025 tax year (April 6, 2024 to April 5, 2025):
        # T1 (Jan 1, 2024): OUTSIDE tax year (before April 6, 2024)
        # T2 (Jul 1, 2024): commission=3, taxes=1.5. Total = 4.5.
        # DIV1 (Jun 1, 2024): commission=0, taxes=5. Total = (0 + 5) * 0.8 = 4.
        # FX1 (May 1, 2024): commission=0, taxes=0. Total = 0.
        # T3 (Feb 1, 2024): OUTSIDE tax year (before April 6, 2024)
        # T4 (Aug 1, 2024): commission=2, taxes=1. Total = 3.
        # DIV2 (Sep 1, 2024): commission=0, taxes=3. Total = (0 + 3) * 0.8 = 2.4.
        # FX2 (Oct 1, 2024): commission=0, taxes=0. Total = 0.
        # Sum: 4.5 + 4 + 0 + 3 + 2.4 + 0 = 13.9.
        expected_total_costs = 13.9
        assert summary.total_allowable_costs == expected_total_costs

        # Verify total taxable income
        # Capital gains taxable: 0 (300 gain - 3000 allowance)
        # Dividend taxable: 0 (72 net - 500 allowance)
        # Currency taxable: 5 (10 gain - 5 loss)
        expected_total_taxable_income = 0 + 0 + (10 - 5)
        assert summary.total_taxable_income == expected_total_taxable_income

        # Verify allowances used
        assert summary.capital_gains_allowance_used == 385  # min(385, 3000)
        assert summary.capital_gains.total_gains == 385  # Actual total gains
        assert summary.dividend_allowance_used == 72  # min(72, 500)
        assert summary.dividend_income.total_net_gbp == 72  # From mock dividends
        assert summary.currency_gains_allowance_used == 0.0

    def test_calculate_total_allowable_costs(self, enhanced_calculator, sample_transactions):
        tax_year = "2024-2025"
        total_costs = enhanced_calculator._calculate_total_allowable_costs(sample_transactions, tax_year)
        
        # Only transactions within 2024-2025 tax year (April 6, 2024 to April 5, 2025):
        # T1 (Jan 1, 2024): OUTSIDE tax year (before April 6, 2024)
        # T2 (Jul 1, 2024): commission=3, taxes=1.5. Total = 4.5.
        # DIV1 (Jun 1, 2024): commission=0, taxes=5. Total = (0 + 5) * 0.8 = 4.
        # FX1 (May 1, 2024): commission=0, taxes=0. Total = 0.
        # T3 (Feb 1, 2024): OUTSIDE tax year (before April 6, 2024)
        # T4 (Aug 1, 2024): commission=2, taxes=1. Total = 3.
        # DIV2 (Sep 1, 2024): commission=0, taxes=3. Total = (0 + 3) * 0.8 = 2.4.
        # FX2 (Oct 1, 2024): commission=0, taxes=0. Total = 0.
        # Sum: 4.5 + 4 + 0 + 3 + 2.4 + 0 = 13.9.
        assert total_costs == 13.9

    def test_calculate_total_taxable_income(self, enhanced_calculator):
        # Create mock summaries for testing
        mock_capital_gains = Mock(spec=TaxYearSummary)
        mock_capital_gains.taxable_gain = 1000.0
        mock_capital_gains.total_gains = 4000.0 # Corrected to total_gains

        mock_dividends = Mock(spec=DividendSummary)
        mock_dividends.taxable_dividend_income = 200.0
        mock_dividends.total_net_gbp = 700.0 # For allowance calculation

        mock_currency_gains = Mock(spec=CurrencyGainLossSummary)
        mock_currency_gains.net_gain_loss = 50.0
        mock_currency_gains.total_gains = 100.0 # For allowance calculation

        total_taxable_income = enhanced_calculator._calculate_total_taxable_income(
            mock_capital_gains, mock_dividends, mock_currency_gains
        )
        assert total_taxable_income == 1000.0 + 200.0 + 50.0 # Sum of taxable amounts
        assert total_taxable_income == 1250.0

    def test_calculate_allowances_used(self, enhanced_calculator):
        summary = ComprehensiveTaxSummary(tax_year="2024-2025")
        
        # Case 1: Gains/income less than allowance
        summary.capital_gains = Mock(spec=TaxYearSummary)
        summary.capital_gains.total_gains = 1000.0 # Corrected to total_gains
        summary.dividend_income = Mock(spec=DividendSummary)
        summary.dividend_income.total_net_gbp = 200.0
        summary.currency_gains = Mock(spec=CurrencyGainLossSummary)
        summary.currency_gains.net_gain_loss = 50.0

        enhanced_calculator._calculate_allowances_used(summary)
        assert summary.capital_gains_allowance_used == 1000.0
        assert summary.dividend_allowance_used == 200.0
        assert summary.currency_gains_allowance_used == 0.0

        # Case 2: Gains/income more than allowance
        summary.capital_gains.total_gains = 5000.0 # Corrected to total_gains
        summary.dividend_income.total_net_gbp = 1000.0
        
        enhanced_calculator._calculate_allowances_used(summary)
        assert summary.capital_gains_allowance_used == 3000.0 # Capped at allowance
        assert summary.dividend_allowance_used == 500.0 # Capped at allowance

    def test_generate_tax_calculation_report(self, enhanced_calculator):
        # Let's mock the TaxYearSummary directly to control its properties for this test.
        # This is a unit test for EnhancedTaxYearCalculator, so mocking its dependencies is appropriate.
        cgt_summary = Mock(spec=TaxYearSummary)
        cgt_summary.tax_year = "2024-2025"
        cgt_summary.total_gains = 4000.0 # Corrected to total_gains
        cgt_summary.taxable_gain = 1000.0
        cgt_summary.disposals = [Mock(spec=Disposal)] # Needs to be a list for len()
        
        # To get taxable_dividend_income = 600.0 (after 500.0 allowance), total_net_gbp must be 1100.0
        div_summary = DividendSummary(tax_year="2024-2025", dividends=[
            DividendIncome(security=Security(symbol="MSFT"), payment_date=datetime(2024, 6, 1), amount_gbp=1100, withholding_tax_gbp=0), # Adjusted to make net 1100
        ])
        div_summary.total_gross_gbp = 1100.0 # Adjusted
        div_summary.total_net_gbp = 1100.0 # Adjusted
        div_summary.total_withholding_tax_gbp = 0.0 # Adjusted
        # taxable_dividend_income will be calculated by the property, no need to set it directly

        curr_summary = CurrencyGainLossSummary(tax_year="2024-2025", currency_transactions=[
            CurrencyGainLoss(currency_pair="USD.GBP", transaction_date=datetime(2024, 5, 1), amount_gbp=100, gain_loss_gbp=10, exchange_rate_used=1.0, exchange_rate_original=1.0),
            CurrencyGainLoss(currency_pair="EUR.GBP", transaction_date=datetime(2024, 10, 1), amount_gbp=50, gain_loss_gbp=-5, exchange_rate_used=1.0, exchange_rate_original=1.0)
        ])
        curr_summary.total_gains = 100.0
        curr_summary.total_losses = 20.0
        curr_summary.net_gain_loss = 80.0
        
        comp_summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=cgt_summary,
            dividend_income=div_summary,
            currency_gains=curr_summary,
            total_allowable_costs=50.0,
            total_taxable_income=1680.0 # 1000 (CGT) + 600 (Div) + 80 (Curr)
        )
        comp_summary.capital_gains_allowance_used = 3000.0
        comp_summary.dividend_allowance_used = 500.0

        report = enhanced_calculator.generate_tax_calculation_report(comp_summary)

        assert report['tax_year'] == "2024-2025"
        assert report['capital_gains']['total_gain'] == 4000.0
        assert report['capital_gains']['allowance_used'] == 3000.0
        assert report['capital_gains']['taxable_gain'] == 1000.0

        assert report['dividend_income']['total_gross'] == 1100.0 # Adjusted
        assert report['dividend_income']['total_net'] == 1100.0 # Adjusted
        assert report['dividend_income']['allowance_used'] == 500.0
        assert report['dividend_income']['taxable_income'] == 600.0 # After allowance
        assert report['dividend_income']['withholding_tax'] == 0.0 # Adjusted

        assert report['currency_gains']['total_gains'] == 100.0
        assert report['currency_gains']['total_losses'] == 20.0
        assert report['currency_gains']['net_gain_loss'] == 80.0
        assert report['currency_gains']['taxable_amount'] == 80.0

        assert report['summary']['total_allowable_costs'] == 50.0
        assert report['summary']['total_taxable_income'] == 1680.0
        
        # Check estimated tax liability
        estimated_tax = report['summary']['estimated_tax_liability']
        assert estimated_tax['capital_gains_tax'] == 1000 * 0.10
        assert estimated_tax['dividend_tax'] == 600 * 0.0875
        assert estimated_tax['currency_gains_tax'] == 80 * 0.10
        assert estimated_tax['total_estimated_tax'] == (1000 * 0.10) + (600 * 0.0875) + (80 * 0.10)

class TestComprehensiveTaxSummaryModel:
    """Tests for the ComprehensiveTaxSummary domain model."""

    def test_total_tax_liability(self):
        cgt_summary = Mock(spec=TaxYearSummary)
        cgt_summary.taxable_gain = 1000.0
        div_summary = Mock(spec=DividendSummary)
        div_summary.taxable_dividend_income = 200.0
        curr_summary = Mock(spec=CurrencyGainLossSummary)
        curr_summary.net_gain_loss = 50.0

        summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=cgt_summary,
            dividend_income=div_summary,
            currency_gains=curr_summary
        )
        
        expected_tax_liability = (1000 * 0.10) + (200 * 0.0875) + (50 * 0.10)
        assert summary.total_tax_liability == expected_tax_liability

    def test_summary_by_income_type(self):
        cgt_summary = Mock(spec=TaxYearSummary)
        cgt_summary.taxable_gain = 1000.0
        div_summary = Mock(spec=DividendSummary)
        div_summary.total_net_gbp = 700.0
        curr_summary = Mock(spec=CurrencyGainLossSummary)
        curr_summary.net_gain_loss = 50.0

        summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=cgt_summary,
            dividend_income=div_summary,
            currency_gains=curr_summary,
            total_allowable_costs=150.0
        )
        
        breakdown = summary.summary_by_income_type
        assert breakdown['capital_gains'] == 1000.0
        assert breakdown['dividend_income'] == 700.0
        assert breakdown['currency_gains'] == 50.0
        assert breakdown['total_allowable_costs'] == 150.0

    def test_has_taxable_income(self):
        summary = ComprehensiveTaxSummary(tax_year="2024-2025", total_taxable_income=100.0)
        assert summary.has_taxable_income is True
        
        summary.total_taxable_income = 0.0
        assert summary.has_taxable_income is False

    def test_requires_tax_return(self):
        # Case 1: CGT above allowance
        cgt_summary = Mock(spec=TaxYearSummary)
        cgt_summary.taxable_gain = 10.0 # Any positive taxable gain
        summary = ComprehensiveTaxSummary(tax_year="2024-2025", capital_gains=cgt_summary)
        assert summary.requires_tax_return is True

        # Case 2: Dividend income above allowance
        div_summary = Mock(spec=DividendSummary)
        div_summary.taxable_dividend_income = 10.0 # Any positive taxable dividend
        summary = ComprehensiveTaxSummary(tax_year="2024-2025", dividend_income=div_summary)
        assert summary.requires_tax_return is True

        # Case 3: Currency gains above de minimis
        curr_summary = Mock(spec=CurrencyGainLossSummary)
        curr_summary.net_gain_loss = 1001.0 # Above £1,000 de minimis
        summary = ComprehensiveTaxSummary(tax_year="2024-2025", currency_gains=curr_summary)
        assert summary.requires_tax_return is True

        # Case 4: No taxable income requiring return
        summary = ComprehensiveTaxSummary(tax_year="2024-2025")
        assert summary.requires_tax_return is False

    def test_get_allowances_summary(self):
        summary = ComprehensiveTaxSummary(tax_year="2024-2025")
        summary.capital_gains_allowance_used = 1500.0
        summary.dividend_allowance_used = 250.0

        allowances = summary.get_allowances_summary()
        assert allowances['capital_gains']['allowance'] == 3000.0
        assert allowances['capital_gains']['used'] == 1500.0
        assert allowances['capital_gains']['remaining'] == 1500.0

        assert allowances['dividend']['allowance'] == 500.0
        assert allowances['dividend']['used'] == 250.0
        assert allowances['dividend']['remaining'] == 250.0

    def test_get_tax_efficiency_metrics(self):
        cgt_summary = Mock(spec=TaxYearSummary)
        cgt_summary.total_gains = 4000.0
        cgt_summary.taxable_gain = 1000.0 # After allowance
        
        div_summary = Mock(spec=DividendSummary)
        div_summary.total_gross_gbp = 700.0
        div_summary.total_net_gbp = 600.0
        div_summary.taxable_dividend_income = 100.0 # After allowance

        curr_summary = Mock(spec=CurrencyGainLossSummary)
        curr_summary.total_gains = 100.0
        curr_summary.net_gain_loss = 80.0 # Taxable amount

        summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            capital_gains=cgt_summary,
            dividend_income=div_summary,
            currency_gains=curr_summary,
            total_allowable_costs=50.0,
            total_taxable_income=1180.0 # 1000 + 100 + 80
        )
        summary.capital_gains_allowance_used = 3000.0
        summary.dividend_allowance_used = 400.0 # Example usage

        metrics = summary.get_tax_efficiency_metrics()

        total_income = 4000.0 + 700.0 + 100.0 # Total gains/gross income
        expected_effective_tax_rate = (summary.total_tax_liability / total_income) * 100
        assert metrics['effective_tax_rate'] == pytest.approx(expected_effective_tax_rate, rel=1e-6)

        total_allowances_available = 3000.0 + 500.0
        allowances_used = 3000.0 + 400.0
        expected_allowance_utilization = (allowances_used / total_allowances_available) * 100
        assert metrics['allowance_utilization'] == pytest.approx(expected_allowance_utilization, rel=1e-6)

        # Calculate expected tax saved:
        # CGT saved: 3000.0 * 0.10 = 300.0
        # Dividend tax saved: 400.0 * 0.0875 = 35.0
        expected_tax_saved = (3000.0 * 0.10) + (400.0 * 0.0875)
        assert metrics['tax_saved_by_allowances'] == pytest.approx(expected_tax_saved, rel=1e-6)

    def test_is_in_tax_year_utility(self):
        """Test the _is_in_tax_year utility function."""
        # Test dates in 2024-2025 tax year (April 6, 2024 to April 5, 2025)
        assert _is_in_tax_year(datetime(2024, 4, 6), "2024-2025")  # First day
        assert _is_in_tax_year(datetime(2024, 12, 25), "2024-2025")  # Middle
        assert _is_in_tax_year(datetime(2025, 4, 5), "2024-2025")  # Last day
        
        # Test dates outside 2024-2025 tax year
        assert not _is_in_tax_year(datetime(2024, 4, 5), "2024-2025")  # One day before
        assert not _is_in_tax_year(datetime(2025, 4, 6), "2024-2025")  # One day after
        
        # Test dates in 2023-2024 tax year
        assert _is_in_tax_year(datetime(2023, 4, 6), "2023-2024")  # First day
        assert _is_in_tax_year(datetime(2024, 4, 5), "2023-2024")  # Last day
