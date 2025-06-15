"""Utility functions for date handling."""
import logging
from datetime import datetime
from typing import Optional, Tuple

from ..config.tax_config import TAX_YEARS


logger = logging.getLogger(__name__)


def get_uk_tax_year_for_date(date: datetime) -> Optional[str]:
    """
    Determine which UK tax year a date falls in.
    
    Args:
        date: The date to check
        
    Returns:
        The tax year string (e.g., "2024-2025") or None if not found
    """
    try:
        date_to_check = date.date()
        
        for tax_year, tax_year_data in TAX_YEARS.items():
            start_date = datetime(tax_year_data.start_year, 4, 6).date()
            end_date = datetime(tax_year_data.end_year, 4, 5).date()
            
            if start_date <= date_to_check <= end_date:
                return tax_year
                
        return None
    except Exception as e:
        logger.error(f"Error determining tax year for date {date}: {e}")
        return None


def parse_tax_year(tax_year_str: str) -> Tuple[int, int]:
    """
    Parse a tax year string into start and end years.
    
    Args:
        tax_year_str: The tax year string (e.g., "2024-2025")
        
    Returns:
        Tuple of (start_year, end_year)
    """
    try:
        parts = tax_year_str.split('-')
        if len(parts) != 2:
            raise ValueError(f"Invalid tax year format: {tax_year_str}")
            
        start_year = int(parts[0])
        end_year = int(parts[1])
        
        if end_year != start_year + 1:
            raise ValueError(f"Invalid tax year range: {tax_year_str}")
            
        return start_year, end_year
    except Exception as e:
        logger.error(f"Error parsing tax year {tax_year_str}: {e}")
        raise
