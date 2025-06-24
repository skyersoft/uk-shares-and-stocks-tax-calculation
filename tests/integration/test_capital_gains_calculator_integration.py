"""Integration tests for the capital gains calculator with real data."""
import pytest
import tempfile
import os
from datetime import datetime

from src.main.python.calculator import CapitalGainsTaxCalculator
from src.main.python.parsers.csv_parser import CsvParser


class TestCapitalGainsCalculatorIntegration:
    """Integration tests for the Capital Gains Tax Calculator with real data."""
    
    @pytest.fixture
    def real_qfx_file_path(self):
        """Path to real QFX data file."""
        return "data/U11075163_20240408_20250404.qfx"
    
    def test_end_to_end_calculation_with_real_data(self, real_qfx_file_path):
        """Test complete end-to-end calculation with real QFX data (Task 8.2)."""
        # Create calculator with default components
        calculator = CapitalGainsTaxCalculator()
        
        # Test CSV report generation
        with tempfile.NamedTemporaryFile(mode='w', suffix='_test_report', delete=False) as temp_file:
            output_path = temp_file.name
        
        try:
            # Calculate capital gains for 2024-2025 tax year
            summary = calculator.calculate(
                file_path=real_qfx_file_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="csv"
            )
            
            # Verify the calculation results
            assert summary is not None
            assert summary.tax_year == "2024-2025"
            
            # Based on our previous integration test, we expect:
            # - 2 disposals
            # - Total proceeds around £26,072
            # - Net gain around £1,384
            # - Taxable gain of £0 (covered by annual exemption)
            
            print(f"✓ End-to-end calculation completed successfully")
            print(f"  Tax Year: {summary.tax_year}")
            print(f"  Total Proceeds: £{summary.total_proceeds:.2f}")
            print(f"  Total Gains: £{summary.total_gains:.2f}")
            print(f"  Total Losses: £{summary.total_losses:.2f}")
            print(f"  Net Gain: £{summary.net_gain:.2f}")
            print(f"  Annual Exemption Used: £{summary.annual_exemption_used:.2f}")
            print(f"  Taxable Gain: £{summary.taxable_gain:.2f}")
            print(f"  Number of Disposals: {len(summary.disposals)}")
            
            # Validate expected results based on actual QFX data
            # We have 2 disposals: JE00B1VS3770 and KYG393871085, both in 2024-2025 tax year
            assert len(summary.disposals) == 2, f"Expected 2 disposals, got {len(summary.disposals)}"
            assert summary.total_proceeds > 25000, f"Expected proceeds > £25,000, got £{summary.total_proceeds:.2f}"
            assert summary.total_gains > 1000, f"Expected gains > £1,000, got £{summary.total_gains:.2f}"
            assert summary.net_gain > 1000, f"Expected net gain > £1,000, got £{summary.net_gain:.2f}"
            assert summary.annual_exemption_used > 0, f"Expected exemption used > £0, got £{summary.annual_exemption_used:.2f}"
            assert summary.taxable_gain == 0, f"Expected taxable gain = £0, got £{summary.taxable_gain:.2f}"
            
            # Verify CSV report was created
            csv_report_path = output_path + '.csv'
            assert os.path.exists(csv_report_path), f"CSV report not created at {csv_report_path}"
            
            # Verify CSV content
            with open(csv_report_path, 'r') as csvfile:
                content = csvfile.read()
                assert 'Disposal Date' in content, "CSV header not found"
                assert '2024-2025' in content, "Tax year not found in CSV"
                assert 'Tax Year Summary' in content, "Summary section not found in CSV"
            
            print(f"✓ CSV report generated successfully at {csv_report_path}")
            
        finally:
            # Clean up
            csv_report_path = output_path + '.csv'
            if os.path.exists(csv_report_path):
                os.unlink(csv_report_path)
    
    def test_end_to_end_calculation_with_json_format(self, real_qfx_file_path):
        """Test complete end-to-end calculation with JSON report format."""
        # Import the JSON report generator
        from src.main.python.services.report_generator import JSONReportGenerator
        
        # Create calculator with JSON report generator
        calculator = CapitalGainsTaxCalculator(report_generator=JSONReportGenerator())
        
        # Test JSON report generation
        with tempfile.NamedTemporaryFile(mode='w', suffix='_test_report', delete=False) as temp_file:
            output_path = temp_file.name
        
        try:
            # Calculate capital gains for 2024-2025 tax year
            summary = calculator.calculate(
                file_path=real_qfx_file_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="json"
            )
            
            # Verify the calculation results
            assert summary is not None
            assert summary.tax_year == "2024-2025"
            assert len(summary.disposals) == 2
            
            # Verify JSON report was created
            json_report_path = output_path + '.json'
            assert os.path.exists(json_report_path), f"JSON report not created at {json_report_path}"
            
            # Verify JSON content
            import json
            with open(json_report_path, 'r') as jsonfile:
                data = json.load(jsonfile)
                
                assert 'tax_year' in data
                assert 'disposals' in data
                assert 'summary' in data
                assert data['tax_year'] == '2024-2025'
                assert len(data['disposals']) == 2
                assert 'total_proceeds' in data['summary']
                assert 'taxable_gain' in data['summary']
            
            print(f"✓ JSON report generated successfully at {json_report_path}")
            
        finally:
            # Clean up
            json_report_path = output_path + '.json'
            if os.path.exists(json_report_path):
                os.unlink(json_report_path)
    
    def test_end_to_end_calculation_different_tax_years(self, real_qfx_file_path):
        """Test calculation across different tax years."""
        calculator = CapitalGainsTaxCalculator()
        
        # Test multiple tax years
        tax_years = ["2023-2024", "2024-2025", "2025-2026"]
        
        for tax_year in tax_years:
            with tempfile.NamedTemporaryFile(mode='w', suffix='_test_report', delete=False) as temp_file:
                output_path = temp_file.name
            
            try:
                summary = calculator.calculate(
                    file_path=real_qfx_file_path,
                    tax_year=tax_year,
                    output_path=output_path,
                    report_format="csv"
                )
                
                assert summary is not None
                assert summary.tax_year == tax_year
                
                # Most disposals should be in 2024-2025 based on the QFX file dates
                if tax_year == "2024-2025":
                    assert len(summary.disposals) == 2
                    print(f"✓ {tax_year}: {len(summary.disposals)} disposals, Net gain: £{summary.net_gain:.2f}")
                else:
                    # Other years should have 0 disposals
                    assert len(summary.disposals) == 0
                    print(f"✓ {tax_year}: {len(summary.disposals)} disposals (as expected)")
                
            finally:
                # Clean up
                csv_report_path = output_path + '.csv'
                if os.path.exists(csv_report_path):
                    os.unlink(csv_report_path)
    
    def test_end_to_end_calculation_error_handling(self, real_qfx_file_path):
        """Test error handling in end-to-end calculation."""
        calculator = CapitalGainsTaxCalculator()
        
        # Test with invalid tax year
        with pytest.raises(ValueError, match="Invalid tax year"):
            calculator.calculate(
                file_path=real_qfx_file_path,
                tax_year="invalid-year",
                output_path="test_report"
            )
        
        # Test with non-existent file
        with pytest.raises(Exception):  # Could be FileNotFoundError or other parsing error
            calculator.calculate(
                file_path="non_existent_file.qfx",
                tax_year="2024-2025",
                output_path="test_report"
            )
    
    def test_end_to_end_calculation_component_integration(self, real_qfx_file_path):
        """Test that all components work together correctly in end-to-end scenario."""
        calculator = CapitalGainsTaxCalculator()
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='_test_report', delete=False) as temp_file:
            output_path = temp_file.name
        
        try:
            # Calculate and capture the summary
            summary = calculator.calculate(
                file_path=real_qfx_file_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="csv"
            )
            
            # Verify component integration by checking detailed disposal information
            assert len(summary.disposals) > 0, "No disposals found"
            
            for disposal in summary.disposals:
                # Verify disposal has all required fields
                assert disposal.security is not None, "Disposal missing security"
                assert disposal.sell_date is not None, "Disposal missing sell date"
                assert disposal.quantity > 0, "Disposal quantity should be positive"
                assert disposal.proceeds > 0, "Disposal proceeds should be positive"
                assert disposal.cost_basis > 0, "Disposal cost basis should be positive"
                assert disposal.matching_rule in ["same-day", "30-day", "section-104"], f"Invalid matching rule: {disposal.matching_rule}"
                
                # Verify gain/loss calculation
                expected_gain_loss = disposal.proceeds - disposal.cost_basis - disposal.expenses
                assert abs(disposal.gain_or_loss - expected_gain_loss) < 0.01, "Gain/loss calculation incorrect"
                
                print(f"✓ Disposal validated: {disposal.security.get_display_name()}")
                print(f"  Date: {disposal.sell_date.strftime('%Y-%m-%d')}")
                print(f"  Quantity: {disposal.quantity}")
                print(f"  Proceeds: £{disposal.proceeds:.2f}")
                print(f"  Cost Basis: £{disposal.cost_basis:.2f}")
                print(f"  Expenses: £{disposal.expenses:.2f}")
                print(f"  Gain/Loss: £{disposal.gain_or_loss:.2f}")
                print(f"  Matching Rule: {disposal.matching_rule}")
            
            # Verify tax year summary calculations
            total_gains = sum(d.gain_or_loss for d in summary.disposals if d.gain_or_loss > 0)
            total_losses = sum(abs(d.gain_or_loss) for d in summary.disposals if d.gain_or_loss < 0)
            
            assert abs(summary.total_gains - total_gains) < 0.01, "Total gains calculation incorrect"
            assert abs(summary.total_losses - total_losses) < 0.01, "Total losses calculation incorrect"
            assert abs(summary.net_gain - (total_gains - total_losses)) < 0.01, "Net gain calculation incorrect"
            
            print(f"✓ Tax year summary calculations validated")
            
        finally:
            # Clean up
            csv_report_path = output_path + '.csv'
            if os.path.exists(csv_report_path):
                os.unlink(csv_report_path)
    
    def test_end_to_end_calculation_performance(self, real_qfx_file_path):
        """Test performance of end-to-end calculation."""
        import time
        
        calculator = CapitalGainsTaxCalculator()
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='_test_report', delete=False) as temp_file:
            output_path = temp_file.name
        
        try:
            # Measure calculation time
            start_time = time.time()
            
            summary = calculator.calculate(
                file_path=real_qfx_file_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="csv"
            )
            
            end_time = time.time()
            calculation_time = end_time - start_time
            
            # Verify calculation completed successfully
            assert summary is not None
            assert len(summary.disposals) > 0
            
            # Performance should be reasonable (under 5 seconds for this small file)
            assert calculation_time < 5.0, f"Calculation took too long: {calculation_time:.2f} seconds"
            
            print(f"✓ End-to-end calculation completed in {calculation_time:.3f} seconds")
            print(f"  Processed {len(summary.disposals)} disposals")
            print(f"  Performance: {len(summary.disposals) / calculation_time:.1f} disposals/second")
            
        finally:
            # Clean up
            csv_report_path = output_path + '.csv'
            if os.path.exists(csv_report_path):
                os.unlink(csv_report_path)
