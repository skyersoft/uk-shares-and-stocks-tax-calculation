"""Tests for Phase 5 Portfolio Domain Models."""
import pytest
from datetime import datetime
from uuid import UUID
from src.main.python.models.domain_models import (
    Security, Currency, Holding, MarketSummary, PortfolioSummary, AssetClass
)


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


class TestHolding:
    """Test cases for the Holding domain model."""

    def test_holding_creation(self, mock_security_aapl, mock_currency_usd):
        """Test successful creation of a Holding object."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0,
            current_price=200.0,
            current_value_gbp=15000.0,
            market="NASDAQ",
            unrealized_gain_loss=0.0
        )
        
        assert holding.security == mock_security_aapl
        assert holding.quantity == 100.0
        assert holding.average_cost_gbp == 150.0
        assert holding.current_price == 200.0
        assert holding.current_value_gbp == 15000.0
        assert holding.market == "NASDAQ"
        assert isinstance(holding.id, UUID)

    def test_total_cost_gbp_property(self, mock_security_aapl):
        """Test total_cost_gbp property calculation."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0,
            current_value_gbp=15000.0
        )
        
        assert holding.total_cost_gbp == 15000.0  # 100 * 150

    def test_gain_loss_pct_property(self, mock_security_aapl):
        """Test gain_loss_pct property calculation."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0,
            current_value_gbp=18000.0,
            unrealized_gain_loss=3000.0
        )
        
        # Gain/loss % = (unrealized_gain_loss / total_cost) * 100
        # = (3000 / 15000) * 100 = 20%
        assert holding.gain_loss_pct == 20.0

    def test_gain_loss_pct_zero_cost(self, mock_security_aapl):
        """Test gain_loss_pct property with zero cost."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=0.0,
            unrealized_gain_loss=1000.0
        )
        
        assert holding.gain_loss_pct == 0.0

    def test_weight_in_portfolio_property(self, mock_security_aapl):
        """Test weight_in_portfolio property."""
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0
        )
        
        # Default weight should be 0
        assert holding.weight_in_portfolio == 0.0
        
        # Set weight
        holding.weight_in_portfolio = 25.5
        assert holding.weight_in_portfolio == 25.5


class TestMarketSummary:
    """Test cases for the MarketSummary domain model."""

    def test_market_summary_creation(self):
        """Test successful creation of a MarketSummary object."""
        summary = MarketSummary(market="NASDAQ")
        
        assert summary.market == "NASDAQ"
        assert summary.holdings == []
        assert summary.total_value == 0.0
        assert summary.total_cost == 0.0
        assert summary.total_unrealized_gain_loss == 0.0
        assert summary.weight_in_portfolio == 0.0

    def test_add_holding(self, mock_security_aapl, mock_security_msft):
        """Test adding holdings to market summary."""
        summary = MarketSummary(market="NASDAQ")
        
        holding1 = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0,
            current_value_gbp=18000.0,
            unrealized_gain_loss=3000.0
        )
        
        holding2 = Holding(
            security=mock_security_msft,
            quantity=50.0,
            average_cost_gbp=200.0,
            current_value_gbp=12000.0,
            unrealized_gain_loss=2000.0
        )
        
        summary.add_holding(holding1)
        summary.add_holding(holding2)
        
        assert len(summary.holdings) == 2
        assert summary.total_value == 30000.0  # 18000 + 12000
        assert summary.total_cost == 25000.0   # (100*150) + (50*200)
        assert summary.total_unrealized_gain_loss == 5000.0  # 3000 + 2000

    def test_number_of_holdings_property(self, mock_security_aapl):
        """Test number_of_holdings property."""
        summary = MarketSummary(market="NASDAQ")
        
        assert summary.number_of_holdings == 0
        
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0
        )
        summary.add_holding(holding)
        
        assert summary.number_of_holdings == 1

    def test_average_return_pct_property(self, mock_security_aapl, mock_security_msft):
        """Test average_return_pct property."""
        summary = MarketSummary(market="NASDAQ")
        
        # Empty summary should return 0
        assert summary.average_return_pct == 0.0
        
        holding1 = Holding(
            security=mock_security_aapl,
            total_return_pct=10.0
        )
        
        holding2 = Holding(
            security=mock_security_msft,
            total_return_pct=20.0
        )
        
        summary.add_holding(holding1)
        summary.add_holding(holding2)
        
        # Average should be (10 + 20) / 2 = 15
        assert summary.average_return_pct == 15.0

    def test_get_top_holdings(self, mock_security_aapl, mock_security_msft):
        """Test get_top_holdings method."""
        summary = MarketSummary(market="NASDAQ")
        
        holding1 = Holding(
            security=mock_security_aapl,
            current_value_gbp=18000.0
        )
        
        holding2 = Holding(
            security=mock_security_msft,
            current_value_gbp=12000.0
        )
        
        summary.add_holding(holding1)
        summary.add_holding(holding2)
        
        top_holdings = summary.get_top_holdings(1)
        assert len(top_holdings) == 1
        assert top_holdings[0].security.symbol == "AAPL"  # Higher value


class TestPortfolioSummary:
    """Test cases for the PortfolioSummary domain model."""

    def test_portfolio_summary_creation(self):
        """Test successful creation of a PortfolioSummary object."""
        summary = PortfolioSummary()
        
        assert summary.market_summaries == {}
        assert summary.total_portfolio_value == 0.0
        assert summary.total_portfolio_cost == 0.0
        assert summary.total_unrealized_gain_loss == 0.0

    def test_add_market_summary(self, mock_security_aapl):
        """Test adding market summaries to portfolio."""
        portfolio = PortfolioSummary()
        
        market_summary = MarketSummary(market="NASDAQ")
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0,
            current_value_gbp=18000.0,
            unrealized_gain_loss=3000.0
        )
        market_summary.add_holding(holding)
        
        portfolio.add_market_summary(market_summary)
        
        assert "NASDAQ" in portfolio.market_summaries
        assert portfolio.total_portfolio_value == 18000.0
        assert portfolio.total_portfolio_cost == 15000.0
        assert portfolio.total_unrealized_gain_loss == 3000.0

    def test_total_return_pct_property(self, mock_security_aapl):
        """Test total_return_pct property."""
        portfolio = PortfolioSummary()
        
        # Empty portfolio should return 0
        assert portfolio.total_return_pct == 0.0
        
        market_summary = MarketSummary(market="NASDAQ")
        holding = Holding(
            security=mock_security_aapl,
            quantity=100.0,
            average_cost_gbp=150.0,
            current_value_gbp=18000.0,
            unrealized_gain_loss=3000.0
        )
        market_summary.add_holding(holding)
        portfolio.add_market_summary(market_summary)
        
        # Return % = (3000 / 15000) * 100 = 20%
        assert portfolio.total_return_pct == 20.0

    def test_number_properties(self, mock_security_aapl, mock_security_msft):
        """Test number_of_holdings and number_of_markets properties."""
        portfolio = PortfolioSummary()
        
        # Create two market summaries
        nasdaq_summary = MarketSummary(market="NASDAQ")
        lse_summary = MarketSummary(market="LSE")
        
        # Add holdings
        holding1 = Holding(security=mock_security_aapl)
        holding2 = Holding(security=mock_security_msft)
        
        nasdaq_summary.add_holding(holding1)
        lse_summary.add_holding(holding2)
        
        portfolio.add_market_summary(nasdaq_summary)
        portfolio.add_market_summary(lse_summary)
        
        assert portfolio.number_of_holdings == 2
        assert portfolio.number_of_markets == 2

    def test_get_all_holdings(self, mock_security_aapl, mock_security_msft):
        """Test get_all_holdings method."""
        portfolio = PortfolioSummary()
        
        nasdaq_summary = MarketSummary(market="NASDAQ")
        lse_summary = MarketSummary(market="LSE")
        
        holding1 = Holding(security=mock_security_aapl)
        holding2 = Holding(security=mock_security_msft)
        
        nasdaq_summary.add_holding(holding1)
        lse_summary.add_holding(holding2)
        
        portfolio.add_market_summary(nasdaq_summary)
        portfolio.add_market_summary(lse_summary)
        
        all_holdings = portfolio.get_all_holdings()
        assert len(all_holdings) == 2
        assert holding1 in all_holdings
        assert holding2 in all_holdings

    def test_get_top_holdings(self, mock_security_aapl, mock_security_msft):
        """Test get_top_holdings method."""
        portfolio = PortfolioSummary()
        
        nasdaq_summary = MarketSummary(market="NASDAQ")
        
        holding1 = Holding(
            security=mock_security_aapl,
            current_value_gbp=18000.0
        )
        holding2 = Holding(
            security=mock_security_msft,
            current_value_gbp=12000.0
        )
        
        nasdaq_summary.add_holding(holding1)
        nasdaq_summary.add_holding(holding2)
        portfolio.add_market_summary(nasdaq_summary)
        
        top_holdings = portfolio.get_top_holdings(1)
        assert len(top_holdings) == 1
        assert top_holdings[0].security.symbol == "AAPL"
