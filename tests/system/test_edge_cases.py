"""Edge case and error scenario tests for the UK Capital Gains Tax Calculator.

These tests verify system behavior under unusual conditions, boundary cases,
and error scenarios to ensure robustness and reliability.

Task 10.3: Test edge cases and error scenarios
"""
import pytest
import tempfile
import os
import shutil
from datetime import datetime, timedelta

from src.main.python.calculator import CapitalGainsTaxCalculator
from src.main.python.cli import CapitalGainsCLI
from tests.fixtures.ofx_samples import (
    get_sample_path, load_sample_content
)


class TestEdgeCases:
    """Edge case tests for the tax calculation system."""
    
    @pytest.fixture
    def temp_output_dir(self):
        """Create temporary directory for test outputs."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield temp_dir
    
    @pytest.fixture
    def calculator(self):
        """Create calculator instance for testing."""
        return CapitalGainsTaxCalculator()
    
    @pytest.fixture
    def cli(self):
        """Create CLI instance for testing."""
        return CapitalGainsCLI()
    
    def test_zero_quantity_transactions(self, calculator, temp_output_dir):
        """Test handling of transactions with zero quantity."""
        # Use sample file for zero quantity transaction
        sample_path = get_sample_path("zero_quantity_transaction.ofx")
        output_path = os.path.join(temp_output_dir, "zero_qty_test")
        
        # Should handle gracefully - zero quantity transactions are ignored
        summary = calculator.calculate(
            file_path=sample_path,
            tax_year="2024-2025",
            output_path=output_path,
            report_format="json"
        )
        
        # Should have no disposals since zero quantity transactions are filtered
        assert len(summary.disposals) == 0
        assert summary.total_gains == 0
        assert summary.total_losses == 0
        
        print("✓ Zero quantity transactions handled correctly")
    
    def test_negative_prices(self, calculator, temp_output_dir):
        """Test handling of transactions with negative prices."""
        # Use sample file for negative price transaction
        sample_path = get_sample_path("negative_price_transaction.ofx")
        output_path = os.path.join(temp_output_dir, "neg_price_test")
        
        # Should handle negative prices (though unusual)
        summary = calculator.calculate(
            file_path=sample_path,
            tax_year="2024-2025",
            output_path=output_path,
            report_format="json"
        )
        
        # Should parse the transaction even with negative price
        # (No disposals since only buy transaction)
        assert len(summary.disposals) == 0
        
        print("✓ Negative prices handled correctly")
    
    def test_extreme_currency_rates(self, calculator, temp_output_dir):
        """Test handling of extreme currency conversion rates."""
        # Use sample file for extreme currency rates
        sample_path = get_sample_path("extreme_currency_rates.ofx")
        output_path = os.path.join(temp_output_dir, "extreme_rates_test")
        
        # Should handle extreme currency rates correctly
        summary = calculator.calculate(
            file_path=sample_path,
            tax_year="2024-2025",
            output_path=output_path,
            report_format="json"
        )
        
        # Should have one disposal with currency conversion
        assert len(summary.disposals) == 1
        disposal = summary.disposals[0]
        
        # Verify currency conversion was applied
        assert disposal.proceeds > 0  # Should be converted to GBP
        assert disposal.cost_basis > 0  # Should be converted to GBP
        
        print("✓ Extreme currency rates handled correctly")
    
    def test_malformed_qfx_recovery(self, calculator, temp_output_dir):
        """Test recovery from malformed QFX files."""
        # Use truncated/malformed sample file
        sample_path = get_sample_path("truncated_malformed.ofx")
        output_path = os.path.join(temp_output_dir, "malformed_test")
        
        # Should raise ValueError for malformed files
        with pytest.raises(ValueError, match="No transactions found"):
            calculator.calculate(
                file_path=sample_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="json"
            )
        
        print("✓ Malformed QFX recovery handled correctly")
    
    def test_empty_file_handling(self, calculator, temp_output_dir):
        """Test handling of empty files."""
        # Use existing empty file sample
        sample_path = get_sample_path("empty_file.ofx")
        output_path = os.path.join(temp_output_dir, "empty_test")
        
        # Should raise ValueError for empty files
        with pytest.raises(ValueError, match="No transactions found"):
            calculator.calculate(
                file_path=sample_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="json"
            )
        
        print("✓ Empty file handling works correctly")
    
    def test_invalid_tax_year_formats(self, calculator, temp_output_dir):
        """Test handling of invalid tax year formats."""
        sample_path = get_sample_path("basic_buy_transaction.ofx")
        output_path = os.path.join(temp_output_dir, "invalid_tax_year_test")
        
        invalid_tax_years = [
            "2024",           # Missing second year
            "2024-2026",      # Non-consecutive years
            "invalid-year",   # Non-numeric
            "2024/2025",      # Wrong separator
            "2025-2024",      # Reversed order
            "",               # Empty string
        ]
        
        for invalid_year in invalid_tax_years:
            with pytest.raises(ValueError, match="Invalid tax year"):
                calculator.calculate(
                    file_path=sample_path,
                    tax_year=invalid_year,
                    output_path=output_path,
                    report_format="json"
                )
        
        print("✓ Invalid tax year formats handled correctly")
    
    def test_unsupported_file_formats(self, calculator, temp_output_dir):
        """Test handling of unsupported file formats."""
        # Create a non-QFX file
        fake_csv_path = os.path.join(temp_output_dir, "fake_data.csv")
        with open(fake_csv_path, 'w') as f:
            f.write("Date,Symbol,Quantity,Price\n")
            f.write("2024-06-01,AAPL,100,150.00\n")
        
        output_path = os.path.join(temp_output_dir, "unsupported_test")
        
        # Should raise ValueError for unsupported formats
        with pytest.raises(ValueError, match="No transactions found"):
            calculator.calculate(
                file_path=fake_csv_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="json"
            )
        
        print("✓ Unsupported file formats handled correctly")
    
    def test_cli_error_scenarios(self, cli, temp_output_dir):
        """Test CLI error handling scenarios."""
        # Test missing arguments - CLI exits with SystemExit
        with pytest.raises(SystemExit):
            cli.run([])
        
        # Test invalid file path
        result = cli.run(["non_existent_file.qfx", "2024-2025"])
        assert result == 1  # Should return error code
        
        # Test invalid tax year
        sample_path = get_sample_path("basic_buy_transaction.ofx")
        result = cli.run([sample_path, "invalid-year"])
        assert result == 1  # Should return error code
        
        # Test invalid output format - CLI exits with SystemExit
        output_path = os.path.join(temp_output_dir, "cli_error_test")
        with pytest.raises(SystemExit):
            cli.run([
                sample_path, "2024-2025", 
                "--output", output_path,
                "--format", "invalid_format"
            ])
        
        print("✓ CLI error scenarios handled correctly")
    
    def test_permission_denied_scenarios(self, calculator, temp_output_dir):
        """Test handling of permission denied scenarios."""
        sample_path = get_sample_path("basic_buy_transaction.ofx")
        
        # Create a read-only directory
        readonly_dir = os.path.join(temp_output_dir, "readonly")
        os.makedirs(readonly_dir)
        os.chmod(readonly_dir, 0o444)  # Read-only
        
        output_path = os.path.join(readonly_dir, "test_report")
        
        try:
            # Should handle permission errors gracefully
            with pytest.raises(PermissionError):
                calculator.calculate(
                    file_path=sample_path,
                    tax_year="2024-2025",
                    output_path=output_path,
                    report_format="csv"
                )
        finally:
            # Clean up - restore permissions
            os.chmod(readonly_dir, 0o755)
        
        print("✓ Permission denied scenarios handled correctly")
    
    def test_concurrent_file_access(self, calculator, temp_output_dir):
        """Test handling of concurrent file access scenarios."""
        import threading
        import time
        
        sample_path = get_sample_path("basic_buy_transaction.ofx")
        results = []
        
        def run_calculation(thread_id):
            """Run calculation in a thread."""
            try:
                output_path = os.path.join(temp_output_dir, f"concurrent_{thread_id}")
                summary = calculator.calculate(
                    file_path=sample_path,
                    tax_year="2024-2025",
                    output_path=output_path,
                    report_format="json"
                )
                results.append({"thread_id": thread_id, "success": True, "disposals": len(summary.disposals)})
            except Exception as e:
                results.append({"thread_id": thread_id, "success": False, "error": str(e)})
        
        # Run multiple calculations concurrently
        threads = []
        for i in range(3):
            thread = threading.Thread(target=run_calculation, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All calculations should succeed
        successful_results = [r for r in results if r["success"]]
        assert len(successful_results) == 3
        
        print("✓ Concurrent file access handled correctly")
    
    def test_memory_pressure_scenarios(self, calculator, temp_output_dir):
        """Test system behavior under memory pressure."""
        import gc
        
        # Force garbage collection before test
        gc.collect()
        
        sample_path = get_sample_path("basic_buy_transaction.ofx")
        
        # Run multiple calculations in sequence to test memory cleanup
        for i in range(10):
            output_path = os.path.join(temp_output_dir, f"memory_test_{i}")
            summary = calculator.calculate(
                file_path=sample_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format="json"
            )
            
            # Verify calculation succeeded
            assert summary is not None
            
            # Force garbage collection between runs
            gc.collect()
        
        print("✓ Memory pressure scenarios handled correctly")
    
    def test_unicode_and_encoding_edge_cases(self, temp_output_dir):
        """Test handling of unicode and encoding edge cases."""
        # Import the JSON report generator
        from src.main.python.services.report_generator import JSONReportGenerator
        
        # Create calculator with JSON report generator
        calculator = CapitalGainsTaxCalculator(report_generator=JSONReportGenerator())
        
        # Create a file with unicode characters in path
        unicode_dir = os.path.join(temp_output_dir, "测试目录")
        os.makedirs(unicode_dir, exist_ok=True)
        
        sample_path = get_sample_path("basic_buy_transaction.ofx")
        output_path = os.path.join(unicode_dir, "unicode_test")
        
        # Should handle unicode paths correctly
        summary = calculator.calculate(
            file_path=sample_path,
            tax_year="2024-2025",
            output_path=output_path,
            report_format="json"
        )
        
        # Verify output file was created
        assert os.path.exists(f"{output_path}.json")
        
        print("✓ Unicode and encoding edge cases handled correctly")
    
    def test_boundary_date_scenarios(self, calculator, temp_output_dir):
        """Test edge cases around tax year boundaries."""
        # This test uses the existing mixed_security_types sample
        # which should have transactions that can test boundary conditions
        sample_path = get_sample_path("mixed_security_types.ofx")
        
        # Test multiple valid tax years to ensure boundary handling
        tax_years = ["2023-2024", "2024-2025"]  # Only use valid tax years
        
        for tax_year in tax_years:
            output_path = os.path.join(temp_output_dir, f"boundary_test_{tax_year.replace('-', '_')}")
            
            # Should handle all tax years without error
            summary = calculator.calculate(
                file_path=sample_path,
                tax_year=tax_year,
                output_path=output_path,
                report_format="json"
            )
            
            # Summary should be valid (may be empty for some years)
            assert summary is not None
            assert summary.total_gains >= 0 or summary.total_losses >= 0
        
        print("✓ Boundary date scenarios handled correctly")
    
    def test_output_format_edge_cases(self, temp_output_dir):
        """Test edge cases in output format handling."""
        from src.main.python.services.report_generator import CSVReportGenerator, JSONReportGenerator
        
        sample_path = get_sample_path("basic_buy_transaction.ofx")
        
        # Test both supported formats
        formats = ["csv", "json"]
        
        for fmt in formats:
            # Create calculator with appropriate report generator
            if fmt == "json":
                calculator = CapitalGainsTaxCalculator(report_generator=JSONReportGenerator())
            else:
                calculator = CapitalGainsTaxCalculator(report_generator=CSVReportGenerator())
            
            output_path = os.path.join(temp_output_dir, f"format_test_{fmt}")
            
            summary = calculator.calculate(
                file_path=sample_path,
                tax_year="2024-2025",
                output_path=output_path,
                report_format=fmt
            )
            
            # Verify output file was created with correct extension
            expected_file = f"{output_path}.{fmt}"
            assert os.path.exists(expected_file)
            
            # Verify file has content
            assert os.path.getsize(expected_file) > 0
        
        print("✓ Output format edge cases handled correctly")
    
    def test_system_resource_limits(self, calculator, temp_output_dir):
        """Test system behavior at resource limits."""
        import psutil
        import os
        
        # Get current process info
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        sample_path = get_sample_path("multiple_transactions.ofx")
        
        # Run calculation and monitor resource usage
        output_path = os.path.join(temp_output_dir, "resource_test")
        summary = calculator.calculate(
            file_path=sample_path,
            tax_year="2024-2025",
            output_path=output_path,
            report_format="json"
        )
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 50MB for small files)
        assert memory_increase < 50, f"Memory increase too high: {memory_increase:.1f}MB"
        
        # Calculation should complete successfully
        assert summary is not None
        
        print("✓ System resource limits handled correctly")
