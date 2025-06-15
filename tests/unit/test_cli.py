"""Unit tests for the CLI interface."""
import pytest
import tempfile
import os
from unittest.mock import Mock, patch
from argparse import ArgumentParser, Namespace

from src.main.python.cli import CapitalGainsCLI


class TestCapitalGainsCLI:
    """Unit tests for the Capital Gains CLI."""
    
    def test_cli_initialization(self):
        """Test CLI initialization."""
        cli = CapitalGainsCLI()
        
        assert cli is not None
        assert hasattr(cli, 'parser')
        assert isinstance(cli.parser, ArgumentParser)
    
    def test_parse_basic_arguments(self):
        """Test parsing basic required arguments."""
        cli = CapitalGainsCLI()
        
        # Test with minimal required arguments
        args = cli.parse_args(['test.qfx', '2024-2025'])
        
        assert args.file_path == 'test.qfx'
        assert args.tax_year == '2024-2025'
        assert args.output_path is None  # Default
        assert args.format == 'csv'  # Default
        assert args.verbose is False  # Default
    
    def test_parse_all_arguments(self):
        """Test parsing all available arguments."""
        cli = CapitalGainsCLI()
        
        # Test with all arguments
        args = cli.parse_args([
            'test.qfx',
            '2024-2025',
            '--output', 'my_report',
            '--format', 'json',
            '--verbose'
        ])
        
        assert args.file_path == 'test.qfx'
        assert args.tax_year == '2024-2025'
        assert args.output_path == 'my_report'
        assert args.format == 'json'
        assert args.verbose is True
    
    def test_parse_short_arguments(self):
        """Test parsing short argument forms."""
        cli = CapitalGainsCLI()
        
        # Test with short arguments
        args = cli.parse_args([
            'test.qfx',
            '2024-2025',
            '-o', 'my_report',
            '-f', 'json',
            '-v'
        ])
        
        assert args.file_path == 'test.qfx'
        assert args.tax_year == '2024-2025'
        assert args.output_path == 'my_report'
        assert args.format == 'json'
        assert args.verbose is True
    
    def test_parse_invalid_format(self):
        """Test parsing with invalid format."""
        cli = CapitalGainsCLI()
        
        # Should raise SystemExit due to invalid choice
        with pytest.raises(SystemExit):
            cli.parse_args(['test.qfx', '2024-2025', '--format', 'invalid'])
    
    def test_parse_missing_required_arguments(self):
        """Test parsing with missing required arguments."""
        cli = CapitalGainsCLI()
        
        # Missing file path
        with pytest.raises(SystemExit):
            cli.parse_args(['2024-2025'])
        
        # Missing tax year
        with pytest.raises(SystemExit):
            cli.parse_args(['test.qfx'])
        
        # Missing both
        with pytest.raises(SystemExit):
            cli.parse_args([])
    
    def test_validate_file_path_exists(self):
        """Test file path validation when file exists."""
        cli = CapitalGainsCLI()
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Should not raise any exception
            cli.validate_file_path(temp_path)
        finally:
            os.unlink(temp_path)
    
    def test_validate_file_path_not_exists(self):
        """Test file path validation when file doesn't exist."""
        cli = CapitalGainsCLI()
        
        # Should raise FileNotFoundError
        with pytest.raises(FileNotFoundError):
            cli.validate_file_path('non_existent_file.qfx')
    
    def test_validate_file_path_wrong_extension(self):
        """Test file path validation with wrong extension."""
        cli = CapitalGainsCLI()
        
        # Create a temporary file with wrong extension
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Should raise ValueError for wrong extension
            with pytest.raises(ValueError, match="File must have .qfx extension"):
                cli.validate_file_path(temp_path)
        finally:
            os.unlink(temp_path)
    
    def test_validate_tax_year_valid(self):
        """Test tax year validation with valid formats."""
        cli = CapitalGainsCLI()
        
        valid_tax_years = [
            '2023-2024',
            '2024-2025',
            '2025-2026',
            '2020-2021'
        ]
        
        for tax_year in valid_tax_years:
            # Should not raise any exception
            cli.validate_tax_year(tax_year)
    
    def test_validate_tax_year_invalid(self):
        """Test tax year validation with invalid formats."""
        cli = CapitalGainsCLI()
        
        invalid_tax_years = [
            '2024',  # Missing end year
            '2024-2026',  # Wrong range
            '2024-2023',  # Backwards
            'invalid',  # Not a year
            '2024-25',  # Wrong format
            '24-25',  # Wrong format
        ]
        
        for tax_year in invalid_tax_years:
            with pytest.raises(ValueError, match="Invalid tax year format"):
                cli.validate_tax_year(tax_year)
    
    def test_validate_output_path_valid(self):
        """Test output path validation with valid paths."""
        cli = CapitalGainsCLI()
        
        # Should not raise any exception for valid paths
        cli.validate_output_path('report')
        cli.validate_output_path('my_report')
        cli.validate_output_path('/tmp/report')
        cli.validate_output_path('./reports/tax_2024')
    
    def test_validate_output_path_invalid(self):
        """Test output path validation with invalid paths."""
        cli = CapitalGainsCLI()
        
        invalid_paths = [
            '',  # Empty string
            '   ',  # Whitespace only
            '/invalid/path/that/does/not/exist/and/cannot/be/created/report',  # Invalid directory
        ]
        
        for path in invalid_paths[:2]:  # Test empty and whitespace
            with pytest.raises(ValueError, match="Output path cannot be empty"):
                cli.validate_output_path(path)
    
    def test_run_with_valid_arguments(self):
        """Test running CLI with valid arguments."""
        cli = CapitalGainsCLI()
        
        # Mock the calculator
        with patch('src.main.python.cli.CapitalGainsTaxCalculator') as mock_calc_class:
            mock_calc = Mock()
            mock_calc_class.return_value = mock_calc
            
            # Mock the summary
            mock_summary = Mock()
            mock_summary.tax_year = '2024-2025'
            mock_summary.total_proceeds = 10000.0
            mock_summary.total_gains = 1500.0
            mock_summary.total_losses = 500.0
            mock_summary.net_gain = 1000.0
            mock_summary.annual_exemption_used = 1000.0
            mock_summary.taxable_gain = 0.0
            mock_summary.disposals = []
            mock_calc.calculate.return_value = mock_summary
            
            # Create a temporary QFX file
            with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
                temp_path = temp_file.name
                temp_file.write(b'<OFX>test content</OFX>')
            
            try:
                # Run the CLI
                result = cli.run([
                    temp_path,
                    '2024-2025',
                    '--output', 'test_report',
                    '--format', 'csv'
                ])
                
                # Verify calculator was called correctly
                mock_calc_class.assert_called_once()
                mock_calc.calculate.assert_called_once_with(
                    file_path=temp_path,
                    tax_year='2024-2025',
                    output_path='test_report',
                    report_format='csv'
                )
                
                # Verify return value
                assert result == 0  # Success exit code
                
            finally:
                os.unlink(temp_path)
    
    def test_run_with_file_not_found(self):
        """Test running CLI with non-existent file."""
        cli = CapitalGainsCLI()
        
        # Should return error exit code
        result = cli.run(['non_existent.qfx', '2024-2025'])
        assert result == 1  # Error exit code
    
    def test_run_with_invalid_tax_year(self):
        """Test running CLI with invalid tax year."""
        cli = CapitalGainsCLI()
        
        # Create a temporary QFX file
        with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Should return error exit code
            result = cli.run([temp_path, 'invalid-year'])
            assert result == 1  # Error exit code
        finally:
            os.unlink(temp_path)
    
    def test_run_with_calculation_error(self):
        """Test running CLI when calculation fails."""
        cli = CapitalGainsCLI()
        
        # Mock the calculator to raise an exception
        with patch('src.main.python.cli.CapitalGainsTaxCalculator') as mock_calc_class:
            mock_calc = Mock()
            mock_calc_class.return_value = mock_calc
            mock_calc.calculate.side_effect = Exception("Calculation failed")
            
            # Create a temporary QFX file
            with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
                temp_path = temp_file.name
            
            try:
                # Should return error exit code
                result = cli.run([temp_path, '2024-2025'])
                assert result == 1  # Error exit code
            finally:
                os.unlink(temp_path)
    
    def test_run_with_verbose_output(self):
        """Test running CLI with verbose output."""
        cli = CapitalGainsCLI()
        
        # Mock the calculator
        with patch('src.main.python.cli.CapitalGainsTaxCalculator') as mock_calc_class:
            mock_calc = Mock()
            mock_calc_class.return_value = mock_calc
            
            # Mock the summary
            mock_summary = Mock()
            mock_summary.tax_year = '2024-2025'
            mock_summary.total_proceeds = 10000.0
            mock_summary.total_gains = 1500.0
            mock_summary.total_losses = 500.0
            mock_summary.net_gain = 1000.0
            mock_summary.annual_exemption_used = 1000.0
            mock_summary.taxable_gain = 0.0
            mock_summary.disposals = []
            mock_calc.calculate.return_value = mock_summary
            
            # Create a temporary QFX file
            with tempfile.NamedTemporaryFile(suffix='.qfx', delete=False) as temp_file:
                temp_path = temp_file.name
            
            try:
                # Capture stdout to verify verbose output
                with patch('builtins.print') as mock_print:
                    result = cli.run([
                        temp_path,
                        '2024-2025',
                        '--verbose'
                    ])
                    
                    # Verify verbose output was printed
                    assert mock_print.call_count > 0
                    assert result == 0  # Success exit code
                    
            finally:
                os.unlink(temp_path)
    
    def test_help_message(self):
        """Test that help message is displayed correctly."""
        cli = CapitalGainsCLI()
        
        # Should raise SystemExit with help message
        with pytest.raises(SystemExit):
            cli.parse_args(['--help'])
    
    def test_version_message(self):
        """Test that version message is displayed correctly."""
        cli = CapitalGainsCLI()
        
        # Should raise SystemExit with version message
        with pytest.raises(SystemExit):
            cli.parse_args(['--version'])
