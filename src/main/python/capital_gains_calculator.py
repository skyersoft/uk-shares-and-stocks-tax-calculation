"""Command-line interface for the capital gains calculator."""
import os
import sys
import logging
import typer
from typing import Optional
from rich.console import Console
from rich.logging import RichHandler

from .calculator import CapitalGainsTaxCalculator
from .config.tax_config import TAX_YEARS, BASE_CURRENCY


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


def main():
    """Entry point for the application."""
    app()


if __name__ == "__main__":
    main()
