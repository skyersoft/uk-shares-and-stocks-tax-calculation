"""Tax year calculator implementation."""
import logging
from datetime import datetime
from typing import List, Dict, Optional

from ..interfaces.calculator_interfaces import TaxYearCalculatorInterface
from ..models.domain_models import Disposal, TaxYearSummary
from ..config.tax_config import TAX_YEARS


def is_in_tax_year(date: datetime, tax_year: str) -> bool:
    """
    Check if a date falls within a UK tax year.
    
    Args:
        date: The date to check
        tax_year: The tax year string (e.g., "2024-2025")
        
    Returns:
        True if the date is in the tax year, False otherwise
    """
    if tax_year not in TAX_YEARS:
        raise ValueError(f"Invalid tax year: {tax_year}")
        
    tax_year_data = TAX_YEARS[tax_year]
    
    # UK tax years run from April 6 to April 5
    start_date = datetime(tax_year_data.start_year, 4, 6).date()
    end_date = datetime(tax_year_data.end_year, 4, 5).date()
    
    return start_date <= date.date() <= end_date


class UKTaxYearCalculator(TaxYearCalculatorInterface):
    """UK-specific implementation of tax year calculation."""
    
    def __init__(self):
        """Initialize the tax year calculator."""
        self.logger = logging.getLogger(__name__)
    
    def calculate_tax_year_summary(
        self, 
        disposals: List[Disposal], 
        tax_year: str
    ) -> TaxYearSummary:
        """
        Calculate the tax summary for a specific tax year.
        
        Args:
            disposals: List of disposals
            tax_year: The tax year (e.g., "2024-2025")
            
        Returns:
            Tax year summary
        """
        if tax_year not in TAX_YEARS:
            raise ValueError(f"Invalid tax year: {tax_year}")
            
        self.logger.info(f"Calculating tax year summary for {tax_year}")
        
        tax_year_data = TAX_YEARS[tax_year]
        
        # Filter disposals for this tax year
        tax_year_disposals = [
            d for d in disposals
            if is_in_tax_year(d.sell_date, tax_year)
        ]
        
        # Create the tax year summary
        summary = TaxYearSummary(tax_year=tax_year)
        
        # Add each disposal to the summary
        for disposal in tax_year_disposals:
            summary.add_disposal(disposal)
        
        # Apply annual exemption
        annual_exemption = tax_year_data.annual_exemption
        
        if summary.net_gain > 0:
            summary.annual_exemption_used = min(annual_exemption, summary.net_gain)
            summary.taxable_gain = max(0, summary.net_gain - summary.annual_exemption_used)
        else:
            summary.annual_exemption_used = 0
            summary.taxable_gain = 0
            
        self.logger.info(
            f"Tax year summary {tax_year}: "
            f"Total gains={summary.total_gains:.2f}, "
            f"Total losses={summary.total_losses:.2f}, "
            f"Net gain={summary.net_gain:.2f}, "
            f"Exemption used={summary.annual_exemption_used:.2f}, "
            f"Taxable gain={summary.taxable_gain:.2f}"
        )
        
        return summary
