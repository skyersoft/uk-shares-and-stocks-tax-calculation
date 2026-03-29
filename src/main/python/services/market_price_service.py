"""
Market Price Service for fetching current asset prices.

Provides an abstract interface and concrete implementations for
fetching live market prices and FX rates, used by the unrealised
gains calculator to value current holdings.
"""
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
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
    """Market prices via yfinance — supports both live and historical lookups.

    When ``as_of_date`` is provided and in the past the service fetches
    the closing price on (or shortly before) that date using
    ``yf.Ticker.history()``.  When ``as_of_date`` is None or in the
    future, live ``fast_info`` prices are used instead.

    This allows the unrealised-gains endpoint to value a portfolio as of
    the last day of a completed UK tax year (e.g. 5 April 2025 for
    2024-2025) rather than at today's market prices.

    Args:
        as_of_date: Optional reference date.  If set and in the past,
                    historical closing prices are used.
    """

    def __init__(self, as_of_date: Optional[datetime] = None):
        self._price_cache: Dict[str, Optional[float]] = {}
        self._fx_cache: Dict[str, float] = {}
        # Normalise to date-only comparison (strip time)
        if as_of_date is not None:
            now = datetime.utcnow()
            # Use historical mode only when as_of_date is strictly in the past
            self._as_of_date: Optional[datetime] = (
                as_of_date if as_of_date.date() < now.date() else None
            )
        else:
            self._as_of_date = None
        self.price_source = "historical" if self._as_of_date else "live"

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _fetch_historical_close(self, yf_symbol: str) -> Optional[float]:
        """Return the closing price on or just before ``_as_of_date``."""
        try:
            import yfinance as yf
            start = self._as_of_date
            # Look back up to 7 calendar days to skip weekends/holidays
            end = start + timedelta(days=1)
            fetch_start = start - timedelta(days=7)
            hist = yf.Ticker(yf_symbol).history(
                start=fetch_start.strftime("%Y-%m-%d"),
                end=end.strftime("%Y-%m-%d"),
                auto_adjust=True,
            )
            if hist.empty:
                return None
            # Take the last available close on or before as_of_date
            hist = hist[hist.index.date <= self._as_of_date.date()]
            if hist.empty:
                return None
            return float(hist["Close"].iloc[-1])
        except Exception as exc:
            logger.warning(f"Historical price fetch failed for {yf_symbol}: {exc}")
            return None

    def _fetch_live_price(self, symbol: str) -> Optional[float]:
        """Return the latest market price using fast_info."""
        try:
            import yfinance as yf
            ticker = yf.Ticker(symbol)
            fi = ticker.fast_info
            price = getattr(fi, 'last_price', None)
            if price is None:
                price = getattr(fi, 'previous_close', None)
            return float(price) if price is not None else None
        except Exception as exc:
            logger.warning(f"Live price fetch failed for {symbol}: {exc}")
            return None

    # ------------------------------------------------------------------
    # Interface implementation
    # ------------------------------------------------------------------

    def get_current_price(self, symbol: str, currency: str) -> Optional[float]:
        """Fetch price for a security — historical or live depending on mode.

        Args:
            symbol: Ticker symbol. For LSE stocks use the ".L" suffix.
            currency: Expected trading currency (used only for logging).

        Returns:
            Price as a float, or None if unavailable.
        """
        if symbol in self._price_cache:
            return self._price_cache[symbol]

        if self._as_of_date:
            price = self._fetch_historical_close(symbol)
            mode = f"historical ({self._as_of_date.date()})"
        else:
            price = self._fetch_live_price(symbol)
            mode = "live"

        self._price_cache[symbol] = price
        if price is not None:
            logger.info(f"Fetched {mode} price for {symbol} ({currency}): {price}")
        else:
            logger.warning(f"No {mode} price for {symbol} ({currency})")
        return price

    def get_fx_rate_to_gbp(self, currency_code: str) -> float:
        """Fetch FX rate from currency_code to GBP — historical or live.

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

        fx_ticker = f"{cache_key}GBP=X"
        if self._as_of_date:
            rate = self._fetch_historical_close(fx_ticker)
            mode = f"historical ({self._as_of_date.date()})"
        else:
            rate = self._fetch_live_price(fx_ticker)
            mode = "live"

        if rate is not None:
            self._fx_cache[cache_key] = rate
            logger.info(f"Fetched {mode} FX rate {currency_code}→GBP: {rate}")
            return rate

        logger.error(
            f"FX rate for {currency_code}→GBP unavailable ({mode}); defaulting to 1.0"
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
