# Multi-Broker CSV Support Implementation Plan

## Branch: `feature/multi-broker-csv-support`

## Overview
Implement support for multiple broker CSV formats by creating a standardized internal format and broker-specific converters, as outlined in `STANDARD_CSV_FORMAT.md`.

## Current State Analysis

### Existing Implementation
- **Current Parser**: `src/main/python/parsers/csv_parser.py`
  - Hardcoded for Interactive Brokers (Sharesight format)
  - Required columns: `Symbol`, `DateTime`, `Quantity`, `T. Price`, `Comm/Fee`, `Basis`, `Realized P/L`, `Code`
  - No abstraction for different broker formats

- **QFX Parser**: `src/main/python/parsers/qfx_parser.py`
  - Supports Interactive Brokers QFX format
  - Separate implementation path

### Target Brokers (Priority Order)
1. **Interactive Brokers** (already supported, needs refactoring)
2. **Trading 212** (UK popular platform)
3. **Hargreaves Lansdown** (UK major broker)
4. **Freetrade** (UK app-based broker)
5. **Fidelity** (international broker)

## Broker-Specific CSV Format Research

### Trading 212 (Researched 2024-11-24)

**Export Location**: Menu → History → Export → Select timeframe

**CSV Columns** (23 columns total):
```
Action, Time, ISIN, Ticker, Name, No. of shares, Price / share, 
Currency (Price / share), Exchange rate, Result, Currency (Result), 
Total, Currency (Total), Withholding tax, Currency (Withholding tax), 
Charge amount, Currency (Charge amount), Stamp duty reserve tax, 
Currency (Stamp duty reserve tax), Notes, ID, Currency conversion fee, 
Currency (Currency conversion fee)
```

**Mapping to StandardTransaction**:
| Trading 212 Column | StandardTransaction Field | Notes |
|--------------------|---------------------------|-------|
| `Time` | `date` | Parse datetime |
| `Ticker` | `symbol` | Primary identifier |
| `ISIN` | `isin` | Secondary identifier |
| `Name` | `name` | Full security name |
| `Action` | `transaction_type` | Map: "Market buy"→BUY, "Market sell"→SELL, "Dividend"→DIVIDEND |
| `No. of shares` | `quantity` | Positive for buys, negative for sells |
| `Price / share` | `price` | Price in transaction currency |
| `Currency (Price / share)` | `transaction_currency` | e.g., "USD", "GBP" |
| `Exchange rate` | `fx_rate_to_base` | **CRITICAL**: Broker-provided FX rate |
| `Total` | `gross_amount_base` | Total in base currency (EUR/GBP) |
| `Currency (Total)` | `base_currency` | User's account currency |
| `Charge amount` | `commission` | Broker fees |
| `Stamp duty reserve tax` | `stamp_duty` | UK stamp duty (0.5%) |
| `Withholding tax` | `withholding_tax` | Foreign dividend tax |
| `Currency conversion fee` | `currency_conversion_fee` | FX fee |
| `ID` | `transaction_id` | Unique transaction ID |
| `Notes` | `notes` | Free text |

**Special Handling**:
- Trading 212 provides FX rates! Use them as `fx_rate_source = "Broker"`
- Multiple currency columns - must map correctly
- Stamp duty auto-calculated for UK shares
- ISA accounts: Check account type separately (not in CSV)

**Limitations**:
- No cost basis provided (must calculate)
- No realized P/L (must calculate)
- Settlement date not provided (use trade date)

---

### Interactive Brokers Flex Query (Researched 2024-11-24)

**Export Location**: Reports → Flex Queries → Activity Flex Query → Trades section

**Recommended Flex Query Columns**:
```
Symbol, Description, ISIN, Asset Class, Trade Date, Settle Date, 
Quantity, Trade Price, Currency, Proceeds, Comm/Fee, Basis, 
Realized P/L, FX Rate To Base, Cost Basis, Code
```

**Mapping to StandardTransaction**:
| IBKR Column | StandardTransaction Field | Notes |
|-------------|---------------------------|-------|
| `Trade Date` | `date` | Use Settle Date if available |
| `Symbol` | `symbol` | Ticker |
| `ISIN` | `isin` | International ID |
| `Description` | `name` | Full name |
| `Asset Class` | `asset_class` | STK→STOCK, OPT→OPTION, etc. |
| `Quantity` | `quantity` | Positive=buy, negative=sell |
| `Trade Price` | `price` | Price per share |
| `Currency` | `transaction_currency` | Transaction currency |
| `Proceeds` | `gross_amount` | Gross amount in transaction currency |
| `Comm/Fee` | `commission` | Broker commission |
| `Basis` | `cost_basis` | **IBKR calculates this!** |
| `Realized P/L` | `realized_pl` | **IBKR calculates this!** |
| `FX Rate To Base` | `fx_rate_to_base` | **Broker-provided FX rate** |
| `Code` | `transaction_type` | Map: "O"→BUY, "C"→SELL, etc. |

**Code Mapping**:
- `O` = Opening trade (BUY)
- `C` = Closing trade (SELL)
- `A` = Assignment (options)
- `Ex` = Exercise (options)
- `Ep` = Expiration (options)

**Special Handling**:
- IBKR provides cost basis and realized P/L - **validate but don't override**
- FX rates provided - use as `fx_rate_source = "Broker"`
- Multiple asset classes supported
- Highly customizable - users must select correct columns

**Limitations**:
- Requires Flex Query setup (not simple CSV export)
- Column names vary based on query configuration
- Dividends in separate section (need to combine)

---

### Hargreaves Lansdown (Researched 2024-11-24)

**Export Location**: Tax Centre → Download transaction history (3-month blocks)

**CSV Columns** (Minimal - varies by export type):
```
Date, Transaction Type, Security, ISIN, Quantity, Price, Value, 
Account Type
```

**Mapping to StandardTransaction**:
| HL Column | StandardTransaction Field | Notes |
|-----------|---------------------------|-------|
| `Date` | `date` | Transaction date |
| `Security` | `name` | Full security name |
| `ISIN` | `isin` | Use for symbol lookup |
| `Transaction Type` | `transaction_type` | Map: "Purchase"→BUY, "Sale"→SELL |
| `Quantity` | `quantity` | Number of shares |
| `Price` | `price` | Price per share (in GBP) |
| `Value` | `gross_amount` | Total value (in GBP) |
| `Account Type` | `is_isa` / `is_sipp` | "ISA"→is_isa=True, "SIPP"→is_sipp=True |

**Special Handling**:
- **NO ticker symbols** - must derive from ISIN or name
- **NO commission breakdown** - must estimate or get from contract notes
- **NO FX rates** - all in GBP, must fetch HMRC rates for foreign securities
- **NO cost basis or P/L** - must calculate
- ISA/SIPP status provided - **important for tax exemptions**

**Limitations** (SEVERE):
- Missing critical data: commission, FX rates, ticker symbols
- Users must supplement with contract notes
- May need manual data entry for accurate calculations
- No separate stamp duty column (included in Value)

**Workarounds**:
1. Use ISIN to lookup ticker via API (e.g., OpenFIGI)
2. Estimate commission at 1% or £11.95 (HL standard rates)
3. Fetch HMRC FX rates for transaction dates
4. Parse contract notes for accurate commission

---

### Freetrade (Researched 2024-11-24)

**Export Location**: Portfolio → Activity → Export

**CSV Columns** (Estimated - similar to Trading 212):
```
Date, Type, Ticker, Name, Quantity, Price, Total, Currency, Fee
```

**Mapping to StandardTransaction**:
| Freetrade Column | StandardTransaction Field | Notes |
|------------------|---------------------------|-------|
| `Date` | `date` | Transaction date |
| `Ticker` | `symbol` | Ticker symbol |
| `Name` | `name` | Security name |
| `Type` | `transaction_type` | "BUY", "SELL", "DIVIDEND" |
| `Quantity` | `quantity` | Number of shares |
| `Price` | `price` | Price per share |
| `Total` | `gross_amount` | Total in transaction currency |
| `Currency` | `transaction_currency` | GBP or USD |
| `Fee` | `commission` | Trading fee (£0 for basic, £9.99/month for Plus) |

**Special Handling**:
- Mostly GBP transactions (UK focus)
- FX rates needed for US stocks
- ISA accounts common - check account type
- No stamp duty column (auto-calculate for UK shares)

**Limitations**:
- Limited international stocks
- No FX rates provided
- Basic fee structure (may be zero)

---

### Fidelity UK (Researched 2024-11-24)

**Export Location**: Portfolio → Transactions → Export to Excel

**CSV Columns**:
```
Trade Date, Settlement Date, Action, Symbol, Security Description, 
Quantity, Price, Amount, Commission, Fees, Settlement Currency
```

**Mapping to StandardTransaction**:
| Fidelity Column | StandardTransaction Field | Notes |
|-----------------|---------------------------|-------|
| `Settlement Date` | `date` | Prefer settlement over trade date |
| `Symbol` | `symbol` | Ticker |
| `Security Description` | `name` | Full name |
| `Action` | `transaction_type` | "YOU BOUGHT"→BUY, "YOU SOLD"→SELL |
| `Quantity` | `quantity` | Number of shares |
| `Price` | `price` | Price per share |
| `Amount` | `gross_amount` | Total amount |
| `Commission` | `commission` | Broker commission |
| `Fees` | `other_fees` | Other fees |
| `Settlement Currency` | `transaction_currency` | Currency code |

**Special Handling**:
- Both trade and settlement dates provided - use settlement
- Separate commission and fees columns
- Action text varies - need robust parsing
- No FX rates - must fetch

**Limitations**:
- No FX rates provided
- No cost basis or P/L
- Action text not standardized

---

## Broker Comparison Matrix

| Feature | Trading 212 | IBKR | Hargreaves | Freetrade | Fidelity |
|---------|-------------|------|------------|-----------|----------|
| **FX Rates Provided** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Cost Basis Provided** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Realized P/L Provided** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Ticker Symbol** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **ISIN** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Commission Breakdown** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **Stamp Duty Separate** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **ISA/SIPP Indicator** | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Multi-Currency** | ✅ Excellent | ✅ Excellent | ⚠️ Limited | ⚠️ Limited | ✅ Good |
| **Data Completeness** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

**Priority Order for Implementation**:
1. **Interactive Brokers** - Most complete data, already partially supported
2. **Trading 212** - Excellent multi-currency support, popular in UK
3. **Freetrade** - Growing UK user base, simpler format
4. **Fidelity** - International broker, good data quality
5. **Hargreaves Lansdown** - Requires most workarounds, but large UK user base

---

## Architecture Design

### 1. Standard Format Layer
```
src/main/python/models/standard_transaction.py
```
- Define `StandardTransaction` dataclass
- Validation methods
- Conversion utilities

### 2. Broker Converter Interface
```
src/main/python/interfaces/broker_converter.py
```
- Abstract base class for all broker converters
- Methods:
  - `convert_to_standard_format()`
  - `get_supported_formats()`
  - `validate_broker_file()`
  - `detect_broker_from_file()`

### 3. Broker-Specific Converters
```
src/main/python/converters/
├── __init__.py
├── ibkr_converter.py          # Interactive Brokers
├── trading212_converter.py    # Trading 212
├── hargreaves_converter.py    # Hargreaves Lansdown
├── freetrade_converter.py     # Freetrade
└── fidelity_converter.py      # Fidelity
```

### 4. Converter Factory
```
src/main/python/converters/converter_factory.py
```
- Auto-detect broker from CSV structure
- Route to appropriate converter
- Fallback to manual broker selection

### 5. Updated Main Parser
```
src/main/python/parsers/unified_csv_parser.py
```
- Accept standard format only
- Simplified logic
- Better error messages

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Create standard format and converter infrastructure

#### Tasks:
1. ✅ Create branch `feature/multi-broker-csv-support`
2. ✅ Define `StandardTransaction` model
3. ✅ Create `BrokerConverterInterface`
4. ✅ Implement `ConverterFactory` with auto-detection
5. ✅ Add comprehensive unit tests for standard format

**Deliverables**:
- `src/main/python/models/standard_transaction.py`
- `src/main/python/interfaces/broker_converter.py`
- `src/main/python/converters/converter_factory.py`
- Tests in `tests/unit/converters/`

### Phase 2: IBKR Refactoring (Week 1-2)
**Goal**: Refactor existing IBKR parser to use new architecture

#### Tasks:
1. ✅ Create `IBKRConverter` class
2. ✅ Map IBKR columns to standard format
3. ✅ Handle IBKR-specific quirks (splits, dividends, etc.)
4. ✅ Migrate existing tests
5. ✅ Ensure backward compatibility

**Deliverables**:
- `src/main/python/converters/ibkr_converter.py`
- Updated tests
- Migration guide for existing users

### Phase 3: Trading 212 Support (Week 2)
**Goal**: Add support for Trading 212 CSV exports

#### Tasks:
1. ✅ Research Trading 212 CSV format
2. ✅ Create sample data files
3. ✅ Implement `Trading212Converter`
4. ✅ Handle UK-specific tax scenarios
5. ✅ Add comprehensive tests

**CSV Format Analysis**:
```csv
Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Currency (Result),Total,Currency (Total),Withholding tax,Currency (Withholding tax),Charge amount,Currency (Charge amount),Stamp duty reserve tax,Currency (Stamp duty reserve tax),Notes,ID,Currency conversion fee,Currency (Currency conversion fee)
```

**Deliverables**:
- `src/main/python/converters/trading212_converter.py`
- Sample data in `tests/data/trading212/`
- Tests in `tests/unit/converters/test_trading212_converter.py`

### Phase 4: Hargreaves Lansdown Support (Week 3)
**Goal**: Add support for Hargreaves Lansdown

#### Tasks:
1. ✅ Research HL CSV format
2. ✅ Create sample data files
3. ✅ Implement `HargreavesConverter`
4. ✅ Handle HL-specific features (ISA accounts, etc.)
5. ✅ Add tests

**Deliverables**:
- `src/main/python/converters/hargreaves_converter.py`
- Sample data and tests

### Phase 5: Additional Brokers (Week 3-4)
**Goal**: Add Freetrade and Fidelity support

#### Tasks:
1. ✅ Implement `FreetradeConverter`
2. ✅ Implement `FidelityConverter`
3. ✅ Add comprehensive tests for both
4. ✅ Document CSV formats

**Deliverables**:
- Converters for both brokers
- Complete test coverage

### Phase 6: Frontend Integration (Week 4)
**Goal**: Update frontend to support broker selection

#### Tasks:
1. ✅ Add broker selection dropdown
2. ✅ Update file upload component
3. ✅ Add broker-specific help text
4. ✅ Improve error messages
5. ✅ Add CSV format examples

**Frontend Changes**:
- `frontend/src/components/calculator/steps/FileUploadStep.tsx`
- New component: `BrokerSelector.tsx`
- Updated validation messages

**Deliverables**:
- Updated upload UI
- Broker selection component
- Help documentation

### Phase 7: Testing & Documentation (Week 4-5)
**Goal**: Comprehensive testing and documentation

#### Tasks:
1. ✅ End-to-end tests for each broker
2. ⬜ Performance testing with large files
3. ⬜ Update user documentation
4. ⬜ Create broker-specific guides
5. ⬜ Add troubleshooting section

**Deliverables**:
- E2E tests in `tests/e2e/test_multi_broker.py`
- Updated `docs/BROKER_GUIDES.md`
- Performance benchmarks

## Technical Specifications

### Comprehensive Standard Transaction Format

Based on research of Trading 212, Interactive Brokers, and Hargreaves Lansdown formats, here's the comprehensive internal structure:

```python
from dataclasses import dataclass, field
from decimal import Decimal
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
    """Asset classification."""
    STOCK = "STOCK"
    ETF = "ETF"
    BOND = "BOND"
    OPTION = "OPTION"
    FUTURE = "FUTURE"
    FOREX = "FOREX"
    CRYPTO = "CRYPTO"
    FUND = "FUND"
    PROPERTY = "PROPERTY"  # For REITs, property funds

@dataclass
class StandardTransaction:
    """
    Comprehensive standardized transaction format for multi-currency accounts.
    
    This format is designed to capture ALL information needed for UK tax calculations
    including Section 104 pooling, capital gains, dividend tax, and FX gains/losses.
    
    REQUIRED FIELDS (must be provided or have sensible defaults):
    - date, symbol, transaction_type, quantity, price, transaction_currency
    
    OPTIONAL FIELDS (defaults specified):
    - All other fields have defaults that won't break tax calculations
    """
    
    # === CORE TRANSACTION DATA (REQUIRED) ===
    date: datetime
    """Transaction date (settlement date preferred, trade date if settlement unavailable)"""
    
    symbol: str
    """Ticker symbol or ISIN"""
    
    transaction_type: TransactionType
    """Type of transaction"""
    
    quantity: Decimal
    """Number of shares/units (positive for buys, negative for sells)"""
    
    price: Decimal
    """Price per share in transaction currency"""
    
    transaction_currency: str
    """Currency of the transaction (ISO 4217 code: USD, GBP, EUR, etc.)"""
    
    # === IDENTIFICATION & METADATA ===
    name: str = ""
    """Full security name (defaults to empty if not provided)"""
    
    isin: Optional[str] = None
    """International Securities Identification Number"""
    
    broker: str = "Unknown"
    """Broker/platform name"""
    
    account_id: Optional[str] = None
    """Account identifier (useful for multi-account tracking)"""
    
    transaction_id: Optional[str] = None
    """Unique transaction ID from broker"""
    
    asset_class: AssetClass = AssetClass.STOCK
    """Asset classification (defaults to STOCK)"""
    
    # === AMOUNTS IN TRANSACTION CURRENCY ===
    gross_amount: Optional[Decimal] = None
    """Gross transaction amount (quantity × price) in transaction currency.
    If not provided, calculated as: abs(quantity) * price"""
    
    net_amount: Optional[Decimal] = None
    """Net amount after all fees/taxes in transaction currency.
    If not provided, calculated as: gross_amount - fees - taxes"""
    
    # === FEES & TAXES (in transaction currency) ===
    commission: Decimal = Decimal('0')
    """Broker commission/fee"""
    
    stamp_duty: Decimal = Decimal('0')
    """UK Stamp Duty Reserve Tax (0.5% on UK shares)"""
    
    withholding_tax: Decimal = Decimal('0')
    """Foreign withholding tax on dividends"""
    
    currency_conversion_fee: Decimal = Decimal('0')
    """Fee for currency conversion (Trading 212, etc.)"""
    
    other_fees: Decimal = Decimal('0')
    """Any other fees not categorized above"""
    
    @property
    def total_fees(self) -> Decimal:
        """Total of all fees"""
        return (self.commission + self.stamp_duty + 
                self.currency_conversion_fee + self.other_fees)
    
    # === MULTI-CURRENCY & FX DATA ===
    base_currency: str = "GBP"
    """User's base currency for tax reporting (defaults to GBP for UK)"""
    
    fx_rate_to_base: Optional[Decimal] = None
    """Exchange rate from transaction currency to base currency.
    CRITICAL for tax calculations!
    - If transaction_currency == base_currency: defaults to 1.0
    - If different and not provided: MUST be fetched from historical rates
    - Format: 1 transaction_currency = X base_currency
    Example: USD transaction, GBP base, rate=0.79 means 1 USD = 0.79 GBP"""
    
    fx_rate_source: Optional[str] = None
    """Source of FX rate (e.g., 'HMRC', 'ECB', 'Broker', 'Manual')"""
    
    fx_rate_date: Optional[datetime] = None
    """Date of FX rate (usually same as transaction date)"""
    
    # === AMOUNTS IN BASE CURRENCY (GBP for UK tax) ===
    gross_amount_base: Optional[Decimal] = None
    """Gross amount in base currency.
    If not provided, calculated as: gross_amount * fx_rate_to_base"""
    
    net_amount_base: Optional[Decimal] = None
    """Net amount in base currency.
    If not provided, calculated as: net_amount * fx_rate_to_base"""
    
    fees_base: Optional[Decimal] = None
    """Total fees in base currency.
    If not provided, calculated as: total_fees * fx_rate_to_base"""
    
    # === COST BASIS & REALIZED P/L (for sales) ===
    cost_basis: Optional[Decimal] = None
    """Cost basis in base currency (for SELL transactions).
    This is calculated by the tax engine using Section 104 pooling.
    Should be None for BUY transactions."""
    
    realized_pl: Optional[Decimal] = None
    """Realized profit/loss in base currency (for SELL transactions).
    Calculated as: proceeds - cost_basis - fees
    Should be None for BUY transactions."""
    
    fx_gain_loss: Optional[Decimal] = None
    """FX gain/loss component (separate from capital gain).
    Calculated as: (proceeds_at_sale_fx - proceeds_at_purchase_fx)"""
    
    # === ADDITIONAL METADATA ===
    notes: Optional[str] = None
    """Free-text notes about the transaction"""
    
    matching_rule: Optional[str] = None
    """CGT matching rule applied: 'same_day', 'bed_and_breakfast', 'section_104'"""
    
    is_isa: bool = False
    """True if transaction is within an ISA (tax-free wrapper)"""
    
    is_sipp: bool = False
    """True if transaction is within a SIPP (pension)"""
    
    # === VALIDATION & PROCESSING ===
    validation_errors: List[str] = field(default_factory=list)
    """List of validation errors (populated during validation)"""
    
    processing_warnings: List[str] = field(default_factory=list)
    """List of processing warnings (e.g., missing FX rate)"""
    
    def __post_init__(self):
        """Calculate derived fields and set defaults."""
        # Ensure transaction_currency and base_currency are uppercase
        self.transaction_currency = self.transaction_currency.upper()
        self.base_currency = self.base_currency.upper()
        
        # Set FX rate to 1.0 if same currency
        if self.transaction_currency == self.base_currency and self.fx_rate_to_base is None:
            self.fx_rate_to_base = Decimal('1.0')
            self.fx_rate_source = "Same Currency"
        
        # Calculate gross_amount if not provided
        if self.gross_amount is None:
            self.gross_amount = abs(self.quantity) * self.price
        
        # Calculate net_amount if not provided
        if self.net_amount is None:
            self.net_amount = self.gross_amount - self.total_fees - self.withholding_tax
        
        # Calculate base currency amounts if FX rate is available
        if self.fx_rate_to_base is not None:
            if self.gross_amount_base is None:
                self.gross_amount_base = self.gross_amount * self.fx_rate_to_base
            if self.net_amount_base is None:
                self.net_amount_base = self.net_amount * self.fx_rate_to_base
            if self.fees_base is None:
                self.fees_base = self.total_fees * self.fx_rate_to_base
        else:
            # Add warning if FX rate is missing for cross-currency transaction
            if self.transaction_currency != self.base_currency:
                self.processing_warnings.append(
                    f"Missing FX rate for {self.transaction_currency} to {self.base_currency} "
                    f"on {self.date.strftime('%Y-%m-%d')}"
                )
    
    def validate(self) -> bool:
        """
        Validate transaction data.
        
        Returns:
            True if valid, False otherwise. Errors stored in validation_errors.
        """
        self.validation_errors = []
        
        # Required field validation
        if not self.symbol:
            self.validation_errors.append("Symbol is required")
        
        if self.quantity == 0:
            self.validation_errors.append("Quantity cannot be zero")
        
        if self.price < 0:
            self.validation_errors.append("Price cannot be negative")
        
        if not self.transaction_currency:
            self.validation_errors.append("Transaction currency is required")
        
        # Date validation
        if self.date > datetime.now():
            self.validation_errors.append("Transaction date cannot be in the future")
        
        # Currency code validation
        valid_currencies = ['GBP', 'USD', 'EUR', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK']
        if self.transaction_currency not in valid_currencies:
            self.validation_errors.append(f"Invalid transaction currency: {self.transaction_currency}")
        
        # FX rate validation for cross-currency
        if self.transaction_currency != self.base_currency:
            if self.fx_rate_to_base is None:
                self.validation_errors.append(
                    f"FX rate required for {self.transaction_currency} to {self.base_currency}"
                )
            elif self.fx_rate_to_base <= 0:
                self.validation_errors.append("FX rate must be positive")
        
        # Transaction type specific validation
        if self.transaction_type in [TransactionType.BUY, TransactionType.SELL]:
            if self.price == 0:
                self.validation_errors.append(f"{self.transaction_type.value} transaction must have non-zero price")
        
        return len(self.validation_errors) == 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
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
```

### Default Values & Missing Data Handling

**Critical for User Documentation:**

| Field | Default Value | Behavior if Missing |
|-------|---------------|---------------------|
| `name` | `""` (empty string) | Uses symbol for display |
| `isin` | `None` | Optional, not required for tax calc |
| `broker` | `"Unknown"` | Still processes, but warns user |
| `asset_class` | `AssetClass.STOCK` | Assumes equity, user should verify |
| `gross_amount` | Calculated: `abs(quantity) * price` | Auto-calculated from quantity × price |
| `net_amount` | Calculated: `gross_amount - fees - taxes` | Auto-calculated |
| `commission` | `Decimal('0')` | Assumes no commission (warns if suspicious) |
| `stamp_duty` | `Decimal('0')` | Auto-calculated for UK shares if missing |
| `withholding_tax` | `Decimal('0')` | Assumes no withholding |
| `currency_conversion_fee` | `Decimal('0')` | Assumes no FX fee |
| `other_fees` | `Decimal('0')` | Assumes no other fees |
| `fx_rate_to_base` | `1.0` if same currency, else **REQUIRED** | **CRITICAL**: Must fetch from HMRC rates if missing |
| `fx_rate_source` | `"Same Currency"` or `None` | Tracks where rate came from |
| `gross_amount_base` | Calculated: `gross_amount * fx_rate` | Auto-calculated if FX rate available |
| `net_amount_base` | Calculated: `net_amount * fx_rate` | Auto-calculated if FX rate available |
| `fees_base` | Calculated: `total_fees * fx_rate` | Auto-calculated if FX rate available |
| `cost_basis` | `None` (calculated by tax engine) | Calculated using Section 104 pooling |
| `realized_pl` | `None` (calculated by tax engine) | Calculated for SELL transactions |
| `fx_gain_loss` | `None` (calculated by tax engine) | Calculated separately from capital gain |
| `is_isa` | `False` | Assumes not in ISA wrapper |
| `is_sipp` | `False` | Assumes not in pension |

### FX Rate Handling Strategy

**This is CRITICAL for accurate tax calculations:**

1. **Same Currency**: If `transaction_currency == base_currency`, set `fx_rate_to_base = 1.0`

2. **Broker Provides Rate**: Use broker's rate if available and mark source as "Broker"

3. **HMRC Official Rates**: If missing, fetch from HMRC monthly average rates:
   - https://www.gov.uk/government/publications/hmrc-exchange-rates-for-2024-monthly
   - Use month-end rate or monthly average
   - Mark source as "HMRC"

4. **ECB Rates**: Fallback to European Central Bank rates if HMRC doesn't have the currency

5. **Manual Override**: Allow user to provide custom rates with source marked as "Manual"

**User Documentation Must State:**
> "For multi-currency transactions, if your broker's CSV doesn't include FX rates, we will automatically fetch HMRC official rates for the transaction date. You can override these with your own rates if you have more accurate data from your broker's contract notes."
```

### Converter Interface

```python
class BrokerConverterInterface(ABC):
    """Interface for all broker-specific converters."""
    
    @abstractmethod
    def convert_to_standard_format(
        self, 
        file_path: str
    ) -> List[StandardTransaction]:
        """Convert broker CSV to standard format."""
        pass
    
    @abstractmethod
    def get_supported_formats(self) -> List[str]:
        """Return supported file extensions."""
        pass
    
    @abstractmethod
    def validate_broker_file(self, file_path: str) -> bool:
        """Validate file is from this broker."""
        pass
    
    @abstractmethod
    def detect_broker(self, file_path: str) -> bool:
        """Auto-detect if file is from this broker."""
        pass
```

### Auto-Detection Strategy

1. **Header Analysis**: Check for broker-specific column names
2. **Pattern Matching**: Look for unique identifiers in data
3. **Confidence Scoring**: Rate likelihood for each broker
4. **Fallback**: Manual selection if confidence < 80%

## Testing Strategy

### Unit Tests
- Each converter: 100% coverage
- Standard format validation
- Edge cases (missing data, malformed files)
- Currency conversion accuracy

### Integration Tests
- Full pipeline: CSV → Standard → Tax Calculation
- Multiple brokers in same calculation
- Error handling and recovery

### E2E Tests
- Upload → Process → Results for each broker
- UI interaction testing
- Error message validation

### Performance Tests
- Large files (10,000+ transactions)
- Memory usage monitoring
- Processing time benchmarks

## Migration Strategy

### Backward Compatibility
1. Keep existing `csv_parser.py` as deprecated
2. Add deprecation warnings
3. Provide migration guide
4. Support both paths for 2 releases

### User Communication
1. Blog post announcing new features
2. Updated documentation
3. Video tutorials for each broker
4. Email to existing users

## Success Metrics

1. **Coverage**: Support for top 5 UK brokers
2. **Performance**: Process 10,000 transactions in < 5 seconds
3. **Accuracy**: 100% match with manual calculations
4. **Usability**: < 3 clicks to upload and process
5. **Error Rate**: < 1% failed uploads due to format issues

## Risk Mitigation

### Risks:
1. **Broker Format Changes**: Brokers update CSV formats
2. **Edge Cases**: Unusual transaction types
3. **Performance**: Large file processing
4. **Data Quality**: Incomplete or incorrect data

### Mitigations:
1. Version detection in converters
2. Comprehensive transaction type mapping
3. Streaming/chunked processing for large files
4. Robust validation with clear error messages

## Next Steps

1. Review and approve this plan
2. Create GitHub issues for each phase
3. Set up project board
4. Begin Phase 1 implementation
5. Schedule weekly progress reviews

## Questions for Discussion

1. Should we support Excel files (.xlsx) in addition to CSV?
2. Do we need to handle multi-currency portfolios differently?
3. Should we add a "test mode" for users to validate their CSV before full processing?
4. Do we want to support bulk uploads (multiple files at once)?

---

**Created**: 2025-11-24  
**Branch**: `feature/multi-broker-csv-support`  
**Status**: Planning Phase  
**Next Review**: After Phase 1 completion
