"""Enhanced capital gains calculator with comprehensive analysis capabilities."""
import os
import sys
import logging
import typer
import time
from typing import Optional, Dict, Any
from rich.console import Console
from rich.logging import RichHandler

from .calculator import CapitalGainsTaxCalculator
from .config.tax_config import TAX_YEARS, BASE_CURRENCY
from .interfaces.calculator_interfaces import FileParserInterface
from .services.disposal_calculator import UKDisposalCalculator
from .services.dividend_processor import DividendProcessor
from .services.currency_processor import CurrencyExchangeProcessor
from .services.portfolio_calculator import PortfolioCalculator
from .services.performance_calculator import PerformanceCalculator
from .services.tax_year_calculator import EnhancedTaxYearCalculator
from .services.portfolio_report_generator import PortfolioReportGenerator
from .services.transaction_matcher import UKTransactionMatcher


# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler()]
)

logger = logging.getLogger("capital_gains_calculator")

# Create the Typer app
app = typer.Typer(help="UK Capital Gains Tax Calculator")
console = Console()


@app.command()
def calculate(
    input_file: str = typer.Option(
        ...,
        "--input",
        "-i",
        help="Path to the input file containing transaction data (QFX or CSV)"
    ),
    tax_year: str = typer.Option(
        ...,
        "--tax-year",
        "-t",
        help=f"Tax year to calculate gains for (e.g., 2024-2025). Available years: {', '.join(TAX_YEARS.keys())}"
    ),
    output_file: str = typer.Option(
        "tax_report",
        "--output",
        "-o",
        help="Path to save the tax report (without extension)"
    ),
    format: str = typer.Option(
        "csv",
        "--format",
        "-f",
        help="Format of the report (csv or json)"
    ),
    file_type: str = typer.Option(
        "qfx",
        "--file-type",
        "-ft",
        help="Type of input file (qfx or csv)"
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Enable verbose logging"
    )
):
    """Calculate capital gains tax for a given tax year from a QFX file."""
    # Set logging level
    if verbose:
        logger.setLevel(logging.DEBUG)
    
    console.print(f"[bold green]Calculating capital gains for {tax_year}...[/]")
    console.print(f"Calculating capital gains for {tax_year} from {input_file} (file type: {file_type})")
    
    try:
        # Create appropriate parser based on file type
        if file_type.lower() == "csv":
            from .parsers.csv_parser import CsvParser
            parser = CsvParser(base_currency=BASE_CURRENCY)
        else:
            from .parsers.qfx_parser import QfxParser
            parser = QfxParser(base_currency=BASE_CURRENCY)
        
        calculator = CapitalGainsTaxCalculator(file_parser=parser)

        # Add txt extension if no extension in output_file
        if not os.path.splitext(output_file)[1]:
            output_file = f"{output_file}.{format}"
        
        # Calculate capital gains
        summary = calculator.calculate(
            file_path=input_file,
            tax_year=tax_year,
            output_path=output_file,
            report_format=format,
            file_type=file_type
        )
        
        # Print summary
        console.print("\n[bold green]Tax Year Summary:[/]")
        console.print(f"Tax Year: {summary.tax_year}")
        console.print(f"Total Proceeds: £{summary.total_proceeds:.2f}")
        console.print(f"Total Gains: £{summary.total_gains:.2f}")
        console.print(f"Total Losses: £{summary.total_losses:.2f}")
        console.print(f"Net Gain/Loss: £{summary.net_gain:.2f}")
        console.print(f"Annual Exemption Used: £{summary.annual_exemption_used:.2f}")
        console.print(f"Taxable Gain: £{summary.taxable_gain:.2f}")
        
        # Print report location
        extension = ".json" if format.lower() == "json" else ".csv"
        report_path = output_file + extension
        console.print(f"\n[bold green]Report saved to:[/] {report_path}")
        
    except Exception as e:
        logger.exception("Error during calculation")
        console.print(f"[bold red]Error:[/] {str(e)}")
        sys.exit(1)


class EnhancedCapitalGainsCalculator:
    """Enhanced calculator with comprehensive tax and portfolio analysis."""

    def __init__(
        self,
        parser: FileParserInterface,
        disposal_calculator: UKDisposalCalculator,
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

            # Calculate commission summary
            commission_summary = self._calculate_commission_summary(transactions, tax_year)
            results['commission_summary'] = commission_summary

        if analysis_type in ["portfolio", "both"]:
            self.logger.info("Calculating portfolio holdings and performance")

            # Calculate portfolio holdings
            holdings = self.portfolio_calculator.calculate_current_holdings(transactions)
            self.logger.info(f"Calculated {len(holdings)} current holdings")

            if holdings:
                # Calculate performance metrics
                dividends = self.dividend_processor.process_dividend_transactions(transactions)
                for holding in holdings:
                    self.performance_calculator.calculate_holding_performance(
                        holding, transactions, dividends
                    )

                # Group by market and calculate portfolio summary
                market_summaries = self.portfolio_calculator.group_holdings_by_market(holdings)
                portfolio_summary = self.portfolio_calculator.calculate_portfolio_totals(market_summaries)

                # Generate portfolio report
                portfolio_report = self.report_generator.generate_market_grouped_report(portfolio_summary)

                results['portfolio_analysis'] = portfolio_summary
                results['portfolio_report'] = portfolio_report
            else:
                self.logger.info("No current holdings found")
                results['portfolio_analysis'] = None
                results['portfolio_report'] = None

        # Calculate processing time
        end_time = time.time()
        results['processing_time'] = end_time - start_time

        self.logger.info(f"Comprehensive analysis completed in {results['processing_time']:.2f} seconds")

        return results

    def _calculate_commission_summary(self, transactions, tax_year):
        """Calculate commission summary for the given transactions and tax year."""
        # Import the helper function
        def _is_in_tax_year(date, tax_year):
            """Check if a date falls within the given tax year."""
            start_year = int(tax_year.split('-')[0])
            start_date = f"{start_year}-04-06"
            end_date = f"{start_year + 1}-04-05"

            from datetime import datetime
            if isinstance(date, str):
                date = datetime.fromisoformat(date.replace('Z', '+00:00'))
            elif hasattr(date, 'date'):
                date = date.date()

            start = datetime.fromisoformat(start_date).date()
            end = datetime.fromisoformat(end_date).date()

            if hasattr(date, 'date'):
                date = date.date()

            return start <= date <= end

        total_commissions = 0.0
        total_fees = 0.0
        commission_by_type = {
            'buy_commissions': 0.0,
            'sell_commissions': 0.0,
            'dividend_fees': 0.0,
            'other_fees': 0.0
        }

        for transaction in transactions:
            if _is_in_tax_year(transaction.date, tax_year):
                commission = getattr(transaction, 'commission_in_base_currency', 0)
                fees = getattr(transaction, 'taxes_in_base_currency', 0)  # Some fees are in taxes field

                total_commissions += commission
                total_fees += fees

                # Categorize by transaction type
                if hasattr(transaction, 'transaction_type'):
                    if 'buy' in transaction.transaction_type.name.lower():
                        commission_by_type['buy_commissions'] += commission
                    elif 'sell' in transaction.transaction_type.name.lower():
                        commission_by_type['sell_commissions'] += commission
                    elif 'dividend' in transaction.transaction_type.name.lower():
                        commission_by_type['dividend_fees'] += commission
                    else:
                        commission_by_type['other_fees'] += commission

        return {
            'total_commissions': total_commissions,
            'total_fees': total_fees,
            'total_costs': total_commissions + total_fees,
            'breakdown': commission_by_type,
            'transaction_count': len([t for t in transactions if _is_in_tax_year(t.date, tax_year) and (getattr(t, 'commission_in_base_currency', 0) > 0 or getattr(t, 'taxes_in_base_currency', 0) > 0)])
        }


def create_enhanced_calculator(parser_type: str = "csv") -> EnhancedCapitalGainsCalculator:
    """Factory function to create enhanced calculator with all dependencies."""

    # Create parser
    if parser_type.lower() == "csv":
        from .parsers.csv_parser import CsvParser
        parser = CsvParser()
    elif parser_type.lower() == "qfx":
        from .parsers.qfx_parser import QfxParser
        parser = QfxParser()
    else:
        raise ValueError(f"Unsupported parser type: {parser_type}")

    # Create services
    disposal_calculator = UKDisposalCalculator()
    dividend_processor = DividendProcessor()
    currency_processor = CurrencyExchangeProcessor()
    portfolio_calculator = PortfolioCalculator()
    performance_calculator = PerformanceCalculator()
    transaction_matcher = UKTransactionMatcher()

    # Create enhanced tax year calculator
    tax_year_calculator = EnhancedTaxYearCalculator(
        disposal_calculator,
        dividend_processor,
        currency_processor,
        transaction_matcher
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


def main():
    """Entry point for the application."""
    app()


if __name__ == "__main__":
    main()
