"""Integration tests for CLI with real QFX data."""
import pytest
import tempfile
import os
import subprocess
import sys
from pathlib import Path

from src.main.python.cli import CapitalGainsCLI


class TestCLIIntegration:
    """Integration tests for CLI with real QFX data."""
    
    @pytest.fixture
    def real_qfx_file_path(self):
        """Path to real QFX data file."""
        return "data/U11075163_20240408_20250404.qfx"
    
    @pytest.fixture
    def sample_csv_file_path(self):
        """Path to sample CSV data file."""
        # Use one of the test CSV samples for testing CLI
        from tests.fixtures.csv_samples import get_sample_path, MIXED_TRANSACTIONS
        return get_sample_path(MIXED_TRANSACTIONS)
    
    def test_cli_with_real_qfx_data_csv_format(self, real_qfx_file_path):
        """Test CLI end-to-end with real QFX data and CSV output (Task 9.4)."""
        cli = CapitalGainsCLI()
        
        # Create temporary output directory
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "integration_test_report")
            
            # Run CLI with real data
            result = cli.run([
                real_qfx_file_path,
                "2024-2025",
                "--output", output_path,
                "--format", "csv"
            ])
            
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
                assert 'Proceeds' in content, "CSV should contain proceeds information"
                assert 'Cost' in content, "CSV should contain cost information"
                assert 'Gain/Loss' in content, "CSV should contain gain/loss information"
                assert 'Capital Gains Summary' in content, "CSV should contain summary section"
                assert '2024-2025' in content, "CSV should contain correct tax year"
                
                # Check for expected data (based on previous integration tests)
                assert 'JE00B1VS3770' in content, "Should contain JE00B1VS3770 security"
                assert '871085' in content or 'KYG393871085' in content, "Should contain second security"
                
            print(f"✓ CSV integration test passed - report created at {csv_file}")
    
    def test_cli_with_real_qfx_data_json_format(self, real_qfx_file_path):
        """Test CLI end-to-end with real QFX data and JSON output."""
        cli = CapitalGainsCLI()
        
        # Create temporary output directory
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "integration_test_report")
            
            # Run CLI with real data
            result = cli.run([
                real_qfx_file_path,
                "2024-2025",
                "--output", output_path,
                "--format", "json"
            ])
            
            # Verify successful execution
            assert result == 0, "CLI should return success exit code"
            
            # Verify JSON report was created
            json_file = f"{output_path}.json"
            assert os.path.exists(json_file), f"JSON report should be created at {json_file}"
            
            # Verify JSON content
            import json
            with open(json_file, 'r') as f:
                data = json.load(f)
                
                # Check JSON structure
                assert 'tax_year' in data, "JSON should contain tax_year"
                assert 'capital_gains' in data, "JSON should contain capital_gains"
                assert 'disposals' in data['capital_gains'], "JSON should contain disposals"
                
                # Check tax year
                assert data['tax_year'] == '2024-2025', "JSON should contain correct tax year"
                
                # Check disposals
                assert len(data['capital_gains']['disposals']) == 2, "Should contain 2 disposals"
                
                # Check summary
                summary = data['capital_gains']['summary']
                assert 'total_gains' in summary, "Summary should contain total_gains"
                assert 'taxable_gain' in summary, "Summary should contain taxable_gain"
                
                # Verify expected values (based on previous tests)
                assert summary['total_gains'] > 1000, "Total gains should be > £1,000"
                assert summary['taxable_gain'] == 0, "Taxable gain should be £0 (covered by exemption)"
                
            print(f"✓ JSON integration test passed - report created at {json_file}")
    
    def test_cli_with_verbose_output(self, real_qfx_file_path):
        """Test CLI with verbose output using real data."""
        cli = CapitalGainsCLI()
        
        # Create temporary output directory
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "verbose_test_report")
            
            # Capture stdout to verify verbose output
            import io
            from contextlib import redirect_stdout
            
            captured_output = io.StringIO()
            
            with redirect_stdout(captured_output):
                result = cli.run([
                    real_qfx_file_path,
                    "2024-2025",
                    "--output", output_path,
                    "--format", "csv",
                    "--verbose"
                ])
            
            # Verify successful execution
            assert result == 0, "CLI should return success exit code"
            
            # Verify verbose output
            output = captured_output.getvalue()
            
            # Check for verbose information
            assert "Processing file:" in output, "Should show processing information"
            assert "Tax year: 2024-2025" in output, "Should show tax year"
            assert "Output format: csv" in output, "Should show output format"
            assert "Output path:" in output, "Should show output path"
            assert "Capital gains calculation completed successfully!" in output, "Should show success message"
            assert "Summary:" in output, "Should show summary"
            assert "Tax Year: 2024-2025" in output, "Should show tax year in summary"
            assert "Total Proceeds:" in output, "Should show total proceeds"
            assert "Net Gain:" in output, "Should show net gain"
            assert "Taxable Gain:" in output, "Should show taxable gain"
            assert "Number of Disposals: 2" in output, "Should show number of disposals"
            assert "Disposal Details:" in output, "Should show disposal details in verbose mode"
            assert "Report saved to:" in output, "Should show report location"
            
            print("✓ Verbose output integration test passed")
    
    def test_cli_with_default_output_path(self, real_qfx_file_path):
        """Test CLI with default output path generation."""
        cli = CapitalGainsCLI()
        
        # Run CLI without specifying output path
        result = cli.run([
            real_qfx_file_path,
            "2024-2025",
            "--format", "csv"
        ])
        
        # Verify successful execution
        assert result == 0, "CLI should return success exit code"
        
        # Verify default output file was created
        # Default should be: {base_filename}_{tax_year}_capital_gains.csv
        expected_output = "U11075163_20240408_20250404_2024-2025_capital_gains.csv"
        
        try:
            assert os.path.exists(expected_output), f"Default output file should be created: {expected_output}"
            
            # Verify file content
            with open(expected_output, 'r') as f:
                content = f.read()
                assert '2024-2025' in content, "File should contain correct tax year"
                assert 'Capital Gains Summary' in content, "File should contain summary"
            
            print(f"✓ Default output path test passed - file created: {expected_output}")
            
        finally:
            # Clean up
            if os.path.exists(expected_output):
                os.unlink(expected_output)
    
    def test_cli_different_tax_years(self, real_qfx_file_path):
        """Test CLI with different tax years."""
        cli = CapitalGainsCLI()
        
        tax_years = ["2023-2024", "2024-2025", "2025-2026"]
        
        for tax_year in tax_years:
            with tempfile.TemporaryDirectory() as temp_dir:
                output_path = os.path.join(temp_dir, f"test_report_{tax_year}")
                
                # Run CLI
                result = cli.run([
                    real_qfx_file_path,
                    tax_year,
                    "--output", output_path,
                    "--format", "json"
                ])
                
                # Verify successful execution
                assert result == 0, f"CLI should succeed for tax year {tax_year}"
                
                # Verify report was created
                json_file = f"{output_path}.json"
                assert os.path.exists(json_file), f"Report should be created for {tax_year}"
                
                # Verify content
                import json
                with open(json_file, 'r') as f:
                    data = json.load(f)
                    assert data['tax_year'] == tax_year, f"Should contain correct tax year {tax_year}"
                    
                    # Most disposals should be in 2024-2025
                    if tax_year == "2024-2025":
                        assert len(data['capital_gains']['disposals']) == 2, f"Should have 2 disposals in {tax_year}"
                    else:
                        assert len(data['capital_gains']['disposals']) == 0, f"Should have 0 disposals in {tax_year}"
                
                print(f"✓ Tax year {tax_year} test passed - {len(data['capital_gains']['disposals'])} disposals")
    
    def test_cli_as_subprocess(self, real_qfx_file_path):
        """Test CLI as a subprocess (simulating real command-line usage)."""
        # Create temporary output directory
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "subprocess_test_report")
            
            # Run CLI as subprocess
            cmd = [
                sys.executable, "-m", "src.main.python.cli",
                real_qfx_file_path,
                "2024-2025",
                "--output", output_path,
                "--format", "csv"
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=os.getcwd()
            )
            
            # Verify successful execution
            assert result.returncode == 0, f"Subprocess should succeed. stderr: {result.stderr}"
            
            # Verify output contains expected information
            assert "Capital gains calculation completed successfully!" in result.stdout
            assert "Tax Year: 2024-2025" in result.stdout
            assert "Report saved to:" in result.stdout
            
            # Verify report file was created
            csv_file = f"{output_path}.csv"
            assert os.path.exists(csv_file), f"CSV report should be created at {csv_file}"
            
            print("✓ Subprocess integration test passed")
            print(f"  Command: {' '.join(cmd)}")
            print(f"  Return code: {result.returncode}")
            print(f"  Report created: {csv_file}")
    
    def test_cli_error_scenarios(self, real_qfx_file_path):
        """Test CLI error handling in integration scenarios."""
        cli = CapitalGainsCLI()
        
        # Test with non-existent file
        result = cli.run([
            "non_existent_file.qfx",
            "2024-2025"
        ])
        assert result == 1, "Should return error code for non-existent file"
        
        # Test with invalid tax year
        result = cli.run([
            real_qfx_file_path,
            "invalid-year"
        ])
        assert result == 1, "Should return error code for invalid tax year"
        
        # Test with wrong file extension
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            result = cli.run([
                temp_path,
                "2024-2025"
            ])
            assert result == 1, "Should return error code for wrong file extension"
        finally:
            os.unlink(temp_path)
        
        print("✓ Error scenario integration tests passed")
    
    def test_cli_performance_with_real_data(self, real_qfx_file_path):
        """Test CLI performance with real data."""
        import time
        
        cli = CapitalGainsCLI()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "performance_test_report")
            
            # Measure execution time
            start_time = time.time()
            
            result = cli.run([
                real_qfx_file_path,
                "2024-2025",
                "--output", output_path,
                "--format", "csv"
            ])
            
            end_time = time.time()
            execution_time = end_time - start_time
            
            # Verify successful execution
            assert result == 0, "CLI should execute successfully"
            
            # Performance should be reasonable (under 5 seconds for this file)
            assert execution_time < 5.0, f"CLI execution took too long: {execution_time:.2f} seconds"
            
            print(f"✓ Performance test passed - execution time: {execution_time:.3f} seconds")
    
    def test_cli_with_csv_data_explicit_type_selection(self, sample_csv_file_path):
        """Test CLI end-to-end with CSV data and explicit file type selection (Task 14.4)."""
        cli = CapitalGainsCLI()
        
        # Create temporary output directory
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "csv_integration_test_report")
            
            # Run CLI with CSV data and explicit file type
            result = cli.run([
                sample_csv_file_path,
                "2024-2025",
                "--output", output_path,
                "--format", "csv",
                "--file-type", "csv"  # Explicitly specify CSV file type
            ])
            
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
                
            # Also test with short form argument for file type
            output_path = os.path.join(temp_dir, "csv_integration_short_args")
            
            # Run CLI with CSV data and short-form file type argument
            result = cli.run([
                sample_csv_file_path,
                "2024-2025",
                "-o", output_path,
                "-f", "csv",
                "-t", "csv"  # Short form for file-type
            ])
            
            # Verify successful execution
            assert result == 0, "CLI should return success exit code with short arguments"
            
            # Verify CSV report was created
            csv_file = f"{output_path}.csv"
            assert os.path.exists(csv_file), f"CSV report should be created at {csv_file}"
