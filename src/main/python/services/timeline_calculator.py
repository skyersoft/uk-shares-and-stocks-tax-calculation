"""Portfolio timeline calculator — builds a chronological list of TimelineEvents.

Uses Yahoo Finance (yfinance) to fetch historical closing prices for unrealised
value calculations.  Tax estimates use UK basic-rate CGT after the Annual Exempt
Amount (AEA).
"""
import logging
from datetime import date, timedelta
from typing import Dict, List, Optional, Set, Tuple

import yfinance as yf

from ..config.tax_config import BASIC_RATE_POST_OCT_2024, TAX_YEARS
from ..models.domain_models import Transaction, TransactionType
from ..models.timeline_models import TimelineEvent
from ..services.disposal_calculator import UKDisposalCalculator
from ..services.share_pool_manager import SharePoolManager
from ..services.transaction_matcher import UKTransactionMatcher

logger = logging.getLogger(__name__)

# Sort order for same-date events (lower = processed first)
_EVENT_ORDER: Dict[TransactionType, int] = {
    TransactionType.BUY: 0,
    TransactionType.SELL: 1,
    TransactionType.DIVIDEND: 2,
    TransactionType.INTEREST: 3,
}


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _get_tax_year(d: date) -> str:
    """Return the UK tax year string for a given date.

    UK tax year runs from 6 April to 5 April.

    Examples:
        >>> _get_tax_year(date(2024, 4, 6))
        '2024-2025'
        >>> _get_tax_year(date(2024, 4, 5))
        '2023-2024'
    """
    if d.month > 4 or (d.month == 4 and d.day >= 6):
        return f"{d.year}-{d.year + 1}"
    return f"{d.year - 1}-{d.year}"


def _year_end_date(tax_year: str) -> date:
    """Return April 5 of the closing year for a given tax year string.

    Args:
        tax_year: e.g. "2024-2025"

    Returns:
        date(2025, 4, 5)
    """
    return date(int(tax_year.split("-")[1]), 4, 5)


def _compute_cgt(realised_gain: float, tax_year: str) -> float:
    """Estimate basic-rate CGT after the Annual Exempt Amount.

    Args:
        realised_gain: Net gain/loss in the tax year (GBP).
        tax_year: e.g. "2024-2025".

    Returns:
        Estimated CGT ≥ 0.
    """
    ty = TAX_YEARS.get(tax_year)
    aea = ty.annual_exemption if ty else 3000.0
    return max(0.0, realised_gain - aea) * BASIC_RATE_POST_OCT_2024


def _compute_predictive_cgt(unrealised_gain: float, tax_year: str) -> float:
    """Estimate CGT if all open positions were sold at the current Yahoo price.

    Args:
        unrealised_gain: unrealised_value − total_cost_basis (GBP).
        tax_year: e.g. "2024-2025".

    Returns:
        Estimated CGT ≥ 0.
    """
    ty = TAX_YEARS.get(tax_year)
    aea = ty.annual_exemption if ty else 3000.0
    return max(0.0, unrealised_gain - aea) * BASIC_RATE_POST_OCT_2024


# ---------------------------------------------------------------------------
# BatchYahooPriceFetcher
# ---------------------------------------------------------------------------

class BatchYahooPriceFetcher:
    """Fetches and caches Yahoo Finance daily closing prices.

    A single ``prefetch()`` call downloads all required symbols in bulk.
    ``get_price()`` then resolves dates locally, looking back up to 7 days
    to handle weekends and market holidays.
    """

    def __init__(self) -> None:
        # cache: symbol -> {date: close_price_gbp}
        self._cache: Dict[str, Dict[date, float]] = {}

    def prefetch(self, symbols: Set[str], start: date, end: date) -> None:
        """Download closing prices for all symbols over the date range.

        Args:
            symbols: Set of ticker strings (e.g. {"AAPL", "TSLA"}).
            start: First date to fetch (inclusive).
            end: Last date to fetch (inclusive).
        """
        fetch_end = end + timedelta(days=1)  # yfinance end is exclusive
        for symbol in symbols:
            if not symbol:
                continue
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(
                    start=start.isoformat(),
                    end=fetch_end.isoformat(),
                    auto_adjust=True,
                )
                prices: Dict[date, float] = {}
                for ts, row in hist.iterrows():
                    row_date = ts.date() if hasattr(ts, "date") else ts
                    prices[row_date] = float(row["Close"])
                self._cache[symbol] = prices
                logger.debug("Fetched %d price points for %s", len(prices), symbol)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Failed to fetch Yahoo prices for %s: %s", symbol, exc)
                self._cache[symbol] = {}

    def get_price(self, symbol: str, target: date) -> Optional[float]:
        """Return the closing price on or before the target date.

        Walks back up to 7 calendar days to find the most recent available
        price (handles weekends and public holidays).

        Args:
            symbol: Ticker string.
            target: Date for which to retrieve the price.

        Returns:
            GBP-denominated closing price, or ``None`` if unavailable.
        """
        prices = self._cache.get(symbol, {})
        for offset in range(8):
            candidate = target - timedelta(days=offset)
            if candidate in prices:
                return prices[candidate]
        return None


# ---------------------------------------------------------------------------
# TimelineCalculator
# ---------------------------------------------------------------------------

class TimelineCalculator:
    """Builds a chronological list of ``TimelineEvent`` objects from transactions.

    For every transaction the calculator:

    - Keeps a running Section 104 pool via ``SharePoolManager`` to track cost basis.
    - Looks up the Yahoo Finance closing price to compute unrealised portfolio value.
    - Pre-computes HMRC disposal gains via ``UKTransactionMatcher`` and
      ``UKDisposalCalculator``.
    - Inserts synthetic ``YEAR_END`` markers at each April 5 boundary with a
      predictive CGT estimate.
    - Inserts a ``CURRENT_DATE`` marker for the day this method is called.

    Args:
        price_fetcher: Optional injected price fetcher (defaults to
            ``BatchYahooPriceFetcher``).  Pass a mock in tests to avoid
            network calls.
    """

    def __init__(
        self, price_fetcher: Optional[BatchYahooPriceFetcher] = None
    ) -> None:
        self._price_fetcher = price_fetcher or BatchYahooPriceFetcher()
        self._matcher = UKTransactionMatcher()
        self._disposal_calc = UKDisposalCalculator()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def calculate(
        self,
        transactions: List[Transaction],
        today: Optional[date] = None,
    ) -> Tuple[List[TimelineEvent], dict]:
        """Compute the full portfolio timeline.

        Args:
            transactions: All parsed transactions (any order).
            today: Reference date for the ``CURRENT_DATE`` event.
                Defaults to ``date.today()``.

        Returns:
            ``(events, summary)`` — ordered list of ``TimelineEvent`` objects
            plus a summary dictionary derived from the final event.
        """
        if not transactions:
            return [], self._empty_summary()

        if today is None:
            today = date.today()

        sorted_txns = self._sort_transactions(transactions)
        disposal_info = self._compute_disposal_info(transactions)

        symbols: Set[str] = {
            t.security.symbol
            for t in sorted_txns
            if t.security and t.security.symbol
        }
        min_date = sorted_txns[0].date.date()
        max_date = max(sorted_txns[-1].date.date(), today)
        self._price_fetcher.prefetch(symbols, min_date, max_date)

        events = self._walk_events(sorted_txns, disposal_info, today)
        return events, self._build_summary(events)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _sort_transactions(self, transactions: List[Transaction]) -> List[Transaction]:
        """Sort transactions by date, then by event type, then by symbol."""

        def _key(t: Transaction):
            order = _EVENT_ORDER.get(t.transaction_type, 99)
            sym = (t.security.symbol or "") if t.security else ""
            return (t.date.date(), order, sym)

        return sorted(transactions, key=_key)

    def _compute_disposal_info(
        self, transactions: List[Transaction]
    ) -> Dict[str, dict]:
        """Pre-compute HMRC disposal gain and cost for each sell transaction.

        Returns:
            Mapping of ``transaction_id → {gain, cost}`` for every sell.
        """
        result: Dict[str, dict] = {}
        try:
            for sell_tx, matched_buys in self._matcher.match_disposals(transactions):
                if not matched_buys:
                    continue
                disposal = self._disposal_calc.calculate_disposal(sell_tx, matched_buys)
                key = sell_tx.transaction_id or str(sell_tx.id)
                entry = result.setdefault(key, {"gain": 0.0, "cost": 0.0})
                entry["gain"] += float(disposal.gain_or_loss or 0)
                entry["cost"] += float(disposal.cost_basis or 0)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Disposal pre-computation failed: %s", exc)
        return result

    def _compute_unrealised_value(
        self,
        held_quantities: Dict[str, float],
        fx_rates: Dict[str, float],
        target: date,
    ) -> float:
        """Sum the current Yahoo market value of all open positions.

        Args:
            held_quantities: symbol → quantity
            fx_rates: symbol → currency rate to GBP
            target: Date for which to look up prices.

        Returns:
            Total portfolio value in GBP.
        """
        total = 0.0
        for sym, qty in held_quantities.items():
            if qty <= 0:
                continue
            price = self._price_fetcher.get_price(sym, target)
            if price is None:
                continue
            total += qty * price * fx_rates.get(sym, 1.0)
        return total

    def _walk_events(
        self,
        sorted_txns: List[Transaction],
        disposal_info: Dict[str, dict],
        today: date,
    ) -> List[TimelineEvent]:
        """Iterate sorted transactions and build the ordered event list."""
        events: List[TimelineEvent] = []
        idx = 0

        # Persistent running state
        total_cost_basis = 0.0
        held_quantities: Dict[str, float] = {}  # symbol → quantity
        fx_rates: Dict[str, float] = {}         # symbol → rate_to_base

        # Per-year accumulators (reset to 0 at each YEAR_END boundary)
        realised_gain_loss = 0.0
        income_gbp = 0.0

        # Fresh pool manager for cost-basis tracking via before/after pattern
        pool_mgr = SharePoolManager()

        current_tax_year = _get_tax_year(sorted_txns[0].date.date())
        year_end = _year_end_date(current_tax_year)

        for txn in sorted_txns:
            txn_date = txn.date.date()
            txn_tax_year = _get_tax_year(txn_date)

            # --- Emit YEAR_END markers for every April 5 boundary crossed ---
            while current_tax_year != txn_tax_year:
                unrealised_ye = self._compute_unrealised_value(
                    held_quantities, fx_rates, year_end
                )
                r_tax = _compute_cgt(realised_gain_loss, current_tax_year)
                pred_cgt = _compute_predictive_cgt(
                    unrealised_ye - total_cost_basis, current_tax_year
                )
                events.append(
                    TimelineEvent(
                        event_index=idx,
                        event_date=year_end.strftime("%Y-%m-%d"),
                        tax_year=current_tax_year,
                        label=f"Tax Year End {current_tax_year}",
                        event_type="YEAR_END",
                        symbol=None,
                        quantity=None,
                        price_gbp=None,
                        currency=None,
                        unrealised_value_gbp=round(unrealised_ye, 2),
                        unrealised_gain_loss_gbp=round(unrealised_ye - total_cost_basis, 2),
                        total_cost_basis_gbp=round(total_cost_basis, 2),
                        realised_gain_loss_gbp=round(realised_gain_loss, 2),
                        realised_tax_gbp=round(r_tax, 2),
                        income_gbp=round(income_gbp, 2),
                        predictive_sell_all_cgt_gbp=round(pred_cgt, 2),
                    )
                )
                idx += 1
                # Reset per-year accumulators
                realised_gain_loss = 0.0
                income_gbp = 0.0
                # Advance to the next tax year
                next_day = year_end + timedelta(days=1)
                current_tax_year = _get_tax_year(next_day)
                year_end = _year_end_date(current_tax_year)

            # --- Process the transaction ---
            symbol = txn.security.symbol if txn.security else None
            fx = float(txn.currency.rate_to_base) if txn.currency else 1.0
            if symbol:
                fx_rates[symbol] = fx

            if txn.transaction_type == TransactionType.BUY:
                pool_mgr.process_transaction(txn)
                total_cost_basis += float(txn.total_cost_in_base_currency or 0)
                if symbol:
                    held_quantities[symbol] = (
                        held_quantities.get(symbol, 0.0) + float(txn.quantity or 0)
                    )

            elif txn.transaction_type == TransactionType.SELL:
                key = txn.transaction_id or str(txn.id)
                info = disposal_info.get(key, {"gain": 0.0, "cost": 0.0})
                realised_gain_loss += info["gain"]

                # Derive cost removed via before/after pool comparison
                pool_before = pool_mgr.get_pool(txn.security)
                cost_before = float(pool_before.cost_basis) if pool_before else 0.0
                pool_mgr.process_transaction(txn)
                pool_after = pool_mgr.get_pool(txn.security)
                cost_after = float(pool_after.cost_basis) if pool_after else 0.0
                total_cost_basis = max(0.0, total_cost_basis - (cost_before - cost_after))

                if symbol:
                    held_quantities[symbol] = max(
                        0.0,
                        held_quantities.get(symbol, 0.0) - float(txn.quantity or 0),
                    )

            elif txn.transaction_type == TransactionType.DIVIDEND:
                income_gbp += float(txn.net_amount_in_base_currency or 0)

            elif txn.transaction_type == TransactionType.INTEREST:
                income_gbp += float(txn.net_amount_in_base_currency or 0)

            unrealised = self._compute_unrealised_value(held_quantities, fx_rates, txn_date)
            r_tax = _compute_cgt(realised_gain_loss, txn_tax_year)

            events.append(
                TimelineEvent(
                    event_index=idx,
                    event_date=txn_date.strftime("%Y-%m-%d"),
                    tax_year=txn_tax_year,
                    label=self._make_label(txn),
                    event_type=txn.transaction_type.name,
                    symbol=symbol,
                    quantity=(float(txn.quantity) if txn.quantity is not None else None),
                    price_gbp=round(float(txn.price_per_unit_in_base_currency or 0), 4),
                    currency=(txn.currency.code if txn.currency else "GBP"),
                    unrealised_value_gbp=round(unrealised, 2),
                    unrealised_gain_loss_gbp=round(unrealised - total_cost_basis, 2),
                    total_cost_basis_gbp=round(total_cost_basis, 2),
                    realised_gain_loss_gbp=round(realised_gain_loss, 2),
                    realised_tax_gbp=round(r_tax, 2),
                    income_gbp=round(income_gbp, 2),
                    predictive_sell_all_cgt_gbp=None,
                )
            )
            idx += 1

        # --- Append CURRENT_DATE marker ---
        last_txn_date = sorted_txns[-1].date.date()
        if today >= last_txn_date:
            unrealised_today = self._compute_unrealised_value(
                held_quantities, fx_rates, today
            )
            gain_today = unrealised_today - total_cost_basis
            r_tax_today = _compute_cgt(realised_gain_loss, current_tax_year)
            pred_cgt = _compute_predictive_cgt(gain_today, current_tax_year)
            events.append(
                TimelineEvent(
                    event_index=idx,
                    event_date=today.strftime("%Y-%m-%d"),
                    tax_year=current_tax_year,
                    label=f"Today ({today.strftime('%d %b %Y')})",
                    event_type="CURRENT_DATE",
                    symbol=None,
                    quantity=None,
                    price_gbp=None,
                    currency=None,
                    unrealised_value_gbp=round(unrealised_today, 2),
                    unrealised_gain_loss_gbp=round(gain_today, 2),
                    total_cost_basis_gbp=round(total_cost_basis, 2),
                    realised_gain_loss_gbp=round(realised_gain_loss, 2),
                    realised_tax_gbp=round(r_tax_today, 2),
                    income_gbp=round(income_gbp, 2),
                    predictive_sell_all_cgt_gbp=round(pred_cgt, 2),
                )
            )

        return events

    def _make_label(self, txn: Transaction) -> str:
        """Build a human-readable label for a transaction event."""
        symbol = (txn.security.symbol if txn.security else "UNKNOWN") or "UNKNOWN"
        qty = int(txn.quantity or 0)
        price = float(txn.price_per_unit_in_base_currency or 0)
        t = txn.transaction_type
        if t == TransactionType.BUY:
            return f"BUY {symbol} ({qty} shares @ \u00a3{price:.2f})"
        if t == TransactionType.SELL:
            return f"SELL {symbol} ({qty} shares @ \u00a3{price:.2f})"
        if t == TransactionType.DIVIDEND:
            amt = float(txn.net_amount_in_base_currency or 0)
            return f"DIVIDEND {symbol} (\u00a3{amt:.2f})"
        if t == TransactionType.INTEREST:
            amt = float(txn.net_amount_in_base_currency or 0)
            return f"INTEREST \u00a3{amt:.2f}"
        return f"{t.name} {symbol}"

    def _build_summary(self, events: List[TimelineEvent]) -> dict:
        """Build a summary dictionary from the last timeline event."""
        if not events:
            return self._empty_summary()
        last = events[-1]
        return {
            "final_unrealised_value_gbp": last.unrealised_value_gbp,
            "final_unrealised_gain_loss_gbp": last.unrealised_gain_loss_gbp,
            "final_total_cost_basis_gbp": last.total_cost_basis_gbp,
            "final_realised_gain_loss_gbp": last.realised_gain_loss_gbp,
            "final_realised_tax_gbp": last.realised_tax_gbp,
            "final_income_gbp": last.income_gbp,
            "predictive_cgt_gbp": last.predictive_sell_all_cgt_gbp or 0.0,
        }

    @staticmethod
    def _empty_summary() -> dict:
        return {
            "final_unrealised_value_gbp": 0.0,
            "final_unrealised_gain_loss_gbp": 0.0,
            "final_total_cost_basis_gbp": 0.0,
            "final_realised_gain_loss_gbp": 0.0,
            "final_realised_tax_gbp": 0.0,
            "final_income_gbp": 0.0,
            "predictive_cgt_gbp": 0.0,
        }
