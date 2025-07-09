"""Tests for Phase 6 Portfolio Report Generator Service."""
import pytest
import json
import tempfile
import os
from datetime import datetime
from src.main.python.services.portfolio_report_generator import PortfolioReportGenerator
from src.main.python.models.domain_models import (
    Security, Holding, MarketSummary, PortfolioSummary, 
    ComprehensiveTaxSummary, AssetClass
)


@pytest.fixture
def portfolio_report_generator():
    """Fixture for PortfolioReportGenerator instance."""
    return PortfolioReportGenerator()


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
def mock_security_hsba():
    """Mock Security object for HSBC Holdings."""
    return Security(
        isin="GB0005405286", 
        symbol="HSBA", 
        name="HSBC Holdings",
        asset_class=AssetClass.STOCK,
        listing_exchange="LSE"
    )


@pytest.fixture
def sample_portfolio_summary(mock_security_aapl, mock_security_msft, mock_security_hsba):
    """Create a sample portfolio summary for testing."""
    # Create holdings
    aapl_holding = Holding(
        security=mock_security_aapl,
        quantity=100.0,
        average_cost_gbp=150.0,
        current_price=180.0,
        current_value_gbp=13500.0,  # 100 * 180 * 0.75 (USD to GBP)
        market="NASDAQ",
        unrealized_gain_loss=1500.0,
        capital_gains_pct=10.0,
        dividend_yield_pct=2.0,
        currency_effect_pct=-1.0,
        total_return_pct=11.0
    )
    
    msft_holding = Holding(
        security=mock_security_msft,
        quantity=50.0,
        average_cost_gbp=200.0,
        current_price=250.0,
        current_value_gbp=9375.0,  # 50 * 250 * 0.75 (USD to GBP)
        market="NASDAQ",
        unrealized_gain_loss=-625.0,
        capital_gains_pct=-6.25,
        dividend_yield_pct=1.5,
        currency_effect_pct=0.5,
        total_return_pct=-4.25
    )
    
    hsba_holding = Holding(
        security=mock_security_hsba,
        quantity=200.0,
        average_cost_gbp=600.0,
        current_price=650.0,
        current_value_gbp=130000.0,  # 200 * 650 (GBP)
        market="LSE",
        unrealized_gain_loss=10000.0,
        capital_gains_pct=8.33,
        dividend_yield_pct=4.0,
        currency_effect_pct=0.0,
        total_return_pct=12.33
    )
    
    # Create market summaries
    nasdaq_summary = MarketSummary(market="NASDAQ")
    nasdaq_summary.add_holding(aapl_holding)
    nasdaq_summary.add_holding(msft_holding)
    
    lse_summary = MarketSummary(market="LSE")
    lse_summary.add_holding(hsba_holding)
    
    # Create portfolio summary
    portfolio_summary = PortfolioSummary()
    portfolio_summary.add_market_summary(nasdaq_summary)
    portfolio_summary.add_market_summary(lse_summary)
    
    # Calculate market weights
    total_value = portfolio_summary.total_portfolio_value
    nasdaq_summary.weight_in_portfolio = (nasdaq_summary.total_value / total_value) * 100
    lse_summary.weight_in_portfolio = (lse_summary.total_value / total_value) * 100
    
    return portfolio_summary


class TestPortfolioReportGenerator:
    """Test cases for the PortfolioReportGenerator service."""

    def test_generate_market_grouped_report(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating market-grouped portfolio report."""
        as_of_date = datetime(2024, 7, 9, 12, 0, 0)
        report = portfolio_report_generator.generate_market_grouped_report(
            sample_portfolio_summary, as_of_date
        )
        
        assert report['title'] == 'Your investments grouped by market'
        assert report['as_of_date'] == as_of_date
        assert 'markets' in report
        assert 'grand_total' in report
        
        # Check markets
        assert 'NASDAQ' in report['markets']
        assert 'LSE' in report['markets']
        
        # Check NASDAQ market
        nasdaq_market = report['markets']['NASDAQ']
        assert nasdaq_market['market_name'] == 'NASDAQ'
        assert len(nasdaq_market['holdings']) == 2
        assert nasdaq_market['totals']['total_value'] == 22875.0  # 13500 + 9375
        
        # Check LSE market
        lse_market = report['markets']['LSE']
        assert lse_market['market_name'] == 'LSE'
        assert len(lse_market['holdings']) == 1
        assert lse_market['totals']['total_value'] == 130000.0
        
        # Check grand total
        assert report['grand_total']['total_value'] == 152875.0  # 22875 + 130000
        assert report['grand_total']['number_of_holdings'] == 3

    def test_generate_market_grouped_report_default_date(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating report with default date."""
        report = portfolio_report_generator.generate_market_grouped_report(
            sample_portfolio_summary
        )
        
        assert isinstance(report['as_of_date'], datetime)
        assert report['as_of_date'].date() == datetime.now().date()

    def test_holdings_sorted_by_value(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test that holdings are sorted by value in descending order."""
        report = portfolio_report_generator.generate_market_grouped_report(
            sample_portfolio_summary
        )
        
        nasdaq_holdings = report['markets']['NASDAQ']['holdings']
        assert len(nasdaq_holdings) == 2
        
        # AAPL (13500) should come before MSFT (9375)
        assert nasdaq_holdings[0]['symbol'] == 'AAPL'
        assert nasdaq_holdings[1]['symbol'] == 'MSFT'
        assert nasdaq_holdings[0]['value'] > nasdaq_holdings[1]['value']

    def test_generate_csv_portfolio_report(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating CSV portfolio report."""
        csv_content = portfolio_report_generator.generate_csv_portfolio_report(
            sample_portfolio_summary
        )
        
        assert isinstance(csv_content, str)
        assert 'Market,Symbol,Name,Price,Quantity,Value (GBP)' in csv_content
        assert '=== NASDAQ ===' in csv_content
        assert '=== LSE ===' in csv_content
        assert 'AAPL' in csv_content
        assert 'MSFT' in csv_content
        assert 'HSBA' in csv_content
        assert 'Grand Total' in csv_content

    def test_generate_csv_portfolio_report_to_file(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating CSV portfolio report to file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            csv_content = portfolio_report_generator.generate_csv_portfolio_report(
                sample_portfolio_summary, temp_path
            )
            
            # Check file was created
            assert os.path.exists(temp_path)
            
            # Check file content
            with open(temp_path, 'r', encoding='utf-8') as f:
                file_content = f.read()

            # Normalize line endings for comparison
            assert file_content.replace('\r\n', '\n') == csv_content.replace('\r\n', '\n')
            assert 'AAPL' in file_content
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_generate_json_portfolio_report(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating JSON portfolio report."""
        json_content = portfolio_report_generator.generate_json_portfolio_report(
            sample_portfolio_summary
        )
        
        assert isinstance(json_content, str)
        
        # Parse JSON to verify structure
        report_data = json.loads(json_content)
        assert 'title' in report_data
        assert 'as_of_date' in report_data
        assert 'markets' in report_data
        assert 'grand_total' in report_data
        assert 'NASDAQ' in report_data['markets']
        assert 'LSE' in report_data['markets']

    def test_generate_html_portfolio_report(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating HTML portfolio report."""
        html_content = portfolio_report_generator.generate_html_portfolio_report(
            sample_portfolio_summary
        )
        
        assert isinstance(html_content, str)
        assert '<!DOCTYPE html>' in html_content
        assert '<title>Your investments grouped by market</title>' in html_content
        assert 'NASDAQ' in html_content
        assert 'LSE' in html_content
        assert 'AAPL' in html_content
        assert 'Portfolio Summary' in html_content

    def test_generate_html_with_custom_template(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating HTML with custom template."""
        # Create a simple template file
        template_content = """
        <html>
        <body>
        <h1>{title}</h1>
        <p>Markets: {markets}</p>
        </body>
        </html>
        """
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as temp_file:
            temp_file.write(template_content)
            temp_path = temp_file.name
        
        try:
            html_content = portfolio_report_generator.generate_html_portfolio_report(
                sample_portfolio_summary, template_path=temp_path
            )

            # Template should work and contain our title
            assert 'Your investments grouped by market' in html_content
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_generate_comprehensive_report_json(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating comprehensive report in JSON format."""
        report = portfolio_report_generator.generate_comprehensive_report(
            sample_portfolio_summary, output_format="json"
        )
        
        assert isinstance(report, str)
        report_data = json.loads(report)
        assert 'title' in report_data
        assert 'markets' in report_data

    def test_generate_comprehensive_report_html(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating comprehensive report in HTML format."""
        report = portfolio_report_generator.generate_comprehensive_report(
            sample_portfolio_summary, output_format="html"
        )
        
        assert isinstance(report, str)
        assert '<!DOCTYPE html>' in report

    def test_generate_comprehensive_report_csv(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test generating comprehensive report in CSV format."""
        report = portfolio_report_generator.generate_comprehensive_report(
            sample_portfolio_summary, output_format="csv"
        )
        
        assert isinstance(report, str)
        assert 'Market,Symbol,Name' in report

    def test_generate_comprehensive_report_with_tax_summary(
        self,
        portfolio_report_generator,
        sample_portfolio_summary
    ):
        """Test generating comprehensive report with tax summary."""
        tax_summary = ComprehensiveTaxSummary(
            tax_year="2024-2025",
            total_taxable_income=5000.0,
            capital_gains_allowance_used=3000.0,
            dividend_allowance_used=500.0
        )

        report = portfolio_report_generator.generate_comprehensive_report(
            sample_portfolio_summary,
            tax_summary=tax_summary,
            output_format="dict"
        )

        assert isinstance(report, dict)
        assert 'tax_summary' in report
        assert report['tax_summary']['tax_year'] == "2024-2025"
        assert report['tax_summary']['total_taxable_income'] == 5000.0

    def test_calculate_market_return_pct(
        self, 
        portfolio_report_generator, 
        sample_portfolio_summary
    ):
        """Test market return percentage calculation."""
        nasdaq_summary = sample_portfolio_summary.market_summaries['NASDAQ']
        
        return_pct = portfolio_report_generator._calculate_market_return_pct(
            nasdaq_summary
        )
        
        # Expected: (unrealized_gain_loss / total_cost) * 100
        # NASDAQ: (1500 - 625) / (15000 + 10000) * 100 = 875 / 25000 * 100 = 3.5%
        expected_return = (nasdaq_summary.total_unrealized_gain_loss / nasdaq_summary.total_cost) * 100
        assert abs(return_pct - expected_return) < 0.01

    def test_empty_portfolio_summary(
        self, 
        portfolio_report_generator
    ):
        """Test generating report with empty portfolio."""
        empty_portfolio = PortfolioSummary()
        
        report = portfolio_report_generator.generate_market_grouped_report(
            empty_portfolio
        )
        
        assert report['title'] == 'Your investments grouped by market'
        assert report['markets'] == {}
        assert report['grand_total']['total_value'] == 0.0
        assert report['grand_total']['number_of_holdings'] == 0
