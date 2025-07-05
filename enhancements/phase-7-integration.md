# Phase 7: Integration and Testing

## Overview

This phase integrates all components and ensures system reliability through comprehensive testing. It updates the main calculator to provide unified interfaces, creates comprehensive test suites, and ensures all components work together seamlessly to deliver the enhanced tax calculation and portfolio management system.

## Goals

1. **Update main calculator integration** - Unified interface for comprehensive analysis
2. **Create comprehensive test suite** - Full testing with real Sharesight data
3. **Performance optimization** - Ensure system performs well with large datasets
4. **Documentation and deployment** - Complete system documentation and deployment guides

---

## Task Tracking

| Task | Description | Estimated Time | Status | Dependencies |
|------|-------------|----------------|--------|--------------|
| 7.1 | Update Main Calculator Integration | 2 days | 🔲 Todo | All phases complete |
| 7.2 | Comprehensive Test Suite | 3 days | 🔲 Todo | Task 7.1 |

**Total Phase Duration: 1 week**

### Status Legend
- 🔲 Todo
- 🔄 In Progress  
- ✅ Complete
- ⚠️ Blocked

---

## Task 7.1: Update Main Calculator Integration

**File:** `src/main/python/capital_gains_calculator.py`

**Estimated Time:** 2 days

### Description
Update the main calculator to integrate all new services and provide comprehensive tax and portfolio analysis.

### Enhanced Main Calculator

```python
class EnhancedCapitalGainsCalculator:
    """Enhanced calculator with comprehensive tax and portfolio analysis."""
    
    def __init__(
        self,
        parser: FileParserInterface,
        disposal_calculator: DisposalCalculator,
        dividend_processor: DividendProcessor,
        currency_processor: CurrencyExchangeProcessor,
        portfolio_calculator: PortfolioCalculator,
        performance_calculator: PerformanceCalculator,
        tax_year_calculator: EnhancedTaxYearCalculator,
        report_generator: PortfolioReportGenerator
    ):
        self.parser = parser
        self.disposal_calculator = disposal_calculator
        self.dividend_processor = dividend_processor
        self.currency_processor = currency_processor
        self.portfolio_calculator = portfolio_calculator
        self.performance_calculator = performance_calculator
        self.tax_year_calculator = tax_year_calculator
        self.report_generator = report_generator
        self.logger = logging.getLogger(__name__)
    
    def calculate_comprehensive_analysis(
        self, 
        file_path: str, 
        tax_year: str,
        analysis_type: str = "both"  # "tax", "portfolio", "both"
    ) -> Dict[str, Any]:
        """Perform comprehensive tax and portfolio analysis."""
        
        self.logger.info(f"Starting comprehensive analysis for {tax_year}")
        start_time = time.time()
        
        # Parse transactions
        self.logger.info(f"Parsing transactions from {file_path}")
        transactions = self.parser.parse(file_path)
        self.logger.info(f"Parsed {len(transactions)} transactions")
        
        results = {
            'file_path': file_path,
            'tax_year': tax_year,
            'analysis_type': analysis_type,
            'transaction_count': len(transactions),
            'processing_time': 0.0
        }
        
        if analysis_type in ["tax", "both"]:
            self.logger.info("Calculating comprehensive tax summary")
            tax_summary = self.tax_year_calculator.calculate_comprehensive_tax_summary(
                transactions, tax_year
            )
            results['tax_analysis'] = tax_summary
            
            # Generate tax report
            tax_report = self.tax_year_calculator.generate_tax_calculation_report(tax_summary)
            results['tax_report'] = tax_report
        
        if analysis_type in ["portfolio", "both"]:
            self.logger.info("Calculating portfolio holdings and performance")
            
            # Calculate portfolio holdings
            holdings = self.portfolio_calculator.calculate_current_holdings(transactions)
            self.logger.info(f"Calculated {len(holdings)} current holdings")
            
            if holdings:
                # Process dividends for performance calculation
                dividends = self.dividend_processor.process_dividend_transactions(transactions)
                
                # Calculate performance metrics
                for holding in holdings:
                    self.performance_calculator.calculate_holding_performance(
                        holding, transactions, dividends
                    )
                
                # Group by market and calculate summaries
                market_holdings = self.portfolio_calculator.group_holdings_by_market(holdings)
                market_summaries = self.portfolio_calculator.calculate_market_totals(market_holdings)
                
                portfolio_summary = self.portfolio_calculator.calculate_portfolio_totals(market_summaries)
                
                results['portfolio_analysis'] = portfolio_summary
                
                # Generate portfolio report
                portfolio_report = self.report_generator.generate_market_grouped_report(portfolio_summary)
                results['portfolio_report'] = portfolio_report
            else:
                self.logger.warning("No current holdings found")
                results['portfolio_analysis'] = None
                results['portfolio_report'] = None
        
        # Calculate processing time
        processing_time = time.time() - start_time
        results['processing_time'] = processing_time
        
        self.logger.info(f"Comprehensive analysis completed in {processing_time:.2f} seconds")
        
        return results
    
    def generate_unified_report(
        self, 
        analysis_results: Dict[str, Any],
        output_format: str = "json",
        output_path: str = None
    ) -> Union[str, Dict[str, Any]]:
        """Generate unified report combining tax and portfolio analysis."""
        
        unified_report = {
            'analysis_metadata': {
                'file_path': analysis_results.get('file_path'),
                'tax_year': analysis_results.get('tax_year'),
                'analysis_type': analysis_results.get('analysis_type'),
                'transaction_count': analysis_results.get('transaction_count'),
                'processing_time': analysis_results.get('processing_time'),
                'generated_at': datetime.now().isoformat()
            }
        }
        
        # Include tax analysis if available
        if 'tax_analysis' in analysis_results:
            unified_report['tax_summary'] = self._serialize_tax_summary(
                analysis_results['tax_analysis']
            )
            unified_report['tax_report'] = analysis_results.get('tax_report')
        
        # Include portfolio analysis if available
        if 'portfolio_analysis' in analysis_results and analysis_results['portfolio_analysis']:
            unified_report['portfolio_summary'] = self._serialize_portfolio_summary(
                analysis_results['portfolio_analysis']
            )
            unified_report['portfolio_report'] = analysis_results.get('portfolio_report')
        
        # Generate output based on format
        if output_format.lower() == "json":
            json_output = json.dumps(unified_report, indent=2, default=str)
            if output_path:
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(json_output)
            return json_output
        
        elif output_format.lower() == "csv":
            if 'portfolio_analysis' in analysis_results:
                csv_path = output_path or f"portfolio_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                self.report_generator.generate_csv_portfolio_report(
                    analysis_results['portfolio_analysis'], csv_path
                )
                return csv_path
        
        elif output_format.lower() == "html":
            if 'portfolio_analysis' in analysis_results:
                html_output = self.report_generator.generate_html_portfolio_report(
                    analysis_results['portfolio_analysis']
                )
                if output_path:
                    with open(output_path, 'w', encoding='utf-8') as f:
                        f.write(html_output)
                return html_output
        
        return unified_report
    
    def _serialize_tax_summary(self, tax_summary: ComprehensiveTaxSummary) -> Dict[str, Any]:
        """Serialize tax summary for JSON output."""
        return {
            'tax_year': tax_summary.tax_year,
            'total_taxable_income': tax_summary.total_taxable_income,
            'total_allowable_costs': tax_summary.total_allowable_costs,
            'capital_gains': {
                'total_gain': tax_summary.capital_gains.total_gain if tax_summary.capital_gains else 0.0,
                'taxable_gain': tax_summary.capital_gains.taxable_gain if tax_summary.capital_gains else 0.0,
                'allowance_used': tax_summary.capital_gains_allowance_used
            },
            'dividend_income': {
                'total_gross': tax_summary.dividend_income.total_gross_gbp if tax_summary.dividend_income else 0.0,
                'total_net': tax_summary.dividend_income.total_net_gbp if tax_summary.dividend_income else 0.0,
                'taxable_income': tax_summary.dividend_income.taxable_dividend_income if tax_summary.dividend_income else 0.0,
                'allowance_used': tax_summary.dividend_allowance_used
            },
            'currency_gains': {
                'net_gain_loss': tax_summary.currency_gains.net_gain_loss if tax_summary.currency_gains else 0.0,
                'total_gains': tax_summary.currency_gains.total_gains if tax_summary.currency_gains else 0.0,
                'total_losses': tax_summary.currency_gains.total_losses if tax_summary.currency_gains else 0.0
            },
            'estimated_tax_liability': tax_summary.total_tax_liability,
            'requires_tax_return': tax_summary.requires_tax_return
        }
    
    def _serialize_portfolio_summary(self, portfolio_summary: PortfolioSummary) -> Dict[str, Any]:
        """Serialize portfolio summary for JSON output."""
        return {
            'as_of_date': portfolio_summary.as_of_date.isoformat(),
            'total_portfolio_value': portfolio_summary.total_portfolio_value,
            'total_portfolio_cost': portfolio_summary.total_portfolio_cost,
            'total_unrealized_gain_loss': portfolio_summary.total_unrealized_gain_loss,
            'total_return_pct': portfolio_summary.total_return_pct,
            'number_of_holdings': portfolio_summary.number_of_holdings,
            'number_of_markets': portfolio_summary.number_of_markets,
            'market_allocation': portfolio_summary.get_market_allocation()
        }
    
    def validate_data_quality(self, transactions: List[Transaction]) -> Dict[str, Any]:
        """Validate data quality and provide insights."""
        
        validation_results = {
            'total_transactions': len(transactions),
            'transaction_types': {},
            'date_range': {},
            'currencies': set(),
            'markets': set(),
            'data_quality_issues': [],
            'recommendations': []
        }
        
        if not transactions:
            validation_results['data_quality_issues'].append("No transactions found")
            return validation_results
        
        # Analyze transaction types
        for transaction in transactions:
            tx_type = transaction.transaction_type.value
            validation_results['transaction_types'][tx_type] = validation_results['transaction_types'].get(tx_type, 0) + 1
            
            # Collect currencies and markets
            if transaction.currency:
                validation_results['currencies'].add(transaction.currency.code)
            if hasattr(transaction.security, 'listing_exchange') and transaction.security.listing_exchange:
                validation_results['markets'].add(transaction.security.listing_exchange)
        
        # Date range analysis
        dates = [t.date for t in transactions if t.date]
        if dates:
            validation_results['date_range'] = {
                'earliest': min(dates).isoformat(),
                'latest': max(dates).isoformat(),
                'span_days': (max(dates) - min(dates)).days
            }
        
        # Convert sets to lists for JSON serialization
        validation_results['currencies'] = list(validation_results['currencies'])
        validation_results['markets'] = list(validation_results['markets'])
        
        # Data quality checks
        if len(validation_results['currencies']) > 5:
            validation_results['recommendations'].append("Multiple currencies detected - ensure currency exchange transactions are included")
        
        if len(validation_results['markets']) > 3:
            validation_results['recommendations'].append("Multiple markets detected - portfolio view will group by market")
        
        dividend_count = validation_results['transaction_types'].get('DIV', 0)
        stock_count = validation_results['transaction_types'].get('BUY', 0) + validation_results['transaction_types'].get('SELL', 0)
        
        if stock_count > 0 and dividend_count == 0:
            validation_results['recommendations'].append("No dividend transactions found - dividend yields will be zero")
        
        return validation_results

# Factory function for creating enhanced calculator
def create_enhanced_calculator(parser_type: str = "csv") -> EnhancedCapitalGainsCalculator:
    """Factory function to create enhanced calculator with all dependencies."""
    
    # Create parser
    if parser_type.lower() == "csv":
        from .parsers.csv_parser import CSVParser
        parser = CSVParser()
    else:
        raise ValueError(f"Unsupported parser type: {parser_type}")
    
    # Create services
    disposal_calculator = DisposalCalculator()
    dividend_processor = DividendProcessor()
    currency_processor = CurrencyExchangeProcessor()
    portfolio_calculator = PortfolioCalculator()
    performance_calculator = PerformanceCalculator()
    
    # Create enhanced tax year calculator
    tax_year_calculator = EnhancedTaxYearCalculator(
        disposal_calculator,
        dividend_processor,
        currency_processor
    )
    
    # Create report generator
    report_generator = PortfolioReportGenerator()
    
    # Create enhanced calculator
    return EnhancedCapitalGainsCalculator(
        parser=parser,
        disposal_calculator=disposal_calculator,
        dividend_processor=dividend_processor,
        currency_processor=currency_processor,
        portfolio_calculator=portfolio_calculator,
        performance_calculator=performance_calculator,
        tax_year_calculator=tax_year_calculator,
        report_generator=report_generator
    )
```

### Implementation Details

1. **Integrate all new services into main calculator**
   - Unified interface for comprehensive analysis
   - Support both tax and portfolio analysis modes
   - Factory function for easy instantiation

2. **Support both tax and portfolio analysis modes**
   - Flexible analysis types ("tax", "portfolio", "both")
   - Conditional processing based on analysis type
   - Unified results structure

3. **Provide unified interface for comprehensive analysis**
   - Single entry point for all analysis
   - Consistent error handling
   - Performance monitoring

4. **Maintain backward compatibility with existing functionality**
   - Existing interfaces still work
   - Gradual migration path
   - No breaking changes

### Files to Update
- `src/main/python/capital_gains_calculator.py` - Enhance main calculator
- `src/main/python/__init__.py` - Update exports

### Test Requirements
- Integration tests with all services
- Comprehensive analysis accuracy tests
- Performance tests with large datasets
- Backward compatibility verification
- Factory function tests

### Acceptance Criteria
- [ ] All services integrated into main calculator
- [ ] Unified interface works correctly
- [ ] Both analysis modes supported
- [ ] Performance is acceptable
- [ ] Backward compatibility maintained
- [ ] All tests pass

---

## Task 7.2: Comprehensive Test Suite

**File:** `tests/integration/test_comprehensive_analysis.py`

**Estimated Time:** 3 days

### Description
Create comprehensive integration tests using real Sharesight data and edge cases.

### Test Implementation

```python
import pytest
import tempfile
import os
from datetime import datetime
from src.main.python.capital_gains_calculator import create_enhanced_calculator
from src.main.python.models.domain_models import TransactionType

class TestComprehensiveAnalysis:
    """Integration tests for comprehensive tax and portfolio analysis."""
    
    @pytest.fixture
    def enhanced_calculator(self):
        """Create enhanced calculator for testing."""
        return create_enhanced_calculator("csv")
    
    @pytest.fixture
    def sample_sharesight_csv(self):
        """Create sample Sharesight CSV data for testing."""
        csv_content = """Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized
2024-05-10,ASM.EURONEXT,ASM International NV,STK,COMMON,EURONEXT,EURONEXT,BUY,2,534.60,1.50,0.00,534.60,0.8654,0.00,0.00
2024-06-15,ASM.EURONEXT,ASM International NV,STK,COMMON,EURONEXT,EURONEXT,DIV,2,5.25,0.00,1.05,534.60,0.8654,0.00,0.00
2024-07-20,ASML.EURONEXT,ASML Holding NV,STK,COMMON,EURONEXT,EURONEXT,BUY,1,691.40,1.50,0.00,691.40,0.8654,0.00,0.00
2024-08-10,RR..LSE,Rolls-Royce Holdings Plc,STK,COMMON,LSE,LSE,BUY,600,9.092,5.00,0.00,9.092,1.0000,0.00,0.00
2024-09-15,NVDA.NASDAQ,NVIDIA Corp,STK,COMMON,NASDAQ,NASDAQ,BUY,20,147.90,2.00,0.00,147.90,1.2845,0.00,0.00
2024-10-01,EUR.GBP,EUR.GBP,CASH,,,,BUY,1000,0.8654,0.00,0.00,0.8654,1.0000,0.00,0.00
2024-10-15,EUR.GBP,EUR.GBP,CASH,,,,SELL,-500,0.8700,0.00,0.00,0.8700,1.0000,0.00,0.00"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(csv_content)
            return f.name
    
    def test_full_comprehensive_analysis(self, enhanced_calculator, sample_sharesight_csv):
        """Test complete analysis with sample Sharesight CSV data."""
        
        # Perform comprehensive analysis
        results = enhanced_calculator.calculate_comprehensive_analysis(
            sample_sharesight_csv, "2024-2025", "both"
        )
        
        # Verify basic structure
        assert 'tax_analysis' in results
        assert 'portfolio_analysis' in results
        assert 'tax_report' in results
        assert 'portfolio_report' in results
        assert results['transaction_count'] > 0
        assert results['processing_time'] > 0
        
        # Verify tax analysis
        tax_summary = results['tax_analysis']
        assert tax_summary.tax_year == "2024-2025"
        assert tax_summary.total_taxable_income >= 0
        
        # Should have dividend income from ASM dividend
        assert tax_summary.dividend_income is not None
        assert tax_summary.dividend_income.total_net_gbp > 0
        
        # Should have currency gains from EUR.GBP transactions
        assert tax_summary.currency_gains is not None
        
        # Verify portfolio analysis
        portfolio_summary = results['portfolio_analysis']
        assert portfolio_summary is not None
        assert portfolio_summary.number_of_holdings > 0
        assert portfolio_summary.total_portfolio_value > 0
        
        # Should have multiple markets
        assert len(portfolio_summary.market_summaries) > 1
        assert 'EURONEXT' in portfolio_summary.market_summaries
        assert 'LSE' in portfolio_summary.market_summaries
        assert 'NASDAQ' in portfolio_summary.market_summaries
        
        # Clean up
        os.unlink(sample_sharesight_csv)
    
    def test_tax_only_analysis(self, enhanced_calculator, sample_sharesight_csv):
        """Test tax-only analysis."""
        
        results = enhanced_calculator.calculate_comprehensive_analysis(
            sample_sharesight_csv, "2024-2025", "tax"
        )
        
        assert 'tax_analysis' in results
        assert 'portfolio_analysis' not in results
        assert results['analysis_type'] == "tax"
        
        os.unlink(sample_sharesight_csv)
    
    def test_portfolio_only_analysis(self, enhanced_calculator, sample_sharesight_csv):
        """Test portfolio-only analysis."""
        
        results = enhanced_calculator.calculate_comprehensive_analysis(
            sample_sharesight_csv, "2024-2025", "portfolio"
        )
        
        assert 'portfolio_analysis' in results
        assert 'tax_analysis' not in results
        assert results['analysis_type'] == "portfolio"
        
        os.unlink(sample_sharesight_csv)
    
    def test_unified_report_generation(self, enhanced_calculator, sample_sharesight_csv):
        """Test unified report generation in different formats."""
        
        # Perform analysis
        results = enhanced_calculator.calculate_comprehensive_analysis(
            sample_sharesight_csv, "2024-2025", "both"
        )
        
        # Test JSON report
        json_report = enhanced_calculator.generate_unified_report(results, "json")
        assert isinstance(json_report, str)
        assert "analysis_metadata" in json_report
        assert "tax_summary" in json_report
        assert "portfolio_summary" in json_report
        
        # Test CSV report
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as f:
            csv_path = f.name
        
        csv_result = enhanced_calculator.generate_unified_report(
            results, "csv", csv_path
        )
        assert os.path.exists(csv_path)
        
        # Test HTML report
        html_report = enhanced_calculator.generate_unified_report(results, "html")
        assert isinstance(html_report, str)
        assert "<html>" in html_report
        assert "Your investments grouped by market" in html_report
        
        # Clean up
        os.unlink(sample_sharesight_csv)
        os.unlink(csv_path)
    
    def test_data_quality_validation(self, enhanced_calculator, sample_sharesight_csv):
        """Test data quality validation."""
        
        # Parse transactions first
        transactions = enhanced_calculator.parser.parse(sample_sharesight_csv)
        
        # Validate data quality
        validation_results = enhanced_calculator.validate_data_quality(transactions)
        
        assert validation_results['total_transactions'] > 0
        assert 'transaction_types' in validation_results
        assert 'date_range' in validation_results
        assert 'currencies' in validation_results
        assert 'markets' in validation_results
        
        # Should detect multiple transaction types
        assert len(validation_results['transaction_types']) > 1
        assert 'BUY' in validation_results['transaction_types']
        assert 'DIV' in validation_results['transaction_types']
        
        # Should detect multiple currencies
        assert len(validation_results['currencies']) > 1
        assert 'EUR' in validation_results['currencies']
        assert 'GBP' in validation_results['currencies']
        
        # Should detect multiple markets
        assert len(validation_results['markets']) > 1
        assert 'EURONEXT' in validation_results['markets']
        assert 'LSE' in validation_results['markets']
        
        os.unlink(sample_sharesight_csv)
    
    def test_performance_with_large_dataset(self, enhanced_calculator):
        """Test performance with large dataset."""
        
        # Create large CSV with 1000 transactions
        large_csv_content = "Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized\n"
        
        for i in range(1000):
            date = f"2024-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}"
            symbol = f"TEST{i % 10}.LSE"
            large_csv_content += f"{date},{symbol},Test Company {i % 10},STK,COMMON,LSE,LSE,BUY,{10 + i % 100},{100 + i % 50}.50,1.50,0.00,{100 + i % 50}.50,1.0000,0.00,0.00\n"
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(large_csv_content)
            large_csv_path = f.name
        
        # Perform analysis and measure time
        start_time = datetime.now()
        results = enhanced_calculator.calculate_comprehensive_analysis(
            large_csv_path, "2024-2025", "both"
        )
        end_time = datetime.now()
        
        processing_time = (end_time - start_time).total_seconds()
        
        # Should complete within reasonable time (< 30 seconds for 1000 transactions)
        assert processing_time < 30.0
        assert results['transaction_count'] == 1000
        assert results['processing_time'] > 0
        
        # Should still produce valid results
        assert results['portfolio_analysis'] is not None
        assert results['tax_analysis'] is not None
        
        os.unlink(large_csv_path)
    
    def test_error_handling(self, enhanced_calculator):
        """Test error handling with invalid data."""
        
        # Test with non-existent file
        with pytest.raises(FileNotFoundError):
            enhanced_calculator.calculate_comprehensive_analysis(
                "non_existent_file.csv", "2024-2025", "both"
            )
        
        # Test with empty CSV
        empty_csv_content = "Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized\n"
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(empty_csv_content)
            empty_csv_path = f.name
        
        # Should handle empty file gracefully
        results = enhanced_calculator.calculate_comprehensive_analysis(
            empty_csv_path, "2024-2025", "both"
        )
        
        assert results['transaction_count'] == 0
        assert results['portfolio_analysis'] is None
        
        os.unlink(empty_csv_path)
    
    def test_backward_compatibility(self, enhanced_calculator):
        """Test backward compatibility with existing interfaces."""
        
        # Test that existing methods still work
        assert hasattr(enhanced_calculator, 'parser')
        assert hasattr(enhanced_calculator, 'disposal_calculator')
        
        # Test factory function
        calculator2 = create_enhanced_calculator("csv")
        assert calculator2 is not None
        assert type(calculator2).__name__ == "EnhancedCapitalGainsCalculator"

class TestPerformanceMetrics:
    """Test performance metrics calculations."""
    
    def test_dividend_yield_calculation(self):
        """Test dividend yield calculation accuracy."""
        # Implementation would test specific dividend yield calculations
        pass
    
    def test_currency_effect_calculation(self):
        """Test currency effect calculation accuracy."""
        # Implementation would test specific currency effect calculations
        pass
    
    def test_capital_gains_calculation(self):
        """Test capital gains calculation accuracy."""
        # Implementation would test specific capital gains calculations
        pass

class TestMarketGrouping:
    """Test market grouping functionality."""
    
    def test_market_grouping_accuracy(self):
        """Test that holdings are grouped correctly by exchange."""
        # Implementation would test market grouping logic
        pass
    
    def test_market_totals_calculation(self):
        """Test market-level total calculations."""
        # Implementation would test market summary calculations
        pass

class TestReportGeneration:
    """Test report generation functionality."""
    
    def test_csv_report_format(self):
        """Test CSV report format matches expected structure."""
        # Implementation would test CSV output format
        pass
    
    def test_json_report_structure(self):
        """Test JSON report structure and content."""
        # Implementation would test JSON output structure
        pass
    
    def test_html_report_rendering(self):
        """Test HTML report rendering and content."""
        # Implementation would test HTML output
        pass
```

### Implementation Details

1. **Create comprehensive integration tests**
   - Test with real Sharesight data structure
   - Cover all analysis modes
   - Test error conditions

2. **Use real Sharesight data for testing**
   - Sample data matching actual CSV format
   - Multiple transaction types
   - Multiple markets and currencies

3. **Verify accuracy of all calculations**
   - Tax calculations
   - Portfolio calculations
   - Performance metrics

4. **Test edge cases and error conditions**
   - Empty files
   - Invalid data
   - Large datasets

5. **Include performance benchmarks**
   - Processing time limits
   - Memory usage monitoring
   - Scalability testing

### Files to Create
- `tests/integration/test_comprehensive_analysis.py` - Main integration tests
- `tests/performance/test_performance_benchmarks.py` - Performance tests
- `tests/data/sample_sharesight_data.csv` - Test data

### Test Requirements
- All integration tests must pass
- Code coverage > 90%
- Performance benchmarks met
- No regression in existing functionality
- Error handling verification

### Acceptance Criteria
- [ ] Comprehensive integration tests created
- [ ] All tests pass with real data
- [ ] Performance benchmarks met
- [ ] Error handling verified
- [ ] Code coverage > 90%
- [ ] No regressions detected

---

## Dependencies and Prerequisites

### External Dependencies
- All previous phases complete
- Test data available
- Performance testing environment

### Internal Dependencies
- All enhanced services implemented
- Main calculator updated
- Web interface complete

### Data Requirements
- Real Sharesight CSV data for testing
- Edge case test scenarios
- Performance test datasets

---

## Testing Strategy

### Unit Tests
- Individual component testing
- Mock dependencies where appropriate
- Edge case coverage

### Integration Tests
- End-to-end workflow testing
- Real data processing
- Cross-component interaction

### Performance Tests
- Large dataset processing
- Memory usage monitoring
- Response time benchmarks

### User Acceptance Tests
- Web interface testing
- Report generation verification
- Real-world scenario testing

---

## Success Criteria

### Functional Requirements
- [ ] All components integrated successfully
- [ ] Comprehensive analysis works end-to-end
- [ ] All report formats generate correctly
- [ ] Web interface displays portfolio view
- [ ] Tax calculations include all income types

### Non-Functional Requirements
- [ ] Performance acceptable for typical datasets
- [ ] Memory usage within reasonable limits
- [ ] Error handling comprehensive
- [ ] Code coverage > 90%

### Quality Requirements
- [ ] All tests pass
- [ ] No regressions in existing functionality
- [ ] Code follows project standards
- [ ] Documentation complete

---

## Deployment and Documentation

### Deployment Checklist
- [ ] All dependencies installe
