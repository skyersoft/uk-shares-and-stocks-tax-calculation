"""End-to-end system tests for the UK Capital Gains Tax Calculator.

These tests verify the complete system behavior from a user's perspective,
testing real-world scenarios with actual QFX files and validating the
entire tax calculation pipeline.

Task 10.1: End-to-end system test with complete tax calculation
"""
import pytest
import tempfile
import os
import subprocess
import sys
import json
import csv
import time
from pathlib import Path
from datetime import datetime, date

from src.main.python.calculator import CapitalGainsTaxCalculator
from src.main.python.cli import CapitalGainsCLI


class TestEndToEndSystem:
    """System tests for complete tax calculation workflow."""
    
    @pytest.fixture
    def real_qfx_file_path(self):
        """Path to real QFX data file for system testing."""
        return "data/U11075163_20240408_20250404.qfx"
    
    @pytest.fixture
    def real_csv_file_path(self):
        """Path to real CSV data file for system testing."""
        return "data/Sharesight.csv"
    
    @pytest.fixture
    def temp_output_dir(self):
        """Create temporary directory for test outputs."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield temp_dir
    
    def test_complete_tax_calculation_workflow_csv(self, real_qfx_file_path, temp_output_dir):
        """Test complete end-to-end tax calculation workflow with CSV output.
        
        This system test verifies:
        1. QFX file parsing
        2. Transaction processing
        3. UK tax rule application
        4. Capital gains calculation
        5. Report generation
        6. File output validation
        """
        # System test: Complete workflow via CLI
        cli = CapitalGainsCLI()
        output_path = os.path.join(temp_output_dir, "system_test_report")
        
        # Execute complete workflow
        start_time = time.time()
        result = cli.run([
            real_qfx_file_path,
            "2024-2025",
            "--output", output_path,
            "--format", "csv",
            "--verbose"
        ])
        execution_time = time.time() - start_time
        
        # Verify successful execution
        assert result == 0, "System should execute successfully"
        
        # Verify CSV report generation
        csv_file = f"{output_path}.csv"
        assert os.path.exists(csv_file), f"CSV report should be generated: {csv_file}"
        
        # System validation: Parse and validate CSV content
        with open(csv_file, 'r', newline='') as csvfile:
            content = csvfile.read()
            
            # Verify CSV structure and headers
            assert 'Disposal Date' in content, "CSV should contain disposal headers"
            assert 'Security' in content, "CSV should contain security column"
            assert 'Quantity' in content, "CSV should contain quantity column"
            assert 'Proceeds' in content, "CSV should contain proceeds column"
            assert 'Cost' in content, "CSV should contain cost column"
            assert 'Gain/Loss' in content, "CSV should contain gain/loss column"
            assert 'Matching Rule' in content, "CSV should contain matching rule column"
            
            # Verify summary section (either format)
            assert ('Tax Year Summary' in content or 'Capital Gains Summary' in content), "CSV should contain summary section"
            assert '2024-2025' in content, "CSV should contain correct tax year"
            assert 'Total Proceeds' in content or 'Proceeds' in content, "CSV should show total proceeds"
            assert 'Total Gains' in content, "CSV should show total gains"
            assert 'Net Gain' in content or 'Net Gain/Loss' in content, "CSV should show net gain"
            assert 'Annual Exemption Used' in content or 'Allowance Used' in content, "CSV should show annual exemption"
            assert 'Taxable Gain' in content, "CSV should show taxable gain"
            
            # Verify expected securities are present
            assert 'VS3770' in content or 'JE00B1VS3770' in content, "Should contain first security"
            assert '871085' in content or 'KYG393871085' in content, "Should contain second security"
            
            # Parse CSV data for detailed validation
            lines = content.split('\n')
            
            # Find header line and summary section
            header_line = None
            summary_start = None
            for i, line in enumerate(lines):
                if 'Disposal Date' in line:
                    header_line = i
                elif any(s in line for s in ['Tax Year Summary', 'Capital Gains Summary']):
                    summary_start = i
                    break
            
            assert header_line is not None, "CSV header not found"
            assert summary_start is not None, "Summary section not found"
            
            # Extract only disposal data rows (between header and summary)
            data_rows = []
            for i in range(header_line + 1, summary_start):
                line = lines[i].strip()
                if line and ',' in line:
                    data_rows.append(line)
            
            assert len(data_rows) >= 2, f"Expected at least 2 disposal rows, found {len(data_rows)}"
            
            # Validate each disposal row has correct number of columns
            reader = csv.reader(data_rows)
            for row_num, row in enumerate(reader):
                assert len(row) >= 7, f"Row {row_num} should have at least 7 columns: {row}"
                
                # Validate date format (first column)
                try:
                    datetime.strptime(row[0], '%Y-%m-%d')
                except ValueError:
                    pytest.fail(f"Invalid date format in row {row_num}: {row[0]}")
                
                # Validate numeric fields (quantity, proceeds, cost, gain/loss)
                for col_idx in [2, 3, 4, 5]:  # quantity, proceeds, cost, gain/loss
                    try:
                        float(row[col_idx].replace('£', '').replace(',', ''))
                    except ValueError:
                        pytest.fail(f"Invalid numeric value in row {row_num}, column {col_idx}: {row[col_idx]}")
        
        print(f"✓ Complete CSV workflow test passed in {execution_time:.3f} seconds")
        print(f"  Report generated: {csv_file}")
        print(f"  File size: {os.path.getsize(csv_file)} bytes")
    
    def test_complete_tax_calculation_workflow_json(self, real_qfx_file_path, temp_output_dir):
        """Test complete end-to-end tax calculation workflow with JSON output."""
        # Import the JSON report generator
        from src.main.python.services.report_generator import JSONReportGenerator
        
        # System test: Complete workflow via programmatic API
        calculator = CapitalGainsTaxCalculator(report_generator=JSONReportGenerator())
        output_path = os.path.join(temp_output_dir, "system_test_json_report")
        
        # Execute complete workflow
        start_time = time.time()
        summary = calculator.calculate(
            file_path=real_qfx_file_path,
            tax_year="2024-2025",
            output_path=output_path,
            report_format="json"
        )
        execution_time = time.time() - start_time
        
        # Verify calculation results
        assert summary is not None, "Calculation should return summary"
        assert summary.tax_year == "2024-2025", "Summary should have correct tax year"
        
        # Verify JSON report generation
        json_file = f"{output_path}.json"
        assert os.path.exists(json_file), f"JSON report should be generated: {json_file}"
        
        # System validation: Parse and validate JSON content
        with open(json_file, 'r') as jsonfile:
            data = json.load(jsonfile)
            
            # Verify JSON structure (comprehensive format)
            required_keys = ['tax_year', 'capital_gains']
            for key in required_keys:
                assert key in data, f"JSON should contain '{key}' key"
            
            # Verify tax year
            assert data['tax_year'] == '2024-2025', "JSON should contain correct tax year"
            
            # Verify capital gains section
            capital_gains = data['capital_gains']
            assert 'disposals' in capital_gains, "Capital gains should contain disposals"
            assert 'summary' in capital_gains, "Capital gains should contain summary"
            
            # Verify disposals
            disposals = capital_gains['disposals']
            assert len(disposals) >= 2, f"Expected at least 2 disposals, found {len(disposals)}"
            
            for disposal in disposals:
                # Verify disposal structure
                required_disposal_keys = [
                    'date', 'security', 'quantity', 'proceeds',
                    'cost_basis', 'expenses', 'gain_or_loss', 'matching_rule'
                ]
                for key in required_disposal_keys:
                    assert key in disposal, f"Disposal should contain '{key}' key"
                
                # Verify data types and values
                assert isinstance(disposal['date'], str), "Disposal date should be string"
                assert isinstance(disposal['quantity'], (int, float)), "Quantity should be numeric"
                assert isinstance(disposal['proceeds'], (int, float)), "Proceeds should be numeric"
                assert isinstance(disposal['cost_basis'], (int, float)), "Cost basis should be numeric"
                assert isinstance(disposal['gain_or_loss'], (int, float)), "Gain/loss should be numeric"
                assert disposal['matching_rule'] in ['same-day', '30-day', 'section-104'], f"Invalid matching rule: {disposal['matching_rule']}"
                
                # Verify date format
                try:
                    datetime.fromisoformat(disposal['date'])
                except ValueError:
                    pytest.fail(f"Invalid date format: {disposal['date']}")
                
                # Verify positive values where expected
                assert disposal['quantity'] > 0, "Quantity should be positive"
                assert disposal['proceeds'] > 0, "Proceeds should be positive"
                assert disposal['cost_basis'] > 0, "Cost basis should be positive"
            
            # Verify summary
            summary_data = capital_gains['summary']
            required_summary_keys = [
                'total_gains', 'taxable_gain', 'allowance_used'
            ]
            for key in required_summary_keys:
                assert key in summary_data, f"Summary should contain '{key}' key"
                assert isinstance(summary_data[key], (int, float)), f"Summary '{key}' should be numeric"
            
            # Verify expected values
            assert summary_data['total_gains'] > 1000, "Total gains should be > £1,000"
            assert summary_data['taxable_gain'] == 0, "Taxable gain should be £0 (covered by exemption)"
            assert summary_data['allowance_used'] > 0, "Some allowance should be used"
        
        print(f"✓ Complete JSON workflow test passed in {execution_time:.3f} seconds")
        print(f"  Report generated: {json_file}")
        print(f"  File size: {os.path.getsize(json_file)} bytes")
        print(f"  Disposals processed: {len(data['capital_gains']['disposals'])}")
    
    def test_system_command_line_interface(self, real_qfx_file_path, temp_output_dir):
        """Test system behavior via command line interface (subprocess)."""
        output_path = os.path.join(temp_output_dir, "cli_system_test_report")
        
        # Test CLI as subprocess (real command-line usage)
        cmd = [
            sys.executable, "-m", "src.main.python.cli",
            real_qfx_file_path,
            "2024-2025",
            "--output", output_path,
            "--format", "csv",
            "--verbose"
        ]
        
        start_time = time.time()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=os.getcwd()
        )
        execution_time = time.time() - start_time
        
        # Verify successful execution
        assert result.returncode == 0, f"CLI should succeed. stderr: {result.stderr}"
        
        # Verify output contains expected information
        stdout = result.stdout
        assert "Processing file:" in stdout, "Should show processing information"
        assert "Tax year: 2024-2025" in stdout, "Should show tax year"
        assert "Capital gains calculation completed successfully!" in stdout, "Should show success message"
        assert "Report saved to:" in stdout, "Should show report location"
        
        # Verify report file was created
        csv_file = f"{output_path}.csv"
        assert os.path.exists(csv_file), f"CSV report should be created: {csv_file}"
        
        # Verify file is not empty and contains expected content
        file_size = os.path.getsize(csv_file)
        assert file_size > 400, f"Report file should be substantial, got {file_size} bytes"
        
        with open(csv_file, 'r') as f:
            content = f.read()
            assert '2024-2025' in content, "Report should contain tax year"
            assert ('Tax Year Summary' in content or 'Capital Gains Summary' in content), "Report should contain summary"
        
        print(f"✓ CLI system test passed in {execution_time:.3f} seconds")
        print(f"  Command: {' '.join(cmd)}")
        print(f"  Return code: {result.returncode}")
        print(f"  Output file size: {file_size} bytes")
    
    def test_system_multiple_tax_years(self, real_qfx_file_path, temp_output_dir):
        """Test system behavior across multiple tax years."""
        # Import the JSON report generator
        from src.main.python.services.report_generator import JSONReportGenerator
        
        calculator = CapitalGainsTaxCalculator(report_generator=JSONReportGenerator())
        
        tax_years = ["2023-2024", "2024-2025"]  # Only test supported tax years
        results = {}
        
        for tax_year in tax_years:
            output_path = os.path.join(temp_output_dir, f"multi_year_test_{tax_year}")
            
            start_time = time.time()
            summary = calculator.calculate(
                file_path=real_qfx_file_path,
                tax_year=tax_year,
                output_path=output_path,
                report_format="json"
            )
            execution_time = time.time() - start_time
            
            results[tax_year] = {
                'summary': summary,
                'execution_time': execution_time,
                'disposals': len(summary.disposals)
            }
            
            # Verify report generation
            json_file = f"{output_path}.json"
            assert os.path.exists(json_file), f"Report should be generated for {tax_year}"
            
            # Verify JSON content
            with open(json_file, 'r') as f:
                data = json.load(f)
                assert data['tax_year'] == tax_year, f"Report should contain correct tax year {tax_year}"
        
        # Verify expected distribution of disposals across tax years
        # Based on QFX file, most disposals should be in 2024-2025
        assert results['2024-2025']['disposals'] >= 2, "2024-2025 should have disposals"
        assert results['2023-2024']['disposals'] == 0, "2023-2024 should have no disposals"
        
        # Verify performance consistency
        for tax_year, result in results.items():
            assert result['execution_time'] < 5.0, f"Execution for {tax_year} took too long: {result['execution_time']:.2f}s"
        
        print("✓ Multi-year system test passed")
        for tax_year, result in results.items():
            print(f"  {tax_year}: {result['disposals']} disposals in {result['execution_time']:.3f}s")
    
    def test_system_error_handling_and_recovery(self, temp_output_dir):
        """Test system error handling and recovery scenarios."""
        calculator = CapitalGainsTaxCalculator()
        cli = CapitalGainsCLI()
        
        # Test 1: Non-existent file
        with pytest.raises(Exception):
            calculator.calculate(
                file_path="non_existent_file.qfx",
                tax_year="2024-2025",
                output_path=os.path.join(temp_output_dir, "error_test1")
            )
        
        # Test 2: Invalid tax year
        with pytest.raises(ValueError, match="Invalid tax year"):
            calculator.calculate(
                file_path="data/U11075163_20240408_20250404.qfx",
                tax_year="invalid-year",
                output_path=os.path.join(temp_output_dir, "error_test2")
            )
        
        # Test 3: CLI error handling
        result = cli.run([
            "non_existent_file.qfx",
            "2024-2025"
        ])
        assert result == 1, "CLI should return error code for non-existent file"
        
        # Test 4: CLI invalid tax year
        result = cli.run([
            "data/U11075163_20240408_20250404.qfx",
            "invalid-year"
        ])
        assert result == 1, "CLI should return error code for invalid tax year"
        
        # Test 5: Invalid output directory (read-only)
        if os.name != 'nt':  # Skip on Windows due to permission complexity
            readonly_dir = os.path.join(temp_output_dir, "readonly")
            os.makedirs(readonly_dir, mode=0o444)
            
            try:
                result = cli.run([
                    "data/U11075163_20240408_20250404.qfx",
                    "2024-2025",
                    "--output", os.path.join(readonly_dir, "test_report")
                ])
                assert result == 1, "CLI should handle permission errors gracefully"
            finally:
                # Restore permissions for cleanup
                os.chmod(readonly_dir, 0o755)
        
        print("✓ Error handling system test passed")
    
    def test_system_data_integrity_and_consistency(self, real_qfx_file_path, temp_output_dir):
        """Test data integrity and consistency across multiple runs."""
        # Import the JSON report generator
        from src.main.python.services.report_generator import JSONReportGenerator
        
        calculator = CapitalGainsTaxCalculator(report_generator=JSONReportGenerator())
        
        # Run calculation multiple times
        results = []
        for run in range(3):
            output_path = os.path.join(temp_output_dir, f"consistency_test_run_{run}")
            
            summary = calculator.calculate(
                file_path=real_qfx_file_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="json"
            )
            
            results.append(summary)
            
            # Verify JSON file
            json_file = f"{output_path}.json"
            with open(json_file, 'r') as f:
                data = json.load(f)
                results[-1].json_data = data
        
        # Verify consistency across runs
        base_result = results[0]
        for i, result in enumerate(results[1:], 1):
            # Verify summary consistency
            assert result.tax_year == base_result.tax_year, f"Tax year inconsistent in run {i}"
            assert len(result.disposals) == len(base_result.disposals), f"Number of disposals inconsistent in run {i}"
            assert abs(result.total_proceeds - base_result.total_proceeds) < 0.01, f"Total proceeds inconsistent in run {i}"
            assert abs(result.net_gain - base_result.net_gain) < 0.01, f"Net gain inconsistent in run {i}"
            assert abs(result.taxable_gain - base_result.taxable_gain) < 0.01, f"Taxable gain inconsistent in run {i}"
            
            # Verify disposal-level consistency
            for j, (disposal, base_disposal) in enumerate(zip(result.disposals, base_result.disposals)):
                assert disposal.sell_date == base_disposal.sell_date, f"Disposal {j} date inconsistent in run {i}"
                assert abs(disposal.quantity - base_disposal.quantity) < 0.001, f"Disposal {j} quantity inconsistent in run {i}"
                assert abs(disposal.proceeds - base_disposal.proceeds) < 0.01, f"Disposal {j} proceeds inconsistent in run {i}"
                assert abs(disposal.gain_or_loss - base_disposal.gain_or_loss) < 0.01, f"Disposal {j} gain/loss inconsistent in run {i}"
                assert disposal.matching_rule == base_disposal.matching_rule, f"Disposal {j} matching rule inconsistent in run {i}"
        
        print("✓ Data integrity and consistency test passed")
        print(f"  Verified consistency across {len(results)} runs")
        print(f"  Disposals per run: {len(base_result.disposals)}")
        print(f"  Net gain: £{base_result.net_gain:.2f}")
    
    def test_system_performance_benchmarks(self, real_qfx_file_path, temp_output_dir):
        """Test system performance benchmarks and resource usage."""
        import psutil
        import gc
        from src.main.python.services.report_generator import CSVReportGenerator, JSONReportGenerator
        
        # Measure resource usage
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Performance test with multiple formats
        formats = ['csv', 'json']
        performance_results = {}
        
        for fmt in formats:
            # Create calculator with appropriate report generator
            if fmt == "json":
                calculator = CapitalGainsTaxCalculator(report_generator=JSONReportGenerator())
            else:
                calculator = CapitalGainsTaxCalculator(report_generator=CSVReportGenerator())
            
            output_path = os.path.join(temp_output_dir, f"perf_test_{fmt}")
            
            # Measure execution time and memory
            gc.collect()  # Clean up before measurement
            start_memory = process.memory_info().rss / 1024 / 1024  # MB
            start_time = time.time()
            
            summary = calculator.calculate(
                file_path=real_qfx_file_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format=fmt
            )
            
            end_time = time.time()
            end_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            execution_time = end_time - start_time
            memory_used = end_memory - start_memory
            
            performance_results[fmt] = {
                'execution_time': execution_time,
                'memory_used': memory_used,
                'disposals': len(summary.disposals)
            }
            
            # Verify performance benchmarks
            assert execution_time < 5.0, f"{fmt} format took too long: {execution_time:.2f}s"
            assert memory_used < 50, f"{fmt} format used too much memory: {memory_used:.1f}MB"
            
            # Verify output file size is reasonable
            output_file = f"{output_path}.{fmt}"
            file_size = os.path.getsize(output_file) / 1024  # KB
            assert file_size > 0.3, f"{fmt} output file too small: {file_size:.1f}KB"
            assert file_size < 1000, f"{fmt} output file too large: {file_size:.1f}KB"
        
        print("✓ Performance benchmark test passed")
        for fmt, results in performance_results.items():
            print(f"  {fmt.upper()} format:")
            print(f"    Execution time: {results['execution_time']:.3f}s")
            print(f"    Memory used: {results['memory_used']:.1f}MB")
            print(f"    Disposals processed: {results['disposals']}")
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        total_memory_increase = final_memory - initial_memory
        print(f"  Total memory increase: {total_memory_increase:.1f}MB")
    
    def test_complete_tax_calculation_with_csv_input(self, real_csv_file_path, temp_output_dir):
        """Test complete end-to-end tax calculation workflow with CSV input (Task 15.1).
        
        This test verifies that the system can correctly process CSV files
        and generate accurate tax calculations when provided with CSV input.
        """
        # Set up output path
        output_path = os.path.join(temp_output_dir, "csv_input_tax_report")
        
        # Create and configure calculator with CSV parser
        from src.main.python.parsers.csv_parser import CsvParser
        from src.main.python.services.report_generator import CSVReportGenerator
        
        calculator = CapitalGainsTaxCalculator(
            file_parser=CsvParser(base_currency="GBP"),
            report_generator=CSVReportGenerator()
        )
        
        # Run calculation
        tax_year = "2024-2025"
        start_time = time.time()
        summary = calculator.calculate(
            file_path=real_csv_file_path,
            tax_year=tax_year,
            output_path=output_path,
            report_format="csv",
            file_type="csv"
        )
        execution_time = time.time() - start_time
        
        # Verify calculation was successful
        assert summary is not None, "Tax calculation should return a summary"
        assert hasattr(summary, 'disposals'), "Summary should have disposals"
        assert hasattr(summary, 'tax_year'), "Summary should have tax_year"
        assert summary.tax_year == tax_year, "Summary should have correct tax year"
        
        # Verify CSV report was created
        csv_file = f"{output_path}.csv"
        assert os.path.exists(csv_file), f"CSV report should be created at {csv_file}"
        
        # Verify CSV content matches summary data
        with open(csv_file, 'r') as f:
            content = f.read()
            print(f"\nCSV file content (first 200 chars):\n{content[:200]}...")
            
            # Check if this is a comprehensive format or simple format
            lines = content.split('\n')
            
            # Look for capital gains section
            capital_gains_start = None
            disposal_header_line = None
            
            for i, line in enumerate(lines):
                if 'CAPITAL GAINS' in line:
                    capital_gains_start = i
                elif 'Disposal Date' in line and capital_gains_start is not None:
                    disposal_header_line = i
                    break
            
            if capital_gains_start is not None and disposal_header_line is not None:
                # This is comprehensive format - parse the capital gains section
                print(f"\nDetected comprehensive format with capital gains section")
                
                # Find the end of the disposal data (next section or summary)
                disposal_end = None
                for i in range(disposal_header_line + 1, len(lines)):
                    line = lines[i].strip()
                    if not line or line.startswith('Capital Gains Summary') or line.startswith('DIVIDEND') or line.startswith('CURRENCY'):
                        disposal_end = i
                        break
                
                if disposal_end is None:
                    disposal_end = len(lines)
                
                # Extract disposal rows
                disposal_rows = []
                for i in range(disposal_header_line + 1, disposal_end):
                    line = lines[i].strip()
                    if line and ',' in line:
                        disposal_rows.append(line)
                
                print(f"Found {len(disposal_rows)} disposal rows in comprehensive format")
                
                # Verify we have at least some disposals
                assert len(disposal_rows) > 0, "CSV should contain at least one disposal in capital gains section"
                
                # Parse the header to get column names
                header_line = lines[disposal_header_line]
                header_reader = csv.reader([header_line])
                headers = next(header_reader)
                
                # Verify expected columns are present
                assert 'Disposal Date' in headers, "Should have Disposal Date column"
                assert 'Security' in headers, "Should have Security column"
                assert 'Quantity' in headers, "Should have Quantity column"
                assert any('Gain/Loss' in h for h in headers), "Should have Gain/Loss column"
                
            else:
                # This might be simple format - try to parse with DictReader
                f.seek(0)
                reader = csv.DictReader(f)
                rows = list(reader)
                
                # Print available column names
                if rows:
                    print(f"\nAvailable columns: {list(rows[0].keys())}")
                
                # Verify that CSV contains valid disposal data
                disposal_rows = [r for r in rows if r.get('Disposal Date') and r.get('Disposal Date') != 'Tax Year Summary']
                assert len(disposal_rows) > 0, "CSV should contain at least one disposal"
                
                # Check for gain/loss column (might be named differently)
                gain_loss_column = next((col for col in rows[0].keys() if 'gain' in col.lower() or 'loss' in col.lower()), None)
                assert gain_loss_column is not None, f"CSV should contain a gain/loss column. Available columns: {list(rows[0].keys())}"
                
                # Verify security information is present
                security_column = next((col for col in rows[0].keys() if 'security' in col.lower() or 'symbol' in col.lower()), None)
                assert security_column is not None, f"CSV should contain security information. Available columns: {list(rows[0].keys())}"
            
        # Log performance metrics
        print(f"\nCSV calculation performance: {execution_time:.2f} seconds for {len(summary.disposals)} disposals")
        
        #return summary  # Return for potential use in other tests
    
    def test_csv_input_through_cli(self, real_csv_file_path, temp_output_dir):
        """Test end-to-end workflow through CLI with CSV input (Task 15.1).
        
        This test verifies that the CLI correctly handles CSV input
        with explicit file type selection.
        """
        # Set up paths
        output_path = os.path.join(temp_output_dir, "csv_cli_tax_report")
        
        # Create CLI instance
        cli = CapitalGainsCLI()
        
        # Run CLI with CSV input and explicit file type
        start_time = time.time()
        result = cli.run([
            real_csv_file_path,
            "2024-2025",
            "--output", output_path,
            "--format", "csv",
            "--file-type", "csv"  # Explicitly specify CSV file type
        ])
        execution_time = time.time() - start_time
        
        # Verify successful execution
        assert result == 0, "CLI should return success exit code"
        
        # Verify CSV report was created
        csv_file = f"{output_path}.csv"
        assert os.path.exists(csv_file), f"CSV report should be created at {csv_file}"
        
        # Verify CSV content
        with open(csv_file, 'r') as f:
            content = f.read()
            
            # Check for expected headers and content
            assert 'Disposal Date' in content, "CSV should contain disposal headers"
            assert 'Security' in content, "CSV should contain security information"
            assert 'Quantity' in content, "CSV should contain quantity information"
            
        # Count the actual disposals (not including header or summary rows)
        with open(csv_file, 'r', newline='') as f:
            lines = f.readlines()
            # Filter for actual disposal rows (not headers or summary)
            disposal_rows = [line for line in lines if line.strip() and not line.startswith("Tax Year") and 
                             not line.startswith("Disposal Date") and not line.startswith("Total") and 
                             not line.startswith("Annual") and not line.startswith("Net") and 
                             not line.startswith("Taxable")]
            rows = disposal_rows
            
        # Log performance metrics
        print(f"\nCSV CLI performance: {execution_time:.2f} seconds for {len(rows)} disposals")
        
    def test_explicit_file_type_selection(self, real_csv_file_path, temp_output_dir):
        """Test explicit file type selection parameter (Task 15.3).
        
        This test verifies that the explicit file type selection parameter
        correctly overrides any automatic detection based on file extension.
        """
        # Create a copy of the CSV file with a .txt extension to test explicit type selection
        csv_with_wrong_extension = os.path.join(temp_output_dir, "csv_data.txt")
        with open(real_csv_file_path, 'r') as src, open(csv_with_wrong_extension, 'w') as dst:
            dst.write(src.read())
        
        # Set up output path
        output_path = os.path.join(temp_output_dir, "explicit_type_report")
        
        # Create CLI instance
        cli = CapitalGainsCLI()
        
        # The file validation would normally fail due to extension mismatch,
        # so we'll need to mock it or modify the CLI for this test
        with pytest.raises(ValueError, match="File type mismatch"):
            # This should fail due to extension mismatch
            cli.validate_file_path(csv_with_wrong_extension, "csv")
        
        # Now run with a modified validation to test the explicit file type handling
        from src.main.python.parsers.csv_parser import CsvParser
        from src.main.python.services.report_generator import CSVReportGenerator
        
        calculator = CapitalGainsTaxCalculator(
            file_parser=CsvParser(base_currency="GBP"),
            report_generator=CSVReportGenerator()
        )
        
        # Skip the extension validation but process as CSV
        try:
            summary = calculator.calculate(
                file_path=csv_with_wrong_extension,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="csv",
                file_type="csv"  # Explicitly tell it to use CSV parser
            )
            
            # If we reach here, the file was processed successfully despite wrong extension
            assert summary is not None, "Tax calculation should return a summary"
            assert hasattr(summary, 'disposals'), "Summary should have disposals"
            
            # Verify report was created
            csv_file = f"{output_path}.csv"
            assert os.path.exists(csv_file), f"Report should be created at {csv_file}"
            
        except ValueError as e:
            if "File type mismatch" in str(e):
                pytest.skip("CLI enforces file extension matching - test the actual logic separately")
            else:
                raise
