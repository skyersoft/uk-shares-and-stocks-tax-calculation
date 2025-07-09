"""Tests for Phase 5 Performance Calculator Service."""
import pytest
from datetime import datetime, timedelta
from src.main.python.services.performance_calculator import PerformanceCalculator
from src.main.python.models.domain_models import (
    Transaction, TransactionType, Security, Currency, Holding, 
    DividendIncome, PortfolioSummary, MarketSummary, AssetClass
)


@pytest.fixture
def performance_calculator():
    """Fixture for PerformanceCalculator instance."""
    return PerformanceCalculator()


@pytest.fixture
def mock_security_aapl():
    """Mock Security object for Apple Inc."""
    return Security(
        isin="US0378331005", 
        symbol="AAPL", 
        name="Apple Inc",
        asset_class=AssetClass.STOCK,
        listing_exchange="NASDAQ"
    )


@pytest.fixture
def mock_currency_usd():
    """Mock USD Currency object."""
    return Currency(code="USD", rate_to_base=0.75)


@pytest.fixture
def mock_currency_gbp():
    """Mock GBP Currency object."""
    return Currency(code="GBP", rate_to_base=1.0)


class TestPerformanceCalculator:
    """Test cases for the PerformanceCalculator service."""

    def test_calculate_capital_gains_pct(
        self, 
        performance_calculator, 
        mock_security_aapl
    ):
        """Test capital gains percentage calculation."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0,  # Total cost = 15000
            current_value_gbp=18000.0,
            unrealized_gain_loss=3000.0
        )
        
        capital_gains_pct = performance_calculator._calculate_capital_gains_pct(
            holding
        )
        
        # (3000 / 15000) * 100 = 20%
        assert capital_gains_pct == 20.0

    def test_calculate_capital_gains_pct_zero_cost(
        self, 
        performance_calculator, 
        mock_security_aapl
    ):
        """Test capital gains percentage with zero cost."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=0.0,
            unrealized_gain_loss=1000.0
        )
        
        capital_gains_pct = performance_calculator._calculate_capital_gains_pct(
            holding
        )
        
        assert capital_gains_pct == 0.0

    def test_calculate_dividend_yield(
        self, 
        performance_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test dividend yield calculation."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            current_value_gbp=15000.0
        )
        
        # Create dividend income for the last 12 months
        recent_date = datetime.now() - timedelta(days=30)
        dividends = [
            DividendIncome(
                security=mock_security_aapl,
                payment_date=recent_date,
                amount_gbp=300.0,  # £300 dividend
                foreign_currency=mock_currency_usd
            )
        ]
        
        dividend_yield = performance_calculator._calculate_dividend_yield(
            holding, dividends
        )
        
        # (300 / 15000) * 100 = 2%
        assert dividend_yield == 2.0

    def test_calculate_dividend_yield_no_dividends(
        self, 
        performance_calculator, 
        mock_security_aapl
    ):
        """Test dividend yield with no dividends."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            current_value_gbp=15000.0
        )
        
        dividend_yield = performance_calculator._calculate_dividend_yield(
            holding, []
        )
        
        assert dividend_yield == 0.0

    def test_calculate_dividend_yield_old_dividends(
        self, 
        performance_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test dividend yield with old dividends (>12 months)."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            current_value_gbp=15000.0
        )
        
        # Create dividend income older than 12 months
        old_date = datetime.now() - timedelta(days=400)
        dividends = [
            DividendIncome(
                security=mock_security_aapl,
                payment_date=old_date,
                amount_gbp=300.0,
                foreign_currency=mock_currency_usd
            )
        ]
        
        dividend_yield = performance_calculator._calculate_dividend_yield(
            holding, dividends
        )
        
        assert dividend_yield == 0.0  # Old dividends should be ignored

    def test_calculate_currency_effect_gbp_security(
        self,
        performance_calculator,
        mock_currency_gbp
    ):
        """Test currency effect for GBP security (should be 0)."""
        security = Security(
            isin="GB0002875804",
            symbol="HSBA",
            name="HSBC Holdings"
        )

        holding = Holding(
            security=security,
            quantity=100.0
        )

        transactions = [
            Transaction.create_buy_transaction(
                transaction_id="T1",
                security=security,
                date=datetime(2024, 1, 1),
                quantity=100,
                price_per_unit=600.0,
                currency=mock_currency_gbp
            )
        ]

        currency_effect = performance_calculator._calculate_currency_effect(
            holding, transactions
        )

        assert currency_effect == 0.0  # No currency effect for GBP securities

    def test_calculate_currency_effect_usd_security(
        self,
        performance_calculator,
        mock_security_aapl,
        mock_currency_usd
    ):
        """Test currency effect for USD security."""
        # Security doesn't need currency field - it's in the transaction
        
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0
        )
        
        # Create transactions with different exchange rates
        old_currency = Currency(code="USD", rate_to_base=0.80)  # Old rate
        current_currency = Currency(code="USD", rate_to_base=0.75)  # Current rate

        transactions = [
            Transaction.create_buy_transaction(
                transaction_id="T1",
                security=mock_security_aapl,
                date=datetime(2024, 1, 1),
                quantity=100,
                price_per_unit=150.0,
                currency=old_currency  # Purchased at 0.80 rate
            ),
            # Add a more recent transaction to establish current rate
            Transaction.create_sell_transaction(
                transaction_id="T2",
                security=mock_security_aapl,
                date=datetime(2024, 6, 1),
                quantity=-10,  # Small sale to establish current rate
                price_per_unit=160.0,
                currency=current_currency  # Current rate 0.75
            )
        ]

        currency_effect = performance_calculator._calculate_currency_effect(
            holding, transactions
        )

        # Current rate: 0.75, Purchase rate: 0.80
        # Currency effect = (0.75 - 0.80) / 0.80 * 100 = -6.25%
        expected_effect = ((0.75 - 0.80) / 0.80) * 100
        assert abs(currency_effect - expected_effect) < 0.01

    def test_calculate_total_return(
        self, 
        performance_calculator, 
        mock_security_aapl
    ):
        """Test total return calculation."""
        holding = Holding(
            security=mock_security_aapl,
            capital_gains_pct=15.0,
            dividend_yield_pct=3.0
        )
        
        total_return = performance_calculator._calculate_total_return(holding)
        
        assert total_return == 18.0  # 15 + 3

    def test_calculate_holding_performance_integration(
        self, 
        performance_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test complete holding performance calculation."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0,
            current_value_gbp=18000.0,
            unrealized_gain_loss=3000.0
        )
        
        transactions = [
            Transaction.create_buy_transaction(
                transaction_id="T1",
                security=mock_security_aapl,
                date=datetime(2024, 1, 1),
                quantity=100,
                price_per_unit=150.0,
                currency=mock_currency_usd
            )
        ]
        
        dividends = [
            DividendIncome(
                security=mock_security_aapl,
                payment_date=datetime.now() - timedelta(days=30),
                amount_gbp=300.0,
                foreign_currency=mock_currency_usd
            )
        ]
        
        enhanced_holding = performance_calculator.calculate_holding_performance(
            holding, transactions, dividends
        )
        
        assert enhanced_holding.capital_gains_pct == 20.0  # (3000/15000)*100
        assert enhanced_holding.dividend_yield_pct == (300/18000)*100  # ~1.67%
        assert enhanced_holding.total_return_pct > 0

    def test_calculate_portfolio_performance(
        self, 
        performance_calculator, 
        mock_security_aapl
    ):
        """Test portfolio-level performance calculation."""
        # Create portfolio with holdings
        holding1 = Holding(
            security=mock_security_aapl,
            current_value_gbp=15000.0,
            capital_gains_pct=10.0,
            dividend_yield_pct=2.0,
            currency_effect_pct=1.0,
            total_return_pct=12.0
        )
        
        holding2 = Holding(
            security=Security(isin="US5949181045", symbol="MSFT"),
            current_value_gbp=10000.0,
            capital_gains_pct=20.0,
            dividend_yield_pct=1.0,
            currency_effect_pct=-0.5,
            total_return_pct=21.0
        )
        
        market_summary = MarketSummary(market="NASDAQ")
        market_summary.add_holding(holding1)
        market_summary.add_holding(holding2)
        
        portfolio_summary = PortfolioSummary()
        portfolio_summary.add_market_summary(market_summary)
        
        performance = performance_calculator.calculate_portfolio_performance(
            portfolio_summary
        )
        
        # Value-weighted averages
        total_value = 25000.0
        expected_capital_gains = (
            (15000/25000) * 10.0 + (10000/25000) * 20.0
        )  # 6 + 8 = 14%
        expected_dividend_yield = (
            (15000/25000) * 2.0 + (10000/25000) * 1.0
        )  # 1.2 + 0.4 = 1.6%
        
        assert abs(performance['capital_gains_pct'] - expected_capital_gains) < 0.01
        assert abs(performance['dividend_yield_pct'] - expected_dividend_yield) < 0.01

    def test_calculate_portfolio_performance_empty(
        self, 
        performance_calculator
    ):
        """Test portfolio performance with no holdings."""
        portfolio_summary = PortfolioSummary()
        
        performance = performance_calculator.calculate_portfolio_performance(
            portfolio_summary
        )
        
        assert performance['total_return_pct'] == 0.0
        assert performance['capital_gains_pct'] == 0.0
        assert performance['dividend_yield_pct'] == 0.0
        assert performance['currency_effect_pct'] == 0.0

    def test_enhance_portfolio_with_performance(
        self, 
        performance_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test enhancing portfolio with performance metrics."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0,
            current_value_gbp=18000.0,
            unrealized_gain_loss=3000.0
        )
        
        market_summary = MarketSummary(market="NASDAQ")
        market_summary.add_holding(holding)
        
        portfolio_summary = PortfolioSummary()
        portfolio_summary.add_market_summary(market_summary)
        
        transactions = []
        dividends = []
        
        enhanced_portfolio = performance_calculator.enhance_portfolio_with_performance(
            portfolio_summary, transactions, dividends
        )
        
        enhanced_holding = enhanced_portfolio.market_summaries["NASDAQ"].holdings[0]
        assert enhanced_holding.capital_gains_pct == 20.0  # (3000/15000)*100
        assert enhanced_holding.total_return_pct >= 0

    def test_generate_performance_report(
        self, 
        performance_calculator, 
        mock_security_aapl
    ):
        """Test performance report generation."""
        holding = Holding(
            security=mock_security_aapl,
            current_value_gbp=15000.0,
            capital_gains_pct=10.0,
            dividend_yield_pct=2.0,
            total_return_pct=12.0
        )
        
        market_summary = MarketSummary(market="NASDAQ")
        market_summary.add_holding(holding)
        
        portfolio_summary = PortfolioSummary()
        portfolio_summary.add_market_summary(market_summary)
        
        report = performance_calculator.generate_performance_report(
            portfolio_summary
        )
        
        assert 'portfolio_performance' in report
        assert 'market_performance' in report
        assert 'top_performers' in report
        assert 'worst_performers' in report
        assert len(report['top_performers']) == 1
        assert report['top_performers'][0]['symbol'] == 'AAPL'
