"""
FX Rate Service for multi-currency support.

This module provides the interface and implementations for fetching
foreign exchange rates for tax calculations.
"""

from abc import ABC, abstractmethod
from datetime import datetime
import json
from decimal import Decimal
from pathlib import Path
from typing import Optional, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class FxRateServiceInterface(ABC):
    """
    Abstract interface for FX rate providers.
    """

    @abstractmethod
    def get_rate(
        self,
        from_currency: str,
        to_currency: str,
        date: datetime
    ) -> Optional[Decimal]:
        """
        Get exchange rate for a specific date.

        Args:
            from_currency: Source currency code (e.g., "USD")
            to_currency: Target currency code (e.g., "GBP")
            date: Date of the transaction

        Returns:
            Exchange rate (1 unit of from_currency = X units of to_currency)
            Returns None if rate cannot be found.
        """


class HMRCExchangeRateService(FxRateServiceInterface):
    """
    FX rates from HMRC's published monthly exchange rates ("currency units per £1").

    A trade is converted at the rate of the calendar month it falls in, which HMRC accepts for
    capital gains. The table is bundled (data/hmrc_monthly_rates.json, refreshed with
    scripts/fetch_hmrc_rates.py); a month or currency it does not hold returns None, never a
    guess, so callers must refuse or warn rather than assume 1.0.
    """

    DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "hmrc_monthly_rates.json"
    PRECISION = Decimal("0.0000000001")

    def __init__(self, table: Optional[Dict[str, Dict[str, float]]] = None):
        if table is None:
            with open(self.DATA_FILE, encoding="utf-8") as f:
                table = json.load(f)["rates"]
        self._table = table

    def rate_for(self, currency: str, date: datetime) -> Optional[Tuple[Decimal, str]]:
        """(GBP per 1 unit of ``currency``, 'YYYY-MM' of the HMRC rate used), or None."""
        month = f"{date.year}-{date.month:02d}"
        per_pound = self._table.get(month, {}).get(currency.upper())
        if not per_pound:
            return None
        return (Decimal(1) / Decimal(str(per_pound))).quantize(self.PRECISION), month

    def published_rate(self, currency: str, date: datetime) -> Optional[Decimal]:
        """The HMRC figure itself: units of ``currency`` per £1."""
        value = self._table.get(f"{date.year}-{date.month:02d}", {}).get(currency.upper())
        return Decimal(str(value)) if value else None

    def get_rate(self, from_currency: str, to_currency: str, date: datetime) -> Optional[Decimal]:
        from_currency, to_currency = from_currency.upper(), to_currency.upper()
        if from_currency == to_currency:
            return Decimal("1.0")
        if to_currency == "GBP":
            found = self.rate_for(from_currency, date)
            return found[0] if found else None
        if from_currency == "GBP":
            return self.published_rate(to_currency, date)
        return None
