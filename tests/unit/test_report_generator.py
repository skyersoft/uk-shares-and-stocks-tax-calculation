"""Unit tests for the report generator services."""
import pytest
import os
import csv
import json
import tempfile
from datetime import datetime

from src.main.python.services.report_generator import CSVReportGenerator, JSONReportGenerator
from src.main.python.models.domain_models import (
    Disposal,
    Security,
    TaxYearSummary
)


class TestCSVReportGenerator:
    """Unit tests for the CSV Report Generator."""
    
    def test_csv_report_generation(self):
        """Test CSV report generation with sample data."""
        generator = CSVReportGenerator()
        
        # Create test data
        security1 = Security(isin="GB00B16KPT44", symbol="HSBA")
        security2 = Security(isin="US0378331005", symbol="AAPL")
        
        disposal1 = Disposal(
            security=security1,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=700.0,
            cost_basis=500.0,
            expenses=10.0,
            matching_rule="section-104"
        )
        
        disposal2 = Disposal(
            security=security2,
            sell_date=datetime(2024, 12, 20),
            quantity=50.0,
            proceeds=1500.0,
            cost_basis=1200.0,
            expenses=15.0,
            matching_rule="same-day"
        )
        
        # Create tax year summary
        summary = TaxYearSummary(tax_year="2024-2025")
        summary.add_disposal(disposal1)
        summary.add_disposal(disposal2)
        
        # Apply annual exemption
        summary.annual_exemption_used = min(3000.0, summary.net_gain)
        summary.taxable_gain = max(0, summary.net_gain - summary.annual_exemption_used)
        
        # Generate report to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            generator.generate_report(summary, temp_path)
            
            # Verify file was created
            assert os.path.exists(temp_path)
            
            # Read and verify CSV content
            with open(temp_path, 'r') as csvfile:
                reader = csv.reader(csvfile)
                rows = list(reader)
            
            # Check header row
            expected_header = [
                'Disposal Date', 'Security', 'Quantity', 'Proceeds (GBP)', 
                'Cost (GBP)', 'Expenses (GBP)', 'Gain/Loss (GBP)', 'Matching Rule'
            ]
            assert rows[0] == expected_header
            
            # Check first disposal row
            assert rows[1][0] == '2024-06-15'  # Date
            assert rows[1][1] == 'GB00B16KPT44'  # Security
            assert rows[1][2] == '100.0'  # Quantity
            assert rows[1][3] == '700.00'  # Proceeds
            assert rows[1][4] == '500.00'  # Cost
            assert rows[1][5] == '10.00'  # Expenses
            assert rows[1][6] == '190.00'  # Gain/Loss
            assert rows[1][7] == 'section-104'  # Matching Rule
            
            # Check second disposal row
            assert rows[2][0] == '2024-12-20'  # Date
            assert rows[2][1] == 'US0378331005'  # Security
            assert rows[2][2] == '50.0'  # Quantity
            assert rows[2][3] == '1500.00'  # Proceeds
            assert rows[2][4] == '1200.00'  # Cost
            assert rows[2][5] == '15.00'  # Expenses
            assert rows[2][6] == '285.00'  # Gain/Loss
            assert rows[2][7] == 'same-day'  # Matching Rule
            
            # Check summary section exists
            summary_start = None
            for i, row in enumerate(rows):
                if row and row[0] == 'Tax Year Summary':
                    summary_start = i
                    break
            
            assert summary_start is not None, "Tax Year Summary section not found"
            
            # Check summary values
            assert rows[summary_start + 1] == ['Tax Year', '2024-2025']
            assert rows[summary_start + 2] == ['Total Proceeds', '2200.00']
            assert rows[summary_start + 3] == ['Total Gains', '475.00']
            assert rows[summary_start + 4] == ['Total Losses', '0.00']
            assert rows[summary_start + 5] == ['Net Gain/Loss', '475.00']
            assert rows[summary_start + 6] == ['Annual Exemption Used', '475.00']
            assert rows[summary_start + 7] == ['Taxable Gain', '0.00']
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_csv_report_with_losses(self):
        """Test CSV report generation with losses."""
        generator = CSVReportGenerator()
        
        # Create test data with a loss
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        disposal = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=400.0,
            cost_basis=500.0,
            expenses=10.0,
            matching_rule="section-104"
        )
        
        # Create tax year summary
        summary = TaxYearSummary(tax_year="2024-2025")
        summary.add_disposal(disposal)
        
        # With a net loss, no exemption is used
        summary.annual_exemption_used = 0.0
        summary.taxable_gain = 0.0
        
        # Generate report to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            generator.generate_report(summary, temp_path)
            
            # Verify file was created
            assert os.path.exists(temp_path)
            
            # Read and verify CSV content
            with open(temp_path, 'r') as csvfile:
                reader = csv.reader(csvfile)
                rows = list(reader)
            
            # Check disposal row shows loss
            assert rows[1][6] == '-110.00'  # Gain/Loss (negative)
            
            # Find summary section
            summary_start = None
            for i, row in enumerate(rows):
                if row and row[0] == 'Tax Year Summary':
                    summary_start = i
                    break
            
            # Check summary shows loss
            assert rows[summary_start + 3] == ['Total Gains', '0.00']
            assert rows[summary_start + 4] == ['Total Losses', '110.00']
            assert rows[summary_start + 5] == ['Net Gain/Loss', '-110.00']
            assert rows[summary_start + 6] == ['Annual Exemption Used', '0.00']
            assert rows[summary_start + 7] == ['Taxable Gain', '0.00']
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_csv_file_extension_handling(self):
        """Test that CSV generator adds .csv extension if missing."""
        generator = CSVReportGenerator()
        
        # Create minimal test data
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        disposal = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=700.0,
            cost_basis=500.0,
            expenses=10.0,
            matching_rule="section-104"
        )
        
        summary = TaxYearSummary(tax_year="2024-2025")
        summary.add_disposal(disposal)
        
        # Generate report without .csv extension
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_file:
            temp_path_without_ext = temp_file.name
        
        # Remove the file so we can test creation
        os.unlink(temp_path_without_ext)
        
        try:
            generator.generate_report(summary, temp_path_without_ext)
            
            # Should have created file with .csv extension
            expected_path = temp_path_without_ext + '.csv'
            assert os.path.exists(expected_path)
            
        finally:
            # Clean up
            expected_path = temp_path_without_ext + '.csv'
            if os.path.exists(expected_path):
                os.unlink(expected_path)


class TestJSONReportGenerator:
    """Unit tests for the JSON Report Generator."""
    
    def test_json_report_generation(self):
        """Test JSON report generation with sample data."""
        generator = JSONReportGenerator()
        
        # Create test data
        security1 = Security(isin="GB00B16KPT44", symbol="HSBA")
        security2 = Security(isin="US0378331005", symbol="AAPL")
        
        disposal1 = Disposal(
            security=security1,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=700.0,
            cost_basis=500.0,
            expenses=10.0,
            matching_rule="section-104"
        )
        
        disposal2 = Disposal(
            security=security2,
            sell_date=datetime(2024, 12, 20),
            quantity=50.0,
            proceeds=1500.0,
            cost_basis=1200.0,
            expenses=15.0,
            matching_rule="same-day"
        )
        
        # Create tax year summary
        summary = TaxYearSummary(tax_year="2024-2025")
        summary.add_disposal(disposal1)
        summary.add_disposal(disposal2)
        
        # Apply annual exemption
        summary.annual_exemption_used = min(3000.0, summary.net_gain)
        summary.taxable_gain = max(0, summary.net_gain - summary.annual_exemption_used)
        
        # Generate report to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            generator.generate_report(summary, temp_path)
            
            # Verify file was created
            assert os.path.exists(temp_path)
            
            # Read and verify JSON content
            with open(temp_path, 'r') as jsonfile:
                data = json.load(jsonfile)
            
            # Check top-level structure
            assert 'tax_year' in data
            assert 'disposals' in data
            assert 'summary' in data
            
            # Check tax year
            assert data['tax_year'] == '2024-2025'
            
            # Check disposals
            assert len(data['disposals']) == 2
            
            # Check first disposal
            disposal1_data = data['disposals'][0]
            assert disposal1_data['date'] == '2024-06-15'
            assert disposal1_data['security'] == 'GB00B16KPT44'
            assert disposal1_data['quantity'] == 100.0
            assert disposal1_data['proceeds'] == 700.0
            assert disposal1_data['cost_basis'] == 500.0
            assert disposal1_data['expenses'] == 10.0
            assert disposal1_data['gain_or_loss'] == 190.0
            assert disposal1_data['matching_rule'] == 'section-104'
            
            # Check second disposal
            disposal2_data = data['disposals'][1]
            assert disposal2_data['date'] == '2024-12-20'
            assert disposal2_data['security'] == 'US0378331005'
            assert disposal2_data['quantity'] == 50.0
            assert disposal2_data['proceeds'] == 1500.0
            assert disposal2_data['cost_basis'] == 1200.0
            assert disposal2_data['expenses'] == 15.0
            assert disposal2_data['gain_or_loss'] == 285.0
            assert disposal2_data['matching_rule'] == 'same-day'
            
            # Check summary
            summary_data = data['summary']
            assert summary_data['total_proceeds'] == 2200.0
            assert summary_data['total_gains'] == 475.0
            assert summary_data['total_losses'] == 0.0
            assert summary_data['net_gain'] == 475.0
            assert summary_data['annual_exemption_used'] == 475.0
            assert summary_data['taxable_gain'] == 0.0
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_json_report_with_losses(self):
        """Test JSON report generation with losses."""
        generator = JSONReportGenerator()
        
        # Create test data with a loss
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        disposal = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=400.0,
            cost_basis=500.0,
            expenses=10.0,
            matching_rule="section-104"
        )
        
        # Create tax year summary
        summary = TaxYearSummary(tax_year="2024-2025")
        summary.add_disposal(disposal)
        
        # With a net loss, no exemption is used
        summary.annual_exemption_used = 0.0
        summary.taxable_gain = 0.0
        
        # Generate report to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            generator.generate_report(summary, temp_path)
            
            # Verify file was created
            assert os.path.exists(temp_path)
            
            # Read and verify JSON content
            with open(temp_path, 'r') as jsonfile:
                data = json.load(jsonfile)
            
            # Check disposal shows loss
            disposal_data = data['disposals'][0]
            assert disposal_data['gain_or_loss'] == -110.0
            
            # Check summary shows loss
            summary_data = data['summary']
            assert summary_data['total_gains'] == 0.0
            assert summary_data['total_losses'] == 110.0
            assert summary_data['net_gain'] == -110.0
            assert summary_data['annual_exemption_used'] == 0.0
            assert summary_data['taxable_gain'] == 0.0
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_json_file_extension_handling(self):
        """Test that JSON generator adds .json extension if missing."""
        generator = JSONReportGenerator()
        
        # Create minimal test data
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        disposal = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=100.0,
            proceeds=700.0,
            cost_basis=500.0,
            expenses=10.0,
            matching_rule="section-104"
        )
        
        summary = TaxYearSummary(tax_year="2024-2025")
        summary.add_disposal(disposal)
        
        # Generate report without .json extension
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_file:
            temp_path_without_ext = temp_file.name
        
        # Remove the file so we can test creation
        os.unlink(temp_path_without_ext)
        
        try:
            generator.generate_report(summary, temp_path_without_ext)
            
            # Should have created file with .json extension
            expected_path = temp_path_without_ext + '.json'
            assert os.path.exists(expected_path)
            
            # Verify it's valid JSON
            with open(expected_path, 'r') as jsonfile:
                data = json.load(jsonfile)
                assert 'tax_year' in data
                assert 'disposals' in data
                assert 'summary' in data
            
        finally:
            # Clean up
            expected_path = temp_path_without_ext + '.json'
            if os.path.exists(expected_path):
                os.unlink(expected_path)
    
    def test_json_number_precision(self):
        """Test that JSON report rounds numbers to 2 decimal places."""
        generator = JSONReportGenerator()
        
        # Create test data with precise decimal values
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        disposal = Disposal(
            security=security,
            sell_date=datetime(2024, 6, 15),
            quantity=33.333,  # Precise decimal
            proceeds=700.123456,  # Many decimal places
            cost_basis=500.987654,  # Many decimal places
            expenses=10.555555,  # Many decimal places
            matching_rule="section-104"
        )
        
        summary = TaxYearSummary(tax_year="2024-2025")
        summary.add_disposal(disposal)
        
        # Generate report to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            generator.generate_report(summary, temp_path)
            
            # Read and verify JSON content
            with open(temp_path, 'r') as jsonfile:
                data = json.load(jsonfile)
            
            # Check that numbers are rounded to 2 decimal places
            disposal_data = data['disposals'][0]
            assert disposal_data['proceeds'] == 700.12  # Rounded
            assert disposal_data['cost_basis'] == 500.99  # Rounded
            assert disposal_data['expenses'] == 10.56  # Rounded
            
            # Check summary rounding
            summary_data = data['summary']
            assert isinstance(summary_data['total_proceeds'], float)
            assert isinstance(summary_data['total_gains'], float)
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)


class TestReportGeneratorIntegration:
    """Integration tests for report generators."""
    
    def test_empty_tax_year_summary(self):
        """Test report generation with empty tax year summary."""
        csv_generator = CSVReportGenerator()
        json_generator = JSONReportGenerator()
        
        # Create empty tax year summary
        summary = TaxYearSummary(tax_year="2024-2025")
        
        # Test CSV generation
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_file:
            csv_path = temp_file.name
        
        try:
            csv_generator.generate_report(summary, csv_path)
            assert os.path.exists(csv_path)
            
            # Verify CSV has header and summary but no disposal rows
            with open(csv_path, 'r') as csvfile:
                reader = csv.reader(csvfile)
                rows = list(reader)
                
            # Should have header, blank row, and summary
            assert len(rows) >= 3
            assert 'Disposal Date' in rows[0]  # Header
            
        finally:
            if os.path.exists(csv_path):
                os.unlink(csv_path)
        
        # Test JSON generation
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            json_path = temp_file.name
        
        try:
            json_generator.generate_report(summary, json_path)
            assert os.path.exists(json_path)
            
            # Verify JSON structure
            with open(json_path, 'r') as jsonfile:
                data = json.load(jsonfile)
                
            assert data['tax_year'] == '2024-2025'
            assert data['disposals'] == []  # Empty list
            assert 'summary' in data
            
        finally:
            if os.path.exists(json_path):
                os.unlink(json_path)
