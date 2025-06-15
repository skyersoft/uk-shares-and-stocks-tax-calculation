"""Configuration for the UK Capital Gains Tax Calculator."""
from dataclasses import dataclass
from typing import Dict


@dataclass
class TaxYear:
    """Represents a UK tax year."""
    start_year: int
    end_year: int
    annual_exemption: float
    
    @property
    def name(self) -> str:
        """Return the name of the tax year (e.g., '2024-2025')."""
        return f"{self.start_year}-{self.end_year}"


# UK Tax years run from April 6 to April 5
TAX_YEARS = {
    # Historic tax years
    "2022-2023": TaxYear(2022, 2023, 12300.0),  # £12,300 annual exemption
    "2023-2024": TaxYear(2023, 2024, 6000.0),   # £6,000 annual exemption
    # Current tax year
    "2024-2025": TaxYear(2024, 2025, 3000.0),   # £3,000 annual exemption (reduced)
    "2025-2026": TaxYear(2025, 2026, 3000.0),   # £3,000 annual exemption
}

# Tax rates for different bands (for reference)
BASIC_RATE_PERCENTAGE = 10.0  # 10% for basic rate taxpayers
HIGHER_RATE_PERCENTAGE = 20.0  # 20% for higher/additional rate taxpayers

# Number of days to consider for same-day and bed & breakfast rules
SAME_DAY_RULE = 0  # Same day transactions
BED_AND_BREAKFAST_RULE_DAYS = 30  # Transactions within 30 days

# Default currency for tax calculations
BASE_CURRENCY = "GBP"
