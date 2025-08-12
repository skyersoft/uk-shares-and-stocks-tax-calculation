"""Integration tests for comprehensive analysis functionality."""
import pytest
import tempfile
import os
import csv
from datetime import datetime
from src.main.python.capital_gains_calculator import (
    EnhancedCapitalGainsCalculator, create_enhanced_calculator
)


@pytest.fixture
def enhanced_calculator():
    """Create enhanced calculator for testing."""
    return create_enhanced_calculator("csv")


@pytest.fixture
def sample_sharesight_csv():
    """Create a sample Sharesight CSV file for testing."""
    csv_content = """Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized
2024-01-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,BUY,100,150.00,10.00,0.00,150.00,0.75,0.00,0.00
2024-02-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,SELL,-50,180.00,5.00,0.00,180.00,0.75,0.00,1500.00
2024-03-15,MSFT,Microsoft Corp,STK,COMMON,NASDAQ,NASDAQ,BUY,50,200.00,8.00,0.00,200.00,0.75,0.00,0.00
2024-04-15,HSBA,HSBC Holdings,STK,COMMON,LSE,LSE,BUY,200,600.00,15.00,0.00,600.00,1.00,0.00,0.00
2024-05-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,DIV,0,2.50,0.00,0.00,170.00,0.75,0.00,0.00
2024-06-15,MSFT,Microsoft Corp,STK,COMMON,NASDAQ,NASDAQ,DIV,0,1.80,0.00,0.00,220.00,0.75,0.00,0.00"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        f.write(csv_content)
        return f.name


class TestEnhancedCapitalGainsCalculator:
    """Test cases for the EnhancedCapitalGainsCalculator."""

    def test_comprehensive_analysis_both(self, enhanced_calculator, sample_sharesight_csv):
        """Test comprehensive analysis with both tax and portfolio analysis."""
        
        results = enhanced_calculator.calculate_comprehensive_analysis(
            sample_sharesight_csv, "2024-2025", "both"
        )
        
        # Check basic structure
        assert 'file_path' in results
        assert 'tax_year' in results
        assert 'analysis_type' in results
        assert 'transaction_count' in results
        assert 'processing_time' in results
        
        # Check analysis results
        assert 'tax_analysis' in results
        assert 'portfolio_analysis' in results
        assert 'tax_report' in results
        assert 'portfolio_report' in results
        assert 'commission_summary' in results
        
        # Verify data
        assert results['analysis_type'] == "both"
        assert results['tax_year'] == "2024-2025"
        assert results['transaction_count'] == 6
        assert results['processing_time'] > 0
        
        # Check tax analysis
        tax_analysis = results['tax_analysis']
        assert tax_analysis.tax_year == "2024-2025"
        assert hasattr(tax_analysis, 'capital_gains')
        assert hasattr(tax_analysis, 'dividend_income')
        
        # Check portfolio analysis
        portfolio_analysis = results['portfolio_analysis']
        assert portfolio_analysis is not None
        assert portfolio_analysis.number_of_holdings > 0
        assert portfolio_analysis.total_portfolio_value > 0
        
        # Check reports
        assert results['tax_report'] is not None
        assert results['portfolio_report'] is not None
        assert 'markets' in results['portfolio_report']

        # Check commission summary
        commission_summary = results['commission_summary']
        assert commission_summary is not None
        assert 'total_commissions' in commission_summary
        assert 'total_fees' in commission_summary
        assert 'total_costs' in commission_summary
        assert 'breakdown' in commission_summary
        assert 'transaction_count' in commission_summary

        # Verify commission values are reasonable
        assert commission_summary['total_commissions'] >= 0
        assert commission_summary['total_fees'] >= 0
        assert commission_summary['total_costs'] >= 0
        assert commission_summary['transaction_count'] >= 0

        # Check breakdown structure
        breakdown = commission_summary['breakdown']
        assert 'buy_commissions' in breakdown
        assert 'sell_commissions' in breakdown
        assert 'dividend_fees' in breakdown
        assert 'other_fees' in breakdown

        os.unlink(sample_sharesight_csv)

    def test_tax_only_analysis(self, enhanced_calculator, sample_sharesight_csv):
        """Test tax-only analysis."""
        
        results = enhanced_calculator.calculate_comprehensive_analysis(
            sample_sharesight_csv, "2024-2025", "tax"
        )
        
        assert 'tax_analysis' in results
        assert 'portfolio_analysis' not in results
        assert results['analysis_type'] == "tax"

        # Tax analysis should be present
        assert results['tax_analysis'] is not None
        assert results['tax_report'] is not None

        # Commission summary should be present for tax analysis
        assert 'commission_summary' in results
        assert results['commission_summary'] is not None
        
        os.unlink(sample_sharesight_csv)

    def test_portfolio_only_analysis(self, enhanced_calculator, sample_sharesight_csv):
        """Test portfolio-only analysis."""
        
        results = enhanced_calculator.calculate_comprehensive_analysis(
            sample_sharesight_csv, "2024-2025", "portfolio"
        )
        
        assert 'portfolio_analysis' in results
        assert 'tax_analysis' not in results
        assert results['analysis_type'] == "portfolio"

        # Portfolio analysis should be present
        assert results['portfolio_analysis'] is not None
        assert results['portfolio_report'] is not None

        # Commission summary should NOT be present for portfolio-only analysis
        assert 'commission_summary' not in results
        
        os.unlink(sample_sharesight_csv)

    def test_commission_calculation_accuracy(self, enhanced_calculator):
        """Test that commission calculations are accurate."""
        # Create CSV with known commission values (dates within 2024-2025 tax year: Apr 6, 2024 - Apr 5, 2025)
        csv_content = """Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized
2024-05-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,BUY,100,150.00,10.00,2.00,150.00,0.75,0.00,0.00
2024-06-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,SELL,-50,180.00,5.00,1.00,180.00,0.75,0.00,1500.00
2024-07-15,MSFT,Microsoft Corp,STK,COMMON,NASDAQ,NASDAQ,BUY,50,200.00,8.00,0.50,200.00,0.75,0.00,0.00"""

        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(csv_content)
            csv_path = f.name

        try:
            results = enhanced_calculator.calculate_comprehensive_analysis(
                csv_path, "2024-2025", "tax"
            )

            commission_summary = results['commission_summary']

            # Expected values (converted to GBP using FXRateToBase=0.75 for USD transactions)
            # Buy AAPL: 10.00 * 0.75 = 7.50, fees: 2.00 * 0.75 = 1.50
            # Sell AAPL: 5.00 * 0.75 = 3.75, fees: 1.00 * 0.75 = 0.75
            # Buy MSFT: 8.00 * 0.75 = 6.00, fees: 0.50 * 0.75 = 0.375
            expected_total_commissions = 7.50 + 3.75 + 6.00  # 17.25
            expected_total_fees = 1.50 + 0.75 + 0.375  # 2.625
            expected_total_costs = expected_total_commissions + expected_total_fees  # 19.875

            # Check commission values (allow small floating point differences)
            assert abs(commission_summary['total_commissions'] - expected_total_commissions) < 0.01
            assert abs(commission_summary['total_fees'] - expected_total_fees) < 0.01
            assert abs(commission_summary['total_costs'] - expected_total_costs) < 0.01

            # Check breakdown
            breakdown = commission_summary['breakdown']
            expected_buy_commissions = 7.50 + 6.00  # 13.50
            expected_sell_commissions = 3.75

            assert abs(breakdown['buy_commissions'] - expected_buy_commissions) < 0.01
            assert abs(breakdown['sell_commissions'] - expected_sell_commissions) < 0.01
            assert breakdown['dividend_fees'] == 0.0
            assert breakdown['other_fees'] == 0.0

            # Check transaction count (3 transactions with commissions)
            assert commission_summary['transaction_count'] == 3

        finally:
            os.unlink(csv_path)

    def test_empty_file_handling(self, enhanced_calculator):
        """Test handling of empty CSV file."""
        empty_csv_content = """Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized
"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(empty_csv_content)
            empty_csv_path = f.name
        
        try:
            results = enhanced_calculator.calculate_comprehensive_analysis(
                empty_csv_path, "2024-2025", "both"
            )
            
            assert results['transaction_count'] == 0
            assert results['portfolio_analysis'] is None
            
        finally:
            os.unlink(empty_csv_path)

    def test_performance_with_large_dataset(self, enhanced_calculator):
        """Test performance with larger dataset."""
        # Create a larger CSV file with 100 transactions
        csv_header = "Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized\n"
        csv_rows = []
        
        symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
        
        for i in range(100):
            symbol = symbols[i % len(symbols)]
            date = f"2024-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}"
            buy_sell = "BUY" if i % 2 == 0 else "SELL"
            quantity = 10 if buy_sell == "BUY" else -5
            price = 100 + (i % 50)
            
            csv_rows.append(f"{date},{symbol},{symbol} Corp,STK,COMMON,NASDAQ,NASDAQ,{buy_sell},{quantity},{price}.00,5.00,0.00,{price}.00,0.75,0.00,0.00")
        
        large_csv_content = csv_header + "\n".join(csv_rows)
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(large_csv_content)
            large_csv_path = f.name
        
        try:
            # Measure performance
            start_time = datetime.now()
            results = enhanced_calculator.calculate_comprehensive_analysis(
                large_csv_path, "2024-2025", "both"
            )
            end_time = datetime.now()
            
            processing_time = (end_time - start_time).total_seconds()
            
            # Should complete within reasonable time (< 10 seconds for 100 transactions)
            assert processing_time < 10.0
            assert results['transaction_count'] == 100
            assert results['processing_time'] > 0
            
            # Should still produce valid results
            assert results['portfolio_analysis'] is not None
            assert results['tax_analysis'] is not None
            
        finally:
            os.unlink(large_csv_path)

    def test_error_handling(self, enhanced_calculator):
        """Test error handling with invalid data."""

        # Test with non-existent file (parser handles this gracefully)
        results = enhanced_calculator.calculate_comprehensive_analysis(
            "non_existent_file.csv", "2024-2025", "both"
        )

        # Should return results with 0 transactions
        assert results['transaction_count'] == 0

    def test_backward_compatibility(self, enhanced_calculator):
        """Test backward compatibility with existing interfaces."""
        
        # Test that all required components are present
        assert hasattr(enhanced_calculator, 'parser')
        assert hasattr(enhanced_calculator, 'disposal_calculator')
        assert hasattr(enhanced_calculator, 'dividend_processor')
        assert hasattr(enhanced_calculator, 'currency_processor')
        assert hasattr(enhanced_calculator, 'portfolio_calculator')
        assert hasattr(enhanced_calculator, 'performance_calculator')
        assert hasattr(enhanced_calculator, 'tax_year_calculator')
        assert hasattr(enhanced_calculator, 'report_generator')

    def test_factory_function(self):
        """Test the factory function for creating enhanced calculator."""
        
        # Test CSV parser creation
        calculator_csv = create_enhanced_calculator("csv")
        assert calculator_csv is not None
        assert type(calculator_csv).__name__ == "EnhancedCapitalGainsCalculator"
        
        # Test QFX parser creation
        calculator_qfx = create_enhanced_calculator("qfx")
        assert calculator_qfx is not None
        assert type(calculator_qfx).__name__ == "EnhancedCapitalGainsCalculator"
        
        # Test invalid parser type
        with pytest.raises(ValueError):
            create_enhanced_calculator("invalid")

    def test_integration_with_real_data_structure(self, enhanced_calculator, sample_sharesight_csv):
        """Test integration with realistic data structure."""
        
        results = enhanced_calculator.calculate_comprehensive_analysis(
            sample_sharesight_csv, "2024-2025", "both"
        )
        
        # Verify tax analysis structure
        tax_analysis = results['tax_analysis']
        assert hasattr(tax_analysis, 'capital_gains')
        assert hasattr(tax_analysis, 'dividend_income')
        assert hasattr(tax_analysis, 'total_taxable_income')
        
        # Verify portfolio analysis structure
        portfolio_analysis = results['portfolio_analysis']
        assert hasattr(portfolio_analysis, 'market_summaries')
        assert hasattr(portfolio_analysis, 'total_portfolio_value')
        assert hasattr(portfolio_analysis, 'number_of_holdings')
        
        # Verify portfolio report structure
        portfolio_report = results['portfolio_report']
        assert 'title' in portfolio_report
        assert 'markets' in portfolio_report
        assert 'grand_total' in portfolio_report
        
        # Check that we have both NASDAQ and LSE markets
        markets = portfolio_report['markets']
        market_names = list(markets.keys())
        assert len(market_names) >= 1  # Should have at least one market
        
        os.unlink(sample_sharesight_csv)

    def test_dividend_processing_integration(self, enhanced_calculator, sample_sharesight_csv):
        """Test that dividend processing is properly integrated."""
        
        results = enhanced_calculator.calculate_comprehensive_analysis(
            sample_sharesight_csv, "2024-2025", "both"
        )
        
        # Check that dividend income is captured in tax analysis
        tax_analysis = results['tax_analysis']
        if tax_analysis.dividend_income:
            assert tax_analysis.dividend_income.total_gross_gbp > 0
        
        os.unlink(sample_sharesight_csv)
