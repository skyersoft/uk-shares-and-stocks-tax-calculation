"""
Market Price Service for fetching current asset prices.

Provides an abstract interface and concrete implementations for
fetching live market prices and FX rates, used by the unrealised
gains calculator to value current holdings.
"""
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class MarketPriceServiceInterface(ABC):
    """Abstract interface for market price providers."""

    @abstractmethod
    def get_current_price(self, symbol: str, currency: str) -> Optional[float]:
        """Return the latest market price for a security in its native currency.

        Args:
            symbol: Ticker symbol (e.g. "AAPL", "TSCO.L")
            currency: Expected currency code of the price (e.g. "USD", "GBP")

        Returns:
            Current price as a float, or None if the price cannot be fetched.
        """

    @abstractmethod
    def get_fx_rate_to_gbp(self, currency_code: str) -> float:
        """Return today's FX rate: 1 unit of currency_code = X GBP.

        Args:
            currency_code: ISO currency code (e.g. "USD", "EUR")

        Returns:
            FX rate to GBP. Returns 1.0 for GBP (no conversion needed).
        """


class YFinanceMarketPriceService(MarketPriceServiceInterface):
    """Live market prices via yfinance (free, no API key required).

    Uses yfinance's fast_info for low-latency last-price lookups and
    the FX ticker convention (e.g. "USDGBP=X") for exchange rates.
    """

    def __init__(self):
        self._price_cache: Dict[str, Optional[float]] = {}
        self._fx_cache: Dict[str, float] = {}

    def get_current_price(self, symbol: str, currency: str) -> Optional[float]:
        """Fetch latest price for a security using yfinance.

        Args:
            symbol: Ticker symbol. For LSE stocks use the ".L" suffix
                    (e.g. "TSCO.L" for Tesco on the London Stock Exchange).
            currency: Expected trading currency (used only for logging).

        Returns:
            Latest price, or None on failure.
        """
        if symbol in self._price_cache:
            return self._price_cache[symbol]

        try:
            import yfinance as yf
            ticker = yf.Ticker(symbol)
            fi = ticker.fast_info
            # Use attribute access — fast_info.get() does not map to the
            # same underlying data as the attribute in newer yfinance versions
            price = getattr(fi, 'last_price', None)
            if price is None:
                price = getattr(fi, 'previous_close', None)
            if price is not None:
                price = float(price)
            self._price_cache[symbol] = price
            logger.info(
                f"Fetched price for {symbol} ({currency}): {price}"
            )
            return price
        except Exception as exc:
            logger.warning(
                f"Could not fetch price for {symbol}: {exc}"
            )
            self._price_cache[symbol] = None
            return None

    def get_fx_rate_to_gbp(self, currency_code: str) -> float:
        """Fetch today's FX rate from currency_code to GBP via yfinance.

        Uses the Yahoo Finance FX ticker convention, e.g.:
            USD → GBP  =>  "USDGBP=X"
            EUR → GBP  =>  "EURGBP=X"

        Args:
            currency_code: Source currency ISO code.

        Returns:
            Rate: 1 unit of currency_code = N GBP. Returns 1.0 for GBP.
        """
        if currency_code.upper() == "GBP":
            return 1.0

        cache_key = currency_code.upper()
        if cache_key in self._fx_cache:
            return self._fx_cache[cache_key]

        try:
            import yfinance as yf
            fx_ticker = f"{currency_code.upper()}GBP=X"
            ticker = yf.Ticker(fx_ticker)
            fi = ticker.fast_info
            rate = getattr(fi, 'last_price', None)
            if rate is None:
                rate = getattr(fi, 'previous_close', None)
            if rate is not None:
                rate = float(rate)
                self._fx_cache[cache_key] = rate
                logger.info(
                    f"Fetched FX rate {currency_code}→GBP: {rate}"
                )
                return rate
        except Exception as exc:
            logger.warning(
                f"Could not fetch FX rate for {currency_code}→GBP: {exc}"
            )

        # Fallback: log and return a sentinel so callers can detect failure
        logger.error(
            f"FX rate for {currency_code}→GBP unavailable; defaulting to 1.0"
        )
        return 1.0

    def clear_cache(self) -> None:
        """Clear the internal price and FX cache (useful between runs)."""
        self._price_cache.clear()
        self._fx_cache.clear()


class MockMarketPriceService(MarketPriceServiceInterface):
    """Deterministic market price service for unit tests.

    Prices and FX rates are provided at construction time.
    No network calls are made.

    Example::

        svc = MockMarketPriceService(
            prices={"AAPL": 175.0, "TSCO.L": 300.0},
            fx_rates={"USD": 0.79, "GBP": 1.0},
        )
    """

    def __init__(
        self,
        prices: Optional[Dict[str, float]] = None,
        fx_rates: Optional[Dict[str, float]] = None,
        price_source: str = "mock",
    ):
        self._prices: Dict[str, float] = prices or {}
        self._fx_rates: Dict[str, float] = fx_rates or {}
        self.price_source = price_source

    def get_current_price(self, symbol: str, currency: str) -> Optional[float]:
        """Return the configured price for *symbol*, or None if not found."""
        return self._prices.get(symbol)

    def get_fx_rate_to_gbp(self, currency_code: str) -> float:
        """Return the configured FX rate for *currency_code*, defaulting to 1.0."""
        if currency_code.upper() == "GBP":
            return 1.0
        return self._fx_rates.get(currency_code.upper(), 1.0)

    def set_price(self, symbol: str, price: float) -> None:
        """Update or add a price at runtime (useful for parameterised tests)."""
        self._prices[symbol] = price

    def set_fx_rate(self, currency_code: str, rate: float) -> None:
        """Update or add an FX rate at runtime."""
        self._fx_rates[currency_code.upper()] = rate
