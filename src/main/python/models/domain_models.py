"""Domain models for the capital gains tax calculator."""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict
from uuid import UUID, uuid4


class TransactionType(Enum):
    """Types of stock transactions."""
    BUY = "BUY"
    SELL = "SELL"
    DIVIDEND = "DIV"
    SPLIT = "SPLIT"
    MERGER = "MERGER"
    FEE = "FEE"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"


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
        
        # Ticker should be 1-10 characters (reasonable range)
        if not (1 <= len(ticker) <= 10):
            raise ValueError(f"Ticker must be 1-10 characters, got {len(ticker)}: {ticker}")
        
        # Ticker should be alphanumeric (may include dots for exchange suffixes)
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
