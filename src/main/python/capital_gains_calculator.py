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
        help="Path to the QFX file containing transaction data"
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
    
    try:
        # Validate input file
        if not os.path.isfile(input_file):
            console.print(f"[bold red]Error:[/] Input file not found: {input_file}")
            sys.exit(1)
        
        # Validate tax year
        if tax_year not in TAX_YEARS:
            console.print(f"[bold red]Error:[/] Invalid tax year: {tax_year}")
            console.print(f"Available years: {', '.join(TAX_YEARS.keys())}")
            sys.exit(1)
        
        # Validate format
        if format.lower() not in ["csv", "json"]:
            console.print(f"[bold red]Error:[/] Invalid format: {format}")
            console.print("Supported formats: csv, json")
            sys.exit(1)
        
        # Create the calculator
        calculator = CapitalGainsTaxCalculator(base_currency=BASE_CURRENCY)
        
        # Calculate capital gains
        console.print(f"[bold green]Calculating capital gains for {tax_year}...[/]")
        
        summary = calculator.calculate(
            file_path=input_file,
            tax_year=tax_year,
            output_path=output_file,
            report_format=format
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
