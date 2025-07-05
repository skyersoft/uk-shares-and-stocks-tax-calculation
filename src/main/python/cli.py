"""Command Line Interface for the UK Capital Gains Tax Calculator."""
import argparse
import logging
import os
import sys
from typing import List, Optional

from .calculator import CapitalGainsTaxCalculator


class CapitalGainsCLI:
    """Command Line Interface for the Capital Gains Tax Calculator."""
    
    def __init__(self):
        """Initialize the CLI with argument parser."""
        self.parser = self._create_parser()
        self.logger = logging.getLogger(__name__)
    
    def _create_parser(self) -> argparse.ArgumentParser:
        """Create and configure the argument parser."""
        parser = argparse.ArgumentParser(
            prog='capital-gains-calculator',
            description='Calculate UK Capital Gains Tax from financial transaction files',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  %(prog)s data.qfx 2024-2025
  %(prog)s data.csv 2024-2025 --file-type csv
  %(prog)s data.qfx 2024-2025 --output my_report --format json
  %(prog)s data.csv 2024-2025 -t csv -o report -f csv --verbose
            """
        )
        
        # Version information
        parser.add_argument(
            '--version',
            action='version',
            version='UK Capital Gains Tax Calculator 1.0.0'
        )
        
        # Required positional arguments
        parser.add_argument(
            'file_path',
            help='Path to the transaction file to process'
        )
        
        parser.add_argument(
            'tax_year',
            help='UK tax year in format YYYY-YYYY (e.g., 2024-2025)'
        )
        
        # Optional arguments
        parser.add_argument(
            '-t', '--file-type',
            choices=['qfx', 'csv'],
            default='qfx',
            help='Type of input file (default: qfx)'
        )
        
        parser.add_argument(
            '-o', '--output',
            dest='output_path',
            help='Output path for the report (without extension)'
        )
        
        parser.add_argument(
            '-f', '--format',
            choices=['csv', 'json'],
            default='csv',
            help='Output format for the report (default: csv)'
        )
        
        parser.add_argument(
            '-v', '--verbose',
            action='store_true',
            help='Enable verbose output'
        )
        
        return parser
    
    def parse_args(self, args: Optional[List[str]] = None) -> argparse.Namespace:
        """Parse command line arguments."""
        return self.parser.parse_args(args)
    
    def validate_file_path(self, file_path: str, file_type: str) -> None:
        """Validate the input file path.
        
        Args:
            file_path: Path to the input file
            file_type: Type of file ('qfx' or 'csv')
        """
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Check file extension matches file type
        expected_extension = f".{file_type.lower()}"
        if not file_path.lower().endswith(expected_extension):
            raise ValueError(f"File type mismatch: Expected {file_type} file but {file_path} has different extension")
    
    def validate_tax_year(self, tax_year: str) -> None:
        """Validate the tax year format."""
        try:
            # Expected format: YYYY-YYYY
            parts = tax_year.split('-')
            if len(parts) != 2:
                raise ValueError("Tax year must be in format YYYY-YYYY")
            
            start_year = int(parts[0])
            end_year = int(parts[1])
            
            # Validate year range
            if end_year != start_year + 1:
                raise ValueError("Tax year must be consecutive years")
            
            # Validate year values (reasonable range)
            if start_year < 2000 or start_year > 2100:
                raise ValueError("Tax year must be between 2000-2100")
                
        except (ValueError, IndexError) as e:
            if "invalid literal" in str(e):
                raise ValueError("Invalid tax year format. Use YYYY-YYYY")
            raise ValueError("Invalid tax year format. Use YYYY-YYYY")
    
    def validate_output_path(self, output_path: str) -> None:
        """Validate the output path."""
        if not output_path or not output_path.strip():
            raise ValueError("Output path cannot be empty")
    
    def run(self, args: Optional[List[str]] = None) -> int:
        """Run the CLI application."""
        try:
            # Parse arguments
            parsed_args = self.parse_args(args)
            
            # Configure logging based on verbosity
            if parsed_args.verbose:
                logging.basicConfig(
                    level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                )
            else:
                logging.basicConfig(level=logging.WARNING)
            
            # Validate arguments
            self.validate_file_path(parsed_args.file_path, parsed_args.file_type)
            self.validate_tax_year(parsed_args.tax_year)
            
            if parsed_args.output_path:
                self.validate_output_path(parsed_args.output_path)
            
            # Create calculator with appropriate report generator based on format
            from .services.report_generator import CSVReportGenerator, JSONReportGenerator
            
            if parsed_args.format == 'json':
                report_generator = JSONReportGenerator()
            else:
                report_generator = CSVReportGenerator()
            
            # Create parser based on file type
            if parsed_args.file_type == 'csv':
                from .parsers.csv_parser import CsvParser
                file_parser = CsvParser(base_currency="GBP")
            else:  # Default to QFX parser
                from .parsers.qfx_parser import QfxParser
                file_parser = QfxParser(base_currency="GBP")
            
            calculator = CapitalGainsTaxCalculator(
                file_parser=file_parser,
                report_generator=report_generator
            )
            
            # Determine output path
            output_path = parsed_args.output_path
            if output_path is None:
                # Generate default output path based on input file and tax year
                base_name = os.path.splitext(os.path.basename(parsed_args.file_path))[0]
                output_path = f"{base_name}_{parsed_args.tax_year}_capital_gains"
            
            if parsed_args.verbose:
                print(f"Processing file: {parsed_args.file_path}")
                print(f"File type: {parsed_args.file_type}")
                print(f"Tax year: {parsed_args.tax_year}")
                print(f"Output format: {parsed_args.format}")
                print(f"Output path: {output_path}")
                print()
            
            # Calculate capital gains
            summary = calculator.calculate(
                file_path=parsed_args.file_path,
                tax_year=parsed_args.tax_year,
                output_path=output_path,
                report_format=parsed_args.format,
                file_type=parsed_args.file_type
            )
            
            # Display results
            print("✓ Capital gains calculation completed successfully!")
            print()
            print("Summary:")
            print(f"  Tax Year: {summary.tax_year}")
            
            # Handle both ComprehensiveTaxSummary and TaxYearSummary
            if hasattr(summary, 'capital_gains'):
                cg = summary.capital_gains
                print(f"  Total Proceeds: £{cg.total_proceeds:,.2f}")
                print(f"  Total Gains: £{cg.total_gains:,.2f}")
                print(f"  Total Losses: £{cg.total_losses:,.2f}")
                print(f"  Net Gain: £{cg.net_gain:,.2f}")
                print(f"  Annual Exemption Used: £{cg.annual_exemption_used:,.2f}")
                print(f"  Taxable Gain: £{cg.taxable_gain:,.2f}")
                print(f"  Number of Disposals: {len(cg.disposals)}")
            else:
                print(f"  Total Proceeds: £{summary.total_proceeds:,.2f}")
                print(f"  Total Gains: £{summary.total_gains:,.2f}")
                print(f"  Total Losses: £{summary.total_losses:,.2f}")
                print(f"  Net Gain: £{summary.net_gain:,.2f}")
                print(f"  Annual Exemption Used: £{summary.annual_exemption_used:,.2f}")
                print(f"  Taxable Gain: £{summary.taxable_gain:,.2f}")
                print(f"  Number of Disposals: {len(summary.disposals)}")
            print()
            
            # Report file information
            report_file = f"{output_path}.{parsed_args.format}"
            print(f"Report saved to: {report_file}")
            
            if parsed_args.verbose:
                # Get disposals from either format
                disposals = summary.capital_gains.disposals if hasattr(summary, 'capital_gains') else summary.disposals
                if disposals:
                    print()
                    print("Disposal Details:")
                    for i, disposal in enumerate(disposals, 1):
                        print(f"  {i}. {disposal.security.get_display_name()}")
                        print(f"     Date: {disposal.sell_date.strftime('%Y-%m-%d')}")
                        print(f"     Quantity: {disposal.quantity:,.0f}")
                        print(f"     Proceeds: £{disposal.proceeds:,.2f}")
                        print(f"     Cost Basis: £{disposal.cost_basis:,.2f}")
                        print(f"     Gain/Loss: £{disposal.gain_or_loss:,.2f}")
                        print(f"     Matching Rule: {disposal.matching_rule}")
                        print()
            
            return 0  # Success
            
        except FileNotFoundError as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1
        except ValueError as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1
        except Exception as e:
            print(f"Unexpected error: {e}", file=sys.stderr)
            if parsed_args.verbose if 'parsed_args' in locals() else False:
                import traceback
                traceback.print_exc()
            return 1


def main():
    """Main entry point for the CLI application."""
    cli = CapitalGainsCLI()
    sys.exit(cli.run())


if __name__ == '__main__':
    main()
