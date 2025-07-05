"""Domain models for the capital gains tax calculator."""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4


class TransactionType(Enum):
    """Types of stock transactions."""
    BUY = "BUY"
    SELL = "SELL"
    DIVIDEND = "DIV"
    CURRENCY_EXCHANGE = "FX"
    INTEREST = "INT"
    COMMISSION = "COMM"
    TAX_WITHHOLDING = "TAX"
    SPLIT = "SPLIT"
    MERGER = "MERGER"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    CASH_ADJUSTMENT = "CASH_ADJ"
    FEE = "FEE"


class AssetClass(Enum):
    """Types of asset classes for securities."""
    STOCK = "STK"
    ETF = "ETF"
    CLOSED_END_FUND = "CLOSED-END FUND"
    CASH = "CASH"
    BOND = "BOND"
    OPTION = "OPT"
    FUTURE = "FUT"


@dataclass
class Currency:
    """Represents a currency with rate handling and conversion utilities."""
    code: str
    rate_to_base: float  # Conversion rate to base currency (GBP)
    
    def __post_init__(self):
        """Validate currency data after initialization."""
        self._validate_currency()
    
    def _validate_currency(self) -> None:
        """Validate currency data."""
        if not self.code:
            raise ValueError("Currency code cannot be empty")
        
        if not isinstance(self.code, str):
            raise ValueError("Currency code must be a string")
        
        if self.rate_to_base <= 0:
            raise ValueError(f"Currency rate must be positive, got {self.rate_to_base}")
        
        if not isinstance(self.rate_to_base, (int, float)):
            raise ValueError("Currency rate must be a number")
    
    def __eq__(self, other) -> bool:
        """Check equality with another Currency."""
        if not isinstance(other, Currency):
            return False
        return self.code == other.code and self.rate_to_base == other.rate_to_base
    
    def __str__(self) -> str:
        """String representation of the currency."""
        return f"Currency(code='{self.code}', rate_to_base={self.rate_to_base})"
    
    def __repr__(self) -> str:
        """Detailed string representation of the currency."""
        return self.__str__()
    
    def convert_to_base(self, amount: float) -> float:
        """Convert an amount from this currency to base currency (GBP).
        
        Args:
            amount: Amount in this currency
            
        Returns:
            Amount in base currency (GBP)
        """
        return amount * self.rate_to_base
    
    def convert_from_base(self, amount: float) -> float:
        """Convert an amount from base currency (GBP) to this currency.
        
        Args:
            amount: Amount in base currency (GBP)
            
        Returns:
            Amount in this currency
        """
        return amount / self.rate_to_base
    
    def convert_to_currency(self, amount: float, target_currency: 'Currency') -> float:
        """Convert an amount from this currency to another currency via base currency.
        
        Args:
            amount: Amount in this currency
            target_currency: Target currency to convert to
            
        Returns:
            Amount in target currency
        """
        if not isinstance(target_currency, Currency):
            raise ValueError("Target currency must be a Currency instance")
        
        # Convert to base currency first, then to target currency
        base_amount = self.convert_to_base(amount)
        return target_currency.convert_from_base(base_amount)
    
    def is_base_currency(self) -> bool:
        """Check if this is the base currency (GBP)."""
        return self.code == "GBP" and self.rate_to_base == 1.0
    
    def get_display_name(self) -> str:
        """Get a display-friendly name for the currency."""
        if self.is_base_currency():
            return f"{self.code} (Base Currency)"
        else:
            return f"{self.code} (1 {self.code} = {self.rate_to_base:.4f} GBP)"
    
    @classmethod
    def create_base_currency(cls) -> 'Currency':
        """Create the base currency (GBP)."""
        return cls(code="GBP", rate_to_base=1.0)
    
    @classmethod
    def create_with_rate(cls, code: str, rate_to_gbp: float) -> 'Currency':
        """Create a currency with a specific rate to GBP.
        
        Args:
            code: Currency code (e.g., "USD", "EUR")
            rate_to_gbp: Exchange rate to GBP (1 unit of this currency = rate_to_gbp GBP)
            
        Returns:
            Currency instance
        """
        return cls(code=code.upper(), rate_to_base=rate_to_gbp)


@dataclass
class Security:
    """Represents a tradable security with ID type validation."""
    id: UUID = field(default_factory=uuid4)
    isin: str = ""  # International Securities Identification Number or other ID
    symbol: str = ""
    name: Optional[str] = None
    security_type: Optional[str] = None  # Type of identifier (ISIN, CUSIP, SEDOL, TICKER)
    asset_class: AssetClass = AssetClass.STOCK
    sub_category: Optional[str] = None  # COMMON, PREFERRED, etc.
    listing_exchange: Optional[str] = None  # LSE, NASDAQ, NYSE, etc.
    trading_exchange: Optional[str] = None  # Actual trading venue
    
    def __post_init__(self):
        """Validate security data after initialization."""
        if self.isin and self.security_type:
            self._validate_identifier()
    
    def _validate_identifier(self) -> None:
        """Validate the security identifier based on its type."""
        if not self.security_type:
            return
        
        if self.security_type == "ISIN":
            self._validate_isin()
        elif self.security_type == "CUSIP":
            self._validate_cusip()
        elif self.security_type == "SEDOL":
            self._validate_sedol()
        elif self.security_type == "TICKER":
            self._validate_ticker()
    
    def _validate_isin(self) -> None:
        """Validate ISIN format (12 characters, alphanumeric)."""
        if not self.isin:
            return
        
        # ISIN should be exactly 12 characters
        if len(self.isin) != 12:
            raise ValueError(f"ISIN must be 12 characters, got {len(self.isin)}: {self.isin}")
        
        # ISIN should be alphanumeric
        if not self.isin.isalnum():
            raise ValueError(f"ISIN must be alphanumeric: {self.isin}")
        
        # First 2 characters should be country code (letters)
        if not self.isin[:2].isalpha():
            raise ValueError(f"ISIN country code must be letters: {self.isin[:2]}")
    
    def _validate_cusip(self) -> None:
        """Validate CUSIP format (can be prefixed or standalone)."""
        if not self.isin:
            return
        
        # Extract CUSIP from prefixed format
        cusip = self.isin
        if cusip.startswith("CUSIP:"):
            cusip = cusip[6:]  # Remove "CUSIP:" prefix
        
        # CUSIP should be exactly 9 characters
        if len(cusip) != 9:
            raise ValueError(f"CUSIP must be 9 characters, got {len(cusip)}: {cusip}")
        
        # CUSIP should be alphanumeric
        if not cusip.isalnum():
            raise ValueError(f"CUSIP must be alphanumeric: {cusip}")
    
    def _validate_sedol(self) -> None:
        """Validate SEDOL format (can be prefixed or standalone)."""
        if not self.isin:
            return
        
        # Extract SEDOL from prefixed format
        sedol = self.isin
        if sedol.startswith("SEDOL:"):
            sedol = sedol[6:]  # Remove "SEDOL:" prefix
        
        # SEDOL should be exactly 7 characters
        if len(sedol) != 7:
            raise ValueError(f"SEDOL must be 7 characters, got {len(sedol)}: {sedol}")
        
        # SEDOL should be alphanumeric
        if not sedol.isalnum():
            raise ValueError(f"SEDOL must be alphanumeric: {sedol}")
    
    def _validate_ticker(self) -> None:
        """Validate ticker format (can be prefixed or standalone)."""
        if not self.isin:
            return
        
        # Extract ticker from prefixed format
        ticker = self.isin
        if ticker.startswith("TICKER:"):
            ticker = ticker[7:]  # Remove "TICKER:" prefix
        
        # Ticker should be 1-20 characters (allowing for longer symbols with exchange suffixes)
        if not (1 <= len(ticker) <= 20):
            raise ValueError(f"Ticker must be 1-20 characters, got {len(ticker)}: {ticker}")
        
        # Ticker should be alphanumeric (may include dots and hyphens for exchange suffixes)
        if not all(c.isalnum() or c in '.:-' for c in ticker):
            raise ValueError(f"Ticker contains invalid characters: {ticker}")
    
    @classmethod
    def create_with_isin(cls, isin: str, symbol: str = "", name: Optional[str] = None) -> 'Security':
        """Create a Security with ISIN identifier."""
        return cls(
            isin=isin,
            symbol=symbol,
            name=name,
            security_type="ISIN"
        )
    
    @classmethod
    def create_with_cusip(cls, cusip: str, symbol: str = "", name: Optional[str] = None) -> 'Security':
        """Create a Security with CUSIP identifier."""
        # Store CUSIP with prefix for consistency
        isin_value = f"CUSIP:{cusip}" if not cusip.startswith("CUSIP:") else cusip
        return cls(
            isin=isin_value,
            symbol=symbol,
            name=name,
            security_type="CUSIP"
        )
    
    @classmethod
    def create_with_sedol(cls, sedol: str, symbol: str = "", name: Optional[str] = None) -> 'Security':
        """Create a Security with SEDOL identifier."""
        # Store SEDOL with prefix for consistency
        isin_value = f"SEDOL:{sedol}" if not sedol.startswith("SEDOL:") else sedol
        return cls(
            isin=isin_value,
            symbol=symbol,
            name=name,
            security_type="SEDOL"
        )
    
    @classmethod
    def create_with_ticker(cls, ticker: str, symbol: str = "", name: Optional[str] = None) -> 'Security':
        """Create a Security with ticker identifier."""
        # Store ticker with prefix for consistency
        isin_value = f"TICKER:{ticker}" if not ticker.startswith("TICKER:") else ticker
        return cls(
            isin=isin_value,
            symbol=symbol,
            name=name,
            security_type="TICKER"
        )
    
    def get_identifier(self) -> str:
        """Get the clean identifier without prefix."""
        if not self.isin or not self.security_type:
            return self.isin
        
        if self.security_type == "ISIN":
            return self.isin
        elif self.security_type in ["CUSIP", "SEDOL", "TICKER"]:
            prefix = f"{self.security_type}:"
            if self.isin.startswith(prefix):
                return self.isin[len(prefix):]
            return self.isin
        
        return self.isin
    
    def is_valid_identifier(self) -> bool:
        """Check if the security has a valid identifier."""
        try:
            self._validate_identifier()
            return True
        except ValueError:
            return False
    
    def get_display_name(self) -> str:
        """Get a display-friendly name for the security."""
        if self.name:
            return f"{self.name} ({self.symbol or self.get_identifier()})"
        elif self.symbol:
            return f"{self.symbol} ({self.get_identifier()})"
        else:
            return self.get_identifier() or "Unknown Security"


@dataclass
class Transaction:
    """Represents a single transaction with comprehensive currency support."""
    id: UUID = field(default_factory=uuid4)
    transaction_id: str = ""  # Original transaction ID from broker
    transaction_type: TransactionType = TransactionType.BUY
    security: Security = None
    date: datetime = None
    quantity: float = 0.0  # Negative for sells
    price_per_unit: float = 0.0  # In transaction currency
    commission: float = 0.0  # In transaction currency
    taxes: float = 0.0  # In transaction currency
    currency: Currency = None
    
    def __post_init__(self):
        """Validate transaction data after initialization."""
        if self.currency is None:
            # Default to GBP if no currency specified
            self.currency = Currency(code="GBP", rate_to_base=1.0)
        
        self._validate_transaction()
    
    def _validate_transaction(self) -> None:
        """Validate transaction data."""
        if self.currency and self.currency.rate_to_base <= 0:
            raise ValueError(f"Currency rate must be positive, got {self.currency.rate_to_base}")
        
        if self.price_per_unit < 0:
            raise ValueError(f"Price per unit cannot be negative, got {self.price_per_unit}")
        
        if self.commission < 0:
            raise ValueError(f"Commission cannot be negative, got {self.commission}")
        
        if self.taxes < 0:
            raise ValueError(f"Taxes cannot be negative, got {self.taxes}")
    
    @property
    def total_cost(self) -> float:
        """Calculate the total cost of the transaction in transaction currency."""
        return abs(self.quantity) * self.price_per_unit + self.commission + self.taxes
    
    @property
    def total(self) -> float:
        """Alias for total_cost for backward compatibility."""
        return self.total_cost
    
    @property
    def total_cost_in_base_currency(self) -> float:
        """Calculate the total cost in base currency (GBP)."""
        if self.currency is None:
            raise ValueError("Currency is required for base currency conversion")
        return self.total_cost * self.currency.rate_to_base
    
    @property
    def net_amount(self) -> float:
        """Calculate net amount (proceeds for sells, cost for buys) in transaction currency."""
        if self.transaction_type == TransactionType.SELL:
            # For sells: proceeds = quantity * price - commission - taxes
            return abs(self.quantity) * self.price_per_unit - self.commission - self.taxes
        else:
            # For buys: cost = quantity * price + commission + taxes
            return self.total_cost
    
    @property
    def net_amount_in_base_currency(self) -> float:
        """Calculate net amount in base currency (GBP)."""
        if self.currency is None:
            raise ValueError("Currency is required for base currency conversion")
        return self.net_amount * self.currency.rate_to_base
    
    @property
    def commission_in_base_currency(self) -> float:
        """Get commission in base currency (GBP)."""
        if self.currency is None:
            raise ValueError("Currency is required for base currency conversion")
        return self.commission * self.currency.rate_to_base
    
    @property
    def taxes_in_base_currency(self) -> float:
        """Get taxes in base currency (GBP)."""
        if self.currency is None:
            raise ValueError("Currency is required for base currency conversion")
        return self.taxes * self.currency.rate_to_base
    
    @property
    def price_per_unit_in_base_currency(self) -> float:
        """Get price per unit in base currency (GBP)."""
        if self.currency is None:
            raise ValueError("Currency is required for base currency conversion")
        return self.price_per_unit * self.currency.rate_to_base
    
    def convert_to_currency(self, target_currency: Currency) -> 'Transaction':
        """Create a new Transaction converted to the target currency.
        
        Args:
            target_currency: Currency to convert to
            
        Returns:
            New Transaction object with values converted to target currency
        """
        if self.currency is None:
            raise ValueError("Source currency is required for conversion")
        
        if target_currency.rate_to_base <= 0:
            raise ValueError("Target currency rate must be positive")
        
        # Convert via base currency (GBP)
        # source_amount * source_rate = gbp_amount
        # gbp_amount / target_rate = target_amount
        conversion_factor = self.currency.rate_to_base / target_currency.rate_to_base
        
        return Transaction(
            transaction_id=self.transaction_id,
            transaction_type=self.transaction_type,
            security=self.security,
            date=self.date,
            quantity=self.quantity,
            price_per_unit=self.price_per_unit * conversion_factor,
            commission=self.commission * conversion_factor,
            taxes=self.taxes * conversion_factor,
            currency=target_currency
        )
    
    def is_same_currency(self, other_currency: Currency) -> bool:
        """Check if transaction is in the same currency as provided currency."""
        if self.currency is None:
            return False
        return self.currency.code == other_currency.code
    
    def get_currency_display(self) -> str:
        """Get a display string for the currency."""
        if self.currency is None:
            return "No Currency"
        return f"{self.currency.code} (rate: {self.currency.rate_to_base:.4f})"
    
    @classmethod
    def create_buy_transaction(
        cls,
        transaction_id: str,
        security: Security,
        date: datetime,
        quantity: float,
        price_per_unit: float,
        currency: Currency,
        commission: float = 0.0,
        taxes: float = 0.0
    ) -> 'Transaction':
        """Create a buy transaction with validation."""
        if quantity <= 0:
            raise ValueError("Buy transaction quantity must be positive")
        
        return cls(
            transaction_id=transaction_id,
            transaction_type=TransactionType.BUY,
            security=security,
            date=date,
            quantity=quantity,
            price_per_unit=price_per_unit,
            commission=commission,
            taxes=taxes,
            currency=currency
        )
    
    @classmethod
    def create_sell_transaction(
        cls,
        transaction_id: str,
        security: Security,
        date: datetime,
        quantity: float,
        price_per_unit: float,
        currency: Currency,
        commission: float = 0.0,
        taxes: float = 0.0
    ) -> 'Transaction':
        """Create a sell transaction with validation."""
        if quantity >= 0:
            raise ValueError("Sell transaction quantity must be negative")
        
        return cls(
            transaction_id=transaction_id,
            transaction_type=TransactionType.SELL,
            security=security,
            date=date,
            quantity=quantity,
            price_per_unit=price_per_unit,
            commission=commission,
            taxes=taxes,
            currency=currency
        )
    
    def get_transaction_summary(self) -> str:
        """Get a human-readable summary of the transaction."""
        action = "Bought" if self.transaction_type == TransactionType.BUY else "Sold"
        qty = abs(self.quantity)
        symbol = self.security.symbol if self.security else "Unknown"
        currency_code = self.currency.code if self.currency else "Unknown"
        
        return (f"{action} {qty} shares of {symbol} at "
                f"{self.price_per_unit:.2f} {currency_code} per share")


@dataclass
class SharePool:
    """Represents a pool of shares for a security."""
    security: Security
    quantity: float = 0.0
    cost_basis: float = 0.0  # In GBP
    
    @property
    def average_cost(self) -> float:
        """Calculate the average cost per share in the pool."""
        if self.quantity > 0:
            return self.cost_basis / self.quantity
        return 0.0
    
    def add_shares(self, transaction: Transaction) -> None:
        """Add shares to the pool from a buy transaction."""
        if transaction.transaction_type != TransactionType.BUY:
            raise ValueError("Can only add shares from a buy transaction")
        
        if transaction.quantity <= 0:
            raise ValueError("Buy transaction must have positive quantity")
        
        total_cost_base = transaction.total_cost_in_base_currency
        
        # Update the pool
        self.cost_basis = (self.cost_basis + total_cost_base)
        self.quantity = (self.quantity + transaction.quantity)
    
    def remove_shares(self, quantity: float) -> tuple[float, float]:
        """
        Remove shares from the pool.
        
        Returns:
            tuple[float, float]: (quantity removed, cost basis for those shares in GBP)
        """
        if quantity <= 0:
            raise ValueError("Quantity to remove must be positive")
        
        if quantity > self.quantity:
            raise ValueError("Cannot remove more shares than in the pool")
        
        # Calculate the cost basis for the shares being removed
        proportion = quantity / self.quantity
        cost_basis_removed = self.cost_basis * proportion
        
        # Update the pool
        self.quantity -= quantity
        self.cost_basis -= cost_basis_removed
        
        return quantity, cost_basis_removed


@dataclass
class Disposal:
    """Represents a disposal of shares for tax purposes."""
    id: UUID = field(default_factory=uuid4)
    security: Security = None
    sell_date: datetime = None
    quantity: float = 0.0
    proceeds: float = 0.0  # In GBP
    cost_basis: float = 0.0  # In GBP
    expenses: float = 0.0  # In GBP (commissions, fees)
    matching_rule: str = ""  # "same-day", "30-day", "section-104"
    
    @property
    def gain_or_loss(self) -> float:
        """Calculate the gain or loss on this disposal."""
        return self.proceeds - self.cost_basis - self.expenses


@dataclass
class TaxYearSummary:
    """Summary of capital gains for a tax year."""
    tax_year: str  # e.g. "2024-2025"
    disposals: List[Disposal] = None
    total_proceeds: float = 0.0  # In GBP
    total_gains: float = 0.0  # In GBP
    total_losses: float = 0.0  # In GBP
    net_gain: float = 0.0  # In GBP
    annual_exemption_used: float = 0.0  # In GBP
    taxable_gain: float = 0.0  # In GBP
    
    def __post_init__(self):
        if self.disposals is None:
            self.disposals = []
    
    def add_disposal(self, disposal: Disposal) -> None:
        """Add a disposal to the tax year summary."""
        self.disposals.append(disposal)
        self.total_proceeds += disposal.proceeds
        if disposal.gain_or_loss > 0:
            self.total_gains += disposal.gain_or_loss
        else:
            self.total_losses += abs(disposal.gain_or_loss)
        self.net_gain = self.total_gains - self.total_losses


@dataclass
class DividendIncome:
    """Represents dividend income for tax purposes."""
    id: UUID = field(default_factory=uuid4)
    security: Security = None
    payment_date: datetime = None
    record_date: Optional[datetime] = None
    amount_foreign_currency: float = 0.0
    foreign_currency: Currency = None
    amount_gbp: float = 0.0
    withholding_tax_foreign: float = 0.0
    withholding_tax_gbp: float = 0.0
    dividend_type: str = "ORDINARY"  # ORDINARY, SPECIAL, RETURN_OF_CAPITAL
    
    @property
    def net_dividend_gbp(self) -> float:
        """Net dividend after withholding tax in GBP."""
        return self.amount_gbp - self.withholding_tax_gbp
    
    @property
    def gross_dividend_gbp(self) -> float:
        """Gross dividend before withholding tax in GBP."""
        return self.amount_gbp

@dataclass
class DividendSummary:
    """Summary of dividend income for a tax year."""
    tax_year: str
    dividends: List[DividendIncome] = field(default_factory=list)
    total_gross_gbp: float = 0.0
    total_withholding_tax_gbp: float = 0.0
    total_net_gbp: float = 0.0
    
    def add_dividend(self, dividend: DividendIncome) -> None:
        """Add a dividend to the summary."""
        self.dividends.append(dividend)
        self.total_gross_gbp += dividend.gross_dividend_gbp
        self.total_withholding_tax_gbp += dividend.withholding_tax_gbp
        self.total_net_gbp += dividend.net_dividend_gbp
    
    @property
    def taxable_dividend_income(self) -> float:
        """Calculate taxable dividend income after allowance."""
        # UK dividend allowance for 2024-25
        DIVIDEND_ALLOWANCE = 500.0
        return max(0, self.total_net_gbp - DIVIDEND_ALLOWANCE)
    
    @property
    def dividend_allowance_used(self) -> float:
        """Calculate dividend allowance used."""
        DIVIDEND_ALLOWANCE = 500.0
        return min(self.total_net_gbp, DIVIDEND_ALLOWANCE)
    
    def get_foreign_dividends(self) -> List[DividendIncome]:
        """Get dividends from foreign securities."""
        return [
            d for d in self.dividends 
            if d.foreign_currency and not d.foreign_currency.is_base_currency()
        ]
    
    def get_dividends_by_security(self) -> Dict[str, List[DividendIncome]]:
        """Group dividends by security."""
        grouped = {}
        for dividend in self.dividends:
            symbol = dividend.security.symbol if dividend.security else "Unknown"
            if symbol not in grouped:
                grouped[symbol] = []
            grouped[symbol].append(dividend)
        return grouped


@dataclass
class CurrencyExchange:
    """Represents a currency exchange transaction."""
    id: UUID = field(default_factory=uuid4)
    transaction_date: datetime = None
    from_currency: Currency = None
    to_currency: Currency = None
    amount_from: float = 0.0
    amount_to: float = 0.0
    exchange_rate: float = 0.0
    gain_loss_gbp: float = 0.0
    
    @property
    def currency_pair(self) -> str:
        """Get currency pair string (e.g., 'EUR.GBP')."""
        if self.from_currency and self.to_currency:
            return f"{self.from_currency.code}.{self.to_currency.code}"
        return ""
    
    def __post_init__(self):
        """Validate currency exchange data after initialization."""
        self._validate_exchange()
    
    def _validate_exchange(self) -> None:
        """Validate currency exchange data."""
        if self.amount_from < 0:
            raise ValueError("From amount cannot be negative")
        
        if self.amount_to < 0:
            raise ValueError("To amount cannot be negative")
        
        if self.exchange_rate <= 0:
            raise ValueError("Exchange rate must be positive")
        
        if not self.from_currency or not self.to_currency:
            raise ValueError("Both currencies must be specified")


@dataclass
class CurrencyGainLoss:
    """Represents currency gain/loss for tax purposes."""
    id: UUID = field(default_factory=uuid4)
    currency_pair: str = ""
    transaction_date: datetime = None
    amount_gbp: float = 0.0
    gain_loss_gbp: float = 0.0
    exchange_rate_used: float = 0.0
    exchange_rate_original: float = 0.0
    disposal_method: str = "FIFO"  # FIFO, LIFO, etc.
    
    @property
    def is_gain(self) -> bool:
        """Check if this is a gain (positive) or loss (negative)."""
        return self.gain_loss_gbp > 0
    
    @property
    def is_loss(self) -> bool:
        """Check if this is a loss (negative)."""
        return self.gain_loss_gbp < 0
    
    def __post_init__(self):
        """Validate currency gain/loss data after initialization."""
        self._validate_gain_loss()
    
    def _validate_gain_loss(self) -> None:
        """Validate currency gain/loss data."""
        if self.amount_gbp < 0:
            raise ValueError("Amount in GBP cannot be negative")
        
        if self.exchange_rate_used <= 0:
            raise ValueError("Exchange rate used must be positive")
        
        if self.exchange_rate_original <= 0:
            raise ValueError("Original exchange rate must be positive")


@dataclass
class CurrencyGainLossSummary:
    """Summary of currency gains/losses for a tax year."""
    tax_year: str
    currency_transactions: List[CurrencyGainLoss] = field(default_factory=list)
    total_gains: float = 0.0
    total_losses: float = 0.0
    net_gain_loss: float = 0.0
    
    def add_currency_transaction(self, transaction: CurrencyGainLoss) -> None:
        """Add a currency transaction to the summary."""
        self.currency_transactions.append(transaction)
        if transaction.is_gain:
            self.total_gains += transaction.gain_loss_gbp
        else:
            self.total_losses += abs(transaction.gain_loss_gbp)
        self.net_gain_loss = self.total_gains - self.total_losses
    
    def get_transactions_by_currency_pair(self) -> Dict[str, List[CurrencyGainLoss]]:
        """Group transactions by currency pair."""
        grouped = {}
        for transaction in self.currency_transactions:
            pair = transaction.currency_pair
            if pair not in grouped:
                grouped[pair] = []
            grouped[pair].append(transaction)
        return grouped
    
    def get_gains_only(self) -> List[CurrencyGainLoss]:
        """Get only gain transactions."""
        return [t for t in self.currency_transactions if t.is_gain]
    
    def get_losses_only(self) -> List[CurrencyGainLoss]:
        """Get only loss transactions."""
        return [t for t in self.currency_transactions if t.is_loss]
    
    @property
    def number_of_transactions(self) -> int:
        """Total number of currency transactions."""
        return len(self.currency_transactions)
    
    @property
    def number_of_currency_pairs(self) -> int:
        """Number of different currency pairs."""
        return len(set(t.currency_pair for t in self.currency_transactions))
    
    @property
    def is_net_gain(self) -> bool:
        """Check if there's a net gain overall."""
        return self.net_gain_loss > 0
    
    @property
    def is_net_loss(self) -> bool:
        """Check if there's a net loss overall."""
        return self.net_gain_loss < 0


@dataclass
class CurrencyPool:
    """Represents a pool of currency holdings for FIFO matching."""
    currency_code: str
    entries: List[Dict[str, Any]] = field(default_factory=list)
    
    def add_purchase(self, amount: float, rate_to_gbp: float, date: datetime) -> None:
        """Add a currency purchase to the pool."""
        entry = {
            'amount': amount,
            'rate_to_gbp': rate_to_gbp,
            'date': date,
            'cost_gbp': amount * rate_to_gbp
        }
        self.entries.append(entry)
        
        # Sort by date to maintain FIFO order
        self.entries.sort(key=lambda x: x['date'])
    
    def remove_disposal(self, amount: float) -> List[Dict[str, Any]]:
        """Remove currency from pool using FIFO and return disposal details."""
        if amount <= 0:
            raise ValueError("Disposal amount must be positive")
        
        remaining_amount = amount
        disposals = []
        
        while remaining_amount > 0 and self.entries:
            entry = self.entries[0]
            
            if entry['amount'] <= remaining_amount:
                # Use entire entry
                disposals.append({
                    'amount': entry['amount'],
                    'rate_to_gbp': entry['rate_to_gbp'],
                    'date': entry['date'],
                    'cost_gbp': entry['cost_gbp']
                })
                remaining_amount -= entry['amount']
                self.entries.pop(0)
            else:
                # Use partial entry
                disposal_amount = remaining_amount
                disposal_cost = (disposal_amount / entry['amount']) * entry['cost_gbp']
                
                disposals.append({
                    'amount': disposal_amount,
                    'rate_to_gbp': entry['rate_to_gbp'],
                    'date': entry['date'],
                    'cost_gbp': disposal_cost
                })
                
                # Update remaining entry
                entry['amount'] -= disposal_amount
                entry['cost_gbp'] -= disposal_cost
                remaining_amount = 0
        
        if remaining_amount > 0:
            raise ValueError(f"Insufficient currency in pool. Tried to dispose {amount}, but only had {amount - remaining_amount}")
        
        return disposals
    
    @property
    def total_amount(self) -> float:
        """Total amount of currency in the pool."""
        return sum(entry['amount'] for entry in self.entries)
    
    @property
    def total_cost_gbp(self) -> float:
        """Total cost of currency in the pool (in GBP)."""
        return sum(entry['cost_gbp'] for entry in self.entries)
    
    @property
    def average_rate_to_gbp(self) -> float:
        """Average exchange rate to GBP."""
        if self.total_cost_gbp > 0:
            return self.total_amount / self.total_cost_gbp
        return 0.0


@dataclass
class ComprehensiveTaxSummary:
    """Comprehensive tax summary including all income types."""
    tax_year: str
    capital_gains: Optional[TaxYearSummary] = None
    dividend_income: Optional[DividendSummary] = None
    currency_gains: Optional[CurrencyGainLossSummary] = None
    total_allowable_costs: float = 0.0
    total_taxable_income: float = 0.0
    
    # Tax allowances used
    dividend_allowance_used: float = 0.0  # UK dividend allowance
    capital_gains_allowance_used: float = 0.0  # UK CGT allowance
    currency_gains_allowance_used: float = 0.0  # If applicable
    
    # Backward compatibility properties for direct access to capital gains data
    @property
    def disposals(self) -> List[Disposal]:
        """Get disposals from capital gains summary."""
        if self.capital_gains:
            return self.capital_gains.disposals
        return []
    
    @property
    def total_proceeds(self) -> float:
        """Get total proceeds from capital gains summary."""
        if self.capital_gains:
            return self.capital_gains.total_proceeds
        return 0.0
    
    @property
    def total_gains(self) -> float:
        """Get total gains from capital gains summary."""
        if self.capital_gains:
            return self.capital_gains.total_gains
        return 0.0
    
    @property
    def total_losses(self) -> float:
        """Get total losses from capital gains summary."""
        if self.capital_gains:
            return self.capital_gains.total_losses
        return 0.0
    
    @property
    def net_gain(self) -> float:
        """Get net gain from capital gains summary."""
        if self.capital_gains:
            return self.capital_gains.net_gain
        return 0.0
    
    @property
    def annual_exemption_used(self) -> float:
        """Get annual exemption used from capital gains summary."""
        if self.capital_gains:
            return self.capital_gains.annual_exemption_used
        return 0.0
    
    @property
    def taxable_gain(self) -> float:
        """Get taxable gain from capital gains summary."""
        if self.capital_gains:
            return self.capital_gains.taxable_gain
        return 0.0
    
    @property
    def total_tax_liability(self) -> float:
        """Calculate estimated total tax liability."""
        # This would include CGT, dividend tax, etc.
        # Implementation depends on current UK tax rates
        
        # Simplified calculation
        cgt_tax = (self.capital_gains.taxable_gain * 0.10) if self.capital_gains else 0.0
        dividend_tax = (self.dividend_income.taxable_dividend_income * 0.0875) if self.dividend_income else 0.0
        currency_tax = (max(0, self.currency_gains.net_gain_loss) * 0.10) if self.currency_gains else 0.0
        
        return cgt_tax + dividend_tax + currency_tax
    
    @property
    def summary_by_income_type(self) -> Dict[str, float]:
        """Get summary breakdown by income type."""
        return {
            'capital_gains': self.capital_gains.taxable_gain if self.capital_gains else 0.0,
            'dividend_income': self.dividend_income.total_net_gbp if self.dividend_income else 0.0,
            'currency_gains': max(0, self.currency_gains.net_gain_loss) if self.currency_gains else 0.0,
            'total_allowable_costs': self.total_allowable_costs
        }
    
    @property
    def has_taxable_income(self) -> bool:
        """Check if there's any taxable income."""
        return self.total_taxable_income > 0
    
    @property
    def requires_tax_return(self) -> bool:
        """Check if a tax return is likely required."""
        # Simplified logic - real implementation would consider various factors
        
        # CGT above allowance
        if self.capital_gains and self.capital_gains.taxable_gain > 0:
            return True
        
        # Dividend income above allowance
        if self.dividend_income and self.dividend_income.taxable_dividend_income > 0:
            return True
        
        # Currency gains above de minimis
        if self.currency_gains and self.currency_gains.net_gain_loss > 1000:  # £1,000 de minimis
            return True
        
        return False
    
    def get_allowances_summary(self) -> Dict[str, Dict[str, float]]:
        """Get summary of tax allowances used."""
        return {
            'capital_gains': {
                'allowance': 3000.0,  # 2024-25 rate
                'used': self.capital_gains_allowance_used,
                'remaining': max(0, 3000.0 - self.capital_gains_allowance_used)
            },
            'dividend': {
                'allowance': 500.0,  # 2024-25 rate
                'used': self.dividend_allowance_used,
                'remaining': max(0, 500.0 - self.dividend_allowance_used)
            }
        }
    
    def get_tax_efficiency_metrics(self) -> Dict[str, float]:
        """Calculate tax efficiency metrics."""
        total_income = (
            (self.capital_gains.total_gains if self.capital_gains else 0.0) +
            (self.dividend_income.total_gross_gbp if self.dividend_income else 0.0) +
            (self.currency_gains.total_gains if self.currency_gains else 0.0)
        )
        
        if total_income == 0:
            return {'effective_tax_rate': 0.0, 'allowance_utilization': 0.0, 'tax_saved_by_allowances': 0.0}
        
        effective_tax_rate = (self.total_tax_liability / total_income) * 100
        
        # Calculate allowance utilization
        total_allowances = 3000.0 + 500.0  # CGT + Dividend allowances
        allowances_used = self.capital_gains_allowance_used + self.dividend_allowance_used
        allowance_utilization = (allowances_used / total_allowances) * 100
        
        # Calculate tax saved by allowances
        cgt_tax_saved = self.capital_gains_allowance_used * 0.10
        dividend_tax_saved = self.dividend_allowance_used * 0.0875
        
        return {
            'effective_tax_rate': effective_tax_rate,
            'allowance_utilization': allowance_utilization,
            'tax_saved_by_allowances': cgt_tax_saved + dividend_tax_saved
        }
