"""Data models for the portfolio timeline feature."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class TimelineEvent:
    """Represents a single event on the portfolio timeline.

    Each event corresponds to either a transaction (BUY, SELL, DIVIDEND,
    INTEREST, SPLIT) or a synthetic marker (YEAR_END, CURRENT_DATE).
    Running portfolio metrics are captured at every event so the frontend
    can chart them over time.

    Attributes:
        event_index: Sequential index (0-based) used for ordering.
        event_date: ISO-8601 date string ("YYYY-MM-DD").
        tax_year: UK tax year the event falls within (e.g. "2024-2025").
        label: Human-readable description of the event.
        event_type: Transaction type name or "YEAR_END" / "CURRENT_DATE".
        symbol: Ticker symbol — None for synthetic markers.
        quantity: Number of shares traded — None for synthetic markers.
        price_gbp: GBP price per unit at the time of the event.
        currency: Original transaction currency code (e.g. "USD").
        unrealised_value_gbp: Current market value of all open positions in GBP.
        unrealised_gain_loss_gbp: unrealised_value_gbp minus total_cost_basis_gbp.
        total_cost_basis_gbp: Running total cost basis of open positions in GBP.
        realised_gain_loss_gbp: Cumulative HMRC gain/loss in the current tax year.
        realised_tax_gbp: Estimated CGT (basic rate) on realised_gain_loss_gbp.
        income_gbp: Cumulative dividend + interest income in the current tax year.
        predictive_sell_all_cgt_gbp: Estimated CGT if all holdings were sold at
            current Yahoo Finance prices.  Set only on YEAR_END and CURRENT_DATE
            events; None for regular transaction events.
    """

    event_index: int
    event_date: str
    tax_year: str
    label: str
    event_type: str
    symbol: Optional[str]
    quantity: Optional[float]
    price_gbp: Optional[float]
    currency: Optional[str]
    unrealised_value_gbp: float
    unrealised_gain_loss_gbp: float
    total_cost_basis_gbp: float
    realised_gain_loss_gbp: float
    realised_tax_gbp: float
    income_gbp: float
    predictive_sell_all_cgt_gbp: Optional[float]

    def to_dict(self) -> dict:
        """Serialise to a JSON-safe dictionary.

        All float fields are rounded to 2 decimal places.
        ``predictive_sell_all_cgt_gbp`` is kept as ``None`` when not set.
        """
        return {
            "event_index": self.event_index,
            "event_date": self.event_date,
            "tax_year": self.tax_year,
            "label": self.label,
            "event_type": self.event_type,
            "symbol": self.symbol,
            "quantity": self.quantity,
            "price_gbp": round(self.price_gbp, 2) if self.price_gbp is not None else None,
            "currency": self.currency,
            "unrealised_value_gbp": round(self.unrealised_value_gbp, 2),
            "unrealised_gain_loss_gbp": round(self.unrealised_gain_loss_gbp, 2),
            "total_cost_basis_gbp": round(self.total_cost_basis_gbp, 2),
            "realised_gain_loss_gbp": round(self.realised_gain_loss_gbp, 2),
            "realised_tax_gbp": round(self.realised_tax_gbp, 2),
            "income_gbp": round(self.income_gbp, 2),
            "predictive_sell_all_cgt_gbp": (
                round(self.predictive_sell_all_cgt_gbp, 2)
                if self.predictive_sell_all_cgt_gbp is not None
                else None
            ),
        }
