"""
FX Rate Service for multi-currency support.

This module provides the interface and implementations for fetching
foreign exchange rates for tax calculations.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict
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
    FX rate service using HMRC official monthly rates.

    For UK tax purposes, HMRC publishes monthly and yearly average rates.
    For spot transactions, the monthly rate is typically accepted.

    Note: A full implementation would scrape/fetch from HMRC API or XML feeds.
    This is a simplified version that could be expanded.
    """

    def __init__(self):
        self._cache: Dict[str, Decimal] = {}

    def get_rate(
        self,
        from_currency: str,
        to_currency: str,
        date: datetime
    ) -> Optional[Decimal]:
        """
        Get HMRC exchange rate.

        Current implementation is a placeholder/mock.
        In a real app, this would query a database or external API.
        """
        if from_currency == to_currency:
            return Decimal('1.0')

        # TODO: Implement actual HMRC rate fetching
        # For now, return a static rate for testing/development
        logger.warning(
            f"Using mock FX rate for {from_currency} to {to_currency} on {date}"
        )

        # Mock rates (approximate)
        rates = {
            ('USD', 'GBP'): Decimal('0.79'),
            ('EUR', 'GBP'): Decimal('0.86'),
            ('GBP', 'USD'): Decimal('1.27'),
            ('GBP', 'EUR'): Decimal('1.16'),
        }

        return rates.get((from_currency, to_currency))
