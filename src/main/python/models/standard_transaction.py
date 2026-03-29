"""
Standard transaction model for multi-broker support.

This module defines the standardized transaction format that all broker-specific
converters must produce. It handles multi-currency transactions, validation,
and automatic calculation of derived fields.

Design Principles:
- Single Responsibility: Each class has one clear purpose
- Open/Closed: Extensible via composition, not modification
- Liskov Substitution: All transaction types follow the same interface
- Interface Segregation: Minimal required fields, optional extensions
- Dependency Inversion: Depends on abstractions (Enums), not concrete types
"""

from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class TransactionType(Enum):
    """All possible transaction types across brokers."""
    BUY = "BUY"
    SELL = "SELL"
    DIVIDEND = "DIVIDEND"
    INTEREST = "INTEREST"
    FEE = "FEE"
    TAX_WITHHOLDING = "TAX_WITHHOLDING"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    STOCK_SPLIT = "STOCK_SPLIT"
    MERGER = "MERGER"
    SPIN_OFF = "SPIN_OFF"
    RIGHTS_ISSUE = "RIGHTS_ISSUE"
    BONUS_ISSUE = "BONUS_ISSUE"
    CORPORATE_ACTION = "CORPORATE_ACTION"


class AssetClass(Enum):
    """Asset classification for tax treatment."""
    STOCK = "STOCK"
    ETF = "ETF"
    BOND = "BOND"
    OPTION = "OPTION"
    FUTURE = "FUTURE"
    FOREX = "FOREX"
    CRYPTO = "CRYPTO"
    FUND = "FUND"
    PROPERTY = "PROPERTY"  # For REITs, property funds


def round_currency(value: Decimal) -> Decimal:
    """
    Round currency value to 2 decimal places using banker's rounding.

    Args:
        value: Decimal value to round

    Returns:
        Rounded decimal value
    """
    return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


@dataclass
class StandardTransaction:
    """
    Comprehensive standardized transaction format for multi-currency accounts.

    This format captures ALL information needed for UK tax calculations including
    Section 104 pooling, capital gains, dividend tax, and FX gains/losses.

    REQUIRED FIELDS (must be provided):
        - date: Transaction date
        - symbol: Ticker symbol or ISIN
        - transaction_type: Type of transaction
        - quantity: Number of shares/units
        - price: Price per share in transaction currency
        - transaction_currency: Currency code (ISO 4217)

    OPTIONAL FIELDS (have sensible defaults):
        - All other fields have defaults that won't break tax calculations

    Design Pattern: Value Object with validation
    """

    # === CORE TRANSACTION DATA (REQUIRED) ===
    date: datetime
    symbol: str
    transaction_type: TransactionType
    quantity: Decimal
    price: Decimal
    transaction_currency: str

    # === IDENTIFICATION & METADATA ===
    name: str = ""
    isin: Optional[str] = None
    broker: str = "Unknown"
    account_id: Optional[str] = None
    transaction_id: Optional[str] = None
    asset_class: AssetClass = AssetClass.STOCK

    # === AMOUNTS IN TRANSACTION CURRENCY ===
    gross_amount: Optional[Decimal] = None
    net_amount: Optional[Decimal] = None

    # === FEES & TAXES (in transaction currency) ===
    commission: Decimal = Decimal('0')
    stamp_duty: Decimal = Decimal('0')
    withholding_tax: Decimal = Decimal('0')
    currency_conversion_fee: Decimal = Decimal('0')
    other_fees: Decimal = Decimal('0')

    # === MULTI-CURRENCY & FX DATA ===
    base_currency: str = "GBP"
    fx_rate_to_base: Optional[Decimal] = None
    fx_rate_source: Optional[str] = None
    fx_rate_date: Optional[datetime] = None

    # === AMOUNTS IN BASE CURRENCY (GBP for UK tax) ===
    gross_amount_base: Optional[Decimal] = None
    net_amount_base: Optional[Decimal] = None
    fees_base: Optional[Decimal] = None

    # === COST BASIS & REALIZED P/L (calculated by tax engine) ===
    cost_basis: Optional[Decimal] = None
    realized_pl: Optional[Decimal] = None
    fx_gain_loss: Optional[Decimal] = None

    # === ADDITIONAL METADATA ===
    notes: Optional[str] = None
    matching_rule: Optional[str] = None
    is_isa: bool = False
    is_sipp: bool = False

    # === VALIDATION & PROCESSING ===
    validation_errors: List[str] = field(default_factory=list)
    processing_warnings: List[str] = field(default_factory=list)

    # Valid currency codes (ISO 4217)
    VALID_CURRENCIES = {
        'GBP', 'USD', 'EUR', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
        'SEK', 'NOK', 'DKK', 'HKD', 'SGD', 'CNY', 'INR', 'BRL'
    }

    def __post_init__(self):
        """
        Calculate derived fields and set defaults.

        This method follows the Template Method pattern:
        1. Normalize currencies
        2. Set FX rate for same-currency transactions
        3. Calculate gross/net amounts
        4. Calculate base currency amounts
        5. Add warnings for missing data
        """
        self._normalize_currencies()
        self._set_default_fx_rate()
        self._calculate_amounts()
        self._calculate_base_amounts()
        self._check_for_warnings()

    def _normalize_currencies(self) -> None:
        """Ensure currency codes are uppercase."""
        self.transaction_currency = self.transaction_currency.upper()
        self.base_currency = self.base_currency.upper()

    def _set_default_fx_rate(self) -> None:
        """Set FX rate to 1.0 if same currency."""
        if self.transaction_currency == self.base_currency and self.fx_rate_to_base is None:
            self.fx_rate_to_base = Decimal('1.0')
            self.fx_rate_source = "Same Currency"

    def _calculate_amounts(self) -> None:
        """Calculate gross and net amounts in transaction currency."""
        # Calculate gross_amount if not provided
        if self.gross_amount is None:
            self.gross_amount = round_currency(abs(self.quantity) * self.price)

        # Calculate net_amount if not provided
        if self.net_amount is None:
            self.net_amount = round_currency(
                self.gross_amount - self.total_fees - self.withholding_tax
            )

    def _calculate_base_amounts(self) -> None:
        """Calculate amounts in base currency if FX rate is available."""
        if self.fx_rate_to_base is not None:
            if self.gross_amount_base is None:
                self.gross_amount_base = round_currency(
                    self.gross_amount * self.fx_rate_to_base
                )
            if self.net_amount_base is None:
                self.net_amount_base = round_currency(
                    self.net_amount * self.fx_rate_to_base
                )
            if self.fees_base is None:
                self.fees_base = round_currency(
                    self.total_fees * self.fx_rate_to_base
                )

    def _check_for_warnings(self) -> None:
        """Add warnings for missing critical data."""
        if self.transaction_currency != self.base_currency and self.fx_rate_to_base is None:
            self.processing_warnings.append(
                f"Missing FX rate for {self.transaction_currency} to {self.base_currency} "
                f"on {self.date.strftime('%Y-%m-%d')}"
            )

    @property
    def total_fees(self) -> Decimal:
        """
        Calculate total of all fees.

        Returns:
            Sum of all fee components
        """
        return round_currency(
            self.commission + self.stamp_duty +
            self.currency_conversion_fee + self.other_fees
        )

    def validate(self) -> bool:
        """
        Validate transaction data.

        Validates:
        - Required fields are present
        - Values are in valid ranges
        - Currency codes are valid
        - FX rates are provided for cross-currency transactions
        - Transaction type specific rules

        Returns:
            True if valid, False otherwise. Errors stored in validation_errors.
        """
        self.validation_errors = []

        self._validate_required_fields()
        self._validate_numeric_ranges()
        self._validate_currencies()
        self._validate_fx_rates()
        self._validate_transaction_type_rules()

        return len(self.validation_errors) == 0

    def _validate_required_fields(self) -> None:
        """Validate required fields are present."""
        if not self.symbol or self.symbol.strip() == "":
            self.validation_errors.append("Symbol is required")

        if not self.transaction_currency:
            self.validation_errors.append("Transaction currency is required")

    def _validate_numeric_ranges(self) -> None:
        """Validate numeric values are in valid ranges."""
        if self.quantity == 0:
            self.validation_errors.append("Quantity cannot be zero")

        if self.price < 0:
            self.validation_errors.append("Price cannot be negative")

        if self.date > datetime.now():
            self.validation_errors.append("Transaction date cannot be in the future")

    def _validate_currencies(self) -> None:
        """Validate currency codes."""
        if self.transaction_currency not in self.VALID_CURRENCIES:
            self.validation_errors.append(
                f"Invalid transaction currency: {self.transaction_currency}"
            )

        if self.base_currency not in self.VALID_CURRENCIES:
            self.validation_errors.append(
                f"Invalid base currency: {self.base_currency}"
            )

    def _validate_fx_rates(self) -> None:
        """Validate FX rates for cross-currency transactions."""
        if self.transaction_currency != self.base_currency:
            if self.fx_rate_to_base is None:
                self.validation_errors.append(
                    f"FX rate required for {self.transaction_currency} to {self.base_currency}"
                )
            elif self.fx_rate_to_base <= 0:
                self.validation_errors.append("FX rate must be positive")

    def _validate_transaction_type_rules(self) -> None:
        """Validate transaction type specific rules."""
        # Only BUY and SELL require non-zero price
        # DIVIDEND and INTEREST can have zero price (amount is in quantity)
        if self.transaction_type in [TransactionType.BUY, TransactionType.SELL]:
            if self.price == 0:
                self.validation_errors.append(
                    f"{self.transaction_type.value} transaction must have non-zero price"
                )

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to dictionary for JSON serialization.

        Returns:
            Dictionary representation of the transaction
        """
        return {
            'date': self.date.isoformat(),
            'symbol': self.symbol,
            'name': self.name,
            'isin': self.isin,
            'transaction_type': self.transaction_type.value,
            'asset_class': self.asset_class.value,
            'quantity': str(self.quantity),
            'price': str(self.price),
            'transaction_currency': self.transaction_currency,
            'gross_amount': str(self.gross_amount) if self.gross_amount else None,
            'net_amount': str(self.net_amount) if self.net_amount else None,
            'commission': str(self.commission),
            'stamp_duty': str(self.stamp_duty),
            'withholding_tax': str(self.withholding_tax),
            'currency_conversion_fee': str(self.currency_conversion_fee),
            'other_fees': str(self.other_fees),
            'total_fees': str(self.total_fees),
            'base_currency': self.base_currency,
            'fx_rate_to_base': str(self.fx_rate_to_base) if self.fx_rate_to_base else None,
            'fx_rate_source': self.fx_rate_source,
            'gross_amount_base': str(self.gross_amount_base) if self.gross_amount_base else None,
            'net_amount_base': str(self.net_amount_base) if self.net_amount_base else None,
            'fees_base': str(self.fees_base) if self.fees_base else None,
            'cost_basis': str(self.cost_basis) if self.cost_basis else None,
            'realized_pl': str(self.realized_pl) if self.realized_pl else None,
            'fx_gain_loss': str(self.fx_gain_loss) if self.fx_gain_loss else None,
            'broker': self.broker,
            'account_id': self.account_id,
            'transaction_id': self.transaction_id,
            'notes': self.notes,
            'matching_rule': self.matching_rule,
            'is_isa': self.is_isa,
            'is_sipp': self.is_sipp,
            'validation_errors': self.validation_errors,
            'processing_warnings': self.processing_warnings,
        }

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"StandardTransaction("
            f"date={self.date.strftime('%Y-%m-%d')}, "
            f"symbol={self.symbol}, "
            f"type={self.transaction_type.value}, "
            f"qty={self.quantity}, "
            f"price={self.price} {self.transaction_currency})"
        )
