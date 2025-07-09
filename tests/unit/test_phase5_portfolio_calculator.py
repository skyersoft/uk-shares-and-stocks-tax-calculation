"""Tests for Phase 5 Portfolio Calculator Service."""
import pytest
from datetime import datetime
from src.main.python.services.portfolio_calculator import PortfolioCalculator
from src.main.python.models.domain_models import (
    Transaction, TransactionType, Security, Currency, Holding, AssetClass
)


@pytest.fixture
def portfolio_calculator():
    """Fixture for PortfolioCalculator instance."""
    return PortfolioCalculator()


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
def mock_security_msft():
    """Mock Security object for Microsoft Corp."""
    return Security(
        isin="US5949181045", 
        symbol="MSFT", 
        name="Microsoft Corp",
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


class TestPortfolioCalculator:
    """Test cases for the PortfolioCalculator service."""

    def test_calculate_current_holdings_simple_buy(
        self, 
        portfolio_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test calculating holdings from simple buy transaction."""
        transactions = [
            Transaction.create_buy_transaction(
                transaction_id="T1",
                security=mock_security_aapl,
                date=datetime(2024, 1, 1),
                quantity=100,
                price_per_unit=150.0,
                currency=mock_currency_usd,
                commission=10.0
            )
        ]
        
        holdings = portfolio_calculator.calculate_current_holdings(transactions)
        
        assert len(holdings) == 1
        holding = holdings[0]
        assert holding.security.symbol == "AAPL"
        assert holding.quantity == 100.0
        assert holding.market == "NASDAQ"
        # Cost = (100 * 150 * 0.75) + (10 * 0.75) = 11250 + 7.5 = 11257.5
        # Average cost = 11257.5 / 100 = 112.575
        assert abs(holding.average_cost_gbp - 112.575) < 0.01

    def test_calculate_current_holdings_buy_and_sell(
        self, 
        portfolio_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test calculating holdings with buy and sell transactions."""
        transactions = [
            Transaction.create_buy_transaction(
                transaction_id="T1",
                security=mock_security_aapl,
                date=datetime(2024, 1, 1),
                quantity=100,
                price_per_unit=150.0,
                currency=mock_currency_usd,
                commission=10.0
            ),
            Transaction.create_sell_transaction(
                transaction_id="T2",
                security=mock_security_aapl,
                date=datetime(2024, 2, 1),
                quantity=-50,
                price_per_unit=180.0,
                currency=mock_currency_usd,
                commission=5.0
            )
        ]
        
        holdings = portfolio_calculator.calculate_current_holdings(transactions)
        
        assert len(holdings) == 1
        holding = holdings[0]
        assert holding.security.symbol == "AAPL"
        assert holding.quantity == 50.0  # 100 - 50
        # Remaining cost should be proportional
        expected_cost = (112.575 * 50)  # Half of original cost basis
        assert abs(holding.total_cost_gbp - expected_cost) < 1.0

    def test_calculate_current_holdings_complete_sale(
        self, 
        portfolio_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test calculating holdings when position is completely sold."""
        transactions = [
            Transaction.create_buy_transaction(
                transaction_id="T1",
                security=mock_security_aapl,
                date=datetime(2024, 1, 1),
                quantity=100,
                price_per_unit=150.0,
                currency=mock_currency_usd,
                commission=10.0
            ),
            Transaction.create_sell_transaction(
                transaction_id="T2",
                security=mock_security_aapl,
                date=datetime(2024, 2, 1),
                quantity=-100,
                price_per_unit=180.0,
                currency=mock_currency_usd,
                commission=5.0
            )
        ]
        
        holdings = portfolio_calculator.calculate_current_holdings(transactions)
        
        # Should have no holdings since position was completely sold
        assert len(holdings) == 0

    def test_calculate_current_holdings_multiple_securities(
        self, 
        portfolio_calculator, 
        mock_security_aapl, 
        mock_security_msft,
        mock_currency_usd
    ):
        """Test calculating holdings for multiple securities."""
        transactions = [
            Transaction.create_buy_transaction(
                transaction_id="T1",
                security=mock_security_aapl,
                date=datetime(2024, 1, 1),
                quantity=100,
                price_per_unit=150.0,
                currency=mock_currency_usd,
                commission=10.0
            ),
            Transaction.create_buy_transaction(
                transaction_id="T2",
                security=mock_security_msft,
                date=datetime(2024, 1, 2),
                quantity=50,
                price_per_unit=200.0,
                currency=mock_currency_usd,
                commission=5.0
            )
        ]
        
        holdings = portfolio_calculator.calculate_current_holdings(transactions)
        
        assert len(holdings) == 2
        symbols = [h.security.symbol for h in holdings]
        assert "AAPL" in symbols
        assert "MSFT" in symbols

    def test_group_holdings_by_market(
        self, 
        portfolio_calculator, 
        mock_security_aapl, 
        mock_security_msft
    ):
        """Test grouping holdings by market."""
        # Create holdings with different markets
        aapl_holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            market="NASDAQ",
            current_value_gbp=15000.0
        )
        
        # Create MSFT with different market
        msft_security = Security(
            isin="US5949181045", 
            symbol="MSFT", 
            name="Microsoft Corp",
            listing_exchange="NYSE"
        )
        msft_holding = Holding(
            security=msft_security,
            quantity=50.0,
            market="NYSE",
            current_value_gbp=10000.0
        )
        
        holdings = [aapl_holding, msft_holding]
        market_summaries = portfolio_calculator.group_holdings_by_market(holdings)
        
        assert len(market_summaries) == 2
        assert "NASDAQ" in market_summaries
        assert "NYSE" in market_summaries
        assert market_summaries["NASDAQ"].total_value == 15000.0
        assert market_summaries["NYSE"].total_value == 10000.0

    def test_calculate_portfolio_totals(
        self, 
        portfolio_calculator, 
        mock_security_aapl, 
        mock_security_msft
    ):
        """Test calculating portfolio totals."""
        # Create market summaries
        nasdaq_summary = portfolio_calculator.group_holdings_by_market([
            Holding(
                security=mock_security_aapl,
                quantity=100.0,
                market="NASDAQ",
                current_value_gbp=15000.0,
                average_cost_gbp=120.0
            )
        ])["NASDAQ"]
        
        nyse_summary = portfolio_calculator.group_holdings_by_market([
            Holding(
                security=mock_security_msft,
                quantity=50.0,
                market="NYSE",
                current_value_gbp=10000.0,
                average_cost_gbp=180.0
            )
        ])["NYSE"]
        
        market_summaries = {"NASDAQ": nasdaq_summary, "NYSE": nyse_summary}
        portfolio_summary = portfolio_calculator.calculate_portfolio_totals(
            market_summaries
        )
        
        assert portfolio_summary.total_portfolio_value == 25000.0
        assert portfolio_summary.total_portfolio_cost == 21000.0  # (100*120) + (50*180)
        assert portfolio_summary.number_of_markets == 2
        assert portfolio_summary.number_of_holdings == 2
        
        # Check market weights
        assert abs(nasdaq_summary.weight_in_portfolio - 60.0) < 0.1  # 15000/25000 * 100
        assert abs(nyse_summary.weight_in_portfolio - 40.0) < 0.1   # 10000/25000 * 100

    def test_calculate_portfolio_summary_integration(
        self, 
        portfolio_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test complete portfolio summary calculation."""
        transactions = [
            Transaction.create_buy_transaction(
                transaction_id="T1",
                security=mock_security_aapl,
                date=datetime(2024, 1, 1),
                quantity=100,
                price_per_unit=150.0,
                currency=mock_currency_usd,
                commission=10.0
            )
        ]
        
        portfolio_summary = portfolio_calculator.calculate_portfolio_summary(
            transactions
        )
        
        assert portfolio_summary.number_of_holdings == 1
        assert portfolio_summary.number_of_markets == 1
        assert "NASDAQ" in portfolio_summary.market_summaries
        assert portfolio_summary.total_portfolio_value > 0

    def test_get_portfolio_analytics(
        self, 
        portfolio_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test portfolio analytics generation."""
        transactions = [
            Transaction.create_buy_transaction(
                transaction_id="T1",
                security=mock_security_aapl,
                date=datetime(2024, 1, 1),
                quantity=100,
                price_per_unit=150.0,
                currency=mock_currency_usd,
                commission=10.0
            )
        ]
        
        portfolio_summary = portfolio_calculator.calculate_portfolio_summary(
            transactions
        )
        analytics = portfolio_calculator.get_portfolio_analytics(
            portfolio_summary
        )
        
        assert 'summary' in analytics
        assert 'markets' in analytics
        assert 'top_holdings' in analytics
        assert analytics['summary']['number_of_holdings'] == 1
        assert analytics['summary']['number_of_markets'] == 1
        assert len(analytics['top_holdings']) == 1

    def test_calculate_current_holdings_no_transactions(
        self, 
        portfolio_calculator
    ):
        """Test calculating holdings with no transactions."""
        holdings = portfolio_calculator.calculate_current_holdings([])
        assert len(holdings) == 0

    def test_calculate_current_holdings_non_stock_transactions(
        self, 
        portfolio_calculator, 
        mock_security_aapl, 
        mock_currency_usd
    ):
        """Test that non-stock transactions are ignored for holdings."""
        transactions = [
            Transaction(
                id="T1",
                security=mock_security_aapl,
                date=datetime(2024, 1, 1),
                transaction_type=TransactionType.DIVIDEND,
                quantity=0,
                price_per_unit=5.0,
                currency=mock_currency_usd
            )
        ]
        
        holdings = portfolio_calculator.calculate_current_holdings(transactions)
        assert len(holdings) == 0  # Dividend transactions don't create holdings
