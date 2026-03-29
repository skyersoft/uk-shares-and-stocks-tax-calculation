"""
Unrealised Gains Calculator.

Calculates unrealised gains/losses for current holdings using live market
prices, and predicts the CGT liability if all positions were sold today.

Critically, the predictive tax calculation runs virtual disposals through
the existing UKTransactionMatcher pipeline so that UK CGT matching rules
(same-day, 30-day bed & breakfast, Section 104) are correctly applied —
rather than simply comparing current value to pool average cost.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple

from ..models.domain_models import (
    Holding,
    Transaction,
    TransactionType,
    Security,
    Currency,
    UnrealisedPosition,
    PredictiveTaxSummary,
)
from ..config.tax_config import TAX_YEARS, BASIC_RATE_POST_OCT_2024, HIGHER_RATE_POST_OCT_2024
from .market_price_service import MarketPriceServiceInterface
from .transaction_matcher import UKTransactionMatcher
from .disposal_calculator import UKDisposalCalculator

logger = logging.getLogger(__name__)

GBP = Currency(code="GBP", rate_to_base=1.0)
BB_RULE_DAYS = 30  # UK bed-and-breakfast rule window


class UnrealisedGainsCalculator:
    """Calculates unrealised gains/losses and predictive CGT for current holdings.

    Typical usage::

        from src.main.python.services.market_price_service import YFinanceMarketPriceService

        price_service = YFinanceMarketPriceService()
        calculator = UnrealisedGainsCalculator()

        positions = calculator.calculate_unrealised_positions(
            holdings, price_service, all_transactions
        )
        summary = calculator.calculate_predictive_tax(
            positions, all_transactions, tax_year="2025-2026",
            already_realised_gain_gbp=2500.0
        )
    """

    def __init__(self) -> None:
        self.matcher = UKTransactionMatcher()
        self.disposal_calc = UKDisposalCalculator()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def calculate_unrealised_positions(
        self,
        holdings: List[Holding],
        price_service: MarketPriceServiceInterface,
        all_transactions: List[Transaction],
        today: Optional[datetime] = None,
    ) -> List[UnrealisedPosition]:
        """Enrich each Holding with live market prices and B&B metadata.

        Args:
            holdings: Current holdings (from PortfolioCalculator).
            price_service: Market price provider (live or mock).
            all_transactions: Full transaction history used to detect
                              recent buys (B&B exposure).
            today: Reference date for B&B window; defaults to now (UTC).

        Returns:
            List of UnrealisedPosition objects, one per holding for which
            a price could be fetched.  Holdings with no price are skipped
            and a warning is logged.
        """
        if today is None:
            today = datetime.utcnow()

        price_fetched_at = datetime.utcnow()
        positions: List[UnrealisedPosition] = []

        for holding in holdings:
            symbol = holding.security.symbol
            # Determine trading currency from the security or default GBP
            currency_code = self._infer_currency(holding)

            price_native = price_service.get_current_price(symbol, currency_code)
            if price_native is None:
                logger.warning(
                    f"No price for {symbol} — skipping from unrealised analysis"
                )
                continue

            fx_rate = price_service.get_fx_rate_to_gbp(currency_code)
            current_price_gbp = price_native * fx_rate
            current_value_gbp = holding.quantity * current_price_gbp
            cost_basis_gbp = holding.total_cost_gbp
            unrealised = current_value_gbp - cost_basis_gbp
            gain_loss_pct = (
                (unrealised / cost_basis_gbp * 100) if cost_basis_gbp else 0.0
            )

            # Detect recent buys for B&B exposure warning
            has_recent_buys, days_since_last_buy = self._check_recent_buys(
                holding.security, all_transactions, today
            )

            # Determine price source label
            price_source = getattr(price_service, "price_source", "unknown")

            positions.append(
                UnrealisedPosition(
                    holding=holding,
                    current_price_native=price_native,
                    current_price_gbp=current_price_gbp,
                    current_value_gbp=current_value_gbp,
                    cost_basis_gbp=cost_basis_gbp,
                    unrealised_gain_loss_gbp=unrealised,
                    gain_loss_pct=gain_loss_pct,
                    price_currency=currency_code,
                    fx_rate_to_gbp=fx_rate,
                    price_fetched_at=price_fetched_at,
                    price_source=price_source,
                    has_recent_buys=has_recent_buys,
                    days_since_last_buy=days_since_last_buy,
                )
            )

        logger.info(
            f"Built {len(positions)} unrealised positions "
            f"({len(holdings) - len(positions)} skipped due to missing prices)"
        )
        return positions

    def calculate_predictive_tax(
        self,
        positions: List[UnrealisedPosition],
        all_transactions: List[Transaction],
        tax_year: str,
        already_realised_gain_gbp: float = 0.0,
        today: Optional[datetime] = None,
    ) -> PredictiveTaxSummary:
        """Simulate selling all positions today and calculate the CGT liability.

        Key behaviour:
        * Synthesises a virtual SELL transaction for each position
          dated *today*.
        * Combines virtual sells with the real transaction history and runs
          them through ``UKTransactionMatcher`` — so same-day and 30-day
          B&B matching rules are automatically applied.
        * Passes each matched virtual disposal through ``UKDisposalCalculator``
          to get a correctly computed gain/loss in GBP.

        Args:
            positions: From ``calculate_unrealised_positions``.
            all_transactions: Full historical transaction list.
            tax_year: e.g. ``"2025-2026"``.
            already_realised_gain_gbp: Net gain already realised this tax year
                                       (used for combined estimation).
            today: Hypothetical sale date; defaults to now (UTC).

        Returns:
            PredictiveTaxSummary with correctly-matched cost basis and
            estimated CGT figures.
        """
        if today is None:
            today = datetime.utcnow()

        annual_exemption = self._get_annual_exemption(tax_year)

        # 1. Build virtual SELL transactions
        virtual_sells = self._build_virtual_sells(positions, today)

        if not virtual_sells:
            logger.info("No virtual sells to process — returning empty summary")
            return PredictiveTaxSummary(
                tax_year=tax_year,
                positions=positions,
                hypothetical_sale_date=today,
                annual_exemption_available=annual_exemption,
                already_realised_gain_gbp=already_realised_gain_gbp,
                price_fetched_at=datetime.utcnow(),
            )

        # 2. Combine with real history and run through UK matcher
        combined_transactions = list(all_transactions) + virtual_sells
        matched_disposals = self.matcher.match_disposals(combined_transactions)

        # 3. Filter to only our virtual disposals (identified by transaction_id prefix)
        virtual_ids = {t.transaction_id for t in virtual_sells}
        virtual_matched = [
            (sell, buys)
            for sell, buys in matched_disposals
            if sell.transaction_id in virtual_ids
        ]

        # 4. Calculate each disposal and aggregate
        predictive_gains = 0.0
        predictive_losses = 0.0
        total_current_value = sum(p.current_value_gbp for p in positions)
        total_cost_matched = 0.0
        bb_affected_symbols: List[str] = []

        for sell_tx, matched_buys in virtual_matched:
            if not matched_buys:
                continue

            disposal = self.disposal_calc.calculate_disposal(sell_tx, matched_buys)
            gain = disposal.gain_or_loss

            if gain > 0:
                predictive_gains += gain
            else:
                predictive_losses += abs(gain)

            total_cost_matched += disposal.cost_basis

            # Check if B&B rule was triggered:
            # The UK matcher matches buys *after* the sell date for B&B.
            # For a sell-today simulation real future buys don't exist,
            # but we also warn when any buy is within 30 days *before* today
            # because that buy has recently altered the pool average cost.
            symbol = sell_tx.security.symbol
            for buy in matched_buys:
                buy_date = buy.date.date() if hasattr(buy.date, 'date') else buy.date
                sell_date = sell_tx.date.date() if hasattr(sell_tx.date, 'date') else sell_tx.date
                # B&B triggered: buy dated after the sell (future buy matched)
                if buy_date > sell_date:
                    if symbol not in bb_affected_symbols:
                        bb_affected_symbols.append(symbol)
                    break

            # Also flag if any recent real buy (within 30 days before today)
            # exists — meaning the pool cost was recently changed
            if symbol not in bb_affected_symbols:
                recent_in_pool = [
                    t for t in all_transactions
                    if (
                        t.transaction_type == TransactionType.BUY
                        and self._securities_match(t.security, sell_tx.security)
                        and (today.date() - t.date.date()).days <= BB_RULE_DAYS
                    )
                ]
                if recent_in_pool:
                    bb_affected_symbols.append(symbol)

        predictive_net = predictive_gains - predictive_losses
        total_unrealised = total_current_value - total_cost_matched

        # 5. Apply annual exemption (unrealised only)
        predictive_exemption_used = min(annual_exemption, max(0.0, predictive_net))
        predictive_taxable = max(0.0, predictive_net - predictive_exemption_used)
        est_tax_basic = predictive_taxable * BASIC_RATE_POST_OCT_2024
        est_tax_higher = predictive_taxable * HIGHER_RATE_POST_OCT_2024

        # 6. Combined with already-realised gains
        combined_net = predictive_net + already_realised_gain_gbp
        combined_exemption_used = min(annual_exemption, max(0.0, combined_net))
        combined_taxable = max(0.0, combined_net - combined_exemption_used)
        combined_tax_basic = combined_taxable * BASIC_RATE_POST_OCT_2024
        combined_tax_higher = combined_taxable * HIGHER_RATE_POST_OCT_2024

        summary = PredictiveTaxSummary(
            tax_year=tax_year,
            positions=positions,
            hypothetical_sale_date=today,
            total_current_value_gbp=total_current_value,
            total_cost_basis_gbp=total_cost_matched,
            total_unrealised_gain_loss_gbp=total_unrealised,
            predictive_total_gains_gbp=predictive_gains,
            predictive_total_losses_gbp=predictive_losses,
            predictive_net_gain_gbp=predictive_net,
            annual_exemption_available=annual_exemption,
            predictive_taxable_gain_gbp=predictive_taxable,
            estimated_tax_basic_rate_gbp=est_tax_basic,
            estimated_tax_higher_rate_gbp=est_tax_higher,
            already_realised_gain_gbp=already_realised_gain_gbp,
            combined_net_gain_gbp=combined_net,
            combined_taxable_gain_gbp=combined_taxable,
            combined_estimated_tax_basic_rate_gbp=combined_tax_basic,
            combined_estimated_tax_higher_rate_gbp=combined_tax_higher,
            affected_by_bb_rule=len(bb_affected_symbols) > 0,
            bb_rule_affected_symbols=bb_affected_symbols,
            price_fetched_at=datetime.utcnow(),
        )

        logger.info(
            f"Predictive tax for {tax_year}: "
            f"net unrealised gain/loss = £{predictive_net:.2f}, "
            f"taxable = £{predictive_taxable:.2f}, "
            f"combined taxable (with realised) = £{combined_taxable:.2f}, "
            f"B&B affected symbols: {bb_affected_symbols}"
        )

        return summary

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_virtual_sells(
        self,
        positions: List[UnrealisedPosition],
        today: datetime,
    ) -> List[Transaction]:
        """Build a synthetic SELL transaction for each unrealised position."""
        virtual_sells: List[Transaction] = []

        for position in positions:
            holding = position.holding
            if holding.quantity <= 0:
                continue

            # Use a currency matching the position's trading currency
            currency = Currency(
                code=position.price_currency,
                rate_to_base=position.fx_rate_to_gbp,
            )

            virtual_sell = Transaction(
                transaction_id=f"VIRTUAL_SELL_{holding.security.symbol}_{uuid.uuid4().hex[:8]}",
                transaction_type=TransactionType.SELL,
                security=holding.security,
                date=today,
                quantity=-holding.quantity,         # negative = sell
                price_per_unit=position.current_price_native,
                commission=0.0,                     # hypothetical — no commission
                taxes=0.0,
                currency=currency,
            )
            virtual_sells.append(virtual_sell)
            logger.debug(
                f"Virtual sell: {holding.quantity} × {holding.security.symbol} "
                f"@ {position.current_price_native:.4f} {position.price_currency}"
            )

        return virtual_sells

    def _check_recent_buys(
        self,
        security: Security,
        all_transactions: List[Transaction],
        today: datetime,
    ) -> Tuple[bool, Optional[int]]:
        """Check whether there are buy transactions in the last 30 days.

        Returns:
            (has_recent_buys, days_since_last_buy)
        """
        window_start = today - timedelta(days=BB_RULE_DAYS)
        today_date = today.date() if hasattr(today, 'date') else today

        recent_buys = [
            t for t in all_transactions
            if (
                t.transaction_type == TransactionType.BUY
                and self._securities_match(t.security, security)
                and t.date.date() >= window_start.date()
            )
        ]

        if not recent_buys:
            # Find days since most recent buy ever
            all_buys = [
                t for t in all_transactions
                if (
                    t.transaction_type == TransactionType.BUY
                    and self._securities_match(t.security, security)
                )
            ]
            if all_buys:
                latest_buy = max(all_buys, key=lambda t: t.date)
                days = (today_date - latest_buy.date.date()).days
                return False, days
            return False, None

        latest_recent = max(recent_buys, key=lambda t: t.date)
        days = (today_date - latest_recent.date.date()).days
        return True, days

    @staticmethod
    def _securities_match(a: Security, b: Security) -> bool:
        """Return True if two Security objects refer to the same instrument."""
        if a.isin and b.isin:
            return a.isin == b.isin
        return a.symbol == b.symbol

    @staticmethod
    def _infer_currency(holding: Holding) -> str:
        """Infer the trading currency from the holding's market or symbol suffix."""
        market = (holding.market or "").upper()
        # Explicit UK exchange names → GBP
        if market in ("LSE", "LON", "XLON"):
            return "GBP"
        # Explicit US exchange names → USD
        if market in ("NASDAQ", "NYSE", "XNAS", "XNYS", "ARCA"):
            return "USD"

        # Fall back to symbol-suffix heuristics when market is unknown
        # (common for CSV-imported holdings that lack exchange metadata)
        symbol = (holding.security.symbol if holding.security else "") or ""
        upper_sym = symbol.upper()

        # Symbols ending in ".L" trade on the London Stock Exchange → GBP
        if upper_sym.endswith(".L"):
            return "GBP"
        # Other exchange suffixes can be added here in future:
        # .AS → EUR (Amsterdam), .PA → EUR (Paris), etc.

        # Symbols with no dot suffix are almost certainly US-listed → USD
        if "." not in symbol:
            return "USD"

        # Unknown exchange suffix — default to GBP (conservative)
        return "GBP"

    @staticmethod
    def _get_annual_exemption(tax_year: str) -> float:
        """Return the CGT annual exemption for the given tax year."""
        tax_year_config = TAX_YEARS.get(tax_year)
        if tax_year_config:
            return tax_year_config.annual_exemption
        logger.warning(
            f"Unknown tax year '{tax_year}'; defaulting annual exemption to £3,000"
        )
        return 3000.0
